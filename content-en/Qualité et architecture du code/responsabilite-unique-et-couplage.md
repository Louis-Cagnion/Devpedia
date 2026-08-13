---
order: 1
---

# Single Responsibility and Low Coupling

A function, class, or file that does "a bit of everything" feels convenient at the time (everything's in one place) but becomes the first obstacle as soon as it needs to change: a change for one need unintentionally derails another use of the same file, because the two were never truly independent.

## The real test: the reason to change

The question to ask isn't *"is this file too long?"* but *"if I need to modify this, is it for the same reason as that?"*. Two pieces of code that change for different reasons (one because business logic evolves, the other because the display format changes) should live in different files, even if they're short and linked in the same execution flow.

A concrete example: a module that mixed rendering a report (text formatting, tables, summary) with managing resumption state (saving where an interrupted process left off, to resume it later). Each had its own reason to change (one follows presentation requests, the other follows error-recovery logic) and they ended up living in two separate files (`report.py` for rendering, `resume.py` for resumption state), each testable and understandable without the other.

## The concrete signal for splitting a file

Two complementary signals indicate a file has outgrown its single responsibility:

- **Responsibilities that don't share the same reason to change**: the test above, the most reliable but also the most subjective.
- **A size that exceeds a reasonable threshold** (often cited around 700-800 lines for a code file): a more mechanical signal, not a cause in itself but one that correlates strongly with a file that has accumulated several responsibilities without anyone noticing.

A test file of over 1200 lines, covering seven distinct modules of the same project, illustrates both signals at once: each module has its own reason to change (a change to spec parsing shouldn't touch the browser-management tests), and the size made the file painful to navigate. Splitting it into seven files, one per tested module, made each part independently readable and runnable.

## Low coupling: the other half of the equation

Single responsibility isn't enough if the pieces, once separated, depend heavily on each other's internal details: a file that's "separate" but has to be re-read in full every time another one changes is only separate in appearance. Low coupling means a module exposes a clear interface (functions, types) and its callers only need to know that interface, never its internal implementation.

> **Warning sign:** if modifying an implementation detail in one file systematically forces a change in another file that merely calls it, coupling is too tight, even if each file, taken in isolation, seems to have a clear responsibility.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A file that mixes several reasons to change becomes fragile: a change for one need derails another. The real test: "if I modify this, is it for the same reason as that?". |
| **Tools you can use** | The size signal (~700-800 lines) as a mechanical clue, complementary to the reason-to-change test. |
| **Pitfalls to avoid** | Splitting files without reducing the coupling between them: a "separate" file that has to be re-read in full on every change to another stays coupled, even if it looks independent. |
| **Best practices** | Split a file as soon as two distinct responsibilities are mixed in it, with a clear interface between the pieces that come out of the split. |
