import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '../config/firebase';
import { api } from './apiService';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const STORAGE_KEY = 'pastelhub_fcm_token';

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('FCM no disponible:', e.message);
}

export async function requestFcmPermission() {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      await api.post('/auth/fcm-token', { token }).catch(() => {});
      return token;
    }
  } catch (e) {
    console.error('Error obteniendo token FCM:', e);
  }
  return null;
}

export async function removeFcmToken() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return;
  try {
    await api.delete('/auth/fcm-token', { token }).catch(() => {});
  } finally {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function onFcmMessage(callback) {
  if (!messaging) return () => {};
  const unsub = onMessage(messaging, (payload) => {
    const { notification, data } = payload;
    callback({
      title: notification?.title || '',
      body: notification?.body || '',
      data: data || {},
    });
  });
  return unsub;
}

export function registerFcmServiceWorker() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(() => console.log('FCM Service Worker registrado'))
      .catch((err) => console.warn('FCM SW Error:', err));
  }
}
