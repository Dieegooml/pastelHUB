const request = require('supertest');
const app = require('../../src/app');

const mockTicket = {
  userId: 'customer-uid',
  userRole: 'customer',
  subject: 'Problema con pedido',
  priority: 'high',
  status: 'open',
  assignedTo: '',
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

describe('POST /api/support/tickets', () => {
  beforeEach(() => {
    global.mockFirestore.add.mockResolvedValue({ id: 'new-ticket' });
  });

  it('crea ticket correctamente como customer', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockFirestore.add.mockResolvedValue(
      Object.assign(mockDoc(), { id: 'new-ticket' })
    );
    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido')
      .send({ subject: 'Problema con pedido', message: 'Necesito ayuda' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new-ticket');
    expect(res.body.status).toBe('open');
  });

  it('crea ticket como owner', async () => {
    global.mockToken('owner-uid', ['owner']);
    global.mockFirestore.add.mockResolvedValue(
      Object.assign(mockDoc(), { id: 'ticket-2' })
    );
    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido')
      .send({ subject: 'Problema con producto', message: 'Ayuda por favor' });
    expect(res.status).toBe(201);
    expect(res.body.userRole).toBe('owner');
  });

  it('responde 403 si no es customer ni owner', async () => {
    global.mockToken('mod-uid', ['moderator']);
    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido')
      .send({ subject: 'Test', message: 'Mensaje' });
    expect(res.status).toBe(403);
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('customer-uid', ['customer']);
    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app)
      .post('/api/support/tickets')
      .send({ subject: 'Test', message: 'Mensaje' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/support/tickets', () => {
  it('admin ve todos los tickets', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 't1', ...mockTicket }]);
    const res = await request(app)
      .get('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('customer ve solo sus tickets', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockCollection([{ id: 't1', userId: 'customer-uid', subject: 'Test' }]);
    const res = await request(app)
      .get('/api/support/tickets')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('filtra por status', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 't1', status: 'open', subject: 'Test' }]);
    const res = await request(app)
      .get('/api/support/tickets?status=open')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/support/tickets');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/support/tickets/:id', () => {
  beforeEach(() => {
    global.mockFirestore.doc.mockReturnThis();
    global.mockFirestore.collection.mockReturnThis();
  });

  it('obtiene ticket por ID como admin', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ ...mockTicket, userId: 'other-user' });
    const res = await request(app)
      .get('/api/support/tickets/t-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.subject).toBe('Problema con pedido');
  });

  it('obtiene ticket como propietario', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockDocExists({ ...mockTicket, userId: 'customer-uid' });
    const res = await request(app)
      .get('/api/support/tickets/t-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 403 si no tiene permiso', async () => {
    global.mockToken('other-customer', ['customer']);
    global.mockDocExists({ ...mockTicket, userId: 'customer-uid' });
    const res = await request(app)
      .get('/api/support/tickets/t-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/support/tickets/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/support/tickets/:id/status', () => {
  beforeEach(() => {
    global.mockFirestore.doc.mockReturnThis();
    global.mockFirestore.collection.mockReturnThis();
  });

  it('cambia estado como moderator', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockDocExists({ status: 'open' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/support/tickets/t-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('responde 400 con estado invalido', async () => {
    global.mockToken('mod-uid', ['moderator']);
    const res = await request(app)
      .patch('/api/support/tickets/t-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/support/tickets/inexistente/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'resolved' });
    expect(res.status).toBe(404);
  });

  it('responde 403 si no es moderator/admin', async () => {
    global.mockToken('customer-uid', ['customer']);
    const res = await request(app)
      .patch('/api/support/tickets/t-1/status')
      .set('Authorization', 'Bearer token-valido')
      .send({ status: 'resolved' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/support/tickets/:id/assign', () => {
  beforeEach(() => {
    global.mockFirestore.doc.mockReturnThis();
    global.mockFirestore.collection.mockReturnThis();
  });

  it('asigna ticket como moderator', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockDocExists({ status: 'open' });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/support/tickets/t-1/assign')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBe('mod-uid');
    expect(res.body.status).toBe('in_progress');
  });

  it('responde 400 si el ticket ya esta resuelto', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockDocExists({ status: 'resolved' });
    const res = await request(app)
      .patch('/api/support/tickets/t-1/assign')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(400);
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('mod-uid', ['moderator']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/support/tickets/inexistente/assign')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

function makeDocRef(data, subcolSnapshot) {
  const subcol = {
    add: jest.fn().mockResolvedValue({ id: 'msg-new' }),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(subcolSnapshot || { docs: [], empty: true }),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ data: () => ({ count: subcolSnapshot?.docs?.length || 0 }) }) })),
  };
  return {
    exists: true,
    id: 't-1',
    data: () => data,
    ref: {
      collection: jest.fn(() => subcol),
    },
  };
}

describe('POST /api/support/tickets/:id/messages', () => {
  beforeEach(() => {
    global.mockFirestore.doc.mockReturnThis();
    global.mockFirestore.collection.mockReturnThis();
  });

  it('envia mensaje como customer', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValue(
      makeDocRef({ userId: 'customer-uid', userRole: 'customer', status: 'open' })
    );
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/support/tickets/t-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Un mensaje de prueba' });
    expect(res.status).toBe(201);
    expect(res.body.senderRole).toBe('customer');
  });

  it('responde 400 si falta mensaje', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValue(
      makeDocRef({ userId: 'customer-uid', status: 'open' })
    );
    const res = await request(app)
      .post('/api/support/tickets/t-1/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });

  it('responde 404 si ticket no existe', async () => {
    global.mockToken('customer-uid', ['customer']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/support/tickets/inexistente/messages')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Hola' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/support/tickets/:id/messages', () => {
  beforeEach(() => {
    global.mockFirestore.doc.mockReturnThis();
    global.mockFirestore.collection.mockReturnThis();
  });

  it('obtiene mensajes del ticket', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockFirestore.get.mockResolvedValue(
      makeDocRef(
        { userId: 'other', userRole: 'customer', status: 'open' },
        { docs: [{ id: 'm1', data: () => ({ message: 'Hola', senderRole: 'customer' }) }], empty: false }
      )
    );
    const res = await request(app)
      .get('/api/support/tickets/t-1/messages')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('responde 403 si no tiene permiso', async () => {
    global.mockToken('other-uid', ['customer']);
    global.mockFirestore.get.mockResolvedValue(
      makeDocRef({ userId: 'customer-uid', status: 'open' })
    );
    const res = await request(app)
      .get('/api/support/tickets/t-1/messages')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(403);
  });
});
