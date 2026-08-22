---
order: 2
---

# Loops

JavaScript offers the standard loops (`for`, `while`, `do...while`), plus two loops specifically designed for iterating over collections (`for...of`, `for...in`), and, in everyday practice, array methods (`map`, `filter`...) often replace an explicit loop.

## `for` classic

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
```

## `while` and `do...while`

```javascript
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

let j = 0;
do {
    console.log(j);
    j++;
} while (j < 5);   // is executed at least once; the condition is checked afterward
```

## `for...of` : Iterate through the values of an iterable

```javascript
const fruits = ["pomme", "banane", "cerise"];

for (const fruit of fruits) {
    console.log(fruit);
}

for (const caractere of "abc") {   // also works on a TV set
    console.log(caractere);
}
```

## `for...in` : Iterate through the keys of an object

```javascript
const person = { name: "Jean", age: 25 };

for (const key in person) {
    console.log(`${key} : ${person[key]}`);
}
```

> **Note:** `for...in` iterates over the **enumerable keys** of an object: never use it on an array (since `for...in` would iterate over the indices, as well as any properties manually added to the array, and does not guarantee the order): `for...of` or `.forEach()` are the correct methods to use for an array.

## `break` and `continue`

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    if (i % 2 === 0) continue;
    console.log(i);
}
```

## Array Functional Methods: The Idiomatic Alternative

In modern JavaScript, transforming or filtering an array is more often done using these methods than with an explicit`for`:

```javascript
const numbers = [1, 2, 3, 4, 5];

numbers.forEach(n => console.log(n));            // executes a function for each element
const doubles = numbers.map(n => n * 2);           // [2, 4, 6, 8, 10] -> transforms each element
const pairs = numbers.filter(n => n % 2 === 0);      // [2, 4] -> keeps only what matches
const somme = numbers.reduce((acc, n) => acc + n, 0); // 15 -> reduces the entire array to a single value
```

> **Note:** `reduce()` is the most versatile but the least immediately readable: `acc` (the accumulator) starts with the initial value provided as the second argument (`0` in this case) and is updated for each element according to the provided function.

See also the chapter on functions for the syntax of arrow functions (`=>`) used here.
