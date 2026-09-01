---
order: 2
---

# SQL

SQL (*Structured Query Language*) es un lenguaje con un único propósito: consultar y manipular datos almacenados en forma de tablas. Al igual que [la regex](/?c=domain-specific-languages-dsl&p=regex), no es un lenguaje de programación generalista: no tiene bucles, ni funciones definidas por el usuario, ni variables en el sentido clásico. Lo interpreta un motor de base de datos ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/es-es/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), normalmente controlado desde un lenguaje anfitrión ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript)...) a través de un conector.

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

## `JOIN`: combinar dos tablas por una columna común

Equivalente declarativo de emparejar dos colecciones mediante una clave compartida, en lugar de escribir un bucle con una búsqueda manual:

```sql
SELECT c.nombre, v.fecha_compra
FROM clientes c
JOIN ventas v ON v.cliente_id = c.id; -- INNER JOIN: las filas sin correspondencia desaparecen
```

```sql
SELECT c.nombre, v.fecha_compra
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id; -- conserva TODAS las filas de la izquierda, NULL si no hay correspondencia
```

- `c`/`v` son alias de tabla, imprescindibles en cuanto dos tablas comparten el nombre de una columna (`c.nombre` frente a un posible `v.nombre`, sin ambigüedad).
- `JOIN` (o `INNER JOIN`): solo conserva las filas que coinciden en ambos lados.
- `LEFT JOIN`: conserva todas las filas de la tabla de la izquierda, columnas de la derecha a `NULL` si no hay correspondencia: útil cuando se quiere listar *a todo el mundo*, haya correspondencia o no (ej: todos los clientes, hayan comprado ya o no).

> **Trampa:** usar `JOIN` (INNER) cuando en realidad se quiere *a todo el mundo*: un cliente sin ninguna venta desaparecería silenciosamente del resultado, mientras que un `LEFT JOIN` lo habría conservado con columnas a `NULL`.
>
> **Buena práctica:** preguntarse explícitamente, antes de escribir la unión, si las filas sin correspondencia deben desaparecer (`JOIN`) o seguir siendo visibles (`LEFT JOIN`): ambas producen un resultado sintácticamente válido, pero semánticamente diferente.

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
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)  -- toda venta debe apuntar a un cliente existente
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

## `NULL`: un dato ausente, no un valor como los demás

`NULL` significa "no se sabe" o "no se ha indicado nada"; **no** es lo mismo que un valor centinela como `-1` o una cadena vacía, que significa "se sabe que estructuralmente no hay ninguno".

```sql
SELECT AVG(descuento) FROM ventas;
-- AVG/SUM/COUNT(columna) ignoran las filas a NULL: un descuento a NULL no cuenta como 0
```

> **Trampa:** guardar `-1` en lugar de `NULL` para "sin descuento" falsea `AVG(descuento)`, que entonces contaría `-1` como un valor numérico real en vez de ignorarlo.
>
> **Buena práctica:** reservar `NULL` para "valor desconocido/no indicado"; usar un valor centinela solo si su significado de negocio está documentado, y no mezclar nunca ambos en la misma columna.

## Controlar SQL desde PHP con PDO

PDO (*PHP Data Objects*) es la interfaz nativa de PHP para dialogar con una base de datos, sea cual sea su motor.

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

## Controlar SQL desde Python con `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) es el equivalente en [Python](/?c=langages-de-programmation&s=python&p=python) de PDO para dialogar con una base de datos a través de un driver ODBC.

```python
import pyodbc

conexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mi_servidor;DATABASE=tienda;UID=usuario;PWD=contraseña"
)  # abre la conexión con la base de datos

cursor = conexion.cursor()
cursor.execute("SELECT * FROM clientes WHERE ciudad = ?", "Lyon")  # ? = marcador de posición, valor pasado aparte

una_fila = cursor.fetchone()  # una sola fila
todas    = cursor.fetchall()  # todas las filas

conexion.commit()  # confirma las escrituras (INSERT/UPDATE/DELETE); innecesario tras un simple SELECT
```

Mismo ciclo que PDO: `connect()` (abrir la conexión) → `cursor()` → `execute()` (con `?` como marcador de posición, valor pasado aparte, nunca concatenado) → `fetchone()`/`fetchall()`. `executemany()` repite una misma consulta para una lista de conjuntos de valores (inserción masiva), más rápido que un bucle de `execute()` uno por uno.

## Inyección SQL: por qué nunca concatenar un valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clientes WHERE ciudad = '" . $_GET['ciudad'] . "'";
?>
```

Si `$_GET['ciudad']` contuviera `Lyon' OR '1'='1`, la consulta se convertiría en una condición siempre verdadera, devolviendo todas las filas de la tabla. Equivalente conceptual a un [desbordamiento de búfer](/?c=langages-de-programmation&s=c&p=memoire) en [C](/?c=langages-de-programmation&s=c&p=c): una entrada no controlada que modifica la **estructura** de la orden, en lugar de quedarse como un simple dato.

Los marcadores de posición con nombre (`:ciudad`) lo impiden estructuralmente: el valor pasado a `execute()` **siempre** es tratado como dato puro por el driver, nunca reinterpretado como SQL, sea cual sea su contenido.

```php
<?php
// Construir dinámicamente una cláusula WHERE sigue siendo seguro,
// mientras solo se concatenen los NOMBRES de los marcadores de posición, nunca los valores en sí:
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
-- sin DROP, sin DELETE, ni acceso a otras tablas/bases de datos, si la aplicación nunca los necesita
```

En concreto, una cuenta de aplicación comprometida (mediante un fallo en el código, una fuga de credenciales...) solo puede causar daños a la medida de sus propios permisos: una cuenta limitada a `SELECT`/`INSERT`/`UPDATE` sobre una única tabla no permite a un atacante borrar toda una base de datos, aunque logre ejecutar consultas arbitrarias. Es una protección **complementaria** a las consultas preparadas, no un sustituto: limita los daños *si* de todas formas se produce una inyección (bug no detectado, consulta dinámica mal construida...), en lugar de impedir la inyección en sí.

## SCD2: conservar el historial de cambios de una tabla

Un `UPDATE` clásico sobrescribe el valor anterior para siempre:

```sql
UPDATE clientes SET ciudad = 'Paris' WHERE id = 1;  -- la ciudad anterior 'Lyon' se pierde definitivamente
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
| **Para recordar** | SQL consulta (DML) y define la estructura (DDL) de tablas (columnas fijas, filas = registros). `JOIN` combina dos tablas por una columna común; `INNER JOIN` elimina las filas sin correspondencia, `LEFT JOIN` las conserva. `NULL` = valor desconocido, nunca confundir con un valor centinela. |
| **Herramientas utilizables** | `SELECT`/`WHERE`, funciones de agregación (`COUNT`/`SUM`/`AVG`), `JOIN`/`LEFT JOIN`, `CREATE TABLE`/`ALTER TABLE`, índices, consultas preparadas vía PDO ([PHP](/?c=langages-de-programmation&s=php&p=php)) o `pyodbc` ([Python](/?c=langages-de-programmation&s=python&p=python)), SCD2 para conservar el historial de cambios. |
| **Trampas a evitar** | Concatenar un valor externo directamente en una consulta SQL (inyección SQL); usar `INNER JOIN` cuando se quieren conservar las filas sin correspondencia; reordenar columnas con `ALTER TABLE` (imposible, hay que recrear la tabla); confundir `NULL` con un valor centinela. |
| **Buenas prácticas** | Pasar siempre por una consulta preparada (`prepare`/`execute`) para un valor externo; limitar los permisos de la cuenta de aplicación a lo estrictamente necesario (principio del mínimo privilegio); clave técnica (`IDENTITY`) en lugar de clave natural ancha para indexar. |
