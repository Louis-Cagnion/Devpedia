---
order: 3
---

# Las funciones

JavaScript ofrece tres formas de escribir una función (declaración, expresión, función con flecha) que no son simples variantes estilísticas: difieren en el *hoisting* y en la gestión de `this`.

## Declaración de función

```javascript
function sumar(a, b) {
    return a + b;
}

sumar(2, 3);   // 5
```

Una **declaración** de función es *hoisted* (adelantada): se puede usar incluso **antes** de su línea de definición en el archivo, a diferencia de una expresión de función.

```javascript
console.log(sumar(2, 3));  // funciona, aunque esté escrito antes de la declaración de más abajo
function sumar(a, b) { return a + b; }
```

## Expresión de función

```javascript
const sumar = function (a, b) {
    return a + b;
};
```

Aquí, `sumar` es una variable como cualquier otra: solo existe a partir de la línea en la que se le asigna un valor (no hay hoisting de la función en sí, sino solo de la declaración `const`/`let`, que permanece inutilizable antes de la asignación: la "zona muerta temporal").

## Funciones con flecha (*arrow functions*)

```javascript
const sumar = (a, b) => a + b;                  // una sola expresión: retorno implícito, sin "return"
const cuadrado = x => x * x;                     // paréntesis opcionales con un solo parámetro
const saludar = () => { console.log("Hola"); }   // cuerpo multilínea: llaves + "return" explícito requerido
```

### La verdadera diferencia: `this`

```javascript
const objeto = {
    nombre: "Contador",
    valores: [1, 2, 3],

    mostrarClasica: function () {
        this.valores.forEach(function (v) {
            console.log(this.nombre, v);   // "this" aquí es undefined (o el objeto global): ¡NO es "objeto"!
        });
    },

    mostrarFlecha: function () {
        this.valores.forEach((v) => {
            console.log(this.nombre, v);   // "this" toma el de mostrarFlecha -> funciona
        });
    },
};
```

> **Nota:** una función clásica (`function`) recibe su propio `this`, determinado por **cómo se invoca** (dinámico). Una función con flecha no tiene su propio `this`: reutiliza el de la función que la engloba en el momento en que se escribe (léxico); esta es la razón principal para preferir las funciones con flecha en callbacks internos a un método.

## Parámetros por defecto, rest y spread

```javascript
function saludar(nombre, mensaje = "Hola") {   // valor por defecto si se omite el argumento o es undefined
    return `${mensaje} ${nombre}`;
}

function suma(...numeros) {                    // "rest": agrupa los argumentos sobrantes en un array
    return numeros.reduce((total, n) => total + n, 0);
}
suma(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // "spread": despliega los elementos de un array -> [1, 2, 3, 4, 5]
```

## Closures

Una función anidada conserva el acceso a las variables de la función que la engloba, incluso después de que esta haya terminado su ejecución:

```javascript
function contador() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const contar = contador();
contar();  // 1
contar();  // 2 -> "total" persistió entre llamadas, propio de ESTA instancia de contador()
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una declaración de función es *hoisted* (utilizable antes de su definición), una expresión no lo es. Una función con flecha no tiene su propio `this`: reutiliza el de la función que la engloba. Una closure conserva el acceso a las variables de su función englobante después de que esta haya terminado de ejecutarse. |
| **Herramientas utilizables** | Parámetros por defecto, `...` (rest/spread). |
| **Trampas a evitar** | Usar una función clásica (`function`) como callback dentro de un método, esperando que `this` designe el objeto englobante: para eso hace falta una función con flecha. |
| **Buenas prácticas** | Preferir las funciones con flecha para un callback interno a un método, para conservar el `this` correcto. |
