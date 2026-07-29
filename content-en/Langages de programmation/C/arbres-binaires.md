---
order: 12
---

# Binary Trees

A **binary tree** is a data structure in which each element (called **a node**) points to at most two other nodes: a **left** child and a **right** child. It is a generalization of a linked list (one node, a single “next” node) with two possible directions, which allows data to be organized hierarchically and searched efficiently.

## Declare a node

```
typedef struct Noeud
{
    int valeur;
    struct Noeud *gauche;
    struct Noeud *droit;
} Noeud;
```

> **Note:** `struct Noeud *gauche` must reference `struct Noeud` (with the keyword `struct`), not just `Noeud`—at the time the compiler reads this line, `typedef Noeud` is not yet fully defined. This is a necessary exception specific to self-referential structures.

## The Binary Search Tree (BST)

A** binary search*** ***tree** enforces an ordering rule for each node: everything in the left subtree is **less than**, and everything in the right subtree is **greater than**. This rule allows an element to be found with a minimum number of comparisons.

```
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Recursive insertion

```
Noeud *inserer(Noeud *racine, int valeur)
{
    if (racine == NULL) {
        Noeud *nouveau = malloc(sizeof(Noeud));
        if (nouveau == NULL) {
            return NULL; // cf. chapitre sur la gestion de la mémoire : toujours vérifier malloc
        }
        nouveau->valeur = valeur;
        nouveau->gauche = NULL;
        nouveau->droit  = NULL;
        return nouveau;
    }

    if (valeur < racine->valeur) {
        racine->gauche = inserer(racine->gauche, valeur);
    } else if (valeur > racine->valeur) {
        racine->droit = inserer(racine->droit, valeur);
    }
    // valeur == racine->valeur : déjà présente, on ne fait rien

    return racine;
}
```

- The base case for recursion is`racine == NULL`: we have found the empty slot where to insert.
- Each recursive call returns the root of the subtree (whether modified or not), which is reassigned to `->gauche` or `->droit` by the caller—this is what connects the new node to the rest of the tree.

## Search

```
Noeud *rechercher(Noeud *racine, int valeur)
{
    if (racine == NULL || racine->valeur == valeur) {
        return racine; // trouvé, ou NULL si l'arbre est vide/épuisé
    }

    if (valeur < racine->valeur) {
        return rechercher(racine->gauche, valeur);
    }
    return rechercher(racine->droit, valeur);
}
```

At each step, the comparison eliminates **an entire subtree** from the search—which is what makes a balanced B-tree much faster than a linear traversal of a linked list.

## The Three Classic Routes

Traversing a tree means visiting each of its nodes once. There are three possible orders, depending on when the current node is "processed" relative to its children:

```
void parcoursInfixe(Noeud *racine)   // gauche, nœud, droit -> ordre croissant sur un ABR
{
    if (racine == NULL) return;
    parcoursInfixe(racine->gauche);
    printf("%d ", racine->valeur);
    parcoursInfixe(racine->droit);
}

void parcoursPrefixe(Noeud *racine)  // nœud, gauche, droit
{
    if (racine == NULL) return;
    printf("%d ", racine->valeur);
    parcoursPrefixe(racine->gauche);
    parcoursPrefixe(racine->droit);
}

void parcoursSuffixe(Noeud *racine)  // gauche, droit, nœud
{
    if (racine == NULL) return;
    parcoursSuffixe(racine->gauche);
    parcoursSuffixe(racine->droit);
    printf("%d ", racine->valeur);
}
```

In the example tree above, `parcoursInfixe` displays `2 5 7 10 15 20`—the values in ascending order, a feature unique to ABR.

## Free a Tree

As with a linked list, each node allocated with `malloc()` must be freed individually—a suffix traversal is naturally suited for this, since it processes the children before the node itself:

```
void libererArbre(Noeud *racine)
{
    if (racine == NULL) return;
    libererArbre(racine->gauche);
    libererArbre(racine->droit);
    free(racine);
}
```

See also the chapter on pointers (self-referencing structures) and on memory management (each `malloc` must have its own `free`).
