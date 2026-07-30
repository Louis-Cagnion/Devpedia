---
order: 11
---

# Linked Lists

A **linked list** is a data structure in which each element (a **link**, or *node*) contains a value and a pointer to the next element. Unlike an array, its elements are not stored contiguously in memory—this is what makes it possible to add or remove an element without having to move all the others.

## Report a link

```c
typedef struct Maillon
{
    int value;
    struct Maillon *suivant;
} Maillon;
```

As with a binary tree (see the relevant chapter), `struct Maillon *suivant` must reference `struct Maillon` and not just `Maillon`: at the time this line is read, `typedef` has not yet been fully defined.

## Creating and Linking Chains

```c
Maillon *premier = malloc(sizeof(Maillon));   // à vérifier contre NULL en pratique (cf. chapitre mémoire)
premier->value = 10;

Maillon *second = malloc(sizeof(Maillon));
second->value = 20;

premier->suivant = second; // chaîne le premier vers le second
second->suivant = NULL;    // NULL marque la fin de la liste
```

```
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

> **Note:** `courant` is a **copy** of the pointer `tete` — moving `courant = courant->suivant` does not modify `tete`, which continues to point to the first element of the list. That is why we always use a separate "working" pointer to traverse a list, never the head itself.

## Insert at the top of the list

```c
Maillon *insererEnTete(Maillon *tete, int value)
{
    Maillon *nouveau = malloc(sizeof(Maillon));
    if (nouveau == NULL) {
        return tete; // échec d'allocation : renvoyer la liste inchangée plutôt que planter
    }
    nouveau->value = value;
    nouveau->suivant = tete; // le nouveau maillon pointe vers l'ancienne tête
    return nouveau;          // devient la nouvelle tête
}

// utilisation :
tete = insererEnTete(tete, 5);
```

Inserting at the beginning is a constant-time operation (no other links are moved)—unlike an array, where inserting at the beginning requires shifting all existing elements.

## Clear the list

Each link allocated with `malloc()` must be freed individually—freeing `tete` directly without retaining a reference to the rest would result in the loss of access to all subsequent links (memory leak; see the chapter on memory management):

```c
void libererListe(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        Maillon *suivant = courant->suivant; // sauvegarder le suivant AVANT de libérer courant
        free(courant);
        courant = suivant;
    }
}
```

> **Note:** The order matters here: calling `free(courant)` and then reading `courant->suivant` would result in a **use-after-free** (see the chapter on memory management)—the value of the pointer `suivant` must be retrieved before the link containing it is freed.

## Linked List vs. Array

| | Array | Linked list |
|---|---|---|
| Accessing an element by index | `tab[i]` | Must traverse from the beginning |
| Insert at the beginning/middle | Offset all subsequent elements | Constant time, no displacement |
| Memory | Contiguous | Fragmented, one "`malloc`" per link |
| Size | Fixed (static table) or resizable (`realloc`) | Grows naturally, one link at a time |
