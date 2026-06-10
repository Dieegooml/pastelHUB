const logger = require('./logger');
const { db } = require('../config/firebase');

const VALID_ACTIONS = [
  'review.approved',
  'review.rejected',
  'report.resolved',
  'report.dismissed',
  'report.assigned',
  'shop.approved',
  'shop.rejected',
  'shop.suspended',
  'user.deactivated',
  'user.activated',
];

async function createAuditLog({ action, performedBy, targetType, targetId, previousState, newState, reason }) {
  if (!VALID_ACTIONS.includes(action)) {
    logger.warn('Acción de auditoría inválida', { action });
    return;
  }

  try {
    await db.collection('auditLog').add({
      action,
      performedBy,
      performedByRole: '',
      targetType: targetType || '',
      targetId: targetId || '',
      previousState: previousState || '',
      newState: newState || '',
      reason: reason || '',
      createdAt: new Date().toISOString(),
    });

    // Actualizar contador del usuario
    const userRef = db.collection('users').doc(performedBy);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const current = userDoc.data().moderationCount || 0;
      await userRef.update({ moderationCount: current + 1 });
    }
  } catch (e) {
    logger.error('Error al crear entrada de auditoría', { error: e.message, action, performedBy });
  }
}

module.exports = { createAuditLog, VALID_ACTIONS };
