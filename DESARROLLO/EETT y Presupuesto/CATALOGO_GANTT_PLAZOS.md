# Catálogo de Plazos — Carta Gantt General de Obra

**Estimador de plazos por capítulo · Chile**
Estructura de partidas coherente con las EETT y el Presupuesto (mismos capítulos NCh 1150).
Este archivo es la **fuente de plazos**: el generador de Gantt lo consume para dibujar las
barras. Editable a mano; los valores son referenciales (semanas) y el usuario los ajusta.

---

## 0. Cómo se usa

- Cada **capítulo** de obra tiene una **duración en semanas** y un **solape** (semanas que
  parten en paralelo con el capítulo anterior, para representar el traslape real de faenas).
- El capítulo aparece en la Gantt solo si tiene **al menos una partida activa** según el mismo
  selector de las EETT/Presupuesto (naturaleza, estructura, terminaciones, etc.).
- El generador ordena los capítulos por la columna `orden`, calcula inicio = fin del anterior −
  solape (mínimo 0) y fin = inicio + semanas, y escala todo al total de semanas.
- Convención de cada fila: `| orden | cap | nombre | semanas | solape |`

### Parámetros globales

| Parámetro | Default | Descripción |
|---|---|---|
| `fecha_inicio` | hoy | Fecha de inicio de obra (editable; define el calendario de semanas). |
| `dias_por_semana` | 6 | Solo informativo para el rótulo. |

---

## 1. Plazos por capítulo (semanas)

| orden | cap | nombre | semanas | solape |
|---|---|---|---|---|
| 1 | 1 | Obras Preliminares e Instalación de Faenas | 2 | 0 |
| 2 | 2 | Habilitación del Terreno | 2 | 1 |
| 3 | 3 | Demoliciones y Obras Previas | 1 | 1 |
| 4 | 4 | Obra Gruesa | 8 | 1 |
| 5 | 5 | Terminaciones | 8 | 3 |
| 6 | 6 | Instalaciones (Especialidades) | 6 | 5 |
| 7 | 7 | Térmica y Protección al Fuego | 2 | 1 |
| 8 | 8 | Urbanización y Exteriores | 3 | 2 |
| 9 | 9 | Aseo, Entrega y Recepción | 1 | 0 |

---

## 2. Notas de mantención

- **Ajustar plazos**: editar la columna `semanas` y `solape`. Subir `solape` acerca capítulos
  (más paralelo); bajarlo los separa (más secuencial).
- Capítulos 1 y 9 (preliminares y entrega) se consideran **siempre presentes**.
- Estos plazos son de referencia para una obra de edificación pequeña/mediana; recalibrar por
  tamaño y complejidad. A futuro se puede ligar la duración a los m² o al monto del presupuesto.

*Versión 1.0 — base para el generador de Carta Gantt.*
