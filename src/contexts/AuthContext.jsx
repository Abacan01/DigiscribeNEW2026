import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../firebase';

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
      }
      setLoading(false);
    });

    return unsubscribe;
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
