---
order: 8
---

# Code coverage

A test suite grows chapter after chapter, but one question has stayed unanswered so far: how do you know it covers the program enough? **Code coverage** attempts to answer that question with a numeric measure, with important limits worth knowing before trusting it.

## What coverage measures

Code coverage measures the proportion of source code actually **executed** at least once while the test suite runs, usually expressed as a percentage.

```text
function calculateDiscount(price, percentage) {
    if (percentage < 0) {
        return price;              // line A
    }
    return price * (1 - percentage / 100);  // line B
}

A single test with percentage=10:
  -> line B executed, line A never executed
  -> coverage of this function: 50% (1 line out of 2)
```

A coverage tool instruments the code while tests run, then produces a report showing which lines (or branches, functions) were executed or not.

## Several levels of granularity

| Coverage type | What it checks |
|---|---|
| **Line coverage** | Was each line of code executed at least once? |
| **Branch coverage** | Was each possible path of an `if`/`else` taken (both, not just one)? |
| **Function coverage** | Was each function called at least once? |

Branch coverage is stricter than line coverage: an `if` with no `else` can reach 100% line coverage while never exercising the case where the condition is false, while branch coverage would require it.

## The central pitfall: a high number guarantees nothing

A "covered" line only means it was **executed** during a test, not that its result was **checked**. A test that calls a function without ever comparing its result to an expected value bumps up coverage without catching a single bug.

```text
function calculateDiscount(price, percentage) {
    return price * (1 - percentage / 100);
}

test "calculateDiscount doesn't crash":
    calculateDiscount(100, 10);   // executes the line, but...
    // ...no check on the actual result!

-> 100% coverage of this function, even though a bug that
   inverted the calculation (e.g. price * (1 + percentage / 100))
   would never be caught
```

> **Pitfall:** aiming for a high coverage percentage as a goal in itself, writing tests that execute code without actually checking its behavior. 100% coverage doesn't mean 0% bugs.
>
> **Best practice:** treat coverage as an indicator of what is *definitely not* tested (a line at 0% has no test at all), never as proof that what is covered is correct.

## What coverage is actually good for

Despite this limit, coverage stays useful for a specific purpose: spotting areas of code **entirely devoid** of tests, especially after a change. A coverage report that suddenly drops on a recently modified file signals a real blind spot, to fill before considering the change done.

> **Best practice:** use coverage to spot obvious gaps (code never executed by any test), not to judge the quality of existing tests on code already covered.

## A threshold to choose with judgment

Some teams set a minimum coverage threshold (often between 70% and 90%) below which a contribution gets rejected. This threshold makes sense as a guardrail against completely untested new code, but aiming for 100% everywhere has a rising cost: the last few percent often cover low-risk code (trivial error handling, generated code) for marginal reliability gains.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Code coverage measures the proportion of code executed by tests (lines, branches, functions), not the quality of what's checked. A covered line isn't necessarily a correctly tested line: 100% coverage doesn't guarantee an absence of bugs. |
| **Usable tools** | A coverage tool instrumenting test execution, producing a per-line/branch/function report. A minimum threshold (70-90%) as a guardrail on new code. |
| **Pitfalls to avoid** | Aiming for a high coverage percentage as a goal in itself. Writing tests that execute code without checking its result. |
| **Best practices** | Use coverage to spot entirely untested code, not to judge the quality of what's already covered. Don't aim for 100% everywhere: the marginal gain of the last few percent is often small. |
