/* =============================================================================
   SHELL · TOP UNIFICADO (ab-top) — S7.1
   -----------------------------------------------------------------------------
   Reemplaza ModuleHeader + StatusBar. Controles a la IZQUIERDA (Inicio · Usuario
   con menú de cuenta · Tema · selector de Proyecto · SYSTEM_OK) y la marca
   (_Archibots + subtítulo + logo) a la DERECHA, ocupando el alto completo.
   Conserva todo el wiring real: menú de cuenta (planes/compartir/admin/cerrar
   sesión), ciclo de tema y navegación por proyecto.
   ============================================================================= */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { useProjects } from '../core/db/ProjectProvider';

export default function ShellTop({ onShare }: { onShare?: () => void }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user, openAuthModal, signOut } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const { projects } = useProjects();
  const [menuOpen, setMenuOpen] = useState(false);

  const plan = user?.plan ?? 'Free';
  const nombre = user?.nombre ?? 'Invitado';

  const cerrarSesion = async () => {
    setMenuOpen(false);
    try { await signOut(); navigate('/'); } catch { /* ignora errores de cierre */ }
  };

  return (
    <div className="ab-top">
      <div className="ab-topbar">
        {/* 1 · Inicio */}
        <button className="ab-topbtn" onClick={() => navigate('/')}><Icon name="Home" size={13} /> Inicio</button>

        {/* 2 · Usuario / cuenta */}
        {user ? (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button className="ab-topbtn" onClick={() => setMenuOpen((o) => !o)} title="Cuenta · Plan">
              <Icon name={plan === 'Premium' ? 'Crown' : 'UserCircle2'} size={14} /> {nombre.toUpperCase()} · {plan.toUpperCase()}
              <Icon name="ChevronDown" size={11} />
            </button>
            {menuOpen && (
              <>
                <div className="ab-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="ab-user-menu">
                  <div className="ab-user-menu-head">
                    <div style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>{user.nombre}</div>
                    {user.email && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{user.email}</div>}
                    <span className={`ab-badge ${plan === 'Premium' ? 'premium' : 'free'}`} style={{ marginTop: 8 }}>
                      <Icon name={plan === 'Premium' ? 'Crown' : 'User'} size={10} /> Plan {plan}
                    </span>
                  </div>
                  <button className="ab-menu-item" onClick={() => { setMenuOpen(false); navigate('/pricing'); }}>
                    <Icon name="CreditCard" size={13} /> Ver planes y suscripción
                  </button>
                  {projectId && onShare && (
                    <button className="ab-menu-item" onClick={() => { setMenuOpen(false); onShare(); }}>
                      <Icon name="UserPlus" size={13} /> Compartir proyecto
                    </button>
                  )}
                  {user.isAdmin && (
                    <button className="ab-menu-item" onClick={() => { setMenuOpen(false); navigate('/admin'); }}>
                      <Icon name="ShieldCheck" size={13} /> Panel de administración
                    </button>
                  )}
                  <button className="ab-menu-item danger" onClick={cerrarSesion}>
                    <Icon name="LogOut" size={13} /> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button className="ab-topbtn" onClick={openAuthModal} title="Iniciar sesión o crear cuenta">
            <Icon name="LogIn" size={14} /> Iniciar sesión
          </button>
        )}

        {/* 3 · Tema */}
        <button className="ab-topbtn" onClick={cycleTheme} title="Ciclar tema (cad → washi → matrix → white)">
          <Icon name="Palette" size={13} /> TEMA: {theme.toUpperCase()}
        </button>

        {/* 4 · Proyecto */}
        <div className="ab-topsel">
          <Icon name="FolderOpen" size={13} color="var(--destructive)" />
          <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Proy:</span>
          <select value={projectId ?? ''} onChange={(e) => navigate(e.target.value ? `/p/${e.target.value}` : '/')}>
            <option value="">-- MODO LIBRE / INICIO --</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
          </select>
        </div>

        {/* 5 · System OK */}
        <span className="ab-topsysok"><span className="ab-blink" style={{ color: 'var(--success)' }}>●</span> SYSTEM_OK</span>
      </div>

      {/* Marca + logo a la derecha (alto completo) */}
      <div className="ab-brand">
        <div>
          <div className="ab-brand-title" onClick={() => navigate('/')} title="Ir al inicio"><span className="pulse">_</span>Archibots</div>
          <div className="ab-brand-sub">
            MÓDULO · <strong style={{ color: 'var(--destructive)' }}>WORKSPACE UNIFICADO</strong> · LABORATORIO DE ARQUITECTURA &amp; INGENIERÍA
          </div>
        </div>
        <img className="ab-brand-logo" src="/Logo-Archibots.png" alt="Archibots" />
      </div>
    </div>
  );
}
