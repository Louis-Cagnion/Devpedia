---
order: 8
---

# The Local Server: Testing a Web Page Without Putting It Online

Opening an `index.html` file directly in the browser (double-clicking it, or an address starting with `file://`) works fine for a very simple page. As soon as it loads other files (`fetch`, JavaScript modules, certain fonts), the browser silently blocks these loads: what's missing is a **local server**, a program that serves the project's files the way a real website online would, but from its own machine.

## Why `file://` Isn't Enough

A browser applies different security rules depending on whether the page comes from an `http://`/`https://` address (a real server) or from `file://` (a local file). Several common features are restricted or disabled under `file://`:

| What the page needs | Under `file://` | With a local server |
|---|---|---|
| Load another file with `fetch` | Blocked (CORS error) | Works |
| Load a JavaScript module (`<script type="module">`) | Blocked in most browsers | Works |
| Reload the page on every change (live reload) | Impossible | Possible (depending on the tool) |

> **Pitfall:** seeing a `CORS` error or `Failed to fetch` in the console and looking for the problem in your own code. The most common cause is simply the absence of a local server: the page is open under `file://`.
>
> **Best practice:** as soon as a page loads another file (JSON, a JS module...), test it from a local server rather than by double-clicking it directly.

## Local Server, Production Server: Same Role, Different Reach

A local server responds to the same kinds of requests as a production server (see [API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) for the details of the request/response exchange): receive an address, return the requested file. The difference lies in who can access it.

```text
Local server (localhost)           Production server
      │                                    │
Responds only to this              Responds to anyone on the
machine (127.0.0.1)                Internet, with a real domain
      │                                    │
Serves as a draft during     →     Receives the finished result,
development                        once it's ready
```

> **Pitfall:** thinking a site "is live" once it's running locally, and neglecting the deployment step. `localhost` is only reachable from the machine running it: no one else has access until the site is deployed to a real server.

## Launching a Local Server

Several tools provide the same service; the choice mostly comes down to what's already installed.

| Tool | Command | Prerequisite |
|---|---|---|
| Python (already present on macOS/Linux) | `python3 -m http.server 8000` | Python installed |
| Node.js | `npx serve` | Node.js installed |
| PHP | `php -S localhost:8000` | PHP installed |
| Live Server (VS Code extension) | Right-click `index.html` → "Open with Live Server" | VS Code |

Once launched, the terminal displays an address (often `http://localhost:8000` or `http://127.0.0.1:5500`) to open in the browser.

> **Learn more:** `localhost` and `127.0.0.1` both refer to "this machine itself"; the number after the `:` (the **port**) distinguishes between several servers that might be running at the same time on the same machine.

## Automatic or Manual Reload

Some tools (Live Server) reload the page automatically every time a file is modified and saved; others (`http.server`, `php -S`) never do, so you have to reload it yourself (`F5`).

> **Pitfall:** an automatic reload happening in the middle of a test that depends on timing (an animation, audio playback, an ongoing connection) interrupts it without warning, invalidating the test.
>
> **Best practice:** for a timing-sensitive test, prefer a tool without automatic reload (`http.server`, `php -S`): the page only changes when you reload it yourself, at the moment you choose.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A file opened under `file://` has no access to `fetch`, to JS modules, or to automatic reload: a **local server** lifts these restrictions by serving files the way a real server would, but reachable only from its own machine (`localhost`). |
| **Available tools** | `python3 -m http.server`, `npx serve`, `php -S`, the Live Server extension for VS Code. |
| **Pitfalls to Avoid** | Looking for a bug in your code when faced with a CORS error/`Failed to fetch` while the page is running under `file://`. Using a tool with automatic reload for a timing-sensitive test (audio, animation): the reload can interrupt it mid-way. |
| **Best Practices** | Always test from a local server as soon as the page loads another file. Choose a tool without automatic reload for a timing-sensitive test. |
