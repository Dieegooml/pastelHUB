const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  jest.resetModules();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('mercadopago config — sin token', () => {
  it('isConfigured retorna false sin token', () => {
    const mp = require('../../src/config/mercadopago');
    expect(mp.isConfigured()).toBe(false);
  });

  it('getPreferenceApi retorna null sin token', () => {
    const mp = require('../../src/config/mercadopago');
    expect(mp.getPreferenceApi()).toBeNull();
  });

  it('getPaymentApi retorna null sin token', () => {
    const mp = require('../../src/config/mercadopago');
    expect(mp.getPaymentApi()).toBeNull();
  });
});

describe('mercadopago config — con token', () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-123456789';
    jest.resetModules();
  });

  it('isConfigured retorna true con token', () => {
    const mp = require('../../src/config/mercadopago');
    expect(mp.isConfigured()).toBe(true);
  });

  it('exporta clases de MercadoPago', () => {
    const mp = require('../../src/config/mercadopago');
    expect(mp.MercadoPagoConfig).toBeDefined();
    expect(mp.Preference).toBeDefined();
    expect(mp.Payment).toBeDefined();
  });
});
