
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
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch users only after confirming an authenticated user
        await fetchUsers();
        
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
            // Re-fetch users list after creating a new profile
            await fetchUsers(); 
          } catch (error) {
             console.error("Error creating user profile in Firestore:", error);
             setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
        setUsers([]); // Clear users list on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUsers]);

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
