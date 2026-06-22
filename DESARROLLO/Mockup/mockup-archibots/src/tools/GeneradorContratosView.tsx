/* GeneradorContratosView — recuperado de remix dimensionador (GeneradorContratosView).
   Standalone + autocompletado con datos MOCK + historial en estado local. */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface ContractFormData {
  fechaContrato: string; nombreMandante: string; rutMandante: string; direccionMandante: string;
  nombreOficina: string; nombreArquitecto: string; rutArquitecto: string; direccionArquitecto: string;
  nombreProyecto: string; direccionProyecto: string; precioServicios: string; impuesto: string;
  pago1: string; pago2: string; pago3: string; pago4: string; pago5: string;
}

export default function GeneradorContratos() {
  const [formData, setFormData] = useState<ContractFormData>({
    fechaContrato: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    nombreMandante: 'Inmobiliaria Lientur SpA',
    rutMandante: '76.543.210-K',
    direccionMandante: 'Av. Apoquindo 4501, Las Condes',
    nombreOficina: 'Estudio de Arquitectura',
    nombreArquitecto: 'Goyo Gramador',
    rutArquitecto: '12.345.678-9',
    direccionArquitecto: 'Av. Providencia 1234, Of. 56',
    nombreProyecto: 'Edificio Los Alerces',
    direccionProyecto: 'Lientur 7345, comuna de La Florida',
    precioServicios: '45.000 UF',
    impuesto: '15.25',
    pago1: '20%', pago2: '20%', pago3: '20%', pago4: '20%', pago5: '20%',
  });

  const [contractName, setContractName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedContracts, setSavedContracts] = useState<any[]>([
    { id: 'c1', toolId: 'calc-contratos', resultTitle: 'Contrato V1 — Definitivo', metrics: [{ value: 'Inmobiliaria Lientur SpA' }, { value: '45.000 UF' }], notes: [] },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleImprimir = () => window.print();

  const handleEdit = (calc: any) => {
    setContractName(calc.resultTitle); setEditingId(calc.id);
    const dataNote = calc.notes?.find((n: string) => n.startsWith('__DATA:'));
    if (dataNote) { try { setFormData(JSON.parse(dataNote.replace('__DATA:', ''))); } catch (e) {} }
  };

  const handleSaveLocal = () => {
    if (!contractName.trim()) return;
    const nuevo = {
      id: editingId || `c-${Date.now()}`, toolId: 'calc-contratos', resultTitle: contractName,
      metrics: [{ value: formData.nombreMandante || 'No definido' }, { value: formData.precioServicios || '0' }],
      notes: [`__DATA:${JSON.stringify(formData)}`],
    };
    setSavedContracts(prev => editingId ? prev.map(c => c.id === editingId ? nuevo : c) : [nuevo, ...prev]);
    setEditingId(null); setContractName('');
  };

  const handleCancelEdit = () => { setEditingId(null); setContractName(''); setFormData(prev => ({ ...prev, impuesto: '15.25' })); };
  const onDelete = (id: string) => setSavedContracts(prev => prev.filter(c => c.id !== id));

  const compactInput: React.CSSProperties = { padding: '4px 8px', fontSize: '11px', height: '28px' };
  const compactLabel: React.CSSProperties = { fontSize: '9px', marginBottom: '2px', opacity: 0.8 };

  return (
    <div style={{ marginTop: '0' }}>
      <style>{`
        .document-wrapper { background:#fff; color:#000; padding:4rem 3rem; font-family:'Times New Roman',Times,serif; font-size:11pt; line-height:1.6; min-height:297mm; border:1.5px solid var(--border-color); }
        .document-title { text-align:center; font-weight:bold; text-decoration:underline; margin-bottom:2.5rem; font-size:13pt; }
        .document-clause { margin-top:1.5rem; text-align:justify; }
        .document-clause strong { text-transform:uppercase; }
        .document-signatures { display:grid; grid-template-columns:1fr 1fr; margin-top:6rem; text-align:center; gap:2rem; }
        .signature-line { border-top:1px solid #000; width:80%; margin:0 auto 0.5rem auto; }
        .var-highlight { background-color:rgba(211,47,47,0.08); border-bottom:1.5px dashed var(--accent-red); padding:0 4px; font-family:'Courier New',Courier,monospace; font-size:10pt; font-weight:bold; color:var(--accent-red); }
        @media print { body * { visibility:hidden; } .document-wrapper, .document-wrapper * { visibility:visible; } .document-wrapper { position:absolute; left:0; top:0; padding:0; border:none; min-height:auto; width:100%; } }
      `}</style>

      <div className="free-text-section" style={{ marginBottom: '20px' }}>
        <h1 className="page-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Handshake size={24} strokeWidth={1.2} />
          GENERADOR DE CONTRATO TIPO <span className="tech-pulse" style={{ color: 'var(--accent-red)' }}>_</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '82vh', overflowY: 'auto', paddingRight: '8px' }}>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="tool-panel">
              <div className="module-header" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>| 01. DATOS DEL MANDANTE</div>
              <div className="panel-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>FECHA DEL CONTRATO</label>
                  <input type="text" className="tech-input" name="fechaContrato" value={formData.fechaContrato} onChange={handleInputChange} style={compactInput} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>MANDANTE / PROPIETARIO</label>
                    <input type="text" className="tech-input" name="nombreMandante" value={formData.nombreMandante} onChange={handleInputChange} style={compactInput} />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>RUT MANDANTE</label>
                    <input type="text" className="tech-input" name="rutMandante" value={formData.rutMandante} onChange={handleInputChange} style={{ ...compactInput, textAlign: 'right', fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>DIRECCIÓN COMPLETA MANDANTE</label>
                  <input type="text" className="tech-input" name="direccionMandante" value={formData.direccionMandante} onChange={handleInputChange} style={compactInput} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
            <div className="tool-panel">
              <div className="module-header" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>| 02. DATOS DEL ARQUITECTO</div>
              <div className="panel-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>NOMBRE ARQUITECTO</label>
                    <input type="text" className="tech-input" name="nombreArquitecto" value={formData.nombreArquitecto} onChange={handleInputChange} style={compactInput} />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>RUT ARQUITECTO</label>
                    <input type="text" className="tech-input" name="rutArquitecto" value={formData.rutArquitecto} onChange={handleInputChange} style={{ ...compactInput, textAlign: 'right', fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>OFICINA DE ARQUITECTURA</label>
                  <input type="text" className="tech-input" name="nombreOficina" value={formData.nombreOficina} onChange={handleInputChange} style={compactInput} />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>DIRECCIÓN ARQUITECTO</label>
                  <input type="text" className="tech-input" name="direccionArquitecto" value={formData.direccionArquitecto} onChange={handleInputChange} style={compactInput} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="tool-panel">
              <div className="module-header" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>| 03. PROYECTO Y HONORARIOS</div>
              <div className="panel-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>NOMBRE DEL PROYECTO</label>
                  <input type="text" className="tech-input" name="nombreProyecto" value={formData.nombreProyecto} onChange={handleInputChange} style={compactInput} />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={compactLabel}>DIRECCIÓN DEL PROYECTO</label>
                  <input type="text" className="tech-input" name="direccionProyecto" value={formData.direccionProyecto} onChange={handleInputChange} style={compactInput} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>HONORARIOS TOTALES (UF/CLP)</label>
                    <input type="text" className="tech-input" name="precioServicios" value={formData.precioServicios} onChange={handleInputChange} style={{ ...compactInput, textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-red)' }} />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={compactLabel}>% RETENCIÓN</label>
                    <input type="text" className="tech-input" name="impuesto" value={formData.impuesto} onChange={handleInputChange} style={{ ...compactInput, textAlign: 'right', fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginTop: '4px' }}>
                  {['pago1', 'pago2', 'pago3', 'pago4', 'pago5'].map((pago, idx) => (
                    <div className="tech-input-group" style={{ marginBottom: 0 }} key={pago}>
                      <label style={{ ...compactLabel, fontSize: '8px' }}>PAGO {idx + 1}</label>
                      <input type="text" className="tech-input" name={pago} value={(formData as any)[pago]} onChange={handleInputChange} style={{ ...compactInput, textAlign: 'right', fontSize: '10px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="tool-panel">
              <div className="module-header" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>| GUARDAR Y REGISTRAR</div>
              <div className="panel-content" style={{ padding: '12px' }}>
                <div className="tech-input-group" style={{ marginBottom: '8px' }}>
                  <label style={compactLabel}>IDENTIFICADOR DEL CONTRATO</label>
                  <input type="text" className="tech-input" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="Ej: Contrato V1 - Definitivo" style={compactInput} />
                </div>
                <button className="technical-btn" onClick={handleSaveLocal} disabled={!contractName.trim()} style={{ width: '100%', padding: '6px', fontSize: '10px', backgroundColor: editingId ? '#10B981' : undefined, borderColor: editingId ? '#10B981' : undefined }}>
                  <Icons.Save size={14} strokeWidth={1.5} style={{ marginRight: '6px' }} />
                  {editingId ? '[ ACTUALIZAR CONTRATO ]' : '[ GUARDAR EN EXPEDIENTE ]'}
                </button>
                {editingId && (
                  <button onClick={handleCancelEdit} className="technical-btn secondary" style={{ width: '100%', marginTop: '6px', padding: '6px', fontSize: '10px' }}>[ CANCELAR EDICIÓN ]</button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="tool-panel">
              <div className="module-header" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}>| HISTORIAL DE CONTRATOS ({savedContracts.length})</div>
              <div className="panel-content" style={{ padding: '12px' }}>
                {savedContracts.length === 0 ? (
                  <div style={{ opacity: 0.5, textAlign: 'center', margin: '10px 0', fontWeight: 'bold', fontSize: '10px' }}>SIN CONTRATOS GUARDADOS</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedContracts.map(calc => (
                      <div key={calc.id} style={{ border: '1.5px solid var(--border-color)', padding: '10px', backgroundColor: editingId === calc.id ? 'var(--bg-grey)' : 'var(--card)' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}><Icons.FileText size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> {calc.resultTitle}</h4>
                        <p style={{ margin: '2px 0', fontFamily: 'monospace', fontSize: '9px' }}><strong>A:</strong> {calc.metrics[0]?.value}</p>
                        <p style={{ margin: '2px 0', fontFamily: 'monospace', fontSize: '9px' }}><strong>POR:</strong> {calc.metrics[1]?.value}</p>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                          <button onClick={() => handleEdit(calc)} className="technical-btn secondary" style={{ flex: 1, padding: '2px', fontSize: '9px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                            <Icons.Edit2 size={10} strokeWidth={1.5} /> [ EDITAR ]
                          </button>
                          <button onClick={() => onDelete(calc.id)} className="technical-btn secondary" style={{ padding: '2px 6px', fontSize: '9px', color: 'var(--accent-red)' }} title="Eliminar">
                            <Icons.Trash2 size={10} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <div className="tool-panel" style={{ height: '82vh', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
          <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px' }}>
            <span>| VISTA PREVIA DEL DOCUMENTO LEGAL</span>
            <button className="technical-btn" onClick={handleImprimir} style={{ padding: '2px 10px', fontSize: '10px' }}>
              <Icons.Printer size={12} strokeWidth={1.5} style={{ marginRight: '6px' }} /> [ IMPRIMIR PDF ]
            </button>
          </div>
          <div className="panel-content" style={{ backgroundColor: 'var(--background)', padding: '2rem', flexGrow: 1, overflowY: 'auto' }}>
            <div className="document-wrapper">
              <div className="document-title">CONTRATO DE PROYECTO DE ARQUITECTURA</div>
              <div className="document-clause">
                En Santiago a <span className="var-highlight">{formData.fechaContrato || '..................'}</span>, entre <span className="var-highlight">{formData.nombreMandante || '..........................'}</span>, RUT <span className="var-highlight">{formData.rutMandante || '..................'}</span>, domiciliado en <span className="var-highlight">{formData.direccionMandante || '...................................................'}</span>, en adelante EL MANDANTE y <span className="var-highlight">{formData.nombreArquitecto || '..............................'}</span> en representación de <span className="var-highlight">{formData.nombreOficina || '..............................'}</span>, domiciliado en <span className="var-highlight">{formData.direccionArquitecto || '...................................................'}</span>, en adelante la OFICINA DE ARQUITECTOS se ha convenido el siguiente Contrato de Prestación de Servicios Profesionales.
              </div>
              <div className="document-clause"><strong>PRIMERO:</strong><br />El mandante es arrendatario/propietario de la propiedad ubicada en <span className="var-highlight">{formData.direccionProyecto || '...................................................'}</span>.</div>
              <div className="document-clause"><strong>SEGUNDO:</strong><br />El mandante encarga en el presente contrato a <span className="var-highlight">{formData.nombreOficina || '..............................'}</span>, OFICINA DE ARQUITECTOS, el proyecto <span className="var-highlight">{formData.nombreProyecto || '..............................'}</span>.</div>
              <div className="document-clause"><strong>TERCERO:</strong><br />Por el presente contrato LA OFICINA DE ARQUITECTOS, se obliga a lo siguiente:<br />1.- Ejecutar el proyecto de arquitectura.<br />2.- Coordinar las especialidades.<br />3.- Supervisar las obras de remodelación.<br />4.- Tramitar el Permiso de Edificación ante la municipalidad respectiva.</div>
              <div className="document-clause"><strong>CUARTO:</strong><br />Por la ejecución del proyecto, se ha convenido un valor total estimado de: <span className="var-highlight">{formData.precioServicios || '..................'}</span>, más impuesto de servicios profesionales del <span className="var-highlight">{formData.impuesto || '....'}</span>%, que debe ser aprobado por las partes en el acto de firma del contrato.<br /><br />Este valor comprende los siguientes ítems:<br />HONORARIOS: Diseño de Arquitectura, Permiso Municipal y supervisión de obra.</div>
              <div className="document-clause"><strong>QUINTO:</strong><br />La forma de pago será la siguiente:<br /><br />20% del total, PRIMER ESTADO DE PAGO (INICIO): <span className="var-highlight">{formData.pago1}</span> más impuesto.<br />20% del total, SEGUNDO ESTADO DE PAGO (INGRESO MUNICIPAL): <span className="var-highlight">{formData.pago2}</span> más impuesto.<br />20% del total, TERCER ESTADO DE PAGO (PERMISO MUNICIPAL): <span className="var-highlight">{formData.pago3}</span> más impuesto.<br />20% del total, CUARTO ESTADO DE PAGO (TERMINO DE OBRA): <span className="var-highlight">{formData.pago4}</span> más impuesto.<br />20% del total, QUINTO ESTADO DE PAGO (RECEPCION FINAL): <span className="var-highlight">{formData.pago5}</span> más impuesto.<br /><br />Cualquier aumento de encargos significará un acuerdo previo de los costos correspondientes de honorarios adicionales.</div>
              <div className="document-clause"><strong>SÉPTIMO:</strong><br />Cualquier dificultad que se suscite entre las partes en relación a este contrato o con motivo de su interpretación, aplicación, cumplimiento, terminación o por cualquier otra causa, será resuelta en única instancia y sin forma de juicio, en calidad de árbitro arbitrador o amigable componedor, por el comité de ética del COLEGIO DE ARQUITECTOS de CHILE, quién acepta dicho compromiso.</div>
              <div className="document-signatures">
                <div><div className="signature-line"></div><strong>PROPIETARIO / MANDANTE</strong><br /><span className="var-highlight">{formData.nombreMandante || '..........................'}</span><br />RUT: <span className="var-highlight">{formData.rutMandante || '..................'}</span></div>
                <div><div className="signature-line"></div><strong>ARQUITECTO</strong><br /><span className="var-highlight">{formData.nombreArquitecto || '..........................'}</span><br />RUT: <span className="var-highlight">{formData.rutArquitecto || '..................'}</span></div>
              </div>
              <div className="document-clause" style={{ marginTop: '4rem', textAlign: 'left' }}>Santiago, <span className="var-highlight">{formData.fechaContrato || '..................'}</span>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
