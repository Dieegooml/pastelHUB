const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken, requireAdmin, requireSelfOrAdmin, requireModerator, requireSelfOrStaff } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createUserSchema, updateUserSchema, addressSchema, updateUserStatusSchema, updateUserAddressSchema } = require('../validators/userValidator');
const { paginate, tryPaginate } = require('../utils/paginate');

const col = db.collection('users');

// GET todos los usuarios
router.get('/', verifyToken, requireModerator, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'createdAt' }, 'Error al obtener usuarios');
});

// GET un usuario (propio usuario, admin o moderator)
router.get('/:id', verifyToken, requireSelfOrStaff(), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// POST crear usuario
router.post('/', verifyToken, requireAdmin, validate(createUserSchema), async (req, res) => {
  try {
    const { name, email, password, phone, roles, addresses, isActive } = req.body;

    const userRecord = await admin.auth().createUser({ email, password });
    const assignedRoles = roles || ['customer'];
    await admin.auth().setCustomUserClaims(userRecord.uid, { roles: assignedRoles });

    const data = {
      email,
      full_name:  name,
      phone:      phone || '',
      roles:      assignedRoles,
      password_hash: '',
      addresses:  addresses || [],
      isActive:   isActive !== undefined ? isActive : true,
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

// PUT actualizar usuario (propio usuario, admin o moderator; solo admin/moderator cambia roles)
router.put('/:id', verifyToken, requireSelfOrStaff(), validate(updateUserSchema), async (req, res) => {
  try {
    const userRoles = req.user?.roles || [];
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { full_name, phone, photo_url, roles: newRoles } = req.body;

    if (newRoles) {
      if (!userRoles.includes('admin') && !userRoles.includes('moderator')) {
        return res.status(403).json({ error: 'Solo admins o moderadores pueden cambiar roles' });
      }
      if (newRoles.includes('admin') && !userRoles.includes('admin')) {
        return res.status(403).json({ error: 'Solo admins pueden asignar el rol admin' });
      }
    }

    if (newRoles && newRoles.length > 0) {
      await admin.auth().setCustomUserClaims(req.params.id, { roles: newRoles });
    }

    if (full_name !== undefined) {
      await admin.auth().updateUser(req.params.id, { displayName: full_name });
    }

    const updates = {
      ...(full_name !== undefined && { full_name }),
      ...(phone     !== undefined && { phone }),
      ...(photo_url !== undefined && { photo_url }),
      ...(newRoles  !== undefined && { roles: newRoles }),
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
router.patch('/:id/status', verifyToken, requireAdmin, validate(updateUserStatusSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { isActive } = req.body;

    await admin.auth().updateUser(req.params.id, { disabled: !isActive });
    await col.doc(req.params.id).update({ isActive, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, isActive });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

// ── DIRECCIONES (array embebido) ──────────────────────────────────────

// GET direcciones de un usuario (propio usuario o admin)
router.get('/:id/addresses', verifyToken, requireSelfOrAdmin(), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(doc.data().addresses || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
});

// POST agregar dirección (propio usuario o admin)
router.post('/:id/addresses', verifyToken, requireSelfOrAdmin(), validate(addressSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { street, city, is_default } = req.body;

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
router.put('/:id/addresses/:addressId', verifyToken, requireSelfOrAdmin(), validate(updateUserAddressSchema), async (req, res) => {
  try {
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
router.delete('/:id/addresses/:addressId', verifyToken, requireSelfOrAdmin(), async (req, res) => {
  try {
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