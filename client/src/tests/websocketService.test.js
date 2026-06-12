import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockWsInstance;
let mockWsOnOpen;

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.OPEN;
    mockWsInstance = this;
    mockWsOnOpen = () => {};
    setTimeout(() => {
      if (this.onopen) {
        mockWsOnOpen = this.onopen;
        this.onopen();
      }
    }, 0);
  }
  send(data) { this._lastSent = data; }
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;

import websocketService from '../services/websocketService';

describe('websocketService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockWsInstance = null;
    mockWsOnOpen = () => {};
  });

  afterEach(() => {
    websocketService.disconnect();
    vi.useRealTimers();
  });

  function connectAndOpen() {
    websocketService.connect('token-123');
    vi.advanceTimersByTime(10);
  }

  it('connect crea WebSocket con token', () => {
    websocketService.connect('token-123');
    expect(mockWsInstance).toBeTruthy();
    expect(mockWsInstance.url).toContain('token=token-123');
  });

  it('connect emite evento connect', () => {
    const cb = vi.fn();
    websocketService.onConnect(cb);
    connectAndOpen();
    expect(cb).toHaveBeenCalled();
  });

  it('send envia datos como JSON', () => {
    connectAndOpen();
    const result = websocketService.send({ type: 'test', data: 'hello' });
    expect(result).toBe(true);
    expect(JSON.parse(mockWsInstance._lastSent)).toEqual({ type: 'test', data: 'hello' });
  });

  it('send retorna false si no conectado', () => {
    const result = websocketService.send({ type: 'test' });
    expect(result).toBe(false);
  });

  it('sendMessage envia mensaje de chat', () => {
    connectAndOpen();
    websocketService.sendMessage('s1', 'hola');
    const sent = JSON.parse(mockWsInstance._lastSent);
    expect(sent.type).toBe('chat:message');
    expect(sent.sessionId).toBe('s1');
    expect(sent.text).toBe('hola');
  });

  it('sendTyping envia typing event', () => {
    connectAndOpen();
    websocketService.sendTyping('s1');
    const sent = JSON.parse(mockWsInstance._lastSent);
    expect(sent.type).toBe('chat:typing');
    expect(sent.sessionId).toBe('s1');
  });

  it('markNotificationRead envia notification:read', () => {
    connectAndOpen();
    websocketService.markNotificationRead('n1');
    const sent = JSON.parse(mockWsInstance._lastSent);
    expect(sent.type).toBe('notification:read');
    expect(sent.notificationId).toBe('n1');
  });

  it('onMessage registra listener y recibe mensajes', () => {
    const cb = vi.fn();
    websocketService.onMessage(cb);
    connectAndOpen();
    if (mockWsInstance.onmessage) {
      mockWsInstance.onmessage({ data: JSON.stringify({ type: 'chat:message', data: { text: 'hi' } }) });
    }
    expect(cb).toHaveBeenCalledWith({ text: 'hi' });
  });

  it('onNewNotification registra listener y recibe notificaciones', () => {
    const cb = vi.fn();
    websocketService.onNewNotification(cb);
    connectAndOpen();
    if (mockWsInstance.onmessage) {
      mockWsInstance.onmessage({ data: JSON.stringify({ type: 'notification:new', data: { message: 'test' } }) });
    }
    expect(cb).toHaveBeenCalledWith({ message: 'test' });
  });

  it('onConnect registra listener de conexion', () => {
    const cb = vi.fn();
    websocketService.onConnect(cb);
    connectAndOpen();
    expect(cb).toHaveBeenCalled();
  });

  it('onDisconnect registra listener de desconexion', () => {
    const cb = vi.fn();
    websocketService.onDisconnect(cb);
    connectAndOpen();
    mockWsInstance.onclose();
    expect(cb).toHaveBeenCalled();
  });

  it('disconnect cierra conexion', () => {
    connectAndOpen();
    websocketService.disconnect();
    expect(websocketService.connected).toBe(false);
  });

  it('connected retorna true cuando conectado', () => {
    connectAndOpen();
    expect(websocketService.connected).toBe(true);
  });

  it('on registra listener generico', () => {
    const cb = vi.fn();
    websocketService.on('custom-event', cb);
    connectAndOpen();
    if (mockWsInstance.onmessage) {
      mockWsInstance.onmessage({ data: JSON.stringify({ type: 'custom-event', data: 'x' }) });
    }
    expect(cb).toHaveBeenCalledWith({ type: 'custom-event', data: 'x' });
  });
});
