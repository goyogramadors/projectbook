/* BimWizardView — recuperado del "Modulo BIM.tsx" (wizard 7 pasos de Usos BIM,
   Planbim/CORFO) y re-vestido al lenguaje visual Washi & Sumi. Datos MOCK. */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const ACTORES = ['Mandante / Inmobiliaria', 'Proyectista (AEC)', 'Constructor', 'Proveedor / Fabricante'];
const ESCALAS = ['Pequeña (< 2.000 m²)', 'Mediana (2.000 – 10.000 m²)', 'Gran escala (> 10.000 m²)'];
const ROLES = ['Arquitecto', 'Ing. Calculista', 'Coordinador BIM', 'Jefe de Proyecto', 'ITO / Inspección', 'Especialista MEP'];

const FASES = [
  { id: 'perfil', name: 'Idea / Perfil', order: 1 },
  { id: 'antep', name: 'Anteproyecto', order: 2 },
  { id: 'diseno', name: 'Diseño Detallado', order: 3 },
  { id: 'permisos', name: 'Permisos', order: 4 },
  { id: 'const', name: 'Construcción', order: 5 },
  { id: 'oper', name: 'Operación', order: 6 },
];

const PROCESOS = [
  { id: 'p1', name: 'Levantamiento de condiciones existentes', fase: 'perfil' },
  { id: 'p2', name: 'Diseño y modelado de especialidades', fase: 'diseno' },
  { id: 'p3', name: 'Coordinación e interferencias', fase: 'diseno' },
  { id: 'p4', name: 'Revisión de cumplimiento normativo', fase: 'permisos' },
  { id: 'p5', name: 'Cubicaciones y presupuesto', fase: 'const' },
  { id: 'p6', name: 'Planificación y secuenciamiento de obra', fase: 'const' },
  { id: 'p7', name: 'Gestión de activos y mantención', fase: 'oper' },
];

const USOS_BIM = [
  { id: 'u1', name: 'Modelado de condiciones existentes', fases: ['perfil'], base: 70 },
  { id: 'u2', name: 'Coordinación 3D / Detección de interferencias', fases: ['diseno'], base: 88 },
  { id: 'u3', name: 'Cuantificación / Cubicaciones', fases: ['const'], base: 84 },
  { id: 'u4', name: 'Planificación 4D (tiempo)', fases: ['const'], base: 76 },
  { id: 'u5', name: 'Estimación de costos 5D', fases: ['const'], base: 72 },
  { id: 'u6', name: 'Revisión de diseño y normativa', fases: ['permisos', 'diseno'], base: 80 },
  { id: 'u7', name: 'Gestión de activos 6D (FM)', fases: ['oper'], base: 64 },
];

const STEP_TITLES = ['', 'Definición del Perfil del Profesional', 'Mapeo del Ciclo de Vida', 'Procesos Clave', 'Taxonomía y Factibilidad de Usos BIM', 'Análisis Técnico-Económico', 'Hoja de Ruta e Informe Consolidado'];

const RED = '#D32F2F';

export default function BimWizardView() {
  const [step, setStep] = useState(0);
  const [actor, setActor] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [scale, setScale] = useState<string | null>(null);
  const [phases, setPhases] = useState<Record<string, 'on' | 'critica'>>({ diseno: 'critica', const: 'on' });
  const [procesos, setProcesos] = useState<string[]>(['p3', 'p5']);
  const [activeUso, setActiveUso] = useState<string | null>(null);

  const selectedPhases = Object.keys(phases);
  const togglePhase = (id: string) => setPhases(prev => { const n = { ...prev }; if (!n[id]) n[id] = 'on'; else if (n[id] === 'on') n[id] = 'critica'; else delete n[id]; return n; });
  const toggleProceso = (id: string) => setProcesos(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  // Factibilidad: base + 8 si toca fase crítica + 4 si hay proceso afín
  const usosScored = useMemo(() => USOS_BIM.map(u => {
    let score = u.base;
    const reasons: string[] = [`Base de afinidad: ${u.base} pts`];
    if (u.fases.some(f => phases[f] === 'critica')) { score += 8; reasons.push('Vinculado a fase crítica (+8)'); }
    if (u.fases.some(f => selectedPhases.includes(f))) { score += 4; reasons.push('Fase declarada activa (+4)'); }
    return { ...u, score: Math.min(100, score), reasons };
  }).sort((a, b) => b.score - a.score), [phases]);

  const activeUsoObj = usosScored.find(u => u.id === activeUso) || usosScored[0];
  const lod = scale === ESCALAS[2] ? 'LOD 350 / LOIN Alto' : scale === ESCALAS[1] ? 'LOD 300 / LOIN Medio' : 'LOD 200 / LOIN Básico';
  const progress = step === 0 ? 5 : Math.min(100, Math.round((step / 6) * 100));

  const canNext = () => {
    if (step === 1) return actor && role && scale;
    if (step === 2) return selectedPhases.length > 0;
    if (step === 3) return procesos.length > 0;
    return true;
  };
  const next = () => setStep(s => Math.min(6, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const Chip = ({ on, children, onClick }: any) => (
    <button onClick={onClick} className={on ? 'technical-btn' : 'technical-btn secondary'} style={{ fontSize: '11px', justifyContent: 'flex-start', textAlign: 'left' }}>{children}</button>
  );

  return (
    <div>
      {/* Barra de progreso */}
      {step > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.6 }}>PASO 0{step} DE 06 · {STEP_TITLES[step].toUpperCase()}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: RED }}>{progress}%</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ flex: 1, height: '6px', background: i <= step ? RED : 'var(--muted)', border: '1px solid var(--border)' }} />)}
          </div>
        </div>
      )}

      <div className="tool-panel">
        <div className="module-header" style={{ background: '#2E2E2E', color: '#fff', borderBottom: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Cpu size={16} /> ASISTENTE DE USOS BIM {step > 0 && `· ${STEP_TITLES[step]}`}</span>
          <span style={{ fontSize: '9px', opacity: 0.7 }}>PLANBIM / CORFO</span>
        </div>

        <div className="panel-content" style={{ minHeight: '360px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {step === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ display: 'inline-flex', padding: '18px', border: '2px solid var(--border)', marginBottom: '20px' }}><Icons.Cpu size={48} strokeWidth={1.2} /></div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', maxWidth: '620px', margin: '0 auto 12px', lineHeight: 1.2 }}>¿Qué <span style={{ borderBottom: `3px solid ${RED}` }}>Usos BIM</span> justifican realmente tu inversión?</h2>
                  <p style={{ fontSize: '12px', opacity: 0.7, maxWidth: '560px', margin: '0 auto 24px' }}>Asistente de 6 pasos que cruza tu perfil, fases y procesos para proyectar la taxonomía de Usos BIM, niveles LOD/LOIN y un análisis técnico-económico preliminar.</p>
                  <button className="technical-btn" onClick={() => setStep(1)} style={{ fontSize: '13px', padding: '12px 28px' }}>[ INICIAR DIAGNÓSTICO → ]</button>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.7 }}>1.1 · Tipo de actor</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '8px' }}>{ACTORES.map(a => <Chip key={a} on={actor === a} onClick={() => setActor(a)}>{a}</Chip>)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.7 }}>1.2 · Rol profesional</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '8px' }}>{ROLES.map(r => <Chip key={r} on={role === r} onClick={() => setRole(r)}>{r}</Chip>)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.7 }}>1.3 · Escala de proyectos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '8px' }}>{ESCALAS.map(s => <Chip key={s} on={scale === s} onClick={() => setScale(s)}>{s}</Chip>)}</div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '16px' }}>Active las fases donde interactúa. Vuelva a hacer clic para marcarla como <strong style={{ color: RED }}>Crítica ★</strong> (duplica ponderación de riesgo informativo).</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '10px' }}>
                    {FASES.map(f => {
                      const st = phases[f.id];
                      return (
                        <button key={f.id} onClick={() => togglePhase(f.id)} className="tool-panel" style={{ padding: '14px', textAlign: 'left', cursor: 'pointer', background: st ? (st === 'critica' ? 'rgba(211,47,47,0.08)' : 'var(--muted)') : 'var(--card)', borderColor: st === 'critica' ? RED : '#2E2E2E' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.5 }}>FASE 0{f.order}</span>
                            {st === 'critica' ? <Icons.Star size={14} fill={RED} color={RED} /> : st === 'on' ? <Icons.Check size={14} /> : <Icons.Circle size={14} opacity={0.3} />}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' }}>{f.name}</div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px', color: st === 'critica' ? RED : 'rgba(46,46,46,0.5)' }}>{st === 'critica' ? '★ CRÍTICA' : st === 'on' ? 'ACTIVA' : 'INACTIVA'}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '11px', fontWeight: 'bold' }}>Fases habilitadas: <span style={{ color: RED }}>{selectedPhases.length}</span> · Críticas: <span style={{ color: RED }}>{Object.values(phases).filter(v => v === 'critica').length}</span></div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '16px' }}>Seleccione los procesos operativos clave que ejecuta o supervisa. Esto alimenta la matriz cruzada de Usos BIM.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PROCESOS.map(p => {
                      const on = procesos.includes(p.id);
                      const fase = FASES.find(f => f.id === p.fase);
                      return (
                        <button key={p.id} onClick={() => toggleProceso(p.id)} className="tool-panel" style={{ padding: '12px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: on ? 'var(--muted)' : 'var(--card)', borderColor: on ? RED : '#2E2E2E' }}>
                          {on ? <Icons.CheckSquare size={18} color={RED} /> : <Icons.Square size={18} opacity={0.4} />}
                          <span style={{ fontSize: '12px', fontWeight: 'bold', flex: 1 }}>{p.name}</span>
                          <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5 }}>{fase?.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '16px' }}>Usos BIM sugeridos y su factibilidad preliminar. Pulse <strong>Definir Evaluación</strong> para proyectar el análisis técnico-económico.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {usosScored.map(u => (
                      <div key={u.id} className="tool-panel" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ minWidth: '54px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: u.score >= 85 ? RED : '#2E2E2E' }}>{u.score}</div>
                          <div style={{ fontSize: '7px', fontWeight: 'bold', opacity: 0.5 }}>FACTIB.</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{u.name}</div>
                          <div style={{ height: '6px', background: 'var(--muted)', border: '1px solid var(--border)', marginTop: '5px' }}><div style={{ height: '100%', width: `${u.score}%`, background: RED }} /></div>
                        </div>
                        <button className="technical-btn secondary" style={{ fontSize: '9px' }} onClick={() => { setActiveUso(u.id); setStep(5); }}>[ DEFINIR EVALUACIÓN → ]</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && activeUsoObj && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.5, textTransform: 'uppercase' }}>Análisis técnico-económico</div>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>{activeUsoObj.name}</h2>
                    </div>
                    <div style={{ textAlign: 'center', border: `2px solid ${RED}`, padding: '6px 14px' }}><div style={{ fontSize: '22px', fontWeight: 'bold', color: RED }}>{activeUsoObj.score}</div><div style={{ fontSize: '7px', fontWeight: 'bold' }}>FACTIBILIDAD</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '14px' }}>
                    {[
                      ['NIVEL DE DESARROLLO', lod],
                      ['ROI ESTIMADO', activeUsoObj.score >= 85 ? 'Alto (12–18 meses)' : 'Medio (18–30 meses)'],
                      ['CAPEX (implementación)', scale === ESCALAS[2] ? 'Alto' : 'Medio'],
                      ['OPEX (operación)', 'Bajo–Medio'],
                      ['ESFUERZO DE ADOPCIÓN', activeUsoObj.score >= 85 ? 'Moderado' : 'Alto'],
                      ['RESPONSABLE', role || 'Coordinador BIM'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ border: '1.5px solid var(--border)', padding: '14px' }}><div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6, textTransform: 'uppercase' }}>{l}</div><div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ border: '1.5px solid var(--border)', borderLeft: `4px solid ${RED}`, padding: '14px', marginTop: '14px', fontSize: '11px' }}>
                    <strong>OBJETIVO:</strong> Implementar el Uso BIM "{activeUsoObj.name}" para resolver desvíos y optimizar el flujo informativo. Configurado para el rol de {role || 'Especialista AEC'} en proyectos de escala {scale || 'media'}.<br /><br />
                    <strong>ENTREGABLES:</strong> Modelo federado en estándar abierto (.IFC), informe consolidado de desvíos y matrices de extracción de cantidades (cubicaciones).
                  </div>
                </div>
              )}

              {step === 6 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'inline-flex', padding: '14px', border: '2px solid var(--border)' }}><Icons.ClipboardCheck size={36} strokeWidth={1.2} /></div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '12px' }}>Hoja de Ruta de Implementación BIM</h2>
                    <p style={{ fontSize: '11px', opacity: 0.7 }}>Perfil: {actor || '—'} · {role || '—'} · {scale || '—'}</p>
                  </div>
                  <table className="tech-table">
                    <thead><tr><th>PRIORIDAD</th><th>USO BIM</th><th style={{ textAlign: 'center' }}>FACTIB.</th><th style={{ textAlign: 'center' }}>LOD</th></tr></thead>
                    <tbody>
                      {usosScored.slice(0, 4).map((u, i) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 'bold', color: i === 0 ? RED : 'inherit' }}>{i + 1}º</td>
                          <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{u.score}</td>
                          <td style={{ textAlign: 'center', fontSize: '10px' }}>{lod.split(' / ')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button className="technical-btn"><Icons.Printer size={14} /> [ EXPORTAR INFORME PDF ]</button>
                    <button className="technical-btn secondary" onClick={() => setStep(0)}><Icons.RotateCcw size={14} /> [ NUEVO DIAGNÓSTICO ]</button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        {step > 0 && step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1.5px solid var(--border)', background: 'var(--background)' }}>
            <button className="technical-btn secondary" onClick={back}><Icons.ChevronLeft size={14} /> ATRÁS</button>
            <button className="technical-btn" onClick={next} disabled={!canNext()}>{step === 5 ? 'VER INFORME' : 'CONTINUAR'} <Icons.ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
