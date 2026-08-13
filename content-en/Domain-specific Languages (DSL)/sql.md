# SQL

SQL (*Structured Query Language*) is a single-purpose language designed to query and manipulate data stored in tables. Like regex, it is not a general-purpose programming language: it has no loops, no user-defined functions, and no variables in the traditional sense. It is interpreted by a database engine (MySQL, PostgreSQL, SQL Server, SQLite, etc.), typically controlled from a host language (PHP, Python, JS, etc.) via a connector.

## A table, like a spreadsheet sheet

A relational table resembles a spreadsheet: it has fixed columns with predefined names (`id`, `name`, `city`...), and each row represents a complete record that fills in all of these columns.

```sql
SELECT id, name FROM clients WHERE city = 'Lyon';
```

"Columns `id` / `name`, from the table `clients`, only the rows where `city = 'Lyon'`." `SELECT *` selects all columns.

## Aggregation Functions

They summarize multiple lines into a single value:

| Function | Role |
|---|---|
| `COUNT(*)` | Number of lines |
| `SUM(column)` | Sum of a numeric column |
| `AVG(column)` | Average of a column of numbers |
| `MAX(column)` / `MIN(column)` | Maximum / minimum value |

```sql
SELECT COUNT(*) AS nb_clients FROM clients WHERE city = 'Lyon';
```

`AS name` Assigns an alias to a column in the result (in this case, the calculated column will be named "`nb_clients`").

## `JOIN` : Joining two tables on a common column

A declarative way to match two collections using a shared key, instead of writing a loop with a manual search:

```sql
SELECT c.name, v.date_achat
FROM clients c
JOIN ventes v ON v.client_id = c.id; -- INNER JOIN: Rows with no matches are removed
```

```sql
SELECT c.name, v.date_achat
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id; -- Keeps ALL left-aligned lines; returns NULL if no match is found
```

- `c` / `v` are table aliases, which are essential whenever two tables share a column name (e.g., `c.name` vs. `v.name`, to avoid ambiguity).
- `JOIN` (or `INNER JOIN`): keeps only the lines that match on both sides.
- `LEFT JOIN` : Keeps all rows from the left table; for the right-hand columns, sets them to `NULL` if no match is found: useful when you want to list *everyone*, regardless of whether a match was found (e.g., all customers, whether they have made a purchase or not).

> **Pitfall:** Using `JOIN` (`INNER`) when you actually want *`EVERYONE*`: a customer with zero sales would be silently excluded from the results, whereas `LEFT JOIN` would have included them with columns set to `NULL`.
>
> **Best practice:** Before writing the join, explicitly ask yourself whether rows without a match should be removed (`JOIN`) or remain visible (`LEFT JOIN`), both produce a syntactically valid result, but with different semantic meanings.

## Controlling SQL from PHP with PDO

PDO (*PHP Data Objects*) is PHP's native interface for interacting with a database, regardless of the database engine.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'user', 'password');

$stmt = $pdo->prepare('SELECT * FROM customers WHERE city = :city');
$stmt->execute([':city' => 'Lyon']);

$line  = $stmt->fetch(\PDO::FETCH_ASSOC);    // a single line, associative array
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC); // all lines
?>
```

The process is always the same: `prepare()` (enter the query, using placeholders such as `:city`) → `execute()` (provide the actual values) → `fetch()` / `fetchAll()` (retrieve the result).

> **Note:** `$pdo->query($sql)` is a space-less shortcut that can only be used if `$sql` is a string that is 100% hard-coded, with no external variables concatenated into it. As soon as a single external value (user, URL, session, etc.) is included in the request, you must use `prepare()` / `execute()`.

## SQL Injection: Why You Should Never Concatenate an External Value

```php
<?php
// NEVER:
$sql = "SELECT * FROM customers WHERE city = '" . $_GET['city'] . "'";
?>
```

If `$_GET['city']` contained `Lyon' OR '1'='1`, the query would become a condition that is always true, returning all rows in the table. Conceptually equivalent to a buffer overflow in C: an unchecked input that alters the **structure** of the command, rather than remaining mere data.

`:city` prevent this at the structural level: the value passed to `execute()` is **always** treated as raw data by the driver and is never interpreted as SQL, regardless of its contents.

```php
<?php
// Dynamically constructing a WHERE clause remains safe,
// as long as only the placeholder NAMES are concatenated, never the values themselves:
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

The generated SQL text never contains the actual value, only the literal name of the placeholder (`:city`): the actual value is passed separately in `$params`, which is used by `execute($params)`.

> **Note (security):** This mechanism protects **values** (`$value`), but not **column names** (`$column`): these are concatenated directly into the SQL without passing through a placeholder (this is technically not possible: PDO only allows values to be passed as parameters, never column or table names). If `$criteres` came directly from unfiltered user input (e.g., `construireEt($_GET)`), a fabricated column name could reintroduce an SQL injection. `$column` must therefore always come from a predefined whitelist of allowed columns, never directly from external input.

## The principle of least privilege

Beyond SQL injection (which protects *how* the database is queried), a best security practice focuses on the *"who"*: the account used by an application to connect to the database should never have more privileges than it actually needs.

```sql
-- Instead of granting full access to a single application account:
GRANT SELECT, INSERT, UPDATE ON boutique.commandes TO 'app_boutique'@'%';
-- No DROP, DELETE, or access to other tables or databases, unless the application ever needs them
```

In practice, a compromised application account (due to a code vulnerability, a credential leak, etc.) can only cause damage commensurate with its own permissions: an account limited to `SELECT` / `INSERT` / `UPDATE` on a single table does not allow an attacker to delete an entire database, even if they manage to execute arbitrary queries. This is a **complementary** safeguard to prepared statements, not a substitute: it limits the damage *if* an injection does occur (undetected bug, poorly constructed dynamic query, etc.), rather than preventing the injection itself.

## Learn More

- [PDO Documentation (php.net)](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (in English, a good syntax reference)](https://www.w3schools.com/sql/)

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | SQL queries and manipulates tables (fixed columns, rows = records). `JOIN` joins two tables based on a common column; `INNER JOIN` removes rows with no matches, `LEFT JOIN` keeps them. |
| **Tools available** | `SELECT` / `WHERE`, aggregate functions (`COUNT` / `SUM` / `AVG`), `JOIN` / `LEFT JOIN`, prepared queries via PDO. |
| **Pitfalls to Avoid** | Concatenating an external value directly into an SQL query (SQL injection); use `INNER JOIN` when you want to keep rows with no match. |
| **Best Practices** | Always use a `prepare` ( / `execute`) for an external value; limit the application account’s permissions to only what is strictly necessary (principle of least privilege). |
