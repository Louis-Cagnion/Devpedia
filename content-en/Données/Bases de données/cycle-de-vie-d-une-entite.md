---
order: 11
---

# Entity lifecycle, code-defined schema and computed field

An **entity** is an object in the program that represents a durable row of data: a book, a customer, an order. It is created, saved, modified, and eventually deleted. The code that manages these entities (often an [ORM](/?c=donnees&s=bases-de-donnees&p=orm), which maps objects to table rows, something this chapter does not repeat) calls methods at each stage of their life that the project can complete: these are the **lifecycle** stages. This chapter explains what you can do at each stage, what you must never do there, then two related ideas: describing the data schema in a class rather than in an SQL file, and never storing a value that you know how to recompute.

The examples are in generic [PHP](/?c=langages&s=php&p=poo) and [JavaScript](/?c=langages&s=javascript&p=poo). Some frameworks (Drupal for example) work this way, but nothing here depends on it.

## The four steps

A lifecycle step is a **callback method**: the ORM code calls it by itself, at the right moment, without the project having to ask. Four steps cover almost every need:

| Step | Moment | What you can do there | What you must not do there |
|---|---|---|---|
| `preSave` | just before the write | clean up or complete a value, compute a date, reject an invalid value (by throwing an exception) | send a message or call another service: the write has not happened yet and may still fail |
| `postSave` | just after the write | log, clear a cache, notify another system | save the same entity again (loop), call the network before the end of the transaction |
| `preDelete` | just before the deletion | refuse the deletion (exception) if the entity is still in use | permanently modify other data: the deletion can be cancelled |
| `postDelete` | just after the deletion | delete the data that depended on the entity, clear a cache | read the entity as if it still existed in the database |

The flow of a save followed by a delete:

```text
save(entity)                              delete(entity)
    |                                          |
    v                                          v
 preSave   -- exception? everything stops   preDelete -- exception? everything stops
    |                                          |
    v                                          v
 database write                             database delete
    |                                          |
    v                                          v
 postSave                                   postDelete
```

The following code is a minimal repository that calls these four steps, so you can see the real order. It can be run with Node.js (the tool that runs JavaScript outside a browser):

```javascript
// A minimal repository that calls the four lifecycle steps
class Repository {
  constructor() {
    this.rows = new Map(); // the "table": identifier -> values
    this.trace = []; // the order of events, to display it
  }

  save(entity) {
    entity.preSave(this); // 1. before the write
    this.rows.set(entity.id, { ...entity.values }); // 2. write
    this.trace.push(`written ${entity.id}`); // 3. note the write
    entity.postSave(this); // 4. after the write
  }

  delete(entity) {
    entity.preDelete(this); // 1. before the deletion
    this.rows.delete(entity.id); // 2. deletion
    this.trace.push(`deleted ${entity.id}`); // 3. note the deletion
    entity.postDelete(this); // 4. after the deletion
  }
}

class Article {
  constructor(id, title) {
    this.id = id; // identifier of the row
    this.values = { title }; // stored values
  }

  preSave(repository) {
    this.values.title = this.values.title.trim(); // clean up a value
    repository.trace.push("preSave: title cleaned");
  }

  postSave(repository) {
    repository.trace.push("postSave: log written"); // local side effect
  }

  preDelete(repository) {
    repository.trace.push("preDelete: check"); // refuse here if needed
  }

  postDelete(repository) {
    repository.trace.push("postDelete: cache cleared"); // clean up what depends on it
  }
}

const repository = new Repository();
const article = new Article(1, "  Hello  ");
repository.save(article);
repository.delete(article);
console.log(repository.trace.join("\n"));
console.log(JSON.stringify([...repository.rows]));
```

Actual result:

```text
preSave: title cleaned
written 1
postSave: log written
preDelete: check
deleted 1
postDelete: cache cleared
[]
```

The last line (`[]`) shows that the "table" is empty after the deletion.

> **Subtlety:** a deletion or update made by a direct SQL query that touches many rows at once generally does not go through these steps: the ORM does not see the rows one by one. A rule coded in `preDelete` therefore only protects deletions made through the entity.

## Side effects

A **side effect** is anything a piece of code changes outside its direct result: writing to a file, sending an email, modifying another entity, calling another server. Lifecycle steps are the natural place to trigger them, but two pitfalls come up again and again.

### Pitfall 1: the save loop

If `postSave` saves the same entity again, that save triggers a new `postSave`, which saves again, and so on: an **infinite loop** (the program runs forever, or crashes by running out of memory). The following code places a deliberate safety guard (beyond 5 passes, it throws an error) to observe the problem without blocking the machine:

```javascript
// Save loop: postSave saves the same entity again
let calls = 0; // counts the passes through postSave
const rows = new Map(); // the "table"

function save(entity) {
  rows.set(entity.id, { ...entity.values }); // write
  entity.postSave(); // step after the write
}

const bad = {
  id: 1,
  values: { views: 0 },
  postSave() {
    calls += 1; // one more pass
    if (calls > 5) throw new Error("loop: more than 5 passes");
    this.values.views += 1; // modification of the entity
    save(this); // saves again: postSave will be called again
  },
};

try {
  save(bad);
} catch (error) {
  console.log("Bad:", error.message);
}

// Fix: write the derived value directly, without going through save
calls = 0;
const good = {
  id: 2,
  values: { views: 0 },
  postSave() {
    calls += 1;
    const row = rows.get(this.id); // the row already written
    row.views += 1; // direct update, no event triggered
  },
};
save(good);
console.log("Good: passes =", calls, "row =", JSON.stringify(rows.get(2)));
```

Actual result:

```text
Bad: loop: more than 5 passes
Good: passes = 1 row = {"views":1}
```

| Remedy | Principle | Limit |
|---|---|---|
| Compute in `preSave` | the modified value goes out with the current write: a single write | does not exist yet: the identifier of a new entity is unknown |
| Write without going through the event | a direct query on the single column concerned | also bypasses the other lifecycle rules |
| "Already processed" flag | a property that cuts the recursion on the second pass | easy to forget to reset, which then blocks the real records that follow |
| Move the effect elsewhere | a deferred process (scheduled task, queue) | more code, and a delay before the effect |

### Pitfall 2: the network call inside a transaction

A **transaction** is a set of writes that are committed together or cancelled together: if one fails, none remains. An entity save often happens inside a transaction, and `postSave` runs before that transaction is finished. A **network call** (email, request to another server, see [API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) started at this moment poses two problems:

| Problem | Explanation |
|---|---|
| Message sent for nothing | if the transaction is cancelled afterwards, the write disappears but the email has already left: the customer receives a confirmation for an order that does not exist |
| Transaction open too long | a slow remote server keeps the database locked while it waits, and blocks other users |

The following code simulates a transaction (a provisional copy of the "database", copied back only if everything succeeds) and compares two ways of sending a message:

```javascript
// A transaction: everything is committed together, or everything is cancelled
const db = new Map(); // committed state
const sent = []; // emails actually sent

async function transaction(work) {
  const copy = new Map(db); // provisional state
  const queue = []; // actions to run after commit
  try {
    await work(copy, (action) => queue.push(action));
    db.clear(); // commit: the copy becomes the real state
    copy.forEach((v, k) => db.set(k, v));
    queue.forEach((action) => action()); // deferred actions
  } catch (error) {
    return `cancelled: ${error.message}`; // nothing is written, nothing is sent
  }
  return "committed";
}

const send = (address) => sent.push(address); // fake network call

// Bad: the network call leaves BEFORE the end, then the transaction fails
const r1 = await transaction(async (data) => {
  data.set(1, "order");
  send("a@example.com"); // really gone
  throw new Error("insufficient stock");
});
console.log("Bad:", r1, "db =", db.size, "sent =", sent.length);

// Good: the sending is queued and only leaves after commit
const r2 = await transaction(async (data, after) => {
  data.set(1, "order");
  after(() => send("b@example.com")); // deferred
  throw new Error("insufficient stock");
});
console.log("Good (failure):", r2, "db =", db.size, "sent =", sent.length);

const r3 = await transaction(async (data, after) => {
  data.set(1, "order");
  after(() => send("c@example.com"));
});
console.log("Good (success):", r3, "db =", db.size, "sent =", sent.length);
```

Actual result:

```text
Bad: cancelled: insufficient stock db = 0 sent = 1
Good (failure): cancelled: insufficient stock db = 0 sent = 1
Good (success): committed db = 1 sent = 2
```

The first attempt shows the flaw: `db = 0` (nothing is written) but `sent = 1` (a message left anyway). The second attempt adds no message (`sent` stays at 1); only the third, successful one adds one. The same idea is found in a [message queue or batch processing](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots): the action is put on hold, another process runs it, and it can be replayed if it fails.

## A data schema built by code

The **schema** of a table is its description: which columns, of what type, with which constraints (see [schemas and technical tables](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques) for the meaning of the word "schema" in a database). It is traditionally written in an [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) file (`CREATE TABLE ...`). Another approach is to declare it in the entity's class: each field is a small object, a **field definition**, and the framework deduces the table from it.

| | SQL file | Field definitions in a class |
|---|---|---|
| Where the schema lives | a file separate from the code | the entity's class |
| Who writes the `CREATE TABLE` | the developer, by hand | the code, deduced from the fields |
| Adding a field | edit the SQL file and the PHP code | add a line in the list of fields |
| Main risk | the code and the SQL contradict each other | a definition error spreads everywhere |
| Other possible uses | none | also generate a form, a validation, an API |

The following PHP code declares three fields, then deduces the SQL statement from them. It then really creates the table in an in-memory SQLite database with PDO (the standard PHP library for accessing databases, [official documentation](https://www.php.net/manual/en/book.pdo.php)):

```php
<?php
// A field definition: a name, an SQL type and a constraint
final class Field
{
    public function __construct(
        public string $name,
        public string $sqlType,
        public bool $required = false,
    ) {}

    // Writes the SQL column that matches the field
    public function toSql(): string
    {
        return $this->name . ' ' . $this->sqlType . ($this->required ? ' NOT NULL' : '');
    }
}

// An entity describes its own fields: the schema lives in the class
class Book
{
    // List of stored fields (one column each)
    public static function fields(): array
    {
        return [
            new Field('id', 'INTEGER PRIMARY KEY'),
            new Field('title', 'TEXT', true),
            new Field('price_excl_vat', 'REAL', true),
        ];
    }

    // Deduces the CREATE TABLE statement from the list of fields
    public static function createTable(): string
    {
        $columns = array_map(fn (Field $c) => $c->toSql(), self::fields());
        return 'CREATE TABLE book (' . implode(', ', $columns) . ')';
    }

    public function __construct(private array $values) {}

    // Computed field: never stored, recomputed at each read
    public function priceInclVat(): float
    {
        return round($this->values['price_excl_vat'] * 1.2, 2);
    }
}

echo Book::createTable(), "\n";
$book = new Book(['id' => 1, 'title' => 'PHP', 'price_excl_vat' => 10.0]);
echo $book->priceInclVat(), "\n";
$sqlite = new PDO('sqlite::memory:');
$sqlite->exec(Book::createTable());
$rows = $sqlite->query('SELECT count(*) FROM book')->fetchColumn();
echo 'table created, rows: ', $rows, "\n";
```

Actual result:

```text
CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL, price_excl_vat REAL NOT NULL)
12
table created, rows: 0
```

PHP vocabulary in the block: `final` forbids inheriting from the class; `public`/`private` control who can read a property; `static` attaches the method to the class, not to an instance; `fn (...) =>` is a short function applied to each field by `array_map`. The basics of [object-oriented programming in PHP](/?c=langages&s=php&p=poo) are covered in their chapter.

> **Pitfall:** changing a field definition only affects a table created afterwards. A table that already holds data is not modified by itself: its rows must be moved and converted, which belongs to safe data migrations, covered in a separate chapter.

## The computed field

A **computed field** looks like a field to whoever uses it (`book.priceInclVat`) but has no column: its value is **recomputed at every read** from other fields. A price including VAT, a full name (first name and last name), an age (from a date of birth) are typical examples.

| | Stored value | Computed value |
|---|---|---|
| Where it lives | a column, written on save | a function, re-read on each access |
| Freshness | stale if the source changes without an update | always up to date |
| Read cost | a simple read | a computation each time |
| Filter or sort in SQL | possible (and indexable with an [index](/?c=donnees&s=bases-de-donnees&p=les-index)) | impossible directly: the database does not know it |
| Suited to | a value costly to produce and rarely modified | a derived value, cheap to produce |

The following code shows the stored value becoming wrong, and the computed value staying correct. `Object.defineProperty` with `get` declares a property whose value is produced by a function at each read:

```javascript
// Stored value: copied once, it becomes wrong when the source changes
const book = { priceExclVat: 10, vat: 0.2 };
book.storedPriceInclVat = book.priceExclVat * (1 + book.vat); // written only once

// Computed value: a function re-read at each access
Object.defineProperty(book, "priceInclVat", {
  get() {
    return book.priceExclVat * (1 + book.vat); // recomputed at each read
  },
});

book.priceExclVat = 20; // the source changes
console.log("stored:", book.storedPriceInclVat); // 12: stale
console.log("computed:", book.priceInclVat); // 24: up to date
console.log(JSON.stringify(book)); // the computed field is not serialized
```

Actual result:

```text
stored: 12
computed: 24
{"priceExclVat":20,"vat":0.2,"storedPriceInclVat":12}
```

The last line shows that a computed field does not appear in the data written: it has no place in the database, so there is nothing to synchronize.

## Pitfalls

| Pitfall | Consequence | Remedy |
|---|---|---|
| Saving the entity again in `postSave` | infinite loop, crash | compute in `preSave`, or write the single column with a direct query |
| Network call in `postSave` | message sent for a cancelled transaction, database locked for a long time | queue the action, run it after commit |
| Relying on `preDelete` to protect everything | a direct mass SQL query bypasses it | also keep a constraint in the database (foreign key) |
| Side effect in `preSave` | the write can still fail afterwards | reserve `preSave` for the entity's own values |
| Storing a derived value | it becomes wrong as soon as the source changes | compute it on read, or recompute it at each save |
| Costly computed field | slow at each read, especially in a list (see the N+1 problem of the [ORM](/?c=donnees&s=bases-de-donnees&p=orm)) | store the result, with a clear update rule |
| Changing a field definition on a populated table | the table and the code diverge | a safe data migration (neighboring chapter) |

## Best practices

| Practice | Reason |
|---|---|
| Keep each step short and fast | it runs at every save of every entity |
| `preSave` to correct, `postSave` to react | the value going into the write is the right one from the first pass |
| Defer every external call until after commit | no message for a cancelled write |
| Test the order of the steps with a trace, as in the first example | you see what is really called |
| Declare a computed field rather than duplicate data | a single source of truth, nothing to synchronize |
| Keep the schema in one form only (code or SQL) | avoid them contradicting each other |

## Key Takeaways

| | |
|---|---|
| **Key point** | A lifecycle offers four callback steps: `preSave`, `postSave`, `preDelete`, `postDelete`. A schema can be declared by field definitions in a class. A computed field is never stored and is recomputed at each read. |
| **Usable tools** | An [ORM](/?c=donnees&s=bases-de-donnees&p=orm) that calls the steps; database transactions; a queue to defer effects; an accessor (`get`, method) for a computed field. |
| **Pitfalls to avoid** | The save loop; the network call inside a transaction; a mass deletion that bypasses `preDelete`; a stored derived value that goes stale. |
| **Best practices** | Correct in `preSave`, react in `postSave`, defer the network until after commit, store only what you cannot cheaply recompute. |
