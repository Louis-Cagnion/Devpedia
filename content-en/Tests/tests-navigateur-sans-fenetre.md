---
order: 12
---

# Testing an Interface in a Headless Browser (29/10/2026)

A **browser** is the software that displays web pages (Chrome, Firefox, Safari...). The **interface** of a web application is what the user sees and handles: buttons, fields, texts. Testing an interface means opening the page in a real browser, clicking and typing in place of a human, then checking what is displayed. This chapter does it with a **headless** browser (*headless*, literally "without a head"): a real browser, with its full engine (it loads the page, runs its JavaScript, computes the layout), but which draws nothing on screen and is driven only by a program.

Driving is handled by a **test bench** written by hand: a small tool that launches the browser, runs the tests, reports failures and cleans everything up afterwards. It talks to the browser with the **Chrome DevTools Protocol** (*CDP*, "the protocol of Chrome's developer tools"; a **protocol** is a set of rules that fix how two programs talk to each other) and fits in about 220 lines of JavaScript. Writing this bench once lets you understand what ready-made tools such as [Playwright](https://playwright.dev/docs/intro) and [Puppeteer](https://pptr.dev/) do for you, compared [below](#playwright-puppeteer-or-a-homemade-bench).

This chapter complements [end-to-end tests](/?c=tests&p=tests-end-to-end), which explain **why** and **when** to simulate a complete user journey: here, we look at **how** to make it work in practice. It assumes you already know [the terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type commands), [HTML tags and attributes](/?c=langages&s=html&p=structure-dun-document), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions), [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements) (the page seen as a tree of elements that JavaScript manipulates), [asynchronous programming](/?c=langages&s=javascript&p=asynchrone) (`async`, `await` and promises: operations whose result arrives later) and [error handling](/?c=langages&s=javascript&p=gestion-des-erreurs) (`try`, `catch`, `finally`).

| Step of the bench | What happens | Section |
|---|---|---|
| 1. Launch | Chrome starts without a window, with a new **profile** (its settings folder) and an open **debugging port** (a numbered door through which it is driven) | [Launching Chrome Without a Window](#launching-chrome-without-a-window) |
| 2. Connect | The test opens a [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) (a channel that stays open) to the page | [The CDP](#the-cdp-json-commands-sent-over-websocket) |
| 3. Act | The test sends commands: navigate, click, type | [The bench, piece by piece](#the-bench-piece-by-piece) |
| 4. Wait | The test waits until the desired state, without any fixed pause | [Waiting for a state](#waiting-for-a-state-instead-of-sleeping-for-a-fixed-delay) |
| 5. Verify | The test reads the page and compares it with what is expected | [Reading the page and writing assertions](#reading-the-page-and-writing-assertions) |
| 6. Diagnose and close | A screenshot is taken on failure, then Chrome is closed | [Capturing an image](#capturing-an-image-to-diagnose-a-failure) |

## Why a Headless Browser

To check that a page works, three approaches exist. An **HTTP request** (the request a program sends to a server to obtain a file, see [the API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) only retrieves the text of the page: no JavaScript runs, so no button reacts. A browser with a window does everything, but it requires a screen. The headless browser does everything, without a screen.

| | HTTP request only | Headless browser | Browser with a window |
|---|---|---|---|
| Runs the page's JavaScript | No | Yes | Yes |
| Computes the layout, as for the user | No | Yes | Yes |
| Needs a screen | No | No | Yes |
| Can run on a server without a screen | Yes | Yes | Only if the machine provides a screen, even a fake one |
| A human can watch it live | Not applicable | No: we take screenshots | Yes |
| Typical use | Checking that an address responds | Automated tests | Understanding a test by watching it |

Three concrete reasons justify this choice.

| Reason | Explanation |
|---|---|
| Continuous integration server | **Continuous integration** (CI) is a service that runs the tests automatically at each change to the code (see [the CI/CD pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd)). Its machines generally have no screen: the browser must be able to start without one |
| Speed | No window to draw or manage. On the machine used to write this chapter: Chrome answers on its port 0.65 to 0.84 s after launch (four tries), and six tests last from 0.33 to 0.76 s each, about 2.5 s in total |
| Reproducibility | A new profile (no extension, no personal setting) and a fixed page size give the same result on every machine. The user's usual browser is never touched |

## What You Need on Hand

**Node** (or Node.js) is a program that runs JavaScript outside a browser, from a terminal ([official documentation](https://nodejs.org/docs/latest/api/)). The bench is written in Node, using only the tools that come with it: no package to install (a **package** is a bundle of code written by others, which you download to use it).

| Element | Role | How to check it |
|---|---|---|
| Google Chrome | The browser being driven | The file exists at its location (next table) |
| Node, recent version | Runs the bench and the tests | `node --version` displays a version number |
| The `WebSocket` built into Node | Talks to the browser without an extra package | `node -e "console.log(typeof WebSocket)"` displays `function` (checked on 29/10/2026) |
| A terminal | Runs the commands | See [the terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) |
| A working folder | Receives the three files of this chapter: `counter.html`, `bench.mjs`, `tests.mjs` | Any empty folder |

If `typeof WebSocket` displays `undefined`, the Node version is too old: it must be updated.

The bench reads Chrome's location from an **environment variable** named `CHROME_PATH` (a value that the terminal passes to every program it launches, see [environment variables in Bash](/?c=langages&s=bash&p=variables-denvironnement) and [in PowerShell](/?c=langages&s=powershell&p=variables-denvironnement)). Thus, the same code works on every machine: only the variable changes.

| System | Usual location of Chrome |
|---|---|
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` (varies by distribution) |

```bash
# Bash (Git Bash, the terminal installed with Git on Windows, or the one on Linux and macOS)
# export creates a variable for the programs launched afterwards; in Git Bash, forward
# slashes / replace backslashes \
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

```powershell
# PowerShell: $env:NAME = value creates the variable for the programs launched afterwards
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Only the Windows location was verified while writing (29/10/2026): check the other two on your machine.

## The Page to Test

To practise without depending on an existing site, here is a small page: a counter, a "step" field (by how much the counter increases), three buttons and a message area. It contains two deliberate slowdowns, which imitate a real application: its buttons only respond 300 ms after loading, and "Save" takes 400 ms to confirm, as a server would.

Save this code under the name `counter.html`.

```html
<!DOCTYPE html>
<!-- lang="en" : the page is written in English -->
<html lang="en">
<head>
    <!-- charset : the character encoding, so that every character displays correctly -->
    <meta charset="utf-8">
    <!-- title : the page title, which the tests can read with document.title -->
    <title>Counter</title>
</head>
<body>
    <h1>Counter</h1>
    <!-- output : displays a result ; data-testid : stable marker for the tests -->
    <p>Value: <output id="value" data-testid="value">0</output></p>
    <!-- The "step" field: by how much the counter increases at each addition -->
    <label>Step: <input id="step" type="text" value="1"></label>
    <!-- Three buttons ; type="button" : they submit no form -->
    <button id="add" type="button">Add</button>
    <button id="reset" type="button">Reset</button>
    <button id="save" type="button">Save</button>
    <!-- role="status" : area whose text changes to inform the user -->
    <p id="status" role="status"></p>
    <script>
        // Total of the counter, and access to the elements of the page
        let total = 0;
        const value = document.getElementById("value");
        const step = document.getElementById("step");
        const statusArea = document.getElementById("status");

        // Adds the step to the total (0 if the field holds no number) and displays it
        function add() {
            total += Number(step.value) || 0;   // Number converts the text into a number
            value.textContent = total;          // displays the new total
        }

        // Connects the buttons and the keyboard, then announces that the page is ready
        function start() {
            // A click on "Add" calls the add function
            document.getElementById("add").addEventListener("click", add);
            // A click on "Reset" brings the total back to 0
            document.getElementById("reset").addEventListener("click", () => {
                total = 0;                      // the total starts again from zero
                value.textContent = total;      // and so does the display
            });
            // A click on "Save" first displays a waiting message
            document.getElementById("save").addEventListener("click", () => {
                statusArea.textContent = "Saving...";
                // Simulates a slow server: the response arrives 400 ms later
                setTimeout(() => {
                    statusArea.textContent = "Saved: " + total;
                }, 400);
            });
            // The Enter key in the "step" field acts like a click on Add
            step.addEventListener("keydown", (event) => {
                if (event.key === "Enter") add();
            });
            document.body.dataset.ready = "yes";   // marker for the tests: data-ready="yes"
        }

        // Simulates a slow startup: setTimeout calls start after 300 ms,
        // so the buttons only respond from that moment on
        setTimeout(start, 300);
    </script>
</body>
</html>
```

Tests designate elements with **CSS selectors**: the notation that designates an element of the page, as in [CSS selectors](/?c=langages&s=css&p=selecteurs). `#value` designates the element whose `id` is `value`; `[data-testid="value"]` designates the one whose `data-testid` attribute is "value" (see [the `data-` attributes](/?c=langages&s=html&p=attributs-data-et-accessibilite)). The tests rely on these markers:

| Marker | Element | Behavior |
|---|---|---|
| `#value` | The total displayed | Starts at `0` |
| `#step` | The input field | Contains `1` at the start; its value is added at each addition |
| `#add` | "Add" button | Adds the step to the total (also with the Enter key in `#step`) |
| `#reset` | "Reset" button | Brings the total back to `0` |
| `#save` | "Save" button | Displays "Saving..." then, 400 ms later, "Saved: " followed by the total |
| `#status` | Message area | Empty at the start |
| `data-ready="yes"` on `<body>` | "Application is ready" marker | Set 300 ms after loading |

The `data-ready` marker is a useful habit: the application says itself when it is ready, which avoids guessing.

A page opened through a `file://` address (a file on disk, without a server) is enough as long as it loads no other files: see [the local server](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) for the limits of `file://`.

## Launching Chrome Without a Window

Launching Chrome amounts to starting a **process**: a program running, identified by a number called a **PID** (see [process management in Bash](/?c=langages&s=bash&p=gestion-des-processus) and [in PowerShell](/?c=langages&s=powershell&p=gestion-des-processus)). We pass it **options**: words starting with `--` that set its behavior.

| Option | Role |
|---|---|
| `--headless` | Starts without a window |
| `--remote-debugging-port=9333` | Opens a debugging **port**. A port is a number (from 0 to 65535) that distinguishes, on the same machine, the programs waiting for connections; `9333` is an arbitrary choice: any free number works (see [the local server](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) for `localhost` and ports) |
| `--user-data-dir=<folder>` | Designates the **profile**: the folder where the browser stores its settings, its **cookies** (small files by which a site recognizes a visitor), its history and its **extensions** (small programs added to the browser). A new, empty folder gives a "brand new" Chrome and leaves the user's own intact |
| `--no-first-run` | Skips the first-launch assistant of a new profile |
| `--no-default-browser-check` | Does not offer to become the default browser |
| `about:blank` | Starting address: an empty page |

On the machine used to write this chapter (29/10/2026), `--headless` alone is enough, and `--headless=new` is also accepted. The name of the option and its variants change from one Chrome version to another: the [official documentation of headless mode](https://developer.chrome.com/docs/chromium/headless) is authoritative, hence the date in the title of this chapter. Chrome launched this way announces itself as `HeadlessChrome` in its identifier (its *User-Agent*), which was checked.

The bench will launch Chrome itself (section [The bench](#the-bench-piece-by-piece)). Once launched, Chrome listens on the port: it is Chrome that serves as the entry point for driving it.

## The CDP: JSON Commands Sent over WebSocket

A **protocol** is a set of dialogue rules: which messages may be sent, in what form, in what order. HTTP is another example, see [the API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). The **Chrome DevTools Protocol** is the one used by the development tools built into Chrome (F12 key) to talk to the page; Chrome also opens it to programs ([official documentation](https://chromedevtools.github.io/devtools-protocol/)).

Two technologies carry this dialogue:

- the **WebSocket**, a connection that stays open and where each side can send messages whenever it wants, detailed in [WebSocket: real-time communication](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel);
- the **JSON**, a structured text format (`{ "key": value }`), detailed in [the JSON format](/?c=infrastructure-devops&s=infrastructure&p=json): each message is a small JSON text.

Chrome also offers a tiny HTTP service on the same port, to find the WebSocket addresses. Here is what `/json/version` answered on the machine used to write this chapter (the version values are replaced by `...`):

```text
{
  Browser: 'Chrome/...',
  'File-Path-Style': 'windows',
  'Protocol-Version': '...',
  'User-Agent': 'Mozilla/5.0 (...) AppleWebKit/... HeadlessChrome/... Safari/...',
  'V8-Version': '...',
  'WebKit-Version': '...',
  webSocketDebuggerUrl: 'ws://127.0.0.1:9333/devtools/browser/<identifiant>'
}
```

`webSocketDebuggerUrl` is the address of the connection to the **browser** itself. The list of **targets** (pages and other controllable items), at the address `/json/list`, gives one address per target. On the machine used to write this chapter, a new Chrome listed five targets, of types `background_page`, `page`, `browser_ui`, `browser_ui` and `service_worker`: only the one of type `page` is the page to drive. Taking the first one in the list would be a mistake.

```text
  The test (Node)             Headless Chrome                     The page
  ---------------             ---------------                     --------
       |                              |                              |
       | 1. GET /json/list (HTTP)     |                              |
       |----------------------------->|                              |
       |<-----------------------------|  WebSocket addresses         |
       |                              |                              |
       | 2. WebSocket connection      |                              |
       |==============================|  (stays open)                |
       |                              |                              |
       | 3. {"id":1,"method":         |                              |
       |    "Page.navigate",...}      |  loads counter.html          |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 4. {"id":1,"result":{...}}   |                              |
       |<-----------------------------|                              |
       |                              |                              |
       | 5. {"method":                |  page has finished loading   |
       |    "Page.loadEventFired"}    |                              |
       |<-----------------------------|<-----------------------------|
       |                              |                              |
       | 6. {"id":2,"method":         |                              |
       |    "Runtime.evaluate",...}   |  runs JavaScript             |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 7. {"id":2,"result":         |  the computed value          |
       |    {"result":{"value":..}}}  |                              |
       |<-----------------------------|<-----------------------------|
```

Step 1 is an ordinary HTTP request (`GET` means "give me this resource"). Then everything goes through the WebSocket connection. There are only three kinds of messages:

| Kind | Sent by | Contains | Recognizable by |
|---|---|---|---|
| Command | The test | An `id` chosen by the test, a `method` (the name of the command, in the form `Domain.name`) and `params` | The presence of `method` **and** `id` |
| Response | Chrome | The same `id`, then `result` (success) or `error` (failure) | The presence of `id` |
| Event | Chrome | A `method` and `params`, never an `id`: Chrome announces it on its own | `method` **without** `id` |

The `id` lets each response be matched to its command, since several commands can be in flight at the same time. Here are real messages exchanged on the machine used to write this chapter (the `<-` are received by the test, the `->` are sent; the first message is cut over two lines to fit on screen):

```text
-> {"id":101,"method":"Runtime.evaluate",
    "params":{"expression":"document.title","returnByValue":true}}
<- {"id":101,"result":{"result":{"type":"string","value":"Counter"}}}
-> {"id":102,"method":"Foo.bar"}
<- {"id":102,"error":{"code":-32601,"message":"'Foo.bar' wasn't found"}}
<- {"method":"Page.loadEventFired","params":{"timestamp":1283163.132011}}
```

An unknown command therefore produces an `error` response. But beware: a JavaScript expression that raises an error **in the page** does not produce an `error`. The response is a `result` that contains an `exceptionDetails` field (observed with `document.title.size.x`). The bench below checks this field.

The commands used in this chapter:

| Command | Role | Used by |
|---|---|---|
| [`Page.navigate`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Go to an address | `open` |
| [`Page.captureScreenshot`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Photograph the page | `capture` |
| [`Runtime.evaluate`](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/) | Run JavaScript in the page and return its value | `evaluate` |
| [`Input.dispatchMouseEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simulate the mouse (press, release) | `click` |
| [`Input.dispatchKeyEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simulate the keyboard (key pressed, key released) | `typeText`, `pressEnter` |
| [`Emulation.setDeviceMetricsOverride`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) | Impose the page size | `connectPage` |
| `Runtime.enable`, `Page.enable` | Ask to receive the events of these domains | `connectPage` |
| [`Browser.close`](https://chromedevtools.github.io/devtools-protocol/tot/Browser/) | Close the browser | `closeBrowser` |

## The Bench, Piece by Piece

The bench fits in a file `bench.mjs`. The `.mjs` extension tells Node that the file is a **module**: a file that can import tools from another one (`import`) and offer some to others (`export`). The blocks that follow are put together, in order, in this same file. A few JavaScript notations come up again:

| Notation | Meaning | Example from the bench |
|---|---|---|
| `text ${value} text` | A text written between backticks in the code, where `${...}` inserts a value | `Port ${port} is already in use` |
| `object?.property` | Reads the property if the object exists, otherwise gives `undefined` instead of causing an error | `detail.exception?.description` |
| `a ?? b` | Gives `b` if `a` is `undefined` or `null`, otherwise `a` | `detail.exception?.description ?? detail.text` |
| `{ ...object, key: 1 }` | Copies all the properties of an object into a new one | `{ type: "keyUp", ...keyInfo }` |
| `new Map()` | A table that associates a key (here a command number) with a value | `waiters` |
| `new Promise((resolve, reject) => ...)` | Creates a promise that you control yourself: `resolve(value)` succeeds it, `reject(error)` makes it fail | `send` |
| `(x) => x + 1` | An arrow function: a function written in short form | `(t) => t.type === "page"` |

### Imports and the Chrome Path

```javascript
// The "node:" prefix designates a module built into Node (a set of ready-to-use tools)
import { spawn } from "node:child_process";                  // launches another program
import { existsSync } from "node:fs";                        // does the file exist?
import { mkdtemp, rm, writeFile } from "node:fs/promises";   // folders and files
import { tmpdir } from "node:os";                            // the system's temporary folder
import { join } from "node:path";                            // assembles a file path
import net from "node:net";                                  // network connections
import { setTimeout as pause } from "node:timers/promises";  // pause: a promise

export const PORT = 9333;                      // debugging port chosen for this bench
const CHROME = process.env.CHROME_PATH;        // Chrome's path, given by the environment
```

### `waitFor`: Waiting Until a Condition Is True

This function is the most important of the bench: it replaces any fixed pause. It is explained in the section [Waiting for a state instead of sleeping for a fixed delay](#waiting-for-a-state-instead-of-sleeping-for-a-fixed-delay).

```javascript
// Retries condition() until it returns a true value, or fails after the delay
export async function waitFor(condition, description, delay = 5000) {
    const deadline = Date.now() + delay;       // the time (in ms) not to go beyond
    let lastError = null;                      // last error seen, for the final message
    while (Date.now() < deadline) {            // as long as the delay has not run out
        try {
            const value = await condition();   // tests the condition
            if (value) return value;           // true: we return what it found
        } catch (error) {
            lastError = error;                 // not ready yet: we note it and retry
        }
        await pause(50);                       // 50 ms of rest before the next attempt
    }
    // The message says what was expected, and the last error if there was one
    const detail = lastError ? ` (last error: ${lastError.message})` : "";
    throw new Error(`Timed out after ${delay} ms: ${description}${detail}`);  // clean failure
}
```

### `portFree` and `launchBrowser`: Starting Chrome

`portFree` tries to connect to the port: if someone answers, the port is taken. `launchBrowser` checks Chrome's path and the port, creates a new profile folder (`mkdtemp` adds random letters to a starting name so that it is unique), launches Chrome with `spawn` (which starts a program without waiting for its end), then waits until its port answers. For that, `fetch` sends an HTTP request (see [the API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) and returns a promise of the response; `response.ok` is `true` when the server answered successfully. `stdio: "ignore"` means that the messages Chrome writes are discarded. The function returns what is needed to shut everything down.

```javascript
// Returns true if nobody listens on this port of the machine
export function portFree(port) {
    return new Promise((resolve) => {          // a promise: its answer will come later
        const socket = net.connect(port, "127.0.0.1");   // tries to connect to this port
        socket.on("connect", () => {           // connection accepted: the port is taken
            socket.destroy();                  // we close it right away
            resolve(false);                    // answer: the port is not free
        });
        socket.on("error", () => resolve(true));        // refused: nobody is listening
    });
}
```

```javascript
// Launches Chrome without a window, with a new profile, and waits until its port answers
export async function launchBrowser(port = PORT) {
    // Two checks first, to fail with a clear message
    if (!CHROME || !existsSync(CHROME)) throw new Error(`Invalid CHROME_PATH: ${CHROME}`);
    if (!(await portFree(port))) throw new Error(`Port ${port} is already in use`);
    const profile = await mkdtemp(join(tmpdir(), "bench-profile-"));   // new, empty folder
    const child = spawn(CHROME, [              // launches Chrome with the list of options
        "--headless",                          // without a window
        `--remote-debugging-port=${port}`,     // opens the debugging port
        `--user-data-dir=${profile}`,          // disposable profile, never a human's
        "--no-first-run",                      // no first-launch assistant
        "--no-default-browser-check",          // does not offer to become the default browser
        "about:blank",                         // starting page: an empty page
    ], { stdio: "ignore" });                   // ignores the messages Chrome writes
    // Chrome takes a moment to start: we wait until /json/version answers
    await waitFor(async () => {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`);   // question
        return response.ok;                    // true when Chrome answers
    }, "Chrome is not listening on its debugging port", 10000);
    return { child, profile, port };           // what is needed to close it later
}
```

### `connectPage`: Opening the Conversation With the Page

It chooses the target of type `page`, opens the WebSocket connection, then installs three things:

| Element | Role |
|---|---|
| `waiters` | Keeps, for each command `id` sent, the promise waiting for its response |
| `exceptions` | Collects the JavaScript errors raised in the page (`Runtime.exceptionThrown` event), so that the test can see them |
| `send` | Sends a command and returns a promise of its response: `await page.send("Page.navigate", ...)` |

It also sets the page size to 800 × 600 pixels (a **pixel** is the smallest point of a screen): the reason is explained in the section [Capturing an image](#capturing-an-image-to-diagnose-a-failure).

```javascript
// Connects to the open page and returns a "page" object to talk to it
export async function connectPage(port = PORT) {
    const target = await waitFor(async () => {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`);   // list
        const targets = await response.json();   // the JSON text becomes an array of objects
        return targets.find((t) => t.type === "page");   // keeps the page, not the extras
    }, "no page open");
    const ws = new WebSocket(target.webSocketDebuggerUrl);   // opens the WebSocket connection
    await new Promise((resolve, reject) => {   // waits until the connection is established
        ws.addEventListener("open", resolve);  // open: all good
        ws.addEventListener("error", () => reject(new Error("WebSocket connection refused")));
    });
    let lastId = 0;                            // number of the last command sent
    const waiters = new Map();                 // command number -> expected response
    const exceptions = [];                     // JavaScript errors that occurred in the page
    ws.addEventListener("message", (message) => {
        const received = JSON.parse(message.data);   // the received text becomes an object
        if (received.id !== undefined) {       // an "id": it is the response to a command
            const waiter = waiters.get(received.id);   // finds who was waiting for it
            if (!waiter) return;               // command unknown to this bench: ignored
            waiters.delete(received.id);       // this response has arrived: we forget it
            if (received.error) waiter.reject(new Error(received.error.message));   // refused
            else waiter.resolve(received.result);   // otherwise the promise gets the result
        } else if (received.method === "Runtime.exceptionThrown") {   // an error event
            const detail = received.params.exceptionDetails;          // the error's details
            exceptions.push(detail.exception?.description ?? detail.text);   // we keep it
        }
    });
    ws.addEventListener("close", () => {       // connection lost: no more responses
        for (const waiter of waiters.values()) waiter.reject(new Error("connection closed"));
    });
    // Sends a CDP command and returns a promise of its response
    function send(method, params = {}) {
        const id = ++lastId;                   // new number for this command
        return new Promise((resolve, reject) => {
            waiters.set(id, { resolve, reject });   // remembers who waits for the response
            ws.send(JSON.stringify({ id, method, params }));   // sends it
        });
    }
    await send("Runtime.enable");              // asks to receive the error events
    await send("Page.enable");                 // and the page's events
    await send("Emulation.setDeviceMetricsOverride", {   // sets the page size:
        width: 800, height: 600, deviceScaleFactor: 1, mobile: false,   // 800 x 600 pixels
    });                                        // identical screenshots on every machine
    return { send, exceptions, ws };           // the "page" object used by all the tools
}
```

### `evaluate`, `open` and `textOf`: Reading and Loading

`evaluate` runs a piece of JavaScript code in the page and returns its value; `returnByValue` asks for the value itself (without it, Chrome returns a reference to an object of the page), and `awaitPromise` waits for the result of a promise. `open` distinguishes **two kinds of "ready"**: the browser has finished loading the page (`document.readyState` is `"complete"`), and the application has finished starting (the page's `data-ready` marker). Neither replaces the other, as the section on waiting shows. In `textOf`, `JSON.stringify("#value")` returns the text `"#value"`, quotes included: a selector can thus be inserted into code safely, even if it contains quotes itself.

```javascript
// Runs JavaScript code in the page and returns its value (text, number, object...)
export async function evaluate(page, expression) {
    const response = await page.send("Runtime.evaluate", {
        expression,                            // the code to run, as text
        returnByValue: true,                   // returns the value itself
        awaitPromise: true,                    // if it is a promise, waits for its result
    });
    const failure = response.exceptionDetails;   // present if the code raised an error
    if (failure) throw new Error(failure.exception?.description ?? failure.text);   // raised
    return response.result.value;              // the value computed in the page
}

// Opens an address and waits until the page AND the application are ready
export async function open(page, address) {
    const response = await page.send("Page.navigate", { url: address });   // navigates to it
    // An unreachable address raises no CDP error: it returns an error text
    if (response.errorText) throw new Error(`Navigation failed: ${response.errorText}`);
    await waitFor(                             // 1. the browser has finished loading the page
        () => evaluate(page, "document.readyState === 'complete'"),
        "page loading",
    );
    await waitFor(                             // 2. the application has declared itself ready
        () => evaluate(page, "document.body?.dataset.ready === 'yes'"),
        "application startup (data-ready)",
    );
}

// Reads the text of an element (null if it does not exist)
export function textOf(page, selector) {
    const quoted = JSON.stringify(selector);   // protects the quotes of the selector
    // ?. returns undefined if the element is missing; ?? null replaces it with null
    return evaluate(page, `document.querySelector(${quoted})?.textContent ?? null`);
}
```

### `click`, `typeText` and `pressEnter`: Acting Like a Human

To click, coordinates are needed. The functions `findCenter` and `focusField` run **inside the page**: the bench sends them there as text (writing a function into a text template, `${findCenter}`, inserts its source code). They scroll the page to the element if needed, then return the center of its rectangle or give the focus to the field. **Focus** is the fact that an element receives the keyboard strokes. Each action first waits for the element to exist, thanks to `waitFor`.

The mouse sends two events (press, then release), like a real click. The keyboard sends `keyDown` (the key goes down, with the text it produces) then `keyUp` (it comes back up). `field.select()` selects the text already present: the next keystroke replaces it, as a human who selects and then types would.

```javascript
// Function run INSIDE the page: scrolls to the element and returns its center
function findCenter(selector) {
    const element = document.querySelector(selector);   // looks for the element
    if (!element) return null;                 // not found: the wait will retry
    element.scrollIntoView({ block: "center" });         // makes it visible on screen
    const box = element.getBoundingClientRect();         // rectangle of the element
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };   // its center
}

// Simulates a mouse click at the center of an element
export async function click(page, selector) {
    const call = `(${findCenter})(${JSON.stringify(selector)})`;   // text of the code
    const { x, y } = await waitFor(() => evaluate(page, call), `element ${selector}`);
    for (const type of ["mousePressed", "mouseReleased"]) {   // press, then release
        await page.send("Input.dispatchMouseEvent", {
            type, x, y, button: "left", clickCount: 1,   // left button, a single click
        });
    }
}

// Function run INSIDE the page: puts the cursor in a field and selects its text
function focusField(selector) {
    const field = document.querySelector(selector);      // looks for the field
    if (!field) return false;                  // not found: the wait will retry
    field.focus();                             // gives it the focus: it receives the keyboard
    field.select();                            // selects the text: typing replaces it
    return true;                               // found: the wait stops
}

// Types a text into a field, one key after another
export async function typeText(page, selector, text) {
    const call = `(${focusField})(${JSON.stringify(selector)})`;   // text of the code
    await waitFor(() => evaluate(page, call), `field ${selector}`);   // sets the focus
    for (const letter of text) {               // one letter at a time
        const keyInfo = { key: letter };       // the letter pressed
        const press = { type: "keyDown", text: letter, ...keyInfo };   // press + text
        await page.send("Input.dispatchKeyEvent", press);              // the key goes down
        await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...keyInfo });  // comes up
    }
}

// Presses the Enter key (press, then release)
export async function pressEnter(page) {
    const keyInfo = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 };   // the key
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", ...keyInfo });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...keyInfo });   // releases it
}
```

### `capture`: Photographing the Page

`Page.captureScreenshot` returns the image as text in **base64** (a way of writing bytes with only letters, digits, `+` and `/`, see [Base64 on MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64)). `Buffer.from(text, "base64")` converts it back into bytes (a sequence of numbers from 0 to 255, the form in which a file is stored), which is written to a **PNG** file (a lossless image format).

```javascript
// Takes a picture of the page and saves it to a PNG file
export async function capture(page, file) {
    const { data } = await page.send("Page.captureScreenshot", { format: "png" });   // PNG
    await writeFile(file, Buffer.from(data, "base64"));   // decodes the text into bytes
    return file;                               // returns the path, handy to display it
}
```

### `closeBrowser`: Tidying Everything Up

This function asks Chrome to close politely, waits, forces the stop if needed, then deletes the profile folder. Its limits are explained in the section [Closing Chrome properly](#closing-chrome-properly).

```javascript
// Closes Chrome properly, or by force otherwise, then deletes the temporary profile
export async function closeBrowser(browser, page) {
    const { child, profile, port } = browser;  // what launchBrowser returned
    const exited = new Promise((resolve) => child.once("exit", resolve));   // true at stop
    page?.ws.close();                          // first closes the connection to the page
    try {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`);   // question
        const info = await response.json();    // contains the connection address
        const ws = new WebSocket(info.webSocketDebuggerUrl);   // "browser" connection
        ws.addEventListener("open", () => {    // connection open: asks for a polite stop
            ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));   // the command
        });
    } catch {
        child.kill();                          // Chrome no longer answers: forced stop
    }
    // Race between Chrome's stop and a 10 s delay; ref: false: this delay
    // does not keep Node from ending
    const maxDelay = pause(10000, "too late", { ref: false });
    if ((await Promise.race([exited, maxDelay])) === "too late") child.kill();
    await exited;                              // we only continue once Chrome has stopped
    // Deletes the profile: several tries, as Chrome releases its files late
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
```

## Reading the Page and Writing Assertions

An **assertion** is a check that fails (by raising an error) when a value is not the expected one. Node provides `node:assert` ([official documentation](https://nodejs.org/api/assert.html)); the `node:assert/strict` version compares strictly: `"1"` (a text) is not equal to `1` (a number). `assert.equal(actual, expected)` compares two values, and `assert.deepEqual` compares the content of two arrays or objects.

Any reading of the page goes through `evaluate`: we write the JavaScript of the [DOM](/?c=langages&s=javascript&p=dom-et-evenements) that we would type into the browser's **console** (the developer tools tab, F12 key, where JavaScript is run by hand). Here is what the test page gives, after typing `5` in the field and clicking "Add" (observed values):

| What we want to know | Expression passed to `evaluate` | Value read |
|---|---|---|
| The text of an element | `document.querySelector("#value").textContent` | `"5"` |
| What a field contains | `document.querySelector("#step").value` | `"5"` |
| The value of an attribute | `document.querySelector("#status").getAttribute("role")` | `"status"` |
| Does an element exist? | `document.querySelector("[data-testid='value']") !== null` | `true` |
| Is an element absent? | `document.querySelector("#absent") === null` | `true` |
| Does an element take up space? | `document.querySelector("#add").getBoundingClientRect().width > 0` | `true` |
| A computed style | `getComputedStyle(document.querySelector("h1")).fontSize` | `"32px"` |
| The number of elements | `document.querySelectorAll("button").length` | `3` |
| The page title | `document.title` | `"Counter"` |
| A `data-` attribute | `document.body.dataset.ready` | `"yes"` |
| The element that has the focus | `document.activeElement.id` | `"add"` |
| The type of address | `location.protocol` | `"file:"` |

To **designate** the element to read or click, several selectors are possible:

| Selector | Notation | Preferred? |
|---|---|---|
| By identifier | `#add` | Yes, if the `id` is stable and unique |
| By attribute dedicated to tests | `[data-testid="value"]` | Yes: independent of the text and of the layout |
| By class | `.primary-button` | Caution: classes serve the styling and often change |
| By displayed text or position | "the third button" | No: the slightest change of text breaks the test, see [end-to-end tests](/?c=tests&p=tests-end-to-end) |

The bench also detects the **JavaScript errors of the page**: on the machine used to write this chapter, `setTimeout(() => { throw new Error('boom'); }, 0)` run in the page filled `page.exceptions` with `["Error: boom\n    at <anonymous>:1:26"]`. Without this, a page can display the right numbers while hiding an error that nobody sees.

## Waiting for a State Instead of Sleeping for a Fixed Delay

The beginner's reflex is the **fixed pause** ("wait 2 seconds and hope that is enough"). It is either too short (the test fails for no valid reason: it is a **flaky** test, an unstable test that sometimes passes and sometimes fails, see [unit tests](/?c=tests&p=tests-unitaires)), or too long (the whole suite slows down). The alternative is to wait for the desired **state**, with a safety ceiling: see also [Waiting without wasting time](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts). The following script compares the strategies on the test page.

```javascript
import { setTimeout as pause } from "node:timers/promises";  // pause: a promise
import {
    waitFor, click, connectPage, evaluate,
    closeBrowser, launchBrowser, open, textOf,
} from "./bench.mjs";                                         // our tools

const ADDRESS = new URL("./counter.html", import.meta.url).href;   // the page to test
const browser = await launchBrowser();                       // Chrome starts
const page = await connectPage();                            // we connect to it

try {
    // Case 1: click as soon as the browser says "page loaded",
    // without waiting for the application
    await page.send("Page.navigate", { url: ADDRESS });      // loads the page
    await waitFor(() => evaluate(page, "document.readyState === 'complete'"), "loading");
    await click(page, "#add");                 // the buttons are not yet connected
    console.log("1. click too early          :", await textOf(page, "#value"));

    // Case 2: a fixed pause that is too short, then too long, then waiting for a state
    for (const delay of [100, 2000, "state"]) {
        await open(page, ADDRESS);             // fresh page, application ready
        await click(page, "#save");            // the simulated server answers after 400 ms
        const start = Date.now();              // start time of the wait
        if (delay === "state") {
            await waitFor(                     // waits for the final text, not for a duration
                // startsWith: does the text start with "Saved"?
                async () => (await textOf(page, "#status")).startsWith("Saved"),
                "confirmation",
            );
        } else {
            await pause(delay);                // fixed-duration pause
        }
        const read = await textOf(page, "#status");           // what the page displays then
        const duration = Date.now() - start;   // time actually spent waiting
        const label = String(delay).padEnd(5); // padEnd: fills up with spaces
        console.log(`2. wait ${label} : ${duration} ms ->`, read);
    }
} finally {
    await closeBrowser(browser, page);         // closes Chrome whatever happens
}
```

Observed result on the machine used to write this chapter (the first of three runs; the following table gives the spread of the three):

```text
1. click too early          : 0
2. wait 100   : 111 ms -> Saving...
2. wait 2000  : 2010 ms -> Saved: 0
2. wait state : 434 ms -> Saved: 0
```

| Strategy | Time actually waited | What the test reads | Verdict |
|---|---|---|---|
| Click as soon as the page is "complete", without waiting for the application | 0 ms | `0`: the click is lost, the buttons are not yet connected | Failure (observed 3 times out of 3 here; on an application whose slowness varies, the failure becomes intermittent) |
| Fixed pause of 100 ms | 111 to 122 ms | `Saving...` | Failure: too short |
| Fixed pause of 2000 ms | 2006 to 2015 ms | `Saved: 0` | Correct, but more than four times slower than necessary |
| Waiting for the state (`waitFor`) | 434 to 449 ms | `Saved: 0` | Correct, and as fast as the page allows |

The value read is `Saved: 0` and not `Saved: 1`, because this script never clicks on "Add": the total stays at `0`.

Three rules follow:

| Rule | Why |
|---|---|
| Wait for the **result** you want to read (a text, an element), never for a time | The duration varies from one machine and one day to another; the result does not |
| Distinguish "page loaded" from "application ready" | The browser announces the first one only; the second one is up to the application to signal (`data-ready`) |
| Always set a ceiling, with a message that says what was expected | Without a ceiling, a blocked test never ends; without a message, we do not know why it failed |

For example, `click(page, "#missing")` failed after 5048 ms with the message `Timed out after 5000 ms: element #missing`.

## Writing and Running the Tests

Each test starts again from the original page (`open` at the beginning of `test`): the order of the tests then does not matter, and a test cannot disturb another one. A failing test must not stop the next ones: we note the failure, take a screenshot, and carry on. At the end, the program returns an **exit code**: the number a program returns when it ends. `0` means "all is well", any other value signals a failure. Save this code under the name `tests.mjs`, in the same folder as `bench.mjs` and `counter.html`.

```javascript
import assert from "node:assert/strict";                     // comparisons that fail
import { mkdir } from "node:fs/promises";                    // folder creation
import { join } from "node:path";                            // assembles a file path
import { fileURLToPath } from "node:url";                    // file:// address to path
import {
    capture, click, closeBrowser, connectPage, launchBrowser,
    open, pressEnter, textOf, typeText, waitFor,
} from "./bench.mjs";                                        // our tools

// file:// address of the page to test, located next to this file
// (import.meta.url is the address of the current file; URL computes a relative address)
const ADDRESS = new URL("./counter.html", import.meta.url).href;
const IMAGE_FOLDER = fileURLToPath(new URL("./images/", import.meta.url));   // screenshots
await mkdir(IMAGE_FOLDER, { recursive: true });              // creates the screenshot folder

const browser = await launchBrowser();                       // Chrome starts (no window)
const page = await connectPage();                            // we connect to its page
const failures = [];                                         // names of the tests that failed

// Runs a test on a new page, with a screenshot if it fails
async function test(name, body) {
    const start = Date.now();                  // start time, to measure the duration
    try {
        await open(page, ADDRESS);             // each test restarts from the original page
        await body();                          // the test itself
        // A JavaScript error in the page makes the test fail, even if the rest is fine
        // (splice(0) empties the list of page errors and returns its content)
        assert.deepEqual(page.exceptions.splice(0), [], "JavaScript error in the page");
        console.log(`  ok     ${name} (${Date.now() - start} ms)`);   // passed, with time
    } catch (error) {
        failures.push(name);                   // we keep the name of the failing test
        const image = join(IMAGE_FOLDER, `failure-${failures.length}.png`);   // image file
        await capture(page, image).catch(() => {});          // catch: ignores a failure here
        console.log(`  FAIL   ${name}\n         ${error.message}\n         image: ${image}`);
    }
}

try {
    console.log("Tests of counter.html");        // title of the series
    await test("the counter starts at 0", async () => {
        assert.equal(await textOf(page, "#value"), "0");   // reads the counter display
    });
    await test("a click on Add increases the counter by 1", async () => {
        await click(page, "#add");             // mouse click on the button
        assert.equal(await textOf(page, "#value"), "1");   // one click: the counter is at 1
    });
    await test("the step typed on the keyboard is used", async () => {
        await typeText(page, "#step", "5");    // replaces the "1" in the field with "5"
        await click(page, "#add");             // first click: 0 + 5
        await click(page, "#add");             // second click: 5 + 5
        assert.equal(await textOf(page, "#value"), "10");  // two clicks of 5 make 10
    });
    await test("the Enter key in the step field also adds", async () => {
        await typeText(page, "#step", "2");    // the step becomes 2
        await pressEnter(page);                // Enter key in the field
        assert.equal(await textOf(page, "#value"), "2");   // without a click: 0 + 2
    });
    await test("Reset clears the total", async () => {
        await click(page, "#add");             // total: 1
        await click(page, "#add");             // total: 2
        await click(page, "#reset");           // back to 0
        assert.equal(await textOf(page, "#value"), "0");   // the counter is at 0
    });
    await test("Save confirms after a short delay", async () => {
        await click(page, "#add");             // total: 1
        await click(page, "#save");            // starts the save (400 ms)
        // We wait for the desired state: the confirmation text, not a number of seconds
        await waitFor(
            async () => (await textOf(page, "#status")) === "Saved: 1",   // the text
            "the status 'Saved: 1'",           // what the error will say if we wait in vain
        );
    });
} finally {
    await closeBrowser(browser, page);         // closes Chrome, even after an error
}

// The tally, then the exit code read by a script or by a continuous integration server
console.log(failures.length ? `${failures.length} test(s) failed.` : "All tests passed.");
process.exitCode = failures.length === 0 ? 0 : 1;            // exit code: 0 = success
```

A continuous integration server reads only this code to decide whether the tests passed. Run the checks, then the tests:

```bash
# node --check reads the file and checks its syntax, without running anything
node --check bench.mjs
node --check tests.mjs
# runs the test series (CHROME_PATH must be defined in this terminal)
node tests.mjs
# displays the exit code of the last program (in PowerShell: $LASTEXITCODE)
echo $?
```

Observed output on the machine used to write this chapter (29/10/2026):

```text
Tests of counter.html
  ok     the counter starts at 0 (373 ms)
  ok     a click on Add increases the counter by 1 (356 ms)
  ok     the step typed on the keyboard is used (343 ms)
  ok     the Enter key in the step field also adds (335 ms)
  ok     Reset clears the total (347 ms)
  ok     Save confirms after a short delay (760 ms)
All tests passed.
```

The exit code was `0`. The same series was also run under PowerShell (`$env:CHROME_PATH = ...` then `node tests.mjs`) with the same result.

A test that can never fail proves nothing, so we check that the series **can** fail. Let's break the page on purpose, by replacing the line `total += Number(step.value) || 0;` in `counter.html` with a version that adds 1 too many:

```javascript
// Broken version of the add function: each addition counts 1 too many
total += (Number(step.value) || 0) + 1;
```

## Capturing an Image to Diagnose a Failure

Here is what the series returned on the broken page (observed; the image path is shortened, and the message, in English, is provided by Node: `Expected values to be strictly equal` means "the values should be strictly equal"):

```text
Tests of counter.html
  ok     the counter starts at 0 (389 ms)
  FAIL   a click on Add increases the counter by 1
         Expected values to be strictly equal:

'2' !== '1'

         image: ...\images\failure-1.png
  FAIL   the step typed on the keyboard is used
         Expected values to be strictly equal:

'12' !== '10'

         image: ...\images\failure-2.png
  FAIL   the Enter key in the step field also adds
         Expected values to be strictly equal:

'3' !== '2'

         image: ...\images\failure-3.png
  ok     Reset clears the total (345 ms)
  FAIL   Save confirms after a short delay
         Timed out after 5000 ms: the status 'Saved: 1'
         image: ...\images\failure-4.png
4 test(s) failed.
```

The exit code was `1`. Three lessons:

| Observation | Explanation |
|---|---|
| Four tests out of six fail | Each one reads a wrong total: `2` instead of `1`, `12` instead of `10`, `3` instead of `2`, and the text `Saved: 1` never arrives |
| "Reset" passes despite the programming error (the **bug**) | This test only checks the return to `0`, which the overly generous addition does not change: a test can be green and still let a defect through, hence the value of having several |
| The last message is clear | Thanks to the message from `waitFor`, we read **what was expected**, not a simple "failure" |

A screenshot shows the state of the page **at the moment of the failure**. That of the first test shows "Value: 2" above the "Step: 1" field and the three buttons, on a white background (the file is 800 × 600 pixels, about 8.6 KB, dimensions read from its header): we see at a glance that the display is faithful to the value read, and that it is the calculation that is wrong, since a single addition with a step of 1 should give 1. On a continuous integration server, where nobody looks, the screenshot is the only visual trace: the service can keep it as an **artifact** (a file produced by the run and kept afterwards).

The size deserves a precaution. With the option `--window-size=800,600`, the capture measured 782 × 470 pixels on the machine used to write this chapter: this option sets the window (frame included), not the page. The command `Emulation.setDeviceMetricsOverride`, used by `connectPage`, sets the size of the **page**: it is that command which gave 800 × 600.

Remember to exclude the `images/` folder from the repository with [a `.gitignore` file](/?c=qualite-performance-et-outils&s=git&p=gitignore): the screenshots are not versioned (the **repository** is the folder whose changes Git tracks).

## Closing Chrome Properly

Chrome is a separate program: if it stays open after the test, it occupies the port, memory and a profile folder. `closeBrowser` follows three steps: the `Browser.close` command (polite stop), a 10-second delay, then `child.kill()` (forced stop by the PID of this Chrome), before deleting the profile. It is called from a `finally` block, which runs whether the tests succeeded, failed or crashed.

What was observed on the machine used to write this chapter (29/10/2026):

| Situation | Observed |
|---|---|
| Polite stop (`Browser.close`), common case | Chrome stops less than 3 seconds after the command (about thirty tries) |
| Polite stop, slow case | 6 times out of about fifty runs, Chrome was only stopped 25 to 29 seconds after its launch (instead of 2 to 4), with no established cause: it closed its child processes one by one |
| `child.kill()` on a running Chrome | Chrome disappears in 0.1 to 0.4 s |
| `child.kill()` during an already slow polite stop | Did not shorten the wait (observed 3 times, with delays of 5 to 8 seconds before the `kill()`): plan a generous overall delay for the tests |
| Node program that crashes or ends without closing Chrome | On Windows, Chrome stopped with it (observed 3 times). On Linux and macOS, the behavior was not verified here: do not count on it |
| Program that forgets to close Chrome without crashing | Node never ends; launched with the `timeout` command (which stops a program after a given duration, see [a script that stops cleanly](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) set to 15 seconds, it was forcibly stopped (exit code 124) |
| Profile folder after a crash | It stays on disk (about 10 MB each): they pile up |

A `kill()` only stops Chrome's **main** process. Its child processes (one per tab, one for the network, and so on) stop on their own just after: on the machine used to write this chapter, a few were still there one second later, and none three seconds later. On Windows, the command `taskkill /pid <number> /t /f` ([Microsoft documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill)) stops a process **and** all its descendants (`/t`) by force (`/f`), always from its exact PID (verified here on the bench's Chrome), never from its name: stopping "all the `chrome.exe`" would also close the user's personal browser.

## Playwright, Puppeteer or a Homemade Bench

Libraries exist for this work: [Playwright](https://playwright.dev/docs/intro) and [Puppeteer](https://pptr.dev/). A **library** is a set of code written by others, which you install and call from your program. They rely on the same ideas as the bench in this chapter (a browser driven through a protocol), and add everything that makes the work comfortable.

| Criterion | Homemade bench (this chapter) | Puppeteer | Playwright |
|---|---|---|---|
| Installation | Nothing (Node and Chrome are enough) | A package (and a browser, depending on its documentation) | A package and the browsers it downloads |
| Browsers driven | Chrome | Chrome first | Several browser families, depending on its documentation |
| Automatic waits before a click | To write (`waitFor`) | Partial, depending on the documentation | Built in, depending on the documentation |
| Test runner, reports, traces | To write | To add | Provided, depending on the documentation |
| Maintenance of the driving code | Your responsibility | Its authors | Its authors |
| Main interest | Understanding; zero dependency | Chrome scripts (screenshots, PDF) | Test suites for a team |

The cells "depending on the documentation" indicate functions to check in the linked official documentation, which evolves.

| Situation | Advised choice |
|---|---|
| Learning what happens under the hood | The homemade bench |
| One or two scenarios on a page you control, without being able to install a package | The homemade bench |
| A test suite that grows, several developers, several browsers | Playwright |
| An isolated script that drives Chrome (screenshots, PDF generation) | Puppeteer |
| Pages you do not control | A maintained library **and** the chapter on [attacks on automated browsers](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Chrome stays open after the test | It keeps the port and the memory. On Windows, Chrome stopped with Node during the trials; elsewhere, the behavior was not verified. Always close it in a `finally`, see [Closing Chrome properly](#closing-chrome-properly) |
| Port already taken | Observed: launched on an already occupied port, Chrome starts anyway, reports `bind() returned an error` in its log, then listens at the address `[::1]` (the IPv6 writing of the machine itself, see [IP addresses](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) while the test connects to `127.0.0.1`, thus to the other program. The bench checks the port with `portFree` before launching |
| Profile shared between two Chromes | Observed: a second Chrome launched with the same profile folder returns in 0.24 s and leaves the first one running, with its own options. A new profile for each launch |
| The user's default profile | It contains their passwords, cookies and extensions: a test must never use it. Always `--user-data-dir` pointing to a disposable folder |
| Temporary profiles piling up | After a crash, the folder remains (about 10 MB observed). Clean them up regularly |
| Taking the first target of `/json/list` | The list also contains Chrome's internal pages: filter on `type === "page"` |
| Fixed pause instead of a wait | Too short: random failure; too long: slow suite. Wait for a state, see [the dedicated section](#waiting-for-a-state-instead-of-sleeping-for-a-fixed-delay) |
| Page loaded but application not ready | Observed: a click sent as soon as `readyState` is `"complete"` is lost (the counter stays at `0`). Use a `data-ready` marker set by the application |
| Page size not fixed | The captures differ from one machine to another; observed: `--window-size=800,600` gave 782 × 470. Use `Emulation.setDeviceMetricsOverride` |
| A silent JavaScript error in the page | It fails no read assertion. Collect `Runtime.exceptionThrown`, as the bench does |
| An exception in `Runtime.evaluate` that nobody looks at | The response is not an `error` but a `result` with `exceptionDetails`: it must be tested, as `evaluate` does |
| Fragile selector (text, position) | The slightest change of text breaks the test, see [end-to-end tests](/?c=tests&p=tests-end-to-end) |
| Tests that depend on each other | A cascade of failures hides the cause. Each test reopens the original page |
| A debugging port open to others | Whoever connects to it controls the whole browser. The port is only useful to the local machine: do not redirect it to the outside (see [SSH tunnels and port forwarding](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)) |
| `--no-sandbox` in a **container** (an isolated environment, see [Docker: basic concepts](/?c=infrastructure-devops&s=docker&p=concepts-de-base)) | See the paragraph below |
| Driving pages you do not control | A hostile page runs with the capabilities of a real browser: see [attacking and defending an automated browser](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

**The sandbox.** Chrome confines each tab in a restricted environment, the **sandbox** (a sealed-off area): if a malicious page exploits a flaw, it cannot touch the rest of the computer. In some containers, Chrome cannot set it up and refuses to start. The `--no-sandbox` option removes the obstacle, but it **disables this protection**: the code of the page then runs with all the rights of the program. Reserve it for pages you wrote yourself, in a disposable container and without any secret. It is better to configure the container (non-privileged user, see [Docker: best practices and security](/?c=infrastructure-devops&s=docker&p=bonnes-pratiques-et-securite)) than to remove the protection. This option could not be tried while writing (no container on the machine).

## Best practices

| Best practice | Why |
|---|---|
| A new profile for each launch, deleted at the end | No trace of one test on the next, no risk to the user's profile |
| Check Chrome's path and the availability of the port before launching | A clear message is worth more than a mysterious timeout |
| Close Chrome in a `finally` | The browser is closed even if a test crashes |
| Wait for a state with a ceiling and a message | A fast test when all goes well, a clear diagnosis when all goes wrong |
| Have the application declare that it is ready (`data-ready`) | We stop guessing the right moment |
| Designate elements by `id` or `data-testid` | The tests survive changes of text and layout |
| Fix the page size | Captures that are comparable from one machine to another |
| Start from a new page for each test | Independent tests, in any order |
| Collect the JavaScript errors of the page | A page that displays correctly but crashes silently is detected |
| Capture an image at each failure, keep it as an artifact | See the state of the page without being able to replay it |
| Make the series fail on purpose once | Check that the tests can detect a bug |
| Return a non-zero exit code on failure | Continuous integration reads this code to decide |
| Limit the browser tests to critical journeys | They are slower than unit tests, see [the test pyramid](/?c=tests&p=pyramide-de-test) |
| Switch to Playwright when the suite grows | Automatic waits, reports and traces avoid writing them yourself |

## Key Takeaways

| | |
|---|---|
| **Key point** | A headless browser is a real browser that you drive without a screen: it suits continuous integration servers. Chrome opens a debugging port; the test talks to the browser through the Chrome DevTools Protocol, JSON messages exchanged over a WebSocket connection: commands (with an `id`), responses (same `id`) and events (without `id`). A minimal bench fits in about 220 lines of Node: launch Chrome with a new profile, choose the target of type `page`, send `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` and `Page.captureScreenshot`, then close. We wait for a state (never a duration), we check with assertions, and we take a screenshot at each failure. |
| **Pitfalls to avoid** | An orphan Chrome or one never closed; a port already taken (Chrome may then listen somewhere other than where the test connects); a shared profile or the user's profile; the first target of `/json/list` taken without filtering; a fixed pause; a page loaded but an application not ready; a page size not fixed; a silent JavaScript error; `--no-sandbox` outside a disposable container; fragile selectors. |
| **Best practices** | A new profile for each launch and a `finally` that closes Chrome; check the path and the port before launching; wait for the desired state with a ceiling and a message; the `data-ready` marker; `id` or `data-testid`; a fixed page size; a new page for each test; a screenshot at each failure; a non-zero exit code on failure; check that the series can fail; Playwright as soon as the suite grows. |
