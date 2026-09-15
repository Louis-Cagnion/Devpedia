---
order: 7
---

# Objects

An object in JavaScript is a structure that lets you store data as key/value pairs. Unlike an array, order isn't what matters: a value is accessed via its name (the key), not via a numeric index.

It can be created in 2 different ways:

```javascript
// literal, the most common
const obj1 = { name: 'John', age: 25 };

// with the Object constructor
const obj2 = new Object();
obj2.name = 'John';

// a value can be of any type, including a function or another object
const obj3 = {
    name: 'John',
    address: { city: 'Paris', zip: 75000 },
    sayHello: function () { console.log('hello'); }
};
```

### Accessing and modifying properties

There are 2 ways to access a property of an object: dot notation, and bracket notation (useful when the key name is dynamic or contains special characters).

```javascript
const obj = { name: 'John', age: 25 };

obj.name;     // 'John'
obj['name'];  // 'John', equivalent to obj.name

obj.city = 'Paris';   // adding a property
obj.age = 26;         // modifying a property

delete obj.age;                // removing a property
```

### Object's static methods

Unlike string or array prototypes, these functions aren't used directly on the object but on `Object`, passing the object as a parameter:

| Method | Effect |
|---|---|
| `Object.keys(obj)` | Array containing only the keys |
| `Object.values(obj)` | Array containing only the values |
| `Object.entries(obj)` | Array of `[key, value]` pairs, useful for iterating with a loop or `forEach` |
| `Object.assign(target, ...sources)` | Copies the source objects' properties into the target object, returns the target; often used to merge or copy |
| `Object.freeze(obj)` | Prevents any modification (add, remove, change): silently ignored, or an error in strict mode |
| `Object.fromEntries(pairs)` | Reverse of `Object.entries`: turns an array of `[key, value]` pairs into an object |

```javascript
const obj = { name: 'John', age: 25 };

Object.keys(obj);     // ['name', 'age']
Object.values(obj);   // ['John', 25]
Object.entries(obj);  // [['name', 'John'], ['age', 25]]

const copy = Object.assign({}, obj);                       // copy of obj
const merged = Object.assign({}, obj, { city: 'Paris' });  // { name: 'John', age: 25, city: 'Paris' }

Object.freeze(obj);
obj.age = 30;                    // has no effect, obj.age stays 25

Object.fromEntries([['name', 'John'], ['age', 25]]); // { name: 'John', age: 25 }
```

### Checking a property

```javascript
const obj = { name: 'John', age: 25 };

obj.hasOwnProperty('name');     // true -> key present on the object itself
obj.hasOwnProperty('unknown');  // false

'name' in obj;                     // true -> also tests inherited properties, unlike hasOwnProperty
```

`hasOwnProperty` is a prototype available directly on an object; `in` also checks whether a key exists, but including inherited properties.

### Destructuring and spread

**Destructuring** lets you extract certain properties of an object directly into variables, using the key names.

```javascript
const obj = { name: 'John', age: 25 };
const { name, age } = obj;   // name = 'John', age = 25

const { name: firstName } = obj; // renames the variable during destructuring -> firstName = 'John'
```

**Spread** (`...`) lets you "unfold" an object, which is useful for copying it or merging several together.

```javascript
const copy = { ...obj };                    // independent copy of obj
const merged = { ...obj, city: 'Paris' };  // { name: 'John', age: 25, city: 'Paris' }
```

> **Pitfall:** `{ ...obj }` and `Object.assign({}, obj)` only make a **shallow copy**: if a property is itself an object or an array, the copy and the original keep sharing the **same** reference to that nested object: modifying it from one modifies it from the other too.
>
> **Best practice:** for a truly independent copy of an object with nested properties, use `structuredClone(obj)` (native, modern) or manually rebuild the nested levels.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An object stores key/value pairs, accessible via dot or bracket notation. `Object.keys`/`values`/`entries` expose its contents; spread and destructuring copy or extract properties. |
| **Tools you can use** | `Object.keys`/`values`/`entries`/`assign`/`freeze`/`fromEntries`, `hasOwnProperty`, the `in` operator. |
| **Pitfalls to avoid** | Believing that a spread or `Object.assign` copy is deep: it isn't, for nested properties. |
| **Best practices** | Use `structuredClone()` for a truly independent copy of a nested object; `Object.freeze()` to prevent any accidental modification of an object meant to stay constant. |
