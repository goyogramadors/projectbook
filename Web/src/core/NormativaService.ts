/* =============================================================================
   _ARCHIBOTS · NORMATIVA SERVICE (Cerebro Normativo — capa de datos)
   -----------------------------------------------------------------------------
   v3 (Tintero #9): la ficha normativa se resuelve desde ARCHIVOS LOCALES servidos
   por Hosting (public/norma-data/13_<comuna>.json), NO desde Firestore. Cada
   archivo es un array de fichas con el esquema que ya consume la UI (zona_codigo,
   zona_nombre, usos_permitidos_txt, coef_constructibilidad, cos_primer_piso,
   altura_maxima_txt, etc.). El match es por `zona_codigo` normalizado
   (sin tildes/espacios, mayúsculas), tolerante a guiones y mayúsculas.
   Caché en memoria por comuna (una descarga por sesión).
   ============================================================================= */
import type { NormativaPRC } from './types';

const REGION_DEFECTO = '13'; // Región Metropolitana (única región con normativa local hoy).
const memoryCache: Record<string, NormativaPRC[]> = {};

/** Slug de archivo: comuna en minúsculas, sin tildes ni signos. Ej: "Ñuñoa" → "nunoa". */
export function comunaSlug(comuna: string): string {
  return comuna
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita diacríticos (Ñ→N, á→a)
    .replace(/[^a-zA-Z0-9]/g, '')                      // quita espacios y signos
    .toLowerCase();
}

/** Ruta del archivo de normativa local de una comuna. */
export function rutaNormativa(comuna: string, region: string = REGION_DEFECTO): string {
  return `/norma-data/${region}_${comunaSlug(comuna)}.json`;
}

/** Normaliza un código de zona a token canónico: sin tildes, sin separadores
 *  (espacios/guiones/signos), mayúsculas. Ej: "MH- 1" → "MH1", "Z-4C+R" → "Z4CR". */
function normZona(z: unknown): string {
  return String(z ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')   // quita espacios, guiones y signos
    .toUpperCase();
}

/** Compara dos códigos de zona tolerando el prefijo "Z" que las fichas anteponen a
 *  las zonas especiales/patrimoniales (GeoJSON "MH-1"/"ZT-3"/"ICH-1" ↔ ficha
 *  "Z-MH1"/"Z-ZT3"/"Z-ICH1"). Empareja exacto o con/sin "Z" inicial. */
function matchZona(a: string, b: string): boolean {
  if (a === b) return true;
  const stripZ = (s: string) => (s.length > 2 && s.startsWith('Z') ? s.slice(1) : s);
  return stripZ(a) === stripZ(b) || stripZ(a) === b || a === stripZ(b);
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

/** Carga (y cachea) el array de fichas locales de una comuna. Devuelve [] si no hay archivo. */
export async function loadComunaNormativas(comuna: string, region: string = REGION_DEFECTO): Promise<NormativaPRC[]> {
  const key = `${region}_${comunaSlug(comuna)}`;
  if (memoryCache[key]) return memoryCache[key];
  try {
    const resp = await fetch(rutaNormativa(comuna, region));
    if (!resp.ok) { memoryCache[key] = []; return []; }
    const arr = await resp.json();
    const list = Array.isArray(arr) ? (arr as NormativaPRC[]) : [];
    memoryCache[key] = list;
    return list;
  } catch {
    memoryCache[key] = [];
    return [];
  }
}

/**
 * Busca la ficha normativa local por código de zona (match en `zona_codigo`).
 * Devuelve null si la comuna no tiene archivo o la zona no está en él.
 */
export async function getNormativa(comuna: string, codigoZonaCrudo: string): Promise<NormativaPRC | null> {
  const list = await loadComunaNormativas(comuna);
  if (!list.length) return null;
  const target = normZona(codigoZonaCrudo);
  const hit = list.find((f) => matchZona(normZona((f as Record<string, unknown>).zona_codigo), target));
  return hit ?? null;
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
