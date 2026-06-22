/**
 * AdminService.ts — F5.6 · Operaciones de administración real (Regla §12/§13/§14)
 *
 * Wraps Firestore `users` collection + Cloud Functions `setUserState` y `setCompPremium`.
 * También gestiona `config/topTools` para el ranking de herramientas ancladas.
 *
 * Requiere Custom Claim `admin:true` en el token de Auth (§12).
 * Mockup fallback: lanza error descriptivo si Firebase no está configurado.
 */

import type { ArchibotsUser, Plan } from './types';

// ── Helpers lazy ──────────────────────────────────────────────────────────────

async function getDb() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  if (!projectId) throw new Error('Firebase no configurado (VITE_FIREBASE_PROJECT_ID vacío)');
  const { getApps, getApp, initializeApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  const cfg = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  };
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return getFirestore(app);
}

async function getFn() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  if (!projectId) throw new Error('Firebase no configurado');
  const { getApps, getApp, initializeApp } = await import('firebase/app');
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const app = getApps().length ? getApp() : initializeApp({ projectId });
  return { fns: getFunctions(app, 'southamerica-west1'), httpsCallable };
}

// ── Listado de usuarios ───────────────────────────────────────────────────────

export interface AdminUserRow extends ArchibotsUser {
  projectCount: number;
}

/**
 * Lista usuarios paginados por createdAt desc.
 * Requiere índice simple en users → createdAt DESC.
 */
export async function listUsers(opts?: {
  limitN?: number;
  startAfterUid?: string;
}): Promise<AdminUserRow[]> {
  const db = await getDb();
  const {
    collection, query, orderBy, limit, startAfter, getDoc, getDocs, doc, Timestamp
  } = await import('firebase/firestore');

  const PAGE = opts?.limitN ?? 50;
  let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE));

  if (opts?.startAfterUid) {
    const cursor = await getDoc(doc(db, 'users', opts.startAfterUid));
    if (cursor.exists()) q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp
      ? (data.createdAt as InstanceType<typeof Timestamp>).toDate()
      : new Date(data.createdAt ?? Date.now());
    return {
      uid: d.id,
      email: data.email ?? '',
      nombre: data.nombre ?? '',
      plan: (data.plan as Plan) ?? 'free',
      compPremium: data.compPremium ?? false,
      theme: data.theme,
      photoURL: data.photoURL,
      estado: data.estado ?? 'activo',
      createdAt,
      projectCount: data.projectCount ?? 0,
    } satisfies AdminUserRow;
  });
}

// ── Estado del usuario (suspender / activar — §13) ────────────────────────────

/**
 * Suspende o activa un usuario.
 * Llama a la Cloud Function `setUserState` que:
 *   1. Deshabilita/habilita en Firebase Auth
 *   2. Actualiza users/{uid}.estado en Firestore
 */
export async function setUserState(
  uid: string,
  disabled: boolean
): Promise<void> {
  const { fns, httpsCallable } = await getFn();
  const fn = httpsCallable<{ uid: string; disabled: boolean }, { success: boolean }>(
    fns, 'setUserState'
  );
  const result = await fn({ uid, disabled });
  if (!result.data.success) throw new Error('setUserState indicó fallo');
}

// ── Plan de cortesía (compPremium — §14) ─────────────────────────────────────

/**
 * Asigna o revoca Premium de cortesía (compPremium) a un usuario.
 * Escribe directamente en users/{uid} — protegido por Rules (solo admin).
 */
export async function setCompPremium(uid: string, value: boolean): Promise<void> {
  const db = await getDb();
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', uid), { compPremium: value });
}

// ── Top Tools (config/topTools) ───────────────────────────────────────────────

export interface TopToolsConfig {
  toolIds: string[];
  updatedAt: Date;
  updatedBy: string;  // uid del admin
}

/**
 * Lee el ranking de Top Tools desde Firestore.
 * Retorna null si el documento no existe aún.
 */
export async function getTopTools(): Promise<TopToolsConfig | null> {
  const db = await getDb();
  const { doc, getDoc, Timestamp } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'config', 'topTools'));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    toolIds: data.toolIds ?? [],
    updatedAt: (data.updatedAt as InstanceType<typeof Timestamp>).toDate(),
    updatedBy: data.updatedBy ?? '',
  };
}

/**
 * Guarda el ranking de Top Tools en Firestore.
 * Requiere que el usuario sea admin (§12 — protegido por Rules).
 */
export async function saveTopTools(toolIds: string[], adminUid: string): Promise<void> {
  const db = await getDb();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(db, 'config', 'topTools'), {
    toolIds,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  });
}

// ── Estadísticas rápidas de resumen ──────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  suspendedUsers: number;
}

/**
 * Retorna conteos de usuarios desde Firestore.
 * Usa getCountFromServer para eficiencia (no trae docs completos).
 */
export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb();
  const {
    collection, query, where, getCountFromServer
  } = await import('firebase/firestore');

  const usersCol = collection(db, 'users');
  const [total, premium, suspended] = await Promise.all([
    getCountFromServer(query(usersCol)),
    getCountFromServer(query(usersCol, where('plan', '==', 'premium'))),
    getCountFromServer(query(usersCol, where('estado', '==', 'suspendido'))),
  ]);

  return {
    totalUsers:    total.data().count,
    premiumUsers:  premium.data().count,
    suspendedUsers: suspended.data().count,
  };
}
