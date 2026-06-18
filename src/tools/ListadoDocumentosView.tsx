/* =============================================================================
   ListadoDocumentosView.tsx — LISTADO DE DOCUMENTOS DEL EXPEDIENTE (T-25)
   -----------------------------------------------------------------------------
   Arma el listado de documentos y planos del expediente municipal según el tipo
   de trámite (Obra Nueva, Ampliación, Alteración, Reconstrucción, Reparación):
   pre-selecciona los sugeridos por la OGUC, permite marcar adicionales y agregar
   documentos personalizados. Conecta con el ProjectMaster activo
   (useProjects().getProject) para el encabezado y persiste su selección en
   localStorage bajo ab-listado-dom-${projectId} (no toca el master).
   ============================================================================= */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, FileText, Check, AlertCircle, Info } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── estilos de la lámina de SOLO LECTURA (neutros, papel blanco) ─────────────── */
const pvWrap: React.CSSProperties = { fontSize: 12, color: '#1a1a1a' };
const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface TipoExpediente { id: string; label: string; }
interface DocMaestro { id: string; name: string; reqFor: string[]; }
interface DocCustom { id: string; name: string; }
interface ListadoGuardado { projectType: string; selected: string[]; customDocs: DocCustom[]; }

/* ── datos (formularios MINVU / OGUC) ──────────────────────────────────────── */
const PROJECT_TYPES: TipoExpediente[] = [
  { id: 'obra_nueva', label: 'Obra Nueva' },
  { id: 'ampliacion', label: 'Ampliación (> 100m²)' },
  { id: 'alteracion', label: 'Alteración' },
  { id: 'reconstruccion', label: 'Reconstrucción' },
  { id: 'reparacion', label: 'Reparación' },
];

const MASTER_DOCUMENTS: DocMaestro[] = [
  { id: 'd1', name: 'Listado de Documentos y Planos numerados', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd2', name: 'Fotocopia del Certificado de Informaciones Previas (CIP)', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd3', name: 'Patentes de los profesionales responsables', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd4', name: 'Certificado de ingreso INE', reqFor: ['obra_nueva', 'ampliacion'] },
  { id: 'd5', name: 'Certificado de factibilidad A.P. y Alcantarillado', reqFor: ['obra_nueva', 'ampliacion'] },
  { id: 'd6', name: 'Certificado de Ingreso IMIV en el SEIM', reqFor: ['obra_nueva', 'ampliacion'] },
  { id: 'd7', name: 'Certificado de avalúo fiscal vigente (detallado)', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion'] },
  { id: 'd8', name: 'Planos de Arquitectura (Plantas, Cortes, Elevaciones)', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd9', name: 'Presupuesto informativo de las obras', reqFor: ['alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd10', name: 'Informe con estudio y medidas por calidad del suelo', reqFor: ['alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd11', name: 'Levantamiento Topográfico', reqFor: ['obra_nueva', 'ampliacion'] },
  { id: 'd12', name: 'Plano comparativo de sombras', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd13', name: 'Memoria de accesibilidad', reqFor: ['obra_nueva', 'ampliacion'] },
  { id: 'd14', name: 'Proyecto de Cálculo Estructural (Memoria y Planos)', reqFor: ['obra_nueva', 'ampliacion', 'alteracion', 'reconstruccion', 'reparacion'] },
  { id: 'd15', name: 'Certificado inscripción Revisor Independiente', reqFor: [] },
  { id: 'd16', name: 'Carpeta de Ascensores e Instalaciones similares', reqFor: [] },
  { id: 'd17', name: 'Autorización Consejo de Monumentos Nacionales', reqFor: ['alteracion', 'reconstruccion', 'reparacion'] },
];

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-listado-dom-${pid}`;

/* ── helpers puros ─────────────────────────────────────────────────────────── */
function obligatoriosDe(tipo: string): string[] {
  return MASTER_DOCUMENTS.filter((d) => d.reqFor.includes(tipo)).map((d) => d.id);
}
function nuevoId(): string {
  return `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/* ── fila de documento (check) ─────────────────────────────────────────────── */
interface FilaProps { name: string; checked: boolean; readOnly: boolean; onToggle: () => void; }
function FilaDoc({ name, checked, readOnly, onToggle }: FilaProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 8px', cursor: readOnly ? 'default' : 'pointer', border: '1px solid var(--border)', background: checked ? 'var(--muted)' : 'var(--card)' }}>
      <span style={{ position: 'relative', width: 18, height: 18, flexShrink: 0, border: '1.5px solid var(--border)', background: 'var(--card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <input type="checkbox" checked={checked} disabled={readOnly} onChange={onToggle} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: readOnly ? 'default' : 'pointer', margin: 0 }} />
        {checked && <Check size={13} strokeWidth={3} style={{ color: 'var(--destructive)' }} />}
      </span>
      <span style={{ fontSize: 12, fontWeight: checked ? 700 : 500, opacity: checked ? 1 : 0.75 }}>{name}</span>
    </label>
  );
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function ListadoDocumentosView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [saving, setSaving] = useState(false);
  const [projectType, setProjectType] = useState<string>('obra_nueva');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(obligatoriosDe('obra_nueva')));
  const [customDocs, setCustomDocs] = useState<DocCustom[]>([]);
  const [newCustomDoc, setNewCustomDoc] = useState('');
  const [hidratado, setHidratado] = useState(false);

  /* ── carga inicial desde localStorage ── */
  useEffect(() => {
    if (!project) return;
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        const s = JSON.parse(raw) as Partial<ListadoGuardado>;
        if (s.projectType) setProjectType(s.projectType);
        if (Array.isArray(s.selected)) setSelected(new Set(s.selected));
        if (Array.isArray(s.customDocs)) setCustomDocs(s.customDocs);
      } catch { /* datos corruptos — ignorar */ }
    }
    setHidratado(true);
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── al cambiar el tipo de expediente, pre-seleccionar obligatorios ── */
  useEffect(() => {
    if (!hidratado) return; // evita pisar la selección recién cargada
    setSelected(new Set(obligatoriosDe(projectType)));
  }, [projectType, hidratado]);

  if (!project) return (
    <div className="ab-tool-root">
      <p className="tech-quote">Selecciona un proyecto para armar el listado de documentos.</p>
    </div>
  );

  /* ── interacción ── */
  const toggleDoc = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const addCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newCustomDoc.trim()) return;
    const doc: DocCustom = { id: nuevoId(), name: newCustomDoc.trim() };
    setCustomDocs((prev) => [...prev, doc]);
    setSelected((prev) => new Set(prev).add(doc.id));
    setNewCustomDoc('');
  };

  const removeCustomDoc = (id: string) => {
    setCustomDocs((prev) => prev.filter((d) => d.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /* ── guardado ── */
  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload: ListadoGuardado = { projectType, selected: Array.from(selected), customDocs };
      localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(payload));
      triggerToast('Listado de documentos guardado.');
    } catch {
      triggerToast('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const obligatorios = MASTER_DOCUMENTS.filter((d) => d.reqFor.includes(projectType));
  const adicionales = MASTER_DOCUMENTS.filter((d) => !d.reqFor.includes(projectType));

  // Datos para la lámina de preview (solo lectura).
  const tipoLabel = PROJECT_TYPES.find((t) => t.id === projectType)?.label ?? projectType;
  const docsSeleccionados: string[] = [
    ...MASTER_DOCUMENTS.filter((d) => selected.has(d.id)).map((d) => d.name),
    ...customDocs.filter((d) => selected.has(d.id)).map((d) => d.name),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <h1 style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
          <FileText size={22} strokeWidth={1.4} /> Listado de Documentos
        </h1>
        <button type="button" onClick={handleSave} disabled={saving || readOnly} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? '⎔' : <Save size={14} />} [ GUARDAR LISTADO ]
        </button>
      </div>
      <p className="tech-quote" style={{ marginBottom: 16 }}>
        Proyecto: <strong>{project.name}</strong> · {String(project.etapa)} · Configura los documentos del ingreso municipal.
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      {/* SELECTOR DE TIPO + CONTADOR */}
      <div className="tool-panel" style={{ marginBottom: 16 }}>
        <div className="module-header" style={{ justifyContent: 'space-between' }}>
          <span>| TIPO DE EXPEDIENTE</span>
          <span className="ab-badge">{selected.size} SELECCIONADOS</span>
        </div>
        <div className="panel-content">
          <div className="tech-input-group" style={{ marginBottom: 12, maxWidth: 360 }}>
            <label>Trámite</label>
            <select className="tech-select" value={projectType} disabled={readOnly} onChange={(e) => setProjectType(e.target.value)}>
              {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, opacity: 0.75, border: '1px dashed var(--border)', background: 'var(--muted)', padding: '8px 10px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Al cambiar el tipo de expediente se autoseleccionan los documentos sugeridos por la OGUC para ese trámite.</span>
          </div>
        </div>
      </div>

      {/* DOCUMENTACIÓN */}
      <div className="tool-panel">
        <div className="module-header">| DOCUMENTACIÓN DEL EXPEDIENTE</div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* OBLIGATORIOS */}
          <section>
            <h2 className="ab-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 10px' }}>
              <AlertCircle size={15} style={{ color: 'var(--destructive)' }} /> Documentos Sugeridos / Obligatorios
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
              {obligatorios.map((doc) => (
                <FilaDoc key={doc.id} name={doc.name} checked={selected.has(doc.id)} readOnly={readOnly} onToggle={() => toggleDoc(doc.id)} />
              ))}
            </div>
          </section>

          {/* ADICIONALES */}
          {adicionales.length > 0 && (
            <section>
              <h2 className="ab-section-title" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 10px', paddingTop: 14, borderTop: '1.5px solid var(--border)' }}>
                Documentos Adicionales
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                {adicionales.map((doc) => (
                  <FilaDoc key={doc.id} name={doc.name} checked={selected.has(doc.id)} readOnly={readOnly} onToggle={() => toggleDoc(doc.id)} />
                ))}
              </div>
            </section>
          )}

          {/* PERSONALIZADOS */}
          <section style={{ border: '1.5px solid var(--border)', background: 'var(--muted)', padding: 14 }}>
            <h2 className="ab-section-title" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 10px' }}>
              Agregar Documento Personalizado
            </h2>
            <form onSubmit={addCustomDoc} style={{ display: 'flex', gap: 8, marginBottom: customDocs.length ? 12 : 0, flexWrap: 'wrap' }}>
              <input type="text" className="tech-input" value={newCustomDoc} disabled={readOnly} placeholder="Ej: Carta poder legalizada…" onChange={(e) => setNewCustomDoc(e.target.value)} style={{ flex: '1 1 240px' }} />
              <button type="submit" disabled={readOnly || !newCustomDoc.trim()} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <Plus size={13} /> [ AGREGAR ]
              </button>
            </form>
            {customDocs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customDocs.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: '1px solid var(--border)', background: 'var(--card)', padding: '4px 8px' }}>
                    <div style={{ flex: 1 }}>
                      <FilaDoc name={doc.name} checked={selected.has(doc.id)} readOnly={readOnly} onToggle={() => toggleDoc(doc.id)} />
                    </div>
                    <button type="button" onClick={() => removeCustomDoc(doc.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 6px' }} title="Eliminar documento">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><FileText size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Listado de Documentos" documentId="T-25" projectId={projectId}>
          <div style={pvWrap}>
            <h3 style={pvH3}>Listado de Documentos · {tipoLabel}</h3>
            {docsSeleccionados.length === 0 ? (
              <p style={{ color: '#666' }}>No hay documentos seleccionados.</p>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7 }}>
                {docsSeleccionados.map((nombre, i) => <li key={i}>{nombre}</li>)}
              </ol>
            )}
            <p style={{ fontSize: 10, color: '#666', marginTop: 12, borderTop: '1px solid #d8d8d8', paddingTop: 8 }}>
              Total: {docsSeleccionados.length} documento(s) que compondrán el expediente.
            </p>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
