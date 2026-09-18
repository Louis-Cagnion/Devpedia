---
order: 10
---

# Error Handling

JavaScript signals an error by throwing an **exception** (`throw`), interceptable with `try`/`catch`, a mechanism close to [PHP](/?c=langages&s=php&p=php)'s or [Python](/?c=langages&s=python&p=python)'s.

## `try` / `catch` / `finally`

```javascript
try {
    const result = JSON.parse("{ invalid");
} catch (error) {
    console.log("Parsing error:", error.message);
} finally {
    console.log("Attempt finished");   // runs in every case
}
```

## Throwing your own errors

```javascript
function calculateAge(birthYear) {
    const currentYear = new Date().getFullYear();
    if (birthYear > currentYear) {
        throw new Error("Birth year cannot be in the future");
    }
    return currentYear - birthYear;
}

try {
    calculateAge(3000);
} catch (error) {
    console.log(error.message);
}
```

## Creating a custom error type

```javascript
class InsufficientBalanceError extends Error {
    constructor(message) {
        super(message);
        this.name = "InsufficientBalanceError";
    }
}

function withdraw(balance, amount) {
    if (amount > balance) {
        throw new InsufficientBalanceError(`Balance of $${balance} is insufficient`);
    }
    return balance - amount;
}

try {
    withdraw(100, 150);
} catch (error) {
    if (error instanceof InsufficientBalanceError) {
        console.log("Insufficient balance:", error.message);
    } else {
        throw error;   // unexpected error: let it propagate rather than swallow it
    }
}
```

## Errors and asynchronous code

A classic `try`/`catch` **does not catch** an asynchronous function's error if it isn't itself `await`ed (see [Asynchronous programming](/?c=langages&s=javascript&p=asynchrone)):

```javascript
async function loadData() {
    try {
        const response = await fetch("/api/data");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.log("Loading failed:", error.message);
    }
}
```

For a non-`await`ed `Promise`, `.catch()` plays the same role:

```javascript
fetch("/api/data")
    .then(response => response.json())
    .catch(error => console.log("Failed:", error.message));
```

> **Note:** an error thrown inside an `async` function doesn't immediately become a classic JavaScript exception: it turns the returned `Promise` into a **rejected** promise, retrievable only via `await` in a `try`/`catch`, or via `.catch()`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `try`/`catch`/`finally` catches an exception raised by `throw`. An error in asynchronous code that isn't `await`ed doesn't propagate into a classic `try`/`catch`: it rejects the Promise instead. |
| **Tools you can use** | `Error` and its custom subclasses (`extends Error`), `instanceof` to distinguish error types, `.catch()` on a Promise. |
| **Pitfalls to avoid** | Expecting a `try`/`catch` to catch a non-`await`ed Promise's error; it never will. |
| **Best practices** | Always `await` an asynchronous operation inside a `try`/`catch`, or chain `.catch()` onto the corresponding Promise; let an unexpected error propagate rather than silently swallowing it. |
