const { paginate, parsePagination, tryPaginate } = require('../../src/utils/paginate');

const makeRef = (overrides = {}) => {
  const countSnap = { data: () => ({ count: 25 }) };
  const docs = Array.from({ length: 10 }, (_, i) => ({
    id: `doc-${i}`,
    data: () => ({ name: `Item ${i}` }),
  }));
  const dataSnap = { docs, empty: docs.length === 0 };
  return {
    count: jest.fn(() => ({ get: jest.fn().mockResolvedValue(countSnap) })),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(dataSnap),
    ...overrides,
  };
};

describe('parsePagination', () => {
  it('usa valores por defecto page=1 y pageSize=10', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('parsea page y pageSize desde query', () => {
    const result = parsePagination({ page: '3', pageSize: '20' });
    expect(result).toEqual({ page: 3, pageSize: 20, offset: 40 });
  });

  it('clampa page minimo a 1', () => {
    expect(parsePagination({ page: '0' }).page).toBe(1);
    expect(parsePagination({ page: '-5' }).page).toBe(1);
  });

  it('clampa pageSize entre 1 y 50', () => {
    expect(parsePagination({ pageSize: '1' }).pageSize).toBe(1);
    expect(parsePagination({ pageSize: '100' }).pageSize).toBe(50);
    expect(parsePagination({ pageSize: 'abc' }).pageSize).toBe(10);
  });
});

describe('paginate', () => {

  it('retorna datos paginados con total y metadata', async () => {
    const ref = makeRef();
    const result = await paginate(ref, { page: '1', pageSize: '10' });

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('aplica orderBy si se especifica', async () => {
    const ref = makeRef();
    await paginate(ref, {}, { orderBy: 'createdAt', orderDir: 'asc' });

    expect(ref.orderBy).toHaveBeenCalledWith('createdAt', 'asc');
  });

  it('usa desc como orderDir por defecto', async () => {
    const ref = makeRef();
    await paginate(ref, {}, { orderBy: 'createdAt' });

    expect(ref.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  });

  it('aplica filtros si se especifican', async () => {
    const ref = makeRef();
    await paginate(ref, {}, {
      filters: [
        { field: 'shop_id', value: 's-1' },
        { field: 'status', op: '>=', value: 'active' },
      ],
    });

    expect(ref.where).toHaveBeenCalledWith('shop_id', '==', 's-1');
    expect(ref.where).toHaveBeenCalledWith('status', '>=', 'active');
  });

  it('usa offset y limit correctos', async () => {
    const ref = makeRef();
    await paginate(ref, { page: '3', pageSize: '5' });

    expect(ref.offset).toHaveBeenCalledWith(10);
    expect(ref.limit).toHaveBeenCalledWith(5);
  });

  it('retorna datos mapeados con id', async () => {
    const ref = makeRef();
    const result = await paginate(ref, { page: '1' });

    expect(result.data[0]).toHaveProperty('id', 'doc-0');
    expect(result.data[0]).toHaveProperty('name', 'Item 0');
  });
});

describe('tryPaginate', () => {
  it('responde con json en exito', async () => {
    const ref = makeRef();
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    await tryPaginate(res, ref, {}, {}, 'Error message');

    expect(res.json).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it('responde 500 en caso de error', async () => {
    const ref = { get: jest.fn().mockRejectedValue(new Error('fail')) };
    const res = { json: jest.fn(), status: jest.fn(() => res) };
    await tryPaginate(res, ref, {}, {}, 'Error message');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error message' });
  });
});
