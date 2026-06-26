/* =============================================================================
   _ARCHIBOTS · APP SHELL (S7) — CARCASA DEL NUEVO LAYOUT UNIFICADO
   -----------------------------------------------------------------------------
   Columna a pantalla completa:
     · <ShellTop>   top de alto contraste (controles izq + marca/logo der)
     · <Outlet>     banda dinámica (Workspace 3-col / Landing / mini-páginas),
                    envuelta en AnimatePresence para el FADE de navegación (S7.3)
     · <ShellDock>  footer ancho completo (Top Tools · nav · feedback · legal)
   Las mini-páginas (Pricing/Legal/Admin/404) conservan su diseño; solo se
   enmarcan en un contenedor acotado y heredan el fade (S7.4).
   ============================================================================= */
import { Suspense, useState } from 'react';
import { useOutlet, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import ShellTop from './components/ShellTop';
import ShellDock from './components/ShellDock';
import ShareProjectModal from './views/ShareProjectModal';

import { useProjects } from './core/db/ProjectProvider';
import { useToast } from './core/ui/ToastProvider';

function CentralFallback() {
  return <div className="ab-host-empty" style={{ padding: 40 }}>// Cargando vista… (React.lazy / Suspense)</div>;
}

export default function AppShell() {
  const { projectId } = useParams();
  const { getProject } = useProjects();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);

  // S7 · onShare se expone al árbol de rutas vía contexto de Outlet, para que la
  // ficha (BinderFicha) pueda disparar el modal de compartir sin prop-drilling.
  const outlet = useOutlet({ onShare: () => setShareOpen(true) });
  const location = useLocation();
  const reduce = useReducedMotion();
  const activeProject = getProject(projectId);

  // Clave de fade por GRUPO de ruta: home / workspace(proyecto) / mini-página.
  // Cambiar de herramienta dentro de un proyecto NO refunde el shell (el ToolHost
  // ya anima su propio cambio); solo se cruza-funde al cambiar de grupo.
  const segs = location.pathname.split('/').filter(Boolean);
  const isWorkspace = segs[0] === 'p' || segs[0] === 'o'; // 'o' = workspace LDO (ancho completo)
  const isHome = location.pathname === '/';
  const routeKey = isWorkspace && segs[1] ? `/${segs[0]}/${segs[1]}` : location.pathname;
  const isShellLayout = isHome || isWorkspace;

  return (
    <div className="ab-root ab-shell">
      <AnimatePresence>
        {toast && (
          <motion.div className="ab-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <span className="dot">◈</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ShellTop onShare={() => setShareOpen(true)} />

      <Suspense fallback={<CentralFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={routeKey}
            className={`ab-outlet${isShellLayout ? '' : ' ab-outlet--mini'}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28 }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </Suspense>

      <ShellDock />

      {shareOpen && <ShareProjectModal project={activeProject} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
