/* =============================================================================
   BLOQUE 3b · CATÁLOGO DE HERRAMIENTAS (ab-catalog) — F2.4
   -----------------------------------------------------------------------------
   Filtro "Ver por": Carpeta ▸ Subcategoría ▸ ToolCard | Fase | Top.
   ToolCard: [Explorar] (desc + fases), [Abrir] (monta en ToolHost; candado si
   premium + Free → Paywall, CONST §2), [‹ Agregar / ✓ En proyecto].
   Animaciones con AnimatePresence. Solo metadata: no implementa herramientas.
   ============================================================================= */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { CATALOG, FOLDERS, ALL_PHASES, TOP_TOOLS_DEFAULT, subsOf, looseToolsOf } from '../core/catalog';
import { useAuth } from '../core/auth/AuthProvider';
import { useProjects } from '../core/db/ProjectProvider';
import type { CatalogTool } from '../core/types';

export default function ToolCatalog({
  collapsed = false,
  addedTools = [],
  topToolIds = TOP_TOOLS_DEFAULT,
  onAdd,
  onRemove,
}: {
  collapsed?: boolean;
  addedTools?: string[];
  topToolIds?: string[];
  onAdd?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { projectId, toolId } = useParams();
  const { user } = useAuth();
  const { getProject } = useProjects();
  const plan = user?.plan ?? 'Free';

  // Visibilidad por 'Tipo de proyecto' (OGUC): si la tool restringe tiposProyecto y el
  // proyecto tiene un tipo definido que no está en la lista, se oculta. Sin tipo ⇒ se muestra.
  const tipoProyecto = projectId ? getProject(projectId)?.tipoProyecto : undefined;
  const allowed = (t: CatalogTool) =>
    !t.tiposProyecto || !tipoProyecto || t.tiposProyecto.includes(tipoProyecto);

  const [filter, setFilter] = useState<'Carpeta' | 'Fase' | 'Top'>('Carpeta');
  const [openFolders, setOpenFolders] = useState<number[]>([3]);
  const [openSubs, setOpenSubs] = useState<string[]>(['3::Dimensionadores']);
  const [openPhases, setOpenPhases] = useState<string[]>(['PROYECTO']);
  const [explored, setExplored] = useState<string | null>(null);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const openTool = (t: CatalogTool) => {
    if (t.estado === 'soon') { navigate(projectId ? `/p/${projectId}/m/${t.id}` : '/pricing'); return; }
    if (t.tier === 'premium' && plan === 'Free') { navigate('/pricing'); return; } // CONST §2
    navigate(projectId ? `/p/${projectId}/m/${t.id}` : '/pricing');
  };

  const ToolCard = ({ tool }: { tool: CatalogTool }) => {
    const isExplored = explored === tool.id;
    const isActive = toolId === tool.id;
    const locked = tool.tier === 'premium' && plan === 'Free';
    const added = addedTools.includes(tool.id);
    return (
      <div className={`ab-tool ${tool.estado === 'soon' ? 'soon' : ''} ${isActive ? 'active' : ''}`}>
        <div className="ab-tool-row">
          <div className="ab-tool-title"><Icon name={tool.icon} size={15} /><span>{tool.label}</span></div>
          <div className="ab-tool-actions">
            {tool.estado === 'soon' && <span className="ab-pill soon">Próximamente</span>}
            {tool.tier === 'premium' && <span className="ab-pill prem"><Icon name="Lock" size={9} /> Premium</span>}
          </div>
        </div>
        <div className="ab-tool-row" style={{ marginTop: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div className="ab-tool-actions">
            <button className="ab-btn sec sm" onClick={() => setExplored(isExplored ? null : tool.id)}><Icon name="Info" size={11} /> Explorar</button>
            <button className="ab-btn sm" onClick={() => openTool(tool)} title={locked ? 'Requiere Premium' : 'Abrir en el área dinámica'}>
              {locked ? <><Icon name="Lock" size={11} /> Premium</> : <><Icon name="Play" size={11} /> Abrir</>}
            </button>
            {added ? (
              <button className="ab-btn add added sm" onClick={() => onRemove?.(tool.id)} title="Quitar de la carpeta del proyecto"><Icon name="Check" size={12} /> En proyecto</button>
            ) : (
              <button className="ab-btn add sm" onClick={() => onAdd?.(tool.id)} title="Agregar a la carpeta del proyecto"><Icon name="ChevronLeft" size={13} /> Agregar</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isExplored && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="ab-explore">
                <div className="lab">&gt; DESCRIPCIÓN:</div>
                <div style={{ opacity: 0.75, margin: '3px 0 6px' }}>{tool.desc}</div>
                {tool.fases.length > 0 && (
                  <>
                    <div className="lab">&gt; FASES:</div>
                    <div className="ab-phase-badges">{tool.fases.map((ph) => <span key={ph} className="ab-phase on">[X] {ph}</span>)}</div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const byFolder = () => FOLDERS.filter((f) => f.id > 0).map((folder) => {
    const isOpen = openFolders.includes(folder.id);
    const tools = CATALOG.filter((t) => t.folder === folder.id);
    return (
      <div key={folder.id} className="ab-folder">
        <button className="ab-folder-head" onClick={() => setOpenFolders(isOpen ? [] : [folder.id])}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={folder.icon} size={15} />{folder.id}. {folder.name.toUpperCase()}</span>
          <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <div className="ab-folder-body">
                {/* Herramientas SUELTAS (sin subsección) — se listan directamente. */}
                {looseToolsOf(folder.id).filter(allowed).length > 0 && (
                  <div className="ab-sub-body" style={{ paddingTop: 4 }}>
                    {looseToolsOf(folder.id).filter(allowed).map((t) => <ToolCard key={t.id} tool={t} />)}
                  </div>
                )}
                {subsOf(folder.id).map((sub) => {
                  const subKey = `${folder.id}::${sub}`;
                  const subOpen = openSubs.includes(subKey);
                  const subTools = tools.filter((t) => t.sub === sub && allowed(t));
                  return (
                    <div key={subKey} className="ab-sub">
                      <button className="ab-sub-head" onClick={() => toggle(openSubs, subKey, setOpenSubs)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={subOpen ? 'FolderOpen' : 'Folder'} size={12} />:: {sub.toUpperCase()} :: <span style={{ opacity: 0.5 }}>({subTools.length})</span></span>
                        <Icon name={subOpen ? 'ChevronDown' : 'ChevronRight'} size={13} />
                      </button>
                      <AnimatePresence initial={false}>
                        {subOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div className="ab-sub-body">{subTools.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  const byPhase = () => ALL_PHASES.map((phase) => {
    const isOpen = openPhases.includes(phase);
    const tools = CATALOG.filter((t) => t.folder !== 7 && t.fases.includes(phase) && allowed(t));
    return (
      <div key={phase} className="ab-folder">
        <button className="ab-folder-head" onClick={() => setOpenPhases(isOpen ? [] : [phase])}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="Filter" size={14} /> FASE: {phase}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ opacity: 0.5 }}>({tools.length})</span><Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} /></span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <div className="ab-folder-body" style={{ padding: '8px 12px' }}>
                {tools.length ? tools.map((t) => <ToolCard key={t.id} tool={t} />) : <div className="ab-empty" style={{ padding: 20 }}>Sin herramientas en esta fase</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  const byTop = () => (
    <div className="ab-folder-body" style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', margin: '2px 4px 8px' }}>Accesos rápidos · herramientas muy usadas</div>
      {topToolIds.map((id) => CATALOG.find((t) => t.id === id)).filter((t): t is CatalogTool => !!t && allowed(t)).map((t) => <ToolCard key={t.id} tool={t} />)}
    </div>
  );

  return (
    <div className="ab-catalog" style={collapsed ? { maxHeight: 'none' } : undefined}>
      <div className="ab-catalog-head"><span>| Catálogo de Herramientas</span><Icon name="Boxes" size={16} /></div>
      <div className="ab-catalog-filter">
        <span className="ab-mini-label">Ver por:</span>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          <select className="ab-select" style={{ flex: 1 }} value={filter} onChange={(e) => setFilter(e.target.value as 'Carpeta' | 'Fase' | 'Top')}>
            <option value="Carpeta">ESTRUCTURA DE CARPETAS</option>
            <option value="Fase">FASES DEL PROYECTO</option>
            <option value="Top">HERRAMIENTAS TOP</option>
          </select>
          <Icon name="ChevronDown" size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
        </div>
      </div>
      <div className="ab-catalog-scroll">{filter === 'Carpeta' ? byFolder() : filter === 'Fase' ? byPhase() : byTop()}</div>
    </div>
  );
}
