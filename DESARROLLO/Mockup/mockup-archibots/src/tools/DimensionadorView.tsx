/* DimensionadorView — recuperado de remix dimensionador (idéntico visual/funcional).
   Adaptado a standalone + datos MOCK (sin Firebase/contexto). */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export interface RecintoBase { id: string; nombre: string; areaBase: number; }

export const RECINTOS_POR_DEFECTO: Record<string, RecintoBase[]> = {
  'Vivienda': [{ id: 'v1', nombre: 'Dormitorio Principal', areaBase: 12 }, { id: 'v2', nombre: 'Dormitorio Secundario', areaBase: 9 }, { id: 'v3', nombre: 'Baño', areaBase: 1.5 }, { id: 'v4', nombre: 'Estar', areaBase: 20 }, { id: 'v5', nombre: 'Comedor', areaBase: 12 }, { id: 'v6', nombre: 'Cocina', areaBase: 10 }, { id: 'v7', nombre: 'Logia', areaBase: 4 }, { id: 'v8', nombre: 'Terraza', areaBase: 8 }],
  'Oficinas': [ { id: 'of1', nombre: 'Oficina Gerencial / Director', areaBase: 18 }, { id: 'of2', nombre: 'Oficina Privada Estándar', areaBase: 12 }, { id: 'of3', nombre: 'Sala de Reuniones Ejecutivas', areaBase: 24 }, { id: 'of4', nombre: 'Área Open Office / Cowork', areaBase: 45 }, { id: 'of5', nombre: 'Recepción / Espera Visitas', areaBase: 14 }, { id: 'of6', nombre: 'Kitchenette / Comedor Personal', areaBase: 8 }, { id: 'of7', nombre: 'Módulo de Archivo e Impresión', areaBase: 6 }, { id: 'of8', nombre: 'Sala de Servidores y Racks UT', areaBase: 5 } ],
  'Local Comercial': [{ id: 'lc1', nombre: 'Área de Ventas', areaBase: 40 }, { id: 'lc2', nombre: 'Bodega', areaBase: 15 }, { id: 'lc3', nombre: 'Baño Público', areaBase: 4 }, { id: 'lc4', nombre: 'Baño Personal', areaBase: 3 }, { id: 'lc5', nombre: 'Oficina Admin', areaBase: 9 }],
  'Salud': [{ id: 's1', nombre: 'Consulta Médica', areaBase: 15 }, { id: 's2', nombre: 'Sala de Espera', areaBase: 20 }, { id: 's3', nombre: 'Recepción', areaBase: 10 }, { id: 's4', nombre: 'Baño Universal', areaBase: 4.5 }],
  'Cultura': [{ id: 'c1', nombre: 'Sala de Exposición', areaBase: 100 }, { id: 'c2', nombre: 'Auditorio', areaBase: 200 }, { id: 'c3', nombre: 'Foyer', areaBase: 50 }, { id: 'c4', nombre: 'Baños Públicos', areaBase: 20 }],
  'Equipamiento': [{ id: 'e1', nombre: 'Salón Multiuso', areaBase: 80 }, { id: 'e2', nombre: 'Cocina', areaBase: 15 }, { id: 'e3', nombre: 'Baños', areaBase: 15 }]
};

export const calcularSuperficies = (programa: any[], circulacionPorcentaje: number) => {
  const subtotalM2 = programa.reduce((acc, item) => acc + (item.areaAplicada * item.cantidad), 0);
  const circulacionM2 = subtotalM2 * (circulacionPorcentaje / 100);
  return { subtotalM2, circulacionM2, totalM2: subtotalM2 + circulacionM2 };
};

const Symbols = { Diseno: '◧', Normativa: '§', Calc: '◈' };

// Proyecto mock (sustituye al currentProject que entregaba el contexto Firebase)
const MOCK_PROJECT = {
  name: 'Edificio Los Alerces',
  programaRecintos: [
    { id: 'seed-1', nombre: 'Estar', areaAplicada: 20, cantidad: 1, destino: 'Vivienda' },
    { id: 'seed-2', nombre: 'Dormitorio Principal', areaAplicada: 12, cantidad: 1, destino: 'Vivienda' },
    { id: 'seed-3', nombre: 'Baño', areaAplicada: 4.5, cantidad: 2, destino: 'Vivienda' },
    { id: 'seed-4', nombre: 'Cocina', areaAplicada: 10, cantidad: 1, destino: 'Vivienda' },
  ],
  circulacionPorcentaje: 20,
  calculations: [],
};

interface Props {
  currentProject?: any;
  externalLoadData?: any | null;
  onClearExternalLoad?: () => void;
  onUpdateMaster?: (programa: any[], circulacion: number, superficie: string) => Promise<void>;
  onSaveCalc?: (toolId: string, toolLabel: string, inputValue: string, resultTitle: string, metrics: any[], notes: string[], editId?: string) => Promise<void>;
  triggerToast?: (message: string) => void;
}

export default function DimensionadorView({
  currentProject = MOCK_PROJECT,
  externalLoadData = null,
  onClearExternalLoad = () => {},
  onUpdateMaster = async () => {},
  onSaveCalc = async () => {},
  triggerToast: propToast,
}: Props) {
  const [localToast, setLocalToast] = useState<string | null>(null);
  const triggerToast = propToast || ((m: string) => { setLocalToast(m); window.setTimeout(() => setLocalToast(null), 2800); });

  const [programa, setPrograma] = useState<any[]>([]);
  const [circulacion, setCirculacion] = useState(20);
  const [dimCalcName, setDimCalcName] = useState('');
  const [editingDimId, setEditingDimId] = useState<string | null>(null);
  const [dimCatSugeridoDestino, setDimCatSugeridoDestino] = useState('Vivienda');

  const [catalogQuantities, setCatalogQuantities] = useState<Record<string, number>>({});
  const [catalogAreas, setCatalogAreas] = useState<Record<string, number>>({});

  const [manualNombre, setManualNombre] = useState('');
  const [manualCantidad, setManualCantidad] = useState(1);
  const [manualArea, setManualArea] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (externalLoadData && externalLoadData.toolId === 'calc-dimensionador') {
      const dataNote = externalLoadData.notes?.find((n: string) => n.startsWith('__DATA:'));
      if (dataNote) {
        try {
          const data = JSON.parse(dataNote.replace('__DATA:', ''));
          setPrograma(data.programa || []);
          setCirculacion(data.circulacion || 20);
          setDimCalcName(externalLoadData.resultTitle);
          setEditingDimId(externalLoadData.id);
          triggerToast('Simulación cargada. Puedes editarla y actualizarla.');
        } catch (e) {
          triggerToast('Error al restaurar los metadatos de la simulación.');
        }
      }
      onClearExternalLoad();
    }
  }, [externalLoadData, onClearExternalLoad]);

  useEffect(() => {
    if (!editingDimId) {
      if (currentProject) {
        setPrograma(currentProject.programaRecintos || []);
        setCirculacion(currentProject.circulacionPorcentaje ?? 20);
      } else {
        setPrograma([]); setCirculacion(20); setDimCalcName('');
      }
    }
  }, [currentProject, editingDimId]);

  const getCatalogQuantity = (id: string) => catalogQuantities[id] ?? 1;
  const getCatalogArea = (id: string, base: number) => catalogAreas[id] ?? base;
  const setCatalogQuantity = (id: string, val: number) => setCatalogQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));
  const setCatalogArea = (id: string, val: number) => setCatalogAreas(prev => ({ ...prev, [id]: Math.max(0.1, val) }));

  const handleAddFromCatalog = (recinto: RecintoBase) => {
    const qty = getCatalogQuantity(recinto.id); const area = getCatalogArea(recinto.id, recinto.areaBase);
    setPrograma(prev => [...prev, { id: `${recinto.id}-${Date.now()}`, nombre: recinto.nombre, areaAplicada: area, cantidad: qty, destino: dimCatSugeridoDestino }]);
    triggerToast(`"${recinto.nombre}" añadido.`);
  };

  const handleAddEscalera = () => {
    setPrograma(prev => [...prev, { id: `escalera-${Date.now()}`, nombre: 'Escalera', areaAplicada: 5, cantidad: 1, destino: dimCatSugeridoDestino }]);
    triggerToast('Se añadió Escalera al programa.');
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault(); if (!manualNombre.trim()) return;
    setPrograma(prev => [...prev, { id: `manual-${Date.now()}`, nombre: manualNombre.trim(), areaAplicada: Number(manualArea) || 1, cantidad: Number(manualCantidad) || 1, destino: dimCatSugeridoDestino }]);
    setManualNombre(''); setManualCantidad(1); setManualArea(10);
    triggerToast('Recinto añadido manualmente.');
  };

  const handleUpdateProgramaItem = (id: string, updates: Partial<any>) => setPrograma(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  const handleRemoveProgramaItem = (id: string) => setPrograma(prev => prev.filter(item => item.id !== id));

  const handleSaveDimensionador = async () => {
    if (!currentProject) { triggerToast('◈ ACCESO DENEGADO: Debes seleccionar o crear un proyecto primero.'); return; }
    setIsSaving(true);
    try {
      const { subtotalM2, circulacionM2, totalM2 } = calcularSuperficies(programa, circulacion);
      await onUpdateMaster(programa, circulacion, totalM2.toFixed(1));
      const simulacionData = JSON.stringify({ programa, circulacion });
      const tituloSave = dimCalcName || `Simulación de Programa ${currentProject.calculations?.length ? currentProject.calculations.length + 1 : 1}`;
      await onSaveCalc(
        'calc-dimensionador', 'Dimensionador Paramétrico', `${programa.length} Recintos`, tituloSave,
        [ { name: 'Subtotal M²', value: subtotalM2.toFixed(1), unit: 'M²' }, { name: `Circulación y Muros (${circulacion}%)`, value: circulacionM2.toFixed(1), unit: 'M²' }, { name: 'Superficie Total Estimada', value: totalM2.toFixed(1), unit: 'M²' } ],
        [`__DATA:${simulacionData}`],
        editingDimId || undefined
      );
      setEditingDimId(null); setDimCalcName('');
      triggerToast('Programa actualizado y Simulación Archivada.');
    } catch (err: any) { triggerToast('Error al guardar: ' + err.message); }
    finally { setIsSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditingDimId(null); setDimCalcName('');
    triggerToast('Edición cancelada. Se han restaurado los datos base del proyecto.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="tech-quote" style={{ marginBottom: '20px' }}>
        Módulo analítico de dimensionado predictivo en ejecución. Ingrese los requerimientos métricos de los recintos para calcular automáticamente las superficies totales del programa de arquitectura.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>

        {/* COLUMNA 1: CATÁLOGO */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tool-panel">
            <div className="module-header" style={{ background: 'var(--muted)' }}>
              <span className="font-black tracking-tight" style={{ fontSize: '13px' }}>{Symbols.Diseno} | CATÁLOGO DE RECINTOS</span>
              <div className="relative" style={{ marginLeft: 'auto', paddingLeft: '10px' }}>
                <select value={dimCatSugeridoDestino} onChange={(e) => setDimCatSugeridoDestino(e.target.value)} className="tech-select" style={{ height: '26px', padding: '2px 24px 2px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                  {Object.keys(RECINTOS_POR_DEFECTO).map((catName) => <option key={catName} value={catName}>{catName.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="panel-content" style={{ padding: 0, maxHeight: '520px', overflowY: 'auto' }}>
              {RECINTOS_POR_DEFECTO[dimCatSugeridoDestino]?.map((rec) => {
                const qty = getCatalogQuantity(rec.id);
                const area = getCatalogArea(rec.id, rec.areaBase);
                return (
                  <div key={rec.id} style={{ padding: '12px 15px', borderBottom: '1.5px solid var(--border-color)', backgroundColor: 'var(--card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{rec.nombre}</span>
                      <span style={{ fontSize: '9px', opacity: 0.6, fontFamily: 'monospace' }}>SUP. {rec.areaBase} M²</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', height: '24px' }}>
                          <button type="button" onClick={() => setCatalogQuantity(rec.id, qty - 1)} style={{ width: '20px', background: 'var(--background)', border: 'none', borderRight: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>-</button>
                          <span style={{ width: '24px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>{qty}</span>
                          <button type="button" onClick={() => setCatalogQuantity(rec.id, qty + 1)} style={{ width: '20px', background: 'var(--background)', border: 'none', borderLeft: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+</button>
                        </div>
                        <input type="number" step="0.5" min="0.1" value={area} onChange={(e) => setCatalogArea(rec.id, Number(e.target.value))} style={{ width: '45px', height: '24px', border: '1px solid var(--border-color)', textAlign: 'right', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', padding: '0 4px', outline: 'none' }} />
                      </div>
                      <button type="button" onClick={() => handleAddFromCatalog(rec)} className="technical-btn secondary" style={{ fontSize: '9px', padding: '4px 8px', letterSpacing: '0.5px' }}>
                        [ ADICIONAR ]
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '15px', backgroundColor: 'var(--bg-grey)', borderTop: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>MÓDULO DE ESCAPE:</span>
              <button type="button" onClick={handleAddEscalera} className="technical-btn secondary" style={{ fontSize: '9px', padding: '6px 12px' }}>
                + ESCALERA (5.0 M²)
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: MANUAL */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleAddManual} className="tool-panel">
            <div className="module-header"><span className="font-black tracking-tight" style={{ fontSize: '13px' }}>{Symbols.Normativa} | AGREGAR RECINTO MANUAL</span></div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>NOMBRE DEL RECINTO</label>
                <input type="text" required value={manualNombre} onChange={(e) => setManualNombre(e.target.value)} placeholder="E.G. PASILLO TÉCNICO..." className="tech-input" style={{ textTransform: 'uppercase', fontWeight: 'bold' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label>CANTIDAD</label>
                  <input type="number" min="1" required value={manualCantidad} onChange={(e) => setManualCantidad(Math.max(1, Number(e.target.value)))} className="tech-input" style={{ textAlign: 'right', fontWeight: 'bold' }} />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label>M² ÚTIL</label>
                  <input type="number" step="0.1" min="0.1" required value={manualArea} onChange={(e) => setManualArea(Math.max(0.1, Number(e.target.value)))} className="tech-input" style={{ textAlign: 'right', fontWeight: 'bold' }} />
                </div>
              </div>
              <button type="submit" className="technical-btn" style={{ width: '100%', marginTop: '10px' }}>[ + REGISTRAR EN TABLA ]</button>
            </div>
          </form>
        </div>

        {/* COLUMNA 3: TABLA DE RESUMEN */}
        <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tool-panel" style={{ padding: 0 }}>
            <div className="module-header"><span className="font-black tracking-tight" style={{ fontSize: '13px' }}>{Symbols.Calc} | CÁLCULO ESTRUCTURAL DE SUPERFICIES</span></div>
            <div className="panel-content">
              {programa.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', border: '2px dashed rgba(46,46,46,0.2)', background: 'var(--background)', marginTop: '20px' }}><span style={{ fontSize: '30px', color: 'rgba(46,46,46,0.4)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>◈</span><p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(46,46,46,0.7)' }}>PROGRAMA ARQUITECTÓNICO VACÍO</p></div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: '40px', marginTop: '24px' }}>
                  <table className="tech-table">
                    <thead><tr><th>NOMBRE ESPACIO</th><th style={{ textAlign: 'center', width: '90px' }}>CANT</th><th style={{ textAlign: 'right', width: '90px' }}>M² UNIT</th><th style={{ textAlign: 'right', width: '100px', whiteSpace: 'nowrap' }}>TOTAL M²</th><th style={{ textAlign: 'center', width: '60px' }}></th></tr></thead>
                    <tbody>
                      {programa.map((item) => (
                        <tr key={item.id}>
                          <td><input type="text" value={item.nombre} onChange={(e) => handleUpdateProgramaItem(item.id, { nombre: e.target.value })} style={{ fontSize: '11px', backgroundColor: 'var(--background)', border: '2px solid var(--border)', padding: '4px 8px', fontWeight: 'bold', textTransform: 'uppercase', width: '100%', outline: 'none' }} /></td>
                          <td style={{ textAlign: 'center' }}><div className="counter-box" style={{ height: '24px', fontSize: '11px' }}><button type="button" onClick={() => handleUpdateProgramaItem(item.id, { cantidad: Math.max(1, item.cantidad - 1) })} className="counter-btn" style={{ width: '20px', fontSize: '11px' }}>-</button><span style={{ padding: '0 6px', minWidth: '14px', fontWeight: 'bold', textAlign: 'center', display: 'inline-block' }}>{item.cantidad}</span><button type="button" onClick={() => handleUpdateProgramaItem(item.id, { cantidad: item.cantidad + 1 })} className="counter-btn" style={{ width: '20px', fontSize: '11px' }}>+</button></div></td>
                          <td style={{ textAlign: 'center' }}><input type="number" step="0.5" min="0.1" value={item.areaAplicada} onChange={(e) => handleUpdateProgramaItem(item.id, { areaAplicada: Math.max(0.1, Number(e.target.value)) })} style={{ width: '70px', fontSize: '11px', backgroundColor: 'var(--background)', border: '2px solid var(--border)', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', outline: 'none' }} /></td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>{(item.areaAplicada * item.cantidad).toFixed(1)}</td>
                          <td style={{ textAlign: 'center' }}><button type="button" onClick={() => handleRemoveProgramaItem(item.id)} className="btn-tech-gray" style={{ padding: '2px 6px', fontSize: '10px' }}>[X]</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ borderTop: '2px solid rgba(46,46,46,0.1)', paddingTop: '16px', marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}><span style={{ color: 'rgba(46,46,46,0.7)' }}>Porcentaje de corrección por muros y circulaciones:</span><span style={{ background: 'rgba(46,46,46,0.05)', padding: '2px 8px', border: '1px solid rgba(46,46,46,0.3)' }}>{circulacion}%</span></div>
                <input type="range" min="5" max="45" value={circulacion} onChange={(e) => setCirculacion(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {(() => {
                const { subtotalM2, circulacionM2, totalM2 } = calcularSuperficies(programa, circulacion);
                return (
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed rgba(46,46,46,0.2)' }}>
                    <div style={{ background: 'rgba(232,230,225,0.4)', border: '2px solid var(--border)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(46,46,46,0.1)', textTransform: 'uppercase', color: 'rgba(46,46,46,0.8)' }}><span>Subtotal: </span><span>{subtotalM2.toFixed(1)} M²</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(46,46,46,0.1)', textTransform: 'uppercase', color: 'rgba(46,46,46,0.8)' }}><span>Muros (Factor {circulacion}%): </span><span>{circulacionM2.toFixed(1)} M²</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', gap: '10px' }}><span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Superficie construida total:</span><div style={{ backgroundColor: 'var(--card)', border: '3px solid var(--border)', padding: '6px 12px', minWidth: '100px', textAlign: 'center' }}><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#D32F2F' }}>{totalM2.toFixed(1)} <span style={{ fontSize: '12px' }}>M²</span></span></div></div>
                    </div>

                    <div style={{ paddingTop: '8px' }}>
                      <div className="tech-input-group" style={{ marginBottom: '10px', marginTop: '10px' }}>
                         <label>NOMBRE DE LA SIMULACIÓN</label>
                         <input type="text" className="tech-input" placeholder="Ej: Opción 1 - Básica" value={dimCalcName} onChange={e => setDimCalcName(e.target.value)} />
                      </div>
                      <button type="button" onClick={handleSaveDimensionador} disabled={isSaving} style={{ width: '100%', backgroundColor: editingDimId ? '#10B981' : '#2E2E2E', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px 24px', fontSize: '15px', border: `4.5px solid ${editingDimId ? '#10B981' : '#2E2E2E'}` }}>
                        {isSaving ? '⎔' : <Icons.Save size={18} />} <span>{editingDimId ? '[ ACTUALIZAR SIMULACIÓN ]' : '[ SALVAR FICHA Y ARCHIVAR SIMULACIÓN ]'}</span>
                      </button>
                      {editingDimId && (
                        <button onClick={handleCancelEdit} className="technical-btn secondary" style={{ width: '100%', marginTop: '8px' }}>[ CANCELAR EDICIÓN ]</button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {localToast && (
        <div style={{ position: 'fixed', bottom: '180px', right: '20px', zIndex: 9999, backgroundColor: '#2E2E2E', color: '#FFF', padding: '10px 18px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', border: '1.5px solid var(--border)' }}>◈ {localToast}</div>
      )}
    </motion.div>
  );
}
