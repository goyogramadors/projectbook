/* =============================================================================
   CarpetaDigitalView.tsx — CARPETA DIGITAL (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // MOCKUP — Estado SOLO en memoria. NO Firestore/Storage (los "archivos" son
   // metadatos simulados, sin subida real). Demuestra: árbol por tipo de contrato,
   // versiones por tipo de documento, archivar/restaurar (estado activo|archivado).
   // Real: useToolData + projects/{pid}/obraDigital/archivos (storageRef UUID),
   // permisos denormalizados. Tool independiente del Libro de Obras (decisión HITL B).
   // Ref: DESARROLLO/LOD y COD/. tier: premium.
   ============================================================================= */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import type { ToolProps } from '../core/types';

const CONTRATOS = [
  'Obra a suma alzada', 'Obra a serie de precios unitarios', 'Consultoría',
  'Suministro', 'Administración delegada', 'Concesión',
];
/* árbol normativo SEMILLA por tipo de contrato (placeholder = glosario real) */
const CARPETAS: string[] = [
  'Antecedentes administrativos', 'Antecedentes técnicos', 'Económicos y garantías',
  'Permisos y autorizaciones', 'Comunicaciones',
];

type EstadoArch = 'activo' | 'archivado';
interface Archivo { id: number; carpeta: string; tipoDoc: string; version: number; fecha: string; estado: EstadoArch; }
const hoy = () => new Date().toISOString().slice(0, 10);

export default function CarpetaDigitalView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [contrato, setContrato] = useState<string>(CONTRATOS[0] ?? '');
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [seq, setSeq] = useState(1);
  const [abierto, setAbierto] = useState<Record<string, boolean>>({ [CARPETAS[0] ?? '']: true });
  const [verArchivados, setVerArchivados] = useState(false);
  const [sel, setSel] = useState<string>(CARPETAS[0] ?? '');
  const [nuevoTipo, setNuevoTipo] = useState('');

  const activos = useMemo(() => archivos.filter(a => a.estado === 'activo'), [archivos]);
  const archivados = useMemo(() => archivos.filter(a => a.estado === 'archivado'), [archivos]);
  const docsDe = (carpeta: string) => activos.filter(a => a.carpeta === carpeta);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para abrir la Carpeta Digital.</p></div>
  );

  const agregar = () => {
    if (readOnly || !nuevoTipo.trim()) return;
    const prev = activos.filter(a => a.carpeta === sel && a.tipoDoc === nuevoTipo.trim());
    const version = prev.length + 1;
    setArchivos(p => [...p, { id: seq, carpeta: sel, tipoDoc: nuevoTipo.trim(), version, fecha: hoy(), estado: 'activo' }]);
    setSeq(s => s + 1);
    setNuevoTipo('');
  };
  const setEstado = (id: number, estado: EstadoArch) =>
    setArchivos(p => p.map(a => a.id === id ? { ...a, estado } : a));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.FolderTree size={22} strokeWidth={1.4} /> Carpeta Digital
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#9a6700', color: '#fff' }}>MOCKUP</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 14 }}>
        Proyecto: <strong>{project.name}</strong> · Repositorio documental en árbol según tipo de contrato, con versionado y archivado.
      </p>

      <div className="ab-form-grid" style={{ marginBottom: 12 }}>
        <div className="tech-input-group"><label>Tipo de contrato</label>
          <select className="tech-select" value={contrato} disabled={readOnly} onChange={e => setContrato(e.target.value)}>
            {CONTRATOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
      </div>

      <div className="ab-split">
        {/* IZQUIERDA · árbol */}
        <div className="tool-panel ab-split-left">
          <div className="module-header">| ÁRBOL — {contrato.toUpperCase()}</div>
          <div className="panel-content">
            {CARPETAS.map(c => {
              const n = docsDe(c).length;
              return (
                <div key={c} style={{ marginBottom: 2 }}>
                  <button type="button" onClick={() => { setAbierto(p => ({ ...p, [c]: !p[c] })); setSel(c); setVerArchivados(false); }}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 8px', cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${sel === c && !verArchivados ? '#6d28d9' : 'var(--ab-border,#ddd)'}`, borderRadius: 6,
                      background: sel === c && !verArchivados ? 'rgba(109,40,217,.08)' : 'transparent', fontSize: 12, fontWeight: 600 }}>
                    <span>{abierto[c] ? '📂' : '📁'} {c}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{n} doc.</span>
                  </button>
                  {abierto[c] && (
                    <div style={{ paddingLeft: 14, marginTop: 2 }}>
                      {n === 0 ? <div style={{ fontSize: 11, opacity: 0.5, padding: '2px 0' }}>📄 Documentos de la carpeta (vacío)</div>
                        : docsDe(c).map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '3px 0' }}>
                            <span>📄 {a.tipoDoc} <span style={{ opacity: 0.6 }}>v{a.version} ●</span></span>
                            <span style={{ display: 'flex', gap: 8 }}>
                              <span title="Ver" style={{ cursor: 'pointer' }}>👁</span>
                              <span title="Descargar" style={{ cursor: 'pointer' }}>⬇</span>
                              {!readOnly && <span title="Archivar" style={{ cursor: 'pointer' }} onClick={() => setEstado(a.id, 'archivado')}>📥</span>}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setVerArchivados(true)}
              style={{ width: '100%', padding: '7px 8px', marginTop: 8, border: '1px dashed var(--ab-border,#ccc)', borderRadius: 6, cursor: 'pointer',
                background: verArchivados ? 'rgba(0,0,0,.05)' : 'transparent', textAlign: 'left', fontSize: 12 }}>
              🗃️ Archivados ({archivados.length})
            </button>
          </div>
        </div>

        {/* DERECHA · detalle / agregar / archivados */}
        <div className="ab-split-right">
          <div className="tool-panel">
            <div className="panel-content">
              {verArchivados ? (
                <>
                  <div className="module-header">| 🗃️ ARCHIVADOS</div>
                  {archivados.length === 0 ? <p className="tech-quote">No hay archivos archivados.</p> : archivados.map(a => (
                    <div key={a.id} style={{ borderBottom: '1px solid var(--ab-border,#eee)', padding: '6px 0', fontSize: 12 }}>
                      📄 {a.tipoDoc} v{a.version} · <span style={{ opacity: 0.7 }}>{a.carpeta}</span>
                      <button type="button" disabled={readOnly} onClick={() => setEstado(a.id, 'activo')}
                        className="technical-btn" style={{ float: 'right', fontSize: 10, padding: '2px 8px' }}>♻ Restaurar</button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="module-header">| {sel.toUpperCase()} · AGREGAR DOCUMENTO</div>
                  <div className="ab-form-grid">
                    <div className="tech-input-group col-span-full"><label>Tipo de documento</label>
                      <input className="tech-input" value={nuevoTipo} disabled={readOnly} onChange={e => setNuevoTipo(e.target.value)}
                        placeholder="Ej: Resolución de adjudicación" /></div>
                  </div>
                  <p style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, margin: '6px 0' }}>
                    <Icons.Lock size={11} /> La subida real del archivo (storageRef UUID) ocurre en el módulo Premium. Aquí se simula el metadato/versión.
                  </p>
                  <button type="button" className="technical-btn" disabled={readOnly || !nuevoTipo.trim()} onClick={agregar}>+ [ AGREGAR / NUEVA VERSIÓN ]</button>

                  <div className="module-header" style={{ marginTop: 16 }}>| DOCUMENTOS EN «{sel}» ({docsDe(sel).length})</div>
                  {docsDe(sel).length === 0 ? <p className="tech-quote">Sin documentos activos en esta carpeta.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {docsDe(sel).map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--ab-border,#eee)' }}>
                            <td style={{ padding: '5px 4px' }}>📄 {a.tipoDoc}</td>
                            <td style={{ padding: '5px 4px', opacity: 0.7 }}>v{a.version} · {a.fecha}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <button type="button" disabled={readOnly} onClick={() => setEstado(a.id, 'archivado')}
                                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>📥 Archivar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
