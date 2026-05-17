import { Injectable } from '@angular/core';
import { PeliculaLocal } from '../interfaces/pelicula.interface';

@Injectable({
  providedIn: 'root'
})
export class PeliculasLocalService {
  private readonly dbName = 'peliculas-db';
  private readonly storeName = 'movies';

  async getAll(): Promise<PeliculaLocal[]> {
    const db = await this.openDb();
    if (!db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as PeliculaLocal[]);
      request.onerror = () => reject(request.error);
    });
  }

  async upsert(item: PeliculaLocal): Promise<void> {
    const db = await this.openDb();
    if (!db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(imdbID: string): Promise<void> {
    const db = await this.openDb();
    if (!db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(imdbID);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'imdbID' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
