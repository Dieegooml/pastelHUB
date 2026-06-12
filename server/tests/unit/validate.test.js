const { validate } = require('../../src/middlewares/validate');
const { z } = require('zod');

describe('validate middleware', () => {
  let schema;
  let req;
  let res;
  let next;

  beforeEach(() => {
    schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    req = { body: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    next = jest.fn();
  });

  it('llama next si la validacion pasa', () => {
    req.body = { name: 'Juan', age: 25 };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('asigna datos parseados a req.body', () => {
    req.body = { name: '  Juan  ', age: 25 };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(req.body.name).toBe('  Juan  ');
    expect(req.body.age).toBe(25);
  });

  it('rechaza tipos incorrectos', () => {
    req.body = { name: 'Juan', age: 'no-un-numero' };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 400 si la validacion falla', () => {
    req.body = { name: '', age: -1 };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna mensajes de error descriptivos', () => {
    req.body = {};

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const errorMsg = res.json.mock.calls[0][0].error;
    expect(errorMsg).toContain('name');
    expect(errorMsg).toContain('age');
  });

  it('funciona con schemas de diferentes tipos', () => {
    const emailSchema = z.object({ email: z.string().email() });
    req.body = { email: 'not-an-email' };

    const middleware = validate(emailSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
