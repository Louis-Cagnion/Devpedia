---
order: 1
---

# Conditions

JavaScript uses `if` / `else if` / `else` and `switch`, with one major difference compared to PHP or Python: its "`==`" are known for their surprising type conversions.

## `if` / `else if` / `else`

```javascript
const age = 20;

if (age >= 18) {
    console.log("Vous êtes majeur.");
} else if (age >= 13) {
    console.log("Vous êtes adolescent.");
} else {
    console.log("Vous êtes enfant.");
}
```

## `==` vs`===`: even more critical than in PHP

```javascript
0 == "0"        // true  -> converted to a number before comparison
0 == ""          // true  -> "" converted to 0
null == undefined // true -> special case
"" == false        // true
1 == "1"            // true

0 === "0"    // false -> different types, no conversion
```

> **Note:** These implicit conversions from `==` are a notorious source of bugs in JavaScript — `===` / `!==` (strict equality, both type AND value) should be the default, just like in PHP.

## "Truthy" and "falsy" values

```javascript
if (0) {}          // falsy
if ("") {}          // falsy
if (null) {}         // falsy
if (undefined) {}     // falsy
if (NaN) {}            // falsy
if ([]) {}               // TRUTHY! (unlike PHP, where an empty array is falsy)
if ({}) {}                // TRUTHY!
```

> **Note:** A common pitfall for those coming from PHP: an **empty** array or object is `truthy` in JavaScript, whereas it is `falsy` in PHP—always explicitly test `array.length === 0` rather than `if (!array)`.

## The ternary operator

```javascript
const statut = age >= 18 ? "majeur" : "mineur";
```

## `??` and `?.`

```javascript
const pseudo = user.pseudo ?? "Invité";
// "??" falls back to the default value ONLY if the value is null or undefined (not 0, "", or false)

const city = user?.adresse?.city ?? "Inconnue";
// "?.": If "user" or "address" is null or undefined, it stops immediately and returns undefined
// -> prevents a cascading "Cannot read properties of undefined" TypeError
```

> **Note:** `??` differs from `||`: `0 || "défaut"` returns `"défaut"` (0 is falsy for `||`), whereas `0 ?? "défaut"` returns `0` (0 is neither `null` nor `undefined`).

## 

```javascript
const jour = 3;

switch (jour) {
    case 1:
        console.log("Lundi");
        break;
    case 2:
    case 3:
        console.log("Début de semaine");  // No break between 2 and 3: mixed results
        break;
    default:
        console.log("Autre jour");
}
```

`switch` Compare with **strict** equality (`===`) — no unexpected type conversions here, unlike `if (x == y)`.
