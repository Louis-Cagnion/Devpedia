---
order: 2
---

# SQL

SQL (*Structured Query Language*) es un lenguaje con un único propósito: consultar y manipular datos almacenados en forma de tablas. Al igual que [la regex](/?c=domain-specific-languages-dsl&p=regex), no es un lenguaje de programación generalista: no tiene bucles, ni funciones definidas por el usuario, ni variables en el sentido clásico. Lo interpreta un motor de base de datos ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/es-es/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), normalmente controlado desde un lenguaje anfitrión ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), [JS](/?c=langages&s=javascript&p=javascript)...) a través de un conector.

## DDL y DML: dos familias de comandos

Los comandos SQL se dividen en dos familias, según si afectan a la estructura de las tablas o a los datos que contienen:

| Familia | Nombre completo | Papel | Comandos |
|---|---|---|---|
| DDL | *Data Definition Language* | Crear/modificar/eliminar la estructura de una tabla | `CREATE`, `ALTER`, `DROP` |
| DML | *Data Manipulation Language* | Leer/añadir/modificar/eliminar datos | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

Los ejemplos `SELECT` de abajo son, por tanto, DML: leen datos de una tabla ya creada. El DDL (crear esa tabla) se aborda más adelante.

## Una tabla, como una hoja de cálculo

Una tabla relacional se parece a una hoja de cálculo: columnas fijas, nombradas de antemano (`id`, `nombre`, `ciudad`...), y cada fila representa un registro completo que rellena todas esas columnas.

```sql
SELECT id, nombre FROM clientes WHERE ciudad = 'Lyon';
```

«Columnas `id`/`nombre`, de la tabla `clientes`, solo las filas donde `ciudad = 'Lyon'`». `SELECT *` selecciona todas las columnas.

## Líneas y columnas: las dos direcciones de una tabla

Cuando se empieza, a menudo se mezclan estas dos palabras. Una **columna** es vertical: es un tipo de información, el mismo para todos los registros (el título, el precio). Una **fila** es horizontal: es un registro completo (un libro, con su título, su precio y su fecha). Los ejemplos que siguen leen una tabla `libros` de siete filas y cinco columnas:

| id | titulo | genero | precio | publicado_el |
|---|---|---|---|---|
| 1 | Las noches de bruma | novela | 12.50 | 2024-03-15 |
| 2 | Cocina en familia | cocina | 24.00 | 2023-11-02 |
| 3 | Atlas de los mares | ciencia | 39.90 | 2022-06-30 |
| 4 | El último faro | novela | 9.90 | 2025-01-20 |
| 5 | Pastas y salsas | cocina | 18.00 | 2024-09-05 |
| 6 | Viaje al centro | novela | 15.00 | 2021-05-12 |
| 7 | Estrellas cercanas | ciencia | 22.00 | 2025-04-01 |

```
              columnas (verticales): se eligen después de SELECT
              id    titulo               genero    precio
                 \     |                     |      /
   fila 1   ->   1     Las noches de bruma  novela  12.50
   fila 2   ->   2     Cocina en familia    cocina  24.00
   fila 3   ->   3     Atlas de los mares   ciencia 39.90

   filas (horizontales): se quitan con WHERE y TOP
```

Cada dirección se ajusta, por tanto, en un lugar diferente de la **consulta** (la petición escrita en SQL, detallada [más abajo](#leer-una-consulta-paso-a-paso-select-from-where)):

| Quiero... | Se ajusta en... | Ejemplo |
|---|---|---|
| Quedarme solo con algunas columnas | la lista después de `SELECT` | `SELECT titulo, precio` |
| Quedarme solo con algunas filas | `WHERE` | `WHERE genero = 'novela'` |
| Quedarme solo con las `n` primeras filas | `TOP n` (T-SQL, la variante de SQL propia de SQL Server) | `SELECT TOP 3 titulo` |
| Cambiar el orden de las filas | `ORDER BY` | `ORDER BY precio DESC` |

Confundir ambas cosas es el error más frecuente: `WHERE` nunca hace desaparecer una columna, y la lista después de `SELECT` nunca hace desaparecer una fila.

### `SELECT *`: todas las columnas de golpe

El asterisco `*` sustituye la lista de columnas por «todas, en el orden en que la tabla las declara». Es útil para una primera mirada a una tabla desconocida:

```sql
SELECT * FROM libros WHERE id = 2;  -- todas las columnas de la fila cuyo id vale 2
```

```
id  titulo             genero  precio  publicado_el
--  -----------------  ------  ------  ------------
2   Cocina en familia  cocina  24      2023-11-02
```

| Riesgo de `SELECT *` fuera de una prueba | Por qué |
|---|---|
| Datos inútiles transportados | El **servidor** (el programa del motor de base de datos, que guarda los datos y responde a las consultas) lee y envía columnas que no se necesitan, a veces voluminosas |
| Datos sensibles expuestos | Una columna añadida más tarde (una contraseña, un número) sale sin que nadie lo haya decidido |
| Código frágil | Un programa que lee el resultado «por posición» se rompe si se añade o se mueve una columna |
| Tabla enorme | Sin `WHERE` ni `TOP`, se trae la tabla entera |

> **Buena práctica:** `SELECT *` para explorar, y la lista explícita de columnas (`SELECT titulo, precio`) en todo lo que se guarde o se vuelva a ejecutar más adelante.

## Leer una consulta paso a paso: `SELECT`, `FROM`, `WHERE`

Una **consulta** es una petición escrita en SQL y enviada al **servidor**: el programa del motor de base de datos, que guarda los datos y responde. Se compone de **cláusulas**: cada una empieza por una palabra clave (`SELECT`, `FROM`, `WHERE`...) y responde a una pregunta.

```sql
SELECT titulo, precio     -- 1. qué columnas mostrar
FROM libros               -- 2. de qué tabla leer
WHERE genero = 'novela';  -- 3. qué filas conservar
```

| Cláusula | Pregunta a la que responde | Aquí |
|---|---|---|
| `SELECT` | ¿Qué columnas quieres ver? | `titulo` y `precio` |
| `FROM` | ¿De qué tabla lees? | `libros` |
| `WHERE` | ¿Qué filas se conservan? | las que tienen `genero` igual a `'novela'` |

```
titulo              precio
-------------------  ------
Las noches de bruma  12.5
El último faro       9.9
Viaje al centro      15
```

(Estos resultados se obtuvieron con SQLite; la forma de mostrar los decimales, `12.5` o `12.50`, varía de un motor a otro.)

### `FROM` y el nombre completo `esquema.tabla`

En un servidor real, una tabla pertenece a un **esquema** (un espacio de nombres que agrupa las tablas, explicado en [Esquemas y tablas técnicas](/?c=bases-de-donnees&p=schemas-et-tables-techniques)). El nombre completo se escribe `esquema.tabla`, y en SQL Server el esquema por defecto se llama `dbo`:

```sql
SELECT titulo FROM dbo.libros;  -- nombre completo: esquema dbo, tabla libros
```

Escribir solo `libros` funciona cuando el motor sabe en qué esquema buscar; el nombre completo evita la ambigüedad si dos esquemas tienen una tabla con el mismo nombre. Para leer otra base de datos del mismo servidor, se añade un tercer segmento, visto en [la consulta entre bases de datos](#consulta-entre-bases-de-datos-en-la-misma-instancia).

### `WHERE`: el servidor comprueba cada fila

`WHERE` contiene una **condición**: una afirmación que es verdadera o falsa para una fila dada. El servidor la comprueba fila por fila: si es verdadera, la fila se queda; si es falsa, desaparece del resultado. Las comparaciones posibles:

| Operador | Significado | Ejemplo |
|---|---|---|
| `=` | igual a (un solo signo `=`, no dos) | `genero = 'novela'` |
| `<>` | distinto de (`!=` también aceptado por la mayoría de motores) | `genero <> 'novela'` |
| `<` / `>` | estrictamente menor / mayor | `precio < 20` |
| `<=` / `>=` | menor o igual / mayor o igual | `precio >= 20` |

El texto y las fechas se escriben entre apóstrofos, y los números tal cual: la regla completa está en [Tipos de columna y valores coherentes](#tipos-de-columna-y-valores-coherentes).

### `AND` y `OR`: combinar varias condiciones

| Palabra clave | La fila se conserva si... |
|---|---|
| `AND` | las dos condiciones son verdaderas a la vez |
| `OR` | al menos una de las dos es verdadera |

Esto es lo que hace el servidor con `WHERE genero = 'novela' AND precio < 12`, fila por fila:

| id | genero | precio | `genero = 'novela'` | `precio < 12` | ¿Fila conservada? |
|---|---|---|---|---|---|
| 1 | novela | 12.50 | verdadero | falso | no |
| 2 | cocina | 24.00 | falso | falso | no |
| 3 | ciencia | 39.90 | falso | falso | no |
| 4 | novela | 9.90 | verdadero | verdadero | **sí** |
| 5 | cocina | 18.00 | falso | falso | no |
| 6 | novela | 15.00 | verdadero | falso | no |
| 7 | ciencia | 22.00 | falso | falso | no |

> **Trampa:** `AND` se aplica antes que `OR`, como la multiplicación antes que la suma. `WHERE genero = 'cocina' OR genero = 'novela' AND precio < 10` se lee «cocina, o (novela y menos de 10)»: todos los libros de cocina salen, incluido el de 24.00.
>
> **Buena práctica:** en cuanto un `OR` aparece junto a un `AND`, poner paréntesis para que la lectura no dependa de la regla de prioridad.

```sql
-- sin paréntesis: cocina (todos los precios) O (novela de menos de 10)
SELECT titulo, genero, precio FROM libros
WHERE genero = 'cocina' OR genero = 'novela' AND precio < 10;

-- con paréntesis: (cocina O novela) Y menos de 10
SELECT titulo, genero, precio FROM libros
WHERE (genero = 'cocina' OR genero = 'novela') AND precio < 10;
```

```
titulo             genero  precio      titulo            genero  precio
-----------------  ------  ------      ----------------  ------  ------
Cocina en familia  cocina  24          El último faro    novela  9.9
El último faro     novela  9.9
Pastas y salsas    cocina  18
   (sin paréntesis: 3 filas)           (con paréntesis: 1 fila)
```

## `ORDER BY`: ordenar el resultado

Una tabla **no tiene ningún orden garantizado**: el servidor devuelve las filas en el orden que le conviene (el del almacenamiento, el de un [índice](/?c=bases-de-donnees&p=les-index), el de otra vía de lectura), y ese orden puede cambiar de una ejecución a otra. `ORDER BY` fija el orden, y se coloca después de `WHERE`:

```sql
SELECT titulo, precio
FROM libros
WHERE publicado_el >= '2023-01-01'  -- primero, quitar las filas demasiado antiguas
ORDER BY precio DESC;               -- después, ordenar el resto del más caro al más barato
```

| Escritura | Efecto |
|---|---|
| `ORDER BY precio` | creciente (del más pequeño al más grande); `ASC` es el valor por defecto |
| `ORDER BY precio DESC` | decreciente (`DESC` por *descending*) |
| `ORDER BY genero, precio DESC` | primero por `genero`, y con el mismo género por `precio` decreciente |

Resultado de `ORDER BY genero, precio DESC` sobre toda la tabla:

```
titulo               genero   precio
-------------------  -------  ------
Atlas de los mares   ciencia  39.9
Estrellas cercanas   ciencia  22
Cocina en familia    cocina   24
Pastas y salsas      cocina   18
Viaje al centro      novela   15
Las noches de bruma  novela   12.5
El último faro       novela   9.9
```

`WHERE` y `ORDER BY` no hacen el mismo trabajo:

| | `WHERE` | `ORDER BY` |
|---|---|---|
| Papel | quita filas | ordena las filas |
| Número de filas después | disminuye (o se mantiene) | igual |
| Se coloca | después de `FROM` | al final de la consulta |

> **Trampa:** creer que basta con insertar las filas en el orden deseado. El resultado de una consulta sin `ORDER BY` no está garantizado, aunque algún día salga en el orden de inserción: un índice añadido más tarde o otra forma de leer la tabla basta para cambiarlo.
>
> **Buena práctica:** todo resultado cuyo orden importe lleva un `ORDER BY`, con una segunda columna si la primera puede contener duplicados (dos libros al mismo precio saldrían, si no, en un orden indefinido entre ellos).

Dos límites que conviene conocer:

- **El coste.** Ordenar una tabla grande exige trabajo al servidor; un [índice](/?c=bases-de-donnees&p=les-index) sobre la columna de orden puede entregarle las filas ya ordenadas.
- **Cuándo evitarlo.** Contar filas (`COUNT(*)`, ver [Las funciones de agregación](#las-funciones-de-agregacion)) o comprobar que existe al menos una no necesita ningún orden: ordenarlas sería trabajo perdido.

## `TOP n` (T-SQL): limitar el número de filas, y su trampa

En T-SQL, el lenguaje de [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), `TOP n` conserva las `n` primeras filas del resultado. Se escribe justo después de `SELECT`. MySQL, PostgreSQL y SQLite tienen el equivalente `LIMIT n`, escrito al final de la consulta. Detalles de `TOP`: [documentación oficial](https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql).

```sql
-- T-SQL: los 3 libros más caros
SELECT TOP 3 titulo, precio
FROM libros
ORDER BY precio DESC;  -- sin este orden, TOP 3 devolvería 3 filas cualesquiera

-- equivalente MySQL / PostgreSQL / SQLite
SELECT titulo, precio FROM libros ORDER BY precio DESC LIMIT 3;
```

```
titulo               precio
-------------------  ------
Atlas de los mares   39.9
Cocina en familia    24
Estrellas cercanas   22
```

(Salida obtenida con la forma `LIMIT 3` en SQLite.)

La trampa tiene dos puntos:

| Trampa | Lo que pasa | Remedio |
|---|---|---|
| `TOP` sin `ORDER BY` | `TOP` limita sin un orden preciso: el servidor devuelve `n` filas cualesquiera, no «las primeras» ni «las mejores» | acompañarlo siempre de `ORDER BY` |
| El mensaje «n filas afectadas» | anuncia el número de filas **devueltas**, no el de las filas que cumplen la condición | ejecutar un `COUNT(*)` con el mismo `WHERE` |

```sql
-- AS nb da el nombre nb a la columna calculada (ver las funciones de agregación)
SELECT COUNT(*) AS nb FROM libros WHERE genero = 'novela';  -- cuántas novelas en total
```

```
nb
--
3
```

Con `TOP 2` (o `LIMIT 2`) sobre estas novelas, el servidor muestra «2 filas» aunque hay 3: sin el `COUNT(*)`, tomaríamos 2 como total. Incluso con `ORDER BY`, si la columna de orden contiene duplicados en la frontera (por ejemplo, dos libros a 15.00 disputándose el segundo puesto con `TOP 2`), la fila retenida entre los dos es arbitraria: hay que añadir una segunda columna de orden.

## El punto y coma: el final de una instrucción

Una **instrucción** es un comando SQL completo. El punto y coma `;` la termina: nunca separa dos cláusulas de una misma consulta.

```sql
SELECT titulo FROM libros WHERE genero = 'novela';  -- una sola instrucción, un solo ;
SELECT COUNT(*) FROM libros;                        -- una segunda instrucción, a continuación
```

> **Trampa:** un `;` mal colocado corta la consulta en dos. `SELECT titulo FROM libros; WHERE genero = 'novela';` ejecuta primero `SELECT titulo FROM libros;` **sin filtro** (salen todos los libros), y después falla en `WHERE ...`, que no forma una instrucción.

| Escritura | Lo que hace el motor (SQLite) |
|---|---|
| `SELECT titulo FROM libros;` | muestra los títulos de todos los libros |
| ` WHERE genero = 'novela';` (sola) | error `near "WHERE": syntax error` |
| ` FROM libros;` (sola) | error `near "FROM": syntax error` (el mensaje exacto cambia según el motor) |

En SQL Server, el `;` final es opcional en la mayoría de instrucciones, pero algunas lo exigen (`MERGE`, visto [más abajo](#merge-un-upsert-en-una-sola-consulta-sql-server)): ponerlo siempre es la regla más segura.

## Tipos de columna y valores coherentes

Cada columna tiene un **tipo**: la clase de valor que acepta (mencionado más abajo en [`CREATE TABLE`](#create-table-crear-una-tabla-ddl)). Un valor escrito en una consulta debe corresponder a ese tipo, y su escritura depende de él.

### Escribir un valor: número, texto, fecha

| Clase de valor | Escritura | Ejemplo |
|---|---|---|
| Número | tal cual, con el punto para los decimales | `24`, `12.5` |
| Texto | entre apóstrofos `'...'` | `'novela'` |
| Fecha | texto entre apóstrofos, con el formato `'AAAA-MM-DD'` | `'2024-03-15'` |
| Valor ausente | la palabra `NULL`, sin apóstrofos (ver [`NULL`](#null-un-dato-ausente-no-un-valor-como-los-demas)) | `NULL` |

Un texto que contiene un apóstrofo lo duplica: `'L''Isle'` designa el texto `L'Isle`. Los apóstrofos son obligatorios: sin ellos, el motor lee `novela` como si fuera el nombre de una columna.

```sql
SELECT titulo FROM libros WHERE genero = novela;  -- olvido de los apóstrofos
```

```
Error: no such column: novela
```

> **Trampa:** comparar una columna de fechas con un número. `WHERE publicado_el = 2024` mezcla dos tipos: SQL Server se comporta según el tipo de la columna: una columna `date` rechaza con el error «Operand type clash» (tipos incompatibles), mientras que una columna `datetime` acepta `2024` como un número de días desde el 1 de enero de 1900, sin error; SQLite, más permisivo, no dice nada y devuelve cero filas, lo que es peor (ningún error que leer).
>
> **Buena práctica:** escribir cada valor con el tipo de su columna, y buscar un año con un rango de fechas (`publicado_el >= '2024-01-01' AND publicado_el < '2025-01-01'`).

### Convertir un valor: `CAST`

Cuando el valor no tiene el tipo adecuado, se **convierte** (se transforma en un valor de otro tipo). `CAST(valor AS tipo)` es la forma estándar, entendida por todos los motores; T-SQL añade `CONVERT(tipo, valor)`.

```sql
-- INT : número entero (ver « Números » más abajo)
SELECT CAST('42' AS INT) + 1 AS resultado;  -- el texto '42' pasa a ser el número 42
```

```
resultado
---------
43
```

> **Trampa:** una conversión imposible (`CAST('abc' AS INT)`) no se comporta igual en todas partes. SQLite devuelve `0` sin decir nada, lo que fabrica un dato falso; SQL Server se detiene con un error de conversión.
>
> **Buena práctica:** convertir de forma explícita, y preferir el error al silencio: un error se corrige, pero un `0` inventado acaba en los totales.

### Números: `INT`, `numeric` y `decimal`

| Tipo | Contenido | ¿Exacto? |
|---|---|---|
| `INT` | número entero (`12`, `-3`) | sí |
| `decimal(p, s)` o `numeric(p, s)` | número con decimales: `p` cifras en total, de las que `s` van tras el punto decimal | sí |
| `float` | número con decimales «aproximado» | no |

En SQL Server, `numeric` y `decimal` son dos nombres del mismo tipo. `decimal(8, 2)` acepta hasta 999999.99 y conserva siempre dos decimales (`12.5` se guarda como `12.50`).

El mismo cálculo da dos resultados según el motor. En **SQLite**, `0.1` y `0.2` se leen como `float`, y una comparación puede escribirse directamente en la lista `SELECT`:

```sql
-- SQLite
SELECT 0.1 + 0.2 AS suma, 0.1 + 0.2 = 0.3 AS igual;  -- 1 = verdadero, 0 = falso
```

```
suma                 igual
-------------------  -----
0.30000000000000004  0
```

En **SQL Server**, este mismo `SELECT` no funciona: una comparación no puede escribirse en la lista `SELECT`, y los literales `0.1` y `0.2` se leen allí como `numeric` exactos, así que `0.1 + 0.2 = 0.3` sería verdadero. Para observar el defecto del `float`, hay que declarar variables `float` ([`DECLARE @a`](#variable-de-tabla-practicar-sin-crear-nada-duradero-t-sql) crea una variable) y comprobar con `CASE WHEN condición THEN a ELSE b END` (devuelve `a` si la condición es verdadera, `b` si no):

```sql
-- SQL Server
DECLARE @a FLOAT = 0.1, @b FLOAT = 0.2;  -- dos variables de tipo float
SELECT @a + @b AS suma,
       CASE WHEN @a + @b = 0.3 THEN 1 ELSE 0 END AS igual;  -- 1 = verdadero, 0 = falso
```

```
suma   igual
-----  -----
0.3    0
```

(Salida de SQL Server escrita a mano, no ejecutada aquí: `igual` vale `0`, pero la herramienta suele mostrar `suma` redondeada a `0.3`, aunque la diferencia exista.)

Un `float` se guarda en binario (el sistema de dos cifras, 0 y 1, que usa el ordenador; ver [Números de coma flotante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)), y `0.1` no tiene escritura exacta en binario (como un tercio no la tiene en decimal): el motor guarda un valor muy próximo. La diferencia es minúscula (del orden de 0.00000000000000005), pero basta para que la igualdad sea falsa.

> **Trampa:** guardar un precio en una columna aproximada, y después hacer una suma o una igualdad con ella.
>
> **Buena práctica:** `decimal(p, s)` para todo lo que se cuenta al céntimo (precios, rebajas), y `float` solo para medidas donde el redondeo sea aceptable.

### Texto: `varchar(n)` frente a `char(n)`

| Tipo | Longitud almacenada | Ejemplo con `'FR'` |
|---|---|---|
| `varchar(n)` | la del texto, hasta `n` caracteres | `FR` (2 caracteres) |
| `char(n)` | siempre `n`: se completa con espacios a la derecha | `FR` seguido de 3 espacios si `n` vale 5 |

`char(n)` conviene a los códigos cuya longitud nunca cambia (un código de país de 2 letras); `varchar(n)` a los nombres, títulos y direcciones. Un texto más largo que `n` se rechaza (SQL Server señala un error de truncamiento: el texto se cortaría) o se corta según el motor.

### Fechas: `date` frente a `datetime`

| Tipo | Contenido | Ejemplo |
|---|---|---|
| `date` | solo el día | `'2026-10-31'` |
| `datetime` | el día y la hora | `'2026-10-31 14:45:00'` |

Dos trampas, una por tipo:

- **El formato.** `'AAAA-MM-DD'` lo lee sin ambigüedad una columna `date`. Para un `datetime`, SQL Server puede, según el idioma de la **conexión** (la sesión abierta entre el programa que envía las consultas y el servidor; ajuste `SET DATEFORMAT`, ver la [documentación](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-dateformat-transact-sql)), leer `'2026-10-11'` como el 10 de noviembre en lugar del 11 de octubre; las formas `'AAAAMMDD'` (`'20261011'`) y `'AAAA-MM-DDThh:mm:ss'` no dependen del idioma.
- **La hora oculta.** Comparar un `datetime` con un solo día equivale a compararlo con medianoche: las filas de la tarde se pierden. Entonces se filtra por un rango, desde medianoche incluida hasta la medianoche siguiente excluida.

```sql
-- pedidos(id, fecha_pedido): id 1 a las 09:30, id 2 a las 14:45 del 31/10, id 3 del 01/11
SELECT id FROM pedidos WHERE fecha_pedido = '2026-10-31';  -- igual a medianoche en punto

SELECT id FROM pedidos
WHERE fecha_pedido >= '2026-10-31'  -- medianoche del 31 incluida
  AND fecha_pedido <  '2026-11-01'; -- medianoche del 1 de noviembre excluida
```

```
(primera consulta)  ninguna fila
(segunda consulta)  id = 1 y id = 2
```

(Prueba hecha con SQLite, que guarda las fechas en una columna de texto: el razonamiento es el mismo que para un `datetime` de SQL Server.)

### Clave primaria

Una **clave primaria** es la columna (o el grupo de columnas) que identifica cada fila de forma única: dos filas nunca tienen el mismo valor, y nunca es `NULL`. Una tabla tiene una sola. Aquí, `id`: buscar `WHERE id = 2` devuelve como máximo una fila. Se declara con `PRIMARY KEY` (ver [`CREATE TABLE`](#create-table-crear-una-tabla-ddl)).

| Sin clave primaria | Con clave primaria |
|---|---|
| Dos libros idénticos son indistinguibles | Cada fila tiene su identificador |
| Modificar «ese» libro puede modificar dos | `WHERE id = 2` solo toca uno |
| Otra tabla no puede apuntar a una fila concreta | Una [`FOREIGN KEY`](#create-table-crear-una-tabla-ddl) apunta a ella |

La lista completa de tipos de SQL Server está en su [documentación oficial](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql).

## Las funciones de agregación

Resumen varias filas en un único valor:

| Función | Papel |
|---|---|
| `COUNT(*)` | Número de filas |
| `SUM(columna)` | Suma de una columna numérica |
| `AVG(columna)` | Media de una columna numérica |
| `MAX(columna)` / `MIN(columna)` | Valor máximo / mínimo |

```sql
SELECT COUNT(*) AS nb_clientes FROM clientes WHERE ciudad = 'Lyon';
```

`AS nombre` da un alias a una columna del resultado (aquí, la columna calculada se llamará `nb_clientes`).

Combinada con `GROUP BY`, una función de agregación calcula un valor por grupo en lugar de un único valor global:

```sql
SELECT ciudad, COUNT(*) AS nb_clientes
FROM clientes
GROUP BY ciudad;  -- una fila de resultado por ciudad distinta
```

### En qué orden procesa el servidor una consulta de agregación

Una consulta se escribe en un orden (`SELECT` primero), pero el servidor la procesa en otro. Para una consulta que calcula por grupo, el orden de procesamiento es este:

```sql
SELECT genero, COUNT(*) AS nb, AVG(precio) AS precio_medio
FROM libros
WHERE publicado_el >= '2023-01-01'  -- 1. quitar los libros más antiguos
GROUP BY genero                     -- 2. formar un grupo por género
                                    -- 3. (COUNT y AVG: un cálculo dentro de cada grupo)
ORDER BY nb DESC, genero;           -- 4. ordenar el resultado (genero desempata)
```

```
tabla libros: 7 filas
      |  WHERE publicado_el >= '2023-01-01'    conserva 5 filas
      v
5 filas
      |  GROUP BY genero                       forma 3 grupos
      v
novela (2 filas)   cocina (2 filas)   ciencia (1 fila)
      |  COUNT(*), AVG(precio)                un cálculo por grupo
      v
3 filas de resultado (una por grupo)
      |  ORDER BY nb DESC                     orden al final
      v
resultado final
```

```
genero   nb  precio_medio
-------  --  ------------
cocina   2   21.0
novela   2   11.2
ciencia  1   22.0
```

| Paso | Cláusula | Qué pasa |
|---|---|---|
| 1 | `WHERE` | filtra las filas **antes** de cualquier cálculo |
| 2 | `GROUP BY` | agrupa las filas restantes en grupos (un valor de `genero` = un grupo) |
| 3 | `COUNT`, `AVG`... | se aplican **dentro de cada grupo**, no sobre toda la tabla |
| 4 | `ORDER BY` | ordena al final: el total `nb` solo existe después del cálculo, por eso se puede ordenar por su nombre |

Algunas consecuencias:

- **Un cálculo se hace sobre las filas que conserva `WHERE`**, no sobre toda la tabla. Creer lo contrario es un error frecuente: aquí `COUNT(*)` solo cuenta los 5 libros recientes, no los 7.
- **Sin `GROUP BY`, una función de cálculo sola devuelve una sola fila** (un grupo único: todas las filas conservadas). `SELECT COUNT(*) FROM libros WHERE genero = 'novela'` devuelve `3`.
- **Dentro de `COUNT(*)`, el asterisco no elige ninguna columna**: significa «cuenta las filas».
- **`GROUP BY` no ordena.** El resultado de arriba se ordena por el `ORDER BY nb DESC, genero` de la consulta (el segundo criterio desempata `cocina` y `novela`, ambos con `nb = 2`); sin `ORDER BY`, el orden de los grupos no está garantizado (pueden salir en orden alfabético por casualidad de la implementación, pero nada lo garantiza). La prueba de que `GROUP BY` no es un orden: `GROUP BY genero DESC` se rechaza en SQL Server y SQLite (error de sintaxis), porque `DESC` solo tiene sentido en `ORDER BY`.
- **Según el motor, la media puede mostrarse con más decimales** que los que tiene la columna (por ejemplo `21.000000` para precios con dos decimales).

> **Trampa:** valores mal escritos forman grupos separados. Un `GROUP BY ciudad` sobre `Lyon`, `Lyon`, `Lyonn` da dos grupos: `Lyon` (2) y `Lyonn` (1). El servidor no adivina que se trata de la misma ciudad.
>
> **Buena práctica:** mirar los valores distintos de una columna (`SELECT DISTINCT ciudad FROM clientes`: `DISTINCT` quita los duplicados) antes de agrupar por ella, y normalizar la escritura al introducirla.

### `GROUPING SETS`: total y detalle en una sola consulta (T-SQL)

Obtener a la vez el total global y el detalle por ciudad normalmente requeriría dos consultas separadas (una con `GROUP BY`, otra sin él), o una [`UNION`](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/set-operators-union-transact-sql) (que apila las filas de dos consultas) de ambas. `GROUPING SETS` (SQL Server, entre otros) calcula ambos en el mismo recorrido sobre la tabla:

```sql
SELECT ciudad, COUNT(*) AS nb_clientes
FROM clientes
GROUP BY GROUPING SETS ((ciudad), ());
-- (ciudad) : una fila por ciudad distinta, como un GROUP BY clasico
-- ()       : una fila de total global, ciudad mostrada como NULL
```

| Conjunto pedido | Resultado |
|---|---|
| `(ciudad)` | Una fila por ciudad distinta, igual que `GROUP BY ciudad` solo |
| `()` (conjunto vacío) | Una única fila: el total sobre toda la tabla, `ciudad` vale `NULL` |

> **Trampa:** en la fila de total, `ciudad` vale `NULL`, pero este `NULL` significa «esto es un total agregado», no «valor desconocido» como el `NULL` visto más abajo ([`NULL`: un dato ausente](#null-un-dato-ausente-no-un-valor-como-los-demas)). Filtrar ingenuamente `WHERE ciudad IS NOT NULL` eliminaría la fila de total por error.
>
> **Buena práctica:** usar `GROUPING(ciudad)` para distinguir ambos casos sin ambigüedad: vale `1` en la fila de total (la columna es `NULL` porque está agregada), `0` en caso contrario (incluso si el valor real de `ciudad` era en sí mismo `NULL`).

```sql
SELECT
    ciudad,
    COUNT(*) AS nb_clientes,
    GROUPING(ciudad) AS es_total  -- 1 = fila de total, 0 = fila de detalle
FROM clientes
GROUP BY GROUPING SETS ((ciudad), ());
```

Emparentada con `ROLLUP` (jerarquía de totales anidados, ej. día → mes → año) y `CUBE` (todos los cruces posibles entre varias columnas), `GROUPING SETS` es la forma más explícita de las tres: cada combinación de columnas deseada se escribe a mano entre paréntesis.

## `JOIN`: combinar dos tablas por una columna común

Equivalente declarativo de emparejar dos colecciones mediante una clave compartida, en lugar de escribir un bucle con una búsqueda manual:

```sql
SELECT c.nombre, v.fecha_compra
FROM clientes c
-- INNER JOIN: las filas sin correspondencia desaparecen
JOIN ventas v ON v.cliente_id = c.id;
```

```sql
SELECT c.nombre, v.fecha_compra
FROM clientes c
-- conserva TODAS las filas de la izquierda, NULL si no hay correspondencia
LEFT JOIN ventas v ON v.cliente_id = c.id;
```

- `c`/`v` son alias de tabla, imprescindibles en cuanto dos tablas comparten el nombre de una columna (`c.nombre` frente a un posible `v.nombre`, sin ambigüedad).
- `JOIN` (o `INNER JOIN`): solo conserva las filas que coinciden en ambos lados.
- `LEFT JOIN`: conserva todas las filas de la tabla de la izquierda, columnas de la derecha a `NULL` si no hay correspondencia: útil cuando se quiere listar *a todo el mundo*, haya correspondencia o no (ej: todos los clientes, hayan comprado ya o no).

> **Trampa:** usar `JOIN` (INNER) cuando en realidad se quiere *a todo el mundo*: un cliente sin ninguna venta desaparecería silenciosamente del resultado, mientras que un `LEFT JOIN` lo habría conservado con columnas a `NULL`.
>
> **Buena práctica:** preguntarse explícitamente, antes de escribir la unión, si las filas sin correspondencia deben desaparecer (`JOIN`) o seguir siendo visibles (`LEFT JOIN`): ambas producen un resultado sintácticamente válido, pero semánticamente diferente.

### `OUTER APPLY` / `CROSS APPLY`: una unión que puede llamar a una función por fila (T-SQL)

La condición `ON` de un `JOIN` clásico solo puede referenciar columnas, nunca llamar a una función o a una subconsulta parametrizada por la fila actual. `APPLY` (SQL Server) elimina esta limitación: ejecuta una subconsulta **para cada fila** de la tabla de la izquierda, pasándole las columnas de esa fila como parámetro.

```sql
SELECT c.nombre, ultima.fecha_compra
FROM clientes c
OUTER APPLY (
    SELECT TOP 1 v.fecha_compra
    FROM ventas v
    -- referencia c, la fila actual: imposible en un ON de JOIN
    WHERE v.cliente_id = c.id
    ORDER BY v.fecha_compra DESC
) AS ultima;
```

| Variante | Comportamiento si la subconsulta no devuelve nada |
|---|---|
| `CROSS APPLY` | La fila de `clientes` desaparece del resultado (equivalente a `INNER JOIN`) |
| `OUTER APPLY` | La fila de `clientes` se conserva, columnas de la subconsulta a `NULL` (equivalente a `LEFT JOIN`) |

> **Nota:** esta misma necesidad (referenciar la fila actual desde una subconsulta unida) se llama `LATERAL JOIN` en PostgreSQL -- concepto equivalente, sintaxis diferente según el motor.

## Consulta entre bases de datos en la misma instancia

Una conexión abierta sobre una base de datos puede leer directamente una tabla de otra base de datos, siempre que ambas estén en el mismo servidor/instancia y el login tenga permisos sobre ambas: basta con anteponer al nombre de la tabla la base de datos y el esquema, con la notación de tres segmentos `Base.esquema.tabla`.

```sql
-- conectado a base_oro, igualmente lee base_plata sin linked server ni conexión separada
SELECT *
FROM base_plata.dbo.scores_historico;
```

> **Trampa:** confundir este caso (misma instancia, solo otra base de datos) con un acceso a un servidor remoto, que sí requiere un `linked server` o una conexión separada: la notación de tres segmentos solo funciona en la misma instancia.

## `CREATE TABLE`: crear una tabla (DDL)

```sql
CREATE TABLE clientes (
    id      INT IDENTITY PRIMARY KEY,  -- identificador único, generado automáticamente
    nombre  VARCHAR(100) NOT NULL,     -- texto obligatorio, nunca vacío
    ciudad  VARCHAR(100) NULL          -- texto opcional, puede quedar vacío
);

CREATE TABLE ventas (
    id           INT IDENTITY PRIMARY KEY,
    cliente_id   INT NOT NULL,
    fecha_compra DATE NOT NULL,
    -- toda venta debe apuntar a un cliente existente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
```

- Cada columna tiene un tipo (`INT`, `VARCHAR(100)` para texto de hasta 100 caracteres, `DATE`...) que restringe lo que puede contener.
- `NOT NULL` / `NULL`: obliga (o no) a que la columna tenga siempre un valor, con independencia de su tipo.
- `PRIMARY KEY`: identifica cada fila de forma única; `IDENTITY` la genera automáticamente (1, 2, 3...), sin necesidad de indicarla.
- `FOREIGN KEY`: obliga a que `cliente_id` coincida siempre con un `id` existente en `clientes`, impidiendo una venta huérfana.

> **Nota:** renombrar la tabla `clientes` (ej: `sp_rename` en [SQL Server](https://learn.microsoft.com/es-es/sql/sql-server/)) no rompe la restricción `FOREIGN KEY`: está vinculada internamente al objeto, no a su nombre.

## Índice: acelerar una búsqueda o una unión

Un índice es una estructura auxiliar (como el índice de un libro) que permite al motor encontrar filas sin recorrer toda la tabla.

```sql
CREATE INDEX idx_clientes_ciudad ON clientes(ciudad);
```

> **Trampa:** una clave compuesta por columnas demasiado anchas puede superar el límite de tamaño de un índice (900 bytes en [SQL Server](https://learn.microsoft.com/es-es/sql/sql-server/)).
>
> **Buena práctica:** preferir una clave técnica autogenerada (`IDENTITY`, llamada clave sustituta) a una clave "natural" (ej: nombre + dirección combinados) demasiado ancha para indexarse eficazmente.

## `ALTER TABLE`: qué se puede modificar después

| Operación | Posible con `ALTER TABLE` (SQL Server) |
|---|---|
| Añadir una columna | Sí, trivial |
| Eliminar una columna | Sí |
| Cambiar el tipo de una columna | Sí, bajo condiciones (ej: dato ya presente compatible) |
| Reordenar físicamente las columnas | No: hay que recrear la tabla y copiar los datos |

> **Trampa:** querer reordenar columnas existentes creyendo que un simple `ALTER TABLE` basta, como para añadir una columna.

## Variable de tabla: practicar sin crear nada duradero (T-SQL)

Una **variable** es un nombre que designa un valor guardado en memoria; en T-SQL, su nombre empieza por `@` y `DECLARE` la declara. Una **variable de tabla** es una variable que contiene una tabla pequeña entera: se declara con sus columnas, se llena con `INSERT` y se lee con `SELECT`, como una tabla de verdad.

```sql
DECLARE @catalogo TABLE (           -- declara la variable de tabla @catalogo
    id     INT PRIMARY KEY,         -- misma sintaxis de columnas que CREATE TABLE
    titulo VARCHAR(100),
    precio DECIMAL(8, 2)
);

INSERT INTO @catalogo (id, titulo, precio)  -- llena la variable, fila por fila
VALUES (1, 'Las noches de bruma', 12.50),
       (2, 'Atlas de los mares', 39.90),
       (3, 'El último faro', 9.90);

SELECT titulo, precio
FROM @catalogo                      -- el @ sigue siendo obligatorio en FROM
WHERE precio < 20
ORDER BY precio;
```

```
titulo               precio
-------------------  ------
El último faro         9.90
Las noches de bruma   12.50
```

(Salida esperada en SQL Server, escrita a mano: este script es T-SQL, SQLite no lo ejecuta. `decimal(8, 2)` conserva dos decimales, de ahí `9.90`.)

Esta variable solo existe durante una ejecución: al terminar (el **lote**: el conjunto de instrucciones enviadas de golpe al servidor), desaparece con sus filas. No crea **nada duradero** en la base (ninguna tabla, nada que limpiar después). Comparada con otras formas de guardar filas (una **tabla temporal** es una tabla de verdad pero efímera, cuyo nombre empieza por `#` y que el servidor elimina solo al terminar la **conexión**, ver la [documentación](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql#temporary-tables); la **conexión** se define [más arriba](#fechas-date-frente-a-datetime)):

| | `CREATE TABLE clientes` | tabla temporal `#t` | variable de tabla `@t` |
|---|---|---|---|
| Se declara con | `CREATE TABLE` | `CREATE TABLE #t (...)` | `DECLARE @t TABLE (...)` |
| Duración | permanente, hasta `DROP TABLE` | mientras viva la conexión (o hasta `DROP`) | la ejecución en curso |
| Visible para | todas las cuentas autorizadas | la conexión que la creó | la ejecución que la declaró |
| Deja rastro en la base | sí | no | no |
| Uso típico | datos de la aplicación | resultados intermedios, volúmenes medios | pequeñas pruebas, pocas filas |

Es un buen terreno para practicar: se puede entrenar `SELECT`, `WHERE` y `ORDER BY` con datos inventados, sin permiso para escribir en las tablas de la base.

> **Trampa:** seleccionar y ejecutar solo la última parte del script (el `SELECT ... FROM @catalogo`): la variable se declaró en una ejecución anterior, así que ya no existe y el motor responde que `@catalogo` no está declarada. Escribir `FROM catalogo` sin `@` también falla (el motor busca una tabla de ese nombre).
>
> **Buena práctica:** ejecutar el script completo (declaración, `INSERT`, lectura) en cada prueba; para conservar datos de una ejecución a otra, pasar a una tabla temporal `#t` o a un [`CREATE TABLE`](#create-table-crear-una-tabla-ddl); para un volumen grande de filas, no usar una variable de tabla, pensada para volúmenes pequeños.

Detalles de la sintaxis: [documentación oficial](https://learn.microsoft.com/en-us/sql/t-sql/data-types/table-transact-sql).

## `NULL`: un dato ausente, no un valor como los demás

`NULL` significa "no se sabe" o "no se ha indicado nada"; **no** es lo mismo que un valor centinela como `-1` o una cadena vacía, que significa "se sabe que estructuralmente no hay ninguno".

```sql
SELECT AVG(descuento) FROM ventas;
-- AVG/SUM/COUNT(columna) ignoran las filas a NULL: un descuento a NULL no cuenta como 0
```

> **Trampa:** guardar `-1` en lugar de `NULL` para "sin descuento" falsea `AVG(descuento)`, que entonces contaría `-1` como un valor numérico real en vez de ignorarlo.
>
> **Buena práctica:** reservar `NULL` para "valor desconocido/no indicado"; usar un valor centinela solo si su significado de negocio está documentado, y no mezclar nunca ambos en la misma columna.

### Comparar con `NULL`: `IS NULL`, la trampa de `<>` y `COUNT`

Una condición como `ciudad = 'Lyon'` da «verdadero» o «falso» para una fila. Con `NULL` (valor desconocido), la respuesta es un tercer estado: **desconocido**, ni verdadero ni falso. Ahora bien, `WHERE` solo conserva las filas cuya condición vale **verdadero**: una condición desconocida hace desaparecer la fila, igual que una condición falsa.

Tabla `clientes` usada a continuación (David no tiene ciudad registrada):

| id | nombre | ciudad |
|---|---|---|
| 1 | Alice | Lyon |
| 2 | Bruno | Paris |
| 3 | Chloé | Lyon |
| 4 | David | `NULL` |
| 5 | Emma | Paris |
| 6 | Farid | Marseille |

| Condición | Alice (`Lyon`) | David (`NULL`) | Filas conservadas |
|---|---|---|---|
| `ciudad = 'Lyon'` | verdadero | desconocido | Alice, Chloé |
| `ciudad <> 'Lyon'` | falso | desconocido | Bruno, Emma, Farid |
| `NOT (ciudad = 'Lyon')` | falso | desconocido | Bruno, Emma, Farid |
| `ciudad = NULL` | desconocido | desconocido | ninguna |
| `ciudad IS NULL` | falso | verdadero | David |
| `ciudad IS NOT NULL` | verdadero | falso | todos menos David |

Dos consecuencias. En primer lugar, `= NULL` nunca devuelve nada (incluso `NULL = NULL` es desconocido, con el ajuste por defecto de SQL Server, `ANSI_NULLS ON`): hace falta `IS NULL` o `IS NOT NULL`.

```sql
SELECT nombre FROM clientes WHERE ciudad = NULL;     -- nunca ninguna fila, sin error
SELECT nombre FROM clientes WHERE ciudad IS NULL;    -- David
```

```
(primera consulta)  ninguna fila
(segunda consulta)  David
```

En segundo lugar, **`<>` también descarta las filas sin valor**: «los clientes que no viven en Lyon» debería incluir a David, que seguramente no vive allí, pero su ciudad es desconocida. La corrección añade explícitamente las filas con `NULL`:

```sql
SELECT nombre FROM clientes
WHERE ciudad <> 'Lyon'      -- las ciudades conocidas y distintas de Lyon
   OR ciudad IS NULL;       -- más los clientes sin ciudad
```

```
nombre
------
Bruno
David
Emma
Farid
```

> **Trampa:** escribir `WHERE ciudad <> 'Lyon'` creyendo obtener «todos los demás»: las filas con `NULL` desaparecen sin aviso. Lo mismo ocurre con `NOT (ciudad = 'Lyon')`.
>
> **Buena práctica:** para toda condición de negación sobre una columna que puede valer `NULL`, preguntarse qué se quiere de las filas sin valor, y luego escribirlo (`OR columna IS NULL`).

#### `COUNT(*)` frente a `COUNT(columna)`

| Escritura | Lo que cuenta |
|---|---|
| `COUNT(*)` | las **filas**, sean cuales sean sus valores |
| `COUNT(columna)` | las filas donde esa columna tiene un **valor** (no `NULL`) |

```sql
SELECT COUNT(*) AS nb_filas, COUNT(ciudad) AS nb_ciudades FROM clientes;
```

```
nb_filas  nb_ciudades
--------  ------------
6         5
```

La misma lógica vale para las demás funciones: solo operan sobre los valores conocidos. En una tabla `peliculas(id, titulo, anio, nota)`, siendo `nota` una columna numérica (ver [Números](#numeros-int-numeric-y-decimal)), donde dos películas aún no tienen nota (`NULL`) y tres tienen `8`, `6` y `10`:

```sql
SELECT COUNT(*) AS nb_filas, COUNT(nota) AS nb_notas,
       SUM(nota) AS total, AVG(nota) AS media
FROM peliculas;
```

```
nb_filas  nb_notas  total  media
--------  --------  -----  -----
5         3         24     8.0
```

(Salida obtenida con SQLite. En SQL Server, si `nota` es un `decimal`, las sumas y las medias se muestran con decimales, `24.0` por ejemplo, y su número varía según el motor. Si `nota` es un `INT`, `AVG` devuelve un **entero**: `8` aquí, pero `4` y no `4.8` para la media con ceros más abajo. Para conservar los decimales, escribir `AVG(CAST(nota AS decimal(4, 1)))`.)

La media vale `24 / 3 = 8` (tres notas conocidas), y no `24 / 5 = 4.8`. Las películas sin nota no tiran de la media hacia abajo: se ignoran, que es el comportamiento correcto mientras `NULL` signifique «todavía sin valorar». Si antes se sustituye `NULL` por `0` ([`ISNULL`/`COALESCE`](#isnull-rellenar-una-columna-solo-si-todavia-esta-vacia)), la media baja a `4.8` (en `decimal` o en SQLite): un `0` es una nota real, no una ausencia.

### `ISNULL()`: rellenar una columna solo si todavía está vacía

`SET columna = valor` siempre sobrescribe la columna, aunque ya contuviera un dato válido. `ISNULL(columna, valor)` (equivalente estándar SQL: `COALESCE(columna, valor)`) solo devuelve `valor` si `columna` está actualmente a `NULL`, y la columna misma en caso contrario: un rescate de datos que nunca toca una fila ya correctamente rellenada.

```sql
-- solo modifica siret en las filas donde sigue a NULL; sin riesgo al reejecutar
UPDATE clientes SET siret = ISNULL(siret, '12345678900010') WHERE id = 1;
```

> **Buena práctica:** este patrón es idempotente (reejecutable sin riesgo cuantas veces se quiera): útil para un script de rescate que se puede relanzar tras una carga parcial de datos, sin sobrescribir nunca un valor ya presente.

## Controlar SQL desde PHP con PDO

PDO (*[PHP](/?c=langages&s=php&p=php) Data Objects*) es la interfaz nativa de [PHP](/?c=langages&s=php&p=php) para dialogar con una base de datos, sea cual sea su motor.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=tienda', 'usuario', 'contraseña');

$stmt = $pdo->prepare('SELECT * FROM clientes WHERE ciudad = :ciudad');
$stmt->execute([':ciudad' => 'Lyon']);

$fila   = $stmt->fetch(\PDO::FETCH_ASSOC);     // una sola fila, array asociativo
$todas  = $stmt->fetchAll(\PDO::FETCH_ASSOC);  // todas las filas
?>
```

El ciclo es siempre el mismo: `prepare()` (escribir la consulta, con marcadores de posición como `:ciudad`) → `execute()` (proporcionar los valores reales) → `fetch()`/`fetchAll()` (recuperar el resultado).

> **Nota:** `$pdo->query($sql)` es un atajo **sin** marcador de posición, utilizable solo si `$sql` es una cadena 100 % escrita a mano, sin ninguna variable externa concatenada dentro. En cuanto un solo valor externo (usuario, URL, sesión...) entra en la consulta, hay que pasar por `prepare()`/`execute()`.

## `IN (...)` con una lista de tamaño variable en PDO

PDO solo permite parametrizar valores individuales, nunca un array entero en un único marcador de posición: `IN (:ciudades)` con `execute([':ciudades' => ['Lyon', 'Paris']])` no funciona -- PDO trataría el array como un único valor (un error, o una conversión incorrecta según el driver).

```php
<?php
function consultaConIn(PDO $pdo, string $sql, string $prefijo, array $valores): PDOStatement
{
    // Genera un marcador de posición con nombre por valor: prefijo_0, prefijo_1...
    $marcadores = [];
    $params = [];
    foreach (array_values($valores) as $i => $valor) {
        $nombre = ":{$prefijo}_{$i}";
        $marcadores[] = $nombre;
        $params[$nombre] = $valor;
    }

    // Reemplaza el marcador {IN} del SQL dado por la lista de marcadores generada
    $sqlFinal = str_replace('{IN}', implode(', ', $marcadores), $sql);

    $stmt = $pdo->prepare($sqlFinal);
    $stmt->execute($params);
    return $stmt;
}

$stmt = consultaConIn(
    $pdo,
    'SELECT * FROM clientes WHERE ciudad IN ({IN})',
    'ciudad',
    ['Lyon', 'Paris']
);
// SQL generado: SELECT * FROM clientes WHERE ciudad IN (:ciudad_0, :ciudad_1)
```

| Paso | Rol |
|---|---|
| Un marcador de posición con nombre por valor (`:ciudad_0`, `:ciudad_1`...) | Rodea la limitación de PDO (un marcador = un único valor) |
| `implode(', ', $marcadores)` | Construye la lista `(:ciudad_0, :ciudad_1)` a insertar en el `IN (...)` |
| `$params` | Cada valor sigue pasándose por separado a `execute()`, nunca concatenado en el texto SQL |

> **Trampa:** una lista vacía (`$valores = []`) genera un `IN ()` sintácticamente inválido en la mayoría de los motores SQL. Comprobar que `$valores` no está vacío antes de llamar a esta función (o cortocircuitar toda la consulta: una búsqueda sobre una lista vacía de ciudades no puede devolver ningún resultado de todas formas).
>
> **Buena práctica:** nunca concatenar directamente los valores en el `IN (...)` (sería la misma falla de [inyección SQL](#inyeccion-sql-por-que-nunca-concatenar-un-valor-externo) que concatenar cualquier otro valor externo); generar siempre un marcador de posición por valor, sea cual sea el tamaño de la lista.

## Controlar SQL desde Python con `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) es el equivalente en [Python](/?c=langages&s=python&p=python) de PDO para dialogar con una base de datos a través de un driver ODBC.

```python
import pyodbc

conexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mi_servidor;DATABASE=tienda;UID=usuario;PWD=contraseña"
)  # abre la conexión con la base de datos

cursor = conexion.cursor()
# ? = marcador de posición, valor pasado aparte
cursor.execute("SELECT * FROM clientes WHERE ciudad = ?", "Lyon")

una_fila = cursor.fetchone()  # una sola fila
todas    = cursor.fetchall()  # todas las filas

# confirma las escrituras (INSERT/UPDATE/DELETE); innecesario tras un simple SELECT
conexion.commit()
```

Mismo ciclo que PDO: `connect()` (abrir la conexión) → `cursor()` → `execute()` (con `?` como marcador de posición, valor pasado aparte, nunca concatenado) → `fetchone()`/`fetchall()`. `executemany()` repite una misma consulta para una lista de conjuntos de valores (inserción masiva), más rápido que un bucle de `execute()` uno por uno.

### Autenticación Windows integrada: un mensaje de fallo puede esconder dos causas distintas

Con `Trusted_Connection=yes` en la cadena de conexión, no se proporciona ningún login ni contraseña: Windows negocia la identidad entre bastidores (Kerberos si hay un controlador de dominio accesible, si no repliega a NTLM), y el servidor SQL recibe una identidad ya autenticada.

```python
conexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mi_servidor;DATABASE=tienda;Trusted_Connection=yes"
)
```

> **Trampa:** un mensaje `Login failed for user 'DOMINIO\usuario'` NO significa necesariamente que Kerberos/NTLM haya fallado. La identidad Windows pudo negociarse perfectamente con éxito (autenticación), pero el servidor SQL no encontró después ningún login mapeado a esa cuenta en ESTA instancia concreta (autorización): dos causas distintas, exactamente el mismo mensaje de error.
>
> **Buena práctica:** antes de buscar un problema de red/Kerberos, verificar que existe un login para esa cuenta Windows en la instancia objetivo (ej: confirmando que la misma cuenta, desde la misma máquina, se conecta sin problema a otra instancia).

## `sqlcmd`: ejecutar un script SQL en línea de comandos, con variables (SQL Server)

`sqlcmd` ejecuta un archivo `.sql` directamente en línea de comandos, sin pasar por un lenguaje anfitrión. La opción `-v` define una **variable de script**, sustituida en el texto SQL antes de la ejecución mediante `$(NOMBRE)`:

```bash
sqlcmd -S mi_servidor -v DBNAME=base_pruebas -i script.sql
```

```sql
-- script.sql
USE [$(DBNAME)];

IF '$(DBNAME)' = '' OR '$(DBNAME)' = '$' + '(DBNAME)'
    RAISERROR('La variable DBNAME debe proporcionarse via -v', 16, 1);
```

La segunda comprobación de la guarda (`'$' + '(DBNAME)'`) detecta el caso en que `$(DBNAME)` ni siquiera fue sustituida y aparece tal cual en el texto ejecutado (script lanzado sin `-v`, o con un nombre de variable mal escrito). `:setvar NOMBRE valor` hace lo mismo directamente dentro del script, en lugar de en la línea de comandos.

> **Buena práctica:** parametrizar un mismo script `.sql` para varios entornos (preproducción/producción) mediante `-v`, en lugar de duplicarlo o generarlo dinámicamente desde un lenguaje anfitrión.

## Inyección SQL: por qué nunca concatenar un valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clientes WHERE ciudad = '" . $_GET['ciudad'] . "'";
?>
```

Si `$_GET['ciudad']` contuviera `Lyon' OR '1'='1`, la consulta se convertiría en una condición siempre verdadera, devolviendo todas las filas de la tabla. Equivalente conceptual a un [desbordamiento de búfer](/?c=langages&s=c&p=memoire) en [C](/?c=langages&s=c&p=c): una entrada no controlada que modifica la **estructura** de la orden, en lugar de quedarse como un simple dato.

Los marcadores de posición con nombre (`:ciudad`) lo impiden estructuralmente: el valor pasado a `execute()` **siempre** es tratado como dato puro por el driver, nunca reinterpretado como SQL, sea cual sea su contenido.

```php
<?php
// Construir dinámicamente una cláusula WHERE sigue siendo seguro,
// mientras solo se concatenen los NOMBRES de los marcadores de posición, nunca los valores en
// sí:
function construirY(array $criterios): array
{
    $clausulas = [];
    $params    = [];
    foreach ($criterios as $columna => $valor) {
        $clausulas[] = "{$columna} = :{$columna}";
        $params[":{$columna}"] = $valor;
    }
    return [implode(' AND ', $clausulas), $params];
}
// construirY(['ciudad' => 'Lyon']) -> ["ciudad = :ciudad", [':ciudad' => 'Lyon']]
?>
```

El texto SQL generado nunca contiene el valor real, solo el nombre literal del marcador de posición (`:ciudad`): el valor real viaja por separado en `$params`, usado por `execute($params)`.

> **Nota (seguridad):** este mecanismo protege los **valores** (`$valor`), pero no los **nombres de columna** (`$columna`): estos se concatenan directamente en el SQL, sin pasar por un marcador de posición (técnicamente no es posible: PDO solo permite parametrizar valores, nunca nombres de columnas o tablas). Si `$criterios` viniera directamente de una entrada de usuario sin filtrar (ej. `construirY($_GET)`), un nombre de columna forjado podría reintroducir una inyección SQL. `$columna` debe por tanto proceder siempre de una lista blanca de columnas autorizadas de antemano, nunca directamente de una entrada externa.

## El principio del mínimo privilegio

Más allá de la inyección SQL (que protege el *cómo* se consulta la base de datos), una buena práctica de seguridad se ocupa del *quién*: la cuenta usada por una aplicación para conectarse a la base de datos nunca debería tener más permisos de los que realmente necesita.

```sql
-- en lugar de dar todos los permisos a una sola cuenta de aplicación:
GRANT SELECT, INSERT, UPDATE ON tienda.pedidos TO 'app_tienda'@'%';
-- sin DROP, sin DELETE, ni acceso a otras tablas/bases de datos, si la aplicación nunca los
-- necesita
```

En concreto, una cuenta de aplicación comprometida (mediante un fallo en el código, una fuga de credenciales...) solo puede causar daños a la medida de sus propios permisos: una cuenta limitada a `SELECT`/`INSERT`/`UPDATE` sobre una única tabla no permite a un atacante borrar toda una base de datos, aunque logre ejecutar consultas arbitrarias. Es una protección **complementaria** a las consultas preparadas, no un sustituto: limita los daños *si* de todas formas se produce una inyección (bug no detectado, consulta dinámica mal construida...), en lugar de impedir la inyección en sí.

## `MERGE`: un UPSERT en una sola consulta (SQL Server)

Un `SELECT` seguido de un `UPDATE`/`INSERT` condicional para sincronizar una tabla destino a partir de una fuente requiere dos consultas y una decisión en código (o en T-SQL) entre ambas. `MERGE` hace las dos cosas en una sola instrucción atómica: compara una fuente (`USING`) con el destino sobre una clave (`ON`), y ejecuta `WHEN MATCHED THEN UPDATE` o `WHEN NOT MATCHED THEN INSERT` según el caso.

```sql
MERGE clientes AS destino
USING (SELECT 1 AS id_cliente, 'Dupont' AS nombre, 'Marsella' AS ciudad) AS fuente
ON destino.id = fuente.id_cliente
WHEN MATCHED THEN
    UPDATE SET destino.nombre = fuente.nombre, destino.ciudad = fuente.ciudad
WHEN NOT MATCHED THEN
    INSERT (id, nombre, ciudad) VALUES (fuente.id_cliente, fuente.nombre, fuente.ciudad);
```

> **Buena práctica:** generar el texto del `MERGE` desde una simple lista `(columna, tipo)` en código en lugar de escribir a mano cada `UPDATE SET`/`INSERT`: añadir una columna al esquema entonces solo requiere una entrada en esa lista, nunca retocar la plantilla SQL.

## SCD2: conservar el historial de cambios de una tabla

Un `UPDATE` clásico sobrescribe el valor anterior para siempre:

```sql
-- la ciudad anterior 'Lyon' se pierde definitivamente
UPDATE clientes SET ciudad = 'Paris' WHERE id = 1;
```

El patrón **SCD2** (*[Slowly Changing Dimension](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/) tipo 2*) evita esta pérdida: en lugar de sobrescribir una fila, se cierra la versión actual y se inserta una nueva, conservando ambas.

| Columna | Papel |
|---|---|
| `valid_from` | Fecha a partir de la cual esta versión de la fila es válida |
| `valid_to` | Fecha hasta la cual lo fue (`NULL` si sigue siendo válida) |
| `is_current` | Verdadero solo para la versión actual de esta fila |

```sql
-- 1. cerrar la versión actual
UPDATE clientes SET valid_to = GETDATE(), is_current = 0
WHERE id_cliente = 1 AND is_current = 1;

-- 2. insertar la nueva versión
INSERT INTO clientes (id_cliente, nombre, ciudad, valid_from, valid_to, is_current)
VALUES (1, 'Dupont', 'Paris', GETDATE(), NULL, 1);
```

> **Trampa:** `id_cliente` (el identificador de negocio) ahora se repite en varias filas (una por versión): la `PRIMARY KEY` de la tabla debe ser una clave técnica separada (`IDENTITY`), no `id_cliente` sola.
>
> **Buena práctica:** reservar SCD2 para las columnas cuyo historial realmente importa para el uso que se le da (ej: la ciudad de un cliente, para un análisis geográfico a lo largo del tiempo); sobrescribir normalmente (`UPDATE` simple) las columnas donde solo importa el valor actual.

## Para profundizar

- [Documentación de PDO (php.net)](https://www.php.net/manual/es/book.pdo.php)
- [Documentación de `pyodbc` (repositorio oficial)](https://github.com/mkleehammer/pyodbc/wiki)
- [W3Schools SQL (en inglés, buena chuleta de sintaxis)](https://www.w3schools.com/sql/)

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada columna tiene un tipo (`INT`, `decimal`, `varchar`, `date`) y una clave primaria identifica cada fila. SQL consulta (DML) y define la estructura (DDL) de tablas (columnas fijas, filas = registros). `JOIN` combina dos tablas por una columna común; `INNER JOIN` elimina las filas sin correspondencia, `LEFT JOIN` las conserva; `APPLY` combina una unión con una llamada a función/subconsulta parametrizada por fila. `GROUP BY`/`GROUPING SETS` resumen por grupo, con o sin total global en la misma consulta. `NULL` = valor desconocido, nunca confundir con un valor centinela. `MERGE` hace en una consulta lo que un `SELECT` y luego `UPDATE`/`INSERT` harían en dos. Una consulta se lee cláusula por cláusula (`SELECT` las columnas, `FROM` la tabla, `WHERE` las filas), y el servidor la procesa en el orden `WHERE`, `GROUP BY`, cálculo, `ORDER BY`. Una tabla no tiene ningún orden garantizado: solo `ORDER BY` fija uno. Con `NULL`, una comparación vale «desconocido» y `WHERE` solo conserva el «verdadero». |
| **Herramientas utilizables** | `SELECT`/`WHERE`, funciones de agregación (`COUNT`/`SUM`/`AVG`), `GROUP BY`/`GROUPING SETS`/`GROUPING()`, `JOIN`/`LEFT JOIN`/`OUTER APPLY`/`CROSS APPLY`, notación de tres segmentos para una consulta entre bases de datos en la misma instancia, `MERGE` para un UPSERT, `ISNULL()`/`COALESCE()` para un rescate idempotente, `CREATE TABLE`/`ALTER TABLE`, índices, consultas preparadas vía PDO ([PHP](/?c=langages&s=php&p=php), incluido un `IN (...)` de tamaño variable mediante marcadores generados) o `pyodbc` ([Python](/?c=langages&s=python&p=python)), `sqlcmd` para un script parametrizado en línea de comandos, SCD2 para conservar el historial de cambios, `ORDER BY`, `TOP n`, `CAST`, `IS NULL`, variable de tabla `DECLARE @t TABLE` para practicar sin crear nada duradero. |
| **Trampas a evitar** | Concatenar un valor externo directamente en una consulta SQL (inyección SQL), incluido dentro de un `IN (...)`; usar `INNER JOIN` cuando se quieren conservar las filas sin correspondencia; reordenar columnas con `ALTER TABLE` (imposible, hay que recrear la tabla); confundir `NULL` con un valor centinela, incluido el `NULL` de total de un `GROUPING SETS`; leer un fallo de login en una conexión Windows integrada como necesariamente un fallo Kerberos/NTLM, cuando la autenticación pudo tener éxito sin existir un login en la instancia; `TOP n` sin `ORDER BY`; un `;` colocado entre dos cláusulas; comparar tipos distintos (número con fecha); `<>` o `= NULL` sobre una columna que contiene `NULL`; creer que un cálculo afecta a toda la tabla cuando solo afecta a las filas que conserva `WHERE`. |
| **Buenas prácticas** | Pasar siempre por una consulta preparada (`prepare`/`execute`) para un valor externo, incluido un marcador por valor dentro de un `IN (...)`; limitar los permisos de la cuenta de aplicación a lo estrictamente necesario (principio del mínimo privilegio); clave técnica (`IDENTITY`) en lugar de clave natural ancha para indexar; `GROUPING()` para distinguir una fila de total de un valor `NULL` real; `ISNULL(columna, valor)` en lugar de un `UPDATE` directo para un rescate reejecutable sin riesgo; `ORDER BY` para todo resultado cuyo orden importe; paréntesis alrededor de un `OR` combinado con un `AND`; `decimal(p, s)` para el dinero; `IS NULL` en lugar de `= NULL`, y `COUNT(*)` para conocer el total de filas. |
