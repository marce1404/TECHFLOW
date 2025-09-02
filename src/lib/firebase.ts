import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


export const firebaseConfig = {
  projectId: 'techflow-operations-manager',
  appId: '1:680065190644:web:8ac04a3990094f82696ca1',
  storageBucket: 'techflow-operations-manager.appspot.com',
  apiKey: 'AIzaSyBNg61wt8k2Bd9MRGjQTEw6Vj6q6UbPrJM',
  authDomain: 'techflow-operations-manager.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '680065190644',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


export { app, db, auth, storage };
