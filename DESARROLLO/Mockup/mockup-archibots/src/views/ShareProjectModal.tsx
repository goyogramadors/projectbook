/* ShareProjectModal — colaboración estilo Google Drive por proyecto.
   Invitar por correo + lista de "Personas con acceso" (Editor / Lector).
   Clases shadcn → temable. Datos MOCK. */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

export interface Collaborator { id: string; email: string; rol: 'Editor' | 'Lector'; }

const initials = (email: string) => email.replace(/@.*/, '').slice(0, 2).toUpperCase();

export default function ShareProjectModal({
  project, collaborators, setCollaborators, onClose,
}: {
  project: any;
  collaborators: Collaborator[];
  setCollaborators: (c: Collaborator[]) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'Editor' | 'Lector'>('Editor');

  const invite = () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) return;
    if (collaborators.some((c) => c.email === e)) return;
    setCollaborators([...collaborators, { id: `c-${Date.now()}`, email: e, rol }]);
    setEmail('');
  };
  const setRolOf = (id: string, r: 'Editor' | 'Lector') => setCollaborators(collaborators.map((c) => (c.id === id ? { ...c, rol: r } : c)));
  const remove = (id: string) => setCollaborators(collaborators.filter((c) => c.id !== id));

  return (
    <AnimatePresence>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
          className="bg-card text-card-foreground border-theme shadow-hard" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="bg-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
              <Icons.UserPlus size={16} /> Compartir «{project?.name || 'Proyecto'}»
            </div>
            <button className="ab-btn sec sm" onClick={onClose} title="Cerrar"><Icons.X size={14} /></button>
          </div>

          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Invitar por correo */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: 6 }}>Invitar a personas</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="tech-input" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} placeholder="correo@ejemplo.cl" style={{ flex: 1 }} />
                <select className="tech-select" value={rol} onChange={(e) => setRol(e.target.value as any)} style={{ width: 110 }}>
                  <option value="Editor">Editor</option>
                  <option value="Lector">Lector</option>
                </select>
                <button className="ab-btn" onClick={invite} style={{ padding: '0 14px' }}>Invitar</button>
              </div>
            </div>

            {/* Personas con acceso */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: 8 }}>Personas con acceso</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Propietario */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="bg-primary text-primary-foreground" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>AR</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>arquitecto@estudio.cl</div>
                    <div className="text-muted-foreground" style={{ fontSize: 10 }}>Tú</div>
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Propietario</span>
                </div>

                {/* Colaboradores */}
                {collaborators.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="bg-muted border-theme" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(c.email)}</div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                    <select className="tech-select" value={c.rol} onChange={(e) => setRolOf(c.id, e.target.value as any)} style={{ width: 95, padding: '4px 8px', fontSize: 11 }}>
                      <option value="Editor">Editor</option>
                      <option value="Lector">Lector</option>
                    </select>
                    <button className="ab-btn sec sm" onClick={() => remove(c.id)} title="Quitar acceso"><Icons.X size={12} /></button>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <div className="text-muted-foreground" style={{ fontSize: 11, textAlign: 'center', padding: '8px 0' }}>Aún no has invitado a nadie.</div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '14px 18px', borderTop: 'var(--border-thickness) solid var(--border)' }}>
            <button className="ab-btn sec sm" onClick={() => { /* demo */ }}><Icons.Link size={12} /> Copiar enlace</button>
            <button className="ab-btn" onClick={onClose}><Icons.Check size={13} /> Listo</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
