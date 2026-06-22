/**
 * ShareService.ts — F5.5 · Colaboración real por proyecto (Regla §11)
 *
 * Operaciones:
 *   createInvite   — llama Cloud Function sendInviteEmail → crea doc en invitations/
 *   revokeInvite   — elimina invitación de Firestore
 *   resolveToken   — acepta una invitación (usado en /invite/:token)
 *   getInvitations — lista invitaciones activas de un proyecto
 *
 * Mockup fallback: si Firebase no está configurado, todas las operaciones lanzan
 * un error descriptivo para que la UI pueda mostrar un toast adecuado.
 */

import type { MemberRole } from './types';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface InvitationDoc {
  id: string;           // token = documentId
  projectId: string;
  projectName: string;
  invitedEmail: string;
  rol: MemberRole;
  invitedBy: string;    // uid del propietario
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'revoked';
}

// ── Helpers de inicialización lazy ───────────────────────────────────────────

async function resolveFirestore() {
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

async function resolveFunctions() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  if (!projectId) throw new Error('Firebase no configurado');
  const { getApps, getApp, initializeApp } = await import('firebase/app');
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const app = getApps().length ? getApp() : initializeApp({ projectId });
  return { fn: getFunctions(app, 'southamerica-west1'), httpsCallable };
}

// ── createInvite ──────────────────────────────────────────────────────────────

/**
 * Invita a un colaborador.
 * Llama a la Cloud Function `sendInviteEmail` que:
 *   1. Crea invitations/{token} en Firestore
 *   2. Envía email con el link /invite/{token}
 */
export async function createInvite(
  projectId: string,
  projectName: string,
  invitedEmail: string,
  rol: MemberRole
): Promise<void> {
  const { fn, httpsCallable } = await resolveFunctions();
  const sendInviteEmail = httpsCallable<
    { projectId: string; projectName: string; invitedEmail: string; rol: MemberRole },
    { success: boolean }
  >(fn, 'sendInviteEmail');
  const result = await sendInviteEmail({ projectId, projectName, invitedEmail, rol });
  if (!result.data.success) {
    throw new Error('La Cloud Function sendInviteEmail indicó fallo');
  }
}

// ── revokeInvite ──────────────────────────────────────────────────────────────

/**
 * Revoca una invitación pendiente.
 * Actualiza status → 'revoked' (no borra el doc para auditoría).
 */
export async function revokeInvite(invitationId: string): Promise<void> {
  const db = await resolveFirestore();
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'revoked',
  });
}

// ── resolveToken ──────────────────────────────────────────────────────────────

/**
 * Acepta una invitación dado su token (documentId).
 * Se llama desde la ruta /invite/:token tras autenticación.
 *
 * Operaciones atómicas en una transacción:
 *   - Lee invitations/{token} → valida pending + no expirada
 *   - Actualiza projects/{projectId}: add uid a memberUids + members[uid] = rol
 *   - Marca invitations/{token}.status = 'accepted'
 *
 * Retorna el projectId para redirigir al workspace.
 */
export async function resolveToken(
  token: string,
  acceptingUid: string
): Promise<string> {
  const db = await resolveFirestore();
  const {
    doc, runTransaction, arrayUnion, serverTimestamp
  } = await import('firebase/firestore');

  const invRef = doc(db, 'invitations', token);
  let projectId = '';

  await runTransaction(db, async (tx) => {
    const invSnap = await tx.get(invRef);
    if (!invSnap.exists()) throw new Error('Invitación no encontrada.');
    const inv = invSnap.data() as Omit<InvitationDoc, 'id'>;

    if (inv.status !== 'pending') throw new Error('Esta invitación ya fue usada o revocada.');
    if (inv.expiresAt.toDate?.() < new Date()) throw new Error('La invitación ha expirado.');

    projectId = inv.projectId;
    const projRef = doc(db, 'projects', inv.projectId);

    tx.update(projRef, {
      memberUids: arrayUnion(acceptingUid),
      [`members.${acceptingUid}`]: inv.rol,
      updatedAt: serverTimestamp(),
    });
    tx.update(invRef, { status: 'accepted' });
  });

  return projectId;
}

// ── getInvitations ────────────────────────────────────────────────────────────

/**
 * Lista invitaciones activas (pending) de un proyecto.
 * Requiere índice: invitations → projectId ASC + status ASC + createdAt DESC
 */
export async function getInvitations(projectId: string): Promise<InvitationDoc[]> {
  const db = await resolveFirestore();
  const { collection, query, where, orderBy, getDocs, Timestamp } = await import('firebase/firestore');

  const q = query(
    collection(db, 'invitations'),
    where('projectId', '==', projectId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as InstanceType<typeof Timestamp>).toDate(),
      expiresAt: (data.expiresAt as InstanceType<typeof Timestamp>).toDate(),
    } as InvitationDoc;
  });
}

// ── generateInviteLink ────────────────────────────────────────────────────────

/** Devuelve la URL pública del enlace de invitación. */
export function generateInviteLink(token: string): string {
  const base = import.meta.env.VITE_APP_BASE_URL ?? window.location.origin;
  return `${base}/invite/${token}`;
}
