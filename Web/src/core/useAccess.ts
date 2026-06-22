/* =============================================================================
   useAccess.ts — GATING DE ACCESO A HERRAMIENTAS (CONST §2/§10/§11/§14)
   -----------------------------------------------------------------------------
   Deriva el AccessMode de una herramienta para el usuario actual:
     · 'locked' → herramienta premium y el usuario NO es Premium (paywall).
     · 'read'   → el usuario es colaborador 'viewer' del proyecto (solo lectura).
     · 'edit'   → propietario / editor / herramienta free con plan suficiente.
   Fuente única de verdad del gating; lo consume el ToolHost antes de montar.
   Nota: el "Pase por proyecto" (entitlements) se resolverá vía Cloud Function;
   aquí el desbloqueo premium se decide por el plan efectivo del usuario.
   ============================================================================= */
import { useAuth } from './auth/AuthProvider';
import type { AccessMode, CatalogTool, ProjectMaster } from './types';

export function useAccess(
  tool: Pick<CatalogTool, 'tier'> | null | undefined,
  project?: ProjectMaster | null,
): AccessMode {
  const { user } = useAuth();
  const plan = user?.plan ?? 'Free';

  if (!tool) return 'edit';

  // §2/§14 — candado premium para quien no tiene plan Premium.
  if (tool.tier === 'premium' && plan !== 'Premium') return 'locked';

  // §10 — colaborador 'viewer' del proyecto: solo lectura.
  if (project && user && project.ownerId !== user.uid) {
    const role = project.members?.[user.uid];
    if (role === 'viewer') return 'read';
  }

  return 'edit';
}
