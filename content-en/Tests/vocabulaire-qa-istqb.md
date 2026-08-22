---
order: 1
---

# Software testing vocabulary (QA, ISTQB)

Before writing a single test, you need a shared vocabulary: without it, "testing the code" can mean ten different things depending on who's talking. This chapter lays out the terms the rest of this section will reuse, based on the ones standardized by the **ISTQB** (*International Software Testing Qualifications Board*), the reference body that certifies testers and harmonizes this vocabulary across the industry. **QA** (*Quality Assurance*) more broadly refers to the whole set of activities aimed at guaranteeing a piece of software's quality, of which testing is only one part.

## The building blocks of a test

| Term | Definition |
|---|---|
| **Test case** | A precise situation to check: a given input, an action, and the expected result |
| **Test plan** | The document describing the overall test strategy: what to test, with what means, in what order |
| **Test data** | The concrete values used to run a test case (e.g. a valid email, a malformed one) |
| **Expected result** | What the program is supposed to produce if everything works correctly, defined before the test runs |
| **Actual result** | What the program actually produces when run, compared against the expected result to judge whether the test passes |

```text
Test case: "Login with a correct password"
  Test data: email="alice@example.com", password="goodPassword123"
  Action: submit the login form
  Expected result: redirect to the dashboard
  Actual result: (observed at run time, compared to the expected one)
```

> **Pitfall:** writing a test case with no precise expected result ("check that it works"). Without a clear reference, there's no objective way to say whether the test passed or failed.
>
> **Best practice:** always state the expected result before running the test, never after looking at what the program produced.

## Passing or failing, and what follows

A test case **passes** when the actual result matches the expected result, and **fails** otherwise. A failure doesn't automatically mean "bug in the program": the test itself can be poorly written (wrong expected result, invalid test data).

| Term | Definition |
|---|---|
| **Defect / bug** | A confirmed gap between the program's behavior and its intended behavior, usually tracked in an issue tracker (a ticket) |
| **Regression** | A code change breaking a behavior that used to work; a **regression test** is a test rerun after every change to catch this |
| **Exit criteria** | The condition defining when a testing phase is considered done (e.g. "100% of critical test cases pass", "code coverage ≥ 80%") |

> **Pitfall:** assuming a failing test always means a bug to fix in the program. The test itself can be at fault (a wrong expected result, poorly chosen test data).
>
> **Best practice:** before fixing the program, verify the test is failing for the right reason by re-reading its expected result and test data.

## Who writes and runs the tests

| Term | Definition |
|---|---|
| **Manual test** | A human runs the test case's steps by hand and compares the result themselves |
| **Automated test** | A program runs the test case and automatically compares the actual result to the expected one |
| **Tester** | The person (or team) responsible for designing and running tests, distinct from developers on projects that have this dedicated role |

On many current teams, developers themselves write a good share of the automated tests (unit tests in particular, covered in an upcoming chapter); the dedicated tester role then focuses on tests that need an outside perspective or a whole-product view.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | ISTQB standardizes software testing vocabulary; QA more broadly refers to the whole set of quality assurance activities. A test case compares an actual result to an expected result defined in advance. A failing test isn't necessarily a bug in the program. |
| **Usable tools** | No practical tool at this stage: this chapter lays out the vocabulary, later chapters will cover the test pyramid and test architecture. |
| **Pitfalls to avoid** | Writing a test case with no precise expected result. Fixing the program before checking that the test itself is correct. |
| **Best practices** | State the expected result before running the test. Check the test before fixing the program when it fails. |
