/* =============================================================================
   PropuestaView.tsx — PROPUESTA DE HONORARIOS DE SERVICIOS (T-05)
   -----------------------------------------------------------------------------
   Contrato visual extraido 1:1 del Mockup (PropuestaView). Conecta con el
   ProjectMaster activo (useProjects().getProject) para sembrar las superficies
   (terreno legal + superficie del proyecto), manteniendolas editables. Calcula
   honorarios por etapa en UF/CLP (UF via mindicador.cl con fallback) e historial
   local. Usa clases de produccion para heredar los 4 temas.
   ============================================================================= */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import { superficieProyecto, type ToolProps } from '../core/types';

type AreaCategory = 'terreno' | 'existente' | 'nuevo';
type EtapaCategory =
  | 'Estudios Previos' | 'Diseño y Arquitectura' | 'Desarrollo de Especialidades'
  | 'Tramitaciones' | 'Supervisión de Obras';

interface ServiceItem {
  id: string; etapa: EtapaCategory; descripcion: string;
  selected: boolean; valorUnitario: number; areaCategory: AreaCategory;
}

interface SavedPropuesta {
  id: string; resultTitle: string; inputValue: string;
  totalUF: number; totalCLP: number;
  snapshot: { services: ServiceItem[]; valorUF: number; supTerreno: number; supExistente: number; supNuevo: number };
}

const INITIAL_SERVICES: ServiceItem[] = [
  { id: 's1', etapa: 'Estudios Previos', descripcion: 'Análisis normativo de terreno (CIP, Plan Regulador)', selected: true, valorUnitario: 0.05, areaCategory: 'terreno' },
  { id: 's2', etapa: 'Estudios Previos', descripcion: 'Elaboración cabida teórica de terreno', selected: true, valorUnitario: 0.03, areaCategory: 'terreno' },
  { id: 's3', etapa: 'Estudios Previos', descripcion: 'Levantamiento arquitectónico', selected: false, valorUnitario: 0.15, areaCategory: 'existente' },
  { id: 's4', etapa: 'Estudios Previos', descripcion: 'Regularización de propiedad', selected: false, valorUnitario: 0.30, areaCategory: 'existente' },
  { id: 's5', etapa: 'Diseño y Arquitectura', descripcion: 'Anteproyecto (Programa y Volumetría)', selected: true, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's6', etapa: 'Diseño y Arquitectura', descripcion: 'Planimetría general para Licitación', selected: true, valorUnitario: 0.15, areaCategory: 'nuevo' },
  { id: 's7', etapa: 'Diseño y Arquitectura', descripcion: 'Planos de terminaciones generales', selected: false, valorUnitario: 0.08, areaCategory: 'nuevo' },
  { id: 's8', etapa: 'Desarrollo de Especialidades', descripcion: 'Layouts de especialidades', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's9', etapa: 'Desarrollo de Especialidades', descripcion: 'Especificaciones técnicas generales', selected: true, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's10', etapa: 'Desarrollo de Especialidades', descripcion: 'Itemizado para construcción', selected: true, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's11', etapa: 'Desarrollo de Especialidades', descripcion: 'Coordinación RDI (proceso de diseño)', selected: false, valorUnitario: 0.20, areaCategory: 'nuevo' },
  { id: 's12', etapa: 'Tramitaciones', descripcion: 'Tramitación Permiso de DOM', selected: true, valorUnitario: 0.20, areaCategory: 'nuevo' },
  { id: 's13', etapa: 'Tramitaciones', descripcion: 'Tramitación Autorización Sanitaria', selected: false, valorUnitario: 0.20, areaCategory: 'nuevo' },
  { id: 's14', etapa: 'Tramitaciones', descripcion: 'Trámite patente municipal', selected: false, valorUnitario: 0.20, areaCategory: 'nuevo' },
  { id: 's15', etapa: 'Supervisión de Obras', descripcion: 'Programación de obra carta gantt', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's16', etapa: 'Supervisión de Obras', descripcion: 'Entrega manuales y fichas técnicas', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's17', etapa: 'Supervisión de Obras', descripcion: 'Gestión Administrativa y documental', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's18', etapa: 'Supervisión de Obras', descripcion: 'Coordinación de stakeholders en obra', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's19', etapa: 'Supervisión de Obras', descripcion: 'Seguimiento calidad de obra (Arq. responsable)', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's20', etapa: 'Supervisión de Obras', descripcion: 'Seguimiento costos: EPO y MDO', selected: false, valorUnitario: 0.10, areaCategory: 'nuevo' },
  { id: 's21', etapa: 'Supervisión de Obras', descripcion: 'ITO Full', selected: false, valorUnitario: 0.20, areaCategory: 'nuevo' },
];

/** Parseo tolerante de superficies en string (formato chileno "1.640" / "8117,5"). */
const toNum = (s?: string): number => {
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/\.(?=\d{3}\b)/g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export default function PropuestaView({ projectId, access }: ToolProps) {
  const readOnly = access === 'read';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [valorUF, setValorUF] = useState<number>(38000);
  const [isUFLoading, setIsUFLoading] = useState<boolean>(true);
  const [supTerreno, setSupTerreno] = useState<number>(0);
  const [supExistente, setSupExistente] = useState<number>(0);
  const [supNuevo, setSupNuevo] = useState<number>(0);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [calcName, setCalcName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedPropuesta[]>([]);

  // Siembra de superficies desde el ProjectMaster activo (mientras no se edite un guardado).
  useEffect(() => {
    if (!project || editingId) return;
    setSupTerreno(toNum(project.superficieTerrenoLegal));
    setSupNuevo(toNum(superficieProyecto(project)));
    setSupExistente(0);
  }, [project, editingId]);

  // Valor UF del dia (con fallback a 38.000).
  useEffect(() => {
    let alive = true;
    (async () => {
      setIsUFLoading(true);
      try {
        const r = await fetch('https://mindicador.cl/api/uf');
        const d = await r.json();
        if (alive && d?.serie?.length && !editingId) setValorUF(d.serie[0].valor);
      } catch { /* fallback 38000 */ }
      finally { if (alive) setIsUFLoading(false); }
    })();
    return () => { alive = false; };
  }, [editingId]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
  const formatUF = (v: number) => `${v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  const getArea = (c: AreaCategory) => c === 'terreno' ? supTerreno : c === 'existente' ? supExistente : supNuevo;
  const toggleService = (id: string) => { if (readOnly) return; setServices(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)); };

  const groupedServices = useMemo(() => {
    const g: Record<string, ServiceItem[]> = {};
    services.forEach(s => { (g[s.etapa] ||= []).push(s); });
    return g;
  }, [services]);

  const { totalUF, totalCLP } = useMemo(() => {
    let u = 0; services.forEach(s => { if (s.selected) u += s.valorUnitario * getArea(s.areaCategory); });
    return { totalUF: u, totalCLP: u * valorUF };
  }, [services, supTerreno, supExistente, supNuevo, valorUF]);

  const handleEdit = (calc: SavedPropuesta) => {
    setCalcName(calc.resultTitle); setEditingId(calc.id);
    const s = calc.snapshot;
    setServices(s.services); setValorUF(s.valorUF);
    setSupTerreno(s.supTerreno); setSupExistente(s.supExistente); setSupNuevo(s.supNuevo);
  };
  const handleSaveLocal = () => {
    if (readOnly || !calcName.trim() || totalUF === 0) return;
    const nuevo: SavedPropuesta = {
      id: editingId || `pr-${Date.now()}`, resultTitle: calcName,
      inputValue: `${services.filter(s => s.selected).length} Módulos`,
      totalUF, totalCLP,
      snapshot: { services, valorUF, supTerreno, supExistente, supNuevo },
    };
    setSaved(prev => editingId ? prev.map(c => c.id === editingId ? nuevo : c) : [nuevo, ...prev]);
    setEditingId(null); setCalcName('');
  };
  const handleCancelEdit = () => { setEditingId(null); setCalcName(''); setServices(INITIAL_SERVICES); };
  const onDelete = (id: string) => setSaved(prev => prev.filter(c => c.id !== id));

  const numInput = { fontFamily: 'monospace', textAlign: 'right' as const, fontWeight: 'bold' as const };

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.FileText size={22} strokeWidth={1.4} />
        Propuesta de Honorarios de Servicios <span className="tech-pulse" style={{ color: 'var(--destructive)' }}>_</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 24 }}>
        {project ? `Proyecto: ${project.name} · ${project.comuna || 's/comuna'}` : 'Sin proyecto activo: ingresa las superficies manualmente.'}
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="tool-panel">
              <div className="module-header">
                <span>| PARAMETROS DEL PROYECTO</span>
                {isUFLoading && <span style={{ fontSize: 10, color: 'var(--destructive)' }}>Sincronizando UF...</span>}
              </div>
              <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 15 }}>
                <div className="tech-input-group"><label>VALOR UF DEL DIA (CLP)</label><input type="number" className="tech-input" value={valorUF} disabled={readOnly} onChange={e => setValorUF(Number(e.target.value))} style={numInput} /></div>
                <div className="tech-input-group"><label>SUP. TERRENO (m2)</label><input type="number" className="tech-input" value={supTerreno} disabled={readOnly} onChange={e => setSupTerreno(Number(e.target.value))} style={numInput} /></div>
                <div className="tech-input-group"><label>SUP. EXISTENTE (m2)</label><input type="number" className="tech-input" value={supExistente} disabled={readOnly} onChange={e => setSupExistente(Number(e.target.value))} style={numInput} /></div>
                <div className="tech-input-group"><label>SUP. PROYECTO NUEVO (m2)</label><input type="number" className="tech-input" value={supNuevo} disabled={readOnly} onChange={e => setSupNuevo(Number(e.target.value))} style={numInput} /></div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="tool-panel">
              <div className="module-header">| MATRIZ DE ALCANCES</div>
              <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {Object.entries(groupedServices).map(([etapa, items]) => (
                  <div key={etapa}>
                    <h3 style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>{etapa}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {items.map(item => {
                        const areaAplicada = getArea(item.areaCategory);
                        const costoItemUF = item.valorUnitario * areaAplicada;
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <button onClick={() => toggleService(item.id)} disabled={readOnly} style={{ background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: 'inherit' }}>
                                {item.selected ? <Icons.CheckSquare strokeWidth={1.5} size={18} /> : <Icons.Square strokeWidth={1.5} size={18} />}
                              </button>
                              <span style={{ opacity: item.selected ? 1 : 0.5, fontWeight: item.selected ? 'bold' : 'normal', fontSize: 11, textTransform: 'uppercase' }}>{item.descripcion}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontFamily: 'monospace', fontSize: 13, opacity: item.selected ? 1 : 0.4 }}>
                              <div style={{ width: 84, textAlign: 'right' }}><span style={{ opacity: 0.6, display: 'block', fontSize: 10, marginBottom: 2 }}>VALOR UNIT.</span><strong>{item.valorUnitario.toFixed(2)}</strong> <span style={{ fontSize: 10 }}>UF/m2</span></div>
                              <div style={{ width: 84, textAlign: 'right' }}><span style={{ opacity: 0.6, display: 'block', fontSize: 10, marginBottom: 2 }}>AREA ({item.areaCategory})</span><strong>{areaAplicada}</strong> <span style={{ fontSize: 10 }}>m2</span></div>
                              <div style={{ width: 100, textAlign: 'right', color: 'var(--destructive)' }}><span style={{ opacity: 0.6, display: 'block', fontSize: 10, color: 'var(--foreground)', marginBottom: 2 }}>SUBTOTAL</span><span style={{ fontSize: 14, fontWeight: 'bold' }}>{formatUF(costoItemUF)}</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="tool-panel">
              <div className="module-header">| TOTAL HONORARIOS</div>
              <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ background: 'var(--muted)', padding: 15, border: '1.5px solid var(--border)', textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', display: 'block', opacity: 0.7 }}>TOTAL ESTIMADO (UF)</span>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--destructive)' }}>{formatUF(totalUF)}</div>
                  <div style={{ borderTop: '1px dashed var(--border)', margin: '10px 0' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', display: 'block', opacity: 0.7 }}>EQUIVALENTE NETO (CLP)</span>
                  <div style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }}>{formatCurrency(totalCLP)}</div>
                </div>
                <div className="tech-input-group"><label>NOMBRE DE LA PROPUESTA</label><input type="text" className="tech-input" value={calcName} disabled={readOnly} onChange={e => setCalcName(e.target.value)} placeholder="Ej: Propuesta V1 - Diseño Completo" /></div>
                <button className="technical-btn" onClick={handleSaveLocal} disabled={readOnly || !calcName.trim() || totalUF === 0} style={{ width: '100%' }}>
                  <Icons.Save size={16} strokeWidth={1.5} style={{ marginRight: 8 }} />{editingId ? '[ ACTUALIZAR PROPUESTA ]' : '[ GUARDAR EN EXPEDIENTE ]'}
                </button>
                {editingId && <button onClick={handleCancelEdit} className="technical-btn secondary" style={{ width: '100%' }}>[ CANCELAR EDICION ]</button>}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="tool-panel">
              <div className="module-header">| REGISTRO HISTORICO ({saved.length})</div>
              <div className="panel-content" style={{ overflowY: 'auto', maxHeight: 400, padding: 15 }}>
                {saved.length === 0 ? (
                  <div style={{ opacity: 0.5, textAlign: 'center', marginTop: 20, fontWeight: 'bold', fontSize: 11 }}>SIN PROPUESTAS GUARDADAS</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {saved.map(calc => (
                      <div key={calc.id} style={{ border: '1.5px solid var(--border)', padding: 12, background: editingId === calc.id ? 'var(--muted)' : 'var(--card)' }}>
                        <h4 style={{ margin: 0, fontSize: 11, fontWeight: 'bold' }}><Icons.FileText size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> {calc.resultTitle}</h4>
                        <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: 'var(--destructive)' }}>{formatUF(calc.totalUF)}</p>
                        <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: 11, opacity: 0.7 }}>MODULOS: {calc.inputValue}</p>
                        <div style={{ display: 'flex', gap: 5, marginTop: 10, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                          <button onClick={() => handleEdit(calc)} disabled={readOnly} className="technical-btn secondary" style={{ flex: 1, padding: 4, fontSize: 9, display: 'flex', justifyContent: 'center', gap: 5 }}><Icons.Edit2 size={12} strokeWidth={1.5} /> [ EDITAR ]</button>
                          <button onClick={() => onDelete(calc.id)} disabled={readOnly} className="technical-btn secondary" style={{ padding: '4px 8px', fontSize: 9, color: 'var(--destructive)' }}><Icons.Trash2 size={12} strokeWidth={1.5} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.FileText size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Propuesta de Honorarios" documentId="T-05" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Propuesta de Honorarios</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: '#1a1a1a' }}><tbody>
              {services.filter((s) => s.selected).map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #d8d8d8' }}>{s.descripcion}</td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatUF(s.valorUnitario * getArea(s.areaCategory))}</td>
                </tr>
              ))}
              <tr><td style={{ padding: '6px 8px', fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>TOTAL (UF)</td><td style={{ padding: '6px 8px', fontWeight: 800, borderTop: '2px solid #1a1a1a', textAlign: 'right' }}>{formatUF(totalUF)}</td></tr>
              <tr><td style={{ padding: '4px 8px' }}>Equivalente (CLP)</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(totalCLP)}</td></tr>
            </tbody></table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </div>
  );
}
