---
order: 11
---

# Mutation testing

The chapter on [code coverage](/?c=tests&p=couverture-de-code) established a central pitfall: a line executed by a test isn't necessarily a line actually checked. **Mutation testing** answers this problem directly, by measuring not whether the code was executed, but whether the tests are able to detect a bug when there is one.

## The principle: introducing bugs on purpose

A mutation testing tool automatically modifies the source code, one tiny change at a time (a **mutant**), then reruns the test suite against this slightly broken version:

```text
Original code:
  if (age >= 18) { return "adult"; }

Automatically generated mutants:
  if (age > 18)   { return "adult"; }   // >= becomes >
  if (age <= 18)  { return "adult"; }   // >= becomes <=
  if (age >= 18)  { return "minor"; }   // return value flipped
  if (true)       { return "adult"; }   // condition removed
```

Each mutant represents a plausible bug, introduced automatically. The question asked of the test suite for each one: does it make it fail?

## Killed mutant or surviving mutant

| Result | Meaning |
|---|---|
| **Killed mutant** | At least one test failed against this mutant: the test suite would have caught this bug if it had actually existed |
| **Surviving mutant** | Every test passes despite the change: the test suite wouldn't catch this bug if it actually existed |

The **mutation score** is the proportion of killed mutants out of the total generated: a high score indicates tests genuinely able to detect bugs, not just execute code.

```text
10 mutants generated, 8 killed, 2 survived
-> mutation score: 80%

The 2 surviving mutants point to precise spots in the code
where the existing tests wouldn't catch a real bug
```

## What this reveals that coverage doesn't

This is precisely code coverage's blind spot: a test that executes a line without checking its result gets 100% coverage on that line, but lets every mutant modifying it survive, revealing that the line isn't actually checked.

```text
function calculateDiscount(price, percentage) {
    return price * (1 - percentage / 100);
}

test "calculateDiscount doesn't crash":
    calculateDiscount(100, 10);   // 100% coverage...
    // ...but no check on the result

Mutant: price * (1 + percentage / 100)  (sign flipped)
-> the test doesn't catch it -> surviving mutant
-> reveals what coverage alone didn't show
```

## A real computational cost, to reserve for critical code

Generating and testing each mutant multiplies the test suite's run time by the number of mutants created, making mutation testing noticeably slower than plain coverage.

> **Pitfall:** running mutation testing on an entire large project on every test suite run, to the point of making it too slow for daily use.
>
> **Best practice:** reserve mutation testing for the most critical code (sensitive business logic, financial calculations) or run it occasionally (before a release, as a background job), rather than on the whole project every run.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Mutation testing automatically modifies the code (one mutant at a time) and checks whether the test suite catches each change. A killed mutant means the tests would have caught that bug; a surviving mutant reveals a blind spot that code coverage alone doesn't show. |
| **Usable tools** | A mutation testing tool to generate mutants and compute the mutation score. |
| **Pitfalls to avoid** | Running mutation testing on the whole project every run, at the cost of the test suite's speed. |
| **Best practices** | Reserve mutation testing for the most critical code, or run it occasionally rather than on every test suite run. |
