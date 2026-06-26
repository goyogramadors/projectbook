/* =============================================================================
   VISTA /o/:projectId — Workspace del producto "Libro de Obra Digital".
   -----------------------------------------------------------------------------
   F-LDO 2 (Fase 2 · PLAN-LibroDeObraDigital.md): maqueta a 3 columnas con REUSO
   DIRECTO (opción 3.4.1) de las dos herramientas Premium ya existentes.
     · Col 1 — "Mis Obras": selector de proyecto (reusa useProjects).
     · Col 2+3 — la herramienta activa, montada "grande" por projectId, con su
       propio layout interno (sub-libros/folios o árbol/agregar).
     · Conmutador de módulo LDO ⇄ Carpeta sobre las dos columnas anchas.
   El gating Premium se deriva con useAccess (misma fuente que ToolHost). Estado
   y persistencia de cada herramienta ya existen; aquí no se duplica lógica.
   Los nodos del Block (header) navegan con ?m=… para preseleccionar el módulo.
   ============================================================================= */
import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useProjects } from '../core/db/ProjectProvider';
import { useAccess } from '../core/useAccess';
import { CATALOG } from '../core/catalog';
import { DEFAULT_PROJECT_ID } from '../core/db/ProjectRepository';
import type { CatalogTool } from '../core/types';
import './LibroWorkspace.css';

// Reuso directo de ambas herramientas (lazy, un chunk por tool).
const LibroObrasDigitalView = lazy(() => import('../tools/LibroObrasDigitalView'));
const CarpetaDigitalView = lazy(() => import('../tools/CarpetaDigitalView'));

type ModuloId = 'libro-obras' | 'carpeta-digital';

const MODULOS: { id: ModuloId; label: string; icon: string }[] = [
  { id: 'libro-obras', label: 'Libro de Obras', icon: 'Notebook' },
  { id: 'carpeta-digital', label: 'Carpeta Digital', icon: 'FolderTree' },
];

const toolOf = (id: ModuloId): CatalogTool | null =>
  CATALOG.find((t) => t.id === id) ?? null;

export default function LibroWorkspaceView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, getProject } = useProjects();
  const obra = getProject(projectId);

  const [searchParams] = useSearchParams();
  const paramModulo = ((): ModuloId => {
    const m = searchParams.get('m');
    return m === 'carpeta-digital' || m === 'libro-obras' ? m : 'libro-obras';
  })();
  const [modulo, setModulo] = useState<ModuloId>(paramModulo);
  // El Block (header) navega con ?m=… → re-selecciona el módulo sin remontar la vista.
  useEffect(() => { setModulo(paramModulo); }, [paramModulo]);

  // Gating: mismo cómputo que ToolHost (premium + rol del proyecto).
  const access = useAccess(toolOf(modulo), obra);

  const realProjects = projects.filter((p) => p.id !== DEFAULT_PROJECT_ID);

  return (
    <div className="lw-shell">
      {/* ── COL 1 · MIS OBRAS ─────────────────────────────────────────── */}
      <aside className="lw-aside">
        <div className="module-header">| MIS OBRAS · {realProjects.length}</div>
        <div className="lw-obras">
          {realProjects.map((p) => (
            <button
              key={p.id}
              className={`lw-obra${p.id === projectId ? ' active' : ''}`}
              onClick={() => navigate(`/o/${p.id}`)}
            >
              <span className="nm">{p.name}</span>
              <span className="meta">REF: {p.id}</span>
            </button>
          ))}
          <button className="lw-obra new" onClick={() => navigate('/')}>
            <Icon name="FolderPlus" size={15} /> Iniciar nueva obra
          </button>
        </div>
      </aside>

      {/* ── COL 2+3 · HERRAMIENTA ACTIVA ──────────────────────────────── */}
      <section className="lw-main">
        <header className="lw-head">
          <div className="lw-title">
            <button className="ab-btn sec" onClick={() => navigate('/')}>‹ Mis Obras</button>
            <h2>{obra?.name ?? 'Obra'}</h2>
          </div>
          <div className="lw-switch" role="tablist">
            {MODULOS.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={modulo === m.id}
                className={`lw-tab${modulo === m.id ? ' active' : ''}`}
                onClick={() => setModulo(m.id)}
              >
                <Icon name={m.icon} size={15} /> {m.label}
              </button>
            ))}
          </div>
        </header>

        <div className="lw-tool">
          {!obra ? (
            <p className="tech-quote">Selecciona una obra en la columna izquierda para comenzar.</p>
          ) : (
            <Suspense fallback={<div className="lw-loading">Cargando módulo…</div>}>
              {modulo === 'libro-obras' ? (
                <LibroObrasDigitalView projectId={projectId} access={access} />
              ) : (
                <CarpetaDigitalView projectId={projectId} access={access} />
              )}
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}
