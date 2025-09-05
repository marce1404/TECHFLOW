
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser, SmtpConfig } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from './auth-context';
import { format } from 'date-fns';
import { CloseWorkOrderDialog } from '@/components/orders/close-work-order-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { predefinedReportTemplates } from '@/lib/predefined-templates';

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
  fetchData: () => Promise<void>;
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
  auditLog: any[];
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

  const checkAndCreatePredefinedTemplates = async () => {
    const templatesCollection = collection(db, 'report-templates');
    const existingTemplatesSnapshot = await getDocs(templatesCollection);
    if (existingTemplatesSnapshot.empty) {
        const batch = writeBatch(db);
        for (const predefinedTemplate of predefinedReportTemplates) {
            const docRef = doc(templatesCollection);
            batch.set(docRef, predefinedTemplate);
        }
        await batch.commit();
        console.log("Created all predefined templates.");
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    
    try {
        await checkAndCreatePredefinedTemplates();
        
        const collections = [
            { name: 'work-orders', setter: setWorkOrders, orderByField: 'date' },
            { name: 'ot-categories', setter: setOtCategories },
            { name: 'ot-statuses', setter: setOtStatuses },
            { name: 'services', setter: setServices },
            { name: 'collaborators', setter: setCollaborators },
            { name: 'vehicles', setter: setVehicles },
            { name: 'suggested-tasks', setter: setSuggestedTasks },
            { name: 'report-templates', setter: setReportTemplates },
            { name: 'submitted-reports', setter: setSubmittedReports, orderByField: 'submittedAt'},
            { name: 'gantt-charts', setter: setGanttCharts },
        ];
        
        const dataPromises = collections.map(async (c) => {
            const collRef = c.orderByField 
                ? query(collection(db, c.name), orderBy(c.orderByField, 'desc'))
                : collection(db, c.name);
                
            const snapshot = await getDocs(collRef);
            return { setter: c.setter, docs: snapshot.docs };
        });
        
        const results = await Promise.all(dataPromises);
        
        for (const result of results) {
            const data = result.docs.map(doc => {
                const docData = doc.data();
                // Firestore timestamp conversion for all relevant fields
                 Object.keys(docData).forEach(key => {
                    if (docData[key] instanceof Timestamp) {
                       docData[key] = docData[key].toDate();
                    }
                 });
                 if (docData.tasks) {
                     docData.tasks = docData.tasks.map((task: any) => ({
                         ...task,
                         startDate: task.startDate instanceof Timestamp ? task.startDate.toDate() : new Date(task.startDate),
                     }))
                 }
                return { id: doc.id, ...docData };
            });
            result.setter(data as any);
        }

        const allOrders = workOrders;
        setActiveWorkOrders(allOrders.filter(o => o.status !== 'Cerrada'));
        setHistoricalWorkOrders(allOrders.filter(o => o.status === 'Cerrada'));

        // Fetch single docs
        const companyInfoDoc = await getDoc(doc(db, 'settings', 'companyInfo'));
        setCompanyInfo(companyInfoDoc.exists() ? companyInfoDoc.data() as CompanyInfo : null);

        const smtpConfigDoc = await getDoc(doc(db, 'settings', 'smtpConfig'));
        setSmtpConfig(smtpConfigDoc.exists() ? smtpConfigDoc.data() as SmtpConfig : null);

    } catch (e) {
        console.error("Error fetching data from Firestore: ", e);
        toast({
            variant: "destructive",
            title: "Error de Carga",
            description: "No se pudieron cargar los datos. Por favor, recarga la página.",
        });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    } else if (!authLoading) {
      // User is logged out
      setLoading(false);
      setWorkOrders([]);
      setActiveWorkOrders([]);
      setHistoricalWorkOrders([]);
      setOtCategories([]);
      setOtStatuses([]);
      setServices([]);
      setCollaborators([]);
      setVehicles([]);
      setGanttCharts([]);
      setSuggestedTasks([]);
      setReportTemplates([]);
      setSubmittedReports([]);
      setCompanyInfo(null);
      setSmtpConfig(null);
      setAuditLog([]);
    }
  }, [user, authLoading, fetchData]);

  const addLogEntry = async (action: string) => {
    if (!userProfile) return;
    try {
        await addDoc(collection(db, 'audit-log'), {
            user: userProfile.displayName,
            email: userProfile.email,
            action,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Error adding log entry: ", e);
    }
  };

  const getNextOtNumber = (prefix: string): string => {
    if (!prefix) return '';
    const relevantOrders = workOrders.filter(o => o.ot_number.startsWith(prefix));

    if (relevantOrders.length === 0) return `${prefix}-1`;

    const maxNumber = Math.max(
      ...relevantOrders.map(o => {
        const numberPart = o.ot_number.split('-')[1] || '0';
        const numericPart = parseInt(numberPart, 10);
        return isNaN(numericPart) ? 0 : numericPart;
      })
    );

    return `${prefix}-${maxNumber + 1}`;
};

const getLastOtNumber = (prefix: string): string | null => {
    if (!prefix) return null;
    const relevantOrders = workOrders.filter(o => o.ot_number.startsWith(prefix));
    if (relevantOrders.length === 0) return null;

    let maxNumber = -1;
    let lastOtNumber: string | null = null;

    relevantOrders.forEach(o => {
        const numberPart = o.ot_number.split('-')[1] || '0';
        const numericPart = parseInt(numberPart, 10);
        if (!isNaN(numericPart) && numericPart > maxNumber) {
            maxNumber = numericPart;
            lastOtNumber = o.ot_number;
        }
    });

    return lastOtNumber;
};

  const addOrder = async (order: Omit<WorkOrder, 'id'>): Promise<WorkOrder> => {
    const docRef = await addDoc(collection(db, "work-orders"), order);
    await addLogEntry(`Creó la OT: ${order.ot_number} - ${order.description}`);
    await fetchData();
    const newOrder = { id: docRef.id, ...order } as WorkOrder;
    return newOrder;
  };
  
  const getOrder = (id: string) => {
    return workOrders.find(order => order.id === id);
  };

  const updateOrder = async (id: string, updatedData: Partial<WorkOrder>) => {
    const orderRef = doc(db, 'work-orders', id);
    await updateDoc(orderRef, updatedData);
     const order = getOrder(id);
    await addLogEntry(`Actualizó la OT: ${order?.ot_number}`);
    await fetchData();
  };

  const deleteOrder = async (id: string) => {
     const order = getOrder(id);
    await deleteDoc(doc(db, 'work-orders', id));
    await addLogEntry(`Eliminó la OT: ${order?.ot_number}`);
    await fetchData();
  };
  
  const promptToCloseOrder = (order: WorkOrder) => {
    setOrderToClose(order);
  };

  const handleConfirmClose = async (order: WorkOrder, closingDate: Date) => {
    const dataToUpdate = {
        status: 'Cerrada' as WorkOrder['status'],
        endDate: format(closingDate, 'yyyy-MM-dd'),
    };
    await updateOrder(order.id, dataToUpdate);
    await addLogEntry(`Cerró la OT: ${order.ot_number}`);
    setOrderToClose(null);
  };
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory> => {
    const docRef = await addDoc(collection(db, "ot-categories"), category);
    await addLogEntry(`Creó la categoría de OT: ${category.name}`);
    await fetchData();
    return { id: docRef.id, ...category } as OTCategory;
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    const docRef = doc(db, "ot-categories", id);
    await updateDoc(docRef, updatedCategory);
    await addLogEntry(`Actualizó la categoría de OT: ${updatedCategory.name}`);
    await fetchData();
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus> => {
    const docRef = await addDoc(collection(db, "ot-statuses"), status);
    await addLogEntry(`Creó el estado de OT: ${status.name}`);
    await fetchData();
    return { id: docRef.id, ...status } as OTStatus;
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    const docRef = doc(db, "ot-statuses", id);
    await updateDoc(docRef, updatedStatus);
    await addLogEntry(`Actualizó el estado de OT: ${updatedStatus.name}`);
    await fetchData();
  };

  const deleteStatus = async (id: string) => {
    const status = otStatuses.find(s => s.id === id);
    await deleteDoc(doc(db, "ot-statuses", id));
    await addLogEntry(`Eliminó el estado de OT: ${status?.name}`);
    await fetchData();
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
    const docRef = await addDoc(collection(db, "services"), service);
    await addLogEntry(`Creó el servicio: ${service.name}`);
    await fetchData();
    return { id: docRef.id, ...service } as Service;
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const docRef = doc(db, "services", id);
    await updateDoc(docRef, updatedService);
    await addLogEntry(`Actualizó el servicio: ${updatedService.name}`);
    await fetchData();
  };
  
  const deleteService = async (id: string) => {
    const service = services.find(s => s.id === id);
    await deleteDoc(doc(db, "services", id));
    await addLogEntry(`Eliminó el servicio: ${service?.name}`);
    await fetchData();
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    const docRef = await addDoc(collection(db, "collaborators"), collaborator);
    await addLogEntry(`Creó al colaborador: ${collaborator.name}`);
    await fetchData();
    return { ...collaborator, id: docRef.id } as Collaborator;
  };
  
  const getCollaborator = (id: string) => {
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const updateCollaborator = async (id: string, updatedCollaborator: Partial<Omit<Collaborator, 'id'>>) => {
    const docRef = doc(db, "collaborators", id);
    const cleanData = { ...updatedCollaborator };
    
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
            delete cleanData[key as keyof typeof cleanData];
        }
    });

    await updateDoc(docRef, cleanData);
    await addLogEntry(`Actualizó al colaborador: ${updatedCollaborator.name}`);
    await fetchData();
  };

  const deleteCollaborator = async (id: string) => {
    const collaborator = getCollaborator(id);
    await deleteDoc(doc(db, "collaborators", id));
    await addLogEntry(`Eliminó al colaborador: ${collaborator?.name}`);
    await fetchData();
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
    await addLogEntry(`Añadió el vehículo: ${vehicle.model} (${vehicle.plate})`);
    await fetchData();
    return { ...vehicleData, id: docRef.id } as Vehicle;
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    const docRef = doc(db, "vehicles", id);
    await updateDoc(docRef, updatedVehicle);
    await addLogEntry(`Actualizó el vehículo: ${updatedVehicle.model} (${updatedVehicle.plate})`);
    await fetchData();
  };

  const deleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    await deleteDoc(doc(db, "vehicles", id));
    await addLogEntry(`Eliminó el vehículo: ${vehicle?.model} (${vehicle?.plate})`);
    await fetchData();
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
      const docRef = await addDoc(collection(db, "gantt-charts"), dataToSave);
      await addLogEntry(`Creó la Carta Gantt: ${ganttChart.name}`);
      await fetchData();
      return { ...ganttChart, id: docRef.id };
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

      await updateDoc(docRef, dataToSave);
      await addLogEntry(`Actualizó la Carta Gantt: ${ganttChartData.name}`);
      await fetchData();
  };

  const deleteGanttChart = async (id: string) => {
    const chart = getGanttChart(id);
    await deleteDoc(doc(db, "gantt-charts", id));
    await addLogEntry(`Eliminó la Carta Gantt: ${chart?.name}`);
    await fetchData();
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask> => {
    const docRef = await addDoc(collection(db, "suggested-tasks"), task);
    await addLogEntry(`Añadió tarea sugerida: ${task.name}`);
    await fetchData();
    return { id: docRef.id, ...task } as SuggestedTask;
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    await updateDoc(docRef, updatedTask);
    await addLogEntry(`Actualizó tarea sugerida: ${updatedTask.name}`);
    await fetchData();
  };

  const deleteSuggestedTask = async (id: string) => {
    const task = suggestedTasks.find(t => t.id === id);
    await deleteDoc(doc(db, "suggested-tasks", id));
    await addLogEntry(`Eliminó tarea sugerida: ${task?.name}`);
    await fetchData();
  };
  
  const updatePhaseName = async (category: string, oldPhaseName: string, newPhaseName: string) => {
    const q = query(collection(db, 'suggested-tasks'), where('category', '==', category), where('phase', '==', oldPhaseName));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.update(doc.ref, { phase: newPhaseName });
    });
    await batch.commit();
    await addLogEntry(`Renombró la fase '${oldPhaseName}' a '${newPhaseName}' en la categoría '${category}'`);
    await fetchData();
  };

  const deletePhase = async (category: string, phaseName: string) => {
    const q = query(collection(db, 'suggested-tasks'), where('category', '==', category), where('phase', '==', phaseName));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    await addLogEntry(`Eliminó la fase '${phaseName}' en la categoría '${category}'`);
    await fetchData();
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    const docRef = await addDoc(collection(db, "report-templates"), template);
    await addLogEntry(`Creó la plantilla de informe: ${template.name}`);
    await fetchData();
    return { id: docRef.id, ...template } as ReportTemplate;
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    const docRef = doc(db, "report-templates", id);
    await updateDoc(docRef, updatedTemplate);
    await addLogEntry(`Actualizó la plantilla de informe: ${updatedTemplate.name}`);
    await fetchData();
  };


  const deleteReportTemplate = async (id: string) => {
    const template = reportTemplates.find(t => t.id === id);
    await deleteDoc(doc(db, "report-templates", id));
    await addLogEntry(`Eliminó la plantilla de informe: ${template?.name}`);
    await fetchData();
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "submitted-reports"), reportData);
    await addLogEntry(`Envió el informe '${report.templateName}' para la OT ${report.otDetails.ot_number}`);
    await fetchData();
    return { ...report, id: docRef.id, submittedAt: Timestamp.now() } as SubmittedReport; 
  };

  const updateSubmittedReport = async (id: string, report: Partial<SubmittedReport>) => {
    const docRef = doc(db, "submitted-reports", id);
    await updateDoc(docRef, report);
    const originalReport = submittedReports.find(r => r.id === id);
    await addLogEntry(`Actualizó el informe para la OT ${originalReport?.otDetails.ot_number}`);
    await fetchData();
  };

  const deleteSubmittedReport = async (id: string) => {
    const report = submittedReports.find(r => r.id === id);
    await deleteDoc(doc(db, "submitted-reports", id));
    await addLogEntry(`Eliminó el informe para la OT ${report?.otDetails.ot_number}`);
    await fetchData();
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    await setDoc(docRef, info, { merge: true });
    await addLogEntry(`Actualizó la información de la empresa.`);
    await fetchData();
  };

  const updateSmtpConfig = async (config: SmtpConfig) => {
    const docRef = doc(db, 'settings', 'smtpConfig');
    await setDoc(docRef, config, { merge: true });
    await addLogEntry(`Actualizó la configuración SMTP.`);
    await fetchData();
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
        fetchData,
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
        auditLog,
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
