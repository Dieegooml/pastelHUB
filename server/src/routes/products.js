const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const col = db.collection('products');

// GET todos los productos
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET productos por pastelería
router.get('/shop/:shopId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col
      .where('shopId', '==', req.params.shopId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos de la pastelería' });
  }
});

// GET un producto
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// POST crear producto
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      shopId, categoryId, productName,
      description, price, stock,
      imageUrl, isAvailable,
    } = req.body;

    if (!shopId || !productName || price === undefined) {
      return res.status(400).json({ error: 'shopId, productName y price son requeridos' });
    }

    // Verificar que la pastelería existe
    const shopDoc = await db.collection('pastryShops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'La pastelería no existe' });
    }

    const data = {
      shopId,
      categoryId:   categoryId  || '',
      productName,
      description:  description || '',
      price:        parseFloat(price),
      stock:        parseInt(stock) || 0,
      imageUrl:     imageUrl    || '',
      isAvailable:  isAvailable !== undefined ? isAvailable : true,
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
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// DELETE producto
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    // Eliminar también sus variantes
    const variantsSnap = await col.doc(req.params.id).collection('variants').get();
    const batch = db.batch();
    variantsSnap.docs.forEach(v => batch.delete(v.ref));
    batch.delete(col.doc(req.params.id));
    await batch.commit();

    res.json({ message: 'Producto y sus variantes eliminados correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

// PATCH cambiar disponibilidad
router.patch('/:id/availability', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable debe ser true o false' });
    }

    await col.doc(req.params.id).update({ isAvailable, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, isAvailable });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar disponibilidad' });
  }
});

// ── VARIANTES (subcolección) ──────────────────────────────────────────

// GET variantes de un producto
router.get('/:id/variants', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await col.doc(req.params.id).collection('variants').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
});

// POST crear variante
router.post('/:id/variants', verifyToken, requireAdmin, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const { variantType, variantValue, extraPrice } = req.body;
    if (!variantType || !variantValue) {
      return res.status(400).json({ error: 'variantType y variantValue son requeridos' });
    }

    const data = {
      variantType,
      variantValue,
      extraPrice: parseFloat(extraPrice) || 0,
    };

    const ref = await col.doc(req.params.id).collection('variants').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear la variante' });
  }
});

// PUT actualizar variante
router.put('/:id/variants/:variantId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const variantRef = col.doc(req.params.id).collection('variants').doc(req.params.variantId);
    const variantDoc = await variantRef.get();
    if (!variantDoc.exists) return res.status(404).json({ error: 'Variante no encontrada' });

    const updates = { ...req.body };
    if (updates.extraPrice !== undefined) updates.extraPrice = parseFloat(updates.extraPrice);

    await variantRef.update(updates);
    res.json({ id: req.params.variantId, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la variante' });
  }
});

// DELETE variante
router.delete('/:id/variants/:variantId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const variantRef = col.doc(req.params.id).collection('variants').doc(req.params.variantId);
    const variantDoc = await variantRef.get();
    if (!variantDoc.exists) return res.status(404).json({ error: 'Variante no encontrada' });

    await variantRef.delete();
    res.json({ message: 'Variante eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar la variante' });
  }
});

module.exports = router;