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
import { auth } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
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
  /** Datos opcionales adicionales (ocultos tras "Agregar más datos"). */
  email?: string;
  fono?: string;
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
const TOOL_ID = 'participantes';
interface ParticipantesGuardado { participantes: Participante[]; }
const PART_VACIO: ParticipantesGuardado = { participantes: [] };

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

/** Elimina recursivamente claves con valor `undefined` (Firestore las rechaza salvo
 *  ignoreUndefinedProperties). Deja el payload uniforme para nube y local. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
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
  // IDs con el bloque "más datos" abierto (estado de UI, no se persiste).
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set());
  const [hidratado, setHidratado] = useState(false);
  // Persistencia unificada (Fase 2): la nómina se guarda vía useToolData en la
  // subcolección gobernada projects/{id}/toolData/participantes (Premium) o en
  // localStorage (Free). Elimina la escritura directa a participantes/ficha.
  const { data, save, loading } = useToolData<ParticipantesGuardado>(TOOL_ID, projectId, PART_VACIO);

  // formulario "agregar participante"
  const [rolNuevo, setRolNuevo] = useState(ROLES_DISPONIBLES[0] ?? '');
  const [rolLibre, setRolLibre] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [rutNuevo, setRutNuevo] = useState('');

  /* ── carga inicial (una sola vez) desde useToolData; migra esquema legacy vía hidratar ── */
  useEffect(() => {
    if (loading || hidratado || !project) return;
    setParts(hidratar(project, data));
    setHidratado(true);
  }, [loading, hidratado, project, data]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para registrar sus participantes.</p></div>
  );

  /* ── mutadores ── */
  const updatePart = (id: string, patch: Partial<Participante>) =>
    setParts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toggleMas = (id: string) =>
    setExpandidos(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // Mostrar el bloque si está abierto o si ya hay algún dato adicional cargado.
  const tieneMas = (p: Participante) =>
    expandidos.has(p.id) || p.conDireccion || Boolean(p.direccion || p.email || p.fono);

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
      // Persistencia gobernada (Fase 2): misma acción que el hook → toolData/participantes
      // (Premium) o localStorage (Free). Elimina la escritura directa a participantes/ficha.
      const payload = stripUndefined({ participantes: parts });
      await save(payload);
      // Sincroniza el nombre del Propietario con el ProjectMaster (Ficha / Datos Clave).
      const prop = parts.find(p => p.id === 'propietario');
      const updated: ProjectMaster = { ...project, propietario: prop?.nombre || project.propietario };
      await repo.save(updated);
      await reload();
      triggerToast(isPremium ? 'Participantes guardados en la nube.' : 'Participantes guardados localmente.');
    } catch (err) {
      // Diagnóstico de permisos: ¿el dueño del proyecto coincide con el uid autenticado
      // VIVO? Si coincide y aún falla, las reglas desplegadas no están al día (deploy).
      console.error('Error al guardar los participantes:', err, {
        ruta: `projects/${project.id}/participantes/ficha`,
        authUid: auth.currentUser?.uid ?? null,
        projectOwnerId: project.ownerId ?? null,
        coincideOwner: (auth.currentUser?.uid ?? null) === (project.ownerId ?? null),
      });
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
                {tieneMas(p) ? (
                  <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                    <div className="tech-input-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Dirección</span>
                        <button type="button" onClick={() => toggleMas(p.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '1px 6px', fontSize: 9 }}>[ – ]</button>
                      </label>
                      <input className="tech-input" value={p.direccion} disabled={readOnly} onChange={e => updatePart(p.id, { direccion: e.target.value })} placeholder="Calle N°, comuna" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="tech-input-group" style={{ marginBottom: 0 }}>
                        <label>Correo electrónico</label>
                        <input className="tech-input" type="email" value={p.email ?? ''} disabled={readOnly} onChange={e => updatePart(p.id, { email: e.target.value })} placeholder="correo@dominio.cl" />
                      </div>
                      <div className="tech-input-group" style={{ marginBottom: 0 }}>
                        <label>Teléfono</label>
                        <input className="tech-input" value={p.fono ?? ''} disabled={readOnly} onChange={e => updatePart(p.id, { fono: e.target.value })} placeholder="+56 9 ..." />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => toggleMas(p.id)} disabled={readOnly} className="btn-tech-gray" style={{ marginTop: 10, padding: '4px 9px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icons.Plus size={12} /> Agregar más datos
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
