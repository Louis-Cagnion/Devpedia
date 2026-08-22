---
order: 14
---

# SSR vs CSR: Where Is the HTML Built?

The [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) of a page can be built in two fundamentally different places: on the **server**, before the response is sent ([SSR](https://developer.mozilla.org/en-US/docs/Glossary/SSR), *Server-Side Rendering*), or in the **browser**, by JavaScript executed after a minimal page is received ([CSR](https://developer.mozilla.org/en-US/docs/Glossary/CSR), *Client-Side Rendering*). This choice radically changes what the browser receives first, and what a search engine sees when it visits the page.

## CSR: the server sends an empty shell

With CSR, typical of a single-page application (SPA), the server responds with an almost empty [HTML](/?c=infrastructure&p=api-et-http) page and a sizeable JavaScript script; it is this script, once downloaded and executed, that builds the entire content of the page in the [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements):

```text
Server -> <html><body><div id="app"></div><script src="app.js"></script></body></html>

Browser:
1. Receives the almost empty HTML -> nothing displayed
2. Downloads and executes app.js
3. app.js builds the content in the DOM, often after calling an API
4. The page becomes visible and interactive
```

The actual content appears only after the JavaScript has been **both** downloaded and executed, a delay that depends directly on the size of the script and the power of the device running it.

## SSR: the server already sends the filled-in HTML

With SSR, the server itself executes the rendering code on each request (or at site build time, depending on the implementation), and returns [HTML](/?c=infrastructure&p=api-et-http) already filled with content:

```text
Server -> executes the rendering -> <html><body><h1>Welcome Alice</h1>...</body></html>

Browser:
1. Receives already complete HTML -> immediate display of the content
2. Downloads and executes the remaining JavaScript (hydration, see below)
3. The page becomes interactive
```

The content is displayed as soon as the response is received, even before the JavaScript has finished loading.

## Comparison

| | CSR | SSR |
|---|---|---|
| First content display | After JS download + execution | Immediate, in the received HTML |
| Server load | Low (serves static files + an API) | Higher (executes the rendering on each request, or at build time) |
| Search engine optimization (SEO) | A crawler that doesn't execute JS sees only an empty page | The content is directly present in the received HTML |
| Interactivity once loaded | Identical | Identical, after hydration |

## Hydration: reconnecting JavaScript to HTML that's already there

After an SSR render, the displayed page is still just static [HTML](/?c=infrastructure&p=api-et-http): no event handler is attached yet. **Hydration** is the step where JavaScript runs to reconnect this existing HTML to the [events](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) that make it interactive, without rebuilding the content that's already displayed.

> **Pitfall:** an SSR render that produces HTML slightly different from what the JavaScript would produce if it rebuilt it itself (a date formatted differently depending on the server's timezone, data that changed between the server render and the client-side hydration). The framework detects the mismatch and can either silently ignore it or discard the entire server render to rebuild the page fully client-side, losing most of SSR's benefit.
>
> **Best practice:** make sure the render produces exactly the same result on the server and on the client, from the same data; explicitly inject the data used for the server render into the page, so the hydration JavaScript reuses it as is rather than recomputing it differently.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | CSR builds the content in the browser after the JavaScript executes (delayed first display, low server load); SSR builds the HTML server-side before sending it (immediate display, better SEO, higher server load). Hydration reconnects JavaScript to an already-displayed SSR HTML page, without rebuilding it. |
| **Tools you can use** | Frameworks with built-in SSR rendering (Next.js, Nuxt and equivalents) to combine immediate display with interactivity once hydrated. |
| **Pitfalls to avoid** | A server render that produces a result different from the client render during hydration, forcing a full client-side rebuild. |
| **Best practices** | Guarantee an identical render between server and client from the same data; explicitly pass this data to the client rather than recomputing it during hydration. |
