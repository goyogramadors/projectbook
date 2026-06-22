/* AdminDashboard — Panel de Súper-Administrador (UI role-based, demo).
   A) Gestión de usuarios (tabla técnica)  B) Configuración de Top Tools (ranking).
   Clases shadcn → temable. Datos MOCK. */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface AdminUser { nombre: string; email: string; plan: 'Premium' | 'Free'; proyectos: number; estado: 'Activo' | 'Suspendido'; }

const INITIAL_USERS: AdminUser[] = [
  { nombre: 'Goyo Gramador', email: 'arquitecto@estudio.cl', plan: 'Premium', proyectos: 5, estado: 'Activo' },
  { nombre: 'María Tagle', email: 'm.tagle@oficina.cl', plan: 'Premium', proyectos: 3, estado: 'Activo' },
  { nombre: 'Diego Soto', email: 'dsoto@arq.cl', plan: 'Free', proyectos: 1, estado: 'Activo' },
  { nombre: 'Constructora Aysén', email: 'contacto@aysen.cl', plan: 'Free', proyectos: 1, estado: 'Activo' },
  { nombre: 'Ignacia Rivas', email: 'i.rivas@taller.cl', plan: 'Premium', proyectos: 8, estado: 'Activo' },
  { nombre: 'Pedro Lagos', email: 'plagos@gmail.com', plan: 'Free', proyectos: 0, estado: 'Suspendido' },
];

export default function AdminDashboard({
  topToolIds, setTopToolIds, catalog, onClose,
}: {
  topToolIds: string[];
  setTopToolIds: (ids: string[]) => void;
  catalog: { id: string; label: string; icon: string; estado: string }[];
  onClose: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const togglePlan = (email: string) => setUsers((u) => u.map((x) => (x.email === email ? { ...x, plan: x.plan === 'Premium' ? 'Free' : 'Premium' } : x)));

  const activeTools = catalog.filter((t) => t.estado === 'active');
  const byId = (id: string) => catalog.find((t) => t.id === id);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= topToolIds.length) return;
    const next = [...topToolIds];
    [next[i], next[j]] = [next[j], next[i]];
    setTopToolIds(next);
  };
  const removeTop = (id: string) => setTopToolIds(topToolIds.filter((x) => x !== id));
  const addTop = (id: string) => { if (!topToolIds.includes(id)) setTopToolIds([...topToolIds, id]); };

  const Icon = ({ name, ...p }: any) => { const C = (Icons as any)[name] || Icons.Box; return <C strokeWidth={1.5} {...p} />; };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="bg-card border-theme shadow-hard">
      {/* Header */}
      <div className="bg-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}><Icons.ShieldCheck size={17} /> Panel de Administración</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="bg-destructive text-destructive-foreground" style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', padding: '3px 7px', letterSpacing: '0.05em' }}>role: admin</span>
          <button className="ab-btn sec sm" onClick={onClose}><Icons.X size={13} /> Salir</button>
        </span>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* A) GESTIÓN DE USUARIOS */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icons.Users size={15} /><h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>A · Gestión de Usuarios</h3>
            <span className="text-muted-foreground" style={{ fontSize: 11, marginLeft: 'auto' }}>{users.length} usuarios · {users.filter((u) => u.plan === 'Premium').length} Premium</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tech-table" style={{ minWidth: 640 }}>
              <thead><tr><th>Usuario</th><th>Correo</th><th style={{ textAlign: 'center' }}>Proyectos</th><th style={{ textAlign: 'center' }}>Plan</th><th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'center' }}>Acción</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td style={{ fontWeight: 700 }}>{u.nombre}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.email}</td>
                    <td style={{ textAlign: 'center' }}>{u.proyectos}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={u.plan === 'Premium' ? 'bg-primary text-primary-foreground' : 'bg-muted'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', border: 'var(--border-thickness) solid var(--border)' }}>
                        {u.plan === 'Premium' && <Icons.Crown size={9} />} {u.plan === 'Premium' ? 'Premium' : 'Gratis'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 10, fontWeight: 700 }}><span className={u.estado === 'Activo' ? 'text-primary' : 'text-destructive'}>● {u.estado}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="ab-btn sec sm" onClick={() => togglePlan(u.email)}>{u.plan === 'Premium' ? 'Bajar a Free' : 'Subir a Premium'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* B) CONFIGURACIÓN DE TOP TOOLS */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icons.Star size={15} /><h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>B · Configuración de Top Tools</h3>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 12 }}>Selecciona y ordena las herramientas ancladas en la barra de accesos rápidos de toda la plataforma.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Ancladas (orden) */}
            <div className="border-theme">
              <div className="bg-muted" style={{ padding: '9px 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', borderBottom: 'var(--border-thickness) solid var(--border)' }}>★ Ancladas ({topToolIds.length})</div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {topToolIds.length === 0 && <div className="text-muted-foreground" style={{ fontSize: 11, textAlign: 'center', padding: 8 }}>Sin herramientas ancladas</div>}
                {topToolIds.map((id, i) => {
                  const t = byId(id); if (!t) return null;
                  return (
                    <div key={id} className="bg-card border-theme" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px' }}>
                      <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 800, width: 14 }}>{i + 1}.</span>
                      <Icon name={t.icon} size={14} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>{t.label}</span>
                      <button className="ab-btn sec sm" onClick={() => move(i, -1)} disabled={i === 0} title="Subir"><Icons.ArrowUp size={11} /></button>
                      <button className="ab-btn sec sm" onClick={() => move(i, 1)} disabled={i === topToolIds.length - 1} title="Bajar"><Icons.ArrowDown size={11} /></button>
                      <button className="ab-btn sec sm" onClick={() => removeTop(id)} title="Quitar"><Icons.X size={11} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Disponibles */}
            <div className="border-theme">
              <div className="bg-muted" style={{ padding: '9px 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', borderBottom: 'var(--border-thickness) solid var(--border)' }}>Disponibles</div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
                {activeTools.filter((t) => !topToolIds.includes(t.id)).map((t) => (
                  <div key={t.id} className="bg-card border-theme" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px' }}>
                    <Icon name={t.icon} size={14} />
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>{t.label}</span>
                    <button className="ab-btn sm" onClick={() => addTop(t.id)}><Icons.Plus size={11} /> Anclar</button>
                  </div>
                ))}
                {activeTools.filter((t) => !topToolIds.includes(t.id)).length === 0 && <div className="text-muted-foreground" style={{ fontSize: 11, textAlign: 'center', padding: 8 }}>Todas ancladas</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
