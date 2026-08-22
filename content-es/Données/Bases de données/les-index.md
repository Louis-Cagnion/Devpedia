---
order: 6
---

# Los índices

La tabla OLTP/OLAP del capítulo [El modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile) evoca lecturas que recorren millones de filas. Sin ayuda, una base de datos solo puede encontrar las filas que cumplen una condición examinándolas una por una: es esto lo que un **índice** viene a evitar.

## El problema: buscar en una tabla no ordenada

Sin índice, `WHERE id_producto = 42` obliga a la base de datos a leer cada fila de la tabla, una por una, hasta tener todas las filas correspondientes. Es un **barrido completo** (*full scan*): el tiempo de búsqueda aumenta con el número de filas de la tabla, incluso si solo una corresponde a la condición.

```text
Tabla sin índice: 1 000 000 de filas leídas para encontrar las 3 filas donde id_producto = 42
```

## El índice: una estructura para encontrar sin leer todo

Un **índice** es una estructura separada que asocia un valor de columna a la ubicación exacta de las filas que lo llevan, un poco como el índice alfabético al final de un libro que da directamente el número de página de una palabra en lugar de buscarla página por página. Una vez creado el índice sobre `id_producto`, la base de datos puede saltar directamente a las filas concernidas sin leer las demás.

```sql
CREATE INDEX idx_hecho_ventas_producto ON hecho_ventas (id_producto);
```

```text
Tabla con índice sobre id_producto: la base consulta el índice, encuentra directamente la ubicación
de las 3 filas donde id_producto = 42, sin leer las otras 999 997.
```

## El compromiso: lectura más rápida, escritura más lenta

Un índice no es gratis: en cada inserción, modificación o eliminación de una fila, la base de datos también debe actualizar todos los índices que recaen sobre esa tabla, además de escribir la fila en sí. Cuantos más índices tiene una tabla, más cara resulta cada escritura.

| | Sin índice | Con índice |
|---|---|---|
| Lectura (`WHERE`, `JOIN`) | Barrido completo, lento en una tabla grande | Acceso directo, rápido |
| Escritura (`INSERT`/`UPDATE`/`DELETE`) | Rápida (nada más que mantener) | Más lenta (el índice también debe actualizarse) |
| Espacio en disco | Mínimo | Un índice ocupa espacio adicional |

Este compromiso se une a la tabla OLTP/OLAP del capítulo sobre el modelo en estrella: una base OLTP, que escribe constantemente, limita sus índices a lo estrictamente necesario; un almacén OLAP, que lee mucho más de lo que escribe, puede permitirse poner más.

## Trampa: no indexar las claves foráneas de una tabla de hechos

> **Trampa:** crear una tabla de hechos con sus claves foráneas hacia cada dimensión (`id_producto`, `id_cliente`, `id_fecha`), sin poner índice sobre estas columnas. Cada `JOIN` hacia una dimensión (ver [El modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile)) acaba entonces barriendo íntegramente la tabla de hechos, exactamente el caso que el índice se supone que evita.
>
> **Buena práctica:** indexar sistemáticamente las columnas de clave foránea de una tabla de hechos, ya que sirven de punto de entrada a casi todas las consultas de análisis que la conciernen.

## Trampa: indexar sin criterio

> **Trampa:** poner un índice en cada columna "por si acaso", o en una columna con muy pocos valores distintos (un booleano `activo` verdadero/falso, por ejemplo). En este último caso, el índice apenas reduce el número de filas a examinar (la mitad de la tabla lleva `verdadero`), mientras que igual cuesta en cada escritura.
>
> **Buena práctica:** indexar las columnas realmente usadas en un `WHERE`, un `JOIN` o un `ORDER BY`, y priorizar las que tienen muchos valores distintos (un identificador, una fecha) en lugar de un simple indicador verdadero/falso.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un índice es una estructura separada que permite encontrar filas sin barrer toda la tabla, al precio de una escritura más lenta y un espacio en disco adicional en cada inserción, modificación o eliminación. |
| **Herramientas utilizables** | `CREATE INDEX nombre_indice ON tabla (columna)` para acelerar las lecturas filtradas o unidas sobre esa columna. |
| **Trampas a evitar** | Tabla de hechos sin índice sobre sus claves foráneas (cada `JOIN` barre todo); índice puesto en una columna con muy pocos valores distintos o "por si acaso" sin uso real. |
| **Buenas prácticas** | Indexar sistemáticamente las claves foráneas de una tabla de hechos; reservar los índices a las columnas realmente filtradas, unidas u ordenadas, con suficientes valores distintos para que el índice reduzca de verdad la búsqueda. |
