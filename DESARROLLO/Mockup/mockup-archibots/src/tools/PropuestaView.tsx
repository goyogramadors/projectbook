/* PropuestaView — recuperado de remix dimensionador (PropuestaHonorariosView).
   Standalone + datos MOCK + historial en estado local. UF con fallback. */
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

type AreaCategory = 'terreno' | 'existente' | 'nuevo';
type EtapaCategory = 'Estudios Previos' | 'Diseño y Arquitectura' | 'Desarrollo de Especialidades' | 'Tramitaciones' | 'Supervisión de Obras';
interface ServiceItem { id: string; etapa: EtapaCategory; descripcion: string; selected: boolean; valorUnitario: number; areaCategory: AreaCategory; }

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

export default function PropuestaView() {
  const [valorUF, setValorUF] = useState<number>(38000);
  const [isUFLoading, setIsUFLoading] = useState<boolean>(true);
  const [supTerreno, setSupTerreno] = useState<number>(1640);
  const [supExistente, setSupExistente] = useState<number>(0);
  const [supNuevo, setSupNuevo] = useState<number>(8117);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [calcName, setCalcName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedPropuestas, setSavedPropuestas] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setIsUFLoading(true);
      try {
        const r = await fetch('https://mindicador.cl/api/uf');
        const d = await r.json();
        if (alive && d?.serie?.length && !editingId) setValorUF(d.serie[0].valor);
      } catch (e) { /* fallback 38000 */ }
      finally { if (alive) setIsUFLoading(false); }
    })();
    return () => { alive = false; };
  }, [editingId]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
  const formatUF = (v: number) => `${v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  const getArea = (c: AreaCategory) => c === 'terreno' ? supTerreno : c === 'existente' ? supExistente : supNuevo;
  const toggleService = (id: string) => setServices(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));

  const groupedServices = useMemo(() => {
    const g: Record<string, ServiceItem[]> = {};
    services.forEach(s => { (g[s.etapa] ||= []).push(s); });
    return g;
  }, [services]);

  const { totalUF, totalCLP } = useMemo(() => {
    let u = 0; services.forEach(s => { if (s.selected) u += s.valorUnitario * getArea(s.areaCategory); });
    return { totalUF: u, totalCLP: u * valorUF };
  }, [services, supTerreno, supExistente, supNuevo, valorUF]);

  const handleEdit = (calc: any) => {
    setCalcName(calc.resultTitle); setEditingId(calc.id);
    const dataNote = calc.notes?.find((n: string) => n.startsWith('__DATA:'));
    if (dataNote) { try { const d = JSON.parse(dataNote.replace('__DATA:', '')); setServices(d.services || INITIAL_SERVICES); setValorUF(d.valorUF || 38000); setSupTerreno(d.supTerreno || 0); setSupExistente(d.supExistente || 0); setSupNuevo(d.supNuevo || 0); } catch (e) {} }
  };
  const handleSaveLocal = () => {
    if (!calcName.trim() || totalUF === 0) return;
    const nuevo = {
      id: editingId || `pr-${Date.now()}`, toolId: 'calc-propuesta', resultTitle: calcName, inputValue: `${services.filter(s => s.selected).length} Módulos`,
      metrics: [{ name: 'Total Honorarios', value: formatUF(totalUF) }, { name: 'Equivalente Neto', value: formatCurrency(totalCLP) }],
      notes: [`__DATA:${JSON.stringify({ services, valorUF, supTerreno, supExistente, supNuevo })}`],
    };
    setSavedPropuestas(prev => editingId ? prev.map(c => c.id === editingId ? nuevo : c) : [nuevo, ...prev]);
    setEditingId(null); setCalcName('');
  };
  const handleCancelEdit = () => { setEditingId(null); setCalcName(''); setServices(INITIAL_SERVICES); };
  const onDelete = (id: string) => setSavedPropuestas(prev => prev.filter(c => c.id !== id));

  const inputStyle = { fontFamily: 'monospace', textAlign: 'right' as const, fontSize: '15px', fontWeight: 'bold' as const };

  return (
    <div>
      <div className="free-text-section" style={{ marginBottom: '24px' }}>
        <h1 className="page-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.FileText size={24} strokeWidth={1.2} />
          PROPUESTA DE HONORARIOS DE SERVICIOS <span className="tech-pulse" style={{ color: 'var(--accent-red)' }}>_</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="tool-panel">
              <div className="module-header">| PARÁMETROS DEL PROYECTO{isUFLoading && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--accent-red)' }}>Sincronizando UF...</span>}</div>
              <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <div className="tech-input-group"><label>VALOR UF DEL DÍA (CLP)</label><input type="number" className="tech-input" value={valorUF} onChange={e => setValorUF(Number(e.target.value))} style={inputStyle} /></div>
                <div className="tech-input-group"><label>SUP. TERRENO (m²)</label><input type="number" className="tech-input" value={supTerreno} onChange={e => setSupTerreno(Number(e.target.value))} style={inputStyle} /></div>
                <div className="tech-input-group"><label>SUP. EXISTENTE (m²)</label><input type="number" className="tech-input" value={supExistente} onChange={e => setSupExistente(Number(e.target.value))} style={inputStyle} /></div>
                <div className="tech-input-group"><label>SUP. PROYECTO NUEVO (m²)</label><input type="number" className="tech-input" value={supNuevo} onChange={e => setSupNuevo(Number(e.target.value))} style={inputStyle} /></div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="tool-panel">
              <div className="module-header">| MATRIZ DE ALCANCES</div>
              <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {Object.entries(groupedServices).map(([etapa, items]) => (
                  <div key={etapa}>
                    <h3 style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>{etapa}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {(items as ServiceItem[]).map(item => {
                        const areaAplicada = getArea(item.areaCategory);
                        const costoItemUF = item.valorUnitario * areaAplicada;
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <button onClick={() => toggleService(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                                {item.selected ? <Icons.CheckSquare strokeWidth={1.5} size={18} /> : <Icons.Square strokeWidth={1.5} size={18} />}
                              </button>
                              <span style={{ opacity: item.selected ? 1 : 0.5, fontWeight: item.selected ? 'bold' : 'normal', fontSize: '11px', textTransform: 'uppercase' }}>{item.descripcion}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontFamily: 'monospace', fontSize: '13px', opacity: item.selected ? 1 : 0.4 }}>
                              <div style={{ width: '90px', textAlign: 'right' }}><span style={{ opacity: 0.6, display: 'block', fontSize: '10px', marginBottom: '2px' }}>VALOR UNIT.</span><strong>{item.valorUnitario.toFixed(2)}</strong> <span style={{ fontSize: '10px' }}>UF/m²</span></div>
                              <div style={{ width: '90px', textAlign: 'right' }}><span style={{ opacity: 0.6, display: 'block', fontSize: '10px', marginBottom: '2px' }}>ÁREA ({item.areaCategory})</span><strong>{areaAplicada}</strong> <span style={{ fontSize: '10px' }}>m²</span></div>
                              <div style={{ width: '100px', textAlign: 'right', color: 'var(--accent-red)' }}><span style={{ opacity: 0.6, display: 'block', fontSize: '10px', color: 'var(--text-primary)', marginBottom: '2px' }}>SUBTOTAL</span><span style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatUF(costoItemUF)}</span></div>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="tool-panel">
              <div className="module-header">| TOTAL HONORARIOS</div>
              <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ backgroundColor: 'var(--bg-grey)', padding: '15px', border: '1.5px solid var(--border-color)', textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', display: 'block', opacity: 0.7 }}>TOTAL ESTIMADO (UF)</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-red)' }}>{formatUF(totalUF)}</div>
                  <div style={{ borderTop: '1px dashed var(--border-color)', margin: '10px 0' }}></div>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', display: 'block', opacity: 0.7 }}>EQUIVALENTE NETO (CLP)</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatCurrency(totalCLP)}</div>
                </div>
                <div className="tech-input-group"><label>NOMBRE DE LA PROPUESTA</label><input type="text" className="tech-input" value={calcName} onChange={e => setCalcName(e.target.value)} placeholder="Ej: Propuesta V1 - Diseño Completo" /></div>
                <button className="technical-btn" onClick={handleSaveLocal} disabled={!calcName.trim() || totalUF === 0} style={{ width: '100%', backgroundColor: editingId ? '#10B981' : undefined, borderColor: editingId ? '#10B981' : undefined }}>
                  <Icons.Save size={16} strokeWidth={1.5} style={{ marginRight: '8px' }} />{editingId ? '[ ACTUALIZAR PROPUESTA ]' : '[ GUARDAR EN EXPEDIENTE ]'}
                </button>
                {editingId && <button onClick={handleCancelEdit} className="technical-btn secondary" style={{ width: '100%' }}>[ CANCELAR EDICIÓN ]</button>}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="tool-panel">
              <div className="module-header">| REGISTRO HISTÓRICO ({savedPropuestas.length})</div>
              <div className="panel-content" style={{ overflowY: 'auto', maxHeight: '400px', padding: '15px' }}>
                {savedPropuestas.length === 0 ? (
                  <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px', fontWeight: 'bold', fontSize: '11px' }}>SIN PROPUESTAS GUARDADAS</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {savedPropuestas.map(calc => (
                      <div key={calc.id} style={{ border: '1.5px solid var(--border-color)', padding: '12px', backgroundColor: editingId === calc.id ? 'var(--bg-grey)' : 'var(--card)' }}>
                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}><Icons.FileText size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> {calc.resultTitle}</h4>
                        <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-red)' }}>{calc.metrics[0]?.value}</p>
                        <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: '11px', opacity: 0.7 }}>MÓDULOS: {calc.inputValue}</p>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                          <button onClick={() => handleEdit(calc)} className="technical-btn secondary" style={{ flex: 1, padding: '4px', fontSize: '9px', display: 'flex', justifyContent: 'center', gap: '5px' }}><Icons.Edit2 size={12} strokeWidth={1.5} /> [ EDITAR ]</button>
                          <button onClick={() => onDelete(calc.id)} className="technical-btn secondary" style={{ padding: '4px 8px', fontSize: '9px', color: 'var(--accent-red)' }}><Icons.Trash2 size={12} strokeWidth={1.5} /></button>
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
    </div>
  );
}
