# Memoria y Especificación — Complemento **Informe de Subsuelo** (Archibots) · v1

> Generador de informes para el **Informe simple de subsuelo**, complemento del subsistema Archibots, hermano del complemento Memoria de Ruta Accesible. Mismo lenguaje visual (`archibots.css`), mismo patrón de serialización + hook `postMessage`, mismo manejo de adjuntos. El catálogo literal vive en `GLOSARIO_Subsuelo.md`. El prototipo funcional es `index_subsuelo.html`.

---

## 0. Resumen

| # | Decisión | Estado |
|---|---|---|
| 1 | **7 tipos de suelo fijos** por horizonte (catálogo cerrado), idénticos en las 3 capas. | Vigente |
| 2 | Hasta **3 horizontes**; los vacíos o incompletos se excluyen de la tabla. | Vigente |
| 3 | **Vista previa de estratigrafía** en vivo con profundidad acumulada. | Vigente |
| 4 | Textos sugeridos editables (observaciones, mitigación). | Vigente |
| 5 | Adjuntos de fotografías (JPG/PNG, HEIC no). | Vigente |
| 6 | Misma compatibilidad Archibots que el complemento de Ruta Accesible. | Vigente |

---

## 1. Objetivo y alcance

Complemento aislado que genera el **Informe de Subsuelo** de un proyecto. El formulario captura la profundidad de la calicata, la estratigrafía referencial (hasta 3 horizontes), la presencia de napas, observaciones, aptitud para edificación y medidas de mitigación, además de fotografías de respaldo. Al generar, **serializa** toda la estructura para armar el PDF.

**ID sugerido en `registry.ts`:** `informe-subsuelo` · **Categoría:** `Suelos / Geotecnia` · lazy en `<ToolHost>`. Estilos heredados de `archibots.css`.

---

## 2. Secciones del formulario

| # | Sección | Tipo | Notas |
|---|---|---|---|
| 1 | Datos del informe | Número | Profundidad calicata (m), default 1,50. |
| 2 | Estratigrafía (Horizontes) | 3 tarjetas | Tipo de suelo (7 fijos) + Espesor (m). Vacíos se excluyen. |
| — | Vista previa estratigrafía | Tabla viva | Horizonte · Tipo · Espesor · Prof. acumulada. |
| 3 | Presencia de agua / napas | Selector | No / Sí. |
| 4 | Observaciones adicionales | Textarea editable | texto sugerido. |
| 5 | ¿Apto para edificación? | Selector | Sí / No / Condicionado (con pill de color). |
| 6 | Medidas de mitigación | Textarea editable | texto sugerido. |
| 7 | Fotografías | Adjuntos | JPG/PNG, múltiples. |

---

## 3. Tipos de suelo (catálogo fijo)

Los 7 tipos, idénticos para H-1, H-2 y H-3, en orden: **Suelo vegetal · Limo · Arcilla · Arena · Grava · Mixto (limo y arena) · Roca**. El selector incluye un placeholder "Seleccione" no contabilizado. Definidos en `TIPOS_SUELO` (`as const`).

---

## 4. Lógica de estratigrafía

- Cada horizonte aporta a la tabla **solo si** tiene tipo seleccionado **y** espesor > 0.
- La **profundidad acumulada** se calcula sumando los espesores de los horizontes incluidos, en orden.
- El **espesor total** es la suma de los horizontes válidos; se compara visualmente con la profundidad de calicata en el pie de la tabla.
- Horizontes vacíos/incompletos muestran una nota y se omiten en la serialización.

---

## 5. Modelo de datos serializado

```json
{
  "moduloActivo": true,
  "profundidadCalicata": 1.50,
  "estratigrafia": [
    { "idx": 1, "tipo": "Suelo vegetal", "espesor": 0.20, "profAcum": 0.20 }
  ],
  "espesorTotal": 1.50,
  "presenciaAgua": "No|Sí",
  "observaciones": "string",
  "aptoEdificacion": "Sí|No|Condicionado",
  "medidasMitigacion": "string",
  "fotografias": ["nombre1.jpg"]
}
```

### 5.1. Hook de integración

```js
// window.parent.postMessage({ type: 'informe-subsuelo:generar', payload: data }, '*');
```

para que el host de Archibots reciba la estructura y arme el PDF.

---

## 6. Plan de trabajo

1. **Tipos** (`import type`): `Horizonte`, `InformeSubsuelo`.
2. **Catálogo** `TIPOS_SUELO` (7 fijos) `as const`.
3. **Render** de 3 tarjetas de horizonte + vista previa de estratigrafía en vivo.
4. **Lógica** de inclusión (tipo + espesor) y profundidad acumulada.
5. **Adjuntos** (JPG/PNG) con previsualización y remoción.
6. **Serialización** + hook `postMessage` hacia el host Archibots.
7. **Integración**: `registry.ts`, lazy en `<ToolHost>`, generación PDF con firma del profesional.

---

## 7. Referencias

- `index_subsuelo.html` — prototipo funcional v1.
- `GLOSARIO_Subsuelo.md` — catálogo literal de campos y tipos de suelo.
- Complemento hermano: `MEMORIA_RutaAccesible.md`, `index.html`.
