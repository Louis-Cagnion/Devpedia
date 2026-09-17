---
order: 3
---

# Pile et file : LIFO et FIFO

Une **pile** (*stack*) et une **file** (*queue*) sont deux structures de données qui ajoutent une règle d'ordre à une [liste chaînée](/?c=langages-de-programmation&s=c&p=listes-chainees) ou à un tableau : elles n'autorisent l'accès qu'à une seule extrémité, jamais à un élément au milieu.

## La pile (Stack) : LIFO

Une pile n'expose que deux opérations sur son **sommet** (le dernier élément ajouté) :

- **empiler** (`push`) : ajouter un élément au sommet.
- **dépiler** (`pop`) : retirer et récupérer l'élément du sommet.

```text
empiler(1)   empiler(2)   empiler(3)   dépiler()
   [1]          [2]          [3]          [2]
                [1]          [2]          [1]
                             [1]
```

Le dernier élément empilé est toujours le premier dépilé : **LIFO** (*Last In, First Out*). Une pile d'assiettes illustre bien le principe : on ne peut retirer que celle du dessus.

Implémentée par-dessus une [liste chaînée](/?c=langages-de-programmation&s=c&p=listes-chainees), la tête de liste fait directement office de sommet : empiler/dépiler en tête y est déjà une opération en temps constant, aucune donnée n'a besoin d'être déplacée.

```c
typedef struct Maillon
{
    int valeur;
    struct Maillon *suivant;
} Maillon;

void empiler(Maillon **sommet, int valeur)
{
    Maillon *nouveau = malloc(sizeof(Maillon));

    if (nouveau == NULL)
        return;
    nouveau->valeur = valeur;
    nouveau->suivant = *sommet;   // pointe vers l'ancien sommet
    *sommet = nouveau;            // devient le nouveau sommet
}

int depiler(Maillon **sommet)
{
    Maillon *ancien = *sommet;
    int valeur = ancien->valeur;

    *sommet = ancien->suivant;    // le suivant devient le nouveau sommet
    free(ancien);
    return valeur;
}
```

## La file (Queue) : FIFO

Une file applique la règle inverse : le premier élément ajouté est le premier retiré, **FIFO** (*First In, First Out*), comme une file d'attente au sens propre. Elle expose **enfiler** (`enqueue`, ajouter à la fin) et **défiler** (`dequeue`, retirer depuis le début).

| | Pile (Stack) | File (Queue) |
|---|---|---|
| Règle | LIFO : dernier entré, premier sorti | FIFO : premier entré, premier sorti |
| Ajout | Au sommet | À la fin |
| Retrait | Au sommet | Au début |
| Exemple concret | Pile d'assiettes | File d'attente |

> **Piège :** implémenter une file par-dessus une liste chaînée simple (comme la pile ci-dessus) sans garder de pointeur vers le dernier maillon. Ajouter à la fin nécessite alors de reparcourir toute la liste à chaque `enqueue` (**O(n)**) plutôt qu'un temps constant.
>
> **Bonne pratique :** garder deux pointeurs à jour, un vers le premier maillon et un vers le dernier, pour que `enqueue`/`dequeue` restent tous les deux en **O(1)**.

Ces deux structures sont abstraites : rien n'impose de les implémenter par-dessus une liste chaînée. Un tableau dynamique fonctionne tout aussi bien pour une pile (ajouter/retirer à la fin du tableau) ; une file demande alors un peu plus de soin (retirer en tête décale sinon tous les éléments, sauf structure dédiée comme un tampon circulaire, hors du périmètre de ce chapitre).

Concept transversal, utilisé bien au-delà de ces deux structures : une pile d'appels de fonctions gère les appels récursifs, un historique "annuler/rétablir" (*undo/redo*) empile les actions, un analyseur syntaxique (*parser*) s'appuie souvent sur une pile pour gérer les parenthèses et blocs imbriqués.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une pile (LIFO) et une file (FIFO) restreignent l'accès à une seule extrémité d'une liste chaînée ou d'un tableau. La pile empile/dépile au sommet ; la file enfile à la fin et défile au début. |
| **Outils utilisables** | Une liste chaînée pour une pile en O(1) ; deux pointeurs (tête/queue) pour une file en O(1). |
| **Pièges à éviter** | Implémenter une file sans garder de pointeur vers le dernier maillon, ce qui rend `enqueue` en O(n) au lieu de O(1). |
| **Bonnes pratiques** | Choisir la pile ou la file selon l'ordre de traitement réellement voulu, jamais l'inverse en adaptant le code après coup. |
