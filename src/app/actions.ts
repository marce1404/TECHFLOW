
'use server';

import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  SmtpConfig,
  WorkOrder,
  CreateWorkOrderInput,
  AppUser,
} from '@/lib/types';
import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { db as adminDb, storage as adminStorage } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';
import * as xlsx from 'xlsx';
import {
  deleteUserAction as deleteUserActionAdmin,
  changeUserPasswordAction as changeUserPasswordActionAdmin,
  toggleUserStatusAction as toggleUserStatusActionAdmin,
  updateUserAction as updateUserActionAdmin,
  createUserAction as createUserActionAdmin,
  listUsersAction as listUsersActionAdmin,
} from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';


// --- Server Actions ---

export const createUserAction = createUserActionAdmin;
export const deleteUserAction = deleteUserActionAdmin;
export const changeUserPasswordAction = changeUserPasswordActionAdmin;
export const toggleUserStatusAction = toggleUserStatusActionAdmin;
export const updateUserAction = updateUserActionAdmin;
export const listUsersAction = listUsersActionAdmin;


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
    config: SmtpConfig,
): Promise<{ success: boolean; message: string }> {
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
        'Facturado': order.facturado ? 'Sí' : 'No',
        'Precio Neto': order.netPrice,
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

async function createOrUpdateWorkOrder(input: CreateWorkOrderInput) {
  if (!(adminDb as any).collection) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const workOrderData = {
      ...input,
      facturado: !!input.invoiceNumber,
    };

    const docRef = await (adminDb as any).collection("work-orders").add(workOrderData);
    return {
      success: true,
      orderId: docRef.id,
      message: 'Work order created successfully.',
    };
  } catch (error) {
    console.error('Error creating work order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      success: false,
      message: `Failed to process work order: ${errorMessage}`,
    };
  }
}


export async function importOrdersFromExcel(ordersData: CreateWorkOrderInput[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const orderData of ordersData) {
        try {
            const result = await createOrUpdateWorkOrder(orderData);
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

export async function sendInvitationEmailAction(
    user: AppUser,
    password_clear: string,
    appUrl: string,
    config: SmtpConfig,
): Promise<{ success: boolean; message: string }> {
    const { host, port, secure, user: smtpUser, pass, fromName, fromEmail } = config;

    let transporter;
    try {
        transporter = nodemailer.createTransport({
            host, port, secure: secure === 'ssl', auth: { user: smtpUser, pass },
             ...(secure === 'starttls' && { tls: { ciphers: 'SSLv3' }})
        });
        await transporter.verify();
    } catch (error: any) {
        console.error("Error verifying SMTP transporter:", error);
        return { success: false, message: `Error de conexión SMTP: ${error.message}` };
    }

    const subject = `¡Bienvenido a Control de OT de OSESA! Tus credenciales de acceso`;
    const htmlBody = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
            .header { background-color: #3CA7FA; color: #ffffff; padding: 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 24px; }
            .content p { line-height: 1.6; font-size: 16px; }
            .credentials { background-color: #f1f5f9; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .credentials strong { color: #3CA7FA; }
            .button { display: inline-block; background-color: #3CA7FA; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
            .footer { background-color: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>¡Bienvenido a TechFlow!</h1></div>
            <div class="content">
                <p>Hola ${user.displayName},</p>
                <p>Has sido invitado a unirte a la plataforma de gestión de operaciones TechFlow, CONTROL DE OT DE OSESA. A continuación encontrarás tus credenciales para acceder al sistema.</p>
                <div class="credentials">
                    <p><strong>Usuario:</strong> ${user.email}</p>
                    <p><strong>Contraseña:</strong> ${password_clear}</p>
                </div>
                <p>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
                <a href="${appUrl}" class="button">Iniciar Sesión en TechFlow</a>
            </div>
            <div class="footer">
                <p>Si tienes problemas para acceder, por favor contacta a tu administrador.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: user.email,
        subject,
        html: htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: '¡Correo de invitación enviado con éxito!' };
    } catch (error: any) {
        console.error("Error sending invitation email:", error);
        return { success: false, message: `Error al enviar el correo: ${error.message}` };
    }
}

export async function deleteAllWorkOrdersAction(): Promise<{ success: boolean; message: string; deletedCount: number }> {
  if (!(adminDb as any).collection) return { success: false, message: 'Firebase Admin not initialized.', deletedCount: 0 };
  try {
    const collectionRef = (adminDb as any).collection('work-orders');
    
    let deletedCount = 0;
    
    while (true) {
        const snapshot = await collectionRef.limit(500).get();
        if (snapshot.empty) {
            break; // No more documents to delete
        }
        
        const batch = (adminDb as any).batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        deletedCount += snapshot.size;
    }


    return { success: true, message: `Se eliminaron ${deletedCount} órdenes de trabajo.`, deletedCount };
  } catch (error) {
    console.error("Error deleting all work orders:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Error al limpiar la base de datos: ${errorMessage}`, deletedCount: 0 };
  }
}

export async function uploadLogoAction({
  fileDataUri,
}: {
  fileDataUri: string;
}): Promise<{ success: boolean; message: string; url?: string }> {
  if (!(adminStorage as Storage).bucket) {
    return { success: false, message: "Firebase Storage no está inicializado." };
  }

  const bucket = (adminStorage as Storage).bucket();
  const filePath = `company/logo`; // Overwrite the same file

  // Extract content type and base64 data from data URI
  const match = fileDataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return { success: false, message: "Formato de Data URI inválido." };
  }
  const contentType = match[1];
  const base64Data = match[2];
  const fileBuffer = Buffer.from(base64Data, 'base64');
  
  const file = bucket.file(filePath);

  const stream = file.createWriteStream({
    metadata: {
      contentType: contentType,
      // Make the file publicly readable
      cacheControl: 'public, max-age=31536000',
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      console.error("Error subiendo el logo:", err);
      reject({ success: false, message: "Error al subir el archivo." });
    });

    stream.on('finish', async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        resolve({ success: true, message: "Logo subido exitosamente", url: publicUrl });
      } catch (err) {
        console.error("Error al hacer el archivo público:", err);
        reject({ success: false, message: "Error al publicar el archivo." });
      }
    });

    stream.end(fileBuffer);
  });
}
    
