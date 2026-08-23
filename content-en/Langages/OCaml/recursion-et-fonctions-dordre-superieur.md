---
order: 4
---

# Recursion and Higher-Order Functions

## Recursion replaces the loop

With no mutable variable by default, repeating a process means writing a function that calls itself, each call reducing the problem by one step:

```ocaml
let rec factorial n =
  if n = 0 then 1
  else n * factorial (n - 1)

factorial 5   (* 120 *)
```

## Tail recursion: avoiding stack growth

`factorial` above is **not tail-recursive**: on every call, the multiplication `n * ...` waits for the recursive call's result before it can run. Every pending call therefore stays on the **call stack** (see the [Memory Layout](/?c=representation-des-donnees&p=organisation-en-memoire) chapter for the stack/heap distinction), until the base case is reached and then every multiplication unwinds in a cascade on the way back up.

A **tail-recursive** version carries the intermediate result in an extra argument (an **accumulator**), so that the recursive call is the very last thing done in the function; nothing is left waiting after it:

```ocaml
let tail_factorial n =
  let rec aux n acc =
    if n = 0 then acc
    else aux (n - 1) (n * acc)     (* last call: nothing is left pending after it *)
  in
  aux n 1
```

The OCaml compiler recognizes this shape and optimizes it into a plain loop in the generated machine code: the stack does **not** grow from one call to the next, no matter how deep the recursion. This is what makes recursion practical even on lists of several million elements, where a non-tail-recursive version would eventually exhaust the stack (*stack overflow*).

## Higher-order functions: `map`, `filter`, `fold`

A higher-order function takes a function as an argument, or returns one, the same principle as a [Python](/?c=langages-de-programmation&s=python&p=python) decorator (see the [Decorators](/?c=langages-de-programmation&s=python&p=decorateurs) chapter), generalized across the entire standard list library rather than reserved for one specific use case.

```ocaml
let squares = List.map (fun x -> x * x) [1; 2; 3; 4]           (* [1; 4; 9; 16] *)
let evens = List.filter (fun x -> x mod 2 = 0) [1; 2; 3; 4]     (* [2; 4] *)
let sum = List.fold_left (+) 0 [1; 2; 3; 4]                     (* 10 *)
```

These three functions alone cover nearly every `for` loop (see the [Loops](/?c=langages-de-programmation&s=c&p=boucles) chapter, C section) you'd write to transform a collection (`map`), keep part of it (`filter`), or aggregate it into a single value (`fold`):

```c
// Imperative equivalent of the sum, in C
int total = 0;
for (int i = 0; i < size; i++) {
    total += array[i];
}
```

The `fold_left` version never explicitly mentions a counter or an intermediate variable: the "how to iterate" is entirely delegated to `List.fold_left`, and the code only expresses the "what to do with each element" (`(+)`) and the starting state (`0`).

> **Note:** `fold_left` accumulates from left to right (`(((0 + 1) + 2) + 3) + 4`); for a non-associative or order-sensitive operation, `List.fold_right` accumulates from right to left, with a slightly different call signature (the accumulator is the last argument, not the second).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Recursion replaces the mutable-counter loop. Tail recursion (the recursive call is the last action) is optimized by the compiler into a loop, with no stack growth. `map`/`filter`/`fold` cover most transformation/filtering/aggregation loops. |
| **Tools you can use** | `let rec`, an accumulator to make a recursion tail-recursive, `List.map`/`List.filter`/`List.fold_left`. |
| **Pitfalls to avoid** | Writing non-tail recursion over a very large list: risk of stack overflow. |
| **Best practices** | Turn a recursion into tail-recursive form (with an accumulator) as soon as it needs to handle potentially large collections. |
