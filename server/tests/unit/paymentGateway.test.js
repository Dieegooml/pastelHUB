const { createPreference, processPayment, handleWebhook, getPaymentStatus, isConfigured } = require('../../src/utils/paymentGateway');

describe('paymentGateway (modo simulado)', () => {
  beforeEach(() => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  });

  describe('isConfigured', () => {
    it('retorna false sin token', () => {
      expect(isConfigured()).toBe(false);
    });
  });

  describe('createPreference', () => {
    it('crea preferencia simulada', async () => {
      const result = await createPreference({ orderId: 'o1', items: [{ name: 'Pastel', price: 20, quantity: 1 }] });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^SIM-PREF-/);
      expect(result.initPoint).toBe('#');
    });
  });

  describe('processPayment', () => {
    it('procesa pago simulado exitosamente', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      try {
        const result = await processPayment({ transaction_amount: 100, payment_method_id: 'card' });
        expect(result).toHaveProperty('id');
        expect(result.id).toMatch(/^SIM-/);
        expect(result.status).toBe('approved');
        expect(result.transactionRef).toMatch(/^MP-/);
      } finally {
        Math.random = originalRandom;
      }
    }, 10000);

    it('puede fallar (10% de probabilidad)', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.95);
      try {
        await expect(processPayment({ transaction_amount: 50 }))
          .rejects
          .toThrow('Fondos insuficientes');
      } finally {
        Math.random = originalRandom;
      }
    }, 10000);
  });

  describe('getPaymentStatus', () => {
    it('retorna estado simulado', async () => {
      const result = await getPaymentStatus('pay-1');
      expect(result.status).toBe('approved');
      expect(result.transactionRef).toMatch(/^MP-SIM-/);
    });
  });

  describe('handleWebhook', () => {
    it('procesa webhook simulado', async () => {
      const result = await handleWebhook({ action: 'payment.created', data: { id: 'pay-1' }, type: 'payment' }, {}, '');
      expect(result.valid).toBe(true);
      expect(result.handled).toBe(true);
      expect(result.status).toBe('approved');
    });
  });
});
