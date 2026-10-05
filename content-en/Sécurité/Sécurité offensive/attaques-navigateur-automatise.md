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

## The concrete signal anti-bots read: `navigator.webdriver`

The WebDriver protocol, used by Playwright, Selenium, and similar tools to drive a browser, exposes by default a JavaScript property readable by any page:

```javascript
navigator.webdriver   // true if driven via WebDriver, false/undefined otherwise
```

Any script on the page, and thus any anti-bot system, can read this property to distinguish a human visitor from a script, with no need to analyze subtler behavior. The countermeasure is to redefine this property before any other script on the page runs:

```javascript
Object.defineProperty(navigator, "webdriver", { get: () => undefined });
```

Injected at the very start of each page's load (`context.add_init_script(...)` in Playwright), this redefinition hides the most direct signal, without changing anything else about the browser's behavior.

> **Pitfall:** masking `navigator.webdriver` doesn't make a driven browser undetectable: advanced anti-bot systems combine dozens of signals (click timing, screen resolution, installed fonts...), not just this property. Treating it as the only thing to fix gives a false sense of security.

## Headless mode or a real window

A **headless** browser runs without displaying a window: it is the most common mode for a script, because it needs neither a screen nor an open session. But a browser without a window does not present itself exactly like a normal browser: some versions announce "HeadlessChrome" in their identifier (*User-Agent*) or do not expose the same features. Anti-bot systems use this to decide whether to show an extra check (see [fingerprinting](/?c=securite&s=cybersecurite&p=fingerprinting-navigateur-et-appareil)).

| | Headless | Real window |
|---|---|---|
| Resources | Light | Heavier (a window to draw) |
| Needs an open session | No | Yes (see [Windows sessions](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) |
| Fingerprint | Sometimes recognizable | That of an ordinary browser |
| Human intervention possible (validating a check) | No | Yes |

A common alternative: launch a **real window, but place it off the visible screen** (`--window-position=-32000,-32000`), to keep the fingerprint of a normal browser without bothering the person using the machine. The page size is set separately, by the **viewport** (the display area the page believes it has): it is imposed by the script and does not depend on the screen resolution, which only matters to a human who would look at the window.

```python
browser = p.chromium.launch(
    headless=False,                            # real window, no headless mode
    args=["--window-position=-32000,-32000"],  # window placed off the visible screen
)
page = browser.new_page(viewport={"width": 1280, "height": 1000})
```

> **Pitfall:** switching mode (real window in development, headless in production) without retesting: the page may behave differently (a check that appears, a layout that changes), and the script was only validated in the other mode.
>
> **Best practice:** test in the mode actually used in production, and fix the `viewport` so the layout does not depend on the machine's screen.

## Captchas: a check built to stop robots

A **captcha** (*Completely Automated Public Turing test to tell Computers and Humans Apart*) is a test the page asks you to pass before continuing: recognizing images, ticking a box. It is designed to be easy for a human and hard for a program, and recent versions also judge the browser's behavior and fingerprint rather than only the displayed test.

A robot that runs into a captcha should therefore not try to get through it. The usual pattern is to **let a human solve it** in a real window, then reuse the result: once the check is passed, the site sets a validation cookie (for example `cf_clearance` at Cloudflare) that the browser sends back with each request, without a new test, as long as it is valid.

> **Pitfall:** believing a validation cookie is universal. It is often tied to the browser (identifier, fingerprint) and to the IP address that obtained it: a robot that reuses the same cookie with a different fingerprint (for example by moving from the real window to headless mode) is blocked again.
>
> **Best practice:** plan a "human intervention required" state (notification, visible window) rather than looping silently; do not bypass a captcha with a third-party service without checking that the site's terms of use allow it.

## The persistent browser profile

By default, a driven browser starts with a blank profile, destroyed on close: no cookie survives from one launch to the next. A **persistent profile** is a folder that keeps cookies, local storage and cache. With Playwright, it is requested through `launch_persistent_context` ([documentation](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-persistent-context)):

```python
context = p.chromium.launch_persistent_context(
    user_data_dir=r"C:\robot\profile",  # cookies, local storage and cache kept here
    headless=False,                     # same mode at every launch
    viewport={"width": 1280, "height": 1000},
)
```

The validation cookie obtained after a captcha then stays in this folder, and later launches no longer see the check.

| Point of attention | Why |
|---|---|
| One browser at a time per profile | The folder is locked while a browser uses it; a second launch fails |
| The path depends on the account running it | A path relative to the user's folder does not point to the same folder for another account (service account, scheduler): the robot starts from an empty profile and sees the captcha again |
| The content is sensitive | The profile contains open sessions: whoever copies the folder can log in in their place |

> **Pitfall:** committing the profile folder to [Git](/?c=git&p=git), or leaving it readable by every account on the machine.
>
> **Best practice:** give the profile path as absolute (or in an environment variable), exclude it from the repository (`.gitignore`) and restrict access to the account that runs the robot.

## Chrome remote debugging

Chrome can open a **remote debugging** port (`--remote-debugging-port=9222`): a tool, or a script, connects to it speaking the **Chrome DevTools Protocol** (CDP), the protocol the browser's developer tools also use ([documentation](https://chromedevtools.github.io/devtools-protocol/)). This lets you see and drive a page of a Chrome with no desktop (a server, a remote machine).

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\robot\debug-profile
```

| Use | How |
|---|---|
| Check that the port answers | `curl http://localhost:9222/json/version` (returns the version and the address of the control channel) |
| See the page in another Chrome | Open `chrome://inspect`, add `localhost:9222` to the targets: the page appears, with its developer tools |
| Drive with Playwright | `p.chromium.connect_over_cdp("http://localhost:9222")` |

This port requires **no authentication**: whoever connects to it controls the browser, including the sessions open in its profile (they can read cookies, navigate, run JavaScript in a logged-in page).

> **Pitfall:** exposing this port to the network. Chrome only listens on `127.0.0.1` by default (invisible from the network, see [SSH tunnels](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)); changing the listening address or opening the port in the firewall gives control of the browser to anyone who reaches it.
>
> **Best practice:** leave the port on `127.0.0.1` and, to reach it from another computer, go through an SSH tunnel (`ssh -N -L 9222:localhost:9222 …`).

> **Pitfall:** since Chrome 136, the `--remote-debugging-port` option is no longer honored when the profile is Chrome's default one: a non-standard folder uses a different encryption key, which protects the usual profile's data from malicious programs ([announcement](https://developer.chrome.com/blog/remote-debugging-port)). Without `--user-data-dir`, the port does not answer.
>
> **Best practice:** always give a `--user-data-dir` dedicated to the robot, distinct from the personal profile.

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
| **Key takeaways** | A browser driven by a script (Playwright/Selenium/Puppeteer) actually executes the pages it visits, with every capability of a normal browser: a malicious page can attempt an auto-triggered download, hijack the clipboard, disrupt the script via a popup, or detect the automation itself via `navigator.webdriver`. Headless mode has a sometimes recognizable fingerprint; a captcha is lifted by a human in a real window, and the unblocking is reused thanks to a persistent profile; Chrome's remote debugging port has no authentication. |
| **Tools you can use** | Intercepting native dialogs (`page.on("dialog")`); disabling downloads or using a dedicated isolated folder; denying browser permissions by default; masking `navigator.webdriver` via `context.add_init_script(...)`. A real window placed off screen and a fixed `viewport`; `launch_persistent_context` to keep a profile; `--remote-debugging-port` and `chrome://inspect` to observe a Chrome with no desktop. |
| **Pitfalls to avoid** | Leaving a browser's human-oriented defaults in place for an automated driver. Trusting data extracted from an uncontrolled page without treating it as external. Believing a driven browser becomes undetectable once `navigator.webdriver` is masked. Validating in one mode (real window) and running in another (headless). Believing a captcha validation cookie holds for another fingerprint. A browser profile that is versioned, readable by everyone or designated by a path that changes with the account. A debugging port exposed to the network. |
| **Best practices** | Explicitly restrict the driven browser to the minimum the task needs. Systematically intercept every unexpected dialog/download. Escape any extracted data before reuse, like any other external data. Test in the production mode and fix the `viewport`. Plan a "human intervention required" state in front of a captcha. Profile with an absolute path, outside the repository, reserved to the robot's account. Debugging port on `127.0.0.1` only, reachable remotely through an SSH tunnel, with a dedicated `--user-data-dir`. |
