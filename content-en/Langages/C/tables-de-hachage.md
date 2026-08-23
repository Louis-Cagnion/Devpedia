---
order: 14
---

# Hash Tables

A **hash table** is a data structure that allows you to insert, search for, and delete a value based on a key in `O(1)`, whereas a [linked list](/?c=langages-de-programmation&s=c&p=listes-chainees) would require traversing all elements one by one. The principle: calculate a numerical “address” based on the key, and store or retrieve the value directly at that location in an array.

## The General Principle

```text
key -> hash function -> index in an array -> value stored at that index
```

```text
"name" -> hash("name") = 193847 -> 193847 % taille_tableau = 3 -> value stored in slot 3
```

Rather than checking sequentially: "Is the key here? And here? And there?", the hash table calculates directly **where** to look.

## The Hash Function

A **hash function** transforms an input of any size (a string, a structure, etc.) into a number of fixed size, in a deterministic manner: the same input always produces the same number, and ideally, different inputs produce numbers that are well-distributed (to prevent too many keys from ending up in the same place).

```c
unsigned long hash_chaine(const char *string)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *string++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

The resulting number is then scaled to the actual size of the array using a modulo operation:

```c
unsigned long index = hash_chaine(key) % taille_tableau;
```

## Collisions

The number of possible keys is infinite (any string), but the array has a finite size: so two different keys may, sooner or later, produce the same index. This is called a **collision**, which is handled primarily in two ways:

- **Chaining** (*separate chaining*): each array slot contains a [linked list](/?c=langages-de-programmation&s=c&p=listes-chainees) of all the entries that led to that index.
- **Open addressing**: in the event of a collision, the next available slot is selected according to a fixed rule (e.g., the next slot) until one is found.

## Implementation via chaining

```c
typedef struct Entry
{
    char *key;
    int value;
    struct Entry *suivant; // several entries can share the same index
} Entry;

typedef struct TableHachage
{
    Entry **cases; // array of pointers to linked lists
    int taille;
} TableHachage;
```

### Insertion

```c
void inserer(TableHachage *table, const char *key, int value)
{
    unsigned long index = hash_chaine(key) % table->taille;

    Entry *nouvelle = malloc(sizeof(Entry));
    if (nouvelle == NULL) {
        return; // allocation failed (see memory management): giving up on the insertion
    }
    nouvelle->key = strdup(key);
    nouvelle->value = value;
    nouvelle->suivant = table->cases[index]; // inserted at the head of this bucket's list
    table->cases[index] = nouvelle;
}
```

### Search

```c
int rechercher(TableHachage *table, const char *key, int *trouve)
{
    unsigned long index = hash_chaine(key) % table->taille;
    Entry *courant = table->cases[index];

    while (courant != NULL) {
        if (strcmp(courant->key, key) == 0) {
            *trouve = 1;
            return courant->value;
        }
        courant = courant->suivant;
    }
    *trouve = 0;
    return 0;
}
```

Even with an equal index, the search still compares the entire key (`strcmp`): the index merely narrows the search down to a small list (ideally a single element), not eliminating it entirely.

## Load factor and resizing

The **load factor** (number of entries ÷ array size) measures how full the table is. If it becomes too high (beyond a common threshold such as `0.75`), the lists in each bucket grow longer, and performance degrades to `O(n)`: in the worst case (all keys in the same bucket), the hash table behaves exactly like a simple linked list. A good implementation then **resizes** the array (usually by doubling its size) and re-inserts all existing entries (“rehash”) to restore a reasonable load factor.

## Where Hash Tables Are Already Hiding All Around You

- [PHP](/?c=langages-de-programmation&s=php&p=php) **associative** arrays (see [PHP variables](/?c=langages-de-programmation&s=php&p=variables)) are internally implemented using a structure very similar to a hash table.
- [Git](/?c=git&p=git)'s object storage model (see [Git's internal architecture](/?c=git&p=architecture-interne)) **is** essentially a hash table: the key for each object is the SHA-1 hash of its content, and the subdirectory `.git/objects/xx/` acts exactly like a bucket.
- [Python](/?c=langages-de-programmation&s=python&p=python) dictionaries (`dict`) are based on the same principle.

Understanding hash tables, therefore, means understanding a mechanism that operates silently in virtually all modern languages and tools.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A hash table computes an index from a key (via a hash function) to access the value directly, in `O(1)` on average. A collision (two keys, same index) is handled via chaining or open addressing. |
| **Available Tools** | A deterministic, well-distributed hash function; resizing ("rehash") when the load factor exceeds a threshold (often 0.75). |
| **Pitfalls to Avoid** | A poorly distributed hash function that concentrates too many keys on too few indices: degrades performance toward `O(n)`. |
| **Best Practices** | Resize and re-insert all entries as soon as the load factor becomes too high, rather than letting each bucket's list grow indefinitely. |
