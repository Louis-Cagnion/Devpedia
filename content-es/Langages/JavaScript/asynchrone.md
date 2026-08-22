---
order: 13
---

# La programación asíncrona (callbacks, Promises, async/await)

JavaScript se ejecuta en un **único hilo** (a diferencia de los [hilos](/?c=langages-de-programmation&s=c&p=threads) en C): solo puede hacer una cosa a la vez. Sin embargo, una solicitud de red o un temporizador no bloquean todo el programa mientras esperan: esa es la función del modelo asíncrono, construido en torno al **bucle de eventos** (*event loop*).

## El principio: el bucle de eventos

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // incluso con 0 ms, se ejecuta DESPUÉS del resto del código síncrono
console.log("3");

// Muestra: 1, 3, 2
```

El motor de JavaScript ejecuta primero todo el código **síncrono** (la pila de llamadas, *call stack*); las operaciones asíncronas (temporizadores, solicitudes de red, eventos) se delegan al entorno de ejecución (navegador/Node.js), que coloca su callback en una **cola de espera**, ejecutada solo una vez que la pila de llamadas se ha vaciado. Este mecanismo es el que permite que un único hilo se mantenga reactivo sin quedar nunca bloqueado por una operación lenta.

## Los callbacks y el "callback hell"

```javascript
leerArchivo("a.txt", (errorA, contenidoA) => {
    leerArchivo("b.txt", (errorB, contenidoB) => {
        leerArchivo("c.txt", (errorC, contenidoC) => {
            console.log(contenidoA, contenidoB, contenidoC);
        });
    });
});
```

Encadenar varias operaciones asíncronas mediante callbacks anidados se vuelve rápidamente ilegible (el "callback hell"): las Promises, y después `async`/`await`, se introdujeron precisamente para resolver este problema.

## Las Promises

Una **Promise** representa un valor que todavía no está disponible, pero que lo estará (o fallará) más adelante; tiene tres estados posibles: *pending* (pendiente), *fulfilled* (resuelta) y *rejected* (rechazada).

```javascript
function esperar(milisegundos) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("¡Listo!"), milisegundos);
    });
}

esperar(1000)
    .then(resultado => console.log(resultado))  // se ejecuta si la promesa se resuelve
    .catch(error => console.log(error));         // se ejecuta si se rechaza
```

### Encadenar Promises

```javascript
leerArchivoPromise("a.txt")
    .then(contenidoA => leerArchivoPromise("b.txt"))
    .then(contenidoB => leerArchivoPromise("c.txt"))
    .then(contenidoC => console.log("Todo está cargado"))
    .catch(error => console.log("Un paso falló:", error));
```

### `Promise.all`: esperar varias promesas en paralelo

```javascript
Promise.all([
    fetch("/api/usuarios"),
    fetch("/api/productos"),
]).then(([respuestaUsuarios, respuestaProductos]) => {
    console.log("Ambas solicitudes han terminado");
}).catch(error => {
    console.log("Al menos una de las dos solicitudes falló:", error);
});
```

> **Nota:** `Promise.all` lanza ambas solicitudes **al mismo tiempo** (no una tras otra) y espera a que todas se completen: si una falla, la Promise global se rechaza de inmediato, aunque la otra haya tenido éxito.

## `async`/`await`: azúcar sintáctico sobre las Promises

```javascript
async function cargarUsuario(id) {
    const respuesta = await fetch(`/api/usuarios/${id}`);   // "espera" la Promise, sin bloquear el hilo
    const datos = await respuesta.json();
    return datos;
}
```

- `async` delante de una función hace que esta devuelva **siempre** una Promise, de forma implícita.
- `await` solo se puede usar dentro de una función `async`: "pausa" esa función (sin bloquear el resto del programa) hasta que la Promise se resuelva o se rechace.

```javascript
// Equivalente estrictamente idéntico, pero mucho más legible que con .then() anidados:
async function cargarTodo() {
    const contenidoA = await leerArchivoPromise("a.txt");
    const contenidoB = await leerArchivoPromise("b.txt");
    const contenidoC = await leerArchivoPromise("c.txt");
    console.log(contenidoA, contenidoB, contenidoC);
}
```

Véase también [La gestión de errores](/?c=langages-de-programmation&s=javascript&p=gestion-des-erreurs) para `try`/`catch` alrededor de un `await`, y [Las llamadas HTTP en PHP](/?c=langages-de-programmation&s=php&p=http) (cURL) para un equivalente síncrono de `fetch()`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | JavaScript ejecuta todo el código síncrono antes de procesar la cola de eventos asíncronos (temporizadores, red). Las Promises (`then`/`catch`) y luego `async`/`await` estructuran ese código sin callbacks anidados. |
| **Herramientas utilizables** | `Promise`, `Promise.all`, `async`/`await`, `.then()`/`.catch()`. |
| **Trampas a evitar** | El "callback hell" (callbacks anidados e ilegibles); olvidar que un `throw` dentro de una función `async` rechaza la Promise en lugar de lanzar una excepción inmediata. |
| **Buenas prácticas** | Preferir `async`/`await` a los `.then()` encadenados por legibilidad; usar `Promise.all` para lanzar varias operaciones independientes en paralelo en lugar de en serie. |
