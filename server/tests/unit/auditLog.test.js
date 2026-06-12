const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
const mockDb = { collection: jest.fn(), doc: jest.fn() };

jest.mock('../../src/config/firebase', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => mockLogger);

const { createAuditLog, VALID_ACTIONS } = require('../../src/utils/auditLog');

describe('VALID_ACTIONS', () => {
  it('contiene las acciones esperadas', () => {
    expect(VALID_ACTIONS).toContain('review.approved');
    expect(VALID_ACTIONS).toContain('report.assigned');
    expect(VALID_ACTIONS).toContain('shop.suspended');
    expect(VALID_ACTIONS).toContain('user.deactivated');
  });
});

describe('createAuditLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const auditLogAdd = jest.fn().mockResolvedValue({ id: 'log-1' });
    mockDb.collection.mockImplementation((name) => {
      if (name === 'auditLog') return { add: auditLogAdd };
      return { doc: mockDb.doc, get: jest.fn(), update: jest.fn() };
    });
    mockDb.doc.mockReturnValue({ get: jest.fn(), update: jest.fn() });
  });

  it('crea entrada en auditLog con accion valida', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'log-1' });
    mockDb.collection.mockImplementation((name) => {
      if (name === 'auditLog') return { add: addFn };
      return { doc: mockDb.doc, get: jest.fn(), update: jest.fn() };
    });
    const userGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ moderationCount: 5 }) });
    const userUpdate = jest.fn().mockResolvedValue();
    mockDb.doc.mockReturnValue({ get: userGet, update: userUpdate });

    await createAuditLog({
      action: 'report.assigned',
      performedBy: 'mod-1',
      targetType: 'report',
      targetId: 'r-1',
      previousState: 'open',
      newState: 'in_progress',
      reason: 'Asignado a moderador',
    });

    expect(addFn).toHaveBeenCalledTimes(1);
    const callData = addFn.mock.calls[0][0];
    expect(callData.action).toBe('report.assigned');
    expect(callData.performedBy).toBe('mod-1');
    expect(callData.targetType).toBe('report');
    expect(callData.performedByRole).toBe('');
    expect(callData.createdAt).toBeDefined();
    expect(userUpdate).toHaveBeenCalledWith({ moderationCount: 6 });
  });

  it('usa valores por defecto para campos opcionales', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'log-2' });
    mockDb.collection.mockImplementation((name) => {
      if (name === 'auditLog') return { add: addFn };
      return { doc: mockDb.doc, get: jest.fn(), update: jest.fn() };
    });
    mockDb.doc.mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }), update: jest.fn() });

    await createAuditLog({ action: 'review.approved', performedBy: 'admin-1' });

    const callData = addFn.mock.calls[0][0];
    expect(callData.targetType).toBe('');
    expect(callData.targetId).toBe('');
    expect(callData.previousState).toBe('');
    expect(callData.reason).toBe('');
  });

  it('rechaza accion invalida y no escribe en firestore', async () => {
    const addFn = jest.fn();
    mockDb.collection.mockReturnValue({ add: addFn });

    await createAuditLog({ action: 'invalid.action', performedBy: 'admin-1' });

    expect(addFn).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith('Acción de auditoría inválida', { action: 'invalid.action' });
  });

  it('no falla si el usuario no existe', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'log-3' });
    mockDb.collection.mockImplementation((name) => {
      if (name === 'auditLog') return { add: addFn };
      return { doc: mockDb.doc, get: jest.fn(), update: jest.fn() };
    });
    mockDb.doc.mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }), update: jest.fn() });

    await expect(createAuditLog({ action: 'user.activated', performedBy: 'admin-1' })).resolves.not.toThrow();
  });

  it('inicializa moderationCount si no existe', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'log-4' });
    mockDb.collection.mockImplementation((name) => {
      if (name === 'auditLog') return { add: addFn };
      return { doc: mockDb.doc, get: jest.fn(), update: jest.fn() };
    });
    const userUpdate = jest.fn().mockResolvedValue();
    mockDb.doc.mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }), update: userUpdate });

    await createAuditLog({ action: 'review.rejected', performedBy: 'mod-1' });

    expect(userUpdate).toHaveBeenCalledWith({ moderationCount: 1 });
  });

  it('maneja errores de firestore sin lanzar excepcion', async () => {
    mockDb.collection.mockImplementation(() => { throw new Error('Firestore error'); });

    await expect(createAuditLog({ action: 'shop.approved', performedBy: 'admin-1' })).resolves.not.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
