---
order: 1
---

# The Mathematical Function

This chapter lays out a concept reused in statistics, machine learning, and artificial intelligence: the function, in the mathematical sense, not to be confused with a [function in programming](/?c=shells&s=bash&p=fonctions), which borrows its name without always following its rule (see the pitfall below).

A **mathematical function** is a rule that maps each input to **always the same** output.

```text
f(x) = x * 2

f(3)  -> 6   (always 6, every time f is called with 3)
f(3)  -> 6   (called again with the same input: same result, no exception)
f(5)  -> 10
```

> **Analogy:** a well-calibrated vending machine: pressing button "A1" always dispenses the same drink. If one day the same button sometimes gave a juice, sometimes a coffee, it would no longer be a function in the mathematical sense: the result would no longer depend only on the input.

> **Pitfall:** a function in programming (see [Functions](/?c=shells&s=bash&p=fonctions) in [Bash](/?c=shells&s=bash&p=bash), or its equivalent in any other language) does **not** have this guarantee: a function that reads the current time, draws a [random](/?c=representation-des-donnees&p=aleatoire-et-generateurs) number, or reads a file can return a different result on every call, with the same input. This is called a **non-deterministic** function: a term that will come back up to explain why certain systems (including an [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) never answer exactly the same thing twice.
>
> **Best practice:** in programming, prefer a deterministic function (same input → always the same output) whenever possible: the same call then gives a predictable result, making it simpler to test and debug.

## A function can take several inputs

Nothing requires a function to have only a single input:

```text
f(x, y) = x + y

f(2, 3)   -> 5
f(10, 1)  -> 11
```

Each extra input is a new parameter of the function, exactly like a function in programming can take several arguments. This multi-input form is the most common in practice: a machine learning model almost always combines several inputs (age, salary, history...) to produce a single output.

> **Pitfall:** forgetting that a missing input has no defined output. `f(x, y) = x / y` has no result for `y = 0`: the function simply isn't defined there, it's not some special value like "zero" or "empty".
>
> **Best practice:** before coding a function, identify the inputs for which it has no sensible output (division by zero, square root of a negative number...), and explicitly decide what to do in those cases (error, default value) rather than letting the language react its own way.

## Representing a function as a curve

On a graph, each (input, output) pair becomes a point: connecting all these points draws the function's **curve**, here for `f(x) = x²`:

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x²
```

A curve that goes up means the output increases with the input; a curve that goes back down means the opposite: here, the curve goes down until `x = 0` then goes back up, exactly the kind of dip the chapter on [the derivative and the gradient](/?c=mathematiques&p=la-derivee-et-le-gradient) teaches you to spot, to explain how a computer "descends" a curve to find its lowest point.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A mathematical function maps each input to always the same output (`f(x)`), can take several inputs (`f(x, y)`), and is represented visually by a curve. |
| **Tools you can use** | No specific tool: the notation `f(x) = ...` is enough to describe a function on paper. |
| **Pitfalls to avoid** | Confusing a mathematical function (always deterministic) with a function in programming, which might not be (current time, randomness, file reading). Forgetting that an input might have no defined output (division by zero). |
| **Best practices** | Check that a programming function meant to be "pure" (same input → same output) doesn't depend on any changing external source. Explicitly decide what to do with inputs that have no defined output rather than letting the language react its own way. |
