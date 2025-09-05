
'use server';

import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  SmtpConfig,
  WorkOrder,
  CreateWorkOrderInput,
  AppUser,
  UpdateUserInput,
} from '@/lib/types';
import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import nodemailer from 'nodemailer';
import * as xlsx from 'xlsx';
import { auth, db } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';
import { suggestGanttTasks } from '@/ai/flows/suggest-gantt-tasks';
import type { auth as adminAuth } from 'firebase-admin';
import type { firestore as admin } from 'firebase-admin';

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

type InvoiceRequestEmailData = {
    to: string;
    cc: string;
    subject: string;
    observations?: string;
};

// Simplified WorkOrder type for the action payload
type SerializableWorkOrder = Omit<WorkOrder, 'id' | 'invoices'> & {
  invoices: { id: string, number: string, date: string, amount: number }[];
};


export async function sendInvoiceRequestEmailAction(
    data: InvoiceRequestEmailData,
    order: SerializableWorkOrder,
    config: SmtpConfig
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
        console.error("Error verifying SMTP transporter for invoice request:", error);
        return { success: false, message: `Error de conexión SMTP: ${error.message}` };
    }
    
    const formatCurrency = (value?: number) => {
        if (typeof value !== 'number') return '$0';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    }
    
    const netPrice = order.netPrice || 0;
    const iva = Math.round(netPrice * 0.19);
    const totalPrice = netPrice + iva;

    let invoicesHtml = '';
    if (order.invoices && order.invoices.length > 0) {
        invoicesHtml = `
            <h3 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Facturas Emitidas</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nº Factura</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fecha</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Monto Neto</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.invoices.map(inv => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${inv.number}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${inv.date}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(inv.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    const htmlBody = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: sans-serif; color: #333; }
                .container { max-width: 700px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                h1 { color: #0284c7; } /* primary color */
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .details > div { background-color: #f8fafc; padding: 10px; border-radius: 5px; }
                .details strong { color: #475569; }
                .observations { margin-top: 20px; padding: 15px; background-color: #ffedd5; border-left: 4px solid #f97316; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Solicitud de Facturación de OT</h1>
                </div>
                <h2>Detalles de la Orden de Trabajo</h2>
                <div class="details">
                    <div><strong>Nº OT:</strong> ${order.ot_number}</div>
                    <div><strong>Cliente:</strong> ${order.client}</div>
                    <div><strong>Descripción:</strong> ${order.description}</div>
                    <div><strong>Nº OC:</strong> ${order.ocNumber || 'N/A'}</div>
                    <div><strong>Monto Neto:</strong> ${formatCurrency(netPrice)}</div>
                    <div><strong>Monto Total (IVA incl.):</strong> ${formatCurrency(totalPrice)}</div>
                </div>
                
                ${invoicesHtml}

                ${data.observations ? `
                <div class="observations">
                    <h3>Observaciones Importantes:</h3>
                    <p>${data.observations.replace(/\n/g, '<br>')}</p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: data.to,
        cc: data.cc,
        subject: data.subject,
        html: htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: '¡Correo enviado con éxito!' };
    } catch (error: any) {
        console.error("Error sending invoice request email:", error);
        return { success: false, message: `Error al enviar el correo: ${error.message}` };
    }
}


export async function exportOrdersToExcel(orders: WorkOrder[]): Promise<string> {
    const dataToExport = orders.map(order => {
        const invoices = (order.invoices || []).map(inv => `${inv.number} ($${inv.amount})`).join('; ');
        return {
            'Nº OT': order.ot_number,
            'Descripción': order.description,
            'Cliente': order.client,
            'RUT Cliente': order.rut || '',
            'Servicio': order.service,
            'Fecha Inicio': order.date,
            'Fecha Término': order.endDate || '',
            'Estado': order.status,
            'Prioridad': order.priority,
            'Encargados': (order.assigned || []).join(', '),
            'Técnicos': (order.technicians || []).join(', '),
            'Vehículos': (order.vehicles || []).join(', '),
            'Comercial': order.comercial,
            'Facturas': invoices,
            'Precio Neto': order.netPrice,
            'Nº OC': order.ocNumber || '',
            'Nº Venta': order.saleNumber || '',
            'HES / EM / MIGO': order.hesEmMigo || '',
            'Vehículo Arrendado': order.rentedVehicle || '',
            'Observaciones / Notas Adicionales': order.notes || '',
        };
    });

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Órdenes de Trabajo');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer.toString('base64');
}

const getRoleDetails = (role: AppUser['role']) => {
    switch (role) {
        case 'Admin':
            return `
                <p style="margin: 4px 0;"><strong>Rol:</strong> Admin (Control total)</p>
                <ul style="margin: 4px 0; padding-left: 20px; font-size: 14px;">
                    <li>Ver todo el sistema.</li>
                    <li>Crear, editar y eliminar cualquier registro.</li>
                    <li>Gestionar usuarios y configuraciones.</li>
                </ul>
            `;
        case 'Supervisor':
            return `
                <p style="margin: 4px 0;"><strong>Rol:</strong> Supervisor (Gestión operativa)</p>
                <ul style="margin: 4px 0; padding-left: 20px; font-size: 14px;">
                    <li>Ver todo el sistema.</li>
                    <li>Crear y editar la mayoría de registros.</li>
                    <li>No puede gestionar usuarios ni configuraciones.</li>
                </ul>
            `;
        case 'Técnico':
            return `
                <p style="margin: 4px 0;"><strong>Rol:</strong> Técnico (Ejecución y reportes)</p>
                 <ul style="margin: 4px 0; padding-left: 20px; font-size: 14px;">
                    <li>Solo puede ver módulos operativos.</li>
                    <li>Puede llenar y enviar informes de servicio.</li>
                    <li>No puede crear, editar ni eliminar registros.</li>
                </ul>
            `;
        case 'Visor':
            return `
                <p style="margin: 4px 0;"><strong>Rol:</strong> Visor (Solo lectura)</p>
                 <ul style="margin: 4px 0; padding-left: 20px; font-size: 14px;">
                    <li>Acceso de solo lectura a todo el sistema.</li>
                    <li>No puede realizar ninguna acción de escritura.</li>
                    <li>Ideal para roles de consulta o gerenciales.</li>
                </ul>
            `;
        default:
            return `<p><strong>Rol:</strong> ${role}</p>`;
    }
};

export async function sendInvitationEmailAction(
    user: AppUser,
    password_clear: string,
    loginUrl: string,
    config: SmtpConfig,
    isPasswordChange: boolean = false,
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
    
    const roleDetails = getRoleDetails(user.role);

    const subject = isPasswordChange 
        ? `Actualización de Credenciales - Control de OT de OSESA`
        : `¡Bienvenido a Control de OT de OSESA! Tus credenciales de acceso`;

    const greeting = isPasswordChange
        ? `Se ha actualizado tu contraseña para la plataforma de gestión de operaciones TechFlow. A continuación encontrarás tus credenciales actualizadas.`
        : `Has sido invitado a unirte a la plataforma de gestión de operaciones TechFlow, CONTROL DE OT DE OSESA. A continuación encontrarás tus credenciales de acceso.`;
    
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
            <div class="header"><h1>¡Hola, ${user.displayName}!</h1></div>
            <div class="content">
                <p>${greeting}</p>
                <div class="credentials">
                    <p style="margin: 4px 0;"><strong>Usuario:</strong> ${user.email}</p>
                    <p style="margin: 4px 0;"><strong>Contraseña:</strong> ${password_clear}</p>
                    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 12px 0;">
                    ${roleDetails}
                </div>
                <a href="${loginUrl}" class="button">Iniciar Sesión en TechFlow</a>
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
        return { success: true, message: '¡Correo enviado con éxito!' };
    } catch (error: any) {
        console.error("Error sending user email:", error);
        return { success: false, message: `Error al enviar el correo: ${error.message}` };
    }
}

// User Management Actions
type CreateUserInput = {
  email: string;
  password?: string;
  displayName: string;
  role: 'Admin' | 'Supervisor' | 'Técnico' | 'Visor';
};

export async function createUserAction(userData: CreateUserInput): Promise<{ success: boolean; message: string; user?: AppUser }> {
  try {
    const userRecord: UserRecord = await (auth as adminAuth.Auth).createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true,
      disabled: false,
    });

    await (auth as adminAuth.Auth).setCustomUserClaims(userRecord.uid, { role: userData.role });

    const newUser: AppUser = {
      uid: userRecord.uid,
      email: userRecord.email!,
      displayName: userRecord.displayName!,
      role: userData.role,
      status: 'Activo',
    };

    await (db as admin.firestore.Firestore).collection('users').doc(userRecord.uid).set(newUser);
    return { success: true, message: 'Usuario creado exitosamente.', user: newUser };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, message: error.message };
  }
}

export async function updateUserAction(uid: string, data: Partial<AppUser>): Promise<{ success: boolean; message: string }> {
  try {
    const updatePayload: Partial<adminAuth.UpdateRequest> = {};
    if (data.displayName) {
        updatePayload.displayName = data.displayName;
    }
    if (data.email) {
        updatePayload.email = data.email;
    }
    if (Object.keys(updatePayload).length > 0) {
        await (auth as adminAuth.Auth).updateUser(uid, updatePayload);
    }
    
    if (data.role) {
        await (auth as adminAuth.Auth).setCustomUserClaims(uid, { role: data.role });
    }
    await (db as admin.firestore.Firestore).collection('users').doc(uid).update(data);
    return { success: true, message: 'Usuario actualizado.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
    try {
        await (auth as adminAuth.Auth).deleteUser(uid);
        await (db as admin.firestore.Firestore).collection('users').doc(uid).delete();
        return { success: true, message: 'Usuario eliminado exitosamente.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    const isDisabled = newStatus === 'Inactivo';
    try {
        await (auth as adminAuth.Auth).updateUser(uid, { disabled: isDisabled });
        await (db as admin.firestore.Firestore).collection('users').doc(uid).update({ status: newStatus });
        return { success: true, message: 'Estado del usuario actualizado.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function changeUserPasswordAction(
    user: AppUser, 
    newPassword: string,
    config: SmtpConfig | null,
    loginUrl: string,
): Promise<{ success: boolean; message: string }> {
    try {
        await (auth as adminAuth.Auth).updateUser(user.uid, { password: newPassword });
        
        // After successfully changing the password, send the notification email
        if (config) {
            await sendInvitationEmailAction(user, newPassword, loginUrl, config, true);
        }

        return { success: true, message: 'Contraseña cambiada exitosamente.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

    