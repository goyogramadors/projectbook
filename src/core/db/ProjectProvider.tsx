/* =============================================================================
   _ARCHIBOTS · PROJECT PROVIDER
   -----------------------------------------------------------------------------
   Envuelve el IProjectRepository (Cloud/Local según el plan, CONST §7) en un
   contexto de React. Carga el listado de másters livianos y expone helpers de
   vínculo de herramientas a carpetas (addedTools). NO migra local→nube.

   Sandbox automático (UX §7): si el repo local está vacío (primer acceso o
   invitado sin historial), auto-crea "Mi Primer Proyecto" de forma transparente.
   El usuario puede explorar todas las herramientas sin configuración previa.
   ============================================================================= */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  getProjectRepository, makeDefaultProject, type IProjectRepository,
} from './ProjectRepository';
import type { ProjectMaster, ToolState, ToolEstado } from '../types';

interface ProjectContextValue {
  repo: IProjectRepository;
  projects: ProjectMaster[];
  loading: boolean;
  reload: () => Promise<void>;
  getProject: (id?: string) => ProjectMaster | null;
  addTool: (projectId: string, toolId: string) => Promise<void>;
  removeTool: (projectId: string, toolId: string) => Promise<void>;
  /** Persiste estado/fecha de una herramienta en el master (S7, merge parcial). */
  setToolState: (projectId: string, toolId: string, patch: Partial<ToolState>) => Promise<void>;
  /** Crea un proyecto nuevo (Cloud si Premium, Local si Free) y devuelve su id. */
  createProject: (name: string) => Promise<string>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const repo = useMemo(() => getProjectRepository(user), [user]);
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let list = await repo.list();
      // SANDBOX AUTOMÁTICO (CONST §7): invitados y usuarios Free sin proyectos
      // reciben un proyecto por defecto de forma invisible y transparente.
      if (list.length === 0 && repo.kind === 'local' && repo.canWrite) {
        const def = makeDefaultProject();
        await repo.save(def);
        list = [def];
      }
      setProjects(list);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => { reload(); }, [reload]);

  const getProject = useCallback(
    (id?: string) => projects.find((p) => p.id === id) ?? null,
    [projects],
  );

  const mutateTools = useCallback(async (projectId: string, fn: (cur: string[]) => string[]) => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const next: ProjectMaster = { ...p, addedTools: fn(p.addedTools ?? []) };
    await repo.save(next);
    setProjects((prev) => prev.map((x) => (x.id === projectId ? next : x)));
  }, [projects, repo]);

  const setToolState = useCallback(async (projectId: string, toolId: string, patch: Partial<ToolState>) => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const prevStates = p.toolStates ?? {};
    const prev: ToolState = prevStates[toolId] ?? { estado: 'Vacío' as ToolEstado };
    const merged: ToolState = { ...prev, ...patch };
    const next: ProjectMaster = { ...p, toolStates: { ...prevStates, [toolId]: merged } };
    await repo.save(next);
    setProjects((cur) => cur.map((x) => (x.id === projectId ? next : x)));
  }, [projects, repo]);

  const createProject = useCallback(async (name: string): Promise<string> => {
    // Parte del máster por defecto y le asigna identidad e id frescos. El repo
    // decide el destino (Cloud Premium / Local Free) sin migración (CONST §7).
    const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const nuevo: ProjectMaster = {
      ...makeDefaultProject(),
      id,
      name: name.trim() || 'Nuevo Proyecto',
      ownerId: user?.uid ?? 'guest',
      propietario: user?.nombre ?? 'Invitado',
      addedTools: [],
      createdAt: undefined,
    };
    await repo.save(nuevo);
    await reload();
    return id;
  }, [repo, reload, user]);

  const value = useMemo<ProjectContextValue>(() => ({
    repo, projects, loading, reload, getProject, createProject, setToolState,
    addTool:    (pid, tid) => mutateTools(pid, (cur) => (cur.includes(tid) ? cur : [...cur, tid])),
    removeTool: (pid, tid) => mutateTools(pid, (cur) => cur.filter((x) => x !== tid)),
  }), [repo, projects, loading, reload, getProject, createProject, mutateTools, setToolState]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects debe usarse dentro de <ProjectProvider>.');
  return ctx;
}
