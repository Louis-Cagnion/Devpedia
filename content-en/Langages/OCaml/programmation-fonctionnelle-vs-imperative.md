---
order: 1
---

# Functional vs. Imperative Programming

## Statements vs. expressions

In C, [Python](/?c=langages-de-programmation&s=python&p=python), or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), an `if` is a **statement**: it produces no value, it only triggers the execution of one block or another.

```python
# Python: if is a statement, each branch must explicitly assign
if age >= 18:
    message = "adult"
else:
    message = "minor"
```

In OCaml, as in most functional languages, `if` is an **expression**: it directly produces a value, the way a ternary operator would.

```ocaml
let message = if age >= 18 then "adult" else "minor"
```

This idea generalizes to the whole language: an entire block (delimited by `let ... in`) is itself an expression, whose value is that of its last line.

```ocaml
let result =
  let a = 2 in
  let b = 3 in
  a + b            (* result = 5: that's the value of the whole block *)
```

There is therefore no structural distinction between "what produces a value" and "what performs an action": everything produces a value, including `()` (*unit*, the equivalent of `void`) for an expression executed purely for its effect.

## Binding vs. mutation

`let x = 5` in OCaml doesn't reserve a reassignable memory slot: it's a **binding**, which associates the name `x` with the value `5` for the scope where it's visible. Reusing `let x = ...` doesn't modify anything, it creates a new name that shadows the old one.

```ocaml
let x = 5 in
let x = x + 1 in   (* new binding, does NOT modify the previous x *)
print_int x         (* 6 *)
```

```python
# Python: x is reassigned, the same variable changes value
x = 5
x = x + 1
print(x)   # 6
```

The displayed result is identical, but the mechanism differs: in Python, a single memory slot changed content; in OCaml, a new binding simply took over from the old one in the current scope. OCaml offers an explicit escape hatch for when a genuinely mutable slot is needed, the reference (`ref`), covered in depth in the chapter on immutability and pure functions.

## Loops vs. recursion

With no mutable variable by default, a classic loop (which relies on a counter reassigned on every iteration) has no natural place in functional style. The replacement is **recursion**: a function that calls itself, each call carrying the equivalent of one loop iteration.

```ocaml
(* Imperative style: mutable counter, for loop over an array *)
let sum_imperative array =
  let total = ref 0 in
  for i = 0 to Array.length array - 1 do
    total := !total + array.(i)
  done;
  !total

(* Functional style: recursion, no mutable variable *)
let rec sum_functional = function
  | [] -> 0
  | head :: rest -> head + sum_functional rest
```

Both styles coexist in OCaml: `ref`, `for`, and `while` genuinely exist in the language, this isn't a simulation. The chapter on recursion and higher-order functions details why the recursive version stays practical even on large lists.

## Summary

| | Imperative (C, Python, JS...) | Functional (OCaml) |
|---|---|---|
| Basic unit | Statement (no value) | Expression (always produces a value) |
| Variables | Reassignable by default | Immutable bindings by default, explicit mutation via `ref` |
| Repetition | Loops (`for`, `while`) with a mutable counter | Recursion, higher-order functions (`map`, `fold`) |
| Mental model | "What to do, in what order" | "What value, from which other values" |

Neither style is strictly superior: imperative style often fits more naturally with a resource that genuinely changes over time (an interface's state, a network connection), while functional style excels at pure data transformations; the rest of this topic details the concrete reasons for that advantage rather than taking it for granted.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | In OCaml, `if` and every block are expressions (they produce a value), `let` creates an immutable binding (not a reassignable variable), and recursion replaces the mutable-counter loop. |
| **Tools you can use** | `let ... in`, `if ... then ... else` as an expression, `let rec` for a recursive function. |
| **Pitfalls to avoid** | Confusing a new binding (`let x = x + 1`) with a reassignment: the previous `x` isn't modified, only shadowed in the scope that follows. |
| **Best practices** | Choose the style based on the nature of the problem: imperative for a state that genuinely changes over time, functional for a pure data transformation. |
