/* =============================================================================
   temas.ts — DATOS COMPARTIDOS Libro de Obra ⇄ Registro RDI
   -----------------------------------------------------------------------------
   Fuente única de los temas/subtemas LOD (puntos 1.1–1.5), los usuarios sugeridos
   para "participantes" y el helper de adjunto local. Lo consumen el Libro de Obras
   Digital y la herramienta Registro RDI, para que ambos compartan exactamente los
   mismos temas y subtemas seleccionables (sin duplicar ni derivar listas).
   ============================================================================= */
import type { ObraAdjunto } from '../../core/types';

/** Subtemas por tema (Libro de Obra · puntos 1.0–1.5). */
export const TEMAS_LOD: Record<string, string[]> = {
  '1.0 Libro de Obras Maestro': ['Comunicación General', 'Acta de Reunión', 'Instrucción al Contratista', 'Oficio / Memorándum', 'Nota de Terreno', 'Cierre del Libro'],
  '1.1 Gestión de la Calidad': ['Plan de Calidad: Plan inicial y modificaciones.', 'Acta de exposición y reuniones de Calidad', 'Calidad de los materiales', 'Auditorías Internas'],
  '1.2 Prevención de Riesgos': ['Reunión de inicio de prevención de riesgos', 'Aviso de inicio al Organismo administrador del Seguro', 'Plan y Programa: Plan y programa inicial, modificaciones', 'Informes Cumplimiento Programa', 'Comité Paritario', 'Accidentes', 'Fiscalizaciones'],
  '1.3 Medio Ambiente': ['Plan de Gestión Ambiental', 'Presentación del Planes de Manejo', 'Fiscalizaciones'],
  '1.4 Participación Ciudadana': ['Plan de Participación Ciudadana', 'Actas reuniones participación Ciudadana y/o Indígena', 'Material Informativo', 'Sugerencias y Reclamos'],
  '1.5 Otras Comunicaciones': ['Letrero de identificación', 'Señalización y Medidas de Seguridad', 'Programa de trabajo, inversiones y mano de obra', 'Permisos para la ejecución de la obra', 'Gestión del Personal', 'Carpeta Laboral', 'Estados de Pago', 'Garantías', 'Canje de Retenciones', 'Modificación de Obra', 'Subcontratos', 'Valores proforma', 'Informes mensuales', 'Recepción de Etapas', 'Término de Obra'],
};
export const TEMAS_KEYS = Object.keys(TEMAS_LOD);

/** Usuario actual (demo) y sugeridos para "participantes". */
export const CURRENT_USER = 'M. Soto (IF)';
export const USERS = ['M. Soto (IF)', 'J. Pérez', 'C. Rojas', 'P. Díaz', 'Contratista'];

/** Adjunto sin subida real (modo Free/local o degradación): solo metadato. */
export const localAdj = (f: File): ObraAdjunto => ({
  uuid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: f.name, size: f.size, type: f.type, url: '', path: '',
});
