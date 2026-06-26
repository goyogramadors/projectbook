/* =============================================================================
   GanttView.tsx — Generador de Carta Gantt general de obra (Construcción).
   -----------------------------------------------------------------------------
   Trabaja con la MISMA estructura de partidas/capítulos que EETT y Presupuesto.
   Plazos desde un catálogo aparte generado del .md (catalogo.gantt.ts). Activa
   los capítulos según la selección del Generador de EETT (useToolData) y dibuja
   barras secuenciales con solape. Plazos editables (persiste con useToolData
   'gantt'). Exporta PDF vía DocumentExportWrapper (mismo visor PDF).
   ============================================================================= */
import { useMemo } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import type { ToolProps } from '../core/types';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import { CATALOGO_GANTT } from './construccion/catalogo.gantt';
import { CATALOGO_PRESUPUESTO } from './construccion/catalogo.presupuesto';
import { evalActivaSi, naturalezaDeTipoProyecto, type SeleccionConstruccion } from './construccion/activaSi';
import { SELECCION_VACIA } from './construccion/meta';
import './construccion/construccion.css';

interface EettBasis extends SeleccionConstruccion { region?: string }
interface GanttState {
  fechaInicio: string;                       // ISO yyyy-mm-dd
  semanas: Record<number, number>;           // override por cap
  solape: Record<number, number>;            // override por cap
}
const EETT_FALLBACK = { ...SELECCION_VACIA } as EettBasis;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const FALLBACK: GanttState = { fechaInicio: hoyISO(), semanas: {}, solape: {} };

const addDias = (iso: string, dias: number): string => {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
};

export default function GanttView({ projectId, access = 'edit' }: ToolProps) {
  const { getProject } = useProjects();
  const master = getProject(projectId);
  const eett = useToolData<EettBasis>('eett-generador', projectId, EETT_FALLBACK);
  const { data, setData, save } = useToolData<GanttState>('gantt', projectId, FALLBACK);
  const ro = access !== 'edit';

  const sel: SeleccionConstruccion = useMemo(() => ({
    ...eett.data, naturaleza: eett.data.naturaleza || naturalezaDeTipoProyecto(master?.tipoProyecto),
  }), [eett.data, master?.tipoProyecto]);

  const commit = (patch: Partial<GanttState>) => { if (ro) return; const next = { ...data, ...patch }; setData(next); void save(next); };
  const capActivo = (cap: number): boolean =>
    cap === 1 || cap === 9 || CATALOGO_PRESUPUESTO.some((p) => p.cap === cap && evalActivaSi(p.activaSi, sel));

  // Timeline: barras secuenciales con solape, sobre capítulos activos.
  const { filas, totalSem } = useMemo(() => {
    let prevEnd = 0, total = 0;
    const out: { cap: number; nombre: string; semanas: number; solape: number; start: number; end: number }[] = [];
    for (const g of CATALOGO_GANTT) {
      if (!capActivo(g.cap)) continue;
      const semanas = data.semanas[g.cap] ?? g.semanas;
      const solape = data.solape[g.cap] ?? g.solape;
      const start = Math.max(0, prevEnd - solape);
      const end = start + semanas;
      out.push({ cap: g.cap, nombre: g.nombre, semanas, solape, start, end });
      prevEnd = end; total = Math.max(total, end);
    }
    return { filas: out, totalSem: total || 1 };
  }, [sel, data.semanas, data.solape]);

  const ruler = Array.from({ length: totalSem }, (_, i) => i + 1);

  return (
    <div className="cx-2col">
      {/* ── PLAZOS ── */}
      <div className="cx-form">
        <div className="module-header">| CARTA GANTT <Calendar size={14} /></div>
        {ro && <p className="tech-quote">Modo solo lectura.</p>}
        <p className="tech-quote">Capítulos activos según el selector del <b>Generador de EETT</b>. Ajusta semanas y solape.</p>

        <div className="tech-input-group"><label>Fecha de inicio de obra</label>
          <input className="tech-input" type="date" disabled={ro} value={data.fechaInicio}
            onChange={(e) => commit({ fechaInicio: e.target.value })} /></div>

        <h4 className="cx-sec">Plazos por capítulo (semanas / solape)</h4>
        {filas.map((f) => (
          <div key={f.cap} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
            <span style={{ flex: 1, fontSize: 11.5 }}>{f.cap}. {f.nombre}</span>
            <input className="tech-input" type="number" disabled={ro} title="Semanas" value={f.semanas} style={{ width: 56, padding: '2px 5px' }}
              onChange={(e) => commit({ semanas: { ...data.semanas, [f.cap]: Number(e.target.value) || 0 } })} />
            <input className="tech-input" type="number" disabled={ro} title="Solape" value={f.solape} style={{ width: 56, padding: '2px 5px' }}
              onChange={(e) => commit({ solape: { ...data.solape, [f.cap]: Number(e.target.value) || 0 } })} />
          </div>
        ))}
        <p className="tech-quote" style={{ marginTop: 8 }}><RefreshCw size={10} /> Duración total: <b>{totalSem} semanas</b> (~{Math.ceil(totalSem / 4)} meses).</p>
      </div>

      {/* ── PREVIEW GANTT ── */}
      <div className="cx-preview">
        <div className="cx-prevbar">
          <span><Calendar size={13} /> {filas.length} capítulos · {totalSem} sem</span>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Carta Gantt" documentId="gantt" projectId={projectId}>
          <h2 style={{ textAlign: 'center', fontSize: 15, margin: '0 0 4px' }}>CARTA GANTT DE OBRA</h2>
          <p style={{ textAlign: 'center', fontSize: 11, marginTop: 0 }}>
            {master?.name || '[Proyecto]'} · inicio {data.fechaInicio} · {totalSem} semanas
          </p>
          <table className="cx-tbl" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>Capítulo</th>
                <th style={{ width: 70 }}>Inicio</th>
                <th colSpan={totalSem} style={{ padding: 0 }}>
                  <div style={{ display: 'flex' }}>
                    {ruler.map((w) => <div key={w} style={{ flex: 1, fontSize: 8, textAlign: 'center', borderLeft: '1px solid #ddd' }}>{w}</div>)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.cap}>
                  <td style={{ fontSize: 10 }}>{f.cap}. {f.nombre}</td>
                  <td style={{ fontSize: 9 }}>{addDias(data.fechaInicio, f.start * 7)}</td>
                  <td colSpan={totalSem} style={{ padding: 0, position: 'relative', height: 18 }}>
                    <div style={{ position: 'absolute', top: 3, bottom: 3, left: `${(f.start / totalSem) * 100}%`, width: `${(f.semanas / totalSem) * 100}%`, background: '#c0392b', borderRadius: 2 }}
                      title={`${addDias(data.fechaInicio, f.start * 7)} → ${addDias(data.fechaInicio, f.end * 7)}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 9, color: '#888', marginTop: 10 }}>Plazos referenciales (semanas) por capítulo NCh 1150, con traslape de faenas. Ajustar según tamaño y complejidad de la obra.</p>
        </DocumentExportWrapper>
      </div>
    </div>
  );
}
