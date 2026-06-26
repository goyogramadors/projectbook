# PROMPT TÉCNICO MAESTRO — DESARROLLO DE HERRAMIENTAS ARCHIBOTS
> **Versión 1.1 · Junio 2026** (actualizado a la arquitectura vigente: rutas `Web/`, hook `useToolData`, registro en catálogo, catálogos de datos desde .md)
> Copia este archivo completo, rellena los marcadores `[ASÍ]` y pégalo en cualquier LLM.
> El asistente debe generar UN único archivo `.tsx` listo para copiar sin modificaciones.

---

## 1. CONTEXTO DEL PROYECTO (no modificar)

Estás contribuyendo a **ArchiBots**, una SPA de productividad para arquitectos chilenos.
Stack: **React 19 · Vite 6 · TypeScript strict · framer-motion · lucide-react**.
El sistema de estilos usa Tailwind como *base reset* únicamente (sin compilador JIT); todos los estilos reales están en `archibots.css` mediante clases prefijadas `ab-*` y tokens CSS de shadcn (`--background`, `--foreground`, `--card`, etc.).

---

## 2. TU MISIÓN

Genera el archivo completo de la herramienta **[NOMBRE DE LA HERRAMIENTA]** (id de registro: `[ID-KEBAB-CASE]`).

**Propósito / Lógica deseada:**
> [LÓGICA DESEADA — describe qué hace la herramienta, qué calcula, qué guarda, qué muestra]

**Fuente de referencia visual (si existe):**
> [RUTA DEL ARCHIVO EN EL MOCKUP o "ninguna"]

---

## 3. RUTA DE SALIDA Y CONVENCIÓN DE NOMBRE

```
Web/src/tools/[NombreEnPascalCase]View.tsx
```

- **Un solo archivo** `.tsx`. Sin archivos CSS separados, sin archivos de test.
- Exportación: `export default function [NombreEnPascalCase]View(...)` — compatible con `React.lazy`.
- El archivo NO debe superar ~400 líneas. Si la lógica es mayor, extrae helpers como funciones puras dentro del mismo archivo (no como módulos separados).

---

## 4. STACK EXACTO (inmutable)

| Capa | Tecnología | Versión / Nota |
|---|---|---|
| UI framework | React | 19 · hooks only, no class components |
| Build | Vite | 6 · oxc parser |
| Tipado | TypeScript | strict, `noUncheckedIndexedAccess: true` |
| Animaciones | framer-motion | cualquier versión ≥ 10 |
| Iconos | lucide-react | importar iconos nombrados: `import { Save, X } from 'lucide-react'` |
| Estilos | archibots.css | clases `ab-*` + tokens CSS shadcn |
| Firestore | firebase/firestore | **imports estáticos únicamente** (ver §8) |

---

## 5. CONTRATO `ToolProps` — OBLIGATORIO

Toda herramienta DEBE aceptar exactamente estas props (copiar literal):

```typescript
import type { ToolProps } from '../core/types';
// ToolProps = { projectId?: string; access?: AccessMode }
// AccessMode = 'edit' | 'read' | 'locked'

export default function [NombreEnPascalCase]View({ projectId, access = 'edit' }: ToolProps) {
  // ...
}
```

- `projectId` puede ser `undefined` si el usuario no tiene proyecto activo todavía.
- `access === 'locked'` significa usuario Free intentando abrir herramienta Premium → mostrar `<div className="ab-locked-banner">Actualiza a Premium</div>` y retornar temprano.
- `access === 'read'` → mostrar datos, deshabilitar inputs.

---

## 6. HOOKS DISPONIBLES

### 6.1 `useProjects()` — proyecto activo y persistencia

```typescript
import { useProjects } from '../core/db/ProjectProvider';

const { getProject, repo, reload, addTool, projects, loading } = useProjects();

// Obtener el proyecto activo:
const project = getProject(projectId);   // → ProjectMaster | null

// Guardar cambios en el proyecto (merge parcial):
const updated: ProjectMaster = { ...project!, presupuestoUF: '1500' };
await repo.save(updated);                // persiste en localStorage (Free) o Firestore (Premium)
await reload();                          // refresca la lista en contexto

// Marcar herramienta como añadida al proyecto:
await addTool(projectId!, '[ID-KEBAB-CASE]');
```

**Regla crítica:** nunca uses `projects[0]` para obtener el proyecto activo. Usa siempre `getProject(projectId)`.

### 6.2 `useAuth()` — usuario y plan

```typescript
import { useAuth } from '../core/auth/AuthProvider';

const { user, openAuthModal } = useAuth();

// user es null para invitados (sandbox). NUNCA hagas user! — siempre comprueba.
const plan = user?.plan ?? 'Free';       // Plan = 'Free' | 'Premium' (mayúscula siempre)
const isGuest = !user;
```

### 6.3 `useToast()` — mensajes efímeros

```typescript
import { useToast } from '../core/ui/ToastProvider';

const { triggerToast } = useToast();

triggerToast('Guardado correctamente');   // auto-dismiss a los 3.2 s
```

### 6.4 Utilidades de tipos

```typescript
import { superficieProyecto } from '../core/types';
// superficieProyecto(project) → devuelve superficieManual o superficieCalculada
// según superficieOrigen === 'MANUAL' | 'DIMENSIONADOR'
```

### 6.5 `useToolData()` — persistencia GOBERNADA de datos de herramienta (preferida)

Es la forma **canónica** de guardar el estado propio de una herramienta (no superficies ni
campos del master). Sincroniza Cloud (Premium → `projects/{pid}/toolData/{toolId}`) con
degradación a `localStorage` (`ab-{toolId}-{pid}`). Reemplaza el manejo manual de localStorage.

```typescript
import { useToolData } from '../hooks/useToolData';

interface MiEstado { campo: string; lista: string[]; }
const FALLBACK: MiEstado = { campo: '', lista: [] }; // CONSTANTE estable del módulo (no recrear)

const { data, setData, save, loading } = useToolData<MiEstado>('[ID-KEBAB-CASE]', projectId, FALLBACK);

// Editar + persistir:
const commit = (patch: Partial<MiEstado>) => { const next = { ...data, ...patch }; setData(next); void save(next); };
```

- `projectId === undefined` ⇒ hook inerte (`data = fallback`, `save` devuelve `false`).
- El `toolId` DEBE coincidir con el id del catálogo. Reglas Firestore: `toolData/{document=**}` ya cubierto.
- Una herramienta puede leer el estado de OTRA instanciando `useToolData('otro-tool', projectId, OTRO_FALLBACK)` (p. ej. Presupuesto reusa la selección del Generador de EETT).

---

---

## 7. ESQUEMA `ProjectMaster` — CAMPOS DISPONIBLES

```typescript
interface ProjectMaster {
  id: string;
  name: string;
  anio: string;
  propietario: string;
  rol: string;
  direccion: string;
  comuna: string;
  destino: string;                        // 'Habitacional' | 'Comercial' | etc.
  etapa: 'Perfil'|'Anteproyecto'|'Proyecto'|'Licitación'|'Obra'|'Recepción' | string;
  presupuestoUF: string;                  // string numérico, ej. '1500'
  ownerId: string;
  members: Record<string, 'editor'|'viewer'>;
  addedTools?: string[];
  // Superficies (CONST §6):
  superficieTerrenoLegal: string;
  superficieCalculada: string;            // producido por Dimensionador (T-14)
  superficieManual: string;               // escrito a mano
  superficieOrigen: 'DIMENSIONADOR'|'MANUAL';
  // Opcionales:
  fotoUrl?: string;
  simulacionesCount?: number;
  formulariosCount?: number;
  createdAt?: number;
  updatedAt?: number;
}
```

**Regla:** si la herramienta guarda datos propios (historial, configuración), guárdalos en el **estado local del componente** o en `localStorage` bajo la clave `ab-[ID-KEBAB-CASE]-${projectId}`. **No añadas campos arbitrarios al `ProjectMaster`** salvo que sean superficies o contadores ya definidos.

---

## 8. REGLAS DE FIREBASE — IMPORTS ESTÁTICOS

```typescript
// ✅ CORRECTO — import estático
import { db } from '../core/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// ❌ PROHIBIDO — import dinámico (rompe Vite/oxc)
// const { db } = await import('../core/firebase');
```

Usa Firebase **solo si la herramienta requiere persistencia en la nube** (usuario Premium con datos que deben sincronizarse). Para la mayoría de las herramientas Free, `repo.save(project)` es suficiente. Si no usas Firebase, no importes nada de `firebase/*`.

---

## 9. REGLAS DE ESTILOS Y CSS

### 9.1 Tokens CSS de shadcn (únicos colores permitidos)

```css
/* Fondos */
var(--background)          /* fondo de página */
var(--card)                /* fondo de tarjeta */
var(--popover)             /* fondo de dropdown/popover */
var(--muted)               /* fondo de elementos secundarios */

/* Textos */
var(--foreground)          /* texto principal */
var(--card-foreground)     /* texto sobre tarjeta */
var(--muted-foreground)    /* texto secundario / placeholder */

/* Bordes y anillos */
var(--border)
var(--ring)

/* Colores de acción */
var(--primary)             /* color de acción principal */
var(--primary-foreground)
var(--destructive)         /* rojo peligro */
var(--destructive-foreground)
var(--accent)
var(--accent-foreground)
```

**NUNCA uses colores hardcodeados** (`#3b82f6`, `rgb(...)`, `tailwind-blue-500`, etc.).

### 9.2 Clases CSS REALES de `archibots.css` (tema CAD)

> ⚠️ Estas son las clases que EXISTEN de verdad en producción y reaccionan a los 4
> temas (cad · washi · matrix · white). Úsalas tal cual; no inventes nombres.
> (Las antiguas `ab-tool-root`, `ab-card`, `ab-btn-primary`, `ab-input` NO existían
> y dejaban las herramientas sin estilo — fueron eliminadas de este documento.)

```
tool-panel          → tarjeta/panel con borde 1px y fondo (contenedor principal)
module-header       → cabecera del panel (barra superior con título en mayúsculas)
panel-content       → cuerpo del panel (padding interno estándar)
tech-input-group    → grupo vertical <label> + control (con margin inferior)
tech-input          → input/textarea estilizado (úsalo dentro de tech-input-group)
tech-select         → <select> estilizado
technical-btn       → botón de acción principal (variante `.secondary` para secundario)
btn-tech-gray       → botón gris pequeño (acciones discretas: quitar, +, etc.)
tech-table          → tabla técnica (th/td con bordes 1px; thead en muted)
counter-box         → contenedor de contador; con `.counter-btn` para los [-]/[+]
ab-badge            → etiqueta pequeña (plan/estado); `.premium` y `.free` como variantes
ab-form-grid        → grid responsivo para formularios (1→3→4 columnas)
ab-btn              → botón compacto de barra (`.sec` secundario, `.sm` pequeño)
tech-quote          → subtítulo/cita técnica (línea de contexto del proyecto)
```

> Patrón típico de una sección:
> ```tsx
> <div className="tool-panel">
>   <div className="module-header">| TÍTULO</div>
>   <div className="panel-content">
>     <div className="tech-input-group"><label>Campo</label>
>       <input className="tech-input" /></div>
>   </div>
> </div>
> ```
> Colores: SIEMPRE tokens `var(--…)` (jamás hex/Tailwind de color). Spinner: usa un
> glifo `⎔` o un `<span>` con animación `ab-spin` definida en el CSS.

### 9.3 Modo inline aceptable

Para layout (flex, grid, gap, padding) puedes usar estilos inline con `style={{}}` o Tailwind **solo con clases base** (`flex`, `grid`, `gap-2`, `p-4`, `w-full`, `mt-2`, etc.). **No uses clases de color Tailwind** (`text-blue-500`, `bg-gray-100`).

---

### 9.4 Patrón SPLIT-SCREEN + Exportación a PDF (⟲ 2026-06-17)

Las herramientas "de documento" se montan en un layout de **2 columnas** dentro del
área de trabajo: IZQUIERDA = workspace interactivo (inputs, tablas, botones), DERECHA
= **vista previa de exportación** de SOLO LECTURA + botón `[ EXPORTAR A PDF ]`
(`window.print()`). La lámina la entrega `components/DocumentExportWrapper.tsx`
(membrete + firma, **colores HARD blanco/negro**, desvinculada del tema):

```tsx
import DocumentExportWrapper from '../components/DocumentExportWrapper'; // excepción al §12

<div className="ab-split">
  <div className="ab-split-left">{/* UI interactiva */}</div>
  <div className="ab-split-right">
    <div className="ab-preview-head">
      <h2 className="ab-preview-title">Vista Previa de Exportación</h2>
      <button className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
    </div>
    <DocumentExportWrapper documentName="…" documentId="T-XX" projectId={projectId}>
      {/* resumen READ-ONLY derivado del mismo estado */}
    </DocumentExportWrapper>
  </div>
</div>
```

- La **lámina NO usa tokens de tema** (`var(--*)`): usa hex neutros para verse como un
  documento de Word, igual en los 4 temas. El `@media print` de `archibots.css` oculta
  el layout web y la deja a página A4 completa.
- **Exclusión:** las maquetas del Expediente Municipal (Declaración Jurada, formularios
  DOM/INE) y las herramientas de mapa (Geolocalizador, Mapa de Terreno) **NO** llevan
  split-screen ni wrapper.

## 10. REGLAS DE IMPORTS — VITE/OXC STRICTNESS

```typescript
// ✅ CORRECTO — import type para interfaces/tipos
import type { ToolProps, ProjectMaster, Plan } from '../core/types';

// ✅ CORRECTO — import de valor para componentes y hooks
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';

// ✅ CORRECTO — lucide-react named imports
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';

// ❌ PROHIBIDO — import default de lucide
// import Icons from 'lucide-react';
// import * as Icons from 'lucide-react';   (solo si usas muchos, pedir explícitamente)

// ✅ CORRECTO — framer-motion
import { motion, AnimatePresence } from 'framer-motion';

// ❌ PROHIBIDO — cualquier import de react-router-dom DENTRO de una herramienta
// Las herramientas no navegan; el ToolHost se encarga del routing.
```

---

## 11. REGLAS DE ESTADO Y SINCRONIZACIÓN

1. **Estado local primero.** Todo input del usuario vive en `useState`. Solo llamas `repo.save()` al hacer clic en "Guardar" o en un `useEffect` de debounce (≥ 500 ms).

2. **No hagas full-scans de Firestore.** Si necesitas un documento específico, úsalo por `doc(db, 'colección', id)`. `collection(...)` sin filtro `where` está prohibido.

3. **El patrón `useDimensionadorSync`:** Si tu herramienta necesita la superficie del terreno, léela de `project.superficieTerrenoLegal` y `superficieProyecto(project)`. No recalcules — el Dimensionador (T-14) ya la escribió en el `ProjectMaster`.

4. **Optimistic UI:** Muestra el resultado localmente antes de confirmar el save. Llama `triggerToast('Guardado ✓')` solo tras el `await repo.save()` exitoso. En caso de error, llama `triggerToast('Error al guardar')`.

5. **Guard de `projectId`:** Si `!projectId` o `!project`, renderiza un estado vacío con aviso:
   ```tsx
   if (!project) return (
     <div className="ab-tool-root">
       <p style={{ color: 'var(--muted-foreground)' }}>
         Selecciona un proyecto para usar esta herramienta.
       </p>
     </div>
   );
   ```

---

## 12. PROHIBICIONES ABSOLUTAS

- ❌ `localStorage` directo sin prefijo `ab-`. Usa `ab-[ID-KEBAB-CASE]-${projectId}` como clave.
- ❌ `console.log` en el código entregado.
- ❌ Comentarios en inglés. Todo el código se documenta en español.
- ❌ Estilos con `!important`.
- ❌ `any` en TypeScript. Usa `unknown` + type guard si no sabes el tipo.
- ❌ `// @ts-ignore` o `// @ts-nocheck`.
- ❌ Imports de `react-router-dom` dentro de la herramienta.
- ❌ Imports de `../views/` o `../components/` — las herramientas son leaves del árbol.
- ❌ Modificar `ProjectMaster` con campos arbitrarios que no estén en la interfaz.

---

## 13. ESQUELETO BASE — RELLENA Y EXPANDE

```tsx
/* =============================================================================
   [NombreEnPascalCase]View.tsx — [NOMBRE LEGIBLE DE LA HERRAMIENTA] (T-[CÓDIGO])
   -----------------------------------------------------------------------------
   [DESCRIPCIÓN DE UNA LÍNEA: qué hace, qué calcula, qué persiste]
   Conecta con el ProjectMaster activo (useProjects().getProject) para [X].
   ============================================================================= */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw } from 'lucide-react';         // ajusta los iconos necesarios
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import type { ToolProps } from '../core/types';
// import { superficieProyecto } from '../core/types';   // descomentar si necesitas superficies

/* ── tipos locales ─────────────────────────────────────────────────────────── */
// [DEFINE AQUÍ LOS TIPOS/INTERFACES PROPIOS DE ESTA HERRAMIENTA]

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-[ID-KEBAB-CASE]-${pid}`;

/* ── helpers puros ─────────────────────────────────────────────────────────── */
// [FUNCIONES DE CÁLCULO PURAS, SIN EFECTOS SECUNDARIOS]

/* ── componente principal ──────────────────────────────────────────────────── */
export default function [NombreEnPascalCase]View({ projectId, access = 'edit' }: ToolProps) {
  const { getProject, repo, reload } = useProjects();
  const { user } = useAuth();
  const { triggerToast } = useToast();

  const project = getProject(projectId);

  // [ESTADO LOCAL — inputs, resultados, historial]
  const [saving, setSaving] = useState(false);
  // const [miDato, setMiDato] = useState('');

  /* ── guard: herramienta bloqueada para Free ── */
  // Descomenta si esta herramienta es tier: 'premium'
  // if (access === 'locked') return (
  //   <div className="ab-tool-root">
  //     <div className="ab-locked-banner">Actualiza a Premium para usar [NOMBRE].</div>
  //   </div>
  // );

  /* ── guard: sin proyecto ── */
  if (!project) return (
    <div className="ab-tool-root">
      <p style={{ color: 'var(--muted-foreground)' }}>
        Selecciona un proyecto para usar esta herramienta.
      </p>
    </div>
  );

  /* ── carga inicial desde localStorage ── */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        // const saved = JSON.parse(raw) as [TU_TIPO];
        // setMiDato(saved.campo);
      } catch {
        // datos corruptos — ignorar
      }
    }
  }, [project.id]);

  /* ── guardado ── */
  const handleSave = async () => {
    if (access !== 'edit') return;
    setSaving(true);
    try {
      // 1. Persiste en localStorage el estado propio de la herramienta (si aplica):
      // localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify({ campo: miDato }));

      // 2. Si debes actualizar el ProjectMaster (ej. presupuestoUF, superficies):
      // const updated = { ...project, presupuestoUF: miDato };
      // await repo.save(updated);
      // await reload();

      triggerToast('Guardado correctamente');
    } catch {
      triggerToast('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <motion.div
      className="ab-tool-root"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* CABECERA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h2 className="ab-section-title" style={{ flex: 1, margin: 0 }}>
          [NOMBRE LEGIBLE]
        </h2>
        <button
          className="ab-btn-primary"
          onClick={handleSave}
          disabled={saving || access !== 'edit'}
        >
          {saving
            ? <span className="ab-spin" style={{ display: 'inline-block', width: 14, height: 14 }} />
            : <Save size={14} />
          }
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="ab-card" style={{ padding: '1.25rem' }}>
        {/* [LÓGICA DESEADA — inputs, selectores, tabla de resultados, etc.] */}
        <p style={{ color: 'var(--muted-foreground)' }}>
          Proyecto: <strong>{project.name}</strong> · {project.etapa}
        </p>
      </div>
    </motion.div>
  );
}
```

---

## 14. INSTRUCCIONES DE ENTREGA

1. Entrega **un único bloque de código** con el archivo completo (sin cortes, sin "...").
2. El bloque debe empezar con el comentario de cabecera `/* === ... === */` y terminar con el último `}` del componente.
3. No incluyas instrucciones sobre cómo ejecutar npm, firebase deploy, ni explicaciones largas. Solo el código.
4. Si necesitas más de ~400 líneas, avisa antes de generar e indica por qué.

---

## 15. CONTRATO DE REGISTRO EN `registry.ts`

Una vez que tengas el archivo, añade esta entrada en `Web/src/core/registry.ts` dentro de `LAZY_COMPONENTS`:

```typescript
[ID-KEBAB-CASE]: React.lazy(() => import('../tools/[NombreEnPascalCase]View')),
```

Y en el array `CATALOG` (o `TOOLS`), el objeto `CatalogTool` correspondiente:

```typescript
{
  id:     '[ID-KEBAB-CASE]',
  code:   'T-[CÓDIGO]',
  label:  '[NOMBRE LEGIBLE]',
  folder: [0-7],                        // carpeta del catálogo
  sub:    '[SUBTÍTULO CORTO]',
  icon:   '[NombreIconoLucide]',
  estado: 'active',                     // 'active' | 'soon' | 'archived'
  tier:   'free',                       // 'free' | 'premium'
  fases:  ['PERFIL'],                   // array de Fase
  desc:   '[DESCRIPCIÓN LARGA]',
},
```

---

*Fin del Prompt Maestro. Rellena §2, ajusta §15 y pega todo en el LLM generador.*


---

## 16. REGISTRO EN `catalog.ts` (metadata) y catálogos de datos desde `.md`

Registrar en `registry.ts` (§15) **no basta**: la herramienta también debe tener su entrada de
presentación en `Web/src/core/catalog.ts` (`CATALOG[]`):

```typescript
{ id: '[ID-KEBAB-CASE]', code: '', label: 'Nombre visible', folder: <n>, sub: '<subsección>',
  icon: '<LucideIcon>', estado: 'active' /* | 'soon' */, tier: 'free' /* | 'premium' */,
  fases: ['CONSTRUCCIÓN'], desc: 'Descripción corta.' },
```

- `estado: 'soon'` muestra la tarjeta deshabilitada; `'active'` la habilita (montará el componente del registry).
- `tier: 'premium'` activa el candado del paywall vía `useAccess` (el `ToolHost` ya pasa `access`).
- Si la tool restringe por tipo de proyecto, añade `tiposProyecto: [...]`.

### Catálogos de DATOS desde `.md` (patrón EETT / Presupuesto)

Cuando una herramienta se alimenta de un cuerpo de datos extenso y editable (partidas, precios,
textos), **mantén el `.md` como fuente** en `DESARROLLO/` y genera un módulo TS tipado con un
script en `Web/scripts/`. La herramienta importa el `.ts` (no parsea `.md` en runtime). Ejemplo
vigente: `Web/scripts/build-catalogos-construccion.mjs` → `Web/src/tools/construccion/catalogo.eett.ts`
y `catalogo.presupuesto.ts`, con la lógica de activación en `construccion/activaSi.ts`.

> ⚠️ Nota de entorno: al editar archivos existentes grandes, hazlo en scratch y copia (`cp`),
> porque el montaje puede truncar ediciones directas largas.
