/* =============================================================================
   _ARCHIBOTS · NORMATIVA SERVICE (Cerebro Normativo — capa de datos)
   -----------------------------------------------------------------------------
   Resuelve la ficha normativa de una zona PRC. Apunta a la base de datos NOMBRADA
   'coordenadasnormativas' (NO la default), colección 'normativas_prc'. La llave
   maestra combina comuna + código de zona crudo (generarLlaveMaestra). Imports
   estáticos de firebase/firestore; reutiliza la app inicializada en firebase.ts.
   ============================================================================= */
import { getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { generarLlaveMaestra } from '../utils/geoUtils';
import type { NormativaPRC } from './types';

/** Instancia perezosa de la base de datos nombrada 'coordenadasnormativas'. */
let dbNormativasRef: ReturnType<typeof getFirestore> | null = null;
function dbNormativas(): ReturnType<typeof getFirestore> {
  if (!dbNormativasRef) dbNormativasRef = getFirestore(getApp(), 'coordenadasnormativas');
  return dbNormativasRef;
}

/** Claves posibles del código de zona en el GeoJSON del PRC (tolerante al esquema). */
const CLAVES_ZONA = ['ZONA', 'codigoZona', 'COD_ZONA', 'ZONE', 'zona'];

/** Extrae el código de zona crudo desde las properties de un feature PRC. */
export function codigoZonaDeProperties(props: Record<string, unknown> | null | undefined): string | null {
  if (!props) return null;
  for (const k of CLAVES_ZONA) {
    const v = props[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return null;
}

/**
 * Busca la ficha normativa en coordenadasnormativas/normativas_prc por llave maestra
 * (`{comuna}_{zona}`). Devuelve null si no existe documento para esa zona.
 */
export async function getNormativa(comuna: string, codigoZonaCrudo: string): Promise<NormativaPRC | null> {
  const llave = generarLlaveMaestra(comuna, codigoZonaCrudo);
  const snap = await getDoc(doc(dbNormativas(), 'normativas_prc', llave));
  return snap.exists() ? (snap.data() as NormativaPRC) : null;
}

/** Variante que recibe directamente las properties del feature intersectado. */
export async function getNormativaDesdeFeature(
  comuna: string,
  props: Record<string, unknown> | null | undefined,
): Promise<{ zona: string; normativa: NormativaPRC | null } | null> {
  const zona = codigoZonaDeProperties(props);
  if (!zona) return null;
  const normativa = await getNormativa(comuna, zona);
  return { zona, normativa };
}
