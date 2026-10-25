/// <reference lib="dom" />
import type { VaultStorage } from '@second-body/shared'

/**
 * 웹: 브라우저 IndexedDB 에 경로 → 내용으로 저장. (iOS/Android 는 storage.native.ts)
 * IndexedDB 트랜잭션이 원자적이라 임시 파일 교체가 필요 없다.
 */
const DB_NAME = 'second-body-vault'
const STORE = 'files'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = op(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const vaultStorage: VaultStorage = {
  async list(dir) {
    const prefix = `${dir}/`
    const keys = await run('readonly', (s) => s.getAllKeys())
    return keys
      .map(String)
      .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
      .map((k) => k.slice(prefix.length))
  },

  async read(path) {
    const value = await run<unknown>('readonly', (s) => s.get(path))
    return typeof value === 'string' ? value : null
  },

  async write(path, content) {
    await run('readwrite', (s) => s.put(content, path))
  },

  async remove(path) {
    await run('readwrite', (s) => s.delete(path))
  },
}
