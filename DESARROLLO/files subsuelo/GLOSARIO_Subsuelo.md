# Glosario — **Informe de Subsuelo** (Archibots)

> Fuente de verdad del complemento generador del Informe de Subsuelo. Transcripción literal de campos, etiquetas y textos por defecto tal como aparecen en el formulario. El código (`index_subsuelo.html`) refleja estos textos `as const`, sin mutación. Comparte el patrón de UI y compatibilidad con Archibots del complemento Memoria de Ruta Accesible.

---

## 0. Tipos de suelo (catálogo fijo de 7)

Los 7 tipos de suelo disponibles para cada horizonte son **siempre los mismos**, en este orden, con la opción "Seleccione" como placeholder no seleccionable:

| valor | etiqueta |
|---|---|
| `vegetal` | Suelo vegetal |
| `limo` | Limo |
| `arcilla` | Arcilla |
| `arena` | Arena |
| `grava` | Grava |
| `mixto` | Mixto (limo y arena) |
| `roca` | Roca |

> En el código se almacenan como las etiquetas literales (`"Suelo vegetal"`, `"Limo"`, …) dentro de `TIPOS_SUELO`.

---

## 1. Datos del informe

> Datos del informe (completar solo si generas Informe de Subsuelo).

| Campo | Tipo | Valor por defecto |
|---|---|---|
| Profundidad calicata (m) | número | `1,50` |

---

## 2. Estratigrafía referencial (Horizontes)

> Completa hasta 3 horizontes. Si dejas alguno vacío, no se incluirá en la tabla.

Tres tarjetas (**Horizonte H-1**, **H-2**, **H-3**), cada una con:

- **Tipo de suelo H-n** — selector con los 7 tipos fijos (+ "Seleccione").
- **Espesor (m)** — número.

Valores por defecto (espejo de las imágenes):

| Horizonte | Tipo de suelo | Espesor (m) |
|---|---|---|
| H-1 | Suelo vegetal | 0,20 |
| H-2 | Mixto (limo y arena) | 0,40 |
| H-3 | Limo | 0,90 |

**Regla de inclusión:** un horizonte se incluye en la tabla/estratigrafía sólo si tiene **tipo seleccionado** y **espesor > 0**. Los horizontes vacíos o incompletos se marcan como "no se incluirá en la tabla" y se omiten en la serialización.

**Vista previa de estratigrafía:** tabla en vivo con Horizonte · Tipo · Espesor · Profundidad acumulada, más el pie con la profundidad de calicata.

---

## 3. Presencia de agua / napas freáticas

| Campo | Tipo | Opciones | Default |
|---|---|---|---|
| Presencia de agua / napas freáticas | selector | No / Sí | `No` |

---

## 4. Observaciones adicionales (texto por defecto)

> Texto sugerido editable: puedes mantenerlo, modificarlo o borrarlo.

```
La capa superficial se compone de pasto y raíces. El terreno no presenta variaciones de pendiente
```

---

## 5. ¿Apto para edificación?

| Campo | Tipo | Opciones | Default |
|---|---|---|---|
| ¿Apto para edificación? | selector | Sí / No / Condicionado | `Sí` |

Un *pill* junto a la etiqueta refleja el estado: verde (Sí), rojo (No), ámbar (Condicionado).

---

## 6. Medidas de mitigación (si aplica) (texto por defecto)

> Texto sugerido editable: puedes mantenerlo, modificarlo o borrarlo.

```
-Se debe considerar drenaje perimetral o zanjas de infiltración si existe humedad/napa cercana.
- Retiro de capa orgánica y compactación de subrasante antes de fundar.
```

---

## 7. Fotografías (opcional)

- Adjuntos de imagen.
- Formatos: **JPG/JPEG y PNG**. (HEIC no).
- *Para seleccionar varias: mantén presionado Cmd (o Shift) al elegir, o arrastra varias a la vez.*

---

## 8. Estructura serializada

```json
{
  "moduloActivo": true,
  "profundidadCalicata": 1.50,
  "estratigrafia": [
    { "idx": 1, "tipo": "Suelo vegetal", "espesor": 0.20, "profAcum": 0.20 },
    { "idx": 2, "tipo": "Mixto (limo y arena)", "espesor": 0.40, "profAcum": 0.60 },
    { "idx": 3, "tipo": "Limo", "espesor": 0.90, "profAcum": 1.50 }
  ],
  "espesorTotal": 1.50,
  "presenciaAgua": "No",
  "observaciones": "string",
  "aptoEdificacion": "Sí|No|Condicionado",
  "medidasMitigacion": "string",
  "fotografias": ["foto1.jpg"]
}
```

### Hook de integración

```js
// window.parent.postMessage({ type: 'informe-subsuelo:generar', payload: data }, '*');
```
