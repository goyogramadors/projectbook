# Catálogo 2.0 — Presupuesto General de Obra (UF)

**Estimador de presupuesto resumido · Chile**
Fuente de valores: itemizado real OO.CC. (Laboratorio Punta Arenas, 1.035 m²) simplificado y normalizado a precios unitarios.
Anclaje de partidas: NCh 1150 · coherente con el catálogo de EETT.

---

## 0. Cómo se usa este catálogo

Es la **fuente de valores** del estimador. Define, para cada partida del presupuesto, su **precio unitario en UF**, su unidad de medida y la condición que la activa (heredada del mismo selector de las EETT). El HTML lo consume y calcula:

```
Subtotal partida (UF) = cantidad × precio_unitario_UF
Total partida ($)     = Subtotal_UF × valor_UF_del_día
```

**Convención de cada partida:**

```
| id | Partida | Unidad | PU [UF] | activa_si |
```

- **Los precios son referenciales y editables.** Provienen de un caso real ajustado; el usuario los corrige según mercado, región y estándar.
- La **cantidad** la ingresa el usuario (o se estima por defecto desde la superficie). El estimador parte con cantidades en blanco o pre-cargadas a partir de los m² del proyecto.
- Toda partida muestra su valor **en UF y su conversión a $** lado a lado.

### Parámetros globales editables

| Parámetro | Default | Descripción |
|---|---|---|
| `valor_uf` | 39.000 | Valor de la UF del día (editable; idealmente se actualiza por API SII/mindicador). |
| `superficie_m2` | — | Superficie construida; alimenta cantidades por defecto. |
| `gastos_generales_%` | 15% | Editable. Se aplica sobre el costo directo. |
| `utilidades_%` | 10% | Editable. Se aplica sobre (costo directo + GG). |
| `iva_%` | 19% | Editable. Aplica o no según contrato. |
| `proforma[]` | — | Líneas que el usuario llena a mano: glosa + monto (UF o $), p. ej. instalaciones de especialidad, equipamiento, imprevistos. |

### Estructura de cálculo del presupuesto

```
A · COSTO DIRECTO            = Σ subtotales de partidas activas + Σ proforma
B · GASTOS GENERALES         = A × gastos_generales_%
C · UTILIDADES               = (A + B) × utilidades_%
─────────────────────────────────────────────
D · COSTO NETO               = A + B + C
E · IVA                      = D × iva_%
─────────────────────────────────────────────
F · TOTAL PRESUPUESTO        = D + E
```

---

## 1. Partidas con precio unitario (UF)

> Precios derivados del itemizado real (UF ref. $39.000). La columna "Cant. def." indica cómo se pre-estima la cantidad desde la superficie cuando el usuario no la ingresa (`m2`=superficie; `glob`=1 global; `—`=el usuario la digita).

### Capítulo 1 — Obras Preliminares e Instalación de Faenas

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 1.1 | Instalación de faenas y construcciones provisorias | glob | 80,00 | glob | siempre |
| 1.2 | Empalmes provisorios de servicios | glob | 25,00 | glob | obra_nueva/ampliacion/reconstruccion |
| 1.3 | Cierro provisorio y letrero de obra | ml | 0,45 | — | nat ≠ obra_menor |
| 1.4 | Trazado, niveles y replanteo | m2 | 0,12 | m2 | siempre |

### Capítulo 2 — Habilitación del Terreno

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 2.1 | Despeje y limpieza del terreno | m2 | 0,15 | m2 | obra_nueva/reconstruccion o urbanización |
| 2.2 | Movimiento de tierras (exc., relleno, comp.) | m3 | 0,55 | — | fundaciones + obra nueva/ampl./recon. |
| 2.3 | Muros de contención y estabilización | m3 | 9,50 | — | fundaciones + obra nueva/recon. |

### Capítulo 3 — Demoliciones y Obras Previas

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 3.1 | Demoliciones y desarmes | m2 | 0,90 | — | demoliciones |
| 3.2 | Retiro de artefactos e instalaciones | glob | 12,00 | glob | demoliciones + (baños o instalaciones) |
| 3.3 | Retiro de escombros | m3 | 0,55 | — | demoliciones |

### Capítulo 4 — Obra Gruesa

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 4.1 | Fundaciones (hormigón + acero + emplant.) | m2 | 4,80 | m2 | fundaciones |
| 4.2 | Sobrecimientos y radier | m2 | 1,20 | m2 | radier o fundaciones |
| 4.3 | Sobrelosas de nivelación | m2 | 0,85 | — | sobrelosa |
| 4.4 | Estructura resistente vertical (hormigón/alb./metal/madera) | m2 | 6,50 | m2 | obra nueva/ampl./recon. |
| 4.5 | Losas y entrepisos | m2 | 5,20 | — | obra nueva/ampl./recon. + (hormigón o metálica) |
| 4.6 | Estructura de techumbre | m2 | 2,40 | — | techumbre |
| 4.7 | Cubierta y hojalatería | m2 | 2,80 | — | techumbre |

### Capítulo 5 — Terminaciones

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 5.1 | Tabiquería interior | m2 | 1,80 | — | tabiquería |
| 5.2 | Revestimiento de muros | m2 | 1,40 | — | rev_muros ≠ solo obra gruesa |
| 5.3 | Cielos | m2 | 1,60 | — | cielos ≠ solo obra gruesa |
| 5.4 | Pavimentos y pisos | m2 | 1,50 | m2 | pisos ≠ solo obra gruesa |
| 5.5 | Puertas | un | 2,50 | — | puertas |
| 5.6 | Ventanas | m2 | 3,20 | — | ventanas |
| 5.7 | Pinturas | m2 | 0,35 | — | pinturas |
| 5.8 | Impermeabilización de recintos húmedos | m2 | 0,90 | — | baños |
| 5.9 | Mobiliario en obra (cocina, baños, clósets) | glob | 60,00 | glob | mobiliario |

### Capítulo 6 — Instalaciones (montos globales referenciales)

> Las instalaciones se cargan típicamente como **proforma** desde el proyecto de especialidad. Estos valores globales son anclas gruesas por m² cuando no hay proforma.

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 6.1 | Instalación eléctrica | m2 | 3,50 | m2 | inst incluye eléctrica |
| 6.2 | Instalación sanitaria | m2 | 2,80 | m2 | inst incluye sanitaria o baños |
| 6.3 | Climatización y ventilación | m2 | 4,50 | m2 | inst incluye climatización |
| 6.4 | Gas | glob | 40,00 | glob | inst incluye gas |
| 6.5 | Corrientes débiles | m2 | 1,20 | m2 | inst incluye corrientes débiles |
| 6.6 | Red de incendio | m2 | 1,80 | m2 | inst incluye incendio |
| 6.7 | Transporte vertical | un | 900,00 | — | inst incluye transporte vertical |

### Capítulo 7 — Térmica y Fuego

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 7.1 | Cumplimiento norma térmica (aislaciones, complejos) | m2 | 1,10 | m2 | cumplir_termica |
| 7.2 | Resistencia al fuego y protección pasiva | m2 | 0,80 | m2 | resistencia_fuego |

### Capítulo 8 — Urbanización y Exteriores

| id | Partida | Unidad | PU [UF] | Cant. def. | activa_si |
|---|---|---|---|---|---|
| 8.1 | Pavimentos exteriores | m2 | 1,30 | — | urb incluye pav. exterior |
| 8.2 | Áreas verdes y paisajismo | m2 | 0,70 | — | urb incluye áreas verdes |
| 8.3 | Cierros perimetrales definitivos | ml | 4,00 | — | urb incluye cierros |
| 8.4 | Evacuación de aguas lluvias exteriores | glob | 50,00 | glob | urb incluye aguas lluvias |

---

## 2. Líneas proforma (llenado manual)

El usuario agrega líneas libres con glosa + monto, que entran al **costo directo** sin precio unitario. Casos típicos:

- Instalaciones de especialidad cotizadas aparte (eléctrica, climatización HVAC).
- Equipamiento y mobiliario especializado.
- Imprevistos / holguras de obra.
- Honorarios de proyectos y especialidades.
- Derechos municipales y aportes.

Cada línea proforma: `{glosa}` · `{monto}` · `{unidad: UF o $}`. Si se ingresa en $, el sistema lo divide por el valor UF para consolidar en UF.

---

## 3. Notas de mantención

- **Actualizar precios**: editar la columna PU [UF] de cada partida. Al estar en UF, resisten la inflación; revisar 1-2 veces al año contra cotizaciones de mercado.
- **Valor UF**: idealmente se trae por API (mindicador.cl o SII) al cargar; aquí es editable a mano.
- **Calibración regional**: los PU base son de un proyecto en Magallanes (costo alto por logística austral). Para zona central conviene un factor regional 0,80–0,90; para extremo norte/sur, 1,05–1,20. Se sugiere agregar a futuro un `factor_regional` global.
- **Estándar**: estos valores corresponden a estándar institucional/salud (alto). Para vivienda u oficina estándar medio, aplicar factor 0,70–0,85.

*Versión 2.0 — base para el estimador HTML.*
