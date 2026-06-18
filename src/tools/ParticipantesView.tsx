/* =============================================================================
   ParticipantesView.tsx — PARTICIPANTES DEL PROYECTO (T-03)
   -----------------------------------------------------------------------------
   Nómina de actores del proyecto. Por defecto aparecen el ARQUITECTO y el
   PROPIETARIO (roles fijos) con campos Nombre + RUT y un botón [+] para sumar
   Dirección. El usuario puede agregar otros roles (Director de Obra, Ingeniero
   Calculista, Constructor, Revisor, etc.) o un rol libre (CONST §1 · UX Mockup).

   El PROPIETARIO se sincroniza con el ProjectMaster (repo.save → project.propietario).
   La nómina completa se persiste de forma dual (CONST §7/§10):
     · Premium → subcolección Firestore projects/{projectId}/participantes/ficha
     · Free / invitado → localStorage ab-participantes-${projectId}
   Migra de forma transparente el esquema antiguo (rutPropietario, arquitecto…).
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps, ProjectMaster } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface Participante {
  id: string;
  rol: string;
  nombre: string;
  rut: string;
  direccion: string;
  conDireccion: boolean;
  fijo?: boolean; // Arquitecto / Propietario: no eliminables
}

/* esquema antiguo (para migración transparente) */
interface ActoresLegacy {
  rutPropietario?: string;
  arquitecto?: string;
  rutArquitecto?: string;
  oficina?: string;
  dom?: string;
}

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-participantes-${pid}`;
const fichaDoc = (pid: string) => doc(db, 'projects', pid, 'participantes', 'ficha');

const ROLES_DISPONIBLES = [
  'Director de Obra (DOM)', 'Ingeniero Calculista', 'Constructor',
  'Revisor Independiente', 'Ing. Mecánico', 'Paisajista', 'Rol libre…',
];

/** Construye la nómina por defecto (Arquitecto + Propietario fijos). */
function defaultParticipantes(project: ProjectMaster | null): Participante[] {
  return [
    { id: 'arquitecto', rol: 'Arquitecto', nombre: '', rut: '', direccion: '', conDireccion: false, fijo: true },
    { id: 'propietario', rol: 'Propietario', nombre: project?.propietario || '', rut: '', direccion: '', conDireccion: false, fijo: true },
  ];
}

/** Mezcla la nómina por defecto con datos guardados (nuevos o legacy). */
function hidratar(project: ProjectMaster | null, stored: unknown): Participante[] {
  const base = defaultParticipantes(project);
  if (!stored || typeof stored !== 'object') return base;

  // Esquema NUEVO: { participantes: Participante[] }
  const data = stored as { participantes?: Participante[] } & ActoresLegacy;
  if (Array.isArray(data.participantes) && data.participantes.length) {
    const fijos = data.participantes.filter(p => p.id === 'arquitecto' || p.id === 'propietario');
    const otros = data.participantes.filter(p => p.id !== 'arquitecto' && p.id !== 'propietario');
    // Garantiza la presencia de los dos roles fijos.
    const merged = base.map(b => {
      const found = fijos.find(f => f.id === b.id);
      return found ? { ...b, ...found, fijo: true } : b;
    });
    return [...merged, ...otros.map(o => ({ ...o, fijo: false }))];
  }

  // Esquema LEGACY: { rutPropietario, arquitecto, rutArquitecto, oficina, dom }
  const out = base.map(b => {
    if (b.id === 'arquitecto') return { ...b, nombre: data.arquitecto || '', rut: data.rutArquitecto || '' };
    if (b.id === 'propietario') return { ...b, rut: data.rutPropietario || '' };
    return b;
  });
  const extras: Participante[] = [];
  if (data.oficina) extras.push({ id: `legacy-of-${Date.now()}`, rol: 'Oficina / Constructora', nombre: data.oficina, rut: '', direccion: '', conDireccion: false });
  if (data.dom) extras.push({ id: `legacy-dom-${Date.now() + 1}`, rol: 'Director de Obra (DOM)', nombre: data.dom, rut: '', direccion: '', conDireccion: false });
  return [...out, ...extras];
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function ParticipantesView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, reload } = useProjects();
  const { user } = useAuth();
  const { triggerToast } = useToast();
  const project = getProject(projectId);
  const isPremium = user?.plan === 'Premium';

  const [parts, setParts] = useState<Participante[]>(() => defaultParticipantes(project));
  const [saving, setSaving] = useState(false);

  // formulario "agregar participante"
  const [rolNuevo, setRolNuevo] = useState(ROLES_DISPONIBLES[0] ?? '');
  const [rolLibre, setRolLibre] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [rutNuevo, setRutNuevo] = useState('');

  /* ── carga inicial: Firestore (Premium) o localStorage (Free) ── */
  useEffect(() => {
    if (!project) return;
    let alive = true;
    (async () => {
      if (isPremium) {
        try {
          const snap = await getDoc(fichaDoc(project.id));
          if (alive && snap.exists()) { setParts(hidratar(project, snap.data())); return; }
        } catch {
          /* offline / reglas: degrada a localStorage sin romper la vista */
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY(project.id));
      if (alive && raw) {
        try { setParts(hidratar(project, JSON.parse(raw))); return; }
        catch { /* datos corruptos — ignorar */ }
      }
      if (alive) setParts(defaultParticipantes(project));
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isPremium]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para registrar sus participantes.</p></div>
  );

  /* ── mutadores ── */
  const updatePart = (id: string, patch: Partial<Participante>) =>
    setParts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toggleDireccion = (id: string) =>
    setParts(prev => prev.map(p => (p.id === id ? { ...p, conDireccion: !p.conDireccion } : p)));

  const removePart = (id: string) =>
    setParts(prev => prev.filter(p => p.id !== id || p.fijo));

  const addPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !nombreNuevo.trim()) return;
    const rol = rolNuevo === 'Rol libre…' ? (rolLibre.trim() || 'Colaborador') : rolNuevo;
    setParts(prev => [...prev, {
      id: `p-${Date.now()}`, rol, nombre: nombreNuevo.trim(), rut: rutNuevo.trim(),
      direccion: '', conDireccion: false,
    }]);
    setNombreNuevo(''); setRutNuevo(''); setRolLibre('');
  };

  /* ── persistencia ── */
  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      const payload = { participantes: parts };
      if (isPremium) {
        await setDoc(fichaDoc(project.id), payload, { merge: true });
      } else {
        localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(payload));
      }
      // Sincroniza el nombre del Propietario con el ProjectMaster (Ficha / Datos Clave).
      const prop = parts.find(p => p.id === 'propietario');
      const updated: ProjectMaster = { ...project, propietario: prop?.nombre || project.propietario };
      await repo.save(updated);
      await reload();
      triggerToast(isPremium ? 'Participantes guardados en la nube.' : 'Participantes guardados localmente.');
    } catch {
      triggerToast('Error al guardar los participantes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Users size={22} strokeWidth={1.4} /> Participantes del Proyecto
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Por defecto el <strong>Arquitecto</strong> y el <strong>Propietario</strong>.
        Use [+] para sumar dirección y el panel lateral para agregar DOM, calculista, constructor o un rol libre (nombre + RUT).
        <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 10 }}>[{isPremium ? 'NUBE' : 'LOCAL'}]</span>
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* NÓMINA ── */}
        <div className="tool-panel">
          <div className="module-header">| NÓMINA DE PARTICIPANTES ({parts.length})</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {parts.map(p => (
              <div key={p.id} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icons.UserCircle size={15} /> {p.rol}
                    {p.fijo && <span style={{ color: 'var(--destructive)', fontSize: 9 }} title="Rol obligatorio">★</span>}
                  </span>
                  {!p.fijo && (
                    <button type="button" onClick={() => removePart(p.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 7px', fontSize: 10 }} title="Quitar participante">
                      <Icons.Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label>Nombre / Razón Social</label>
                    <input className="tech-input" value={p.nombre} disabled={readOnly} onChange={e => updatePart(p.id, { nombre: e.target.value })} />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label>RUT</label>
                    <input className="tech-input" value={p.rut} disabled={readOnly} onChange={e => updatePart(p.id, { rut: e.target.value })} style={{ fontFamily: 'monospace' }} placeholder="11.111.111-1" />
                  </div>
                </div>
                {p.conDireccion ? (
                  <div className="tech-input-group" style={{ marginBottom: 0, marginTop: 10 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Dirección</span>
                      <button type="button" onClick={() => toggleDireccion(p.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '1px 6px', fontSize: 9 }}>[ – ]</button>
                    </label>
                    <input className="tech-input" value={p.direccion} disabled={readOnly} onChange={e => updatePart(p.id, { direccion: e.target.value })} placeholder="Calle N°, comuna" />
                  </div>
                ) : (
                  <button type="button" onClick={() => toggleDireccion(p.id)} disabled={readOnly} className="btn-tech-gray" style={{ marginTop: 10, padding: '4px 9px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icons.Plus size={12} /> Agregar dirección
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleSave} disabled={saving || readOnly} className="technical-btn" style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
              {saving ? '⎔' : <Icons.Save size={14} />} [ GUARDAR SECCIÓN ]
            </button>
          </div>
        </div>

        {/* AGREGAR PARTICIPANTE ── */}
        <form className="tool-panel" onSubmit={addPart}>
          <div className="module-header">| AGREGAR PARTICIPANTE [+]</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>Rol</label>
              <select className="tech-select" value={rolNuevo} disabled={readOnly} onChange={e => setRolNuevo(e.target.value)}>
                {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {rolNuevo === 'Rol libre…' && (
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Nombre del Rol</label>
                <input className="tech-input" value={rolLibre} disabled={readOnly} onChange={e => setRolLibre(e.target.value)} placeholder="Ej: Asesor Acústico" />
              </div>
            )}
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>Nombre / Razón Social</label>
              <input className="tech-input" value={nombreNuevo} disabled={readOnly} onChange={e => setNombreNuevo(e.target.value)} required />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>RUT</label>
              <input className="tech-input" value={rutNuevo} disabled={readOnly} onChange={e => setRutNuevo(e.target.value)} style={{ fontFamily: 'monospace' }} placeholder="11.111.111-1" />
            </div>
            <button type="submit" disabled={readOnly} className="technical-btn" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icons.UserPlus size={14} /> [ AGREGAR AL PROYECTO ]
            </button>
            <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>
              Recuerda pulsar <strong>[ GUARDAR SECCIÓN ]</strong> para persistir la nómina.
            </p>
          </div>
        </form>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.Users size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Participantes del Proyecto" documentId="T-03" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Nómina de Participantes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a' }}>
              <thead><tr>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Rol</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Nombre / Razón Social</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>RUT</th>
              </tr></thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>{p.rol}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{p.nombre || '—'}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{p.rut || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
