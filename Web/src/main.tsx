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
