---
order: 13
---

# Binary Trees

A **binary tree** is a data structure in which each element (called **a node**) points to at most two other nodes: a **left** child and a **right** child. It is a generalization of a linked list (one node, a single “next” node) with two possible directions, which allows data to be organized hierarchically and searched efficiently.

## Declare a node

```c
typedef struct Noeud
{
    int value;
    struct Noeud *gauche;
    struct Noeud *droit;
} Noeud;
```

> **Note:** `struct Noeud *gauche` must reference `struct Noeud` (with the keyword `struct`), not just `Noeud`: at the time the compiler reads this line, `typedef Noeud` is not yet fully defined. This is a necessary exception specific to self-referential structures.

## The Binary Search Tree (BST)

A **binary search tree** enforces an ordering rule for each node: everything in the left subtree is **less than**, and everything in the right subtree is **greater than**. This rule allows an element to be found with a minimum number of comparisons.

```text
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Recursive insertion

```c
Noeud *inserer(Noeud *root, int value)
{
    if (root == NULL) {
        Noeud *nouveau = malloc(sizeof(Noeud));
        if (nouveau == NULL) {
            return NULL; // see the chapter on memory management: always check malloc
        }
        nouveau->value = value;
        nouveau->gauche = NULL;
        nouveau->droit  = NULL;
        return nouveau;
    }

    if (value < root->value) {
        root->gauche = inserer(root->gauche, value);
    } else if (value > root->value) {
        root->droit = inserer(root->droit, value);
    }
    // value == root->value: already present, do nothing

    return root;
}
```

- The base case for recursion is `root == NULL`: we have found the empty slot where to insert.
- Each recursive call returns the root of the subtree (whether modified or not), which is reassigned to `->gauche` or `->droit` by the caller: this is what connects the new node to the rest of the tree.

## Search

```c
Noeud *rechercher(Noeud *root, int value)
{
    if (root == NULL || root->value == value) {
        return root; // found, or NULL if the tree is empty/exhausted
    }

    if (value < root->value) {
        return rechercher(root->gauche, value);
    }
    return rechercher(root->droit, value);
}
```

At each step, the comparison eliminates **an entire subtree** from the search, which is what makes a balanced BST much faster than a linear traversal of a linked list.

## The Three Classic Traversals

Traversing a tree means visiting each of its nodes once. There are three possible orders, depending on when the current node is "processed" relative to its children:

```c
void parcoursInfixe(Noeud *root)   // left, node, right -> ascending order on a BST
{
    if (root == NULL) return;
    parcoursInfixe(root->gauche);
    printf("%d ", root->value);
    parcoursInfixe(root->droit);
}

void parcoursPrefixe(Noeud *root)  // node, left, right
{
    if (root == NULL) return;
    printf("%d ", root->value);
    parcoursPrefixe(root->gauche);
    parcoursPrefixe(root->droit);
}

void parcoursSuffixe(Noeud *root)  // left, right, node
{
    if (root == NULL) return;
    parcoursSuffixe(root->gauche);
    parcoursSuffixe(root->droit);
    printf("%d ", root->value);
}
```

In the example tree above, `parcoursInfixe` displays `2 5 7 10 15 20`: the values in ascending order, a feature unique to a BST.

## Free a Tree

As with a linked list, each node allocated with `malloc()` must be freed individually: a suffix traversal is naturally suited for this, since it processes the children before the node itself:

```c
void libererArbre(Noeud *root)
{
    if (root == NULL) return;
    libererArbre(root->gauche);
    libererArbre(root->droit);
    free(root);
}
```

See also [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) (self-referencing structures) and [Memory management](/?c=langages-de-programmation&s=c&p=memoire) (each `malloc` must have its own `free`).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A binary search tree (BST) enforces left subtree < node < right subtree, which allows a search to eliminate half of the candidates at each step. Three traversals (in-order, pre-order, post-order) visit nodes in different orders. |
| **Tools you can use** | Recursive insertion/search; in-order traversal to get a BST's values sorted. |
| **Pitfalls to avoid** | Forgetting to check each `malloc()` against `NULL` during insertion. |
| **Best practices** | Free a tree with a post-order traversal (children before the node itself), to never lose access to a subtree still to be freed. |
