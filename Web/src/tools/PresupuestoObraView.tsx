/* =============================================================================
   PresupuestoObraView.tsx — Estimador de Presupuesto de Obra (UF).
   -----------------------------------------------------------------------------
   Itemiza el presupuesto activando partidas con la MISMA selección del Generador
   de EETT (useToolData 'eett-generador') sobre el catálogo generado del .md
   (catalogo.presupuesto.ts). Cantidades por defecto desde la superficie del
   ProjectMaster; precios unitarios en UF editables. Valor UF en vivo (mindicador.cl)
   con default editable. GG / Utilidades / IVA / proforma. Exporta PDF vía
   DocumentExportWrapper (mismo visor PDF que el resto de herramientas).
   ============================================================================= */
import { useEffect, useMemo } from 'react';
import { DollarSign, Plus, Trash2, RefreshCw } from 'lucide-react';
import type { ToolProps, ProjectMaster } from '../core/types';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import { CATALOGO_PRESUPUESTO } from './construccion/catalogo.presupuesto';
import { evalActivaSi, naturalezaDeTipoProyecto, type SeleccionConstruccion } from './construccion/activaSi';
import { SELECCION_VACIA } from './construccion/meta';
import './construccion/construccion.css';

interface EettBasis extends SeleccionConstruccion { region?: string }
interface Proforma { glosa: string; monto: number; unidad: 'UF' | '$'; }
interface PresupState {
  valorUf: number; ufTouched: boolean; superficie: number;
  ggPct: number; utilPct: number; ivaPct: number; aplicaIva: boolean;
  cantidades: Record<string, number>; preciosUF: Record<string, number>;
  proforma: Proforma[];
}
const EETT_FALLBACK = { ...SELECCION_VACIA } as EettBasis;
const FALLBACK: PresupState = {
  valorUf: 39000, ufTouched: false, superficie: 0,
  ggPct: 15, utilPct: 10, ivaPct: 19, aplicaIva: true,
  cantidades: {}, preciosUF: {}, proforma: [],
};

const fmtUF = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCLP = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
const supDeMaster = (m: { superficieOrigen?: string; superficieManual?: string; superficieCalculada?: string } | null): number => {
  if (!m) return 0;
  const v = m.superficieOrigen === 'MANUAL' ? m.superficieManual : m.superficieCalculada;
  return Number(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0;
};

export default function PresupuestoObraView({ projectId, access = 'edit' }: ToolProps) {
  const { getProject, repo, reload } = useProjects();
  const { triggerToast } = useToast();
  const master = getProject(projectId);
  const eett = useToolData<EettBasis>('eett-generador', projectId, EETT_FALLBACK);
  const { data, setData, save } = useToolData<PresupState>('presupuesto', projectId, FALLBACK);
  const ro = access !== 'edit';

  // Selección base: la del EETT; si está vacía, naturaleza desde el ProjectMaster.
  const sel: SeleccionConstruccion = useMemo(() => ({
    ...eett.data,
    naturaleza: eett.data.naturaleza || naturalezaDeTipoProyecto(master?.tipoProyecto),
  }), [eett.data, master?.tipoProyecto]);

  const commit = (patch: Partial<PresupState>) => { if (ro) return; const next = { ...data, ...patch }; setData(next); void save(next); };

  // Superficie por defecto desde el master (si el usuario no la fijó).
  useEffect(() => {
    if (!data.superficie && master) { const s = supDeMaster(master); if (s) commit({ superficie: s }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master?.id]);

  // Valor UF en vivo (mindicador.cl) salvo que el usuario lo haya editado.
  useEffect(() => {
    let alive = true;
    if (data.ufTouched) return;
    void (async () => {
      try {
        const r = await fetch('https://mindicador.cl/api/uf');
        const j = await r.json();
        const v = j?.serie?.[0]?.valor;
        if (alive && typeof v === 'number' && !data.ufTouched) commit({ valorUf: Math.round(v) });
      } catch { /* sin red / bloqueado: queda el default editable */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const cantDe = (id: string, def: string): number => {
    if (data.cantidades[id] !== undefined) return data.cantidades[id];
    if (def === 'm2') return data.superficie;
    if (def === 'glob') return 1;
    return 0;
  };
  const puDe = (id: string, base: number): number => data.preciosUF[id] ?? base;

  const filas = useMemo(() => CATALOGO_PRESUPUESTO
    .filter((p) => evalActivaSi(p.activaSi, sel))
    .map((p) => { const cant = cantDe(p.id, p.cantDef); const pu = puDe(p.id, p.puUF); return { ...p, cant, pu, subUF: cant * pu }; }),
    [sel, data.cantidades, data.preciosUF, data.superficie]);

  const proformaUF = data.proforma.reduce((a, l) => a + (l.unidad === 'UF' ? l.monto : l.monto / (data.valorUf || 1)), 0);
  const A = filas.reduce((a, f) => a + f.subUF, 0) + proformaUF;        // costo directo
  const B = A * (data.ggPct / 100);
  const C = (A + B) * (data.utilPct / 100);
  const D = A + B + C;
  const E = data.aplicaIva ? D * (data.ivaPct / 100) : 0;
  const F = D + E;
  const uf = data.valorUf || 1;

  const setCant = (id: string, v: string) => commit({ cantidades: { ...data.cantidades, [id]: Number(v) || 0 } });
  const setPu = (id: string, v: string) => commit({ preciosUF: { ...data.preciosUF, [id]: Number(v) || 0 } });
  const addProforma = () => commit({ proforma: [...data.proforma, { glosa: '', monto: 0, unidad: 'UF' }] });
  const setProforma = (i: number, patch: Partial<Proforma>) => commit({ proforma: data.proforma.map((l, k) => k === i ? { ...l, ...patch } : l) });
  const delProforma = (i: number) => commit({ proforma: data.proforma.filter((_, k) => k !== i) });

  // Opción (no automática): adopta el TOTAL generado (F, en UF) como
  // ProjectMaster.presupuestoUF (alimenta Honorarios/Contratos). La Ficha sigue
  // editándose a mano; este botón solo lo sobrescribe a pedido del usuario.
  const usarComoPresupuesto = async () => {
    if (ro || !master) return;
    const valorUF = F.toFixed(2);
    try {
      const upd: ProjectMaster = { ...master, presupuestoUF: valorUF };
      await repo.save(upd); await reload();
      triggerToast(`Presupuesto del proyecto actualizado a ${valorUF} UF.`);
    } catch { triggerToast('No se pudo actualizar el presupuesto del proyecto.'); }
  };

  const Tot = ({ label, uf: u, clp, grand }: { label: string; uf: number; clp: number; grand?: boolean }) => (
    <div className={`cx-tot${grand ? ' grand' : ''}`}><span>{label}</span><span>{fmtUF(u)} UF · {fmtCLP(clp)}</span></div>
  );

  return (
    <div className="cx-2col">
      {/* ── PARÁMETROS ── */}
      <div className="cx-form">
        <div className="module-header">| PRESUPUESTO DE OBRA <DollarSign size={14} /></div>
        {ro && <p className="tech-quote">Modo solo lectura.</p>}
        <p className="tech-quote">Las partidas se activan según el selector del <b>Generador de EETT</b>. Edita cantidades y precios abajo.</p>

        <h4 className="cx-sec">Parámetros globales</h4>
        <div className="cx-sw-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="tech-input-group"><label>Valor UF ($) <RefreshCw size={10} /></label>
            <input className="tech-input" type="number" disabled={ro} value={data.valorUf}
              onChange={(e) => commit({ valorUf: Number(e.target.value) || 0, ufTouched: true })} /></div>
          <div className="tech-input-group"><label>Superficie (m²)</label>
            <input className="tech-input" type="number" disabled={ro} value={data.superficie}
              onChange={(e) => commit({ superficie: Number(e.target.value) || 0 })} /></div>
          <div className="tech-input-group"><label>Gastos generales (%)</label>
            <input className="tech-input" type="number" disabled={ro} value={data.ggPct}
              onChange={(e) => commit({ ggPct: Number(e.target.value) || 0 })} /></div>
          <div className="tech-input-group"><label>Utilidades (%)</label>
            <input className="tech-input" type="number" disabled={ro} value={data.utilPct}
              onChange={(e) => commit({ utilPct: Number(e.target.value) || 0 })} /></div>
          <div className="tech-input-group"><label>IVA (%)</label>
            <input className="tech-input" type="number" disabled={ro} value={data.ivaPct}
              onChange={(e) => commit({ ivaPct: Number(e.target.value) || 0 })} /></div>
          <label className="cx-sw-row" style={{ alignSelf: 'end' }}>
            <input type="checkbox" disabled={ro} checked={data.aplicaIva} onChange={(e) => commit({ aplicaIva: e.target.checked })} /><span>Aplica IVA</span></label>
        </div>

        <h4 className="cx-sec">Líneas proforma</h4>
        {data.proforma.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input className="tech-input" placeholder="Glosa" disabled={ro} value={l.glosa} onChange={(e) => setProforma(i, { glosa: e.target.value })} style={{ flex: 2 }} />
            <input className="tech-input" type="number" placeholder="Monto" disabled={ro} value={l.monto} onChange={(e) => setProforma(i, { monto: Number(e.target.value) || 0 })} style={{ flex: 1 }} />
            <select className="tech-input" disabled={ro} value={l.unidad} onChange={(e) => setProforma(i, { unidad: e.target.value as 'UF' | '$' })} style={{ width: 64 }}>
              <option value="UF">UF</option><option value="$">$</option></select>
            <button type="button" className="ab-btn sec" disabled={ro} onClick={() => delProforma(i)}><Trash2 size={13} /></button>
          </div>
        ))}
        {!ro && <button type="button" className="ab-btn sec" onClick={addProforma}><Plus size={13} /> Agregar proforma</button>}
      </div>

      {/* ── PREVIEW ── */}
      <div className="cx-preview">
        <div className="cx-prevbar">
          <span><DollarSign size={13} /> {filas.length} partidas · UF {fmtUF(data.valorUf)}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {!ro && (
              <button type="button" className="ab-btn sec" onClick={usarComoPresupuesto}
                title="Sobrescribe el presupuesto del proyecto (Ficha) con este total F. Editable luego a mano.">
                Usar como presupuesto del proyecto{master?.presupuestoUF ? ` · actual ${master.presupuestoUF} UF` : ''}
              </button>
            )}
            <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
          </div>
        </div>
        <DocumentExportWrapper documentName="Presupuesto de Obra" documentId="presupuesto" projectId={projectId}>
          <h2 style={{ textAlign: 'center', fontSize: 15, margin: '0 0 4px' }}>PRESUPUESTO DE OBRA</h2>
          <p style={{ textAlign: 'center', fontSize: 11, marginTop: 0 }}>
            {master?.name || '[Proyecto]'} · {data.superficie || 0} m² · UF ref. {fmtCLP(data.valorUf)}
          </p>
          <table className="cx-tbl">
            <thead><tr><th>ID</th><th>Partida</th><th>Un.</th><th className="num">Cant.</th><th className="num">PU [UF]</th><th className="num">Subtotal UF</th><th className="num">Subtotal $</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td><td>{f.partida}</td><td>{f.unidad}</td>
                  <td className="num">{ro ? f.cant : <input className="tech-input" type="number" value={f.cant} onChange={(e) => setCant(f.id, e.target.value)} style={{ width: 64, textAlign: 'right', padding: '1px 4px' }} />}</td>
                  <td className="num">{ro ? fmtUF(f.pu) : <input className="tech-input" type="number" value={f.pu} onChange={(e) => setPu(f.id, e.target.value)} style={{ width: 64, textAlign: 'right', padding: '1px 4px' }} />}</td>
                  <td className="num">{fmtUF(f.subUF)}</td>
                  <td className="num">{fmtCLP(f.subUF * uf)}</td>
                </tr>
              ))}
              {data.proforma.filter((l) => l.glosa || l.monto).map((l, i) => {
                const u = l.unidad === 'UF' ? l.monto : l.monto / uf;
                return <tr key={'pf' + i}><td>P{i + 1}</td><td>{l.glosa || 'Proforma'}</td><td>glob</td><td className="num">1</td><td className="num">{fmtUF(u)}</td><td className="num">{fmtUF(u)}</td><td className="num">{fmtCLP(u * uf)}</td></tr>;
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, maxWidth: 380, marginLeft: 'auto' }}>
            <Tot label="A · Costo directo" uf={A} clp={A * uf} />
            <Tot label={`B · Gastos generales (${data.ggPct}%)`} uf={B} clp={B * uf} />
            <Tot label={`C · Utilidades (${data.utilPct}%)`} uf={C} clp={C * uf} />
            <Tot label="D · Costo neto" uf={D} clp={D * uf} />
            {data.aplicaIva && <Tot label={`E · IVA (${data.ivaPct}%)`} uf={E} clp={E * uf} />}
            <Tot label="F · TOTAL PRESUPUESTO" uf={F} clp={F * uf} grand />
          </div>
          <p style={{ fontSize: 9, color: '#888', marginTop: 10 }}>Valores referenciales en UF (base itemizado real, calibrar por región/estándar). Conversión a $ con UF = {fmtCLP(data.valorUf)}.</p>
        </DocumentExportWrapper>
      </div>
    </div>
  );
}
