# Glosario Normativo — **Memoria de Ruta Accesible** (Archibots)

> Fuente de verdad del catálogo. Transcripción literal de los ítems, descripciones y referencias tal como aparecen en el formulario. El código (`index.html`) refleja exactamente estos textos (`as const`, sin mutación). Base normativa: OGUC art. 4.1.7 y atingentes 4.2.5, 4.2.18, 4.5.8, 6.4.2.

## Comportamiento de la interfaz (v2)

- **Checkboxes en lugar de selector.** Cada ítem se marca con checkboxes mutuamente excluyentes (Cumple / No cumple / No aplica) para acelerar el llenado. Excepción: el ítem **3.1** tiene 4 alternativas (`EST_3_1`).
- **Colapso por grupo, no por ítem.** Lo que se colapsa/expande son los **grupos generales** (1, 2, 3…), cada uno con su flecha `▶`. Dentro de un grupo abierto, **todos los ítems y sus checkboxes se ven directamente**, sin necesidad de desplegar línea por línea. La cabecera del grupo muestra un resumen de estados (p. ej. "1 no cumple · 2 ok") aunque esté colapsado.
- **Subítems colapsables en secciones 4 y 5.** En Servicios higiénicos y Ducha, cada subítem sí es individualmente colapsable. Si el estado general es **No aplica**, los subítems quedan ocultos; reaparecen solo si el usuario cambia el estado general a **Aplica**.
- **Carga de ocupación persistente.** El valor de carga del encabezado y el del bloque asistido 2.1 son **el mismo dato**: editar uno actualiza el otro y recalcula el ancho OGUC.
- **Cálculo OGUC en 2.1.** El ancho mínimo de la ruta se deriva de la carga de ocupación según OGUC (ver sección 2.1).

---

## Catálogos de estado

> **UI:** el estado se elige con **checkboxes mutuamente excluyentes** (radio buttons estilizados), no con selector desplegable, para acelerar el llenado. Cada ítem viene **colapsado** por defecto; se despliega con la flecha (`▶`).

### `ESTADO_3` — estándar
| valor | etiqueta |
|---|---|
| `cumple` | Cumple |
| `no-cumple` | No cumple |
| `no-aplica` | No aplica |

### `EST_3_1` — exclusivo del ítem 3.1 (4 alternativas)
| valor | etiqueta |
|---|---|
| `rampas` | Contempla rampas |
| `ascensor` | Contempla ascensor |
| `rampa-ascensor` | Rampa y ascensor |
| `no-aplica` | No aplica |

---

## 1. Encabezado / datos base

> Datos cargados automáticamente desde el cliente/proyecto seleccionado.

| Campo | Tipo | Valor por defecto |
|---|---|---|
| Nombre del proyecto | texto | `Proyecto sin nombre` |
| Ubicación | texto | `Dirección no informada · Comuna no informada` |
| Arquitecto | texto | `Arquitecto no informado` |
| Superficie referencial (m2) | número | `0` |
| Carga de ocupación | número | `0` |

---

## 2. Generalidades (texto por defecto)

> Texto sugerido editable. Puedes ajustarlo antes de generar el informe.

```
La presente memoria tiene como objetivo analizar cada punto de la normativa relativa a la
accesibilidad universal en la edificación pública. En este caso se trata de una edificación
con una superficie de {superficie} m2 y una carga de ocupación de {carga} personas.
A continuación, se enumera un listado de requerimientos según el artículo 4.1.7 de la Ordenanza
General de Urbanismo y Construcciones y parte de los artículos 4.2.5, 4.2.18, 4.5.8 y 6.4.2 de
la misma, que son atingentes al presente proyecto de diseño.
```

`{superficie}` y `{carga}` se sincronizan con los campos del encabezado.

---

## 3. Verificaciones normativas principales

### Grupo 1 — Condiciones generales de la ruta accesible

**1.1 Ancho mínimo interior de la ruta** · estado: `ESTADO_3` · default **No aplica**
La ruta accesible interior debe mantener un ancho libre mínimo de 1,10 m, sin estrangulamientos por puertas, pilares, muebles o elementos salientes.
*Referencia: mínimo 1,10 m*

**1.2 Altura mínima libre de paso** · estado: `ESTADO_3` · default **Cumple**
La altura libre de la ruta en todo su recorrido debe ser mayor a 2,10 m, teniendo en cuenta interferencias por vigas, equipos, señalética u otros elementos suspendidos.
*Referencia: mayor a 2,10 m*

**1.3 Pasillos que forman parte de la ruta con ancho mínimo de 1,5 m** · estado: `ESTADO_3` · default **Cumple**
Incluye todos los pasillos que sean parte de la ruta accesible y conduzcan a unidades o recintos que contemplen atención de público.
*Referencia: mínimo 1,5 m*

### Grupo 2 — Continuidad desde salida del edificio al espacio público

**2.1 Ancho de ruta entre salida y espacio público** · estado: `ESTADO_3` · **bloque asistido**
El tramo que conecta la salida del edificio con el espacio público debe ser continuo, estable, antideslizante y con ancho libre verificable, con un ancho mínimo de 1,10 m.
*Referencia: mínimo 1,10 m* · *Se calcula en el bloque asistido.*

Bloque asistido (cálculo OGUC):
- ☑ Usar carga de ocupación total — *Modo recomendado para la versión actual (proyectos de hasta 2 pisos).*
- Carga de ocupación total (número) — **persistente** con el campo de carga del encabezado.
- Número de vías de evacuación / salidas (número, default `1`)
- ancho mínimo a usar para la ruta acesible (m) (número, default `1,1`)
- Salidas: Ancho exigido OGUC · Ancho exigido por vía · Ancho mínimo aplicable
- Verificación: Cumple si ancho proyectado >= ancho mínimo aplicable.

**Fórmula OGUC** (Art. 4.2.18 y 4.2.5): el ancho exigido = **0,5 cm (0,005 m) por persona** × (carga ÷ N° de vías), con un **mínimo normativo de 1,10 m**. El ancho mínimo aplicable es el mayor entre ese resultado y el ancho mínimo declarado por el usuario.

### Grupo 3 — Cambios de nivel y continuidad de desplazamiento

**3.1 Desniveles salvados mediante rampas y ascensores** · estado: `EST_3_1` · default **Contempla rampas**
Todo cambio de nivel de la ruta accesible debe resolverse mediante rampa o ascensor accesible.
*Referencia: debe existir solución accesible*

**3.2 Desnivel máximo entre juntas de pisos de 0,5 cm** · estado: `ESTADO_3` · default **Cumple**
El desnivel máximo permitido entre juntas o cambios de pavimento es de 0,5 cm.
*Referencia: máximo 0,5 cm*

**3.3 Pendientes de planos inclinados inferiores a 5%** · estado: `ESTADO_3` · default **Cumple**
Cuando el plano inclinado se declara como circulación con baja pendiente, se debe verificar en terreno que los tramos no superen el valor declarado.
*Referencia: < 5%*

### Grupo 4 — Escaleras y seguridad de circulación

**4.1 Franja de contraste cromático frente a escaleras de 0,6 m de ancho** · estado: `ESTADO_3` · default **Cumple**
Debe incorporarse señalización visual de contraste antes del inicio de la escalera para advertir cambios de nivel y mejorar legibilidad del borde.
*Referencia: debe existir señalización*

**4.2 Protección bajo escaleras** · estado: `ESTADO_3` · default **Cumple**
Bajo escaleras, cuando la altura sea inferior a 2,1 m, debe existir barrera o protección de 0,95 m de alto.
*Referencia: altura de protección 0,95 m*

### Grupo 5 — Rampa o plano inclinado

**5.1 Ancho de rampa equivalente a la vía de evacuación de la que es parte** · estado: `ESTADO_3` · default **Cumple**
En interiores, su ancho corresponderá al de esta vía. En exteriores, debe ser el ancho de la vereda que enfrenta, con un mínimo de 1,2 m.
*Referencia: mínimo 1,2 m en exteriores*

**5.2 Ancho de rampa cuando no forma parte de una vía de evacuación** · estado: `ESTADO_3` · default **Cumple**
Si no es parte de una vía de evacuación, su ancho mínimo podrá ser 0,90 m.
*Referencia: mínimo 0,90 m*

**5.3 Inicio y fin de recorrido** · estado: `ESTADO_3` · default **Cumple**
Inicio y fin de recorrido en un plano horizontal del mismo ancho y de 1,50 m de largo mínimo, fuera del barrido de las hojas de puertas.
*Referencia: largo mínimo 1,50 m*

**5.4 Pendiente y largo normativo** · estado: `ESTADO_3` · default **Cumple**
La pendiente normativa será entre 8% y 12%, con un largo mínimo de 1,5 m y un máximo de 9 m.
*Referencia: pendiente 8%-12% y largo 1,5 m a 9 m*

**5.5 Pasamanos en rampas mayores a 1,5 m** · estado: `ESTADO_3` · default **Cumple**
Las rampas cuya longitud sea mayor a 1,50 m deberán estar provistas, en ambos costados, de un pasamanos continuo de dos alturas.
*Referencia: pasamanos continuo en ambos costados*

**5.6 Las rampas de longitud hasta 1,5 m** · estado: `ESTADO_3` · default **Cumple**
Las rampas con longitud de hasta 1,50 m deberán contemplar una solera o resalte de borde de 0,10 m como mínimo, o una baranda a una altura mínima de 0,95 m.
*Referencia: resalte 0,10 m o baranda 0,95 m*

### Grupo 6 — Ascensores y áreas de maniobra

**6.1 Área mínima frente a ascensor de 1,5 x 1,5 m** · estado: `ESTADO_3` · default **No aplica**
Frente a la puerta del ascensor debe tener un largo y ancho mínimo de 1,50 m.
*Referencia: mínimo 1,5 x 1,5 m*

**6.2 Ancho frente a cabina** · estado: `ESTADO_3` · default **No aplica**
El ancho frente a la puerta del ascensor no podrá ser menor que la profundidad de la cabina.
*Referencia: ancho >= profundidad de cabina*

### Grupo 7 — Puertas y pasillos

**7.1 Puerta de ingreso al edificio y a unidades de 0,9 m** · estado: `ESTADO_3` · default **Cumple**
Las puertas de ingreso al edificio, o a las unidades o a los recintos de la edificación colectiva que consulten atención de público, deberán tener un ancho libre de paso de 0,90 m.
*Referencia: ancho libre 0,90 m*

**7.2 Puerta de ingreso al edificio dobles** · estado: `ESTADO_3` · default **Cumple**
De contemplarse doble puerta, el espacio entre estas debe considerar un espacio libre de mínimo 1,20 m de largo, además del largo del barrido de ambas puertas.
*Referencia: espacio libre mínimo 1,20 m*

**7.3 Fondos de pasillos que son parte de una ruta accesible** · estado: `ESTADO_3` · default **Cumple**
Se contemplará una superficie libre de un diámetro mínimo de 1,50 m que garantice el giro en 360° de una persona en silla de ruedas.
*Referencia: diámetro mínimo 1,50 m*

### Grupo 8 — Atención accesible

**8.1 Mesones de atención accesible** · estado: `ESTADO_3` · default **Cumple**
Deben contemplar al menos un tramo de 1,2 m de ancho, con altura terminada máxima de 0,8 m y 0,7 m libre bajo esta, con una profundidad de 0,6 m compatible para atención de usuarios en silla de ruedas.
*Referencia: tramo 1,2 m; altura 0,8 m; libre 0,7 m; profundidad 0,6 m*

**8.2 Área de aproximación a mesón accesible** · estado: `ESTADO_3` · default **Cumple**
Debe contemplar una superficie de 1,5 m de diámetro para el giro de silla de ruedas, pudiendo incluir el área bajo el mesón.
*Referencia: diámetro 1,5 m*

---

## 4. Servicios higiénicos accesibles

> Bloque siempre visible con estado general (`Aplica` / `No aplica`) y subítems individuales (`ESTADO_3`, default **Cumple**).

1. Superficie para giro 360° de diámetro 1,5 m
2. Puerta de acceso con ancho libre mínimo 0,8 m
3. Altura de lavamanos de 0,8 m desde el NPT y espacio libre bajo cubierta de 0,7 m
4. Grifería de palanca, de presión o de acción automática mediante sensor.
5. Espejo de altura de inicio de 3 cm máximo desde cubierta de lavamanos.
6. El inodoro contempla espacio de transferencia lateral de 0,8 x 1,2 m.
7. Altura de asiento de inodoro entre 0,46 y 0,48 m.
8. Barras fijas y abatibles para inodoro.
9. Altura de accesorios máximo a 1,2 m.

---

## 5. Ducha

> Bloque siempre visible con estado general (`Aplica` / `No aplica`) y subítems operativos (`ESTADO_3`, default **Cumple**).

1. Puerta paso libre 0,8 m
2. Apertura puerta no debe interferir con radio de giro.
3. Tamaño de receptáculo 0,9 x 1,20 m
4. Espacio de transferencia lateral.
5. Espacio para asiento de 0,45 x 0,45 m y altura terminada de 0,46.

---

## 6. Conclusión (texto por defecto)

> Sugerencia automática editable según resultados de cumplimiento.

```
La revisión no presenta incumplimientos para los ítems evaluados y mantiene una base favorable
de accesibilidad universal. Se sugiere conservar respaldo técnico y evidencias de terreno para
la tramitación.
```

---

## 7. Imágenes (opcional)

- Hasta **4 imágenes** (planta/ruta y detalles).
- Formatos: **JPG/JPEG y PNG**.
- *Los archivos seleccionados no persisten por limitación del navegador.*

---

## 8. Firma

> Se utilizarán automáticamente los datos del arquitecto registrados en el sistema al momento de generar el PDF.
