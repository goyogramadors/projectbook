/**
 * Middleware de llaves maestras.
 * Genera un ID compatible con Firestore para buscar la normativa.
 * Ej: comuna="Providencia", codigoZonaCrudo="UpR/EA12" -> "providencia_upr_ea12"
 */
export function generarLlaveMaestra(comuna: string, codigoZonaCrudo: string): string {
  const c = comuna.toLowerCase().replace(/\s+/g, '');
  // Convierte a minúsculas, quita espacios y reemplaza '/' y caracteres raros por '_'
  const z = codigoZonaCrudo.toLowerCase().replace(/\s+/g, '').replace(/[\/\\]/g, '_');
  return `${c}_${z}`;
}