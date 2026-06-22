/* =============================================================================
   LibroObrasDigitalView.tsx — LIBRO DE OBRAS DIGITAL (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // MOCKUP — Estado SOLO en memoria. NO Firestore/Storage/counters/paginación.
   // Demuestra: sub-libros 🔒 cerrado → 📖 Acta de Apertura → folios; nueva entrada
   // tipificada (LOD); archivar/restaurar (estado activo|archivado).
   // Real: useToolData + projects/{pid}/obraDigital/libros/{id}/entradas (cursores),
   // adjuntos UUID (Premium), permisos denormalizados. Ref: DESARROLLO/LOD y COD/.
   // tier: premium · tool independiente de Carpeta Digital (decisión HITL B).
   ============================================================================= */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import type { ToolProps } from '../core/types';

type EstadoFolio = 'activo' | 'archivado';
interface Folio {
  folio: number; fecha: string; ym: string; libroId: string;
  tema: string; subtema: string; texto: string; estado: EstadoFolio; apertura: boolean;
}
interface Libro { id: string; nombre: string; abierto: boolean; aperturaFecha?: string; }

const LIBROS_SEED: Libro[] = [
  { id: 'maestro', nombre: 'Libro Maestro', abierto: false },
  { id: 'comunic', nombre: 'Comunicaciones', abierto: false },
  { id: 'estruct', nombre: 'Especialidad · Estructuras', abierto: false },
];
const FORMATOS = [
  'Comunicación 1.1', 'Comunicación 1.2', 'Comunicación 1.3', 'Comunicación 1.4',
  'Comunicación 1.5', 'Incidente 2.1', 'Reporte ejecutivo 2.2', 'Formato libre',
];
const hoy = () => new Date().toISOString().slice(0, 10);

export default function LibroObrasDigitalView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [libros, setLibros] = useState<Libro[]>(LIBROS_SEED);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [sel, setSel] = useState<string>('maestro');
  const [verArchivados, setVerArchivados] = useState(false);
  const [contador, setContador] = useState(1);

  // formularios
  const [aperturaFecha, setAperturaFecha] = useState(hoy());
  const [aperturaTexto, setAperturaTexto] = useState('');
  const [neFormato, setNeFormato] = useState<string>(FORMATOS[0] ?? 'Formato libre');
  const [neSubtema, setNeSubtema] = useState('');
  const [neTexto, setNeTexto] = useState('');

  const libro = libros.find(l => l.id === sel);
  const foliosLibro = useMemo(
    () => folios.filter(f => f.libroId === sel && f.estado === 'activo').sort((a, b) => b.folio - a.folio),
    [folios, sel],
  );
  const archivados = useMemo(() => folios.filter(f => f.estado === 'archivado'), [folios]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para abrir el Libro de Obras.</p></div>
  );

  const abrirLibro = () => {
    if (readOnly || !libro) return;
    const f: Folio = {
      folio: contador, fecha: aperturaFecha, ym: aperturaFecha.slice(0, 7), libroId: libro.id,
      tema: 'Apertura', subtema: 'Acta de apertura del libro de obras',
      texto: aperturaTexto || 'Apertura del libro de obras.', estado: 'activo', apertura: true,
    };
    setFolios(p => [...p, f]);
    setContador(c => c + 1);
    setLibros(p => p.map(l => l.id === libro.id ? { ...l, abierto: true, aperturaFecha } : l));
    setAperturaTexto('');
  };

  const nuevaEntrada = () => {
    if (readOnly || !libro?.abierto) return;
    const f: Folio = {
      folio: contador, fecha: hoy(), ym: hoy().slice(0, 7), libroId: libro.id,
      tema: neFormato, subtema: neSubtema || neFormato, texto: neTexto, estado: 'activo', apertura: false,
    };
    setFolios(p => [...p, f]);
    setContador(c => c + 1);
    setNeSubtema(''); setNeTexto('');
  };

  const setEstadoFolio = (folio: number, estado: EstadoFolio) =>
    setFolios(p => p.map(f => f.folio === folio ? { ...f, estado } : f));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Notebook size={22} strokeWidth={1.4} /> Libro de Obras Digital
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#9a6700', color: '#fff' }}>MOCKUP</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#6d28d9', color: '#fff' }}>PREMIUM</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 16 }}>
        Proyecto: <strong>{project.name}</strong> · Registro de comunicaciones formales (estándar LOD): apertura con acta, folios y archivado.
      </p>

      <div className="ab-split">
        {/* IZQUIERDA · índice de sub-libros */}
        <div className="tool-panel ab-split-left">
          <div className="module-header">| SUB-LIBROS</div>
          <div className="panel-content">
            {libros.map(l => {
              const n = folios.filter(f => f.libroId === l.id && f.estado === 'activo').length;
              return (
                <button key={l.id} type="button" onClick={() => { setSel(l.id); setVerArchivados(false); }}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 4,
                    border: `1px solid ${sel === l.id && !verArchivados ? '#6d28d9' : 'var(--ab-border, #ddd)'}`, borderRadius: 6, cursor: 'pointer',
                    background: sel === l.id && !verArchivados ? 'rgba(109,40,217,.08)' : 'transparent', textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{l.abierto ? '📖' : '🔒'} {l.nombre}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{l.abierto ? `${n} folio(s)` : 'cerrado'}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setVerArchivados(true)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, border: '1px dashed var(--ab-border, #ccc)', borderRadius: 6, cursor: 'pointer',
                background: verArchivados ? 'rgba(0,0,0,.05)' : 'transparent', textAlign: 'left', fontSize: 12 }}>
              🗃️ Archivados ({archivados.length})
            </button>
            <p style={{ fontSize: 10, opacity: 0.55, marginTop: 8 }}>+ Agregar libro (registra un sub-libro que nace cerrado) — disponible en el desarrollo real.</p>
          </div>
        </div>

        {/* DERECHA · detalle */}
        <div className="ab-split-right">
          <div className="tool-panel">
            <div className="panel-content">
              {verArchivados ? (
                <>
                  <div className="module-header">| 🗃️ ARCHIVADOS</div>
                  {archivados.length === 0 ? <p className="tech-quote">No hay entradas archivadas.</p> : archivados.map(f => (
                    <div key={f.folio} style={{ borderBottom: '1px solid var(--ab-border,#eee)', padding: '6px 0', fontSize: 12 }}>
                      <strong>#{f.folio}</strong> · {libros.find(l => l.id === f.libroId)?.nombre} · {f.subtema}
                      <button type="button" disabled={readOnly} onClick={() => setEstadoFolio(f.folio, 'activo')}
                        className="technical-btn" style={{ float: 'right', fontSize: 10, padding: '2px 8px' }}>♻ Restaurar</button>
                    </div>
                  ))}
                </>
              ) : !libro?.abierto ? (
                <>
                  <div className="module-header">| 🔒 LIBRO CERRADO · ABRIR LIBRO DE OBRAS</div>
                  <p className="tech-quote" style={{ marginBottom: 8 }}>
                    El libro <strong>{libro?.nombre}</strong> nace cerrado. El Inspector Fiscal lo abre registrando el <strong>Acta de Apertura</strong>.
                  </p>
                  <div className="ab-form-grid">
                    <div className="tech-input-group"><label>Fecha de apertura</label>
                      <input type="date" className="tech-input" value={aperturaFecha} disabled={readOnly} onChange={e => setAperturaFecha(e.target.value)} /></div>
                    <div className="tech-input-group col-span-full"><label>Indicaciones de apertura (texto libre)</label>
                      <textarea rows={3} className="tech-input" value={aperturaTexto} disabled={readOnly} onChange={e => setAperturaTexto(e.target.value)} /></div>
                  </div>
                  <button type="button" className="technical-btn" disabled={readOnly} onClick={abrirLibro} style={{ marginTop: 10 }}>📖 [ ABRIR LIBRO DE OBRAS ]</button>
                </>
              ) : (
                <>
                  <div className="module-header">| {libro.nombre} · NUEVA ENTRADA</div>
                  <div className="ab-form-grid">
                    <div className="tech-input-group"><label>Formato (LOD)</label>
                      <select className="tech-select" value={neFormato} disabled={readOnly} onChange={e => setNeFormato(e.target.value)}>
                        {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select></div>
                    <div className="tech-input-group"><label>Asunto / subtema</label>
                      <input className="tech-input" value={neSubtema} disabled={readOnly} onChange={e => setNeSubtema(e.target.value)} placeholder="Ej: Instrucción de obra" /></div>
                    <div className="tech-input-group col-span-full"><label>Texto de la entrada</label>
                      <textarea rows={2} className="tech-input" value={neTexto} disabled={readOnly} onChange={e => setNeTexto(e.target.value)} /></div>
                  </div>
                  <p style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, margin: '6px 0' }}>
                    <Icons.Lock size={11} /> Adjuntos (archivos/imágenes UUID) en el módulo Premium real.
                  </p>
                  <button type="button" className="technical-btn" disabled={readOnly || !neTexto.trim()} onClick={nuevaEntrada}>+ [ AGREGAR FOLIO ]</button>

                  <div className="module-header" style={{ marginTop: 16 }}>| FOLIOS ({foliosLibro.length})</div>
                  {foliosLibro.length === 0 ? <p className="tech-quote">Sin folios activos.</p> : foliosLibro.map(f => (
                    <div key={f.folio} style={{ border: '1px solid var(--ab-border,#eee)', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                        <span>#{f.folio} · {f.fecha} {f.apertura && <span style={{ background: '#1f7a3d', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 9 }}>ACTA</span>}</span>
                        <button type="button" disabled={readOnly} onClick={() => setEstadoFolio(f.folio, 'archivado')}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 11 }}>📥 Archivar</button>
                      </div>
                      <div style={{ fontSize: 12, marginTop: 2 }}><strong>{f.tema}</strong> · {f.subtema}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>{f.texto}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
