# Memoria y Especificación — Subsistema **Obra Digital MOP** (Archibots) · v4

> Versión 4. Mantiene **todas** las decisiones de la v3 (endurecimiento para producción en React 19 + Firebase 12) y agrega **tres capacidades funcionales** nuevas: archivado de elementos, adjuntos en las entradas de libro, y apertura formal de libros con Acta de Apertura. El glosario normativo literal vive aparte en `GLOSARIO_Normativo_ObraDigital.md` (fuente de verdad de los catálogos).

---

## 0. Resumen de cambios

### 0.1. Correcciones arquitectónicas heredadas de la v3 (vigentes)

| # | Corrección | Estado |
|---|---|---|
| 1 | Catálogo **idéntico al glosario**; la agrupación de archivos de raíz es un **nodo virtual UI-only** (`📄 Documentos de la carpeta`), sin mutar datos. | Vigente |
| 2 | Expansión del árbol con **estado atómico por nodo** (`useState` local) + `React.memo`. | Vigente |
| 3 | Permisos **denormalizados** (`lectores[]`/`editores[]`) en `config` y `libros`; se elimina `permisos/{uid}`. | Vigente |
| 4 | `storageRef` con **UUID**; nombre original solo como metadato. | Vigente |
| 5 | **Counters de agregación** transaccionales (índice Año→Mes) y **paginación con cursores** (`limit`/`startAfter`). | Vigente |

### 0.2. Novedades v3 → v4

| # | Capacidad nueva | Resumen |
|---|---|---|
| A | **Archivar (descartar)** | Folios de libro y archivos/versiones de carpeta tienen acción *Archivar*: salen del árbol/listado principal y pasan a una **carpeta "Archivados"** (restaurables). |
| B | **Adjuntos en entradas** | Todos los formatos de entrada del Libro de Obras permiten **adjuntar archivos o imágenes**. |
| C | **Acta de Apertura / libros "cerrados"** | Cada libro nace **cerrado**; al *Abrir libro de obras* se registra la **primera entrada (Acta de Apertura)** con fecha de inicio y texto libre de indicaciones. |

---

## 1. Objetivo y alcance

Subsistema aislado dentro de Archibots con dos módulos que comparten proyecto, usuarios y permisos:

- **Carpeta Digital** — repositorio para *respaldar* documentos, en árbol temático colapsable según el **tipo de contrato** (6 tipos), con versionado, fecha/autor, ver/descargar y **archivado**.
- **Libro de Obras** — registro de comunicaciones formales en varios **sub-libros**, con entradas (folios) tipificadas según el estándar LOD, navegables por **año/mes**, con **adjuntos**, **archivado** y **apertura formal**.

**ID en `registry.ts`:** `obra-digital` · **Categoría:** `Gestión de Obra` · lazy en `<ToolHost>`. Estilos sobre `archibots.css` (4 temas); carga pesada en Web Workers; caché en IndexedDB.

---

## 2. Novedad A — Archivado (descarte reversible)

### 2.1. Concepto

Tanto los **folios** del Libro de Obras como los **archivos (versiones)** de la Carpeta Digital pueden **archivarse**: el elemento **sale del árbol/listado principal** y queda guardado en una vista **"Archivados"** del módulo correspondiente. Es un **descarte reversible** (no es borrado físico): siempre se puede **restaurar**.

### 2.2. Modelo de datos

- Se añade el campo **`estado: 'activo' | 'archivado'`** a:
  - cada **versión de archivo** (`archivos/{archivoId}`), y
  - cada **entrada de libro** (`entradas/{folioId}`).
- Las vistas, conteos e índices operan **solo sobre `estado === 'activo'`** por defecto. La vista "Archivados" filtra `estado === 'archivado'`.
- **Coherencia con la v3:**
  - Los **counters de agregación** (Año→Mes) cuentan solo activos; al archivar/restaurar se aplica `increment(∓1)` en la misma transacción.
  - Las consultas paginadas de folios filtran `where('estado','==','activo')` (índice compuesto `(libroId, estado, fecha desc)`).
  - El borrado **físico** sigue reservado a usuarios con permiso `editor`; *archivar* está disponible para `escritura`.

### 2.3. Interfaz

- **Carpeta Digital:** en el detalle de un archivo-tipo, cada versión tiene la acción **📥 Archivar** (junto a 👁 Ver / ⬇ Descargar). Un **nodo "🗃️ Archivados"** al final del árbol abre la vista de archivados del expediente (tabla con tipo, archivo, carpeta de origen, fecha y **♻ Restaurar**). Si un tipo se queda sin versiones activas, su hoja desaparece del árbol (los predeterminados permanecen con contador 0).
- **Libro de Obras:** dentro del detalle de un folio (acordeón "+ ver más") hay **📥 Archivar entrada**. Un ítem **"🗃️ Archivados"** al pie del índice de sub-libros muestra todas las entradas archivadas (de todos los libros) con **♻ Restaurar**. Los contadores de sub-libro y de mes reflejan solo activos.

---

## 3. Novedad B — Adjuntos en las entradas de libro

### 3.1. Concepto

Todos los formatos de entrada (Comunicación 1.1–1.5, Incidente 2.1, Reporte Ejecutivo 2.2 y Formato libre) permiten **adjuntar archivos o imágenes** al crear la entrada.

### 3.2. Modelo de datos y Storage

- La entrada gana **`adjuntos: Array<{ storageRef, nombreArchivo, contentType }>`**.
- **Cada adjunto sigue la regla de la v3 (Corrección 4):** `storageRef` con **UUID**; el nombre original (incluido el de la imagen) se guarda como metadato `nombreArchivo`. Esto evita colisiones entre imágenes/documentos homónimos.
- Tipos admitidos sugeridos: PDF, imágenes (JPG/PNG), Word, Excel. Se valida `contentType` y tamaño en el cliente antes de subir.

### 3.3. Interfaz

- En el drawer **Nueva entrada**, un campo común **"Adjuntar archivos o imágenes"** (zona clicable + selección múltiple) lista los adjuntos elegidos como chips removibles, **independiente del formato** seleccionado.
- En el **detalle del folio** se muestran los adjuntos (`📎 Adjuntos (N)`), descargables.

---

## 4. Novedad C — Apertura formal de libros (Acta de Apertura)

### 4.1. Concepto

Aunque un sub-libro **exista** en el índice, **nace "cerrado"**. El **Inspector Fiscal** debe **Abrir el libro de obras**, acción que **registra la primera entrada: el Acta de Apertura**, con la **fecha de inicio** del libro y un **texto libre** con las indicaciones de apertura. Esto refleja el estándar LOD: *"El Inspector Fiscal del Contrato es la persona autorizada para realizar la apertura de los Libros"*, y el Maestro *"se inicia con la fecha de entrega del terreno y del trazado –junto a su acta correspondiente-"*.

### 4.2. Modelo de datos

- El libro gana **`abierto: boolean`** (por defecto `false`), **`aperturaFecha`** y (opcional) **`aperturaUid`**.
- El **Acta de Apertura** es la **primera entrada (folio)** del libro: `{ tema: 'Apertura', subtema: 'Acta de apertura del libro de obras', tipo: 'Acta de apertura', fecha: aperturaFecha, autor: <IF>, rep: <texto libre>, apertura: true }`. Es una entrada normal (auditable, archivable) pero marcada como acta.
- Mientras `abierto === false`: el libro **no admite nuevas entradas** (la acción *Nueva entrada* redirige a la apertura) y no participa en reportes hasta abrirse.

### 4.3. Interfaz y flujo

- En el índice de sub-libros, los libros cerrados muestran un indicador **🔒 cerrado**.
- Al seleccionar un libro cerrado, la columna de folios muestra un **estado vacío** con el botón **📖 Abrir libro de obras**.
- El modal **Abrir libro de obras** pide **Fecha de apertura** (por defecto hoy) y **Indicaciones de la apertura (texto libre)**; al confirmar crea el Acta de Apertura, marca `abierto = true` y la deja como primer folio.
- El botón del pie del índice, antes "Abrir libro", se renombra a **"+ Agregar libro"** (registra un nuevo sub-libro temático o por especialidad, que **nace cerrado**) para no confundir *agregar un libro* con *abrir/iniciar su registro*.

---

## 5. Arquitectura de componentes (v4)

```
ObraDigitalTool (lazy en <ToolHost>)
├── ObraDigitalProvider  (Context mínimo; SIN estado de expansión del árbol)
├── ObraDigitalHeader · ModuleSwitcher
│
├── ── CARPETA DIGITAL (2 col.) ─────────────────────────────
│   CarpetaDigitalView
│   ├── ContractTypeSelect
│   ├── CarpetaTree
│   │   ├── CarpetaTreeNode  (React.memo + useState(open) LOCAL)
│   │   │   ├── DocumentosDeCarpeta (nodo virtual UI-only)
│   │   │   │     └── FileRow (versiones activas)
│   │   │   └── CarpetaTreeNode… (subcarpetas reales)
│   │   └── ArchivadosNode  🗃️  ← Novedad A
│   └── CarpetaDetail
│       ├── FolderDetail · FileDetail (Ver/Descargar/📥 Archivar) → VerArchivoModal
│       └── ArchivadosView (restaurar)
│   Modales: AddArchivoDialog (UUID) · NewSubfolderDialog · DeleteFolderDialog
│
├── ── LIBRO DE OBRAS (2 col.) ──────────────────────────────
│   LibroObrasView
│   ├── LibroIndex (sub-libro [🔒/abierto] → Año → Mes; counters)  + ArchivadosNode 🗃️
│   ├── FolioList (paginada; acordeón; 📥 Archivar entrada)
│   │   └── FolioCard → FolioDetail (📎 Adjuntos, participantes, vínculos)
│   ├── AperturaModal  📖  ← Novedad C (Acta de Apertura)
│   └── ArchivadosView (restaurar)
│   Modales: NuevaEntradaDialog (drawer; Adjuntos ← Novedad B) · AgregarLibroDialog
│       └── ReporteForms: Comunicacion(1.1–1.5) · Incidente(2.1) · Ejecutivo(2.2) · Libre
│
├── PermisosManager  (lectores/editores denormalizados)
│
└── Servicios: catalog/ (= glosario) · data/ (cursores) · workers/ · storage.ts (UUID)
              counters.ts (agregación) · auditoria.ts · cache/indexedDb.ts
```

---

## 6. Contrato de datos (v4)

### 6.1. Estático en código (catálogos = glosario, sin mutación)

Árboles por tipo de contrato, archivos predeterminados, sub-libros, temas 1.1–1.5 y plantillas de reporte: `as const` en `catalog/`, **idénticos al glosario** (sin "X-0"). La agrupación de archivos de raíz es el nodo virtual de UI.

### 6.2. Firestore (`obraDigitalDb`)

```
projects/{projectId}/obraDigital/{config}
projects/{projectId}/obraDigital/archivos/{archivoId}
projects/{projectId}/obraDigital/carpetasCustom/{folderId}
projects/{projectId}/obraDigital/libros/{libroId}
projects/{projectId}/obraDigital/libros/{libroId}/entradas/{folioId}
projects/{projectId}/obraDigital/libros/{libroId}/agregados/contadores
```

**`config`** — `contractType`, `safi`, `mercadoPublico`, `carpetaIniciada`, `libroModo`, `librosHabilitados[]`, `carpetaLectores[]`, `carpetaEditores[]`.

**`archivos/{archivoId}`** (cada versión):

| Campo | Tipo | Notas |
|---|---|---|
| `rutaCarpeta` | `string` | Nodo **normativo real** (`node.n`), nunca `"X-0"`. |
| `tipoDocumento`, `esOtro`, `version`, `vigente`, `vinculo` | — | Versionado por tipo. |
| `storageRef` | `string` | **UUID**. |
| `nombreArchivo`, `contentType` | `string` | Metadato. |
| `autorUid`, `autorNombre`, `fechaSubida`, `observaciones` | — | — |
| **`estado`** | `'activo'\|'archivado'` | **Novedad A** (default `activo`). |

**`carpetasCustom/{folderId}`** — `parentPath`, `numero` (autonumerado), `nombre`, `creadoPor`, `creadoEn`. Eliminables; las maestras no.

**`libros/{libroId}`** — `tipo`, `especialidades[]`, `lectores[]`, `editores[]`, **`abierto: boolean`** (default `false`), **`aperturaFecha`**, `aperturaUid`. *(Novedad C.)*

**`libros/{libroId}/entradas/{folioId}`**:

| Campo | Tipo | Notas |
|---|---|---|
| `folio`, `fecha`, `ym` ("yyyy-mm"), `autorUid/Nombre` | — | `ym` denormalizado (paginación). |
| `tema`, `subtema`, `formato`, `payload` | — | `subtema` = etiqueta visible. |
| `librosVinculados[]` | `string[]` | `array-contains` (multi-libro). |
| `participantes[{nombre,sinCuenta}]` | — | Usuarios o personas sin cuenta. |
| **`adjuntos[{storageRef(UUID),nombreArchivo,contentType}]`** | — | **Novedad B**. |
| **`estado`** | `'activo'\|'archivado'` | **Novedad A**. |
| **`apertura`** | `boolean` | `true` si es el Acta de Apertura (**Novedad C**). |
| `origen` (`manual\|auto_carpeta`), `refArchivo`, `accionAuditada` | — | Auditoría Carpeta↔Libro. |

**`agregados/contadores`** — `{ porMes: {"yyyy-mm": n_activos}, total }`; ajustado transaccionalmente al crear/archivar/restaurar/eliminar.

### 6.3. Estado local de React (no persiste, no global)

Expansión por nodo (`useState` local), selección mínima `{kind,nodeId,tipo}`, `openFolioId` (acordeón), página/cursor de folios, **vista Archivados activa**, **flag de libro abierto/cerrado en UI**, borradores de modales (incluida la lista de adjuntos antes de subir), árbol derivado memoizado. Caché en IndexedDB.

---

## 7. Especificación de interfaz (v4)

### 7.1. Grilla maestra

Header 56 px · Sub-barra 40 px · Cuerpo (2 columnas) · Estado 28 px. Columna izquierda protagonista: `--od-tree-w: clamp(450px, 50%, 690px)`. Scroll independiente; bordes de 1 px (estética de archivador).

| Zona | Carpeta Digital | Libro de Obras |
|---|---|---|
| Izquierda | Árbol (carpetas/subcarpetas en negrita + nodo virtual `📄 Documentos de la carpeta` + hojas archivo) **+ 🗃️ Archivados** | Sub-libros (`🔒` si cerrado) → Año → Mes **+ 🗃️ Archivados** |
| Derecha | Detalle de carpeta / de archivo (versiones + Ver/Descargar/Archivar) o vista Archivados | Folios paginados en acordeón (Archivar; Adjuntos) o estado **cerrado** con *Abrir libro* |

### 7.2. Superficies, estados, microcopia

- **Modal centrado:** agregar archivo, sub/eliminar carpeta, **agregar libro**, **abrir libro (Acta de Apertura)**, ver archivo.
- **Drawer ancho (~1020 px, 2 col.):** Nueva entrada (con **Adjuntos**).
- **Panel embebido / acordeón:** detalle de carpeta-archivo / folio.
- **Toast:** auditoría Carpeta↔Libro, descargas, archivado y apertura.
- **Estados clave:** libro **🔒 cerrado** → CTA *Abrir libro de obras*; carpeta/libro sin elementos → CTA primario; vista **🗃️ Archivados** con *Restaurar*; versión vigente `v3 ●`; entrada de auditoría `AUTO ◧` atenuada de solo lectura.

### 7.3. Flujo (Mermaid)

```mermaid
flowchart TD
  A([Abrir Obra Digital]) --> MS[ModuleSwitcher]
  MS --> CD[Carpeta Digital] --> Tree[Árbol + 🗃️ Archivados]
  Tree --> VN[▾ Documentos de la carpeta (virtual)]
  VN --> Det[Versiones: 👁 Ver / ⬇ Descargar / 📥 Archivar]
  Det -- archivar --> Arc1[(estado=archivado)] --> ArcView1[🗃️ Archivados → ♻ Restaurar]
  CD --> Add[[+ Agregar archivo]] --> UUID[(storageRef UUID)] --> AudCL[[AUTO en Maestro]]

  MS --> LO[Libro de Obras] --> Idx[Sub-libro 🔒/abierto → Año → Mes]
  Idx -- cerrado --> Op[[📖 Abrir libro de obras]]
  Op --> Acta[(Acta de Apertura: fecha + texto)] --> Open[abierto=true]
  Idx -- abierto --> List[Folios (paginados, acordeón)]
  List --> FoArch[📥 Archivar entrada] --> ArcView2[🗃️ Archivados → ♻ Restaurar]
  LO --> NE[[Nueva entrada]] --> Adj[📎 Adjuntar archivos/imágenes] --> SaveE[(entrada + ym + increment)]
  SaveE --> AudLC[[Archiva en Carpeta ▸ Archivo comunicaciones]]
  MS --> PM[Permisos] --> Den[lectores[]/editores[] denormalizados]
```

---

## 8. Plan de trabajo (v4)

1. **Tipos** (`import type`): añadir `estado`, `adjuntos[]`, `abierto/aperturaFecha`, `apertura` a `ArchivoVersion`, `EntradaFolio`, `LibroDoc`.
2. **Catálogos** = transcripción literal del glosario (sin mutación); selector derivado para el nodo virtual.
3. **Carpeta**: árbol (`React.memo`+`useState` local), nodo virtual, versiones, **archivar/restaurar** + vista Archivados, Storage **UUID**.
4. **Libro**: apertura (`abierto`, Acta de Apertura), counters transaccionales (activos), paginación con cursores, acordeón, **adjuntos** (UUID), **archivar/restaurar** + vista Archivados.
5. **Permisos** denormalizados + Rules sin `get()` extra; *archivar* = `escritura`, *eliminar físico* = `editor`.
6. **Auditoría bidireccional** Carpeta↔Libro (transaccional; respeta `rutaCarpeta` normativa real).
7. **Integración**: `registry.ts`, lazy en `<ToolHost>`, índices compuestos (`libroId,estado,fecha`; `ym,estado,fecha`; `lectores array-contains,fecha`), pruebas de carga.

---

## 9. Referencias

- `index.html` — prototipo funcional **v4** (catálogo intacto + nodo virtual; archivar; adjuntos; apertura con Acta).
- `GLOSARIO_Normativo_ObraDigital.md` — fuente de verdad de los catálogos (textos literales de los manuales).
- Instructivo Carpeta Digital (jun. 2022); *Gestión de Comunicaciones en el LOD* (DGOP); Decreto 75/2004 (RCOP); Resolución DGOP 258/2009; Oficio DGOP 268/2016.
