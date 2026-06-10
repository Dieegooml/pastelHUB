import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export const storageService = {
  upload(path, file, onProgress) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
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

  async delete(path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },
};
