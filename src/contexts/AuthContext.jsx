import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../firebase';
import { setFileToken } from '../lib/fileUrl';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const claims = tokenResult.claims;
          // Push token to fileUrl helper so <img>/<video> tags can authenticate
          setFileToken(tokenResult.token);
          // Support legacy admin boolean and old role names
          let userRole = claims.role || (claims.admin ? 'admin' : 'user');
          if (userRole === 'superAdmin' || userRole === 'lguAdmin') {
            userRole = 'admin';
          }
          setRole(userRole);
        } catch {
          setRole('user');
        }
      } else {
        setUser(null);
        setRole('user');
        setFileToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Keep the file-URL token fresh when Firebase silently refreshes the ID token (~every hour)
  useEffect(() => {
    const unsubToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setFileToken(token);
        } catch { /* ignore */ }
      } else {
        setFileToken(null);
      }
    });
    return unsubToken;
  }, []);

  const login = async (email, password, options = {}) => {
    const remember = Boolean(options.remember);
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const isAdmin = role === 'admin';

  const value = { user, loading, role, isAdmin, login, logout, getIdToken };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
