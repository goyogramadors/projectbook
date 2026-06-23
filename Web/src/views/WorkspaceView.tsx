/* =============================================================================
   VISTA /p/:projectId (+ /m/:toolId) — WORKSPACE 3 COLUMNAS (S7.1)
   -----------------------------------------------------------------------------
   col (izq) <ToolHost> área dinámica · col (centro) <ToolCatalog> · col (der)
   <BinderFicha> carpeta del proyecto.
   v3 — Columnas estilo Overleaf: separadores móviles (arrastrables) entre las 3
   columnas y colapso de catálogo / carpeta. El ancho y el estado abierto/cerrado
   persisten SOLO por sesión (sessionStorage); por defecto abren como estaban.
   Bajo col-centro/der: "Avance del Expediente".
   ============================================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import Icon from '../components/Icon';
import BinderFicha from '../components/BinderFicha';
import ToolCatalog from '../components/ToolCatalog';
import ToolHost from '../components/ToolHost';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { getManifest } from '../core/registry';
import type { CarpetaId, CatalogTool, ToolEstado } from '../core/types';

const ESTADO_COLOR: Record<ToolEstado, string> = {
  'Completado': 'var(--success)', 'En proceso': 'var(--primary)', 'Vacío': 'var(--muted-foreground)',
};

/* ── layout de columnas (persistencia por sesión) ── */
const COLS_KEY = 'ab-cols';
interface ColsState { cat: number; bind: number; catOpen: boolean; bindOpen: boolean; }
const COLS_DEFAULT: ColsState = { cat: 392, bind: 320, catOpen: true, bindOpen: true };
function loadCols(): ColsState {
  try { const r = sessionStorage.getItem(COLS_KEY); if (r) return { ...COLS_DEFAULT, ...JSON.parse(r) }; } catch { /* ignore */ }
  return COLS_DEFAULT;
}

export default function WorkspaceView() {
  const navigate = useNavigate();
  const { projectId, toolId } = useParams();
  const { projects, getProject, addTool, removeTool, setToolState } = useProjects();
  const { triggerToast } = useToast();
  const [binderTab, setBinderTab] = useState<CarpetaId>(0);
  const { onShare } = useOutletContext<{ onShare: () => void }>();

  /* ── columnas redimensionables/colapsables ── */
  const [cols, setCols] = useState<ColsState>(loadCols);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width:1041px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width:1041px)');
    const fn = () => setWide(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  useEffect(() => { try { sessionStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch { /* ignore */ } }, [cols]);

  const dragRef = useRef<{ which: 'cat' | 'bind'; startX: number; startVal: number } | null>(null);
  const onMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const delta = d.startX - e.clientX; // arrastrar a la izquierda ensancha la columna derecha
    const val = Math.min(760, Math.max(180, d.startVal + delta));
    setCols((c) => ({ ...c, [d.which]: val }));
  }, []);
  const onUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }, [onMove]);
  const onGutterDown = (which: 'cat' | 'bind', enabled: boolean) => (e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    dragRef.current = { which, startX: e.clientX, startVal: which === 'cat' ? cols.cat : cols.bind };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const project = getProject(projectId);
  const others = projects.filter((p) => p.id !== projectId);
  const added = project?.addedTools ?? [];
  const states = project?.toolStates ?? {};
  const getEstado = (id: string): ToolEstado => states[id]?.estado ?? 'Vacío';

  const cycleEstado = async (id: string) => {
    if (!projectId) return;
    const cur = getEstado(id);
    const next: ToolEstado = cur === 'Vacío' ? 'En proceso' : cur === 'En proceso' ? 'Completado' : 'Vacío';
    await setToolState(projectId, id, { estado: next });
  };

  const guardarFicha = async () => {
    if (!projectId || !toolId) return;
    const hoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    const cur = getEstado(toolId);
    await setToolState(projectId, toolId, { fecha: hoy, estado: cur === 'Vacío' ? 'En proceso' : cur });
    triggerToast('Ficha guardada.');
  };

  const completados = added.filter((id) => getEstado(id) === 'Completado').length;
  const avancePct = added.length ? Math.round((completados / added.length) * 100) : 0;
  const activeTool = getManifest(toolId);

  const agregarAlProyecto = async () => {
    if (!projectId || !activeTool) return;
    await addTool(projectId, activeTool.id);
    const folder = getManifest(activeTool.id)?.folder;
    if (typeof folder === 'number') setBinderTab(folder as CarpetaId);
    triggerToast('Herramienta agregada al expediente.');
  };

  /* ── estilos dinámicos del grid (solo en pantallas anchas; en angostas manda el CSS) ── */
  const catW = cols.catOpen ? `${cols.cat}px` : '0px';
  const bindW = cols.bindOpen ? `${cols.bind}px` : '0px';
  const mainStyle: React.CSSProperties = wide
    ? { gridTemplateColumns: `minmax(280px,1fr) 10px ${catW} 10px ${bindW}`, gridTemplateRows: 'auto 1fr' }
    : {};
  const colStyle = (gc: string, gr: string): React.CSSProperties => wide ? { gridColumn: gc, gridRow: gr } : {};
  const Gutter = ({ which, open }: { which: 'cat' | 'bind'; open: boolean }) => {
    if (!wide) return null;
    const gc = which === 'cat' ? '2' : '4';
    return (
      <div className="ab-gutter" style={{ gridColumn: gc, gridRow: '1' }}>
        <button
          className="ab-gutter-toggle"
          title={open ? 'Ocultar columna' : 'Mostrar columna'}
          onClick={() => setCols((c) => ({ ...c, [which === 'cat' ? 'catOpen' : 'bindOpen']: !open }))}
        >
          <Icon name={open ? (which === 'cat' ? 'ChevronLeft' : 'ChevronRight') : (which === 'cat' ? 'ChevronRight' : 'ChevronLeft')} size={12} />
        </button>
        {open && <div className="ab-gutter-grip" onPointerDown={onGutterDown(which, true)} title="Arrastrar para redimensionar" />}
      </div>
    );
  };

  return (
    <main className="ab-main3" style={mainStyle}>
      {/* COLUMNA IZQUIERDA · ÁREA DINÁMICA + BARRA DE ACCIONES */}
      <section className="ab-wc3" style={colStyle('1', '1 / 3')}>
        <ToolHost />
        {activeTool && (
          <div className="ab-workbar">
            <button
              onClick={() => cycleEstado(activeTool.id)}
              title="Cambiar estado: Vacío → En proceso → Completado"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--bar-foreground)', padding: '2px 4px' }}
            >
              <span style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${ESTADO_COLOR[getEstado(activeTool.id)]}`, background: getEstado(activeTool.id) === 'Completado' ? ESTADO_COLOR['Completado'] : 'transparent' }}>
                {getEstado(activeTool.id) === 'Completado' && <Icon name="Check" size={11} color="#fff" />}
                {getEstado(activeTool.id) === 'En proceso' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: ESTADO_COLOR['En proceso'] }} />}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{getEstado(activeTool.id)}</span>
              <span style={{ fontSize: 9, opacity: 0.6, whiteSpace: 'nowrap' }}>· Últ.: {states[activeTool.id]?.fecha ?? '—'}</span>
            </button>
            <button className="ab-workbar-btn" onClick={guardarFicha}><Icon name="Save" size={15} /> [ GUARDAR FICHA ]</button>
            {added.includes(activeTool.id) ? (
              <button className="ab-workbar-btn" disabled style={{ opacity: 0.6, cursor: 'default' }} title="Esta herramienta ya está en el expediente">
                <Icon name="CheckSquare" size={15} color="var(--success)" /> [ ✓ EN EXPEDIENTE ]
              </button>
            ) : (
              <button className="ab-workbar-btn" onClick={agregarAlProyecto} title="Agregar esta herramienta al expediente del proyecto">
                <Icon name="FolderPlus" size={15} /> [ AGREGAR AL PROYECTO ]
              </button>
            )}
            <button className="ab-workbar-btn" onClick={() => window.print()}><Icon name="Printer" size={15} /> [ EXPORTAR A PDF ]</button>
          </div>
        )}
      </section>

      <Gutter which="cat" open={cols.catOpen} />

      {/* COLUMNA CENTRO · CATÁLOGO */}
      <section className="ab-wc2" style={colStyle('3', '1')}>
        {(!wide || cols.catOpen) ? (
          <ToolCatalog
            addedTools={added}
            onAdd={async (id) => {
              if (!projectId) { triggerToast('Selecciona un proyecto activo primero'); return; }
              await addTool(projectId, id);
              const folder = getManifest(id)?.folder;
              if (typeof folder === 'number') setBinderTab(folder as CarpetaId);
              triggerToast('Añadida a la carpeta del proyecto');
            }}
            onRemove={async (id) => { if (projectId) { await removeTool(projectId, id); triggerToast('Quitada de la carpeta'); } }}
          />
        ) : null}
      </section>

      <Gutter which="bind" open={cols.bindOpen} />

      {/* COLUMNA DERECHA · CARPETA DEL PROYECTO */}
      <section className="ab-wc1" style={colStyle('5', '1')}>
        {(!wide || cols.bindOpen) ? (
          <>
            <BinderFicha
              project={project}
              binderTab={binderTab}
              onTab={setBinderTab}
              otherProjects={others}
              onShare={onShare}
            />
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.55, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="FolderOpen" size={12} /> Mis Proyectos
              </div>
              <div className="ab-myrow">
                {others.map((p) => (
                  <button key={p.id} className="card" onClick={() => navigate(`/p/${p.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Icon name="Folder" size={18} /><Icon name="ChevronRight" size={12} color="var(--muted-foreground)" />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 10, marginTop: 6, lineHeight: 1.15 }}>{p.name}</div>
                    <div style={{ fontSize: 8, opacity: 0.6, marginTop: 3 }}>{String(p.etapa)}</div>
                    <div style={{ fontSize: 8, opacity: 0.5 }}>REF: {p.id}</div>
                  </button>
                ))}
                <button className="card new" onClick={() => navigate('/')}><Icon name="FolderPlus" size={20} /> + Crear</button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* AVANCE DEL EXPEDIENTE — bajo catálogo + carpeta */}
      <section className="ab-wavance" style={wide ? { gridColumn: '3 / 6', gridRow: '2', alignSelf: 'end' } : {}}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="ListChecks" size={13} /> Avance del Expediente
          </span>
          <span style={{ fontSize: 10, opacity: 0.65 }}>{completados}/{added.length} completados · {avancePct}%</span>
          <span style={{ fontSize: 9, opacity: 0.45 }}>(sobre las herramientas agregadas al proyecto)</span>
        </div>
        <div className="ab-avancefree">
          {added.map((id) => getManifest(id)).filter((t): t is CatalogTool => !!t).map((t) => {
            const comp = getEstado(t.id) === 'Completado';
            return (
              <button key={t.id} className="chk" onClick={() => navigate(`/p/${projectId}/m/${t.id}`)} title={`${t.label} · ${getEstado(t.id)}`}>
                <Icon name={comp ? 'CheckSquare' : 'Square'} size={13} color={comp ? 'var(--success)' : undefined} />
                <span className="t">{t.label}</span>
              </button>
            );
          })}
          {added.length === 0 && <span style={{ fontSize: 10, opacity: 0.5 }}>Agrega herramientas desde el catálogo para construir el expediente.</span>}
        </div>
      </section>
    </main>
  );
}
