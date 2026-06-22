# _ARCHIBOTS — Plan de Refactorización hacia SPA Unificada
**Documento de análisis y diseño · v2.4 · 2026-06-17**

> **⟲ CAMBIO v2.4 (2026-06-17) — Nuevo LAYOUT de la SPA (aprobado en maqueta) + exportación PDF.**
> Tras una serie de iteraciones se **aprobó un rediseño de layout** que reemplazará al
> shell actual. Está maquetado en `src/views/LayoutTestView.tsx` (Workspace, ruta
> `/test`) y `src/views/HomeTestView.tsx` (Landing, ruta `/test-inicio`) — páginas
> STANDALONE de prueba (mock, 4 temas). Topología visual objetivo:
> **(1) Top unificado** de alto contraste (`--bar`): a la izquierda los controles
> (Inicio · selector de proyecto · SYSTEM_OK · usuario · tema, agrupados) y a la
> derecha la marca (_Archibots + subtítulo) con el logo, ocupando el alto completo.
> **(2) Workspace de 3 columnas:** Binder de 8 pestañas (solo muestra herramientas
> AGREGADAS, con estado Vacío/En proceso/Completado, fecha de guardado, Abrir y
> papelera con confirmación) + "Mis Proyectos" en fila pegado abajo · Catálogo angosto
> con selector Ver-por y acordeón colapsable · Área dinámica de trabajo a alto completo
> con barra inferior de contraste (estado circular + Guardar + Exportar PDF). Bajo las
> columnas 1–2, "Avance del Expediente" libre (solo agregadas, completadas en verde).
> **(3) Landing:** hero "¿Cómo funciona?" + Mis Proyectos; "Explorar herramientas"
> enciende (fade ~2 s) catálogo + área de exploración. **(4) Footer dock** ancho completo.
> **(5) Exportación a PDF:** nuevo `components/DocumentExportWrapper.tsx` (lámina "Hoja
> de papel Word" desvinculada del tema) + split-screen Workspace/Preview en 14
> herramientas + `@media print`. **La migración real está planificada en el SPRINT S7
> del `PLAN_ACCION_MAESTRO_PRODUCCION.md` (v1.7)**, con transiciones de navegación
> (fade in/out) y conservando el diseño actual de las mini-páginas (AuthModal, Pricing,
> Legal). El biselado de pestañas queda **acotado al tema CAD** (en los demás el color
> de borde sutil hacía invisible la diagonal). Mini-correcciones de UX cableadas:
> creación real de proyecto (modal + `createProject`), menú de usuario con cerrar
> sesión, ascenso real a Premium (Admin → Firestore) y envío de correo (Cloud Function).

**Documento de análisis y diseño · v2.3 · 2026-06-16**
Auditoría de los 6 micro-frontends + arquitectura objetivo. **v1.4 reescrita por ingeniería inversa del Mockup funcional (`Mockup/mockup-archibots/`).** ⚠️ **v1.6 CORRECCIÓN CRÍTICA:** La carpeta de trabajo real productiva es `Archibots/Archibots/` — el Mockup pasa a ser REFERENCIA UX/CSS únicamente (DEPRECATED para paths de código). Ver nota v1.6. Durante la última fase el Mockup evolucionó radicalmente e incorporó: motor de **theming dinámico con 4 temas**, lógica **SaaS de 3 niveles** (paywall con plan mensual + pase por proyecto), **colaboración** por proyecto (Editor/Lector + enlace), y un **Panel de Administración** (gestión de usuarios + ranking de Top Tools). Esta versión actualiza la topología de datos, el inventario de herramientas y la arquitectura frontend para reflejar exactamente lo que el código demuestra.

> **⟲ CAMBIO v2.3 (2026-06-16) — Tema CAD, cierre de bordes, logo propio y Biblioteca de Recursos.** (1) **Tema "brutalist" → "cad"** (Terminal/Wireframe): renombrado en `types.ts` (`THEMES`), `ThemeProvider` (default), `archibots.css` (`:root[data-theme="cad"]`) y etiquetas de UI (StatusBar/TopToolsBar muestran `theme.toUpperCase()`). La estética de terminal (sin sombras, monospace forzada, bordes 1px, botones "comando" con corchetes `::before/::after` e inversión en hover, barra inferior clara, íconos `stroke-width:1px`) vive **estrictamente** bajo `:root[data-theme="cad"]`; los temas Washi/Matrix/White no se tocan. (2) **Cierre del chaflán biselado**: como `clip-path` recorta también los pseudo-elementos, un `::after` rotado quedaría cortado; por eso las **cabeceras** usan dos pseudo-capas con el mismo chaflán (`::before`=borde a tamaño completo bajo `::after`=relleno 1px adentro, con `isolation:isolate` + `z-index` negativos) y las **pestañas** alinean la línea diagonal exactamente a la hipotenusa (capa de fondo) para preservar el borde-top rojo de la activa. (3) **Logo propio**: `ModuleHeader` usa `<img src="/Logo-Archibots.png">` unificado para los 4 temas (se retira el ícono lucide y su import). (4) **Biblioteca de Recursos**: nueva vista `tools/BibliotecaView.tsx` (registrada en `registry.ts` con el id `form-municipales`, carpeta 7) que indexa los formularios MINVU de `public/Biblioteca/` en un **acordeón por tipología de proyecto** (Obra Nueva, Ampliación >100 m², Alteración, Reconstrucción, Reparación, Normativa/OGUC) con enlaces directos a PDF (`target="_blank"`, rutas `encodeURIComponent`). (5) **Layout**: `.ab-container--narrow` (1280px, centrado) en rutas sin proyecto para alinear barra superior y contenido (workspace sigue full-width); herramientas con tope de lectura (`ToolHost` 1280px, Honorarios 1100px); **Hero** de usuario nuevo sin caja (flota sobre el fondo).

> **⟲ CAMBIO v2.1 (2026-06-16) — Reestructuración del catálogo, Landing Page y estética arquitectónica.** (1) **Taxonomía del catálogo** (`catalog.ts`): se elimina el prefijo "T-XX" de la UI (campo `code` vaciado; `ToolCatalog` deja de pintarlo). Modelo de "herramienta suelta": `sub:''` ⇒ se lista directamente bajo la carpeta, sin cabecera de subsección (helper `looseToolsOf`); aplicado a las carpetas 1 (Información), 2 (Terreno) y 6 (Administrativos). (2) **Carpeta 4 (Expedientes de Permisos)** reorganizada en 4 subsecciones: *Expediente DOM* (Listado, Declaración Jurada = `expediente-dom` activo, Solicitud de Permiso, **Calculadora de Costos MINVU trasladada desde Construcción**, Formulario INE, Carga de Ocupación, Cuadro de Superficies, Recepción Final), *Informes especiales* (**Accesibilidad DS 50 trasladada desde Proyecto**, Norma Térmica NCh1973, Resistencia al Fuego, Suelo), *Expedientes Sectoriales* (Autorización Sanitaria, DS 594) y *Repositorio de antecedentes*. Se eliminan `minvu`, `permiso-edif`, `anteproyecto-mun`. (3) **Carpeta 5 (Construcción)**: subsecciones *EETT, Presupuesto y Carta Gantt* y *Seguimiento e ITO*; `seguimiento` se renombra a **"Minuta de Visita a Obra"** (id intacto) y se agregan placeholders Libro de Obras Digital, RDI y Estados de Pago. Todos los ítems nuevos son `soon` (placeholder `ProximamenteView`); **`registry.ts` no cambia** porque ningún id activo se modificó. (4) **Binder**: la pestaña 7 deja de ser "Biblioteca" y pasa a **"Repositorio"** (esqueleto próximamente con grilla de carpetas y "Ver PDF" deshabilitado); la Biblioteca queda solo como acceso del catálogo (decoupling: `FOLDERS[7]` sigue siendo Biblioteca para el catálogo, el Binder hace override de la pestaña 7). (5) **Landing** (`HomeView`): se elimina la auto-redirección al sandbox; el logo/Inicio siempre llegan a la landing. Usuario nuevo → **Hero** de presentación; usuario con proyectos → grilla regular. Catálogo con ancho acotado (`.ab-home`). (6) **Imagen de proyecto**: selector en la Ficha (subir propia con reescalado a thumbnail, o conceptual SVG) persistido en `fotoUrl`. (7) **Estética** (`archibots.css`): esquinas biseladas con `clip-path: polygon(...)` (corte diagonal superior-derecha) en pestañas y cabeceras; sin `border-radius` en contenedores; clase `.ab-form-grid` (CSS Grid responsive 1/3/4) para alinear formularios de ancho completo.

> **⟲ CAMBIO v2.0 (2026-06-16) — Ajustes finales UX/UI + unificación de herramientas.** Sesión de pulido previo al Gate de Producción. Decisiones que se formalizan: **(1) Unificación Cabida/Volumen.** "Cabida de Terreno" (T-09) y "Volumen Teórico (Envolvente)" (T-10) eran la misma capacidad duplicada; se **elimina la entrada `cabida`** del `catalog.ts` y se conserva una sola herramienta basada en el código de `VolumenTeoricoView.tsx`, renombrada en la interfaz a **"Cabida"**. Decisión clave: se **mantiene `id:'volumen'`** (y su `lazy(() => import('../tools/VolumenTeoricoView'))` en `registry.ts`) para no romper datos ya persistidos (`projects/{id}/volumen/estado`, `ab-volumen-${pid}`) ni el contrato de inyección; solo cambia el `label` y el `code` pasa a `T-09`. **(2) Orden del catálogo.** Dentro de la carpeta 1 (Información del Proyecto), "Datos del Proyecto" precede a "Participantes". **(3) Ficha de Participantes rediseñada** según el Mockup (`GestorViews.tsx`): modelo de lista `Participante[]` con Arquitecto y Propietario **fijos** (no eliminables) por defecto — cada uno con Nombre + RUT + botón **[+] Dirección** — y panel para **agregar roles** (DOM, Calculista, Constructor, Revisor, Paisajista… o rol libre). Persistencia dual (Premium→`projects/{id}/participantes/ficha`; Free→`localStorage`) con **migración transparente** del esquema antiguo (`rutPropietario`, `arquitecto`, `oficina`, `dom`) y sincronía del Propietario al `ProjectMaster`. **(4) Auto-focus del Binder.** `WorkspaceView` ahora setea `binderTab` a `getManifest(id).folder` al agregar una herramienta, abriendo la carpeta correspondiente en la Ficha. **(5) Edición de nombre de proyecto** en `DatosProyectoView` (campo persistido vía `repo.save`, reflejado en la Ficha). **(6) Layout full-width** (`archibots.css`): se retira el tope `max-width:1620px` de `.ab-container`/`.ab-toptools-bar` (cap opcional ≥2200px). **(7) Mini-carpetas + "Crear Proyecto"** en "Otros proyectos" (`BinderFicha`), con estado vacío explícito. **(8) Copy** "Adicionar"→"Agregar" en `DimensionadorView`. **(9) Google Maps**: diagnóstico = falta `VITE_GOOGLE_MAPS_API_KEY` en `.env.local`; se mejoran mensajes de degradación y se añade `.env.local.example`. La arquitectura "Dos Cerebros" + Web Worker no se toca.
> **(↳ Nota de ruta).** ⚠️ La raíz productiva actual es **`E:\2CLAUDE\ProjectBook\Web`** (renombrada desde `E:\2CLAUDE\Archibots` el 2026-06-22). Las referencias previas a `E:\2CLAUDE\Archibots\` o `C:\Users\...\Desktop\Archibots\` quedan obsoletas; se conservan en entradas antiguas para trazabilidad pero NO deben usarse como path real.

> **⟲ CAMBIO v1.6 (2026-06-14) — Carpeta raíz correcta + Auth UX overhaul.**
> **(1) CARPETA RAÍZ REAL:** El proyecto SPA productivo vive en `E:\2CLAUDE\ProjectBook\Web\` (bash: `/sessions/.../mnt/ProjectBook/Web/`). La carpeta `Mockup/mockup-archibots/` queda como **referencia UX/CSS únicamente** — sus imports dinámicos, tipos en minúsculas y estructura monolítica NO se trasladan directamente. Reglas de código del proyecto correcto: (a) imports estáticos `import { auth, db } from '../core/firebase'`; (b) tipos capitalizados `Plan = 'Free' | 'Premium'`; (c) `import type { X }` obligatorio para Vite/oxc; (d) archivos >100 líneas: scratch `/outputs/` → esbuild validate → `cp`.
> **(2) AUTH UX OVERHAUL:** Eliminado el hard-gate `if (!user) return <AuthModal/>`. Nuevo flujo: usuarios anónimos navegan libremente. `ProjectProvider` auto-crea `"Mi Primer Proyecto"` en `localStorage` si el repo local está vacío (CONST §7 sandbox, id: `archibots-sandbox`). `HomeView` redirige automáticamente al sandbox. `AuthModal` es un overlay invocable (`openAuthModal()` en `useAuth()`), con backdrop, botón ×, y `AnimatePresence`. `StatusBar` muestra badge "Invitado" + botón "Iniciar Sesión" para usuarios no autenticados. Archivos modificados: `types.ts`, `AuthProvider.tsx`, `main.tsx`, `ProjectRepository.ts`, `ProjectProvider.tsx`, `AuthModal.tsx`, `HomeView.tsx`, `StatusBar.tsx`.
> **(3) F1 COMPLETO:** Todos los sub-pasos de F1 (F1.1–F1.6) están implementados y funcionando en `Archibots/Archibots/`. H-F1 completado incluyendo Custom Claim `admin:true` (verificado). Pendiente sólo: ejecutar deploys HITL (rules, indexes, functions, secrets).

> **⟲ CAMBIO v1.5 (2026-06-14) — La Constitución.** El equipo directivo cerró las *Preguntas del Arquitecto* con **17 decisiones arquitectónicas irrevocables** (la "Constitución", §0). Esta revisión (a) reconvierte §7 de preguntas abiertas a **decisiones cerradas**, y (b) propaga tres cambios de fondo respecto de v1.4: **(1)** los 540 GeoJSON se sirven **estáticamente desde Firebase Hosting (CDN), no desde Storage** (regla 8); **(2)** el cálculo pesado de Turf.js se **aísla obligatoriamente en un Web Worker** (regla 9); **(3)** los usuarios Free/Invitado gestionan su proyecto en `localStorage` **sin migración automática** a Firestore al hacer upgrade (regla 7). Todas las ediciones v1.5 se marcan **⟲ CONST §N**.

> **⟲ CAMBIO v1.9 (2026-06-15) — Auditoría de seguridad, Paywall y estabilidad (Fase 5).** Decisiones formalizadas para el Gate de Producción: **(1) Gating centralizado en un hook** `src/core/useAccess.ts` como fuente única de verdad del `AccessMode` (`edit`/`read`/`locked`), derivado de plan efectivo + `tier` de la herramienta + rol de membresía (`viewer`→`read`). Reemplaza la idea previa de un `PaywallProvider`: un hook puro es suficiente y evita estado global innecesario. **(2) Defensa en profundidad del Paywall**: `ToolHost` intercepta el caso `locked` y monta `PricingView` (la herramienta premium ni siquiera descarga su chunk), y además cada vista premium (`BimWizardView`, T-17) lleva su propia guarda `access==='locked'` (Prompt Maestro §5) como última línea. **(3) Error Boundary por herramienta**: `src/components/ToolErrorBoundary.tsx` (componente de clase) envuelve el render dentro del `<Suspense>` del ToolHost; aísla fallos de una tool sin tumbar la SPA y se resetea por `resetKey={tool.id}`. **(4) Lazy loading total**: 100% de las herramientas vía `React.lazy(() => import())` en `registry.ts`, sin imports estáticos de `tools/` (un chunk por herramienta; bundle inicial mínimo). **(5) Reglas zero-trust ampliadas**: las subcolecciones `projects/{id}/participantes`, `/seguimiento` y `/bitacora` heredan el criterio owner/editor de `formularios`/`simulaciones`; la DB nombrada `coordenadasnormativas` se protege con un **ruleset separado** (`firestore.coordenadasnormativas.rules`: lectura autenticada, escritura prohibida desde cliente), declarado como segundo target en `firebase.json` (`firestore[]`). El Gate funcional queda listo a nivel de código; el despliegue de reglas/hosting y la QA visual son pasos HITL.

> **⟲ CAMBIO v1.8 (2026-06-15) — Coreografía Espacial-Normativa implementada (Fase F4).** Se construyó el "Dos Cerebros" con tres capas desacopladas: **(1) Cerebro Espacial en Web Worker** (`src/workers/geo.worker.ts`, CONST §9): aísla Turf.js del hilo principal con dos operaciones — `intersect` (punto↔polígono PRC, `boolean-point-in-polygon`) y `area` (superficie de polígono dibujado). El worker se instancia con `new Worker(new URL('../workers/geo.worker.ts', import.meta.url), { type: 'module' })` (idiomático Vite). **(2) Capa GeoJSON desde CDN** (`src/core/GeoJsonService.ts`, CONST §8): `fetch('/geo-data/13_PRC_{Comuna}.json')` con normalización de comuna (sin tildes/espacios; "Ñuñoa"→"Nunoa") y caché de dos niveles (memoria por sesión + IndexedDB persistente, sin librerías externas). **NO** usa Storage. **(3) Cerebro Normativo** (`src/core/NormativaService.ts`): apunta a la **base de datos NOMBRADA `coordenadasnormativas`** vía `getFirestore(getApp(), 'coordenadasnormativas')`, colección `normativas_prc`, resolviendo la ficha por llave maestra `{comuna}_{zona}` (`generarLlaveMaestra`). El código de zona se extrae de `properties.ZONA` del GeoJSON. **Vistas:** `GeolocalizadorView.tsx` (T-07, Google Maps + `DrawingManager` para polígonos + marcador + Worker + ficha) y `MapaTerrenoView.tsx` (T-08, dibujo + área + persistencia local del polígono). **Sync §6:** `src/hooks/useDimensionadorSync.ts` centraliza la escritura de `superficieCalculada`+`superficieOrigen='DIMENSIONADOR'` al master, reutilizado por Dimensionador y Mapa de Terreno. **Tipado de Maps:** sin `@types/google.maps` en el repo, los objetos del SDK se tipan de forma laxa (alias local) igual que el resto del código, cargándose en runtime por `@googlemaps/js-api-loader`. **Degradación:** ambas vistas operan con ingreso manual si falta `VITE_GOOGLE_MAPS_API_KEY`. **Corrección de registro:** el plan previo declaraba estos servicios/vistas como hechos con firmas distintas (`useTerrenoSync`, `NormativaService` por rango/`documentId`, `MapaTerrenoView` con editor SVG/Shoelace); el repo real queda alineado aquí.

> **⟲ CAMBIO v1.7 (2026-06-15) — Wiring productivo + persistencia dual de herramientas.** Sesión de cableado del Bloque II/IV. Decisiones arquitectónicas que se formalizan: **(1) Persistencia dual por herramienta.** Los datos propios de una herramienta que **no** pertenecen al `ProjectMaster` (CONST §6/§7) se persisten según el plan del usuario: **Premium → subcolección Firestore** (`projects/{id}/participantes/ficha`, `projects/{id}/seguimiento/estado`, `projects/{id}/bitacora/{entradaId}`), **Free/Invitado → `localStorage`** con clave `ab-<toolId>-${projectId}`. La carga intenta Firestore primero (Premium) y degrada a `localStorage` ante fallo de reglas/offline, sin romper la vista. **(2) Imports estáticos en servicios.** `ShareService.ts` y `AdminService.ts` se crean (no existían) usando **exclusivamente imports estáticos** de `firebase/firestore` (coherente con la regla oxc/Vite del Prompt Maestro; se descarta el patrón de import dinámico que el plan previo había asumido). **(3) `members` como fuente de colaboración.** `ShareService` opera sobre `projects/{id}.members` (`updateDoc` con notación de punto e `deleteField()`), resolviendo correo→uid contra `users`. **(4) `config/topTools` como ranking dinámico.** `TopToolsBar` lee `config/topTools.ids` (`getDoc`) con fallback a `TOP_TOOLS_DEFAULT`. **(5) Datos de Chile centralizados** en `src/core/data-chile.ts` (regiones/comunas), consumidos por `UbicacionView`. **Corrección de registro:** el plan previo declaraba `GestorViews.tsx`, `ShareService`/`AdminService` con imports dinámicos y un `DocPrintService` separado como ya existentes; el estado real del repo a esta fecha difiere y queda alineado aquí.

> **Nota de método (v1.4/v1.5).** Donde el Mockup contradice a v1.3, manda el Mockup. Donde la Constitución (§0) refina al Mockup, manda la Constitución. Las divergencias se anotan en línea con **⟲ CAMBIO v1.4** / **⟲ CONST §N**. Fuentes auditadas: `src/App.tsx` (668 l.), `src/archibots.css` (411 l.), `src/views/PricingView.tsx`, `src/views/ShareProjectModal.tsx`, `src/views/AdminDashboard.tsx`, y las 11 vistas de `src/tools/`.

---

## 0. LA CONSTITUCIÓN — 17 DECISIONES ARQUITECTÓNICAS IRREVOCABLES
*Cerradas por el equipo directivo (2026-06-14). Son inmutables: el resto del documento se interpreta a su luz. Cada regla indica entre paréntesis la Pregunta del Arquitecto (§7) que clausura.*

### A · Reglas de UI, theming y experiencia
1. **Cuatro temas nativos** (`brutalist`, `washi`, `matrix`, `white`). La preferencia se guarda en `localStorage` y se **sincroniza asíncronamente** con `users/{uid}.theme`. *(cierra Q-1 + Q-11)*
2. **Top Tools Bar** por defecto: `dimensionador, geolocalizador, expediente-dom, hsa`. Si el admin ancla una herramienta **premium**, se muestra **con candado** que abre el Paywall. *(cierra Q-12 + Q-10)*
3. **Badge de Plan interactivo.** El indicador "Free"/"Premium" de la barra de estado es un **gatillo** que abre el modal de suscripciones (`PricingView`). *(nuevo comportamiento UI)*
4. **Ubicación ≠ Geolocalizador.** Son herramientas separadas: **Ubicación** (T-04b) almacena datos administrativos manuales (Rol SII, Región, comuna, dirección); **Geolocalizador** (T-07) ejecuta el análisis espacial y normativo. *(cierra Q-5)*
5. **BIM activo.** Los archivos existen. El **Asistente de Usos BIM (T-17)** se integra completo en la Fase 1 como herramienta **Premium activa** (sin datos demo). *(cierra Q-6)*

### B · Modelo de datos y gestión de superficies
6. **Dos campos de superficie siempre.** La BD guarda `superficieCalculada` (del Dimensionador) **y** `superficieManual`. Un enum `superficieOrigen` (`'DIMENSIONADOR'|'MANUAL'`) le dice a la UI cuál renderizar; nunca se pierde la matemática al alternar. *(cierra Q-4)*
7. **Gestión local sin migración.** Los usuarios Free/Invitados gestionan su **único** proyecto en `localStorage`. **NO** hay script de migración automática a Firestore al hacer upgrade. Al pasar a Premium, los **nuevos** proyectos nacen en la nube; el proyecto local queda aislado. *(refina P6 / cierra el vacío)*

### C · Rendimiento espacial y almacenamiento (coreografía crítica)
8. **GeoJSON en Hosting/CDN.** Para evitar costos de descarga de Storage, los **540 GeoJSON** de comunas se despliegan **estáticamente en Firebase Hosting** (CDN global cacheada), no en Storage.
9. **Turf.js en Web Worker.** Las funciones pesadas (`@turf/boolean-point-in-polygon` iterando miles de polígonos) se **aíslan obligatoriamente en un Web Worker**; nunca bloquean el hilo principal de React.

### D · Modelo SaaS, colaboración y seguridad
10. **Roles de colaboración** estrictos: se almacena `'editor' | 'viewer'`; el Propietario se infiere de `ownerId`. *(cierra Q-2)*
11. **Pase por Proyecto ($4.990) — loophole cerrado.** Pago **único y permanente** ligado a un `projectId` específico. **Regla estricta:** si el Propietario compra el Pase e invita a usuarios Free, estos ven las herramientas premium en **modo Solo Lectura**. Para **editar**, el invitado debe comprar su propio Pase o una Suscripción. *(cierra Q-3 con matiz restrictivo)*
12. **Custom Claims para admin.** El rol de Súper-Admin se gestiona 100% con Firebase Custom Claims (`token.admin === true`), no con un campo manipulable en Firestore. *(cierra Q-7)*
13. **Suspensión de cuentas.** Se ejecuta con `disabled: true` vía Admin SDK (Cloud Function), bloqueando el acceso desde la raíz de Firebase Auth. *(cierra Q-8)*
14. **Cortesías Premium.** El admin otorga planes con `users/{uid}.compPremium = true`, evitando colisiones con los webhooks de Stripe. *(cierra Q-9)*
15. **Tope de proyectos Premium = 50** (límite duro validado en Frontend **y** Firestore Rules). *(cierra Q-15)*
16. **Feedback dual.** Los formularios de contacto envían un correo al admin **y**, de forma concurrente, respaldan el mensaje en la colección `feedback` de Firestore. *(cierra Q-13)*
17. **Textos legales.** Se proveen borradores base reales y completos para `/legal/terminos` y `/legal/privacidad`. *(cierra Q-14)*

> **Entornos de despliegue (corolario de la Constitución).** ⟲ v1.6: Durante la fase de testing se usa **un único proyecto Firebase** `archibots-497423`. No existe aún un split dev/prod. La separación formal se introduce cuando el testing sea estable. Stripe ⏸ DIFERIDO indefinidamente.

---

## 1. RESUMEN GLOBAL DE LA ARQUITECTURA

### 1.1 Estado actual (lo que existe en la carpeta)

| Módulo | Carpeta / Archivo | Líneas App.tsx | Rol actual |
|---|---|---|---|
| **SPA Productiva** ⟲ v1.6 | `Archibots/Archibots/` | — | ⟲ **FUENTE DE LA VERDAD v1.6.** Proyecto React 19 + Vite 6 + Firebase real. Estructura: `src/core/` (auth, db, router, types, firebase), `src/views/`, `src/tools/` (4 tools implementadas), `src/components/` (AppShell, StatusBar, ToolHost, ToolCatalog, BinderFicha…). F1 completo. 4 herramientas en registry. |
| **Mockup SPA** (DEPRECATED para código) | `Mockup/mockup-archibots` | **668** | ⟲ **REFERENCIA UX/CSS ÚNICAMENTE post-v1.6.** Imports dinámicos y tipos legacy. No copiar directamente — adaptar a arquitectura estática del proyecto correcto. |
| Homepage | `remix_-archibots---homepage` | 369 | Catálogo de las 25 calculadoras + descargas. Links rotos a `/calculadoras/{id}` (se eliminan, P9) |
| Gestor de Proyectos | `remix_-archibots---gestor-de-proyectos` | 950 (+ ProjectManager 3.550) | CRUD de proyectos, ficha en 12 secciones modulares, seguimiento de obra |
| Dimensionador de Proyecto | `remix_-archibots---dimensionador-de-proyecto` | 499 | **"SPA Máster" V6.0.1**: ya es una mini-SPA con 7 vistas plug & play |
| Geolocalizador Normativo | `remix_-archibots---geolocalizador-normativo` | 677 | Google Maps + dibujo de polígono + turf.js + consulta normativa PRC |
| Expediente Municipal | `archibots---expediente-municipal` | 420 | Genera 3 documentos DOM (Declaración Jurada Art. 1.2.2, F 2-3.1, INE). Hoy exporta a Google Docs → **cambia a impresión/PDF en navegador (P10)** |
| Módulo BIM | `Modulo BIM.tsx.txt` (1.890, suelto) | — | Wizard de 7 pasos de Usos BIM (Planbim/CORFO) con IA (Gemini `/api/generate-ficha`). Re-vestido a Washi & Sumi en el Mockup (`tools/BimWizardView.tsx`) |
| Nuevo paradigma | `workspace_proyecto.tsx` (919, suelto) | — | Prototipo del layout Archivador (binder) + Catálogo. **Ya materializado y superado por el Mockup** |
| Estilo maestro | `archibots-master.css` (540) | — | Paleta Washi & Sumi original. ⟲ **v1.4: superado** por `Mockup/.../src/archibots.css` (411 l.), que generaliza la paleta a un sistema de tokens shadcn con 4 temas |

**Stack del proyecto correcto `Archibots/Archibots/`** ⟲ v1.6: React 19 + Vite 6 + **Tailwind base-only** (solo reset/utilities vía `archibots.css`, sin compiler) + Firebase 12 (Auth, Firestore multi-DB, Storage) + **framer-motion** + **lucide-react** + @google/genai (BIM vía `apiProxy` CF). Sin Tailwind compiler, sin `googleapis`. CSS propio `archibots.css` con tokens shadcn + 4 temas.

### 1.2 Topología de datos Firestore (verificada en código y reinterpretada desde la UI del Mockup)

```
PROYECTO FIREBASE: archibots-497423
│
├── DB nombrada "coordenadasnormativas"  ← SOLO CONSULTA (GLOBAL, INTERNA)
│     └── normativas_prc/{comuna}_{zona}     ej: laflorida_prc, vitacura_z_a1
│           → SE MANTIENE PLANA (P8): consulta por rango de documentId + caché
│
├── Hosting (CDN): /geo-data/13_PRC_{Comuna}.json   ← ⟲ CONST §8: 540 GeoJSON ESTÁTICOS en Hosting (NO Storage)
│
└── DB por defecto (datos de usuario)
      └── projects/{projectId}            ← HOY: documento "gordo"
            calculations[] ⚠️ array embebido, programaRecintos[], obraBitacora[]
```

**Topología objetivo (v1.4 — ampliada para soportar la UI actual):**

```
projects/{id}                  ← master liviano (< 5 KB; ver "Datos Clave")
├── members{}                  ← ⟲ mapa de colaboradores {uid: 'editor'|'viewer'} (P7 / ShareProjectModal)
├── formularios/{formId}       ← docs pesados: F 2-3.1, INE, Declaración Jurada
├── simulaciones/{simId}       ← historial: dimensionador, contratos, propuestas, EP
└── invitaciones/{inviteId}    ← ⟲ NUEVO: invitaciones pendientes por correo / enlace (Compartir)

users/{uid}                    ← perfil: nombre, preferencias, estado, theme preferido
customers/{uid}                ← ⟲ NUEVO: estado de pago Stripe (plan, status, projectCount)
│  └── subscriptions/{subId}   ←   sub-colección gestionada por la extensión Stripe
entitlements/{uid}             ← ⟲ NUEVO: desbloqueos "Pase por Proyecto" {projectId: true}
config/topTools                ← ⟲ NUEVO: ranking de accesos rápidos editable por admin
biblioteca/{recursoId}         ← catálogo data-driven de PDFs descargables (P13)
feedback/{msgId}               ← respaldo opcional de comentarios (P12, fase 2)
```

#### ★ Colaboración: campo `members` en `projects/{id}` (deriva del ShareProjectModal — T-61)
El modal **Compartir Proyecto** (`views/ShareProjectModal.tsx`) lista a un **Propietario** fijo y a N colaboradores con rol **Editor** o **Lector**, permite invitar por correo y ofrece **"Copiar enlace"**. Para soportarlo, el master del proyecto debe llevar:

```typescript
projects/{id}.ownerId : string                          // uid del dueño (Propietario)
projects/{id}.members : { [uid: string]: 'editor' | 'viewer' }
// La UI muestra etiquetas en español: "Editor" → 'editor', "Lector" → 'viewer'.
// El Propietario NO va en members (se deriva de ownerId).
```

Las invitaciones por correo (a usuarios que aún no existen) y el enlace compartible requieren una colección puente `projects/{id}/invitaciones/{inviteId}` con `{ email, rol, token, estado: 'pendiente'|'aceptada', createdAt }`, resuelta por la Cloud Function `sendInviteEmail` (ver 5.3-B). **Vacío lógico:** el Mockup usa el rol "Lector" pero las reglas de v1.3 lo llamaban `viewer`; se unifica el almacenamiento a `'editor' | 'viewer'` con etiquetas de UI en español (ver *Preguntas del Arquitecto*, Q-2).

#### ★ Monetización: colecciones `customers/{uid}` y `entitlements/{uid}` (derivan del PricingView — T-59)
⟲ **CAMBIO v1.4 — el paywall ahora tiene TRES productos, no dos.** `views/PricingView.tsx` ofrece:

| Producto | Precio | Proyectos | Naturaleza |
|---|---|---|---|
| **Arquitecto Base** | Gratis / siempre | 1 proyecto | Plan permanente gratuito |
| **ArchiBots Premium** | **$10.000 / mes** | Ilimitados* (tope de seguridad) | Suscripción recurrente |
| **Pase por Proyecto** | **$4.990 / proyecto** | 1 proyecto | **Pago único** que desbloquea todo para un solo proyecto |

El "Pase por Proyecto" es un modelo nuevo que **no encaja en un único campo `plan: free|premium`**. Se modela en dos lugares:

```
customers/{uid}                       ← gestionado por extensión "Run Payments with Stripe"
  ├── stripeId : string
  ├── plan : 'free' | 'premium'       // suscripción mensual (recurrente)
  ├── status : 'active'|'past_due'|'canceled'
  ├── projectCount : number           // mantenido por Cloud Functions
  └── subscriptions/{subId}           // sub-colección de la extensión

entitlements/{uid}                    ← desbloqueos de pago único (NO recurrentes)
  └── projects : { [projectId]: { tier:'pass', paidAt: timestamp, sessionId } }
```

**Regla de desbloqueo (frontend) — ⟲ CONST §11/§14, distingue LEER vs EDITAR:**
- **Acceso de edición** a una herramienta premium de un proyecto: el usuario debe tener plan propio (`customers/{uid}.plan === 'premium'` **O** `users/{uid}.compPremium === true`) **O** un Pase propio sobre ese proyecto (`entitlements/{uid}.projects[projectId]`).
- **Acceso de solo lectura** (loophole cerrado): si el **Propietario** del proyecto compró el Pase (`entitlements/{ownerId}.projects[projectId]`), los **colaboradores Free** ven las herramientas premium de ese proyecto **en modo Solo Lectura**. Para editar, deben adquirir su propio Pase o Suscripción.

En el Mockup esta lógica está simplificada a un único estado `plan: 'Premium' | 'Free'` (`App.tsx:128`), y el checkout es simulado (`PricingView` no llama a Stripe). La capa de pago real y el gating leer/editar son trabajo de H5 (Q-3 cerrada en la Constitución §11).

#### ★ Súper-administrador: `role: 'admin'` y colección `config/topTools` (derivan del AdminDashboard — T-62)
`views/AdminDashboard.tsx` renderiza una insignia literal **`role: admin`** y dos secciones: (A) **Gestión de Usuarios** —tabla con `nombre, email, plan, proyectos, estado: 'Activo'|'Suspendido'`, con acción *subir/bajar plan*— y (B) **Configuración de Top Tools** —ranking ordenable de herramientas ancladas.

```
// Cómo se guarda el rol de súper-admin (dos opciones; recomendada: A)
//  A) Firebase Custom Claims:  request.auth.token.admin === true     ← recomendado (seguro, no manipulable)
//  B) Campo en Firestore:      users/{uid}.role === 'admin'          ← simple, pero menos seguro
// El Mockup hardcodea el correo goyogramador@gmail.com como admin en las Rules de v1.3.

config/topTools                ← documento único editable solo por admin
  └── ids : string[]           // orden de los accesos rápidos (ranking)
                               // En el Mockup: estado topToolIds en App.tsx, default:
                               // ['dimensionador','geolocalizador','expediente-dom','hsa']

users/{uid}.estado : 'Activo' | 'Suspendido'   ← ⟲ NUEVO campo (suspensión de cuentas desde el panel)
```

#### ★ Definición: "DATOS CLAVE" (confirmada contra el Mockup — T-01)
Dos niveles. **(a) Lo que muestra la Ficha** (carpeta 0, `App.tsx:548-560` panel "Datos Clave"):

| Dato visible en Ficha | Campo (nombre real en el Mockup) |
|---|---|
| Nombre del proyecto | `name` |
| Año | `anio` |
| Propietario | `propietario` ⟲ visible en Datos Clave |
| Rol (del arquitecto) | `rol` ⟲ visible en Datos Clave |
| Destino | `destino` |
| Dirección | `direccion` (+ `comuna`) |
| Sup. Terreno | `superficieTerrenoLegal` |
| Sup. Proyecto | `superficieProyecto` + etiqueta de origen |
| Fase actual | `etapa` |

⟲ **CONST §6 (modelo de superficies — Q-4 cerrada).** Se guardan **ambos** valores de superficie de proyecto para no perder la matemática del Dimensionador al editar a mano. Tres campos persistentes + un valor derivado:

| Campo | Origen | Va a la Ficha |
|---|---|---|
| `superficieTerrenoLegal` | escrita por el usuario (legal/escritura) | ✅ |
| `superficieCalculada` | valor que produce el Dimensionador (T-14) | — (interno) |
| `superficieManual` | valor que el usuario escribe a mano | — (interno) |
| `superficieOrigen` | enum `'DIMENSIONADOR'` \| `'MANUAL'` | **bandera**: indica a la UI cuál de los dos renderizar |
| `superficieProyecto` *(derivado)* | `= superficieOrigen==='MANUAL' ? superficieManual : superficieCalculada` | ✅ con etiqueta de origen (`ab-origin`) |

Es decir, **se conservan los dos valores en disco** (`superficieCalculada` y `superficieManual`); `superficieOrigen` es solo la bandera de cuál mostrar. Al editar a mano se setea `superficieManual` + `superficieOrigen='MANUAL'` sin borrar `superficieCalculada`; al recalcular con el Dimensionador se actualiza `superficieCalculada` + `superficieOrigen='DIMENSIONADOR'`. El usuario puede alternar el origen sin pérdida de datos. *(Q-4 cerrada en la Constitución §6.)*

**(b) Campos técnicos del master** (no se exhiben): `id`, `fotoUrl`, `ownerId`, `members{}`, `presupuestoUF`, normativa aplicada, `createdAt/updatedAt`, contadores `simulacionesCount/formulariosCount`. Regla: master < 5 KB, sin arrays de historial.

**Reglas anti-sobrecosto de lectura:** (1) eliminar full-scan de `normativas_prc` → consulta por rango de documentId (P8-B) en un único `NormativaService`. (2) Caché local persistente (`persistentLocalCache` + IndexedDB para GeoJSON). (3) Listados leen solo el master liviano. (4) ⟲ CONST §8: **GeoJSON se sirve desde Firebase Hosting (CDN cacheada), nunca desde Storage ni Firestore** — se descarga por `fetch('/geo-data/13_PRC_{Comuna}.json')` y se cachea en IndexedDB; solo la comuna activa vive en memoria.

### 1.3 Mapa de componentes actual (por capa)

| Capa | Archivos | Estado |
|---|---|---|
| **Shell SPA** | `Mockup/.../App.tsx` | ⟲ **v1.4**: ya implementa los 6 bloques del layout, el ruteo de vistas (`home`/`workspace`/`admin`) y el theming |
| **Theming** | `Mockup/.../archibots.css` | ⟲ **v1.4**: motor de tokens shadcn + 4 temas (ver 4.A) |
| **Monetización (UI)** | `views/PricingView.tsx` | ⟲ **v1.4**: paywall de 3 productos + checkout mock |
| **Colaboración (UI)** | `views/ShareProjectModal.tsx` | ⟲ **v1.4**: invitar + roles + copiar enlace |
| **Administración (UI)** | `views/AdminDashboard.tsx` | ⟲ **v1.4**: gestión usuarios + ranking Top Tools |
| Identidad / Auth | bloque ~110 líneas repetido en los 5 App.tsx | ❌ quintuplicado → `AuthProvider` único (en el Mockup es MOCK_USER) |
| Estado de proyectos | `ProjectContext.tsx` (3 variantes) | ❌ divergente → `ProjectRepository` |
| Gestión proyectos UI | `ProjectManager.tsx` (3.550 líneas, 4 variantes) | ❌ monolito; en el Mockup descompuesto en `tools/GestorViews.tsx` |
| Mapa de terreno | `ProjectTerrenoMap.tsx` (3 variantes) | ⚠️ casi igual |
| Motor de herramientas | `toolsData.ts` + `types.ts` + `SumiSubpage.tsx` | ✅ los motores se **archivan**; el catálogo se reescribe como `MOCK_CATALOG` (ver 2) |
| Datos Chile | `comunasData.ts` (16 regiones) | ✅ idéntico |
| Export ofimática | `lib/workspace.ts` (Google Docs/Drive OAuth) | 💀 **se elimina (P10)** → `DocPrintService` |
| Estilo | `archibots-master.css` (legacy) | ⚠️ superado por `archibots.css` empaquetado |

---
## 2. INVENTARIO EXHAUSTIVO DE HERRAMIENTAS (NUMERADO · v1.4)

IDs estables **T-xx**. Jerarquía primaria = CARPETAS; secundaria = SUBCATEGORÍAS (el Mockup agrupa el catálogo por `folder` → `sub`).
Estado: ✅ activa (`estado:'active'`) · 🔜 **Próximamente** (`estado:'soon'`, gris, no operativa) · 📋 mock/futuro · ⚠️ condicionada · 💀 eliminada · 🔗 fusionada.
Tier: 🆓 free · 🔒 **premium** (candado en el Mockup; bloquea si `plan === 'Free'`).

> ⟲ **v1.4 — la verdad del catálogo es `MOCK_CATALOG` en `App.tsx:80-111`** (31 entradas con `id, code, label, folder, sub, icon, estado, tier, fases, desc`). El inventario de abajo refleja ese arreglo, incluidos los cambios respecto de v1.3 anotados en línea.

### Herramientas marcadas PREMIUM (🔒) en el Mockup
Solo **tres** herramientas llevan `tier:'premium'` (candado): **T-17** Asistente de Usos BIM, **T-18** Creador de Familias BIM (LOD) y **T-20** Implementación ISO 19650 — las tres de la subcategoría *BIM* en la carpeta 3. Todo lo demás es free en v1. ⟲ Esto confirma y precisa a P5 (BIM es lo primero en volverse exclusivo premium). Coincide con el PricingView, que lista "Asistente de Usos BIM" y "Familias BIM (LOD) · ISO 19650" como beneficios Premium/Pase.

### Nuevas VISTAS ESTRUCTURALES (módulos de sistema, no herramientas de proyecto)
⟲ **NUEVO v1.4** — el Mockup añade tres vistas que no son "herramientas de carpeta" sino módulos transversales de la plataforma:

| ID | Vista / Módulo | Archivo | Rol |
|---|---|---|---|
| **T-59** | **PricingView (Paywall)** | `views/PricingView.tsx` | Comparativa de 3 productos (Base/Premium/Pase) + checkout mock. Se monta en el ToolHost cuando se intenta abrir una herramienta premium sin plan (`App.tsx:360`) |
| **T-60** | **AdminDashboard (Panel)** | `views/AdminDashboard.tsx` | Vista `admin`: gestión de usuarios (plan, estado, suspensión) + configuración del ranking Top Tools |
| **T-61** | **ShareProjectModal (Colaboración)** | `views/ShareProjectModal.tsx` | Modal: invitar por correo, roles Editor/Lector, copiar enlace |
| **T-62** | **TopToolsBar + ranking** | `App.tsx` (barra) + `AdminDashboard` (config) | Barra inferior persistente de accesos rápidos; su contenido lo edita el admin |

### CARPETA 0 — FICHA DEL PROYECTO
| ID | Herramienta | Sub | Estado | Tier |
|---|---|---|---|---|
| T-01 | Ficha resumen: Nombre + Datos Clave (año, propietario, rol, destino, dirección, superficies, fase) + foto + **barra de avance del expediente** (15 ítems, %) | — | ✅ | 🆓 |
| T-02 | Ficha con "Otros proyectos del usuario" (grilla de carpetas) | — | ✅ | 🆓 |

### CARPETA 1 — INFORMACIÓN DEL PROYECTO  · sub: *Datos generales*
| ID | Herramienta (`id` en Mockup) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-03 | **Participantes del Proyecto** (`participantes`) — Arq + Propietario por defecto; [+] DOM, calculista, constructor y roles libres (nombre + RUT) | Datos generales | ✅ | 🆓 |
| T-04 | **Datos del Proyecto** (`datos-proyecto`) — etapa, destino, tipo y superficies (modelo de 1.2) | Datos generales | ✅ | 🆓 |

### CARPETA 2 — TERRENO  · subs: *Análisis predial · Cabida*
| ID | Herramienta (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| **T-04b** | ⟲ **NUEVO v1.4 · Ubicación del Proyecto** (`ubicacion`) — ubicación administrativa (región, comuna, dirección, rol SII); complementa al Geolocalizador | Análisis predial | ✅ | 🆓 |
| T-07 | **Geolocalizador Normativo** (`geolocalizador`) — dirección → polígono → zona PRC → ficha; modos [ASUMIR FICHA] / [INGRESO MANUAL CIP]. Absorbe 🔗T-11 y 🔗T-13 | Análisis predial | ✅ | 🆓 |
| T-08 | **Mapa de Terreno** (`mapa-terreno`) — polígono + superficie turf.js (dato interno) | Análisis predial | ✅ | 🆓 |
| T-09 | **Cabida** (`volumen`) ⟲ **v2.0 · UNIFICADA** — fusiona la antigua "Cabida de Terreno" (T-09) y "Volumen Teórico/Envolvente" (T-10) en una sola herramienta (`VolumenTeoricoView`); conserva `id:'volumen'` por compatibilidad de datos | Cabida | ✅ | 🆓 |
| ~~T-10~~ | ~~Volumen Teórico / Envolvente~~ ⟲ **v2.0 · fusionada en T-09 (Cabida)** | Cabida | 🔗 | 🆓 |
| T-11 | Zonificación básica | — | 🔗 fusionada en T-07 |
| T-12 | Distanciamientos teóricos | — | 💀 eliminada |
| T-13 | Condiciones de Edificación | — | 🔗 fusionada en T-07 (modo manual = CIP) |

### CARPETA 3 — PROYECTO (DISEÑO)  · subs: *Dimensionadores · BIM · Accesibilidad y Normativa*
| ID | Herramienta (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-14 | **Dimensionador de Proyecto** (`dimensionador`) — programa de recintos, % circulación, sync con master | Dimensionadores | ✅ **estándar visual** | 🆓 |
| T-15 | Dimensionador Edificios Públicos (`dim-publicos`) | Dimensionadores | 🔜 | 🆓 |
| T-17 | **Asistente de Usos BIM** (`bim-wizard`) — wizard 7 pasos, ficha IA | BIM | ✅ | 🔒 **premium** |
| T-18 | Creador de Familias BIM / LOD (`bim-familias`) | BIM | 🔜 | 🔒 **premium** |
| T-20 | Implementación ISO 19650 (`iso19650`) | BIM | 🔜 | 🔒 **premium** |
| T-16 | Accesibilidad (DS 50) (`accesibilidad`) | Accesibilidad y Normativa | 🔜 | 🆓 |
| T-19 | Uso BIM (matriz por fase) | — | 💀 eliminada (en T-17) |
| T-21..T-23 | PEB · Plantillas EETT BIM · Modelo y planos | — | 🔜/📋 (no presentes en MOCK_CATALOG; metadata futura) |

### CARPETA 4 — EXPEDIENTES DE PERMISOS  · subs: *Formularios DOM · Trámites especiales*
| ID | Herramienta (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-24 | **Expediente Municipal** (`expediente-dom`) — Declaración Jurada Art. 1.2.2 · F 2-3.1 · INE, con impresión/PDF | Formularios DOM | ✅ | 🆓 |
| T-30 | Listado de Documentos DOM (`listado-dom`) | Formularios DOM | 🔜 | 🆓 |
| T-31 | Gestor Formularios MINVU (`minvu`) | Formularios DOM | 🔜 | 🆓 |
| T-25 | Permiso de Edificación / derechos 1,5% (`permiso-edif`) | Trámites especiales | 🔜 | 🆓 |
| T-26 | Anteproyecto Municipal (`anteproyecto-mun`) | Trámites especiales | 🔜 | 🆓 |
| T-27/T-28 | Regularización Ley Mono · SEREMI de Salud | — | 🔜 (metadata futura, no en MOCK_CATALOG) |
| T-29 | Expediente municipal del gestor | — | 💀 eliminada |

### CARPETA 5 — CONSTRUCCIÓN  · subs: *EETT · Presupuesto · Seguimiento*
| ID | Herramienta (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-32 | EETT Generales (`eett-generales`) | EETT | 🔜 (espera BD EETT desde Excel, T-55) | 🆓 |
| T-33 | EETT Estructuras (`eett-estructuras`) | EETT | 🔜 | 🆓 |
| T-39 | Presupuesto de Proyectos / 28 UF/m² (`presupuesto`) | Presupuesto | 🔜 | 🆓 |
| T-40 | Carta Gantt (`gantt`) | Presupuesto | 🔜 | 🆓 |
| T-43 | **Seguimiento de Obras** (`seguimiento`) — avance, etapa, bitácora Normal/Retraso/Crítico | Seguimiento | ✅ | 🆓 |
| T-34..T-38, T-41, T-42 | EETT 3-5 · EP · stubs | — | 🔜 futuras / 💀 stubs eliminados (P3-B) |

### CARPETA 6 — ADMINISTRATIVOS  · subs: *Honorarios · Contratos · Pagos*
| ID | Herramienta (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-05 | **Propuesta de Servicios / Honorarios** (`propuesta`) — por etapas | Honorarios | ✅ | 🆓 |
| T-06 | **Calculadora de Honorarios** (`hsa`) — bruto/líquido, **retención 15,25% editable** | Honorarios | ✅ | 🆓 |
| T-45 | **Generador de Contratos** (`contratos`) — plantillas paramétricas | Contratos | ✅ | 🆓 |
| T-47 | Generador de Cobros (`cobros`) | Pagos | 🔜 | 🆓 |
| T-44 | Calculadora HSA | — | ✅ (consolidada con T-06 en el Mockup como `hsa`) |
| T-46 | Contabilidad | — | 💀 eliminada (P9) |

### CARPETA 7 — BIBLIOTECA DE RECURSOS  · subs: *Formularios oficiales · Normativa técnica*
| ID | Recurso (`id`) | Sub | Estado | Tier |
|---|---|---|---|---|
| T-48 | Formularios Municipales (`form-municipales`) — F-1.1-PE, F-1.2-AM, F-1.4-RD, Acred. Térmica, CIP | Formularios oficiales | ✅ parcial (links P13) | 🆓 |
| T-49 | Formularios SEREMI (`form-seremi`) | Formularios oficiales | 🔜 | 🆓 |
| T-51 | OGUC / LGUC (búsqueda semántica) (`oguc`) | Normativa técnica | 🔜 | 🆓 |
| T-50, T-52 | Formularios Financieros · otros | — | ⚠️/📋 metadata futura (P13) |

### BASES DE DATOS INTERNAS (motor — NO aparecen en la Biblioteca)
| ID | Base | Se usa a través de | Estado |
|---|---|---|---|
| T-53 | GeoJSON PRC por comuna (⟲ CONST §8: Hosting/CDN `/geo-data/`) | T-07 | ✅ (Ñuñoa: 1.718 zonas) |
| T-54 | Normativas PRC (Firestore `coordenadasnormativas`) | T-07 | ✅ |
| T-55 | EETT extensas + Itemizados | T-32…T-35, T-39 | 📋 futuras BD desde Excel |

### Fuera de taxonomía (resuelto)
| ID | Ítem | Decisión |
|---|---|---|
| T-56 | `SumiSlideRule.tsx` (regla de audio, ×5) | 💀 eliminar (P9) |
| T-57 | Política de contraseñas configurable | 💀 eliminar → política fija (P9) |
| T-58 | Catálogo homepage + links rotos | 💀 reemplazado por el Catálogo del Workspace |

### ★ ALCANCE FUNCIONAL DE LA v1 (según `estado:'active'` en el Mockup)
**14 herramientas activas:** T-01, T-02, T-03 (`participantes`), T-04 (`datos-proyecto`), **T-04b (`ubicacion`)**, T-07 (`geolocalizador`), T-08 (`mapa-terreno`), T-14 (`dimensionador`), **T-17 (`bim-wizard`, premium)**, T-24 (`expediente-dom`), T-43 (`seguimiento`), T-05 (`propuesta`), T-06 (`hsa`), T-45 (`contratos`), + recurso T-48 (`form-municipales`).
**+ 3 vistas estructurales activas:** T-59 Pricing, T-60 Admin, T-61 Share.
**Resto en 🔜 "Próximamente"** (visibles en gris): cabida, volumen, dim-publicos, bim-familias, iso19650, accesibilidad, listado-dom, minvu, permiso-edif, anteproyecto-mun, eett-generales, eett-estructuras, presupuesto, gantt, cobros, form-seremi, oguc.
**13 eliminadas/fusionadas:** T-11, T-12, T-13, T-19, T-29, T-36, T-37, T-38, T-42, T-46, T-56, T-57, T-58.

> ⟲ **Divergencias de catálogo vs v1.3 a confirmar:** (1) **T-04b `ubicacion`** es nueva. (2) En el Mockup **T-17 BIM ya está `active`** (no condicionada a P20 como en v1.3) — pero sigue siendo premium. (3) Top Tools por defecto = `dimensionador, geolocalizador, expediente-dom, hsa` (v1.3 proponía `Inicio, Geolocalizador, Dimensionador, Biblioteca`). (4) `hsa` consolida T-06 y T-44. Ver *Preguntas del Arquitecto* Q-5/Q-6.

---
## 3. ANÁLISIS DE REPETICIONES (QUÉ SE BORRA)

Sin cambios de fondo respecto de v1.3; el Mockup confirma la dirección de consolidación (un solo shell, un solo catálogo, un solo set de servicios).

### 3.1 Duplicación exacta — se borran 4 de 5 copias
| Archivo | Copias | Acción |
|---|---|---|
| `toolsData.ts` (933 l.) | 5/5 | motores → `_archive/`; labels/descripciones → reemplazados por `MOCK_CATALOG` / `registry.ts` |
| `types.ts` | 5/5 | → `src/core/types` (+ `members`, `superficieOrigen`, `estado`, tipos de plan) |
| `comunasData.ts` | 5/5 | → `src/core/data-chile` |
| `lib/workspace.ts` (export Google Docs) | 5/5 | 💀 eliminar (P10) → `DocPrintService` |
| `SumiSlideRule.tsx` | 5/5 | 💀 eliminar (P9) |
| `firestore.rules` | 5/5 | → 1 archivo raíz, reescrito (sub-colecciones + members + customers + config) |
| `stubs/`, `tsconfig`, `vite.config`, `.env.example`, `server.ts` | 5/5 | → 1 por proyecto |

### 3.2 Duplicación con deriva — consolidar en 1 versión canónica
| Archivo | Variantes | Canónica |
|---|---|---|
| `ProjectContext.tsx` (406 l.) | 3 | geolocalizador (sin `console.log`) → `ProjectRepository` |
| `ProjectManager.tsx` (3.550 l.) | 4 | descompuesto (en el Mockup: `tools/GestorViews.tsx`) |
| `ProjectTerrenoMap.tsx` (685 l.) | 3 | la del geolocalizador |
| `firebase.ts` | 2 | dimensionador (valida `'(default)'`) |
| `index.css` / `index.html` | 3 | 1 entrada; CSS empaquetado (`archibots.css`) |

### 3.3 Duplicación intra-archivo — el mayor ahorro
Bloque de ~110-150 líneas (auth + modal + invitados `localStorage` + `triggerToast` + header/footer) copiado en cada `App.tsx`. **Extracciones →** `AuthProvider`, `ProjectRepository` (Cloud/Local), `ToastProvider`, `<AppShell>`, `<AuthModal>`, `<BinderFicha>`, `<ToolCatalog>`, `<ToolHost>`, `DocPrintService`, `NormativaService`, `FeedbackService`, **`PaywallProvider`/`usePlan()`** ⟲, **`ShareService`** ⟲.

**Estimación:** ~14.000 líneas TSX actuales → **~5.000-6.000** activas. El Mockup ya prueba que el shell completo cabe en ~668 líneas + 11 vistas de herramienta + 3 vistas de sistema.

---
## 4. ARQUITECTURA FRONTEND Y LAYOUT MAESTRO

### 4.0 Layout de 6 bloques (confirmado tal cual en el Mockup)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1 <ModuleHeader> (ab-masthead)                                        │
│    logo SVG isométrico · [_Archibots ↗ link a inicio, tech-pulse]    │
│    subtítulo: MÓDULO · WORKSPACE UNIFICADO · NORMATIVA CHILENA        │
├──────────────────────────────────────────────────────────────────────┤
│ 2 <StatusBar> (ab-statusbar)                                          │
│    > C:\archibots\{carpeta}\{tool}.exe                                │
│    [usuario] [badge PLAN ⚡] ● SYSTEM_OK · [Compartir][Admin][Tema]    │
│    ⟲ CONST §3: el badge PLAN es interactivo → abre <PricingView>      │
├───────────────────────────────────┬──────────────────────────────────┤
│ 3a <BinderFicha> (archivador)     │ 3b <ToolCatalog>                 │
│    pestañas 0.FICHA…7.BIBLIOTECA  │    Ver por: Carpeta / Fase / Top │
│    Ficha: foto + Datos Clave +    │    Carpeta ▸ Subcategoría ▸      │
│    barra de avance (15 ítems %)   │      ToolCard [Explorar][Abrir]  │
│    + "Otros proyectos"            │      [‹ Agregar / ✓ En proyecto] │
├───────────────────────────────────┴──────────────────────────────────┤
│ 4 <ToolHost> (ab-toolhost, ancho total)                              │
│    monta la vista activa (React.lazy/Suspense en producción).        │
│    Si la tool es premium y plan=Free → monta <PricingView>.          │
│    Si estado=soon → tarjeta "MÓDULO EN DESARROLLO".                   │
├──────────────────────────────────────────────────────────────────────┤
│ 5 <CorporateFooter> (ab-cfooter)                                     │
│    meta-grid (Vista·Versión·Tema·DocID·Estatus·Usuario·Proyecto·…)   │
│    + caja feedback "¿Te gusta esta web?" + línea legal               │
├──────────────────────────────────────────────────────────────────────┤
│ 6 <TopToolsBar> (ab-toptools-bar, sticky bottom)                    │
│    "Herramienta en trabajo" · [Proy ▾ angosto] [INICIO] [TEMA ▾]    │
│    contenido configurable por el admin (config/topTools)            │
└──────────────────────────────────────────────────────────────────────┘
```

**Vistas de nivel superior (state machine `view`):** `'home'` (página de inicio: barra Top Tools en gris + grilla "Mis Proyectos" como carpetas + catálogo colapsado), `'workspace'` (el layout de arriba) y `'admin'` (AdminDashboard). El Mockup arranca en `workspace`.

### 4.A · MOTOR DE THEMING DINÁMICO ⟲ NUEVO v1.4

El Mockup implementa un **motor de theming basado en CSS Custom Properties con la nomenclatura de shadcn/ui**, definido íntegramente en `src/archibots.css`. Es la pieza arquitectónica más importante añadida desde v1.3.

#### Cómo funciona
1. **Atributo en la raíz.** El tema activo se aplica con un único efecto en React:
   ```ts
   useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
   ```
   No hay recarga ni recompilación: cambiar `data-theme` reescribe todas las variables en cascada y la UI entera se re-tematiza al instante.
2. **Tokens por tema (shadcn).** Cada tema es un bloque `:root[data-theme="..."]` que redefine el mismo set de variables semánticas:
   `--background, --foreground, --card, --card-foreground, --primary, --primary-foreground, --destructive, --destructive-foreground, --border, --border-thickness, --radius, --shadow-hard, --bg-texture, --muted, --muted-foreground, --success, --accent, --accent-foreground, --tab-bg, --tab-hover` y un set propio para la barra inferior `--bar*`.
3. **Tipografías dinámicas.** `--font-primary` y `--font-heading` también son tokens por tema, así que cada tema cambia la familia tipográfica (mono / serif+sans / code).
4. **Aliases legacy.** Los nombres antiguos del sistema *Washi & Sumi* (`--washi`, `--paper`, `--grey`, `--sumi`, `--red`, `--bw`, `--bg-grey`, `--accent-red`…) se conservan como **aliases** que apuntan a los tokens shadcn, para no reescribir las clases `.ab-*` y las vistas de herramienta heredadas.
5. **Clases utilitarias shadcn.** Se exponen clases planas (`.bg-card, .bg-muted, .bg-primary, .text-muted-foreground, .border-theme, .rounded-theme, .shadow-hard`, etc.) que consumen las variables. Las vistas nuevas (Pricing, Share, Admin) están escritas con estas clases → son temables en los 4 modos sin código condicional.
6. **Token de acento de progreso.** `--progress-accent` se define por tema (B&N en brutalist/washi/white, teal en matrix) para la barra de avance del expediente.

#### Los 4 temas soportados (la verdad: el Mockup tiene CUATRO, no tres)
⟲ **Corrección v1.4:** la consigna hablaba de 3 temas, pero `THEMES = ['brutalist','washi','matrix','white']` (`App.tsx:33`). Hay un cuarto tema **"white"**.

| Tema | `data-theme` | Identidad | Tipografía | Borde / Radio | Fondo / Texto |
|---|---|---|---|---|---|
| **Neo-Brutalista** (default) | `brutalist` | Identidad original Archibots; sombra dura `4px 4px 0`, esquinas a 0 | JetBrains Mono (mono) | 1.5px / `0px` | `#FAF8F6` / `#2E2E2E`, acento rojo `#D32F2F` |
| **Washi & Sumi** (suave/editorial) | `washi` | Papel cálido amarillento, sombra suave, textura de puntos | Inter (texto) + **Lora** (titulares, serif) | 1px / `6px` | `#F6EFDD` / `#34302A`, acento terracota `#C24A33` |
| **Matrix / VS Code** (modo código oscuro) | `matrix` | Estética de editor de código moderno oscuro | **Fira Code** (mono) | 1.5px / `4px` | `#1E1E1E` / `#D4D4D4`, primario teal `#178C7C`, barra gris VS Code |
| **White** (neutro tipo Claude) ⟲ NUEVO | `white` | Base shadcn "neutral": grises puros, casi sin color, sombra muy sutil | Inter (sans) | 1px / `8px` | `#F7F7F7` / `#232323`, único acento rojo `#DC2626` |

El selector cicla los 4 con `cycleTheme()` y está disponible en la barra de estado (botón "Tema") y en la barra inferior. El tema activo se refleja en el footer (`Tema activo`). **Persistencia recomendada (producción):** guardar la preferencia en `users/{uid}.theme` o `localStorage` (el Mockup mantiene el tema solo en estado de React).

#### Implicaciones para el refactor
- El `archibots-master.css` legacy queda **obsoleto**: la fuente de estilos es `archibots.css` (empaquetado en el build, ya no hot-linkeado desde Storage).
- Todas las vistas de herramienta deben migrar a tokens/variables (no colores hardcodeados) para heredar el theming. Las 3 vistas de sistema ya cumplen.
- shadcn/ui como sistema de design tokens queda **adoptado de facto**; no requiere instalar la librería completa, solo respetar la nomenclatura de variables y las clases utilitarias.

### 4.B · Decisiones de layout (confirmadas / actualizadas)
1. **Estética = tokens shadcn temables; estructura = binder + catálogo.** CSS empaquetado.
2. **[_Archibots] en el header es link a inicio** (`onClick → goHome`), con animación `tech-pulse` en el "_".
3. **Header corporativo en el footer** + caja de feedback → email a **goyogramador@gmail.com** vía `POST /api/feedback`. Línea legal: Términos y Condiciones · Política de Privacidad (P21).
4. **Catálogo con subcategorías** (carpeta → `sub` → ToolCard) con expansión animada (`AnimatePresence`). El filtro "Ver por" ofrece **Carpeta / Fase / Top**. Subcategorías reales (de `MOCK_CATALOG`):

   | Carpeta | Subcategorías (reales en el Mockup) |
   |---|---|
   | 1. Información | Datos generales |
   | 2. Terreno | Análisis predial · Cabida |
   | 3. Proyecto | Dimensionadores · BIM · Accesibilidad y Normativa |
   | 4. Expedientes | Formularios DOM · Trámites especiales |
   | 5. Construcción | EETT · Presupuesto · Seguimiento |
   | 6. Administrativos | Honorarios · Contratos · Pagos |
   | 7. Biblioteca | Formularios oficiales · Normativa técnica |

5. **ToolCard** ofrece **[Explorar]** (despliega descripción + fases), **[Abrir]** (monta en el ToolHost; si premium+Free muestra candado), y **[‹ Agregar] / [✓ En proyecto]** (vincula la herramienta a la carpeta del proyecto activo; estado en `addedTools: Record<projectId, toolId[]>`).
6. **Top Tools Bar** (bloque 6): barra sticky inferior. Default `['dimensionador','geolocalizador','expediente-dom','hsa']`, editable por admin (ranking en `config/topTools`).
7. **Niveles de acceso (P5/P6/P7) — actualizados a 3 productos:**

   | Nivel | Proyectos | Herramientas | Persistencia |
   |---|---|---|---|
   | Invitado | 1 local | todas las activas free | `localStorage` (⟲ CONST §7: **sin migración**) |
   | Base (free) | 1 local | todas las free | `localStorage` (⟲ CONST §7: el proyecto Free vive en local; **no** sube a Firestore al hacer upgrade) |
   | **Pase por Proyecto** ⟲ | +1 desbloqueo puntual | todas (incl. premium) **para ese proyecto**; colaboradores Free → **solo lectura** (⟲ CONST §11) | `entitlements/{uid}` |
   | Premium | hasta 50 (⟲ CONST §15) | todas + premium | `customers/{uid}` (proyectos nuevos nacen en la nube) |

   Compartir (P7): `members{uid:'editor'|'viewer'}` + invitación por correo/enlace. ⟲ CONST §7: al pasar de Free a Premium **no** se migra el proyecto local; los proyectos Premium nacen directamente en Firestore y el local queda aislado.
8. **Routing (P1-A):** `react-router`, `/m/:toolId` + `?p=:projectId`; rutas `/`, `/admin`, `/pricing`, `/legal/*`.
9. **Documentos (P10):** `DocPrintService` (HTML + `@media print`, [IMPRIMIR]/[DESCARGAR PDF]). Sin `googleapis`.
10. **Code splitting:** cada herramienta vía `React.lazy()` en `registry.ts` (ver 5.5). El Mockup importa estático (`TOOL_COMPONENTS`), pero el registry de producción usará lazy.

**Hitos de ejecuc

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
