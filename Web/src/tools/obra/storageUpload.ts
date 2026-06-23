/* =============================================================================
   storageUpload.ts — ADJUNTOS REALES de Obra Digital en Firebase Storage (UUID)
   -----------------------------------------------------------------------------
   // Sube binarios a projects/{pid}/obra/{scope}/{uuid}-{nombre} y devuelve el
   // metadato {uuid,name,size,type,url,path} que se guarda en el folio/archivo.
   // Protegido por storage.rules zero-trust (miembro lee · editor escribe, ≤25 MB).
   // Degradación: si la subida falla (reglas/offline), el caller decide (no rompe).
   ============================================================================= */
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../core/firebase';
import type { ObraAdjunto } from '../../core/types';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB (espejo de storage.rules)

function uuid(): string {
  try { return crypto.randomUUID(); }
  catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
}

/** Sanitiza el nombre para usarlo en el path (conserva el original en metadata). */
function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 80);
}

export class AdjuntoDemasiadoGrande extends Error {}

/** Sube un archivo y devuelve su metadato persistible. Lanza si excede el límite. */
export async function subirAdjunto(
  projectId: string, scope: 'libro' | 'carpeta', file: File,
): Promise<ObraAdjunto> {
  if (file.size > MAX_BYTES) throw new AdjuntoDemasiadoGrande(file.name);
  const id = uuid();
  const path = `projects/${projectId}/obra/${scope}/${id}-${safeName(file.name)}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || 'application/octet-stream' });
  const url = await getDownloadURL(r);
  return { uuid: id, name: file.name, size: file.size, type: file.type, url, path };
}

/** Borra el binario de Storage (best-effort: ignora si ya no existe). */
export async function borrarAdjunto(path: string): Promise<void> {
  try { await deleteObject(ref(storage, path)); } catch { /* ya borrado / sin permiso */ }
}
