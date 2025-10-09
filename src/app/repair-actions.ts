'use server';

import { db } from '@/lib/firebase-admin';
import type { firestore as admin } from 'firebase-admin';
import type { WorkOrder } from '@/lib/types';

export const repairImportedWorkOrdersAction = async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
        const workOrdersRef = (db as admin.firestore.Firestore).collection('work-orders');
        const snapshot = await workOrdersRef.get();

        if (snapshot.empty) {
            return { success: true, message: 'No hay órdenes de trabajo para procesar.', count: 0 };
        }

        const batch = (db as admin.firestore.Firestore).batch();
        let updatedCount = 0;

        snapshot.forEach(doc => {
            const order = doc.data() as WorkOrder;
            // The signature of an incorrectly imported order is that date and createdAt are identical
            if (order.date && order.createdAt && order.date === order.createdAt) {
                batch.update(doc.ref, { date: '' });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
        }

        return { success: true, message: `Se han reparado ${updatedCount} órdenes de trabajo.`, count: updatedCount };

    } catch (error: any) {
        console.error('Error repairing work orders:', error);
        return { success: false, message: error.message, count: 0 };
    }
}
