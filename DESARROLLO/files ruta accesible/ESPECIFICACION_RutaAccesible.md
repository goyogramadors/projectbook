# Especificación UI — Complemento **Memoria de Ruta Accesible** (Archibots)

> Documento de diseño de interfaz. Define la distribución, los componentes visuales y el comportamiento del generador de informes de Ruta Accesible. Reutiliza el lenguaje visual de `archibots.css` (variables de tema, estética técnica/binder).

## Lenguaje visual

- **Hereda de Archibots.** Mismos tokens de color (`--bg-card`, `--bg-muted`, `--border-theme`, `--primary`, etc.), tipografía Inter, densidad media-alta, bordes finos en lugar de sombras.
- **Estado por color sobrio.** `Cumple` y las opciones afirmativas de 3.1 → verde; `No cumple` → rojo; `No aplica` → atenuado. El color se aplica solo al texto del selector, no al relleno.
- **Sin colores hardcodeados** fuera de la paleta base; listo para los 4 temas de Archibots.

---

## 1. Estructura general

Documento de una sola columna, scroll vertical, con header pegajoso y acción flotante.

```
┌──────────────────────────────────────────────────────────────┐
│ ☑ Memoria Ruta Accesible                                 ⌃   │ ← header sticky (checkbox módulo + colapsar)
├──────────────────────────────────────────────────────────────┤
│ 1) Encabezado / datos base    (3 + 2 campos autocompletados)  │
│ 2) Generalidades              (textarea editable)             │
│ 3) Verificaciones normativas  (tabla: ítem · estado · valor)  │
│ 4) Servicios higiénicos       (estado general + 9 subítems)   │
│ 5) Ducha                      (estado general + 5 subítems)   │
│ 6) Conclusión                 (textarea editable)             │
│ 7) Imágenes                   (hasta 4, JPG/PNG)              │
│ 8) Firma                      (texto informativo)            │
└──────────────────────────────────────────────────────────────┘
                                      [ Generar informe activo ] ← botón flotante (bottom-right)
```

---

## 2. Componentes por sección

### 2.1. Header

- Checkbox de **activación del módulo** (`#moduleOn`), título "Memoria Ruta Accesible", botón **colapsar/expandir** (`⌃`) que oculta el cuerpo.
- Pegajoso al hacer scroll (`position:sticky; top:0`).

### 2.2. Encabezado / datos base

- Grilla de **3 campos** (Nombre del proyecto, Ubicación, Arquitecto) + **2 campos** numéricos (Superficie referencial m2, Carga de ocupación).
- Editable pero pensado para autocompletarse desde el proyecto activo.
- Cambios en superficie/carga **sincronizan** el texto de Generalidades.

### 2.3. Generalidades

- `textarea` monoespaciada con el texto normativo por defecto. Editable.

### 2.4. Verificaciones normativas principales (grupos colapsables)

- Lista de **grupos colapsables** (las 8 cabeceras `1.`–`8.`). Cada **grupo viene colapsado** por defecto: cabecera con flecha `▶`, título del grupo y un resumen de estados (p. ej. "1 no cumple · 2 ok") visible aunque esté cerrado.
- Al desplegar un grupo, se ven **todos sus ítems con los checkboxes directamente** (no hay un segundo nivel de colapso por ítem). Cada ítem muestra título + descripción + referencia + **selección por checkboxes** (radios estilizados mutuamente excluyentes) + observación:
  - **Estándar**: `Cumple / No cumple / No aplica`.
  - **3.1** → 4 alternativas (`Contempla rampas / Contempla ascensor / Rampa y ascensor / No aplica`).
  - **2.1** → además del checkbox, debajo se inserta el **bloque asistido** con cálculo OGUC.
- Botón flotante **Expandir todo / Colapsar todo** (opera sobre grupos y subítems de 4/5).

#### Bloque asistido (ítem 2.1) — cálculo OGUC

Tarjeta embebida:

- Checkbox **Usar carga de ocupación total** + subtítulo aclaratorio.
- Campos: **Carga de ocupación total** (persistente con el encabezado), **Número de vías de evacuación / salidas**, **ancho mínimo a usar para la ruta acesible (m)**.
- Salidas: **Ancho exigido OGUC · Ancho exigido por vía · Ancho mínimo aplicable**.
- **Verificación** verde/roja que propaga el estado del ítem 2.1.
- Fórmula OGUC (Art. 4.2.18 / 4.2.5): `ancho = 0,005 m × (carga ÷ N° vías)`, con piso normativo de 1,10 m.

### 2.5b. Persistencia de carga de ocupación

El campo de carga del **encabezado (1)** y el del **bloque asistido (2.1)** comparten el mismo dato: editar cualquiera actualiza el otro, recalcula el ancho OGUC y sincroniza el texto de Generalidades.

### 2.5. Sub-bloques (Servicios higiénicos · Ducha)

- Barra **Estado general** con botones segmentados (`Aplica` / `No aplica`).
- Subítems **colapsados** por defecto, cada uno con flecha `▶`, *pill* de estado y checkboxes (`ESTADO_3`) + observación al desplegar.
- Si el estado general es **No aplica**, los subítems se **ocultan completamente** y solo reaparecen si el usuario vuelve a **Aplica** (no se despliegan por sí solos).

### 2.6. Conclusión

- `textarea` con sugerencia automática editable.

### 2.7. Imágenes

- Zona con botón **Elegir archivos** + estado de selección.
- Previsualización en miniaturas (96×96) con botón **×** para remover. Máximo 4. JPG/PNG.
- Nota: no persisten por limitación del navegador.

### 2.8. Firma

- Texto informativo (datos del arquitecto al generar PDF) + nota de "Estructura serializada actualizada".

### 2.9. Acción flotante

- Botón primario **Generar informe activo**, fijo abajo-derecha, sombra suave. Dispara la serialización y el hook de integración.

---

## 3. Estados y comportamiento

| Estado | Señal visual |
|---|---|
| `Cumple` / afirmativos de 3.1 / `Aplica` | texto verde en el selector. |
| `No cumple` | texto rojo. |
| `No aplica` | texto atenuado. |
| Estado general `No aplica` | sub-tabla atenuada y no interactiva. |
| 2.1 cumple / no cumple | línea de verificación verde/roja + propagación al selector. |
| Módulo colapsado | cuerpo oculto, header visible. |
| Imágenes seleccionadas | miniaturas con remoción; contador en el estado de archivo. |

---

## 4. Responsive

| Breakpoint | Comportamiento |
|---|---|
| **≥ 900px** | Tablas a 3 columnas; grillas de encabezado a 3/2 columnas. |
| **< 900px** | Grillas y tablas colapsan a **una columna apilada**; se ocultan las cabeceras de columna y cada control se apila bajo su etiqueta de ítem. |

---

## 5. Mapeo componente ↔ dato serializado

| Componente UI | Campo en payload |
|---|---|
| Encabezado (5 campos) | `encabezado.*` |
| Generalidades | `generalidades` |
| Filas de la tabla 3 | `verificaciones[]` (`id`, `titulo`, `estado`, `observacion`) |
| Bloque asistido 2.1 | propaga `estado` del ítem `2.1` |
| Sub-bloque Servicios higiénicos | `serviciosHigienicos` (`estadoGeneral`, `subitems[]`) |
| Sub-bloque Ducha | `ducha` (`estadoGeneral`, `subitems[]`) |
| Conclusión | `conclusion` |
| Imágenes | `imagenes[]` (nombres) |
| Checkbox módulo | `moduloActivo` |
