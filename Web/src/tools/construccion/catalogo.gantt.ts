/* AUTO-GENERADO por Web/scripts/build-catalogos-construccion.mjs — NO editar a mano.
   Fuente: DESARROLLO/EETT y Presupuesto/CATALOGO_GANTT_PLAZOS.md */
export interface PlazoCapitulo { orden: number; cap: number; nombre: string; semanas: number; solape: number; }
export const CATALOGO_GANTT: PlazoCapitulo[] = [
  { orden: 1, cap: 1, nombre: "Obras Preliminares e Instalación de Faenas", semanas: 2, solape: 0 },
  { orden: 2, cap: 2, nombre: "Habilitación del Terreno", semanas: 2, solape: 1 },
  { orden: 3, cap: 3, nombre: "Demoliciones y Obras Previas", semanas: 1, solape: 1 },
  { orden: 4, cap: 4, nombre: "Obra Gruesa", semanas: 8, solape: 1 },
  { orden: 5, cap: 5, nombre: "Terminaciones", semanas: 8, solape: 3 },
  { orden: 6, cap: 6, nombre: "Instalaciones (Especialidades)", semanas: 6, solape: 5 },
  { orden: 7, cap: 7, nombre: "Térmica y Protección al Fuego", semanas: 2, solape: 1 },
  { orden: 8, cap: 8, nombre: "Urbanización y Exteriores", semanas: 3, solape: 2 },
  { orden: 9, cap: 9, nombre: "Aseo, Entrega y Recepción", semanas: 1, solape: 0 },
];
