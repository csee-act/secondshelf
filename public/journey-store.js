import { openDatabase } from './browser-api.js';
import { initialJourney, changeJourney } from './journey.js';

export async function journeyApi(action, body = {}, items = []) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shelf', 'readwrite');
    const store = tx.objectStore('shelf'), request = store.get('journey');
    let result, error;
    request.onsuccess = () => {
      try {
        result = request.result || initialJourney();
        if (action) changeJourney(result, action, body, items);
        if (action || !request.result) store.put(result, 'journey');
      } catch (e) { error = e; tx.abort(); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(error || new Error('The plan could not be saved. Allow browser storage or free some space, then try again.'));
    tx.onerror = () => {};
  });
}
