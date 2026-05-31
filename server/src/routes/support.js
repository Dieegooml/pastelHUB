const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin, requireModerator, requireCustomer } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  createTicketSchema, updateTicketStatusSchema, assignTicketSchema, sendMessageSchema,
} = require('../validators/supportValidator');
const { tryPaginate } = require('../utils/paginate');

const col = db.collection('supportTickets');

function canAccessTicket(roles, uid, ticket) {
  if (roles.includes('admin')) return true;
  if (roles.includes('moderator')) return true;
  if (ticket.userId === uid) return true;
  return false;
}

// POST — crear ticket (customer/owner)
router.post('/tickets', verifyToken, validate(createTicketSchema), async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('customer') && !roles.includes('owner')) {
      return res.status(403).json({ error: 'Solo clientes o dueños pueden crear tickets' });
    }

    const { subject, priority, message } = req.body;

    const ticketData = {
      userId: req.user.uid,
      userRole: roles.includes('owner') ? 'owner' : 'customer',
      subject,
      priority: priority || 'medium',
      status: 'open',
      assignedTo: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: '',
    };

    const ref = await col.add(ticketData);

    // Crear primer mensaje del hilo
    await ref.collection('messages').add({
      senderId: req.user.uid,
      senderRole: ticketData.userRole,
      message,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: ref.id, ...ticketData });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

// GET — listar tickets
// Admin/moderator: todos; customer/owner: solo propios
router.get('/tickets', verifyToken, async (req, res) => {
  const roles = req.user?.roles || [];
  const filters = [];

  if (!roles.includes('admin') && !roles.includes('moderator')) {
    filters.push({ field: 'userId', value: req.user.uid });
  }

  if (req.query.status) {
    filters.push({ field: 'status', value: req.query.status });
  }

  await tryPaginate(res, col, req.query, {
    orderBy: 'createdAt', orderDirection: 'desc', filters,
  }, 'Error al obtener tickets');
});

// GET — ticket por ID
router.get('/tickets/:id', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessTicket(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

// PATCH — cambiar estado (moderator/admin)
router.patch('/tickets/:id/status', verifyToken, requireModerator, validate(updateTicketStatusSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { status } = req.body;
    const updates = { status, updatedAt: new Date().toISOString() };
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date().toISOString();
    }

    await col.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...updates });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

// PATCH — asignar ticket (moderator/admin se asigna a sí mismo)
router.patch('/tickets/:id/assign', verifyToken, requireModerator, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

    if (doc.data().status === 'resolved' || doc.data().status === 'closed') {
      return res.status(400).json({ error: 'No puedes asignar un ticket resuelto o cerrado' });
    }

    const moderatorId = req.user.uid;
    await col.doc(req.params.id).update({
      assignedTo: moderatorId,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: req.params.id, assignedTo: moderatorId, status: 'in_progress' });
  } catch (e) {
    res.status(500).json({ error: 'Error al asignar ticket' });
  }
});

// POST — enviar mensaje
router.post('/tickets/:id/messages', verifyToken, validate(sendMessageSchema), async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessTicket(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const roles = req.user?.roles || [];
    let senderRole = 'customer';
    if (roles.includes('owner')) senderRole = 'owner';
    if (roles.includes('moderator')) senderRole = 'moderator';
    if (roles.includes('admin')) senderRole = 'admin';

    const { message } = req.body;
    const msgRef = await doc.ref.collection('messages').add({
      senderId: req.user.uid,
      senderRole,
      message,
      createdAt: new Date().toISOString(),
    });

    // Actualizar timestamp del ticket
    await col.doc(req.params.id).update({ updatedAt: new Date().toISOString() });

    res.status(201).json({ id: msgRef.id, senderId: req.user.uid, senderRole, message });
  } catch (e) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// GET — mensajes de un ticket
router.get('/tickets/:id/messages', verifyToken, async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });

    const data = { id: doc.id, ...doc.data() };
    if (!canAccessTicket(req.user?.roles || [], req.user.uid, data)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const snap = await doc.ref.collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ data: messages });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

module.exports = router;
