/**
 * seed-normativas.mjs — Siembra masiva de fichas normativas en `normativas_prc`.
 *
 * ⚠️ BASE CORRECTA: la app lee `normativas_prc` desde la base NOMBRADA
 *    `coordenadasnormativas` (ver src/core/NormativaService.ts), NO desde (default).
 *    Por eso este script apunta por defecto a `coordenadasnormativas`.
 *    Las reglas (firestore.coordenadasnormativas.rules) son write:false desde el
 *    cliente, pero el Admin SDK las ignora → la curaduría se hace exactamente así.
 *
 * Requisitos (una sola vez):
 *   cd scripts && npm install              # instala firebase-admin
 *   export GOOGLE_APPLICATION_CREDENTIALS=/ruta/serviceAccount.json
 *
 * Uso:
 *   node seed-normativas.mjs <fichas.json> --env prod [--dry-run] [--comuna "Ñuñoa"] [--database coordenadasnormativas]
 *
 * Formato de <fichas.json> (cualquiera de los dos):
 *   A) Array:  [ { "zona": "Z-4B", "comuna": "Ñuñoa", "constructibilidad": 2.0, "coeficienteOcupacion": 0.6, ... }, ... ]
 *   B) Mapa:   { "ñuñoa_z-4b": { "constructibilidad": 2.0, ... }, "ñuñoa_z-2": { ... } }
 *
 * La llave del documento se calcula con la MISMA lógica que el frontend
 * (generarLlaveMaestra): `${comuna.toLowerCase().sinEspacios}_${zona.toLowerCase().sinEspacios.slash->_}`.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECTS = { dev: 'archibots-dev', prod: 'archibots-497423' };
const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.json'));
const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'prod';
const dryRun = args.includes('--dry-run');
const comunaDef = args.includes('--comuna') ? args[args.indexOf('--comuna') + 1] : 'Ñuñoa';
const DB_ID = args.includes('--database') ? args[args.indexOf('--database') + 1] : 'coordenadasnormativas';

if (!file) {
  console.error('Uso: node seed-normativas.mjs <fichas.json> --env prod [--dry-run] [--comuna "Ñuñoa"] [--database coordenadasnormativas]');
  process.exit(1);
}

function llaveMaestra(comuna, zona) {
  const c = String(comuna).toLowerCase().replace(/\s+/g, '');
  const z = String(zona).toLowerCase().replace(/\s+/g, '').replace(/[/\\]/g, '_');
  return `${c}_${z}`;
}

const projectId = PROJECTS[env] ?? env;
const app = initializeApp({ projectId });
const db = getFirestore(app, DB_ID);

const raw = JSON.parse(readFileSync(file, 'utf-8'));
const items = [];
if (Array.isArray(raw)) {
  for (const f of raw) {
    const zona = f.zona ?? f.ZONA ?? f.codigoZona ?? f.NOM;
    if (!zona) continue;
    const id = f.id ?? llaveMaestra(f.comuna ?? comunaDef, zona);
    items.push({ id, data: f });
  }
} else if (raw && typeof raw === 'object') {
  for (const [k, v] of Object.entries(raw)) items.push({ id: k, data: v });
}

if (!items.length) { console.error('❌ Sin fichas válidas (revisa el formato del JSON).'); process.exit(1); }

console.log(`Proyecto: ${projectId} · base: ${DB_ID} · fichas: ${items.length}${dryRun ? ' · DRY-RUN' : ''}`);
console.log('Ejemplo de IDs:', items.slice(0, 5).map((i) => i.id).join(', '));
if (dryRun) { console.log('DRY-RUN: no se escribió nada.'); process.exit(0); }

let n = 0;
for (let i = 0; i < items.length; i += 450) {
  const chunk = items.slice(i, i + 450);
  const batch = db.batch();
  for (const { id, data } of chunk) batch.set(db.collection('normativas_prc').doc(id), data, { merge: true });
  await batch.commit();
  n += chunk.length;
  console.log(`  sembradas ${n}/${items.length}`);
}
console.log(`✅ Listo: ${n} fichas en normativas_prc (base ${DB_ID} de ${projectId}).`);
