---
order: 7
---

# One Mechanism Per Piece of Information

When the same piece of information can be represented by two overlapping mechanisms, the code responsible for interpreting it has to handle both, and rarely handles well the case where they contradict each other. This isn't just a matter of style: it's a direct source of silent inconsistency.

## A concrete example

A [Markdown](https://commonmark.org) file could, in theory, declare its title in two ways at once:

```markdown
---
title: Pointers
order: 5
---

# Pointers in C
```

The frontmatter says "Pointers", the body of the file says "Pointers in [C](/?c=langages-de-programmation&s=c&p=c)". Which one is the real title? The site generator has to pick a priority rule (does the frontmatter win? does the heading win? whichever was written last?), and that rule itself becomes a source of bugs: someone changes the heading thinking they're changing the displayed title, not knowing that the frontmatter (invisible on a quick read of the file) takes precedence.

This site deliberately avoids the problem: a chapter's frontmatter **never** carries a `title` field, only build metadata (`order`, for pedagogical sorting). The displayed title comes only from the body's first `# Heading`: a single source, a single place to change, no priority rule to document or remember.

## Why it always complicates the code, not just the data

The cost isn't limited to the risk of inconsistent data: the code that **reads** these two mechanisms has to itself contain the priority logic, which weighs it down for a case that should never have existed. A parser that has to check "is there frontmatter with a title? if not, look for a heading" is more complex, harder to test, and more likely to handle an edge case differently than the other mechanism would, compared to a single rule, with no exception, always applying.

## How to spot it

The signal appears whenever two independent mechanisms can each produce or represent the same piece of information: an identifier derived from a file name AND stored separately in a database; a configuration read from a file AND overridden by an environment variable, with neither one clearly prioritized by construction; a status computed on the fly AND cached, with no guaranteed invalidation between the two.

In each case, the question to settle is the same: **which of the two mechanisms is the source, and which one can be removed or reduced to a plain derivation of the first?** Keeping both "just in case" never eliminates the risk: it only postpones it to the inevitable moment they end up diverging.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Two mechanisms able to represent the same information (frontmatter + heading, file + environment variable...) force the code to pick a priority rule: a source of bugs on its own, not just a style choice. |
| **Tools you can use** | A single simple rule with no exception (e.g. the title always comes from the `# Heading`, never from a separate `title` field). |
| **Pitfalls to avoid** | Keeping two mechanisms "just in case" thinking it eliminates the inconsistency risk: it only postpones it to the moment they diverge. |
| **Best practices** | Identify which of the two mechanisms is the real source, and reduce the other to a plain derivation of it, or remove it. |
