import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetDownloadURL, mockDeleteObject, mockUploadBytesResumable, mockRef } = vi.hoisted(() => {
  class MockFileReader {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }
    readAsDataURL(_file) {
      setTimeout(() => {
        if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
      }, 0);
    }
  }

  class MockImage {
    constructor() { this.width = 800; this.height = 600; this.onload = null; this.onerror = null; }
    set src(_val) { setTimeout(() => { if (this.onload) this.onload(); }, 0); }
  }

  global.FileReader = MockFileReader;
  global.Image = MockImage;

  HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: vi.fn(),
  });

  HTMLCanvasElement.prototype.toBlob = function (cb, _type, _quality) {
    cb(new Blob(['compressed'], { type: 'image/jpeg' }));
  };

  return {
    mockGetDownloadURL: vi.fn(),
    mockDeleteObject: vi.fn(),
    mockUploadBytesResumable: vi.fn(),
    mockRef: vi.fn((_s, path) => ({ path })),
  };
});

vi.mock('../services/apiService', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

vi.mock('../config/firebase', () => ({
  storage: {},
}));

vi.mock('firebase/storage', () => ({
  ref: (...args) => mockRef(...args),
  getDownloadURL: (...args) => mockGetDownloadURL(...args),
  deleteObject: (...args) => mockDeleteObject(...args),
  uploadBytesResumable: (...args) => mockUploadBytesResumable(...args),
}));

import { storageService } from '../services/storageService';

function createMockFile(name, size, type) {
  const blob = new Blob(['x'.repeat(Math.max(1, size))], { type });
  return new File([blob], name, { type });
}

describe('storageService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('upload', () => {
    it('sube un archivo y retorna la URL', async () => {
      const file = createMockFile('test.jpg', 50000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 50000 };
      task.on = vi.fn((_event, _progress, _error, complete) => {
        if (complete) setTimeout(complete, 0);
      });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('https://storage.url/file.jpg');

      const result = await storageService.upload('path/to/file', file);

      expect(mockUploadBytesResumable).toHaveBeenCalled();
      expect(result).toBe('https://storage.url/file.jpg');
    });

    it('llama a onProgress durante la subida', async () => {
      const file = createMockFile('test.jpg', 100000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 100000 };
      task.on = vi.fn((_event, progress, _error, complete) => {
        if (progress) progress({ bytesTransferred: 50000, totalBytes: 100000 });
        if (complete) setTimeout(complete, 0);
      });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('url');
      const onProgress = vi.fn();

      await storageService.upload('path', file, onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe('uploadImage', () => {
    it('genera nombre unico y sube', async () => {
      const file = createMockFile('foto.jpg', 50000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 50000 };
      task.on = vi.fn((_e, _p, _err, complete) => { if (complete) setTimeout(complete, 0); });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('https://url');

      const url = await storageService.uploadImage('logos', file);
      expect(url).toBe('https://url');
    });
  });

  describe('uploadProductImage', () => {
    it('sube imagen de producto', async () => {
      const file = createMockFile('prod.jpg', 50000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 50000 };
      task.on = vi.fn((_e, _p, _err, complete) => { if (complete) setTimeout(complete, 0); });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('https://url');

      const url = await storageService.uploadProductImage(file, 's1', 'p1');
      expect(url).toBe('https://url');
    });
  });

  describe('uploadShopImage', () => {
    it('sube imagen de tienda', async () => {
      const file = createMockFile('shop.jpg', 50000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 50000 };
      task.on = vi.fn((_e, _p, _err, complete) => { if (complete) setTimeout(complete, 0); });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('https://url');

      const url = await storageService.uploadShopImage(file, 's1', 'logo');
      expect(url).toBe('https://url');
    });
  });

  describe('uploadProfileImage', () => {
    it('sube imagen de perfil', async () => {
      const file = createMockFile('profile.jpg', 50000, 'image/jpeg');
      const task = new EventTarget();
      task.snapshot = { ref: {}, bytesTransferred: 50000, totalBytes: 50000 };
      task.on = vi.fn((_e, _p, _err, complete) => { if (complete) setTimeout(complete, 0); });
      mockUploadBytesResumable.mockReturnValue(task);
      mockGetDownloadURL.mockResolvedValue('https://url');

      const url = await storageService.uploadProfileImage(file, 'u1');
      expect(url).toBe('https://url');
    });
  });

  describe('getDownloadURL', () => {
    it('retorna URL de descarga', async () => {
      mockGetDownloadURL.mockResolvedValue('https://url');
      const url = await storageService.getDownloadURL('path/to/file');
      expect(url).toBe('https://url');
    });
  });

  describe('deleteImage', () => {
    it('elimina imagen por URL', async () => {
      mockDeleteObject.mockResolvedValue();
      await storageService.deleteImage('https://storage.googleapis.com/o/path%2Fto%2Ffile');
      expect(mockDeleteObject).toHaveBeenCalled();
    });

    it('lanza error con URL invalida', async () => {
      await expect(storageService.deleteImage('invalida')).rejects.toThrow('URL de almacenamiento inválida');
    });
  });

  describe('delete', () => {
    it('elimina por path', async () => {
      mockDeleteObject.mockResolvedValue();
      await storageService.delete('path/to/file');
      expect(mockDeleteObject).toHaveBeenCalled();
    });
  });
});
