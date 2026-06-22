/**
 * migrate-projects.mjs — F5.8 · Migración de sub-colecciones (Node.js ESM)
 *
 * Propósito: mover los datos inline de proyectos existentes a sub-colecciones
 * Firestore siguiendo el esquema de producción de ArchiBots.
 *
 * Transformaciones:
 *   projects/{id}.formularios[]  → projects/{id}/formularios/{itemId}
 *   projects/{id}.simulaciones[] → projects/{id}/simulaciones/{itemId}
 *   projects/{id}.bitacora[]     → projects/{id}/bitacora/{entryId}
 *   projects/{id}.documentos[]   → projects/{id}/documentos/{docId}
 *
 * Uso:
 *   1. Exportar credenciales: export GOOGLE_APPLICATION_CREDENTIALS=/ruta/serviceAccount.json
 *   2. node scripts/migrate-projects.mjs --env dev   (usa proyecto archibots-dev)
 *   3. node scripts/migrate-projects.mjs --env prod  (usa proyecto archibots-prod → requiere confirmación)
 *
 * Flags:
 *   --env dev|prod   (requerido)
 *   --dry-run        solo muestra qué haría, no escribe
 *   --project-id     override manual del projectId Firebase
 *   --limit N        máximo de proyectos a procesar (default: todos)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// ── Configuración de proyectos ────────────────────────────────────────────────

const PROJECTS = {
  dev:  'archibots-dev',
  prod: 'archibots-497423',
};

// ── Parse de argumentos ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const envArg   = args.includes('--env') ? args[args.indexOf('--env') + 1] : null;
const dryRun   = args.includes('--dry-run');
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const projectOverride = args.includes('--project-id') ? args[args.indexOf('--project-id') + 1] : null;

if (!envArg || !['dev', 'prod'].includes(envArg)) {
  console.error('❌ Uso: node migrate-projects.mjs --env dev|prod [--dry-run] [--limit N]');
  process.exit(1);
}

const firebaseProjectId = projectOverride ?? PROJECTS[envArg];

// ── Confirmación para producción ──────────────────────────────────────────────

if (envArg === 'prod' && !dryRun) {
  const rl = createInterface({ input, output });
  const resp = await rl.question(
    `\n⚠️  PRODUCCIÓN: migrando en "${firebaseProjectId}".\nEscribe "CONFIRMAR" para continuar: `
  );
  rl.close();
  if (resp.trim() !== 'CONFIRMAR') {
    console.log('Abortado.');
    process.exit(0);
  }
}

// ── Inicializar Firebase Admin ────────────────────────────────────────────────

if (!getApps().length) {
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? ''), projectId: firebaseProjectId });
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...args) => console.log('[migrate]', ...args);
const warn = (...args) => console.warn('[migrate][WARN]', ...args);
let migrated = 0, skipped = 0, errors = 0;

/**
 * Mueve un array inline a una sub-colección.
 * Cada item recibe un documentId estable (item.id ?? auto-generado).
 * Al final, elimina el campo del documento padre.
 */
async function migrateArrayField(projectRef, fieldName, items, batch) {
  if (!Array.isArray(items) || items.length === 0) return;
  const subCol = projectRef.collection(fieldName);
  for (const item of items) {
    const docId = item.id ?? db.collection('_').doc().id;  // id estable o auto
    const docRef = subCol.doc(docId);
    if (dryRun) {
      log(`  [DRY-RUN] ${projectRef.id}/${fieldName}/${docId}`, JSON.stringify(item).slice(0, 80) + '…');
    } else {
      batch.set(docRef, { ...item, _migratedAt: FieldValue.serverTimestamp() });
    }
  }
}

// ── Loop principal ────────────────────────────────────────────────────────────

log(`Iniciando migración en "${firebaseProjectId}" | dry-run=${dryRun} | limit=${limitArg}`);
log('---');

const projectsSnap = await db.collection('projects').limit(Math.min(limitArg, 10_000)).get();
log(`Total proyectos encontrados: ${projectsSnap.size}`);

for (const projectDoc of projectsSnap.docs) {
  const data = projectDoc.data();
  const ref  = projectDoc.ref;
  const id   = projectDoc.id;

  // Detectar si hay campos a migrar
  const hasMigratable =
    Array.isArray(data.formularios)  && data.formularios.length  > 0 ||
    Array.isArray(data.simulaciones) && data.simulaciones.length > 0 ||
    Array.isArray(data.bitacora)     && data.bitacora.length     > 0 ||
    Array.isArray(data.documentos)   && data.documentos.length   > 0;

  if (!hasMigratable) {
    skipped++;
    continue;
  }

  log(`Procesando proyecto ${id} (${data.name ?? '—'})`);
  log(`  formularios: ${data.formularios?.length ?? 0}, simulaciones: ${data.simulaciones?.length ?? 0}, bitacora: ${data.bitacora?.length ?? 0}, documentos: ${data.documentos?.length ?? 0}`);

  try {
    // Usar un batch de Firestore (max 500 ops — si algún proyecto tiene más, habrá que dividir)
    const batch = db.batch();

    await migrateArrayField(ref, 'formularios',  data.formularios  ?? [], batch);
    await migrateArrayField(ref, 'simulaciones', data.simulaciones ?? [], batch);
    await migrateArrayField(ref, 'bitacora',     data.bitacora     ?? [], batch);
    await migrateArrayField(ref, 'documentos',   data.documentos   ?? [], batch);

    // Eliminar campos inline del documento padre
    if (!dryRun) {
      const deleteFields = {};
      if (data.formularios)  deleteFields.formularios  = FieldValue.delete();
      if (data.simulaciones) deleteFields.simulaciones = FieldValue.delete();
      if (data.bitacora)     deleteFields.bitacora     = FieldValue.delete();
      if (data.documentos)   deleteFields.documentos   = FieldValue.delete();
      deleteFields._migratedAt = FieldValue.serverTimestamp();
      batch.update(ref, deleteFields);
    }

    if (!dryRun) await batch.commit();
    migrated++;
    log(`  ✅ OK`);
  } catch (err) {
    errors++;
    warn(`  ❌ Error en ${id}:`, err.message);
  }
}

// ── Resumen final ─────────────────────────────────────────────────────────────

log('---');
log(`Resumen: migrados=${migrated}, sin_datos=${skipped}, errores=${errors}`);
if (dryRun) log('(dry-run: no se escribió nada en Firestore)');
if (errors > 0) {
  warn('Hubo errores. Revisa el output y vuelve a ejecutar.');
  process.exit(1);
}
