/* =============================================================================
   _ARCHIBOTS · GEOJSON SERVICE (Cerebro Espacial — capa de datos) · CONST §8
   -----------------------------------------------------------------------------
   Descarga la capa PRC BASE de una comuna desde Firebase Hosting (CDN), NUNCA
   desde Storage ni Firestore: fetch('/geo-data/13_PRC_{Comuna}.json'). Cachea en
   dos niveles: (1) memoria por sesión, (2) IndexedDB persistente entre sesiones.
   Solo la comuna activa vive en memoria. Sin dependencias externas (IndexedDB).
   NOTA: las capas overlay (_AP área de protección/restricción, _R, _SECC_…) son
   restricciones superpuestas, NO zonas base; por eso NO se fusionan aquí (fusionar
   _AP hacía que un terreno residencial se reportara como "Área de restricción").
   ============================================================================= */

import { getCodigoRegionDeComuna } from './data-chile';

export interface FeatureCollectionLike {
  type: string;
  features: Array<{ geometry?: { type?: string }; properties?: Record<string, unknown> }>;
}

const REGION_DEFECTO = '13'; // Fallback: Región Metropolitana si no se resuelve la región.

/** Código de región (2 dígitos) a usar para una comuna: derivado de la comuna; '13' si no se resuelve. */
function regionDeComuna(comuna: string): string {
  return getCodigoRegionDeComuna(comuna) || REGION_DEFECTO;
}
const DB_NAME = 'archibots-geo';
const STORE = 'geojson';
const memoryCache: Record<string, FeatureCollectionLike> = {};

/** Normaliza el nombre de comuna al token del archivo (sin tildes ni espacios). Ej: "Ñuñoa" → "Nunoa". */
export function normalizarComuna(comuna: string): string {
  // Los archivos usan Title_Case con GUION BAJO entre palabras: "Las Condes" → "Las_Condes",
  // "Lo Barnechea" → "Lo_Barnechea", "Ñuñoa" → "Nunoa". NO se eliminan los espacios: se
  // reemplazan por '_' (bug Tintero: antes "LasCondes" → 404 al cargar la capa).
  return comuna
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita diacríticos (Ñ→N, á→a)
    .trim()
    .split(/\s+/)                                        // separa por palabras
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))           // limpia signos dentro de cada palabra
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) // Title_Case por palabra
    .join('_');                                           // une con guion bajo
}

/** Ruta CDN del GeoJSON base de una comuna. */
export function rutaGeoJSON(comuna: string, region: string = regionDeComuna(comuna)): string {
  return `/geo-data/${region}_PRC_${normalizarComuna(comuna)}.json`;
}

/* ── IndexedDB mínimo (promisificado) ──────────────────────────────────────── */
function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB.'));
  });
}

function idbGet(key: string): Promise<FeatureCollectionLike | undefined> {
  return abrirDB().then(db => new Promise<FeatureCollectionLike | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as FeatureCollectionLike | undefined);
    req.onerror = () => reject(req.error);
  })).catch(() => undefined);
}

function idbSet(key: string, value: FeatureCollectionLike): Promise<void> {
  return abrirDB().then(db => new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve(); // la caché es best-effort: si falla, no rompemos el flujo
  })).catch(() => undefined);
}

/**
 * Carga la capa PRC BASE de una comuna. Orden: memoria → IndexedDB → CDN (y rellena
 * ambas cachés). Lanza si la comuna no tiene capa publicada (404) o el JSON es inválido.
 */
export async function loadComunaGeoJSON(comuna: string, region: string = regionDeComuna(comuna)): Promise<FeatureCollectionLike> {
  // `#base` versiona la clave: invalida cachés de la fusión de overlays (que devolvía AP).
  const key = `${region}_${normalizarComuna(comuna)}#base`;
  if (memoryCache[key]) return memoryCache[key];

  const cached = await idbGet(key);
  if (cached && Array.isArray(cached.features)) {
    memoryCache[key] = cached;
    return cached;
  }

  const url = rutaGeoJSON(comuna, region);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`No hay capa PRC publicada para "${comuna}" (${resp.status}).`);
  const geojson = (await resp.json()) as FeatureCollectionLike;
  if (!geojson || !Array.isArray(geojson.features)) throw new Error('GeoJSON inválido o sin features.');

  memoryCache[key] = geojson;
  void idbSet(key, geojson);
  return geojson;
}

/** Limpia la caché en memoria (la comuna activa). No borra IndexedDB. */
export function limpiarMemoria(): void {
  for (const k of Object.keys(memoryCache)) delete memoryCache[k];
}
