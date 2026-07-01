/* =============================================================================
   _ARCHIBOTS - ENTRY POINT
   -----------------------------------------------------------------------------
   Provider tree:
     AuthProvider → ThemeProvider → ProjectProvider → ToastProvider
       → RouterProvider  (app completa)
       + AuthModal      (overlay invocable, NUNCA gate de layout)
   Usuarios anónimos acceden libremente. AuthModal abre sólo cuando el usuario
   hace clic en "Iniciar Sesión" o una feature requiere cuenta (openAuthModal).
   ============================================================================= */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider, useAuth } from './core/auth/AuthProvider';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { ProjectProvider } from './core/db/ProjectProvider';
import { ToastProvider } from './core/ui/ToastProvider';
import { ActiveSectionProvider } from './core/ui/ActiveSection';
import { router } from './core/router';
import './archibots.css';

/* ── Guardián de chunks tras deploy ──────────────────────────────────────────
   Cuando Cloudflare publica una versión nueva, los chunks cambian de hash y una
   pestaña abierta con el index viejo falla al hacer lazy-import ("Failed to fetch
   dynamically imported module"). Vite dispara el evento `vite:preloadError`; aquí
   recargamos la página UNA sola vez (flag en sessionStorage) para tomar el index
   nuevo. El flag se limpia al montar bien, para no bloquear recargas futuras. */
const CHUNK_RELOAD_KEY = 'ab-chunk-reload';
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault(); // evita que Vite propague el error a la app
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return; // ya recargamos → no hacer bucle
  try { sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'); } catch { /* ignore */ }
  window.location.reload();
});

const AuthModal = lazy(() => import('./views/AuthModal'));

function ThemedApp() {
  const { user, loading, authModalOpen, closeAuthModal } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          position:       'fixed',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'var(--background)',
          color:          'var(--muted-foreground)',
          fontSize:       11,
          fontWeight:     800,
          textTransform:  'uppercase',
          letterSpacing:  '0.1em',
        }}
      >
        // Iniciando ArchiBots…
      </div>
    );
  }

  return (
    <ThemeProvider remoteTheme={user?.theme}>
      <ProjectProvider>
        <ToastProvider>
          <ActiveSectionProvider>
            <RouterProvider router={router} />
            <Suspense fallback={null}>
              <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
            </Suspense>
          </ActiveSectionProvider>
        </ToastProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  </StrictMode>,
);

// La app montó bien → libera el flag para permitir una recarga futura si otro
// deploy vuelve a invalidar los chunks de una pestaña abierta.
window.setTimeout(() => { try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* ignore */ } }, 5000);
