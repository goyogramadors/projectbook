/* =============================================================================
   VISTA /p/:projectId (+ /m/:toolId) — WORKSPACE 3 COLUMNAS (S7.1)
   -----------------------------------------------------------------------------
   col1 <BinderFicha> (8 pestañas; herramientas agregadas con estado/fecha/Abrir/
        papelera) + "Mis Proyectos" en fila al fondo.
   col2 <ToolCatalog> (selector + acordeón colapsable).
   col3 <ToolHost> (área dinámica) + barra inferior de contraste (estado circular
        + Guardar Ficha + Exportar PDF).
   Bajo col1–2: "Avance del Expediente" libre (solo agregadas, completadas en verde).
   Cero regresión en persistencia: el estado por herramienta se guarda en el
   master vía setToolState (Cloud/Local), sin tocar addedTools.
   ============================================================================= */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function WorkspaceView() {
  const navigate = useNavigate();
  const { projectId, toolId } = useParams();
  const { projects, getProject, addTool, removeTool, setToolState } = useProjects();
  const { triggerToast } = useToast();
  const [binderTab, setBinderTab] = useState<CarpetaId>(0);

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

  return (
    <main className="ab-main3">
      {/* COLUMNA 1 · PROYECTO EN TRABAJO */}
      <section className="ab-wc1">
        <BinderFicha
          project={project}
          binderTab={binderTab}
          onTab={setBinderTab}
          otherProjects={others}
        />

        {/* Mis Proyectos en fila, pegado abajo */}
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
      </section>

      {/* COLUMNA 2 · CATÁLOGO */}
      <section className="ab-wc2">
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
      </section>

      {/* COLUMNA 3 · ÁREA DINÁMICA + BARRA DE ACCIONES */}
      <section className="ab-wc3">
        <ToolHost />
        {activeTool && (
          <div className="ab-workbar">
            {/* Estado circular del módulo + fecha del último guardado */}
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
            <button className="ab-workbar-btn" onClick={() => window.print()}><Icon name="Printer" size={15} /> [ EXPORTAR A PDF ]</button>
          </div>
        )}
      </section>

      {/* AVANCE DEL EXPEDIENTE — LIBRE, base alineada con la col3 */}
      <section className="ab-wavance">
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
