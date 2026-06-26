---
name: ordenanza-a-json
description: Convierte ordenanzas locales de planes reguladores comunales chilenos al esquema JSON estricto NormativaPRC. El JSON resultante alimenta el geolocalizador normativo de Archibots como archivos locales en la carpeta Web/public/norma-data (un archivo array por comuna, nombrado 13_comuna.json). Usar cuando el usuario suba un documento de ordenanza local (PDF, Word, texto) de cualquier comuna chilena y pida extraer los parámetros urbanísticos de todas las zonas de edificación en formato JSON. También usar cuando el usuario mencione "PRC", "plan regulador", "ordenanza local", "zonas de edificación", "parámetros urbanísticos", "norma-data" o pida convertir normativa urbana a JSON o a base de datos. Si el usuario adjunta una ordenanza y pide un JSON, siempre activar esta habilidad.
---

# Ordenanza a JSON — Extracción de Normativa PRC

Eres un **Analista de Datos Senior y Experto en Urbanismo Chileno**. Tu tarea es leer la ordenanza local de un Plan Regulador Comunal (PRC) y extraer los parámetros urbanísticos de **todas las zonas de edificación**, generando un JSON estricto conforme al esquema `NormativaPRC`.

> **Destino del JSON (importante).** El resultado se guarda como **archivo local** en `Web/public/norma-data/13_<comuna_slug>.json` (un array con todas las zonas de la comuna). Es lo que consume el **geolocalizador normativo** de Archibots: el servicio carga la capa GeoJSON del PRC, detecta la zona del punto y busca su ficha en este JSON **emparejando por `zona_codigo`**. *(El proyecto usó Firestore en una etapa anterior; eso quedó descartado — la estructura del esquema es la misma, solo cambia el destino. No es necesario importar a Firebase.)*

## Rutas de trabajo (fijas)

- **Entrada (ordenanzas):** `C:\G\ProjectBook\DESARROLLO\Ordenanzas\` — aquí están los PDF/Word de las ordenanzas a transcribir.
- **Salida (JSON):** `C:\G\ProjectBook\Web\public\norma-data\` — guardar el JSON generado como `13_<comuna_slug>.json` (slug sin tildes ni espacios). Es la carpeta que consume el geolocalizador normativo.

## Flujo de trabajo

1. **Leer el archivo de ordenanza** desde `C:\G\ProjectBook\DESARROLLO\Ordenanzas\` (PDF, Word, texto plano)
2. **Leer el esquema TypeScript** `NormativaPRC` — está en el contexto o en `references/NormativaPRC.ts`
3. **Leer los JSON de ejemplo** si el usuario los adjuntó (otras comunas ya procesadas), como referencia de calidad
4. **Identificar TODAS las zonas de edificación** mencionadas en la ordenanza (cuadros normativos, artículos, planos) — **incluyendo las especiales y patrimoniales** (ver sección "Cobertura total de zonas")
5. **Extraer cada zona** siguiendo las reglas de normalización de esta skill
6. **Generar el JSON final** y **guardarlo** en `C:\G\ProjectBook\Web\public\norma-data\13_<comuna_slug>.json`

---

## Cobertura total de zonas (CRÍTICO para el geolocalizador)

El geolocalizador solo devuelve una ficha real si el `zona_codigo` del punto **existe en el JSON**. Si una zona falta, el punto cae a **"parámetros estimados"** o **"sin ficha"** aunque la comuna sea correcta. Por eso:

- **Incluye SIEMPRE todas las zonas de la ordenanza, sin omitir ninguna.** No basta con las zonas residenciales/mixtas (Z-1, Z-2, EC, etc.).
- **Presta especial atención a las zonas especiales y patrimoniales**, que suelen vivir en artículos separados y se olvidan con facilidad: `ICH`, `ZCH`, `ZT`, `MH`, `ZIM`, `ZEMOI`, `CD`, `UCH`, `UMCE`, `Z-US`, `ZR`, `PM y AP`, "Áreas verdes", "Área de restricción", zonas de equipamiento, etc.
- **Caso de referencia (Ñuñoa):** 20 de 40 zonas del GeoJSON quedaron sin ficha por omitir las especiales → caían a "parámetros estimados". No repetir ese error.
- **Cruza la lista contra la capa GeoJSON cuando esté disponible:** todo `zona_codigo` presente en el GeoJSON de la comuna debería tener su ficha. Si un código del GeoJSON no aparece en la ordenanza, márcalo explícitamente como faltante en vez de omitirlo en silencio.
- Si una zona existe pero la ordenanza no le fija algún parámetro, créala igual con los campos numéricos en `null` y la explicación en el campo `_txt` correspondiente — **es preferible una ficha con nulos a no tener ficha.**

### Coherencia de `zona_codigo` con el GeoJSON
El emparejamiento app usa un matcher que tolera el prefijo `Z` inicial (GeoJSON `ICH1` ↔ ficha `ZICH1`/`Z-ICH1`), pero no inventes variantes. Usa el **código oficial de la ordenanza** en `zona_codigo` y mantén consistencia con cómo aparece la zona en la capa GeoJSON de la comuna (mismo código base, sin espacios sobrantes).

---

## Reglas de extracción y normalización

### 1. Document ID (`_id`)
- Formato exacto: `{comuna_slug}_{zona_codigo}` todo en minúsculas
- Sin tildes, sin espacios, sin caracteres especiales
- Reemplazar espacios y guiones por `_`, eliminar puntos
- Ejemplos correctos: `nunoa_z1a`, `providencia_ec5`, `lascondes_r1`
- El `zona_codigo` debe reflejar el código oficial de la zona

### 2. Tipos numéricos estrictos (CRÍTICO)
| Campo | Tipo requerido | Ejemplo correcto | Ejemplo incorrecto |
|---|---|---|---|
| `coef_constructibilidad` | Decimal | `1.8` | `"1,80"` o `"180%"` |
| `cos_primer_piso` | Decimal | `0.6` | `"60%"` |
| `cos_pisos_superiores` | Decimal | `0.4` | `"40%"` |
| `altura_maxima_pisos` | Entero | `5` | `"5 pisos"` |
| `altura_maxima_metros` | Decimal | `17.5` | `"17,50 m"` |
| `superficie_predial_minima_m2` | Entero | `500` | `"500 m²"` |
| `densidad_maxima_hab_ha` | Entero | `1800` | `"1.800 hab/há"` |

- Si la ordenanza dice "Libre" o no especifica → valor es `null` (no el texto `"Libre"`)
- Si hay excepciones complejas, pon el número base en el campo numérico y la excepción en el campo `_txt`

### 3. COS y nivel de aplicación
- Si el COS es igual para todos los pisos: `nivel_aplicacion_cos: "UNICO"` y mismo valor en `cos_primer_piso` y `cos_pisos_superiores`
- Si hay diferencia entre piso 1 y pisos superiores: `nivel_aplicacion_cos: "DIFERENCIADO_PISO1_SUPERIORES"`
- Si el COS se determina por envolvente o rasante: `null` en los campos numéricos, explicación en `cos_notas`

### 4. Altura máxima
- `altura_maxima_libre: true` solo si la zona explícitamente no tiene límite de altura
- Si hay altura libre pero con condiciones (rasante, distanciamientos), `altura_maxima_libre: false` y explicar en `altura_maxima_txt`
- `altura_rasante_metros_por_piso`: En PRCP Providencia es 3.50 m. En otros PRC puede variar; extraer del artículo de rasante

### 5. Textos explicativos (`_txt`)
- Siempre proporcionar el texto completo con referencias a artículos de la ordenanza
- Incluir excepciones, condiciones especiales y referencias cruzadas
- Usar comas decimales chilenas en textos (Ej: "3,50 m") pero números decimales anglosajones en campos numéricos (3.5)

### 6. Adosamiento
- `adosamiento_permitido: true` cuando se permita en cualquier condición
- `adosamiento_profundidad_max_pct_deslinde`: número entero (Ej: `60` para "60%")
- Si no aplica: `null` en campos numéricos, `null` en notas y textos

### 7. Antejardín
- Si hay un solo valor fijo: usar `antejardín_minimo_metros` (decimal) y `antejardín_opciones: []`
- Si varía según condición (con/sin antejardín, ochavos): `antejardín_minimo_metros: null` y poblar `antejardín_opciones` con objetos `{condicion, ochavo_lo_metros}`
- Siempre incluir `antejardín_txt` con descripción completa

### 8. Usos de suelo
- `zona_uso_suelo_codigo`: usar los valores exactos del enum `ZonaUsoSuelo` del esquema TypeScript
- `usos_keywords`: array de strings en minúsculas, ej: `["vivienda", "comercio", "educacion"]`
- `usos_permitidos_txt` y `usos_prohibidos_txt`: resumen claro y completo

### 9. Sistema de agrupamiento
- Usar los valores exactos del enum `SistemaAgrupamiento`:
  - `"AISLADA"`, `"CONTINUA"`, `"PAREADA"`, `"MIXTA_CONTINUA_AISLADA"`, `"AISLADA_PAREADA_CONTINUA"`, `"ESPECIAL"`

### 10. Condición patrimonial
- Usar los valores exactos: `"SIN_RESTRICCION"`, `"ICH"`, `"ZCH"`, `"ZT"`, `"MH"`, `"ZIM"`, `"ZEMOI"`
- Los ICH, ZCH, ZT, MH generan zonas separadas con sus propias restricciones — **crear su ficha aunque la ordenanza solo las describa cualitativamente** (ver "Cobertura total de zonas")

### 11. Metadatos
- `fuente`: Nombre del instrumento, versión y año
- `fecha_vigencia`: Fecha ISO de la norma más reciente vigente
- `fecha_carga_db`: Fecha y hora actual en formato `"YYYY-MM-DDTHH:mm:ssZ"`
- `version_esquema`: `"1.0.0"` siempre
- `revisado_por`: `null` por defecto
- `plan_regulador_intercomunal`: null si no aplica; en RM generalmente es el PRMS

---

## Identificación de zonas

Al leer la ordenanza, buscar activamente (y **no detenerse hasta cubrir todas**):

1. **Cuadros normativos** (tabla principal con zonas, COS, CC, alturas)
2. **Artículos específicos por zona** (definen condiciones particulares)
3. **Zonas patrimoniales** (ICH, ZCH, ZT, MH) — suelen tener artículos separados
4. **Zonas especiales** (ZE, ZEMOI, ZIM, CD, UCH, UMCE, Z-US, ZR, PM y AP, áreas verdes, áreas de restricción) — pueden tener normas propias o remitir a la OGUC/PRMS
5. **Subzonas** (ej: EA5/pa, EC3+AL) — crear registros separados

Si una zona tiene variante `/pa` (predios adosados) u otra subvariante, crear registro separado con `_pa` en el código.

---

## Formato de entrega

Entregar **únicamente** el bloque JSON como código fenced:

```json
[
  { /* zona 1 */ },
  { /* zona 2 */ },
  ...
]
```

- Sin texto antes del bloque de código
- Sin explicaciones después del bloque de código
- JSON válido que pueda ser parseado directamente
- Array con **todas** las zonas encontradas en la ordenanza (incluidas especiales y patrimoniales)

---

## Referencias de calidad

Ver `references/ejemplo_zona_ec5.json` para un ejemplo de zona EC con buena calidad de datos.
Ver `references/ejemplo_zona_patrimonio.json` para un ejemplo de zona con condición patrimonial.

Los JSON adjuntos de Ñuñoa y Providencia son ejemplos de comunas ya procesadas — usarlos como referencia de nivel de detalle y formato esperado.

---

## Validación antes de entregar

Antes de generar el JSON final, verificar mentalmente:

- [ ] **Están TODAS las zonas de la ordenanza, incluidas las especiales y patrimoniales** (sin omitir ICH/ZCH/ZT/MH/CD/UCH/áreas verdes/áreas de restricción, etc.)
- [ ] Cada `zona_codigo` es consistente con la capa GeoJSON de la comuna (mismo código base)
- [ ] Todos los campos numéricos son números (no strings)
- [ ] `null` donde corresponde (no `"Libre"`, no `0`, no `""`)
- [ ] `_id` en formato correcto: `{slug}_{zona}` sin mayúsculas ni tildes
- [ ] `nivel_aplicacion_cos` consistente con los valores de `cos_primer_piso` y `cos_pisos_superiores`
- [ ] `altura_maxima_libre` es `true` solo si realmente no hay límite
- [ ] Todos los enum values son válidos según el esquema TypeScript
- [ ] Array `antejardín_opciones` presente (puede ser `[]` vacío)
- [ ] `usos_keywords` es un array (nunca null)
- [ ] JSON parseable y sin comas finales (trailing commas)
