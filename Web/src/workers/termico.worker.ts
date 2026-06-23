/* =============================================================================
   termico.worker.ts — CEREBRO TÉRMICO (Web Worker · motor de U/acreditación)
   -----------------------------------------------------------------------------
   // Ejecuta el motor real (engine.ts) fuera del hilo de UI: recibe el estado de
   // la envolvente + zona, devuelve U campo/puente/ponderado y veredictos vs las
   // tablas oficiales RT (Art. 4.1.10 OGUC). Mismo patrón que geo.worker.ts.
   // Protocolo: { reqId, input } → { reqId, result }.
   ============================================================================= */
import { evaluar, type EvaluarInput, type EvaluacionTermica } from '../tools/termico/engine';

export interface TermicoReq { reqId: number; input: EvaluarInput; }
export interface TermicoRes { reqId: number; result: EvaluacionTermica; }

self.onmessage = (e: MessageEvent<TermicoReq>) => {
  const { reqId, input } = e.data;
  const result = evaluar(input);
  const msg: TermicoRes = { reqId, result };
  (self as unknown as Worker).postMessage(msg);
};
