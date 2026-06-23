/* =============================================================================
   CarpetaDigitalView.tsx — CARPETA DIGITAL (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // PRODUCCIÓN (MVP) — Persiste {iniciado,contratoKey,archivos,seq,perms} como
   // documento único en la subcolección propia projects/{pid}/carpetaDigital/state
   // (Premium→Firestore zero-trust · Free→localStorage ab-carpeta-digital-{pid}),
   // con botón [GUARDAR] y avance del expediente (toolStates[carpeta-digital], S7).
   // Árbol NUMERADO por tipo de contrato (glosario MOP) + versiones + archivar.
   // El tipo de contrato se elige UNA sola vez al abrir y queda permanente.
   // Datos del glosario en carpetaDigitalData.ts (textos literales de los manuales).
   // Futuro: subida real (storageRef UUID, Storage Premium) + permisos denormalizados.
   // Tool independiente del Libro de Obras (decisión HITL B). tier: premium.
   ============================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react'; // doc-por-archivo + Storage UUID
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useProjects } from '../core/db/ProjectProvider';
import { cargarCarpeta, cargarMasArchivos, putArchivo, guardarMetaCarpeta } from './obra/carpetaStore';
import { subirAdjunto, borrarAdjunto, AdjuntoDemasiadoGrande } from './obra/storageUpload';
import type { ToolProps, ObraAdjunto } from '../core/types';
import { CARPETA_CONTRATOS } from './carpetaDigitalData';
import type { CDFolder } from './carpetaDigitalData';

// layout 2/3 árbol + 1/3 agregar/mostrar
type EstadoArch = 'activo' | 'archivado';
interface Archivo { id: number; folderN: string; tipoDoc: string; version: number; fecha: string; estado: EstadoArch; adjunto?: ObraAdjunto; }
const hoy = () => new Date().toISOString().slice(0, 10);

/** Adjunto sin subida real (modo Free/local o degradación): solo metadato. */
const localAdj = (f: File): ObraAdjunto => ({
  uuid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: f.name, size: f.size, type: f.type, url: '', path: '',
});

/* ── usuarios / permisos (compartir) ── */
const CURRENT_USER = 'M. Soto (IF)';
const USERS = ['M. Soto (IF)', 'J. Pérez', 'C. Rojas', 'P. Díaz', 'Contratista'];
type Nivel = 'sin' | 'lectura' | 'escritura' | 'edicion';
const NIVELES: Nivel[] = ['sin', 'lectura', 'escritura', 'edicion'];
const NIV_LABEL: Record<Nivel, string> = { sin: 'sin acceso', lectura: 'lectura', escritura: 'escritura', edicion: 'edición' };
const NIV_COLOR: Record<Nivel, string> = { sin: '#9ca3af', lectura: '#2563eb', escritura: '#d97706', edicion: '#16a34a' };

/* recolecta todos los números de carpeta de un subárbol (para conteo recursivo) */
const subtreeNs = (node: CDFolder): string[] =>
  [node.n, ...(node.c ?? []).flatMap(subtreeNs)];

export default function CarpetaDigitalView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, setToolState, repo } = useProjects();
  const project = getProject(projectId);
  const isCloud = repo.kind === 'cloud';

  /* el tipo de contrato se elige UNA vez al abrir la Carpeta Digital y queda permanente */
  const [iniciado, setIniciado] = useState(false);
  const [contratoKey, setContratoKey] = useState<string>(CARPETA_CONTRATOS[0]?.key ?? '');
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [seq, setSeq] = useState(1);
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [verArchivados, setVerArchivados] = useState(false);
  const [selN, setSelN] = useState<string>('');
  // Panel derecho (1/3): 'agregar' (formulario) o 'mostrar' (documentos de la carpeta).
  const [panelModo, setPanelModo] = useState<'agregar' | 'mostrar'>('agregar');
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoAdj, setNuevoAdj] = useState<ObraAdjunto | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  /* compartir */
  const [showShare, setShowShare] = useState(false);
  const [perms, setPerms] = useState<Record<string, Nivel>>(
    { 'M. Soto (IF)': 'edicion', 'J. Pérez': 'escritura', 'C. Rojas': 'lectura', 'P. Díaz': 'lectura', Contratista: 'sin' },
  );
  const ciclarPerm = (u: string) =>
    setPerms(p => ({ ...p, [u]: NIVELES[(NIVELES.indexOf(p[u] ?? 'sin') + 1) % NIVELES.length] ?? 'sin' }));

  const [guardado, setGuardado] = useState(false);
  // ── Persistencia doc-por-archivo: META projects/{pid}/carpetaDigital/state +
  //    ARCHIVOS .../state/archivos/{id}. Premium→Firestore (granular + paginación +
  //    migración one-time) · Free→localStorage. Ver obra/carpetaStore.ts.
  const hidratadoRef = useRef(false);
  useEffect(() => {
    if (!projectId || hidratadoRef.current) return;
    hidratadoRef.current = true;
    let alive = true;
    void (async () => {
      const { meta, archivos: ar, cursor: cur } = await cargarCarpeta(projectId, isCloud);
      if (!alive) return;
      if (meta) {
        setIniciado(meta.iniciado);
        if (meta.contratoKey) setContratoKey(meta.contratoKey);
        setSeq(meta.seq);
        if (meta.perms && Object.keys(meta.perms).length) setPerms(meta.perms);
      }
      setArchivos(ar);
      setCursor(cur);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isCloud]);

  const metaActual = (over?: Partial<{ iniciado: boolean; contratoKey: string; seq: number }>) => ({
    iniciado: over?.iniciado ?? iniciado,
    contratoKey: over?.contratoKey ?? contratoKey,
    seq: over?.seq ?? seq,
    perms,
  });

  /** Persiste meta + (cloud) el archivo tocado por su doc, y refleja el avance S7. */
  const persistir = async (
    archivosNext: Archivo[], over?: Partial<{ iniciado: boolean; contratoKey: string; seq: number }>, tocado?: Archivo,
  ) => {
    if (!projectId) return;
    if (isCloud && tocado) await putArchivo(projectId, true, tocado);
    await guardarMetaCarpeta(projectId, isCloud, metaActual(over), archivosNext);
    await setToolState(projectId, 'carpeta-digital', {
      estado: archivosNext.some(a => a.estado === 'activo') ? 'Completado' : ((over?.iniciado ?? iniciado) ? 'En proceso' : 'Vacío'),
      fecha: new Date().toLocaleDateString('es-CL'),
    });
  };

  const guardar = async () => {
    if (!projectId) return;
    const ok = await guardarMetaCarpeta(projectId, isCloud, metaActual(), archivos);
    if (ok) {
      await setToolState(projectId, 'carpeta-digital', {
        estado: archivos.some(a => a.estado === 'activo') ? 'Completado' : (iniciado ? 'En proceso' : 'Vacío'),
        fecha: new Date().toLocaleDateString('es-CL'),
      });
    }
    setGuardado(ok);
    if (ok) window.setTimeout(() => setGuardado(false), 2000);
  };

  const cargarMas = async () => {
    if (!projectId || !cursor || cargandoMas) return;
    setCargandoMas(true);
    try { const r = await cargarMasArchivos(projectId, cursor); setArchivos(p => [...p, ...r.archivos]); setCursor(r.cursor); }
    finally { setCargandoMas(false); }
  };

  const onPickFile = async (files: FileList | null) => {
    if (readOnly || !files || !files[0] || !projectId) return;
    const file = files[0];
    setSubiendo(true);
    try {
      if (isCloud) {
        try { setNuevoAdj(await subirAdjunto(projectId, 'carpeta', file)); }
        catch (err) {
          if (err instanceof AdjuntoDemasiadoGrande) window.alert(`"${file.name}" supera 25 MB.`);
          else setNuevoAdj(localAdj(file));
        }
      } else setNuevoAdj(localAdj(file));
    } finally { setSubiendo(false); }
  };

  const contrato = useMemo(
    () => CARPETA_CONTRATOS.find(c => c.key === contratoKey) ?? CARPETA_CONTRATOS[0],
    [contratoKey],
  );

  const activos = useMemo(() => archivos.filter(a => a.estado === 'activo'), [archivos]);
  const archivados = useMemo(() => archivos.filter(a => a.estado === 'archivado'), [archivos]);

  const findFolder = (n: string, nodes?: CDFolder[]): CDFolder | undefined => {
    for (const node of nodes ?? contrato?.tree ?? []) {
      if (node.n === n) return node;
      const r = node.c && findFolder(n, node.c);
      if (r) return r;
    }
    return undefined;
  };
  const sel = useMemo(() => findFolder(selN), [selN, contrato]);

  /* docs activos de una carpeta concreta (por número) */
  const docsDe = (n: string) => activos.filter(a => a.folderN === n);
  /* conteo recursivo (carpeta + subcarpetas) */
  const folderCount = (node: CDFolder) => {
    const ns = new Set(subtreeNs(node));
    return activos.filter(a => ns.has(a.folderN)).length;
  };
  /* tipos predeterminados (glosario) + tipos agregados por el usuario */
  const tiposDe = (node: CDFolder) => {
    const base = [...node.f];
    docsDe(node.n).forEach(a => { if (!base.includes(a.tipoDoc)) base.push(a.tipoDoc); });
    return base;
  };
  const countTipo = (n: string, tipo: string) => docsDe(n).filter(a => a.tipoDoc === tipo).length;

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para abrir la Carpeta Digital.</p></div>
  );

  const agregar = () => {
    if (readOnly || !sel || !nuevoTipo.trim()) return;
    const version = countTipo(sel.n, nuevoTipo.trim()) + 1;
    const nuevo: Archivo = {
      id: seq, folderN: sel.n, tipoDoc: nuevoTipo.trim(), version, fecha: hoy(), estado: 'activo',
      ...(nuevoAdj ? { adjunto: nuevoAdj } : {}),
    };
    const archivosNext = [nuevo, ...archivos];
    setArchivos(archivosNext); setSeq(s => s + 1); setNuevoTipo(''); setNuevoAdj(null);
    void persistir(archivosNext, { seq: seq + 1 }, nuevo);
  };
  const setEstado = (id: number, estado: EstadoArch) => {
    const archivosNext = archivos.map(a => a.id === id ? { ...a, estado } : a);
    setArchivos(archivosNext);
    const tocado = archivosNext.find(a => a.id === id);
    void persistir(archivosNext, undefined, tocado);
  };

  /* ── pantalla de apertura: el tipo de contrato se elige UNA sola vez ── */
  if (!iniciado) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, flexWrap: 'wrap' }}>
        <Icons.FolderTree size={22} strokeWidth={1.4} /> Carpeta Digital
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 16 }}>
        Proyecto: <strong>{project.name}</strong> · Abre la Carpeta Digital del Contrato eligiendo su <strong>tipo de contrato</strong>. La elección queda permanente para este expediente.
      </p>
      <div className="tool-panel" style={{ maxWidth: 460 }}>
        <div className="module-header">| ABRIR NUEVA CARPETA DIGITAL</div>
        <div className="panel-content">
          <div className="tech-input-group"><label>Tipo de contrato (no se podrá cambiar luego)</label>
            <select className="tech-select" value={contratoKey} disabled={readOnly} onChange={e => setContratoKey(e.target.value)}>
              {CARPETA_CONTRATOS.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select></div>
          <p style={{ fontSize: 10, opacity: 0.6, margin: '8px 0' }}>
            El árbol normativo (numerado) se fija según el tipo elegido. Para usar otro tipo, se abre una Carpeta Digital nueva.
          </p>
          <button type="button" className="technical-btn" disabled={readOnly}
            onClick={() => { setIniciado(true); setSelN(contrato?.tree[0]?.n ?? ''); setAbierto(contrato?.tree[0] ? { [contrato.tree[0].n]: true } : {}); void persistir(archivos, { iniciado: true }); }}>
            📂 [ ABRIR CARPETA DIGITAL ]
          </button>
        </div>
      </div>
    </motion.div>
  );

  /* ── nodo recursivo del árbol ── */
  const FolderNode = ({ node, depth }: { node: CDFolder; depth: number }) => {
    const op = !!abierto[node.n];
    const tipos = tiposDe(node);
    const total = folderCount(node);
    const isSel = selN === node.n && !verArchivados;
    return (
      <div>
        <button type="button"
          onClick={() => { setAbierto(p => ({ ...p, [node.n]: !p[node.n] })); setSelN(node.n); setVerArchivados(false); setPanelModo('agregar'); }}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
            padding: '6px 8px', paddingLeft: 8 + depth * 14, cursor: 'pointer', textAlign: 'left',
            border: `1px solid ${isSel ? '#6d28d9' : 'transparent'}`, borderRadius: 6,
            background: isSel ? 'rgba(109,40,217,.08)' : 'transparent', fontSize: 12, fontWeight: 600 }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {op ? '📂' : '📁'} <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>{node.n}</span> {node.l}
          </span>
          {total > 0 ? (
            <span role="button" tabIndex={0} title="Ver documentos de esta carpeta"
              onClick={(e) => { e.stopPropagation(); setAbierto(p => ({ ...p, [node.n]: true })); setSelN(node.n); setVerArchivados(false); setPanelModo('mostrar'); }}
              style={{ fontSize: 10, fontWeight: 800, flex: '0 0 auto', color: '#6d28d9', textDecoration: 'underline', cursor: 'pointer', padding: '0 2px' }}>
              {total}
            </span>
          ) : (
            <span style={{ fontSize: 10, opacity: 0.7, flex: '0 0 auto' }}>{total}</span>
          )}
        </button>
        {op && (
          <div style={{ marginTop: 2 }}>
            {tipos.length > 0 && (
              <div style={{ paddingLeft: 8 + (depth + 1) * 14 }}>
                {tipos.map(t => (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '2px 0', opacity: 0.85 }}>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {t}</span>
                    <span style={{ fontSize: 10, opacity: 0.7, flex: '0 0 auto' }}>{countTipo(node.n, t)}</span>
                  </div>
                ))}
              </div>
            )}
            {(node.c ?? []).map(child => (
              <FolderNode key={child.n} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, flexWrap: 'wrap' }}>
        <Icons.FolderTree size={22} strokeWidth={1.4} /> Carpeta Digital
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
        {!readOnly && (
          <button type="button" onClick={guardar} className="technical-btn"
            style={{ marginLeft: 'auto', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icons.Save size={13} /> {guardado ? 'Guardado' : 'Guardar'}
          </button>
        )}
        <button type="button" onClick={() => setShowShare(s => !s)} className="technical-btn"
          style={{ marginLeft: readOnly ? 'auto' : 0, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icons.Share2 size={13} /> Compartir
        </button>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 12 }}>
        Proyecto: <strong>{project.name}</strong> · Tipo de contrato: <strong>{contrato?.name}</strong> <span style={{ opacity: 0.6 }}>(fijo)</span> — árbol normativo numerado, con versionado y archivado.
      </p>

      {showShare && (
        <div className="tool-panel" style={{ marginBottom: 12 }}>
          <div className="module-header">| COMPARTIR CARPETA DIGITAL · permiso por usuario</div>
          <div className="panel-content">
            <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>Clic en el permiso de cada usuario para alternar: sin acceso → lectura → escritura → edición. Específico de la Carpeta Digital.</p>
            {USERS.map(u => (
              <div key={u} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px dashed var(--ab-border,#eee)' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>👤 {u}{u === CURRENT_USER && <span style={{ opacity: 0.6, fontWeight: 400 }}> · tú</span>}</span>
                <button type="button" disabled={readOnly} onClick={() => ciclarPerm(u)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, cursor: readOnly ? 'default' : 'pointer',
                    border: `1px solid ${NIV_COLOR[perms[u] ?? 'sin']}`, color: NIV_COLOR[perms[u] ?? 'sin'], background: 'transparent' }}>
                  {NIV_LABEL[perms[u] ?? 'sin']}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tool-split-21">
        {/* IZQUIERDA (2/3) · árbol numerado */}
        <div className="tool-panel ab-split-left">
          <div className="module-header">| ÁRBOL — {contrato?.name.toUpperCase()}</div>
          <div className="panel-content">
            {(contrato?.tree ?? []).map(node => (
              <FolderNode key={node.n} node={node} depth={0} />
            ))}
            <button type="button" onClick={() => { setVerArchivados(true); setSelN(''); }}
              style={{ width: '100%', padding: '7px 8px', marginTop: 8, border: '1px dashed var(--ab-border,#ccc)', borderRadius: 6, cursor: 'pointer',
                background: verArchivados ? 'rgba(0,0,0,.05)' : 'transparent', textAlign: 'left', fontSize: 12 }}>
              🗃️ Archivados ({archivados.length})
            </button>
            {cursor && (
              <button type="button" disabled={cargandoMas} onClick={() => void cargarMas()}
                style={{ width: '100%', padding: '7px 8px', marginTop: 6, border: '1px solid var(--ab-border,#ccc)', borderRadius: 6, cursor: 'pointer', background: 'transparent', textAlign: 'left', fontSize: 12 }}>
                {cargandoMas ? 'Cargando…' : '↓ Cargar más documentos'}
              </button>
            )}
          </div>
        </div>

        {/* DERECHA · detalle / agregar / archivados */}
        <div className="ab-split-right">
          <div className="tool-panel">
            <div className="panel-content">
              {verArchivados ? (
                <>
                  <div className="module-header">| 🗃️ ARCHIVADOS</div>
                  {archivados.length === 0 ? <p className="tech-quote">No hay archivos archivados.</p> : archivados.map(a => (
                    <div key={a.id} style={{ borderBottom: '1px solid var(--ab-border,#eee)', padding: '6px 0', fontSize: 12 }}>
                      📄 {a.tipoDoc} v{a.version} · <span style={{ opacity: 0.7 }}>{a.folderN}</span>
                      <button type="button" disabled={readOnly} onClick={() => setEstado(a.id, 'activo')}
                        className="technical-btn" style={{ float: 'right', fontSize: 10, padding: '2px 8px' }}>♻ Restaurar</button>
                    </div>
                  ))}
                </>
              ) : !sel ? (
                <div className="module-header">| Selecciona una carpeta del árbol</div>
              ) : panelModo === 'mostrar' ? (
                /* ── MODO MOSTRAR DOCUMENTO ── */
                <>
                  <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>| MOSTRAR DOCUMENTO · {sel.n} {sel.l.toUpperCase()}</span>
                    <button type="button" onClick={() => setPanelModo('agregar')}
                      style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>+ Agregar documento</button>
                  </div>
                  {docsDe(sel.n).length === 0 ? <p className="tech-quote">Sin documentos activos en esta carpeta.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                      <tbody>
                        {docsDe(sel.n).map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--ab-border,#eee)' }}>
                            <td style={{ padding: '5px 4px' }}>📄 {a.tipoDoc}
                              {a.adjunto && (a.adjunto.url
                                ? <a href={a.adjunto.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6, fontSize: 11 }}>📎 {a.adjunto.name} · Abrir</a>
                                : <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>📎 {a.adjunto.name} ·local</span>)}
                            </td>
                            <td style={{ padding: '5px 4px', opacity: 0.7 }}>v{a.version} · {a.fecha}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                              <button type="button" disabled={readOnly} onClick={() => setEstado(a.id, 'archivado')}
                                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>📥 Archivar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                /* ── MODO AGREGAR DOCUMENTO ── */
                <>
                  <div className="module-header">| {sel.n} {sel.l.toUpperCase()}</div>

                  {sel.c && sel.c.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.6, margin: '8px 0 4px' }}>Subcarpetas ({sel.c.length})</div>
                      {sel.c.map(c => (
                        <div key={c.n} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px dashed var(--ab-border,#eee)' }}>
                          <span>📁 <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>{c.n}</span> {c.l}</span>
                          <span style={{ opacity: 0.6, fontSize: 10 }}>{folderCount(c)}</span>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="module-header" style={{ marginTop: 14 }}>| AGREGAR DOCUMENTO</div>
                  <div className="ab-form-grid">
                    <div className="tech-input-group col-span-full"><label>Tipo de documento</label>
                      {sel.f.length > 0 && (
                        <select className="tech-select" value={nuevoTipo} disabled={readOnly} onChange={e => setNuevoTipo(e.target.value)}>
                          <option value="">— Selecciona del glosario o escribe abajo —</option>
                          {sel.f.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      )}
                      <input className="tech-input" style={{ marginTop: 6 }} value={nuevoTipo} disabled={readOnly}
                        onChange={e => setNuevoTipo(e.target.value)} placeholder="Tipo de documento (libre)" /></div>
                  </div>
                  <div className="tech-input-group" style={{ marginTop: 6 }}><label>Archivo (opcional · sube a Storage con nombre UUID)</label>
                    <label style={{ display: 'block', border: '1.5px dashed var(--ab-border,#bbb)', borderRadius: 8, padding: 8, textAlign: 'center', cursor: readOnly || subiendo ? 'default' : 'pointer', fontSize: 12, opacity: subiendo ? 0.6 : 0.85 }}>
                      {subiendo ? '⏳ Subiendo…' : nuevoAdj ? `📎 ${nuevoAdj.name}${nuevoAdj.url ? '' : ' ·local'}` : '📎 Seleccionar archivo (máx 25 MB)'}
                      <input type="file" disabled={readOnly || subiendo} style={{ display: 'none' }}
                        onChange={e => { void onPickFile(e.target.files); e.target.value = ''; }} />
                    </label>
                    {nuevoAdj && (
                      <button type="button" onClick={() => { if (nuevoAdj.path) void borrarAdjunto(nuevoAdj.path); setNuevoAdj(null); }}
                        style={{ fontSize: 10, marginTop: 4, border: 0, background: 'transparent', cursor: 'pointer', opacity: 0.7 }}>✕ quitar archivo</button>
                    )}
                  </div>
                  <p style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, margin: '6px 0' }}>
                    <Icons.Info size={11} /> Premium: el binario sube a Storage (projects/{'{'}pid{'}'}/obra/carpeta/UUID). Free: queda como metadato local. Cada documento se guarda en su propio doc.
                  </p>
                  <button type="button" className="technical-btn" disabled={readOnly || !nuevoTipo.trim()} onClick={agregar}>+ [ AGREGAR / NUEVA VERSIÓN ]</button>

                  {docsDe(sel.n).length > 0 && (
                    <button type="button" onClick={() => setPanelModo('mostrar')}
                      style={{ width: '100%', marginTop: 12, padding: '7px 8px', border: '1px solid #6d28d9', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: '#6d28d9', fontSize: 12, fontWeight: 700 }}>
                      📄 Mostrar documentos ({docsDe(sel.n).length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
