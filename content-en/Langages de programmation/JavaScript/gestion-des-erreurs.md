---
order: 9
---

# Error Handling

JavaScript signals an error by throwing an **exception** (`throw`), which can be intercepted using `try` / `catch` — a mechanism similar to that used in PHP or Python.

## `try` / `catch` / `finally`

```javascript
try {
    const result = JSON.parse("{ invalide");
} catch (error) {
    console.log("Erreur de parsing :", error.message);
} finally {
    console.log("Tentative terminée");   // carried out in all cases
}
```

## Learning from One's Own Mistakes

```javascript
function calculerAge(anneeNaissance) {
    const anneeCourante = new Date().getFullYear();
    if (anneeNaissance > anneeCourante) {
        throw new Error("L'année de naissance ne peut pas être dans le futur");
    }
    return anneeCourante - anneeNaissance;
}

try {
    calculerAge(3000);
} catch (error) {
    console.log(error.message);
}
```

## Create a custom error type

```javascript
class SoldeInsuffisantError extends Error {
    constructor(message) {
        super(message);
        this.name = "SoldeInsuffisantError";
    }
}

function retirer(balance, montant) {
    if (montant > balance) {
        throw new SoldeInsuffisantError(`Solde de ${balance}€ insuffisant`);
    }
    return balance - montant;
}

try {
    retirer(100, 150);
} catch (error) {
    if (error instanceof SoldeInsuffisantError) {
        console.log("Solde insuffisant :", error.message);
    } else {
        throw error;   // unexpected error: let it show up rather than hide it
    }
}
```

## Errors and Asynchronous Code

A standard `try` / `catch` **does not catch** an error from an asynchronous function if the function itself is not `await` (see the chapter on asynchronous operations):

```javascript
async function chargerDonnees() {
    try {
        const response = await fetch("/api/donnees");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.log("Échec du chargement :", error.message);
    }
}
```

For a non-`await`ed `Promise`, `.catch()` serves the same purpose:

```javascript
fetch("/api/donnees")
    .then(response => response.json())
    .catch(error => console.log("Échec :", error.message));
```

> **Note:** An error thrown within a `async` function does not immediately become a standard JavaScript exception—it transforms the returned `Promise` into a **rejected** promise, which can only be retrieved via `await` in a `try` or `catch`, or via `.catch()`.
