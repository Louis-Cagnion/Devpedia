---
order: 2
---

# SQL

SQL (*Structured Query Language*) is a single-purpose language designed to query and manipulate data stored in tables. Like [regex](/?c=domain-specific-languages-dsl&p=regex), it is not a general-purpose programming language: it has no loops, no user-defined functions, and no variables in the traditional sense. It is interpreted by a database engine ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html), etc.), typically controlled from a host language ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), [JS](/?c=langages&s=javascript&p=javascript), etc.) via a connector.

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

## Lines and columns: the two directions of a table

When you are starting out, these two words are often mixed up. A **column** is vertical: it holds one kind of information, the same for every record (the title, the price). A **row** is horizontal: it is one complete record (a book, with its title, its price and its date). The examples below read a `books` table with seven rows and five columns:

| id | title | genre | price | published_on |
|---|---|---|---|---|
| 1 | Nights of Mist | novel | 12.50 | 2024-03-15 |
| 2 | Family Cooking | cooking | 24.00 | 2023-11-02 |
| 3 | Atlas of the Seas | science | 39.90 | 2022-06-30 |
| 4 | The Last Lighthouse | novel | 9.90 | 2025-01-20 |
| 5 | Pasta and Sauces | cooking | 18.00 | 2024-09-05 |
| 6 | Journey to the Centre | novel | 15.00 | 2021-05-12 |
| 7 | Nearby Stars | science | 22.00 | 2025-04-01 |

```
              columns (vertical): chosen after SELECT
               id    title              genre      price
               \     |                  |          /
   row 1  ->   1     Nights of Mist     novel      12.50
   row 2  ->   2     Family Cooking     cooking    24.00
   row 3  ->   3     Atlas of the Seas  science    39.90

   rows (horizontal): removed with WHERE and TOP
```

Each direction is therefore set in a different place in the **query** (the request written in SQL, detailed [below](#reading-a-query-step-by-step-select-from-where)):

| I want to... | I set it... | Example |
|---|---|---|
| Keep only some columns | the list after `SELECT` | `SELECT title, price` |
| Keep only some rows | `WHERE` | `WHERE genre = 'novel'` |
| Keep only the first `n` rows | `TOP n` (T-SQL, the variant of SQL specific to SQL Server) | `SELECT TOP 3 title` |
| Change the order of the rows | `ORDER BY` | `ORDER BY price DESC` |

Confusing the two is the most common mistake: `WHERE` never makes a column disappear, and the list after `SELECT` never makes a row disappear.

### `SELECT *`: all columns at once

The star `*` replaces the list of columns with "all of them, in the order the table declares them". Useful for a first look at an unknown table:

```sql
SELECT * FROM books WHERE id = 2;  -- all the columns of the row whose id is 2
```

```
id  title           genre    price  published_on
--  --------------  -------  -----  ------------
2   Family Cooking  cooking  24     2023-11-02
```

| Risk of `SELECT *` outside a test | Why |
|---|---|
| Useless data carried over | The **server** (the program of the database engine, which holds the data and answers queries) reads and sends columns you do not need, sometimes very large ones |
| Sensitive data exposed | A column added later (a password, a number) comes out without anyone having decided it |
| Fragile code | A program that reads the result "by position" breaks if a column is added or moved |
| Huge table | Without `WHERE` or `TOP`, the whole table is brought back |

> **Best practice:** `SELECT *` to explore, the explicit list of columns (`SELECT title, price`) in anything that is saved or re-run later.

## Reading a query step by step: `SELECT`, `FROM`, `WHERE`

A **query** is a request written in SQL and sent to the **server**: the program of the database engine, which holds the data and answers. It is made up of **clauses**: each one starts with a keyword (`SELECT`, `FROM`, `WHERE`...) and answers one question.

```sql
SELECT title, price      -- 1. which columns to display
FROM books               -- 2. which table to read from
WHERE genre = 'novel';   -- 3. which rows to keep
```

| Clause | Question it answers | Here |
|---|---|---|
| `SELECT` | Which columns do you want to see? | `title` and `price` |
| `FROM` | Which table are you reading from? | `books` |
| `WHERE` | Which rows do we keep? | those whose `genre` is `'novel'` |

```
title                  price
---------------------  -----
Nights of Mist         12.5
The Last Lighthouse    9.9
Journey to the Centre  15
```

(These results were obtained with SQLite; how decimals are displayed, `12.5` or `12.50`, varies from one engine to another.)

### `FROM` and the full `schema.table` name

On a real server, a table belongs to a **schema** (a namespace that groups tables, explained in [Schemas and technical tables](/?c=bases-de-donnees&p=schemas-et-tables-techniques)). The full name is written `schema.table`, and on SQL Server the default schema is called `dbo`:

```sql
SELECT title FROM dbo.books;  -- full name: schema dbo, table books
```

Writing just `books` works when the engine knows which schema to search in; the full name avoids ambiguity if two schemas have a table with the same name. To read another database on the same server, a third segment is added, seen in [the cross-database query](#cross-database-queries-on-the-same-instance).

### `WHERE`: the server tests each row

`WHERE` contains a **condition**: a statement that is either true or false for a given row. The server tests it row by row: if it is true, the row stays; if it is false, the row disappears from the result. The possible comparisons:

| Operator | Meaning | Example |
|---|---|---|
| `=` | equal to (a single `=` sign, not two) | `genre = 'novel'` |
| `<>` | different from (`!=` is also accepted by most engines) | `genre <> 'novel'` |
| `<` / `>` | strictly less than / strictly greater than | `price < 20` |
| `<=` / `>=` | less than or equal to / greater than or equal to | `price >= 20` |

Text and dates are written between single quotes, numbers as they are: the full rule is in [Column types and consistent values](#column-types-and-consistent-values).

### `AND` and `OR`: combining several conditions

| Keyword | The row is kept if... |
|---|---|
| `AND` | both conditions are true at the same time |
| `OR` | at least one of the two is true |

Here is what the server does for `WHERE genre = 'novel' AND price < 12`, row by row:

| id | genre | price | `genre = 'novel'` | `price < 12` | Row kept? |
|---|---|---|---|---|---|
| 1 | novel | 12.50 | true | false | no |
| 2 | cooking | 24.00 | false | false | no |
| 3 | science | 39.90 | false | false | no |
| 4 | novel | 9.90 | true | true | **yes** |
| 5 | cooking | 18.00 | false | false | no |
| 6 | novel | 15.00 | true | false | no |
| 7 | science | 22.00 | false | false | no |

> **Pitfall:** `AND` comes before `OR`, just as multiplication comes before addition. `WHERE genre = 'cooking' OR genre = 'novel' AND price < 10` reads as "cooking, or (novel and under 10)": all the cooking books come back, even the one at 24.00.
>
> **Best practice:** as soon as an `OR` sits next to an `AND`, add parentheses so that the reading does not depend on the precedence rule.

```sql
-- without parentheses: cooking (all prices) OR (novel under 10)
SELECT title, genre, price FROM books
WHERE genre = 'cooking' OR genre = 'novel' AND price < 10;

-- with parentheses: (cooking OR novel) AND under 10
SELECT title, genre, price FROM books
WHERE (genre = 'cooking' OR genre = 'novel') AND price < 10;
```

```
title                genre    price   title                genre  price
-------------------  -------  -----   -------------------  -----  -----
Family Cooking       cooking  24      The Last Lighthouse  novel  9.9
The Last Lighthouse  novel    9.9
Pasta and Sauces     cooking  18
(without parentheses: 3 rows)         (with parentheses: 1 row)
```

## `ORDER BY`: sorting the result

A table has **no guaranteed order**: the server returns the rows in whatever order suits it (the storage order, the order of an [index](/?c=bases-de-donnees&p=les-index), the order of another way of reading the table), and that order can change from one run to the next. `ORDER BY` sets the order, and it goes after `WHERE`:

```sql
SELECT title, price
FROM books
WHERE published_on >= '2023-01-01'  -- first, remove the rows that are too old
ORDER BY price DESC;                -- then, sort the rest from most to least expensive
```

| Form | Effect |
|---|---|
| `ORDER BY price` | ascending (from smallest to largest); `ASC` is the default |
| `ORDER BY price DESC` | descending (`DESC` for *descending*) |
| `ORDER BY genre, price DESC` | first by `genre`, and for the same genre by `price` in descending order |

Result of `ORDER BY genre, price DESC` on the whole table:

```
title                  genre    price
---------------------  -------  -----
Family Cooking         cooking  24
Pasta and Sauces       cooking  18
Journey to the Centre  novel    15
Nights of Mist         novel    12.5
The Last Lighthouse    novel    9.9
Atlas of the Seas      science  39.9
Nearby Stars           science  22
```

`WHERE` and `ORDER BY` do not do the same job:

| | `WHERE` | `ORDER BY` |
|---|---|---|
| Role | removes rows | arranges rows |
| Number of rows afterwards | decreases (or stays the same) | identical |
| Position | after `FROM` | at the end of the query |

> **Pitfall:** believing that inserting the rows in the wanted order is enough. The result of a query without `ORDER BY` is not guaranteed, even if one day it comes out in insertion order: an index added later, or another way of reading the table, is enough to change it.
>
> **Best practice:** every result whose order matters carries an `ORDER BY`, with a second column if the first one can contain duplicates (two books at the same price would otherwise come out in an undefined order between them).

Two limits to know:

- **The cost.** Sorting a large table takes work from the server; an [index](/?c=bases-de-donnees&p=les-index) on the sort column can deliver the rows already in order.
- **When to avoid it.** Counting rows (`COUNT(*)`, see [Aggregation Functions](#aggregation-functions)) or checking that at least one exists needs no order at all: sorting would be wasted work.

## `TOP n` (T-SQL): limiting the number of rows, and its pitfall

In T-SQL, the language of [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), `TOP n` keeps the first `n` rows of the result. It is written right after `SELECT`. MySQL, PostgreSQL and SQLite have the equivalent `LIMIT n`, written at the end of the query. Details of `TOP`: [official documentation](https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql).

```sql
-- T-SQL: the 3 most expensive books
SELECT TOP 3 title, price
FROM books
ORDER BY price DESC;  -- without this sort, TOP 3 would return 3 arbitrary rows

-- MySQL / PostgreSQL / SQLite equivalent
SELECT title, price FROM books ORDER BY price DESC LIMIT 3;
```

```
title              price
-----------------  -----
Atlas of the Seas  39.9
Family Cooking     24
Nearby Stars       22
```

(Output obtained with the `LIMIT 3` form under SQLite.)

The pitfall comes down to two points:

| Pitfall | What happens | Remedy |
|---|---|---|
| `TOP` without `ORDER BY` | `TOP` caps the number of rows without any precise order: the server returns `n` arbitrary rows, not "the first" or "the best" ones | always pair it with `ORDER BY` |
| The "n rows affected" message | it announces the number of rows **returned**, not the number of rows that match the condition | run a `COUNT(*)` with the same `WHERE` |

```sql
-- AS nb_books gives the calculated column the name nb_books (see aggregation functions)
SELECT COUNT(*) AS nb_books FROM books WHERE genre = 'novel';  -- how many novels in total
```

```
nb_books
--------
3
```

With `TOP 2` (or `LIMIT 2`) on these novels, the server reports "2 rows" when there are actually 3: without the `COUNT(*)`, we would take 2 for the total. Even with `ORDER BY`, if the sort column contains duplicates at the boundary (for example two books at 15.00 competing for second place with `TOP 2`), the row kept between the two is arbitrary: add a second sort column.

## The semicolon: the end of a statement

A **statement** is a complete SQL command. The semicolon `;` ends it: it never separates two clauses of the same query.

```sql
SELECT title FROM books WHERE genre = 'novel';  -- one statement, one ;
SELECT COUNT(*) FROM books;                     -- a second statement, after it
```

> **Pitfall:** a misplaced `;` cuts the query in two. `SELECT title FROM books; WHERE genre = 'novel';` first runs `SELECT title FROM books;` **without a filter** (all the books are displayed), then fails on `WHERE ...`, which does not form a statement.

| Input | What the engine does (SQLite) |
|---|---|
| `SELECT title FROM books;` | displays the titles of all the books |
| ` WHERE genre = 'novel';` (alone) | error `near "WHERE": syntax error` |
| ` FROM books;` (alone) | error `near "FROM": syntax error` (the exact message varies with the engine) |

On SQL Server, the final `;` is optional for most statements, but some require it (`MERGE`, seen [below](#merge-an-upsert-in-a-single-query-sql-server)): putting it everywhere is the safest rule.

## Column types and consistent values

Each column has a **type**: the kind of value it accepts (mentioned further down in [`CREATE TABLE`](#create-table-creating-a-table-ddl)). A value written in a query must match that type, and how it is written depends on it.

### Writing a value: number, text, date

| Kind of value | How it is written | Example |
|---|---|---|
| Number | as is, with a point for decimals | `24`, `12.5` |
| Text | between single quotes `'...'` | `'novel'` |
| Date | text between single quotes, in the form `'YYYY-MM-DD'` | `'2024-03-15'` |
| Missing value | the word `NULL`, without quotes (see [`NULL`](#null-a-missing-value-not-a-value-like-any-other)) | `NULL` |

A text that itself contains an apostrophe doubles it: `'L''Isle'` stands for the text `L'Isle`. The quotes are mandatory: without them, the engine reads `novel` as the name of a column.

```sql
SELECT title FROM books WHERE genre = novel;  -- forgot the quotes
```

```
Error: no such column: novel
```

> **Pitfall:** comparing a date column with a number. `WHERE published_on = 2024` mixes two types: SQL Server behaves according to the type of the column: a `date` column refuses with the error "Operand type clash" (incompatible types), while a `datetime` column accepts `2024` as a number of days since 1 January 1900, without any error; SQLite, more permissive, says nothing and returns zero rows, which is worse (there is no error to read).
>
> **Best practice:** write each value in the type of its column, and look for a year with a range of dates (`published_on >= '2024-01-01' AND published_on < '2025-01-01'`).

### Converting a value: `CAST`

When the value does not have the right type, it is **converted** (transformed into a value of another type). `CAST(value AS type)` is the standard form, understood by all engines; T-SQL adds `CONVERT(type, value)`.

```sql
-- INT: whole number (see "Numbers" below)
SELECT CAST('42' AS INT) + 1 AS result;  -- the text '42' becomes the number 42
```

```
result
------
43
```

> **Pitfall:** an impossible conversion (`CAST('abc' AS INT)`) does not behave the same everywhere. SQLite returns `0` without saying anything, which makes up false data; SQL Server stops with a conversion error.
>
> **Best practice:** convert explicitly, and prefer an error to silence: an error gets fixed, while an invented `0` ends up in the totals.

### Numbers: `INT`, `numeric` and `decimal`

| Type | Content | Exact? |
|---|---|---|
| `INT` | whole number (`12`, `-3`) | yes |
| `decimal(p, s)` or `numeric(p, s)` | number with decimals: `p` digits in total, `s` of them after the point | yes |
| `float` | "approximate" decimal number | no |

On SQL Server, `numeric` and `decimal` are two names for the same type. `decimal(8, 2)` accepts up to 999999.99 and always keeps two decimals (`12.5` is stored as `12.50`).

The same calculation gives two results depending on the engine. Under **SQLite**, `0.1` and `0.2` are read as `float` values, and a comparison can be written directly in the `SELECT` list:

```sql
-- SQLite
SELECT 0.1 + 0.2 AS total, 0.1 + 0.2 = 0.3 AS equal;  -- 1 = true, 0 = false
```

```
total                equal
-------------------  -----
0.30000000000000004  0
```

Under **SQL Server**, this same `SELECT` does not work: a comparison cannot be written in the `SELECT` list, and the literals `0.1` and `0.2` are read there as exact `numeric` values, so `0.1 + 0.2 = 0.3` would be true there. To observe the default of `float`, you must declare `float` variables ([`DECLARE @a`](#table-variable-practising-without-creating-anything-permanent-t-sql) creates a variable) and test with `CASE WHEN condition THEN a ELSE b END` (returns `a` if the condition is true, `b` otherwise):

```sql
-- SQL Server
DECLARE @a FLOAT = 0.1, @b FLOAT = 0.2;  -- two float variables
SELECT @a + @b AS total,
       CASE WHEN @a + @b = 0.3 THEN 1 ELSE 0 END AS equal;  -- 1 = true, 0 = false
```

```
total  equal
-----  -----
0.3    0
```

(SQL Server output written by hand, not run here: `equal` is indeed `0`, but the tool often displays `total` rounded to `0.3`, although the gap exists.)

A `float` is stored in binary (the two-digit system, 0 and 1, that computers use; see [Floating-point numbers](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)), and `0.1` has no exact binary form (just as a third has none in decimal): the engine keeps a very close value. The gap is tiny (on the order of 0.00000000000000005) but it is enough to make the equality false.

> **Pitfall:** storing a price in an approximate column, then summing it or testing it for equality.
>
> **Best practice:** `decimal(p, s)` for anything counted to the cent (prices, discounts), `float` only for measurements where rounding is acceptable.

### Text: `varchar(n)` versus `char(n)`

| Type | Stored length | Example with `'FR'` |
|---|---|---|
| `varchar(n)` | that of the text, up to `n` characters | `FR` (2 characters) |
| `char(n)` | always `n`: padded with spaces on the right | `FR` followed by 3 spaces if `n` is 5 |

`char(n)` suits codes whose length never varies (a two-letter country code); `varchar(n)` suits names, titles and addresses. A text longer than `n` is refused (SQL Server reports a truncation error: the text would be cut) or cut, depending on the engine.

### Dates: `date` versus `datetime`

| Type | Content | Example |
|---|---|---|
| `date` | the day only | `'2026-10-31'` |
| `datetime` | the day and the time | `'2026-10-31 14:45:00'` |

Two pitfalls, one per type:

- **The format.** `'YYYY-MM-DD'` is read without ambiguity by a `date` column. For a `datetime`, SQL Server may, depending on the language of the **connection** (the session opened between the program that sends the queries and the server; the `SET DATEFORMAT` setting, see the [documentation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-dateformat-transact-sql)), read `'2026-10-11'` as 10 November instead of 11 October; the forms `'YYYYMMDD'` (`'20261011'`) and `'YYYY-MM-DDThh:mm:ss'` are, on the other hand, independent of the language.
- **The hidden time.** Comparing a `datetime` with a bare day amounts to comparing it with midnight: the afternoon rows are missed. So we filter by range, from midnight inclusive to the following midnight exclusive.

```sql
-- orders(id, placed_on): id 1 at 09:30 and id 2 at 14:45 on 2026-10-31; id 3 on 2026-11-01
SELECT id FROM orders WHERE placed_on = '2026-10-31';  -- equal to midnight exactly

SELECT id FROM orders
WHERE placed_on >= '2026-10-31'  -- midnight of the 31st, inclusive
  AND placed_on <  '2026-11-01'; -- midnight of 1 November, exclusive
```

```
(first query)   no rows
(second query)  id = 1 and id = 2
```

(Test done under SQLite, which stores dates in a text column: the reasoning is the same as for a SQL Server `datetime`.)

### Primary key

A **primary key** is the column (or group of columns) that identifies each row uniquely: two rows never have the same value, and it is never `NULL`. A table has only one. Here, `id`: looking up `WHERE id = 2` returns at most one row. It is declared with `PRIMARY KEY` (see [`CREATE TABLE`](#create-table-creating-a-table-ddl)).

| Without a primary key | With a primary key |
|---|---|
| Two identical books are indistinguishable | Each row has its identifier |
| Changing "this" book may change two | `WHERE id = 2` touches only one |
| Another table cannot point to a specific row | A [`FOREIGN KEY`](#create-table-creating-a-table-ddl) points to it |

The full list of SQL Server types is in its [official documentation](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql).

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

Combined with `GROUP BY`, an aggregate function computes one value per group instead of a single global value:

```sql
SELECT city, COUNT(*) AS nb_clients
FROM clients
GROUP BY city;  -- one result row per distinct city
```

### In what order the server processes an aggregate query

A query is written in one order (`SELECT` first), but the server processes it in another. For a query that computes per group, the processing order is this one:

```sql
SELECT genre, COUNT(*) AS nb_books, AVG(price) AS avg_price
FROM books
WHERE published_on >= '2023-01-01'  -- 1. remove the older books
GROUP BY genre                      -- 2. form one group per genre
                                    -- 3. (COUNT and AVG: a calculation inside each group)
ORDER BY nb_books DESC, genre;      -- 4. sort the final result (genre breaks ties)
```

```
table books: 7 rows
      |  WHERE published_on >= '2023-01-01'    keeps 5 rows
      v
5 rows
      |  GROUP BY genre                        forms 3 groups
      v
novel (2 rows)   cooking (2 rows)   science (1 row)
      |  COUNT(*), AVG(price)                  one calculation per group
      v
3 result rows (one per group)
      |  ORDER BY nb_books DESC                sorted last
      v
final result
```

```
genre    nb_books  avg_price
-------  --------  ---------
cooking  2         21.0
novel    2         11.2
science  1         22.0
```

| Step | Clause | What happens |
|---|---|---|
| 1 | `WHERE` | filters the rows **before** any calculation |
| 2 | `GROUP BY` | puts the remaining rows into groups (one value of `genre` = one group) |
| 3 | `COUNT`, `AVG`... | apply **inside each group**, not to the whole table |
| 4 | `ORDER BY` | sorts last: the total `nb_books` only exists after the calculation, which is why it is possible to sort on its name |

A few consequences:

- **A calculation covers the rows kept by `WHERE`**, not the whole table. Believing the opposite is a frequent mistake: here `COUNT(*)` counts only the 5 recent books, not the 7.
- **Without `GROUP BY`, a lone calculation function returns a single row** (one single group: all the rows kept). `SELECT COUNT(*) FROM books WHERE genre = 'novel'` returns `3`.
- **In `COUNT(*)`, the star chooses no column**: it means "count the rows".
- **`GROUP BY` does not sort.** The result above is sorted by the query's `ORDER BY nb_books DESC, genre` (the second criterion breaks the tie between `cooking` and `novel`, both at `nb_books = 2`); without `ORDER BY`, the order of the groups is not guaranteed (they may come out in alphabetical order by implementation chance, but nothing guarantees it). Proof that `GROUP BY` is not a sort: `GROUP BY genre DESC` is refused by SQL Server and SQLite (syntax error), because `DESC` only makes sense in `ORDER BY`.
- **Depending on the engine, the average may display more decimals** than the column holds (for example `21.000000` for prices with two decimals).

> **Pitfall:** badly typed values form separate groups. A `GROUP BY city` on `Lyon`, `Lyon`, `Lyonn` gives two groups: `Lyon` (2) and `Lyonn` (1). The server does not guess that it is the same city.
>
> **Best practice:** look at the distinct values of a column (`SELECT DISTINCT city FROM customers`: `DISTINCT` removes duplicates) before grouping on it, and normalize the entry when writing it.

### `GROUPING SETS`: total and detail in a single query (T-SQL)

Getting both the overall total and the per-city breakdown would normally require two separate queries (one with `GROUP BY`, one without), or a [`UNION`](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/set-operators-union-transact-sql) (which stacks the rows of two queries) of the two. `GROUPING SETS` (SQL Server, among others) computes both in the same pass over the table:

```sql
SELECT city, COUNT(*) AS nb_clients
FROM clients
GROUP BY GROUPING SETS ((city), ());
-- (city) : one row per distinct city, like a plain GROUP BY
-- ()     : one total row, city shown as NULL
```

| Requested set | Result |
|---|---|
| `(city)` | One row per distinct city, same as `GROUP BY city` alone |
| `()` (empty set) | A single row: the total across the whole table, `city` is `NULL` |

> **Pitfall:** on the total row, `city` is `NULL`, but this `NULL` means "this is an aggregated total", not "unknown value" like the `NULL` seen further down ([`NULL`: a missing value](#null-a-missing-value-not-a-value-like-any-other)). Naively filtering `WHERE city IS NOT NULL` would drop the total row by mistake.
>
> **Best practice:** use `GROUPING(city)` to tell the two apart unambiguously: it's `1` on the total row (the column is `NULL` because it's aggregated), `0` otherwise (including when the real `city` value was itself `NULL`).

```sql
SELECT
    city,
    COUNT(*) AS nb_clients,
    GROUPING(city) AS is_total  -- 1 = total row, 0 = detail row
FROM clients
GROUP BY GROUPING SETS ((city), ());
```

Related to `ROLLUP` (a hierarchy of nested totals, e.g. day → month → year) and `CUBE` (every possible combination across several columns), `GROUPING SETS` is the most explicit form of the three: each wanted column combination is spelled out by hand in parentheses.

## `JOIN`: joining two tables on a common column

A declarative way to match two collections using a shared key, instead of writing a loop with a manual search:

```sql
SELECT c.name, v.date_achat
FROM clients c
-- INNER JOIN: rows with no match disappear
JOIN ventes v ON v.client_id = c.id;
```

```sql
SELECT c.name, v.date_achat
FROM clients c
-- keeps ALL the rows of the left table, NULL if no match
LEFT JOIN ventes v ON v.client_id = c.id;
```

- `c` / `v` are table aliases, which are essential whenever two tables share a column name (e.g., `c.name` vs. `v.name`, to avoid ambiguity).
- `JOIN` (or `INNER JOIN`): keeps only the rows that match on both sides.
- `LEFT JOIN`: keeps all rows from the left table, with the right-hand columns set to `NULL` if no match is found: useful when you want to list *everyone*, whether a match was found or not (e.g., all customers, whether they have made a purchase or not).

> **Pitfall:** using `JOIN` (`INNER`) when you actually want *everyone*: a customer with no sales at all would silently disappear from the result, whereas a `LEFT JOIN` would have kept them with `NULL` columns.
>
> **Best practice:** ask yourself explicitly, before writing the join, whether rows without a match should disappear (`JOIN`) or remain visible (`LEFT JOIN`): both produce a syntactically valid result, but with different semantic meanings.

### `OUTER APPLY` / `CROSS APPLY`: a join that can call a function per row (T-SQL)

A regular `JOIN`'s `ON` condition can only reference columns, never call a function or a subquery parameterized by the current row. `APPLY` (SQL Server) lifts this limit: it runs a subquery **for every row** of the left-hand table, passing that row's columns to it as a parameter.

```sql
SELECT c.name, latest.date_achat
FROM clients c
OUTER APPLY (
    SELECT TOP 1 v.date_achat
    FROM ventes v
    -- references c, the current row: impossible in a JOIN's ON
    WHERE v.client_id = c.id
    ORDER BY v.date_achat DESC
) AS latest;
```

| Variant | Behavior if the subquery returns nothing |
|---|---|
| `CROSS APPLY` | The `clients` row disappears from the result (equivalent to `INNER JOIN`) |
| `OUTER APPLY` | The `clients` row is kept, subquery columns set to `NULL` (equivalent to `LEFT JOIN`) |

> **Note:** this same need (referencing the current row from a joined subquery) is called `LATERAL JOIN` on PostgreSQL -- an equivalent concept, different syntax depending on the engine.

## Cross-database queries on the same instance

A connection opened on one database can directly read a table from another database, as long as both sit on the same server/instance and the login has rights on both: just prefix the table name with the database and schema, using the three-segment notation `Database.schema.table`.

```sql
-- connected to gold_db, still reads silver_db with no linked server or separate connection
SELECT *
FROM silver_db.dbo.scores_historique;
```

> **Pitfall:** confusing this case (same instance, just another database) with access to a remote server, which does require a `linked server` or a separate connection: the three-segment notation only works on the same instance.

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
    -- every sale must point to an existing customer
    FOREIGN KEY (client_id) REFERENCES clients(id)
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

## Table variable: practising without creating anything permanent (T-SQL)

A **variable** is a name that refers to a value kept in memory; in T-SQL, its name starts with `@`, and `DECLARE` declares it. A **table variable** is a variable that holds a small table in its entirety: you declare it with its columns, fill it with `INSERT`, and read it with `SELECT`, just like a real table.

```sql
DECLARE @catalog TABLE (            -- declares the table variable @catalog
    id    INT PRIMARY KEY,          -- same column syntax as CREATE TABLE
    title VARCHAR(100),
    price DECIMAL(8, 2)
);

INSERT INTO @catalog (id, title, price)  -- fills the variable, row by row
VALUES (1, 'Nights of Mist', 12.50),
       (2, 'Atlas of the Seas', 39.90),
       (3, 'The Last Lighthouse', 9.90);

SELECT title, price
FROM @catalog                       -- the @ remains mandatory in FROM
WHERE price < 20
ORDER BY price;
```

```
title                price
-------------------  -----
The Last Lighthouse  9.90
Nights of Mist       12.50
```

(Expected output under SQL Server, written by hand: this script is T-SQL, SQLite does not run it. `decimal(8, 2)` keeps two decimals, hence `9.90`.)

This variable exists only for the duration of one execution: at the end of the execution (the **batch**: all the statements sent to the server at once), it disappears along with its rows. It creates **nothing permanent** in the database (no table, nothing to clean up afterwards). Compared with the other ways of storing rows (a **temporary table** is a real table but short-lived, whose name starts with `#` and which the server drops on its own when the connection ends, see the [documentation](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql#temporary-tables); the **connection** is defined [above](#dates-date-versus-datetime)):

| | `CREATE TABLE customers` | temporary table `#t` | table variable `@t` |
|---|---|---|---|
| Declared with | `CREATE TABLE` | `CREATE TABLE #t (...)` | `DECLARE @t TABLE (...)` |
| Lifetime | permanent, until `DROP TABLE` | as long as the connection lives (or until `DROP`) | the current execution |
| Visible to | all authorized accounts | the connection that created it | the execution that declared it |
| Leaves a trace in the database | yes | no | no |
| Typical use | application data | intermediate results, medium volumes | small tests, a few rows |

It is a good training ground: you can practise `SELECT`, `WHERE` and `ORDER BY` on invented data, without any right to write into the database's tables.

> **Pitfall:** selecting and running only the last part of the script (the `SELECT ... FROM @catalog`): the variable was declared in a previous execution, so it no longer exists and the engine replies that `@catalog` is not declared. Writing `FROM catalog` without `@` also fails (the engine looks for a table of that name).
>
> **Best practice:** run the whole script (declaration, `INSERT`, read) at each attempt; to keep data from one execution to the next, switch to a temporary table `#t` or to a [`CREATE TABLE`](#create-table-creating-a-table-ddl); for a large volume of rows, do not use a table variable, which is designed for small volumes.

Details of the syntax: [official documentation](https://learn.microsoft.com/en-us/sql/t-sql/data-types/table-transact-sql).

## `NULL`: a missing value, not a value like any other

`NULL` means "unknown" or "nothing was entered"; it is **not** the same as a sentinel value like `-1` or an empty string, which means "we know there structurally isn't one".

```sql
SELECT AVG(remise) FROM ventes;
-- AVG/SUM/COUNT(column) ignore rows set to NULL: a discount set to NULL does not count as 0
```

> **Pitfall:** storing `-1` instead of `NULL` for "no discount" skews `AVG(remise)`, which would then count `-1` as a real numeric value instead of ignoring it.
>
> **Best practice:** reserve `NULL` for "unknown/not entered"; only use a sentinel value if its business meaning is documented, and never mix the two for the same column.

### Comparing with `NULL`: `IS NULL`, the trap of `<>` and `COUNT`

A test such as `city = 'Lyon'` gives "true" or "false" for a row. With `NULL` (an unknown value), the answer is a third state: **unknown**, neither true nor false. `WHERE` only keeps the rows whose condition is **true**: an unknown condition makes the row disappear, just like a false one.

Table `customers` used below (David has no city recorded):

| id | name | city |
|---|---|---|
| 1 | Alice | Lyon |
| 2 | Bruno | Paris |
| 3 | Chloé | Lyon |
| 4 | David | `NULL` |
| 5 | Emma | Paris |
| 6 | Farid | Marseille |

| Condition | Alice (`Lyon`) | David (`NULL`) | Rows kept |
|---|---|---|---|
| `city = 'Lyon'` | true | unknown | Alice, Chloé |
| `city <> 'Lyon'` | false | unknown | Bruno, Emma, Farid |
| `NOT (city = 'Lyon')` | false | unknown | Bruno, Emma, Farid |
| `city = NULL` | unknown | unknown | none |
| `city IS NULL` | false | true | David |
| `city IS NOT NULL` | true | false | all except David |

Two consequences. First, `= NULL` never returns anything (even `NULL = NULL` is unknown, with SQL Server's default setting, `ANSI_NULLS ON`): you need `IS NULL` or `IS NOT NULL`.

```sql
SELECT name FROM customers WHERE city = NULL;     -- never any rows, and no error
SELECT name FROM customers WHERE city IS NULL;    -- David
```

```
(first query)   no rows
(second query)  David
```

Second, **`<>` also excludes the rows without a value**: "the customers who do not live in Lyon" should include David, who most likely does not live there, but whose city is unknown. The fix explicitly adds the rows with `NULL`:

```sql
SELECT name FROM customers
WHERE city <> 'Lyon'      -- the known cities that differ from Lyon
   OR city IS NULL;       -- plus the customers without a city
```

```
name
-----
Bruno
David
Emma
Farid
```

> **Pitfall:** writing `WHERE city <> 'Lyon'` in the belief of getting "all the others": the rows with `NULL` disappear without any message. The same effect occurs with `NOT (city = 'Lyon')`.
>
> **Best practice:** for any negated condition on a column that can be `NULL`, ask yourself what you want from the rows without a value, then write it (`OR column IS NULL`).

#### `COUNT(*)` versus `COUNT(column)`

| Form | What it counts |
|---|---|
| `COUNT(*)` | the **rows**, whatever their values |
| `COUNT(column)` | the rows where this column has a **value** (not `NULL`) |

```sql
SELECT COUNT(*) AS nb_rows, COUNT(city) AS nb_cities FROM customers;
```

```
nb_rows  nb_cities
-------  ---------
6        5
```

The same logic applies to the other functions: they only work on known values. On a table `movies(id, title, year, rating)`, `rating` being a numeric column (see [Numbers](#numbers-int-numeric-and-decimal)), where two films have no rating yet (`NULL`) and three have `8`, `6` and `10`:

```sql
SELECT COUNT(*) AS nb_rows, COUNT(rating) AS nb_ratings,
       SUM(rating) AS total, AVG(rating) AS average
FROM movies;
```

```
nb_rows  nb_ratings  total  average
-------  ----------  -----  -------
5        3           24     8.0
```

(Output obtained with SQLite. Under SQL Server, if `rating` is a `decimal`, sums and averages are displayed with decimals, `24.0` for example, and the number of decimals varies from one engine to another. If `rating` is an `INT`, `AVG` returns an **integer**: `8` here, but `4` and not `4.8` for the average with zeros below. To keep the decimals, write `AVG(CAST(rating AS decimal(4, 1)))`.)

The average is `24 / 3 = 8` (three known ratings), and not `24 / 5 = 4.8`. The films without a rating do not drag the average down: they are ignored, which is the right behavior as long as `NULL` means "not rated yet". If you first replace `NULL` with `0` ([`ISNULL`/`COALESCE`](#isnull-filling-a-column-only-if-it-s-still-empty)), the average drops to `4.8` (in `decimal` or under SQLite): a `0` is a real rating, not an absence.

### `ISNULL()`: filling a column only if it's still empty

`SET column = value` always overwrites the column, even if it already held valid data. `ISNULL(column, value)` (standard SQL equivalent: `COALESCE(column, value)`) only returns `value` if `column` is currently `NULL`, and the column itself otherwise: a data backfill that never touches a row that's already correctly filled in.

```sql
-- only changes siret for rows where it's still NULL; safe to rerun
UPDATE clients SET siret = ISNULL(siret, '12345678900010') WHERE id = 1;
```

> **Best practice:** this pattern is idempotent (safe to replay any number of times): useful for a backfill script that can be rerun after a partial data load, without ever overwriting a value that's already present.

## Controlling SQL from PHP with PDO

PDO (*[PHP](/?c=langages&s=php&p=php) Data Objects*) is the native interface of [PHP](/?c=langages&s=php&p=php) for talking to a database, regardless of the database engine.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'user', 'password');

$stmt = $pdo->prepare('SELECT * FROM customers WHERE city = :city');
$stmt->execute([':city' => 'Lyon']);

$line    = $stmt->fetch(\PDO::FETCH_ASSOC);     // a single line, associative array
$allRows = $stmt->fetchAll(\PDO::FETCH_ASSOC);  // all lines
?>
```

The process is always the same: `prepare()` (enter the query, using placeholders such as `:city`) → `execute()` (provide the actual values) → `fetch()` / `fetchAll()` (retrieve the result).

> **Note:** `$pdo->query($sql)` is a shortcut with **no** placeholder, usable only if `$sql` is a string that is 100% hard-coded, with no external variables concatenated into it. As soon as a single external value (user, URL, session, etc.) is included in the request, you must use `prepare()` / `execute()`.

## `IN (...)` with a variable-length list in PDO

PDO can only bind individual values, never an entire array as a single placeholder: `IN (:cities)` with `execute([':cities' => ['Lyon', 'Paris']])` doesn't work: PDO would treat the array as a single value (an error, or an incorrect conversion depending on the driver).

```php
<?php
function queryWithIn(PDO $pdo, string $sql, string $prefix, array $values): PDOStatement
{
    // Generates one named placeholder per value: prefix_0, prefix_1...
    $placeholders = [];
    $params = [];
    foreach (array_values($values) as $i => $value) {
        $name = ":{$prefix}_{$i}";
        $placeholders[] = $name;
        $params[$name] = $value;
    }

    // Replaces the {IN} marker in the given SQL with the generated placeholder list
    $finalSql = str_replace('{IN}', implode(', ', $placeholders), $sql);

    $stmt = $pdo->prepare($finalSql);
    $stmt->execute($params);
    return $stmt;
}

$stmt = queryWithIn(
    $pdo,
    'SELECT * FROM clients WHERE city IN ({IN})',
    'city',
    ['Lyon', 'Paris']
);
// Generated SQL: SELECT * FROM clients WHERE city IN (:city_0, :city_1)
```

| Step | Role |
|---|---|
| One named placeholder per value (`:city_0`, `:city_1`...) | Works around PDO's limit (one placeholder = one single value) |
| `implode(', ', $placeholders)` | Builds the `(:city_0, :city_1)` list to insert into `IN (...)` |
| `$params` | Each value is still passed separately to `execute()`, never concatenated into the SQL text |

> **Pitfall:** an empty list (`$values = []`) produces a syntactically invalid `IN ()` on most SQL engines. Check that `$values` isn't empty before calling this function (or short-circuit the whole query: a search over an empty list of cities can't return any results anyway).
>
> **Best practice:** never concatenate the values directly into `IN (...)` (that would be the same [SQL injection](#sql-injection-why-you-should-never-concatenate-an-external-value) flaw as concatenating any other external value); always generate one placeholder per value, regardless of the list's size.

## Controlling SQL from Python with `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) is the [Python](/?c=langages&s=python&p=python) equivalent of PDO for talking to a database via an ODBC driver.

```python
import pyodbc

connection = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=my_server;DATABASE=boutique;UID=user;PWD=password"
)  # opens the connection to the database

cursor = connection.cursor()
# ? = placeholder, value passed separately
cursor.execute("SELECT * FROM clients WHERE city = ?", "Lyon")

one_row  = cursor.fetchone()   # a single row
all_rows = cursor.fetchall()   # every row

# commits the writes (INSERT/UPDATE/DELETE); unnecessary after a plain SELECT
connection.commit()
```

Same cycle as PDO: `connect()` (open the connection) → `cursor()` → `execute()` (with `?` as the placeholder, value passed separately, never concatenated) → `fetchone()`/`fetchall()`. `executemany()` repeats the same query for a list of value sets (bulk insert), faster than looping over `execute()` one at a time.

### Integrated Windows authentication: a failure message can hide two different causes

With `Trusted_Connection=yes` in the connection string, no login or password is supplied: Windows negotiates the identity behind the scenes (Kerberos if a domain controller is reachable, otherwise falling back to NTLM), and the SQL server receives an already-authenticated identity.

```python
connection = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=my_server;DATABASE=boutique;Trusted_Connection=yes"
)
```

> **Pitfall:** a `Login failed for user 'DOMAIN\user'` message does NOT necessarily mean Kerberos/NTLM failed. The Windows identity may well have been negotiated successfully (authentication), but the SQL server then found no login mapped to that account on THIS specific instance (authorization): two distinct causes, the exact same error message.
>
> **Best practice:** before chasing a network/Kerberos issue, check that a login actually exists for that Windows account on the target instance (e.g. by confirming that the same account, from the same machine, connects fine to another instance).

## `sqlcmd`: running a SQL script from the command line, with variables (SQL Server)

`sqlcmd` runs a `.sql` file directly from the command line, without going through a host language. The `-v` option defines a **script variable**, substituted into the SQL text before execution via `$(NAME)`:

```bash
sqlcmd -S my_server -v DBNAME=staging_db -i script.sql
```

```sql
-- script.sql
USE [$(DBNAME)];

IF '$(DBNAME)' = '' OR '$(DBNAME)' = '$' + '(DBNAME)'
    RAISERROR('The DBNAME variable must be supplied via -v', 16, 1);
```

The guard's second test (`'$' + '(DBNAME)'`) catches the case where `$(DBNAME)` wasn't even substituted and appears as-is in the executed text (script run without `-v`, or with a misspelled variable name). `:setvar NAME value` does the same thing directly inside the script, rather than on the command line.

> **Best practice:** parameterize the same `.sql` script for several environments (staging/production) via `-v`, rather than duplicating it or generating it dynamically from a host language.

## SQL Injection: Why You Should Never Concatenate an External Value

```php
<?php
// NEVER:
$sql = "SELECT * FROM customers WHERE city = '" . $_GET['city'] . "'";
?>
```

If `$_GET['city']` contained `Lyon' OR '1'='1`, the query would become a condition that is always true, returning all rows in the table. Conceptually equivalent to a [buffer overflow](/?c=langages&s=c&p=memoire) in [C](/?c=langages&s=c&p=c): an unchecked input that alters the **structure** of the command, rather than remaining mere data.

Named placeholders (`:city`) prevent this at the structural level: the value passed to `execute()` is **always** treated as raw data by the driver, never reinterpreted as SQL, whatever it contains.

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
-- No DROP, DELETE, or access to other tables or databases, unless the application ever needs
-- them
```

In practice, a compromised application account (due to a code vulnerability, a credential leak, etc.) can only cause damage commensurate with its own permissions: an account limited to `SELECT` / `INSERT` / `UPDATE` on a single table does not allow an attacker to delete an entire database, even if they manage to execute arbitrary queries. This is a **complementary** safeguard to prepared statements, not a substitute: it limits the damage *if* an injection does occur (undetected bug, poorly constructed dynamic query, etc.), rather than preventing the injection itself.

## `MERGE`: an UPSERT in a single query (SQL Server)

A `SELECT` followed by a conditional `UPDATE`/`INSERT` to sync a target table from a source requires two queries and a decision in code (or T-SQL) between them. `MERGE` does both in one atomic statement: it compares a source (`USING`) to the target on a key (`ON`), and runs `WHEN MATCHED THEN UPDATE` or `WHEN NOT MATCHED THEN INSERT` depending on the case.

```sql
MERGE clients AS target
USING (SELECT 1 AS client_id, 'Dupont' AS name, 'Marseille' AS city) AS source
ON target.id = source.client_id
WHEN MATCHED THEN
    UPDATE SET target.name = source.name, target.city = source.city
WHEN NOT MATCHED THEN
    INSERT (id, name, city) VALUES (source.client_id, source.name, source.city);
```

> **Best practice:** generate the `MERGE` text from a simple `(column, type)` list in code rather than hand-writing each `UPDATE SET`/`INSERT`: adding a column to the schema then only needs an entry in that list, never touching the SQL template.

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

- [PDO Documentation (php.net)](https://www.php.net/manual/en/book.pdo.php)
- [`pyodbc` Documentation (official repository)](https://github.com/mkleehammer/pyodbc/wiki)
- [W3Schools SQL (in English, a good syntax reference)](https://www.w3schools.com/sql/)

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Each column has a type (`INT`, `decimal`, `varchar`, `date`) and a primary key identifies each row. SQL queries (DML) and defines the structure (DDL) of tables (fixed columns, rows = records). `JOIN` joins two tables based on a common column; `INNER JOIN` removes rows with no matches, `LEFT JOIN` keeps them; `APPLY` combines a join with a function/subquery call parameterized by row. `GROUP BY`/`GROUPING SETS` summarize by group, with or without an overall total in the same query. `NULL` = unknown value, never to be confused with a sentinel value. `MERGE` does in one query what a `SELECT` then `UPDATE`/`INSERT` would do in two. A query is read clause by clause (`SELECT` the columns, `FROM` the table, `WHERE` the rows), and the server processes it in the order `WHERE`, `GROUP BY`, calculation, `ORDER BY`. A table has no guaranteed order: only `ORDER BY` sets one. With `NULL`, a comparison is "unknown" and `WHERE` only keeps the "true" ones. |
| **Tools available** | `SELECT` / `WHERE`, aggregate functions (`COUNT` / `SUM` / `AVG`), `GROUP BY`/`GROUPING SETS`/`GROUPING()`, `JOIN` / `LEFT JOIN`/`OUTER APPLY`/`CROSS APPLY`, three-segment notation for a cross-database query on the same instance, `MERGE` for an UPSERT, `ISNULL()`/`COALESCE()` for an idempotent backfill, `CREATE TABLE` / `ALTER TABLE`, indexes, prepared queries via PDO ([PHP](/?c=langages&s=php&p=php), including a variable-length `IN (...)` via generated placeholders) or `pyodbc` ([Python](/?c=langages&s=python&p=python)), `sqlcmd` for a parameterized command-line script, SCD2 for historizing changes, `ORDER BY`, `TOP n`, `CAST`, `IS NULL`, table variable `DECLARE @t TABLE` for practising without creating anything permanent. |
| **Pitfalls to Avoid** | Concatenating an external value directly into an SQL query (SQL injection), including inside an `IN (...)`; using `INNER JOIN` when you want to keep rows with no match; reordering columns via `ALTER TABLE` (impossible, the table must be recreated); confusing `NULL` with a sentinel value, including the total-row `NULL` from `GROUPING SETS`; reading a login failure on an integrated Windows connection as necessarily a Kerberos/NTLM failure, when authentication may have succeeded with no login existing on the instance; `TOP n` without `ORDER BY`; a `;` placed between two clauses; comparing different types (number against date); `<>` or `= NULL` on a column that contains `NULL`s; believing a calculation covers the whole table when it covers the rows kept by `WHERE`. |
| **Best Practices** | Always use a prepared query (`prepare`/`execute`) for an external value, including one placeholder per value inside an `IN (...)`; limit the application account's permissions to only what is strictly necessary (principle of least privilege); a technical key (`IDENTITY`) rather than a wide natural key for indexing; `GROUPING()` to tell a total row apart from a real `NULL` value; `ISNULL(column, value)` rather than a plain `UPDATE` for a safely rerunnable backfill; `ORDER BY` for any result whose order matters; parentheses around an `OR` combined with an `AND`; `decimal(p, s)` for money; `IS NULL` rather than `= NULL`, and `COUNT(*)` to know the total number of rows. |
