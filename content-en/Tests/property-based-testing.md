---
order: 10
---

# Property-based testing

Every test type covered so far ([unit](/?c=tests&p=tests-unitaires), [integration](/?c=tests&p=tests-dintegration), [E2E](/?c=tests&p=tests-end-to-end)) shares the same principle: pick specific example inputs, and check the expected result for each. **Property-based testing** flips this logic: instead of picking inputs yourself, you describe a **property** that must stay true for any valid input, and a tool automatically generates hundreds of inputs trying to disprove it.

## A classic test, example by example

A classic unit test checks a finite number of hand-picked cases:

```text
test "add(2, 3) == 5"
test "add(-1, 1) == 0"
test "add(0, 0) == 0"
```

These three tests pass, but say nothing about what happens for `add(1000000, -999999)`, or any other combination not explicitly tested: a bug hidden in a case the test's author never picked stays invisible.

## A property: what must always hold true

A **property** describes a general rule, valid for any input meeting certain constraints, rather than a precise result for a precise input:

```text
Property: "add is commutative"
  For all a and b: add(a, b) == add(b, a)

Property: "sorting a list doesn't change its size"
  For any list L: size(sort(L)) == size(L)

Property: "sorting twice gives the same result as sorting once"
  For any list L: sort(sort(L)) == sort(L)
```

A property-based testing tool (for example [fast-check](https://fast-check.dev) in [JavaScript](/?c=langages&s=javascript&p=javascript), [Hypothesis](https://hypothesis.readthedocs.io) in [Python](/?c=langages&s=python&p=python), or [QuickCheck](https://hackage.haskell.org/package/QuickCheck), the field's original tool in Haskell) then automatically generates hundreds of random inputs meeting the given constraints, and checks the property on each.

```text
Property-based test for "sorting doesn't change the size":

  repeat 200 times:
    generate a random list L (varying size and content)
    check that size(sort(L)) == size(L)

  -> if a single generated case breaks the property, the test
     fails and reports the exact list that caused the problem
```

## Finding a minimal counter-example (shrinking)

When a property-based testing tool finds an input that breaks the property, it doesn't stop there: it tries to **shrink** it toward the smallest possible counter-example that still reproduces the bug, to make diagnosis easier.

```text
Initially found counter-example:
  L = [47, -12, 999, 3, -5, 0, 812, ...] (50-element list)

After shrinking:
  L = [1, 0] (2 elements, bug still reproduced)

-> much easier to understand and fix than the initial list
```

## When to choose this approach

Property-based testing doesn't replace classic tests, it complements them, especially on code where a **general rule** is easier to state than a list of precise cases: mathematical functions, sorting or encoding/decoding algorithms, parsers, data structures.

> **Pitfall:** trying to write a property for a behavior that doesn't actually follow a simple general rule (business logic with many arbitrary special cases). Forcing a property where it doesn't fit produces a rule so complicated it becomes error-prone itself.
>
> **Best practice:** reserve property-based testing for behaviors that genuinely obey a simple rule to state; keep classic tests for, say, business logic rich in special cases.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Property-based testing describes a property valid for any input, rather than checking hand-picked examples; a tool automatically generates hundreds of inputs trying to disprove it, and shrinks any counter-example found toward the simplest possible case. |
| **Usable tools** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, the field's original tool). |
| **Pitfalls to avoid** | Forcing a property onto a behavior with no simple general rule. |
| **Best practices** | Reserve property-based testing for behaviors with a clear general rule (mathematical functions, sorting, parsers); keep classic tests for business logic rich in special cases. |
