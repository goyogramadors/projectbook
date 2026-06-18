/* =============================================================================
   CalculadoraCargaOcupacionView.tsx — CALCULADORA CARGA DE OCUPACIÓN (T-27)
   -----------------------------------------------------------------------------
   Calcula la carga de ocupación (personas) por recinto según los factores de la
   OGUC (Art. 4.2.4): carga = ceil(superficie / factor). Suma la carga total del
   proyecto. Conecta con el ProjectMaster activo (useProjects().getProject) para
   el encabezado y persiste sus sectores en localStorage bajo
   ab-carga-ocupacion-${projectId} (no toca el master).
   ============================================================================= */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Users, Info } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── estilos de la lámina de SOLO LECTURA (neutros, papel blanco) ─────────────── */
const pvWrap: React.CSSProperties = { fontSize: 12, color: '#1a1a1a' };
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const pvTh: React.CSSProperties = { padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' };
const pvTd: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #d8d8d8' };
const pvTdR: React.CSSProperties = { ...pvTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface FactorOGUC { id: string; label: string; factor: number; supType: 'útil' | 'total'; }
interface Sector { id: string; name: string; factorId: string; surface: string; }
interface CargaGuardada { sectores: Sector[]; }

/* ── datos normativos (Art. 4.2.4 OGUC) ────────────────────────────────────── */
const OGUC_FACTORS: Record<string, FactorOGUC[]> = {
  'Vivienda': [
    { id: 'v1', label: 'Unidades de hasta 60 m²', factor: 15.0, supType: 'útil' },
    { id: 'v2', label: 'Unidades de más de 60 m² hasta 140 m²', factor: 20.0, supType: 'útil' },
    { id: 'v3', label: 'Unidades de más de 140 m²', factor: 30.0, supType: 'útil' },
  ],
  'Oficinas': [
    { id: 'o1', label: 'Oficinas en general', factor: 10.0, supType: 'útil' },
  ],
  'Comercio': [
    { id: 'c1', label: 'Salas de venta en niveles -1, 1 y 2', factor: 3.0, supType: 'útil' },
    { id: 'c2', label: 'Salas de venta en otros pisos', factor: 5.0, supType: 'útil' },
    { id: 'c3', label: 'Patios de comida (con mesas)', factor: 1.0, supType: 'útil' },
  ],
  'Educación': [
    { id: 'e1', label: 'Salas de clase', factor: 1.5, supType: 'útil' },
    { id: 'e2', label: 'Talleres, Laboratorios, Bibliotecas', factor: 5.0, supType: 'útil' },
    { id: 'e3', label: 'Oficinas administrativas', factor: 7.0, supType: 'útil' },
  ],
  'Salud': [
    { id: 's1', label: 'Salas de espera', factor: 0.8, supType: 'útil' },
    { id: 's2', label: 'Consultas médicas', factor: 3.0, supType: 'útil' },
  ],
  'Otros usos comunes': [
    { id: 'ot1', label: 'Área de público en bares, cafeterías y pubs', factor: 1.0, supType: 'útil' },
    { id: 'ot2', label: 'Restaurantes (comedores)', factor: 1.5, supType: 'útil' },
    { id: 'ot3', label: 'Estacionamientos de uso común o públicos', factor: 16.0, supType: 'total' },
    { id: 'ot4', label: 'Bodegas y Archivos', factor: 40.0, supType: 'útil' },
  ],
};

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-carga-ocupacion-${pid}`;

/* ── helpers puros ─────────────────────────────────────────────────────────── */
function findFactorById(id: string): FactorOGUC | null {
  for (const categoria of Object.keys(OGUC_FACTORS)) {
    const found = OGUC_FACTORS[categoria]?.find((f) => f.id === id);
    if (found) return found;
  }
  return null;
}
function nuevoId(): string {
  return `sec-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function CalculadoraCargaOcupacionView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [saving, setSaving] = useState(false);
  const [sectores, setSectores] = useState<Sector[]>([
    { id: 'sec-1', name: 'Locales Comerciales (Piso 1)', factorId: 'c1', surface: '150' },
    { id: 'sec-2', name: 'Oficinas (Pisos 2-5)', factorId: 'o1', surface: '800' },
  ]);

  /* ── carga inicial desde localStorage ── */
  useEffect(() => {
    if (!project) return;
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        const s = JSON.parse(raw) as Partial<CargaGuardada>;
        if (Array.isArray(s.sectores)) setSectores(s.sectores);
      } catch { /* datos corruptos — ignorar */ }
    }
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── cálculo derivado ── */
  const { filas, totalCarga, totalSuperficie } = useMemo(() => {
    let tCarga = 0;
    let tSup = 0;
    const calc = sectores.map((sector) => {
      const factor = findFactorById(sector.factorId);
      const factorValue = factor ? factor.factor : 0;
      const surfaceVal = parseFloat(sector.surface) || 0;
      const carga = factorValue > 0 && surfaceVal > 0 ? Math.ceil(surfaceVal / factorValue) : 0;
      tCarga += carga;
      tSup += surfaceVal;
      return { sector, factor, carga };
    });
    return { filas: calc, totalCarga: tCarga, totalSuperficie: tSup };
  }, [sectores]);

  if (!project) return (
    <div className="ab-tool-root">
      <p className="tech-quote">Selecciona un proyecto para calcular la carga de ocupación.</p>
    </div>
  );

  /* ── mutadores ── */
  const addSector = () => setSectores((prev) => [...prev, { id: nuevoId(), name: '', factorId: '', surface: '' }]);
  const removeSector = (id: string) => setSectores((prev) => prev.filter((s) => s.id !== id));
  const updateSector = (id: string, campo: keyof Sector, valor: string) =>
    setSectores((prev) => prev.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)));

  /* ── guardado ── */
  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload: CargaGuardada = { sectores };
      localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(payload));
      triggerToast('Carga de ocupación guardada.');
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
          <Users size={22} strokeWidth={1.4} /> Calculadora de Carga de Ocupación
        </h1>
        <button type="button" onClick={handleSave} disabled={saving || readOnly} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? '⎔' : <Save size={14} />} [ GUARDAR CARGA ]
        </button>
      </div>
      <p className="tech-quote" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span>Proyecto: <strong>{project.name}</strong> · {String(project.etapa)}</span>
        <span className="ab-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Info size={11} /> OGUC Art. 1.1.2 y 4.2.4
        </span>
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div className="tool-panel">
        <div className="module-header">| RECINTOS Y CARGA POR DESTINO</div>
        <div className="panel-content">
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 0, marginBottom: 16 }}>
            La carga se calcula dividiendo la superficie por el factor normativo y <strong>redondeando al entero superior</strong> (cantidad máxima de personas).
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="tech-table">
              <thead>
                <tr>
                  <th>Destino (OGUC)</th>
                  <th style={{ width: 180 }}>Nombre Unidad</th>
                  <th style={{ width: 130, textAlign: 'right' }}>Superficie (m²)</th>
                  <th style={{ width: 110, textAlign: 'right' }}>Carga (pers.)</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.6, fontStyle: 'italic', padding: '18px 12px' }}>Agrega un recinto para comenzar.</td></tr>
                ) : (
                  filas.map(({ sector, factor, carga }) => (
                    <tr key={sector.id}>
                      <td>
                        <select className="tech-select" value={sector.factorId} disabled={readOnly} onChange={(e) => updateSector(sector.id, 'factorId', e.target.value)} style={{ width: '100%' }}>
                          <option value="" disabled>Selecciona un destino…</option>
                          {Object.entries(OGUC_FACTORS).map(([categoria, items]) => (
                            <optgroup key={categoria} label={categoria}>
                              {items.map((item) => (
                                <option key={item.id} value={item.id}>{item.label} (F: {item.factor})</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {factor && (
                          <span style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase' }}>Sup. {factor.supType}</span>
                        )}
                      </td>
                      <td>
                        <input type="text" className="tech-input" value={sector.name} disabled={readOnly} placeholder="Ej: Unidad 1" onChange={(e) => updateSector(sector.id, 'name', e.target.value)} style={{ padding: '6px 8px', fontSize: 11 }} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.1" className="tech-input" value={sector.surface} disabled={readOnly} placeholder="0.00" onChange={(e) => updateSector(sector.id, 'surface', e.target.value)} style={{ textAlign: 'right', fontFamily: 'monospace', padding: '6px 8px', fontSize: 11 }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{carga}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => removeSector(sector.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 6px' }} title="Eliminar unidad">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addSector} disabled={readOnly} className="technical-btn secondary" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <Plus size={13} /> [ AGREGAR UNIDAD ]
          </button>

          {/* TOTALES */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              Superficie total procesada: <strong style={{ fontFamily: 'monospace' }}>{totalSuperficie.toFixed(2)} m²</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--muted)', border: '2px solid var(--border)', padding: '10px 18px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>Carga Total Proyecto</span>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: 'var(--destructive)', lineHeight: 1 }}>{totalCarga}</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>personas</span>
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Users size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Carga de Ocupación" documentId="T-27" projectId={projectId}>
          <div style={pvWrap}>
            <h3 style={pvH3}>Carga de Ocupación · OGUC Art. 4.2.4</h3>
            <table style={pvTable}>
              <thead><tr>
                <th style={pvTh}>Destino</th><th style={pvTh}>Unidad</th>
                <th style={{ ...pvTh, textAlign: 'right' }}>m²</th><th style={{ ...pvTh, textAlign: 'right' }}>Pers.</th>
              </tr></thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr><td style={pvTd} colSpan={4}>Sin recintos registrados.</td></tr>
                ) : filas.map(({ sector, factor, carga }) => (
                  <tr key={sector.id}>
                    <td style={pvTd}>{factor ? factor.label : '—'}</td>
                    <td style={pvTd}>{sector.name || '—'}</td>
                    <td style={pvTdR}>{(parseFloat(sector.surface) || 0).toFixed(1)}</td>
                    <td style={pvTdR}>{carga}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...pvTd, fontWeight: 800, borderTop: '2px solid #1a1a1a' }} colSpan={2}>CARGA TOTAL DEL PROYECTO</td>
                  <td style={{ ...pvTdR, borderTop: '2px solid #1a1a1a' }}>{totalSuperficie.toFixed(1)}</td>
                  <td style={{ ...pvTdR, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>{totalCarga}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
