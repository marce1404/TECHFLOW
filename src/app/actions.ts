
'use server';

import 'dotenv/config';
import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  type GanttChart,
  SmtpConfig,
  SubmittedReport,
  ReportTemplate,
  AppUser,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, doc, getDoc } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';


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

async function getReportHtml(reportId: string): Promise<string> {
    initializeFirebaseAdmin();
    const db = getFirestore();
    
    const reportRef = doc(db, 'submitted-reports', reportId);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) throw new Error('Report not found');
    const reportData = reportSnap.data();
    const report = { id: reportSnap.id, ...reportData } as SubmittedReport;

    const templateRef = doc(db, 'report-templates', report.templateId);
    const templateSnap = await getDoc(templateRef);
    if (!templateSnap.exists()) throw new Error('Template not found');
    const template = { id: templateSnap.id, ...templateSnap.data() } as ReportTemplate;

    const companyInfoSnap = await getDoc(doc(db, 'settings', 'companyInfo'));
    const companyInfo = companyInfoSnap.exists() ? companyInfoSnap.data() : { name: 'TechFlow', slogan: '' };
    
    const submittedDate = report.submittedAt instanceof Timestamp 
        ? report.submittedAt.toDate().toLocaleDateString('es-CL') 
        : 'N/A';
    const shortFolio = report.id.substring(report.id.length - 6).toUpperCase();

    let html = `
        <h1 style="font-family: sans-serif; color: #333;">${template.name} - Folio: ${shortFolio}</h1>
        <p>Fecha de Emisión: ${submittedDate}</p>
        <hr>
        <h2>Información de la OT</h2>
        <p><strong>Nº OT:</strong> ${report.otDetails.ot_number}</p>
        <p><strong>Cliente:</strong> ${report.otDetails.client}</p>
        <p><strong>Descripción:</strong> ${report.otDetails.description}</p>
        <hr>
        <h2>Detalles del Servicio</h2>
    `;
    template.fields.forEach(field => {
        const value = report.reportData[field.name];
        if (value !== undefined && value !== null && value !== '') {
             html += `<p><strong>${field.label}:</strong> ${String(value)}</p>`;
        }
    });
    html += '<hr><p>Gracias por su preferencia.</p>';

    return html;
}

export async function sendReportEmailAction(
    reportId: string,
    to: string,
    cc: string[],
): Promise<{ success: boolean; message: string }> {
    initializeFirebaseAdmin();
    const db = getFirestore();
    
    const smtpSnap = await getDoc(doc(db, 'settings', 'smtpConfig'));
    if (!smtpSnap.exists()) {
        return { success: false, message: 'La configuración SMTP no ha sido establecida.' };
    }
    const config = smtpSnap.data() as SmtpConfig;
    const { host, port, secure, user, pass, fromName, fromEmail } = config;

    const reportSnap = await getDoc(doc(db, 'submitted-reports', reportId));
    if (!reportSnap.exists()) {
        return { success: false, message: 'Informe no encontrado.' };
    }
    const report = reportSnap.data() as SubmittedReport;


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
    
    const reportHtml = await getReportHtml(reportId);

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        cc: cc.join(','),
        subject: `Informe de Servicio - OT ${report.otDetails.ot_number}`,
        html: `<p>Estimado Cliente,</p>
               <p>Adjunto encontrará el informe técnico correspondiente al servicio realizado.</p>
               <p>Agradeceríamos nos pudiera responder este correo con sus comentarios y la recepción conforme del servicio.</p>
               <br>
               <p>Saludos cordiales,</p>
               <p><strong>El Equipo de ${fromName}</strong></p>`,
        attachments: [
            {
                filename: `Informe_OT_${report.otDetails.ot_number}.html`,
                content: reportHtml,
                contentType: 'text/html'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: '¡Correo enviado con éxito!' };
    } catch (error: any) {
        console.error("Error sending report email:", error);
        return { success: false, message: `Error al enviar el correo: ${error.message}` };
    }
}
