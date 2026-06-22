/* =============================================================================
   DimensionadorPublicosView.tsx — DIMENSIONADOR EDIFICIOS PÚBLICOS (T-15)
   -----------------------------------------------------------------------------
   Programa arquitectónico de edificios institucionales según metodología MDSF
   2024 (dotación → áreas de trabajo, colaborativos, soporte, baños, atención de
   público, complementarios y corporativos → superficie neta y bruta por tipología).
   NO consume datos de la base; persiste el estado de la herramienta en una
   subcolección Firestore (Premium: projects/{id}/dim-publicos/estado) con fallback
   localStorage (Free). Puede sincronizar la superficie bruta al master (CONST §6).
   ============================================================================= */
import { useEffect, useMemo, useState, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Users, Building, FileText, Info } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import { useDimensionadorSync } from '../hooks/useDimensionadorSync';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── tipos y constantes ────────────────────────────────────────────────────── */
interface StaffCat { id: string; label: string; min: number; max: number; }
const STAFF_CATEGORIES: StaffCat[] = [
  { id: 'ministro', label: 'Ministr@ - Subsecretari@', min: 30, max: 38 },
  { id: 'jefeServ', label: 'Jefes de Servicio', min: 20, max: 30 },
  { id: 'dirA', label: 'Directiv@s Tipo A', min: 15, max: 18 },
  { id: 'dirB', label: 'Directiv@s Tipo B', min: 12, max: 15 },
  { id: 'profJef', label: 'Profesional Jefatura', min: 9, max: 12 },
  { id: 'profSen', label: 'Profesionales Senior / Equipos', min: 7, max: 9 },
  { id: 'profTec', label: 'Profesionales / Técnic@s / Admin', min: 4.5, max: 6.0 },
  { id: 'temporal', label: 'Puestos Temporales / Rotativos', min: 3.5, max: 6.0 },
  { id: 'secretaria', label: 'Secretaría con Espera', min: 11, max: 13 },
];

interface Tipologia { id: string; label: string; description: string; minFactor: number; maxFactor: number; }
const TYPOLOGIES: Tipologia[] = [
  { id: 'A', label: 'Tipología A (<30 años)', description: 'Edificios flexibles y eficientes. Fácil accesibilidad y altos estándares.', minFactor: 30, maxFactor: 35 },
  { id: 'B', label: 'Tipología B (30-60 años)', description: 'Limitaciones de organización. Modulaciones rígidas y regular accesibilidad.', minFactor: 35, maxFactor: 40 },
  { id: 'C', label: 'Tipología C (>60 años)', description: 'Rigideces manifiestas, alta densidad. Difícil adaptación a accesibilidad.', minFactor: 40, maxFactor: 50 },
];

type StaffCounts = Record<string, number>;
interface PublicData { modules: number; peakWaiters: number; }
interface BuildingConfig { typology: string; includeCorporateAreas: boolean; }
interface EstadoGuardado { staff: StaffCounts; publicData: PublicData; buildingConfig: BuildingConfig; }

const TOOL_ID = 'dim-publicos';
const estadoDoc = (pid: string) => doc(db, 'projects', pid, 'dim-publicos', 'estado');
const STAFF_VACIO: StaffCounts = STAFF_CATEGORIES.reduce<StaffCounts>((acc, c) => { acc[c.id] = 0; return acc; }, {});
const ESTADO_VACIO: EstadoGuardado = { staff: STAFF_VACIO, publicData: { modules: 0, peakWaiters: 0 }, buildingConfig: { typology: 'A', includeCorporateAreas: false } };

/* ── helper de resultados (módulo, fila) ───────────────────────────────────── */
function ResultRow({ label, value, tooltip, accent = false }: { label: string; value: number; tooltip?: string; accent?: boolean }) {
  if (value === 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', color: accent ? 'var(--destructive)' : 'var(--foreground)' }}>
      <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }} title={tooltip}>
        {label}{tooltip && <Info size={13} style={{ opacity: 0.5 }} />}
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>{value.toLocaleString('es-CL')} m²</span>
    </div>
  );
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function DimensionadorPublicosView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { user } = useAuth();
  const { triggerToast } = useToast();
  const { syncSuperficie } = useDimensionadorSync();
  const project = getProject(projectId);
  const isPremium = user?.plan === 'Premium';

  const [saving, setSaving] = useState(false);
  // Persistencia unificada (Fase 2): useToolData (nube Premium / localStorage Free).
  // Sustituye la carga/guardado dual manual (Firestore dim-publicos/estado + localStorage).
  const { data, setData, save } = useToolData<EstadoGuardado>(TOOL_ID, projectId, ESTADO_VACIO);
  const { staff: staffCounts, publicData, buildingConfig } = data;
  const setStaffCounts = (u: SetStateAction<StaffCounts>) => setData((d) => ({ ...d, staff: typeof u === 'function' ? u(d.staff) : u }));
  const setPublicData = (u: SetStateAction<PublicData>) => setData((d) => ({ ...d, publicData: typeof u === 'function' ? u(d.publicData) : u }));
  const setBuildingConfig = (u: SetStateAction<BuildingConfig>) => setData((d) => ({ ...d, buildingConfig: typeof u === 'function' ? u(d.buildingConfig) : u }));

  const results = useMemo(() => {
    let totalStaff = 0;
    let workArea = 0;
    STAFF_CATEGORIES.forEach(cat => {
      const count = staffCounts[cat.id] || 0;
      if (cat.id !== 'temporal') totalStaff += count;
      workArea += count * ((cat.min + cat.max) / 2);
    });

    const collabInformal = totalStaff * 0.4;
    let collabFormal = 0;
    if (totalStaff > 0) collabFormal = totalStaff <= 20 ? 11 : totalStaff * 0.55;
    const totalCollab = collabInformal + collabFormal;

    const totalSupport = workArea * 0.02 + workArea * 0.02;

    let staffBathroomsArea = 0;
    if (totalStaff > 0) {
      if (totalStaff <= 10) staffBathroomsArea = 4;
      else if (totalStaff <= 30) staffBathroomsArea = 8;
      else if (totalStaff <= 50) staffBathroomsArea = 12;
      else staffBathroomsArea = 12 + Math.ceil((totalStaff - 50) / 20) * 4;
    }

    let publicAttentionArea = publicData.modules * 1.3 + publicData.peakWaiters * 0.9;
    let publicBathroomsArea = 0;
    if (publicData.peakWaiters > 0) publicBathroomsArea = Math.ceil(publicData.peakWaiters / 100) * 2.25 + 4.5;

    const totalComplementary = workArea * 0.025 + Math.min(workArea * 0.0125, 25);

    workArea = Math.round(workArea);
    const roundedCollab = Math.round(totalCollab);
    const roundedSupport = Math.round(totalSupport);
    staffBathroomsArea = Math.round(staffBathroomsArea);
    publicAttentionArea = Math.round(publicAttentionArea);
    publicBathroomsArea = Math.round(publicBathroomsArea);
    const roundedComplementary = Math.round(totalComplementary);

    let totalNetArea = workArea + roundedCollab + roundedSupport + staffBathroomsArea + publicAttentionArea + publicBathroomsArea + roundedComplementary;
    let corporateArea = 0;
    if (buildingConfig.includeCorporateAreas) { corporateArea = Math.round(totalNetArea * 0.07); totalNetArea += corporateArea; }

    const selectedType = TYPOLOGIES.find(t => t.id === buildingConfig.typology) ?? TYPOLOGIES[0];
    const correctionFactor = ((selectedType?.minFactor ?? 0) + (selectedType?.maxFactor ?? 0)) / 2 / 100;
    const totalGrossArea = Math.round(totalNetArea * (1 + correctionFactor));

    return { totalStaff, workArea, totalCollab: roundedCollab, totalSupport: roundedSupport, staffBathroomsArea, publicAttentionArea, publicBathroomsArea, totalComplementary: roundedComplementary, corporateArea, totalNetArea, correctionFactor, totalGrossArea };
  }, [staffCounts, publicData, buildingConfig]);

  const persist = async () => {
    await save();
  };

  const handleSave = async () => {
    if (readOnly || !project) { triggerToast('Selecciona un proyecto para guardar.'); return; }
    setSaving(true);
    try {
      await persist();
      triggerToast(isPremium ? `Programa guardado en la nube · ${results.totalNetArea} m² netos.` : `Programa guardado localmente · ${results.totalNetArea} m² netos.`);
    } catch { triggerToast('Error al guardar el programa.'); }
    finally { window.setTimeout(() => setSaving(false), 300); }
  };

  const sincronizarSuperficie = async () => {
    if (readOnly) return;
    const ok = await syncSuperficie(projectId, results.totalGrossArea, 'DIMENSIONADOR');
    triggerToast(ok ? `Superficie bruta (${results.totalGrossArea} m²) sincronizada con el proyecto.` : 'Selecciona un proyecto activo.');
  };

  const setStaff = (id: string, value: string) => setStaffCounts(prev => ({ ...prev, [id]: Math.max(0, parseInt(value, 10) || 0) }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' }}>
            <Building size={22} strokeWidth={1.4} /> Dimensionador de Edificios Públicos
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Metodología MDSF 2024 · {project ? <>Proyecto: <strong>{project.name}</strong></> : 'sin proyecto activo'}
            <span style={{ marginLeft: 8, opacity: 0.6 }}>[{isPremium ? 'NUBE' : 'LOCAL'}]</span>
          </p>
        </div>
        <button className="technical-btn" onClick={handleSave} disabled={saving || readOnly} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? <RefreshCw size={14} className="ab-spin" /> : <Save size={14} />} {saving ? 'Guardando…' : 'Guardar Programa'}
        </button>
      </div>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* INPUTS */}
        <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="tool-panel">
            <div className="module-header"><span><Users size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| 1. ESTAMENTOS Y DOTACIÓN</span></div>
            <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {STAFF_CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted-foreground)', flex: 1 }} title={`${cat.min}–${cat.max} m²/persona`}>{cat.label}</label>
                  <input type="number" min="0" className="tech-input" value={staffCounts[cat.id] ?? 0} disabled={readOnly} onChange={(e) => setStaff(cat.id, e.target.value)} style={{ width: 80, textAlign: 'right' }} />
                </div>
              ))}
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header"><span><Users size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| 2. ATENCIÓN A PÚBLICO</span></div>
            <div className="panel-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Módulos de atención / Cajas</label>
                <input type="number" min="0" className="tech-input" value={publicData.modules} disabled={readOnly} onChange={(e) => setPublicData({ ...publicData, modules: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>~1.3 m² por módulo</span>
              </div>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Público en espera (Hora Punta)</label>
                <input type="number" min="0" className="tech-input" value={publicData.peakWaiters} disabled={readOnly} onChange={(e) => setPublicData({ ...publicData, peakWaiters: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Afecta salas y baños públicos</span>
              </div>
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header"><span><Building size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| 3. CONFIGURACIÓN DEL EDIFICIO</span></div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Tipología de Edificación (Factor de Corrección)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {TYPOLOGIES.map(t => {
                    const activo = buildingConfig.typology === t.id;
                    return (
                      <div key={t.id} title={t.description} onClick={() => !readOnly && setBuildingConfig({ ...buildingConfig, typology: t.id })}
                        style={{ padding: '8px 12px', border: `1.5px solid ${activo ? 'var(--destructive)' : 'var(--border)'}`, borderRadius: 'var(--radius)', cursor: readOnly ? 'default' : 'pointer', background: activo ? 'var(--muted)' : 'var(--card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: activo ? 600 : 400 }}>
                        <span>{t.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>≈ {(t.minFactor + t.maxFactor) / 2}% circ/muros</span>
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted-foreground)', display: 'inline-flex', gap: 4, marginTop: 6 }}><Info size={12} /> El tipo agrega el % extra de la Superficie Neta para obtener la Bruta.</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={buildingConfig.includeCorporateAreas} disabled={readOnly} onChange={(e) => setBuildingConfig({ ...buildingConfig, includeCorporateAreas: e.target.checked })} />
                Incluir recintos corporativos (Halles, Área Técnica, Conserjería)
              </label>
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        <div style={{ flex: '1 1 300px', position: 'sticky', top: 16 }}>
          <div className="tool-panel">
            <div className="module-header"><span><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />| PROGRAMA ESTIMADO</span></div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted-foreground)' }}>
                <span style={{ fontSize: 13 }}>Dotación Total</span>
                <span style={{ fontFamily: 'monospace', background: 'var(--muted)', padding: '2px 8px', borderRadius: 'var(--radius)' }}>{results.totalStaff} pers.</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <ResultRow label="Áreas de Trabajo" value={results.workArea} tooltip="Puestos estables, temporales y secretarías." />
              <ResultRow label="Espacios Colaborativos" value={results.totalCollab} tooltip="Salas de reuniones y trabajo informal." />
              <ResultRow label="Servicios y Soporte" value={results.totalSupport} tooltip="Kitchenettes y archivos cotidianos." />
              <ResultRow label="Baños Funcionarios" value={results.staffBathroomsArea} tooltip="Según cantidad de personal." />
              <ResultRow label="Atención y Baños Público" value={results.publicAttentionArea + results.publicBathroomsArea} tooltip="Módulos, cajas, espera y baños accesibles." />
              <ResultRow label="Recintos Complementarios" value={results.totalComplementary} tooltip="Archivos generales, bodegas y Data Center." />
              {buildingConfig.includeCorporateAreas && <ResultRow label="Áreas Corporativas" value={results.corporateArea} accent tooltip="Halles, área técnica y servicios generales." />}

              <div style={{ paddingTop: 12, marginTop: 8, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>SUPERFICIE NETA</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>{results.totalNetArea.toLocaleString('es-CL')} m²</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 10 }}>
                  <span>+ Factor Muros/Circ. Tipo {buildingConfig.typology}</span><span>{(results.correctionFactor * 100).toFixed(1)}%</span>
                </div>
                <div style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>SUPERFICIE BRUTA</span>
                  <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--destructive)' }}>{results.totalGrossArea.toLocaleString('es-CL')} m²</span>
                </div>
                <button className="technical-btn secondary" onClick={sincronizarSuperficie} disabled={readOnly} style={{ width: '100%', marginTop: 10, fontSize: 11 }}>[ SINCRONIZAR SUPERFICIE AL PROYECTO ]</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Building size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Programa Edificio Público" documentId="T-15" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Programa Arquitectónico (MDSF 2024)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a' }}><tbody>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700, width: '60%' }}>Dotación Total</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{results.totalStaff} pers.</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>Áreas de Trabajo</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{results.workArea.toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>Colaborativos + Soporte</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{(results.totalCollab + results.totalSupport).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>Atención y Baños Público</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{(results.publicAttentionArea + results.publicBathroomsArea).toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', borderTop: '2px solid #1a1a1a', fontWeight: 700 }}>Superficie Neta</td><td style={{ padding: '6px 8px', borderTop: '2px solid #1a1a1a', textAlign: 'right', fontWeight: 700 }}>{results.totalNetArea.toLocaleString('es-CL')} m²</td></tr>
              <tr><td style={{ padding: '6px 8px', fontWeight: 800 }}>Superficie Bruta (Tip. {buildingConfig.typology}, +{(results.correctionFactor * 100).toFixed(1)}%)</td><td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{results.totalGrossArea.toLocaleString('es-CL')} m²</td></tr>
            </tbody></table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
