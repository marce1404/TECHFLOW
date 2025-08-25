
import 'dotenv/config'; // Load environment variables
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { type AppUser } from '@/lib/types';
import { firebaseConfig } from '@/lib/firebase';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    throw new Error('Firebase service account key not found in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}

// POST handler to create user profile in Firestore
export async function POST(request: Request) {
  try {
    initializeAdminApp();
    const userProfile: AppUser = await request.json();

    const db = admin.firestore();
    await db.collection('users').doc(userProfile.uid).set(userProfile);

    return NextResponse.json({ success: true, message: 'User profile created successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('API Error creating user profile:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create user profile.' }, { status: 500 });
  }
}


// PUT handler to update user name and role
export async function PUT(request: Request) {
  try {
    initializeAdminApp();
    const { uid, name, role }: { uid: string, name: string, role: AppUser['role']} = await request.json();
    
    if (!uid || !name || !role) {
        return NextResponse.json({ success: false, message: 'UID, name, and role are required.' }, { status: 400 });
    }

    const db = admin.firestore();
    const auth = admin.auth();

    // Update Firestore document
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      displayName: name,
      role: role,
    });

    // Update Firebase Auth display name
    await auth.updateUser(uid, {
        displayName: name
    });

    return NextResponse.json({ success: true, message: 'User updated successfully.' });
  } catch (error: any) {
    console.error('API Error updating user:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update user.' }, { status: 500 });
  }
}
