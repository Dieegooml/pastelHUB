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
  limit: jest.fn().mockReturnThis(),
  batch: jest.fn(() => mockBatch),
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

global.mockDocNotExists = () => {
  mockDb.get.mockResolvedValue({ exists: false, data: () => undefined, id: null });
};

global.mockCollection = (docs) => {
  mockDb.get.mockResolvedValue({
    docs: docs.map((d, i) => ({ id: d.id || `doc-${i}`, data: () => d })),
    empty: docs.length === 0,
  });
};