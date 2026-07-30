---
order: 12
---

# La programación asíncrona (callbacks, Promises, async/await)

JavaScript se ejecuta en un **único hilo** (a diferencia de los hilos del capítulo dedicado al lenguaje C): solo puede hacer una cosa a la vez. Sin embargo, una solicitud de red o un temporizador no bloquean todo el programa mientras esperan; esa es la función del modelo asíncrono, construido en torno al **bucle de eventos** (*event loop*).

## El principio: el bucle de eventos

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // incluso con 0 ms, se ejecuta DESPUÉS del resto del código síncrono
console.log("3");

// Mostrar: 1, 3, 2
```

El motor de JavaScript ejecuta primero todo el código **síncrono** (la pila de llamadas, *call stack*); las operaciones asíncronas (temporizadores, solicitudes de red, eventos) se delegan al entorno de ejecución (navegador/Node.js), que coloca su callback en una **cola**, **que** solo se ejecuta una vez que se ha vaciado la pila de llamadas. Es este mecanismo el que permite que un único hilo siga siendo reactivo sin quedar nunca bloqueado por una operación lenta.

## Las funciones de devolución de llamada —y el «infierno de las funciones de devolución de llamada»—

```javascript
lireFichier("a.txt", (erreurA, contenuA) => {
    lireFichier("b.txt", (erreurB, contenuB) => {
        lireFichier("c.txt", (erreurC, contenuC) => {
            console.log(contenuA, contenuB, contenuC);
        });
    });
});
```

Encadenar varias operaciones asíncronas mediante callbacks anidados se vuelve rápidamente ilegible («*callback hell*»); las Promises, y posteriormente `async` / `await`, se introdujeron precisamente para resolver este problema.

## Las Promises

Una **«Promise»** representa un valor que aún no está disponible, pero que lo estará (o fallará) más adelante; hay tres estados posibles: *«pending»* (pendiente), *«fulfilled»* (resuelta) y *«rejected»* (rechazada).

```javascript
function attendre(millisecondes) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Terminé !"), millisecondes);
    });
}

attendre(1000)
    .then(resultado => console.log(resultado))   // Se ejecuta si la promesa se resuelve
    .catch(error => console.log(error));      // se ejecutará si se rechaza
```

### Encadenar Promises

```javascript
lireFichierPromise("a.txt")
    .then(contenuA => lireFichierPromise("b.txt"))
    .then(contenuB => lireFichierPromise("c.txt"))
    .then(contenuC => console.log("Tout est chargé"))
    .catch(error => console.log("Une étape a échoué :", error));
```

### `Promise.all` : esperar varias promesas en paralelo

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

> **Nota:** «`Promise.all`» ejecuta ambas consultas **al mismo tiempo** (no una tras otra) y espera a que todas se completen; si una falla, la promesa global se rechaza inmediatamente, aunque la otra haya tenido éxito.

## `async` / `await`: sintaxis simplificada sobre las Promises

```javascript
async function chargerUtilisateur(id) {
    const respuesta = await fetch(`/api/utilisateurs/${id}`);   // «espera» la Promise, sin bloquear el hilo
    const datos = await respuesta.json();
    return datos;
}
```

- `async` El hecho de que una función vaya precedida de «promise» hace que **siempre** devuelva una Promise, de forma implícita.
- `await` Solo se puede utilizar dentro de una función `async`: «pausa» dicha función (sin bloquear el resto del programa) hasta que la Promise se resuelva o se rechace.

```javascript
// Equivalente exactamente idéntico, pero mucho más legible que con .then() anidados:
async function chargerTout() {
    const contenuA = await lireFichierPromise("a.txt");
    const contenuB = await lireFichierPromise("b.txt");
    const contenuC = await lireFichierPromise("c.txt");
    console.log(contenuA, contenuB, contenuC);
}
```

Véase también el capítulo sobre la gestión de errores en `try` / `catch` en relación con `await`, y sobre las llamadas HTTP en PHP (`HttpClient`) para un equivalente síncrono de `fetch()`.
