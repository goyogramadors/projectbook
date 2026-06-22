# Memoria y Especificación — Complemento **Memoria de Ruta Accesible** (Archibots) · v1

> Generador de informes para la **Memoria de Ruta Accesible**, complemento del subsistema Archibots. Replica literalmente la estructura de revisión normativa de accesibilidad universal (OGUC art. 4.1.7 y atingentes 4.2.5, 4.2.18, 4.5.8, 6.4.2). El catálogo de ítems literal vive en `GLOSARIO_RutaAccesible.md` (fuente de verdad). El detalle de interfaz vive en `ESPECIFICACION_RutaAccesible.md`. El prototipo funcional es `index.html`.

---

## 0. Resumen

| # | Decisión | Estado |
|---|---|---|
| 1 | Catálogo de ítems **idéntico al glosario** (`as const` en código), sin mutación en runtime. | Vigente |
| 2 | Estado por ítem mediante **checkboxes** (Cumple / No cumple / No aplica), no selector. | v2 |
| 3 | El ítem **3.1** usa 4 alternativas (incluye "No aplica"). | Vigente |
| 4 | El ítem **2.1** se calcula con **fórmula OGUC** (Art. 4.2.18 / 4.2.5). | v2 |
| 5 | **Grupos** (1, 2, 3…) colapsables; los checkboxes de cada ítem se ven directamente al abrir el grupo. | v2 |
| 6 | Bloques con estado general **No aplica** permanecen colapsados hasta volver a Aplica. | v2 |
| 7 | **Carga de ocupación persistente** entre encabezado y bloque 2.1. | v2 |
| 8 | Encabezado autocompletado; firma del arquitecto al generar PDF. | Vigente |
| 9 | Adjuntos: hasta **4 imágenes** (JPG/PNG). | Vigente |

---

## 1. Objetivo y alcance

Complemento aislado dentro de Archibots que genera la **Memoria de Ruta Accesible** de un proyecto de edificación pública. El formulario:

- **Carga datos base** (nombre de proyecto, ubicación, arquitecto, superficie, carga de ocupación) desde el cliente/proyecto activo.
- **Pre-rellena la sección de Generalidades** con texto normativo editable, sincronizado con superficie y carga.
- **Estructura la revisión** en 8 grupos de verificaciones principales + 2 sub-bloques (Servicios higiénicos accesibles, Ducha).
- **Calcula** el ancho mínimo aplicable de la ruta (ítem 2.1) en un bloque asistido.
- **Serializa** toda la estructura para generar el PDF / informe activo.

**ID sugerido en `registry.ts`:** `ruta-accesible` · **Categoría:** `Accesibilidad / Normativa` · lazy en `<ToolHost>`. Estilos heredados de `archibots.css` (variables de tema).

---

## 2. Secciones del formulario

| # | Sección | Tipo | Notas |
|---|---|---|---|
| 1 | Encabezado / datos base | Campos autocompletados | nombre, ubicación, arquitecto (texto); superficie, carga (numérico). |
| 2 | Generalidades | Textarea editable | texto sugerido; se sincroniza con superficie/carga. |
| 3 | Verificaciones normativas principales | Tabla ítem · estado · valor | 8 grupos; selector estándar salvo 3.1 (selector propio) y 2.1 (bloque asistido). |
| 4 | Servicios higiénicos accesibles | Sub-bloque (estado general + 9 subítems) | estado general Aplica/No aplica deshabilita la sub-tabla. |
| 5 | Ducha | Sub-bloque (estado general + 5 subítems) | igual patrón que sección 4. |
| 6 | Conclusión | Textarea editable | sugerencia automática según cumplimiento. |
| 7 | Imágenes | Adjuntos | hasta 4, JPG/PNG, no persistentes. |
| 8 | Firma | Texto informativo | datos del arquitecto al generar PDF. |

---

## 3. Estados por ítem

### 3.1. Estado estándar (`ESTADO_3`)

Aplica a **todos** los ítems de la sección 3 (salvo 3.1) y a los subítems de las secciones 4 y 5:

- **Cumple** (verde)
- **No cumple** (rojo)
- **No aplica** (atenuado)

### 3.2. Estado del ítem 3.1 (`EST_3_1`)

El ítem **3.1 Desniveles salvados mediante rampas y ascensores** usa un selector propio de 4 opciones:

- **Contempla rampas**
- **Contempla ascensor**
- **Rampa y ascensor**
- **No aplica**

> El requisito explícito del encargo: 3.1 tiene un selector distinto **pero también debe incluir "No aplica"**. Cumplido.

---

## 4. Bloque asistido — ítem 2.1

El ítem **2.1 Ancho de ruta entre salida y espacio público** no se evalúa con un simple selector: su estado se **calcula**.

### 4.1. Entradas

- **Usar carga de ocupación total** (checkbox, activo por defecto — modo recomendado para proyectos de hasta 2 pisos).
- **Carga de ocupación total** (número).
- **Número de vías de evacuación / salidas** (número, ≥ 1).
- **Ancho mínimo a usar para la ruta accesible (m)** (número, default 1,1).

### 4.2. Salidas calculadas

- **Ancho total exigido** = carga × factor por persona.
- **Ancho exigido por vía** = ancho total exigido / número de vías.
- **Ancho mínimo aplicable** = máx(ancho mínimo declarado, ancho exigido por vía).
- **Verificación**: *Cumple* si el ancho proyectado declarado ≥ ancho mínimo aplicable; en caso contrario, *No cumple*.

El resultado **propaga automáticamente** el estado del ítem 2.1 (Cumple / No cumple) en la tabla principal.

> El factor por persona del prototipo es un placeholder (criterio simplificado). Debe parametrizarse contra la tabla oficial DS 47 / OGUC vigente en la integración real.

---

## 5. Modelo de datos serializado

Al pulsar **Generar informe activo** se produce la estructura:

```json
{
  "moduloActivo": true,
  "encabezado": {
    "nombre": "string", "ubicacion": "string", "arquitecto": "string",
    "superficie": 0, "carga": 0
  },
  "generalidades": "string",
  "verificaciones": [
    { "id": "1.1", "titulo": "...", "estado": "Cumple|No cumple|No aplica|<3.1>", "observacion": "string" }
  ],
  "serviciosHigienicos": {
    "estadoGeneral": "Aplica|No aplica",
    "subitems": [ { "subitem": "...", "estado": "Cumple|No cumple|No aplica", "observacion": "string" } ]
  },
  "ducha": {
    "estadoGeneral": "Aplica|No aplica",
    "subitems": [ { "subitem": "...", "estado": "...", "observacion": "string" } ]
  },
  "conclusion": "string",
  "imagenes": ["nombre1.jpg", "..."]
}
```

### 5.1. Hook de integración

El prototipo expone el `payload` por consola y deja preparado:

```js
// window.parent.postMessage({ type: 'ruta-accesible:generar', payload: data }, '*');
```

para que el host de Archibots reciba la estructura y arme el PDF (con la firma del arquitecto registrada).

---

## 6. Plan de trabajo

1. **Tipos** (`import type`): `EncabezadoBase`, `VerificacionItem`, `SubBloque`, `MemoriaRutaAccesible`.
2. **Catálogo** = transcripción literal del glosario (`GROUPS`, `SHH`, `DUCHA`) `as const`.
3. **Render** de tabla principal + bloque asistido (2.1) + selector propio (3.1).
4. **Sub-bloques** 4 y 5 con estado general que deshabilita la sub-tabla.
5. **Adjuntos** (hasta 4, JPG/PNG) con previsualización y remoción.
6. **Serialización** + hook `postMessage` hacia el host Archibots.
7. **Integración**: `registry.ts`, lazy en `<ToolHost>`, generación PDF con firma del arquitecto.

---

## 7. Referencias

- `index.html` — prototipo funcional v1 (formulario completo + cálculo asistido).
- `GLOSARIO_RutaAccesible.md` — catálogo literal de ítems normativos.
- `ESPECIFICACION_RutaAccesible.md` — diseño de interfaz.
- OGUC art. 4.1.7 y artículos atingentes 4.2.5, 4.2.18, 4.5.8 y 6.4.2.
