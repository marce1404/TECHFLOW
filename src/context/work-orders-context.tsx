
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkOrder } from '@/lib/types';

interface WorkOrdersContextType {
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  updateOrder: (id: string, updatedOrder: WorkOrder) => void;
  getOrder: (id: string) => WorkOrder | undefined;
  setActiveWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  setHistoricalWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children, active, historical }: { children: ReactNode, active: WorkOrder[], historical: WorkOrder[] }) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>(active);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>(historical);

  const updateOrder = (id: string, updatedOrder: WorkOrder) => {
    const updateList = (orders: WorkOrder[]) => orders.map(order => (order.id === id ? updatedOrder : order));
    
    setActiveWorkOrders(updateList(activeWorkOrders));
    setHistoricalWorkOrders(updateList(historicalWorkOrders));
  };

  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
  };

  return (
    <WorkOrdersContext.Provider value={{ activeWorkOrders, historicalWorkOrders, updateOrder, getOrder, setActiveWorkOrders, setHistoricalWorkOrders }}>
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
