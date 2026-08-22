---
order: 2
---

# Waiting Without Wasting Time

In a program that talks to the outside world (network, browser, disk), most of the time isn't computation: it's waiting. And a badly written wait costs time even when there's nothing to wait for.

## The fixed-delay problem

The most common reflex is to add a pause "long enough for it to work":

```python
page.click("Next page")
time.sleep(2)              # hopefully 2s is enough
read_results()
```

This code has two opposite flaws, which is what makes it treacherous:

- if the page responds in 300 ms, you **waste 1.7s** on every call;
- if it takes 2.5s (busy network, heavy page), you read **too early** and the result is incomplete: an intermittent bug, very painful to diagnose.

A fixed delay is a bet on a duration you don't control. It's either too long or too short, and usually both, depending on the day.

## Waiting for a condition, not a duration

The right way to phrase it is: *wait until the result is there*, with a safety ceiling so you don't block forever.

```python
def wait_until(condition, timeout_s=5, interval_ms=150):
    """Waits until condition() is true. Returns False if the deadline is exceeded."""
    for _ in range(int(timeout_s * 1000 / interval_ms)):
        if condition():
            return True
        sleep(interval_ms)
    return False
```

In use:

```python
count_before = count_results()
page.click("Next page")

if not wait_until(lambda: count_results() > count_before):
    raise RuntimeError("The next page never loaded")
```

You move on as soon as the content is ready (so in 300 ms when the page is fast) while staying correct when it's slow. The ceiling no longer serves as the wait time, it's a failure detector.

> Notice that the condition is about a **change** (`> count_before`), not a presence. If you simply waited for "are there any results?", the condition would already be true from the previous page's results, and you'd read the old data thinking you were reading the new one.

## Don't watch for what won't come

The most expensive case is waiting for an **optional** event. Checking for a cookie banner for 2 seconds costs a full 2 seconds every time there isn't one: which is almost always, once consent has been recorded.

Two safeguards combine here:

**Memoize what can no longer change.** **Memoization** means keeping the result of an expensive check in memory so it's never redone once the answer can no longer change. Once consent is settled for a site, no banner will reappear on its other pages: no need to check on every navigation.

```python
def close_banner(page, sites_already_handled):
    site = domain_of(page.url)
    if site in sites_already_handled:
        return                      # already settled: don't waste 2s rechecking
    sites_already_handled.add(site)
    ...
```

**Query an authoritative source rather than poll for it.** Rather than watching for a banner to appear, you can directly ask whether consent already exists: here, the presence of a cookie:

```python
def consent_already_given(page):
    return any("consent" in c["name"].lower() for c in page.cookies())
```

If so, a single immediate check is enough; if not, keep the full watch. Behavior stays correct in both cases, with no bet on how long it takes to appear.

These two changes removed 12.8 of the 25 seconds from the example program cited earlier, without changing a single request sent: it was purely local waiting.

## Keep a pause when it serves a purpose

Be careful not to remove **useful** pauses. Against a remote service, a deliberate spacing between requests protects against rate limiting or a block. The distinction to make:

| Type of pause | Remove it? |
|---|---|
| Waiting an arbitrary duration "just in case" | Yes, replace with a condition |
| Rechecking information that can't change | Yes, memoize |
| Deliberately spacing out requests to the same service | **No**, it's a protection |

A courtesy pause isn't an inefficiency: it's a design constraint. Removing it doesn't make the program better, it just shifts the problem to a failure that's harder to diagnose.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A fixed delay (`sleep(2)`) is always either too long (wasted time) or too short (intermittent bug): waiting for a condition with a safety ceiling solves both problems at once. |
| **Tools you can use** | A generic "wait until" function (condition + timeout), memoization to stop rechecking what can no longer change. |
| **Pitfalls to avoid** | Watching for an optional event on every iteration (a cookie banner) without remembering it won't reappear. |
| **Best practices** | Query an authoritative source (a cookie) rather than poll a display; keep deliberate pauses that protect against rate limiting. |
