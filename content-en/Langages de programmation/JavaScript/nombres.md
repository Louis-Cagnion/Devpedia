---
order: 6
---

# Numbers

JavaScript stands out with a radical choice: for a long time it had **only one numeric type**, `number`, a double-precision float (IEEE 754). It therefore doesn't distinguish integers from decimals — `1` and `1.0` are the same value.

> The surprising behaviors that follow from this (`0.1 + 0.2 !== 0.3`, the large-integer limit, `NaN !== NaN`) are **not** specific to JavaScript: they come from float encoding, common to every language. The full explanation is in the [Floating-Point Numbers](/?c=representation-des-donnees&p=nombres-flottants) chapter. This chapter focuses on what JavaScript does with it.

## A single type, so floating-point integers

```js
typeof 42;        // "number"
typeof 42.5;      // "number"
typeof NaN;       // "number"

42 === 42.0;      // true: no distinction
5 / 2;            // 2.5 -> no implicit integer division
Math.trunc(5 / 2) // 2   -> you have to ask for it explicitly
```

The lack of native integer division is a frequent pitfall for anyone coming from C or Python (`5 // 2`).

## Comparing decimals

As everywhere, you don't compare two floats with `===` but via a margin of error:

```js
const epsilon = 0.0001;
if (Math.abs(a - b) < epsilon) { /* considered equal */ }
```

JavaScript provides `Number.EPSILON` (≈ `2.22e-16`), the gap between `1` and the next float. Useful for values close to 1, but **too strict** as soon as you're working with large numbers:

```js
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;            // true
Math.abs(1e9 + 0.1 - (1e9 + 0.2)) < Number.EPSILON;    // false, even though the gap is tiny
```

For monetary amounts, the right approach remains working in **cents**, with integers.

## The exact-integer limit

Since a double's mantissa is 52 bits, integers are only exact up to 2⁵³ − 1:

```js
Number.MAX_SAFE_INTEGER;                  // 9007199254740991
9007199254740992 === 9007199254740993;    // true! indistinguishable
Number.isSafeInteger(2 ** 53);            // false
```

This is a concrete problem as soon as you're handling identifiers coming from a database `BIGINT` column: beyond this limit, JavaScript silently rounds them. The usual workaround is to carry them as a **string** in JSON.

## `BigInt`: arbitrary-precision integers

Since ES2020, `BigInt` lifts this limit. It's written with a trailing `n`:

```js
9007199254740993n === 9007199254740992n;   // false: exact
2n ** 64n;                                  // 18446744073709551616n
```

Two constraints to know about:

```js
1n + 1;        // TypeError: you can't mix BigInt and number
1n + BigInt(1) // 2n: explicit conversion is required
5n / 2n;       // 2n: integer division, the decimal part is truncated
```

`BigInt` is meant for large identifiers and cryptography, not decimal computation — it only handles integers.

## `NaN` and infinities

```js
1 / 0;              // Infinity  (not an error)
-1 / 0;             // -Infinity
0 / 0;              // NaN
parseInt("abc");    // NaN

NaN === NaN;        // false: NaN equals nothing, not even itself
Number.isNaN(NaN);  // true  -> the right way to test
isNaN("abc");       // true  -> WATCH OUT: converts first, so it's misleading
Number.isNaN("abc") // false -> "abc" isn't NaN, it's a string
```

Always prefer `Number.isNaN()` over the old global `isNaN()` function, which converts its argument before testing and produces false positives.

## Converting from a string

```js
Number("42");       // 42
Number("42px");     // NaN   -> strict: all or nothing
parseInt("42px");   // 42    -> lenient: stops at the first invalid character
parseFloat("3.9m"); // 3.9
Number("");         // 0     -> classic pitfall: an empty string becomes 0
```

`parseInt` accepts a second argument, the base, which it's wise to always specify: `parseInt("08", 10)`.

## Formatting for display

```js
(1234.5678).toFixed(2);     // "1234.57" -> returns a STRING, not a number
(0.000001234).toExponential(2);  // "1.23e-6"

(1234567.891).toLocaleString("en-US", { style: "currency", currency: "USD" });
// "$1,234,567.89"
```

`toLocaleString` handles thousands separators and the decimal point on its own — no need to reconstruct them by hand.

## Summary

| Pitfall | Reflex |
|---|---|
| A single `number` type (float) | `Math.trunc()` for integer division |
| `0.1 + 0.2 !== 0.3` | Compare via a margin of error |
| Monetary amounts | Work in cents |
| Identifiers > 2⁵³ | Carry them as a string, or use `BigInt` |
| `NaN !== NaN` | `Number.isNaN()`, never `isNaN()` |
| `Number("")` equals `0` | Validate before converting |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | JavaScript has only one numeric type (`number`, IEEE 754 float) — no native integer/decimal distinction. `BigInt` lifts the exact-large-integer limit (2⁵³ − 1). |
| **Tools you can use** | `Math.trunc`, `Number.isNaN`, `Number.isSafeInteger`, `toFixed`/`toLocaleString` for display. |
| **Pitfalls to avoid** | Comparing two floats with `===`; using global `isNaN()` (converts before testing) rather than `Number.isNaN()`. |
| **Best practices** | Work in cents for monetary amounts; carry a large identifier as a string rather than as a `number`. |
