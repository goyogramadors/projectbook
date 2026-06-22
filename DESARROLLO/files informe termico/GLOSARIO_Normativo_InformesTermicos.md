# Glosario Normativo Literal — Subsistema **Generador de Informes Térmicos** (Archibots)

> Catálogo de referencia con los **términos, parámetros, tablas y catálogos** que sustentan la Reglamentación Térmica (RT) chilena actualizada, vigente desde el **28 de noviembre de 2025** (publicada en el Diario Oficial el 27 de mayo de 2024). Es la **fuente de verdad** de los catálogos estáticos (`catalog/`) del subsistema.
>
> **Fuentes:** Actualización de la *Reglamentación Térmica* (Minvu, OGUC art. 4.1.10); *Zonificación Térmica Nacional* (Minvu–DITEC, 9 zonas A–I); *Tabla Zonas Térmicas por Región / Provincia / Comuna*; fichas técnicas DITEC; normas NCh aplicables (NCh 853, NCh 3296/3297, NCh 3309, NCh 3295, ISO 10456).
>
> **Estado de completitud:** los catálogos normativos (zonas, comunas, estructura de pasos) están **cerrados**. Las **tablas de exigencia numérica por zona** (Tablas 1, 3, 5, 6, 10, 12) y el **catálogo completo de materiales** quedan marcados **`POR COMPLETAR`** hasta cargar los valores oficiales definitivos; los valores incluidos aquí son los que aparecen en la web de referencia y en las fichas adjuntas, y se identifican como tales.

---

## 0. Convenciones y notación

| Símbolo | Significado | Unidad |
|---|---|---|
| `λ` (lambda) | Conductividad térmica del material. **λ bajo → mejor aislación.** | W/m·K |
| `μ` (mu) | Factor de resistencia a la difusión del vapor. **μ bajo → mayor permeabilidad al vapor.** | adimensional |
| `ρ` (rho) | Densidad del material. | kg/m³ |
| `R` | Resistencia térmica de una capa = `e / λ`. | m²·K/W |
| `U` | Transmitancia térmica del complejo. **U baja → mejor aislación del complejo.** | W/m²·K |
| `Rt` | Resistencia térmica total del complejo (incluye Rsi + Rse). | m²·K/W |
| `R100` | Índice de aislación = `(e/λ) × 100`, con `e` en metros. | — |
| `Sd` | Espesor de aire equivalente a la difusión de vapor de una capa. | m |
| `e` | Espesor de la capa. | mm (catálogo) / m (fórmulas) |
| `Upvm` | Transmitancia ponderada ventana–muro. | W/m²·K |
| `Uw` | Transmitancia térmica de la ventana. | W/m²·K |
| `Qtot` | Caudal total mínimo de ventilación. | L/s o m³/h |

> Convención de orden de capas de un complejo: **INTERIOR → EXTERIOR**.

---

## 1. Zonificación Térmica Nacional — 9 zonas (A → I)

La RT actualizada **reemplaza las 7 zonas anteriores por 9 zonas térmicas (A a I)**, reconociendo la diversidad climática, la oscilación térmica, la radiación, el efecto del mar, los valles centrales y la cordillera de los Andes. La zona de un proyecto se determina por **comuna** y, en varias comunas, además por **meridiano (longitud)** y/o **altitud (m.s.n.m.)**.

| Zona | Carácter climático (referencial) | Color cartográfico Minvu |
|---|---|---|
| **A** | Más cálida / extremo norte y costa norte | Amarillo |
| **B** | Norte interior / valles bajos | Naranjo |
| **C** | Costa centro-norte / litoral central | Rojo |
| **D** | Valle central (incluye RM) | Magenta/Rosa |
| **E** | Secano costero / Biobío-Ñuble costa | Verde claro |
| **F** | Precordillera centro-sur / interior sur | Verde |
| **G** | Sur lluvioso (Los Ríos, Los Lagos) | Celeste |
| **H** | Altiplano / alta montaña (≥ umbral altitud) | Azul medio |
| **I** | Austral / extremo sur (Aysén, Magallanes) | Azul oscuro |

> **Regla de desempate por altitud y meridiano.** Una misma comuna puede pertenecer a 2 o 3 zonas según el emplazamiento puntual del proyecto. El subsistema resuelve la zona efectiva con la jerarquía: **comuna → (si aplica) altitud → (si aplica) meridiano**. Ejemplos literales de la tabla oficial:

- **Antofagasta:** A si `meridiano ≥ 70°`; B si `< 70°` y `altitud < 3.000`; H si `altitud ≥ 3.000`.
- **Copiapó:** A si `> 70°44'`; B si `≤ 70°44'` y `< 3.000`; H si `≥ 3.000`.
- **La Serena:** C si `> 71°`; B si `≤ 71°`.
- **Ovalle:** C si `> 71°15'`; B si `≤ 71°15'`.
- **Lo Barnechea (RM):** D si `altitud < 2.000`; H si `≥ 2.000`.
- **San José de Maipo (RM):** D si `< 2.000`; H si `≥ 2.000`.
- **Colina (RM):** D si `< 2.000`; H si `≥ 2.000`.
- **La Unión (Los Ríos):** G si `> 73°15'`; F si `≤ 73°15'`.

> **Catálogo comuna→zona:** la tabla *Región / Provincia / Comuna / Zona Térmica / Límite (meridiano, altitud)* es la **fuente de verdad** de la selección de zona. Se transcribe `as const` en `catalog/zonas.ts`. **`POR COMPLETAR`**: validar el archivo contra la última versión oficial Minvu antes de producción (la tabla adjunta cubre las 16 regiones y sus comunas).

### 1.1. Zona por defecto del cliente

Cuando el proyecto se asocia a un **cliente** de Archibots con comuna definida, la zona se **deriva automáticamente** (mostrando los selectores de altitud/meridiano solo si la comuna lo exige). Si no hay cliente o falta la comuna, la UI muestra **"Falta comuna (cliente)"** / **"Selecciona un cliente para obtener comuna/zona"** y bloquea la generación del informe.

---

## 2. Catálogo de materiales (capas)

Cada material del listado desplegable se identifica con la cadena:

```
<familia> · <nombre> · λ <valor> W/m·K · ρ <valor> kg/m³ · μ <valor> · <fuente>
```

Las fuentes son **ISO 10456** (catálogo internacional de propiedades), **DITEC** (fichas técnicas nacionales acreditadas, Minvu) y **LOSCAT** (catálogo de soluciones constructivas). Algunos ítems especiales (cámaras de aire, barreras/membranas, pinturas/retardadores de vapor) traen `Sd` o solo `μ`.

> **Categorización por tipo de material.** El catálogo se agrupa en **25 categorías físicas**. Los materiales DITEC **no** se agrupan por proveedor: se clasifican según **qué material son** (un aislante DITEC vive en *Aislantes térmicos*; una pintura DITEC en *Pinturas y barnices*; etc.). La columna **Fuente** conserva la procedencia (DITEC / ISO 10456 / LOSCAT). El selector de la UI filtra **por categoría** (ver `index.html`).

> **Estado: COMPLETO** (204 materiales transcritos del listado oficial). Quedan abiertas solo las que el listado no expone con valor numérico (algunos `λ`/`ρ` ausentes en barreras y pinturas, marcados "—").

### Adhesivos, revoques y estucos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Adhesivo EIFS | — | — | 60 | — | DITEC |
| DITEC · Espuma niveladora | — | — | 3029 | — | DITEC |
| DITEC · Estuco cemento (18% agua) | 1.4 | — | 32 | — | DITEC |
| DITEC · Estuco EIFS | — | — | 13 | — | DITEC |
| DITEC · Revoque fino de tierra (2½ arena gruesa, 1½ arena fina, 1 arcilla y agua) | 0.55 | — | 13 | — | DITEC |
| DITEC · Revoque grueso de tierra (2½ arena gruesa, 1½ arena fina, 1 arcilla, ½ paja, 1 agua) | 0.74 | — | 17 | — | DITEC |

### Agua / nieve / hielo

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| agua · agua a 10 °C | 0.6 | 1000 | — | — | ISO 10456 |
| agua · agua a 40 °C | 0.63 | 990 | — | — | ISO 10456 |
| agua · agua a 80 °C | 0.67 | 970 | — | — | ISO 10456 |
| agua · hielo a -10 °C | 2.3 | 920 | — | — | ISO 10456 |
| agua · hielo a 0 °C | 2.2 | 900 | — | — | ISO 10456 |
| agua · nieve, compactada (< 200 mm) | 0.6 | 500 | — | — | ISO 10456 |
| agua · nieve, levemente compactada (70 a 100 mm) | 0.23 | 300 | — | — | ISO 10456 |
| agua · nieve, recién caída (< 30 mm) | 0.05 | 100 | — | — | ISO 10456 |
| agua · nieve, suave (30 a 70 mm) | 0.12 | 200 | — | — | ISO 10456 |

### Aislantes térmicos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Celulosa proyectada ρ = 75 kg/m³ | 0.04 | 75 | 3 | — | DITEC |
| DITEC · Corcho aglomerado ρ = 105-125 kg/m³ | 0.046 | — | 16 | — | DITEC |
| DITEC · EPS ρ = 10 kg/m³ - archipex | 0.043 | 10 | 31 | — | DITEC |
| DITEC · EPS ρ = 15 kg/m³ - archipex | 0.041 | 15 | 35 | — | DITEC |
| DITEC · EPS ρ = 20 kg/m³ - archipex | 0.038 | 20 | 38 | — | DITEC |
| DITEC · EPS ρ = 25 kg/m³ - archipex | 0.038 | 25 | 46 | — | DITEC |
| DITEC · EPS ρ = 30 kg/m³ - archipex | 0.036 | 30 | 55 | — | DITEC |
| DITEC · Fibra de poliéster ρ = 8 kg/m³ | 0.06 | 8 | 2 | — | DITEC |
| DITEC · Lana de oveja ρ = 12 kg/m³ | 0.043 | 12 | 2 | — | DITEC |
| DITEC · Lana de vidrio en colchoneta con papel a 1 cara ρ = 35 kg/m³ | 0.042 | 35 | 4 | — | DITEC |
| DITEC · Lana de vidrio ρ = 11 kg/m³ | 0.042 | 11 | 5 | — | DITEC |
| DITEC · Lana mineral en colchoneta ρ = 36 kg/m³ | 0.042 | 36 | 11 | — | DITEC |
| DITEC · Lana vidrio en rollo ρ = 12 kg/m³ | 0.042 | 12 | 2 | — | DITEC |
| DITEC · Poliuretano proyectado, ρ = 9,5 kg/m³ | 0.1 | — | 14 | — | DITEC |

### Albañilería y ladrillos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Ladrillo fiscal ρ = 1500 kg/m³ | 0.5 | 1500 | 9 | — | DITEC |
| LOSCAT · Ladrillo cerámico hueco Santiago 9 | 0.264 | 980 | 10 | — | LOSCAT |

### Asfaltos y bitúmenes

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Asfalto · Asfalto | 0.7 | 2100 | 50000 | — | ISO 10456 |
| Bitumen · Fieltro/lámina | 0.23 | 1100 | 50000 | — | ISO 10456 |
| Bitumen · Puro | 0.17 | 1050 | 50000 | — | ISO 10456 |

### Baldosas y cerámicos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Baldosas · cerámica/porcelana | 1.3 | 2300 | — | — | ISO 10456 |
| Baldosas · Plástica | 0.2 | 1000 | 10000 | — | ISO 10456 |

### Barreras y membranas

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Fieltro M-1: 10-40 | — | — | 536 | — | DITEC |
| DITEC · Fieltro M-2: 15-40 (N°15) | — | — | 365 | — | DITEC |
| DITEC · Fieltro M-3: 15 Libras | — | — | 294 | — | DITEC |
| DITEC · Impermeabilizante | — | — | 4545 | — | DITEC |
| DITEC · Klober | — | — | 549 | — | DITEC |
| DITEC · Papel decomural vinílico 240 g/m² | — | — | 1538 | — | DITEC |
| DITEC · Papel Kraft librería 110 g/m² | — | — | 690 | — | DITEC |
| DITEC · Polietileno | — | — | 151800 | — | DITEC |
| DITEC · Typar | — | — | 1690 | — | DITEC |
| DITEC · Typro | — | — | 253 | — | DITEC |
| DITEC · Tyvek homewrap | — | — | 1761 | — | DITEC |
| DITEC · Volcán Wrap | — | — | 125839 | — | DITEC |
| Producto/material · Lámina de aluminio 0,05 mm | — | — | — | Sd 1500 m | ISO 10456 |
| Producto/material · Lámina de PE 0,15 mm | — | — | — | Sd 8 m | ISO 10456 |
| Producto/material · Lámina de poliester 0,2 mm | — | — | — | Sd 50 m | ISO 10456 |
| Producto/material · Lámina de PVC | — | — | — | Sd 30 m | ISO 10456 |
| Producto/material · membrana respirable | — | — | — | Sd 0.2 m | ISO 10456 |
| Producto/material · Papel bituminoso 0,1 mm | — | — | — | Sd 2 m | ISO 10456 |
| Producto/material · Papel de aluminio 0,4 mm | — | — | — | Sd 10 m | ISO 10456 |
| Producto/material · Papel mural vinílico | — | — | — | Sd 2 m | ISO 10456 |
| Producto/material · Pintura - emulsión | — | — | — | Sd 0.1 m | ISO 10456 |
| Producto/material · Pintura - gloss | — | — | — | Sd 3 m | ISO 10456 |
| Producto/material · Polietileno 0,15 mm | — | — | — | Sd 50 m | ISO 10456 |
| Producto/material · Polietileno 0,25 mm | — | — | — | Sd 100 m | ISO 10456 |

### Cauchos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Caucho · Butadieno | 0.25 | 980 | 100000 | — | ISO 10456 |
| Caucho · Butilo, (isobutano), sólido/caliente derretido | 0.24 | 1200 | 200000 | — | ISO 10456 |
| Caucho · Caucho duro (ebonita), sólido | 0.17 | 1200 | — | — | ISO 10456 |
| Caucho · EPDM | 0.25 | 1150 | 6000 | — | ISO 10456 |
| Caucho · Espuma de caucho | 0.06 | — | 7000 | — | ISO 10456 |
| Caucho · Natural | 0.13 | 910 | 10000 | — | ISO 10456 |
| Caucho · Neopreno (policloropreno) | 0.23 | 1240 | 10000 | — | ISO 10456 |
| Caucho · Poliisobutileno | 0.2 | 930 | 10000 | — | ISO 10456 |
| Caucho · Polisulfuro | 0.4 | 1700 | 10000 | — | ISO 10456 |

### Cámaras de aire y gases

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Capa de aire · Cámara de aire no ventilada | — | — | — | Sd 0.01 m | NCh 853 / NCh 1973 |
| Gases · aire | 0.025 | 1 | 1 | — | ISO 10456 |
| Gases · argón | 0.017 | 2 | 1 | — | ISO 10456 |
| Gases · dióxido de carbono | 0.014 | 2 | 1 | — | ISO 10456 |
| Gases · Hexafloruro de azufre | 0.013 | 6 | 1 | — | ISO 10456 |
| Gases · kriptón | 0.009 | 4 | 1 | — | ISO 10456 |
| Gases · xenón | 0.005 | 6 | 1 | — | ISO 10456 |

### Enlucidos y revoques

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Enlucidos · Cal, arena | 0.8 | 1600 | 6–10 | — | ISO 10456 |
| Enlucidos · Cemento, arena | 1 | 1800 | 6–10 | — | ISO 10456 |
| Enlucidos · Enlucido de yeso | 0.4 | 1000 | 6–10 | — | ISO 10456 |
| Enlucidos · Enlucido de yeso | 0.57 | 1300 | 6–10 | — | ISO 10456 |
| Enlucidos · Enlucido de yeso aislante | 0.18 | 600 | 6–10 | — | ISO 10456 |
| Enlucidos · Yeso, arena | 0.8 | 1600 | 6–10 | — | ISO 10456 |

### Hormigones y morteros

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Hormigón premezclado H20 (3L agua por saco) ρ = 2100 kg/m³ | 1.63 | 2100 | 44 | — | DITEC |
| DITEC · Mortero de pega albañilería (21,6% agua) | 1.4 | — | 21 | — | DITEC |
| DITEC · Mortero de pega para pisos (5L agua por saco) ρ = 1800 kg/m³ | 1.4 | 1800 | 17 | — | DITEC |
| Hormigón · Armado (1% de acero) | 2.3 | 2300 | 80–130 | — | ISO 10456 |
| Hormigón · Armado (2% de acero) | 2.5 | 2400 | 80–130 | — | ISO 10456 |
| Hormigón · Densidad alta | 2 | 2400 | 80–130 | — | ISO 10456 |
| Hormigón · Densidad media | 1.15 | 1800 | 60–100 | — | ISO 10456 |
| Hormigón · Densidad media | 1.35 | 2000 | 60–100 | — | ISO 10456 |
| Hormigón · Densidad media | 1.65 | 2200 | 70–120 | — | ISO 10456 |

### Maderas

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Pino insigne ρ = 410 kg/m³ | 0.104 | 410 | 64 | — | DITEC |
| DITEC · Terciado ranurado ρ = 570 kg/m³ | 0.23 | 570 | 293 | — | DITEC |
| madera · Pino | 0.12 | 450 | 20–50 | — | ISO 10456 |
| madera · Pino | 0.13 | 500 | 20–50 | — | ISO 10456 |
| madera · Pino | 0.18 | 700 | 50–200 | — | ISO 10456 |

### Metales

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| metales · Acero | 50 | 7800 | — | — | ISO 10456 |
| metales · Acero inoxidable | 30 | 7900 | — | — | ISO 10456 |
| metales · Aleaciones de aluminio | 160 | 2800 | — | — | ISO 10456 |
| metales · Bronce | 65 | 8700 | — | — | ISO 10456 |
| metales · Cobre | 380 | 8900 | — | — | ISO 10456 |
| metales · Hierro, hierro fundido | 50 | 7500 | — | — | ISO 10456 |
| metales · Latón | 120 | 8400 | — | — | ISO 10456 |
| metales · Plomo | 35 | 11300 | — | — | ISO 10456 |
| metales · Zinc | 110 | 7200 | — | — | ISO 10456 |

### Pinturas y barnices

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Pintura barniz marino, 2 manos | — | — | 127600 | — | DITEC |
| DITEC · Pintura esmalte al agua (10 micras) | — | — | 127160 | — | DITEC |
| DITEC · Pintura esmalte al agua, 2 manos | — | — | 90900 | — | DITEC |
| DITEC · Pintura látex acrílico (10 micras) | — | — | 33440 | — | DITEC |
| DITEC · Pintura óleo brillante, 2 manos | — | — | 162400 | — | DITEC |
| DITEC · Pintura piscina, 2 manos | — | — | 313600 | — | DITEC |

### Placas y tableros cementicios

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Fibrocemento ρ = 1250 kg/m³ | 0.23 | 1250 | 194 | — | DITEC |
| DITEC · Fibrocemento ρ = 1350 kg/m³ | 0.23 | 1350 | 200 | — | DITEC |
| DITEC · OSB ρ = 648 kg/m³ | 0.14 | 648 | 371 | — | DITEC |
| DITEC · PaintPanel | 0.14 | — | 286 | — | DITEC |
| DITEC · Placa de fibra de madera MDF ρ = 620 kg/m³ | 0.23 | 620 | 20 | — | DITEC |
| DITEC · placa de fibrosilicato ρ = 910 kg/m³ | 0.23 | 910 | 31 | — | DITEC |
| DITEC · Placa de madera contrachapada ρ = 550 kg/m³ | 0.23 | 550 | 51 | — | DITEC |
| DITEC · SmartPanel | 0.14 | — | 316 | — | DITEC |

### Plásticos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Plásticos · Acrílico | 0.2 | 1050 | 10000 | — | ISO 10456 |
| Plásticos · Poliacetato | 0.3 | 1410 | 100000 | — | ISO 10456 |
| Plásticos · Poliamida (nylon) | 0.25 | 1150 | 50000 | — | ISO 10456 |
| Plásticos · Poliamida 6,6 con 25% fibra de vidrio | 0.3 | 1450 | 50000 | — | ISO 10456 |
| Plásticos · Policarbonato | 0.2 | 1200 | 5000 | — | ISO 10456 |
| Plásticos · Policloruro de vinilo (PVC) | 0.17 | 1390 | 50000 | — | ISO 10456 |
| Plásticos · Poliestireno | 0.16 | 1050 | 100000 | — | ISO 10456 |
| Plásticos · Polietileno/polietano, alta densidad | 0.5 | 980 | 100000 | — | ISO 10456 |
| Plásticos · Polietileno/polietano, baja densidad | 0.33 | 920 | 100000 | — | ISO 10456 |
| Plásticos · Polimetilmetacrilato (PMMA) | 0.18 | 1180 | 50000 | — | ISO 10456 |
| Plásticos · Polipropileno | 0.22 | 910 | 10000 | — | ISO 10456 |
| Plásticos · Polipropileno con 25% fibra de vidrio | 0.25 | 1200 | 10000 | — | ISO 10456 |
| Plásticos · Politetrafluoretileno (PTFE) | 0.25 | 2200 | 10000 | — | ISO 10456 |
| Plásticos · Poliuretano (PU) | 0.25 | 1200 | 6000 | — | ISO 10456 |
| Plásticos · Resina epóxica | 0.2 | 1200 | 10000 | — | ISO 10456 |
| Plásticos · Resina fenólica | 0.3 | 1300 | 100000 | — | ISO 10456 |
| Plásticos · Resina poliéster | 0.19 | 1400 | 10000 | — | ISO 10456 |

### Recubrimientos de piso

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Piso flotante, e = 6 mm | 0.103 | — | 1197 | — | DITEC |
| Recubrimientos de piso · alfombra / recubrimiento textil | 0.06 | 200 | 5 | — | ISO 10456 |
| Recubrimientos de piso · Caucho | 0.17 | 1200 | 10000 | — | ISO 10456 |
| Recubrimientos de piso · caucho celular o plástico sobre radier | 0.1 | 270 | 10000 | — | ISO 10456 |
| Recubrimientos de piso · corcho sobre radier | 0.05 | — | 10–20 | — | ISO 10456 |
| Recubrimientos de piso · corcho, palmetas | 0.065 | — | 20–40 | — | ISO 10456 |
| Recubrimientos de piso · fieltro sobre radier | 0.05 | 120 | 15–20 | — | ISO 10456 |
| Recubrimientos de piso · lana sobre radier | 0.06 | 200 | 15–20 | — | ISO 10456 |
| Recubrimientos de piso · linóleo | 0.17 | 1200 | 800–1000 | — | ISO 10456 |
| Recubrimientos de piso · Plástico | 0.25 | 1700 | 10000 | — | ISO 10456 |

### Revestimientos y enchapes

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Enchape cerámico | 1.75 | — | 308 | — | DITEC |
| DITEC · Enchape de madera contrachapada con resina fenólica ρ = 595 kg/m³ | 0.23 | 595 | 134 | — | DITEC |
| DITEC · Enchape de madera contrachapada con resina ureica ρ = 635 kg/m³ | 0.23 | 635 | 207 | — | DITEC |
| DITEC · Revestimiento exterior de fibrocemento tinglado | 0.23 | — | 139 | — | DITEC |

### Rocas y piedras

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| rocas · Basalto | 3.5 | — | 10000 | — | ISO 10456 |
| rocas · Gneis | 3.5 | — | 10000 | — | ISO 10456 |
| rocas · Granito | 2.8 | — | 10000 | — | ISO 10456 |
| rocas · Mármol | 3.5 | 2800 | 10000 | — | ISO 10456 |
| rocas · Natural, porosa, por ej. lava | 0.55 | 1600 | 15–20 | — | ISO 10456 |
| rocas · Natural, roca cristalina | 3.5 | 2800 | 10000 | — | ISO 10456 |
| rocas · Natural, roca sedimentaria | 2.3 | 2600 | 200–250 | — | ISO 10456 |
| rocas · Natural, roca sedimentaria, liviana | 0.85 | 1500 | 20–30 | — | ISO 10456 |
| rocas · Piedra artificial | 1.3 | 1750 | 40–50 | — | ISO 10456 |
| rocas · Piedra caliza, dura | 1.7 | 2200 | 150–200 | — | ISO 10456 |
| rocas · Piedra caliza, extra dura | 2.3 | 2600 | 200–250 | — | ISO 10456 |
| rocas · Piedra caliza, extra suave | 0.85 | 1600 | 20–30 | — | ISO 10456 |
| rocas · Piedra caliza, semi dura | 1.4 | 2000 | 40–50 | — | ISO 10456 |
| rocas · Piedra caliza, suave | 1.1 | 1800 | 25–40 | — | ISO 10456 |
| rocas · Piedra pómez natural | 0.12 | 400 | 6–8 | — | ISO 10456 |
| rocas · Pizarra | 2.2 | — | 800–1000 | — | ISO 10456 |
| rocas · Roca arenosa (sílice) | 2.3 | 2600 | 30–40 | — | ISO 10456 |

### Sellantes y espumas

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Sellantes y otros · Espuma de polietileno | 0.05 | 70 | 100 | — | ISO 10456 |
| Sellantes y otros · espuma de poliuretano (PU) | 0.05 | 70 | 60 | — | ISO 10456 |
| Sellantes y otros · Espuma de silicona | 0.12 | 750 | 10000 | — | ISO 10456 |
| Sellantes y otros · espuma elastomérica, flexible | 0.05 | — | 10000 | — | ISO 10456 |
| Sellantes y otros · Gel de sílice (desecante) | 0.13 | 720 | — | — | ISO 10456 |
| Sellantes y otros · PVC, flexible, con 40% de suavisante | 0.14 | 1200 | 100000 | — | ISO 10456 |
| Sellantes y otros · Silicona, pura | 0.35 | 1200 | 5000 | — | ISO 10456 |
| Sellantes y otros · Silicona, rellena | 0.5 | 1450 | 5000 | — | ISO 10456 |
| Sellantes y otros · uretano/poliuretano (quiebre térmico) | 0.21 | 1300 | 60 | — | ISO 10456 |

### Suelos

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| suelos · Arcilla o sedimentos | 1.5 | — | 50 | — | ISO 10456 |
| suelos · Arena y grava | 2 | — | 50 | — | ISO 10456 |

### Tableros de madera

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Tableros de madera · aglomerada | 0.1 | 300 | 10–50 | — | ISO 10456 |
| Tableros de madera · aglomerada | 0.14 | 600 | 15–50 | — | ISO 10456 |
| Tableros de madera · aglomerada | 0.18 | 900 | 20–50 | — | ISO 10456 |
| Tableros de madera · Contrachapada | 0.09 | 300 | 50–150 | — | ISO 10456 |
| Tableros de madera · Contrachapada | 0.13 | 500 | 70–200 | — | ISO 10456 |
| Tableros de madera · Contrachapada | 0.17 | 700 | 90–220 | — | ISO 10456 |
| Tableros de madera · Contrachapada | 0.24 | 1000 | 110–250 | — | ISO 10456 |
| Tableros de madera · fibras, incluyendo MDF | 0.07 | 250 | 3–5 | — | ISO 10456 |
| Tableros de madera · fibras, incluyendo MDF | 0.1 | 400 | 5–10 | — | ISO 10456 |
| Tableros de madera · fibras, incluyendo MDF | 0.14 | 600 | 12–20 | — | ISO 10456 |
| Tableros de madera · fibras, incluyendo MDF | 0.18 | 800 | 20–30 | — | ISO 10456 |
| Tableros de madera · OSB | 0.13 | 650 | 30–50 | — | ISO 10456 |
| Tableros de madera · partículas aglomeradas con cemento | 0.23 | 1200 | 30–50 | — | ISO 10456 |

### Tejas y cubiertas

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Tejas · Arcilla | 1 | 2000 | 30–40 | — | ISO 10456 |
| Tejas · concreto | 1.5 | 2100 | 60–100 | — | ISO 10456 |

### Vidrios

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| Vidrio · de cal sodada (incluyendo vidrio flotado) | 1 | 2500 | — | — | ISO 10456 |
| Vidrio · de cuarzo | 1.4 | 2200 | — | — | ISO 10456 |
| Vidrio · mosaico | 1.2 | 2000 | — | — | ISO 10456 |

### Yeso-cartón y placas de yeso

| Material | λ (W/m·K) | ρ (kg/m³) | μ | Otros | Fuente |
|---|---|---|---|---|---|
| DITEC · Yeso cartón RF ρ = 840 kg/m³ | 0.31 | 840 | 12 | — | DITEC |
| DITEC · Yeso cartón RH ρ = 760 kg/m³ | 0.26 | 760 | 11 | — | DITEC |
| DITEC · Yeso Cartón ST ρ = 750 kg/m³ | 0.24 | 750 | 20 | — | DITEC |
| Yeso · Yeso | 0.18 | 600 | 4–10 | — | ISO 10456 |
| Yeso · Yeso | 0.57 | 1200 | 4–10 | — | ISO 10456 |
| Yeso · Yeso | 0.8 | 1500 | 4–10 | — | ISO 10456 |
| Yeso · Yeso | 1 | 900 | 4–10 | — | ISO 10456 |
| Yeso · Yeso cartón | 0.8 | 700 | 4–10 | — | ISO 10456 |

## 3. Estructura del informe — pasos y bloques

El informe térmico se compone de los siguientes **pasos secuenciales**. Cada uno corresponde a una sección evaluable del proyecto. El orden es el orden de llenado del usuario.

| # | Bloque | Sub-bloques |
|---|---|---|
| **0** | **Selección de zona** (emplazamiento) | comuna del cliente → zona (A–I); altitud/meridiano si aplica |
| **1** | **Envolvente térmica** | 1.1 Techo (Campo + Puente térmico) |
| **2** | **Muro** | 2.1 Campo + Puente térmico |
| **3** | **Piso** | 3.1 Campo + Puente térmico · 3.2 Sobrecimientos (Acreditación térmica, Tabla 6) |
| **4** | **Puerta opaca** | Acreditación térmica (Tabla 10) |
| **5** | **Ventilación** | Evaluación NCh 3309 |
| **6** | **Ventanas por orientación** | Tablas 3, 5 y 12 (N · Oriente · Poniente · Sur) |
| **7** | **Infiltraciones de aire** | 7.1 De envolvente térmica · 7.2 De puertas exteriores · 7.3 De ventanas (permeabilidad al aire) |

> Nota de mapeo con el pedido del usuario: "envolvente térmica + puente térmico estructura" = paso 1 (techo); "muro + puente térmico" = paso 2; "piso + puente térmico + sobrecimientos" = paso 3; "ventilación" = paso 5; "ventanas evaluación" y "ventanas por orientación" = paso 6; "infiltración de aire (envolvente / puertas / ventanas)" = paso 7. La **puerta opaca** (paso 4) se intercala porque su acreditación (Tabla 10) precede a la ventilación en la web de referencia.

---

## 4. Método de cálculo de complejos (Campo + Puente térmico)

Cada elemento de la envolvente (**techo / muro / piso**) se evalúa por **dos caminos** y se pondera por **fracción de área**:

- **Campo (con aislación):** el complejo completo, capa por capa, INTERIOR → EXTERIOR, con su capa de relleno/aislación.
- **Puente térmico (estructura):** se **copia desde Campo** y se reemplaza **solo** la capa de "relleno/aislación" por la **estructura** (madera / acero / hormigón).

El resultado ponderado usa la **Fracción puente (%)** declarada (p. ej. 10 %):

```
U_ponderado = (1 − f) · U_campo + f · U_puente      con f = fracción puente / 100
```

Cada bloque entrega tres resultados:

- **U:** transmitancia térmica ponderada (W/m²·K).
- **Cond. superficial:** verificación de riesgo de condensación superficial.
- **Cond. intersticial:** verificación de riesgo de condensación intersticial (incluye puentes térmicos).

> El análisis de condensación (superficial e intersticial) es **exigencia nueva** de la RT para muros perimetrales, techumbre y piso ventilado, y **debe incluir los puentes térmicos** de la solución constructiva.

### 4.1. Ítems preseleccionados

Los ítems preseleccionados para cada complejo corresponden a una **vivienda de estructura de madera**. El usuario puede **editar, crear y reordenar** soluciones seleccionando materiales del listado desplegable. En el lado "Puente térmico", el campo **"Reemplazar capa #"** indica qué capa de Campo se sustituye por la **"Estructura (material)"**.

---

## 5. Exigencias por elemento (Tablas RT) — `POR COMPLETAR`

> Las exigencias numéricas (`U` máx. o `Rt` mín.) por **zona térmica** para techo, muro y piso provienen de las **Tablas 1 y 2** de la RT. **`POR COMPLETAR`** con los valores oficiales. La UI los aplica como umbral OK/NO OK contra el `U` ponderado de cada complejo.

| Elemento | Parámetro exigido | Tabla RT | Estado |
|---|---|---|---|
| Techo / techumbre | `U` máx. (o `Rt` mín.) por zona | Tabla 1/2 | `POR COMPLETAR` |
| Muro perimetral | `U` máx. (o `Rt` mín.) por zona | Tabla 1/2 | `POR COMPLETAR` |
| Piso ventilado | `U` máx. (o `Rt` mín.) por zona | Tabla 1/2 | `POR COMPLETAR` |

### 5.1. Sobrecimientos — Acreditación térmica (Tabla 6)

Se acredita por **R100 mínimo** del material aislante usado en los **sobrecimientos** de pisos sobre terreno. No requiere cálculos del usuario: se declara por especificación constructiva y/o ficha técnica.

- **Fórmula:** `R100 = (e/λ) × 100`, con `e` en metros.
- **Solución de referencia (web):** EPS, λ = 0.0384 W/m·K.
- **Exigencia (Tabla 6):** `R100 ≥ 91` para zonas **F–I**; `R100 ≥ 45` para zonas **B–E**.
- **Ejemplo de validación:** EPS 30 mm → `R100 ≈ 78` → **NO OK** frente a 91 (zonas F–I).
- Casilla **"Aplica para este proyecto"**: si no existen sobrecimientos, se desmarca y el informe indica **"No aplica"**.

> Valores completos por zona: **`POR COMPLETAR`** (Tabla 6 oficial).

### 5.2. Puerta opaca — Acreditación térmica (Tabla 10)

No requiere inputs del usuario: se valida por **ficha técnica acreditada** y por la exigencia `U/Rt` de la **Tabla 10** según zona térmica. El valor se utiliza luego en el PDF final.

- **Ficha de referencia (web):** Código `3.1.P.M.0.01 (DITEC)` — Puerta 1 hoja 0,8×2,0 m.
- **Valores de la ficha:** `U = 1.70 W/m²·K`, `Rt = 0.59 m²·K/W`.
- **Validación automática:** se compara la ficha DITEC con la exigencia de Tabla 10 para la zona del proyecto. Ejemplo web: requisito `U ≤ 1.70 · Rt ≥ 0.59` → **OK**.

> Valores completos por zona: **`POR COMPLETAR`** (Tabla 10 oficial).

---

## 6. Ventilación — Evaluación (NCh 3309:2014)

Cálculo automático del **caudal total mínimo de ventilación (`Qtot`)** en función de la **superficie interior a ventilar** y el **número de dormitorios**, más **extracción local** bajo demanda para **cocina** y **baños**. La RT actualizada exige cumplir los caudales mínimos de NCh 3308 / NCh 3309; para vivienda residencial de baja altura (hasta 3 pisos) aplica la **NCh 3309:2014**, basada en ASHRAE 62.2.

**Inputs del usuario:**

| Campo | Notas |
|---|---|
| Superficie interior a ventilar (m²) | Si no viene del cliente, se ingresa aquí. |
| Dormitorios | Se sincroniza con el campo "Dormitorios" del bloque de ventanas. El **primer dormitorio cuenta como doble**; los restantes, como simples. |
| Baños | Recintos húmedos con extracción. |
| Cocinas | Recinto húmedo con extracción/campana. |

### 6.1. Caudal total requerido `Qtot` — Tabla 1 (NCh 3309:2014, ecuación 1b)

La norma entrega `Qtot` por **doble entrada**: fila = rango de **área del piso (m²)**, columna = **n.º de dormitorios** (1 a 5). Tabla oficial (L/s):

| Área del piso (m²) | 1 dorm | 2 dorm | 3 dorm | 4 dorm | 5 dorm |
|---|---|---|---|---|---|
| < 47 | 14 | 18 | 21 | 25 | 28 |
| 47 – 93 | 21 | 24 | 28 | 31 | 35 |
| 93 – 139 | 28 | 31 | 35 | 38 | 42 |
| **140 – 186** | 35 | 38 | 42 | 45 | **49** |
| 186 – 232 | 42 | 45 | 49 | 52 | 56 |
| 232 – 279 | 49 | 52 | 56 | 59 | 63 |
| 279 – 325 | 56 | 59 | 63 | 66 | 70 |
| 325 – 372 | 63 | 66 | 70 | 73 | 77 |
| 372 – 418 | 70 | 73 | 77 | 80 | 84 |
| 418 – 465 | 77 | 80 | 84 | 87 | 91 |

> **Verificación con el ejemplo de la web:** superficie **150 m²** → fila **140–186**; **5 dormitorios** → columna 5 = **`Qtot = 49 L/s`** (rango 140–186 · dorm 5). Coincide exactamente con el resultado mostrado en la interfaz ("Qtot: 49 L/s (rango 140-186 · dorm 5)").

**Fórmula equivalente (ecuación 1b, para interpolación / fuera de tabla):**

```
Qtot = 0,15 × A_piso + 3,5 × (N_dorm + 1)         [L/s]
```

donde `A_piso` es el área útil en m² y `N_dorm` el número de dormitorios. El término `(N_dorm + 1)` refleja que el primer dormitorio se cuenta como doble (2 personas) y los restantes como simples → ocupación de diseño `= N_dorm + 1`. El factor 3,5 L/s por persona y 0,15 L/s por m² provienen de ASHRAE 62.2 adaptada en NCh 3309.

> *Comprobación:* `0,15 × 150 + 3,5 × (5+1) = 22,5 + 21 = 43,5`. La **tabla redondea por rango** al valor tabulado del tramo (49 L/s para 140–186 · 5 dorm), que es el valor normativo que usa la planilla Minvu. La UI usa **la tabla** como valor oficial y la fórmula solo como respaldo de interpolación.

### 6.2. Crédito de infiltración `Qinf` y caudal del ventilador `Qfan`

```
Qfan = Qtot − Qinf        (ecuación 2)
```

`Qinf` = crédito de infiltración. **Al no contar con datos nacionales validados, se considera `Qinf = 0`** → `Qfan = Qtot`. (Texto literal de NCh 3309:2014.)

### 6.3. Extracción local (recintos húmedos)

Caudales mínimos de **extracción local** bajo demanda, por recinto húmedo:

| Recinto | Exigencia mínima (NCh 3309) |
|---|---|
| **Cocina** | **50 L/s** por cocina (extracción/campana). |
| **Baño** | **25 L/s** por baño (extractor con control de humedad / higróstato). |

> **Verificación con el ejemplo de la web:** "Extracción local exigida: cocina 50 L/s · baños 25 L/s por recinto". El proyecto **propone**: cocina 83 L/s (1×83) · baños 150 L/s (5×30). Como propuesto ≥ exigido en cada recinto → **cumple**.

### 6.4. Dispositivos (admisión pasiva y extracción)

- **Celosías pasivas** (admisión de aire en recintos secos: dormitorios, estar-comedor): se proponen N celosías cuyo caudal sumado debe cubrir `Qtot`. *Ejemplo web:* 7 celosías × 7,7 L/s = **54 L/s ≥ 49 L/s exigido** → OK.
- **Extractores baño:** uno por baño; *ejemplo web:* 5 extractores × 30 L/s = 150 L/s.
- **Campanas cocina:** una por cocina; *ejemplo web:* 1 × 83 L/s.
- El aire circula de **secos → húmedos**; admisión y extracción deben estar **en equilibrio**.

**Resultados que entrega el bloque:** `Qtot` (exigido), `Qtot propuesto` (suma de celosías), `Extracción local` (cocina/baños exigida vs propuesta), `Celosías pasivas` (n.º · L/s), `Extractores baño` (n.º · L/s), `Campanas cocina` (n.º · L/s), y veredicto **Cumple / No cumple** (cumple si `Qtot propuesto ≥ Qtot exigido` **y** cada extracción local propuesta ≥ exigida).

> *Reproducción del ejemplo de la web (vivienda 150 m², 5 dorm, 5 baños, 1 cocina):* Qtot exigido 49 L/s; Qtot propuesto (celosías) 54 L/s (7×7,7); extracción exigida cocina 50 / baños 25; extracción propuesta cocina 83 (1×83) / baños 150 (5×30) → **✓ Cumple**.

---

## 7. Ventanas por orientación (Tablas 3, 5 y 12)

Se define una **ventana tipo** del proyecto y se completan **superficies de muros y ventanas por orientación**. El sistema evalúa el **% máximo permitido** según zona y el desempeño térmico de la ventana.

**Conceptos:**

- **Upvm:** transmitancia ponderada ventana–muro.
- **Uw:** transmitancia térmica de la ventana (W/m²·K).
- **Permeabilidad al aire:** **Clase mínima** exigida a 100 Pa según zona térmica (NCh 3296/3297).

### 7.1. Catálogo de tipos de ventana (proyecto)

Cada tipología trae `Uw`, clase de permeabilidad a 100 Pa y ficha de homologación. Proporción asumida en método simple: **70 % vidrio / 30 % marco** (`Marco = 100 − vidrio`). En **método detallado por orientación** se usa el alto visible del marco y la proporción simple no se considera.

| Tipo de ventana (proyecto) | Uw (W/m²·K) | Permeabilidad (100 Pa) | Notas |
|---|---|---|---|
| PVC + termopanel Low-E | **2.2** | Clase 4 | Homologada por equivalencia térmica (ficha 3.1.V.A.37); no existe ficha oficial específica con Low-E. |
| PVC + termopanel 4+12+4 | **2.7** | Clase 4 | DVH estándar. |
| PVC + termopanel 3+8+3 | **3.0** | Clase 4 | DVH delgado. |
| PVC + termopanel 3+6+3 | **3.2** | Clase 3 | DVH delgado, cámara reducida. |
| PVC + vidrio simple | **4.6** | s/i | Sin información de clase. |
| Madera + vidrio simple | **5.0** | s/i | Sin información de clase. |
| Aluminio + vidrio simple 3 mm | **6.0** | s/i | Marco sin rotura de puente térmico. |

> `s/i` = sin información de clase de permeabilidad en la ficha. En esos casos la evaluación de permeabilidad queda **Pendiente** hasta declarar/certificar clase.

**Orientaciones evaluadas:** Norte · Oriente · Poniente · Sur. Por cada una: `Sup. muros (m²)`, `Sup. ventanas (m²)`, `% vent/muro`, `Estado`, `Upvm`, `Uw`.

> La RT permite **mayores superficies vidriadas al norte** y **menores al sur**. Los **% máximos por zona y orientación** (Tablas 3, 5, 12) y la **clase de permeabilidad mínima por zona**: **`POR COMPLETAR`** (cargar Tablas oficiales).

---

## 8. Infiltraciones de aire — Resumen normativo y criterios de evaluación

Estos ítems se evalúan **automáticamente** mediante especificaciones constructivas y fichas técnicas acreditadas. El usuario **no ingresa datos ni realiza cálculos**. Cada sub-ítem entrega un veredicto: **"Cumple por especificación constructiva" / "Cumple exigencia normativa"** (verde) o **"No cumple exigencia normativa"** (rojo).

### 8.1. De envolvente térmica del proyecto

**Criterio de evaluación:** la RT (vía NCh 3295) permite acreditar la hermeticidad de la envolvente por **dos vías**:

1. **Ensayo en terreno** (blower-door, NCh 3295) → se compara el resultado contra el límite de infiltración máxima según emplazamiento.
2. **Especificación constructiva** (cuando NO se dispone de ensayo) → se cumple definiendo **sellos constructivos** en las Especificaciones Técnicas.

**Regla de veredicto que aplica la UI:**

- **Cumple por especificación constructiva** ⇔ las EETT del proyecto declaran sellos en **los cinco puntos** exigidos (lista de abajo). Es la vía por defecto del prototipo.
- Si se declara que **hay ensayo en terreno**, el veredicto pasa a depender del **resultado del ensayo vs. límite por emplazamiento** (`POR COMPLETAR`: límites de infiltración máxima por zona/emplazamiento).

**Sellos constructivos exigidos (los cinco deben estar especificados):**

1. Encuentros entre muros, losas y elementos estructurales.
2. Uniones de elementos de distinta materialidad.
3. Perforaciones de instalaciones.
4. Encuentros de solera inferior y superior.
5. Dispositivos de ventilación y ductos.

> En el ejemplo de la web, los cinco sellos están especificados → **"Cumple por especificación constructiva"** (verde).

### 8.2. De puertas exteriores — Permeabilidad al aire

**Criterio:** se acredita por **ficha técnica certificada** (DITEC) con clasificación de permeabilidad al aire conforme a **NCh 3296 / NCh 3297**, comparada contra la **clase mínima exigida por zona** a 100 Pa.

**Regla de veredicto:**

- **Cumple exigencia normativa** ⇔ `clase_certificada ≥ clase_mínima(zona)`.

**Datos del ejemplo:** puerta acreditada por ficha DITEC **3.1.P.A.2**, **Clase 3 (100 Pa)**. La exigencia se verifica por certificación, sin cálculo adicional → en el ejemplo, **Cumple**.

> `POR COMPLETAR`: tabla de **clase mínima de permeabilidad de puertas por zona térmica**. Mientras no esté cargada, si la clase certificada es alta (3–4) el veredicto se asume Cumple; si es baja (1–2) queda Pendiente de umbral.

### 8.3. De ventanas — Permeabilidad al aire

**Criterio:** idéntico a puertas, pero para el complejo de ventana, conforme a **NCh 3296 / NCh 3297**, contra la **clase mínima exigida por zona**.

**Regla de veredicto:**

- **Cumple exigencia normativa** ⇔ `clase_certificada ≥ clase_mínima(zona)`.
- **No cumple** ⇔ `clase_certificada < clase_mínima(zona)` **o** la clase mínima de la zona aún no está cargada y la ventana se homologa sin ficha oficial específica.

**Datos del ejemplo:** ventana **Clase 4 (100 Pa)**, evaluada por complejo homologado mediante ficha acreditada **3.1.V.A.37 (DITEC)**, homologada por equivalencia térmica (no existe ficha oficial específica con Low-E). En el ejemplo de la web el veredicto es **"No cumple exigencia normativa"** — coherente con que la clase mínima de la zona del proyecto exige una clase superior a la homologada, **o** con que la homologación sin ficha oficial específica no satisface la exigencia hasta cargar el umbral de la zona.

> **Información faltante para cerrar el veredicto de forma automática y definitiva:** la **tabla de clase mínima de permeabilidad al aire por zona térmica** (para puertas y ventanas) de la RT. Con esa tabla, la regla `clase_certificada ≥ clase_mínima(zona)` queda totalmente determinada. **→ Si la tienes (o autorizas, la busco), reemplazo el `POR COMPLETAR` y el veredicto deja de depender de supuestos.**

---

## 9. Marco normativo (referencias citadas)

- **OGUC, art. 4.1.10** — Reglamentación Térmica (1.ª etapa 2000, 2.ª etapa 2007, propuesta de actualización 2015).
- **Actualización RT** — publicada en el Diario Oficial el **27 de mayo de 2024**; **vigente desde el 28 de noviembre de 2025**. Mejora exigencias a techos, muros, pisos ventilados y ventanas; incorpora exigencias a **puertas exteriores, sobrecimientos, condensación, infiltraciones de aire y ventilación**; amplía la zonificación de **7 a 9 zonas**.
- **Ley N°21.305 (Eficiencia Energética, Min. Energía)** — obligatoriedad de la **Calificación Energética de Viviendas (CEV)** para viviendas nuevas.
- **NCh 853** — Acondicionamiento térmico; resistencias de cámaras de aire.
- **NCh 3295** — Infiltraciones de aire; ensayo en terreno (blower-door).
- **NCh 3296 / NCh 3297** — Clasificación de permeabilidad al aire de puertas y ventanas (clases a 100 Pa).
- **NCh 3308:2013** — Ventilación; calidad aceptable de aire interior (edificación distinta de residencial de baja altura).
- **NCh 3309:2014** — Ventilación; calidad de aire interior aceptable en edificios residenciales de baja altura (hasta 3 pisos). Define `Qtot` (Tabla 1 / ec. 1b), `Qfan = Qtot − Qinf` (ec. 2, con `Qinf = 0` por defecto) y caudales de extracción local. Basada en ASHRAE 62.2.
- **ISO 10456** — Propiedades térmicas de materiales (λ, ρ, μ).
- **Fichas DITEC** — Habitabilidad y Eficiencia Energética, Minvu (materiales, puertas, ventanas, sobrecimientos).
- **LOSCAT** — Listado Oficial de Soluciones Constructivas para Acondicionamiento Térmico (Minvu).

> Exigencias numéricas aún marcadas **`POR COMPLETAR`**: Tablas 1/2 (U máx. por zona para techo/muro/piso), Tabla 3/5/12 (% ventanas y Uw por zona/orientación), Tabla 6 completa (R100 sobrecimientos por zona), Tabla 10 completa (puerta opaca por zona) y **clase mínima de permeabilidad de puertas/ventanas por zona**. El catálogo de materiales (sección 2) está **completo**.
