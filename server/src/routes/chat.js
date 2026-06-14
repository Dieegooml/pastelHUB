const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createSessionSchema, sendMessageSchema } = require('../validators/chatValidator');
const { tryPaginate } = require('../utils/paginate');
const { fetchCatalogData, getRoleKey, getAiResponse } = require('../utils/aiHelper');

const col = db.collection('chatSessions');

function canAccessSession(roles, uid, session) {
  if (roles.includes('admin')) return true;
  if (session.userId === uid) return true;
  return false;
}

router.post('/sessions', verifyToken, validate(createSessionSchema), async (req, res) => {
  try {
    const sessionData = {
      userId: req.user.uid,
      userRole: getRoleKey(req.user.roles || []),
      status: 'active',
      context: req.body.context || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await col.add(sessionData);

    const roleKey = getRoleKey(req.user?.roles || []);
    const welcomeMessages = {
      customer: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con tus pedidos, productos, pagos y más. ¿En qué puedo ayudarte?',
      owner: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con la gestión de tu pastelería, productos, pedidos y promociones. ¿En qué puedo ayudarte?',
      moderator: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con la moderación de reseñas y reportes. ¿En qué puedo ayudarte?',
      admin: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con cualquier funcionalidad del sistema. ¿En qué puedo ayudarte?',
    };
    const welcomeMessage = welcomeMessages[roleKey] || welcomeMessages.customer;
    const msgRef = await ref.collection('messages').add({
      senderId: 'ai',
      senderRole: 'ai',
      message: welcomeMessage,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: ref.id, ...sessionData, welcomeMessage: { id: msgRef.id, message: welcomeMessage } });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

router.get('/sessions', verifyToken, async (req, res) => {
  const filters = [{ field: 'userId', value: req.user.uid }];

  if (req.query.status) {
    filters.push({ field: 'status', value: req.query.status });
  }

  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', orderDirection: 'desc', filters,
  }, 'Error al obtener sesiones');
});

router.get('/sessions/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Sesión no encontrada' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessSession(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const messagesSnap = await doc.ref.collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = messagesSnap.docs.map(m => ({ id: m.id, ...m.data() }));

    res.json({ ...data, messages });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
});

router.post('/sessions/:id/messages', verifyToken, validate(sendMessageSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Sesión no encontrada' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessSession(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const { message } = req.body;

    const userMsgRef = await doc.ref.collection('messages').add({
      senderId: req.user.uid,
      senderRole: 'user',
      message,
      createdAt: new Date().toISOString(),
    });

    const catalogData = await fetchCatalogData();
    const aiText = await getAiResponse(message, req.user, catalogData);

    const aiMsgRef = await doc.ref.collection('messages').add({
      senderId: 'ai',
      senderRole: 'ai',
      message: aiText,
      createdAt: new Date().toISOString(),
    });

    await col.doc(req.params.id).update({ updatedAt: new Date().toISOString() });

    res.status(201).json({
      userMessage: { id: userMsgRef.id, senderId: req.user.uid, senderRole: 'user', message },
      aiMessage: { id: aiMsgRef.id, senderId: 'ai', senderRole: 'ai', message: aiText },
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

router.delete('/sessions/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Sesión no encontrada' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessSession(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const messagesSnap = await doc.ref.collection('messages').get();
    const batch = db.batch();
    messagesSnap.docs.forEach(m => batch.delete(m.ref));
    batch.delete(doc.ref);
    await batch.commit();

    res.json({ message: 'Sesión eliminada' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar sesión' });
  }
});

module.exports = router;
