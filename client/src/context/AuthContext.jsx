import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { registerFcmServiceWorker, requestFcmPermission, removeFcmToken } from '../services/fcmService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u = auth.currentUser;
    if (u) {
      const token = await u.getIdTokenResult(true);
      setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, roles: token.claims.roles || [] });
    }
  }, []);

  useEffect(() => {
    registerFcmServiceWorker();
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        const token = await u.getIdTokenResult(true);
        setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, roles: token.claims.roles || [] });
        requestFcmPermission().catch(() => {});
      } else {
        removeFcmToken().catch(() => {});
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);