/* =============================================================================
   SHELL · TOP UNIFICADO (ab-top) — S7.1
   -----------------------------------------------------------------------------
   Controles a la IZQUIERDA (tagline + Inicio · Usuario · Tema · Proyecto ·
   SYSTEM_OK) y la marca BASEPRO + logos a la DERECHA. El logo Basepro alterna
   entre versión clara (N) y oscura (B) según el color de la barra (oscura en
   cad/washi/white · clara en matrix).
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

  // La barra es oscura en todos los temas salvo "matrix" (barra clara). El logo
  // Basepro alterna: barra oscura → versión clara (N) · barra clara → oscura (B).
  const barIsDark = theme !== 'matrix';
  const baseproLogo = barIsDark ? '/Basepro-N-t.png' : '/Basepro-B-t.png';

  const cerrarSesion = async () => {
    setMenuOpen(false);
    try { await signOut(); navigate('/'); } catch { /* ignora errores de cierre */ }
  };

  return (
    <div className="ab-top">
      <div className="ab-topbar">
        {/* 0 · Tagline arriba a la izquierda (fila propia, no se topa con la marca) */}
        <div className="ab-top-tagline">
          Gestión Documental - <strong style={{ color: 'var(--destructive)' }}>Expedientes técnicos</strong> - Arquitectura - Permisos
        </div>

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

      {/* Marca + logos a la derecha (alto completo) */}
      <div className="ab-brand">
        <img className="ab-brand-logo" src="/Logo-Archibots.png" alt="Archibots" />
        <div className="ab-brand-text">
          <div className="ab-brand-title" onClick={() => navigate('/')} title="Ir al inicio">BASE<span className="pro">PRO</span></div>
          <div className="ab-brand-sub">
            La infraestructura digital de tu proyecto. <strong style={{ color: 'var(--destructive)' }}>Proyecta. Cumple. Construye.</strong>
          </div>
        </div>
        <img className="ab-brand-logo ab-brand-logo-new" src={baseproLogo} alt="Basepro" />
      </div>
    </div>
  );
}
