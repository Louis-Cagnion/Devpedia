---
order: 3
---

# Test suite architecture

Writing a single isolated test is simple; keeping hundreds of them readable, reliable, and easy to evolve is much harder. This chapter covers how to organize a **test suite** (a project's whole set of tests) so it stays maintainable over time, regardless of which pyramid level it belongs to.

## Where to put tests: mirroring the source code

The most common convention is to make the test folder structure mirror the source code's, one test file per code file, in a separate folder (often called `tests/` or `__tests__/`):

```text
source/
  users/
    authentication.js
    profile.js
tests/
  users/
    authentication.test.js
    profile.test.js
```

This organization lets you immediately find a given file's tests, and makes untested code visible at a glance (a source file with no matching test file).

## Fixtures: preparing a shared starting state

A **fixture** is a pre-prepared state (data, configuration, a connection) that several tests reuse, to avoid recreating that context every time.

```text
Without a fixture (repeated in every test):
  test "can edit their profile":
    create a user "alice@example.com"
    log this user in
    edit their profile
    check the change

With a fixture (prepared once, reused):
  fixture "logged_in_user":
    create a user "alice@example.com"
    log this user in

  test "can edit their profile" (uses fixture "logged_in_user"):
    edit their profile
    check the change
```

> **Pitfall:** fixtures that leak between tests, for example a test database that keeps data left over from a previous test. A test that depends on the order the others ran in becomes unpredictable.
>
> **Best practice:** each test should start from a clean, predictable state, usually by recreating the fixture before every test rather than reusing it as-is between them.

## Test doubles: mocks, stubs, and fakes

A **test double** is a fake stand-in for a real dependency (a database, an external API, the system clock), used to isolate what's actually being tested. The term covers several variants, often confused with each other:

| Term | Role |
|---|---|
| **Stub** | Returns a fixed, predefined response, with no logic ("when called, always return this result") |
| **Mock** | Like a stub, but also checks *how* it was used (was it called, with what arguments, how many times) |
| **Fake** | A simplified but functional implementation (e.g. an in-memory database instead of a real one) |

```text
Stub: "getUser(id) always returns {name: 'Alice'}"
Mock: "getUser was indeed called once, with id=42"
Fake: a real small in-memory database, behaving like the real
      one but with no file or server to install
```

> **Pitfall:** overusing mocks to the point where a test only checks "the code called the right functions", never a real business outcome.
>
> **Best practice:** reserve test doubles for dependencies that are genuinely costly or unreliable to use as-is in a test (network, time, randomness); keep the tested program's real logic, never simulate that itself.

## Test environments

A project usually runs its tests in an **environment** separate from production: a test database, fake credentials, sometimes external services themselves simulated. Separating these environments prevents a failed or poorly written test from touching real data, and makes results reproducible regardless of production's ever-changing state.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A maintainable test suite mirrors the source code's folder structure, uses fixtures to prepare a clean, reproducible starting state, and test doubles (stub, mock, fake) to isolate costly or unreliable dependencies. |
| **Usable tools** | No concrete tool at this stage: the following chapters on each test level (unit, integration, E2E) will cover specific tools. |
| **Pitfalls to avoid** | Fixtures that leak between tests. Overusing mocks to the point of no longer testing real logic. |
| **Best practices** | Start from a clean state for every test. Reserve test doubles for genuinely costly dependencies (network, time, randomness). |
