---
order: 7
---

# Replicating a source of truth to satellites

Picture a chain of shops: a central catalog describes each item (title, price), and each shop keeps its own copy to answer its customers quickly, even when head office is closed. Whenever a price changes at head office, the shops must know about it. This chapter explains how an application goes about **copying data from one central place to several others**, and above all what happens when a copy cannot be reached. It only assumes the notion of an [HTTP request](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (a message that one program sends to another across the network, which answers with a status code) and that of a [database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) (the software that stores data in tables). The case of several sites built on one code base is described in [One code, several sites: the multisite pattern](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=un-code-plusieurs-sites).

Three words come up everywhere:

| Term | Definition | In the chain of shops |
|---|---|---|
| **Source of truth** | The place that is authoritative: the reference. A piece of data is created and modified there; elsewhere, it is only copied. | The head office catalog |
| **Satellite** | A local copy of the source of truth, kept by another program or another site, which reads it without ever contradicting it. | The catalog of each shop |
| **Application-level replication** | Copying data **through the application's code** (it sends the changes itself), as opposed to database replication, where the database software copies its own tables. | An employee who phones the shops, instead of an automatic photocopier |

A common example: several websites built on the same content management software (a tool for creating and updating a site without coding, such as [Drupal](https://www.drupal.org/docs), free software for publishing websites) each receive the records of a central site. Nothing in this chapter depends on it: the examples are invented and neutral.

## Why not database replication?

[Database replication](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#read-replicas) (read replicas) copies the **whole** database, identically, to a machine that serves reads. It is excellent when the copy is simply extra read capacity. It is not suitable in the following cases, where application-level replication is the choice:

| Situation | Database replication | Application-level replication |
|---|---|---|
| The satellite only wants part of the data (the items, not the customer accounts) | Usually all or nothing (some engines filter by table, at the cost of a heavy configuration) | The code only sends what is useful |
| The satellite has its own structure (other tables, other columns, other keys) | Impossible: the tables are copied identically | The code translates each record to the satellite's structure |
| The satellite adds its own data next to the copy | The copy is read-only | The local data and the copy coexist |
| The systems do not run the same database software | Impossible | An HTTP message goes anywhere |
| We want to apply a business rule (a rule specific to the business, for example refusing a negative price) on arrival | No control over the copy | The satellite runs its own code |

The price to pay: everything the database did on its own (order of changes, recovery after a failure) becomes **your** job. The rest of the chapter is the list of that job.

## The overall diagram

```text
                 +--------------------------+
                 |          SOURCE          |
                 |   (source of truth)      |
                 |  ART-1  LED lamp   v2    |
                 |  ART-2  Chair      v2    |
                 +------------+-------------+
                              |
        one message per change: external id + version + data
              +---------------+---------------+
              |               |               |
              v               v               v
       +-------------+ +-------------+ +-------------+
       | SATELLITE A | | SATELLITE B | | SATELLITE C |
       | local key   | | local key   | | local key   |
       | ART-1 -> 1  | | ART-1 -> 100| | ART-1 -> 500|
       +-------------+ +-------------+ +-------------+
```

The direction is one-way: the source sends, the satellites receive. The three copies carry the **same record** (`ART-1`) under three different **local keys** (1, 100, 500): this is the subject of the section on the external identifier.

## Three ways to propagate a change

When a record changes in the source, three strategies can inform the satellites. A few words first:

- **Consistency** describes how much the copies show the same thing at the same moment. It is **immediate** if, as soon as the change is confirmed, all the satellites have it; it is **eventual** (*eventual consistency*) if the copies end up identical, after a delay.
- **Latency** is the time the person who triggers the operation (here, the user saving a record) waits before getting an answer.
- A [queue](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#queues-and-asynchronous-processing) is a list of tasks to do, left by one program and processed later by another one (the *worker*).

```text
1. SYNCHRONOUS            2. QUEUE                   3. PERIODIC PULL
   (the source calls,        (the source drops         (each satellite
    waits for answers)        a message, moves on)      asks for itself)

 user                      user                      user
     |                         |                         |
     v                         v                         v
 source                    source                    source
   |   |   |                   |                         ^
   v   v   v                   v                         | "anything new
   A   B   C                 [ queue ]                   |  since version 41?"
 (one by one,                  |  |  |                  A   B   C
  answer expected)             v  v  v                (at regular intervals)
                               A  B  C
                           (worker, later)
```

| | Synchronous propagation | Queue | Periodic pull (*pull*) |
|---|---|---|---|
| **Who takes the initiative** | The source, during the request | The source drops a message, a worker delivers it | Each satellite, at its own pace |
| **Consistency** | Immediate if all answer; a gap as soon as one send fails | Eventual: a few seconds | Eventual: the interval between two pulls (minutes, hours) |
| **Latency for the user** | The **sum** of the exchanges with the N satellites | A single write to the queue | None (the satellite works on its own side) |
| **Satellite outage** | The request waits for the maximum delay (*timeout*: the time we agree to wait for a reply before giving up) or fails; a gap appears | The message stays in the queue until the satellite comes back | Nothing is lost: when it returns, the satellite asks for everything it missed |
| **What to add** | A ledger of failed sends (see below) | A queue infrastructure and a worker | On the source side, a way to say "what changed since this version" |
| **Suited when** | Few satellites, reliable ones, and we want to see the change right away | Many satellites, or frequent outages | Very many satellites, or often switched off (a satellite that wakes up catches up) |

The pull requires that each change carry a number that only ever grows (a **version**, or a **cursor**: the last number the satellite has already seen). The satellite asks "give me everything with a number above 41", and the source no longer needs to remember it.

This chapter takes **synchronous propagation** as its running thread: it is the simplest to write, so the most common in the first versions of an application, and the one that shows the most pitfalls. The other two are obtained by moving the step "send to the satellite" elsewhere: into a worker for the queue, into the satellite itself for the pull. Everything else (external identifier, idempotence, replay, reconciliation) applies in the same way to all three.

The choice between pushing early (writing) and assembling late (reading) comes up again in [the news feed](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out), which addresses a neighboring problem: a change that must be made known to many recipients. The overview of the section is in [large-scale design](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=conception-a-grande-echelle).

## The external identifier: finding the same record

Each database gives its rows a **local key** (also called a primary key): a unique number (or a text) that designates a single row, assigned by the database itself when the row is created. Satellite A numbers its items 1, 2, 3; satellite B, which already has other data, starts at 100. The local key therefore means nothing outside its own database.

So that the satellite can tell "this record I am receiving is the one I already have", we send it with each record the key that **the source** gave it: the **external identifier**. The satellite stores it in a separate column and uses it to find its row.

| | Local key | External identifier |
|---|---|---|
| **Who chooses it** | The satellite (its database) | The source |
| **Value for the same record** | Different in each satellite (1, 100, 500) | Identical everywhere (`ART-1`) |
| **Used to** | Link the tables of the satellite together | Find, in the satellite, the record that came from the source |
| **Can it be changed?** | Yes, as long as the satellite stays consistent | No: it is the thread that links the copies |
| **When to use it** | In the satellite's code and queries | In the messages between the source and the satellites |

Without an external identifier, the satellite can only **create** a new row for each message received. Here is what happens when a reply is lost. The code below simulates a naive satellite (written in [Python](/?c=langages&s=python&p=python), whose terms are explained line by line: a **class** groups data and functions, see [object-oriented programming in Python](/?c=langages&s=python&p=poo); an **exception** is an error that can be caught, see [error handling](/?c=langages&s=python&p=gestion-des-erreurs), which also covers `try` / `except`). The basic constructs are in the chapters on [functions](/?c=langages&s=python&p=fonctions) (`def`, `return`), [conditions](/?c=langages&s=python&p=conditions) (`if`, `elif`, `else`), [loops](/?c=langages&s=python&p=boucles) (`for`) and [modules](/?c=langages&s=python&p=modules-et-environnements) (`import`).

```python
# class playing a satellite WITHOUT an external identifier: it numbers records itself
class NaiveSatellite:
    # __init__ prepares a new object (self is the object being created)
    def __init__(self):
        # list of the records received, in arrival order
        self.records = []
        # if True, the "received" reply is lost on the way: the caller does not see it
        self.reply_lost = False

    # receive simulates the reception of a send request
    def receive(self, title):
        # each reception adds a new record, without checking whether it already exists
        self.records.append(title)
        # the record is saved, but the caller only gets the error
        if self.reply_lost:
            # raise triggers the exception: the caller receives it instead of a result
            raise TimeoutError("no reply before the maximum delay")


# creates a satellite without an external identifier
satellite = NaiveSatellite()
# the reply is going to be lost: the send will look like a failure
satellite.reply_lost = True
# trial 1: the source sends the record
try:
    satellite.receive("Desk lamp")
# TimeoutError is raised when the reply does not arrive in time
except TimeoutError as error:
    # the source does not know whether the record arrived: it tries again
    print("trial 1 :", error)
# the reply will be lost again, to show the second send
try:
    # trial 2: same record, sent again out of caution
    satellite.receive("Desk lamp")
# same error as trial 1
except TimeoutError as error:
    # prints the second apparent failure
    print("trial 2 :", error)
# number of records really present in the satellite
print("records in the satellite :", len(satellite.records))
```

Output obtained:

```text
trial 1 : no reply before the maximum delay
trial 2 : no reply before the maximum delay
records in the satellite : 2
```

The source has **twice** received an error, so it sent the record again. But the first reception had succeeded: only the reply had been lost, and the satellite now holds "Desk lamp" twice. A send that fails **does not tell** you whether the satellite applied it: an exceeded delay (*timeout*) is ambiguous.

## Idempotence: making a send safe to replay

An operation is **idempotent** when doing it several times gives the same result as doing it once. Setting a switch to "on" is idempotent (repeating it changes nothing); "flipping the switch" is not. The same principle, with other examples, is described in [the robustness of a batch job](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots), in [safe data migrations](/?c=donnees&s=bases-de-donnees&p=migrations-de-donnees-sures) and, for an event identifier already processed, in [webhook security](/?c=securite&s=cybersecurite&p=securite-des-webhooks).

To make the send idempotent, the satellite needs **two** things in the message:

| Element of the message | Role | Without it |
|---|---|---|
| The external identifier | Says **which** record | A duplicate at every replay |
| The version (or the modification date) | Says **which state** the record is in | An old message, arriving late, overwrites a more recent state |

The satellite's rule fits in three lines:

| Case on reception | Action |
|---|---|
| Unknown external identifier | Create the record (new local key) |
| Known identifier, received version **newer** | Replace the record |
| Known identifier, received version **equal or older** | Do nothing, but **answer "success"** |

The last line is essential: a message that is ignored is not an error. If the satellite answered "error" to a duplicate, the source would send it again endlessly.

In HTTP, the natural form is a `PUT` request ("replace the resource at this address"), whose meaning is idempotent by nature, whereas a `POST` ("add a resource") creates a duplicate at every repetition (see [the HTTP methods](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). The external identifier goes in the address, and the version in the body of the request (the data attached to it), in [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) format (structured text made of name-value pairs):

```text
PUT /api/records/ART-1 HTTP/1.1
Host: satellite-b.example.test
Content-Type: application/json

{"external_id": "ART-1", "title": "LED lamp", "price": 12, "version": 2}
```

The first line gives the method, the address and the protocol (`HTTP/1.1`: the version of the exchange rules); `Host` names the target machine and `Content-Type` announces the format of the body. Possible replies from the satellite:

| Reply | Meaning for the source |
|---|---|
| `200` or `201` | Received and processed (or ignored as a duplicate): remove the send from the ledger |
| `4xx` (for example `422`, the family of errors attributed to the caller), except `408` (timeout) and `429` (too many requests), to be retried later like a `5xx` | The message is refused because it is invalid: sending it again as it is pointless, it must be corrected or an alert raised |
| `5xx` (the family of server errors), or no reply before the delay | The satellite is in difficulty: try again later |

## When a satellite is unreachable

A satellite can be switched off, overloaded, under maintenance, or simply behind a network that drops packets. Three words describe what follows:

| Term | Meaning | How it is handled |
|---|---|---|
| **Gap** | The difference between what the source holds and what the satellite holds | It is recorded: the source notes, in a **ledger**, which identifiers the satellite did not receive |
| **Replay** | Sending back what the ledger contains, once the satellite answers again | A scheduled task (see [cron](/?c=langages&s=bash&p=automatisation-cron)) or a worker retries at regular intervals |
| **Reconciliation** | Comparing **all** of the satellite's content with the source's, without relying on the ledger, and fixing what differs | A full check, run by hand or periodically |

Two details matter a lot:

- The replay sends the record **in its current state**, not the original message. If a record changed three times during the outage, the satellite receives only the last version, once: there is no need to replay the history.
- The ledger can be lost (a restart of a program that kept it in memory, a bug, the restoration of an old backup). A satellite whose ledger was lost will never be replayed. Reconciliation exists for that case: it is the safety net, which depends on nothing but comparing the data.

| Mechanism | Cost | Catches | Misses |
|---|---|---|---|
| Ledger replay | Low (only the gaps noted) | A satellite that comes back after an outage | A send whose failure the source did not note |
| Reconciliation | High (reads everything, or all the versions) | Any gap, whatever its origin | Nothing, but it only runs at intervals |

The two are combined: the replay quickly catches up the common case, and the reconciliation (for example every night) catches the rest.

## Detecting desynchronization

Silent desynchronization is the worst case: everything works, but a shop shows an outdated price. Simple measurements, compared regularly, are needed.

| Measure | How | Detects | Does not detect |
|---|---|---|---|
| **Count** | Number of records in the source against the number in the satellite | A missing or extra record | A record modified but present in both (same count, different versions) |
| **Hash** | A summary computed over the versions of all the records; two different hashes mean the content differs | Any difference of version, even with the same number of records | **Which** record differs (you then have to compare record by record) |
| **Last update date** | Each satellite notes the date of the last message received; an alert is raised if it is too old compared with the source | A satellite that no longer receives anything | A satellite that receives messages but gets them wrong |
| **Record-by-record comparison** | For each identifier, compare the version on both sides | The exact list of gaps | Nothing, but it is the most costly |

A **hash** is the result of a hash function: a calculation that turns any text into a short summary of fixed size, such that two different texts give, in practice, two different summaries (see [hashing and encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-vs-encryption-a-frequent-mix-up)). One of these functions, SHA-256, is used in the simulation below. Here, we summarize the list of (identifier, version) pairs. The source's hash and the satellite's can be compared at a glance, without transferring the data.

One detail to keep in mind: a hash computed over the **versions** sees that a satellite has an outdated version, but not that a record was corrupted at an equal version. For this second risk, the hash is computed over the **content** (title, price...) as well as the version.

The strategy that works: compare counts and hashes often (it is cheap), and run the record-by-record comparison only when the hash differs.

## The limits of synchronous sending

With synchronous propagation, the user's request **depends on N satellites**: it only ends when all N have answered (or when we have given up). This costs in three ways.

**1. Latency adds up.** Sends happen one after the other. With three satellites that answer in 40, 90 and 60 ms, the user waits 190 ms. With ten satellites at 100 ms each, the user waits one second, just to save a record.

**2. An outage costs the whole maximum delay.** A switched-off satellite does not answer "no" straight away: it stays silent, and the source waits for the end of the maximum delay (here 3 seconds) before giving up. Every save during an outage therefore costs the user 3 extra seconds.

**3. Availability multiplies.** **Availability** is the share of time during which a system responds. If saving requires all the satellites to respond, the probability that it succeeds is the **product** of their availabilities. For example, with satellites each available 99% of the time (that is, 0.99) and going down independently of one another:

| Number of satellites | Calculation | Probability that all respond |
|---|---|---|
| 1 | 0.99 | 99% |
| 3 | 0.99 × 0.99 × 0.99 | about 97% |
| 10 | 0.99 to the power of 10 | about 90% |
| 20 | 0.99 to the power of 20 | about 82% |

With twenty satellites, nearly one write in five would hit at least one outage. Two remedies, often combined:

| Remedy | Principle | Effect |
|---|---|---|
| Do **not** make the request fail when a satellite is silent | The save succeeds in the source; the failure goes into the ledger | The availability of the application no longer depends on the satellites |
| Take the send out of the request (queue) | The request drops a message, a worker sends in the background | The latency no longer depends on the number of satellites |

The simulation below applies the first remedy (the gap is noted, the request succeeds) and shows its cost (3 seconds of waiting); the second is the subject of [the queue](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic#queues-and-asynchronous-processing).

> **Pitfall:** believing that a propagation which works with three satellites in test will hold with thirty in real conditions, facing users. Latency and the probability of an outage both grow with the number of satellites.

## A complete simulation

The program below puts everything together: a source and three satellites, one of which goes down. It is written in Python (see [dictionaries and sets](/?c=langages&s=python&p=dictionnaires-et-ensembles) for `{}` and `set()`). The "network" is replaced by a simple function call that can raise `ConnectionError`; the durations are **simulated** (numbers added, never a real wait), which makes the result identical at every run.

### The satellite

```python
# hashlib (standard library: shipped with Python, nothing to install)
# computes hashes
import hashlib
# json turns a Python structure into text, to compute the hash
import json

# time lost waiting for a silent satellite before giving up (in ms, simulated)
MAX_DELAY_MS = 3000


# a hash summarizes a {identifier: version} table in 8 characters
def hash_of(versions):
    # items() gives the (identifier, version) pairs; sorted puts them in order: same text
    # json.dumps turns this list into text
    text = json.dumps(sorted(versions.items()))
    # encode() turns the text into bytes (numbers from 0 to 255, the stored form);
    # sha256 makes a summary of 64 hexadecimal characters (digits and letters a-f);
    # [:8] keeps the first 8
    return hashlib.sha256(text.encode()).hexdigest()[:8]


# a satellite: a local copy that has its own keys
class Satellite:
    # first_key: first free local key (each satellite has its own history)
    def __init__(self, name, first_key, latency_ms):
        # readable name, for the messages
        self.name = name
        # simulated duration of a successful exchange
        self.latency_ms = latency_ms
        # True: the satellite no longer answers
        self.down = False
        # local key -> record (this is the table of the satellite)
        self.records = {}
        # external identifier -> local key (to find "the same record")
        self.key_by_external_id = {}
        # next local key to hand out
        self.next_key = first_key

    # receives a message from the source; receiving it twice changes the result only once
    def receive(self, message):
        # a satellite that is down does not answer: the caller receives an exception
        if self.down:
            # f"..." inserts the value of self.name in place of {self.name}
            raise ConnectionError(f"{self.name} unreachable")
        # the external identifier is the source's key, never the local key
        external_id = message["external_id"]
        # get() returns the value of the key, or None (the "nothing" value) if it is absent;
        # here: the local key of the record if it is already known
        key = self.key_by_external_id.get(external_id)
        # unknown record: it is created under a new local key
        if key is None:
            # takes the next free local key
            key = self.next_key
            # the key after that will be the next one
            self.next_key += 1
            # remembers the match: external identifier -> local key
            self.key_by_external_id[external_id] = key
        # record known in an equal or newer version: nothing to do (idempotence)
        elif self.records[key]["version"] >= message["version"]:
            # answers "ignored": the send is a success, but it changes nothing
            return "ignored"
        # dict(message) makes a copy of the message, stored under the local key
        self.records[key] = dict(message)
        # says that the message changed the satellite
        return "applied"

    # external identifier -> version: overview of what the satellite holds
    def versions(self):
        # dictionary comprehension: builds a dictionary in one line by going through a
        # collection, here one entry per record (values() lists the records)
        return {f["external_id"]: f["version"] for f in self.records.values()}
```

### The source of truth

```python
# the source of truth: it holds the reference records and propagates every change
class Source:
    # satellites: the list of the copies to keep up to date
    def __init__(self, satellites):
        # identifier -> record (title, price, version)
        self.records = {}
        # the satellites to feed
        self.satellites = satellites
        # the ledger: for each satellite, a set (no duplicates) of the identifiers not received
        self.to_replay = {s.name: set() for s in satellites}

    # creates or modifies a record, then propagates it; returns the total simulated duration
    def save(self, external_id, title, price):
        # previous version of the record (None if it is new)
        old = self.records.get(external_id)
        # the version goes up by 1 at each change (1 for a new record)
        version = 1 if old is None else old["version"] + 1
        # writes the record into the source, with its identifier and its version
        self.records[external_id] = {
            # the external identifier travels with the record
            "external_id": external_id,
            # the data of the record: a title and a price
            "title": title,
            "price": price,
            # the version makes it possible to compare two states of the same record
            "version": version,
        }
        # propagates synchronously: one satellite after the other, reply expected;
        # sum adds up the durations returned (one per satellite, computed on demand)
        return sum(self.send(s, external_id) for s in self.satellites)

    # sends the CURRENT version of a record to a satellite; returns the simulated duration
    def send(self, satellite, external_id):
        # try / except: attempts the send and catches the connection error
        try:
            satellite.receive(self.records[external_id])
        # silent satellite: the gap is noted in the ledger
        except ConnectionError:
            self.to_replay[satellite.name].add(external_id)
            # and the whole waiting delay is lost
            return MAX_DELAY_MS
        # successful send: discard removes the identifier from the ledger (no error if absent)
        self.to_replay[satellite.name].discard(external_id)
        # duration of the successful exchange
        return satellite.latency_ms

    # replay: sends back everything noted in the ledger
    def replay(self):
        # for each satellite...
        for satellite in self.satellites:
            # sorted creates a frozen copy, because send() modifies the set during the loop
            for external_id in sorted(self.to_replay[satellite.name]):
                # ...sends back each record noted
                self.send(satellite, external_id)

    # reconciliation: compares everything, without relying on the ledger
    def reconcile(self, satellite):
        # versions that the satellite really holds
        held = satellite.versions()
        # records missing or outdated on the satellite side (list comprehension: builds
        # a list in one line); items() gives the (identifier, record) pairs,
        # get() the version held (None if absent)
        gaps = [
            external_id for external_id, record in self.records.items()
            if held.get(external_id) != record["version"]
        ]
        # sends back each of these records
        for external_id in gaps:
            self.send(satellite, external_id)
        # list of the corrected records
        return gaps

    # hash of what the source holds
    def hash_of(self):
        # same computation as for a satellite, on the versions of the source
        return hash_of({i: f["version"] for i, f in self.records.items()})


# prints the count and the hash of the source, then of each satellite
def status(source):
    # reference hash, computed once
    reference = source.hash_of()
    # line for the source
    print(f"  source : {len(source.records)} records, hash {reference}")
    # one line per satellite, with the verdict of the comparison
    for s in source.satellites:
        # hash of what this satellite holds
        e = hash_of(s.versions())
        # "ok" if identical to the reference, "GAP" otherwise
        verdict = "ok" if e == reference else "GAP"
        # {s.name:<10} pads the name with spaces up to 10 characters
        print(f"  {s.name:<10}: {len(s.records)} records, hash {e}  {verdict}")
```

### The scenario

```python
# three satellites, with different local histories (starting keys 1, 100, 500)
sat_a = Satellite("A", 1, 40)
# B answers in 90 ms and numbers from 100
sat_b = Satellite("B", 100, 90)
# C answers in 60 ms and numbers from 500
sat_c = Satellite("C", 500, 60)
# the source that feeds them
source = Source([sat_a, sat_b, sat_c])

# --- 1. normal operation ---
print("1. three records created, everyone answers")
# enumerate numbers the titles from 1: (1, "Lamp"), (2, "Chair"), ...
for i, title in enumerate(["Lamp", "Chair", "Desk"], start=1):
    # creates the records ART-1, ART-2, ART-3; duration keeps the last duration
    duration = source.save(f"ART-{i}", title, 10 * i)
print(f"  user request duration: {duration} ms (40 + 90 + 60)")
# prints the counts and the hashes
status(source)
# the same record has three different local keys
print("  local key of ART-1 :",
      {s.name: s.key_by_external_id["ART-1"] for s in source.satellites})

# --- 2. idempotence: the same message sent twice ---
print("2. same message sent twice to a trial satellite, outside the source")
# trial satellite, empty
trial = Satellite("trial", 900, 10)
# first send of version 1 of ART-1
first = trial.receive(source.records["ART-1"])
# second send, identical, as after a lost reply
second = trial.receive(source.records["ART-1"])
print(" ", first, "then", second, "; records in the trial :", len(trial.records))

# --- 3. B goes down during two changes ---
print("3. B down; ART-2 modified, ART-4 created")
# B no longer answers
sat_b.down = True
# modification of an existing record
t1 = source.save("ART-2", "Chair", 25)
# creation of a new record
t2 = source.save("ART-4", "Shelf", 40)
print(f"  durations: {t1} ms and {t2} ms (40 + 3000 + 60 for each)")
print("  to replay :", {name: sorted(ids) for name, ids in source.to_replay.items() if ids})
# prints the counts and the hashes
status(source)

# --- 4. B is back: replay ---
print("4. B is back, replaying the ledger")
# B answers again
sat_b.down = False
# sends back what the ledger contains
source.replay()
# prints the counts and the hashes
status(source)

# --- 5. C goes down, then the ledger is lost: reconciliation ---
print("5. C down during a change, then the source loses its ledger")
# C does not answer during the modification of ART-1
sat_c.down = True
source.save("ART-1", "LED lamp", 12)
# restart of the source: the ledger, kept in memory, is emptied
source.to_replay = {s.name: set() for s in source.satellites}
# C is back
sat_c.down = False
# the replay finds nothing to send back
source.replay()
print("  after replay (empty ledger) :")
# prints the counts and the hashes
status(source)
# reconciliation compares the versions record by record and returns the gaps
print("  reconciliation of C :", source.reconcile(sat_c))
# prints the counts and the hashes
status(source)
```

Output obtained by running this program (Python 3 must be installed, see [Python](/?c=langages&s=python&p=python); the three blocks above, from the satellite to the scenario, are pasted in order into a single file `simulation.py`, then `python3 simulation.py` in a terminal):

```text
1. three records created, everyone answers
  user request duration: 190 ms (40 + 90 + 60)
  source : 3 records, hash 20791267
  A         : 3 records, hash 20791267  ok
  B         : 3 records, hash 20791267  ok
  C         : 3 records, hash 20791267  ok
  local key of ART-1 : {'A': 1, 'B': 100, 'C': 500}
2. same message sent twice to a trial satellite, outside the source
  applied then ignored ; records in the trial : 1
3. B down; ART-2 modified, ART-4 created
  durations: 3100 ms and 3100 ms (40 + 3000 + 60 for each)
  to replay : {'B': ['ART-2', 'ART-4']}
  source : 4 records, hash 90b23cec
  A         : 4 records, hash 90b23cec  ok
  B         : 3 records, hash 20791267  GAP
  C         : 4 records, hash 90b23cec  ok
4. B is back, replaying the ledger
  source : 4 records, hash 90b23cec
  A         : 4 records, hash 90b23cec  ok
  B         : 4 records, hash 90b23cec  ok
  C         : 4 records, hash 90b23cec  ok
5. C down during a change, then the source loses its ledger
  after replay (empty ledger) :
  source : 4 records, hash 8b61e9c0
  A         : 4 records, hash 8b61e9c0  ok
  B         : 4 records, hash 8b61e9c0  ok
  C         : 4 records, hash 90b23cec  GAP
  reconciliation of C : ['ART-1']
  source : 4 records, hash 8b61e9c0
  A         : 4 records, hash 8b61e9c0  ok
  B         : 4 records, hash 8b61e9c0  ok
  C         : 4 records, hash 8b61e9c0  ok
```

### Reading the output

| Step | What you see | What to understand |
|---|---|---|
| 1 | The request takes 190 ms; ART-1 carries the local keys 1, 100 and 500 | The latency is the sum (40 + 90 + 60); the local key differs, and the external identifier `ART-1` links the copies |
| 2 | "applied then ignored", a single record in the trial satellite | The same message received twice creates no duplicate (idempotence) |
| 3 | Each request takes 3100 ms; B shows GAP; the ledger contains ART-2 and ART-4 | B's outage costs 3000 ms at each save; B's count (3) is lower than the others' (4) |
| 4 | After the replay, the four hashes are identical | The ledger was enough to catch B up |
| 5 | C's count is 4, like the others, but its hash differs; the replay changes nothing; reconciliation returns `ART-1` | The count does not see an outdated record, the hash does; reconciliation repairs even when the ledger is lost |

## Pitfalls

| Pitfall | Consequence | Fix |
|---|---|---|
| Using the source's local key as the identifier in the satellites | The keys collide with those the satellite has already handed out | A distinct external identifier, stored in a dedicated column of the satellite |
| No external identifier: creating on every message | Duplicates at every replay | Look up the record by external identifier before creating it |
| No version: applying every message received | An old message, arriving late, overwrites a more recent state | Ignore any version lower than or equal to the one already held |
| Answering "error" to a duplicate | The source sends it again endlessly | Answer "success" and change nothing |
| Making the save fail when a satellite is silent | The availability of the application depends on the weakest copy | Save in the source, note the gap, replay later |
| A ledger of failures kept only in memory | A restart erases the list; the satellite will never be caught up | Write the ledger to a table of the source, and reconcile periodically |
| Replaying the original message | Several messages to apply in order, or an outdated message | Send the current state of the record |
| Not propagating deletions | A record deleted in the source stays visible in the satellites | Send a "deleted" message (or keep a deletion marker: a `deleted = true` column instead of erasing the row), and during reconciliation, handle the records of the satellite that are absent from the source (the simulation does not handle this case) |
| Relying on the count alone | An outdated record goes unnoticed | Add a hash of the versions to it |
| A hash that only covers the versions | A record corrupted at an equal version goes unnoticed | Include the content in the hash computation |
| No timeout, or a huge one | A silent satellite freezes the user's request | A short maximum delay, set for each call |
| Retrying immediately and endlessly | A satellite that is already overloaded receives even more requests | Space out the retries, lengthening the wait after each failure |

## Best practices

| Best practice | Why |
|---|---|
| An external identifier and a version in **every** message | The satellite knows which record and which state, so the send can be replayed safely |
| Idempotent sends, always acknowledged (confirmed) by a success | An exceeded delay is ambiguous: only sending again clears the doubt |
| Note each failure in a **durable** ledger (a table) | No satellite is forgotten after a restart |
| Replay the current state of the record, not the original message | A single send is enough, even after several changes |
| Reconcile periodically | The safety net that catches everything the ledger missed |
| Compare counts and hashes, and alert on any difference | Detect desynchronization before a user notices it |
| A short maximum delay on every call to a satellite | An outage no longer freezes the user's request |
| Take the send out of the request (queue) as soon as N grows | The latency and the availability no longer depend on the number of satellites |
| Keep the flow one-way: the source sends, the satellites receive | A local change made on a satellite would be overwritten at the next send |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A **source of truth** sends its changes to **satellites** (local copies) through the application's code: this is **application-level replication**, as opposed to database replication. Three strategies: synchronous propagation (the request waits for the N satellites), queue (a worker delivers later), periodic pull (the satellite asks for what it missed). Each message carries an **external identifier** (the source's key, distinct from the satellite's local key) and a **version**, so that the send is **idempotent**: receiving it twice changes nothing more. An unreachable satellite creates a **gap**, noted in a **ledger** for a **replay**; **reconciliation** compares everything and catches what the ledger missed. Desynchronization is detected with counts, a hash of the versions and the last update date. Synchronous sending adds up the latencies and multiplies the risk of outages. |
| **Pitfalls to avoid** | Reusing the local key as the identifier; creating on every message; not versioning; answering "error" to a duplicate; making the save fail when a satellite is silent; ledger kept in memory; replaying the old message rather than the current state; forgetting deletions; relying on the count alone; no timeout; retries without a pause. |
| **Best practices** | External identifier and version in every message; idempotent sends acknowledged by a success; durable ledger; replay of the current state; periodic reconciliation; alerts on count and hash; short maximum delay; queue as soon as the number of satellites grows; one-way flow. |
