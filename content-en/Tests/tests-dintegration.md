---
order: 5
---

# Integration tests

The chapter on [unit tests](/?c=tests&p=tests-unitaires) isolates a function from everything around it. But a program that works correctly function by function can still fail once those functions are assembled: that's exactly what integration tests cover, the middle level of the [test pyramid](/?c=tests&p=pyramide-de-test).

## What an integration test checks in addition

An integration test checks that several components **work correctly together**, generally involving at least one real dependency (a real database, a real network call to a service, a real filesystem) rather than a test double.

```text
Unit test:
  the registerUser() function correctly calls
  database.insert() with the right arguments
  -> database is a test double (mock), nothing is actually written

Integration test:
  registerUser() actually writes a row to a real test
  database, which is then read back to check it matches
  the expected data
  -> checks that the code and the database really agree
```

A unit test can pass while an integration test fails on the same code: for example if the function correctly calls the database, but with a syntactically invalid SQL query that the mock never detects.

## Where to draw the line: which components to include

There's no strict, universal definition of what counts as "integration": the boundary depends on what's chosen to actually be tested rather than simulated.

| Components involved | Test type |
|---|---|
| A single function, everything else simulated | Unit |
| The function + a real test database | Integration (database) |
| The function + a real call to an external API | Integration (external service) |
| The whole application, from a user click to the final response | End-to-end (next chapter) |

> **Pitfall:** calling a test "integration" when it actually simulates every dependency with very detailed mocks. With no real dependency involved, that test is still a unit test in disguise, with an integration test's slowness but none of its real benefit.
>
> **Best practice:** an integration test must involve at least one real external dependency (database, service, filesystem); otherwise it's a unit test, even if it looks like one.

## A test database, never production

Integration tests that involve a database need their own instance, separate from production, usually recreated before every run to start from a known state (see the [fixtures](/?c=tests&p=architecture-de-test) already covered in the test architecture chapter).

```text
Before each test:
  1. Recreate the test database (empty or with known starting data)
  2. Run the test (which writes/reads to that database)
  3. Check the result

-> No data from one test should survive to pollute the next
```

> **Pitfall:** running integration tests against the production database, for simplicity or lack of time to set up a dedicated one. A test that actually writes data can then corrupt or pollute real data.
>
> **Best practice:** always use a test database (or service) entirely separate from production, even if setting it up takes an initial effort.

## A slower level, to use with judgment

An integration test costs more than a unit test: starting a real database, waiting for a real network response, takes time. That cost is exactly why the test pyramid calls for fewer of them than unit tests: reserved for the junction points between components, where a unit test alone can't provide confidence.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | An integration test checks that several components work correctly together, involving at least one real external dependency (database, service, file), unlike a unit test which simulates everything. It uses a separate test database, never production. |
| **Usable tools** | A test database recreated before every run. A table of involved components to tell a unit test apart from an integration test. |
| **Pitfalls to avoid** | Calling a test "integration" when it actually simulates every dependency. Running tests against the production database. |
| **Best practices** | Involve at least one real external dependency in an integration test. Use a test database entirely separate from production. |
