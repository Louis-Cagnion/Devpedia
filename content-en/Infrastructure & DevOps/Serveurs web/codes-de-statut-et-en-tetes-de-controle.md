---
order: 1
---

# HTTP status codes and control headers

When a browser or a program asks a server for a page, the response contains much more than the page: it carries a **status code** (a number that says whether it worked) and **headers** (lines of instructions such as "keep this page for 60 seconds" or "come back in 5 seconds"). This chapter teaches you how to read these two elements, how to produce them on the server side and, above all, how to react correctly on the client side. It assumes you already know the basics of [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (a **client** sends a **request**, a **server** sends back a **response**) and how to use a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type commands on the keyboard). It fits into the [Web servers](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web) section.

A **web server** is a program that waits for HTTP requests and answers them: it is the one behind a website or an API (an interface that other programs call over HTTP to get or send data). A **header** is a `Name: value` line placed before the content of an HTTP message, which conveys information about the message itself rather than its content.

## One HTTP response, line by line

An HTTP response always splits into three parts: a status line, headers, then an empty line followed by the content (the **body**).

```text
HTTP/1.1 429 Too Many Requests        <- status line: version, code, name of the code
Content-Type: text/plain; charset=utf-8   <- headers: one "Name: value" per line
Content-Length: 18
Retry-After: 5
                                       <- empty line: end of the headers
Too many requests                      <- body: the content itself
```

`Content-Type` (the type of the content) and `Content-Length` (its size in bytes) are explained in [Content-Type and Content-Length](#content-type-and-content-length-reading-the-body-correctly).

| Part | Role | Who reads it |
|---|---|---|
| Status line | Summarizes the result: `429` is the **code**, `Too Many Requests` is its name in English | The program (the code is meant to be read by a machine) |
| Headers | Specify how to handle the body and how to behave next | The browser, the program, the intermediate caches |
| Body | The content: page, [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) data, error message... | The user or the program |

The code is the reliable part: the name next to it is a hint for humans, and the body can be anything. A program therefore decides **based on the code**, never on the text.

## Observing a response with `curl`

The commands in this chapter are written for Bash (Linux, macOS, WSL or Git Bash), not for PowerShell or cmd.

**`curl`** is a terminal program that sends an HTTP request and displays the response ([official documentation](https://curl.se/docs/manpage.html)). It is present on most Linux and macOS systems; under Windows PowerShell, the name `curl` often refers to another [alias](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), so you have to type `curl.exe`. Check that it is installed with `curl --version`.

| Option | Effect |
|---|---|
| `-i` | Shows the headers of the response before the body |
| `-I` | Sends a `HEAD` request (a [HTTP method](/?c=infrastructure-devops&s=infrastructure&p=api-et-http#une-requete-une-methode-une-adresse-parfois-des-donnees): like `GET`, but the server only returns the status line and the headers, without a body) |
| `-s` | Silent: no progress bar |
| `-o /dev/null` | Throws away the body (`/dev/null` is the "trash can" file of Linux and macOS, see [redirections](/?c=langages&s=bash&p=redirections-et-pipes)) |
| `-w '%{http_code}\n'` | Once the request is finished, prints only the status code (`\n` starts a new line) |
| `-L` | Follows redirects (see `Location` below) |
| `-H 'Name: value'` | Adds a header to the request |

To be able to try everything at home, the next section gives a small demonstration server.

## A test server in Node.js

**Node.js** is a program that runs JavaScript outside the browser ([official site and installation](https://nodejs.org/en/download)); you need Node 18 or later (check with `node --version`); its `http` module lets you create a server ([documentation](https://nodejs.org/api/http.html)). The code below assumes the basics of [JavaScript](/?c=langages&s=javascript&p=javascript): [functions](/?c=langages&s=javascript&p=fonctions), [conditions](/?c=langages&s=javascript&p=conditions), [objects](/?c=langages&s=javascript&p=objets) and [arrays](/?c=langages&s=javascript&p=tableaux). Save it in a file named `server.mjs` (the `.mjs` extension tells Node that the file uses `import`, see [the code editor](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

It listens on `127.0.0.1` (the address of **your own machine**, see [network addressing](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) and on **port** 5628 (a number that tells several network programs apart on the same machine, see [sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). If this port is already taken, Node displays `EADDRINUSE`: change the number in `PORT` and in the addresses of the examples.

```javascript
// import loads a module: http is the Node module that creates a web server
import http from "node:http";

// PORT: the "door number" the server listens on
const PORT = 5628;
// LIMIT: number of requests accepted per time window
const LIMIT = 3;
// WINDOW_MS: length of a window, in milliseconds (5000 ms = 5 s)
const WINDOW_MS = 5000;

// ROUTES: for each fixed address, the status, the headers and the body to send back
const ROUTES = {
  // 301: the Location header gives the new address of the page
  "/old": [301, { Location: "/new" }, ""],
  // 200: the page may be kept for 60 seconds by the client (Cache-Control)
  "/new": [200, { "Cache-Control": "max-age=60" }, "Welcome\n"],
  // 401: "who are you?"; WWW-Authenticate says how to identify yourself
  // (Basic: a user name and a password; realm: the name of the protected area)
  "/private": [401, { "WWW-Authenticate": 'Basic realm="private"' }, "Please log in\n"],
  // 403: the server knows who you are, but refuses
  "/forbidden": [403, {}, "Access denied\n"],
  // 503: server under maintenance; Retry-After says to come back in 120 seconds
  "/maintenance": [503, { "Retry-After": "120" }, "Under maintenance\n"],
};

// windowStart: the instant (in ms) when the current window started
// (Date.now() gives the present instant in milliseconds)
let windowStart = Date.now();
// counter: number of requests already seen in the current window
let counter = 0;

// respond sends a status code, some headers and a text body
function respond(res, status, headers, body) {
  // Content-Length: size of the body in bytes (an "é" takes 2 bytes in UTF-8)
  // Buffer: the Node type for handling bytes; byteLength counts those of the body
  const size = Buffer.byteLength(body);
  // headers common to all responses; ...headers copies those of the route
  const allHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": size,
    ...headers,
  };
  // writeHead sets the status code and the headers, end sends the body
  res.writeHead(status, allHeaders);
  res.end(body);
}

// limit counts the request and returns the wait in seconds (0 = accepted)
function limit(now) {
  // if the window is over, we start again with the counter at zero
  if (now - windowStart >= WINDOW_MS) {
    windowStart = now;
    counter = 0;
  }
  // one more request in the window
  counter += 1;
  // under the limit: accepted; otherwise, the remaining seconds rounded up
  if (counter <= LIMIT) return 0;
  return Math.ceil((windowStart + WINDOW_MS - now) / 1000);
}

// servePage answers /page: 304 if the client already has version "v1"
function servePage(req, res) {
  // if-none-match: the tag (ETag) that the client kept from its previous visit
  if (req.headers["if-none-match"] === '"v1"') {
    // 304: nothing has changed, so the response deliberately has no body
    res.writeHead(304, { ETag: '"v1"' });
    res.end();
    return;
  }
  // first visit: the whole page, with its version tag
  respond(res, 200, { ETag: '"v1"', "Cache-Control": "no-cache" }, "Page v1\n");
}

// server: the function passed to createServer is called for each request
// req: the request received, res: the response to send
// (req, res) => { ... } is a function written with an arrow, with no name
const server = http.createServer((req, res) => {
  // req.url: the part of the address after the machine name, for example /api
  if (req.url === "/api") {
    // wait: 0 if the request is accepted, otherwise the number of seconds to wait
    const wait = limit(Date.now());
    // 429 Too Many Requests, with Retry-After in seconds (String: number as text)
    if (wait > 0) {
      respond(res, 429, { "Retry-After": String(wait) }, "Too many requests\n");
      return;
    }
    // otherwise: 200 with a response in JSON format
    respond(res, 200, { "Content-Type": "application/json" }, '{"ok":true}\n');
    return;
  }
  // /page handles its own logic
  if (req.url === "/page") {
    servePage(req, res);
    return;
  }
  // known fixed route: ...ROUTES[req.url] passes the three values to respond
  if (ROUTES[req.url]) {
    respond(res, ...ROUTES[req.url]);
    return;
  }
  // any other address does not exist: 404
  respond(res, 404, {}, "Not found\n");
});

// listen starts listening; 127.0.0.1 = this machine only
server.listen(PORT, "127.0.0.1");
```

| Address | What the server sends back |
|---|---|
| `/api` | `200` for the first 3 requests of each 5-second window, then `429` with `Retry-After` |
| `/old` | `301` and `Location: /new` |
| `/new` | `200` and `Cache-Control: max-age=60` |
| `/page` | `200` with an `ETag`, or `304` if the client already knows it |
| `/private` | `401` |
| `/forbidden` | `403` |
| `/maintenance` | `503` with `Retry-After` |
| any other address | `404` |

Start it in a first terminal with `node server.mjs`: the terminal stays busy as long as the server runs (stop it with `Ctrl+C`). Open a **second** terminal for the following `curl` commands. Here is an example, with the response actually obtained:

```bash
# -i: shows the headers; /new is the page that carries Cache-Control
curl -i http://127.0.0.1:5628/new
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 8
Cache-Control: max-age=60
Date: Sat, 31 Oct 2026 20:17:31 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Welcome
```

`Date`, `Connection` and `Keep-Alive` are added automatically by Node (the date and time of the response, then the instruction to keep the connection open for a few seconds); in the rest of the chapter, these three lines are left out of the outputs to keep them light.

## The five families of codes

A status code has three digits, and **the first one** is enough to know the family:

| Family | Name | General meaning | Who must act next |
|---|---|---|---|
| `1xx` | Information | The request has been received, the rest is coming (rarely seen by an application developer) | Nobody, the protocol handles it |
| `2xx` | Success | The request was understood and processed | Nobody |
| `3xx` | Redirection | The resource is elsewhere or has not changed | The client must make another request (or reuse its copy) |
| `4xx` | Client error | The request is incorrect, forbidden or too frequent | **The client** must change its request or its behavior |
| `5xx` | Server error | The request was valid but the server could not process it | **The server** must be repaired; the client can sometimes try again later |

The main idea to remember: the first digit answers "**who must change something?**". Repeating unchanged a request that got a `4xx` is pointless (except `429`, see below); repeating a request that got a `5xx` can succeed if the failure was temporary.

## The codes you meet most often

### Success and redirections

| Code | Name | Meaning | Responsible | Example |
|---|---|---|---|---|
| `200` | OK | The request succeeded, the body contains the result | Nobody | Loading a page, reading a list |
| `201` | Created | A new resource was created; `Location` gives its address | Nobody | Response to a `POST` that creates an account |
| `204` | No Content | Success, deliberately **without a body** | Nobody | Response to a successful `DELETE` |
| `301` | Moved Permanently | The resource has permanently changed address (`Location`) | Server (configuration) | A site that moves from an old address to a new one |
| `302` | Found | The resource is **temporarily** elsewhere (`Location`) | Server (configuration) | Redirecting to the login page, then coming back |
| `304` | Not Modified | Nothing has changed since the copy the client holds; **no body** | Nobody | A browser checking again a page it already has |

`301` and `302` do not always keep the original method: a browser may turn a redirected `POST` into a `GET`. The codes `308` (permanent equivalent) and `307` (temporary equivalent) require **keeping the same method** ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110); an RFC, *Request For Comments*, is a numbered document that describes an Internet standard). A `301` can be remembered by browsers for a very long time, which makes it painful to fix if it was a mistake.

### Client errors (4xx)

| Code | Name | Meaning | Responsible | Example |
|---|---|---|---|---|
| `400` | Bad Request | The request is malformed or invalid | Client | Broken JSON, required field missing |
| `401` | Unauthorized | **Not identified**: the server does not know who you are (or the identification is wrong) | Client | Missing password, expired token (a token is a temporary code that proves your identity) |
| `403` | Forbidden | **Identified but refused**: the server knows who you are and does not authorize you | Client | A simple user requesting an administration page |
| `404` | Not Found | The resource does not exist (or the server refuses to say that it exists) | Client | Typo in the address |
| `429` | Too Many Requests | **Too many requests** in a given time; often accompanied by `Retry-After` | Client | A script that queries an API in a loop |

### Server errors (5xx)

| Code | Name | Meaning | Responsible | Example |
|---|---|---|---|---|
| `500` | Internal Server Error | The server met an unexpected error | Server | Bug in the code, [database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) unreachable |
| `502` | Bad Gateway | An intermediate server received an invalid response from the server behind it | Server (chain of servers) | The application program crashed behind a [reverse proxy](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) (defined below the table) |
| `503` | Service Unavailable | The server cannot respond **for now** (overload, maintenance); often accompanied by `Retry-After` | Server | Update in progress |
| `504` | Gateway Timeout | The intermediate server waited too long for the response of the server behind it | Server (chain of servers) | Very slow request on a site behind a reverse proxy |

A **reverse proxy** is an intermediate server that receives the requests in place of the application server and forwards them to it: it is the one that produces a `502` or a `504` when the server behind it is down or too slow.

Let us check some of these codes on the test server (the `Date`, `Connection` and `Keep-Alive` lines are omitted, and an empty line separates each response here):

```bash
# 301: -i shows the Location header; without -L, curl does not follow the redirect
curl -i http://127.0.0.1:5628/old
# 401: the WWW-Authenticate header says how to identify yourself
curl -i http://127.0.0.1:5628/private
# 403: no special header, the server simply refuses
curl -i http://127.0.0.1:5628/forbidden
# 404: address unknown to the server
curl -i http://127.0.0.1:5628/missing
```

```text
HTTP/1.1 301 Moved Permanently
Content-Type: text/plain; charset=utf-8
Content-Length: 0
Location: /new

HTTP/1.1 401 Unauthorized
Content-Type: text/plain; charset=utf-8
Content-Length: 14
WWW-Authenticate: Basic realm="private"

Please log in

HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 14

Access denied

HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Content-Length: 10

Not found
```

The first response has no body (the `Content-Length: 0` shows it); the other three have one. To keep only the code, `-w` is enough:

```bash
# -s silent, -o /dev/null throws away the body, -w prints the status code
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/missing
```

This displays `404`.

### `401` or `403`: the most frequent confusion

**Authentication** answers "who are you?"; **authorization** answers "are you allowed to do this?" ([the difference in detail](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation)). The official name of `401`, *Unauthorized*, is misleading: it is really about **authentication**.

| Situation | Code | What the client must do |
|---|---|---|
| No credentials sent | `401` | Identify itself, then try again |
| Wrong credentials or expired token | `401` | Identify itself again |
| Identified, but not allowed (simple user, administration page) | `403` | Nothing: identifying again changes nothing, it takes another account or another permission |
| Resource one prefers not to reveal | `404` | Nothing (the server deliberately hides that it exists) |

## Headers that steer the client

Some response headers do not only describe the content: they **tell the client what to do**.

| Header | What it asks for | Often associated with |
|---|---|---|
| `Retry-After` | Wait before trying again | `429`, `503` |
| `Cache-Control` | Keep (or do not keep) the response in memory | `200`, `304` |
| `Location` | Go to this address | `201`, `301`, `302`, `307`, `308` |
| `Content-Type` | Read the body as this type of content | Almost all responses with a body |
| `Content-Length` | Read exactly this number of bytes of body | Almost all responses with a body |

### `Location`: where to go now

With a redirect (`3xx`), `Location` gives the new address; with a `201`, it gives the address of the resource that was just created. A browser follows the redirect by itself. `curl` only does so on request:

```bash
# -L: follows the redirect; -w prints the final code and the final address
# (url_effective is the name curl gives to the address of the last request)
curl -sL -o /dev/null -w '%{http_code} %{url_effective}\n' http://127.0.0.1:5628/old
```

```text
200 http://127.0.0.1:5628/new
```

Without `-L`, the same call displays `301 http://127.0.0.1:5628/old`. Two requests took place: one to `/old` (response `301`), the other to `/new` (response `200`).

### `Content-Type` and `Content-Length`: reading the body correctly

| Header | Example value | Role |
|---|---|---|
| `Content-Type` | `application/json` | The **content type** (MIME type, from the name of the original standard, *Multipurpose Internet Mail Extensions*): here [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) data. `text/html` for a web page, `text/plain` for plain text |
| `Content-Type` | `text/plain; charset=utf-8` | The type, followed by the **character set** (*charset*): the table that matches bytes to letters. UTF-8 is the most common one and handles accented letters ([encodings](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) |
| `Content-Length` | `18` | The size of the body in **bytes** (a byte is a unit of storage: an unaccented letter takes 1) |

In the `429` response of the section [One HTTP response, line by line](#one-http-response-line-by-line), the body `Too many requests` followed by a line break has 18 characters and `Content-Length: 18`: here each character is one byte. An accent changes the count: `é` takes 2 bytes in UTF-8. A `Content-Length` counted in characters instead of bytes cuts the body: the client receives a text whose end is lost (a value that is too large, on the other hand, makes it wait indefinitely for bytes that never come).

A wrong `Content-Type` causes strange bugs: a browser that receives JSON labelled `text/html` displays it as a page, and a client that expects JSON labelled `text/plain` may refuse to parse it. The server must also label correctly what it serves, so that the browser does not "guess" the type (see `X-Content-Type-Options` in [browser flaws](/?c=securite&s=cybersecurite&p=failles-de-navigateur)).

### `Cache-Control`: keep or do not keep

A **cache** is a copy kept in memory (by the browser or by an intermediate server) to avoid asking again for the same thing. `Cache-Control` sets this behavior ([reference documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)):

| Value | Effect |
|---|---|
| `max-age=60` | The copy is considered valid for 60 seconds: during that time, no request is sent |
| `no-cache` | The copy may be kept, but the client must **check again** with the server before reusing it (despite its name, it does not disable storage) |
| `no-store` | Keep nothing at all (banking pages, personal data) |
| `private` | Only the user's own browser may keep the copy, not a cache shared between users |
| `public` | Any cache may keep it |

With `no-cache`, the check goes through an `ETag`: a **version tag** that the server attaches to the response. On the next visit, the client sends it back in the request header `If-None-Match` ("give me the page only if it no longer matches this tag"). If nothing has changed, the server answers `304` **without a body**, which saves the transfer. With the `/page` route of the test server:

```bash
# first visit: the server answers 200 with the body and the ETag
curl -i http://127.0.0.1:5628/page
# second visit: -H sends If-None-Match with the ETag received; response 304
curl -i -H 'If-None-Match: "v1"' http://127.0.0.1:5628/page
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 8
ETag: "v1"
Cache-Control: no-cache

Page v1

HTTP/1.1 304 Not Modified
ETag: "v1"
```

`curl` keeps nothing in cache: it only shows the headers. It is the browser that applies `max-age` or `no-cache`. The related principle "serve a stale copy straight away, then update it in the background" is described in [redundant recalculation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant).

## `Retry-After`: "come back later"

When a server cannot or does not want to respond now, it does not just say "no": it can say **when** to try again. That is the role of `Retry-After`. It mainly goes with `429` (the client goes too fast) and `503` (the server is overloaded or under maintenance), and it can also appear in a `3xx` redirect ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 10.2.3; the `429` code is defined by [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)).

### Two possible formats

| Format | Example | Meaning |
|---|---|---|
| A number of seconds | `Retry-After: 120` | Wait 120 seconds from now |
| An HTTP date | `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT` | Do not come back before this instant (GMT time, equivalent to UTC, the same for everyone) |

A client must know how to read both. With the test server:

```bash
# wait 5 s after the previous command on /api; 3 requests pass,
# the 4th exceeds the limit: 429 with Retry-After in seconds
for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/api; done
# the maintenance server also gives a Retry-After, with the code 503
curl -i http://127.0.0.1:5628/maintenance
```

```text
200
200
200
429
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8
Content-Length: 18
Retry-After: 120

Under maintenance
```

The `for i in 1 2 3 4; do ... done` is a shell [loop](/?c=langages&s=bash&p=boucles) that repeats the command four times.

To see a complete `429` response, just send three requests in a row, then a fourth one with `-i` (with no pause between them; wait 5 seconds after the previous command to start again from a fresh window):

```bash
# the first 3 requests use up the limit, the 4th shows the complete 429 response
for i in 1 2 3; do curl -s -o /dev/null http://127.0.0.1:5628/api; done
curl -i http://127.0.0.1:5628/api
```

```text
HTTP/1.1 429 Too Many Requests
Content-Type: text/plain; charset=utf-8
Content-Length: 18
Retry-After: 5

Too many requests
```

This is the form described in [One HTTP response, line by line](#one-http-response-line-by-line): a status line, headers, an empty line, then the body. `Retry-After: 5` means "try again in 5 seconds": the server has calculated that 5 seconds remain before the end of the current 5-second window, and that a request sent before then would be refused again. If you wait before sending the fourth request, the value goes down (4, 3...), since the window moves forward.

### What a polite client does

```text
Client                                          Server
  | GET /api  (4th request in the window)  ---->   |
  | <----  429 Too Many Requests, Retry-After: 5   |
  |                                                |
  |   the client WAITS 5 s (+ a bit of jitter)     |
  |                                                |
  | GET /api  -------------------------------->    |
  | <----  200 {"ok":true}                         |
```

| Rule of a polite client | Why |
|---|---|
| Retry only `429` and `503` (and other temporary failures) | `400`, `401`, `403`, `404` will not change by repeating the same request |
| Read `Retry-After` first (seconds **or** date) | The server knows the length of its own overload better than the client does |
| Without `Retry-After`: wait longer and longer (**exponential backoff**) | The delay doubles at each failure: the server is given time to recover |
| Add some **randomness** (*jitter*) | Without it, a thousand clients that received the same `Retry-After: 5` all come back in the same second and cause a new spike |
| Limit the number of tries and cap the wait | A `Retry-After` of several hours must not block a program forever |
| Retry a request only if it is **idempotent** | An idempotent request (`GET`, `PUT`, `DELETE`) has the same effect whether it is sent once or ten times; repeating a `POST` can create a duplicate |

The same principle is applied by the client libraries of professional APIs (see [the SDK and the API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)), and completed by the circuit breaker (stop calling a resource that is down) in [robustness of batch processing](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

### The bad client: retrying without waiting

Here is a script that ignores the response and starts again immediately. It uses `fetch` (the JavaScript function that sends an HTTP request) with `await` (wait for the result), explained in [asynchronous programming](/?c=langages&s=javascript&p=asynchrone). `fetch` is available without installation since Node 18, and `await` outside a function requires a `.mjs` file: save the script in `bad.mjs` and run `node bad.mjs`, after waiting 5 seconds since the previous command.

```javascript
// counters: how many responses of each code have been received
const counters = {};
// twenty immediate requests, never waiting: the behavior to avoid
for (let i = 0; i < 20; i += 1) {
  // we only look at the status code; { status } extracts the status property of the response
  const { status } = await fetch("http://127.0.0.1:5628/api");
  // we add 1 to the counter of this code (?? 0: if it does not exist yet, we start from 0)
  counters[status] = (counters[status] ?? 0) + 1;
}
// display the tally
console.log(counters);
```

```text
{ '200': 3, '429': 17 }
```

Out of 20 requests, 17 were useless: they loaded the server, used up the limit, and brought nothing back. On a real service, this can lead to a lasting block of the access key (the secret code that identifies your program to the service; see [the security of a web API](/?c=securite&s=cybersecurite&p=securite-api-web)).

### The good client: respecting `Retry-After`

The following script (to save in `client.mjs`) reads the header, waits, and tries again. The function `readRetryAfter` handles both formats; `growingDelay` serves as a fallback when the header is missing. Error handling with `throw` is explained in [error handling](/?c=langages&s=javascript&p=gestion-des-erreurs).

```javascript
// API_URL: the address of the route that limits the rate
const API_URL = "http://127.0.0.1:5628/api";
// MAX_TRIES: maximum number of attempts before giving up
const MAX_TRIES = 5;
// MAX_WAIT_MS: ceiling of a wait, whatever the server asks for
const MAX_WAIT_MS = 30000;

// sleep returns a promise that ends after ms milliseconds
function sleep(ms) {
  // setTimeout calls done once the time has passed
  return new Promise((done) => setTimeout(done, ms));
}

// readRetryAfter converts the header value into milliseconds (null if absent)
function readRetryAfter(value) {
  // no header, or an empty header: the client will have to choose its delay itself
  if (value === null || value.trim() === "") return null;
  // first possible format: a whole number of seconds, for example "5"
  const seconds = Number(value);
  // Number.isFinite is false for NaN ("not a number"), which rules out a date
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  // second format: an HTTP date; Date.parse reads it and converts it to milliseconds
  // elapsed since 1 January 1970 (like Date.now())
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  // Date.now(): the present instant; Math.max(0, x) keeps the larger of 0 and x,
  // so the result is never negative: a date in the past means "right away"
  return Math.max(0, date - Date.now());
}

// growingDelay: random wait between 0 and 500 ms x 2^attempt (exponential backoff)
function growingDelay(attempt) {
  // Math.random() gives a number between 0 and 1; 2 ** attempt: 2 to the power attempt
  return Math.random() * 500 * 2 ** attempt;
}

// call sends the request and politely retries on 429 and 503
async function call(url) {
  // attempt is 0 for the first try, 1 for the second, and so on
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    // fetch sends the request; response.status is the status code received
    const response = await fetch(url);
    // response.ok is true for all the 2xx codes: we hand back the response
    if (response.ok) return response;
    // any code other than 429 or 503: retrying would be pointless
    if (response.status !== 429 && response.status !== 503) {
      throw new Error(`Final failure: ${response.status}`);
    }
    // the server's instruction if there is one; ?? picks the growing random delay otherwise
    const requested = readRetryAfter(response.headers.get("Retry-After"));
    // random 0 to 500 ms added: clients do not all come back at the same instant
    const wait = (requested ?? growingDelay(attempt)) + Math.random() * 500;
    // too long: we give up rather than blocking the program
    if (wait > MAX_WAIT_MS) throw new Error(`Wait too long: ${wait} ms`);
    // Math.round rounds to the nearest integer; the ${...} inside a template
    // string are replaced by their value
    const rounded = Math.round(wait);
    console.log(`attempt ${attempt + 1}: ${response.status}, waiting ${rounded} ms`);
    // pause before trying again
    await sleep(wait);
  }
  throw new Error("Too many attempts");
}

// we chain six calls: the first three pass, the next ones hit the limit
for (let number = 1; number <= 6; number += 1) {
  const response = await call(API_URL);
  console.log(`call ${number}: ${response.status} ${(await response.text()).trim()}`);
}
```

With the test server running, the output actually obtained is:

```text
call 1: 200 {"ok":true}
call 2: 200 {"ok":true}
call 3: 200 {"ok":true}
attempt 1: 429, waiting 5209 ms
call 4: 200 {"ok":true}
call 5: 200 {"ok":true}
call 6: 200 {"ok":true}
```

The fourth call got a `429`, waited a little over 5 seconds (the 5 from `Retry-After` plus the random 0 to 500 ms), then succeeded on the first retry. No request was wasted. The length of the pause varies slightly from one run to another because of the randomness.

Here is what `readRetryAfter` returns (in milliseconds) for different header values, results obtained by calling the function:

| Header value | Result | Explanation |
|---|---|---|
| `"5"` | `5000` | 5 seconds converted to milliseconds |
| `"120"` | `120000` | 2 minutes |
| `"-5"` | `0` | A negative delay makes no sense: no wait |
| A date already past (`Wed, 21 Oct 2015 07:28:00 GMT`) | `0` | Coming back right away is allowed |
| A date 90 seconds away | about `89000` | The time left until that date |
| `"abc"`, `""` or absent | `null` | Unusable value: the client uses `growingDelay` |

Without `Retry-After`, `growingDelay` draws a random number between 0 and a ceiling that doubles at each attempt:

| Attempt (starting number 0) | Ceiling of the randomly drawn wait |
|---|---|
| 0 | 500 ms |
| 1 | 1000 ms |
| 2 | 2000 ms |
| 3 | 4000 ms |
| 4 | 8000 ms |

`Retry-After` remains a **request**, not a technical constraint: nothing prevents a client from ignoring it. A serious server then protects itself (rate limiting, blocking the clients that insist); this server-side part is the subject of [rate limiting and the reverse proxy](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit). The risk that an overload represents is detailed in [overload and application denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Some services add their own headers to announce the remaining quota; their names and their meaning are found in the documentation of each service.

## Choosing the right code on the server side

| Situation | Code to send back |
|---|---|
| The page or data is returned normally | `200` |
| A `POST` has created a resource | `201` with `Location` |
| A `DELETE` succeeded, nothing to display | `204` |
| The page has changed address for good | `301` with `Location` |
| The request body is invalid (broken JSON, missing field) | `400`, with in the body what is wrong |
| No credentials, or wrong credentials | `401` |
| Identified but not allowed | `403` |
| The resource does not exist | `404` |
| The client exceeds its limit | `429` with `Retry-After` |
| Bug or unexpected failure | `500` (without internal details in the body) |
| Overload or planned maintenance | `503` with `Retry-After` |

## Pitfalls

| Pitfall | Consequence | What to do instead |
|---|---|---|
| Confusing `401` and `403` | The client identifies itself again in a loop although it is not allowed, or never identifies itself when it should | `401`: not identified; `403`: identified but refused |
| Returning `200` with an error message in the body (`{"error": "not found"}`) | Programs, caches and monitoring tools believe all is well; the error is counted as a success | Use the matching code (`404`, `400`...) and keep the message in the body as a complement |
| Retrying immediately in a loop | Measured above: 17 requests lost out of 20; risk of being blocked by the server | Wait for `Retry-After`, otherwise a growing and random delay, with a limited number of tries |
| Ignoring the date format of `Retry-After` | `Number("Wed, 21 Oct 2026...")` gives `NaN`: the client waits `NaN` milliseconds, that is, not at all | Read both formats (`readRetryAfter`) |
| Retrying a `400`, `401`, `403` or `404` | The same response every time, useless load | Fix the request, or identify yourself |
| Retrying a non-idempotent `POST` after a `5xx` | Possible duplicate (two orders, two payments) if the first one had in fact succeeded | Retry only idempotent requests, or add a uniqueness key (a unique identifier sent with the request, which lets the server ignore a duplicate; see [idempotence](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)) |
| No ceiling and no maximum number of tries | A program blocked for hours by a huge `Retry-After` | `MAX_WAIT_MS` and `MAX_TRIES` |
| `500` for a client error (invalid JSON, missing field) | Failure alerts go off by mistake, and the client believes in a temporary failure and retries | `400`: the request is at fault |
| `404` for everything (even an access refusal) | The client does not know what to fix | A precise code, unless you want to hide the existence of the resource |
| `301` set by mistake | Remembered by browsers, hard to cancel | Test with `302` first, switch to `301` once the address is final |
| `Content-Length` counted in characters | Truncated body as soon as there is an accent | Measure in bytes (`Buffer.byteLength`) |
| `Content-Type` missing or wrong | The browser guesses the type or displays the content badly | Always declare it (`application/json` for JSON) |
| Putting a personal response as `public` | A shared cache serves it to another user | `private` or `no-store` for personal data |

## Best practices

| Best practice | Why |
|---|---|
| Decide based on the **code**, not on the text of the body | The code is the contract between machines |
| Distinguish `4xx` (fix the request) from `5xx` (retry later, with a limit) | Each family calls for a different reaction |
| Always read `Retry-After` on `429` and `503` | The server knows better than you how long the failure will last |
| Bound the exponential backoff, the randomness, the number of tries and the maximum wait | Prevents all clients from coming back at the same time, and endless waits |
| Send the exact code from the server, with `Retry-After` when limiting | A well-written client can then behave politely |
| Declare `Content-Type` (with `charset=utf-8` for text) and let the library compute `Content-Length` when possible | No byte counting by hand |
| Choose `Cache-Control` deliberately: `max-age` for static content, `no-cache` with `ETag` for dynamic content to recheck, `no-store` for sensitive content | The default behavior of caches is rarely the one you want |
| Test with `curl -i` before writing the client | You see exactly what the server sends |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A status code is read by its first digit: `2xx` success, `3xx` redirection, `4xx` client fault, `5xx` server fault. `Retry-After` (seconds or HTTP date) goes with `429` and `503` and tells when to come back; `Cache-Control`, `Location`, `Content-Type` and `Content-Length` control the cache, the destination and the reading of the body. `curl -i` lets you observe everything. |
| **Pitfalls to avoid** | Confusing `401` (not identified) and `403` (refused); returning `200` with an error in the body; retrying in a loop without waiting; reading only the seconds format of `Retry-After`; retrying a `4xx` or a non-idempotent `POST`; counting `Content-Length` in characters. |
| **Best practices** | Decide based on the code; retry only temporary errors (`429`, `503`), respecting `Retry-After`, otherwise exponential backoff with randomness, with the number of tries and the maximum wait capped; send the exact code and the right headers from the server; check with `curl -i`. |
