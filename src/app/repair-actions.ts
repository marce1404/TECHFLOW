'use server';

import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const repairImportedWorkOrdersAction = async (): Promise<{ success: boolean; message: string, updatedCount: number }> => {
  try {
    const workOrdersRef = collection(db, 'work-orders');
    const snapshot = await getDocs(workOrdersRef);
    
    const batch = writeBatch(db);
    let updatedCount = 0;

    snapshot.forEach(doc => {
      const order = doc.data();
      // The sign of an incorrectly imported order is that `date` (start date) is the same as `createdAt`
      if (order.date && order.createdAt && order.date === order.createdAt) {
        batch.update(doc.ref, { date: '' }); // Reset the start date
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }
    
    return { success: true, message: 'Reparación completada.', updatedCount };

  } catch (error: any) {
    console.error("Error repairing work orders:", error);
    return { success: false, message: `Error en el servidor: ${error.message}`, updatedCount: 0 };
  }
};
