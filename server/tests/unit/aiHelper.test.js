const { fetchCatalogData, formatCatalogForContext, getRoleKey, ROLE_RULES, checkRateLimit } = require('../../src/utils/aiHelper');

describe('getRoleKey', () => {
  it('retorna admin para rol admin', () => {
    expect(getRoleKey(['admin'])).toBe('admin');
  });

  it('retorna admin si tiene admin entre varios roles', () => {
    expect(getRoleKey(['admin', 'customer'])).toBe('admin');
  });

  it('retorna owner para owner', () => {
    expect(getRoleKey(['owner'])).toBe('owner');
  });

  it('retorna customer para rol customer', () => {
    expect(getRoleKey(['customer'])).toBe('customer');
  });

  it('retorna customer para arreglo vacio', () => {
    expect(getRoleKey([])).toBe('customer');
  });
});

describe('ROLE_RULES', () => {
  it('admin tiene todos los permisos', () => {
    const rules = ROLE_RULES.admin;
    expect(rules.allowed).toContain('todo el sistema');
    expect(rules.denied).toEqual([]);
  });

  it('customer tiene permisos limitados', () => {
    const rules = ROLE_RULES.customer;
    expect(rules.allowed).toContain('pedidos propios');
    expect(rules.denied).toContain('panel de administración');
    expect(rules.allowed).not.toContain('panel de administración');
  });

  it('owner puede gestionar tiendas y productos', () => {
    const rules = ROLE_RULES.owner;
    expect(rules.allowed).toContain('mi pastelería');
    expect(rules.allowed).toContain('mis productos');
    expect(rules.denied).toContain('panel de administración');
  });

  it('moderator puede moderar', () => {
    const rules = ROLE_RULES.moderator;
    expect(rules.allowed).toContain('moderar reseñas');
    expect(rules.allowed).toContain('gestionar reportes');
    expect(rules.denied).toContain('panel de administración');
  });
});

describe('checkRateLimit', () => {
  it('permite mensajes dentro del limite', () => {
    expect(checkRateLimit('user-1')).toBe(true);
  });

  it('bloquea despues de 10 mensajes', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-spam');
    }
    expect(checkRateLimit('user-spam')).toBe(false);
  });

  it('usuarios diferentes tienen limites independientes', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-a');
    }
    expect(checkRateLimit('user-b')).toBe(true);
    expect(checkRateLimit('user-a')).toBe(false);
  });
});

describe('fetchCatalogData', () => {
  it('retorna array vacio si no hay datos', async () => {
    const data = await fetchCatalogData();
    expect(data).toBeInstanceOf(Array);
  });
});

describe('formatCatalogForContext', () => {
  it('formatea catalogo como texto', () => {
    const shops = [
      {
        name: 'Test Shop',
        description: 'Desc',
        products: [{ name: 'Pastel', price: 20, is_available: true }],
      },
    ];
    const result = formatCatalogForContext(shops);
    expect(result).toContain('Test Shop');
    expect(result).toContain('Pastel');
    expect(result).toContain('S/ 20');
  });

  it('retorna string vacio para array vacio', () => {
    expect(formatCatalogForContext([])).toBe('');
  });
});
