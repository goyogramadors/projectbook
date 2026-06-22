# Memoria y Especificación — Subsistema **Generador de Informes Térmicos** (Archibots) · v1

> Memoria explicativa del subsistema que genera **informes de cumplimiento de la Reglamentación Térmica (RT)** chilena para proyectos de construcción, vigente desde el **28 de noviembre de 2025**. El glosario normativo literal vive aparte en `GLOSARIO_Normativo_InformesTermicos.md` (fuente de verdad de los catálogos: zonas térmicas, comuna→zona, materiales, tablas de exigencia). La especificación de interfaz (layout, wireframes, flujos) vive en `index.html` (prototipo) y en la *Especificación UI*.

---

## 0. Resumen

### 0.1. Qué hace

El subsistema permite a un usuario (arquitecto / proyectista / formulador) **construir y validar la envolvente térmica** de una vivienda y **generar un informe** que acredite el cumplimiento de la RT actualizada. El flujo es **secuencial por bloques**: primero la **zona térmica** del emplazamiento, luego cada elemento de la envolvente (techo, muro, piso) con su **puente térmico**, los **sobrecimientos**, la **puerta opaca**, la **ventilación**, las **ventanas por orientación** y las **infiltraciones de aire**. Al final, **"Generar informe activo"** produce el PDF de acreditación.

### 0.2. Decisiones arquitectónicas clave

| # | Decisión | Razón |
|---|---|---|
| 1 | **Catálogos idénticos al glosario** (zonas, comuna→zona, materiales, tablas). Transcripción `as const` en `catalog/`, sin mutar datos en runtime. | El glosario es la fuente de verdad normativa; evita drift entre UI y reglamento. |
| 2 | **Zona derivada del cliente** (comuna → zona), con resolución por **altitud/meridiano** solo cuando la comuna lo exige. | La RT determina la zona por comuna y, en muchos casos, por longitud y/o altitud. |
| 3 | **Motor de cálculo "Dos Cerebros" reutilizado** para geometría/áreas; el cálculo térmico (U, Rt, condensación) corre en **Web Worker**. | Mantiene la UI fluida con complejos de muchas capas y recálculo en vivo. |
| 4 | **Método Campo + Puente térmico** con ponderación por fracción de área en **todos** los elementos opacos (techo/muro/piso). | Es el método de la RT; el puente térmico es obligatorio en el análisis de condensación. |
| 5 | **Exigencias numéricas como datos** (Tablas 1, 3, 5, 6, 10, 12), no hardcodeadas en componentes; muchas quedan **`POR COMPLETAR`**. | Permite cargar/actualizar umbrales oficiales sin tocar la UI. |
| 6 | **Validación OK / NO OK / Pendiente** por ítem, con badges; el informe solo se emite "activo" cuando los bloques obligatorios están resueltos. | Trazabilidad y prevención de informes incompletos. |

### 0.3. Estado de completitud

Los **catálogos estructurales** (9 zonas A–I, comuna→zona, pasos del informe, materiales semilla) están **operativos**. Las **tablas de exigencia numérica por zona** y el **catálogo de materiales completo** se marcan **`POR COMPLETAR`** en el glosario y se cargan antes de producción. La UI ya muestra los estados "—" / "Pendiente" / "Falta comuna (cliente)" cuando un umbral o input no está disponible.

---

## 1. Objetivo y alcance

Subsistema integrado en Archibots, orientado a **viviendas** sujetas a la RT. Cubre el cálculo y la acreditación de:

- **Envolvente opaca:** techo, muros perimetrales y piso ventilado (con puentes térmicos y análisis de condensación superficial e intersticial).
- **Sobrecimientos:** acreditación por R100 (Tabla 6).
- **Puerta opaca:** acreditación por ficha y exigencia U/Rt (Tabla 10).
- **Ventanas:** % máximo por orientación y desempeño térmico (Tablas 3, 5, 12), incl. permeabilidad al aire.
- **Ventilación:** caudal mínimo NCh 3309.
- **Infiltraciones de aire:** envolvente (sellos), puertas y ventanas (clase de permeabilidad).

**ID en `registry.ts`:** `informes-termicos` · **Categoría:** `Eficiencia Energética` · lazy en `<ToolHost>`. Estilos sobre `archibots.css` (4 temas); cálculo en Web Workers; geometría con el motor **Dos Cerebros** (Turf.js); caché en IndexedDB.

**Fuera de alcance (v1):** Calificación Energética de Viviendas (CEV) completa; cálculo dinámico/horario; edificios en altura no residenciales.

---

## 2. Modelo de dominio

### 2.1. Conceptos centrales

- **Proyecto térmico** — pertenece a un proyecto Archibots y a un **cliente** (de quien hereda comuna → zona).
- **Zona térmica** — una de A…I, resuelta por `comuna (+ altitud + meridiano)`.
- **Complejo** — conjunto ordenado de **capas** (INTERIOR → EXTERIOR) de un elemento (techo/muro/piso). Tiene variante **Campo** y variante **Puente térmico**.
- **Capa** — material del catálogo + **espesor (mm)**. Aporta `λ, ρ, μ` (y `Sd` en cámaras de aire).
- **Resultado de complejo** — `{ U, condSuperficial, condIntersticial }` ponderado por fracción puente.
- **Ítem de acreditación** — sobrecimientos, puerta opaca, ventanas, ventilación, infiltraciones: cada uno con su **estado normativo** (OK / NO OK / Pendiente / No aplica).

### 2.2. Capa "Campo" vs. "Puente térmico"

El **Puente térmico** se deriva de **Campo**: se copia íntegro y se **reemplaza una sola capa** (la de relleno/aislación, indicada por "Reemplazar capa #") por la **Estructura** (madera / acero / hormigón). Se declara la **Fracción puente (%)** (p. ej. 10 %). El motor pondera:

```
U_pond = (1 − f)·U_campo + f·U_puente,   f = fracciónPuente/100
```

> La derivación Campo→Puente es **automática y reactiva**: editar una capa en Campo (salvo la reemplazada) se refleja en Puente.

---

## 3. Flujo del usuario (secuencial)

```mermaid
flowchart TD
  Z([0 · Seleccionar zona/cliente]) --> Z1{¿Comuna define\naltitud/meridiano?}
  Z1 -- sí --> Z2[Pedir altitud / meridiano] --> ZR[Zona A–I resuelta]
  Z1 -- no --> ZR
  ZR --> T[1 · Techo: Campo + Puente]
  T --> M[2 · Muro: Campo + Puente]
  M --> P[3 · Piso: Campo + Puente]
  P --> SC[3.2 · Sobrecimientos R100 (Tabla 6)]
  SC --> PU[4 · Puerta opaca (Tabla 10)]
  PU --> V[5 · Ventilación (NCh 3309)]
  V --> VN[6 · Ventanas por orientación (Tablas 3,5,12)]
  VN --> INF[7 · Infiltraciones: envolvente / puertas / ventanas]
  INF --> GEN{¿Bloques obligatorios OK?}
  GEN -- sí --> PDF[[Generar informe activo → PDF]]
  GEN -- no --> ALERT[/Marcar pendientes/]
```

> Cada bloque opaco (techo/muro/piso) entrega `U / Cond. superficial / Cond. intersticial`. Mientras falte la comuna del cliente, los bloques muestran **"Falta comuna (cliente)"** y los % de ventana muestran **"Selecciona un cliente para obtener comuna/zona"**.

---

## 4. Arquitectura de componentes (v1)

```
InformesTermicosTool (lazy en <ToolHost>)
├── ITProvider  (Context: proyecto térmico, zona resuelta, resultados memoizados)
├── ITHeader · StepRail (riel de pasos 0–7 con estado por bloque)
│
├── ── PASO 0 · ZONA ──────────────────────────────────────────
│   ZonaSelector
│   ├── ClienteComunaResolver (cliente → comuna)
│   ├── AltitudMeridianoInputs (solo si la comuna lo exige)
│   └── ZonaBadge (A–I + criterio de desempate aplicado)
│
├── ── PASOS 1–3 · ENVOLVENTE OPACA ──────────────────────────
│   ComplejoEditor  (reutilizable: Techo, Muro, Piso)
│   ├── CapaList (Campo)  — filas editables, reordenables (↑ ↓ ✕)
│   │   └── CapaRow (MaterialSelect + EspesorInput)
│   ├── PuenteTermicoView (derivado: Reemplazar capa # + Estructura + Fracción %)
│   ├── AddCapaButton
│   └── ResultadoComplejo (U · Cond. superficial · Cond. intersticial)
│   PisoBlock añade: DesactivarPisoRadierToggle
│
├── ── PASO 3.2 · SOBRECIMIENTOS ─────────────────────────────
│   SobrecimientosCard (Aplica✓ · solución EPS · R100 calc · OK/NO OK Tabla 6)
│
├── ── PASO 4 · PUERTA OPACA ─────────────────────────────────
│   PuertaOpacaCard (ficha DITEC · U/Rt · validación Tabla 10)
│
├── ── PASO 5 · VENTILACIÓN ──────────────────────────────────
│   VentilacionCard (Superficie · Dormitorios · Baños · Cocinas → Qtot, extracción local)
│
├── ── PASO 6 · VENTANAS ─────────────────────────────────────
│   VentanasView
│   ├── VentanaTipoSelect (+ %Vidrio / %Marco) · MetodoDetalladoToggle
│   ├── OrientacionTable (Norte/Oriente/Poniente/Sur → Sup. muro, Sup. ventana, %, Upvm, Uw, Estado)
│   └── PermeabilidadBadge (Clase mín. por zona)
│
├── ── PASO 7 · INFILTRACIONES ───────────────────────────────
│   InfiltracionesView
│   ├── EnvolventeSellosCard (Cumple por especificación constructiva)
│   ├── PuertasPermeabilidadCard (NCh 3296/3297 · Clase)
│   └── VentanasPermeabilidadCard (NCh 3296/3297 · Clase)
│
├── GenerarInformeButton  (CTA fijo inferior-derecha)
│
└── Servicios: catalog/ (= glosario) · engine/termico.worker.ts (U, Rt, condensación)
              engine/dosCerebros (áreas/geometría) · validacion/tablas.ts (OK/NO OK)
              pdf/informe.ts · cache/indexedDb.ts
```

---

## 5. Contrato de datos (v1)

### 5.1. Estático en código (catálogos = glosario, sin mutación)

`catalog/zonas.ts` (9 zonas + tabla comuna→zona con reglas altitud/meridiano), `catalog/materiales.ts` (lista de materiales con `λ/ρ/μ/Sd/fuente`), `catalog/tablas.ts` (exigencias por zona — muchas **`POR COMPLETAR`**), `catalog/pasos.ts` (estructura de bloques 0–7). Todos `as const`, idénticos al glosario.

### 5.2. Firestore (`informesTermicosDb`)

```
projects/{projectId}/informesTermicos/{config}
projects/{projectId}/informesTermicos/complejos/{complejoId}   // techo|muro|piso
projects/{projectId}/informesTermicos/acreditaciones/{itemId}  // sobrecim|puerta|ventilacion|ventanas|infiltraciones
projects/{projectId}/informesTermicos/informes/{informeId}     // PDFs generados
```

**`config`** — `clienteId`, `comuna`, `altitud?`, `meridiano?`, `zonaResuelta` (A–I), `criterioDesempate`, `creadoPor`, `actualizadoEn`.

**`complejos/{complejoId}`**:

| Campo | Tipo | Notas |
|---|---|---|
| `tipo` | `'techo'\|'muro'\|'piso'` | — |
| `capasCampo[]` | `Array<{materialId, espesorMm, orden}>` | INTERIOR → EXTERIOR. |
| `capaReemplazada` | `number` | índice de la capa sustituida en el puente. |
| `estructuraMaterialId` | `string` | madera / acero / hormigón. |
| `fraccionPuente` | `number` | % (p. ej. 10). |
| `pisoRadierDesactivado` | `boolean` | solo `piso`. |
| `resultado` | `{U, condSup, condInt}` | derivado (no fuente de verdad); recalculable. |

**`acreditaciones/{itemId}`** — payload específico por ítem:

| Ítem | Campos clave |
|---|---|
| `sobrecimientos` | `aplica`, `materialAislante`, `lambda`, `espesorMm`, `r100`, `estado` (OK/NO OK por Tabla 6). |
| `puerta` | `fichaCodigo`, `U`, `Rt`, `estado` (Tabla 10). |
| `ventilacion` | `superficieM2`, `dormitorios`, `banos`, `cocinas`, `qtot`, `extraccionLocal`. |
| `ventanas` | `ventanaTipoId`, `pctVidrio`, `pctMarco`, `metodoDetallado`, `orientaciones[{orient, supMuro, supVentana, pct, upvm, uw, estado}]`, `claseMin`. |
| `infiltraciones` | `envolventeSellos[]`, `puertaClase`, `ventanaClase`, `estados`. |

### 5.3. Estado local de React (no persiste)

Paso activo del riel, borrador de capas antes de guardar, expand/collapse de cada bloque (Techo/Muro/Piso), resultados memoizados del worker, toggles (método detallado, desactivar piso radier), selección de material en cada `MaterialSelect`. Caché en IndexedDB para reabrir donde quedó.

---

## 6. Motor de cálculo térmico

### 6.1. Responsabilidades

- **U / Rt de un complejo:** `Rt = Rsi + Σ(eᵢ/λᵢ) + R_cámaras + Rse`; `U = 1/Rt`. Cámaras de aire vía `Sd`/NCh 853.
- **Ponderación Campo + Puente:** `U_pond = (1−f)·U_campo + f·U_puente`.
- **Condensación superficial:** factor de temperatura `fRsi` vs. umbral de la zona.
- **Condensación intersticial:** perfil de presiones de vapor (Glaser) usando `μ` por capa; debe incluir puentes térmicos.
- **R100 (sobrecimientos):** `(e/λ)·100`.
- **Qtot (ventilación):** función de superficie + dormitorios (NCh 3309) — **fórmula `POR COMPLETAR`**.

### 6.2. Reactividad

Cada edición de capa, espesor, material, estructura o fracción dispara un **recálculo en el worker**; los badges `U / Cond. superficial / Cond. intersticial` se actualizan en vivo. Mientras un umbral de tabla esté **`POR COMPLETAR`**, el badge de cumplimiento muestra "—" o "Pendiente" (no "OK") para no acreditar sin base.

---

## 7. Validación normativa

| Ítem | Regla | Tabla | Estado catálogo |
|---|---|---|---|
| Techo / Muro / Piso | `U_pond ≤ U_máx(zona)` (o `Rt ≥ Rt_mín`) | 1/2 | `POR COMPLETAR` |
| Sobrecimientos | `R100 ≥ 45` (B–E) / `≥ 91` (F–I) | 6 | parcial (umbrales conocidos) |
| Puerta opaca | `U ≤ U_máx(zona)` y `Rt ≥ Rt_mín(zona)` | 10 | `POR COMPLETAR` (ej. web: U≤1.70·Rt≥0.59) |
| Ventanas % | `%vent/muro ≤ %máx(zona, orientación)` | 3/5/12 | `POR COMPLETAR` |
| Ventana Uw / permeabilidad | `Uw ≤ Uw_máx(zona)`; clase ≥ clase mín(zona) | 5/12 | `POR COMPLETAR` |
| Infiltración envolvente | Cumple por especificación (sellos) — NCh 3295 | — | operativo |
| Infiltración puertas/ventanas | clase ≥ clase mín(zona) — NCh 3296/3297 | — | `POR COMPLETAR` |

> El botón **Generar informe activo** queda habilitado solo cuando la **zona está resuelta** y los **bloques obligatorios** (techo, muro, piso, ventilación, ventanas, infiltraciones) tienen estado distinto de "Pendiente". Los ítems "No aplica" (p. ej. sobrecimientos desmarcados) no bloquean.

---

## 8. Salida — Informe (PDF)

El informe activo reúne: datos del proyecto/cliente, **zona térmica** y criterio de desempate; por cada elemento opaco, las capas (Campo y Puente), `U/Rt`, fracción puente y veredicto de condensación; **sobrecimientos** (R100, Tabla 6); **puerta opaca** (ficha, U/Rt, Tabla 10); **ventilación** (Qtot, extracción); **ventanas por orientación** (%, Upvm, Uw, permeabilidad); **infiltraciones** (sellos + clases). Cada sección lleva su badge **OK / NO OK / No aplica** y la referencia normativa.

---

## 9. Plan de trabajo (v1)

1. **Tipos** (`import type`): `ZonaTermica`, `Complejo`, `Capa`, `ResultadoComplejo`, `Acreditacion*`.
2. **Catálogos** = transcripción literal del glosario (zonas, comuna→zona, materiales semilla, pasos). Cargar tablas de exigencia conforme se completen.
3. **Paso 0 (Zona):** resolver `cliente → comuna → zona` con desempate altitud/meridiano; estados "Falta comuna".
4. **ComplejoEditor** reutilizable (Techo/Muro/Piso): capas editables/reordenables, derivación Campo→Puente, worker de U/condensación.
5. **Acreditaciones:** sobrecimientos (R100), puerta (Tabla 10), ventilación (NCh 3309), ventanas (Tablas 3/5/12), infiltraciones (NCh 3295/3296/3297).
6. **Validación** contra tablas (badges OK/NO OK/Pendiente) + gating del botón "Generar informe activo".
7. **PDF** del informe + **integración** (`registry.ts`, lazy en `<ToolHost>`, IndexedDB, pruebas con complejos de muchas capas).
8. **Completar `POR COMPLETAR`:** cargar Tablas 1/2/3/5/6/10/12 oficiales y catálogo de materiales completo; sustituir umbrales "—" por valores definitivos.

---

## 10. Referencias

- `index.html` — prototipo funcional v1 (selección de zona; complejos Campo+Puente; sobrecimientos; puerta; ventilación; ventanas; infiltraciones; "Generar informe activo").
- `GLOSARIO_Normativo_InformesTermicos.md` — fuente de verdad de los catálogos (zonas, comuna→zona, materiales, tablas).
- Actualización RT (Minvu, OGUC 4.1.10; vigente 28-nov-2025); *Zonificación Térmica Nacional* (DITEC); *Tabla Zonas Térmicas por comuna*; Ley 21.305 (CEV); NCh 853, NCh 3295, NCh 3296/3297, NCh 3309; ISO 10456; fichas DITEC.
