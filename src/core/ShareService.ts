/* =============================================================================
   _ARCHIBOTS · SHARE SERVICE (Colaboración — CONST §10)
   -----------------------------------------------------------------------------
   Gestiona los colaboradores de un proyecto sobre projects/{id}.members
   (Record<uid, 'editor'|'viewer'>). Resuelve el correo del invitado contra la
   colección users (where email ==). Imports estáticos de firebase/firestore.
   ============================================================================= */
import { doc, getDoc, updateDoc, deleteField, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { MemberRole, Collaborator, ProjectMaster } from './types';

const ROL_LABEL: Record<MemberRole, Collaborator['rol']> = { editor: 'Editor', viewer: 'Lector' };

/** Busca el uid de un usuario por su correo en la colección users. */
async function uidByEmail(email: string): Promise<{ uid: string; email: string } | null> {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())));
  const first = snap.docs[0];
  if (!first) return null;
  const data = first.data() as { email?: string };
  return { uid: first.id, email: data.email ?? email };
}

/** Lista los colaboradores actuales del proyecto (resuelve correo best-effort). */
export async function listMembers(projectId: string): Promise<Collaborator[]> {
  const snap = await getDoc(doc(db, 'projects', projectId));
  if (!snap.exists()) return [];
  const members = (snap.data() as ProjectMaster).members ?? {};
  const entries = Object.entries(members);
  const result = await Promise.all(entries.map(async ([uid, role]) => {
    let email = uid;
    try {
      const us = await getDoc(doc(db, 'users', uid));
      if (us.exists()) email = (us.data() as { email?: string }).email ?? uid;
    } catch { /* reglas / offline: deja el uid como etiqueta */ }
    return { id: uid, email, rol: ROL_LABEL[role] } satisfies Collaborator;
  }));
  return result;
}

/** Invita por correo: asigna el rol al uid encontrado. Lanza si el correo no existe. */
export async function inviteByEmail(projectId: string, email: string, role: MemberRole): Promise<Collaborator> {
  const found = await uidByEmail(email);
  if (!found) throw new Error('No existe un usuario registrado con ese correo.');
  await updateDoc(doc(db, 'projects', projectId), { [`members.${found.uid}`]: role });
  return { id: found.uid, email: found.email, rol: ROL_LABEL[role] };
}

/** Revoca el acceso de un colaborador eliminando su entrada de members. */
export async function revokeAccess(projectId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), { [`members.${uid}`]: deleteField() });
}

/** Genera un enlace profundo al proyecto (deep link a la ruta /p/:projectId). */
export function generateShareLink(projectId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/p/${projectId}`;
}
