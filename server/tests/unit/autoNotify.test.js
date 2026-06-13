const mockLogger = { warn: jest.fn(), error: jest.fn() };
const mockDb = { collection: jest.fn() };

jest.mock('../../src/config/firebase', () => ({
  db: mockDb,
}));

jest.mock('../../src/utils/logger', () => mockLogger);

const { notifyUser, TYPE_LABELS } = require('../../src/utils/autoNotify');

describe('TYPE_LABELS', () => {
  it('contiene labels para todos los tipos', () => {
    expect(TYPE_LABELS.review_approved).toBe('Reseña aprobada');
    expect(TYPE_LABELS.shop_suspended).toBe('Pastelería suspendida');
    expect(TYPE_LABELS.user_warned).toBe('Advertencia de moderación');
  });
});

describe('notifyUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.collection.mockReturnValue({ add: jest.fn().mockResolvedValue({ id: 'notif-1' }) });
  });

  it('crea notificacion con datos correctos', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'notif-1' });
    mockDb.collection.mockReturnValue({ add: addFn });

    await notifyUser({ userId: 'user-1', type: 'review_approved', message: 'Tu reseña fue aprobada' });

    expect(addFn).toHaveBeenCalledTimes(1);
    const data = addFn.mock.calls[0][0];
    expect(data.user_id).toBe('user-1');
    expect(data.type).toBe('review_approved');
    expect(data.title).toBe('Reseña aprobada');
    expect(data.message).toBe('Tu reseña fue aprobada');
    expect(data.is_read).toBe(false);
    expect(data.created_at).toBeDefined();
  });

  it('usa el type como title si no hay label', async () => {
    const addFn = jest.fn().mockResolvedValue({ id: 'notif-2' });
    mockDb.collection.mockReturnValue({ add: addFn });

    await notifyUser({ userId: 'user-2', type: 'custom_type', message: 'Mensaje personalizado' });

    expect(addFn.mock.calls[0][0].title).toBe('custom_type');
  });

  it('no hace nada si falta userId', async () => {
    const addFn = jest.fn();
    mockDb.collection.mockReturnValue({ add: addFn });

    await notifyUser({ type: 'review_approved', message: 'test' });
    expect(addFn).not.toHaveBeenCalled();
  });

  it('no hace nada si falta type', async () => {
    const addFn = jest.fn();
    mockDb.collection.mockReturnValue({ add: addFn });

    await notifyUser({ userId: 'user-1', message: 'test' });
    expect(addFn).not.toHaveBeenCalled();
  });

  it('no hace nada si falta message', async () => {
    const addFn = jest.fn();
    mockDb.collection.mockReturnValue({ add: addFn });

    await notifyUser({ userId: 'user-1', type: 'review_approved' });
    expect(addFn).not.toHaveBeenCalled();
  });

  it('maneja errores de firestore sin lanzar excepcion', async () => {
    mockDb.collection.mockImplementation(() => { throw new Error('Firestore error'); });

    await expect(notifyUser({ userId: 'user-1', type: 'review_approved', message: 'test' })).resolves.not.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
