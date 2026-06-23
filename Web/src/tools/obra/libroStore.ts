/* =============================================================================
   libroStore.ts — PERSISTENCIA doc-por-folio del Libro de Obras Digital
   -----------------------------------------------------------------------------
   // Evoluciona el MVP de "documento único state" a:
   //   · META   projects/{pid}/libroObras/state            → {libros, perms, counters}
   //   · FOLIOS projects/{pid}/libroObras/state/folios/{id} → un documento por folio
   // Counters Año→Mes: la numeración del folio es AAAA-MM-NNN (reinicia por mes).
   // Cloud (Premium): escritura granular por folio + paginación con cursor.
   // Local (Free): el árbol completo vive en localStorage (array), sin cambios de UX.
   // Migración one-time: si el doc `state` trae el `payload` legado (folios en un
   //   array), se reparte a la subcolección y se reescribe el meta con `migrated`.
   // Cubierto por firestore.rules → match /libroObras/{document=**} (recursivo).
   ============================================================================= */
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, limit as qlimit, startAfter, serverTimestamp,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '../../core/firebase';
import type { LibroObra, LibroFolio, LibroNivel, LibroObrasState } from '../../core/types';

export interface LibroMeta {
  libros: LibroObra[];
  perms: Record<string, LibroNivel>;
  counters: Record<string, number>;
}
export interface LibroCarga {
  meta: LibroMeta | null;        // null ⇒ proyecto sin datos (el view aplica seed)
  folios: LibroFolio[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}
export const PAGE_FOLIOS = 50;

const metaRef   = (pid: string) => doc(db, 'projects', pid, 'libroObras', 'state');
const foliosCol = (pid: string) => collection(db, 'projects', pid, 'libroObras', 'state', 'folios');
const localKey  = (pid: string) => `ab-libro-obras-${pid}`;
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
/** Firestore no admite '/' en id; saneamos el folio para usarlo como id estable. */
const folioId = (folio: string) => folio.replace(/[\/#.]+/g, '_') || `f_${Date.now()}`;

/** Numeración Año→Mes: AAAA-MM-NNN, reiniciando NNN al cambiar de mes. */
export function nextFolioNumero(
  counters: Record<string, number>, when = new Date(),
): { numero: string; counters: Record<string, number> } {
  const ym = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`;
  const n = (counters[ym] ?? 0) + 1;
  return { numero: `${ym}-${String(n).padStart(3, '0')}`, counters: { ...counters, [ym]: n } };
}

/* ── Carga (cloud con migración + paginación · o local) ─────────────────────── */
export async function cargarLibro(pid: string, isCloud: boolean): Promise<LibroCarga> {
  if (isCloud) {
    try {
      const snap = await getDoc(metaRef(pid));
      const data = snap.data() as
        | { payload?: LibroObrasState; libros?: LibroObra[]; perms?: Record<string, LibroNivel>; counters?: Record<string, number>; migrated?: boolean }
        | undefined;

      // ── Migración one-time del MVP (payload con folios en array) ──
      if (data?.payload && !data.migrated) {
        const p = data.payload;
        for (const f of p.folios ?? []) {
          await setDoc(doc(foliosCol(pid), folioId(f.folio)),
            clean({ ...f, createdAt: serverTimestamp(), _ord: Date.now() })); // _ord estable para orden
        }
        const meta: LibroMeta = { libros: p.libros ?? [], perms: p.perms ?? {}, counters: {} };
        await setDoc(metaRef(pid), { ...meta, migrated: true });
        return { meta, folios: clean(p.folios ?? []), cursor: null };
      }

      const meta: LibroMeta | null = data
        ? { libros: data.libros ?? [], perms: data.perms ?? {}, counters: data.counters ?? {} }
        : null;
      // Página inicial de folios (orden descendente por _ord).
      const qs = await getDocs(query(foliosCol(pid), orderBy('_ord', 'desc'), qlimit(PAGE_FOLIOS)));
      const folios = qs.docs.map(d => d.data() as LibroFolio);
      const cursor = qs.docs.length === PAGE_FOLIOS ? qs.docs[qs.docs.length - 1]! : null;
      return { meta, folios, cursor };
    } catch { /* offline/reglas → cae a local */ }
  }
  // ── Local (Free) ──
  try {
    const raw = localStorage.getItem(localKey(pid));
    if (raw) {
      const p = JSON.parse(raw) as LibroObrasState & { counters?: Record<string, number> };
      return { meta: { libros: p.libros ?? [], perms: p.perms ?? {}, counters: p.counters ?? {} }, folios: p.folios ?? [], cursor: null };
    }
  } catch { /* ignore */ }
  return { meta: null, folios: [], cursor: null };
}

/** Siguiente página de folios (solo cloud). */
export async function cargarMasFolios(
  pid: string, cursor: QueryDocumentSnapshot<DocumentData>,
): Promise<{ folios: LibroFolio[]; cursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const qs = await getDocs(query(foliosCol(pid), orderBy('_ord', 'desc'), startAfter(cursor), qlimit(PAGE_FOLIOS)));
  const folios = qs.docs.map(d => d.data() as LibroFolio);
  return { folios, cursor: qs.docs.length === PAGE_FOLIOS ? qs.docs[qs.docs.length - 1]! : null };
}

/** Escribe/actualiza un folio (cloud: doc propio · local: lo maneja guardarLocal). */
export async function putFolio(pid: string, isCloud: boolean, folio: LibroFolio, ord: number): Promise<boolean> {
  if (!isCloud) return false;
  try {
    await setDoc(doc(foliosCol(pid), folioId(folio.folio)), clean({ ...folio, createdAt: serverTimestamp(), _ord: ord }));
    return true;
  } catch { return false; }
}

export async function borrarFolio(pid: string, isCloud: boolean, folio: LibroFolio): Promise<void> {
  if (!isCloud) return;
  try { await deleteDoc(doc(foliosCol(pid), folioId(folio.folio))); } catch { /* ignore */ }
}

/** Persiste el meta (libros/perms/counters). En cloud, sin tocar folios. */
export async function guardarMeta(pid: string, isCloud: boolean, meta: LibroMeta, foliosLocal: LibroFolio[]): Promise<boolean> {
  if (isCloud) {
    try { await setDoc(metaRef(pid), { ...clean(meta), migrated: true, updatedAt: serverTimestamp() }, { merge: true }); return true; }
    catch { /* degrada a local */ }
  }
  try {
    const payload: LibroObrasState & { counters: Record<string, number> } =
      { libros: meta.libros, folios: foliosLocal, seq: 0, perms: meta.perms, counters: meta.counters };
    localStorage.setItem(localKey(pid), JSON.stringify(payload));
    return true;
  } catch { return false; }
}
