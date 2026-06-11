import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

function compressImage(file, maxWidth = 1024, maxSize = 1 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          const ratio = Math.min(maxWidth / width, maxWidth / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const tryQuality = (q) => {
          return new Promise((res) => {
            canvas.toBlob(async (blob) => {
              if (!blob) return reject(new Error('Error al comprimir imagen'));
              if (blob.size <= maxSize || q <= 0.3) res(blob);
              else res(await tryQuality(q - 0.1));
            }, 'image/jpeg', q);
          });
        };
        resolve(tryQuality(0.9));
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function getStoragePathFromUrl(url) {
  try {
    const u = new URL(url);
    const pathMatch = u.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) throw new Error('No se pudo extraer la ruta de la URL');
    return decodeURIComponent(pathMatch[1]);
  } catch {
    throw new Error('URL de almacenamiento inválida');
  }
}

export const storageService = {
  async upload(path, file, onProgress) {
    const compressed = await compressImage(file);
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, compressed);
      task.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(pct);
        },
        (err) => reject(err),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (e) { reject(e); }
        }
      );
    });
  },

  async uploadImage(folder, file, onProgress) {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${folder}/${name}`;
    return this.upload(path, file, onProgress);
  },

  async uploadProductImage(file, shopId, productId) {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `products/${shopId}/${productId}_${name}`;
    return this.upload(path, file);
  },

  async uploadShopImage(file, shopId, type = 'logo') {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `shops/${shopId}/${type}_${name}`;
    return this.upload(path, file);
  },

  async uploadProfileImage(file, userId) {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `profiles/${userId}_${name}`;
    return this.upload(path, file);
  },

  async getDownloadURL(path) {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  async deleteImage(url) {
    const path = getStoragePathFromUrl(url);
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  async delete(path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },
};
