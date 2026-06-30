/* =============================================================================
   normativaStore.ts — PERSISTENCIA COMPARTIDA DE LA FICHA NORMATIVA (PRC)
   -----------------------------------------------------------------------------
   El Geolocalizador resuelve la ficha normativa (altura, constructibilidad,
   ocupación de suelo) pero antes la descartaba al cerrar la herramienta. Ahora se
   persiste para que la Cabida (Volumen Teórico) la consuma y NO se re-ingrese a mano
   (Oportunidad de Sincronización #1 del MAPA_DE_DATOS_Y_ESTADO).

   Esquema gobernado idéntico a terrenoStore/useToolData:
     · Logueado (repo.kind === 'cloud') → Firestore projects/{pid}/toolData/normativa
       ({ payload, updatedAt }) — cubierto por la regla `toolData/{document=**}`.
     · Invitado / offline / fallo de reglas → localStorage `ab-normativa-{pid}`.
   La escritura SIEMPRE espeja a localStorage (sync en caliente + offline).
   ============================================================================= */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';
import type { NormativaPRC } from '../core/types';

/** Parámetros normativos NORMALIZADOS (numéricos) que consume la Cabida. */
export interface NormativaGuardada {
  alturaMaxima: number;
  coefConstructibilidad: number;
  /** Ocupación de suelo en PORCENTAJE (0–100). */
  ocupacionSuelo: number;
  /** Zona/código y comuna de procedencia (trazabilidad). */
  zona?: string;
  comuna?: string;
  /** Campos de texto de la ficha PRC para prellenar formularios DOM (Oportunidad sync). */
  alturaTexto?: string;
  usosPermitidos?: string;
  usosProhibidos?: string;
  sistemaAgrupamiento?: string;
  antejardin?: string;
}

const localKey = (pid: string) => `ab-normativa-${pid}`;
const cloudRef = (pid: string) => doc(db, 'projects', pid, 'toolData', 'normativa');

/** Convierte un valor string|number de la ficha a número (tolera "%", comas y texto). */
function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace('%', '').replace(',', '.').trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Normaliza una ficha NormativaPRC al payload numérico de Cabida. */
export function fichaToNormativa(ficha: NormativaPRC, zona?: string, comuna?: string): NormativaGuardada {
  let ocup = toNum(ficha.coeficienteOcupacion);
  if (ocup > 0 && ocup <= 1) ocup *= 100; // coef. 0–1 → porcentaje
  const str = (v: unknown): string | undefined => {
    const t = (v == null ? '' : String(v)).trim();
    return t ? t : undefined;
  };
  return {
    alturaMaxima: toNum(ficha.alturaMaxima),
    coefConstructibilidad: toNum(ficha.constructibilidad),
    ocupacionSuelo: ocup,
    zona,
    comuna,
    alturaTexto: str(ficha.alturaMaxima),
    usosPermitidos: str((ficha as Record<string, unknown>).usosPermitidos),
    usosProhibidos: str((ficha as Record<string, unknown>).usosProhibidos),
    sistemaAgrupamiento: str(ficha.sistemaAgrupamiento),
    antejardin: str((ficha as Record<string, unknown>).antejardin),
  };
}

function readLocal(pid: string): NormativaGuardada | null {
  try {
    const raw = localStorage.getItem(localKey(pid));
    return raw ? (JSON.parse(raw) as NormativaGuardada) : null;
  } catch { return null; }
}

/** Carga la ficha normativa: nube primero (logueado) y, si no existe o falla, localStorage. */
export async function loadNormativa(pid: string, isCloud: boolean): Promise<NormativaGuardada | null> {
  if (isCloud) {
    try {
      const snap = await getDoc(cloudRef(pid));
      if (snap.exists()) {
        const payload = (snap.data() as { payload?: NormativaGuardada }).payload;
        if (payload && typeof payload.alturaMaxima === 'number') {  // eslint-disable-line
          try { localStorage.setItem(localKey(pid), JSON.stringify(payload)); } catch { /* ignore */ }
          return payload;
        }
      }
    } catch { /* offline / reglas → degrada a local */ }
  }
  return readLocal(pid);
}

/** Guarda la ficha normativa. SIEMPRE espeja a localStorage; si es nube, persiste en Firestore. */
export function saveNormativa(pid: string, value: NormativaGuardada, isCloud: boolean): void {
  try { localStorage.setItem(localKey(pid), JSON.stringify(value)); } catch { /* ignore */ }
  if (isCloud) {
    void setDoc(cloudRef(pid), { payload: value, updatedAt: serverTimestamp() }, { merge: true })
      .catch(() => { /* reglas / offline: ya quedó en local */ });
  }
}
