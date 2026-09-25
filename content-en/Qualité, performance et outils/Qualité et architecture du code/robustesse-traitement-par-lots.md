---
order: 9
---

# Robustness of a Batch Job

A **batch job** is a program that processes a long list of items in a single run: 10,000 files to convert, 300 web pages to read, every row of a table to recompute. It often runs with nobody watching the screen, for example started every night by a [scheduled task](/?c=langages&s=bash&p=automatisation-cron). Three situations cause it trouble: an interruption halfway through, a resource that goes down, and an empty result mistaken for an error. This chapter gives one tool for each; the examples are in [Python](/?c=langages&s=python&p=gestion-des-erreurs).

## Resuming After an Interruption: the Checkpoint

Without precautions, a 3-hour job interrupted at 2:50 (network outage, machine restart) has to start over. A **checkpoint** avoids this: after each processed item, the program writes down in a state file what is already done; restarted with an option such as `--resume`, it skips those items.

| | Without a checkpoint | With a checkpoint |
|---|---|---|
| Interruption at 95% | Everything must be redone | Only the remaining 5% is processed |
| Cost | None | One file write per item |

```python
import json
import os

STATE = "state.json"                    # file that remembers already processed items

def load_state():
    if not os.path.exists(STATE):       # first run: nothing is done yet
        return set()
    with open(STATE, encoding="utf-8") as f:
        return set(json.load(f))        # JSON list read back as a set

def save_state(done):
    temporary = STATE + ".tmp"
    with open(temporary, "w", encoding="utf-8") as f:
        json.dump(sorted(done), f)      # first writes a separate file...
    os.replace(temporary, STATE)        # ...then puts it in place in one go

done = load_state()
for item in items:
    if item in done:
        continue                        # already processed during a previous run
    process(item)                       # the real work, result saved here
    done.add(item)
    save_state(done)                    # marked done only once it is saved
```

The state file uses the [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) format; reading and writing files is detailed in [working with files](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers).

> **Pitfall:** writing directly into `state.json`. An outage during the write leaves a half-written file, unreadable on restart: all tracking is lost. [`os.replace`](https://docs.python.org/3/library/os.html#os.replace) replaces the file in a single operation, so you always find either the complete old version or the new one.
>
> **Pitfall:** marking an item as done before its result has been saved. An outage between the two, and the item is considered processed while its result exists nowhere.
>
> **Best practice:** make processing an item **idempotent** (doing it twice gives the same result as once): if the outage happens right after `process()` but before `save_state()`, the item is simply processed again without harm.

## Stopping Calls to a Failing Resource: the Circuit Breaker

When a resource (a website, a database) stops responding, retrying every item one by one wastes time and can make the outage worse. A **circuit breaker** cuts off calls to that resource after several consecutive failures, the way an electrical breaker cuts the power after an overload ([CircuitBreaker, Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html); [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)).

```text
            N consecutive failures
  CLOSED ─────────────────────────▶  OPEN
 (normal                             (calls refused
  calls)    ◀──── success ───┐        without trying)
                              │           │
                          HALF-OPEN ◀─────┘ after a delay
                          (a single trial call)
```

| State | Behavior | Moves to |
|---|---|---|
| **Closed** | Calls go through normally; consecutive failures are counted | Open, at the N-th failure in a row |
| **Open** | Calls are refused immediately, without contacting the resource | Half-open, after a delay |
| **Half-open** | A single trial call is allowed | Closed if it succeeds, open if it fails |

In a batch job, a simple version is often enough: after 3 failures in a row on the same site, give up on its remaining items for this run and report it.

```python
THRESHOLD = 3                           # consecutive failures before cutting off
failures = {}                           # site -> number of failures in a row
cut_off = set()                         # sites given up for this run

for page in pages:
    if page.site in cut_off:
        continue                        # breaker open: don't even try
    try:
        read(page)
        failures[page.site] = 0         # a success resets the counter
    except ReadError:
        failures[page.site] = failures.get(page.site, 0) + 1
        if failures[page.site] >= THRESHOLD:
            cut_off.add(page.site)      # 3 failures in a row: cut this site off
```

The circuit breaker complements **exponential backoff** (waiting longer and longer between two attempts of the same call, see [the SDK and API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)): backoff spaces out the attempts of one call, the breaker stops calling a resource that is clearly down.

> **Pitfall:** retrying a failing resource forever: the job never ends, or ends very late, for no result.
>
> **Best practice:** always report a cut-off resource in the final report, so that it gets handled on the next run instead of being forgotten.

## Telling "Empty Result" Apart From "Read Failure"

A page that could not be read and a page that really contains nothing both give "0 items". Confusing them distorts the result both ways:

| Actual situation | If "0" is counted without distinction | Consequence |
|---|---|---|
| The shop really has no listings | Correct | Legitimate business alert |
| The page could not be read (blocking, outage) | Same "0" | False business alert, and the real technical problem goes unnoticed |

The solution is to return an **explicit status** with each result, here with a [dataclass](/?c=langages&s=python&p=dataclasses):

```python
from dataclasses import dataclass, field

@dataclass
class Result:
    status: str                         # "ok" or "read_failure"
    listings: list = field(default_factory=list)

def count(page):
    try:
        return Result("ok", extract_listings(page))
    except ReadError:
        return Result("read_failure")   # never confused with an empty list
```

| Status | Number of listings | Handling in the report |
|---|---|---|
| `ok` | at least 1 | Normal result |
| `ok` | 0 | Business status (empty shop) |
| `read_failure` | unknown | Technical incident, counted separately, never as "0" |

> **Best practice:** count empty items and failures separately in the final report, and only raise a blocking alert for what truly requires it (see [blocking check or non-blocking alert](/?c=infrastructure-devops&s=ci-cd&p=yaml-pipelines-azure) in a pipeline).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A checkpoint lets an interrupted job resume; a circuit breaker stops calling a failing resource; an explicit status tells an empty result apart from a read failure. |
| **Tools you can use** | A JSON state file written through a temporary file and `os.replace`; a counter of consecutive failures per resource; a dataclass with a `status` field. |
| **Pitfalls to avoid** | Writing the state file directly; marking an item as done before saving its result; retrying a failing resource forever; counting a read failure as "0". |
| **Best practices** | Idempotent processing per item; reporting every cut-off resource; counting empty items and failures separately. |
