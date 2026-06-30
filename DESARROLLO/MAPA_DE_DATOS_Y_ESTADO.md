# 🗺️ MAPA DE DATOS Y ESTADO — Arqueo de Persistencia de Archibots

> **Propósito:** fuente de verdad de la **arquitectura de datos** de la SPA. Documenta qué se
> escribe, dónde vive y quién lo consume, para evitar duplicaciones y romper dependencias cruzadas
> al modificar herramientas.
> **Alcance:** datos de proyecto (no auth/usuarios). Basado en `src/core/types.ts`, las interfaces
> locales de `src/tools/` y los hooks `useToolData` / `useDimensionadorSync` / `terrenoStore` y el
> `ProjectRepository`.
> **Fecha de arqueo:** 2026-06-30 · **Repo:** `C:\G\Archiblocks\Web`

---

## 0. Modelo de persistencia (3 capas)

Todo dato de proyecto cae en **una** de estas tres ubicaciones físicas:

| Capa | Ubicación física (logueado / invitado) | Quién la gobierna | Regla de oro |
|---|---|---|---|
| **A · Master** | `projects/{pid}` (doc único) / `localStorage['archibots:project:local']` | `ProjectRepository` + `ProjectProvider` | Liviano **< 5 KB**. Sin arrays de historial. |
| **B · ToolData** | `projects/{pid}/toolData/{toolId}` (`{payload, updatedAt}`) / `localStorage['ab-{toolId}-{pid}']` | `useToolData<T>` | Estado privado de una herramienta. Degrada a local si la nube falla. |
| **C · Subcolección propia** | `projects/{pid}/{col}/...` (doc-por-ítem o doc de estado) / `localStorage['ab-{x}-{pid}']` | Store dedicado (`terrenoStore`, `libroStore`, `carpetaStore`, bespoke) | Datos pesados o con paginación/adjuntos. |

**Bifurcación Cloud/Local** (⟲ **modelo 2026-06-30**): `repo.kind === 'cloud'` para **TODO usuario LOGUEADO**
(Free o Premium) → Firestore; `local` **solo invitados/no logueados** → `localStorage` (sandbox). Topes de
proyectos por plan: **Free = 5 · Premium = 50**. La **colaboración** (invitar miembros) es Premium-only
(reglas). **No hay migración** del proyecto local del invitado al hacer login (CONST §7).

---

## 1. Esquema Core (`ProjectMaster`)

Definido en `src/core/types.ts` (extiende `SuperficieModel`). Es el **único** documento liviano; las
herramientas NO deben engordarlo con historiales.

| Campo | Tipo | Origen / Productor | Descripción |
|---|---|---|---|
| `id` | `string` | `createProject` | Identidad del proyecto (`proj-{ts}-{rand}` o `archibots-sandbox`). |
| `name` | `string` | DatosProyecto, createProject | Nombre. **Leído por casi todas las tools** (encabezado). |
| `anio` | `string` | createProject / Ficha | Año del proyecto. |
| `propietario` | `string` | Ficha / createProject (= `user.nombre`) | Mandante. Consumido por Contratos, Propuesta. |
| `rol` | `string` | Ficha / Ubicación | Rol SII del predio. |
| `direccion` | `string` | **Ubicación** | Dirección. Consumida por Geolocalizador (geocode), Contratos. |
| `comuna` | `string` | **Ubicación** (+ input Geolocalizador) | Comuna. **Dato pivote**: Geolocalizador, InformeTérmico, EETT, Gantt, Propuesta, FormulariosDOM. |
| `region?` | `string` | **Ubicación** (geocode) | Región derivada (no manual). Consumida por EETT/Gantt. |
| `ciudad?` | `string` | **Ubicación** (geocode; fallback comuna) | Ciudad/localidad (no manual). |
| `destino` | `string` | Ficha / DatosProyecto | Destino (Habitacional, etc.). |
| `tipoProyecto?` | `TipoProyecto` | **DatosProyecto** (fuente única) | Tipo OGUC. Decide **visibilidad de formularios DOM** y el bind de los formularios. |
| `etapa` | `Etapa \| string` | DatosProyecto | Etapa del expediente. |
| `presupuestoUF` | `string` | Ficha | Presupuesto. Consumido por Honorarios, Contratos, EstadosPago/Expediente. |
| `fotoUrl?` | `string` | BinderFicha (upload) | Portada del proyecto. |
| `ownerId` | `string` | repo (autoritativo) | Dueño (regla zero-trust). |
| `members` | `Record<string, MemberRole>` | ShareService | Colaboradores (editor/viewer). |
| `addedTools?` | `string[]` | `addTool/removeTool` | Herramientas agregadas al binder. |
| `toolStates?` | `Record<string, ToolState>` | **`setToolState`** (muchas tools) | Avance por herramienta (S7): `{estado, fecha}`. Consumido por BinderFicha/WorkspaceView. |
| `simulacionesCount?` | `number` | (reservado) | Contador. |
| `formulariosCount?` | `number` | (reservado) | Contador. |
| **— SuperficieModel —** | | | |
| `superficieTerrenoLegal` | `string` | **DatosProyecto / Cuadro** | Superficie de escritura. Visible en Ficha; consumida por Cuadro, Propuesta. |
| `superficieCalculada` | `string` | **Dimensionador / Dim-Públicos / Geolocalizador** (`syncSuperficie`) | Valor producido por cálculo. Nunca se borra. |
| `superficieManual` | `string` | DatosProyecto | Valor escrito a mano. Nunca se borra. |
| `superficieOrigen` | `'DIMENSIONADOR' \| 'MANUAL'` | Dimensionador / DatosProyecto | Bandera: decide cuál superficie muestra la Ficha (`superficieProyecto()`). |

> **Helper canónico:** `superficieProyecto(p)` devuelve `superficieManual` o `superficieCalculada`
> según `superficieOrigen`. Cualquier consumidor de "la superficie del proyecto" debe usarlo.

---

## 2. Diccionario por Herramienta

### 2.1 Capa B — `useToolData` (`toolData/{toolId}` · `ab-{toolId}-{pid}`)

| Herramienta (`toolId`) | Archivo | Tier | Interfaz del payload | Lee del Master |
|---|---|---|---|---|
| `datos-proyecto` | DatosProyectoView | free | `DatosExtra { categoria: string; notas: string }` **+ escribe Master** (name, etapa, destino, tipoProyecto, superficies) | name, etapa, destino, tipoProyecto, superficies |
| `participantes` | ParticipantesView | free | `ParticipantesGuardado { participantes: Participante[] }` | — |
| `carga-ocupacion` | CalculadoraCargaOcupacionView | free | `CargaGuardada { sectores: Sector[] }` | name |
| `calc-minvu` | CalculadoraConstruccionesMinvuView | free | `MinvuGuardado { constructions: Construccion[] }` | name, etapa |
| `dimensionador` | DimensionadorView | free | `ProgramaGuardado { programa: RecintoItem[]; circulacion: number }` **→ syncSuperficie** | name |
| `dim-publicos` | DimensionadorPublicosView | free | `EstadoGuardado { staff; publicData; buildingConfig }` **→ syncSuperficie** | name |
| `cuadro-superficies` | CuadroSuperficiesView | free | `CuadroGuardado { pisos[], supPredio, ... }` **+ escribe `superficieTerrenoLegal`** | superficieTerrenoLegal |
| `eett-generador` | GeneradorEETTView | free | `EettState extends SeleccionConstruccion { region; opcionales; verNch; verIndice }` | comuna, region, name |
| `presupuesto` | PresupuestoObraView | free | `PresupState { ...sel; cantidades; preciosUF; superficie; proformas; valorUf }` **+ lee `eett-generador`** | superficie (`superficieProyecto`), name |
| `gantt` | GanttView | free | `GanttState { plazos; fechaInicio; ... }` **+ lee `eett-generador`** | comuna, region, name |
| `estados-pago` | EmisorEstadoPagoView | free | `EstadoPagoGuardado { glosa; valor; impuesto; moneda }` | name, etapa |
| `listado-dom` | ListadoDocumentosView | free | `ListadoGuardado { projectType; selected[]; customDocs[] }` | name, etapa |
| `rdi` | RegistroRdiView | free | `RdiState { rdis: Rdi[] }` | name |
| `expediente-dom` | ExpedienteMunicipalView | free | `DatosTramite { arquitecto; rutArquitecto }` | propietario, direccion, comuna, presupuestoUF, name |
| `informe-suelo` | InformeSubsueloView | free | `InformeSubsuelo` (types.ts) **+ setToolState** | name |
| `accesibilidad` | RutaAccesibleView | free | `MemoriaRutaAccesible` (types.ts) **+ setToolState** | name |
| `informe-termico` | InformesTermicosView | **premium** | `InformeTermico` (types.ts) **+ setToolState** | **comuna** (siembra zona), name |
| `solicitud-permiso` · `permiso-edificacion` · `modificacion-proyecto` · `dj-termino` · `recepcion-final` | FormulariosDOMView | free | `FormulariosDOMState { forms; adjuntos? }` **+ setToolState** | **bind dinámico** a `project.*` + `tipoProyecto` (visibilidad) + `participantes` vía `useToolData` (canal gobernado) |

### 2.2 Capa C — Subcolecciones / stores dedicados

| Herramienta (`toolId`) | Store / ubicación | Interfaz | Notas |
|---|---|---|---|
| `terreno` (compartido) | `terrenoStore` → `projects/{pid}/toolData/terreno` + `ab-mapa-terreno-{pid}` | `TerrenoGuardado { ring: [lng,lat][]; areaM2 }` | **Productores y consumidores: Ubicación + Geolocalizador** (mutuo). Espeja siempre a local. |
| `volumen` (Cabida) | **bespoke** → `projects/{pid}/volumen/estado` + `ab-volumen-{pid}` | `Inputs { largo; ancho; coefConstructibilidad; ocupacionSuelo; alturaMaxima; ... }` | ⚠️ **No usa `useToolData`** ni lee la ficha normativa del Geolocalizador (ver §5). |
| `libro-obras` | `libroStore` → `projects/{pid}/libroObras/state` + `/folios/{id}` | `LibroObrasState { libros; folios; seq; perms }` (types.ts) | Doc-por-folio + meta (counters Año→Mes, paginación). Adjuntos reales en Storage. |
| `carpeta-digital` | `carpetaStore` → `projects/{pid}/carpetaDigital/state` + `/archivos/{id}` | `CarpetaDigitalState { iniciado; contratoKey; archivos; seq; perms }` (types.ts) | Doc-por-archivo + meta. Adjuntos reales en Storage. |
| `bim-wizard` | (subcolección propia) | ficha BIM por pasos | premium. |

### 2.3 Herramientas "solo lectura" del Master (no persisten estado propio relevante)

| Herramienta | Archivo | Lee del Master | Persistencia propia |
|---|---|---|---|
| `hsa` (Honorarios) | CalculadoraHonorariosView | `presupuestoUF` (siembra CLP) | local efímera / `BoleSaved` |
| `contratos` | GeneradorContratosView | propietario, name, direccion, comuna, presupuestoUF | `SavedContract` (local) |
| `propuesta` | PropuestaView | `superficieTerrenoLegal`, `superficieProyecto()`, comuna | `SavedPropuesta` |
| `seguimiento` | SeguimientoObrasView | name | `SeguimientoData { avance; etapaObra; bitacora[] }` |
| `geolocalizador` | GeolocalizadorView | comuna, direccion | terreno (store) + **ficha normativa EFÍMERA** (no persiste, ver §5) |
| `ubicacion` | UbicacionView | comuna, direccion | **escribe Master** (region, ciudad, comuna, direccion) + terreno |
| `volumen` | VolumenTeoricoView | name | `Inputs` (bespoke) |

---

## 3. Matriz de Interdependencias (I/O)

Cruce de los datos **compartidos entre herramientas**. "Productor" = quien lo escribe; "Consumidor" = quien lo lee.

| Dato / Campo | Productor (escribe) | Consumidores (leen) | Ubicación |
|---|---|---|---|
| `name` | DatosProyecto, createProject | ~todas (encabezado) | Master |
| `comuna` | **Ubicación** (+ input Geoloc.) | Geolocalizador, InformeTérmico, EETT, Gantt, Propuesta, FormulariosDOM | Master |
| `region` / `ciudad` | **Ubicación** (geocode) | EETT, Gantt (vía EETT), FormulariosDOM | Master |
| `direccion` | **Ubicación** | Geolocalizador (geocode), Contratos, FormulariosDOM | Master |
| `superficieCalculada` + `superficieOrigen` | **Dimensionador**, **Dim-Públicos**, **Geolocalizador** (`syncSuperficie`) | Ficha, Propuesta, Presupuesto, Cuadro (vía `superficieProyecto`) | Master |
| `superficieTerrenoLegal` | **DatosProyecto**, **Cuadro de Superficies** | Cuadro, Propuesta, Ficha | Master |
| `superficieManual` / `superficieProyecto()` | DatosProyecto | Presupuesto, Propuesta | Master |
| `presupuestoUF` | Ficha | Honorarios, Contratos, ExpedienteMunicipal | Master |
| `tipoProyecto` | **DatosProyecto** | FormulariosDOM (visibilidad + bind), Catálogo (filtro) | Master ⚠️ + duplicado en `datos-proyecto`.payload |
| `toolStates[*]` | **`setToolState`** (Informes, FormulariosDOM, Libro, Carpeta…) | BinderFicha, WorkspaceView | Master |
| `terreno { ring, areaM2 }` | **Ubicación**, **Geolocalizador** | Ubicación, Geolocalizador (mutuo) | ToolData (`toolData/terreno`) + local |
| `SeleccionConstruccion` (naturaleza/estructura/terminaciones) | **`eett-generador`** (GeneradorEETT) | **Presupuesto**, **Gantt** | ToolData (`toolData/eett-generador`) |
| `participantes[]` | **`participantes`** (ParticipantesView) | **FormulariosDOM** | ToolData (`participantes`) ⚠️ leído por DOM vía `localStorage['ab-participantes-{pid}']` |
| Ficha normativa PRC (`alturaMaxima`, `constructibilidad`, `coeficienteOcupacion`) | **Geolocalizador** (Cerebro Normativo) | — (hoy nadie; re-ingreso manual en Cabida) | **EFÍMERA — no se persiste** |

---

## 4. Datos duplicados detectados

1. **`tipoProyecto` duplicado.** Existe en `ProjectMaster.tipoProyecto` (autoritativo, lo escribe DatosProyecto)
   **y** en `datos-proyecto`.payload (`DatosExtra.tipoProyecto`). Riesgo de divergencia: la visibilidad de
   formularios DOM y el filtro de catálogo leen el del Master; el de `DatosExtra` queda como sombra sin consumidor claro.

2. **Superficie en 4 campos.** `superficieTerrenoLegal`, `superficieCalculada`, `superficieManual` + bandera
   `superficieOrigen`. Es **intencional** (CONST §6, coexistencia con bandera), pero exige usar siempre
   `superficieProyecto()` — cualquier lectura directa de un campo suelto es un bug latente.

3. **`participantes` con doble vía de lectura.** Se persiste con `useToolData` (cloud `toolData/participantes`),
   pero **FormulariosDOM lo lee por `localStorage['ab-participantes-{pid}']`** → en Premium el binario de nube
   no está en local y el prellenado de participantes puede salir vacío (ver Riesgos).

4. **`comuna` en dos lugares de captura.** Master (Ubicación) e input local del Geolocalizador (`useState(project.comuna)`),
   que puede quedar desincronizado del Master si el usuario edita en el Geolocalizador sin propagar.

---

## 5. Oportunidades de Sincronización

Datos que hoy se **re-capturan manualmente** pudiendo leerse de otra herramienta:

1. ✅ **IMPLEMENTADO — Ficha normativa → Cabida.** El Geolocalizador persiste la ficha en `toolData/normativa`
   (nuevo `normativaStore`) al analizar; la Cabida (`volumen`) **siembra** `alturaMaxima`, `coefConstructibilidad`
   y `ocupacionSuelo` desde ahí cuando no hay cabida guardada.

2. ⏳ **PARCIAL — Superficie de terreno → Cabida.** La Cabida modela el predio como `largo × ancho`, que no mapea
   1:1 a un área única; por eso NO se autocompleta desde `terreno.areaM2`. Pendiente: input "área de terreno" en Cabida.

3. ✅ **IMPLEMENTADO — `participantes` → FormulariosDOM.** Unificado bajo `useToolData('participantes')`.

4. ✅ **IMPLEMENTADO — `tipoProyecto` consolidado.** `DatosExtra.tipoProyecto` renombrado a `categoria`; Master es fuente única.

5. **EETT → Presupuesto/Gantt (ya estaba, se mantiene).** `SeleccionConstruccion` fluye de `eett-generador` a Presupuesto y Gantt.

6. ✅ **IMPLEMENTADO — `presupuestoUF` ← Presupuesto de Obra (opción).** Botón "Usar como presupuesto del proyecto"
   escribe el total F (UF) a `Master.presupuestoUF`; el valor de la Ficha sigue editándose a mano (no automático).

7. 🔴 **NUEVO — Homologar superficie de terreno (decisión pendiente).** Se pidió unificar `superficieTerrenoLegal`
   y `superficieManual`. **No se ejecutó** porque son semánticamente distintos: `superficieTerrenoLegal` = área del
   **lote**; `superficieManual` = área **edificada manual** (alternativa a `superficieCalculada` vía `superficieOrigen`).
   Fusionarlas rompería el modelo §6 y Presupuesto/Propuesta. **Requiere confirmación** antes de tocar (ver §7.4).

---

## 5-bis. Mapeo de datos en los Formularios Municipales (DOM)

Los `*.fieldmap.json` (`src/forms/`) prellenan los PDF municipales resolviendo `field.bind` con `resolveBind()`
(FormulariosDOMView). **Binds activos hoy** (campo → nº de campos en el set de formularios):

| `bind` | Origen | Nº campos | Ubicación |
|---|---|---|---|
| `project.propietario` | Master | 121 | Master |
| `project.anio` | Master | 113 | Master |
| `project.direccion` | Master | 96 | Master |
| `project.destino` | Master | 24 | Master |
| `project.rol` | Master | 20 | Master |
| `project.comuna` | Master | 19 | Master |
| `participant.arquitecto.nombre` | `participantes` (toolData) | 17 | ToolData |
| `project.name` | Master | 13 | Master |
| `project.superficieTerrenoLegal` | Master | 10 | Master |
| `project.presupuestoUF` | Master | 7 | Master |

### Oportunidades de sincronización NUEVAS detectadas en los formularios

Hay ~385 campos **hoy manuales** cuyos rótulos coinciden con datos que la plataforma YA posee. El bloqueo no es
de datos sino de **bind**: basta agregar el `bind` en el fieldmap y exponer el dato en el `bindCtx` de FormulariosDOM.

| Campo del formulario (rótulo) | Dato disponible (productor) | Acción de sync |
|---|---|---|
| **RUT**, RUT_2, RUT_3… (≈19) | RUT por rol en **Participantes** (`participantes[].rut`) | Exponer `participant.<rol>.rut` en `bindCtx` y bindear. |
| **Profesional Responsable / Nombre Profesional Competente** (Constructor, ITO, Calculista) (≈60) | **Participantes** por rol (nombre) | Exponer `participant.<rol>.nombre` (no solo arquitecto). |
| **Correo Electrónico / Teléfono** (≈20+) | **Participantes** (agregar email/fono al modelo) | Ampliar `Participante` con `email`/`fono` y bindear. |
| **COEFICIENTE DE OCUPACIÓN / ALTURA EN METROS Y/O PISOS** (≈24) | **Ficha normativa** (`toolData/normativa`, ya persistida) | Exponer `normativa.*` en `bindCtx` y bindear. |
| **SUPERFICIE OCUPACIÓN PRIMER PISO / SUPERFICIE EDIFICADA / Superficie m2** (≈18) | **Cabida** (`volumen`) / `superficieProyecto()` / **Cuadro de Superficies** | Exponer superficie edificada y bindear. |
| **Comuna (filas) / Región / Ciudad** | Master `comuna` (bindeable) · `region`/`ciudad` (ya en Master) | Bindear `project.region` / `project.ciudad`. |

### ✅ IMPLEMENTADO (2026-06-30)

**1. `bindCtx` ampliado** en `FormulariosDOMView` — namespaces de bind disponibles:
- `participant.<clave>.{nombre,rut,direccion}` — claves: `arquitecto, propietario, calculista, constructor, dom, revisor, ito, mecanico, paisajista` (resueltas por rol desde `participantes`).
- `normativa.{usosPermitidos,usosProhibidos,alturaMaxima,constructibilidad,ocupacionSuelo,sistemaAgrupamiento,antejardin}` — desde la ficha del Geolocalizador (`normativaStore`, ampliado con los campos de texto).
- `superficie.{ocupacion,predio,sobreTerreno,subterraneo,total,primerPiso}` — derivadas del **Cuadro de Superficies**.
- `project.{region,ciudad,...}` — ya en el Master.

**2. Binds aplicados a los `*.fieldmap.json`: 104 campos en 22 formularios** (pase conservador de alta confianza):
ocupación de suelo (24), superficie primer piso (14), agrupamiento (12), constructibilidad (12), antejardín (12),
altura (12), constructor (5), ITO (5), superficie total (4), ciudad/localidad (4).

**3. Write-back bidireccional:** al guardar un formulario, los campos con bind `participant.*.<attr>` (p. ej.
constructor/ITO nombre) se **propagan a la herramienta Participantes** (solo valores no vacíos; nunca borran).

**4. Modelo `Participante` ampliado (2026-06-30):** se agregaron `email` y `fono` (opcionales), mostrados en la UI
tras **"Agregar más datos"** (no aparecen por defecto). `bindCtx` expone `participant.<clave>.{nombre,rut,direccion,email,fono}`.

**Pendiente (ambiguo, NO bindeado a propósito):** RUT "pelados" sin rol explícito y los campos de email/teléfono/
dirección **por profesional** en los PDF: sus rótulos (`Correo Electrónico`, `Teléfono`, `RUT_2/_3`, `ComunaRow1`)
**no identifican el rol** con certeza, así que se dejan sin bind para no escribir el dato del profesional equivocado.
El dato YA está disponible en `bindCtx` para marcarlos manualmente cuando se confirme el rol de cada campo por formulario.

---

## 6. Resumen técnico de hallazgos críticos

- **El `ProjectMaster` está sano respecto al límite de 5 KB.** Los campos son escalares/enum; los arrays de historial
  viven correctamente en ToolData/subcolecciones. **Único vector de engorde:** `toolStates` y `addedTools` crecen
  con cada herramienta agregada — acotados, pero a vigilar si el catálogo se expande mucho.
- **`comuna` y `superficie*` son los pivotes de mayor acoplamiento.** Un cambio en su forma o en `superficieProyecto()`
  impacta ≥6 herramientas. Cualquier refactor debe pasar por estos contratos centrales en `types.ts`.
- **La ficha normativa ya no se descarta** (⟲ 2026-06-30): se persiste en `toolData/normativa` y siembra la Cabida.
- **Nuevo modelo de persistencia (⟲ 2026-06-30):** nube para TODO usuario logueado; local solo invitados. Requiere
  **desplegar `firestore.rules`** para habilitar las escrituras Free (ver §7.6).
- **Mayor potencial restante:** habilitar los binds de los formularios municipales (RUT/profesionales→Participantes,
  altura/ocupación→ficha normativa, superficies edificadas→Cabida/Cuadro) — ver §5-bis.

---

## 7. Riesgos detectados en la estructura de datos actual

1. ~~Desincronización Premium en `participantes`.~~ ✅ **RESUELTO (2026-06-30):** FormulariosDOM usa `useToolData`.

2. ~~Ficha normativa volátil.~~ ✅ **RESUELTO (2026-06-30):** la ficha se persiste en `toolData/normativa` (`normativaStore`)
   y la Cabida la consume.

3. ~~`tipoProyecto` con dos fuentes.~~ ✅ **RESUELTO (2026-06-30):** `DatosExtra.tipoProyecto` → `categoria`; Master es fuente única.

4. 🔴 **Homologación superficie pendiente (decisión).** El pedido de unificar `superficieTerrenoLegal` con
   `superficieManual` NO se ejecutó por ser semánticamente distintos (lote vs obra edificada); fusionarlos rompe
   el modelo §6 y Presupuesto/Propuesta. **Requiere confirmación** del criterio antes de tocar (ver §5, oportunidad 7).

5. **Lecturas directas de campos de superficie.** Cualquier tool que lea `superficieCalculada`/`superficieManual`
   sin `superficieProyecto()` mostrará el valor equivocado según la bandera de origen. **Severidad: baja-media** (latente).

6. **Migración del nuevo modelo de persistencia (cambio reciente).** Al pasar Free a la nube: (a) requiere
   **desplegar `firestore.rules`** (`firebase deploy --only firestore:rules`) para que las nuevas escrituras Free
   no sean rechazadas; (b) los datos que un usuario Free tenía en `localStorage` ANTES del cambio **no se migran**
   (CONST §7) — quedan en su navegador. **Severidad: media** (operacional, requiere deploy coordinado).

7. **`volumen` persiste bespoke** (`projects/{pid}/volumen/estado`) fuera de `useToolData`. La regla `volumen/{docId}`
   ya existe en `firestore.rules`; mantener cobertura al evolucionar el esquema. **Severidad: baja.**

8. **Colaboración en UI vs reglas.** Las reglas ahora restringen invitar miembros a Premium; verificar que la UI
   (ShareService / botón compartir) **oculte o bloquee** la acción para Free, para no mostrar un error de permisos.
   **Severidad: baja** (UX).

9. **Degradación silenciosa a localStorage.** `useToolData` cae a local ante fallo de reglas/red **sin avisar**;
   puede enmascarar un problema de permisos (el usuario cree que guardó en nube). **Severidad: baja** (observabilidad).
