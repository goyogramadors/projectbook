/* =============================================================================
   RutaAccesibleView.tsx — MEMORIA DE RUTA ACCESIBLE (mockup · Fase 0)
   -----------------------------------------------------------------------------
   // MOCKUP — Estado SOLO en memoria (useState). NO persiste ni genera PDF real.
   // El desarrollo real reemplazará el estado por useToolData('accesibilidad', …)
   // y cargará las descripciones largas + factor OGUC oficial desde el glosario.
   // Ref UX/catálogo: DESARROLLO/files ruta accesible/ (GLOSARIO + index.html).
   // Base normativa: OGUC 4.1.7 y atingentes 4.2.5, 4.2.18, 4.5.8, 6.4.2.
   // tier: free · imágenes (hasta 4) reservadas a Premium (decisión HITL 2026-06-22).
   ============================================================================= */
import { Fragment, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── catálogos (= glosario, literal abreviado) ───────────────────────────────── */
type Estado3 = 'cumple' | 'no-cumple' | 'no-aplica';
const ESTADO_3: ReadonlyArray<[Estado3, string]> = [
  ['cumple', 'Cumple'], ['no-cumple', 'No cumple'], ['no-aplica', 'No aplica'],
];
const EST_3_1: ReadonlyArray<[string, string]> = [
  ['rampas', 'Contempla rampas'], ['ascensor', 'Contempla ascensor'],
  ['rampa-ascensor', 'Rampa y ascensor'], ['no-aplica', 'No aplica'],
];

interface Item { id: string; titulo: string; ref: string; def: Estado3; }
interface Grupo { n: number; titulo: string; items: Item[]; }

const GRUPOS: Grupo[] = [
  { n: 1, titulo: 'Condiciones generales de la ruta accesible', items: [
    { id: '1.1', titulo: 'Ancho mínimo interior de la ruta', ref: 'mín. 1,10 m', def: 'no-aplica' },
    { id: '1.2', titulo: 'Altura mínima libre de paso', ref: '> 2,10 m', def: 'cumple' },
    { id: '1.3', titulo: 'Pasillos de la ruta con ancho mínimo de 1,5 m', ref: 'mín. 1,5 m', def: 'cumple' },
  ] },
  { n: 2, titulo: 'Continuidad desde salida del edificio al espacio público', items: [
    { id: '2.1', titulo: 'Ancho de ruta entre salida y espacio público (bloque asistido)', ref: 'mín. 1,10 m', def: 'no-aplica' },
  ] },
  { n: 3, titulo: 'Cambios de nivel y continuidad de desplazamiento', items: [
    { id: '3.1', titulo: 'Desniveles salvados mediante rampas y ascensores', ref: 'solución accesible', def: 'cumple' },
    { id: '3.2', titulo: 'Desnivel máximo entre juntas de pisos de 0,5 cm', ref: 'máx. 0,5 cm', def: 'cumple' },
    { id: '3.3', titulo: 'Pendientes de planos inclinados inferiores a 5%', ref: '< 5%', def: 'cumple' },
  ] },
  { n: 4, titulo: 'Escaleras y seguridad de circulación', items: [
    { id: '4.1', titulo: 'Franja de contraste cromático frente a escaleras (0,6 m)', ref: 'señalización', def: 'cumple' },
    { id: '4.2', titulo: 'Protección bajo escaleras', ref: 'protección 0,95 m', def: 'cumple' },
  ] },
  { n: 5, titulo: 'Rampa o plano inclinado', items: [
    { id: '5.1', titulo: 'Ancho de rampa equivalente a la vía de evacuación', ref: 'mín. 1,2 m ext.', def: 'cumple' },
    { id: '5.2', titulo: 'Ancho de rampa cuando no es vía de evacuación', ref: 'mín. 0,90 m', def: 'cumple' },
    { id: '5.3', titulo: 'Inicio y fin de recorrido en plano horizontal', ref: 'largo mín. 1,50 m', def: 'cumple' },
    { id: '5.4', titulo: 'Pendiente y largo normativo', ref: '8%-12% · 1,5-9 m', def: 'cumple' },
    { id: '5.5', titulo: 'Pasamanos en rampas mayores a 1,5 m', ref: 'pasamanos continuo', def: 'cumple' },
    { id: '5.6', titulo: 'Rampas de longitud hasta 1,5 m', ref: 'resalte 0,10 m / baranda 0,95 m', def: 'cumple' },
  ] },
  { n: 6, titulo: 'Ascensores y áreas de maniobra', items: [
    { id: '6.1', titulo: 'Área mínima frente a ascensor de 1,5 x 1,5 m', ref: 'mín. 1,5 x 1,5 m', def: 'no-aplica' },
    { id: '6.2', titulo: 'Ancho frente a cabina', ref: 'ancho ≥ profundidad cabina', def: 'no-aplica' },
  ] },
  { n: 7, titulo: 'Puertas y pasillos', items: [
    { id: '7.1', titulo: 'Puerta de ingreso al edificio y a unidades de 0,9 m', ref: 'ancho libre 0,90 m', def: 'cumple' },
    { id: '7.2', titulo: 'Puerta de ingreso al edificio dobles', ref: 'espacio libre ≥ 1,20 m', def: 'cumple' },
    { id: '7.3', titulo: 'Fondos de pasillos de la ruta accesible', ref: 'Ø mín. 1,50 m', def: 'cumple' },
  ] },
  { n: 8, titulo: 'Atención accesible', items: [
    { id: '8.1', titulo: 'Mesones de atención accesible', ref: 'tramo 1,2 m · alto 0,8 m', def: 'cumple' },
    { id: '8.2', titulo: 'Área de aproximación a mesón accesible', ref: 'Ø 1,5 m', def: 'cumple' },
  ] },
];

const SHH = [
  'Superficie para giro 360° de diámetro 1,5 m',
  'Puerta de acceso con ancho libre mínimo 0,8 m',
  'Altura de lavamanos 0,8 m desde NPT y espacio libre bajo cubierta 0,7 m',
  'Grifería de palanca, de presión o sensor',
  'Espejo de altura de inicio 3 cm máx. desde cubierta de lavamanos',
  'Inodoro con espacio de transferencia lateral 0,8 x 1,2 m',
  'Altura de asiento de inodoro entre 0,46 y 0,48 m',
  'Barras fijas y abatibles para inodoro',
  'Altura de accesorios máximo a 1,2 m',
];
const DUCHA = [
  'Puerta paso libre 0,8 m',
  'Apertura de puerta no interfiere con radio de giro',
  'Tamaño de receptáculo 0,9 x 1,20 m',
  'Espacio de transferencia lateral',
  'Espacio para asiento 0,45 x 0,45 m, altura terminada 0,46 m',
];

const CONCLUSION_DEF =
  'La revisión no presenta incumplimientos para los ítems evaluados y mantiene una base favorable de accesibilidad universal. Se sugiere conservar respaldo técnico y evidencias de terreno para la tramitación.';

const colorEstado = (e: string): string =>
  e === 'cumple' ? '#1f7a3d' : e === 'no-cumple' ? '#9b1c1c' : '#777';

const pvH3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' };
const pvTd: React.CSSProperties = { padding: '5px 8px', borderBottom: '1px solid #d8d8d8', fontSize: 11, color: '#1a1a1a' };

export default function RutaAccesibleView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [superficie, setSuperficie] = useState('0');
  const [carga, setCarga] = useState('0');
  const [estados, setEstados] = useState<Record<string, Estado3>>(() => {
    const m: Record<string, Estado3> = {};
    GRUPOS.forEach(g => g.items.forEach(it => { if (it.id !== '2.1' && it.id !== '3.1') m[it.id] = it.def; }));
    return m;
  });
  const [est31, setEst31] = useState('rampas');
  const [vias, setVias] = useState('1');
  const [anchoDecl, setAnchoDecl] = useState('1.1');
  const [shhGeneral, setShhGeneral] = useState<'Aplica' | 'No aplica'>('Aplica');
  const [shhEst, setShhEst] = useState<Record<number, Estado3>>(() => Object.fromEntries(SHH.map((_, i) => [i, 'cumple'])) as Record<number, Estado3>);
  const [duchaGeneral, setDuchaGeneral] = useState<'Aplica' | 'No aplica'>('No aplica');
  const [duchaEst, setDuchaEst] = useState<Record<number, Estado3>>(() => Object.fromEntries(DUCHA.map((_, i) => [i, 'cumple'])) as Record<number, Estado3>);
  const [conclusion, setConclusion] = useState(CONCLUSION_DEF);
  const [genOverride, setGenOverride] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  /* ── bloque asistido 2.1 (cálculo OGUC) ── */
  const calc21 = useMemo(() => {
    const q = parseFloat(carga) || 0;
    const v = Math.max(1, parseInt(vias) || 1);
    const decl = parseFloat(anchoDecl) || 0;
    const totalExigido = 0.005 * q;          // 0,5 cm por persona
    const porVia = totalExigido / v;
    const minAplicable = Math.max(1.10, porVia);
    const cumple = decl >= minAplicable;
    return { totalExigido, porVia, minAplicable, cumple };
  }, [carga, vias, anchoDecl]);
  const estado21: Estado3 = calc21.cumple ? 'cumple' : 'no-cumple';

  const generalidades = genOverride ?? (
    `La presente memoria analiza cada punto de la normativa de accesibilidad universal en la edificación pública. ` +
    `Se trata de una edificación de ${superficie || '0'} m² y carga de ocupación de ${carga || '0'} personas. ` +
    `A continuación se enumeran los requerimientos según el art. 4.1.7 de la OGUC y parte de los arts. 4.2.5, 4.2.18, 4.5.8 y 6.4.2, atingentes al proyecto.`
  );

  const resumenGrupo = (g: Grupo) => {
    const c = { cumple: 0, 'no-cumple': 0, 'no-aplica': 0 } as Record<Estado3, number>;
    g.items.forEach(it => {
      const e = it.id === '2.1' ? estado21 : it.id === '3.1' ? (est31 === 'no-aplica' ? 'no-aplica' : 'cumple') : estados[it.id];
      if (e) c[e]++;
    });
    return `${c['no-cumple']} no cumple · ${c.cumple} ok${c['no-aplica'] ? ` · ${c['no-aplica']} n/a` : ''}`;
  };

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para generar la Memoria de Ruta Accesible.</p></div>
  );

  const Radio = ({ active, onClick, label, value }: { active: boolean; onClick: () => void; label: string; value: string }) => (
    <button type="button" disabled={readOnly} onClick={onClick}
      style={{ padding: '3px 9px', fontSize: 10, borderRadius: 4, cursor: readOnly ? 'default' : 'pointer',
        border: `1px solid ${active ? colorEstado(value) : 'var(--ab-border, #ccc)'}`,
        background: active ? colorEstado(value) : 'transparent', color: active ? '#fff' : 'inherit', fontWeight: active ? 700 : 400 }}>
      {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Accessibility size={22} strokeWidth={1.4} /> Memoria de Ruta Accesible
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#9a6700', color: '#fff' }}>MOCKUP</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Revisión OGUC 4.1.7 de accesibilidad universal en edificación pública.
      </p>

      <div className="ab-split">
        {/* ── IZQUIERDA · FORMULARIO ── */}
        <form className="tool-panel ab-split-left" onSubmit={e => e.preventDefault()}>
          <div className="module-header">| ENCABEZADO Y CARGA</div>
          <div className="panel-content">
            <div className="ab-form-grid">
              <div className="tech-input-group"><label>Superficie referencial (m²)</label>
                <input type="number" className="tech-input" value={superficie} disabled={readOnly} onChange={e => setSuperficie(e.target.value)} /></div>
              <div className="tech-input-group"><label>Carga de ocupación (personas)</label>
                <input type="number" className="tech-input" value={carga} disabled={readOnly} onChange={e => setCarga(e.target.value)} /></div>
              <div className="tech-input-group col-span-full"><label>Generalidades (editable)</label>
                <textarea rows={4} className="tech-input" value={generalidades} disabled={readOnly} onChange={e => setGenOverride(e.target.value)} /></div>
            </div>

            <div className="module-header" style={{ marginTop: 14 }}>| VERIFICACIONES NORMATIVAS</div>
            {GRUPOS.map(g => (
              <div key={g.n} style={{ border: '1px solid var(--ab-border, #ddd)', borderRadius: 6, marginTop: 8 }}>
                <button type="button" onClick={() => setAbierto(p => ({ ...p, [g.n]: !p[g.n] }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{abierto[g.n] ? '▾' : '▶'} Grupo {g.n} — {g.titulo}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{resumenGrupo(g)}</span>
                </button>
                {abierto[g.n] && (
                  <div style={{ padding: '4px 10px 10px' }}>
                    {g.items.map(it => (
                      <div key={it.id} style={{ padding: '6px 0', borderTop: '1px dashed var(--ab-border, #eee)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{it.id} · {it.titulo}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>Ref: {it.ref}</div>
                        {it.id === '2.1' ? (
                          <div style={{ background: 'var(--ab-panel-2, rgba(0,0,0,.03))', borderRadius: 6, padding: 8 }}>
                            <div className="ab-form-grid">
                              <div className="tech-input-group"><label>N° de vías de evacuación</label>
                                <input type="number" min="1" className="tech-input" value={vias} disabled={readOnly} onChange={e => setVias(e.target.value)} /></div>
                              <div className="tech-input-group"><label>Ancho proyectado de ruta (m)</label>
                                <input type="number" step="0.05" className="tech-input" value={anchoDecl} disabled={readOnly} onChange={e => setAnchoDecl(e.target.value)} /></div>
                            </div>
                            <div style={{ fontSize: 10, marginTop: 6, lineHeight: 1.6 }}>
                              Ancho exigido OGUC (total): <strong>{calc21.totalExigido.toFixed(2)} m</strong> · por vía: <strong>{calc21.porVia.toFixed(2)} m</strong><br />
                              Ancho mínimo aplicable (máx. con 1,10 m): <strong>{calc21.minAplicable.toFixed(2)} m</strong> →{' '}
                              <span style={{ fontWeight: 700, color: colorEstado(estado21) }}>{calc21.cumple ? 'CUMPLE' : 'NO CUMPLE'}</span>
                            </div>
                          </div>
                        ) : it.id === '3.1' ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {EST_3_1.map(([v, l]) => (
                              <Radio key={v} value={v === 'no-aplica' ? 'no-aplica' : 'cumple'} active={est31 === v} label={l} onClick={() => setEst31(v)} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {ESTADO_3.map(([v, l]) => (
                              <Radio key={v} value={v} active={estados[it.id] === v} label={l} onClick={() => setEstados(p => ({ ...p, [it.id]: v }))} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Sub-bloques 4 y 5 */}
            {([['Servicios higiénicos accesibles', SHH, shhGeneral, setShhGeneral, shhEst, setShhEst],
               ['Ducha', DUCHA, duchaGeneral, setDuchaGeneral, duchaEst, setDuchaEst]] as const).map(
              ([titulo, lista, gen, setGen, est, setEst]) => (
                <div key={titulo} style={{ border: '1px solid var(--ab-border, #ddd)', borderRadius: 6, marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{titulo}</span>
                    <select className="tech-select" style={{ width: 'auto', fontSize: 11 }} value={gen} disabled={readOnly}
                      onChange={e => setGen(e.target.value as 'Aplica' | 'No aplica')}>
                      <option>Aplica</option><option>No aplica</option>
                    </select>
                  </div>
                  {gen === 'Aplica' && (
                    <div style={{ padding: '0 10px 10px' }}>
                      {lista.map((sub, i) => (
                        <div key={i} style={{ padding: '5px 0', borderTop: '1px dashed var(--ab-border, #eee)' }}>
                          <div style={{ fontSize: 11, marginBottom: 4 }}>{i + 1}. {sub}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {ESTADO_3.map(([v, l]) => (
                              <Radio key={v} value={v} active={est[i] === v} label={l}
                                onClick={() => setEst({ ...est, [i]: v })} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            <div className="module-header" style={{ marginTop: 14 }}>| CONCLUSIÓN E IMÁGENES</div>
            <div className="ab-form-grid">
              <div className="tech-input-group col-span-full"><label>Conclusión (editable)</label>
                <textarea rows={3} className="tech-input" value={conclusion} disabled={readOnly} onChange={e => setConclusion(e.target.value)} /></div>
            </div>
            <p style={{ fontSize: 11, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Lock size={12} /> Adjuntar hasta 4 imágenes (JPG/PNG) disponible en <strong>Premium</strong>. Firma del arquitecto al generar PDF.
            </p>
          </div>
        </form>

        {/* ── DERECHA · VISTA PREVIA ── */}
        <div className="ab-split-right">
          <div className="ab-preview-head">
            <h2 className="ab-preview-title"><Icons.Accessibility size={14} /> Vista Previa de Exportación</h2>
            <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
          </div>
          <DocumentExportWrapper documentName="Memoria de Ruta Accesible" documentId="accesibilidad" projectId={projectId}>
            <div>
              <h3 style={pvH3}>Memoria de Ruta Accesible</h3>
              <p style={{ fontSize: 11, color: '#1a1a1a', marginBottom: 10 }}>{generalidades}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {GRUPOS.map(g => (
                    <Fragment key={g.n}>
                      <tr><td colSpan={2} style={{ ...pvTd, fontWeight: 700, background: '#f0f0f0' }}>Grupo {g.n} — {g.titulo}</td></tr>
                      {g.items.map(it => {
                        const e = it.id === '2.1' ? (calc21.cumple ? 'Cumple' : 'No cumple')
                          : it.id === '3.1' ? (EST_3_1.find(x => x[0] === est31)?.[1] ?? '')
                          : (ESTADO_3.find(x => x[0] === estados[it.id])?.[1] ?? '');
                        const col = it.id === '2.1' ? colorEstado(estado21) : it.id === '3.1' ? '#1a1a1a' : colorEstado(estados[it.id] ?? 'no-aplica');
                        return (
                          <tr key={it.id}>
                            <td style={pvTd}>{it.id} {it.titulo}</td>
                            <td style={{ ...pvTd, width: 90, fontWeight: 700, color: col }}>{e}</td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                  <tr><td colSpan={2} style={{ ...pvTd, fontWeight: 700, background: '#f0f0f0' }}>Servicios higiénicos accesibles — {shhGeneral}</td></tr>
                  <tr><td colSpan={2} style={{ ...pvTd, fontWeight: 700, background: '#f0f0f0' }}>Ducha — {duchaGeneral}</td></tr>
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: '#1a1a1a', marginTop: 10 }}><strong>Conclusión:</strong> {conclusion}</p>
            </div>
          </DocumentExportWrapper>
        </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
