/**
 * db.js
 *
 * Adaptador de IndexedDB de HotelManager V1. La base hotel-manager-db está
 * en la versión 2. La migración conserva datos y añade el índice reservationId
 * al store de pagos. Los repositories encapsulan el CRUD; los services usan
 * atomicWrite cuando una operación debe ser todo-o-nada.
 */
import { DB_NAME, DB_VERSION, STORES } from '../core/constants.js';
let database;

export function openDB() {
  if (database) return Promise.resolve(database);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((name) => {
        const store = db.objectStoreNames.contains(name) ? request.transaction.objectStore(name) : db.createObjectStore(name, { keyPath: 'id' });
        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt');
        if (name === 'payments' && !store.indexNames.contains('reservationId')) store.createIndex('reservationId', 'reservationId');
      });
    };
    request.onsuccess = () => { database = request.result; database.onversionchange = () => database.close(); resolve(database); };
    request.onerror = () => reject(request.error);
  });
}
const requestPromise = (request) => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
export async function all(storeName) { const db = await openDB(); return requestPromise(db.transaction(storeName, 'readonly').objectStore(storeName).getAll()); }
export async function get(storeName, id) { const db = await openDB(); return requestPromise(db.transaction(storeName, 'readonly').objectStore(storeName).get(id)); }
export async function put(storeName, value) { const db = await openDB(); await requestPromise(db.transaction(storeName, 'readwrite').objectStore(storeName).put(value)); return value; }
export async function remove(storeName, id) { const db = await openDB(); await requestPromise(db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id)); }
export async function clearStore(storeName) { const db = await openDB(); await requestPromise(db.transaction(storeName, 'readwrite').objectStore(storeName).clear()); }
export async function replaceAll(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES, 'readwrite');
    STORES.forEach((name) => { const store = transaction.objectStore(name); store.clear(); (data[name] || []).forEach((item) => store.put(item)); });
    transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error || new Error('La transacción fue cancelada.'));
  });
}
/**
 * Ejecuta escrituras de varios stores en una sola transacción.
 * @param {string[]} storeNames - Stores participantes.
 * @param {(stores: Record<string, IDBObjectStore>) => void} callback - Operaciones sobre esos stores.
 * @returns {Promise<void>} Se resuelve cuando IndexedDB confirma el lote.
 */
export async function atomicWrite(storeNames, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, 'readwrite');
    const stores = Object.fromEntries(storeNames.map((name) => [name, transaction.objectStore(name)]));
    try { callback(stores); } catch (error) { transaction.abort(); reject(error); return; }
    transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error || new Error('La operación no pudo confirmarse.'));
  });
}
