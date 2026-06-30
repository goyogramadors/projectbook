# 🗒️ LAST UPDATE — Bitácora de sesiones con Claude (Archibots / Project_Book)

> **Propósito:** registro cronológico de TODO lo que se trabaja con Claude, para entregar a
> cualquier instancia nueva como contexto del estado real del proyecto.
> **Regla de uso:** cada sesión agrega una entrada NUEVA arriba (más reciente primero), con
> **fecha + hora**, detalle de lo realizado, archivos tocados y pendientes generados/resueltos.
> No borrar entradas anteriores. Mantener pendientes sincronizados con `Tintero - Pendientes.md`.
>
> **Formato de cada entrada:** `## YYYY-MM-DD HH:MM (zona) — Título corto`

---

## 2026-06-30 17:10 (Chile) — Invitación Premium: PRE-CREA la cuenta al invitar + activación al primer ingreso + "olvidé mi clave"

**Decisión (HITL):** al invitar a un correo NO registrado, antes solo se "reservaba" y la cuenta nacía al registrarse. Ahora la cuenta se **pre-crea** en el momento de invitar; la persona la activa fijando su clave o entrando con Google.

**Cloud Functions (`functions/src/index.ts`):**
- `sendPremiumInviteEmail` reescrita: si el correo ya existe en Auth → lo eleva a Premium Activo (igual que antes). Si NO existe → `auth.createUser({ email, emailVerified:true, password: aleatoria })`, crea `users/{uid}` Premium con **estado 'Pendiente'**, genera `generatePasswordResetLink` y envía por SendGrid un correo cuyo CTA es **"Definir mi contraseña"** + nota de que también puede entrar con Google (queda asociado al mismo usuario gracias a `emailVerified:true`). `premiumInvitations.pendiente = preCreated`.
- **Nueva** `activateMyAccount` (callable, Admin SDK): el usuario, tras autenticarse, activa su propia cuenta (estado Pendiente→Activo) y marca su invitación como aceptada. Necesario porque las reglas NO permiten que un usuario cambie su propio `estado`.

**Frontend:**
- `AuthProvider.resolveUser`: si el doc trae estado 'Pendiente', lo trata como Activo y llama `activateMyAccount` (fire-and-forget). Nuevo método `resetPassword` (sendPasswordResetEmail) en `AuthState`/provider.
- `AuthModal`: enlace **"¿Olvidaste tu clave o entras por invitación? Fíjala aquí"** (modo login) → envía correo para fijar clave; aviso de éxito; mensajes mejorados para `email-already-in-use` y `account-exists-with-different-credential` (guían a Google / fijar clave).
- `AdminService.listUsers`: dedupe — si un invitado ya tiene doc en `users` (cuenta pre-creada), no se duplica como fila "Pendiente".

**Comportamiento resultante:** invitar correo nuevo → aparece de inmediato en el panel como **Premium · Pendiente** (cuenta real ya creada); la persona entra con su clave (enlace del correo) o con Google → queda **Activo**. Correo ya registrado → Premium al instante.

**Sin cambios en `firestore.rules`** (la activación va por Cloud Function con Admin SDK). **Builds:** `tsc -b` web OK + `npm run build` functions OK.

**⚠️ DESPLIEGUE REQUERIDO (manual, NO cubierto por los .bat):**
1. **Functions:** `cd Web/functions && npm run build && firebase deploy --only functions` (publica `sendPremiumInviteEmail` actualizada + `activateMyAccount`). Sin esto, el nuevo flujo NO opera.
2. **Frontend:** `2 - Commit y Push (main).bat`.
- Los invitados que ya enviaste antes (que nunca se registraron) NO tienen cuenta pre-creada; vuelve a invitarlos con el flujo nuevo para que se les cree.
- Limpieza pendiente (manual): borrar `Web/__synctest.txt` (el montaje no permite borrarlo desde la sesión).

---

## 2026-06-30 16:40 (Chile) — Terreno: borrar/reemplazar polígono + traspaso a Geolocalizador · campo N° Casa/Depto · norma-data multi-región (La Reina / Algarrobo)

**1. Polígono del terreno — borrar y reemplazar (no persistía el borrado):**
- Nuevo `terrenoStore.clearTerreno(pid, isCloud)`: borra el terreno de TODAS las capas (localStorage clave compartida + `deleteDoc` del doc nube `toolData/terreno`). Antes "Limpiar" solo borraba el trazo en pantalla → el polígono viejo reaparecía al reabrir y no se podía reemplazar.
- `UbicacionView.limpiar` y `GeolocalizadorView.limpiar` ahora llaman `clearTerreno` y resetean `ringRef`. El traspaso Ubicación↔Geolocalizador ya operaba por la clave compartida (`loadTerreno` al montar); con el fix de array anidado (entrada previa) la nube por fin persiste, así que el polígono se ve en ambas.

**2. Nuevo campo "N° Casa o Depto" (complemento de dirección):**
- `ProjectMaster.depto?: string` (types.ts). UI nueva en Ubicación entre Número y Rol SII; se carga/guarda en `handleSave`. NO ensucia `direccion` (calle+número). Disponible para que los formularios DOM lo lean.

**3. norma-data / geo-data multi-región (La Reina y Algarrobo no cargaban ficha):**
- **Causa La Reina:** archivo subido como `13_la_reina.json`, pero `comunaSlug("La Reina")`="lareina" (sin guion bajo). **Renombrado → `13_lareina.json`.**
- **Causa Algarrobo:** `NormativaService` y `GeoJsonService` tenían la **región fija '13'** → buscaban `13_*` para una comuna de la región 05. Ahora ambos derivan el **código de región desde la comuna** (`getCodigoRegionDeComuna` en data-chile, mapa de 16 códigos en orden de `regionesYComunas`), con fallback '13'. Archivo renombrado a 2 dígitos → `05_algarrobo.json` (consistente con geo-data `05_PRC_Algarrobo.json`).
- **Convención para nuevas comunas (importante):** archivo `public/norma-data/{códigoRegión 2 díg}_{comunaSlug sin espacios ni guiones}.json` (ej. `13_lareina.json`, `05_algarrobo.json`). El GeoJSON de zonas debe existir en `public/geo-data/{cod}_PRC_{Comuna_Title_Case}.json` o la zona no se detecta.

**Archivos:** `core/types.ts`, `core/data-chile.ts`, `core/NormativaService.ts`, `core/GeoJsonService.ts`, `tools/terrenoStore.ts`, `tools/UbicacionView.tsx`, `tools/GeolocalizadorView.tsx`; renombrados `13_la_reina.json`→`13_lareina.json` y `5_algarrobo.json`→`05_algarrobo.json`. **Build:** `tsc -b` OK (EXIT=0).
**Incidencia §8 (grave):** el host Edit truncó en disco varios archivos grandes (terrenoStore, types, Ubicacion, Geolocalizador, servicios). Se recuperó con `git show HEAD` + reemplazos atómicos en Python (`os.replace`). **Lección: para archivos del repo, editar SIEMPRE vía Python/tmp+replace, no edición directa.**
**Limpieza pendiente (manual):** borrar `Web/__synctest.txt` (archivo de prueba; el montaje no permite unlink desde la sesión).
**Pendiente de publicar:** `2 - Commit y Push (main).bat` (solo código + datos; no requiere reglas ni Functions). Si git reclama `index.lock`, correr antes `5 - Desbloquear Git`.

---

## 2026-06-30 16:14 (Chile) — FIX: Ubicación no guardaba (invalid-argument) por array anidado del terreno

**Síntoma:** al presionar "Guardar Sección" en Ubicación con un polígono dibujado, toast `ERROR AL GUARDAR LA UBICACIÓN (INVALID-ARGUMENT)` y NO se guardaban calle/número/comuna/etc. (datos que leen otras herramientas).

**Causa raíz:** `terrenoStore.saveTerreno` escribía el `ring` del polígono (`Array<[number,number]>` = **array de arrays**) directo a Firestore. Firestore **no admite arrays anidados** y `setDoc` valida la data de forma **SÍNCRONA**, lanzando `invalid-argument` *antes* de devolver la promesa → el `.catch()` (fire-and-forget) NO lo atrapa (solo atrapa rechazos), la excepción sube al `try` de `handleSave` y **aborta el guardado completo antes de llegar a `repo.save`**. Por eso no fallaba antes: el terreno vivía solo en localStorage; la migración a nube introdujo este `setDoc`.

**Solución (quirúrgica, solo `terrenoStore.ts`):**
- `encodeRing`/`decodeRing`: el ring se serializa a **array de objetos `{lng,lat}`** al escribir a Firestore y se decodifica al leer (con compat para el formato viejo de array anidado, por si quedó algo).
- `saveTerreno`: el `setDoc` ahora va envuelto en **`try/catch`** además del `.catch()`, para que ninguna validación síncrona futura vuelva a abortar el guardado del llamador.
- `loadTerreno`: lee vía `decodeRing` (tolerante a ambos formatos).

**Archivos:** `Web/src/tools/terrenoStore.ts`. **Build:** `tsc -b` OK (EXIT=0).
**Incidencia §8:** el montaje volvió a truncar la edición directa del archivo (~línea 64); se reescribió atómico con `cp` + `python os.replace` en la carpeta destino. Lección reconfirmada.
**Pendiente de publicar:** push a `main` (frontend) → ejecutar **`2 - Commit y Push (main).bat`**. No requiere reglas ni Functions.

---

## 2026-06-30 (Chile) — Ubicación: guardado robusto + vista satélite + cursor lápiz

**1. Guardado de Ubicación (no persistía / mostraba error):**
- `handleSave` reescrito: el `reload()` se **desacopla** del éxito del guardado (antes, si fallaba el refresco de la lista, mostraba "Error al guardar" pese a haber guardado). Ahora solo el `repo.save` cuenta como guardado.
- Log de diagnóstico con el **código real de Firebase** (`err.code`) + authUid/ownerId/repoKind, y el código se muestra en el toast. Si aparece `(permission-denied)` con cuenta Free → las reglas desplegadas son anteriores al modelo "nube para todos": correr **`1 - Actualizar Reglas Firestore.bat`**.
- `region`/`ciudad` se fuerzan a `''` (nunca undefined) y la **región ahora se hidrata desde el master** (`project.region`), no solo desde localStorage → se ve al reabrir en la nube.
- `direccion` (calle+número) sigue alimentando al Geolocalizador (geocode de `project.direccion`); confirmado el flujo.

**2. Vista satélite temporal:** botón flotante "Vista satélite/mapa" sobre el mapa en **Ubicación y Geolocalizador**: alterna `mapTypeId` roadmap(BW)↔hybrid para trazar con precisión y volver. El mapa de líneas BW sigue siendo el de por defecto.

**3. Cursor de lápiz:** `draggableCursor` con un SVG de lápiz (fallback `crosshair`) en ambos mapas, para indicar que se puede dibujar.

**Archivos:** `UbicacionView.tsx`, `GeolocalizadorView.tsx`. **Build:** `tsc -b` OK.

---

## 2026-06-30 (Chile) — Branding, propietario por defecto y scripts .bat de publicación

- **Título de pestaña**: `index.html` `Project_Book` → **`Archiblocks | Gestión Documental`**.
- **Favicon**: nuevo `Web/public/favicon.svg` ("A" negra + "B" roja) enlazado en `index.html`.
- **Tema inicial**: `ThemeProvider.DEFAULT_THEME` `cad` → **`washi`** (solo usuarios nuevos; respeta elección guardada).
- **Propietario por defecto**: ya NO se siembra con el nombre de la cuenta. `createProject` (ProjectProvider) y `makeDefaultProject` (ProjectRepository) dejan `propietario: ''` para que el usuario ingrese al mandante real.
- **Scripts `.bat` en la raíz** (publicación por doble clic, con limpieza previa de `.lock` de `.git`): `0 - Bajar Cambios (git pull)`, `1 - Actualizar Reglas Firestore`, `2 - Commit y Push (main)`, `3 - Actualizar Reglas + Commit y Push`, `4 - Verificar Build Local`, `5 - Desbloquear Git (borrar locks)`.
- **`Iniciar Aquí.md`**: documentados los `.bat` (§4) y nueva **regla 7 (§8)** + cierre (§9): las instancias NO ofrecen hacer el commit; indican a Andrés cuál `.bat` accionar.
- **Obsoletos** (recomendado borrar): `commit-push.bat` (mensaje hardcodeado viejo) y `guardar.bat` (duplican el `.bat 2`); `actualizar.bat` queda reemplazado por el `.bat 0`.

**Build:** `tsc -b` OK.

---

## 2026-06-30 (Chile) — Participantes: campos email/teléfono tras "Agregar más datos"

- `Participante` (ParticipantesView): agregados `email?` y `fono?` (opcionales). UI: el botón **"Agregar más datos"** (antes "Agregar dirección") despliega Dirección + Correo + Teléfono; **no aparecen por defecto** (se muestran solo si se abren o si ya hay datos). Estado de expansión por participante (no se persiste).
- `FormulariosDOMView`: `bindCtx` y write-back ahora exponen `participant.<rol>.{nombre,rut,direccion,email,fono}`.
- Binds de email/teléfono/dirección por profesional en los PDF: **siguen sin marcar** por ambigüedad de rol en los rótulos; el dato ya está disponible en `bindCtx` para marcarlos cuando se confirme el rol de cada campo.
- Docs: `MAPA_DE_DATOS_Y_ESTADO.md` §5-bis actualizado. **Build:** `tsc -b` OK.

---

## 2026-06-30 (Chile) — Homologación de datos en formularios municipales (DOM)

**Más coincidencias formulario↔herramientas, con prellenado y write-back.**

- `normativaStore`: ampliado para persistir también texto de la ficha PRC (`usosPermitidos`, `usosProhibidos`, `sistemaAgrupamiento`, `antejardin`, `alturaTexto`).
- `FormulariosDOMView`: `bindCtx` ampliado con `participant.<rol>.{nombre,rut,direccion}` (arquitecto, propietario, calculista, constructor, dom, revisor, ito, mecánico, paisajista), `normativa.*` (desde Geolocalizador) y `superficie.*` (desde Cuadro de Superficies). **Write-back bidireccional**: campos con bind `participant.*` se propagan a la herramienta Participantes al guardar (solo valores no vacíos).
- **Fieldmaps**: 104 binds aplicados en 22 `*.fieldmap.json` (pase conservador de alta confianza): ocupación de suelo, superficie primer piso, agrupamiento, constructibilidad, antejardín, altura → ficha normativa; superficie total/subterráneo/primer piso → Cuadro; constructor/ITO → Participantes; ciudad/localidad → Master. JSON revalidado, formato compacto original conservado.
- **Confirmado por Andrés:** `superficieTerrenoLegal` y `superficieManual` NO se fusionan (terreno vs proyecto) — cerrado.
- **Pendiente (ambiguo, no bindeado):** RUT sin rol explícito, direcciones por profesional, email/teléfono (requiere ampliar el tipo `Participante`).
- **Docs:** `MAPA_DE_DATOS_Y_ESTADO.md` §5-bis actualizado a "IMPLEMENTADO".

**Build:** `tsc -b` OK. **Reglas Firestore:** ya desplegadas por Andrés. **Pendiente:** push a `main` (frontend) cuando se decida.

---

## 2026-06-30 (Chile) — Nube para todo usuario logueado + homologaciones + sincronizaciones

**Cambio mayor de modelo de persistencia + homologaciones de datos + sincronizaciones.**

**1. Persistencia "nube para todos los logueados":**
- `ProjectRepository.ts`: `getProjectRepository` ahora devuelve `CloudProjectRepository` para TODO usuario logueado (Free o Premium); `Local` solo para invitados. Topes por plan: `MAX_FREE_PROJECTS=5` · `MAX_PREMIUM_PROJECTS=50` (cap en el constructor Cloud).
- `firestore.rules`: `allow create` de proyectos ya no exige `isPremium` (solo activo + owner). `canEditProject` = dueño o editor (cualquier plan). **Colaboración (invitations) sigue Premium-only**. **Libro/Carpeta de Obra** (premium) requieren `isPremium` en write. ⚠️ **REQUIERE `firebase deploy --only firestore:rules`** o las escrituras Free serán rechazadas.
- `VolumenTeoricoView`: persistencia decidida por `repo.kind==='cloud'` (antes `isPremium`).
- `ProjectProvider`: sandbox automático solo para repo local (invitados).

**2. Homologaciones:**
- `tipoProyecto`: era colisión de nombre — `DatosExtra.tipoProyecto` (que en realidad es *Categoría*) renombrado a `DatosExtra.categoria`. `ProjectMaster.tipoProyecto` (OGUC) queda como fuente única.
- `participantes`: FormulariosDOM lee por `useToolData('participantes')` (canal gobernado), no `localStorage`.
- `comuna`: el Geolocalizador escribe la comuna al Master (dato único).
- ⚠️ `superficieTerrenoLegal` vs `superficieManual`: **NO homologados** — son semánticamente distintos (lote vs obra edificada); fusionarlos rompe §6 y Presupuesto/Propuesta. Pendiente de confirmación (ver MAPA §5 op.7 / §7.4).

**3. Sincronizaciones aplicadas:**
- **Ficha normativa → Cabida** (nuevo `src/tools/normativaStore.ts`): el Geolocalizador persiste la ficha (`toolData/normativa`); Cabida siembra altura/constructibilidad/ocupación.
- **Presupuesto → Master.presupuestoUF**: botón "Usar como presupuesto del proyecto" (opcional; la Ficha sigue editable a mano).
- EETT→Presupuesto/Gantt: ya existía, se mantiene.
- Terreno→Cabida: parcial (Cabida usa largo×ancho, no área única) — pendiente input de área.

**4. Docs actualizados:** `Iniciar Aquí.md` (§5/§6), `MAPA_DE_DATOS_Y_ESTADO.md` (modelo, homologaciones, **nueva §5-bis mapeo de formularios municipales** con oportunidades de sync: RUT/profesionales→Participantes, altura/ocupación→ficha, superficies→Cabida/Cuadro; riesgos §7), `MAPA_ARQUITECTURA_PROYECTO.md` (persistencia).

**Incidente:** ediciones directas sobre el montaje truncaron 7 archivos grandes (riesgo §8 de Iniciar Aquí). Se restauraron con `git show HEAD:` y se re-aplicaron con escritura atómica vía Python (`os.replace`). **Lección: para archivos grandes usar siempre Python/tmp+replace, no edición directa del montaje.**

**Build:** `tsc -b` OK (EXIT=0). **Archivos:** ProjectRepository, ProjectProvider, VolumenTeoricoView, GeolocalizadorView, PresupuestoObraView, DatosProyectoView, FormulariosDOMView, normativaStore (nuevo), firestore.rules + 3 docs. **Pendiente de deploy:** `firebase deploy --only firestore:rules` (crítico) + push a `main` (frontend). 

---

## 2026-06-30 (Chile) — Arqueo de datos: MAPA_DE_DATOS_Y_ESTADO.md

**Contexto:** se solicitó un arqueo completo de la persistencia de proyectos (diccionario de datos + matriz de interdependencias).

**Realizado:** análisis de `types.ts`, `useToolData`, `useDimensionadorSync`, `terrenoStore`, `ProjectRepository/Provider`, `catalog.ts` y las ~28 vistas de `src/tools/`. Se documentó el modelo de 3 capas (Master / ToolData / Subcolección), el esquema `ProjectMaster`, el diccionario por herramienta, la matriz I/O de datos compartidos, datos duplicados, oportunidades de sincronización, hallazgos y riesgos.

**Archivo creado:** `DESARROLLO/MAPA_DE_DATOS_Y_ESTADO.md`.

**Hallazgos críticos:** (1) ficha normativa del Geolocalizador no se persiste → Cabida la re-pide a mano (mayor ROI de sync); (2) `participantes` se guarda con `useToolData` pero FormulariosDOM lo lee por `localStorage` → riesgo de prellenado vacío en Premium; (3) `tipoProyecto` duplicado Master vs `DatosExtra`; (4) `volumen` persiste bespoke fuera de `useToolData` (verificar cobertura en `firestore.rules`). **Pendiente sugerido:** mover estos puntos al Tintero.

**Contexto:** al invitar a Premium a un correo aún no registrado, el usuario quedaba **Free** tras crear su cuenta, pese a la invitación. El mensaje del panel ("pendiente de primer login") sugería que no se aplicaba.

**Causa raíz:** en el registro, `AuthModal.handleSubmit` hacía un `setDoc` **incondicional** de `users/{uid}` con `plan:'Free', compPremium:false`. Ese write (a) pisaba el Premium que `AuthProvider.resolveUser` asigna desde `premiumInvitations`, y/o (b) creaba el doc primero, haciendo que `resolveUser` **omitiera** el chequeo de invitación (solo lo hace cuando el doc NO existe). Resultado: invitado-nuevo → Free.

**Solución (edición quirúrgica):**
- `AuthProvider.tsx` (`resolveUser`): el auto-aprovisionamiento ahora incluye `nombre` y queda como **único escritor** del doc en primer login (Free por defecto; Premium si hay invitación pendiente, marcándola `pendiente:false`).
- `AuthModal.tsx`: eliminado el `setDoc` redundante en registro y sus imports (`doc/setDoc/serverTimestamp/db`). El provisioning lo hace `resolveUser`.
- `AdminDashboard.tsx`: mensaje del panel reescrito → "Premium reservado para X: quedará activo automáticamente al registrarse con este correo." (más fiel al comportamiento real).

**Comportamiento resultante:** admin invita → usuario existente queda Premium al instante; usuario nuevo queda Premium automáticamente al registrarse con ese correo. Quien se registra/loguea sin invitación queda Free hasta que el admin lo cambie.

**Archivos tocados:** `src/core/auth/AuthProvider.tsx`, `src/views/AuthModal.tsx`, `src/views/AdminDashboard.tsx`. `tsc -b` OK. **Pendiente:** desplegar frontend (push a `main` → Cloudflare). No requiere deploy de Functions.

---

## 2026-06-26 23:30 (Chile) — Flujo invitación Premium + usuarios Free en panel admin

**Contexto:** cuando el admin enviaba un correo de invitación Premium, el usuario no aparecía en el panel hasta hacer login. Los usuarios Free tampoco aparecían. Se implementó el flujo completo.

**Cambios implementados:**

- `Web/functions/src/index.ts` — `sendPremiumInviteEmail`: después de enviar el correo, intenta `auth.getUserByEmail(email)`. Si el usuario YA existe en Auth, crea/actualiza `users/{uid}` con Premium directamente. Registra en `premiumInvitations` con campo `pendiente: true/false` (false si ya estaba registrado).

- `Web/src/core/AdminService.ts` — `UserEstado` ahora incluye `'Pendiente'`. `AdminUserRow` tiene `invitado?: boolean`. `listUsers()` también consulta `premiumInvitations where pendiente==true` y los agrega como filas con `estado:'Pendiente'`, mostrándolos ANTES de que el usuario haga su primer login.

- `Web/src/core/auth/AuthProvider.tsx` — `resolveUser()`: en el branch de primer login (`!snap.exists()`), consulta `premiumInvitations` por el email. Si hay invitación pendiente, crea `users/{uid}` con `plan:'Premium'` y marca las invitaciones como `acceptedBy/acceptedAt`.

- `Web/firestore.rules` — nueva sección `premiumInvitations`: admin tiene acceso completo; usuario autenticado puede leer su propia invitación (por email), necesario para la consulta en AuthProvider.

- `Web/src/views/AdminDashboard.tsx` — eliminado `inviteUserPremiumMock` (ya no se necesita). `handleInvite` llama `recargar()` al final para mostrar la fila real. Filas con `estado:'Pendiente'` muestran "Esperando registro" en lugar de los botones de acción.

**Archivos tocados:** `Web/functions/src/index.ts`, `Web/src/core/AdminService.ts`, `Web/src/core/auth/AuthProvider.tsx`, `Web/firestore.rules`, `Web/src/views/AdminDashboard.tsx`.

**⚠️ Deploys requeridos (ejecutar en local):**
1. `cd Web/functions && npm run build && firebase deploy --only functions` — nueva lógica Cloud Function
2. `firebase deploy --only firestore:rules` — nueva regla premiumInvitations

---

## 2026-06-26 22:10 (Chile) — Legal real (Privacidad/TyC) + Bloque B seguridad (App Check, rate limits)

**Contexto:** evaluación de cumplimiento SaaS. Verde en RLS (firestore/storage rules), auth (Firebase), API keys fuera del frontend. Brechas cerradas hoy: documentos legales y endurecimiento anti-abuso.

**Legal (Ley 19.628 / Ley 21.719, rige 01-12-2026):**
- Nuevo `src/core/legal/legalContent.ts` — Política de Privacidad y TyC reales, VERSIONADAS (v1.0, vigente 2026-06-26). Cubre: responsable, datos recopilados, finalidades+base de licitud, encargados (Firebase/Stripe/SendGrid/Maps/Gemini), transferencia internacional, conservación, derechos del titular (incl. portabilidad/bloqueo de la 21.719), seguridad, notificación de brechas, cookies/localStorage.
- `src/views/LegalView.tsx` — reemplazado el placeholder; ahora renderiza el contenido versionado (texto escapado por React, sin innerHTML).
- ⚠️ **[PENDIENTE titular]:** completar en `legalContent.ts` los `[PENDIENTE]`: razón social/RUT, domicilio legal, y validar con abogado antes de publicar.

**Bloque B — seguridad técnica:**
- `src/core/firebase.ts` — App Check (reCAPTCHA v3) vía `initializeAppCheck`, condicionado a `VITE_RECAPTCHA_V3_SITE_KEY` (no rompe dev si está vacío).
- `functions/src/index.ts` — helper `enforceRateLimit(key,max,windowSec)` (ventana fija sobre colección `rateLimits`, Admin SDK). Aplicado: apiProxy (20/min + 200/día por uid), sendInviteEmail (30/h). `enforceAppCheck:true` + `maxInstances` en las 4 callables (apiProxy=10, sendInvite=10, sendPremiumInvite=5, setUserState=5). Validación/saneamiento de `prompt` en apiProxy (tipo, no vacío, ≤8000 chars).
- Nuevo `Web/.env.local.example` documentando todas las VITE_* incl. la nueva site key.

**Archivos tocados:** `Web/src/core/legal/legalContent.ts` (nuevo), `Web/src/views/LegalView.tsx`, `Web/src/core/firebase.ts`, `Web/functions/src/index.ts`, `Web/.env.local.example` (nuevo).

**⚠️ Pasos requeridos en local/prod (NO ejecutados aquí):**
1. `cd Web/functions && npm install && npm run build` (verificar TS) y `firebase deploy --only functions`.
2. Registrar App Check en Firebase Console (reCAPTCHA v3), poner la site key en `VITE_RECAPTCHA_V3_SITE_KEY` (Cloudflare + .env.local). **Sin esto, las callables con `enforceAppCheck` rechazarán al frontend.**
3. `npm run build` del frontend. (El sandbox sirvió montaje dessincronizado; tsc no se pudo confirmar aquí — validar en local.)

**Intocables respetados:** reglas Firestore/Storage y validación `request.auth.uid` sin cambios.

---

## 2026-06-26 20:30 (Chile) — Auditoría YAGNI + limpieza quirúrgica (código muerto y deps)

- Auditoría profunda Front+Back (criterio YAGNI). Reporte en `DESARROLLO/INFORME_AUDITORIA_YAGNI_2026-06-26.md`.
- **Dependencias Turf saneadas** (`Web/package.json`): se eliminó el meta-paquete `@turf/turf` (nunca importado) y se declararon explícitamente los 4 submódulos que el código sí usa: `@turf/area`, `@turf/boolean-point-in-polygon`, `@turf/helpers`, `@turf/point-to-polygon-distance`. ⚠️ **Requiere `npm install`** en `Web/` antes del próximo build/deploy.
- **Archivos muertos eliminados** (sin referencias en todo `src`): `src/components/ModuleHeader.tsx`, `src/tools/CalculadoraArquitectonica.tsx`, `src/tools/MapaTerrenoView.tsx`, y la cadena geoUtils muerta `src/core/geoUtils.ts` (`generarLlaveMaestra`, sin uso) + `src/utils/geoUtils.ts` (puente). Se eliminó la carpeta vacía `src/utils/`.
- **Tipos/funciones sin uso eliminados:** `Coordenada` en `core/types.ts`; `getCiudadesPorRegionSorted` y `findProvinciaPorComuna` (+ su mapa `COMUNA_PROVINCIA_DATABASE`, ~100 líneas) en `core/data-chile.ts`.
- **Doc alineada (P1-5):** `Iniciar Aquí.md` §1/§3 — el Cerebro Normativo resuelve la ficha desde archivos locales `/norma-data/*.json` (llave `comunaSlug`), no desde la DB `coordenadasnormativas` (marcada como legado).
- **Intocables respetados:** no se tocó `try/catch`, validación `request.auth.uid`, reglas Firestore/Storage, ni `DocumentExportWrapper` (reutilizado por 22 tools).
- **Verificación:** `tsc -b` pasó con 0 errores tras los cambios. ⚠️ El build `vite` en el sandbox no pudo confirmarse porque el montaje sirvió vistas truncadas de archivos NO tocados (`LegalView.tsx`, `AppShell.tsx`) — artefacto del entorno, no del código. **Pendiente: validar `npm install && npm run build` en local.**

---

## 2026-06-26 15:12 (Chile) — Layout 1 columna en EETT/Presupuesto/Gantt (previa PDF abajo)

- A pedido del usuario, en las 3 herramientas de Construcción (Generador EETT, Presupuesto de Obra, Carta Gantt) la **vista de impresión PDF pasa de la 2ª columna a ir DEBAJO** del formulario, a ancho completo (en 2 columnas quedaba muy apretada).
- Cambio en **un solo lugar**: `src/tools/construccion/construccion.css` → `.cx-2col` deja de ser grid de 2 columnas (`minmax(320px,420px) 1fr`) y pasa a **`flex-direction:column`** (apila form arriba + `.cx-preview` abajo). Se eliminó el `@media(max-width:900px)` ya redundante. La clase la usan exactamente esas 3 vistas (`cx-2col` solo aparece en GanttView/GeneradorEETTView/PresupuestoObraView). Regla `@media print` intacta.
- **Tocado:** `Web/src/tools/construccion/construccion.css`. Sin cambios de TS/JSX. ⚠️ Falta `npm run dev` para confirmar el apilado y que la lámina PDF respira a ancho completo.

---

## 2026-06-26 15:10 (Chile) — Guía de dominio propio para Libro de Obra Digital (librodeobra.cl) + archivado del PLAN

### Qué se hizo (solo documentación; CERO cambios de código)
- **Nueva `DESARROLLO/GUIA_DOMINIO_LibroDeObra.md`**: guía operativa, lo más simple posible, para publicar el producto LDO en **`librodeobra.cl`**.
- **Hallazgo clave:** el código **ya soporta `librodeobra.cl`** sin cambios. `Web/src/core/product/product.ts` (línea 60) resuelve `librodeobra` si `host.startsWith('librodeobra.') || host === 'librodeobra.cl'`. Es **solo configuración de dominio/DNS**, mismo build de Cloudflare Pages sirve los dos dominios.
- **Resumen de la guía:** registrar `librodeobra.cl` en NIC Chile → mover su DNS a Cloudflare (Add site → cambiar nameservers en NIC) → añadirlo como **Custom Domain** del proyecto Pages `projectbook` (crea registros + SSL solo) → (opcional) redirección `www`→apex con Redirect Rule → verificar (`librodeobra.cl` = LDO, `archibots.cl` = Archiblocks; `?product=librodeobra` fuerza el modo para QA). Rollback: quitar el Custom Domain no afecta a archibots.cl.
- **Opcionales documentados (no bloquean):** `<title>`/favicon por producto (hoy estáticos) y enlaces de invitación product-aware en las Functions (hoy base `archibots.cl`).
- **`PLAN-LibroDeObraDigital.md` movido a `Antiguos u Obsoletos/`** (queda superado: Fases 1–3 ya implementadas; Fase 4 = esta guía; Fase 5 = el único pendiente menor, anotado arriba).

### Archivos
- **Nuevo:** `DESARROLLO/GUIA_DOMINIO_LibroDeObra.md`.
- **Movido:** `DESARROLLO/PLAN-LibroDeObraDigital.md` → `Antiguos u Obsoletos/`.
- **Tocados:** `DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md` (§2 y §8 apuntan a la nueva guía), `Last Update.md`.

---

## 2026-06-26 15:04 (Chile) — Consolidación de pendientes: se elimina Tintero (a Antiguos) y se archiva el Informe de Auditoría

### Qué se hizo (solo documentación)
- **`Tintero - Pendientes.md` movido a `DESARROLLO/Antiguos u Obsoletos/`.** Duplicaba/confundía información con esta bitácora. Antes de moverlo se rescataron **solo los ítems pendientes** y quedan consolidados abajo. Nota del usuario (Gregorio): en revisión rápida **casi todo ya está implementado**; lo de abajo queda como lista a **verificar/cerrar**, no como trabajo necesariamente abierto.
- **`INFORME_AUDITORIA_ARQUITECTURA.md` movido a `Antiguos u Obsoletos/`** por obsoleto (snapshot 2026-06-17; hallazgos clave ya resueltos: hay git con remoto, `db = (default)`, MAPA al día).

### 📌 Pendientes vigentes (heredados del Tintero — VERIFICAR, varios podrían estar ya cerrados)

**Funcionalidad / lógica**
- [ ] **Maps:** confirmar carga del SDK de Google Maps en runtime y degradación a ingreso manual si falla. (`GeolocalizadorView.tsx`, `MapaTerrenoView.tsx`; depende de `VITE_GOOGLE_MAPS_API_KEY`).
- [ ] **Creador de polígono:** dibujo del polígono + cálculo de área; interacción mapa ↔ Web Worker. (`MapaTerrenoView`/`GeolocalizadorView`, `workers/geo.worker.ts` op `area`, `hooks/useDimensionadorSync.ts`).
- [ ] **Módulo BIM:** asistente de usos BIM (Premium) y su llamada al backend. (`BimWizardView.tsx`, function `apiProxy`, `useAccess.ts`).
- [ ] **Administración de Top Tools:** ranking/barra inferior. (`AdminDashboard.tsx`, `TopToolsBar.tsx`, `catalog.ts TOP_TOOLS_DEFAULT`, `config/topTools`).
- [ ] **Ficha Normativa:** validar la Coreografía de Conexión y la ficha PRC resultante. (`NormativaService.ts`, `useCerebroNormativo.ts`, `GeolocalizadorView.tsx`, `GeoJsonService.ts`).

**UX / layout**
- [ ] **Reubicar botón "Compartir proyecto".** (`StatusBar.tsx`, `ShareProjectModal.tsx`).
- [ ] **Quitar la barra de progreso del expediente** de la ficha. (`BinderFicha.tsx`).
- [ ] **Reubicar "Avance del expediente".** (`BinderFicha.tsx`).
- [ ] **Arreglar formato de la ficha de exportación** (membrete + firma + `@media print`). (`DocumentExportWrapper.tsx`, `archibots.css`).

**Infraestructura / no-código**
- [ ] **Correo institucional `@archibots`:** alinear remitente (`from:`) de `sendInviteEmail`/`sendPremiumInviteEmail`. *(Posiblemente ya resuelto: el último commit usa `contacto@archibots.cl`; confirmar.)*

**Auditoría de persistencia (stores solo-local restantes)**
- [ ] **`VolumenTeoricoView`** (inputs) y **`ExpedienteMunicipalView`** (estado) siguen en `localStorage`; migrar a `useToolData` si se confirma el alcance. *(Terreno y Seguimiento de Obras ya migrados/verificados — ver entradas 2026-06-26.)*

### Archivos
- **Movidos:** `DESARROLLO/Tintero - Pendientes.md`, `DESARROLLO/INFORME_AUDITORIA_ARQUITECTURA.md` → `DESARROLLO/Antiguos u Obsoletos/`.
- **Tocado:** `Last Update.md` (esta entrada). El MAPA §8 ya no debe listar Tintero ni el Informe como vigentes (corregir al próximo toque).

---

## 2026-06-26 14:59 (Chile) — Limpieza de DESARROLLO: archivado de MD obsoletos + reescritura del MAPA de arquitectura

### Qué se hizo (solo documentación; CERO cambios en código de la Web)
- **Revisión de los `.md` de `DESARROLLO/`** contra la realidad actual (código en `Web/` + entradas recientes de `Last Update.md`). Clasificación vigente vs obsoleto.
- **Movidos a `DESARROLLO/Antiguos u Obsoletos/`** (3, con `mv` simple porque había un `index.lock` de git activo; el versionado los recogerá en el próximo `guardar.bat`):
  - `Mockup nuevas herramientas.md` — describía las 5 herramientas como **mockups en memoria**; hoy las 5 están productizadas (persistencia real, Storage, workers). Paths viejos `C:\G\ProjectBook`.
  - `PLAN_ACCION_MAESTRO_PRODUCCION.md` — WBS de la migración micro-frontends → SPA: **ejecutada** (SPA en producción, SPRINT S7 cerrado, rutas `/test` eliminadas).
  - `PLAN_REFACTORIZACION_SPA.md` — plan/registro del rediseño de layout: **ejecutado** (ShellTop/ShellDock, layout nuevo en producción).
- **Conservados** (vigentes): `MAPA_ARQUITECTURA_PROYECTO.md` (actualizado), `Tintero - Pendientes.md`, `PROMPT_MAESTRO_HERRAMIENTA.md` (v1.1), `GUIA_GITHUB_Y_DEPLOY.md`, `PLAN-LibroDeObraDigital.md` (Fases 4–5 abiertas), `INFORME_AUDITORIA_ARQUITECTURA.md` (borderline: snapshot 2026-06-17, varios hallazgos superados — candidato a archivar si se confirma).
- **`MAPA_ARQUITECTURA_PROYECTO.md` reescrito a la situación actual:** rebranding a Archiblocks (con nota de infra conservada), raíz `C:\G\Archiblocks\Web`, `db = (default)` (`initializeFirestore`, ya no la base `ai-studio-*`), **§2 dos productos host-aware** (`product.ts`, router con `libroChildren`/`archiblocksChildren`, `LibroLanding`/`LibroWorkspace`), árbol `src/` al día (ShellTop/ShellDock/ArchiblocksNav + escenas, subcarpetas `construccion/`/`forms/`/`obra/`/`termico/`, `terrenoStore`, `FormulariosDOMView`, EETT/Presupuesto/Gantt), **§4 catálogo completo** carpetas 0–7 con estado/tier, despliegue Cloudflare+Firebase, y §8 documentos hermanos.

### Archivos
- **Movidos:** `DESARROLLO/Mockup nuevas herramientas.md`, `DESARROLLO/PLAN_ACCION_MAESTRO_PRODUCCION.md`, `DESARROLLO/PLAN_REFACTORIZACION_SPA.md` → `DESARROLLO/Antiguos u Obsoletos/`.
- **Reescrito:** `DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md`.
- **Tocado:** `Last Update.md` (esta entrada).

### Pendientes / nota
- Confirmar si `INFORME_AUDITORIA_ARQUITECTURA.md` también se archiva (muchos hallazgos ya resueltos: hay git con remoto, `db=(default)`, MAPA al día).
- `Iniciar Aquí.md` §7 todavía lista los dos planes movidos como referencia; conviene actualizar esa tabla cuando se toque ese doc.

---

## 2026-06-26 14:52 (Chile) — Rebranding a "Archiblocks" en Iniciar Aquí.md + migración del Terreno a la nube

### Rebranding (Iniciar Aquí.md)
- A pedido del usuario, el nombre de la plataforma pasa a ser **Archiblocks**. En `Iniciar Aquí.md`: título, prosa de §1 (antes "Archibots / Project_Book / BASEPRO — Gestión Documental") y **todas las rutas de repo** `C:\G\ProjectBook` → **`C:\G\Archiblocks`** (raíz, `\Web`, comandos git/npm).
- **Decisión HITL:** se **dejaron intactos los identificadores reales de infraestructura** (proyecto Firebase `archibots-497423`/`archibots-dev`, repo GitHub `goyogramadors/projectbook`, proyecto Cloudflare `projectbook`, dominios `archibots.cl`/`projectbook-8qt.pages.dev`) y nombres de archivo (`archibots.css`) — renombrarlos en el doc apuntaría a recursos inexistentes. También se mantuvo el comando de skill `/Basepro Terminar` (comando real).

### Migración de datos locales → nube (Tintero §"Auditoría de persistencia")
- **Hallazgo:** de los dos "candidatos claros a nube", **Seguimiento de Obras YA persiste en Firestore** para Premium (`SeguimientoObrasView.tsx` líneas 90/109/120; localStorage solo Free) — la nota de auditoría estaba desactualizada en ese punto. El único store que escribía **solo a localStorage** sin importar el tier era el **terreno (polígono + área)**, compartido por 3 herramientas.
- **Nuevo `src/tools/terrenoStore.ts`**: persistencia compartida. Premium (`repo.kind==='cloud'`) → `projects/{pid}/toolData/terreno` (esquema `{payload,updatedAt}` igual a `useToolData`, **cubierto por la regla existente `toolData/{document=**}`** — sin cambios de reglas ni índices). Escritura **siempre espeja a localStorage** (clave compartida `ab-mapa-terreno-${pid}` intacta) para sync en caliente entre herramientas y offline. Lectura: nube primero (Premium) y degrada a local.
- **Cableado quirúrgico** en `UbicacionView.tsx`, `MapaTerrenoView.tsx`, `GeolocalizadorView.tsx`: reemplazados los `localStorage.get/setItem` del terreno por `loadTerreno`/`readTerrenoLocal`/`saveTerreno`; agregado `repo` al `useProjects()` donde faltaba; eliminadas las consts de clave ya inútiles. La carga pinta local al instante y reconcilia con nube en async.

### Archivos
- **Nuevos:** `Web/src/tools/terrenoStore.ts`.
- **Tocados:** `Iniciar Aquí.md`, `DESARROLLO/Tintero - Pendientes.md`, `Web/src/tools/UbicacionView.tsx`, `Web/src/tools/MapaTerrenoView.tsx`, `Web/src/tools/GeolocalizadorView.tsx`.

### Verificación
- **`tsc --noEmit` del proyecto completo: 0 errores.** Se removieron bloques de bytes NUL (artefacto de truncado del montaje §8) al final de `GeolocalizadorView.tsx` y `MapaTerrenoView.tsx` antes del typecheck. ⚠️ Falta `npm run dev` local: confirmar que en Premium el polígono/área sincroniza entre dispositivos y que en equipo nuevo (local vacío) la carga async redibuja; revisar el caso de redibujo del polígono al hidratar desde nube tras montar el mapa.

### Pendientes
- En equipo nuevo Premium, el área se hidrata desde nube pero el redibujo del polígono depende del efecto de Maps; validar UX.

### Adenda (misma sesión) — Expediente Municipal a la nube; Volumen Teórico ya estaba
- **Verificación pedida por el usuario:** `VolumenTeoricoView` **ya persistía en la nube** para Premium (subcolección `projects/{id}/volumen/estado`, líneas 197/216) — la subcolección ya existía; no requirió cambios.
- **`ExpedienteMunicipalView` migrado** a `useToolData('expediente-dom')` → `projects/{pid}/toolData/expediente-dom` (cubierto por la regla `toolData/{document=**}`, sin cambios de reglas/índices). Free/offline → localStorage `ab-expediente-dom-{pid}` (misma clave de antes: datos previos conservados). Guardado con **debounce 600 ms** (evita escribir en cada tecla). Se quitaron states/efecto/persist locales redundantes.
- ⚠️ El montaje truncó el archivo largo a mitad del JSX (riesgo §8): se reconstruyó completo en scratch (`/outputs`) y se copió. **`tsc --noEmit` del proyecto: 0 errores.**
- **Tocado:** `Web/src/tools/ExpedienteMunicipalView.tsx`. Tintero: auditoría de persistencia **cerrada** (todos los stores señalados sincronizan en nube para Premium).

---

## 2026-06-26 22:45 (Chile) — Región/Ciudad no manuales en ProjectMaster + Carta Gantt (catálogo de plazos)

### Región y Ciudad (campos no manuales)
- **`ProjectMaster`** (`types.ts`): nuevos `region?: string` y `ciudad?: string`.
- **`data-chile.ts`**: nuevo `getRegionDeComuna(comuna)` (reverse determinista comuna→región).
- **`UbicacionView.tsx`**: al escribir la comuna **autollena la región** (no manual); al guardar persiste `region` (derivada) y `ciudad` (= comuna por defecto) en el master. Antes la región vivía solo en localStorage.
- **Lectura aguas abajo:** `GeneradorEETTView` usa `master.region` para el placeholder `{region}` (el campo manual queda solo como override). Los formularios DOM ya resuelven binds desde el master, por lo que `project.region`/`project.ciudad` quedan disponibles para los field-maps que los referencien. El Térmico sigue usando `comuna` (no requiere región para el cálculo).

### Carta Gantt (nueva herramienta, carpeta 5)
- **Catálogo de plazos aparte y editable:** `DESARROLLO/EETT y Presupuesto/CATALOGO_GANTT_PLAZOS.md` (por capítulo NCh 1150: semanas + solape). El generador `build-catalogos-construccion.mjs` lo parsea a `Web/src/tools/construccion/catalogo.gantt.ts` (9 capítulos).
- **`GanttView.tsx`** (id `gantt`, ahora `active`): activa los capítulos según la MISMA selección del Generador de EETT (un capítulo aparece si tiene partida activa en el presupuesto, + 1 y 9 siempre); calcula barras secuenciales con solape, fecha de inicio editable, plazos editables por capítulo, total en semanas/meses. Exporta PDF vía `DocumentExportWrapper`.
- Cableado en `catalog.ts` (gantt → active) y `registry.ts` (lazy → GanttView).

### Archivos
- **Nuevos:** `DESARROLLO/EETT y Presupuesto/CATALOGO_GANTT_PLAZOS.md`; `Web/src/tools/construccion/catalogo.gantt.ts`; `Web/src/tools/GanttView.tsx`.
- **Tocados:** `Web/src/core/types.ts`, `Web/src/core/data-chile.ts`, `Web/src/tools/UbicacionView.tsx`, `Web/src/tools/GeneradorEETTView.tsx`, `Web/scripts/build-catalogos-construccion.mjs`, `Web/src/core/catalog.ts`, `Web/src/core/registry.ts`.

### Verificación
- **`tsc --noEmit`: 0 errores** en todo el proyecto. esbuild RC=0 en los archivos nuevos. ⚠️ Falta `npm run dev` local para revisar render (autollenado de región al elegir comuna, barras de la Gantt, exportación PDF).

### Pendientes
- Curar los field-maps DOM para que enlacen `project.region`/`project.ciudad` donde corresponda.
- Ciudad: hoy = comuna; si se quiere la localidad real, extraerla del geocode (locality) en UbicacionView.
- Export `.xlsx` del Presupuesto (heredado).

---

## 2026-06-26 21:30 (Chile) — Integración EETT (Generador) + Presupuesto de Obra (carpeta 5 · Construcción)

### Qué se hizo
Integradas y ACTIVADAS dos herramientas de la sección Construcción → "EETT, Presupuesto y Carta Gantt", a partir de los mockups + catálogos `.md` que dejó el usuario en `DESARROLLO/EETT y Presupuesto/`.

- **Catálogos de datos generados desde `.md` (fuente editable):** script `Web/scripts/build-catalogos-construccion.mjs` parsea `CATALOGO_EETT_RESUMIDAS.md` y `CATALOGO_PRESUPUESTO_2.0.md` → `Web/src/tools/construccion/catalogo.eett.ts` (45 partidas) y `catalogo.presupuesto.ts` (39 partidas), tipados. La taquigrafía `activa_si` del presupuesto se normaliza a la gramática canónica en el script. **Editas el `.md` y re-corres el script.**
- **Evaluador de activación** `construccion/activaSi.ts`: parser AND/OR/paréntesis con átomos (`∈ {set}`, `= sí`, `incluye`, `no vacío`, `≠ solo_obra_gruesa`, `siempre`, `opcional`). Probado 12/12 + 8/8 casos.
- **Generador de EETT** (`GeneradorEETTView.tsx`, id `eett-generador`, **colapsa** las antiguas `eett-generales` + `eett-estructuras`): selector guiado (naturaleza/estructura/terminaciones/instalaciones/urbanización), prellena desde el ProjectMaster (nombre/comuna/dirección/naturaleza desde tipoProyecto), ensambla por inclusión condicional con sustitución de placeholders, trazabilidad NCh 1150 e índice opcionales. Persiste con `useToolData('eett-generador')`. Vista previa + **Exportar PDF** vía `DocumentExportWrapper` (mismo visor PDF del resto).
- **Presupuesto de Obra** (`PresupuestoObraView.tsx`, id `presupuesto`): itemiza activando partidas con la MISMA selección del Generador de EETT; cantidades por defecto desde la superficie del master; PU en UF editables; **valor UF en vivo desde mindicador.cl** con default editable (fallback si falla la red); GG/utilidades/IVA/proforma; totales A–F en UF y $. Exporta PDF (DocumentExportWrapper). `.xlsx` queda pendiente (decisión HITL).
- **Cableado:** `catalog.ts` (eett-generador y presupuesto a `estado:'active'`, gantt sigue `soon`) + `registry.ts` (2 lazy). Estilos namespaced en `construccion/construccion.css` (cx-*).
- **`PROMPT_MAESTRO_HERRAMIENTA.md` → v1.1:** corregidas rutas (`Web/...` en vez de `Archibots/Archibots/...`), agregado §6.5 `useToolData`, §16 registro en `catalog.ts` + patrón de catálogos de datos desde `.md`, nota §8 de truncado del montaje.

### Archivos
- **Nuevos:** `Web/scripts/build-catalogos-construccion.mjs`; `Web/src/tools/construccion/{activaSi.ts, meta.ts, catalogo.eett.ts, catalogo.presupuesto.ts, construccion.css}`; `Web/src/tools/{GeneradorEETTView.tsx, PresupuestoObraView.tsx}`.
- **Tocados:** `Web/src/core/catalog.ts`, `Web/src/core/registry.ts`, `DESARROLLO/PROMPT_MAESTRO_HERRAMIENTA.md`.

### Verificación
- **`tsc --noEmit` del proyecto completo: 0 errores.** esbuild RC=0 en todos los archivos nuevos. Evaluador de activa_si testeado por unidad. ⚠️ Falta `npm run dev` local para revisar render (selector, lámina PDF, llamada a mindicador) y temas.

### Pendientes
- Carta Gantt (sin mockup; queda `soon`).
- Export `.xlsx` con fórmulas del Presupuesto.
- Afinar prellenado: `region` no existe en ProjectMaster (campo manual en el Generador); revisar mapeo fino de placeholders por partida si el usuario lo pide.

---

## 2026-06-26 20:00 (Chile) — Block LDO: etiqueta sincronizada + fix wrap del header (SYSTEM_OK 2 filas)

### Qué se corrigió
- **El texto del Block ahora cambia en LDO** (igual que Archiblocks): `onNav` marca el nodo con `setNavNode(node)` antes de navegar (db→Carpeta Digital, libro→Libro de Obras, edificio→Inicio), y un `useEffect` **sincroniza el nodo activo con la ruta/`?m=`** al cargar o recargar `/o/:id`. Antes solo navegaba con `?m=` y nunca actualizaba `navNode`, por eso la etiqueta 3D no cambiaba.
- **Fix wrap del header solo en LDO:** la marca "Libro de Obra Digital" (3.5rem + letter-spacing .16em) era mucho más ancha que "Archiblocks", comprimía `.ab-topbar` (flex:1, flex-wrap) y empujaba `SYSTEM_OK` a una 2ª fila. En LDO la marca pasa a **2.5rem / letter-spacing .08em** (inline, solo si `isLibroDeObra`); Archiblocks queda intacto.

### Archivos
- **Tocado:** `Web/src/components/ShellTop.tsx`.

### Verificación
- esbuild RC=0. `setNavNode` es `useState` plano → acepta nodos 'db'/'libro'. ⚠️ Falta `npm run dev` local para confirmar etiqueta y header en una sola fila.

### Nota
- El conmutador interno de módulos del workspace (tabs `lw-switch`) cambia el módulo sin tocar la URL, así que en ese caso la etiqueta del Block no se re-sincroniza; los accesos directos del Block sí. Si se quiere, se puede hacer que las tabs también actualicen `?m=`.

---

## 2026-06-26 19:30 (Chile) — Landing LDO ancho completo + nodos del Block como accesos directos (db/libro/edificio)

### Qué se hizo
- **Landing LDO a ancho completo:** `.lo-land` pasó de `max-width:1100px;margin:0 auto` a `width:100%;max-width:none;margin:0` (`LibroLanding.css`). La home de Libro de Obra ya no queda centrada/angosta.
- **Nodos del Block = accesos directos reales** (`ShellTop.onNav`, solo en LDO): `db` → workspace con **Carpeta Digital** (`/o/:id?m=carpeta-digital`), `libro` → **Libro de Obras** (`/o/:id?m=libro-obras`), `edificio` → **Inicio** (`/`).
- **`LibroWorkspaceView`** lee `?m=` (`useSearchParams`) para preseleccionar el módulo al cargar y **re-selecciona** cuando cambia el query (clic en otro nodo del Block), sin remontar la vista. Reconstruido completo tras truncado del montaje (§8).
- Etiqueta 3D del Block: muestra el nombre del nodo activo y escala con el SVG (responsiva al ancho del host).

### Archivos
- **Tocados:** `Web/src/views/LibroLanding.css`, `Web/src/components/ShellTop.tsx`, `Web/src/views/LibroWorkspaceView.tsx` (reescrito).

### Verificación
- ShellTop y LibroWorkspaceView pasan esbuild (RC=0). ⚠️ Falta `npm run dev` local para confirmar el ancho completo y el salto db→Carpeta / libro→Libro de Obras.

---

## 2026-06-26 18:55 (Chile) — Block LDO con edificio central + isométricas + fix ancho del workspace LDO

### Qué se corrigió
- **Block de LDO reconstruido (`librodeobra-scene.html`):** se **retomó el EDIFICIO central** (3 plantas que se arman/desarman) que se había perdido. Los dos objetos flotantes quedan **isométricos reusando la geometría original** del Block completo: `db` = pila isométrica (Carpeta Digital) y `libro` = libro isométrico (Libro de Obras). **Líneas conectoras isométricas** (rutas del Block original) y **etiqueta 3D isométrica** que muestra el **nombre de la herramienta seleccionada** (NODE_LABEL: db→Carpeta Digital, libro→Libro de Obra). Sigue siendo archivo aparte de `archiblocks-scene.html`.
- **Ancho del workspace LDO (`AppShell.tsx`):** `isWorkspace` solo reconocía rutas `/p/...`, así que `/o/:id` (workspace LDO) caía al layout estrecho `ab-outlet--mini`. Ahora `isWorkspace = segs[0]==='p' || segs[0]==='o'` y la clave de fade usa `/${segs[0]}/${segs[1]}` → el workspace LDO se expande a **ancho completo** como el de Archiblocks.

### Archivos
- **Reescrito:** `Web/src/components/librodeobra-scene.html` (edificio + db + libro, isométrico).
- **Tocado:** `Web/src/AppShell.tsx`.

### Verificación
- `AppShell.tsx` y `ArchiblocksNav.tsx` pasan esbuild (RC=0). ⚠️ Falta `npm run dev` local para revisar el render del Block LDO y confirmar el ancho completo.

---

## 2026-06-26 18:10 (Chile) — Block reducido para LDO + botones de producto arriba a la derecha + terminología "Block"

### Terminología (documentada)
- Se agregó a `Iniciar Aquí.md` (sección 1) la definición de **"el Block"**: el elemento isométrico del header que representa una construcción y funciona como **navegador con accesos directos a las secciones**. Componente `ArchiblocksNav.tsx` + escena `archiblocks-scene.html`. Futuras referencias del usuario a "el Block" apuntan a esto.

### Qué se hizo
- **Nuevo Block reducido para "Libro de Obra Digital" en archivo aparte:** `Web/src/components/librodeobra-scene.html` (distinto de `archiblocks-scene.html`). Solo **dos nodos**: símbolo de **base de datos** (`data-node="db"`, cilindro de 3 anillos) y **libro** (`data-node="libro"`), con sus dos conectores; se eliminaron los demás. Reusa `#ab-nav-root` y las clases `.ab-*`.
- **`ArchiblocksNav.tsx`:** nueva prop `scene: 'archiblocks' | 'librodeobra'` que elige qué escena inyectar (importa ambos `?raw`). `NODE_LABEL.db = 'Carpeta Digital'`. (La prop `allowed` queda disponible pero ya no se usa en LDO porque la escena reducida solo trae db+libro.)
- **`ShellTop.tsx`:** pasa `scene` según producto. **Conmutador de producto reubicado** a la **esquina superior derecha** del header (`.ab-prodswitch`, `position:absolute; top:3; right:10`), casi pegado arriba (antes estaba en la fila de controles). `.ab-top` pasa a `position:relative`.

### Archivos
- **Nuevo:** `Web/src/components/librodeobra-scene.html`.
- **Tocados:** `Web/src/components/ArchiblocksNav.tsx`, `Web/src/components/ShellTop.tsx`, `Iniciar Aquí.md`.

### Verificación
- ShellTop y ArchiblocksNav pasan **esbuild** (RC=0). ⚠️ Falta `npm run dev`/`build` local para confirmar 0 errores TS y revisar el render del Block reducido (proporciones del cilindro de base de datos).

### Pendiente menor
- Opcional: que los nodos del Block LDO preseleccionen el módulo en el workspace (db→Carpeta, libro→Libro de Obras) vía query; hoy ambos llevan a `/o/:id`.

---

## 2026-06-26 17:05 (Chile) — Header: conmutador de producto (2 botones) + marca sin link

### Qué se hizo
- **`ShellTop.tsx`** (chrome persistente, aplica a TODAS las páginas):
  - **Dos botones nuevos** estilo `.ab-topbtn` (tamaño del de Tema) en la barra superior, tras "SYSTEM_OK": **"Archiblocks"** (ícono Boxes) y **"LibrodeObra"** (ícono Notebook). Cada uno llama `switchProduct(id)` → `window.location.assign('/?product=<id>')`, que persiste el override y **recarga** para que el router host-aware se re-resuelva y caiga en la landing correcta (`HomeView` vs `LibroLandingView`). El producto activo se resalta en rojo (`--destructive`).
  - **Eliminado el link de la marca:** `.ab-brand-title` ya no navega (se quitó `onClick={() => navigate('/')}` y `title`; `cursor:default`). Antes la palabra de marca actuaba como enlace a `/`.

### Archivos
- **Tocado:** `Web/src/components/ShellTop.tsx`.

### Verificación
- esbuild RC=0. ⚠️ Falta `npm run build`/`dev` local para confirmar 0 errores TS (el dev server recarga en caliente).

### Nota
- El conmutador usa recarga completa a propósito: `PRODUCT`/`isLibroDeObra` y el árbol de rutas se resuelven una sola vez por carga de módulo (`core/product/product.ts`), así que un `navigate` SPA no bastaría para cambiar de producto.

---

## 2026-06-26 16:15 (Chile) — Libro de Obra Digital · Fase 3 (ShellTop parametrizado por producto)

### Qué se hizo
- **`ShellTop.tsx` host-aware** vía `PRODUCT`/`isLibroDeObra` (`core/product/product.ts`):
  - **Marca (der.):** título y acento rojo desde `PRODUCT.brandTop`/`brandPro`; en `librodeobra` el subtítulo es fijo (`brandSub` = "un producto de Archiblocks") en vez del slogan rotativo. Archiblocks conserva `BrandTagline`.
  - **Selector proyecto/obra:** etiqueta desde `PRODUCT.unit.singular` ("Obra" vs "Proy") y ruta `/o/:id` en librodeobra (antes siempre `/p/:id`).
  - **`onNav`:** en librodeobra cada nodo del navegador lleva al workspace de la obra (`/o/:id`).
- **`ArchiblocksNav.tsx` · navegador reducido:** nueva prop `allowed?: string[]`; tras inyectar la escena oculta (`display:none`) los `[data-node]` fuera de la lista blanca. En librodeobra se pasa `['edificio','libro','carpeta','ductos']` (Inicio + nodos de obra). Barra inferior sin cambios (reuso directo, plan §3.5).

### Archivos
- **Tocados:** `Web/src/components/ShellTop.tsx`, `Web/src/components/ArchiblocksNav.tsx`.

### Verificación
- `ShellTop.tsx` y `ArchiblocksNav.tsx` pasan **esbuild** (RC=0). ⚠️ Falta `npm run build`/`dev` local para confirmar 0 errores TS.

### ⚠️ Incidencia del entorno (§8)
- El montaje **truncó** las ediciones directas largas de `ShellTop.tsx` y `ArchiblocksNav.tsx` (archivos cortados a la mitad). **Reparado** reconstruyendo desde `git show HEAD:<archivo>`, aplicando los cambios en el sandbox y copiando con `cp`. Recordatorio §8: para archivos grandes existentes, editar en scratch y `cp`, no Edit directo.

### Pendientes
- **Fase 4** — subdominio `librodeobra.archibots.cl` (custom domain en Cloudflare Pages) + verificación SPA + gating Premium en rutas `/o/:id`.
- **Fase 5** — invitaciones product-aware (base de enlace en Functions) + QA permisos/responsive/temas.
- Refactor presentacional fino (opción 3.4.2) para el layout grande definitivo del workspace.

---

## 2026-06-26 15:30 (Chile) — Libro de Obra Digital · Fase 2 (Workspace 3 columnas)

### Qué se hizo
- **`LibroWorkspaceView.tsx` (ruta `/o/:projectId`) construido** desde el placeholder de Fase 1 a la maqueta a **3 columnas con reuso directo (opción 3.4.1 del PLAN-LibroDeObraDigital.md):**
  - **Col 1 · "Mis Obras":** selector de obras (reusa `useProjects`, filtra `DEFAULT_PROJECT_ID`), resalta la obra activa, navega a `/o/:id`; botón "Iniciar nueva obra" → `/`.
  - **Col 2+3 · herramienta activa:** monta `LibroObrasDigitalView` o `CarpetaDigitalView` (lazy, un chunk por tool) por `projectId`, con su propio layout interno (sub-libros/folios o árbol/agregar) mostrado "grande".
  - **Conmutador de módulo LDO ⇄ Carpeta** (tabs) sobre las dos columnas anchas.
- **Gating Premium** derivado con `useAccess(toolOf(modulo), obra)` — misma fuente de verdad que `ToolHost`; sin duplicar lógica ni estado (la persistencia de cada tool ya existe).

### Archivos
- **Tocado:** `Web/src/views/LibroWorkspaceView.tsx` (placeholder → workspace real).
- **Nuevo:** `Web/src/views/LibroWorkspace.css` (estilos scoped `.lw-*`, tokens del tema, responsive a 1 columna <860px).

### Verificación
- `LibroWorkspaceView.tsx` pasa **esbuild** (transform `tsx`, RC=0, sin errores). `Icon` acepta `name:string` (íconos Notebook/FolderTree/FolderPlus). ⚠️ Falta `npm run build`/`dev` local para confirmar 0 errores TS (el montaje del sandbox no refleja edición sobre archivos existentes).

### Pendientes
- **Fase 3** — `ShellTop` parametrizado por producto (branding "Libro de Obra Digital", navegador reducido), barra inferior, y refactor presentacional (3.4.2) para el layout grande definitivo.
- Fases 4 (subdominio `librodeobra.archibots.cl` en Pages) y 5 (invitaciones product-aware) según el plan.

---

## 2026-06-26 14:30 (Chile) — Corrección skill `ordenanza-a-json` (Firestore→local + cobertura de zonas)

### Qué se corrigió
- **Destino del JSON: Firestore → archivos locales.** La descripción e intro de la skill citaban "para importar a Firestore" (etapa abandonada el 22-jun). Ahora aclaran que el JSON alimenta el geolocalizador normativo como archivo local en `Web/public/norma-data/13_comuna.json` (array por comuna), matcheado por `zona_codigo`. El esquema `NormativaPRC` es idéntico; solo cambia el destino. No requiere Firebase.
- **Cobertura total de zonas (sección nueva).** Se agregó instrucción crítica de incluir TODAS las zonas, con énfasis en especiales/patrimoniales (ICH, ZCH, ZT, MH, CD, UCH, UMCE, Z-US, ZR, PM y AP, áreas verdes, área de restricción). Motivo: el geolocalizador solo devuelve ficha si el `zona_codigo` existe en el JSON; si falta, el punto cae a "parámetros estimados". Caso de referencia: Ñuñoa, 20/40 zonas sin ficha por omitir las especiales. Reforzado el checklist de validación y la coherencia `zona_codigo` ↔ GeoJSON.
- **Fix tag XML en frontmatter.** La descripción tenía `13_<comuna>.json`; el `<comuna>` se interpretaba como tag XML ("SKILL.md description cannot contain XML tags"). Reescrito a texto plano (`13_comuna.json`).

### Archivos
- **Respaldo nuevo:** `DESARROLLO/skills-respaldo/ordenanza-a-json/` (`SKILL.md` corregido + `references/` copiadas: `NormativaPRC.ts`, `ejemplo_zona_ec5.json`, `ejemplo_zona_patrimonio.json`).
- **Paquete instalable:** `DESARROLLO/skills-respaldo/ordenanza-a-json.skill` (zip) — cargar en otras sesiones vía Settings > Capabilities / botón "Save skill".

### Nota / pendiente
- La skill **activa** en la sesión sigue siendo la versión vieja (caché de solo lectura); para que el cambio tome efecto hay que **instalar el `.skill`** corregido.
- Sigue vigente el pendiente heredado de **completar fichas faltantes de zonas especiales en `norma-data`** para las comunas ya cargadas (esta corrección previene el problema en transcripciones futuras, no rellena las existentes).

---

## 2026-06-24 23:30 (Chile) — Ajustes del "Block" (navegador), layout central y remitente de correos

### Block (navegador del header) — afinamientos visuales
- Tamaño/medidas finales en `.ab-nav-host` (`src/archibots.css`): el elemento (`#ab-nav-root`)
  quedó en **175px** de alto, host `flex-basis 625px`, **anclado a la base** (`align-items:flex-end`)
  con `min-height:215px` (el aire extra del header va arriba). Padding inferior 16px para
  despegarlo del borde inferior. Padding izquierdo reducido a 7.5px (–25% al borde izq).
- En `src/components/archiblocks-scene.html`:
  - Ícono de **Permisos** movido de abajo a **arriba a la derecha** (`translate 636,150`),
    con su línea conectora y pin re-ruteados; esto permitió bajar el header.
  - `viewBox` final `150 66 900 336` (recorte inferior + aire arriba para el texto grande).
  - Etiqueta de sección: **una sola línea siempre** (lógica en `ArchiblocksNav.tsx`),
    fuente **58px**, **justificada a la derecha** (`text-anchor:end`, anclas de `lab-line1/2`
    en `translate 460,…`, regla naranja `x=160 width=300`). Ángulo isométrico original `-0.5`.
  - Paleta **responsiva** a todos los temas: hereda `currentColor` (=`--bar-foreground`) y
    `--bar`; el acento usa `--destructive`.
- `src/components/ArchiblocksNav.tsx`: la escena se **inyecta una sola vez** (no por
  `dangerouslySetInnerHTML`) para que el `.active` y los textos no se borren en re-render;
  clics por **delegación de eventos**. Marca/“des-marca” en ambos sentidos (Block ↔ pestañas
  del Binder) vía contexto `ActiveSection`. Nodo **galvano = carpeta 6 Administrativos**.
- Marca: separación de "Archiblocks" + slogan al borde derecho **triplicada**
  (`.ab-brand` padding-right 9→27px).

### Layout central (`src/views/WorkspaceView.tsx`)
- Columnas reordenadas: **izquierda** = Carpeta del proyecto + "Mis Proyectos";
  **centro** = Catálogo (sin cambios); **derecha** = Área dinámica de trabajo.
  "Avance del Expediente" quedó **debajo de "Mis Proyectos"** (col 1, fila 2).
- Se reasignaron columnas del grid e invirtió el signo del arrastre de los separadores.

### Remitente de invitaciones (anti-SPAM)
- `functions/src/index.ts`: `from` de `sendInviteEmail` y `sendPremiumInviteEmail` cambiado de
  `crearco@gmail.com` → **`contacto@archibots.cl`** (nombre **Archiblocks**). Falta el deploy de
  functions (`firebase deploy --only functions`) y autenticar el dominio en SendGrid (CNAME DKIM)
  + verificar el sender. Casilla `contacto@archibots.cl` se crea con **Cloudflare Email Routing**
  (reenvío a `crearco@gmail.com`); pendiente habilitar el servicio y aplicar MX/TXT.

### Pendientes
- `npm run build` local + `firebase deploy --only functions` para que el nuevo remitente quede vivo.
- Completar Cloudflare Email Routing (enable + DNS) y SendGrid Domain Authentication (anti-SPAM).
- Curaduría fina de `bind` en los field-maps DOM (sesiones previas).

---

## 2026-06-24 21:15 (Chile) — Refactor del Header: navegador interactivo Archiblocks + rebrand

### Contexto
Se rediseña SOLO la parte superior (header). La marca pasa de **BASEPRO → Archiblocks**
(«blocks» en rojo). Se reemplazan las 2 imágenes del header por el nuevo **logo/navegador
interactivo** (SVG isométrico, 9 nodos de acceso directo) que marca la sección activa.

### Nuevo layout del header (izq→der)
1. Navegador interactivo (alto completo, fondo transparente → se funde con la barra).
2. Botones actuales (Inicio · Usuario · Tema · Proyecto · SYSTEM_OK).
3. Marca **Archiblocks** (arriba-der, «blocks» en rojo, mismo letter-spacing que BASEPRO)
   con slogan rotativo debajo (5 frases, mayúsculas en rojo).

### Mapa de los 9 nodos → sección
edificio=Inicio (/) · botonera=Datos Proyecto (carpeta 1) · terreno=Terreno (2) ·
archivador=Proyecto (3) · permisos=Permisos (4) · carpeta=Carpeta Digital (5) ·
ductos=Obra (5) · libro=Libro de Obra (5) · galvano=Admin (/admin).
(Carpeta Digital, Obra y Libro de Obra abren la sección **5. Construcción**.)

### Archivos nuevos
- **`src/components/archiblocks-scene.html`** — escena SVG + estilos, fondo transparente,
  paleta por `[data-theme]` (oscuro/claro). **Editable por separado** (es el «elemento aparte»).
- **`src/components/ArchiblocksNav.tsx`** — inyecta la escena (`?raw`) y conecta el
  comportamiento a React (etiqueta, líneas, hover, clic). Props `active`/`dark`/`onSelect`.
- **`src/core/ui/ActiveSection.tsx`** — contexto que une el navegador del header con la
  carpeta del Binder (`section` ↔ `navNode`, con mapas NODE_SECTION/SECTION_NODE).

### Archivos tocados
- **`src/components/ShellTop.tsx`** — quita las 2 `<img>` y «BASEPRO»; agrega el navegador,
  la marca Archiblocks y el slogan rotativo (`BrandTagline`); `onNav` enruta + marca; efecto
  que sincroniza Inicio/Admin con el nodo marcado.
- **`src/views/WorkspaceView.tsx`** — el `binderTab` ahora viene del contexto `useActiveSection`
  (antes era estado local), para que el navegador del header controle la carpeta.
- **`src/main.tsx`** — envuelve la app en `<ActiveSectionProvider>`.
- **`src/archibots.css`** — `.ab-nav-host` (alto completo, blend), `.ab-brand-rot` (fade),
  ocultar navegador en <760px.

### Verificación
- `ArchiblocksNav.tsx` y `ActiveSection.tsx` pasan esbuild (sintaxis OK). El resto se revisó
  manualmente. ⚠️ Igual que antes, falta `npm run build`/`npm run dev` local para confirmar
  0 errores TS (el montaje del sandbox no refleja ediciones sobre archivos existentes).
- Imágenes viejas (`Logo-Archibots.png`, `Basepro-*.png`) quedan en `public/` sin uso; se
  pueden borrar luego. `archiblocks.html` original en `public/` queda como referencia; el
  componente usa la copia en `src/components/`.

---

## 2026-06-24 17:00 (Chile) — Tipo de proyecto + 5 formularios DOM (Obra Nueva) llenables

### Contexto
Se introduce el dato "Tipo de proyecto" (OGUC) que gobierna qué formularios municipales
aparecen en Expedientes de Permisos → Expediente DOM, y se suben los 5 formularios de
**Obra Nueva** como herramientas llenables data-driven (skill `dom-formularios`, 5 trámites).

### Cambios (archivos tocados)
- **`src/core/types.ts`** — nuevo `TipoProyecto` (5 valores OGUC: Obra nueva, Ampliación
  mayor a 100 m², Alteración, Reconstrucción, Reparación) + const `TIPOS_PROYECTO`;
  `ProjectMaster.tipoProyecto?` (opcional); `CatalogTool.tiposProyecto?` (visibilidad).
- **`src/tools/DatosProyectoView.tsx`** — el antiguo "Tipo de Proyecto" (Habitacional/…)
  se renombra a **"Categoría del Proyecto"** (constante local `CATEGORIAS_PROYECTO`, misma
  persistencia `ab-datos-proyecto`); se agrega el nuevo selector **"Tipo de Proyecto"** (OGUC)
  guardado en el ProjectMaster (`repo.save`). Preview actualizada con ambas filas.
- **`src/core/catalog.ts`** — 5 slots en Expediente DOM con `tiposProyecto`:
  `solicitud-permiso` → "Solicitud de Anteproyecto"; nuevos `permiso-edificacion`,
  `modificacion-proyecto`, `dj-termino`; `recepcion-final` repurposed → "Solicitud de
  Recepción Definitiva" (active). Visibilidad por tipo según distribución de la Biblioteca.
- **`src/core/registry.ts`** — los 5 slots montan la MISMA vista `FormulariosDOMView` (lazy).
- **`src/tools/FormulariosDOMView.tsx`** — resuelve el field-map por **slot (toolId)+Tipo de
  proyecto** (`SLOT_TRAMITE` + `FORM_BY_TIPO`); `useToolData` por slot; oculta el selector
  cuando el formulario queda fijado por el tipo. Retro-compatible con `solicitud-permiso`.
- **`src/components/ToolCatalog.tsx`** — filtra el catálogo por `ProjectMaster.tipoProyecto`
  (helper `allowed`): si la tool restringe `tiposProyecto` y el proyecto tiene un tipo no
  incluido, se oculta; sin tipo definido se muestran todas.
- **`src/forms/index.ts`** — registra los field-maps `2-3.1`, `2-5.1`, `2-7.1`, `dj-termino-on`
  (además de `2-1.1`).
- **NUEVOS field-maps + imágenes** (skill `dom-formularios`, build_form.py):
  `src/forms/{2-3.1,2-5.1,2-7.1,dj-termino-on}.fieldmap.json` (450/678/255/299 campos) y
  `public/forms/{…}/page-N.png`. Títulos curados por formulario.

### Distribución por Tipo de proyecto (de BibliotecaView)
- Obra nueva: Anteproyecto · Permiso · Modificación · Recepción · DJ Término (5)
- Ampliación >100 m²: Anteproyecto · Permiso · Modificación · Recepción (sin DJ)
- Alteración: Anteproyecto · Permiso · Recepción · DJ (sin Modificación)
- Reconstrucción: las 5 · Reparación: Permiso · Modificación · Recepción · DJ (sin Anteproyecto)

### Actualización (misma sesión) — field-maps de TODOS los tipos
Se generaron los 17 formularios restantes (skill `dom-formularios`), completando los 5 tipos:
- Ampliación > 100 m²: `2-1.2`, `2-3.2`, `2-5.2`, `2-7.2` (sin DJ).
- Alteración: `2-1.3`, `2-3.3`, `2-7.3`, `dj-termino-alt` (sin Modificación).
- Reconstrucción: `2-1.4`, `2-3.4`, `2-5.4`, `2-7.4`, `dj-termino-rec`.
- Reparación: `2-3.5`, `2-5.5`, `2-7.5`, `dj-termino-rep` (sin Anteproyecto).
Total: **22 field-maps** en `src/forms/` + 22 carpetas de PNG en `public/forms/`. Títulos
curados. `src/forms/index.ts` reescrito con los 22 imports; `FORM_BY_TIPO` (FormulariosDOMView)
extendido con los 5 tipos. Los slots ahora resuelven el PDF exacto por tipo+trámite.

### PENDIENTE / verificación
- ⚠️ **Falta `npm run build` local.** El sandbox no reflejó las ediciones en el montaje
  bash, así que no se pudo compilar aquí; los archivos en disco están correctos. Ejecutar
  `npm run build` (o `npm run dev`) en `Web/` para confirmar 0 errores TS y los chunks.
- Curaduría fina de `bind` en los 21 field-maps nuevos (auto-bind cubrió 11–37 campos c/u);
  el resto de campos se llenan a mano o se curan después contra `reference/fieldmap-spec.md`.

---

## 2026-06-24 12:13 (Chile) — Cambio de raíz del repositorio: E:\2CLAUDE\ProjectBook → C:\G\ProjectBook

### Contexto
Andrés movió el repositorio a `C:\G\ProjectBook`. El resto de carpetas/subcarpetas (`Web/`,
`DESARROLLO/`, etc.) permanece igual. Se actualizan todas las referencias documentales a la raíz.

### Cambios
- Reemplazo global `E:\2CLAUDE\ProjectBook` → `C:\G\ProjectBook` (41 ocurrencias en 10 archivos):
  `Iniciar Aquí.md`, `.gitignore`, `Web/archibots-project-root-memory.md` y en `DESARROLLO/`:
  `GUIA_GITHUB_Y_DEPLOY.md`, `MAPA_ARQUITECTURA_PROYECTO.md`, `PLAN_ACCION_MAESTRO_PRODUCCION.md`,
  `PLAN_REFACTORIZACION_SPA.md`, `INFORME_AUDITORIA_ARQUITECTURA.md`, `Mockup nuevas herramientas.md`,
  `Tintero - Pendientes.md`.
- Las referencias **históricas** a `E:\2CLAUDE\Archibots` (obsoletas, conservadas para trazabilidad)
  NO se tocaron.

### Verificado
0 referencias restantes a la raíz anterior; 41 ya con `C:\G\ProjectBook`. Subrutas (`\Web`, `\DESARROLLO`)
intactas.

### Nota
El skill instalado `dom-formularios` (SKILL.md + reference) aún cita la raíz anterior en su texto;
es un paquete aparte (caché de skills) y se actualizará al reinstalarlo, no afecta al código del repo.

---

## 2026-06-24 09:46 (Chile) — DOM-Formularios: primer formulario llenable (F 2-1.1) integrado y compilando

### Contexto
Primera prueba del skill `dom-formularios`. Se integra el FORMULARIO-2-1.1 (Solicitud de Aprobación
de Anteproyecto — Obra Nueva) como herramienta llenable data-driven, en Carpeta 4 (Expedientes de
Permisos) → "Expediente DOM" → "Formulario de Solicitud de Permiso".

### Decisión de integración
La entrada `solicitud-permiso` YA existía en `catalog.ts` (folder 4, sub "Expediente DOM", `soon`) —
es exactamente el slot pedido. Se **activó esa entrada** apuntando a la herramienta nueva en vez de
duplicar id. La tool es ÚNICA y data-driven (sirve a todos los formularios vía field-map).

### Cambios (archivos tocados)
- **`src/core/types.ts`** — contratos DOM-Formularios: `FormFieldType`, `FormField`, `FormFieldMap`,
  `FormValues`, `FormulariosDOMState`, `FormFieldOption`.
- **`src/tools/forms/fillForm.ts`** (nuevo) — motor híbrido pdf-lib (import dinámico): rellena AcroForm
  por `field.acro` (texto/casilla/choice/radio); fallback `drawText` en `rectPt`; `transform`
  (uppercase/date/uf/number/split); `downloadPdf`.
- **`src/tools/FormulariosDOMView.tsx`** (nuevo) — UNA tool data-driven: imágenes de página de fondo +
  inputs HTML superpuestos por coordenadas (pt→px, flip Y), prefill desde `ProjectMaster` + Arquitecto
  (lee `toolData/participantes`), `useToolData('solicitud-permiso')`, `setToolState`, descarga y
  **guardado en expediente** vía `subirAdjunto(pid,'formularios',file)`.
- **`src/forms/2-1.1.fieldmap.json`** (nuevo) — field-map real (262 campos: 188 texto, 73 casillas,
  1 lista; 15 auto-bind). Generado con `extract_fields.py`.
- **`src/forms/index.ts`** (nuevo) — registro `FORM_MAPS` de field-maps.
- **`public/forms/2-1.1/page-1..5.png`** (nuevos) — fondos del editor (pdftoppm 150 dpi).
- **`src/tools/obra/storageUpload.ts`** — `scope` ampliado a `'libro'|'carpeta'|'formularios'`
  (las `storage.rules` ya cubren `obra/**`; sin reglas nuevas).
- **`src/core/registry.ts`** — `solicitud-permiso` → lazy `FormulariosDOMView`.
- **`src/core/catalog.ts`** — `solicitud-permiso` `soon`→`active` + desc.
- **`package.json`** — nueva dependencia **`pdf-lib ^1.17.1`** (única lib nueva; carga lazy).

### Incidencia §8 (mount) — manejada
El montaje sirvió vistas stale/truncadas de los archivos editados (bash/tsc veían cola cortada;
las file-tools/Windows estaban íntegras). La verificación se hizo reconstruyendo el contenido
autoritativo en dir nativo del sandbox (`/tmp`).

### Verificado
`tsc --noEmit` → **0 errores**. `vite build` (outDir temporal) → **exit 0**, con chunk
**`FormulariosDOMView`** (~39.6 kB) y **pdf-lib en chunk lazy aparte** (no entra al bundle base).
Pendiente de prueba E2E en vivo (prefill real, descarga, subida a Storage) tras `git push`.

### Pendientes
- [x] Activar/cablear "Formulario de Solicitud de Permiso" (F 2-1.1) en Expediente DOM.
- [ ] **Publicar**: `git push` (Cloudflare reconstruye) — requerirá `npm install` para `pdf-lib`.
- [ ] Curaduría fina del field-map 2-1.1: completar `bind` (hoy 15/262), agrupar radios SÍ/NO,
  `transform` (uppercase/fechas), verificar visualmente que cada input cae en su casilla.
- [ ] Verificar E2E subida a Storage (`obra/formularios/`) contra el bucket.

---

## 2026-06-23 17:56 (Chile) — Fix logo header: re-vectorización del alfa por luminancia (contraste roto en barra clara)

### Síntoma reportado (Andrés, con capturas)
El logo del perímetro se veía como **líneas finas** y "lo que debería ser contraste quedó transparente", sobre todo al invertirse en barra clara (tema matrix). La última captura mostraba el ícono reducido a contornos.

### Causa raíz
`public/Basepro-N-t.png` se había generado del **JPG chico de 548 px** (`Basepro N.jpg`) mediante *flood-fill* desde el borde: (a) baja resolución → trazo fino; (b) el flood-fill solo vacía el blanco **exterior** y deja líneas internas como blanco opaco, de modo que al aplicar `filter:invert(1)` en matrix el documento perdía cuerpo y quedaba como contorno débil.

### Fix (re-vectorización del canal alfa — sin tocar código)
- Alfa generado por **luminancia global** (no flood-fill) desde el máster de alta resolución **`Basepro B.png` (1481×1536, trazo negro sólido)**: trazo (lum≤100) → opaco; fondo (lum≥175) → transparente; rampa lineal intermedia (anti-alias). Resultado two-tone limpio: TODO el blanco (exterior e interior) queda transparente, TODO el trazo queda sólido. Downscale LANCZOS a 760 px.
- Regenerados **`public/Basepro-N-t.png`** (tinta blanca, 61 KB — el que usa producción) y **`public/Basepro-B-t.png`** (tinta oscura limpia, 74 KB — pareja consistente, hoy no referenciada).
- **Cero cambios de código:** `ShellTop.tsx` sigue usando `src="/Basepro-N-t.png"` + `.ab-logo-invert{filter:invert(1)}` en matrix. Solo se reemplazó el asset (edición quirúrgica §8).

### Verificado
Composición sobre barra oscura (#2a2a2a, tinta blanca) y barra clara (#e5e5e5, invertida a negro): ambos renders muestran ícono **sólido y a pleno trazo** (borde de documento grueso, caras del cubo y check macizos). Bug de "contraste transparente" resuelto en los 4 temas.

### Pendiente cerrado
- [x] Revisar en vivo el contraste del logo en los 4 temas — **resuelto a nivel de asset** (queda confirmar en vivo tras `git push`).

### Pendiente que sigue abierto
- [ ] Verificar E2E la subida real de adjuntos contra el bucket (no testeable desde sandbox).
- [ ] **Publicar**: `git push` para que Cloudflare reconstruya y se vea el logo corregido.

---

## 2026-06-23 17:10 (Chile) — Deploy backend a Firebase: reglas Storage + Firestore (HECHO)

### Acción (HITL Andrés, desde `Web/`)
- `firebase use prod` → alias `prod` = **archibots-497423**.
- `firebase deploy --only storage` → `storage.rules` compiló OK; **released** a `firebase.storage`. (API `firebasestorage.googleapis.com` habilitada.)
- `firebase deploy --only firestore:rules` → `firestore.rules` y `firestore.coordenadasnormativas.rules` compilaron OK; **released** a `cloud.firestore`.
- Ambos "Deploy complete". Las reglas ya estaban al día en el servidor (skipping upload), pero quedaron **released/confirmadas**.

### Pendientes cerrados
- [x] Deploy backend: `firebase deploy --only storage` + `--only firestore:rules`. ✅ (cubre adjuntos de Obra Digital en Storage + reglas zero-trust Firestore).

### Pendiente que sigue abierto
- [ ] Revisar en vivo el contraste del logo en los 4 temas (cad/washi/matrix/white).
- [ ] Verificar E2E la subida real de adjuntos contra el bucket (no testeable desde sandbox).

---

## 2026-06-23 16:40 (Chile) — UX: Carpeta Digital (2/3-1/3 + ver/agregar) · Libro de Obras (índice colapsable por mes + columna folios) · header BASEPRO + logo

### Contexto
Tres cambios de UI pedidos por Andrés sobre producción. Edición quirúrgica; sin tocar persistencia ni reglas.

### Carpeta Digital (`src/tools/CarpetaDigitalView.tsx`)
- Layout a **2/3 (árbol) + 1/3 (panel)** con clase nueva `.tool-split-21` (no se tocó `.ab-split`, que es compartido y apilado a propósito).
- El **contador de documentos** de cada carpeta del árbol ahora es **link** cuando es ≥1: al pincharlo el panel 1/3 cambia de **AGREGAR DOCUMENTO** a **MOSTRAR DOCUMENTO** (lista con nombre + Abrir). Estado nuevo `panelModo: 'agregar'|'mostrar'`; botón “+ Agregar documento” para volver y “📄 Mostrar documentos (N)”.

### Libro de Obras (`src/tools/LibroObrasDigitalView.tsx`)
- Índice de sub-libros ahora **colapsable y agrupado por meses** (▸/▾, `mesLabel`). Estado `abiertoLibros` + `mesSel`.
- Layout `.tool-split-21`: **2/3 índice + 1/3 columna de FOLIOS** (con `maxHeight:460 + scroll`). La columna **filtra** según selección: sub-libro completo → todos sus folios; mes → solo ese mes. El editor (apertura / nueva entrada) bajó a **ancho completo** debajo; el listado de folios se sacó del editor.

### Header / marca (`src/components/ShellTop.tsx` + `src/archibots.css`)
- Ambos slogans (“Gestión Documental…” y “La infraestructura digital… Proyecta. Cumple. Construye.”) van **arriba a la izquierda** (`.ab-top-tagline` + `.ab-top-slogan`). BASEPRO queda **grande y abajo** con logo a la derecha; tamaño +30% (2.7→3.5rem; móvil 2→2.6rem).
- Logo del perímetro: se usa una **sola** imagen de contornos `/Basepro-N-t.png`; en barra clara (matrix) se aplica `.ab-logo-invert{filter:invert(1)}` para que el **borde contraste en ambos temas** (antes `Basepro-B-t.png` tenía perímetro blanco invisible sobre fondo claro). Imagen central `/Logo-Archibots.png` intacta.

### Incidencia §8 (mount) — resuelta
El montaje truncó la cola de los 4 archivos editados (ShellTop, archibots.css, las 2 vistas) en el `Edit` (read/write-lag). Reparado en el montaje: `head -n N` + reanexo de la cola exacta por heredoc (ShellTop reescrito completo). Los archivos en Windows/tracked estaban correctos; se homogeneizó el montaje antes de compilar.

### Verificado
`tsc -b` → **0 errores**. `vite build` (outDir temporal) → **exit 0**, con chunks `CarpetaDigitalView` y `LibroObrasDigitalView` regenerados.

### Pendientes
- [ ] **Publicar**: `git push` (Cloudflare Pages reconstruye solo) para que los usuarios vean los 3 cambios.
- [ ] (Sigue abierto) Deploy backend: `firebase deploy --only storage` + `--only firestore:rules`.
- [ ] Revisar en vivo el contraste del logo en los 4 temas (cad/washi/matrix/white).

---

## 2026-06-23 15:30 (Chile) — Frontend en Cloudflare Pages CONECTADO a GitHub (auto-build); docs corregidas

### Contexto
Verificado en el dashboard de Cloudflare (HITL con capturas): el proyecto `projectbook` **ya está conectado al repo `goyogramadors/projectbook`** (rama `main`, *Automatic deployments: Enabled*) — NO era un Direct Upload irreversible como se supuso en la entrada de las 14:40. Dominios activos: **`archibots.cl`** + `projectbook-8qt.pages.dev`. El problema real era la **Build configuration vacía** (sin Build command / output / root).

### Acciones (HITL Andrés en el dashboard)
- Build configuration seteada: **Root directory** `Web`, **Build command** `npm run build`, **Output** `dist`.
- Cargadas las **7 variables `VITE_*`** (Production, Plaintext) desde `Web/.env.local`.
- Lock fantasma `.git/index.lock` (del 22-jun) eliminado en Windows; `git push` exitoso (`4aef65f..10e5f00`) → dispara build nuevo que ya usa la config.

### Cambios (archivos tocados)
- **`DESARROLLO/GUIA_GITHUB_Y_DEPLOY.md`** — PARTE 4 reescrita: flujo vigente = GitHub-sync (publicar = `git push`); build config + vars documentadas; Direct Upload degradado a histórico/emergencia; Firebase Hosting marcado sin uso. Resumen, tabla de problemas e intro corregidos.
- **`Iniciar Aquí.md`** — §4 frontend reescrito: Cloudflare Pages conectado a GitHub, publicar = `git push`; eliminada la sección de "migración pendiente" (ya no aplica).

### Nota
La entrada de las 14:40 (que hablaba de "migrar Direct Upload → GitHub") quedó **superada**: el proyecto ya estaba en Git; solo faltaba configurar el build. No se borra por regla de bitácora.

### Pendientes
- [ ] Confirmar que el deploy del commit `10e5f00` quede en **Success** y el sitio (`archibots.cl`) muestre Térmico acreditando + adjuntos de Obra Digital.
- [ ] (Sigue abierto) Deploy backend: `firebase deploy --only storage` + `--only firestore:rules` desde `Web/`.

---

## 2026-06-23 14:40 (Chile) — Corrección de doc: despliegue del frontend = Cloudflare Pages (no Firebase Hosting)

### Contexto
Se detectó que `Iniciar Aquí.md` §4 documentaba el frontend en Firebase Hosting, lo que no coincide con la realidad: el sitio que ven los usuarios se sirve desde **Cloudflare Pages** (proyecto `projectbook`). Un `firebase deploy --only hosting` sube a `archibots-497423.web.app` (Firebase Hosting), que está **sin uso**, y no actualiza el sitio real.

### Evidencia en el repo
- `Web/public/_redirects` con `/*  /index.html  200` → convención SPA de Cloudflare Pages.
- **No** hay `wrangler.toml` ni `.github/workflows`. Los `.bat` y `/Basepro Terminar` son 100% git. Remoto: `github.com/goyogramadors/projectbook`.
- HITL (Andrés): hoy publica **manualmente** (arrastra `dist/` al dashboard = proyecto Direct Upload). Quiere migrar a **sync desde GitHub**.

### Hallazgo clave (Cloudflare)
Un proyecto **Direct Upload no se puede convertir** a Git-connected. Para auto-build con `git push` hay que **crear un proyecto Pages nuevo conectado al repo** y mover el dominio.

### Cambios (archivos tocados)
- **`Iniciar Aquí.md`** — §4 reescrita: frontend → Cloudflare Pages (estado actual manual + pasos de migración a GitHub: root `Web`, build `npm run build`, output `dist`, copiar `VITE_*`); Firebase Hosting marcado como secundario/sin uso; nuevo "modelo mental" frontend↔Cloudflare / backend↔Firebase. Fecha de encabezado → 2026-06-23.

### Pendientes (para Andrés)
- [ ] **Migrar Cloudflare Pages a Git:** crear proyecto nuevo conectado a `goyogramadors/projectbook` (root `Web`, build `npm run build`, output `dist`, env `VITE_*`), verificar, mover dominio, eliminar el proyecto Direct Upload viejo.
- [ ] **Mientras tanto, publicar frontend manual:** `npm run build` (desde `Web\`) + arrastrar `dist/` al dashboard `projectbook` — necesario para que los usuarios vean Térmico acredita + adjuntos de Obra Digital.
- [ ] (Sigue abierto del corte anterior) Deploy backend: `firebase deploy --only storage` + `--only firestore:rules`.

---

## 2026-06-23 12:15 (Chile) — Pendientes cerrados: Térmico acredita (Tablas oficiales + Web Worker) · Obra Digital doc-por-folio + adjuntos UUID en Storage

### Contexto
Cierre de los dos pendientes anotados el 2026-06-23 09:28: (1) Térmico — motor real + Tablas oficiales para acreditar; (2) Obra Digital — doc-por-folio + adjuntos UUID (Storage Premium) + counters Año→Mes. Decisiones HITL (Andrés): Térmico **sí acredita** techo/muro/piso/puerta; Obra Digital **Opción A** (subida real a Storage con reglas nuevas).

### Térmico — acreditación real (CUMPLE/NO CUMPLE)
- **`src/tools/termico/tablas.ts`** (nuevo) — Fuente de verdad RT (Art. 4.1.10 OGUC, **DS N°15 MINVU**, D.O. 27-05-2024, vigente **28-11-2025**): Tabla 1 U máx residencial A–I (techo/muro/piso/puerta), R100 sobrecimientos, clase de permeabilidad, % ventanas por orientación (VENTANA_PCT_MAX), materiales λ/ρ/μ, Rs por elemento, comuna→zona NCh1079:2019. Celdas combinadas del cuadro oficial **desambiguadas por monotonía climática A→I** (sin inventar cifras). Fuente: PDFs DITEC/MINVU.
- **`src/tools/termico/engine.ts`** (nuevo) — motor puro: Rt=Rs+Σe/λ, U=1/Rt; ponderación Campo+Puente; R100; veredictos vs zona; `evaluar()` agrega `acredita = zona ∧ techo+muro+piso CUMPLEN`.
- **`src/workers/termico.worker.ts`** (nuevo) — Web Worker que ejecuta el engine (patrón geo.worker).
- **`src/tools/InformesTermicosView.tsx`** — reescrita: usa el worker (seed síncrono del engine), badges **CUMPLE/NO CUMPLE/Pendiente/No aplica**, pasos 3.2 (sobrecimiento R100) y 4 (puerta U) con inputs reales, botón **Generar Informe Activo** habilitado solo si la envolvente opaca acredita. Estado del expediente ahora **Completado** si acredita. Persiste `sobrecim`+`puertaU`. Condensación: verificación externa (planilla MINVU Res. Ex. 1802), no bloquea el veredicto opaco.

### Obra Digital — doc-por-folio + Storage UUID + counters Año→Mes (Opción A)
- **`storage.rules`** (nuevo) + **`firebase.json`** (bloque `storage`) — zero-trust: `projects/{pid}/obra/{libro|carpeta}/{uuid}`, lectura miembro / escritura editor activo (firestore.get sobre projects/{pid}), tope 25 MB. **Requiere deploy**.
- **`src/tools/obra/storageUpload.ts`** (nuevo) — `subirAdjunto`/`borrarAdjunto` (uploadBytes + getDownloadURL, nombre UUID, tope 25 MB).
- **`src/tools/obra/libroStore.ts`** (nuevo) — META `libroObras/state` {libros,perms,counters} + FOLIOS `.../state/folios/{id}`. Counters **Año→Mes** (AAAA-MM-NNN). Paginación con cursor. **Migración one-time** del MVP.
- **`src/tools/obra/carpetaStore.ts`** (nuevo) — análogo: META + ARCHIVOS `.../state/archivos/{id}` con adjunto opcional + migración.
- **`LibroObrasDigitalView.tsx`** / **`CarpetaDigitalView.tsx`** — integran los stores: escritura granular por folio/archivo, hidratación + paginación ("Cargar más"), subida real a Storage (Free degrada a metadato local), enlaces a binarios, normalización de adjuntos legados. `setToolState` intacto.
- **`src/core/types.ts`** — nuevos contratos: `ObraAdjunto`; `LibroFolio.adjuntos: ObraAdjunto[]`; `CarpetaArchivo.adjunto?`; `TermicoSobrecimiento`; `InformeTermico.sobrecim?`/`puertaU?`.

### Incidencia §8 (mount) — resuelta
Read-lag del montaje (cola truncada) en types.ts + las 3 vistas, con Windows correcto. Reparado por splice en el montaje (`head` + reañado de cola exacta vía heredoc); una línea del Térmico reinsertada con awk. `tsc` final sobre copia consistente.

### Verificado
`tsc -b` → **0 errores**. `vite build` (outDir temporal; dist/ del disco da EPERM al desempaquetar PDFs — entorno) → **exit 0**, con chunks `InformesTermicosView`, `LibroObrasDigitalView`, `CarpetaDigitalView` y **`termico.worker`**.

### Pendientes (para Andrés)
- [ ] **Deploy**: `firebase deploy --only storage` (reglas nuevas) + `--only firestore:rules` + `--only hosting` desde `Web/`.
- [ ] **Verificar en vivo** la subida de adjuntos (uploadBytes E2E) contra el bucket — no testeable desde el sandbox.
- [ ] **Confirmar Tabla 1** (U máx A–I) en `termico/tablas.ts`: celdas combinadas desambiguadas por monotonía; revisar contra planilla oficial MINVU antes de producción. Corrección = un solo archivo.
- [ ] Térmico: ventanas (% por orientación) e infiltraciones requieren inputs de geometría para veredicto numérico (datos ya cargados en tablas.ts).

---

## 2026-06-23 09:28 (Chile) — Tarea Especial: integración productiva de las 5 herramientas nuevas + rebrand BASEPRO en docs

### Contexto
Los 5 mockups (Subsuelo, Ruta Accesible, Térmico, Libro de Obras, Carpeta Digital) ya estaban cableados (registry+catalog, `estado:'active'`) pero **solo con `useState` en memoria**. Esta sesión hace el **desarrollo real**: persistencia, tipos centralizados, reutilización de datos comunes y avance del expediente. Maquetas aprobadas (HITL).

### Decisiones HITL (Andrés, 2026-06-23)
- **Persistencia:** Subsuelo, Ruta Accesible y Térmico → hook existente `useToolData` (`toolData/{toolId}`, ya cubierto por la regla glob `toolData/{document=**}` → **cero reglas/índices nuevos**). Libro de Obras y Carpeta Digital → **subcolecciones propias** `projects/{pid}/libroObras/state` y `projects/{pid}/carpetaDigital/state` (reglas zero-trust nuevas).
- **Alcance:** las 5 en esta sesión.

### Análisis de reutilización de datos (previo, prioridad de Andrés)
- `ProjectMaster` (nombre/comuna/dirección/propietario) vía `useProjects().getProject` → membrete/siembra en las 5 (sin re-captura). Térmico siembra `comuna`→zona.
- `setToolState(pid, toolId, {estado,fecha})` (ya existente en `ProjectProvider`) → cada tool actualiza `ProjectMaster.toolStates` al guardar (avance S7).
- **Contraposición a Tintero §E.1** (que pedía subcolección por tool para todas): se descartó para los 3 generadores porque `useToolData` + regla glob ya resuelve con menor superficie de cambio y zero-trust intacto.

### Cambios (archivos tocados)
- **`src/core/types.ts`** — añadidos contratos de dominio centralizados: `InformeSubsuelo`/`Horizonte`; `MemoriaRutaAccesible`/`RutaEstado3`; `InformeTermico`/`TermicoComplejo`/`TermicoCapa`/`TermicoElemento`; `LibroObrasState`/`LibroFolio`/`LibroObra`/`LibroNivel`/`LibroFormatoId`/`LibroEstadoFolio`; `CarpetaDigitalState`/`CarpetaArchivo`.
- **`src/tools/InformeSubsueloView.tsx`** · **`RutaAccesibleView.tsx`** · **`InformesTermicosView.tsx`** — patrón *bridge* (se conservan los `useState` y call-sites): `useToolData` + hidratación única (`hidratadoRef`) + `guardar()` (botón [GUARDAR]) + `setToolState`. Quitado badge `MOCKUP`. Térmico: estado SIEMPRE "En proceso" (no acredita hasta Tablas oficiales; badges "Pendiente" intactos).
- **`src/tools/LibroObrasDigitalView.tsx`** · **`CarpetaDigitalView.tsx`** — persistencia inline a subcolección propia (`getDoc`/`setDoc` con `serverTimestamp`), `repo.kind` decide nube/local, fallback `localStorage ab-<id>-{pid}`, `JSON.parse(JSON.stringify())` para descartar `undefined` (Firestore). Botón Guardar en cabecera. `setToolState`. Quitado `MOCKUP`.
- **`firestore.rules`** — añadidas reglas zero-trust `match /libroObras/{document=**}` y `match /carpetaDigital/{document=**}` (read: miembro · write: dueño/editor activo). Reglas de `coordenadasnormativas` y existentes intactas (§4).
- **`DESARROLLO/MAPA_ARQUITECTURA_PROYECTO.md`** — árbol `tools/` con las 5 nuevas + `carpetaDigitalData.ts`; fila `firestore.rules` y flujo de persistencia ampliados; nuevo flujo "Reutilización de datos comunes".
- **`Iniciar Aquí.md`** — §1 rebrand web → **BASEPRO** (repo sigue Archibots/Project_Book); §6 reescrita: las 5 ya INTEGRADAS con tabla toolId/archivo/tier/persistencia.

### Incidencia §8 (mount) — resuelta
El mount truncó la cola de los 5 `.tsx` durante el `Edit` (read-lag) y dejó bytes NUL en 2. Reparado por script en el mount: `head -n -1` + reañadir cola por heredoc, dedupe de la línea de empalme (Subsuelo/Carpeta) y `tr -d '\000'`. 

### Verificado
`tsc -b` → **0 errores**. `vite build` (outDir temporal del sandbox, porque el `dist/` del disco da EPERM al desempaquetar PDFs — problema de entorno, no de código) → **exit 0**, con los 5 chunks generados (`InformeSubsueloView`, `RutaAccesibleView`, `InformesTermicosView`, `LibroObrasDigitalView`, `CarpetaDigitalView`).

### Pendientes (futuro)
- [ ] Deploy: `firebase deploy --only firestore:rules` (nuevas reglas libroObras/carpetaDigital) y `--only hosting` desde `Web/`.
- [ ] Obra Digital: migrar de doc único `state` a documento-por-folio/archivo con cursores + adjuntos UUID (Storage Premium) + counters Año→Mes.
- [ ] Térmico: motor real en Web Worker + cargar Tablas oficiales (U máx/Rt mín, materiales λ/ρ/μ) para acreditar (quitar "Pendiente").
- [ ] Ruta Accesible: prefill opcional de carga/superficie desde `carga-ocupacion` (hoy reusa solo master).

---

## 2026-06-22 18:45 (Chile) — Header: logos transparentes + ajuste vertical

### Cambios
- **Logos Basepro con fondo transparente.** No hay vectorizador en el entorno (potrace/inkscape ausentes), así que se generaron PNG transparentes en alta resolución recortando el fondo por flood-fill + borde suavizado (Gaussian 0.8): `public/Basepro-B-t.png` (fondo blanco→transparente, ícono oscuro) y `public/Basepro-N-t.png` (fondo negro→transparente, ícono claro). `ShellTop` apunta a estos (alternancia por tema intacta). Ya no muestran caja blanca/negra → se funden con la barra y son responsivos.
- **Tagline más pegado arriba**: `.ab-topbar` padding-top 3→0; `.ab-top-tagline` line-height 1, margen 2/4.
- **BASEPRO más abajo / eslogan al pie**: `.ab-brand` align-items center→stretch; `.ab-brand-text` con `justify-content:flex-end` + `padding-bottom:6px` (el bloque de texto baja).

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (ambos PNG transparentes en dist).

### Nota
"Vectorizar" estricto (a SVG) no es posible aquí sin potrace/inkscape; la solución equivalente fue PNG de alta resolución con alfa real. Si se requiere SVG, hacerlo en una herramienta externa y reemplazar el archivo.

---

## 2026-06-22 18:25 (Chile) — Header: reordenado + logo Basepro alterna por tema

### Síntoma
El header quedó desordenado: los dos eslóganes en la fila de la marca se topaban con título/logos.

### Cambios (`components/ShellTop.tsx` + `archibots.css`)
- **Slogan "Gestión Documental - …" movido arriba a la IZQUIERDA**: ahora es un `.ab-top-tagline` (fila propia full-width, `order:-1`) dentro de `.ab-topbar`, no choca con la marca.
- La marca (derecha) queda con **BASEPRO** + un solo eslogan ("La infraestructura digital de tu proyecto. Proyecta. Cumple. Construye.") + logo Basepro + logo Archibots.
- **Logo Basepro alterna por color de barra**: `barIsDark = theme !== 'matrix'` → barra oscura (cad/washi/white) usa **`Basepro N.jpg`** (versión clara); barra clara (matrix) usa **`Basepro B.png`** (versión oscura). *Si la asignación N/B quedó invertida, es un swap de una línea en `baseproLogo`.*
- Se retiró el `.ab-brand-sub-row` de dos columnas (causaba el desorden); vuelve a `.ab-brand-sub` simple.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (ambos logos `Basepro N.jpg` y `Basepro B.png` copiados a dist).

---

## 2026-06-22 18:05 (Chile) — Header rebrand: BASEPRO + logo nuevo

### Cambios (`components/ShellTop.tsx`)
- Título de la página: **Project_Book → BASEPRO** ("PRO" en rojo `--destructive`, clase `.pro`).
- **Logo nuevo** `public/Basepro B.png` (`/Basepro%20B.png`) agregado junto al título; **el logo Archibots se mantiene** y queda a la derecha del nuevo.
- **Eslóganes en una fila, a cada lado** (`.ab-brand-sub-row`, space-between): izquierda "La infraestructura digital de tu proyecto. **Proyecta. Cumple. Construye.**"; derecha "Gestión Documental - **Expedientes técnicos** - Arquitectura - Permisos".

### CSS (`archibots.css`)
- `.ab-brand-title .pro` (rojo), `.ab-brand-text` (columna), `.ab-brand-sub-row` (dos eslóganes), `.ab-brand-logo-new` (120px / 72px en móvil).

### Incidencia §8 (otra vez)
El mount truncó el Edit de `ShellTop.tsx` a 110 líneas (JSX roto) → `tsc` rompía. Reconstruido el bloque final por script en el mount; `tsc -b` 0 errores.

### Nota de entorno
Un `vite build` falló por **ENOSPC** (el `/tmp` del sandbox se llenó con builds previos). Tras limpiar `/tmp`, build **exit 0** (CSS y el logo nuevo copiados a dist). No es problema de código.

---

## 2026-06-22 17:40 (Chile) — Fix tema CAD: botones primarios no se pintaban

### Síntoma
En tema CAD los botones se veían sin relleno (solo contorno) en el BIM wizard (chips seleccionados indistinguibles) y en el Catálogo de Herramientas (se perdía el verde "EN PROYECTO" y la jerarquía primario/secundario).

### Causa
Las reglas `:root[data-theme="cad"] .ab-btn` y `.technical-btn` forzaban `background:transparent !important` a **todos** los botones (estilo "comando"), borrando la distinción primario/secundario/añadido.

### Fix (`archibots.css`)
- **Primarios pintados** en CAD: `.ab-btn` y `.technical-btn` (sin modificador) → relleno `var(--foreground)`, texto `var(--background)`; hover a `--destructive`.
- **Secundarios en contorno**: `.ab-btn.sec`, `.ab-btn.add:not(.added)`, `.technical-btn.secondary`, `.btn-tech-gray` → transparentes con inversión en hover.
- **Estado "EN PROYECTO"**: `.ab-btn.add.added` → verde `--success`.
- Se conservan los pseudo-corchetes `[ ]` del catálogo.
- *Resultado:* en el wizard el chip seleccionado vuelve a verse pintado; en el catálogo se recupera la jerarquía y el verde. `vite build` OK.

---

## 2026-06-22 17:20 (Chile) — Columnas redimensionables (Overleaf) + editor admin de Top Tools + diagnóstico BIM

### 1. Columnas redimensionables/colapsables (Workspace)
- `views/WorkspaceView.tsx` reescrito: las 3 columnas (área dinámica · catálogo · carpeta) tienen **separadores móviles** arrastrables y **colapso** de catálogo/carpeta. Estado (anchos + abierto/cerrado) persiste **solo por sesión** en `sessionStorage` (`ab-cols`); por defecto abren como estaban.
- Implementación: en pantallas >1040px se inyecta `grid-template-columns` inline (`1fr 10px cat 10px bind`) con gutters como columnas; ≤1040px manda el CSS responsive existente (sin gutters). Drag vía pointer events (clamp 180–760px).
- `archibots.css`: clases `.ab-gutter`, `.ab-gutter-toggle`, `.ab-gutter-grip`.

### 2. Editor admin de Top Tools
- `core/AdminService.ts`: `getTopTools()` / `setTopTools(ids)` sobre `config/topTools` (la barra ya lo leía).
- `views/AdminDashboard.tsx`: sección "TOP TOOLS" — chips de las ancladas + checklist de tools activas + [GUARDAR]. (Requiere regla Firestore de escritura admin en `config/topTools`; si no existe, el guardado degrada con aviso.)

### 3. Asistente de Usos BIM — CONTENIDO RECUPERADO
- El componente productivo era un **esqueleto** de 7 pasos sin contenido. El usuario (Premium) pidió recuperar el wizard real desde `DESARROLLO/Mockup/mockup-archibots/src/tools/BimWizardView.tsx`.
- `tools/BimWizardView.tsx` reconstruido con el **wizard completo de 6 pasos** (Planbim/CORFO): (0) intro, (1) perfil actor/rol/escala, (2) ciclo de vida con fases activas/críticas, (3) procesos clave, (4) taxonomía + factibilidad puntuada de 7 Usos BIM, (5) análisis técnico-económico (LOD/LOIN, ROI, CAPEX/OPEX), (6) hoja de ruta + tabla priorizada + exportar PDF.
- **Adaptado al stack productivo** (no se copió el patrón del Mockup deprecado): firma `ToolProps`, guarda premium `access==='locked'`, `import type`, tipos estrictos (sin `any`; índices con `?? ''`), `window.print()` real en exportar. Datos paramétricos (factibilidad estimada); IA (apiProxy) queda para iteración futura.
- *Archivos:* `Web/src/tools/BimWizardView.tsx`.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (chunks Workspace/AdminDashboard/BimWizard).

### 🔧 Pendiente
- [ ] Confirmar regla Firestore: escritura admin en `config/topTools` (si falta, el editor no persiste).
- [ ] Decidir gating del Asistente BIM (premium + ascenso vs free).

---

## 2026-06-22 16:52 (Chile) — Pasada de optimización visual por todas las herramientas

### Auditoría
Revisadas las 25 tools por patrones: grids con `minmax` que colapsan a 1 columna, columnas desbalanceadas, filas apilables e inputs numéricos sin alinear.

### Cambios aplicados
1. **Números a la derecha — regla GLOBAL ampliada** (`Web/src/archibots.css`): de `.tech-input[type=number]` a `.tech-input[type="number"], .tool-panel input[type="number"], .panel-content input[type="number"]`. Ahora cubre también inputs numéricos crudos (sin clase) de cualquier herramienta.
2. **Dimensionador de Edificios Públicos** (`DimensionadorPublicosView.tsx`): la grilla de "1. Estamentos y Dotación" colapsaba a 1 columna (`minmax(260px)` en un panel de ~460px). Bajado a `minmax(190px)` con `gap '6px 14px'` e input 80→68px → ahora entran 2 columnas, menos alto desperdiciado.

### Sin cambios (ya correctos / intencional)
Resto de grids usan `minmax` 160–220 (se acomodan bien) o 280 en tarjetas de contenido que requieren ese ancho (Expediente Normativo, Calculadora Arquitectónica, Listado de Documentos). Inputs numéricos de CuadroSuperficies/Honorarios/Dimensionador ya tenían `textAlign:'right'` inline.

### Incidencia §8 (recurrente)
Tras un `Edit` puntual en `DimensionadorPublicosView.tsx`, el mount perdió las 2 líneas de cierre (`);`/`}`) → `tsc` rompía. Reañadidas en el mount; build verde.

### Verificado
`tsc -b` 0 errores · `vite build` exit 0 (chunk DimensionadorPublicos regenerado).

---

## 2026-06-22 16:34 (Chile) — UI: números a la derecha (global) + Dimensionador fila única por recinto

### Cambios
1. **Números justificados a la derecha (todas las herramientas).** Regla global en `Web/src/archibots.css`: `.tech-input[type="number"]{ text-align:right; }`. Cubre Datos del Proyecto (Superficie Terreno Legal, a Edificar), Ubicación y demás. Los inputs numéricos especiales (CuadroSuperficies, CalculadoraHonorarios, Dimensionador) ya tenían `textAlign:'right'` inline → sin cambios.
2. **Dimensionador de Proyecto — catálogo en una sola fila por recinto.** `Web/src/tools/DimensionadorView.tsx`: cada recinto pasó de 2 líneas apiladas a **una fila** (nombre · SUP · contador · m² · [AGREGAR]). Anchos de columna rebalanceados: catálogo `flex 1 1 280px → 2 1 380px` (más ancho); recinto manual `1 1 280px → 1 1 210px` (más angosto).

### Verificado
`tsc -b` 0 errores · `vite build` OK (exit 0, 2232 módulos). *Nota:* un `vite build` intermedio falló por colisión del `--outDir` temporal reusado (transitorio del entorno); con outDir limpio compila verde.

### Criterio aplicado (para próximas tools)
Buscar columnas desbalanceadas que fuercen wrap innecesario y filas que puedan colapsarse a una sola línea; alinear números a la derecha. La regla CSS global ya cubre lo numérico en bloque.

---

## 2026-06-22 16:18 (Chile) — UI global: compactado de botones, campos e interlineados en el Área de Trabajo

### Qué se hizo
El usuario reportó que las herramientas del Área Dinámica de Trabajo se ven demasiado grandes; referencia de tamaño: la Carpeta de Proyecto (~10–13px). Como todas las tools comparten las mismas clases, se ajustó **una sola vez** en `Web/src/archibots.css` (no se tocó ningún componente) → aplica a TODAS las herramientas a la vez.

### Clases compactadas (`archibots.css`)
- `.technical-btn`: padding 8/16→5/11, font .82→.72rem.
- `.module-header`: min-height 48→34, font .82→.74rem, padding 0 15→0 12.
- `.panel-content`: padding 20→13.
- `.tech-input,.tech-select`: padding 10/12→6/9, font .88→.78rem.
- `.tech-input-group`: margin-bottom 15→9; `label` .72→.66rem, mb 5→3.
- `.tech-quote`: font .82→.74rem, mb 20→12.
- `.tech-table th/td`: padding 10/12→6/9. `.counter-box`: alto 32→28.

### Verificado
`vite build` OK (2232 módulos, CSS compila). No se modificaron las clases de la Carpeta/Binder (`.ab-binder-head`, `.ab-catalog-head` 13px) que son la referencia.

---

## 2026-06-22 16:05 (Chile) — Refactor Ubicación: Mapa integrado, split calle/número, superficies sincronizadas + ajustes Geolocalizador

### Resumen
5 refactorizaciones pedidas. Sync **al guardar** (patrón repo.save + reload). `tsc -b` 0 errores y `vite build` OK (2232 módulos; chunks Ubicacion/Geolocalizador, sin chunk Mapa de Terreno).

### Cambios
1. **Superficie Terreno Legal compartida** (Datos del Proyecto ↔ Ubicación): ambos leen/escriben `ProjectMaster.superficieTerrenoLegal`. Editar en cualquiera y guardar actualiza el otro al recargar.
2. **Mapa de Terreno integrado en Ubicación** (deja de ser herramienta del catálogo): quitado de `catalog.ts` y `registry.ts`. La lógica de dibujo+área (Web Worker Turf) vive ahora dentro de `UbicacionView`, **debajo de LOCALIZACIÓN ADMINISTRATIVA**, con controles compactos (solo [LIMPIAR]) y mapa más grande. **ÁREA CALCULADA** pasa a ser un campo (solo lectura) al lado de Superficie Terreno Legal; se guarda en `superficieCalculada`. Polígono en **clave de disco compartida** `ab-mapa-terreno-${pid}` (editar en Mapa o Geolocalizador edita el mismo terreno; se relee al abrir).
3. **Geolocalizador — polígono con líneas negras** (antes rojo `#D32F2F` → `#111111`, igual que Mapa de Terreno).
4. **Geolocalizador — PARÁMETROS DE UBICACIÓN en una fila** (Comuna · Dirección); **eliminadas las coordenadas LAT/LNG** de la UI (el estado lat/lng sigue interno, alimentado por clic/marcador/geocoder); **mapa más bajo** (500→340 px) para acercar el EXPEDIENTE NORMATIVO. Carga/persiste el polígono compartido.
5. **Ubicación — calle y número separados** (se combinan en `direccion` al guardar; `splitDireccion` los separa al cargar). **Rol SII por defecto `000-00`** (cambiado en `ProjectRepository.makeDefaultProject`; placeholder `000-00`). *Nota:* proyectos ya creados con rol `Arquitecto` conservan ese valor hasta que el usuario lo edite (no se reescribe dato existente en silencio).

### Archivos
- `Web/src/core/catalog.ts`, `Web/src/core/registry.ts` (quitan `mapa-terreno`).
- `Web/src/core/db/ProjectRepository.ts` (rol default `000-00`).
- `Web/src/tools/UbicacionView.tsx` (reescritura: + mapa, split, superficies). *Reescritura autorizada por el alcance del pedido.*
- `Web/src/tools/GeolocalizadorView.tsx` (negro, 1 fila sin coords, mapa bajo, polígono compartido).
- `Web/src/tools/MapaTerrenoView.tsx`: **queda en disco pero sin registrar** (ya no se importa). *Acción opcional:* borrar el archivo si se desea limpieza total.

### 🔧 Pendientes
- [ ] (Heredado) Completar fichas faltantes de zonas especiales en `norma-data`.
- [ ] Opcional: borrar `Web/src/tools/MapaTerrenoView.tsx` y `public/geo-data/manifest.json` (artefactos sin uso).

---

## 2026-06-22 15:36 (Chile) — REVERTIDA la fusión de overlays + tolerancia de snap a zona base

### Síntoma reportado
Un terreno residencial (Ñuñoa, Armando Carrera/Celerino Pereira) se reportaba como **"Zona Área de restricción"** con PARÁMETROS ESTIMADOS (sin ficha). No debía marcarse como área de restricción. Confirmado: la normativa vive en `Web/public/norma-data` (8 comunas).

### Causa raíz
La fusión de overlays de la entrada 15:24 fue el enfoque equivocado: la capa `_AP` ("Área de restricción" = zona de protección de helipuerto) es una **restricción superpuesta de gran extensión**, NO una zona base. Al fusionarla y hacer point-in-polygon, ganaba el overlay. Además, el punto cae en un **hueco de topología** de la capa base (a ~2.5 m de la zona real **Z-4B**), por eso antes daba "fuera de zona" y tras la fusión daba "Área de restricción".

### Fix
- `core/GeoJsonService.ts`: **revertido a carga base-only** (sin manifest/merge). Las overlays no determinan la zona. Clave de caché `#base` para invalidar las cachés `#m` de la fusión.
- `core/useCerebroNormativo.ts`: añadida **tolerancia de snap** — si el punto no cae estrictamente en ningún polígono base, se asigna la zona base más cercana dentro de `TOL_METROS = 30` (vía `@turf/point-to-polygon-distance`). Resuelve los huecos de borde de calle sin recurrir a overlays.
- *Archivos:* `Web/src/core/GeoJsonService.ts`, `Web/src/core/useCerebroNormativo.ts`.

### Verificado
- `tsc -b` en **0 errores**.
- Punto de prueba `-33.437613,-70.577079`: ahora resuelve **Z-4B** (zona base, snap a 2.5 m) y **trae su ficha real** de `13_nunoa.json` (ya no "Área de restricción", ya no estimados).

### Notas / limpieza
- El `manifest.json` que generé en 15:24 quedó en `public/geo-data/` pero **ya no se usa** (no pude borrarlo por permisos del entorno; es inocuo). *Acción opcional:* borrarlo manualmente.
- La entrada 15:24 (fusión de overlays) queda **superada** por esta. La 15:16 (matcher de zona `matchZona`) sigue **vigente y correcta**.

### 🔧 Pendiente restante
- [ ] Completar fichas faltantes de zonas especiales en `norma-data` (las zonas sin parámetros que no son huecos: ICH/MH/ZT ya matchean; faltan `CD`, `UCH`, `UMCE`, `Z-US`, etc. donde no haya ficha). Solo aplica si un terreno cae realmente en una de esas zonas base.

---

## 2026-06-22 15:24 (Chile) — Cerebro Espacial: fusión de capas overlay del PRC (manifest) — ⚠️ SUPERADA por la entrada 15:36 (revertida)

### Qué se resolvió
Pendiente abierto en entradas 15:04 y 15:16: `loadComunaGeoJSON` cargaba **solo la capa base** `13_PRC_<Comuna>.json`. Los puntos que caen en overlays seccionales/patrimoniales (`_AP`, `_R`, `_Patrimonio_ICH/ZCH`, `_SECC_…`) daban "fuera de toda zona PRC". El punto de prueba `-33.437613,-70.577079` cae solo en `13_PRC_Nunoa_AP.json`.

### Implementación (sin adivinar nombres → evita 404)
- **Nuevo `Web/public/geo-data/manifest.json`** (294 comunas, todas las regiones): mapea `${region}_${ComunaToken}` → `[base, ...overlays]`. Generado programáticamente: base = archivo `<region>_PRC_<Token>.json`; overlays = archivos `<Token>_…`. Excluye como base los que ya son overlay de otro.
- **`Web/src/core/GeoJsonService.ts`**: nuevos `loadManifest()` + `archivosComuna()`; `loadComunaGeoJSON` ahora **fusiona las features** de todas las capas del manifest (fallback al base si no hay manifest o la comuna no está; overlay ausente no es fatal). Clave de caché versionada `#m` para invalidar cachés base-only previas en IndexedDB.

### Verificado
- `tsc -b` en **0 errores**.
- End-to-end con shapely: el punto de prueba ahora detecta zona **`Área de restricción`** (overlay `_AP`) en vez de "fuera de zona". Manifest resuelve overlays de Ñuñoa (`_AP`), Lo Barnechea (`_R`), Providencia (`_ICH`/`_ZCH`), Vitacura (`_R`).
- *Nota:* `Área de restricción` aún cae a "sin ficha" porque ese código **no existe en `13_nunoa.json`** → es el pendiente de cobertura de fichas (no de overlays).

### ⚠️ Incidencia de entorno (recurrente §8)
El mount **truncó** la escritura de `GeoJsonService.ts` a 90 líneas (las file-tools veían 135 OK, `tsc` corría contra la versión truncada). Workaround aplicado: reescritura completa por heredoc en el mount + `tsc`. Confirmado 135/136 líneas y build verde.

### 🔧 Pendiente restante
- [ ] **Completar fichas faltantes en `norma-data`** (zonas sin parámetros: `CD`, `UCH`, `UMCE`, `Z-US`, `PM y AP`, `ZR-1`, `Áreas verdes`, `Área de restricción` en Ñuñoa; revisar las otras 7 comunas). Es lo único que falta para que TODO punto devuelva ficha.
- [x] Fusión de overlays del PRC (este ítem) — **RESUELTO**.

---

## 2026-06-22 15:16 (Chile) — Fix Cerebro Normativo: fichas de zonas especiales/patrimoniales no matcheaban

### Síntoma reportado
Geolocalizador normativo: la ficha PRC no cargaba correctamente. Las zonas residenciales (Z-2, Z-4, Z-4C…) sí resolvían ficha; las patrimoniales/especiales no → "Zona X detectada, pero sin ficha local".

### Causa raíz (bug de código)
Convenciones de código divergentes entre las dos fuentes:
- **GeoJSON (`/geo-data`)**: `MH- 1`, `ZT-3`, `ZCH- 1`, `ICH-1` (sin prefijo, con espacio tras el guion).
- **Fichas (`/norma-data`)**: `Z-MH1`, `Z-ZT3`, `Z-ZCH1`, `Z-ICH1` (prefijo `Z-`).

El `normZona` de `NormativaService.ts` solo quitaba espacios y mayúsculas pero **conservaba el guion y no reconciliaba el prefijo `Z`**, así que `MH-1 ≠ Z-MH1`. Match exacto fallaba para toda zona especial.

### Fix (edición quirúrgica)
- `core/NormativaService.ts`:
  - `normZona` ahora colapsa **todos** los separadores (`[^a-zA-Z0-9]`): "MH- 1"→"MH1", "Z-4C+R"→"Z4CR".
  - Nuevo helper `matchZona(a,b)`: empareja exacto o tolerando el prefijo `Z` inicial (GeoJSON "ICH1" ↔ ficha "ZICH1").
  - `getNormativa` usa `matchZona` en vez de `===`.
- *Archivos:* `Web/src/core/NormativaService.ts`.
- **Verificado:** `tsc -b` en 0 errores. Las 8 comunas; en Ñuñoa las 31 zonas con ficha resuelven (incluidas MH-1..3, ZT-1..5, ZCH-1, ICH-1..4); **sin multi-match/ambigüedad**.

### Hallazgo secundario (cobertura — NO resuelto)
Quedan sin ficha en `13_nunoa.json` (dato faltante, no bug): `CD`, `UCH`, `UMCE`, `Z-US`, `PM y AP`, `ZR-1`, `Áreas verdes`, `Área de restricción`. Esta última (`_AP` overlay) es además la zona del punto de prueba `-33.437613,-70.577079` → ligado al pendiente de overlays (entrada 15:04).

### 🔧 Pendientes (sin cambios)
- [ ] Cargar/fusionar capas overlay del PRC (manifest comuna→[base+overlays]). Ver entrada 15:04.
- [ ] Completar fichas faltantes en `norma-data` (zonas especiales sin parámetros). Aplica a las 8 comunas.

---

## 2026-06-22 15:04 (Chile) — Fix Cerebro Espacial: capa PRC no cargaba para comunas de nombre compuesto

### Síntoma reportado
Geolocalizador: "ZONA PRC NO DETECTADA" / "El punto cae fuera de toda zona PRC de la comuna" al intersectar.

### Causa raíz (bug de código)
`GeoJsonService.normalizarComuna` **eliminaba los espacios** del nombre de comuna (`"Las Condes" → "LasCondes"`), pero los archivos GeoJSON usan **guion bajo entre palabras** (`13_PRC_Las_Condes.json`). Resultado: **404** al cargar la capa para TODA comuna de nombre compuesto (Las Condes, Lo Barnechea, La Florida, Estación Central, Pedro Aguirre Cerda, Cerro Navia, La Cisterna, La Granja, La Pintana, La Reina, Lo Espejo, etc.). Las comunas de una sola palabra (Ñuñoa, Providencia, Vitacura, Santiago, Peñalolén) no se veían afectadas.

### Fix
- `core/GeoJsonService.ts` → `normalizarComuna` reescrita: quita tildes, separa por palabras, **Title_Case por palabra unidas con `_`** (`"Las Condes" → "Las_Condes"`, `"Ñuñoa" → "Nunoa"`). Verificada la resolución de archivo para comunas simples y compuestas. `tsc -b` en 0 errores.
- *Archivos:* `Web/src/core/GeoJsonService.ts`.

### Hallazgo secundario (coverage — NO resuelto)
- El servicio carga **solo la capa base** `13_PRC_<Comuna>.json`. Hay **capas overlay/seccionales** por comuna (`_AP` área de protección, `_R`, `_ZNE`, `_ICH`, `_ZCH`…) que NO se cargan. El punto de prueba del usuario (`-33.437613, -70.577079`) cae **solo** en `13_PRC_Nunoa_AP.json` (zona "Área de restricción"), por eso da "fuera de zona" aunque la comuna sea correcta.

### 🔧 Pendiente generado
- [ ] **Cargar/fusionar capas overlay del PRC** (decisión pendiente con el usuario). Propuesta: manifest `geo-data/manifest.json` (comuna → [archivos base + overlays]) y que `loadComunaGeoJSON` fusione las features de todas las capas de la comuna. Evita 404 por adivinar nombres.

---

## 2026-06-22 14:56 (Chile) — Validación build + Glosario en Carpeta Digital + Libro de Obras completo (mockups)

### Resumen de la sesión
Trabajo sobre los mockups de las herramientas nuevas (Fase 0). Cuatro bloques: (1) validación de build de los 5 mockups, (2) aplicación del glosario MOP completo y numerado a la Carpeta Digital, (3) reescritura del Libro de Obras Digital con todo lo pedido, (4) botón Compartir y apertura permanente del tipo de contrato. Todo con `tsc -b` en **0 errores** y `vite build` generando los chunks (verificado con `--outDir` temporal por el problema de permisos al borrar `dist/`).

### A. Validación de build de los 5 mockups — RESUELTO
- `tsc -b` fallaba en `RutaAccesibleView.tsx`: (a) `<Fragment>` cerrado con `</>` (línea 304) y (b) el archivo estaba **truncado** sin las líneas de cierre del componente (`);`/`}`). Corregido.
- Un append por bash duplicó luego el cierre (`);`/`}` repetido en 318–319) por desincronización del mount → eliminado el par duplicado. Build verde.
- *Archivos:* `Web/src/tools/RutaAccesibleView.tsx`.

### B. Carpeta Digital — Glosario MOP completo y NUMERADO
- La tool tenía datos **placeholder** (6 contratos genéricos + 5 carpetas inventadas). Reemplazados por el **glosario real** (textos literales de los manuales MOP).
- **Nuevo `Web/src/tools/carpetaDigitalData.ts`** (≈372 líneas): 6 tipos de contrato con sus árboles completos — Obras y Conservación (21 carpetas N1), Asesorías (18), Consultorías (18), AIF (10), Estudios/Diseños (11), APR (10) — con subcarpetas y documentos predeterminados. Extraído programáticamente del prototipo (`index.html` → objeto `CONTRACTS`) para fidelidad exacta.
- `CarpetaDigitalView.tsx` reescrito: árbol recursivo **numerado** (`1 Licitación