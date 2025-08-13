
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Collaborator, Vehicle, GanttChart, SuggestedTask, OTStatus } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { initialSuggestedTasks } from '@/lib/placeholder-data';

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
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [
            activeWorkOrdersSnapshot,
            historicalWorkOrdersSnapshot,
            categoriesSnapshot,
            statusesSnapshot,
            servicesSnapshot,
            collaboratorsSnapshot,
            vehiclesSnapshot,
            ganttChartsSnapshot,
            suggestedTasksSnapshot,
        ] = await Promise.all([
            getDocs(query(collection(db, "work-orders"), where("status", "!=", "Cerrada"))),
            getDocs(query(collection(db, "work-orders"), where("status", "==", "Cerrada"))),
            getDocs(collection(db, "ot-categories")),
            getDocs(collection(db, "ot-statuses")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "collaborators")),
            getDocs(collection(db, "vehicles")),
            getDocs(collection(db, "gantt-charts")),
            getDocs(collection(db, "suggested-tasks")),
        ]);

        setActiveWorkOrders(activeWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setHistoricalWorkOrders(historicalWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setOtCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTCategory[]);
        setOtStatuses(statusesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTStatus[]);
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
        setCollaborators(collaboratorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Collaborator[]);
        setVehicles(vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[]);
        setGanttCharts(ganttChartsSnapshot.docs.map(doc => {
            const data = doc.data();
            const tasks = (data.tasks || []).map((task: any) => ({
                ...task,
                startDate: task.startDate instanceof Timestamp ? task.startDate.toDate() : new Date(task.startDate),
            }));
            return { id: doc.id, ...data, tasks };
        }) as GanttChart[]);
        
        let loadedTasks = suggestedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SuggestedTask[];

        if (suggestedTasksSnapshot.empty && initialSuggestedTasks.length > 0) {
            const batch = writeBatch(db);
            const newTasks: SuggestedTask[] = [];
            initialSuggestedTasks.forEach(task => {
                const docRef = doc(collection(db, "suggested-tasks"));
                batch.set(docRef, task);
                newTasks.push({ ...task, id: docRef.id });
            });
            await batch.commit();
            loadedTasks = newTasks;
        }

        setSuggestedTasks(loadedTasks);


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

    const originalOrder = getOrder(id);
    if (!originalOrder) return;

    const newStatus = updatedFields.status;
    const oldStatus = originalOrder.status;

    if (newStatus && newStatus.toLowerCase() !== oldStatus.toLowerCase()) {
      const updatedOrder = { ...originalOrder, ...updatedFields };

      if (newStatus.toLowerCase() === 'cerrada') {
        setActiveWorkOrders(prev => prev.filter(order => order.id !== id));
        setHistoricalWorkOrders(prev => [updatedOrder, ...prev.filter(order => order.id !== id)]);
      } else if (oldStatus.toLowerCase() === 'cerrada') {
        setHistoricalWorkOrders(prev => prev.filter(order => order.id !== id));
        setActiveWorkOrders(prev => [updatedOrder, ...prev.filter(order => order.id !== id)]);
      } else {
        setActiveWorkOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      }
    } else {
      // Status didn't change category, just update in place
      setActiveWorkOrders(prev => prev.map(order => order.id === id ? { ...order, ...updatedFields } : order));
      setHistoricalWorkOrders(prev => prev.map(order => order.id === id ? { ...order, ...updatedFields } : order));
    }
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
    const docRef = await addDoc(collection(db, "vehicles"), vehicle);
    const newVehicle = { ...vehicle, id: docRef.id } as Vehicle;
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
        dataToSave.tasks = ganttChart.tasks.map(task => ({
            ...task,
            startDate: Timestamp.fromDate(task.startDate),
        }));
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
    setSuggestedTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateSuggestedTask = async (id: string, updatedTask: Partial<SuggestedTask>) => {
    const docRef = doc(db, "suggested-tasks", id);
    await updateDoc(docRef, updatedTask);
    setSuggestedTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTask } as SuggestedTask : t)));
  };

  const deleteSuggestedTask = async (id: string) => {
    await deleteDoc(doc(db, "suggested-tasks", id));
    setSuggestedTasks(prev => prev.filter(t => t.id !== id));
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
