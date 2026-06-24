interface QueueItem<T = unknown> {
  id?: number;
  type: 'booking' | 'review' | string;
  payload: T;
  createdAt: string;
  status: 'pending' | 'syncing' | 'done' | 'failed';
  error?: string;
}

const DB_NAME = 'min-salon-queue';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

function openDB(): Promise<IDBRequest<IDBDatabase>['result']> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not available'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function safeOpenDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T | null> {
  try {
    const db = await openDB();
    const result = await fn(db);
    db.close();
    return result;
  } catch {
    return null;
  }
}

export async function enqueue<T>(type: QueueItem['type'], payload: T): Promise<void> {
  await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      tx.objectStore(STORE_NAME).add({ type, payload, createdAt: new Date().toISOString(), status: 'pending' });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function getPendingItems(): Promise<QueueItem[]> {
  const result = await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise<QueueItem[]>((resolve, reject) => {
      const index = tx.objectStore(STORE_NAME).index('status');
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
  return result || [];
}

export async function markDone(id: number): Promise<void> {
  await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        item.status = 'done';
        store.put(item);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function markFailed(id: number, error: string): Promise<void> {
  await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        item.status = 'failed';
        item.error = error;
        store.put(item);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function getQueueCount(): Promise<number> {
  const result = await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise<number>((resolve, reject) => {
      const index = tx.objectStore(STORE_NAME).index('status');
      const request = index.count('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
  return result || 0;
}

export async function clearDone(): Promise<void> {
  await safeOpenDB(async (db) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor('done');
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}
