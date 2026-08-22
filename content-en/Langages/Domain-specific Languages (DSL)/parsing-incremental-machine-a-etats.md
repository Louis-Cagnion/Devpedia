---
order: 3
---

# Incremental Parsing with a State Machine

[Regex](/?c=domain-specific-languages-dsl&p=regex) finds patterns in text, but stays blind to **nested structure** (a tag opened somewhere, closed much further away, with other tags in between): that's not what it's built for. The best-known solution for a tagged format like [HTML](/?c=langages-de-balisage&s=html&p=html) (or its more generic cousin [**XML**](https://www.w3.org/XML/), *Extensible Markup Language*, which follows the same nested-tag rules but with no predefined tag vocabulary) is to build a complete **tree** in memory, the [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements), then walk it. There's a third, lighter path: **incremental parsing**, which processes the text on the fly, one event at a time, without ever building a complete structure.

## Three ways to read a tagged format

| | Regex | Tree (DOM) | Incremental parsing |
|---|---|---|---|
| Principle | Search for a text pattern | Build the entire structure in memory, then walk it | Receive one event per tag encountered (open, text, close), as reading proceeds |
| Memory used | Minimal | Proportional to the size of the whole document | Minimal: nothing is ever stored beyond what the code chooses to keep |
| Understands nesting? | No | Yes, natively (it's a tree) | Not natively: it's up to the calling code to reconstruct it itself |
| Suited for | A one-off search/replace | A document that fits comfortably in memory, to be queried in several ways | A very large document, or a simple structure not worth loading in full |

An incremental parser never knows "the whole document": it only knows what's happening **right now**, plus whatever the code has explicitly chosen to remember since the start. This constraint is what gives it its name, **state machine**: the program itself has to maintain a state ("am I currently inside a table row? A cell?"), updated with each event received.

## `HTMLParser`: a concrete example in Python

The standard `html.parser` module provides `HTMLParser`, a class to subclass: three methods, automatically called for every tag or text fragment encountered while reading.

```python
from html.parser import HTMLParser

class MyParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        print(f"Opening: <{tag}> with attributes {attrs}")

    def handle_endtag(self, tag):
        print(f"Closing: </{tag}>")

    def handle_data(self, data):
        if data.strip():
            print(f"Text: {data.strip()!r}")

parser = MyParser()
parser.feed("<p>Hello <b>everyone</b></p>")
```

```text
Opening: <p> with attributes []
Text: 'Hello'
Opening: <b> with attributes [('class', None)]
Text: 'everyone'
Closing: </b>
Closing: </p>
```

`feed()` can be called several times with successive chunks of the document (useful for a stream received bit by bit, for example over the network): the parser doesn't need to know anything in advance about what comes next.

> **Note:** `HTMLParser` checks **no** structural consistency at all. A `</p>` with no matching `<p>`, or a tag that's never closed, causes no error: each `handle_*` is simply called when the corresponding tag is encountered, with no judgment on the document's validity. It's up to the calling code to decide what to do with an unexpected event.

## Reconstructing a structure: maintaining the state yourself

`HTMLParser` delivers events, but never hands back "a table's row" or "the current cell": these notions only exist by building instance variables updated on every event, exactly like a real project reconstructing an HTML table (`<table>`/`<tr>`/`<td>`) into a grid of cells:

```python
class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []              # every complete row, once closed
        self._current_row = None    # None = "not currently inside a <tr>"
        self._current_cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._current_row = []
        elif tag in ("td", "th"):
            self._current_cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._current_cell is not None:
            text = "".join(self._current_cell).strip()
            self._current_row.append(text)
            self._current_cell = None
        elif tag == "tr" and self._current_row is not None:
            self.rows.append(self._current_row)
            self._current_row = None

    def handle_data(self, data):
        if self._current_cell is not None:
            self._current_cell.append(data)
```

- `self._current_row` and `self._current_cell` are this state machine's **state**: their value (`None` or a list being filled in) determines how to interpret the next event received.
- `handle_data` can be called **several times** for the same piece of text (the underlying HTML module sometimes splits text into several fragments, for example around an entity like `&amp;`): that's why `_current_cell` accumulates into a **list** (`.append`), rather than overwriting a plain variable on each call.

> **Pitfall:** overwriting the accumulated state instead of extending it (`self._current_cell = data` instead of `self._current_cell.append(data)`). If a cell's text arrives in several fragments, only the last fragment would survive, with no visible error: just a truncated cell in the final result.
>
> **Best practice:** always accumulate (`append`/concatenation) the text received by `handle_data`, never replace it, until the matching closing tag is reached.

## The hard case: merges (`rowspan`) spanning several rows

Reconstructing the exact position (row, column) of each cell becomes noticeably trickier as soon as a cell has a `rowspan`: it "occupies" its column on the **following** rows, which haven't been read yet at the moment this information becomes known.

```text
Events received in order:                    Reconstructed grid:
<tr><td rowspan="2">A</td><td>B</td></tr>    Row 0: [A (col 0), B (col 1)]
<tr><td>C</td></tr>                          Row 1: [A still occupies col 0, C (col 1)]
```

On row 1, the only event received is `<td>C</td>`: nothing in this isolated event says which column `C` should land in. The code has to remember, from the previous row, that column 0 is still "taken" by cell `A` for one more turn:

```python
occupied_columns = {}  # {column index: number of rows remaining occupied by a merge}

def place_cell(starting_column, rowspan, occupied_columns):
    column = starting_column
    while occupied_columns.get(column, 0) > 0:  # this column is still taken by a previous merge
        column += 1                              # -> shift to the first genuinely free column
    if rowspan > 1:
        occupied_columns[column] = rowspan
    return column
```

Before processing each new row, every active counter in `occupied_columns` must be decremented by one (one more row has just been "consumed" by the merge), and removed once it reaches zero.

> **Pitfall:** placing a cell at its raw position (0, 1, 2...) without consulting merges still active from previous rows. The next cell then ends up in the wrong column, a shift that silently propagates to the rest of the row, with no error signaling it.
>
> **Best practice:** explicitly maintain, column by column, the number of rows a vertical merge still needs to occupy, and "skip" those columns before placing each new cell in a row.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An incremental parser (`HTMLParser`) delivers one event per tag/text encountered, without ever building a complete structure: it's up to the code to maintain its own state (a state machine) to reconstruct meaning, row by row, cell by cell. |
| **Available Tools** | `html.parser.HTMLParser` (`handle_starttag`/`handle_endtag`/`handle_data`), a dictionary of occupied columns to track merges (`rowspan`) spanning several rows. |
| **Pitfalls to Avoid** | Overwriting accumulated text instead of extending it across several calls to `handle_data`. Placing a cell without accounting for active merges inherited from previous rows. |
| **Best Practices** | Always accumulate the text received until the closing tag. Explicitly track, column by column, still-active vertical merges before placing a new cell. |
