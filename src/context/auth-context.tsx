
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { listUsers } from '@/app/actions';


interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  users: AppUser[];
  fetchUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => doc.data() as AppUser);
        setUsers(usersList);
    } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
    }
  }, []);
  
  const syncFirebaseAuthToFirestore = useCallback(async () => {
    try {
      const authUsersResult = await listUsers();
      if (!authUsersResult.success) {
        console.error("Failed to list Auth users:", authUsersResult.message);
        return;
      }

      const authUsers = authUsersResult.users || [];
      const firestoreUsersSnapshot = await getDocs(collection(db, 'users'));
      const firestoreUsersMap = new Map(firestoreUsersSnapshot.docs.map(doc => [doc.id, doc.data() as AppUser]));

      const batch = writeBatch(db);
      let writes = 0;

      for (const authUser of authUsers) {
        if (!firestoreUsersMap.has(authUser.uid)) {
          console.log(`Creating missing Firestore profile for UID: ${authUser.uid}`);
          const newUserProfile: AppUser = {
            uid: authUser.uid,
            email: authUser.email!,
            displayName: authUser.displayName || authUser.email!.split('@')[0],
            role: 'Visor',
            status: authUser.disabled ? 'Inactivo' : 'Activo',
          };
          const userDocRef = doc(db, "users", authUser.uid);
          batch.set(userDocRef, newUserProfile);
          writes++;
        }
      }

      if (writes > 0) {
        await batch.commit();
        console.log(`Batch committed. ${writes} new user profiles created in Firestore.`);
      }
    } catch (error) {
      console.error("Error during FirebaseAuth to Firestore sync:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync Auth users to Firestore first
        await syncFirebaseAuthToFirestore();
        
        // Now fetch all users from Firestore
        await fetchUsers();
        
        // Get the current user's profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as AppUser);
        } else {
          // This case should be less frequent now, but kept as a fallback.
          setUserProfile(null);
        }

      } else {
        setUserProfile(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUsers, syncFirebaseAuthToFirestore]);

  if (loading) {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 border-b">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="flex flex-1">
                <div className="w-64 p-4 border-r">
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-8">
                    <Skeleton className="h-12 w-1/2 mb-8" />
                    <div className="grid grid-cols-5 gap-4">
                         {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full" />
                        ))}
                    </div>
                     <Skeleton className="h-96 w-full mt-8" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, users, fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
