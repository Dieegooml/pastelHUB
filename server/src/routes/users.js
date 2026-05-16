const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('users');

// GET todos los usuarios
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET un usuario
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// POST crear usuario
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, lastName, email, password, phone, roles } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son requeridos' });
    }

    // Crear en Firebase Auth
    const userRecord = await admin.auth().createUser({ email, password });

    // Asignar custom claims de roles
    const assignedRoles = roles || ['customer'];
    await admin.auth().setCustomUserClaims(userRecord.uid, { roles: assignedRoles });

    // Guardar en Firestore
    const data = {
      name,
      lastName:       lastName       || '',
      email,
      phone:          phone          || '',
      profilePicture: '',
      roles:          assignedRoles,
      isActive:       true,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    };

    await col.doc(userRecord.uid).set(data);
    res.status(201).json({ id: userRecord.uid, ...data });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// PUT actualizar usuario
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { name, lastName, phone, profilePicture, isActive, roles } = req.body;

    // Si cambian los roles, actualizar también los custom claims
    if (roles) {
      await admin.auth().setCustomUserClaims(req.params.id, { roles });
    }

    const updates = {
      ...(name           !== undefined && { name }),
      ...(lastName       !== undefined && { lastName }),
      ...(phone          !== undefined && { phone }),
      ...(profilePicture !== undefined && { profilePicture }),
      ...(isActive       !== undefined && { isActive }),
      ...(roles          !== undefined && { roles }),
      updatedAt: new Date().toISOString(),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// DELETE usuario
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Eliminar de Firebase Auth y de Firestore
    await admin.auth().deleteUser(req.params.id);
    await col.doc(req.params.id).delete();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// PATCH cambiar estado activo/inactivo
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive debe ser true o false' });
    }

    await admin.auth().updateUser(req.params.id, { disabled: !isActive });
    await col.doc(req.params.id).update({ isActive, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, isActive });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

module.exports = router;