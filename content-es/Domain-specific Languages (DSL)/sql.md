# SQL

SQL (*Structured Query Language*) es un lenguaje con un único objetivo: consultar y manipular datos almacenados en forma de tablas. Al igual que las expresiones regulares, no es un lenguaje de programación generalista: no tiene bucles, ni funciones definidas por el usuario, ni variables en el sentido clásico. Es interpretado por un motor de base de datos (MySQL, PostgreSQL, SQL Server, SQLite...), normalmente controlado desde un lenguaje anfitrión (PHP, Python, JS...) a través de un conector.

## Una tabla = un array de estructuras / una lista de diccionarios

Una tabla relacional tiene columnas fijas (como los campos de un «`struct`» en C o las claves de un «dict» en Python); cada fila es una instancia de esta estructura.

```sql
SELECT id, número FROM clients WHERE ciudad = 'Lyon';
```

«Columnas `id` / `número`, de la tabla `clients`, solo las filas en las que `ciudad = 'Lyon'`». `SELECT *` selecciona todas las columnas.

## Las funciones de agregación

Resumen varias líneas en un único valor:

| Función | Papel |
|---|---|
| `COUNT(*)` | Número de líneas |
| `SUM(columna)` | Suma de una columna numérica |
| `AVG(columna)` | Media de una columna numérica |
| `MAX(columna)` / `MIN(columna)` | Valor máximo / mínimo |

```sql
SELECT COUNT(*) AS nb_clients FROM clients WHERE ciudad = 'Lyon';
```

`AS número` Asigna un alias a una columna del resultado (en este caso, la columna calculada se llamará «`nb_clients`»).

## `JOIN` : combinar dos tablas en una columna común

Equivalente declarativo para emparejar dos colecciones mediante una clave compartida, en lugar de escribir un bucle con una búsqueda manual:

```sql
SELECT c.número, v.date_achat
FROM clients c
JOIN ventes v ON v.client_id = c.id; -- INNER JOIN : les lignes sans correspondance disparaissent
```

```sql
SELECT c.número, v.date_achat
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id; -- garde TOUTES les lignes de gauche, NULL si pas de correspondance
```

- `c` / `v` son alias de tabla, imprescindibles cuando dos tablas comparten el nombre de una columna (por ejemplo, `c.número` frente a una posible `v.número`, sin ambigüedad).
- `JOIN` (o «`INNER JOIN`»): solo conserva las líneas que coinciden en ambos lados.
- `LEFT JOIN` : conserva todas las filas de la tabla de la izquierda; las columnas de la derecha se asignan a `NULL` si no hay coincidencia; resulta útil cuando se quiere enumerar a *todo el mundo*, independientemente de si se ha encontrado alguna coincidencia o no (por ejemplo: todos los clientes, hayan comprado ya o no).

## Control de SQL desde PHP con PDO

PDO (*PHP Data Objects*) es la interfaz nativa de PHP para interactuar con una base de datos, independientemente del motor que utilice.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare('SELECT * FROM clients WHERE ville = :ville');
$stmt->execute([':ville' => 'Lyon']);

$línea  = $stmt->fetch(\PDO::FETCH_ASSOC);    // una sola línea, matriz asociativa
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC); // todas las líneas
?>
```

El proceso es siempre el mismo: `prepare()` (escribir la consulta, con marcadores de posición como `:ciudad`) → `execute()` (introducir los valores reales) → `fetch()` / `fetchAll()` (obtener el resultado).

> **Nota:** `$pdo->query($sql)` es un atajo **sin** espacio reservado, que solo se puede utilizar si `$sql` es una cadena 100 % fija, sin ninguna variable externa concatenada en ella. En cuanto se incluya un solo valor externo (usuario, URL, sesión...) en la consulta, hay que utilizar `prepare()` / `execute()`.

## Inyección SQL: por qué nunca se debe concatenar un valor externo

```php
<?php
// NUNCA:
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Si `$_GET['ciudad']` contuviera `Lyon' OR '1'='1`, la consulta se convertiría en una condición siempre verdadera, devolviendo todas las filas de la tabla. Equivalente conceptual a un desbordamiento de búfer en C: una entrada no controlada que modifica la **estructura** de la orden, en lugar de quedarse como un simple dato.

Los espacios reservados denominados «`:ciudad`» lo impiden de forma estructural: el valor pasado a `execute()` **siempre** es tratado como datos puros por el controlador, nunca se reinterpreta como SQL, independientemente de lo que contenga.

```php
<?php
// La construcción dinámica de una cláusula WHERE sigue siendo segura,
// siempre que solo se concatenen los NOMBRES de los marcadores de posición, nunca los valores en sí mismos:
function construireEt(array $criteres): array
{
    $clauses = [];
    $params  = [];
    foreach ($criteres as $columna => $valor) {
        $clauses[] = "{$columna} = :{$columna}";
        $params[":{$columna}"] = $valor;
    }
    return [implode(' AND ', $clauses), $params];
}
// construireEt(['ville' => 'Lyon']) -> ["ville = :ville", [':ville' => 'Lyon']]
?>
```

El texto SQL generado nunca contiene el valor real, sino únicamente el nombre literal del marcador de posición (`:ciudad`); el valor real se envía por separado en `$params`, que utiliza `execute($params)`.

> **Nota (seguridad):** este mecanismo protege los **valores** (`$valor`), pero no los **nombres de las columnas** (`$columna`); estos se concatenan directamente en el SQL, sin pasar por un marcador de posición (técnicamente no es posible: PDO solo permite pasar valores como parámetros, nunca nombres de columnas o tablas). Si `$criteres` procediera directamente de una entrada de usuario sin filtrar (p. ej., `construireEt($_GET)`), un nombre de columna falsificado podría volver a provocar una inyección SQL. Por lo tanto, `$columna` debe proceder siempre de una lista blanca de columnas autorizadas de antemano, nunca directamente de una entrada externa.

## Para profundizar en el tema

- [Documentación de PDO — php.net](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (en inglés, buena guía de referencia sobre la sintaxis)](https://www.w3schools.com/sql/)
