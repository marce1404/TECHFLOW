
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, OTCategory, Service, Technician, Vehicle } from '@/lib/types';

interface WorkOrdersContextType {
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  otCategories: OTCategory[];
  services: Service[];
  technicians: Technician[];
  vehicles: Vehicle[];
  loading: boolean;
  fetchData: () => Promise<void>;
  updateOrder: (id: string, updatedOrder: Partial<WorkOrder>) => Promise<void>;
  getOrder: (id: string) => WorkOrder | undefined;
  addCategory: (category: Omit<OTCategory, 'id' | 'status'> & { status: string }) => Promise<OTCategory>;
  updateCategory: (id: string, category: Partial<OTCategory>) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'status'> & { status: string }) => Promise<Service>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addOrder: (order: Omit<WorkOrder, 'id'>) => Promise<WorkOrder>;
  getNextOtNumber: (prefix: string) => string;
  addTechnician: (technician: Omit<Technician, 'id'>) => Promise<Technician>;
  getTechnician: (id: string) => Technician | undefined;
  updateTechnician: (id: string, technician: Partial<Omit<Technician, 'id'>>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (id: string, vehicle: Partial<Omit<Vehicle, 'id'>>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>([]);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>([]);
  const [otCategories, setOtCategories] = useState<OTCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
        setLoading(true);
        const [
            activeWorkOrdersSnapshot,
            historicalWorkOrdersSnapshot,
            categoriesSnapshot,
            servicesSnapshot,
            techniciansSnapshot,
            vehiclesSnapshot
        ] = await Promise.all([
            getDocs(query(collection(db, "work-orders"), where("status", "!=", "Cerrada"))),
            getDocs(query(collection(db, "work-orders"), where("status", "==", "Cerrada"))),
            getDocs(collection(db, "ot-categories")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "technicians")),
            getDocs(collection(db, "vehicles")),
        ]);

        setActiveWorkOrders(activeWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setHistoricalWorkOrders(historicalWorkOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkOrder[]);
        setOtCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OTCategory[]);
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
        setTechnicians(techniciansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Technician[]);
        setVehicles(vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[]);

    } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
        // Fallback to empty arrays on error
        setActiveWorkOrders([]);
        setHistoricalWorkOrders([]);
        setOtCategories([]);
        setServices([]);
        setTechnicians([]);
        setVehicles([]);
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
    if (newOrder.status === 'Cerrada') {
      setHistoricalWorkOrders(prev => [newOrder, ...prev]);
    } else {
      setActiveWorkOrders(prev => [newOrder, ...prev]);
    }
    return newOrder;
  };
  
  const updateOrder = async (id: string, updatedFields: Partial<WorkOrder>) => {
    const docRef = doc(db, "work-orders", id);
    await updateDoc(docRef, updatedFields);
    
    const updatedOrder = { ...getOrder(id), ...updatedFields } as WorkOrder;

    if (updatedFields.status === 'Cerrada') {
        setActiveWorkOrders(prev => prev.filter(order => order.id !== id));
        setHistoricalWorkOrders(prev => {
            if (prev.some(o => o.id === id)) {
                return prev.map(o => o.id === id ? updatedOrder : o)
            }
            return [...prev, updatedOrder]
        });
    } else { 
        setHistoricalWorkOrders(prev => prev.filter(order => order.id !== id));
        setActiveWorkOrders(prev => {
            if (prev.some(o => o.id === id)) {
                 return prev.map(o => o.id === id ? updatedOrder : o)
            }
            return [...prev, updatedOrder]
        });
    }
  };

  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
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
  
  const addTechnician = async (technician: Omit<Technician, 'id'>): Promise<Technician> => {
    const docRef = await addDoc(collection(db, "technicians"), technician);
    const newTechnician = { ...technician, id: docRef.id } as Technician;
    setTechnicians(prev => [...prev, newTechnician]);
    return newTechnician;
  };
  
  const getTechnician = (id: string) => {
    return technicians.find(technician => technician.id === id);
  };

  const updateTechnician = async (id: string, updatedTechnician: Partial<Omit<Technician, 'id'>>) => {
    const docRef = doc(db, "technicians", id);
    await updateDoc(docRef, updatedTechnician);
    setTechnicians(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTechnician} as Technician : t)));
  };

  const deleteTechnician = async (id: string) => {
    await deleteDoc(doc(db, "technicians", id));
    setTechnicians(prev => prev.filter(t => t.id !== id));
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

  return (
    <WorkOrdersContext.Provider value={{ 
        activeWorkOrders, 
        historicalWorkOrders, 
        otCategories,
        services,
        technicians,
        vehicles,
        loading,
        fetchData,
        updateOrder, 
        getOrder, 
        addCategory,
        updateCategory,
        addService,
        updateService,
        deleteService,
        addOrder,
        getNextOtNumber,
        addTechnician,
        getTechnician,
        updateTechnician,
        deleteTechnician,
        addVehicle,
        updateVehicle,
        deleteVehicle,
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
