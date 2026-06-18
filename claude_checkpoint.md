# CLAUDE_CHECKPOINT · archibots-produccion

**Regla de oro:** el código del Mockup (`Mockup/mockup-archibots/`) es la única fuente de la verdad; `PLAN_REFACTORIZACION_SPA.md` es el documento de arquitectura derivado y `PLAN_ACCION_MAESTRO_PRODUCCION.md` el WBS operativo.
**Sistema de trabajo:** Lotes Cortos + Checkpoints Autónomos.

---

## HISTORIAL DE TAREAS

### [x] T-F5 · Fase 5 · Seguridad / Paywall / Auditoría — COMPLETADO (2026-06-15)
**Paywall/gating:** `src/core/useAccess.ts` (deriva `edit`/`read`/`locked` de plan+tier+membresía); `ToolHost` lo consume → premium+Free se intercepta con `PricingView` (sin cargar el chunk); `src/tools/BimWizardView.tsx` (T-17) creado, registrado en `registry.ts` y con guarda `access==='locked'` (banner) del Prompt Maestro §5.
**Estabilidad:** `src/components/ToolErrorBoundary.tsx` (Error Boundary de clase, `getDerivedStateFromError`/`componentDidCatch`, reset por `resetKey`) envuelve el render de herramientas dentro del `<Suspense>` del ToolHost → un fallo de tool no derriba la SPA.
**Lazy loading auditado:** 100% de las tools vía `React.lazy`; cero imports estáticos de `tools/` en `src/` (sin inflar el bundle inicial).
**Reglas zero-trust:** `firestore.rules` + subcolecciones `participantes`/`seguimiento`/`bitacora` (criterio owner/editor); `firestore.coordenadasnormativas.rules` (read-only autenticado, write:false) como 2.º target en `firebase.json` (`firestore[]`).
**Pendiente HITL (Gate/Bloque V):** `firebase deploy --only firestore:rules` (incl. target coordenadasnormativas) + `--only hosting`, QA visual 4 temas/4 rutas, promoción dev→prod. Stripe diferido.
**Corrección:** el plan declaraba `PaywallProvider.tsx` (F5.3, 2026-06-14) — el repo real usa el hook `useAccess`.

### [x] T0 · Refactor del plan a v1.4 — COMPLETADO (2026-06-14)
### [x] T1 · Plan de Acción Maestro de Producción v1.0 — COMPLETADO (2026-06-14)
### [x] T2 · Constitución de 17 reglas (PLAN_REFACTORIZACION_SPA v1.5 + WBS v1.1) — COMPLETADO (2026-06-14)
### [x] T3 · F5.7 — Capa Legal y Feedback Dual — COMPLETADO (2026-06-14)
**Archivos:** `src/core/feedbackService.ts`, `src/views/LegalView.tsx`, `src/components/FeedbackForm.tsx`
**Wiring App.tsx:** imports, tipo view extendido, ramas legal-*, FeedbackForm en footer, links legales setView()

### [x] T4 · WBS v1.2 + corrección de estado real — COMPLETADO (2026-06-14)
**WBS actualizado:** F3.2–F3.5 y F4.7 marcados como ✅ (todos los tools ya existen en src/tools/).
Subdivisión en 5 Bloques de entrega pendiente añadida en §2.3.

### [x] T5 · F1.2–F1.4 · Servicios Core — COMPLETADO (2026-06-14)
**Archivos creados:**
- `src/core/firebase.ts` — init canónico, multi-DB, fallback mockup, lazy imports
- `src/core/types.ts` — ArchibotsUser, ProjectMaster, NormativaPRC, FeedbackDoc, GeoWorker types
- `src/core/AuthProvider.tsx` — contexto Auth completo, fallback MOCK_USER, admin via Custom Claim §12
- `src/core/ProjectRepository.ts` — Free/localStorage + Premium/Firestore, §6 superficies duales, §15 tope 50

### [x] T6 · F4.1–F4.3 · Capa Espacial — COMPLETADO (2026-06-14)
**Archivos creados:**
- `src/workers/geo.worker.ts` — Turf sub-paquetes, booleanPointInPolygon, CONST §9
- `src/hooks/useGeoWorker.ts` — hook React, pendingRef, lazy worker init
- `src/core/NormativaService.ts` — IndexedDB caché, getDoc por llave maestra, invalidar
- `src/core/GeoJsonService.ts` — CDN fetch /geo-data/, IndexedDB caché, solo comuna activa en memoria, CONST §8

### [x] T7 · F5.1–F5.3 · Capa SaaS — COMPLETADO (2026-06-14)
**Archivos creados:**
- `firestore.rules` — Zero-Trust: users, projects/sub-cols, customers, entitlements, config, feedback, biblioteca, invitations; §13 suspendido, §14 compPremium, §15 tope, §12 admin
- `functions/src/index.ts` — onProjectDeleted (cascade), sendInviteEmail (Resend/SendGrid), apiProxy (Gemini §5), setUserState (suspender §13)
- `functions/package.json`
- `src/core/PaywallProvider.tsx` — getAccess() edit/read/locked, usePlan(), useAccess(), §11/§14/§15; onSnapshot plan en tiempo real

---

## TRABAJO RESTANTE (ver WBS §2.3 Bloques)

### BLOQUE I — Router + AppShell (requiere H-F1)
- F1.5: createBrowserRouter, guards requireAuth/requireAdmin, NotFoundView, redirects 301
- F1.6: migrar AppShell de mockup a producción con router real
- **BLOQUEADO por H-F1**: proyectos Firebase dev/prod, Auth habilitada, Firestore multi-DB, Custom Claim admin

### BLOQUE II — Wiring UI mockup → servicios reales
- ThemeProvider: extraer a contexto, sync users.theme
- BinderFicha: conectar a ProjectRepository
- ToolHost: migrar TOOL_COMPONENTS a React.lazy registry
- TopToolsBar: leer config/topTools desde Firestore
- StatusBar: conectar a usePlan()
- DimensionadorView: wiring sync master §6
- BimWizardView: wiring useAccess()

### BLOQUE III — Componentes pendientes de código
- BibliotecaView (T-48): data-driven desde Firestore
- MapaTerreno (T-08): polígono + área Turf worker

### BLOQUE IV — Monetización + colaboración (requiere H-F5)
- ShareService.ts + wiring ShareProjectModal a Firestore
- AdminDashboard: conectar a users Firestore
- Stripe Checkout: suscripción + Pase (requiere H-F5: extensión + productos)
- Script migración sub-colecciones (F5.8)

### BLOQUE V — Gate de producción (requiere H-F1 + H-F4 + H-F5)
- QA 4 temas, tests montaje, pen-test Rules, deploy archibots-dev → archibots-prod

---

## ACCIONES HITL PENDIENTES (no las puede hacer Claude)

### H-F1 (desbloquea BLOQUE I)
1. Crear proyectos `archibots-dev` y `archibots-prod` en Firebase Console
2. Habilitar Authentication (Email/Password + Google)
3. Crear/confirmar Firestore `(default)` + DB `coordenadasnormativas`
4. Poblar `.env.local` con VITE_DEV_* y VITE_PROD_* variables
5. Asignar Custom Claim `admin:true` a `goyogramador@gmail.com` (Cloud Shell: `firebase auth:import` o script Admin SDK)

### H-F4.1 (desbloquea Geolocalizador real) — puede iniciarse YA, en paralelo
6. Desplegar 540 GeoJSON a `public/geo-data/` de Firebase Hosting (`firebase deploy --only hosting`)
7. Crear API Key Google Maps restringida + habilitar Maps JS API + Geocoding API + billing
8. Configurar `firebase.json` headers CDN para `/geo-data/**`
9. Proveer API Key Gemini en Secret Manager (para apiProxy / BIM)

### H-F5 (desbloquea BLOQUE IV) — puede iniciarse YA, en paralelo
10. Instalar extensión "Run Payments with Stripe" (Invertase) en Firebase Console
11. Crear productos Stripe: Premium $10.000/mes (recurrente) + Pase $4.990 (payment)
12. Configurar webhook Stripe → Cloud Function con `projectId` en metadata
13. Desplegar Cloud Functions (`firebase deploy --only functions`)
14. Desplegar firestore.rules (`firebase deploy --only firestore:rules`)
15. Crear índices compuestos en Firestore (memberUids array-contains + updatedAt, etc.)
16. Configurar SendGrid/Resend: API key + dominio verificado SPF/DKIM
17. Configurar App Check (reCAPTCHA)
18. Configurar dominio en Hosting + redirects 301 legacy
