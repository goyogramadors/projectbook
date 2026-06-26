/* =============================================================================
   meta.ts — Metadatos del selector de Construcción (etiquetas + opciones).
   Compartido por GeneradorEETTView y PresupuestoObraView. Coincide con el
   modelo de selección de los catálogos .md (activaSi.ts).
   ============================================================================= */
import type { SeleccionConstruccion } from './activaSi';

export type Opcion = { value: string; label: string };

export const NATURALEZAS: Opcion[] = [
  { value: 'obra_nueva', label: 'Obra nueva' },
  { value: 'ampliacion_mayor', label: 'Ampliación > 100 m²' },
  { value: 'alteracion', label: 'Alteración' },
  { value: 'reconstruccion', label: 'Reconstrucción' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'obra_menor', label: 'Obra menor' },
];
export const ESTRUCTURAS: Opcion[] = [
  { value: 'hormigon', label: 'Hormigón armado' }, { value: 'albanileria', label: 'Albañilería' },
  { value: 'metalica', label: 'Estructura metálica' }, { value: 'madera', label: 'Madera' },
  { value: 'tabiqueria_liviana', label: 'Tabiquería liviana' }, { value: 'prefabricado_sip', label: 'Prefabricado / SIP' },
];
export const TECHUMBRE_EST: Opcion[] = [
  { value: 'madera', label: 'Madera' }, { value: 'metalica', label: 'Metálica' },
  { value: 'cercha_industrial', label: 'Cercha industrial' }, { value: 'losa_hormigon', label: 'Losa hormigón' },
];
export const CUBIERTAS: Opcion[] = [
  { value: 'zincalum', label: 'Zinc-Alum' }, { value: 'teja', label: 'Teja' },
  { value: 'membrana', label: 'Membrana' }, { value: 'policarbonato', label: 'Policarbonato' },
];
export const CIELOS: Opcion[] = [
  { value: 'modular', label: 'Modular americano' }, { value: 'volcanita', label: 'Volcanita junta invisible' },
  { value: 'enlucido', label: 'Enlucido y pintado' }, { value: 'obra_gruesa', label: 'Obra gruesa (sin term.)' },
];
export const REV_MUROS: Opcion[] = [
  { value: 'pintura', label: 'Pintura' }, { value: 'ceramico', label: 'Cerámico' },
  { value: 'revest_madera', label: 'Entablado madera' }, { value: 'obra_gruesa', label: 'Obra gruesa (sin term.)' },
];
export const PISOS: Opcion[] = [
  { value: 'porcelanato', label: 'Porcelanato' }, { value: 'ceramico', label: 'Cerámico' },
  { value: 'vinilico', label: 'Vinílico' }, { value: 'flotante', label: 'Flotante' },
  { value: 'hormigon_pulido', label: 'Hormigón pulido' }, { value: 'alfombra', label: 'Alfombra' },
  { value: 'obra_gruesa', label: 'Obra gruesa (sin term.)' },
];
export const PUERTAS: Opcion[] = [
  { value: 'madera_mdf', label: 'Madera / MDF' }, { value: 'metalica', label: 'Metálica' },
  { value: 'cristal_templado', label: 'Cristal templado' }, { value: 'aluminio', label: 'Aluminio' },
];
export const VENTANAS: Opcion[] = [
  { value: 'aluminio', label: 'Aluminio' }, { value: 'pvc', label: 'PVC' },
  { value: 'madera', label: 'Madera' }, { value: 'fierro', label: 'Fierro' },
];
export const INSTALACIONES: Opcion[] = [
  { value: 'electrica', label: 'Eléctrica' }, { value: 'sanitaria', label: 'Sanitaria' },
  { value: 'climatizacion', label: 'Climatización' }, { value: 'gas', label: 'Gas' },
  { value: 'corrientes_debiles', label: 'Corrientes débiles' }, { value: 'incendio', label: 'Incendio' },
  { value: 'transporte_vertical', label: 'Transporte vertical' },
];
export const URBANIZACION: Opcion[] = [
  { value: 'pav_exterior', label: 'Pavimentos exteriores' }, { value: 'areas_verdes', label: 'Áreas verdes' },
  { value: 'cierros', label: 'Cierros perimetrales' }, { value: 'aguas_lluvia', label: 'Aguas lluvias' },
];
export const MOBILIARIO: Opcion[] = [
  { value: 'cocina', label: 'Muebles de cocina' }, { value: 'banos', label: 'Muebles de baño' },
  { value: 'closets', label: 'Clósets / repisas' }, { value: 'mesones', label: 'Mesones' },
];
export const COMPLEMENTARIAS: Opcion[] = [
  { value: 'estructuras', label: 'Estructuras' }, { value: 'climatizacion', label: 'Climatización' },
  { value: 'sanitarias', label: 'Sanitarias' }, { value: 'electricidad', label: 'Electricidad' },
  { value: 'accesibilidad', label: 'Accesibilidad universal' }, { value: 'eficiencia_energetica', label: 'Eficiencia energética' },
  { value: 'gas', label: 'Gas' }, { value: 'corrientes_debiles', label: 'Corrientes débiles' },
  { value: 'paisajismo', label: 'Paisajismo' }, { value: 'incendio', label: 'Incendio' },
];

export const labelOf = (ops: Opcion[], v: string): string => ops.find((o) => o.value === v)?.label ?? v;
export const joinLabels = (ops: Opcion[], vs: string[], fallback: string): string =>
  vs.length ? vs.map((v) => labelOf(ops, v).toLowerCase()).join(', ') : fallback;

/** Selección por defecto (vacía). naturaleza se sobrescribe desde el ProjectMaster. */
export const SELECCION_VACIA: SeleccionConstruccion = {
  naturaleza: 'obra_nueva', estructura: [], fundaciones: false, radier: false, sobrelosa: false,
  demoliciones: false, techumbre: false, tabiqueria: false, pinturas: false, banos: false,
  mobiliario: false, cumplir_termica: false, resistencia_fuego: false, techumbre_estructura: [],
  cubierta_material: 'zincalum', cielos: [], rev_muros: [], pisos: [], puertas: [], ventanas: [],
  instalaciones: [], urbanizacion: [], eett_complementarias: [], mobiliario_items: [],
};
