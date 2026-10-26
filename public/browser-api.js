import { initialShelf, handleShelf } from './browser-model.js';

let connection;
function storageError(error) {
  if (error?.name === 'QuotaExceededError') return new Error('Your browser storage is full. This change was not saved. Remove an unneeded item and try again.');
  return new Error('Browser storage is unavailable. Allow site data for this page, then reload. Your changes cannot be saved until storage is available.');
}
export function openDatabase() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(storageError());
    // Isolate multiple project sites on the same GitHub Pages origin.
    const request = indexedDB.open('secondshelf:' + new URL('.', import.meta.url).pathname, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('shelf');
    request.onerror = () => reject(storageError(request.error));
    request.onblocked = () => reject(new Error('Close other SecondShelf tabs, then reload to open your saved shelf.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = null; };
      resolve(db);
    };
  }).catch(error => { connection = null; throw error; });
  return connection;
}
export async function browserApi(path, method = 'GET', body) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    let result, actionError;
    // Read, change, and save atomically so multiple tabs cannot overwrite stale state.
    const transaction = db.transaction('shelf', 'readwrite');
    const store = transaction.objectStore('shelf');
    const request = store.get('current');
    request.onsuccess = () => {
      try {
        const shelf = request.result || initialShelf();
        if (shelf.version !== 1) throw new Error('This saved shelf needs a newer version of SecondShelf. Reload the page.');
        result = handleShelf(shelf, path, method, body);
        if (!request.result || method !== 'GET') store.put(shelf, 'current');
      } catch (error) { actionError = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(actionError || storageError(transaction.error));
    transaction.onerror = () => {}; // onabort reports storage failures without claiming a save.
  });
}
