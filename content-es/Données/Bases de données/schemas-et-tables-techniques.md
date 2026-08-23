---
order: 4
---

# Esquemas y tablas técnicas

Los capítulos anteriores ([modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile), [tabla puente](/?c=bases-de-donnees&p=table-pont)) cubren las tablas que llevan el análisis en sí: hechos, dimensiones, asociaciones. Una base real también contiene tablas que no sirven a ningún análisis pero hacen funcionar el pipeline que las alimenta, y un espacio de nombres que las organiza entre sí: el **esquema**.

## El esquema: un espacio de nombres para las tablas

Un **esquema** [SQL](/?c=domain-specific-languages-dsl&p=sql) es un espacio de nombres dentro de una base de datos: cada tabla le pertenece, y su nombre completo se escribe `esquema.tabla` (por ejemplo `dim.producto` en lugar de solo `producto`). Dos tablas del mismo nombre pueden coexistir sin conflicto si están en esquemas diferentes, y un esquema sirve sobre todo para indicar de un vistazo el papel de una tabla en una base que contiene cientos de ellas.

```sql
CREATE SCHEMA dim;
CREATE SCHEMA fact;

CREATE TABLE dim.producto (
    id_producto  INT PRIMARY KEY,
    nombre       VARCHAR(100)
);

CREATE TABLE fact.ventas (
    id_venta    INT PRIMARY KEY,
    id_producto INT
);
```

## dbo: el esquema por defecto

En [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), **dbo** (*database owner*) es el esquema creado por defecto: toda tabla creada sin precisar esquema cae ahí automáticamente. Una base que nunca creó otro esquema acaba por tanto con todas sus tablas en `dbo`, sea cual sea su papel (hecho, dimensión, técnica).

> **Trampa:** dejar todas las tablas en `dbo` por defecto, sin crear nunca otros esquemas. En una base de varios cientos de tablas, nada distingue entonces una tabla de hechos de una tabla técnica con solo leer su nombre completo; hay que abrir cada tabla para entender su papel.
>
> **Buena práctica:** crear esquemas nombrados por papel (`dim`, `fact`, `stg` para el staging, `admin` para las tablas técnicas) en cuanto una base supera un puñado de tablas, y usar `dbo` solo para lo que deliberadamente no pertenece a ninguna categoría precisa.

## Las tablas técnicas: hacen funcionar el pipeline, no el análisis

Una **tabla técnica** (a menudo guardada en un esquema `admin` o `meta`) no contiene ni hecho ni dimensión: almacena información sobre el funcionamiento del propio pipeline. El ejemplo más común es la tabla de **seguimiento de carga** (*watermark table*), que retiene hasta dónde llegó la última carga para solo volver a procesar las filas nuevas la vez siguiente.

```sql
CREATE TABLE admin.seguimiento_cargas (
    nombre_fuente    VARCHAR(50) PRIMARY KEY,
    ultima_carga     DATETIME
);
```

```sql
-- solo lee lo que llegó desde la última carga exitosa, en lugar de releerlo todo
SELECT *
FROM fuente_ventas
WHERE fecha_modificacion > (
    SELECT ultima_carga FROM admin.seguimiento_cargas WHERE nombre_fuente = 'ventas'
);

-- luego, una vez terminada la carga con éxito, se avanza la marca
UPDATE admin.seguimiento_cargas
SET ultima_carga = NOW()
WHERE nombre_fuente = 'ventas';
```

> **Trampa:** releer la totalidad de una fuente en cada ejecución del pipeline en lugar de seguir lo que ya se procesó. En una fuente que crece cada día, el tiempo de procesamiento aumenta sin fin mientras la mayor parte del trabajo rehace lo que ya estaba correcto el día anterior.
>
> **Buena práctica:** una tabla de seguimiento de carga por fuente, actualizada únicamente tras una carga exitosa (nunca antes, si no una ejecución que falla a mitad de camino hace creer al pipeline que se procesaron datos que no se procesaron).

## Trampa: mezclar tabla técnica y tabla de análisis

Como con el bronce y la plata de la [arquitectura medallón](/?c=bases-de-donnees&p=architecture-medaillon), nada impide técnicamente que una herramienta de reporting lea directamente una tabla técnica.

> **Trampa:** conectar un panel a `admin.seguimiento_cargas` o una tabla de staging porque la información ya está ahí presente. Estas tablas cambian de estructura según las necesidades del pipeline, sin consideración por un consumidor externo que se hubiera enganchado a ellas.
>
> **Buena práctica:** mantener las tablas técnicas en un esquema dedicado (`admin`, `stg`, `meta`), separado de los esquemas `dim`/`fact` destinados al análisis, para que un recién llegado sepa inmediatamente, con solo el nombre del esquema, qué tiene derecho a consultar.

## Visión de conjunto

| Esquema | Papel | Ejemplo | Quién lo consulta |
|---|---|---|---|
| `dim` | Dimensiones | `dim.producto` | Paneles, analistas |
| `fact` | Hechos | `fact.ventas` | Paneles, analistas |
| `stg` | Datos en tránsito (staging) | Copia bruta antes de limpiar | El propio pipeline |
| `admin` | Funcionamiento del pipeline | Seguimiento de carga, registro de errores | Las personas que mantienen el pipeline |
| `dbo` | Por defecto (SQL Server), o uso general sin categorizar | Según la base | Variable |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un esquema SQL es un espacio de nombres que organiza las tablas por papel (`dim`, `fact`, `stg`, `admin`); `dbo` es el esquema por defecto de SQL Server, que no hay que dejar recibir todas las tablas sin distinción. Las tablas técnicas (seguimiento de carga, registro de errores) hacen funcionar el pipeline pero no sirven para el análisis. |
| **Herramientas utilizables** | `CREATE SCHEMA` para organizar las tablas por papel; una tabla de seguimiento de carga (`admin.seguimiento_cargas`) para solo volver a procesar los datos nuevos en cada ejecución. |
| **Trampas a evitar** | Dejarlo todo en `dbo` sin distinción de papel; releer la totalidad de una fuente en cada ejecución del pipeline; conectar un panel directamente a una tabla técnica. |
| **Buenas prácticas** | Crear esquemas nombrados por papel en cuanto una base crece; actualizar el seguimiento de carga únicamente tras una carga exitosa; reservar las tablas técnicas a un esquema dedicado, separado del análisis. |
