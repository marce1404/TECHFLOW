
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
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as AppUser);
        } else {
          try {
            const newUserProfile: AppUser = {
              uid: currentUser.uid,
              email: currentUser.email!,
              displayName: currentUser.displayName || currentUser.email!.split('@')[0],
              role: 'Visor',
              status: 'Activo',
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          } catch (error) {
             console.error("Error creating user profile in Firestore:", error);
             setUserProfile(null);
          }
        }
        await fetchUsers();
      } else {
        setUser(null);
        setUserProfile(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUsers]);


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
