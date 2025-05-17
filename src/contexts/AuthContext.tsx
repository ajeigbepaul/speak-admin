
"use client";

import type { User, UserRole } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // TODO: Fetch user role from Firestore based on firebaseUser.uid
        // For now, we'll assign a role based on email for the superadmin
        let role: UserRole = 'admin'; // Default role
        if (firebaseUser.email === 'pdave4krist@gmail.com') {
          role = 'superadmin';
        }

        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || undefined,
          role: role, 
        });
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
      // onAuthStateChanged will handle setting the user state
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      // Rethrow or handle specific error codes to show messages in UI
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
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
