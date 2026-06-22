/* CalculadoraHonorariosView — recuperado de remix dimensionador (CalculadoraHSAView).
   Standalone + boletas MOCK en estado local. */
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Save, Edit2, Trash2, FileText } from 'lucide-react';

const MOCK_BOLETAS = [
  { id: 'h1', toolId: 'calc-honorarios', resultTitle: 'Estado de Pago 1 — Anteproyecto', inputValue: '4.500.000', metrics: [ { name: 'Total Honorarios (Bruto)', value: '$4.500.000' }, { name: '15.25% Impto. Retenido', value: '$686.250' }, { name: 'Total (Líquido)', value: '$3.813.750' } ], notes: ['Modo de cálculo: Desde Bruto'] },
];

export default function CalculadoraHonorarios() {
  const [mode, setMode] = useState<'bruto_a_liquido' | 'liquido_a_bruto'>('bruto_a_liquido');
  const [amount, setAmount] = useState<string>('');
  const [retentionRate, setRetentionRate] = useState<string>('15.25');
  const [calcName, setCalcName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedHonorarios, setSavedHonorarios] = useState<any[]>(MOCK_BOLETAS);

  const results = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(/,/g, '')) || 0;
    const rate = parseFloat(retentionRate) || 0;
    let bruto = 0; let retencion = 0; let liquido = 0;
    if (mode === 'bruto_a_liquido') { bruto = numAmount; retencion = Math.round(bruto * (rate / 100)); liquido = bruto - retencion; }
    else { liquido = numAmount; bruto = Math.round(liquido / (1 - rate / 100)); retencion = bruto - liquido; }
    return { bruto, retencion, liquido };
  }, [amount, retentionRate, mode]);

  const formatCLP = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) return setAmount('');
    setAmount(new Intl.NumberFormat('es-CL').format(parseInt(rawValue, 10)));
  };

  const handleEdit = (calc: any) => {
    setAmount(calc.inputValue); setCalcName(calc.resultTitle);
    const modeNote = calc.notes?.find((n: string) => n.includes('Modo de cálculo'));
    if (modeNote && modeNote.includes('Líquido')) setMode('liquido_a_bruto'); else setMode('bruto_a_liquido');
    const rateMetric = calc.metrics?.find((m: any) => m.name.includes('% Impto.'));
    if (rateMetric) setRetentionRate(rateMetric.name.split('%')[0]);
    setEditingId(calc.id);
  };

  const handleSaveLocal = () => {
    if (!calcName.trim() || results.bruto === 0) return;
    const nuevo = {
      id: editingId || `h-${Date.now()}`, toolId: 'calc-honorarios', resultTitle: calcName, inputValue: amount,
      metrics: [
        { name: 'Total Honorarios (Bruto)', value: formatCLP(results.bruto) },
        { name: `${retentionRate}% Impto. Retenido`, value: formatCLP(results.retencion) },
        { name: 'Total (Líquido)', value: formatCLP(results.liquido) },
      ],
      notes: [`Modo de cálculo: ${mode === 'bruto_a_liquido' ? 'Desde Bruto' : 'Desde Líquido'}`],
    };
    setSavedHonorarios(prev => editingId ? prev.map(c => c.id === editingId ? nuevo : c) : [nuevo, ...prev]);
    setEditingId(null); setCalcName('');
  };

  const onDelete = (id: string) => setSavedHonorarios(prev => prev.filter(c => c.id !== id));

  return (
    <div style={{ marginTop: '0' }}>
      <div className="free-text-section" style={{ marginBottom: '24px' }}>
        <h1 className="page-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={24} strokeWidth={1.2} />
          CALCULADORA DE HONORARIOS <span className="tech-pulse" style={{ color: 'var(--accent-red)' }}>_</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tool-panel" style={{ height: '100%' }}>
            <div className="module-header">| PARÁMETROS DE CÁLCULO</div>
            <div className="panel-content">
              <div className="tech-input-group">
                <label>TIPO DE CÁLCULO</label>
                <select className="tech-select" value={mode} onChange={(e) => { setMode(e.target.value as any); setAmount(''); }}>
                  <option value="bruto_a_liquido">Calcular Líquido (Ingresar Bruto)</option>
                  <option value="liquido_a_bruto">Calcular Bruto (Ingresar Líquido)</option>
                </select>
              </div>
              <div className="tech-input-group">
                <label>TASA DE RETENCIÓN SII (%)</label>
                <input type="number" className="tech-input" style={{ textAlign: 'right' }} step="0.01" value={retentionRate} onChange={(e) => setRetentionRate(e.target.value)} />
              </div>
              <div className="tech-input-group">
                <label>MONTO {mode === 'bruto_a_liquido' ? 'BRUTO' : 'LÍQUIDO'} ($)</label>
                <input type="text" className="tech-input" style={{ textAlign: 'right', fontWeight: 'bold' }} value={amount} onChange={handleAmountChange} placeholder="Ingrese el monto..." />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="tool-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="module-header">| DESGLOSE DE BOLETA</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', fontWeight: 'bold', backgroundColor: 'var(--bg-grey)', width: '60%' }}>TOTAL HONORARIOS (BRUTO):</td>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px' }}>{formatCLP(results.bruto)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', fontWeight: 'bold', backgroundColor: 'var(--bg-grey)' }}>{retentionRate}% IMPTO. RETENIDO:</td>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', color: 'var(--accent-red)' }}>{formatCLP(results.retencion)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', fontWeight: 'bold', backgroundColor: 'var(--bg-grey)' }}>TOTAL (LÍQUIDO A PAGAR):</td>
                    <td style={{ border: '1.5px solid var(--border-color)', padding: '10px 15px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', fontWeight: 'bold' }}>{formatCLP(results.liquido)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ flexGrow: 1 }}></div>
              <div className="tech-input-group" style={{ marginTop: 'auto' }}>
                <label>IDENTIFICADOR DEL CÁLCULO</label>
                <input type="text" className="tech-input" value={calcName} onChange={(e) => setCalcName(e.target.value)} placeholder="Ej: Estado de pago 1..." />
              </div>
              <button className="technical-btn" onClick={handleSaveLocal} disabled={!calcName.trim() || results.bruto === 0} style={{ width: '100%', marginTop: '10px', backgroundColor: editingId ? '#10B981' : undefined, borderColor: editingId ? '#10B981' : undefined }}>
                <Save size={18} strokeWidth={1.2} />
                {editingId ? '[ ACTUALIZAR BOLETA ]' : '[ GUARDAR AL EXPEDIENTE ]'}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setCalcName(''); setAmount(''); }} className="technical-btn secondary" style={{ width: '100%', marginTop: '8px' }}>[ CANCELAR EDICIÓN ]</button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="tool-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="module-header">| BOLETAS GUARDADAS ({savedHonorarios.length})</div>
            <div className="panel-content" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', padding: '15px' }}>
              {savedHonorarios.length === 0 ? (
                <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px', fontWeight: 'bold', fontSize: '11px' }}>SIN BOLETAS REGISTRADAS</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedHonorarios.map(calc => (
                    <div key={calc.id} style={{ border: '1.5px solid var(--border-color)', padding: '12px', backgroundColor: editingId === calc.id ? 'var(--bg-grey)' : 'var(--card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}><FileText size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> {calc.resultTitle}</h4>
                      </div>
                      <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: '10px', color: 'var(--accent-red)' }}>BRUTO: {calc.metrics[0]?.value}</p>
                      <p style={{ margin: '4px 0', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>LÍQUIDO: {calc.metrics[2]?.value}</p>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                        <button onClick={() => handleEdit(calc)} className="technical-btn secondary" style={{ flex: 1, padding: '4px', fontSize: '9px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                          <Edit2 size={12} strokeWidth={1.5} /> [ EDITAR ]
                        </button>
                        <button onClick={() => onDelete(calc.id)} className="technical-btn secondary" style={{ padding: '4px 8px', fontSize: '9px', color: 'var(--accent-red)' }} title="Eliminar">
                          <Trash2 size={12} strokeWidth={1.5} />
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
    </div>
  );
}
