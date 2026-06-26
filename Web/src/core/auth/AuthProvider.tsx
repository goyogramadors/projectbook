/* =============================================================================
   _ARCHIBOTS · AUTH PROVIDER ÚNICO (F1.3)
   -----------------------------------------------------------------------------
   Sustituye el MOCK_USER del Mockup y los 5 bloques de auth quintuplicados.
   Estado de sesión REAL de Firebase (onAuthStateChanged). Resuelve:
     · plan efectivo (Premium si claim de suscripción o compPremium — CONST §14)
     · rol admin vía Custom Claim token.admin (CONST §12), con fallback de correo
     · preferencia de tema desde users/{uid}.theme (CONST §1, lectura al iniciar)
   Política de contraseñas fija (P9/P57): mínimo 8 caracteres.
   authModalOpen / openAuthModal / closeAuthModal — estado global del AuthModal
   (invocable desde StatusBar, ToolHost, paywall, etc. — sin prop-drilling).
   ============================================================================= */

import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User as FbUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import type { AuthState, User, Plan, Theme } from '../types';

const ADMIN_FALLBACK_EMAIL = 'goyogramador@gmail.com';
const MIN_PASSWORD = 8;

const AuthContext = createContext<AuthState | null>(null);

function assertPassword(pw: string): void {
  if (pw.length < MIN_PASSWORD) {
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }
}

/** Compone el modelo de dominio User a partir del FbUser + claims + perfil. */
async function resolveUser(fb: FbUser): Promise<User> {
  const token = await fb.getIdTokenResult();
  const claimAdmin = token.claims.admin === true;
  const isAdmin = claimAdmin || fb.email === ADMIN_FALLBACK_EMAIL;

  let theme: Theme | undefined;
  let compPremium = false;
  let estado: User['estado'] = 'Activo';
  try {
    const snap = await getDoc(doc(db, 'users', fb.uid));
    if (snap.exists()) {
      const d = snap.data() as Partial<User>;
      theme = d.theme;
      compPremium = d.compPremium === true;
      estado = d.estado ?? 'Activo';
    } else {
      // Auto-aprovisionamiento (primer login): crea users/{uid} en la base (default)
      // para que las reglas Zero-Trust no bloqueen la creación de proyectos
      // (isPremium/isActive hacen get() de este doc). Escritura NO bloqueante
      // (fire-and-forget): no demora el render; si red/reglas fallan, la sesión
      // continúa con los valores por defecto y se reintenta en el próximo login.
      // Verificar si existe una invitación Premium pendiente para este correo
      let isPendingPremium = false;
      if (fb.email) {
        try {
          const invSnap = await getDocs(
            query(
              collection(db, 'premiumInvitations'),
              where('email', '==', fb.email),
              where('pendiente', '==', true),
            )
          );
          if (!invSnap.empty) {
            isPendingPremium = true;
            compPremium = true;
            // Marcar todas las invitaciones de este correo como aceptadas
            await Promise.all(
              invSnap.docs.map((d) =>
                updateDoc(d.ref, { pendiente: false, acceptedBy: fb.uid, acceptedAt: Date.now() })
              )
            );
          }
        } catch { /* offline / reglas: continúa sin Premium */ }
      }
      void setDoc(doc(db, 'users', fb.uid), {
        uid: fb.uid,
        email: fb.email,
        plan: isPendingPremium ? 'Premium' : 'Free',
        estado: 'Activo',
        compPremium: isPendingPremium,
        createdAt: Date.now(),
      }).catch(() => { /* offline / reglas: se reintenta en el próximo login */ });
    }
  } catch {
    /* offline / reglas: degrada a valores por defecto sin romper la sesión. */
  }

  const claimPremium = token.claims.plan === 'premium';
  const plan: Plan = claimPremium || compPremium ? 'Premium' : 'Free';

  return {
    uid: fb.uid,
    email: fb.email,
    nombre: fb.displayName || fb.email?.split('@')[0] || 'usuario',
    plan,
    compPremium,
    isAdmin,
    estado,
    theme,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      if (fb) {
        try { setUser(await resolveUser(fb)); }
        catch { setUser(null); }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    authModalOpen,
    openAuthModal:  () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    async signInEmail(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthModalOpen(false);
    },
    async signUpEmail(email, password, nombre) {
      assertPassword(password);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (nombre) await updateProfile(cred.user, { displayName: nombre });
      setAuthModalOpen(false);
    },
    async signInGoogle() {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
    },
    async signOut() {
      await fbSignOut(auth);
    },
  }), [user, loading, authModalOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook de acceso a la sesión. Lanza si se usa fuera del provider. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
