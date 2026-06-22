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
export interface Coordenada {
  lat: number;
  lng: number;
}

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

/** Master liviano (< 5 KB). Sin arrays de historial (van en subcolecciones). */
export interface ProjectMaster extends SuperficieModel {
  id: string;
  name: string;
  anio: string;
  propietario: string;
  rol: string;
  direccion: string;
  comuna: string;
  destino: string;
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
