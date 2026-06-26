// =============================================================================
// src/types/NormativaPRC.ts
// Colección Firestore: normativas_prc
// Document ID pattern: {comuna_slug}_{codigo_zona_edificacion}
// Fuente: PRCP Providencia 2007, Ordenanza Refundida mayo 2025
// =============================================================================

// -----------------------------------------------------------------------------
// CATÁLOGOS CONTROLADOS
// -----------------------------------------------------------------------------

/** Área donde se ubica el terreno según el Instrumento de Planificación Territorial */
export type AreaTerreno = "URBANA" | "EXTENSION_URBANA" | "RURAL";

/** Sistema de agrupamiento de la edificación */
export type SistemaAgrupamiento =
  | "AISLADA"                   // EA3, EA5, EA7, EA12, EAL
  | "CONTINUA"                  // EC3, EC5, EC7, EC12
  | "PAREADA"
  | "MIXTA_CONTINUA_AISLADA"    // EC2+A8, EC3+AL, E5(C+A)
  | "AISLADA_PAREADA_CONTINUA"  // E3
  | "ESPECIAL";                 // ZE ex-CCU, ZEMoI/ZIM

/** Clasificación interna del tipo de zona de edificación */
export type TipoZonaEdificacion =
  | "EC"        // Edificación Continua (EC3, EC5, EC7, EC12)
  | "EA"        // Edificación Aislada (EA3, EA5, EA7, EA12, EAL)
  | "E"         // Edificación combinada (E3, E5 C+A)
  | "MIXTA"     // Continua + Aislada (EC2+A8, EC3+AL)
  | "ZEMOI_ZIM" // Zona Equipamiento Metropolitano o Intercomunal
  | "ESPECIAL"; // Zonas especiales (ZE ex-CCU)

/**
 * Zona de uso de suelo (plano L3/4 del PRCP).
 * Overlay independiente al de edificación (plano L2/4).
 */
export type ZonaUsoSuelo =
  | "UR"          // Zona de Uso Residencial (puro, sin mezcla)
  | "UpR_y_Er"    // Preferentemente residencial y equipamiento restringido
  | "UpR_y_E"     // Preferentemente residencial y equipamiento
  | "UpR_y_ECr"   // Preferentemente residencial y equipamiento comercial restringido
  | "UpR_y_E_CC"  // Subzona residencial de equipamiento culto y cultura
  | "UpEC"        // Preferentemente equipamiento comercial
  | "UpAP_e_Ir"   // Preferentemente actividades productivas e industria restringida
  | "ZEMOI_ZIM"   // Equipamiento metropolitano o intercomunal / Zona de interés metropolitano
  | "ZUSP_R"      // Uso de suelo patrimonial residencial
  | "ZE";         // Zona Especial (ex-CCU)

/**
 * Indica si el COS aplica igual a todos los pisos o
 * es diferenciado entre primer piso y pisos superiores.
 */
export type NivelAplicacionCOS =
  | "UNICO"
  | "DIFERENCIADO_PISO1_SUPERIORES";

/** Condición de protección patrimonial del inmueble o zona */
export type CondicionPatrimonial =
  | "SIN_RESTRICCION"
  | "ICH"    // Inmueble de Conservación Histórica (Cuadro 23 OL)
  | "ZCH"    // Zona de Conservación Histórica (Cuadro 22 OL)
  | "ZT"     // Zona Típica (CMN, Cuadro 20 OL)
  | "MH"     // Monumento Histórico (CMN, Cuadro 21 OL)
  | "ZIM"    // Zona de Interés Metropolitano
  | "ZEMOI"; // Zona de Equipamiento Metropolitano o Intercomunal

// -----------------------------------------------------------------------------
// TIPOS AUXILIARES
// -----------------------------------------------------------------------------

/** Variante de antejardín según si la línea oficial tiene o no retiro */
export interface OpcionAntejardín {
  /** Descripción de la condición: "Sin antejardín" | "Antejardín 3 m" | "Antejardín 5 m o más" */
  condicion: string;
  /** Metros de ochavo requerido en la Línea Oficial para esa condición */
  ochavo_lo_metros: number;
}

// -----------------------------------------------------------------------------
// INTERFAZ PRINCIPAL
// -----------------------------------------------------------------------------

export interface NormativaPRC {
  // ── Clave (no almacenada como campo en Firestore, es el Document ID) ────────
  /** Document ID: {comuna_slug}_{codigo_zona}. Ej: "providencia_ec5" */
  _id: string;

  // ── Identificación del instrumento ─────────────────────────────────────────

  /** Nombre oficial de la comuna. Ej: "Providencia" */
  comuna: string;

  /** Slug normalizado (minúsculas, sin tildes, sin espacios). Ej: "providencia" */
  comuna_slug: string;

  /** Región administrativa. Ej: "Región Metropolitana de Santiago" */
  region: string;

  /** Área del terreno según clasificación IPT */
  area_terreno: AreaTerreno;

  /** Nombre completo del Plan Regulador Comunal vigente */
  plan_regulador_comunal: string;

  /** Número y fecha del decreto que aprueba el PRC */
  plan_regulador_comunal_decreto: string;

  /** Fecha de publicación en Diario Oficial. Formato ISO "YYYY-MM-DD" */
  plan_regulador_comunal_fecha_do: string;

  /** Descripción de la última modificación vigente */
  plan_regulador_comunal_ultima_mod: string;

  /** Plan Regulador Intercomunal aplicable, o null si no aplica */
  plan_regulador_intercomunal: string | null;

  /** Plan Regulador Metropolitano aplicable, o null si no aplica */
  plan_regulador_metropolitano: string | null;

  // ── Zona / Subzona de edificación (plano L2/4) ──────────────────────────────

  /** Código oficial de zona de edificación. Ej: "EC5", "EA7", "EC2_A8" */
  zona_codigo: string;

  /** Nombre completo de la zona. Ej: "Zona de Edificación Continua, de máximo 5 pisos" */
  zona_nombre: string;

  /** Descripción normativa de la zona */
  zona_descripcion: string;

  /** Clasificación interna del tipo de zona de edificación */
  tipo_zona_edificacion: TipoZonaEdificacion;

  /** Artículo y cuadro de referencia en la Ordenanza Local */
  referencia_articulo_ordenanza: string;

  // ── Zona de uso de suelo asociada (plano L3/4, overlay independiente) ───────

  /** Código de la zona de uso de suelo predominante en esta zona de edificación */
  zona_uso_suelo_codigo: ZonaUsoSuelo;

  /** Nombre completo de la zona de uso de suelo */
  zona_uso_suelo_nombre: string;

  /** Artículo y cuadro de referencia del uso de suelo en la Ordenanza Local */
  zona_uso_suelo_referencia: string;

  // ── Usos de suelo ───────────────────────────────────────────────────────────

  /** Texto completo de usos permitidos para mostrar al usuario */
  usos_permitidos_txt: string;

  /** Texto completo de usos prohibidos para mostrar al usuario */
  usos_prohibidos_txt: string;

  /**
   * Palabras clave estandarizadas de usos para filtros rápidos en Firestore
   * (array-contains). Ej: ["vivienda","comercio","salud"]
   */
  usos_keywords: string[];

  // ── Superficie predial mínima ───────────────────────────────────────────────

  /** Superficie predial mínima en metros cuadrados (number puro). Null si no aplica o es libre */
  superficie_predial_minima_m2: number | null;

  /** Descripción completa de la subdivisión mínima incluyendo excepciones */
  superficie_predial_minima_txt: string;

  // ── Coeficiente de constructibilidad ───────────────────────────────────────

  /**
   * Coeficiente de constructibilidad como decimal.
   * Ej: 1.80 (no "180%"). Null si es libre o se determina por envolvente.
   */
  coef_constructibilidad: number | null;

  /** Aclaraciones sobre la aplicación del coeficiente */
  coef_constructibilidad_notas: string | null;

  /**
   * Coeficiente adicional para cuerpo adosado en zonas /pa.
   * Ej: 0.50 para EA5/pa. Null si no aplica.
   */
  coef_constructibilidad_adicional: number | null;

  /** Descripción de las condiciones del coeficiente adicional */
  coef_constructibilidad_adicional_notas: string | null;

  // ── Coeficiente de ocupación de suelo ──────────────────────────────────────

  /** Indica si el COS es único o diferenciado entre primer piso y superiores */
  nivel_aplicacion_cos: NivelAplicacionCOS;

  /** COS para el primer piso como decimal. Ej: 0.60. Null si se determina por envolvente */
  cos_primer_piso: number | null;

  /** COS para pisos superiores como decimal. Ej: 0.40. Null si se determina por envolvente */
  cos_pisos_superiores: number | null;

  /** Aclaraciones sobre la aplicación del COS */
  cos_notas: string | null;

  // ── Densidad ────────────────────────────────────────────────────────────────

  /** Densidad máxima en habitantes por hectárea. Null si no está definida en la zona */
  densidad_maxima_hab_ha: number | null;

  /** Densidad máxima en viviendas por hectárea. Null si no está definida en la zona */
  densidad_maxima_viv_ha: number | null;

  /** Descripción completa de la densidad, incluyendo referencia a normativas superiores */
  densidad_maxima_txt: string;

  // ── Altura máxima ───────────────────────────────────────────────────────────

  /** Número máximo de pisos permitidos. Null si la altura es libre */
  altura_maxima_pisos: number | null;

  /** Altura máxima en metros. Null si la altura es libre */
  altura_maxima_metros: number | null;

  /** true si la zona no tiene límite de altura (Ej: EAL, EC3+AL sobre aislado) */
  altura_maxima_libre: boolean;

  /** Descripción completa de la altura, incluyendo condiciones especiales */
  altura_maxima_txt: string;

  /**
   * Metros por piso para el cálculo de rasante.
   * En PRCP Providencia es 3.50 m según Art. 2.6.3 OGUC.
   */
  altura_rasante_metros_por_piso: number | null;

  /** Artículo de referencia para el cálculo de rasante */
  altura_rasante_referencia: string | null;

  // ── Sistema de agrupamiento ─────────────────────────────────────────────────

  /** Sistema de agrupamiento de la edificación */
  sistema_agrupamiento: SistemaAgrupamiento;

  /** Descripción normativa del sistema de agrupamiento */
  sistema_agrupamiento_txt: string;

  // ── Adosamientos ────────────────────────────────────────────────────────────

  /** true si se permite adosamiento en alguna condición en esta zona */
  adosamiento_permitido: boolean;

  /**
   * Profundidad máxima del adosamiento como porcentaje del deslinde.
   * Ej: 60 (equivale al 60% del deslinde). Null si no aplica.
   */
  adosamiento_profundidad_max_pct_deslinde: number | null;

  /** Descripción completa de la profundidad máxima de adosamiento */
  adosamiento_profundidad_max_pct_deslinde_txt: string | null;

  /** Altura máxima del cuerpo adosado en metros. Null si no aplica */
  adosamiento_altura_max_metros: number | null;

  /** Número máximo de pisos del cuerpo adosado. Null si no aplica */
  adosamiento_pisos_max: number | null;

  /** Condiciones adicionales de adosamiento */
  adosamiento_notas: string | null;

  // ── Distanciamientos ────────────────────────────────────────────────────────

  /** Descripción de distanciamientos a deslindes con referencia al artículo aplicable */
  distanciamiento_deslindes_txt: string;

  /** Distanciamiento mínimo a deslindes en subterráneo, en metros */
  distanciamiento_subterraneo_min_metros: number | null;

  /** Descripción del distanciamiento en subterráneo */
  distanciamiento_subterraneo_txt: string | null;

  // ── Antejardín ──────────────────────────────────────────────────────────────

  /**
   * Antejardín mínimo fijo en metros, cuando aplica un único valor.
   * Null cuando varía según condición (ver antejardín_opciones).
   */
  antejardín_minimo_metros: number | null;

  /** Opciones de antejardín y sus ochavos asociados en la Línea Oficial */
  antejardín_opciones: OpcionAntejardín[];

  /** Descripción completa del antejardín y sus variantes */
  antejardín_txt: string;

  // ── Cierros ─────────────────────────────────────────────────────────────────

  /** Altura total máxima del cierro en metros */
  cierro_altura_total_metros: number | null;

  /** Altura del zócalo opaco del cierro en metros */
  cierro_zocalo_metros: number | null;

  /** Porcentaje de transparencia requerido sobre el zócalo. 100 = totalmente transparente */
  cierro_transparencia_pct: number | null;

  /** Artículo de referencia del cierro en la Ordenanza Local */
  cierro_referencia: string | null;

  // ── Condición patrimonial ───────────────────────────────────────────────────

  /** Condición de protección patrimonial del inmueble o zona */
  condicion_patrimonial: CondicionPatrimonial;

  /** Descripción de las restricciones patrimoniales aplicables */
  condicion_patrimonial_notas: string | null;

  // ── Premios y excepciones ───────────────────────────────────────────────────

  /** true si la zona permite premios por fusión de roles (Art. 3.3.04 OL) */
  premios_fusiones: boolean;

  /** Descripción de los premios por fusión de roles aplicables */
  premios_fusiones_txt: string | null;

  /** Normas especiales para predios de menor tamaño pre-existentes al PRCP */
  excepciones_predios_especiales_txt: string | null;

  // ── Metadatos de control ────────────────────────────────────────────────────

  /** Nombre del instrumento fuente */
  fuente: string;

  /** Fecha de vigencia de la norma. Formato ISO "YYYY-MM-DD" */
  fecha_vigencia: string;

  /** Fecha y hora de carga en la base de datos. Formato ISO "YYYY-MM-DDTHH:mm:ssZ" */
  fecha_carga_db: string;

  /** Versión del esquema de datos, en formato semver. Ej: "1.0.0" */
  version_esquema: string;

  /** Usuario o proceso que revisó y aprobó el registro */
  revisado_por: string | null;

  /** Notas adicionales relevantes para el operador o el frontend */
  notas_adicionales: string | null;
}
