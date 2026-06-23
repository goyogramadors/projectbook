# 🗒️ LAST UPDATE — Bitácora de sesiones con Claude (Archibots / Project_Book)

> **Propósito:** registro cronológico de TODO lo que se trabaja con Claude, para entregar a
> cualquier instancia nueva como contexto del estado real del proyecto.
> **Regla de uso:** cada sesión agrega una entrada NUEVA arriba (más reciente primero), con
> **fecha + hora**, detalle de lo realizado, archivos tocados y pendientes generados/resueltos.
> No borrar entradas anteriores. Mantener pendientes sincronizados con `Tintero - Pendientes.md`.
>
> **Formato de cada entrada:** `## YYYY-MM-DD HH:MM (zona) — Título corto`

---

## 2026-06-23 14:40 (Chile) — Corrección de doc: despliegue del frontend = Cloudflare Pages (no Firebase Hosting)

### Contexto
Se detectó que `Iniciar Aquí.md` §4 documentaba el frontend en Firebase Hosting, lo que no coincide con la realidad: el sitio que ven los usuarios se sirve desde **Cloudflare Pages** (proyecto `projectbook`). Un `firebase deploy --only hosting` sube a `archibots-497423.web.app` (Firebase Hosting), que está **sin uso**, y no actualiza el sitio real.

### Evidencia en el repo
- `Web/public/_redirects` con `/*  /index.html  200` → convención SPA de Cloudflare Pages.
- **No** hay `wrangler.toml` ni `.github/workflows`. Los `.bat` y `/Basepro Terminar` son 100% git. Remoto: `github.com/goyogramadors/projectbook`.
- HITL (Andrés): hoy publica **manualmente** (arrastra `dist/` al dashboard = proyecto Direct Upload). Quiere migrar a **sync desde GitHub**.

### Hallazgo clave (Cloudflare)
Un proyecto **Direct Upload no se puede convertir** a Git-connected. Para auto-build con `git push` hay que **crear un proyecto Pages nuevo conectado al repo** y mover el dominio.

### Cambios (archivos tocados)
- **`Iniciar Aquí.md`** — §4 reescrita: frontend → Cloudflare Pages (estado actual manual + pasos de migración a GitHub: root `Web`, build `npm run build`, output `dist`, copiar `VITE_*`); Firebase Hosting marcado como secundario/sin uso; nuevo "modelo mental" frontend↔Cloudflare / backend↔Firebase. Fecha de encabezado → 2026-06-23.

### Pendientes (para Andrés)
- [ ] **Migrar Cloudflare Pages a Git:** crear proyecto nuevo conectado a `goyogramadors/projectbook` (root `Web`, build `npm run build`, output `dist`, env `VITE_*`), verificar, mover dominio, eliminar el proyecto Direct Upload viejo.
- [ ] **Mientras tanto, publicar frontend manual:** `npm run build` (desde `Web\`) + arrastrar `dist/` al dashboard `projectbook` — necesario para que los usuarios vean Térmico acredita + adjuntos de Obra Digital.
- [ ] (Sigue abierto del corte anterior) Deploy backend: `firebase deploy --only storage` + `--only firestore:rules`.

---

## 2026-06-23 12:15 (Chile) — Pendientes cerrados: Térmico acredita (Tablas oficiales + Web Worker) · Obra Digital doc-por-folio + adjuntos UUID en Storage

### Contexto
Cierre de los dos pendientes anotados el 2026-06-23 09:28: (1) Térmico — motor real + Tablas oficiales para acreditar; (2) Obra Digital — doc-por-folio + adjuntos UUID (Storage Premium) + counters Año→Mes. Decisiones HITL (Andrés): Térmico **sí acredita** techo/muro/piso/puerta; Obra Digital **Opción A** (subida real a Storage con reglas nuevas).

### Térmico — acreditación real (CUMPLE/NO CUMPLE)
- **`src/tools/termico/tablas.ts`** (nuevo) — Fuente de verdad RT (Art. 4.1.10 OGUC, **DS N°15 MINVU**, D.O. 27-05-2024, vigente **28-11-2025**): Tabla 1 U máx residencial A–I (techo/muro/piso/puerta), R100 sobrecimientos, clase de permeabilidad, % ventanas por orientación (VENTANA_PCT_MAX), materiales λ/ρ/μ, Rs por elemento, comuna→zona NCh1079:2019. Celdas combinadas del cuadro oficial **desambiguadas por monotonía climática A→I** (sin inventar cifras). Fuente: PDFs DITEC/MINVU.
- **`src/tools/termico/engine.ts`** (nuevo) — motor puro: Rt=Rs+Σe/λ, U=1/Rt; ponderación Campo+Puente; R100; veredictos vs zona; `evaluar()` agrega `acredita = zona ∧ techo+muro+piso CUMPLEN`.
- **`src/workers/termico.worker.ts`** (nuevo) — Web Worker que ejecuta el engine (patrón geo.worker).
- **`src/tools/InformesTermicosView.tsx`** — reescrita: usa el worker (seed síncrono del engine), badges **CUMPLE/NO CUMPLE/Pendiente/No aplica**, pasos 3.2 (sobrecimiento R100) y 4 (puerta U) con inputs reales, botón **Generar Informe Activo** habilitado solo si la envolvente opaca acredita. Estado del expediente ahora **Completado** si acredita. Persiste `sobrecim`+`puertaU`. Condensación: verificación externa (planilla MINVU Res. Ex. 1802), no bloquea el veredicto opaco.

### Obra Digital — doc-por-folio + Storage UUID + counters Año→Mes (Opción A)
- **`storage.rules`** (nuevo) + **`firebase.json`** (bloque `storage`) — zero-trust: `projects/{pid}/obra/{libro|carpeta}/{uuid}`, lectura miembro / escritura editor activo (firestore.get sobre projects/{pid}), tope 25 MB. **Requiere deploy**.
- **`src/tools/obra/storageUpload.ts`** (nuevo) — `subirAdjunto`/`borrarAdjunto` (uploadBytes + getDownloadURL, nombre UUID, tope 25 MB).
- **`src/tools/obra/libroStore.ts`** (nuevo) — META `libroObras/state` {libros,perms,counters} + FOLIOS `.../state/folios/{id}`. Counters **Año→Mes** (AAAA-MM-NNN). Paginación con cursor. **Migración one-time** del MVP.
- **`src/tools/obra/carpetaStore.ts`** (nuevo) — análogo: META + ARCHIVOS `.../state/archivos/{id}` con adjunto opcional + migración.
- **`LibroObrasDigitalView.tsx`** / **`CarpetaDigitalView.tsx`** — integran los stores: escritura granular por folio/archivo, hidratación + paginación ("Cargar más"), subida real a Storage (Free degrada a metadato local), enlaces a binarios, normalización de adjuntos legados. `setToolState` intacto.
- **`src/core/types.ts`** — nuevos contratos: `ObraAdjunto`; `LibroFolio.adjuntos: ObraAdjunto[]`; `CarpetaArchivo.adjunto?`; `TermicoSobrecimiento`; `InformeTermico.sobrecim?`/`puertaU?`.

### Incidencia §8 (mount) — resuelta
Read-lag del montaje (cola truncada) en types.ts + las 3 vistas, con Windows correcto. Reparado por splice en el montaje (`head` + reañado de cola exacta vía heredoc); una línea del Térmico reinsertada con awk. `tsc` final sobre copia consistente.

### Verificado
`tsc -b` → **0 errores**. `vite build` (outDir temporal; dist/ del disco da EPERM al desempaquetar PDFs — entorno) → **exit 0**, con chunks `InformesTermicosView`, `LibroObrasDigitalView`, `CarpetaDigitalView` y **`termico.worker`**.

### Pendientes (para Andrés)
- [ ] **Deploy**: `firebase deploy --only storage` (reglas nuevas) + `--only firestore:rules` + `--only hosting` desde `Web/`.
- [ ] **Verificar en vivo** la subida de adjuntos (uploadBytes E2E) contra el bucket — no testeable desde el sandbox.
- [ ] **Confirmar Tabla 1** (U máx A–I) en `termico/tablas.ts`: celdas combinadas desambiguadas por monotonía; revisar contra planilla oficial MINVU antes de producción. Corrección = un solo archivo.
- [ ] Térmico: ventanas (% por orientación) e infiltraciones requieren inputs de geometría para veredicto numérico (datos ya cargados en tablas.ts).

---

## 2026-06-23 09:28 (Chile) — Tarea Especial: integración productiva de las 5 herramientas nuevas + rebrand BASEPRO en docs

### Contexto
Los 5 mockups (Subsuelo, Ruta Accesible, Térmico, Libro de Obras, Carpeta Digital) ya estaban cableados (registry+catalog, `estado:'active'`) pero **solo con `useState` en memoria**. Esta sesión hace el **desarrollo real**: persistencia, tipos centralizados, reutilización de datos comunes y avance del expediente. Maquetas aprobadas (HITL).

### Decisiones HITL (Andrés, 2026-06-23)
- **Persistencia:** Subsuelo, Ruta Accesible y Térmico → hook existente `useToolData` (`toolData/{toolId}`, ya cubierto por la regla glob `toolData/{document=**}` → **cero reglas/índices nuevos**). Libro de Obras y Carpeta Digital → **subcolecciones propias** `projects/{pid}/libroObras/state` y `projects/{pid}/carpetaDigital/state` (reglas zero-trust nuevas).
- **Alcance:** las 5 en esta sesión.

### Análisis de reutilización de datos (previo, prioridad de Andrés)
- `ProjectMaster` (nombre/comuna/dirección/propietario) vía `useProjects().getProject` → membrete/siembra en las 5 (sin re-captura). Térmico siembra `comuna`→zona.
- `setToolState(pid, toolId, {estado,fecha})` (ya existente en `ProjectProvider`) → cada tool actualiza `ProjectMaster.toolStates` al guardar (avance S7).
- **Contraposición a Tintero §E.1** (que pedía subcolección por tool para todas): se descartó para los 3 generadores porque `useToolData` + regla glob ya resuelve con menor superficie de cambio y zero-trust intacto.

### Cambios (archivos tocados)
- **`src/core/types.ts`** — añadidos contratos de dominio centralizados: `InformeSubsuelo`/`Horizonte`; `MemoriaRutaAccesible`/`RutaEstado3`; `InformeTermico`/`TermicoComplejo`/`TermicoCapa`/`TermicoElemento`; `LibroObrasState`/`LibroFolio`/`LibroObra`/`LibroNivel`/`LibroFormatoId`/`LibroEstadoFolio`; `CarpetaDigitalState`/`CarpetaArchivo`.
- **`src/tools/InformeSubsueloView.tsx`** · **`RutaAccesibleView.tsx`** · **`InformesTermicosView.tsx`** — patrón *bridge* (se conservan los `useState` y call-sites): `useToolData` + hidratación única (`hidratadoRef`) + `guardar()` (botón [GUARDAR]) + `setToolState`. Quitado badge `MOCKUP`. Térmico: estado SIEMPRE "En proceso" (no acredita hasta Tablas oficiales; badges "Pendiente" intactos).
- **`src/tools/LibroObrasDigitalView.tsx`** · **`CarpetaDigitalView.tsx`** — persistencia inline a subcolección propia (`getDoc`/`setDoc` con `serverTimestamp`), `repo.kind` decide nube/local, fallback `localStorage ab-<id>-{pid}`, `JSON.parse(JSON.stringify())` para descartar `undefined` (Firestore). Botón Guardar en cabecera. `setToolState`. Quitado `MOCKUP`.
- **`firestore.rules`** — añadidas reglas zero-trust `match /libroObras/{document=**}` y `match /carpetaDigital/{document=**}` (read: miembro · write: dueño/editor activo). Reglas de `coordenadasnormativas` y existentes intactas (§4).
- **`DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md`** — árbol `tools/` con las 5 nuevas + `carpetaDigitalData.ts`; fila `firestore.rules` y flujo de persistencia ampliados; nuevo flujo "Reutilización de datos comunes".
- **`Iniciar Aquí.md`** — §1 rebrand web → **BASEPRO** (repo sigue Archibots/Project_Book); §6 reescrita: las 5 ya INTEGRADAS con tabla toolId/archivo/tier/persistencia.

### Incidencia §8 (mount) — resuelta
El mount truncó la cola de los 5 `.tsx` durante el `Edit` (read-lag) y dejó bytes NUL en 2. Reparado por script en el mount: `head -n -1` + reañadir cola por heredoc, dedupe de la línea de empalme (Subsuelo/Carpeta) y `tr -d '\000'`. 

### Verificado
`tsc -b` → **0 errores**. `vite build` (outDir temporal del sandbox, porque el `dist/` del disco da EPERM al desempaquetar PDFs — problema de entorno, no de código) → **exit 0**, con los 5 chunks generados (`InformeSubsueloView`, `RutaAccesibleView`, `InformesTermicosView`, `LibroObrasDigitalView`, `CarpetaDigitalView`).

### Pendientes (futuro)
- [ ] Deploy: `firebase deploy --only firestore:rules` (nuevas reglas libroObras/carpetaDigital) y `--only hosting` desde `Web/`.
- [ ] Obra Digital: migrar de doc único `state` a documento-por-folio/archivo con cursores + adjuntos UUID (Storage Premium) + counters Año→Mes.
- [ ] Térmico: motor real en Web Worker + cargar Tablas oficiales (U máx/Rt mín, materiales λ/ρ/μ) para acreditar (quitar "Pendiente").
- [ ] Ruta Accesible: prefill opcional de carga/superficie desde `carga-ocupacion` (hoy reusa solo master).

---

## 2026-06-22 18:45 (Chile) — Header: logos transparentes + ajuste vertical

### Cambios
- **Logos Basepro con fondo transparente.** No hay vectorizador en el entorno (potrace/inkscape ausentes), así que se generaron PNG transparentes en alta resolución recortando el fondo por flood-fill + borde suavizado (Gaussian 0.8): `public/Basepro-B-t.png` (fondo blanco→transparente, ícono oscuro) y `public/Basepro-N-t.png` (fondo negro→transparente, ícono claro). `ShellTop` apunta a estos (alternancia por tema intacta). Ya no muestran caja blanca/negra → se funden con la barra y son responsivos.
- **Tagline más pegado arriba**: `.ab-topbar` padding-top 3→0; `.ab-top-tagline` line-height 1, margen 2/4.
- **BASEPRO más abajo / eslogan al pie**: `.ab-brand` align-items center→stretch; `.ab-brand-text` con `justify-content:flex-end` + `padding-bottom:6px` (el bloque de texto baja).

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (ambos PNG transparentes en dist).

### Nota
"Vectorizar" estricto (a SVG) no es posible aquí sin potrace/inkscape; la solución equivalente fue PNG de alta resolución con alfa real. Si se requiere SVG, hacerlo en una herramienta externa y reemplazar el archivo.

---

## 2026-06-22 18:25 (Chile) — Header: reordenado + logo Basepro alterna por tema

### Síntoma
El header quedó desordenado: los dos eslóganes en la fila de la marca se topaban con título/logos.

### Cambios (`components/ShellTop.tsx` + `archibots.css`)
- **Slogan "Gestión Documental - …" movido arriba a la IZQUIERDA**: ahora es un `.ab-top-tagline` (fila propia full-width, `order:-1`) dentro de `.ab-topbar`, no choca con la marca.
- La marca (derecha) queda con **BASEPRO** + un solo eslogan ("La infraestructura digital de tu proyecto. Proyecta. Cumple. Construye.") + logo Basepro + logo Archibots.
- **Logo Basepro alterna por color de barra**: `barIsDark = theme !== 'matrix'` → barra oscura (cad/washi/white) usa **`Basepro N.jpg`** (versión clara); barra clara (matrix) usa **`Basepro B.png`** (versión oscura). *Si la asignación N/B quedó invertida, es un swap de una línea en `baseproLogo`.*
- Se retiró el `.ab-brand-sub-row` de dos columnas (causaba el desorden); vuelve a `.ab-brand-sub` simple.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (ambos logos `Basepro N.jpg` y `Basepro B.png` copiados a dist).

---

## 2026-06-22 18:05 (Chile) — Header rebrand: BASEPRO + logo nuevo

### Cambios (`components/ShellTop.tsx`)
- Título de la página: **Project_Book → BASEPRO** ("PRO" en rojo `--destructive`, clase `.pro`).
- **Logo nuevo** `public/Basepro B.png` (`/Basepro%20B.png`) agregado junto al título; **el logo Archibots se mantiene** y queda a la derecha del nuevo.
- **Eslóganes en una fila, a cada lado** (`.ab-brand-sub-row`, space-between): izquierda "La infraestructura digital de tu proyecto. **Proyecta. Cumple. Construye.**"; derecha "Gestión Documental - **Expedientes técnicos** - Arquitectura - Permisos".

### CSS (`archibots.css`)
- `.ab-brand-title .pro` (rojo), `.ab-brand-text` (columna), `.ab-brand-sub-row` (dos eslóganes), `.ab-brand-logo-new` (120px / 72px en móvil).

### Incidencia §8 (otra vez)
El mount truncó el Edit de `ShellTop.tsx` a 110 líneas (JSX roto) → `tsc` rompía. Reconstruido el bloque final por script en el mount; `tsc -b` 0 errores.

### Nota de entorno
Un `vite build` falló por **ENOSPC** (el `/tmp` del sandbox se llenó con builds previos). Tras limpiar `/tmp`, build **exit 0** (CSS y el logo nuevo copiados a dist). No es problema de código.

---

## 2026-06-22 17:40 (Chile) — Fix tema CAD: botones primarios no se pintaban

### Síntoma
En tema CAD los botones se veían sin relleno (solo contorno) en el BIM wizard (chips seleccionados indistinguibles) y en el Catálogo de Herramientas (se perdía el verde "EN PROYECTO" y la jerarquía primario/secundario).

### Causa
Las reglas `:root[data-theme="cad"] .ab-btn` y `.technical-btn` forzaban `background:transparent !important` a **todos** los botones (estilo "comando"), borrando la distinción primario/secundario/añadido.

### Fix (`archibots.css`)
- **Primarios pintados** en CAD: `.ab-btn` y `.technical-btn` (sin modificador) → relleno `var(--foreground)`, texto `var(--background)`; hover a `--destructive`.
- **Secundarios en contorno**: `.ab-btn.sec`, `.ab-btn.add:not(.added)`, `.technical-btn.secondary`, `.btn-tech-gray` → transparentes con inversión en hover.
- **Estado "EN PROYECTO"**: `.ab-btn.add.added` → verde `--success`.
- Se conservan los pseudo-corchetes `[ ]` del catálogo.
- *Resultado:* en el wizard el chip seleccionado vuelve a verse pintado; en el catálogo se recupera la jerarquía y el verde. `vite build` OK.

---

## 2026-06-22 17:20 (Chile) — Columnas redimensionables (Overleaf) + editor admin de Top Tools + diagnóstico BIM

### 1. Columnas redimensionables/colapsables (Workspace)
- `views/WorkspaceView.tsx` reescrito: las 3 columnas (área dinámica · catálogo · carpeta) tienen **separadores móviles** arrastrables y **colapso** de catálogo/carpeta. Estado (anchos + abierto/cerrado) persiste **solo por sesión** en `sessionStorage` (`ab-cols`); por defecto abren como estaban.
- Implementación: en pantallas >1040px se inyecta `grid-template-columns` inline (`1fr 10px cat 10px bind`) con gutters como columnas; ≤1040px manda el CSS responsive existente (sin gutters). Drag vía pointer events (clamp 180–760px).
- `archibots.css`: clases `.ab-gutter`, `.ab-gutter-toggle`, `.ab-gutter-grip`.

### 2. Editor admin de Top Tools
- `core/AdminService.ts`: `getTopTools()` / `setTopTools(ids)` sobre `config/topTools` (la barra ya lo leía).
- `views/AdminDashboard.tsx`: sección "TOP TOOLS" — chips de las ancladas + checklist de tools activas + [GUARDAR]. (Requiere regla Firestore de escritura admin en `config/topTools`; si no existe, el guardado degrada con aviso.)

### 3. Asistente de Usos BIM — CONTENIDO RECUPERADO
- El componente productivo era un **esqueleto** de 7 pasos sin contenido. El usuario (Premium) pidió recuperar el wizard real desde `DESARROLLO/Mockup/mockup-archibots/src/tools/BimWizardView.tsx`.
- `tools/BimWizardView.tsx` reconstruido con el **wizard completo de 6 pasos** (Planbim/CORFO): (0) intro, (1) perfil actor/rol/escala, (2) ciclo de vida con fases activas/críticas, (3) procesos clave, (4) taxonomía + factibilidad puntuada de 7 Usos BIM, (5) análisis técnico-económico (LOD/LOIN, ROI, CAPEX/OPEX), (6) hoja de ruta + tabla priorizada + exportar PDF.
- **Adaptado al stack productivo** (no se copió el patrón del Mockup deprecado): firma `ToolProps`, guarda premium `access==='locked'`, `import type`, tipos estrictos (sin `any`; índices con `?? ''`), `window.print()` real en exportar. Datos paramétricos (factibilidad estimada); IA (apiProxy) queda para iteración futura.
- *Archivos:* `Web/src/tools/BimWizardView.tsx`.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (chunks Workspace/AdminDashboard/BimWizard).

### 🔧 Pendiente
- [ ] Confirmar regla Firestore: escritura admin en `config/topTools` (si falta, el editor no persiste).
- [ ] Decidir gating del Asistente BIM (premium + ascenso vs free).

---

## 2026-06-22 16:52 (Chile) — Pasada de optimización visual por todas las herramientas

### Auditoría
Revisadas las 25 tools por patrones: grids con `minmax` que colapsan a 1 columna, columnas desbalanceadas, filas apilables e inputs numéricos sin alinear.

### Cambios aplicados
1. **Números a la derecha — regla GLOBAL ampliada** (`Web/src/archibots.css`): de `.tech-input[type=number]` a `.tech-input[type="number"], .tool-panel input[type="number"], .panel-content input[type="number"]`. Ahora cubre también inputs numéricos crudos (sin clase) de cualquier herramienta.
2. **Dimensionador de Edificios Públicos** (`DimensionadorPublicosView.tsx`): la grilla de "1. Estamentos y Dotación" colapsaba a 1 columna (`minmax(260px)` en un panel de ~460px). Bajado a `minmax(190px)` con `gap '6px 14px'` e input 80→68px → ahora entran 2 columnas, menos alto desperdiciado.

### Sin cambios (ya correctos / intencional)
Resto de grids usan `minmax` 160–220 (se acomodan bien) o 280 en tarjetas de contenido que requieren ese ancho (Expediente Normativo, Calculadora Arquitectónica, Listado de Documentos). Inputs numéricos de CuadroSuperficies/Honorarios/Dimensionador ya tenían `textAlign:'right'` inline.

### Incidencia §8 (recurrente)
Tras un `Edit` puntual en `DimensionadorPublicosView.tsx`, el mount perdió las 2 líneas de cierre (`);`/`}`) → `tsc` rompía. Reañadidas en el mount; build verde.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (chunk DimensionadorPublicos regenerado).

---

## 2026-06-22 16:34 (Chile) — UI: números a la derecha (global) + Dimensionador fila única por recinto

### Cambios
1. **Números justificados a la derecha (todas las herramientas).** Regla global en `Web/src/archibots.css`: `.tech-input[type="number"]{ text-align:right; }`. Cubre Datos del Proyecto (Superficie Terreno Legal, a Edificar), Ubicación y demás. Los inputs numéricos especiales (CuadroSuperficies, CalculadoraHonorarios, Dimensionador) ya tenían `textAlign:'right'` inline → sin cambios.
2. **Dimensionador de Proyecto — catálogo en una sola fila por recinto.** `Web/src/tools/DimensionadorView.tsx`: cada recinto pasó de 2 líneas apiladas a **una fila** (nombre · SUP · contador · m² · [AGREGAR]). Anchos de columna rebalanceados: catálogo `flex 1 1 280px → 2 1 380px` (más ancho); recinto manual `1 1 280px → 1 1 210px` (más angosto).

### Verificado
`tsc -b` 0 errores · `vite build` OK (exit 0, 2232 módulos). *Nota:* un `vite build` intermedio falló por colisión del `--outDir` temporal reusado (transitorio del entorno); con outDir limpio compila verde.

### Criterio aplicado (para próximas tools)
Buscar columnas desbalanceadas que fuercen wrap innecesario y filas que puedan colapsarse a una sola línea; alinear números a la derecha. La regla CSS global ya cubre lo numérico en bloque.

---

## 2026-06-22 16:18 (Chile) — UI global: compactado de botones, campos e interlineados en el Área de Trabajo

### Qué se hizo
El usuario reportó que las herramientas del Área Dinámica de Trabajo se ven demasiado grandes; referencia de tamaño: la Carpeta de Proyecto (~10–13px). Como todas las tools comparten las mismas clases, se ajustó **una sola vez** en `Web/src/archibots.css` (no se tocó ningún componente) → aplica a TODAS las herramientas a la vez.

### Clases compactadas (`archibots.css`)
- `.technical-btn`: padding 8/16→5/11, font .82→.72rem.
- `.module-header`: min-height 48→34, font .82→.74rem, padding 0 15→0 12.
- `.panel-content`: padding 20→13.
- `.tech-input,.tech-select`: padding 10/12→6/9, font .88→.78rem.
- `.tech-input-group`: margin-bottom 15→9; `label` .72→.66rem, mb 5→3.
- `.tech-quote`: font .82→.74rem, mb 20→12.
- `.tech-table th/td`: padding 10/12→6/9. `.counter-box`: alto 32→28.

### Verificado
`vite build` OK (2232 módulos, CSS compila). No se modificaron las clases de la Carpeta/Binder (`.ab-binder-head`, `.ab-catalog-head` 13px) que son la referencia.

---

## 2026-06-22 16:05 (Chile) — Refactor Ubicación: Mapa integrado, split calle/número, superficies sincronizadas + ajustes Geolocalizador

### Resumen
5 refactorizaciones pedidas. Sync **al guardar** (patrón repo.save + reload). `tsc -b` 0 errores y `vite build` OK (2232 módulos; chunks Ubicacion/Geolocalizador, sin chunk Mapa de Terreno).

### Cambios
1. **Superficie Terreno Legal compartida** (Datos del Proyecto ↔ Ubicación): ambos leen/escriben `ProjectMaster.superficieTerrenoLegal`. Editar en cualquiera y guardar actualiza el otro al recargar.
2. **Mapa de Terreno integrado en Ubicación** (deja de ser herramienta del catálogo): quitado de `catalog.ts` y `registry.ts`. La lógica de dibujo+área (Web Worker Turf) vive ahora dentro de `UbicacionView`, **debajo de LOCALIZACIÓN ADMINISTRATIVA**, con controles compactos (solo [LIMPIAR]) y mapa más grande. **ÁREA CALCULADA** pasa a ser un campo (solo lectura) al lado de Superficie Terreno Legal; se guarda en `superficieCalculada`. Polígono en **clave de disco compartida** `ab-mapa-terreno-${pid}` (editar en Mapa o Geolocalizador edita el mismo terreno; se relee al abrir).
3. **Geolocalizador — polígono con líneas negras** (antes rojo `#D32F2F` → `#111111`, igual que Mapa de Terreno).
4. **Geolocalizador — PARÁMETROS DE UBICACIÓN en una fila** (Comuna · Dirección); **eliminadas las coordenadas LAT/LNG** de la UI (el estado lat/lng sigue interno, alimentado por clic/marcador/geocoder); **mapa más bajo** (500→340 px) para acercar el EXPEDIENTE NORMATIVO. Carga/persiste el polígono compartido.
5. **Ubicación — calle y número separados** (se combinan en `direccion` al guardar; `splitDireccion` los separa al cargar). **Rol SII por defecto `000-00`** (cambiado en `ProjectRepository.makeDefaultProject`; placeholder `000-00`). *Nota:* proyectos ya creados con rol `Arquitecto` conservan ese valor hasta que el usuario lo edite (no se reescribe dato existente en silencio).

### Archivos
- `Web/src/core/catalog.ts`, `Web/src/core/registry.ts` (quitan `mapa-terreno`).
- `Web/src/core/db/ProjectRepository.ts` (rol default `000-00`).
- `Web/src/tools/UbicacionView.tsx` (reescritura: + mapa, split, superficies). *Reescritura autorizada por el alcance del pedido.*
- `Web/src/tools/GeolocalizadorView.tsx` (negro, 1 fila sin coords, mapa bajo, polígono compartido).
- `Web/src/tools/MapaTerrenoView.tsx`: **queda en disco pero sin registrar** (ya no se importa). *Acción opcional:* borrar el archivo si se desea limpieza total.

### 🔧 Pendientes
- [ ] (Heredado) Completar fichas faltantes de zonas especiales en `norma-data`.
- [ ] Opcional: borrar `Web/src/tools/MapaTerrenoView.tsx` y `public/geo-data/manifest.json` (artefactos sin uso).

---

## 2026-06-22 15:36 (Chile) — REVERTIDA la fusión de overlays + tolerancia de snap a zona base

### Síntoma reportado
Un terreno residencial (Ñuñoa, Armando Carrera/Celerino Pereira) se reportaba como **"Zona Área de restricción"** con PARÁMETROS ESTIMADOS (sin ficha). No debía marcarse como área de restricción. Confirmado: la normativa vive en `Web/public/norma-data` (8 comunas).

### Causa raíz
La fusión de overlays de la entrada 15:24 fue el enfoque equivocado: la capa `_AP` ("Área de restricción" = zona de protección de helipuerto) es una **restricción superpuesta de gran extensión**, NO una zona base. Al fusionarla y hacer point-in-polygon, ganaba el overlay. Además, el punto cae en un **hueco de topología** de la capa base (a ~2.5 m de la zona real **Z-4B**), por eso antes daba "fuera de zona" y tras la fusión daba "Área de restricción".

### Fix
- `core/GeoJsonService.ts`: **revertido a carga base-only** (sin manifest/merge). Las overlays no determinan la zona. Clave de caché `#base` para invalidar las cachés `#m` de la fusión.
- `core/useCerebroNormativo.ts`: añadida **tolerancia de snap** — si el punto no cae estrictamente en ningún polígono base, se asigna la zona base más cercana dentro de `TOL_METROS = 30` (vía `@turf/point-to-polygon-distance`). Resuelve los huecos de borde de calle sin recurrir a overlays.
- *Archivos:* `Web/src/core/GeoJsonService.ts`, `Web/src/core/useCerebroNormativo.ts`.

### Verificado
- `tsc -b` en **0 errores**.
- Punto de prueba `-33.437613,-70.577079`: ahora resuelve **Z-4B** (zona base, snap a 2.5 m) y **trae su ficha real** de `13_nunoa.json` (ya no "Área de restricción", ya no estimados).

### Notas / limpieza
- El `manifest.json` que generé en 15:24 quedó en `public/geo-data/` pero **ya no se usa** (no pude borrarlo por permisos del entorno; es inocuo). *Acción opcional:* borrarlo manualmente.
- La entrada 15:24 (fusión de overlays) queda **superada** por esta. La 15:16 (matcher de zona `matchZona`) sigue **vigente y correcta**.

### 🔧 Pendiente restante
- [ ] Completar fichas faltantes de zonas especiales en `norma-data` (las zonas sin parámetros que no son huecos: ICH/MH/ZT ya matchean; faltan `CD`, `UCH`, `UMCE`, `Z-US`, etc. donde no haya ficha). Solo aplica si un terreno cae realmente en una de esas zonas base.

---

## 2026-06-22 15:24 (Chile) — Cerebro Espacial: fusión de capas overlay del PRC (manifest) — ⚠️ SUPERADA por la entrada 15:36 (revertida)

### Qué se resolvió
Pendiente abierto en entradas 15:04 y 15:16: `loadComunaGeoJSON` cargaba **solo la capa base** `13_PRC_<Comuna>.json`. Los puntos que caen en overlays seccionales/patrimoniales (`_AP`, `_R`, `_Patrimonio_ICH/ZCH`, `_SECC_…`) daban "fuera de toda zona PRC". El punto de prueba `-33.437613,-70.577079` cae solo en `13_PRC_Nunoa_AP.json`.

### Implementación (sin adivinar nombres → evita 404)
- **Nuevo `Web/public/geo-data/manifest.json`** (294 comunas, todas las regiones): mapea `${region}_${ComunaToken}` → `[base, ...overlays]`. Generado programáticamente: base = archivo `<region>_PRC_<Token>.json`; overlays = archivos `<Token>_…`. Excluye como base los que ya son overlay de otro.
- **`Web/src/core/GeoJsonService.ts`**: nuevos `loadManifest()` + `archivosComuna()`; `loadComunaGeoJSON` ahora **fusiona las features** de todas las capas del manifest (fallback al base si no hay manifest o la comuna no está; overlay ausente no es fatal). Clave de caché versionada `#m` para invalidar cachés base-only previas en IndexedDB.

### Verificado
- `tsc -b` en **0 errores**.
- End-to-end con shapely: el punto de prueba ahora detecta zona **`Área de restricción`** (overlay `_AP`) en vez de "fuera de zona". Manifest resuelve overlays de Ñuñoa (`_AP`), Lo Barnechea (`_R`), Providencia (`_ICH`/`_ZCH`), Vitacura (`_R`).
- *Nota:* `Área de restricción` aún cae a "sin ficha" porque ese código **no existe en `13_nunoa.json`** → es el pendiente de cobertura de fichas (no de overlays).

### ⚠️ Incidencia de entorno (recurrente §8)
El mount **truncó** la escritura de `GeoJsonService.ts` a 90 líneas (las file-tools veían 135 OK, `tsc` corría contra la versión truncada). Workaround aplicado: reescritura completa por heredoc en el mount + `tsc`. Confirmado 135/136 líneas y build verde.

### 🔧 Pendiente restante
- [ ] **Completar fichas faltantes en `norma-data`** (zonas sin parámetros: `CD`, `UCH`, `UMCE`, `Z-US`, `PM y AP`, `ZR-1`, `Áreas verdes`, `Área de restricción` en Ñuñoa; revisar las otras 7 comunas). Es lo único que falta para que TODO punto devuelva ficha.
- [x] Fusión de overlays del PRC (este ítem) — **RESUELTO**.

---

## 2026-06-22 15:16 (Chile) — Fix Cerebro Normativo: fichas de zonas especiales/patrimoniales no matcheaban

### Síntoma reportado
Geolocalizador normativo: la ficha PRC no cargaba correctamente. Las zonas residenciales (Z-2, Z-4, Z-4C…) sí resolvían ficha; las patrimoniales/especiales no → "Zona X detectada, pero sin ficha local".

### Causa raíz (bug de código)
Convenciones de código divergentes entre las dos fuentes:
- **GeoJSON (`/geo-data`)**: `MH- 1`, `ZT-3`, `ZCH- 1`, `ICH-1` (sin prefijo, con espacio tras el guion).
- **Fichas (`/norma-data`)**: `Z-MH1`, `Z-ZT3`, `Z-ZCH1`, `Z-ICH1` (prefijo `Z-`).

El `normZona` de `NormativaService.ts` solo quitaba espacios y mayúsculas pero **conservaba el guion y no reconciliaba el prefijo `Z`**, así que `MH-1 ≠ Z-MH1`. Match exacto fallaba para toda zona especial.

### Fix (edición quirúrgica)
- `core/NormativaService.ts`:
  - `normZona` ahora colapsa **todos** los separadores (`[^a-zA-Z0-9]`): "MH- 1"→"MH1", "Z-4C+R"→"Z4CR".
  - Nuevo helper `matchZona(a,b)`: empareja exacto o tolerando el prefijo `Z` inicial (GeoJSON "ICH1" ↔ ficha "ZICH1").
  - `getNormativa` usa `matchZona` en vez de `===`.
- *Archivos:* `Web/src/core/NormativaService.ts`.
- **Verificado:** `tsc -b` en 0 errores. Las 8 comunas; en Ñuñoa las 31 zonas con ficha resuelven (incluidas MH-1..3, ZT-1..5, ZCH-1, ICH-1..4); **sin multi-match/ambigüedad**.

### Hallazgo secundario (cobertura — NO resuelto)
Quedan sin ficha en `13_nunoa.json` (dato faltante, no bug): `CD`, `UCH`, `UMCE`, `Z-US`, `PM y AP`, `ZR-1`, `Áreas verdes`, `Área de restricción`. Esta última (`_AP` overlay) es además la zona del punto de prueba `-33.437613,-70.577079` → ligado al pendiente de overlays (entrada 15:04).

### 🔧 Pendientes (sin cambios)
- [ ] Cargar/fusionar capas overlay del PRC (manifest comuna→[base+overlays]). Ver entrada 15:04.
- [ ] Completar fichas faltantes en `norma-data` (zonas especiales sin parámetros). Aplica a las 8 comunas.

---

## 2026-06-22 15:04 (Chile) — Fix Cerebro Espacial: capa PRC no cargaba para comunas de nombre compuesto

### Síntoma reportado
Geolocalizador: "ZONA PRC NO DETECTADA" / "El punto cae fuera de toda zona PRC de la comuna" al intersectar.

### Causa raíz (bug de código)
`GeoJsonService.normalizarComuna` **eliminaba los espacios** del nombre de comuna (`"Las Condes" → "LasCondes"`), pero los archivos GeoJSON usan **guion bajo entre palabras** (`13_PRC_Las_Condes.json`). Resultado: **404** al cargar la capa para TODA comuna de nombre compuesto (Las Condes, Lo Barnechea, La Florida, Estación Central, Pedro Aguirre Cerda, Cerro Navia, La Cisterna, La Granja, La Pintana, La Reina, Lo Espejo, etc.). Las comunas de una sola palabra (Ñuñoa, Providencia, Vitacura, Santiago, Peñalolén) no se veían afectadas.

### Fix
- `core/GeoJsonService.ts` → `normalizarComuna` reescrita: quita tildes, separa por palabras, **Title_Case por palabra unidas con `_`** (`"Las Condes" → "Las_Condes"`, `"Ñuñoa" → "Nunoa"`). Verificada la resolución de archivo para comunas simples y compuestas. `tsc -b` en 0 errores.
- *Archivos:* `Web/src/core/GeoJsonService.ts`.

### Hallazgo secundario (coverage — NO resuelto)
- El servicio carga **solo la capa base** `13_PRC_<Comuna>.json`. Hay **capas overlay/seccionales** por comuna (`_AP` área de protección, `_R`, `_ZNE`, `_ICH`, `_ZCH`…) que NO se cargan. El punto de prueba del usuario (`-33.437613, -70.577079`) cae **solo** en `13_PRC_Nunoa_AP.json` (zona "Área de restricción"), por eso da "fuera de zona" aunque la comuna sea correcta.

### 🔧 Pendiente generado
- [ ] **Cargar/fusionar capas overlay del PRC** (decisión pendiente con el usuario). Propuesta: manifest `geo-data/manifest.json` (comuna → [archivos base + overlays]) y que `loadComunaGeoJSON` fusione las features de todas las capas de la comuna. Evita 404 por adivinar nombres.

---

## 2026-06-22 14:56 (Chile) — Validación build + Glosario en Carpeta Digital + Libro de Obras completo (mockups)

### Resumen de la sesión
Trabajo sobre los mockups de las herramientas nuevas (Fase 0). Cuatro bloques: (1) validación de build de los 5 mockups, (2) aplicación del glosario MOP completo y numerado a la Carpeta Digital, (3) reescritura del Libro de Obras Digital con todo lo pedido, (4) botón Compartir y apertura permanente del tipo de contrato. Todo con `tsc -b` en **0 errores** y `vite build` generando los chunks (verificado con `--outDir` temporal por el problema de permisos al borrar `dist/`).

### A. Validación de build de los 5 mockups — RESUELTO
- `tsc -b` fallaba en `RutaAccesibleView.tsx`: (a) `<Fragment>` cerrado con `</>` (línea 304) y (b) el archivo estaba **truncado** sin las líneas de cierre del componente (`);`/`}`). Corregido.
- Un append por bash duplicó luego el cierre (`);`/`}` repetido en 318–319) por desincronización del mount → eliminado el par duplicado. Build verde.
- *Archivos:* `Web/src/tools/RutaAccesibleView.tsx`.

### B. Carpeta Digital — Glosario MOP completo y NUMERADO
- La tool tenía datos **placeholder** (6 contratos genéricos + 5 carpetas inventadas). Reemplazados por el **glosario real** (textos literales de los manuales MOP).
- **Nuevo `Web/src/tools/carpetaDigitalData.ts`** (≈372 líneas): 6 tipos de contrato con sus árboles completos — Obras y Conservación (21 carpetas N1), Asesorías (18), Consultorías (18), AIF (10), Estudios/Diseños (11), APR (10) — con subcarpetas y documentos predeterminados. Extraído programáticamente del prototipo (`index.html` → objeto `CONTRACTS`) para fidelidad exacta.
- `CarpetaDigitalView.tsx` reescrito: árbol recursivo **numerado** (`1 Licitación`, `4-1 …`, `2.1 …`), conteo recursivo, tipos de documento por carpeta, versionado y archivar/restaurar.

### C. Carpeta Digital — Compartir + tipo de contrato permanente
- **Botón Compartir** específico de la Carpeta con permiso por usuario (sin acceso → lectura → escritura → edición).
- **Selector "Tipo de contrato" solo al inicio:** pantalla de apertura "[ ABRIR CARPETA DIGITAL ]"; una vez elegido queda **permanente** (se muestra como dato fijo, sin selector).
- *Archivos:* `Web/src/tools/CarpetaDigitalView.tsx`, `Web/src/tools/carpetaDigitalData.ts` (nuevo).

### D. Libro de Obras Digital — reescritura completa (desde el prototipo)
- **Libros por defecto:** Maestro, Comunicaciones, Gestión de Calidad, Prevención de Riesgos.
- **"+ Agregar libro"** con simulados: temáticos (Medio Ambiente, Participación Ciudadana, …) y por especialidad (Estructuras, Sanitario, Electricidad, Topografía, Laboratorio) **+ especialidad personalizada**. Nacen 🔒 cerrados → Acta de Apertura.
- **Formatos de entrada predeterminados:** Comunicación (1.1–1.5), Incidente (2.1), Reporte Ejecutivo (2.2), Formato libre.
- **Subtemas por entrada:** Tema 1.1–1.5 despliega su lista oficial de subtemas (textos del glosario §4); Incidente con sus tipos.
- **"Ver también en (libros vinculados)"** (multiselección), **"Participantes (otros usuarios o personas sin cuenta)"** (chips + sugeridos, marca "(sin cuenta)"), **"Adjuntar archivos o imágenes"** (lista de adjuntos).
- **Botón Compartir** específico del Libro con permiso por usuario.
- *Archivos:* `Web/src/tools/LibroObrasDigitalView.tsx`.

### ⚠️ Incidencias del entorno
- **El mount trunca escrituras grandes** (Write/Edit) en ~13,4 KB en algunos archivos (afectó a `CarpetaDigitalView.tsx` y a este `Last Update.md`). **Workaround confirmado:** construir el archivo completo en disco nativo del sandbox (`/tmp`, `head` + heredoc) y `cp` al árbol, verificando con `tsc`/`Read`. El `Write` de un solo golpe del Libro (24 KB) sí persistió; el riesgo aparece con archivos grandes y con múltiples `Edit` sobre el mount.
- `npm run build` a `dist/` real sigue fallando en el sandbox por permisos al borrar `dist/Biblioteca/*.pdf` (solo entorno; en la máquina del usuario compila normal).

### 🔧 Pendientes generados / estado
- [ ] **Desarrollo productivo** de Carpeta Digital y Libro de Obras (persistencia `useToolData` + Firestore/Storage, adjuntos UUID, permisos denormalizados reales). Hoy siguen como **mockups en memoria**.
- [x] Glosario aplicado y numerado en Carpeta Digital.
- [x] Libro de Obras con formatos, libros por defecto/agregar, subtemas, compartir, vinculados, participantes y adjuntos.

---

## 2026-06-22 14:51 (Chile) — Ficha Normativa migrada a archivos locales + UX Tintero + Maps/Polígono

### Resumen de la sesión
Sesión de trabajo sobre pendientes del `Tintero - Pendientes.md`. Tres bloques entregados, todos con build verde (`tsc -b` y `vite build` en 0 errores; cada herramienta genera su chunk).

### A. UX rápidos del Tintero (ítems 6, 7, 8, 10) — RESUELTOS
- **Ítem 6 — Compartir reubicado a la ficha.** Botón "Compartir" añadido en `BinderFicha` junto al título del proyecto; `onShare` baja vía `useOutletContext` (`AppShell` → `WorkspaceView` → `BinderFicha`). Se quitó el botón `[ COMPARTIR ]` de `ShellTop` (permanece en el menú de cuenta).
- **Ítems 7+8 — Avance del expediente fuera de la ficha.** Eliminado el bloque `ab-progress` (barra + 15 chequeos) de `BinderFicha`. Se conserva el "Avance del Expediente" de `WorkspaceView` (`ab-wavance`, con accesos directos a las herramientas agregadas).
- **Ítem 10 — Membrete de exportación.** En `DocumentExportWrapper` el membrete pasó a **grid único de 4 columnas** (corrige la desalineación de la 3ª columna) + **borde perimetral**.
- *Archivos:* `Web/src/AppShell.tsx`, `Web/src/views/WorkspaceView.tsx`, `Web/src/components/BinderFicha.tsx`, `Web/src/components/ShellTop.tsx`, `Web/src/components/DocumentExportWrapper.tsx`.

### B. Maps + Polígono del Tintero (ítems 1, 2) — RESUELTOS (código)
- **Polígono guardado se redibuja** al abrir `MapaTerrenoView` y se encuadra (`fitBounds`).
- **Botón `[ LIMPIAR ]` nuevo en `MapaTerrenoView`** (no existía) y **`Limpiar` en `GeolocalizadorView` ahora vacía el polígono del mapa** (vía `polygonRef`).
- **Mapa simple en blanco y negro**, solo nombres de calles (estilo `MAP_STYLE_BW`, `roadmap`, UI mínima) en ambas herramientas (antes `hybrid`/satélite).
- **Auto-centrado** del mapa según `comuna`/`dirección` del proyecto (geocoder).
- Revisión de carga del SDK (loader funcional v2, `gm_authFailure`, degradación a manual): correcta. **No hay duplicación de mapas.**
- *Archivos:* `Web/src/tools/MapaTerrenoView.tsx`, `Web/src/tools/GeolocalizadorView.tsx`.

### C. Ficha Normativa (ítem 9) — MIGRADA A ARCHIVOS LOCALES
- **Decisión del usuario:** olvidar Firestore (`coordenadasnormativas`/`normativas_prc`); la ficha ahora se resuelve desde **archivos locales** en `Web/public/norma-data/13_<comuna>.json` (8 comunas RM: Ñuñoa, Las Condes, Lo Barnechea, La Florida, Peñalolén, Providencia, Santiago, Vitacura).
- `core/NormativaService.ts` reescrito: carga `/norma-data/13_<slug>.json` (slug sin tildes/espacios), caché en memoria por comuna, **match por `zona_codigo` normalizado** (sin tildes/espacios, mayúsculas). Firmas exportadas intactas (`getNormativa`, `getNormativaDesdeFeature`, `codigoZonaDeProperties`).
- `core/useCerebroNormativo.ts` reescrito: elimina `firebase/storage` y `firestore`; usa `GeoJsonService` (capa PRC `/geo-data`) + `NormativaService` local. API `{isLoading, error, data}` intacta (no rompe `CalculadoraArquitectonica`).
- Textos de UI actualizados (Geolocalizador y Calculadora) para citar `/norma-data` en vez de `normativas_prc`/`coordenadasnormativas`.
- **Verificado end-to-end:** resuelve `Ñuñoa/Z-4B` (constructibilidad 1.8, COS 0.4) y las 8 comunas.
- *Archivos:* `Web/src/core/NormativaService.ts`, `Web/src/core/useCerebroNormativo.ts`, `Web/src/tools/GeolocalizadorView.tsx`, `Web/src/tools/CalculadoraArquitectonica.tsx`.

### ⚠️ Incidencias del entorno detectadas
- **El montaje truncó/corrompió ediciones directas largas** (bytes NUL / truncamiento) — se reconstruyeron los archivos vía el sandbox. Confirma la regla §8 "archivos grandes en scratch".
- **Índice de git corrupto** (`.git/index`, "bad signature 0x00000000"; `index.lock` no se puede borrar por permisos). NO se tocó. **Pendiente:** regenerar el índice (`rm -f .git/index.lock .git/index && git reset`) desde una terminal con el repo cerrado, antes de commitear.
- `npm run build` a `dist/` real falla en el sandbox por permisos al borrar `dist/` (solo entorno; en la máquina del usuario compila normal). Verificación hecha con `--outDir` temporal.

### 🔧 Pendientes generados en esta sesión
- [ ] **Fichas normativas faltantes (Ñuñoa).** En Ñuñoa, 20 de las 40 zonas del GeoJSON tienen ficha (incluida Z-4B); las **20 restantes son zonas especiales** (ICH-1..4, MH-1..3, ZT-1..5, ZCH-1, CD, UCH, UMCE, Z-US, ZR-1, PM y AP, "Áreas verdes") que el archivo de 36 fichas **no incluye** → esas caen a "parámetros estimados". *Acción:* completar esas fichas en los JSON locales de `norma-data`. (Aplica el mismo criterio de cobertura a revisar en las otras 7 comunas.)
- [ ] **Verificar facturación/API en Google Cloud (Maps).** La API Key existe en `.env.local` (presente, 39 chars). Si Maps no carga, revisar: "Maps JavaScript API" **y** "Geocoding API" habilitadas, facturación activa, y restricciones de dominio (prod + `localhost`).
- [ ] **Regenerar índice de git** (ver Incidencias).

### Pendientes del Tintero aún abiertos (no tocados esta sesión)
- Ítem 3 — Revisar módulo BIM (`apiProxy`).
- Ítem 4 — Administración de Top Tools.
- Ítem 5 — Crear correo `@archibots` (infra).

---

<!-- Plantilla para la próxima entrada (copiar arriba):
## YYYY-MM-DD HH:MM (zona) — Título corto
### Resumen
### Cambios (con archivos)
### Pendientes generados / resueltos
-->
