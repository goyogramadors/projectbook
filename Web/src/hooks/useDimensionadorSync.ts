/* =============================================================================
   useDimensionadorSync.ts — SINCRONÍA DE SUPERFICIE CON EL MASTER (CONST §6)
   -----------------------------------------------------------------------------
   Hook reutilizable: escribe la superficie calculada (por el Dimensionador T-14 o
   por el Mapa de Terreno T-08) al ProjectMaster activo, fijando superficieCalculada
   y superficieOrigen='DIMENSIONADOR'. NUNCA toca superficieManual (CONST §6: ambos
   valores coexisten; la bandera de origen decide cuál muestra la Ficha).
   ============================================================================= */
import { useCallback } from 'react';
import { useProjects } from '../core/db/ProjectProvider';
import type { ProjectMaster, SuperficieOrigen } from '../core/types';

export interface DimensionadorSyncApi {
  /** Escribe la superficie (m², string) al master. Devuelve true si persistió. */
  syncSuperficie: (projectId: string | undefined, m2: number | string, origen?: SuperficieOrigen) => Promise<boolean>;
}

export function useDimensionadorSync(): DimensionadorSyncApi {
  const { getProject, repo, reload } = useProjects();

  const syncSuperficie = useCallback<DimensionadorSyncApi['syncSuperficie']>(
    async (projectId, m2, origen = 'DIMENSIONADOR') => {
      const project = getProject(projectId);
      if (!project) return false;
      const valor = typeof m2 === 'number' ? m2.toFixed(1) : String(m2);
      const updated: ProjectMaster = { ...project, superficieCalculada: valor, superficieOrigen: origen };
      await repo.save(updated);
      await reload();
      return true;
    },
    [getProject, repo, reload],
  );

  return { syncSuperficie };
}
