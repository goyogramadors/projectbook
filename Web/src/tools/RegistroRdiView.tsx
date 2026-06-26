/* =============================================================================
   RegistroRdiView.tsx — REGISTRO RDI (Requerimientos de Información · id 'rdi')
   -----------------------------------------------------------------------------
   Herramienta simple de Seguimiento e ITO para registrar Requerimientos de
   Información (RDI). Comparte los MISMOS temas/subtemas seleccionables y los
   "participantes" del Libro de Obra (./obra/temas). Cada RDI tiene tema, subtema,
   título, contenido y archivos/imágenes adjuntas. Es además el 5º formato de
   entrada de los libros de obra (ver LibroObrasDigitalView · formato 'rdi').

   Persistencia gobernada (useToolData): Premium → Firestore
   projects/{pid}/toolData/rdi · Free/offline → localStorage ab-rdi-{pid}.
   Adjuntos: Premium → Storage UUID (subirAdjunto, scope 'libro', cubierto por
   storage.rules obra/**) · Free → metadato local.
   ============================================================================= */
import { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { subirAdjunto, AdjuntoDemasiadoGrande } from './obra/storageUpload';
import { TEMAS_LOD, TEMAS_KEYS, USERS, CURRENT_USER, localAdj } from './obra/temas';
import type { ToolProps, ObraAdjunto } from '../core/types';

/* ── modelo ────────────────────────────────────────────────────────────────── */
interface Rdi {
  id: string; fecha: string; tema: string; subtema: string;
  titulo: string; contenido: string;
  participantes: string[]; adjuntos: ObraAdjunto[];
}
interface RdiState { rdis: Rdi[]; }
const RDI_DEFAULT: RdiState = { rdis: [] };
const hoy = () => new Date().toISOString().slice(0, 10);

/* ── componente ────────────────────────────────────────────────────────────── */
export default function RegistroRdiView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, setToolState } = useProjects();
  const isCloud = repo.kind === 'cloud';
  const project = getProject(projectId);
  const { data, setData, save, loading } = useToolData<RdiState>('rdi', projectId, RDI_DEFAULT);

  // formulario nueva RDI
  const [tema, setTema] = useState<string>(TEMAS_KEYS[0] ?? '');
  const [subtema, setSubtema] = useState<string>(TEMAS_LOD[TEMAS_KEYS[0] ?? '']?.[0] ?? '');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [parts, setParts] = useState<string[]>([]);
  const [partInput, setPartInput] = useState('');
  const [adj, setAdj] = useState<ObraAdjunto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cambiarTema = (t: string) => { setTema(t); setSubtema(TEMAS_LOD[t]?.[0] ?? ''); };

  const togglePart = (u: string) => setParts(p => p.includes(u) ? p : [...p, u]);
  const addPartInput = () => {
    const v = partInput.trim(); if (!v) return;
    const label = USERS.includes(v) ? v : `${v} (sin cuenta)`;
    setParts(p => p.includes(label) ? p : [...p, label]); setPartInput('');
  };

  const onPickFiles = async (files: FileList | null) => {
    if (readOnly || !files || !files.length || !projectId) return;
    setSubiendo(true); setAviso(null);
    try {
      const nuevos: ObraAdjunto[] = [];
      for (const f of Array.from(files)) {
        if (isCloud) {
          try { nuevos.push(await subirAdjunto(projectId, 'libro', f)); }
          catch (e) {
            if (e instanceof AdjuntoDemasiadoGrande) setAviso(`"${f.name}" supera 25 MB y no se adjuntó.`);
            else nuevos.push(localAdj(f)); // degradación: metadato local
          }
        } else nuevos.push(localAdj(f));
      }
      if (nuevos.length) setAdj(a => [...a, ...nuevos]);
    } finally { setSubiendo(false); }
  };

  const limpiar = () => { setTitulo(''); setContenido(''); setParts([]); setAdj([]); };

  const guardarRdi = async () => {
    if (readOnly || !projectId) return;
    if (!titulo.trim() && !contenido.trim()) { setAviso('Escribe al menos un título o un contenido.'); return; }
    const r: Rdi = {
      id: `rdi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fecha: hoy(), tema, subtema, titulo: titulo.trim(), contenido: contenido.trim(),
      participantes: [...parts], adjuntos: [...adj],
    };
    const next: RdiState = { rdis: [r, ...data.rdis] };
    setData(next); limpiar(); setAviso(null);
    const ok = await save(next);
    if (ok) await setToolState(projectId, 'rdi', { estado: 'En proceso', fecha: new Date().toLocaleDateString('es-CL') });
  };

  const eliminar = async (id: string) => {
    if (readOnly) return;
    const next: RdiState = { rdis: data.rdis.filter(r => r.id !== id) };
    setData(next); await save(next);
  };

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para registrar requerimientos de información.</p></div>
  );

  const lista = data.rdis;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.FileQuestion size={22} strokeWidth={1.4} /> Registro RDI
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Requerimientos de Información (RDI) con tema, subtema, título, contenido, participantes y adjuntos.
        <span style={{ marginLeft: 6, opacity: 0.6 }}>[{isCloud ? 'NUBE' : 'LOCAL'}]</span>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {/* ── FORMULARIO NUEVA RDI ── */}
        <div className="tool-panel" style={{ flex: '1 1 360px' }}>
          <div className="module-header">| NUEVO RDI</div>
          <div className="panel-content">
            <div className="ab-form-grid">
              <div className="tech-input-group"><label>Tema (1.1–1.5)</label>
                <select className="tech-select" value={tema} disabled={readOnly} onChange={e => cambiarTema(e.target.value)}>
                  {TEMAS_KEYS.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div className="tech-input-group"><label>Sub-tema</label>
                <select className="tech-select" value={subtema} disabled={readOnly} onChange={e => setSubtema(e.target.value)}>
                  {(TEMAS_LOD[tema] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="tech-input-group col-span-full"><label>Título del RDI</label>
                <input className="tech-input" value={titulo} disabled={readOnly} onChange={e => setTitulo(e.target.value)} placeholder="Título del requerimiento de información" /></div>
              <div className="tech-input-group col-span-full"><label>Contenido</label>
                <textarea rows={3} className="tech-input" value={contenido} disabled={readOnly} onChange={e => setContenido(e.target.value)} placeholder="Detalle del requerimiento…" /></div>
            </div>

            {/* Participantes */}
            <div className="tech-input-group" style={{ marginTop: 10 }}><label>Participantes (otros usuarios o personas sin cuenta)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="tech-input" value={partInput} disabled={readOnly} placeholder="Escribe un nombre y +"
                  onChange={e => setPartInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPartInput(); } }} />
                <button type="button" className="technical-btn" disabled={readOnly} style={{ fontSize: 11 }} onClick={addPartInput}>+ Añadir</button>
              </div>
              {parts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {parts.map(p => (
                    <span key={p} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid var(--ab-border,#ccc)', display: 'inline-flex', alignItems: 'center', gap: 5, background: p.includes('(sin cuenta)') ? 'rgba(217,119,6,.12)' : 'var(--ab-panel-2,rgba(0,0,0,.03))' }}>
                      {p.includes('(sin cuenta)') ? '✦' : '👤'} {p}
                      <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setParts(x => x.filter(y => y !== p))}>✕</span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5 }}>Sugeridos:{' '}
                {USERS.filter(u => u !== CURRENT_USER).map((u, i) => (
                  <span key={u}>
                    <span style={{ color: '#6d28d9', cursor: 'pointer' }} onClick={() => togglePart(u)}>{u}</span>
                    {i < USERS.length - 2 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* Adjuntos */}
            <div className="tech-input-group" style={{ marginTop: 10 }}><label>Adjuntar archivos o imágenes</label>
              <label style={{ display: 'block', border: '1.5px dashed var(--ab-border,#bbb)', borderRadius: 8, padding: 10, textAlign: 'center', cursor: readOnly || subiendo ? 'default' : 'pointer', fontSize: 12, opacity: subiendo ? 0.6 : 0.85 }}>
                {subiendo ? '⏳ Subiendo…' : '📎 Haz clic para adjuntar (PDF, imágenes, Word, Excel · máx 25 MB)'}
                <input type="file" multiple disabled={readOnly || subiendo} style={{ display: 'none' }}
                  onChange={e => { void onPickFiles(e.target.files); e.target.value = ''; }} />
              </label>
              {adj.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {adj.map(a => (
                    <span key={a.uuid} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid var(--ab-border,#ccc)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      📎 {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{a.name}</a> : a.name}
                      <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setAdj(x => x.filter(y => y !== a))}>✕</span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5 }}>
                <Icons.Lock size={11} /> Premium: el binario sube a Storage (UUID); Free: queda como metadato local.
              </div>
            </div>

            {aviso && <p style={{ color: 'var(--destructive)', fontSize: 11, marginTop: 8 }}>{aviso}</p>}
            <button type="button" className="technical-btn" disabled={readOnly} style={{ marginTop: 12 }} onClick={() => void guardarRdi()}>
              + [ GUARDAR RDI ]
            </button>
          </div>
        </div>

        {/* ── LISTADO DE RDI ── */}
        <div className="tool-panel" style={{ flex: '2 1 420px' }}>
          <div className="module-header" style={{ justifyContent: 'space-between' }}>
            <span>| RDI REGISTRADOS</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{lista.length} registro(s)</span>
          </div>
          <div className="panel-content">
            {loading && <p className="tech-quote">Cargando…</p>}
            {!loading && lista.length === 0 && <p className="tech-quote">Aún no hay RDI registrados.</p>}
            {lista.map(r => (
              <div key={r.id} style={{ border: '1px solid var(--ab-border,#ddd)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.fecha} · <strong>{r.tema}</strong> · {r.subtema}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{r.titulo || '(sin título)'}</div>
                    {r.contenido && <div style={{ fontSize: 12, marginTop: 4, whiteSpace: 'pre-wrap' }}>{r.contenido}</div>}
                    {(r.participantes.length > 0 || r.adjuntos.length > 0) && (
                      <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {r.participantes.length > 0 && <span>👤 {r.participantes.join(', ')}</span>}
                        {r.adjuntos.length > 0 && <span>📎 {r.adjuntos.length} adjunto(s)</span>}
                      </div>
                    )}
                    {r.adjuntos.some(a => a.url) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                        {r.adjuntos.filter(a => a.url).map(a => (
                          <a key={a.uuid} href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#6d28d9' }}>📎 {a.name}</a>
                        ))}
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <button type="button" className="technical-btn secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => void eliminar(r.id)}>
                      <Icons.Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
