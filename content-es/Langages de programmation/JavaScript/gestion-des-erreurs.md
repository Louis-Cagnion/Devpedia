---
order: 9
---

# Gestión de errores

JavaScript señala un error lanzando una **excepción** (`throw`), que se puede interceptar con `try` / `catch` —un mecanismo similar al de PHP o Python—.

## `try` / `catch` / `finally`

```javascript
try {
    const resultado = JSON.parse("{ invalide");
} catch (error) {
    console.log("Erreur de parsing :", error.mensaje);
} finally {
    console.log("Tentative terminée");   // se ejecuta en todos los casos
}
```

## Detectar los propios errores

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
    console.log(error.mensaje);
}
```

## Crear un tipo de error personalizado

```javascript
class SoldeInsuffisantError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = "SoldeInsuffisantError";
    }
}

function retirer(saldo, montant) {
    if (montant > saldo) {
        throw new SoldeInsuffisantError(`Solde de ${saldo}€ insuffisant`);
    }
    return saldo - montant;
}

try {
    retirer(100, 150);
} catch (error) {
    if (error instanceof SoldeInsuffisantError) {
        console.log("Solde insuffisant :", error.mensaje);
    } else {
        throw error;   // Error inesperado: dejar que se muestre en lugar de ocultarlo
    }
}
```

## Errores y código asíncrono

Un `try` / `catch` clásico **no intercepta** el error de una función asíncrona si esta no es a su vez un`await`ada (véase el capítulo sobre la asincronía):

```javascript
async function chargerDonnees() {
    try {
        const respuesta = await fetch("/api/donnees");
        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.log("Échec du chargement :", error.mensaje);
    }
}
```

Para una versión no`await`ada de `Promise`, `.catch()` cumple la misma función:

```javascript
fetch("/api/donnees")
    .then(respuesta => respuesta.json())
    .catch(error => console.log("Échec :", error.mensaje));
```

> **Nota:** un error que se produce en una función `async` no se convierte inmediatamente en una excepción clásica de JavaScript, sino que transforma la `Promise` devuelta en una promesa **rechazada**, a la que solo se puede acceder mediante `await` en un `try` / `catch`, o mediante `.catch()`.
