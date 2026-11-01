---
order: 13
---

# Read a database with SSMS (31/10/2026)

A **database** is an organized set of data, stored in **tables** (grids of rows and columns, like a spreadsheet). A **database server** is a program that keeps these tables and answers requests from other programs; **Microsoft SQL Server** (see its [official documentation](https://learn.microsoft.com/en-us/sql/sql-server/)) is one of them. You talk to it in [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), a language designed to describe which data you want to read or change. A request written in SQL is called a **query**.

**SSMS** (*SQL Server Management Studio*) is Microsoft's graphical software for connecting to a SQL Server, browsing its databases with the mouse, writing queries and reading their results. It runs on Windows only. On macOS or Linux, Microsoft offers the [MSSQL extension for Visual Studio Code](https://learn.microsoft.com/en-us/sql/tools/visual-studio-code/mssql-extensions), whose interface differs from the one described here. This chapter is for someone who is discovering an existing database: it shows how to connect to it, browse it, ask a question without breaking anything, and check that your account cannot break anything either.

The names of menus, buttons and windows come from Microsoft's official documentation; they are given in English, in italics. The interface in other languages may use other words, and the interface changes from one version to another, so a label may differ on your machine: then search the same word in the [SSMS documentation](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms). Installing the software is not covered here (see the [download page](https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms)).

| Question | Section |
|---|---|
| How do I connect, and what do the options mean? | [Connect to a server](#connect-to-a-server) |
| Where are the tables and their columns? | [Object Explorer](#object-explorer-browse-without-writing) |
| How do I write and run a query? | [Open a query window](#open-a-query-window) and [Execute](#execute-the-whole-file-or-only-the-selection) |
| What does "2 rows affected" mean? | [Read the result](#read-the-result) |
| How can I be sure I change nothing? | [Permissions: read-only comes from the account](#permissions-read-only-comes-from-the-account-not-from-care) |
| Which mistakes do beginners make? | [Beginner mistakes](#beginner-mistakes) |

## What you need before you start

A SQL Server contains several nested levels. SSMS shows them in this order, from the broadest to the most precise:

```
  Your computer (SSMS)  ---- network ---->  The server (the machine)
                                                 |
                                                 +-- an instance of SQL Server
                                                      |  (one copy of the program)
                                                      +-- database "bookshop_demo"
                                                      |     |
                                                      |     +-- schema "dbo"
                                                      |           +-- table "customers"
                                                      |           +-- table "books"
                                                      +-- database "other_base"
                                                            +-- ...
```

An **instance** is a copy of the SQL Server program running on a machine; one machine can host several, each with its own databases. A **schema** is a kind of folder of names that groups the tables of a database and prevents two tables with the same name from being mixed up, and `dbo` is the default schema: see [schemas and technical tables](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques). The same database can also exist in several copies on different servers (for example one for testing and one for the real work); this is the first source of confusion, covered below.

Before opening SSMS, you need four pieces of information from the person who administers the server:

| Information | Generic example | What it is for |
|---|---|---|
| The server name (and the instance name, if there is one) | `SERVER_NAME` or `SERVER_NAME\INSTANCE_A` | Telling SSMS where to connect |
| The authentication mode to use | Windows account or SQL login (an account specific to SQL Server, see [authentication](#windows-authentication-or-sql-server-authentication)) | Proving who you are |
| The name of the database to browse | `bookshop_demo` | Knowing which database to write your queries in |
| Your account's rights on this database | Read only, or read and write | Knowing what you are allowed to do |

The examples in this chapter use an invented bookshop: a database `bookshop_demo` with two tables, `customers` and `books`. These names are fictional; replace them with your own.

## The SSMS window at a glance

Once connected, the window is made of a few areas. The diagram below is simplified: the exact layout depends on the version and the settings. The query in it reads customers: `SELECT` lists the wanted columns, `FROM` names the table read (`dbo.customers`: schema `dbo`, table `customers`), `WHERE` keeps only the rows that match the condition (a text is written between single quotes, `'Lyon'`), and the semicolon `;` ends the statement. These words are detailed in the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) chapter.

```
+----------------------------------------------------------------------------------+
| File  Edit  View  Query  Tools  Window  Help                           (1) menus |
+----------------------------------------------------------------------------------+
| [New Query] [Execute] [ bookshop_demo v ]                            (2) toolbar |
+-----------------------+----------------------------------------------------------+
| OBJECT EXPLORER       | SQLQuery1.sql                                            |
|                       | 1 | SELECT id, name, city                                |
| (3)                   | 2 | FROM dbo.customers                                   |
|                       | 3 | WHERE city = 'Lyon';                                 |
| SERVER_NAME           |                                         (4) query editor |
|  + Databases          +----------------------------------------------------------+
|    + bookshop_demo    | Results | Messages        (5) results pane               |
|      + Tables         |  id | name   | city                                      |
|        dbo.customers  |   1 | Martin | Lyon                                      |
|        dbo.books      |   3 | Petit  | Lyon                                      |
+-----------------------+----------------------------------------------------------+
| Ready          SERVER_NAME | my_login | bookshop_demo | 00:00:00 | 2 rows        |
+----------------------------------------------------------------------------------+
                                                                      (6) status bar
```

| Area | Name | Role |
|---|---|---|
| 1 | Menu bar | All the commands, including the `Query` menu |
| 2 | Toolbar | `New Query`, `Execute`, list of the available databases |
| 3 | Object Explorer | The tree of the server's databases, tables and columns |
| 4 | Query editor | The SQL text you write |
| 5 | Results pane | Two tabs: `Results` (the rows returned) and `Messages` (number of rows, errors) |
| 6 | Status bar | Server, account and database the tab is connected to, duration, number of rows |

Area 6 is the most useful for a beginner: it constantly shows **on which server, with which account and on which database** the query will run (according to the documentation, this information appears in the status bar and in the tab title).

## Connect to a server

When SSMS starts, it opens the **Connect to Server** window. You can reopen it at any time with the `Connect` button in Object Explorer.

### The fields of the connection window

| Field | What to enter | Note |
|---|---|---|
| Server type | `Database Engine` | The default value is fine: it is the server program that holds the tables |
| Server name | The name received from the administrator | See the next table for the possible forms |
| Authentication | Windows, or SQL Server | See below |
| Login, Password | The SQL account, if SQL Server authentication is chosen | Greyed out with Windows authentication |
| `Options >>` | Encryption, certificate trust, starting database | See below |

### Write the server name

| Form | Meaning | Example |
|---|---|---|
| `SERVER_NAME` | The default instance of this machine | `SRV-DATA` |
| `SERVER_NAME\INSTANCE_NAME` | A **named** instance of this machine | `SRV-DATA\INSTANCE_A` |
| `SERVER_NAME,PORT` | A precise address: the **port** (the number of the network "door" on which the server listens) is written after a comma | `SRV-DATA,1433` |
| `localhost`, `.` or `(local)` | The machine on which SSMS runs | `localhost\INSTANCE_A` |

The backslash `\` separates the machine from the instance, and the comma separates the port from the name: confusing them is a frequent cause of connection failure.

### Windows authentication or SQL Server authentication

**Authentication** is the proof of your identity. SQL Server offers two main kinds (other modes exist, such as [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) authentication for Microsoft's online services, out of scope here):

| | *Windows Authentication* | *SQL Server Authentication* |
|---|---|---|
| Who checks the identity | Windows: the server receives the identity of your session | The SQL server itself |
| What you type | Nothing: the account and password are those of your Windows session | A login name and a password specific to SQL Server |
| Where the password lives | In the directory of the organization's Windows accounts | In the SQL server |
| Advantage | No extra password to manage or type | Usable from a machine outside the **domain** (the company network, whose accounts are managed by a **directory**: a central list of an organization's accounts, here [Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)) |
| Pitfall | The account **also** has to be declared in the server, otherwise `Login failed` | Never use the `sa` account (administrator of the whole server) to read data |

A **login** is an account declared at the level of the server; succeeding in authenticating is therefore not enough, the server must know the account. This pitfall (the identity is valid, but no login matches it on THIS instance) is detailed in the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) chapter, in the section on integrated Windows authentication.

The *Remember password* checkbox keeps the password on your machine. On a shared computer, do not tick it.

### Encryption and trusting the certificate

Between SSMS and the server, exchanges can be **encrypted** (made unreadable for someone listening on the network). For this encryption to really help, SSMS must also make sure that it is talking to the right server, and not to an impostor. The server proves its identity with a **certificate**: a digital document signed by an authority that the computer knows (see [the TLS certificate](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#the-self-signed-tls-certificate) for the principle).

According to the SQL Server documentation, the connection window offers, depending on the version, an encryption setting (`Encrypt connection`, with three values described below) and a *Trust server certificate* checkbox, sometimes behind the `Options >>` button.

| Value of *Encrypt connection* | What happens |
|---|---|
| *Optional* | Encrypts only if the server requires it; otherwise the exchanges stay readable on the network |
| *Mandatory* | Always encrypts; the certificate is checked unless the checkbox below is ticked |
| *Strict* | Always encrypts, with a strict check of the certificate |

For a database consulted remotely, choose *Mandatory* or *Strict* (the *Strict* value exists only in recent versions).

| Setting | What happens |
|---|---|
| *Trust server certificate* unticked | When the connection is encrypted, SSMS checks the certificate: signed by a known authority, not expired, in the name of the requested server. An invalid certificate makes the connection **fail** |
| Box ticked | SSMS **no longer checks** the certificate and accepts whatever certificate the server presents |

What this checkbox disables is therefore the **check of the server's identity**, not the encryption: when the connection is encrypted, the data stays encrypted, but SSMS can no longer tell whether its counterpart is the real server. On a network where someone stands between you and the server (an attack called a **man-in-the-middle**), that person could pose as the server and read what you send, the password included.

| Situation | What to do |
|---|---|
| Production server or remote server | Do not tick it. Ask the administrator for a certificate signed by a recognized authority, or for the installation of your organization's certificate on your computer |
| Instance installed on your own machine to practice (free *Developer* or *Express* edition, to [download here](https://www.microsoft.com/en-us/sql-server/sql-server-downloads); see also [the local environment with SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) | Ticking it is acceptable: nobody stands between your machine and itself |
| A certificate error appears and you do not know why | Do not tick it "to make it work": note the message and pass it on to the administrator |

Documentation: [configure encrypted connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-sql-server-encryption).

### Choose the starting database

In `Options >>`, a tab of connection properties (*Connection Properties*) offers a *Connect to database* field. If it is empty, the connection opens on a default database of the account (often the system database `master`, which contains none of your data). If it is filled in, the query window opens directly on the right database. If the account has no access to this database, the connection fails with a message such as `Cannot open database "..." requested by the login`.

### When the connection fails

| Message (English, from Microsoft's documentation and forums) | Likely cause | Next step |
|---|---|---|
| `A network-related or instance-specific error occurred while establishing a connection to SQL Server` | Wrong server or instance name, service stopped (the SQL Server program, which runs in the background under Windows, is not started), **firewall** (a program that filters the allowed network connections) | Check the spelling and the separator (`\` or `,`), then ask the administrator |
| `The certificate chain was issued by an authority that is not trusted` | The server's certificate is not recognized by your computer | See [the section on the certificate](#encryption-and-trusting-the-certificate), do not tick the box out of habit |
| `Login failed for user '...'` | Wrong password, **or** account unknown to this instance | See the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) chapter: two causes for the same message |
| `Cannot open database "..." requested by the login` | The account has no access to the database named in `Connect to database` | Empty this field, or ask for access |

## Object Explorer: browse without writing

**Object Explorer** (*Object Explorer*) is a tree (simplified below: the real one shows other branches, such as constraints or triggers) whose branches you expand with the small `+` (or the arrow). Nothing is changed by expanding them: you only read the **catalog**, the list that the server keeps of its own objects.

```
SERVER_NAME (SQL Server, account: my_login)
 |
 +-- Databases
 |    +-- System Databases    <- do not touch
 |    +-- bookshop_demo
 |         +-- Tables
 |         |    +-- dbo.customers
 |         |    |    +-- Columns
 |         |    |    |    +-- id (PK, int, Not Null)
 |         |    |    |    +-- name (varchar(50), Not Null)
 |         |    |    |    +-- city (varchar(50), Null)
 |         |    |    |    +-- discount (decimal(5,2), Null)
 |         |    |    +-- Keys
 |         |    |    +-- Indexes
 |         |    +-- dbo.books
 |         +-- Views
 |         +-- Security
 +-- Security
```

### What each branch contains

| Branch | Content |
|---|---|
| Databases | The databases of the server; depending on the rights of the account, a database may be missing from the list or impossible to open |
| System Databases | The databases that belong to the server: `master` (server catalog), `tempdb` (temporary work space), `model` (template of new databases), `msdb` (scheduled tasks); never the place for an exercise ([documentation](https://learn.microsoft.com/en-us/sql/relational-databases/databases/system-databases)) |
| Tables | The tables, prefixed by their schema (`dbo.customers`) |
| Columns | For each column: name, type, required or not |
| Keys | The primary key and the foreign keys (links to other tables) |
| Indexes | The structures that speed up searches: see [indexes](/?c=donnees&s=bases-de-donnees&p=les-index) |
| Views | Saved queries that you read like tables |
| Security | The accounts and roles; under a database, those of this database (see [Permissions](#permissions-read-only-comes-from-the-account-not-from-care)) |

### Read a column line

Under `Columns`, each entry follows the pattern `name (key, type, accepts NULL or not)`. Three notions to remember:

| Notion | Definition | Example read in the tree |
|---|---|---|
| **Type** | The nature of the value that the column accepts: `int` a whole number, `varchar(50)` text of 50 characters at most, `decimal(5,2)` a decimal number of 5 digits, 2 of them after the decimal point, `date` a day of the calendar | `city (varchar(50), Null)` |
| **Primary key** (*primary key*, abbreviated `PK`) | The column (or group of columns) whose value identifies **each row in a unique way**: never duplicated, never empty. It is what lets you designate "customer number 3" without ambiguity. It is created with `PRIMARY KEY` (see [`CREATE TABLE`](/?c=langages&s=domain-specific-languages-dsl&p=sql#create-table-creating-a-table-ddl)) | `id (PK, int, Not Null)` |
| **`NULL`** | The absence of a value: "unknown" or "not filled in", which is different from zero and from the empty text. A column marked `Null` (or *allows nulls*) may have no value in some rows; `Not Null` requires a value | `discount (decimal(5,2), Null)` |

These three indications answer a beginner's questions before even writing a query: which column identifies a row, what kind of value goes in it, and whether an empty box is normal. See [`NULL`](/?c=langages&s=domain-specific-languages-dsl&p=sql#null-a-missing-value-not-a-value-like-any-other) for its effects on calculations and comparisons.

### Read the structure without taking risks

Right-clicking a table opens a context menu (the menu that opens on right-click). Several entries in it are harmless, others change the database:

| Menu entry (English) | Effect | Safe? |
|---|---|---|
| `Select Top 1000 Rows` | Writes and runs a query that reads 1000 rows at most | Yes: a read |
| `Script Table as` > `CREATE To` > `New Query Editor Window` | Writes, in a new tab, the code that would create the table, **without running it** | Yes: the structure is read as SQL |
| `Properties` | Shows the characteristics of the table | Yes |
| `Edit Top 200 Rows` | Opens the first 200 rows in an **editable** grid | **No**: see [beginner mistakes](#beginner-mistakes) |
| `Design` | Opens the editor of the table structure | **No**: you can change columns there |
| `Delete`, `Rename` | Deletes or renames the table | **No** |

The structure can also be read with a query. `INFORMATION_SCHEMA.COLUMNS` is a description view provided by the server (see the [documentation](https://learn.microsoft.com/en-us/sql/relational-databases/system-information-schema-views/columns-transact-sql)): each row describes one column of the current database.

```sql
-- SELECT chooses the columns to display; AS only renames the heading of a column
SELECT COLUMN_NAME AS column_name,     -- the name of the column
       DATA_TYPE AS type,          -- its type (int, varchar, date...)
       CHARACTER_MAXIMUM_LENGTH AS length,  -- the maximum length of a text (otherwise NULL)
       IS_NULLABLE AS accepts_null -- YES if the column accepts NULL, NO otherwise
-- FROM names the table read: the view that describes the columns
FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE keeps only the rows that match the condition: here, the columns of customers
-- AND requires both conditions to be true at the same time
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'customers'
-- ORDER BY sorts the result; ORDINAL_POSITION is the rank of the column in the table
ORDER BY ORDINAL_POSITION;
```

Expected result for the table of the example (illustrative values):

| column_name | type | length | accepts_null |
|---|---|---|---|
| id | int | NULL | NO |
| name | varchar | 50 | NO |
| city | varchar | 50 | YES |
| discount | decimal | NULL | YES |

## Open a query window

A **query window** is an editor tab in which you write SQL. Three ways to open one:

| Action | Particularity |
|---|---|
| `New Query` button (*New Query*) on the toolbar | The query is linked to the server selected in Object Explorer, on the starting database of the connection or on that of the selected node |
| `Ctrl + N` shortcut | Same effect as the button |
| Right-click **a database** in Object Explorer, then `New Query` | The query is linked **to this database**: the safest way to start on the right one |

### The current database

Each tab is linked to **one** database at a time: the **current database**. A query that writes `FROM dbo.customers` looks for the table in this database only. Three ways to choose or change it:

| Method | How | Note |
|---|---|---|
| Drop-down list on the toolbar | Choose the database from the list of available databases (*Available Databases*) | Always visible: you see at a glance where you are |
| `USE` statement | `USE bookshop_demo;` changes the current database of the tab | Handy in a script (a file of several SQL statements), but a `USE` copied from another script can move you to another database without you noticing |
| Three-part name | `bookshop_demo.dbo.customers` | Names the table without changing the database (see [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)) |

To check, without relying on the drop-down list, ask the server:

```sql
-- SELECT without FROM: the server computes values and returns them in a single row
SELECT
    -- DB_NAME() returns the name of the current database of this tab
    DB_NAME()    AS current_database,
    -- SUSER_NAME() returns the name of the account with which you are connected
    SUSER_NAME() AS connected_account,
    -- @@SERVERNAME returns the name of the server (and instance) you are connected to
    @@SERVERNAME AS server;
```

Possible result (illustrative values):

| current_database | connected_account | server |
|---|---|---|
| bookshop_demo | my_login | SERVER_NAME |

This query, rewritten on one line (`SELECT DB_NAME(), SUSER_NAME();`), runs **before any other**: it replaces an uncertainty with an answer from the server. Documentation: [`DB_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/db-name-transact-sql), [`SUSER_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/suser-name-transact-sql), [`@@SERVERNAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/servername-transact-sql).

> **Note:** according to the SSMS documentation, the connection window also lets you give a server a **color** (connection properties, *Use custom color*): the status bar of the tabs connected to that server can then take this color. A red color for the production server and a green one for the test server make the confusion visible.

### The `GO` word

A script copied from a colleague often contains lines with `GO` alone. `GO` is not SQL: it is a separator understood by SSMS, which cuts the text into **batches** sent to the server one after the other. Since the batches are independent, a [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (a value stored under a name) created in one no longer exists in the next; a `USE`, on the other hand, stays valid for the following batches of the same tab.

## Execute: the whole file or only the selection

Writing a query does not run it. To send it to the server, use the `Execute` button, the `F5` shortcut (or `Ctrl + E`). The decisive point:

| State of the editor | What is sent to the server |
|---|---|
| **No text selected** | **All** the content of the tab, from the first line to the last |
| **Text selected** (highlighted) | **Only** the highlighted text; the rest is ignored |

A tab can therefore contain several queries, and the selection chooses which one is sent. Example of a tab with three statements:

```sql
-- statement 1: check where we are (read)
SELECT DB_NAME() AS current_database;
-- statement 2: read the customers in Lyon (read)
SELECT id, name, city FROM dbo.customers WHERE city = 'Lyon';
-- statement 3: DELETE removes rows; here, all the customers in Paris (write!)
DELETE FROM dbo.customers WHERE city = 'Paris';
```

```
  F5 with nothing selected:            F5 with line 2 selected:

  1  SELECT DB_NAME() ...    <- sent   1  SELECT DB_NAME() ...
  2  SELECT id, name ...     <- sent   2 [SELECT id, name ...]    <- only this one
  3  DELETE FROM ...         <- sent   3  DELETE FROM ...
```

This behavior is useful (testing one query at a time) and dangerous (see [the "forgotten selection" mistake](#2-executing-a-forgotten-selection)). The toolbar also offers `Parse` (menu `Query` > `Parse`, or `Ctrl + F5`), which checks the **syntax** (the SQL spelling) without running anything, and a `Cancel Executing Query` button that stops a query that runs too long.

## Read the result

After `F5`, the lower pane shows two tabs: `Results` and `Messages`. Read both.

### The Results tab

The `Results` tab (*Results*) shows by default a **grid** (*grid*): one row of the result per row of the grid, one column per chosen column. Result of query 2 above on five test customers (illustration):

| id | name | city |
|---|---|---|
| 1 | Martin | Lyon |
| 3 | Petit | Lyon |

In the grid, a missing value is shown by the word `NULL`: it is not text, it is the absence of a value. The `Query` > `Results To` menu (*Results To*) lets you choose an output as a grid, as plain text or as a file. A right-click in the grid lets you copy the rows, with or without the column headings.

### The Messages tab and "n rows affected"

The `Messages` tab reports what the server says about the execution. After a successful query, it shows a line of the form:

```text
(2 rows affected)
```

In a French interface, the same line reads `(2 lignes affectées)`. The number means what the statement **touched**, and it is read differently depending on the statement:

| Statement | What "n rows affected" refers to |
|---|---|
| `SELECT` | The number of rows **returned** by this query |
| `INSERT` (adds rows) | The number of rows **added** |
| `UPDATE` | The number of rows **modified** |
| `DELETE` | The number of rows **deleted** |

Two practical consequences:

| Observation | Interpretation |
|---|---|
| `(0 rows affected)` after a `DELETE` or an `UPDATE` | No row matched the `WHERE` condition: nothing changed, which is information, not a failure |
| `(1500 rows affected)` after a `DELETE` that was meant to touch 3 rows | The condition was too broad: the alert comes **after** the fact, hence the interest of planning ahead (see [deleting without `WHERE`](#3-deleting-without-where)) |

> **Pitfall:** the message does **not** give the total of the rows that match the question. With `SELECT TOP 10 * FROM dbo.customers;` (`*` means all the columns, and `TOP 10` limits the result to 10 rows, a word specific to the SQL of SQL Server, the [*T-SQL*](https://learn.microsoft.com/en-us/sql/t-sql/language-reference)), the message says `(10 rows affected)` even if the table contains 40,000. To know the total, ask for `SELECT COUNT(*) FROM dbo.customers;`, where `COUNT(*)` counts the rows.

Without `ORDER BY`, SQL Server guarantees no order: the 10 rows of a `TOP 10` are arbitrary and may differ from one execution to the next. For a reproducible result, sort: `SELECT TOP 10 * FROM dbo.customers ORDER BY id;` always returns the 10 smallest `id` values.

The status bar (at the bottom of the window) repeats the number of rows and the duration of the query. A duration that keeps growing for a simple `SELECT` signals a large table: interrupt it with `Cancel Executing Query` and start again with `TOP` rather than waiting.

### When an error appears

An error appears in the `Messages` tab, in red text, in the form `Msg number, Level n, State n, Line n` followed by a sentence (`Level`: severity of the error; `State`: internal marker of the server; `Line`: line at fault). A double-click on the message places the cursor on the faulty line. Two messages concern a beginner directly:

| Message (English) | Meaning | Frequent cause |
|---|---|---|
| `Msg 208 ... Invalid object name 'dbo.customers'` | The requested table does not exist **in the current database** | You are on the **wrong database**, or the schema or the name is misspelled |
| `Msg 229 ... The SELECT permission was denied on the object 'customers'` | The account is not allowed to read this table | The rights are missing: see the next section |

## Permissions: read-only comes from the account, not from care

Telling yourself "I am only reading" protects against nothing: a typo, a badly made selection or a copied script is enough to write by mistake. The only reliable protection is that the account used **has no right to write**. This idea is the **principle of least privilege**, explained in the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) chapter: an account receives only the rights it needs.

### Two levels of rights

```
   Server (instance)
   +-- Login "my_login"            <- the account, known to the server
   |     |
   |     +-- Database "bookshop_demo"
   |     |     +-- User "my_login"    <- the same account, declared in THIS database
   |     |     |     +-- role db_datareader   <- reading of all the tables
   |     |     +-- Table dbo.customers
   |     |
   |     +-- Database "other_base"
   |           +-- (no user)        <- the account has no rights here
```

An account can **connect** to the server and yet be unable to do anything in a given database: rights are granted **database by database**. The **login** opens access to the server; the **database user** is the same account declared in a specific database, and it is that user which receives the rights on this database. A **role** is a group of rights that you assign all at once:

| Database role (English) | What it allows | For a simple read |
|---|---|---|
| `db_datareader` | Reading (`SELECT`) all the tables of the database | Sufficient, and this is the role to ask for |
| `db_datawriter` | Adding, modifying and deleting rows in all the tables | Avoid it for exploring |
| `db_owner` | All the rights on the database, including deleting tables | Never for exploring |
| `db_denydatawriter` | **Forbids** writing (a refusal overrides the other rights) | An explicit barrier, useful in addition to reading |

At the server level, an account that belongs to the `sysadmin` role (the `sa` account is one) has all the rights on all the databases: with it, **no** database is protected. See the [list of server-level roles](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/server-level-roles) and the [list of database-level roles](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/database-level-roles). The chapter [the local environment with SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) shows, on the contrary, an account that receives `db_owner` on a single database: it is a development choice, not the one of a person who only reads.

### Check your rights from a query

We ask the server about the connected account, with the current database of the tab (hence the importance of checking it first). None of these queries modifies anything.

```sql
-- sys.databases lists the databases; HAS_DBACCESS(name) is 1 if the account can open one
-- ORDER BY name sorts the result by database name
SELECT name FROM sys.databases WHERE HAS_DBACCESS(name) = 1 ORDER BY name;

-- sys.fn_my_permissions(NULL, 'DATABASE') lists the account's rights on the current database
SELECT permission_name FROM sys.fn_my_permissions(NULL, 'DATABASE');

-- HAS_PERMS_BY_NAME returns 1 if the right is granted on the object, 0 otherwise
-- can_read: SELECT right on the table; can_add: INSERT (adding rows)
-- can_modify: UPDATE (changing rows); can_delete: DELETE (removing them)
SELECT HAS_PERMS_BY_NAME('dbo.customers', 'OBJECT', 'SELECT') AS can_read,
       HAS_PERMS_BY_NAME('dbo.customers', 'OBJECT', 'INSERT') AS can_add,
       HAS_PERMS_BY_NAME('dbo.customers', 'OBJECT', 'UPDATE') AS can_modify,
       HAS_PERMS_BY_NAME('dbo.customers', 'OBJECT', 'DELETE') AS can_delete;

-- IS_MEMBER returns 1 if the account belongs to the role of the current database, 0 otherwise
SELECT IS_MEMBER('db_datareader') AS reader, IS_MEMBER('db_owner') AS owner;
```

Possible result for a read-only account (illustrative values):

| can_read | can_add | can_modify | can_delete |
|---|---|---|---|
| 1 | 0 | 0 | 0 |

The reference documentation: [`sys.databases`](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql), [`HAS_DBACCESS`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-dbaccess-transact-sql), [`IS_MEMBER`](https://learn.microsoft.com/en-us/sql/t-sql/functions/is-member-transact-sql), [`HAS_PERMS_BY_NAME`](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-perms-by-name-transact-sql) and [`sys.fn_my_permissions`](https://learn.microsoft.com/en-us/sql/relational-databases/system-functions/sys-fn-my-permissions-transact-sql).

### The procedure

| Step | Action |
|---|---|
| 1 | Ask the administrator for an account reserved for consultation (`db_datareader` role on the wanted database, and no other role) |
| 2 | Connect with this account to explore, and with another account only for the time of a modification decided in advance |
| 3 | As soon as you connect, run the verification queries above: current database, rights |
| 4 | If `can_add`, `can_modify` or `can_delete` is `1` while you only want to read, report it: the account has too many rights |
| 5 | Repeat the check **for each database** you browse, because rights are not inherited from one database to another |

> **Note:** being read-only protects the data against modification, not against **disclosure**: what you read may be confidential (customers' contact details, for example). Do not copy real results outside the tools intended for that.

## Beginner mistakes

### 1. Query run on the wrong database

**Scenario.** Object Explorer contains a test database and a working database, with tables of the same names. A tab opened on the wrong database runs `SELECT * FROM dbo.customers;`: the result is returned correctly, but it comes from elsewhere. Worse with a write: the `DELETE` goes to the working database.

| Symptom | Cause | Remedy |
|---|---|---|
| Unexpected rows, or `Msg 208 Invalid object name` | The current database is not the one you think | Check the status bar, then run `SELECT DB_NAME();` |
| No error, but the result does not look as expected | The table exists in both databases, with other data | Open the query by right-clicking the wanted database |
| A script runs `USE` statements that change the database midway | The script does not start from the state you assumed | Read the `USE` statements of a script before running it |

### 2. Executing a forgotten selection

**Scenario.** You test a query by highlighting it, then move on without clicking elsewhere. Later you write a new query below and press `F5`: only the old highlighted text is sent. Conversely, you think you are running a single line and, the selection having disappeared, **the whole tab** runs, write statements included.

| Symptom | Cause | Remedy |
|---|---|---|
| The new query produces "nothing" or runs the old one again | An old selection is still active | Click in the text to deselect, then re-read what is going to be sent |
| A write runs when you meant to run a read | No selection: the whole tab is sent | Keep the writes in a separate tab, or comment them out |
| The result does not match the query shown | The highlighted text is not the one you are looking at | Ask yourself before each `F5`: "do I have a selection?" |

### 3. Deleting without `WHERE`

`DELETE FROM dbo.customers;` **without** a condition deletes **all** the rows. `UPDATE dbo.customers SET city = 'Lyon';` (`UPDATE` modifies rows, `SET` gives the new value) changes the city of **all** the customers. The `WHERE` condition is what restricts the action to the wanted rows.

By default, each statement is **committed** (made permanent) as soon as it runs: there is no "Undo" button. `Ctrl + Z` undoes a keystroke in the editor, not an effect on the database. The remedy comes down to four steps, to run **one at a time** by selecting the text before `F5` (see [execution by selection](#execute-the-whole-file-or-only-the-selection)):

```sql
-- 1. first a SELECT with EXACTLY the same condition: we see the rows concerned
SELECT id, name, city FROM dbo.customers WHERE city = 'Lyon';
-- 2. COUNT(*) gives their number; it must be the one you expect (here, 2)
SELECT COUNT(*) AS to_delete FROM dbo.customers WHERE city = 'Lyon';
-- 3. BEGIN TRANSACTION opens a transaction: a group of statements that can be undone
-- select these two lines (BEGIN and DELETE), then F5; the transaction stays open
BEGIN TRANSACTION;
-- the DELETE runs, but is not yet final
DELETE FROM dbo.customers WHERE city = 'Lyon';
-- then read the Messages tab: it must show (2 rows affected), otherwise do not commit
-- 4. select ONE of the two following lines, then F5
-- ROLLBACK TRANSACTION undoes everything that happened since BEGIN TRANSACTION
ROLLBACK TRANSACTION;
-- instead of the ROLLBACK, COMMIT TRANSACTION would make the deletion permanent
-- COMMIT TRANSACTION;
```

Between two `F5` presses, the transaction stays open in the tab: this leaves time to read the message. Running this whole block without a selection would chain the `DELETE` and then the `ROLLBACK` without a pause (the `COMMIT` being commented out), and would remove all control.

For a table of 5 customers of whom 2 are in Lyon, the `SELECT COUNT(*)` gives 2, the `DELETE` announces 2 rows, and after the `ROLLBACK` a new `SELECT COUNT(*) FROM dbo.customers;` gives 5 again. Without `WHERE`, the same `DELETE` announces 5 rows: the difference jumps out **before** choosing between `COMMIT` and `ROLLBACK`.

| Point | What to know |
|---|---|
| A transaction left open and forgotten | It can **block** the other users of the table as long as it is neither committed nor rolled back. Always end with `COMMIT` or `ROLLBACK` |
| Closing the tab with an open transaction | According to the documentation, SSMS asks whether to commit or to roll back |
| A backup of the database | A last resort, but it amounts to restoring the whole database: see [restoring a `.bak` file](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#restoring-a-bak-backup-locally) |
| A read-only account | Makes the deletion **impossible**: the real remedy, which depends on no reflex |

Documentation: [transactions in T-SQL](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql).

### 4. Editing a row in the edit grid

The `Edit Top 200 Rows` entry opens the rows in a grid that looks like the results grid, but is **editable**: according to the documentation, changing a cell and then leaving the row saves the change in the database. For a beginner who only wants to look, the right entry is `Select Top 1000 Rows`.

## An end-to-end walkthrough

| Step | Action | Check |
|---|---|---|
| 1 | Obtain the server name, the authentication mode, the database name and the rights | A consultation account, not `sa` |
| 2 | Connect; tick the certificate trust only on your own machine | The connection opens |
| 3 | Expand Object Explorer: database, `Tables`, a table, `Columns` | Types, primary key, `Null` columns spotted |
| 4 | Right-click the wanted database, then `New Query` | Status bar: right server, right database |
| 5 | Run `SELECT DB_NAME(), SUSER_NAME();` | The two expected values |
| 6 | Check your rights (`HAS_PERMS_BY_NAME` or `sys.fn_my_permissions`) | `can_add`, `can_modify` and `can_delete` are `0` |
| 7 | Write the read with `TOP` (for example `SELECT TOP 10 * FROM dbo.books;`) | Re-read before `F5`, check that no selection remains |
| 8 | Read `Results` **and** `Messages` | The number of rows is consistent |
| 9 | Write a modification only with an account set up for it, after a `SELECT`, in a transaction | `COUNT(*)` and message identical before `COMMIT` |

## Going further

| Topic | Where |
|---|---|
| SQL syntax, aggregates, joins, `NULL`, least privilege | [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) |
| Schemas, `dbo`, technical tables | [Schemas and technical tables](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) |
| Restore a `.bak` backup in SSMS, create a dedicated account | [Local environment with SQL Server](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) |
| What the indexes shown in the tree are for | [Indexes](/?c=donnees&s=bases-de-donnees&p=les-index) |
| The TLS certificate and what it guarantees | [Applied cryptography](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) |
| All of SSMS, version by version | [Official SSMS documentation](https://learn.microsoft.com/en-us/ssms/sql-server-management-studio-ssms) |

## Pitfalls

| Pitfall | Consequence | Remedy |
|---|---|---|
| Ticking the certificate trust by reflex | The connection no longer checks the identity of the server: exposure to a man-in-the-middle | Do it only on your own machine, otherwise fix the certificate |
| Using `sa` or a `sysadmin` account to read | No safety net: an accidental write goes through | A `db_datareader` account on the single wanted database |
| Running a query without checking the current database | A result from another database, or a write on the wrong one | Status bar, right-click on the database, `SELECT DB_NAME();` |
| `F5` with an old selection still active | Only the old query is sent | Click in the text before re-reading |
| `F5` without selection in a tab that contains writes | The whole tab runs | Separate reads and writes into separate tabs |
| `DELETE` or `UPDATE` without `WHERE` | All the rows are touched, with no automatic way back | An identical `SELECT` first, then a transaction |
| Reading "10 rows affected" as the total of the table | A wrong conclusion after a `TOP` | `SELECT COUNT(*)` to know the total |
| `Edit Top 200 Rows` to "look" | A modified cell is saved | `Select Top 1000 Rows` |
| Leaving a transaction open | The other users of the table are blocked | `COMMIT` or `ROLLBACK` at the end of each attempt |
| Believing that a database with correct rights is correct in the others | Rights are set database by database | Check each database consulted |

## Best practices

| Best practice | Why |
|---|---|
| Ask for a dedicated consultation account (`db_datareader`) | Read-only is imposed by the server, not by vigilance |
| Check your rights after each new connection | You know what you can do before doing it |
| Open each tab by right-clicking the wanted database | The current database is the right one from the start |
| Run `SELECT DB_NAME(), SUSER_NAME();` first | The server confirms where you are and who you are |
| Color the production connections in the connection window | The confusion becomes visible |
| Read with `TOP`, count with `COUNT(*)` | A large table does not block the computer, and the total stays known |
| Separate the read tabs from the write tabs | An `F5` without selection never writes |
| Write the `SELECT` of a modification first, then the transaction | You see the rows targeted before touching them |
| Read `Messages` after each execution | The number of affected rows reveals a `WHERE` that is too broad |
| Do not tick the certificate trust outside your own machine | The identity of the server stays verified |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | **SSMS** is Microsoft's graphical client for SQL Server (Windows only). You connect with a server name (`SERVER\INSTANCE`, or `SERVER,PORT`) and an authentication: **Windows** (the session, with no password to type, but the account must exist in the server) or **SQL Server** (a login and a password specific to the server). The certificate trust checkbox disables the **check of the server's identity**, not the encryption: reserve it for your own machine. **Object Explorer** shows databases, schemas, tables, columns with their type, the **primary key** (`PK`, unique identifier of each row) and whether the column accepts `NULL`. A query tab is linked to **one current database** that the status bar and `SELECT DB_NAME();` confirm. `F5` runs **the whole tab** without a selection, **only the selection** otherwise. The `Results` tab shows the rows, the `Messages` tab gives "n rows affected": the number of rows returned, added, modified or deleted, never the total of a table after a `TOP`. Read-only is guaranteed by the **rights of the account** (`db_datareader` role, checked with `HAS_PERMS_BY_NAME`), database by database, according to the [least privilege](/?c=langages&s=domain-specific-languages-dsl&p=sql). |
| **Pitfalls to avoid** | Ticking the certificate trust by reflex; using `sa` or a `sysadmin` account to read; not checking the current database; `F5` with a forgotten selection, or without selection in a tab that contains writes; `DELETE` or `UPDATE` without `WHERE`; taking the message of a `TOP` for the total; `Edit Top 200 Rows` to look; leaving a transaction open; assuming that the rights of one database hold for the others. |
| **Best practices** | A dedicated consultation account; `SELECT DB_NAME(), SUSER_NAME();` then a check of the rights at each connection; a tab opened by right-clicking the right database; production connections colored; `TOP` to read and `COUNT(*)` to count; read tabs separated from write tabs; an identical `SELECT` before any modification, in a transaction that can be undone; a systematic reading of the `Messages` tab. |
