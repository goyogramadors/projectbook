/* =============================================================================
   _ARCHIBOTS · THEME PROVIDER (F2.2)
   -----------------------------------------------------------------------------
   Motor de theming de 4 temas (CONST §1): cad (default · Terminal/Wireframe) ·
   washi · matrix · white. ⟲ v2.2: "brutalist" renombrado a "cad".
   Aplica el tema con document.documentElement.setAttribute('data-theme'):
   cambiar el atributo reescribe TODAS las variables en cascada (archibots.css) y
   re-tematiza la UI al instante, sin recarga. Persistencia en localStorage +
   sincronización ASÍNCRONA, no bloqueante, con users/{uid}.theme. Lectura de la
   preferencia al iniciar sesión.
   ============================================================================= */

import {
  createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { THEMES, type Theme, type ThemeState } from '../types';

const LS_KEY = 'archibots:theme';
const DEFAULT_THEME: Theme = 'cad';

const ThemeContext = createContext<ThemeState | null>(null);

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v);
}

function readInitialTheme(): Theme {
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (isTheme(ls)) return ls;
  } catch { /* SSR / storage bloqueado */ }
  return DEFAULT_THEME;
}

export function ThemeProvider({
  children,
  remoteTheme,
}: {
  children: ReactNode;
  remoteTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  const lastSynced = useRef<Theme | null>(null);

  // 1) Aplica el tema a <html> y lo persiste en localStorage (fuente rápida).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(LS_KEY, theme); } catch { /* noop */ }
  }, [theme]);

  // 2) Al iniciar sesión, si el perfil remoto trae un tema distinto, lo adopta.
  useEffect(() => {
    if (remoteTheme && isTheme(remoteTheme) && remoteTheme !== theme) {
      lastSynced.current = remoteTheme;
      setThemeState(remoteTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteTheme]);

  // 3) Sincronización ASÍNCRONA no bloqueante hacia users/{uid}.theme.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || lastSynced.current === theme) return;
    lastSynced.current = theme;
    setDoc(doc(db, 'users', uid), { theme }, { merge: true }).catch(() => {
      /* offline / reglas: el tema ya quedó en localStorage, se reintenta luego */
    });
  }, [theme]);

  const value = useMemo<ThemeState>(() => ({
    theme,
    setTheme: setThemeState,
    cycleTheme: () =>
      setThemeState((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length] ?? t),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
