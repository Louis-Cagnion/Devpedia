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
// funciona, aunque esté escrito antes de la declaración de más abajo
console.log(sumar(2, 3));
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
// una sola expresión: retorno implícito, sin "return"
const sumar = (a, b) => a + b;
const cuadrado = x => x * x;                     // paréntesis opcionales con un solo parámetro
// cuerpo multilínea: llaves + "return" explícito requerido
const saludar = () => { console.log("Hola"); }
```

### La verdadera diferencia: `this`

```javascript
const objeto = {
    nombre: "Contador",
    valores: [1, 2, 3],

    mostrarClasica: function () {
        this.valores.forEach(function (v) {
            // "this" aquí es undefined (o el objeto global): ¡NO es "objeto"!
            console.log(this.nombre, v);
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
// valor por defecto si se omite el argumento o es undefined
function saludar(nombre, mensaje = "Hola") {
    return `${mensaje} ${nombre}`;
}

// "rest": agrupa los argumentos sobrantes en un array
function suma(...numeros) {
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

## El patrón IIFE: una función invocada inmediatamente para aislar variables

Una **IIFE** (*Immediately Invoked Function Expression*) es una función declarada e invocada en una sola expresión, nunca reutilizada por su nombre (normalmente no tiene ninguno):

```javascript
(function (global) {
    const CATEGORIAS = [];   // permanece privada, invisible desde el resto de la pagina
    const ICONOS = {};       // igual

    function svg(nombre) { /* ... */ }   // igual

    global.MiBiblioteca = { svg };   // el Único punto accesible desde fuera
})(window);
```

Gracias a las closures (arriba), todas las variables declaradas dentro permanecen privadas a esta función: nada desde fuera puede acceder a ellas, salvo lo explícitamente expuesto (aquí, `global.MiBiblioteca`). Este patrón es anterior a los módulos ES (`import`/`export`) y sigue usándose en JavaScript no empaquetado (*non-bundled*), cargado mediante simples etiquetas `<script>`: sin él, cada variable declarada en el primer nivel de un archivo se vuelve global, con el riesgo de que otro archivo cargado al lado declare una variable con el mismo nombre y sobrescriba la primera.

> **Buena práctica:** preferir los módulos ES (`import`/`export`) en cuanto exista ya una herramienta de build; reservar la IIFE para los casos en que el JavaScript se carga directamente mediante etiquetas `<script>`, sin paso de build.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una declaración de función es *hoisted* (utilizable antes de su definición), una expresión no lo es. Una función con flecha no tiene su propio `this`: reutiliza el de la función que la engloba. Una closure conserva el acceso a las variables de su función englobante después de que esta haya terminado de ejecutarse; una IIFE aprovecha esta propiedad para aislar variables privadas. |
| **Herramientas utilizables** | Parámetros por defecto, `...` (rest/spread), una IIFE para namespacer JavaScript no empaquetado cargado con `<script>`. |
| **Trampas a evitar** | Usar una función clásica (`function`) como callback dentro de un método, esperando que `this` designe el objeto englobante: para eso hace falta una función con flecha. |
| **Buenas prácticas** | Preferir las funciones con flecha para un callback interno a un método, para conservar el `this` correcto. Preferir los módulos ES a una IIFE en cuanto haya una herramienta de build disponible. |
