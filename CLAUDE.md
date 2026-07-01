# CLAUDE.md — Enrutador de sesión · Archiblocks / Archibots

> Este archivo NO explica el proyecto: **enruta** a la gobernanza documental que ya existe.
> Léelo entero al iniciar. Es liviano a propósito (<150 líneas); el conocimiento estable vive
> en los documentos enlazados. No dupliques su contenido aquí.

## Identidad (3 líneas)
- **Archiblocks** (rotulado *Archiblocks — Gestión Documental*): SPA **en producción** para armar el "expediente digital" de proyectos de arquitectura chilenos, con herramientas (calculadoras, geolocalizador normativo, generadores) sobre un `ProjectMaster`.
- Stack: **React 19 · Vite 6 · TypeScript estricto · Firebase 12 (multi-DB) · @turf/turf**. Modelo **"Dos Cerebros"** (Espacial en Web Worker + Normativo desde `/norma-data/*.json`).
- Tu rol: **agregar valor sin romper la base**. La autoridad del proyecto es **Gregorio**.

## Rutas de oro
- **git** → desde la raíz `C:\G\Archiblocks` (versiona `DESARROLLO/` + `Web/` juntas).
- **npm / firebase** → desde `C:\G\Archiblocks\Web`. Las rutas de código (`src/...`, `functions/...`) son relativas a `Web/`.

## Arranque de sesión (haz esto ANTES de explorar el árbol)
1. Lee **`Iniciar Aquí.md`** (identidad, ubicación, despliegue, reglas §8).
2. Lee el bloque **`⭐ ESTADO AL CIERRE`** al inicio de **`Last Update.md`** — es el estado real vigente y los pendientes abiertos.
3. Antes de tocar reglas/Functions/planes, lee **`AUDITORIA.md`** (hallazgos vigentes con remediación aprobada — no re-diagnostiques).
4. Para ubicar cualquier archivo, usa **`DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md`** — NO explores a ciegas.

## Documentos-fuente (qué leer y cuándo)
| Documento | Cuándo leerlo |
|---|---|
| `Iniciar Aquí.md` | Siempre al arrancar. Memoria maestra + reglas de desarrollo (§8). |
| `Last Update.md` → `ESTADO AL CIERRE` | Siempre al arrancar. Estado vigente y pendientes; el resto es histórico. |
| `AUDITORIA.md` | Antes de tocar `firestore.rules`/`storage.rules`, Cloud Functions o el modelo de planes. |
| `DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md` | Para localizar archivos, roles y flujos (fuente autoritativa de ubicación). |
| `DESARROLLO/MAPA_DE_DATOS_Y_ESTADO.md` | Para entender la arquitectura de datos (3 capas, `ProjectMaster`, riesgos). |
| `DESARROLLO/PROMPT_MAESTRO_HERRAMIENTA.md` | Antes de crear/editar una herramienta — contrato obligatorio (`ToolProps`, hooks, estilos, prohibiciones §12). |

## Reglas inmutables (aplican en toda sesión, sin recordárselas al usuario)
1. **Zero-trust:** NUNCA modifiques `firestore.rules`, `storage.rules`, `firestore.coordenadasnormativas.rules` ni validaciones `request.auth.uid` sin autorización explícita de Gregorio en la sesión.
2. **Secretos:** NUNCA leas, imprimas ni copies `.env.local` ni ningún secreto. Refiérete a las variables solo por nombre (`VITE_*`).
3. **Publicación:** NUNCA corras `git push` ni `firebase deploy`. La publicación la controla Gregorio con los `.bat` de la raíz (ver Cierre de sesión).
4. **Herramienta nueva:** regístrala en `registry.ts` (lazy `import()`) + `catalog.ts` (metadata) con tipos en `types.ts`, según el Prompt Maestro.
5. **TS estricto:** usa `import type { X }` (Vite/oxc; su ausencia deja pantalla en blanco) y valida con `tsc -b` antes de dar por cerrada una edición.
6. **Sin dependencias nuevas:** no introduzcas librerías, UI ni patrones de estado nuevos sin autorización. Usa el stack existente (`framer-motion`, `lucide-react`, `archibots.css`, `types.ts`).
7. **Pregunta antes de borrar:** si un bloque parece estorbar, señala el conflicto en una línea y espera confirmación; no asumas que hay que borrarlo.

## Reglas heredadas REEMPLAZADAS (nacieron de la plataforma anterior)
- ~~"Edición atómica vía `os.replace` en Python"~~ → **obsoleta**: edita con Edit/Write nativos. *Espíritu vigente:* nunca reescribas un archivo completo que funciona; edición quirúrgica. **Red de seguridad:** si un archivo grande aparece truncado tras editar, verifícalo y cae a escribir en scratch + `cp`.
- ~~"Entregar un único bloque de código para copiar" (Prompt Maestro §14)~~ → **obsoleta**: escribe directo en `Web/src/tools/`. El Prompt Maestro sigue siendo el **contrato de arquitectura** (§5 `ToolProps`, §6 hooks, §9 estilos, §12 prohibiciones).
- ~~"Modo silencioso extremo"~~ → **relajada**: explicaciones breves y decisiones justificadas en una línea; sin teoría larga.
- **No edites `Iniciar Aquí.md` ni el Prompt Maestro sin autorización:** propón los cambios y espera confirmación.

## Backlog activo (punteros — el detalle está en los docs, no lo dupliques)
- **`Last Update.md` → `ESTADO AL CIERRE (2026-06-30)`:** pendientes de despliegue (Cloud Functions sin desplegar, frontend sin subir), limpieza y verificación de reglas.
- **`AUDITORIA.md` (2026-07-01) — máxima prioridad:**
  - **C1** · Auto-otorgamiento de Premium vía `create` de `users` (`firestore.rules:81`) — cerrar antes de escalar.
  - **Top 3:** ① cerrar auto-Premium (C1) · ② exigir App Check en las 4 Cloud Functions (A1) · ③ tope de proyectos server-side (M1) + subir dependencias de `functions/` (M2).
  - Tratar como backlog vigente junto al ESTADO AL CIERRE. Toda remediación de reglas/Functions requiere autorización de Gregorio.

## Cierre de sesión (obligatorio)
1. **Bitácora:** agrega una entrada NUEVA arriba en `Last Update.md` (`## YYYY-MM-DD HH:MM (zona) — Título`) con lo hecho, archivos tocados y pendientes generados/resueltos. No borres entradas previas; sincroniza con `Tintero - Pendientes.md`.
2. **No ofrezcas hacer el commit/push.** Indícale a Gregorio **cuál `.bat` de la raíz** accionar según lo tocado:
   - solo código → **`2 - Commit y Push (main).bat`** (dispara build en Cloudflare Pages).
   - solo reglas Firestore → **`1 - Actualizar Reglas Firestore.bat`**.
   - reglas + código → **`3 - Actualizar Reglas + Commit y Push.bat`**.
   - Cloud Functions o `storage`/`indexes` → NO los cubre ningún `.bat`: indica el comando `firebase deploy --only ...` para que lo corra Gregorio.
   - verificar antes de subir → **`4 - Verificar Build Local.bat`**; git trabado por `.lock` → **`5 - Desbloquear Git.bat`**.

## Protocolo de aprendizaje continuo (mantén vivas las dos últimas secciones)
- **Lecciones aprendidas:** al descubrir un comportamiento no documentado (un comando que falla, una peculiaridad de Vite/Firebase/Windows, una decisión de diseño confirmada), agrega **una** línea `- [YYYY-MM-DD] <lección accionable>`. Solo lecciones reutilizables; no bitácora de tareas.
- **Decisiones cerradas:** cuando Gregorio zanje una decisión, regístrala para no reabrirla.
- **Verificación de mapas:** si detectas que `MAPA_ARQUITECTURA_PROYECTO.md` o `MAPA_DE_DATOS_Y_ESTADO.md` quedaron desactualizados vs. el código, repórtalo como pendiente en `Last Update.md`; no los edites sin autorización.
- **Poda:** si este archivo supera ~150 líneas, propón migrar lo estable a `DESARROLLO/` y deja aquí solo el enrutamiento; espera aprobación antes de podar.

## Decisiones cerradas (no reabrir)
- `superficieTerrenoLegal` ≠ `superficieManual` (terreno vs. obra — NO fusionar).

## Lecciones aprendidas
- [2026-06-30] `import type { X }` es obligatorio con Vite/oxc: omitirlo deja la app en pantalla en blanco sin error claro.
- [2026-07-01] Entorno = Claude Code (no la plataforma previa): edita con Edit/Write nativos; `os.replace` ya no aplica, pero verifica ediciones de archivos grandes por si el montaje trunca.
- [2026-07-01] El frontend NO se publica con `firebase deploy --only hosting` (esa URL `*.web.app` está sin uso): el sitio real (`archibots.cl`) se publica vía `git push` → build en Cloudflare Pages (`.bat 2`).
