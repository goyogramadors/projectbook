/* =============================================================================
   VISTA T-61 — Compartir Proyecto (CONST §10)
   -----------------------------------------------------------------------------
   Conectada a ShareService: invitar por correo (Editor/Lector), generar/copiar
   enlace profundo y revocar accesos sobre projects/{id}.members. Los proyectos
   en la nube (Premium) admiten colaboración; los locales muestran el aviso de
   que requiere un proyecto sincronizado.
   ============================================================================= */
import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { useToast } from '../core/ui/ToastProvider';
import { listMembers, inviteByEmail, revokeAccess, generateShareLink } from '../core/ShareService';
import type { ProjectMaster, Collaborator, MemberRole } from '../core/types';

export default function ShareProjectModal({ project, onClose }: {
  project: ProjectMaster | null;
  onClose: () => void;
}) {
  const { triggerToast } = useToast();
  const [members, setMembers] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [busy, setBusy] = useState(false);

  const recargar = async () => {
    if (!project) return;
    try { setMembers(await listMembers(project.id)); }
    catch { /* reglas / local: sin colaboradores visibles */ }
  };

  useEffect(() => { recargar(); }, [project?.id]);

  if (!project) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await inviteByEmail(project.id, email, role);
      setEmail('');
      await recargar();
      triggerToast('Colaborador invitado correctamente.');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'No se pudo invitar (requiere proyecto en la nube).');
    } finally { setBusy(false); }
  };

  const handleCopyLink = async () => {
    const link = generateShareLink(project.id);
    try { await navigator.clipboard.writeText(link); triggerToast('Enlace copiado al portapapeles.'); }
    catch { triggerToast(link); }
  };

  const handleRevoke = async (uid: string) => {
    setBusy(true);
    try { await revokeAccess(project.id, uid); await recargar(); triggerToast('Acceso revocado.'); }
    catch { triggerToast('No se pudo revocar el acceso.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="ab-modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-card" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, width: 'min(480px, 92vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ textTransform: 'uppercase', fontSize: 13 }}><Icon name="UserPlus" size={15} /> Compartir {project.name}</strong>
          <button className="ab-btn sec sm" onClick={onClose}><Icon name="X" size={13} /></button>
        </div>

        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>Correo del colaborador</label>
            <input type="email" className="ab-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.cl" style={{ width: '100%' }} />
          </div>
          <select className="ab-select" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
            <option value="editor">Editor</option>
            <option value="viewer">Lector</option>
          </select>
          <button type="submit" className="ab-btn" disabled={busy || !email.trim()}><Icon name="Send" size={13} /> Invitar</button>
        </form>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>Colaboradores ({members.length})</div>
          {members.length === 0 ? (
            <div className="ab-empty" style={{ fontSize: 11 }}>Sin colaboradores. Invita por correo o comparte el enlace.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px' }}>
                  <span style={{ fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email} <span style={{ opacity: 0.6, fontSize: 10 }}>· {m.rol}</span></span>
                  <button className="ab-btn sec sm" disabled={busy} onClick={() => handleRevoke(m.id)} title="Revocar acceso"><Icon name="Trash2" size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="ab-btn" style={{ width: '100%' }} onClick={handleCopyLink}><Icon name="Link" size={13} /> Copiar enlace</button>
      </div>
    </div>
  );
}
