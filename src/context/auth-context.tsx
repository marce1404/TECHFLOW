
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';


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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch existing users first
        const usersCollection = collection(db, 'users');
        const initialUsersSnapshot = await getDocs(usersCollection);
        const initialUsersList = initialUsersSnapshot.docs.map(doc => doc.data() as AppUser);
        setUsers(initialUsersList);

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let profileData: AppUser | null = null;

        if (userDocSnap.exists()) {
          profileData = userDocSnap.data() as AppUser;
        } else {
          // If the user is authenticated but doesn't have a profile in Firestore,
          // create a default one. This is crucial for users created manually in Firebase Auth.
          console.log(`No profile found for UID ${user.uid}, creating one.`);
          const newProfile: AppUser = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || user.email!.split('@')[0],
            // Default to 'Visor' role for safety. First user should be made Admin manually or via setup script.
            role: 'Visor', 
            status: 'Activo',
          };
          try {
            await setDoc(userDocRef, newProfile);
            profileData = newProfile;
            // Add the new profile to the local users list to update UI immediately
            setUsers(prev => [...prev.filter(p => p.uid !== newProfile.uid), newProfile]);
          } catch (error) {
             console.error("Error creating Firestore user profile:", error);
             profileData = null;
          }
        }
        
        // Hard-coded override for the main admin user
        if (profileData && profileData.email === 'msepulveda@osesa.cl') {
            profileData.role = 'Admin';
        }
        
        setUserProfile(profileData);

      } else {
        setUserProfile(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
