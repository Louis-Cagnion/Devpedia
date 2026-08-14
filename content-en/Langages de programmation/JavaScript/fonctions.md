---
order: 3
---

# Functions

JavaScript offers three ways to write a function (declaration, expression, and arrow function), which are not merely stylistic variations: they differ in terms of *hoisting* and how they handle `this`.

## Function Declaration

```javascript
function addition(a, b) {
    return a + b;
}

addition(2, 3);   // 5
```

A function **declaration** is *hoisted*: it can be used even **before** the line where it is defined in the file, unlike a function expression.

```javascript
console.log(addition(2, 3));  // works, even if written before the declaration below
function addition(a, b) { return a + b; }
```

## Function Expression

```javascript
const addition = function (a, b) {
    return a + b;
};
```

Here, `addition` is a variable like any other: it only exists starting from the line where it is assigned (there is no hoisting of the function itself, only of the declaration `const` / `let`, which remains unusable before assignment, the "temporal dead zone").

## Arrow functions

```javascript
const addition = (a, b) => a + b;              // a single expression: implicit return, no "return"
const carre = x => x * x;                        // optional parentheses with a single parameter
const saluer = () => { console.log("Bonjour"); }  // multi-line body: curly braces + explicit "return" required
```

### The Real Difference: `this`

```javascript
const object = {
    name: "Compteur",
    values: [1, 2, 3],

    afficherClassique: function () {
        this.values.forEach(function (v) {
            console.log(this.name, v);   // "this" here is undefined (or the global object): NOT "object"!
        });
    },

    afficherFlechee: function () {
        this.values.forEach((v) => {
            console.log(this.name, v);   // "this" uses the same value as afficherFlechee -> works
        });
    },
};
```

> **Note:** A `function` receives its own `this`, which is determined by **how it is called** (dynamic). An arrow function does not have its own `this`: it reuses that of the enclosing function at the time it is written (lexical): this is the main reason to prefer arrow functions for callbacks within a method.

## Default settings, rest, and spread

```javascript
function saluer(name, message = "Bonjour") {   // default value if the argument is omitted or undefined
    return `${message} ${name}`;
}

function somme(...numbers) {                    // "rest": groups the remaining arguments into an array
    return numbers.reduce((total, n) => total + n, 0);
}
somme(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // "spread": spreads the elements of an array -> [1, 2, 3, 4, 5]
```

## Closures

A nested function retains access to the variables of the outer function, even after the outer function has finished executing:

```javascript
function counter() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const compter = counter();
compter();   // 1
compter();   // 2 -> "total" was retained between calls; specific to THIS instance of counter()
```
