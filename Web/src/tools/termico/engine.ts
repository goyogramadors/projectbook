/* =============================================================================
   engine.ts — MOTOR DE CÁLCULO TÉRMICO (puro, sin React · corre en Web Worker)
   -----------------------------------------------------------------------------
   // Cálculo REAL de transmitancia U y acreditación contra las tablas oficiales
   // RT (Art. 4.1.10 OGUC, DS N°15 MINVU, vigente 28-11-2025) cargadas en tablas.ts.
   //   · Rt = Rs_total(elemento) + Σ(eᵢ/λᵢ)   ;   U = 1/Rt        (NCh853)
   //   · Método Campo + Puente: U_pond = (1−f)·U_campo + f·U_puente
   //   · Veredicto opaco: U_pond ≤ U_máx(zona, elemento) ⇒ CUMPLE
   //   · Sobrecimiento: R100 = (e/λ)·100 ≥ R100_mín(zona)
   //   · Puerta: U_puerta ≤ U_máx_puerta(zona)
   // Módulo puro: lo importan tanto el worker como (para tipos) la vista.
   // La verificación de condensación (Res. Ex. 1802 MINVU) NO se acredita aquí: es
   // una memoria de cálculo aparte (planilla MINVU); se reporta como "externa".
   ============================================================================= */
import {
  U_MAX_RESIDENCIAL, R100_SOBRECIMIENTO, RS_TOTAL, lambdaOf,
  type Zona, type ElementoOpaco,
} from './tablas';
import type { TermicoComplejo } from '../../core/types';

export type Veredicto = 'cumple' | 'no-cumple' | 'pendiente' | 'no-aplica';

export interface ResultadoElemento {
  uCampo: number;
  uPuente: number;
  uPond: number;
  uMax: number;
  veredicto: Veredicto;
}

export interface ResultadoSobrecimiento {
  r100: number;
  r100Min: number | null;
  veredicto: Veredicto;
}

export interface ResultadoPuerta {
  u: number;
  uMax: number | null;
  veredicto: Veredicto;
}

export interface EvaluacionTermica {
  zona: Zona | '';
  elementos: Record<ElementoOpaco, ResultadoElemento>;
  sobrecimiento: ResultadoSobrecimiento | null;
  puerta: ResultadoPuerta | null;
  /** true solo si zona resuelta y techo+muro+piso CUMPLEN (núcleo de la envolvente). */
  acredita: boolean;
}

/** Rt de un set de capas (espesor en mm) + resistencias superficiales del elemento. */
export function calcRt(capas: { matId: string; espMm: string }[], elemento: ElementoOpaco): number {
  return capas.reduce((acc, c) => {
    const e = (parseFloat(c.espMm) || 0) / 1000; // mm → m
    const lambda = lambdaOf(c.matId);
    return acc + (lambda > 0 ? e / lambda : 0);
  }, RS_TOTAL[elemento]);
}

/** U = 1/Rt de un set de capas. */
export function calcU(capas: { matId: string; espMm: string }[], elemento: ElementoOpaco): number {
  const rt = calcRt(capas, elemento);
  return rt > 0 ? 1 / rt : 0;
}

/** Resultado ponderado Campo+Puente de un complejo y su veredicto vs la zona. */
export function evaluarElemento(
  elemento: ElementoOpaco,
  complejo: TermicoComplejo,
  zona: Zona | '',
): ResultadoElemento {
  const uCampo = calcU(complejo.capas, elemento);
  const puenteCapas = complejo.capas.map((cap, i) =>
    i === complejo.capaReemplazada ? { ...cap, matId: complejo.estructuraId } : cap,
  );
  const uPuente = calcU(puenteCapas, elemento);
  const f = Math.min(Math.max((parseFloat(complejo.fraccion) || 0) / 100, 0), 1);
  const uPond = (1 - f) * uCampo + f * uPuente;

  const uMax = U_MAX_RESIDENCIAL[zona as Zona]?.[elemento] ?? 0;
  let veredicto: Veredicto = 'pendiente';
  if (zona && uMax > 0) veredicto = uPond <= uMax + 1e-6 ? 'cumple' : 'no-cumple';
  return { uCampo, uPuente, uPond, uMax, veredicto };
}

/** R100 = (espesor_m / λ) · 100 del aislante de sobrecimiento, vs exigencia de zona. */
export function evaluarSobrecimiento(
  aplica: boolean, matId: string, espMm: string, zona: Zona | '',
): ResultadoSobrecimiento {
  if (!aplica) return { r100: 0, r100Min: null, veredicto: 'no-aplica' };
  const e = (parseFloat(espMm) || 0) / 1000;
  const lambda = lambdaOf(matId);
  const r100 = lambda > 0 ? (e / lambda) * 100 : 0;
  const r100Min = zona ? R100_SOBRECIMIENTO[zona as Zona] : null;
  let veredicto: Veredicto = 'pendiente';
  if (zona) {
    if (r100Min == null) veredicto = 'no-aplica'; // Zona A sin exigencia
    else veredicto = r100 >= r100Min ? 'cumple' : 'no-cumple';
  }
  return { r100, r100Min, veredicto };
}

/** Puerta opaca: U declarado de la ficha vs U_máx de la zona. */
export function evaluarPuerta(uStr: string, zona: Zona | ''): ResultadoPuerta {
  const u = parseFloat(uStr) || 0;
  const uMax = zona ? U_MAX_RESIDENCIAL[zona as Zona]?.puerta ?? null : null;
  let veredicto: Veredicto = 'pendiente';
  if (!uStr.trim()) veredicto = 'pendiente';
  else if (zona) {
    if (uMax == null) veredicto = 'no-aplica'; // Zona A sin exigencia de puerta
    else veredicto = u <= uMax + 1e-6 ? 'cumple' : 'no-cumple';
  }
  return { u, uMax, veredicto };
}

export interface EvaluarInput {
  zona: Zona | '';
  complejos: Record<ElementoOpaco, TermicoComplejo>;
  sobrecim?: { aplica: boolean; matId: string; espMm: string };
  puertaU?: string;
}

/** Evaluación completa de la envolvente (la función que invoca el Web Worker). */
export function evaluar(input: EvaluarInput): EvaluacionTermica {
  const elementos = {
    techo: evaluarElemento('techo', input.complejos.techo, input.zona),
    muro: evaluarElemento('muro', input.complejos.muro, input.zona),
    piso: evaluarElemento('piso', input.complejos.piso, input.zona),
  };
  const sobrecimiento = input.sobrecim
    ? evaluarSobrecimiento(input.sobrecim.aplica, input.sobrecim.matId, input.sobrecim.espMm, input.zona)
    : null;
  const puerta = input.puertaU !== undefined ? evaluarPuerta(input.puertaU, input.zona) : null;

  const opacosCumplen = (['techo', 'muro', 'piso'] as const).every(
    el => elementos[el].veredicto === 'cumple',
  );
  return { zona: input.zona, elementos, sobrecimiento, puerta, acredita: Boolean(input.zona) && opacosCumplen };
}
