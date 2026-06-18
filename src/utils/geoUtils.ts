/* =============================================================================
   utils/geoUtils.ts — Puente de import para el Cerebro Normativo.
   El hook useCerebroNormativo importa la Llave Maestra desde '../utils/geoUtils'.
   La implementacion real (generarLlaveMaestra) vive en core/geoUtils.ts; aqui solo
   la re-exportamos para mantener UNA sola fuente de verdad (cero redundancia).
   ============================================================================= */
export * from '../core/geoUtils';
