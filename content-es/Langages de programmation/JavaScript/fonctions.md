---
order: 3
---

# Las funciones

JavaScript ofrece tres formas de escribir una función —declaración, expresión y función con flecha— que no son simples variantes estilísticas: difieren en el *hoisting* y en la gestión de`this`o.

## Declaración de función

```javascript
function addition(a, b) {
    return a + b;
}

addition(2, 3);   // 5
```

Una **declaración** de función se *«hoista»* (se adelanta): se puede utilizar incluso **antes** **de** la línea en la que aparece su definición en el archivo, a diferencia de una expresión de función.

```javascript
console.log(addition(2, 3));  // Funciona, aunque esté escrito antes de la declaración que aparece más abajo.
function addition(a, b) { return a + b; }
```

## Expresión de función

```javascript
const addition = function (a, b) {
    return a + b;
};
```

En este caso, `addition` es una variable como cualquier otra: solo existe a partir de la línea en la que se le asigna un valor (no hay «hoisting» de la propia función, sino solo de la declaración `const` / `let`, que permanece inutilizable antes de la asignación —la «zona muerta temporal»—).

## Funciones flecha (*arrow functions*)

```javascript
const addition = (a, b) => a + b;              // Una sola expresión: retorno implícito, sin «return».
const carre = x => x * x;                        // paréntesis opcionales con un único parámetro
const saluer = () => { console.log("Bonjour"); }  // Cuerpo de varias líneas: se requieren llaves + «return» explícito
```

### La verdadera diferencia: `this`

```javascript
const objeto = {
    número: "Compteur",
    valores: [1, 2, 3],

    afficherClassique: function () {
        this.valores.forEach(function (v) {
            console.log(this.número, v);   // «this» aquí es indefinido (o el objeto global): ¡NO es un «objeto»!
        });
    },

    afficherFlechee: function () {
        this.valores.forEach((v) => {
            console.log(this.número, v);   // «this» toma el valor de afficherFlechee -> funciona
        });
    },
};
```

> **Nota:** una función clásica (`function`) recibe su propio `this`, determinado por **cómo se invoca** (dinámico). Una función con flecha no tiene su propio `this`: reutiliza el de la función que la engloba en el momento en que se escribe (léxico); esta es la razón principal por la que se prefieren las funciones con flecha para las llamadas de retorno internas de un método.

## Parámetros por defecto, rest y spread

```javascript
function saluer(número, mensaje = "Bonjour") {   // valor por defecto si se omite el argumento o este no está definido
    return `${mensaje} ${número}`;
}

function somme(...números) {                    // «rest»: agrupa los argumentos sobrantes en un array
    return números.reduce((total, n) => total + n, 0);
}
somme(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // «spread»: despliega los elementos de un array -> [1, 2, 3, 4, 5]
```

## Cierres

Una función anidada conserva el acceso a las variables de la función que la engloba, incluso después de que esta haya finalizado su ejecución:

```javascript
function contador() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const compter = contador();
compter();   // 1
compter();   // 2 -> «total» se ha conservado entre llamadas, propio de ESTA instancia de contador()
```
