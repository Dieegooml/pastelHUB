const mockCountSnap = { data: () => ({ count: 0 }) };
const countFn = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue(mockCountSnap) });

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
};

const mockDb = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(function (n) { this._limit = n; return this; }),
  offset: jest.fn().mockImplementation(function (n) { this._offset = n; return this; }),
  count: countFn,
  batch: jest.fn(() => mockBatch),
  settings: jest.fn(),
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  setCustomUserClaims: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  updateUser: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  credential: { cert: jest.fn() },
  initializeApp: jest.fn(),
  auth: jest.fn(() => mockAuth),
  firestore: jest.fn(() => mockDb),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue([{ name: 'test.jpg' }]),
      file: jest.fn(() => ({
        delete: jest.fn().mockResolvedValue(),
        getSignedUrl: jest.fn().mockResolvedValue(['https://storage.example.com/test.jpg']),
      })),
    })),
  })),
}));

jest.mock('../serviceAccountKey.json', () => ({}), { virtual: true });

global.mockFirestore = mockDb;
global.mockFirebaseAuth = mockAuth;

global.mockToken = (uid = 'test-uid', roles = ['admin']) => {
  const decoded = { uid, email: 'test@example.com', name: 'Test User', roles };
  mockAuth.verifyIdToken.mockResolvedValue(decoded);
  return decoded;
};

global.mockDocExists = (data) => {
  mockDb.get.mockResolvedValue({ exists: true, data: () => data, id: 'test-id' });
};

global.mockDocNotExists = (docId = 'test-id') => {
  mockDb.get.mockResolvedValue({ exists: false, data: () => undefined, id: docId });
};

global.mockCollection = (docs) => {
  const mapped = docs.map((d, i) => ({ id: d.id || `doc-${i}`, data: () => d }));
  mockCountSnap.data = () => ({ count: mapped.length });
  mockDb._limit = undefined;
  mockDb._offset = undefined;
  mockDb.get.mockImplementation(() => {
    const limit = mockDb._limit ?? mapped.length;
    const offset = mockDb._offset ?? 0;
    const sliced = mapped.slice(offset, offset + limit);
    return Promise.resolve({
      docs: sliced,
      empty: sliced.length === 0,
    });
  });
};