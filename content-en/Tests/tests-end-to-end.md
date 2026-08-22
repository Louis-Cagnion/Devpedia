---
order: 6
---

# End-to-end tests

[Integration tests](/?c=tests&p=tests-dintegration) check that several components agree with each other, but generally stay internal to the program (no graphical interface, no real browser). The top of the [test pyramid](/?c=tests&p=pyramide-de-test), **end-to-end** (E2E) tests, go further: simulating a complete user journey, exactly as a real person would carry it out.

## Simulating the user, not the code

An E2E test knows nothing about the program's internal implementation: it drives the application the way a human would, clicking buttons, filling in fields, reading what appears on screen.

```text
E2E test: "a customer can place an order end to end"

  1. Open the site's home page
  2. Click on a product
  3. Click "Add to cart"
  4. Go to the checkout page
  5. Fill in the shipping form
  6. Confirm the order
  7. Check that the confirmation page displays correctly
```

This test could have failed because of a bug in any one of these seven steps: that's exactly what makes it valuable, it checks that the journey actually works as a whole, not just each piece taken separately.

## The cost of this broad coverage

An E2E test runs the whole application (often in a real, automated browser), which makes it noticeably slower than a unit or integration test, and more fragile: a harmless visual change (a button moved, some text reworded) can break the test with no real bug involved.

> **Pitfall:** identifying page elements by their displayed text or visual position ("the third button", "the link that says Continue"). A simple text or layout change, even with no bug, then breaks the test.
>
> **Best practice:** identify elements by a dedicated, stable attribute (an `id`, a `data-testid` attribute), independent from the displayed text or layout, so that only a real behavior change makes the test fail.

## Reserving E2E for genuinely critical journeys

This cost (slowness, relative fragility) directly justifies the test pyramid's shape: one E2E test per journey that's genuinely critical for the user (creating an account, paying, sending a message), not an E2E test for every detail a faster, more stable unit test would already cover.

```text
Good candidate for an E2E test:
  "a customer can place an order" (critical business journey,
  involves several pages and several components)

Bad candidate for an E2E test:
  "the email field rejects a malformed address" (already covered,
  faster and more reliably, by a unit test on the validation
  function)
```

> **Pitfall:** trying to cover every possible combination with E2E tests, for lack of sufficient unit tests on the same cases. The suite then becomes slow enough to slow down the whole team, with no proportional gain in reliability.
>
> **Best practice:** only keep in E2E the journeys whose failure would have a real business impact, and delegate checking details (a field's validation, an isolated calculation) to lower levels of the pyramid.

## Flaky tests: an even sharper problem here

The **flaky** test problem (already covered in the unit tests chapter) hits E2E particularly hard: a variable network delay, an animation not yet finished when the test tries to click, a slightly different loading order from one run to the next, can all fail a test with no connection to a real bug.

> **Best practice:** explicitly wait for an element to be present and interactive before acting on it (rather than a fixed pause of a few seconds, which stays either too short or needlessly long), and treat any repeated E2E failure as a signal to investigate, never as normal background noise.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | An end-to-end test simulates a complete user journey in the real application, with no knowledge of its internal implementation. Slower and more fragile than a unit or integration test, it's reserved for journeys genuinely critical to the user. |
| **Usable tools** | Dedicated, stable attributes (`data-testid`) to identify page elements. An explicit wait on an element's presence/interactivity rather than a fixed pause. |
| **Pitfalls to avoid** | Identifying elements by their text or visual position. Covering in E2E cases already covered by faster unit tests. |
| **Best practices** | Identify elements by a stable, dedicated attribute. Reserve E2E for journeys whose failure would have a real business impact. Treat a repeated E2E failure as a signal to investigate. |
