
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkOrder, OTCategory, Service } from '@/lib/types';
import { otCategories as initialCategories, services as initialServices } from '@/lib/placeholder-data';

interface WorkOrdersContextType {
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  otCategories: OTCategory[];
  services: Service[];
  updateOrder: (id: string, updatedOrder: WorkOrder) => void;
  getOrder: (id: string) => WorkOrder | undefined;
  setActiveWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  setHistoricalWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  addCategory: (category: Omit<OTCategory, 'id'>) => void;
  updateCategory: (id: string, category: OTCategory) => void;
  deleteCategory: (id: string) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Service) => void;
  deleteService: (id: string) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children, active, historical }: { children: ReactNode, active: WorkOrder[], historical: WorkOrder[] }) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>(active);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>(historical);
  const [otCategories, setOtCategories] = useState<OTCategory[]>(initialCategories);
  const [services, setServices] = useState<Service[]>(initialServices);

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
  
  const deleteCategory = (id: string) => {
    setOtCategories(prev => prev.filter(c => c.id !== id));
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

  return (
    <WorkOrdersContext.Provider value={{ 
        activeWorkOrders, 
        historicalWorkOrders, 
        otCategories,
        services,
        updateOrder, 
        getOrder, 
        setActiveWorkOrders, 
        setHistoricalWorkOrders,
        addCategory,
        updateCategory,
        deleteCategory,
        addService,
        updateService,
        deleteService,
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
