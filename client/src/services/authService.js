import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { api } from './apiService';
import { auth } from '../config/firebase';

export const authService = {
  loginEmail: async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  logout: async () => {
    return signOut(auth);
  },
  sync: async () => {
    return api.post('/auth/sync');
  },
  getMe: async () => {
    return api.get('/auth/me');
  },
  assignRole: async (uid, roles) => {
    return api.post('/auth/assign-role', { uid, roles });
  },
  resetPassword: async (email) => {
    return sendPasswordResetEmail(auth, email);
  },
};
