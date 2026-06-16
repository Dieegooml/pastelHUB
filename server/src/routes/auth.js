// src/routes/auth.js
const express = require('express');
const router  = express.Router();
const { admin, db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { assignRoleSchema } = require('../validators/authValidator');

async function setClaimsWithRetry(uid, roles, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await admin.auth().setCustomUserClaims(uid, { roles });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// POST — sincronizar usuario tras login
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Preservar custom claims existentes (ej: admin asignado via script/consola)
      let roles = ['customer'];
      let hasPreExistingClaims = false;
      try {
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims?.roles) {
          roles = userRecord.customClaims.roles;
          hasPreExistingClaims = true;
        }
      } catch {}

      const data = {
        email,
        full_name:  name  || '',
        phone:      '',
        roles,
        password_hash: '',
        addresses:  [],
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      };
      await userRef.set(data);

      // Solo sobrescribir claims si no había pre-existentes
      if (!hasPreExistingClaims) {
        await setClaimsWithRetry(uid, roles);
      }

      // Crear perfil customer solo si el rol lo incluye
      if (roles.includes('customer')) {
        await db.collection('customers').doc(uid).set({
          defaultAddressId: '',
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(201).json({ id: uid, ...data, isNew: true });
    }

    // Auto-crear customer profile si no existe (migración transparente)
    const customerDoc = await db.collection('customers').doc(uid).get();
    if (!customerDoc.exists) {
      await db.collection('customers').doc(uid).set({
        defaultAddressId: '',
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ id: uid, ...userDoc.data(), isNew: false });
  } catch (e) {
    res.status(500).json({ error: 'Error al sincronizar usuario' });
  }
});

// GET — perfil del usuario autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// POST — asignar rol (solo admin)
router.post('/assign-role', verifyToken, requireAdmin, validate(assignRoleSchema), async (req, res) => {
  try {
    const { uid, roles } = req.body;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    await setClaimsWithRetry(uid, roles);
    await db.collection('users').doc(uid).update({ roles, updatedAt: new Date().toISOString() });

    res.json({ id: uid, roles });
  } catch (e) {
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

// POST — guardar token FCM para push notifications
router.post('/fcm-token', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });
    const { saveFcmToken } = require('../utils/fcmService');
    await saveFcmToken(req.user.uid, token);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar token' });
  }
});

// DELETE — eliminar token FCM
router.delete('/fcm-token', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });
    const { removeFcmToken } = require('../utils/fcmService');
    await removeFcmToken(req.user.uid, token);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar token' });
  }
});

module.exports = router;