/* =============================================================================
   _ARCHIBOTS · ROUTER (F1.5)
   -----------------------------------------------------------------------------
   createBrowserRouter con <AppShell> como layout raíz (chrome persistente +
   <Outlet>). Rutas principales con React.lazy -> un chunk por vista, envueltas
   en el <Suspense> del AppShell. Guards: requireAuth / requireAdmin.
   Producto host-aware (ver core/product/product.ts): en modo Libro de Obra la
   home es la landing del producto y el workspace usa /o/:projectId.
   ============================================================================= */
import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../AppShell';
import { useAuth } from './auth/AuthProvider';
import { isLibroDeObra } from './product/product';

const HomeView = lazy(() => import('../views/HomeView'));
const WorkspaceView = lazy(() => import('../views/WorkspaceView'));
const AdminDashboard = lazy(() => import('../views/AdminDashboard'));
const PricingView = lazy(() => import('../views/PricingView'));
const LegalView = lazy(() => import('../views/LegalView'));
const NotFoundView = lazy(() => import('../views/NotFoundView'));
// F-LDO · producto "Libro de Obra Digital".
const LibroLandingView = lazy(() => import('../views/LibroLandingView'));
const LibroWorkspaceView = lazy(() => import('../views/LibroWorkspaceView'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="ab-host-empty" style={{ padding: 40 }}>// Verificando sesión…</div>;
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="ab-host-empty" style={{ padding: 40 }}>// Verificando permisos…</div>;
  return user?.isAdmin ? <>{children}</> : <Navigate to="/" replace />; // CONST §12
}

const libroChildren = [
  { index: true, element: <LibroLandingView /> },
  { path: 'o/:projectId', element: <LibroWorkspaceView /> },
  { path: 'p/:projectId', element: <WorkspaceView /> },
  { path: 'admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: 'pricing', element: <PricingView /> },
  { path: 'legal/:doc', element: <LegalView /> },
  { path: '*', element: <NotFoundView /> },
];

const archiblocksChildren = [
  { index: true, element: <HomeView /> },
  { path: 'p/:projectId', element: <WorkspaceView /> },
  { path: 'p/:projectId/m/:toolId', element: <WorkspaceView /> },
  { path: 'admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: 'pricing', element: <PricingView /> },
  { path: 'legal/:doc', element: <LegalView /> },
  { path: '*', element: <NotFoundView /> },
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: isLibroDeObra ? libroChildren : archiblocksChildren,
  },
]);

export { RequireAuth };
