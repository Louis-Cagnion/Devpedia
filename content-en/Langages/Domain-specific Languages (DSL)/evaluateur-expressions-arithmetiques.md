---
order: 4
---

# Arithmetic Expression Evaluator: Handling Operator Precedence

Evaluating a string like `"2 + 3 * 4"` takes more than a simple left-to-right scan: multiplication has to happen before addition (result `14`, not `20`), and parentheses can force a different order. Writing this small interpreter is a classic exercise, often the first building block before a larger interpreter (see [Incremental Parsing with a State Machine](/?c=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) for a different family of format to interpret).

## The problem: reading left to right isn't enough

```text
"2 + 3 * 4"

Naive left->right reading:  (2 + 3) * 4 = 20   -> wrong
With operator precedence:   2 + (3 * 4) = 14   -> correct
```

A correct evaluation must know the **precedence** of each operator (`*`/`/` before `+`/`-`) before it even starts computing anything.

## Two steps: tokenize, then evaluate

The raw string is never evaluated character by character: it's first split into a list of **tokens** (numbers and operators), the same way any interpreter works (see the tokenization of an [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), the same principle applied to natural text rather than to an expression).

```python
import re

def tokenize(expression):
    return re.findall(r"\d+\.?\d*|[()+\-*/]", expression)

tokenize("2 + 3 * 4")       # ['2', '+', '3', '*', '4']
tokenize("(2 + 3) * 4")     # ['(', '2', '+', '3', ')', '*', '4']
```

## Respecting precedence: one function per level

The most direct technique encodes each precedence level into its own function, each one calling the level immediately above before handling its own operator, one function calling into the parentheses and then calling itself again to handle a nested expression:

```text
expression := term (('+' | '-') term)*
term        := factor (('*' | '/') factor)*
factor      := NUMBER | '(' expression ')'
```

```python
class Evaluator:
    def __init__(self, tokens):
        self.tokens = tokens
        self.position = 0

    def current_token(self):
        return self.tokens[self.position] if self.position < len(self.tokens) else None

    def expression(self):
        result = self.term()
        while self.current_token() in ("+", "-"):
            operator = self.tokens[self.position]
            self.position += 1
            right = self.term()
            result = result + right if operator == "+" else result - right
        return result

    def term(self):
        result = self.factor()
        while self.current_token() in ("*", "/"):
            operator = self.tokens[self.position]
            self.position += 1
            right = self.factor()
            result = result * right if operator == "*" else result / right
        return result

    def factor(self):
        token = self.current_token()
        if token == "(":
            self.position += 1          # consume '('
            result = self.expression()
            self.position += 1          # consume ')'
            return result
        self.position += 1
        return float(token)

Evaluator(tokenize("2 + 3 * 4")).expression()        # 14.0
Evaluator(tokenize("(2 + 3) * 4")).expression()      # 20.0
```

`expression()` handles the lowest-precedence level (`+`/`-`) but delegates each operand to `term()`, which first exhausts everything higher-precedence (`*`/`/`) before returning control: it's this call order, not an explicit priority comparison, that guarantees multiplication is computed before addition. A parenthesis encountered in `factor()` restarts `expression()` from the lowest level, which naturally handles any depth of nesting.

> **Pitfall:** letting `self.position` evolve independently in several functions with none of them acting as the single source of truth for "where we are" in the token list. A single shared state variable (here `self.position`, an instance attribute) must advance consistently, regardless of which function consumes the current token: two positions drifting apart produce a reading offset that's hard to diagnose.
>
> **Best practice:** advance `self.position` at the exact moment a token is consumed, never before or after, and never read it twice for the same decision.

## Another approach: conversion to reverse Polish notation

A widespread alternative, the *shunting-yard* algorithm (Dijkstra), first converts the expression into postfix notation (`2 3 4 * +`) using an operator stack, before evaluating it with a second stack of operands. The final result is identical; the choice between the two techniques is mostly a matter of implementation preference (recursion versus explicit stacks) rather than a difference in capability.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An expression is first tokenized (numbers/operators split apart), then evaluated by one function per precedence level, each delegating to the next before handling its own operator. A parenthesis restarts evaluation from the lowest level. |
| **Available Tools** | A regular expression for tokenization; one function per precedence level (recursive descent) or the shunting-yard algorithm (explicit stacks) for the evaluation itself. |
| **Pitfalls to Avoid** | Evaluating left to right without accounting for operator precedence. Advancing the position in the tokens from several places with no single source of truth. |
| **Best Practices** | Carry precedence through the call order between functions (`expression` -> `term` -> `factor`), not through an explicit comparison of numeric priorities. |
