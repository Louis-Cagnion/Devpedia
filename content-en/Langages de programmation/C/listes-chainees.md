---
order: 12
---

# Linked Lists

A **linked list** is a data structure in which each element (a **link**, or *node*) contains a value and a pointer to the next element. Unlike an array, its elements are not stored contiguously in memory: this is what makes it possible to add or remove an element without having to move all the others.

## Report a link

```c
typedef struct Maillon
{
    int value;
    struct Maillon *suivant;
} Maillon;
```

As with [a binary tree](/?c=langages-de-programmation&s=c&p=arbres-binaires), `struct Maillon *suivant` must reference `struct Maillon` and not just `Maillon`: at the time this line is read, `typedef` has not yet been fully defined.

## Creating and Linking Chains

```c
Maillon *premier = malloc(sizeof(Maillon));   // check against NULL in practice (see memory management)
premier->value = 10;

Maillon *second = malloc(sizeof(Maillon));
second->value = 20;

premier->suivant = second; // chains the first to the second
second->suivant = NULL;    // NULL marks the end of the list
```

```text
premier -> second -> NULL
  10         20
```

## Browse the list

```c
void afficher(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        printf("%d\n", courant->value);
        courant = courant->suivant;
    }
}
```

> **Note:** `courant` is a **copy** of the pointer `tete`: moving `courant = courant->suivant` does not modify `tete`, which continues to point to the first element of the list. That is why we always use a separate "working" pointer to traverse a list, never the head itself.

## Insert at the top of the list

```c
Maillon *insererEnTete(Maillon *tete, int value)
{
    Maillon *nouveau = malloc(sizeof(Maillon));
    if (nouveau == NULL) {
        return tete; // allocation failure: return the unchanged list rather than crash
    }
    nouveau->value = value;
    nouveau->suivant = tete; // the new link points to the former head
    return nouveau;          // becomes the new head
}

// usage:
tete = insererEnTete(tete, 5);
```

Inserting at the beginning is a constant-time operation (no other links are moved), unlike an array, where inserting at the beginning requires shifting all existing elements.

## Clear the list

Each link allocated with `malloc()` must be freed individually: freeing `tete` directly without retaining a reference to the rest would result in the loss of access to all subsequent links (memory leak; see [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)):

```c
void libererListe(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        Maillon *suivant = courant->suivant; // save the next link BEFORE freeing courant
        free(courant);
        courant = suivant;
    }
}
```

> **Note:** The order matters here: calling `free(courant)` and then reading `courant->suivant` would result in a **use-after-free** (see [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)): the value of the pointer `suivant` must be retrieved before the link containing it is freed.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A linked list connects links scattered across memory via a "next" pointer; unlike an array, inserting at the head is constant time, but accessing by index requires a full traversal. |
| **Tools you can use** | A self-referential `struct` (`struct Maillon *suivant`), `malloc`/`free` per link. |
| **Pitfalls to avoid** | Freeing a link before saving its `suivant` pointer (use-after-free); forgetting to free each link individually (memory leak). |
| **Best practices** | Always save `courant->suivant` before `free(courant)`; check every `malloc()` against `NULL` before using it. |

## Linked List vs. Array

| | Array | Linked list |
|---|---|---|
| Accessing an element by index | Immediate (`tab[i]`) | Must traverse from the beginning |
| Insert at the beginning/middle | Offset all subsequent elements | Constant time, no displacement |
| Memory | Contiguous | Fragmented, one "`malloc`" per link |
| Size | Fixed (static table) or resizable (`realloc`) | Grows naturally, one link at a time |
