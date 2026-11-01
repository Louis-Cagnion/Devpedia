---
order: 9
---

# Web servers (31/10/2026)

When you type an address into a browser, a page appears: somewhere, a program received your request and sent back the content. That program is a **web server**. This chapter explains what it does, how it is configured, how it handles several visitors at once, and how to read what it writes in its logs. It assumes you know how to open a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type commands on the keyboard).

The word "server" has two meanings that must be told apart right away:

| Meaning | What it is | Example |
|---|---|---|
| The machine | A computer that is always on, connected to the Internet, and providing services | A computer in a data center |
| The program | Software that waits for requests and answers them | nginx, Apache, Caddy (presented below) |

In this chapter, "web server" means the **program**. One same machine can run one, several, or none. The **browser** (the software that displays pages: [Firefox](https://www.mozilla.org/en-US/firefox/), [Chrome](https://www.google.com/chrome/)...) plays the other role, that of **client**: it asks, the server answers. The rules of this exchange are called **HTTP** (*HyperText Transfer Protocol*); its methods (`GET`, `POST`...) and its status codes (`200`, `404`...) are explained in [Exchanging Data: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) and are not repeated here.

## A program that listens on a port

A machine connected to a network has an **IP address** (a number that identifies it, see [Network Fundamentals](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)). But several programs can run on the same machine: how does a message know which one it is for? Thanks to the **port**, a number between 0 and 65535 that designates one specific program on the machine.

> **Analogy:** the IP address is the address of a building, the port is the apartment number. The mail arrives at the building, then goes to the right door.

A web server **listens** on a port: it reserves it with the system, then waits for a client to connect to it. This is the mechanism of the [socket](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) (the network communication point of a program) described in its own chapter.

```text
 CLIENT (browser, curl...)                  SERVER MACHINE (IP 203.0.113.10)

                                            port 25   : another program
 1. opens a connection to port 80           port 80   : [ web server ]  <- listening
    ---------------------------------------->      |
 2. sends the request                              | 3. looks for the resource
    "GET /contact.html"                            |    (a file or a computation)
    ---------------------------------------->      |
                                                   | 4. builds the response
 5. receives the response                          |    status + headers + body
    <----------------------------------------      v
 6. displays it (page, image, data...)
```

The address `203.0.113.10` is reserved for documentation: it does not exist on the real Internet.

Port numbers are not free. Some are a worldwide convention:

| Port | Use | Remark |
|---|---|---|
| `80` | HTTP, without encryption | Default port: the browser assumes it for an address starting with `http://` |
| `443` | HTTPS, with encryption (explained in the HTTPS section below) | Default port for an address starting with `https://` |
| `8080`, `8000`, `3000`... | [Development servers](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) | Simply a habit, no rule |

When the address contains no port, the browser chooses `80` or `443` depending on the start of the address. `http://example.test:8080/` forces port `8080`.

## See the request/response cycle for real

Nothing beats a tiny server that you can read in full. The `serveur.js` file below runs a web server in about forty lines. It is written in [JavaScript](/?c=langages&s=javascript&p=javascript) and run by **Node.js** (a program that runs JavaScript outside the browser). To install it, follow the instructions on the [official site](https://nodejs.org), then check in the terminal with `node --version`: a version number is displayed. Then copy the code below into a file named `serveur.js`, created with a [code editor](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide). The `http` module used is described in the [Node.js documentation](https://nodejs.org/api/http.html). You do not need to master the language (see [JavaScript functions](/?c=langages&s=javascript&p=fonctions) for the `=>` notation): each line is commented, and what matters is the flow.

```javascript
// http is the Node.js module that knows how to speak the HTTP protocol
// require("...") loads a module; const names the result (a value that does not change)
const http = require("node:http");

// A table: each value of the Host header matches the text of a site
// (\n is a line break in the text)
const sites = {
  "a.example.test": "Welcome to site A\n",
  "b.example.test": "Welcome to site B\n",
};

// createServer receives a function that is called for EACH request received
// ((request, response) => { ... } is an arrow function: parameters, arrow, body)
const server = http.createServer((request, response) => {
  // request.method: the method (GET...); request.url: the path requested
  console.log(request.method, request.url, request.headers.host);

  // /slow: wait one second before answering (used further down)
  // setTimeout(function, 1000) runs the function after 1000 milliseconds (1 second)
  // response.end(text) sends the text then ends the response
  if (request.url === "/slow") {
    setTimeout(() => response.end("done\n"), 1000);
    return;
  }

  // /time: a response computed at each request (dynamic content)
  // toISOString gives the date in the format 2026-10-31T20:10:43.333Z: T separates the date
  // from the time, Z means "UTC time" (universal time, without offset)
  if (request.url === "/time") {
    response.end(new Date().toISOString() + "\n");
    return;
  }

  // We look up the requested site thanks to the Host header, without the port number
  // "a || b" is a if it exists, otherwise b; split(":")[0] keeps what precedes the ":"
  const name = (request.headers.host || "").split(":")[0];
  const text = sites[name];

  // No site with this name: status 404 ("not found") and a short message
  if (text === undefined) {
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("No site with this name\n");
    return;
  }

  // Otherwise: status 200 ("success"), a header describing the content, then the body
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(text);
});

// listen: the program reserves port 8081 and waits for connections
server.listen(8081, "127.0.0.1", () => console.log("listening on 8081"));
```

The address `127.0.0.1` is the address of **the machine itself**: the server can therefore only be reached from your computer. Start it in a first terminal with `node serveur.js` (`Ctrl+C` in this terminal stops it), then query it from a second one with **curl**, a command-line tool that sends an HTTP request and displays the response (see [its documentation](https://curl.se/docs/)). The `-i` option also displays the headers of the response. The `-H` option adds a header to the request, here `Host` (its role is explained in the section on virtual hosts).

```bash
# -i: displays the status line and the headers of the response before its body
# -H: sends the header "Host: a.example.test" in the request
curl -i http://127.0.0.1:8081/ -H 'Host: a.example.test'
```

Output obtained:

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:10:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 18

Welcome to site A
```

The `-v` option (*verbose*) also shows the request sent, preceded by the `>` sign; the response is preceded by `<`. Here are these lines for the same request:

```text
> GET / HTTP/1.1
> Host: a.example.test
> User-Agent: curl/8.5.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Date: Sat, 31 Oct 2026 20:10:22 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 18
<
```

| Line | Name | Role |
|---|---|---|
| `GET / HTTP/1.1` | Request line | The method, the path requested, the protocol version |
| `Host: ...` | Request header | The name of the targeted site (see the section on virtual hosts) |
| `User-Agent: ...` | Request header | The software that sends the request (here curl, often a browser) |
| `Accept: */*` | Request header | The content types accepted (`*/*`: all of them) |
| empty line | Separator | Marks the end of the headers; the body comes next |
| `HTTP/1.1 200 OK` | Status line | The version, the status code, its text |
| `Content-Type` | Response header | The nature of the content (text, image, [HTML](/?c=langages&s=html&p=html) page...) and its encoding (the way the letters are coded as bytes, a **byte** being the unit of size of a piece of data) |
| `Content-Length: 18` | Response header | The size of the body in bytes (roughly one simple character per byte: here 18, line break included) |
| `Connection: keep-alive` | Response header | The connection stays open for the next request |
| `Keep-Alive: timeout=5` | Response header | It will be closed after 5 seconds without a new request |

A **header** is a line `Name: value` that gives information about the exchange. The **body** is the content itself, after the empty line. Last case, an unknown site: the server answers `404`.

```bash
# The name unknown.test is not in the table: a 404 status is expected
curl -i http://127.0.0.1:8081/ -H 'Host: unknown.test'
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:10:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 23

No site with this name
```

During these tests, the server's terminal displayed what the `console.log` line of the code does: a minimal **log** of each request received. Here is an extract, that of the first four calls (site A, unknown site, site B, call with `-v`), then of the three calls to `/slow` seen further down; the calls to `/time` and with `--resolve` add their own lines:

```text
listening on 8081
GET / a.example.test
GET / unknown.test
GET / b.example.test
GET / a.example.test
GET /slow 127.0.0.1:8081
GET /slow 127.0.0.1:8081
GET /slow 127.0.0.1:8081
```

When the server is not running, nobody listens on the port: the connection is refused before even a request exists.

```text
curl: (7) Failed to connect to 127.0.0.1 port 8081 after 0 ms: Couldn't connect to server
```

This message is therefore **not** an HTTP response: there is no status code. The difference with a `404` or `500` error is the one described in [the chapter on HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) between "no response" and "error response".

## Static content and dynamic content

A web server can answer in two very different ways:

| | Static content | Dynamic content |
|---|---|---|
| What it is | A file as it is stored ([HTML](/?c=langages&s=html&p=html) page, image, style sheet, script) | A response computed at the moment of the request by a program |
| Who produces the response | The web server alone: it reads the file and sends it | An application program ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), Node.js...) that the server calls |
| Two successive visits | Same result, as long as the file does not change | A result that may differ (time, logged-in user, content of the [database](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) |
| Speed | Very fast | Depends on the computation |
| Example in this chapter | `contact.html` served by Apache | The `/time` route of the Node server |

The `/time` route of `serveur.js` computes its response at each call. Two calls two seconds apart:

```bash
# -s: silent mode (curl does not display its progress bar, only the response)
curl -s http://127.0.0.1:8081/time
# Same call, two seconds later
curl -s http://127.0.0.1:8081/time
```

```text
2026-10-31T20:10:43.333Z
2026-10-31T20:10:45.343Z
```

Some web servers, such as nginx, do not run PHP code themselves. They **pass** the request to a dedicated program, then send back to the client what that program produced. For PHP, this program is PHP-FPM, presented in the chapter [Responding to the client, then continuing to work (PHP-FPM)](/?c=langages&s=php&p=php-fpm):

```text
Request GET /index.php?id=3
        |
        v
 Web server ---- file .html, .css, .png? ---> read from disk and sent
        |
        +-------- file .php? ----------------> passed to PHP-FPM
                                                    (which runs the script)
                                                           |
        response sent to the client  <-----------------------+
```

This is also what a [server-side rendering](/?c=langages&s=javascript&p=ssr-vs-csr) does: the page is built before it is sent, instead of being assembled in the browser.

## Three common web servers: nginx, Apache, Caddy

Three free web servers (their code is public and their use is free) are very widespread, or gaining ground in the case of Caddy. They do the same job (listening on a port, answering in HTTP) but differ in their history and in how they are configured:

| | nginx | Apache HTTP Server | Caddy |
|---|---|---|---|
| What it is | A web server known for handling many connections with little memory | The oldest of the three, very modular (functions are added through modules) | A recent web server that enables HTTPS encryption on its own |
| Configuration | A single file made of `{ }` blocks | Files made of `<...>` blocks; local settings possible per folder (`.htaccess`) | A short file, the `Caddyfile` |
| Documentation | [nginx.org](https://nginx.org/en/docs/) | [httpd.apache.org](https://httpd.apache.org/docs/current/) | [caddyserver.com](https://caddyserver.com/docs/) |

A **module** is a piece of functionality that you enable or not (encryption, compression, redirections). A **`.htaccess`** file is, with Apache, a small settings file placed in a folder of the site: handy, but Apache has to reread it at each request, which slows things down.

The choice depends on the context: none of them is "the right one". On a machine supplied by a hosting provider, the server is often already chosen.

## A minimal configuration file (nginx)

A web server guesses nothing: everything it does (which sites, which folders, which ports) is described in a **configuration file**, a text file that the server reads when it starts. Each line there is a **directive** (a setting: a name followed by its value, ending with `;` in nginx). Directives are grouped in **blocks** delimited by `{ }`, which nest inside each other like Russian dolls.

Here is a complete and minimal configuration for nginx. It serves a folder of static files on port 80. It is usually found in `/etc/nginx/nginx.conf` (the location varies depending on the installation).

```nginx
# Number of worker processes (see below); "auto": one per processor core
# (a core is a calculation unit of the chip)
worker_processes auto;
# File where nginx writes its errors, with the minimum level "warn" (warning)
error_log /var/log/nginx/error.log warn;

# "events" block: settings for handling connections
events {
    # Maximum number of connections that each worker handles at the same time
    worker_connections 1024;
}

# "http" block: everything concerning the HTTP protocol
http {
    # Loads the table that associates an extension (.html, .png) with a content type
    include /etc/nginx/mime.types;
    # Content type used when the extension is unknown
    default_type application/octet-stream;
    # File where nginx notes each request received
    access_log /var/log/nginx/access.log;

    # "server" block: a web site (a "virtual host", see below)
    server {
        # Listens on port 80
        listen 80;
        # This block answers the requests whose Host header is one of these two names
        server_name example.test www.example.test;
        # The folder that contains the files of the site
        root /var/www/example;
        # File sent back when the requested address is a folder ("/")
        index index.html;

        # "location" block: rule for the paths that start with "/" (all of them)
        location / {
            # Looks for the file ($uri), then a folder of the same name, otherwise 404
            try_files $uri $uri/ =404;
        }
    }
}
```

`$uri` is an nginx **variable**: it contains the path requested by the client (for example `/contact.html`). Once the file is written, two commands are enough to check it and apply it without cutting off the visitors in progress (`sudo` is the command that runs the next one with administrator rights, which are needed here):

```bash
# -t: "test", checks the syntax of the configuration file without starting anything
sudo nginx -t
# -s reload: asks nginx to reread its configuration without stopping
sudo nginx -s reload
```

To serve PHP, you add, inside the `server` block (with `index index.php;` if the requested address can be a folder), a `location` block that passes the requests for `.php` files to PHP-FPM, as in the diagram of the previous section:

```nginx
# The paths that end with .php (the "~" introduces a regular expression)
location ~ \.php$ {
    # Brings in the usual variables of the FastCGI protocol (the dialogue protocol
    # between the web server and PHP-FPM)
    include fastcgi_params;
    # Tells PHP-FPM which script to run
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    # Passes the request to PHP-FPM, reachable through this socket (path varies)
    fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

A **regular expression** is a search pattern in a text (see [the dedicated chapter](/?c=langages&s=javascript&p=regex)). The FastCGI protocol and the PHP-FPM socket are explained in the [PHP-FPM chapter](/?c=langages&s=php&p=php-fpm).

### The same thing with Apache and Caddy

To compare, here is the same site with Apache. This configuration is derived from the one that was **actually run** for this chapter: only one of the two sites appears, the paths are shortened, and the `LogFormat` line is shown further down, in the section on logs. A typical installation file is split into several pieces:

```apache
# The working folder of the server (relative paths, temporary files)
ServerRoot "/path/to/apache"
# Listens on port 8082 of the local machine
Listen 127.0.0.1:8082
# Loads the module that handles connections (see the section on workers)
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so
# Module that decides who has the right to access what
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
# Module that serves index.html when the requested address is a folder
LoadModule dir_module /usr/lib/apache2/modules/mod_dir.so
# Module that associates an extension with a content type
LoadModule mime_module /usr/lib/apache2/modules/mod_mime.so
# The table of content types
TypesConfig /etc/mime.types
# The error file
ErrorLog "/path/to/apache/logs/error.log"
# The name of the server itself (avoids a warning at startup)
ServerName localhost

# A site: the block is opened for the address and port given
<VirtualHost 127.0.0.1:8082>
    # It answers the requests whose Host header is a.example.test
    ServerName a.example.test
    # The folder that contains the files of the site
    DocumentRoot "/path/to/apache/site-a"
    # The file where each request is noted, in the "combined" format (see below)
    CustomLog "/path/to/apache/logs/access-a.log" combined
    # Rules that apply to this folder
    <Directory "/path/to/apache/site-a">
        # Allows everyone to read this folder
        Require all granted
    </Directory>
</VirtualHost>
```

The `combined` format is defined in the test file by a `LogFormat` line. As with nginx, we test before applying:

```bash
# -t: checks the syntax of the file designated by -f, without starting the server
apache2 -t -f /path/to/apache/httpd.conf
```

```text
Syntax OK
```

With Caddy, the same site fits in two directives (**not verified**: Caddy is not installed on the writing machine). The file is called `Caddyfile`:

```text
# The site: ":8080" means "port 8080, under any name"
:8080 {
    # The folder that contains the files of the site ("*": for all paths)
    root * /var/www/example
    # Enables sending the static files of this folder
    file_server
}
```

| Need | nginx | Apache | Caddy |
|---|---|---|---|
| Listen on a port | `listen 80;` | `Listen 80` | `:80 { ... }` |
| Site name | `server_name` | `ServerName` | The name at the top of the block |
| Site folder | `root` | `DocumentRoot` | `root *` |
| Test the configuration | `nginx -t` | `apache2 -t` (`httpd -t` on other distributions) | `caddy validate` |

## Several sites on one machine: virtual hosts

A hosting provider can run hundreds of sites on a single machine, with **a single IP address** and **a single port 80**. How does the server know which one to display? Thanks to the **`Host`** header, which the client sends in each request with the name of the site typed in the address: `GET / HTTP/1.1` followed by `Host: a.example.test`. This is the principle of **virtual hosts** (*virtual hosts* in Apache, `server` blocks in nginx): one same program behaves like several different sites depending on the name requested. The reference documentation for this header is on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Host).

```text
                       +---- Host: a.example.test ----> site A (folder site-a)
Requests ---> port 80  |
 (one single IP)       +---- Host: b.example.test ----> site B (folder site-b)
                       |
                       +---- Host: other-name.test ----> default site
```

The Node server of the previous section does exactly this with its `sites` table. Same address, same port, two different answers depending on `Host`:

```bash
# Same address and same port, but a different Host header at each call
curl -s -H 'Host: a.example.test' http://127.0.0.1:8081/
curl -s -H 'Host: b.example.test' http://127.0.0.1:8081/
```

```text
Welcome to site A
Welcome to site B
```

With nginx, two sites are written with two `server` blocks inside the `http` block (**not verified**, the syntax is that of the file in the previous section):

```nginx
server {
    # First site: answers to the name a.example.test
    listen 80;
    server_name a.example.test;
    root /var/www/site-a;
}

server {
    # Second site: answers to the name b.example.test
    listen 80;
    server_name b.example.test;
    root /var/www/site-b;
}
```

What happens when the requested name matches no site? Each server has a fallback rule. With the Apache test carried out for this chapter (two virtual hosts `a.example.test` and `b.example.test`), a request with `Host: inconnu.test` received a `200` status: it is the **first** site declared in the file that answers, the default site. The same behavior exists in nginx (the first `server` block, unless another one is designated with `listen 80 default_server;`).

> **Pitfall:** the default site is served to anyone who only knows the IP address, or to a robot that tries all addresses. If it is a real site, it ends up exposed under a name that nobody chose.
>
> **Best practice:** declare first a "trash" site that answers with an error or an empty page. With nginx: `server { listen 80 default_server; return 444; }` (the status `444` is specific to nginx: it closes the connection without answering anything).

To try a virtual host without buying a domain name, there are two local solutions: the system's [hosts file](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server), which associates a name with an IP address, or the `--resolve` option of curl:

```bash
# Tells curl: the name a.example.test:8081 is at the address 127.0.0.1
curl -s --resolve a.example.test:8081:127.0.0.1 http://a.example.test:8081/
```

```text
Welcome to site A
```

A **domain name** is the readable name of a site (`example.test`). The suffix `.test` is reserved for tests, like the address `203.0.113.10` seen above: it does not exist on the real Internet. Turning a name into an address is the job of the [**DNS**](https://developer.mozilla.org/en-US/docs/Glossary/DNS) (*Domain Name System*): the directory of the Internet that translates `example.test` into an IP address. The hosts file and `--resolve` bypass this directory for your tests.

## Ports 80 and 443, and HTTPS

**HTTPS** is HTTP wrapped in a layer of encryption, **TLS** (*Transport Layer Security*): the content of the exchanges becomes unreadable to anyone who intercepts the traffic along the way, and the client can check that it is indeed talking to the right server. HTTPS traditionally listens on port `443`. For the encryption itself (keys, certificates), see [applied cryptography](/?c=securite&s=cybersecurite&p=cryptographie-appliquee): the same chapter also shows how to make a self-signed certificate, with the `openssl` command. A **self-signed** certificate is one that you sign yourself and that nobody else recognizes.

An HTTPS server needs two files:

| File | Content | Must it be protected? |
|---|---|---|
| The certificate | The public key of the server, its name, and the signature of a certification authority that attests the link between the two | No, it is sent to every visitor |
| The private key | The secret key that proves that the server is indeed the owner of the certificate | **Yes, strictly**: whoever holds it can pass themselves off as the site |

The test was done with Apache, a self-signed certificate for `a.example.test` (obtained with the command `openssl req -x509 ...` from the chapter cited above, with the option `-addext "subjectAltName=DNS:a.example.test"` that specifies the name covered) and two sites: one on port `8082` that redirects, the other on `8443` in HTTPS (ports `80` and `443` require special rights, see below). Extract of the configuration:

```apache
# "HTTP" port of the test: answers with a redirection to the encrypted version
<VirtualHost 127.0.0.1:8082>
    ServerName a.example.test
    # Permanent redirect: status 301 "permanently moved" to the new address
    Redirect permanent / https://a.example.test:8443/
</VirtualHost>

# "HTTPS" port of the test: serves the site
<VirtualHost 127.0.0.1:8443>
    ServerName a.example.test
    DocumentRoot "/path/to/apache/site-a"
    # Enables TLS encryption on this site
    SSLEngine on
    # The certificate, sent to every visitor
    SSLCertificateFile "/path/to/tls/certificate.pem"
    # The private key, which never leaves the server
    SSLCertificateKeyFile "/path/to/tls/private-key.pem"
</VirtualHost>
```

First request, in plain HTTP:

```bash
curl -s -i --resolve a.example.test:8082:127.0.0.1 http://a.example.test:8082/
```

```text
HTTP/1.1 301 Moved Permanently
Location: https://a.example.test:8443/
```

(Extract: the response contains other headers and a short HTML body.) The server does not serve the page: it answers `301` with a `Location` header that gives the new address, and the browser follows it. Second request, in HTTPS, with `-v` to see the TLS negotiation (**handshake**) and `--cacert` to tell curl to trust the self-signed certificate:

```bash
# --cacert: trusts this specific certificate, since no recognized authority signed it
curl -sv --cacert certificate.pem --resolve a.example.test:8443:127.0.0.1 \
    https://a.example.test:8443/
```

Relevant lines of the output (extract):

```text
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, Finished (20):
*  subject: CN=a.example.test
*  subjectAltName: host "a.example.test" matched cert's "a.example.test"
*  SSL certificate verify ok.
< HTTP/1.1 200 OK
<h1>Site A</h1>
```

The client says hello (*Client hello*), the server answers and presents its certificate, the two agree on a key, and only then does the HTTP request leave, already encrypted. Without `--cacert`, the same call fails:

```text
curl: (60) SSL certificate problem: self-signed certificate
```

This is the expected behavior: a certificate that no recognized party has signed proves nothing. A browser would display a warning page.

| Question | Answer |
|---|---|
| Where can you get a real certificate, free of charge? | From **Let's Encrypt**, a free certification authority that issues certificates through an automatic protocol, [ACME](https://datatracker.ietf.org/doc/html/rfc8555) ([documentation](https://letsencrypt.org/docs/)) |
| Who renews it? | A tool (such as [Certbot](https://certbot.eff.org)) that speaks this protocol and restarts the server; certificates are short-lived, so automatic renewal is essential |
| And with Caddy? | Caddy can request and renew certificates on its own for a site bearing a real domain name (**not verified** here, see its [documentation](https://caddyserver.com/docs/automatic-https)) |
| What about port 80? | Keep it open only to redirect to 443 (and for certificate validation with some methods) |

Redirecting port 80 to 443 with nginx (**not verified**):

```nginx
server {
    # The HTTP port: serves no page, only sends back to HTTPS
    listen 80;
    server_name example.test;
    # Status 301 to the same address in https ($host: name received, $request_uri: path)
    return 301 https://$host$request_uri;
}
```

One last practical point: on Linux, an ordinary program is not allowed to listen on a port below 1024. This limit can be checked on the writing machine (`cat /proc/sys/net/ipv4/ip_unprivileged_port_start` displays `1024`), and the Node server, launched as an ordinary user after replacing 8081 with 80 in `listen`, complains:

```text
Error: listen EACCES: permission denied 127.0.0.1:80
```

That is why, according to their documentation, production web servers start with administrator rights just long enough to open ports `80` and `443`, then hand the work over to processes with reduced rights (**not verified**: administrator rights would be needed to reproduce it). The machine's **firewall** must also let these ports through: see [the chapter on UFW and firewalld](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld). In [Docker](/?c=infrastructure-devops&s=docker&p=docker), the port is published with `-p 8080:80`, explained in [the chapter on volumes and networks](/?c=infrastructure-devops&s=docker&p=volumes-et-reseaux).

## Worker processes and simultaneous connections

A popular site receives thousands of requests per second. The server cannot process the visitors one by one while making all the others wait. Two ideas combine:

- **Several workers** (*workers*): a **process** is a program being run; a web server starts several of them that share the work (see [process management](/?c=langages&s=c&p=processus) for how they work). A **master** process (*master*) starts them and watches over them; the workers process the requests.
- **Several connections per worker**: a worker does not block while waiting for a slow client. It watches many connections at once and only deals with those that have something to do. This is the [event loop](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) described in the chapter on sockets.

```text
               +--------------------------+
               |   master process         |  starts, watches over, reloads the configuration
               +--------------------------+
                   |        |        |
              +--------+ +--------+ +--------+
              |worker1 | |worker2 | |worker3 |   each: an event loop
              +--------+ +--------+ +--------+
               /  |  \     /  |  \     /  |  \
          connections   connections   connections    (hundreds each)
```

> **Analogy:** a restaurant waiter who takes an order, passes it on to the kitchen, then moves on to the next table instead of standing in front of the kitchen waiting for the dish.

The Node server of this chapter is a tiny example of this: it runs in a single process, but the `/slow` route waits one second before answering. Three clients request it at the same time:

```bash
# time: measures the duration of the command in parentheses
# for i in 1 2 3; do ... done: repeats what is between do and done for i = 1, 2, 3
# (see the chapter on Bash loops)
# The & launches each request in parallel; wait waits for their end
time (for i in 1 2 3; do curl -s http://127.0.0.1:8081/slow & done; wait)
```

```text
done
done
done

real    0m1,01s
```

The total time measured by `time` is **1.01 seconds**, not 3 seconds: the server did not wait for the first response to finish before accepting the second. The three requests waited together.

With nginx, two directives in the configuration file set the capacity:

| Directive | Role | Value in the example |
|---|---|---|
| `worker_processes` | Number of workers (in practice, one per processor core, that is to say per calculation unit of the chip) | `auto` |
| `worker_connections` | Maximum number of connections per worker | `1024` |

The theoretical ceiling of simultaneous connections is their product: 4 cores × 1024 connections = 4096 (**not verified**, nginx is not installed; the real ceiling also depends on the system, see below). Each open connection uses a [file descriptor](/?c=langages&s=c&p=appels-systeme-et-descripteurs), and the system limits their number per process (see [limiting a program's resources](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources) for the limits). A `worker_connections` value above this limit is therefore pointless.

Apache offers several ways of working, called **MPMs** (*Multi-Processing Module*), that is to say a module that decides how the processes and the **threads** (parallel threads of execution inside one same process) share the connections:

| MPM | How it works (according to the Apache documentation) | Remark |
|---|---|---|
| `prefork` | One process per connection, without thread | Robust, memory-hungry; required by some older modules |
| `worker` | Several processes, each with several threads | Less memory than `prefork` |
| `event` | Like `worker`, but idle connections are handled separately to free the threads | The common choice today |

On the writing machine, the command `apache2 -f httpd.conf -V` reports `Server MPM: event`, and the command `ps -o pid,ppid,comm` (which lists processes) shows, during the test, a parent and several children. The PID is the identification number of a process, the PPID that of its parent process:

```text
    PID    PPID COMMAND
  84277   84275 apache2
  84278   84277 apache2
  84279   84277 apache2
  84354   84277 apache2
```

Processes 84278, 84279 and 84354 are the children of process 84277. The descriptions of `prefork` and `worker` above are **not verified** here: only `event` was available during this test.

> **Pitfall:** setting `worker_connections` very high without checking the available memory: each connection consumes a little of it, and a saturated machine slows the whole site down. For attacks that aim precisely at saturating a server, see [overload and application-level denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

## Access and error logs

A web server continuously writes what it does into text files, the **logs**. They answer the question "what happened, and to whom?". There are always two of them:

| Log | Content | When to read it |
|---|---|---|
| **Access** log (*access log*) | One line per request received: who, when, what, and which status | To see who visits, spot `404`s, measure traffic |
| **Error** log (*error log*) | The problems met by the server itself, and its startup | A site answering `500`, a server that does not start |

Usual locations (Apache's is verified on the writing machine, the other two are **not verified**):

| Server | Access | Errors |
|---|---|---|
| Apache (Debian, Ubuntu) | `/var/log/apache2/access.log` | `/var/log/apache2/error.log` |
| nginx | `/var/log/nginx/access.log` | `/var/log/nginx/error.log` |
| Caddy | Disabled by default, configurable in the `Caddyfile` | Displayed in the terminal where Caddy runs |

### Reading a line of the access log

nginx and Apache (Debian) write by default in the **combined** format, and Caddy writes in JSON. Here are ten lines obtained during the tests of this chapter: ten requests sent to an Apache site with two pages (`/` and `/contact.html`), three of which go to pages that do not exist. The format is defined in the test configuration by:

```apache
# Defines a format named "combined": each % is a variable replaced by a value
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
```

```text
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /absent.html HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /wp-login.php HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /.env HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "https://x.test/" "Mozilla"
```

Breakdown of the last line:

| Part | Variable | Meaning |
|---|---|---|
| `127.0.0.1` | `%h` | The IP address of the client |
| `-` (first) | `%l` | Identity of the client under an old protocol, almost always absent (`-`) |
| `-` (second) | `%u` | User name, if the site asks for authentication (otherwise `-`) |
| `[31/Oct/2026:21:14:30 +0100]` | `%t` | Date and time of the request, with the time offset |
| `"GET / HTTP/1.1"` | `%r` | The request line: method, path, version |
| `200` | `%>s` | The status code of the response |
| `16` | `%b` | The size of the body sent, in bytes (`-` if none) |
| `"https://x.test/"` | `%{Referer}i` | The page the visitor comes from (`-` if unknown) |
| `"Mozilla"` | `%{User-Agent}i` | The software of the client |

The header is written `Referer`, with a single `r` in the middle: a spelling mistake present since the very origin of the standard, and kept ever since.

Note the `404` lines: `/wp-login.php` (the login page of [WordPress](https://wordpress.org), software widely used to create sites) and `/.env` (a file that often contains the passwords and access keys of an application, see [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) do not exist on this site, but robots request them everywhere on the Internet, hoping to land on an administration page or a poorly protected secrets file. These `404`s are therefore **normal** and harmless. A `/.env` line with a `200` status would on the contrary be serious: a file that was not meant to be published would have been.

### Reading a line of the error log

To see more details, Apache accepts a **logging level** (`LogLevel info`): the closer the level is to `debug`, the chattier the log. The levels, from the most serious to the most verbose, are `emerg`, `alert`, `crit`, `error`, `warn`, `notice`, `info`, `debug` (nginx uses the same levels: **not verified**). Two requests cause two lines in the error log: the first corresponds to a missing file, the second to an address containing `../` (an attempt to leave the folder of the site and reach `/etc/passwd`, the file that lists the accounts of a Linux system):

```text
[Sat Oct 31 21:07:24.865848 2026] [core:info] [pid 81231:tid 134962096056000]
    [client 127.0.0.1:52190] AH00128: File does not exist: [...]/site-a/absent.html
[Sat Oct 31 21:07:24.871139 2026] [core:error] [pid 81320:tid 134962096056000]
    [client 127.0.0.1:52192] AH10244: invalid URI path (/../../etc/passwd)
```

(Each entry takes up a single line in the real file; it is cut here for reading, and the path of a temporary folder is shortened to `[...]`.) The parts, from left to right: the time, `[module:level]`, the number of the process (`pid`) and of the thread of execution (`tid`) that handled the request, the client, a code specific to Apache (`AH...`), then the message. This code is valuable: you search for it as it is in the [documentation](https://httpd.apache.org/docs/current/) or on the Internet.

### Searching a log with commands

A log can contain millions of lines: nobody reads it by eye. The tools of [text processing in Bash](/?c=langages&s=bash&p=traitement-de-texte) (`grep`, `awk`, `sort`, `uniq`) and [pipes](/?c=langages&s=bash&p=redirections-et-pipes) (`|`, which sends the output of one command to the input of the next) are enough. In the `combined` format, `awk` numbers the columns separated by spaces: `$7` is the path, `$9` the status.

```bash
# Follows the log live (Ctrl+C to stop): watch the requests arrive
tail -f /var/log/apache2/access.log
# Counts the requests by status: extracts column 9, sorts, counts the duplicates
# sort -rn: -n sorts by numeric value, -r reverses the order (the largest first)
awk '{print $9}' access-a.log | sort | uniq -c | sort -rn
```

```text
      7 200
      3 404
```

```bash
# Which paths caused a 404? (column 9 equal to 404, we display the path)
awk '$9==404 {print $7}' access-a.log | sort | uniq -c | sort -rn
```

```text
      1 /wp-login.php
      1 /.env
      1 /absent.html
```

```bash
# The three most requested pages (head -n 3: keeps the first three lines)
awk '{print $7}' access-a.log | sort | uniq -c | sort -rn | head -3
```

```text
      4 /
      3 /contact.html
      1 /wp-login.php
```

| Command | Role |
|---|---|
| `tail -f file` | Displays the end of the file and updates it live (*follow*) |
| `tail -n 50 file` | Displays the last 50 lines |
| `grep ' 500 ' file` | Keeps the lines containing the status `500` |
| `awk '{print $1}' file \| sort \| uniq -c` | Counts the requests by IP address |
| `sort -rn` | Sorts by decreasing count (the most frequent first) |
| `head -n 3` | Keeps the first 3 lines |

When the logs of dozens of machines must be read together, they are centralized in a dedicated tool: see [ELK: Centralizing and Querying Infrastructure Logs](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs).

### Logs grow: rotation

A log only grows. Without precautions, it ends up filling the disk, and a full disk stops the site. **Rotation** consists in regularly renaming the current file (`error.log` becomes `error.log.1`), starting a new one, compressing the old ones (`.gz`: a file compressed with gzip) and deleting the oldest. On the writing machine, Apache's folder shows the result of this operation:

```text
access.log   error.log   error.log.1   error.log.2.gz   error.log.3.gz
error.log.4.gz   other_vhosts_access.log
```

Under Linux, the [`logrotate`](https://github.com/logrotate/logrotate) program takes care of it according to its own configuration files (general behavior; its configuration is not detailed here). Access logs contain visitors' IP addresses, which are **personal data** within the meaning of the [**GDPR**](https://www.cnil.fr/fr/reglement-europeen-protection-donnees) (the European regulation on the protection of personal data): they are not kept indefinitely, and access to them is given only to those who need it.

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Changing the configuration then reloading without testing | A syntax error can prevent the restart and cut off the site | Always run `nginx -t` or `apache2 -t` before reloading |
| Forgetting the final semicolon of an nginx directive | The file is refused, and the server does not start | Read the error message: it gives the line number |
| Serving too wide a folder | `root /var/www` publishes everything in it, including backup or secret files | Publish only the folder of the site, and never leave a `.env` or an archive in it |
| A default site that serves a real site | Someone who only knows the IP address sees a site they were not supposed to see | Declare a first "trash" site (empty response or error) |
| `EADDRINUSE` at startup | The port is already taken by another program (often the old instance of the same server) | Stop the other program or change the port |
| Confusing a curl message with an HTTP status | `Failed to connect` is not a status: nobody is listening | First check that the server is running and listening on the right port |
| A log that grows endlessly | A full disk stops the site | Set up rotation, and monitor disk space |
| A private key readable by everyone, or sent to a repository | Anyone who reads it can pass themselves off as the site | Restrict the rights to the server account alone, never put it in a Git repository |
| An expired certificate | Browsers display a warning or block the site | Automatic renewal and monitoring of the expiry date |

The `EADDRINUSE` message is reproduced by starting this chapter's server twice:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:8081
```

## Best practices

| Practice | Reason |
|---|---|
| Test the configuration before reloading (`nginx -t`, `apache2 -t`) | An error is detected before it has any effect |
| Reload rather than restart (`nginx -s reload`) | The visitors in progress are not cut off |
| Systematically redirect port 80 to 443 | No page is ever served without encryption |
| Automate the renewal of certificates | A certificate that expires cuts off the site, and nobody thinks to renew it by hand |
| Keep the configuration in a [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base) repository | We see who changed what, and we can go back |
| Read the error log first when a site answers `500` | It says why, whereas the browser says nothing |
| Make the application server listen on `127.0.0.1` when it does not need to be public | Only the machine can reach it, and the web server, placed in front, relays the requests (see [the reverse proxy](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit)) |
| Keep the web server up to date | A server exposed to the Internet is scanned continuously |
| Add a filter upstream if the site is exposed | See [the web application firewall (WAF)](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), which adds to secure code without replacing it |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A web server is a program that listens on a port (`80` for HTTP, `443` for HTTPS), receives a request, and sends back a response (status, headers, body). It serves files (static content) or passes the work to an application program (dynamic content, for example PHP-FPM). The `Host` header lets it host several sites on one same address. It shares the work among several worker processes, each handling many connections. It writes an access log (one line per request) and an error log. |
| **Pitfalls to avoid** | Reloading without testing the configuration. Leaving a default site that serves real content. Publishing too wide a folder. Exposing a private key. Forgetting log rotation. Taking a robot's `404` for a bug. |
| **Best practices** | Test, then reload. Switch everything to HTTPS with automatic certificate renewal. Read the error log before looking elsewhere. Monitor disk space and keep the configuration in Git. |

## In this subsection

This subsection, "Web servers", contains this introductory chapter and two chapters that complete it:

| Chapter | Subject |
|---|---|
| [HTTP status codes and control headers](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle) | HTTP statuses in detail, and the headers that control the client's behavior, such as `Retry-After` |
| [Reverse proxy and rate limiting](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) | Placing a server in front of other servers, and limiting the number of requests accepted |
