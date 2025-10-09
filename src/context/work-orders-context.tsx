

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser, SmtpConfig, NewOrderNotification, UpdateOrderNotification } from '@/lib/types';
import { useAuth } from './auth-context';
import { format } from 'date-fns';
import { CloseWorkOrderDialog } from '@/components/orders/close-work-order-dialog';
import { useToast } from '@/hooks/use-toast';
import { predefinedReportTemplates } from '@/lib/predefined-templates';
import { normalizeString, processFirestoreTimestamp } from '@/lib/utils';
import { collaborators as demoCollaborators } from '@/lib/placeholder-data';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { sendNewWorkOrderEmailAction, sendUpdatedWorkOrderEmailAction } from '@/app/actions';


interface WorkOrdersContextType {
  workOrders: WorkOrder[];
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  otCategories: OTCategory[];
  otStatuses: OTStatus[];
  services: Service[];
  collaborators: Collaborator[];
  vehicles: Vehicle[];
  ganttCharts: GanttChart[];
  suggestedTasks: SuggestedTask[];
  reportTemplates: ReportTemplate[];
  submittedReports: SubmittedReport[];
  companyInfo: CompanyInfo | null;
  smtpConfig: SmtpConfig | null;
  loading: boolean;
  addOrder: (order: Omit<WorkOrder, 'id'>, notification?: NewOrderNotification | null) => Promise<WorkOrder | undefined>;
  updateOrder: (id: string, updatedOrder: Partial<WorkOrder>, notification?: UpdateOrderNotification | null) => Promise<void>;
  getOrder: (id: string) => WorkOrder | undefined;
  addCategory: (category: Omit<OTCategory, 'id' | 'status'> & { status: string }) => Promise<OTCategory | undefined>;
  updateCategory: (id: string, category: Partial<OTCategory>) => Promise<void>;
  addStatus: (status: Omit<OTStatus, 'id'>) => Promise<OTStatus | undefined>;
  updateStatus: (id: string, status: Partial<OTStatus>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'status'> & { status: string }) => Promise<Service | undefined>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getNextOtNumber: (prefix: string) => string;
  getLastOtNumber: (prefix: string) => string | null;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<Collaborator | undefined>;
  getCollaborator: (id: string) => Collaborator | undefined;
  updateCollaborator: (id: string, collaborator: Partial<Omit<Collaborator, 'id'>>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | undefined>;
  updateVehicle: (id: string, vehicle: Partial<Omit<Vehicle, 'id'>>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addGanttChart: (ganttChart: Omit<GanttChart, 'id'>) => Promise<GanttChart | undefined>;
  getGanttChart: (id: string) => GanttChart | undefined;
  updateGanttChart: (id: string, ganttChart: Partial<Omit<GanttChart, 'id'>>) => Promise<void>;
  deleteGanttChart: (id: string) => Promise<void>;
  addSuggestedTask: (task: Omit<SuggestedTask, 'id'>) => Promise<SuggestedTask | undefined>;
  updateSuggestedTask: (id: string, task: Partial<SuggestedTask>) => Promise<void>;
  deleteSuggestedTask: (id: string) => Promise<void>;
  updatePhaseName: (category: string, oldPhaseName: string, newPhaseName: string) => Promise<void>;
  deletePhase: (category: string, phaseName: string) => Promise<void>;
  addReportTemplate: (template: Omit<ReportTemplate, 'id'>) => Promise<ReportTemplate | undefined>;
  updateReportTemplate: (id: string, template: Partial<ReportTemplate>) => Promise<void>;
  deleteReportTemplate: (id: string) => Promise<void>;
  addSubmittedReport: (report: Omit<SubmittedReport, 'id' | 'submittedAt'>) => Promise<SubmittedReport | undefined>;
  updateSubmittedReport: (id: string, report: Partial<SubmittedReport>) => Promise<void>;
  deleteSubmittedReport: (id: string) => Promise<void>;
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  updateSmtpConfig: (config: SmtpConfig) => Promise<void>;
  promptToCloseOrder: (order: WorkOrder) => void;
  convertActivityToWorkOrder: (activityId: string, newPrefix: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  deleteWorkOrders: () => Promise<void>;
  auditLog: any[];
  fetchData: () => Promise<void>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>([]);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>([]);
  const [otCategories, setOtCategories] = useState<OTCategory[]>([]);
  const [otStatuses, setOtStatuses] = useState<OTStatus[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ganttCharts, setGanttCharts] = useState<GanttChart[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [submittedReports, setSubmittedReports] = useState<SubmittedReport[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const [orderToClose, setOrderToClose] = useState<WorkOrder | null>(null);
  const { toast } = useToast();

  const checkAndCreatePredefinedTemplates = useCallback(async () => {
    try {
        const templatesCollection = collection(db, 'report-templates');
        const existingTemplatesSnapshot = await getDocs(templatesCollection);
        if (existingTemplatesSnapshot.empty) {
            const batch = writeBatch(db);
            predefinedReportTemplates.forEach(template => {
                const docRef = doc(collection(db, 'report-templates'));
                batch.set(docRef, template);
            });
            await batch.commit();
            console.log("Created predefined report templates.");
        }
    } catch(e) {
        console.error("Permission error checking templates, skipping creation.", e)
    }
  }, []);

  const checkAndRestoreCollaborators = useCallback(async () => {
    try {
      const collaboratorsCollection = collection(db, 'collaborators');
      const snapshot = await getDocs(collaboratorsCollection);
      if (snapshot.empty) {
        console.log('Collaborators collection is empty. Restoring from placeholder data.');
        const batch = writeBatch(db);
        demoCollaborators.forEach((collaborator) => {
          const docRef = doc(collection(db, 'collaborators'));
          batch.set(docRef, collaborator);
        });
        await batch.commit();
        toast({
          title: "Colaboradores Restaurados",
          description: "La lista de colaboradores ha sido restaurada con éxito.",
        });
      }
    } catch (e) {
      console.error("Error checking or restoring collaborators:", e);
    }
  }, [toast]);


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        await checkAndCreatePredefinedTemplates();
        await checkAndRestoreCollaborators();

        const collectionsToFetch: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
            { name: 'ot-categories', setter: setOtCategories },
            { name: 'ot-statuses', setter: setOtStatuses },
            { name: 'services', setter: setServices },
            { name: 'vehicles', setter: setVehicles },
            { name: 'suggested-tasks', setter: setSuggestedTasks },
            { name: 'report-templates', setter: setReportTemplates },
        ];

        const promises = collectionsToFetch.map(async ({ name, setter }) => {
          try {
            const snapshot = await getDocs(query(collection(db, name)));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(data.map(processFirestoreTimestamp));
          } catch (e) {
            console.error(`Error fetching collection ${name}:`, e);
          }
        });

        const singleDocsToFetch = [
            { path: 'settings/companyInfo', setter: setCompanyInfo },
            { path: 'settings/smtpConfig', setter: setSmtpConfig }
        ];

        singleDocsToFetch.forEach(({ path, setter }) => {
            promises.push(
                getDoc(doc(db, path)).then(doc => {
                    setter(doc.exists() ? doc.data() : null);
                }).catch(e => {
                   console.error(`Error fetching doc ${path}:`, e);
                })
            );
        });

        await Promise.all(promises);

    } catch (error) {
        console.error("Error fetching initial data: ", error);
        toast({ variant: "destructive", title: "Error de Carga", description: "No se pudieron cargar los datos iniciales." });
    } finally {
        setLoading(false);
    }
}, [user, toast, checkAndCreatePredefinedTemplates, checkAndRestoreCollaborators]);


 useEffect(() => {
    if (authLoading || !user) {
      setLoading(false); // Ensure loading is false if there's no user
      return;
    }

    // This now only runs when the user's authentication state changes.
    // It sets up all the real-time listeners.
    setLoading(true);
    fetchData(); // Fetch static data once on user login.

    const workOrdersQuery = query(collection(db, 'work-orders'), orderBy('date', 'desc'));
    const ganttQuery = query(collection(db, 'gantt-charts'));
    const submittedReportsQuery = query(collection(db, 'submitted-reports'), orderBy('submittedAt', 'desc'));
    const collaboratorsQuery = query(collection(db, 'collaborators'));
    const auditLogQuery = query(collection(db, 'audit-log'), orderBy('timestamp', 'desc'));

    const unsubscribes: Unsubscribe[] = [];

    unsubscribes.push(onSnapshot(workOrdersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as WorkOrder[];
        setWorkOrders(data);
    }, (error) => console.error("Error fetching work-orders:", error)));

    unsubscribes.push(onSnapshot(collaboratorsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as Collaborator[];
        setCollaborators(data);
    }, (error) => console.error("Error fetching collaborators:", error)));

    unsubscribes.push(onSnapshot(ganttQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as GanttChart[];
        setGanttCharts(data);
    }, (error) => console.error("Error fetching gantt-charts:", error)));

    unsubscribes.push(onSnapshot(submittedReportsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as SubmittedReport[];
        setSubmittedReports(data);
    }, (error) => console.error("Error fetching submitted-reports:", error)));

    if (userProfile?.role === 'Admin') {
        unsubscribes.push(onSnapshot(auditLogQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() }));
            setAuditLog(data);
        }, (error) => console.error("Error fetching audit-log:", error)));
    }
    
    // setLoading is handled by fetchData now.
    
    // Cleanup function runs when user logs out (user object changes)
    return () => {
        unsubscribes.forEach(unsub => unsub());
    };
}, [user, userProfile?.role, authLoading]); // Dependency array is now stable


  // Derived state for active/historical orders
  useEffect(() => {
    setActiveWorkOrders(workOrders.filter(o => normalizeString(o.status) !== 'cerrada'));
    setHistoricalWorkOrders(workOrders.filter(o => normalizeString(o.status) === 'cerrada'));
  }, [workOrders]);

  const addLogEntry = async (action: string) => {
    if (!userProfile) return;
    const logRef = collection(db, 'audit-log');
    addDoc(logRef, {
        user: userProfile.displayName,
        email: userProfile.email,
        action,
        timestamp: serverTimestamp()
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: logRef.path,
            operation: 'create',
            requestResourceData: { action },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
 const updateOrder = useCallback(async (id: string, updatedData: Partial<WorkOrder>, notification?: UpdateOrderNotification | null) => {
    const orderRef = doc(db, 'work-orders', id);
    const order = workOrders.find(o => o.id === id);
      
    await updateDoc(orderRef, updatedData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Rethrow to stop further execution
    });

    if (order) {
        await addLogEntry(`Actualizó la OT: ${order.ot_number}`);
    }

    if (notification?.send && smtpConfig) {
        const fullUpdatedOrder = { ...order, ...updatedData } as WorkOrder;
        const getEmail = (name: string) => collaborators.find(c => c.name === name)?.email;
        
        const toEmails: string[] = [];
        if (fullUpdatedOrder.comercial) {
            const comercialEmail = getEmail(fullUpdatedOrder.comercial);
            if (comercialEmail) toEmails.push(comercialEmail);
        }
        (fullUpdatedOrder.assigned || []).forEach(name => {
            const email = getEmail(name);
            if (email) toEmails.push(email);
        });
        if (userProfile?.email) toEmails.push(userProfile.email);

        const ccEmails = (notification.cc || [])
          .map(id => collaborators.find(c => c.id === id)?.email)
          .filter((email): email is string => !!email);

        if (toEmails.length > 0) {
            await sendUpdatedWorkOrderEmailAction(
                Array.from(new Set(toEmails)),
                Array.from(new Set(ccEmails)),
                fullUpdatedOrder,
                smtpConfig
            );
        }
    }
  }, [workOrders, smtpConfig, userProfile, collaborators]);

  const getNextOtNumber = useCallback((prefix: string): string => {
    if (!prefix) return '';

    const prefixedOrders = workOrders.filter(o =>
      o.ot_number && typeof o.ot_number === 'string' && o.ot_number.startsWith(prefix)
    );

    let numericOrders: WorkOrder[] = [];
    if (prefix === 'OT') {
      numericOrders = workOrders.filter(o =>
        o.ot_number && /^\d+$/.test(o.ot_number)
      );
    }

    const allRelevantOrders = [...prefixedOrders, ...numericOrders];

    if (allRelevantOrders.length === 0) return `${prefix}1`;

    const maxNumber = allRelevantOrders.reduce((max, o) => {
      const numberPart = o.ot_number.replace(prefix, '');
      const numericPart = parseInt(numberPart, 10);
      
      if (!isNaN(numericPart) && numericPart > max) {
        return numericPart;
      }
      return max;
    }, 0);
    
    return `${prefix}${maxNumber + 1}`;
  }, [workOrders]);


  const getLastOtNumber = useCallback((prefix: string): string | null => {
    if (!prefix) return null;
    
    const prefixedOrders = workOrders.filter(o =>
      o.ot_number && typeof o.ot_number === 'string' && o.ot_number.startsWith(prefix)
    );

    let numericOrders: WorkOrder[] = [];
    if (prefix === 'OT') {
      numericOrders = workOrders.filter(o =>
        o.ot_number && /^\d+$/.test(o.ot_number)
      );
    }
    
    const allRelevantOrders = [...prefixedOrders, ...numericOrders];

    if (allRelevantOrders.length === 0) return null;

    let maxNumber = -1;
    let lastOtNumber: string | null = null;

    allRelevantOrders.forEach(o => {
      const numberPart = o.ot_number.replace(prefix, '');
      const numericPart = parseInt(numberPart, 10);
      if (!isNaN(numericPart) && numericPart > maxNumber) {
        maxNumber = numericPart;
        lastOtNumber = o.ot_number;
      }
    });

    return lastOtNumber;
  }, [workOrders]);

  const addOrder = async (order: Omit<WorkOrder, 'id'>, notification?: NewOrderNotification | null): Promise<WorkOrder | undefined> => {
    const collRef = collection(db, "work-orders");
    try {
        const docRef = await addDoc(collRef, order);
        
        const createdOrder = { id: docRef.id, ...order } as WorkOrder;
        await addLogEntry(`Creó la OT: ${order.ot_number} - ${order.description}`);
        
        // Send email if requested
        if (notification?.send && smtpConfig) {
            
            const getEmail = (name: string) => collaborators.find(c => c.name === name)?.email;
            
            const toEmails: string[] = [];

            // 1. Comercial
            if (createdOrder.comercial) {
                const comercialEmail = getEmail(createdOrder.comercial);
                if (comercialEmail) toEmails.push(comercialEmail);
            }

            // 2. Encargados
            createdOrder.assigned.forEach(name => {
                const email = getEmail(name);
                if (email) toEmails.push(email);
            });

            // 3. Creator
            if (userProfile?.email) toEmails.push(userProfile.email);
            
            const ccEmails = (notification.cc || [])
                .map(id => collaborators.find(c => c.id === id)?.email)
                .filter((email): email is string => !!email);
                
            const uniqueToEmails = Array.from(new Set(toEmails));

            if (uniqueToEmails.length > 0) {
                await sendNewWorkOrderEmailAction(
                    uniqueToEmails,
                    Array.from(new Set(ccEmails)),
                    createdOrder,
                    smtpConfig
                );
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Advertencia de Envío',
                    description: 'OT creada, pero no se pudo enviar el correo. Ninguno de los destinatarios automáticos (comercial, encargado, creador) tiene un email configurado.'
                });
            }
        }
        return createdOrder;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: order,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };
  
  const getOrder = (id: string) => {
    return workOrders.find(order => order.id === id);
  };

  const deleteOrder = async (id: string) => {
    const order = getOrder(id);
    const docRef = doc(db, 'work-orders', id);
    deleteDoc(docRef).then(() => {
        if (order) addLogEntry(`Eliminó la OT: ${order.ot_number}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const promptToCloseOrder = (order: WorkOrder) => {
    setOrderToClose(order);
  };

  const handleConfirmClose = async (order: WorkOrder, closingDate: Date) => {
    const dataToUpdate = {
        status: 'Cerrada' as WorkOrder['status'],
        endDate: format(closingDate, 'yyyy-MM-dd'),
    };
    updateOrder(order.id, dataToUpdate).then(() => {
        addLogEntry(`Cerró la OT: ${order.ot_number}`);
        setOrderToClose(null);
    }).catch(() => {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la OT.' });
    });
  };
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory | undefined> => {
    const collRef = collection(db, "ot-categories");
    try {
        const docRef = await addDoc(collRef, category);
        await addLogEntry(`Creó la categoría de OT: ${category.name}`);
        return { id: docRef.id, ...category } as OTCategory;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: category,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    const docRef = doc(db, "ot-categories", id);
    updateDoc(docRef, updatedCategory).then(() => {
        addLogEntry(`Actualizó la categoría de OT: ${updatedCategory.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedCategory
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus | undefined> => {
    const collRef = collection(db, "ot-statuses");
    try {
        const docRef = await addDoc(collRef, status);
        await addLogEntry(`Creó el estado de OT: ${status.name}`);
        return { id: docRef.id, ...status } as OTStatus;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: status,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    const docRef = doc(db, "ot-statuses", id);
    updateDoc(docRef, updatedStatus).then(() => {
        addLogEntry(`Actualizó el estado de OT: ${updatedStatus.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedStatus
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteStatus = async (id: string) => {
    const status = otStatuses.find(s => s.id === id);
    const docRef = doc(db, "ot-statuses", id);
    deleteDoc(docRef).then(() => {
        if (status) addLogEntry(`Eliminó el estado de OT: ${status.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service | undefined> => {
    const collRef = collection(db, "services");
    try {
        const docRef = await addDoc(collRef, service);
        await addLogEntry(`Creó el servicio: ${service.name}`);
        return { id: docRef.id, ...service } as Service;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: service,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const docRef = doc(db, "services", id);
    updateDoc(docRef, updatedService).then(() => {
        addLogEntry(`Actualizó el servicio: ${updatedService.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedService
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const deleteService = async (id: string) => {
    const service = services.find(s => s.id === id);
    const docRef = doc(db, "services", id);
    deleteDoc(docRef).then(() => {
        if (service) addLogEntry(`Eliminó el servicio: ${service.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator | undefined> => {
    const collRef = collection(db, "collaborators");
    try {
        const docRef = await addDoc(collRef, collaborator);
        await addLogEntry(`Creó al colaborador: ${collaborator.name}`);
        return { ...collaborator, id: docRef.id } as Collaborator;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: collaborator,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };
  
  const getCollaborator = (id: string) => {
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const updateCollaborator = async (id: string, updatedCollaborator: Partial<Omit<Collaborator, 'id'>>) => {
    const docRef = doc(db, "collaborators", id);
    updateDoc(docRef, updatedCollaborator).then(() => {
        addLogEntry(`Actualizó al colaborador: ${updatedCollaborator.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedCollaborator
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteCollaborator = async (id: string) => {
    const collaborator = getCollaborator(id);
    const docRef = doc(db, "collaborators", id);
    deleteDoc(docRef).then(() => {
        if (collaborator) addLogEntry(`Eliminó al colaborador: ${collaborator.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | undefined> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    const collRef = collection(db, "vehicles");
    try {
        const docRef = await addDoc(collRef, vehicleData);
        await addLogEntry(`Añadió el vehículo: ${vehicle.model} (${vehicle.plate})`);
        return { ...vehicleData, id: docRef.id } as Vehicle;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: vehicleData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    const docRef = doc(db, "vehicles", id);
    updateDoc(docRef, updatedVehicle).then(() => {
        addLogEntry(`Actualizó el vehículo: ${updatedVehicle.model} (${updatedVehicle.plate})`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedVehicle
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    const docRef = doc(db, "vehicles", id);
    deleteDoc(docRef).then(() => {
        if (vehicle) addLogEntry(`Eliminó el vehículo: ${vehicle.model} (${vehicle.plate})`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addGanttChart = async (ganttChart: Omit<GanttChart, 'id'>): Promise<GanttChart | undefined> => {
      const dataToSave = {
          ...ganttChart,
          assignedOT: ganttChart.assignedOT === 'none' ? '' : ganttChart.assignedOT || '',
          tasks: ganttChart.tasks.map(task => ({
              ...task,
              startDate: Timestamp.fromDate(new Date(task.startDate)),
          }))
      };
      const collRef = collection(db, "gantt-charts");
      try {
        const docRef = await addDoc(collRef, dataToSave);
        await addLogEntry(`Creó la Carta Gantt: ${ganttChart.name}`);
        return { ...ganttChart, id: docRef.id };
      } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      }
  };
  
  const getGanttChart = (id: string) => {
    return ganttCharts.find(chart => chart.id === id);
  };

  const updateGanttChart = async (id: string, ganttChartData: Partial<Omit<GanttChart, 'id'>>) => {
      const docRef = doc(db, "gantt-charts", id);
      
      const dataToSave: { [key: string]: any } = { ...ganttChartData };

      if (ganttChartData.tasks) {
          dataToSave.tasks = ganttChartData.tasks.map(task => {
              const { ...restOfTask } = task;
              if (!(restOfTask.startDate instanceof Timestamp)) {
                  restOfTask.startDate = Timestamp.fromDate(new Date(restOfTask.startDate));
              }
              return restOfTask;
          });
      }

      if (ganttChartData.assignedOT === 'none') {
          dataToSave.assignedOT = '';
      }
      updateDoc(docRef, dataToSave).then(() => {
        addLogEntry(`Actualizó la Carta Gantt: ${ganttChartData.name}`);
      }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToSave
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const deleteGanttChart = async (id: string) => {
    const chart = getGanttChart(id);
    const docRef = doc(db, "gantt-charts", id);
    deleteDoc(docRef).then(() => {
        if (chart) addLogEntry(`Eliminó la Carta Gantt: ${chart.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask | undefined> => {
    const collRef = collection(db, "suggested-tasks");
    try {
        const docRef = await addDoc(collRef, task);
        await addLogEntry(`Añadió tarea sugerida: ${task.name}`);
        return { id: docRef.id, ...task } as SuggestedTask;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: task,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    updateDoc(docRef, updatedTask).then(() => {
        addLogEntry(`Actualizó tarea sugerida: ${updatedTask.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedTask,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteSuggestedTask = async (id: string) => {
    const task = suggestedTasks.find(t => t.id === id);
    const docRef = doc(db, "suggested-tasks", id);
    deleteDoc(docRef).then(() => {
        if (task) addLogEntry(`Eliminó tarea sugerida: ${task.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const updatePhaseName = async (category: string, oldPhaseName: string, newPhaseName: string) => {
    const q = query(collection(db, 'suggested-tasks'), where('category', '==', category), where('phase', '==', oldPhaseName));
    try {
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => {
            batch.update(doc.ref, { phase: newPhaseName });
        });
        await batch.commit();
        await addLogEntry(`Renombró la fase '${oldPhaseName}' a '${newPhaseName}' en la categoría '${category}'`);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: 'suggested-tasks', // This is an approximation
            operation: 'update',
            requestResourceData: { category, oldPhaseName, newPhaseName },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  };

  const deletePhase = async (category: string, phaseName: string) => {
    const q = query(collection(db, 'suggested-tasks'), where('category', '==', category), where('phase', '==', phaseName));
    try {
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => {
        batch.delete(doc.ref);
        });
        await batch.commit();
        await addLogEntry(`Eliminó la fase '${phaseName}' en la categoría '${category}'`);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: 'suggested-tasks',
            operation: 'delete',
            requestResourceData: { category, phase: phaseName },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate | undefined> => {
    const collRef = collection(db, "report-templates");
    try {
        const docRef = await addDoc(collRef, template);
        await addLogEntry(`Creó la plantilla de informe: ${template.name}`);
        return { id: docRef.id, ...template } as ReportTemplate;
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: template,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    const docRef = doc(db, "report-templates", id);
    updateDoc(docRef, updatedTemplate).then(() => {
        addLogEntry(`Actualizó la plantilla de informe: ${updatedTemplate.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updatedTemplate
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };


  const deleteReportTemplate = async (id: string) => {
    const template = reportTemplates.find(t => t.id === id);
    const docRef = doc(db, "report-templates", id);
    deleteDoc(docRef).then(() => {
        if (template) addLogEntry(`Eliminó la plantilla de informe: ${template.name}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport | undefined> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    const collRef = collection(db, "submitted-reports");
    try {
        const docRef = await addDoc(collRef, reportData);
        await addLogEntry(`Envió el informe '${report.templateName}' para la OT ${report.otDetails.ot_number}`);
        return { ...report, id: docRef.id, submittedAt: Timestamp.now() } as SubmittedReport; 
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: reportData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const updateSubmittedReport = async (id: string, report: Partial<SubmittedReport>) => {
    const originalReport = submittedReports.find(r => r.id === id);
    const docRef = doc(db, "submitted-reports", id);
    updateDoc(docRef, report).then(() => {
        if(originalReport) addLogEntry(`Actualizó el informe para la OT ${originalReport.otDetails.ot_number}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: report
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const deleteSubmittedReport = async (id: string) => {
    const report = submittedReports.find(r => r.id === id);
    const docRef = doc(db, "submitted-reports", id);
    deleteDoc(docRef).then(() => {
        if(report) addLogEntry(`Eliminó el informe para la OT ${report.otDetails.ot_number}`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    setDoc(docRef, info, { merge: true }).then(() => {
        addLogEntry(`Actualizó la información de la empresa.`);
        fetchData(); // Re-fetch all data to reflect changes
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: info
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateSmtpConfig = async (config: SmtpConfig) => {
    const docRef = doc(db, 'settings', 'smtpConfig');
    setDoc(docRef, config, { merge: true }).then(() => {
        addLogEntry(`Actualizó la configuración SMTP.`);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: config
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const convertActivityToWorkOrder = async (activityId: string, newPrefix: string) => {
    const activity = workOrders.find(o => o.id === activityId);
    if (!activity || !activity.isActivity) {
        toast({ variant: "destructive", title: "Error", description: "No se puede convertir este item." });
        return;
    }
    
    const newOtNumber = getNextOtNumber(newPrefix);

    const updatedData: Partial<WorkOrder> = {
        isActivity: false,
        ot_number: newOtNumber,
        status: 'Por Iniciar',
    };

    try {
        await updateOrder(activityId, updatedData);
        toast({ title: "Actividad Convertida", description: `La actividad ahora es la OT ${newOtNumber}.` });
        await addLogEntry(`Convirtió la actividad '${activity.description}' a la OT ${newOtNumber}`);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo convertir la actividad.' });
    }
  };

  const deleteWorkOrders = async () => {
    const collectionRef = collection(db, 'work-orders');
    try {
        const snapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        await addLogEntry('Eliminó todas las órdenes de trabajo.');
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  };

  const deleteAllData = async () => {
    const collectionsToDelete = [
      'work-orders',
      'vehicles',
      'gantt-charts',
      'submitted-reports',
      // 'collaborators' is intentionally left out to prevent accidental deletion
    ];
  
    const batchPromises = collectionsToDelete.map(async (collectionName) => {
      const collectionRef = collection(db, collectionName);
      try {
        const snapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: collectionName,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      }
    });
  
    return Promise.all(batchPromises).then(async () => {
        await addLogEntry('Eliminó todos los datos (excepto colaboradores).');
    });
  };

  return (
    <WorkOrdersContext.Provider value={{ 
        workOrders, 
        activeWorkOrders,
        historicalWorkOrders,
        otCategories,
        otStatuses,
        services,
        collaborators,
        vehicles,
        ganttCharts,
        suggestedTasks,
        reportTemplates,
        submittedReports,
        companyInfo,
        smtpConfig,
        loading,
        updateOrder,
        deleteOrder, 
        getOrder, 
        addCategory,
        updateCategory,
        addStatus,
        updateStatus,
        deleteStatus,
        addService,
        updateService,
        deleteService,
        addOrder,
        getNextOtNumber,
        getLastOtNumber,
        addCollaborator,
        getCollaborator,
        updateCollaborator,
        deleteCollaborator,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addGanttChart,
        getGanttChart,
        updateGanttChart,
        deleteGanttChart,
        addSuggestedTask,
        updateSuggestedTask,
        deleteSuggestedTask,
        updatePhaseName,
        deletePhase,
        addReportTemplate,
        updateReportTemplate,
        deleteReportTemplate,
        addSubmittedReport,
        updateSubmittedReport,
        deleteSubmittedReport,
        updateCompanyInfo,
        updateSmtpConfig,
        promptToCloseOrder,
        convertActivityToWorkOrder,
        deleteAllData,
        deleteWorkOrders,
        auditLog,
        fetchData,
    }}>
      {children}
      <CloseWorkOrderDialog 
        order={orderToClose}
        onClose={() => setOrderToClose(null)}
        onConfirm={handleConfirmClose}
      />
    </WorkOrdersContext.Provider>
  );
};

export const useWorkOrders = () => {
  const context = useContext(WorkOrdersContext);
  if (context === undefined) {
    throw new Error('useWorkOrders must be used within a WorkOrdersProvider');
  }
  return context;
};

