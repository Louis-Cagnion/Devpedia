---
order: 13
---

# Asynchronous Programming (Callbacks, Promises, async/await)

JavaScript runs on a **single thread** (unlike the [threads](/?c=langages&s=c&p=threads) covered in the [C](/?c=langages&s=c&p=c) chapter): it can only do one thing at a time. Yet a network request or a timer doesn't block the whole program while it waits: that's the role of the asynchronous model, built around the **event loop**.

## The principle: the event loop

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // even with 0ms, runs AFTER the rest of the synchronous code
console.log("3");

// Displays: 1, 3, 2
```

The JavaScript engine runs all **synchronous** code first (the call stack, *call stack*); asynchronous operations (timers, network requests, events) are delegated to the runtime environment (browser/Node.js), which places their callback in a **queue**, run only once the call stack is empty. This mechanism is what lets a single thread stay responsive without ever being blocked by a slow operation.

## Callbacks and "callback hell"

```javascript
readFile("a.txt", (errorA, contentA) => {
    readFile("b.txt", (errorB, contentB) => {
        readFile("c.txt", (errorC, contentC) => {
            console.log(contentA, contentB, contentC);
        });
    });
});
```

Chaining several asynchronous operations through nested callbacks quickly becomes unreadable ("*callback hell*"): Promises, then `async`/`await`, were introduced specifically to solve this problem.

## Promises

A **Promise** represents a value not yet available, but which will be (or will fail to be) later; three possible states: *pending*, *fulfilled*, *rejected*.

```javascript
function wait(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Done!"), milliseconds);
    });
}

wait(1000)
    .then(result => console.log(result))  // runs if the promise is resolved
    .catch(error => console.log(error));  // runs if it's rejected
```

### Chaining Promises

```javascript
readFilePromise("a.txt")
    .then(contentA => readFilePromise("b.txt"))
    .then(contentB => readFilePromise("c.txt"))
    .then(contentC => console.log("Everything is loaded"))
    .catch(error => console.log("A step failed:", error));
```

### `Promise.all`: waiting for several promises in parallel

```javascript
Promise.all([
    fetch("/api/users"),
    fetch("/api/products"),
]).then(([usersResponse, productsResponse]) => {
    console.log("Both requests are done");
}).catch(error => {
    console.log("At least one of the two requests failed:", error);
});
```

> **Note:** `Promise.all` launches both requests **at the same time** (not one after the other) and waits for both to succeed: if one fails, the overall Promise is immediately rejected, even if the other one succeeded.

## `async`/`await`: syntactic sugar over Promises

```javascript
async function loadUser(id) {
    const response = await fetch(`/api/users/${id}`);   // "waits" for the Promise, without blocking the thread
    const data = await response.json();
    return data;
}
```

- `async` before a function makes it **always** return a Promise, implicitly.
- `await` can only be used inside an `async` function: it "pauses" that function (without blocking the rest of the program) until the Promise is resolved or rejected.

```javascript
// Strictly equivalent, but much more readable than nested .then() calls:
async function loadEverything() {
    const contentA = await readFilePromise("a.txt");
    const contentB = await readFilePromise("b.txt");
    const contentC = await readFilePromise("c.txt");
    console.log(contentA, contentB, contentC);
}
```

See also [Error handling](/?c=langages&s=javascript&p=gestion-des-erreurs) for `try`/`catch` around an `await`, and [HTTP exchanges in PHP](/?c=langages&s=php&p=http) (cURL) for a synchronous equivalent of `fetch()`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | JavaScript runs all synchronous code before processing the asynchronous event queue (timers, network). Promises (`then`/`catch`) and then `async`/`await` structure this code without nested callbacks. |
| **Tools you can use** | `Promise`, `Promise.all`, `async`/`await`, `.then()`/`.catch()`. |
| **Pitfalls to avoid** | "Callback hell" (unreadable nested callbacks); forgetting that a `throw` inside an `async` function rejects the Promise rather than raising an immediate exception. |
| **Best practices** | Prefer `async`/`await` over chained `.then()` calls for readability; use `Promise.all` to launch several independent operations in parallel rather than in series. |
