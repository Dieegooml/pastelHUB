const request = require('supertest');
const app = require('../../src/app');

const mockSession = {
  userId: 'customer-uid',
  userRole: 'customer',
  status: 'active',
  context: '',
};

function mockDoc() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    add: jest.fn(),
    collection: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
  };
}

function makeRefWithMessages(subDocs = [], docId = 'session-1') {
  const ref = mockDoc();
  ref.id = docId;
  ref.get.mockResolvedValue({ exists: true, data: () => mockSession, id: docId, ref });
  const msgDocs = subDocs.map((m, i) => ({ id: m.id || `msg-${i}`, data: () => m }));
  ref.collection = jest.fn().mockReturnValue({
    orderBy: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: msgDocs, empty: msgDocs.length === 0, forEach: jest.fn() }),
    }),
    add: jest.fn().mockResolvedValue({ id: 'msg-id' }),
  });
  return ref;
}

describe('POST /api/chat/sessions', () => {
  beforeEach(() => {
    global.mockFirestore.add.mockResolvedValue({ id: 'new-session' });
    global.mockFirestore._limit = undefined;
    global.mockFirestore._offset = undefined;
  });

  it('crea sesión correctamente como customer', async () => {
    global.mockToken('customer-uid', ['customer']);
    const ref = makeRefWithMessages();
    ref.add = jest.fn().mockResolvedValue({ id: 'session-1' });
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'welcome-msg' }),
    });
    global.mockFirestore.add.mockResolvedValue(ref);
    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('session-1');
    expect(res.body.status).toBe('active');
    expect(res.body.welcomeMessage).toBeDefined();
  });

  it('crea sesión como owner', async () => {
    global.mockToken('owner-uid', ['owner']);
    const ref = makeRefWithMessages();
    ref.add = jest.fn().mockResolvedValue({ id: 'session-2' });
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'welcome-msg' }),
    });
    global.mockFirestore.add.mockResolvedValue(ref);
    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', 'Bearer token-valido')
      .send({ context: 'consulta sobre ventas' });
    expect(res.status).toBe(201);
    expect(res.body.userRole).toBe('owner');
  });

  it('responde 401 sin token', async () => {
    const res = await request(app)
      .post('/api/chat/sessions')
      .send({});
    expect(res.status).toBe(401);
  });

  it('responde 401 con token inválido', async () => {
    global.mockFirebaseAuth.verifyIdToken.mockRejectedValue(new Error('invalido'));
    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', 'Bearer token-malo')
      .send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/chat/sessions', () => {
  beforeEach(() => {
    global.mockToken('customer-uid', ['customer']);
    global.mockFirestore._limit = undefined;
    global.mockFirestore._offset = undefined;
  });

  it('lista sesiones del usuario autenticado', async () => {
    global.mockCollection([
      { ...mockSession, id: 's1' },
      { ...mockSession, id: 's2' },
    ]);
    const res = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('filtra por status', async () => {
    global.mockCollection([
      { ...mockSession, status: 'active', id: 's1' },
    ]);
    const res = await request(app)
      .get('/api/chat/sessions?status=active')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('lista vacía si no hay sesiones', async () => {
    global.mockCollection([]);
    const res = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/chat/sessions/:id', () => {
  beforeEach(() => {
    global.mockToken('customer-uid', ['customer']);
  });

  it('obtiene sesión con mensajes', async () => {
    const ref = makeRefWithMessages([
      { id: 'msg-1', senderId: 'ai', senderRole: 'ai', message: 'Hola', createdAt: '2025-01-01' },
    ]);
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);

    const res = await request(app)
      .get('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeDefined();
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].message).toBe('Hola');
  });

  it('obtiene sesión vacía si no hay mensajes', async () => {
    const ref = makeRefWithMessages([]);
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);

    const res = await request(app)
      .get('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(0);
  });

  it('responde 404 si no existe', async () => {
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: false, data: () => undefined, id: 'no-existe' });
    const res = await request(app)
      .get('/api/chat/sessions/no-existe')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });

  it('responde 403 para sesión de otro usuario', async () => {
    const otherSession = { ...mockSession, userId: 'other-uid' };
    const ref = mockDoc();
    ref.get.mockResolvedValue({ exists: true, data: () => otherSession, id: 'session-1', ref });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    const res = await request(app)
      .get('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('admin puede ver cualquier sesión', async () => {
    global.mockToken('admin-uid', ['admin']);
    const otherSession = { ...mockSession, userId: 'other-uid' };
    const ref = makeRefWithMessages([]);
    ref.get.mockResolvedValue({ exists: true, data: () => otherSession, id: 'session-1', ref });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);

    const res = await request(app)
      .get('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/chat/sessions/:id/messages', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    global.mockToken('customer-uid', ['customer']);
  });

  it('envía mensaje y recibe respuesta AI', async () => {
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => mockSession, id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: callCount === 1 ? 'user-msg-1' : 'ai-msg-1' });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cuál es el estado de mi pedido?' });
    expect(res.status).toBe(201);
    expect(res.body.userMessage).toBeDefined();
    expect(res.body.aiMessage).toBeDefined();
    expect(res.body.userMessage.message).toBe('¿Cuál es el estado de mi pedido?');
    expect(res.body.aiMessage.senderRole).toBe('ai');
  });

  it('responde 404 si sesión no existe', async () => {
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: false, data: () => undefined, id: 'no-existe' });
    const res = await request(app)
      .post('/api/chat/sessions/no-existe/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(404);
  });

  it('responde 403 para sesión de otro usuario', async () => {
    const otherSession = { ...mockSession, userId: 'other-uid' };
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: true, data: () => otherSession, id: 'session-1', ref: mockDoc() });
    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(403);
  });

  it('responde 400 si mensaje está vacío', async () => {
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: true, data: () => mockSession, id: 'session-1', ref: mockDoc() });
    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '' });
    expect(res.status).toBe(400);
  });

});

describe('DELETE /api/chat/sessions/:id', () => {
  beforeEach(() => {
    global.mockToken('customer-uid', ['customer']);
  });

  it('elimina sesión y sus mensajes', async () => {
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => mockSession, id: 'session-1', ref });

    const deleteFn = jest.fn();
    const msgDocs = [{ ref: { delete: deleteFn } }, { ref: { delete: deleteFn } }];
    ref.collection = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: msgDocs, forEach: jest.fn(cb => msgDocs.forEach(cb)) }),
    });

    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.batch = jest.fn().mockReturnValue({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(),
    });

    const res = await request(app)
      .delete('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Sesión eliminada');
  });

  it('responde 404 si no existe', async () => {
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: false, data: () => undefined, id: 'no-existe' });
    const res = await request(app)
      .delete('/api/chat/sessions/no-existe')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });

  it('responde 403 para sesión de otro usuario', async () => {
    const otherSession = { ...mockSession, userId: 'other-uid' };
    global.mockFirestore.doc = jest.fn().mockReturnThis();
    global.mockFirestore.get = jest.fn().mockResolvedValue({ exists: true, data: () => otherSession, id: 'session-1' });
    const res = await request(app)
      .delete('/api/chat/sessions/session-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });
});

describe('Fallback AI responses', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('responde sobre pedidos cuando no hay API key', async () => {
    global.mockToken('fallback-uid', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'fallback-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Dónde está mi pedido?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('Mis órdenes');
  });

  it('responde saludo cuando no hay API key', async () => {
    global.mockToken('fallback-uid', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'fallback-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('Hola');
  });

  it('customer no recibe información sobre panel admin', async () => {
    global.mockToken('restricted-customer', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'restricted-customer' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cómo funciona el panel de administración?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toBe('Lo siento, el panel de administración solo está disponible para usuarios con rol de administrador.');
  });

  it('customer no recibe información sobre gestión de dueño', async () => {
    global.mockToken('restricted-customer', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'restricted-customer' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cómo gestiono mi pastelería como dueño?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toBe('Lo siento, la gestión de pastelerías solo está disponible para dueños de pastelería.');
  });

  it('customer no recibe información sobre moderación', async () => {
    global.mockToken('restricted-customer', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'restricted-customer' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cómo moderar reseñas pendientes?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toBe('Lo siento, la moderación de contenido solo está disponible para moderadores y administradores.');
  });

  it('customer no recibe información sobre roles', async () => {
    global.mockToken('restricted-customer', ['customer']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'restricted-customer' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cómo cambio los roles de los usuarios?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toBe('Lo siento, la gestión de roles solo está disponible para administradores.');
  });

  it('owner recibe respuesta sobre pedidos adaptada a su rol', async () => {
    global.mockToken('owner-uid', ['owner']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'owner-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Dónde veo los pedidos?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('Dueño');
  });

  it('owner recibe saludo adaptado a su rol', async () => {
    global.mockToken('owner-uid', ['owner']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'owner-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('gestión de tu pastelería');
  });

  it('owner no recibe información sobre admin', async () => {
    global.mockToken('owner-uid', ['owner']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'owner-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '¿Cómo funciona el panel de administración?' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toBe('Lo siento, el panel de administración solo está disponible para usuarios con rol de administrador.');
  });

  it('moderator recibe saludo adaptado a su rol', async () => {
    global.mockToken('mod-uid', ['moderator']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'mod-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('moderación');
  });

  it('admin recibe saludo completo', async () => {
    global.mockToken('admin-uid', ['admin']);
    const ref = makeRefWithMessages();
    ref.get.mockResolvedValue({ exists: true, data: () => ({ ...mockSession, userId: 'admin-uid' }), id: 'session-1', ref });
    let callCount = 0;
    ref.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ id: `msg-${callCount}` });
      }),
    });
    global.mockFirestore.doc = jest.fn().mockReturnValue(ref);
    global.mockFirestore.update = jest.fn().mockResolvedValue();

    const res = await request(app)
      .post('/api/chat/sessions/session-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(201);
    expect(res.body.aiMessage.message).toContain('cualquier funcionalidad');
  });
});
