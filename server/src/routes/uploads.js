const express = require('express');
const router = express.Router();
const { admin, bucket } = require('../config/firebase');
const { verifyToken } = require('../middlewares/auth');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function extractBase64Data(dataUrl) {
  const match = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error('Formato de imagen inválido. Usa data:image/jpeg, data:image/png o data:image/webp');
  const mime = match[1];
  const raw = match[3];
  const buffer = Buffer.from(raw, 'base64');
  const approxSize = buffer.length;
  return { mime, buffer, size: approxSize };
}

async function uploadToStorage(buffer, mime, storagePath) {
  const ext = MIME_EXT[mime] || 'jpg';
  const fullPath = `${storagePath}.${ext}`;
  const file = bucket.file(fullPath);
  await file.save(buffer, {
    metadata: { contentType: mime },
  });
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;
  return publicUrl;
}

// POST /api/uploads/shop-image
router.post('/shop-image', verifyToken, async (req, res) => {
  try {
    const { image, shop_id, type } = req.body;
    if (!image || !shop_id) {
      return res.status(400).json({ error: 'image y shop_id son requeridos' });
    }
    const { mime, buffer, size } = extractBase64Data(image);
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: 'La imagen no debe superar 5MB' });
    }
    const imgType = type === 'banner' ? 'banner' : 'logo';
    const url = await uploadToStorage(buffer, mime, `shops/${shop_id}/${imgType}`);
    res.json({ url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Error al subir imagen de pastelería' });
  }
});

// POST /api/uploads/product-image
router.post('/product-image', verifyToken, async (req, res) => {
  try {
    const { image, shop_id, product_id } = req.body;
    if (!image || !shop_id) {
      return res.status(400).json({ error: 'image y shop_id son requeridos' });
    }
    const { mime, buffer, size } = extractBase64Data(image);
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: 'La imagen no debe superar 5MB' });
    }
    const suffix = product_id || Date.now().toString();
    const url = await uploadToStorage(buffer, mime, `products/${shop_id}/${suffix}`);
    res.json({ url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Error al subir imagen de producto' });
  }
});

// POST /api/uploads/profile-image
router.post('/profile-image', verifyToken, async (req, res) => {
  try {
    const { image, user_id } = req.body;
    if (!image || !user_id) {
      return res.status(400).json({ error: 'image y user_id son requeridos' });
    }
    if (req.user.uid !== user_id && !(req.user.roles || []).includes('admin')) {
      return res.status(403).json({ error: 'No puedes subir foto para otro usuario' });
    }
    const { mime, buffer, size } = extractBase64Data(image);
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: 'La imagen no debe superar 5MB' });
    }
    const url = await uploadToStorage(buffer, mime, `profiles/${user_id}`);
    res.json({ url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Error al subir imagen de perfil' });
  }
});

module.exports = router;
