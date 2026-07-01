# Auditoría Técnica Integral — Archibots / BASEPRO (SaaS BIM Use Advisor)

**Fecha:** 2026-07-01 · **Alcance:** `Web/` (SPA productiva) + `Web/functions/` (Cloud Functions) + reglas Firestore/Storage.
**Contexto asumido (confirmado):** sign-up abierto · colaboración firma-multiusuario por proyecto · repo fiel a producción.
**Método:** recorrido íntegro (no muestreo). Cada hallazgo cita `archivo:línea` verificable. No se corrigió código.

---

## Resumen ejecutivo (léelo en 2 minutos)

1. **Hay UN hoyo crítico y barato de tapar:** cualquier persona que se registre puede auto-otorgarse **Premium** creando su propio documento de usuario con `compPremium:true` — la regla `create` de `users` no filtra campos (`firestore.rules:81`) y `isPremium()` confía en ese campo (`firestore.rules:25-30`). Rompe la integridad de cobro. **Corregir antes de escalar.**
2. **El resto de la seguridad de datos está sólido:** el aislamiento entre firmas (owner/members) es correcto; no encontré escalamiento horizontal entre proyectos de firmas distintas. No hay secretos en el bundle del cliente; `Web/` tiene **0 CVEs**.
3. **Vectores de abuso/costo abiertos (Alto/Medio):** App Check **no se exige** en ninguna Cloud Function; `feedback` acepta escritura anónima sin validar; el tope de proyectos por plan se valida **solo en cliente**; `functions/` arrastra **9 CVEs moderados**.
4. **Escalamiento: estructuralmente sano** (patrón repositorio, lecturas one-shot, sin `onSnapshot`). Punto a vigilar: los `get()` dentro de las reglas añaden ~2 lecturas facturadas por operación de subcolección, y el panel admin no pagina.
5. **Deuda: acoplamiento y duplicación de dominio**, no fragilidad de datos. Lógica geométrica y de deslindes copiada en 2-3 vistas; herramientas monolíticas de 700-885 líneas.

**Top 3 a aprobar (detalle al final):** ① cerrar auto-Premium · ② exigir App Check en Functions · ③ validación server-side del tope de proyectos + subir dependencias de `functions/`.

---

## Reglas que más condicionan este análisis
1. **Prioridad Seguridad > Escalamiento > Deuda.** El informe profundiza en ese orden.
2. **Vectores combinados, no fallas aisladas.** El hallazgo crítico nace de combinar *sign-up abierto* + *regla `create` permisiva* + *`isPremium()` que confía en un campo controlado por el usuario*.
3. **Sin evidencia `archivo:línea`, el hallazgo no existe.** Todo lo de abajo es verificable; lo que depende de configuración fuera del repo (consola de Google Cloud) está marcado como **[verificar]**.

---

## CRÍTICO

### C1 · Auto-otorgamiento de plan Premium (escalamiento de privilegios / evasión de cobro)
**Evidencia:**
- `Web/firestore.rules:81` — `allow create: if isAuth() && uid() == userId;` — **no restringe qué campos** puede escribir el usuario al crear su propio documento.
- `Web/firestore.rules:25-30` — `isPremium()` devuelve `true` si `users/{uid}.compPremium == true` **o** `plan == 'Premium'`.
- `Web/firestore.rules:82-86` — la regla `update` **sí** bloquea cambiar `plan`/`estado`/`compPremium`… pero solo en `update`, nunca en `create`.
- Confirmado en dominio: `Web/src/core/AdminService.ts:41-42,87-93` — "el plan efectivo de otros usuarios se deriva de `compPremium`".

**Vector de ataque (combinado):** con sign-up abierto, un atacante crea una cuenta legítima, y usando la config pública de Firebase (`Web/src/core/firebase.ts:8-15`) ejecuta como **primera escritura** `setDoc('users/{suUid}', { compPremium:true, plan:'Premium', estado:'Activo' })`. Al no existir aún el documento, la operación es un `create` y las reglas la aceptan. La app normalmente lo crea como `Free` de forma *fire-and-forget* (`Web/src/core/auth/AuthProvider.tsx:97-105`), pero el atacante controla el orden y gana la carrera.

**Impacto:** desbloquea todas las funciones Premium **gobernadas por reglas Firestore**: Libro de Obras (`firestore.rules:142-145`), Carpeta Digital (`firestore.rules:149-152`) e invitar colaboradores (`firestore.rules:209`). Rompe la monetización del SaaS. *(Nota de alcance: el proxy Gemini NO se desbloquea así — valida el custom claim `plan`, no el documento; ver `functions/index.ts:321-324`.)*

**Remediación:** en la regla `create` de `users`, restringir los campos permitidos igual que en `update` (prohibir `plan`, `compPremium`, `estado` distintos del default, o forzar `plan=='Free' && compPremium==false` al crear). La elevación a Premium debe pasar **solo** por Admin SDK / webhook Stripe (que ya bypasean reglas). **Esfuerzo: Bajo (~1-2 h + prueba en simulador).**

---

## ALTO

### A1 · App Check inicializada pero NO exigida en ninguna Cloud Function
**Evidencia:**
- `Web/src/core/firebase.ts:24-30` — App Check (reCAPTCHA v3) se inicializa en el cliente **solo si** hay site key.
- `Web/functions/src/index.ts:97-98, 160-161, 279-280, 314-315` — las cuatro `onCall` declaran opciones **sin `enforceAppCheck: true`**; los comentarios lo admiten: *"App Check pendiente"*.

**Vector:** los endpoints callable son invocables por cualquier script/bot **autenticado** saltándose la app. El más sensible es `sendInviteEmail` (`functions/index.ts:97`): solo exige `request.auth` y un rate-limit de 30/h por uid → un bot con una cuenta (trivial, sign-up abierto) puede emitir correos a **destinatarios arbitrarios desde tu dominio verificado** `contacto@archibots.cl` (`functions/index.ts:116`) → spam/phishing con tu marca y desgaste de reputación/costo SendGrid. `apiProxy` está más protegido (exige claim Premium + rate-limit 20/min·200/día, `functions/index.ts:321-328`).

**Impacto:** abuso de APIs de terceros (SendGrid/Gemini) a tu costo y riesgo reputacional del dominio. El rate-limit acota por-cuenta pero el sign-up abierto lo multiplica por cuentas.

**Remediación:** añadir `enforceAppCheck: true` a las Functions, configurar `VITE_RECAPTCHA_V3_SITE_KEY` en producción y el debug token en dev. Endurecer `sendInviteEmail` para validar que el invitador tenga acceso al `projectId` que declara. **Esfuerzo: Medio (~1 día, incluye config de reCAPTCHA en consola).**

---

## MEDIO

### M1 · Tope de proyectos por plan validado solo en el cliente
**Evidencia:** `Web/firestore.rules:95-97` — `create` de `projects` solo exige `ownerId == uid()`; el comentario declara que el tope (Free=5·Premium=50) "lo valida el cliente". `Web/src/core/db/ProjectRepository.ts:142-147` — el conteo con `getDocs` corre en el frontend, saltable.
**Impacto:** un usuario autenticado que llame a Firestore directamente crea proyectos ilimitados → inflado de costo/almacenamiento y evasión del límite de plan (combinable con C1).
**Remediación:** mover el tope al servidor. El conteo en reglas es caro; preferible un contador `users/{uid}.projectCount` mantenido por Cloud Function `onDocumentCreated/Deleted`, y validar contra él en la regla. **Esfuerzo: Medio.**

### M2 · `functions/` con 9 CVEs moderados (dependencias desactualizadas)
**Evidencia:** `npm audit` en `Web/functions/` reporta **9 moderate** vía cadena transitiva `firebase-admin`/`firebase-functions` → `gaxios`/`google-gax`/`uuid`/`teeny-request`/`retry-request`. Origen: `Web/functions/package.json:9-11` (`firebase-admin ^12`, `firebase-functions ^5`). *(`Web/` principal: **0 vulnerabilidades**.)*
**Impacto:** superficie conocida en el runtime server-side (aleatoriedad de `uuid`, ReDoS/SSRF en clientes HTTP).
**Remediación:** subir a `firebase-admin ^13` y `firebase-functions ^6`, `npm audit fix`, redeploy. **Esfuerzo: Bajo.**

### M3 · Escritura anónima sin validar en `feedback`
**Evidencia:** `Web/firestore.rules:186-189` — `allow create: if true;` sin validar autenticación, tamaño ni forma del documento.
**Impacto:** cualquier bot (sin cuenta) escribe documentos arbitrarios de hasta ~1 MB, ilimitados → inflado de costo/almacenamiento y basura. Amplificado por la ausencia de App Check (A1).
**Remediación:** exigir `isAuth()` o App Check, y validar `size()`/campos permitidos (`request.resource.data.keys().hasOnly([...])`). **Esfuerzo: Bajo.**

### M4 · Google Maps API key en el bundle — protección depende de la consola **[verificar]**
**Evidencia:** `Web/src/tools/GeolocalizadorView.tsx:25,160` y `Web/src/tools/UbicacionView.tsx:26,186` — `VITE_GOOGLE_MAPS_API_KEY` se embebe en el cliente (normal para Maps JS).
**Impacto:** si la key no está restringida por **referrer HTTP + APIs habilitadas** en Google Cloud Console, es cosechable del bundle y abusable contra tu cuota (costo). No verificable desde el repo.
**Remediación:** confirmar restricciones de referrer (`*.archibots.cl`) y de API en la consola. **Esfuerzo: Bajo (config).**

### M5 · Hosting sin cabeceras de seguridad
**Evidencia:** `Web/firebase.json:6-13` — solo define `Cache-Control`. Ausentes: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
**Impacto:** mayor superficie de XSS/clickjacking en una SPA que renderiza datos de usuario.
**Remediación:** añadir bloque `headers` con CSP y demás en `firebase.json`. **Esfuerzo: Bajo (afinar CSP con Maps/Firebase requiere iteración).**

### M6 · `onProjectDeleted` borra en un solo `batch` (límite 500) → huérfanos a escala
**Evidencia:** `Web/functions/src/index.ts:64,76-79` — un único `db.batch()` acumula el borrado de **todas** las subcolecciones (incluida `toolData/{document=**}`) y las invitaciones; `batch.commit()` falla > 500 operaciones.
**Impacto:** al borrar proyectos grandes, el commit falla y deja documentos/almacenamiento huérfanos (costo silencioso). Empeora con el uso.
**Remediación:** trocear en lotes de 500 o usar `BulkWriter`. **Esfuerzo: Bajo-Medio.**

### M7 · Sobrecosto de lecturas por `get()` dentro de las reglas (escalamiento cuantificado)
**Evidencia:** `Web/firestore.rules:18-22` (`isActive` → `get(users/{uid})`), `:68-75` (`isProjectMember/Editor` → `get(projects/{pid})`), aplicados en cada subcolección `:103-152`.
**Impacto:** **cada** operación sobre una subcolección de proyecto factura ~2 lecturas extra (usuario + proyecto) además del documento leído. Con 500 usuarios usando varias herramientas por sesión, multiplica el costo Firestore de forma no obvia. *(Baseline por sesión medido: login 1-2 lecturas, dashboard 2 queries, abrir herramienta Premium ~3 `getDoc` — sano; el multiplicador son las reglas.)*
**Remediación:** llevar `plan`/`estado` a **custom claims** (elimina `get(users)` en reglas y en `AuthProvider.resolveUser`) y evaluar denormalizar la membresía. **Esfuerzo: Medio.**

---

## BAJO

### B1 · Email de administrador hardcodeado en el bundle
`Web/src/core/auth/AuthProvider.tsx:32,47` — `ADMIN_FALLBACK_EMAIL` concede **UI** admin por correo sin custom claim. Las reglas Firestore **no** honran ese fallback (solo el claim `admin`), así que no hay hueco de escritura, pero expone la identidad admin y crea inconsistencia cliente↔reglas. **Remediación:** eliminar el fallback, usar solo el claim. **Esfuerzo: Bajo.**

### B2 · Base normativa completa legible por cualquier registrado
`Web/firestore.coordenadasnormativas.rules:23-25` — `read: if isAuth()` sobre `{document=**}` expone toda la normativa curada (IP del producto) a cualquier cuenta. Mitigado porque el mismo dato se sirve como JSON estático en `Web/public/norma-data/`. **Remediación:** aceptar como dato de referencia o restringir a Premium si es diferencial. **Esfuerzo: Bajo.**

### B3 · Storage sin validar `contentType`
`Web/storage.rules:35-39` — solo limita 25 MB; no restringe MIME. Un editor puede almacenar archivos arbitrarios (incl. ejecutables) compartidos dentro del proyecto. **Remediación:** validar `request.resource.contentType`. **Esfuerzo: Bajo.**

---

## Deuda técnica priorizada (costo de remediar vs. costo de mantener)

| # | Ítem (evidencia) | Costo remediar | Costo de mantenerla | Acción |
|---|---|---|---|---|
| 1 | **Lógica de deslindes duplicada** en 3 vistas: `GeolocalizadorView.tsx:232` (`buildEdges`), `UbicacionView.tsx:223` (`buildEdges`) y re-modelada como `boolean[]` en `VolumenTeoricoView.tsx:441-455`. `terrenoStore.ts:21` ya define `DeslindeMeta`. | Bajo | Alto (3 copias divergen; el modelo de deslindes es central y crecerá) | Extraer a módulo compartido junto a `terrenoStore`. |
| 2 | **Librería geométrica de dominio embebida en la UI**: `ringToPlanar`/`segIntersect`/`insetPolygon` y constantes mágicas `111320`/`110540` en `VolumenTeoricoView.tsx:84-118`. Cálculo de retiros OGUC no reutilizable. | Medio | Alto (todo nuevo cálculo urbanístico se copiará) | Mover a `src/core/geometry` con constantes documentadas. |
| 3 | **`terrenoStore.loadTerreno` (`terrenoStore.ts:64-81`) y `normativaStore.loadNormativa` (`normativaStore.ts:79-93`)** repiten el patrón nube→local que **ya abstrae** `hooks/useToolData.ts:84-119`. | Bajo | Medio | Migrar ambos stores al hook genérico. |
| 4 | **Herramientas monolíticas** que mezclan UI + dominio + Firestore/Storage: `GeneradorContratosView.tsx` (885), `LibroObrasDigitalView.tsx` (711), `VolumenTeoricoView.tsx` (704). | Alto | Alto (imposible testear unitariamente; cambios frágiles) | Separar por capas (hooks de datos + servicios de dominio + presentacional). |
| 5 | **Valores normativos por defecto hardcodeados en UI**: `fichaEstimada()` en `GeolocalizadorView.tsx:66-82`. | Bajo | Medio (dos fuentes de verdad con la DB `coordenadasnormativas`) | Centralizar en datos/constantes. |
| 6 | **Flujo de colaboración inconsistente**: `ShareService.ts:16,32` consulta `users` por email/uid que las reglas deniegan a no-admin (`firestore.rules:80`) → correos sin resolver y `inviteByEmail` inoperante; el camino real es el token-invite por CF. | Bajo | Medio (código semi-muerto + confusión/bug latente) | Consolidar en un solo flujo (CF) y eliminar el path directo. |
| 7 | **Custom claims para `plan`/`estado`** (liga con M7): hoy `AuthProvider.resolveUser` (`AuthProvider.tsx:44-112`) y las reglas hacen `get(users)`. | Medio | Alto (costo de lecturas + latencia crecen con usuarios) | Emitir claims desde Admin SDK; simplificar reglas y cliente. |
| 8 | **Panel admin sin paginación**: `AdminService.listUsers` (`AdminService.ts:38`) lee toda la colección `users`. | Medio | Medio-Alto (lineal en usuarios) | Paginar/consultar por página o índice. |
| 9 | **`onProjectDeleted` un solo batch** (`functions/index.ts:64`) — también en M6. | Bajo | Medio | `BulkWriter`/troceo. |
| 10 | **Escritura cliente a `premiumInvitations` que las reglas deniegan**: `AuthProvider.tsx:89-93` (`updateDoc`) falla siempre en silencio; el CF `activateMyAccount` (`functions/index.ts:279-301`) ya lo hace. | Bajo | Bajo | Eliminar el intento cliente. |

---

## Veredicto por frente
- **Seguridad:** un crítico real y barato (C1) + vectores de abuso/costo (App Check, feedback, tope de proyectos). **El aislamiento entre firmas es correcto**: no hay escalamiento horizontal entre proyectos de firmas distintas.
- **Escalamiento:** arquitectura de datos sana (repositorio, sin listeners persistentes). El único costo no-obvio a 500 usuarios es el multiplicador de `get()` en reglas (M7) y la falta de paginación admin.
- **Deuda:** concentrada en acoplamiento UI/dominio y duplicación geométrica/de deslindes; ninguna compromete datos, pero encarecen cada evolución del producto.

## Top 3 remediaciones propuestas (para ejecutar en la sesión siguiente, hallazgo por hallazgo)
1. **C1 — Cerrar el auto-Premium** en la regla `create` de `users`. *Crítico · esfuerzo Bajo · máximo impacto/costo.*
2. **A1 — Exigir App Check** en las 4 Cloud Functions + configurar reCAPTCHA en producción y endurecer `sendInviteEmail`. *Alto · esfuerzo Medio.*
3. **M1 + M2 — Validación server-side del tope de proyectos** (cierra la otra fuga de cobro/costo) **y subir dependencias de `functions/`** (quita los 9 CVEs, trivial). *Medio · esfuerzo Bajo-Medio.*
