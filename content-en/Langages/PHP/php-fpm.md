---
order: 15
---

# Responding to the client, then continuing to work (PHP-FPM)

Sometimes a request needs to respond right away while still triggering a heavy computation behind the scenes (refreshing a [stale cache](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant), for example). **PHP-FPM**, the most common execution engine in production, allows exactly that: cutting the connection to the client without stopping the script. The response leaves immediately, the rest of the code keeps running, invisible to the user. This chapter explains how, and where the pitfalls are.

## PHP-FPM: a pool of processes, one request at a time each

A PHP script needs a program to run it. That program is called a **SAPI** (*Server API*): depending on which one is used, PHP behaves differently.

| SAPI | What it is | Typical use |
|---|---|---|
| CLI | Runs a script from the command line, with no HTTP request | Scheduled tasks, command-line tools |
| Built-in server (`php -S`) | A small HTTP server shipped with PHP, a single process | Local development only (see [setting up a local environment](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) |
| **PHP-FPM** (*FastCGI Process Manager*) | A group (*pool*) of PHP processes already started, each receiving one request at a time via the **FastCGI** protocol | Production, behind a web server such as Nginx or Apache |

Each process in the pool (a **worker**, the same notion as in the chapter on [parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) handles one request, then becomes available again for the next one as soon as its script ends:

```text
Nginx (receives the HTTP request)
        |
        v  (FastCGI protocol)
   PHP-FPM pool
   +---------+  +---------+  +---------+
   | worker1 |  | worker2 |  | worker3 |   <- N processes, started ahead of time
   | busy    |  | free    |  | busy    |
   +---------+  +---------+  +---------+
```

A busy worker only handles a single request until its script ends: that is precisely the detail this chapter's technique works around.

## Classic CGI, the ancestor of FastCGI

Before FastCGI (used by PHP-FPM above), the **CGI** standard (*Common Gateway Interface*, 1990s) addressed the same need differently: an **entirely new** process launched for **each** request, via `fork()`/`execve()` (see [Processes](/?c=langages-de-programmation&s=c&p=processus)), rather than a pool of already-running processes.

```text
FastCGI (PHP-FPM):                     Classic CGI:

Pool of already-launched workers       One fork()/execve() PER request
   |                                       |
Request -> free worker handles it         Request -> new process
   |                                       |          launched, handles it,
Stays available for the next one          |          then exits
                                       Next request -> new process,
                                       all over again
```

The CGI script receives neither the HTTP method nor parameters through a function call: this information is passed to it as **environment variables**, standardized by the CGI/1.1 spec:

| Environment variable | Content |
|---|---|
| `REQUEST_METHOD` | The HTTP method (`GET`, `POST`...) |
| `QUERY_STRING` | The parameters after the URL's `?` |
| `CONTENT_LENGTH` | The request body's size, if there is one |
| `HTTP_<HEADER_NAME>` | Each HTTP header received, uppercased with `_` |

The request body (for a `POST`) is provided on the process's standard input (`stdin`), and its response is read from its standard output (`stdout`), reparsed as a mini HTTP header followed by the body, separated by a blank line (the same `\r\n\r\n` format as an HTTP request itself).

> **Best practice:** an entirely new process per request is expensive (startup time); that's precisely what FastCGI (and PHP-FPM) was designed to avoid, by reusing a pool of already-running processes instead of launching a new one every time. Classic CGI remains relevant for occasional or infrequent use (a rarely run script), where startup cost matters less than simplicity.

## `register_shutdown_function()`: running code at the very end of the script

This function registers a callback that runs right after the script ends: whether that's a normal end, an `exit()`/`die()`, or most fatal errors. It works on any SAPI, not just PHP-FPM.

```php
<?php
register_shutdown_function(function () {
    error_log('Script ended at ' . date('H:i:s'));
});

echo 'Hello';   // the log message only appears after this line, at the very end of the script
```

> **Note:** a callback registered this way receives no parameters automatically; to hand it data from the surrounding context, use an anonymous function with `use (...)`, as in the example above.

## `fastcgi_finish_request()`: closing the connection without stopping the script

Specific to PHP-FPM (absent from other SAPIs), this function immediately sends the client everything already produced (`echo`...) and closes the connection, without stopping the script: the worker keeps executing the rest of the code, but the client itself has already moved on.

```text
Without fastcgi_finish_request():      With fastcgi_finish_request():

request -> compute (6 min) -> response request -> immediate response
   the client waits 6 minutes             |
                                           v
                                   compute (6 min), invisible to
                                   a client already gone
```

```php
<?php
echo 'Processing started, check back later.';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

generateExpensiveReport();
```

> **Pitfall:** anything written after `fastcgi_finish_request()` (`echo`, HTTP header) goes nowhere, without the slightest error: the connection is already closed, that output is simply lost.

> **Pitfall:** calling `fastcgi_finish_request()` without checking `function_exists()` first. The same code run under CLI or the built-in server (`php -S`) throws a fatal error, since the function simply doesn't exist on those SAPIs.

## Combining both: respond, then refresh a stale cache in the background

The typical use case: serve a stale disk cache right away, and schedule its refresh for after the response.

```php
<?php
public function getCatalog(): array
{
    $fresh = $this->readCache();
    if ($fresh !== null) return $fresh;   // cache still valid: nothing else to do

    $stale = $this->readCache(ignoreTtl: true);
    if ($stale !== null) {
        $this->scheduleBackgroundRefresh($this->cacheFile);
        return $stale;                    // respond with the stale value while it recomputes
    }

    return $this->refreshNow($this->cacheFile);   // very first call: no choice but to wait
}

private function scheduleBackgroundRefresh(string $file): void
{
    $lock = $file . '.refreshing';

    if (is_file($lock) && (time() - (int) @filemtime($lock)) < 600) {
        // a refresh is already running, no need to start another
        return;
    }

    // 'x': fails if the file already exists (atomic creation)
    $handle = @fopen($lock, 'x');
    if ($handle === false) return;     // another worker already won the race
    fclose($handle);

    // runs to completion even if the client has already left
    ignore_user_abort(true);

    register_shutdown_function(function () use ($file, $lock) {
        if (function_exists('fastcgi_finish_request')) {
            // the client gets its response here, the connection closes
            fastcgi_finish_request();
        }
        try {
            $this->refreshNow($file);
        } finally {
            @unlink($lock);            // always released, even if the computation threw
        }
    });
}
```

- The `.refreshing` file acts as a concurrency lock: without it, every request that sees the stale cache would trigger its own recompute in parallel (the same pitfall already covered in [stale-while-revalidate](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).
- `fopen(..., 'x')` creates the file atomically: if two workers arrive at the same time, only one gets a real handle, the other gets `false`.
- The `finally` (see [handling errors in PHP](/?c=langages&s=php&p=exceptions)) guarantees the lock is released even if `refreshNow()` throws, otherwise the lock would stay stuck until the 10-minute margin expires.

## `ignore_user_abort()`: not depending on a client that has already left

By default, if the client disconnects (closes the tab, drops the connection) before the script ends, PHP may interrupt execution along the way. `ignore_user_abort(true)` disables that interruption: the script runs to completion no matter what happens on the client side, which is essential here since the whole point of the technique is that the client doesn't wait for the end.

> **Pitfall:** forgetting `ignore_user_abort(true)` before registering the callback. The background work can then stop halfway through if the client has already closed the page, even though that no longer has anything to do with it at this stage.

## A limit to keep in mind

This technique speeds up the response perceived by the client, not the pool's total capacity: the worker stays busy until the script actually finishes, background work included. A frequent or heavy refresh can therefore still saturate the pool, exactly as if it had blocked the response. For real asynchronous processing decoupled from the worker pool, the right answer is a dedicated [message queue](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=system-design-lexercice), not this trick, which is best reserved for occasional, reasonably short background work.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PHP-FPM handles each request in a dedicated worker, freed once the script ends. `fastcgi_finish_request()` closes the client connection without stopping the script; `register_shutdown_function()` runs code right after the script's normal end, on any SAPI. Classic CGI (before FastCGI) launched an entirely new process per request. |
| **Tools you can use** | `register_shutdown_function()`, `fastcgi_finish_request()`, `ignore_user_abort()`, `function_exists()` to check whether a SAPI-specific function is available. |
| **Pitfalls to avoid** | Calling `fastcgi_finish_request()` without `function_exists()` (fatal error outside PHP-FPM); writing after that call expecting it to reach the client; forgetting `ignore_user_abort(true)`; forgetting the concurrency lock on a shared cache; thinking this technique increases the pool's capacity rather than the perceived latency. |
| **Best practices** | Check `function_exists('fastcgi_finish_request')` before any call; release a resource (lock, file) in a `finally` inside the shutdown callback; reserve the technique for occasional, short background work, a real queue for everything else. |
