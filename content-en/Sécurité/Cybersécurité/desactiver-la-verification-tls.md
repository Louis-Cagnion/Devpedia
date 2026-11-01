---
order: 23
---

# Disabling TLS Verification: What the Option Really Turns Off (01/11/2026)

When a program calls an address that starts with `https://`, it is the **client** (the one asking) and the machine being called is the **server** (the one answering), as explained in [Exchanging Data: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). **HTTPS** is HTTP carried over a protected connection secured by **TLS** (*Transport Layer Security*), the protocol that encrypts the conversation and lets the client **check the identity of the server** thanks to a **certificate** (a digital ID card that the server presents). Almost every tool offers an option to **skip this check**: `curl -k` (the [curl program](https://curl.se/docs/manpage.html), which sends a request to an address from the terminal), `verify=False` (in Python) or `verify => FALSE` (in PHP), for example. It makes the blocking error disappear in one line, and that is precisely what makes it dangerous: the program works, and nothing guarantees anymore who it is talking to.

This chapter explains what verification checks, why we are tempted to turn it off, what it exposes (with a lab run on your machine, which touches no network, apart from an optional test against a public site flagged where it occurs), then the solutions that fix the real cause. It complements [Applied Cryptography for Developers](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (which explains encryption and builds a self-signed certificate) and the [network attacks](/?c=langages&s=php&p=securite#network-attacks) section of the PHP security chapter (which presents the man-in-the-middle attack in one definition); it does not repeat them. Two neighbouring chapters cover other ways of badly protecting an exchange or its traces: [REST resource and HTTP Basic authentication](/?c=securite&s=cybersecurite&p=authentification-http-basic-et-ressource-rest) (what HTTP Basic sends with every request) and [Personal data in logs and copies](/?c=securite&s=cybersecurite&p=donnees-personnelles-dans-les-journaux) (what a log keeps without anyone having wanted it).

| Part | Question |
|---|---|
| [What TLS verification guarantees](#what-tls-verification-guarantees) | What exactly does the client check, and what does encryption alone do? |
| [Why we are tempted to turn it off](#why-we-are-tempted-to-turn-it-off) | Which errors push someone to write `verify=False`? |
| [What turning it off exposes](#what-turning-it-off-exposes) | What can a third party placed between the client and the server do? |
| [The local lab](#local-lab-seeing-the-bypass-in-action) | How do you see it with your own eyes, safely? |
| [The equivalent options](#the-same-bypass-in-every-tool) | How is the bypass written in each tool? |
| [An example in a PHP framework](#an-example-in-a-php-framework-drupal-and-guzzle) | What does it look like in a real project? |
| [The right fixes](#the-right-fixes) | What to do instead, and how do you detect the oversight? |

## What TLS verification guarantees

TLS provides **three guarantees**, only one of which is removed by the option that turns off verification. Confusing them is the source of the danger:

| Guarantee | Question it answers | Who provides it |
|---|---|---|
| **Confidentiality** | Can someone listening on the cable read the conversation? | The encryption of the conversation |
| **Integrity** | Can someone change a message in transit without it showing? | Authenticated encryption (a tamper check attached to each message) |
| **Server authenticity** | Is the server in front of me really the one I think it is? | **The certificate verification** |

Encryption alone protects against a snoop who watches from outside. It says nothing about the other party: you can perfectly well encrypt a conversation with a stranger. Picture a steel door on the hallway (the encryption): it is useless if the person you let in is not the one you were expecting. Certificate verification is the check of the ID card at the door.

### What happens at connection time

Two terms of the diagram: the **public key** is the non-secret half of a key pair (the other half, the private key, never leaves the server), and the **session key** is a temporary key, invented for this one conversation, which is used to encrypt the messages (the chapter [applied cryptography](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) details the keys).

```
 CLIENT                                            SERVER
   |  1. "Hello, I want to talk to api.example.org"     |
   |--------------------------------------------------->|
   |  2. Here is my certificate (and my public key)     |
   |<---------------------------------------------------|
   |                                                    |
   |  3. THE CLIENT CHECKS (what we turn off):          |
   |     a. the signature leads back to a known CA      |
   |     b. the certificate name = the name requested   |
   |     c. the certificate is within its validity      |
   |        period                                      |
   |                                                    |
   |  4. If all is well: a session key is exchanged     |
   |<==================================================>|
   |  5. Conversation encrypted with this session key   |
```

A **certificate authority** (CA) is a trusted organization that signs certificates after checking the identity of the applicant (the chapter on [applied cryptography](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#the-self-signed-tls-certificate) gives the full definition, with the public key and the private key). Every operating system (or every tool) ships with a list of CAs that it believes on trust: this is the **trust store**. A certificate is accepted if its signature **leads back**, signature after signature, to a CA in that store: this chain of signatures is the **certificate chain**.

| Client check | It verifies that... | Typical message when it fails |
|---|---|---|
| **Chain** | The signature of the certificate leads back to a CA in the trust store | `self-signed certificate`; `unable to get local issuer certificate` (an OpenSSL message, not reproduced here) |
| **Name** | The requested name (`api.example.org`) appears in the list of names of the certificate (the **SAN** field, *Subject Alternative Name*) | `no alternative certificate subject name matches target host name` |
| **Dates** | Today's date is between the start date and the end date of the certificate | `certificate has expired` |
| **Key** | The server holds the private key linked to the certificate (it proves it during the exchange) | Connection failure (the message depends on the tool) |

A certificate links **a name** to **a public key**, and the CA vouches for that link. If the client does not check the chain, anyone can make a certificate in the name of `api.example.org`. If it does not check the name, any valid certificate (that of another site) is accepted in its place. A fifth check, **revocation** (a certificate cancelled before its end date), depends on the client and is not detailed here.

## Why we are tempted to turn it off

The option is not written out of malice. It almost always appears when an error blocks the work and the real cause takes time to find:

| Situation | What we see | Real cause | Why turning it off is tempting |
|---|---|---|---|
| Development server with a **self-signed** certificate (made by yourself) | `self-signed certificate` | The certificate leads back to no CA in the trust store | "It's only my machine, it doesn't matter" |
| **Expired** certificate on a test or internal server | `certificate has expired` | Nobody renewed the certificate | Renewal depends on another team, and the delivery is tomorrow |
| Call by an **IP address** or an alias | `no alternative certificate subject name matches...` | The certificate was issued for another name | The right name is not yet in the DNS (the directory that turns a name into an address) |
| Corporate network with a **proxy** (an intermediary through which all calls pass) that inspects the traffic | `certificate verify failed` | The proxy re-issues its own certificates, which the tool does not know (see [the note on the corporate proxy](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server#note-a-corporate-proxy-can-slow-composer-down-without-blocking-it)) | All calls fail at once |
| Trust store too old (old system, minimal container) | `unable to get local issuer certificate` | The CA that signed the certificate is not in the list | The site works in the browser, not in the script |

In each of these cases, the option that turns off verification **removes the check** instead of **fixing the cause**. The error disappears, like a warning light you would unplug instead of repairing the engine. And once written, the option tends to stay: it gets copied into another file, passes review without a comment, and ships. The test that passes in development also passes in production, including when it should not.

## What turning it off exposes

The scenario to fear is called the **man-in-the-middle** (MITM) attack. A third party slips in between the client and the server: it talks to the client while pretending to be the server, and talks to the real server while pretending to be the client.

```
 Verification ON
   CLIENT ----> ATTACKER         The attacker's certificate leads back to no known CA:
                   X             the client REFUSES, and the connection stops.

 Verification OFF
   CLIENT ====== ATTACKER ====== SERVER
      conversation 1     conversation 2
      encrypted with     encrypted with
      the attacker's key the real server's key

   The attacker decrypts conversation 1, reads or changes it, then re-encrypts conversation 2.
```

The client believes it is talking to `api.example.org`: the conversation is indeed encrypted, but **with the attacker**. Who can get into the middle? More people than you might think:

| Position of the attacker | How it ends up between the two |
|---|---|
| Public or shared Wi-Fi network | It controls the access point, or poses as the gateway (the device through which all the traffic of the network leaves) |
| Hijacked domain name | It corrupts the DNS answer so that the name points to its own machine |
| Compromised device on the path | A router (the device that routes traffic between networks), a proxy, a machine on a shared hosting network |
| Compromised internet provider or host | It sees the traffic go by and can redirect it |

Without the bypass, the attacker would have to present a valid certificate for `api.example.org`, signed by a trusted CA: that is very hard to obtain. **With the bypass, a certificate made in three seconds is enough.** The difficulty of the attack drops to zero.

What the attacker can do depends on what the program sends and receives:

| What travels | What the attacker does with it |
|---|---|
| A **token** (a secret text that proves the identity of the caller) or an API key in the **header** `Authorization` (a line of information attached to the request) | It copies it and calls the API in your place (see [authenticating an API](/?c=securite&s=cybersecurite&p=securite-api-web#authenticating-an-api-key-or-token-depending-on-the-client)) |
| A password, personal data | It reads them |
| A response (balance, payment status, configuration) | It replaces it with a fake one: "payment accepted", "user authorized" |
| A downloaded file (update, dependency, script) | It replaces it with a tampered version, which will run on your machine |
| A server-to-server call ([webhook](/?c=securite&s=cybersecurite&p=securite-des-webhooks), synchronization between two applications, call to a partner API) | All of the above, without a human ever seeing a warning |

The last case is the most insidious: a **browser** shows a large red screen in front of a suspicious certificate, and a human may give up. A **program** with the option turned off shows nothing and never gives up. The theme of a server's outgoing requests is also the theme of the chapter [SSRF: Bypassing the Allowlist](/?c=securite&s=cybersecurite&p=ssrf-en-detail): a server that calls other servers is a target, and TLS verification is one of its safeguards.

> **Remember:** turning the check off does not disable the encryption. The conversation stays encrypted. It disables the **proof of the other party's identity**, which is the only thing that guarantees the encryption leads to the right recipient.

## Local lab: seeing the bypass in action

Everything that follows happens **on your machine**, at the address `127.0.0.1` (the machine's own address, also called `localhost`), on a free **port** (the number that tells several services on the same machine apart; here 7241, well above the common ports). No packet leaves for the Internet. The lab requires a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), a [text editor](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide) to create the files, and four tools: [`openssl`](https://docs.openssl.org/3.0/man1/openssl/) (the reference program for making certificates), `python3` (the language [Python](/?c=langages&s=python&p=python)), [`curl`](https://curl.se/docs/manpage.html) (the program that sends a request to an address, seen above) and `node` (the environment that runs [JavaScript](/?c=langages&s=javascript&p=javascript) outside the browser). The Python library `requests` is installed with `pip install requests` (`pip` is the package installer of Python, see [modules and environments](/?c=langages&s=python&p=modules-et-environnements)). The `PHP` lines (the language [PHP](/?c=langages&s=php&p=php)) are optional. The messages and outputs of this chapter were obtained with curl 8.5, Python 3.12 (requests 2.31), Node.js 22, PHP 8.3 and OpenSSL 3.0: depending on the versions, the wording of a message varies a little.

The plan, in three steps:

| Step | Server on port 7241 | What we show |
|---|---|---|
| 1 | Server **A**, with certificate A | The verification error, then the options that "repair" it |
| 2 | Server **B**, with a **different** certificate B, in the same place | The client with verification turned off notices nothing |
| 3 | A then B, with pinning | A stricter check than simple trust |

Server B plays the role of the attacker here: it has taken the place of A. On a real network, a corrupted DNS, a rigged Wi-Fi or the proxy would lead the client there; the result on the client's side is the same.

### Step 1: two self-signed certificates

```bash
# mkdir creates a disposable working folder, cd moves into it
# &&: the 2nd command only runs if the 1st one succeeded (see basic commands)
mkdir tls-lab && cd tls-lab
# loop: two rounds, with the variable n equal to a then b (one certificate per round)
# $n gives the value of n: key-$n.pem becomes key-a.pem, then key-b.pem
for n in a b; do
  # req -x509 makes a self-signed certificate; -nodes leaves the private key in plain text
  # -days 30: valid for 30 days
  # -newkey rsa:2048: creates at the same time an RSA key pair of 2048 bits
  # -keyout / -out: the files where to write the private key / the certificate
  # -subj "/CN=localhost": CN (common name) = the name of the certificate holder
  # -addext: adds the list of valid names (SAN): localhost, 127.0.0.1
  # \ at the end of a line: the command continues on the next line
  # 2>/dev/null: throws away the error messages (channel 2) that openssl writes,
  # here progress dots (/dev/null is a trash file)
  openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout key-$n.pem -out cert-$n.pem \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
done
```

The commands `mkdir`, `cd`, `&&`, `>` and `2>/dev/null` are explained in [basic commands](/?c=langages&s=bash&p=commandes-de-base) and [redirections](/?c=langages&s=bash&p=redirections-et-pipes). The options of `openssl req` are detailed in [the chapter on the self-signed certificate](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#the-self-signed-tls-certificate) and in the [OpenSSL documentation](https://docs.openssl.org/3.0/man1/openssl-req/). Both certificates carry **the same name** (`localhost`) and the same duration, but each has **its own pair of keys**: they are indistinguishable to the eye, and yet the client must be able to tell them apart.

### Step 2: a small HTTPS server

The files of this lab (`server.py`, then `client.py`, `client.mjs`, `client-ssl.py`, `client.php`) are created with the text editor: we paste the content of the block into it, then save it under the name indicated, in this same `tls-lab` folder. The file `server.py` starts an HTTPS server that answers "response from server" followed by its name, and that logs the `Authorization` header it receives (the header used to send an identification token, seen above).

```python
# ssl: the Python module that adds TLS to a connection
import ssl
# sys: reads the command-line arguments
import sys
# http.server: a minimal web server included with Python
from http.server import BaseHTTPRequestHandler, HTTPServer

# arguments: the port, the certificate file, the key file, the server name
# a, b = x, y: multiple assignment (a receives x and b receives y, see tuples)
# int converts the text of the port into a number; sys.argv[1] is the 1st argument given
port, certificate, key, name = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]


# a class groups functions; this one describes how to answer the requests
class Handler(BaseHTTPRequestHandler):
    # do_GET is called for each GET request received; self designates the current request
    def do_GET(self):
        # prints the Authorization header received; the f before the text inserts {variables}
        print(
            f"[{name}] Authorization received:",
            self.headers.get("Authorization"),
            # flush=True: writes at once to the log, without waiting for a full buffer
            flush=True,
        )
        # the text sent back (\n: line break); encode converts it into bytes
        body = f"response from server {name}\n".encode()
        # code 200: the request succeeded
        self.send_response(200)
        # announces the size of the response in bytes
        self.send_header("Content-Length", str(len(body)))
        # ends the headers
        self.end_headers()
        # sends the body of the response
        self.wfile.write(body)

    # replaces the default log with nothing, to keep the output readable
    # (*args accepts any arguments; pass does nothing)
    def log_message(self, *args):
        pass


# creates the server: it listens on 127.0.0.1 (this machine only) on the given port
server = HTTPServer(("127.0.0.1", port), Handler)
# TLS context on the server side: it carries the certificate and the private key
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# loads the certificate presented to the clients and the private key that matches it
context.load_cert_chain(certificate, key)
# wraps the socket (the network entry point) in TLS: the server speaks HTTPS
# server_side=True: this socket is the one of a server (which presents a certificate)
server.socket = context.wrap_socket(server.socket, server_side=True)
# waits for requests until the program is stopped
server.serve_forever()
```

The multiple assignment on the line `port, certificate, key, name = ...` is the tuple unpacking seen in [lists and tuples](/?c=langages&s=python&p=listes-et-tuples#deballage-unpacking). The launch command takes four arguments: the port, the certificate, the key and the server name.

```bash
# starts server A in the background (&), limited to 120 seconds by timeout
# > log-a.txt: what the server prints goes into this file
timeout 120 python3 server.py 7241 cert-a.pem key-a.pem A > log-a.txt &
# $!: number of the last process started in the background; we keep it to stop it
PID_A=$!
# waits one second for the server to be ready to listen
sleep 1
```

`timeout` stops the server by itself after 120 seconds, even if we forget to (rerun the commands of this step if the delay is exceeded, see [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout#stopping-a-command-that-runs-too-long-timeout)). The `&` at the end of the line hands the terminal back while the server keeps running (see [process management](/?c=langages&s=bash&p=gestion-des-processus)), and `>` sends what the server prints into a file (see [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes)). The Python code uses [classes](/?c=langages&s=python&p=poo) and [error handling](/?c=langages&s=python&p=gestion-des-erreurs).

### Step 3: the verification fails

```bash
# -s: no progress bar; -S: but the errors stay displayed
curl -sS https://localhost:7241/
# $?: the exit code of the last command run (here curl)
echo $?
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
60
```

This is exactly the right behavior: certificate A is **self-signed**, it leads back to no CA in the trust store, and `curl` refuses. It ends with the **exit code** 60, the last number shown by `echo $?` (a number that every program returns at the end; 0 means "success", anything else means "failure"). The other tools say the same thing in their own words:

| Tool | Message obtained |
|---|---|
| `curl` | `curl: (60) SSL certificate problem: self-signed certificate` |
| Python `requests` | `certificate verify failed: self-signed certificate` (the Python client raises the `CERTIFICATE_VERIFY_FAILED` error) |
| Node.js (`fetch`) | `DEPTH_ZERO_SELF_SIGNED_CERT` (a "self-signed certificate, depth zero": the chain has only one link) |
| PHP (cURL extension) | `SSL certificate problem: self-signed certificate` |

### Step 4: the option "repairs" the error

```bash
# -k (or --insecure): curl no longer checks anything
curl -sS -k https://localhost:7241/
```

```
response from server A
```

The error has gone, and the response arrives. Here are the same tests with the other tools. The Python script, saved as `client.py` (the `re` module of regular expressions is presented in [regex in Python](/?c=langages&s=python&p=regex-en-python)):

```python
# re: the regular expressions, which search for a pattern in a text
import re
# sys: reads the command-line arguments
import sys
# requests: the common Python library for calling a web address
import requests

# first argument: the address to call
address = sys.argv[1]
# 2nd argument: "no" gives False (verification off), otherwise the trusted file
verification = False if sys.argv[2] == "no" else sys.argv[2]
# try: runs the block; if the error named by except occurs, the except block runs
try:
    # verify=False turns verification off; verify="file.pem" performs the check with this
    # trusted file, which REPLACES the usual list
    # timeout=5: gives up the call after 5 seconds without a response
    response = requests.get(address, verify=verification, timeout=5)
    # prints the text received
    print(response.text.strip())
except requests.exceptions.SSLError as error:
    # the verification failed: looks for the pattern that follows "certificate verify failed"
    # [^(]*: all the characters that follow, up to the first parenthesis (excluded)
    # re.search returns the first place in the text that matches the pattern
    pattern = re.search(r"certificate verify failed: [^(]*", str(error))
    # .group(0): the whole text found; .strip() removes the trailing spaces
    print("REJECTED:", pattern.group(0).strip())
```

```bash
# first argument: the address; second argument: "no" (turns verification off)
python3 client.py https://localhost:7241/ no
```

```
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
response from server A
```

(The long lines are cut here with `[...]`; the path of the first one depends on your installation. `urllib3` is the HTTP library on which `requests` relies, see its [documentation](https://urllib3.readthedocs.io/en/stable/).) Python **warns**: it is a warning, not an error. It slips into the error output of a program, where it is easily lost, and some projects silence it (see [pitfalls](#pitfalls)). The JavaScript script, saved as `client.mjs` (the `.mjs` extension tells Node.js that the file is a module, which allows `await` outside a function; `fetch` requires Node.js 18 or later, `node --version` shows the installed version; `await` is presented in [asynchronous JavaScript](/?c=langages&s=javascript&p=asynchrone)):

```javascript
// process.argv: the array of command-line arguments
// [0] is node, [1] is the script, so [2] is the first argument given by the user
// const declares a variable that will not change anymore
// try/catch: runs the try block; on error, the catch block runs
// await: waits for the result of an asynchronous operation before going on
const address = process.argv[2];
try {
  // fetch calls the address; Node.js performs the TLS check
  const response = await fetch(address);
  // prints the text received
  console.log((await response.text()).trim());
} catch (error) {
  // failure: prints the code of the cause if it exists (?.), otherwise the message (??)
  console.log("REJECTED:", error.cause?.code ?? error.message);
}
```

A particularity of Node.js: the bypass is set by an **environment variable** (a value that the terminal passes to the program it launches, see [environment variables](/?c=langages&s=bash&p=variables-denvironnement)), so **without touching the code**.

```bash
# default verification (active): the program refuses
node client.mjs https://localhost:7241/
# the variable NODE_TLS_REJECT_UNAUTHORIZED=0 turns verification off for the WHOLE process
NODE_TLS_REJECT_UNAUTHORIZED=0 node client.mjs https://localhost:7241/
```

```
REJECTED: DEPTH_ZERO_SELF_SIGNED_CERT
(node:167163) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment [...]
(Use `node --trace-warnings ...` to show where the warning was created)
response from server A
```

This variable is the most dangerous option in this chapter: one line in a configuration file, a startup script or a container definition turns verification off for **every** call the program makes, including those of third-party libraries that we did not write.

### The right way to fix this error: trust THIS certificate

Certificate A is known: we made it ourselves. Instead of turning everything off, we tell the client "trust this certificate":

```bash
# --cacert: gives the file of trusted certificates, for this call only
curl -sS --cacert cert-a.pem https://localhost:7241/
# Python: the 2nd argument is the trusted file (verify="cert-a.pem")
python3 client.py https://localhost:7241/ cert-a.pem
# Node.js: NODE_EXTRA_CA_CERTS adds trusted certificates without removing any
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://localhost:7241/
```

```
response from server A
response from server A
response from server A
```

All three calls succeed **with** verification active. The difference with `-k` does not show here, because it is indeed server A that answers. It will show in the next step.

#### Add or replace: what each trust option does

These options do not all behave the same way. Some **add** the given certificate to the usual trust list (the one of public CAs), others **replace** it: with them, a public site such as `https://example.com/` would be refused, because its CA is no longer in the list. Optional test (it contacts this real public site, the only one in this chapter) with server A still running:

```bash
# curl: -o /dev/null throws away the page, -w '%{http_code}\n' only shows the HTTP code
curl -sS -o /dev/null -w '%{http_code}\n' --cacert cert-a.pem https://example.com/
# Python: the trusted file is cert-a.pem alone
python3 client.py https://example.com/ cert-a.pem
# Node.js: NODE_EXTRA_CA_CERTS adds cert-a.pem to the public CAs
# head -c 15 keeps only the first 15 characters of the page
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://example.com/ | head -c 15; echo
```

```
200
REJECTED: certificate verify failed: unable to get local issuer certificate
<!doctype html>
```

| Tool | Option | Effect on the trust list | Result on `https://example.com/` |
|---|---|---|---|
| Python `requests` | `verify="file.pem"` (or the `REQUESTS_CA_BUNDLE` variable) | **Replaces** the list | Refused |
| Python (`ssl` module) | `create_default_context(cafile="file.pem")` | **Replaces** the list | Refused |
| Node.js (code) | `ca: certificate contents` | **Replaces** the list | Refused (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) |
| Node.js (variable) | `NODE_EXTRA_CA_CERTS=file.pem` | **Adds** to the list | Accepted |
| `curl` | `--cacert file.pem` | Replaces the default CA **file**; but the system CA **folder**, which the curl of Debian and Ubuntu also reads, is still used | Accepted here; refused with, in addition, `--capath` pointing to an empty folder (`unable to get local issuer certificate`) |
| PHP (cURL extension) | `CURLOPT_CAINFO` | As `curl`, whose library it reuses | Accepted here |

Remember: only `NODE_EXTRA_CA_CERTS` really **adds**. For the others, putting only the CA of your test server in the file **cuts off access to public sites**; to keep both, the public CAs are copied into it too (the system file, often `/etc/ssl/certs/ca-certificates.crt` on Debian and Ubuntu). The behavior of `curl` depends on how it was compiled: do not count on the system folder.

### Step 5: another server takes the place of the first

We stop A, then start B on the **same port**, with **the other certificate** (B). From the client's point of view, the same address `https://localhost:7241/` answers, but it is no longer the same machine.

```bash
# stops server A (wait waits until it has finished, sleep lets the port be released)
kill $PID_A; wait $PID_A 2>/dev/null; sleep 1
# starts server B: same port, different certificate and key
timeout 120 python3 server.py 7241 cert-b.pem key-b.pem B > log-b.txt &
# keeps its process number and waits until it is listening
PID_B=$!
sleep 1
```

The client whose verification is **turned off**:

```bash
# -H adds a header: here an invented API token, like the one a real client would send
curl -sS -k -H "Authorization: Bearer secret-token-123" https://localhost:7241/
# exit code of curl: 0, everything went well
echo $?
# Python, verification turned off
python3 client.py https://localhost:7241/ no
```

```
response from server B
0
.../urllib3/connectionpool.py:1112: InsecureRequestWarning: Unverified HTTPS request [...]
  warnings.warn(
response from server B
```

The client **sees nothing**: the response is well formed, and the exit code is 0 (readable with `echo $?`, as in step 3). The only trace is in the log of server B, which the client will never see:

```bash
# shows what server B noted
cat log-b.txt
```

```
[B] Authorization received: Bearer secret-token-123
[B] Authorization received: None
```

Server B **read the token in plain text**. It could just as well return a falsified response. The first line comes from `curl`, the second from Python (which sent no `Authorization` header).

The client that **knows the right certificate** (the one of A):

```bash
# verification active, with trust given to certificate A
curl -sS --cacert cert-a.pem https://localhost:7241/
# the same thing in Python
python3 client.py https://localhost:7241/ cert-a.pem
# the same thing in Node.js
NODE_EXTRA_CA_CERTS=cert-a.pem node client.mjs https://localhost:7241/
```

```
curl: (60) SSL certificate problem: self-signed certificate
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
REJECTED: certificate verify failed: self-signed certificate
REJECTED: DEPTH_ZERO_SELF_SIGNED_CERT
```

All three tools **refuse**: the certificate presented by B is not the one they trust. Here is the summary of the lab:

| Client | Server A (legitimate) | Server B (impostor) |
|---|---|---|
| Verification **turned off** (`-k`, `verify=False`) | Response | **Response too: B read the token** |
| Verification **against certificate A** (`--cacert`, `verify="cert-a.pem"`) | Response | **Refusal** |

Notice that the certificate of B has the **same name** `localhost` as that of A, and that it is also valid in time: a name check would not have stopped it. It is the **chain of trust** (knowing whom you trust) that protects here.

### Step 6: pinning a fingerprint

Trusting one precise certificate is **pinning**: the client accepts only a server whose public key matches a fingerprint known in advance. A **fingerprint** is the result of a [hash](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#hashing-vs-encryption-a-frequent-mix-up) (here SHA-256): a short value that changes as soon as the data changes.

```bash
# extracts the public key of certificate A, converts it to binary format (DER), hashes it
# with SHA-256, then writes it in base64 (a text encoding); | chains the commands
# $(...): runs the command inside and stores its result in FINGERPRINT
# x509 -pubkey -noout: shows the public key of the certificate, but not the certificate itself
# pkey -pubin -outform der: reads a public key (-pubin) and writes it in binary DER
# dgst -sha256 -binary: computes the SHA-256 fingerprint, in binary
# enc -base64: turns this binary into readable text
FINGERPRINT=$(openssl x509 -in cert-a.pem -pubkey -noout | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64)
# --pinnedpubkey: curl requires the public key of the server to have this fingerprint
# -k is added here to show that the pinning acts even without the chain verification
curl -sS -k --pinnedpubkey "sha256//$FINGERPRINT" https://localhost:7241/
```

```
curl: (90) SSL: public key does not match pinned public key
```

Server B (still running) is refused with code 90. We replace B with A and start again:

```bash
# stops B, restarts A (log-a2.txt), then replays exactly the same curl command
kill $PID_B; wait $PID_B 2>/dev/null; sleep 1
timeout 120 python3 server.py 7241 cert-a.pem key-a.pem A > log-a2.txt &
PID_A=$!
sleep 1
curl -sS -k --pinnedpubkey "sha256//$FINGERPRINT" https://localhost:7241/
# stops this server A (the following examples restart it)
kill $PID_A
```

```
response from server A
```

In real use, we do **not** remove the normal verification: the pinning is added on top of it. The fingerprints change each time a certificate is made, which is why they are not copied here. The limits of pinning are in [the right fixes](#the-right-fixes).

### The two other checks, with real messages

The name and the date are checked in the same way. These tests use a certificate issued for the name `other.example` alone, and a certificate dated January 2025. The first is made as in step 1, with another `-subj`; the second requires `openssl ca`, whose `-startdate` and `-enddate` options let you choose the dates (`openssl req` does not allow it):

```bash
# certificate issued for the name other.example (and not localhost)
openssl req -x509 -nodes -days 30 -newkey rsa:2048 -keyout key-nom.pem -out cert-nom.pem \
  -subj "/CN=other.example" -addext "subjectAltName=DNS:other.example" 2>/dev/null
# certificate request (-new), then signed by openssl ca; it creates the key key-exp.pem
openssl req -new -nodes -newkey rsa:2048 -keyout key-exp.pem -out exp.csr \
  -subj "/CN=localhost" 2>/dev/null
# working files of openssl ca: the register of issued certificates (empty) and a serial number
: > index.txt
echo 01 > serial.txt
# minimal configuration of openssl ca; <<'FIN' writes the following lines up to FIN
cat > ca.cnf <<'FIN'
[ca]
default_ca = ca_lab
[ca_lab]
database = index.txt
new_certs_dir = .
serial = serial.txt
default_md = sha256
policy = policy_rules
[policy_rules]
commonName = supplied
FIN
# the valid names (SAN) of the certificate, read by -extfile
echo "subjectAltName = DNS:localhost,IP:127.0.0.1" > ext.cnf
# -selfsign: signs with its own key (self-signed); valid only on January 1, 2025
openssl ca -batch -selfsign -config ca.cnf -keyfile key-exp.pem -in exp.csr \
  -out cert-exp.pem -startdate 20250101000000Z -enddate 20250102000000Z \
  -extfile ext.cnf -notext
```

To try them, we stop the running server, then start the server with one of these two certificates (`python3 server.py 7241 cert-nom.pem key-nom.pem N` or `python3 server.py 7241 cert-exp.pem key-exp.pem E`), then call it with `curl --cacert cert-nom.pem https://localhost:7241/` (or `cert-exp.pem`). Messages obtained:

| Situation | `curl` | Python `requests` | Node.js |
|---|---|---|---|
| Different name | `SSL: no alternative certificate subject name matches target host name 'localhost'` | `certificate verify failed: Hostname mismatch, certificate is not valid for 'localhost'.` | `ERR_TLS_CERT_ALTNAME_INVALID` |
| Expired certificate | `SSL certificate problem: certificate has expired` | `certificate verify failed: certificate has expired` | `CERT_HAS_EXPIRED` |

In both cases, the client had received the server's certificate as a trusted certificate (it was self-signed, like A): only the property being tested was a problem, and a client with verification turned off (`curl -k`) accepts without reacting, whether the name is wrong or the certificate has expired (tried for both).

## The same bypass in every tool

Each tool has its own name for the same idea. The table also shows **how far** the bypass goes, because its scope changes the extent of the damage:

| Tool | Way of writing the bypass | Scope | Safe way instead |
|---|---|---|---|
| `curl` | `curl -k` or `curl --insecure` | One call | `curl --cacert file.pem` ([curl manual](https://curl.se/docs/manpage.html)) |
| Python `requests` | `requests.get(url, verify=False)` | One call | `verify="file.pem"` ([requests documentation](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification)) |
| Python (`ssl` module) | `context.check_hostname = False` then `context.verify_mode = ssl.CERT_NONE` | All the calls that use this context | `ssl.create_default_context(cafile="file.pem")` ([`ssl` module](https://docs.python.org/3/library/ssl.html)) |
| Node.js (variable) | `NODE_TLS_REJECT_UNAUTHORIZED=0` | **The whole process** | `NODE_EXTRA_CA_CERTS=file.pem` ([Node.js options](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)) |
| Node.js (code) | `https.get({ rejectUnauthorized: false })` | One call (or a shared agent) | The `ca: certificate contents` option of the same request, read for example with `fs.readFileSync("file.pem")` ([`https` module](https://nodejs.org/api/https.html)) |
| PHP, cURL extension | `CURLOPT_SSL_VERIFYPEER` set to `false` and `CURLOPT_SSL_VERIFYHOST` set to `0` | One call | `CURLOPT_CAINFO` (the CA file, see [`curl_setopt`](https://www.php.net/curl_setopt)) |
| PHP, streams | `'ssl' => ['verify_peer' => false]` | One call | `'cafile'` (see [`verify_peer` in PHP](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verifying-the-remote-server-s-certificate)) |
| Guzzle (PHP) | `'verify' => FALSE` | One call, or **all of them** if set in the shared configuration | `'verify' => '/path/ca.pem'` ([Guzzle options](https://docs.guzzlephp.org/en/stable/request-options.html#verify)) |

The Python forms (`verify=False`, `check_hostname`, `CERT_NONE`, `cafile`), the Node.js ones (`rejectUnauthorized`, `ca`, the two variables) and the PHP cURL ones can all be tried against the lab server. Server A was stopped at the end of step 6: we restart it first, with the same command as in step 2.

```bash
# restarts server A, limited to 120 seconds, and keeps its process number
timeout 120 python3 server.py 7241 cert-a.pem key-a.pem A > log-a3.txt &
PID_A=$!
# waits one second for the server to be ready to listen
sleep 1
```

Example for the "`ssl` module" row, which must turn off the **name** check before the **chain** check (otherwise Python refuses to modify the context). Saved as `client-ssl.py`, it is launched with `python3 client-ssl.py` (`urllib.request` is the HTTP library that comes with Python, [documentation](https://docs.python.org/3/library/urllib.request.html)):

```python
# ssl: Python's TLS module; urllib.request: an HTTP client included with Python
import ssl
import urllib.request

# default context: checks the chain and the name
context = ssl.create_default_context()
# first try: verification stays active
try:
    urllib.request.urlopen("https://localhost:7241/", context=context)
except Exception as error:
    # prints the reason for the refusal
    print("REJECTED:", error.reason.verify_message)
# turns off the name check, then the chain check (in this order)
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE
# second try: the connection succeeds
response = urllib.request.urlopen("https://localhost:7241/", context=context)
# prints the text received
print(response.read().decode().strip())
```

```
REJECTED: self-signed certificate
response from server A
```

And the PHP equivalent with the cURL extension, saved as `client.php`, which shows the three cases (default, turned off, trust given). The basic syntax of PHP (variables with `$`, functions) is in [PHP variables](/?c=langages&s=php&p=variables) and [PHP functions](/?c=langages&s=php&p=methodes); `===` and the ternary `? :` are in [PHP conditions](/?c=langages&s=php&p=conditions):

```php
<?php
// $verification: null keeps the default verification, false turns it off,
// a file path adds this trusted certificate
// string $address: the parameter must be a text; : void: the function returns nothing
function call(string $address, $verification): void
{
    // curl_init prepares a call to the given address
    $call = curl_init($address);
    // CURLOPT_RETURNTRANSFER: curl_exec returns the text received instead of displaying it
    curl_setopt($call, CURLOPT_RETURNTRANSFER, true);
    // === : equal AND of the same type (0 === false is false, whereas 0 == false is true)
    if ($verification === false) {
        // turns off the check of the certificate chain
        curl_setopt($call, CURLOPT_SSL_VERIFYPEER, false);
        // turns off the name check (0: do not compare the name of the certificate)
        curl_setopt($call, CURLOPT_SSL_VERIFYHOST, 0);
    } elseif ($verification !== null) {
        // CURLOPT_CAINFO: the file of trusted certificates for this call
        curl_setopt($call, CURLOPT_CAINFO, $verification);
    }
    // runs the call: returns false on failure
    $text = curl_exec($call);
    // condition ? a : b (ternary) is a if the condition is true, otherwise b
    // . joins two texts; trim removes the trailing spaces; "\n": line break
    // so it displays the text received, or the error message of cURL
    echo $text === false ? 'REJECTED: ' . curl_error($call) : trim($text), "\n";
}

// without an option: verification stays active by default
call('https://localhost:7241/', null);
// with false: verification is turned off
call('https://localhost:7241/', false);
// $argv: the command-line arguments; $argv[1] is the first one (the file)
call('https://localhost:7241/', $argv[1]);
```

Server A restarted for the previous example is still running if it has been less than 120 seconds; otherwise `timeout` has stopped it. This command restarts it only if it has stopped:

```bash
# kill -0 kills nothing: it only tests whether the process still exists
# || : if this test fails, the block in braces restarts server A
kill -0 $PID_A 2>/dev/null || {
  # same launch command as in step 2
  timeout 120 python3 server.py 7241 cert-a.pem key-a.pem A > log-a4.txt &
  # keeps the new process number, then waits one second
  PID_A=$!; sleep 1
}
```

```bash
# against server A: the argument is the file of the trusted certificate
php client.php cert-a.pem
# stops server A at the end of the lab
# (2>/dev/null hides the error if it is already stopped)
kill $PID_A 2>/dev/null
```

```
REJECTED: SSL certificate problem: self-signed certificate
response from server A
response from server A
```

| Call | Result |
|---|---|
| `call(..., null)` (default verification) | Refused: the certificate is self-signed |
| `call(..., false)` (turned off) | Accepted |
| `call(..., 'cert-a.pem')` (trust given to A) | Accepted |

## An example in a PHP framework: Drupal and Guzzle

> **Illustrative example of a framework.** It shows how the bypass is written in a real project; the addresses and names are invented, the API names are checked against the Drupal 11.x source code.

**Drupal** ([drupal.org](https://www.drupal.org/)) is a **CMS** (*content management system*: software for building and running a site) written in [PHP](/?c=langages&s=php&p=php). It is also a **framework**: a toolbox of code already written, on which one builds a custom site. It provides a service that returns an **HTTP client** (an [object](/?c=langages&s=php&p=poo) that sends requests), based on **Guzzle**, the reference PHP library for this (a **library** is a set of reusable code written by others; see [its documentation](https://docs.guzzlephp.org/en/stable/)). A call to a partner API is written like this:

```php
<?php
// service of a framework that returns an HTTP client (here, a Guzzle client)
// \Drupal::httpClient(): the :: calls the httpClient function attached to the \Drupal class
$client = \Drupal::httpClient();
// $client->get(...): the -> calls the get method of the $client object (a GET request)
// [ 'key' => value, ... ] is an array of options: => associates a value with a name
// DANGEROUS: 'verify' => FALSE turns off all TLS verification for this call
$response = $client->get('https://api.partner.example/clients', [
  'verify' => FALSE,
  'timeout' => 10,
]);
// reads the body of the response; (string) converts it into text
$text = (string) $response->getBody();
```

The line `'verify' => FALSE` is the one found, copied from a forum or an old project, when the partner API presents a certificate that makes the call fail. It does the same thing as `curl -k`: no more check of the chain or of the name. The chapter on PHP streams presents the same idea with `verify_peer`, in [Making HTTP Calls Natively](/?c=langages&s=php&p=http#verify-peer-verify-peer-name-verifying-the-remote-server-s-certificate).

Two aggravating variants, frequent in this kind of project:

| Variant | Why it is worse |
|---|---|
| The option set in the **shared configuration** of the framework's outgoing calls | It turns off verification for all the modules of the site, including third-party ones, and for calls that carry secrets |
| The option set **conditionally** ("only if the environment is development"), but the condition reads a variable that production also defines | The bypass reaches production without anyone having wanted it |

What this example should do instead: see [the right fixes](#the-right-fixes). For Guzzle, `'verify'` accepts `TRUE` (the default, verification active), `FALSE` (turned off) or **the path of a file** of trusted CAs. According to its [documentation](https://docs.guzzlephp.org/en/stable/faq.html), Guzzle uses cURL when the extension is available, but does not depend on it. With its cURL handler, `'verify' => FALSE` sets `CURLOPT_SSL_VERIFYPEER` to false and `CURLOPT_SSL_VERIFYHOST` to 0, the two options of the "PHP, cURL extension" line of the table above; with its PHP stream handler, the options are different (`verify_peer` and `verify_peer_name`). This example does not run in the lab: it requires Drupal and Guzzle installed.

## The right fixes

The general rule: **fix the cause of the error, do not remove it**. Each case in the "Why we are tempted" table has an answer:

| Cause of the error | Lasting solution |
|---|---|
| Self-signed certificate in development | Give **this** certificate to the client as a trusted certificate (`--cacert`, `verify="file.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`), exactly as in the lab. For a developer's machine, a tool such as [mkcert](https://github.com/FiloSottile/mkcert) creates a small local CA that the system accepts, which avoids multiplying the exceptions. Node.js ships its own list of CAs and does not always read the system's one: give it the local CA with `NODE_EXTRA_CA_CERTS` (see [the Node.js documentation](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)); `requests` may read the system list or its own, depending on the installation |
| Expired certificate | **Renew** it, and above all **automate** the renewal: [Let's Encrypt](https://letsencrypt.org/docs/) issues free certificates from a recognized CA, renewable by a program thanks to the **ACME** protocol (a standardized exchange between the server and the CA) |
| Name that does not match | Call the server **by the name of the certificate**, or have a certificate issued that contains the name actually used (the SAN) |
| Corporate proxy that re-issues the certificates | Add the **CA of the proxy** (provided by the IT team) to the trust store of the tool, instead of turning everything off. With `NODE_EXTRA_CA_CERTS`, it is added; with `--cacert` or `verify=`, the file replaces the list (see [add or replace](#add-or-replace-what-each-trust-option-does)): the public CAs must then be copied into it too |
| Trust store too old | Update the CA package of the system or of the container image |
| Call to a partner that presents a known fixed certificate | **Pin** its fingerprint, in addition to the normal verification |

### Pinning: what it brings and what it costs

| | Benefit | Cost |
|---|---|---|
| **Public key pinning** (as in step 6) | Even a malicious or compromised CA cannot impersonate the server | If the server changes its key (renewal, incident), all the pinned clients **stop working** until the fingerprint is updated |
| **Pin the key rather than the whole certificate** | A renewal that keeps the same key stays accepted | You must check that the server keeps its key |
| **Plan a backup fingerprint** | A second key, generated in advance and kept safe, avoids an outage on the day of the change | One more secret to keep (see [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

Pinning suits a client and a server that you control (a mobile app that talks to its own API, two services of the same team). It suits poorly a third-party public site whose keys and renewals you do not control.

### Never ship the bypass to production

Even when a bypass is acceptable for a while on a development machine, it must not be able to reach production:

| Rule | How to apply it |
|---|---|
| Verification is **active by default** | Never write `verify=False` hard-coded in the code: read the setting from the configuration, whose default is "verify" |
| The development does not need the bypass | Give the local trusted certificate (above) rather than a switch |
| A bypass setting, if it exists, **refuses to start** in production | The program stops with a clear message if the environment is production and verification is turned off: this is the principle of [failing securely](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise#failing-securely) |
| Language warnings are **not** silenced | Do not filter the warning (for example with `urllib3.disable_warnings` in Python, the `urllib3` function that silences this warning): it is the last alarm |
| The secret that goes through this connection is treated as exposed | If the verification was turned off in production, renew the token that went through it (see [secret rotation](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) |

### Detecting the flaw: review and static analysis

This flaw is easy to find, because it is written with recognizable patterns. In **code review** (reading by another developer before the merge), we search the changes for these patterns. A **static analysis** (*SAST*, which reads the code without running it, see [SAST: analyzing code without running it](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite#sast-analyzing-code-without-running-it)) can search for them automatically at each change, for example in a [CI/CD pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd). A very simple starting rule is a `grep` (the text search of the terminal), tried here on a small example folder that contains one file per pattern, plus a correct file:

```bash
# -r: all the files of the folder; -n: shows the line number; -E: extended patterns
# -i: ignores the case (FALSE or false); each | separates a pattern being searched for
# \ at the end of a line: the command continues; the details of the symbols are in the table
grep -rnE -i "verify[\"']?\s*(=>|=|:)\s*false|rejectUnauthorized\s*:\s*false|\
NODE_TLS_REJECT_UNAUTHORIZED|CURLOPT_SSL_VERIFY(PEER|HOST)|(^|\s)(-k|--insecure)(\s|$)|\
CERT_NONE|check_hostname\s*=\s*False|verify_peer" example
```

```
example/src/call.js:1:process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
example/src/backup.sh:1:curl -k https://internal.example/api
example/src/agent.js:1:const agent = { rejectUnauthorized: false };
example/src/legacy.php:1:curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
example/src/Call.php:1:$client->get($url, ["verify" => FALSE]);
example/src/client.py:1:response = requests.get(url, verify=False)
```

The symbols of these patterns are [regular expressions](/?c=langages&s=python&p=regex-en-python):

| Symbol | Meaning | Example in the pattern |
|---|---|---|
| `\s*` | zero or more spaces (`\s`: a space, a tab) | `verify\s*=` finds `verify=` and `verify  =` |
| `["']?` | a double or single quote, or nothing (`?`: zero or one time) | `"verify"` or `verify` |
| `(=>\|=\|:)` | one of the three signs `=>`, `=` or `:` (here `\|`: "or") | `verify=false`, `'verify' => false` |
| `(PEER\|HOST)` | one of the two words | `CURLOPT_SSL_VERIFYPEER` or `...VERIFYHOST` |
| `(^\|\s)` and `(\s\|$)` | start of line or a space, end of line or a space (`^`: start, `$`: end) | `-k` alone, but not the `-k` stuck in `file-k8s` |

The six disabled patterns are found; the correct file (`verify=True`) is not. The `verify_peer` pattern would also find a value set to `true` (a false alarm to read by hand). And each result is only a **clue**: you must read the line to know whether it is `false` in production. A pipeline rule that blocks the merge when the pattern appears, with an exception documented case by case (for example a test aimed at a local server), is more reliable than a verbal reminder.

Finally, three runtime clues must not be ignored: Python's `InsecureRequestWarning`, the Node.js warning about `NODE_TLS_REJECT_UNAUTHORIZED`, and any program that accepts a certificate that a browser would refuse.

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| "It's only development" | The option gets copied, passes review and ships; development code becomes production code | Give the local certificate to the client that trusts it, with no switch in the code |
| Believing that `verify=False` turns off the encryption | The conversation stays encrypted: the trap is to feel protected while you may be talking to an impostor | Remember that the bypass removes the proof of identity, not the encryption |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` in a configuration file or a container | Turns off verification for **all** the calls of the process, third-party libraries included | Use `NODE_EXTRA_CA_CERTS` |
| Option set in the shared configuration of a framework | All the modules and all the outgoing calls are concerned, including those that carry secrets | No global bypass; if needed, a globally trusted CA |
| Silencing the warning (`disable_warnings`) | The warning is the only signal that remains | Fix the cause, never the alarm |
| Turning off only the name check (`verify_peer_name`, `check_hostname`) | A valid certificate of **another** site is accepted in place of the right one | Fix the name or the certificate |
| Pinning the whole certificate without a renewal plan | On the day the certificate changes, all the clients fall over | Pin the key, plan a backup fingerprint |
| Believing that a self-signed certificate encrypts less well | The encryption is the same; only the proof of identity is missing | Give this certificate as trusted to the concerned client |
| Server-to-server calls with no human to see an alert | No visible warning, and nobody gives up | Refuse in production any configuration with verification turned off |
| Not renewing a token that went through an unverified connection | A token already read by a third party remains valid | Renew it after fixing the connection |

## Best practices

| Best practice | Why |
|---|---|
| Keep verification active everywhere, and fix the cause of the error | A verification error is a diagnosis: it says exactly what is wrong (chain, name, date) |
| Give the client the certificate or the trusted CA (`--cacert`, `verify="file.pem"`, `NODE_EXTRA_CA_CERTS`, `CURLOPT_CAINFO`) | The trust is precise and limited to what we know |
| Automate the renewal of certificates with Let's Encrypt or the tool of the organization | An expired certificate must no longer trip anyone up |
| Add the CA of a corporate proxy to the trust store (without losing the public CAs) rather than turning everything off | The proxy is trusted, not just anyone |
| Pin the public key for a client and a server that you control, with a backup fingerprint | Even a compromised CA cannot impersonate the server |
| Read the verification setting from the configuration, "verify" by default, and refuse to start in production if it is turned off | A bypass cannot reach production by accident |
| Search for bypass patterns in code review and in a pipeline (static analysis, `grep`) | The flaw is written with recognizable patterns |
| Keep the language warnings visible | It is the last signal if the bypass gets through anyway |
| Renew the secrets that went through an unverified connection | A third party may have read them |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | TLS provides confidentiality, integrity **and** proof of the server's identity; only the certificate verification (chain to a trusted CA, name, dates) provides the last one. `curl -k`, `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0` and `verify => FALSE` do not turn off the encryption, but that proof: a third party placed between the client and the server (corrupted DNS, Wi-Fi, proxy) presents its own certificate, and reads or changes everything, without the client seeing anything. The lab showed it: a second server with a different certificate read a token sent by the client with verification turned off, and was refused by the client that knew the right certificate. The right answer fixes the cause: give the trusted certificate (`--cacert`, `verify="file.pem"`, `NODE_EXTRA_CA_CERTS`), renew and automate (Let's Encrypt), fix the name, add the CA of the proxy, pin a key. |
| **Pitfalls to avoid** | "It's only development"; an environment variable or a shared configuration that turns off the whole process or the whole site; silencing the warning; turning off only the name check; pinning without a backup fingerprint; not renewing a token that went through an unverified connection. |
| **Best practices** | Verification active by default and read from the configuration; certificate or CA given to the client rather than turning everything off; automatic renewal of certificates; refusal to start in production if verification is turned off; search for bypass patterns in code review and by static analysis; language warnings kept visible. |
