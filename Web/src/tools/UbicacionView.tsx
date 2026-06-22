/* =============================================================================
   UbicacionView.tsx — UBICACIÓN DEL PROYECTO (T-04b)
   -----------------------------------------------------------------------------
   Ubicación administrativa básica: región, comuna, dirección y rol SII. La
   dirección, comuna y rol se sincronizan con el ProjectMaster (repo.save); la
   región se archiva en localStorage bajo ab-ubicacion-${projectId}. Se complementa
   con el Geolocalizador Normativo (T-07).
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { getRegionesSorted, getComunasPorRegionSorted } from '../core/data-chile';
import type { ToolProps, ProjectMaster } from '../core/types';

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-ubicacion-${pid}`;
const REGIONES = getRegionesSorted();

/* ── componente principal ──────────────────────────────────────────────────── */
export default function UbicacionView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, reload } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rol, setRol] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── carga inicial ── */
  useEffect(() => {
    if (!project) return;
    setComuna(project.comuna || '');
    setDireccion(project.direccion || '');
    setRol(project.rol || '');
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try { setRegion((JSON.parse(raw) as { region?: string }).region ?? ''); }
      catch { /* datos corruptos — ignorar */ }
    } else {
      setRegion('');
    }
  }, [project?.id]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para definir su ubicación.</p></div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify({ region }));
      const updated: ProjectMaster = { ...project, comuna, direccion, rol };
      await repo.save(updated);
      await reload();
      triggerToast('Ubicación guardada correctamente.');
    } catch {
      triggerToast('Error al guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Navigation size={22} strokeWidth={1.4} /> Ubicación del Proyecto
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Ubicación administrativa básica (se complementa con el Geolocalizador).
      </p>

      <form onSubmit={handleSave} className="tool-panel">
        <div className="module-header">| LOCALIZACIÓN ADMINISTRATIVA</div>
        <div className="panel-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
            <div className="tech-input-group">
              <label>Región</label>
              <select className="tech-select" value={region} disabled={readOnly} onChange={e => { setRegion(e.target.value); setComuna(''); }}>
                <option value="">Seleccione...</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Comuna</label>
              <input className="tech-input" value={comuna} disabled={readOnly} onChange={e => setComuna(e.target.value)} placeholder="Ej: Providencia" list="ab-comunas-datalist" />
              <datalist id="ab-comunas-datalist">{region && getComunasPorRegionSorted(region).map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="tech-input-group"><label>Dirección</label><input className="tech-input" value={direccion} disabled={readOnly} onChange={e => setDireccion(e.target.value)} placeholder="Calle y número" /></div>
            <div className="tech-input-group"><label>Rol SII</label><input className="tech-input" value={rol} disabled={readOnly} onChange={e => setRol(e.target.value)} placeholder="Ej: 1234-56" /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, padding: 10, background: 'var(--muted)', border: '2px solid var(--border)', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 'bold' }}>El polígono y la superficie del terreno se obtienen con el Geolocalizador Normativo.</span>
          </div>

          <button type="submit" disabled={saving || readOnly} className="technical-btn" style={{ marginTop: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {saving ? '⎔' : <Icons.Save size={14} />} [ GUARDAR SECCIÓN ]
          </button>
        </div>
      </form>
    </motion.div>
  );
}
