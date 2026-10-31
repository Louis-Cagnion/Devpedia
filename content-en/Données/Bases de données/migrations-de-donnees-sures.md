---
order: 12
---

# Safe data migrations

A **database** is software that stores information in **tables** (like spreadsheets: one **row** per item, one **column** per characteristic). When an application evolves, it is often necessary to change rows that already exist: fix how a status is written, fill in a new column, delete old accounts. This operation is called a **data migration**. It is riskier than a code change: faulty code can be fixed by restoring the previous version, whereas destroyed or wrongly rewritten rows do not come back on their own. This chapter presents four protections: the versioned migration, the simulation, bulk SQL, and the safeguard before deletion.

Migrations that change the **structure** of tables (adding a column, a table) are presented in the section "Migrations: versioning the schema like code" of the chapter on [the ORM](/?c=donnees&s=bases-de-donnees&p=orm); here, we deal with the **data**. The life cycle of an entity (what gets triggered around saving an object) is the subject of another chapter.

The examples use [SQLite](https://www.sqlite.org/docs.html), a database contained in a single file, with no server to install, and [PHP](/?c=langages&s=php&p=syntaxe) to drive the database. Commands are typed in a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). The query language is [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

## The versioned migration

A **versioned migration** is a file that describes **a single change**, numbered to fix the order, and that is no longer modified once applied. A **tracking table** records which migrations have already been run, so that the same one is never run twice. Here are three files from a `migrations/` folder. Each line of SQL that starts with `--` is a comment.

First file, `migrations/0001_creer_clients.sql`:

```sql
-- Creates the customers table (one row per customer)
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,      -- unique row number
    email TEXT NOT NULL,         -- email address of the customer
    status TEXT NOT NULL         -- state of the account, typed by hand at the start
);
-- Starting data, with statuses written in different ways
INSERT INTO customers (email, status) VALUES
    ('ana@example.org', 'Actif'),
    ('bob@example.org', 'actif '),
    ('chloe@example.org', 'ACTIF'),
    ('dan@example.org', 'inactif'),
    ('eva@example.org', 'Inactif');
```

Second file, `migrations/0002_normaliser_statuts.sql`: an `UPDATE` (an SQL command that modifies existing rows), which relies on the table created by the first one.

```sql
-- Standardizes the status: lowercase, with no spaces around
UPDATE customers SET status = lower(trim(status));
```

Third file, `migrations/0003_ajouter_derniere_connexion.sql`:

```sql
-- Adds a column for the date of the last login
ALTER TABLE customers ADD COLUMN last_login TEXT;
-- Fills the column for the rows already present
UPDATE customers SET last_login = '2020-01-01' WHERE status = 'inactif';
UPDATE customers SET last_login = '2026-10-01' WHERE status = 'actif';
```

| Rule | Why |
|---|---|
| One file per change | A failure is located right away; the file can be read in full |
| A number at the start of the name (`0001`, `0002`) | The order of running is the same on every machine and server |
| Never modified after being applied | Databases already migrated would not run the file again: the environments would diverge |
| A table that records the migrations run | Running the program again runs nothing; a new file is spotted automatically |
| A fingerprint per file | A later change is detected instead of being ignored |

A **fingerprint** (*hash*) is a short string of characters computed from the text of the file; if a single letter changes, the fingerprint changes (see [hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) for the principle). The following program, `migrate.php`, applies all the migrations not yet run. It wraps them in a **transaction**, a group of operations that either succeeds entirely or is entirely cancelled (`beginTransaction`, `commit` to validate, `rollBack` to cancel). `PDO` is PHP's interface for talking to a database (see [Driving SQL from PHP with PDO](/?c=langages&s=domain-specific-languages-dsl&p=sql)); the SQL function `total_changes()` of SQLite returns the number of rows changed since the connection was opened, which is used to count the effect of each file.

```php
<?php
// Usage: php migrate.php [--dry-run]
$simulation = in_array('--dry-run', $argv, true);   // true if the option is given
$pdo = new PDO('sqlite:app.db');                    // opens (or creates) the database
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // error = exception

// Table that records the migrations already applied, with the fingerprint of the file
$pdo->exec('CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, applied_on TEXT NOT NULL)');

// Reads the migrations already applied: name => fingerprint
$jouees = $pdo->query('SELECT name, fingerprint FROM migrations')
    ->fetchAll(PDO::FETCH_KEY_PAIR);

$fichiers = glob(__DIR__ . '/migrations/*.sql');    // lists the files
sort($fichiers);                                    // number order: 0001, 0002...

/** Counts all the rows changed since the connection was opened. */
function lignesModifiees(PDO $pdo): int
{
    return (int) $pdo->query('SELECT total_changes()')->fetchColumn();
}

$pdo->beginTransaction();       // opens the transaction: all or nothing
try {
    foreach ($fichiers as $fichier) {
        $nom = basename($fichier);
        $sql = file_get_contents($fichier);
        $empreinte = hash('sha256', $sql);
        if (isset($jouees[$nom])) {
            if ($jouees[$nom] !== $empreinte) {     // file modified after the fact
                throw new RuntimeException("$nom was modified after being applied");
            }
            continue;                               // already applied: skip it
        }
        $avant = lignesModifiees($pdo);
        $pdo->exec($sql);                           // runs the migration
        $touchees = lignesModifiees($pdo) - $avant; // rows it changed
        $pdo->prepare('INSERT INTO migrations VALUES (?, ?, datetime())')
            ->execute([$nom, $empreinte]);          // records it as applied
        echo "$nom: $touchees row(s)\n";
    }
    if ($simulation) {
        $pdo->rollBack();                           // simulation: cancel everything
        echo "Simulation finished: nothing was saved.\n";
    } else {
        $pdo->commit();                             // real run: commit everything
    }
} catch (Throwable $erreur) {
    $pdo->rollBack();                               // on any failure: roll back
    fwrite(STDERR, 'Failed: ' . $erreur->getMessage() . "\n");
    exit(1);
}
```

The first run is described in the next section. After a real run, running the command again prints nothing, because the three names are in the `migrations` table. If a line is added to `0002_normaliser_statuts.sql` afterwards, the command fails:

```text
Failed: 0002_normaliser_statuts.sql was modified after being applied
```

A fix to a mistake goes through a **new** file (`0004_...`), never by rewriting `0002`. Data migrations of this kind should also be **idempotent** if possible: running them again by mistake changes nothing more. The `lower(trim(...))` above is (lowercasing what is already in lowercase changes nothing); an `UPDATE ... SET price = price * 2` is not.

For a job that must resume after an interruption, see also [the checkpoint](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

## The simulation mode (*dry run*)

The **simulation mode** (*dry run*, a trial run that changes nothing) runs the migration for real, counts what it would have changed, then **cancels everything**. It answers the question "what would happen if I ran it?" before the answer becomes irreversible.

Here, it is enough not to commit the transaction: the `--dry-run` option of `migrate.php` calls `rollBack` at the end instead of `commit`. All the pending migrations run in the same transaction, so that the second one sees the tables of the first.

```text
$ php migrate.php --dry-run
0001_creer_clients.sql: 5 row(s)
0002_normaliser_statuts.sql: 5 row(s)
0003_ajouter_derniere_connexion.sql: 5 row(s)
Simulation finished: nothing was saved.
$ php migrate.php
0001_creer_clients.sql: 5 row(s)
0002_normaliser_statuts.sql: 5 row(s)
0003_ajouter_derniere_connexion.sql: 5 row(s)
```

| Way to simulate | Principle | Limit |
|---|---|---|
| Cancelled transaction (this example) | Everything runs, then `rollBack` | Works if the database also cancels structure changes, which SQLite does; other engines automatically commit certain structure commands |
| Count beforehand (`SELECT COUNT(*)` with the same condition) | Reads the target volume without writing anything | Does not prove that the modifying query will succeed |
| Copy of the database | Migrates a copy, not the original | Takes time and space on a large database |
| Test environment | Migrates a pre-production database | Its data rarely looks like production data |

One detail: the displayed number counts the rows the query **selected**, not those whose value really changed. Here `0002` announces 5 rows while only 3 change value: two were already in lowercase. To know what really changes, add `WHERE status <> lower(trim(status))` to the condition.

## Bulk SQL or record by record

To change 20,000 rows, two approaches exist. **One by one**: the program reads each row, computes the new value, then sends one query per row. **Bulk**: a single SQL query describes the change and the database engine loops by itself. The following program measures both, plus two variants.

```php
<?php
$fichier = __DIR__ . '/bench.db';
@unlink($fichier);                                   // starts from an empty database
$pdo = new PDO("sqlite:$fichier");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/** Recreates 20,000 customers with badly written statuses. */
function preparer(PDO $pdo): void
{
    $pdo->exec('DROP TABLE IF EXISTS customers');
    $pdo->exec('CREATE TABLE customers (id INTEGER PRIMARY KEY, status TEXT)');
    $pdo->beginTransaction();                        // a single transaction: fast
    $insertion = $pdo->prepare('INSERT INTO customers (status) VALUES (?)');
    for ($i = 0; $i < 20000; $i++) {
        $insertion->execute([$i % 2 ? 'Actif ' : 'ACTIF']);
    }
    $pdo->commit();
}

/** Measures how long an action takes, in seconds. */
function mesurer(string $titre, callable $action): void
{
    $debut = microtime(true);                        // time before the action
    $action();
    printf("%-34s %6.2f s\n", $titre, microtime(true) - $debut);
}

// 1. One by one, each UPDATE is its own transaction (default value)
preparer($pdo);
mesurer('one by one, no transaction', function () use ($pdo) {
    $maj = $pdo->prepare('UPDATE customers SET status = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, status FROM customers')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['status'])), $c['id']]);
    }
});

// 2. One by one, but all the writes in a single transaction
preparer($pdo);
mesurer('one by one, one transaction', function () use ($pdo) {
    $pdo->beginTransaction();
    $maj = $pdo->prepare('UPDATE customers SET status = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, status FROM customers')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['status'])), $c['id']]);
    }
    $pdo->commit();
});

// 3. Bulk: a single query, the engine loops by itself
preparer($pdo);
mesurer('one bulk query', function () use ($pdo) {
    $pdo->exec('UPDATE customers SET status = lower(trim(status))');
});

// 4. Bulk in slices: one query and one transaction per slice
preparer($pdo);
mesurer('bulk, slices of 5,000', function () use ($pdo) {
    $maj = $pdo->prepare(
        'UPDATE customers SET status = lower(trim(status)) WHERE id > ? AND id <= ?'
    );
    for ($debut = 0; $debut < 20000; $debut += 5000) {
        $maj->execute([$debut, $debut + 5000]);      // one slice of ids
    }
});
```

On the test machine, the result is:

```text
one by one, no transaction          48.91 s
one by one, one transaction          0.02 s
one bulk query                       0.01 s
bulk, slices of 5,000                0.01 s
```

Durations depend on the machine and the disk; only the order of magnitude matters. Without an explicit transaction, each `UPDATE` commits and forces the write to disk, 20,000 times; that is what costs time, not the computation.

| Criterion | One by one | Bulk (one query) | Bulk in slices |
|---|---|---|---|
| Cost | One round trip with the database per row (see [cutting round trips](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)) | A single round trip | A few round trips |
| Lock | Short, but repeated on every row | Long: the table (or the rows) stays locked for the others for the whole query | Short per slice; the others get through between two slices |
| Memory | All the rows read into program memory if they are loaded at once | Almost none on the program side | Low and bounded |
| Transaction | One per row (default): a failure leaves the table half migrated | A single one: all or nothing | One per slice: a failure leaves the slices already committed |
| Suitable case | Computation impossible in SQL (call to a service, complex rule) | Change expressible in SQL, moderate volume | Very large volume, database in use during the migration |

A **lock** is a reservation that the database places on rows or a table while it modifies them: the other queries that touch them wait. A very long bulk query can therefore freeze the site; the slices of the last test (`WHERE id > ? AND id <= ?`) hand control back between each slice. A migration by slices must remain **resumable**: if it stops at slice 3, running it again must not redo slices 1 and 2, hence the value of the idempotence seen above.

## The safeguard before deletion

Deleting is the operation that cannot be undone: a `DELETE` whose condition is too broad (or empty) erases everything. A **safeguard** is a check that blocks the operation when something is wrong. Four steps, in this order:

| Step | Question asked | Example in the program |
|---|---|---|
| Count | How many rows does the condition target? | `SELECT COUNT(*)` with the same condition as the `DELETE` |
| Limit | Is this volume plausible? | Refusal above `MAXIMUM` (100) rows per run |
| Confirm | Does the human expect this number? | The number passed as an argument must equal the counted number, then `--confirm` |
| Back up | Can we go back? | `VACUUM INTO` (an SQLite command that writes a complete copy of the database to a new file) before the deletion |

The program `purge.php` deletes the inactive customers who have not logged in since before 2021. Without `--confirm`, it stays in simulation; with it, it backs up, deletes in a transaction, and checks that the number of rows deleted is the one that had been counted.

```php
<?php
// Usage: php purge.php <expected count> [--confirm]
$attendu = (int) ($argv[1] ?? -1);                  // number of rows to delete
$confirme = in_array('--confirm', $argv, true);     // without this option: simulation
const MAXIMUM = 100;                                // ceiling: never more per run
$pdo = new PDO('sqlite:' . __DIR__ . '/app.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$filtre = "status = 'inactif' AND last_login < '2021-01-01'";

// 1. Count: how many rows does the condition target?
$nombre = (int) $pdo->query("SELECT COUNT(*) FROM customers WHERE $filtre")->fetchColumn();
echo "$nombre row(s) targeted\n";

// 2. Limit: refuse an abnormal volume
if ($nombre > MAXIMUM) {
    exit("Refused: more than " . MAXIMUM . " rows.\n");
}
// 3. Confirm: the number announced by the human must equal the number counted
if ($nombre !== $attendu) {
    exit("Refused: $attendu expected, $nombre found.\n");
}
if (!$confirme) {
    exit("Simulation: add --confirm to delete.\n");
}

// 4. Back up: complete copy of the database before any deletion
$copie = __DIR__ . '/backup-' . date('Ymd-His') . '.db';
$pdo->exec("VACUUM INTO '$copie'");
echo "Backup: $copie\n";

// 5. Delete in a transaction, checking the result
$pdo->beginTransaction();
$supprimees = $pdo->exec("DELETE FROM customers WHERE $filtre");
if ($supprimees !== $nombre) {
    $pdo->rollBack();                               // mismatch: cancel everything
    exit("Cancelled: $supprimees deleted instead of $nombre.\n");
}
$pdo->commit();
echo "$supprimees row(s) deleted.\n";
```

Four calls on the chapter's database (the backup name carries the date and time):

```text
$ php purge.php 5
2 row(s) targeted
Refused: 5 expected, 2 found.
$ php purge.php 2
2 row(s) targeted
Simulation: add --confirm to delete.
$ php purge.php 2 --confirm
2 row(s) targeted
Backup: /path/backup-20261031-111248.db
2 row(s) deleted.
$ php purge.php 2 --confirm
0 row(s) targeted
Refused: 2 expected, 0 found.
```

The last line shows a benefit: running the same command again by mistake deletes nothing more, because the count drops to 0 and no longer matches what was expected. For a very large table, a full backup may be too heavy: one then copies only the targeted rows into an archive table (`INSERT INTO archive SELECT ... WHERE <same condition>`) before the `DELETE`.

## Pitfalls

| Pitfall | Consequence | Remedy |
|---|---|---|
| Modifying a migration file already applied | Databases already migrated do not run it again: the environments diverge silently | Write a new migration; check the fingerprint |
| Migrating directly to production without a simulation | The surprise (volume, wrong condition) arrives when it is too late | Simulate, count, then apply |
| `UPDATE` or `DELETE` without `WHERE` | Every row of the table is touched | Count beforehand; refuse an empty condition |
| One `UPDATE` per row outside a transaction | Very slow, and a stop leaves the table half migrated | A bulk query, or one transaction per slice |
| A single huge query on a heavily used table | Long lock: the site freezes | Work in slices |
| Non-idempotent migration re-run by mistake | The values are changed twice | Write the condition so that it only touches what remains to be done |
| Deleting without a backup | No way back possible | Copy the database or archive the rows beforehand |
| Confusing "selected rows" and "changed rows" in a report | A report that seems wrong | Filter on the rows that really differ |

## Best practices

| Practice | Detail |
|---|---|
| One numbered file per change | Never modified after being applied; a mistake is fixed by a following file |
| Record each migration that was run | Tracking table with name and fingerprint, like `migrations` above |
| Simulate before applying | Cancelled transaction, or a copy of the database, and reading the counts |
| Prefer bulk SQL | Slices for very large volumes; row by row only if SQL is not enough |
| Everything in a transaction | A failure leaves the database in the state it was in before |
| Safeguard before deletion | Count, limit, confirm with the expected number, back up |
| Write idempotent migrations | An accidental re-run changes nothing |

## Key Takeaways

| Notion | What to remember |
|---|---|
| Versioned migration | One numbered file per change, never modified after being applied, a table that records the migrations run |
| Simulation (*dry run*) | Run, count, cancel: the answer arrives before the irreversible |
| Bulk or one by one | An SQL query is much faster; slices limit locks and risk; one by one remains for computations outside SQL |
| Transaction | All or nothing: a failure does not leave half of the rows migrated |
| Deletion safeguard | Count, limit, confirm the number, back up; then check the number deleted |
