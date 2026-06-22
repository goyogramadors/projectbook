/* =============================================================================
   CuadroSuperficiesView.tsx — CUADRO DE SUPERFICIES (T-26)
   -----------------------------------------------------------------------------
   Cuadro normalizado de superficies edificadas por nivel (sobre terreno y
   subterráneo), con opción de áreas comunes y resumen total para el expediente.
   Conecta con el ProjectMaster activo (useProjects().getProject) para encabezar
   el cuadro y sembrar la superficie del predio; persiste su programa propio en
   localStorage bajo ab-cuadro-superficies-${projectId} (no toca el master).
   ============================================================================= */

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Table, LayoutGrid } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── estilos de la lámina de SOLO LECTURA (neutros, papel blanco) ─────────────── */
const pvWrap: React.CSSProperties = { fontSize: 12, color: '#1a1a1a' };
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const pvTd: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #d8d8d8' };
const pvTdR: React.CSSProperties = { ...pvTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface Piso { id: string; util: string; comun: string; }
interface CuadroGuardado {
  supOcupacion: string;
  supPredio: string;
  showComun: boolean;
  sobreTerreno: Piso[];
  subterraneo: Piso[];
}

/* ── constantes ────────────────────────────────────────────────────────────── */
const TOOL_ID = 'cuadro-superficies';
const CUADRO_VACIO: CuadroGuardado = { supOcupacion: '', supPredio: '', showComun: false, sobreTerreno: [{ id: 'st-1', util: '', comun: '' }], subterraneo: [] };

/* ── helpers puros ─────────────────────────────────────────────────────────── */
function parseVal(v: string): number {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}
function fmt(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function nuevoId(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
function totalPisos(data: Piso[], usarComun: boolean): { util: number; comun: number; total: number } {
  const util = data.reduce((acc, p) => acc + parseVal(p.util), 0);
  const comun = usarComun ? data.reduce((acc, p) => acc + parseVal(p.comun), 0) : 0;
  return { util, comun, total: util + comun };
}

/* ── tabla de niveles (componente a nivel de módulo: evita pérdida de foco) ──── */
interface TablaProps {
  titulo: string;
  data: Piso[];
  showComun: boolean;
  isUnderground: boolean;
  readOnly: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, campo: 'util' | 'comun', valor: string) => void;
}
function TablaPisos({ titulo, data, showComun, isUnderground, readOnly, onAdd, onRemove, onUpdate }: TablaProps) {
  const tot = totalPisos(data, showComun);
  return (
    <div className="tool-panel" style={{ marginBottom: 16 }}>
      <div className="module-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <LayoutGrid size={14} /> {titulo}
        </span>
        <button type="button" onClick={onAdd} disabled={readOnly} className="btn-tech-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
          <Plus size={12} /> Agregar Nivel
        </button>
      </div>
      <div className="panel-content" style={{ padding: 0 }}>
        <table className="tech-table">
          <thead>
            <tr>
              <th style={{ width: 80, textAlign: 'center' }}>Nivel</th>
              <th style={{ textAlign: 'right' }}>Útil (m²)</th>
              {showComun && <th style={{ textAlign: 'right' }}>Común (m²)</th>}
              <th style={{ textAlign: 'right', width: 120 }}>Total (m²)</th>
              <th style={{ width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={showComun ? 5 : 4} style={{ textAlign: 'center', opacity: 0.6, fontStyle: 'italic', padding: '18px 12px' }}>
                  Sin niveles en esta sección.
                </td>
              </tr>
            ) : (
              data.map((piso, index) => {
                const nivel = isUnderground ? -(index + 1) : index + 1;
                const filaTotal = parseVal(piso.util) + (showComun ? parseVal(piso.comun) : 0);
                return (
                  <tr key={piso.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>{nivel}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input type="number" min="0" step="0.01" value={piso.util} disabled={readOnly}
                        onChange={(e) => onUpdate(piso.id, 'util', e.target.value)} placeholder="0.00"
                        style={{ width: '100%', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: 'var(--card)', border: '1.5px solid var(--border)', padding: '4px 8px', color: 'var(--foreground)' }} />
                    </td>
                    {showComun && (
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" min="0" step="0.01" value={piso.comun} disabled={readOnly}
                          onChange={(e) => onUpdate(piso.id, 'comun', e.target.value)} placeholder="0.00"
                          style={{ width: '100%', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: 'var(--card)', border: '1.5px solid var(--border)', padding: '4px 8px', color: 'var(--foreground)' }} />
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{fmt(filaTotal)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => onRemove(piso.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 6px' }} title="Eliminar nivel">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}>{fmt(tot.util)}</td>
                {showComun && <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}>{fmt(tot.comun)}</td>}
                <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: 'var(--destructive)' }}>{fmt(tot.total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function CuadroSuperficiesView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [saving, setSaving] = useState(false);
  // Persistencia unificada (Fase 2): useToolData (nube Premium / localStorage Free).
  // Aliases con forma funcional para no alterar los mutadores ni el JSX del componente.
  const { data, setData, save, loading } = useToolData<CuadroGuardado>(TOOL_ID, projectId, CUADRO_VACIO);
  const { supOcupacion, supPredio, showComun, sobreTerreno, subterraneo } = data;
  const setShowComun = (u: SetStateAction<boolean>) => setData((d) => ({ ...d, showComun: typeof u === 'function' ? u(d.showComun) : u }));
  const setSupOcupacion = (u: SetStateAction<string>) => setData((d) => ({ ...d, supOcupacion: typeof u === 'function' ? u(d.supOcupacion) : u }));
  const setSupPredio = (u: SetStateAction<string>) => setData((d) => ({ ...d, supPredio: typeof u === 'function' ? u(d.supPredio) : u }));
  const setSobreTerreno = (u: SetStateAction<Piso[]>) => setData((d) => ({ ...d, sobreTerreno: typeof u === 'function' ? u(d.sobreTerreno) : u }));
  const setSubterraneo = (u: SetStateAction<Piso[]>) => setData((d) => ({ ...d, subterraneo: typeof u === 'function' ? u(d.subterraneo) : u }));

  /* Semilla del master: si tras cargar no hay superficie predial, usa la del proyecto. */
  useEffect(() => {
    if (!loading && project && !data.supPredio && project.superficieTerrenoLegal) {
      setData((d) => ({ ...d, supPredio: project.superficieTerrenoLegal }));
    }
  }, [loading, project, data.supPredio, setData]);

  if (!project) return (
    <div className="ab-tool-root">
      <p className="tech-quote">Selecciona un proyecto para usar el Cuadro de Superficies.</p>
    </div>
  );

  /* ── mutadores de niveles ── */
  const mutar = (
    setter: Dispatch<SetStateAction<Piso[]>>,
    prefijo: string,
  ) => ({
    add: () => setter((prev) => [...prev, { id: nuevoId(prefijo), util: '', comun: '' }]),
    remove: (id: string) => setter((prev) => prev.filter((p) => p.id !== id)),
    update: (id: string, campo: 'util' | 'comun', valor: string) =>
      setter((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))),
  });
  const sobre = mutar(setSobreTerreno, 'st');
  const sub = mutar(setSubterraneo, 'sub');

  /* ── totales globales ── */
  const totSobre = totalPisos(sobreTerreno, showComun);
  const totSub = totalPisos(subterraneo, showComun);
  const granTotal = totSobre.total + totSub.total;

  /* ── guardado (localStorage propio de la herramienta) ── */
  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      await save();
      // Mantiene sincronizada la superficie legal del terreno si el usuario la editó aquí.
      if (supPredio && supPredio !== project.superficieTerrenoLegal) {
        await repo.save({ ...project, superficieTerrenoLegal: supPredio });
      }
      triggerToast('Cuadro de superficies guardado.');
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
          <Table size={22} strokeWidth={1.4} /> Cuadro de Superficies
        </h1>
        <button type="button" onClick={handleSave} disabled={saving || readOnly} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? '⎔' : <Save size={14} />} [ GUARDAR CUADRO ]
        </button>
      </div>
      <p className="tech-quote" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span>Proyecto: <strong>{project.name}</strong> · {String(project.etapa)}</span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: readOnly ? 'default' : 'pointer' }}>
          <input type="checkbox" checked={showComun} disabled={readOnly} onChange={(e) => setShowComun(e.target.checked)} />
          Incluir Áreas Comunes
        </label>
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      {/* DATOS DEL PREDIO */}
      <div className="tool-panel" style={{ marginBottom: 16 }}>
        <div className="module-header">| DATOS DEL PREDIO</div>
        <div className="panel-content">
          <div className="ab-form-grid">
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>Superficie Ocupación 1er Piso (m²)</label>
              <input type="number" min="0" step="0.01" className="tech-input" value={supOcupacion} disabled={readOnly} onChange={(e) => setSupOcupacion(e.target.value)} placeholder="Ej: 150.5" />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>Superficie Total del Predio (m²)</label>
              <input type="number" min="0" step="0.01" className="tech-input" value={supPredio} disabled={readOnly} onChange={(e) => setSupPredio(e.target.value)} placeholder="Ej: 500" />
            </div>
          </div>
        </div>
      </div>

      {/* TABLAS DE NIVELES */}
      <TablaPisos titulo="Superficie Edificada Sobre Terreno" data={sobreTerreno} showComun={showComun} isUnderground={false} readOnly={readOnly} onAdd={sobre.add} onRemove={sobre.remove} onUpdate={sobre.update} />
      <TablaPisos titulo="Superficie Edificada Subterráneo" data={subterraneo} showComun={showComun} isUnderground readOnly={readOnly} onAdd={sub.add} onRemove={sub.remove} onUpdate={sub.update} />

      {/* RESUMEN GLOBAL */}
      <div className="tool-panel">
        <div className="module-header">◈ | RESUMEN TOTAL DE SUPERFICIES</div>
        <div className="panel-content">
          <table className="tech-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Superficie Edificada Sobre Terreno</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(totSobre.total)} m²</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Superficie Edificada Subterráneo</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(totSub.total)} m²</td>
              </tr>
              {showComun && (
                <>
                  <tr>
                    <td style={{ textAlign: 'right', fontSize: 10, opacity: 0.7 }}>Subtotal Útil</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10, opacity: 0.7 }}>{fmt(totSobre.util + totSub.util)} m²</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'right', fontSize: 10, opacity: 0.7 }}>Subtotal Común</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10, opacity: 0.7 }}>{fmt(totSobre.comun + totSub.comun)} m²</td>
                  </tr>
                </>
              )}
              <tr>
                <td style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13 }}>Superficie Edificada Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: 16, color: 'var(--destructive)' }}>{fmt(granTotal)} m²</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Table size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Cuadro de Superficies" documentId="T-26" projectId={projectId}>
          <div style={pvWrap}>
            <h3 style={pvH3}>Cuadro de Superficies</h3>
            <table style={pvTable}><tbody>
              <tr><td style={pvTd}>Sup. Ocupación 1er Piso</td><td style={pvTdR}>{supOcupacion || '—'} m²</td></tr>
              <tr><td style={pvTd}>Sup. Total del Predio</td><td style={pvTdR}>{supPredio || '—'} m²</td></tr>
              <tr><td style={pvTd}>Edificada Sobre Terreno{showComun ? ' (útil + común)' : ''}</td><td style={pvTdR}>{fmt(totSobre.total)} m²</td></tr>
              <tr><td style={pvTd}>Edificada Subterráneo{showComun ? ' (útil + común)' : ''}</td><td style={pvTdR}>{fmt(totSub.total)} m²</td></tr>
              <tr><td style={{ ...pvTd, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>SUPERFICIE EDIFICADA TOTAL</td><td style={{ ...pvTdR, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>{fmt(granTotal)} m²</td></tr>
            </tbody></table>
            <p style={{ fontSize: 10, color: '#666', marginTop: 12 }}>Niveles sobre terreno: {sobreTerreno.length} · Subterráneos: {subterraneo.length}</p>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
