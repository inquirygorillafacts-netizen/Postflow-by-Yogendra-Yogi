"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userDocUnsub = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const savedWorkspace = localStorage.getItem('rdmodels_activeWorkspace');
        
        // Fetch extended user data from Firestore in real-time
        userDocUnsub = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setActiveWorkspace((prev) => prev || savedWorkspace || currentUser.uid);
          } else {
            setUserData(null);
            setActiveWorkspace(savedWorkspace || currentUser.uid);
          }
          setLoading(false);
        });
      } else {
        if (userDocUnsub) userDocUnsub();
        setUserData(null);
        setActiveWorkspace(null);
        localStorage.removeItem('rdmodels_activeWorkspace');
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  // Monitor active workspace access
  useEffect(() => {
    if (user && activeWorkspace && activeWorkspace !== user.uid) {
      const unsub = onSnapshot(doc(db, "users", activeWorkspace), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const allowed = data.allowedFreelancers || [];
          const hasAccess = allowed.some(f => f.uid === user.uid);
          if (!hasAccess) {
            alert("Your access to this workspace has been revoked.");
            switchWorkspace(user.uid);
          }
        } else {
          switchWorkspace(user.uid);
        }
      });
      return () => unsub();
    }
  }, [user, activeWorkspace]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('rdmodels_activeWorkspace');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const switchWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    localStorage.setItem('rdmodels_activeWorkspace', workspaceId);
  };

  return (
    <AuthContext.Provider value={{ user, userData, activeWorkspace, switchWorkspace, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
