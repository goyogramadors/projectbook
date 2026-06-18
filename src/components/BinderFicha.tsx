/* =============================================================================
   BLOQUE 3a · ARCHIVADOR + FICHA (ab-binder)  — F2.3
   -----------------------------------------------------------------------------
   Pestañas 0.FICHA … 7.BIBLIOTECA. La pestaña 0 muestra la Ficha: foto +
   Datos Clave + barra de avance del expediente (15 ítems, %). Las pestañas 1–7
   listan las herramientas vinculadas a esa carpeta (addedTools).

   ⟲ CONST §6 — MODELO DE SUPERFICIES DUAL. La Ficha NUNCA recalcula ni pierde
   datos: lee `superficieProyecto()` (valor DERIVADO) que elige entre
   `superficieCalculada` y `superficieManual` según la bandera `superficieOrigen`,
   y etiqueta el origen con <span class="ab-origin">. Ambos valores persisten.
   ============================================================================= */
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { FOLDERS } from '../core/catalog';
import { getManifest } from '../core/registry';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { superficieProyecto, type ProjectMaster, type CarpetaId, type ToolEstado } from '../core/types';

const ESTADO_COLOR: Record<ToolEstado, string> = {
  'Completado': 'var(--success)', 'En proceso': 'var(--primary)', 'Vacío': 'var(--muted-foreground)',
};

/** Imágenes conceptuales (SVG inline, sin red): el usuario puede elegir una como
 *  representación rápida del proyecto mientras no sube una propia. */
const CONCEPTUALES: { label: string; url: string }[] = [
  { label: 'Volumen', url: svgConcept('#D32F2F', 'iso') },
  { label: 'Planta', url: svgConcept('#2E7D32', 'plan') },
  { label: 'Trama', url: svgConcept('#1565C0', 'grid') },
];

function svgConcept(color: string, kind: 'iso' | 'plan' | 'grid'): string {
  const body =
    kind === 'iso'
      ? `<path d='M160,150 L260,95 L360,150 L260,205 Z' fill='${color}' opacity='0.85'/><path d='M195,128 L260,165 L260,108 L195,72 Z' fill='#fff' opacity='0.5'/><path d='M260,165 L325,128 L325,72 L260,108 Z' fill='#000' opacity='0.18'/>`
      : kind === 'plan'
      ? `<rect x='150' y='70' width='220' height='150' fill='none' stroke='${color}' stroke-width='5'/><line x1='250' y1='70' x2='250' y2='220' stroke='${color}' stroke-width='3'/><line x1='150' y1='150' x2='370' y2='150' stroke='${color}' stroke-width='3'/>`
      : `<g stroke='${color}' stroke-width='2' opacity='0.7'>${Array.from({ length: 9 }, (_, i) => `<line x1='${110 + i * 35}' y1='50' x2='${110 + i * 35}' y2='240'/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<line x1='110' y1='${50 + i * 38}' x2='390' y2='${50 + i * 38}'/>`).join('')}</g>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 290'><rect width='500' height='290' fill='#11111108'/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function BinderFicha({
  project,
  binderTab,
  onTab,
  otherProjects = [],
}: {
  project: ProjectMaster | null;
  binderTab: CarpetaId;
  onTab: (tab: CarpetaId) => void;
  otherProjects?: ProjectMaster[];
}) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { repo, reload, removeTool } = useProjects();
  const { triggerToast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [savingFoto, setSavingFoto] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const toolStates = project?.toolStates ?? {};
  const getEstado = (id: string): ToolEstado => toolStates[id]?.estado ?? 'Vacío';
  const getFecha = (id: string): string => toolStates[id]?.fecha ?? '—';

  /** Persiste la URL/dataURL de la imagen en el ProjectMaster (CONST §6: master liviano). */
  const saveFoto = async (url: string) => {
    if (!project) return;
    setSavingFoto(true);
    try {
      await repo.save({ ...project, fotoUrl: url });
      await reload();
      triggerToast(url ? 'Imagen del proyecto actualizada.' : 'Imagen del proyecto quitada.');
    } catch {
      triggerToast('No se pudo guardar la imagen.');
    } finally {
      setSavingFoto(false);
    }
  };

  /** Lee el archivo elegido y lo reescala a un thumbnail compacto (JPEG) antes de guardar. */
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 640;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { saveFoto(String(reader.result)); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveFoto(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => saveFoto(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Avance del expediente (15 ítems) — idéntico criterio al Mockup.
  const added = project?.addedTools ?? [];
  const fichaItems = project ? [
    { k: 'Nombre', done: !!project.name }, { k: 'Año', done: !!project.anio },
    { k: 'Propietario', done: !!project.propietario }, { k: 'Rol', done: !!project.rol },
    { k: 'Dirección', done: !!project.direccion }, { k: 'Comuna', done: !!project.comuna },
    { k: 'Sup. Terreno', done: !!project.superficieTerrenoLegal },
    { k: 'Sup. Proyecto', done: !!superficieProyecto(project) },
    { k: 'Presupuesto', done: !!project.presupuestoUF }, { k: 'Fase', done: !!project.etapa },
    { k: 'Participantes', done: added.includes('participantes') },
    { k: 'Ubicación', done: added.includes('ubicacion') },
    { k: 'Geoloc.', done: added.includes('geolocalizador') },
    { k: 'Dimensionado', done: added.includes('dimensionador') },
    { k: 'Exp. DOM', done: added.includes('expediente-dom') },
  ] : [];
  const fichaDone = fichaItems.filter((i) => i.done).length;
  const fichaPct = fichaItems.length ? Math.round((fichaDone / fichaItems.length) * 100) : 0;

  const supProyecto = project ? superficieProyecto(project) : '';
  const linkedTools = project
    ? added.map((id) => getManifest(id)).filter((t): t is NonNullable<typeof t> => !!t && t.folder === binderTab)
    : [];

  return (
    <div>
      <div className="ab-binder-tabs">
        {FOLDERS.map((f) => {
          // ⟲ v2.1: la pestaña 7 se reusa como "Repositorio" en el Binder
          // (la Biblioteca de Recursos permanece sólo como acceso del catálogo).
          const short = f.id === 7 ? 'REPOSITORIO' : f.short;
          const icon = f.id === 7 ? 'FolderArchive' : f.icon;
          return (
            <button key={f.id} className={`ab-tab ${binderTab === f.id ? 'active' : ''}`} onClick={() => { onTab(f.id); setConfirmDel(null); }}>
              <Icon name={icon} size={13} />{f.id}. {short}
            </button>
          );
        })}
      </div>

      <div className="ab-binder-body">
        <div className="ab-binder-head">
          <span>| {binderTab === 7 ? 'Repositorio' : FOLDERS.find((f) => f.id === binderTab)?.name}</span>
          <span className="ref">REF: {project?.id || '—'}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={binderTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {binderTab === 0 ? (
              project ? (
                <>
                  <div className="ab-ficha">
                    <div className="ab-ficha-main">
                      <div className="ab-photo">
                        {project.fotoUrl
                          ? <img src={project.fotoUrl} alt="Referencia" />
                          : <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}><Icon name="ImageOff" size={36} /><br />[ SIN IMAGEN ]</div>}
                        <span className="ab-photo-tag">VISTA PREVIA</span>
                      </div>
                      {/* Selector de imagen: subir propia o elegir conceptual (CONST §6 master liviano). */}
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
                      <div className="ab-photo-tools">
                        <button className="ab-btn sec sm" disabled={savingFoto} onClick={() => fileRef.current?.click()} title="Subir una imagen propia">
                          <Icon name="Upload" size={11} /> Subir imagen
                        </button>
                        <span className="ab-photo-tools-label">Conceptual:</span>
                        {CONCEPTUALES.map((c) => (
                          <button key={c.label} className="ab-btn add sm" disabled={savingFoto} onClick={() => saveFoto(c.url)} title={`Usar imagen conceptual: ${c.label}`}>
                            <Icon name="Image" size={11} /> {c.label}
                          </button>
                        ))}
                        {project.fotoUrl && (
                          <button className="ab-btn sm" disabled={savingFoto} onClick={() => saveFoto('')} title="Quitar la imagen">
                            <Icon name="Trash2" size={11} /> Quitar
                          </button>
                        )}
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{project.name}</h2>
                      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="MapPin" size={14} /> {project.direccion}, {project.comuna}
                      </p>

                      <div className="ab-progress">
                        <div className="ab-progress-head">
                          <span><Icon name="ListChecks" size={13} /> Avance del expediente</span>
                          <span className="ab-progress-pct">{fichaDone}/{fichaItems.length} · {fichaPct}%</span>
                        </div>
                        <div className="ab-progress-bar"><div className="ab-progress-fill" style={{ width: `${fichaPct}%` }} /></div>
                        <div className="ab-progress-grid">
                          {fichaItems.map((it) => (
                            <div key={it.k} className={`ab-chk ${it.done ? 'on' : ''}`} title={it.k}>
                              <Icon name={it.done ? 'CheckSquare' : 'Square'} size={14} /><span>{it.k}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ab-ficha-side">
                      <div className="ab-data-title">Datos Clave</div>
                      <div className="ab-data-row"><span className="ab-data-label">Año</span><span className="ab-data-value">{project.anio}</span></div>
                      <div className="ab-data-row"><span className="ab-data-label">Propietario</span><span className="ab-data-value">{project.propietario}</span></div>
                      <div className="ab-data-row"><span className="ab-data-label">Rol</span><span className="ab-data-value">{project.rol}</span></div>
                      <div className="ab-data-row"><span className="ab-data-label">Destino</span><span className="ab-data-value">{project.destino}</span></div>
                      <div className="ab-data-row"><span className="ab-data-label">Sup. Terreno</span><span className="ab-data-value">{project.superficieTerrenoLegal} m²</span></div>
                      {/* CONST §6 — valor derivado + etiqueta de origen; ambos valores se conservan en disco. */}
                      <div className="ab-data-row">
                        <span className="ab-data-label">Sup. Proyecto</span>
                        <span className="ab-data-value">
                          {supProyecto ? `${supProyecto} m²` : '—'}
                          {supProyecto && <span className="ab-origin">{project.superficieOrigen}</span>}
                        </span>
                      </div>
                      <div className="ab-data-row"><span className="ab-data-label">Fase actual</span><span className="ab-data-value">[ {String(project.etapa).toUpperCase()} ]</span></div>
                    </div>
                  </div>

                </>
              ) : <div style={{ padding: 20 }}><div className="ab-empty">Modo libre · sin expediente activo</div></div>
            ) : binderTab === 7 ? (
              /* ⟲ v2.1: REPOSITORIO (esqueleto — próximamente). A futuro mostrará los
                 archivos cargados con ícono de carpeta y botón "ver" para los PDF. */
              <div className="ab-linked ab-repo">
                <h3>&gt; Repositorio de documentos del proyecto</h3>
                <div className="ab-repo-banner">
                  <Icon name="FolderArchive" size={20} />
                  <span>Próximamente — aquí se centralizarán los antecedentes y documentos del expediente.</span>
                </div>
                <div className="ab-repo-grid">
                  {['Topografía', 'Mecánica de Suelos', 'TE1', 'Factibilidad Eléctrica', 'Factibilidad Sanitaria', 'Otros'].map((doc) => (
                    <div key={doc} className="ab-repo-card" aria-disabled>
                      <div className="ab-repo-card-top"><Icon name="Folder" size={22} /><span className="ab-pill soon">Próximamente</span></div>
                      <div className="ab-repo-card-name">{doc}</div>
                      <button className="ab-btn sm" disabled title="Disponible próximamente"><Icon name="Eye" size={11} /> Ver PDF</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ab-linked">
                <h3>&gt; Herramientas agregadas a esta carpeta</h3>
                {linkedTools.length === 0 ? (
                  <div className="ab-empty">No hay herramientas en esta carpeta.<br />Usa el botón [ ‹ Agregar ] del catálogo lateral para añadirlas.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {linkedTools.map((t) => {
                      const est = getEstado(t.id);
                      return (
                        <div key={t.id} className="ab-linkrow">
                          <Icon name={t.icon} size={15} />
                          <span className="lbl" title={t.label}>{t.label}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, whiteSpace: 'nowrap' }} title={`Estado: ${est} · Últ. guardado: ${getFecha(t.id)}`}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: est === 'Vacío' ? 'transparent' : ESTADO_COLOR[est], border: `1.5px solid ${ESTADO_COLOR[est]}` }} />
                            <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{est}</span>
                            <span style={{ opacity: 0.55 }}>· {getFecha(t.id)}</span>
                          </span>
                          {confirmDel === t.id ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700 }}>
                              ¿Quitar?
                              <button className="ab-iconbtn danger" onClick={async () => { if (projectId) await removeTool(projectId, t.id); setConfirmDel(null); triggerToast('Quitada de la carpeta'); }}>Sí</button>
                              <button className="ab-iconbtn" onClick={() => setConfirmDel(null)}>No</button>
                            </span>
                          ) : (
                            <>
                              <button className="ab-iconbtn" onClick={() => navigate(`/p/${projectId}/m/${t.id}`)}><Icon name="Play" size={11} /> Abrir</button>
                              <button className="ab-iconbtn danger" onClick={() => setConfirmDel(t.id)} title="Quitar de la carpeta"><Icon name="Trash2" size={12} /></button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
