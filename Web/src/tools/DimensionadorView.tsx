/* =============================================================================
   DimensionadorView.tsx — DIMENSIONADOR DE PROYECTO (T-14)
   -----------------------------------------------------------------------------
   Programa de recintos, % de circulación y muros, y cálculo de superficie total.
   Al guardar escribe superficieCalculada + superficieOrigen='DIMENSIONADOR' en el
   ProjectMaster activo (useProjects().repo.save) y archiva el programa en
   localStorage bajo ab-dimensionador-${projectId}.
   ============================================================================= */
import { useEffect, useMemo, useState, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps, ProjectMaster } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface RecintoBase { id: string; nombre: string; areaBase: number; }
interface RecintoItem { id: string; nombre: string; areaAplicada: number; cantidad: number; destino: string; }
interface ProgramaGuardado { programa: RecintoItem[]; circulacion: number; }

/* ── constantes ────────────────────────────────────────────────────────────── */
const TOOL_ID = 'dimensionador';

const RECINTOS_POR_DEFECTO: Record<string, RecintoBase[]> = {
  'Vivienda': [{ id: 'v1', nombre: 'Dormitorio Principal', areaBase: 12 }, { id: 'v2', nombre: 'Dormitorio Secundario', areaBase: 9 }, { id: 'v3', nombre: 'Baño', areaBase: 1.5 }, { id: 'v4', nombre: 'Estar', areaBase: 20 }, { id: 'v5', nombre: 'Comedor', areaBase: 12 }, { id: 'v6', nombre: 'Cocina', areaBase: 10 }, { id: 'v7', nombre: 'Logia', areaBase: 4 }, { id: 'v8', nombre: 'Terraza', areaBase: 8 }],
  'Oficinas': [{ id: 'of1', nombre: 'Oficina Gerencial / Director', areaBase: 18 }, { id: 'of2', nombre: 'Oficina Privada Estándar', areaBase: 12 }, { id: 'of3', nombre: 'Sala de Reuniones Ejecutivas', areaBase: 24 }, { id: 'of4', nombre: 'Área Open Office / Cowork', areaBase: 45 }, { id: 'of5', nombre: 'Recepción / Espera Visitas', areaBase: 14 }, { id: 'of6', nombre: 'Kitchenette / Comedor Personal', areaBase: 8 }, { id: 'of7', nombre: 'Módulo de Archivo e Impresión', areaBase: 6 }, { id: 'of8', nombre: 'Sala de Servidores y Racks UT', areaBase: 5 }],
  'Local Comercial': [{ id: 'lc1', nombre: 'Área de Ventas', areaBase: 40 }, { id: 'lc2', nombre: 'Bodega', areaBase: 15 }, { id: 'lc3', nombre: 'Baño Público', areaBase: 4 }, { id: 'lc4', nombre: 'Baño Personal', areaBase: 3 }, { id: 'lc5', nombre: 'Oficina Admin', areaBase: 9 }],
  'Salud': [{ id: 's1', nombre: 'Consulta Médica', areaBase: 15 }, { id: 's2', nombre: 'Sala de Espera', areaBase: 20 }, { id: 's3', nombre: 'Recepción', areaBase: 10 }, { id: 's4', nombre: 'Baño Universal', areaBase: 4.5 }],
  'Cultura': [{ id: 'c1', nombre: 'Sala de Exposición', areaBase: 100 }, { id: 'c2', nombre: 'Auditorio', areaBase: 200 }, { id: 'c3', nombre: 'Foyer', areaBase: 50 }, { id: 'c4', nombre: 'Baños Públicos', areaBase: 20 }],
  'Equipamiento': [{ id: 'e1', nombre: 'Salón Multiuso', areaBase: 80 }, { id: 'e2', nombre: 'Cocina', areaBase: 15 }, { id: 'e3', nombre: 'Baños', areaBase: 15 }],
};

/* ── helpers puros ─────────────────────────────────────────────────────────── */
function calcularSuperficies(programa: RecintoItem[], circulacionPorcentaje: number) {
  const subtotalM2 = programa.reduce((acc, item) => acc + item.areaAplicada * item.cantidad, 0);
  const circulacionM2 = subtotalM2 * (circulacionPorcentaje / 100);
  return { subtotalM2, circulacionM2, totalM2: subtotalM2 + circulacionM2 };
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function DimensionadorView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, reload } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  // Persistencia unificada (Fase 2): programa + circulación vía useToolData.
  const { data, setData, save } = useToolData<ProgramaGuardado>(TOOL_ID, projectId, { programa: [], circulacion: 20 });
  const { programa, circulacion } = data;
  const setPrograma = (u: SetStateAction<RecintoItem[]>) => setData((d) => ({ ...d, programa: typeof u === 'function' ? u(d.programa) : u }));
  const setCirculacion = (u: SetStateAction<number>) => setData((d) => ({ ...d, circulacion: typeof u === 'function' ? u(d.circulacion) : u }));
  const [dimCalcName, setDimCalcName] = useState('');
  const [destino, setDestino] = useState('Vivienda');
  const [catalogQuantities, setCatalogQuantities] = useState<Record<string, number>>({});
  const [catalogAreas, setCatalogAreas] = useState<Record<string, number>>({});
  const [manualNombre, setManualNombre] = useState('');
  const [manualCantidad, setManualCantidad] = useState(1);
  const [manualArea, setManualArea] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  /* La carga inicial la gestiona useToolData (nube Premium / localStorage Free). */

  if (!project) return (
    <div>
      <p className="tech-quote">Selecciona un proyecto para usar el Dimensionador.</p>
    </div>
  );

  /* ── catálogo y manual ── */
  const getCatalogQuantity = (id: string) => catalogQuantities[id] ?? 1;
  const getCatalogArea = (id: string, base: number) => catalogAreas[id] ?? base;
  const setCatalogQuantity = (id: string, val: number) => setCatalogQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));
  const setCatalogArea = (id: string, val: number) => setCatalogAreas(prev => ({ ...prev, [id]: Math.max(0.1, val) }));

  const handleAddFromCatalog = (recinto: RecintoBase) => {
    if (readOnly) return;
    const qty = getCatalogQuantity(recinto.id); const area = getCatalogArea(recinto.id, recinto.areaBase);
    setPrograma(prev => [...prev, { id: `${recinto.id}-${Date.now()}`, nombre: recinto.nombre, areaAplicada: area, cantidad: qty, destino }]);
    triggerToast(`"${recinto.nombre}" añadido.`);
  };
  const handleAddEscalera = () => {
    if (readOnly) return;
    setPrograma(prev => [...prev, { id: `escalera-${Date.now()}`, nombre: 'Escalera', areaAplicada: 5, cantidad: 1, destino }]);
    triggerToast('Se añadió Escalera al programa.');
  };
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !manualNombre.trim()) return;
    setPrograma(prev => [...prev, { id: `manual-${Date.now()}`, nombre: manualNombre.trim(), areaAplicada: Number(manualArea) || 1, cantidad: Number(manualCantidad) || 1, destino }]);
    setManualNombre(''); setManualCantidad(1); setManualArea(10);
    triggerToast('Recinto añadido manualmente.');
  };
  const updateItem = (id: string, updates: Partial<RecintoItem>) => setPrograma(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  const removeItem = (id: string) => setPrograma(prev => prev.filter(item => item.id !== id));

  /* ── guardado: programa local + superficie al master ── */
  const handleSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    try {
      const { totalM2 } = calcularSuperficies(programa, circulacion);
      await save();
      const updated: ProjectMaster = { ...project, superficieCalculada: totalM2.toFixed(1), superficieOrigen: 'DIMENSIONADOR' };
      await repo.save(updated);
      await reload();
      setDimCalcName('');
      triggerToast('Programa guardado y superficie sincronizada con el proyecto.');
    } catch {
      triggerToast('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const { subtotalM2, circulacionM2, totalM2 } = useMemo(() => calcularSuperficies(programa, circulacion), [programa, circulacion]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Maximize size={22} strokeWidth={1.4} /> Dimensionador de Proyecto
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Ingrese el programa de recintos para calcular automáticamente las superficies totales.
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* COLUMNA 1: CATÁLOGO */}
        <div style={{ flex: '2 1 380px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="tool-panel">
            <div className="module-header" style={{ justifyContent: 'space-between' }}>
              <span>◧ | CATÁLOGO DE RECINTOS</span>
              <select value={destino} onChange={e => setDestino(e.target.value)} className="tech-select" disabled={readOnly} style={{ height: 26, padding: '2px 24px 2px 8px', fontSize: 11 }}>
                {Object.keys(RECINTOS_POR_DEFECTO).map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="panel-content" style={{ padding: 0, maxHeight: 520, overflowY: 'auto' }}>
              {RECINTOS_POR_DEFECTO[destino]?.map(rec => {
                const qty = getCatalogQuantity(rec.id); const area = getCatalogArea(rec.id, rec.areaBase);
                return (
                  <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1.5px solid var(--border)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.nombre}</span>
                    <span style={{ fontSize: 9, opacity: 0.55, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>SUP. {rec.areaBase} M²</span>
                    <div className="counter-box" style={{ height: 24 }}>
                      <button type="button" className="counter-btn" disabled={readOnly} onClick={() => setCatalogQuantity(rec.id, qty - 1)} style={{ width: 20 }}>-</button>
                      <span style={{ width: 22, textAlign: 'center', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}>{qty}</span>
                      <button type="button" className="counter-btn" disabled={readOnly} onClick={() => setCatalogQuantity(rec.id, qty + 1)} style={{ width: 20 }}>+</button>
                    </div>
                    <input type="number" step="0.5" min="0.1" value={area} disabled={readOnly} onChange={e => setCatalogArea(rec.id, Number(e.target.value))} style={{ width: 46, height: 24, border: '1px solid var(--border)', textAlign: 'right', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace', padding: '0 4px', background: 'var(--card)', color: 'var(--foreground)' }} />
                    <button type="button" onClick={() => handleAddFromCatalog(rec)} disabled={readOnly} className="technical-btn secondary" style={{ fontSize: 9, padding: '4px 8px', whiteSpace: 'nowrap' }}>[ AGREGAR ]</button>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 15, background: 'var(--muted)', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 'bold', opacity: 0.6 }}>MÓDULO DE ESCAPE:</span>
              <button type="button" onClick={handleAddEscalera} disabled={readOnly} className="technical-btn secondary" style={{ fontSize: 9, padding: '6px 12px' }}>+ ESCALERA (5.0 M²)</button>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: MANUAL */}
        <div style={{ flex: '1 1 210px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleAddManual} className="tool-panel">
            <div className="module-header"><span>§ | AGREGAR RECINTO MANUAL</span></div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>NOMBRE DEL RECINTO</label>
                <input type="text" value={manualNombre} disabled={readOnly} onChange={e => setManualNombre(e.target.value)} placeholder="E.G. PASILLO TÉCNICO..." className="tech-input" style={{ textTransform: 'uppercase', fontWeight: 'bold' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label>CANTIDAD</label>
                  <input type="number" min="1" value={manualCantidad} disabled={readOnly} onChange={e => setManualCantidad(Math.max(1, Number(e.target.value)))} className="tech-input" style={{ textAlign: 'right', fontWeight: 'bold' }} />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label>M² ÚTIL</label>
                  <input type="number" step="0.1" min="0.1" value={manualArea} disabled={readOnly} onChange={e => setManualArea(Math.max(0.1, Number(e.target.value)))} className="tech-input" style={{ textAlign: 'right', fontWeight: 'bold' }} />
                </div>
              </div>
              <button type="submit" disabled={readOnly} className="technical-btn" style={{ width: '100%', marginTop: 10 }}>[ + REGISTRAR EN TABLA ]</button>
            </div>
          </form>
        </div>

        {/* COLUMNA 3: TABLA */}
        <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="tool-panel" style={{ padding: 0 }}>
            <div className="module-header"><span>◈ | CÁLCULO ESTRUCTURAL DE SUPERFICIES</span></div>
            <div className="panel-content">
              {programa.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', border: '2px dashed var(--border)', background: 'var(--muted)', marginTop: 16 }}>
                  <div style={{ fontSize: 28, opacity: 0.4, fontWeight: 'bold' }}>◈</div>
                  <p style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>Programa arquitectónico vacío</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginTop: 16, marginBottom: 16 }}>
                  <table className="tech-table">
                    <thead><tr><th>NOMBRE ESPACIO</th><th style={{ textAlign: 'center', width: 90 }}>CANT</th><th style={{ textAlign: 'right', width: 90 }}>M² UNIT</th><th style={{ textAlign: 'right', width: 100 }}>TOTAL M²</th><th style={{ width: 50 }}></th></tr></thead>
                    <tbody>
                      {programa.map(item => (
                        <tr key={item.id}>
                          <td><input type="text" value={item.nombre} disabled={readOnly} onChange={e => updateItem(item.id, { nombre: e.target.value })} style={{ fontWeight: 'bold', textTransform: 'uppercase', width: '100%', fontSize: 11, background: 'var(--muted)', border: '2px solid var(--border)', padding: '4px 8px', color: 'var(--foreground)' }} /></td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="counter-box" style={{ height: 24 }}>
                              <button type="button" className="counter-btn" disabled={readOnly} onClick={() => updateItem(item.id, { cantidad: Math.max(1, item.cantidad - 1) })} style={{ width: 20 }}>-</button>
                              <span style={{ padding: '0 6px', fontWeight: 'bold' }}>{item.cantidad}</span>
                              <button type="button" className="counter-btn" disabled={readOnly} onClick={() => updateItem(item.id, { cantidad: item.cantidad + 1 })} style={{ width: 20 }}>+</button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}><input type="number" step="0.5" min="0.1" value={item.areaAplicada} disabled={readOnly} onChange={e => updateItem(item.id, { areaAplicada: Math.max(0.1, Number(e.target.value)) })} style={{ width: 70, fontWeight: 'bold', fontSize: 11, background: 'var(--muted)', border: '2px solid var(--border)', padding: '4px 6px', textAlign: 'right', color: 'var(--foreground)' }} /></td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 11 }}>{(item.areaAplicada * item.cantidad).toFixed(1)}</td>
                          <td style={{ textAlign: 'center' }}><button type="button" onClick={() => removeItem(item.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 6px', fontSize: 10 }}>[X]</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
                  <span style={{ opacity: 0.7 }}>Corrección por muros y circulaciones:</span>
                  <span style={{ background: 'var(--muted)', padding: '2px 8px', border: '1px solid var(--border)' }}>{circulacion}%</span>
                </div>
                <input type="range" min="5" max="45" value={circulacion} disabled={readOnly} onChange={e => setCirculacion(Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed var(--border)' }}>
                <div style={{ background: 'var(--muted)', border: '2px solid var(--border)', padding: 16, fontWeight: 'bold', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', opacity: 0.8 }}><span>Subtotal:</span><span>{subtotalM2.toFixed(1)} M²</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', opacity: 0.8 }}><span>Muros (Factor {circulacion}%):</span><span>{circulacionM2.toFixed(1)} M²</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase' }}>Superficie construida total:</span>
                    <div style={{ background: 'var(--card)', border: '3px solid var(--border)', padding: '6px 12px', minWidth: 100, textAlign: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--destructive)' }}>{totalM2.toFixed(1)} <span style={{ fontSize: 12 }}>M²</span></span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="tech-input-group" style={{ marginBottom: 10 }}>
                    <label>NOMBRE DE LA SIMULACIÓN (REFERENCIAL)</label>
                    <input type="text" className="tech-input" placeholder="Ej: Opción 1 - Básica" value={dimCalcName} disabled={readOnly} onChange={e => setDimCalcName(e.target.value)} />
                  </div>
                  <button type="button" onClick={handleSave} disabled={isSaving || readOnly} className="technical-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 24px', fontSize: 14 }}>
                    {isSaving ? '⎔' : <Icons.Save size={18} />} <span>[ SALVAR FICHA Y SINCRONIZAR SUPERFICIE ]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.FileText size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Dimensionador de Proyecto" documentId="T-14" projectId={projectId}>
          <div style={{ fontSize: 12, color: '#1a1a1a' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Programa de Recintos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Recinto</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Cant.</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>m² unit</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Total m²</th>
              </tr></thead>
              <tbody>
                {programa.length === 0 ? (
                  <tr><td style={{ padding: '6px 8px', color: '#666' }} colSpan={4}>Programa vacío.</td></tr>
                ) : programa.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{item.nombre}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{item.cantidad}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{item.areaAplicada.toFixed(1)}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{(item.areaAplicada * item.cantidad).toFixed(1)}</td>
                  </tr>
                ))}
                <tr><td style={{ padding: '6px 8px' }} colSpan={3}>Subtotal</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{subtotalM2.toFixed(1)}</td></tr>
                <tr><td style={{ padding: '6px 8px' }} colSpan={3}>Muros y circulación ({circulacion}%)</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{circulacionM2.toFixed(1)}</td></tr>
                <tr><td style={{ padding: '6px 8px', fontWeight: 800, borderTop: '2px solid #1a1a1a' }} colSpan={3}>SUPERFICIE CONSTRUIDA TOTAL</td><td style={{ padding: '6px 8px', fontWeight: 800, textAlign: 'right', borderTop: '2px solid #1a1a1a' }}>{totalM2.toFixed(1)} m²</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
