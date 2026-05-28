const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireOwnerOrAdmin } = require('../middlewares/auth');
const { paginate } = require('../utils/paginate');

const col = db.collection('promotions');

const VALID_TYPES = ['discount', 'combo', 'bogo'];

// GET todas las promociones de una pastelería (público)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt',
      filters: [{ field: 'shop_id', value: req.params.shopId }],
    });
    // Solo devolver activas y vigentes a público
    result.data = result.data.filter((p) => p.is_active && p.start_date <= now && p.end_date >= now);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

// GET todas las promociones de una pastelería (owner/admin — todas)
router.get('/shop/:shopId/all', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await db.collection('pastryShops').doc(req.params.shopId).get();
  if (!doc.exists) throw new Error('not found');
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt',
      filters: [{ field: 'shop_id', value: req.params.shopId }],
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
});

// GET una promoción
router.get('/:id', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la promoción' });
  }
});

// POST crear promoción (solo owner de la pastelería o admin)
router.post('/', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await db.collection('pastryShops').doc(req.body.shop_id).get();
  if (!doc.exists) throw new Error('not found');
  return doc.data().owner_id;
}), async (req, res) => {
  try {
    const {
      shop_id, name, type, description,
      discount_percentage, discount_amount,
      combo_items, combo_price,
      product_ids, start_date, end_date, is_active,
    } = req.body;

    if (!shop_id || !name || !type) {
      return res.status(400).json({ error: 'shop_id, name y type son requeridos' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type inválido. Válidos: ${VALID_TYPES.join(', ')}` });
    }

    const data = {
      shop_id,
      name,
      type,
      description: description || '',
      discount_percentage: discount_percentage != null ? parseFloat(discount_percentage) : null,
      discount_amount:     discount_amount != null ? parseFloat(discount_amount) : null,
      combo_items:         combo_items || [],
      combo_price:         combo_price != null ? parseFloat(combo_price) : null,
      product_ids:         product_ids || [],
      start_date:          start_date || new Date().toISOString(),
      end_date:            end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active:           is_active !== undefined ? is_active : true,
      createdAt:           new Date().toISOString(),
      updatedAt:           new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la promoción' });
  }
});

// PUT actualizar promoción
router.put('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    const { shop_id, createdAt, ...rest } = req.body;
    if (rest.type && !VALID_TYPES.includes(rest.type)) {
      return res.status(400).json({ error: `type inválido. Válidos: ${VALID_TYPES.join(', ')}` });
    }

    const updates = {
      ...rest,
      ...(rest.discount_percentage != null && { discount_percentage: parseFloat(rest.discount_percentage) }),
      ...(rest.discount_amount != null     && { discount_amount: parseFloat(rest.discount_amount) }),
      ...(rest.combo_price != null         && { combo_price: parseFloat(rest.combo_price) }),
      updatedAt: new Date().toISOString(),
    };

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la promoción' });
  }
});

// PATCH activar/desactivar promoción
router.patch('/:id/toggle', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    const current = doc.data();
    const newActive = !current.is_active;

    await col.doc(req.params.id).update({
      is_active: newActive,
      updatedAt: new Date().toISOString(),
    });
    res.json({ id: req.params.id, is_active: newActive });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado de la promoción' });
  }
});

// DELETE promoción
router.delete('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Promoción no encontrada' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la promoción' });
  }
});

module.exports = router;
