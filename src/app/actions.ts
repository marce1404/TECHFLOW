
'use server';

import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  SmtpConfig,
  WorkOrder,
  CreateWorkOrderInput,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import * as xlsx from 'xlsx';
import { createWorkOrderFromApi } from '@/ai/flows/create-ot-from-api';


// This function ensures Firebase Admin is initialized, but only once.
const initializeFirebaseAdmin = () => {
    
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountBase64) {
            throw new Error("Firebase service account JSON not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_JSON.");
        }
        
        const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

    } catch (error: any) {
        console.error('Firebase Admin initialization error', error.message);
        throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
    }
};


// --- Server Actions ---

export async function getResourceSuggestions(
  input: SuggestOptimalResourceAssignmentInput
): Promise<SuggestOptimalResourceAssignmentOutputWithError> {
  try {
    const result = await suggestOptimalResourceAssignment(input);
    return result;
  } catch (error) {
    console.error('Error getting resource suggestions:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.deleteUser(uid);
    await firestore.collection('users').doc(uid).delete();

    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Error al eliminar el usuario.' };
  }
}

export async function changeUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    await auth.updateUser(uid, { password: newPassword });
    return { success: true, message: `Contraseña actualizada correctamente.` };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, message: error.message || 'Error al cambiar la contraseña.' };
  }
}


export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.updateUser(uid, { disabled: newStatus === 'Inactivo' });
    await firestore.collection('users').doc(uid).update({ status: newStatus });
    
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}

export async function sendTestEmailAction(config: SmtpConfig, to: string): Promise<{ success: boolean; message: string }> {
  const { host, port, secure, user, pass, fromName, fromEmail } = config;

  let transporter;
  try {
     transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure === 'ssl', // true for 465, false for other ports
        auth: { user, pass },
        ...(secure === 'starttls' && { tls: { ciphers: 'SSLv3' }})
    });
  } catch (error: any) {
    console.error("Error creating transporter:", error);
    return { success: false, message: `Error de configuración del transporter: ${error.message}` };
  }
 
  try {
    await transporter.verify();
  } catch (error: any) {
     console.error("Error verifying transporter:", error);
     return { success: false, message: `Error de verificación del servidor: ${error.message}. Revisa el host, puerto y seguridad.` };
  }

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: to,
    subject: 'Correo de Prueba - TechFlow',
    text: 'Este es un correo de prueba para verificar tu configuración SMTP en TechFlow.',
    html: '<h3>Correo de Prueba</h3><p>Este es un correo de prueba para verificar tu configuración SMTP en <strong>TechFlow</strong>.</p><p>Si recibiste esto, ¡la configuración es correcta!</p>',
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: '¡Correo de prueba enviado con éxito! Revisa tu bandeja de entrada.' };
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return { success: false, message: `Error al enviar el correo: ${error.message}. Revisa el usuario, contraseña y permisos.` };
  }
}

export async function sendReportEmailAction(
    to: string,
    cc: string[],
    subject: string,
    htmlBody: string,
    config: SmtpConfig | null,
): Promise<{ success: boolean; message: string }> {
    if (!config) {
        return { success: false, message: 'La configuración SMTP no ha sido establecida.' };
    }
    const { host, port, secure, user, pass, fromName, fromEmail } = config;

    let transporter;
    try {
        transporter = nodemailer.createTransport({
            host, port, secure: secure === 'ssl', auth: { user, pass },
             ...(secure === 'starttls' && { tls: { ciphers: 'SSLv3' }})
        });
        await transporter.verify();
    } catch (error: any) {
        console.error("Error verifying SMTP transporter:", error);
        return { success: false, message: `Error de conexión SMTP: ${error.message}` };
    }
    
    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        cc: cc.join(','),
        subject,
        html: htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: '¡Correo enviado con éxito!' };
    } catch (error: any) {
        console.error("Error sending report email:", error);
        return { success: false, message: `Error al enviar el correo: ${error.message}` };
    }
}


export async function exportOrdersToExcel(orders: WorkOrder[]): Promise<string> {
    const dataToExport = orders.map(order => ({
        'Nº OT': order.ot_number,
        'Descripción': order.description,
        'Cliente': order.client,
        'RUT Cliente': order.rut || '',
        'Servicio': order.service,
        'Fecha Inicio': order.date,
        'Fecha Término': order.endDate || '',
        'Estado': order.status,
        'Prioridad': order.priority,
        'Encargados': order.assigned.join(', '),
        'Técnicos': order.technicians.join(', '),
        'Vehículos': order.vehicles.join(', '),
        'Comercial': order.comercial,
        'Precio Neto': order.netPrice,
        'Facturado': order.facturado ? 'Sí' : 'No',
        'Nº Factura': order.invoiceNumber || '',
        'Nº OC': order.ocNumber || '',
        'Nº Venta': order.saleNumber || '',
        'HES / EM / MIGO': order.hesEmMigo || '',
        'Vehículo Arrendado': order.rentedVehicle || '',
        'Observaciones / Notas Adicionales': order.notes || '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Órdenes de Trabajo');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer.toString('base64');
}

export async function importOrdersFromExcel(ordersData: CreateWorkOrderInput[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const orderData of ordersData) {
        try {
            const result = await createWorkOrderFromApi(orderData);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                errors.push(`OT ${orderData.ot_number}: ${result.message}`);
            }
        } catch (error: any) {
            errorCount++;
            errors.push(`OT ${orderData.ot_number}: Error inesperado - ${error.message}`);
        }
    }

    return { successCount, errorCount, errors };
}
