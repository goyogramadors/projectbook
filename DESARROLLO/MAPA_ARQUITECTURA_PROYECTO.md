# 🗺️ MAPA DE ARQUITECTURA — Archibots SPA

> **Índice estructural definitivo del proyecto.** Generado el 2026-06-16 para servir de mapa de referencia en futuras sesiones y evitar re-explorar el árbol a ciegas.
> **Raíz productiva (equipo actual):** `E:\2CLAUDE\ProjectBook\Web`  _(renombrada desde `E:\2CLAUDE\Archibots` el 2026-06-22)_
> Cualquier referencia antigua a `E:\2CLAUDE\Archibots\` o `C:\Users\...\Desktop\Archibots\` está **obsoleta**.

> **⟲ ACTUALIZACIÓN 2026-06-17 — Nuevos archivos / rutas (no romper este índice).**
> - **`src/components/DocumentExportWrapper.tsx`** — lámina imprimible "Hoja de papel
>   Word" (membrete + firma), desvinculada del tema; usada por el split-screen de las
>   herramientas y por `@media print` de `archibots.css`.
> - **`src/tools/`** — 4 herramientas nuevas activas: `CuadroSuperficiesView` (id
>   `cuadro-superficies`), `CalculadoraCargaOcupacionView` (`carga-ocupacion`),
>   `ListadoDocumentosView` (`listado-dom`), `EmisorEstadoPagoView` (`estados-pago`);
>   registradas en `registry.ts` y en `catalog.ts` (estado `active`).
> - **`src/views/LayoutTestView.tsx`** — maqueta del nuevo **Workspace 3-col** (ruta
>   STANDALONE `/test`, fuera del `AppShell`).
> - **`src/views/HomeTestView.tsx`** — maqueta de la nueva **Landing** (ruta STANDALONE
>   `/test-inicio`). Ambas son referencia para el **SPRINT S7** (ver Plan de Acción v1.7).
> - **`src/core/router.tsx`** — añadidas las rutas standalone `/test` y `/test-inicio`.
> - **`functions/src/index.ts`** — nueva callable `sendPremiumInviteEmail` (SendGrid).
> - **Split-screen (Workspace/Preview)** aplicado a 14 herramientas; exclusiones:
>   Geolocalizador, MapaTerreno, Ubicación, ExpedienteMunicipal, GeneradorContratos,
>   Biblioteca (no llevan wrapper).

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | **React 19** + **framer-motion** (animaciones) + **lucide-react** (íconos) |
| Build / dev | **Vite 6** (`npm run dev` · `npm run build` = `tsc -b && vite build`) |
| Lenguaje | **TypeScript** (estricto; `import type` obligatorio para Vite/oxc) |
| Estilos | CSS propio `src/archibots.css` (tokens shadcn + **4 temas**); Tailwind base-only (sin compiler) |
| Backend | **Firebase 12** — Auth, Firestore **multi-DB** (`(default)` + `coordenadasnormativas`), Storage, Cloud Functions |
| Routing | **react-router-dom v7** (`createBrowserRouter`) |
| Geo | **@turf/turf** (cálculo espacial, aislado en **Web Worker**) + **@googlemaps/js-api-loader** (carga runtime del SDK) |
| Patrón clave | **Lazy Loading total**: cada herramienta es `React.lazy(() => import())` en `registry.ts` → un chunk por tool, bundle inicial mínimo |
| Patrón clave | **"Dos Cerebros"**: Cerebro Espacial (Turf en Worker) + Cerebro Normativo (DB `coordenadasnormativas`), desacoplados |

---

## 2. Árbol de carpetas productivo (`src/`)

```
src/
├── main.tsx                 → Entry point: árbol de Providers + RouterProvider + AuthModal overlay
├── AppShell.tsx             → Carcasa maestra persistente (header, statusbar, <Outlet>, footer, TopToolsBar)
├── archibots.css            → Estilos globales: tokens shadcn, 4 temas, clases .ab-*
├── vite-env.d.ts            → Tipos de entorno Vite
│
├── core/                    → NÚCLEO: lógica de negocio, datos, auth, routing
│   ├── firebase.ts          → Inicialización Firebase (app, auth, db, storage) desde import.meta.env
│   ├── router.tsx           → createBrowserRouter + guards requireAuth/requireAdmin (rutas lazy)
│   ├── types.ts             → Tipos canónicos: ProjectMaster, CatalogTool, ToolProps, Etapa, NormativaPRC…
│   ├── catalog.ts           → Metadata de presentación: FOLDERS, CATALOG[], TOP_TOOLS_DEFAULT (NO implementa tools)
│   ├── registry.ts          → REGISTRO: une catalog + componente lazy (LAZY_COMPONENTS) → ToolManifest
│   ├── useAccess.ts         → Gating: deriva AccessMode 'edit'|'read'|'locked' (fuente única de verdad del paywall)
│   ├── useCerebroNormativo.ts → Hook legacy de intersección punto↔PRC + ficha (variante in-hook de la coreografía)
│   ├── data-chile.ts        → Datos estáticos de Chile (regiones / comunas)
│   ├── geoUtils.ts          → Utilidades geográficas (core)
│   ├── AdminService.ts      → Admin: listUsers / setUserState / setCompPremium (imports estáticos)
│   ├── ShareService.ts      → Colaboración: inviteByEmail / revokeAccess / generateShareLink / listMembers (members{})
│   ├── GeoJsonService.ts    → Carga GeoJSON PRC desde CDN /geo-data/ + caché memoria/IndexedDB (CONST §8)
│   ├── NormativaService.ts  → Cerebro Normativo: ficha desde DB nombrada coordenadasnormativas (llave {comuna}_{zona})
│   ├── auth/AuthProvider.tsx     → Contexto de usuario + openAuthModal(); plan Free/Premium; admin claim
│   ├── db/ProjectProvider.tsx    → Contexto de proyectos: list/get/addTool/removeTool + sandbox automático
│   ├── db/ProjectRepository.ts   → Estrategia Cloud(Premium)/Local(Free) · makeDefaultProject · DEFAULT_PROJECT_ID
│   ├── theme/ThemeProvider.tsx   → 4 temas; persiste users.theme
│   └── ui/ToastProvider.tsx      → Toasts globales (triggerToast)
│
├── components/              → CARCASA y UI de soporte (bloques estructurales del shell)
│   ├── BinderFicha.tsx      → Bloque 3a: archivador (pestañas 0-7) + Ficha + avance + "Otros proyectos"
│   ├── ToolCatalog.tsx      → Bloque 3b: catálogo lateral de herramientas (agregar/quitar de carpeta)
│   ├── ToolHost.tsx         → Bloque 4: resuelve manifest por toolId, aplica gating, monta tool en <Suspense>
│   ├── ToolErrorBoundary.tsx→ Error Boundary de clase: aísla fallos de una tool sin tumbar la SPA
│   ├── ProximamenteView.tsx → Placeholder para herramientas en estado 'soon'
│   ├── TopToolsBar.tsx      → Bloque 6: barra inferior sticky de accesos rápidos (lee config/topTools)
│   ├── ModuleHeader.tsx     → Bloque 1: cabecera + logo (img public/Logo-Archibots.png) → link a Home
│   ├── StatusBar.tsx        → Bloque 2: path + usuario + badge de plan + tema + compartir
│   ├── CorporateFooter.tsx  → Bloque 5: meta-grid + feedback + legal
│   ├── Icon.tsx             → Wrapper de lucide-react por nombre
│   └── CalculadoraTest.tsx  → Componente de prueba/aislado
│
├── tools/                   → HERRAMIENTAS (1 archivo por tool; todas montadas vía registry → lazy)
│   ├── DatosProyectoView.tsx          → T-04: nombre, etapa, destino, tipo y superficies (Datos Clave)
│   ├── ParticipantesView.tsx          → T-03: nómina (Arquitecto/Propietario fijos + roles + dirección); persistencia dual
│   ├── UbicacionView.tsx              → T-04b: ubicación administrativa (región/comuna/dirección/rol)
│   ├── GeolocalizadorView.tsx         → T-07: Maps + polígono + Worker (Turf) + ficha PRC ("Dos Cerebros")
│   ├── MapaTerrenoView.tsx            → T-08: dibujo de polígono + área (Worker) + sync superficie §6
│   ├── VolumenTeoricoView.tsx         → T-09 "Cabida": estudio de cabida volumétrica (id 'volumen')
│   ├── DimensionadorView.tsx          → T-14: programa de recintos + % circulación + sync master
│   ├── DimensionadorPublicosView.tsx  → T-15: programa institucional MDSF 2024
│   ├── BimWizardView.tsx              → T-17 (PREMIUM): asistente de usos BIM (guarda access==='locked')
│   ├── ExpedienteMunicipalView.tsx    → T-24: formularios DOM (DJ 1.2.2, F 2-3.1, INE) + PDF
│   ├── CalculadoraConstruccionesMinvuView.tsx → T-41: costos MINVU por volumen
│   ├── SeguimientoObrasView.tsx       → T-43: avance, etapa y bitácora de obra
│   ├── PropuestaView.tsx              → T-05: propuesta de honorarios por etapas
│   ├── CalculadoraHonorariosView.tsx  → T-06 (hsa): boleta bruto/líquido, retención editable
│   ├── GeneradorContratosView.tsx     → T-45: plantillas paramétricas de contratos
│   ├── BibliotecaView.tsx             → Biblioteca de Recursos: formularios MINVU (PDF en public/Biblioteca/) en acordeón por tipología (id 'form-municipales')
│   └── CalculadoraArquitectonica.tsx  → Calculadora con mapa (variante de geolocalización/cálculo)
│
├── views/                   → VISTAS de página (montadas por el router)
│   ├── HomeView.tsx          → "/" (Landing) — Hero (usuario nuevo) o grilla Mis Proyectos + Top Tools + catálogo (sin auto-redirección al sandbox)
│   ├── WorkspaceView.tsx     → "/p/:projectId" — compone BinderFicha + ToolCatalog + ToolHost (auto-focus de carpeta)
│   ├── AdminDashboard.tsx    → "/admin" (requireAdmin) — gestión de usuarios + ranking Top Tools
│   ├── PricingView.tsx       → "/pricing" — paywall 3 niveles (también inline al abrir tool premium)
│   ├── AuthModal.tsx         → Overlay de login/registro (Email/Password + Google), invocable
│   ├── ShareProjectModal.tsx → Modal de colaboración (invitar/enlace/revocar) sobre members{}
│   ├── LegalView.tsx         → "/legal/:doc" — términos / privacidad
│   └── NotFoundView.tsx      → "*" — 404
│
├── hooks/
│   └── useDimensionadorSync.ts → Sync §6: escribe superficieCalculada + superficieOrigen al ProjectMaster
│
├── utils/
│   └── geoUtils.ts           → Utilidades geo + generarLlaveMaestra({comuna}_{zona})
│
└── workers/
    └── geo.worker.ts         → Cerebro Espacial: Web Worker que aísla Turf.js (ops 'intersect' y 'area')
```

---

## 3. Archivos clave (ubicación exacta y rol)

| Archivo | Ruta | Qué hace (1 línea) |
|---|---|---|
| **AppShell.tsx** | `src/AppShell.tsx` | Carcasa persistente que orquesta los 6 bloques del layout y el `<Outlet>` |
| **main.tsx** | `src/main.tsx` | Entry point: árbol de Providers (Auth→Theme→Project→Toast) + RouterProvider |
| **router.tsx** | `src/core/router.tsx` | Define todas las rutas con lazy + guards `requireAuth`/`requireAdmin` |
| **registry.ts** | `src/core/registry.ts` | Único lugar con los `import()` de cada tool → code-splitting; arma `REGISTRY` y `getManifest()` |
| **catalog.ts** | `src/core/catalog.ts` | `FOLDERS`, `CATALOG[]` (metadata), `TOP_TOOLS_DEFAULT` |
| **types.ts** | `src/core/types.ts` | Contratos: `ProjectMaster`, `CatalogTool`, `ToolProps`, `CarpetaId`, `NormativaPRC`… |
| **useAccess.ts** | `src/core/useAccess.ts` | Gating central: `AccessMode` `edit`/`read`/`locked` (lo consume `ToolHost`) |
| **firebase.ts** | `src/core/firebase.ts` | Init de Firebase desde `import.meta.env.VITE_FIREBASE_*` |
| **ProjectRepository.ts** | `src/core/db/ProjectRepository.ts` | Persistencia Cloud(Premium)/Local(Free); sin migración (CONST §7) |
| **geo.worker.ts** | `src/workers/geo.worker.ts` | Web Worker con Turf.js (intersección y área) |
| **archibots.css** | `src/archibots.css` | Estilos globales, 4 temas, layout `.ab-*` (full-width desde v2.0) |
| **firestore.rules** | `/firestore.rules` | Reglas zero-trust DB `(default)` (proyectos + subcolecciones) |
| **firestore.coordenadasnormativas.rules** | `/firestore.coordenadasnormativas.rules` | Reglas DB nombrada `coordenadasnormativas` (lectura auth, escritura prohibida) |
| **firebase.json** | `/firebase.json` | Hosting + multi-DB (`firestore[]` con 2 targets) + functions |
| **.env / .env.local** | `/` | Variables `VITE_*` (Firebase). ⚠️ **`.env.local` debe incluir `VITE_GOOGLE_MAPS_API_KEY`** (ver `.env.local.example`) |
| **vite.config.ts** | `/vite.config.ts` | Config Vite (plugin react, alias `@`, dev server :5173) |
| **functions/** | `/functions/` | Cloud Functions (apiProxy BIM, onProjectDeleted, claims…) |
| **public/geo-data/** | servido como CDN | GeoJSON PRC por comuna (`13_PRC_{Comuna}.json`) |
| **public/Biblioteca/** | servido estático | Formularios MINVU en PDF (Obra Nueva, Ampliación, Alteración, Reconstrucción, Reparación, OGUC). Indexados por `BibliotecaView` → enlaces `/Biblioteca/*.pdf` |
| **public/Logo-Archibots.png** | servido estático | Logo principal usado por `ModuleHeader` (`<img>`, unificado para los 4 temas) |

---

## 4. Flujos esenciales (para orientación rápida)

- **Montaje de una herramienta:** URL `/p/:projectId/m/:toolId` → `WorkspaceView` → `ToolHost` resuelve `getManifest(toolId)` → aplica `useAccess` (locked→`PricingView`) → monta el `component` lazy dentro de `<Suspense>` y `ToolErrorBoundary`.
- **Agregar herramienta al proyecto:** `ToolCatalog.onAdd` → `addTool` (ProjectProvider, persiste `addedTools`) → `WorkspaceView` hace **auto-focus** abriendo la carpeta del tool en `BinderFicha`.
- **Coreografía espacial ("Dos Cerebros"):** `GeolocalizadorView` → `GeoJsonService` (CDN+IndexedDB) → `geo.worker` (Turf `intersect`) → `NormativaService` (DB `coordenadasnormativas`) → ficha PRC.
- **Persistencia de datos de tool:** master ligero (<5 KB) en `ProjectRepository`; datos propios de cada tool en subcolección Firestore (Premium) o `localStorage` `ab-<toolId>-${projectId}` (Free).
- **Mapas:** SDK cargado en runtime vía `@googlemaps/js-api-loader` leyendo `VITE_GOOGLE_MAPS_API_KEY`; si falta, las vistas degradan a ingreso manual.
