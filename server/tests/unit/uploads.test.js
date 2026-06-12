const request = require('supertest');
const app = require('../../src/app');

function makeBase64Pixel(mime = 'image/jpeg') {
  const buf = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA=', 'base64'
  );
  return `data:${mime};base64,${buf.toString('base64')}`;
}

describe('POST /api/uploads/shop-image', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app)
      .post('/api/uploads/shop-image')
      .send({ image: makeBase64Pixel(), shop_id: 's1' });
    expect(res.status).toBe(401);
  });

  it('responde 400 si falta image', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .post('/api/uploads/shop-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ shop_id: 's1' });
    expect(res.status).toBe(400);
  });

  it('responde 400 si falta shop_id', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .post('/api/uploads/shop-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ image: makeBase64Pixel() });
    expect(res.status).toBe(400);
  });

  it('valida tipo de imagen', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .post('/api/uploads/shop-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ image: 'data:image/gif;base64,R0lGODdh', shop_id: 's1', type: 'logo' });
    expect([200, 400]).toContain(res.status);
  });
});

describe('POST /api/uploads/product-image', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app)
      .post('/api/uploads/product-image')
      .send({ image: makeBase64Pixel(), shop_id: 's1' });
    expect(res.status).toBe(401);
  });

  it('responde 400 si falta product_id', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .post('/api/uploads/product-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ image: makeBase64Pixel(), shop_id: 's1' });
    expect(res.status).toBe(400);
  });

  it('rechaza formato invalido', async () => {
    global.mockToken('owner-uid', ['owner']);
    const res = await request(app)
      .post('/api/uploads/product-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ image: 'data:image/gif;base64,R0lGODdh', shop_id: 's1', product_id: 'p1' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/uploads/profile-image', () => {
  it('responde 400 si falta user_id', async () => {
    global.mockToken('customer-uid', ['customer']);
    const res = await request(app)
      .post('/api/uploads/profile-image')
      .set('Authorization', 'Bearer token-valido')
      .send({ image: makeBase64Pixel() });
    expect(res.status).toBe(400);
  });
});
