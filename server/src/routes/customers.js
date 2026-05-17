const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('customers');

// GET todos los customers
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener customers' });
  }
});

// GET un customer
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el customer' });
  }
});

// GET customer con sus direcciones
router.get('/:id/full', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });

    const addressesSnap = await col.doc(req.params.id).collection('addresses').get();
    const addresses = addressesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ id: doc.id, ...doc.data(), addresses });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el customer con direcciones' });
  }
});

// POST crear customer (vinculado a un user existente)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'uid es requerido' });
    }

    // Verificar que el user existe en Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'El usuario no existe' });
    }

    // Verificar que no tenga ya un perfil customer
    const existing = await col.doc(uid).get();
    if (existing.exists) {
      return res.status(400).json({ error: 'Este usuario ya tiene un perfil customer' });
    }

    const data = {
      defaultAddressId: '',
      createdAt:        new Date().toISOString(),
    };

    // El documento usa el mismo UID del usuario
    await col.doc(uid).set(data);

    // Actualizar roles del usuario en Firestore y en Firebase Auth
    const currentRoles = userDoc.data().roles || [];
    if (!currentRoles.includes('customer')) {
      const newRoles = [...currentRoles, 'customer'];
      await db.collection('users').doc(uid).update({ roles: newRoles });
      const { admin } = require('../config/firebase');
      await admin.auth().setCustomUserClaims(uid, { roles: newRoles });
    }

    res.status(201).json({ id: uid, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el customer' });
  }
});

// PATCH actualizar dirección por defecto
router.patch('/:id/default-address', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });

    const { addressId } = req.body;
    if (!addressId) {
      return res.status(400).json({ error: 'addressId es requerido' });
    }

    // Verificar que la dirección existe en la subcolección
    const addressDoc = await col.doc(req.params.id).collection('addresses').doc(addressId).get();
    if (!addressDoc.exists) {
      return res.status(404).json({ error: 'La dirección no existe' });
    }

    // Quitar isDefault de todas las direcciones y poner solo en la nueva
    const addressesSnap = await col.doc(req.params.id).collection('addresses').get();
    const batch = db.batch();
    addressesSnap.docs.forEach(d => {
      batch.update(d.ref, { isDefault: d.id === addressId });
    });
    batch.update(col.doc(req.params.id), { defaultAddressId: addressId });
    await batch.commit();

    res.json({ id: req.params.id, defaultAddressId: addressId });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar dirección por defecto' });
  }
});

// DELETE customer
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });

    // Eliminar todas sus direcciones y el documento en batch
    const addressesSnap = await col.doc(req.params.id).collection('addresses').get();
    const batch = db.batch();
    addressesSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(col.doc(req.params.id));
    await batch.commit();

    res.json({ message: 'Customer y sus direcciones eliminados correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el customer' });
  }
});

// ── DIRECCIONES (subcolección) ────────────────────────────────────────

// GET todas las direcciones de un customer
router.get('/:id/addresses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });

    const snap = await col.doc(req.params.id).collection('addresses').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
});

// GET una dirección
router.get('/:id/addresses/:addressId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const addressDoc = await col
      .doc(req.params.id)
      .collection('addresses')
      .doc(req.params.addressId)
      .get();
    if (!addressDoc.exists) return res.status(404).json({ error: 'Dirección no encontrada' });
    res.json({ id: addressDoc.id, ...addressDoc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la dirección' });
  }
});

// POST crear dirección
router.post('/:id/addresses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer no encontrado' });

    const { street, city, district, reference } = req.body;
    if (!street || !city) {
      return res.status(400).json({ error: 'street y city son requeridos' });
    }

    // Verificar si ya tiene direcciones para saber si esta será la default
    const existingSnap = await col.doc(req.params.id).collection('addresses').get();
    const isFirst      = existingSnap.empty;

    const data = {
      street,
      city,
      district:  district  || '',
      reference: reference || '',
      isDefault: isFirst,
    };

    const ref = await col.doc(req.params.id).collection('addresses').add(data);

    // Si es la primera dirección, establecerla como default automáticamente
    if (isFirst) {
      await col.doc(req.params.id).update({ defaultAddressId: ref.id });
    }

    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la dirección' });
  }
});

// PUT actualizar dirección
router.put('/:id/addresses/:addressId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const addressRef = col
      .doc(req.params.id)
      .collection('addresses')
      .doc(req.params.addressId);

    const addressDoc = await addressRef.get();
    if (!addressDoc.exists) return res.status(404).json({ error: 'Dirección no encontrada' });

    const { street, city, district, reference } = req.body;
    const updates = {
      ...(street    !== undefined && { street }),
      ...(city      !== undefined && { city }),
      ...(district  !== undefined && { district }),
      ...(reference !== undefined && { reference }),
    };

    await addressRef.update(updates);
    res.json({ id: req.params.addressId, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la dirección' });
  }
});

// DELETE dirección
router.delete('/:id/addresses/:addressId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const addressRef = col
      .doc(req.params.id)
      .collection('addresses')
      .doc(req.params.addressId);

    const addressDoc = await addressRef.get();
    if (!addressDoc.exists) return res.status(404).json({ error: 'Dirección no encontrada' });

    const customerDoc = await col.doc(req.params.id).get();
    const wasDefault  = customerDoc.data().defaultAddressId === req.params.addressId;

    await addressRef.delete();

    // Si era la dirección default, asignar otra automáticamente
    if (wasDefault) {
      const remaining = await col.doc(req.params.id).collection('addresses').get();
      const newDefault = remaining.empty ? '' : remaining.docs[0].id;

      const batch = db.batch();
      if (!remaining.empty) {
        batch.update(remaining.docs[0].ref, { isDefault: true });
      }
      batch.update(col.doc(req.params.id), { defaultAddressId: newDefault });
      await batch.commit();
    }

    res.json({ message: 'Dirección eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la dirección' });
  }
});

module.exports = router;