/* =============================================================================
   InformeSubsueloView.tsx — INFORME DE SUBSUELO (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // MOCKUP — Estado SOLO en memoria (useState). NO persiste en Firestore/Storage
   // ni genera PDF real (usa window.print() + DocumentExportWrapper para la vista).
   // El desarrollo real reemplazará el estado por useToolData('informe-suelo', …)
   // hacia projects/{pid}/toolData/informe-suelo, sin tocar otras tools.
   // Ref UX: DESARROLLO/files subsuelo/ (MEMORIA_Subsuelo.md · index_subsuelo.html).
   // tier: free · adjuntos (fotos) reservados a Premium (decisión HITL 2026-06-22).
   ============================================================================= */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── catálogo fijo (7 tipos, idénticos en H-1/H-2/H-3) ───────────────────────── */
const TIPOS_SUELO = [
  'Suelo vegetal', 'Limo', 'Arcilla', 'Arena', 'Grava', 'Mixto (limo y arena)', 'Roca',
] as const;
const AGUA = ['No', 'Sí'] as const;
const APTO = ['Sí', 'No', 'Condicionado'] as const;

const OBS_SUGERIDA =
  'Se realizó calicata de reconocimiento visual del subsuelo. Los horizontes descritos son referenciales y no reemplazan un estudio de mecánica de suelos.';
const MIT_SUGERIDA =
  'Se recomienda verificar capacidad de soporte mediante ensayo y considerar mejoramiento/compactación del sello de fundación según el horizonte de apoyo.';

/* ── tipos locales (mockup; en real irían a types.ts) ────────────────────────── */
interface Horizonte { tipo: string; espesor: string; }
const H_VACIO: Horizonte = { tipo: '', espesor: '' };

const pill = (apto: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: apto === 'Sí' ? '#1f7a3d' : apto === 'No' ? '#9b1c1c' : apto === 'Condicionado' ? '#9a6700' : '#555',
  color: '#fff',
});
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTd: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontSize: 12, color: '#1a1a1a' };
const pvK: React.CSSProperties = { ...pvTd, fontWeight: 700, color: '#444' };

export default function InformeSubsueloView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [profCalicata, setProfCalicata] = useState('1.50');
  const [horizontes, setHorizontes] = useState<Horizonte[]>([{ ...H_VACIO }, { ...H_VACIO }, { ...H_VACIO }]);
  const [agua, setAgua] = useState<string>('No');
  const [observaciones, setObservaciones] = useState(OBS_SUGERIDA);
  const [apto, setApto] = useState<string>('Sí');
  const [mitigacion, setMitigacion] = useState(MIT_SUGERIDA);

  const setHz = (i: number, patch: Partial<Horizonte>) =>
    setHorizontes(prev => prev.map((h, j) => (j === i ? { ...h, ...patch } : h)));

  /* estratigrafía válida: tipo seleccionado y espesor > 0; prof. acumulada en orden */
  const estrato = useMemo(() => {
    let acum = 0;
    const filas = horizontes
      .map((h, idx) => ({ idx: idx + 1, tipo: h.tipo, esp: parseFloat(h.espesor) || 0 }))
      .filter(h => h.tipo && h.esp > 0)
      .map(h => { acum += h.esp; return { ...h, profAcum: acum }; });
    return { filas, total: acum };
  }, [horizontes]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para generar el informe de subsuelo.</p></div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Mountain size={22} strokeWidth={1.4} /> Informe de Subsuelo
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#9a6700', color: '#fff' }}>MOCKUP</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Calicata, estratigrafía referencial (hasta 3 horizontes) y aptitud para edificación.
      </p>

      <div className="ab-split">
        {/* ── COLUMNA IZQUIERDA · FORMULARIO ── */}
        <form className="tool-panel ab-split-left" onSubmit={e => e.preventDefault()}>
          <div className="module-header">| DATOS DE LA CALICATA</div>
          <div className="panel-content">
            <div className="ab-form-grid">
              <div className="tech-input-group">
                <label>Profundidad de la calicata (m)</label>
                <input type="number" step="0.05" className="tech-input" value={profCalicata} disabled={readOnly}
                  onChange={e => setProfCalicata(e.target.value)} />
              </div>
              <div className="tech-input-group">
                <label>Presencia de agua / napas</label>
                <select className="tech-select" value={agua} disabled={readOnly} onChange={e => setAgua(e.target.value)}>
                  {AGUA.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="module-header" style={{ marginTop: 14 }}>| ESTRATIGRAFÍA (HORIZONTES)</div>
            {horizontes.map((h, i) => (
              <div key={i} className="ab-form-grid" style={{ alignItems: 'end', marginTop: 6 }}>
                <div className="tech-input-group">
                  <label>H-{i + 1} · Tipo de suelo</label>
                  <select className="tech-select" value={h.tipo} disabled={readOnly} onChange={e => setHz(i, { tipo: e.target.value })}>
                    <option value="">Seleccione</option>
                    {TIPOS_SUELO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="tech-input-group">
                  <label>Espesor (m)</label>
                  <input type="number" step="0.05" min="0" className="tech-input" value={h.espesor} disabled={readOnly}
                    onChange={e => setHz(i, { espesor: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>
              Los horizontes sin tipo o con espesor 0 se excluyen de la tabla y de la serialización.
            </p>

            <div className="module-header" style={{ marginTop: 14 }}>| CONCLUSIONES</div>
            <div className="ab-form-grid">
              <div className="tech-input-group">
                <label>¿Apto para edificación?</label>
                <select className="tech-select" value={apto} disabled={readOnly} onChange={e => setApto(e.target.value)}>
                  {APTO.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="tech-input-group col-span-full">
                <label>Observaciones adicionales</label>
                <textarea rows={3} className="tech-input" value={observaciones} disabled={readOnly} onChange={e => setObservaciones(e.target.value)} />
              </div>
              <div className="tech-input-group col-span-full">
                <label>Medidas de mitigación</label>
                <textarea rows={3} className="tech-input" value={mitigacion} disabled={readOnly} onChange={e => setMitigacion(e.target.value)} />
              </div>
            </div>

            <div className="module-header" style={{ marginTop: 14 }}>| FOTOGRAFÍAS</div>
            <p style={{ fontSize: 11, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Lock size={12} /> Adjuntos de fotografías (JPG/PNG) disponibles en <strong>Premium</strong>.
            </p>
          </div>
        </form>

        {/* ── COLUMNA DERECHA · VISTA PREVIA ── */}
        <div className="ab-split-right">
          <div className="ab-preview-head">
            <h2 className="ab-preview-title"><Icons.Mountain size={14} /> Vista Previa de Exportación</h2>
            <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
          </div>
          <DocumentExportWrapper documentName="Informe de Subsuelo" documentId="informe-suelo" projectId={projectId}>
            <div>
              <h3 style={pvH3}>Informe Simple de Subsuelo</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}><tbody>
                <tr><td style={pvK}>Proyecto</td><td style={pvTd}>{project.name}</td></tr>
                <tr><td style={pvK}>Profundidad calicata</td><td style={pvTd}>{profCalicata || '—'} m</td></tr>
                <tr><td style={pvK}>Presencia de agua</td><td style={pvTd}>{agua}</td></tr>
                <tr><td style={pvK}>Apto para edificación</td><td style={pvTd}><span style={pill(apto)}>{apto}</span></td></tr>
              </tbody></table>

              <h3 style={pvH3}>Estratigrafía referencial</h3>
              {estrato.filas.length === 0 ? (
                <p style={{ fontSize: 12, color: '#777' }}>Sin horizontes válidos cargados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={{ ...pvK, width: '12%' }}>Hz</th>
                    <th style={pvK}>Tipo</th>
                    <th style={{ ...pvK, width: '20%' }}>Espesor</th>
                    <th style={{ ...pvK, width: '24%' }}>Prof. acum.</th>
                  </tr></thead>
                  <tbody>
                    {estrato.filas.map(f => (
                      <tr key={f.idx}>
                        <td style={pvTd}>H-{f.idx}</td>
                        <td style={pvTd}>{f.tipo}</td>
                        <td style={pvTd}>{f.esp.toFixed(2)} m</td>
                        <td style={pvTd}>{f.profAcum.toFixed(2)} m</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={pvK} colSpan={2}>Espesor total</td>
                      <td style={pvK} colSpan={2}>
                        {estrato.total.toFixed(2)} m {parseFloat(profCalicata) > 0 && Math.abs(estrato.total - parseFloat(profCalicata)) > 0.001
                          ? `(calicata ${parseFloat(profCalicata).toFixed(2)} m)` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {observaciones.trim() && (
                <p style={{ fontSize: 12, color: '#1a1a1a', marginTop: 12 }}><strong>Observaciones:</strong> {observaciones}</p>
              )}
              {mitigacion.trim() && (
                <p style={{ fontSize: 12, color: '#1a1a1a', marginTop: 8 }}><strong>Mitigación:</strong> {mitigacion}</p>
              )}
            </div>
          </DocumentExportWrapper>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
