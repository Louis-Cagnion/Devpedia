# SQL

SQL (*Structured Query Language*) is a single-purpose language designed to query and manipulate data stored in tables. Like regular expressions, it is not a general-purpose programming language—it has no loops, no user-defined functions, and no variables in the traditional sense. It is interpreted by a database engine (MySQL, PostgreSQL, SQL Server, SQLite, etc.), typically controlled from a host language (PHP, Python, JS, etc.) via a connector.

## A table = an array of structs / a list of dictionaries

A relational table has fixed columns (like the fields of a C `struct`, or the keys of a Python `dict`); each row is an instance of this structure.

```sql
SELECT id, name FROM clients WHERE city = 'Lyon';
```

"Columns `id` / `name`, from the table `clients`, only the rows where `city = 'Lyon'`." `SELECT *` selects all columns.

## Aggregation Functions

They summarize several lines into a single value:

| Function | Role |
|---|---|
| `COUNT(*)` | Number of lines |
| `SUM(column)` | Sum of a Numeric Column |
| `AVG(column)` | Average of a column of numbers |
| `MAX(column)` / `MIN(column)` | Maximum / Minimum Value |

```sql
SELECT COUNT(*) AS nb_clients FROM clients WHERE city = 'Lyon';
```

`AS name` Assigns an alias to a column in the result (in this case, the calculated column will be named "`nb_clients`").

## `JOIN` : Join two tables based on a common column

A declarative equivalent of matching two collections using a shared key, instead of writing a loop with a manual search:

```sql
SELECT c.name, v.date_achat
FROM clients c
JOIN ventes v ON v.client_id = c.id; -- INNER JOIN : les lignes sans correspondance disparaissent
```

```sql
SELECT c.name, v.date_achat
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id; -- garde TOUTES les lignes de gauche, NULL si pas de correspondance
```

- `c` / `v` are table aliases, which are essential whenever two tables share a column name (e.g., `c.name` vs. a possible `v.name`, to avoid ambiguity).
- `JOIN` (or `INNER JOIN`): keeps only the lines that match on both sides.
- `LEFT JOIN` : Keeps all rows from the left table and columns from the right table at `NULL` if no match is found—useful when you want to list *everyone*, regardless of whether a match was found (e.g., all customers, whether they have made a purchase or not).

## Controlling SQL from PHP Using PDO

PDO (*PHP Data Objects*) is PHP's native interface for interacting with a database, regardless of the database engine.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare('SELECT * FROM clients WHERE ville = :ville');
$stmt->execute([':ville' => 'Lyon']);

$line  = $stmt->fetch(\PDO::FETCH_ASSOC);    // a single line, associative array
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC); // all lines
?>
```

The process is always the same: `prepare()` (enter the query, with placeholders such as `:city`) → `execute()` (provide the actual values) → `fetch()` / `fetchAll()` (retrieve the result).

> **Note:** `$pdo->query($sql)` is a shortcut **that does not use** reserved characters; it can only be used if `$sql` is a string that is 100% hard-coded, with no external variables concatenated into it. As soon as a single external value (user, URL, session, etc.) is included in the query, you must use `prepare()` / `execute()`.

## SQL Injection: Why You Should Never Concatenate an External Value

```php
<?php
// NEVER:
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

If `$_GET['city']` contained `Lyon' OR '1'='1`, the query would become a condition that is always true, returning all rows in the table. This is conceptually equivalent to a buffer overflow in C: an unchecked input that alters the **structure** of the command, rather than remaining mere data.

Named reserved spaces (`:city`) prevent this at the structural level: the value passed to `execute()` is **always** treated as raw data by the driver and is never interpreted as SQL, regardless of its contents.

```php
<?php
// Dynamically constructing a WHERE clause is still safe,
// as long as only the placeholder NAMES are concatenated—never the values themselves:
function construireEt(array $criteres): array
{
    $clauses = [];
    $params  = [];
    foreach ($criteres as $column => $value) {
        $clauses[] = "{$column} = :{$column}";
        $params[":{$column}"] = $value;
    }
    return [implode(' AND ', $clauses), $params];
}
// construireEt(['city' => 'Lyon']) -> ["city = :city", [':city' => 'Lyon']]
?>
```

The generated SQL text never contains the actual value, only the literal name of the placeholder (`:city`)—the actual value is passed separately in `$params`, which is used by `execute($params)`.

> **Note (security):** This mechanism protects `$value`, but not `$column`—these are concatenated directly into the SQL without passing through a placeholder (this is technically not possible: PDO only allows values to be passed as parameters, never column or table names). If `$criteres` came directly from unfiltered user input (e.g., `construireEt($_GET)`), a fabricated column name could reintroduce an SQL injection. `$column` must therefore always come from a predefined whitelist of allowed columns, never directly from external input.

## Further Reading

- [PDO Documentation — php.net](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (in English, a good syntax reference)](https://www.w3schools.com/sql/)
