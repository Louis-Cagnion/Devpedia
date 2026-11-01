---
order: 13
---

# Deferred Loading and Placeholders (31/10/2026)

A **web page** is a document that the **browser** (the program that displays pages) receives from a **server** (a computer that answers the browser's requests) and displays; the exchange is described in [HTTP request and response](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). It is rarely made in one piece: it is made of **blocks**, self-contained pieces (a menu, an article, a cart, a message "Hello Jean"). Most are identical for all visitors; a few are **slow** to compute or **specific to the person** looking at the page. This chapter explains how to display right away what is ready, without waiting for those blocks, then to put them in place as soon as they are computed.

It relies on these exchanges and on the idea of [not recomputing what has not changed](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant). The examples that are run use [Node.js](https://nodejs.org/api/http.html), launched from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). A content management system, [Drupal](https://www.drupal.org/) (a software written in [PHP](/?c=langages&s=php&p=php) for building and running a website), serves as an example at the end of the chapter: it is only an illustration, the idea holds for any website.

| Section | Question addressed |
|---|---|
| [The problem](#the-problem-one-slow-block-holds-up-the-whole-page) | Why one slow or personal block slows down the whole page |
| [The idea](#the-idea-a-placeholder-filled-in-later) | Render first, fill in later |
| [Three ways to deliver](#three-ways-to-deliver-the-deferred-block) | Synchronous, streamed, or through a second request |
| [The experiment](#the-experiment-a-small-server-that-measures) | Measure the gain with a real server |
| [The shift](#the-trap-of-layout-shift) | Reserve the size of the space |
| [Accessibility](#accessibility-announcing-what-arrives) | Announce the content that is coming |
| [The block as a plugin](#the-block-as-a-plugin) | Where to put the code of a block |
| [A Drupal example](#an-example-in-drupal-lazy-builder-and-bigpipe) | The mechanism in real software |

## The problem: one slow block holds up the whole page

Take an online shop. Its home page is made of four blocks:

```
+-------------------------------------------------+
|  Menu                  (same for everyone)      |
+-------------------------------------------------+
|  Featured articles     (same for everyone)      |
+-------------------------------------------------+
|  Hello Jean, 3 items in the cart                |   <- specific to Jean, slow
+-------------------------------------------------+
|  Footer                (same for everyone)      |
+-------------------------------------------------+
```

| Block | Same content for everyone? | Computing cost | Can be cached? |
|---|---|---|---|
| Menu | Yes | Low | Yes |
| Featured articles | Yes | Medium (queries to the [database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) | Yes |
| Cart and "Hello Jean" | No, depends on the visitor | High (database, logged-in account) | Only for Jean |
| Footer | Yes | Low | Yes |

A **cache** is a copy of an already computed result, kept to be reused without doing the computation again (see [avoiding redundant recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). A copy can only be reused if the result is the same for whoever asks for it. A **shared** cache (for example that of a [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), a network of servers that keep copies close to the visitors) serves the same copy to everyone.

One single personal block is enough to spoil the whole page:

| Developer's choice | Consequence |
|---|---|
| Whole page in a shared cache | Marie would see "Hello Jean": a serious mistake (leak of personal data) |
| Whole page without cache | Every visit also recomputes the menu and the articles, which have not changed |
| One copy of the page per visitor | As many copies as visitors, almost never reused: the cache is useless |
| Page waiting for the slow block | The visitor looks at a blank page for the whole computation of the cart |

The last case is the most visible: the time before the visitor sees anything equals the time of the **slowest** block, while the others were ready long before.

## The idea: a placeholder filled in later

A **placeholder** is an empty spot, or one filled with provisional text, left in place of a block that is not computed yet. The server works in two steps:

1. It sends the page right away, with the placeholder in place of the slow block.
2. It computes the block, then makes it arrive to replace the placeholder.

**Lazy loading** is this postponing of a block's computation: it is done **after** the rest has been sent, not before. Do not confuse it with the `loading="lazy"` attribute of images, which only delays the download of an image until it is visible (see [links and images](/?c=langages&s=html&p=liens-et-images)): here, it is the **computation of a block by the server** that is deferred.

```
Without deferral (synchronous)
  time ->  0 ms                                  800 ms
           |------ computing the cart -------------|
                                                    | sends the whole page
           blank page for 800 ms ------------------>  everything appears at once

With deferral
  time ->  0 ms   1 ms                           800 ms
           |      | sends the page + placeholder
           |      | the visitor already reads the menu and the articles
           |------ computing the cart -------------|
                                                    | the cart replaces the placeholder
```

This separation has a second consequence, even more important for the cache: the **skeleton** page (menu, articles, placeholder) is the **same for everyone**, so it can be kept in cache. The personal part is computed separately, for each visitor, and only it needs to be redone.

| Part | Content | Cacheable? | Who computes it |
|---|---|---|---|
| Skeleton | Menu, articles, placeholder | Yes, for everyone | Once, then copied |
| Fragment | "Hello Jean, 3 items" | No (or per visitor) | On each visit, on the only block concerned |

## Three ways to deliver the deferred block

The fragment can arrive in three ways. They differ in when the slow computation starts and in the number of HTTP requests.

| | Synchronous (without deferral) | Deferred by streaming | Deferred by a second request |
|---|---|---|---|
| Principle | Everything is computed, then everything is sent | Page and placeholder sent, fragment sent later **in the same response** | Page and placeholder sent, the browser asks for the fragment with **another request** |
| Number of requests | 1 | 1 | 2 |
| Start of the slow computation | Before the sending | While the browser displays the rest | Only when the second request arrives |
| First display | After the whole computation | Immediate | Immediate |
| Complete fragment visible | At the end of the computation | At the end of the computation | At the end of the computation, plus a network round trip |
| Skeleton cacheable in HTTP? | No | No (the response contains the personal fragment) | Yes, the bytes are identical for everyone |
| JavaScript needed? | No | Yes, to place the fragment | Yes, to request and place the fragment |
| Tricky network setting | None | An intermediary that keeps the response in memory (a buffer) until the end cancels the gain | One more request to handle |

**Streaming** consists in sending an HTTP response **in chunks**, without waiting for it to be complete: the headers and the first chunk leave right away, the next ones leave when they are ready. The **headers** are lines of information sent before the content of the response (type of content, date...). HTTP can do this with a `Transfer-Encoding: chunked` header ("chunked transfer"): the total size is not announced in advance. A related case, in a PHP script, is described in [progressive HTTP streaming](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant#progressive-http-streaming-when-the-computation-is-unavoidable); here, it serves another purpose: delivering in two stages a page of which one part is slow.

In streaming, the skeleton is not cacheable **at the HTTP level** (the complete response contains the personal fragment), but the application can keep the skeleton in cache **on its own side** (in memory, on the server) and compute only the fragment. With the second request, the first response is identical for everyone: a shared cache can keep it as it is.

## The experiment: a small server that measures

Nothing beats a measurement. This Node.js server (the engine that runs JavaScript outside the browser, see [the local development server](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)) offers the three modes on three addresses: `/sync`, `/stream` and `/request`. The "slow computation" is simulated by a pause of 800 milliseconds. Save the code below in a file named `server-deferred.mjs` (the `.mjs` extension tells Node that the file uses `import`), in a folder of your choice.

A few notations of the code, defined here before reading it:

| Notation | Meaning | To learn more |
|---|---|---|
| `async` and `await` | Wait for a result without blocking the program | [asynchronous programming](/?c=langages&s=javascript&p=asynchrone) |
| `new Promise(...)` | A promise: a value that is not yet there, but will arrive later | [Promises](/?c=langages&s=javascript&p=asynchrone) |
| `(x) => ...` | Arrow function, a function written in short form | [functions](/?c=langages&s=javascript&p=fonctions) |
| `/.../` | Regular expression, a text pattern to find | [regular expressions](/?c=langages&s=javascript&p=regex) |
| `process.env.PORT` | Value of the environment variable `PORT`, set at launch | [environment variables](/?c=langages&s=bash&p=variables-denvironnement) |
| `?.` and `??` | If the data is missing, do nothing (`?.`) or take a fallback value (`??`) | [conditions](/?c=langages&s=javascript&p=conditions) |
| `` `...${x}...` `` | Text in which `${x}` is replaced by the value of `x` | [strings](/?c=langages&s=javascript&p=strings) |

In the code, `req` is the request received (`req.url` is the address requested) and `res` the response to send. The HTML used is described in [the structure of a document](/?c=langages&s=html&p=structure-dun-document): `<div>` is a block of the page, `id` its name, `style` the appearance settings.

```js
import { createServer } from 'node:http';         // HTTP module provided by Node

const PORT = Number(process.env.PORT);            // listening port, converted to a number
const DELAY_MS = 800;                             // duration of the simulated slow step
// charset=utf-8: character encoding, which makes it possible to write accents
const TYPE = { 'content-type': 'text/html; charset=utf-8' }; // the response is HTML
const WAITING = 'Loading the cart…';              // provisional text of the placeholder

// Pause of `ms` milliseconds: a promise that ends after this delay
// (setTimeout calls the function `end` once the delay has elapsed)
const wait = (ms) => new Promise((end) => setTimeout(end, ms));
// Replaces < > & " ' with their HTML code (&#60; for <), so that the browser
// never takes a name for HTML (charCodeAt(0): number of the character)
const escapeHtml = (t) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// The slow block specific to the user: returns plain text, without HTML
async function computeCart(name) {
  await wait(DELAY_MS);                           // simulates a slow database
  return `Hello ${name}, 3 items in the cart`;    // specific to this person
}

// Reads the name in the "user" cookie: `exec` looks for the pattern, `[1]` takes
// the text between parentheses; "visitor" if there is no cookie
const nameOf = (req) =>
  /user=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? 'visitor';

const top = '<h1>Shop</h1><p>Same content for everyone.</p>'; // common part

// The place of the slow block. min-height:2em reserves a height of at least twice
// the size of the text; aria-live="polite" makes screen readers announce the change
const zone = (content) =>
  `<div id="cart" style="min-height:2em" aria-live="polite">${content}</div>`;

createServer(async (req, res) => {                // called for each request received
  const name = nameOf(req);                       // who is asking for the page
  if (req.url === '/sync') {                      // mode 1: all is computed before sending
    const cart = await computeCart(name);         // the whole page waits for this computation
    // here the text is inserted into HTML: it must be escaped
    res.writeHead(200, TYPE).end(top + zone(escapeHtml(cart))); // sent after 800 ms
  } else if (req.url === '/stream') {             // mode 2: placeholder, then stream
    res.writeHead(200, TYPE);                     // status 200 (OK) and headers, sent first
    res.write(top + zone(WAITING));               // 1st chunk: page and placeholder
    const cart = await computeCart(name);         // the computation runs, the page is there
    // JSON.stringify puts the text in quotes, like a JavaScript text;
    // \u003c is the JavaScript writing of <: a </script> in the text does not close the tag
    const code = JSON.stringify(cart).replace(/</g, '\\u003c');
    // textContent places plain text in the element: no HTML escaping needed
    res.end(`<script>cart.textContent = ${code}</script>`); // 2nd chunk: fills the space
  } else if (req.url === '/request') {            // mode 3: filling by a request
    const script = "fetch('/fragment').then((r) => r.text())" + // the browser asks
      '.then((t) => { cart.textContent = t; })';  // then places it in the space
    res.writeHead(200, TYPE).end(top + zone(WAITING) + `<script>${script}</script>`);
  } else if (req.url === '/fragment') {           // the slow block, served on its own
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); // plain text
    res.end(await computeCart(name));             // answers after 800 ms
  } else {                                        // any other address
    res.writeHead(404).end();                     // not found
  }
}).listen(PORT, '127.0.0.1');                     // 127.0.0.1: listens to this machine only
```

Rule to remember, applied above: a text inserted **as HTML** (`/sync`) must be escaped; a text placed with `textContent` (`/stream`, `/request`) must **not** be, otherwise the visitor would see the `&#60;` codes instead of the character.

The following commands are typed in a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) opened in the folder of the file. We start the server, then we measure with [`curl`](https://curl.se/docs/manpage.html) (a program that sends an HTTP request from the terminal). The `-w` option displays durations: `time_starttransfer` is the time elapsed until the **first byte** received, `time_total` the time until the end. Shell notations used:

| Notation | Meaning | To learn more |
|---|---|---|
| `command &` | Runs the command in the background: the terminal stays available | [processes](/?c=langages&s=bash&p=gestion-des-processus) |
| `PORT=7143 command` | Sets the variable `PORT` for this command only | [environment variables](/?c=langages&s=bash&p=variables-denvironnement) |
| `timeout 300 command` | Stops the command after 300 s: the server stops on its own | [`timeout`](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| `for m in a b; do ... done` | Repeats for each value; `$m` is the current value | [loops](/?c=langages&s=bash&p=boucles) |
| `\` at the end of a line | The command continues on the next line | [basic commands](/?c=langages&s=bash&p=commandes-de-base) |
| `a \| b` | The output of `a` becomes the input of `b` (a pipe) | [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes) |
| `grep`, `sed` | Search (`grep`) or replace (`sed`) text | [text processing](/?c=langages&s=bash&p=traitement-de-texte) |

After 300 seconds, `curl` no longer receives a response: restart the first command.

```bash
# Starts the server on port 7143 in the background; "timeout 300" stops it after 300 s
PORT=7143 timeout 300 node server-deferred.mjs &
# Gives the server one second to start listening
sleep 1
# For each of the three addresses, sends a request and displays the two durations
for m in sync stream request; do
  # -s: silent mode; -o /dev/null: discards the body; -w: format for displaying the durations
  curl -s -o /dev/null \
    -w "$m : first byte %{time_starttransfer}s, total %{time_total}s\n" \
    "http://127.0.0.1:7143/$m"
done
```

Sample output (the durations vary slightly from one attempt to another, the orders of magnitude do not):

```text
sync : first byte 0.809237s, total 0.809291s
stream : first byte 0.000792s, total 0.803238s
request : first byte 0.000685s, total 0.000709s
```

| Mode | First byte | Total | Reading |
|---|---|---|---|
| `/sync` | about 0.8 s | about 0.8 s | Nothing arrives before the end of the computation |
| `/stream` | less than 2 ms | about 0.8 s | The skeleton arrives almost instantly; the fragment arrives 800 ms later in the same response |
| `/request` | less than 2 ms | less than 2 ms | The page is complete right away; the fragment is a second request |

For the second request, the duration to count is that of the `/fragment` address:

```bash
# Measures the second request, the one the browser sends after receiving the page
curl -s -o /dev/null -w "fragment : first byte %{time_starttransfer}s\n" \
  http://127.0.0.1:7143/fragment
```

```text
fragment : first byte 0.802402s
```

The fragment therefore arrives, in both deferred modes, about 800 ms after the request for the fragment: the gain is not about computing faster, but about **displaying the rest during that time**. To see the two chunks of `/stream` arrive at different times, we ask `curl` to trace each reception:

```bash
# --trace-ascii - : writes the trace to the output; --trace-time : adds the time
# grep keeps only the "Recv data" lines (data received), one per chunk
curl -s -o /dev/null --trace-time --trace-ascii - \
  http://127.0.0.1:7143/stream | grep "Recv data"
```

```text
13:01:42.839034 <= Recv data, 140 bytes (0x8c)
13:01:43.639987 <= Recv data, 83 bytes (0x53)
```

Two chunks (140 bytes, then 83), about 0.8 s apart (801 ms here): the first contains the page and the placeholder, the second the small script that fills it. The response headers do announce the sending in chunks:

```bash
# -i: displays the response headers before its body
# sed (GNU, the one on Linux) splits the line between two tags: >< becomes > then <
curl -si http://127.0.0.1:7143/stream | sed 's/></>\n</g'
```

```text
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
Date: Sun, 01 Nov 2026 12:01:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

<h1>Shop</h1>
<p>Same content for everyone.</p>
<div id="cart" style="min-height:2em" aria-live="polite">Loading the cart…</div>
<script>cart.textContent = "Hello visitor, 3 items in the cart"</script>
```

What remains is the proof that the skeleton of `/request` is the same for everyone. `md5sum` computes a fingerprint of a content: two identical contents give the same fingerprint, two different contents give (almost certainly) two different fingerprints. The `-b` option of `curl` sends a cookie.

```bash
# Page of /request requested by Jean, then by Marie; md5sum gives the fingerprint of each page
curl -s -b user=Jean http://127.0.0.1:7143/request | md5sum
curl -s -b user=Marie http://127.0.0.1:7143/request | md5sum
# Same comparison for the synchronous page, which contains the cart
curl -s -b user=Jean http://127.0.0.1:7143/sync | md5sum
curl -s -b user=Marie http://127.0.0.1:7143/sync | md5sum
```

```text
e514e756b3c99363a0e6eb1be2ef6d38  -
e514e756b3c99363a0e6eb1be2ef6d38  -
05c9379c25f62abbc759b5a5dd2dba1e  -
3b5105355c98ef3ed3aca65589d0bc0f  -
```

| Page requested | Jean | Marie | Conclusion |
|---|---|---|---|
| `/request` | `e514e756...` | `e514e756...` | Identical: a shared cache can serve it to everyone |
| `/sync` | `05c9379c...` | `3b510535...` | Different: impossible to share |

Last, the fragment is indeed specific to each visitor. `echo` prints a line break, so that the outputs do not stick together. The trapped cookie `<b>x` contains an HTML tag; the raw text of the fragment keeps it as it is, because `textContent` never interprets it:

```bash
# Fragment for Jean
curl -s -b user=Jean http://127.0.0.1:7143/fragment; echo
# Fragment for a cookie that contains HTML: raw text, no escaping
curl -s -b 'user=<b>x' http://127.0.0.1:7143/fragment; echo
```

```text
Hello Jean, 3 items in the cart
Hello <b>x, 3 items in the cart
```

In the synchronous page, on the other hand, the text is inserted as HTML: this is where `escapeHtml` neutralizes the trapped name (flaw described in [XSS](/?c=securite&s=cybersecurite&p=xss-en-detail)). In streaming mode, a `</script>` in the name is written `\u003c/script>` so as not to close the tag:

```bash
# Synchronous page with the trapped cookie: `<` becomes &#60;
curl -s -b 'user=<b>x' http://127.0.0.1:7143/sync | fold -s -w 90; echo
# Stream mode, cookie with </script>; tail -c 120 keeps the last 120 characters;
# fold -s -w 90 cuts the output into lines of 90 characters at most (display only)
curl -s -b 'user=</script>x' http://127.0.0.1:7143/stream \
  | tail -c 120 | fold -s -w 90; echo
```

```text
<h1>Shop</h1><p>Same content for everyone.</p><div id="cart" style="min-height:2em"
aria-live="polite">Hello &#60;b&#62;x, 3 items in the cart</div>
-live="polite">Loading the cart…</div><script>cart.textContent = "Hello
\u003c/script>x, 3 items in the cart"</script>
```

These measurements cover a local server, without a real network; with a real network, each round trip adds its own latency (see [cutting round trips](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)). They measure the arrival of bytes, not the display: to see the page fill up, open `http://127.0.0.1:7143/stream` in a browser ([the DOM](/?c=langages&s=javascript&p=dom-et-evenements) explains how the script changes the page).

## Why this looks like latency overlap

While the server computes the cart (800 ms), the browser is not blocked: it displays the skeleton. This is the application, at the scale of a page, of the idea of [latency overlap](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence): making independent tasks progress instead of waiting first for the slowest one. And it is the opposite of the dead wait described in [waiting without wasting time](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts): the wait still exists, but it no longer delays anything else.

| Chapter | Same idea | Here |
|---|---|---|
| [Overlapping latency](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence) | Doing something else during a wait | Displaying the skeleton while the cart is computed |
| [Waiting without wasting time](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts) | Not blocking on what is not ready | Not blocking the whole page on one block |
| [Avoiding redundant recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) | Not redoing what has not changed | Keeping the skeleton in cache, recomputing only the fragment |

## The trap of layout shift

If the placeholder is **empty** or smaller than the final content, everything below it is **pushed down** when the fill happens: the visitor who was reading or about to click sees the text move under their eyes. This is called a **layout shift**. The same problem exists for images, hence the `width` and `height` attributes described in [links and images](/?c=langages&s=html&p=liens-et-images).

```html
<!-- Placeholder: its height is set before the content arrives -->
<div id="cart" style="min-height: 2em">   <!-- at least 2 times the size of the text -->
  Loading the cart…                       <!-- provisional text -->
</div>
<!-- The content that follows does not move, as long as the cart fits in 2em -->
<p>Footer</p>
```

| Situation | Effect | Remedy |
|---|---|---|
| Empty placeholder (height 0) | All the content that follows jumps down | Reserve a minimum height |
| Reserved height too large | A large useless blank, then a jump up | Measure the real average size of the content |
| Final content of variable size (list) | A jump depending on the number of items | Reserve the size of the usual case, or a fixed-size frame with scrolling |
| Provisional text shorter than the final one | One more line at the fill | Write the provisional text at the same width and height |
| Block that disappears when empty | The page moves up | Keep the space, or defer only the blocks that are always present |

The `em` unit (here `2em`: twice the size of the text) and the other size units are explained in [CSS units and sizing functions](/?c=langages&s=css&p=unites-et-fonctions-de-taille), and the way an element takes up room in [the box model](/?c=langages&s=css&p=box-model).

## Accessibility: announcing what arrives

A screen reader (software that reads the page aloud for people who are blind or have low vision) reads only one place at a time. Content that appears somewhere other than where it is reading goes **unnoticed**. So the placeholder must be declared as a **live region** (`aria-live`): an area whose changes are announced without moving the focus. The mechanism is detailed in [dynamic ARIA and keyboard focus](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier).

```html
<!-- aria-live="polite": announces the change when the reader has finished speaking -->
<div id="cart" aria-live="polite" style="min-height: 2em">
  Loading the cart…
</div>
```

| Point of attention | Why | Practice |
|---|---|---|
| The region exists **before** the change | A screen reader watches an area that is already there, not one that appears with its content | Send the region with the placeholder, then fill it |
| `polite` rather than `assertive` | `assertive` interrupts at once what the reader was saying; `polite` waits for the end of the sentence | Reserve `assertive` for urgent alerts |
| Do not move the focus | The user would lose their position in the page | Leave the focus where it is |
| Clear provisional text | "Loading the cart…" says what is happening | Avoid a blank or a simple symbol |
| Without JavaScript | The fragment never arrives | Provide a fallback, for example a link to the cart page in a `<noscript>`, an element whose content is shown only if JavaScript is disabled ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript)) |

The HTML above is the one produced by the server of the experiment. The announcement itself depends on the screen reader and the browser used: test with those of your visitors.

## The block as a plugin

In software built around blocks, each block is generally a [class](/?c=langages&s=php&p=poo) (an object template, here in PHP) that the application finds by itself: a **plugin**. The detail of the mechanism (declaring, discovering, instantiating) is in [plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins). What matters here:

| Role | What the block plugin does | Link with deferral |
|---|---|---|
| Declaration | Gives the block an identifier and a name | The system knows which block goes where |
| Building | A method returns the description of the display | This is where we decide to compute right away or to **announce** a deferred computation |
| Independence | The block does not depend on the others | A slow block can be deferred without touching the others |

A block therefore differs from its neighbor only in the way it builds its content: the menu block returns its content, the cart block returns **the promise to compute it later** (a description of what will be computed, like a [Promise](/?c=langages&s=javascript&p=asynchrone) in JavaScript).

## An example in Drupal: lazy builder and BigPipe

> **This section is an example from one particular software.** Drupal serves as an illustration; the idea of the chapter does not depend on it. The API names below come from the official Drupal documentation ([render arrays and lazy builders](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), [automatic placeholders and BigPipe](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)). They are checked against the Drupal 11.x source code.

Drupal describes what must be displayed as **render arrays**: [PHP](/?c=langages&s=php&p=php) arrays whose keys starting with `#` are instructions. To defer a block, one of these arrays declares a **lazy builder** (a builder that runs later): instead of the content, it names the function that will compute it later. The system then replaces the piece with a placeholder. This replacement happens only on a cacheable request (a page read, `GET`, not a form submission, `POST`): `#create_placeholder => TRUE` forces nothing on a `POST`.

PHP notations in the examples (see [object-oriented programming in PHP](/?c=langages&s=php&p=poo)): `namespace` gives the class its logical "address", `use` imports a class from another namespace, `class A extends B` creates a class `A` that takes over everything `B` does, `implements` declares that a class follows a contract (an *interface*), `public static function f(): array` is a method that can be called from outside, without creating an object (`static`), and that returns an array (`: array`), `new X(...)` creates an object, `string $count` declares a text parameter whose `$count` inserts the value into a text in double quotes, `<?php` opens the PHP code, `TRUE` is the boolean "true" and `#[Block(...)]` is an **attribute**, a declaration label that Drupal reads to recognize the plugin.

```php
<?php

namespace Drupal\shop\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// Declares the plugin: an identifier and a readable name for the administration
#[Block(id: 'shop_cart', admin_label: new TranslatableMarkup('Cart'))]
class CartBlock extends BlockBase {

  // Builds the block: returns a "render array" (the description of the display)
  public function build(): array {
    return [
      // Instead of computing here, we name the function that will compute later
      '#lazy_builder' => ['shop.cart_builder:construct', ['3']],
      // Asks for a placeholder in place of this piece (cacheable request)
      '#create_placeholder' => TRUE,
    ];
  }
}
```

The first element of `#lazy_builder` is the name of the **service** (a shared object that the system knows how to build, see [the service container](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services)), then a colon, then the method. The second is the list of arguments, which must stay simple (text, number, boolean) according to the [documentation](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), so that the system can memorize them without keeping objects.

```php
<?php

namespace Drupal\shop;

use Drupal\Core\Security\TrustedCallbackInterface;

// The service that computes the slow piece, called afterwards by Drupal
class CartBuilder implements TrustedCallbackInterface {

  // Receives the arguments given in '#lazy_builder' (here the text "3")
  public function construct(string $count): array {
    // Returns the final render array that will replace the placeholder
    return ['#markup' => "Cart: $count items"];
  }

  // Lists the methods that Drupal is allowed to call this way
  public static function trustedCallbacks(): array {
    return ['construct'];
  }
}
```

The `TrustedCallbackInterface` interface and its method `trustedCallbacks()` allow Drupal to call `construct`. Since Drupal 11.5, the `#[TrustedCallback]` attribute, placed on the `construct` method, is an alternative to this interface.

The service is declared in a [YAML](https://yaml.org/spec/1.2.2/) file (a text configuration format, where indentation expresses nesting), named `shop.services.yml` and placed at the root of the `shop` module, next to the `shop.info.yml` file that declares the module itself:

```yaml
services:
  # Name of the service, the one written before the colon in '#lazy_builder'
  shop.cart_builder:
    # PHP class that will be instantiated for this service
    class: Drupal\shop\CartBuilder
```

The [**BigPipe**](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering) module, shipped with Drupal, then takes care of the delivery: it first sends the page with the placeholders, then the fragments as they are computed, in the same response. This is the "deferred by streaming" mode of the comparison table, which we reproduced in miniature with `/stream`.

| Element | What it is | Equivalent in the experiment |
|---|---|---|
| `#lazy_builder` | Names the function that will compute the content later | `computeCart` |
| `#create_placeholder` | Asks for a placeholder | `zone(WAITING)` |
| Service `shop.cart_builder` | Object that holds the method called | The function `computeCart` |
| BigPipe | Sends the fragments in streaming, in the same response | `res.write` then `res.end` of `/stream` |
| Render array | Description of the display | The HTML sent |

## What to defer, and when

Deferring has a cost: a page in several stages is more complex, and the placeholder can get in the way if the content is essential. The table helps you choose.

| Block | Defer? | Reason |
|---|---|---|
| Menu, footer | No | Fast and identical for everyone: ordinary cache |
| Main text of the article | No | It is the reason for the visit, it must be there from the start |
| Cart, visitor's name, notifications | Yes | Personal, they prevent caching the page |
| Recommendations computed on the fly | Yes | Slow, secondary |
| Fast content (a few milliseconds) | No | The gain is not worth the complexity |
| Block that the visitor may never see (bottom of the page) | Yes, and triggered by scrolling | No need to compute it if it is never looked at |

Before deferring, we **measure**: see [measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser). A block assumed to be slow may not be, and the total time did not go down: it is the time before the first display that falls.

## Pitfalls

A **proxy** is a server placed between the visitor and the site; a [load balancer](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) is a kind of one. A **buffer** is a memory where data are kept before being passed on.

| Pitfall | Consequence | Remedy |
|---|---|---|
| Deferring a fast block | Complexity and layout shift for no gain | Measure first, defer only the slow or the personal |
| Placeholder without size | The content that follows jumps at the fill | Reserve a minimum height |
| Personal fragment in a page cached as shared | Marie sees Jean's data | Put the personal part in the fragment, never in the skeleton |
| An intermediary that keeps the response in a buffer until the end | The stream only arrives at the end, the gain disappears | Check the whole chain, measure the first byte from end to end |
| Inserting the fragment as HTML without escaping it | XSS flaw | Insert with `textContent` (without escaping); if the text goes into HTML, escape it |
| `</script>` in the text of the fragment | The browser closes the script too early | Replace `<` with `\u003c` in the text of the script, as `replace(/</g, '\\u003c')` in the experiment: `\u003c` is the JavaScript writing of the character `<`, which no longer closes the tag |
| Fragment that fails or takes too long | The space stays "Loading..." forever | Provide a time limit and a fallback message |
| Relying on JavaScript without a fallback | The fragment is missing for whoever disabled it | `<noscript>` (see above) with a link to the concerned page |
| Many deferred blocks, each with its own request | The round trips pile up | Group them into one streamed response, or into a single request |
| Fragment announced in a loop to screen readers | A flood of announcements | A single `polite` region, one change |

## Best practices

| Practice | Why |
|---|---|
| Separate what is common from what is personal | The common part is cached, the personal part is computed separately |
| Measure the first byte before and after | The measurement proves the gain (`curl -w`) |
| Reserve the size of the space | Avoids the layout shift |
| Declare the zone as an `aria-live="polite"` region from the sending | The content that arrives is announced |
| Escape any text specific to the user before inserting it as HTML (or use `textContent`) | Avoids XSS flaws |
| Choose the mode according to the need | Streaming if the skeleton stays in the response, a second request if we want the shared cache |
| Plan for failure and for the time limit | A fragment that does not come does not block the page |
| Keep the code of a block in a separate plugin | A slow block can change mode without touching the others |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A slow block, or one specific to the visitor, prevents caching the whole page and delays its display. We first send the skeleton with a **placeholder**, then fill the space with the **fragment** computed separately: in the same response (streaming) or through a second request. The skeleton becomes cacheable, and the time to the first byte drops from about 0.8 s to a few milliseconds in the experiment, while the fragment still arrives 800 ms later. The gain lies in displaying the rest during the wait, not in a faster computation. |
| **Pitfalls to avoid** | Deferring a fast block; forgetting to reserve the size of the space (layout shift); putting the personal fragment in a shared page; letting an intermediary keep the stream in a buffer; inserting unescaped text as HTML; planning nothing for when the fragment fails or JavaScript is absent; forgetting the `aria-live` region. |
| **Best practices** | Measure first (`curl -w`, first byte); defer only the slow or personal blocks; reserve a minimum height; declare an `aria-live="polite"` region from the sending; escape the text; plan for a time limit and a fallback; put each block in its plugin to change mode without touching the others. |
