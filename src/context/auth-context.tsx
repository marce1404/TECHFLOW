
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, Unsubscribe, writeBatch } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  users: AppUser[];
  loading: boolean;
  refetchUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUsers = useCallback(async () => {
    // This now only fetches users once if needed, but the listener below handles real-time.
    try {
        const usersCollection = await getDocs(collection(db, 'users'));
        const userList = usersCollection.docs.map(doc => doc.data() as AppUser);
        setUsers(userList);
    } catch (e) {
        console.error("Error fetching users: ", e);
    }
  }, []);

  useEffect(() => {
    let unsubscribeUsers: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      // Clean up previous listeners
      if (unsubscribeUsers) unsubscribeUsers();

      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);

        onSnapshot(userDocRef, (doc) => {
             if (doc.exists()) {
                setUserProfile(doc.data() as AppUser);
            }
        });
        
        // Listen for real-time updates to all users
        unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const userList = snapshot.docs.map(doc => doc.data() as AppUser);
            setUsers(userList);
        });

      } else {
        setUser(null);
        setUserProfile(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);
  
  useEffect(() => {
    if (!loading) {
        if (user && pathname === '/login') {
            router.replace('/dashboard');
        } else if (!user && pathname !== '/login') {
            router.replace('/login');
        }
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, userProfile, users, loading, refetchUsers: fetchUsers }}>
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
