---
order: 2
---

# The test pyramid

A program can be tested at several levels: a single isolated function, several components working together, or the whole application from the user's screen. These three levels don't share the same cost or execution speed, which raises a real organizational question: how many tests should be written at each level? The **test pyramid** is the model that answers this question.

## Three levels, three trade-offs

| Level | What it checks | Speed | Maintenance cost |
|---|---|---|---|
| **Unit test** | A single function or class, isolated from the rest of the program | Very fast (milliseconds) | Low: little code to adjust if the test breaks |
| **Integration test** | Several components interacting (e.g. the code and a database) | Medium (depends on the real components involved) | Medium: depends on external components that can themselves change |
| **End-to-end test** (*E2E*) | The whole application, from the user's point of view (e.g. a browser actually clicking buttons) | Slow (seconds to minutes) | High: broken by the slightest interface change, often flaky |

A unit test isolates the tested function from the rest of the program using **mocks** or **stubs** (fake stand-ins for external dependencies, detailed in the test architecture chapter): that's what makes it fast and reliable, but it doesn't guarantee that the program's different parts work correctly once assembled together.

## The pyramid shape: a lot of fast, little of slow

```text
        /\
       /E2E\          <- few (slow, expensive to maintain)
      /------\
     /Integra-\       <- moderate amount
    / tion     \
   /------------\
  /   Unit       \    <- many (fast, cheap)
 /----------------\
```

This distribution isn't arbitrary: it follows directly from the table above. Since unit tests are fast and cheap, you can afford to write a lot of them, letting you check a large number of precise cases. Since E2E tests are slow and fragile, you keep few of them, reserved for genuinely critical paths (e.g. "a customer can place an order end to end") rather than every detail.

> **Pitfall:** the inverted "ice cream cone" anti-pattern, a flipped pyramid where most tests are slow E2E tests and few unit tests exist. Result: a test suite that takes hours to run, often fails for reasons unrelated to a real bug (a network delay, a UI element that moved), and that the team ends up ignoring or disabling.
>
> **Best practice:** before adding an E2E test, ask whether a faster, more stable unit or integration test wouldn't already cover the same risk.

## What the pyramid doesn't say

The pyramid gives a proportion to aim for, not an absolute number or a mandatory writing order. It also doesn't mean one level replaces another: a unit test checking that a function correctly computes a total, and an E2E test checking that this total actually displays on screen after a real click, don't test the same thing and are complementary. The following chapters detail each level, plus the concrete organization of a test suite.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Three test levels (unit, integration, end-to-end) have very different costs and speeds. The test pyramid recommends many fast unit tests, fewer integration tests, and few slow E2E tests reserved for critical paths. |
| **Usable tools** | No concrete tool at this stage: later chapters will cover the tools specific to each level. |
| **Pitfalls to avoid** | The inverted "ice cream cone": mostly slow, fragile E2E tests and few unit tests. |
| **Best practices** | Before adding an E2E test, check whether a faster level doesn't already cover the same risk. |
