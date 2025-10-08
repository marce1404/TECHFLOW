

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser, SmtpConfig } from '@/lib/types';
import { useAuth } from './auth-context';
import { format } from 'date-fns';
import { CloseWorkOrderDialog } from '@/components/orders/close-work-order-dialog';
import { useToast } from '@/hooks/use-toast';
import { predefinedReportTemplates } from '@/lib/predefined-templates';
import { normalizeString, processFirestoreTimestamp } from '@/lib/utils';

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
  addOrder: (order: Omit<WorkOrder, 'id'>) => Promise<WorkOrder>;
  updateOrder: (id: string, updatedOrder: Partial<WorkOrder>) => Promise<void>;
  getOrder: (id: string) => WorkOrder | undefined;
  addCategory: (category: Omit<OTCategory, 'id' | 'status'> & { status: string }) => Promise<OTCategory>;
  updateCategory: (id: string, category: Partial<OTCategory>) => Promise<void>;
  addStatus: (status: Omit<OTStatus, 'id'>) => Promise<OTStatus>;
  updateStatus: (id: string, status: Partial<OTStatus>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'status'> & { status: string }) => Promise<Service>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getNextOtNumber: (prefix: string) => string;
  getLastOtNumber: (prefix: string) => string | null;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<Collaborator>;
  getCollaborator: (id: string) => Collaborator | undefined;
  updateCollaborator: (id: string, collaborator: Partial<Omit<Collaborator, 'id'>>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (id: string, vehicle: Partial<Omit<Vehicle, 'id'>>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addGanttChart: (ganttChart: Omit<GanttChart, 'id'>) => Promise<GanttChart>;
  getGanttChart: (id: string) => GanttChart | undefined;
  updateGanttChart: (id: string, ganttChart: Partial<Omit<GanttChart, 'id'>>) => Promise<void>;
  deleteGanttChart: (id: string) => Promise<void>;
  addSuggestedTask: (task: Omit<SuggestedTask, 'id'>) => Promise<SuggestedTask>;
  updateSuggestedTask: (id: string, task: Partial<SuggestedTask>) => Promise<void>;
  deleteSuggestedTask: (id: string) => Promise<void>;
  updatePhaseName: (category: string, oldPhaseName: string, newPhaseName: string) => Promise<void>;
  deletePhase: (category: string, phaseName: string) => Promise<void>;
  addReportTemplate: (template: Omit<ReportTemplate, 'id'>) => Promise<ReportTemplate>;
  updateReportTemplate: (id: string, template: Partial<ReportTemplate>) => Promise<void>;
  deleteReportTemplate: (id: string) => Promise<void>;
  addSubmittedReport: (report: Omit<SubmittedReport, 'id' | 'submittedAt'>) => Promise<SubmittedReport>;
  updateSubmittedReport: (id: string, report: Partial<SubmittedReport>) => Promise<void>;
  deleteSubmittedReport: (id: string) => Promise<void>;
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  updateSmtpConfig: (config: SmtpConfig) => Promise<void>;
  promptToCloseOrder: (order: WorkOrder) => void;
  convertActivityToWorkOrder: (activityId: string, newPrefix: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
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

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        await checkAndCreatePredefinedTemplates();

        const collectionsToFetch: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
            { name: 'ot-categories', setter: setOtCategories },
            { name: 'ot-statuses', setter: setOtStatuses },
            { name: 'services', setter: setServices },
            { name: 'collaborators', setter: setCollaborators },
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
            // We don't re-throw, so other fetches can continue
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
}, [user, toast, checkAndCreatePredefinedTemplates]);


  useEffect(() => {
      if (user) {
          fetchData();

          const workOrdersQuery = query(collection(db, 'work-orders'), orderBy('date', 'desc'));
          const ganttQuery = query(collection(db, 'gantt-charts'));
          const submittedReportsQuery = query(collection(db, 'submitted-reports'), orderBy('submittedAt', 'desc'));

          const unsubWorkOrders = onSnapshot(workOrdersQuery, (snapshot) => {
              const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as WorkOrder[];
              setWorkOrders(data);
          }, (error) => console.error("Error fetching work-orders:", error));

          const unsubGantt = onSnapshot(ganttQuery, (snapshot) => {
              const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as GanttChart[];
              setGanttCharts(data);
          }, (error) => console.error("Error fetching gantt-charts:", error));

          const unsubSubmittedReports = onSnapshot(submittedReportsQuery, (snapshot) => {
              const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() })) as SubmittedReport[];
              setSubmittedReports(data);
          }, (error) => console.error("Error fetching submitted-reports:", error));

          let unsubAuditLog: Unsubscribe | undefined;
          if (userProfile?.role === 'Admin') {
              const auditLogQuery = query(collection(db, 'audit-log'), orderBy('timestamp', 'desc'));
              unsubAuditLog = onSnapshot(auditLogQuery, (snapshot) => {
                  const data = snapshot.docs.map(doc => processFirestoreTimestamp({ id: doc.id, ...doc.data() }));
                  setAuditLog(data);
              }, (error) => console.error("Error fetching audit-log:", error));
          }

          return () => {
              unsubWorkOrders();
              unsubGantt();
              unsubSubmittedReports();
              if (unsubAuditLog) unsubAuditLog();
          };
      } else if (!authLoading) {
          setLoading(false);
      }
  }, [user, authLoading, userProfile, fetchData]);


  // Derived state for active/historical orders
  useEffect(() => {
    setActiveWorkOrders(workOrders.filter(o => normalizeString(o.status) !== 'cerrada'));
    setHistoricalWorkOrders(workOrders.filter(o => normalizeString(o.status) === 'cerrada'));
  }, [workOrders]);

  const addLogEntry = async (action: string) => {
    if (!userProfile) return;
    addDoc(collection(db, 'audit-log'), {
        user: userProfile.displayName,
        email: userProfile.email,
        action,
        timestamp: serverTimestamp()
    }).catch(e => console.error("Error adding log entry: ", e));
  };
  
  const updateOrder = useCallback(async (id: string, updatedData: Partial<WorkOrder>) => {
      const orderRef = doc(db, 'work-orders', id);
      const order = workOrders.find(o => o.id === id);
      updateDoc(orderRef, updatedData).then(() => {
        if (order) {
            addLogEntry(`Actualizó la OT: ${order.ot_number}`);
        }
      }).catch(e => {
        console.error(`Error updating order ${id}:`, e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
      });
  }, [workOrders, toast]);

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

  const addOrder = async (order: Omit<WorkOrder, 'id'>): Promise<WorkOrder> => {
    try {
      const docRef = await addDoc(collection(db, "work-orders"), order);
      await addLogEntry(`Creó la OT: ${order.ot_number} - ${order.description}`);
      return { id: docRef.id, ...order } as WorkOrder;
    } catch(e: any) {
        console.error("Error creating order:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };
  
  const getOrder = (id: string) => {
    return workOrders.find(order => order.id === id);
  };

  const deleteOrder = async (id: string) => {
    const order = getOrder(id);
    deleteDoc(doc(db, 'work-orders', id)).then(() => {
        if (order) addLogEntry(`Eliminó la OT: ${order.ot_number}`);
    }).catch(e => {
        console.error("Error deleting order:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
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
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory> => {
    try {
        const docRef = await addDoc(collection(db, "ot-categories"), category);
        await addLogEntry(`Creó la categoría de OT: ${category.name}`);
        return { id: docRef.id, ...category } as OTCategory;
    } catch(e: any) {
        console.error("Error creating category:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    updateDoc(doc(db, "ot-categories", id), updatedCategory).then(() => {
        addLogEntry(`Actualizó la categoría de OT: ${updatedCategory.name}`);
    }).catch(e => {
        console.error("Error updating category:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus> => {
    try {
        const docRef = await addDoc(collection(db, "ot-statuses"), status);
        await addLogEntry(`Creó el estado de OT: ${status.name}`);
        return { id: docRef.id, ...status } as OTStatus;
    } catch(e: any) {
        console.error("Error creating status:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    updateDoc(doc(db, "ot-statuses", id), updatedStatus).then(() => {
        addLogEntry(`Actualizó el estado de OT: ${updatedStatus.name}`);
    }).catch(e => {
        console.error("Error updating status:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const deleteStatus = async (id: string) => {
    const status = otStatuses.find(s => s.id === id);
    deleteDoc(doc(db, "ot-statuses", id)).then(() => {
        if (status) addLogEntry(`Eliminó el estado de OT: ${status.name}`);
    }).catch(e => {
        console.error("Error deleting status:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
    try {
        const docRef = await addDoc(collection(db, "services"), service);
        await addLogEntry(`Creó el servicio: ${service.name}`);
        return { id: docRef.id, ...service } as Service;
    } catch(e: any) {
        console.error("Error creating service:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    updateDoc(doc(db, "services", id), updatedService).then(() => {
        addLogEntry(`Actualizó el servicio: ${updatedService.name}`);
    }).catch(e => {
        console.error("Error updating service:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };
  
  const deleteService = async (id: string) => {
    const service = services.find(s => s.id === id);
    deleteDoc(doc(db, "services", id)).then(() => {
        if (service) addLogEntry(`Eliminó el servicio: ${service.name}`);
    }).catch(e => {
        console.error("Error deleting service:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    try {
        const docRef = await addDoc(collection(db, "collaborators"), collaborator);
        await addLogEntry(`Creó al colaborador: ${collaborator.name}`);
        return { ...collaborator, id: docRef.id } as Collaborator;
    } catch(e: any) {
        console.error("Error creating collaborator:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };
  
  const getCollaborator = (id: string) => {
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const updateCollaborator = async (id: string, updatedCollaborator: Partial<Omit<Collaborator, 'id'>>) => {
    updateDoc(doc(db, "collaborators", id), updatedCollaborator).then(() => {
        addLogEntry(`Actualizó al colaborador: ${updatedCollaborator.name}`);
    }).catch(e => {
        console.error("Error updating collaborator:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const deleteCollaborator = async (id: string) => {
    const collaborator = getCollaborator(id);
    deleteDoc(doc(db, "collaborators", id)).then(() => {
        if (collaborator) addLogEntry(`Eliminó al colaborador: ${collaborator.name}`);
    }).catch(e => {
        console.error("Error deleting collaborator:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    try {
        const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
        await addLogEntry(`Añadió el vehículo: ${vehicle.model} (${vehicle.plate})`);
        return { ...vehicleData, id: docRef.id } as Vehicle;
    } catch(e: any) {
        console.error("Error creating vehicle:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    updateDoc(doc(db, "vehicles", id), updatedVehicle).then(() => {
        addLogEntry(`Actualizó el vehículo: ${updatedVehicle.model} (${updatedVehicle.plate})`);
    }).catch(e => {
        console.error("Error updating vehicle:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const deleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    deleteDoc(doc(db, "vehicles", id)).then(() => {
        if (vehicle) addLogEntry(`Eliminó el vehículo: ${vehicle.model} (${vehicle.plate})`);
    }).catch(e => {
        console.error("Error deleting vehicle:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const addGanttChart = async (ganttChart: Omit<GanttChart, 'id'>): Promise<GanttChart> => {
      const dataToSave = {
          ...ganttChart,
          assignedOT: ganttChart.assignedOT === 'none' ? '' : ganttChart.assignedOT || '',
          tasks: ganttChart.tasks.map(task => ({
              ...task,
              startDate: Timestamp.fromDate(new Date(task.startDate)),
          }))
      };
      try {
        const docRef = await addDoc(collection(db, "gantt-charts"), dataToSave);
        await addLogEntry(`Creó la Carta Gantt: ${ganttChart.name}`);
        return { ...ganttChart, id: docRef.id };
      } catch(e: any) {
        console.error("Error creating Gantt chart:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
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
      }).catch(e => {
        console.error("Error updating Gantt chart:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
      });
  };

  const deleteGanttChart = async (id: string) => {
    const chart = getGanttChart(id);
    deleteDoc(doc(db, "gantt-charts", id)).then(() => {
        if (chart) addLogEntry(`Eliminó la Carta Gantt: ${chart.name}`);
    }).catch(e => {
        console.error("Error deleting Gantt chart:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask> => {
    try {
        const docRef = await addDoc(collection(db, "suggested-tasks"), task);
        await addLogEntry(`Añadió tarea sugerida: ${task.name}`);
        return { id: docRef.id, ...task } as SuggestedTask;
    } catch(e: any) {
        console.error("Error creating suggested task:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    updateDoc(doc(db, "suggested-tasks", id), updatedTask).then(() => {
        addLogEntry(`Actualizó tarea sugerida: ${updatedTask.name}`);
    }).catch(e => {
        console.error("Error updating suggested task:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const deleteSuggestedTask = async (id: string) => {
    const task = suggestedTasks.find(t => t.id === id);
    deleteDoc(doc(db, "suggested-tasks", id)).then(() => {
        if (task) addLogEntry(`Eliminó tarea sugerida: ${task.name}`);
    }).catch(e => {
        console.error("Error deleting suggested task:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
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
        console.error("Error updating phase name:", e);
        toast({ variant: 'destructive', title: 'Error al renombrar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
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
        console.error("Error deleting phase:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    try {
        const docRef = await addDoc(collection(db, "report-templates"), template);
        await addLogEntry(`Creó la plantilla de informe: ${template.name}`);
        return { id: docRef.id, ...template } as ReportTemplate;
    } catch(e: any) {
        console.error("Error creating report template:", e);
        toast({ variant: 'destructive', title: 'Error al crear', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    updateDoc(doc(db, "report-templates", id), updatedTemplate).then(() => {
        addLogEntry(`Actualizó la plantilla de informe: ${updatedTemplate.name}`);
    }).catch(e => {
        console.error("Error updating report template:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };


  const deleteReportTemplate = async (id: string) => {
    const template = reportTemplates.find(t => t.id === id);
    deleteDoc(doc(db, "report-templates", id)).then(() => {
        if (template) addLogEntry(`Eliminó la plantilla de informe: ${template.name}`);
    }).catch(e => {
        console.error("Error deleting report template:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    try {
        const docRef = await addDoc(collection(db, "submitted-reports"), reportData);
        await addLogEntry(`Envió el informe '${report.templateName}' para la OT ${report.otDetails.ot_number}`);
        return { ...report, id: docRef.id, submittedAt: Timestamp.now() } as SubmittedReport; 
    } catch(e: any) {
        console.error("Error adding submitted report:", e);
        toast({ variant: 'destructive', title: 'Error al enviar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    }
  };

  const updateSubmittedReport = async (id: string, report: Partial<SubmittedReport>) => {
    const originalReport = submittedReports.find(r => r.id === id);
    updateDoc(doc(db, "submitted-reports", id), report).then(() => {
        if(originalReport) addLogEntry(`Actualizó el informe para la OT ${originalReport.otDetails.ot_number}`);
    }).catch(e => {
        console.error("Error updating submitted report:", e);
        toast({ variant: 'destructive', title: 'Error al actualizar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const deleteSubmittedReport = async (id: string) => {
    const report = submittedReports.find(r => r.id === id);
    deleteDoc(doc(db, "submitted-reports", id)).then(() => {
        if(report) addLogEntry(`Eliminó el informe para la OT ${report.otDetails.ot_number}`);
    }).catch(e => {
        console.error("Error deleting submitted report:", e);
        toast({ variant: 'destructive', title: 'Error al eliminar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    setDoc(docRef, info, { merge: true }).then(() => {
        addLogEntry(`Actualizó la información de la empresa.`);
        fetchData(); // Re-fetch all data to reflect changes
    }).catch(e => {
        console.error("Error updating company info:", e);
        toast({ variant: 'destructive', title: 'Error al guardar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
    });
  };

  const updateSmtpConfig = async (config: SmtpConfig) => {
    const docRef = doc(db, 'settings', 'smtpConfig');
    setDoc(docRef, config, { merge: true }).then(() => {
        addLogEntry(`Actualizó la configuración SMTP.`);
    }).catch(e => {
        console.error("Error updating SMTP config:", e);
        toast({ variant: 'destructive', title: 'Error al guardar', description: `Permiso denegado o error de red. Detalles: ${e.message}`});
        throw e;
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

  const deleteAllData = async () => {
    const collectionsToDelete = [
      'work-orders',
      'collaborators',
      'vehicles',
      'gantt-charts',
      'submitted-reports',
    ];
  
    const batchPromises = collectionsToDelete.map(async (collectionName) => {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    });
  
    await Promise.all(batchPromises);
    await addLogEntry('Eliminó todos los datos de la aplicación.');
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
