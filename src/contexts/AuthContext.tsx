
"use client";

import type { User, UserRole } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; // Import Firebase auth and db instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // We might add a signup function here later if client-side signup is preferred
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userRole: UserRole = 'admin'; // Default role if no specific role found or for new users
          let userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
          
          if (userDocSnap.exists()) {
            const userDataFromFirestore = userDocSnap.data();
            userRole = userDataFromFirestore.role || 'admin'; // Fallback to 'admin' if role field is missing
            userName = userDataFromFirestore.name || userName; // Use name from Firestore if available
          } else {
            // User is authenticated with Firebase Auth, but no record in our 'users' collection.
            // This case is important. If it's the designated superadmin email and no doc, it's problematic
            // as role won't be set. The signup flow should ensure the doc is created.
            // For login, if doc doesn't exist, they are an 'admin' by default or a role defined during an invite.
            console.warn(`User document not found in Firestore for UID: ${firebaseUser.uid}. Assigning default role 'admin'.`);
             // If it IS the superadmin email and doc not found, this is a state that needs attention.
            // The signup flow should ensure the superadmin doc is created.
            // For login, if it's superadmin email and no doc, we might still grant superadmin for this session
            // to allow them to fix things, but it's not ideal.
            if (firebaseUser.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL) {
                 userRole = 'superadmin'; // Temporary fallback for superadmin if Firestore doc is missing
                 console.warn(`Superadmin Firestore document missing for ${firebaseUser.email}. Granting superadmin role for this session based on email match.`);
            }
          }

          setUser({
            id: firebaseUser.uid,
            name: userName,
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            role: userRole, 
          });

        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          // Fallback: set user without specific role or with a default one
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            role: (firebaseUser.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ? 'superadmin' : 'admin') as UserRole, // Basic fallback
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user state and fetching role from Firestore
      // setIsLoading(false); // onAuthStateChanged will set isLoading to false
      return true;
    } catch (error) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      throw error; 
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set isLoading to false
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
