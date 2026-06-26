/* =============================================================================
   _ARCHIBOTS · CONTRATOS CENTRALES (Restricción Arquitectónica §3)
   -----------------------------------------------------------------------------
   Única fuente de verdad de tipos para TODA la SPA. Ninguna interfaz de dominio
   debe declararse fuera de este archivo. Refleja la Constitución (v1.5) y la
   ingeniería inversa del Mockup funcional (App.tsx / archibots.css).
   ============================================================================= */

import type React from 'react';

/* THEMING (CONST §1) */
export const THEMES = ['cad', 'washi', 'matrix', 'white'] as const;
export type Theme = (typeof THEMES)[number];

export interface ThemeState {
  theme: Theme;
  cycleTheme: () => void;
  setTheme: (t: Theme) => void;
}

/* PLAN / SaaS (CONST §3/§11/§14) */
export type Plan = 'Free' | 'Premium';
export type AccessMode = 'edit' | 'read' | 'locked';

/* COLABORACIÓN (CONST §10) */
export type MemberRole = 'editor' | 'viewer';
export interface Collaborator {
  id: string;
  email: string;
  rol: 'Editor' | 'Lector';
}

/* USUARIO */
export interface User {
  uid: string;
  email: string | null;
  nombre: string;
  plan: Plan;
  compPremium?: boolean;
  isAdmin: boolean;
  estado?: 'Activo' | 'Suspendido';
  theme?: Theme;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, nombre?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Controla el AuthModal de forma global (invocable desde cualquier componente). */
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

/* CEREBRO NORMATIVO (GEO ESPACIAL) */
export interface NormativaPRC {
  alturaMaxima: string | number;
  constructibilidad: string | number;
  coeficienteOcupacion: string | number;
  sistemaAgrupamiento: string;
  [key: string]: any; // Propiedad indexada para permitir campos adicionales
}

/* MODELO DE SUPERFICIES (CONST §6) */
export type SuperficieOrigen = 'DIMENSIONADOR' | 'MANUAL';

export interface SuperficieModel {
  /** Legal/escritura, escrita por el usuario. Visible en la Ficha. */
  superficieTerrenoLegal: string;
  /** Valor producido por el Dimensionador (T-14). Interno, NUNCA se borra. */
  superficieCalculada: string;
  /** Valor escrito a mano por el usuario. Interno, NUNCA se borra. */
  superficieManual: string;
  /** Bandera: decide cuál de los dos anteriores se muestra. */
  superficieOrigen: SuperficieOrigen;
}

/* PROYECTO */
export type Etapa =
  | 'Perfil' | 'Anteproyecto' | 'Proyecto' | 'Licitación' | 'Obra' | 'Recepción';

/* ESTADO POR HERRAMIENTA (S7 · avance del expediente persistido)
   Mapa liviano {toolId: ToolState} en el master. Convive con `addedTools: string[]`
   sin romperlo: si `toolStates` es undefined, todas las herramientas son 'Vacío'. */
export type ToolEstado = 'Vacío' | 'En proceso' | 'Completado';
export interface ToolState {
  estado: ToolEstado;
  /** Fecha del último guardado en formato dd-mm-aaaa. */
  fecha?: string;
}

/** Tipo de proyecto (OGUC) — decide qué formularios municipales corresponden. */
export type TipoProyecto =
  | 'Obra nueva'
  | 'Ampliación mayor a 100 m²'
  | 'Alteración'
  | 'Reconstrucción'
  | 'Reparación';

export const TIPOS_PROYECTO: TipoProyecto[] = [
  'Obra nueva', 'Ampliación mayor a 100 m²', 'Alteración', 'Reconstrucción', 'Reparación',
];

/** Master liviano (< 5 KB). Sin arrays de historial (van en subcolecciones). */
export interface ProjectMaster extends SuperficieModel {
  id: string;
  name: string;
  anio: string;
  propietario: string;
  rol: string;
  direccion: string;
  comuna: string;
  /** Región (no manual): derivada de la comuna / geocode en UbicacionView. */
  region?: string;
  /** Ciudad/localidad (no manual): del geocode en UbicacionView; fallback comuna. */
  ciudad?: string;
  destino: string;
  /** Tipo de proyecto (OGUC). Determina los formularios DOM visibles. */
  tipoProyecto?: TipoProyecto;
  etapa: Etapa | string;
  presupuestoUF: string;
  fotoUrl?: string;
  ownerId: string;
  members: Record<string, MemberRole>;
  addedTools?: string[];
  /** Estado/fecha por herramienta agregada (S7). Opcional: ausente ⇒ todo 'Vacío'. */
  toolStates?: Record<string, ToolState>;
  createdAt?: number;
  updatedAt?: number;
  simulacionesCount?: number;
  formulariosCount?: number;
}

/** Valor DERIVADO de superficie a renderizar en la Ficha (CONST §6). */
export function superficieProyecto(p: SuperficieModel): string {
  return p.superficieOrigen === 'MANUAL' ? p.superficieManual : p.superficieCalculada;
}

/* CATÁLOGO / HERRAMIENTAS */
export type Estado = 'active' | 'soon' | 'archived';
export type Tier = 'free' | 'premium';
export type CarpetaId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Fase =
  | 'PERFIL' | 'ANTEPROY' | 'PROYECTO' | 'TRÁMITE' | 'CONSTRUCCIÓN' | 'ADMIN';

export interface Folder {
  id: CarpetaId;
  name: string;
  short: string;
  icon: string;
}

export interface CatalogTool {
  id: string;
  code: string;
  label: string;
  folder: CarpetaId;
  sub: string;
  icon: string;
  estado: Estado;
  tier: Tier;
  fases: Fase[];
  desc: string;
  /** Si está definido, la tool solo se muestra para estos tipos de proyecto (OGUC). */
  tiposProyecto?: TipoProyecto[];
}

/** Contrato del registro de herramientas (PLAN §1.3 / §5.5). */
export interface ToolManifest extends CatalogTool {
  component?: React.LazyExoticComponent<React.ComponentType<ToolProps>>;
}

/** Props inyectadas a TODA vista de herramienta montada en el ToolHost. */
export interface ToolProps {
  projectId?: string;
  access?: AccessMode;
}

/* TOP TOOLS (CONST §2) */
export interface TopToolsConfig {
  ids: string[];
}

/* UI / Toast */
export interface ToastApi {
  toast: string | null;
  triggerToast: (msg: string) => void;
}

/* =============================================================================
   DOMINIO · 5 HERRAMIENTAS NUEVAS (Tarea Especial · mockups DESARROLLO/)
   -----------------------------------------------------------------------------
   Contratos centralizados (Restricción §3 — única fuente de tipos). Persistencia:
   · informe-suelo · accesibilidad · informe-termico → useToolData (toolData/{id})
   · libro-obras    → projects/{pid}/libroObras/state   (subcolección propia)
   · carpeta-digital→ projects/{pid}/carpetaDigital/state (subcolección propia)
   Datos comunes reutilizados: ProjectMaster (name/comuna/dirección), toolStates (S7).
   ============================================================================= */

/* Informe de Subsuelo (informe-suelo · free) */
export interface Horizonte { tipo: string; espesor: string; }
export interface InformeSubsuelo {
  profCalicata: string;
  horizontes: Horizonte[];
  agua: string;
  apto: string;
  observaciones: string;
  mitigacion: string;
}

/* Memoria de Ruta Accesible (accesibilidad · free) */
export type RutaEstado3 = 'cumple' | 'no-cumple' | 'no-aplica';
export interface MemoriaRutaAccesible {
  superficie: string;
  carga: string;
  estados: Record<string, RutaEstado3>;
  est31: string;
  vias: string;
  anchoDecl: string;
  shhGeneral: 'Aplica' | 'No aplica';
  shhEst: Record<number, RutaEstado3>;
  duchaGeneral: 'Aplica' | 'No aplica';
  duchaEst: Record<number, RutaEstado3>;
  conclusion: string;
  generalidades: string;
}

/* Informe Norma Térmica (informe-termico · premium · acreditación diferida) */
export type TermicoElemento = 'techo' | 'muro' | 'piso';
export interface TermicoCapa { matId: string; espMm: string; }
export interface TermicoComplejo {
  capas: TermicoCapa[];
  capaReemplazada: number;
  estructuraId: string;
  fraccion: string;
}
/** Inputs de acreditación adicionales (opcionales: estado previo no los traía). */
export interface TermicoSobrecimiento { aplica: boolean; matId: string; espMm: string; }
export interface InformeTermico {
  comuna: string;
  zonaManual: string;
  complejos: Record<TermicoElemento, TermicoComplejo>;
  /** Sobrecimiento (R100). Opcional para compatibilidad con datos persistidos antes. */
  sobrecim?: TermicoSobrecimiento;
  /** U de la puerta opaca (ficha DITEC), W/m²K, como texto editable. Opcional. */
  puertaU?: string;
}

/* Obra Digital · adjunto real en Storage (UUID) — compartido Libro/Carpeta */
export interface ObraAdjunto {
  uuid: string; name: string; size: number; type: string; url: string; path: string;
}

/* Obra Digital · Libro de Obras (libro-obras · premium · subcolección libroObras) */
export type LibroNivel = 'sin' | 'lectura' | 'escritura' | 'edicion';
export type LibroFormatoId = 'comunicacion' | 'incidente' | 'ejecutivo' | 'libre' | 'rdi';
export type LibroEstadoFolio = 'activo' | 'archivado';
export interface LibroFolio {
  folio: string; fecha: string; libroId: string; formato: LibroFormatoId; incid: boolean;
  tema: string; subtema: string; texto: string;
  vinc: string[]; participantes: string[];
  /** Adjuntos reales (Storage UUID). Legado: pudo ser string[] de nombres → se migra. */
  adjuntos: ObraAdjunto[];
  estado: LibroEstadoFolio; apertura: boolean;
}
export interface LibroObra { id: string; nombre: string; tipo: string; abierto: boolean; aperturaFecha?: string; }
export interface LibroObrasState {
  libros: LibroObra[];
  folios: LibroFolio[];
  seq: number;
  perms: Record<string, LibroNivel>;
}

/* Obra Digital · Carpeta Digital (carpeta-digital · premium · subcolección carpetaDigital) */
export type CarpetaEstadoArch = 'activo' | 'archivado';
export interface CarpetaArchivo {
  id: number; folderN: string; tipoDoc: string; version: number; fecha: string; estado: CarpetaEstadoArch;
  /** Adjunto real (Storage UUID). Opcional: el metadato puede registrarse sin binario. */
  adjunto?: ObraAdjunto;
}
export interface CarpetaDigitalState {
  iniciado: boolean;
  contratoKey: string;
  archivos: CarpetaArchivo[];
  seq: number;
  perms: Record<string, LibroNivel>;
}
/* fin contratos Obra Digital */

/* ── DOM-Formularios (formularios municipales llenables, data-driven) ───────── */
export type FormFieldType = 'text' | 'check' | 'choice' | 'radioGroup';

export interface FormFieldOption {
  label: string;
  acro: string;
  value: string;
}

export interface FormField {
  id: string;
  acro: string | null;
  page: number;
  rectPt: [number, number, number, number];
  type: FormFieldType;
  bind: string | null;
  default: string;
  transform: string | null;
  options?: FormFieldOption[];
}

export interface FormFieldMap {
  formId: string;
  titulo: string;
  pdf: string;
  pageSizePt: { w: number; h: number };
  pages: number;
  images: string[];
  hasAcroForm: boolean;
  fields: FormField[];
}

export type FormValues = Record<string, string>;

export interface FormulariosDOMState {
  forms: Record<string, { values: FormValues; updatedAt: number }>;
  adjuntos?: Array<{ uuid: string; formId: string; nombre: string; url: string; fecha: string }>;
}
/* fin DOM-Formularios */
