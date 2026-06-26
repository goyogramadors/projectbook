/* =============================================================================
   build-catalogos-construccion.mjs
   -----------------------------------------------------------------------------
   Genera los catálogos de datos TIPADOS de las herramientas de Construcción
   (Generador de EETT y Presupuesto) a partir de los .md FUENTE en
   DESARROLLO/EETT y Presupuesto/. Los .md siguen siendo la fuente editable;
   este script los normaliza a TS para consumo en runtime (sin parsear md en
   el navegador). Uso:  node Web/scripts/build-catalogos-construccion.mjs
   Salidas: Web/src/tools/construccion/catalogo.eett.ts
            Web/src/tools/construccion/catalogo.presupuesto.ts
   La gramática `activaSi` (canónica) la evalúa Web/src/tools/construccion/activaSi.ts.
   ============================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..', '..');               // raíz del repo
const SRC = resolve(ROOT, 'DESARROLLO', 'EETT y Presupuesto');
const OUT = resolve(__dir, '..', 'src', 'tools', 'construccion');

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

/* ── 1 · EETT ────────────────────────────────────────────────────────────── */
function buildEett() {
  const md = readFileSync(resolve(SRC, 'CATALOGO_EETT_RESUMIDAS.md'), 'utf8');
  const lines = md.split(/\r?\n/);
  const items = [];
  let cap = null, started = false, cur = null, field = null;
  const flush = () => { if (cur && cur.texto) items.push(cur); cur = null; field = null; };
  for (const ln of lines) {
    const mc = ln.match(/^#\s+Cap[ií]tulo\s+(\d+)/i);
    if (mc) { flush(); cap = Number(mc[1]); started = true; continue; }
    if (!started) continue;
    const mp = ln.match(/^###\s+\[([^\]]+)\]\s+(.*)$/);
    if (mp) { flush(); cur = { id: mp[1].trim(), cap, titulo: mp[2].trim(), nch1150: '', activaSi: '', texto: '' }; continue; }
    if (!cur) continue;
    let m;
    if ((m = ln.match(/^-\s*nch1150:\s*(.*)$/i))) { cur.nch1150 = m[1].trim(); field = null; }
    else if ((m = ln.match(/^-\s*activa_si:\s*(.*)$/i))) { cur.activaSi = normEett(m[1].trim()); field = null; }
    else if ((m = ln.match(/^-\s*texto:\s*(.*)$/i))) { cur.texto = m[1].trim(); field = 'texto'; }
    else if (field === 'texto' && ln.trim() && !ln.startsWith('---')) { cur.texto += ' ' + ln.trim(); }
    else if (ln.startsWith('---') || ln.startsWith('#')) { field = null; }
  }
  flush();
  return items;
}
// Normaliza variantes de activa_si de EETT a la gramática canónica.
function normEett(s) {
  let t = s;
  t = t.replace(/\s*\(lista poblada[^)]*\)/i, '');     // "siempre (lista poblada…)" → "siempre"
  if (/^opcional/i.test(t)) return 'opcional';
  if (/^condici[oó]n l[oó]gica/i.test(t)) return 'siempre'; // ejemplo de la doc (no debería llegar)
  t = t.replace(/cielos\s*≠\s*sin_cielo/i, 'cielos no vacío');
  return t.trim();
}

/* ── 2 · PRESUPUESTO ─────────────────────────────────────────────────────── */
// Mapa taquigrafía .md → gramática canónica (misma que evalúa activaSi.ts).
const PRESU_MAP = {
  'siempre': 'siempre',
  'obra_nueva/ampliacion/reconstruccion': 'naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}',
  'nat ≠ obra_menor': 'naturaleza ≠ obra_menor',
  'obra_nueva/reconstruccion o urbanización': 'naturaleza ∈ {obra_nueva, reconstruccion} OR urbanizacion incluye algo',
  'fundaciones + obra nueva/ampl./recon.': 'fundaciones = sí AND naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}',
  'fundaciones + obra nueva/recon.': 'fundaciones = sí AND naturaleza ∈ {obra_nueva, reconstruccion}',
  'demoliciones': 'demoliciones = sí',
  'demoliciones + (baños o instalaciones)': 'demoliciones = sí AND (banos = sí OR instalaciones no vacío)',
  'fundaciones': 'fundaciones = sí',
  'radier o fundaciones': 'radier = sí OR fundaciones = sí',
  'sobrelosa': 'sobrelosa = sí',
  'obra nueva/ampl./recon.': 'naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}',
  'obra nueva/ampl./recon. + (hormigón o metálica)': 'naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion} AND estructura incluye {hormigon, metalica}',
  'techumbre': 'techumbre = sí',
  'tabiquería': 'tabiqueria = sí',
  'rev_muros ≠ solo obra gruesa': 'rev_muros ≠ solo_obra_gruesa',
  'cielos ≠ solo obra gruesa': 'cielos ≠ solo_obra_gruesa',
  'pisos ≠ solo obra gruesa': 'pisos ≠ solo_obra_gruesa',
  'puertas': 'puertas no vacío',
  'ventanas': 'ventanas no vacío',
  'pinturas': 'pinturas = sí',
  'baños': 'banos = sí',
  'mobiliario': 'mobiliario = sí',
  'inst incluye eléctrica': 'instalaciones incluye electrica',
  'inst incluye sanitaria o baños': 'instalaciones incluye sanitaria OR banos = sí',
  'inst incluye climatización': 'instalaciones incluye climatizacion',
  'inst incluye gas': 'instalaciones incluye gas',
  'inst incluye corrientes débiles': 'instalaciones incluye corrientes_debiles',
  'inst incluye incendio': 'instalaciones incluye incendio',
  'inst incluye transporte vertical': 'instalaciones incluye transporte_vertical',
  'cumplir_termica': 'cumplir_termica = sí',
  'resistencia_fuego': 'resistencia_fuego = sí',
  'urb incluye pav. exterior': 'urbanizacion incluye pav_exterior',
  'urb incluye áreas verdes': 'urbanizacion incluye areas_verdes',
  'urb incluye cierros': 'urbanizacion incluye cierros',
  'urb incluye aguas lluvias': 'urbanizacion incluye aguas_lluvia',
};
function buildPresu() {
  const md = readFileSync(resolve(SRC, 'CATALOGO_PRESUPUESTO_2.0.md'), 'utf8');
  const lines = md.split(/\r?\n/);
  const items = []; let cap = null, inParts = false;
  const unknown = [];
  for (const ln of lines) {
    if (/^##\s+1\.\s+Partidas/i.test(ln)) { inParts = true; continue; }
    if (inParts && /^##\s+\d/.test(ln) && !/^##\s+1\./.test(ln)) break; // fin sección 1
    if (!inParts) continue;
    const mc = ln.match(/^###\s+Cap[ií]tulo\s+(\d+)/i);
    if (mc) { cap = Number(mc[1]); continue; }
    if (!/^\|/.test(ln)) continue;
    const cells = ln.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 6) continue;
    if (/^id$/i.test(cells[0]) || /^-+$/.test(cells[0])) continue; // header / separador
    const [id, partida, unidad, puRaw, cantDef, actRaw] = cells;
    const pu = Number(puRaw.replace(/\./g, '').replace(',', '.'));
    const activaSi = PRESU_MAP[actRaw] ?? null;
    if (activaSi === null) unknown.push(`${id}: "${actRaw}"`);
    items.push({ id, cap, partida, unidad, puUF: pu, cantDef: cantDef.replace('—', ''), activaSi: activaSi ?? 'siempre' });
  }
  if (unknown.length) { console.error('activa_si NO mapeada:\n' + unknown.join('\n')); process.exit(1); }
  return items;
}

/* ── 2b · GANTT (plazos por capítulo) ─────────────────────────────────────── */
function buildGantt() {
  const md = readFileSync(resolve(SRC, 'CATALOGO_GANTT_PLAZOS.md'), 'utf8');
  const lines = md.split(/\r?\n/);
  const items = []; let inParts = false;
  for (const ln of lines) {
    if (/^##\s+1\.\s+Plazos/i.test(ln)) { inParts = true; continue; }
    if (inParts && /^##\s+\d/.test(ln) && !/^##\s+1\./.test(ln)) break;
    if (!inParts || !/^\|/.test(ln)) continue;
    const cells = ln.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 5) continue;
    if (/^orden$/i.test(cells[0]) || /^-+$/.test(cells[0])) continue;
    const [orden, cap, nombre, semanas, solape] = cells;
    items.push({ orden: Number(orden), cap: Number(cap), nombre, semanas: Number(semanas), solape: Number(solape) });
  }
  return items.sort((a, b) => a.orden - b.orden);
}

/* ── 3 · Emisión ─────────────────────────────────────────────────────────── */
const eett = buildEett();
const presu = buildPresu();
const gantt = buildGantt();

const eettTs = `/* AUTO-GENERADO por Web/scripts/build-catalogos-construccion.mjs — NO editar a mano.
   Fuente: DESARROLLO/EETT y Presupuesto/CATALOGO_EETT_RESUMIDAS.md */
export interface PartidaEett { id: string; cap: number; titulo: string; nch1150: string; activaSi: string; texto: string; }
export const CATALOGO_EETT: PartidaEett[] = [
${eett.map((p) => `  { id: ${JSON.stringify(p.id)}, cap: ${p.cap}, titulo: ${JSON.stringify(p.titulo)}, nch1150: ${JSON.stringify(p.nch1150)}, activaSi: ${JSON.stringify(p.activaSi)}, texto: \`${esc(p.texto)}\` },`).join('\n')}
];
`;

const presuTs = `/* AUTO-GENERADO por Web/scripts/build-catalogos-construccion.mjs — NO editar a mano.
   Fuente: DESARROLLO/EETT y Presupuesto/CATALOGO_PRESUPUESTO_2.0.md */
export interface PartidaPresupuesto { id: string; cap: number; partida: string; unidad: string; puUF: number; cantDef: 'm2' | 'glob' | ''; activaSi: string; }
export const CATALOGO_PRESUPUESTO: PartidaPresupuesto[] = [
${presu.map((p) => `  { id: ${JSON.stringify(p.id)}, cap: ${p.cap}, partida: ${JSON.stringify(p.partida)}, unidad: ${JSON.stringify(p.unidad)}, puUF: ${p.puUF}, cantDef: ${JSON.stringify(p.cantDef)}, activaSi: ${JSON.stringify(p.activaSi)} },`).join('\n')}
];
`;

const ganttTs = `/* AUTO-GENERADO por Web/scripts/build-catalogos-construccion.mjs — NO editar a mano.
   Fuente: DESARROLLO/EETT y Presupuesto/CATALOGO_GANTT_PLAZOS.md */
export interface PlazoCapitulo { orden: number; cap: number; nombre: string; semanas: number; solape: number; }
export const CATALOGO_GANTT: PlazoCapitulo[] = [
${gantt.map((g) => `  { orden: ${g.orden}, cap: ${g.cap}, nombre: ${JSON.stringify(g.nombre)}, semanas: ${g.semanas}, solape: ${g.solape} },`).join('\n')}
];
`;

writeFileSync(resolve(OUT, 'catalogo.eett.ts'), eettTs);
writeFileSync(resolve(OUT, 'catalogo.presupuesto.ts'), presuTs);
writeFileSync(resolve(OUT, 'catalogo.gantt.ts'), ganttTs);
console.log(`OK · EETT: ${eett.length} · Presupuesto: ${presu.length} · Gantt: ${gantt.length} capítulos`);
