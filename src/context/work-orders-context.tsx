

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, serverTimestamp, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus, ReportTemplate, SubmittedReport, CompanyInfo, AppUser } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { initialSuggestedTasks } from '@/lib/placeholder-data';
import { predefinedReportTemplates } from '@/lib/predefined-templates';
import { useAuth } from './auth-context';


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
  loading: boolean;
  fetchData: () => Promise<void>;
  updateOrder: (id: string, updatedOrder: Partial<WorkOrder>) => Promise<void>;
  getOrder: (id: string) => WorkOrder | undefined;
  addCategory: (category: Omit<OTCategory, 'id' | 'status'> & { status: string }) => Promise<OTCategory>;
  updateCategory: (id: string, category: Partial<OTCategory>) => Promise<void>;
  addStatus: (status: Omit<OTStatus, 'id'>) => Promise<OTStatus>;
  updateStatus: (id: string, status: Partial<OTStatus>) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'status'> & { status: string }) => Promise<Service>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addOrder: (order: Omit<WorkOrder, 'id'>) => Promise<WorkOrder>;
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
  addReportTemplate: (template: Omit<ReportTemplate, 'id'>) => Promise<ReportTemplate>;
  updateReportTemplate: (id: string, template: Partial<ReportTemplate>) => Promise<void>;
  deleteReportTemplate: (id: string) => Promise<void>;
  addSubmittedReport: (report: Omit<SubmittedReport, 'id' | 'submittedAt'>) => Promise<SubmittedReport>;
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<Pick<AppUser, 'displayName' | 'role'>>) => Promise<void>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

const SEED_FLAG_KEY = 'suggested_tasks_seeded_v5';

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
  const [loading, setLoading] = useState(true);
  const { fetchUsers } = useAuth();


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const fetchAndSetSuggestedTasks = async () => {
            const seedCompleted = localStorage.getItem(SEED_FLAG_KEY);
            if (seedCompleted === 'true') {
                 const tasksSnapshot = await getDocs(query(collection(db, "suggested-tasks"), orderBy("order")));
                 setSuggestedTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SuggestedTask[]);
                 return;
            }

            console.log("Seeding suggested tasks v5...");
            
            const tasksCollectionRef = collection(db, "suggested-tasks");
            const existingTasksSnapshot = await getDocs(tasksCollectionRef);
            
            if (!existingTasksSnapshot.empty) {
                const deleteBatch = writeBatch(db);
                existingTasksSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
                await deleteBatch.commit();
                console.log("All existing suggested tasks deleted.");
            }

            const addBatch = writeBatch(db);
            initialSuggestedTasks.forEach(task => {
                const docRef = doc(collection(db, "suggested-tasks"));
                addBatch.set(docRef, task);
            });
            await addBatch.commit();
            console.log("Seeding of new suggested tasks complete.");

            const tasksSnapshot = await getDocs(query(collection(db, "suggested-tasks"), orderBy("order")));
            setSuggestedTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SuggestedTask[]);
            
            localStorage.setItem(SEED_FLAG_KEY, 'true');
        };
        
        const [
            activeWorkOrdersSnapshot,
            historicalWorkOrdersSnapshot,
            categoriesSnapshot,
            statusesSnapshot,
            servicesSnapshot,
            collaboratorsSnapshot,
            vehiclesSnapshot,
            ganttChartsSnapshot,
            reportTemplatesSnapshot,
            submittedReportsSnapshot,
            companyInfoSnapshot,
        ] = await Promise.all([
            getDocs(query(collection(db, "work-orders"), where("status", "!=", "Cerrada"))),
            getDocs(query(collection(db, "work-orders"), where("status", "==", "Cerrada"))),
            getDocs(collection(db, "ot-categories")),
            getDocs(collection(db, "ot-statuses")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "collaborators")),
            getDocs(collection(db, "vehicles")),
            getDocs(collection(db, "gantt-charts")),
            getDocs(collection(db, "report-templates")),
            getDocs(query(collection(db, "submitted-reports"), orderBy("submittedAt", "desc"))),
            getDoc(doc(db, "settings", "companyInfo")),
        ]);
        
        await fetchAndSetSuggestedTasks();

        setActiveWorkOrders(activeWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setHistoricalWorkOrders(historicalWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
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
        console.error("Error fetching data from Firestore: ", error);
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
    } finally {
        setLoading(false);
    }
  }, []);


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
    const newOrder = { id: docRef.id, ...order } as WorkOrder;
    if (newOrder.status.toLowerCase() === 'cerrada') {
      setHistoricalWorkOrders(prev => [newOrder, ...prev]);
    } else {
      setActiveWorkOrders(prev => [newOrder, ...prev]);
    }
    return newOrder;
  };
  
  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
  };

  const updateOrder = async (id: string, updatedFields: Partial<WorkOrder>) => {
    const orderRef = doc(db, 'work-orders', id);
    await updateDoc(orderRef, updatedFields);
    await fetchData();
  };
  
  const addCategory = async (category: Omit<OTCategory, 'id'>): Promise<OTCategory> => {
    const docRef = await addDoc(collection(db, "ot-categories"), category);
    const newCategory = { id: docRef.id, ...category } as OTCategory;
    setOtCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: string, updatedCategory: Partial<OTCategory>) => {
    const docRef = doc(db, "ot-categories", id);
    await updateDoc(docRef, updatedCategory);
    setOtCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, ...updatedCategory } : cat)));
  };

  const addStatus = async (status: Omit<OTStatus, 'id'>): Promise<OTStatus> => {
    const docRef = await addDoc(collection(db, "ot-statuses"), status);
    const newStatus = { id: docRef.id, ...status } as OTStatus;
    setOtStatuses(prev => [...prev, newStatus]);
    return newStatus;
  };

  const updateStatus = async (id: string, updatedStatus: Partial<OTStatus>) => {
    const docRef = doc(db, "ot-statuses", id);
    await updateDoc(docRef, updatedStatus);
    setOtStatuses(prev => prev.map(s => (s.id === id ? { ...s, ...updatedStatus } : s)));
  };

  const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
    const docRef = await addDoc(collection(db, "services"), service);
    const newService = { id: docRef.id, ...service } as Service;
    setServices(prev => [...prev, newService]);
    return newService;
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const docRef = doc(db, "services", id);
    await updateDoc(docRef, updatedService);
    setServices(prev => prev.map(s => (s.id === id ? { ...s, ...updatedService } : s)));
  };
  
  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, "services", id));
    setServices(prev => prev.filter(s => s.id !== id));
  };
  
  const addCollaborator = async (collaborator: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    const docRef = await addDoc(collection(db, "collaborators"), collaborator);
    const newCollaborator = { ...collaborator, id: docRef.id } as Collaborator;
    setCollaborators(prev => [...prev, newCollaborator]);
    return newCollaborator;
  };
  
  const getCollaborator = (id: string) => {
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const updateCollaborator = async (id: string, updatedCollaborator: Partial<Omit<Collaborator, 'id'>>) => {
    const docRef = doc(db, "collaborators", id);
    await updateDoc(docRef, updatedCollaborator);
    setCollaborators(prev => prev.map(t => (t.id === id ? { ...t, ...updatedCollaborator} as Collaborator : t)));
  };

  const deleteCollaborator = async (id: string) => {
    await deleteDoc(doc(db, "collaborators", id));
    setCollaborators(prev => prev.filter(t => t.id !== id));
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicleData = { ...vehicle, maintenanceLog: vehicle.maintenanceLog || [] };
    const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
    const newVehicle = { ...vehicleData, id: docRef.id } as Vehicle;
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle;
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Omit<Vehicle, 'id'>>) => {
    const docRef = doc(db, "vehicles", id);
    await updateDoc(docRef, updatedVehicle);
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ...updatedVehicle} as Vehicle : v)));
  };

  const deleteVehicle = async (id: string) => {
    await deleteDoc(doc(db, "vehicles", id));
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addGanttChart = async (ganttChart: Omit<GanttChart, 'id'>): Promise<GanttChart> => {
    const dataToSave = {
        ...ganttChart,
        tasks: ganttChart.tasks.map(task => ({
            ...task,
            startDate: Timestamp.fromDate(task.startDate),
        }))
    };
    const docRef = await addDoc(collection(db, "gantt-charts"), dataToSave);
    const newGanttChart = { ...ganttChart, id: docRef.id } as GanttChart;
    setGanttCharts(prev => [...prev, newGanttChart]);
    return newGanttChart;
  };
  
  const getGanttChart = (id: string) => {
    return ganttCharts.find(chart => chart.id === id);
  };

  const updateGanttChart = async (id: string, ganttChart: Partial<Omit<GanttChart, 'id'>>) => {
    const docRef = doc(db, "gantt-charts", id);
    const dataToSave: Partial<{ [key in keyof GanttChart]: any }> = { ...ganttChart };
    if (ganttChart.tasks) {
        dataToSave.tasks = ganttChart.tasks.map(task => {
            const { isPhase, ...restOfTask } = task;
            return {
                ...restOfTask,
                startDate: Timestamp.fromDate(task.startDate),
            };
        });
    }
    await updateDoc(docRef, dataToSave);
    setGanttCharts(prev => prev.map(chart => (chart.id === id ? { ...chart, ...ganttChart } as GanttChart : chart)));
  };

  const deleteGanttChart = async (id: string) => {
    await deleteDoc(doc(db, "gantt-charts", id));
    setGanttCharts(prev => prev.filter(chart => chart.id !== id));
  };
  
  const addSuggestedTask = async (task: Omit<SuggestedTask, 'id'>): Promise<SuggestedTask> => {
    const docRef = await addDoc(collection(db, "suggested-tasks"), task);
    const newTask = { id: docRef.id, ...task } as SuggestedTask;
    setSuggestedTasks(prev => [...prev, newTask].sort((a,b) => (a.order || 0) - (b.order || 0)));
    return newTask;
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    await updateDoc(docRef, updatedTask);
    setSuggestedTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTask } as SuggestedTask : t)).sort((a,b) => (a.order || 0) - (b.order || 0)));
  };

  const deleteSuggestedTask = async (id: string) => {
    await deleteDoc(doc(db, "suggested-tasks", id));
    setSuggestedTasks(prev => prev.filter(t => t.id !== id));
  };
  
  const addReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    const docRef = await addDoc(collection(db, "report-templates"), template);
    const newTemplate = { id: docRef.id, ...template } as ReportTemplate;
    setReportTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateReportTemplate = async (id: string, updatedTemplate: Partial<ReportTemplate>) => {
    const docRef = doc(db, "report-templates", id);
    await updateDoc(docRef, updatedTemplate);
    setReportTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTemplate } as ReportTemplate : t)));
  };


  const deleteReportTemplate = async (id: string) => {
    await deleteDoc(doc(db, "report-templates", id));
    setReportTemplates(prev => prev.filter(t => t.id !== id));
  };

  const addSubmittedReport = async (report: Omit<SubmittedReport, 'id' | 'submittedAt'>): Promise<SubmittedReport> => {
    const reportData = {
        ...report,
        submittedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "submitted-reports"), reportData);
    const newReport = { ...report, id: docRef.id, submittedAt: new Date() } as SubmittedReport; // Simulate timestamp for immediate UI update
    setSubmittedReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    const docRef = doc(db, 'settings', 'companyInfo');
    await setDoc(docRef, info, { merge: true });
    setCompanyInfo(prev => prev ? { ...prev, ...info } : info);
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
        loading,
        fetchData,
        updateOrder, 
        getOrder, 
        addCategory,
        updateCategory,
        addStatus,
        updateStatus,
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
        addReportTemplate,
        updateReportTemplate,
        deleteReportTemplate,
        addSubmittedReport,
        updateCompanyInfo,
        updateUserProfile,
    }}>
      {children}
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

    

    

    
