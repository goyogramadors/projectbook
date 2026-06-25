---
name: archibots-project-root
description: "Archibots SPA — carpeta raíz correcta Archibots/Archibots/, estructura, contratos de tipos, flujo de auth y diferencias vs mockup"
metadata: 
  node_type: memory
  type: project
  originSessionId: af6493d0-dc1a-4e68-a617-633a438ad71a
  updatedSessionId: cowork-2026-06-14
---

## Raíz del proyecto productivo

**Carpeta correcta:** `C:\G\ProjectBook\Web\`
**En bash (sandbox):** `/sessions/.../mnt/ProjectBook/Web/`

Todos los comandos de terminal (`npm run dev`, `firebase deploy`, etc.) se ejecutan desde aquí.
La carpeta `Mockup/mockup-archibots/` es referencia UX/CSS únicamente — **DEPRECATED para código nuevo**.

## Estructura actual (2026-06-14, post Auth-UX overhaul)

```
Archibots/Archibots/
├── firebase.json          ✅ geo-data Cache-Control headers (CDN)
├── .firebaserc            ✅ default: archibots-497423
├── firestore.rules        ✅ 152 líneas zero-trust (PENDIENTE firebase deploy)
├── firestore.indexes.json ✅ 6 índices compuestos (PENDIENTE firebase deploy)
├── functions/
│   ├── package.json + tsconfig.json  ✅
│   └── src/index.ts       ✅ onProjectDeleted, sendInviteEmail (from: goyogramador@gmail.com),
│                             apiProxy (Gemini), setUserState
│                             (PENDIENTE: npm install + build + deploy + secrets)
└── src/
    ├── main.tsx           ✅ Sin hard-gate. AuthProvider → ThemeProvider → RouterProvider
    │                         + AuthModal como overlay (NO bloqueo de layout)
    ├── archibots.css      ✅ @keyframes ab-spin incluido
    ├── core/
    │   ├── auth/AuthProvider.tsx   ✅ useAuth(), signInEmail, signUpEmail(3-params),
    │   │                              signInGoogle, openAuthModal, closeAuthModal, authModalOpen
    │   ├── firebase.ts             ✅ auth, db (named DB), googleProvider, storage — ESTÁTICOS
    │   ├── types.ts                ✅ Plan='Free'|'Premium', AuthState+modal, User.isAdmin
    │   ├── router.tsx              ✅ createBrowserRouter, RequireAdmin (Custom Claim)
    │   ├── registry.ts             ✅ LAZY_COMPONENTS: geolocalizador, propuesta, hsa, contratos
    │   ├── catalog.ts              ✅ 30 herramientas, FOLDERS, TOP_TOOLS_DEFAULT
    │   ├── db/ProjectRepository.ts ✅ DEFAULT_PROJECT_ID='archibots-sandbox', makeDefaultProject()
    │   ├── db/ProjectProvider.tsx  ✅ Auto-crea sandbox si localStorage vacío (CONST §7)
    │   └── theme/ThemeProvider.tsx + ui/ToastProvider.tsx ✅
    ├── views/
    │   ├── AuthModal.tsx    ✅ isOpen/onClose props, backdrop, botón ×, AnimatePresence
    │   ├── HomeView.tsx     ✅ Auto-redirect a archibots-sandbox si es el único proyecto
    │   └── WorkspaceView, AdminDashboard, LegalView, PricingView, NotFoundView ✅
    ├── components/
    │   ├── StatusBar.tsx    ✅ badge "Invitado" + botón "Iniciar Sesión" para !user
    │   ├── AppShell.tsx, ToolHost.tsx, ToolCatalog.tsx, BinderFicha.tsx ✅
    │   └── Icon.tsx, ProximamenteView.tsx, etc. ✅
    └── tools/
        ├── CalculadoraArquitectonica.tsx  (geolocalizador T-07)
        ├── CalculadoraHonorariosView.tsx  (hsa T-06)
        ├── GeneradorContratosView.tsx     (contratos T-45)
        └── PropuestaView.tsx              (propuesta T-05)
```

## Flujo de autenticación (post Auth-UX overhaul 2026-06-14)

**Usuarios anónimos — acceso libre (NO hay hard-gate):**
1. Firebase devuelve `user = null` → `ThemedApp` renderiza app completa
2. `ProjectProvider.reload()` detecta `localStorage` vacío → auto-crea `"Mi Primer Proyecto"` (id: `archibots-sandbox`)
3. `HomeView` detecta 1 proyecto con id `archibots-sandbox` → `navigate('/p/archibots-sandbox', { replace: true })`
4. Usuario llega directo al WorkspaceView y puede abrir cualquier herramienta

**AuthModal — overlay invocable:**
- Controlado por `authModalOpen` / `openAuthModal()` / `closeAuthModal()` en `AuthState`
- Backdrop oscuro + botón × + click-outside cierra el modal
- Se abre desde: StatusBar (badge "Invitado" o botón "Iniciar Sesión"), cualquier componente vía `useAuth()`
- Se cierra automáticamente al autenticar (signInEmail/signUpEmail/signInGoogle ya llaman `setAuthModalOpen(false)`)
- Tras registro crea doc Firestore `users/{uid}` con `plan: 'Free'` (CONST §7)

## Diferencias críticas vs mockup (no mezclar)

| Aspecto | Mockup (deprecated) | Proyecto correcto |
|---|---|---|
| Firebase imports | `await import('firebase/auth')` dinámico | `import { auth } from '../core/firebase'` estático |
| AuthProvider path | `src/core/AuthProvider.tsx` | `src/core/auth/AuthProvider.tsx` |
| Plan type | `'free' \| 'premium'` | `'Free' \| 'Premium'` (mayúsculas) |
| AuthModal | layout gate `if (!user)` | overlay con `isOpen`/`onClose` props |
| App entry | App.tsx monolítico useState | main.tsx → createBrowserRouter → AppShell |
| Usuarios sin login | bloqueados | acceden libremente (sandbox auto) |

## Reglas de código para este proyecto

- `import type { X }` o `{ type X }` — obligatorio para Vite/oxc (blank screen si falta)
- `db` usa named Firestore DB (`ai-studio-04c1b031-6802-4224-849a-7662aaa73d72`), no `(default)`
- Archivos >100 líneas: scratch en `/outputs/` → esbuild validate → `cp` (mount trunca con Edit)
- Validar con: `esbuild.transformSync(src, { loader: 'tsx', jsx: 'automatic' })`
- `node_modules/esbuild` no está montado → instalar en `/outputs/`: `npm install esbuild --no-save`

## Herramientas activas PENDIENTES de migrar a `src/tools/`

9 herramientas en `catalog.ts` con `estado:'active'` sin implementación en el proyecto correcto:
`dimensionador` (T-14, Top Tool), `expediente-dom` (T-24, Top Tool), `participantes` (T-03),
`datos-proyecto` (T-04), `ubicacion` (T-04b), `mapa-terreno` (T-08),
`seguimiento` (T-43), `bim-wizard` (T-17 premium), `form-municipales` (T-48).
Fuentes en mockup y micro-frontends — adaptar imports + types antes de migrar.

## HITL pendiente (ejecutar antes del próximo sprint)

```bash
# Desde Archibots/Archibots/
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
cd functions && npm install && npm run build && cd ..
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
firebase deploy --only hosting
```

**Why:** usuario corrigió la ruta el 2026-06-14. Auth UX overhaul completado 2026-06-14.
[[archibots-spa-mockup]] sigue válido para CSS/UX/temas (4 temas, clases `.ab-*`).
