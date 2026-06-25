# 🖋️ Tintero — Pendientes

> Lista viva de pendientes funcionales y de UX de **Project_Book / Archibots**.
> Marca con `[x]` lo resuelto y deja una nota breve. Cada ítem incluye los archivos probables
> a tocar (según `MAPA_ARQUITECTURA_PROYECTO.md`) — **verificar antes de editar** y aplicar las
> reglas de desarrollo de `Iniciar Aquí.md` §8 (edición quirúrgica, no reescribir lo que funciona).
>
> **Última actualización:** 2026-06-22

---

## Funcionalidad / lógica

- [ ] **1. Revisar funcionalidad Maps.**
  Comprobar carga del SDK de Google Maps en runtime y degradación a ingreso manual si falla.
  *Archivos:* `src/tools/GeolocalizadorView.tsx`, `src/tools/MapaTerrenoView.tsx`, `@googlemaps/js-api-loader`; depende de `VITE_GOOGLE_MAPS_API_KEY` en `.env.local`.

- [ ] **2. Arreglar creador de polígono.**
  Dibujo del polígono y cálculo de área. Revisar interacción mapa ↔ Web Worker.
  *Archivos:* `src/tools/MapaTerrenoView.tsx` / `GeolocalizadorView.tsx`, `src/workers/geo.worker.ts` (op `area`), sync §6 (`hooks/useDimensionadorSync.ts`).

- [ ] **3. Revisar funcionamiento del módulo BIM.**
  Asistente de usos BIM (Premium) y su llamada al backend.
  *Archivos:* `src/tools/BimWizardView.tsx` (T-17), Cloud Function `apiProxy` en `functions/src/index.ts`, gating `useAccess.ts`.

- [ ] **4. Revisar administración de Top Tools.**
  Gestión/ranking de las herramientas destacadas y su barra inferior.
  *Archivos:* `src/views/AdminDashboard.tsx` (ranking), `src/components/TopToolsBar.tsx`, `src/core/catalog.ts` (`TOP_TOOLS_DEFAULT`), config `config/topTools`.

- [ ] **9. Revisar funcionamiento de la Ficha Normativa.**
  Validar la Coreografía de Conexión y la ficha PRC resultante.
  *Archivos:* `src/core/NormativaService.ts` (DB `coordenadasnormativas`, llave `{comuna}_{zona}`), `src/core/useCerebroNormativo.ts`, `GeolocalizadorView.tsx`, `GeoJsonService.ts`.

---

## UX / layout

- [ ] **6. Reubicar botón "Compartir proyecto".**
  *Archivos:* `src/components/StatusBar.tsx` (botón compartir), `src/views/ShareProjectModal.tsx`.

- [ ] **7. Quitar la barra de progreso del expediente** de la ficha del expediente.
  *Archivos:* `src/components/BinderFicha.tsx` (bloque ficha + avance).

- [ ] **8. Reubicar "Avance del expediente".**
  *Archivos:* `src/components/BinderFicha.tsx` (avance).

- [ ] **10. Arreglar formato de la ficha de exportación.**
  Lámina imprimible (membrete + firma) y reglas de impresión.
  *Archivos:* `src/components/DocumentExportWrapper.tsx`, `@media print` en `src/archibots.css`.

---

## Infraestructura / no-código

- [ ] **5. Crear correo `@archibots`.**
  Cuenta/dominio de correo institucional. Una vez activo, alinear la dirección de envío de las Cloud Functions de email.
  *Relacionado:* remitente (`from:`) de `sendInviteEmail` / `sendPremiumInviteEmail` en `functions/src/index.ts` (hoy usa una cuenta personal); secreto `SENDGRID_API_KEY`.

---

> **Nota:** la numeración respeta la lista original de Andrés (incluye dos ítems rotulados "8" en el origen; aquí quedaron como 8 y 10 para no perder ninguno). Total: 10 pendientes.

---

## Tarea Especial — Incorporación de 5 herramientas nuevas (mockups `DESARROLLO/`)

> Enunciada en `Iniciar Aquí.md` §6; los mockups ya están en `C:\G\ProjectBook\DESARROLLO`.
> Objetivo: incorporar las 5 herramientas a la web, **compatibles a nivel de interfaz y de base de datos**, respetando la arquitectura productiva (lazy en `registry.ts`, metadata en `catalog.ts`, tipos en `types.ts`, persistencia por subcolección en `(default)` / `localStorage`) y las reglas de `Iniciar Aquí.md` §8.
> **Fecha de plan:** 2026-06-22.

### A. Inventario y mapeo mockup → catálogo

| # | Herramienta (mockup) | Carpeta `DESARROLLO/` | ID catálogo existente | Estado hoy | Acción |
|---|---|---|---|---|---|
| 1 | **Carpeta Digital** | `LOD y COD/` | — (no existe) | inexistente | **Crear entrada** (parte del subsistema Obra Digital) |
| 2 | **Libro de Obras Digital** | `LOD y COD/` | `libro-obras` (carpeta 5, Seguimiento e ITO) | `soon` | Activar |
| 3 | **Memoria de Ruta Accesible** | `files ruta accesible/` | `accesibilidad` (carpeta 4, Informes especiales) | `soon` | Activar + alinear label |
| 4 | **Informe Norma Térmica** | `files informe termico/` | `informe-termico` (carpeta 4, Informes especiales) | `soon` | Activar |
| 5 | **Informe de Subsuelo** | `files subsuelo/` | `informe-suelo` (carpeta 4, Informes especiales) | `soon` | Activar |

**Reconciliación de IDs (decisión tomada):** se **conservan los IDs ya presentes** en `catalog.ts` (`libro-obras`, `accesibilidad`, `informe-termico`, `informe-suelo`) y se descartan los IDs alternativos sugeridos en las memorias (`obra-digital`, `ruta-accesible`, `informes-termicos`, `informe-subsuelo`) para no introducir drift con la metadata ya cableada (carpeta, sub, icono). Los nombres de las memorias se reflejan solo en los **archivos de componente** y en el `label`.

### B. Correcciones obligatorias a las memorias (NO trasladar tal cual)

Las memorias de los mockups asumen patrones **incompatibles con producción**; deben adaptarse:

1. **Bases de datos nombradas → subcolecciones en `(default)`.** Las memorias proponen `obraDigitalDb` e `informesTermicosDb`. En producción la **única** DB nombrada es `coordenadasnormativas` (Cerebro Normativo, read-only). Todas estas herramientas deben persistir como las 20 actuales: **subcolección bajo `projects/{projectId}/…`** en la DB `(default)`, protegida por `firestore.rules` (zero-trust, `request.auth.uid`).
2. **`postMessage` → contrato `ToolProps` + host directo.** Los generadores (Ruta Accesible, Subsuelo) exponen `window.parent.postMessage(...)`. Se reemplaza por el patrón productivo: el componente recibe `{ projectId, access }`, persiste vía el hook estándar y exporta con `DocumentExportWrapper` (membrete + firma) ya usado por las otras herramientas.
3. **`Mockup/` es DEPRECATED para código** (`Iniciar Aquí.md` §7). Los `index.html` de `DESARROLLO/` valen como **referencia de UX/CSS y de catálogos**, no como fuente de imports/tipos.
4. **`import type { X }` obligatorio** (Vite/oxc) en todo el código nuevo; tipos centralizados en `types.ts`.

### C. Estratificación por complejidad (define el orden de trabajo)

**Grupo 1 — Generadores de formulario (ligeros).** Patrón idéntico a herramientas simples existentes (un doc de config + `localStorage` Free + export PDF). Bajo riesgo, alto valor inmediato.

- **Informe de Subsuelo** (`informe-suelo`): 7 tipos de suelo fijos, hasta 3 horizontes, vista de estratigrafía en vivo, adjuntos JPG/PNG, serialización → PDF.
- **Memoria de Ruta Accesible** (`accesibilidad`): 8 grupos de verificación + 2 sub-bloques, bloque asistido ítem 2.1 (cálculo de ancho), selector propio 3.1, hasta 4 imágenes, export PDF con firma. Reusa la **carga de ocupación** ya existente (`carga-ocupacion`).

**Grupo 2 — Subsistemas (pesados, multi-módulo).** Requieren Storage con UUID, posibles Web Workers, contadores transaccionales, paginación con cursores, índices compuestos y caché IndexedDB. Mayor esfuerzo; candidatos a `tier: 'premium'` (a confirmar).

- **Informe Norma Térmica** (`informe-termico`): motor de cálculo térmico (U, Rt, condensación Glaser) en Web Worker; catálogos de zonas/materiales/tablas `as const` (varias tablas **`POR COMPLETAR`** en el glosario); reutiliza el motor "Dos Cerebros" (Turf) para áreas. **Bloqueante de datos:** cargar Tablas 1/2/3/5/6/10/12 y catálogo de materiales antes de acreditar.
- **Obra Digital** (Carpeta Digital + Libro de Obras): subsistema de 2 módulos con `ModuleSwitcher`, árbol colapsable, versionado, archivado reversible, adjuntos UUID, Acta de Apertura, permisos denormalizados (`lectores[]`/`editores[]`), counters Año→Mes y paginación con cursores.

### D. Integración a nivel de INTERFAZ (común a las 5)

1. **`types.ts`** — añadir contratos de dominio por herramienta (`InformeSubsuelo`, `Horizonte`; `MemoriaRutaAccesible`, `VerificacionItem`, `SubBloque`; `ZonaTermica`, `Complejo`, `Capa`, `Acreditacion*`; `ArchivoVersion`, `EntradaFolio`, `LibroDoc`). Sin declarar tipos fuera de este archivo.
2. **`registry.ts`** — una entrada `lazy(() => import('../tools/XxxView'))` por herramienta en `LAZY_COMPONENTS` (un chunk por tool).
3. **`catalog.ts`** — cambiar `estado: 'soon' → 'active'` en las 4 entradas existentes; **crear** la entrada de Carpeta Digital; revisar `label`/`icon`/`tier`. Evaluar si alguna entra en `TOP_TOOLS_DEFAULT`.
4. **Componentes** en `src/tools/` (uno por archivo): reciben `ToolProps`, respetan `access` (`read`/`locked` → solo lectura), estilos `archibots.css` (4 temas), íconos `lucide-react`, animaciones `framer-motion`.
5. **Export PDF**: `DocumentExportWrapper` (membrete + firma del profesional), no `postMessage`.
6. **Decisión de Carpeta Digital + Libro de Obras (HITL):** el mockup los construye como **un solo componente** con `ModuleSwitcher` (comparten proyecto/permisos). Dos opciones:
   - (A, recomendada) **Un componente** `ObraDigitalView` con dos módulos internos; en el catálogo se exponen **dos tarjetas** (`carpeta-digital` y `libro-obras`) que montan el mismo componente abriendo el módulo correspondiente.
   - (B) Dos componentes independientes (más duplicación de permisos/Storage).
   → **Confirmar con Andrés** antes de codificar (regla §5 "preguntar antes de borrar/decidir estructura").

### E. Integración a nivel de BASE DE DATOS

1. **Subcolecciones en `(default)`** (Premium) + `localStorage` `ab-<toolId>-${projectId}` (Free/invitado), con degradación offline → local, replicando `SeguimientoObrasView` y el hook `useToolData.ts`:
   - `projects/{pid}/informeSubsuelo/{config}`
   - `projects/{pid}/rutaAccesible/{config}`
   - `projects/{pid}/informeTermico/{config}` + `…/complejos/{id}` + `…/acreditaciones/{id}` + `…/informes/{id}`
   - `projects/{pid}/obraDigital/{config}` + `…/archivos/{id}` + `…/carpetasCustom/{id}` + `…/libros/{id}` + `…/libros/{id}/entradas/{folioId}`
2. **`firestore.rules`** — extender las reglas de subcolección de `projects/{pid}` para cubrir las nuevas rutas **manteniendo zero-trust** (validar `request.auth.uid` contra `ownerId`/`members`). No tocar las reglas de `coordenadasnormativas`.
3. **`firestore.indexes.json`** — solo para Obra Digital / Térmico (los ligeros no requieren índices compuestos): p. ej. `(libroId, estado, fecha desc)`, `(ym, estado, fecha)`, `(lectores array-contains, fecha)`.
4. **Storage** — adjuntos con `storageRef` **UUID** (nombre original como metadato). Regla de Storage por proyecto con la misma validación de membresía. Aplica a Obra Digital (Novedades A/B/C) y a imágenes de los generadores si se decide subirlas a la nube (en Free quedan en memoria/local, no persistentes).
5. **Estado del expediente (S7)** — al guardar, actualizar `toolStates[toolId] = { estado, fecha }` en el master (`ProjectMaster.toolStates`) para que el avance del expediente refleje las nuevas herramientas. `addedTools[]` se mantiene sin romper.
6. **Counters / paginación** (solo Obra Digital): contadores Año→Mes transaccionales (cuentan solo `estado==='activo'`) y cursores `limit`/`startAfter`.

### F. Despliegue y verificación

1. `npm run build` (= `tsc -b && vite build`) — verificar 0 errores TS y que cada tool genere su chunk.
2. Validar archivos grandes en scratch con esbuild (`transformSync`, loader `tsx`) antes de montar (regla §8: el montaje puede truncar ediciones largas).
3. `firebase deploy --only firestore:rules` y `--only firestore:indexes` si hubo cambios; luego `--only hosting`.
4. Prueba funcional por herramienta: alta/edición/persistencia Premium vs Free, `access` read-only, export PDF, y (Obra Digital) archivado/restauración + apertura de libro.

### G. Orden de ejecución propuesto (sprints)

1. **Sprint 1 (rápido):** Informe de Subsuelo + Memoria de Ruta Accesible (Grupo 1). Tipos → catálogo `active` → componentes → persistencia subcolección/local → PDF → deploy.
2. **Sprint 2:** Informe Norma Térmica (worker + catálogos; dejar tablas `POR COMPLETAR` señalizadas en UI hasta cargar datos oficiales).
3. **Sprint 3:** Obra Digital (Carpeta + Libro) — el más complejo; requiere decisión D.6, Storage UUID, rules, índices y counters.

### H. Decisiones (HITL) — RESUELTAS 2026-06-22

- [x] **D.6** — Carpeta Digital y Libro de Obras = **dos componentes/tools independientes** (opción B). Cada uno su archivo en `src/tools/`, su entrada en catálogo/registry y su subcolección.
- [x] **Tier** — **Térmico y Obra Digital (Carpeta Digital + LDO) = `premium`** (gating `useAccess`/`ToolHost`). Subsuelo y Ruta Accesible = `free`.
- [x] **Datos `POR COMPLETAR`** del Térmico — Se construye y activa motor/UI, pero **no acredita en producción hasta cargar las Tablas oficiales** (U máx/Rt mín por zona + materiales λ/ρ/μ). Mientras falten: cálculo U/Rt visible con badges **"Pendiente"** (nunca "OK"). Carga de tablas = tarea de datos paralela, no bloquea el código. En el mockup: placeholders rotulados.
- [x] **Adjuntos** — **Solo Premium** (Storage UUID). En Free no hay adjuntos.

### I. Fase 0 — Mockups integrados (previo al desarrollo real)

Antes del desarrollo productivo se generan **mockups funcionales integrados en la web** (no standalone): un componente nuevo por tool en `src/tools/`, cableado en `catalog.ts` + `registry.ts`, montable y clicable dentro de la app real para validar UX y flujo.
- **Estado mockup:** solo `useState` en memoria; **sin** Firestore/Storage/Web Worker/PDF real (se usa `window.print()` + `DocumentExportWrapper` para la vista). Cabecera rotulada `// MOCKUP`.
- **Separación de código:** cada tool es archivo independiente (patrón de las 20 actuales); el desarrollo real luego sustituye internamente persistencia/motor sin tocar a las demás.
- **Tools (5):** `informe-suelo` (Subsuelo), `accesibilidad` (Ruta Accesible), `informe-termico` (Térmico), `libro-obras` (LDO), `carpeta-digital` (**nueva entrada** de catálogo). **Ruta del código:** `C:\G\ProjectBook\Web\src\...`.

*Archivos a tocar:* `src/core/types.ts`, `src/core/registry.ts`, `src/core/catalog.ts`, `src/tools/*View.tsx` (5 nuevos), `firestore.rules`, `firestore.indexes.json`, reglas de Storage; referencia de UX/catálogos en `DESARROLLO/**` (memorias + glosarios + `index.html`).
