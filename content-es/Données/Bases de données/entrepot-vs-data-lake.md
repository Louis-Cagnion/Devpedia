---
order: 5
---

# Almacén de datos contra data lake

El capítulo [El modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile) habla de **almacén de datos** (*data warehouse*) sin detallar qué lo distingue de una base simple: es una base dedicada al análisis, con un esquema impuesto incluso antes de escribir nada en ella. El **data lake** (*lago de datos*) responde a la misma necesidad de acumular histórico, pero invirtiendo este principio: se almacena primero, se decide la estructura después.

## Esquema impuesto en la escritura, o decidido en la lectura

Un almacén de datos exige un esquema definido antes de cualquier carga: cada tabla tiene columnas tipadas de antemano (`CREATE TABLE hecho_ventas (importe DECIMAL(10, 2), ...)`), y una fila que no corresponde a ese esquema se rechaza en el momento de la escritura. Es el **schema-on-write**: la estructura se decide de antemano, la verificación se hace en la entrada.

Un data lake acepta cualquier archivo tal cual está: un CSV, un JSON, una imagen, un archivo de logs brutos, sin exigir esquema en el momento del depósito. La estructura solo se decide cuando un procesamiento viene a leer estos archivos y les aplica una interpretación. Es el **schema-on-read**: la verificación se pospone a la lectura, nunca se impone en la escritura.

```text
Almacén de datos (schema-on-write):
  archivo fuente --> verificado contra el esquema --> rechazado o insertado en una tabla tipada

Data lake (schema-on-read):
  archivo fuente --> almacenado tal cual, sin verificación --> estructura decidida en el momento de la lectura
```

## Visión de conjunto

| | Almacén de datos | Data lake |
|---|---|---|
| Esquema | Impuesto en la escritura (schema-on-write) | Decidido en la lectura (schema-on-read) |
| Formatos aceptados | Solo tablas estructuradas | Cualquier archivo (CSV, JSON, imagen, log...) |
| Coste de almacenamiento | Más alto (estructura, índices) | Más bajo (archivos brutos) |
| Uso típico | Reporting estable, paneles de negocio | Exploración, datos brutos en gran volumen, casos de uso aún no definidos |
| Velocidad de disponibilidad | Más lenta (la estructura debe definirse antes) | Inmediata (el archivo ya está ahí, tal cual) |

## La trampa: confundir "acepta todo" con "no necesita rigor"

> **Trampa:** tratar el data lake como un espacio sin ninguna regla, donde se depositan archivos sin organizarlos ni documentarlos nunca. Al cabo de unos meses, nadie sabe ya qué contiene cada archivo, ni si sigue actualizado: es lo que se llama un **data swamp** (*pantano de datos*), un data lake vuelto inutilizable por acumulación desordenada.
>
> **Buena práctica:** organizar el data lake con las mismas referencias que la [arquitectura medallón](/?c=bases-de-donnees&p=architecture-medaillon) (bronce/plata/oro), incluso si no se impone ningún esquema en la escritura: una carpeta o una convención de nombrado por fuente y por fecha, y una documentación de lo que contiene cada zona.

## La trampa: creer que hay que elegir uno u otro

> **Trampa:** pensar que una empresa debe elegir entre almacén y data lake de una vez por todas. Ambos responden a necesidades diferentes (reporting estable y fiable contra exploración de datos brutos variados), que a menudo coexisten en la misma organización.
>
> **Buena práctica:** usar un data lake para absorber datos brutos de cualquier naturaleza a bajo coste, y un almacén de datos (o la capa oro de una arquitectura medallón construida sobre ese lake) para lo que debe ser fiable y rápido de consultar para un informe de negocio. Algunas herramientas recientes (los **lakehouse**) combinan ambos: el almacenamiento económico de un data lake, con garantías de esquema cercanas a un almacén.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un almacén de datos impone un esquema antes de la escritura (schema-on-write) y solo almacena tablas estructuradas; un data lake acepta cualquier archivo tal cual está y solo decide su estructura en la lectura (schema-on-read). |
| **Herramientas utilizables** | `CREATE TABLE` con un esquema tipado para un almacén; un almacenamiento de archivos organizado por convención (bronce/plata/oro) para un data lake. |
| **Trampas a evitar** | Dejar que un data lake se convierta en un data swamp por acumulación desordenada; creer que hay que elegir entre ambos en lugar de hacerlos coexistir según la necesidad. |
| **Buenas prácticas** | Organizar un data lake según zonas claras incluso sin esquema impuesto; reservar el almacén (o la capa oro) para las necesidades de reporting fiable; considerar un lakehouse cuando ambas necesidades se solapan fuertemente. |
