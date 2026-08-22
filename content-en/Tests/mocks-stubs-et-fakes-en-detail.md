---
order: 9
---

# Mocks, stubs, and fakes in detail

The chapter on [test architecture](/?c=tests&p=architecture-de-test) introduced test doubles (stub, mock, fake) in one sentence each. This chapter digs into their practical differences, and above all the most common pitfall of using them: over-mocking.

## Three families, three uses

| Test double | Answers | Checks |
|---|---|---|
| **Stub** | "What should this dependency return?" | Nothing: just a fixed response, imposed by the test |
| **Mock** | "Was this dependency used correctly?" | That a call actually happened, with what arguments, how many times |
| **Fake** | "How would a simplified real version behave?" | Nothing directly: it's an implementation behaving almost like the real one |

```text
Function under test: sendNotification(user, service)

With a stub:
  service = { send: () => "ok" }
  -> the test checks what sendNotification() does with this
     fixed response, without caring how service.send() was
     called

With a mock:
  service = a mock of the service, recording every call
  -> the test then checks: was service.send called once,
     with the expected user as a parameter?

With a fake:
  service = an in-memory implementation that actually stores
  the sent notifications, never touching the network
  -> the test can read back the list of "sent" notifications
     the way the real service would
```

## State-based vs interaction-based testing

This distinction reflects two different ways of checking a behavior:

| Approach | What it looks at |
|---|---|
| **State-based** (stub, fake) | The final result: what did the function produce or change? |
| **Interaction-based** (mock) | The flow: which dependencies got called, and how? |

A state-based test stays valid even if the implementation changes internally (as long as the final result doesn't change); an interaction-based test breaks as soon as the implementation changes how it calls its dependencies, even if the final result stays identical.

> **Pitfall:** using a mock to check an implementation detail with no real importance (the exact order of two independent calls, for example). The test then becomes coupled to an arbitrary implementation decision, and breaks on the slightest refactoring that changes nothing about the observable behavior.
>
> **Best practice:** prefer a state-based test whenever the final result is enough to check the behavior; reserve mocks for cases where the interaction itself is the behavior to check (e.g. "an email was actually sent", where there's no other observable result besides the call itself).

## Over-mocking: the most common pitfall

Replacing **every** dependency of a function with a test double, including ones that could stay real at no cost, produces a test that no longer checks much: it only confirms the code calls the right functions in the right order, never that it produces a correct result.

```text
Function under test: calculateTotal(cart) which uses
  - an internal function applyDiscount() (pure, no external
    dependency)
  - an external service exchangeRate()

Over-mocking:
  also mocking applyDiscount() -> the test no longer checks
  whether the discount is applied correctly, only that it
  was "called"

Good balance:
  keep applyDiscount() real (no external dependency, fast,
  deterministic), only mock exchangeRate() (external
  dependency, potentially slow or non-deterministic)
```

> **Pitfall:** mocking a dependency just because it's called by the function under test, without asking whether it actually needs to be (network, time, randomness) or could stay real code.
>
> **Best practice:** only replace with a test double the dependencies genuinely costly or non-deterministic to use as-is in a test; keep pure, deterministic internal code as-is in the test.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A stub returns a fixed response, a mock checks how it was called, a fake is a simplified but functional implementation. A state-based test stays stable through internal refactoring; an interaction-based test (mock) is more sensitive to it. Over-mocking (mocking pure internal dependencies) produces tests that no longer check real behavior. |
| **Usable tools** | A stub/fake for a state-based test. A mock only when the interaction itself is the behavior to check. |
| **Pitfalls to avoid** | Using a mock for an implementation detail with no real importance. Mocking a dependency that could stay real at no cost (pure, deterministic internal code). |
| **Best practices** | Prefer a state-based test when the final result is enough. Only mock dependencies genuinely costly or non-deterministic. |
