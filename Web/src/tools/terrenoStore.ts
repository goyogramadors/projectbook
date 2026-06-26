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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';

export interface TerrenoGuardado { ring: Array<[number, number]>; areaM2: number; }

const localKey = (pid: string) => `ab-mapa-terreno-${pid}`;
const cloudRef = (pid: string) => doc(db, 'projects', pid, 'toolData', 'terreno');

/** Lee el terreno desde localStorage (clave compartida). `null` si no hay o está corrupto. */
export function readTerrenoLocal(pid: string): TerrenoGuardado | null {
  try {
    const raw = localStorage.getItem(localKey(pid));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<TerrenoGuardado>;
    if (!Array.isArray(d.ring) || typeof d.areaM2 !== 'number') return null;
    return { ring: d.ring, areaM2: d.areaM2 };
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
        const payload = (snap.data() as { payload?: Partial<TerrenoGuardado> }).payload;
        if (payload && Array.isArray(payload.ring) && typeof payload.areaM2 === 'number') {
          const value: TerrenoGuardado = { ring: payload.ring, areaM2: payload.areaM2 };
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
    void setDoc(
      cloudRef(pid),
      { payload: value, updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(() => { /* reglas / offline: ya quedó en local */ });
  }
}
