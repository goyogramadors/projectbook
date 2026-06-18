/* =============================================================================
   VISTA / (home · LANDING) — NUEVO LAYOUT (S7.2)
   -----------------------------------------------------------------------------
   Se monta dentro del <Outlet> del AppShell (que aporta el top y el dock). Aquí
   solo va la banda central:
     · Hero "¿Cómo funciona?" + Mis Proyectos (pegados abajo).
     · "Explorar herramientas" enciende (fade ~2 s) el modo de 3 columnas:
       catálogo angosto (solo Explorar/Abrir, sin Agregar) + área de exploración
       que muestra CÓMO FUNCIONA la herramienta. No hay proyecto, así que la
       exploración es de solo lectura (no navega ni monta la tool).
   Conserva el modal real de "Nuevo Proyecto" cableado a createProject (Cloud/Local).
   ============================================================================= */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import { FOLDERS, CATALOG, ALL_PHASES, TOP_TOOLS_DEFAULT, subsOf, looseToolsOf } from '../core/catalog';
import { DEFAULT_PROJECT_ID } from '../core/db/ProjectRepository';
import type { CatalogTool } from '../core/types';

const findTool = (id: string): CatalogTool | undefined => CATALOG.find((t) => t.id === id);

type Sel = { mode: 'explore' | 'open'; tool: CatalogTool } | null;

export default function HomeView() {
  const navigate = useNavigate();
  const { projects, createProject } = useProjects();
  const { user, openAuthModal } = useAuth();
  const { triggerToast } = useToast();

  const [showTools, setShowTools] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [filter, setFilter] = useState<'Carpeta' | 'Fase' | 'Top'>('Carpeta');
  const [openFolders, setOpenFolders] = useState<number[]>([1]);
  const [openSubs, setOpenSubs] = useState<string[]>([]);
  const [openPhases, setOpenPhases] = useState<string[]>(['PERFIL']);

  /* ── Crear proyecto real vía MODAL de la página (sin window.prompt). ── */
  const [npOpen, setNpOpen] = useState(false);
  const [npName, setNpName] = useState('');
  const [npBusy, setNpBusy] = useState(false);
  const handleNuevoProyecto = () => { setNpName(''); setNpOpen(true); };
  const confirmarNuevoProyecto = async () => {
    if (npBusy) return;
    if (!npName.trim()) { triggerToast('Ingresa un nombre para el proyecto.'); return; }
    setNpBusy(true);
    try {
      const id = await createProject(npName);
      setNpOpen(false);
      triggerToast(`Proyecto "${npName.trim()}" creado.`);
      navigate(`/p/${id}`);
    } catch {
      triggerToast('No se pudo crear el proyecto. Intenta de nuevo.');
    } finally {
      setNpBusy(false);
    }
  };

  // "Proyectos reales" = excluye el sandbox automático de invitado.
  const realProjects = projects.filter((p) => p.id !== DEFAULT_PROJECT_ID);

  const verTool = (id: string, mode: 'explore' | 'open') => {
    const t = findTool(id);
    if (t) { setSel({ mode, tool: t }); setShowTools(true); }
  };

  /* ── Tarjeta del catálogo: SOLO Explorar + Abrir (sin Agregar; no hay proyecto). ── */
  const ToolCard = ({ tool }: { tool: CatalogTool }) => (
    <div className={`ab-tool ${tool.estado === 'soon' ? 'soon' : ''} ${sel?.tool.id === tool.id ? 'active' : ''}`}>
      <div className="ab-tool-row">
        <div className="ab-tool-title"><Icon name={tool.tier === 'premium' ? 'Lock' : tool.icon} size={14} /><span>{tool.label}</span></div>
        <div className="ab-tool-actions">
          {tool.estado === 'soon' && <span className="ab-pill soon">Próximamente</span>}
          {tool.tier === 'premium' && <span className="ab-pill prem"><Icon name="Lock" size={9} /> Premium</span>}
        </div>
      </div>
      <div className="ab-tool-row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
        <div className="ab-tool-actions">
          <button className="ab-btn sec sm" onClick={() => verTool(tool.id, 'explore')}><Icon name="Info" size={11} /> Explorar</button>
          <button className="ab-btn sm" onClick={() => verTool(tool.id, 'open')}><Icon name="Play" size={11} /> Abrir</button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="ab-land">
      <div className={`ab-land-body ${showTools ? 'with-tools' : ''}`}>

        {/* COL 1 · CONTENIDO */}
        <div className="ab-land-content">
          <section className="ab-land-hero">
            <h1>¿Cómo funciona?</h1>
            <p>Crea la documentación y análisis de tus proyectos en un solo lugar. Ordena y mejora tu gestión administrativa.</p>
            <p>Crea tu proyecto y podrás explorar y agregar las herramientas que necesites.</p>
            <p className="welcome">¡Bienvenidos!</p>
            <div className="ab-land-cta">
              <button className="ab-landbtn" onClick={handleNuevoProyecto}><Icon name="FolderPlus" size={15} /> [ + Crear Proyecto ]</button>
              {!user && (
                <button className="ab-landbtn sec" onClick={openAuthModal}><Icon name="LogIn" size={15} /> Iniciar sesión</button>
              )}
              <button className={`ab-landbtn sec ${showTools ? 'on' : ''}`} onClick={() => setShowTools((v) => !v)}>
                <Icon name="Boxes" size={15} /> {showTools ? 'Ocultar herramientas' : 'Explorar herramientas'}
              </button>
            </div>
          </section>

          <div className="ab-land-bottom">
            <section>
              <div className="ab-land-sech"><Icon name="FolderOpen" size={12} /> Mis Proyectos · {realProjects.length} expedientes</div>
              <div className="ab-land-proj">
                {realProjects.map((p) => (
                  <button key={p.id} className="card" onClick={() => navigate(`/p/${p.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Icon name="Folder" size={24} /><Icon name="ChevronRight" size={14} color="var(--muted-foreground)" /></div>
                    <div style={{ fontWeight: 800, fontSize: 12, marginTop: 8, textTransform: 'uppercase', lineHeight: 1.15 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}><span className="ab-badge free">{String(p.etapa)}</span><span className="ab-badge free">{p.destino}</span></div>
                    <div style={{ fontSize: 9, opacity: 0.5, marginTop: 8 }}>REF: {p.id}</div>
                  </button>
                ))}
                <button className="card new" onClick={handleNuevoProyecto}><Icon name="FolderPlus" size={26} /> + Crear Proyecto</button>
              </div>
            </section>
          </div>
        </div>

        {/* COL 2 · CATÁLOGO (solo en modo herramientas) */}
        {showTools && (
          <aside className="ab-landcat ab-fade2">
            <div className="ab-catalog">
              <div className="ab-catalog-head"><span>| Catálogo de Herramientas</span><Icon name="Boxes" size={16} /></div>
              <div className="ab-catalog-filter">
                <span className="ab-mini-label">Ver por:</span>
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                  <select className="ab-select" style={{ flex: 1 }} value={filter} onChange={(e) => setFilter(e.target.value as 'Carpeta' | 'Fase' | 'Top')}>
                    <option value="Carpeta">ESTRUCTURA DE CARPETAS</option>
                    <option value="Fase">FASES DEL PROYECTO</option>
                    <option value="Top">HERRAMIENTAS TOP</option>
                  </select>
                  <Icon name="ChevronDown" size={12} />
                </div>
              </div>
              <div className="ab-catalog-scroll">
                {filter === 'Carpeta' && FOLDERS.filter((f) => f.id > 0).map((folder) => {
                  const isOpen = openFolders.includes(folder.id);
                  const tools = CATALOG.filter((t) => t.folder === folder.id);
                  return (
                    <div key={folder.id} className="ab-folder">
                      <button className="ab-folder-head" onClick={() => setOpenFolders(isOpen ? [] : [folder.id])}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={folder.icon} size={15} />{folder.id}. {folder.name.toUpperCase()}</span>
                        <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} />
                      </button>
                      {isOpen && (
                        <div className="ab-folder-body">
                          {looseToolsOf(folder.id).length > 0 && <div className="ab-sub-body" style={{ paddingTop: 4 }}>{looseToolsOf(folder.id).map((t) => <ToolCard key={t.id} tool={t} />)}</div>}
                          {subsOf(folder.id).map((sub) => {
                            const subKey = `${folder.id}::${sub}`;
                            const subOpen = openSubs.includes(subKey);
                            const subTools = tools.filter((t) => t.sub === sub);
                            return (
                              <div key={subKey} className="ab-sub">
                                <button className="ab-sub-head" onClick={() => setOpenSubs(subOpen ? [] : [subKey])}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={subOpen ? 'FolderOpen' : 'Folder'} size={12} />:: {sub.toUpperCase()} :: <span style={{ opacity: 0.5 }}>({subTools.length})</span></span>
                                  <Icon name={subOpen ? 'ChevronDown' : 'ChevronRight'} size={13} />
                                </button>
                                {subOpen && <div className="ab-sub-body">{subTools.map((t) => <ToolCard key={t.id} tool={t} />)}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filter === 'Fase' && ALL_PHASES.map((phase) => {
                  const isOpen = openPhases.includes(phase);
                  const tools = CATALOG.filter((t) => t.folder !== 7 && t.fases.includes(phase));
                  return (
                    <div key={phase} className="ab-folder">
                      <button className="ab-folder-head" onClick={() => setOpenPhases(isOpen ? [] : [phase])}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="Filter" size={14} /> FASE: {phase}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ opacity: 0.5 }}>({tools.length})</span><Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} /></span>
                      </button>
                      {isOpen && <div className="ab-folder-body" style={{ padding: '8px 12px' }}>{tools.length ? tools.map((t) => <ToolCard key={t.id} tool={t} />) : <div className="ab-empty" style={{ padding: 16 }}>Sin herramientas</div>}</div>}
                    </div>
                  );
                })}
                {filter === 'Top' && (
                  <div className="ab-folder-body" style={{ padding: '10px 12px' }}>
                    {TOP_TOOLS_DEFAULT.map((id) => findTool(id)).filter((t): t is CatalogTool => !!t).map((t) => <ToolCard key={t.id} tool={t} />)}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* COL 3 · ÁREA DINÁMICA DE EXPLORACIÓN (cómo funciona · sin acciones) */}
        {showTools && (
          <section className="ab-landwork ab-fade2">
            <div className="inner">
              <div className="head">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {sel ? <><Icon name={sel.tool.icon} size={16} color="var(--destructive)" /> {sel.tool.label.toUpperCase()}</> : '— ÁREA DE TRABAJO —'}
                </span>
                {sel && <span className="ab-badge free">{sel.mode === 'explore' ? 'EXPLORANDO' : 'VISTA PREVIA'}</span>}
              </div>
              <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                {!sel ? (
                  <p className="tech-quote">Selecciona una herramienta del catálogo (Explorar / Abrir) para ver cómo funciona.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 8px' }}>¿Qué hace?</h3>
                      <p style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.85, margin: 0 }}>{sel.tool.desc}</p>
                    </div>
                    {sel.tool.fases.length > 0 && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>Fases del proyecto</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sel.tool.fases.map((ph) => <span key={ph} className="ab-badge free">{ph}</span>)}</div>
                      </div>
                    )}
                    <div className="ab-land-demo">
                      <Icon name="LayoutDashboard" size={26} /><br />Vista previa de la herramienta<br />
                      <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.8 }}>Crea o abre un proyecto para usarla con tus datos.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="foot" />
            </div>
          </section>
        )}
      </div>

      {/* ── MODAL DE NUEVO PROYECTO (in-page, reemplaza window.prompt) ── */}
      {npOpen && (
        <div className="ab-modal-overlay" onClick={() => !npBusy && setNpOpen(false)}>
          <div className="ab-modal tool-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-header">| NUEVO PROYECTO</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>Nombre del proyecto</label>
                <input
                  className="tech-input"
                  autoFocus
                  value={npName}
                  onChange={(e) => setNpName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmarNuevoProyecto(); if (e.key === 'Escape' && !npBusy) setNpOpen(false); }}
                  placeholder="Ej: Casa Pérez, Edificio Los Tilos…"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="ab-btn sec" onClick={() => setNpOpen(false)} disabled={npBusy}>Cancelar</button>
                <button className="technical-btn" onClick={confirmarNuevoProyecto} disabled={npBusy}>
                  {npBusy ? 'CREANDO…' : '[ CREAR PROYECTO ]'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
