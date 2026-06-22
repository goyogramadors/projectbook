/* =============================================================================
   CalculadoraConstruccionesMinvuView.tsx — CALCULADORA DE COSTOS MINVU (T-41)
   -----------------------------------------------------------------------------
   Presupuesto base de construcción según las tablas MINVU (2.º trimestre 2026):
   categoriza cada volumen (edificación u "otras construcciones"), calcula el
   costo unitario por m² y el total del proyecto. Persiste los volúmenes en
   localStorage bajo ab-calc-minvu-${projectId}. Hereda los 4 temas vía clases
   de producción (tool-panel/tech-input/technical-btn) + tokens shadcn.
   ============================================================================= */
import { useEffect, useMemo, useState, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Plus, Trash2, Info, Building2, Warehouse, ChevronDown, ChevronUp, CheckCircle2, Minus } from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { useToast } from '../core/ui/ToastProvider';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
type TipoEstructura = 'edificacion' | 'otras';
type CatOtras = 'a' | 'b' | 'c';
type PuntosMap = Record<string, boolean | number>;
interface Construccion {
  id: number;
  type: TipoEstructura;
  classification: string;
  catOtras: CatOtras;
  isSocial: boolean;
  area: number;
  points: PuntosMap;
  isExpanded: boolean;
  activeQGroup: number;
  completedQGroups: number[];
}

/* ── constantes ────────────────────────────────────────────────────────────── */
const TOOL_ID = 'calc-minvu';
interface MinvuGuardado { constructions: Construccion[]; }

const TABLA_EDIFICACION: Record<string, Record<number, number | null>> = {
  A: { 1: 475515, 2: 352952, 3: 260056, 4: 185722, 5: null },
  B: { 1: 542390, 2: 401206, 3: 297195, 4: 211694, 5: 113686 },
  C: { 1: 475515, 2: 352952, 3: 260056, 4: 185722, 5: 100292 },
  D: { 1: 475515, 2: 352952, 3: 260056, 4: 185722, 5: 100292 },
  E: { 1: 338028, 2: 252581, 3: 185722, 4: 133623, 5: 100292 },
  F: { 1: null, 2: 178338, 3: 130018, 4: 92807, 5: 70532 },
  G: { 1: null, 2: 252581, 3: 185722, 4: 133623, 5: 107697 },
  H: { 1: null, 2: 230334, 3: 167144, 4: 118913, 5: 96579 },
  I: { 1: null, 2: 278641, 3: 204403, 4: 144830, 5: 115095 },
};

const TABLA_OTRAS: Record<CatOtras, Record<string, number>> = {
  a: { AA: 139542, AB: 120511, AE: 111377, BA: 176379, BB: 185429, BE: 148641, CA: 176379, CE: 148641, EE: 111377, FE: 59314, MM: 111377, MA: 111377, ME: 111377 },
  b: { AA: 83765, AB: 72314, AE: 67549, BA: 105798, BB: 111361, BE: 89201, CA: 105798, CE: 89201, EE: 66853, FE: 59314, MM: 66853, MA: 66853, ME: 66853 },
  c: { AA: 27924, AB: 24068, AE: 35266, BA: 35266, BB: 37133, BE: 29685, CA: 35266, CE: 29685, EE: 22382, FE: 59314, MM: 22382, MA: 22382, ME: 22382 },
};

interface Clasif { id: string; name: string; desc: string; }
const CLASIFICACIONES_EDIFICACION: Clasif[] = [
  { id: 'A', name: 'A - Acero', desc: 'Estructura de acero. Entrepisos metálicos o losas de hormigón.' },
  { id: 'B', name: 'B - Hormigón Armado', desc: 'Hormigón armado o mixto (acero/hormigón). Entrepisos de losa.' },
  { id: 'C', name: 'C - Albañilería Confinada', desc: 'Ladrillo confinado entre pilares/cadenas de hormigón.' },
  { id: 'D', name: 'D - Albañilería Armada / Bloques', desc: 'Albañilería de bloques o piedra, confinados.' },
  { id: 'E', name: 'E - Madera', desc: 'Estructura soportante de madera. Paneles ligeros.' },
  { id: 'F', name: 'F - Adobe / Tierra', desc: 'Adobe, tierra cemento u aglomerados livianos.' },
  { id: 'G', name: 'G - Prefab. Metálica', desc: 'Prefabricadas con estructura metálica y paneles.' },
  { id: 'H', name: 'H - Prefab. Madera', desc: 'Prefabricadas de madera y paneles ligeros.' },
  { id: 'I', name: 'I - Paneles Prefabricados', desc: 'Hormigón liviano, paneles SIP, poliestireno c/malla.' },
];
const CLASIFICACIONES_OTRAS: Clasif[] = [
  { id: 'AA', name: 'AA (Acero / Acero)', desc: 'Vertical: Acero - Techumbre: Acero' },
  { id: 'AB', name: 'AB (Acero / Hormigón)', desc: 'Vertical: Acero - Techumbre: Hormigón' },
  { id: 'AE', name: 'AE (Acero / Madera)', desc: 'Vertical: Acero - Techumbre: Madera' },
  { id: 'BA', name: 'BA (Hormigón / Acero)', desc: 'Vertical: Hormigón - Techumbre: Acero' },
  { id: 'BB', name: 'BB (Hormigón / Hormigón)', desc: 'Vertical: Hormigón - Techumbre: Hormigón' },
  { id: 'BE', name: 'BE (Hormigón / Madera)', desc: 'Vertical: Hormigón - Techumbre: Madera' },
  { id: 'CA', name: 'CA (Albañil. / Acero)', desc: 'Vertical: Albañilería - Techumbre: Acero' },
  { id: 'CE', name: 'CE (Albañil. / Madera)', desc: 'Vertical: Albañilería - Techumbre: Madera' },
  { id: 'EE', name: 'EE (Madera / Madera)', desc: 'Vertical: Madera - Techumbre: Madera' },
  { id: 'FE', name: 'FE (Adobe / Madera)', desc: 'Vertical: Adobe - Techumbre: Madera' },
  { id: 'MM', name: 'MM (Autosop. / Autosop.)', desc: 'Paneles Autosoportantes' },
  { id: 'MA', name: 'MA (Autosop. / Acero)', desc: 'Vertical: Autosop. - Techumbre: Acero' },
  { id: 'ME', name: 'ME (Autosop. / Madera)', desc: 'Vertical: Autosop. - Techumbre: Madera' },
];

interface PreguntaItem { id: string; label: string; pts: number; }
interface SelectItem { id: string; label: string; options: Array<{ label: string; v: number }>; }
interface GrupoCuestionario { group: string; items: PreguntaItem[]; notes?: string[]; selects?: SelectItem[]; }
const CUESTIONARIO: GrupoCuestionario[] = [
  {
    group: 'Diseño',
    items: [
      { id: 'd1', label: 'Acogido a conjunto armónico de cualquier destino o viviendas en extensión acogidas a la Ley N° 19.537 (condominios tipo A o B)', pts: 1 },
      { id: 'd2', label: 'Juegos volumétricos o ángulos no perpendiculares en una o más fachadas (en planta o elevación).', pts: 1 },
      { id: 'd3', label: 'Distintos niveles interiores en planta y/o más de un volumen construido. (1)', pts: 1 },
      { id: 'd4', label: 'Existencia de elementos ornamentales en las fachadas tales como: arcadas, cornisas, balaustradas, frontones, portales, columnas con elementos ornamentales, fachadas falsas, u otros elementos similares.', pts: 1 },
      { id: 'd5', label: 'Tres o más planos de fachada, cuyos desplazamientos sean iguales o superiores a 1 m.', pts: 1 },
      { id: 'd6', label: 'Alturas de edificación: Vivienda Unifamiliar con alturas de piso a cielo superiores a 3,0 m. en al menos un recinto; o Edificios residenciales con departamentos > 2,5 m. y/o Hall > 7,00 m.; o Edificios no residenciales con alturas > 3,5 m. y/o Hall > 7,00 m.', pts: 1 },
      { id: 'd7', label: 'Unidades habitacionales de más de 140 m2.', pts: 1 },
      { id: 'd8', label: 'En unidades habitacionales, la existencia de recintos destinados a biblioteca, más de un estar, estudio, gimnasio, capilla u oratorio, quincho, salas de cine, televisión o música, salas de juegos, sauna, solarium o baño con tina de hidromasajes, o similares.', pts: 1 },
      { id: 'd9', label: 'Construcciones con al menos una unidad o departamento con acceso exclusivo desde un ascensor.', pts: 1 },
      { id: 'd10', label: 'Construcciones con subterráneo con recintos habitables (según artículo 4.1.1. de la OGUC).', pts: 1 },
      { id: 'd11', label: 'En unidad habitacional, estacionamiento integrado a la construcción. (2)', pts: 1 },
      { id: 'd12', label: 'Al menos 2 recintos de los bienes comunes destinados a: biblioteca, gimnasio, solarium, capilla u oratorio, quincho, salas de cine, televisión o música, salas de eventos o reuniones, o similares.', pts: 1 },
    ],
    notes: [
      '(1) Aplica puntaje cuando el edificio está constituido por más de un volumen y/o cuenta con distintos niveles.',
      '(2) Aplica puntaje cuando el estacionamiento es parte integrante de la unidad habitacional (vivienda).',
    ],
  },
  {
    group: 'Estructura',
    items: [
      { id: 'e1', label: 'Construcciones que soportan en pisos superiores: helipuertos, piscinas, estanques de agua o similares.', pts: 1 },
      { id: 'e2', label: 'Losas reforzadas y/o nervadas.', pts: 1 },
      { id: 'e3', label: 'Construcciones escalonadas a nivel de fundaciones y/o volumétricamente escalonadas.', pts: 1 },
    ],
    selects: [
      { id: 's_pisos', label: 'Altura de la Edificación en pisos (s/ art. 1.1.2. OGUC)', options: [{ label: 'Hasta 4 pisos', v: 0 }, { label: '5 a 10 pisos', v: 2 }, { label: '11 o más', v: 3 }] },
      { id: 's_subt', label: 'Subterráneos', options: [{ label: 'Sin subterráneos', v: 0 }, { label: 'Hasta 3 niveles', v: 2 }, { label: '4 o más', v: 3 }] },
      { id: 's_luces', label: 'Distancia entre apoyos (luces en m.)', options: [{ label: 'Hasta 3.5m', v: 0 }, { label: '> 3,5m <= 8.0 m', v: 2 }, { label: '> 8.10 m', v: 3 }] },
    ],
  },
  {
    group: 'Instalaciones',
    items: [
      { id: 'i1', label: 'Viviendas unifamiliares con dotación de ascensores y/o montacargas.', pts: 1 },
      { id: 'i2', label: 'Existencia de uno o más ascensores panorámicos', pts: 1 },
      { id: 'i3', label: 'Existencia de una o más escaleras mecánicas, rampas mecánicas o elevador para vehículos.', pts: 1 },
      { id: 'i4', label: 'Climatización: Calefacción centralizada por losa, muro, radiadores o zócalos; y/o Sistema centralizado de aire acondicionado.', pts: 1 },
      { id: 'i5', label: 'Aspiración centralizada. Sistema centralizado de inyección y/o extracción de aire y/o gases (se exceptúan zonas verticales de seguridad).', pts: 1 },
      { id: 'i6', label: 'Instalaciones concentradas en un piso mecánico.', pts: 1 },
      { id: 'i7', label: 'Sistema de correo neumático.', pts: 1 },
      { id: 'i8', label: 'Fibra óptica incorporada a las instalaciones.', pts: 1 },
      { id: 'i9', label: 'Detectores de movimiento.', pts: 1 },
      { id: 'i10', label: 'Circuito interno de comunicación por televisión.', pts: 1 },
    ],
  },
  {
    group: 'Terminaciones',
    items: [
      { id: 't1', label: 'Revestimientos exteriores, que supere en un 1/3 la superficie combinada de: Mármol natural, pizarra, piedra, granito o porcelanato, enchapes en maderas nativas. Muros cortinas, cristales o espejos; o Recubrimientos metálicos: cobre, aluminio o acero inoxidable. Otro material de características similares.', pts: 1 },
      { id: 't2', label: 'Revestimientos interiores en espacios comunes (Ley N° 19.537): Mármol natural, pizarra, piedra, granito o porcelanato; Maderas finas; Otro material similar.', pts: 1 },
      { id: 't3', label: 'Revestimientos interiores en Viviendas Unifamiliares / no acogidas a Ley N° 19.537: Mármol natural, pizarra, piedra, granito o porcelanato; Maderas finas; Otro material similar.', pts: 1 },
      { id: 't4', label: 'Pavimentos de los espacios comunes (Ley N° 19.537): Mármol natural, pizarra, piedra, granito o porcelanato, maderas finas, alfombras > 10mm u otros de calidad similar.', pts: 1 },
      { id: 't5', label: 'Pavimentos en Viviendas Unifamiliares / no acogidas a Ley N° 19.537: Mármol natural, pizarra, piedra, granito o porcelanato, maderas finas, alfombras > 10mm u otros de calidad similar.', pts: 1 },
      { id: 't6', label: 'Puertas y Ventanas en unidad habitacional: existencia de puertas y/o ventanas, en más de un vano, en maderas finas.', pts: 1 },
      { id: 't7', label: 'Cubiertas: Acrílicos, cristales, cubierta de cobre, pizarra, tejuelas de alerce, arcilla.', pts: 1 },
    ],
  },
];

const CONSTRUCCION_NUEVA = (classification: string): Construccion => ({
  id: Date.now(), type: 'edificacion', classification, catOtras: 'b', isSocial: false,
  area: 200, points: {}, isExpanded: true, activeQGroup: 0, completedQGroups: [],
});

const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
};

/* ── componente principal ──────────────────────────────────────────────────── */
export default function CalculadoraConstruccionesMinvuView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [saving, setSaving] = useState(false);
  // Persistencia unificada (Fase 2): useToolData. El arreglo se envuelve en { constructions }
  // porque el hook opera sobre objetos (no sobre arreglos de nivel superior).
  const { data, setData, save } = useToolData<MinvuGuardado>(TOOL_ID, projectId, { constructions: [CONSTRUCCION_NUEVA('B')] });
  const { constructions } = data;
  const setConstructions = (u: SetStateAction<Construccion[]>) => setData((d) => ({ ...d, constructions: typeof u === 'function' ? u(d.constructions) : u }));

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      const ok = await save();
      triggerToast(ok ? 'Presupuesto MINVU guardado en el proyecto.' : 'Selecciona un proyecto para persistir el cálculo.');
    } catch {
      triggerToast('Error al guardar el cálculo.');
    } finally {
      window.setTimeout(() => setSaving(false), 400);
    }
  };

  const addConstruction = () => { if (!readOnly) setConstructions(prev => [...prev, CONSTRUCCION_NUEVA('C')]); };
  const updateConstruction = <K extends keyof Construccion>(id: number, field: K, value: Construccion[K]) =>
    setConstructions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  const removeConstruction = (id: number) => setConstructions(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);

  const togglePoint = (id: number, qId: string, value: number | null, isSelect = false) =>
    setConstructions(prev => prev.map(c => {
      if (c.id !== id) return c;
      const points: PuntosMap = { ...c.points };
      if (isSelect) points[qId] = value ?? 0;
      else points[qId] = !points[qId];
      return { ...c, points };
    }));

  const toggleQGroup = (cId: number, gIdx: number) =>
    setConstructions(prev => prev.map(c => c.id === cId ? { ...c, activeQGroup: c.activeQGroup === gIdx ? -1 : gIdx } : c));

  const nextQGroup = (cId: number, gIdx: number) =>
    setConstructions(prev => prev.map(c => {
      if (c.id !== cId) return c;
      const completedQGroups = c.completedQGroups.includes(gIdx) ? c.completedQGroups : [...c.completedQGroups, gIdx];
      return { ...c, completedQGroups, activeQGroup: gIdx + 1 < CUESTIONARIO.length ? gIdx + 1 : -1 };
    }));

  const evaluatedConstructions = useMemo(() => constructions.map(c => {
    let category = 4;
    let unitCost = 0;
    let totalPts = 0;
    if (c.type === 'edificacion') {
      if (c.isSocial) {
        category = 5;
      } else {
        Object.values(c.points).forEach(v => {
          if (typeof v === 'boolean' && v) totalPts += 1;
          if (typeof v === 'number') totalPts += v;
        });
        if (totalPts >= 20) category = 1;
        else if (totalPts >= 13) category = 2;
        else if (totalPts >= 6) category = 3;
        else category = 4;
      }
      unitCost = TABLA_EDIFICACION[c.classification]?.[category] ?? 0;
    } else {
      unitCost = TABLA_OTRAS[c.catOtras]?.[c.classification] ?? 0;
    }
    return { ...c, totalPts, category, unitCost, totalCost: (unitCost ?? 0) * (Number(c.area) || 0) };
  }), [constructions]);

  const grandTotal = evaluatedConstructions.reduce((acc, c) => acc + c.totalCost, 0);

  const selectStyle = { width: '100%' } as const;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 className="ab-section-title" style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' }}>
          <Building2 size={22} strokeWidth={1.4} /> Calculadora de Costos MINVU
        </h2>
        <button className="technical-btn" onClick={handleSave} disabled={saving || readOnly} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? <RefreshCw size={14} className="ab-spin" /> : <Save size={14} />}
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div className="ab-split">
      <div className="ab-split-left">
      <div className="tool-panel">
        <div className="module-header">| PRESUPUESTO BASE POR VOLUMEN (TABLAS MINVU · 2.º TRIM. 2026)</div>
        <div className="panel-content">
          <p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            {project ? <>Proyecto activo: <strong>{project.name}</strong> · {project.etapa}</> : 'Sin proyecto activo: el cálculo no se persistirá hasta seleccionar uno.'}
          </p>

          <details style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 20 }}>
            <summary style={{ fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Info size={15} /> Ver normativas de Categorización y Puntajes
            </summary>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p><strong>1. Categorías Edificación:</strong> 1.- Superior (≥ 20 ptos), 2.- Media Superior (13-19), 3.- Media (6-12), 4.- Media Inferior (0-5). La 5.- Inferior es para Vivienda Social / SERVIU.</p>
              <p><strong>2. Categoría 4 por defecto:</strong> si obtiene 0-5 ptos y no es vivienda social SERVIU, se asigna Categoría 4.</p>
              <p><strong>3. Volúmenes Múltiples:</strong> aplique la tabla en cada parte de la construcción, salvo vivienda unifamiliar.</p>
            </div>
          </details>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence>
              {evaluatedConstructions.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--card)' }}>
                  <div onClick={() => updateConstruction(item.id, 'isExpanded', !item.isExpanded)} style={{ background: 'var(--muted)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: 6, borderRadius: 'var(--radius)', background: item.type === 'edificacion' ? 'var(--primary)' : 'var(--accent)', color: item.type === 'edificacion' ? 'var(--primary-foreground)' : 'var(--accent-foreground)', display: 'inline-flex' }}>
                        {item.type === 'edificacion' ? <Building2 size={16} /> : <Warehouse size={16} />}
                      </div>
                      <h3 style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Volumen {index + 1}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{formatCurrency(item.totalCost)}</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); removeConstruction(item.id); }} disabled={readOnly} className="ab-btn-ghost" style={{ padding: 6, color: 'var(--destructive)' }} title="Quitar volumen"><Trash2 size={16} /></button>
                        <button className="ab-btn-ghost" style={{ padding: 6 }} onClick={(e) => { e.stopPropagation(); updateConstruction(item.id, 'isExpanded', !item.isExpanded); }}>{item.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                      </div>
                    </div>
                  </div>

                  {item.isExpanded && (
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                        <div className="tech-input-group" style={{ marginBottom: 0 }}>
                          <label>Tipo de Estructura</label>
                          <select className="tech-select" style={selectStyle} value={item.type} disabled={readOnly}
                            onChange={(e) => { const t = e.target.value as TipoEstructura; updateConstruction(item.id, 'type', t); updateConstruction(item.id, 'classification', t === 'edificacion' ? 'C' : 'BA'); }}>
                            <option value="edificacion">Edificación Principal</option>
                            <option value="otras">Otras Construcciones (Galpones)</option>
                          </select>
                        </div>
                        <div className="tech-input-group" style={{ marginBottom: 0 }}>
                          <label>Clasificación</label>
                          <select className="tech-select" style={selectStyle} value={item.classification} disabled={readOnly} onChange={(e) => updateConstruction(item.id, 'classification', e.target.value)}>
                            {(item.type === 'edificacion' ? CLASIFICACIONES_EDIFICACION : CLASIFICACIONES_OTRAS).map(c => (
                              <option key={c.id} value={c.id} title={c.desc}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="tech-input-group" style={{ marginBottom: 0 }}>
                          <label>Superficie Total (m²)</label>
                          <input type="number" min="0" className="tech-input" value={item.area || ''} disabled={readOnly} onChange={(e) => updateConstruction(item.id, 'area', parseFloat(e.target.value) || 0)} style={{ textAlign: 'right' }} />
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                      {item.type === 'edificacion' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Categoría (Cálculo de Puntaje)</h4>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: 'var(--accent-foreground)', background: 'var(--accent)', padding: '4px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', border: '1px solid var(--border)' }}>
                              <input type="checkbox" checked={item.isSocial} disabled={readOnly} onChange={(e) => updateConstruction(item.id, 'isSocial', e.target.checked)} />
                              Forzar Categoría 5 (Vivienda Social)
                            </label>
                          </div>

                          {!item.isSocial && (
                            <div style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
                              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                Seleccione las características presentes:
                                <span style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '2px 8px', borderRadius: 'var(--radius)' }}>{item.totalPts} pts → Categoría {item.category}</span>
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {CUESTIONARIO.map((grupo, gIdx) => {
                                  const isOpen = item.activeQGroup === gIdx;
                                  const isCompleted = item.completedQGroups.includes(gIdx);
                                  return (
                                    <div key={gIdx} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)', overflow: 'hidden' }}>
                                      <button className="ab-btn-ghost" style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12 }} onClick={() => toggleQGroup(item.id, gIdx)}>
                                        {isCompleted ? <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} /> : isOpen ? <Minus size={18} style={{ color: 'var(--muted-foreground)' }} /> : <Plus size={18} style={{ color: 'var(--muted-foreground)' }} />}
                                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{grupo.group}</span>
                                      </button>
                                      <AnimatePresence>
                                        {isOpen && (
                                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
                                            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                              {grupo.items.map(q => (
                                                <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--muted-foreground)', padding: 6, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                                                  <input type="checkbox" style={{ marginTop: 2 }} checked={!!item.points[q.id]} disabled={readOnly} onChange={() => togglePoint(item.id, q.id, null, false)} />
                                                  <span style={{ lineHeight: 1.35, flex: 1 }}>{q.label}</span>
                                                </label>
                                              ))}
                                              {grupo.notes && (
                                                <div style={{ marginTop: 4, fontSize: 10, color: 'var(--muted-foreground)', paddingLeft: 28, background: 'var(--card)', padding: 8, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                                  {grupo.notes.map((nota, nIdx) => <p key={nIdx} style={{ margin: '2px 0' }}>{nota}</p>)}
                                                </div>
                                              )}
                                              {grupo.selects?.map(s => (
                                                <div key={s.id} style={{ marginTop: 8, background: 'var(--card)', padding: 10, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6 }}>{s.label}</label>
                                                  <select className="tech-select" style={selectStyle} value={typeof item.points[s.id] === 'number' ? (item.points[s.id] as number) : 0} disabled={readOnly} onChange={(e) => togglePoint(item.id, s.id, parseInt(e.target.value, 10), true)}>
                                                    {s.options.map((opt, oIdx) => <option key={oIdx} value={opt.v}>{opt.label} (+{opt.v} pts)</option>)}
                                                  </select>
                                                </div>
                                              ))}
                                              <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                                                <button className="technical-btn" onClick={() => nextQGroup(item.id, gIdx)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>Continuar <ChevronDown size={13} /></button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Grado de terminación</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            {([
                              ['a', 'Cat. A (Superior)', 'Cierros completos, oficinas interiores, radier reforzado, baños completos.'],
                              ['b', 'Cat. B (Corriente)', 'Estructura, cierros en ≥3 lados, radier corriente, baño mínimo.'],
                              ['c', 'Cat. C (Inferior)', 'Solo estructura y cubierta. Sin cierros o incompletos.'],
                            ] as Array<[CatOtras, string, string]>).map(([cat, titulo, desc]) => {
                              const activo = item.catOtras === cat;
                              return (
                                <label key={cat} style={{ border: `1.5px solid ${activo ? 'var(--foreground)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 12, cursor: 'pointer', background: activo ? 'var(--muted)' : 'var(--card)' }}>
                                  <input type="radio" name={`cat-${item.id}`} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} checked={activo} disabled={readOnly} onChange={() => updateConstruction(item.id, 'catOtras', cat)} />
                                  <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>{titulo}</p>
                                  <p style={{ fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.3, margin: 0 }}>{desc}</p>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ background: 'var(--muted)', padding: 12, borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, border: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>Subtotal Volumen: </span>
                          <span style={{ color: 'var(--muted-foreground)' }}>{item.classification}-{item.type === 'edificacion' ? item.category : item.catOtras.toUpperCase()} ({item.unitCost ? `${formatCurrency(item.unitCost)}/m²` : 'N/A'})</span>
                        </div>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(item.totalCost)}</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button onClick={addConstruction} disabled={readOnly} className="ab-btn" style={{ width: '100%', marginTop: 16, padding: 10, border: '1.5px dashed var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: 'var(--muted-foreground)' }}>
            <Plus size={16} /> Añadir volumen al proyecto
          </button>

          <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 16, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Total Presupuesto Base</span>
            <span style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--destructive)' }}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Building2 size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Presupuesto Base MINVU" documentId="T-41" projectId={projectId}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Presupuesto Base de Construcción (MINVU)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: '#1a1a1a' }}>
              <thead><tr>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Volumen</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>m²</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>$/m²</th>
                <th style={{ padding: '6px 8px', borderBottom: '1.5px solid #1a1a1a', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', color: '#444' }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {evaluatedConstructions.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>V{i + 1} · {c.classification}-{c.type === 'edificacion' ? c.category : c.catOtras.toUpperCase()}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{(Number(c.area) || 0).toLocaleString('es-CL')}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{formatCurrency(c.unitCost)}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', textAlign: 'right' }}>{formatCurrency(c.totalCost)}</td>
                  </tr>
                ))}
                <tr><td style={{ padding: '7px 8px', fontWeight: 800, borderTop: '2px solid #1a1a1a' }} colSpan={3}>TOTAL PRESUPUESTO BASE</td><td style={{ padding: '7px 8px', fontWeight: 800, borderTop: '2px solid #1a1a1a', textAlign: 'right' }}>{formatCurrency(grandTotal)}</td></tr>
              </tbody>
            </table>
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}
    </motion.div>
  );
}
