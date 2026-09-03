---
order: 5
---

# Long-Running Processes

Past a few minutes of execution, a program changes nature. It's no longer a command you launch and watch the result of: it's a process that can be interrupted, that needs to be monitorable, and whose failure is costly. At this scale, robustness becomes a matter of performance: resuming a 20-minute job is a far bigger win than shaving 10% off it.

## Saving progress as you go

A program that accumulates its results in memory and only writes at the end loses **everything** if interrupted: a crash, the network, the machine going to sleep. Writing each result as soon as it's obtained completely changes behavior in the event of an incident.

The simplest format for this is [**JSON Lines**](https://jsonlines.org): one complete JSON object per line. Unlike a JSON array, it doesn't need to be closed to stay readable: a file truncated mid-way remains usable up to its last complete line.

```python
class ProgressState:
    def __init__(self, path, resume=False):
        self.path = Path(f"{path}.partial")
        self.results = []
        if resume and self.path.exists():
            self.results = [json.loads(line) for line
                            in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]
        else:
            self.path.unlink(missing_ok=True)
        self.done = {key(r) for r in self.results}

    def add(self, result):
        self.results.append(result)
        self.done.add(key(result))
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(result, ensure_ascii=False) + "\n")
```

The main loop then skips what's already done:

```python
remaining = [t for t in tasks if not state.is_done(t)]
```

Two details that make a real difference in practice:

- **Filter before counting.** If you skip elements inside the loop, progress counters and the completion estimate become wrong (they include work that cost nothing). Computing the list of what's left first keeps both accurate.
- **Separate state from the deliverable.** This file is internal plumbing, not a result: giving it an explicit name (`.partial`) and deleting it at the end avoids it being mistaken for the output. Keeping it distinct from the deliverable also avoids an external tool (a spreadsheet app, for instance) re-saving it in a format that would break resumption.

## Reading a large file as a stream rather than loading it all

A file of a few kilobytes loads entirely into memory without a second thought. A file of several hundred megabytes (a product catalog XML export, say) changes things: loading it in one block can be enough to exhaust available memory.

```text
Full load (DOM):        entire file -> tree in memory -> traversal
                         memory proportional to file size

Streaming (SAX/XMLReader): file -> read node by node -> processed as it streams
                            near-constant memory, regardless of file size
```

| | Full load (DOM, SimpleXML) | Streaming (SAX, `XMLReader`) |
|---|---|---|
| Memory used | Proportional to file size | Near constant |
| Code simplicity | Simple: the whole document is navigable at once | More verbose: you must manually advance through the stream |
| Suited to | Reasonably sized files (up to a few tens of MB) | Large files, where loading everything would crash the process |

```php
<?php
$reader = new XMLReader();
$reader->open('catalog.xml');

while ($reader->read()) {
    if ($reader->nodeType === XMLReader::ELEMENT && $reader->name === 'product') {
        $product = new SimpleXMLElement($reader->readOuterXML());   // only one <product> in memory at a time
        process($product);
    }
}
$reader->close();
?>
```

`XMLReader` advances through the file one node at a time, never loading the entire tree: each time a `<product>` is encountered, only that fragment is momentarily turned into an object, processed, then released on the next pass.

The same trade-off exists beyond PHP: [`xml.etree.ElementTree.iterparse`](https://docs.python.org/3/library/xml.etree.elementtree.html#xml.etree.ElementTree.iterparse) in Python, or the [`sax`](https://www.npmjs.com/package/sax) library in Node.js.

> **Pitfall:** loading a large XML file with `SimpleXML`/DOM "because it works in dev" (a small test file), without having tested against a volume representative of production.
>
> **Best practice:** as soon as a file can exceed a few tens of megabytes in production, prefer a streaming parser (`XMLReader` or equivalent) over a full load, even if the code becomes a bit more verbose.

## Showing progress

A 20-minute process with no display is indistinguishable from a stuck program. Displaying progress and an estimated time remaining costs a few lines:

```python
def time_remaining(start, done, total):
    if done < 2:                      # not enough data yet for a rate estimate
        return ""
    remaining = (time.monotonic() - start) / done * (total - done)
    return f" ~{int(remaining)}s remaining" if remaining < 90 else f" ~{round(remaining / 60)} min remaining"
```

Use `time.monotonic()`, not `time.time()`: the latter can go backward (clock sync, a time change) and produce negative durations.

## Never silently half-succeed

This is the most important point, and the easiest to miss. A long process rarely fails all at once: it fails **partially**. One page out of fifty doesn't load, an element is missing. If the program just carries on, it produces an incomplete result that looks exactly like a complete one.

The dangerous reflex is a silent `break` or `except`:

```python
try:
    load_next()
except Timeout:
    break              # exits with partial data, with nothing flagged
```

The fix isn't to prevent the failure (that's impossible) but to guarantee it's **visible**. The most reliable method is checking an **invariant** at the end: a property that must always be true at that point in the program, whatever path was taken to get there (here: "the number of elements obtained matches the announced total"), regardless of the reason for the failure:

```python
if announced_total is not None and len(fetched) < announced_total:
    mark_incomplete(f"{len(fetched)} elements out of {announced_total} announced")
```

This check catches every case, including ones you hadn't anticipated (the site's layout changed, unusual slowness). It relies on a simple principle: the program often knows **how many** it should get. Comparing what was obtained to what was expected is nearly always possible, and it's what distinguishes a reliable result from a plausible one.

> On a run of several hundred units, an explicit status like `INCOMPLETE` is more useful than an exception: it preserves the data already collected while flagging that it needs redoing. What's unacceptable is the third case: incomplete and marked `OK`.

## Checking the content produced, not the return code

The two most serious bugs I've run into with this kind of program both exited with a **return code of 0**: an incomplete extraction classified as correct, and a final report that was entirely empty after merging parallel results. No "does it crash?" test would have caught either one.

The lesson is direct: for a long, unsupervised process, test the **content** of the output (the number of elements, the presence of expected sections), not just whether the program finishes.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A process running several minutes must be able to resume after an interruption (incremental saving), read a large file as a stream rather than loading it all, display its progress, and detect a partial failure rather than silently masking it. |
| **Tools you can use** | The JSON Lines format for resilient incremental saving, a streaming parser (`XMLReader`, `iterparse`) for a large file, `time.monotonic()` for a reliable duration estimate, an invariant check at the end of the process. |
| **Pitfalls to avoid** | A silent `except`/`break` that leaves a partial result unflagged; only checking the return code, not the actual content produced; loading a large file entirely into memory without testing it against a representative volume. |
| **Best practices** | Compare the number of elements obtained to the number expected; keep the internal state file (`.partial`) separate from the final deliverable; prefer a streaming parser as soon as a file can exceed a few tens of megabytes. |
