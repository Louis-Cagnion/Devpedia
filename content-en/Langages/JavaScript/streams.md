---
order: 20
---

# Streams: processing a data flow without loading it all into memory

So far, every piece of data handled ([a string](/?c=langages-de-programmation&s=javascript&p=strings), an array, the response of a [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone)) has been treated as a single block, available all at once. A **stream** instead processes data **chunk by chunk**, as it arrives, without ever having to load it entirely into memory.

## Why not simply load everything into memory

| | Loading everything into memory | Processing as a stream |
|---|---|---|
| Principle | Wait for the complete data before touching it | Process each chunk as soon as it arrives |
| Memory used | Proportional to the total size of the data | Proportional to the size of a single chunk |
| First visible result | Only once everything has been received | As soon as the first chunk arrives |
| Typical example | A small config file (a few KB) | A video, a large file, a long HTTP response |

> **Pitfall:** loading a potentially large piece of content entirely into memory "to keep things simple" (e.g. `await response.arrayBuffer()` on a multi-gigabyte file) when it's only passing through toward another destination (another file, another HTTP response). The program then holds the entire content in memory at once, even though it never needs all of it at the same time.
>
> **Best practice:** as soon as a piece of data is only passing through (relayed, copied, sent elsewhere) without being fully analyzed itself, process it as a stream rather than loading it entirely.

## Two different implementations, coexisting in the JavaScript ecosystem

The concept of a stream has existed for a long time on the server side (Node.js), and was added later on the browser side (the "Web Streams", a Web standard). Both share the same idea but use a different API:

| | Node.js Streams | Web Streams |
|---|---|---|
| Origin | Specific to Node.js, since its early days | Browser standard, also available in recent Node.js |
| Main type | `stream.Readable` / `stream.Writable` | `ReadableStream` / `WritableStream` |
| Where you meet them | Reading a file ([`fs.createReadStream()`](https://nodejs.org/api/fs.html)), an Express HTTP response (`res`) | The body of a [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone) response (`response.body`) |
| API style | Events (`on("data", ...)`) or `.pipe()` | A "reader" obtained via `.getReader()`, consumed with `await` |

## Making the two talk to each other: a manual adapter

A single program can need both at once: for example, relaying the body of a `fetch()` response (a `ReadableStream`, the Web standard) toward an Express HTTP response (`res`, which expects a plain Node.js stream). No automatic conversion exists between the two: the `ReadableStream` has to be read manually, re-emitting each chunk into a Node.js `Readable`.

```js
import { Readable } from "node:stream";

async function relayToExpressResponse(fetchResponse, res) {
    const reader = fetchResponse.body.getReader();  // "reader" of the ReadableStream (Web)

    const stream = new Readable({
        // called every time .pipe() needs one more chunk
        async read() {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null);   // signals the end of the Node.js stream
            } else {
                this.push(value);  // relays the chunk, without ever storing it whole
            }
        },
    });

    stream.pipe(res);  // wires the adapted Node.js stream into the Express response
}
```

> **Pitfall:** forgetting that a `ReadableStream`'s `read()` is asynchronous (`await`): calling `reader.read()` without awaiting it would return an unresolved Promise instead of the actual chunk of data.
>
> **Best practice:** keep this adapter generic (it only copies chunks from one format to the other, without ever reading their content) so it can be reused anywhere a `ReadableStream` needs to feed an API that expects a Node.js stream.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A stream processes data chunk by chunk rather than as a single block, without ever having to load it entirely into memory. Two implementations coexist in JavaScript: Node.js Streams (the original, server-side one) and Web Streams (the browser standard, also used by `fetch()`). |
| **Tools you can use** | `stream.Readable`/`Writable` and `.pipe()` on the Node.js side; `ReadableStream`/`getReader()` on the Web/`fetch()` side. |
| **Pitfalls to avoid** | Loading large content entirely into memory when it's only passing through. Calling a `ReadableStream`'s `read()` without awaiting it. |
| **Best practices** | Process as a stream any data that's only passing through. Write a generic, reusable adapter between the two implementations rather than a one-off for each case. |
