const WebSocket = require('ws');
const { admin } = require('../config/firebase');
const { db } = require('../config/firebase');
const logger = require('./logger');
const { getAiResponse, fetchCatalogData, getRoleKey } = require('./aiHelper');

const clients = new Map();
const wsRateLimits = new Map();

function createWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 });

  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) {
        ws.close(4001, 'Token requerido');
        return;
      }

      const decoded = await admin.auth().verifyIdToken(token);
      const userId = decoded.uid;
      const roles = decoded.roles || [];

      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId).add(ws);

      ws.userId = userId;
      ws.roles = roles;
      ws.userName = decoded.name || '';
      ws.isAlive = true;

      logger.info('WebSocket connected', { userId });

      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          await handleMessage(ws, msg);
        } catch (e) {
          logger.error('WS message parse error', { error: e.message });
          ws.send(JSON.stringify({ type: 'error', message: 'Error al procesar mensaje' }));
        }
      });

      ws.on('close', () => {
        const conns = clients.get(userId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) clients.delete(userId);
        }
        wsRateLimits.delete(ws);
        logger.info('WebSocket disconnected', { userId });
      });

      ws.on('error', (err) => {
        logger.error('WebSocket error', { userId, error: err.message });
      });

      ws.send(JSON.stringify({ type: 'connected', userId }));
    } catch (e) {
      logger.error('WS auth error', { error: e.message });
      ws.close(4001, 'Token inválido');
    }
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        const uid = ws.userId || 'unknown';
        const conns = clients.get(uid);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) clients.delete(uid);
        }
        wsRateLimits.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  const rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ws, timestamps] of wsRateLimits) {
      const valid = timestamps.filter(t => now - t < 60000);
      if (valid.length === 0) wsRateLimits.delete(ws);
      else wsRateLimits.set(ws, valid);
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(rateLimitCleanup);
    clients.clear();
    wsRateLimits.clear();
  });

  return wss;
}

function checkWsRateLimit(ws) {
  const now = Date.now();
  const timestamps = wsRateLimits.get(ws) || [];
  const valid = timestamps.filter(t => now - t < 60000);
  if (valid.length >= 10) return false;
  valid.push(now);
  wsRateLimits.set(ws, valid);
  return true;
}

async function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'chat:message':
      await handleChatMessage(ws, msg);
      break;
    case 'chat:typing':
      handleTyping(ws, msg);
      break;
    case 'chat:read':
      await handleChatRead(ws, msg);
      break;
    case 'notification:read':
      await handleNotificationRead(ws, msg);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensaje desconocido' }));
  }
}

async function handleChatMessage(ws, msg) {
  if (!checkWsRateLimit(ws)) {
    return ws.send(JSON.stringify({ type: 'error', message: 'Demasiados mensajes, espera un momento' }));
  }

  try {
    const { sessionId, text } = msg;
    if (!sessionId || !text) {
      return ws.send(JSON.stringify({ type: 'error', message: 'sessionId y text son requeridos' }));
    }

    const col = db.collection('chatSessions');
    const doc = await col.doc(sessionId).get();

    if (!doc.exists) {
      return ws.send(JSON.stringify({ type: 'error', message: 'Sesión no encontrada' }));
    }

    const sessionData = { id: doc.id, ...doc.data() };
    if (!canAccessSession(ws.roles, ws.userId, sessionData)) {
      return ws.send(JSON.stringify({ type: 'error', message: 'No tienes permiso' }));
    }

    const now = new Date().toISOString();

    const userMsgRef = await doc.ref.collection('messages').add({
      senderId: ws.userId,
      senderRole: 'user',
      message: text,
      createdAt: now,
    });

    const userMsg = { id: userMsgRef.id, senderId: ws.userId, senderRole: 'user', message: text };

    ws.send(JSON.stringify({ type: 'chat:message', data: { userMessage: userMsg } }));

    const catalogData = await fetchCatalogData();
    const userData = { uid: ws.userId, roles: ws.roles, name: ws.userName };
    const aiText = await getAiResponse(text, userData, catalogData);

    const aiMsgRef = await doc.ref.collection('messages').add({
      senderId: 'ai',
      senderRole: 'ai',
      message: aiText,
      createdAt: new Date().toISOString(),
    });

    await col.doc(sessionId).update({ updatedAt: now });

    const aiMsg = { id: aiMsgRef.id, senderId: 'ai', senderRole: 'ai', message: aiText };

    ws.send(JSON.stringify({ type: 'chat:message', data: { aiMessage: aiMsg } }));
  } catch (e) {
    logger.error('WS chat:message error', { error: e.message });
    ws.send(JSON.stringify({ type: 'error', message: 'Error al procesar mensaje' }));
  }
}

function handleTyping(ws, msg) {
  const conns = clients.get(ws.userId);
  if (conns) {
    const payload = JSON.stringify({
      type: 'chat:typing',
      sessionId: msg.sessionId,
      userId: ws.userId,
      isTyping: true,
    });
    conns.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

async function handleChatRead(ws, msg) {
  ws.send(JSON.stringify({ type: 'chat:read', sessionId: msg.sessionId, status: 'ok' }));
}

async function handleNotificationRead(ws, msg) {
  try {
    const { notificationId } = msg;
    if (!notificationId) {
      return ws.send(JSON.stringify({ type: 'error', message: 'notificationId requerido' }));
    }
    const doc = await db.collection('notifications').doc(notificationId).get();
    if (!doc.exists) {
      return ws.send(JSON.stringify({ type: 'error', message: 'Notificación no encontrada' }));
    }
    const roles = ws.roles || [];
    if (!roles.includes('admin') && doc.data().userId !== ws.userId) {
      return ws.send(JSON.stringify({ type: 'error', message: 'No tienes permiso' }));
    }
    await doc.ref.update({ isRead: true });
    ws.send(JSON.stringify({ type: 'notification:read', notificationId, status: 'ok' }));
  } catch (e) {
    logger.error('WS notification:read error', { error: e.message });
    ws.send(JSON.stringify({ type: 'error', message: 'Error al marcar como leída' }));
  }
}

function canAccessSession(roles, uid, session) {
  if (roles.includes('admin')) return true;
  if (session.userId === uid) return true;
  return false;
}

function broadcastToUser(userId, data) {
  const conns = clients.get(userId);
  if (conns) {
    const payload = JSON.stringify(data);
    conns.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

function pushNotification(userId, notification) {
  broadcastToUser(userId, { type: 'notification:new', data: notification });
}

module.exports = { createWebSocketServer, pushNotification, broadcastToUser, clients };
