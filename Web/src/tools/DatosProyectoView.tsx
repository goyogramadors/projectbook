/* =============================================================================
   DatosProyectoView.tsx — DATOS DEL PROYECTO (T-04)
   -----------------------------------------------------------------------------
   Etapa, destino, tipo y superficies según el modelo de Datos Clave (CONST §6).
   Sincroniza etapa, destino, superficieTerrenoLegal, superficieManual y
   superficieOrigen con el ProjectMaster (repo.save). El tipo de proyecto y las
   notas se archivan en localStorage bajo ab-datos-proyecto-${projectId}.
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import { TIPOS_PROYECTO } from '../core/types';
import type { ToolProps, ProjectMaster, Etapa, SuperficieOrigen, TipoProyecto } from '../core/types';

/* ── estilos de la lámina de SOLO LECTURA (neutros, papel blanco) ─────────────── */
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTd: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontSize: 12, color: '#1a1a1a' };
const pvK: React.CSSProperties = { ...pvTd, fontWeight: 700, width: '46%', color: '#444' };

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface DatosExtra { tipoProyecto: string; notas: string; }

/* ── constantes ────────────────────────────────────────────────────────────── */
/* La persistencia del estado propio (tipoProyecto/notas) la gobierna useToolData
   con la clave canónica `ab-datos-proyecto-${projectId}` (retro-compatible). */
const TOOL_ID = 'datos-proyecto';
const ETAPAS: Etapa[] = ['Perfil', 'Anteproyecto', 'Proyecto', 'Licitación', 'Obra', 'Recepción'];
/* Categoría del proyecto (clasificación de destino/uso, dato propio de la herramienta). */
const CATEGORIAS_PROYECTO = ['Habitacional', 'Comercial', 'Industrial', 'Equipamiento', 'Mixto'];
const DESTINOS = ['Vivienda', 'Comercio', 'Oficina', 'Bodega', 'Salud', 'Educación', 'Espacio Público'];
const DATOS_VACIOS: DatosExtra = { tipoProyecto: 'Habitacional', notas: '' };

/* ── componente principal ──────────────────────────────────────────────────── */
export default function DatosProyectoView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, reload } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [nombre, setNombre] = useState('');
  const [etapa, setEtapa] = useState<string>('Perfil');
  const [destino, setDestino] = useState('Vivienda');
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto | ''>('');
  const [supTerreno, setSupTerreno] = useState('');
  const [supProyecto, setSupProyecto] = useState('');
  const [origen, setOrigen] = useState<SuperficieOrigen>('MANUAL');
  const [saving, setSaving] = useState(false);

  // Estado propio de la herramienta (tipoProyecto/notas): carga y guardado
  // gobernados por useToolData (Cloud si Premium · localStorage si Free).
  const { data: extra, setData: setExtra, save: saveExtra } =
    useToolData<DatosExtra>(TOOL_ID, projectId, DATOS_VACIOS);

  /* ── carga inicial (solo campos del master; `extra` lo hidrata useToolData) ── */
  useEffect(() => {
    if (!project) return;
    setNombre(project.name || '');
    setEtapa(project.etapa || 'Perfil');
    setDestino(project.destino || 'Vivienda');
    setTipoProyecto(project.tipoProyecto || '');
    setSupTerreno(project.superficieTerrenoLegal || '');
    setSupProyecto(project.superficieManual || '');
    setOrigen(project.superficieOrigen || 'MANUAL');
  }, [project?.id]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para editar sus datos.</p></div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    try {
      await saveExtra(extra);
      const updated: ProjectMaster = {
        ...project,
        name: nombre.trim() || project.name,
        etapa,
        destino,
        tipoProyecto: tipoProyecto || undefined,
        superficieTerrenoLegal: supTerreno,
        superficieManual: supProyecto,
        superficieOrigen: origen,
      };
      await repo.save(updated);
      await reload();
      triggerToast('Datos del proyecto actualizados.');
    } catch {
      triggerToast('Error al guardar los datos del proyecto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.ClipboardList size={22} strokeWidth={1.4} /> Datos del Proyecto
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Ficha normativa, etapa, destino y superficies.
      </p>

      <div className="ab-split">
      <form onSubmit={handleSave} className="tool-panel ab-split-left">
        <div className="module-header">| FICHA NORMATIVA Y SUPERFICIES</div>
        <div className="panel-content">
          <div className="ab-form-grid">
            <div className="tech-input-group col-span-full">
              <label>Nombre del Proyecto</label>
              <input className="tech-input" value={nombre} disabled={readOnly} onChange={e => setNombre(e.target.value)} placeholder="Ej: Edificio Los Alerces" style={{ fontWeight: 'bold' }} />
            </div>
            <div className="tech-input-group">
              <label>Etapa del Proyecto</label>
              <select className="tech-select" value={etapa} disabled={readOnly} onChange={e => setEtapa(e.target.value)}>
                {ETAPAS.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Categoría del Proyecto</label>
              <select className="tech-select" value={extra.tipoProyecto} disabled={readOnly} onChange={e => setExtra(prev => ({ ...prev, tipoProyecto: e.target.value }))}>
                {CATEGORIAS_PROYECTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Tipo de Proyecto</label>
              <select className="tech-select" value={tipoProyecto} disabled={readOnly} onChange={e => setTipoProyecto(e.target.value as TipoProyecto)}>
                <option value="">— Seleccionar —</option>
                {TIPOS_PROYECTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Destino</label>
              <select className="tech-select" value={destino} disabled={readOnly} onChange={e => setDestino(e.target.value)}>
                {DESTINOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Superficie Terreno Legal (Escritura) m²</label>
              <input type="number" className="tech-input" value={supTerreno} disabled={readOnly} onChange={e => setSupTerreno(e.target.value)} />
            </div>
            <div className="tech-input-group">
              <label>Superficie Proyecto a Edificar (m²)</label>
              <input type="number" className="tech-input" value={supProyecto} disabled={readOnly} onChange={e => setSupProyecto(e.target.value)} />
            </div>
            <div className="tech-input-group">
              <label>Origen de Superficie (Ficha)</label>
              <select className="tech-select" value={origen} disabled={readOnly} onChange={e => setOrigen(e.target.value as SuperficieOrigen)}>
                <option value="MANUAL">Manual (esta herramienta)</option>
                <option value="DIMENSIONADOR">Dimensionador</option>
              </select>
            </div>
            <div className="tech-input-group col-span-full">
              <label>Notas / Descripción General</label>
              <textarea rows={3} className="tech-input" value={extra.notas} disabled={readOnly} onChange={e => setExtra(prev => ({ ...prev, notas: e.target.value }))} />
            </div>
          </div>
          <p style={{ fontSize: 10, opacity: 0.6, marginTop: 10 }}>
            El "Origen de Superficie" decide cuál valor se muestra en la Ficha: la superficie manual de aquí o la calculada por el Dimensionador (CONST §6). Ninguno de los dos se borra.
          </p>
          <button type="submit" disabled={saving || readOnly} className="technical-btn" style={{ marginTop: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {saving ? '⎔' : <Icons.Save size={14} />} [ GUARDAR SECCIÓN ]
          </button>
        </div>
      </form>

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.ClipboardList size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Datos del Proyecto" documentId="T-04" projectId={projectId}>
          <div>
            <h3 style={pvH3}>Ficha de Datos del Proyecto</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
              <tr><td style={pvK}>Nombre</td><td style={pvTd}>{nombre || '—'}</td></tr>
              <tr><td style={pvK}>Etapa</td><td style={pvTd}>{etapa}</td></tr>
              <tr><td style={pvK}>Categoría del Proyecto</td><td style={pvTd}>{extra.tipoProyecto}</td></tr>
              <tr><td style={pvK}>Tipo de Proyecto</td><td style={pvTd}>{tipoProyecto || '—'}</td></tr>
              <tr><td style={pvK}>Destino</td><td style={pvTd}>{destino}</td></tr>
              <tr><td style={pvK}>Superficie Terreno Legal</td><td style={pvTd}>{supTerreno || '—'} m²</td></tr>
              <tr><td style={pvK}>Superficie a Edificar</td><td style={pvTd}>{supProyecto || '—'} m²</td></tr>
              <tr><td style={pvK}>Origen de Superficie</td><td style={pvTd}>{origen}</td></tr>
            </tbody></table>
            {extra.notas.trim() && (
              <p style={{ fontSize: 12, color: '#1a1a1a', marginTop: 12 }}><strong>Notas:</strong> {extra.notas}</p>
            )}
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
