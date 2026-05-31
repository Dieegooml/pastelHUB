const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createShopSchema, updateShopSchema } = require('../validators/shopValidator');
const { mapShopToResponse, mapShopFromRequest } = require('../utils/mappers');
const { paginate } = require('../utils/paginate');
const { createAuditLog } = require('../utils/auditLog');
const { notifyUser } = require('../utils/autoNotify');

const col = db.collection('pastryShops');

// GET todas las pastelerías (público)
router.get('/', async (req, res) => {
  try {
    const result = await paginate(col, req.query, { orderBy: 'createdAt' });
    result.data = result.data.map(d => mapShopToResponse(d));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener pastelerías' });
  }
});

// GET una pastelería (público)
router.get('/:id', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json(mapShopToResponse({ id: doc.id, ...doc.data() }));
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la pastelería' });
  }
});

// POST crear pastelería
router.post('/', verifyToken, (req, res, next) => {
  req.body = mapShopFromRequest(req.body);
  next();
}, validate(createShopSchema), requireOwnerOrAdmin(async (req) => req.body.owner_id), async (req, res) => {
  try {
    const { owner_id, name, description, logo_url, banner_url, status } = req.body;

    // Verificar que el owner existe
    const ownerDoc = await db.collection('users').doc(owner_id).get();
    if (!ownerDoc.exists) {
      return res.status(404).json({ error: 'El usuario owner no existe' });
    }

    const VALID_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
    const shopStatus = VALID_STATUSES.includes(status) ? status : 'pending';

    const data = {
      owner_id,
      name,
      description: description || '',
      logo_url:    logo_url    || '',
      banner_url:  banner_url  || '',
      rating:      0,
      status:      shopStatus,
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
router.put('/:id', verifyToken, (req, res, next) => {
  req.body = mapShopFromRequest(req.body);
  next();
}, validate(updateShopSchema), requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    const { owner_id, schedules, categories, createdAt, status, ...rest } = req.body;
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

    const actionMap = {
      approved: 'shop.approved',
      rejected: 'shop.rejected',
      suspended: 'shop.suspended',
    };
    if (actionMap[status]) {
      await createAuditLog({
        action: actionMap[status],
        performedBy: req.user.uid,
        targetType: 'shop',
        targetId: req.params.id,
        previousState: doc.data().status,
        newState: status,
      });

      const notifTypeMap = {
        suspended: 'shop_suspended',
        approved: 'shop_approved',
        rejected: 'shop_rejected',
      };
      if (notifTypeMap[status]) {
        await notifyUser({
          userId: doc.data().owner_id,
          type: notifTypeMap[status],
          message: `Tu pastelería "${doc.data().name}" ha sido ${status === 'approved' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'suspendida'}`,
        });
      }
    }

    res.json({ id: req.params.id, status });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// DELETE pastelería
router.delete('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Pastelería eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la pastelería' });
  }
});

// GET pastelerías por owner (público)
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'owner_id', value: req.params.ownerId }],
    });
    result.data = result.data.map(d => mapShopToResponse(d));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener pastelerías del owner' });
  }
});

// ── SCHEDULES (array embebido) ────────────────────────────────────────

// GET horarios (público)
router.get('/:id/schedules', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json(doc.data().schedules || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

// POST agregar horario
router.post('/:id/schedules', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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
router.put('/:id/schedules/:day', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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
router.delete('/:id/schedules/:day', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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

// GET categorías (público)
router.get('/:id/categories', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pastelería no encontrada' });
    res.json(doc.data().categories || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST agregar categoría
router.post('/:id/categories', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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
router.put('/:id/categories/:categoryId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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
router.delete('/:id/categories/:categoryId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
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