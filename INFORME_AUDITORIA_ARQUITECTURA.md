# Informe de Auditoría Técnica — Archibots SPA

> **Auditor:** Revisión experta de arquitectura, infraestructura y seguridad.
> **Fecha:** 2026-06-17
> **Alcance:** Lectura exhaustiva del repositorio `E:\2CLAUDE\Archibots` (código `src/`, `functions/`, reglas Firestore, configuración de build/hosting, scripts y documentación), tomando como mapa de entrada `MAPA_ARQUITECTURA_PROYECTO.md`.
> **Naturaleza:** Solo diagnóstico y propuesta. No se modificó ninguna línea de código.

---

## 1. Resumen ejecutivo

Archibots es una SPA bien concebida en su **diseño conceptual**: lazy-loading por herramienta, aislamiento del cálculo geométrico en Web Worker ("Cerebro Espacial"), separación de la capa normativa en una base de datos dedicada ("Cerebro Normativo"), patrón Repository para el master del proyecto y un Error Boundary por herramienta. La intención arquitectónica es sólida y, en varios puntos, elegante.

El problema es la **brecha entre el diseño declarado y la implementación desplegada**. La auditoría detectó un desalineamiento crítico entre la base de datos que la aplicación usa en producción y las reglas de seguridad que el repositorio despliega, un modelo de monetización que hoy es puramente cosmético, dos Cloud Functions rotas en tiempo de ejecución, y la **ausencia total de control de versiones, pruebas y CI**. Adicionalmente, el documento maestro de arquitectura (`MAPA_…`) describe un sistema que ya no coincide con el código, lo que multiplica el riesgo de decidir sobre una base falsa.

**Veredicto:** el producto está en estado de *prototipo avanzado*, no de *producción*. Hay activos valiosos, pero la base de seguridad e infraestructura tiene fisuras que deben cerrarse **antes** de exponer datos reales de usuarios o cobrar.

### Tablero de severidad

| # | Hallazgo | Severidad | Eje |
|---|----------|:---------:|-----|
| H-01 | La app usa una DB Firestore (`ai-studio-…`) distinta a la que protegen las reglas (`(default)`) | 🔴 Crítico | Seguridad / Datos |
| H-02 | Paywall sin enforcement real + 2 Cloud Functions rotas (`apiProxy`, `setUserState`) | 🔴 Crítico | Seguridad / Negocio |
| H-03 | Secrets en el árbol, sin `.gitignore` y **sin repositorio Git** | 🔴 Crítico | Seguridad / Infra |
| H-04 | Ausencia de control de versiones (no hay `.git`) | 🟠 Alto | Infra / Proceso |
| H-05 | Bugs lógicos en `firestore.rules` (Pase, invitaciones, suspensión) | 🟠 Alto | Seguridad |
| H-06 | Cascade-delete incompleto → datos huérfanos | 🟠 Alto | Datos / Costo |
| H-07 | Sin separación de entornos dev/staging/prod | 🟠 Alto | Infra |
| H-08 | Cero pruebas + tooling de calidad ausente; `strict:false` | 🟠 Alto | Calidad |
| H-09 | Persistencia de datos de herramienta sin gobernar (duplicación) | 🟡 Medio | Arquitectura |
| H-10 | Código muerto y artefactos pesados en el árbol | 🟡 Medio | Mantenibilidad |
| H-11 | `firebase-admin` en dependencias del frontend | 🟡 Medio | Seguridad / Build |
| H-12 | Tailwind v4 medio-cableado (vestigial) | 🟡 Medio | Build |
| H-13 | `MAPA_ARQUITECTURA` desactualizado (drift documental) | 🟡 Medio | Gobernanza |
| H-14 | Observabilidad nula; correo saliente fallará DMARC; sin App Check | 🟡 Medio | Operación |
| H-15 | Hardcodes, SEO/landing, accesibilidad, feedback anónimo | 🟢 Bajo | Pulido |

---

## 2. Hallazgos críticos (🔴)

### H-01 — La aplicación lee/escribe en una base de datos que las reglas NO protegen

**Evidencia.**
- `src/core/firebase.ts:25` → `export const db = getFirestore(app, "ai-studio-04c1b031-6802-4224-849a-7662aaa73d72");`
- `firebase.json` → el array `firestore[]` solo declara dos *targets*: `firestore.rules` (base `(default)`, sin clave `database`) y `firestore.coordenadasnormativas.rules` (base `coordenadasnormativas`).
- `firestore.indexes.json` → índices compuestos definidos para `(default)`.

**Diagnóstico.** El código de negocio (proyectos, usuarios, invitaciones, feedback, entitlements) opera contra la base **nombrada** `ai-studio-04c1b031-…` —un artefacto autogenerado por Firebase Studio/IDX—, mientras que el conjunto de reglas *zero-trust* cuidadosamente escrito (`firestore.rules`) se despliega sobre la base `(default)`, que la aplicación **nunca toca**. Resultado:

1. Las reglas de seguridad reales que rigen los datos de producción **no están en este repositorio ni se despliegan desde él**. Son las que quedaron al crear la base en Studio (típicamente *test-mode* abierto o *locked*). Si es *test-mode*: exposición total de datos de usuarios. Si es *locked*: la app no debería funcionar, lo que sugiere que está abierta.
2. Los índices compuestos tampoco aplican a la base en uso → ciertas consultas pueden degradarse o fallar silenciosamente al crecer el dataset.
3. `MAPA_…` (§1 y §3) afirma que la DB principal es `(default)`. **El mapa contradice al código.**

**Impacto.** Es la falla más grave del sistema: el esfuerzo de seguridad invertido en `firestore.rules` es, en la práctica, *letra muerta* sobre datos productivos.

**Recomendación.** Decidir una de dos rutas y ejecutarla de inmediato:
- **(A) Migrar la app a `(default)`** (preferido): cambiar `firebase.ts` para usar la base default, exportar/importar los datos de `ai-studio-…` a `(default)`, y verificar que `firestore.rules` e índices queden activos. Una sola fuente de verdad para reglas.
- **(B) Versionar la base nombrada**: agregar `ai-studio-…` como tercer *target* en `firebase.json` con su propio ruleset e índices. Funciona, pero perpetúa un nombre opaco de Studio como base productiva — deuda de claridad.

> **Contraposición.** (A) implica una migración de datos puntual con ventana de mantenimiento, pero deja el sistema limpio y alineado con la documentación. (B) evita migrar pero consolida un nombre técnico-accidental como infraestructura crítica; cada nuevo desarrollador tropezará con él. **Recomiendo (A).**

---

### H-02 — El paywall no tiene enforcement de servidor y dos Cloud Functions están rotas

**Evidencia.**
- `functions/src/index.ts` (`apiProxy` y `setUserState`) → `const tokenResult = await auth.verifyIdToken(request.auth.token as unknown as string);`
- `src/views/PricingView.tsx` → el checkout es un *stub*: `onClick={() => triggerToast('Checkout Stripe se conecta en el Sprint F5 (demo)')}`.
- `firestore.rules` referencia `customers/{userId}` ("Stripe extension") y `entitlements/` con `write:false` "solo Cloud Functions", pero **no existe** ninguna extensión Stripe en `firebase.json` ni webhook en `functions/`.
- `src/core/useAccess.ts` → el gating premium se decide 100% en cliente (`plan !== 'Premium'`).

**Diagnóstico.**
1. **Bug de runtime.** En Cloud Functions v2 `onCall`, `request.auth.token` **ya es un `DecodedIdToken`** (objeto), no un JWT string. Pasarlo a `verifyIdToken(... as unknown as string)` lo coacciona a `"[object Object]"` → la función lanza siempre. Por tanto:
   - `apiProxy` (proxy a Gemini, **núcleo de la feature Premium "Asistente BIM"**) está caído.
   - `setUserState` (suspensión de usuarios por el admin, §13) está caído.
   - Nótese la incoherencia: `sendPremiumInviteEmail` *sí* lee bien el claim (`request.auth.token.admin !== true`). El patrón correcto ya existe en el mismo archivo; las otras dos funciones no lo siguen.
2. **Monetización inexistente.** No hay cobro real ni emisión de `entitlements`/`customers`. El único *lever* efectivo de Premium es `compPremium`, que un admin activa a mano. El gating es cosmético: hoy depende de la confianza en el cliente.

**Impacto.** Doble: una feature Premium estrella no funciona, y el modelo de negocio (suscripción/Pase) no es ejecutable ni defendible.

**Recomendación.**
- Corregir las dos funciones para **leer el claim ya decodificado** (`request.auth.token.admin`, `request.auth.token.plan`) en lugar de re-verificar el token.
- Cerrar el lazo de monetización: instalar la extensión *Stripe Firestore* (o webhook propio) que escriba `customers/`/`entitlements/`, y conectar el checkout real en `PricingView`.
- Mantener el principio: **el plan efectivo debe resolverse por custom claim emitido por backend**, nunca por un campo que el cliente pueda influir.

---

### H-03 — Secrets en el árbol, sin `.gitignore`, sin repositorio

**Evidencia.**
- `.env.local` versionado en la raíz con `VITE_FIREBASE_API_KEY` y `VITE_GOOGLE_MAPS_API_KEY` reales.
- No existe `.gitignore` en la raíz; no existe `.git` (ver H-04).
- `node_modules` (362 MB), `Mockup/` (321 MB), `dist/`, `functions/lib/` y `.env.local` conviven en el árbol.

**Diagnóstico y matices.**
- Las API keys *web* de Firebase no son secretas por diseño (viajan en el bundle). **Pero la clave de Google Maps sí es sensible**: sin restricción por *HTTP referrer* y por API habilitada, es abusable y se traduce en facturación a terceros. Verificar restricciones en Google Cloud Console como acción inmediata.
- El riesgo real se materializa **en el instante en que se adopte Git** (ver H-04): sin `.gitignore`, el primer `git add .` commitearía `.env.local`, 683 MB de dependencias/mockup y artefactos de build. Una clave en el historial de Git es, a efectos prácticos, comprometida para siempre.

**Recomendación.**
1. Restringir la Google Maps key (referrer + API) **hoy**.
2. Crear un `.gitignore` robusto (`node_modules`, `dist`, `.firebase`, `functions/lib`, `*.local`, `.env*`, `tsconfig.tsbuildinfo`, `Mockup/`) **antes** de inicializar Git.
3. Rotar la Maps key tras endurecer el flujo, por higiene.
4. Mantener `.env.local.example` (sin valores) como contrato de variables.

---

## 3. Hallazgos altos (🟠)

### H-04 — Ausencia de control de versiones

No hay directorio `.git`. Un SaaS en evolución sin Git carece de historial, *rollback*, *blame*, ramas de feature, *code review* y de cualquier *gate* de CI. Es el riesgo operacional #1 a nivel proceso: un error de edición sobre `firestore.rules` o `firebase.ts` no tiene vuelta atrás. **Acción:** `git init` + `.gitignore` (H-03) + repositorio remoto privado + ramas `main`/`dev`, en esta sesión de trabajo. Todo lo demás (CI, tests, PRs) se apoya sobre esto.

### H-05 — Bugs lógicos en `firestore.rules`

Tres defectos concretos, todos verificables en `firestore.rules`:

1. **Pase por proyecto roto.** `function hasPase(projectId)` evalúa `uid() in get(.../entitlements/$(uid())).data.projects`. Compara el **uid del usuario** contra su lista de proyectos, ignorando el parámetro `projectId`. Debe ser `projectId in (...).data.projects`. Tal como está, el "Pase" (producto de pago único, CONST §11) nunca autoriza correctamente.
2. **Fuga de invitaciones.** `match /invitations/{token} { allow read: if isAuth(); }` permite que **cualquier** usuario autenticado lea **todos** los tokens y correos de invitación de la plataforma (enumeración). Debe acotarse a `resource.data.invitedEmail == request.auth.token.email || resource.data.invitedBy == uid()`.
3. **Suspensión que no suspende (a nivel de reglas).** `isActive()` compara `estado != 'suspendido'` (minúscula), pero el sistema escribe `'Suspendido'` (mayúscula) — ver `functions/src/index.ts` (`estado: disabled ? 'Suspendido' : 'Activo'`) y `types.ts` (`'Activo' | 'Suspendido'`). La comparación nunca coincide → la barrera Firestore es defensa muerta. Hoy salva el `auth.updateUser({disabled:true})`, pero la defensa en profundidad está rota por un *casing*.

**Impacto.** Un producto de pago no autoriza; datos de invitados se filtran; una garantía de seguridad declarada no opera. **Acción:** corregir las tres y validar en el Simulador de Reglas con casos de prueba.

### H-06 — Cascade-delete incompleto

`onProjectDeleted` (`functions/src/index.ts`) borra subcolecciones `['formularios','simulaciones','bitacora','documentos']`, pero `firestore.rules` declara además `participantes`, `seguimiento`, `dim-publicos` y `volumen`. Al eliminar un proyecto, esas cuatro subcolecciones quedan **huérfanas** (datos residuales + costo de almacenamiento + posible fuga si se reusan IDs). Además borra `documentos`, que no figura en reglas. **Acción:** unificar la lista de subcolecciones en una sola constante compartida (fuente de verdad única) consumida por reglas, cascade y el script de migración.

### H-07 — Sin separación de entornos

`.firebaserc` define un único proyecto: `archibots-497423`. No hay alias `dev`/`staging`/`prod`. El propio `scripts/migrate-projects.mjs` invoca `--env dev|prod` apuntando a `archibots-dev`/`archibots-prod` **inexistentes** → el script fallaría. Se está desarrollando, probando y (eventualmente) cobrando sobre la **misma** base productiva. **Acción:** crear al menos un proyecto `dev`, aliasar en `.firebaserc`, y prohibir `firebase deploy` a prod fuera de CI.

### H-08 — Cero pruebas y tooling de calidad ausente

- **Sin tests** de ningún tipo (no hay `*.test.*`, ni Vitest/Jest/Playwright). Lógica con riesgo real sin red de seguridad: gating (`useAccess`), estrategia Cloud/Local (`ProjectRepository`), worker geométrico, reglas Firestore.
- **ESLint no está instalado** en el proyecto principal — pero el código está **lleno de directivas `eslint-disable`** (en `ThemeProvider`, 6+ tools, etc.) que hoy son **inertes**. Es un síntoma claro de configuración heredada del `Mockup/` y abandonada.
- Sin Prettier; sin CI (`.github/workflows` ausente).
- `tsconfig.json` → `"strict": false`, pese a que `MAPA_…` (§1) declara *"TypeScript estricto"*. 18 usos de `any` en `src/`. Sin `strict`, los contratos de `types.ts` ("única fuente de verdad") no se garantizan en compilación.

**Acción priorizada:** (1) activar `strict` y resolver el fallout; (2) configurar ESLint + Prettier reales; (3) `vitest` para `useAccess`, `ProjectRepository` y `geo.worker`; (4) `@firebase/rules-unit-testing` para las reglas (cubre H-01/H-05); (5) un workflow de CI que corra `tsc -b`, lint y tests en cada PR.

---

## 4. Hallazgos medios (🟡)

### H-09 — La persistencia de datos de herramienta no está gobernada

El patrón Repository es limpio para el **master** (`ProjectRepository`), pero **se detiene ahí**. Cada herramienta reimplementa su propio `load/save`: hay ~12 tools con bloques casi idénticos de `localStorage.getItem(STORAGE_KEY(project.id))` + `JSON.parse` + `try/catch` + efecto de guardado + `// eslint-disable-line react-hooks/exhaustive-deps` (ver `DimensionadorView`, `CuadroSuperficiesView`, `EmisorEstadoPagoView`, `CalculadoraCargaOcupacionView`, etc.). Además, la decisión Cloud vs Local se toma de forma **inconsistente** tool por tool (algunas miran `user.plan`, otras intentan nube y caen a `localStorage`).

Peor aún, hay **acoplamiento cruzado**: `DocumentExportWrapper.tsx:73` lee directamente `localStorage.getItem('ab-participantes-${pid}')` —la clave privada de *otra* herramienta— en vez de pasar por una API común. Si `ParticipantesView` cambia su esquema de almacenamiento, el membrete de todos los documentos imprimibles se rompe en silencio.

**Recomendación.** Extraer un hook `useToolData<T>(toolId, projectId)` (o un `ToolDataRepository` análogo al de master) que encapsule: clave canónica, estrategia Cloud/Local según plan, *serialization*, y *merge*. Elimina ~300-400 líneas duplicadas, unifica la semántica de persistencia y rompe el acoplamiento del wrapper de exportación.

> **Contraposición.** Se podría argumentar "cada tool es un *chunk* lazy independiente, la duplicación es el precio del desacoplamiento". Es válido para la *UI*, no para la *persistencia*: el contrato de almacenamiento es transversal y hoy su duplicación ya produjo un bug latente de acoplamiento (el wrapper). La abstracción aquí reduce riesgo, no solo líneas.

### H-10 — Código muerto y artefactos en el árbol

Confirmado por análisis de imports:
- **4 componentes de shell sin un solo import**: `ModuleHeader`, `StatusBar`, `CorporateFooter`, `TopToolsBar` (reemplazados por `ShellTop`/`ShellDock`, que el `MAPA_…` ni menciona).
- **Cluster legacy T-07**: `tools/CalculadoraArquitectonica.tsx` (266 líneas) no está en `registry.ts` → inalcanzable; arrastra `core/useCerebroNormativo.ts` (hook legacy) y el puente `utils/geoUtils.ts`, que existe *solo* para ese hook.
- **Artefactos**: `src/core/.fuse_hidden0000001000000001` (residuo de borrado en FUSE), `functions/lib/` (build commiteado y *stale*: `index.js` de Jun-15 vs fuente de Jun-16).
- **Ficheros sueltos en raíz**: `Modulo BIM.tsx.txt` (111 KB), `workspace_proyecto.tsx` (35 KB), `archibots-master.css` (16 KB, distinto de `src/archibots.css`), `geo-data_13_PRC_Nunoa.json` (1.2 MB, fuera de `public/`), `Base de datos Normativas PRC.png` (260 KB).
- **`Mockup/` (321 MB)**: un segundo proyecto Vite+Firebase completo (con su propio `firebase.json`, reglas, functions) anidado. Es la principal fuente de confusión: duplica nombres de archivos (`GeolocalizadorView`, `ProjectRepository`, etc.) y puede contaminar búsquedas, *grep* y razonamiento.

**Recomendación.** Purgar agresivamente. Mover `Mockup/` y los `.txt/.png/.json` de referencia fuera del árbol productivo (a un repo o carpeta `/_archive` no versionada). Eliminar el código muerto. Cada archivo que sobra es una mina de confusión para quien (humano o IA) navegue el proyecto — y el propio `MAPA_…` ya tropezó con esto.

### H-11 — `firebase-admin` en el frontend

`package.json` (raíz) lista `firebase-admin: ^14.0.0` en `dependencies`. **El Admin SDK es de servidor**: concede privilegios irrestrictos y no debe poder bundlearse en cliente jamás. Aunque hoy ningún `import` de `src/` lo use, su mera presencia invita al accidente. Súmese la incoherencia de versión: `functions/package.json` declara `firebase-admin: ^12.0.0`. **Acción:** eliminar `firebase-admin` de la raíz; debe vivir únicamente en `functions/`.

### H-12 — Tailwind v4 medio-cableado

`@tailwindcss/vite` está en `devDependencies` pero **no** se registra en `vite.config.ts` (que solo carga `react()`). El CSS hace `@import "tailwindcss";` (`src/archibots.css:1`), de modo que entra el *preflight*, pero el *plugin* que escanea contenido y genera utilidades on-demand no está activo. En paralelo, el estilado real del proyecto es casi todo `.ab-*` propio + estilos inline + tokens shadcn en CSS. Tailwind queda **vestigial**: pesa, confunde y aporta poco. **Acción:** decidir — o adoptarlo de verdad (registrar el plugin, migrar estilos) o **removerlo** (deps + `@import`). La ambigüedad actual es la peor opción.

### H-13 — El `MAPA_ARQUITECTURA` miente respecto al código (drift)

El documento que se usa como "mapa de referencia para futuras sesiones" está desactualizado en puntos sustantivos: describe el shell viejo (Bloques 1/2/5/6 = `ModuleHeader`/`StatusBar`/`TopToolsBar`/`CorporateFooter`, hoy muertos); referencia `LayoutTestView.tsx`/`HomeTestView.tsx` que **no existen**; afirma DB `(default)` (real: `ai-studio-…`), "Tailwind sin compiler" y "TypeScript estricto" (real: `strict:false`). Un mapa equivocado es peor que no tener mapa: induce decisiones sobre supuestos falsos. **Acción:** regenerar el `MAPA_…` desde el código real y, a futuro, tratarlo como artefacto verificable (idealmente derivado/chequeado en CI), no como prosa que se edita a mano.

### H-14 — Observabilidad y operación

- **Sin monitoreo de errores** (Sentry/Crashlytics). `ToolErrorBoundary` aísla la caída de una tool, pero nadie se entera de que ocurrió.
- **Correo saliente fallará DMARC.** Las dos funciones SendGrid envían `from: 'goyogramador@gmail.com'`. Enviar "desde" un `gmail.com` por SendGrid viola SPF/DKIM/DMARC de Gmail → los correos de invitación caerán en spam o serán rechazados. **Acción:** usar un dominio propio autenticado en SendGrid.
- **Sin App Check ni rate-limiting** en `apiProxy`. Una vez reparado (H-02), seguiría siendo abusable por cualquier usuario autenticado para quemar cuota/costo de Gemini. **Acción:** Firebase App Check + límite por usuario.

---

## 5. Hallazgos bajos y pulido (🟢)

- **`feedback` `allow create: if true`** — cualquiera (incluso anónimo) crea documentos sin validación → vector de spam. Acotar tamaño/esquema y considerar App Check.
- **`MAX_PREMIUM_PROJECTS = 50` solo en cliente.** El propio comentario en reglas lo admite ("el conteo lo hace getCountFromServer en el cliente"). Es un límite *sugerido*, no impuesto. Si importa, validarlo en una Cloud Function de creación.
- **Hardcodes dispersos:** `ADMIN_FALLBACK_EMAIL`, *sender* de correo, región, `gemini-2.0-flash`, y `REGION_DEFECTO = '13'` en `GeoJsonService` (la capa geo está atada a la Región Metropolitana por defecto; escalar a otras regiones exige *plumbing* del parámetro `region`). Centralizar en config.
- **Landing/SEO:** `index.html` sin `meta description`, sin Open Graph, sin favicon. SPA *client-side* sin *prerender* → SEO limitado para captar tráfico al producto.
- **Hosting cache:** los headers solo cachean `/geo-data/**`. Los *assets* hasheados de Vite (`/assets/*`) también admiten `immutable, max-age=1y`.
- **Accesibilidad:** estilado muy *inline*, sin `aria`/roles visibles; conviene auditar contraste de los 4 temas (especialmente `matrix`/`cad`) contra WCAG AA.

---

## 6. Lo que está bien (para preservar)

Una auditoría exigente también delimita los activos a no romper:

- **Lazy-loading por herramienta** (`registry.ts` + `ToolHost` + `Suspense`): *code-splitting* real, *bundle* inicial mínimo. Patrón correcto y bien ejecutado.
- **Web Worker para Turf** (`geo.worker.ts`): el cálculo pesado fuera del hilo principal, con *imports* por sub-paquete (`@turf/area`, `@turf/boolean-point-in-polygon`) → *tree-shaking* genuino. Ejemplar.
- **Separación "Dos Cerebros"**: la base normativa `coordenadasnormativas` *sí* está correctamente nombrada, versionada y con reglas read-only (`firestore.coordenadasnormativas.rules`). Es el contraejemplo de H-01: así debería estar también la base principal.
- **Estrategia Cloud/Local** (`ProjectRepository`) y **`ToolErrorBoundary`**: buenas decisiones de resiliencia y de modelo Free/Premium.
- **Higiene de logs:** un solo `console.*` en todo `src/`. Disciplina notable.
- **Intención zero-trust** de `firestore.rules`: el diseño es bueno; el problema es *dónde* se aplica (H-01) y tres bugs puntuales (H-05), no la filosofía.

---

## 7. Hoja de ruta priorizada

> Orientada a cerrar riesgo de seguridad/datos primero, luego proceso, luego deuda.

**Sprint 0 — Contención (días, no semanas)**
1. Restringir la Google Maps API key en GCP (H-03).
2. `git init` + `.gitignore` + remoto privado (H-04, H-03).
3. Resolver H-01: alinear la app a `(default)` (o versionar la base nombrada) y verificar que reglas e índices apliquen a la base en uso.
4. Reparar `verifyIdToken` en `apiProxy` y `setUserState` (H-02).
5. Corregir los tres bugs de `firestore.rules` (H-05) y validar en Simulador.

**Sprint 1 — Cimientos de calidad**
6. Activar `tsconfig strict` y sanear `any` (H-08).
7. ESLint + Prettier reales; eliminar `eslint-disable` inertes o respaldarlos con regla activa (H-08).
8. CI mínima: `tsc -b` + lint + build en cada PR (H-04/H-08).
9. Tests de reglas (`@firebase/rules-unit-testing`) cubriendo H-01/H-05; unit de `useAccess` y `ProjectRepository`.
10. Entorno `dev` separado + alias en `.firebaserc` (H-07).

**Sprint 2 — Deuda y consistencia**
11. Unificar cascade-delete y lista de subcolecciones en una constante compartida (H-06).
12. Extraer `useToolData`/repositorio de subcolección; romper el acoplamiento de `DocumentExportWrapper` (H-09).
13. Purga de código muerto y artefactos; sacar `Mockup/` del árbol (H-10).
14. Quitar `firebase-admin` del frontend (H-11); decidir el destino de Tailwind (H-12).
15. Regenerar `MAPA_ARQUITECTURA` desde el código (H-13).

**Sprint 3 — Producción real**
16. Cerrar monetización (Stripe + entitlements) con enforcement de servidor (H-02).
17. App Check + rate-limiting + dominio de correo autenticado + Sentry (H-14).
18. SEO/landing, cache de assets, accesibilidad (H-15).

---

## 8. Nota metodológica

Todos los hallazgos se sustentan en lectura directa del código y la configuración (rutas y líneas citadas). No se ejecutó la aplicación ni se inspeccionó la consola de Firebase; por tanto, **dos puntos requieren verificación operativa** que el equipo puede hacer en minutos:

- **H-01:** confirmar en la consola de Firebase qué reglas tiene hoy la base `ai-studio-04c1b031-…` (test-mode vs locked). El diagnóstico de riesgo se sostiene en cualquiera de los dos casos, pero define la urgencia exacta.
- **H-12:** confirmar, con el *build* de producción, si alguna utilidad Tailwind on-demand se está generando o solo el *preflight*. No altera la recomendación (decidir adoptar o remover).

El resto de los hallazgos es determinista a partir del fuente.
