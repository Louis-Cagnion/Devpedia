---
order: 12
---

# Asynchronous Programming (Callbacks, Promises, async/await)

JavaScript runs on a **single thread** (unlike the threads discussed in the dedicated chapter on C): it can only do one thing at a time. However, a network request or a timer does not block the entire program while waiting—that is the role of the asynchronous model, built around the **event*** ***loop**.

## The Concept: The Event Loop

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // even with 0 ms, it runs AFTER the rest of the synchronous code
console.log("3");

// Display: 1, 3, 2
```

The JavaScript engine executes all **synchronous** code first (the call* stack*); asynchronous operations (timers, network requests, events) are delegated to the runtime environment (browser/Node.js), which places their callbacks in a **queue that** is executed only after the call stack has been cleared. It is this mechanism that allows a single thread to remain responsive without ever being blocked by a slow operation.

## Callbacks — and "callback hell"

```javascript
lireFichier("a.txt", (erreurA, contenuA) => {
    lireFichier("b.txt", (erreurB, contenuB) => {
        lireFichier("c.txt", (erreurC, contenuC) => {
            console.log(contenuA, contenuB, contenuC);
        });
    });
});
```

Chaining multiple asynchronous operations using nested callbacks quickly becomes unreadable ("*callback hell*")—Promises, and later `async` / `await`, were introduced specifically to solve this problem.

## The Promises

A **Promise** represents a value that is not yet available but will be (or will fail to be) available later—there are three possible states: *pending*, *fulfilled*, and rejected.

```javascript
function attendre(millisecondes) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Terminé !"), millisecondes);
    });
}

attendre(1000)
    .then(result => console.log(result))   // enforced if the promise is rescinded
    .catch(error => console.log(error));      // carried out if it is rejected
```

### Chaining Promises

```javascript
lireFichierPromise("a.txt")
    .then(contenuA => lireFichierPromise("b.txt"))
    .then(contenuB => lireFichierPromise("c.txt"))
    .then(contenuC => console.log("Tout est chargé"))
    .catch(error => console.log("Une étape a échoué :", error));
```

### `Promise.all` : waiting for several promises to complete at the same time

```javascript
Promise.all([
    fetch("/api/utilisateurs"),
    fetch("/api/produits"),
]).then(([reponseUtilisateurs, reponseProduits]) => {
    console.log("Les deux requêtes sont terminées");
}).catch(error => {
    console.log("Au moins une des deux requêtes a échoué :", error);
});
```

> **Note:** `Promise.all` runs both requests **at the same time** (not one after the other) and waits for both to complete—if one fails, the outer Promise is immediately rejected, even if the other succeeded.

## `async` /`await`: Syntax Sugar on Top of Promises

```javascript
async function chargerUtilisateur(id) {
    const response = await fetch(`/api/utilisateurs/${id}`);   // "waits" for the Promise, without blocking the thread
    const data = await response.json();
    return data;
}
```

- `async` Placing a `promise` keyword before a function causes it to **always** return a Promise, by default.
- `await` can only be used within a `async` function—it "pauses" that function (without blocking the rest of the program) until the Promise is resolved or rejected.

```javascript
// An equivalent that is exactly the same, but much easier to read than using nested `.then()` calls:
async function chargerTout() {
    const contenuA = await lireFichierPromise("a.txt");
    const contenuB = await lireFichierPromise("b.txt");
    const contenuC = await lireFichierPromise("c.txt");
    console.log(contenuA, contenuB, contenuC);
}
```

See also the chapter on error handling at `try` / `catch` regarding `await`, and the section on HTTP requests in PHP (`HttpClient`) for a synchronous equivalent of `fetch()`.
