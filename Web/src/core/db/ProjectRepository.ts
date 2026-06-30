/* =============================================================================
   _ARCHIBOTS · PROJECT REPOSITORY (F1.4) — Estrategia Cloud / Local
   -----------------------------------------------------------------------------
   ⟲ CONSTITUCIÓN §7 (regla irrevocable):
     · Usuarios Free / Invitados gestionan su ÚNICO proyecto en localStorage.
     · NO existe lógica de migración automática local->Firestore al hacer upgrade.
     · Al pasar a Premium, los proyectos NUEVOS nacen en la nube; el proyecto
       local queda AISLADO (esta clase lo expone read-only, jamás lo sube).
   El máster es liviano (< 5 KB). Las subcolecciones pesadas (formularios/,
   simulaciones/) se leen bajo demanda por otros servicios, no aquí.

   DEFAULT_PROJECT_ID / makeDefaultProject — sandbox para invitados (UX §7):
     El ProjectProvider auto-crea este proyecto si el repo local está vacío.
     El usuario explora todas las herramientas sin fricción desde el primer click.
   ============================================================================= */

import {
  doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { ProjectMaster, User } from '../types';

const LOCAL_KEY = 'archibots:project:local';
/** Tope duro Premium validado en frontend (CONST §15). También va en Rules. */
export const MAX_PREMIUM_PROJECTS = 50;
/** Tope de proyectos para usuarios Free LOGUEADOS (ahora también en la nube). */
export const MAX_FREE_PROJECTS = 5;

/** ID fijo del proyecto sandbox para invitados (CONST §7). */
export const DEFAULT_PROJECT_ID = 'archibots-sandbox';

/** Proyecto por defecto para invitados — se persiste en localStorage de forma
 *  invisible al primer acceso. El usuario puede editar todos sus campos. */
export function makeDefaultProject(): ProjectMaster {
  return {
    id:                      DEFAULT_PROJECT_ID,
    name:                    'Mi Primer Proyecto',
    anio:                    String(new Date().getFullYear()),
    propietario:             'Invitado',
    rol:                     '000-00',
    direccion:               '',
    comuna:                  '',
    destino:                 'Habitacional',
    etapa:                   'Perfil',
    presupuestoUF:           '',
    ownerId:                 'guest',
    members:                 {},
    addedTools:              [],
    superficieTerrenoLegal:  '',
    superficieCalculada:     '',
    superficieManual:        '',
    superficieOrigen:        'DIMENSIONADOR',
  };
}

export interface IProjectRepository {
  readonly kind: 'cloud' | 'local';
  list(): Promise<ProjectMaster[]>;
  get(projectId: string): Promise<ProjectMaster | null>;
  save(project: ProjectMaster): Promise<void>;
  remove(projectId: string): Promise<void>;
  readonly canWrite: boolean;
}

/* LOCAL (Free / Invitado) — un único proyecto en localStorage. CONST §7: sin migración. */
export class LocalProjectRepository implements IProjectRepository {
  readonly kind = 'local' as const;
  constructor(readonly canWrite: boolean = true) {}

  static readonly(): LocalProjectRepository {
    return new LocalProjectRepository(false);
  }

  private read(): ProjectMaster | null {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as ProjectMaster) : null;
    } catch {
      return null;
    }
  }

  async list(): Promise<ProjectMaster[]> {
    const p = this.read();
    return p ? [p] : [];
  }

  async get(projectId: string): Promise<ProjectMaster | null> {
    const p = this.read();
    return p && p.id === projectId ? p : null;
  }

  async save(project: ProjectMaster): Promise<void> {
    if (!this.canWrite) {
      throw new Error('Proyecto local aislado (read-only tras upgrade, CONST §7).');
    }
    const now = Date.now();
    const next: ProjectMaster = {
      ...project,
      createdAt: project.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  }

  async remove(projectId: string): Promise<void> {
    const p = this.read();
    if (p && p.id === projectId) localStorage.removeItem(LOCAL_KEY);
  }
}

/* CLOUD (Premium) — Firestore projects/{id}. Lista por ownerId + members (CONST §10). */
export class CloudProjectRepository implements IProjectRepository {
  readonly kind = 'cloud' as const;
  readonly canWrite = true;
  /** Tope de proyectos según plan del dueño (Free=5 · Premium=50). */
  private readonly maxProjects: number;
  constructor(private readonly uid: string, isPremium: boolean = true) {
    this.maxProjects = isPremium ? MAX_PREMIUM_PROJECTS : MAX_FREE_PROJECTS;
  }

  async list(): Promise<ProjectMaster[]> {
    const col = collection(db, 'projects');
    const [own, shared] = await Promise.all([
      getDocs(query(col, where('ownerId', '==', this.uid))),
      getDocs(query(col, where(`members.${this.uid}`, 'in', ['editor', 'viewer']))),
    ]);
    const map = new Map<string, ProjectMaster>();
    [...own.docs, ...shared.docs].forEach((d) => map.set(d.id, d.data() as ProjectMaster));
    return [...map.values()];
  }

  async get(projectId: string): Promise<ProjectMaster | null> {
    const snap = await getDoc(doc(db, 'projects', projectId));
    return snap.exists() ? (snap.data() as ProjectMaster) : null;
  }

  async save(project: ProjectMaster): Promise<void> {
    const isNew = !project.createdAt;
    if (isNew) {
      const mine = await getDocs(
        query(collection(db, 'projects'), where('ownerId', '==', this.uid)),
      );
      if (mine.size >= this.maxProjects) {
        throw new Error(`Tope de ${this.maxProjects} proyectos alcanzado para tu plan (CONST §15).`);
      }
    }
    await setDoc(
      doc(db, 'projects', project.id),
      {
        ...project,
        // ownerId AUTORITATIVO: en creación se fija el uid del usuario autenticado VIVO
        // (auth.currentUser), garantizando que la regla `ownerId == uid()` pase y que el
        // proyecto NUNCA nazca huérfano; en updates se preserva el dueño existente.
        ownerId: isNew ? (auth.currentUser?.uid ?? this.uid) : (project.ownerId || this.uid),
        updatedAt: serverTimestamp(),
        // Solo en creación: fecha de alta server-authoritative. Evita que la query de
        // conteo (isNew) corra en cada guardado y da orden estable al historial.
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true },
    );
  }

  async remove(projectId: string): Promise<void> {
    // El borrado en cascada de subcolecciones lo ejecuta la CF onProjectDeleted (H4).
    await deleteDoc(doc(db, 'projects', projectId));
  }
}

/* FACTORY — selecciona la estrategia según la identidad. CONST §7: NO migra. */
export function getProjectRepository(user: User | null): IProjectRepository {
  // ⟲ 2026-06-30: TODO usuario LOGUEADO (Free o Premium) persiste en la NUBE.
  // El almacenamiento LOCAL queda solo para invitados/no logueados (sandbox).
  if (user) return new CloudProjectRepository(user.uid, user.plan === 'Premium');
  return new LocalProjectRepository(true);
}
