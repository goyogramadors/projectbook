/* =============================================================================
   CalculadoraHonorariosView.tsx — CALCULADORA DE HONORARIOS (T-06 / id: hsa)
   -----------------------------------------------------------------------------
   Contrato visual 1:1 con el Mockup (CalculadoraHonorariosView).
   Conecta con el ProjectMaster activo para sembrar el presupuestoUF como monto
   inicial. Lógica bruto↔líquido, retención editable (default 15,25%).
   Historial de boletas en estado local (futura subcolección Firestore en F4).
   ============================================================================= */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Edit2, FileText, Save, Trash2 } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface BoleSaved {
  id: string;
  resultTitle: string;
  inputValue: string;
  bruto: number;
  retencion: number;
  liquido: number;
  rate: string;
  mode: CalcMode;
}

type CalcMode = 'bruto_a_liquido' | 'liquido_a_bruto';

/* ── helpers ───────────────────────────────────────────────────────────────── */
const fmt = (v: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(v);

function parseCLP(str: string): number {
  return parseFloat(str.replace(/[^0-9]/g, '')) || 0;
}

function formatCLP(raw: string): string {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? '' : new Intl.NumberFormat('es-CL').format(n);
}

/* ── seed desde presupuestoUF del ProjectMaster ────────────────────────────── */
function ufToCLP(ufStr: string): string {
  /* Extrae el número de UF y lo convierte a CLP usando factor fijo de fallback.
     La T-05 (PropuestaView) ya resuelve el valor real de la UF vía mindicador.cl.
     Aquí usamos el mismo fallback ~37.000 CLP/UF para sembrar el monto inicial.
     El usuario puede sobreescribirlo libremente. */
  const uf = parseFloat(ufStr?.replace(/[^0-9.]/g, '') || '0');
  if (!uf) return '';
  const clp = Math.round(uf * 37_000);
  return new Intl.NumberFormat('es-CL').format(clp);
}

/* ── estado MOCK inicial (mismo contrato que el Mockup) ────────────────────── */
const MOCK_BOLETAS: BoleSaved[] = [
  {
    id: 'h1',
    resultTitle: 'Estado de Pago 1 — Anteproyecto',
    inputValue: '4.500.000',
    bruto: 4_500_000,
    retencion: 686_250,
    liquido: 3_813_750,
    rate: '15.25',
    mode: 'bruto_a_liquido',
  },
];

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════════ */
export default function CalculadoraHonorariosView({ projectId }: ToolProps) {
  const { getProject } = useProjects();
  const project = getProject(projectId);

  /* ── estado ── */
  const [mode, setMode] = useState<CalcMode>('bruto_a_liquido');
  const [amount, setAmount] = useState<string>('');
  const [retentionRate, setRetentionRate] = useState<string>('15.25');
  const [calcName, setCalcName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<BoleSaved[]>(MOCK_BOLETAS);

  /* ── siembra presupuestoUF del proyecto activo ── */
  useEffect(() => {
    if (project?.presupuestoUF) {
      const seeded = ufToCLP(project.presupuestoUF);
      if (seeded) setAmount(seeded);
    }
  }, [project?.presupuestoUF]);

  /* ── cálculo reactivo ── */
  const results = useMemo(() => {
    const n = parseCLP(amount);
    const rate = parseFloat(retentionRate) || 0;
    let bruto = 0, retencion = 0, liquido = 0;
    if (mode === 'bruto_a_liquido') {
      bruto = n;
      retencion = Math.round(bruto * (rate / 100));
      liquido = bruto - retencion;
    } else {
      liquido = n;
      bruto = Math.round(liquido / (1 - rate / 100));
      retencion = bruto - liquido;
    }
    return { bruto, retencion, liquido };
  }, [amount, retentionRate, mode]);

  /* ── handlers ── */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmount(raw ? formatCLP(raw) : '');
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value as CalcMode);
    setAmount('');
  };

  const handleSave = () => {
    if (!calcName.trim() || results.bruto === 0) return;
    const entry: BoleSaved = {
      id: editingId ?? `h-${Date.now()}`,
      resultTitle: calcName,
      inputValue: amount,
      bruto: results.bruto,
      retencion: results.retencion,
      liquido: results.liquido,
      rate: retentionRate,
      mode,
    };
    setSaved((prev) =>
      editingId ? prev.map((b) => (b.id === editingId ? entry : b)) : [entry, ...prev],
    );
    setEditingId(null);
    setCalcName('');
  };

  const handleEdit = (b: BoleSaved) => {
    setAmount(b.inputValue);
    setCalcName(b.resultTitle);
    setMode(b.mode);
    setRetentionRate(b.rate);
    setEditingId(b.id);
  };

  const handleDelete = (id: string) =>
    setSaved((prev) => prev.filter((b) => b.id !== id));

  const handleCancel = () => {
    setEditingId(null);
    setCalcName('');
    setAmount('');
  };

  /* ── render ── */
  return (
    <div style={{ marginTop: 0 }}>
      {/* ENCABEZADO */}
      <div className="free-text-section" style={{ marginBottom: '24px' }}>
        <h1
          className="page-main-title"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Calculator size={24} strokeWidth={1.2} />
          CALCULADORA DE HONORARIOS{' '}
          <span className="tech-pulse" style={{ color: 'var(--accent-red)' }}>
            _
          </span>
        </h1>
        {project && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '11px',
              opacity: 0.6,
              fontFamily: 'monospace',
            }}
          >
            PROYECTO: {project.name.toUpperCase()} · PRESUPUESTO:{' '}
            {project.presupuestoUF || '—'} UF
          </p>
        )}
      </div>

      <div className="ab-split">
      <div
        className="ab-split-left"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {/* PANEL 1 — PARÁMETROS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tool-panel" style={{ height: '100%' }}>
            <div className="module-header">| PARÁMETROS DE CÁLCULO</div>
            <div className="panel-content">
              <div className="tech-input-group">
                <label>TIPO DE CÁLCULO</label>
                <select className="tech-select" value={mode} onChange={handleModeChange}>
                  <option value="bruto_a_liquido">
                    Calcular Líquido (Ingresar Bruto)
                  </option>
                  <option value="liquido_a_bruto">
                    Calcular Bruto (Ingresar Líquido)
                  </option>
                </select>
              </div>
              <div className="tech-input-group">
                <label>TASA DE RETENCIÓN SII (%)</label>
                <input
                  type="number"
                  className="tech-input"
                  style={{ textAlign: 'right' }}
                  step="0.01"
                  value={retentionRate}
                  onChange={(e) => setRetentionRate(e.target.value)}
                />
              </div>
              <div className="tech-input-group">
                <label>
                  MONTO {mode === 'bruto_a_liquido' ? 'BRUTO' : 'LÍQUIDO'} ($)
                </label>
                <input
                  type="text"
                  className="tech-input"
                  style={{ textAlign: 'right', fontWeight: 'bold' }}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Ingrese el monto…"
                />
              </div>
              {project?.presupuestoUF && (
                <p
                  style={{
                    fontSize: '9px',
                    opacity: 0.55,
                    marginTop: '8px',
                    fontFamily: 'monospace',
                  }}
                >
                  ↑ Pre-sembrado desde presupuesto del proyecto (
                  {project.presupuestoUF} UF · factor ~$37.000/UF). Editable.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* PANEL 2 — DESGLOSE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="tool-panel"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div className="module-header">| DESGLOSE DE BOLETA</div>
            <div
              className="panel-content"
              style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '24px',
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--bg-grey)',
                        width: '60%',
                      }}
                    >
                      TOTAL HONORARIOS (BRUTO):
                    </td>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '15px',
                      }}
                    >
                      {fmt(results.bruto)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--bg-grey)',
                      }}
                    >
                      {retentionRate}% IMPTO. RETENIDO:
                    </td>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '15px',
                        color: 'var(--accent-red)',
                      }}
                    >
                      {fmt(results.retencion)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--bg-grey)',
                      }}
                    >
                      TOTAL (LÍQUIDO A PAGAR):
                    </td>
                    <td
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '10px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >
                      {fmt(results.liquido)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ flexGrow: 1 }} />

              <div className="tech-input-group" style={{ marginTop: 'auto' }}>
                <label>IDENTIFICADOR DEL CÁLCULO</label>
                <input
                  type="text"
                  className="tech-input"
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  placeholder="Ej: Estado de pago 1…"
                />
              </div>
              <button
                className="technical-btn"
                onClick={handleSave}
                disabled={!calcName.trim() || results.bruto === 0}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  backgroundColor: editingId ? '#10B981' : undefined,
                  borderColor: editingId ? '#10B981' : undefined,
                }}
              >
                <Save size={18} strokeWidth={1.2} />
                {editingId ? '[ ACTUALIZAR BOLETA ]' : '[ GUARDAR AL EXPEDIENTE ]'}
              </button>
              {editingId && (
                <button
                  onClick={handleCancel}
                  className="technical-btn secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  [ CANCELAR EDICIÓN ]
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* PANEL 3 — HISTORIAL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="tool-panel"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div className="module-header">
              | BOLETAS GUARDADAS ({saved.length})
            </div>
            <div
              className="panel-content"
              style={{
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: '420px',
                padding: '15px',
              }}
            >
              {saved.length === 0 ? (
                <div
                  style={{
                    opacity: 0.5,
                    textAlign: 'center',
                    marginTop: '40px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  SIN BOLETAS REGISTRADAS
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {saved.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        border: '1.5px solid var(--border-color)',
                        padding: '12px',
                        backgroundColor:
                          editingId === b.id ? 'var(--bg-grey)' : 'var(--card)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <FileText
                            size={12}
                            style={{
                              display: 'inline',
                              marginRight: '4px',
                              verticalAlign: 'text-bottom',
                            }}
                          />{' '}
                          {b.resultTitle}
                        </h4>
                      </div>
                      <p
                        style={{
                          margin: '4px 0',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          color: 'var(--accent-red)',
                        }}
                      >
                        BRUTO: {fmt(b.bruto)}
                      </p>
                      <p
                        style={{
                          margin: '4px 0',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                      >
                        LÍQUIDO: {fmt(b.liquido)}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: '5px',
                          marginTop: '10px',
                          borderTop: '1px dashed var(--border-color)',
                          paddingTop: '8px',
                        }}
                      >
                        <button
                          onClick={() => handleEdit(b)}
                          className="technical-btn secondary"
                          style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '9px',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <Edit2 size={12} strokeWidth={1.5} /> [ EDITAR ]
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="technical-btn secondary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: 'var(--accent-red)',
                          }}
                          title="Eliminar"
                        >
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
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Calculator size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Boleta de Honorarios" documentId="T-06" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Desglose de Boleta</h3>
            {calcName.trim() && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#1a1a1a' }}><strong>Identificador:</strong> {calcName}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a' }}><tbody>
              <tr><td style={{ padding: '7px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Total Honorarios (Bruto)</td><td style={{ padding: '7px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{fmt(results.bruto)}</td></tr>
              <tr><td style={{ padding: '7px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>{retentionRate}% Impuesto Retenido</td><td style={{ padding: '7px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{fmt(results.retencion)}</td></tr>
              <tr><td style={{ padding: '8px', fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>Total Líquido a Pagar</td><td style={{ padding: '8px', fontWeight: 800, textAlign: 'right', borderTop: '2px solid #1a1a1a' }}>{fmt(results.liquido)}</td></tr>
            </tbody></table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </div>
  );
}
