

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser, SmtpConfig } from '@/lib/types';
import { Timestamp, runTransaction } from 'firebase/firestore';
import { initialSuggestedTasks } from '@/lib/placeholder-data';
import { predefinedReportTemplates } from '@/lib/predefined-templates';
import { useAuth } from './auth-context';
import { format } from 'date-fns';
import { CloseWorkOrderDialog } from '@/components/orders/close-work-order-dialog';


interface WorkOrdersContextType {
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
  updateUserProfile: (uid: string, data: Partial<Pick<AppUser, 'displayName' | 'role'>>) => Promise<void>;
  promptToCloseOrder: (order: WorkOrder) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

const SEED_FLAG_KEY = 'suggested_tasks_seeded_v6';

export const WorkOrdersProvider = ({ children }: { children: ReactNode }) => {
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
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, fetchUsers } = useAuth();
  const [orderToClose, setOrderToClose] = useState<WorkOrder | null>(null);


  const fetchData = useCallback(async () => {
    // Prevent fetching if we are still in the auth loading phase or if there's no user
    if (authLoading || !user) return;
    
    setLoading(true);
    try {
        const fetchAndSetSuggestedTasks = async () => {
            const seedCompleted = localStorage.getItem(SEED_FLAG_KEY);
            if (seedCompleted === 'true') {
                 const tasksSnapshot = await getDocs(query(collection(db, "suggested-tasks"), orderBy("order")));
                 setSuggestedTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SuggestedTask[]);
                 return;
            }

            const tasksCollectionRef = collection(db, "suggested-tasks");
            const existingTasksSnapshot = await getDocs(tasksCollectionRef);
            
            if (!existingTasksSnapshot.empty) {
                const deleteBatch = writeBatch(db);
                existingTasksSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
                await deleteBatch.commit();
            }

            const addBatch = writeBatch(db);
            initialSuggestedTasks.forEach(task => {
                const docRef = doc(collection(db, "suggested-tasks"));
                addBatch.set(docRef, task);
            });
            await addBatch.commit();

            const tasksSnapshot = await getDocs(query(collection(db, "suggested-tasks"), orderBy("order")));
            setSuggestedTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SuggestedTask[]);
            
            localStorage.setItem(SEED_FLAG_KEY, 'true');
        };
        
        const [
            workOrdersSnapshot,
            categoriesSnapshot,
            statusesSnapshot,
            servicesSnapshot,
            collaboratorsSnapshot,
            vehiclesSnapshot,
            ganttChartsSnapshot,
            reportTemplatesSnapshot,
            submittedReportsSnapshot,
            companyInfoSnapshot,
            smtpConfigSnapshot,
        ] = await Promise.all([
            getDocs(query(collection(db, "work-orders"), orderBy("date", "desc"))),
            getDocs(collection(db, "ot-categories")),
            getDocs(collection(db, "ot-statuses")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "collaborators")),
            getDocs(collection(db, "vehicles")),
            getDocs(collection(db, "gantt-charts")),
            getDocs(collection(db, "report-templates")),
            getDocs(query(collection(db, "submitted-reports"), orderBy("submittedAt", "desc"))),
            getDoc(doc(db, "settings", "companyInfo")),
            getDoc(doc(db, "settings", "smtpConfig")),
        ]);
        
        await fetchAndSetSuggestedTasks();
        
        const allOrders = workOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[];
        
        const active = allOrders.filter(o => o.status.toLowerCase() !== 'cerrada' && !o.facturado);
        const historical = allOrders.filter(o => o.status.toLowerCase() === 'cerrada' || o.facturado);
        
        setActiveWorkOrders(active);
        setHistoricalWorkOrders(historical);

        setOtCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTCategory[]);
        setOtStatuses(statusesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTStatus[]);
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
        setCollaborators(collaboratorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Collaborator[]);
        setVehicles(vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[]);
        setSubmittedReports(submittedReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubmittedReport[]);
        
        if (companyInfoSnapshot.exists()) {
            setCompanyInfo(companyInfoSnapshot.data() as CompanyInfo);
        } else {
            const defaultInfo = { name: "TechFlow", slogan: "Gestión de Operaciones", address: "" };
            await setDoc(doc(db, "settings", "companyInfo"), defaultInfo);
            setCompanyInfo(defaultInfo);
        }

        if (smtpConfigSnapshot.exists()) {
            setSmtpConfig(smtpConfigSnapshot.data() as SmtpConfig);
        } else {
            setSmtpConfig(null);
        }

        setGanttCharts(ganttChartsSnapshot.docs.map(doc => {
            const data = doc.data();
            const tasks = (data.tasks || []).map((task: any) => ({
                ...task,
                startDate: task.startDate instanceof Timestamp ? task.startDate.toDate() : new Date(task.startDate),
            }));
            return { id: doc.id, ...data, tasks };
        }) as GanttChart[]);
        
        const loadedTemplates = reportTemplatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReportTemplate[];
        const hasPredefinedTemplate = loadedTemplates.some(t => t.name === 'Guía de Atención Técnica');

        if (!hasPredefinedTemplate && predefinedReportTemplates.length > 0) {
            const batch = writeBatch(db);
            const templateToAdd = predefinedReportTemplates[0]; // Assuming only one for now
            const docRef = doc(collection(db, "report-templates"));
            batch.set(docRef, templateToAdd);
            await batch.commit();
            // Re-fetch templates to get the new one
            const newTemplatesSnapshot = await getDocs(collection(db, "report-templates"));
            setReportTemplates(newTemplatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReportTemplate[]);
        } else {
            setReportTemplates(loadedTemplates);
        }
        
    } catch (error) {
        console.error("Error en fetchData: ", error);
        // Fallback to empty arrays on error
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
    } finally {
        setLoading(false);
    }
  }, [user, authLoading]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getNextOtNumber = (prefix: string) => {
    const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
    const relevantOrders = allOrders.filter(o => o.ot_number.startsWith(prefix + '-'));
    if (relevantOrders.length === 0) return `${prefix}-1`;
    const maxNumber = Math.max(...relevantOrders.map(o => parseInt(o.ot_number.split('-')[1] || '0', 10)));
    return `${prefix}-${maxNumber + 1}`;
  };

  const addOrder = async (order: Omit<WorkOrder, 'id'>): Promise<WorkOrder> => {
    const docRef = await addDoc(collection(db, "work-orders"), order);
    await fetchData(); // Re-fetch all data to ensure consistency
    const newOrder = { id: docRef.id, ...order } as WorkOrder;
    return newOrder;
  };
  
  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
  };

  const updateOrder = async (id: string, updatedData: Partial<WorkOrder>) => {
    const orderRef = doc(db, 'work-orders', id);
    await updateDoc(orderRef, updatedData);
    await fetchData();
  };

  const deleteOrder = async (id: string) => {
    await deleteDoc(doc(db, 'work-orders', id));
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
    setOrderToClose(null);
  };
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory> => {
    const docRef = await addDoc(collection(db, "ot-categories"), category);
    await fetchData();
    return { id: docRef.id, ...category } as OTCategory;
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    const docRef = doc(db, "ot-categories", id);
    await updateDoc(docRef, updatedCategory);
    await fetchData();
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus> => {
    const docRef = await addDoc(collection(db, "ot-statuses"), status);
    await fetchData();
    return { id: docRef.id, ...status } as OTStatus;
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    const docRef = doc(db, "ot-statuses", id);
    await updateDoc(docRef, updatedStatus);
    await fetchData();
  };

  const deleteStatus = async (id: string) => {
    await deleteDoc(doc(db, "ot-statuses", id));
    await fetchData();
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
    const docRef = await addDoc(collection(db, "services"), service);
    await fetchData();
    return { id: docRef.id, ...service } as Service;
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const docRef = doc(db, "services", id);
    await updateDoc(docRef, updatedService);
    await fetchData();
  };
  
  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, "services", id));
    await fetchData();
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    const docRef = await addDoc(collection(db, "collaborators"), collaborator);
    await fetchData();
    return { ...collaborator, id: docRef.id } as Collaborator;
  };
  
  const getCollaborator = (id: string) => {
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const updateCollaborator = async (id: string, updatedCollaborator: Partial<Omit<Collaborator, 'id'>>) => {
    const docRef = doc(db, "collaborators", id);
    const cleanData = { ...updatedCollaborator };
    
    // Clean out undefined fields to prevent Firestore errors
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
            delete cleanData[key as keyof typeof cleanData];
        }
    });

    await updateDoc(docRef, cleanData);
    await fetchData();
  };

  const deleteCollaborator = async (id: string) => {
    await deleteDoc(doc(db, "collaborators", id));
    await fetchData();
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
    await fetchData();
    return { ...vehicleData, id: docRef.id } as Vehicle;
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    const docRef = doc(db, "vehicles", id);
    await updateDoc(docRef, updatedVehicle);
    await fetchData();
  };

  const deleteVehicle = async (id: string) => {
    await deleteDoc(doc(db, "vehicles", id));
    await fetchData();
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
      await fetchData(); // Re-fetch to ensure consistency and get the ID
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
      await fetchData();
  };

  const deleteGanttChart = async (id: string) => {
    await deleteDoc(doc(db, "gantt-charts", id));
    await fetchData();
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask> => {
    const docRef = await addDoc(collection(db, "suggested-tasks"), task);
    await fetchData();
    return { id: docRef.id, ...task } as SuggestedTask;
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    await updateDoc(docRef, updatedTask);
    await fetchData();
  };

  const deleteSuggestedTask = async (id: string) => {
    await deleteDoc(doc(db, "suggested-tasks", id));
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
    await fetchData();
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    const docRef = await addDoc(collection(db, "report-templates"), template);
    await fetchData();
    return { id: docRef.id, ...template } as ReportTemplate;
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    const docRef = doc(db, "report-templates", id);
    await updateDoc(docRef, updatedTemplate);
    await fetchData();
  };


  const deleteReportTemplate = async (id: string) => {
    await deleteDoc(doc(db, "report-templates", id));
    await fetchData();
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "submitted-reports"), reportData);
    await fetchData();
    return { ...report, id: docRef.id, submittedAt: new Date() } as SubmittedReport; // Simulate timestamp for immediate UI update
  };

  const updateSubmittedReport = async (id: string, report: Partial<SubmittedReport>) => {
    const docRef = doc(db, "submitted-reports", id);
    await updateDoc(docRef, report);
    await fetchData();
  };

  const deleteSubmittedReport = async (id: string) => {
    await deleteDoc(doc(db, "submitted-reports", id));
    await fetchData();
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    await setDoc(docRef, info, { merge: true });
    await fetchData();
  };

  const updateSmtpConfig = async (config: SmtpConfig) => {
    const docRef = doc(db, 'settings', 'smtpConfig');
    await setDoc(docRef, config, { merge: true });
    await fetchData();
  };
  
  const updateUserProfile = async (uid: string, data: Partial<Pick<AppUser, 'displayName' | 'role'>>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
    await fetchUsers(); // Re-fetch all users to update the UI
  };


  return (
    <WorkOrdersContext.Provider value={{ 
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
        updateUserProfile,
        promptToCloseOrder,
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
