/**
 * NormativaService.ts — F4.2 · Consulta normativa + caché IndexedDB (Constitución §8)
 *
 * - Nunca hace full-scan: consulta por documentId exacto (llave maestra)
 * - Caché IndexedDB: una ficha leída queda disponible offline indefinidamente
 * - DB: `coordenadasnormativas`, colección `normativas_prc`
 * - Requiere H-F4.2 (poblar la colección) para funcionar en producción
 */

import type { NormativaPRC } from './types';

// ── IndexedDB setup ───────────────────────────────────────────────────────────

const IDB_NAME    = 'archibots_normativa';
const IDB_VERSION = 1;
const STORE_NAME  = 'fichas';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGet(id: string): Promise<NormativaPRC | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function idbPut(ficha: NormativaPRC): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(ficha);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* caché best-effort */ }
}

// ── Construcción de la llave maestra ─────────────────────────────────────────

export function generarLlaveMaestra(codigoRegion: string, comuna: string, zona: string): string {
  const slug = (s: string) => s.toUpperCase().replace(/\s+/g, '_');
  return `${codigoRegion}_PRC_${slug(comuna)}_${slug(zona)}`;
}

// ── Consulta principal ────────────────────────────────────────────────────────

export async function getFichaNormativa(
  codigoRegion: string,
  comuna: string,
  zona: string,
): Promise<NormativaPRC | null> {
  const id = generarLlaveMaestra(codigoRegion, comuna, zona);

  // 1. Buscar en caché IndexedDB
  const cached = await idbGet(id);
  if (cached) return cached;

  // 2. Consultar Firestore (DB coordenadasnormativas)
  try {
    const { getDbCoordenadas } = await import('./firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(getDbCoordenadas(), 'normativas_prc', id));
    if (!snap.exists()) return null;

    const ficha = { id, ...snap.data() } as NormativaPRC;
    await idbPut(ficha); // guardar en caché
    return ficha;
  } catch (err) {
    console.warn('[NormativaService] Firestore no disponible:', err);
    return null;
  }
}

/** Invalida la caché de una ficha específica (para forzar re-fetch) */
export async function invalidarCacheFicha(
  codigoRegion: string,
  comuna: string,
  zona: string,
): Promise<void> {
  const id = generarLlaveMaestra(codigoRegion, comuna, zona);
  try {
    const db = await openIDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
    });
  } catch { /* silencioso */ }
}
