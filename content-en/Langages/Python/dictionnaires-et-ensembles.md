---
order: 5
---

# Dictionaries and Sets

The **dictionary** (`dict`) associates keys with values, just like an associative array in [PHP](/?c=langages-de-programmation&s=php&p=php). The set (`set`) stores unique values, in no particular order and without duplicates. Both structures are internally based on a **hash table** (see the dedicated chapter, section C): this is what allows `dico["key"]` or `"value" in ensemble` to be nearly instantaneous, even with a very large collection.

## Dictionaries

```python
person = {"nom": "Dupont", "age": 25}

person["nom"]          # "Dupont"
person["email"] = "jean@exemple.com"  # add a new key
person["age"] = 26      # modifies an existing key
del person["age"]         # deletes a key

person.get("telephone")           # None if the key does not exist (no error)
person.get("telephone", "inconnu") # "unknown" -> default value if missing

"nom" in person            # True -> checks for the presence of a KEY (not a value)
```

> **Note:** `person["telephone"]` (direct access using square brackets) raises an `KeyError` if the key does not exist; unlike `.get()`, which returns `None` (or a specified default value) without ever crashing. Use `.get()` whenever the absence of the key is expected behavior, not an error.

### Why a dict key must be hashable

```python
cache = {}
cache[("site_a", 42)] = "shop A"  # a TUPLE as key: works, a tuple is immutable so hashable

cache[["site_a", 42]] = "shop A"  # TypeError: unhashable type: 'list' -> a list is mutable, never hashable
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
carres = {x: x ** 2 for x in range(5)}
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

## Sets (`set`)

```python
fruits = {"pomme", "banane", "cerise"}

fruits.add("kiwi")        # add an item
fruits.remove("banane")    # removes an element (returns an error if none exists)
fruits.discard("mangue")    # removes an element, WITHOUT an error if it is absent

"pomme" in fruits   # True -> nearly instantaneous membership test (hash table)
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

> **Note:** A `set` automatically removes duplicates: `set([1, 2, 2, 3, 3, 3])` returns `{1, 2, 3}`. This is a very common way to quickly deduplicate a list in Python: `list(set(ma_liste))`.

### Overall Understanding

```python
carres_uniques = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 and 2**2 are both equal to 4, so they are automatically deduplicated
```

See also the chapter on hash tables (Section C) for details on what actually happens in memory behind `dict` and `set`.
