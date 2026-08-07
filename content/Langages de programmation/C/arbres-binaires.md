---
order: 12
---

# Les arbres binaires

Un **arbre binaire** est une structure de données où chaque élément (appelé **nœud**) pointe vers au maximum deux autres nœuds : un enfant **gauche** et un enfant **droit**. C'est une généralisation d'une liste chaînée (un nœud, un seul "suivant") à deux directions possibles, ce qui permet d'organiser des données de façon hiérarchique et de les rechercher efficacement.

## Déclarer un nœud

```
typedef struct Noeud
{
    int valeur;
    struct Noeud *gauche;
    struct Noeud *droit;
} Noeud;
```

> **Note :** `struct Noeud *gauche` doit référencer `struct Noeud` (avec le mot-clé `struct`), pas `Noeud` seul — au moment où le compilateur lit cette ligne, le `typedef Noeud` n'est pas encore complètement défini. C'est une exception nécessaire, propre aux structures auto-référentielles.

## L'arbre binaire de recherche (ABR)

Un **arbre binaire de recherche** (*Binary Search Tree*) impose une règle d'ordre à chaque nœud : tout ce qui est dans le sous-arbre gauche est **inférieur**, tout ce qui est dans le sous-arbre droit est **supérieur**. Cette règle permet de retrouver un élément en un minimum de comparaisons.

```
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Insertion récursive

```
Noeud *inserer(Noeud *racine, int valeur)
{
    if (racine == NULL) {
        Noeud *nouveau = malloc(sizeof(Noeud));
        if (nouveau == NULL) {
            return NULL; // voir La gestion de la mémoire : toujours vérifier malloc
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

- Le cas de base de la récursion est `racine == NULL` : on a trouvé l'emplacement vide où insérer.
- Chaque appel récursif renvoie la racine du sous-arbre (modifié ou non), qui est réaffectée à `->gauche` ou `->droit` par l'appelant — c'est ce qui relie le nouveau nœud au reste de l'arbre.

## Recherche

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

À chaque étape, la comparaison élimine **tout un sous-arbre** de la recherche — c'est ce qui rend un ABR équilibré bien plus rapide qu'un parcours linéaire d'une liste chaînée.

## Les trois parcours classiques

Parcourir un arbre signifie visiter chacun de ses nœuds une fois. Trois ordres sont possibles selon le moment où l'on "traite" le nœud courant par rapport à ses enfants :

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

Sur l'arbre exemple ci-dessus, `parcoursInfixe` affiche `2 5 7 10 15 20` — les valeurs dans l'ordre croissant, une propriété propre à l'ABR.

## Libérer un arbre

Comme pour une liste chaînée, chaque nœud alloué avec `malloc()` doit être libéré individuellement — un parcours suffixe s'y prête naturellement, puisqu'il traite les enfants avant le nœud lui-même :

```
void libererArbre(Noeud *racine)
{
    if (racine == NULL) return;
    libererArbre(racine->gauche);
    libererArbre(racine->droit);
    free(racine);
}
```

Voir aussi [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs) (structures auto-référentielles) et [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) (chaque `malloc` doit avoir son `free`).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un arbre binaire de recherche (ABR) impose sous-arbre gauche < nœud < sous-arbre droit, ce qui permet une recherche en éliminant la moitié des candidats à chaque étape. Trois parcours (infixe, préfixe, suffixe) visitent les nœuds dans des ordres différents. |
| **Outils utilisables** | Insertion/recherche récursives ; parcours infixe pour obtenir les valeurs triées d'un ABR. |
| **Pièges à éviter** | Oublier de vérifier chaque `malloc()` contre `NULL` lors de l'insertion. |
| **Bonnes pratiques** | Libérer un arbre par parcours suffixe (enfants avant le nœud lui-même), pour ne jamais perdre l'accès à un sous-arbre encore à libérer. |
