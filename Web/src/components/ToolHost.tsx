/* =============================================================================
   BLOQUE 4 · ÁREA DINÁMICA / TOOL HOST (ab-toolhost) — F2.5
   -----------------------------------------------------------------------------
   Monta la herramienta activa resuelta por `toolId` (URL). Reglas de montaje:
     1. estado `soon`          → <ProximamenteView/>
     2. premium + plan Free    → <PricingView/> inline (candado, CONST §2/§11)
     3. component perezoso      → <Suspense fallback=skeleton>  ← inyección on-demand
     4. active pero sin chunk   → placeholder "RENDERIZANDO" (F1/F2: tools aún no
                                   programadas; en F3 cada una traerá su component)
   ============================================================================= */
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import ProximamenteView from './ProximamenteView';
import ToolErrorBoundary from './ToolErrorBoundary';
import PricingView from '../views/PricingView';
import { getManifest } from '../core/registry';
import { useProjects } from '../core/db/ProjectProvider';
import { useAccess } from '../core/useAccess';

function ToolSkeleton({ label }: { label: string }) {
  return (
    <motion.div className="ab-render" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="ab-render-title">[ RENDERIZANDO MÓDULO: {label} ]</div>
      <div className="ab-loadbar"><motion.div className="ab-loadbar-fill" initial={{ width: '4%' }} animate={{ width: ['4%', '100%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }} /></div>
      <div className="ab-loadtext"><Icon name="Loader" size={11} /> CARGANDO UI DEL MÓDULO… (React.lazy / Suspense)</div>
    </motion.div>
  );
}

export default function ToolHost() {
  const { projectId, toolId } = useParams();
  const { getProject } = useProjects();

  const tool = getManifest(toolId);
  const project = getProject(projectId);
  // Fuente única de gating (CONST §2/§10/§14): 'edit' | 'read' | 'locked'.
  const access = useAccess(tool, project);

  const body = () => {
    if (!tool) return <div className="ab-host-empty">// Seleccione una herramienta del catálogo para comenzar</div>;
    if (tool.estado === 'soon') return <ProximamenteView tool={tool} />;

    // CONST §2/§11 — candado premium → Paywall inline (la tool ni siquiera carga su chunk).
    if (access === 'locked') {
      return <PricingView lockedTool={tool.label} />;
    }

    const Comp = tool.component;
    if (Comp) {
      return (
        // Error Boundary: un fallo de la herramienta no derriba la SPA (pantalla blanca).
        <ToolErrorBoundary resetKey={tool.id} label={tool.label}>
          <Suspense fallback={<ToolSkeleton label={tool.label} />}>
            {/* Límite de ancho de lectura: evita que listas/tablas se estiren al
                infinito en monitores anchos (alineado a la izquierda del panel). */}
            <motion.div key={tool.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', maxWidth: 1280 }}>
              <Comp projectId={projectId} access={access} />
            </motion.div>
          </Suspense>
        </ToolErrorBoundary>
      );
    }
    // active sin component → la herramienta se conecta progresivamente (registry.LAZY_COMPONENTS).
    return <ToolSkeleton label={tool.label} />;
  };

  return (
    <div className="ab-toolhost">
      <div className="ab-module-header">
        <span>| Área Dinámica de Trabajo</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          {tool ? <><Icon name="Activity" size={12} /> RUNTIME · {tool.label.toUpperCase()}</> : <><Icon name="Power" size={12} /> IDLE</>}
        </span>
      </div>
      <div className={`ab-toolhost-body ${tool && tool.component ? 'mounted' : ''}`}>
        <AnimatePresence mode="wait">{body()}</AnimatePresence>
      </div>
    </div>
  );
}
