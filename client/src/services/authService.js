import { api } from './apiService';
import { auth, googleProvider } from '../config/firebase';

export const authService = {
  loginEmail: async (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
  },
  loginGoogle: async () => {
    return auth.signInWithPopup(googleProvider);
  },
  logout: async () => {
    return auth.signOut();
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
};
