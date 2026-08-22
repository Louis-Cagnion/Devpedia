---
order: 5
---

# Arrays

An array in JavaScript is a structure that allows you to store multiple values in a single variable, in the form of an ordered list. Each value can be accessed via its index, which always starts at 0.

It can be created in two different ways:
```javascript
    // literal, the most common
    const arr1 = [1, 2, 3];

    // with Array, the manufacturer
    const arr2 = new Array(1, 2, 3);

    // An array can contain different types, including other arrays or objects
    const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Painting Prototypes

Prototypes are functions built into the `array` object by default, allowing you to perform certain actions on the array (add, remove, transform, iterate over elements, etc.).

```javascript
    const arr = [1, 2, 3, 4, 5];
```

**`includes`** Checks whether a value is present in the array and returns `true` or `false`.
```javascript
    arr.includes(3); // true
```

**`length`** is not a function but a property: it returns the number of elements in the array.
```javascript
    arr.length; // 5
```

**`push`** and `**`pop`**` modify the array at the end: `push` adds an element, and `pop` removes the last element and returns it.
```javascript
    arr.push(6); // arr becomes [1, 2, 3, 4, 5, 6]
    arr.pop(); // removes 6 and returns it; arr becomes [1, 2, 3, 4, 5] again
```

**`unshift`** and **`shift`** do the same thing as `push` / `pop`, but at the beginning of the table.
```javascript
    arr.unshift(0); // arr becomes [0, 1, 2, 3, 4, 5]
    arr.shift(); // removes 0 and returns it; arr becomes [1, 2, 3, 4, 5] again
```

**`slice`** Returns a copy of a portion of the array, between a start index (inclusive) and an end index (exclusive), without modifying the original array.
```javascript
    arr.slice(0, 2); // [1, 2]
```

**`splice`** directly modifies the array: it removes a certain number of elements starting from a given index, and can also insert new elements in the same position.
```javascript
    arr.splice(1, 2); // Removes 2 elements starting at index 1; arr becomes [1, 4, 5]
```

**`indexOf`** Searches for a value in the array and returns its index. If the value does not exist, it returns `-1`.
```javascript
    arr.indexOf(3); // 2
```

**`map`** Creates a new array by applying a function to each element. The original array remains unchanged.
```javascript
    arr.map(n => n * 2); // [2, 4, 6, 8, 10]
```

**`filter`** Creates a new array containing only the elements that satisfy a condition (a function that returns `true` or `false`).
```javascript
    arr.filter(n => n > 2); // [3, 4, 5]
```

**`forEach`** Executes a function for each element in the array, but does not return anything. It is primarily used to perform an action (such as displaying something), not to transform data.
```javascript
    arr.forEach(n => console.log(n));
```

**`some`** Returns `true` if at least one element in the array satisfies a condition.
```javascript
    arr.some(n => n > 4); // true
```

**`every`** Returns `true` only if all elements in the array satisfy a condition.
```javascript
    arr.every(n => n > 0); // true
```

**`find`** Returns the first element that satisfies a condition, or `undefined` if no element matches.
```javascript
    arr.find(n => n > 2); // 3
```

**`findIndex`** Works like `find`, but returns the index of the element found (or `-1` if none is found).
```javascript
    arr.findIndex(n => n > 2); // 2
```

**`reduce`** iterates through the array to reduce it to a single value, accumulating a result at each step. The first parameter is the accumulation function; the second is the initial value of the accumulator.
```javascript
    arr.reduce((acc, n) => acc + n, 0); // 15
```

**`join`** Converts the array into a single string, separating each element with the character specified as a parameter.
```javascript
    arr.join(', '); // '1, 2, 3, 4, 5'
```

**`reverse`** reverses the order of the array elements and modifies the original array directly.
```javascript
    arr.reverse(); // [5, 4, 3, 2, 1]
```

**`sort`** Sorts the elements in the array. By default, sorting is performed by converting the elements to strings (which causes problems with numbers), so you must provide a comparison function to sort numbers correctly.
```javascript
    arr.sort((a, b) => a - b);
```

**`concat`** combines multiple arrays into a single new array, without modifying the original arrays.
```javascript
    arr.concat([6, 7]); // [1, 2, 3, 4, 5, 6, 7]
```

### Destructuring and Spread

**Destructuring** allows you to directly extract values from an array into variables, in the order of the elements.
```javascript
    const arr = [1, 2, 3];
    const [premier, deuxieme] = arr; // first = 1, second = 2
```

The `...` allows you to "expand" a table, which is useful for copying it or merging multiple tables together.
```javascript
    const copie = [...arr]; // independent copy of arr
    const fusion = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```
