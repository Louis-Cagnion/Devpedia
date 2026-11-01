---
order: 24
---

# REST resource and HTTP Basic authentication (31/10/2026)

A program (a mobile app, a script, another server) that wants to read or change the data of a site goes through an [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http): a door into HTTP, made to be used by a program rather than by a person. This chapter answers two questions. How do you cleanly describe what the door exposes? That is the **REST resource**, which you declare as a [plugin](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) (an independent piece of code that registers itself in a central catalogue, the **registry**; the details come further down). How do you check who is knocking? That is **HTTP Basic authentication**, the simplest of all, and you need to know precisely what its limits are.

It assumes two prerequisites: the [method, address and status code](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) of an HTTP request, and the [difference between authentication and authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), which already presents HTTP Basic in one section. Here, we take it apart piece by piece, on a server that really runs. Because HTTP Basic sends the identifier with every request, the connection that carries it must be protected by TLS: what the option that disables verification cuts is explained in [Disabling TLS Verification: What the Option Really Turns Off](/?c=securite&s=cybersecurite&p=desactiver-la-verification-tls). An authorization header copied into a log is covered in [Personal data in logs and copies](/?c=securite&s=cybersecurite&p=donnees-personnelles-dans-les-journaux).

| Topic | Where it is covered |
|---|---|
| Method, address, status code | [Exchanging Data: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) |
| `401` versus `403`, first look at Basic | [Authentication vs Authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) |
| Contract, label and handler of a plugin | [Plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| CORS, rate limiting in general, key or token | [Web API Security](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Hashing, encryption, comparing a signature | [Applied Cryptography for Developers](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) and [Webhook Security](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |
| Where to store a password or a key | [Secrets Management](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| **Here** | The resource and its registry, Basic in detail, the demonstration that Base64 protects nothing, the constant-time comparison, limited attempts, choosing an alternative |

## What a REST resource is

**REST** is a style of organizing an API: the server exposes **resources**, each designated by an address, and the client acts on them with the usual HTTP methods. A **resource** is a "thing" that the server knows how to name: the list of articles, one specific article, a user. A **URL** (*Uniform Resource Locator*) is the web address that designates it, for example `/articles`. A **representation** is the text that the server returns to describe the resource, most often in [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (a text format that describes data with braces and name/value pairs).

The picture: the resource is a binder labelled `/articles` in a library. The methods are the actions allowed on that binder (read it, add a card, correct a card, remove a card). The representation is the photocopy handed to you, never the binder itself.

A **header** is a `Name: value` line placed before the content of a request or a response; it carries metadata (the format, the identity, the date). For example `Accept` gives the format the client wants, and `Content-Type` gives the format of the content being sent. The following diagram shows a complete exchange.

```
Client                                      Server
  |                                            |
  |  GET /articles                             |   method + URL
  |  Accept: application/json                  |   header: wanted format
  | -----------------------------------------> |
  |                                            |   the "articles" resource
  |  200 OK                                    |   is found, the GET method
  |  Content-Type: application/json            |   is allowed
  |  [{"id":1,"title":"First article"}]        |   representation (JSON)
  | <----------------------------------------- |
```

| Method | Action | Changes the data? | Repeatable without extra effect (idempotent)? | Typical success |
|---|---|---|---|---|
| `GET` | Read the resource | No | Yes | `200` |
| `POST` | Create an item in the collection | Yes | No: two sends create two items | `201` (created) |
| `PUT` | Replace an item entirely | Yes | Yes: same final state | `200` or `204` |
| `PATCH` | Correct part of an item | Yes | Depends on how it is written | `200` or `204` |
| `DELETE` | Delete an item | Yes | Yes: once deleted, it stays deleted | `204` (no content) |

A method is **idempotent** when sending it once or ten times leaves the data in the same final state. This matters as soon as a network cuts the response: the client can then resend the request without fearing a duplicate, except for `POST`.

| Address | Designates | Examples of useful methods |
|---|---|---|
| `/articles` | The collection (the list) | `GET` to list, `POST` to add |
| `/articles/2` | One specific item in the collection | `GET`, `PATCH`, `DELETE` |
| `/health` | A status resource of the service | `GET` only |

One last trait of REST, with heavy consequences here: the server is **stateless**. It does not keep in memory "the client who has just logged in": each request must carry everything needed to process it, **identity included**. That is exactly what HTTP Basic does, and the reason it fits so naturally with an API.

## Declaring a resource as a plugin

Without organization, an API server quickly looks like a central file where each new address adds one more case, with the flaw described in [the chapter on plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins): the central file has to know everyone. The **plugin** reverses the responsibility: each resource is an independent piece that **declares itself** to a **registry** (the central catalogue of known resources). The chapter cited details the contract, the label and the handler; here we only apply it.

```
   Declared resources                  Registry (catalogue)
  +----------------------+           +-----------------------------+
  | articles             |  declare  | id         path             |
  |  GET   permission    | --------> | articles   /articles        |
  |  POST  permission    |           | health     /health          |
  +----------------------+           +--------------+--------------+
  | health               |                          |
  |  GET   (public)      |      GET /articles request
  +----------------------+                          |
                                          1. find the resource by its path
                                          2. find the method in its rules
                                          3. check identity and permission
                                          4. run the rule, return the response
```

| Element of the declaration | Role | In this chapter's example |
|---|---|---|
| Identifier | Stable name of the resource in the registry | `articles` |
| Path | The URL that designates it | `/articles` |
| Methods | **Allowlist** of permitted methods (everything else is refused) | `GET`, `POST` |
| Permission per method | What the caller must have for this method | `read`, `write` |
| Execution rule | The function that produces the response | `respond` |

Two consequences are to be remembered. First, adding a resource changes no line of the central code: you declare it, that is all. Next, the list of methods is an **explicit contract**: a method absent from the declaration receives the response [`405 Method Not Allowed`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/405) ("method not permitted"), with an `Allow` header listing the accepted methods. What is not declared does not exist, which reduces the **attack surface** (the set of points through which the service can be attacked).

## The example server

To redo the steps, you need a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) Bash (Linux, macOS or WSL, see [basic commands](/?c=langages&s=bash&p=commandes-de-base)), [Node.js](https://nodejs.org/en/download) installed (the `node --version` command must print a number) and `curl`, a program shipped with Linux and macOS that sends HTTP requests. Create a working folder, save the code below into a file `rest-server.mjs` (the five parts one after another, in order), then start the server in a first terminal. The `curl` commands are typed in a **second** terminal, the first one staying busy with the server.

Everything that follows comes from a small server written in [JavaScript](/?c=langages&s=javascript&p=javascript) with the `node:http` module of [Node.js](https://nodejs.org/api/http.html) (the environment that runs JavaScript outside a browser). It listens on port `7312` (a **port** is the number of a computer's door on which a program listens) on address `127.0.0.1`: the address of your own machine, also called `localhost`, as in [the local server](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement). The file is split into five parts; each notation in the code is explained in a comment at its first appearance, with a pointer to the chapter that details it when one exists: [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions), [objects](/?c=langages&s=javascript&p=objets), [arrays](/?c=langages&s=javascript&p=tableaux), [errors](/?c=langages&s=javascript&p=gestion-des-erreurs), [asynchronous programming](/?c=langages&s=javascript&p=asynchrone) and [regex](/?c=langages&s=javascript&p=regex) (regular expressions).

**Part 1: the accounts.** The server never keeps a readable password: it keeps a **salt** (a random value specific to each account, which makes every result unique) and a **digest** (the result of hashing with `scrypt`, a deliberately slow hash function, see [passwords and hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). Salt and digest are measured in **bytes** (a byte is a group of 8 bits, see [integers and bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)). `alice` may only read, `bruno` can read and write.

```javascript
// A module is a reusable code file (hence the .mjs extension); import loads it.
import http from 'node:http';                       // HTTP server built into Node
// A byte is a group of 8 bits (a bit is 0 or 1), so a value from 0 to 255.
// A Buffer is a sequence of raw bytes.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'; // hashing

// ---------- Part 1: the accounts ----------
// const names a value; (a, b) => { ... } is a function; return gives back its result.
const createAccount = (password, permissions) => {  // builds a registered account
  const salt = randomBytes(16);                      // salt: 16 random bytes of the account
  // The Sync suffix of scryptSync: the program waits for the computation to finish first.
  const digest = scryptSync(password, salt, 32);     // slow hash, 32 bytes
  return { salt, digest, permissions };              // { a, b } is the object { a: a, b: b }
};                                                   // never the password itself

// new Map([...]) creates a dictionary: it associates a key with a value.
// Each [key, value] is an array (a list) of two cells.
const ACCOUNTS = new Map([                           // username => account
  ['alice', createAccount('reading-ok', ['read'])],  // alice can only read
  ['bruno', createAccount('writing-ok', ['read', 'write'])], // bruno reads and writes
]);
const DUMMY_ACCOUNT = createAccount('unused', []);   // used if the username is unknown
```

**Part 2: HTTP Basic authentication.** `readCredentials` decodes the header; `authenticate` checks the password. Each line will be picked up again in the following sections.

```javascript
// ---------- Part 2: HTTP Basic authentication ----------
// function name(parameter) { ... } declares a function; null means "no value".
function readCredentials(header) {                   // header: value of Authorization
  // The regular expression /.../i is a search pattern: ^ start of the text, \s+ some
  // spaces, (\S+) a group of non-blank characters, $ end of the text, i case ignored.
  // exec returns null if the text does not match the pattern.
  // a ?? b is a, unless a is null or undefined (absent): then b.
  const match = /^basic\s+(\S+)$/i.exec(header ?? ''); // "Basic" scheme, case ignored
  if (match === null) return null;                   // other scheme, or missing header
  // match[1] is the text of the group (\S+). Base64 is a way of writing bytes with 64
  // characters (see below): Buffer.from(text, 'base64') decodes it into bytes, then
  // .toString('utf8') reads these bytes back as text.
  const decoded = Buffer.from(match[1], 'base64').toString('utf8'); // base64 -> text
  const position = decoded.indexOf(':');             // rank of the FIRST ":" (-1 if absent)
  if (position < 0) return null;                     // no ":": malformed header
  return {
    // slice(a, b) extracts the text from position a (included) to position b (excluded)
    username: decoded.slice(0, position),            // before the first ":"
    password: decoded.slice(position + 1),           // the rest, other ":" included
  };
}

function authenticate(header) {                      // returns the account, or null
  const parsed = readCredentials(header);            // username and password received
  if (parsed === null) return null;                  // unusable header
  const known = ACCOUNTS.has(parsed.username);       // has: does the key exist?
  // get reads the value attached to the key; otherwise, the dummy account
  const account = ACCOUNTS.get(parsed.username) ?? DUMMY_ACCOUNT;
  const candidate = scryptSync(parsed.password, account.salt, 32); // same cost in all cases
  // timingSafeEqual compares two Buffers in constant time (explained below)
  const equal = timingSafeEqual(candidate, account.digest);
  // a && b: "a and b"; test ? x : y is x if test is true, otherwise y;
  // ...account copies all the properties of account into the new object.
  return known && equal ? { username: parsed.username, ...account } : null;
}
```

**Part 3: limiting attempts.** A counter of failures per [IP address](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) (the number that identifies a machine on a network), kept on the server side, within a window of sixty seconds.

```javascript
// ---------- Part 3: limiting attempts ----------
const FAILURES = new Map();                          // IP address => { count, start }
const MAX_FAILURES = 3;                              // failures tolerated per window
const WINDOW_MS = 60_000;                            // 60 s in ms (the _ is a separator)

function blocked(address) {                          // has this address failed too often?
  const e = FAILURES.get(address);                   // its history, otherwise undefined
  // Date.now() is the current time in milliseconds; !== means "different from".
  const recent = e !== undefined && Date.now() - e.start < WINDOW_MS; // inside the window?
  return recent && e.count >= MAX_FAILURES;          // true if the ceiling (>=) is reached
}

function recordFailure(address) {                    // records one more failure
  const e = FAILURES.get(address);                   // its history, if it exists
  if (e === undefined || Date.now() - e.start >= WINDOW_MS) {
    FAILURES.set(address, { count: 1, start: Date.now() }); // set: new window
  } else {
    e.count += 1;                                    // += 1: adds 1 to the counter
  }
}
```

**Part 4: the resource registry.** Two resources are declared: `articles` (protected, two methods) and `health` (public, one method).

```javascript
// ---------- Part 4: the resource registry ----------
const REGISTRY = new Map();                          // identifier => declared resource
// r.id reads the id property of r; set(key, value) adds an entry to the dictionary.
const declare = (r) => REGISTRY.set(r.id, r);        // adds a resource to the registry
// [ ... ] is an array (a list); { key: value } is an object.
const ARTICLES = [{ id: 1, title: 'First article' }]; // in-memory data (demo)

declare({
  id: 'articles',                                    // stable identifier of the resource
  path: '/articles',                                 // the URL that designates it
  methods: {                                         // HTTP method => rule
    // () => ARTICLES: function with no parameter that returns ARTICLES
    GET: { permission: 'read', respond: () => ARTICLES }, // reading: "read" permission
    POST: {
      permission: 'write',                           // creation: "write" permission
      respond: (body) => {                           // body: the JSON received
        const title = String(body.title ?? '');      // String(x) forces a text
        const article = { id: ARTICLES.length + 1, title }; // length: number of items
        ARTICLES.push(article);                      // push adds the article at the end
        return article;                              // returns the created article
      },
    },
  },
});
declare({
  id: 'health',                                      // service status resource
  path: '/health',                                   // its URL
  methods: { GET: { permission: null, respond: () => ({ status: 'ok' }) } }, // public
});
```

**Part 5: the server.** `check` chains the identity checks; the main handler looks up the resource, then the method, then runs the rule; status codes such as `404` (resource not found) are presented in [Exchanging Data: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). The [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) format is used for bodies: `JSON.stringify` turns an object into JSON text, `JSON.parse` does the reverse.

```javascript
// ---------- Part 5: the server ----------
// headers = {}: default value if omitted; ...headers copies its properties.
function respond(res, status, body, headers = {}) {  // writes a JSON response
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers }); // code, headers
  res.end(JSON.stringify(body));                     // end sends the body as JSON text
}

// async: the function can wait (await) for a result that has not arrived yet,
// without blocking the program; for await reads the request stream chunk by chunk.
// Pitfall: no size limit here; a real server refuses a body that is too big.
async function readBody(req) {                       // reads the JSON body of a request
  let text = '';                                     // let: modifiable value (text read)
  for await (const chunk of req) text += chunk;      // reads the stream to the end
  return text === '' ? {} : JSON.parse(text);        // empty text: empty object
}

function check(req, res, rule) {                     // returns true if the request passes
  const address = req.socket.remoteAddress;          // IP address of the caller
  if (blocked(address)) {                            // too many recent failures
    // 429: too many requests; Retry-After: how many seconds to wait
    respond(res, 429, { error: 'too many attempts' }, { 'Retry-After': '60' });
    return false;
  }
  // Node writes header names in lowercase: authorization is the Authorization header.
  const account = authenticate(req.headers.authorization); // checks the header
  if (account === null) {                            // absent or invalid: the challenge
    if (req.headers.authorization !== undefined) recordFailure(address); // real attempt
    respond(res, 401, { error: 'authentication required' },
      { 'WWW-Authenticate': 'Basic realm="demo", charset="UTF-8"' });
    return false;
  }
  // includes: does the array contain this permission? ! means "not".
  if (!account.permissions.includes(rule.permission)) { // identified, but not allowed
    respond(res, 403, { error: 'missing permission' });
    return false;
  }
  return true;                                       // identified and allowed
}

// createServer receives the function to call for each request; req is the request received,
// res the response to write.
const server = http.createServer(async (req, res) => {
  // new URL(address, base) splits an address; pathname is its path, without parameters.
  const path = new URL(req.url, 'http://x').pathname;
  // res.on('finish', f) calls f when the response is sent; console.log writes a line
  // in the terminal; `...${x}...` (backticks) inserts the value of x into the text.
  res.on('finish', () => console.log(`${req.method} ${path} -> ${res.statusCode}`));
  // [...REGISTRY.values()] builds a list of the resources; find(f) returns the first
  // element for which f is true, otherwise undefined.
  const resource = [...REGISTRY.values()].find((r) => r.path === path);
  // 404: resource not found
  if (resource === undefined) return respond(res, 404, { error: 'unknown resource' });
  const rule = resource.methods[req.method];         // the rule of this method
  if (rule === undefined) {                          // undeclared method
    // Object.keys lists the names of the properties; join(', ') assembles them into a text
    const allowed = Object.keys(resource.methods).join(', ');
    return respond(res, 405, { error: 'method refused' }, { Allow: allowed });
  }
  if (rule.permission !== null && !check(req, res, rule)) return; // protected
  // try { ... } catch { ... }: if an error occurs in try, the program jumps to catch
  try {
    const body = req.method === 'POST' ? await readBody(req) : {}; // body of writes
    respond(res, req.method === 'POST' ? 201 : 200, rule.respond(body));
  } catch {
    respond(res, 400, { error: 'invalid JSON' });    // unreadable body
  }
});

server.listen(7312, '127.0.0.1');                    // local port only
```

The server is started in the first terminal with `timeout 100 node rest-server.mjs`, the `timeout` command (shipped with Linux) stopping it on its own after one hundred seconds; without `timeout` (on macOS for example), run `node rest-server.mjs` and stop it with Ctrl+C. It logs one line per request (method, path, response code) and **never** the identity header, a choice that matters, and that we come back to.

## The HTTP Basic exchange, request by request

The method is described by the [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) standard (an **RFC**, *Request for Comments*, is a reference document that defines an Internet standard). The client used is `curl`, the terminal program that sends HTTP requests (see the [curl documentation](https://curl.se/docs/manpage.html)). In the blocks that follow, the `$` at the start of a line is the terminal prompt: it is read but not typed, and the lines without `$` are the displayed response. The `Date`, `Connection`, `Keep-Alive` and `Transfer-Encoding` lines, of no interest here, have been removed from the copied outputs.

| `curl` option | Effect |
|---|---|
| `-i` | Displays the response headers before its content |
| `-s` | Silent: removes the progress bar |
| `-u username:password` | Supplies the credentials (curl builds the `Authorization` header) |

Other options are explained where they are first used (`-v`, `-o`, `-X`, `-d`, `-w`, `--anyauth`, `--netrc-file`).

```
Client                                         Server
  |  GET /articles                                |
  | --------------------------------------------> |  no Authorization header
  |  401 Unauthorized                             |
  |  WWW-Authenticate: Basic realm="demo"         |  the challenge: "prove who you are"
  | <-------------------------------------------- |
  |  GET /articles                                |
  |  Authorization: Basic YWxpY2U6cmVhZGlu...     |  username:password in Base64
  | --------------------------------------------> |
  |  200 OK  + representation                     |  identity verified, permission present
  | <-------------------------------------------- |
```

**Without credentials.** The request carries no `Authorization` header:

```
$ curl -i http://127.0.0.1:7312/articles
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"error":"authentication required"}
```

The `401` code is the answer "I do not know who you are." The `WWW-Authenticate` header is the **challenge**: it names the expected method (`Basic`), the `realm` (the name of the protected area, which the browser displays in its login window) and the character set of the credentials (`UTF-8`, the standard that encodes accented letters, see [text encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

**With a wrong password.**

```
$ curl -i -u alice:wrong http://127.0.0.1:7312/articles
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"error":"authentication required"}
```

The response is **identical** to the previous one, and that is intended: it does not say whether the username exists, whether the password is wrong or whether the header is malformed. A more talkative message ("wrong password for alice") would confirm to an attacker that `alice` is a real account: this is **account enumeration**, which consists in drawing up the list of valid usernames in order to then concentrate the attacks on them.

**With the right credentials.**

```
$ curl -i -u alice:reading-ok http://127.0.0.1:7312/articles
HTTP/1.1 200 OK
Content-Type: application/json

[{"id":1,"title":"First article"}]
```

Here is the anatomy of the header that `curl` has just sent:

| Step | Result for `alice` and `reading-ok` |
|---|---|
| 1. Join `username:password` with a colon | `alice:reading-ok` |
| 2. Encode this text in bytes (UTF-8) then in Base64 | `YWxpY2U6cmVhZGluZy1vaw==` |
| 3. Prefix with the word `Basic` and a space | `Basic YWxpY2U6cmVhZGluZy1vaw==` |
| 4. Place the whole in the `Authorization` header | `Authorization: Basic YWxpY2U6cmVhZGluZy1vaw==` |

The first colon separates the username from the password, hence a rule of the standard: **a username cannot contain a colon**, whereas a password can. This is the reason for `decoded.indexOf(':')` in part 2, which cuts at the first colon only.

### Who sends the header, and when

In the output above, `curl -u` sent the header **straight away**, without waiting for the challenge. A browser, on the other hand, does not know the credentials yet: it sends a bare request, receives the `401` and its `WWW-Authenticate`, displays its login window, then resends the request with the header. The `--anyauth` option of `curl` reproduces this behavior. To see the exchanges, add `-v` (*verbose*: displays every line sent and received; `-sv` combines `-s` and `-v`) and `-o /dev/null` (`-o` writes the content of the response into a file, and `/dev/null` is the Linux "trash" file that discards everything, to keep only the trace). The trace shows the two round trips:

```
$ curl -sv --anyauth -u bruno:writing-ok http://127.0.0.1:7312/articles -o /dev/null
> GET /articles HTTP/1.1
< HTTP/1.1 401 Unauthorized
< WWW-Authenticate: Basic realm="demo", charset="UTF-8"
> GET /articles HTTP/1.1
> Authorization: Basic YnJ1bm86d3JpdGluZy1vaw==
< HTTP/1.1 200 OK
```

(Lines beginning with `>` are sent by the client, those with `<` are received. Only the useful lines have been kept.)

| Client | First send | Consequence |
|---|---|---|
| `curl -u` | With the `Authorization` header | One round trip, but the password leaves even toward a server that did not ask for it |
| `curl --anyauth`, browser | Without a header, then resend after the `401` | Two round trips, the password only leaves if the server asks for it |

## Base64 is not encryption

The chapter on [authentication and authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) asserts it; here is the proof. **Base64** is a way of writing bytes with only 64 safe characters (letters, digits, `+` and `/`), so that they pass unharmed through protocols made for text. Three bytes become four characters; one or two `=` at the end of the text complete the last group (the **padding**). There is no key, no secret, no hard computation: it is a lookup table.

What an observer sees pass by, when replaying the request with `curl -v`:

```
$ curl -sv -u alice:reading-ok http://127.0.0.1:7312/articles -o /dev/null
> GET /articles HTTP/1.1
> Authorization: Basic YWxpY2U6cmVhZGluZy1vaw==
```

And what the observer then does, without any key, with the `base64` command (shipped with Linux; `-d` means *decode*). `echo 'text'` prints the text; `printf` does the same without adding a final newline, which would change the Base64; the **pipe** `|` sends what the command on the left prints to the command on the right (see [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes)):

```
$ echo 'YWxpY2U6cmVhZGluZy1vaw==' | base64 -d
alice:reading-ok
$ printf 'alice:reading-ok' | base64
YWxpY2U6cmVhZGluZy1vaw==
```

The username **and** the password appear in clear, and the reverse path gives back exactly the text sent. The same decoding is written in Node with `Buffer.from(text, 'base64').toString('utf8')`, which is what the line `Buffer.from(match[1], 'base64')` of part 2 does: the server itself needs no secret to read the header, so neither does anyone else.

| | Encoding (Base64) | Hashing | Encryption |
|---|---|---|---|
| Reversible? | Yes, by anyone | No | Yes, with the key only |
| Key or secret? | None | None (sometimes a salt) | Yes |
| Purpose | Pass bytes through text | Verify or compare without storing the data | Make it unreadable for those without the key |
| Protects a password in transit? | **No** | No (the server must receive the password) | Yes, this is the role of TLS |

The distinction between hashing and encryption is developed in [Applied Cryptography for Developers](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

### The only protection: HTTPS

**HTTPS** is HTTP inside a tunnel encrypted by **TLS** (*Transport Layer Security*, the protocol that encrypts the connection between client and server; see [the TLS certificate](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). With HTTPS, the `Authorization` header is encrypted along with the rest of the request. The **certificate** is the digital identity card of the server, which the client checks: without this check, an intermediary can pose as the server and read what the client sends it.

```
HTTP (port 80)                                  HTTPS (port 443)

Client -- Authorization: Basic YWxp... -->      Client -- unreadable bytes (TLS) -->
          ^                                               ^
   readable by every machine on the route          only the server can read them
   (public Wi-Fi, router, proxy...)                (if the certificate is verified)
```

> **Pitfall:** redirecting `http://` to `https://` while believing the problem is solved. A client such as `curl -u` sends the header in the **first** request, so in clear, before even reading the redirect. The password has already travelled.
>
> **Best practice:** do not listen at all on plain HTTP for an API that accepts Basic (or refuse any request that carries an `Authorization` outside TLS), and consider as compromised any password that has ever circulated without TLS.

The example server listens on plain HTTP because it only answers on `127.0.0.1` (your own machine), where nothing travels over a network: it is a demonstration compromise, never a deployment model.

## The limits specific to HTTP Basic

These limits are not defects of one implementation: they follow from the principle of Basic.

| Limit | Why | Concrete consequence |
|---|---|---|
| No logout | The server keeps no session to close; the client resends the credentials as long as it knows them | Closing a tab is not always enough, and the server cannot "kick out" a client without changing the password |
| Credentials sent with **every** request | Stateless server: the identity travels with each send | Each request is an opportunity for a leak, and each request reruns the verification computation |
| No expiry | The password is valid until it is changed | A stolen identifier stays usable for months |
| Main secret exposed | It is the real password of the account that travels, not a disposable token | A leak also compromises the other uses of the account |
| No second factor | One secret, sent in a single message | Impossible to require a temporary code (see [multi-factor authentication](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)) |
| Unintended traces | The header can be copied by intermediate tools | See the diagram below |

```
 Developer's machine             Network                    Server
+--------------------+     +----------------+     +----------------------+
| shell history      |     | proxy, fire-   |     | access log           |
| (curl -u a:pwd)    | --> | wall which     | --> | (if the header is    |
| debugging tool     |     | logs           |     | copied there),       |
| screenshot         |     | traffic        |     | monitoring tool,     |
+--------------------+     +----------------+     | backup copy          |
                                                  +----------------------+
 Each box can keep a copy of the password.
```

A **proxy** is an intermediate server through which requests pass (often in a company), a **firewall** a device that filters network traffic; a **log** is the file where a program notes what happened, see [centralized logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs). The example server only writes `GET /articles -> 401`: there is nothing to leak. A server configured to copy all the headers into its logs, on the other hand, deposits valid passwords there.

The terminal is the most overlooked case: typing `curl -u alice:reading-ok ...` writes the password into the command history, and also leaves it visible for a moment in the list of running programs (the `ps` command displays it, with the arguments of each). A credentials file read by `curl` avoids both. Its format is that of **netrc** files (see the [`--netrc-file`](https://curl.se/docs/manpage.html#--netrc-file) option of curl): `machine` is the name or address of the server concerned, `login` the username and `password` the password. Create this file with a text editor (creating it with `echo` would put the password back into the history):

```
$ cat netrc-demo
machine 127.0.0.1 login alice password reading-ok
$ chmod 600 netrc-demo
$ curl -si --netrc-file netrc-demo http://127.0.0.1:7312/articles | head -1
HTTP/1.1 200 OK
```

`cat` displays the content of a file. `chmod 600` reserves the file to its owner (see [file permissions](/?c=langages&s=bash&p=permissions-et-fichiers)). `head -1` keeps only the first line of the response, here the status line (see [basic commands](/?c=langages&s=bash&p=commandes-de-base) and [pipes](/?c=langages&s=bash&p=redirections-et-pipes)). For a real deployment, the secret stays in no file of the repository: see [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

## Authentication and authorization: two separate checks

The server chains its checks in a precise order, which the `check` function of part 5 embodies:

```
request
   |
   v
known resource?  -- no --> 404 Not Found (missing)
   |
   v
declared method? -- no --> 405 Method Not Allowed (+ Allow)
   |
   v
protected resource? -- no --> execute
   |
   v
too many recent failures? -- yes --> 429 Too Many Requests (+ Retry-After)
   |
   v
valid identity?   -- no --> 401 Unauthorized (+ WWW-Authenticate)
   |
   v
permission present? -- no --> 403 Forbidden
   |
   v
execute the rule -> 200 or 201
```

The real responses for four cases: `alice` (permission `read` only) tries to write, `bruno` (permission `write`) writes, `bruno` tries an undeclared method, and a call without credentials targets the public resource `/health`. New `curl` options: `-X METHOD` chooses the HTTP method, `-d 'text'` supplies the body of the request. In the shell, a `\` at the end of a line means the command continues on the next line, where the terminal then displays the `>` prompt (not to be typed).

```
$ curl -i -u alice:reading-ok -X POST -d '{"title":"Intruder"}' http://127.0.0.1:7312/articles
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"error":"missing permission"}

$ curl -i -u bruno:writing-ok -X POST -d '{"title":"Second article"}' \
>   http://127.0.0.1:7312/articles
HTTP/1.1 201 Created
Content-Type: application/json

{"id":2,"title":"Second article"}

$ curl -i -u bruno:writing-ok -X DELETE http://127.0.0.1:7312/articles
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json
Allow: GET, POST

{"error":"method refused"}

$ curl -i http://127.0.0.1:7312/health
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok"}
```

`alice` is fully authenticated in the first case (her password is right) and yet refused: the `403` signals that the server knows who she is and refuses her this action. Even with the broadest rights, `bruno` cannot call a method that the resource does not declare. Finally, `/health` declares `permission: null`: the resource is **public** by a choice written in black and white, not by oversight.

| Code | Question it answers | Fixed by... |
|---|---|---|
| `401` | Who are you? | Providing valid credentials |
| `403` | Are you allowed to do this? | Changing the permissions, never the password |
| `405` | Does this method exist on this resource? | Using a method from the `Allow` list |
| `429` | Did you try too often? | Waiting for the duration of `Retry-After` |

To group permissions into profiles, see [RBAC and ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac). One point to choose consciously: in this example, the `404` and `405` checks come before authentication, so an unknown caller learns which addresses and which methods exist. For an API where this information is itself sensitive, you authenticate first and answer `401` everywhere.

## Comparing secrets in constant time

Comparing the password received with the one expected seems trivial: `received === expected`. But the equality operator of a language stops at the **first difference**. The more the two texts resemble each other at the start, the longer the comparison takes. The following small program counts the characters examined by a classic comparison:

File `comparison.mjs` (save it in the same folder, then run it with `node comparison.mjs`):

```javascript
import { timingSafeEqual } from 'node:crypto';          // constant-time comparison

// Math.min(x, y) is the smaller of the two numbers; a[i] is the character at rank i
// (the first has rank 0); a.length is the number of characters in the text a.
function compareNaive(a, b) {                           // "classic" comparison
  let compared = 0;                                     // characters examined so far
  // for (start; condition; step) repeats while the condition is true; i++ adds 1 to i
  for (let i = 0; i < Math.min(a.length, b.length); i++) { // from first to last
    compared += 1;                                      // one more character examined
    if (a[i] !== b[i]) return { equal: false, compared }; // stop at the first difference
  }
  return { equal: a.length === b.length, compared };    // all identical: same length?
}

const secret = 'reading-ok';                            // the secret to guess
// for (const x of list) repeats the block for each element of the list
for (const attempt of ['xxxxxxxxxx', 'rxxxxxxxxx', 'readingxxx', 'reading-ok']) {
  const r = compareNaive(attempt, secret);              // result of the naive comparison
  console.log(attempt, '->', r.equal, '| characters examined:', r.compared);
}

// try { ... } catch (error) { ... }: if try throws an error, catch receives it
try {
  timingSafeEqual(Buffer.from('abcd'), Buffer.from(secret)); // 4 bytes against 10
} catch (error) {
  console.log(error.code);                              // the function refuses to compare
}
```

Result obtained at execution (the first four lines for the classic comparison, the last one for `timingSafeEqual`):

```
$ node comparison.mjs
xxxxxxxxxx -> false | characters examined: 1
rxxxxxxxxx -> false | characters examined: 2
readingxxx -> false | characters examined: 8
reading-ok -> true | characters examined: 10
ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH
```

The duration of the comparison **reveals** the length of the exact prefix. A **timing attack** exploits this: the attacker sends a very large number of attempts, measures the response times, and discovers the secret character by character. Across a network the measurement is noisy and the attack needs many attempts; it becomes realistic on a local network or with enough repetitions, and the defence costs almost nothing, so it is always applied.

| Language | Constant-time comparison | Precaution |
|---|---|---|
| Node.js | `crypto.timingSafeEqual(a, b)` (see the [Node documentation](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)) | Requires two `Buffer`s of the **same size**, otherwise it raises an error |
| PHP | [`hash_equals($expected, $received)`](https://www.php.net/manual/en/function.hash-equals.php) | Put the trusted value as the first argument |
| Python | [`hmac.compare_digest(a, b)`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) | Two texts or two byte sequences of the same type; for texts, the documentation limits them to ASCII characters (unaccented letters, digits, basic punctuation) |

The same reflex applies to the signatures of [webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) and of [HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

The pitfall specific to `timingSafeEqual` is its size requirement: comparing a 4-character password with a 10-character secret raises an error (the last line above, `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`), and this error gives away the length of the secret.

The defence, applied in part 2: we **never compare the passwords themselves**, but their `scrypt` digests, always 32 bytes. The attacker does not control the start of the digest (one more character in the attempt changes the whole digest), so even a naive comparison would teach them nothing; `timingSafeEqual` adds one more guarantee.

Second detail of part 2: when the username is unknown, the server **still** computes a digest, against a `DUMMY_ACCOUNT`. Without this, a non-existent username would be refused instantly and a real one only after a slow computation, which would allow account enumeration by measuring the times. This deliberate slowness of `scrypt` has a cost: each attempt consumes processor time, which feeds [overload attacks](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). This is why the failure count check comes **before** the computation.

## Limiting attempts

An attacker who can try a password every millisecond will try millions: this is **brute force**, the methodical trial of a very large number of values until one is right. The server therefore counts the failures per IP address (part 3) and, beyond three within a window of sixty seconds, answers `429 Too Many Requests` ("too many requests") with a `Retry-After: 60` header ("retry in sixty seconds"). Three wrong attempts in a row, then the **right** password. The first command is a [loop](/?c=langages&s=bash&p=boucles): `for i in 1 2 3; do ...; done` repeats what lies between `do` and `done`, giving `i` the values 1, 2, then 3, and `$i` inserts that value. The `-w "attempt $i : %{http_code}\n"` option asks `curl` to display, after the response, this text in which `%{http_code}` is replaced by the status code and `\n` is a line break; `-o /dev/null` discards the content of the response.

```
$ for i in 1 2 3; do curl -s -o /dev/null -w "attempt $i : %{http_code}\n" \
>   -u alice:wrong$i http://127.0.0.1:7312/articles; done
attempt 1 : 401
attempt 2 : 401
attempt 3 : 429

$ curl -i -u alice:reading-ok http://127.0.0.1:7312/articles
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{"error":"too many attempts"}
```

(A first wrong attempt had already been counted higher up in the session: the counter therefore reaches three at the second attempt of the burst, and the third is refused before any verification. Requests **without** an `Authorization` header, the normal first exchange of the challenge, do not count.) Even the right password stays refused as long as the window has not elapsed: that is the rule, and it is what makes massive password guessing impractical.

| Counter key | Protects against | Risk |
|---|---|---|
| By IP address | An attacker who tries many accounts from one machine | Several users behind the same address (a company) block each other; an attacker who changes address gets around it |
| By account | An attacker who targets one account from many addresses | They can **deliberately lock** a legitimate account by failing on purpose: this is a **denial of service** (making a service unusable for others, see [overload and denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Both, with different ceilings | Both scenarios | More rules to tune and to monitor |

Four pitfalls specific to this implementation, all real in production:

| Pitfall | Why | Remedy |
|---|---|---|
| Server placed behind a reverse proxy (a front server that receives the requests in its place and forwards them) | `remoteAddress` is then the address of the proxy, for all clients: everyone shares a single counter | Read the original address that the proxy passes in the [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For) header, and only if the proxy is trusted (otherwise any client can write the address of its choice) |
| Counter kept in the memory of the process | Lost at every restart, and specific to each instance if several run | A shared store: a database, or a **cache** (a fast memory that keeps data already obtained) |
| Counter that never empties | It durably blocks a legitimate user | A window, as here, or a delay that grows |
| Counter kept on the client side | The client can simply ignore it | Always on the server side, see [web API security](/?c=securite&s=cybersecurite&p=securite-api-web) |

## Alternatives to HTTP Basic

| Mechanism | What travels with each request | Expires? | Revocable on its own? | Suitable for | Chapter |
|---|---|---|---|---|---|
| HTTP Basic | Username and **password** | No | No (the password must be changed) | Internal script, admin tool, behind HTTPS | This chapter |
| API key | A long secret value tied to an account or an application | Rarely | Yes, you delete the key | A third-party service, server-to-server access | [Web API Security](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Session and cookie | A session identifier chosen by the server | Yes | Yes, the server forgets the session | A human user in a browser | [Sessions and Cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Signed token (JWT) | A token that contains its own information | Yes | With difficulty before expiry | An API consumed by an application | [JWT and Tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) |
| OAuth 2.0 | An access token issued by an authorization server | Yes | Yes | Giving limited access to a third-party application without sharing the password | [OAuth 2.0 and OpenID Connect](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |
| HMAC signature | A signature computed with a shared secret | With a timestamp (the date and time are included in the signature) | Yes, you change the secret | A system calling another, such as a webhook | [Webhook Security](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |

| Situation | Reasonable choice |
|---|---|
| An internal backup script calls an admin API over HTTPS | Basic with a **dedicated** account, minimal permissions, and a long password drawn at random (see [randomness](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) |
| A mobile app calls the API on behalf of a user | A time-limited token, never the user's password in every request |
| A third-party site must read a user's data | OAuth 2.0 |
| A partner sends automatic events | HMAC signature |

## Drupal example: the REST module and the `basic_auth` provider

> **This example is specific to Drupal, and its form depends on the version.** [Drupal](https://www.drupal.org) is a content management system written in [PHP](/?c=langages&s=php&p=php) (software for building and administering a website). It was not installed in the environment used to write this chapter: the PHP code below has therefore not been run, only checked for its syntax (with `php -l`, the PHP command that checks a file without running it). The proper names specific to Drupal have been checked against its official documentation ([api.drupal.org](https://api.drupal.org), branch 11.x, and [drupal.org](https://www.drupal.org/docs/drupal-apis/restful-web-services-api)). The most version-sensitive point is how the plugin is declared: a PHP **attribute** `#[RestResource]` in recent versions (the Drupal 10.3 and 11 API documentation presents it this way), an **annotation** `@RestResource` in older versions (Drupal 8 to 10). Check your site's version before copying. The rest of the chapter does not depend on it.

Drupal offers the same building blocks, under other names. A resource there is a **plugin** (see [plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins), which precisely cites the API resources among the plugin types of this software) whose label is the `#[RestResource]` attribute placed just above the class.

| Concept of the chapter | Drupal element |
|---|---|
| The resource registry | The plugin manager of REST resources, fed by the classes of the `Plugin/rest/resource` folder of a module |
| The declaration of a resource | A class that extends `ResourceBase`, labelled by the attribute `#[RestResource(id, label, uri_paths)]` (or, before, by the annotation `@RestResource(...)`) |
| The `GET` and `POST` methods | The PHP methods `get()` and `post()` of the class (likewise `patch()` and `delete()`) |
| The enabled methods and formats, the accepted authentication | A configuration `rest.resource.<id>` that lists `methods`, `formats` and `authentication`; without it, the resource is not available |
| The Basic authentication provider | The `basic_auth` module, referenced by the identifier `basic_auth` |
| The permissions per method | Permissions that `ResourceBase` generates for each method, in the form `restful get example_articles`, to be assigned to roles |

```php
<?php

namespace Drupal\example_api\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup; // a translatable text
use Drupal\rest\Attribute\RestResource;   // the attribute that declares the resource
use Drupal\rest\Plugin\ResourceBase;      // base class of REST resources
use Drupal\rest\ResourceResponse;         // the response returned by a resource

/**
 * Exposes a list of example articles.
 */
#[RestResource(
  id: 'example_articles',
  label: new TranslatableMarkup("Example articles"),
  uri_paths: [
    'canonical' => '/api/example/articles',
    'create' => '/api/example/articles',
  ],
)]
class ArticlesResource extends ResourceBase {

  /**
   * Responds to GET: returns the list.
   */
  public function get(): ResourceResponse {
    $articles = [['id' => 1, 'title' => 'First article']];  // sample data
    return new ResourceResponse($articles);                 // 200 and the list in JSON
  }

  /**
   * Responds to POST: creates an article.
   */
  public function post(array $data): ResourceResponse {
    // ?? : the left value, unless it is absent; (string) forces a text
    $title = (string) ($data['title'] ?? '');               // reads the title received
    return new ResourceResponse(['id' => 2, 'title' => $title], 201); // 201: created
  }

}
```

A PHP **attribute** is a special `#[...]` line, placed just before the class, which the plugin manager reads to discover the resource: `id` names it, `label` gives its readable name, `uri_paths` associates the resource with its addresses (`canonical` for one item, `create` for creation). `namespace` places the class in a namespace, `use` imports a class from another namespace, and `extends` makes it inherit from `ResourceBase`, see [object-oriented programming in PHP](/?c=langages&s=php&p=poo). In an older version of Drupal, the same declaration is written with an **annotation**, a special comment above the class, without the `use` of `RestResource` nor that of `TranslatableMarkup` (the latter becomes `@Translation`):

```php
/**
 * Exposes a list of example articles.
 *
 * @RestResource(
 *   id = "example_articles",
 *   label = @Translation("Example articles"),
 *   uri_paths = {
 *     "canonical" = "/api/example/articles",
 *     "create" = "/api/example/articles"
 *   }
 * )
 */
```

The second piece enables the resource and chooses its authentication. It is a configuration file in [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) format (a text format based on indentation), with the same structure as the configuration of the `entity.node` resource supplied with Drupal's REST module:

```yaml
id: example_articles          # identifier of the configuration
plugin_id: example_articles   # the resource plugin it activates
status: true                  # the resource is enabled
granularity: resource         # one setting for the whole resource (not per method)
configuration:
  methods:                    # allowlist of enabled methods
    - GET
    - POST
  formats:                    # accepted representations
    - json
  authentication:             # accepted authentication providers
    - basic_auth
```

Three cautionary remarks. First, this configuration is only valid if the `basic_auth` module is enabled. Next, Drupal's `basic_auth` provider already applies its own limit on failed attempts (the "flood" service, set by the `user.flood` configuration: ceilings and durations per IP address and per account, in the code of branch 11.x): before writing by hand the limit seen above, check these settings. Finally, the format of the response is chosen in the address: Drupal's documentation states that the `Accept` header is no longer supported and that the `_format` parameter must always be used, hence a call of the form `curl -u username:password 'https://example.test/api/example/articles?_format=json'` (`example.test` is an example name), with exactly the same limits as above: transparent Base64, mandatory HTTPS, the account password with every request. For the official documentation, see [the RESTful Web Services API of Drupal](https://www.drupal.org/docs/drupal-apis/restful-web-services-api).

## Pitfalls

| Pitfall | Why it is a problem | Reflex |
|---|---|---|
| Believing that Base64 protects the credentials | Anyone decodes it with one command, without a key | HTTPS mandatory, never Basic in clear |
| Redirecting `http://` to `https://` | The first send has already exposed the password | Do not listen on HTTP, or refuse any `Authorization` outside TLS |
| Comparing the secret with `===` or `==` | The duration of the comparison reveals the exact prefix | `timingSafeEqual`, `hash_equals` or `compare_digest` |
| `timingSafeEqual` on different sizes | The error raised reveals the length | Compare fixed-size digests |
| Error message stating "wrong password" or "unknown account" | Allows drawing up the list of valid accounts | A single `401` answer for all the failures |
| Unknown username refused without computation | The difference in time reveals the real accounts | Compute a dummy digest in that case |
| Copying the `Authorization` header into the logs | Valid passwords in files read by many people | Log method, path and code, never the header |
| `curl -u username:password` typed in the terminal | The password stays in the command history and can appear in the list of processes | `--netrc-file`, or `-u username` alone, which asks for the password |
| Password in the address (`https://user:pwd@host/`) | The address ends up in the history, the logs and the links | Always the header, never the address |
| Failure counter on the client side or in the memory of a single instance | Bypassable, lost at restart | Counter on the server side, in a shared store |
| Locking an account after three failures | An attacker deliberately blocks a legitimate user | A delay that grows rather than a permanent lock |
| Resource declared without permission, so open to everyone | An entire API public by oversight | Deny by default: require an explicit permission, `null` only for the intended public |
| Allowing all methods on a resource | `DELETE` or `PATCH` open while nobody needs them | Allowlist of methods per resource |
| Using an administrator account for a script | The leak gives all the rights | A dedicated account, with minimal permissions |

## Best practices

| Practice | Reason |
|---|---|
| HTTPS wherever Basic is accepted | The only real protection of the `Authorization` header |
| Declare each resource in a registry, with its methods and permissions | Known and readable attack surface, addition without touching the central code |
| One permission per method, deny by default | Access control does not depend on an oversight |
| Never store a readable password: random salt and slow hashing | A stolen database does not deliver the passwords |
| Compare fixed-size digests in constant time | No leak through the duration or the size |
| Same response and same cost for an unknown account and a wrong password | No account enumeration |
| Limit the attempts on the server, before the costly computation | Protects the secret and the processor |
| Answer `401` with `WWW-Authenticate`, `403` for a missing right, `405` with `Allow` | The client understands which part fails |
| Log without the `Authorization` header | No copy of the secret to protect |
| One dedicated account per use, long random password, stored in a secrets tool | Limited leak, revocation without consequences for the other uses |
| Choose a token, a key or OAuth as soon as a human user or a third party is involved | Expiry, revocation and delegation that Basic cannot offer |

## Key Takeaways

| | |
|---|---|
| **Key takeaway: the resource** | A **REST resource** is a thing designated by a URL, on which the client acts with HTTP methods (`GET` reads, `POST` creates, `PUT` replaces, `PATCH` corrects, `DELETE` deletes) and of which the server returns a representation, often in JSON. You **declare it as a plugin** in a registry: path, permitted methods (allowlist, otherwise `405` with `Allow`) and permission of each method. The API is **stateless**: the identity travels with each request. |
| **Key takeaway: HTTP Basic** | **HTTP Basic** sends `Authorization: Basic <Base64 of username:password>`; without the header, the server answers `401` with `WWW-Authenticate: Basic realm="..."`. **Base64 is not encryption**: `base64 -d` returns the password in clear, so HTTPS is mandatory. |
| **Key takeaway: its limits** | Basic has no logout, no expiry, no second factor, and it sends the real password with every request, with a risk of copies in the logs, the proxies and the terminal history. |
| **Key takeaway: the checks** | Authentication (`401`) and authorization (`403`) are two separate checks. The secret is compared **in constant time** (`timingSafeEqual`, `hash_equals`, `compare_digest`) on fixed-size digests, an unknown username costs the same computation, and attempts are limited on the server side (`429` with `Retry-After`). |
| **Pitfalls to avoid** | Believing that Base64 protects; redirecting HTTP to HTTPS thinking the first send was saved; comparing with `===`; `timingSafeEqual` on different sizes; error messages that are too precise; unknown username refused without computation; `Authorization` copied into the logs; password typed in `curl -u` or placed in the address; failure counter on the client side, in memory, or behind a proxy without the original address; permanent lock of an account; resource without a declared permission and therefore public; unlisted methods allowed; administrator account for a script. |
| **Best practices** | HTTPS everywhere; a resource registry with a method allowlist and a permission per method, deny by default; salt and slow hashing to store the passwords; constant-time comparison of fixed-size digests; same response for all the authentication failures; attempt limiting on the server before the computation; logs without `Authorization`; dedicated account, minimal rights, with a long random secret stored in a secrets tool; token, API key or OAuth 2.0 as soon as a human user or a third party is involved. |
