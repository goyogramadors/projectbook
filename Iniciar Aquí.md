# 🚀 INICIAR AQUÍ — Memoria del Proyecto Archibots / Project_Book

> **Para nuevas instancias de Claude:** lee este documento completo antes de tocar nada.
> Contiene (1) qué es el proyecto, (2) dónde está cada cosa, (3) cómo se despliega a la web,
> (4) las reglas obligatorias de desarrollo. Si algo no está aquí, está en los documentos
> enlazados en la sección §7. **No re-explores el árbol a ciegas: usa el mapa.**
>
> **Última actualización:** 2026-06-22 · **Repositorio:** `E:\2CLAUDE\ProjectBook` · **Raíz de la SPA:** `E:\2CLAUDE\ProjectBook\Web`

---

## 0. Estructura del repositorio (dos ramas)

El proyecto se divide en dos carpetas, **ambas versionadas en un único repositorio Git** cuya raíz es `E:\2CLAUDE\ProjectBook` (ahí viven `.git` y `.gitignore`):

```
E:\2CLAUDE\ProjectBook\          ← raíz del repo (.git, .gitignore, Iniciar Aquí.md)
├── DESARROLLO\                  ← documentación y material de diseño (todos los .md)
│   ├── GUIA_GITHUB_Y_DEPLOY.md  · MAPA_ARQUITECTURA_PROYECTO.md
│   ├── INFORME_AUDITORIA_ARQUITECTURA.md · PLAN_ACCION_MAESTRO_PRODUCCION.md
│   ├── PLAN_REFACTORIZACION_SPA.md · PROMPT_MAESTRO_HERRAMIENTA.md
│   ├── Tintero - Pendientes.md
│   ├── LOD y COD\                       (specs: Carpeta/Libro de Obras Digital)
│   ├── files ruta accesible\            (specs: Memoria Ruta Accesible)
│   ├── files informe termico\          (specs: Informe Norma Térmica)
│   ├── files subsuelo\                  (specs: Informe de Subsuelo)
│   └── Mockup\                          (referencia UX/CSS — DEPRECATED para código)
└── Web\                         ← LA SPA PRODUCTIVA (lo que se despliega)
    ├── src\  · functions\  · public\  · scripts\  · dist\
    ├── firebase.json · .firebaserc · firestore.rules · .env.local
    └── package.json · vite.config.ts · index.html
```

**Regla de oro de rutas:**
- Comandos **Git** → desde la **raíz** `E:\2CLAUDE\ProjectBook` (versiona DESARROLLO + Web juntas).
- Comandos **`npm` y `firebase`** → desde **`E:\2CLAUDE\ProjectBook\Web`** (ahí está `package.json` y `firebase.json`).
- Las rutas de código de este documento (`src/...`, `functions/...`) son **relativas a `Web\`**.

---

## 1. Qué es este proyecto

**Archibots** (rotulado en la web como **Project_Book — Gestión Documental**) es una **SPA web para organizar la información de proyectos de arquitectura y construcción**. Funciona como un "expediente digital" donde cada proyecto tiene una ficha maestra y un set de **herramientas** (calculadoras, generadores de documentos, geolocalizador normativo, etc.) que el usuario agrega a carpetas temáticas.

Está **en producción y funcionando**. El rol de cualquier sesión de desarrollo es **agregar valor sin romper la base existente**, implementando el modelo **"Dos Cerebros"**:

- **Cerebro Espacial** — cálculo geográfico con `@turf/turf` aislado en un **Web Worker** (`src/workers/geo.worker.ts`). Hace intersecciones punto↔polígono y cálculo de áreas.
- **Cerebro Normativo** — base de datos Firestore nombrada `coordenadasnormativas` que devuelve la ficha normativa (PRC) según la zona. Desacoplado del cerebro espacial.

La **"Coreografía de Conexión"** (flujo de 4 pasos) une ambos cerebros:
`GeolocalizadorView` → `GeoJsonService` (CDN + IndexedDB) → `geo.worker` (Turf `intersect`) → `NormativaService` (DB `coordenadasnormativas`) → **ficha PRC**.

---

## 2. Stack tecnológico (NO cambiar sin autorización)

| Capa | Tecnología |
|---|---|
| UI | **React 19** + **framer-motion** (animaciones) + **lucide-react** (íconos) |
| Build / dev | **Vite 6** — `npm run dev` · `npm run build` (= `tsc -b && vite build`) |
| Lenguaje | **TypeScript estricto** — `import type { X }` **obligatorio** (si falta, pantalla en blanco con Vite/oxc) |
| Estilos | CSS propio `src/archibots.css` (tokens shadcn + **4 temas**); Tailwind base-only, sin compiler |
| Backend | **Firebase 12** — Auth, Firestore **multi-DB**, Storage, Cloud Functions (Node 20) |
| Routing | **react-router-dom v7** (`createBrowserRouter`) |
| Geo | **@turf/turf** (en Web Worker) + **@googlemaps/js-api-loader** (carga runtime del SDK) |
| Patrón clave | **Lazy Loading total** — cada herramienta es `React.lazy(() => import())` en `registry.ts` (un chunk por tool) |
| Patrón clave | **"Dos Cerebros"** — Espacial (Turf/Worker) + Normativo (DB nombrada), desacoplados |

---

## 3. Dónde está todo (mapa rápido)

> El índice estructural **completo y autoritativo** es **`MAPA_ARQUITECTURA_PROYECTO.md`**. Úsalo como primera fuente para ubicar archivos. Lo de abajo es el resumen de orientación.

### Núcleo (`src/core/`) — lógica, datos, auth, routing
- `firebase.ts` — init de Firebase desde `import.meta.env.VITE_FIREBASE_*`
- `router.tsx` — rutas con lazy + guards `requireAuth` / `requireAdmin`
- `types.ts` — **contratos canónicos** (`ProjectMaster`, `CatalogTool`, `ToolProps`, `NormativaPRC`…). Tipos centralizados aquí.
- `catalog.ts` — metadata de presentación (`FOLDERS`, `CATALOG[]`, `TOP_TOOLS_DEFAULT`). **No** implementa herramientas.
- `registry.ts` — une catálogo + componente lazy (`LAZY_COMPONENTS`). **Único** lugar con los `import()` de cada tool.
- `useAccess.ts` — gating central del paywall (`AccessMode` = `edit` / `read` / `locked`)
- `NormativaService.ts` — Cerebro Normativo (DB `coordenadasnormativas`, llave `{comuna}_{zona}`)
- `GeoJsonService.ts` — carga GeoJSON PRC desde CDN `/geo-data/` + caché IndexedDB
- `db/ProjectRepository.ts` — persistencia **Cloud (Premium)** / **Local (Free)**
- `AdminService.ts` · `ShareService.ts` · proveedores en `auth/`, `db/`, `theme/`, `ui/`

### Carcasa y herramientas
- `src/AppShell.tsx` — carcasa persistente (header, statusbar, `<Outlet>`, footer, TopToolsBar)
- `src/components/` — bloques del shell (BinderFicha, ToolCatalog, ToolHost, StatusBar, etc.)
- `src/tools/` — **una herramienta por archivo** (20 activas hoy), montadas vía `registry.ts`
- `src/views/` — páginas montadas por el router (HomeView, WorkspaceView, AdminDashboard, PricingView…)
- `src/workers/geo.worker.ts` — Cerebro Espacial (Turf)

### Configuración y backend (en `Web\`, raíz de la SPA)
- `firebase.json` — Hosting (`public: dist`) + Firestore multi-DB (2 targets) + Functions
- `.firebaserc` — proyectos: `prod`/`default` = **`archibots-497423`**, `dev` = **`archibots-dev`**
- `firestore.rules` — reglas zero-trust DB `(default)`
- `firestore.coordenadasnormativas.rules` — reglas DB nombrada (lectura con auth, escritura prohibida)
- `firestore.indexes.json` — índices compuestos
- `functions/src/index.ts` — Cloud Functions: `onProjectDeleted`, `sendInviteEmail`, `sendPremiumInviteEmail`, `apiProxy` (BIM), `setUserState`
- `scripts/` — administración/migración de datos (`migrate-projects.mjs`, `seed-normativas.mjs`)
- `public/geo-data/` — GeoJSON PRC por comuna (servido como CDN)
- `public/Biblioteca/` — formularios MINVU en PDF
- `.env.local` — claves `VITE_*` (**NUNCA se versiona**; ver §5)

---

## 4. Cómo se sube el proyecto a la web (despliegue)

> **Nota de nomenclatura:** el frontend NO está en "Firestore pages". Está en **Firebase Hosting** (servicio de hosting de Firebase). El backend son **Cloud Functions**. Ambos en el proyecto Firebase `archibots-497423`.
>
> ⚠️ **Todos los comandos `npm` y `firebase` de abajo se ejecutan desde `E:\2CLAUDE\ProjectBook\Web`** (ahí están `package.json` y `firebase.json`). El paso a paso completo está en `DESARROLLO/GUIA_GITHUB_Y_DEPLOY.md`.

### Frontend (Firebase Hosting)
1. Se compila el sitio: `npm run build` → genera la carpeta `dist/`.
2. Se publica: `firebase deploy --only hosting` → sube `dist/` a Firebase Hosting.
3. Hosting reescribe todo a `/index.html` (SPA) y cachea `/geo-data/**` por 1 año (immutable).

### Backend (Cloud Functions)
1. `cd functions && npm install && npm run build` (compila TS → `lib/`).
2. `firebase deploy --only functions`.
3. Secretos vía `firebase functions:secrets:set <NOMBRE>` (p. ej. `SENDGRID_API_KEY`, claves de IA para `apiProxy`). **Nunca** en código.

### Reglas e índices Firestore
- `firebase deploy --only firestore:rules`
- `firebase deploy --only firestore:indexes`

> El procedimiento detallado, comando por comando, está en **`GUIA_GITHUB_Y_DEPLOY.md`** (entregable hermano de este documento).

---

## 5. Bases de datos, almacenamiento, claves y respaldos

### Bases de datos (Firestore multi-DB)
- **`(default)`** — proyectos del usuario y subcolecciones (datos de cada herramienta para usuarios Premium). Protegida por `firestore.rules` (zero-trust, validación `request.auth.uid`).
- **`coordenadasnormativas`** — Cerebro Normativo: fichas PRC por zona. Lectura con auth, **escritura prohibida** desde cliente.

### Almacenamiento de datos de herramientas
- **Premium:** subcolección Firestore por proyecto.
- **Free:** `localStorage` con clave `ab-<toolId>-${projectId}`.
- **Master del proyecto:** documento ligero (<5 KB) en `ProjectRepository`.

### Storage
- Firebase Storage para archivos asociados (según herramienta).

### Datos estáticos servidos
- `public/geo-data/*.json` — GeoJSON PRC (CDN).
- `public/Biblioteca/*.pdf` — formularios MINVU.

### Claves / secretos
- Frontend: variables `VITE_*` en `.env.local` (Firebase + `VITE_GOOGLE_MAPS_API_KEY`). Plantilla: `.env.local.example`.
- Backend: secretos de Functions vía `firebase functions:secrets:set`.
- `.gitignore` ya excluye `.env*` y `*.local` — **las claves nunca llegan a GitHub**.

### ⚠️ Respaldos — PENDIENTE (no definido hoy)
**Actualmente NO existe un mecanismo de respaldo formal de las bases de datos ni de Storage.** Esto es un riesgo abierto. Estrategia propuesta (a confirmar con Andrés):
- Exports programados de Firestore a un bucket de Cloud Storage (Scheduled exports / `gcloud firestore export`), una rutina para cada DB (`(default)` y `coordenadasnormativas`).
- Versionado del código en GitHub (ver guía hermana) como respaldo del **código fuente** — esto NO respalda los datos de usuarios.
- Definir retención (p. ej. diario 7 días + semanal 4 semanas).

> Cuando se defina, documentarlo aquí y mover este punto al §7 del Tintero a "resuelto".

---

## 6. Herramientas nuevas planificadas (mockups en preparación)

Andrés tiene preparados los mockups de **5 herramientas nuevas** que se incorporarán al `src/tools/` siguiendo el patrón existente (registro en `registry.ts` + metadata en `catalog.ts`, lazy load, `types.ts` centralizado). Al momento de escribir este documento **aún no están subidas a la carpeta** — se documentan aquí como planificadas:

1. **Carpeta Digital** — repositorio documental estructurado del proyecto (expediente digital).
2. **Libro de Obras Digital** — bitácora digital de obra (registro de avances, instrucciones, observaciones).
3. **Generador de Memoria de Ruta Accesible** — informe de cumplimiento de accesibilidad universal.
4. **Generador de Informe Norma Térmica** — informe de cumplimiento de la reglamentación térmica.
5. **Generador de Informe de Subsuelo** — informe técnico de subsuelo.

> Cuando los mockups estén en la carpeta, leerlos, adaptar imports + tipos al stack productivo (no copiar patrones del `Mockup/` deprecado) y registrarlos. Actualizar esta sección con el `toolId` y archivo real de cada una.

---

## 7. Documentos de referencia del proyecto (dónde seguir leyendo)

| Documento | Para qué |
|---|---|
| **`MAPA_ARQUITECTURA_PROYECTO.md`** | Índice estructural definitivo: árbol completo, rol de cada archivo, flujos esenciales. **Fuente primaria de ubicación.** |
| **`INFORME_AUDITORIA_ARQUITECTURA.md`** | Auditoría del repositorio (estado, hallazgos, deuda técnica). |
| **`PLAN_ACCION_MAESTRO_PRODUCCION.md`** | Plan de acción a producción (hitos, sprints, HITL pendientes). |
| **`PLAN_REFACTORIZACION_SPA.md`** | Plan de refactorización de la SPA. |
| **`PROMPT_MAESTRO_HERRAMIENTA.md`** | Plantilla/patrón para crear nuevas herramientas. |
| **`GUIA_GITHUB_Y_DEPLOY.md`** | Cómo versionar en GitHub y cómo desplegar backend/frontend. |
| **`Tintero - Pendientes.md`** | Lista viva de pendientes funcionales y de UX. |
| **`Mockup/mockup-archibots/`** | ⚠️ Referencia **solo de UX/CSS**. **DEPRECATED para código** (imports dinámicos, tipos en minúscula, estructura monolítica — no trasladar). |

---

## 8. INSTRUCCIONES DE DESARROLLO (obligatorias)

> Estas reglas existen porque el proyecto está **en producción y funciona**, y para **economizar tokens**. Aplícalas en toda interacción de código, sin recordárselas al usuario.

### Contexto de rol
Actúa como **Senior Full-Stack Engineer** sobre un entorno **de producción ya funcional** (React 19, TS estricto, Tailwind, Firebase, Turf.js). Implementa el modelo **"Dos Cerebros"** sin romper la base.

### Reglas obligatorias de seguridad y economía de tokens

1. **MODO SILENCIOSO (cero explicaciones).** Sin saludos, despedidas ni teoría larga sobre cómo funciona el código. Entrega solo el código solicitado. Si necesitas una aclaración técnica, ponla como **comentario breve dentro del propio código**.

2. **EDICIÓN QUIRÚRGICA (no reescribir archivos completos).** El código actual funciona. **Bajo ninguna circunstancia** reescribas un componente o archivo entero salvo petición explícita. Entrega solo los fragmentos nuevos, los imports necesarios o el bloque exacto a reemplazar. Usa marcadores `// ... código existente ...` para indicar dónde va la inserción.

3. **RESPETA LA ARQUITECTURA EXISTENTE.** No inventes ni sugieras nuevas dependencias, librerías de UI ni patrones de estado. Usa exclusivamente lo del stack: `framer-motion`, `lucide-react`, clases atómicas de Tailwind, `types.ts` centralizado.

4. **SEGURIDAD ZERO-TRUST.** No alteres las reglas de Firestore ni las validaciones de `request.auth.uid` que ya protegen la base de datos.

5. **PREGUNTA ANTES DE BORRAR.** Si detectas que un bloque actual interfiere con la nueva "Coreografía de Conexión" de 4 pasos, **no asumas que debes borrarlo**: indica el conflicto en una sola línea y espera confirmación.

### Reglas técnicas heredadas (por el stack)
- `import type { X }` o `{ type X }` **obligatorio** para Vite/oxc (su ausencia produce pantalla en blanco).
- El `db` normativo usa **Firestore DB nombrada** (`coordenadasnormativas`), no `(default)`.
- Archivos grandes (>100 líneas): trabajar en scratch (`/outputs/`), validar con esbuild (`transformSync` loader `tsx`) y luego copiar — el montaje puede truncar ediciones directas largas.
- Cada herramienta nueva: registrar en `registry.ts` + `catalog.ts`, lazy load, tipos en `types.ts`.

---

## 9. Cómo usar este documento en una nueva instancia de Claude

Al iniciar una sesión nueva, basta con indicar:

> "Lee **`Iniciar Aquí.md`** en la raíz del proyecto y trabaja según esas instrucciones."

Eso carga el contexto del proyecto, la ubicación de la información, el flujo de despliegue y las reglas de desarrollo.
