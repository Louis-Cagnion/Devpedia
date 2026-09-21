---
order: 5
---

# Dictionaries and Sets

The **dictionary** (`dict`) associates keys with values, just like an associative array in [PHP](/?c=langages-de-programmation&s=php&p=php). The **set** (`set`) stores unique values, in no particular order and without duplicates. Both structures are internally based on a [hash table](/?c=langages-de-programmation&s=c&p=tables-de-hachage): this is what allows `dict["key"]` or `"value" in set` to be nearly instantaneous, even with a very large collection.

## Dictionaries

```python
person = {"name": "Dupont", "age": 25}

person["name"]                        # "Dupont"
person["email"] = "john@example.com"  # add a new key
person["age"] = 26                    # modifies an existing key
del person["age"]                     # deletes a key

person.get("phone")             # None if the key does not exist (no error)
person.get("phone", "unknown")  # "unknown" -> default value if missing

"name" in person  # True -> checks for the presence of a KEY (not a value)
```

> **Note:** `person["phone"]` (direct access using square brackets) raises an `KeyError` if the key does not exist; unlike `.get()`, which returns `None` (or a specified default value) without ever crashing. Use `.get()` whenever the absence of the key is expected behavior, not an error.

### Why a dict key must be hashable

```python
cache = {}
cache[("site_a", 42)] = "shop A"  # a TUPLE as key: works, a tuple is immutable so hashable

# TypeError: unhashable type: 'list' -> a list is mutable, never hashable
cache[["site_a", 42]] = "shop A"
```

A dictionary key must be **hashable** (a fixed number, computed once and for all, that lets it be located instantly in the underlying hash table): it must therefore be **immutable** (`str`, a number, `tuple`), never `list`/`dict`, which can change content afterward and would invalidate that number. A `tuple` of several values commonly serves as a **composite key**: `(site, id)` distinguishes two entries that would share the same `id` on two different sites, something neither value alone could do.

### Browse a dictionary

```python
for key in person:
    print(key)                      # scans only the keys

for key, value in person.items():
    print(f"{key} : {value}")       # key concepts AND values together

for value in person.values():
    print(value)                    # iterates only through the values
```

### Dictionary Comprehension

```python
squares = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

### `setdefault()`: building a dict of lists in one line

```python
shops_by_site = {}

for site, shop_id in pairs:
    if site not in shops_by_site:  # without setdefault: this manual check is needed...
        shops_by_site[site] = []
    shops_by_site[site].append(shop_id)

# equivalent in a single line:
shops_by_site.setdefault(site, []).append(shop_id)
```

`dict.setdefault(key, default)` returns the value of `key` if it already exists (without touching it), or inserts it with `default` AND THEN returns it if it doesn't exist yet. Chained with `.append()`, this pattern groups elements by category (here, the list of shops per site) without ever explicitly testing whether the key already exists.

### `Counter`: Counting Occurrences

```python
from collections import Counter

counter = Counter(["a", "b", "a", "c", "a", "b"])
# Counter({'a': 3, 'b': 2, 'c': 1})

counter["a"]       # 3
counter["absent"]  # 0 -> no KeyError, unlike a regular dict

counter.most_common(2)  # [('a', 3), ('b', 2)] -> the 2 most frequent elements
```

`Counter` (from the `collections` module) is a `dict` subclass specialized in counting: `Counter(iterable)` automatically counts the occurrences of each element. Accessing a missing key returns `0` instead of raising a `KeyError`, unlike a regular `dict`. `.most_common(n)` returns the `n` most frequent elements, sorted by decreasing frequency.

## Sets (`set`)

```python
fruits = {"apple", "banana", "cherry"}

fruits.add("kiwi")       # add an item
fruits.remove("banana")  # removes an element (returns an error if none exists)
fruits.discard("mango")  # removes an element, WITHOUT an error if it is absent

"apple" in fruits  # True -> nearly instantaneous membership test (hash table)
```

### Set Operations

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b   # {1, 2, 3, 4} -> union
a & b   # {2, 3}       -> intersection
a - b   # {1}           -> difference (in a, not in b)
a ^ b   # {1, 4}        -> symmetric difference (in one OR the other, but not both)
```

> **Note:** A `set` automatically removes duplicates: `set([1, 2, 2, 3, 3, 3])` returns `{1, 2, 3}`. This is a very common way to quickly deduplicate a list in Python: `list(set(my_list))`.

### Set Comprehension

```python
unique_squares = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 and 2**2 are both equal to 4, so they are automatically deduplicated
```

### `frozenset`: the immutable variant of `set`

```python
frozen = frozenset({"apple", "banana"})

frozen.add("cherry")  # AttributeError: 'frozenset' object has no attribute 'add'
```

A `frozenset` is a `set` frozen after creation: no modifying method (`add`, `remove`, `discard`) exists on it. This immutability makes it **hashable**, like a tuple (see [why a dict key must be hashable](#why-a-dict-key-must-be-hashable) above) -- something a mutable `set` never allows:

```python
cache = {}
cache[frozenset({"a", "b"})] = "result"  # works: a frozenset is hashable

cache[{"a", "b"}] = "result"  # TypeError: unhashable type: 'set'
```

> **Best practice:** use `frozenset` instead of `set` for a value meant to serve as a dict key or an element of another `set`, or to document/guarantee that a function will never modify the set it receives as a parameter.

See also [Hash Tables](/?c=langages-de-programmation&s=c&p=tables-de-hachage) for what actually happens in memory behind `dict` and `set`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A `dict` maps keys to values, a `set` stores unique values with no order; both rely on a hash table, so they're near-instant for access/membership testing. `frozenset` is the immutable, hashable variant of a `set`. |
| **Tools you can use** | `.get()` (no error), dict/set comprehensions, `Counter` to count occurrences, set operations (`\|`, `&`, `-`, `^`), `frozenset` as a dict key or element of another `set`. |
| **Pitfalls to avoid** | Accessing a missing key with brackets (`dict["x"]`) rather than `.get()`: this raises a `KeyError`. |
| **Best practices** | Use `.get()` as soon as a missing key is a normal case, not an error; `list(set(my_list))` for a quick deduplication. |
