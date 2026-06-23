/* =============================================================================
   InformesTermicosView.tsx — INFORME NORMA TÉRMICA (PRODUCCIÓN · acreditación real)
   -----------------------------------------------------------------------------
   // Acredita CUMPLE / NO CUMPLE contra las TABLAS OFICIALES RT (Art. 4.1.10 OGUC,
   // DS N°15 MINVU, vigente 28-11-2025) cargadas en termico/tablas.ts. El cálculo de
   // U y los veredictos corren en un Web Worker real (workers/termico.worker.ts →
   // termico/engine.ts). Persiste con useToolData('informe-termico'). Reusa la comuna
   // del master para sembrar la zona térmica. El expediente queda "Completado" cuando
   // techo+muro+piso CUMPLEN; "En proceso" en otro caso.
   // La verificación de condensación (Res. Ex. 1802 MINVU) es una memoria de cálculo
   // externa (planilla MINVU) y se reporta como tal, no bloquea la acreditación opaca.
   // tier: premium.  Ref: DESARROLLO/files informe termico/.
   ============================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react'; // RT 4.1.10 acreditación
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import {
  ZONAS, COMUNA_ZONA, MATERIALES, ESTRUCTURAS, type Zona,
} from './termico/tablas';
import { evaluar, type EvaluacionTermica, type Veredicto } from './termico/engine';
import type { TermicoReq, TermicoRes } from '../workers/termico.worker';
import type { ToolProps, InformeTermico, TermicoComplejo, TermicoElemento } from '../core/types';

const ELEMENTOS: TermicoElemento[] = ['techo', 'muro', 'piso'];
const PASOS = [
  '0 · Zona', '1 · Techo', '2 · Muro', '3 · Piso', '3.2 · Sobrecimientos',
  '4 · Puerta', '5 · Ventilación', '6 · Ventanas', '7 · Infiltraciones',
];

const complejoInicial = (): TermicoComplejo => ({
  capas: [{ matId: 'yeso', espMm: '15' }, { matId: 'lana', espMm: '100' }, { matId: 'madera', espMm: '20' }],
  capaReemplazada: 1, estructuraId: 'e-madera', fraccion: '10',
});

const FALLBACK_TERMICO: InformeTermico = {
  comuna: '', zonaManual: '',
  complejos: { techo: complejoInicial(), muro: complejoInicial(), piso: complejoInicial() },
  sobrecim: { aplica: true, matId: 'eps', espMm: '20' },
  puertaU: '',
};

/* ── Badges de veredicto ── */
const VER_LABEL: Record<Veredicto, string> = { cumple: 'CUMPLE', 'no-cumple': 'NO CUMPLE', pendiente: 'Pendiente', 'no-aplica': 'No aplica' };
const VER_BG: Record<Veredicto, string> = { cumple: '#1f7a3d', 'no-cumple': '#9b1c1c', pendiente: '#9a6700', 'no-aplica': '#6b7280' };
const VerBadge = ({ v }: { v: Veredicto }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: VER_BG[v], color: '#fff' }}>{VER_LABEL[v]}</span>
);

const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTd: React.CSSProperties = { padding: '5px 8px', borderBottom: '1px solid #d8d8d8', fontSize: 11, color: '#1a1a1a' };

export default function InformesTermicosView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, setToolState } = useProjects();
  const project = getProject(projectId);

  const [paso, setPaso] = useState(0);
  const [comuna, setComuna] = useState(project?.comuna || '');
  const [zonaManual, setZonaManual] = useState('');
  const [complejos, setComplejos] = useState<Record<TermicoElemento, TermicoComplejo>>({
    techo: complejoInicial(), muro: complejoInicial(), piso: complejoInicial(),
  });
  const [sobrecim, setSobrecim] = useState(FALLBACK_TERMICO.sobrecim!);
  const [puertaU, setPuertaU] = useState('');
  const [guardado, setGuardado] = useState(false);

  const { data: saved, save, loading } = useToolData<InformeTermico>('informe-termico', projectId, FALLBACK_TERMICO);
  const hidratadoRef = useRef(false);
  useEffect(() => {
    if (loading || hidratadoRef.current) return;
    hidratadoRef.current = true;
    if (saved.comuna) setComuna(saved.comuna);
    setZonaManual(saved.zonaManual);
    setComplejos(saved.complejos);
    if (saved.sobrecim) setSobrecim(saved.sobrecim);
    if (saved.puertaU !== undefined) setPuertaU(saved.puertaU);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const zona = (zonaManual || COMUNA_ZONA[comuna] || '') as Zona | '';

  // ── Motor real en Web Worker (con seed síncrono del engine para el primer paint) ──
  const evalInput = useMemo(
    () => ({ zona, complejos, sobrecim, puertaU }),
    [zona, complejos, sobrecim, puertaU],
  );
  const [evaluacion, setEvaluacion] = useState<EvaluacionTermica>(() => evaluar(evalInput));
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);
  useEffect(() => {
    const w = new Worker(new URL('../workers/termico.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<TermicoRes>) => {
      if (e.data.reqId === reqIdRef.current) setEvaluacion(e.data.result);
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, []);
  useEffect(() => {
    const w = workerRef.current;
    if (!w) { setEvaluacion(evaluar(evalInput)); return; }
    const reqId = ++reqIdRef.current;
    const msg: TermicoReq = { reqId, input: evalInput };
    w.postMessage(msg);
  }, [evalInput]);

  const setComplejo = (el: TermicoElemento, patch: Partial<TermicoComplejo>) =>
    setComplejos(prev => ({ ...prev, [el]: { ...prev[el], ...patch } }));
  const setCapa = (el: TermicoElemento, i: number, patch: Partial<TermicoComplejo['capas'][number]>) =>
    setComplejo(el, { capas: complejos[el].capas.map((c, j) => j === i ? { ...c, ...patch } : c) });

  const guardar = async () => {
    const snapshot: InformeTermico = { comuna, zonaManual, complejos, sobrecim, puertaU };
    const ok = await save(snapshot);
    if (ok && projectId) {
      await setToolState(projectId, 'informe-termico', {
        estado: evaluacion.acredita ? 'Completado' : 'En proceso',
        fecha: new Date().toLocaleDateString('es-CL'),
      });
    }
    setGuardado(ok);
    if (ok) window.setTimeout(() => setGuardado(false), 2000);
  };

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para generar el informe térmico.</p></div>
  );

  const elementoActual: TermicoElemento | null = paso === 1 ? 'techo' : paso === 2 ? 'muro' : paso === 3 ? 'piso' : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Thermometer size={22} strokeWidth={1.4} /> Informe Norma Térmica
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
        {evaluacion.acredita
          ? <VerBadge v="cumple" />
          : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#9a6700', color: '#fff' }}>En proceso</span>}
      </h1>
      <p className="tech-quote" style={{ marginBottom: 14 }}>
        Proyecto: <strong>{project.name}</strong> · Reglamentación Térmica RT (Art. 4.1.10 OGUC, vigente 28-11-2025). Acreditación de la envolvente opaca contra Tabla 1 oficial.
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
                  {comuna && !COMUNA_ZONA[comuna] && !zonaManual && <span style={{ color: '#9b1c1c' }}> · comuna fuera de la semilla NCh1079 — fija la zona manualmente</span>}
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
                {(() => {
                  const r = evaluacion.elementos[elementoActual];
                  return (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--ab-panel-2, rgba(0,0,0,.03))', fontSize: 12 }}>
                      U campo: <strong>{r.uCampo.toFixed(3)}</strong> · U puente: <strong>{r.uPuente.toFixed(3)}</strong> ·
                      U ponderado: <strong>{r.uPond.toFixed(3)}</strong> W/m²K &nbsp;
                      <span style={{ opacity: 0.7 }}>(U máx zona: {r.uMax ? r.uMax.toFixed(2) : '—'})</span> &nbsp;
                      <VerBadge v={r.veredicto} />
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>Condensación superficial/intersticial: verificación externa por planilla MINVU (Res. Ex. 1802) — no incluida en este veredicto opaco.</div>
                    </div>
                  );
                })()}
              </>
            )}

            {paso === 4 && (() => {
              const r = evaluacion.sobrecimiento;
              return (
                <>
                  <div className="module-header">| 3.2 · SOBRECIMIENTOS (R100 — Tabla zona)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: '6px 0' }}>
                    <input type="checkbox" checked={sobrecim.aplica} disabled={readOnly} onChange={e => setSobrecim(s => ({ ...s, aplica: e.target.checked }))} />
                    Aplica aislación de sobrecimiento (pisos en contacto con terreno)
                  </label>
                  {sobrecim.aplica && (
                    <div className="ab-form-grid">
                      <div className="tech-input-group"><label>Material aislante</label>
                        <select className="tech-select" value={sobrecim.matId} disabled={readOnly} onChange={e => setSobrecim(s => ({ ...s, matId: e.target.value }))}>
                          {MATERIALES.map(m => <option key={m.id} value={m.id}>{m.nombre} (λ {m.lambda})</option>)}
                        </select></div>
                      <div className="tech-input-group"><label>Espesor (mm)</label>
                        <input type="number" className="tech-input" value={sobrecim.espMm} disabled={readOnly} onChange={e => setSobrecim(s => ({ ...s, espMm: e.target.value }))} /></div>
                    </div>
                  )}
                  {r && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--ab-panel-2, rgba(0,0,0,.03))', fontSize: 12 }}>
                      R100: <strong>{r.r100.toFixed(1)}</strong> {r.r100Min != null && <>· R100 mín zona: <strong>{r.r100Min}</strong></>} &nbsp; <VerBadge v={r.veredicto} />
                    </div>
                  )}
                </>
              );
            })()}

            {paso === 5 && (() => {
              const r = evaluacion.puerta;
              return (
                <>
                  <div className="module-header">| 4 · PUERTA OPACA (U máx — Tabla zona)</div>
                  <div className="ab-form-grid">
                    <div className="tech-input-group"><label>U de la puerta (ficha DITEC / Listado Térmico) W/m²K</label>
                      <input type="number" step="0.01" className="tech-input" value={puertaU} disabled={readOnly} onChange={e => setPuertaU(e.target.value)} placeholder="Ej: 1.70" /></div>
                  </div>
                  {r && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--ab-panel-2, rgba(0,0,0,.03))', fontSize: 12 }}>
                      U puerta: <strong>{puertaU ? r.u.toFixed(2) : '—'}</strong> {r.uMax != null && <>· U máx zona: <strong>{r.uMax.toFixed(2)}</strong></>} &nbsp; <VerBadge v={r.veredicto} />
                    </div>
                  )}
                </>
              );
            })()}

            {paso >= 6 && (
              <>
                <div className="module-header">| {PASOS[paso]}</div>
                <p style={{ fontSize: 12, opacity: 0.8 }}>
                  {paso === 6 ? 'Ventilación: tasas mínimas NCh3308/NCh3309 (informe de cumplimiento de la tasa).' :
                   paso === 7 ? 'Ventanas: % máximo por orientación y U de la ventana (tabla cargada en tablas.ts: VENTANA_PCT_MAX). La acreditación requiere superficies por orientación.' :
                   'Infiltraciones: clase de permeabilidad de puertas/ventanas (CLASE_PERMEABILIDAD) y clase de infiltración de la envolvente (ensayo NCh3295).'}
                  {' '}Dato cargado; pendiente de inputs de geometría para emitir veredicto numérico.
                </p>
              </>
            )}

            <button type="button" disabled={readOnly || !evaluacion.acredita} className="technical-btn"
              style={{ marginTop: 16, opacity: evaluacion.acredita ? 1 : 0.5 }}
              onClick={() => { if (evaluacion.acredita) window.print(); }}>
              {evaluacion.acredita
                ? <><Icons.FileCheck2 size={13} /> [ GENERAR INFORME ACTIVO ]</>
                : <><Icons.Lock size={13} /> [ GENERAR INFORME ACTIVO ] — envolvente opaca aún no acredita</>}
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="ab-split-right">
          <div className="ab-preview-head">
            <h2 className="ab-preview-title"><Icons.Thermometer size={14} /> Vista Previa</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {!readOnly && (
                <button type="button" className="technical-btn" onClick={guardar} disabled={loading}>
                  {guardado ? '✓ GUARDADO' : '[ GUARDAR ]'}
                </button>
              )}
              <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
            </div>
          </div>
          <DocumentExportWrapper documentName="Informe Norma Térmica" documentId="informe-termico" projectId={projectId}>
            <div>
              <h3 style={pvH3}>Informe de Cumplimiento Térmico</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}><tbody>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Proyecto</td><td style={pvTd}>{project.name}</td></tr>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Comuna</td><td style={pvTd}>{comuna || '—'}</td></tr>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Zona térmica</td><td style={pvTd}>{zona ? `Zona ${zona}` : '—'}</td></tr>
                <tr><td style={{ ...pvTd, fontWeight: 700 }}>Norma</td><td style={pvTd}>Art. 4.1.10 OGUC (RT vigente 28-11-2025)</td></tr>
              </tbody></table>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ ...pvTd, fontWeight: 700 }}>Elemento</th>
                  <th style={{ ...pvTd, fontWeight: 700 }}>U ponderado</th>
                  <th style={{ ...pvTd, fontWeight: 700 }}>U máx</th>
                  <th style={{ ...pvTd, fontWeight: 700 }}>Cumplimiento</th>
                </tr></thead>
                <tbody>
                  {ELEMENTOS.map(el => {
                    const r = evaluacion.elementos[el];
                    return (
                      <tr key={el}>
                        <td style={{ ...pvTd, textTransform: 'capitalize' }}>{el}</td>
                        <td style={pvTd}>{r.uPond.toFixed(3)} W/m²K</td>
                        <td style={pvTd}>{r.uMax ? r.uMax.toFixed(2) : '—'}</td>
                        <td style={{ ...pvTd, color: VER_BG[r.veredicto], fontWeight: 700 }}>{VER_LABEL[r.veredicto]}</td>
                      </tr>
                    );
                  })}
                  {evaluacion.sobrecimiento && (
                    <tr><td style={pvTd}>Sobrecimiento</td><td style={pvTd}>R100 {evaluacion.sobrecimiento.r100.toFixed(1)}</td>
                      <td style={pvTd}>{evaluacion.sobrecimiento.r100Min ?? '—'}</td>
                      <td style={{ ...pvTd, color: VER_BG[evaluacion.sobrecimiento.veredicto], fontWeight: 700 }}>{VER_LABEL[evaluacion.sobrecimiento.veredicto]}</td></tr>
                  )}
                  {evaluacion.puerta && (
                    <tr><td style={pvTd}>Puerta opaca</td><td style={pvTd}>{puertaU ? `${evaluacion.puerta.u.toFixed(2)} W/m²K` : '—'}</td>
                      <td style={pvTd}>{evaluacion.puerta.uMax?.toFixed(2) ?? '—'}</td>
                      <td style={{ ...pvTd, color: VER_BG[evaluacion.puerta.veredicto], fontWeight: 700 }}>{VER_LABEL[evaluacion.puerta.veredicto]}</td></tr>
                  )}
                </tbody>
              </table>
              <p style={{ fontSize: 11, marginTop: 10, fontWeight: 700, color: evaluacion.acredita ? '#1f7a3d' : '#9a6700' }}>
                Envolvente opaca (techo + muro + piso): {evaluacion.acredita ? 'ACREDITA ✓' : 'NO ACREDITA — revisar elementos en rojo'}
              </p>
              <p style={{ fontSize: 10, color: '#777', marginTop: 6 }}>
                U calculado por NCh853 (Rt = Rs + Σe/λ). Exigencias U máx, R100 y clases: Art. 4.1.10 OGUC (DS N°15 MINVU). Condensación: verificación externa Res. Ex. 1802 MINVU.
              </p>
            </div>
          </DocumentExportWrapper>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
