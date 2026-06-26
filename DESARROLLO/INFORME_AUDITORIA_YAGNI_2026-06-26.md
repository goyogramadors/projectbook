# Auditoría YAGNI — Archiblocks (Frontend + Backend)

**Fecha:** 2026-06-26 · **Alcance:** `Web/src` (17.217 líneas, 96 archivos TS/TSX) + `Web/functions/src` (252 líneas)
**Naturaleza:** solo diagnóstico. **No se ha borrado ni reescrito nada.** Cada punto espera tu confirmación.

> Reglas aplicadas: cero código especulativo, prioridad a lo nativo, e **intocables** (manejo de errores, validación, saneamiento, seguridad). Lo que cae en zona intocable está marcado y **excluido** de toda propuesta de borrado.

---

## Resumen ejecutivo (por dónde empezar)

| # | Hallazgo | Impacto | Riesgo de tocar | Esfuerzo |
|---|---|---|---|---|
| **P0-1** | `@turf/turf` declarado pero **nunca importado**; 4 submódulos `@turf/*` usados pero **no declarados** | Alto (bundle + build frágil) | Bajo | 10 min |
| **P0-2** | 3 archivos huérfanos versionados + cadena `geoUtils` muerta | Medio-alto (ruido, confusión) | Bajo | 15 min |
| **P1-3** | 11 tipos exportados sin uso en `types.ts` | Medio (ruido del contrato canónico) | Bajo | 10 min |
| **P1-4** | 2 funciones exportadas sin uso en `data-chile.ts` | Bajo-medio | Bajo | 5 min |
| **P1-5** | Deriva documentación ↔ código en el "Cerebro Normativo" | Medio (decisiones erróneas futuras) | Nulo (solo docs) | 20 min |
| **P2-6** | `.fuse_hidden*` en working dir (no versionados) | Bajo (housekeeping) | Bajo | 5 min |
| **P2-7** | Dos sistemas de íconos coexistiendo | Bajo (inconsistencia) | Medio | — |
| **P2-8** | 5 `console.*` en código de producción | Bajo | Bajo | 5 min |

---

## P0 — Crítico / máximo impacto, mínimo riesgo

### P0-1 · Dependencia fantasma `@turf/turf` + submódulos no declarados
**El más importante.** En `package.json` figura el meta-paquete pesado `@turf/turf`, pero **ningún archivo lo importa**. El código real (correctamente, para tree-shaking) usa solo submódulos granulares:

```
@turf/area
@turf/boolean-point-in-polygon
@turf/helpers
@turf/point-to-polygon-distance
```

Problema doble:
1. `@turf/turf` (decenas de funciones, cientos de KB) está instalado **sin aportar valor** — es exactamente el "por si acaso" que YAGNI condena.
2. Los 4 submódulos que **sí** se usan **no están en `dependencies`**: resuelven solo de forma **transitiva** vía `@turf/turf`. Si mañana quitas el meta-paquete sin declararlos, **el build se rompe**.

**Acción propuesta (no ejecutada):** quitar `@turf/turf` y añadir explícitamente los 4 submódulos como dependencias directas. Resultado: dependencias honestas + bundle menor, sin tocar una línea de lógica.
*Archivos que importan turf: `src/workers/geo.worker.ts`, `src/core/useCerebroNormativo.ts`.*

### P0-2 · Archivos muertos versionados en Git
Confirmado por barrido de referencias en todo `src` (cero importadores) y `git ls-files` (están versionados, no son basura de mount):

- `src/components/ModuleHeader.tsx` — huérfano, ninguna referencia.
- `src/tools/CalculadoraArquitectonica.tsx` — **no** está en `registry.ts` ni `catalog.ts`; sin referencias. (Ojo: distinto de `CalculadoraArquitectonica**Cargo**`/otras calculadoras activas.)
- `src/tools/MapaTerrenoView.tsx` — huérfano, ninguna referencia.
- **Cadena `geoUtils` muerta:**
  - `src/core/geoUtils.ts` exporta `generarLlaveMaestra(...)` que **no se usa en ningún lado** (el único "uso" es un comentario).
  - `src/utils/geoUtils.ts` es un puente (`export * from '../core/geoUtils'`) que tampoco importa nadie.
  - La llave normativa real hoy la construye `NormativaService.comunaSlug` (`${region}_${comunaSlug(comuna)}`), no `generarLlaveMaestra`.

**Acción propuesta:** eliminar los 3 componentes huérfanos y la cadena `geoUtils` completa (ambos archivos). ~4 archivos, cero impacto funcional.

---

## P1 — Limpieza media

### P1-3 · Tipos exportados sin uso en `core/types.ts`
`types.ts` es el "contrato canónico", por eso conviene mantenerlo limpio. Sin referencias fuera del propio archivo:

```
Coordenada · SuperficieModel · Tier · RutaEstado3 · TermicoCapa
TermicoSobrecimiento · LibroFormatoId · LibroEstadoFolio
CarpetaEstadoArch · FormFieldType · FormFieldOption
```

**Verificar antes de borrar:** que ninguno se use solo como tipo en JSON/`.json` tipados o en archivos `.d.ts`. Si están limpios, son ruido especulativo.

### P1-4 · Funciones exportadas sin uso en `core/data-chile.ts`
- `getCiudadesPorRegionSorted` → 0 referencias.
- `findProvinciaPorComuna` → 0 referencias.

(El resto —`getRegionesSorted`, `getComunasPorRegionSorted`, `getRegionDeComuna`— sí se usan; `regionesYComunas` es la fuente de datos interna, **no** borrar.)

### P1-5 · Deriva documentación ↔ código (Cerebro Normativo)
No es código muerto, pero **genera código muerto y decisiones equivocadas**. `Iniciar Aquí.md` §1/§3 describe el Cerebro Normativo como Firestore DB `coordenadasnormativas` con llave `generarLlaveMaestra`. El código real (`useCerebroNormativo.ts` + `NormativaService.ts`) carga **archivos locales `/norma-data/*.json`** y arma la llave con `comunaSlug`. Por eso `generarLlaveMaestra` quedó huérfana (P0-2).

**Acción propuesta:** alinear la documentación con la implementación vigente (solo docs, riesgo nulo). Esto cierra la causa raíz de P0-2.

---

## P2 — Housekeeping / bajo impacto

- **P2-6 · `.fuse_hidden*`:** hay ~15 archivos `.fuse_hidden…` en `src/core` y `src/tools`. **No están versionados** (son artefactos del montaje del filesystem cuando se borra un archivo con un handle abierto). No llegan a producción ni a Git, pero conviene confirmar que no queden residuos equivalentes en tu disco Windows real.
- **P2-7 · Dos sistemas de íconos:** 18 archivos usan el wrapper local `components/Icon.tsx` y 41 importan `lucide-react` directo. Funciona, pero es una inconsistencia: conviene decidir uno. No urgente.
- **P2-8 · `console.*` (5 ocurrencias):** revisar si alguno debe quedar fuera de producción (no son `console.error` de manejo de errores legítimo → eso es intocable).

---

## Zona INTOCABLE (revisada y excluida del recorte)

Para que conste que se respetó la regla 3:

- `try/catch` e `isMounted` de `useCerebroNormativo.ts` → **no tocar**.
- Validación `request.auth.uid` y lógica de `functions/src/index.ts` → **no tocar**.
- `firestore.rules` / `firestore.coordenadasnormativas.rules` / `storage.rules` → **no tocar**.
- `DocumentExportWrapper.tsx`: aunque es una abstracción, la usan **22 herramientas**. Es reutilización legítima, **no** over-engineering. **Conservar.**

---

## Lo que NO encontré (para que no lo busques)

- **No** hay utilidades caseras evidentes reemplazables por stdlib (no aparecen `debounce`/`throttle`/`deepClone`/`uuid` hand-rolled). Los submódulos de Turf ya son la opción granular correcta.
- Los archivos más grandes (`GeneradorContratosView.tsx` 885 líneas, `LibroObrasDigitalView.tsx` 711) son grandes por **volumen de contenido/plantillas**, no por sobre-ingeniería detectable automáticamente (6 hooks, sin abstracciones especulativas). Si quieres, los reviso uno a uno en una pasada manual aparte.

---

## Orden sugerido de ejecución

1. **P0-1** (deps Turf) — desbloquea y es el de mayor ratio impacto/esfuerzo.
2. **P0-2** (archivos muertos) — limpieza visible inmediata.
3. **P1-5** (alinear docs) — cierra la causa raíz de futuros huérfanos.
4. **P1-3 / P1-4** (tipos y funciones sin uso).
5. **P2** (housekeeping) cuando haya tiempo.

> Dime con qué punto arranco y procedo **de a uno**, con edición quirúrgica y registrando en `Last Update.md`.
