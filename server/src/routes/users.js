const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { paginate } = require('../utils/paginate');

const col = db.collection('users');

// GET todos los usuarios
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await paginate(col, req.query, { orderBy: 'createdAt' });
    res.json(result);
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
    const { name, email, password, phone, roles } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son requeridos' });
    }

    const userRecord = await admin.auth().createUser({ email, password });
    const assignedRoles = roles || ['customer'];
    await admin.auth().setCustomUserClaims(userRecord.uid, { roles: assignedRoles });

    const data = {
      email,
      full_name:  name,
      phone:      phone || '',
      roles:      assignedRoles,
      password_hash: '',
      addresses:  [],
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
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

    const { full_name, phone, roles } = req.body;

    if (roles) {
      await admin.auth().setCustomUserClaims(req.params.id, { roles });
    }

    const updates = {
      ...(full_name !== undefined && { full_name }),
      ...(phone     !== undefined && { phone }),
      ...(roles     !== undefined && { roles }),
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

    await admin.auth().deleteUser(req.params.id);
    await col.doc(req.params.id).delete();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// PATCH activar / desactivar usuario
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

// ── DIRECCIONES (array embebido) ──────────────────────────────────────

// GET direcciones de un usuario (propio usuario o admin)
router.get('/:id/addresses', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.id) {
      return res.status(403).json({ error: 'Solo puedes ver tus propias direcciones' });
    }
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(doc.data().addresses || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
});

// POST agregar dirección (propio usuario o admin)
router.post('/:id/addresses', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { street, city, is_default } = req.body;
    if (!street || !city) {
      return res.status(400).json({ error: 'street y city son requeridos' });
    }

    const addresses   = doc.data().addresses || [];
    const address_id  = `addr_${Date.now()}`;
    const isFirst     = addresses.length === 0;

    const updatedAddresses = addresses.map(a => ({
      ...a,
      is_default: (is_default || isFirst) ? false : a.is_default,
    }));

    const newAddress = {
      address_id,
      street,
      city,
      is_default: is_default || isFirst,
    };

    updatedAddresses.push(newAddress);

    await col.doc(req.params.id).update({
      addresses:  updatedAddresses,
      updatedAt:  new Date().toISOString(),
    });

    res.status(201).json(newAddress);
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar dirección' });
  }
});

// PUT actualizar dirección (propio usuario o admin)
router.put('/:id/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const addresses = doc.data().addresses || [];
    const index     = addresses.findIndex(a => a.address_id === req.params.addressId);
    if (index === -1) return res.status(404).json({ error: 'Dirección no encontrada' });

    const { street, city, is_default } = req.body;

    const updated = addresses.map((a, i) => ({
      ...a,
      is_default: is_default ? i === index : a.is_default,
    }));

    updated[index] = {
      ...updated[index],
      ...(street     !== undefined && { street }),
      ...(city       !== undefined && { city }),
      ...(is_default !== undefined && { is_default }),
    };

    await col.doc(req.params.id).update({
      addresses: updated,
      updatedAt: new Date().toISOString(),
    });

    res.json(updated[index]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar dirección' });
  }
});

// DELETE dirección (propio usuario o admin)
router.delete('/:id/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('admin') && req.user.uid !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const addresses = doc.data().addresses || [];
    const target    = addresses.find(a => a.address_id === req.params.addressId);
    if (!target) return res.status(404).json({ error: 'Dirección no encontrada' });

    let updated = addresses.filter(a => a.address_id !== req.params.addressId);

    if (target.is_default && updated.length > 0) {
      updated[0].is_default = true;
    }

    await col.doc(req.params.id).update({
      addresses: updated,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Dirección eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar dirección' });
  }
});

module.exports = router;