# Catálogo Maestro — Generador de Especificaciones Técnicas Resumidas

**Especificaciones Técnicas Generales de Arquitectura y Construcción**
Contexto: Chile · Anclaje normativo: NCh 1150 (jerarquía de partidas) · LGUC/OGUC

---

## 0. Cómo leer este catálogo

Este archivo es la **fuente de verdad** del generador. El mockup HTML lo consume: cada partida tiene un `id`, las condiciones que la activan (`activa_si`) y un texto resumido con *placeholders* `{…}` que el usuario puede dejar genéricos o precisar.

**Contrato de granularidad (versión resumida):**

- El catálogo se detiene en nivel **Título** de NCh 1150 — no baja a Subtítulo (los 3.203 ítems de la norma completa).
- Cada partida = **un párrafo único** (3 a 6 líneas): qué es, material/norma de referencia, exigencia de ejecución y recepción.
- Sin cubicaciones, sin marcas comerciales, sin planos de detalle.
- Las variantes por sistema estructural se resuelven con **texto adaptativo**, no con N textos paralelos.

**Convención de campos por partida:**

```
### [id] Nombre de la partida
- nch1150: Sección/Elemento de origen
- activa_si: condición lógica sobre las selecciones del usuario
- texto: párrafo resumido con placeholders
```

---

## Modelo de selección del usuario

El documento se ensambla por **inclusión condicional**. Las variables que el formulario expone:

| Variable | Tipo | Valores |
|---|---|---|
| `naturaleza` | single | `obra_nueva` · `ampliacion_mayor` · `alteracion` · `reconstruccion` · `reparacion` · `obra_menor` |
| `estructura[]` | multi | `hormigon` · `albanileria` · `metalica` · `madera` · `tabiqueria_liviana` · `prefabricado_sip` |
| `fundaciones` | bool | sí / no |
| `radier` | bool | sí / no |
| `sobrelosa` | bool | sí / no |
| `techumbre` | bool | sí / no |
| `techumbre_estructura` | single | `madera` · `metalica` · `cercha_industrial` · `losa_hormigon` *(selección independiente)* |
| `cubierta_material` | single | `zincalum` · `teja` · `membrana` · `policarbonato` |
| `demoliciones` | bool | sí / no |
| `tabiqueria` | bool | sí / no |
| `cielos[]` | multi | `modular` · `volcanita` · `enlucido` · `obra_gruesa` *(sin terminación)* |
| `rev_muros[]` | multi | `pintura` · `ceramico` · `revest_madera` · `obra_gruesa` |
| `pisos[]` | multi | `porcelanato` · `ceramico` · `vinilico` · `flotante` · `hormigon_pulido` · `alfombra` · `obra_gruesa` |
| `mobiliario` | bool + multi | `cocina` · `banos` · `closets` · `mesones` |
| `cumplir_termica` | bool | activa Cap. 7.1 |
| `resistencia_fuego` | bool | activa Cap. 7.2 |
| `puertas[]` | multi | `madera_mdf` · `metalica` · `cristal_templado` · `aluminio` |
| `ventanas[]` | multi | `aluminio` · `pvc` · `madera` · `fierro` |
| `pinturas` | bool | sí / no |
| `banos` | bool | sí / no |
| `instalaciones[]` | multi | `electrica` · `sanitaria` · `climatizacion` · `gas` · `corrientes_debiles` · `incendio` · `transporte_vertical` |
| `urbanizacion[]` | multi | `pav_exterior` · `areas_verdes` · `cierros` · `aguas_lluvia` |
| `eett_complementarias[]` | multi *(solo declara, no genera)* | `estructuras` · `climatizacion` · `sanitarias` · `electricidad` · `accesibilidad` · `eficiencia_energetica` · `gas` · `corrientes_debiles` · `paisajismo` · `incendio` |

### Esqueleto por naturaleza de la intervención

Coincidente con los permisos DOM (OGUC). Cada naturaleza activa por defecto un set distinto de capítulos:

| Naturaleza | Permiso DOM típico | Capítulos activos por defecto |
|---|---|---|
| **Obra nueva** | Permiso de edificación | 0,1,2,4,5,6,8,9 (todos) |
| **Ampliación > 100 m²** | Permiso de ampliación | 0,1,3,4,5,6,9 (+2/8 opcional) |
| **Alteración** *(incluye remodelación/reforma)* | Permiso de alteración | 0,1,3,5,6,9 — sin obra gruesa estructural por defecto |
| **Reconstrucción** | Permiso de reconstrucción | 0,1,2,4,5,6,9 |
| **Reparación** | Permiso/aviso de reparación | 0,1,3,5,9 — terminaciones y especialidades puntuales |
| **Obra menor** | Aviso obra menor (OGUC art. 5.1.4) | **0 (reducido),1,5,9** — esqueleto mínimo |

> Nota: "Remodelación" y "Reforma" no son categorías de permiso en la OGUC; se asimilan a **Alteración** o a **Ampliación** según corresponda. El generador no las ofrece como opción separada para mantener coincidencia con la DOM.

---

# Capítulo 0 — Antecedentes Generales y Marco Normativo

*Capítulo fijo. Siempre presente. En `obra_menor` se emite la versión reducida (0.1, 0.2, 0.6).*

### [0.1] Alcance y naturaleza del documento
- nch1150: 0 / GENERALIDADES
- activa_si: siempre
- texto: El presente documento corresponde a las **Especificaciones Técnicas Generales de Arquitectura y Construcción** del proyecto "{nombre_proyecto}", ubicado en {direccion}, comuna de {comuna}, Región {region}. Definen los estándares mínimos de materiales, ejecución y terminación de las partidas de arquitectura y obra civil. Son **complementarias** a las especificaciones técnicas de las demás especialidades del proyecto y no las reemplazan. La intervención se clasifica como **{naturaleza}** conforme a la OGUC.

### [0.2] Marco normativo obligatorio
- nch1150: 0 / CUMPLIMIENTO OGUC + NORMAS
- activa_si: siempre
- texto: Toda la obra se ejecutará conforme a la **Ley General de Urbanismo y Construcciones (LGUC)** y su **Ordenanza General (OGUC)**, al **Instrumento de Planificación Territorial** vigente en la comuna, y a las normas chilenas del **INN** aplicables, en especial la **NCh 1150** (clasificación de partidas), las normas estructurales y de materiales que correspondan al sistema constructivo, la **Ley 16.744** y el **DS 594** (higiene y seguridad), la **Ley 20.422 y DS 50** (accesibilidad universal) y la reglamentación térmica de la OGUC (art. 4.1.10). El contratista declara conocerlas y obliga su cumplimiento integral.

### [0.3] Especificaciones complementarias del proyecto
- nch1150: 0 / DOCUMENTO
- activa_si: siempre (lista poblada por `eett_complementarias[]`)
- texto: Estas especificaciones se entienden **complementarias** a las siguientes EETT de especialidad, que forman parte del proyecto y prevalecen en su materia: {lista_eett_complementarias}. Ante vacío o discrepancia en materias de especialidad, rige la EETT de la especialidad respectiva.

### [0.4] Prelación de documentos
- nch1150: 0 / DOCUMENTO
- activa_si: naturaleza ≠ obra_menor
- texto: En caso de discrepancia entre antecedentes, el orden de prelación será: (1) planos de detalle, (2) planos generales, (3) estas especificaciones técnicas, (4) cuadro de cubicaciones. Toda duda será resuelta por la Inspección Técnica de la Obra (ITO). Lo no especificado se ejecutará según la **regla del arte** y las buenas prácticas de la construcción.

### [0.5] Control de calidad y recepción
- nch1150: 0 / MEDIDA CONTROL DE CALIDAD
- activa_si: naturaleza ≠ obra_menor
- texto: Los materiales serán nuevos, de primera calidad y contarán con certificación o ensayo cuando la norma lo exija. La ITO podrá rechazar materiales o ejecuciones que no cumplan, siendo el rehacer de cargo del contratista. La recepción de cada partida queda condicionada a la conformidad de la ITO y a la entrega de los certificados correspondientes.

### [0.6] Advertencia de uso y responsabilidad profesional
- nch1150: 0 / GENERALIDADES
- activa_si: siempre
- texto: **Este documento constituye una base general de carácter referencial.** Debe ser revisado, complementado y firmado por el profesional competente del proyecto, quien asume la responsabilidad de su contenido, su completitud y su coherencia con los planos y demás antecedentes. El generador automatizado no sustituye el juicio técnico ni la firma profesional exigida por la LGUC.

---

# Capítulo 1 — Obras Preliminares e Instalación de Faenas

*Capítulo fijo.*

### [1.1] Instalación de faenas
- nch1150: A / OBRA PROVISORIA
- activa_si: siempre
- texto: El contratista proveerá e instalará bodegas, oficina de obra, camarines y servicios higiénicos provisorios para el personal, conforme al DS 594. Al término de la obra se retirarán todas las instalaciones provisorias, dejando el terreno limpio.

### [1.2] Empalmes provisorios
- nch1150: A / OBRA PROVISORIA
- activa_si: naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}
- texto: Se gestionarán y ejecutarán los empalmes provisorios de agua potable y energía eléctrica necesarios para la faena, con sus medidores, siendo los consumos de cargo del contratista hasta la recepción.

### [1.3] Cierro provisorio y letrero de obra
- nch1150: A / OBRA PROVISORIA
- activa_si: naturaleza ≠ obra_menor
- texto: Se instalará cierro provisorio perimetral que aísle la faena del tránsito público y un letrero de obra según las exigencias municipales y del mandante. Ambos se mantendrán en buen estado durante toda la obra.

### [1.4] Trazado, niveles y replanteo
- nch1150: A / TRABAJO PRELIMINAR
- activa_si: siempre
- texto: Previo al inicio se ejecutará el trazado y replanteo de la obra a partir de los puntos de referencia y niveles indicados en los planos, materializando ejes y cotas. La ITO verificará el trazado antes de autorizar el avance.

### [1.5] Medidas de seguridad y protección ambiental
- nch1150: A / TRABAJO PRELIMINAR
- activa_si: naturaleza ≠ obra_menor
- texto: Se dispondrán las medidas de prevención de riesgos (Ley 16.744, DS 594) y de control de polvo, ruido y manejo de residuos durante la faena, protegiendo a terceros y a las edificaciones colindantes.

---

# Capítulo 2 — Obras de Habilitación del Terreno

*Condicional.*

### [2.1] Despeje y limpieza del terreno
- nch1150: B / DESHABILITACION TERRENO
- activa_si: naturaleza ∈ {obra_nueva, reconstruccion} OR urbanizacion incluye algo
- texto: Se retirará la vegetación, escombros y elementos sueltos de la superficie a intervenir, trasladando los excedentes a botadero autorizado. La capa vegetal se removerá en el área de fundaciones y pavimentos.

### [2.2] Movimiento de tierras
- nch1150: B / MOVIMIENTO DE TIERRA HABILITACION
- activa_si: fundaciones = sí AND naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}
- texto: Comprende excavaciones, rellenos y compactaciones necesarios para alcanzar los niveles de proyecto. Los rellenos estructurales se ejecutarán por capas compactadas a la densidad exigida y los excedentes se retirarán a botadero autorizado.

### [2.3] Muros de contención y estabilización
- nch1150: B / MURO DE CONTENCION
- activa_si: opcional (selección manual)
- texto: Donde lo indiquen los planos se ejecutarán muros de contención y obras de estabilización de taludes, conforme al proyecto de cálculo estructural respectivo (EETT de Estructuras), que prevalece en su diseño y armaduras.

---

# Capítulo 3 — Demoliciones, Desarmes y Obras Previas

*Condicional. Núcleo de intervenciones sobre lo existente.*

### [3.1] Demoliciones y desarmes
- nch1150: B / DESHABILITACION TERRENO
- activa_si: demoliciones = sí
- texto: Se demolerán y/o desarmarán los elementos indicados en planos (tabiques, revestimientos, pavimentos, cielos), con cuidado de no dañar lo que permanece. Los retiros se harán de forma selectiva para permitir el reciclaje cuando corresponda.

### [3.2] Retiro de artefactos e instalaciones existentes
- nch1150: B / DESHABILITACION TERRENO
- activa_si: demoliciones = sí AND (banos = sí OR instalaciones no vacío)
- texto: Se retirarán artefactos sanitarios, redes eléctricas, luminarias y ductos que queden fuera de uso, sellando provisoriamente las acometidas para evitar fugas o riesgos durante la obra.

### [3.3] Retiro de escombros
- nch1150: A / OBRA PROVISORIA
- activa_si: demoliciones = sí
- texto: El escombro producto de las demoliciones se acopiará en forma ordenada y se trasladará a botadero autorizado, con la documentación de disposición que la autoridad exija.

---

# Capítulo 4 — Obra Gruesa

*Condicional. Texto adaptativo según `estructura[]`.*

### [4.1] Fundaciones
- nch1150: C / FUNDACION
- activa_si: fundaciones = sí
- texto: Las fundaciones se ejecutarán según el proyecto de cálculo (EETT de Estructuras). Para sistema {estructura}, se considerarán {fundacion_tipo: corridas de hormigón / poyos y pilotes / zapatas aisladas} sobre sello de fundación verificado por la ITO. El hormigón cumplirá la resistencia especificada y el acero la NCh 204/211.

### [4.2] Sobrecimientos y radier
- nch1150: C / SOBRECIMIENTO + BASE DE PAVIMENTO
- activa_si: radier = sí OR fundaciones = sí
- texto: Sobre las fundaciones se ejecutarán sobrecimientos de hormigón y radier de espesor {espesor} sobre base estabilizada y polietileno de 0,2 mm como barrera de humedad. La superficie quedará nivelada y afinada según el pavimento de terminación previsto.

### [4.3] Estructura resistente vertical
- nch1150: C / ESTRUCTURA RESISTENTE VERTICAL
- activa_si: naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion}
- texto: Los elementos verticales (muros y pilares) se ejecutarán en {estructura} conforme al proyecto de cálculo. Hormigón armado según NCh 430/170; albañilería confinada según NCh 2123; estructura metálica según NCh 427; madera estructural según NCh 1198. Las dimensiones y armaduras priman desde la EETT de Estructuras.

### [4.4] Estructura resistente horizontal (losas y entrepisos)
- nch1150: C / DINTEL ESTRUCTURA RESISTENTE HORIZONTAL
- activa_si: naturaleza ∈ {obra_nueva, ampliacion_mayor, reconstruccion} AND estructura incluye {hormigon, metalica}
- texto: Las losas y entrepisos se ejecutarán según el proyecto de cálculo, con hormigón armado o sistema colaborante metálico según corresponda, incluyendo su aislación térmica y barrera de vapor donde el proyecto lo indique.

### [4.5] Estructura de techumbre
- nch1150: C / ESTRUCTURA DE TECHUMBRE
- activa_si: techumbre = sí
- texto: La estructura de techumbre se ejecutará en {techumbre_estructura}: cerchas o entramado de madera (NCh 1198), perfilería metálica (NCh 427), cercha industrializada certificada, o losa de hormigón inclinada según el caso. Se dimensionará conforme al proyecto de cálculo y a las cargas de viento y nieve aplicables (NCh 431/432).

### [4.6] Cubierta
- nch1150: C / ESTRUCTURA DE TECHUMBRE (CLARABOYA/CUBIERTA)
- activa_si: techumbre = sí
- texto: La cubierta será de {cubierta_material} sobre la estructura especificada, con fieltro o membrana hidrófuga, hojalatería de forros, canales y bajadas de aguas lluvias. Las pendientes y traslapos garantizarán estanqueidad conforme a la recomendación del fabricante.

---

# Capítulo 5 — Terminaciones

*Condicional. El bloque más usado en alteraciones y reparaciones.*

### [5.1] Tabiquería interior
- nch1150: D / DIVISION
- activa_si: tabiqueria = sí
- texto: Los tabiques se ejecutarán en estructura de {tabique_estructura: perfilería metálica galvanizada / madera} revestida en planchas de yeso-cartón, usando placa resistente a la humedad (RH) en recintos húmedos. Quedarán a plomo, con encuentros sellados y listos para recibir terminación.

### [5.2] Revestimiento de muros
- nch1150: D / REVESTIMIENTO INTERIOR
- activa_si: rev_muros no vacío
- texto: Los muros recibirán terminación de {rev_muros}: pintura sobre empaste, revestimiento cerámico en zonas húmedas, o entablado de madera según el caso. Las superficies quedarán parejas, sin fisuras visibles y aptas para su uso.

### [5.3] Cielos
- nch1150: D / CIELO MODULAR
- activa_si: cielos ≠ sin_cielo
- texto: Los cielos serán {cielos: modulares tipo americano sobre estructura suspendida / placas de yeso-cartón con junta invisible}, nivelados, con registros y pasadas para luminarias e instalaciones. Se usará placa RH en recintos húmedos.

### [5.4] Pavimentos / pisos
- nch1150: D / REVESTIMIENTO INTERIOR (PISO)
- activa_si: pisos no vacío
- texto: Los pisos serán de {pisos} según recinto: porcelanato o cerámico esmaltado con fragüe, piso vinílico en rollo o palmeta, piso flotante laminado, hormigón pulido o alfombra. Se instalarán sobre superficie nivelada y limpia, con guardapolvo o esquinero sanitario según el recinto.

### [5.5] Puertas
- nch1150: D / DIVISION (VANO)
- activa_si: puertas no vacío
- texto: Las puertas serán de {puertas}: hoja de MDF/madera enchapada, metálica, cristal templado o aluminio, con su marco, quincallería y cierre. Las dimensiones de paso cumplirán la normativa de accesibilidad universal donde aplique (DS 50).

### [5.6] Ventanas
- nch1150: D / DIVISION (VANO) + control solar
- activa_si: ventanas no vacío
- texto: Las ventanas serán de {ventanas}: perfilería de aluminio, PVC, madera o fierro, con cristal según la exigencia térmica del recinto (termopanel donde la reglamentación térmica lo requiera). Se instalarán selladas, a plomo y con su quincallería operativa.

### [5.7] Pinturas
- nch1150: D / PINTURA
- activa_si: pinturas = sí
- texto: Se aplicará esquema de pintura según superficie: látex en muros y cielos interiores, esmalte al agua en zonas húmedas, esmalte sintético o anticorrosivo en elementos metálicos. Mínimo dos manos sobre superficie preparada, con terminación pareja y sin descuelgues.

### [5.8] Impermeabilización de recintos húmedos
- nch1150: D / HIDRORREPELENTE
- activa_si: banos = sí
- texto: En baños y recintos húmedos se aplicará impermeabilización de piso y faldón de muro previo al revestimiento, con membrana o mortero hidrófugo, garantizando estanqueidad en encuentros y pasadas.

---

# Capítulo 6 — Instalaciones (Especialidades)

*Condicional. Texto de coordinación; el diseño prima desde cada EETT de especialidad.*

### [6.1] Instalación eléctrica
- nch1150: E / INSTALACION ELECTRICA
- activa_si: instalaciones incluye electrica
- texto: La instalación eléctrica se ejecutará conforme al proyecto eléctrico aprobado y a la normativa SEC vigente. Esta partida cubre la coordinación arquitectónica (canalizaciones embutidas, cajas, alturas de artefactos); el diseño y la memoria priman desde la EETT de Electricidad.

### [6.2] Instalación sanitaria (agua potable y alcantarillado)
- nch1150: E / INSTALACION AGUA + AGUA SERVIDA + ARTEFACTO SANITARIO
- activa_si: instalaciones incluye sanitaria OR banos = sí
- texto: Las redes de agua potable, alcantarillado y artefactos sanitarios se ejecutarán según el proyecto sanitario aprobado y la normativa vigente. Se incluyen artefactos, grifería y fijaciones; el dimensionamiento de redes prima desde la EETT Sanitaria.

### [6.3] Climatización y ventilación
- nch1150: E / INSTALACION CLIMATIZACION
- activa_si: instalaciones incluye climatizacion
- texto: Los sistemas de climatización, ventilación y extracción se ejecutarán según el proyecto de la especialidad. Esta partida cubre las pasadas, soportes y coordinación con cielos y tabiques; el diseño térmico prima desde la EETT de Climatización.

### [6.4] Gas
- nch1150: E / INSTALACION GAS
- activa_si: instalaciones incluye gas
- texto: La instalación de gas se ejecutará conforme al proyecto aprobado y a la normativa SEC, con su certificación de inspección. El diseño prima desde la EETT de Gas.

### [6.5] Corrientes débiles (datos, CCTV, telefonía)
- nch1150: E / INSTALACION COMUNICACION
- activa_si: instalaciones incluye corrientes_debiles
- texto: Las redes de datos, telefonía, CCTV e intercomunicación se canalizarán según el proyecto de corrientes débiles. Esta partida cubre canalizaciones y cajas; el diseño prima desde la EETT respectiva.

### [6.6] Red de incendio
- nch1150: E / INSTALACION CONTRA INCENDIO
- activa_si: instalaciones incluye incendio
- texto: La red húmeda/seca, detección y señalética de incendio se ejecutarán según el proyecto de seguridad contra incendios y la OGUC. El diseño prima desde la EETT de Incendio.

### [6.7] Transporte vertical (ascensores y montacargas)
- nch1150: F / ASCENSOR + MONTACARGA
- activa_si: instalaciones incluye transporte_vertical
- texto: Los ascensores y/o montacargas se proveerán e instalarán conforme al proyecto de la especialidad y a la normativa vigente, incluyendo obra civil de foso y sala de máquinas. El diseño prima desde la EETT de Transporte Vertical.

---

# Capítulo 8 — Obras de Urbanización y Exteriores

*Condicional.*

### [8.1] Pavimentos exteriores
- nch1150: H / SUPERFICIE SEMIDURA + I / PAVIMENTO
- activa_si: urbanizacion incluye pav_exterior
- texto: Los pavimentos exteriores (accesos, circulaciones, estacionamientos) se ejecutarán en hormigón, adoquín o asfalto según los planos, sobre base estabilizada compactada, con sus juntas y pendientes de evacuación de aguas.

### [8.2] Áreas verdes y paisajismo
- nch1150: H / PLANTACION CESPED + MATERIAL VEGETAL
- activa_si: urbanizacion incluye areas_verdes
- texto: Las áreas verdes incluyen preparación de suelo, plantación de césped, arbustos y especies indicadas, y su sistema de riego. El detalle de especies prima desde la EETT de Paisajismo cuando exista.

### [8.3] Cierros perimetrales
- nch1150: I / MURETE EXTERIOR + MURO EXTERIOR
- activa_si: urbanizacion incluye cierros
- texto: Los cierros perimetrales definitivos se ejecutarán según los planos (albañilería, paneles, reja metálica), incluyendo portones de acceso peatonal y vehicular con su quincallería.

### [8.4] Evacuación de aguas lluvias exteriores
- nch1150: I / URBANIZACION AGUA LLUVIA
- activa_si: urbanizacion incluye aguas_lluvia
- texto: Se ejecutará el sistema de captación y evacuación de aguas lluvias del terreno (sumideros, canaletas, drenes) conforme al proyecto, evitando empozamientos y descargando a la red o punto autorizado.

---

# Capítulo 9 — Aseo, Entrega y Recepción

*Capítulo fijo.*

### [9.1] Aseo de entrega
- nch1150: A / OBRA PROVISORIA (ASEO)
- activa_si: siempre
- texto: Antes de la recepción se ejecutará el aseo general de la obra, retirando escombros, sobrantes y protecciones, y entregando todas las superficies limpias y operativas.

### [9.2] Pruebas, certificados y recepción
- nch1150: 0 / MEDIDA CONTROL DE CALIDAD
- activa_si: naturaleza ≠ obra_menor
- texto: Previo a la recepción, el contratista entregará los certificados, pruebas de instalaciones y planos *as-built* que correspondan. La recepción municipal y del mandante se gestionará conforme a la LGUC, dejando la obra en condiciones de uso.

### [9.3] Garantía de obra
- nch1150: 0 / GENERALIDADES
- activa_si: naturaleza ≠ obra_menor
- texto: El contratista garantizará la obra por el período que establezca el contrato, respondiendo por defectos de materiales o ejecución que se manifiesten en dicho plazo conforme a la legislación vigente.

---

## Anexo — Tabla de trazabilidad NCh 1150

| Capítulo generador | Sección NCh 1150 | Código |
|---|---|---|
| 0 Antecedentes | Generalidades | 0 |
| 1 Preliminares y faenas | Gastos adicionales y obras preliminares | A |
| 2 Habilitación del terreno | Obras de habilitación del terreno | B |
| 3 Demoliciones / obras previas | A / B (deshabilitación) | A/B |
| 4 Obra gruesa | Obra gruesa | C |
| 5 Terminaciones | Terminaciones | D |
| 6 Instalaciones | Instalaciones / Sist. mecánicos de transporte | E / F |
| 8 Urbanización y exteriores | Obras de urbanización / Obras complementarias terreno propio | H / I |
| 9 Aseo y recepción | A (aseo) + 0 (recepción) | A / 0 |

*Fin del catálogo. Versión 1.0 — base para validación.*
