/* =============================================================================
   _ARCHIBOTS · ADMIN SERVICE (Panel /admin — CONST §12/§14)
   -----------------------------------------------------------------------------
   Gestión de usuarios sobre la colección users: listado, suspensión/activación y
   comp Premium (cortesía). El plan efectivo de otros usuarios se deriva de
   compPremium (los custom claims no son legibles desde el cliente). El guard
   requireAdmin vive en el router. Imports estáticos de firebase/firestore.
   ============================================================================= */
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Plan, TopToolsConfig } from './types';

export type UserEstado = 'Activo' | 'Suspendido';

/** Fila de usuario para la tabla del panel de administración. */
export interface AdminUserRow {
  uid: string;
  email: string;
  nombre: string;
  plan: Plan;
  estado: UserEstado;
  compPremium: boolean;
}

interface UserDoc {
  email?: string;
  nombre?: string;
  estado?: UserEstado;
  compPremium?: boolean;
  plan?: string;
}

/** Lista todos los usuarios de la plataforma (colección users). */
export async function listUsers(): Promise<AdminUserRow[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => {
    const u = d.data() as UserDoc;
    const compPremium = u.compPremium === true;
    const plan: Plan = compPremium || u.plan === 'premium' || u.plan === 'Premium' ? 'Premium' : 'Free';
    return {
      uid: d.id,
      email: u.email ?? '—',
      nombre: u.nombre ?? u.email?.split('@')[0] ?? 'usuario',
      plan,
      estado: u.estado ?? 'Activo',
      compPremium,
    } satisfies AdminUserRow;
  });
}

/** Suspende o reactiva una cuenta (users/{uid}.estado). */
export async function setUserState(uid: string, estado: UserEstado): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { estado });
}

/** Activa o revoca el Premium de cortesía (users/{uid}.compPremium). */
export async function setCompPremium(uid: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { compPremium: value });
}

/** Fija el campo plan del usuario (users/{uid}.plan). Eleva/baja de plan directo. */
export async function setUserPlan(uid: string, plan: Plan): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { plan, compPremium: plan === 'Premium' });
}

/** Busca un usuario por correo y lo eleva a Premium. Devuelve true si existía. */
export async function promoteByEmail(email: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (snap.empty) return false;
  await Promise.all(
    snap.docs.map((d) => updateDoc(doc(db, 'users', d.id), { plan: 'Premium', compPremium: true })),
  );
  return true;
}

/* ── TOP TOOLS (CONST §2) — ranking anclado en la barra inferior ──────────────
   Documento único `config/topTools` { ids: string[] }. Lectura pública con auth;
   escritura solo admin (reglas Firestore). La barra (TopToolsBar) ya lee este doc. */
export async function getTopTools(): Promise<string[] | null> {
  try {
    const snap = await getDoc(doc(db, 'config', 'topTools'));
    if (!snap.exists()) return null;
    const ids = (snap.data() as TopToolsConfig).ids;
    return Array.isArray(ids) && ids.every((x) => typeof x === 'string') ? ids : null;
  } catch {
    return null;
  }
}

/** Persiste el ranking de Top Tools (solo admin por reglas). */
export async function setTopTools(ids: string[]): Promise<void> {
  await setDoc(doc(db, 'config', 'topTools'), { ids } satisfies TopToolsConfig, { merge: true });
}
