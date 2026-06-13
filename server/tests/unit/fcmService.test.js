// Set up global mock messaging before requiring modules
const mockMessaging = { sendEachForMulticast: jest.fn() };
const mockDbSetup = { collection: jest.fn(), batch: jest.fn() };

jest.mock('../../src/config/firebase', () => ({
  admin: {
    messaging: () => mockMessaging,
    auth: () => ({ verifyIdToken: jest.fn() }),
    firestore: () => ({ collection: jest.fn(() => ({ doc: jest.fn(() => ({ get: jest.fn() })) })) }),
  },
  db: mockDbSetup,
}));

const { sendPush, saveFcmToken, removeFcmToken } = require('../../src/utils/fcmService');

describe('sendPush', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no envia push si no hay tokens', async () => {
    const snap = { empty: false, forEach: () => {}, size: 0 };
    mockDbSetup.collection.mockReturnValue({
      doc: () => ({
        collection: () => ({ get: jest.fn().mockResolvedValue(snap) }),
      }),
    });
    await sendPush('user-1', 'Test', 'Mensaje');
    expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('envia push a usuarios con tokens', async () => {
    const tokens = [{ token: 'token-1' }, { token: 'token-2' }];
    const snap = {
      empty: false, size: 2,
      forEach: (cb) => tokens.forEach(t => cb({ data: () => t })),
    };
    mockDbSetup.collection.mockReturnValue({
      doc: () => ({
        collection: () => ({ get: jest.fn().mockResolvedValue(snap) }),
      }),
    });
    mockMessaging.sendEachForMulticast.mockResolvedValue({
      successCount: 2, failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });
    await sendPush('user-1', 'Test Title', 'Test Body', { key: 'val' });
    expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledTimes(1);
    const msg = mockMessaging.sendEachForMulticast.mock.calls[0][0];
    expect(msg.notification.title).toBe('Test Title');
    expect(msg.notification.body).toBe('Test Body');
    expect(msg.tokens).toEqual(['token-1', 'token-2']);
  });

  it('limpia tokens invalidos', async () => {
    const tokens = [{ token: 'token-valido' }, { token: 'token-invalido' }];
    const snap = {
      empty: false, size: 1,
      forEach: (cb) => cb({ data: () => ({ token: 'token-invalido' }) }),
    };
    mockDbSetup.collection.mockReturnValue({
      doc: () => ({
        collection: () => ({ get: jest.fn().mockResolvedValue(snap) }),
      }),
    });
    mockMessaging.sendEachForMulticast.mockResolvedValue({
      successCount: 0, failureCount: 1,
      responses: [
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      ],
    });
    const batchMock = { delete: jest.fn(), commit: jest.fn().mockResolvedValue() };
    mockDbSetup.batch.mockReturnValue(batchMock);
    await sendPush('user-1', 'Test', 'Cleanup');
    expect(batchMock.delete).toHaveBeenCalled();
    expect(batchMock.commit).toHaveBeenCalled();
  });
});

describe('saveFcmToken', () => {
  it('guarda token correctamente', async () => {
    const docMock = { set: jest.fn().mockResolvedValue() };
    mockDbSetup.collection.mockReturnValue({
      doc: () => ({
        collection: () => ({ doc: () => docMock }),
      }),
    });
    const result = await saveFcmToken('user-1', 'new-token');
    expect(result).toBe(true);
    expect(docMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'new-token' })
    );
  });
});

describe('removeFcmToken', () => {
  it('elimina token existente', async () => {
    const batchMock = { delete: jest.fn(), commit: jest.fn().mockResolvedValue() };
    const snap = { forEach: (cb) => cb({ ref: 'ref-1' }) };
    mockDbSetup.collection.mockReturnValue({
      doc: () => ({
        collection: () => ({
          where: () => ({ get: jest.fn().mockResolvedValue(snap) }),
        }),
      }),
    });
    mockDbSetup.batch.mockReturnValue(batchMock);
    const result = await removeFcmToken('user-1', 'token-to-remove');
    expect(result).toBe(true);
    expect(batchMock.delete).toHaveBeenCalled();
    expect(batchMock.commit).toHaveBeenCalled();
  });
});

describe('Null safety', () => {
  it('no falla cuando messaging no esta disponible', async () => {
    jest.isolateModules(async () => {
      jest.resetModules();
      jest.mock('../../src/config/firebase', () => ({
        admin: {
          messaging: () => { throw new Error('FCM not available'); },
          auth: () => ({ verifyIdToken: jest.fn() }),
          firestore: () => ({ collection: jest.fn() }),
        },
        db: { collection: jest.fn(() => ({ doc: jest.fn(() => ({ get: jest.fn() })) })) },
      }));
      const { sendPush: sendNull } = require('../../src/utils/fcmService');
      await expect(sendNull('user-1', 'Test', 'Body')).resolves.not.toThrow();
    });
  });

  it('no falla cuando userId es undefined', async () => {
    await expect(sendPush(undefined, 'Test', 'Body')).resolves.not.toThrow();
  });
});
