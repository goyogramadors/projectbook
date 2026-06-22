/* =============================================================================
   InformesTermicosView.tsx — INFORME NORMA TÉRMICA (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // MOCKUP — Estado SOLO en memoria. NO persiste, NO usa Web Worker, NO PDF real.
   // El motor de U/Rt aquí es una APROXIMACIÓN de demostración (Rt=Rsi+Σe/λ+Rse).
   // Las exigencias normativas (U máx/Rt mín por zona) están `POR COMPLETAR`: los
   // badges muestran "Pendiente" (NUNCA "OK") hasta cargar las Tablas oficiales
   // (decisión HITL 2026-06-22). Materiales/zonas: SEMILLA placeholder, no oficial.
   // Real: useToolData('informe-termico', …) + engine/termico.worker.ts + tablas.ts.
   // Ref: DESARROLLO/files informe termico/ (MEMORIA + GLOSARIO + index.html).
   // tier: premium.
   ============================================================================= */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── catálogos SEMILLA (placeholder — el real = glosario `as const`) ──────────── */
const ZONAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
const COMUNA_ZONA: Record<string, string> = { // POR COMPLETAR (tabla oficial DITEC)
  'Santiago': 'D', 'Ñuñoa': 'D', 'Concepción': 'E', 'Temuco': 'F', 'Punta Arenas': 'I',
};
interface Material { id: string; nombre: string; lambda: number; }
const MATERIALES: Material[] = [ // λ semilla (W/mK) — POR COMPLETAR catálogo completo
  { id: 'horm', nombre: 'Hormigón armado', lambda: 1.63 },
  { id: 'ladr', nombre: 'Ladrillo cerámico', lambda: 0.46 },
  { id: 'eps', nombre: 'Poliestireno expandido (EPS)', lambda: 0.038 },
  { id: 'lana', nombre: 'Lana mineral', lambda: 0.042 },
  { id: 'madera', nombre: 'Madera', lambda: 0.10 },
  { id: 'yeso', nombre: 'Yeso-cartón', lambda: 0.26 },
];
const ESTRUCTURAS: Material[] = [
  { id: 'e-madera', nombre: 'Madera', lambda: 0.10 },
  { id: 'e-acero', nombre: 'Acero', lambda: 50 },
  { id: 'e-horm', nombre: 'Hormigón', lambda: 1.63 },
];
const ELEMENTOS = ['techo', 'muro', 'piso'] as const;
type Elemento = (typeof ELEMENTOS)[number];

const PASOS = [
  '0 · Zona', '1 · Techo', '2 · Muro', '3 · Piso', '3.2 · Sobrecimientos',
  '4 · Puerta', '5 · Ventilación', '6 · Ventanas', '7 · Infiltraciones',
];

interface Capa { matId: string; espMm: string; }
interface ComplejoState { capas: Capa[]; capaReemplazada: number; estructuraId: string; fraccion: string; }
const complejoInicial = (): ComplejoState => ({
  capas: [{ matId: 'yeso', espMm: '15' }, { matId: 'lana', espMm: '100' }, { matId: 'madera', espMm: '20' }],
  capaReemplazada: 1, estructuraId: 'e-madera', fraccion: '10',
});

const RSI_RSE = 0.17; // Rsi+Rse aproximado (demostración)
const lambdaOf = (id: string): number => MATERIALES.find(m => m.id === id)?.lambda ?? ESTRUCTURAS.find(m => m.id === id)?.lambda ?? 1;

function calcU(capas: Capa[]): number {
  const r = capas.reduce((acc, c) => acc + ((parseFloat(c.espMm) || 0) / 1000) / lambdaOf(c.matId), RSI_RSE);
  return r > 0 ? 1 / r : 0;
}

const badgePend: React.CSSProperties = { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#9a6700', color: '#fff' };
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTd: React.CSSProperties = { padding: '5px 8px', borderBottom: '1px solid #d8d8d8', fontSize: 11, color: '#1a1a1a' };

export default function InformesTermicosView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [paso, setPaso] = useState(0);
  const [comuna, setComuna] = useState(project?.comuna || '');
  const [zonaManual, setZonaManual] = useState('');
  const [complejos, setComplejos] = useState<Record<Elemento, ComplejoState>>({
    techo: complejoInicial(), muro: complejoInicial(), piso: complejoInicial(),
  });

  const zona = zonaManual || COMUNA_ZONA[comuna] || '';

  const resultados = useMemo(() => {
    const out = {} as Record<Elemento, { uCampo: number; uPuente: number; uPond: number }>;
    ELEMENTOS.forEach(el => {
      const c = complejos[el];
      const uCampo = calcU(c.capas);
      const puenteCapas = c.capas.map((cap, i) => i === c.capaReemplazada ? { ...cap, matId: c.estructuraId } : cap);
      const uPuente = calcU(puenteCapas);
      const f = (parseFloat(c.fraccion) || 0) / 100;
      out[el] = { uCampo, uPuente, uPond: (1 - f) * uCampo + f * uPuente };
    });
    return out;
  }, [complejos]);

  const setComplejo = (el: Elemento, patch: Partial<ComplejoState>) =>
    setComplejos(prev => ({ ...prev, [el]: { ...prev[el], ...patch } }));
  const setCapa = (el: Elemento, i: number, patch: Partial<Capa>) =>
    setComplejo(el, { capas: complejos[el].capas.map((c, j) => j === i ? { ...c, ...patch } : c) });

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para generar el informe térmico.</p></div>
  );

  const elementoActual: Elemento | null = paso === 1 ? 'techo' : paso === 2 ? 'muro' : paso === 3 ? 'piso' : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Thermometer size={22} strokeWidth={1.4} /> Informe Norma Térmica
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#9a6700', color: '#fff' }}>MOCKUP</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 14 }}>
        Proyecto: <strong>{project.name}</strong> · Reglamentación Térmica (RT). Acreditación <strong>diferida</strong>: tablas de exigencia <span style={badgePend}>POR COMPLETAR</span>.
      </p>

      {/* Riel de pasos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {PASOS.map((p, i) => (
          <button key={p} type="button" onClick={() => setPaso(i)}
            style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
              border: `1px solid ${paso === i ? '#6d28d9' : 'var(--ab-border, #ccc)'}`,
              background: paso === i ? '#6d28d9' : 'transparent', color: paso === i ? '#fff' : 'inherit', fontWeight: paso === i ? 700 : 400 }}>
            {p}
          </button>
        ))}
      </div>

      <div className="ab-split">
        <div className="tool-panel ab-split-left">
          <div className="panel-content">
            {paso === 0 && (
              <>
                <div className="module-header">| PASO 0 · ZONA TÉRMICA</div>
                <div className="ab-form-grid">
                  <div className="tech-input-group"><label>Comuna (cliente)</label>
                    <input className="tech-input" value={comuna} disabled={readOnly} onChange={e => setComuna(e.target.value)} placeholder="Ej: Santiago" /></div>
                  <div className="tech-input-group"><label>Zona derivada / manual (A–I)</label>
                    <select className="tech-select" value={zona} disabled={readOnly} onChange={e => setZonaManual(e.target.value)}>
                      <option value="">{comuna && COMUNA_ZONA[comuna] ? `Auto: ${COMUNA_ZONA[comuna]}` : 'Selecciona zona'}</option>
                      {ZONAS.map(z => <option key={z} value={z}>Zona {z}</option>)}
                    </select></div>
                </div>
                <p style={{ fontSize: 11, marginTop: 8 }}>
                  Zona resuelta: <strong>{zona ? `Zona ${zona}` : '— (falta comuna o selección)'}</strong>
                  {comuna && !COMUNA_ZONA[comuna] && !zonaManual && <span style={{ color: '#9b1c1c' }}> · comuna fuera de la tabla semilla (POR COMPLETAR)</span>}
                </p>
              </>
            )}

            {elementoActual && (
              <>
                <div className="module-header">| {paso}. ENVOLVENTE — {elementoActual.toUpperCase()} (CAMPO + PUENTE)</div>
                {complejos[elementoActual].capas.map((cap, i) => (
                  <div key={i} className="ab-form-grid" style={{ alignItems: 'end', marginTop: 6 }}>
                    <div className="tech-input-group"><label>Capa {i + 1} · Material {i === complejos[elementoActual].capaReemplazada ? '(reemplazada en puente)' : ''}</label>
                      <select className="tech-select" value={cap.matId} disabled={readOnly} onChange={e => setCapa(elementoActual, i, { matId: e.target.value })}>
                        {MATERIALES.map(m => <option key={m.id} value={m.id}>{m.nombre} (λ {m.lambda})</option>)}
                      </select></div>
                    <div className="tech-input-group"><label>Espesor (mm)</label>
                      <input type="number" className="tech-input" value={cap.espMm} disabled={readOnly} onChange={e => setCapa(elementoActual, i, { espMm: e.target.value })} /></div>
                  </div>
                ))}
                <div className="ab-form-grid" style={{ marginTop: 8 }}>
                  <div className="tech-input-group"><label>Capa a reemplazar (puente)</label>
                    <select className="tech-select" value={complejos[elementoActual].capaReemplazada} disabled={readOnly}
                      onChange={e => setComplejo(elementoActual, { capaReemplazada: parseInt(e.target.value) })}>
                      {complejos[elementoActual].capas.map((_, i) => <option key={i} value={i}>Capa {i + 1}</option>)}
                    </select></div>
                  <div className="tech-input-group"><label>Estructura del puente</label>
                    <select className="tech-select" value={complejos[elementoActual].estructuraId} disabled={readOnly}
                      onChange={e => setComplejo(elementoActual, { estructuraId: e.target.value })}>
                      {ESTRUCTURAS.map(m => <option key={m.id} value={m.id}>{m.nombre} (λ {m.lambda})</option>)}
                    </select></div>
                  <div className="tech-input-group"><label>Fracción puente (%)</label>
                    <input type="number" className="tech-input" value={complejos[elementoActual].fraccion} disabled={readOnly}
                      onChange={e => setComplejo(elementoActual, { fraccion: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--ab-panel-2, rgba(0,0,0,.03))', fontSize: 12 }}>
                  U campo: <strong>{resultados[elementoActual].uCampo.toFixed(3)}</strong> · U puente: <strong>{resultados[elementoActual].uPuente.toFixed(3)}</strong> ·
                  U ponderado: <strong>{resultados[elementoActual].uPond.toFixed(3)}</strong> W/m²K &nbsp;
                  <span style={badgePend}>Cumplimiento: Pendiente</span>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>Condensación superficial/intersticial: pendiente de tabla de zona (POR COMPLETAR).</div>
                </div>
              </>
            )}

            {paso >= 4 && (
              <>
                <div className="module-header">| {PASOS[paso]}</div>
                <p style={{ fontSize: 12, opacity: 0.8 }}>
                  Bloque de acreditación (mockup). Estado normativo <span style={badgePend}>Pendiente</span> — exigencia de la tabla correspondiente <strong>POR COMPLETAR</strong>.
                  En el desarrollo real: {paso === 4 ? 'ficha DITEC + Tabla 10' : paso === 5 ? 'Qtot NCh 3309' : paso === 6 ? '% por orientación + Uw (Tablas 3/5/12)' : 'permeabilidad NCh 3296/3297'}.
                </p>
              </>
            )}

            <button type="button" disabled className="technical-btn" style={{ marginTop: 16, opacity: 0.5 }}>
              <Icons.Lock size={13} /> [ GENERAR INFORME ACTIVO ] — bloqueado hasta cargar tablas oficiales
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="ab-split-right">
          <div className="ab-preview-head">
            <h2 className="ab-preview-title"><Icons.Thermometer size={14} /> Vista Previa</h2>
            <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
          </div>
          <DocumentExportWrapper documentName="Informe Norma Térmica" documentId="informe-termico" projectId={projectId}>
            <div>
              <h3 style={pvH3}>Informe de Cumplimiento Térmico</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}><tbody>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Proyecto</td><td style={pvTd}>{project.name}</td></tr>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Comuna</td><td style={pvTd}>{comuna || '—'}</td></tr>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Zona térmica</td><td style={pvTd}>{zona ? `Zona ${zona}` : '—'}</td></tr>
              </tbody></table>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ ...pvTd, fontWeight: 700 }}>Elemento</th>
                  <th style={{ ...pvTd, fontWeight: 700 }}>U ponderado</th>
                  <th style={{ ...pvTd, fontWeight: 700 }}>Cumplimiento</th>
                </tr></thead>
                <tbody>
                  {ELEMENTOS.map(el => (
                    <tr key={el}>
                      <td style={{ ...pvTd, textTransform: 'capitalize' }}>{el}</td>
                      <td style={pvTd}>{resultados[el].uPond.toFixed(3)} W/m²K</td>
                      <td style={{ ...pvTd, color: '#9a6700', fontWeight: 700 }}>Pendiente</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: '#777', marginTop: 10 }}>
                Valores de U calculados con motor de demostración. Acreditación OK/NO OK no disponible: tablas de exigencia POR COMPLETAR.
              </p>
            </div>
          </DocumentExportWrapper>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
