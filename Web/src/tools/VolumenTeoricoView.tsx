/* =============================================================================
   VolumenTeoricoView.tsx — VOLUMEN TEÓRICO / ESTUDIO DE CABIDA (T-10)
   -----------------------------------------------------------------------------
   Envolvente máxima edificable: a partir del predio y la normativa (CIP) calcula
   ocupación de suelo, polígono de retiros, adosamientos (OGUC 40%), constructibi-
   lidad, rasantes y la huella/volumen teórico, con un esquema isométrico SVG.
   NO consume datos de la base; persiste el estado en una subcolección Firestore
   (Premium: projects/{id}/volumen/estado) con fallback localStorage (Free).
   ============================================================================= */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Maximize, Ruler, Home, AlertCircle } from 'lucide-react';
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
  adosamientos: { izquierdo: false, derecho: false, fondo: false },
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

/* ── visualizador isométrico (módulo) ──────────────────────────────────────── */
function Visualizador3D({ inputs, resultados }: { inputs: Inputs; resultados: Resultados }) {
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
  const aCalle = Math.max(0, Number(inp.anchoCalle) || 0);
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

  const rasRad = Number(inp.rasante) * (Math.PI / 180);
  const centroY = ante + lCoreBase / 2;
  const maxAltFrente = (aCalle / 2 + centroY) * Math.tan(rasRad);
  const maxAltLat = (dist + wCoreBase / 2) * Math.tan(rasRad);
  const maxAltFondo = (dist + lCoreBase / 2) * Math.tan(rasRad);
  const maxAltRasante = Math.min(maxAltFrente, maxAltLat, maxAltFondo);

  let altPorConst = 0;
  if (areaEfectivaPlanta > 0) altPorConst = (constructibilidadMaxima / areaEfectivaPlanta) * 3;
  const alturaEfectiva = Math.min(Number(inp.alturaMaxima), altPorConst, maxAltRasante > 0 ? maxAltRasante : Number(inp.alturaMaxima));
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

  useEffect(() => {
    if (!project) return;
    let alive = true;
    (async () => {
      // Área REAL del terreno (polígono del Geolocalizador/Ubicación) — referencia + semilla.
      let areaTerr = 0;
      try { const t = await loadTerreno(project.id, isCloud); if (t && t.areaM2 > 0) areaTerr = t.areaM2; } catch { /* sin terreno */ }
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
      const areaRef = areaTerr || areaLegal;
      if (areaRef > 0) { const lado = Math.round(Math.sqrt(areaRef)); seed.largo = lado; seed.ancho = lado; }
      if (alive) setInputs(seed);
    })();
    return () => { alive = false; };
  }, [project?.id, isCloud]);

  const resultados = useMemo(() => calcular(inputs), [inputs]);

  const setNum = (k: keyof Inputs) => (v: string) => setInputs(prev => ({ ...prev, [k]: Number(v) }));
  const toggleAdos = (k: keyof Adosamientos) => setInputs(prev => ({ ...prev, adosamientos: { ...prev.adosamientos, [k]: !prev.adosamientos[k] } }));
  const usarAreaTerreno = () => {
    if (readOnly || !terrenoArea) return;
    const lado = Math.round(Math.sqrt(terrenoArea));
    setInputs(prev => ({ ...prev, largo: lado, ancho: lado }));
    triggerToast(`Predio ajustado a ${terrenoArea.toLocaleString('es-CL')} m² (cuadrado ${lado}×${lado}). Ajusta frente/fondo si conoces la forma real.`);
  };

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
            <div className="module-header"><span><Ruler size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| DIMENSIONES DEL PREDIO</span></div>
            <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <NumberInput label="Frente (Ancho)" value={inputs.ancho} onChange={setNum('ancho')} unit="m" min={1} disabled={readOnly} />
              <NumberInput label="Fondo (Largo)" value={inputs.largo} onChange={setNum('largo')} unit="m" min={1} disabled={readOnly} />
              <div style={{ gridColumn: '1 / -1', padding: 12, background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Superficie Total:</span>
                <span style={{ fontWeight: 'bold' }}>{resultados.superficieTerreno.toLocaleString('es-CL')} m²</span>
              </div>
              {terrenoArea != null && (
                <div style={{ gridColumn: '1 / -1', padding: 10, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12 }}>Terreno dibujado (Geolocalizador): <strong>{terrenoArea.toLocaleString('es-CL')} m²</strong></span>
                  <button type="button" className="technical-btn secondary" style={{ fontSize: 10, padding: '4px 8px' }} disabled={readOnly} onClick={usarAreaTerreno}>Usar (cuadrado)</button>
                </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <NumberInput label="Ancho Calle (Frente)" value={inputs.anchoCalle} onChange={setNum('anchoCalle')} unit="m" disabled={readOnly} />
                <NumberInput label="Antejardín (Frente)" value={inputs.antejardin} onChange={setNum('antejardin')} unit="m" disabled={readOnly} />
                <div style={{ gridColumn: '1 / -1' }}><NumberInput label="Distanciamiento Base" value={inputs.distanciamiento} onChange={setNum('distanciamiento')} unit="m" disabled={readOnly} /></div>
              </div>
              <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>Permitir Adosamiento (OGUC: máx 40% del deslinde):</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Checkbox label="Izquierdo" checked={inputs.adosamientos.izquierdo} onChange={() => toggleAdos('izquierdo')} disabled={readOnly} />
                  <Checkbox label="Derecho" checked={inputs.adosamientos.derecho} onChange={() => toggleAdos('derecho')} disabled={readOnly} />
                  <Checkbox label="Fondo" checked={inputs.adosamientos.fondo} onChange={() => toggleAdos('fondo')} disabled={readOnly} />
                </div>
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
            <Visualizador3D inputs={inputs} resultados={resultados} />
            <div style={{ padding: 12, background: 'var(--muted)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--destructive)' }} />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}><strong>Nota:</strong> esquema conceptual. El volumen exacto requiere proyectar los planos de rasante desde cada deslinde según las cotas topográficas reales (cortes piramidales en pisos superiores).</p>
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
