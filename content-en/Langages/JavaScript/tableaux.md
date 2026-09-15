---
order: 5
---

# Arrays

An array in JavaScript is a structure that lets you store several values in a single variable, as an ordered list. Each value is accessed via its index, which always starts at 0.

It can be created in 2 different ways:

```javascript
// literal, the most common
const arr1 = [1, 2, 3];

// with the Array constructor
const arr2 = new Array(1, 2, 3);

// an array can contain different types, including other arrays or objects
const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Array prototypes

Prototypes are functions built into the array object by default, letting you perform certain actions on the array (add, remove, transform, iterate over elements...). Some of them modify the original array (they **mutate** it), others always return a copy without touching it:

| Method | Effect | Mutates the original array? |
|---|---|---|
| `includes(value)` | Tests whether a value is present (`true`/`false`) | No |
| `length` | Property (not a method): number of elements | - |
| `push(x)` / `pop()` | Adds / removes an element at the **end** of the array | Yes |
| `unshift(x)` / `shift()` | Adds / removes an element at the **start** of the array | Yes |
| `slice(start, end)` | Copies a portion (`end` excluded) | No |
| `splice(index, n)` | Removes (and can insert) elements at a given index | Yes |
| `indexOf(value)` | Index of the first occurrence, `-1` if absent | No |
| `map(fn)` | New transformed array | No |
| `filter(fn)` | New filtered array | No |
| `forEach(fn)` | Runs an action per element, returns nothing | No |
| `some(fn)` / `every(fn)` | At least one / all elements satisfy the condition | No |
| `find(fn)` / `findIndex(fn)` | First element (or its index) that satisfies the condition | No |
| `reduce(fn, initial)` | Reduces the array to a single accumulated value | No |
| `join(separator)` | Concatenates the elements into a single string | No |
| `reverse()` | Reverses the order of the elements | Yes |
| `sort(fn)` | Sorts the elements (see the note below) | Yes |
| `concat(other)` | Combines several arrays into a new array | No |

```javascript
const arr = [1, 2, 3, 4, 5];

arr.includes(3);                     // true
arr.push(6);                         // arr becomes [1, 2, 3, 4, 5, 6]
arr.pop();                           // removes 6 and returns it, arr becomes [1, 2, 3, 4, 5] again
arr.slice(0, 2);                     // [1, 2], copy -> arr unchanged
arr.map(n => n * 2);                 // [2, 4, 6, 8, 10], copy -> arr unchanged
arr.filter(n => n > 2);              // [3, 4, 5]
arr.find(n => n > 2);                // 3, the first matching element
arr.reduce((acc, n) => acc + n, 0);  // 15, accumulator starting from 0
arr.join(', ');                      // '1, 2, 3, 4, 5'
```

> **Note:** by default, `sort()` sorts by converting elements to **strings** (which causes problems with numbers, e.g. `10` comes before `2`): supply a comparison function (`arr.sort((a, b) => a - b)`) to sort numbers correctly.

> **Pitfall:** confusing a method that mutates the original array (`push`, `splice`, `sort`, `reverse`) with one that returns a copy (`slice`, `map`, `filter`): `arr.sort()` silently changes `arr` itself, even though you sometimes expect a sorted copy.
>
> **Best practice:** check the "Mutates the original array?" column above before using an unfamiliar method; copy the array (`[...arr]` or `slice()`) before a mutating operation if the original must stay intact.

### Destructuring and spread

**Destructuring** lets you extract values from an array directly into variables, in the order of the elements.

```javascript
const arr = [1, 2, 3];
const [first, second] = arr; // first = 1, second = 2
```

**Spread** (`...`) lets you "unfold" an array, which is useful for copying it or merging several together.

```javascript
const copy = [...arr];        // independent copy of arr
const merged = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An array stores an ordered list of values, indexed from 0, that can mix any type. Some methods modify it directly, others return a transformed copy. |
| **Tools you can use** | `push`/`pop`/`shift`/`unshift`, `map`/`filter`/`reduce`, `find`/`findIndex`, `sort`, destructuring and spread (`...`). |
| **Pitfalls to avoid** | Confusing a method that mutates the original array (`sort`, `splice`, `reverse`) with one that returns a copy (`slice`, `map`, `filter`). |
| **Best practices** | Use `[...arr]` or `slice()` before a mutating operation if the original must stay intact; supply a comparison function to `sort()` to sort numbers correctly. |
