# 🐙 Guía: subir el proyecto a GitHub + desplegar backend/frontend

> **Para Andrés.** Guía operativa para versionar **Project_Book / Archibots** en GitHub
> (repositorio nuevo, desde cero) y para actualizar **backend (Cloud Functions)** y **frontend (Firebase Hosting)**.
>
> **Sistema operativo asumido:** Windows · terminal **PowerShell** o **Git Bash**.

---

## 🧭 Estructura y "regla de oro" de carpetas

El repositorio cubre **dos ramas** en una sola carpeta:

```
E:\2CLAUDE\ProjectBook\     ← raíz del REPO (aquí viven .git y .gitignore)
├── DESARROLLO\             ← documentación (.md) y material de diseño
└── Web\                    ← la SPA productiva (package.json, firebase.json, src\, functions\…)
```

| Acción | Dónde se ejecuta |
|---|---|
| **Git** (`git add`, `commit`, `push`…) | **Raíz**: `E:\2CLAUDE\ProjectBook` (versiona DESARROLLO + Web juntas) |
| **npm** (`npm install`, `npm run build`) | **`E:\2CLAUDE\ProjectBook\Web`** |
| **firebase** (`firebase deploy`…) | **`E:\2CLAUDE\ProjectBook\Web`** (ahí está `firebase.json`) |

> Mezclar esto es la causa #1 de errores: si corres `firebase deploy` desde la raíz, no encontrará `firebase.json`.

---

## ✅ Antes de empezar (verificación rápida)

El proyecto **ya tiene Git inicializado** (existe `.git` en la raíz, rama `master`, 1 commit) pero **NO tiene repositorio remoto** todavía. Eso es lo que vamos a crear.

```powershell
cd E:\2CLAUDE\ProjectBook
git status
git remote -v        # debe salir vacío (aún no hay remoto)
git branch           # debe mostrar: * master
```

### 🔒 Seguridad (crítico antes del primer push)
El `.gitignore` ya protege lo importante. Confírmalo **desde la raíz**:

```powershell
cd E:\2CLAUDE\ProjectBook
git check-ignore Web/.env.local        # debe imprimir: Web/.env.local  (= ignorado ✔)
git check-ignore Web/node_modules      # debe imprimir la ruta (= ignorado ✔)
```

Si `git check-ignore Web/.env.local` **no imprime nada**, DETENTE: tus claves se subirían. No hagas push hasta arreglarlo. Lo que el `.gitignore` excluye: `node_modules/` (cualquier nivel), `dist/`, `Web/functions/lib/`, `*.tsbuildinfo`, `.env*`, `*.local`, `.firebase/`.

> ⚠️ **Nunca** subas `.env.local` ni secretos. GitHub conserva el historial: si una clave entra una vez, hay que **rotarla** aunque la borres después.
> Nota: el código fuente del **Mockup** (en `DESARROLLO/Mockup`) **sí** se versiona (es referencia); solo se ignora su `node_modules`. Si no quieres versionarlo, descomenta `DESARROLLO/Mockup/` en `.gitignore`.

---

## PARTE 1 — Crear el repositorio en GitHub (desde cero)

### Paso 1.1 — Identidad de Git (solo la primera vez)
```powershell
git config --global user.name  "Gregorio"
git config --global user.email "gregoriocastillo@gmail.com"
```

### Paso 1.2 — Crear el repo en GitHub
En la web de GitHub: **New repository**.
- **Name:** `projectbook`.
- **Visibilidad:** **Private** (recomendado — es producción).
- **NO** marques "Add README", "Add .gitignore" ni "license" (el proyecto ya los trae; evitas conflictos).
- **URL del repo:** `https://github.com/goyogramadors/projectbook`

### Paso 1.3 — Preparar el primer commit (desde la raíz)
```powershell
cd E:\2CLAUDE\ProjectBook
git status
git add -A
git commit -m "chore: estructura DESARROLLO + Web (snapshot inicial)"
```

### Paso 1.4 — Conectar el remoto y subir
```powershell
git branch -M main                       # renombra master → main (estándar GitHub)
git remote add origin https://github.com/goyogramadors/projectbook.git
git push -u origin main
```

Si pide credenciales, usa tu usuario y un **Personal Access Token** (Settings → Developer settings → Tokens) como contraseña — GitHub ya no acepta la contraseña de la cuenta.

### Paso 1.5 — Verificar
Recarga el repo en GitHub: deben verse **`DESARROLLO/`** y **`Web/`** con su contenido fuente, **pero NO** `Web/node_modules/`, `Web/dist/` ni `Web/.env.local`.

---

## PARTE 2 — Flujo de actualización diaria (cada vez que cambies algo)

```powershell
cd E:\2CLAUDE\ProjectBook        # SIEMPRE desde la raíz para Git
git status                       # ver qué cambió (en DESARROLLO o en Web)
git add -A                       # preparar todos los cambios
git commit -m "feat: descripción breve del cambio"
git push                         # subir a GitHub
```

Convención de mensajes: `feat:` nueva función · `fix:` corrección · `chore:` mantenimiento · `docs:` documentación · `refactor:` reestructura sin cambio funcional.

> **Buen hábito:** confirma (`commit`) antes de cada despliegue. Así el repo y producción quedan alineados y puedes volver atrás si algo falla.

---

## PARTE 3 — Desplegar el BACKEND (Cloud Functions)

El backend son las **Cloud Functions** en `Web/functions/src/index.ts`
(`onProjectDeleted`, `sendInviteEmail`, `sendPremiumInviteEmail`, `apiProxy`, `setUserState`).

### Paso 3.1 — Situarte en Web y seleccionar el proyecto Firebase
```powershell
cd E:\2CLAUDE\ProjectBook\Web
firebase use prod        # = archibots-497423 (producción). Para pruebas: firebase use dev
firebase projects:list   # opcional, ver a cuál estás apuntando
```

### Paso 3.2 — Compilar y desplegar funciones
```powershell
cd E:\2CLAUDE\ProjectBook\Web\functions
npm install              # solo si cambiaron dependencias
npm run build            # compila TS → lib/
cd ..                    # vuelve a Web\ (donde está firebase.json)
firebase deploy --only functions
```

Para desplegar **una sola** función (más rápido y seguro):
```powershell
firebase deploy --only functions:sendPremiumInviteEmail
```

### Paso 3.3 — Secretos (solo cuando cambien)
Desde `Web\`. Los secretos NO van en el código:
```powershell
firebase functions:secrets:set SENDGRID_API_KEY
# (y los que use apiProxy / BIM, p. ej. la clave del proveedor de IA)
```
Tras cambiar un secreto, vuelve a desplegar la función que lo usa.

### Paso 3.4 — Reglas e índices de Firestore (si los tocaste)
```powershell
cd E:\2CLAUDE\ProjectBook\Web
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## PARTE 4 — Desplegar el FRONTEND (Firebase Hosting)

> Aclaración: el frontend **no** está en "Firestore pages"; está en **Firebase Hosting** (carpeta `Web/dist/` publicada). El sitio es una SPA: Hosting reescribe todas las rutas a `/index.html`.

```powershell
cd E:\2CLAUDE\ProjectBook\Web
npm install              # solo si cambiaron dependencias
npm run build            # genera dist/  (tsc -b && vite build)
firebase deploy --only hosting
```

Si el build falla por TypeScript, **corrígelo antes** de desplegar (no se sube un `dist/` roto).

---

## PARTE 5 — Desplegar TODO de una vez (cuando aplique)

```powershell
cd E:\2CLAUDE\ProjectBook\Web
npm run build
firebase deploy          # hosting + functions + firestore rules/indexes
```

Úsalo solo cuando de verdad cambiaron varias capas. En el día a día, despliega **solo lo que cambió** (`--only ...`) para reducir riesgo y tiempo.

---

## 🆘 Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `firebase: command not found` o "no firebase.json" | Estás en la raíz, no en `Web\` | `cd E:\2CLAUDE\ProjectBook\Web` antes de comandos firebase/npm |
| `git push` rechazado (`failed to push`) | El remoto tiene commits que no tienes | `git pull --rebase origin main` y vuelve a `push` |
| Pide usuario/clave y falla | GitHub exige token | Usa un **Personal Access Token** como contraseña |
| Se subió `Web/.env.local` por error | Estaba fuera del `.gitignore` | Bórralo del historial y **rota todas las claves** expuestas |
| `firebase deploy` apunta al proyecto equivocado | Falta `firebase use` | `firebase use prod` antes de desplegar |
| Hosting muestra versión vieja | No recompilaste | `npm run build` (en `Web\`) antes de `firebase deploy --only hosting` |
| El mapa no carga en `npm run dev` | Falta `VITE_GOOGLE_MAPS_API_KEY` en `Web/.env.local` | Recrear `Web/.env.local` desde `Web/.env.local.example` |

---

## 📌 Resumen de un vistazo

```powershell
# 1) Subir cambios a GitHub  (DESDE LA RAÍZ)
cd E:\2CLAUDE\ProjectBook
git add -A; git commit -m "feat: ..."; git push

# 2) Desplegar backend  (DESDE Web)
cd E:\2CLAUDE\ProjectBook\Web
firebase use prod
cd functions; npm run build; cd ..
firebase deploy --only functions

# 3) Desplegar frontend  (DESDE Web)
cd E:\2CLAUDE\ProjectBook\Web
npm run build
firebase deploy --only hosting
```

> **Proyectos Firebase:** `prod` = `archibots-497423` · `dev` = `archibots-dev`.
> **Respaldos de datos:** GitHub respalda el **código** (DESARROLLO + Web), NO los datos de Firestore/Storage.
> La estrategia de respaldo de datos está **pendiente** (ver `Iniciar Aquí.md` §5 y el Tintero).
