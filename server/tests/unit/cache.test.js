const { createStore, get, set, del, clear, invalidatePrefix, stats, allStats } = require('../../src/utils/cache');

describe('Cache store', () => {
  let store;

  beforeEach(() => {
    store = createStore('test', { ttl: 1000, maxEntries: 5 });
  });

  describe('get / set', () => {
    it('retorna null para clave inexistente', () => {
      expect(get(store, 'inexistente')).toBeNull();
    });

    it('guarda y recupera un valor', () => {
      set(store, 'key1', { data: 'hello' });
      expect(get(store, 'key1')).toEqual({ data: 'hello' });
    });

    it('retorna null despues del TTL', async () => {
      set(store, 'key2', 'value');
      await new Promise(r => setTimeout(r, 1100));
      expect(get(store, 'key2')).toBeNull();
    }, 3000);
  });

  describe('del', () => {
    it('elimina una clave existente', () => {
      set(store, 'key1', 'value');
      del(store, 'key1');
      expect(get(store, 'key1')).toBeNull();
    });

    it('no falla al eliminar clave inexistente', () => {
      expect(() => del(store, 'inexistente')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('limpia todas las claves del store', () => {
      set(store, 'k1', 1);
      set(store, 'k2', 2);
      clear(store);
      expect(get(store, 'k1')).toBeNull();
      expect(get(store, 'k2')).toBeNull();
    });
  });

  describe('invalidatePrefix', () => {
    it('invalida claves que comienzan con el prefijo', () => {
      set(store, 'shop:1', { name: 'A' });
      set(store, 'shop:2', { name: 'B' });
      set(store, 'product:1', { name: 'P' });
      invalidatePrefix(store, 'shop:');
      expect(get(store, 'shop:1')).toBeNull();
      expect(get(store, 'shop:2')).toBeNull();
      expect(get(store, 'product:1')).toEqual({ name: 'P' });
    });
  });

  describe('stats', () => {
    it('retorna estadisticas del store', () => {
      set(store, 'k1', 1);
      get(store, 'k1');
      get(store, 'k2');
      const s = stats(store);
      expect(s.name).toBe('test');
      expect(s.hits).toBe(1);
      expect(s.misses).toBe(1);
      expect(s.size).toBe(1);
      expect(s.evictions).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('evicta la entrada mas antigua al exceder maxEntries', () => {
      set(store, 'a', 1);
      set(store, 'b', 2);
      set(store, 'c', 3);
      set(store, 'd', 4);
      set(store, 'e', 5);
      set(store, 'f', 6);
      expect(get(store, 'a')).toBeNull();
      expect(get(store, 'f')).toBe(6);
    });
  });

  describe('allStats', () => {
    it('retorna stats de todos los stores', () => {
      const all = allStats();
      expect(all).toBeInstanceOf(Object);
      expect(all.test).toBeDefined();
      expect(all.test.name).toBe('test');
    });
  });
});
