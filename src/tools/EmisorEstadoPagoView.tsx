/* =============================================================================
   EmisorEstadoPagoView.tsx — EMISOR DE ESTADO DE PAGO (T-44)
   -----------------------------------------------------------------------------
   Emite un estado de pago a partir de una glosa, un valor neto (CLP o UF, con
   conversión automática), una tasa de impuesto editable y el cálculo de neto,
   impuesto y total. Conecta con el ProjectMaster activo (useProjects().getProject)
   para el encabezado y persiste el último estado en localStorage bajo
   ab-estados-pago-${projectId} (no toca el master).
   ============================================================================= */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, DollarSign, Percent } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── estilos de la lámina de SOLO LECTURA (neutros, papel blanco) ─────────────── */
const pvWrap: React.CSSProperties = { fontSize: 12, color: '#1a1a1a' };
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const pvTd: React.CSSProperties = { padding: '7px 8px', borderBottom: '1px solid #d8d8d8' };
const pvTdR: React.CSSProperties = { ...pvTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

/* ── tipos locales ─────────────────────────────────────────────────────────── */
type Moneda = 'CLP' | 'UF';
interface EstadoPagoGuardado { glosa: string; valor: string; impuesto: string; moneda: Moneda; }

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-estados-pago-${pid}`;
const UF_REFERENCIAL = 37500; // valor referencial; reemplazar por indicador real a futuro

/* ── helpers puros ─────────────────────────────────────────────────────────── */
function num(v: string): number {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}
function formatPesos(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(monto).replace('CLP', '$').trim();
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function EmisorEstadoPagoView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [saving, setSaving] = useState(false);
  const [glosa, setGlosa] = useState('Honorarios de Arquitectura - Fase 1');
  const [valor, setValor] = useState('1000000');
  const [impuesto, setImpuesto] = useState('15.25');
  const [moneda, setMoneda] = useState<Moneda>('CLP');

  /* ── carga inicial desde localStorage ── */
  useEffect(() => {
    if (!project) return;
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        const s = JSON.parse(raw) as Partial<EstadoPagoGuardado>;
        if (typeof s.glosa === 'string') setGlosa(s.glosa);
        if (typeof s.valor === 'string') setValor(s.valor);
        if (typeof s.impuesto === 'string') setImpuesto(s.impuesto);
        if (s.moneda === 'CLP' || s.moneda === 'UF') setMoneda(s.moneda);
      } catch { /* datos corruptos — ignorar */ }
    }
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) return (
    <div className="ab-tool-root">
      <p className="tech-quote">Selecciona un proyecto para emitir un estado de pago.</p>
    </div>
  );

  /* ── cambio de moneda con conversión automática ── */
  const handleCurrencyChange = (nueva: Moneda) => {
    if (nueva === moneda || readOnly) return;
    const actual = num(valor);
    if (nueva === 'UF') {
      setValor(actual > 0 ? (actual / UF_REFERENCIAL).toFixed(2) : '0');
    } else {
      setValor(actual > 0 ? String(Math.round(actual * UF_REFERENCIAL)) : '0');
    }
    setMoneda(nueva);
  };

  /* ── cálculos derivados ── */
  const numValor = num(valor);
  const netoPesos = moneda === 'UF' ? Math.round(numValor * UF_REFERENCIAL) : numValor;
  const numImpuesto = num(impuesto);
  const montoImpuesto = Math.round(netoPesos * (numImpuesto / 100));
  const total = netoPesos + montoImpuesto;

  /* ── guardado ── */
  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload: EstadoPagoGuardado = { glosa, valor, impuesto, moneda };
      localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(payload));
      triggerToast('Estado de pago guardado.');
    } catch {
      triggerToast('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <h1 style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
          <DollarSign size={22} strokeWidth={1.4} /> Emisor de Estado de Pago
        </h1>
        <button type="button" onClick={handleSave} disabled={saving || readOnly} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? '⎔' : <Save size={14} />} [ GUARDAR ]
        </button>
      </div>
      <p className="tech-quote" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={14} /> Proyecto: <strong>{project.name}</strong> · {String(project.etapa)}
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div className="tool-panel">
        <div className="module-header">| DATOS DEL ESTADO DE PAGO</div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tech-input-group" style={{ marginBottom: 0 }}>
            <label>Glosa o Descripción</label>
            <input type="text" className="tech-input" value={glosa} disabled={readOnly} onChange={(e) => setGlosa(e.target.value)} placeholder="Ej: Avance de obra fase 2" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>Valor Neto</label>
              <div style={{ display: 'flex' }}>
                <input type="number" min="0" step={moneda === 'UF' ? '0.01' : '1'} className="tech-input" value={valor} disabled={readOnly}
                  onChange={(e) => setValor(e.target.value)} placeholder={moneda === 'UF' ? '0.00' : '1000000'}
                  style={{ borderRight: 'none', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} />
                <select className="tech-select" value={moneda} disabled={readOnly} onChange={(e) => handleCurrencyChange(e.target.value === 'UF' ? 'UF' : 'CLP')} style={{ width: 92 }}>
                  <option value="CLP">CLP ($)</option>
                  <option value="UF">UF</option>
                </select>
              </div>
              {moneda === 'UF' && (
                <span style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>1 UF = {formatPesos(UF_REFERENCIAL)} (referencial)</span>
              )}
            </div>

            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Percent size={11} /> Tasa de Impuesto (%)</label>
              <input type="number" min="0" step="0.01" className="tech-input" value={impuesto} disabled={readOnly} onChange={(e) => setImpuesto(e.target.value)} placeholder="15.25"
                style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} />
            </div>
          </div>

          {/* RESUMEN */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '2px dashed var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ opacity: 0.75 }}>Valor Neto{moneda === 'UF' ? ` (${numValor} UF)` : ''}:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatPesos(netoPesos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ opacity: 0.75 }}>Impuestos ({numImpuesto}%):</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatPesos(montoImpuesto)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '2px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>Total a Pagar:</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--destructive)' }}>{formatPesos(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><DollarSign size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Estado de Pago" documentId="T-44" projectId={projectId}>
          <div style={pvWrap}>
            <h3 style={pvH3}>Estado de Pago</h3>
            <p style={{ margin: '0 0 12px' }}><strong>Glosa:</strong> {glosa || '—'}</p>
            <table style={pvTable}><tbody>
              <tr><td style={pvTd}>Valor Neto{moneda === 'UF' ? ` (${numValor} UF)` : ''}</td><td style={pvTdR}>{formatPesos(netoPesos)}</td></tr>
              <tr><td style={pvTd}>Impuestos ({numImpuesto}%)</td><td style={pvTdR}>{formatPesos(montoImpuesto)}</td></tr>
              <tr><td style={{ ...pvTd, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>TOTAL A PAGAR</td><td style={{ ...pvTdR, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>{formatPesos(total)}</td></tr>
            </tbody></table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
