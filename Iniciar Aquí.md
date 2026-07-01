# 🚀 INICIAR AQUÍ — Memoria del Proyecto Archiblocks

> **Para nuevas instancias de Claude:** lee este documento completo antes de tocar nada.
> Contiene (1) qué es el proyecto, (2) dónde está cada cosa, (3) cómo se despliega a la web,
> (4) las reglas obligatorias de desarrollo. Si algo no está aquí, está en los documentos
> enlazados en la sección §7. **No re-explores el árbol a ciegas: usa el mapa.**
>
> 🗒️ **OBLIGATORIO — BITÁCORA:** todo lo que se realice en CADA sesión debe quedar escrito en
> **`Last Update.md`** (raíz del repo): fecha, hora, detalle de lo hecho, archivos tocados y
> pendientes generados/resueltos. Es el reporte de estado que se entrega a la siguiente instancia.
>
> **Última actualización:** 2026-06-30 · **Repositorio:** `C:\G\Archiblocks` · **Raíz de la SPA:** `C:\G\Archiblocks\Web`

---

## 0. Estructura del repositorio (dos ramas)

El proyecto se divide en dos carpetas, **ambas versionadas en un único repositorio Git** cuya raíz es `C:\G\Archiblocks` (ahí viven `.git` y `.gitignore`):

```
C:\G\Archiblocks\          ← raíz del repo (.git, .gitignore, Iniciar Aquí.md)
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
- Comandos **Git** → desde la **raíz** `C:\G\Archiblocks` (versiona DESARROLLO + Web juntas).
- Comandos **`npm` y `firebase`** → desde **`C:\G\Archiblocks\Web`** (ahí está `package.json` y `firebase.json`).
- Las rutas de código de este documento (`src/...`, `functions/...`) son **relativas a `Web\`**.

---

## 1. Qué es este proyecto

**Archiblocks** (rotulado en la web como **Archiblocks — Gestión Documental**) es una **SPA web para organizar la información de proyectos de arquitectura y construcción**. Funciona como un "expediente digital" donde cada proyecto tiene una ficha maestra y un set de **herramientas** (calculadoras, generadores de documentos, geolocalizador normativo, etc.) que el usuario agrega a carpetas temáticas.

Está **en producción y funcionando**. El rol de cualquier sesión de desarrollo es **agregar valor sin romper la base existente**, implementando el modelo **"Dos Cerebros"**:

- **Cerebro Espacial** — cálculo geográfico con `@turf/turf` aislado en un **Web Worker** (`src/workers/geo.worker.ts`). Hace intersecciones punto↔polígono y cálculo de áreas.
- **Cerebro Normativo** — `NormativaService.ts` resuelve la ficha normativa (PRC) por zona desde **archivos estáticos locales `/norma-data/*.json`** (llave `{region}_{comunaSlug(comuna)}` vía `NormativaService.comunaSlug`). **Multi-región:** el código de región (2 díg., ej. `13`, `05`) se **deriva de la comuna** con `data-chile.getCodigoRegionDeComuna` (fallback `13`), tanto en `NormativaService` como en `GeoJsonService`. Convención de archivos: norma-data `public/norma-data/{cod}_{comunaSlug SIN espacios ni tildes}.json` (ej. `13_lareina.json`, `05_algarrobo.json`); geo-data `public/geo-data/{cod}_PRC_{Comuna_Title_Case}.json`. Desacoplado del cerebro espacial. ⚠️ *Legado:* la DB Firestore `coordenadasnormativas` y `core/geoUtils.generarLlaveMaestra` quedaron sin uso en el runtime; la implementación vigente es la de archivos locales.

> 🧱 **Terminología — el "Block":** cuando el usuario dice **"el Block"** se refiere al **elemento isométrico del header que representa una construcción** (el SVG de bloques/edificio) y que funciona como **navegador con accesos directos a las secciones de la página**. Componente: `src/components/ArchiblocksNav.tsx` + escena `src/components/archiblocks-scene.html` (Archiblocks). El producto "Libro de Obra Digital" usa una escena de Block **reducida y en archivo aparte** (`librodeobra-scene.html`). Cualquier referencia futura a "el Block" apunta a este elemento.

La **"Coreografía de Conexión"** (flujo de 4 pasos) une ambos cerebros:
`GeolocalizadorView` → `GeoJsonService` (Hosting `/geo-data` + IndexedDB) → `useCerebroNormativo` (Turf `booleanPointInPolygon` + snap por distancia) → `NormativaService` (`/norma-data/*.json` local) → **ficha PRC**.

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
- `NormativaService.ts` — Cerebro Normativo (archivos locales `/norma-data/*.json`, llave `{region}_{comunaSlug(comuna)}`)
- `GeoJsonService.ts` — carga GeoJSON PRC desde Hosting `/geo-data/` + caché IndexedDB
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
- `functions/src/index.ts` — Cloud Functions: `onProjectDeleted`, `sendInviteEmail`, `sendPremiumInviteEmail` (PRE-CREA la cuenta del invitado Premium + envío de correo best-effort), `activateMyAccount` (el invitado activa su propia cuenta Pendiente→Activo al 1er ingreso; el cliente la llama tras autenticarse), `apiProxy` (BIM). ⚠️ `setUserState` quedó **huérfana** (no existe en el código; suspender/activar se hace por `updateDoc` directo en `AdminService`).
- `scripts/` — administración/migración de datos (`migrate-projects.mjs`, `seed-normativas.mjs`)
- `public/geo-data/` — GeoJSON PRC por comuna (servido como CDN)
- `public/Biblioteca/` — formularios MINVU en PDF
- `.env.local` — claves `VITE_*` (**NUNCA se versiona**; ver §5)

---

## 4. Cómo se sube el proyecto a la web (despliegue)

> **MODELO MENTAL (no olvidar):**
> - **Frontend** (el sitio compilado, `dist/`) → **Cloudflare Pages**. Es el host real que ven los usuarios. Se publica **cada vez que cambia el código de la app**.
> - **Backend** (reglas Firestore, reglas Storage, Cloud Functions) → **Firebase** (`archibots-497423`).
> - ⚠️ **Firebase Hosting NO se usa.** Existe `hosting` en `firebase.json` y la URL `archibots-497423.web.app`, pero es **secundaria/sin uso**. Un `firebase deploy --only hosting` sube a esa URL Firebase, **no** actualiza el sitio real (Cloudflare). No lo uses para publicar el frontend.
>
> ⚠️ Los comandos `npm` se ejecutan desde `C:\G\Archiblocks\Web`; los `git` desde la raíz `C:\G\Archiblocks`. El paso a paso completo está en `DESARROLLO/GUIA_GITHUB_Y_DEPLOY.md`.

### Frontend (Cloudflare Pages) — proyecto `projectbook`, conectado a GitHub
El proyecto `projectbook` está **conectado al repo `goyogramadors/projectbook`** (rama `main`, *Automatic deployments: Enabled*). Dominios: **`archibots.cl`** + `projectbook-8qt.pages.dev`. `Web/public/_redirects` (`/*  /index.html  200`) hace la reescritura SPA.

**Publicar = hacer `git push`.** Cada push a `main` dispara un build en Cloudflare (`npm run build` dentro de `Web/`) y publica solo. **No** se arrastra `dist/` (eso fue el método viejo de Direct Upload, ya obsoleto). Encaja con `/Basepro Terminar`.

Build configuration del proyecto (ya seteada; documentada por si hay que recrearla): **Root directory** = `Web` · **Build command** = `npm run build` · **Output** = `dist`. Variables `VITE_*` cargadas en Cloudflare (Settings → Variables and secrets, Production) porque no se versionan (§5).

⚠️ **Firebase Hosting sin uso.** `firebase deploy --only hosting` sube a `archibots-497423.web.app`, que **no** es el sitio real. No lo uses para el frontend.

### Scripts `.bat` de publicación (raíz del repo) — USAR ESTOS PARA SUBIR

Andrés publica con archivos `.bat` en la raíz `C:\G\Archiblocks` (doble clic). Cada `.bat` de git
**borra primero los `.lock` residuales** (`index.lock`, `HEAD.lock`, etc.) para que git no se trabe:

| Archivo | Qué hace |
|---|---|
| **`1 - Actualizar Reglas Firestore.bat`** | `firebase deploy --only firestore:rules` (desde `Web/`). |
| **`2 - Commit y Push (main).bat`** | Limpia locks → `git add -A` → `git commit` (pide mensaje) → `git push origin main`. Publica el **frontend** (Cloudflare construye solo). |
| **`3 - Actualizar Reglas + Commit y Push.bat`** | Hace 1 y 2 en orden (reglas y luego push). Úsalo cuando cambiaron **reglas + código**. |
| **`4 - Verificar Build Local (antes de subir).bat`** | `npm run build` (lo mismo que Cloudflare). Para detectar errores ANTES de subir. |
| **`5 - Desbloquear Git (borrar locks).bat`** | Solo borra los `.lock` de `.git` cuando git dice "index.lock already exists". |

> **Regla para instancias de Claude (cierre de sesión):** NO ofrezcas hacer tú el commit/push.
> Al terminar, **indícale a Andrés cuál `.bat` accionar** según lo que cambió:
> solo código → `2`; solo reglas → `1`; reglas + código → `3`; ante dudas de compilación → `4` primero.

### Backend (Cloud Functions)
1. `cd functions && npm install && npm run build` (compila TS → `lib/`).
2. `firebase deploy --only functions`.
3. Secretos vía `firebase functions:secrets:set <NOMBRE>` (p. ej. `SENDGRID_API_KEY`, claves de IA para `apiProxy`). **Nunca** en código.

### Reglas e índices Firestore (y Storage)
- `firebase deploy --only firestore:rules`
- `firebase deploy --only firestore:indexes`
- `firebase deploy --only storage` — **reglas de Storage** (`storage.rules`, adjuntos de Obra Digital). Requerido tras habilitar adjuntos reales (2026-06-23).

> El procedimiento detallado, comando por comando, está en **`GUIA_GITHUB_Y_DEPLOY.md`** (entregable hermano de este documento).

---

## 5. Bases de datos, almacenamiento, claves y respaldos

### Bases de datos (Firestore multi-DB)
- **`(default)`** — proyectos del usuario y subcolecciones (datos de cada herramienta). ⟲ **2026-06-30:** persiste para **TODO usuario LOGUEADO** (Free o Premium); el almacenamiento local queda solo para invitados/no logueados. Protegida por `firestore.rules` (zero-trust, validación `request.auth.uid`). Topes por plan: Free=5 · Premium=50 proyectos.
- **`coordenadasnormativas`** — Cerebro Normativo: fichas PRC por zona. Lectura con auth, **escritura prohibida** desde cliente.

### Almacenamiento de datos de herramientas (⟲ modelo 2026-06-30)
- **Usuario logueado (Free o Premium):** subcolección Firestore por proyecto (`toolData/{toolId}`, `volumen`, `libroObras`, `carpetaDigital`, `normativa`…). **Nube para todos los logueados.**
- **Invitado / no logueado:** `localStorage` con clave `ab-<toolId>-${projectId}` (sandbox de exploración). Único caso de persistencia local.
- **Master del proyecto:** documento ligero (<5 KB) en `ProjectRepository` (nube si logueado, local si invitado).
- **Diferenciación Premium:** herramientas premium (Informe Térmico, Libro/Carpeta de Obra, BIM), **colaboración** (invitar miembros, Premium-only en reglas) y **mayor cupo** (50 vs 5).

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

## 6. Herramientas nuevas (5) — INTEGRADAS a producción (2026-06-23)

Las **5 herramientas nuevas** ya están **incorporadas y cableadas** (`registry.ts` lazy + `catalog.ts` `estado:'active'`, tipos en `types.ts`), con **persistencia real** y avance del expediente (`ProjectMaster.toolStates[toolId]`). Modelo de persistencia decidido (HITL 2026-06-23):

| Herramienta | `toolId` | Archivo (`src/tools/`) | Tier | Persistencia |
|---|---|---|---|---|
| Informe de Subsuelo | `informe-suelo` | `InformeSubsueloView.tsx` | free | `useToolData` → `toolData/informe-suelo` |
| Memoria de Ruta Accesible | `accesibilidad` | `RutaAccesibleView.tsx` | free | `useToolData` → `toolData/accesibilidad` |
| Informe Norma Térmica | `informe-termico` | `InformesTermicosView.tsx` | premium | `useToolData` → `toolData/informe-termico`. **Acredita CUMPLE/NO CUMPLE** contra Tabla 1 RT oficial (motor en Web Worker `termico.worker.ts` + `termico/tablas.ts`+`engine.ts`) |
| Libro de Obras Digital | `libro-obras` | `LibroObrasDigitalView.tsx` | premium | **doc-por-folio** `projects/{pid}/libroObras/state/folios/{id}` + meta `state` (counters Año→Mes, paginación) · `obra/libroStore.ts` |
| Carpeta Digital | `carpeta-digital` | `CarpetaDigitalView.tsx` | premium | **doc-por-archivo** `projects/{pid}/carpetaDigital/state/archivos/{id}` + meta `state` · `obra/carpetaStore.ts` |

- **Datos comunes reutilizados** (no se re-capturan): `ProjectMaster` (nombre/comuna/dirección/propietario) vía `useProjects().getProject`; el Térmico siembra `comuna`→zona; al guardar, todas escriben `toolStates`.
- **Free vs Premium:** los 3 con `useToolData` degradan a `localStorage ab-<toolId>-{pid}`; los 2 de Obra Digital también caen a local si la nube falla. **Adjuntos reales en Storage (UUID)**, counters Año→Mes y paginación por cursor ya implementados (2026-06-23 · Opción A). En Free el adjunto queda como metadato local (sin binario).
- **Reglas:** `toolData/{document=**}` cubre los 3 primeros; `libroObras/{document=**}` y `carpetaDigital/{document=**}` (recursivas) cubren meta + subdocs (folios/archivos). **Storage:** `storage.rules` (nuevo) protege `projects/{pid}/obra/**` zero-trust (miembro lee · editor escribe · ≤25 MB) — **requiere `firebase deploy --only storage`**. **Sin** índices nuevos.

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

6. **REGISTRA LA SESIÓN EN `Last Update.md` (OBLIGATORIO).** Al cerrar cualquier sesión de trabajo, agrega una entrada NUEVA arriba del todo en **`Last Update.md`** (raíz del repo) con **fecha + hora**, detalle de lo realizado, archivos tocados y pendientes generados/resueltos. No borres entradas previas. Mantén los pendientes sincronizados con `Tintero - Pendientes.md`. Este registro es la fuente de continuidad entre instancias.

7. **NO OFREZCAS HACER EL COMMIT/PUSH.** La publicación la ejecuta Andrés con los `.bat` de la raíz (ver §4 · Scripts `.bat`). Al cerrar la sesión, dile **cuál `.bat` accionar** según lo que cambió (código → `2`; reglas → `1`; ambos → `3`; verificar build → `4`). No corras tú `git push` ni `firebase deploy`.

### Reglas técnicas heredadas (por el stack)
- `import type { X }` o `{ type X }` **obligatorio** para Vite/oxc (su ausencia produce pantalla en blanco).
- El `db` normativo usa **Firestore DB nombrada** (`coordenadasnormativas`), no `(default)`.
- **Edición de archivos del repo: SIEMPRE atómica** (escribir a tmp en la MISMA carpeta y `os.replace` vía Python por bash, validando luego con `tsc -b`). La edición directa del montaje/host trunca archivos en disco **incluso chicos** (se confirmó de nuevo el 2026-06-30: se recuperó con `git show HEAD:` + reescritura atómica). Para validar TS aislado, esbuild (`transformSync` loader `tsx`).
- Cada herramienta nueva: registrar en `registry.ts` + `catalog.ts`, lazy load, tipos en `types.ts`.

---

## 9. Cómo usar este documento en una nueva instancia de Claude

Al iniciar una sesión nueva, basta con indicar:

> "Lee **`Iniciar Aquí.md`** en la raíz del proyecto y trabaja según esas instrucciones."

Eso carga el contexto del proyecto, la ubicación de la información, el flujo de despliegue y las reglas de desarrollo.

**Antes de empezar**, lee **`Last Update.md`** para conocer el estado real más reciente y los pendientes abiertos. **Al terminar**, registra la sesión en `Last Update.md` (ver §8, regla 6) — es obligatorio — e **indícale a Andrés cuál `.bat` ejecutar** para publicar (ver §4 · Scripts `.bat`); no ofrezcas hacer tú el commit/push.
