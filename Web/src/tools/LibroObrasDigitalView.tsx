/* =============================================================================
   LibroObrasDigitalView.tsx — LIBRO DE OBRAS DIGITAL (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // PRODUCCIÓN (MVP) — Persiste el árbol completo {libros,folios,seq,perms} como
   // documento único en la subcolección propia projects/{pid}/libroObras/state
   // (Premium→Firestore zero-trust · Free→localStorage ab-libro-obras-{pid}), con
   // botón [GUARDAR] y avance del expediente (toolStates[libro-obras], S7).
   // Sub-libros + Acta de Apertura + folios tipificados LOD + archivar/restaurar.
   // Datos LOD: GLOSARIO_Normativo_ObraDigital.md §3–§5 / index.html (prototipo).
   // Futuro: subcolección por folio con cursores + adjuntos UUID (Storage Premium)
   //   + counters Año→Mes + permisos denormalizados. tier: premium.
   ============================================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react'; // doc-por-folio + Storage UUID
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useProjects } from '../core/db/ProjectProvider';
import {
  cargarLibro, cargarMasFolios, putFolio, guardarMeta, nextFolioNumero,
} from './obra/libroStore';
import { subirAdjunto, borrarAdjunto, AdjuntoDemasiadoGrande } from './obra/storageUpload';
import type { ToolProps, ObraAdjunto } from '../core/types';

/* ── usuarios / permisos ── */
const CURRENT_USER = 'M. Soto (IF)';
const USERS = ['M. Soto (IF)', 'J. Pérez', 'C. Rojas', 'P. Díaz', 'Contratista'];
type Nivel = 'sin' | 'lectura' | 'escritura' | 'edicion';
const NIVELES: Nivel[] = ['sin', 'lectura', 'escritura', 'edicion'];
const NIV_LABEL: Record<Nivel, string> = { sin: 'sin acceso', lectura: 'lectura', escritura: 'escritura', edicion: 'edición' };
const NIV_COLOR: Record<Nivel, string> = { sin: '#9ca3af', lectura: '#2563eb', escritura: '#d97706', edicion: '#16a34a' };

/* ── formatos de entrada LOD ── */
const FORMATOS = [
  { id: 'comunicacion', label: 'Comunicación (1.1–1.5)' },
  { id: 'incidente', label: 'Incidente (2.1)' },
  { id: 'ejecutivo', label: 'Rep. Ejecutivo (2.2)' },
  { id: 'libre', label: 'Formato libre' },
] as const;
type FormatoId = typeof FORMATOS[number]['id'];

/* subtemas por tema (Libro de Obra · puntos 1.1–1.5) */
const TEMAS_LOD: Record<string, string[]> = {
  '1.1 Gestión de la Calidad': ['Plan de Calidad: Plan inicial y modificaciones.', 'Acta de exposición y reuniones de Calidad', 'Calidad de los materiales', 'Auditorías Internas'],
  '1.2 Prevención de Riesgos': ['Reunión de inicio de prevención de riesgos', 'Aviso de inicio al Organismo administrador del Seguro', 'Plan y Programa: Plan y programa inicial, modificaciones', 'Informes Cumplimiento Programa', 'Comité Paritario', 'Accidentes', 'Fiscalizaciones'],
  '1.3 Medio Ambiente': ['Plan de Gestión Ambiental', 'Presentación del Planes de Manejo', 'Fiscalizaciones'],
  '1.4 Participación Ciudadana': ['Plan de Participación Ciudadana', 'Actas reuniones participación Ciudadana y/o Indígena', 'Material Informativo', 'Sugerencias y Reclamos'],
  '1.5 Otras Comunicaciones': ['Letrero de identificación', 'Señalización y Medidas de Seguridad', 'Programa de trabajo, inversiones y mano de obra', 'Permisos para la ejecución de la obra', 'Gestión del Personal', 'Carpeta Laboral', 'Estados de Pago', 'Garantías', 'Canje de Retenciones', 'Modificación de Obra', 'Subcontratos', 'Valores proforma', 'Informes mensuales', 'Recepción de Etapas', 'Término de Obra'],
};
const TEMAS_KEYS = Object.keys(TEMAS_LOD);
const INCID_TIPOS = ['Accidente', 'Paralización', 'Problema de suministros', 'Derrumbe', 'Otro'];
const ESTADO_CONTRATO = ['ejecución', 'terminado', 'terminado anticipado', 'paralizado'];
/* tema por defecto según el tipo de libro */
const LIBRO_TEMA: Record<string, string> = { calidad: '1.1 Gestión de la Calidad', pr: '1.2 Prevención de Riesgos', ma: '1.3 Medio Ambiente', pc: '1.4 Participación Ciudadana' };

/* ── catálogo "agregar libro" ── */
const TEMATICOS: { tipo: string; nombre: string }[] = [
  { tipo: 'comunic', nombre: 'Comunicaciones' }, { tipo: 'calidad', nombre: 'Gestión de Calidad' },
  { tipo: 'pr', nombre: 'Prevención de Riesgos' }, { tipo: 'ma', nombre: 'Medio Ambiente' },
  { tipo: 'pc', nombre: 'Participación Ciudadana' },
];
const ESPECIALIDADES = ['Estructuras', 'Sanitario', 'Electricidad', 'Topografía', 'Laboratorio'];

type EstadoFolio = 'activo' | 'archivado';
interface Folio {
  folio: string; fecha: string; libroId: string; formato: FormatoId; incid: boolean;
  tema: string; subtema: string; texto: string;
  vinc: string[]; participantes: string[]; adjuntos: ObraAdjunto[]; estado: EstadoFolio; apertura: boolean;
}
interface Libro { id: string; nombre: string; tipo: string; abierto: boolean; aperturaFecha?: string; }

const LIBROS_SEED: Libro[] = [
  { id: 'maestro', nombre: 'Libro de Obras (Maestro)', tipo: 'maestro', abierto: false },
  { id: 'comunic', nombre: 'Comunicaciones', tipo: 'comunic', abierto: false },
  { id: 'calidad', nombre: 'Gestión de Calidad', tipo: 'calidad', abierto: false },
  { id: 'pr', nombre: 'Prevención de Riesgos', tipo: 'pr', abierto: false },
];
const hoy = () => new Date().toISOString().slice(0, 10);

/** Adjunto sin subida real (modo Free/local o degradación): solo metadato. */
const localAdj = (f: File): ObraAdjunto => ({
  uuid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: f.name, size: f.size, type: f.type, url: '', path: '',
});

/** Normaliza adjuntos legados (string[] de nombres) al contrato ObraAdjunto[]. */
function normalizeFolio(f: Folio): Folio {
  const list = (f.adjuntos ?? []) as unknown as (string | ObraAdjunto)[];
  const adjuntos: ObraAdjunto[] = list.map(a =>
    typeof a === 'string' ? { uuid: '', name: a, size: 0, type: '', url: '', path: '' } : a);
  return { ...f, adjuntos };
}

export default function LibroObrasDigitalView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, setToolState, repo } = useProjects();
  const project = getProject(projectId);
  const isCloud = repo.kind === 'cloud';

  const [libros, setLibros] = useState<Libro[]>(LIBROS_SEED);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [sel, setSel] = useState<string>('maestro');
  const [verArchivados, setVerArchivados] = useState(false);
  // Counters Año→Mes (numeración AAAA-MM-NNN) + cursor de paginación (cloud).
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const ordRef = useRef(Date.now()); // _ord monótono para ordenar folios nuevos

  // apertura
  const [aperturaFecha, setAperturaFecha] = useState(hoy());
  const [aperturaTexto, setAperturaTexto] = useState('');

  // nueva entrada
  const [neFormato, setNeFormato] = useState<FormatoId>('comunicacion');
  const [neTema, setNeTema] = useState<string>(TEMAS_KEYS[0] ?? '');
  const [neSubtema, setNeSubtema] = useState<string>(TEMAS_LOD[TEMAS_KEYS[0] ?? '']?.[0] ?? '');
  const [neTitulo, setNeTitulo] = useState('');
  const [neTexto, setNeTexto] = useState('');
  const [neIncidTipo, setNeIncidTipo] = useState(INCID_TIPOS[0] ?? '');
  const [neEstado, setNeEstado] = useState(ESTADO_CONTRATO[0] ?? '');
  const [neVinc, setNeVinc] = useState<string[]>([]);
  const [neParts, setNeParts] = useState<string[]>([]);
  const [partInput, setPartInput] = useState('');
  const [neAdj, setNeAdj] = useState<ObraAdjunto[]>([]);

  // compartir
  const [showShare, setShowShare] = useState(false);
  const [perms, setPerms] = useState<Record<string, Nivel>>(
    { 'M. Soto (IF)': 'edicion', 'J. Pérez': 'escritura', 'C. Rojas': 'lectura', 'P. Díaz': 'lectura', Contratista: 'sin' },
  );

  // agregar libro
  const [showAddLibro, setShowAddLibro] = useState(false);
  const [addModo, setAddModo] = useState<'tematico' | 'especialidad'>('tematico');
  const [addTema, setAddTema] = useState(TEMATICOS[0]?.nombre ?? '');
  const [addEsp, setAddEsp] = useState<string[]>([]);
  const [addEspNew, setAddEspNew] = useState('');
  const [guardado, setGuardado] = useState(false);

  // ── Persistencia doc-por-folio: META projects/{pid}/libroObras/state + FOLIOS
  //    .../state/folios/{id}. Premium→Firestore (granular + paginación · migración
  //    one-time del MVP) · Free→localStorage. Ver obra/libroStore.ts.
  const hidratadoRef = useRef(false);
  useEffect(() => {
    if (!projectId || hidratadoRef.current) return;
    hidratadoRef.current = true;
    let alive = true;
    void (async () => {
      const { meta, folios: fs, cursor: cur } = await cargarLibro(projectId, isCloud);
      if (!alive) return;
      if (meta) {
        setLibros(meta.libros.length ? meta.libros : LIBROS_SEED);
        if (meta.perms && Object.keys(meta.perms).length) setPerms(meta.perms);
        setCounters(meta.counters ?? {});
      }
      setFolios(fs.map(normalizeFolio));
      setCursor(cur);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isCloud]);

  /** Persiste meta + (cloud) el folio tocado por su doc, y refleja el avance S7. */
  const persistir = async (
    foliosNext: Folio[], librosNext: Libro[], countersNext: Record<string, number>,
    folioTocado?: Folio, ord?: number,
  ) => {
    if (!projectId) return;
    if (isCloud && folioTocado && ord !== undefined) await putFolio(projectId, true, folioTocado, ord);
    await guardarMeta(projectId, isCloud, { libros: librosNext, perms, counters: countersNext }, foliosNext);
    await setToolState(projectId, 'libro-obras', {
      estado: foliosNext.some(f => f.estado === 'activo') ? 'Completado' : 'En proceso',
      fecha: new Date().toLocaleDateString('es-CL'),
    });
  };

  const guardar = async () => {
    if (!projectId) return;
    const ok = await guardarMeta(projectId, isCloud, { libros, perms, counters }, folios);
    if (ok) {
      await setToolState(projectId, 'libro-obras', {
        estado: folios.some(f => f.estado === 'activo') ? 'Completado' : 'En proceso',
        fecha: new Date().toLocaleDateString('es-CL'),
      });
    }
    setGuardado(ok);
    if (ok) window.setTimeout(() => setGuardado(false), 2000);
  };

  const cargarMas = async () => {
    if (!projectId || !cursor || cargandoMas) return;
    setCargandoMas(true);
    try {
      const r = await cargarMasFolios(projectId, cursor);
      setFolios(p => [...p, ...r.folios.map(normalizeFolio)]);
      setCursor(r.cursor);
    } finally { setCargandoMas(false); }
  };

  const libro = libros.find(l => l.id === sel);
  const foliosLibro = useMemo(
    () => folios.filter(f => f.libroId === sel && f.estado === 'activo').sort((a, b) => Number(b.folio.replace(/\D/g, '')) - Number(a.folio.replace(/\D/g, ''))),
    [folios, sel],
  );
  const archivados = useMemo(() => folios.filter(f => f.estado === 'archivado'), [folios]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para abrir el Libro de Obras.</p></div>
  );

  const seleccionarLibro = (id: string) => {
    setSel(id); setVerArchivados(false);
    const l = libros.find(x => x.id === id);
    const def = l ? LIBRO_TEMA[l.tipo] : undefined;
    if (def && TEMAS_LOD[def]) { setNeTema(def); setNeSubtema(TEMAS_LOD[def]?.[0] ?? ''); }
    setNeVinc(l ? [l.nombre] : []);
  };
  const cambiarTema = (t: string) => { setNeTema(t); setNeSubtema(TEMAS_LOD[t]?.[0] ?? ''); };

  const abrirLibro = () => {
    if (readOnly || !libro) return;
    const { numero, counters: c2 } = nextFolioNumero(counters, new Date(aperturaFecha || hoy()));
    const f: Folio = {
      folio: numero, fecha: aperturaFecha, libroId: libro.id, formato: 'libre', incid: false,
      tema: 'Apertura', subtema: 'Acta de apertura del libro de obras',
      texto: aperturaTexto || 'Apertura del libro de obras.', vinc: [libro.nombre], participantes: [], adjuntos: [],
      estado: 'activo', apertura: true,
    };
    const ord = ordRef.current++;
    const foliosNext = [f, ...folios];
    const librosNext = libros.map(l => l.id === libro.id ? { ...l, abierto: true, aperturaFecha } : l);
    setFolios(foliosNext); setCounters(c2); setLibros(librosNext);
    setAperturaTexto('');
    if (neVinc.length === 0) setNeVinc([libro.nombre]);
    void persistir(foliosNext, librosNext, c2, f, ord);
  };

  const togglePart = (u: string) => setNeParts(p => p.includes(u) ? p : [...p, u]);
  const addPartInput = () => {
    const v = partInput.trim(); if (!v) return;
    const label = USERS.includes(v) ? v : `${v} (sin cuenta)`;
    setNeParts(p => p.includes(label) ? p : [...p, label]); setPartInput('');
  };
  const toggleVinc = (nombre: string) =>
    setNeVinc(p => p.includes(nombre) ? p.filter(x => x !== nombre) : [...p, nombre]);

  const nuevaEntrada = () => {
    if (readOnly || !libro?.abierto) return;
    let tema = '', subtema = '', texto = '';
    if (neFormato === 'comunicacion') { tema = neTema.split(' ').slice(0, 2).join(' '); subtema = neSubtema; texto = neTitulo.trim() || neSubtema; }
    else if (neFormato === 'incidente') { tema = '2.1 Inc.'; subtema = neIncidTipo; texto = neTexto.trim() || 'Sin detalle'; }
    else if (neFormato === 'ejecutivo') { tema = '2.2 Ejec.'; subtema = 'Reporte Ejecutivo Mensual'; texto = 'Estado: ' + neEstado; }
    else { tema = 'Libre'; subtema = neTitulo.trim() || 'Entrada libre'; texto = neTexto.trim() || neTitulo.trim(); }
    const { numero, counters: c2 } = nextFolioNumero(counters);
    const f: Folio = {
      folio: numero, fecha: hoy(), libroId: libro.id, formato: neFormato,
      incid: neFormato === 'incidente', tema, subtema, texto,
      vinc: neVinc.length ? [...new Set(neVinc)] : [libro.nombre], participantes: [...neParts], adjuntos: [...neAdj],
      estado: 'activo', apertura: false,
    };
    const ord = ordRef.current++;
    const foliosNext = [f, ...folios];
    setFolios(foliosNext); setCounters(c2);
    setNeTitulo(''); setNeTexto(''); setNeParts([]); setNeAdj([]); setNeVinc([libro.nombre]);
    void persistir(foliosNext, libros, c2, f, ord);
  };

  const setEstadoFolio = (folio: string, estado: EstadoFolio) => {
    const foliosNext = folios.map(f => f.folio === folio ? { ...f, estado } : f);
    setFolios(foliosNext);
    const tocado = foliosNext.find(f => f.folio === folio);
    void persistir(foliosNext, libros, counters, tocado, ordRef.current++);
  };

  const onPickFiles = async (files: FileList | null) => {
    if (readOnly || !files || !files.length || !projectId) return;
    setSubiendo(true);
    try {
      const nuevos: ObraAdjunto[] = [];
      for (const file of Array.from(files)) {
        if (isCloud) {
          try { nuevos.push(await subirAdjunto(projectId, 'libro', file)); }
          catch (err) {
            if (err instanceof AdjuntoDemasiadoGrande) window.alert(`"${file.name}" supera 25 MB.`);
            else nuevos.push(localAdj(file)); // sin nube/permiso → metadato local
          }
        } else nuevos.push(localAdj(file));
      }
      if (nuevos.length) setNeAdj(p => [...p, ...nuevos]);
    } finally { setSubiendo(false); }
  };

  const quitarAdjNuevo = (uuid: string) => {
    const a = neAdj.find(x => x.uuid === uuid);
    if (a?.path) void borrarAdjunto(a.path); // limpia el binario huérfano en Storage
    setNeAdj(p => p.filter(x => x.uuid !== uuid));
  };
  const ciclarPerm = (u: string) =>
    setPerms(p => ({ ...p, [u]: NIVELES[(NIVELES.indexOf(p[u] ?? 'sin') + 1) % NIVELES.length] ?? 'sin' }));

  const agregarLibro = () => {
    if (readOnly) return;
    let nombre = '', tipo = '';
    if (addModo === 'tematico') { const t = TEMATICOS.find(x => x.nombre === addTema); nombre = addTema; tipo = t?.tipo ?? 'tematico'; }
    else { if (!addEsp.length) return; nombre = addEsp.join(' + '); tipo = 'especialidad'; }
    const id = 'b' + Date.now();
    setLibros(p => [...p, { id, nombre, tipo, abierto: false }]);
    setShowAddLibro(false); setAddEsp([]); setAddEspNew('');
    seleccionarLibro(id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, flexWrap: 'wrap' }}>
        <Icons.Notebook size={22} strokeWidth={1.4} /> Libro de Obras Digital
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
        Proyecto: <strong>{project.name}</strong> · Registro de comunicaciones formales (estándar LOD): apertura con acta, folios tipificados y archivado.
      </p>

      {showShare && (
        <div className="tool-panel" style={{ marginBottom: 12 }}>
          <div className="module-header">| COMPARTIR LIBRO DE OBRAS · permiso por usuario</div>
          <div className="panel-content">
            <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>Clic en el permiso de cada usuario para alternar: sin acceso → lectura → escritura → edición. Específico del Libro de Obras.</p>
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

      <div className="ab-split">
        {/* IZQUIERDA · índice de sub-libros */}
        <div className="tool-panel ab-split-left">
          <div className="module-header">| SUB-LIBROS</div>
          <div className="panel-content">
            {libros.map(l => {
              const n = folios.filter(f => f.libroId === l.id && f.estado === 'activo').length;
              return (
                <button key={l.id} type="button" onClick={() => seleccionarLibro(l.id)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 4,
                    border: `1px solid ${sel === l.id && !verArchivados ? '#6d28d9' : 'var(--ab-border, #ddd)'}`, borderRadius: 6, cursor: 'pointer',
                    background: sel === l.id && !verArchivados ? 'rgba(109,40,217,.08)' : 'transparent', textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{l.abierto ? '📖' : '🔒'} {l.nombre}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{l.abierto ? `${n} folio(s)` : 'cerrado'}</span>
                </button>
              );
            })}

            {!showAddLibro ? (
              <button type="button" disabled={readOnly} onClick={() => setShowAddLibro(true)}
                style={{ width: '100%', padding: '7px 10px', marginTop: 6, border: '1px solid var(--ab-border,#ccc)', borderRadius: 6, cursor: 'pointer', background: 'transparent', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>
                + Agregar libro
              </button>
            ) : (
              <div style={{ marginTop: 6, border: '1px solid #6d28d9', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {(['tematico', 'especialidad'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setAddModo(m)}
                      style={{ flex: 1, fontSize: 11, padding: '4px 6px', borderRadius: 5, cursor: 'pointer',
                        border: `1px solid ${addModo === m ? '#6d28d9' : 'var(--ab-border,#ccc)'}`,
                        background: addModo === m ? 'rgba(109,40,217,.08)' : 'transparent' }}>
                      {m === 'tematico' ? 'Temático' : 'Especialidad'}
                    </button>
                  ))}
                </div>
                {addModo === 'tematico' ? (
                  <select className="tech-select" value={addTema} onChange={e => setAddTema(e.target.value)} style={{ width: '100%', fontSize: 11 }}>
                    {TEMATICOS.map(t => <option key={t.tipo} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {ESPECIALIDADES.map(e => {
                        const on = addEsp.includes(e);
                        return (
                          <button key={e} type="button" onClick={() => setAddEsp(p => on ? p.filter(x => x !== e) : [...p, e])}
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                              border: `1px solid ${on ? '#6d28d9' : 'var(--ab-border,#ccc)'}`, background: on ? 'rgba(109,40,217,.08)' : 'transparent' }}>
                            {on ? '✓ ' : ''}{e}
                          </button>
                        );
                      })}
                      {addEsp.filter(e => !ESPECIALIDADES.includes(e)).map(e => (
                        <span key={e} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid #6d28d9', background: 'rgba(109,40,217,.08)' }}>✓ {e}</span>
                      ))}
                    </div>
                    <input className="tech-input" value={addEspNew} placeholder="Especialidad personalizada + Enter" style={{ fontSize: 11 }}
                      onChange={e => setAddEspNew(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = addEspNew.trim(); if (v) { setAddEsp(p => p.includes(v) ? p : [...p, v]); setAddEspNew(''); } } }} />
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button type="button" className="technical-btn" style={{ flex: 1, fontSize: 11 }} onClick={agregarLibro}>Agregar</button>
                  <button type="button" style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--ab-border,#ccc)', borderRadius: 5, background: 'transparent', cursor: 'pointer' }}
                    onClick={() => { setShowAddLibro(false); setAddEsp([]); setAddEspNew(''); }}>Cancelar</button>
                </div>
                <p style={{ fontSize: 10, opacity: 0.55, marginTop: 6 }}>El sub-libro nace 🔒 cerrado; se abre con su Acta de Apertura.</p>
              </div>
            )}

            <button type="button" onClick={() => setVerArchivados(true)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, border: '1px dashed var(--ab-border, #ccc)', borderRadius: 6, cursor: 'pointer',
                background: verArchivados ? 'rgba(0,0,0,.05)' : 'transparent', textAlign: 'left', fontSize: 12 }}>
              🗃️ Archivados ({archivados.length})
            </button>
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
                      <strong>{f.folio}</strong> · {libros.find(l => l.id === f.libroId)?.nombre} · {f.subtema}
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

                  {/* formato */}
                  <div className="tech-input-group" style={{ marginBottom: 8 }}><label>Formato de la entrada</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {FORMATOS.map(f => (
                        <button key={f.id} type="button" disabled={readOnly} onClick={() => setNeFormato(f.id)}
                          style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                            border: `1px solid ${neFormato === f.id ? '#6d28d9' : 'var(--ab-border,#ccc)'}`,
                            background: neFormato === f.id ? 'rgba(109,40,217,.08)' : 'transparent', fontWeight: neFormato === f.id ? 700 : 400 }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* cuerpo según formato */}
                  <div className="ab-form-grid">
                    {neFormato === 'comunicacion' && (
                      <>
                        <div className="tech-input-group"><label>Tema (1.1–1.5)</label>
                          <select className="tech-select" value={neTema} disabled={readOnly} onChange={e => cambiarTema(e.target.value)}>
                            {TEMAS_KEYS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select></div>
                        <div className="tech-input-group"><label>Sub-tema</label>
                          <select className="tech-select" value={neSubtema} disabled={readOnly} onChange={e => setNeSubtema(e.target.value)}>
                            {(TEMAS_LOD[neTema] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                          </select></div>
                        <div className="tech-input-group col-span-full"><label>Título</label>
                          <input className="tech-input" value={neTitulo} disabled={readOnly} onChange={e => setNeTitulo(e.target.value)} placeholder="Título de la comunicación" /></div>
                      </>
                    )}
                    {neFormato === 'incidente' && (
                      <>
                        <div className="tech-input-group"><label>Tipo de incidente</label>
                          <select className="tech-select" value={neIncidTipo} disabled={readOnly} onChange={e => setNeIncidTipo(e.target.value)}>
                            {INCID_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select></div>
                        <div className="tech-input-group col-span-full"><label>Detalle del incidente</label>
                          <textarea rows={2} className="tech-input" value={neTexto} disabled={readOnly} onChange={e => setNeTexto(e.target.value)}
                            placeholder="Evento que pone en riesgo el desarrollo del contrato…" /></div>
                      </>
                    )}
                    {neFormato === 'ejecutivo' && (
                      <>
                        <div className="tech-input-group"><label>Estado del contrato</label>
                          <select className="tech-select" value={neEstado} disabled={readOnly} onChange={e => setNeEstado(e.target.value)}>
                            {ESTADO_CONTRATO.map(s => <option key={s} value={s}>{s}</option>)}
                          </select></div>
                        <div className="tech-input-group col-span-full" style={{ fontSize: 10, opacity: 0.6, alignSelf: 'center' }}>
                          ⓘ Reporte 2.2 — incluye además Avance Físico/Financiero, Mano de Obra, PR, Calidad, MA y PC (2.2.2–2.2.7).
                        </div>
                      </>
                    )}
                    {neFormato === 'libre' && (
                      <>
                        <div className="tech-input-group col-span-full"><label>Título</label>
                          <input className="tech-input" value={neTitulo} disabled={readOnly} onChange={e => setNeTitulo(e.target.value)} placeholder="Título de la entrada" /></div>
                        <div className="tech-input-group col-span-full"><label>Contenido</label>
                          <textarea rows={2} className="tech-input" value={neTexto} disabled={readOnly} onChange={e => setNeTexto(e.target.value)} placeholder="Texto libre…" /></div>
                      </>
                    )}
                  </div>

                  {/* Ver también en (libros vinculados) */}
                  <div className="tech-input-group" style={{ marginTop: 8 }}><label>Ver también en (libros vinculados)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {libros.map(l => {
                        const on = neVinc.includes(l.nombre);
                        return (
                          <button key={l.id} type="button" disabled={readOnly} onClick={() => toggleVinc(l.nombre)}
                            style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                              border: `1px solid ${on ? '#6d28d9' : 'var(--ab-border,#ccc)'}`, background: on ? 'rgba(109,40,217,.08)' : 'transparent', fontWeight: on ? 600 : 400 }}>
                            ⬡ {l.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Participantes */}
                  <div className="tech-input-group" style={{ marginTop: 8 }}><label>Participantes (otros usuarios o personas sin cuenta)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="tech-input" value={partInput} disabled={readOnly} placeholder="Escribe un nombre y +"
                        onChange={e => setPartInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPartInput(); } }} />
                      <button type="button" className="technical-btn" disabled={readOnly} style={{ fontSize: 11 }} onClick={addPartInput}>+ Añadir</button>
                    </div>
                    {neParts.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {neParts.map(p => (
                          <span key={p} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid var(--ab-border,#ccc)',
                            display: 'inline-flex', alignItems: 'center', gap: 5, background: p.includes('(sin cuenta)') ? 'rgba(217,119,6,.12)' : 'var(--ab-panel-2,rgba(0,0,0,.03))' }}>
                            {p.includes('(sin cuenta)') ? '✦' : '👤'} {p}
                            <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setNeParts(x => x.filter(y => y !== p))}>✕</span>
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

                  {/* Adjuntar archivos o imágenes (subida real a Storage · UUID) */}
                  <div className="tech-input-group" style={{ marginTop: 8 }}><label>Adjuntar archivos o imágenes</label>
                    <label style={{ display: 'block', border: '1.5px dashed var(--ab-border,#bbb)', borderRadius: 8, padding: 10, textAlign: 'center', cursor: readOnly || subiendo ? 'default' : 'pointer', fontSize: 12, opacity: subiendo ? 0.6 : 0.85 }}>
                      {subiendo ? '⏳ Subiendo…' : '📎 Haz clic para adjuntar (PDF, imágenes, Word, Excel · máx 25 MB)'}
                      <input type="file" multiple disabled={readOnly || subiendo} style={{ display: 'none' }}
                        onChange={e => { void onPickFiles(e.target.files); e.target.value = ''; }} />
                    </label>
                    {neAdj.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {neAdj.map(a => (
                          <span key={a.uuid} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid var(--ab-border,#ccc)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            📎 {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{a.name}</a> : a.name}
                            {!a.url && <span title="metadato sin binario en la nube" style={{ opacity: 0.5 }}>·local</span>}
                            <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => quitarAdjNuevo(a.uuid)}>✕</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, margin: '8px 0 6px' }}>
                    <Icons.Lock size={11} /> Autor ({CURRENT_USER}) y fecha se registran automáticamente. Premium: el binario sube a Storage con nombre UUID; Free: queda como metadato local.
                  </p>
                  <button type="button" className="technical-btn" disabled={readOnly} onClick={nuevaEntrada}>+ [ GUARDAR ENTRADA / FOLIO ]</button>

                  <div className="module-header" style={{ marginTop: 16 }}>| FOLIOS ({foliosLibro.length})</div>
                  {foliosLibro.length === 0 ? <p className="tech-quote">Sin folios activos.</p> : foliosLibro.map(f => (
                    <div key={f.folio} style={{ border: `1px solid ${f.incid ? 'rgba(217,119,6,.4)' : 'var(--ab-border,#eee)'}`, borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                        <span>{f.folio} · {f.fecha}
                          {f.apertura && <span style={{ background: '#1f7a3d', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 9, marginLeft: 6 }}>ACTA</span>}
                          {f.incid && <span style={{ background: '#d97706', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 9, marginLeft: 6 }}>INCIDENTE</span>}
                        </span>
                        <button type="button" disabled={readOnly} onClick={() => setEstadoFolio(f.folio, 'archivado')}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 11 }}>📥 Archivar</button>
                      </div>
                      <div style={{ fontSize: 12, marginTop: 2 }}><strong>{f.tema}</strong> · {f.subtema}</div>
                      {f.texto && <div style={{ fontSize: 12, opacity: 0.85 }}>{f.texto}</div>}
                      {f.vinc.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {f.vinc.map(v => <span key={v} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, border: '1px solid var(--ab-border,#ddd)', opacity: 0.8 }}>⬡ {v}</span>)}
                        </div>
                      )}
                      {(f.participantes.length > 0 || f.adjuntos.length > 0) && (
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: 'flex', gap: 12 }}>
                          {f.participantes.length > 0 && <span>👤 {f.participantes.length} participante(s)</span>}
                          {f.adjuntos.length > 0 && <span>📎 {f.adjuntos.length} adjunto(s)</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  {cursor && (
                    <button type="button" className="technical-btn" disabled={cargandoMas} onClick={() => void cargarMas()} style={{ marginTop: 8, fontSize: 11 }}>
                      {cargandoMas ? 'Cargando…' : '↓ Cargar más folios'}
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
