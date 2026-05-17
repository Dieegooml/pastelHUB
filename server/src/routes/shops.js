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
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la pastelería' });
  }
});

// POST crear pastelería
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { owner_id, name, description, logo_url } = req.body;

    if (!owner_id || !name) {
      return res.status(400).json({ error: 'owner_id y name son requeridos' });
    }

    // Verificar que el owner existe
    const ownerDoc = await db.collection('users').doc(owner_id).get();
    if (!ownerDoc.exists) {
      return res.status(404).json({ error: 'El usuario owner no existe' });
    }

    const data = {
      owner_id,
      name,
      description: description || '',
      logo_url:    logo_url    || '',
      rating:      0,
      status:      'pending',
      schedules:   [],
      categories:  [],
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
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
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const { owner_id, schedules, categories, createdAt, ...rest } = req.body;
    const updates = { ...rest, updatedAt: new Date().toISOString() };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la pastelería' });
  }
});

// PATCH cambiar estado de aprobación
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const { status } = req.body;
    const VALID = ['pending', 'approved', 'rejected', 'suspended'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${VALID.join(', ')}` });
    }

    await col.doc(req.params.id).update({ status, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, status });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// DELETE pastelería
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Pastelería eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la pastelería' });
  }
});

// ── SCHEDULES (array embebido) ────────────────────────────────────────

// GET horarios
router.get('/:id/schedules', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json(doc.data().schedules || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// POST agregar horario
router.post('/:id/schedules', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const { day, open_time, close_time } = req.body;
    if (!day || !open_time || !close_time) {
      return res.status(400).json({ error: 'day, open_time y close_time son requeridos' });
    }

    const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!VALID_DAYS.includes(day)) {
      return res.status(400).json({ error: `day inválido. Válidos: ${VALID_DAYS.join(', ')}` });
    }

    const schedules = doc.data().schedules || [];

    // No permitir duplicar el mismo día
    if (schedules.some(s => s.day === day)) {
      return res.status(400).json({ error: `Ya existe un horario para ${day}` });
    }

    const newSchedule = { day, open_time, close_time };
    schedules.push(newSchedule);

    await col.doc(req.params.id).update({
      schedules,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json(newSchedule);
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar horario' });
  }
});

// PUT actualizar horario por día
router.put('/:id/schedules/:day', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const schedules = doc.data().schedules || [];
    const index     = schedules.findIndex(s => s.day === req.params.day);
    if (index === -1) return res.status(404).json({ error: 'Horario no encontrado' });

    const { open_time, close_time } = req.body;
    schedules[index] = {
      ...schedules[index],
      ...(open_time  !== undefined && { open_time }),
      ...(close_time !== undefined && { close_time }),
    };

    await col.doc(req.params.id).update({
      schedules,
      updatedAt: new Date().toISOString(),
    });

    res.json(schedules[index]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
});

// DELETE horario por día
router.delete('/:id/schedules/:day', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const schedules = doc.data().schedules || [];
    const updated   = schedules.filter(s => s.day !== req.params.day);

    if (updated.length === schedules.length) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    await col.doc(req.params.id).update({
      schedules: updated,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: `Horario del ${req.params.day} eliminado correctamente` });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
});

// ── CATEGORIES (array embebido) ───────────────────────────────────────

// GET categorías
router.get('/:id/categories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json(doc.data().categories || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST agregar categoría
router.post('/:id/categories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const { name, image_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name es requerido' });
    }

    const categories   = doc.data().categories || [];
    const category_id  = `cat_${Date.now()}`;
    const newCategory  = { category_id, name, image_url: image_url || '' };

    categories.push(newCategory);

    await col.doc(req.params.id).update({
      categories,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json(newCategory);
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar categoría' });
  }
});

// PUT actualizar categoría
router.put('/:id/categories/:categoryId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const categories = doc.data().categories || [];
    const index      = categories.findIndex(c => c.category_id === req.params.categoryId);
    if (index === -1) return res.status(404).json({ error: 'Categoría no encontrada' });

    const { name, image_url } = req.body;
    categories[index] = {
      ...categories[index],
      ...(name      !== undefined && { name }),
      ...(image_url !== undefined && { image_url }),
    };

    await col.doc(req.params.id).update({
      categories,
      updatedAt: new Date().toISOString(),
    });

    res.json(categories[index]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE categoría
router.delete('/:id/categories/:categoryId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const categories = doc.data().categories || [];
    const updated    = categories.filter(c => c.category_id !== req.params.categoryId);

    if (updated.length === categories.length) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await col.doc(req.params.id).update({
      categories: updated,
      updatedAt:  new Date().toISOString(),
    });

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

module.exports = router;