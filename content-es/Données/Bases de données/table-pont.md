---
order: 3
---

# La tabla puente

En el [modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile), cada fila de la tabla de hechos apunta a una sola fila de cada dimensión: una venta tiene un solo producto, un solo cliente, una sola fecha. Pero ciertas relaciones no son tan simples: una misma venta puede haberse beneficiado de varias promociones a la vez. Una columna `id_promocion` única en `hecho_ventas` solo puede contener un valor, así que este caso no encaja en el modelo tal cual.

## El problema: una relación "muchos a muchos"

Una venta puede acumular varias promociones, y una misma promoción se aplica a varias ventas diferentes: es una relación **muchos-a-muchos** (*many-to-many*), en las antípodas de la relación uno-a-muchos habitual entre una dimensión y la tabla de hechos (un producto puede aparecer en varias ventas, pero cada venta solo tiene un producto).

```text
Relacion habitual (uno-a-muchos):
dim_producto  1 ---- N  hecho_ventas    (un producto, varias ventas; una venta, un solo producto)

Relacion a resolver (muchos-a-muchos):
hecho_ventas  N ---- N  dim_promocion   (una venta, varias promociones; una promocion, varias ventas)
```

## La tabla puente: una fila por asociación

La **tabla puente** (*bridge table*) resuelve este caso insertando una tabla intermedia entre la tabla de hechos y la dimensión concernida. Cada fila de la tabla puente asocia un identificador de hecho a un identificador de dimensión; una venta que tiene dos promociones da simplemente dos filas en la tabla puente, una por promoción.

```sql
CREATE TABLE hecho_ventas (
    id_venta     INT PRIMARY KEY,
    id_producto  INT,
    importe      DECIMAL(10, 2)
);

CREATE TABLE dim_promocion (
    id_promocion  INT PRIMARY KEY,
    etiqueta      VARCHAR(100),
    porcentaje    DECIMAL(4, 2)
);

CREATE TABLE puente_ventas_promociones (
    id_venta      INT,   -- clave foranea → hecho_ventas
    id_promocion  INT    -- clave foranea → dim_promocion
);
```

```text
Venta 1 (importe 100€) se beneficio de las promociones 10 y 20:

puente_ventas_promociones
id_venta | id_promocion
---------|-------------
1        | 10
1        | 20
```

## La trampa clásica: el doble conteo

Hacer un `JOIN` ingenuo entre `hecho_ventas` y `puente_ventas_promociones` produce una fila por asociación, no una fila por venta. Una venta de 100€ que tiene dos promociones aparece dos veces en el resultado: sumarla directamente duplica el importe.

```sql
-- trampa: esta consulta cuenta la venta 1 dos veces (una por promocion), por tanto 200€ en lugar de 100€
SELECT SUM(f.importe)
FROM hecho_ventas f
JOIN puente_ventas_promociones p ON p.id_venta = f.id_venta;
```

> **Trampa:** sumar directamente una columna de la tabla de hechos tras un `JOIN` sobre una tabla puente. El número de filas explota (una por asociación), y toda suma o media calculada sobre ella queda falseada por esta duplicación.
>
> **Buena práctica:** o bien contar las ventas distintas (`SUM(DISTINCT ...)` o una subconsulta que agregue primero), o bien repartir el importe entre las promociones vía una columna de ponderación explícita en la tabla puente (por ejemplo `peso` a 0.5 para cada una de las dos promociones, para que la suma de los pesos siga siendo igual a 1 por venta).

```sql
CREATE TABLE puente_ventas_promociones (
    id_venta      INT,
    id_promocion  INT,
    peso          DECIMAL(4, 2)   -- parte del importe atribuida a esta promocion (suma = 1 por venta)
);

-- con la ponderacion, la suma vuelve a ser correcta: 100€ repartidos en 50€ + 50€, no 100€ + 100€
SELECT SUM(f.importe * p.peso)
FROM hecho_ventas f
JOIN puente_ventas_promociones p ON p.id_venta = f.id_venta;
```

## Visión de conjunto

| | Dimensión clásica | Tabla puente |
|---|---|---|
| Relación con la tabla de hechos | Uno-a-muchos | Muchos-a-muchos |
| Una fila representa | Un valor del eje de análisis | Una asociación entre un hecho y un valor de dimensión |
| Riesgo en el `JOIN` | Ninguno (una fila de hechos sigue siendo una fila) | Duplicación de las filas de hechos (una por asociación) |
| Agregación | `SUM`/`AVG` directo sin riesgo | Requiere una ponderación o un conteo distinto |

## Reconocer la necesidad de una tabla puente

> **Trampa:** añadir una segunda columna de clave foránea (`id_promocion_1`, `id_promocion_2`) en la tabla de hechos para gestionar "hasta dos promociones". Este límite arbitrario se rompe en cuanto una venta tiene tres, y cada columna añadida complica todas las consultas que ahora deben verificar varias columnas en lugar de una.
>
> **Buena práctica:** en cuanto una dimensión pueda tener varios valores válidos para un mismo hecho (promociones, etiquetas, categorías múltiples), pasar por una tabla puente en lugar de por columnas repetidas. El número de asociaciones posibles por hecho se vuelve entonces ilimitado, sin cambiar el esquema.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La tabla puente resuelve una relación muchos-a-muchos entre la tabla de hechos y una dimensión, almacenando una fila por asociación en lugar de una clave foránea directa. |
| **Herramientas utilizables** | `JOIN` hacia la tabla puente; columna de ponderación (`peso`) para repartir una medida entre varias asociaciones sin duplicarla. |
| **Trampas a evitar** | Sumar una medida de la tabla de hechos tras un `JOIN` sobre una tabla puente sin ponderación (doble conteo); multiplicar las columnas de clave foránea para simular una relación muchos-a-muchos. |
| **Buenas prácticas** | Usar una tabla puente en cuanto un hecho pueda tener varios valores para una misma dimensión; incluir en ella una columna de ponderación cuando una medida deba repartirse entre las asociaciones. |
