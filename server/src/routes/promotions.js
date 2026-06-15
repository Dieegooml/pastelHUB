const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createPromotionSchema, updatePromotionSchema } = require('../validators/promotionValidator');
const { paginate, tryPaginate } = require('../utils/paginate');
const redisCache = require('../utils/redisCache');

const col = db.collection('promotions');

// GET todas las promociones (admin — todas las pastelerías)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  await tryPaginate(res, col, req.query, { orderBy: 'createdAt' }, 'Error al obtener promociones');
});

// GET todas las promociones de una pastelería (público)
router.get('/shop/:shopId', async (req, res) => {
  const cacheKey = `promotions:shop:${req.params.shopId}`;
  const cached = await redisCache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const now = new Date().toISOString();
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt',
      filters: [{ field: 'shop_id', value: req.params.shopId }],
    });
    // Solo devolver activas y vigentes a público
    result.data = result.data.filter((p) => p.is_active && p.start_date <= now && p.end_date >= now);
    redisCache.set(cacheKey, result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

// GET todas las promociones de una pastelería (owner/admin — todas)
router.get('/shop/:shopId/all', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return doc.data().owner_id;
}), async (req, res) => {
  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt',
    filters: [{ field: 'shop_id', value: req.params.shopId }],
  }, 'Error al obtener promociones');
});

// GET una promoción
router.get('/:id', async (req, res) => {
  const cached = await redisCache.get(`promotions:${req.params.id}`);
  if (cached) return res.json(cached);
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });
    const result = { id: doc.id, ...doc.data() };
    redisCache.set(`promotions:${req.params.id}`, result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la promoción' });
  }
});

// POST crear promoción (solo owner de la pastelería o admin)
router.post('/', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await db.collection('pastryShops').doc(req.body.shop_id).get();
  if (!doc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return doc.data().owner_id;
}), validate(createPromotionSchema), async (req, res) => {
  try {
    const {
      shop_id, name, type, description,
      discount_percentage, discount_amount,
      combo_items, combo_price,
      product_ids, start_date, end_date, is_active,
    } = req.body;

    const data = {
      shop_id,
      name,
      type,
      description,
      discount_percentage,
      discount_amount,
      combo_items,
      combo_price,
      product_ids,
      start_date: start_date || new Date().toISOString(),
      end_date:   end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };

    const ref = await col.add(data);
    redisCache.invalidatePrefix(`promotions:shop:${shop_id}`);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la promoción' });
  }
});

// PUT actualizar promoción
router.put('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Promoción no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), validate(updatePromotionSchema), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    const { shop_id, createdAt, ...rest } = req.body;

    const updates = {
      ...rest,
      updatedAt: new Date().toISOString(),
    };

    await col.doc(req.params.id).update(updates);
    redisCache.del(`promotions:${req.params.id}`);
    redisCache.invalidatePrefix(`promotions:shop:${doc.data().shop_id}`);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la promoción' });
  }
});

// PATCH activar/desactivar promoción
router.patch('/:id/toggle', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Promoción no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    const current = doc.data();
    const newActive = !current.is_active;

    await col.doc(req.params.id).update({
      is_active: newActive,
      updatedAt: new Date().toISOString(),
    });
    redisCache.del(`promotions:${req.params.id}`);
    redisCache.invalidatePrefix(`promotions:shop:${current.shop_id}`);
    res.json({ id: req.params.id, is_active: newActive });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado de la promoción' });
  }
});

// DELETE promoción
router.delete('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw Object.assign(new Error('Promoción no encontrada'), { status: 404 });
  req.resourceDoc = doc;
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw Object.assign(new Error('Pastelería no encontrada'), { status: 404 });
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = req.resourceDoc || await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    const delShopId = doc.data().shop_id;
    await col.doc(req.params.id).delete();
    redisCache.del(`promotions:${req.params.id}`);
    redisCache.invalidatePrefix(`promotions:shop:${delShopId}`);
    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la promoción' });
  }
});

module.exports = router;
