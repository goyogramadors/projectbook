/* =============================================================================
   terrenoStore.ts — PERSISTENCIA COMPARTIDA DEL TERRENO (polígono + área)
   -----------------------------------------------------------------------------
   El terreno (ring del polígono + área en m²) lo comparten tres herramientas:
   Ubicación, Mapa de Terreno y Geolocalizador. Antes vivía SOLO en localStorage
   (clave `ab-mapa-terreno-${pid}`), por lo que no se sincronizaba entre equipos.

   Migración a nube (Tintero §"Auditoría de persistencia"):
     · Premium (repo.kind === 'cloud') → Firestore projects/{pid}/toolData/terreno
       (mismo esquema { payload, updatedAt } que useToolData; cubierto por la regla
       existente `toolData/{document=**}`, zero-trust).
     · Free / offline / fallo de reglas → localStorage (clave compartida intacta).

   La escritura SIEMPRE espeja a localStorage para que las tres herramientas sigan
   leyéndose entre sí en caliente y para no perder trabajo si la nube falla.
   ============================================================================= */
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';

/** Metadato por deslinde (segmento i une ring[i]→ring[i+1]; el último cierra con el primero). */
export interface DeslindeMeta { faceStreet: boolean; }
export interface TerrenoGuardado { ring: Array<[number, number]>; areaM2: number; edges?: DeslindeMeta[]; }

const localKey = (pid: string) => `ab-mapa-terreno-${pid}`;
const cloudRef = (pid: string) => doc(db, 'projects', pid, 'toolData', 'terreno');

/* Firestore NO admite arrays anidados: el ring (array de pares [lng,lat]) debe
   serializarse a array de OBJETOS {lng,lat} para la nube. Si se escribe el array
   anidado tal cual, setDoc lanza `invalid-argument` de forma SÍNCRONA (saltándose
   el .catch) y aborta el guardado de toda la sección. Encode al escribir / decode al leer. */
type RingDoc = Array<{ lng: number; lat: number }>;
const encodeRing = (ring: Array<[number, number]>): RingDoc =>
  ring.map(([lng, lat]) => ({ lng, lat }));
const decodeRing = (raw: unknown): Array<[number, number]> | null => {
  if (!Array.isArray(raw)) return null;
  const out: Array<[number, number]> = [];
  for (const p of raw as unknown[]) {
    if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') {
      out.push([p[0], p[1]]); // compat formato viejo (array anidado, si existiera)
    } else if (p && typeof (p as { lng?: unknown }).lng === 'number' && typeof (p as { lat?: unknown }).lat === 'number') {
      out.push([(p as { lng: number }).lng, (p as { lat: number }).lat]);
    } else {
      return null;
    }
  }
  return out;
};

/** Lee el terreno desde localStorage (clave compartida). `null` si no hay o está corrupto. */
export function readTerrenoLocal(pid: string): TerrenoGuardado | null {
  try {
    const raw = localStorage.getItem(localKey(pid));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<TerrenoGuardado>;
    if (!Array.isArray(d.ring) || typeof d.areaM2 !== 'number') return null;
    return { ring: d.ring, areaM2: d.areaM2, edges: Array.isArray(d.edges) ? d.edges : undefined };
  } catch { return null; }
}

/**
 * Carga el terreno: nube primero (Premium) y, si no existe o falla, localStorage.
 * Cuando viene de la nube, espeja a local para que las otras herramientas lo vean.
 */
export async function loadTerreno(pid: string, isCloud: boolean): Promise<TerrenoGuardado | null> {
  if (isCloud) {
    try {
      const snap = await getDoc(cloudRef(pid));
      if (snap.exists()) {
        const payload = (snap.data() as { payload?: { ring?: unknown; areaM2?: unknown; edges?: unknown } }).payload;
        const ring = decodeRing(payload?.ring);
        if (payload && ring && typeof payload.areaM2 === 'number') {
          const edges = Array.isArray(payload.edges) ? (payload.edges as DeslindeMeta[]) : undefined;
          const value: TerrenoGuardado = { ring, areaM2: payload.areaM2, edges };
          try { localStorage.setItem(localKey(pid), JSON.stringify(value)); } catch { /* ignore */ }
          return value;
        }
      }
    } catch { /* offline / reglas → degrada a local */ }
  }
  return readTerrenoLocal(pid);
}

/**
 * Guarda el terreno. SIEMPRE espeja a localStorage (sync entre herramientas + offline);
 * además, si es Premium, persiste en Firestore (fire-and-forget, degrada a local si falla).
 */
export function saveTerreno(pid: string, value: TerrenoGuardado, isCloud: boolean): void {
  try { localStorage.setItem(localKey(pid), JSON.stringify(value)); } catch { /* ignore */ }
  if (isCloud) {
    // Encode del ring a array de objetos {lng,lat}: Firestore rechaza arrays anidados.
    // try/catch además del .catch: setDoc valida la data de forma SÍNCRONA y puede
    // lanzar (no rechazar) — sin esto, un throw aquí aborta el guardado del llamador.
    try {
      void setDoc(
        cloudRef(pid),
        { payload: { ring: encodeRing(value.ring), areaM2: value.areaM2, ...(value.edges ? { edges: value.edges } : {}) }, updatedAt: serverTimestamp() },
        { merge: true },
      ).catch(() => { /* reglas / offline: ya quedó en local */ });
    } catch { /* validación síncrona: ya quedó en local */ }
  }
}

/**
 * Borra el terreno guardado (polígono + área) de TODAS las capas: localStorage (clave
 * compartida) y, si es Premium, el doc en la nube. Sin esto, "Limpiar" solo borraba el
 * trazo en pantalla y el polígono viejo reaparecía al reabrir o no se podía reemplazar.
 */
export function clearTerreno(pid: string, isCloud: boolean): void {
  try { localStorage.removeItem(localKey(pid)); } catch { /* ignore */ }
  if (isCloud) {
    try {
      void deleteDoc(cloudRef(pid)).catch(() => { /* reglas / offline: ya quedó borrado local */ });
    } catch { /* validación síncrona */ }
  }
}
