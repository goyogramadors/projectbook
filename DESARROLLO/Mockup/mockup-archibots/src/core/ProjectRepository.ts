/**
 * ProjectRepository.ts — F1.4 · Estrategia Cloud/Local (Constitución §7)
 *
 * §7: Free/Invitado gestiona su único proyecto en localStorage SIN migración.
 *     Premium nace en la nube; el proyecto local queda aislado (read-only).
 * §15: Tope de 50 proyectos Premium (validado aquí + en Rules).
 * §6:  Guardar superficieCalculada Y superficieManual + superficieOrigen.
 */

import type { ProjectMaster, Plan } from './types';

// ── Constantes ────────────────────────────────────────────────────────────────

const LOCAL_KEY  = 'archibots_project_free';
const MAX_PREMIUM_PROJECTS = 50;

// ── Utilidades ────────────────────────────────────────────────────────────────

function now(): Date { return new Date(); }

function newId(): string {
  return `AB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── Adaptador localStorage (Free) ────────────────────────────────────────────

const localAdapter = {
  async get(id: string): Promise<ProjectMaster | null> {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY}_${id}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      data.createdAt = new Date(data.createdAt);
      data.updatedAt = new Date(data.updatedAt);
      return data as ProjectMaster;
    } catch { return null; }
  },

  async list(uid: string): Promise<ProjectMaster[]> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`${LOCAL_KEY}_`));
    const projects: ProjectMaster[] = [];
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (data && data.ownerId === uid) {
          data.createdAt = new Date(data.createdAt);
          data.updatedAt = new Date(data.updatedAt);
          projects.push(data as ProjectMaster);
        }
      } catch { /* ignorar entradas corruptas */ }
    }
    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  async save(project: ProjectMaster): Promise<void> {
    localStorage.setItem(`${LOCAL_KEY}_${project.id}`, JSON.stringify(project));
  },

  async delete(id: string): Promise<void> {
    localStorage.removeItem(`${LOCAL_KEY}_${id}`);
  },
};

// ── Adaptador Firestore (Premium) ─────────────────────────────────────────────

const cloudAdapter = {
  async get(id: string): Promise<ProjectMaster | null> {
    const { getDb } = await import('./firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(getDb(), 'projects', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as ProjectMaster;
  },

  async list(uid: string): Promise<ProjectMaster[]> {
    const { getDb } = await import('./firebase');
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    // Proyectos propios + donde soy colaborador (§10 memberUids)
    const [ownSnap, memberSnap] = await Promise.all([
      getDocs(query(collection(getDb(), 'projects'), where('ownerId', '==', uid), orderBy('updatedAt', 'desc'))),
      getDocs(query(collection(getDb(), 'projects'), where('memberUids', 'array-contains', uid), orderBy('updatedAt', 'desc'))),
    ]);
    const seen = new Set<string>();
    const projects: ProjectMaster[] = [];
    for (const snap of [...ownSnap.docs, ...memberSnap.docs]) {
      if (seen.has(snap.id)) continue;
      seen.add(snap.id);
      const d = snap.data();
      projects.push({ ...d, id: snap.id, createdAt: d.createdAt?.toDate?.() ?? new Date(), updatedAt: d.updatedAt?.toDate?.() ?? new Date() } as ProjectMaster);
    }
    return projects;
  },

  async save(project: ProjectMaster): Promise<void> {
    const { getDb } = await import('./firebase');
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(getDb(), 'projects', project.id), {
      ...project,
      updatedAt: serverTimestamp(),
      createdAt: project.createdAt ?? serverTimestamp(),
    }, { merge: true });
  },

  async delete(id: string): Promise<void> {
    const { getDb } = await import('./firebase');
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(getDb(), 'projects', id));
    // Cloud Function `onProjectDeleted` maneja la cascade (F5.2)
  },

  async count(uid: string): Promise<number> {
    const { getDb } = await import('./firebase');
    const { collection, query, where, getCountFromServer } = await import('firebase/firestore');
    const snap = await getCountFromServer(
      query(collection(getDb(), 'projects'), where('ownerId', '==', uid))
    );
    return snap.data().count;
  },
};

// ── API pública ───────────────────────────────────────────────────────────────

export class ProjectRepository {
  private uid: string;
  private plan: Plan;

  constructor(uid: string, plan: Plan) {
    this.uid  = uid;
    this.plan = plan;
  }

  private get adapter() {
    return this.plan === 'premium' ? cloudAdapter : localAdapter;
  }

  async getProject(id: string): Promise<ProjectMaster | null> {
    return this.adapter.get(id);
  }

  async listProjects(): Promise<ProjectMaster[]> {
    return this.adapter.list(this.uid);
  }

  async createProject(partial: Partial<ProjectMaster>): Promise<ProjectMaster> {
    // §15: tope de 50 proyectos Premium
    if (this.plan === 'premium') {
      const count = await cloudAdapter.count(this.uid);
      if (count >= MAX_PREMIUM_PROJECTS) {
        throw new Error(`Límite de ${MAX_PREMIUM_PROJECTS} proyectos Premium alcanzado.`);
      }
    }

    const project: ProjectMaster = {
      id:                  partial.id ?? newId(),
      ownerId:             this.uid,
      name:                partial.name ?? 'Nuevo Proyecto',
      destino:             partial.destino ?? '',
      etapa:               partial.etapa ?? 'Perfil',
      rol:                 partial.rol ?? '',
      region:              partial.region ?? '',
      comuna:              partial.comuna ?? '',
      direccion:           partial.direccion ?? '',
      superficieOrigen:    'NINGUNO',
      memberUids:          [],
      members:             {},
      storageStrategy:     this.plan === 'premium' ? 'cloud' : 'local',
      createdAt:           now(),
      updatedAt:           now(),
      ...partial,
    };

    await this.adapter.save(project);
    return project;
  }

  /** §6: actualiza superficies sin borrar el otro valor */
  async updateSuperficies(
    id: string,
    tipo: 'DIMENSIONADOR' | 'MANUAL',
    valor: number,
  ): Promise<void> {
    const project = await this.getProject(id);
    if (!project) throw new Error(`Proyecto ${id} no encontrado`);

    const updated: ProjectMaster = {
      ...project,
      updatedAt: now(),
      ...(tipo === 'DIMENSIONADOR'
        ? { superficieCalculada: valor, superficieOrigen: 'DIMENSIONADOR' }
        : { superficieManual:    valor, superficieOrigen: 'MANUAL' }),
    };
    await this.adapter.save(updated);
  }

  async updateProject(id: string, partial: Partial<ProjectMaster>): Promise<void> {
    const project = await this.getProject(id);
    if (!project) throw new Error(`Proyecto ${id} no encontrado`);
    await this.adapter.save({ ...project, ...partial, id, updatedAt: now() });
  }

  async deleteProject(id: string): Promise<void> {
    await this.adapter.delete(id);
  }
}
