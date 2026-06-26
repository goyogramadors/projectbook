/* =============================================================================
   SHELL · TOP UNIFICADO (ab-top) — S7.1
   -----------------------------------------------------------------------------
   Controles a la IZQUIERDA (slogans + Inicio · Usuario · Tema · Proyecto ·
   SYSTEM_OK) y la marca BASEPRO + logos a la DERECHA. El logo Basepro usa una
   sola imagen de contornos; en barra clara (matrix) se invierte por CSS para que
   el perímetro del documento contraste en ambos temas.
   ============================================================================= */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Icon from './Icon';
import ArchiblocksNav from './ArchiblocksNav';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { useProjects } from '../core/db/ProjectProvider';
import { useActiveSection } from '../core/ui/ActiveSection';
import { PRODUCT, isLibroDeObra } from '../core/product/product';

/* Slogans que rota la marca (debajo de "Archiblocks"). Las mayúsculas van en rojo. */
const PHRASES = [
  'Gestión Documental y digital de proyectos',
  'Generación de Expedientes técnicos',
  'Arquitectura, Permisos y Construcción',
  'La infraestructura digital de tu proyecto',
  'Proyecta. Cumple. Construye.',
];

function BrandTagline() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % PHRASES.length), 4200);
    return () => clearInterval(t);
  }, []);
  const txt = PHRASES[i] ?? '';
  return (
    <span key={i} className="ab-brand-rot">
      {Array.from(txt).map((ch, idx) =>
        /[A-ZÁÉÍÓÚÑ]/.test(ch)
          ? <span key={idx} style={{ color: 'var(--destructive)' }}>{ch}</span>
          : ch,
      )}
    </span>
  );
}

export default function ShellTop({ onShare }: { onShare?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, openAuthModal, signOut } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const { projects } = useProjects();
  const { navNode, selectNode, setNavNode } = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);

  // Inicio es ruta: sincroniza el nodo marcado del navegador.
  useEffect(() => {
    if (location.pathname === '/') { setNavNode('edificio'); return; }
    // En LDO, el Block refleja el módulo abierto (?m=) aunque se recargue la página.
    if (isLibroDeObra && location.pathname.startsWith('/o/')) {
      const m = new URLSearchParams(location.search).get('m');
      setNavNode(m === 'carpeta-digital' ? 'db' : 'libro');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Clic en un nodo del navegador → navega + marca. (galvano = carpeta 6 Administrativos.)
  const onNav = (node: string) => {
    if (node === 'edificio') { setNavNode('edificio'); navigate('/'); return; }
    const pid = projectId ?? projects[0]?.id;
    if (!pid) { navigate('/'); return; }
    // En "Libro de Obra" los nodos del Block son accesos directos del workspace:
    //   db → Carpeta Digital · libro → Libro de Obras (vía ?m=). edificio ya fue arriba → Inicio.
    if (isLibroDeObra) {
      setNavNode(node); // marca el nodo → la etiqueta 3D del Block muestra su nombre
      const m = node === 'db' ? 'carpeta-digital' : node === 'libro' ? 'libro-obras' : '';
      navigate(`/o/${pid}${m ? `?m=${m}` : ''}`);
      return;
    }
    selectNode(node);
    navigate(`/p/${pid}`);
  };

  const plan = user?.plan ?? 'Free';
  const nombre = user?.nombre ?? 'Invitado';

  // La barra es oscura en todos los temas salvo "matrix" (barra clara). Una sola
  // imagen de contornos; en barra clara se invierte por CSS (.ab-logo-invert).
  const barIsDark = theme !== 'matrix';

  const cerrarSesion = async () => {
    setMenuOpen(false);
    try { await signOut(); navigate('/'); } catch { /* ignora errores de cierre */ }
  };

  // Conmuta de producto: persiste el override (?product=) y recarga para que el
  // router host-aware se re-resuelva. Lleva a la landing del producto elegido.
  const switchProduct = (id: 'archiblocks' | 'librodeobra') => {
    window.location.assign(`/?product=${id}`);
  };

  return (
    <div className="ab-top" style={{ position: 'relative' }}>
      {/* Conmutador de producto — esquina superior derecha (casi pegado arriba) */}
      <div className="ab-prodswitch" style={{ position: 'absolute', top: 3, right: 10, display: 'flex', gap: 6, zIndex: 6 }}>
        <button
          className="ab-topbtn"
          onClick={() => switchProduct('archiblocks')}
          title="Ir a Archiblocks"
          style={!isLibroDeObra ? { borderColor: 'var(--destructive)', color: 'var(--destructive)' } : undefined}
        ><Icon name="Boxes" size={12} /> Archiblocks</button>
        <button
          className="ab-topbtn"
          onClick={() => switchProduct('librodeobra')}
          title="Ir a Libro de Obra"
          style={isLibroDeObra ? { borderColor: 'var(--destructive)', color: 'var(--destructive)' } : undefined}
        ><Icon name="Notebook" size={12} /> LibrodeObra</button>
      </div>

      {/* Navegador interactivo (logo Archiblocks) — alto completo, a la izquierda */}
      <div className="ab-nav-host">
        <ArchiblocksNav
          active={navNode}
          dark={barIsDark}
          onSelect={onNav}
          scene={isLibroDeObra ? 'librodeobra' : 'archiblocks'}
        />
      </div>

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
          <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>{PRODUCT.unit.singular.slice(0, 4)}:</span>
          <select value={projectId ?? ''} onChange={(e) => navigate(e.target.value ? `${isLibroDeObra ? '/o/' : '/p/'}${e.target.value}` : '/')}>
            <option value="">-- MODO LIBRE / INICIO --</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
          </select>
        </div>

        {/* 5 · System OK */}
        <span className="ab-topsysok"><span className="ab-blink" style={{ color: 'var(--success)' }}>●</span> SYSTEM_OK</span>
      </div>

      {/* Marca a la derecha (alto completo): Archiblocks + slogan rotativo */}
      <div className="ab-brand">
        <div className="ab-brand-text">
          <div className="ab-brand-title" style={isLibroDeObra ? { cursor: 'default', fontSize: '2.5rem', letterSpacing: '.08em' } : { cursor: 'default' }}>
            {PRODUCT.brandTop}<span className="pro">{PRODUCT.brandPro}</span>
          </div>
          <div className="ab-brand-sub">
            {isLibroDeObra ? <span className="ab-brand-rot">{PRODUCT.brandSub}</span> : <BrandTagline />}
          </div>
        </div>
      </div>
    </div>
  );
}
