# 🗺️ MAPA DE ARQUITECTURA — Archiblocks SPA

> **Índice estructural definitivo del proyecto.** Mapa de referencia para futuras sesiones: evita re-explorar el árbol a ciegas.
> **Última actualización:** 2026-06-26 (reescrito a la situación actual: rebranding a *Archiblocks*, base `(default)`, dos productos host-aware, catálogo y árbol de `src/` al día).
> **Raíz del repo:** `C:\G\Archiblocks` · **Raíz productiva de la SPA:** `C:\G\Archiblocks\Web`
> Cualquier referencia antigua a `C:\G\ProjectBook\`, `E:\2CLAUDE\Archibots\` o `C:\Users\...\Desktop\Archibots\` está **obsoleta**.

> ⚠️ **Nota de marca vs infraestructura.** La plataforma se rotula **Archiblocks**, pero los **identificadores reales de infraestructura se conservan** (renombrarlos apuntaría a recursos inexistentes): proyecto Firebase `archibots-497423` / `archibots-dev`, repo GitHub `goyogramadors/projectbook`, proyecto Cloudflare Pages `projectbook`, dominios `archibots.cl` / `projectbook-8qt.pages.dev`, archivo `archibots.css`.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | **React 19** + **framer-motion** (animaciones) + **lucide-react** (íconos) |
| Build / dev | **Vite 6** (`npm run dev` · `npm run build` = `tsc -b && vite build`) |
| Lenguaje | **TypeScript** estricto (`import type` obligatorio para Vite/oxc) |
| Estilos | CSS propio `src/archibots.css` (tokens shadcn + **4 temas**); Tailwind base-only (sin compiler) |
| Backend | **Firebase 12** — Auth, Firestore **multi-DB** (`(default)` + `coordenadasnormativas`), Storage, Cloud Functions (Node 20, región `southamerica-west1`) |
| Routing | **react-router-dom v7** (`createBrowserRouter`), **host-aware** (2 árboles de rutas por producto) |
| Geo | **@turf/turf** (en Web Worker) + **@googlemaps/js-api-loader** (carga runtime del SDK) |
| PDF | **pdf-lib** (import dinámico) para llenado de formularios DOM; `DocumentExportWrapper` + `@media print` para láminas imprimibles |
| Patrón clave | **Lazy Loading total**: cada herramienta es `React.lazy(() => import())` en `registry.ts` → un chunk por tool |
| Patrón clave | **"Dos Cerebros"**: Cerebro Espacial (Turf en Worker) + Cerebro Normativo (DB `coordenadasnormativas`), desacoplados |
| Patrón clave | **Producto host-aware**: un solo build sirve **Archiblocks** (`archibots.cl`) y **Libro de Obra Digital** (`librodeobra.archibots.cl`) según el hostname |

---

## 2. Dos productos sobre un mismo código (host-aware)

`src/core/product/product.ts` deriva el producto del **hostname** al cargar el módulo (override por `?product=` para pruebas, persistido en `localStorage`):

| Producto | `ProductId` | Dominio | Toolset | Home / Workspace |
|---|---|---|---|---|
| **Archiblocks** | `archiblocks` | `archibots.cl` | todas (`toolset: null`) | `HomeView` `/` · `WorkspaceView` `/p/:id` |
| **Libro de Obra Digital** | `librodeobra` | `librodeobra.archibots.cl` | solo `['libro-obras','carpeta-digital']` | `LibroLandingView` `/` · `LibroWorkspaceView` `/o/:id` |

El producto decide el shell (`ShellTop`/`ShellDock` parametrizados), la landing, el set de herramientas visibles, el branding y la etiqueta de la unidad de trabajo (**Proyecto** vs **Obra**). Comparten el 100% de auth, providers, Firestore y componentes de herramienta. El `projectId` es siempre el id real de `projects`; "obra" es solo etiqueta de UI. Estado de implementación: **Fases 1–3 hechas** (host-aware, landing, workspace 3-col, ShellTop/Block reducido). Para publicarlo en su **dominio propio `librodeobra.cl`** (sin cambios de código, ya soportado en `product.ts`), ver **`GUIA_DOMINIO_LibroDeObra.md`**. Pendiente menor: enlaces de invitación product-aware en Functions.

---

## 3. Árbol de carpetas productivo (`src/`)

```
src/
├── main.tsx                 → Entry point: árbol de Providers + RouterProvider + AuthModal overlay
├── AppShell.tsx             → Carcasa maestra persistente (ShellTop + <Outlet> con fade + ShellDock); isWorkspace para /p/:id y /o/:id
├── archibots.css            → Estilos globales: tokens shadcn, 4 temas, clases .ab-*
├── vite-env.d.ts            → Tipos de entorno Vite
│
├── core/                    → NÚCLEO: lógica de negocio, datos, auth, routing, producto
│   ├── firebase.ts          → Init Firebase: db = (default) (initializeFirestore), auth, storage, functions(southamerica-west1)
│   ├── router.tsx           → createBrowserRouter host-aware: libroChildren vs archiblocksChildren + guards requireAuth/requireAdmin
│   ├── types.ts             → Tipos canónicos: ProjectMaster (region/ciudad/toolStates), CatalogTool (tiposProyecto), ToolProps, NormativaPRC, FormFieldMap…
│   ├── catalog.ts           → Metadata de presentación: FOLDERS (0–7), CATALOG[], TOP_TOOLS_DEFAULT (NO implementa tools)
│   ├── registry.ts          → REGISTRO: une catalog + componente lazy (LAZY_COMPONENTS) → REGISTRY/getManifest
│   ├── useAccess.ts         → Gating: AccessMode 'edit'|'read'|'locked' (fuente única del paywall)
│   ├── useCerebroNormativo.ts → Hook legacy de intersección punto↔PRC + ficha
│   ├── data-chile.ts        → Datos de Chile (regiones/comunas) + getRegionDeComuna (reverse comuna→región)
│   ├── geoUtils.ts          → Utilidades geográficas + generarLlaveMaestra({comuna}_{zona})
│   ├── AdminService.ts      → Admin: listUsers / setUserPlan / promoteByEmail (imports estáticos)
│   ├── ShareService.ts      → Colaboración: inviteByEmail / revokeAccess / generateShareLink / listMembers (members{})
│   ├── GeoJsonService.ts    → Carga GeoJSON PRC desde CDN /geo-data/ + caché memoria/IndexedDB
│   ├── NormativaService.ts  → Cerebro Normativo: ficha desde DB nombrada coordenadasnormativas (llave {comuna}_{zona})
│   ├── product/product.ts   → PRODUCTO host-aware: ProductId, CONFIGS, PRODUCT, isLibroDeObra, switchProduct
│   ├── auth/AuthProvider.tsx     → Contexto de usuario + openAuthModal(); plan Free/Premium; admin claim
│   ├── db/ProjectProvider.tsx    → Contexto de proyectos: list/get/createProject/addTool/removeTool
│   ├── db/ProjectRepository.ts   → Estrategia Cloud(logueado)/Local(invitado) · makeDefaultProject
│   ├── theme/ThemeProvider.tsx   → 4 temas (cad/washi/matrix/white); persiste users.theme
│   └── ui/ToastProvider.tsx      → Toasts globales (triggerToast)
│
├── components/              → CARCASA y UI de soporte
│   ├── ShellTop.tsx         → Chrome superior persistente HOST-AWARE: marca/branding por producto, conmutador de producto (esq. sup. der.), selector proyecto/obra, navegador "Block"
│   ├── ShellDock.tsx        → Dock inferior persistente (Top Tools + accesos + feedback + legal)
│   ├── ArchiblocksNav.tsx   → "El Block": navegador isométrico SVG con accesos directos; prop scene 'archiblocks'|'librodeobra'
│   ├── archiblocks-scene.html  → Escena del Block completo (Archiblocks) — inyectada ?raw
│   ├── librodeobra-scene.html  → Escena del Block reducida (LDO): edificio + db (Carpeta) + libro (Libro de Obras)
│   ├── BinderFicha.tsx      → Archivador (pestañas 0–7) + Ficha + avance del expediente + "Otros proyectos"
│   ├── ToolCatalog.tsx      → Catálogo lateral de herramientas (agregar/quitar de carpeta)
│   ├── ToolHost.tsx         → Resuelve manifest por toolId, aplica gating, monta tool en <Suspense> + ToolErrorBoundary
│   ├── ToolErrorBoundary.tsx→ Error Boundary de clase: aísla fallos de una tool
│   ├── ProximamenteView.tsx → Placeholder para herramientas en estado 'soon'
│   ├── DocumentExportWrapper.tsx → Lámina imprimible "Hoja de papel Word" (membrete + firma), desvinculada del tema; split-screen + @media print
│   ├── ModuleHeader.tsx     → (legacy) cabecera + logo — reemplazada por ShellTop en el layout actual
│   ├── StatusBar.tsx        → Bloque de estado (path + usuario + badge de plan + tema + compartir) reusado dentro del shell
│   ├── TopToolsBar.tsx      → Barra de accesos rápidos (lee config/topTools) reusada en el dock
│   ├── CorporateFooter.tsx  → Meta-grid + feedback + legal
│   └── Icon.tsx             → Wrapper de lucide-react por nombre
│
├── tools/                   → HERRAMIENTAS (1 archivo por tool; todas montadas vía registry → lazy)
│   │  ── Información / Terreno / Proyecto ──
│   ├── DatosProyectoView.tsx          → 'datos-proyecto' (free): etapa, destino, tipo y superficies
│   ├── ParticipantesView.tsx          → 'participantes' (free): nómina (Arquitecto/Propietario fijos + roles)
│   ├── UbicacionView.tsx              → 'ubicacion' (free): ubicación administrativa; autollena región (getRegionDeComuna); terreno vía terrenoStore
│   ├── GeolocalizadorView.tsx         → 'geolocalizador' (free): Maps + polígono + Worker (Turf) + ficha PRC ("Dos Cerebros"); terreno vía terrenoStore
│   ├── MapaTerrenoView.tsx            → (integrada en Ubicación) dibujo de polígono + área (Worker); terreno vía terrenoStore
│   ├── VolumenTeoricoView.tsx         → 'volumen' (free, "Cabida"): estudio de cabida volumétrica + 3D
│   ├── DimensionadorView.tsx          → 'dimensionador' (free): programa de recintos + % circulación + sync master
│   ├── DimensionadorPublicosView.tsx  → 'dim-publicos' (free): programa institucional MDSF 2024
│   ├── BimWizardView.tsx              → 'bim-wizard' (PREMIUM): asistente de usos BIM (Planbim/CORFO) + IA (apiProxy)
│   │  ── Expedientes de Permisos (carpeta 4) ──
│   ├── ListadoDocumentosView.tsx      → 'listado-dom' (free): documentos/planos solicitados por la DOM
│   ├── ExpedienteMunicipalView.tsx    → 'expediente-dom' (free): Declaración Jurada 1.2.2 + F 2-3.1 + PDF
│   ├── FormulariosDOMView.tsx         → UNA vista data-driven para 5 trámites DOM (solicitud-permiso, permiso-edificacion, modificacion-proyecto, recepcion-final, dj-termino); PDF de fondo + inputs por coordenadas; motor forms/fillForm.ts (pdf-lib lazy)
│   ├── CalculadoraConstruccionesMinvuView.tsx → 'calc-minvu' (free): costos MINVU por volumen
│   ├── CalculadoraCargaOcupacionView.tsx → 'carga-ocupacion' (free): carga de ocupación por recinto (OGUC)
│   ├── CuadroSuperficiesView.tsx      → 'cuadro-superficies' (free): cuadro normalizado de superficies
│   ├── InformeSubsueloView.tsx        → 'informe-suelo' (free): calicata + estratigrafía + aptitud · useToolData + toolStates
│   ├── RutaAccesibleView.tsx          → 'accesibilidad' (free): revisión OGUC 4.1.7 · useToolData + toolStates
│   ├── InformesTermicosView.tsx       → 'informe-termico' (PREMIUM): ACREDITA U vs Tabla 1 RT · Web Worker termico.worker + termico/{tablas,engine}.ts · useToolData + toolStates
│   │  ── Construcción (carpeta 5) ──
│   ├── GeneradorEETTView.tsx          → 'eett-generador' (free): EETT por selector guiado (NCh 1150); catálogo construccion/catalogo.eett.ts; exporta PDF
│   ├── PresupuestoObraView.tsx        → 'presupuesto' (free): itemizado en UF; valor UF en vivo (mindicador.cl); catalogo.presupuesto.ts; exporta PDF
│   ├── GanttView.tsx                  → 'gantt' (free): Carta Gantt por capítulos NCh 1150 (catalogo.gantt.ts); barras con solape; exporta PDF
│   ├── SeguimientoObrasView.tsx       → 'seguimiento' (free, "Minuta de Visita a Obra"): avance/etapa/bitácora (Firestore en Premium)
│   ├── EmisorEstadoPagoView.tsx       → 'estados-pago' (free): revisión de estados de pago
│   ├── LibroObrasDigitalView.tsx      → 'libro-obras' (PREMIUM): doc-por-folio + counters Año→Mes + adjuntos Storage UUID · obra/libroStore.ts + toolStates
│   ├── CarpetaDigitalView.tsx         → 'carpeta-digital' (PREMIUM): doc-por-archivo + adjuntos Storage UUID · obra/carpetaStore.ts + toolStates
│   ├── carpetaDigitalData.ts          → Catálogo MOP (CARPETA_CONTRATOS / CDFolder) que consume CarpetaDigitalView
│   │  ── Administrativos / Biblioteca ──
│   ├── PropuestaView.tsx              → 'propuesta' (free): propuesta de honorarios por etapas
│   ├── CalculadoraHonorariosView.tsx  → 'hsa' (free): boleta bruto/líquido, retención editable
│   ├── GeneradorContratosView.tsx     → 'contratos' (free): plantillas paramétricas de contratos
│   ├── BibliotecaView.tsx             → 'form-municipales' (free): formularios MINVU (PDF en public/Biblioteca/) en acordeón por tipología
│   ├── CalculadoraArquitectonica.tsx  → Calculadora con mapa (variante de geolocalización/cálculo)
│   ├── terrenoStore.ts                → Persistencia compartida del terreno (polígono+área): Premium → projects/{pid}/toolData/terreno; espeja a localStorage
│   │  ── Subcarpetas de soporte ──
│   ├── construccion/{activaSi.ts, meta.ts, catalogo.eett.ts, catalogo.presupuesto.ts, catalogo.gantt.ts, construccion.css}
│   │                                  → Catálogos generados desde .md (build-catalogos-construccion.mjs) + evaluador AND/OR de activación + estilos cx-*
│   ├── forms/fillForm.ts              → Motor de llenado híbrido pdf-lib (AcroForm nativo + fallback por coordenadas) para FormulariosDOMView
│   ├── obra/{libroStore.ts, carpetaStore.ts, storageUpload.ts}
│   │                                  → Stores doc-por-folio/archivo (cloud granular + paginación + local + migración) + subida real a Storage (UUID)
│   └── termico/{tablas.ts, engine.ts} → Tablas oficiales RT (Art. 4.1.10 OGUC, DS N°15) + motor puro (Rt=Rs+Σe/λ, U, veredicto CUMPLE/NO CUMPLE)
│
├── views/                   → VISTAS de página (montadas por el router)
│   ├── HomeView.tsx          → "/" Archiblocks (Landing): Hero o grilla Mis Proyectos + Top Tools + catálogo
│   ├── WorkspaceView.tsx     → "/p/:projectId" — BinderFicha + ToolCatalog + ToolHost (auto-focus de carpeta)
│   ├── LibroLandingView.tsx  → "/" Libro de Obra Digital (landing del producto; reusa useProjects)
│   ├── LibroWorkspaceView.tsx→ "/o/:projectId" — workspace LDO 3-col; lee ?m= para preseleccionar módulo
│   ├── AdminDashboard.tsx    → "/admin" (requireAdmin) — gestión de usuarios + ranking Top Tools
│   ├── PricingView.tsx       → "/pricing" — paywall (también inline al abrir tool premium)
│   ├── AuthModal.tsx         → Overlay de login/registro (Email/Password + Google)
│   ├── ShareProjectModal.tsx → Modal de colaboración (invitar/enlace/revocar) sobre members{}
│   ├── LegalView.tsx         → "/legal/:doc" — términos / privacidad
│   ├── NotFoundView.tsx      → "*" — 404
│   └── LibroLanding.css · LibroWorkspace.css → estilos propios del producto LDO
│
├── hooks/
│   └── useDimensionadorSync.ts → Sync §6: escribe superficieCalculada + superficieOrigen al ProjectMaster
│
├── utils/
│   └── geoUtils.ts           → Utilidades geo + generarLlaveMaestra({comuna}_{zona})
│
└── workers/
    ├── geo.worker.ts         → Cerebro Espacial: aísla Turf.js (ops 'intersect' y 'area')
    └── termico.worker.ts     → Cerebro Térmico: ejecuta termico/engine (U + acreditación RT)
```

> Nota: `useToolData` (hook estándar de persistencia por herramienta) vive junto al núcleo; varias herramientas lo usan para `projects/{pid}/toolData/{toolId}` (⟲ 2026-06-30: **todo usuario logueado**, Free o Premium) con fallback `localStorage ab-<toolId>-${pid}` (**solo invitados/no logueados**). Topes: Free=5 · Premium=50 proyectos.

---

## 4. Catálogo de herramientas (carpetas 0–7)

Carpetas (`FOLDERS`): **0** Ficha del Proyecto · **1** Información del Proyecto · **2** Terreno · **3** Proyecto · **4** Expedientes de Permisos · **5** Construcción · **6** Administrativos · **7** Biblioteca de Recursos.

`TOP_TOOLS_DEFAULT = ['dimensionador','geolocalizador','expediente-dom','hsa']`.

| Carpeta · Subsección | Herramienta (`id`) | Estado | Tier |
|---|---|---|---|
| 1 | Datos del Proyecto (`datos-proyecto`) · Participantes (`participantes`) | active | free |
| 2 | Ubicación (`ubicacion`) · Geolocalizador Normativo (`geolocalizador`) · Cabida (`volumen`) | active | free |
| 3 · Dimensionadores | Dimensionador (`dimensionador`) · Dim. Edificios Públicos (`dim-publicos`) | active | free |
| 3 · BIM | Asistente de Usos BIM (`bim-wizard`) | active | premium |
| 3 · BIM | Creador de Familias BIM (`bim-familias`) · ISO 19650 (`iso19650`) | soon | premium |
| 4 · Expediente DOM | Listado de Documentos (`listado-dom`) · Declaración Jurada (`expediente-dom`) · Calc. Costos MINVU (`calc-minvu`) · Carga de Ocupación (`carga-ocupacion`) · Cuadro de Superficies (`cuadro-superficies`) | active | free |
| 4 · Expediente DOM (formularios DOM llenables, `FormulariosDOMView`) | Anteproyecto (`solicitud-permiso`) · Permiso de Edificación (`permiso-edificacion`) · Modificación (`modificacion-proyecto`) · DJ de Término (`dj-termino`) · Recepción Definitiva (`recepcion-final`) | active | free |
| 4 · Expediente DOM | Formulario INE (`form-ine`) | soon | free |
| 4 · Informes especiales | Ruta Accesible (`accesibilidad`) · Informe de Subsuelo (`informe-suelo`) | active | free |
| 4 · Informes especiales | Informe Norma Térmica (`informe-termico`) | active | premium |
| 4 · Informes especiales | Resistencia al Fuego (`informe-fuego`) | soon | free |
| 4 · Expedientes Sectoriales | Autorización Sanitaria (`autorizacion-sanitaria`) · DS 594 (`ds594`) | soon | free |
| 4 · Repositorio de antecedentes | Repositorio (`repositorio-antecedentes`) | soon | free |
| 5 · EETT, Presupuesto y Carta Gantt | Generador de EETT (`eett-generador`) · Presupuesto de Obra (`presupuesto`) · Carta Gantt (`gantt`) | active | free |
| 5 · Seguimiento e ITO | Minuta de Visita a Obra (`seguimiento`) · Revisión de Estados de Pago (`estados-pago`) | active | free |
| 5 · Seguimiento e ITO | Libro de Obras Digital (`libro-obras`) · Carpeta Digital (`carpeta-digital`) | active | premium |
| 5 · Seguimiento e ITO | Registro RDI (`rdi`) | soon | free |
| 6 | Propuesta de Servicios (`propuesta`) · Calculadora de Honorarios (`hsa`) · Generador de Contratos (`contratos`) | active | free |
| 6 | Generador de Cobros (`cobros`) · Carta de Honorarios (`carta-honorarios`) | soon | free |
| 7 · Formularios oficiales | Formularios MINVU (`form-municipales`) | active | free |
| 7 | Formularios SEREMI (`form-seremi`) · OGUC/LGUC (`oguc`) | soon | free |

> Las entradas `soon` muestran `ProximamenteView` y **no** llevan `component` en `registry.ts`. Las 5 herramientas data-driven de formularios DOM montan **el mismo** `FormulariosDOMView`; el `toolId` define el trámite y el `Tipo de proyecto` del `ProjectMaster` resuelve el PDF.

---

## 5. Archivos clave (ubicación y rol)

| Archivo | Ruta | Qué hace (1 línea) |
|---|---|---|
| **AppShell.tsx** | `src/AppShell.tsx` | Carcasa persistente: `ShellTop` + `<Outlet>` con fade (framer-motion) + `ShellDock`; `isWorkspace` para `/p/:id` y `/o/:id` |
| **main.tsx** | `src/main.tsx` | Entry point: árbol de Providers (Auth→Theme→Project→Toast) + RouterProvider |
| **router.tsx** | `src/core/router.tsx` | Rutas host-aware (`libroChildren` vs `archiblocksChildren`) + guards `requireAuth`/`requireAdmin` |
| **product.ts** | `src/core/product/product.ts` | Producto por hostname (`archiblocks`/`librodeobra`); branding, toolset, unidad, `switchProduct` |
| **registry.ts** | `src/core/registry.ts` | Único lugar con los `import()` de cada tool → code-splitting; arma `REGISTRY`/`getManifest` |
| **catalog.ts** | `src/core/catalog.ts` | `FOLDERS`, `CATALOG[]` (metadata), `TOP_TOOLS_DEFAULT` |
| **types.ts** | `src/core/types.ts` | Contratos: `ProjectMaster` (region/ciudad/toolStates), `CatalogTool` (tiposProyecto), `ToolProps`, `NormativaPRC`, `FormFieldMap`… |
| **useAccess.ts** | `src/core/useAccess.ts` | Gating central: `AccessMode` `edit`/`read`/`locked` |
| **firebase.ts** | `src/core/firebase.ts` | Init Firebase: `db = (default)` (`initializeFirestore`), `auth`, `storage`, `functions` (región `southamerica-west1`) |
| **ProjectRepository.ts** | `src/core/db/ProjectRepository.ts` | Persistencia Cloud(logueado: Free o Premium)/Local(invitado); topes 5/50 |
| **NormativaService.ts** | `src/core/NormativaService.ts` | Cerebro Normativo: DB nombrada `coordenadasnormativas`, llave `{comuna}_{zona}` |
| **geo.worker.ts** | `src/workers/geo.worker.ts` | Web Worker con Turf.js (intersección y área) |
| **termico.worker.ts** | `src/workers/termico.worker.ts` | Web Worker térmico (U + acreditación RT) |
| **archibots.css** | `src/archibots.css` | Estilos globales, 4 temas, layout `.ab-*` |
| **firestore.rules** | `Web/firestore.rules` | Reglas zero-trust DB `(default)`: proyectos + subcolecciones (`toolData/{document=**}`, `libroObras/{document=**}`, `carpetaDigital/{document=**}`, `seguimiento`, `bitacora`…) |
| **storage.rules** | `Web/storage.rules` | Reglas zero-trust **Storage**: `projects/{pid}/obra/**` (adjuntos Obra Digital), miembro lee · editor escribe · ≤25 MB. Deploy: `firebase deploy --only storage` |
| **firestore.coordenadasnormativas.rules** | `Web/firestore.coordenadasnormativas.rules` | Reglas DB nombrada (lectura auth, escritura prohibida) |
| **firestore.indexes.json** | `Web/firestore.indexes.json` | Índices compuestos de `(default)` |
| **firebase.json** | `Web/firebase.json` | Hosting (secundario, sin uso) + Firestore multi-DB (2 targets) + Functions |
| **.firebaserc** | `Web/.firebaserc` | Proyectos: prod/default = `archibots-497423`, dev = `archibots-dev` |
| **functions/src/index.ts** | `Web/functions/` | Cloud Functions: `onProjectDeleted`, `sendInviteEmail`, `sendPremiumInviteEmail`, `apiProxy` (BIM/IA), `setUserState` |
| **scripts/** | `Web/scripts/` | `build-catalogos-construccion.mjs` (.md → catálogos TS), `migrate-projects.mjs`, `seed-normativas.mjs` |
| **public/geo-data/** | servido como CDN | GeoJSON PRC por comuna (`13_PRC_{Comuna}.json`) |
| **public/Biblioteca/** | servido estático | Formularios MINVU en PDF (indexados por `BibliotecaView`) |
| **public/_redirects** | servido estático | `/*  /index.html  200` (reescritura SPA en Cloudflare) |
| **.env.local** | `Web/` | Variables `VITE_*` (Firebase + `VITE_GOOGLE_MAPS_API_KEY`). NUNCA se versiona |

---

## 6. Flujos esenciales (orientación rápida)

- **Resolución de producto:** al cargar el módulo, `product.ts` lee `hostname` (u `?product=`) → fija `PRODUCT`/`isLibroDeObra` → `router.tsx` elige el árbol de rutas y `ShellTop`/`ArchiblocksNav` el branding y la escena del Block. Cambiar de producto usa `switchProduct` (recarga completa: el producto se resuelve una sola vez por carga).
- **Montaje de una herramienta (Archiblocks):** `/p/:projectId/m/:toolId` → `WorkspaceView` → `ToolHost` resuelve `getManifest(toolId)` → `useAccess` (locked→`PricingView`) → monta el `component` lazy en `<Suspense>` + `ToolErrorBoundary`.
- **Workspace LDO:** `/o/:projectId` → `LibroWorkspaceView` (3-col) lee `?m=` para preseleccionar módulo (db→Carpeta Digital, libro→Libro de Obras); los nodos del Block reducido son accesos directos.
- **Coreografía espacial ("Dos Cerebros"):** `GeolocalizadorView` → `GeoJsonService` (CDN+IndexedDB) → `geo.worker` (Turf `intersect`) → `NormativaService` (DB `coordenadasnormativas`) → ficha PRC.
- **Acreditación térmica:** `InformesTermicosView` → `termico.worker` ejecuta `termico/engine` contra `termico/tablas` (Tabla 1 RT) → veredicto CUMPLE/NO CUMPLE.
- **Persistencia de datos de tool:** master ligero en `ProjectRepository`; datos propios vía `useToolData` → `projects/{pid}/toolData/{toolId}` (Premium, regla glob) o `localStorage` (Free). **Obra Digital** usa **doc-por-folio/archivo** (`libroObras/state/folios/{id}`, `carpetaDigital/state/archivos/{id}`, counters Año→Mes, paginación) + **adjuntos reales en Storage** (`projects/{pid}/obra/{libro|carpeta}/{uuid}`). **Terreno** (polígono/área) vía `terrenoStore` (Premium → `toolData/terreno`, espejo local). Al guardar, cada tool actualiza `ProjectMaster.toolStates[toolId] = {estado, fecha}`.
- **Formularios DOM:** `FormulariosDOMView` pinta el PDF de fondo + inputs por coordenadas, prellena desde el master + Arquitecto, y exporta con `forms/fillForm.ts` (pdf-lib lazy) a descarga y al expediente/Storage.
- **Construcción (EETT/Presupuesto/Gantt):** se editan los catálogos `.md` en `DESARROLLO/EETT y Presupuesto/`, se corre `scripts/build-catalogos-construccion.mjs` y se regeneran `construccion/catalogo.*.ts`. Las 3 herramientas comparten la misma selección guiada; el Presupuesto trae valor UF en vivo de mindicador.cl.
- **Mapas:** SDK cargado en runtime vía `@googlemaps/js-api-loader` leyendo `VITE_GOOGLE_MAPS_API_KEY`; si falta, degrada a ingreso manual.

---

## 7. Despliegue (resumen; detalle en `GUIA_GITHUB_Y_DEPLOY.md`)

- **Frontend → Cloudflare Pages** (proyecto `projectbook`, conectado a `goyogramadors/projectbook`, rama `main`). **Publicar = `git push`** desde la raíz `C:\G\Archiblocks`; cada push dispara `npm run build` (Root `Web`, Output `dist`) y publica. Dominios: `archibots.cl` + `projectbook-8qt.pages.dev`.
- **Backend → Firebase** (`archibots-497423`): `firebase deploy --only functions|firestore:rules|firestore:indexes|storage` desde `C:\G\Archiblocks\Web`.
- ⚠️ **Firebase Hosting NO se usa** (existe en `firebase.json` y la URL `archibots-497423.web.app`, pero es secundaria). No publica el sitio real.

---

## 8. Documentos hermanos (DESARROLLO)

- **`Iniciar Aquí.md`** (raíz) — memoria de arranque del proyecto.
- **`Last Update.md`** (raíz) — bitácora cronológica (fuente del estado real más reciente).
- **`PROMPT_MAESTRO_HERRAMIENTA.md`** — plantilla/patrón para crear nuevas herramientas (v1.1).
- **`GUIA_GITHUB_Y_DEPLOY.md`** — versionado + despliegue backend/frontend.
- **`GUIA_DOMINIO_LibroDeObra.md`** — cómo publicar el producto LDO en su dominio propio `librodeobra.cl` (host-aware, sin cambios de código).
- **`Antiguos u Obsoletos/`** — documentos superados (planes de migración ya ejecutados, reporte de mockups, auditoría 2026-06-17, el antiguo Tintero y `PLAN-LibroDeObraDigital.md`). Conservados por trazabilidad; **no usar como referencia de estado actual**.

> 📌 **Pendientes vigentes:** ya no viven en un Tintero aparte. Se consolidaron en `Last Update.md` (entrada 2026-06-26 15:04) para evitar duplicación.
```
