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

## The IIFE pattern: an immediately invoked function to isolate variables

An **IIFE** (*Immediately Invoked Function Expression*) is a function declared and called in a single expression, never reused by name (it usually has none):

```javascript
(function (global) {
    const CATEGORIES = [];   // stays private, invisible from the rest of the page
    const ICONS = {};        // same

    function svg(name) { /* ... */ }   // same

    global.MyLibrary = { svg };   // the ONLY point reachable from the outside
})(window);
```

Thanks to closures (above), every variable declared inside stays private to this function: nothing outside can reach it, except what's explicitly exposed (here, `global.MyLibrary`). This pattern predates ES modules (`import`/`export`) and is still used in non-bundled JavaScript, loaded via plain `<script>` tags: without it, every variable declared at a file's top level becomes global, with the risk that another file loaded alongside declares a variable with the same name and overwrites the first one.

> **Best practice:** prefer ES modules (`import`/`export`) as soon as a build tool is already in place; reserve the IIFE for cases where JavaScript is loaded directly via `<script>` tags, with no build step.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A function declaration is *hoisted* (usable before its definition), an expression is not. An arrow function has no `this` of its own: it reuses the enclosing function's. A closure keeps access to its enclosing function's variables after that function has finished running; an IIFE uses this property to isolate private variables. |
| **Tools you can use** | Default parameters, `...` (rest/spread), an IIFE to namespace non-bundled JavaScript loaded via `<script>`. |
| **Pitfalls to avoid** | Using a classic function (`function`) as a callback inside a method, expecting `this` to refer to the enclosing object: an arrow function is needed for that. |
| **Best practices** | Prefer arrow functions for a callback internal to a method, to keep the correct `this`. Prefer ES modules over an IIFE as soon as a build tool is available. |
