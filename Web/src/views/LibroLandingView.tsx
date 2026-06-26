/* =============================================================================
   VISTA / (home) del producto "Libro de Obra Digital" — F-LDO 1
   -----------------------------------------------------------------------------
   Se monta en el <Outlet> del AppShell (top + dock persistentes). Reusa el flujo
   real de crear proyecto (createProject) y la lista de proyectos (useProjects);
   cada "obra" es un proyecto de la colección `projects`. La vista de trabajo vive
   en /o/:projectId (LibroWorkspaceView).
   ============================================================================= */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import { DEFAULT_PROJECT_ID } from '../core/db/ProjectRepository';
import './LibroLanding.css';

export default function LibroLandingView() {
  const navigate = useNavigate();
  const { projects, createProject } = useProjects();
  const { user, openAuthModal } = useAuth();
  const { triggerToast } = useToast();

  const realProjects = projects.filter((p) => p.id !== DEFAULT_PROJECT_ID);

  // ── Crear obra (reusa createProject; navega al workspace de obra). ──
  const [npOpen, setNpOpen] = useState(false);
  const [npName, setNpName] = useState('');
  const [npBusy, setNpBusy] = useState(false);
  const iniciarObra = () => { setNpName(''); setNpOpen(true); };
  const confirmarObra = async () => {
    if (npBusy) return;
    if (!npName.trim()) { triggerToast('Ingresa un nombre para la obra.'); return; }
    setNpBusy(true);
    try {
      const id = await createProject(npName);
      setNpOpen(false);
      triggerToast(`Obra "${npName.trim()}" creada.`);
      navigate(`/o/${id}`);
    } catch (err) {
      console.error('Error al crear obra:', err);
      triggerToast('No se pudo crear la obra. Intenta de nuevo.');
    } finally {
      setNpBusy(false);
    }
  };

  // "Explorar herramienta": abre la primera obra existente, o invita a crear una.
  const explorar = () => {
    if (realProjects[0]) navigate(`/o/${realProjects[0].id}`);
    else iniciarObra();
  };

  return (
    <main className="lo-land">
      <section className="lo-hero">
        <div className="lo-kicker">Plataforma de respaldo documental de obra</div>
        <h1 className="lo-h1">Librode<span className="pro">Obra</span></h1>
        <div className="lo-h1sub">un producto de Archiblocks</div>

        <div className="lo-proj">Libro de Obras y Carpeta Digital</div>
        <p className="lo-howto">
          <b>¿Cómo funciona?</b> Aquí puedes respaldar toda la información de tus obras con
          estándares del <b>Ministerio de Obras Públicas</b>. Registra folios diarios en el
          Libro de Obras y organiza todos tus documentos en la Carpeta Digital, con
          trazabilidad y versionado, listos para fiscalización.
        </p>

        <div className="lo-cta">
          <button className="lo-btn" onClick={iniciarObra}><Icon name="Play" size={15} /> Iniciar Obra</button>
          <button className="lo-btn sec" onClick={explorar}><Icon name="Boxes" size={15} /> Explorar Herramienta</button>
          {!user && (
            <button className="lo-btn sec" onClick={openAuthModal}><Icon name="LogIn" size={15} /> Iniciar sesión</button>
          )}
        </div>
      </section>

      <section className="lo-shortcuts">
        <div className="lo-shhead">▸ Mis Obras · {realProjects.length}</div>
        <div className="lo-grid">
          {realProjects.map((p) => (
            <button key={p.id} className="lo-card" onClick={() => navigate(`/o/${p.id}`)}>
              <span className="lo-chip">● Activa</span>
              <div className="nm">{p.name}</div>
              <div className="meta">REF: {p.id}</div>
            </button>
          ))}
          <button className="lo-card new" onClick={iniciarObra}>
            <Icon name="FolderPlus" size={26} /> + Iniciar nueva obra
          </button>
        </div>
      </section>

      {/* ── MODAL NUEVA OBRA ── */}
      {npOpen && (
        <div className="ab-modal-overlay" onClick={() => !npBusy && setNpOpen(false)}>
          <div className="ab-modal tool-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-header">| NUEVA OBRA</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Nombre de la obra</label>
                <input
                  className="tech-input"
                  autoFocus
                  value={npName}
                  onChange={(e) => setNpName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmarObra(); if (e.key === 'Escape' && !npBusy) setNpOpen(false); }}
                  placeholder="Ej: Casa 47 Guaylandia, Ampliación Liceo B-12…"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="ab-btn sec" onClick={() => setNpOpen(false)} disabled={npBusy}>Cancelar</button>
                <button className="technical-btn" onClick={confirmarObra} disabled={npBusy}>
                  {npBusy ? 'CREANDO…' : '[ INICIAR OBRA ]'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
