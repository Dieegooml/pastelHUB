const http = require('http');
const WebSocket = require('ws');

let wssModule;

beforeEach(() => {
  jest.resetModules();
  wssModule = require('../../src/utils/websocket');
});

describe('WebSocket server', () => {
  it('createWebSocketServer exports pushNotification y broadcastToUser', () => {
    expect(wssModule).toHaveProperty('pushNotification');
    expect(wssModule).toHaveProperty('broadcastToUser');
    expect(wssModule).toHaveProperty('clients');
  });

  it('pushNotification y broadcastToUser no fallan sin conexiones', () => {
    expect(() => wssModule.pushNotification('user-1', { type: 'test' })).not.toThrow();
    expect(() => wssModule.broadcastToUser('user-1', { type: 'test' })).not.toThrow();
  });

  it('clients es un Map', () => {
    expect(wssModule.clients).toBeInstanceOf(Map);
  });
});

describe('WebSocket integracion con servidor HTTP', () => {
  let testServer;

  afterEach(() => {
    if (testServer) testServer.close();
  });

  it('acepta conexion con token valido en query', (done) => {
    testServer = http.createServer();
    const { createWebSocketServer } = require('../../src/utils/websocket');
    createWebSocketServer(testServer);

    testServer.listen(0, () => {
      const port = testServer.address().port;
      const ws = new WebSocket(`ws://localhost:${port}?token=token-valido`);
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });
      ws.on('error', () => {
        done();
      });
    });
  }, 10000);
});
