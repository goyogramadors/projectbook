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
  const { largo, ancho, anchoCalle, antejardin, distanciamiento, rasante, adosamientos } = inputs;
  const angle = Math.PI / 6;
  const projectIso = (x: number, y: number, z: number) => ({ x: (x - y) * Math.cos(angle), y: (x + y) * Math.sin(angle) - z });

  const drawBox = (x: number, y: number, z: number, w: number, l: number, h: number, fill: string, stroke: string) => {
    const p1 = projectIso(x, y, z), p2 = projectIso(x + w, y, z), p3 = projectIso(x + w, y + l, z), p4 = projectIso(x, y + l, z);
    const p1t = projectIso(x, y, z + h), p2t = projectIso(x + w, y, z + h), p3t = projectIso(x + w, y + l, z + h), p4t = projectIso(x, y + l, z + h);
    return (
      <g>
        <polygon points={`${p3.x},${p3.y} ${p4.x},${p4.y} ${p4t.x},${p4t.y} ${p3t.x},${p3t.y}`} fill={fill} fillOpacity={0.3} />
        <polygon points={`${p4.x},${p4.y} ${p1.x},${p1.y} ${p1t.x},${p1t.y} ${p4t.x},${p4t.y}`} fill={fill} fillOpacity={0.3} />
        <polygon points={`${p1t.x},${p1t.y} ${p2t.x},${p2t.y} ${p3t.x},${p3t.y} ${p4t.x},${p4t.y}`} fill={fill} fillOpacity={0.85} stroke={stroke} strokeWidth={1} />
        <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p2t.x},${p2t.y} ${p1t.x},${p1t.y}`} fill={fill} fillOpacity={0.5} stroke={stroke} strokeWidth={1} />
        <polygon points={`${p2.x},${p2.y} ${p3.x},${p3.y} ${p3t.x},${p3t.y} ${p2t.x},${p2t.y}`} fill={fill} fillOpacity={0.7} stroke={stroke} strokeWidth={1} />
      </g>
    );
  };

  const maxDim = Math.max(largo, ancho, resultados.alturaEfectiva || 0);
  const scale = maxDim > 0 ? 120 / maxDim : 1;
  const dist = distanciamiento, ante = antejardin, aCalle = anchoCalle;
  const hCore = resultados.alturaEfectiva || 0;
  const hAdos = Math.min(3.5, hCore);

  const t1 = projectIso(0, 0, 0), t2 = projectIso(ancho * scale, 0, 0), t3 = projectIso(ancho * scale, largo * scale, 0), t4 = projectIso(0, largo * scale, 0);
  const s1 = projectIso(-10 * scale, -aCalle * scale, 0), s2 = projectIso(ancho * scale + 10 * scale, -aCalle * scale, 0), s3 = projectIso(ancho * scale + 10 * scale, 0, 0), s4 = projectIso(-10 * scale, 0, 0);
  const eje1 = projectIso(-10 * scale, -(aCalle / 2) * scale, 0), eje2 = projectIso(ancho * scale + 10 * scale, -(aCalle / 2) * scale, 0);
  const rasRad = rasante * (Math.PI / 180);
  const rfStart = projectIso(ancho / 2 * scale, -(aCalle / 2) * scale, 0);
  const rfEnd = projectIso(ancho / 2 * scale, largo * scale, (largo + aCalle / 2) * Math.tan(rasRad) * scale);
  const rlStart = projectIso(0, largo / 2 * scale, 0);
  const rlEnd = projectIso(ancho * scale, largo / 2 * scale, ancho * Math.tan(rasRad) * scale);

  return (
    <div style={{ width: '100%', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 300, flex: 1 }}>
      <div style={{ padding: 10, background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Maximize size={12} /> Esquema Volumétrico 3D</span>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Escala autoajustable</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400">
          <g transform="translate(200, 280)">
            <polygon points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`} fill="var(--muted)" stroke="var(--border)" strokeWidth={1} />
            <line x1={eje1.x} y1={eje1.y} x2={eje2.x} y2={eje2.y} stroke="var(--muted-foreground)" strokeDasharray="4" strokeWidth={1} />
            <text x={projectIso(ancho / 2 * scale, -2 * scale, 0).x} y={projectIso(ancho / 2 * scale, -2 * scale, 0).y} fontSize={10} fontWeight="bold" fill="var(--muted-foreground)" textAnchor="middle">↑ LÍNEA OFICIAL ↑</text>
            <polygon points={`${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y} ${t4.x},${t4.y}`} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
            {hCore > 0 && resultados.anchoEdificable > 0 && resultados.largoEdificable > 0 && (
              <>
                {drawBox(dist * scale, ante * scale, 0, resultados.anchoEdificable * scale, resultados.largoEdificable * scale, hCore * scale, 'var(--destructive)', 'var(--foreground)')}
                {adosamientos.fondo && drawBox(dist * scale, (largo - dist) * scale, 0, Math.min(ancho * 0.4, resultados.anchoEdificable) * scale, dist * scale, hAdos * scale, 'var(--primary)', 'var(--foreground)')}
                {adosamientos.izquierdo && drawBox(0, ante * scale, 0, dist * scale, Math.min(largo * 0.4, largo - ante) * scale, hAdos * scale, 'var(--primary)', 'var(--foreground)')}
                {adosamientos.derecho && drawBox((ancho - dist) * scale, ante * scale, 0, dist * scale, Math.min(largo * 0.4, largo - ante) * scale, hAdos * scale, 'var(--primary)', 'var(--foreground)')}
                <line x1={rfStart.x} y1={rfStart.y} x2={rfEnd.x} y2={rfEnd.y} stroke="var(--destructive)" strokeWidth={1.5} strokeDasharray="3,3" />
                <line x1={rlStart.x} y1={rlStart.y} x2={rlEnd.x} y2={rlEnd.y} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="3,3" />
                <text x={rfStart.x} y={rfEnd.y - 15} fontSize={9} fontWeight="bold" fill="var(--destructive)" textAnchor="middle">Rasantes</text>
              </>
            )}
          </g>
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

  useEffect(() => {
    if (!project) return;
    let alive = true;
    (async () => {
      if (isCloud) {
        try {
          const snap = await getDoc(estadoDoc(project.id));
          if (alive && snap.exists()) { setInputs({ ...INPUTS_DEFECTO, ...(snap.data() as Partial<Inputs>) }); return; }
        } catch { /* offline / reglas → localStorage */ }
      }
      const raw = localStorage.getItem(STORAGE_KEY(project.id));
      if (alive && raw) { try { setInputs({ ...INPUTS_DEFECTO, ...(JSON.parse(raw) as Partial<Inputs>) }); return; } catch { /* corrupto */ } }
      // Sin cabida guardada → siembra parámetros normativos desde la ficha del
      // Geolocalizador (sync #1): altura, constructibilidad y ocupación de suelo.
      try {
        const norm = await loadNormativa(project.id, isCloud);
        if (alive && norm) setInputs((prev) => ({
          ...prev,
          alturaMaxima: norm.alturaMaxima || prev.alturaMaxima,
          coefConstructibilidad: norm.coefConstructibilidad || prev.coefConstructibilidad,
          ocupacionSuelo: norm.ocupacionSuelo || prev.ocupacionSuelo,
        }));
      } catch { /* sin ficha persistida → valores por defecto */ }
    })();
    return () => { alive = false; };
  }, [project?.id, isCloud]);

  const resultados = useMemo(() => calcular(inputs), [inputs]);

  const setNum = (k: keyof Inputs) => (v: string) => setInputs(prev => ({ ...prev, [k]: Number(v) }));
  const toggleAdos = (k: keyof Adosamientos) => setInputs(prev => ({ ...prev, adosamientos: { ...prev.adosamientos, [k]: !prev.adosamientos[k] } }));

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
