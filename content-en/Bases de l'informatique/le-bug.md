---
order: 6
---

# The bug

The [first chapter](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) made it clear: a computer executes instructions to the letter, without ever guessing at the programmer’s intent. A **bug** is the direct consequence of this rule: a flaw in the code that prevents it from producing the expected result, not because the computer “makes a mistake,” but because the instructions themselves were imprecise, incomplete, or incorrect.

> **Analogy:** a recipe that says “pour in milk” without specifying the amount. Anyone following it to the letter must choose an amount, not necessarily the one the author had in mind.

## A concrete example

```text
balance = 100
retirer = 150
balance = balance - retirer  → balance becomes -50: nothing checked whether there was enough money
display balance              → displays -50
```

The code runs without crashing and does exactly what it's written to do; that's precisely the problem: no one wrote the instruction "reject the withdrawal if the balance is insufficient."

> **Best practice:** Validate critical conditions before taking action (in this case: `retirer <= balance`), rather than executing the operation and discovering the problem in the final result.

## Three types of bugs

| Bug Type | What Happens | Example |
|---|---|---|
| Syntax error | The code does not follow the language's grammar: it cannot even be executed | A parenthesis that is never closed |
| Runtime error (*crash*) | The code is valid, but encounters a situation it cannot handle and abruptly terminates | Dividing a number by zero |
| Logical error | The code runs without crashing, but produces an incorrect result | The example of the negative balance above |

Logical errors are the hardest of the three to detect: there is no warning that a problem has occurred, since the program terminates normally; only the result is incorrect.

> **Pitfall:** believing that a program that runs without crashing is necessarily correct. The absence of a crash says nothing about a logical error: only a comparison of the actual result with the expected result can reveal it.
>
> **Best practice:** For any task where the correct result is known in advance (even approximately), systematically compare it to the result obtained, rather than relying solely on the fact that “it works.”

## Reading an error message

When a crash occurs, most languages display a message indicating where and why the program failed:

```text
Error: division by zero
  at line 4, in the function "calculate_average"
```

Learning how to interpret this type of message (which line, what caused it) saves a considerable amount of time.

> **Pitfall:** stopping at the indicated line and assuming that’s where the error must be. The crash occurs where the problem becomes visible (e.g., a missing value is used), not necessarily where it originated (e.g., the missing value may have been defined much earlier in the code).
>
> **Best practice:** Use the indicated line as a starting point for your investigation, not as a final conclusion; go back if the cause isn't immediately apparent there.

## How to detect them

An [IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) helps with all three areas in its own way: detecting syntax errors before the code is even executed, displaying a message when a crash occurs, and providing a debugger to monitor the state of variables step by step, particularly useful for logical errors that would otherwise go unnoticed.

> **Pitfall:** assuming that the absence of warnings from the IDE (“no red underlines”) guarantees the absence of bugs. An IDE’s error detection covers only syntax (and sometimes a few obvious runtime errors), never logical errors, which are only visible in the resulting output.
>
> **Best practice:** Never confuse “the IDE doesn’t flag anything” with “the program is correct”: only tests against an expected result can catch logical errors.

---

## 📋 Summary

| | |
|---|---|
| **Key Point** | A bug always stems from an imprecise or incomplete instruction, never from a "misunderstanding" on the part of the computer. Three types: syntax error (does not execute), runtime error (crashes during execution), logical error (executes but returns an incorrect result). |
| **Available tools** | An IDE's error detection and debugger; the error message displayed during a crash. |
| **Pitfalls to Avoid** | Ignoring an error message without reading it in its entirety: the line number and cause listed are almost always the quickest starting point, even if they aren't always sufficient on their own. |
| **Best Practices** | When encountering a logical error (no error message, just an incorrect result), check step by step what each statement actually does, rather than assuming it does what you intended. |
