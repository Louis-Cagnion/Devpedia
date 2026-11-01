---
order: 12
---

# Cache Metadata and Invalidation (31/10/2026)

[Avoiding Redundant Recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) shows how to keep the result of a function so that it does not have to be computed again. This chapter covers the next step: a **shared cache**, used by all the visitors of a website (the people who view its pages with their browser, the software that displays web pages, from a server, the computer that sends them), where the real difficulty is not keeping an answer but knowing **when it stops being correct**. The answer comes down to three pieces of information, the **cache metadata**, and one way of using them, the **invalidation**.

## A cache entry and its key

A **cache** is a store where you keep the result of an expensive piece of work so that you can hand it back without doing the work again. An **entry** is a stored answer. It is found thanks to its **key**, a piece of text that serves as a storage label, like the number of a locker. A read that finds the entry is a **hit** (*cache hit*); a read that does not find it is a **miss** (*cache miss*), and then the answer must be **recomputed**, that is, the work must be done again, before being stored for next time. The pattern "look it up, otherwise compute and store" is called *cache-aside*; it is described in [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

```text
visitor ──> server ──> does the cache hold the key "article:7|language=fr"?
                           │
              yes (hit)    │                no (miss)
                   ┌────────┘                    └────────┐
                   v                                      v
           returns the entry                    recomputes (slow), stores,
           (fast, free)                         then returns
```

Do two visitors who request "the same page" really get the same answer? Not always: the page can change with the language, with the logged-in user, with the address requested. Everything therefore comes down to three questions, which the cache metadata asks of each entry.

## The three pieces of metadata

| Metadata | Question it answers | Role | Example | HTTP equivalent |
|---|---|---|---|---|
| **Context** | What makes the answer vary? | Goes into the **key**: one variant per value | `language=fr`, `language=en`; `role=admin` | `Vary` header (it lists the request headers that make the answer vary, such as the language; the requested address is already in the key) |
| **Tag** | Which data does the answer depend on? | Allows invalidating only the entries concerned | `article:7`, `listing`, `config` | None (some CDNs offer a mechanism specific to their product) |
| **Lifetime** (*max-age*) | For how long is the answer still acceptable? | Sets the moment when the entry becomes **stale** on its own | 3600 seconds; 0 = stale immediately (nothing reusable) | `Cache-Control: max-age=N` |

The word [**HTTP**](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) names the language that a browser and a web server use to exchange pages. Its cache rules (the `Vary` and `Cache-Control` headers, lines of information attached to each response) are described in the [RFC 9111 standard](https://www.rfc-editor.org/rfc/rfc9111) (an RFC is an Internet standards document). A **CDN** (a network of servers that keep copies of your pages close to visitors) applies the same rules: see [CDN and adaptive streaming](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative). A **lifetime** is also called a **TTL** (*Time To Live*), explained in [Redis](/?c=donnees&s=bases-de-donnees&p=redis).

These three pieces of information play very different roles, which is why it matters not to confuse them:

| If you leave out... | What happens | Severity |
|---|---|---|
| A **context** | A visitor gets the answer meant for someone else (an English page for a French reader, data from another account) | Wrong answer for the visitor, sometimes a data leak |
| A **tag** | The content changes but the entry stays served until the end of its lifetime | Stale answer |
| A **lifetime** | The entry stays forever, or disappears too fast to be useful | Stale answer or useless cache |

## A cache with tags, contexts and lifetimes

The program below, in [Python](/?c=langages&s=python&p=python), builds these three pieces of metadata for real. The measurements in this chapter come from running it (run of 31/10/2026). Three Python notions are used here: a **class** is a mould that groups data and the functions that work on it (see [object-oriented programming](/?c=langages&s=python&p=poo)), `self` refers to the current object, and a **set** is a collection without duplicates (see [dictionaries and sets](/?c=langages&s=python&p=dictionnaires-et-ensembles)). A string that starts with `f"` inserts values between braces into the text. The **clock** is simulated: the program adds seconds instead of waiting. `clock` is a dictionary rather than a simple variable: a function can change the contents of a dictionary, but not replace the value of a variable defined outside it without a special statement. Iterating over a dictionary with `for k in d` gives its keys, `d.items()` gives its (key, value) pairs that `c, e` receive one by one, and `[x for ... if ...]` builds a list of only the retained items. The `threading` module (tasks run at the same time, see [parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) is only used for the section on the stampede.

```python
import random                                  # random draws, to simulate visits
import threading                               # concurrent tasks, for the stampede (below)
import time                                    # 50 ms pause that simulates a slow computation


clock = {"t": 0.0}                             # simulated clock, in seconds


def now():                                     # gives the simulated time
    return clock["t"]                          # we avoid waiting for real


class Cache:                                   # a cache with tags and lifetimes
    def __init__(self):                        # called when a cache is created
        self.entries = {}                      # key -> stored entry
        self.hits = 0                          # reads that found a valid entry
        self.misses = 0                        # reads that found nothing usable
        self.computations = 0                  # recomputations done
        self.computation_time = 0.0            # seconds of simulated work spent

    def key(self, name, context):              # builds the key of an entry
        values = [f"{k}={context[k]}" for k in sorted(context)]  # sorted: fixed order
        return "|".join([name] + values)       # e.g. "article:7|language=fr"

    def read(self, name, context):             # looks for an entry that is still valid
        entry = self.entries.get(self.key(name, context))  # None if the key is missing
        if entry is None or entry["expires_at"] <= now():  # missing or stale
            self.misses += 1                   # we count a miss
            return None                        # nothing usable
        self.hits += 1                         # we count a hit
        return entry["value"]                  # the stored answer

    def write(self, name, context, value, tags, duration):  # stores an answer
        self.entries[self.key(name, context)] = {  # the key tells the variants apart
            "value": value,                    # the answer
            "tags": set(tags),                 # what it depends on
            "expires_at": now() + duration,    # moment when it goes stale
        }

    def serve(self, name, context, tags, duration, cost=0.05):  # read, or recompute
        value = self.read(name, context)       # first, the cache
        if value is None:                      # miss: it must be recomputed
            self.computations += 1             # one more recomputation
            self.computation_time += cost      # it costs work
            value = f"answer of {name}"        # the result of the computation (simulated)
            self.write(name, context, value, tags, duration)  # we store it
        return value                           # in both cases, we return it

    def invalidate(self, tags):                # removes the entries that carry the tag
        targets = set(tags)                    # set: collection without duplicates
        # & keeps the items common to both sets: the entry is hit
        # c, e: the key and the entry of each pair given by .items()
        dead = [c for c, e in self.entries.items() if e["tags"] & targets]
        for c in dead:                         # for each entry hit
            del self.entries[c]                # we remove it
        return len(dead)                       # number of entries removed

    def purge(self):                           # empties the whole cache
        n = len(self.entries)                  # how many entries there were
        self.entries.clear()                   # we remove everything
        return n                               # number of entries removed
```

Each entry therefore keeps **three things** in addition to its value: its tags, its expiry moment, and its key, which contains the contexts. `invalidate` goes through all the entries to find those that carry the tag. This is simple and sufficient here, but a real cache keeps an index "tag to keys" instead, so as not to scan everything at each write.

## Invalidating by tag rather than purging everything

An entry can stop being correct in three ways, and each one calls for a different response:

| How an entry is removed | How | Advantage | Drawback |
|---|---|---|---|
| **Expiry** (lifetime) | The entry goes stale on its own after `max-age` | No action to write | The answer is wrong until it expires |
| **Targeted invalidation** (by tag) | A write removes the entries that carry the tag of the changed data | Precise: only what is needed is recomputed | Each entry must be **tagged** correctly |
| **Full purge** | We empty the whole cache | Easy, never a stale answer | Everything is recomputed at once |

Experiment: a site of 20 articles in 2 languages, so 40 article pages and 2 home pages (the list of articles), that is 42 entries. After 2,000 visits to fill the cache (the warm-up), we modify article 7, then observe 300 visits. The home page carries the tag `listing` because it displays the titles. The modified article 7 therefore hits 4 entries: its page and the home page, in both languages.

```python
LANGUAGES = ["fr", "en"]                       # the "language" context has 2 values
ARTICLE_COUNT = 20                             # the site has 20 articles


def request(cache, rng):                       # simulates the visit of a reader
    clock["t"] += 0.01                         # 100 visits per second
    language = rng.choice(LANGUAGES)           # the language of the reader
    n = rng.randrange(ARTICLE_COUNT)           # integer from 0 to 19: the article requested
    if rng.random() < 0.3:                     # draw between 0 and 1: 3 times out of 10
        cache.serve("home", {"language": language}, {"listing"}, 3600)
    else:                                      # otherwise: the page of an article
        cache.serve(f"article:{n}", {"language": language}, {f"article:{n}"}, 3600)


def phase(cache, rng, count):                  # plays `count` visits and measures
    r0, e0, c0 = cache.hits, cache.misses, cache.computations  # 3 variables, 1 line
    for _ in range(count):                     # one visit at a time
        request(cache, rng)                    # the reader arrives
    hits = cache.hits - r0                     # hits of this phase only
    misses = cache.misses - e0                 # misses of this phase only
    rate = 100 * hits / (hits + misses)        # percentage of hits
    return rate, cache.computations - c0       # rate and number of recomputations


def trial(strategy):                           # one complete experiment
    clock["t"] = 0.0                           # the clock starts again from zero
    cache, rng = Cache(), random.Random(1)     # 2 variables, 1 line; seed 1
    phase(cache, rng, 2000)                    # warm-up: the cache fills up
    rate, recomputations = phase(cache, rng, 300)  # 300 visits without change
    print(f"{strategy:<22} no change : {rate:5.1f}%  recomputations : {recomputations}")
    if strategy == "targeted invalidation":    # we modify article 7...
        removed = cache.invalidate({"article:7", "listing"})  # ...and its dependants
    else:                                      # otherwise: full purge
        removed = cache.purge()                # we empty everything
    rate, recomputations = phase(cache, rng, 300)  # 300 visits after the change
    print(f"{'':<22} after change : {rate:5.1f}%  recomputations : {recomputations}"
          f"  (entries removed : {removed})")


trial("targeted invalidation")                 # runs the two experiments
trial("full purge")
```

In the `f"..."` strings of `print`, `:<22` aligns the text to the left over 22 characters, and `:5.1f` writes a number with one digit after the decimal point. The random draws (`random.Random(1)`) start from a **seed**: with the same seed, each run draws the same numbers, so both strategies receive exactly the same visits.

Result obtained:

```text
targeted invalidation  no change : 100.0%  recomputations : 0
                       after change :  98.7%  recomputations : 4  (entries removed : 4)
full purge             no change : 100.0%  recomputations : 0
                       after change :  86.3%  recomputations : 41  (entries removed : 42)
```

| | Targeted invalidation | Full purge |
|---|---|---|
| Entries removed | 4 out of 42 | 42 out of 42 |
| Recomputations in the next 300 visits | 4 | 41 |
| Hit rate after the change | 98.7% | 86.3% |

The program writes decimals with a point (`98.7`), and this text keeps that notation. The full purge removes more than 10 times as many entries (42 against 4) for the same change, and the 41 recomputations that follow are concentrated **at the start**: 23 fall within the first 50 visits and 33 within the first 100 (measured with the same visits); we come back to this below.

## Metadata goes up: merging and taking the minimum

A page is rarely a single entry: it is made of **pieces** (a header, a list, a block "Hello Mary"). The whole page depends on everything that each of its pieces depends on. The metadata of a piece therefore **bubbles up** to the page (in other words, it **propagates**) according to three rules:

| Metadata | Merge rule | Why |
|---|---|---|
| Contexts | **Union** of those of all the pieces | If one piece varies with the user, the whole page varies with the user |
| Tags | **Union** of those of all the pieces | The page must be invalidated as soon as one of its data changes |
| Lifetime | **Minimum** of the durations | The page goes stale as soon as its most fragile piece does |

```python
def merge(*children):                          # *children: as many pieces as we like
    return {                                   # each piece has its own metadata
        "contexts": set().union(*(e["contexts"] for e in children)),  # union of contexts
        "tags": set().union(*(e["tags"] for e in children)),  # same
        "duration": min(e["duration"] for e in children),  # the shortest duration wins
    }


def show(meta):                                # shows: contexts | tags | duration
    contexts = sorted(meta["contexts"])        # sorts for a stable display
    tags = sorted(meta["tags"])                # same
    print(f"{contexts} | {tags} | duration {meta['duration']}")  # columns separated by |


header = {"contexts": {"language"}, "tags": {"config"}, "duration": 3600}
listing = {"contexts": {"language"}, "tags": {"article:7", "listing"}, "duration": 600}
hello = {"contexts": {"user"}, "tags": {"user:42"}, "duration": 3600}
exact_time = {"contexts": set(), "tags": set(), "duration": 0}  # "exact time"

show(merge(header, listing))                   # page with no per-user context
show(merge(header, listing, hello))            # a block per user is added
show(merge(header, listing, exact_time))       # a block of duration 0 is added
```

In `merge`, `set()` creates an empty set and `.union(a, b, ...)` returns the union of several sets. The expression `(e["contexts"] for e in children)` produces one set per piece, and the `*` in front of it unpacks them into separate arguments for `union`.

Result obtained:

```text
['language'] | ['article:7', 'config', 'listing'] | duration 600
['language', 'user'] | ['article:7', 'config', 'listing', 'user:42'] | duration 600
['language'] | ['article:7', 'config', 'listing'] | duration 0
```

Each line gives the contexts, the tags, then the duration of the merged page. Read the three lines from top to bottom. A single piece that varies according to the user (`hello`) makes the whole page vary: it will no longer be shared between readers. A single piece of duration 0 (`exact_time`, which displays the exact time) makes **the whole page** impossible to keep. This is a classic loss of efficiency: a small dynamic block ruins the cache of a page made of a hundred blocks.

> **Pitfall:** letting a display detail (the time, a visitor counter) impose a duration of 0 on a whole page. Isolate this detail in its own piece, loaded separately, so that the rest of the page stays cacheable.

## Invalidating on every write: the pitfall

A **write** is any event that changes data: a comment posted, an article modified, a product added to the cart. To keep the cache correct, each write invalidates the entries that depend on it. Everything then depends on **how wide** what it invalidates is, and on **how often** writes happen.

Let us imagine that each article page displays a "latest comments" block. There are two ways of tagging it:

| Variant | Tags of the article page | What one comment invalidates |
|---|---|---|
| **wide** | `article:N` **and** `comments` on the whole page | All the article pages, in all languages |
| **fragment** | `article:N` on the page; `comments` on the block, loaded separately (separate query): it has its own cheap entry and is not merged into that of the page | The block only |

The program measures 1,000 visits (10 simulated seconds, 100 visits per second), with one write every `k` visits. The **load** is the total computation time divided by the 10 seconds: at 100%, the server spends all its time recomputing; above 100%, it can no longer keep up and visitors wait. A page takes 0.05 s to recompute, a comments block 0.005 s.

```python
def visit(cache, rng, variant):                # one visit to an article page
    clock["t"] += 0.01                         # 100 visits per second
    n = rng.randrange(ARTICLE_COUNT)           # the article requested
    context = {"language": rng.choice(LANGUAGES)}  # the language of the reader
    if variant == "wide":                      # the page also depends on the comments
        cache.serve(f"article:{n}", context, {f"article:{n}", "comments"}, 3600)
    else:                                      # "fragment": block loaded separately
        cache.serve(f"article:{n}", context, {f"article:{n}"}, 3600)
        cache.serve("comments", context, {"comments"}, 3600, cost=0.005)


def load(variant, write_every):                # 1000 visits, one write every k
    clock["t"] = 0.0                           # the clock starts again from zero
    cache, rng = Cache(), random.Random(2)     # seed 2: reproducible draws
    for i in range(1, 1001):                   # 1000 visits = 10 simulated seconds
        visit(cache, rng, variant)             # a reader arrives
        if write_every and i % write_every == 0:  # % : remainder of the division
            cache.invalidate({"comments"})     # it invalidates the "comments" tag
    rate = 100 * cache.hits / (cache.hits + cache.misses)  # overall hit rate
    return rate, cache.computations, cache.computation_time / 10 * 100  # load in % of 10 s


print(f"{'write':<12}{'variant':<10}{'hit rate':>9}{'recomputations':>16}{'load':>9}")
for k in (None, 100, 20, 5, 2):                # from "never" to "one visit in two"
    for variant in ("wide", "fragment"):       # tag on the page, or on a block
        rate, computations, percent = load(variant, k)  # we run the experiment
        write = "none" if k is None else f"1 per {k}"  # label of the row
        print(f"{write:<12}{variant:<10}{rate:>8.1f}%{computations:>16}{percent:>8.0f}%")
```

In the `if` of `load`, `None` (no write) counts as false, so the condition is false. In the `f"..."` strings, `>` aligns to the right (`<` to the left) and `.0f` writes a number without decimals.

Result obtained:

```text
write       variant    hit rate  recomputations     load
none        wide          96.0%              40      20%
none        fragment      97.9%              42      20%
1 per 100   wide          62.7%             373     187%
1 per 100   fragment      97.0%              60      21%
1 per 20    wide          21.6%             784     392%
1 per 20    fragment      93.0%             140      25%
1 per 5     wide           5.2%             948     474%
1 per 5     fragment      78.8%             423      39%
1 per 2     wide           1.6%             984     492%
1 per 2     fragment      61.8%             765      56%
```

| Writes | Load "wide" | Load "fragment" |
|---|---|---|
| None (empty cache at the start: only the first recomputations) | 20% | 20% |
| 1 visit in 100 (one comment per second) | **187%** | 21% |
| 1 visit in 20 | 392% | 25% |
| 1 visit in 5 | 474% | 39% |
| 1 visit in 2 | 492% | 56% |

A single comment per second takes the server from 20% to 187% load with the wide variant: the cache empties faster than it fills. The hit rate drops to 62.7% (one write per 100 visits), then to 1.6% (one per 2): in this last case, almost every visit triggers a full recomputation. The cache still exists, but it no longer does any good.

### From slowness to denial of service

If writing is **open to anyone** (comment form, "like" button, adding to the cart, sending a contact form), a malicious third party, or a simple overzealous robot, can produce the write frequency that empties the cache. A **request** (a demand sent to the server) that is **cheap** can then trigger **costly** recomputations: this is an **amplification**. The server saturates without any single request being huge. It is an **application-level denial of service** (making the service unusable through the load imposed on it, without breaking the network). This chapter does not detail attacks: the catalogue of overload families, with their defences, is in [Overload and Application-Level Denial of Service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

| Defence | Principle | Effect in the experiment |
|---|---|---|
| **Fine-grained tags** | A piece carries only the tags it really depends on | "Fragment" variant: 187% becomes 21% |
| **Limit the write rate** | A maximum number of writes per user and per minute | Caps the frequency `k` |
| **Group invalidations** | Invalidate once per second at most, not at each write | Whatever the number of writes, a single purge per interval |
| **Serve the old answer during recomputation** | The stale entry stays served while a single visitor recomputes it | No burst of recomputations (see below) |
| **Reserve writes for logged-in accounts** | No anonymous write on what invalidates a wide cache | Fewer possible authors |

## Contexts that are too fine

The opposite error to forgetting a context is to declare **too many**, or to choose a context with too many values. Since each value of a context creates a variant of the key, the number of possible entries is the **product** of the number of pages by the number of values of each context:

```text
possible entries = pages × (values of context 1) × (values of context 2) × ...
```

Experiment: 20 articles, 50 logged-in readers (2 languages, 3 roles), 3,000 visits. With only the language as a context, there are 20 × 2 = 40 possible keys; with the identifier of the reader, up to 20 × 50 = 1,000.

```python
USERS = 50                                     # 50 different logged-in readers
ROLES = ["reader", "editor", "admin"]          # the role of a reader (3 values)


def traffic_contexts(names):                   # 3000 visits with these contexts
    clock["t"] = 0.0                           # the clock starts again from zero
    cache, rng = Cache(), random.Random(3)     # seed 3: reproducible draws
    for _ in range(3000):                      # 3000 visits
        clock["t"] += 0.01                     # 100 visits per second
        u = rng.randrange(USERS)               # who visits
        known = {                              # what the request knows about the reader
            "language": LANGUAGES[u % 2],      # their language (u % 2: remainder)
            "role": ROLES[u % 3],              # their role (u % 3: remainder)
            "user": f"u{u}",                   # their identifier
        }
        context = {name: known[name] for name in names}  # we keep the declared contexts only
        n = rng.randrange(ARTICLE_COUNT)       # the article requested
        cache.serve(f"article:{n}", context, {f"article:{n}"}, 3600)
    rate = 100 * cache.hits / (cache.hits + cache.misses)  # overall hit rate
    return rate, len(cache.entries), cache.computations  # rate, entries kept, recomputations


print(f"{'contexts':<24}{'hit rate':>9}{'entries':>9}{'recomputations':>16}")
for names in (["language"], ["language", "role"], ["user"]):  # from the widest to the finest
    rate, entries, computations = traffic_contexts(names)  # we run the experiment
    print(f"{' + '.join(names):<24}{rate:>8.1f}%{entries:>9}{computations:>16}")
```

Result obtained:

```text
contexts                 hit rate  entries  recomputations
language                    98.7%       40              40
language + role             96.0%      120             120
user                        68.3%      950             950
```

| Contexts | Entries kept | Hit rate | Reading |
|---|---|---|---|
| `language` | 40 | 98.7% | Few variants, each one served many times |
| `language + role` | 120 | 96.0% | A few more variants, still efficient |
| `user` | 950 | 68.3% | Almost one entry per visitor: each entry serves little before being forgotten |

In the last case, the cache **works** (it never gives a wrong answer), but it is barely useful: 950 recomputations for 3,000 visits, against 40. On top of that, it takes up more memory. The rule: choose as context the **category** that really makes the answer vary (the language, the role), and never the identity of the person if the page does not depend on it. A block that really depends on the user is isolated in its own piece (see the merge above), so that the rest of the page stays shared.

## The stampede on an empty cache

When a heavily requested entry disappears (invalidated, expired, or after a restart), the visitors who arrive while it is being recomputed all find it missing. If each of them starts the recomputation on their own, the server receives **a burst of identical computations**: this is the **stampede on an empty cache** (*cache stampede*). This phenomenon worsens the overload of the previous section: the slower the recomputation, the more visitors arrive before it finishes.

The experiment launches 20 **threads** (a thread is a sequence of instructions that runs at the same time as others, see [Parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) which request the same empty key at the same instant. A **lock** is an object that only one thread at a time can hold: the others wait until it is released. Here, the thread that holds the lock recomputes; the others, once they enter in their turn, find the answer already stored and do not recompute. The functions of the `threading` module are described in the [official Python documentation](https://docs.python.org/3/library/threading.html). In the code: `Thread(target=f)` creates a thread that will run `f`, `start()` launches it, `join()` waits for its end; `Barrier(n)` makes each thread wait until `n` threads have arrived, then releases them all together; `time.sleep(0.05)` suspends the thread for 50 milliseconds (0.05 s) to simulate a slow computation; `with lock:` holds the lock for the duration of the block; `setdefault(key, value)` returns the value of the key, creating it if it is missing. A second lock, `counter_lock`, protects the recomputation counter: if two threads added 1 at the same time, one of the additions could be lost. Finally `compute` and `reader` are functions defined inside `stampede`: they can thus use its variables (`cache`, `counter`, `locks`).

```python
def stampede(with_lock, threads=20):           # `threads` readers arrive on an empty key
    cache = Cache()                            # an empty cache: everyone misses
    counter = {"n": 0}                         # recomputations actually started
    counter_lock = threading.Lock()            # protects the shared counter
    locks = {}                                 # one lock per key
    start = threading.Barrier(threads)         # all the threads start at the same instant

    def compute():                             # the slow computation
        with counter_lock:                     # one thread at a time changes the counter
            counter["n"] += 1                  # one more recomputation
        time.sleep(0.05)                       # 50 ms of work
        return "popular page"                  # the result

    def reader():                              # what each thread does
        start.wait()                           # waits until all of them are ready
        if cache.read("home", {}) is not None:  # entry present?
            return                             # yes: nothing to do
        if with_lock:                          # protected variant
            lock = locks.setdefault("home", threading.Lock())  # the lock of the key
            with lock:                         # only one thread at a time enters here
                if cache.read("home", {}) is None:  # another may have filled it already
                    cache.write("home", {}, compute(), {"listing"}, 60)
        else:                                  # naive variant: each one recomputes
            cache.write("home", {}, compute(), {"listing"}, 60)

    thread_list = [threading.Thread(target=reader) for _ in range(threads)]  # creates threads
    for t in thread_list:                      # starts each thread
        t.start()
    for t in thread_list:                      # waits for each thread to end
        t.join()
    return counter["n"]                        # number of recomputations started


print("without lock :", stampede(False), "recomputations for 20 readers")
print("with lock    :", stampede(True), "recomputation for 20 readers")
```

Result obtained:

```text
without lock : 20 recomputations for 20 readers
with lock    : 1 recomputation for 20 readers
```

Twenty identical recomputations without a lock, one single recomputation with it. Other defences exist, which add to this one:

| Defence | Principle | Against what |
|---|---|---|
| **Per-key lock** | Only one visitor recomputes, the others wait for the result | Bursts of identical recomputations |
| **Serve the stale answer during recomputation** (*stale-while-revalidate*, see [High-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | The old value stays served for a few seconds | Latency seen by visitors |
| **Vary the lifetime** | Add **jitter** (random variation) of ± 10% to the `max-age` of each entry | Simultaneous expiries (see below) |
| **Preheat** | Recompute the popular pages in advance after a purge | Slow first visitors |

Varying the lifetime avoids another case of burst: entries **written together with the same lifetime** expire **together**. The experiment writes 1,000 entries at the same instant, with a nominal lifetime of 60 seconds:

`random.uniform(a, b)` draws a random number between `a` and `b`; `int(x)` keeps its whole part, here the second at which the entry expires.

```python
def expirations_per_second(jitter):            # 1000 entries written together
    rng = random.Random(4)                     # seed 4: reproducible draws
    per_second = {}                            # second -> entries that expire
    for _ in range(1000):                      # 1000 entries
        duration = 60 * rng.uniform(1 - jitter, 1 + jitter)  # nominal 60 s, ± jitter
        second = int(duration)                 # expiry second (written at 0)
        per_second[second] = per_second.get(second, 0) + 1  # we count
    return max(per_second.values())            # the peak of expirations in one second


print("no variation :", expirations_per_second(0.0), "expirations in the same second")
print("± 10%        :", expirations_per_second(0.1), "expirations at most per second")
```

Result obtained:

```text
no variation : 1000 expirations in the same second
± 10%        : 104 expirations at most per second
```

Without variation, the 1,000 entries expire in the same second; with ± 10%, at most 104 per second, that is ten times fewer.

## An example in a framework: Drupal

A **framework** is a ready-made code base on which an application is built. [Drupal](https://www.drupal.org/docs/drupal-apis/cache-api/cache-api), a content management system (software for publishing and organizing pages) written in [PHP](/?c=langages&s=php&p=php), applies the three pieces of metadata of this chapter with its own words: the **contexts** (*cache contexts*), the **tags** (*cache tags*) and the **lifetime** (*max-age*). It makes them **bubble up** from each piece to the page, according to the merge rules seen above.

> The names of contexts, tags and functions in this section are checked against the Drupal 11.x source code.

In PHP, `[ key => value ]` creates an associative array (like a Python dictionary), and `=>` links a key to its value. `\Drupal\Core\Cache\Cache::invalidateTags(...)` calls the function `invalidateTags` of the class `Cache`, placed in the namespace `\Drupal\Core\Cache` (a name like a folder, which avoids name collisions); `::` calls a function attached to the class, without creating an object.

```php
<?php
// A "render array": the description of a piece of the page.
$render = [
    '#markup' => 'List of articles',                      // the content to display
    '#cache' => [                                         // the cache metadata
        'contexts' => ['languages:language_interface', 'user.roles'],  // varies with...
        'tags' => ['node:7', 'node_list'],                // depends on...
        'max-age' => 3600,                                // lifetime, in seconds
    ],
];

// After content number 7 is saved: we invalidate its tags.
\Drupal\Core\Cache\Cache::invalidateTags(['node:7', 'node_list']);
```

| Concept of the chapter | Written in this example | Note |
|---|---|---|
| Context | `languages:language_interface`, `user.roles` | The answer varies with the interface language and with the roles of the user |
| Tag | `node:7`, `node_list` | `node` is the name Drupal gives to a piece of content; `node_list` is the tag of content lists |
| Lifetime | `'max-age' => 3600` | In seconds; a value of 0 forbids keeping the answer |
| Targeted invalidation | `Cache::invalidateTags(['node:7', 'node_list'])` | Removes the entries that carry one of these tags, like `invalidate` above |

The pattern is the same as in Python: declare what a piece depends on, and let the framework merge and invalidate. The pitfalls of this chapter apply to it as they are: a piece of duration 0 ruins the whole page, and a tag that is too wide (`node_list` on every page) turns each content change into a massive purge.

## Where the cache sits

The same three pieces of metadata are found at each stage of the chain that leads from the visitor to the data:

| Stage | Who keeps the copy | Who decides to invalidate it |
|---|---|---|
| Visitor's browser | The browser | Mostly the lifetime; the server cannot reach it |
| CDN | A network of servers close to visitors ([CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative)) | A purge requested from the CDN, or the lifetime |
| Application | The memory of the server, or a dedicated service such as [Redis](/?c=donnees&s=bases-de-donnees&p=redis) | The application code, by tag |
| In front of the database | The result of an expensive query, kept to avoid running it again ([High-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic)) | The application code, or the lifetime |

A cache mainly serves to avoid costly round trips. When there is nothing to keep, [Cutting Round Trips](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours) shows how to group them.

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| No context while the answer varies | A visitor gets the answer of someone else, sometimes their data | Declare each factor of variation in the key |
| A context that is too fine (the identifier of the user) | Almost one entry per visitor, the cache no longer helps (68% instead of 99% in the experiment) | Choose the category (language, role), isolate the personal block |
| No tag, only a lifetime | A change stays invisible until expiry | Tag by data, and invalidate on write |
| A tag that is too wide | Each write empties a whole cache: 187% load for one comment per second | Fine tags, separate blocks |
| Full purge "to be safe" | 42 entries removed instead of 4, 41 recomputations instead of 4 | Targeted invalidation by tag |
| A piece of duration 0 in a page | The minimum duration goes up: the whole page becomes impossible to keep | Isolate the dynamic piece, load it separately |
| Open writing that invalidates a wide cache | Amplification: cheap request, costly recomputations, application-level denial of service | Limit the writes, group the invalidations |
| Same lifetime on entries written together | They expire together and cause a burst | Vary the lifetime (± 10%) |
| Several visitors recomputing the same key | Stampede on an empty cache: 20 recomputations instead of one | Per-key lock, or serve the old value during recomputation |

## Best practices

| Best practice | Why |
|---|---|
| Declare for each entry its contexts, its tags and its lifetime as soon as it is created | The three pieces of information are rarely missing together, but each missing one creates a different defect |
| Choose the **coarsest** contexts that are enough | Fewer variants, more hits |
| Tag each entry with **all** the data it depends on, and nothing more | Invalidate enough, without emptying what has not changed |
| Separate the pieces that change often from the rest of the page | A fragile piece does not ruin the others |
| Invalidate by tag, never by full purge, except during an incident | The cost follows the size of the change |
| Measure the hit rate and the number of recomputations after each write | A cache emptied too often shows up in the numbers before it shows up for visitors |
| Limit how often invalidating writes happen, and group their invalidations | Cuts off the amplification into a denial of service |
| Per-key lock and varied lifetime | Avoids bursts of identical recomputations |
| Measure first (see [measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) before generalizing a cache | It complicates the code: it must save real time |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A cache entry is found by a **key** and carries three **metadata**: the **context** (what makes the answer vary: language, role; it goes into the key), the **tag** (what it depends on, to invalidate it in a targeted way) and the **lifetime** (`max-age`, after which it is stale). The metadata of a composed page **bubble up**: union of the contexts, union of the tags, minimum of the lifetimes. Invalidation by tag removes only what is needed (4 entries out of 42, 98.7% hit rate afterwards), whereas the full purge removes everything (86.3%, 41 recomputations). A frequent write that invalidates a wide cache empties it faster than it fills: 187% load for one comment per second, against 21% with a separate block. Open to third parties, this write becomes an application-level denial of service, detailed in [Overload and Application-Level Denial of Service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). A context that is too fine (one per user) leaves a correct but useless cache (68.3%). The stampede on an empty cache (20 identical recomputations) is cut off by a per-key lock and by a varied lifetime. |
| **Pitfalls to avoid** | Forgotten context (another visitor's answer); context that is too fine; lifetime without tag; tag that is too wide; systematic full purge; piece of duration 0 in a page; public write that invalidates a wide cache; identical lifetimes on entries written together; concurrent recomputations of the same key. |
| **Best practices** | Declare contexts, tags and lifetime at creation; coarse contexts; exact tags; separate pieces for what changes often; targeted invalidation; limit and group the invalidating writes; per-key lock and varied lifetime; measure the hit rate and the recomputations. |
