---
order: 3
---

# Pattern Matching and Algebraic Types

## Variant types (sum types)

A **variant type** enumerates every possible shape a value can take, each able to carry its own data:

```ocaml
type shape =
  | Circle of float                    (* radius *)
  | Rectangle of float * float          (* width, height *)
  | Triangle of float * float * float    (* three sides *)
```

A value of type `shape` is **exactly one** of these three possibilities, never a mix or anything else, unlike a base class with inheritance (see the [Inheritance and Polymorphism](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) chapter, [C++](/?c=langages-de-programmation&s=cpp&p=cpp) section), where the set of possible subclasses stays open: anyone can add a new one elsewhere in the code.

## Pattern matching (`match`)

`match` breaks a value down by its shape, and directly extracts the data it carries:

```ocaml
let area shape =
  match shape with
  | Circle radius -> Float.pi *. radius *. radius
  | Rectangle (width, height) -> width *. height
  | Triangle (a, b, c) ->
      let s = (a +. b +. c) /. 2.0 in
      sqrt (s *. (s -. a) *. (s -. b) *. (s -. c))
```

Compared to a `switch` (see the [Conditions](/?c=langages-de-programmation&s=c&p=conditions) chapter, [C](/?c=langages-de-programmation&s=c&p=c) section), the difference isn't just cosmetic: each branch **extracts** `radius`, or `width` and `height`, directly, with no manual field access (`shape.radius`) or prior type check.

## Exhaustiveness checked at compile time

If a branch is forgotten, the OCaml compiler flags it on its own, with no test needed to catch it:

```ocaml
let incomplete_area shape =
  match shape with
  | Circle radius -> Float.pi *. radius *. radius
  | Rectangle (width, height) -> width *. height
  (* Warning 8: this pattern matching is not exhaustive -- the Triangle case is not covered *)
```

By default this is only a **warning** (the program still compiles), but a serious project generally enables the option that turns this kind of warning into a blocking error, making exhaustiveness a guarantee, not just a suggestion. This is a major structural difference from a `switch`/`if-elif` in C, [PHP](/?c=langages-de-programmation&s=php&p=php), or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript): a forgotten case there compiles with no warning at all, and only fails at **runtime**, if and only if that exact case ever comes up in production, one of the most expensive silent failures to diagnose, since it only shows up months after the code was written, on an input nobody anticipated. In OCaml, adding a new case to a variant type (`Rhombus of float`) immediately surfaces, right at compile time, **every** `match` in the entire program that needs updating to handle it.

## The `option` type, a structural alternative to `null`

`option` is itself a variant type, already defined in the standard library:

```ocaml
type 'a option = None | Some of 'a
```

```ocaml
let find_user id =
  if id = 42 then Some "Alice" else None

match find_user 42 with
| Some name -> print_endline name
| None -> print_endline "User not found"
```

The difference from `None` in [Python](/?c=langages-de-programmation&s=python&p=python) (see the [Variables](/?c=langages-de-programmation&s=python&p=variables) chapter for `is None`) is that the compiler **forces** the `None` case to be handled: the type of a function that might find nothing is explicitly `string option`, never just `string`. It's therefore impossible to forget to check for a missing value without the compiler flagging it, where a [`NullPointerException`](https://docs.oracle.com/en/java/) or a `TypeError: 'NoneType' object is not subscriptable` in Python only shows up at runtime, on the exact code path that forgot it.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A variant type enumerates every possible shape a value can take; `match` breaks it down and extracts its data. The compiler checks a `match`'s exhaustiveness: a forgotten case is caught before execution, not just the day it shows up in production. |
| **Tools you can use** | `type ... = \| ...`, `match ... with`, the `option` type (`Some`/`None`) as a structural alternative to `null`. |
| **Pitfalls to avoid** | Leaving a non-exhaustive `match` as a plain warning rather than a blocking error. |
| **Best practices** | Enable the option that turns a non-exhaustive `match` into a compile error; use `option` rather than a value that could be missing with no type signaling it. |
