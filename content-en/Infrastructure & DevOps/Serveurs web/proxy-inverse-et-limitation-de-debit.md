---
order: 2
---

# Reverse proxy and rate limiting

A website receives **requests** (asks sent by a browser or a program, the **client**) and answers them: that is the principle of [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). The program that runs the site's code and builds the answers is called here the **application server**. The role of a [web server](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web) (the program that listens for the requests arriving on a machine and answers them) is presented in a separate chapter.

This chapter answers two questions that come up as soon as the site leaves its author's computer:

- **Who should receive the requests first?** Answer: a **reverse proxy**, an intermediary placed in front of the application servers.
- **How do you stop one client from taking all the room?** Answer: **rate limiting**, which caps the number of requests accepted per client and per period of time.

The two subjects are linked by a trap: behind a proxy, the application no longer sees the real [IP address](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#the-ip-address-identifying-a-machine) of the client (the number that identifies its machine on the network), and rate limiting aims at the wrong target. The last part deals with it.

| Part | Question | Tool studied |
|---|---|---|
| [Forward proxy and reverse proxy](#forward-proxy-vs-reverse-proxy) | Who is hidden, and from whom? | Diagrams |
| [What a reverse proxy does](#what-a-reverse-proxy-does) | Which services does it provide? | TLS, load balancing, cache, compression |
| [An example with nginx](#an-example-with-nginx) | What does the configuration look like? | `upstream`, `proxy_pass`, `proxy_set_header` |
| [Rate limiting](#rate-limiting) | How do you count the requests? | Token bucket, `limit_req` |
| [The trap of the address seen behind a proxy](#the-trap-of-the-address-seen-behind-a-proxy) | Who is really the client? | `X-Forwarded-For` |

The JavaScript code blocks run with **Node.js** (a program that runs JavaScript outside the browser, [official documentation](https://nodejs.org/docs/latest/api/)) from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). The words *function*, *class* and *variable* are explained in [JavaScript functions](/?c=langages&s=javascript&p=fonctions), [classes](/?c=langages&s=javascript&p=poo) and [the variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable). The `/** ... */` block placed above a function is a documentation comment: `@brief` summarizes what the function does, `@param` describes a value it receives, `@returns` the value it returns. Between braces, we note the type of the value: `number` = number, `boolean` = true or false, `string` = text, `Set<string>` = set of texts, `{{allowed: boolean, wait: number}}` = object that groups a true/false and a number. The `if` tests, the `{ ... }` objects, the `for` loops and the `[ ... ]` arrays are explained in [conditions](/?c=langages&s=javascript&p=conditions), [objects](/?c=langages&s=javascript&p=objets), [loops](/?c=langages&s=javascript&p=boucles) and [arrays](/?c=langages&s=javascript&p=tableaux); an **arrow function** `(a) => ...` is a short way to write a function (see [functions](/?c=langages&s=javascript&p=fonctions)). The files in `.mjs` are JavaScript modules: they are run with `node name.mjs` and can exchange code with `import` and `export`. The Bash commands of the chapter are explained on the spot, with links to [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes), [text processing](/?c=langages&s=bash&p=traitement-de-texte), [basic commands](/?c=langages&s=bash&p=commandes-de-base), [scripts and the shebang](/?c=langages&s=bash&p=scripts-et-shebang) and [permissions](/?c=langages&s=bash&p=permissions-et-fichiers).

## Forward proxy vs. reverse proxy

A **proxy** is a program that sits between a client and a server: it receives the request in place of the server, then passes it on. There are two variants, depending on the side of the network they protect.

```
FORWARD PROXY: it protects the clients

  Company network                                       Internet
  +----------+
  | Desk 1   |--+
  +----------+  |   +-------+
                +-->| Proxy |-------------------------> Website
  +----------+  |   +-------+                           (sees the proxy,
  | Desk 2   |--+                                        not the desks)
  +----------+

REVERSE PROXY: it protects the servers

  Internet                                  Hosting
  +----------+
  | Client A |--+                           +-----------+
  +----------+  |   +---------+        +--->| App 1     |
                +-->| Reverse |--------+    +-----------+
  +----------+  |   | proxy   |        |    +-----------+
  | Client B |--+   +---------+        +--->| App 2     |
  +----------+   (clients see               +-----------+
                  the proxy, not the apps)
```

| | Forward proxy | Reverse proxy |
|---|---|---|
| Sits in front of | The **clients** (desks on an internal network) | The **servers** (applications) |
| Who does it hide? | The clients, from the servers on the Internet | The servers, from the clients |
| Who knows it exists? | The client (it is configured to use it) | Nobody on the client side: it thinks it is talking to the website |
| Who installs it? | The organization that manages the desks | The team that runs the website |
| Typical uses | Filtering the sites visited, logging each request to a file (the log), keeping frequently requested pages in memory | Encryption, load balancing, cache, protection |
| Software examples | [Squid](https://www.squid-cache.org/) | [nginx](https://nginx.org/), [HAProxy](https://www.haproxy.org/), [Traefik](https://doc.traefik.io/traefik/), [Caddy](https://caddyserver.com/) |

A web address like `https://example.com/public/a.css` breaks down into parts: the **domain name** (`example.com`, the readable name of the machine, [explanation from MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)), the **path** (`/public/a.css`, what is requested on this machine) and, when it is written, the **port** (the number that tells several services apart on one machine; without it, HTTPS uses 443).

The rest of the chapter only discusses the reverse proxy, the one a website developer installs. In a project with several containers, it appears as one service among others (see [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)). Its close relative, the [API gateway](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices#the-api-gateway), reads the content of each request to **route** it (to direct it to the right service); the reverse proxy, for its part, usually only examines the address, the domain name and the path.

## What a reverse proxy does

Placed at the entrance, the reverse proxy sees every request and every response go by. It takes advantage of this to provide five services, which each application no longer has to implement itself.

```
Client ==(1) HTTPS secured==> +------------------------------+
                              |        REVERSE PROXY         |
                              |  (1) decrypts (TLS)          |
                              |  (3) answers from the cache  |-- if absent --+
                              |  (5) compresses the response |               |
                              +--------------+---------------+               |
                                             | (2) chooses a server          |
                                  +----------+----------+                    |
                                  v                     v                    |
                            +-----------+         +-----------+              |
                            | App 1     |         | App 2     |<-------------+
                            +-----------+         +-----------+
                            (4) private addresses, invisible from the Internet
```

| Service | What it does | Why it is useful | To go further |
|---|---|---|---|
| TLS termination | Receives the encrypted connection (HTTPS), decrypts it, then talks in clear text to the applications | A single place holds the certificate and its private key; the applications have no encryption code at all | [Applied cryptography](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#the-self-signed-tls-certificate) |
| Load balancing | Sends each request to one of the application servers | Several servers share the traffic; a server that is down is avoided | [Autoscaling and load balancing](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#the-load-balancer) |
| Cache | Keeps the response to a request and replays it as it is to the following clients | The application is no longer called for a page that has not changed | [CDN and adaptive streaming](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative#the-cdn-copies-of-the-content-spread-around-the-world) for the version spread across the world |
| Hiding the servers | Only the proxy has a public address; the applications stay on the private network | An application cannot be attacked directly from the Internet | [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), which is often installed at that same place |
| Compression | Reduces the size of the responses (for example with **gzip**, a compression format) before sending them | Less data on the network, pages load faster | [nginx gzip module documentation](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) |

**TLS** (*Transport Layer Security*) is the protocol that encrypts the connection; **HTTPS** is HTTP carried inside a TLS connection. A **certificate** is the document that proves the server really is the one for the requested domain name. A **cache** is a memory that keeps a response to replay it without redoing the work that produced it.

These services have a cost: the proxy becomes a **single point of failure**, meaning an element whose failure stops everything, even if the applications behind it are fine. It is protected by running several identical proxies, themselves spread by a virtual address (an IP address that automatically switches from one proxy to the other when the first one goes down) or by a service from the hosting provider (see [load balancing](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#the-load-balancer)).

## An example with nginx

**nginx** (pronounced "engine X", [official site](https://nginx.org/)) is software that acts as a web server and as a reverse proxy. Its configuration is a text file made of **directives**: a name, values, and a semicolon at the end (`gzip on;`). Curly braces `{ }` group directives into **blocks**. A **header** is a line `Name: value` attached to a request or a response to describe it (the domain name requested, the language accepted...). The control headers and the status codes have their [dedicated chapter](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle).

| Block or directive | Role |
|---|---|
| `upstream name { ... }` | Declares a group of application servers under a name (the "upstream" of the proxy) |
| `server { ... }` | Describes a site: listening port, domain name, certificate |
| `location path { ... }` | Rules applied to the requests whose address starts with this path |
| `proxy_pass address;` | Forwards the request to this address, or to an `upstream` group |
| `proxy_set_header Name value;` | Adds or replaces a header of the forwarded request |

The following configuration does the TLS termination, splits the requests between two applications, compresses, and passes the client's information on. The addresses `10.0.0.11` and `10.0.0.12` are invented private-network addresses (see [the IP address](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#the-ip-address-identifying-a-machine)); `3000` is the port where each application listens.

```nginx
# upstream: a group named "app", the servers between which nginx spreads the requests
upstream app {
    # first application, private address and port 3000
    server 10.0.0.11:3000;
    # second application; without other settings, nginx takes them in turns
    server 10.0.0.12:3000;
}

# server: one site
server {
    # listens on port 443 (the HTTPS port) and enables TLS
    listen 443 ssl;
    # this block answers the requests asking for this domain name
    server_name example.com;

    # certificate file (the site's identity card) followed by the intermediate certificates
    # (those of the bodies that guarantee its signature): this is the "full chain"
    ssl_certificate     /etc/ssl/example.com/fullchain.pem;
    # private key file (the secret that proves the certificate really belongs to us):
    # it must only be readable by nginx
    ssl_certificate_key /etc/ssl/example.com/privkey.pem;

    # enables compression of the responses
    gzip on;
    # MIME types to compress: a MIME type is the label of the format of a content
    # (text/css = style sheet); text compresses well, images already less so
    gzip_types text/css application/javascript application/json;

    # Host: domain name requested by the client, copied without the port
    proxy_set_header Host $host;
    # X-Real-IP: address of the client, as nginx sees it ($remote_addr)
    proxy_set_header X-Real-IP $remote_addr;
    # X-Forwarded-For: addresses crossed, with the client's address added at the end
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # X-Forwarded-Proto: protocol used by the client (https here)
    proxy_set_header X-Forwarded-Proto $scheme;

    # location /: all the addresses of the site
    location / {
        # forwards the request to one of the servers of the "app" group
        proxy_pass http://app;
    }
}
```

A **MIME type** ([MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types)) is written `category/format`, for example `application/json` for JSON data. The words that start with `$` (`$host`, `$remote_addr`, `$scheme`) are nginx **variables**: at each request, nginx replaces them with the value of the moment. The added headers are essential, because the application no longer sees the client but the proxy:

| Header | What the application could not know without it |
|---|---|
| `Host` | The domain name requested. Without `proxy_set_header Host`, nginx sends the name of the group (`app`) |
| `X-Forwarded-For` | The address of the client and those of the proxies crossed (details [below](#the-trap-of-the-address-seen-behind-a-proxy)) |
| `X-Forwarded-Proto` | Whether the client came in `https`; the application, reached in `http` by the proxy, cannot guess it and risks building `http` links |
| `X-Real-IP` | The address of nginx's direct peer (the machine that connects to it), when a single proxy is involved; the standard `Forwarded` ([RFC 7239](https://www.rfc-editor.org/rfc/rfc7239)) is meant to replace the `X-Forwarded-*` family |

### What was tested

nginx was run in a **Docker** image (see [the basic concepts of Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base)), without installing it on the machine. The configuration above was validated by `nginx -t` (the command that checks the syntax of a file without starting the server) with a [self-signed certificate](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#the-self-signed-tls-certificate) (signed by its own holder, so without a guarantor body), then actually run: the addresses `10.0.0.x:3000` were replaced by two small local servers (ports 18431 and 18433) that send back the headers they receive. The log format is customized by these two directives, placed in the `http` block (the block that contains the `server` blocks):

```nginx
# log_format: defines a line format named "tracking": client address, code of the
# response, address of the chosen application server
log_format tracking '$remote_addr $status $upstream_addr';
# access_log: writes one line per request in this file, in the "tracking" format
access_log /var/log/nginx/access.log tracking;
```

Log of nginx for four consecutive requests:

```text
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
```

The two applications are indeed taken in turns. Here are the headers the application received for a request that arrived over HTTPS (extract: the headers nginx added):

```text
host: 127.0.0.1            <- Host copied
x-real-ip: 127.0.0.1       <- client address as seen by nginx
x-forwarded-for: 127.0.0.1 <- chain of addresses: here the client alone
x-forwarded-proto: https   <- the client was on HTTPS
```

> **Pitfall:** a `location` that contains its own `proxy_set_header` directive no longer inherits those of the `server` block. Test: `X-Real-IP` set at the `server` level and a `location /other/` that adds `Host`. The application did receive `Host`, but no longer `X-Real-IP`.
>
> **Best practice:** either set all the `proxy_set_header` at the same level, or group them in a file included by each `location` with the `include` directive, which inserts the content of another file:

```nginx
# in each location: inserts the common proxy_set_header, written in this file
include /etc/nginx/proxy-headers.conf;
```

### Adding a cache

For the pages that do not change from one visitor to another, the proxy can keep the response. The `proxy_cache_path` directive goes outside the `server` block, the others in a dedicated `location`:

```nginx
# proxy_cache_path: storage folder, 10 MB of index in memory (keys_zone),
# 100 MB at most of responses, and deletion of a response not requested for 10 minutes
proxy_cache_path /var/cache/nginx/pages keys_zone=pages:10m max_size=100m inactive=10m;

# in the existing "server" block:
location /public/ {
    # stores the responses in the "pages" zone
    proxy_cache pages;
    # keeps the responses with code 200 for 1 minute
    proxy_cache_valid 200 1m;
    # adds to the response HIT (served by the cache) or MISS (coming from the application)
    add_header X-Cache $upstream_cache_status;
    # forwards to the application the requests the cache cannot serve
    proxy_pass http://app;
}
```

Three successive requests on `/public/a.css` gave `MISS`, `HIT`, `HIT`, and the application counted only **one** call: the last two responses came from the cache. A request for a JSON file with `Accept-Encoding: gzip` received `Content-Encoding: gzip`, proof that compression is active.

> **Pitfall:** caching a **personalized** response (the "my account" page of a logged-in user). The cache would replay it to another visitor. nginx stores the responses under a key built from the requested address: if two visitors request the same address, they receive the same response.
>
> **Best practice:** only put `proxy_cache` on public paths (static files, pages identical for everyone), and give the cache a short duration.

## Rate limiting

**Rate limiting** consists in refusing the requests of a client who sends too many, for example more than 5 per second. The **rate** is this number of requests per unit of time.

| Reason | Example |
|---|---|
| Protecting against brute force | A program tries thousands of passwords on the login form (see [web API security](/?c=securite&s=cybersecurite&p=securite-api-web#rate-limiting)) |
| Absorbing a bug on the client side | A mobile application that calls the API again and again in a loop after an error |
| Keeping the service fair | A client that downloads the whole catalog does not slow down the others |
| Controlling costs | Each request triggers a call billed by a third-party service (see [application overload and denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Complementing a WAF | A [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif) filters by attack pattern, rate limiting filters by quantity: a valid request, repeated a million times, gets past the first but not the second |

Rate limiting does not replace [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#the-problem-a-single-server-has-limited-capacity), which adds servers to absorb legitimate traffic: it only serves to refuse the excess of a given client.

### Where to put it: proxy or application

| | In the reverse proxy | In the application |
|---|---|---|
| Advantage | Refusal before any application work, a single rule for all the applications | Knows the logged-in account, the pricing plan, the real cost of each route |
| Limit | Only knows what the request contains (address, headers) | Each instance (each copy of the program that is running) has its own counters: with 3 instances, a client can get 3 times the limit |
| Remedy for the limit | Complete it with a rule in the application | Share the counters in an [in-memory store such as Redis](/?c=donnees&s=bases-de-donnees&p=redis) |

In practice both are combined: a generous limit at the proxy, fine limits in the application.

### Two ways to count: fixed window and token bucket

The **fixed window** divides time into slots (for example 10 seconds) and counts the requests of each slot: beyond the limit, refusal until the next slot. The **token bucket** works like a reserve: a bucket holds at most *N* tokens, each request takes one, and the bucket refills at a constant speed. When the bucket is empty, the request is refused with code **429** ("too many requests", detailed below). A **burst** is a group of requests sent almost all at the same time.

```
        tokens added at a constant speed (e.g. 1 per second)
                          |
                          v
                    +-----------+  <- maximum capacity: 5 tokens
                    |  o o o o  |     (the overflow is lost)
                    |  o o      |
                    +-----+-----+
                          |
         each request takes ONE token:
           token available -> request accepted
           bucket empty    -> request refused (429)
```

| | Fixed window | Token bucket |
|---|---|---|
| Principle | A counter reset to zero at each slot | A reserve of tokens that refills continuously |
| Memory per client | A counter and a slot number | A number of tokens and an instant |
| Burst allowed | The whole limit at once, at the start of a slot | At most the capacity of the bucket, then the pace of the rate |
| Main drawback | **Boundary effect**: 5 requests at the end of a slot + 5 at the start of the next one = 10 requests in a fraction of a second | Two settings to understand (capacity and rate) |
| Wait before retrying | Until the end of the slot | The time to receive a token, which can be computed exactly |
| Used by | Monthly or daily quotas | Per-second or per-minute limits on an API |

The **sliding window** (a variant of the fixed window that recalculates the quota continuously) is presented in [web API security](/?c=securite&s=cybersecurite&p=securite-api-web#rate-limiting). The same capping principle also exists in the browser under the name *throttle* (see [debounce and throttle](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence#debounce-and-throttle-two-ways-to-limit-a-function-s-rate)).

### A token bucket in JavaScript

Time is passed as a parameter (`now`, in seconds) rather than read inside the function: the behavior becomes reproducible, therefore testable.

Save this class in the file `seau.mjs`.

```js
/**
 * @brief Token bucket: each request takes a token, the bucket refills over time.
 *
 * @param {number} capacity - integer, at least 1
 * @param {number} rate - strictly positive number (tokens per second)
 */
// export: makes the class usable from another file; class: a template for objects
export class TokenBucket {
  // constructor: called by "new" when a bucket is created
  constructor(capacity, rate) {
    // this designates the bucket being created: its settings are stored in it
    // maximum size of the bucket = size of the largest burst accepted
    this.capacity = capacity;
    // refill speed, in tokens per second
    this.rate = rate;
    // the bucket starts full
    this.tokens = capacity;
    // instant of the last withdrawal (null = "nothing": there has not been any)
    this.lastInstant = null;
  }

  /**
   * @brief Tries to take a token at the given instant.
   *
   * @param {number} now - seconds, never less than the previous call
   *
   * @returns {{allowed: boolean, wait: number}} wait in seconds before a token
   */
  take(now) {
    // !== means "different from": except at the very first call, we refill the bucket
    if (this.lastInstant !== null) {
      // tokens earned since the last call: elapsed time x rate
      const earned = (now - this.lastInstant) * this.rate;
      // Math.min keeps the smaller of the two numbers: the bucket does not overflow
      this.tokens = Math.min(this.capacity, this.tokens + earned);
    }
    // we keep this instant for the next calculation
    this.lastInstant = now;
    // >= means "greater than or equal to"
    if (this.tokens >= 1) {
      // at least one token remains: -= 1 takes one away, and we accept the request
      this.tokens -= 1;
      // { ... } is an object: two values stored under the names allowed and wait
      return { allowed: true, wait: 0 };
    }
    // (1 - tokens) token is missing: at this rate, it will arrive within this delay
    return { allowed: false, wait: (1 - this.tokens) / this.rate };
  }
}
```

Test, to save in `essai-seau.mjs`: a bucket of capacity 5, refilled at 1 token per second, receives 7 simultaneous requests, then 4 requests three seconds later.

```js
// import: gets the class written in the seau.mjs file
import { TokenBucket } from "./seau.mjs";

// describes the result of a withdrawal on a line
function line(instant, number, verdict) {
  // ? : operator: if access is allowed we write "ok", otherwise "refused"
  const state = verdict.allowed ? "ok" : "refused";
  // the ${...} insert the value of a variable into the text between backticks
  return `t=${instant} s  request ${number}: ${state} (wait ${verdict.wait} s)`;
}

// bucket of capacity 5, refilled at 1 token per second
const bucket = new TokenBucket(5, 1);
// for loop: repeats the block for i = 1, 2, ... 7 (i++ adds 1 to i at each turn);
// 7 requests at the same instant (t = 0 s)
for (let i = 1; i <= 7; i++) {
  // console.log displays a line in the terminal
  console.log(line(0, i, bucket.take(0)));
}
// 3 seconds later, 3 tokens have been added: 4 requests
for (let i = 1; i <= 4; i++) {
  console.log(line(3, i, bucket.take(3)));
}
```

Output obtained (files `seau.mjs` and `essai-seau.mjs`, command `node essai-seau.mjs`):

```text
t=0 s  request 1: ok (wait 0 s)
t=0 s  request 2: ok (wait 0 s)
t=0 s  request 3: ok (wait 0 s)
t=0 s  request 4: ok (wait 0 s)
t=0 s  request 5: ok (wait 0 s)
t=0 s  request 6: refused (wait 1 s)
t=0 s  request 7: refused (wait 1 s)
t=3 s  request 1: ok (wait 0 s)
t=3 s  request 2: ok (wait 0 s)
t=3 s  request 3: ok (wait 0 s)
t=3 s  request 4: refused (wait 1 s)
```

The burst of 5 passes, the 6th is refused with a wait of 1 s, exactly the time to produce a token; after 3 s the bucket has regained 3 tokens. A refused request consumes nothing.

### The boundary effect of the fixed window, measured

Same limit for both methods (5 requests per 10 seconds, i.e. 0.5 token per second); 5 requests arrive at 9.9 s, 5 others at 10.1 s. The script is saved in `fixe.mjs` and run with `node fixe.mjs`.

```js
// import: the TokenBucket class seen above
import { TokenBucket } from "./seau.mjs";

/**
 * @brief Fixed-window counter: at most `limit` requests per slot of `duration` s.
 *
 * @param {number} limit - integer, at least 1
 * @param {number} duration - strictly positive number (seconds)
 */
class FixedWindow {
  constructor(limit, duration) {
    // number of requests allowed per slot, and duration of a slot (this: see above)
    this.limit = limit;
    this.duration = duration;
    // number of the current slot and number of requests already seen in it
    this.slot = null;
    this.count = 0;
  }

  /**
   * @brief Counts a request at the given instant.
   *
   * @param {number} now - seconds
   *
   * @returns {boolean} true if the request is accepted
   */
  take(now) {
    // Math.floor rounds down to the whole number: 9.9 / 10 gives 0; 10.1 / 10 gives 1
    const slot = Math.floor(now / this.duration);
    // new slot (!== means "different from"): the counter starts again from zero
    if (slot !== this.slot) {
      this.slot = slot;
      this.count = 0;
    }
    // counts this request, then accepts it as long as the limit is not exceeded
    this.count += 1;
    // <= means "less than or equal to"
    return this.count <= this.limit;
  }
}

// 5 requests per slot of 10 s, against a bucket of 5 tokens refilled at 0.5 token/s
const fixed = new FixedWindow(5, 10);
const bucket = new TokenBucket(5, 0.5);
// counters of the requests accepted by each method
let acceptedFixed = 0;
let acceptedBucket = 0;
// 5 requests at t = 9.9 s (end of a slot), then 5 at t = 10.1 s (start of the next one);
// for...of: goes through the list, t takes each value in turn
for (const t of [9.9, 9.9, 9.9, 9.9, 9.9, 10.1, 10.1, 10.1, 10.1, 10.1]) {
  // += 1 adds 1 to the counter when the method accepts the request
  if (fixed.take(t)) acceptedFixed += 1;
  if (bucket.take(t).allowed) acceptedBucket += 1;
}
console.log(`fixed window: ${acceptedFixed} requests accepted in 0.2 s`);
console.log(`token bucket: ${acceptedBucket} requests accepted in 0.2 s`);
```

```text
fixed window: 10 requests accepted in 0.2 s
token bucket: 5 requests accepted in 0.2 s
```

The fixed window lets through **double** the limit around the boundary between two slots; the bucket only lets through its capacity.

### Plugging the bucket into an HTTP server

The server below, to save in `app.mjs`, creates a bucket per client, refuses with the code **429** when it is empty, and attaches the `Retry-After` header (the number of seconds to wait before retrying). The exact meaning of this code and this header is detailed in [the chapter on status codes and control headers](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle); here, just remember that 429 means "too many requests".

The server imports a function `clientAddress`, which decides which address is counted for each request. It is written in the last part; in the meantime, the file `adresse.mjs` contains a provisional version that returns the address of the connection:

```js
// provisional version: always returns the address of the connection; the "peer" is the
// machine that opened the connection with us (the client, or a proxy placed in front)
export function clientAddress(peer) {
  // return gives the value back to whoever called the function
  return peer;
}
```

```js
// node:http is the Node.js module that can listen for HTTP requests
import http from "node:http";
// performance.now() gives a time in milliseconds that never goes backwards
import { performance } from "node:perf_hooks";
import { TokenBucket } from "./seau.mjs";
import { clientAddress } from "./adresse.mjs";

// listening port, read from an environment variable; Number converts the text into a number
const PORT = Number(process.env.PORT);
// known API keys (invented examples); a Set is a collection without duplicates,
// where .has(x) answers "is x part of it?" (documentation: MDN, Set)
const KEYS = new Set(["key-alice", "key-bob"]);
// ?? takes the value on the right if the one on the left is missing; split cuts the text
// at each comma; filter(Boolean) removes the empty pieces; new Set(...) makes it
// a set
const FIABLES = new Set((process.env.FIABLES ?? "").split(",").filter(Boolean));
// each limiting key gets a bucket of 3 tokens, refilled at 1 token per second
const CAPACITY = 3;
const RATE = 1;
// one bucket per limiting key, created at the first request; a Map associates a value
// with a key: .set(key, value) adds it, .get(key) reads it back, .has(key) tests its presence
const buckets = new Map();

// createServer: the arrow function (req, res) => { ... } (a function written with =>)
// is called for each request received (req) to answer it (res)
const server = http.createServer((req, res) => {
  // client address, according to the trust rules seen below
  const address = clientAddress(
    req.socket.remoteAddress,
    req.headers["x-forwarded-for"],
    FIABLES,
  );
  // X-Api-Key header sent by the client (undefined if it is absent)
  const apiKey = req.headers["x-api-key"];
  // known API key: we limit by key; otherwise, by address
  const key = KEYS.has(apiKey) ? `key:${apiKey}` : `ip:${address}`;
  // first request for this key: we create its bucket
  if (!buckets.has(key)) buckets.set(key, new TokenBucket(CAPACITY, RATE));
  // monotonic clock in seconds: it never goes back, unlike the system time
  const verdict = buckets.get(key).take(performance.now() / 1000);
  if (!verdict.allowed) {
    // Retry-After is written in whole seconds: Math.ceil rounds up, String
    // converts the number into text; writeHead sends the code and the headers of the response
    res.writeHead(429, { "Retry-After": String(Math.ceil(verdict.wait)) });
    res.end(`too many requests for ${key}\n`);
    return;
  }
  // otherwise the request passes (code 200 by default)
  res.end(`ok for ${key}\n`);
});

// listens only on the local machine: 127.0.0.1 always designates your own machine
server.listen(PORT, "127.0.0.1");
```

Launch in a first terminal (Bash syntax, see [environment variables](/?c=langages&s=bash&p=variables-denvironnement)), then five requests with **curl** (a tool that sends an HTTP request from the terminal, [documentation](https://curl.se/docs/)) from a second terminal. The `-s` option hides the progress messages, `-i` displays the header of the response. The `|` (*pipe*) sends the output of curl to `grep`, which only keeps the lines matching a pattern: `-E` enables extended patterns, `^` means "at the start of the line" and a `|` in the pattern means "or", so the lines that start with `HTTP` (the status code) or `Retry-After` (see [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes) and [text processing](/?c=langages&s=bash&p=traitement-de-texte)). `for i in 1 2 3 4 5; do ... done` repeats the commands once per value (see [Bash loops](/?c=langages&s=bash&p=boucles)).

```bash
# starts the server on port 18431 (PORT is read by the program)
PORT=18431 node app.mjs
# second terminal: five requests in a row from the same address
for i in 1 2 3 4 5; do
  curl -si http://127.0.0.1:18431/ | grep -E "^HTTP|^Retry-After"
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
Retry-After: 1
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

The first three pass (capacity 3), the next two are refused with `Retry-After: 1`.

### By IP address or by API key

The **limiting key** is what designates “a client”: you have to choose what you count.

| Key | Advantage | Limit |
|---|---|---|
| IP address | Available for every visitor, even an anonymous one | Several people behind the same public address (an office, a school, a box: see [NAT](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#two-complementary-mechanisms-dhcp-and-nat)) share one bucket; an attacker who has many addresses gets one bucket per address |
| API key (identifier given to each developer or client application) | Precise: follows the real client, whatever its address | Only for the clients who have one; a leaked key is used by anyone |
| User account | Follows the person | Requires being logged in; does not protect the login form itself |

The server above limits by API key when it is known, otherwise by address. Test (`X-Api-Key` is the header where the client sends its key; `-H` adds a header to the request; `--interface` makes the request leave from a chosen local address: under Linux, any address in `127.x.y.z` designates your own machine, which makes it possible to simulate several clients; `head -n 1` keeps only the first line of the response):

```bash
# known key, sent from two alternating addresses: a single bucket for the key
for a in 127.0.0.4 127.0.0.5 127.0.0.4 127.0.0.5; do
  curl -si --interface $a -H "X-Api-Key: key-alice" http://127.0.0.1:18431/ | head -n 1
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
```

Two different addresses, a single quota: that of the key. An **unknown** key (`key-x1`, `key-x2`, `key-x3`, `key-x4`, sent from the same address) falls back to the limit by address: 3 responses 200, then 429. If the server created a bucket for every key received, an attacker would get a fresh bucket by inventing a key for each request.

> **Pitfall:** keeping all the buckets in memory without ever deleting them. Each address or key seen creates an entry; an attacker who changes address makes the table grow until it saturates the memory.
>
> **Best practice:** delete the inactive buckets (a bucket that has been full for a long time is equivalent to a new one) and cap the number of entries.

### The same limit in nginx

The proxy can limit without writing a line of application code. The directives `limit_req_zone` and `limit_req_status` go outside the `server` block (at the same level as `upstream`), `limit_req` in a `location`:

```nginx
# limit_req_zone: creates a zone of counters in memory (10 MB), one per value of the key
# $binary_remote_addr: client address, in compact form; rate: 1 request per second
limit_req_zone $binary_remote_addr zone=by_ip:10m rate=1r/s;
# same with the API key; a request without the X-Api-Key header is not counted
limit_req_zone $http_x_api_key zone=by_key:10m rate=1r/s;
# code returned when the limit is exceeded (503 if the directive is absent)
limit_req_status 429;

# in the existing "server" block:
location /api/ {
    # applies the by_ip zone; burst=3: up to 3 requests in advance; nodelay: no waiting
    limit_req zone=by_ip burst=3 nodelay;
    # same rule by API key: both limits apply
    limit_req zone=by_key burst=3 nodelay;
    # forwards to the application what has passed the limits
    proxy_pass http://app;
}

# when nginx decides a 429, it goes through the named block "limit" below
error_page 429 @limit;
location @limit {
    # always: the header is added even on an error code
    add_header Retry-After 1 always;
    # answers 429 with a short text
    return 429 "Too many requests\n";
}
```

| Setting | Effect |
|---|---|
| `rate=1r/s` | Refill speed: 1 request per second (`r/m` for per minute) |
| `burst=3` | Number of requests in advance tolerated beyond the pace |
| `nodelay` | The requests of the burst pass straight away; without it, nginx makes them **wait** to respect the pace |
| `$binary_remote_addr` | Key = client address, stored on few bytes; more economical than `$remote_addr` (text) |
| `$http_x_api_key` | Key = value of the `X-Api-Key` header (nginx builds `$http_` + the name of the header in lowercase, dashes replaced by `_`) |

Results observed with this file (7 quick requests on `/api/x` from the same address):

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
```

Four accepted, then refusals: `burst=3` gives **1 + 3** requests straight away, i.e. a bucket of capacity 4 refilled at 1 per second. The nginx error log notes each refusal (`limiting requests, excess: 3.961 by zone "by_ip"`). The 429 response did carry `Retry-After: 1`. With the key `k1` sent from two alternating addresses, the 5th request was refused by the `by_key` zone (log: `by zone "by_key"`).

The nginx documentation describes its algorithm as a *leaky bucket*, a cousin of the token bucket; the measured behavior (1 + `burst` requests straight away, then the `rate` pace) is that of a token bucket of capacity `burst + 1`. Without `nodelay`, with `burst=3` and requests sent one after another, each one was delayed by about 1 second (measurements: 0.99 s for requests 2 to 5) instead of being refused.

> **Pitfall:** believing that `limit_req_zone $http_x_api_key` protects everything. The requests **without** an `X-Api-Key` header have an empty key, which nginx does not count: the `by_ip` zone must be kept next to it.
>
> **Best practice:** always have a limit by address as a safety net, and the limit by key on top of it for the identified clients.

## The trap of the address seen behind a proxy

Every network connection has two ends, and the server sees the address of **the one that speaks to it directly**, called the **peer**. Behind a proxy, the peer of the application is always the proxy.

```
Without a proxy

Client A (198.51.100.7) --> Application
   the application sees 198.51.100.7

With a reverse proxy

Client A (198.51.100.7) --+
                          +--> Proxy (10.0.0.2) --> Application
Client B (203.0.113.9)  --+
   the application sees 10.0.0.2 for A AND for B
```

Direct consequence for rate limiting: all the clients share **one single bucket**, that of the address of the proxy, and the first one to consume the tokens blocks the others. To measure it, a small proxy plays the role of nginx: it receives the request, adds the address of the client to `X-Forwarded-For`, then forwards it to the application. It is saved in `proxy.mjs`; the transmission of the content uses `pipe`, explained in [streams](/?c=langages&s=javascript&p=streams).

```js
// node:http: the HTTP module of Node.js
import http from "node:http";

// listening port of the proxy and port of the application behind it
const PORT = Number(process.env.PORT);
const AMONT = Number(process.env.AMONT);

http.createServer((req, res) => {
  // address of the one that has just called this proxy
  const seen = req.socket.remoteAddress;
  // chain already received, if another proxy went through before (undefined otherwise)
  const chain = req.headers["x-forwarded-for"];
  // a proxy appends the address it saw at the end of the chain; ... copies the headers
  const headers = { ...req.headers, "x-forwarded-for": chain ? `${chain}, ${seen}` : seen };
  // makes the request again to the application, with the completed headers
  const options = { host: "127.0.0.1", port: AMONT, path: req.url, headers };
  const upstream = http.request(options, (response) => {
    // copies the code and the headers of the response, then its content (pipe: connects
    // a read stream to a write stream, see the streams)
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });
  // the request is passed on as it is to the application
  req.pipe(upstream);
}).listen(PORT, "127.0.0.1");
```

The tests need a small Bash script, `client.sh`, which plays the client. It sends the requested number of requests from the given local address (`--interface`, as above) and shows for each one the response code and the text received. An optional third argument adds an `X-Forwarded-For` header to each request. The commands that follow `curl` put everything on one line: `tr -d '\r'` removes the carriage returns (`\r`), an invisible character that ends each line of an HTTP response and which, otherwise, would make the rest of the display overwrite the status line; `sed -n '1p;$p'` only displays the first and the last line; `paste -sd'|'` joins the lines into one, separated by `|`; the last `sed` replaces this `|` with three spaces. `$1`, `$2` and `$3` are the arguments given to the script; `seq 1 N` produces the numbers from 1 to N; `$(...)` is replaced by the result of the command it contains; a `\` at the end of a line continues the command on the next line. The file is saved under the name `client.sh`; `chmod +x client.sh` makes it executable (see [scripts and the shebang](/?c=langages&s=bash&p=scripts-et-shebang) and [permissions](/?c=langages&s=bash&p=permissions-et-fichiers)).

```bash
#!/bin/bash
# $1: local starting address, $2: number of requests
# $3 (optional): start of the address written in X-Forwarded-For, followed by 1, 2, 3...
s=""
# what follows && only runs if the test is true; -gt: "greater than"
[ "$2" -gt 1 ] && s="s"
echo "client $1: $2 request$s"
for i in $(seq 1 "$2"); do
  # empty array, which receives the -H option (add a header) if $3 is given
  xff=()
  [ -n "$3" ] && xff=(-H "X-Forwarded-For: $3.$i")
  # -s: silent, -i: shows the header, --interface: starting address of the request
  # tr removes the \r at the end of the lines; sed keeps the first line (status) and the last
  # one (body); paste joins them
  curl -si --interface "$1" "${xff[@]}" http://127.0.0.1:18432/ \
    | tr -d '\r' | sed -n '1p;$p' | paste -sd'|' | sed 's/|/   /'
done
```

First test: the application runs with the provisional version of `clientAddress` (which always returns the peer), and the proxy listens on port 18432 in front of it. In three terminals, we launch the application (port 18431), the proxy (`PORT` is its listening port, `AMONT` that of the application), then client `127.0.0.2` sends 3 requests and client `127.0.0.3` only one:

```bash
# terminal 1: the application, on port 18431
PORT=18431 node app.mjs
# terminal 2: the proxy, on port 18432, which forwards to the application on port 18431
PORT=18432 AMONT=18431 node proxy.mjs
# terminal 3: 3 requests from client 127.0.0.2, then 1 request from client 127.0.0.3
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```

```text
client 127.0.0.2: 3 requests
HTTP/1.1 200 OK   ok for ip:127.0.0.1
HTTP/1.1 200 OK   ok for ip:127.0.0.1
HTTP/1.1 200 OK   ok for ip:127.0.0.1
client 127.0.0.3: 1 request
HTTP/1.1 429 Too Many Requests   too many requests for ip:127.0.0.1
```

The client `127.0.0.3`, which had not sent anything yet, is refused: the application counted everyone under the address `127.0.0.1`, that of the proxy.

### X-Forwarded-For: the chain of addresses

The remedy is the `X-Forwarded-For` header ("forwarded for", [MDN description](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)). Each proxy **appends at the end** the address of the one that spoke to it:

```
Client (198.51.100.7) --> Proxy 1 (10.0.0.1) --> Proxy 2 (10.0.0.2) --> Application

Header received by the application:   X-Forwarded-For: 198.51.100.7, 10.0.0.1
Peer seen by the application:         10.0.0.2

  198.51.100.7 : added by Proxy 1 (it saw the client)
  10.0.0.1     : added by Proxy 2 (it saw Proxy 1)
  10.0.0.2     : NOT in the header: it is the peer, the application sees it itself
```

The header is **written by the proxies, but also by any client**: a malicious client can **forge** it (make it up from scratch), for example by sending `X-Forwarded-For: 1.1.1.1` to pose as another address. It is only trustworthy if it comes from a **known** proxy. Hence the rule:

1. If the peer is not a trusted proxy, we **ignore** the header and take the peer.
2. If the peer is a trusted proxy, we read the chain **from right to left** and keep the first address that is not a trusted proxy. What is to the left of that address was written by the client, so it is not trustworthy.

```js
/**
 * @brief Determines the address of the real client, behind zero, one or several proxies.
 *
 * Example: peer 10.0.0.2 (trusted), header "1.2.3.4, 10.0.0.1" -> 1.2.3.4
 *
 * @param {string} peer - IP address of the machine that opened the connection
 * @param {string|undefined} header - raw value of X-Forwarded-For, or undefined
 * @param {Set<string>} trusted - addresses of the proxies whose header we accept
 *
 * @returns {string} address kept to identify the client
 */
export function clientAddress(peer, header, trusted) {
  // ! means "not", || "or": unknown peer or no header, we take the peer
  // (an unknown peer can write anything in the header)
  if (!trusted.has(peer) || !header) return peer;
  // splits "a, b, c" into a list of addresses; map applies the function (a) => a.trim() to
  // each element, and trim removes the spaces around
  const chain = header.split(",").map((a) => a.trim());
  // we go back from the right: each trusted proxy added the address it saw;
  // list positions start at 0, so the last one is at length - 1;
  // i-- takes 1 away from i at each turn, and chain[i] reads the element at position i
  for (let i = chain.length - 1; i >= 0; i--) {
    // first address that is not a trusted proxy = the client
    if (!trusted.has(chain[i])) return chain[i];
  }
  // the whole chain is trusted: the client is the first address
  return chain[0];
}
```

Six cases tried (two trusted proxies, `10.0.0.1` and `10.0.0.2`), in a file `cas.mjs` run with `node cas.mjs`:

```js
// the function we have just written
import { clientAddress } from "./adresse.mjs";

// two trusted proxies: 10.0.0.1 and 10.0.0.2
const trusted = new Set(["10.0.0.1", "10.0.0.2"]);
// each case: a name, the address of the connection, the header received, the trusted proxies
const cases = [
  ["unknown peer, forged header", "203.0.113.9", "1.1.1.1", trusted],
  ["trusted peer, one proxy", "10.0.0.2", "198.51.100.7", trusted],
  ["trusted peer, forged start of the chain", "10.0.0.2", "1.1.1.1, 198.51.100.7", trusted],
  ["two trusted proxies", "10.0.0.2", "198.51.100.7, 10.0.0.1", trusted],
  ["trusted peer, no header", "10.0.0.2", undefined, trusted],
  ["no trusted proxy", "10.0.0.2", "198.51.100.7", new Set()],
];
// for...of goes through the list; the brackets on the left extract the 4 values of each case
for (const [name, peer, header, list] of cases) {
  console.log(`${name} -> ${clientAddress(peer, header, list)}`);
}
```

```text
unknown peer, forged header -> 203.0.113.9
trusted peer, one proxy -> 198.51.100.7
trusted peer, forged start of the chain -> 198.51.100.7
two trusted proxies -> 198.51.100.7
trusted peer, no header -> 10.0.0.2
no trusted proxy -> 10.0.0.2
```

| Case | Address kept | Reason |
|---|---|---|
| Unknown peer that sends a header | The peer | The header comes from an unknown source: it is ignored |
| Trusted peer, one proxy | The client in the header | The trusted proxy wrote this address |
| Client who forges the start of the chain | The real client | The reading from right to left stops at the first untrusted address, added by the proxy |
| Trusted peer without a header | The peer | Nothing to read |
| No proxy declared as trusted | The peer | Cautious setting: we always see the proxy |

Second test, with the complete function. We replace the content of `adresse.mjs` with the function `clientAddress` above, then we stop the application (`Ctrl+C` in terminal 1) and restart it with `FIABLES=127.0.0.1` (the address of the test proxy). This restart also resets all the buckets to zero. The proxy, for its part, keeps running:

```bash
# terminal 1: restarts the application; FIABLES lists the proxies whose header we believe
FIABLES=127.0.0.1 PORT=18431 node app.mjs
# terminal 3: same requests as in the first test
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```


```text
client 127.0.0.2: 3 requests
HTTP/1.1 200 OK   ok for ip:127.0.0.2
HTTP/1.1 200 OK   ok for ip:127.0.0.2
HTTP/1.1 200 OK   ok for ip:127.0.0.2
client 127.0.0.3: 1 request
HTTP/1.1 200 OK   ok for ip:127.0.0.3
```

Each client now has its own bucket. Finally, client `127.0.0.2` sends five requests through the proxy, each time with a **different** `X-Forwarded-For` (`1.1.1.1`, `1.1.1.2`...), to try to obtain five fresh buckets. But the bucket of `127.0.0.2` has just been emptied by the previous test, and it refills at 1 token per second. Sent straight away, the five requests would all be refused (`429`), without proving anything about the forgery. So we wait 3 seconds, the time for the 3 tokens to come back (`sleep 3` pauses the terminal for 3 seconds):

```bash
# waits 3 seconds for the bucket to refill
sleep 3
# five requests with a different X-Forwarded-For: 1.1.1.1, 1.1.1.2, ...
./client.sh 127.0.0.2 5 1.1.1
```

```text
client 127.0.0.2: 5 requests
HTTP/1.1 200 OK   ok for ip:127.0.0.2
HTTP/1.1 200 OK   ok for ip:127.0.0.2
HTTP/1.1 200 OK   ok for ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   too many requests for ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   too many requests for ip:127.0.0.2
```

The application sees `1.1.1.i, 127.0.0.2`, keeps `127.0.0.2` and answers `200`, `200`, `200`, `429`, `429`. The forgery fails.

### The nginx equivalent: the realip module

When nginx is itself behind another proxy, it is nginx that must find the address of the client before applying `limit_req` (otherwise the `by_ip` zone counts the address of the proxy in front). The *realip* module ([documentation](https://nginx.org/en/docs/http/ngx_http_realip_module.html)) applies the same rule as `clientAddress`:

```nginx
# in the "server" block, before the "location" blocks:
# the peers of this private network (10.x.x.x, invented addresses) are trusted proxies
set_real_ip_from 10.0.0.0/8;
# reads the address of the client in this header rather than in the connection
real_ip_header X-Forwarded-For;
# skips the trusted addresses, starting from the right
real_ip_recursive on;
```

(The notation `10.0.0.0/8` is the [CIDR notation](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#cidr-notation-a-shorthand-for-the-mask).) With this configuration (adapted to the test network: `127.0.0.1/32`), behind the small proxy, a client at `127.0.0.2` that sends `X-Forwarded-For: 1.1.1.i` was counted under `127.0.0.2`: `200`, `200`, `200`, `200`, `429`, `429` (burst of 3, i.e. 4 requests straight away).

Second test: a direct connection from `127.0.0.2` (untrusted peer) with a forged header was counted under `127.0.0.2` too. The zone was still exhausted by the previous test, hence six `429` in a row: the forged header did not give a fresh bucket.

> **Pitfall:** after `real_ip_header`, the variable `$remote_addr` contains the address of the **client** and no longer that of the connection. With `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, nginx then adds the address of the client a second time: the application received `1.1.1.1, 127.0.0.2, 127.0.0.2` instead of `1.1.1.1, 127.0.0.2`. The address of the connection remains available in `$realip_remote_addr`.
>
> **Best practice:** let the application read the chain from right to left with the list of its trusted proxies, and do not deduce the number of proxies from the number of addresses in the chain.

| Version of the address | Where to read it | Trustworthy? |
|---|---|---|
| Peer of the connection | `req.socket.remoteAddress` in Node.js, `$remote_addr` in nginx without `realip` | Yes: it is the real connection |
| Start of `X-Forwarded-For` | First address of the list | No: written by the client |
| End of `X-Forwarded-For` | Last address of the list | Yes if the peer is a trusted proxy, because it added it |
| Address kept by `clientAddress` or `realip` | Result of the rule above | Yes, provided the list of trusted proxies is exact |

For this rule to be enough, the application must only accept the connections coming from the proxy: a [firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) that blocks direct access completes the setup. Example with ufw, if the proxy is at `10.0.0.2` and the application on port 3000:

```bash
# only allows the proxy (10.0.0.2) to reach port 3000 of this machine
sudo ufw allow from 10.0.0.2 to any port 3000 proto tcp
# refuses any other access to this port (the allow rule, set before, comes first)
sudo ufw deny 3000/tcp
```

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Reading the address of the connection behind a proxy | All the clients carry the address of the proxy and share one bucket | Read `X-Forwarded-For` only if the peer is a trusted proxy |
| Trusting `X-Forwarded-For` unconditionally | Any client writes the address it wants and gets around the limit | Ignore the header if the peer is not trusted, read the chain from right to left |
| Taking the first address of the chain | It is the one a client can forge | Stop at the first untrusted address, starting from the right |
| Leaving the application reachable directly | An attacker bypasses the proxy, its limits and its WAF | Firewall: accept only the connections from the proxy |
| A single proxy without redundancy | Its failure stops the whole site | At least two identical proxies |
| Caching a personalized page | A visitor receives the page of another | `proxy_cache` only on public paths |
| `proxy_set_header` in a `location` | The headers of the `server` block are no longer inherited | Put all the headers at the same level, or include them |
| Forgetting WebSocket and timeouts | Without `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";`, a [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) connection fails; after `proxy_read_timeout` (60 s by default), nginx cuts off a response that is too slow | Add these three directives for the WebSocket paths and set the timeout |
| Forgetting `Host` | The application receives the name of the `upstream` group | `proxy_set_header Host $host;` |
| Limiting only by API key | The requests without a key escape the zone | Keep a limit by address as well |
| One bucket per received key, without validation | An attacker invents a new key for each request | Create a dedicated bucket only for the known keys |
| Buckets never deleted | The memory grows with the number of addresses seen | Purge the inactive buckets, cap their number |
| Counter in each instance | With *n* instances, a client gets *n* times the limit | Shared counter (Redis) or limit at the proxy |
| System clock to measure time | A change of time can make time go backwards | A monotonic clock (`performance.now()`) |
| Non-integer `Retry-After` | The header is written in whole seconds | Round up (`Math.ceil`) |
| Fixed window for a per-second limit | Double the limit passes around the boundary | Token bucket for short limits |
| Also counting the refused requests | A polite client that insists never gets out | A refusal consumes no token |

## Best practices

| Best practice | Why |
|---|---|
| Terminate TLS on the proxy and re-encrypt towards the applications if the internal network is not safe | A single place manages the certificates; the internal traffic stays protected when it needs to be |
| Forward `Host`, `X-Forwarded-For` and `X-Forwarded-Proto` | The application knows the domain, the client and the original protocol |
| Explicitly declare the list of trusted proxies | Trust is a written choice, not a default |
| Limit by address at the proxy, then by key or by account in the application | Each layer sees what it knows |
| Set the capacity of the bucket to the legitimate burst, and the rate to the average | A normal user never reaches the limit |
| Answer 429 with `Retry-After` rather than cutting the connection | Well-written clients know when to come back |
| Test the behavior with simulated clocks and forged addresses | The edge cases are checked without waiting or attacking |
| Monitor the number of refusals | A spike in refusals signals a client bug or an attack |
| Run `nginx -t` before each reload | A syntax error does not take the site down |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A **reverse proxy** is an intermediary placed in front of the application servers: it terminates TLS, spreads the load, keeps a cache, hides the servers and compresses. A **forward proxy** protects the clients instead. **Rate limiting** caps the requests per client; the **token bucket** accepts a burst equal to its capacity then follows the pace of the rate, whereas the fixed window lets through double the limit around the boundary (10 requests accepted against 5 in the test). A **429** response with `Retry-After` says when to retry. Behind a proxy, the application sees the address of the proxy: the address of the client is read in `X-Forwarded-For`, only if the peer is a known proxy, from right to left. |
| **Pitfalls to avoid** | Reading the address of the connection behind a proxy; believing `X-Forwarded-For` when the peer is unknown, or taking its first address; leaving the application reachable without going through the proxy; caching a personalized page; limiting only by API key; creating a bucket for any invented key; keeping the buckets without purging them; counting separately in each instance; losing the `proxy_set_header` in a `location`. |
| **Best practices** | Forward `Host`, `X-Forwarded-For` and `X-Forwarded-Proto`; declare the list of trusted proxies; limit by address at the proxy and by key in the application; token bucket for short limits; 429 with `Retry-After`; shared counters when there are several instances; `nginx -t` before any reload. |
