
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkOrder, OTCategory, Service, Technician, Vehicle } from '@/lib/types';
import { otCategories as initialCategories, services as initialServices, technicians as initialTechnicians, vehicles as initialVehicles } from '@/lib/placeholder-data';

interface WorkOrdersContextType {
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  otCategories: OTCategory[];
  services: Service[];
  technicians: Technician[];
  vehicles: Vehicle[];
  updateOrder: (id: string, updatedOrder: WorkOrder) => void;
  getOrder: (id: string) => WorkOrder | undefined;
  setActiveWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  setHistoricalWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  addCategory: (category: Omit<OTCategory, 'id'>) => void;
  updateCategory: (id: string, category: OTCategory) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Service) => void;
  deleteService: (id: string) => void;
  addOrder: (order: Omit<WorkOrder, 'id'>) => void;
  getNextOtNumber: (prefix: string) => string;
  addTechnician: (technician: Omit<Technician, 'id'>) => Technician;
  updateTechnician: (id: string, technician: Omit<Technician, 'id'> | Technician) => void;
  deleteTechnician: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, vehicle: Omit<Vehicle, 'id'> | Vehicle) => void;
  deleteVehicle: (id: string) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children, active, historical, technicians: initialTechniciansData, vehicles: initialVehiclesData }: { children: ReactNode, active: WorkOrder[], historical: WorkOrder[], technicians: Technician[], vehicles: Vehicle[] }) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>(active);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>(historical);
  const [otCategories, setOtCategories] = useState<OTCategory[]>(initialCategories);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechniciansData);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehiclesData);

  const getNextOtNumber = (prefix: string) => {
    const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
    const relevantOrders = allOrders.filter(o => o.ot_number.startsWith(prefix + '-'));
    
    if (relevantOrders.length === 0) {
      return `${prefix}-1`;
    }
    
    const maxNumber = Math.max(
      ...relevantOrders.map(o => parseInt(o.ot_number.split('-')[1] || '0', 10))
    );
    
    return `${prefix}-${maxNumber + 1}`;
  };

  const addOrder = (order: Omit<WorkOrder, 'id'>) => {
    const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
    const newId = (Math.max(0, ...allOrders.map(o => parseInt(o.id, 10))) + 1).toString();
    const newOrder: WorkOrder = { id: newId, ...order };

    if (newOrder.status === 'Cerrada') {
      setHistoricalWorkOrders(prev => [newOrder, ...prev]);
    } else {
      setActiveWorkOrders(prev => [newOrder, ...prev]);
    }
  };
  
  const updateOrder = (id: string, updatedOrder: WorkOrder) => {
    const isCurrentlyActive = activeWorkOrders.some(order => order.id === id);
    const isCurrentlyHistorical = historicalWorkOrders.some(order => order.id === id);

    if (updatedOrder.status === 'Cerrada') {
      if(isCurrentlyActive) {
        setActiveWorkOrders(prev => prev.filter(order => order.id !== id));
        setHistoricalWorkOrders(prev => [...prev, updatedOrder]);
      } else if (isCurrentlyHistorical) {
        setHistoricalWorkOrders(prev => prev.map(order => (order.id === id ? updatedOrder : order)));
      }
    } else {
      if(isCurrentlyHistorical) {
        setHistoricalWorkOrders(prev => prev.filter(order => order.id !== id));
        setActiveWorkOrders(prev => [...prev, updatedOrder]);
      } else if (isCurrentlyActive) {
        setActiveWorkOrders(prev => prev.map(order => (order.id === id ? updatedOrder : order)));
      } else {
        // If it doesn't exist in either, add to active (e.g. new order)
        setActiveWorkOrders(prev => [...prev, updatedOrder]);
      }
    }
  };

  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
  };
  
  const addCategory = (category: Omit<OTCategory, 'id'>) => {
    const newId = (Math.max(0, ...otCategories.map(c => parseInt(c.id, 10))) + 1).toString();
    setOtCategories(prev => [...prev, { ...category, id: newId }]);
  };

  const updateCategory = (id: string, updatedCategory: OTCategory) => {
    setOtCategories(prev => prev.map(cat => (cat.id === id ? updatedCategory : cat)));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newId = (Math.max(0, ...services.map(s => parseInt(s.id, 10))) + 1).toString();
    setServices(prev => [...prev, { ...service, id: newId }]);
  };

  const updateService = (id: string, updatedService: Service) => {
    setServices(prev => prev.map(s => (s.id === id ? updatedService : s)));
  };
  
  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };
  
  const addTechnician = (technician: Omit<Technician, 'id'>): Technician => {
    const newId = (Math.max(0, ...technicians.map(t => parseInt(t.id, 10))) + 1).toString();
    const newTechnician = { ...technician, id: newId };
    setTechnicians(prev => [...prev, newTechnician]);
    return newTechnician;
  };

  const updateTechnician = (id: string, updatedTechnician: Omit<Technician, 'id'> | Technician) => {
    setTechnicians(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTechnician} : t)));
  };

  const deleteTechnician = (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
  };
  
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newId = (Math.max(0, ...vehicles.map(v => parseInt(v.id, 10))) + 1).toString();
    setVehicles(prev => [{ ...vehicle, id: newId }, ...prev]);
  };

  const updateVehicle = (id: string, updatedVehicle: Omit<Vehicle, 'id'> | Vehicle) => {
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ...updatedVehicle} : v)));
  };

  const deleteVehicle = (id: string) => {
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
        updateOrder, 
        getOrder, 
        setActiveWorkOrders, 
        setHistoricalWorkOrders,
        addCategory,
        updateCategory,
        addService,
        updateService,
        deleteService,
        addOrder,
        getNextOtNumber,
        addTechnician,
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
