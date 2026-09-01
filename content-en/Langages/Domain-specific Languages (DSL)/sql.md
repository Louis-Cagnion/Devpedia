# SQL

SQL (*Structured Query Language*) is a single-purpose language designed to query and manipulate data stored in tables. Like regex, it is not a general-purpose programming language: it has no loops, no user-defined functions, and no variables in the traditional sense. It is interpreted by a database engine (MySQL, PostgreSQL, SQL Server, SQLite, etc.), typically controlled from a host language ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript), etc.) via a connector.

## DDL and DML: two families of commands

SQL commands fall into two families, depending on whether they affect a table's structure or the data within it:

| Family | Full name | Role | Commands |
|---|---|---|---|
| DDL | *Data Definition Language* | Create/modify/delete a table's structure | `CREATE`, `ALTER`, `DROP` |
| DML | *Data Manipulation Language* | Read/add/modify/delete data | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

The `SELECT` examples below are therefore DML: they read data from a table that already exists. DDL (creating that table) is covered further down.

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

## `CREATE TABLE`: creating a table (DDL)

```sql
CREATE TABLE clients (
    id    INT IDENTITY PRIMARY KEY,  -- unique identifier, generated automatically
    name  VARCHAR(100) NOT NULL,     -- required text, never empty
    city  VARCHAR(100) NULL          -- optional text, can stay empty
);

CREATE TABLE ventes (
    id         INT IDENTITY PRIMARY KEY,
    client_id  INT NOT NULL,
    date_achat DATE NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)  -- every sale must point to an existing customer
);
```

- Each column has a type (`INT`, `VARCHAR(100)` for text up to 100 characters, `DATE`...) that constrains what it can hold.
- `NOT NULL` / `NULL`: forces (or not) the column to always have a value, independently of its type.
- `PRIMARY KEY`: uniquely identifies each row; `IDENTITY` generates it automatically (1, 2, 3...), no need to supply it.
- `FOREIGN KEY`: forces `client_id` to always match an existing `id` in `clients`, preventing an orphan sale.

> **Note:** renaming the `clients` table (e.g. `sp_rename` on [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)) does not break the `FOREIGN KEY` constraint: it is linked internally to the object, not to its name.

## Index: speeding up a search or a join

An index is an auxiliary structure (like a book's index) that lets the engine find rows without scanning the whole table.

```sql
CREATE INDEX idx_clients_city ON clients(city);
```

> **Pitfall:** a key made of columns that are too wide can exceed an index's size limit (900 bytes on [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)).
>
> **Best practice:** prefer an auto-generated technical key (`IDENTITY`, known as a surrogate key) over a "natural" key (e.g. name + address combined) too wide to index efficiently.

## `ALTER TABLE`: what can be changed after the fact

| Operation | Possible with `ALTER TABLE` (SQL Server) |
|---|---|
| Add a column | Yes, trivial |
| Drop a column | Yes |
| Change a column's type | Yes, under conditions (e.g. existing data compatible) |
| Physically reorder columns | No: the table must be recreated and the data copied over |

> **Pitfall:** wanting to reorder existing columns, assuming a plain `ALTER TABLE` is enough, as it is for adding a column.

## `NULL`: a missing value, not a value like any other

`NULL` means "unknown" or "nothing was entered"; it is **not** the same as a sentinel value like `-1` or an empty string, which means "we know there structurally isn't one".

```sql
SELECT AVG(remise) FROM ventes;
-- AVG/SUM/COUNT(column) ignore rows set to NULL: a discount set to NULL does not count as 0
```

> **Pitfall:** storing `-1` instead of `NULL` for "no discount" skews `AVG(remise)`, which would then count `-1` as a real numeric value instead of ignoring it.
>
> **Best practice:** reserve `NULL` for "unknown/not entered"; only use a sentinel value if its business meaning is documented, and never mix the two for the same column.

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

## Controlling SQL from Python with `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) is the [Python](/?c=langages-de-programmation&s=python&p=python) equivalent of PDO for talking to a database via an ODBC driver.

```python
import pyodbc

connection = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=my_server;DATABASE=boutique;UID=user;PWD=password"
)  # opens the connection to the database

cursor = connection.cursor()
cursor.execute("SELECT * FROM clients WHERE city = ?", "Lyon")  # ? = placeholder, value passed separately

one_row  = cursor.fetchone()   # a single row
all_rows = cursor.fetchall()   # every row

connection.commit()  # commits writes (INSERT/UPDATE/DELETE); unnecessary after a plain SELECT
```

Same cycle as PDO: `connect()` (open the connection) → `cursor()` → `execute()` (with `?` as the placeholder, value passed separately, never concatenated) → `fetchone()`/`fetchall()`. `executemany()` repeats the same query for a list of value sets (bulk insert), faster than looping over `execute()` one at a time.

## SQL Injection: Why You Should Never Concatenate an External Value

```php
<?php
// NEVER:
$sql = "SELECT * FROM customers WHERE city = '" . $_GET['city'] . "'";
?>
```

If `$_GET['city']` contained `Lyon' OR '1'='1`, the query would become a condition that is always true, returning all rows in the table. Conceptually equivalent to a buffer overflow in [C](/?c=langages-de-programmation&s=c&p=c): an unchecked input that alters the **structure** of the command, rather than remaining mere data.

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

## SCD2: keeping a table's change history

A plain `UPDATE` overwrites the old value for good:

```sql
UPDATE clients SET city = 'Paris' WHERE id = 1;  -- the previous city 'Lyon' is lost for good
```

The **SCD2** pattern (*[Slowly Changing Dimension](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/) type 2*) avoids this loss: instead of overwriting a row, the current version is closed and a new one is inserted, keeping both.

| Column | Role |
|---|---|
| `valid_from` | Date from which this version of the row is valid |
| `valid_to` | Date until which it was valid (`NULL` if still valid) |
| `is_current` | True only for this row's current version |

```sql
-- 1. close the current version
UPDATE clients SET valid_to = GETDATE(), is_current = 0
WHERE id_client = 1 AND is_current = 1;

-- 2. insert the new version
INSERT INTO clients (id_client, name, city, valid_from, valid_to, is_current)
VALUES (1, 'Dupont', 'Paris', GETDATE(), NULL, 1);
```

> **Pitfall:** `id_client` (the business identifier) now repeats across several rows (one per version): the table's `PRIMARY KEY` must be a separate technical key (`IDENTITY`), not `id_client` alone.
>
> **Best practice:** reserve SCD2 for columns whose history actually matters for how they are used (e.g. a customer's city, for a geographic analysis over time); overwrite normally (a plain `UPDATE`) columns where only the current value matters.

## Learn More

- [PDO Documentation (php.net)](https://www.php.net/manual/fr/book.pdo.php)
- [`pyodbc` Documentation (official repository)](https://github.com/mkleehammer/pyodbc/wiki)
- [W3Schools SQL (in English, a good syntax reference)](https://www.w3schools.com/sql/)

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | SQL queries (DML) and defines the structure (DDL) of tables (fixed columns, rows = records). `JOIN` joins two tables based on a common column; `INNER JOIN` removes rows with no matches, `LEFT JOIN` keeps them. `NULL` = unknown value, never to be confused with a sentinel value. |
| **Tools available** | `SELECT` / `WHERE`, aggregate functions (`COUNT` / `SUM` / `AVG`), `JOIN` / `LEFT JOIN`, `CREATE TABLE` / `ALTER TABLE`, indexes, prepared queries via PDO ([PHP](/?c=langages-de-programmation&s=php&p=php)) or `pyodbc` ([Python](/?c=langages-de-programmation&s=python&p=python)), SCD2 for historizing changes. |
| **Pitfalls to Avoid** | Concatenating an external value directly into an SQL query (SQL injection); using `INNER JOIN` when you want to keep rows with no match; reordering columns via `ALTER TABLE` (impossible, the table must be recreated); confusing `NULL` with a sentinel value. |
| **Best Practices** | Always use a `prepare` ( / `execute`) for an external value; limit the application account’s permissions to only what is strictly necessary (principle of least privilege); a technical key (`IDENTITY`) rather than a wide natural key for indexing. |
