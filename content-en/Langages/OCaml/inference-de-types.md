---
order: 5
---

# Type Inference

## Static, but with no annotations

OCaml is **statically typed**: every expression has a type fixed once and for all, checked before execution even begins, as in [C](/?c=langages-de-programmation&s=c&p=c) (see the [Variables and Data Types](/?c=langages-de-programmation&s=c&p=variables) chapter). Unlike C, this type almost never needs to be written explicitly:

```ocaml
let add x y = x + y
(* the compiler deduces on its own: add : int -> int -> int *)
```

Using `+` (reserved for integers in OCaml; `+.` is float addition) is enough for the compiler to deduce that `x` and `y` are `int`s, and therefore that `add` also returns one. No annotation was written, and yet the typing is just as strict as in C: calling `add 1 "two"` is an error caught at compile time, never at runtime.

## How inference proceeds

The mechanism (the [Hindley-Milner algorithm](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)) starts from each expression and sets up constraints on the types of its sub-expressions, then solves the whole constraint system for the entire program:

```ocaml
let double x = x + x
(* '+' requires: x is int, and the result is int *)
(* -> double : int -> int *)

let apply_twice f x = f (f x)
(* f must accept the type it returns -- no constraint fixes WHICH ONE *)
(* -> apply_twice : ('a -> 'a) -> 'a -> 'a *)
```

The second example illustrates **parametric polymorphism**: `'a` means "some type, to be determined based on the call", the same idea as a [C++](/?c=langages-de-programmation&s=cpp&p=cpp) template (see the [Templates](/?c=langages-de-programmation&s=cpp&p=templates) chapter), but resolved automatically by inference rather than declared explicitly at each use (`template<typename T>`).

## Compared to dynamic typing and gradual typing

| | C | [Python](/?c=langages-de-programmation&s=python&p=python) (annotations) | OCaml |
|---|---|---|---|
| Checking | At compile time | Optional: never, or via an [external checker](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) (`mypy`) | At compile time, systematically |
| Annotation required | Always (`int x`) | Optional | Never (inferred) |

Python (see the [Typing with Annotations](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) chapter) lets you add type hints after the fact, checked by a separate tool that remains optional: the program runs even if these annotations are wrong or missing. In OCaml, there's no "unchecked" mode: a program whose types don't line up simply doesn't compile, and can therefore never reach execution with a type inconsistency.

## A safety net, not a verbosity tax

The common assumption about statically typed languages is that they require writing more: true in C, where every variable carries its type. Inference decouples the two: the rigor of static typing (type errors caught before execution, even in code never run during testing) without the typing overhead usually associated with it.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | OCaml is statically typed but deduces types with no annotation (Hindley-Milner algorithm): the rigor of static typing without the usual typing overhead. |
| **Tools you can use** | Parametric polymorphism (`'a`) for a function that works on any type, resolved automatically. |
| **Pitfalls to avoid** | Believing that a language with no type annotation must be dynamically typed: OCaml checks everything at compile time, without exception. |
| **Best practices** | Let the compiler infer types rather than annotating systematically; annotations remain useful occasionally to document a complex signature. |
