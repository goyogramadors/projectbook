/* =============================================================================
   useToolData.ts — PERSISTENCIA GOBERNADA DE DATOS DE HERRAMIENTA (H-09)
   -----------------------------------------------------------------------------
   Fuente única para cargar/guardar el estado privado de una herramienta. Elimina
   el boilerplate duplicado (load/save de localStorage + Firestore ad-hoc) que hoy
   se repite en ~12 tools. Respeta la bifurcación de persistencia del proyecto:

     · Premium  (repo.kind === 'cloud') → Firestore: projects/{projectId}/toolData/{toolId}
     · Free     (repo.kind === 'local') → localStorage: `ab-{toolId}-{projectId}`

   Degradación robusta: si la escritura/lectura en la nube falla (offline o reglas),
   cae a localStorage —mismo patrón ya establecido en el repo— para no perder el
   trabajo del usuario. La clave local es retro-compatible con las herramientas
   actuales (p. ej. `ab-datos-proyecto-{pid}`), por lo que no migra datos previos.

   Estricto (strict + noUncheckedIndexedAccess): sin `any`, T acotado a objeto.
   ============================================================================= */
import {
  useCallback, useEffect, useRef, useState,
  type Dispatch, type SetStateAction,
} from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';

/** Clave canónica de localStorage para los datos de una herramienta. */
export function toolDataKey(toolId: string, projectId: string): string {
  return `ab-${toolId}-${projectId}`;
}

export interface ToolDataApi<T> {
  /** Valor actual (hidratado desde nube/local, o el `fallback` mientras carga). */
  data: T;
  /** Actualiza el valor en memoria (no persiste hasta llamar a `save`). */
  setData: Dispatch<SetStateAction<T>>;
  /** Persiste el valor indicado (o el actual si se omite). `true` si persistió. */
  save: (value?: T) => Promise<boolean>;
  /** `true` mientras hidrata por primera vez (relevante en la rama nube). */
  loading: boolean;
}

/** Mezcla segura del payload deserializado sobre el fallback (preserva claves nuevas). */
function mergeFallback<T extends object>(fallback: T, partial: Partial<T> | undefined): T {
  return { ...fallback, ...(partial ?? {}) } as T;
}

/** Lee y deserializa el valor desde localStorage; ante error o ausencia, el fallback. */
function readLocal<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return mergeFallback(fallback, JSON.parse(raw) as Partial<T>);
  } catch {
    return fallback;
  }
}

/**
 * Hook de persistencia de datos de una herramienta.
 *
 * @param toolId    id de la herramienta (debe coincidir con el del catálogo).
 * @param projectId id del proyecto activo; si es `undefined`, el hook opera en
 *                  modo inerte (data = fallback, `save` devuelve `false`).
 * @param fallback  valor por defecto / forma del estado. Debe ser una CONSTANTE
 *                  estable del módulo de la herramienta (no recrear en cada render).
 */
export function useToolData<T extends object>(
  toolId: string,
  projectId: string | undefined,
  fallback: T,
): ToolDataApi<T> {
  const { repo } = useProjects();
  const isCloud = repo.kind === 'cloud';

  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(Boolean(projectId));

  // Espejo del último valor para que `save()` no dependa de `data` (evita recrear
  // la callback en cada tecla y elimina lecturas obsoletas de closure).
  const dataRef = useRef<T>(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Hidratación: nube (Premium) → local (fallback). Maneja projectId === undefined.
  useEffect(() => {
    let alive = true;

    if (!projectId) {
      setData(fallback);
      setLoading(false);
      return;
    }

    const key = toolDataKey(toolId, projectId);
    setLoading(true);

    void (async () => {
      if (isCloud) {
        try {
          const snap = await getDoc(doc(db, 'projects', projectId, 'toolData', toolId));
          if (alive && snap.exists()) {
            const payload = (snap.data() as { payload?: Partial<T> }).payload;
            setData(mergeFallback(fallback, payload));
            setLoading(false);
            return;
          }
        } catch {
          /* offline / reglas → degrada a local (patrón establecido en el repo). */
        }
      }
      if (alive) {
        setData(readLocal(key, fallback));
        setLoading(false);
      }
    })();

    return () => { alive = false; };
    // `fallback` se excluye a propósito: es una constante estable del módulo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, projectId, isCloud]);

  const save = useCallback(async (value?: T): Promise<boolean> => {
    if (!projectId) return false;
    const payload = value ?? dataRef.current;
    if (value !== undefined) setData(value);

    if (isCloud) {
      try {
        await setDoc(
          doc(db, 'projects', projectId, 'toolData', toolId),
          { payload, updatedAt: serverTimestamp() },
          { merge: true },
        );
        return true;
      } catch {
        /* reglas / offline: degrada a local para no perder el trabajo del usuario. */
      }
    }

    try {
      localStorage.setItem(toolDataKey(toolId, projectId), JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, [toolId, projectId, isCloud]);

  return { data, setData, save, loading };
}
