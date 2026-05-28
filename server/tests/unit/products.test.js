const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/products', () => {
  it('responde 200 con lista de productos', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([
      { id: 'p1', name: 'Pastel', price: 25 },
      { id: 'p2', name: 'Galleta', price: 5 },
    ]);
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('responde 200 sin token (endpoint publico)', async () => {
    global.mockCollection([]);
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/products/shop/:shopId', () => {
  it('responde 200 con productos de la pasteleria', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockCollection([{ id: 'p1', name: 'Pastel', shop_id: 'shop-1' }]);
    const res = await request(app)
      .get('/api/products/shop/shop-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/products/:id', () => {
  it('responde 200 con el producto', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', price: 25 });
    const res = await request(app)
      .get('/api/products/p-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Pastel');
  });

  it('responde 404 si no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/products/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Producto no encontrado');
  });
});

describe('POST /api/products', () => {
  it('responde 201 creando producto', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Mi Pasteleria' });
    global.mockFirestore.add.mockResolvedValue({ id: 'new-prod' });
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer token-valido')
      .send({ shop_id: 'shop-1', name: 'Pastel', price: 25 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Pastel');
  });

  it('responde 400 si faltan campos', async () => {
    global.mockToken('admin-uid', ['admin']);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('shop_id');
  });

  it('responde 404 si la pasteleria no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer token-valido')
      .send({ shop_id: 'inexistente', name: 'Test', price: 10 });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('pastelería no existe');
  });
});

describe('PUT /api/products/:id', () => {
  it('actualiza un producto existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Original', price: 10 });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/products/p-1')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Actualizado', price: 15 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Actualizado');
  });

  it('responde 404 si el producto no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .put('/api/products/inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ name: 'Nuevo' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/products/:id/availability', () => {
  it('cambia disponibilidad correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', is_available: true });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .patch('/api/products/p-1/availability')
      .set('Authorization', 'Bearer token-valido')
      .send({ is_available: false });
    expect(res.status).toBe(200);
    expect(res.body.is_available).toBe(false);
  });

  it('responde 400 si is_available no es boolean', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', is_available: true });
    const res = await request(app)
      .patch('/api/products/p-1/availability')
      .set('Authorization', 'Bearer token-valido')
      .send({ is_available: 'si' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el producto no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .patch('/api/products/inexistente/availability')
      .set('Authorization', 'Bearer token-valido')
      .send({ is_available: false });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('elimina un producto existente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel' });
    global.mockFirestore.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/products/p-1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('eliminado');
  });

  it('responde 404 si el producto no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .delete('/api/products/inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/products/:id/variants', () => {
  it('responde 200 con variantes', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [{ variant_id: 'v1', type: 'size', value: 'grande' }] });
    const res = await request(app)
      .get('/api/products/p-1/variants')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('responde 404 si el producto no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocNotExists();
    const res = await request(app)
      .get('/api/products/inexistente/variants')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products/:id/variants', () => {
  it('agrega variante correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .post('/api/products/p-1/variants')
      .set('Authorization', 'Bearer token-valido')
      .send({ type: 'size', value: 'grande', extra_price: 5 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('size');
  });

  it('responde 400 si faltan type o value', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [] });
    const res = await request(app)
      .post('/api/products/p-1/variants')
      .set('Authorization', 'Bearer token-valido')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id/variants/:variantId', () => {
  it('actualiza variante correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [{ variant_id: 'v1', type: 'size', value: 'pequeño', extra_price: 0 }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/products/p-1/variants/v1')
      .set('Authorization', 'Bearer token-valido')
      .send({ value: 'grande' });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('grande');
  });

  it('responde 404 si la variante no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [] });
    const res = await request(app)
      .put('/api/products/p-1/variants/v-inexistente')
      .set('Authorization', 'Bearer token-valido')
      .send({ value: 'grande' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id/variants/:variantId', () => {
  it('elimina variante correctamente', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [{ variant_id: 'v1', type: 'size', value: 'grande' }] });
    global.mockFirestore.update.mockResolvedValue();
    const res = await request(app)
      .delete('/api/products/p-1/variants/v1')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
  });

  it('responde 404 si la variante no existe', async () => {
    global.mockToken('admin-uid', ['admin']);
    global.mockDocExists({ name: 'Pastel', variants: [] });
    const res = await request(app)
      .delete('/api/products/p-1/variants/v-inexistente')
      .set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(404);
  });
});
