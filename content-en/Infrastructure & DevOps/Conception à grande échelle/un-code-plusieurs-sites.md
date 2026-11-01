---
order: 6
---

# One code, several sites: the multisite pattern

A **site** here is what a visitor reaches by typing an address into their browser: `boutique.example` is a site, `blog.example` is another one. Each site has its own look, its own settings, its own data and its own audience. When an organization runs ten, forty or two hundred of them (one brand per country, one site per client, one site per event), an architecture question arises: must the program be written, deployed and fixed ten, forty or two hundred times, or **just once**, for all of them? The **multisite pattern** (*multisite* in English) chooses the second answer: **a single code base** (all the files of the program) serves N sites, and each site keeps its own configuration, its own files and its own data. The whole of the sites served by the same code is called the **fleet**.

This chapter is a design chapter, following on from [Autoscaling and load balancing](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) (several **application servers**, the machines that run the code, identical behind a load balancer): there, N servers run the same code for **one** site; here, the same code serves **N** sites. The two combine. It assumes that you know what a [database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) is (software that stores information in **tables**, like spreadsheets with one row per item and one column per characteristic) and the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) language that lets you query it.

| Section | Question it answers |
|---|---|
| [The problem](#the-problem-copying-the-code-for-each-site) | Why not simply copy the program for each site? |
| [The pattern in one picture](#the-pattern-in-one-picture) | What happens, step by step, when a request arrives? |
| [Recognizing the site](#recognizing-the-requested-site) | How does the code know which site is being requested? |
| [Shared and isolated](#what-is-shared-what-is-isolated) | What is common to all the sites, and what stays specific to each one? |
| [Three storage variants](#where-the-data-lives-three-variants) | One database per site, a table prefix per site, or one schema per site? |
| [Backing up a site](#backing-up-and-restoring-a-single-site) | How do you extract a single site from a group? |
| [Updating the fleet](#updating-the-whole-fleet) | How do you apply a structure change to N sites? |
| [The risks](#the-risks-of-the-pattern) | What can go wrong when everything is shared? |
| [When to use it](#when-to-choose-this-pattern) | Compared with which alternatives, and for which cases? |
| [A CMS example](#a-cms-example-drupal) | What does it look like in a real content management system? |

## The problem: copying the code for each site

Forty sites that share the same logic (a catalog, user accounts, editorial pages) can be managed in two opposite ways:

| | One copy of the code per site | One code for all the sites |
|---|---|---|
| Fixing a bug | To redo in 40 copies, risking forgetting one | One fix, live everywhere at the next deployment (the rollout of a new version) |
| New feature | Developed once, copied 40 times | Developed once, available everywhere |
| Drift between sites | Unavoidable: each copy ends up differing from the others | Impossible for the code (it exists only once) |
| Disk and memory space | 40 identical sets of files | One set of files |
| Freedom of a site | Total: you can change your copy | Limited: any change to the code affects everyone |
| Risk of an error | Limited to one site | Spread across the whole fleet |

The last row is the price of the pattern: we gain in effort and consistency, and we lose in independence. The whole chapter is about keeping the gain while limiting that loss.

> **Analogy:** an office building. The building (the code), the elevator and the boiler (the updates, the maintenance) are shared. Each company has its own door, key, furniture and files (the configuration, the files, the data). An elevator breakdown inconveniences everyone; a fire in a badly partitioned office can spread to the others.

## The pattern in one picture

A **request** is the message that a visitor's browser sends to a server; it contains the **host name** of the targeted site (for example `blog.example`, detailed in the next section). The **prefix** of a site is a piece of text placed in front of the names of its tables (`blog_articles` rather than `articles`), explained further below.

```text
  boutique.example      blog.example      club.example      <- three host names
        |                    |                  |
        +--------------------+------------------+
                             |
                             v
                  Load balancer                    <- the same for all
                             |
                +------------+------------+
                v                         v
          Application server 1     Application server 2   <- ONE code deployed
                |                         |
                +------------+------------+
                             |
        1. read the host name of the request
        2. choose the configuration of this site  (title, language, prefix, database...)
        3. open ITS database or ITS tables
        4. respond with ITS files
                             |
          +------------------+-------------------+
          v                  v                   v
     data of              data of            data of
     boutique             blog               club          <- isolated per site
```

| Step | What happens | What must remain true |
|---|---|---|
| 1. Read the host name | The code extracts from the request the name of the site requested | The name comes from the request, so from a third party: it must be checked |
| 2. Choose the configuration | A lookup table "host name to settings" gives the title, the language, the database access | An unknown name is refused, never redirected to a random site |
| 3. Open the data | A connection to the site's database, or to its prefixed tables | No request may be able to reach the data of another site |
| 4. Respond | The page is built with this site's files, cache and session | Nothing one site produces may appear on another |

## Recognizing the requested site

The **host name** is the name of the machine or site targeted by the request: `blog.example` in the address `https://blog.example/articles` (`https` means encrypted HTTP). The **DNS** (see [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034)) is the internet directory that translates this name into the numeric address of a machine; several names can point to the same machine, and that is what makes the pattern possible: the three sites of the picture above all lead to the same load balancer. An [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) request (the message that a browser sends to a server) carries the targeted name in a **header** (a line of information added to the request) called `Host` (see [the HTTP specification](https://www.rfc-editor.org/rfc/rfc9110#name-host-and-authority)). The code reads this header and deduces the site from it.

| Selection criterion | Example | Advantage | Limit |
|---|---|---|---|
| Full host name | `blog.example` and `boutique.example` | Natural, one name per site, one certificate per name (the digital document that proves the identity of a site in HTTPS) | One name (and one DNS record) to create for each site |
| Subdomain (a name added in front of an existing domain) | `blog.groupe.example` | Only one domain to manage, a "wildcard" certificate (`*.groupe.example`) is possible | The sites share the parent domain: beware of **cookies**, small files that the browser keeps and sends back with each request (see below) |
| Start of the path | `groupe.example/blog/` | No extra name to buy | The code must strip the prefix from each address; relative links break easily |
| Port (the number of a machine's "door", 443 for HTTPS) | `groupe.example:8081` | Handy in development | Rare in production (the site really open to visitors): visitors do not type a port |

The most common choice is the host name. The examples in this chapter use the `.example` suffix, **reserved** for documentation by [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) (an **RFC** is a reference document of the internet standards): these names will never designate a real site.

### A runnable example in Python

The following program simulates the heart of the pattern: a request arrives with a host name, the code chooses the configuration of the site, then reads the tables **of that site** in a shared database where each table carries the **prefix** of the site (a piece of text placed in front of the table name: `blog_articles` rather than `articles`). It uses [Python](/?c=langages&s=python&p=python) and [SQLite](https://www.sqlite.org/docs.html), a database contained in a single file (or in memory), with no server to install, driven here by the `sqlite3` module that ships with Python. It is written in a single file, `multisite.py`, presented in three pieces one after the other. It uses basic Python notions: a [dictionary](/?c=langages&s=python&p=dictionnaires-et-ensembles) (a "key to value" table), a [tuple](/?c=langages&s=python&p=listes-et-tuples) (a fixed sequence of values), a [function](/?c=langages&s=python&p=fonctions) (a named block of code, whose text between triple quotes placed under its name, the *docstring*, is its description) and a [module](/?c=langages&s=python&p=modules-et-environnements) (a code file that you import). In the docstrings of this chapter, `@brief` summarizes the function, `@param` describes an argument and `@returns` the value returned. To try the program, paste the three pieces, in order, into a `multisite.py` file created with a text editor, then run it from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Each other program of the chapter is pasted the same way into a separate `.py` file.

First piece: the configuration and the check of the prefixes. A **regular expression** (see [regex in Python](/?c=langages&s=python&p=regex-en-python)) is a text pattern that describes the strings accepted; here it accepts only one lowercase letter, then lowercase letters or digits (from 0 to 15 times, written `{0,15}`), then a final underscore. Some Python notations are needed from this first piece on. An [*f-string*](/?c=langages&s=python&p=variables#f-strings-inserting-variables-into-text) is a text preceded by `f` in which `{expression}` is replaced by its value; `{value!r}` shows the value with its quotes. An **exception** (see [error handling](/?c=langages&s=python&p=gestion-des-erreurs)) is the signal that a program emits when it cannot continue normally: `raise` emits one ([raising your own exceptions](/?c=langages&s=python&p=gestion-des-erreurs#throwing-your-own-exceptions)), and `ValueError` signals an unacceptable value. A [list comprehension](/?c=langages&s=python&p=listes-et-tuples#list-comprehensions), `[x for x in sequence]`, builds a list in a single line. The `r` before `r"..."` denotes a raw string, where the backslash has no special meaning.

```python
# re: Python module for regular expressions (text patterns)
import re
# sqlite3: module shipped with Python to talk to a SQLite database
import sqlite3

# A dictionary: for each host name, the settings of its site
SITES = {
    # A display title and the table prefix of each site
    "boutique.example": {"title": "The Boutique", "prefix": "boutique_"},
    "blog.example": {"title": "The Blog", "prefix": "blog_"},
    "club.example": {"title": "The Club", "prefix": "club_"},
}

# A safe prefix: a lowercase letter, 0 to 15 lowercase letters or digits, then a "_"
SAFE_PREFIX = re.compile(r"[a-z][a-z0-9]{0,15}_")


def check_prefixes():
    """
    @brief Refuses a dangerous prefix or one that overlaps another.
    """
    # The list of the prefixes of all the sites, built in one line; values() gives
    # the settings of each site
    prefixes = [site["prefix"] for site in SITES.values()]
    # enumerate gives each prefix with its position i in the list
    for i, prefix in enumerate(prefixes):
        # fullmatch requires that ALL the text matches the pattern
        if not SAFE_PREFIX.fullmatch(prefix):
            # raise stops the program with a message; !r puts the prefix in quotes
            raise ValueError(f"prefix refused: {prefix!r}")
        # We compare it with all the other prefixes
        for j, other in enumerate(prefixes):
            # startswith tests whether "other" starts with "prefix": risk of mixing
            if i != j and other.startswith(prefix):
                raise ValueError(f"prefix overlaps another: {prefix!r}")
```

Second piece: choosing the site from the host name, and computing the real name of a table. This piece also raises exceptions (defined above); `LookupError` signals "I cannot find what you are asking for".

```python
def choose_site(host):
    """
    @brief Finds the configuration of the site requested by the request.

    @param host Text "name" or "name:port", in uppercase or lowercase.

    @returns The configuration dictionary of the site.
    """
    # split(":") cuts at the ":" and [0] keeps the part before it (the port is removed);
    # lower() switches to lowercase
    name = host.split(":")[0].lower()
    # A name missing from the lookup table is NOT a site of this fleet
    if name not in SITES:
        # We refuse instead of falling back to a default site
        raise LookupError(f"unknown site: {name}")
    # Otherwise we return the settings of this site
    return SITES[name]


def table(site, name):
    """
    @brief Gives the real name of a table: the prefix of the site, then the common name.

    @param site Configuration dictionary of a site.
    @param name Table name written in the code, never typed by a visitor.

    @returns The full name, safe to insert in an SQL query.
    """
    # The prefix was checked at startup: it only contains safe characters
    return site["prefix"] + name
```

Third piece: creating the tables of each site, answering a request, and running it all. The question mark `?` in an SQL query is a **bound parameter**: the value is passed separately, never pasted into the text of the query, which prevents [SQL injection](/?c=langages&s=domain-specific-languages-dsl&p=sql#sql-injection-why-you-should-never-concatenate-an-external-value). It is only meant for **values**. A table name cannot be a parameter, so we build it into the text of the query (with an *f-string*, seen above), which is safe only because the prefix comes from the configuration and has been checked.

```python
def install(connection, site):
    """
    @brief Creates the tables of a site and puts a first article in them.

    @param connection Open SQLite connection.
    @param site Configuration dictionary of a site.
    """
    # Real name of the articles table of this site, for example "blog_articles"
    articles = table(site, "articles")
    # CREATE TABLE IF NOT EXISTS creates the table only if it does not already exist
    connection.execute(
        f"CREATE TABLE IF NOT EXISTS {articles} "
        "(id INTEGER PRIMARY KEY, title TEXT NOT NULL)"
    )
    # INSERT adds a row; the value goes through the "?" parameter
    # (the trailing comma makes the value a tuple of a single element, required by execute)
    connection.execute(
        f"INSERT INTO {articles} (title) VALUES (?)",
        (f"Welcome to {site['title']}",),
    )


def serve(connection, host):
    """
    @brief Answers a request: chooses the site, then reads its articles.

    @param connection Open SQLite connection.
    @param host Host name of the request.

    @returns The title of the site and the list of article titles.
    """
    # Steps 1 and 2 of the picture: read the host name, choose the configuration
    site = choose_site(host)
    # Step 3: SELECT reads the rows, only in the tables of THIS site
    rows = connection.execute(f"SELECT title FROM {table(site, 'articles')}")
    # Each row is a tuple; a list built in one line with its first element
    return site["title"], [row[0] for row in rows]


# Startup: we refuse to go on if a prefix is doubtful
check_prefixes()
# An in-memory SQLite database: it disappears when the program ends
connection = sqlite3.connect(":memory:")
# We create the tables of each of the three sites in the SAME database
for site in SITES.values():
    install(connection, site)

# Five simulated requests: three known sites (one with a port and capitals), two fake ones
HOSTS = [
    "boutique.example",
    "BLOG.example:8080",
    "club.example",
    "pirate.example",
    "boutique.example.pirate.example",
]
# For each host name received
for host in HOSTS:
    # try / except: we attempt the answer, and catch the exception if the site is unknown
    try:
        # :33 reserves 33 characters for the host name, to align the columns
        print(f"{host:33} -> {serve(connection, host)}")
    except LookupError as error:
        print(f"{host:33} -> refused ({error})")

# sqlite_master is the internal table that lists everything the database contains
names = connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
# We print the table names: three sites, three sets of tables in one database
print("tables in the database :", [name[0] for name in names])
```

Run with `python3 -I multisite.py` (the `-I` option starts Python in isolated mode, which ignores the user's environment), the program prints:

```text
boutique.example                  -> ('The Boutique', ['Welcome to The Boutique'])
BLOG.example:8080                 -> ('The Blog', ['Welcome to The Blog'])
club.example                      -> ('The Club', ['Welcome to The Club'])
pirate.example                    -> refused (unknown site: pirate.example)
boutique.example.pirate.example   -> refused (unknown site: boutique.example.pirate.example)
tables in the database : ['boutique_articles', 'blog_articles', 'club_articles']
```

The first three lines show the pattern at work: the same function `serve` answers differently depending on the host name, and `BLOG.example:8080` is recognized despite the capitals and the port. The last two requests are refused: **an unknown name is not redirected to a default site**, and a name that *starts* like a real one (`boutique.example.pirate.example`) is not taken for it, because the comparison covers the whole name. The last line shows the storage: a single database, three sets of tables.

> **Pitfall:** falling back to "the first site" or to a "default site" when the host name is unknown. A visitor (or a bot) who sends a fake `Host` header then receives the pages, and sometimes the data, of a site that was not targeted, and an intermediate cache can store that mix for other visitors. **Good practice:** a closed list of allowed names, such as `SITES` above, and a clear error for everything else (404, the "page not found" code, or 421 *Misdirected Request*, described in the same [HTTP specification](https://www.rfc-editor.org/rfc/rfc9110#name-421-misdirected-request)).

The `Host` header is supplied by the visitor: it must **never** be used as is to build an absolute address (for example the link in a password reset email), otherwise an attacker gets their victim to receive a link to a domain the attacker controls. The "official" address of each site is read from the configuration, not from the request. Behind a load balancer or an intermediate server, the original name may also travel in a forwarding header (often named [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)): take it into account only if the intermediary is trusted and overwrites that header itself.

## What is shared, what is isolated

| Element | Shared between sites | Specific to each site |
|---|---|---|
| Application code (files) | Yes, a single copy | No |
| Installed libraries (reusable code written by others) and extensions (modules that add functions) | Yes, same versions for all | Possibly enabled or not, per site |
| Code updates | Yes: one deployment touches all sites | No |
| Servers, memory, processor | Yes, unless quotas are set up | No by default |
| Configuration (title, language, database access, [API keys](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | No | Yes, one set of settings per site |
| Data (articles, accounts, orders) | No | Yes |
| Uploaded files (images, documents) | No | Yes, one folder per site |
| **Cache** (memory where a result is kept so it need not be recalculated) and **sessions** (the memory of who is logged in) | The engine can be (one same cache server), never the keys | Yes: the keys carry the identifier of the site |
| Secrets (database passwords, keys) | No | Yes, one set per site (see [Secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |
| Scheduled tasks (programs launched at a fixed time) | The trigger can be | The job runs for each site |
| Logs (the files where the program notes what it does) | Often one same stream | Each line indicates the site concerned |

The rule that follows from the table: **everything that is shared is a contagion surface** (a failure or a breach spreads to all of them through it), and **everything that is isolated must really be isolated**, that is, a forgotten condition in a query or a cache key must not let the data of one site leak into another. This logic is that of the *blast radius* described in [Secure development principles](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise): we try to reduce what an error or a compromise can reach.

## Where the data lives: three variants

The most structuring choice of the pattern is where the data of each site lives. Three organizations exist:

```text
 A. One database per site     B. Table prefix              C. Schema per site
                                 (one shared database)        (one shared database)

 +-----------+ +-----------+   +-----------------------+    +-----------------------+
 | database  | | database  |   | one shared database   |    | one shared database   |
 | boutique  | | blog      |   |  boutique_articles    |    |  schema boutique      |
 |  articles | |  articles |   |  boutique_clients     |    |   articles, clients   |
 |  clients  | |  clients  |   |  blog_articles        |    |  schema blog          |
 +-----------+ +-----------+   |  blog_clients         |    |   articles, clients   |
  (one extra database          +-----------------------+    +-----------------------+
   for each site)
```

A **schema** is a namespace (a grouping that avoids name conflicts) inside a database: two tables with the same name can coexist if they belong to different schemas (see [Schemas and technical tables](/?c=donnees&s=bases-de-donnees&p=schemas-et-tables-techniques)). A **connection** is an open link between the application and the database, with its own credentials.

| | A. One database per site | B. Table prefix per site | C. Schema per site |
|---|---|---|---|
| Principle | Each site has its own database, with its own credentials | One shared database; the name of each table starts with the prefix of the site | One shared database; each site has its own namespace |
| Advantages | The clearest separation; backing up, restoring and deleting a site are very simple | One database to host and monitor; works everywhere, even with a database engine that has no schemas (SQLite, for example) | Clear separation without multiplying databases; the same table names for all the sites |
| Limits | N databases to create, host, monitor and update; N sets of connections | No real barrier between sites; table names get longer; the catalog of the database (its internal list of tables) grows: N times the number of tables | Depends on the engine: not all of them offer real schemas; the update still has to be done N times |
| Writing code | A different connection per site | Think about the prefix in each query | Choose the schema of the connection, or name `schema.table` |

| | A. One database per site | B. Table prefix per site | C. Schema per site |
|---|---|---|---|
| Data isolation | Strong: a query only reaches the open database | Weak: all the tables are visible from the same connection | Medium to strong, depending on the rights granted on each schema |
| SQL rights (see [least privilege](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise)) | One account per database, simple | One account sees everything, unless rights are granted table by table (tedious) | One account per schema is possible |
| Backing up one site | Copy or export a database | Export only the tables with the prefix (see below) | Export a schema |
| Restoring one site | Replace a database | Replace a set of tables, without touching the others | Replace a schema |
| Database connections | One per site used and per process (a running program; see [the risks](#the-risks-of-the-pattern)) | One per process, whatever the site | One per process, with the schema chosen on the fly |
| Hosting cost | Higher: memory and files per database | The lowest | Low |
| Moving a site that became huge to another server | Easy: move the database | Painful: the tables with the prefix must be extracted | Medium: move the schema |

No variant is the best in itself. In practice: **A** when isolation and autonomy matter more than cost (clients who require their data to be separated, very unequal sites); **B** when you have many small, similar sites and a simple database engine; **C** when the engine offers real schemas and you want a compromise. The [scaling of the database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) (cache, replicas, partitioning) is then tackled site by site, or for all of them together.

### Variant A in code: one file per site

With SQLite, a "database per site" is one file per site. This program creates two files, shows that the connection of one site does not see the tables of another, then backs up a single site. The `tempfile` module creates a temporary folder, and `pathlib.Path` handles file paths (see [handling files and folders](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)).

```python
# sqlite3: access to SQLite; tempfile: temporary folder; Path: file paths
import sqlite3
import tempfile
from pathlib import Path

# The site names are chosen by the code, never by a visitor
SITES = ["boutique", "blog"]
# A temporary folder created for the test (mkdtemp does not delete it at the end)
folder = Path(tempfile.mkdtemp())


def open_db(site):
    """
    @brief Opens the database of one site: one file per site.

    @param site Name of the site, chosen by the code (never by a visitor).

    @returns An SQLite connection on the file of this site.
    """
    # The file is created at the first opening; the / operator joins the paths
    return sqlite3.connect(folder / f"{site}.sqlite")


# We prepare one file per site
for site in SITES:
    # Connection to the file of this site
    db = open_db(site)
    # The same name "articles" for all: no prefix, the file is the separation
    db.execute("CREATE TABLE articles (id INTEGER PRIMARY KEY, title TEXT)")
    # One example row
    db.execute("INSERT INTO articles (title) VALUES (?)", (f"Article from {site}",))
    # commit makes the changes permanent in the file
    db.commit()
    # We close the connection
    db.close()

# A "ventes" (sales) table, created in the boutique's database only
boutique = open_db("boutique")
boutique.execute("CREATE TABLE ventes (id INTEGER PRIMARY KEY, montant REAL)")
boutique.commit()
boutique.close()

# Isolation: the blog's connection only sees the blog's file
blog = open_db("blog")
# Reading its own articles; fetchall returns all the rows as a list
print("blog :", blog.execute("SELECT title FROM articles").fetchall())
# Trying to read the table "ventes", which only exists in the boutique's file
try:
    blog.execute("SELECT montant FROM ventes")
except sqlite3.OperationalError as error:
    print("table of another site ->", error)

# Backing up a single site: copy its database into a new file
copy = sqlite3.connect(folder / "blog-sauvegarde.sqlite")
# backup copies the whole blog database, even if writes arrive during the copy
blog.backup(copy)
# iterdir() lists the contents of the folder; the sorted list of names is built in one
# line (generator expression: a comprehension without brackets)
print("files :", sorted(path.name for path in folder.iterdir()))
# We close the two remaining connections
blog.close()
copy.close()
```

Output obtained:

```text
blog : [('Article from blog',)]
table of another site -> no such table: ventes
files : ['blog-sauvegarde.sqlite', 'blog.sqlite', 'boutique.sqlite']
```

The query that targets the table `ventes`, present only in the boutique's file, fails from the blog's connection: that is the isolation of variant A. Backing up a single site requires no sorting, since the whole content of the file belongs to it.

### Variant C in code: one schema per site

SQLite does not have schemas in the sense of the other engines, but its `ATTACH DATABASE` instruction ("attach a database") attaches several named databases to one connection, which you then query with the same `name.table` notation as a schema. It is a good simulation of the behavior, without claiming to reproduce the rights of a more complete engine.

```python
# sqlite3: Python module to talk to a SQLite database
import sqlite3

# A main connection, in memory
connection = sqlite3.connect(":memory:")

# ATTACH adds an extra database under a name: here, one per site
connection.execute("ATTACH DATABASE ':memory:' AS boutique")
connection.execute("ATTACH DATABASE ':memory:' AS blog")
# The two tables have the same name; the name before the dot tells them apart
connection.execute("CREATE TABLE boutique.articles (id INTEGER PRIMARY KEY, title TEXT)")
connection.execute("CREATE TABLE blog.articles (id INTEGER PRIMARY KEY, title TEXT)")
# A single row, added to the blog's table
connection.execute("INSERT INTO blog.articles (title) VALUES ('Blog article')")
# Reading in the "blog" space
rows_blog = connection.execute("SELECT title FROM blog.articles").fetchall()
print("blog.articles     :", rows_blog)
# Reading in the "boutique" space: same table name, separate content
rows_boutique = connection.execute("SELECT title FROM boutique.articles").fetchall()
print("boutique.articles :", rows_boutique)
```

Output obtained:

```text
blog.articles     : [('Blog article',)]
boutique.articles : []
```

The two `articles` tables coexist without conflict. In an engine that knows schemas (PostgreSQL, for example, whose [schema documentation](https://www.postgresql.org/docs/current/ddl-schemas.html) also describes the search path, which avoids writing the schema name in front of each table), you choose the schema once, when the connection is opened.

## Backing up and restoring a single site

In variant A, backing up a site is obvious: you copy its database. In variant B, you must find **the tables of this site** among all those of the database. The natural idea is to look for the names that start with the prefix, with the SQL operator `LIKE`, which compares a text to a pattern. It contains a classic trap: in a `LIKE` pattern, the underscore `_` does not mean "an underscore" but "**any single character**" (and `%` means "any sequence of characters").

```python
# sqlite3: Python module to talk to a SQLite database
import sqlite3

# A database in memory holding the tables of two sites with close names
connection = sqlite3.connect(":memory:")
# "blog_" and "blogger_" are two different prefixes, neither starts with the other
for name in ["blog_articles", "blog_notes", "blogger_articles"]:
    # We create a minimal table for each name
    connection.execute(f"CREATE TABLE {name} (id INTEGER)")

# sqlite_master lists the tables; LIKE ? compares the name with the pattern (a parameter)
query = "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ?"
# "_" means "any single character": "blog_%" also catches blogger_articles
naive = connection.execute(query, ("blog_%",)).fetchall()
print("LIKE 'blog_%'          :", sorted(name[0] for name in naive))
# We escape the "_" with "\" and declare it with ESCAPE: it becomes a real underscore again
exact = connection.execute(query + " ESCAPE '\\'", ("blog\\_%",)).fetchall()
print("LIKE 'blog\\_%' ESCAPE  :", sorted(name[0] for name in exact))
```

Output obtained:

```text
LIKE 'blog_%'          : ['blog_articles', 'blog_notes', 'blogger_articles']
LIKE 'blog\_%' ESCAPE  : ['blog_articles', 'blog_notes']
```

Without the escaping, the backup of the blog would have taken the table `blogger_articles` from another site: a data leak into a backup file. Even with the escaping, a safety rule remains preferable: **check at startup that the prefix of a site is not the beginning of any other** (what `check_prefixes` above does), and **build the list of the tables of the site in the code** (`prefix + name` for each known table) rather than deducing it from a pattern. For variants A and C, this sorting step does not exist, which is a concrete argument in favor of their isolation.

| Operation | Variant A (database) | Variant B (prefix) | Variant C (schema) |
|---|---|---|---|
| Back up a site | An export of the database | Export the exact list of the tables of the site | Export the schema |
| Restore a site | Replace the database | Drop then recreate the tables of the prefix, checking that no table of another site is touched | Replace the schema |
| Delete a site | Delete the database | Delete its tables, one by one | Delete the schema |
| Clone a site (pre-production: a test copy before going live) | Copy the database | Copy the tables under a new prefix | Copy the schema |
| Main risk | Forgetting a database in the backup list | Confusing two close prefixes | Rights too broad over several schemas |

## Updating the whole fleet

Sharing the code also means sharing the **structure changes**: adding a column to the articles table (see [Safe data migrations](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) and the section on migrations of the [ORM](/?c=donnees&s=bases-de-donnees&p=orm) for the notion of versioned migration) must be done **in each of the N sites**, since each one has its own tables. The code is deployed once; the structure, however, is updated N times.

```text
Deployment of the new code  (once, instant)
        |
        v
New code expects a "published" column in the articles
        |
        v
Structure migration
   site 1 ... OK
   site 2 ... OK
   site 3 ... FAILED            <- the fleet is now IN A MIXED STATE
   sites 4 to 40 ... waiting    (the new code on tables with the old structure)
```

The mixed state is the risk specific to this pattern: as long as the loop has not finished, the same code runs in front of different structures. The defenses are the same as for a data migration: an operation **safe to replay** (**idempotence**, that is, giving the same result whether it is run once or several times), a log of what is already done, and code that is compatible with both the old **and** the new structure during the transition.

```python
# sqlite3: Python module to talk to a SQLite database
import sqlite3

# The prefixes of three sites sharing one database
PREFIXES = ["boutique_", "blog_", "club_"]
# In-memory database for the test
connection = sqlite3.connect(":memory:")
# We create the articles table of each site, with the old structure
for prefix in PREFIXES:
    connection.execute(f"CREATE TABLE {prefix}articles (id INTEGER, title TEXT)")
# One site already received the new column during an earlier interrupted attempt
connection.execute("ALTER TABLE blog_articles ADD COLUMN published INTEGER DEFAULT 0")


def migrate(connection, prefix):
    """
    @brief Adds the "published" column if it is missing (safe to replay).

    @param connection Open SQLite connection.
    @param prefix Table prefix of a site, already checked.

    @returns "migrated" or "up to date".
    """
    # Real name of the table of this site
    table = f"{prefix}articles"
    # PRAGMA table_info lists the columns; index 1 of each row is the name
    columns = [row[1] for row in connection.execute(f"PRAGMA table_info({table})")]
    # Column already there: nothing to do, and above all no "duplicate column" error
    if "published" in columns:
        # Answer without changing anything
        return "up to date"
    # ALTER TABLE ... ADD COLUMN adds the column, with the value 0 for existing rows
    connection.execute(f"ALTER TABLE {table} ADD COLUMN published INTEGER DEFAULT 0")
    # We report that this site has just been changed
    return "migrated"


# A migration of the fleet = a loop over all the sites; we run it twice
for run in (1, 2):
    # One dictionary per run, built in one line: prefix -> result
    summary = {prefix: migrate(connection, prefix) for prefix in PREFIXES}
    print(f"run {run} :", summary)
```

Output obtained:

```text
run 1 : {'boutique_': 'migrated', 'blog_': 'up to date', 'club_': 'migrated'}
run 2 : {'boutique_': 'up to date', 'blog_': 'up to date', 'club_': 'up to date'}
```

The first run migrates two sites and notes that the third one was already migrated; the second one changes nothing anymore. Without the column check, the first run would have failed on the blog and left the following sites unmigrated.

| Deployment practice | Effect | Precaution |
|---|---|---|
| Migrate a pilot site first, then the others in batches | A defect is found on a single site | Choose a site that is representative but not very critical |
| Write the new code so that it tolerates the old structure | No interruption during the migration loop | Remove the compatibility code once all the sites are migrated |
| Record, per site, the version of the structure reached | We know exactly where to resume after a failure | A tracking table per site, or a version identifier in the configuration |
| Plan the total time (number of sites times the duration of one migration) | Avoids the surprise of a migration lasting several hours | 40 sites at 3 minutes each is a two-hour loop |
| Keep a rollback path per site | A failing site does not block the others | Back up each site before migrating it |

## The risks of the pattern

Sharing turns each local problem into a potentially collective one:

| Risk | Mechanism | Defense |
|---|---|---|
| An update touches all the sites | A faulty deployment breaks the N sites at once | Progressive rollout (a pilot site, then batches); testing on a copy; a rollback prepared (see [progressive updates](/?c=infrastructure-devops&s=kubernetes&p=autoscaling-et-rolling-updates)) |
| A code flaw touches the whole fleet | The code is identical everywhere: an injection or an access flaw exploitable on one site is exploitable on all of them | Quick security updates; limited SQL rights; data isolation (variants A or C); monitoring per site |
| A "noisy" site slows the others down | A very busy site (campaign, bot, mass import) consumes the processor, the memory or the connections of the shared database: this is the effect of the **noisy neighbor** | Quotas per site; rate limiting (see [overload and application-level denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)); moving the site out of the fleet (see below) |
| Saturated database connections | Each process opens connections: multiplied by the number of sites, the limit of the database is exceeded | A shared [connection pool](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#connection-pooling) (a set of connections already open and reused); connections opened on demand; a cap per site |
| Data leak between sites | A query that forgets the prefix or the schema, a cache key without a site identifier | A single function builds the table names; code review; an automatic non-mixing test |
| Mixed-up cache | Two sites write under the same key (`cart:42`) in the same cache server | Prefix all the keys with the site (`boutique:cart:42`), see [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| Sessions shared through a cookie that is too broad | A cookie created for the parent domain (`.groupe.example`) is sent to all the sub-sites | One cookie per host name, with no domain attribute; see [sessions and cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Scheduled tasks that are too heavy | A task that loops over 40 sites takes 40 times as long; a slow site delays the following ones | A job split per site, run in parallel with a cap |
| Unreadable logs | Impossible to know which site causes a problem | Every log line always contains the identifier of the site (see [log aggregation](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)) |

### The arithmetic of connections

A database accepts only a limited number of simultaneous connections. If each process of the application opens a connection **per site**, the total grows like a product. With example figures (invented): 6 servers, 8 processes per server, 40 sites, and a database that accepts 200 connections.

| Organization | Calculation | Connections in the worst case |
|---|---|---|
| One shared database (variants B and C), one connection per process | 6 × 8 | 48 |
| One database per site (variant A), one connection opened on demand per site served | 6 × 8 × 40 | 1,920 |
| The same variant A with a shared pool capped at 100 connections | cap | 100 |

Variant A, the most isolated one, is the one that saturates first: without a pool or a cap, 1,920 possible connections against 200 accepted means connection refusals at the first rush. Scaling the application servers (adding machines with [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge)) multiplies the first factor again: **adding a server increases the number of connections that the database must support**, and this must be anticipated.

### When a site must leave the fleet

A site whose traffic far exceeds that of the others poses the same problem as the "celebrity account" of the [news feed](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out): treating it like the others costs everyone dearly. The remedy is comparable, a **hybrid model**: most small sites stay in the shared fleet, and the giant site gets its own database, or even its own servers, while still running **the same code**. This is an argument for the configuration of a site deciding where its data lives (and not the code), so that such a move only requires a settings change.

## When to choose this pattern

The multisite pattern is not the only way to serve several sites or several clients:

| | One installation per site | Multisite (this chapter) | A single installation, a "site" column |
|---|---|---|---|
| Principle | Each site has its own complete deployment (code, database, servers), for example one [container](/?c=infrastructure-devops&s=docker&p=concepts-de-base) per site | One code, N configurations, N sets of data | One technical site; each row of each table carries the identifier of the **tenant** (the client or the brand it belongs to) |
| Isolation | Maximal | Good to medium, depending on the variant | Weak: everything depends on a `WHERE site = ...` (the SQL clause that filters rows) never being forgotten |
| Cost per site | High | Medium | Low |
| Updates | N deployments, but independent and can be staggered | One deployment for the code, N migrations | One deployment, one migration |
| Customizing a site | Free | Through configuration, or extensions enabled per site | Limited |
| When to use it | Few sites, strong autonomy or legal constraints | Many similar sites, one team that wants a single code | Very many identical tenants (thousands), isolation ensured by the code |

The multisite pattern is justified when the sites **are very alike** (same features, same update cycles) and when one team manages them. It is less justified when the sites diverge in their features (the code ends up full of "if this site..."), when contractual or legal obligations require a strict separation (hosting in different countries, for example), or when independence of the update dates is a requirement of each site.

## A CMS example: Drupal

> **This example is not the subject of the chapter.** The pattern described above applies to any software. Drupal is given here only to show a real implementation of this pattern: it is a [content management system](https://www.drupal.org/docs) (*CMS*, short for *Content Management System*, software that lets you publish and organize pages without writing them by hand) written in [PHP](/?c=langages&s=php&p=syntaxe) that, by design, can serve several sites from a single code base. The names and behavior described here are checked against the Drupal 11.x source code.

Drupal keeps its sites in a `sites/` folder next to the common code. Each site has its own subfolder, whose files play the roles of the table of the pattern:

| Element of the pattern | Implementation in Drupal |
|---|---|
| One shared code | A single copy of the files of Drupal and of its modules |
| Table "host name to site" | A `sites/sites.php` file that associates an address with a subfolder; without it, Drupal always serves `sites/default` |
| Configuration of a site | A `settings.php` file in the subfolder of the site |
| Files specific to the site | A files folder in the subfolder of the site |
| Database of the site | Set in `settings.php`: a database of its own, or a shared database with a **table prefix** |

The folder tree looks like this:

```text
 project root
  ├── (shared code of the application and its modules)
  └── sites/
        ├── sites.php            <- address to subfolder matches
        ├── default/             <- default site
        ├── boutique/
        │     ├── settings.php   <- database, prefix, settings of the "boutique" site
        │     └── files/         <- files uploaded to this site
        └── blog/
              ├── settings.php
              └── files/
```

The `settings.php` file of a site declares the connection to the database and, optionally, the prefix. Here is a minimal version, written for this chapter (invented names); `$databases` is a PHP **array** (a list of name-value pairs) whose keys describe the connection (`mysql` designates [MySQL](https://dev.mysql.com/doc/), a database software):

```php
<?php

// Connection settings for the database of the "blog" site, in the $databases array
$databases['default']['default'] = [
  // Database name: a database of its own for the site (variant A of this chapter)
  'database' => 'blog_db',
  // Access account for the database, limited to this database
  'username' => 'blog_user',
  // getenv reads an environment variable: the password is not written in the file
  'password' => getenv('BLOG_PASSWORD'),
  // Address of the database server
  'host' => 'base.interne.example',
  // Database engine used (MySQL here)
  'driver' => 'mysql',
  // Table prefix: empty here; with a shared database (variant B), 'blog_'
  'prefix' => '',
];
```

The file `sites/sites.php` associates a host name with the subfolder that serves it. It does not exist at installation: you copy the example file `sites/example.sites.php` under the name `sites/sites.php`. Without `sites/sites.php`, Drupal always serves the `sites/default` site, and it is this file that activates multisite:

```php
<?php

// The requested host name (key) serves the settings of the "blog" subfolder (value)
$sites['blog.example'] = 'blog';
// Same principle for the boutique: one line per site of the fleet
$sites['boutique.example'] = 'boutique';
```

A host name absent from `sites.php` is not refused: Drupal also falls back to `sites/default`, the "default site" that the chapter advises against. Only the `trusted_host_patterns` setting of `settings.php` (the list of accepted host names) can refuse an unknown name.

What the example illustrates of the pattern: the **code is shared**, the **lookup table** is a simple list, the **configuration** (including the choice between a database of its own and a table prefix) is a file per site, and the **files** have a folder per site. It also illustrates its risks: an update of Drupal or of a module touches all the sites at once, and the command-line administration tools must explicitly name the targeted site (Drupal's command-line administration tool, [Drush](https://www.drush.org/), does so with an option that gives the address of the site), otherwise they act on the wrong one.

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| A "default site" for any unknown name | A fake `Host` header gets the pages or data of another site; a cache can store the mix | A closed list of names; an error (404 or 421) for the rest |
| Building absolute addresses from the `Host` header | An attacker gets their victim to receive a link to the attacker's own domain | Read the official address of the site from the configuration |
| A table prefix typed or modifiable by a visitor | SQL injection through the table name, which a bound parameter cannot protect | A prefix taken from the configuration, checked at startup by a strict pattern |
| Two identical prefixes, or one the beginning of the other (`blog_` and `blog_eu_`, if the pattern allows an internal `_`) | The tables of one site can be confused with those of another | Check at startup that no prefix overlaps another |
| `LIKE 'prefix_%'` to find the tables of a site | The `_` of the pattern means "any character": a backup can take the tables of another site | `ESCAPE`, or better, a list of tables built in the code |
| Cache keys without a site identifier | One site reads the data cached by another | Prefix all the keys with the site |
| Session cookie for the parent domain | A session valid on one site is valid on all the sub-sites | One cookie per host name |
| Migrations of the sites that were not planned to be replayable | A failure at site 3 leaves the fleet in a mixed state, and the rerun fails | An idempotent operation, a log per site |
| One connection per process and per site, without a cap | The connections exceed the limit of the database as soon as traffic rises | A shared pool, opening on demand, a cap per site |
| Logs without a site identifier | We cannot tell which site causes an incident | The identifier of the site in each line |
| Keeping the same regime for a giant site as for the small ones | The site slows down the whole fleet | Move its data and its servers, with the same code |
| Customizing the code for one site | The single code becomes a collection of special cases | Go through the configuration or an extension enabled per site |

## Best practices

| Best practice | Why |
|---|---|
| A closed lookup table "host name to configuration", checked at startup | No unexpected site is served |
| Every difference between sites lives in the configuration, never in the code | The code stays single and testable |
| A single function builds the table names (or chooses the connection) | No query can forget the isolation |
| An automatic test that queries two sites and checks that no data passes from one to the other | A leak is detected before production |
| Choosing the storage variant according to the isolation required, not according to the convenience of the first day | Changing variant later is costly |
| Deploying first on a pilot site, then in batches | A defect does not touch the whole fleet |
| Idempotent migrations, with the version reached recorded per site | A failure in the middle of the process can be recovered |
| Counting the connections (processes × sites) before adding servers | The database does not collapse under the rush |
| Putting the identifier of the site in the logs, the cache keys and the metrics (measurements of activity) | You spot the noisy site and isolate an incident |
| Planning from the start for the exit of a site from the fleet | A giant site moves with a settings change |
| Backing up and testing the restoration site by site | Restoring a site does not involve the others |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | The **multisite pattern** serves N sites from **a single code base**: for each request, the code reads the host name, chooses the configuration of the site in a closed list, then opens the data of **this** site. The code and its updates are **shared**; the configuration, the data, the files, the cache keys and the secrets are **isolated**. The data is stored in three ways: a **database per site** (strong isolation, higher cost and connections), a **table prefix** in a shared database (the cheapest, the weakest isolation, precautions for backups), a **schema per site** (a compromise, depending on the engine). The price of the pattern is a collective risk: an update or a code flaw touches all the sites, a noisy site slows down the others, and the database connections multiply with the number of sites. Drupal is only one example of a product that implements this pattern. |
| **Pitfalls to avoid** | Serving a default site for an unknown name; building addresses from the `Host` header; letting a visitor influence the prefix; prefixes that overlap; finding the tables of a site with an unescaped `LIKE`; cache keys or cookies shared by several sites; a migration that cannot be replayed; one connection per process and per site without a cap; logs without a site identifier; customizing the code for one site. |
| **Best practices** | A closed list of sites, checked at startup; the configuration for every difference between sites; a single function to build the table names or choose the connection; a non-mixing test between two sites; a progressive rollout with a pilot site; idempotent migrations tracked per site; a count of the connections before adding servers; the identifier of the site everywhere (logs, cache, metrics); an exit plan for a site that has become too big. |
