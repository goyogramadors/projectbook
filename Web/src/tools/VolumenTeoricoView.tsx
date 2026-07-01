/* =============================================================================
   VolumenTeoricoView.tsx — VOLUMEN TEÓRICO / ESTUDIO DE CABIDA (T-10)
   -----------------------------------------------------------------------------
   Envolvente máxima edificable: a partir del predio y la normativa (CIP) calcula
   ocupación de suelo, polígono de retiros, adosamientos (OGUC 40%), constructibi-
   lidad, rasantes y la huella/volumen teórico, con un esquema isométrico SVG.
   NO consume datos de la base; persiste el estado en una subcolección Firestore
   (Premium: projects/{id}/volumen/estado) con fallback localStorage (Free).
   ============================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Maximize, Ruler, Home, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import { loadNormativa } from './normativaStore';
import { loadTerreno } from './terrenoStore';
import type { ToolProps } from '../core/types';

/* ── tipos ─────────────────────────────────────────────────────────────────── */
interface Adosamientos { izquierdo: boolean; derecho: boolean; fondo: boolean; }
interface Inputs {
  largo: number; ancho: number; coefConstructibilidad: number; ocupacionSuelo: number;
  alturaMaxima: number; rasante: number; anchoCalle: number; antejardin: number;
  distanciamiento: number; adosamientos: Adosamientos;
  /** Adosamiento POR deslinde (índice = segmento del polígono). No aplica a deslindes de vía. */
  adosaEdges?: boolean[];
  /** Distanciamiento por deslinde vecino (m). Índice = segmento. Default 3. */
  edgeDist?: number[];
  /** Antejardín por deslinde que enfrenta vía (m). Default 5. */
  edgeAnte?: number[];
  /** Ancho de vía por deslinde que enfrenta calle (m). Default 8. */
  edgeVia?: number[];
}
interface Resultados {
  superficieTerreno: number; ocupacionMaximaSuelo: number; areaPoligonoRetiros: number;
  porcentajeEfectivo: number; constructibilidadMaxima: number; areaBaseEdificable: number;
  volumenTeoricoBruto: number; anchoEdificable: number; largoEdificable: number; alturaEfectiva: number;
}

const STORAGE_KEY = (pid: string) => `ab-volumen-${pid}`;
const estadoDoc = (pid: string) => doc(db, 'projects', pid, 'volumen', 'estado');
const INPUTS_DEFECTO: Inputs = {
  largo: 40, ancho: 30, coefConstructibilidad: 2.5, ocupacionSuelo: 60, alturaMaxima: 21,
  rasante: 70, anchoCalle: 8, antejardin: 5, distanciamiento: 4,
  adosamientos: { izquierdo: false, derecho: false, fondo: false }, adosaEdges: [], edgeDist: [], edgeAnte: [], edgeVia: [],
};

/* ── helpers de UI (módulo) ────────────────────────────────────────────────── */
function NumberInput({ label, value, onChange, unit, min = 0, step = 1, disabled }: {
  label: string; value: number; onChange: (v: string) => void; unit?: string; min?: number; step?: number; disabled?: boolean;
}) {
  return (
    <div className="tech-input-group" style={{ marginBottom: 0 }}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type="number" min={min} step={step} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="tech-input" style={{ width: '100%', paddingRight: unit ? 28 : undefined }} />
        {unit && <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 13, color: 'var(--muted-foreground)', pointerEvents: 'none' }}>{unit}</span>}
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer', fontSize: 13 }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} /> {label}
    </label>
  );
}

/** Ángulo de rasante (grados) según la región del proyecto (OGUC): sur (Ñuble→Magallanes)
 *  = 60°; resto (Arica→Maule incl. RM) = 70°. */
function rasanteAngleForRegion(region?: string): number {
  const r = (region ?? '').toLowerCase();
  const sur = ['ñuble', 'nuble', 'biobío', 'biobio', 'araucanía', 'araucania', 'los ríos', 'los rios', 'los lagos', 'aisén', 'aisen', 'aysén', 'aysen', 'magallanes'];
  return sur.some((s) => r.includes(s)) ? 60 : 70;
}

/** Convierte el ring geográfico (lng,lat) a metros planos relativos al centroide
 *  (x=este, y=norte). Permite dibujar la forma real del terreno en el esquema 3D. */
function ringToPlanar(ring: Array<[number, number]>): Array<[number, number]> {
  if (ring.length < 3) return [];
  const lat0 = ring.reduce((s, [, la]) => s + la, 0) / ring.length;
  const lng0 = ring.reduce((s, [ln]) => s + ln, 0) / ring.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  return ring.map(([ln, la]) => [(ln - lng0) * k * 111320, (la - lat0) * 110540] as [number, number]);
}

type Pt2 = [number, number];
/** Intersección de dos rectas paramétricas (p + t·d). null si son paralelas. */
function segIntersect(p1: Pt2, d1: Pt2, p2: Pt2, d2: Pt2): Pt2 | null {
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}
/** Vértice de un anillo etiquetado con el deslinde de origen de la arista que le sigue. */
type TaggedPt = { p: Pt2; e: number };
/** Normal unitaria hacia ADENTRO de la arista i del polígono (respecto del centroide). */
function innerNormal(poly: Pt2[], i: number, cx: number, cy: number): Pt2 {
  const a = poly[i]!, b = poly[(i + 1) % poly.length]!;
  let nx = b[1] - a[1], ny = -(b[0] - a[0]); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  if ((cx - mx) * nx + (cy - my) * ny < 0) { nx = -nx; ny = -ny; }
  return [nx, ny];
}
/** Recorte de semiplano (Sutherland–Hodgman) de un anillo etiquetado: conserva el lado
 *  interior de la recta (punto lp, normal interior nrm). Los tramos NUEVOS que quedan sobre
 *  la recta de corte se etiquetan con `clipId` (el deslinde cuyo retiro los generó). */
function clipTagged(ring: TaggedPt[], lp: Pt2, nrm: Pt2, clipId: number): TaggedPt[] {
  const res: TaggedPt[] = []; const N = ring.length;
  const side = (p: Pt2) => (p[0] - lp[0]) * nrm[0] + (p[1] - lp[1]) * nrm[1];
  for (let i = 0; i < N; i++) {
    const cur = ring[i]!, nxt = ring[(i + 1) % N]!;
    const sc = side(cur.p), sn = side(nxt.p);
    const inter = (): Pt2 => { const t = sc / (sc - sn); return [cur.p[0] + t * (nxt.p[0] - cur.p[0]), cur.p[1] + t * (nxt.p[1] - cur.p[1])]; };
    if (sc >= 0) { res.push(cur); if (sn < 0) res.push({ p: inter(), e: clipId }); }
    else if (sn >= 0) { res.push({ p: inter(), e: cur.e }); }
  }
  return res;
}
function ringArea(pp: Pt2[]): number { let a = 0; for (let i = 0; i < pp.length; i++) { const j = (i + 1) % pp.length; a += pp[i]![0] * pp[j]![1] - pp[j]![0] * pp[i]![1]; } return Math.abs(a) / 2; }

/** Retiro por BISECTRICES (esqueleto recto): cada deslinde se mueve hacia adentro `offs[i]` por su
 *  PROPIA recta y las aristas se unen en miter. A diferencia del retiro por semiplanos, un
 *  tramo NO recorta la zona de otro tramo de la misma orientación (respeta escalones): así el
 *  deslinde 4 no limita el crecimiento hacia el deslinde 6. Las aristas que se invierten (esquinas
 *  agudas / offset excesivo) se eliminan iterativamente para no generar "spikes". Devuelve el
 *  anillo etiquetado por deslinde de origen. */
function miterOffsetTagged(poly: Pt2[], offs: number[]): TaggedPt[] {
  const n = poly.length;
  const cx = poly.reduce((s, p) => s + p[0], 0) / n, cy = poly.reduce((s, p) => s + p[1], 0) / n;
  let active = poly.map((a, i) => {
    const b = poly[(i + 1) % n]!; const [nx, ny] = innerNormal(poly, i, cx, cy); const o = offs[i] ?? 0;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    return { tag: i, p: [mx + nx * o, my + ny * o] as Pt2, dir: [b[0] - a[0], b[1] - a[1]] as Pt2 };
  });
  const verts = () => active.map((e, k) => { const pr = active[(k - 1 + active.length) % active.length]!; return segIntersect(pr.p, pr.dir, e.p, e.dir) ?? e.p; });
  for (let iter = 0; iter < n + 2 && active.length >= 3; iter++) {
    const m = active.length, V = verts();
    let worst = -1, worstVal = -1e-6;
    for (let k = 0; k < m; k++) { // arista k = de V[k] a V[k+1]; si va en contra de su dirección, colapsó
      const seg: Pt2 = [V[(k + 1) % m]![0] - V[k]![0], V[(k + 1) % m]![1] - V[k]![1]];
      const dot = seg[0] * active[k]!.dir[0] + seg[1] * active[k]!.dir[1];
      if (dot < worstVal) { worstVal = dot; worst = k; }
    }
    if (worst < 0) return active.map((e, k) => ({ p: V[k]!, e: e.tag })); // todas válidas
    active.splice(worst, 1);
  }
  return active.length >= 3 ? active.map((e, k) => ({ p: verts()[k]!, e: e.tag })) : [];
}

/* ── visualizador isométrico (módulo) ──────────────────────────────────────── */
function Visualizador3D({ inputs, resultados, poly, polyEdges, polyAdosa, hOverride, rasAngle }: { inputs: Inputs; resultados: Resultados; poly?: Array<[number, number]> | null; polyEdges?: boolean[]; polyAdosa?: boolean[]; hOverride?: number; rasAngle?: number }) {
  const { largo, ancho, anchoCalle, antejardin, distanciamiento, adosamientos } = inputs;
  const angle = Math.PI / 6;
  const COS = Math.cos(angle), SIN = Math.sin(angle);
  const PISO = 3.5; // altura de piso (m) para la separación del modelo

  // Isometría con la CALLE HACIA EL FRENTE (hacia el observador): respecto de la
  // versión anterior se niega la profundidad `y` (la calle, en y<0, cae más abajo =
  // más cerca). z es altura y sube en pantalla.
  const P = (x: number, y: number, z: number) => ({ x: (x + y) * COS, y: (x - y) * SIN - z });

  const hCore = resultados.alturaEfectiva || 0;
  const wEd = resultados.anchoEdificable || 0;
  const lEd = resultados.largoEdificable || 0;
  const hAdos = Math.min(PISO, hCore);
  const nPisos = hCore > 0 ? Math.max(1, Math.round(hCore / PISO)) : 0;
  const bx = distanciamiento, by = antejardin;

  // ── Auto-encuadre: proyecta puntos clave y centra/escala al viewBox 400×400 ──
  const key: Array<{ x: number; y: number }> = [];
  const add = (x: number, y: number, z: number) => key.push(P(x, y, z));
  const M = 8; // margen lateral de la calle
  add(-M, -anchoCalle, 0); add(ancho + M, -anchoCalle, 0); add(ancho, largo, 0); add(0, largo, 0);
  if (wEd > 0 && lEd > 0) {
    add(bx, by, 0); add(bx + wEd, by, 0); add(bx + wEd, by + lEd, 0); add(bx, by + lEd, 0);
    add(bx, by, hCore); add(bx + wEd, by, hCore); add(bx + wEd, by + lEd, hCore); add(bx, by + lEd, hCore);
  }
  const xs = key.map(k => k.x), ys = key.map(k => k.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY);
  const fit = Math.min(340 / spanX, 340 / spanY);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const gTransform = `translate(200 200) scale(${fit.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;

  const pts = (arr: Array<{ x: number; y: number }>) => arr.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const [rot, setRot] = useState(0); // azimut de rotación del modelo (arrastrar)
  const dragRef = useRef<{ x: number; rot0: number } | null>(null);

  // ── MODO POLÍGONO REAL: si hay terreno dibujado, extruye su forma exacta ─────
  if (poly && poly.length >= 3) {
    const n = poly.length;
    const h = (hOverride != null && hOverride > 0) ? hOverride : (hCore > 0 ? hCore : PISO);
    const Pp = (x: number, y: number, z: number) => ({ x: (x + y) * COS, y: (x - y) * SIN - z });
    const cX = poly.reduce((s, [x]) => s + x, 0) / n;
    const cY = poly.reduce((s, [, y]) => s + y, 0) / n;
    const rad = (rot * Math.PI) / 180;
    const rotXY = (x: number, y: number): [number, number] => {
      const dx = x - cX, dy = y - cY;
      return [cX + dx * Math.cos(rad) - dy * Math.sin(rad), cY + dx * Math.sin(rad) + dy * Math.cos(rad)];
    };
    const Pr = (x: number, y: number, z: number) => { const [rx, ry] = rotXY(x, y); return Pp(rx, ry, z); };
    const outN = (i: number): [number, number] => {
      const a = poly[i]!, b = poly[(i + 1) % n]!;
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if ((mx - cX) * nx + (my - cY) * ny < 0) { nx = -nx; ny = -ny; }
      return [nx, ny];
    };

    // Retiros por deslinde (frente→antejardín; vecino→distanciamiento) y origen de rasante.
    const offs = poly.map((_, i) => (polyEdges && polyEdges[i]) ? (inputs.edgeAnte?.[i] ?? 5) : (inputs.edgeDist?.[i] ?? 3));
    const qOff = poly.map((_, i) => (polyEdges && polyEdges[i]) ? (inputs.edgeVia?.[i] ?? 8) / 2 : 0); // origen rasante fuera del deslinde (eje de calzada)
    const nInner = poly.map((_, i) => innerNormal(poly as Pt2[], i, cX, cY)); // normal interior por deslinde
    const groundPts = poly.map(([x, y]) => Pr(x, y, 0));

    // ── RASANTE COMO FALDÓN — sólido HERMÉTICO construido desde la HUELLA (esquinas de base
    // compartidas) emparejada con la CUMBRERA por deslinde. Por cada arista de huella: muro
    // vertical hasta el alero `hWall` + faldón inclinado hasta la cumbrera. Cada esquina se
    // cierra con un triángulo de limatesa (aleros vecinos a distinta altura). ──
    const tanR = Math.tan(((rasAngle ?? 70) * Math.PI) / 180);
    const hWallOf = (d: number) => Math.min(h, 3.5 + Math.max(0, offs[d]! + qOff[d]!) * tanR); // alero del deslinde d
    const sRidge = poly.map((_, i) => (tanR > 0 ? (h - 3.5) / tanR - qOff[i]! : offs[i]!)); // retiro para alcanzar `h`
    const topOffs = poly.map((_, i) => Math.max(offs[i]!, sRidge[i]!));
    let baseRing = miterOffsetTagged(poly as Pt2[], offs);        // HUELLA edificable (retiro por bisectrices)
    if (baseRing.length < 3 || ringArea(baseRing.map((r) => r.p)) < ringArea(poly as Pt2[]) * 0.04) baseRing = (poly as Pt2[]).map((p, i) => ({ p, e: i }));
    let topRing = miterOffsetTagged(poly as Pt2[], topOffs);      // CUMBRERA (techo plano a `h`)
    let flatTop: number | null = null;                           // si la cumbrera colapsa → techo plano
    if (topRing.length < 3) { topRing = baseRing; flatTop = Math.min(...baseRing.map((r) => hWallOf(r.e))); }
    const topZ = flatTop != null ? flatTop : h;
    const B = baseRing.length;
    const zsP: number[] = [];
    for (let k = 1; k * PISO < topZ - 1e-6; k++) zsP.push(k * PISO); // TODOS los pisos hasta la altura del techo

    // Cumbrera indexada por deslinde: la arista de cumbrera con el mismo tag que la de huella.
    const topByTag = new Map<number, { a: Pt2; b: Pt2 }>();
    for (let t = 0; t < topRing.length; t++) { const d = topRing[t]!.e; if (!topByTag.has(d)) topByTag.set(d, { a: topRing[t]!.p, b: topRing[(t + 1) % topRing.length]!.p }); }
    const depthOf = (p: Pt2, q: Pt2) => { const a = rotXY(p[0], p[1]), b = rotXY(q[0], q[1]); return a[0] - a[1] + b[0] - b[1]; };

    type Piece = { kind: 'wall' | 'faldon' | 'hip'; depth: number; quad: Array<{ x: number; y: number }>; floor?: { hA: Pt2; hB: Pt2; cA: Pt2; cB: Pt2; eaveH: number; zmin: number } };
    const pieces: Piece[] = [];
    for (let j = 0; j < B; j++) {
      const d = baseRing[j]!.e; const hA = baseRing[j]!.p, hB = baseRing[(j + 1) % B]!.p;
      const eaveH = flatTop != null ? topZ : hWallOf(d);
      const top = topByTag.get(d);
      pieces.push({ kind: 'wall', depth: depthOf(hA, hB), quad: [Pr(hA[0], hA[1], 0), Pr(hB[0], hB[1], 0), Pr(hB[0], hB[1], eaveH), Pr(hA[0], hA[1], eaveH)], floor: { hA, hB, cA: hA, cB: hB, eaveH, zmin: 0 } });
      if (flatTop == null && top && eaveH < topZ - 1e-6) {
        const cA = top.a, cB = top.b;
        pieces.push({ kind: 'faldon', depth: depthOf(hA, hB) + 0.01, quad: [Pr(hA[0], hA[1], eaveH), Pr(hB[0], hB[1], eaveH), Pr(cB[0], cB[1], topZ), Pr(cA[0], cA[1], topZ)], floor: { hA, hB, cA, cB, eaveH, zmin: eaveH } });
      }
    }
    if (flatTop == null) { // triángulos de limatesa: cierran la ranura de esquina entre aleros vecinos
      for (let j = 0; j < B; j++) {
        const d = baseRing[j]!.e, d2 = baseRing[(j + 1) % B]!.e;
        const corner = baseRing[(j + 1) % B]!.p; const t1 = topByTag.get(d), t2 = topByTag.get(d2);
        if (!t1 || !t2) continue;
        const e1 = hWallOf(d), e2 = hWallOf(d2); if (Math.abs(e1 - e2) < 1e-3) continue;
        const apex = t1.b; // vértice de cumbrera compartido entre las cumbreras de d y d2
        if (Math.hypot(apex[0] - t2.a[0], apex[1] - t2.a[1]) > 0.5) continue; // sólo si de veras comparten vértice
        pieces.push({ kind: 'hip', depth: depthOf(corner, corner) + 0.02, quad: [Pr(corner[0], corner[1], e1), Pr(corner[0], corner[1], e2), Pr(apex[0], apex[1], topZ)] });
      }
    }
    pieces.sort((u, v) => u.depth - v.depth);
    const topCap = topRing.map(({ p }) => Pr(p[0], p[1], topZ));

    // Calles: banda gris hacia afuera por cada deslinde de vía; esquinas unidas (miter)
    // entre deslindes de vía contiguos; eje discontinuo PARALELO al frente.
    const offLine = (i: number, w: number) => { const a = poly[i]!, b = poly[(i + 1) % n]!; const [nx, ny] = outN(i); return { p: [a[0] + nx * w, a[1] + ny * w] as Pt2, d: [b[0] - a[0], b[1] - a[1]] as Pt2 }; };
    const streets = poly.map(([ax, ay], i) => {
      if (!(polyEdges && polyEdges[i])) return null;
      const b = poly[(i + 1) % n]!; const [nx, ny] = outN(i); const w = inputs.edgeVia?.[i] ?? 8;
      const li = offLine(i, w);
      const prevS = !!(polyEdges && polyEdges[(i - 1 + n) % n]);
      const nextS = !!(polyEdges && polyEdges[(i + 1) % n]);
      const lp = offLine((i - 1 + n) % n, inputs.edgeVia?.[(i - 1 + n) % n] ?? 8);
      const ln = offLine((i + 1) % n, inputs.edgeVia?.[(i + 1) % n] ?? 8);
      const oA: Pt2 = prevS ? (segIntersect(lp.p, lp.d, li.p, li.d) ?? [ax + nx * w, ay + ny * w]) : [ax + nx * w, ay + ny * w];
      const oB: Pt2 = nextS ? (segIntersect(li.p, li.d, ln.p, ln.d) ?? [b[0] + nx * w, b[1] + ny * w]) : [b[0] + nx * w, b[1] + ny * w];
      const quad: Array<[number, number]> = [[ax, ay], [b[0], b[1]], oB, oA];
      const eje: Array<[number, number]> = [[ax + nx * w / 2, ay + ny * w / 2], [b[0] + nx * w / 2, b[1] + ny * w / 2]];
      return { quad: quad.map(([x, y]) => Pr(x, y, 0)), eje: eje.map(([x, y]) => Pr(x, y, 0)) };
    }).filter(Boolean) as Array<{ quad: Array<{ x: number; y: number }>; eje: Array<{ x: number; y: number }> }>;

    // Bloque de ADOSAMIENTO: muro ≤3,5 m en ≤40% (centrado) del deslinde adosado. Se RECORTA
    // por el retiro de cada deslinde vecino NO adosado, de modo que NO invada su
    // distanciamiento/antejardín; si tras el recorte no queda superficie, no se dibuja.
    const adosaBlocks = poly.map(([ax, ay], i) => {
      const street = !!(polyEdges && polyEdges[i]);
      if (street || !(polyAdosa && polyAdosa[i])) return null;
      const b = poly[(i + 1) % n]!; const [nx, ny] = nInner[i]!;
      const ex = b[0] - ax, ey = b[1] - ay;
      const off = inputs.edgeDist?.[i] ?? 3;
      const lerp = (t: number): [number, number] => [ax + ex * t, ay + ey * t];
      const p0 = lerp(0.3), p1 = lerp(0.7);                               // 40% centrado (tope OGUC)
      let ring: TaggedPt[] = [
        { p: p0, e: i }, { p: p1, e: i },
        { p: [p1[0] + nx * off, p1[1] + ny * off], e: i },                // hacia adentro por el distanciamiento
        { p: [p0[0] + nx * off, p0[1] + ny * off], e: i },
      ];
      for (const k of [(i - 1 + n) % n, (i + 1) % n]) {                   // recorta esquinas vs. vecinos
        const st = !!(polyEdges && polyEdges[k]);
        const ad = !!(polyAdosa && polyAdosa[k]) && !st;
        if (ad) continue;                                                 // vecino también adosado → sin recorte
        const clr = st ? (inputs.edgeAnte?.[k] ?? 5) : (inputs.edgeDist?.[k] ?? 3);
        const [kx, ky] = nInner[k]!;
        ring = clipTagged(ring, [poly[k]![0] + kx * clr, poly[k]![1] + ky * clr], [kx, ky], k);
        if (ring.length < 3) return null;                                 // no cabe sin invadir retiro vecino
      }
      const hA = Math.min(3.5, h);
      return { bpts: ring.map(({ p }) => Pr(p[0], p[1], 0)), tpts: ring.map(({ p }) => Pr(p[0], p[1], hA)) };
    }).filter(Boolean) as Array<{ bpts: Array<{ x: number; y: number }>; tpts: Array<{ x: number; y: number }> }>;

    const allP = [...groundPts, ...pieces.flatMap((p) => p.quad), ...topCap, ...streets.flatMap((s) => s.quad), ...adosaBlocks.flatMap((a) => a.tpts)];
    const axs = allP.map((q) => q.x), ays = allP.map((q) => q.y);
    const nX = Math.min(...axs), xX = Math.max(...axs), nY = Math.min(...ays), xY = Math.max(...ays);
    const pfit = Math.min(340 / Math.max(1, xX - nX), 340 / Math.max(1, xY - nY));
    const pcx = (nX + xX) / 2, pcy = (nY + xY) / 2;
    const pT = `translate(200 200) scale(${pfit.toFixed(4)}) translate(${(-pcx).toFixed(2)} ${(-pcy).toFixed(2)})`;

    const labels = poly.map(([ax, ay], i) => {
      const b = poly[(i + 1) % n]!; const [nx, ny] = outN(i);
      const pr = Pr((ax + b[0]) / 2 + nx * 2, (ay + b[1]) / 2 + ny * 2, 0);
      return { i, sx: 200 + pfit * (pr.x - pcx), sy: 200 + pfit * (pr.y - pcy), street: !!(polyEdges && polyEdges[i]) };
    });

    return (
      <div style={{ width: '100%', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 300, flex: 1 }}>
        <div style={{ padding: 10, background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Maximize size={12} /> Volumen edificable (retiros) · pisos c/{PISO} m{nPisos > 0 ? ` (≈${nPisos})` : ''}</span>
          <button type="button" onClick={() => setRot(0)} className="technical-btn secondary" style={{ fontSize: 9, padding: '2px 8px' }}>↺ Vista</button>
        </div>
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}
          onPointerDown={(e) => { dragRef.current = { x: e.clientX, rot0: rot }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => { if (dragRef.current) setRot(dragRef.current.rot0 + (e.clientX - dragRef.current.x) * 0.6); }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerLeave={() => { dragRef.current = null; }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 400">
            <g transform={pT}>
              {streets.map((s, k) => (
                <g key={`st${k}`}>
                  <polygon points={pts(s.quad)} fill="#d0d0d0" stroke="#9a9a9a" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  <line x1={s.eje[0]!.x} y1={s.eje[0]!.y} x2={s.eje[1]!.x} y2={s.eje[1]!.y} stroke="#ffffff" strokeWidth={1.4} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
              <polygon points={pts(groundPts)} fill="var(--card)" stroke="none" vectorEffect="non-scaling-stroke" />
              {poly.map((_, i) => {
                const a = groundPts[i]!, b = groundPts[(i + 1) % n]!;
                const street = !!(polyEdges && polyEdges[i]);
                const adosa = !!(polyAdosa && polyAdosa[i]) && !street;
                const col = street ? '#7a1f2b' : (adosa ? 'var(--primary)' : '#111111');
                return <line key={`d${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth={street ? 3.2 : 1.6} vectorEffect="non-scaling-stroke" />;
              })}
              {pieces.map((f, k) => (
                <g key={k}>
                  <polygon points={pts(f.quad)} fill="var(--destructive)" fillOpacity={f.kind === 'wall' ? 0.5 : f.kind === 'hip' ? 0.6 : 0.68} stroke="var(--foreground)" strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  {f.floor && zsP.map((zz, z) => { // línea de piso: en el muro (t=0) o interpolada sobre el faldón
                    if (zz <= f.floor!.zmin - 1e-6 || zz >= topZ - 1e-6) return null;
                    const t1 = zz <= f.floor!.eaveH || topZ <= f.floor!.eaveH ? 0 : (zz - f.floor!.eaveH) / (topZ - f.floor!.eaveH);
                    const ax = f.floor!.hA[0] + (f.floor!.cA[0] - f.floor!.hA[0]) * t1, ay = f.floor!.hA[1] + (f.floor!.cA[1] - f.floor!.hA[1]) * t1;
                    const bx = f.floor!.hB[0] + (f.floor!.cB[0] - f.floor!.hB[0]) * t1, by = f.floor!.hB[1] + (f.floor!.cB[1] - f.floor!.hB[1]) * t1;
                    const p1 = Pr(ax, ay, zz), p2 = Pr(bx, by, zz);
                    return <line key={z} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--foreground)" strokeWidth={0.7} strokeOpacity={0.5} vectorEffect="non-scaling-stroke" />;
                  })}
                </g>
              ))}
              {topCap.length >= 3 && <polygon points={pts(topCap)} fill="var(--destructive)" fillOpacity={0.9} stroke="var(--foreground)" strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
              {adosaBlocks.map((ab, k) => (
                <g key={`ad${k}`}>
                  {ab.bpts.map((_, eIdx) => { const j = (eIdx + 1) % ab.bpts.length; return <polygon key={eIdx} points={pts([ab.bpts[eIdx]!, ab.bpts[j]!, ab.tpts[j]!, ab.tpts[eIdx]!])} fill="var(--primary)" fillOpacity={0.6} stroke="var(--foreground)" strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />; })}
                  <polygon points={pts(ab.tpts)} fill="var(--primary)" fillOpacity={0.85} stroke="var(--foreground)" strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </g>
            {labels.map((l) => (
              <text key={`n${l.i}`} x={l.sx} y={l.sy} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="bold" fill={l.street ? '#7a1f2b' : '#111111'} stroke="#ffffff" strokeWidth={0.6} paintOrder="stroke">{l.i + 1}</text>
            ))}
            <text x={200} y={392} textAnchor="middle" fontSize={9} fontWeight="bold" fill="var(--muted-foreground)">Arrastra para rotar · nº = deslinde · gris = calle · rojo = volumen · faldón inclinado = recorte por rasante</text>
          </svg>
        </div>
      </div>
    );
  }
  // Caja con las 3 caras visibles (techo + frente hacia la calle + lado derecho) y,
  // opcionalmente, líneas de separación de pisos cada PISO metros.
  const box = (x: number, y: number, z: number, w: number, l: number, h: number, fill: string, stroke: string, floors: boolean) => {
    const A = P(x, y, z), B = P(x + w, y, z), C = P(x + w, y + l, z), D = P(x, y + l, z);
    const A2 = P(x, y, z + h), B2 = P(x + w, y, z + h), C2 = P(x + w, y + l, z + h), D2 = P(x, y + l, z + h);
    const zs: number[] = [];
    if (floors && h > 0) for (let k = 1; k * PISO < h - 1e-6; k++) zs.push(k * PISO);
    return (
      <g>
        <polygon points={pts([C, D, D2, C2])} fill={fill} fillOpacity={0.15} vectorEffect="non-scaling-stroke" />
        <polygon points={pts([D, A, A2, D2])} fill={fill} fillOpacity={0.15} vectorEffect="non-scaling-stroke" />
        <polygon points={pts([A2, B2, C2, D2])} fill={fill} fillOpacity={0.88} stroke={stroke} strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polygon points={pts([B, C, C2, B2])} fill={fill} fillOpacity={0.6} stroke={stroke} strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polygon points={pts([A, B, B2, A2])} fill={fill} fillOpacity={0.42} stroke={stroke} strokeWidth={1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {zs.map((zz, i) => {
          const f1 = P(x, y, zz), f2 = P(x + w, y, zz), r2 = P(x + w, y + l, zz);
          return (
            <g key={i}>
              <line x1={f1.x} y1={f1.y} x2={f2.x} y2={f2.y} stroke={stroke} strokeWidth={0.8} strokeOpacity={0.75} vectorEffect="non-scaling-stroke" />
              <line x1={f2.x} y1={f2.y} x2={r2.x} y2={r2.y} stroke={stroke} strokeWidth={0.8} strokeOpacity={0.75} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </g>
    );
  };

  const groundLot = [P(0, 0, 0), P(ancho, 0, 0), P(ancho, largo, 0), P(0, largo, 0)];
  const groundStreet = [P(-M, -anchoCalle, 0), P(ancho + M, -anchoCalle, 0), P(ancho + M, 0, 0), P(-M, 0, 0)];

  return (
    <div style={{ width: '100%', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 300, flex: 1 }}>
      <div style={{ padding: 10, background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Maximize size={12} /> Esquema Volumétrico 3D · pisos c/{PISO} m{nPisos > 0 ? ` (≈${nPisos})` : ''}</span>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Calle al frente</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400">
          <g transform={gTransform}>
            <polygon points={pts(groundLot)} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <polygon points={pts(groundStreet)} fill="var(--muted)" stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {hCore > 0 && wEd > 0 && lEd > 0 && (
              <>
                {box(bx, by, 0, wEd, lEd, hCore, 'var(--destructive)', 'var(--foreground)', true)}
                {adosamientos.fondo && box(bx, largo - distanciamiento, 0, Math.min(ancho * 0.4, wEd), distanciamiento, hAdos, 'var(--primary)', 'var(--foreground)', false)}
                {adosamientos.izquierdo && box(0, by, 0, distanciamiento, Math.min(largo * 0.4, largo - by), hAdos, 'var(--primary)', 'var(--foreground)', false)}
                {adosamientos.derecho && box(ancho - distanciamiento, by, 0, distanciamiento, Math.min(largo * 0.4, largo - by), hAdos, 'var(--primary)', 'var(--foreground)', false)}
              </>
            )}
          </g>
          <text x={200} y={390} textAnchor="middle" fontSize={10} fontWeight="bold" fill="var(--muted-foreground)">↓ CALLE / LÍNEA OFICIAL (frente) ↓</text>
        </svg>
      </div>
    </div>
  );
}

/* ── cálculo puro ──────────────────────────────────────────────────────────── */
function calcular(inp: Inputs): Resultados {
  const l = Math.max(0, Number(inp.largo) || 0);
  const w = Math.max(0, Number(inp.ancho) || 0);
  const supTerreno = l * w;
  const dist = Number(inp.distanciamiento);
  const ante = Number(inp.antejardin);

  const maxAdosLat = l * 0.4;
  const maxAdosFondo = w * 0.4;
  const wCoreBase = Math.max(0, w - 2 * dist);
  const lCoreBase = Math.max(0, l - ante - dist);
  const areaCoreBase = wCoreBase * lCoreBase;

  let areaAdos = 0;
  if (inp.adosamientos.izquierdo) areaAdos += dist * Math.min(maxAdosLat, l - ante);
  if (inp.adosamientos.derecho) areaAdos += dist * Math.min(maxAdosLat, l - ante);
  if (inp.adosamientos.fondo) areaAdos += dist * Math.min(maxAdosFondo, wCoreBase);

  const areaPoligonoRetiros = areaCoreBase + areaAdos;
  const ocupacionMaximaSuelo = supTerreno * (Number(inp.ocupacionSuelo) / 100);
  const areaEfectivaPlanta = Math.min(areaPoligonoRetiros, ocupacionMaximaSuelo);
  const porcentajeEfectivo = supTerreno > 0 ? (areaEfectivaPlanta / supTerreno) * 100 : 0;

  let factorOcupacion = 1;
  if (areaPoligonoRetiros > ocupacionMaximaSuelo && areaCoreBase > 0) {
    factorOcupacion = Math.sqrt(Math.max(0, ocupacionMaximaSuelo - areaAdos) / areaCoreBase);
  }
  const wCoreEf = wCoreBase * factorOcupacion;
  const lCoreEf = lCoreBase * factorOcupacion;
  const constructibilidadMaxima = supTerreno * Number(inp.coefConstructibilidad);

  // Altura del CUERPO: mínimo entre altura máxima normativa y la que impone la
  // constructibilidad. La RASANTE ya NO aplana la altura (no impide otro piso): recorta
  // el volumen en diagonal cerca de los deslindes — se resuelve como faldón en el 3D.
  let altPorConst = 0;
  if (areaEfectivaPlanta > 0) altPorConst = (constructibilidadMaxima / areaEfectivaPlanta) * 3;
  const alturaEfectiva = Math.min(Number(inp.alturaMaxima) || 0, altPorConst > 0 ? altPorConst : (Number(inp.alturaMaxima) || 0));
  const volumenTeoricoBruto = areaEfectivaPlanta * alturaEfectiva;

  return { superficieTerreno: supTerreno, ocupacionMaximaSuelo, areaPoligonoRetiros, porcentajeEfectivo, constructibilidadMaxima, areaBaseEdificable: areaEfectivaPlanta, volumenTeoricoBruto, anchoEdificable: wCoreEf, largoEdificable: lCoreEf, alturaEfectiva };
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function VolumenTeoricoView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);
  // Nube para TODO usuario logueado (repo.kind === 'cloud'); local solo invitado.
  const isCloud = repo.kind === 'cloud';

  const [saving, setSaving] = useState(false);
  const [inputs, setInputs] = useState<Inputs>(INPUTS_DEFECTO);
  const [terrenoArea, setTerrenoArea] = useState<number | null>(null); // área real del polígono (Geolocalizador)
  const [terrenoRing, setTerrenoRing] = useState<Array<[number, number]> | null>(null); // forma real (planar, m)
  const [terrenoEdges, setTerrenoEdges] = useState<boolean[]>([]); // faceStreet por deslinde
  const [dimsOpen, setDimsOpen] = useState(false); // DIMENSIONES DEL PREDIO colapsado por defecto

  useEffect(() => {
    if (!project) return;
    let alive = true;
    (async () => {
      // Área REAL del terreno (polígono del Geolocalizador/Ubicación) — referencia + semilla.
      let areaTerr = 0;
      try {
        const t = await loadTerreno(project.id, isCloud);
        if (t && t.areaM2 > 0) areaTerr = t.areaM2;
        if (alive && t && t.ring && t.ring.length >= 3) {
          setTerrenoRing(ringToPlanar(t.ring));
          setTerrenoEdges((t.edges ?? []).map((e) => !!e.faceStreet));
        }
      } catch { /* sin terreno */ }
      const areaLegal = Number(project.superficieTerrenoLegal) || 0;
      if (alive) setTerrenoArea(areaTerr || null);

      // ¿Cabida ya guardada? (nube o local) → tiene prioridad sobre las semillas.
      if (isCloud) {
        try {
          const snap = await getDoc(estadoDoc(project.id));
          if (alive && snap.exists()) { setInputs({ ...INPUTS_DEFECTO, ...(snap.data() as Partial<Inputs>) }); return; }
        } catch { /* offline / reglas → localStorage */ }
      }
      const raw = localStorage.getItem(STORAGE_KEY(project.id));
      if (alive && raw) { try { setInputs({ ...INPUTS_DEFECTO, ...(JSON.parse(raw) as Partial<Inputs>) }); return; } catch { /* corrupto */ } }

      // Sin cabida guardada → SIEMBRA: condiciones de edificación (ficha normativa del
      // Geolocalizador) + dimensiones del predio desde el área real (aprox. cuadrada; el
      // usuario ajusta frente/fondo si conoce la forma exacta).
      const seed: Inputs = { ...INPUTS_DEFECTO };
      try {
        const norm = await loadNormativa(project.id, isCloud);
        if (norm) {
          if (norm.alturaMaxima) seed.alturaMaxima = norm.alturaMaxima;
          if (norm.coefConstructibilidad) seed.coefConstructibilidad = norm.coefConstructibilidad;
          if (norm.ocupacionSuelo) seed.ocupacionSuelo = norm.ocupacionSuelo;
          const ante = parseFloat(String(norm.antejardin ?? '').replace(',', '.'));
          if (Number.isFinite(ante) && ante > 0) seed.antejardin = ante;
        }
      } catch { /* sin ficha → valores por defecto */ }
      seed.rasante = rasanteAngleForRegion(project.region); // ángulo de rasante por región (OGUC)
      const areaRef = areaTerr || areaLegal;
      if (areaRef > 0) { const lado = Math.round(Math.sqrt(areaRef)); seed.largo = lado; seed.ancho = lado; }
      if (alive) setInputs(seed);
    })();
    return () => { alive = false; };
  }, [project?.id, isCloud]);

  const resultados = useMemo(() => calcular(inputs), [inputs]);
  // Ángulo de rasante: se SIEMBRA por región (OGUC: sur 60° / resto 70°) pero es EDITABLE por el
  // usuario en el campo "Ángulo Rasante". Se usa el valor ingresado; si está vacío/0, cae a la
  // región. La rasante nace a 3,5 m sobre el deslinde (o el eje de calzada en los frentes) y sube
  // con este ángulo, recortando el volumen en diagonal cerca de cada deslinde (también los frentes).
  const rasAngle = Number(inputs.rasante) > 0 ? Number(inputs.rasante) : rasanteAngleForRegion(project?.region);
  const rasMaxH = useMemo(() => {
    const tanR = Math.tan((rasAngle * Math.PI) / 180);
    let m = Infinity;
    terrenoEdges.forEach((street, i) => {
      const d = street
        ? (inputs.edgeAnte?.[i] ?? 5) + (inputs.edgeVia?.[i] ?? 8) / 2   // origen en el eje de calzada
        : (inputs.edgeDist?.[i] ?? 3);                                    // origen en el deslinde vecino
      m = Math.min(m, 3.5 + d * tanR);
    });
    return Number.isFinite(m) ? m : (inputs.alturaMaxima || 0);
  }, [rasAngle, terrenoEdges, inputs.edgeAnte, inputs.edgeVia, inputs.edgeDist, inputs.adosaEdges, inputs.alturaMaxima]);
  const hBody = Math.min(resultados.alturaEfectiva || 0, inputs.alturaMaxima || Infinity);

  const setNum = (k: keyof Inputs) => (v: string) => setInputs(prev => ({ ...prev, [k]: Number(v) }));
  const toggleAdos = (k: keyof Adosamientos) => setInputs(prev => ({ ...prev, adosamientos: { ...prev.adosamientos, [k]: !prev.adosamientos[k] } }));
  const usarAreaTerreno = () => {
    if (readOnly || !terrenoArea) return;
    const lado = Math.round(Math.sqrt(terrenoArea));
    setInputs(prev => ({ ...prev, largo: lado, ancho: lado }));
    setDimsOpen(true);
    triggerToast(`Predio ajustado a ${terrenoArea.toLocaleString('es-CL')} m² (cuadrado ${lado}×${lado}). Ajusta frente/fondo si conoces la forma real.`);
  };
  /** Alterna el adosamiento en un deslinde (no permite en deslindes que enfrentan vía). */
  const toggleAdosaEdge = (i: number) => setInputs((prev) => {
    const arr = [...(prev.adosaEdges ?? [])];
    while (arr.length <= i) arr.push(false);
    arr[i] = !arr[i];
    return { ...prev, adosaEdges: arr };
  });
  const setEdgeNum = (key: 'edgeDist' | 'edgeAnte' | 'edgeVia', i: number) => (v: string) => setInputs((prev) => {
    const arr = [...(((prev[key] as number[] | undefined)) ?? [])];
    while (arr.length <= i) arr.push(NaN);
    arr[i] = Number(v);
    return { ...prev, [key]: arr };
  });

  const handleSave = async () => {
    if (readOnly || !project) { triggerToast('Selecciona un proyecto para guardar.'); return; }
    setSaving(true);
    try {
      if (isCloud) await setDoc(estadoDoc(project.id), inputs, { merge: true });
      else localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(inputs));
      triggerToast(isCloud ? 'Estudio de cabida guardado en la nube.' : 'Estudio de cabida guardado localmente.');
    } catch { triggerToast('Error al guardar la cabida.'); }
    finally { window.setTimeout(() => setSaving(false), 300); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' }}><Maximize size={22} strokeWidth={1.4} /> Estudio de Cabida Volumétrica</h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {project ? <>Proyecto: <strong>{project.name}</strong></> : 'Sin proyecto activo'} <span style={{ marginLeft: 6, opacity: 0.6 }}>[{isCloud ? 'NUBE' : 'LOCAL'}]</span>
          </p>
        </div>
        <button className="technical-btn" onClick={handleSave} disabled={saving || readOnly} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? <RefreshCw size={14} className="ab-spin" /> : <Save size={14} />} {saving ? 'Guardando…' : 'Guardar Cabida'}
        </button>
      </div>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* INPUTS */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tool-panel">
            <div className="module-header" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setDimsOpen((o) => !o)}>
              <span><Ruler size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| DIMENSIONES DEL PREDIO</span>
              {dimsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {terrenoArea != null && (
                <div style={{ padding: 10, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12 }}>Terreno dibujado (Geolocalizador): <strong>{terrenoArea.toLocaleString('es-CL')} m²</strong></span>
                  <button type="button" className="technical-btn secondary" style={{ fontSize: 10, padding: '4px 8px' }} disabled={readOnly} onClick={usarAreaTerreno}>Usar (cuadrado)</button>
                </div>
              )}
              {!dimsOpen ? (
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                  Se usa la forma real del terreno. Presiona "Usar (cuadrado)" o abre este panel para ajustar frente/fondo a mano.
                </span>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <NumberInput label="Frente (Ancho)" value={inputs.ancho} onChange={setNum('ancho')} unit="m" min={1} disabled={readOnly} />
                    <NumberInput label="Fondo (Largo)" value={inputs.largo} onChange={setNum('largo')} unit="m" min={1} disabled={readOnly} />
                  </div>
                  <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Superficie Total:</span>
                    <span style={{ fontWeight: 'bold' }}>{resultados.superficieTerreno.toLocaleString('es-CL')} m²</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header"><span><Home size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| NORMATIVA URBANÍSTICA (CIP)</span></div>
            <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <NumberInput label="Coef. Constructibilidad" value={inputs.coefConstructibilidad} onChange={setNum('coefConstructibilidad')} step={0.1} disabled={readOnly} />
              <NumberInput label="Ocupación de Suelo" value={inputs.ocupacionSuelo} onChange={setNum('ocupacionSuelo')} unit="%" disabled={readOnly} />
              <NumberInput label="Altura Máxima" value={inputs.alturaMaxima} onChange={setNum('alturaMaxima')} unit="m" disabled={readOnly} />
              <NumberInput label="Ángulo Rasante" value={inputs.rasante} onChange={setNum('rasante')} unit="°" disabled={readOnly} />
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header"><span><Maximize size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| DISTANCIAMIENTOS Y ADOSAMIENTOS</span></div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>Distanciamiento por deslinde (OGUC). Vecino con ventanas: 3 m (≤7 m) o 4 m (&gt;7 m); muro ciego: 1,40 m. Adosar: muro en el deslinde ≤3,5 m en ≤40% del lado (no cambia el distanciamiento del resto). Frentes a vía: antejardín + ancho de vía.</p>
                {terrenoEdges.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {terrenoEdges.map((street, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                        <span style={{ fontWeight: 700, minWidth: 66 }}>Deslinde {i + 1}</span>
                        {street ? (
                          <>
                            <span style={{ color: '#7a1f2b', fontWeight: 700 }}>Vía</span>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Antejardín <input type="number" min={0} step={0.5} className="tech-input" style={{ width: 60 }} value={inputs.edgeAnte?.[i] ?? 5} disabled={readOnly} onChange={(e) => setEdgeNum('edgeAnte', i)(e.target.value)} /> m</label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ancho vía <input type="number" min={0} step={0.5} className="tech-input" style={{ width: 60 }} value={inputs.edgeVia?.[i] ?? 8} disabled={readOnly} onChange={(e) => setEdgeNum('edgeVia', i)(e.target.value)} /> m</label>
                          </>
                        ) : (
                          <>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Distanc. <input type="number" min={0} step={0.1} className="tech-input" style={{ width: 60 }} value={inputs.edgeDist?.[i] ?? 3} disabled={readOnly} onChange={(e) => setEdgeNum('edgeDist', i)(e.target.value)} /> m</label>
                            <Checkbox label="Adosar (40%, 3,5 m)" checked={!!inputs.adosaEdges?.[i]} onChange={() => toggleAdosaEdge(i)} disabled={readOnly} />
                          </>
                        )}
                      </div>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                      Rasante {rasAngle}° (editable en «Ángulo Rasante»; por defecto según región{project?.region ? `: ${project.region}` : ''}) · Altura máx. por rasante ≈ {rasMaxH ? rasMaxH.toFixed(1) : '—'} m
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Checkbox label="Izquierdo" checked={inputs.adosamientos.izquierdo} onChange={() => toggleAdos('izquierdo')} disabled={readOnly} />
                    <Checkbox label="Derecho" checked={inputs.adosamientos.derecho} onChange={() => toggleAdos('derecho')} disabled={readOnly} />
                    <Checkbox label="Fondo" checked={inputs.adosamientos.fondo} onChange={() => toggleAdos('fondo')} disabled={readOnly} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTADOS + 3D */}
        <div style={{ flex: '1.4 1 420px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="tool-panel"><div className="panel-content">
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Volumen Teórico Bruto</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}><span style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(resultados.volumenTeoricoBruto || 0).toLocaleString('es-CL')}</span><span style={{ color: 'var(--muted-foreground)' }}>m³</span></div>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 6 }}>Envolvente máxima aproximada.</p>
            </div></div>
            <div className="tool-panel"><div className="panel-content">
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Superficie Edificable Máx.</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}><span style={{ fontSize: 28, fontWeight: 800, color: 'var(--destructive)' }}>{Math.round(resultados.constructibilidadMaxima || 0).toLocaleString('es-CL')}</span><span style={{ color: 'var(--muted-foreground)' }}>m² útiles</span></div>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 6 }}>Según coef. constructibilidad.</p>
            </div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {([['Límite por % Ocupación', Math.round(resultados.ocupacionMaximaSuelo || 0), false], ['Límite por Retiros', Math.round(resultados.areaPoligonoRetiros || 0), false], ['Huella Efectiva (Mín.)', Math.round(resultados.areaBaseEdificable || 0), true]] as Array<[string, number, boolean]>).map(([lbl, val, hl]) => (
              <div key={lbl} className="tool-panel" style={{ background: hl ? 'var(--muted)' : undefined }}><div className="panel-content" style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.2 }}>{lbl}</span>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 'bold', marginTop: 4, color: hl ? 'var(--destructive)' : 'var(--foreground)' }}>{val} m²</span>
                {hl && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: 'var(--card)', borderRadius: 999, marginTop: 4, display: 'inline-block', border: '1px solid var(--border)' }}>{resultados.porcentajeEfectivo.toFixed(1)}% Real</span>}
              </div></div>
            ))}
          </div>

          <div className="tool-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
            <Visualizador3D inputs={inputs} resultados={resultados} poly={terrenoRing} polyEdges={terrenoEdges} polyAdosa={inputs.adosaEdges} hOverride={hBody} rasAngle={rasAngle} />
            <div style={{ padding: 12, background: 'var(--muted)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--destructive)' }} />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}><strong>Nota:</strong> esquema conceptual. La rasante se muestra como faldón inclinado (muro vertical hasta 3,5 m + distancia·tanθ, luego chaflán hacia la cumbrera). El volumen exacto depende de las cotas topográficas reales del terreno.</p>
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Maximize size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Estudio de Cabida" documentId="T-10" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Estudio de Cabida Volumétrica</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a' }}><tbody>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700, width: '60%' }}>Superficie del Terreno</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{Math.round(resultados.superficieTerreno).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Ocupación Máx. de Suelo</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{Math.round(resultados.ocupacionMaximaSuelo).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Huella Efectiva ({resultados.porcentajeEfectivo.toFixed(1)}%)</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{Math.round(resultados.areaBaseEdificable).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Altura Efectiva</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{resultados.alturaEfectiva.toFixed(1)} m</td></tr>
              <tr><td style={{ padding: '6px 8px', borderTop: '2px solid #1a1a1a', fontWeight: 800 }}>Superficie Edificable Máx.</td><td style={{ padding: '6px 8px', borderTop: '2px solid #1a1a1a', textAlign: 'right', fontWeight: 800 }}>{Math.round(resultados.constructibilidadMaxima).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', fontWeight: 800 }}>Volumen Teórico Bruto</td><td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{Math.round(resultados.volumenTeoricoBruto).toLocaleString('es-CL')} m³</td></tr>
            </tbody></table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
