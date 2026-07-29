---
order: 5
---

# Dictionaries and Sets

The **dictionary** (`dict`) associates keys with values, just like an associative array in PHP. The set (`set`) stores unique values, in no particular order and without duplicates. Both structures are internally based on a **hash table** (see the dedicated chapter, section C)—this is what allows `dico["cle"]` or `"valeur" in ensemble` to be nearly instantaneous, even with a very large collection.

## Dictionaries

```python
personne = {"nom": "Dupont", "age": 25}

personne["nom"]          # "Dupont"
personne["email"] = "jean@exemple.com"  # add a new key
personne["age"] = 26      # modifies an existing key
del personne["age"]         # deletes a key

personne.get("telephone")           # None if the key does not exist (no error)
personne.get("telephone", "inconnu") # "unknown" -> default value if missing

"nom" in personne            # True -> checks for the presence of a KEY (not a value)
```

> **Note:** `personne["telephone"]` (direct access using square brackets) raises an `KeyError` if the key does not exist—unlike `.get()`, which returns `None` (or a specified default value) without ever crashing. Use `.get()` whenever the absence of the key is expected behavior, not an error.

### Browse a dictionary

```python
for cle in personne:
    print(cle)                      # scans only the keys

for cle, valeur in personne.items():
    print(f"{cle} : {valeur}")       # key concepts AND values together

for valeur in personne.values():
    print(valeur)                    # iterates only through the values
```

### Dictionary Comprehension

```python
carres = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

## 

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

> **Note:** A `set` automatically removes duplicates—`set([1, 2, 2, 3, 3, 3])` returns `{1, 2, 3}`. This is a very common way to quickly deduplicate a list in Python: `list(set(ma_liste))`.

### Overall Understanding

```python
carres_uniques = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 and 2**2 are both equal to 4, so they are automatically deduplicated
```

See also the chapter on hash tables (Section C) for details on what actually happens in memory behind `dict` and `set`.
