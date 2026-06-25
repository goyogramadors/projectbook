# 🧩 Reporte — Mockups de las 5 herramientas nuevas (Fase 0)

> Resumen para **retomar este trabajo desde otra instancia de Claude**.
> Contexto general del proyecto: leer primero `C:\G\ProjectBook\Iniciar Aquí.md`.
> Plan completo y decisiones: `DESARROLLO\Tintero - Pendientes.md` → secciones **"Tarea Especial"**, **H** y **I**.
> **Fecha:** 2026-06-22 · **Estado:** mockups integrados construidos; **falta validar build local y desarrollo real**.

---

## 1. Qué se pidió

Incorporar a Archibots las **5 herramientas nuevas** cuyos prototipos están en `C:\G\ProjectBook\DESARROLLO`. Antes del desarrollo productivo, generar **mockups funcionales integrados en la web real** (no standalone), con el código **separado por archivo** para que cada uno sea luego una tool independiente (mismo patrón que las 20 actuales en `src/tools`).

---

## 2. ⚠️ Cambio de estructura (importante para retomar)

La app se movió a la subcarpeta **`Web/`**. El root del código React/Vite es ahora:

```
C:\G\ProjectBook\Web\        ← src/, firebase.json, firestore.*, functions/, public/, package.json, dist/
C:\G\ProjectBook\Iniciar Aquí.md
C:\G\ProjectBook\DESARROLLO\ ← mockups origen + Tintero + este reporte
```

Editar tools en `C:\G\ProjectBook\Web\src\...`. (El mount de bash a veces devuelve listados vacíos: preferir lectura/escritura de archivos concretos por ruta, no `ls` masivos.)

---

## 3. Decisiones HITL tomadas (Andrés, 2026-06-22)

| Decisión | Resolución |
|---|---|
| Carpeta Digital vs Libro de Obras | **Dos tools independientes** (archivos separados). |
| Tier | **Térmico, Libro de Obras y Carpeta Digital = `premium`**; Subsuelo y Ruta Accesible = `free`. |
| Tablas `POR COMPLETAR` del Térmico | Se construye motor/UI, pero **no acredita hasta cargar Tablas oficiales** (U máx/Rt mín por zona + materiales λ/ρ/μ). Mientras tanto badges **"Pendiente"**, nunca "OK". |
| Adjuntos | **Solo Premium** (en Free no hay adjuntos). |

---

## 4. Qué se construyó (las 5 tools, integradas)

Todas en `Web/src/tools/`, cableadas en `Web/src/core/registry.ts` (lazy) y `Web/src/core/catalog.ts` (`estado: 'active'`).

| Herramienta | `id` | Carpeta catálogo | Tier | Archivo |
|---|---|---|---|---|
| Informe de Subsuelo | `informe-suelo` | 4 · Informes especiales | free | `InformeSubsueloView.tsx` |
| Memoria de Ruta Accesible | `accesibilidad` | 4 · Informes especiales | free | `RutaAccesibleView.tsx` |
| Informe Norma Térmica | `informe-termico` | 4 · Informes especiales | premium | `InformesTermicosView.tsx` |
| Libro de Obras Digital | `libro-obras` | 5 · Seguimiento e ITO | premium | `LibroObrasDigitalView.tsx` |
| Carpeta Digital | `carpeta-digital` (**entrada nueva**) | 5 · Seguimiento e ITO | premium | `CarpetaDigitalView.tsx` |

**Funcionalidad de cada mockup:**
- **Subsuelo:** calicata, 3 horizontes (7 tipos de suelo fijos), estratigrafía con profundidad acumulada en vivo, aptitud con pill de color, vista previa exportable.
- **Ruta Accesible:** 8 grupos colapsables con resumen de estados, sub-bloques SS.HH. (9) / Ducha (5), selector propio ítem 3.1, **bloque asistido 2.1** con cálculo OGUC en vivo (0,005 m/persona, mín. 1,10 m).
- **Térmico:** riel de pasos 0–7, selector de zona (comuna→zona semilla + manual A–I), `ComplejoEditor` reutilizable Techo/Muro/Piso con capas Campo+Puente y **U ponderado** (motor demo `Rt=Rsi+Σe/λ+Rse`), badges **"Pendiente"**, botón Generar bloqueado.
- **Libro de Obras:** sub-libros 🔒 cerrados → 📖 Acta de Apertura → folios; nueva entrada tipificada (LOD 1.1–2.2 + libre); archivar/restaurar (estado `activo|archivado`).
- **Carpeta Digital:** árbol por tipo de contrato (6) → carpetas semilla → documentos con versión; agregar (nueva versión), archivar/restaurar, nodo 🗃️ Archivados.

---

## 5. Naturaleza del mockup (qué es y qué NO es)

- **Estado solo en memoria** (`useState`): **no persiste** (sin Firestore/Storage). Recargar borra los datos.
- **Sin PDF real** (`window.print()` sobre `DocumentExportWrapper`), **sin Web Worker**, **sin subida de archivos** (adjuntos rotulados como Premium).
- Cabecera `// MOCKUP` en cada archivo; badges visibles `MOCKUP` / `PREMIUM` / `POR COMPLETAR`.
- **No desplegado** (no se corrió `firebase deploy`). Cambios additivos y reversibles: volver `estado` a `'soon'` en `catalog.ts` los oculta.
- Patrón productivo respetado: `ToolProps {projectId, access}`, respeta `access` (read-only), clases `archibots.css` (`tool-panel`, `ab-split`, `tech-input-group`, `technical-btn`), `lucide-react`, `framer-motion`, `import type`.

---

## 6. Estado y pendientes

- [x] 5 mockups construidos y cableados (registry + catalog).
- [x] Decisiones + plan en `Tintero - Pendientes.md` (secciones Tarea Especial / H / I).
- [x] Memoria del proyecto actualizada (root movido a `Web/`).
- [ ] **VALIDAR BUILD** — no se pudo correr `tsc`/`npm run build` por inestabilidad del mount del sandbox (devolvía "file not found" para archivos existentes). **Las escrituras se confirmaron una a una.** Pendiente: `cd Web && npm run build` (0 errores TS esperados) y `npm run dev` para clicar.
- [ ] Los 3 Premium aparecen **bloqueados** para Free/invitado (gating `useAccess`). Para revisar sin login: entrar con cuenta Premium o poner `tier: 'free'` temporalmente.
- [ ] **Desarrollo real** (sustituir el mockup por producción), por tool:
  - Tipos de dominio → `Web/src/core/types.ts` (centralizado).
  - Persistencia → `useToolData('<id>', projectId, fallback)` → `projects/{pid}/toolData/{id}` (Premium) / `localStorage ab-<id>-{pid}` (Free). Para subsistemas (Térmico/Obra Digital) ver subcolecciones en Tintero §E.
  - `firestore.rules` + `firestore.indexes.json` + reglas Storage (solo Premium con adjuntos).
  - Térmico: motor real en Web Worker + cargar Tablas oficiales (quitar "Pendiente").
  - Libro/Carpeta: Storage UUID, counters, paginación, permisos denormalizados.
  - Actualizar `ProjectMaster.toolStates[id]` al guardar (avance del expediente).

---

## 7. Cómo revisar (resumen)

1. **Código:** abrir los 5 archivos en `Web/src/tools/`.
2. **App:** `cd C:\G\ProjectBook\Web && npm run dev` → entrar a un proyecto → catálogo carpetas 4 y 5.
3. **Prototipos origen (referencia UX):** abrir los `index.html` en `DESARROLLO/…` con doble clic.

---

## 8. Archivos tocados en esta sesión

```
Web/src/tools/InformeSubsueloView.tsx        (nuevo)
Web/src/tools/RutaAccesibleView.tsx          (nuevo)
Web/src/tools/InformesTermicosView.tsx       (nuevo)
Web/src/tools/LibroObrasDigitalView.tsx      (nuevo)
Web/src/tools/CarpetaDigitalView.tsx         (nuevo)
Web/src/core/registry.ts                     (+5 lazy)
Web/src/core/catalog.ts                      (4 soon→active + 1 entrada nueva carpeta-digital; tiers)
DESARROLLO/Tintero - Pendientes.md           (plan + decisiones H/I)
```

> Reglas de trabajo vigentes: `Iniciar Aquí.md` §8 (modo silencioso, edición quirúrgica, no romper producción, `import type` obligatorio).
