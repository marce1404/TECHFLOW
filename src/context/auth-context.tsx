
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as AppUser);
        } else {
          console.warn(`No user profile found for UID: ${user.uid}`);
          setUserProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);
  
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
    <AuthContext.Provider value={{ user, userProfile, loading }}>
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
