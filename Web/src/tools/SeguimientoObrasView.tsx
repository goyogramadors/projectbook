/* =============================================================================
   SeguimientoObrasView.tsx — SEGUIMIENTO DE OBRAS (T-43)
   -----------------------------------------------------------------------------
   Avance porcentual, fase constructiva y bitácora de obra (Normal / Retraso /
   Crítico). Persistencia dual (CONST §7/§10):
     · Premium → subcolección Firestore: projects/{id}/seguimiento/estado (avance
       y fase) + projects/{id}/bitacora/{entradaId} (una entrada por documento).
     · Free / invitado → localStorage ab-seguimiento-${projectId}.
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
type EstadoBitacora = 'Normal' | 'Retraso' | 'Crítico';
interface EntradaBitacora { id: string; fecha: string; estado: EstadoBitacora; nota: string; createdAt: number; }
interface SeguimientoData { avance: number; etapaObra: string; bitacora: EntradaBitacora[]; }

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-seguimiento-${pid}`;
const FASES = ['Excavación', 'Fundaciones', 'Obra Gruesa', 'Terminaciones', 'Recepción'];
const ESTADOS: EstadoBitacora[] = ['Normal', 'Retraso', 'Crítico'];
const COLOR_ESTADO: Record<EstadoBitacora, string> = { Normal: 'var(--foreground)', Retraso: 'var(--primary)', Crítico: 'var(--destructive)' };
const estadoDoc = (pid: string) => doc(db, 'projects', pid, 'seguimiento', 'estado');
const bitacoraCol = (pid: string) => collection(db, 'projects', pid, 'bitacora');

/* ── componente principal ──────────────────────────────────────────────────── */
export default function SeguimientoObrasView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { user } = useAuth();
  const { triggerToast } = useToast();
  const project = getProject(projectId);
  const isPremium = user?.plan === 'Premium';

  const [avance, setAvance] = useState(0);
  const [etapaObra, setEtapaObra] = useState('Excavación');
  const [bitacora, setBitacora] = useState<EntradaBitacora[]>([]);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoBitacora>('Normal');
  const [nuevaNota, setNuevaNota] = useState('');

  /* ── carga inicial: Firestore (Premium) o localStorage (Free) ── */
  useEffect(() => {
    if (!project) return;
    let alive = true;
    (async () => {
      if (isPremium) {
        try {
          const [estadoSnap, bitSnap] = await Promise.all([
            getDoc(estadoDoc(project.id)),
            getDocs(query(bitacoraCol(project.id), orderBy('createdAt', 'desc'))),
          ]);
          if (!alive) return;
          if (estadoSnap.exists()) {
            const d = estadoSnap.data() as { avance?: number; etapaObra?: string };
            setAvance(d.avance ?? 0); setEtapaObra(d.etapaObra ?? 'Excavación');
          } else { setAvance(0); setEtapaObra('Excavación'); }
          setBitacora(bitSnap.docs.map(x => x.data() as EntradaBitacora));
          return;
        } catch {
          /* offline / reglas: degrada a localStorage sin romper la vista */
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY(project.id));
      if (!alive) return;
      if (raw) {
        try { const d = JSON.parse(raw) as SeguimientoData; setAvance(d.avance ?? 0); setEtapaObra(d.etapaObra ?? 'Excavación'); setBitacora(d.bitacora ?? []); }
        catch { /* datos corruptos — ignorar */ }
      } else { setAvance(0); setEtapaObra('Excavación'); setBitacora([]); }
    })();
    return () => { alive = false; };
  }, [project?.id, isPremium]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para registrar el avance de obra.</p></div>
  );

  const persistLocal = (data: SeguimientoData) => localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(data));

  const handleSaveAvance = async () => {
    if (readOnly) return;
    try {
      if (isPremium) await setDoc(estadoDoc(project.id), { avance, etapaObra }, { merge: true });
      else persistLocal({ avance, etapaObra, bitacora });
      triggerToast(`Avance de obra actualizado al ${avance}%.`);
    } catch { triggerToast('Error al actualizar el avance.'); }
  };

  const handleAddBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !nuevaNota.trim()) return;
    const entrada: EntradaBitacora = {
      id: `bit-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-CL'),
      estado: nuevoEstado,
      nota: nuevaNota.trim(),
      createdAt: Date.now(),
    };
    const next = [entrada, ...bitacora];
    setBitacora(next); setNuevaNota('');
    try {
      if (isPremium) await setDoc(doc(bitacoraCol(project.id), entrada.id), entrada);
      else persistLocal({ avance, etapaObra, bitacora: next });
      triggerToast('Entrada de bitácora registrada.');
    } catch { triggerToast('Error al registrar la entrada.'); }
  };

  const handleRemoveBitacora = async (id: string) => {
    if (readOnly) return;
    const next = bitacora.filter(b => b.id !== id);
    setBitacora(next);
    try {
      if (isPremium) await deleteDoc(doc(bitacoraCol(project.id), id));
      else persistLocal({ avance, etapaObra, bitacora: next });
    } catch { triggerToast('Error al eliminar la entrada.'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.HardHat size={22} strokeWidth={1.4} /> Minuta de Visita a Obra
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Registro de visitas: avance, fase constructiva y bitácora de obra.
        <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 10 }}>[{isPremium ? 'NUBE' : 'LOCAL'}]</span>
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* PANEL AVANCE */}
        <div style={{ flex: '1 1 320px' }}>
          <div className="tool-panel">
            <div className="module-header">| AVANCE Y FASE CONSTRUCTIVA</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Avance de Obra: <span style={{ color: 'var(--destructive)', fontWeight: 'bold' }}>{avance}%</span></label>
                <input type="range" min="0" max="100" value={avance} disabled={readOnly} onChange={e => setAvance(Number(e.target.value))} style={{ width: '100%', marginTop: 10 }} />
                <div style={{ height: 14, background: 'var(--muted)', border: '1.5px solid var(--border)', marginTop: 8 }}>
                  <div style={{ height: '100%', width: `${avance}%`, background: 'var(--destructive)' }} />
                </div>
              </div>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Fase Constructiva Actual</label>
                <select className="tech-select" value={etapaObra} disabled={readOnly} onChange={e => setEtapaObra(e.target.value)}>
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleSaveAvance} disabled={readOnly} className="technical-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icons.Save size={14} /> [ ACTUALIZAR AVANCE ]
              </button>
            </div>
          </div>
        </div>

        {/* PANEL BITÁCORA */}
        <div style={{ flex: '2 1 420px' }}>
          <div className="tool-panel">
            <div className="module-header">| BITÁCORA DE OBRA ({bitacora.length})</div>
            <div className="panel-content">
              <form onSubmit={handleAddBitacora} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="tech-input-group" style={{ marginBottom: 0, width: 140 }}>
                  <label>Estado</label>
                  <select className="tech-select" value={nuevoEstado} disabled={readOnly} onChange={e => setNuevoEstado(e.target.value as EstadoBitacora)}>
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
                  <label>Nota de avance</label>
                  <input type="text" className="tech-input" value={nuevaNota} disabled={readOnly} onChange={e => setNuevaNota(e.target.value)} placeholder="Ej: Hormigonado de losa nivel 2" />
                </div>
                <button type="submit" disabled={readOnly || !nuevaNota.trim()} className="technical-btn">[ + REGISTRAR ]</button>
              </form>

              {bitacora.length === 0 ? (
                <div style={{ opacity: 0.5, textAlign: 'center', padding: 20, fontWeight: 'bold', fontSize: 11 }}>SIN ENTRADAS DE BITÁCORA</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bitacora.map(b => (
                    <div key={b.id} style={{ border: '1.5px solid var(--border)', borderLeft: `4px solid ${COLOR_ESTADO[b.estado]}`, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}>
                          <span style={{ color: COLOR_ESTADO[b.estado], fontWeight: 'bold' }}>{b.estado.toUpperCase()}</span>
                          <span>{b.fecha}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{b.nota}</div>
                      </div>
                      <button type="button" onClick={() => handleRemoveBitacora(b.id)} disabled={readOnly} className="btn-tech-gray" style={{ padding: '2px 6px', fontSize: 10 }}>[X]</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.HardHat size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Minuta de Visita a Obra" documentId="T-43" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Minuta de Visita a Obra</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a', marginBottom: 12 }}><tbody>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700, width: '50%' }}>Avance de Obra</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{avance}%</td></tr>
              <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Fase Constructiva</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{etapaObra}</td></tr>
            </tbody></table>
            <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase' }}>Bitácora ({bitacora.length})</h3>
            {bitacora.length === 0 ? (
              <p style={{ color: '#666', fontSize: 12 }}>Sin entradas registradas.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: '#1a1a1a' }}><tbody>
                {bitacora.map((b) => (
                  <tr key={b.id}>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #d8d8d8', whiteSpace: 'nowrap', fontWeight: 700 }}>{b.fecha}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #d8d8d8', whiteSpace: 'nowrap' }}>{b.estado}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #d8d8d8' }}>{b.nota}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
