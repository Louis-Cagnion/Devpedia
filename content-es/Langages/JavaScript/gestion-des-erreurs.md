---
order: 10
---

# La gestión de errores

JavaScript señala un error lanzando una **excepción** (`throw`), interceptable con `try`/`catch`: un mecanismo similar al de PHP o Python.

## `try` / `catch` / `finally`

```javascript
try {
    const resultado = JSON.parse("{ invalido");
} catch (error) {
    console.log("Error de análisis:", error.message);
} finally {
    console.log("Intento terminado");   // se ejecuta en todos los casos
}
```

## Lanzar errores propios

```javascript
function calcularEdad(anioNacimiento) {
    const anioActual = new Date().getFullYear();
    if (anioNacimiento > anioActual) {
        throw new Error("El año de nacimiento no puede estar en el futuro");
    }
    return anioActual - anioNacimiento;
}

try {
    calcularEdad(3000);
} catch (error) {
    console.log(error.message);
}
```

## Crear un tipo de error personalizado

```javascript
class SaldoInsuficienteError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = "SaldoInsuficienteError";
    }
}

function retirar(saldo, monto) {
    if (monto > saldo) {
        throw new SaldoInsuficienteError(`Saldo de ${saldo}€ insuficiente`);
    }
    return saldo - monto;
}

try {
    retirar(100, 150);
} catch (error) {
    if (error instanceof SaldoInsuficienteError) {
        console.log("Saldo insuficiente:", error.message);
    } else {
        throw error;   // error inesperado: dejarlo propagarse en vez de ocultarlo
    }
}
```

## Errores y código asíncrono

Un `try`/`catch` clásico **no intercepta** el error de una función asíncrona si a esta no se le aplica `await` (véase [La programación asíncrona](/?c=langages-de-programmation&s=javascript&p=asynchrone)):

```javascript
async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.log("Fallo en la carga:", error.message);
    }
}
```

Para una `Promise` sin `await`, `.catch()` cumple el mismo papel:

```javascript
fetch("/api/datos")
    .then(respuesta => respuesta.json())
    .catch(error => console.log("Fallo:", error.message));
```

> **Nota:** un error lanzado dentro de una función `async` no se convierte de inmediato en una excepción clásica de JavaScript: transforma la `Promise` devuelta en una promesa **rechazada**, recuperable únicamente mediante `await` dentro de un `try`/`catch`, o mediante `.catch()`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `try`/`catch`/`finally` intercepta una excepción lanzada por `throw`. Un error en código asíncrono sin `await` no se propaga a un `try`/`catch` clásico: rechaza la Promise. |
| **Herramientas utilizables** | `Error` y sus subclases personalizadas (`extends Error`), `instanceof` para distinguir tipos de error, `.catch()` sobre una Promise. |
| **Trampas a evitar** | Esperar que un `try`/`catch` intercepte el error de una Promise sin `await`; nunca lo hará. |
| **Buenas prácticas** | Hacer siempre `await` de una operación asíncrona dentro de un `try`/`catch`, o encadenar `.catch()` sobre la Promise correspondiente; dejar que un error inesperado se propague en lugar de ocultarlo silenciosamente. |
