const listeners = new Map();

function on(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  return () => listeners.get(event)?.delete(cb);
}

function emit(event, data) {
  listeners.get(event)?.forEach(cb => { try { cb(data); } catch (e) { console.error('WS listener error', e); } });
}

let ws = null;
let token = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 20;
const baseDelay = 1000;
let connected = false;
let heartbeatTimer = null;

function getUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = import.meta.env.VITE_WS_URL || `${protocol}://${window.location.hostname}:3001`;
  return `${host}?token=${token}`;
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 25000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function doConnect() {
  if (ws) doDisconnect();
  if (!token) return;

  ws = new WebSocket(getUrl());

  ws.onopen = () => {
    connected = true;
    reconnectAttempts = 0;
    startHeartbeat();
    emit('connect');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      emit(msg.type, msg);
      if (msg.type === 'chat:message') emit('chat:message', msg.data);
      if (msg.type === 'chat:typing') emit('chat:typing', msg);
      if (msg.type === 'notification:new') emit('notification:new', msg.data);
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onclose = () => {
    connected = false;
    stopHeartbeat();
    emit('disconnect');
    scheduleReconnect();
  };

  ws.onerror = () => {};
}

function doDisconnect() {
  reconnectAttempts = maxReconnectAttempts;
  stopHeartbeat();
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.onopen = null;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
    ws = null;
  }
  connected = false;
}

function scheduleReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) return;
  const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  setTimeout(() => doConnect(), delay);
}

export const websocketService = {
  connect(newToken) {
    token = newToken;
    reconnectAttempts = 0;
    doConnect();
  },

  disconnect() {
    doDisconnect();
  },

  send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  },

  sendMessage(sessionId, text) {
    return this.send({ type: 'chat:message', sessionId, text });
  },

  sendTyping(sessionId) {
    this.send({ type: 'chat:typing', sessionId });
  },

  markNotificationRead(notificationId) {
    this.send({ type: 'notification:read', notificationId });
  },

  onMessage(cb) {
    return on('chat:message', cb);
  },

  onTyping(cb) {
    return on('chat:typing', cb);
  },

  onNewNotification(cb) {
    return on('notification:new', cb);
  },

  onConnect(cb) {
    return on('connect', cb);
  },

  onDisconnect(cb) {
    return on('disconnect', cb);
  },

  on(event, cb) {
    return on(event, cb);
  },

  get connected() { return connected; },
};

export default websocketService;
