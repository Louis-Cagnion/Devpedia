---
order: 8
---

# The PWA: a website that behaves like an application

A **PWA** (*Progressive Web App*) is a regular website with two mechanisms added on top that grant capabilities once reserved for native applications: keep working without an internet connection, and install onto the device like a real application, without going through a store.

## The service worker: a script that runs between the site and the network

A **service worker** is a JavaScript script the browser runs in the background, separately from the page itself, able to intercept every network request the site makes before it actually reaches the internet:

```text
Without a service worker:          With a service worker:

Page -> request -> network         Page -> request -> service worker
                                                          |
                                              cached? -----+-- yes -> immediate response, no network
                                                          |
                                                          +-- no -> network, then cache it
```

This middleman position lets the site serve an already-cached resource even when the network is unavailable, something a regular site can't do: without a successful network request, it simply has nothing to display.

> **Pitfall:** confusing the service worker with the page's main thread. A service worker runs in its own context, with no direct access to the DOM; it communicates with the page through messages, not by directly manipulating its elements.
>
> **Best practice:** keep the service worker focused on network interception and caching; any logic that touches rendering stays in the page's own code.

## Caching strategies: what to serve, and when to check the network

| Strategy | Principle | Suited to |
|---|---|---|
| **Cache-first** | Serves the cached version if it exists, only goes to the network if nothing is cached | Resources that rarely change (logo, font, versioned CSS) |
| **Network-first** | Tries the network first, only falls back to the cache on failure | Content that must stay current as long as the network responds |
| **Stale-while-revalidate** | Immediately serves the cached version while refreshing it in the background for the next visit | Content that tolerates slight staleness, already seen in [high-traffic databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) for the same trade-off on the server side |

None of these strategies is universally the right one: the choice depends on how often each resource actually changes, not on a single preference applied to the whole site.

## The manifest: what makes a site installable

A **manifest** file (`manifest.json`), linked from the HTML page, declares the information a browser or operating system uses to offer installing the site as an application: its name, an icon in several sizes, a theme color, and a display mode (`standalone` hides the browser's address bar, to look like a native application).

```json
{
  "name": "My App",
  "short_name": "MyApp",
  "icons": [{ "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b"
}
```

Without a valid manifest (icons present, correct `start_url`), the browser never offers installation, even if a service worker is already working.

## What a PWA doesn't replace

A PWA is still a website: it doesn't have access to every API a native application can use (some sensors, deep system integration), and installing it depends on the user's browser and operating system rather than a centralized store. It's a good fit for extending an existing website, not for anything that already requires a native application today.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A PWA adds offline functionality (a service worker intercepting network requests, caching) and installability (a manifest declaring name, icons, display mode) to a website. The choice of caching strategy depends on how often each resource actually changes. |
| **Usable tools** | A service worker to intercept requests and serve from the cache; a `manifest.json` to make the site installable. |
| **Pitfalls to avoid** | Confusing the service worker with the page's main thread (no direct DOM access). An incomplete manifest that silently blocks installation. |
| **Best practices** | Choose the caching strategy per resource rather than a single choice for the whole site. Keep the service worker focused on the network and the cache. |
