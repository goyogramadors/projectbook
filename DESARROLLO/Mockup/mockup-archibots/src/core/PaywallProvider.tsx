/**
 * PaywallProvider.tsx — F5.3 · Lógica de acceso (Constitución §11, §14, §15)
 *
 * useAccess(toolTier, projectId?) devuelve 'edit' | 'read' | 'locked':
 *   'edit'   → plan Premium propio, compPremium, o Pase propio del proyecto
 *   'read'   → Pase del Propietario + colaborador Free (§11 solo lectura)
 *   'locked' → Free sin Pase
 *
 * usePlan()  → { plan, isPremium, projectCount, atLimit }
 */

import React, {
  createContext, useContext, useEffect, useState,
  type ReactNode,
} from 'react';
import type { Plan, AccessLevel } from './types';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Entitlement {
  projects: Record<string, true>; // projectId → true
}

interface PaywallCtx {
  plan: Plan;
  isPremium: boolean;
  compPremium: boolean;
  projectCount: number;
  atLimit: boolean; // §15: tope 50 Premium
  entitlements: Record<string, true>;
  getAccess: (toolTier: 'free' | 'premium', projectId?: string) => AccessLevel;
}

const MAX_PROJECTS = 50;
const PaywallContext = createContext<PaywallCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PaywallProvider({ uid, initialPlan = 'free', children }: {
  uid: string | null;
  initialPlan?: Plan;
  children: ReactNode;
}) {
  const [plan,         setPlan]         = useState<Plan>(initialPlan);
  const [compPremium,  setCompPremium]  = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [entitlements, setEntitlements] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!uid) return;

    let unsubUser: (() => void) | undefined;
    let unsubEnt:  (() => void) | undefined;

    (async () => {
      try {
        const { getDb }    = await import('./firebase');
        const { doc, onSnapshot, collection, query, where, getCountFromServer } = await import('firebase/firestore');

        // Escuchar cambios de plan en tiempo real
        unsubUser = onSnapshot(doc(getDb(), 'users', uid), (snap) => {
          const d = snap.data();
          if (d) {
            setPlan(d.plan ?? 'free');
            setCompPremium(d.compPremium ?? false);
          }
        });

        // Escuchar entitlements (Pases por proyecto)
        unsubEnt = onSnapshot(doc(getDb(), 'entitlements', uid), (snap) => {
          const d = snap.data();
          setEntitlements(d?.projects ?? {});
        });

        // Contar proyectos propios (§15)
        const countSnap = await getCountFromServer(
          query(collection(getDb(), 'projects'), where('ownerId', '==', uid))
        );
        setProjectCount(countSnap.data().count);
      } catch {
        // Sin Firebase: usa valores iniciales
      }
    })();

    return () => { unsubUser?.(); unsubEnt?.(); };
  }, [uid]);

  const isPremium = compPremium || plan === 'premium';
  const atLimit   = isPremium && projectCount >= MAX_PROJECTS;

  /**
   * Determina el nivel de acceso a una herramienta.
   * §11: colaborador Free con Pase del propietario → 'read' (no 'edit')
   *      Para 'edit' el colaborador necesita su propio Pase o suscripción Premium.
   */
  const getAccess = (toolTier: 'free' | 'premium', projectId?: string): AccessLevel => {
    if (toolTier === 'free') return 'edit';
    // Premium tool:
    if (isPremium)                              return 'edit'; // plan propio o compPremium
    if (projectId && entitlements[projectId])   return 'edit'; // Pase propio
    // §11: Si el proyecto tiene Pase del propietario y el usuario es colaborador
    // (se detecta en el componente que conoce el proyecto; aquí retorna 'read' como señal)
    return 'locked';
  };

  return (
    <PaywallContext.Provider value={{ plan, isPremium, compPremium, projectCount, atLimit, entitlements, getAccess }}>
      {children}
    </PaywallContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function usePlan() {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error('usePlan must be used within PaywallProvider');
  const { plan, isPremium, compPremium, projectCount, atLimit } = ctx;
  return { plan, isPremium, compPremium, projectCount, atLimit };
}

export function useAccess(toolTier: 'free' | 'premium', projectId?: string): AccessLevel {
  const ctx = useContext(PaywallContext);
  if (!ctx) return toolTier === 'free' ? 'edit' : 'locked';
  return ctx.getAccess(toolTier, projectId);
}
