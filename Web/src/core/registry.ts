/* =============================================================================
   _ARCHIBOTS · REGISTRO DE HERRAMIENTAS (contrato §1.3 / §5.5)
   -----------------------------------------------------------------------------
   Construye el ToolManifest[] uniendo la metadata del CATALOG con el `component`
   perezoso de cada herramienta. CONTRATO DE INYECCIÓN ON-DEMAND:

     registry[toolId].component = React.lazy(() => import('../tools/XxxView'))

   El <ToolHost> resuelve el manifest por id y lo envuelve en <Suspense>.
   ⚠️ FASE 1/2: las herramientas de las carpetas 1–7 AÚN NO se programan, por lo
   que `LAZY_COMPONENTS` está vacío a propósito. En la Fase 3 (F3.1) se completa
   con una entrada por herramienta activa, p. ej.:

     dimensionador: lazy(() => import('../tools/DimensionadorView')),

   Las 17 entradas `soon` NUNCA llevan component (muestran <ProximamenteView>).
   ============================================================================= */

import { lazy } from 'react';
import { CATALOG } from './catalog';
import type { ToolManifest, ToolProps } from './types';
import type React from 'react';

type LazyTool = React.LazyExoticComponent<React.ComponentType<ToolProps>>;

/**
 * Mapa id→componente perezoso. SE LLENA EN FASE 3. Mantener este objeto como el
 * ÚNICO lugar donde se declara el `import()` de cada herramienta garantiza el
 * code-splitting (un chunk por tool) y evita imports pesados en el top-level.
 */
export const LAZY_COMPONENTS: Record<string, LazyTool> = {
  // F4 · Geolocalizador Normativo (T-07) → "Dos Cerebros" (Maps + Web Worker Turf
  // + CDN GeoJSON + DB nombrada coordenadasnormativas). Reemplaza la versión F3.
  geolocalizador: lazy(() => import('../tools/GeolocalizadorView')),
  // F4 · Mapa de Terreno (T-08) integrado dentro de Ubicación del Proyecto (T-04b);
  // ya no es herramienta separada del catálogo. Su lógica vive en UbicacionView.
  // F5 · Asistente de Usos BIM (T-17) → PREMIUM (gating vía useAccess/ToolHost).
  'bim-wizard': lazy(() => import('../tools/BimWizardView')),
  // Calculadora de Costos de Construcción MINVU (T-41).
  'calc-minvu': lazy(() => import('../tools/CalculadoraConstruccionesMinvuView')),
  // Cabida / Estudio de Cabida volumétrica (T-09). Unifica la antigua
  // "Cabida de Terreno" + "Volumen Teórico" en una sola herramienta.
  volumen: lazy(() => import('../tools/VolumenTeoricoView')),
  // Dimensionador de Edificios Públicos (T-15, MDSF 2024).
  'dim-publicos': lazy(() => import('../tools/DimensionadorPublicosView')),
  // F3 · Propuesta de Honorarios de Servicios (T-05).
  propuesta: lazy(() => import('../tools/PropuestaView')),
  // F3 · Calculadora de Honorarios (T-06, id: hsa).
  hsa: lazy(() => import('../tools/CalculadoraHonorariosView')),
  // F3 · Generador de Contratos (T-45, id: contratos).
  contratos: lazy(() => import('../tools/GeneradorContratosView')),
  // F3 · Dimensionador de Proyecto (T-14).
  dimensionador: lazy(() => import('../tools/DimensionadorView')),
  // F3 · Expediente Municipal (T-24, id: expediente-dom).
  'expediente-dom': lazy(() => import('../tools/ExpedienteMunicipalView')),
  // F3 · Participantes del Proyecto (T-03).
  participantes: lazy(() => import('../tools/ParticipantesView')),
  // F3 · Datos del Proyecto (T-04).
  'datos-proyecto': lazy(() => import('../tools/DatosProyectoView')),
  // F3 · Seguimiento de Obras (T-43).
  seguimiento: lazy(() => import('../tools/SeguimientoObrasView')),
  // F3 · Ubicación del Proyecto (T-04b).
  ubicacion: lazy(() => import('../tools/UbicacionView')),
  // Biblioteca de Recursos — formularios MINVU (PDF en public/Biblioteca/),
  // agrupados por tipología de proyecto. Reusa el id 'form-municipales'.
  'form-municipales': lazy(() => import('../tools/BibliotecaView')),
  // F5 · Cuadro de Superficies (T-26) — Expediente DOM.
  'cuadro-superficies': lazy(() => import('../tools/CuadroSuperficiesView')),
  // F5 · Calculadora Carga de Ocupación (T-27, OGUC 4.2.4) — Expediente DOM.
  'carga-ocupacion': lazy(() => import('../tools/CalculadoraCargaOcupacionView')),
  // F5 · Listado de Documentos del Expediente (T-25) — Expediente DOM.
  'listado-dom': lazy(() => import('../tools/ListadoDocumentosView')),
  // F5 · Emisor de Estado de Pago (T-44) — Seguimiento e ITO / Financiero.
  'estados-pago': lazy(() => import('../tools/EmisorEstadoPagoView')),
  // Fase 0 · MOCKUP — Informe de Subsuelo (Informes especiales). En memoria, sin BD.
  'informe-suelo': lazy(() => import('../tools/InformeSubsueloView')),
  // Fase 0 · MOCKUP — Memoria de Ruta Accesible (Informes especiales). En memoria.
  accesibilidad: lazy(() => import('../tools/RutaAccesibleView')),
  // Fase 0 · MOCKUP Premium — Informe Norma Térmica (motor demo + tablas POR COMPLETAR).
  'informe-termico': lazy(() => import('../tools/InformesTermicosView')),
  // Fase 0 · MOCKUP Premium — Libro de Obras Digital (sub-libros, acta, folios, archivado).
  'libro-obras': lazy(() => import('../tools/LibroObrasDigitalView')),
  // Fase 0 · MOCKUP Premium — Carpeta Digital (árbol por contrato, versiones, archivado).
  'carpeta-digital': lazy(() => import('../tools/CarpetaDigitalView')),
  // …resto de herramientas se completan progresivamente en F3/F4.
};

// `lazy` se reexporta para que F3 lo use sin reimportar; evita "unused import".
export { lazy };

/** Registro vivo: metadata + componente perezoso si existe y la tool es `active`. */
export const REGISTRY: Record<string, ToolManifest> = Object.fromEntries(
  CATALOG.map((t) => [
    t.id,
    {
      ...t,
      component: t.estado === 'active' ? LAZY_COMPONENTS[t.id] : undefined,
    } as ToolManifest,
  ]),
);

export function getManifest(toolId: string | undefined): ToolManifest | null {
  if (!toolId) return null;
  return REGISTRY[toolId] ?? null;
}
