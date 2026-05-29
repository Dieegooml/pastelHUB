const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireOwnerOrAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');
const { mapProductFromRequest, mapProductToResponse } = require('../utils/mappers');
const { paginate } = require('../utils/paginate');

const col = db.collection('products');

// GET todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const result = await paginate(col, req.query, { orderBy: 'createdAt' });
    if (result.data) result.data = result.data.map(d => mapProductToResponse(d));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET productos por pastelería (público)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const result = await paginate(col, req.query, {
      orderBy: 'createdAt', filters: [{ field: 'shop_id', value: req.params.shopId }],
    });
    if (result.data) result.data = result.data.map(d => mapProductToResponse(d));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos de la pastelería' });
  }
});

// GET un producto (público)
router.get('/:id', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(mapProductToResponse({ id: doc.id, ...doc.data() }));
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// POST crear producto
router.post('/', verifyToken, (req, res, next) => {
  req.body = mapProductFromRequest(req.body);
  next();
}, validate(createProductSchema), requireOwnerOrAdmin(async (req) => {
  const shopDoc = await db.collection('pastryShops').doc(req.body.shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const {
      shop_id, category_id, name,
      description, price, stock,
      image_url, is_available,
    } = req.body;

    // Verificar que la pastelería existe
    const shopDoc = await db.collection('pastryShops').doc(shop_id).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'La pastelería no existe' });
    }

    const data = {
      shop_id,
      category_id:  category_id  || '',
      name,
      description:  description  || '',
      price:        parseFloat(price),
      stock:        parseInt(stock) || 0,
      image_url:    image_url    || '',
      is_available: is_available !== undefined ? is_available : true,
      variants:     [],
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };

    const ref = await col.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el producto' });
  }
});

// PUT actualizar producto
router.put('/:id', verifyToken, (req, res, next) => {
  req.body = mapProductFromRequest(req.body);
  next();
}, validate(updateProductSchema), requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    // No permitir cambiar shop_id ni variants por este endpoint
    const { shop_id, variants, createdAt, ...rest } = req.body;
    if (rest.price !== undefined) rest.price = parseFloat(rest.price);
    if (rest.stock !== undefined) rest.stock = parseInt(rest.stock);

    const updates = { ...rest, updatedAt: new Date().toISOString() };
    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// PATCH cambiar disponibilidad
router.patch('/:id/availability', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const { is_available } = req.body;
    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ error: 'is_available debe ser true o false' });
    }

    await col.doc(req.params.id).update({
      is_available,
      updatedAt: new Date().toISOString(),
    });
    res.json({ id: req.params.id, is_available });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar disponibilidad' });
  }
});

// DELETE producto
router.delete('/:id', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    await col.doc(req.params.id).delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

// ── VARIANTS (array embebido) ─────────────────────────────────────────

// GET variantes de un producto (público)
router.get('/:id/variants', async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(doc.data().variants || []);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
});

// POST agregar variante
router.post('/:id/variants', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const { type, value, extra_price } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'type y value son requeridos' });
    }

    const variants   = doc.data().variants || [];
    const variant_id = `var_${Date.now()}`;
    const newVariant = {
      variant_id,
      type,
      value,
      extra_price: parseFloat(extra_price) || 0,
    };

    variants.push(newVariant);

    await col.doc(req.params.id).update({
      variants,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json(newVariant);
  } catch (e) {
    res.status(500).json({ error: 'Error al agregar variante' });
  }
});

// PUT actualizar variante
router.put('/:id/variants/:variantId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const variants = doc.data().variants || [];
    const index    = variants.findIndex(v => v.variant_id === req.params.variantId);
    if (index === -1) return res.status(404).json({ error: 'Variante no encontrada' });

    const { type, value, extra_price } = req.body;
    variants[index] = {
      ...variants[index],
      ...(type        !== undefined && { type }),
      ...(value       !== undefined && { value }),
      ...(extra_price !== undefined && { extra_price: parseFloat(extra_price) }),
    };

    await col.doc(req.params.id).update({
      variants,
      updatedAt: new Date().toISOString(),
    });

    res.json(variants[index]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar variante' });
  }
});

// DELETE variante
router.delete('/:id/variants/:variantId', verifyToken, requireOwnerOrAdmin(async (req) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) throw new Error('not found');
  const shopDoc = await db.collection('pastryShops').doc(doc.data().shop_id).get();
  if (!shopDoc.exists) throw new Error('not found');
  return shopDoc.data().owner_id;
}), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const variants = doc.data().variants || [];
    const updated  = variants.filter(v => v.variant_id !== req.params.variantId);

    if (updated.length === variants.length) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    await col.doc(req.params.id).update({
      variants:  updated,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Variante eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar variante' });
  }
});

module.exports = router;