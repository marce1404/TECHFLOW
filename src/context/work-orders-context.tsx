
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { activeWorkOrders as initialActiveWorkOrders, historicalWorkOrders as initialHistoricalWorkOrders } from '@/lib/placeholder-data';
import type { WorkOrder } from '@/lib/types';

interface WorkOrdersContextType {
  activeWorkOrders: WorkOrder[];
  historicalWorkOrders: WorkOrder[];
  updateOrder: (id: string, updatedOrder: WorkOrder) => void;
  getOrder: (id: string) => WorkOrder | undefined;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export const WorkOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>(initialActiveWorkOrders);
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<WorkOrder[]>(initialHistoricalWorkOrders);

  const updateOrder = (id: string, updatedOrder: WorkOrder) => {
    const updateList = (orders: WorkOrder[]) => orders.map(order => (order.id === id ? updatedOrder : order));
    
    setActiveWorkOrders(updateList(activeWorkOrders));
    setHistoricalWorkOrders(updateList(historicalWorkOrders));
  };

  const getOrder = (id: string) => {
    return [...activeWorkOrders, ...historicalWorkOrders].find(order => order.id === id);
  };

  return (
    <WorkOrdersContext.Provider value={{ activeWorkOrders, historicalWorkOrders, updateOrder, getOrder }}>
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
