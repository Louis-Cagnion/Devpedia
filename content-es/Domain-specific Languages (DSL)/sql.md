---
order: 2
---

# SQL

SQL (*Structured Query Language*) es un lenguaje con un único propósito: consultar y manipular datos almacenados en forma de tablas. Al igual que [la regex](/?c=domain-specific-languages-dsl&p=regex), no es un lenguaje de programación generalista: no tiene bucles, ni funciones definidas por el usuario, ni variables en el sentido clásico. Lo interpreta un motor de base de datos ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/es-es/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), normalmente controlado desde un lenguaje anfitrión ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript)...) a través de un conector.

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

## Inyección SQL: por qué nunca concatenar un valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clientes WHERE ciudad = '" . $_GET['ciudad'] . "'";
?>
```

Si `$_GET['ciudad']` contuviera `Lyon' OR '1'='1`, la consulta se convertiría en una condición siempre verdadera, devolviendo todas las filas de la tabla. Equivalente conceptual a un [desbordamiento de búfer](/?c=langages-de-programmation&s=c&p=memoire) en C: una entrada no controlada que modifica la **estructura** de la orden, en lugar de quedarse como un simple dato.

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

## Para profundizar

- [Documentación de PDO (php.net)](https://www.php.net/manual/es/book.pdo.php)
- [W3Schools SQL (en inglés, buena chuleta de sintaxis)](https://www.w3schools.com/sql/)

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | SQL consulta y manipula tablas (columnas fijas, filas = registros). `JOIN` combina dos tablas por una columna común; `INNER JOIN` elimina las filas sin correspondencia, `LEFT JOIN` las conserva. |
| **Herramientas utilizables** | `SELECT`/`WHERE`, funciones de agregación (`COUNT`/`SUM`/`AVG`), `JOIN`/`LEFT JOIN`, consultas preparadas vía PDO. |
| **Trampas a evitar** | Concatenar un valor externo directamente en una consulta SQL (inyección SQL); usar `INNER JOIN` cuando se quieren conservar las filas sin correspondencia. |
| **Buenas prácticas** | Pasar siempre por una consulta preparada (`prepare`/`execute`) para un valor externo; limitar los permisos de la cuenta de aplicación a lo estrictamente necesario (principio del mínimo privilegio). |
