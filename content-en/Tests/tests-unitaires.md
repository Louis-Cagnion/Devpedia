---
order: 4
---

# Unit tests

The [test pyramid](/?c=tests&p=pyramide-de-test) puts unit tests at its base: the most numerous, the fastest, the cheapest to maintain. This chapter details concretely what this level checks, and how to write a unit test that stays useful over time.

## One unit, one responsibility

A unit test checks a **unit** of code isolated from the rest of the program, most often a single function or method. "Isolated" means no real external dependency (database, network, filesystem) is involved: these dependencies are replaced with [test doubles](/?c=tests&p=architecture-de-test) when the function needs them.

```text
Function under test: calculateDiscount(price, percentage)

Unit test:
  input: price=100, percentage=10
  expected result: 90
  -> no database, no network, no file involved
```

## The Arrange / Act / Assert pattern

The vast majority of unit tests follow the same three-part structure, regardless of language or testing tool:

| Step | Role |
|---|---|
| **Arrange** | Set up the data and state the test needs |
| **Act** | Call the function or method under test |
| **Assert** | Compare the actual result to the expected one |

```text
test "calculateDiscount correctly applies a percentage":
  // Arrange
  price = 100
  percentage = 10

  // Act
  result = calculateDiscount(price, percentage)

  // Assert
  check that result == 90
```

This structure makes a test readable at a glance, even for someone who didn't write it: where the starting data is, which action is being tested, what result is expected.

> **Pitfall:** mixing several "Act" steps into a single test (calling several different functions before checking anything). If the test fails, there's no way to tell which action is at fault without debugging.
>
> **Best practice:** a unit test checks one specific behavior; if several behaviors of the same function need testing, write several separate tests rather than one test that does everything.

## A test name that documents the behavior

A unit test's name serves as living documentation: it should describe the expected behavior, not just the function being called.

```text
Not very useful name:  test_calculateDiscount()

Useful name:            test_calculateDiscount_correctly_applies_a_percentage()
                         test_calculateDiscount_returns_zero_for_a_100_percent_discount
                         test_calculateDiscount_throws_for_a_negative_percentage
```

A run report listing failed tests then becomes readable directly from its name, without opening the test's code to understand what broke.

## Covering edge cases, not just the nominal case

A unit test that only checks the normal case (the *happy path*) misses edge behaviors: a zero value, an empty list, a negative value where only a positive one was expected.

```text
Function under test: calculateDiscount(price, percentage)

Cases to cover:
  - nominal case    : percentage=10  -> discount applied normally
  - lower bound      : percentage=0   -> no discount, price unchanged
  - upper bound       : percentage=100 -> result is zero
  - invalid case      : percentage=-5  -> expected behavior to define
                                           (error? default value?)
```

> **Pitfall:** settling for a single test on the nominal case and considering the function "tested". Most real bugs hide in edge cases, never exercised by a single happy-path test.
>
> **Best practice:** for each function under test, explicitly list its edge cases (zero, empty, negative, maximum values) before writing the tests, rather than discovering them after the fact in production.

## A test that fails for exactly one reason

A well-designed unit test fails for exactly one possible cause: the behavior it checks is no longer correct. A test that depends on other tests' execution order, on shared global state, or on the system clock, can fail with no connection to a real bug: that's a **flaky** test, which erodes the team's trust in the whole test suite.

> **Pitfall:** a test that passes or fails inconsistently from one run to the next, with no code change. A team that hits this regularly ends up ignoring test failures by reflex, which defeats the whole point of having tests.
>
> **Best practice:** treat a flaky test as a bug to fix as a priority, not an annoyance to work around (rerunning the test until it passes, for example), since a test no longer trusted serves no purpose.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A unit test checks a single isolated code unit, usually following the Arrange/Act/Assert structure. Its name documents the expected behavior. It should cover edge cases, not just the nominal case, and fail for exactly one possible cause. |
| **Usable tools** | The Arrange/Act/Assert structure to organize a test. An explicit list of edge cases (zero, empty, negative, maximum) before writing the tests. |
| **Pitfalls to avoid** | Mixing several actions into a single test. Only covering the nominal case. Leaving a flaky test unfixed. |
| **Best practices** | One test = one behavior checked. Name a test after the behavior it checks. List edge cases before writing the tests. Fix a flaky test as a priority rather than working around it. |
