---
order: 1
---

# El modelo en estrella

El capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql) trata cada tabla como una hoja de cálculo aislada. En cuanto se quiere analizar un histórico completo (años de ventas, por ejemplo), se organizan deliberadamente varias tablas unas alrededor de otras según un esquema preciso: el **modelo en estrella** (*star schema*), el más extendido en un almacén de datos.

## OLTP contra OLAP: dos usos, dos organizaciones

Una base de aplicación clásica (la que registra un pedido cuando un cliente hace clic en "Comprar") está optimizada para escrituras rápidas y frecuentes, una fila a la vez: es el **OLTP** (*Online Transaction Processing*). Un almacén de datos está optimizado para lo contrario: pocas escrituras, pero lecturas que recorren millones de filas a la vez ("el total de ventas por región en los últimos tres años"): es el **OLAP** (*Online Analytical Processing*). El modelo en estrella es una organización pensada para el OLAP.

| | OLTP (aplicación) | OLAP (almacén de datos) |
|---|---|---|
| Operación típica | Insertar un pedido | Agregar tres años de ventas |
| Volumen por consulta | Un puñado de filas | Millones de filas |
| Prioridad | Escritura rápida, sin duplicados | Lectura rápida, aunque haya que duplicar |

## La tabla de hechos: lo que se mide

La **tabla de hechos** (*fact table*) contiene los eventos medibles: una fila por venta, por ejemplo, con columnas numéricas (importe, cantidad) y claves foráneas hacia cada eje de análisis.

```sql
CREATE TABLE hecho_ventas (
    id_producto  INT,   -- clave foranea → dim_producto
    id_cliente   INT,   -- clave foranea → dim_cliente
    id_fecha     INT,   -- clave foranea → dim_fecha
    importe      DECIMAL(10, 2),
    cantidad     INT
);
```

## La tabla de dimensión: según qué ángulo se mira

Una **tabla de dimensión** (*dimension table*) describe uno de los ejes según el cual se quiere mirar los hechos: el producto vendido, el cliente, la fecha. Lleva las columnas descriptivas (nombre, categoría, ciudad...) que se usan para filtrar o agrupar.

```sql
CREATE TABLE dim_producto (
    id_producto  INT PRIMARY KEY,
    nombre       VARCHAR(100),
    categoria    VARCHAR(50)
);
```

## Por qué "en estrella": el esquema

Una tabla de hechos en el centro, una tabla de dimensión en cada rama: visto en plano, la forma recuerda a una estrella.

```text
                dim_fecha
                    |
dim_cliente ---- hecho_ventas ---- dim_producto
                    |
               dim_tienda
```

Una consulta de análisis ("el total de ventas por categoría de producto, en 2025") solo hace ya un `JOIN` (ver [SQL](/?c=domain-specific-languages-dsl&p=sql)) entre la tabla de hechos y cada dimensión concernida, nunca una larga cadena de uniones a través de decenas de tablas:

```sql
SELECT p.categoria, SUM(f.importe) AS total
FROM hecho_ventas f
JOIN dim_producto p ON p.id_producto = f.id_producto
JOIN dim_fecha d ON d.id_fecha = f.id_fecha
WHERE d.anio = 2025
GROUP BY p.categoria;
```

## El compromiso: desnormalización deliberada

Una base OLTP evita repetir una misma información en varias filas (la **normalización**): cada hecho se escribe una sola vez, para evitar incoherencias si hay que corregirlo. Una dimensión hace la elección contraria: **desnormaliza** deliberadamente, repitiendo por ejemplo la categoría del producto en cada fila de `dim_producto` en lugar de almacenarla en una tabla `dim_categoria` separada.

| | Normalizado (OLTP) | Desnormalizado (dimensión) |
|---|---|---|
| Duplicación | Mínima | Aceptada |
| Escritura | Rápida, sin incoherencia posible | Más lenta de corregir (varias filas que actualizar) |
| Lectura | Requiere varios `JOIN` | Un solo `JOIN` basta |

> **Trampa:** juzgar la dimensión desnormalizada como "mal diseñada" con reflejos OLTP (búsqueda de duplicación). La duplicación ahí es una elección asumida: el almacén de datos se reescribe por lotes (una vez por noche, por ejemplo), no fila por fila como una aplicación, la incoherencia que evita la normalización no tiene por tanto el mismo coste.
>
> **Buena práctica:** juzgar una tabla según el uso al que sirve (escritura unitaria frecuente vs lectura masiva), no según una regla universal de diseño.

## Clave sustituta en lugar de clave natural

Una **clave natural** es un identificador que ya existe en el mundo real (una referencia de producto, un número de seguridad social). Una **clave sustituta** (*surrogate key*) es un entero generado únicamente para servir de clave, sin ningún sentido fuera de la base de datos (el `id_producto` de los ejemplos de arriba).

> **Trampa:** usar una clave natural como clave de dimensión. Si el sistema fuente cambia algún día esa referencia (renumeración de un catálogo de productos, fusión de dos identificadores de clientes), todas las filas de hechos que apuntan a ella se quedan huérfanas.
>
> **Buena práctica:** generar una clave sustituta propia del almacén para cada dimensión, y conservar la clave natural solo como columna descriptiva entre otras. Sigue siendo estable incluso si el sistema fuente cambia sus propios identificadores.

## Variante a conocer: el modelo en copo de nieve

El **modelo en copo de nieve** (*snowflake schema*) empuja la normalización un paso más lejos dentro mismo de las dimensiones: `dim_producto` remite a una tabla `dim_categoria` separada en lugar de repetir la categoría en cada fila.

| | Estrella | Copo de nieve |
|---|---|---|
| Dimensiones | Desnormalizadas (una sola tabla por eje) | Normalizadas (dimensión repartida en subtablas) |
| Espacio en disco | Más duplicación | Menos duplicación |
| Consulta | Un solo `JOIN` por dimensión | Un `JOIN` más por subdimensión |

> **Buena práctica:** partir del modelo en estrella por defecto (más simple de consultar); pasar a copo de nieve solo si el espacio en disco o el mantenimiento de una dimensión muy grande lo justifica concretamente, no por principio de normalización.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El modelo en estrella organiza un almacén de datos alrededor de una tabla de hechos (las medidas) vinculada a tablas de dimensión (los ejes de análisis), en las antípodas de una base OLTP normalizada. |
| **Herramientas utilizables** | `JOIN` y `GROUP BY` en SQL para consultar una tabla de hechos según una o varias dimensiones. |
| **Trampas a evitar** | Juzgar una dimensión desnormalizada con reflejos de base OLTP; usar una clave natural (susceptible de cambiar) como clave de dimensión. |
| **Buenas prácticas** | Generar una clave sustituta propia del almacén para cada dimensión; mantener el modelo en estrella por defecto, pasar a copo de nieve solo si una necesidad concreta lo justifica. |
