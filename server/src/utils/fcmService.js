const logger = require('./logger');

let messaging = null;
try {
  const { admin } = require('../config/firebase');
  messaging = admin.messaging();
} catch (e) {
  logger.warn('FCM no disponible — admin.messaging() falló', { error: e.message });
}

async function sendPush(userId, title, body, data = {}) {
  if (!messaging) {
    logger.warn('FCM no disponible, push omitido', { userId, title });
    return;
  }
  try {
    const { db } = require('../config/firebase');
    const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens = [];
    tokensSnap.forEach(doc => { if (doc.data().token) tokens.push(doc.data().token); });
    if (tokens.length === 0) return;
    const message = {
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      tokens,
    };
    const response = await messaging.sendEachForMulticast(message);
    logger.info('FCM enviado', { success: response.successCount, failure: response.failureCount, userId });
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(tokens[i]);
      }
    });
    if (invalidTokens.length > 0) {
      const batch = db.batch();
      const snap = await db.collection('users').doc(userId).collection('fcmTokens').get();
      snap.forEach(doc => {
        if (invalidTokens.includes(doc.data().token)) batch.delete(doc.ref);
      });
      await batch.commit();
      logger.info('Tokens FCM inválidos eliminados', { count: invalidTokens.length });
    }
  } catch (e) {
    logger.error('Error enviando push FCM', { error: e.message, userId });
  }
}

async function saveFcmToken(userId, token) {
  try {
    const { db } = require('../config/firebase');
    const ref = db.collection('users').doc(userId).collection('fcmTokens').doc();
    await ref.set({ token, createdAt: new Date().toISOString() });
    return true;
  } catch (e) {
    logger.error('Error guardando token FCM', { error: e.message, userId });
    return false;
  }
}

async function removeFcmToken(userId, token) {
  try {
    const { db } = require('../config/firebase');
    const snap = await db.collection('users').doc(userId).collection('fcmTokens')
      .where('token', '==', token).get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return true;
  } catch (e) {
    logger.error('Error eliminando token FCM', { error: e.message });
    return false;
  }
}

module.exports = { sendPush, saveFcmToken, removeFcmToken };
