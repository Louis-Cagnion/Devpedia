---
order: 6
---

# Queue, worker and application lock (31/10/2026)

A **task** is a piece of work the program must do: send an email, recalculate a record, purge old data. When a site receives a **request** (the demand sent by a visitor's browser), it can do the task itself before answering, or it can **put it in a queue** and answer straight away, another program doing the task afterwards. This chapter builds the second way, from end to end, in six parts:

| Part | Question it answers | Section |
|---|---|---|
| The **queue** | Where do we store the tasks while they wait? | [The queue](#the-mini-system-for-the-experiment-the-queue) |
| The **worker** | Who runs them, and how do we write several workers without copying the loop? | [Template method](#the-template-method-pattern-a-fixed-skeleton-one-hole-to-fill) |
| The **application lock** | How do we stop two workers from touching the same record at the same time? | [The lock](#the-application-lock-on-an-entity) |
| The **scheduler** | Who enqueues the recurring tasks? | [The scheduler](#the-application-scheduler-a-single-cron-that-decides) |
| The **retries** | What do we do when a task fails, or always fails? | [Retries](#retries-poison-task-and-idempotence) |
| The **supervisor** | Who restarts a worker that has stopped? | [The supervisor](#keeping-a-worker-alive-the-supervisor) |

The code is written in [Python](/?c=langages&s=python) with an [SQLite](https://www.sqlite.org/docs.html) database (a database kept in a single file), queried in [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql). It is a **mini-system invented for the occasion**, small enough to be read in full and run; it shows the principle, it does not replace a real queue manager. A last section shows the same ideas in a framework (a software package that provides the structure of an application), the very widespread [PHP](/?c=langages&s=php) framework [Drupal](https://www.drupal.org), as an **example** only.

| Real tool | What it is | To learn more |
|---|---|---|
| Redis | In-memory database in which a list can serve as a queue | [Redis](/?c=donnees&s=bases-de-donnees&p=redis) |
| RabbitMQ | Program dedicated to message queues, with acknowledgement and retries | [Documentation](https://www.rabbitmq.com/docs) |
| Amazon SQS | Queue service hosted by Amazon Web Services, with no server to manage | [Documentation](https://docs.aws.amazon.com/sqs/) |
| Celery | Python library that stores tasks in a queue and runs them | [Documentation](https://docs.celeryq.dev/) |

The neighbouring chapter on [high-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#queues-and-asynchronous-processing) presents the queue in a few lines as a remedy for a slow request; this one goes into the details of how it works. The [Automation](/?c=infrastructure-devops&s=automatisation) section covers another way to chain tasks: [the visual workflow](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow), where you assemble blocks on a screen instead of writing code.

## Why put work in a queue

Without a queue, the visitor waits for the work to finish. With a queue, the request drops a task in the queue (a few milliseconds) and answers; the heavy work is done behind, at its own pace.

```text
WITHOUT A QUEUE                            WITH A QUEUE

visitor --request--> server                visitor --request--> server
                       | does the work                            | drops the task
                       | (8 seconds)                              v
visitor <--response-- server               visitor <--response-- QUEUE (instant)
        (after 8 s)                                                |
                                                                   v
                                                      worker: does the work
                                                      (8 seconds, behind the scenes)
```

| Need | Without a queue | With a queue |
|---|---|---|
| **Answer fast** | The request lasts as long as the work | The request lasts only as long as a drop-off |
| **Absorb a spike** | 1,000 sends at once overwhelm the server | The 1,000 tasks wait, and 2 or 3 workers process them at a steady rate |
| **Replay a failure** | The failed work is lost, or the visitor sees an error | The task goes back in the queue and is retried later |
| **Survive a restart** | Work held in memory disappears | The queue is stored (here in the database): the tasks wait for the worker to come back |
| **Separate the rhythms** | One slow email send slows down the whole site | Each kind of task has its own workers |

The price to pay: the result is no longer immediate (you must tell the user, or let them check a status), the system has one more part to watch, and a task can be run **more than once** (see [Retries](#retries-poison-task-and-idempotence)).

## Producer, queue and worker

Three roles share the work:

```text
  PRODUCER                QUEUE                          WORKER
 (enqueues)              (keeps, in order)              (executes)

 web request  --+        +---------------------+        +--> worker A
 scheduler    --+------> | task 1              | -----> |
 other worker --+        | task 2              |        +--> worker B
                         | task 3  ...         |
                         +---------------------+
                          first in, first out
```

| Role | Definition | Example |
|---|---|---|
| **Producer** | Anything that enqueues a task | The code that handles a form; the scheduler |
| **Queue** (*queue*) | An ordered list where you add at one end and take from the other: the first to arrive is the first served | A table in a database, a dedicated service |
| **Worker** | A [process](/?c=langages&s=c&p=processus) (a program being run) that loops: it takes a task, processes it, and starts again | The `lancer_worker.py` script below |
| **Scheduler** (*scheduler*) | A producer that enqueues tasks at fixed times | See [the scheduler](#the-application-scheduler-a-single-cron-that-decides) |
| **Supervisor** | A program that restarts a worker that has stopped | [`systemd`](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [`supervisord`](https://supervisord.org/) |

The processing is said to be **asynchronous**: the one who enqueues does not wait for the result. A task goes through four states:

```text
                 take                       ack
 waiting ------------------> running -------------------> done
     ^                           |
     |  failure, or lock refused |  too many failures
     +---------------------------+--------------------------> dead
```

| State | Meaning |
|---|---|
| `waiting` | Enqueued, nobody has taken it yet (or it came back after a failure) |
| `running` | A worker has taken it and is processing it |
| `done` | The worker has **acked**: it confirms the task is finished (the row stays in the database, but nobody takes it again) |
| `dead` | The task has failed too many times: it is set aside so that a person can look at it |

## The mini-system for the experiment: the queue

The files of the experiment, all plain Python you can read in any editor. They go in **one same folder**; the first line of each code block below (`# file: ...`) gives the name of the file to create:

| File | Role |
|---|---|
| `fileq.py` | The SQL schema of the tables, two clocks, opening the database |
| `file_attente.py` | The queue: enqueue, take, ack, postpone, give up |
| `verrou.py` | The lock with an expiry |
| `worker.py` | The skeleton of a worker (template method) |
| `recalculateur.py` | A concrete worker |
| `planificateur.py` | The application scheduler |
| `demo.py` | Six scenes that run the whole system |
| `deposer_taches.py` | Creates a database and enqueues three tasks in it, before launching the real worker |
| `lancer_worker.py` | The loop of a real worker, for the supervisor |

In the code, the blocks between `"""` (triple quotes) placed at the start of a function or a class are **docstrings**, documentation texts: `@brief` summarizes what the element does, `@param` describes an argument, `@returns` the value it returns. Lines that start with `#` are comments, ignored when the code runs.

First building block: the schema and the clocks. The **fake clock** (`Clock`) is the trick that makes the experiment repeatable: instead of really waiting 30 seconds, we advance a counter.

```python
# file: fileq.py
# sqlite3: Python module that drives an SQLite database (a database kept in a file)
import sqlite3
# time: Python module that gives the system time
import time

# SCHEMA: the SQL text that creates the four tables (a table = a grid of rows)
SCHEMA = """
-- (two dashes: SQL comment) tasks: the queue; one row per task to do
-- CREATE TABLE IF NOT EXISTS: creates the table only if it does not exist yet
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,                    -- INTEGER: whole number; unique number
    key TEXT NOT NULL,                         -- TEXT: text; NOT NULL: mandatory
    action TEXT NOT NULL,                      -- what to do: "recalculate"
    state TEXT NOT NULL DEFAULT 'waiting',     -- DEFAULT: starting value
    tries INTEGER NOT NULL DEFAULT 0,          -- number of attempts already started
    available_at INTEGER NOT NULL DEFAULT 0    -- not before this moment (seconds)
);
-- locks: one row per key currently reserved
CREATE TABLE IF NOT EXISTS locks (
    key TEXT PRIMARY KEY,                      -- the reserved key; PRIMARY KEY = unique
    owner TEXT NOT NULL,                       -- the name of the worker that reserved it
    expires_at INTEGER NOT NULL                -- moment when the reservation ends
);
-- schedule: the recurring tasks that the scheduler must enqueue
CREATE TABLE IF NOT EXISTS schedule (
    action TEXT PRIMARY KEY,                   -- the name of the recurring task
    every INTEGER NOT NULL,                    -- the interval, in seconds
    next INTEGER NOT NULL                      -- the next due date
);
-- results: what the workers produce, one row per processed task
CREATE TABLE IF NOT EXISTS results (
    task INTEGER PRIMARY KEY,                  -- the task number
    text TEXT NOT NULL                         -- the result
);
"""


class Clock:
    """
    @brief Fake clock: time is advanced by hand, without waiting.
    """

    def __init__(self):
        # __init__ is the constructor: it prepares the new object; t = current time (s)
        self.t = 0

    def now(self):
        # returns the current time
        return self.t

    def advance(self, seconds):
        # moves the time forward without really waiting
        self.t += seconds


class RealClock:
    """
    @brief System clock, in whole seconds.
    """

    def now(self):
        # time.time() gives the seconds elapsed since 1970; int() keeps only the whole seconds
        return int(time.time())


def open_db(path):
    """
    @brief Opens the SQLite database and creates the tables if they are missing.

    @param path: text, path of the database file

    @returns: a connection in automatic commit mode
    """
    # isolation_level=None: each request is committed on its own, right away
    # timeout=5: if the file is busy, we wait up to 5 s before failing
    base = sqlite3.connect(path, isolation_level=None, timeout=5)
    # row_factory: lets us read a column by its name (row["key"])
    base.row_factory = sqlite3.Row
    # runs the SQL text that creates the tables
    base.executescript(SCHEMA)
    return base
```

The queue itself. A **class** (`class Queue`) groups functions (called **methods**) and data; `self` designates the current object (see [object-oriented programming in Python](/?c=langages&s=python&p=poo)). Values in parentheses, such as `(key, action)`, form a **tuple**, a frozen list (see [lists and tuples](/?c=langages&s=python&p=listes-et-tuples)).

```python
# file: file_attente.py
class Queue:
    """
    @brief The queue: enqueue, take, ack, postpone, give up.
    """

    # VISIBILITY_DELAY: a task taken reappears if nobody acks it within 30 s
    VISIBILITY_DELAY = 30

    def __init__(self, base, clock):
        # base: the SQLite connection; clock: the source of time
        self.base = base
        self.clock = clock

    def enqueue(self, key, action):
        # INSERT adds a row; each "?" takes, in order, a value from the tuple
        self.base.execute(
            "INSERT INTO tasks (key, action) VALUES (?, ?)", (key, action)
        )

    def take(self):
        """
        @brief Reserves the oldest due task, in a single query.

        @returns: a row of the tasks table, or None if nothing is due
        """
        now = self.clock.now()
        cursor = self.base.execute(
            # UPDATE changes the chosen row: it becomes running, one more try,
            # and its reappearance date is pushed back by 30 s (* = all the columns)
            "UPDATE tasks SET state = 'running', tries = tries + 1,"
            " available_at = ? WHERE id = (SELECT id FROM tasks"
            # candidates: waiting, or running but left without an ack
            " WHERE state IN ('waiting', 'running') AND available_at <= ?"
            # ORDER BY id LIMIT 1: the oldest; RETURNING gives back the changed row
            " ORDER BY id LIMIT 1) RETURNING *",
            (now + self.VISIBILITY_DELAY, now),
        )
        # fetchall() reads the rows returned (zero or one here)
        rows = cursor.fetchall()
        return rows[0] if rows else None

    def ack(self, task_id):
        # task succeeded: state done, no delay, no try given back
        self._change(task_id, "done", 0, 0)

    def postpone(self, task_id, delay, give_back_try):
        # back into the queue, invisible for "delay" seconds
        self._change(task_id, "waiting", delay, give_back_try)

    def give_up(self, task_id):
        # poison task: state dead, never taken again
        self._change(task_id, "dead", 0, 0)

    def _change(self, task_id, state, delay, give_back_try):
        # the "_" before the name marks a method internal to the class
        self.base.execute(
            "UPDATE tasks SET state = ?, available_at = ?,"
            " tries = tries - ? WHERE id = ?",
            (state, self.clock.now() + delay, give_back_try, task_id),
        )
```

Everything happens in `take()`. If worker A read the oldest task (`SELECT`) and then marked it "running" (`UPDATE`) in two separate queries, worker B could read it between the two and take it too. Here, **a single query** chooses and marks: an operation is said to be **atomic** when it runs as one block, with no other operation able to slip in between. SQLite serializes writes, so two simultaneous `take()` calls follow each other and never mix.

| Step of `take()` | What happens | Why |
|---|---|---|
| `WHERE state IN ('waiting', 'running') AND available_at <= ?` | Candidates: the due tasks, plus those "running" whose delay has passed | A task abandoned by a crashed worker **reappears** |
| `ORDER BY id LIMIT 1` | We keep the oldest | First come, first served |
| `SET state = 'running', tries = tries + 1, available_at = ?` | It is reserved for 30 s | The other workers no longer see it during this **visibility delay** |
| `ack()` | State `done` | Without an ack, the task comes back: never a silent loss |

Several processes can use the database at once here because SQLite locks the file for the length of a write; `timeout=5` means "wait up to 5 seconds if the file is busy". The words `RETURNING` and `ON CONFLICT` require a recent version of SQLite (`python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` prints yours; see [the RETURNING clause](https://www.sqlite.org/lang_returning.html) and [the upsert](https://www.sqlite.org/lang_upsert.html), "insert, or update if the row already exists"). In a real deployment, one usually uses a dedicated service or a server database; the principle stays the same.

## The template method pattern: a fixed skeleton, one hole to fill

A **design pattern** is a proven solution to a structural problem that comes up often. The **template method** applies here: all workers run the **same sequence of steps** (take, lock, process, ack or retry, release), and only the "process" step changes. Rather than copying the loop into each worker (and forgetting the lock in one of them), a **base class** fixes the skeleton, and each **child class** only provides the step that varies (see [inheritance in Python](/?c=langages&s=python&p=poo#inheritance)).

```text
Worker.one_turn()     <- skeleton, written ONCE
  1. take a task
  2. take the lock on its key
  3. self.process(task)     <- the hole: defined by the child class
  4. ack, or retry / give up
  5. release the lock
```

The skeleton uses the `try` / `except` / `else` / `finally` block (see [error handling in Python](/?c=langages&s=python&p=gestion-des-erreurs)): `try` attempts the work, `except` runs if it fails, `else` if it succeeds, `finally` in all cases. It also uses `raise`, which triggers an error by hand.

```python
# file: worker.py
class Worker:
    """
    @brief Skeleton of a worker. The child classes provide process().
    """

    # MAX_TRIES: after 3 failures, the task is given up
    MAX_TRIES = 3
    # LOCK_DURATION: the lock expires by itself after 20 s
    LOCK_DURATION = 20

    def __init__(self, name, queue, lock, clock):
        # name: identity of the worker; queue, lock, clock: its three tools
        self.name = name
        self.queue = queue
        self.lock = lock
        self.clock = clock

    def process(self, task):
        # raise triggers an error; NotImplementedError = "not written yet":
        # the base class cannot do the work, the child class must override process()
        raise NotImplementedError("the child class must define process()")

    def say(self, text):
        # f"...": the {...} are replaced by their value; :>3 right-aligns on 3 characters
        print(f"[t={self.clock.now():>3}] {self.name}: {text}")

    def one_turn(self):
        """
        @brief One turn: take, lock, process, ack or retry.

        @returns: False if the queue was empty, True otherwise
        """
        # 1. read the queue
        task = self.queue.take()
        if task is None:
            return False
        task_id, key = task["id"], task["key"]
        # 2. lock on the key; refused: we postpone by 5 s and give the try back
        if not self.lock.take(key, self.name, self.LOCK_DURATION):
            self.say(f"task {task_id}, {key} is locked, postponing")
            self.queue.postpone(task_id, delay=5, give_back_try=1)
            return True
        try:
            # 3. the work: the only part that changes from one child class to another
            self.process(task)
        except Exception as error:
            # catches any error and names it "error"
            # 4a. failure: retry later, or give up
            self._failure(task, error)
        else:
            # 4b. success: we ack, the task will not come back
            self.queue.ack(task_id)
            self.say(f"task {task_id} ({task['action']}) done")
        finally:
            # 5. in every case, we release the lock
            self.lock.release(key, self.name)
        return True

    def _failure(self, task, error):
        # tries: number of attempts already made, this one included
        task_id, tries = task["id"], task["tries"]
        if tries >= self.MAX_TRIES:
            # too many failures: the task goes to the "dead" state
            self.queue.give_up(task_id)
            self.say(f"task {task_id} given up after {tries} tries: {error}")
            return
        # the wait doubles at each failure (2 ** n = 2 to the power n): 10 s, 20 s, 40 s...
        # with MAX_TRIES = 3, the 3rd wait (40 s) does not exist: the 3rd failure gives up
        wait = 10 * 2 ** (tries - 1)
        self.queue.postpone(task_id, delay=wait, give_back_try=0)
        self.say(f"task {task_id} failed (try {tries}), retry in {wait} s")
```

The child class only has its own work to write:

```python
# file: recalculateur.py
# imports the Worker class from the file worker.py
from worker import Worker


class Recalculator(Worker):
    """
    @brief Concrete worker: it only writes process().
    """

    def __init__(self, name, queue, lock, clock, during=None):
        # super() calls the constructor of Worker; during simulates a long job
        super().__init__(name, queue, lock, clock)
        self.during = during

    def process(self, task):
        # a "corrupted" action simulates data that always makes the work fail
        if task["action"] == "corrupted":
            raise ValueError("unreadable data")
        self.say(f"handles {task['action']} on {task['key']}")
        # moment when another worker may go (used in the demonstration)
        if self.during:
            self.during()
        # INSERT OR REPLACE: replaying the task overwrites the same row (idempotence)
        self.queue.base.execute(
            "INSERT OR REPLACE INTO results (task, text) VALUES (?, ?)",
            (task["id"], f"{task['action']} done on {task['key']}"),
        )
```

What matters in `one_turn()`: the `finally` **always releases the lock**, whether the processing succeeds or fails.

| Fixed by the base class | Provided by the child class |
|---|---|
| Reading the queue | The work (`process`) |
| Taking and releasing the lock | Nothing else |
| Ack, number of tries, wait between tries, giving up | |
| Event log | |

The principle has a general name: **inversion of control**. It is no longer your code that drives the sequence of steps; the skeleton calls your code at the right moment (see [inversion of control and extension points](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)). When the framework itself finds the child classes available, you get a [plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins).

## The application lock on an entity

An **entity** is data that has its own identity and can be named: here a **record** (a database row with its number). Two different tasks can target the same record ("recalculate record 7" and "send an email about record 7"); if two workers process them at the same time, one can overwrite the other's work. The script below replays the scene: two workers read a view counter, and each adds 1.

```python
# file: compteur.py
# os.path.join builds a path; sqlite3 drives SQLite; tempfile makes a folder
import os
import sqlite3
import tempfile

# two connections to the same database: two workers working at the same time
# (isolation_level=None: each request is committed right away)
path = os.path.join(tempfile.mkdtemp(), "compteur.db")
a = sqlite3.connect(path, isolation_level=None)
b = sqlite3.connect(path, isolation_level=None)
# a record number 7 whose view counter is 0
a.execute("CREATE TABLE record (id INTEGER PRIMARY KEY, views INTEGER)")
a.execute("INSERT INTO record VALUES (7, 0)")

# A reads the counter (0), then B reads it too (0) before A has written
# fetchone() reads one row of the result; [0] takes its first column
read_by_a = a.execute("SELECT views FROM record WHERE id = 7").fetchone()[0]
read_by_b = b.execute("SELECT views FROM record WHERE id = 7").fetchone()[0]
# each writes "what it read + 1": B overwrites the work of A
a.execute("UPDATE record SET views = ? WHERE id = 7", (read_by_a + 1,))
b.execute("UPDATE record SET views = ? WHERE id = 7", (read_by_b + 1,))
# two additions took place, so the counter should be 2
final = a.execute("SELECT views FROM record WHERE id = 7").fetchone()[0]
print(f"final value: {final} (expected: 2)")

# SELECT ... FOR UPDATE (row lock of other databases) does not exist in SQLite
try:
    a.execute("SELECT views FROM record WHERE id = 7 FOR UPDATE")
except sqlite3.OperationalError as error:
    print(f"SQLite refuses: {error}")
```

Output obtained:

```text
final value: 1 (expected: 2)
SQLite refuses: near "FOR": syntax error
```

Two additions, one count: this is a **lost update**. The second line shows that the row lock `SELECT ... FOR UPDATE`, which other databases offer, does not exist in SQLite. So we build an **application lock**: a reservation managed by our own code, here in a `locks` table.

A **lock** (or *mutex*, for *mutual exclusion*) guarantees that only one actor at a time holds a resource; the same word exists between [threads](/?c=langages&s=c&p=threads) within one program. Here the resource is a **key** (`"record:7"`) and the actors are workers, hence separate processes. Our lock has an **expiry**: the reservation ends by itself after `duration` seconds.

```python
# file: verrou.py
class Lock:
    """
    @brief Lock stored in the database, with an expiry date.
    """

    def __init__(self, base, clock):
        # base: the SQLite connection; clock: the source of time
        self.base = base
        self.clock = clock

    def take(self, key, owner, duration):
        """
        @brief Takes the lock if the key is free or if the old lock has expired.

        @param key: text, what we lock ("record:7")
        @param owner: text, name of the worker
        @param duration: integer, seconds before expiry

        @returns: True if the lock is ours, False if someone else holds it
        """
        now = self.clock.now()
        cursor = self.base.execute(
            # we try to insert the row: it succeeds only if the key is absent
            "INSERT INTO locks (key, owner, expires_at)"
            # key already present (ON CONFLICT): we take over the row (excluded = the
            # row we tried to insert), but...
            " VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET"
            " owner = excluded.owner,"
            # ... only if the old lock has expired; otherwise nothing changes
            " expires_at = excluded.expires_at WHERE locks.expires_at <= ?",
            (key, owner, now + duration, now),
        )
        # rowcount: number of rows touched; 1 = lock obtained, 0 = refused
        return cursor.rowcount == 1

    def release(self, key, owner):
        # we delete ONLY our own lock: if another worker has taken it over, we leave it alone
        self.base.execute(
            "DELETE FROM locks WHERE key = ? AND owner = ?",
            (key, owner),
        )
```

| Locking mechanism | Scope | Limit |
|---|---|---|
| `flock` on a file (see [cron and `flock`](/?c=langages&s=bash&p=automatisation-cron#avoiding-concurrent-runs-with-flock)) | A single machine | Useless as soon as the workers run on several servers |
| Row lock of the database (`SELECT ... FOR UPDATE` in the databases that offer it) | The row, for the length of a transaction (a group of operations committed as one block) | Tied to a transaction: poorly suited to a long job |
| **Application lock in a table, with an expiry** (our case) | Every machine that can see the database | You must manage the expiry yourself |
| External lock service | All the machines | One more part to run |

### The risk of a lock that is never released

If the worker crashes while holding the lock, nobody releases it. Without an expiry, the record stays blocked **forever**. That is the reason for `expires_at`. But the duration must be chosen with care:

| Lock duration | Danger |
|---|---|
| **Too short** (less than the work) | The lock expires while the worker is still working: a second worker gets in, and both change the record |
| **Too long** | After a crash, the record stays untouchable for a long time |
| **Just right** (a little more than the worst case of the work) | The compromise; we complete it with an **idempotent** task (see below) so that even an exceptional overlap does no damage |

For a job whose duration varies a lot, the lock can be **renewed** (push `expires_at` back) during the work; one can also give each take an increasing number (a **fencing token**) that the database checks on write, to refuse a worker that has become too slow. Our experiment does neither.

## The application scheduler: a single cron that decides

[`cron`](/?c=langages&s=bash&p=automatisation-cron) is the system program that runs a command at fixed times. Writing one line in the **crontab** (the file where you list the commands of `cron`) per recurring task of the application has drawbacks: the system ignores the application's data, each new task requires access to the server, and nothing stops two runs from overlapping. The **application scheduler** reverses the approach: the system runs only **one** script, every minute, and it is the application that decides, from a `schedule` table, which tasks are **due** (have reached their due date).

```text
 crontab:  * * * * *  /usr/bin/python3 /srv/app/tick.py      (ONE line)
                  |
                  v
          tick(): reads the schedule table
                  |   "purge: every 60 s, next due date = t"
                  v
          for each due row: advance its due date, enqueue a task
                  |
                  v
               QUEUE  ->  workers
```

| Approach | Who knows the calendar | Adding a recurring task |
|---|---|---|
| One `crontab` line per task | The system | Edit the crontab on each server |
| **Application scheduler** | The application (`schedule` table) | Insert a row in the database |

In the following code, the `for` loop (see [Python loops](/?c=langages&s=python&p=boucles)) repeats its block once for each element of a list.

```python
# file: planificateur.py
class Scheduler:
    """
    @brief Launched by cron: enqueues the tasks that have reached their due date.
    """

    def __init__(self, base, queue, clock):
        # base: the SQLite connection; queue: where to enqueue; clock: the source of time
        self.base = base
        self.queue = queue
        self.clock = clock

    def tick(self):
        """
        @brief One pass: finds the due tasks and enqueues each one once.
        """
        now = self.clock.now()
        # the recurring tasks whose due date has come
        due = self.base.execute(
            "SELECT action, every FROM schedule WHERE next <= ?",
            (now,),
        ).fetchall()
        # for: one turn of the loop per due task, "row" being the task of the turn
        for row in due:
            # we advance the due date FIRST: if two schedulers run, only one wins
            cursor = self.base.execute(
                "UPDATE schedule SET next = ? WHERE action = ?"
                " AND next <= ?",
                (now + row["every"], row["action"], now),
            )
            # one row modified = we are the ones who advanced the due date: we enqueue
            if cursor.rowcount == 1:
                self.queue.enqueue(row["action"], row["action"])
                print(f"[t={now:>3}] scheduler: enqueues {row['action']}")
```

Three details matter. First, the scheduler **only enqueues**; it does not do the work, so it finishes in an instant and cannot spill over into the next run. Then, the due date is advanced **before** enqueuing, by an `UPDATE ... WHERE next <= ?` whose `rowcount` we check: if two runs overlap, only one modifies the row and enqueues, while the other sees `0` and does nothing. Last, `next = now + interval` means that after a machine outage, the missed task is enqueued **once**, not ten times.

## The full experiment, scene by scene

`demo.py` runs six scenes, each on a fresh database. Here is the file (the `import` statements are explained in [Python modules](/?c=langages&s=python&p=modules-et-environnements)):

```python
# file: demo.py
# os.path.join builds a path; tempfile creates temporary folders
import os
import tempfile

# "from X import Y": imports Y from the file X.py of the experiment
from file_attente import Queue
from fileq import Clock, open_db
from planificateur import Scheduler
from recalculateur import Recalculator
from verrou import Lock


def world():
    """
    @brief Creates a new database, a clock, a queue and a lock.

    @returns: the quadruple (base, clock, queue, lock)
    """
    # mkdtemp() creates a new temporary folder; the database lives there for the experiment
    base = open_db(os.path.join(tempfile.mkdtemp(), "essai.db"))
    clock = Clock()
    return base, clock, Queue(base, clock), Lock(base, clock)


def show_tasks(base):
    # one row per task (* = all the columns); :<8 left-aligns on 8 characters
    for t in base.execute("SELECT * FROM tasks ORDER BY id"):
        print(f"  task {t['id']} {t['key']:<8} {t['action']:<13} {t['state']:<11}"
              f" tries={t['tries']}")


print("--- Scene 1: the scheduler ---")
base, clock, queue, lock = world()
# a recurring task: "purge", every 60 s, due from instant 0
base.execute("INSERT INTO schedule VALUES ('purge', 60, 0)")
scheduler = Scheduler(base, queue, clock)
# three cron passes, 30 s apart: at instants 0, 30 and 60
# range(3) gives 0, 1, 2: three turns; "_": the turn number, which we ignore
for _ in range(3):
    scheduler.tick()
    clock.advance(30)

print("--- Scene 2: two workers, the same record ---")
base, clock, queue, lock = world()
# three tasks: two on record 7, one on record 8
queue.enqueue("record:7", "recalculate")
queue.enqueue("record:7", "send_mail")
queue.enqueue("record:8", "recalculate")
b = Recalculator("B", queue, lock, clock)
# lambda: a small nameless function; while A "works", B makes two turns
a = Recalculator("A", queue, lock, clock, during=lambda: (b.one_turn(), b.one_turn()))
# A takes task 1 (record 7); B passes by in the meantime
a.one_turn()
# 6 s later, the task pushed back by B is available again
clock.advance(6)
b.one_turn()
show_tasks(base)

print("--- Scene 3: a worker crashes while holding the lock ---")
base, clock, queue, lock = world()
queue.enqueue("record:9", "recalculate")
# worker C reserves record:9 for 20 s, then "crashes" without releasing anything
lock.take("record:9", "C", 20)
b = Recalculator("B", queue, lock, clock)
# B runs into the lock of C and postpones the task
b.one_turn()
# 21 s later, the lock of C has expired: B can work
clock.advance(21)
b.one_turn()

print("--- Scene 4: a worker crashes before acking ---")
base, clock, queue, lock = world()
queue.enqueue("record:5", "recalculate")
# C takes the task, then stops without acking it or postponing it
task = queue.take()
print(f"[t=  0] C: takes task {task['id']}, then stops dead")
# beyond the visibility delay (30 s), the task reappears for B
clock.advance(31)
Recalculator("B", queue, lock, clock).one_turn()
show_tasks(base)

print("--- Scene 5: a poison task ---")
base, clock, queue, lock = world()
queue.enqueue("record:3", "corrupted")
b = Recalculator("B", queue, lock, clock)
# three turns, at instants 0, 10 and 30: the waits of 10 s and 20 s pass
# for step in (0, 10, 20): one turn per value of the tuple, "step" being 0, then 10, then 20
for step in (0, 10, 20):
    clock.advance(step)
    b.one_turn()
show_tasks(base)

print("--- Scene 6: replaying a task ---")
base, clock, queue, lock = world()
queue.enqueue("record:2", "recalculate")
b = Recalculator("B", queue, lock, clock)
b.one_turn()
# we read task 1 again and have it processed a second time, by hand
row = base.execute("SELECT * FROM tasks WHERE id = 1").fetchone()
b.process(row)
# COUNT(*) counts the rows of the results table
n = base.execute("SELECT COUNT(*) FROM results").fetchone()[0]
print(f"rows in results after two runs: {n}")
```

Run with `python3 demo.py`, it writes (output copied as is):

```text
--- Scene 1: the scheduler ---
[t=  0] scheduler: enqueues purge
[t= 60] scheduler: enqueues purge
--- Scene 2: two workers, the same record ---
[t=  0] A: handles recalculate on record:7
[t=  0] B: task 2, record:7 is locked, postponing
[t=  0] B: handles recalculate on record:8
[t=  0] B: task 3 (recalculate) done
[t=  0] A: task 1 (recalculate) done
[t=  6] B: handles send_mail on record:7
[t=  6] B: task 2 (send_mail) done
  task 1 record:7 recalculate   done        tries=1
  task 2 record:7 send_mail     done        tries=1
  task 3 record:8 recalculate   done        tries=1
--- Scene 3: a worker crashes while holding the lock ---
[t=  0] B: task 1, record:9 is locked, postponing
[t= 21] B: handles recalculate on record:9
[t= 21] B: task 1 (recalculate) done
--- Scene 4: a worker crashes before acking ---
[t=  0] C: takes task 1, then stops dead
[t= 31] B: handles recalculate on record:5
[t= 31] B: task 1 (recalculate) done
  task 1 record:5 recalculate   done        tries=2
--- Scene 5: a poison task ---
[t=  0] B: task 1 failed (try 1), retry in 10 s
[t= 10] B: task 1 failed (try 2), retry in 20 s
[t= 30] B: task 1 given up after 3 tries: unreadable data
  task 1 record:3 corrupted     dead        tries=3
--- Scene 6: replaying a task ---
[t=  0] B: handles recalculate on record:2
[t=  0] B: task 1 (recalculate) done
[t=  0] B: handles recalculate on record:2
rows in results after two runs: 1
```

| Scene | What we observe | What it shows |
|---|---|---|
| **1** | The purge is enqueued at `t=0` and `t=60`, not at `t=30` | The scheduler only enqueues what is due |
| **2** | While A works on record 7, B receives task 2 (same record), runs into the lock and postpones it; B then processes record 8, which is not locked; at `t=6`, B finishes task 2 | Two different records are processed in parallel; the same record is processed one after the other |
| **3** | C dies while holding `record:9`; B is refused at `t=0`, then succeeds at `t=21` | The lock expires by itself |
| **4** | C takes the task and disappears without acking; at `t=31`, B takes it again (`tries=2`) | The visibility delay puts the task back in the queue |
| **5** | The `corrupted` task fails at `t=0` (wait 10 s), at `t=10` (wait 20 s), then is given up at `t=30`: state `dead` | Spaced retries, then giving up |
| **6** | The task processed twice leaves only one row in `results` | The write is idempotent |

Scene 2's scenario is **simulated**: the `during` parameter calls B in the middle of A's work, which makes the order of the lines identical at each run. With **real** simultaneous workers, the order of the lines would vary from one run to the next; the simulation freezes it so that it can be read.

## Retries, poison task and idempotence

A task can fail for temporary reasons (network cut, third-party service busy) or lasting ones (unreadable data). The queue must tell the two apart without anyone intervening.

| Retry strategy | Principle | Effect / limit |
|---|---|---|
| Retry at once | Straight back into the queue | Hammers a service that is already in trouble |
| Fixed delay | Always the same wait | All the failures of an outage come back at the same moment |
| **Exponential backoff** | 10 s, 20 s, 40 s...: the wait doubles at each failure (with `MAX_TRIES = 3`, our experiment stops before the 40 s) | Lasting bad tasks wait longer and longer (this is our choice) |
| Exponential backoff with **jitter** | The same, plus a small part of chance | Prevents tasks that failed together from coming back together |

A **poison task** (*poison message*) is a task that fails **at every try**, whatever we do (corrupted data, bug). Without a limit, it would loop and occupy a worker forever. Hence `MAX_TRIES`: after the last try, it moves to the `dead` state (a **dead-letter queue**, in queue vocabulary), and we keep the row so that a person can read it and decide. A queue that piles up dead tasks without an alert hides a problem: their number must be watched.

Third notion, the most important. The queue guarantees that a task is executed **at least once**: if a worker crashes after doing the work but before acking (scene 4), the task comes back and the work is redone. For this second pass to be harmless, the processing must be **idempotent**: doing it again gives the same result as doing it once (see [idempotence in the robustness of batch processing](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)).

| Operation | Idempotent? | Why |
|---|---|---|
| `INSERT OR REPLACE` on the task key (scene 6) | Yes | The second write replaces the first |
| `UPDATE record SET status = 'valid'` | Yes | The result is the same after one or two runs |
| `UPDATE account SET balance = balance + 10` | **No** | Each run adds 10 |
| Sending an email | **No** | Impossible to "unsend"; we send, then we note the send. A crash between the two leaves a possible duplicate: to avoid it, we attach an identifier specific to the task, which the sending service uses, if it allows it, to ignore an identical second request |

| Delivery guarantee | Meaning | Cost |
|---|---|---|
| **At most once** | A task is tried only once, never replayed | A crash loses it |
| **At least once** (our case) | Replayed until it is acked | It can run twice: requires idempotence |

## Keeping a worker alive: the supervisor

A worker is a process that can stop: unexpected error, out of memory, machine restart. You need a **supervisor**, a program whose only job is to start the worker at boot and restart it when it stops. Here is the loop of a real worker. It reacts to **signals**: short messages that the system sends to a process (see [Unix signals](/?c=langages&s=c&p=signaux-unix)).

```python
# file: lancer_worker.py
# signal: Python module that reacts to the signals sent by the system
import signal
# sys: gives access to the command-line arguments (sys.argv)
import sys
# time: provides sleep(), a pause
import time

# each import takes a class or a function from a file of the experiment
# the queue (file_attente.py)
from file_attente import Queue
# the system clock and opening the database (fileq.py)
from fileq import RealClock, open_db
# the concrete worker (recalculateur.py)
from recalculateur import Recalculator
# the lock with an expiry (verrou.py)
from verrou import Lock

# global switch (variable visible everywhere in the file): becomes True
# when the system asks for a stop
stop_requested = False


# function called by Python when a signal is received, with two arguments
def request_stop(number, frame):
    """
    @brief Notes that SIGTERM or SIGINT was received: the loop will finish its turn.

    @param number: integer, number of the signal
    @param frame: object, execution state (not used)
    """
    # global: we modify the variable of the module, not a local copy
    global stop_requested
    stop_requested = True


# SIGTERM: "stop yourself", sent by a supervisor; SIGINT: Ctrl+C on the keyboard
signal.signal(signal.SIGTERM, request_stop)
signal.signal(signal.SIGINT, request_stop)

# the real worker: real clock; sys.argv is the list of the words of the command
# (sys.argv[0]: lancer_worker.py, sys.argv[1]: w.db), hence the path of the database
clock = RealClock()
base = open_db(sys.argv[1])
worker = Recalculator("W1", Queue(base, clock), Lock(base, clock), clock)
# we loop as long as no stop is requested; the current turn always runs to its end
while not stop_requested:
    # empty queue: we sleep 1 s rather than querying the database non-stop
    if not worker.one_turn():
        time.sleep(1)
print("stop requested: running task finished, clean exit")
```

`SIGTERM` means "stop cleanly": the supervisor sends it before a stop or a restart. `SIGINT` is the one the keyboard sends when you press Ctrl+C. The worker does not interrupt in the middle of a task: it notes the request and leaves the loop **after** the current turn.

To see this worker at work, it needs a database that contains tasks. The `deposer_taches.py` script below creates it and enqueues three tasks in it, then ends. It sits in the same folder as the other files of the experiment.

```python
# file: deposer_taches.py
# imports the system clock and open_db(), which creates the database, from fileq.py
from fileq import RealClock, open_db
# imports the class Queue (the task queue) from file_attente.py
from file_attente import Queue

# open_db() creates the file w.db if it does not exist, with its four empty tables
base = open_db("w.db")
# the queue reads the time on the system clock, as the real worker will do
queue = Queue(base, RealClock())
# a "for" loop repeats its block once per value: here, three records
for key in ("record:1", "record:2", "record:3"):
    # enqueue() adds a row to the tasks table, in the waiting state
    queue.enqueue(key, "recalculate")
# COUNT(*) counts the rows of the tasks table; [0] takes the first column
n = base.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
# we print the total to check that the enqueuing took place
print(f"{n} tasks enqueued in w.db")
```

Run with `python3 deposer_taches.py`, it writes `3 tasks enqueued in w.db` (run again, it enqueues three more in the same database). Then, in the same folder, we start the worker as a [background task](/?c=langages&s=bash&p=gestion-des-processus), let it run for a few seconds, then send it `SIGTERM`:

```bash
# the final "&" starts the worker in the background: the terminal stays usable
python3 lancer_worker.py w.db &
# sleep 3: pause of 3 seconds, long enough for the worker to process the three tasks
sleep 3
# $! holds the number (PID, process ID) of the last process started in background
# kill -TERM sends SIGTERM to the process with this number (or kill -TERM <PID>, PID known)
kill -TERM $!
```

In the foreground (without the `&`), the worker keeps the terminal: Ctrl+C stops it in the same way, by `SIGINT`. Measured output, with the time replaced by `...` (it is the number of seconds elapsed since 1970, it changes at each launch):

```text
[t=...] W1: handles recalculate on record:1
[t=...] W1: task 1 (recalculate) done
[t=...] W1: handles recalculate on record:2
[t=...] W1: task 2 (recalculate) done
[t=...] W1: handles recalculate on record:3
[t=...] W1: task 3 (recalculate) done
stop requested: running task finished, clean exit
```

The three tasks are processed in the order they were enqueued, then the worker, the queue being empty, sleeps in one-second pauses until the signal. The final message appears when the loop ends; the program then exits with code 0, that is to say without error (see [exit codes](/?c=langages&s=c&p=exit-et-codes-de-retour)). The command `timeout -s TERM 3 python3 lancer_worker.py w.db` gives the same result: [`timeout`](/?c=langages&s=bash&p=gestion-des-processus#limiting-a-command-s-duration-timeout-and-ctrl-c) runs a program and sends it `SIGTERM` here after 3 seconds. The worker does exit with 0, but `timeout` itself returns 124 to signal that the time limit has been reached.

Two common supervisors. [systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) is the program that starts and watches everything that runs on a modern Linux machine (see also [resource limits with `systemd-run`](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). [supervisord](https://supervisord.org/) is a separate, simpler program that only watches processes; its command-line tool, `supervisorctl`, is used to start, stop and list the processes it watches.

```ini
# queue-worker.service: systemd unit file (in /etc/systemd/system/)
[Unit]
# text shown in the lists of services
Description=Queue worker

[Service]
# system account the worker runs under (never root unless necessary)
User=app
# working folder of the process
WorkingDirectory=/srv/app
# the command to run: absolute paths, as for cron
ExecStart=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/essai.db
# restart the worker if it stops, whatever the reason
Restart=always
# wait 5 s before restarting, so as not to loop at full speed on a failure
RestartSec=5
# give the worker 30 s to finish its task after SIGTERM, then kill it
TimeoutStopSec=30

[Install]
# start this service at the normal boot of the machine
WantedBy=multi-user.target
```

```ini
; queue_worker.conf: section of a supervisord configuration file (often
; placed in /etc/supervisor/conf.d/; see the supervisord documentation)
; a supervised "program"; the name is used by the commands of supervisorctl
[program:queue_worker]
; the command to run
command=/usr/bin/python3 /srv/app/lancer_worker.py /srv/app/essai.db
; working folder and system account
directory=/srv/app
user=app
; start with supervisord, and restart on stop
autostart=true
autorestart=true
; two workers in parallel, named queue_worker_00 and queue_worker_01
numprocs=2
process_name=%(program_name)s_%(process_num)02d
; seconds left after the stop signal before the process is killed
stopwaitsecs=30
; errors go to the same log as the normal output
redirect_stderr=true
stdout_logfile=/var/log/queue_worker.log
```

| Supervisor | Strength | Watch out for |
|---|---|---|
| **systemd** | Already present on most Linux distributions; starts at boot, built-in log | Unit files to write; Linux only |
| **supervisord** | Simple; several identical processes from one line (`numprocs`); works without systemd | To install, and to supervise itself |
| A `cron` that restarts the worker every minute, protected by `flock` | No extra tool | Up to 1 minute without a worker after a stop |

With `numprocs=2`, two workers read the same queue: exactly the case where the lock on the key becomes indispensable. A worker that runs for days can grow in memory; some projects make it exit on purpose after a fixed number of tasks, the supervisor restarting it cleanly.

## The same pattern in Drupal (example)

Drupal is a content management system written in PHP. It already offers every piece of this chapter, under other names. **This section is an example.** The API names below are checked against the Drupal 11.x source code (the `#[QueueWorker]` attribute exists since Drupal 10.3); for another version, consult the documentation (see the [Queue](https://api.drupal.org/api/drupal/core!core.api.php/group/queue/11.x) group of the API and the [LockBackendInterface](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Lock!LockBackendInterface.php/interface/LockBackendInterface/11.x) interface).

| Notion in this chapter | Drupal equivalent |
|---|---|
| Producer + queue | `\Drupal::queue('name')->createItem($data)` enqueues; `claimItem()`, `deleteItem()`, `releaseItem()` take, ack, give back |
| Worker, base class, hole to fill | A **plugin** `QueueWorker` that extends `QueueWorkerBase` and writes `processItem($data)` |
| Application scheduler | `hook_cron()`, called at each run of Drupal's cron (a single `crontab` launches this cron) |
| Worker loop | Drupal's cron empties the queues whose plugin declares a `cron` key (maximum time per run); or `drush queue:run name` ([`drush`](https://www.drush.org/) is Drupal's command-line tool) launched under systemd/supervisord |
| Application lock with expiry | `\Drupal::lock()`, of type `LockBackendInterface`: `acquire($name, $delay)` returns `true` or `false`, `release($name)` releases it |
| Retry | Throwing `RequeueException` releases the item right away: the cron can pick it up again in the same run (to wait before a new attempt, throw `DelayedRequeueException`); throwing `SuspendQueueException` stops the processing of the queue, but only for the current cron run, and the item is released |

PHP notation of the two blocks (see [the syntax](/?c=langages&s=php&p=syntaxe), [object-oriented programming](/?c=langages&s=php&p=poo) and [exceptions](/?c=langages&s=php&p=exceptions)):

| Notation | Meaning |
|---|---|
| `$name` | A variable: the `$` marks it |
| `A::b()` | Call of a function attached to the class `A`, without creating an object |
| `$object->b()` | Call of a method of the object `$object`; `\Drupal::queue('x')->createItem(...)` chains the two |
| `['a' => 7]` | An array in which the key `'a'` holds 7 |
| `foreach ([...] as $id)` | One turn of the loop per element of the array |
| `throw new E()` | Triggers the error `E`, like `raise` in Python |
| `!` | Negation: `!$x` means "not $x" |

The worker (a plugin whose identifier is declared by a PHP attribute, on the model described in [plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)):

```php
<?php

// namespace: the "address" of the class, which matches its folder in the module
namespace Drupal\exemple\Plugin\QueueWorker;

// use: declares the Drupal classes that this file uses
use Drupal\Core\Queue\Attribute\QueueWorker;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Queue\RequeueException;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// the #[...] attribute labels the class as a worker: identifier, displayed title,
// and maximum time (60 s) the cron may spend on this queue per run
#[QueueWorker(
  id: 'exemple_recalculate',
  title: new TranslatableMarkup('Recalculate records'),
  cron: ['time' => 60],
)]
// extends: inherits the skeleton of QueueWorkerBase, the "base class" of the chapter
class RecalculateRecord extends QueueWorkerBase {

  /**
   * @brief Processes one item of the "exemple_recalculate" queue.
   *
   * @param mixed $data: what was enqueued, here ['record_id' => 7]
   */
  // public: callable from outside; mixed: the type of $data is not constrained
  public function processItem($data) {
    // the lock key, built from the record targeted
    $key = 'exemple_record:' . $data['record_id'];
    // Drupal's lock service
    $lock = \Drupal::lock();
    // acquire() returns false if the key is held; 30.0: expiry in seconds
    if (!$lock->acquire($key, 30.0)) {
      // we release the item: it becomes available again right away
      throw new RequeueException();
    }
    try {
      // ... the real work on the record, to be written idempotently ...
    }
    finally {
      // whatever happens, we release the lock
      $lock->release($key);
    }
  }

}
```

The producer, as a `hook_cron`: a function that Drupal's cron calls by naming convention, following the mechanism of [hooks](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension):

```php
<?php

/**
 * @brief Called at each run of Drupal's cron: enqueues the due work.
 */
function exemple_cron() {
  // \Drupal::queue(...) returns the queue object named "exemple_recalculate"
  $queue = \Drupal::queue('exemple_recalculate');
  // three records to recalculate (list made up for the example)
  foreach ([7, 8, 9] as $id) {
    // createItem() enqueues the data; the worker will receive it in $data
    $queue->createItem(['record_id' => $id]);
  }
}
```

The three ideas of the chapter are found again here: a ready-made skeleton (`QueueWorkerBase` plays the role of our `Worker` class, the method the skeleton calls being `processItem`), an expiring lock (the `30.0` given to `acquire` is a duration in seconds), and a retry by exception. The difference lies in the infrastructure: Drupal decides, through its plugins and its cron, **who** calls the worker, whereas our experiment decided it in `lancer_worker.py`.

## Frequently asked questions

| Question | Answer |
|---|---|
| Why not a simple `cron` that runs the work? | `cron` runs a program at fixed times, but it does not retry a failure, does not share a spike out between several workers, and cannot react to a visitor's request |
| When should we switch to a real queue manager? | When the workers run on several machines, when the throughput exceeds what a single database can take in writes, or when ready-made features are needed (priorities, delays, monitoring): see the table of tools at the start of the chapter |
| How do we monitor the queue? | Count the `waiting` and `dead` tasks, and measure the age of the oldest waiting task: if it keeps growing, the workers are down or too slow |
| What do we do with a dead task? | Read it, fix the cause (data or bug), then put it back in the queue: `UPDATE tasks SET state = 'waiting', tries = 0 WHERE id = 1`; or delete it if it is no longer useful |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Reading a task, then marking it, in two queries | Two workers take the same task | One atomic query that chooses and marks |
| Forgetting to ack | The task comes back and is redone forever | Ack after success, in the skeleton |
| Acking **before** processing | A crash loses the task | Ack after the work, and make the work idempotent |
| Non-idempotent processing | A second pass doubles the effect (two emails, two charges) | Write "replace" rather than "add", and note what is already done |
| Lock without expiry | A crash blocks the record forever | `expires_at` on every lock |
| Expiry shorter than the work | Two workers get in together | A duration longer than the worst case, or renewal |
| Releasing a lock you no longer own | You delete another worker's lock | Delete only if `owner` is yourself |
| Lock taken outside the skeleton | A worker forgets to take it | Put it in the base class, with a `finally` |
| Retrying without limit | A poison task loops forever | `MAX_TRIES` and the `dead` state |
| Retrying without wait | We hammer a service that is already down | Exponential backoff, with jitter |
| Dead tasks never looked at | A lasting defect goes unnoticed | Count the dead ones, and alert |
| Scheduler that does the work itself | It spills over into the next run | It only enqueues; advance the due date before enqueuing |
| Two simultaneous scheduler runs | A task is enqueued twice | A conditional `UPDATE` and a test of `rowcount` |
| Worker that does not handle `SIGTERM` | A stop cuts a task in the middle of the work | Finish the current turn, then exit |
| No supervisor | A stopped worker, and the queue grows in silence | `systemd` or `supervisord`, plus an alert on the queue size |
| Queueing everything | Useless complexity for a job of a few milliseconds | Reserve the queue for slow, fragile or spiky jobs |

## Best practices

| Best practice | Why |
|---|---|
| An atomic operation to take a task | No duplicates between workers |
| Ack only after success | No task lost; idempotence absorbs the replays |
| Design every processing step to be idempotent | "At least once" delivery becomes safe |
| Skeleton in a base class, work in the child class | The queue, lock and retry logic exists in only one place |
| Lock with an expiry, released in a `finally`, on the finest possible key (the record, not the whole table) | No lasting block, and maximum parallelism |
| Exponential wait, bounded number of tries, dead queue watched | Temporary failures clear up, lasting defects show |
| A single `cron` that runs the scheduler, the calendar in the database | Adding a recurring task requires no server access |
| A worker that stops cleanly on `SIGTERM`, and a supervisor that restarts it | Deployments and restarts without a cut task |
| Watch the queue length and the age of its oldest task | A failing worker shows before the users do |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A **queue** separates the one who **enqueues** a task (producer) from the one who **runs** it (worker): the request answers fast, spikes drain away, and a failure can be replayed. Taking a task must be **atomic** (one query that chooses and marks), and the **ack** happens only after success: the queue guarantees "at least once", so the processing must be **idempotent**. The **application scheduler** is a single `cron` that reads a table and enqueues the due tasks, advancing the due date first. The **template method** puts the loop (take, lock, process, ack or retry, release) in a base class; the child class only writes `process`. An **application lock** in a table, on a key such as `record:7`, stops two workers from touching the same entity; its **expiry** avoids a block after a crash, but must exceed the duration of the work. A failed task comes back with an **exponential wait**; after `MAX_TRIES`, it becomes **dead**. A **supervisor** (`systemd`, `supervisord`) restarts the workers, which stop cleanly on `SIGTERM`. |
| **Pitfalls to avoid** | Reading then marking in two queries; forgetting to ack, or acking before processing; non-idempotent processing; a lock without expiry, or shorter than the work; releasing someone else's lock; a lock taken outside the skeleton; retries without a limit or a wait; dead tasks ignored; a scheduler that works instead of enqueuing; two scheduler runs with no guard; a worker that ignores `SIGTERM`; no supervisor; queueing a trivial job. |
| **Best practices** | Atomic take; ack after success; idempotence throughout; skeleton in a base class; lock with an expiry, released in a `finally`, on the finest key; exponential wait, bounded tries, dead tasks watched; a single `cron` and a calendar in the database; clean stop on `SIGTERM` and a supervisor; watch the size and age of the queue. |
