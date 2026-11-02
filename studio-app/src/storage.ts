export type Project = { name: string; code: string; input: string };
let database: Promise<IDBDatabase> | undefined;
function open() {
  return database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('lockwoodstem-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other studio tabs to open storage.'));
  });
}
export async function readProject(): Promise<Project | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects').objectStore('projects').get('current');
    request.onsuccess = () => {
      const p = request.result;
      if (p !== undefined && (typeof p.name !== 'string' || typeof p.code !== 'string' || typeof p.input !== 'string')) {
        reject(new Error('Saved project is not readable.')); return;
      }
      resolve(p);
    };
    request.onerror = () => reject(request.error);
  });
}
export async function saveProject(project: Project) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    transaction.objectStore('projects').put(project, 'current');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
export function pythonFilename(value: string) {
  const name = value.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^\.+/, '').slice(0, 100) || 'main';
  return name.toLowerCase().endsWith('.py') ? name : `${name}.py`;
}
