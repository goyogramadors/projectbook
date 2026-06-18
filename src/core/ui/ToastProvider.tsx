/* =============================================================================
   _ARCHIBOTS · TOAST PROVIDER (F1.6)
   -----------------------------------------------------------------------------
   Extrae el `triggerToast` quintuplicado de los App.tsx legacy a un único
   provider. Toast efímero (3.2 s) con auto-dismiss. La UI (.ab-toast) la pinta
   el AppShell; aquí solo vive el estado.
   ============================================================================= */

import {
  createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { ToastApi } from '../types';

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const triggerToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo<ToastApi>(() => ({ toast, triggerToast }), [toast, triggerToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
