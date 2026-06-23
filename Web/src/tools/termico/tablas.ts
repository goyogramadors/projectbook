/* =============================================================================
   tablas.ts — TABLAS OFICIALES Reglamentación Térmica (RT) · Art. 4.1.10 OGUC
   -----------------------------------------------------------------------------
   // FUENTE DE VERDAD NORMATIVA (uso RESIDENCIAL). Transcripción de la
   // actualización del Art. 4.1.10 OGUC — DS N°15 MINVU, publicada D.O. 27-05-2024,
   // VIGENTE 28-11-2025. Nueva Zonificación Térmica NCh1079:2019 (9 zonas A–I).
   //
   // Documentos fuente (DITEC / MINVU):
   //  · "Actualización Art. 4.1.10 OGUC — Implicancias (Res/Edu/Salud)" — DITEC.
   //    https://www.minvu.gob.cl/wp-content/uploads/2026/01/Art-4-1-10-OGUC_RES-EDU-SAL_DITEC.pdf
   //  · "Actualización Reglamentación Térmica — Implicancias" — DITEC.
   //  · https://www.minvu.gob.cl/nueva-reglamentacion-termica/
   //
   // Las celdas combinadas del cuadro oficial (zonas contiguas que comparten valor)
   // se desambiguaron por monotonía climática A→I (zona más fría ⇒ exigencia más
   // estricta ⇒ U menor), consumiendo exactamente el conjunto de valores impresos.
   // NO se inventaron cifras. Si MINVU publica una errata, corregir SOLO este archivo.
   //
   // Catálogo de materiales: λ (W/m·K) de NCh853 / fichas DITEC; ρ y μ orientativos
   // para la verificación de condensación (planilla MINVU, Res. Ex. 1802).
   ============================================================================= */

export const ZONAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export type Zona = (typeof ZONAS)[number];
export type ElementoOpaco = 'techo' | 'muro' | 'piso';

/* ── Tabla 1 · Transmitancia térmica máxima U (W/m²K) — uso RESIDENCIAL ──────────
   Columnas: techo (techumbre) · muro (perimetral) · piso (ventilado) · puerta (opaca).
   `null` = sin exigencia para esa zona (Zona A, sin exigencia de muro/piso/puerta). */
export interface UMaxFila { techo: number; muro: number; piso: number; puerta: number | null; }
export const U_MAX_RESIDENCIAL: Record<Zona, UMaxFila> = {
  A: { techo: 0.84, muro: 2.10, piso: 3.60, puerta: null },
  B: { techo: 0.47, muro: 0.80, piso: 0.87, puerta: 1.70 },
  C: { techo: 0.47, muro: 0.80, piso: 0.70, puerta: 1.70 },
  D: { techo: 0.38, muro: 0.60, piso: 0.60, puerta: 1.70 },
  E: { techo: 0.33, muro: 0.60, piso: 0.50, puerta: 1.70 },
  F: { techo: 0.28, muro: 0.45, piso: 0.39, puerta: 1.70 },
  G: { techo: 0.28, muro: 0.45, piso: 0.39, puerta: 1.70 },
  H: { techo: 0.25, muro: 0.30, piso: 0.32, puerta: 1.70 },
  I: { techo: 0.25, muro: 0.30, piso: 0.32, puerta: 1.70 },
};

/* ── Sobrecimientos · R100 mínimo del aislante (m²K/W ×100) ──────────────────────
   A: sin exigencia · B–E: 45 · F–I: 91. */
export const R100_SOBRECIMIENTO: Record<Zona, number | null> = {
  A: null, B: 45, C: 45, D: 45, E: 45, F: 91, G: 91, H: 91, I: 91,
};

/* ── Clase de permeabilidad al aire mínima (100 Pa) — puertas y ventanas ─────────
   A: sin exigencia · B–C: 1 · D–F: 2 · G–I: 3. (Ensayo NCh3297 / clasif. NCh3296) */
export const CLASE_PERMEABILIDAD: Record<Zona, number | null> = {
  A: null, B: 1, C: 1, D: 2, E: 2, F: 2, G: 3, H: 3, I: 3,
};

/* ── Ventanas · % máximo de superficie vidriada vs muro, por orientación y U ─────
   Bandas de U de la ventana (W/m²K). El % se elige por el primer umbral que la U
   de la ventana NO supere. Orientaciones: Norte · O-P (Oriente/Poniente) · Sur ·
   OGT (Orientación Global Teórica). */
export const VENTANA_U_BANDAS = [0.6, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 5.8] as const;
export type VentanaOrientacion = 'norte' | 'op' | 'sur' | 'ogt';
export const VENTANA_PCT_MAX: Record<Zona, Record<VentanaOrientacion, number[]>> = {
  A: { norte: [100,100,100,100,100,98,97,95,94,91,88,50], op: [100,100,99,96,94,91,87,84,80,75,69,30], sur: [94,93,91,89,85,82,78,74,69,63,57,25], ogt: [54,53,52,51,50,49,48,46,44,42,40,25] },
  B: { norte: [100,99,98,97,96,94,92,90,88,85,82,30], op: [92,91,89,87,84,81,78,75,71,66,60,20], sur: [86,84,81,78,75,71,68,64,59,54,47,10], ogt: [52,51,49,47,46,45,43,42,40,38,35,10] },
  C: { norte: [96,95,94,93,91,90,88,85,83,79,75,40], op: [82,81,79,77,75,72,69,66,62,58,52,35], sur: [75,73,70,67,64,61,58,54,49,44,38,15], ogt: [47,46,45,44,42,41,39,37,35,33,30,15] },
  D: { norte: [94,93,91,89,87,85,83,80,77,73,69,25], op: [73,72,70,68,65,63,60,57,53,49,44,15], sur: [62,61,59,57,54,51,48,44,40,35,29,10], ogt: [43,42,41,40,38,37,35,33,31,28,25,10] },
  E: { norte: [90,89,87,85,83,80,78,75,71,67,61,10], op: [63,62,60,58,56,54,51,48,45,41,35,8], sur: [51,50,48,46,44,41,38,35,31,26,20,5], ogt: [39,38,37,36,34,32,30,28,26,23,19,5] },
  F: { norte: [88,86,83,80,78,76,73,69,65,60,54,0], op: [54,53,51,49,47,45,42,40,36,32,27,0], sur: [41,40,38,36,34,31,28,25,21,17,12,0], ogt: [36,35,33,31,30,28,26,24,21,17,13,0] },
  G: { norte: [84,82,79,76,74,71,67,64,59,54,46,0], op: [43,42,41,40,38,36,34,31,28,24,20,0], sur: [31,30,28,26,24,21,19,16,13,8,0,0], ogt: [32,31,29,27,26,24,21,19,16,12,0,0] },
  H: { norte: [77,76,74,72,69,66,62,58,53,47,38,0], op: [34,33,32,31,29,27,25,23,20,16,12,0], sur: [30,29,27,25,23,20,18,15,12,7,0,0], ogt: [31,30,28,26,25,23,20,18,15,11,0,0] },
  I: { norte: [75,73,70,67,64,61,57,52,46,39,30,0], op: [43,42,41,40,38,36,34,31,28,24,20,0], sur: [28,27,25,23,21,18,16,13,10,5,0,0], ogt: [29,28,26,24,23,21,18,16,13,10,0,0] },
};

/** % máximo de ventana permitido para una zona/orientación dado el U de la ventana. */
export function ventanaPctMax(zona: Zona, orient: VentanaOrientacion, uw: number): number | null {
  const fila = VENTANA_PCT_MAX[zona]?.[orient];
  if (!fila) return null;
  for (let i = 0; i < VENTANA_U_BANDAS.length; i++) {
    if (uw <= VENTANA_U_BANDAS[i]!) return fila[i]!;
  }
  return fila[fila.length - 1]!; // U > 5,8 → última banda (típicamente 0%)
}

/* ── Materiales (λ W/m·K · ρ kg/m³ · μ factor de resistencia a vapor) ────────────
   λ gobierna el cálculo de U; ρ/μ alimentan la verificación de condensación. */
export interface MaterialTermico { id: string; nombre: string; lambda: number; rho: number; mu: number; }
export const MATERIALES: MaterialTermico[] = [
  { id: 'horm',   nombre: 'Hormigón armado',                lambda: 1.63,  rho: 2400, mu: 70 },
  { id: 'ladr',   nombre: 'Ladrillo cerámico',              lambda: 0.46,  rho: 1000, mu: 10 },
  { id: 'eps',    nombre: 'Poliestireno expandido (EPS)',   lambda: 0.038, rho: 20,   mu: 30 },
  { id: 'xps',    nombre: 'Poliestireno extruido (XPS)',    lambda: 0.033, rho: 35,   mu: 100 },
  { id: 'lana',   nombre: 'Lana mineral',                   lambda: 0.042, rho: 40,   mu: 1 },
  { id: 'lanav',  nombre: 'Lana de vidrio',                 lambda: 0.040, rho: 14,   mu: 1 },
  { id: 'pur',    nombre: 'Poliuretano proyectado (PUR)',   lambda: 0.025, rho: 35,   mu: 60 },
  { id: 'madera', nombre: 'Madera',                         lambda: 0.10,  rho: 500,  mu: 50 },
  { id: 'osb',    nombre: 'Tablero OSB',                    lambda: 0.13,  rho: 650,  mu: 50 },
  { id: 'yeso',   nombre: 'Yeso-cartón',                    lambda: 0.26,  rho: 800,  mu: 8 },
];

export const ESTRUCTURAS: MaterialTermico[] = [
  { id: 'e-madera', nombre: 'Madera',    lambda: 0.10, rho: 500,  mu: 50 },
  { id: 'e-acero',  nombre: 'Acero',     lambda: 50,   rho: 7800, mu: 99999 },
  { id: 'e-horm',   nombre: 'Hormigón',  lambda: 1.63, rho: 2400, mu: 70 },
];

export function lambdaOf(id: string): number {
  return MATERIALES.find(m => m.id === id)?.lambda
    ?? ESTRUCTURAS.find(m => m.id === id)?.lambda
    ?? 1;
}

/* ── Resistencias superficiales (m²K/W) por elemento (NCh853, flujo de calor) ────
   Rsi+Rse: muro (horizontal) 0,17 · techo (ascendente) 0,14 · piso (desc.) 0,21. */
export const RS_TOTAL: Record<ElementoOpaco, number> = { techo: 0.14, muro: 0.17, piso: 0.21 };

/* ── Comuna → Zona térmica (semilla por localidades representativas NCh1079:2019).
   No exhaustivo: si la comuna no está, el usuario fija la zona manualmente. ────── */
export const COMUNA_ZONA: Record<string, Zona> = {
  'Arica': 'A', 'Iquique': 'A', 'Antofagasta': 'A', 'Calama': 'A',
  'María Elena': 'B', 'Copiapó': 'B', 'Vallenar': 'B',
  'Coquimbo': 'C', 'La Serena': 'C', 'Valparaíso': 'C', 'Viña del Mar': 'C', 'Licantén': 'C',
  'Santiago': 'D', 'Ñuñoa': 'D', 'Providencia': 'D', 'Maipú': 'D', 'Rancagua': 'D', 'Talca': 'D',
  'Constitución': 'E', 'Concepción': 'E', 'Talcahuano': 'E', 'Toltén': 'E',
  'Chillán': 'F', 'Temuco': 'F', 'Río Bueno': 'F', 'Los Ángeles': 'F',
  'Valdivia': 'G', 'Osorno': 'G', 'Puerto Montt': 'G',
  'Putre': 'H', 'Lonquimay': 'H', 'Pucón': 'H',
  'Coyhaique': 'I', 'Puerto Natales': 'I', 'Punta Arenas': 'I',
};
