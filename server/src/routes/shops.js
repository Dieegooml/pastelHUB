const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('pastryShops');

// GET todas las pastelerías
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener pastelerías' });
  }
});

// GET una pastelería
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'No encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la pastelería' });
  }
});

// POST crear pastelería
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      shopName, ownerId, description,
      address, city, phone, email,
      logoUrl, bannerUrl, approvalStatus,
    } = req.body;

    if (!shopName || !ownerId) {
      return res.status(400).json({ error: 'shopName y ownerId son requeridos' });
    }

    const data = {
      shopName,
      ownerId,
      description:    description    || '',
      address:        address        || '',
      city:           city           || '',
      phone:          phone          || '',
      email:          email          || '',
      logoUrl:        logoUrl        || '',
      bannerUrl:      bannerUrl      || '',
      rating:         0,
      isActive:       true,
      approvalStatus: approvalStatus || 'pending',
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la pastelería' });
  }
});

// PUT actualizar pastelería
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'No encontrada' });

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la pastelería' });
  }
});

// DELETE pastelería
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'No encontrada' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Pastelería eliminada' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la pastelería' });
  }
});

module.exports = router;