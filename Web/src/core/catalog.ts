/* =============================================================================
   _ARCHIBOTS · CATÁLOGO (metadata de presentación)
   -----------------------------------------------------------------------------
   Metadata que el Catálogo, el Binder y la Top Tools Bar consumen para pintarse.
   NO implementa herramientas: solo describe id, carpeta, subsección y estado.

   ⟲ v2.1 (2026-06-16) — Reestructuración del catálogo:
     · Se eliminan los prefijos "T-XX" (campo `code` vaciado; no se muestran).
     · Carpetas 1, 2 y 6: herramientas SUELTAS (sub vacío, sin subsección).
     · Carpeta 4: nuevas subsecciones (Expediente DOM · Informes especiales ·
       Expedientes Sectoriales · Repositorio de antecedentes). Accesibilidad y
       Calculadora de Costos MINVU trasladadas aquí.
     · Carpeta 5: subsecciones EETT/Presupuesto/Gantt y Seguimiento e ITO.
       "Seguimiento de Obras" → "Minuta de Visita a Obra".
   `sub: ''` ⇒ la herramienta se lista directamente bajo la carpeta (sin header).
   ============================================================================= */

import type { Folder, CatalogTool, Fase } from './types';

export const FOLDERS: Folder[] = [
  { id: 0, name: 'Ficha del Proyecto', short: 'FICHA', icon: 'FileText' },
  { id: 1, name: 'Información del Proyecto', short: 'INFO', icon: 'Folder' },
  { id: 2, name: 'Terreno', short: 'TERRENO', icon: 'Map' },
  { id: 3, name: 'Proyecto', short: 'PROYECTO', icon: 'Building2' },
  { id: 4, name: 'Expedientes de Permisos', short: 'EXPEDIENTES', icon: 'FileCheck' },
  { id: 5, name: 'Construcción', short: 'CONSTRUCCIÓN', icon: 'HardHat' },
  { id: 6, name: 'Administrativos', short: 'ADMIN', icon: 'Briefcase' },
  // ⟲ v2.1: en el CATÁLOGO la carpeta 7 sigue siendo la Biblioteca de Recursos.
  // En el BINDER, la pestaña 7 se reusa como "Repositorio" (ver BinderFicha).
  { id: 7, name: 'Biblioteca de Recursos', short: 'BIBLIOTECA', icon: 'BookOpen' },
];

export const ALL_PHASES: Fase[] = [
  'PERFIL', 'ANTEPROY', 'PROYECTO', 'TRÁMITE', 'CONSTRUCCIÓN', 'ADMIN',
];

/** Default de la Top Tools Bar (CONST §2 / config/topTools.ids). */
export const TOP_TOOLS_DEFAULT = [
  'dimensionador', 'geolocalizador', 'expediente-dom', 'hsa',
];

export const CATALOG: CatalogTool[] = [
  /* ── CARPETA 1 · INFORMACIÓN DEL PROYECTO (herramientas sueltas) ──────────── */
  { id: 'datos-proyecto', code: '', label: 'Datos del Proyecto', folder: 1, sub: '', icon: 'ClipboardList', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Etapa, destino, tipo y superficies según el modelo de Datos Clave.' },
  { id: 'participantes', code: '', label: 'Participantes del Proyecto', folder: 1, sub: '', icon: 'Users', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Arquitecto y Propietario por defecto; [+] agrega DOM, calculista, constructor y roles libres (nombre + RUT).' },

  /* ── CARPETA 2 · TERRENO (herramientas sueltas) ───────────────────────────── */
  { id: 'ubicacion', code: '', label: 'Ubicación del Proyecto', folder: 2, sub: '', icon: 'Navigation', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Ubicación administrativa básica (región, comuna, dirección, rol SII). Se complementa con el Geolocalizador.' },
  { id: 'geolocalizador', code: '', label: 'Geolocalizador Normativo', folder: 2, sub: '', icon: 'MapPin', estado: 'active', tier: 'free', fases: ['PERFIL', 'ANTEPROY'], desc: 'Dirección → polígono → zona PRC → ficha normativa. Modos [ASUMIR FICHA] / [INGRESO MANUAL CIP].' },
  { id: 'volumen', code: '', label: 'Cabida', folder: 2, sub: '', icon: 'Boxes', estado: 'active', tier: 'free', fases: ['PERFIL', 'ANTEPROY'], desc: 'Estudio de cabida: retiros, adosamientos (OGUC 40%), rasantes, constructibilidad y envolvente máxima edificable con esquema 3D.' },

  /* ── CARPETA 3 · PROYECTO (DISEÑO) ────────────────────────────────────────── */
  { id: 'dimensionador', code: '', label: 'Dimensionador de Proyecto', folder: 3, sub: 'Dimensionadores', icon: 'Maximize', estado: 'active', tier: 'free', fases: ['ANTEPROY', 'PROYECTO'], desc: 'Programa de recintos, % circulación y sincronía con el master del proyecto.' },
  { id: 'dim-publicos', code: '', label: 'Dimensionador Edificios Públicos', folder: 3, sub: 'Dimensionadores', icon: 'Building2', estado: 'active', tier: 'free', fases: ['ANTEPROY'], desc: 'Programa arquitectónico institucional (MDSF 2024): dotación → superficie neta y bruta por tipología, con sync de superficie al proyecto.' },
  { id: 'bim-wizard', code: '', label: 'Asistente de Usos BIM', folder: 3, sub: 'BIM', icon: 'Cpu', estado: 'active', tier: 'premium', fases: ['PROYECTO'], desc: 'Wizard de 7 pasos (Planbim/CORFO) con ficha asistida por IA.' },
  { id: 'bim-familias', code: '', label: 'Creador de Familias BIM (LOD)', folder: 3, sub: 'BIM', icon: 'Boxes', estado: 'soon', tier: 'premium', fases: ['PROYECTO'], desc: 'Componentes paramétricos por nivel de desarrollo LOD.' },
  { id: 'iso19650', code: '', label: 'Implementación ISO 19650', folder: 3, sub: 'BIM', icon: 'Layers', estado: 'soon', tier: 'premium', fases: ['PROYECTO'], desc: 'Gestión de información BIM según ISO 19650.' },

  /* ── CARPETA 4 · EXPEDIENTES DE PERMISOS ──────────────────────────────────── */
  /* a) Expediente DOM */
  { id: 'listado-dom', code: '', label: 'Listado de Documentos', folder: 4, sub: 'Expediente DOM', icon: 'ClipboardList', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Documentos y planos solicitados por la Dirección de Obras.' },
  { id: 'expediente-dom', code: '', label: 'Declaración Jurada', folder: 4, sub: 'Expediente DOM', icon: 'FileCheck', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Declaración Jurada Art. 1.2.2 y solicitud de permiso (F 2-3.1), con impresión/PDF.' },
  /* Formularios DOM llenables (data-driven · FormulariosDOMView). Visibilidad por
     'Tipo de proyecto' (OGUC) del ProjectMaster; el PDF se resuelve por tipo+trámite. */
  { id: 'solicitud-permiso', code: '', label: 'Formulario de Solicitud de Anteproyecto', folder: 4, sub: 'Expediente DOM', icon: 'FileText', estado: 'active', tier: 'free', fases: ['TRÁMITE'], tiposProyecto: ['Obra nueva', 'Ampliación mayor a 100 m²', 'Alteración', 'Reconstrucción'], desc: 'Formulario DOM llenable de Anteproyecto: páginas del PDF como fondo, campos prellenados con datos del proyecto; exporta PDF a descarga y al expediente.' },
  { id: 'permiso-edificacion', code: '', label: 'Formulario de Solicitud de Permiso de Edificación', folder: 4, sub: 'Expediente DOM', icon: 'FileText', estado: 'active', tier: 'free', fases: ['TRÁMITE'], tiposProyecto: ['Obra nueva', 'Ampliación mayor a 100 m²', 'Alteración', 'Reconstrucción', 'Reparación'], desc: 'Formulario DOM llenable de Permiso de Edificación; prellenado desde el proyecto, exporta PDF a descarga y al expediente.' },
  { id: 'modificacion-proyecto', code: '', label: 'Formulario de Solicitud de Modificación de Proyecto', folder: 4, sub: 'Expediente DOM', icon: 'FileText', estado: 'active', tier: 'free', fases: ['TRÁMITE'], tiposProyecto: ['Obra nueva', 'Ampliación mayor a 100 m²', 'Reconstrucción', 'Reparación'], desc: 'Formulario DOM llenable de Modificación de Proyecto; prellenado desde el proyecto, exporta PDF a descarga y al expediente.' },
  { id: 'dj-termino', code: '', label: 'Declaración Jurada de Término', folder: 4, sub: 'Expediente DOM', icon: 'FileText', estado: 'active', tier: 'free', fases: ['TRÁMITE'], tiposProyecto: ['Obra nueva', 'Alteración', 'Reconstrucción', 'Reparación'], desc: 'Declaración Jurada de Término de Obra llenable; prellenado desde el proyecto, exporta PDF a descarga y al expediente.' },
  { id: 'calc-minvu', code: '', label: 'Calculadora de Costos MINVU', folder: 4, sub: 'Expediente DOM', icon: 'Building2', estado: 'active', tier: 'free', fases: ['TRÁMITE', 'CONSTRUCCIÓN'], desc: 'Presupuesto base por volumen según tablas MINVU: categoriza edificación/otras construcciones, calcula costo por m² y total.' },
  { id: 'form-ine', code: '', label: 'Formulario INE', folder: 4, sub: 'Expediente DOM', icon: 'FileSpreadsheet', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Formulario estadístico del Instituto Nacional de Estadísticas.' },
  { id: 'carga-ocupacion', code: '', label: 'Calculadora Carga de Ocupación', folder: 4, sub: 'Expediente DOM', icon: 'Calculator', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Cálculo de carga de ocupación por recinto y destino (OGUC).' },
  { id: 'cuadro-superficies', code: '', label: 'Cuadro de Superficies', folder: 4, sub: 'Expediente DOM', icon: 'Table', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Cuadro normalizado de superficies del proyecto para el expediente.' },
  { id: 'recepcion-final', code: '', label: 'Formulario de Solicitud de Recepción Definitiva', folder: 4, sub: 'Expediente DOM', icon: 'FileCheck', estado: 'active', tier: 'free', fases: ['TRÁMITE'], tiposProyecto: ['Obra nueva', 'Ampliación mayor a 100 m²', 'Alteración', 'Reconstrucción', 'Reparación'], desc: 'Formulario DOM llenable de Recepción Definitiva de obras; prellenado desde el proyecto, exporta PDF a descarga y al expediente.' },
  /* b) Informes especiales */
  { id: 'accesibilidad', code: '', label: 'Memoria de Ruta Accesible', folder: 4, sub: 'Informes especiales', icon: 'Accessibility', estado: 'active', tier: 'free', fases: ['PROYECTO', 'TRÁMITE'], desc: 'Revisión de accesibilidad universal (OGUC 4.1.7): 8 grupos + SS.HH./Ducha y cálculo asistido de ancho de ruta. (Mockup Fase 0)' },
  { id: 'informe-termico', code: '', label: 'Informe Norma Térmica', folder: 4, sub: 'Informes especiales', icon: 'Thermometer', estado: 'active', tier: 'premium', fases: ['TRÁMITE'], desc: 'Envolvente térmica (Campo + Puente), U/Rt por elemento. Acreditación diferida: tablas de exigencia POR COMPLETAR. (Mockup Fase 0)' },
  { id: 'informe-fuego', code: '', label: 'Informe Resistencia al Fuego', folder: 4, sub: 'Informes especiales', icon: 'Flame', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Informe de resistencia al fuego de elementos según OGUC.' },
  { id: 'informe-suelo', code: '', label: 'Informe de Subsuelo', folder: 4, sub: 'Informes especiales', icon: 'Mountain', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Calicata, estratigrafía referencial (hasta 3 horizontes) y aptitud para edificación. (Mockup Fase 0)' },
  /* c) Expedientes Sectoriales */
  { id: 'autorizacion-sanitaria', code: '', label: 'Autorización Sanitaria Expresa (Código Sanitario)', folder: 4, sub: 'Expedientes Sectoriales', icon: 'Stethoscope', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Trámite de autorización sanitaria expresa según el Código Sanitario.' },
  { id: 'ds594', code: '', label: 'Cumplimiento DS 594', folder: 4, sub: 'Expedientes Sectoriales', icon: 'ShieldCheck', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Verificación de condiciones sanitarias y ambientales básicas (DS 594).' },
  /* d) Repositorio de antecedentes */
  // NOTA INTERNA: a futuro, selector para guardar archivos (Topografía, Mecánica de
  // Suelos, TE1, Factibilidad Eléctrica, Factibilidad Sanitaria, otros).
  { id: 'repositorio-antecedentes', code: '', label: 'Repositorio de Antecedentes', folder: 4, sub: 'Repositorio de antecedentes', icon: 'FolderArchive', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Repositorio de antecedentes del expediente (topografía, mecánica de suelos, TE1, factibilidades, otros).' },

  /* ── CARPETA 5 · CONSTRUCCIÓN ─────────────────────────────────────────────── */
  /* a) EETT, Presupuesto y Carta Gantt */
  { id: 'eett-generador', code: '', label: 'Generador de EETT', folder: 5, sub: 'EETT, Presupuesto y Carta Gantt', icon: 'ClipboardList', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Especificaciones Técnicas de arquitectura por selector guiado (NCh 1150): ensambla el documento según naturaleza, estructura y terminaciones, prellenado desde el proyecto. Exporta PDF.' },
  { id: 'presupuesto', code: '', label: 'Presupuesto de Obra', folder: 5, sub: 'EETT, Presupuesto y Carta Gantt', icon: 'DollarSign', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Itemizado de obra en UF coherente con las EETT: partidas por selector, cantidades por m², valor UF en vivo, GG/utilidades/IVA/proforma. Exporta PDF.' },
  { id: 'gantt', code: '', label: 'Carta Gantt', folder: 5, sub: 'EETT, Presupuesto y Carta Gantt', icon: 'Calendar', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Carta Gantt general por capítulos NCh 1150 (coherente con EETT y Presupuesto): plazos editables con solape, fechas y exportación a PDF.' },
  /* b) Seguimiento e ITO */
  { id: 'seguimiento', code: '', label: 'Minuta de Visita a Obra', folder: 5, sub: 'Seguimiento e ITO', icon: 'HardHat', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Registro de visitas a obra: avance, etapa y bitácora Normal / Retraso / Crítico.' },
  { id: 'libro-obras', code: '', label: 'Libro de Obras Digital', folder: 5, sub: 'Seguimiento e ITO', icon: 'Notebook', estado: 'active', tier: 'premium', fases: ['CONSTRUCCIÓN'], desc: 'Sub-libros con apertura por Acta, folios tipificados (LOD) y archivado reversible. (Mockup Fase 0)' },
  { id: 'carpeta-digital', code: '', label: 'Carpeta Digital', folder: 5, sub: 'Seguimiento e ITO', icon: 'FolderTree', estado: 'active', tier: 'premium', fases: ['CONSTRUCCIÓN'], desc: 'Repositorio documental en árbol por tipo de contrato, con versionado y archivado. (Mockup Fase 0)' },
  { id: 'rdi', code: '', label: 'Registro RDI (Requerimientos de Información)', folder: 5, sub: 'Seguimiento e ITO', icon: 'FileQuestion', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Registro de requerimientos de información (RDI): tema/subtema LOD, título, contenido, participantes y adjuntos. También es formato de entrada del Libro de Obra.' },
  { id: 'estados-pago', code: '', label: 'Revisión de Estados de Pago', folder: 5, sub: 'Seguimiento e ITO', icon: 'Receipt', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Revisión y aprobación de estados de pago de obra.' },

  /* ── CARPETA 6 · ADMINISTRATIVOS (herramientas sueltas) ───────────────────── */
  { id: 'propuesta', code: '', label: 'Propuesta de Servicios / Honorarios', folder: 6, sub: '', icon: 'FileText', estado: 'active', tier: 'free', fases: ['PERFIL', 'ADMIN'], desc: 'Propuesta de honorarios por etapas.' },
  { id: 'hsa', code: '', label: 'Calculadora de Honorarios', folder: 6, sub: '', icon: 'Calculator', estado: 'active', tier: 'free', fases: ['ADMIN', 'PERFIL'], desc: 'Cálculo de boleta: bruto/líquido con retención 15,25% editable.' },
  { id: 'contratos', code: '', label: 'Generador de Contratos', folder: 6, sub: '', icon: 'Handshake', estado: 'active', tier: 'free', fases: ['ADMIN'], desc: 'Plantillas paramétricas legales para contratistas.' },
  { id: 'cobros', code: '', label: 'Generador de Cobros', folder: 6, sub: '', icon: 'DollarSign', estado: 'soon', tier: 'free', fases: ['ADMIN'], desc: 'Gestión de cobranza y estados de cuenta.' },
  { id: 'carta-honorarios', code: '', label: 'Generador Carta de Honorarios', folder: 6, sub: '', icon: 'Mail', estado: 'soon', tier: 'free', fases: ['ADMIN'], desc: 'Generación de carta/propuesta de honorarios profesionales.' },

  /* ── CARPETA 7 · BIBLIOTECA DE RECURSOS (solo acceso por catálogo) ────────── */
  { id: 'form-municipales', code: '', label: 'Formularios MINVU (Biblioteca)', folder: 7, sub: 'Formularios oficiales', icon: 'BookOpen', estado: 'active', tier: 'free', fases: [], desc: 'Biblioteca de formularios oficiales MINVU agrupados por tipología (Obra Nueva, Ampliación, Alteración, Reconstrucción, Reparación) + OGUC, con enlaces directos a PDF.' },
  { id: 'form-seremi', code: '', label: 'Formularios SEREMI', folder: 7, sub: 'Formularios oficiales', icon: 'FileText', estado: 'soon', tier: 'free', fases: [], desc: '5 formularios SEREMI de Salud.' },
  { id: 'oguc', code: '', label: 'OGUC / LGUC', folder: 7, sub: 'Normativa técnica', icon: 'BookOpen', estado: 'soon', tier: 'free', fases: [], desc: 'Búsqueda semántica de normativa.' },
];

/** Subcategorías NO vacías presentes en una carpeta, en orden de aparición. */
export function subsOf(folderId: number): string[] {
  const seen: string[] = [];
  CATALOG.forEach((t) => {
    if (t.folder === folderId && t.sub && !seen.includes(t.sub)) seen.push(t.sub);
  });
  return seen;
}

/** Herramientas SUELTAS de una carpeta (sin subsección). */
export function looseToolsOf(folderId: number): CatalogTool[] {
  return CATALOG.filter((t) => t.folder === folderId && !t.sub);
}

export function toolById(id: string): CatalogTool | undefined {
  return CATALOG.find((t) => t.id === id);
}