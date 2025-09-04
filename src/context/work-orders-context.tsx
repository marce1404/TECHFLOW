
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser, SmtpConfig, AuditLog } from '@/lib/types';
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

interface WorkOrdersContextType {
  workOrders: WorkOrder[];
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
  auditLog: AuditLog[];
  loading: boolean;
  fetchData: () => Promise<void>;
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
  addOrder: (order: Omit<WorkOrder, 'id'>) => Promise<WorkOrder>;
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
  deleteAllWorkOrdersAction: () => Promise<{success: boolean; message: string; deletedCount: number}>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
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
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const [orderToClose, setOrderToClose] = useState<WorkOrder | null>(null);
  const { toast } = useToast();
  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null);

  const logAction = async (action: string) => {
    if (!userProfile) return;
    try {
      await addDoc(collection(db, "audit-log"), {
        user: userProfile.displayName,
        action,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging action: ", error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [
            workOrdersSnapshot,
            categoriesSnapshot,
            statusesSnapshot,
            servicesSnapshot,
            collaboratorsSnapshot,
            vehiclesSnapshot,
            ganttChartsSnapshot,
            submittedReportsSnapshot,
            companyInfoSnapshot,
            smtpConfigSnapshot,
            auditLogSnapshot,
        ] = await Promise.all([
            getDocs(query(collection(db, "work-orders"), orderBy("date", "desc"))),
            getDocs(collection(db, "ot-categories")),
            getDocs(collection(db, "ot-statuses")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "collaborators")),
            getDocs(collection(db, "vehicles")),
            getDocs(collection(db, "gantt-charts")),
            getDocs(query(collection(db, "submitted-reports"), orderBy("submittedAt", "desc"))),
            getDoc(doc(db, "settings", "companyInfo")),
            getDoc(doc(db, "settings", "smtpConfig")),
            getDocs(query(collection(db, "audit-log"), orderBy("timestamp", "desc"))),
        ]);
        
        setWorkOrders(workOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setOtCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTCategory[]);
        setOtStatuses(statusesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTStatus[]);
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
        setCollaborators(collaboratorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Collaborator[]);
        setVehicles(vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[]);
        setSubmittedReports(submittedReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubmittedReport[]);
        setAuditLog(auditLogSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as AuditLog[]);
        
        if (companyInfoSnapshot.exists()) {
            setCompanyInfo(companyInfoSnapshot.data() as CompanyInfo);
        }

        if (smtpConfigSnapshot.exists()) {
            setSmtpConfig(smtpConfigSnapshot.data() as SmtpConfig);
        }

        setGanttCharts(ganttChartsSnapshot.docs.map(doc => {
            const data = doc.data();
            const tasks = (data.tasks || []).map((task: any) => ({
                ...task,
                startDate: task.startDate instanceof Timestamp ? task.startDate.toDate() : new Date(task.startDate),
            }));
            return { id: doc.id, ...data, tasks };
        }) as GanttChart[]);

    } catch (error) {
        console.error("Error en fetchData: ", error);
    } finally {
        setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchData]);

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
    await logAction(`Creó la OT ${order.ot_number} "${order.description}"`);
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

    const order = workOrders.find(o => o.id === id);
    if(order) {
        await logAction(`Actualizó la OT ${order.ot_number}`);
    }

    await fetchData();
  };

  const deleteOrder = async (id: string) => {
    const order = workOrders.find(o => o.id === id);
    if(order) {
        await deleteDoc(doc(db, 'work-orders', id));
        await logAction(`Eliminó la OT ${order.ot_number} "${order.description}"`);
        await fetchData();
    }
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
    setOrderToClose(null);
  };
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory> => {
    const docRef = await addDoc(collection(db, "ot-categories"), category);
    await logAction(`Creó la categoría de OT "${category.name}"`);
    await fetchData();
    return { id: docRef.id, ...category } as OTCategory;
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    const docRef = doc(db, "ot-categories", id);
    await updateDoc(docRef, updatedCategory);
    await logAction(`Actualizó la categoría de OT "${updatedCategory.name}"`);
    await fetchData();
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus> => {
    const docRef = await addDoc(collection(db, "ot-statuses"), status);
    await logAction(`Creó el estado de OT "${status.name}"`);
    await fetchData();
    return { id: docRef.id, ...status } as OTStatus;
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    const docRef = doc(db, "ot-statuses", id);
    await updateDoc(docRef, updatedStatus);
    await logAction(`Actualizó el estado de OT "${updatedStatus.name}"`);
    await fetchData();
  };

  const deleteStatus = async (id: string) => {
    const status = otStatuses.find(s => s.id === id);
    if(status) {
        await deleteDoc(doc(db, "ot-statuses", id));
        await logAction(`Eliminó el estado de OT "${status.name}"`);
        await fetchData();
    }
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
    const docRef = await addDoc(collection(db, "services"), service);
    await logAction(`Creó el servicio "${service.name}"`);
    await fetchData();
    return { id: docRef.id, ...service } as Service;
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const docRef = doc(db, "services", id);
    await updateDoc(docRef, updatedService);
    await logAction(`Actualizó el servicio "${updatedService.name}"`);
    await fetchData();
  };
  
  const deleteService = async (id: string) => {
    const service = services.find(s => s.id === id);
    if(service) {
        await deleteDoc(doc(db, "services", id));
        await logAction(`Eliminó el servicio "${service.name}"`);
        await fetchData();
    }
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    const docRef = await addDoc(collection(db, "collaborators"), collaborator);
    await logAction(`Creó al colaborador "${collaborator.name}"`);
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
    await logAction(`Actualizó al colaborador "${updatedCollaborator.name}"`);
    await fetchData();
  };

  const deleteCollaborator = async (id: string) => {
    const collaborator = collaborators.find(c => c.id === id);
    if(collaborator) {
        await deleteDoc(doc(db, "collaborators", id));
        await logAction(`Eliminó al colaborador "${collaborator.name}"`);
        await fetchData();
    }
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
    await logAction(`Creó el vehículo ${vehicle.model} (${vehicle.plate})`);
    await fetchData();
    return { ...vehicleData, id: docRef.id } as Vehicle;
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    const docRef = doc(db, "vehicles", id);
    await updateDoc(docRef, updatedVehicle);
    await logAction(`Actualizó el vehículo ${updatedVehicle.model} (${updatedVehicle.plate})`);
    await fetchData();
  };

  const deleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    if(vehicle) {
        await deleteDoc(doc(db, "vehicles", id));
        await logAction(`Eliminó el vehículo ${vehicle.model} (${vehicle.plate})`);
        await fetchData();
    }
  };

  const addGanttChart = async (ganttChart: Omit<GanttChart, 'id'>): Promise<GanttChart> => {
      const dataToSave = {
          ...ganttChart,
          assignedOT: ganttChart.assignedOT === 'none' ? '' : ganttChart.assignedOT,
          tasks: ganttChart.tasks.map(task => ({
              ...task,
              startDate: Timestamp.fromDate(new Date(task.startDate)),
          }))
      };
      const docRef = await addDoc(collection(db, "gantt-charts"), dataToSave);
      await logAction(`Creó la Carta Gantt "${ganttChart.name}"`);
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
      await logAction(`Actualizó la Carta Gantt "${ganttChartData.name}"`);
      await fetchData();
  };

  const deleteGanttChart = async (id: string) => {
    const chart = ganttCharts.find(c => c.id === id);
    if(chart) {
        await deleteDoc(doc(db, "gantt-charts", id));
        await logAction(`Eliminó la Carta Gantt "${chart.name}"`);
        await fetchData();
    }
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask> => {
    const docRef = await addDoc(collection(db, "suggested-tasks"), task);
    await logAction(`Añadió la tarea sugerida "${task.name}"`);
    await fetchData();
    return { id: docRef.id, ...task } as SuggestedTask;
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    await updateDoc(docRef, updatedTask);
    await logAction(`Actualizó la tarea sugerida "${updatedTask.name}"`);
    await fetchData();
  };

  const deleteSuggestedTask = async (id: string) => {
    const task = suggestedTasks.find(t => t.id === id);
    if(task) {
        await deleteDoc(doc(db, "suggested-tasks", id));
        await logAction(`Eliminó la tarea sugerida "${task.name}"`);
        await fetchData();
    }
  };
  
  const updatePhaseName = async (category: string, oldPhaseName: string, newPhaseName: string) => {
    const q = query(collection(db, 'suggested-tasks'), where('category', '==', category), where('phase', '==', oldPhaseName));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.update(doc.ref, { phase: newPhaseName });
    });
    await batch.commit();
    await logAction(`Renombró la fase "${oldPhaseName}" a "${newPhaseName}" en la categoría ${category}`);
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
    await logAction(`Eliminó la fase "${phaseName}" de la categoría ${category}`);
    await fetchData();
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    const docRef = await addDoc(collection(db, "report-templates"), template);
    await logAction(`Creó la plantilla de informe "${template.name}"`);
    await fetchData();
    return { id: docRef.id, ...template } as ReportTemplate;
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    const docRef = doc(db, "report-templates", id);
    await updateDoc(docRef, updatedTemplate);
    await logAction(`Actualizó la plantilla de informe "${updatedTemplate.name}"`);
    await fetchData();
  };


  const deleteReportTemplate = async (id: string) => {
    const template = reportTemplates.find(t => t.id === id);
    if(template) {
        await deleteDoc(doc(db, "report-templates", id));
        await logAction(`Eliminó la plantilla de informe "${template.name}"`);
        await fetchData();
    }
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "submitted-reports"), reportData);
    await logAction(`Envió el informe "${report.templateName}" para la OT ${report.otDetails.ot_number}`);
    await fetchData();
    // Simulate serverTimestamp for immediate UI update
    return { ...report, id: docRef.id, submittedAt: Timestamp.now() } as SubmittedReport; 
  };

  const updateSubmittedReport = async (id: string, report: Partial<SubmittedReport>) => {
    const docRef = doc(db, "submitted-reports", id);
    await updateDoc(docRef, report);
    await logAction(`Actualizó un informe enviado (ID: ${id})`);
    await fetchData();
  };

  const deleteSubmittedReport = async (id: string) => {
    const report = submittedReports.find(r => r.id === id);
    if(report) {
        await deleteDoc(doc(db, "submitted-reports", id));
        await logAction(`Eliminó el informe "${report.templateName}" para la OT ${report.otDetails.ot_number}`);
        await fetchData();
    }
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    await setDoc(docRef, info, { merge: true });
    await logAction(`Actualizó la información de la empresa`);
    await fetchData();
  };

  const updateSmtpConfig = async (config: SmtpConfig) => {
    const docRef = doc(db, 'settings', 'smtpConfig');
    await setDoc(docRef, config, { merge: true });
    await logAction(`Actualizó la configuración SMTP`);
    await fetchData();
  };

  const deleteAllWorkOrdersAction = async (): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const collectionRef = collection(db, 'work-orders');
    try {
        let deletedCount = 0;
        const snapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount = snapshot.size;

        await logAction(`ELIMINÓ TODAS LAS ÓRDENES DE TRABAJO (${deletedCount} eliminadas)`);
        await fetchData();
        return { success: true, message: `Se eliminaron ${deletedCount} órdenes de trabajo.`, deletedCount };
    } catch (error: any) {
        console.error("Error deleting all work orders:", error);
        return { success: false, message: `Error al limpiar la base de datos: ${error.message}`, deletedCount: 0 };
    }
  };
  
  return (
    <WorkOrdersContext.Provider value={{ 
        workOrders, 
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
        auditLog,
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
        deleteAllWorkOrdersAction,
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
