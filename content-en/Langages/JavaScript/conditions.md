---
order: 1
---

# Conditions

JavaScript uses `if`/`else if`/`else` and `switch`, with one major quirk compared to [PHP](/?c=langages&s=php&p=conditions) or [Python](/?c=langages&s=python&p=conditions): its "loose" comparison rules (`==`) are notorious for their surprising type conversions.

## `if` / `else if` / `else`

```javascript
const age = 20;

if (age >= 18) {
    console.log("You are an adult.");
} else if (age >= 13) {
    console.log("You are a teenager.");
} else {
    console.log("You are a child.");
}
```

## `==` vs `===`: even more critical than in PHP

```javascript
0 == "0"           // true  -> converted to a number before comparison
0 == ""            // true  -> "" converted to 0
null == undefined  // true  -> special case
"" == false        // true
1 == "1"           // true

0 === "0"    // false -> different types, no conversion
```

> **Note:** these implicit conversions from `==` are a legendary source of bugs in JavaScript; `===`/`!==` (strict equality, type AND value) should be the default choice, exactly as in [PHP](/?c=langages&s=php&p=conditions).

## "Truthy" and "falsy" values

```javascript
if (0) {}          // falsy
if ("") {}         // falsy
if (null) {}       // falsy
if (undefined) {}  // falsy
if (NaN) {}        // falsy
if ([]) {}         // TRUTHY! (unlike PHP, where an empty array is falsy)
if ({}) {}         // TRUTHY!
```

> **Note:** a classic pitfall for anyone coming from [PHP](/?c=langages&s=php&p=conditions): an **empty** array or object is `truthy` in JavaScript, whereas it's `falsy` in [PHP](/?c=langages&s=php&p=php); always test `array.length === 0` explicitly rather than `if (!array)`.

## The ternary operator

```javascript
const status = age >= 18 ? "adult" : "minor";
```

## Nullish coalescing (`??`) and optional chaining (`?.`)

```javascript
const username = user.username ?? "Guest";
// "??" only falls back to the default value if the value is null/undefined (not 0, "", false)

const city = user?.address?.city ?? "Unknown";
// "?.": if "user" or "address" is null/undefined, it stops immediately and returns undefined
// -> avoids a cascading "Cannot read properties of undefined" TypeError
```

> **Note:** `??` differs from `||`: `0 || "default"` returns `"default"` (0 is falsy for `||`), whereas `0 ?? "default"` returns `0` (0 is neither `null` nor `undefined`).

## `switch`

```javascript
const day = 3;

switch (day) {
    case 1:
        console.log("Monday");
        break;
    case 2:
    case 3:
        console.log("Start of the week");  // no break between 2 and 3: shared case
        break;
    default:
        console.log("Other day");
}
```

`switch` compares with **strict** equality (`===`): no surprise type conversion here, unlike `if (x == y)`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `if`/`else if`/`else` and `switch` (strict `===` comparison) structure control flow. `??` and `?.` cleanly handle `null`/`undefined` values. |
| **Tools you can use** | Ternary operator `? :`, nullish coalescing `??`, optional chaining `?.`. |
| **Pitfalls to avoid** | Using `==` (surprising type conversions); testing `if (array)` thinking an empty array is falsy: it's truthy in JavaScript, unlike [PHP](/?c=langages&s=php&p=php). |
| **Best practices** | Always prefer `===`/`!==` over `==`/`!=`; use `array.length === 0` to test for an empty array. |
