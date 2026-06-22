/**
 * types.ts — Tipos canónicos compartidos por toda la app (F1.2)
 * Fuente de la verdad para ProjectMaster, User, Plan, Roles, etc.
 * Toda importación de tipos usa `import type { ... }` para no romper el ESM nativo de Vite.
 */

// ── Planes y roles ────────────────────────────────────────────────────────────

export type Plan = 'free' | 'premium';
export type MemberRole = 'editor' | 'viewer';
export type AccessLevel = 'edit' | 'read' | 'locked';
export type ProjectEtapa =
  | 'Perfil' | 'Prefactibilidad' | 'Anteproyecto'
  | 'Proyecto' | 'Ejecución' | 'Recepción' | 'Archivado';

// ── Usuario ───────────────────────────────────────────────────────────────────

export interface ArchibotsUser {
  uid: string;
  email: string;
  nombre: string;
  plan: Plan;
  compPremium: boolean;   // §14 — cortesía admin, sin pasar por Stripe
  theme?: string;
  photoURL?: string;
  estado: 'activo' | 'suspendido';
  createdAt: Date;
}

// ── Proyecto ──────────────────────────────────────────────────────────────────

/** Master liviano (<5 KB) — se carga al entrar a /p/:projectId */
export interface ProjectMaster {
  id: string;
  ownerId: string;
  name: string;
  destino: string;       // uso de suelo / destino del inmueble
  etapa: ProjectEtapa;
  rol: string;           // Rol SII
  region: string;
  comuna: string;
  direccion: string;
  /** Coordenadas del predio */
  lat?: number;
  lng?: number;
  /** §6 — Superficies duales */
  superficieCalculada?: number;
  superficieManual?: number;
  superficieOrigen?: 'DIMENSIONADOR' | 'MANUAL' | 'NINGUNO';
  /** Colaboración */
  memberUids: string[];                      // array para query array-contains
  members: Record<string, MemberRole>;       // mapa uid → rol para Rules
  /** Metadatos */
  createdAt: Date;
  updatedAt: Date;
  /** ⬜ Premium: el proyecto vive en Firestore; Free: en localStorage */
  storageStrategy: 'cloud' | 'local';
}

// ── Normativa PRC ─────────────────────────────────────────────────────────────

export interface NormativaPRC {
  id: string;                   // clave Maestra: "{codigoRegion}_PRC_{comuna}_{zona}"
  comuna: string;
  zona: string;
  usos: string[];
  constructibilidad: number;    // coeficiente
  ocupacion: number;            // % del suelo
  alturaMax: number;            // pisos
  rasante: number;              // grados o metros
  distanciamientoFrontal: number;
  distanciamientoLateral: number;
  distanciamientoFondo: number;
  raw?: Record<string, unknown>; // campos adicionales según la ordenanza
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export type TipoFeedback = 'sugerencia' | 'error' | 'elogio' | 'otro';

export interface FeedbackDoc {
  email: string;
  mensaje: string;
  tipo: TipoFeedback | string;
  satisfaccion?: number;
  timestamp: Date;
  app: 'archibots';
  origen: string;
}

// ── Biblioteca ────────────────────────────────────────────────────────────────

export interface BibliotecaItem {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'formulario' | 'guia' | 'normativa' | 'template';
  tags: string[];
  downloadUrl: string;
  fileSize?: string;
  updatedAt: Date;
}

// ── Worker messages ───────────────────────────────────────────────────────────

export interface GeoWorkerRequest {
  type: 'PUNTO_EN_ZONA';
  id: string;           // para correlación
  lat: number;
  lng: number;
  geojson: GeoJSON.FeatureCollection;
}

export interface GeoWorkerResponse {
  type: 'ZONA_ENCONTRADA' | 'ZONA_NO_ENCONTRADA' | 'ERROR';
  id: string;
  zona?: string;
  properties?: Record<string, unknown>;
  error?: string;
}
