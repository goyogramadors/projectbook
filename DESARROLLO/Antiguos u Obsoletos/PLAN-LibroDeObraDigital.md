# Plan de desarrollo — Libro de Obra Digital (producto derivado)

**Estado:** propuesta · **Fecha:** 2026-06-26 · **Autor:** sesión Basepro
**Mock de referencia:** `DESARROLLO/LibrodeObra-mock.html`

---

## 1. Objetivo y alcance

Crear una entrada de producto independiente, **"Libro de Obra Digital — un producto de Archiblocks"**, servida en el subdominio `librodeobra.archibots.cl`, que:

- usa **el mismo backend** (Firebase/Firestore), **la misma cuenta** y **el mismo gating Premium** que Archiblocks;
- expone **solo dos herramientas**: Libro de Obras Digital (`libro-obras`) y Carpeta Digital (`carpeta-digital`);
- trata cada **obra como un proyecto** de la colección `projects` ya existente (mismos registros, vista filtrada), sin esquema nuevo;
- presenta una **landing propia** y una **vista de trabajo a 3 columnas** (Mis Obras · Sub-libros/Árbol · Folios/Documentos + franja Agregar).

Fuera de alcance por ahora: plan/suscripción separada, esquema de datos nuevo, reescritura de la lógica de las herramientas.

---

## 2. Decisión de arquitectura

**Un solo código base "consciente del host" (host-aware), no un segundo proyecto.**

El mismo build de Vite se publica en el mismo proyecto de Cloudflare Pages, al que se le añade `librodeobra.archibots.cl` como *custom domain*. En arranque, la app lee `window.location.hostname` y fija un **contexto de producto** (`archiblocks` | `librodeobra`). Ese contexto decide el shell, la landing, el set de herramientas visibles y el branding. Comparte el 100% de auth, providers, Firestore y componentes de herramienta.

Ventajas frente a un segundo proyecto Vite: cero duplicación de auth/DB, un solo deploy, los arreglos a las herramientas benefician ambos productos. El aislamiento que pide "subdominio propio" se logra por host + branding, no por repos separados.

> Alternativa descartada (por ahora): app/build separado que importe paquetes compartidos. Más aislada pero duplica configuración de Firebase, routing y CI; solo se justificaría si los productos divergen mucho.

---

## 3. Piezas a construir y cómo reusan lo existente

### 3.1 Contexto de producto
Nuevo `core/product/ProductContext.tsx`: deriva el producto del hostname (con override por `?product=` para pruebas en local y en `*.pages.dev`). Expone `product`, `brand`, `toolset` (lista blanca de toolIds), `labels` (p. ej. "Obra" vs "Proyecto").

### 3.2 Routing
Reusar `createBrowserRouter` y `AppShell`. El árbol de rutas se elige por producto:
- `librodeobra`: `/` → `LibroLandingView`; `/o/:projectId` → `LibroWorkspaceView`; se mantienen `/pricing`, `/legal/:doc`, `/admin`, `*`.
- `archiblocks`: rutas actuales sin cambios.

`projectId` sigue siendo el id real de `projects`; "obra" es solo la etiqueta de UI.

### 3.3 Landing (`views/LibroLandingView.tsx`)
Portar el mock: título, "Iniciar Obra" (reusa el flujo actual de crear proyecto de `ProjectProvider`/`ProjectRepository`), "Explorar Herramienta", y accesos directos "Mis Obras" alimentados por la lista de proyectos del usuario (`useProjects`). Sin colección nueva.

### 3.4 Vista de trabajo a 3 columnas (`views/LibroWorkspaceView.tsx`)
Columna 1 angosta "Mis Obras" (selector de proyecto, reusa `useProjects`). Columnas 2 y 3 + franja Agregar = el contenido actual de cada herramienta, mostrado "grande".

Las herramientas hoy renderizan sus propias columnas (`| SUB-LIBROS` / `| FOLIOS` en `LibroObrasDigitalView`; `| ÁRBOL` / `| AGREGAR DOCUMENTO` en `CarpetaDigitalView`). Plan de reuso, de menor a mayor esfuerzo:

1. **Reuso directo (rápido):** montar `LibroObrasDigitalView` / `CarpetaDigitalView` tal cual dentro de un contenedor ancho, pasándoles `projectId`. Sirve para validar de inmediato; el layout fino de 3 columnas queda aproximado.
2. **Refactor presentacional (recomendado):** extraer de cada view los sub-bloques (lista de sub-libros/árbol, lista de folios/documentos, formulario Agregar) a subcomponentes que reciban props, y que tanto el binder actual como `LibroWorkspaceView` los compongan. Mantiene una sola fuente de lógica/estado y permite el layout grande pedido.

Se recomienda 1 para la primera iteración y 2 para dejarlo prolijo.

### 3.5 Shell y branding (`components/ShellTop` parametrizado)
Añadir prop/lectura de `product` a `ShellTop`: en `librodeobra` la marca dice "Libro de Obra **Digital** / un producto de Archiblocks" y el navegador de bloques reduce nodos (solo Inicio · Obras). Reusar la barra inferior. Theme provider sin cambios.

### 3.6 Gating Premium
Reusar `useAccess`/`ToolHost`. Ambas herramientas ya son Premium; el producto hereda ese gating con la misma cuenta. Verificar que el flujo "Premium requerido" funcione también en las rutas `/o/:projectId`.

---

## 4. Deploy (Cloudflare Pages + DNS)

1. En el proyecto Pages `projectbook` → **Custom domains** → agregar `librodeobra.archibots.cl`. Pages crea el CNAME correcto automáticamente (Proxied).
2. Confirmar que el SPA responde en el subdominio (mismo `index.html`, rutas SPA).
3. La detección por hostname activa el modo `librodeobra` sin variables de entorno.
4. Sin cambios en Functions ni Email Routing.

**Consideración de invitaciones:** las Functions hoy generan enlaces con base `https://archibots.cl/...` (recién corregido). Para invitaciones creadas desde una obra convendría que el enlace apunte a `https://librodeobra.archibots.cl/o/...`. Opciones: pasar el origen/producto como parámetro a la function, o derivar la base del `Origin` de la request. Marcar como ítem a resolver en la fase de invitaciones.

---

## 5. Fases

**Fase 0 — Mock (hecho).** `LibrodeObra-mock.html` aprobado como referencia visual.

**Fase 1 — Esqueleto host-aware.** ProductContext + selección de router + `LibroLandingView` portando el mock con datos reales (`useProjects`, crear obra). Probar con `?product=librodeobra` en local.

**Fase 2 — Workspace 3 columnas.** `LibroWorkspaceView` con reuso directo (opción 3.4.1) de ambas herramientas y el conmutador LDO/Carpeta. Estado y persistencia ya existentes.

**Fase 3 — Branding y refactor fino.** `ShellTop` parametrizado, barra inferior, y refactor presentacional (opción 3.4.2) para el layout grande definitivo.

**Fase 4 — Subdominio en producción.** Custom domain en Pages + verificación SPA + gating Premium en rutas nuevas.

**Fase 5 — Invitaciones y pulido.** Base de enlace product-aware en Functions; QA de permisos (owner/members), responsive y temas.

---

## 6. Riesgos y puntos abiertos

- **Acoplamiento de las herramientas a su layout actual:** si los views tienen el layout muy embebido, la opción 3.4.2 (extraer subcomponentes) puede tomar más de lo previsto. Mitiga empezar con reuso directo.
- **Enlaces de invitación cruzados** entre los dos productos (sección 4).
- **SEO/branding:** títulos, favicon y metadatos por producto (resolver con el ProductContext en `index.html`/head dinámico).
- **Confirmar** que no se requiere ocultar las obras del listado de "Proyectos" en Archiblocks (hoy se decidió: mismos registros, sin separar). Si más adelante se quiere separar, basta añadir un campo opcional `tipo` sin romper nada.

---

## 7. Esfuerzo estimado (orientativo)

Fase 1: 0,5–1 día · Fase 2: 1–1,5 días · Fase 3: 1–2 días · Fase 4: 0,5 día · Fase 5: 0,5–1 día.
Total aproximado: **4–6 días** de desarrollo, sin cambios de backend ni de esquema.
