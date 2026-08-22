---
order: 7
---

# TDD (Test-Driven Development)

So far, every test type has been presented as a check written **after** the code, to make sure it works. **TDD** (*Test-Driven Development*) reverses that order: the test is written **before** the code it checks, and it's that test which drives writing the code, not the other way around.

## The red / green / refactor cycle

TDD is organized as a short cycle, repeated for each small piece of behavior to add:

| Step | Color | What happens |
|---|---|---|
| **1. Write a failing test** | 🔴 Red | The test describes a behavior that doesn't exist yet; it necessarily fails, since the code doesn't exist |
| **2. Write the minimal code to pass it** | 🟢 Green | Just enough code for the test to pass, without anticipating future needs |
| **3. Improve the code without changing its behavior** | 🔵 Refactor | Clean up, clarify, remove duplication; the tests already written guarantee the behavior stays identical |

```text
TDD cycle for "calculateDiscount(price, percentage)":

1. Red      : write test_calculateDiscount_applies_10_percent()
              -> fails, the function doesn't exist yet

2. Green    : write calculateDiscount() with the strict minimum
              needed to pass THIS specific test
              -> the test passes

3. Refactor : clean up the code if needed (rename a variable,
              simplify a calculation), rerunning the test after
              each change to check it still passes
```

This cycle then repeats for the next behavior to add (for example, handling a zero percentage), each iteration staying deliberately short.

> **Pitfall:** at the green step, writing more code than strictly necessary to pass the current test (anticipating a case not yet tested). Code not covered by a test at this stage stays unverified, despite TDD's apparent rigor.
>
> **Best practice:** at the green step, write the simplest possible code that passes the test, generalizing it later only once a new test actually requires it.

## Why writing the test first changes something

Writing the test before the code forces answering a precise question before coding anything: what's the expected result, exactly, for this specific input? This clarification has a direct effect on the code's design: a function designed to be easily testable (clear inputs and outputs, few hidden dependencies) is also, generally, a function simpler to understand and reuse.

> **Pitfall:** believing TDD alone guarantees good-quality code, independent of design thinking. TDD structures the writing rhythm, but doesn't replace the usual [code quality criteria](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) (single responsibility, low coupling).
>
> **Best practice:** use TDD as one tool among others to arrive at testable, well-designed code, not as an automatic guarantee that excuses skipping architecture thinking.

## TDD isn't required to have tests

Writing tests after the code (the more common order, and the one implicitly followed in this section's previous chapters) remains perfectly valid: TDD is a **writing discipline**, not a condition for a test to have value. Some situations suit it better than others: a business rule well understood from the start suits TDD well; a still-fuzzy problem, where exploration precedes understanding the need, often suits writing a rough draft of code first, then tests once the behavior has stabilized, better.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | TDD writes the test before the code, following a short red (failing test) / green (minimal code to pass it) / refactor (cleanup with no behavior change) cycle. It structures design but doesn't replace the usual code quality criteria. |
| **Usable tools** | The red/green/refactor cycle as a writing rhythm. |
| **Pitfalls to avoid** | Writing more code than necessary at the green step. Believing TDD alone guarantees well-designed code. |
| **Best practices** | At the green step, write the simplest code that passes the test. Use TDD as one tool among others, not an automatic quality guarantee. |
