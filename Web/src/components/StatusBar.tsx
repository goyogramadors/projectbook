/* BLOQUE 2 · BARRA DE ESTADO (ab-statusbar)
   path C:\archibots\… · usuario · BADGE DE PLAN INTERACTIVO (CONST §3: gatillo
   que abre <PricingView> en /pricing) · SYSTEM_OK · Compartir · Admin · Tema.
   Invitados: muestra "Iniciar Sesión" en lugar del badge de plan. */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { getManifest } from '../core/registry';
import { FOLDERS } from '../core/catalog';

export default function StatusBar({ onShare }: { onShare?: () => void }) {
  const navigate = useNavigate();
  const { user, openAuthModal, signOut } = useAuth();
  const { theme, cycleTheme }   = useTheme();
  const { toolId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const cerrarSesion = async () => {
    setMenuOpen(false);
    try { await signOut(); navigate('/'); } catch { /* ignora errores de cierre */ }
  };

  const tool = getManifest(toolId);
  const folderShort = tool
    ? (FOLDERS.find((f) => f.id === tool.folder)?.short || 'WS').toLowerCase()
    : 'ws';
  const pathStr = `C:\\archibots\\${folderShort}\\${tool ? tool.id + '.exe' : 'app.exe'}`;

  const plan   = user?.plan   ?? 'Free';
  const nombre = user?.nombre ?? 'invitado';

  return (
    <div className="ab-statusbar">
      <div className="ab-status-group">
        <span className="ab-path"><span className="ab-caret">&gt;</span>{pathStr}</span>
      </div>
      <div className="ab-user">
        <Icon name="UserCircle2" size={16} />
        <span className="ab-username">{nombre}</span>

        {user ? (
          /* El badge ahora abre un MENÚ de cuenta (paso intermedio) con info del
             usuario, acceso a planes y CERRAR SESIÓN — ya no salta directo al paywall. */
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              className={`ab-badge ${plan === 'Premium' ? 'premium' : 'free'}`}
              onClick={() => setMenuOpen((o) => !o)}
              title="Cuenta"
            >
              <Icon name={plan === 'Premium' ? 'Crown' : 'User'} size={10} /> {plan}
              <Icon name="ChevronDown" size={10} />
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
          /* Invitado — botón de inicio de sesión */
          <button
            className="ab-badge free"
            onClick={openAuthModal}
            title="Iniciar sesión o crear cuenta"
          >
            <Icon name="LogIn" size={10} /> Invitado
          </button>
        )}

        <span className="ab-divider" />
        <span className="ab-sysok"><span className="ab-blink">●</span> SYSTEM_OK</span>

        {user && (
          <button className="ab-theme-mini" onClick={onShare} title="Compartir proyecto">
            <Icon name="UserPlus" size={11} /> Compartir
          </button>
        )}
        {user?.isAdmin && (
          <button
            className="ab-theme-mini"
            onClick={() => navigate('/admin')}
            title="Panel de administración"
          >
            <Icon name="ShieldCheck" size={11} /> Admin
          </button>
        )}
        {!user && (
          <button
            className="ab-theme-mini"
            onClick={openAuthModal}
            title="Crear cuenta o iniciar sesión"
          >
            <Icon name="LogIn" size={11} /> Iniciar Sesión
          </button>
        )}
        <button className="ab-theme-mini" onClick={cycleTheme} title="Ciclar tema visual">
          <Icon name="Palette" size={11} /> {theme.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
