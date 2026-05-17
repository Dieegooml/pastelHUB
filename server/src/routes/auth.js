// src/routes/auth.js
const express = require('express');
const router  = express.Router();
const { admin, db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// POST — sincronizar usuario tras login
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const data = {
        email,
        full_name:  name  || '',
        phone:      '',
        roles:      ['customer'],
        password_hash: '',
        addresses:  [],
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      };
      await userRef.set(data);
      await admin.auth().setCustomUserClaims(uid, { roles: ['customer'] });
      return res.status(201).json({ id: uid, ...data, isNew: true });
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
router.post('/assign-role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid, roles } = req.body;
    if (!uid || !roles?.length) {
      return res.status(400).json({ error: 'uid y roles son requeridos' });
    }

    const VALID_ROLES = ['admin', 'moderator', 'owner', 'customer'];
    if (!roles.every(r => VALID_ROLES.includes(r))) {
      return res.status(400).json({ error: `Roles inválidos. Válidos: ${VALID_ROLES.join(', ')}` });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    await admin.auth().setCustomUserClaims(uid, { roles });
    await db.collection('users').doc(uid).update({ roles, updatedAt: new Date().toISOString() });

    res.json({ id: uid, roles });
  } catch (e) {
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

module.exports = router;