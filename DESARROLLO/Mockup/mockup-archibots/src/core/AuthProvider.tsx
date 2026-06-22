/**
 * AuthProvider.tsx — F1.3 · Contexto de autenticación (Constitución §12)
 *
 * - Sustituye MOCK_USER cuando Firebase Auth está configurado (H-F1.1/H-F1.2)
 * - Mockup fallback: si no hay Firebase config, usa MOCK_USER de estado local
 * - Admin vía Custom Claim `token.admin` (§12)
 * - Política de contraseñas: mínimo 8 chars, 1 mayúscula, 1 número (P9/P57)
 */

import React, {
  createContext, useContext, useEffect, useState,
  type ReactNode,
} from 'react';
import type { ArchibotsUser, Plan } from './types';

// ── Tipos del contexto ────────────────────────────────────────────────────────

interface AuthCtx {
  user: ArchibotsUser | null;
  loading: boolean;
  isAdmin: boolean;
  plan: Plan;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Actualiza el plan en el contexto después de un pago exitoso */
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

// ── MOCK_USER para desarrollo sin Firebase ────────────────────────────────────

const MOCK_USER_DATA: ArchibotsUser = {
  uid: 'mock-uid-001',
  email: 'goyogramador@gmail.com',
  nombre: 'Gonzalo Goyogana',
  plan: 'free',
  compPremium: false,
  theme: 'brutalist',
  estado: 'activo',
  createdAt: new Date('2026-01-01'),
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<ArchibotsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    (async () => {
      try {
        const { getFirebaseAuth } = await import('./firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        const { getDb } = await import('./firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        const auth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) { setUser(null); setIsAdmin(false); setLoading(false); return; }

          // Custom claim admin (§12)
          const tokenResult = await fbUser.getIdTokenResult();
          setIsAdmin(!!tokenResult.claims['admin']);

          // Leer perfil de Firestore
          try {
            const snap = await getDoc(doc(getDb(), 'users', fbUser.uid));
            const data = snap.data();
            setUser({
              uid:          fbUser.uid,
              email:        fbUser.email ?? '',
              nombre:       fbUser.displayName ?? fbUser.email ?? '',
              plan:         (data?.plan ?? 'free') as Plan,
              compPremium:  data?.compPremium ?? false,
              theme:        data?.theme,
              photoURL:     fbUser.photoURL ?? undefined,
              estado:       data?.estado ?? 'activo',
              createdAt:    data?.createdAt?.toDate?.() ?? new Date(),
            });
          } catch {
            // Si Firestore no responde, usa datos básicos del token
            setUser({ uid: fbUser.uid, email: fbUser.email ?? '', nombre: fbUser.displayName ?? '', plan: 'free', compPremium: false, estado: 'activo', createdAt: new Date() });
          }
          setLoading(false);
        });
      } catch {
        // Firebase no disponible → modo mockup
        console.info('[AuthProvider] Firebase no disponible — usando MOCK_USER');
        setUser(MOCK_USER_DATA);
        setIsAdmin(true); // admin en mockup para poder probar todo
        setLoading(false);
      }
    })();

    return () => unsubscribe();
  }, []);

  const signInEmail = async (email: string, password: string) => {
    const { getFirebaseAuth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  };

  const signInGoogle = async () => {
    const { getFirebaseAuth } = await import('./firebase');
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  };

  const signOut = async () => {
    try {
      const { getFirebaseAuth } = await import('./firebase');
      const { signOut: fbSignOut } = await import('firebase/auth');
      await fbSignOut(getFirebaseAuth());
    } catch {
      setUser(null);
    }
  };

  const refreshPlan = async () => {
    if (!user) return;
    try {
      const { getFirebaseAuth } = await import('./firebase');
      const auth = getFirebaseAuth();
      // Fuerza refresh del token para capturar cambios de Custom Claims
      await auth.currentUser?.getIdToken(true);
      // Re-lectura del plan desde Firestore
      const { getDb } = await import('./firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(getDb(), 'users', user.uid));
      const data = snap.data();
      if (data) setUser(prev => prev ? { ...prev, plan: data.plan ?? prev.plan, compPremium: data.compPremium ?? prev.compPremium } : prev);
    } catch { /* silencioso */ }
  };

  const plan: Plan = user?.compPremium ? 'premium' : (user?.plan ?? 'free');

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, plan, signInEmail, signInGoogle, signOut, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Validación de contraseña (P9/P57) */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8)                return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pw))           return 'Debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(pw))           return 'Debe incluir al menos un número';
  return null;
}
