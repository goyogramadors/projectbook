/**
 * useDimensionadorSync.ts — F4.6 · Sincronización Dimensionador ↔ ProjectMaster (§6)
 *
 * Proporciona el callback `onUpdateMaster` listo para pasar a DimensionadorView.
 * Cuando el usuario guarda el programa de recintos:
 *   1. Llama ProjectRepository.updateSuperficies con tipo='DIMENSIONADOR'
 *   2. Esto preserva superficieManual (§6: "no borrar el otro campo")
 *   3. Fallback: log de consola si Firebase no está configurado (mockup mode)
 *
 * Uso desde App.tsx:
 *   const { onUpdateMaster } = useDimensionadorSync(activeProjectId, plan);
 *   <DimensionadorView onUpdateMaster={onUpdateMaster} triggerToast={triggerToast} />
 */

import { useState, useCallback } from 'react';

// ── Tipos compartidos con DimensionadorView ───────────────────────────────────

interface UseSync {
  onUpdateMaster: (programa: any[], circulacion: number, superficie: string) => Promise<void>;
  syncing: boolean;
  lastSync: Date | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @param projectId  ID del proyecto activo (puede ser null en modo home)
 * @param plan       Plan del usuario: 'free' | 'premium' | 'Premium' | 'Free'
 */
export function useDimensionadorSync(
  projectId: string | null,
  plan: string
): UseSync {
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const onUpdateMaster = useCallback(async (
    programa: any[],
    circulacion: number,
    superficie: string
  ): Promise<void> => {
    if (!projectId) return;

    const superficieNum = parseFloat(superficie.replace(/[.,]/g, '')) || 0;
    setSyncing(true);

    try {
      // Importar ProjectRepository dinámicamente para preservar mockup fallback
      const { ProjectRepository } = await import('../core/ProjectRepository');
      const normalizedPlan = plan.toLowerCase() as 'free' | 'premium';
      const repo = new ProjectRepository(
        'mock-uid',   // será reemplazado por AuthProvider.user.uid en producción
        normalizedPlan
      );
      await repo.updateSuperficies(projectId, 'DIMENSIONADOR', superficieNum);
      setLastSync(new Date());
      console.info(`[DimensionadorSync] Proyecto ${projectId} → superficieCalculada=${superficieNum} m²`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Firebase no configurado') || msg.includes('firestore')) {
        // Mockup mode: sólo loguear, no propagar error al usuario
        console.info(`[DimensionadorSync] Mock — superficieCalculada=${superficieNum} m² (programa: ${programa.length} recintos, circulación: ${circulacion}%)`);
        setLastSync(new Date());
      } else {
        console.warn('[DimensionadorSync] Error al sincronizar:', msg);
        throw err; // Propagar errores inesperados para que DimensionadorView muestre toast
      }
    } finally {
      setSyncing(false);
    }
  }, [projectId, plan]);

  return { onUpdateMaster, syncing, lastSync };
}

// ── useTerrenoSync ────────────────────────────────────────────────────────────

interface UseTerrenoSync {
  onSaveTerreno: (poligono: [number, number][], areaM2: number) => Promise<void>;
  saving: boolean;
}

/**
 * Hook equivalente para MapaTerrenoView.
 * Guarda el polígono como superficieManual en el master §6.
 */
export function useTerrenoSync(
  projectId: string | null,
  plan: string
): UseTerrenoSync {
  const [saving, setSaving] = useState(false);

  const onSaveTerreno = useCallback(async (
    _poligono: [number, number][],
    areaM2: number
  ): Promise<void> => {
    if (!projectId) return;
    setSaving(true);
    try {
      const { ProjectRepository } = await import('../core/ProjectRepository');
      const normalizedPlan = plan.toLowerCase() as 'free' | 'premium';
      const repo = new ProjectRepository('mock-uid', normalizedPlan);
      await repo.updateSuperficies(projectId, 'MANUAL', areaM2);
      console.info(`[TerrenoSync] Proyecto ${projectId} → superficieManual=${areaM2} m²`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Firebase no configurado')) {
        console.info(`[TerrenoSync] Mock — superficieManual=${areaM2} m²`);
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
    }
  }, [projectId, plan]);

  return { onSaveTerreno, saving };
}
