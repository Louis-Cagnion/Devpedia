---
order: 10
---

# Attacking (and Defending) an Automated Browser

[Web exploitation from the attacker's side](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant) looks at an attacker targeting YOUR site. This chapter flips the perspective, for an increasingly common case: your own code drives a real browser (Playwright, Selenium, Puppeteer) against pages you do NOT control: a scraper visiting partner sites, a tool automating a task on a third-party site. This time, it's YOUR automated browser that becomes the target.

## A driven browser is still a full browser

The difference between "reading a page" and "displaying a page in a browser" matters more than it seems: a script that just downloads a page's HTML (a plain HTTP request) risks none of what's in this chapter, it only obtains text. A DRIVEN browser, on the other hand, actually executes the page: JavaScript included, like a human visitor, with the same capabilities as a normal browser, including ones your automation script never intended to use.

```text
Plain HTTP request (no risk covered here):
  Script --GET request--> Server --returns raw HTML--> Script (just reads text)

Driven browser (Playwright/Selenium/Puppeteer):
  Script --controls--> Real browser --loads AND EXECUTES the page-->
  the page can trigger a download, open a popup, read the
  clipboard, attempt to exploit the browser itself -- exactly
  as it could against a real human visitor
```

## What a malicious page can attempt against the automated driver

| Vector | What it exploits |
|---|---|
| Auto-triggered download | A page that forces a file download with no explicit action; if the driven browser silently accepts every download (a default behavior often enabled for automation), the file lands on disk with no human oversight to notice it |
| Clipboard hijacking | The browser's clipboard API, reachable from JavaScript, lets a page read or modify its content under certain conditions; a script that later reuses that clipboard elsewhere (automated copy-paste of a fetched value) inherits the injected content |
| Unexpected popup/redirect | A page that opens a new window or aggressively redirects can disrupt the driving script's logic (which assumes it stayed on the expected page), or even make it interact by mistake with a different page than intended |
| Automated-driver fingerprinting | Some pages detect the presence of an automated browser (JavaScript properties specific to Playwright/Selenium) to adapt their behavior: showing different content, or triggering a targeted anti-bot defense |
| Injection into extracted data | If the script then trusts the text extracted from the page (a title, a price) without treating it as untrusted external data, a booby-trapped value can propagate further into whatever system receives that result (see the principle already laid out in [The Main Families of Vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles)) |

## The key distinction: "scraping data" versus "executing a page"

The central defensive reflex fits in one sentence: an automation script only ever needs a small slice of what a full browser can do (load a page, read its content, click on expected elements). Everything else (downloads, popups, system permissions, clipboard access) must be explicitly RESTRICTED, never left at the defaults designed for interactive human use.

| Setting | Default behavior | Recommended restriction for an automated driver |
|---|---|---|
| Downloads | Often silently accepted | Disable, or redirect to an isolated folder that's never automatically executed |
| Native dialogs (`alert`, `confirm`, popup) | Sometimes block the waiting script | Systematically intercept them (`page.on("dialog")` in Playwright) to close them automatically, never letting them pile up or influence the script |
| Browser permissions (geolocation, notifications, clipboard) | Varies by browser | Deny every permission by default, granting only those actually needed for the task |
| Trust in extracted text | Often treated as already trustworthy once "just extracted" | Treat as untrusted external data (escape before any use: display, query, log) |

> **Pitfall:** treating scraping as a risk-free operation because "we're only reading public data." The browser executing the page remains fully exposed to whatever that page attempts, regardless of the driving script's intent.
>
> **Best practice:** explicitly configure the driven browser with the minimum capabilities the task needs (downloads disabled, dialogs intercepted, permissions denied by default), and treat any data extracted from an uncontrolled page as external and untrusted before reusing it anywhere else in the system.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A browser driven by a script (Playwright/Selenium/Puppeteer) actually executes the pages it visits, with every capability of a normal browser: a malicious page can attempt an auto-triggered download, hijack the clipboard, disrupt the script via a popup, or detect the automation itself. |
| **Tools you can use** | Intercepting native dialogs (`page.on("dialog")`); disabling downloads or using a dedicated isolated folder; denying browser permissions by default. |
| **Pitfalls to avoid** | Leaving a browser's human-oriented defaults in place for an automated driver. Trusting data extracted from an uncontrolled page without treating it as external. |
| **Best practices** | Explicitly restrict the driven browser to the minimum the task needs. Systematically intercept every unexpected dialog/download. Escape any extracted data before reuse, like any other external data. |
