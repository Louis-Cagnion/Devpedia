---
order: 14
---

# Browser-Side Vulnerabilities

Some attacks exploit no code flaw in the classic sense (injection, access control): they hijack default behaviors of the browser itself, or the absence of an explicit instruction the server should have given it. This chapter covers the most common ones.

## Clickjacking: Clicking on Something Other Than What You See

An attacking site can load YOUR site in an invisible `iframe` (opacity close to zero), precisely overlaid on an attractive fake button displayed on top. The victim thinks they are clicking the fake button; they are actually clicking a real button of your site, hidden underneath.

```text
Attacker's page (what the victim sees):
  ┌─────────────────────────┐
  │   "Win a gift!"         │   <- what the victim THINKS they click
  │      [ Click here ]     │
  └─────────────────────────┘

Overlaid reality (invisible):
  ┌─────────────────────────┐
  │  iframe of your site    │   <- what REALLY receives the click
  │  [Confirm transfer]     │      (sensitive button, placed exactly
  └─────────────────────────┘       under the visible fake button)
```

| | |
|---|---|
| **Pitfall** | Telling the browser nothing about whether your site may be displayed in an `iframe`: by default, any site can do it |
| **Best practice** | Send the `Content-Security-Policy: frame-ancestors 'none'` header (or `'self'` if your own site needs to frame itself) on every page that triggers a sensitive action, so that the browser simply refuses to display it in an iframe elsewhere |

## Open Redirect: a Redirect Hijacked for Phishing

A redirect parameter (`?next=`, `?redirect=`, often used to "return to the requested page after login") that accepts any external URL turns your own domain, normally trustworthy, into a springboard to a phishing site.

```text
Link sent by the attacker, with the REAL domain of the trusted site:
  https://trusted-site.example/login?next=https://pirate-site.example/fake-form

The victim sees "trusted-site.example" in their browser (reassuring),
clicks, logs in normally... then is redirected to the pirate site
right after, on a domain they are no longer looking at by then
```

> **Pitfall:** validating the redirect parameter by only checking that it LOOKS like a URL (presence of `http`), without checking its domain.
>
> **Best practice:** accept only a relative path internal to the site (`/profile`, never a full URL) for this kind of parameter, or explicitly check the domain against an allowlist if an external redirect is really needed.

## Reverse Tabnabbing: the Opened Page Takes Control of the Original Tab

A `target="_blank"` link (opening in a new tab) gives the opened page, by default, access to `window.opener`, a reference to the ORIGINAL tab. A malicious page opened this way can then silently redirect that original tab (still open behind, out of the victim's immediate view) to a fake login page.

```javascript
// In the page opened with target="_blank", with no defense from the original site:
window.opener.location = "https://pirate-site.example/fake-login-page";
// The ORIGINAL tab (the one the victim still believes to be the real site)
// ends up redirected, without the victim having clicked anything in it
```

> **Pitfall:** using `target="_blank"` on a link to external content (user-generated, or to a third-party site) without restricting this access.
>
> **Best practice:** always add `rel="noopener noreferrer"` to every `target="_blank"`, especially when the URL comes from external data. `noopener` cuts access to `window.opener`; `noreferrer` also prevents the opened site from knowing where the click came from.

## HTTP Parameter Pollution: the Same Parameter Sent Twice

Nothing prevents an HTTP request from carrying the same parameter name twice (`?id=1&id=2`). The problem: each layer that handles this request (web server, framework, application code) can pick a DIFFERENT convention to resolve this duplicate (keep the first, keep the last, merge them into an array), without it necessarily being documented or consistent between them.

| Layer | Possible behavior with `?id=1&id=2` |
|---|---|
| A validation layer | Only looks at the FIRST `id` (`1`), judges it valid |
| The business code that actually handles the request | Uses the LAST `id` (`2`) |

If the attacker knows about this divergence, they can have a harmless parameter validated by the control layer while making the business code ACT on a second parameter that is never checked.

> **Best practice:** never assume that a parameter appears only once in a request; explicitly check, in the framework used, which convention applies to duplicates, and make sure the validation layer and the execution layer use the SAME value.

## Missing Security Headers

Several HTTP response headers, absent by default, explicitly tell the browser how to behave defensively with this page. [CORS](/?c=securite&s=cybersecurite&p=securite-api-web) is already covered separately; here are the others:

| Header | What it prevents |
|---|---|
| `Content-Security-Policy: frame-ancestors` | Clickjacking (seen above) |
| `X-Content-Type-Options: nosniff` | The browser sometimes guesses (*sniffs*) the type of a served file instead of trusting the declared `Content-Type`; a file uploaded by a user and guessed to be executable HTML/JS instead of its harmless declared type can then run |
| `Strict-Transport-Security` | The browser forces every future connection to this domain over HTTPS, even if a link explicitly points to HTTP |
| `Referrer-Policy: strict-origin-when-cross-origin` (or `no-referrer`) | Leaking the page address in the `Referer` header sent to other sites: with this value, another site only receives the domain name, never the path or the parameters |

> **Best practice:** set these headers at the web server or framework level for the whole site, rather than case by case on each route.

> **Pitfall:** even with this policy (applied by default by recent browsers, but not by older ones), sensitive data placed in the address (`?email=...`, `?token=...`) remains visible in the browser history, the server logs and the `Referer` sent to the site's own resources: this is the [CWE-598](https://cwe.mitre.org/data/definitions/598.html) weakness. Sensitive data goes in the body of a `POST` request, never in the URL.

## Forms on a Shared Device: `autocomplete="off"`

A browser remembers what is typed into form fields and suggests it again on the next entry (name, phone number, e-mail...). On a personal computer, that is convenient; on a **shared device** (self-service terminal, kiosk, reception desk computer), the next user sees the previous one's personal data.

```html
<input type="email" name="email" autocomplete="off">   <!-- no remembered suggestion -->
```

| Situation | Setting |
|---|---|
| Personal computer | Keep autocompletion: it helps the user |
| Terminal or shared device | `autocomplete="off"` on every personal data field, and clear the browser data between two sessions (safest: a private browsing profile restarted for each user) |

> **Pitfall:** browsers may ignore `autocomplete="off"` on login fields (username, password), so that their password manager keeps working. On a terminal, never rely on this attribute alone.

## Storing a Token on the Client: `localStorage` Versus an `HttpOnly` Cookie

[Sessions and Cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) explains why an `HttpOnly` cookie protects the session identifier from being read by JavaScript. An application that manages a token itself (JWT, client-side API key) can choose where to store it in the browser, with opposite properties:

| | `HttpOnly` cookie | `localStorage`/`sessionStorage` |
|---|---|---|
| Readable by a JavaScript script of the page | No | Yes |
| Can be stolen through an [XSS](/?c=securite&s=cybersecurite&p=xss-en-detail) flaw elsewhere on the site | No (the cookie stays invisible to the injected script) | Yes (`localStorage.getItem(...)` is enough) |
| Sent automatically with every request to the domain | Yes | No (to be added manually to each call) |
| Convenient for an API called from a different domain | More complex (cross-domain constraints on cookies) | Simpler |

> **Pitfall:** storing a sensitive token in `localStorage` for ease of implementation, without having measured that a single XSS flaw elsewhere on the site is then enough to steal it entirely.
>
> **Best practice:** prefer an `HttpOnly` cookie for any token whose theft would have a significant impact, and keep `localStorage` for data whose exposure poses no real risk even in case of XSS.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Several attacks exploit default browser behaviors rather than a code flaw: unrestricted iframe display (clickjacking), redirect to an unchecked external domain (open redirect), access to `window.opener` from a `target="_blank"` (reverse tabnabbing), inconsistent handling of a duplicated parameter (HPP), missing security headers, or the choice of client-side storage for a token. |
| **Tools you can use** | `Content-Security-Policy: frame-ancestors`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `rel="noopener noreferrer"`, `autocomplete="off"` on a shared device. |
| **Pitfalls to avoid** | Not restricting iframe display. Accepting any full URL as a redirect target. `target="_blank"` without `rel="noopener noreferrer"`. Assuming an HTTP parameter appears only once. Storing a sensitive token in `localStorage` without measuring the XSS risk. |
| **Best practices** | Set the relevant security headers for the whole site. Accept only an internal relative path for a post-login redirect. Use `rel="noopener noreferrer"` systematically. Check the framework's convention for a duplicated parameter. Prefer an `HttpOnly` cookie for a sensitive token. |
