jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => mockLogger),
  };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
    },
    transports: { Console: jest.fn() },
  };
});

const logger = require('../../src/utils/logger');

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exporta metodos info, warn, error, debug', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('childLogger retorna un logger child', () => {
    const child = logger.childLogger('trace-123');
    expect(typeof child.info).toBe('function');
  });
});

describe('createTraceMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agrega traceId y header X-Trace-Id', () => {
    const middleware = logger.createTraceMiddleware();
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.traceId).toBeDefined();
    expect(req.traceId.length).toBe(8);
    expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', req.traceId);
    expect(next).toHaveBeenCalled();
  });

  it('usa x-trace-id header si existe', () => {
    const middleware = logger.createTraceMiddleware();
    const req = { headers: { 'x-trace-id': 'custom-id-123' } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.traceId).toBe('custom-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', 'custom-id-123');
  });
});
