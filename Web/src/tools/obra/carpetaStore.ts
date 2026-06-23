/* =============================================================================
   carpetaStore.ts — PERSISTENCIA doc-por-archivo de la Carpeta Digital
   -----------------------------------------------------------------------------
   // META     projects/{pid}/carpetaDigital/state              → {iniciado,contratoKey,seq,perms}
   // ARCHIVOS projects/{pid}/carpetaDigital/state/archivos/{id} → un doc por archivo
   // Cada archivo puede portar un adjunto real (Storage UUID, ver storageUpload).
   // Cloud (Premium): escritura granular + paginación. Local (Free): array en LS.
   // Migración one-time del MVP (payload con `archivos` en array).
   // Cubierto por firestore.rules → match /carpetaDigital/{document=**} (recursivo).
   ============================================================================= */
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, limit as qlimit, startAfter, serverTimestamp,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '../../core/firebase';
import type { CarpetaArchivo, CarpetaDigitalState, LibroNivel } from '../../core/types';

export interface CarpetaMeta {
  iniciado: boolean;
  contratoKey: string;
  seq: number;
  perms: Record<string, LibroNivel>;
}
export interface CarpetaCarga {
  meta: CarpetaMeta | null;
  archivos: CarpetaArchivo[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}
export const PAGE_ARCHIVOS = 100;

const metaRef     = (pid: string) => doc(db, 'projects', pid, 'carpetaDigital', 'state');
const archivosCol = (pid: string) => collection(db, 'projects', pid, 'carpetaDigital', 'state', 'archivos');
const localKey    = (pid: string) => `ab-carpeta-digital-${pid}`;
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
const archivoId = (id: number) => `a_${id}`;

export async function cargarCarpeta(pid: string, isCloud: boolean): Promise<CarpetaCarga> {
  if (isCloud) {
    try {
      const snap = await getDoc(metaRef(pid));
      const data = snap.data() as
        | { payload?: CarpetaDigitalState; iniciado?: boolean; contratoKey?: string; seq?: number; perms?: Record<string, LibroNivel>; migrated?: boolean }
        | undefined;

      if (data?.payload && !data.migrated) {
        const p = data.payload;
        for (const a of p.archivos ?? []) {
          await setDoc(doc(archivosCol(pid), archivoId(a.id)), clean({ ...a, _ord: a.id }));
        }
        const meta: CarpetaMeta = { iniciado: p.iniciado, contratoKey: p.contratoKey, seq: p.seq ?? 1, perms: p.perms ?? {} };
        await setDoc(metaRef(pid), { ...meta, migrated: true });
        return { meta, archivos: clean(p.archivos ?? []), cursor: null };
      }

      const meta: CarpetaMeta | null = data
        ? { iniciado: data.iniciado ?? false, contratoKey: data.contratoKey ?? '', seq: data.seq ?? 1, perms: data.perms ?? {} }
        : null;
      const qs = await getDocs(query(archivosCol(pid), orderBy('_ord', 'desc'), qlimit(PAGE_ARCHIVOS)));
      const archivos = qs.docs.map(d => d.data() as CarpetaArchivo);
      const cursor = qs.docs.length === PAGE_ARCHIVOS ? qs.docs[qs.docs.length - 1]! : null;
      return { meta, archivos, cursor };
    } catch { /* offline/reglas → local */ }
  }
  try {
    const raw = localStorage.getItem(localKey(pid));
    if (raw) {
      const p = JSON.parse(raw) as CarpetaDigitalState;
      return { meta: { iniciado: p.iniciado, contratoKey: p.contratoKey, seq: p.seq ?? 1, perms: p.perms ?? {} }, archivos: p.archivos ?? [], cursor: null };
    }
  } catch { /* ignore */ }
  return { meta: null, archivos: [], cursor: null };
}

export async function cargarMasArchivos(
  pid: string, cursor: QueryDocumentSnapshot<DocumentData>,
): Promise<{ archivos: CarpetaArchivo[]; cursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const qs = await getDocs(query(archivosCol(pid), orderBy('_ord', 'desc'), startAfter(cursor), qlimit(PAGE_ARCHIVOS)));
  const archivos = qs.docs.map(d => d.data() as CarpetaArchivo);
  return { archivos, cursor: qs.docs.length === PAGE_ARCHIVOS ? qs.docs[qs.docs.length - 1]! : null };
}

export async function putArchivo(pid: string, isCloud: boolean, a: CarpetaArchivo): Promise<boolean> {
  if (!isCloud) return false;
  try { await setDoc(doc(archivosCol(pid), archivoId(a.id)), clean({ ...a, _ord: a.id, updatedAt: serverTimestamp() })); return true; }
  catch { return false; }
}

export async function guardarMetaCarpeta(pid: string, isCloud: boolean, meta: CarpetaMeta, archivosLocal: CarpetaArchivo[]): Promise<boolean> {
  if (isCloud) {
    try { await setDoc(metaRef(pid), { ...clean(meta), migrated: true, updatedAt: serverTimestamp() }, { merge: true }); return true; }
    catch { /* local */ }
  }
  try {
    const payload: CarpetaDigitalState = { iniciado: meta.iniciado, contratoKey: meta.contratoKey, archivos: archivosLocal, seq: meta.seq, perms: meta.perms };
    localStorage.setItem(localKey(pid), JSON.stringify(payload));
    return true;
  } catch { return false; }
}
