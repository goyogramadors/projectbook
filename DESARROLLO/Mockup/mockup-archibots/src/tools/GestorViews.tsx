/* GestorViews — recuperadas de remix gestor-de-proyectos (ProjectManager).
   4 herramientas en estilo coherente Washi & Sumi, con datos MOCK:
   ParticipantesView (T-03), DatosProyectoView (T-04), UbicacionView, SeguimientoObrasView (T-43). */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

/* ====================== T-03 · PARTICIPANTES DEL PROYECTO ================== */
interface Participante { id: string; rol: string; nombre: string; rut: string; direccion?: string; conDireccion: boolean; fijo?: boolean; }

const ROLES_DISPONIBLES = ['Director de Obra (DOM)', 'Ingeniero Calculista', 'Constructor', 'Revisor Independiente', 'Ing. Mecánico', 'Paisajista', 'Rol libre…'];

export function ParticipantesView() {
  const [parts, setParts] = useState<Participante[]>([
    { id: 'p1', rol: 'Arquitecto', nombre: 'Goyo Gramador', rut: '12.345.678-9', direccion: 'Av. Providencia 1234, Of. 56', conDireccion: true, fijo: true },
    { id: 'p2', rol: 'Propietario', nombre: 'Inmobiliaria Lientur SpA', rut: '76.543.210-K', direccion: 'Av. Apoquindo 4501, Las Condes', conDireccion: true, fijo: true },
  ]);
  const [rolNuevo, setRolNuevo] = useState(ROLES_DISPONIBLES[0]);
  const [rolLibre, setRolLibre] = useState('');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const rol = rolNuevo === 'Rol libre…' ? (rolLibre.trim() || 'Colaborador') : rolNuevo;
    setParts(prev => [...prev, { id: `p-${Date.now()}`, rol, nombre: nombre.trim(), rut: rut.trim(), conDireccion: false }]);
    setNombre(''); setRut(''); setRolLibre('');
  };
  const remove = (id: string) => setParts(prev => prev.filter(p => p.id !== id || p.fijo));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="tech-quote" style={{ marginBottom: '18px' }}>Registro de actores del proyecto. Por defecto el Arquitecto y el Propietario (con dirección). Agregue DOM, calculista, constructor o roles libres (nombre + RUT).</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
        <div className="tool-panel">
          <div className="module-header">| NÓMINA DE PARTICIPANTES ({parts.length})</div>
          <div className="panel-content" style={{ padding: 0 }}>
            <table className="tech-table">
              <thead><tr><th>ROL</th><th>NOMBRE / RAZÓN SOCIAL</th><th>RUT</th><th style={{ width: '40px' }}></th></tr></thead>
              <tbody>
                {parts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}>
                      {p.rol} {p.fijo && <span style={{ color: 'var(--accent-red)', fontSize: '8px' }}>★</span>}
                    </td>
                    <td>{p.nombre}{p.conDireccion && p.direccion && <div style={{ fontSize: '9px', opacity: 0.6 }}>{p.direccion}</div>}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{p.rut || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{!p.fijo && <button className="btn-tech-gray" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => remove(p.id)}>[X]</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <form className="tool-panel" onSubmit={add}>
          <div className="module-header">| AGREGAR PARTICIPANTE [+]</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>ROL</label>
              <select className="tech-select" value={rolNuevo} onChange={e => setRolNuevo(e.target.value)}>
                {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {rolNuevo === 'Rol libre…' && (
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>NOMBRE DEL ROL</label>
                <input className="tech-input" value={rolLibre} onChange={e => setRolLibre(e.target.value)} placeholder="Ej: Asesor Acústico" />
              </div>
            )}
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>NOMBRE / RAZÓN SOCIAL</label>
              <input className="tech-input" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>RUT</label>
              <input className="tech-input" value={rut} onChange={e => setRut(e.target.value)} style={{ fontFamily: 'monospace' }} placeholder="11.111.111-1" />
            </div>
            <button type="submit" className="technical-btn" style={{ width: '100%' }}><Icons.UserPlus size={14} /> [ AGREGAR AL PROYECTO ]</button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

/* ====================== T-04 · DATOS DEL PROYECTO ========================= */
const ETAPAS_PROYECTO = ['Perfil', 'Anteproyecto', 'Proyecto', 'Licitación', 'Obra', 'Habilitación', 'Archivado'];

export function DatosProyectoView() {
  const [d, setD] = useState({
    nombre: 'Edificio Los Alerces', etapa: 'Anteproyecto', tipoProyecto: 'Obra Nueva', tipoDestino: 'Vivienda Colectiva',
    superficieTerreno: '1.640,10', superficieProyecto: '8.117,40', origen: 'DIMENSIONADOR', presupuestoUF: '45.000',
  });
  const set = (k: string, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const [origenManual, setOrigenManual] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="tech-quote" style={{ marginBottom: '18px' }}>Datos clave del proyecto: etapa, destino, tipo y superficies (modelo sección 1.2). La superficie manual manda sobre la del Dimensionador, siempre con etiqueta de origen.</p>
      <div className="tool-panel" style={{ maxWidth: '760px' }}>
        <div className="module-header">| DATOS DEL PROYECTO</div>
        <div className="panel-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}><label>NOMBRE DEL PROYECTO</label><input className="tech-input" value={d.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>ETAPA ACTUAL</label>
              <select className="tech-select" value={d.etapa} onChange={e => set('etapa', e.target.value)}>
                {ETAPAS_PROYECTO.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>TIPO DE PROYECTO</label>
              <select className="tech-select" value={d.tipoProyecto} onChange={e => set('tipoProyecto', e.target.value)}>
                {['Obra Nueva', 'Ampliación', 'Regularización', 'Remodelación', 'Demolición'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>DESTINO</label>
              <select className="tech-select" value={d.tipoDestino} onChange={e => set('tipoDestino', e.target.value)}>
                {['Vivienda', 'Vivienda Colectiva', 'Oficinas', 'Comercio', 'Equipamiento', 'Salud', 'Educación', 'Industria'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}><label>PRESUPUESTO ESTIMADO (UF)</label><input className="tech-input" value={d.presupuestoUF} onChange={e => set('presupuestoUF', e.target.value)} style={{ textAlign: 'right', fontWeight: 'bold' }} /></div>
          </div>

          <div style={{ borderTop: '1.5px dashed var(--border-color)', margin: '20px 0', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>◈ Modelo de superficies</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}><label>SUP. TERRENO LEGAL (m²)</label><input className="tech-input" value={d.superficieTerreno} onChange={e => set('superficieTerreno', e.target.value)} style={{ textAlign: 'right' }} /></div>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SUP. PROYECTO (m²)</span>
                  <span style={{ color: 'var(--accent-red)', fontSize: '8px', border: '1px solid var(--accent-red)', padding: '0 4px' }}>{origenManual ? 'MANUAL' : d.origen}</span>
                </label>
                <input className="tech-input" value={d.superficieProyecto} onChange={e => { set('superficieProyecto', e.target.value); setOrigenManual(true); }} style={{ textAlign: 'right', fontWeight: 'bold' }} />
              </div>
            </div>
            <p style={{ fontSize: '9px', opacity: 0.6, marginTop: '8px' }}>* Si editas la superficie de proyecto, prevalece el valor MANUAL sobre el del DIMENSIONADOR.</p>
          </div>
          <button className="technical-btn" style={{ width: '100%' }}><Icons.Save size={14} /> [ GUARDAR DATOS DEL PROYECTO ]</button>
        </div>
      </div>
    </motion.div>
  );
}

/* ====================== UBICACIÓN (simple) =============================== */
const REGIONES = ['Región Metropolitana de Santiago', 'Región de Valparaíso', "Región del Libertador Gral. Bernardo O'Higgins", 'Región del Biobío', 'Región de la Araucanía', 'Región de Los Lagos'];

export function UbicacionView() {
  const [u, setU] = useState({ region: REGIONES[0], provincia: 'Cordillera', comuna: 'La Florida', direccion: 'Lientur 7345', rol: '12345-67' });
  const set = (k: string, v: string) => setU(prev => ({ ...prev, [k]: v }));
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="tech-quote" style={{ marginBottom: '18px' }}>Ubicación administrativa básica del predio. Esta ficha simple se complementa luego con el polígono y la normativa del Geolocalizador (T-07).</p>
      <div className="tool-panel" style={{ maxWidth: '680px' }}>
        <div className="module-header">| UBICACIÓN DEL PROYECTO</div>
        <div className="panel-content">
          <div className="tech-input-group">
            <label>REGIÓN</label>
            <select className="tech-select" value={u.region} onChange={e => set('region', e.target.value)}>{REGIONES.map(r => <option key={r}>{r}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tech-input-group"><label>PROVINCIA</label><input className="tech-input" value={u.provincia} onChange={e => set('provincia', e.target.value)} /></div>
            <div className="tech-input-group"><label>COMUNA</label><input className="tech-input" value={u.comuna} onChange={e => set('comuna', e.target.value)} /></div>
          </div>
          <div className="tech-input-group"><label>DIRECCIÓN</label><input className="tech-input" value={u.direccion} onChange={e => set('direccion', e.target.value)} /></div>
          <div className="tech-input-group"><label>ROL SII (AVALÚO)</label><input className="tech-input" value={u.rol} onChange={e => set('rol', e.target.value)} style={{ fontFamily: 'monospace' }} /></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="technical-btn" style={{ flex: 1 }}><Icons.Save size={14} /> [ GUARDAR UBICACIÓN ]</button>
            <button className="technical-btn secondary" style={{ flex: 1 }}><Icons.MapPin size={14} /> [ ABRIR EN GEOLOCALIZADOR ]</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ====================== T-43 · SEGUIMIENTO DE OBRAS ====================== */
type EstadoObra = 'Normal' | 'Retraso' | 'Crítico';
const ESTADO_COLOR: Record<EstadoObra, string> = { 'Normal': '#15803d', 'Retraso': '#b45309', 'Crítico': '#D32F2F' };
const ETAPAS = ['Instalación de Faenas', 'Excavación', 'Fundaciones', 'Obra Gruesa', 'Terminaciones', 'Instalaciones', 'Recepción Final'];

export function SeguimientoObrasView() {
  const [avance, setAvance] = useState(42);
  const [etapa, setEtapa] = useState('Obra Gruesa');
  const [bitacora, setBitacora] = useState<{ id: string; fecha: string; detalle: string; responsable: string; estado: EstadoObra }[]>([
    { id: 'b1', fecha: '2026-06-02', responsable: 'ITO J. Pérez', detalle: 'Hormigonado de losa nivel 3 conforme a planos. Sin observaciones.', estado: 'Normal' },
    { id: 'b2', fecha: '2026-06-08', responsable: 'ITO J. Pérez', detalle: 'Atraso en llegada de enfierradura; se reprograma cuadrilla.', estado: 'Retraso' },
  ]);
  const [nf, setNf] = useState(new Date().toISOString().split('T')[0]);
  const [nr, setNr] = useState('');
  const [nd, setNd] = useState('');
  const [ne, setNe] = useState<EstadoObra>('Normal');

  const add = () => {
    if (!nd.trim() || !nr.trim()) return;
    setBitacora(prev => [...prev, { id: `b-${Date.now()}`, fecha: nf, responsable: nr.trim(), detalle: nd.trim(), estado: ne }]);
    setNd(''); setNr('');
  };
  const del = (id: string) => setBitacora(prev => prev.filter(e => e.id !== id));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="tech-quote" style={{ marginBottom: '18px' }}>Seguimiento de obra: porcentaje de avance, etapa constructiva y bitácora cronológica con estados Normal / Retraso / Crítico.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Avance + etapa */}
        <div className="tool-panel">
          <div className="module-header">| ESTADO GENERAL DE OBRA</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Avance físico</span><span style={{ color: 'var(--accent-red)' }}>{avance}%</span>
              </div>
              <div style={{ height: '22px', border: '1.5px solid var(--border-color)', background: 'var(--bg-grey)', position: 'relative' }}>
                <div style={{ height: '100%', width: `${avance}%`, background: 'var(--text-primary)' }} />
              </div>
              <input type="range" min="0" max="100" value={avance} onChange={e => setAvance(Number(e.target.value))} style={{ width: '100%', marginTop: '10px' }} />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>ETAPA CONSTRUCTIVA ACTUAL</label>
              <select className="tech-select" value={etapa} onChange={e => setEtapa(e.target.value)}>{ETAPAS.map(et => <option key={et}>{et}</option>)}</select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {(['Normal', 'Retraso', 'Crítico'] as EstadoObra[]).map(s => {
                const n = bitacora.filter(b => b.estado === s).length;
                return <div key={s} style={{ border: `1.5px solid ${ESTADO_COLOR[s]}`, padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: ESTADO_COLOR[s] }}>{n}</div><div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>{s}</div></div>;
              })}
            </div>
            <button className="technical-btn" style={{ width: '100%' }}><Icons.Save size={14} /> [ GUARDAR ESTADO ]</button>
          </div>
        </div>

        {/* Agregar a bitácora */}
        <div className="tool-panel">
          <div className="module-header">| ✍ AGREGAR REGISTRO A BITÁCORA</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="tech-input-group" style={{ marginBottom: 0 }}><label>FECHA</label><input type="date" className="tech-input" value={nf} onChange={e => setNf(e.target.value)} /></div>
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>ESTADO</label>
                <select className="tech-select" value={ne} onChange={e => setNe(e.target.value as EstadoObra)}>{(['Normal', 'Retraso', 'Crítico'] as EstadoObra[]).map(s => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}><label>RESPONSABLE</label><input className="tech-input" value={nr} onChange={e => setNr(e.target.value)} placeholder="Ej: ITO J. Pérez" /></div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>DESCRIPCIÓN DE ACTIVIDAD / ANOTACIÓN DE CAMPO</label>
              <textarea className="tech-input" rows={3} value={nd} onChange={e => setNd(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="technical-btn" style={{ width: '100%' }} onClick={add}><Icons.PenLine size={14} /> [ REGISTRAR EN BITÁCORA ]</button>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="tool-panel" style={{ marginTop: '20px' }}>
        <div className="module-header">| 📜 HISTORIAL CRONOLÓGICO DE BITÁCORA ({bitacora.length})</div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bitacora.length === 0 ? (
            <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px', fontWeight: 'bold', fontSize: '11px' }}>SIN ANOTACIONES REGISTRADAS</div>
          ) : bitacora.slice().reverse().map(e => (
            <div key={e.id} style={{ border: '1.5px solid var(--border-color)', borderLeft: `4px solid ${ESTADO_COLOR[e.estado]}`, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>{e.fecha} · {e.responsable}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fff', background: ESTADO_COLOR[e.estado], padding: '2px 6px' }}>{e.estado}</span>
                  <button className="btn-tech-gray" style={{ padding: '2px 6px', fontSize: '9px' }} onClick={() => del(e.id)}>[X]</button>
                </div>
              </div>
              <p style={{ fontSize: '11px', opacity: 0.85 }}>{e.detalle}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
