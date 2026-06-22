# _ARCHIBOTS — Plan de Acción Maestro de Producción (WBS)
**Work Breakdown Structure · Migración Micro-Frontends → SPA Unificada · v1.7 · 2026-06-17**

> **⟲ CAMBIO v1.7 (2026-06-17) — Nuevo LAYOUT aprobado (maquetas) + SPRINT S7 de migración.**
>
> Se aprobaron dos maquetas de rediseño (rutas STANDALONE de prueba, con datos mock,
> responsivas a los 4 temas): **`/test`** (`src/views/LayoutTestView.tsx`) = nuevo
> **Workspace de 3 columnas**, y **`/test-inicio`** (`src/views/HomeTestView.tsx`) =
> nueva **Landing**. Acceso temporal vía dos botones en `HomeView`. Estas maquetas
> son la **referencia visual** para migrar las páginas reales.
>
> **Forma del nuevo layout (a portar):**
> - **Top unificado** de alto contraste (color `--bar`): controles a la IZQUIERDA
>   (Inicio · selector de proyecto · SYSTEM_OK · usuario · tema, todos juntos) y la
>   **marca (_Archibots + subtítulo) + logo a la DERECHA**, ocupando el alto completo.
> - **Workspace = 3 columnas:** (1) Proyecto en trabajo = Binder con 8 pestañas
>   (0–7), donde solo aparecen las herramientas AGREGADAS, cada una con etiqueta de
>   estado (Vacío/En proceso/Completado), fecha de último guardado, **Abrir** y
>   **papelera con confirmación**; abajo "Mis Proyectos" en fila, pegado al fondo.
>   (2) Catálogo angosto con selector Ver-por (Carpeta/Fase/Top) y acordeón que
>   colapsa lo no usado. (3) Área dinámica de trabajo a alto completo, con **barra
>   inferior de contraste** (estado circular + Guardar Ficha + Exportar PDF). Bajo
>   las columnas 1–2, **"Avance del Expediente"** libre (solo herramientas agregadas,
>   completadas en verde), con su base alineada a la columna 3.
> - **Landing:** hero **"¿Cómo funciona?"** + Mis Proyectos; **"Explorar herramientas"**
>   enciende (fade ~2 s) el catálogo (col 2) + un área de exploración (col 3, sin
>   barra de acciones). Top Tools debajo de Mis Proyectos.
> - **Footer dock** ancho completo (Top Tools · proyecto/inicio/tema · feedback · legal).
>
> ────────────────────────────────────────────────────────────────────────────
> ### SPRINT S7 · Migración de las páginas reales a los nuevos Layouts
> **Objetivo (DoD):** `AppShell`, `HomeView` y `WorkspaceView` adoptan el nuevo layout
> aprobado; navegación con fade in/out; las **mini-páginas mantienen su diseño actual**.
>
> - **S7.0 · Consolidar CSS (base).** Llevar las clases de las maquetas (`lt-*`/`ht-*`)
>   a `archibots.css` con nombres definitivos (p. ej. `ab-top`, `ab-brand`, `ab-split`,
>   `ab-work`, `ab-avance`, `ab-dock`). Unificar el "top" de alto contraste, el footer
>   dock y el split-screen. *(Bloquea S7.1–S7.2.)*
> - **S7.1 · Workspace (base `LayoutTestView`).** Reescribir `AppShell` (top unificado)
>   y `WorkspaceView` a 3 columnas: col1 `BinderFicha` (8 pestañas; herramientas
>   AGREGADAS con estado+fecha+Abrir+papelera-confirma) + "Mis Proyectos" en fila al
>   fondo; col2 `ToolCatalog` (selector + acordeón colapsable); col3 `ToolHost` (área
>   dinámica + barra inferior de contraste con estado/Guardar/Exportar; en modo
>   "explorar" sin botones). "Avance del Expediente" libre bajo col1-2 (solo agregadas,
>   completadas en verde). **Cero regresión** en persistencia Firebase/local.
> - **S7.2 · Landing (base `HomeTestView`).** Reescribir `HomeView`: hero "¿Cómo
>   funciona?" + Mis Proyectos (pegados abajo) + "Explorar herramientas" (fade 2 s) que
>   enciende catálogo (col2, solo **Explorar/Abrir**, sin "Agregar") + área de
>   exploración (col3). Conserva el modal real de "Nuevo Proyecto" y la creación ya
>   cableada (`createProject`).
> - **S7.3 · Transiciones de navegación (fade in/out).** Envolver el `<Outlet>` del
>   `AppShell` con `AnimatePresence` + `motion` (framer-motion, ya en el stack), fade
>   ~250–350 ms por cambio de ruta. Respetar `prefers-reduced-motion`.
> - **S7.4 · Exclusiones (mini-páginas SIN rediseño).** `AuthModal` (login/registro),
>   `PricingView` (precios), `LegalView` (términos/privacidad) y `NotFoundView`
>   **conservan su diseño actual**; solo heredan el fade de navegación las que son ruta.
> - **S7.5 · Limpieza y QA.** Quitar las rutas `/test` y `/test-inicio` y sus botones en
>   `HomeView`. QA en los 4 temas, responsive y la impresión PDF (`DocumentExportWrapper`).
>   **Gate:** sign-off visual por tema.
> ────────────────────────────────────────────────────────────────────────────

> **⟲ CAMBIO v1.6 (2026-06-17) — Últimos ajustes de producción: herramientas, exportación, UX y fixes.**
>
> **A · Herramientas a producción (catálogo `'soon'` → `'active'`).** Refactorizados 4 prototipos del equipo a vistas oficiales en `src/tools/`, conectadas a `useProjects`/`useToast` + `ToolProps` y con persistencia local (`ab-<id>-${projectId}`): `CuadroSuperficiesView` (id `cuadro-superficies`, T-26), `CalculadoraCargaOcupacionView` (`carga-ocupacion`, T-27), `ListadoDocumentosView` (`listado-dom`, T-25) y `EmisorEstadoPagoView` (`estados-pago`, T-44). Registradas en `registry.ts` (`LAZY_COMPONENTS`) y activadas en `catalog.ts`.
>
> **B · Exportación a PDF + Split-Screen.** Nuevo `components/DocumentExportWrapper.tsx`: lámina imprimible estilo "Hoja de papel Word", **desvinculada del tema** (colores HARD blanco/negro, sin border-radius ni monospace heredados; sin marco exterior) basada en `Ficha de Proyecto.docx`. Layout **Split-Screen** (`.ab-split`: izquierda workspace / derecha preview read-only + `[ EXPORTAR A PDF ]` → `window.print()`) aplicado a **14 herramientas**: Dimensionador, CuadroSuperficies, CargaOcupación, ListadoDocumentos, EmisorEstadoPago, DatosProyecto, Participantes, Propuesta, Honorarios, VolumenTeórico, MINVU, SeguimientoObras, DimensionadorPúblicos y CalculadoraArquitectónica. `@media print` oculta el layout web y deja la lámina A4 al 100%. **Excluidas estrictamente** (sin wrapper): Geolocalizador, MapaTerreno, Ubicación, ExpedienteMunicipal (DJ/formularios DOM), GeneradorContratos, Biblioteca.
>
> **C · UI/UX.** Logo oficial `Logo-Archibots.png` unificado (Home/Header) y escalado +50%. Bordes biselados re-implementados con técnica "cuadrado rotado máscara" (pixel-perfect en los 4 temas, sin `clip-path`). Barra inferior (`TopToolsBar`) con contraste por tema (CAD oscuro / Matrix claro; Washi/White intactos). Footer de metadatos reposicionado **debajo** de la TopToolsBar en un dock fijo al borde inferior (`.ab-bottom-dock`).
>
> **D · Conexiones reales.** `[ + NUEVO PROYECTO ]` conectado a `ProjectProvider.createProject()` (Cloud/Local) con **modal de la página** (sin `window.prompt`) y redirección a `/p/:id`. Panel Admin: `[ ASCENDERME A PREMIUM ]` (`AdminService.setUserPlan` → reload contexto) e invitación que eleva a Premium en Firestore (`promoteByEmail`). `StatusBar`: el badge de plan abre un **menú de cuenta** (info + planes + **cerrar sesión**), ya no salta directo al paywall.
>
> **E · Prompt Maestro.** `PROMPT_MAESTRO_HERRAMIENTA.md` §9.2 corregido: eliminadas las clases irreales (`ab-tool-root`, `ab-card`, `ab-btn-primary`, `ab-input`); documentadas las reales (`tool-panel`, `module-header`, `panel-content`, `tech-input`, `tech-select`, `technical-btn`, `btn-tech-gray`, `tech-table`, `ab-badge`, `ab-form-grid`).
>
> **Pendiente ejecutar (HITL):**
> - **Emails de invitación:** nueva Cloud Function `sendPremiumInviteEmail` (SendGrid) creada en `functions/src/index.ts` y cliente cableado (`firebase.ts` exporta `functions`; `AdminDashboard` la invoca). **NO se envían correos hasta:** `firebase functions:secrets:set SENDGRID_API_KEY` + `cd functions && npm run build && cd .. && firebase deploy --only functions`. Hasta entonces el premium se aplica pero la UI avisa "el correo NO se envió".
> - **Google Maps (Geolocalizador / MapaTerreno / CalcArquitectónica):** el código es correcto (lee `VITE_GOOGLE_MAPS_API_KEY`, usa `importLibrary` v2) y la clave existe. El fallo es de consola: habilitar **"Maps JavaScript API"**, activar **facturación** y permitir **localhost:5173** + dominio en las restricciones de la clave. Se añadió surface del error real + `gm_authFailure` para diagnóstico.
> - **Build de verificación:** correr `npm run build` en Windows (el sandbox no compila de forma fiable por el montaje de archivos).
>
> **Archivos tocados:** `src/tools/{CuadroSuperficies,CalculadoraCargaOcupacion,ListadoDocumentos,EmisorEstadoPago,Dimensionador,DatosProyecto,Participantes,Propuesta,CalculadoraHonorarios,VolumenTeorico,CalculadoraConstruccionesMinvu,SeguimientoObras,DimensionadorPublicos,CalculadoraArquitectonica}.tsx`, `components/DocumentExportWrapper.tsx`, `components/StatusBar.tsx`, `views/{HomeView,AdminDashboard}.tsx`, `core/{registry,catalog,firebase,AdminService}.ts`, `core/db/ProjectProvider.tsx`, `tools/{Geolocalizador,MapaTerreno}View.tsx`, `archibots.css`, `AppShell.tsx`, `functions/src/index.ts`, `PROMPT_MAESTRO_HERRAMIENTA.md`.

> **⟲ CAMBIO v1.5 (2026-06-14) — Carpeta raíz corregida + F1 completado + Auth UX overhaul.**
> - **Carpeta raíz real:** `Archibots/Archibots/` (no `Mockup/mockup-archibots/`). Todos los paths de código se refieren a esta carpeta. El Mockup queda como referencia UX/CSS únicamente.
> - **H-F1.5 ✅** — Custom Claim `admin:true` verificado (goyogramador@gmail.com). **BLOQUE F1 completo.**
> - **Auth UX overhaul ✅** — Eliminado el hard-gate de autenticación. Nuevo flujo: usuarios anónimos acceden libremente al Sandbox (`archibots-sandbox` en localStorage, CONST §7). `AuthModal` se convierte en overlay invocable (`openAuthModal()` en `useAuth()`), no bloqueo de layout. `StatusBar` muestra botón "Iniciar Sesión" para invitados.
> - **Archivos modificados hoy:** `types.ts`, `AuthProvider.tsx`, `main.tsx`, `ProjectRepository.ts`, `ProjectProvider.tsx`, `AuthModal.tsx`, `HomeView.tsx`, `StatusBar.tsx`.
> - **Pendiente ejecutar (HITL):** `firebase deploy --only firestore:rules`, `firebase deploy --only firestore:indexes`, build+deploy functions + secrets SENDGRID_API_KEY y GEMINI_API_KEY.

> **⟲ CAMBIO v1.4 (2026-06-14) — Un solo proyecto + Stripe diferido + Archivos Firebase creados.** Un único proyecto `archibots-497423` durante testing (sin split dev/prod). Stripe `H-F5.2/H-F5.3/H-F5.4` → **⏸ DIFERIDO**. Creados: `firebase.json`, `.firebaserc`, `firestore.indexes.json`, `functions/tsconfig.json`. H-F1.1–H-F1.4 ✅. Nuevo requerimiento: AuthModal (próximo bloque de código).

> **⟲ CAMBIO v1.1 (2026-06-14) — Constitución.** Este WBS adopta las **17 decisiones arquitectónicas irrevocables** (la "Constitución", §0.0) que el equipo directivo cerró sobre `PLAN_REFACTORIZACION_SPA.md` v1.5. Tres impactos operativos respecto de v1.0: **(1)** la carga masiva de los 540 GeoJSON pasa de Storage a **despliegue estático en Firebase Hosting/CDN** (HITL H-F4 reescrito, regla §8); **(2)** F4.1 monta el cálculo de Turf en un **Web Worker** obligatorio (regla §9); **(3)** se elimina el paso de migración `localStorage→Firestore` de F1.4 (regla §7). Las decisiones que en v1.0 eran "recomendaciones por defecto" (§5.2) ahora son **ley cerrada**. Ediciones marcadas **⟲ CONST §N**.

> **⟲ CAMBIO v1.2 (2026-06-14) — Cierre F5.7 + Corrección de estado.** Se registra `F5.7` como completado. Se corrige el estado de F3.2–F3.5 y F4.7: todos estos componentes **ya existen** en el mockup (`src/tools/`) y solo pendían de conexión productiva. Se incorpora la subdivisión en **5 Bloques** de trabajo pendiente (§2.3). Se actualizan §6 y checkpoint.

> **Rol del documento.** Lead Solutions Architect & Technical Project Manager. Este plan operacionaliza la arquitectura objetivo descrita en `PLAN_REFACTORIZACION_SPA.md` (v1.5, la única fuente de la verdad) y la convierte en un cronograma de ejecución por fases, con dependencias bloqueantes explícitas y puntos de control humanos (HITL) en la consola de Firebase/Google Cloud.
>
> **Principio rector.** El Mockup (`Mockup/mockup-archibots/`) ya probó la viabilidad visual y de UX (shell de 6 bloques, 4 temas, paywall, colaboración, panel admin). Producción NO reinventa: extrae el shell a una arquitectura de servicios, sustituye los mocks (`MOCK_USER`, `plan` local, checkout simulado) por infraestructura real (Auth, Firestore multi-DB, Storage, Cloud Functions, Stripe) y migra las 14 herramientas activas + 1 recurso de Biblioteca a code-splitting perezoso.
>
> **Sistema de trabajo.** Lotes cortos + Checkpoints Autónomos. Cada tarea (`Px.y`) es un commit atómico. `claude_checkpoint.md` se actualiza al cerrar cada subtarea para no perder progreso ante límites de tokens.

---

## 0.0 ENTORNOS DE DESPLIEGUE Y CONSTITUCIÓN (BASE INMUTABLE)

### 0.0.1 Un solo proyecto Firebase (fase de testing) ⟲ v1.4
Durante la fase actual de testing se usa **un único proyecto Firebase**:

| Entorno | Proyecto | Estado |
|---|---|---|
| **Testing / Producción** | `archibots-497423` | ✅ Activo — Auth Email/Password + Google habilitados |

**Nota de promoción:** durante testing, toda acción HITL se ejecuta directamente sobre `archibots-497423`. El alias está configurado en `.firebaserc` como `default`. Cuando se requiera separación formal dev/prod se re-introduce este step.

### 0.0.2 La Constitución — 17 reglas irrevocables (resumen operativo)
Estas reglas son la **base inmutable** del WBS. El detalle completo vive en `PLAN_REFACTORIZACION_SPA.md` §0; aquí se listan por su impacto en la ejecución:

| # | Regla (síntesis) | Fase que la implementa |
|---|---|---|
| §1 | 4 temas; tema en `localStorage` + sync async `users.theme` | F2.2 |
| §2 | Top Tools default `dimensionador,geolocalizador,expediente-dom,hsa`; premium con candado→Paywall | F2.6 / H-F2.1 |
| §3 | Badge de Plan **interactivo** → abre `PricingView` | F2 (StatusBar) / F5.3 |
| §4 | Ubicación (admin manual: Rol SII/Región) ≠ Geolocalizador (espacial-normativo) | F3.2 (T-04b) / F4.4 (T-07) |
| §5 | BIM T-17 **activo premium** (archivos existen, sin demo) | F4.7 |
| §6 | Guardar `superficieCalculada` **y** `superficieManual` + enum `superficieOrigen` | F2.3 / F4.6 |
| §7 | Free/Invitado en `localStorage`, **SIN migración** a Firestore; Premium nace en nube | F1.4 |
| §8 | **540 GeoJSON estáticos en Firebase Hosting/CDN** (no Storage) | F4.3 / H-F4.1 |
| §9 | Turf.js **obligatorio en Web Worker** | F4.1 |
| §10 | Roles `'editor'\|'viewer'`; Propietario por `ownerId` | F5.5 |
| §11 | Pase $4.990 permanente por `projectId`; colaboradores Free → **solo lectura** | F5.3/F5.4 |
| §12 | Admin vía Custom Claim `token.admin` | F1.5 / H-F1.5 |
| §13 | Suspensión `disabled:true` vía Admin SDK | F5.2 / F5.6 |
| §14 | Cortesía Premium `users.compPremium=true` (no pisa Stripe) | F5.3/F5.6 |
| §15 | Tope **50** proyectos Premium (frontend + Rules) | F5.1/F5.3 |
| §16 | Feedback: email a admin + respaldo en colección `feedback` | F5.7 |
| §17 | Borradores legales reales `/legal/terminos` y `/legal/privacidad` | F5.7 |

> **Las 8 decisiones que en v1.0 estaban "por defecto" (§5.2) quedan cerradas por esta Constitución.** Ya no son revisables dentro del alcance del proyecto.

---

## 0. RESUMEN EJECUTIVO Y MAPA DE DEPENDENCIAS

### 0.1 Las 5 Fases en una línea cada una

| Fase | Nombre | Objetivo de salida (Definition of Done) | Bloquea a |
|---|---|---|---|
| **F1** | Core & Auth | Monorepo Vite + router operativo + `AuthProvider` real (Firebase Auth) + `ProjectRepository` (Cloud/Local) + shell de 6 bloques vacío | F2, F3, F4, F5 |
| **F2** | Theming & UI Base | Motor de 4 temas (shadcn tokens) + Binder + Catálogo + `<ToolHost>` con `Suspense` + Datos Clave/Ficha + barra de avance | F3 |
| **F3** | Migración de Herramientas Estáticas | 9 herramientas "puras" (sin Maps/Turf) migradas a `React.lazy` + recurso Biblioteca | F4 (parcial) |
| **F4** | Coreografía Espacial-Normativa | "Dos Cerebros": Geolocalizador (Maps + Turf.js + GeoJSON en memoria) + Dimensionador + sync con master + NormativaService | F5 (parcial) |
| **F5** | SaaS, Roles & Seguridad | Stripe (suscripción + pase) + `entitlements` + Compartir (roles/enlace) + AdminDashboard conectado + Rules Zero-Trust + Cloud Functions | — (cierre) |

### 0.2 Cadena de dependencias bloqueantes (vista de alto nivel)

```
F1 ──► F2 ──► F3 ─┐
  │       │        ├──► F4 ──► F5
  └───────┴────────┘
  (Auth + Repo + Router son prerequisito duro de TODO)

HITL bloqueantes que NO dependen de código y deben adelantarse:
  H-F1  Proyecto único archibots-497423 (✅) / Auth ✅ / multi-DB ✅ / .env.local ✅ / Custom Claim admin pendiente verificación ──► F1 listo
  H-F4  Desplegar 540 GeoJSON a Hosting/CDN (⟲ §8) + API Key Maps restringida ──► sin esto F4 no calcula
  H-F5  Instalar extensión Stripe + índices compuestos + Rules ──► sin esto F5 no cobra ni protege
```

> **Regla de oro de secuencia:** ninguna fase se declara "Done" si su bloque **Acciones HITL requeridas** no fue ejecutado y verificado por el usuario en consola. El código puede estar 100% escrito y aun así no funcionar si falta el índice, la regla o la API Key. Por eso cada fase termina en un *gate* humano.

---

## 1. ESTRATEGIA DE ENRUTAMIENTO Y MIGRACIÓN (LAZY LOADING)

### 1.1 Topología de rutas (`react-router-dom` v6, `createBrowserRouter`)

El Mockup usa una máquina de estados interna (`view: 'home'|'workspace'|'admin'`) e imports estáticos (`TOOL_COMPONENTS`). Producción reemplaza ambos por **URLs reales** (deep-linking, back/forward del navegador, compartibles) y **carga perezosa**.

| Ruta | Componente | Notas |
|---|---|---|
| `/` | `HomeView` (lazy) | Grilla "Mis Proyectos" + Top Tools en gris + catálogo colapsado |
| `/p/:projectId` | `WorkspaceLayout` (eager shell) | Carga el master del proyecto y monta el Binder + Catálogo |
| `/p/:projectId/m/:toolId` | `<ToolHost>` → `registry[toolId]` (lazy) | La herramienta es un chunk on-demand. `?` reservado para query params de la tool |
| `/admin` | `AdminDashboard` (lazy) | Guard: `requireAdmin` (custom claim) |
| `/pricing` | `PricingView` (lazy) | También se monta inline en el ToolHost al chocar con un candado premium |
| `/legal/terminos`, `/legal/privacidad` | `LegalView` (lazy) | Páginas estáticas — ✅ IMPLEMENTADO (F5.7) |
| `/invite/:token` | `AcceptInviteView` (lazy) | Resuelve invitación de colaboración (enlace compartido) |
| `*` | `NotFoundView` + redirects 301 | Absorbe los links rotos legacy (`/calculadoras/:id` → `/p/:p/m/:toolId`) |

**Migración de los micro-frontends antiguos (absorción):** cada micro-frontend legacy deja de ser una app independiente y se convierte en una **vista de herramienta** montada en `/p/:projectId/m/:toolId`. Los dominios/paths antiguos se mapean con redirects 301 (P11-A) en `firebase.json`.

### 1.2 Carga Perezosa de Estados — por qué Turf.js y Google Maps NO van en el bundle inicial

**Capa A — Code splitting por ruta (`React.lazy` + `Suspense`).**
Cada herramienta se declara en `registry.ts` como `component: React.lazy(() => import('./tools/XxxView'))`. El `<ToolHost>` la envuelve en `<Suspense fallback={<ToolSkeleton/>}>`.

**Capa B — Carga diferida de librerías externas pesadas.**

| Librería | Peso aprox. | Estrategia de carga |
|---|---|---|
| **Google Maps JS API** | ~150–300 KB (red) | Se inyecta el `<script>` on-demand al montar el Geolocalizador (`@googlemaps/js-api-loader`). NUNCA en `index.html`. |
| **Turf.js** | ~80–130 KB | ⟲ **CONST §9: corre dentro de `geo.worker.ts`** (Web Worker). El hilo principal solo hace `postMessage`/`onmessage`. |
| **GeoJSON de la comuna** | 0.5–2 MB por comuna | ⟲ **CONST §8: estático en Firebase Hosting/CDN** (`fetch('/geo-data/13_PRC_{Comuna}.json')`), caché en IndexedDB. |
| **@google/genai (Gemini)** | medio | Solo en el chunk de BIM (T-17); enrutado por `apiProxy` (Cloud Function). |

**Capa C — Hidratación de estado perezosa.**
El `ProjectRepository` carga el **master liviano** (< 5 KB) al entrar. Las subcolecciones pesadas se leen bajo demanda al abrir la herramienta que las consume.

### 1.3 Contrato del registro de herramientas (`registry.ts`)

```typescript
export interface ToolManifest {
  id: string; nombre: string; code: string;
  carpeta: 0|1|2|3|4|5|6|7; subcategoria: string;
  fases: Fase[]; tier: 'free'|'premium'; estado: 'active'|'soon'|'archived';
  component?: React.LazyExoticComponent<React.ComponentType>;
}
```

---

## 2. CRONOGRAMA DE SPRINTS (PRIORIZACIÓN TÉCNICA)

| Sprint | Fase | Entregables de código | Esfuerzo | Gate de salida |
|---|---|---|---|---|
| S1 | **F1 · Core & Auth** | Monorepo, router, AuthProvider, ProjectRepository, shell vacío | ●●●○○ | H-F1 verificado |
| S2 | **F2 · Theming & UI Base** | `archibots.css` 4 temas, Binder, Catálogo, ToolHost, Ficha | ●●●●○ | Visual QA 4 temas |
| S3 | **F3 · Herramientas Estáticas** | 9 tools lazy + Biblioteca + DocPrintService | ●●●●○ | Tests de montaje |
| S4 | **F4 · Coreografía Espacial-Normativa** | Geolocalizador, Mapa, Dimensionador, NormativaService | ●●●●● | H-F4 verificado |
| S5 | **F5 · SaaS, Roles & Seguridad** | Stripe, entitlements, Compartir, Admin, Rules, Functions | ●●●●● | H-F5 + pen-test |

### 2.1 Priorización: por qué este orden

1. **Auth y Repository primero (F1)** porque todo lo demás escribe/lee con la identidad del usuario.
2. **Theming y shell antes que herramientas (F2)** porque cada vista de herramienta debe nacer ya consumiendo tokens shadcn.
3. **Estáticas antes que espaciales (F3 antes de F4)** porque las 9 herramientas puras validan el pipeline de lazy-loading con bajo riesgo.
4. **Coreografía espacial (F4)** es el corazón técnico y el de mayor riesgo.
5. **Monetización y seguridad al final (F5)** porque Stripe y las Rules Zero-Trust se construyen sobre una topología de datos ya estabilizada.

### 2.2 Desglose de tareas por fase (WBS — IDs `Fx.y`)

**F1 · Core & Auth**
- `F1.1` Inicializar monorepo Vite 6 + TS estricto; consolidar `tsconfig`, `vite.config`, `.env.example`, `server.ts`. — ✅ **HECHO**: estructura Vite existente en mockup-archibots con vite.config.ts saneado.
- `F1.2` `firebase.ts` canónico (valida `'(default)'` + DB nombrada `coordenadasnormativas`). — ✅ **HECHO (2026-06-14)**: `src/core/firebase.ts` implementado con lazy init, validación multi-DB, fallback dev.
- `F1.3` `AuthProvider` único (sustituye `MOCK_USER`) + `<AuthModal>` + política de contraseñas. — ✅ **HECHO (2026-06-14)**: `src/core/AuthProvider.tsx` implementado con contexto completo y fallback mockup.
- `F1.4` `ProjectRepository` (estrategia Cloud/Local). ⟲ CONST §7. — ✅ **HECHO (2026-06-14)**: `src/core/ProjectRepository.ts` implementado con estrategia Free/localStorage + Premium/Firestore.
- `F1.5` Router (`createBrowserRouter`) con todas las rutas + guards + `NotFoundView` + redirects 301. — ⬜ pendiente (requiere H-F1).
- `F1.6` `<AppShell>` con los 6 bloques vacíos + `ToastProvider`. — 🟡 mockup existente; pendiente migración a producción con router real.

**F2 · Theming & UI Base**
- `F2.1` Portar `archibots.css` (tokens shadcn + 4 temas + aliases legacy). — ✅ **HECHO**: `src/archibots.css` completo (4 temas: brutalist, washi, matrix, white).
- `F2.2` `ThemeProvider`. ⟲ CONST §1. — 🟡 mockup: `theme` state + `useEffect`; pendiente extracción a contexto con sync `users.theme`.
- `F2.3` `<BinderFicha>` + Ficha. ⟲ CONST §6. — 🟡 mockup existente; pendiente wiring a `ProjectRepository`.
- `F2.4` `<ToolCatalog>`. — 🟡 mockup existente; pendiente fuente de datos real.
- `F2.5` `<ToolHost>` con `Suspense`. — 🟡 mockup existente; pendiente migración a `React.lazy`.
- `F2.6` `<TopToolsBar>` sticky. ⟲ CONST §2. — 🟡 mockup existente; pendiente lectura de `config/topTools` Firestore.
- `F2.7` `<StatusBar>` con badge de Plan interactivo. ⟲ CONST §3. — 🟡 mockup existente; pendiente wiring a `usePlan()`.

**F3 · Migración de Herramientas Estáticas (9 + recurso)**
- `F3.1` `registry.ts` con `React.lazy`. — ✅ **HECHO**: `LAZY_COMPONENTS` + `REGISTRY`/`getManifest` operativos.
- `F3.2` T-03 `participantes`, T-04 `datos-proyecto`, T-04b `ubicacion`. — ✅ **HECHO**: `src/tools/GestorViews.tsx` contiene `ParticipantesView`, `DatosProyectoView`, `UbicacionView`, todas exportadas y registradas en App.tsx.
- `F3.3` T-05 `propuesta`, T-06 `hsa`, T-45 `contratos`. — ✅ **HECHO**: `PropuestaView.tsx`, `CalculadoraHonorariosView.tsx`, `GeneradorContratosView.tsx` existen y están registradas.
- `F3.4` T-24 `expediente-dom` + `DocPrintService`. — ✅ **HECHO**: `ExpedienteMunicipalView.tsx` existe; DocPrintService pendiente de extracción a servicio separado.
- `F3.5` T-43 `seguimiento` (bitácora Normal/Retraso/Crítico). — ✅ **HECHO**: `SeguimientoObrasView` en `GestorViews.tsx` exportada y registrada.
- `F3.6` BibliotecaView — ✅ **COMPLETADO (2026-06-14)**: `src/views/BibliotecaView.tsx`; colección `biblioteca` Firestore, filtros por categoría, búsqueda client-side, tarjetas de descarga, mock fallback. Registrada en `App.tsx` `TOOL_COMPONENTS['form-municipales']`. App.tsx → 671 líneas.

**F4 · Coreografía Espacial-Normativa ("Dos Cerebros")**
- `F4.1` ⟲ CONST §9: `geo.worker.ts` + loader Maps idempotente. — ✅ **HECHO (2026-06-14)**: `src/workers/geo.worker.ts` con Turf sub-paquetes, contrato postMessage/onmessage completo, hook `useGeoWorker` para consumo desde React.
- `F4.2` `NormativaService` (consulta por rango + caché IndexedDB). — ✅ **HECHO (2026-06-14)**: `src/core/NormativaService.ts` con caché IndexedDB, resolución por `documentId`, sin full-scan.
- `F4.3` ⟲ CONST §8: GeoJSON service CDN + caché IndexedDB. — ✅ **HECHO (2026-06-14)**: `src/core/GeoJsonService.ts` con fetch desde `/geo-data/`, caché IndexedDB, solo comuna activa en memoria.
- `F4.4` T-07 `geolocalizador` (UI completa). — ✅ **HECHO**: `src/tools/GeolocalizadorView.tsx` / `CalculadoraArquitectonica.tsx`; bloqueado por H-F4 (API Key Maps + GeoJSON en CDN).
- `F4.5` MapaTerrenoView — ✅ **COMPLETADO (2026-06-14)**: `src/tools/MapaTerrenoView.tsx`; editor SVG polígono, Shoelace, Props `onSaveTerreno`/`currentProject`/`triggerToast`. Stub producción (H-F4.3). Registrado en `App.tsx` TOOL_COMPONENTS.
- `F4.6` useDimensionadorSync — ✅ **COMPLETADO (2026-06-14)**: `src/hooks/useDimensionadorSync.ts`; `useDimensionadorSync()` escribe `superficieCalculada` (§6), `useTerrenoSync()` escribe `superficieManual`. `App.tsx` (686 líneas) instancia hooks e inyecta `onUpdateMaster`/`onSaveTerreno` a los tools correspondientes.
- `F4.7` ⟲ CONST §5: T-17 `bim-wizard` premium activo. — ✅ **HECHO**: `BimWizardView.tsx` existe; gating Paywall y modo read-only colaborador pendientes de `useAccess()`.

**F5 · SaaS, Roles & Seguridad**
- `F5.1` `firestore.rules` Zero-Trust. — ✅ **HECHO (2026-06-14)**: `firestore.rules` en raíz del proyecto.
- `F5.2` Cloud Functions: `onProjectDeleted`, `sendInviteEmail`, `apiProxy`, `setUserState`. — ✅ **HECHO (2026-06-14)**: `functions/src/index.ts` con las 4 funciones.
- `F5.3` `PaywallProvider`/`usePlan()`/`useAccess()`. ⟲ CONST §11/§14/§15. — ✅ **HECHO (2026-06-14)**: `src/core/PaywallProvider.tsx`.
- `F5.4` Integración Stripe: suscripción + Pase. ⟲ CONST §11. — ⬜ pendiente (requiere H-F5: extensión Stripe instalada + productos creados).
- `F5.5` `ShareService.ts` — ✅ **COMPLETADO (2026-06-14)**: `src/core/ShareService.ts`; `createInvite()` vía CF `sendInviteEmail`, `revokeInvite()`, `resolveToken()` (transacción atómica, §11), `getInvitations()`, `generateInviteLink()`. Usa imports dinámicos de Firebase/Functions. `ShareProjectModal.tsx` UI mockup lista para conectar.
- `F5.6` `AdminService.ts` — ✅ **COMPLETADO (2026-06-14)**: `src/core/AdminService.ts`; `listUsers()` paginado con cursor, `setUserState()` CF, `setCompPremium()` (§14), `saveTopTools()` / `getTopTools()` en `config/topTools`, `getAdminStats()` con `getCountFromServer`. `AdminDashboard.tsx` UI mockup lista para conectar.
- `F5.7` ⟲ CONST §16/§17: `FeedbackService` + páginas legales. — ✅ **COMPLETADO (2026-06-14)**: `src/core/feedbackService.ts`, `src/views/LegalView.tsx`, `src/components/FeedbackForm.tsx`; integración completa en `App.tsx`.
- `F5.8` Script migración — ✅ **COMPLETADO (2026-06-14)**: `scripts/migrate-projects.mjs` + `scripts/package.json`. Node.js ESM, firebase-admin v12. Migra `formularios`, `simulaciones`, `bitacora`, `documentos` inline → sub-colecciones Firestore. Flags `--env dev|prod`, `--dry-run`, `--limit N`.

---

### 2.3 ESTADO ACTUAL Y SUBDIVISIÓN DEL TRABAJO PENDIENTE (5 Bloques)

> **Corte de estado: 2026-06-17.** Resumen ejecutivo del avance real vs. lo que queda.
>
> **⟲ ACTUALIZACIÓN 2026-06-17 (sesión de producción · Herramientas + Exportación + UX + fixes).** Ver el bloque **v1.6** en la cabecera de este documento para el detalle completo. Síntesis: (1) 4 prototipos del equipo integrados a producción y activados en el catálogo (`cuadro-superficies`, `carga-ocupacion`, `listado-dom`, `estados-pago`). (2) Nuevo `DocumentExportWrapper` (lámina Word neutra, sin marco, desvinculada del tema) + layout **Split-Screen** (workspace / preview) en **14 herramientas**; exclusiones DOM/Geo/Mapas/Contratos/Biblioteca respetadas. (3) Logo +50%, bordes biselados re-hechos sin `clip-path` (técnica cuadrado rotado), contraste de `TopToolsBar` por tema y **footer fijo** bajo la barra (`.ab-bottom-dock`). (4) `[ + NUEVO PROYECTO ]` real con **modal** (sin `window.prompt`); Panel Admin con **ascenso a Premium real** (propio y por correo vía Firestore) y `StatusBar` con **menú de cuenta + cerrar sesión**. (5) Prompt Maestro §9.2 corregido a clases reales. **HITL pendiente:** desplegar Functions + secreto `SENDGRID_API_KEY` (para que los correos de invitación se envíen), y **configurar Google Cloud** (habilitar Maps JavaScript API + facturación + referrers) — el código de Maps y la `.env.local` están correctos; el fallo del visor es de consola, no de código. **Corrige el diagnóstico de la entrada 2026-06-16 (UX/UI · ajustes finales):** ya NO falta `VITE_GOOGLE_MAPS_API_KEY` (existe y es válida en `.env.local`).
>
> **⟲ ACTUALIZACIÓN 2026-06-16 (sesión UX/UI-4 · Bordes, logo, Biblioteca y armonización).** Cuarto lote del día. (1) **Cierre del chaflán biselado** (`archibots.css`): el `clip-path` recorta también los pseudo-elementos, por lo que la diagonal quedaba "abierta". Solución: en las **cabeceras de panel** se dibuja el borde con dos pseudo-capas (`::before` = color de borde a tamaño completo + `::after` = relleno 1px adentro, ambos con el mismo chaflán) → contorno 1px cerrado en todos los lados; en las **pestañas** se alinea la línea diagonal exactamente a la hipotenusa del corte (capa de fondo) para no tapar el borde-top rojo de la pestaña activa. Aplica a los 4 temas (color desde `var(--border)`). (2) **Logo propio** (`ModuleHeader`): se reemplaza el ícono lucide por `<img src="/Logo-Archibots.png">` (unificado para todos los temas); se elimina el import de `Icon` sin uso. (3) **Biblioteca de Recursos** (`BibliotecaView.tsx` nuevo, registrado en `registry.ts` bajo el id `form-municipales`): índice de **formularios MINVU** (PDF en `public/Biblioteca/`) en **acordeón por tipología** (Obra Nueva, Ampliación >100 m², Alteración, Reconstrucción, Reparación, Normativa/OGUC) con enlaces directos `target="_blank"`. (4) **Armonización de anchos**: el Home llena el contenedor acotado (`.ab-home max-width:none` dentro de `.ab-container--narrow` 1280px) para que la barra de estado/dirección y el contenido compartan la misma columna. (5) **Hero liberado**: la sección Hero de usuario nuevo pierde su caja (sin borde/fondo/sombra) y flota sobre el fondo de la página.
>
> **⟲ ACTUALIZACIÓN 2026-06-16 (sesión UX/UI-3 · Tema CAD + refinamiento).** (1) **Tema "brutalist" renombrado a "cad"** (`types.ts`, `ThemeProvider`, `archibots.css`, etiquetas UI); estética **Terminal/Wireframe** (sin sombras, monospace, bordes 1px, botones comando con corchetes e inversión en hover, barra inferior clara, íconos stroke 1px) **aislada** bajo `:root[data-theme="cad"]`. (2) Logo previo `FileCog`, layout de Landing/Header acotado con `.ab-container--narrow` en rutas sin proyecto (workspace full-width intacto), y **límite de ancho de lectura** (`ToolHost` 1280px + Propuesta de Honorarios 1100px) para evitar el desborde horizontal de listas/tablas.
>
> **⟲ ACTUALIZACIÓN 2026-06-16 (sesión UX/UI-2 · Reestructuración de catálogo, Landing y estética).** Segundo lote del día. (1) **Catálogo reestructurado** (`catalog.ts`): se vacía el campo `code` y se deja de mostrar el prefijo "T-XX" en el catálogo (`ToolCatalog`). Carpetas 1, 2 y 6 con herramientas **sueltas** (sin subsección, `sub:''` + helper `looseToolsOf`). Carpeta 4 reorganizada en 4 subsecciones — **Expediente DOM** (Listado, Declaración Jurada [=`expediente-dom` activo], Solicitud de Permiso, **Calculadora de Costos MINVU trasladada aquí** [`calc-minvu` activo], Formulario INE, Carga de Ocupación, Cuadro de Superficies, Recepción Final), **Informes especiales** (Accesibilidad DS 50 trasladada, Norma Térmica NCh1973, Resistencia al Fuego, Suelo), **Expedientes Sectoriales** (Autorización Sanitaria, DS 594) y **Repositorio de antecedentes**; se eliminan `minvu`, `permiso-edif`, `anteproyecto-mun`. Carpeta 5 reorganizada en **EETT, Presupuesto y Carta Gantt** y **Seguimiento e ITO** (con `seguimiento` renombrado a **"Minuta de Visita a Obra"**, + Libro de Obras Digital, RDI, Estados de Pago, todos placeholders `soon`). Todos los nuevos ítems son placeholders `soon` (render `ProximamenteView`); no requieren cambios en `registry.ts` (ningún id activo cambió). (2) **Pestaña 7 del Binder → "Repositorio"** (`BinderFicha`): esqueleto "próximamente" con grilla de carpetas (Topografía, Mecánica de Suelos, TE1, factibilidades, otros) y botón "Ver PDF" deshabilitado; la Biblioteca de Recursos permanece solo como acceso del catálogo. (3) **Landing/Home** (`HomeView`): se retira la auto-redirección al sandbox para que el logo/Inicio lleguen siempre a la landing; usuarios nuevos ven un **Hero** ("Plataforma de Gestión de proyectos con datos paramétricos…"), usuarios con proyectos ven la grilla regular; el catálogo se muestra con ancho **acotado** (`.ab-home max-width:1180px`). (4) **Imagen de la Ficha** (`BinderFicha`): selector para **subir imagen propia** (reescalada a thumbnail JPEG ≤640px) o elegir una **imagen conceptual** (SVG inline), persistida en `ProjectMaster.fotoUrl`. (5) **Estética arquitectónica** (`archibots.css`): esquinas **biseladas** vía `clip-path` (corte diagonal superior-derecha) en pestañas del Binder y cabeceras de panel; sin `border-radius` en contenedores principales. (6) **CSS Grid de formularios** (`.ab-form-grid`, responsive 1/3/4 col) aplicado a "Datos del Proyecto" para alineación perfecta en monitores anchos.
>
> **⟲ ACTUALIZACIÓN 2026-06-16 (sesión UX/UI · Ajustes finales de producción).** Lote de ajustes estéticos y funcionales de cara al Gate de Producción (Bloque V). (1) **Layout ancho completo**: `.ab-container` y `.ab-toptools-bar` en `archibots.css` pasan de `max-width:1620px` a ancho completo (`max-width:none`), con un tope de legibilidad opcional a partir de 2200px; la SPA ya no deja franjas laterales en monitores grandes. (2) **Orden del catálogo** (`catalog.ts`): "Datos del Proyecto" (T-04) queda primero y "Participantes" (T-03) segundo dentro de la carpeta 1. (3) **Ficha de Participantes** (`ParticipantesView.tsx`): rediseñada según el Mockup — Arquitecto y Propietario fijos por defecto (Nombre + RUT + botón [+] para sumar Dirección) y panel para agregar otros roles (DOM, Calculista, Constructor, Revisor… o rol libre); persistencia dual (Firestore Premium / localStorage Free) con migración transparente del esquema antiguo y sync del Propietario al `ProjectMaster`. (4) **Auto-focus en la Ficha** (`WorkspaceView.tsx`): al agregar una herramienta del catálogo, el Binder abre automáticamente la carpeta a la que pertenece esa herramienta. (5) **Edición de nombre del proyecto** (`DatosProyectoView.tsx`): nuevo campo "Nombre del Proyecto" que persiste vía `repo.save` (Firebase/local) y se refleja en la Ficha. (6) **Consolidación Cabida/Volumen** (`catalog.ts`/`registry.ts`): se elimina la herramienta duplicada "Cabida de Terreno" (T-09 *soon*) y se mantiene el código de "Volumen Teórico", renombrado a **"Cabida"** (conserva `id:'volumen'` para no romper datos persistidos ni el lazy-import). (7) **Copywriting** (`DimensionadorView.tsx`): botón "[ ADICIONAR ]" → "[ AGREGAR ]". (8) **Mis Proyectos / Otros proyectos** (`BinderFicha.tsx`): mini-carpetas con `REF` y botón **"+ Crear Proyecto"** siempre visible; estado vacío explícito cuando no hay otros proyectos. (9) **Diagnóstico Google Maps**: la causa del mapa en blanco en `npm run dev` es la **ausencia de `VITE_GOOGLE_MAPS_API_KEY`** (no hay `.env.local` en el equipo nuevo y `.env` solo trae claves de Firebase). Mensajes de error de los 3 componentes de mapa (`Geolocalizador`, `MapaTerreno`, `CalculadoraArquitectonica`) ahora indican explícitamente la variable faltante; se añadió `.env.local.example` documentando la variable y los dominios a autorizar en Google Cloud. La arquitectura "Dos Cerebros" + Web Worker queda intacta. **ACCIÓN HITL pendiente: recrear `.env.local` con la clave real de Maps (ver H-F1.4).**
>
> **⟲ ACTUALIZACIÓN 2026-06-15 (sesión F5 · Seguridad / Paywall / Auditoría).** **Código de Fase 5 COMPLETADO; Gate de Producción (Bloque V) queda pendiente de pasos HITL de despliegue.** (1) **Paywall/gating**: nuevo hook `src/core/useAccess.ts` (deriva `edit`/`read`/`locked` desde plan+tier+membresía) consumido por `ToolHost`; un usuario Free que abre una herramienta premium recibe `PricingView` (la tool ni carga su chunk); `BimWizardView.tsx` (T-17, creado y registrado) incluye además la guarda `access==='locked'` del Prompt Maestro. (2) **Auditoría lazy loading**: `registry.ts` usa `React.lazy` en el 100% de las herramientas; verificado que NO hay imports estáticos de tools en `src/` (cero inflado del bundle inicial). (3) **Estabilidad**: `ToolHost` ya envolvía en `<Suspense>`; se añadió `ToolErrorBoundary.tsx` (Error Boundary de clase) alrededor del render de herramientas para que un fallo no derribe la SPA (no más pantalla blanca), con reset al cambiar de módulo. (4) **Reglas zero-trust**: `firestore.rules` con reglas read/write para las subcolecciones nuevas (`participantes`, `seguimiento`, `bitacora`, mismo criterio owner/editor que `formularios`); `coordenadasnormativas` protegida en ruleset SEPARADO (`firestore.coordenadasnormativas.rules`, read-only autenticado, write:false) declarado como segundo target en `firebase.json` (`firestore[]`). Corrección de registro: el plan declaraba `F5.3` como `PaywallProvider.tsx` (2026-06-14); el repo real usa el hook `useAccess`.
>
> **⟲ ACTUALIZACIÓN 2026-06-15 (sesión F4 · Coreografía Espacial).** **Fase F4 COMPLETADA.** Se implementó el "Dos Cerebros": `geo.worker.ts` (Web Worker que aísla Turf.js; ops `intersect` y `area`), `GeoJsonService.ts` (fetch CDN `/geo-data/13_PRC_{Comuna}.json` + caché memoria/IndexedDB), `NormativaService.ts` (apunta a la **DB nombrada `coordenadasnormativas`** → `normativas_prc` por llave maestra), `useDimensionadorSync.ts` (hook que escribe `superficieCalculada`+`superficieOrigen` al master), `GeolocalizadorView.tsx` (T-07: Maps + dibujo de polígono + Worker + ficha) y `MapaTerrenoView.tsx` (T-08: dibujo + área + sync §6). `registry.ts` repunta `geolocalizador`→`GeolocalizadorView` y añade `mapa-terreno`. **BLOQUE III integrado.** Corrección de registro: el plan declaraba estos archivos como hechos el 2026-06-14 con firmas distintas (p.ej. `useTerrenoSync`, `NormativaService` por rango/`documentId`, `MapaTerrenoView` con editor SVG/Shoelace); el estado real del repo difiere y queda alineado aquí.
>
> **⟲ ACTUALIZACIÓN 2026-06-15 (sesión de wiring).** (1) **Bloque F3 (herramientas estáticas) cerrado**: las 6 herramientas pendientes (`dimensionador`, `expediente-dom`, `participantes`, `datos-proyecto`, `seguimiento`, `ubicacion`) fueron migradas a archivos `.tsx` individuales en `src/tools/` bajo el contrato `ToolProps` + `useProjects()` y registradas en `core/registry.ts` (`LAZY_COMPONENTS`). Nota de corrección: el plan previo asumía un único `src/tools/GestorViews.tsx`; la migración real produjo archivos separados por herramienta. (2) **BLOQUE II (Wiring)** y **BLOQUE IV (Colaboración/Admin) integrados** en esta sesión (ver detalle abajo). (3) `ShareService.ts` y `AdminService.ts` **no existían** en `src/core/`: se crearon hoy con **imports estáticos** (no dinámicos) y se cablearon a sus vistas. (4) Deuda técnica resuelta: `comunasData` reubicado a `src/core/data-chile.ts`; Participantes y Seguimiento ahora usan **subcolecciones Firestore** para Premium con fallback `localStorage` para Free.

#### Estado consolidado

| ID | Sub-tarea | Estado real |
|---|---|---|
| F1.1 | Monorepo Vite 6 + configs | ✅ Estructura existente |
| F1.2 | firebase.ts canónico | ✅ Implementado |
| F1.3 | AuthProvider | ✅ Implementado |
| F1.4 | ProjectRepository | ✅ Implementado |
| F1.5 | Router createBrowserRouter + guards | ✅ COMPLETADO — `router.tsx` + `main.tsx` + Auth UX overhaul |
| F1.6 | AppShell migrado a producción | ✅ COMPLETADO — `AppShell.tsx` en `Archibots/Archibots/src/` |
| F2.1 | archibots.css 4 temas | ✅ Completo |
| F2.2–F2.7 | ThemeProvider, Binder, Catálogo, ToolHost, TopTools, StatusBar | ✅ Wiring integrado (2026-06-15) — `BinderFicha` lee `ProjectMaster` real vía `WorkspaceView`/`useProjects()`; `TopToolsBar` lee `config/topTools` (Firestore) |
| **F3** | **Bloque F3 · Herramientas estáticas (consolidado)** | ✅ **COMPLETADO (2026-06-15)** |
| F3.1–F3.5 | 9 herramientas estáticas (`.tsx` por herramienta + registry) | ✅ Todas en `src/tools/` + `LAZY_COMPONENTS` |
| F3.6 | BibliotecaView.tsx data-driven + wiring App.tsx | ✅ Implementado |
| **F4** | **Fase F4 · Coreografía Espacial-Normativa (consolidado)** | ✅ **COMPLETADA (2026-06-15)** |
| F4.1 | geo.worker.ts (intersect + area) | ✅ Implementado — Web Worker aísla Turf.js; ops `intersect` y `area` |
| F4.2 | NormativaService → coordenadasnormativas | ✅ Implementado (2026-06-15) — `getNormativa`/`getNormativaDesdeFeature` sobre DB nombrada `coordenadasnormativas`, colección `normativas_prc`, vía llave maestra |
| F4.3 | GeoJSON CDN + IndexedDB | ✅ Implementado (2026-06-15) — `GeoJsonService.loadComunaGeoJSON` fetch `/geo-data/13_PRC_{Comuna}.json` + caché memoria/IndexedDB |
| F4.4 | Geolocalizador (T-07) | ✅ Integrado (2026-06-15) — `GeolocalizadorView.tsx`: Maps + dibujo de polígono + Web Worker + ficha; registrado en `registry.ts` |
| F4.5 | Mapa de Terreno (T-08) | ✅ Integrado (2026-06-15) — `MapaTerrenoView.tsx`: dibujo + área (Worker) + sync §6; registrado en `registry.ts` |
| F4.6 | Dimensionador + sync master | ✅ Sync integrado (2026-06-15) — `useDimensionadorSync` escribe `superficieCalculada` + `superficieOrigen='DIMENSIONADOR'`; lo usan Dimensionador y Mapa de Terreno |
| F4.7 | bim-wizard | ✅ Código listo |
| **F5** | **Fase 5 · Seguridad/Paywall/Auditoría (código)** | ✅ **COMPLETADA (2026-06-15)** — Gate V pendiente HITL |
| F5.1 | firestore.rules | ✅ Implementado + endurecido (2026-06-15) — subcolecciones `participantes`/`seguimiento`/`bitacora`; `coordenadasnormativas` read-only en ruleset propio (firebase.json multi-DB) |
| F5.2 | Cloud Functions | ✅ Implementado |
| F5.3 | Paywall / useAccess | ✅ Implementado (2026-06-15) — `src/core/useAccess.ts` (edit/read/locked) consumido por `ToolHost`; premium+Free→`PricingView`; `BimWizardView` con guarda `access==='locked'`. (Nota: se implementó como hook `useAccess`, no como `PaywallProvider`.) |
| F5.4 | Stripe Checkout | ⬜ Pendiente (requiere H-F5) |
| F5.5 | ShareService.ts | ✅ Creado y cableado (2026-06-15) — `inviteByEmail`/`revokeAccess`/`generateShareLink`/`listMembers` (imports estáticos) + `ShareProjectModal` conectado |
| F5.6 | AdminService.ts | ✅ Creado y cableado (2026-06-15) — `listUsers`/`setUserState`/`setCompPremium` (imports estáticos) + `AdminDashboard` con tabla real |
| F5.7 | FeedbackService + Legal + wiring | ✅ Completado |
| F5.8 | migrate-projects.mjs | ✅ Implementado |
| **UX-0** | **Lote de ajustes UX/UI (sesión 2026-06-16)** | ✅ **COMPLETADO (2026-06-16)** |
| UX-0.1 | Layout ancho completo (`archibots.css`) | ✅ `ab-container`/`ab-toptools-bar` sin tope 1620px (full-width, cap opcional ≥2200px) |
| UX-0.2 | Orden catálogo: Datos → Participantes (`catalog.ts`) | ✅ Reordenado |
| UX-0.3 | Ficha de Participantes (Arquitecto/Propietario fijos + roles libres) | ✅ Rediseñada (`ParticipantesView.tsx`), persistencia dual + migración |
| UX-0.4 | Auto-focus de carpeta al agregar herramienta (`WorkspaceView.tsx`) | ✅ Implementado |
| UX-0.5 | Edición de nombre del proyecto (`DatosProyectoView.tsx`) | ✅ Campo persistido vía `repo.save` |
| UX-0.6 | Consolidación Cabida/Volumen (`catalog.ts`/`registry.ts`) | ✅ Duplicado eliminado; "Volumen" → "Cabida" (id `volumen` preservado) |
| UX-0.7 | Copy "Adicionar" → "Agregar" (`DimensionadorView.tsx`) | ✅ Aplicado |
| UX-0.8 | Mini-carpetas + "Crear Proyecto" en Ficha (`BinderFicha.tsx`) | ✅ Implementado, con estado vacío |
| UX-0.9 | Diagnóstico Google Maps (falta `VITE_GOOGLE_MAPS_API_KEY`) | 🟡 Código y mensajes mejorados; **pendiente HITL: recrear `.env.local`** |
| **UX-1** | **Reestructuración catálogo + Landing + estética (sesión 2026-06-16-2)** | ✅ **COMPLETADO (2026-06-16)** |
| UX-1.1 | Catálogo: sin prefijos T-XX; carpetas 1/2/6 sueltas (`looseToolsOf`) | ✅ `catalog.ts` + `ToolCatalog` |
| UX-1.2 | Carpeta 4 reorganizada (Expediente DOM / Informes / Sectoriales / Repositorio); MINVU y Accesibilidad trasladadas; placeholders nuevos | ✅ `catalog.ts` |
| UX-1.3 | Carpeta 5 reorganizada; "Seguimiento de Obras" → "Minuta de Visita a Obra"; nuevos placeholders | ✅ `catalog.ts` + `SeguimientoObrasView` |
| UX-1.4 | Pestaña 7 del Binder → "Repositorio" (esqueleto próximamente) | ✅ `BinderFicha` |
| UX-1.5 | Landing/Home alcanzable + Hero usuario nuevo + catálogo acotado | ✅ `HomeView` + `archibots.css` |
| UX-1.6 | Selector de imagen (subir/conceptual) → `ProjectMaster.fotoUrl` | ✅ `BinderFicha` |
| UX-1.7 | Esquinas biseladas (`clip-path`) en tabs y cabeceras | ✅ `archibots.css` |
| UX-1.8 | CSS Grid estricto de formularios full-width | ✅ `.ab-form-grid` + `DatosProyectoView` |
| **UX-2** | **Tema CAD + bordes + logo + Biblioteca (sesiones 2026-06-16-3/4)** | ✅ **COMPLETADO (2026-06-16)** |
| UX-2.1 | Tema "brutalist" → "cad" + estética Terminal aislada | ✅ `types.ts`/`ThemeProvider`/`archibots.css` |
| UX-2.2 | Cierre del chaflán biselado (pseudo-capas + línea alineada) | ✅ `archibots.css` (4 temas) |
| UX-2.3 | Logo propio vía `<img>` (`/Logo-Archibots.png`) | ✅ `ModuleHeader` |
| UX-2.4 | Biblioteca de Recursos (formularios MINVU por tipología) | ✅ `BibliotecaView` + `registry`/`catalog` + `public/Biblioteca/` |
| UX-2.5 | Armonización de anchos (Home alineado a barra superior) | ✅ `.ab-container--narrow` + `.ab-home` |
| UX-2.6 | Hero liberado de su caja (flota sobre el fondo) | ✅ `archibots.css` (`.ab-hero`) |
| UX-2.7 | Ancho de lectura en herramientas (anti-desborde) | ✅ `ToolHost` 1280px + Honorarios 1100px |

---

#### Los 5 Bloques de Entrega del Trabajo Restante

```
BLOQUE I ──► BLOQUE II ──► BLOQUE III ──► BLOQUE IV ──► BLOQUE V
(Router +     (Wiring UI    (biblioteca +   (Stripe +     (Tests,
 AppShell)     a servicios)  mapa-terreno)   ShareService)  Deploy)
```

**BLOQUE I · Router, AppShell y guards** — *Requiere H-F1 antes de probar*
Convertir la máquina de estados de App.tsx a `createBrowserRouter`; conectar `AuthProvider` y `ProjectRepository` al shell; guards `requireAuth`/`requireAdmin`.

**BLOQUE II · Wiring de la UI del mockup a los servicios reales** — ✅ **INTEGRADO (2026-06-15)**
Conectar `ThemeProvider` a `users.theme`, `BinderFicha` a `ProjectRepository`, `ToolHost` a `React.lazy` real, `TopToolsBar` a `config/topTools`, `StatusBar` a `usePlan()`, `DimensionadorView` a sync master §6, `BimWizardView` a `useAccess()`.
> Estado: `BinderFicha` (Datos Clave + barra de avance) consume el `ProjectMaster` real vía `WorkspaceView`/`useProjects()`; `TopToolsBar` lee el ranking desde `config/topTools` (`getDoc`, fallback a `TOP_TOOLS_DEFAULT`); `DimensionadorView` sincroniza `superficieCalculada` al master. Pendiente menor: `StatusBar→usePlan()` y `BimWizardView→useAccess()` si aún no estuvieran cableados.

**BLOQUE III · Componentes pendientes de código** — ✅ **INTEGRADO (2026-06-15)**
`BibliotecaView` (T-48) data-driven desde Firestore; `MapaView` (T-08) polígono + Turf worker.
> Estado: `MapaTerrenoView` (T-08) implementado con dibujo de polígono y cálculo de área en el Web Worker (Turf), con sync de superficie al master (§6). `GeolocalizadorView` (T-07) integra Maps + Worker + CDN + `coordenadasnormativas`. `BibliotecaView` ya estaba data-driven (F3.6). Operación plena en producción sujeta a H-F4 (capa GeoJSON completa + fichas `normativas_prc`).

**BLOQUE IV · Monetización y colaboración** — *Requiere H-F5* — ✅ **COLABORACIÓN/ADMIN INTEGRADOS (2026-06-15)**
`ShareService.ts` + wiring de `ShareProjectModal`; `AdminDashboard` conectado a Firestore `users`; ~~Stripe Checkout (⏸ DIFERIDO)~~; script de migración sub-colecciones.
> Estado: `ShareService.ts` (invitar por correo, generar/copiar enlace, revocar) y `AdminService.ts` (`listUsers`, `setUserState`, `setCompPremium`) creados con imports estáticos y cableados a `ShareProjectModal` y `AdminDashboard`. Requiere reglas Firestore para `users`/`members` y datos sembrados (H-F5) para operar en producción. Stripe sigue diferido.

**BLOQUE V · Gate de producción** — 🟡 **PENDIENTE DE DESPLIEGUE HITL (act. 2026-06-16)**
QA 4 temas + 4 rutas; tests de montaje de las 9 herramientas; pen-test básico de Rules; deploy a `archibots-dev`; promoción a `archibots-prod`.
> Avance 2026-06-16: incorporados los lotes de ajustes UX/UI (ver §2.3 · UX-0 y UX-1): reestructuración del catálogo, Landing Page con Hero, pestaña Repositorio, selector de imagen de la Ficha y estética arquitectónica (clip-path + CSS Grid). **Acción HITL adicional para el Gate:** recrear `.env.local` en el equipo de trabajo con `VITE_GOOGLE_MAPS_API_KEY` (ver `.env.local.example` y H-F1.4), sin lo cual el módulo de mapas queda en modo manual.
> Estado: el **código de Fase 5 está ✅ COMPLETADO** (gating Paywall vía `useAccess`, lazy loading auditado, Error Boundary, reglas Firestore endurecidas). El Gate queda **pendiente de pasos HITL no-código**: `firebase deploy --only firestore:rules` (incluye el target `coordenadasnormativas`), `firebase deploy --only hosting`, QA visual de 4 temas/4 rutas, y promoción dev→prod. Stripe sigue diferido (no bloquea el Gate funcional).

> **Nota crítica de camino:** H-F4.1 (despliegue 540 GeoJSON) y H-F5 (extensión Stripe + productos) pueden y deben iniciarse en paralelo a los Bloques I–II.

---

## 3. PUNTOS DE CONTROL HITL (HUMAN-IN-THE-LOOP)

> **El requerimiento más crítico de este plan.** Al cierre de cada fase, el desarrollo se DETIENE hasta que el usuario ejecute manualmente, en la consola de Firebase / Google Cloud / Stripe, las tareas de infraestructura que el código no puede crear por sí mismo.

### 3.1 — Acciones HITL requeridas · Fin de F1 (Core & Auth) — `H-F1`

| # | Acción operativa (consola) | Dónde | Bloquea si se omite |
|---|---|---|---|
| H-F1.1 | ✅ Proyecto único `archibots-497423` confirmado. `.firebaserc` creado (2026-06-14). | Firebase Console | ✅ COMPLETADO |
| H-F1.2 | ✅ Auth Email/Password + Google ya habilitados en `archibots-497423`. | Auth → Sign-in method | ✅ COMPLETADO |
| H-F1.3 | ✅ DB `(default)` + DB `coordenadasnormativas` confirmadas como existentes. | Firestore → Bases de datos | ✅ COMPLETADO |
| H-F1.4 | 🟡 `.env.local` con todas las variables. **REABIERTO 2026-06-16:** en el equipo de trabajo nuevo (`E:\2CLAUDE\ProjectBook\Web`) NO existe `.env.local`; falta en particular `VITE_GOOGLE_MAPS_API_KEY` (por eso el mapa no carga en `npm run dev`). Recrearlo a partir de `.env.local.example`. | Local / repo | 🟡 PENDIENTE (equipo nuevo) |
| H-F1.5 | ✅ Custom Claim `admin:true` verificado y confirmado (goyogramador@gmail.com, 2026-06-14). | Cloud Shell / Admin SDK | ✅ COMPLETADO |

### 3.2 — Acciones HITL requeridas · Fin de F2 (Theming & UI Base) — `H-F2`

| # | Acción operativa | Dónde | Bloquea si se omite |
|---|---|---|---|
| H-F2.1 | Crear el documento **`config/topTools`** con `{ ids: ['dimensionador','geolocalizador','expediente-dom','hsa'] }`. | Firestore → `config/topTools` | `<TopToolsBar>` arranca vacía. |
| H-F2.2 | Subir las **fuentes self-hosted** (JetBrains Mono, Inter, Lora, Fira Code). | Hosting / `index.html` | Temas washi/matrix caen a fuente de sistema. |

### 3.3 — Acciones HITL requeridas · Fin de F3 (Herramientas Estáticas) — `H-F3`

| # | Acción operativa | Dónde | Bloquea si se omite |
|---|---|---|---|
| H-F3.1 | Poblar **`biblioteca/{recursoId}`** con metadatos + URLs de PDFs. | Firestore → `biblioteca` | T-48 muestra catálogo vacío. |
| H-F3.2 | Subir **PDFs de formularios** a Firebase Storage. | Storage | Los enlaces de descarga apuntan a 404. |
| H-F3.3 | Crear índice compuesto `projectId ASC, createdAt DESC` en subcolecciones. | Firestore → Índices | Queries de historial lanzan `failed-precondition`. |

### 3.4 — Acciones HITL requeridas · Fin de F4 — `H-F4` ⚠️ BLOQUEANTE MAYOR

| # | Acción operativa | Dónde | Bloquea si se omite |
|---|---|---|---|
| H-F4.1 | 🟡 GeoJSON parcialmente desplegados (varias comunas). Pendiente completar las 540. | Firebase Hosting | T-07/T-08 funcionan para comunas desplegadas. |
| H-F4.2 | Confirmar/cargar **`normativas_prc/{comuna}_{zona}`** en DB `coordenadasnormativas`. | Firestore (DB nombrada) | `NormativaService` no resuelve la ficha normativa. |
| H-F4.3 | ✅ API Key Google Maps configurada y operativa. | Google Cloud Console | ✅ COMPLETADO |
| H-F4.4 | ✅ Maps JavaScript API + Geocoding API habilitadas con billing. | Google Cloud → APIs + Facturación | ✅ COMPLETADO |
| H-F4.5 | ✅ `firebase.json` creado (2026-06-14) con `hosting.headers` `/geo-data/**`: `immutable`. Pendiente `firebase deploy --only hosting`. | `firebase.json` | ✅ CREADO — pendiente re-deploy |
| H-F4.6 | 🔧 API Key Gemini lista — ejecutar: `firebase functions:secrets:set GEMINI_API_KEY` | Secret Manager | Pendiente ejecutar comando. |

### 3.5 — Acciones HITL requeridas · Fin de F5 — `H-F5` ⚠️ BLOQUEANTE MAYOR

| # | Acción operativa | Dónde | Bloquea si se omite |
|---|---|---|---|
| H-F5.1 | 🔧 `firestore.rules` CREADA ✅ — **PENDIENTE EJECUTAR:** `firebase deploy --only firestore:rules` | Firebase Console / CLI | **EJECUTAR ANTES DEL PRIMER DEPLOY** |
| H-F5.2 | ⏸ DIFERIDO — Stripe postponed sin fecha. No bloquea el avance. | Firebase Console → Extensiones | — |
| H-F5.3 | ⏸ DIFERIDO — Stripe postponed sin fecha. | Stripe Dashboard | — |
| H-F5.4 | ⏸ DIFERIDO — Stripe postponed sin fecha. | Stripe → Webhooks + Cloud Functions | — |
| H-F5.5 | 🔧 `functions/src/index.ts` CREADO ✅ — **PENDIENTE EJECUTAR:** `cd functions && npm install && npm run build && cd ..`, luego `firebase functions:secrets:set SENDGRID_API_KEY`, `firebase functions:secrets:set GEMINI_API_KEY`, `firebase deploy --only functions`. | Firebase CLI | **EJECUTAR ANTES DE INVITACIONES O BIM** |
| H-F5.6 | 🔧 `firestore.indexes.json` CREADO ✅ (6 índices compuestos) — **PENDIENTE EJECUTAR:** `firebase deploy --only firestore:indexes` | Firestore → Índices | **EJECUTAR ANTES DEL PRIMER DEPLOY** |
| H-F5.7 | 🔧 Instrucciones entregadas (cuenta SendGrid, API Key, domain auth, `firebase functions:secrets:set SENDGRID_API_KEY`). | Proveedor email + Secret Manager | Pendiente configurar. |
| H-F5.8 | Configurar **App Check** (reCAPTCHA). | Firebase Console → App Check | Endpoints expuestos a bots. |
| H-F5.9 | Definir variables de entorno de producción + dominio en Hosting + redirects 301. | Firebase Hosting / Cloud | Links legacy rotos; claves expuestas. |

### 3.6 Apéndice HITL — Índices compuestos previstos (Firestore)

| Query | Campos del índice | Fase |
|---|---|---|
| Proyectos donde soy colaborador | `memberUids` (array) `array-contains` + `updatedAt DESC` | F5 |
| Historial de simulaciones de un proyecto | `createdAt DESC` (subcolección) | F3/F4 |
| Tabla admin de usuarios por plan/estado | `estado ASC, plan ASC, createdAt DESC` | F5 |

---

## 4. MATRIZ DE GATES Y CRITERIOS DE "DONE" POR FASE

| Fase | Criterio técnico de Done | Gate humano (HITL) | Verificación recomendada |
|---|---|---|---|
| F1 | Login real funciona; se crea/lee un proyecto; el router navega entre rutas vacías | `H-F1` (1–5) | Crear cuenta de prueba → crear proyecto → recargar y persiste |
| F2 | Los 4 temas conmutan sin recompilar; Ficha muestra Datos Clave reales; catálogo lista tools | `H-F2` (1–2) | QA visual 4 temas en Pricing/Share/Admin/Ficha |
| F3 | Las 9 tools montan vía lazy; `vite build --report` muestra chunks separados; DocPrint imprime | `H-F3` (1–3) | Test de montaje por tool + revisión del bundle |
| F4 | Geocoding resuelve dirección; polígono dibuja; Turf calcula superficie; ficha PRC aparece | `H-F4` (1–6) ⚠️ | Probar 3 comunas distintas |
| F5 | Suscripción y Pase desbloquean en tiempo real; Rules pasan simulador; compartir invita | `H-F5` (1–9) ⚠️ | Pago test Stripe + simulador Rules + pen-test |

---

## 5. DEPENDENCIAS BLOQUEANTES Y DECISIONES DE ARQUITECTO

### 5.1 Dependencias bloqueantes entre fases

```
[H-F1 infra Firebase] ─BLOQUEA─► F1 ─BLOQUEA─► F2 ─BLOQUEA─► F3
                                                          │
[H-F4 GeoJSON+Maps] ──────────────────BLOQUEA──────────► F4 ─BLOQUEA─► F5
                                                                        ▲
[H-F5 Stripe+Rules+Functions] ──────────────────BLOQUEA────────────────┘
```

Las acciones HITL de F4 (540 GeoJSON, API Key Maps) y F5 (extensión Stripe, índices, Rules) pueden y deben iniciarse en paralelo a fases anteriores.

### 5.2 Decisiones de arquitecto — CERRADAS por la Constitución ✅

| Ref | Decisión | Resolución (Constitución) | Fase |
|---|---|---|---|
| Q-1 | 4.º tema "white" | §1 — se mantienen los 4 temas | F2 |
| Q-2 | Roles de colaboración | §10 — `'editor' \| 'viewer'` + Propietario por `ownerId` | F5 |
| Q-3 | Modelo del Pase | §11 — permanente por `projectId`; colaboradores Free en solo lectura | F5 |
| Q-4 | Superficie del proyecto | §6 — `superficieCalculada` + `superficieManual` + `superficieOrigen` | F2/F4 |
| Q-5 | Ubicación vs Geolocalizador | §4 — separados | F3/F4 |
| Q-6 | BIM activo | §5 — T-17 activo premium | F4 |
| Q-7 | Rol admin | §12 — Custom Claim `token.admin` | F1/F5 |
| Q-8 | Suspensión | §13 — `disabled:true` Admin SDK | F5 |
| Q-9 | Plan por admin | §14 — override `users.compPremium` | F5 |
| Q-10 | Top Tools premium | §2 — candado → Paywall | F2 |
| Q-11 | Persistencia de tema | §1 — `localStorage` + sync async | F2 |
| Q-12 | Top Tools por defecto | §2 — `dimensionador,geolocalizador,expediente-dom,hsa` | F2 |
| Q-13 | Feedback | §16 — email a admin + respaldo `feedback` | F5 |
| Q-14 | Textos legales | §17 — borradores reales `/legal/*` | F5 |
| Q-15 | Tope Premium | §15 — 50, frontend + Rules | F5 |

---

## 6. SIGUIENTE SUBTAREA SUGERIDA

> **⟲ Actualizado v1.5 (2026-06-14).** F1 completo. Auth UX overhaul completo. Sandbox local para invitados activo.

### 6.1 ACCIÓN INMEDIATA — Ejecutar HITL pendiente (terminal, sin código)

Antes de escribir una sola línea más de código, ejecutar los despliegues de infraestructura que están listos pero sin correr:

```bash
# Desde E:\2CLAUDE\ProjectBook\Web

# 1. Reglas de Firestore (zero-trust)
firebase deploy --only firestore:rules

# 2. Índices compuestos (6 queries complejas)
firebase deploy --only firestore:indexes

# 3. Functions: build + secrets + deploy
cd functions && npm install && npm run build && cd ..
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions

# 4. Hosting (CDN headers para GeoJSON)
firebase deploy --only hosting
```

### 6.2 PRIMER SPRINT DE CÓDIGO — F3: Migración de herramientas a `Archibots/Archibots/`

**Carpeta objetivo:** `E:\2CLAUDE\ProjectBook\Web\src\tools\`

El `registry.ts` actual sólo tiene 4 herramientas registradas: `geolocalizador`, `propuesta`, `hsa`, `contratos`. Las siguientes herramientas están `active` en el catálogo pero no tienen implementación en el proyecto correcto:

| Herramienta | id catálogo | Fuente de referencia | Prioridad |
|---|---|---|---|
| Dimensionador de Proyecto | `dimensionador` | `remix_-archibots---dimensionador-de-proyecto/` | 🔴 Alta (Top Tool) |
| Expediente Municipal | `expediente-dom` | `archibots---expediente-municipal/` | 🔴 Alta (Top Tool) |
| Participantes | `participantes` | `GestorViews.tsx` del Mockup | 🟡 Media |
| Datos del Proyecto | `datos-proyecto` | `GestorViews.tsx` del Mockup | 🟡 Media |
| Seguimiento de Obras | `seguimiento` | `GestorViews.tsx` del Mockup | 🟡 Media |
| Ubicación | `ubicacion` | `GestorViews.tsx` del Mockup | 🟡 Media |
| Mapa de Terreno | `mapa-terreno` | `MapaTerrenoView.tsx` del Mockup | 🟠 Media-alta |
| BIM Wizard | `bim-wizard` | `BimWizardView.tsx` del Mockup | 🔵 Premium |
| Formularios Municipales | `form-municipales` | `BibliotecaView.tsx` del Mockup | 🔵 Biblioteca |

**Primera tarea concreta del próximo sprint:**
`F3-NEXT.1` — Migrar `DimensionadorView` al proyecto correcto:
1. Leer `remix_-archibots---dimensionador-de-proyecto/src/App.tsx` para extraer la lógica del componente.
2. Crear `Archibots/Archibots/src/tools/DimensionadorView.tsx` adaptando imports a estáticos + types correctos (`Plan='Free'|'Premium'`).
3. Agregar entrada en `registry.ts`: `dimensionador: lazy(() => import('../tools/DimensionadorView'))`.
4. Validar con esbuild y cp (>100 líneas).

> **Regla de migración:** Todo lo que viene del mockup usa imports dinámicos `await import('firebase/...')` y tipos minúsculos `'free'|'premium'`. El proyecto correcto usa imports estáticos `import { auth, db } from '../core/firebase'` y tipos capitalizados `'Free'|'Premium'`. Ajustar antes de copiar.

---
*Documento v1.5 (2026-06-14). Cambios v1.4: proyecto único archibots-497423; Stripe ⏸ DIFERIDO; creados firebase.json, .firebaserc, firestore.indexes.json, functions/tsconfig.json; H-F1.1–H-F1.4 ✅. Cambios v1.5: carpeta raíz correcta `Archibots/Archibots/`; H-F1.5 ✅ Custom Claim admin verificado; F1 completo ✅; Auth UX overhaul ✅ (sandbox invitados, AuthModal overlay, StatusBar guest UX); HITL deploy pendiente ejecutar (rules, indexes, functions, secrets).*


---

## ✅ ESTADO DE EJECUCIÓN — Actualización 2026-06-18

### Sprint 1 — Estabilización: **100% COMPLETADO**
- **Higiene y build:** `.gitignore`; `tsconfig` con `strict:true` + `noUncheckedIndexedAccess`; `firebase-admin` y `@tailwindcss/vite` removidos del frontend; `@types/google.maps` como devDependency. `tsc -b` y `vite build` en verde.
- **Base de datos:** `firebase.ts` apunta a `(default)` vía `initializeFirestore(app, { ignoreUndefinedProperties: true })`; alias `default/dev/prod` en `.firebaserc`.
- **Reglas Zero-Trust (`firestore.rules`):** corregidos `hasPase(projectId)`, lectura acotada de `invitations`, casing de `isActive` (`'Suspendido'`) e `isPremium` (`'Premium'`); whitelisting de la subcolección `toolData`.
- **Cloud Functions:** `apiProxy`/`setUserState` leen el claim ya decodificado (sin `verifyIdToken`); `onProjectDeleted` borra las 8 subcolecciones con `Promise.all`.
- **Auto-Aprovisionamiento:** `AuthProvider` crea `users/{uid}` en el primer login (escritura no bloqueante).
- **ownerId autoritativo:** `CloudProjectRepository.save()` fija el `uid` de Firebase Auth vivo en la creación (el proyecto nunca nace huérfano).
- **Google Maps funcional:** migración a la API funcional `setOptions()` / `importLibrary()` (clase `Loader` removida) y reemplazo del `DrawingManager` (eliminado en v3.65) por un `Polygon` editable + click-to-add con recálculo de área en el Web Worker (Turf).

### Fase 2 — Refactorización de Persistencia (`useToolData`): **AVANZADA**
Hook único `src/hooks/useToolData.ts` (nube Premium `projects/{id}/toolData/{toolId}` / `localStorage` Free, con degradación robusta). Herramientas con el boilerplate manual de carga/guardado **eliminado y centralizado**:
- ✅ `DatosProyectoView` (PoC) · `EmisorEstadoPagoView` · `CuadroSuperficiesView`
- ✅ `CalculadoraCargaOcupacionView` · `CalculadoraConstruccionesMinvuView`
- ✅ `ListadoDocumentosView` · `DimensionadorView` · `DimensionadorPublicosView`
- ⏳ `SeguimientoObrasView`: su bitácora es una **colección** Firestore (un documento por entrada, con `orderBy`), incompatible con el modelo de blob único de `useToolData` → requiere un enfoque dedicado. (Nota: no existe `BitacoraView.tsx`; esa funcionalidad vive en `SeguimientoObrasView`.)

`tsc -b` validado en verde tras cada lote.


---

## 🍱 ACTUALIZACIÓN 2026-06-18 — Bloque normativo + UX del Workspace

- **Contingencia paramétrica normativa (Cerebro Normativo):** `GeolocalizadorView` ahora hidrata una **ficha ESTIMADA por defecto** (`fichaEstimada`) cuando la zona se detecta geométricamente pero aún no hay documento sembrado en `normativas_prc` (la base `(default)` de producción está vacía). Parámetros estándar: constructibilidad 2.0, coef. ocupación de suelo 0.6, altura máx. 10,5 m (~3 pisos), agrupamiento aislado/pareado, etc. La ficha se marca **explícitamente como ESTIMADA / no oficial** (zona_nombre, descripción y fuente) para no inducir a error en un expediente formal; permite probar el flujo visual completo del expediente sin cargar previamente los ~540 JSON normativos.
- **Botón de acción rápida `[ AGREGAR AL PROYECTO ]`:** incorporado en la barra de contraste inferior del Workspace, junto a `[ GUARDAR FICHA ]`. Es **dinámico**: si la herramienta abierta en el `ToolHost` ya pertenece a `addedTools`, se renderiza deshabilitado como `[ ✓ EN EXPEDIENTE ]`; si no, dispara `addTool(projectId, toolId)` del `ProjectProvider` y mueve el foco del Archivador a la carpeta de la herramienta.
- **Inversión geométrica del Workspace 3-col (solo CSS):** nuevo flujo horizontal Izq→Der = **Área dinámica (`ToolHost`) · Catálogo (`ToolCatalog`) · Archivador (`BinderFicha` + Mis Proyectos + Avance del Expediente)**. Se conservan **exactamente** los anchos/proporciones (1.35fr / 392px / 1.05fr), reasignados vía `grid-column` sin alterar el DOM ni la persistencia; breakpoints (≤1040px, ≤680px) actualizados en consecuencia.

`tsc -b` y `vite build` validados en verde.
