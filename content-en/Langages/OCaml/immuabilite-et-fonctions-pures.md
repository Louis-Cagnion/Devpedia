---
order: 2
---

# Immutability and Pure Functions

## Immutability by default, and its explicit escape hatch

An OCaml binding (`let x = ...`) can't be reassigned: modifying a value requires creating a **new** value from the old one, never modifying the original in place. When a genuinely mutable slot is needed, OCaml requires it to be declared explicitly with a **reference**:

```ocaml
let counter = ref 0        (* a reference: an explicit mutable slot *)
counter := !counter + 1     (* := assigns a new value *)
print_int !counter           (* ! reads the current value -> 1 *)
```

The `ref`/`:=`/`!` syntax makes every mutation **visible in the code**: impossible to mutate a value by accident, unlike a Python or JavaScript variable, mutable by default with no distinctive mark at the spot where it's modified.

## Persistent data structures

Adding an element to an OCaml list never modifies the original list: the `::` operator builds a **new** list, which shares its tail with the old one rather than copying it entirely.

```ocaml
let list_a = [2; 3; 4]
let list_b = 1 :: list_a   (* list_b = [1; 2; 3; 4] *)
(* list_a still exists, unchanged: [2; 3; 4] *)
```

```python
# Python: append() mutates the existing list, there's only one list left
list_a = [2, 3, 4]
list_a.append(1)   # list_a becomes [2, 3, 4, 1] -- the original no longer exists
```

This so-called **persistent** structure makes it possible to keep several versions of the same collection without ever copying them in full: `list_a` and `list_b` coexist, share the memory of what they have in common, and neither can corrupt the other.

## Pure functions

A function is **pure** if it satisfies two conditions: its output depends only on its arguments (the same input always produces the same output), and running it produces no observable **side effect** (no mutation of state outside the function, no disk write, no display).

```ocaml
let square x = x * x            (* pure: depends only on x, no side effect *)

let counter = ref 0
let impure_square x =
  counter := !counter + 1;      (* side effect: modifies outside state *)
  x * x
```

`square` can be replaced by its return value anywhere in the program without changing its behavior, a property called **referential transparency**. `impure_square` cannot: calling it or not changes `counter`'s content, so the order and number of calls matter, not just the final result.

## Why this matters in practice

- **Testing becomes trivial**: a pure function is tested with inputs and an expected output, with no prior state to set up and no side effect to check after the call, the exact opposite of a hidden dependency.
- **No surprises between two calls**: since no shared state can be modified without the caller knowing, two identical calls always give the same result, even run in parallel on different cores; shared state mutated simultaneously by several threads is precisely one of the classic causes of a hard-to-reproduce bug.
- **A structurally impossible pitfall**: Python's mutable default argument (see the [Functions](/?c=langages-de-programmation&s=python&p=fonctions) chapter) only exists because a shared mutable object can be silently captured across several calls. With no implicit mutation, this specific pitfall simply has no way to occur.

> **Nuance:** no real program is 100% made of pure functions: displaying a result, reading a file, responding to a network request are side effects by nature. The goal isn't to eliminate them, but to **isolate** them: keep the portion of code that depends on them to a minimum, to focus testing and review effort where bugs are most likely.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An OCaml binding is immutable by default; `ref`/`:=`/`!` make every mutation explicit and visible. A pure function depends only on its arguments and has no side effect: its output is therefore predictable and testable in isolation. |
| **Tools you can use** | `ref`, `:=`, `!`, persistent data structures (immutable lists sharing their memory). |
| **Pitfalls to avoid** | Expecting a function with a side effect (via `ref`) to give the same result on every call, regardless of execution order. |
| **Best practices** | Isolate side effects in a small part of the code rather than eliminating them entirely; focus testing effort where they are. |
