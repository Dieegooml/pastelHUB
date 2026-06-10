const logger = require('./logger');
const { db } = require('../config/firebase');

const TYPE_LABELS = {
  review_approved: 'Reseña aprobada',
  review_rejected: 'Reseña rechazada',
  report_resolved: 'Reporte resuelto',
  shop_suspended: 'Pastelería suspendida',
  shop_approved: 'Pastelería aprobada',
  shop_rejected: 'Pastelería rechazada',
  user_warned: 'Advertencia de moderación',
};

async function notifyUser({ userId, type, message }) {
  if (!userId || !type || !message) return;

  try {
    await db.collection('notifications').add({
      userId,
      type,
      title: TYPE_LABELS[type] || type,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error('Error al crear notificación automática', { error: e.message, userId, type });
  }
}

module.exports = { notifyUser, TYPE_LABELS };
