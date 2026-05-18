const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('responde 200 con status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('Ruta inexistente', () => {
  it('responde 404 con mensaje de error', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('responde 404 en POST a ruta inexistente', async () => {
    const res = await request(app).post('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ruta no encontrada');
  });
});