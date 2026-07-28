---
title: Les tables de hachage (hash tables)
---

Une **table de hachage** est une structure de données qui permet d'insérer, chercher et supprimer une valeur à partir d'une clé en temps quasi constant en moyenne (`O(1)`), là où une liste chaînée (cf. chapitre dédié) demanderait de parcourir tous les éléments un par un. Le principe : calculer une "adresse" numérique à partir de la clé, et stocker/retrouver la valeur directement à cet endroit dans un tableau.

## Le principe général

```
clé -> fonction de hachage -> indice dans un tableau -> valeur stockée à cet indice
```

```
"nom" -> hash("nom") = 193847 -> 193847 % taille_tableau = 3 -> valeur stockée en case 3
```

Plutôt que de chercher séquentiellement "est-ce que la clé est ici ? et ici ? et là ?", la table de hachage calcule directement **où** chercher.

## La fonction de hachage

Une **fonction de hachage** transforme une entrée de taille quelconque (une chaîne, une structure...) en un nombre de taille fixe, de façon déterministe : la même entrée produit toujours le même nombre, et idéalement, des entrées différentes produisent des nombres bien répartis (pour éviter que trop de clés ne tombent au même endroit).

```
unsigned long hash_chaine(const char *chaine)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *chaine++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

Le nombre obtenu est ensuite ramené à la taille réelle du tableau par un modulo :

```
unsigned long indice = hash_chaine(cle) % taille_tableau;
```

## Les collisions

Le nombre de clés possibles est infini (n'importe quelle chaîne), mais le tableau a une taille finie — deux clés différentes peuvent donc, tôt ou tard, produire le même indice. C'est une **collision**, gérée principalement de deux façons :

- **Chaînage** (*separate chaining*) : chaque case du tableau contient une liste chaînée (cf. chapitre dédié) de toutes les entrées qui ont abouti à cet indice.
- **Adressage ouvert** (*open addressing*) : en cas de collision, on cherche la prochaine case libre selon une règle fixe (ex. la case suivante), jusqu'à en trouver une.

## Implémentation par chaînage

```
typedef struct Entree
{
    char *cle;
    int valeur;
    struct Entree *suivant; // plusieurs entrées peuvent partager le même indice
} Entree;

typedef struct TableHachage
{
    Entree **cases; // tableau de pointeurs vers des listes chaînées
    int taille;
} TableHachage;
```

### Insertion

```
void inserer(TableHachage *table, const char *cle, int valeur)
{
    unsigned long indice = hash_chaine(cle) % table->taille;

    Entree *nouvelle = malloc(sizeof(Entree));
    nouvelle->cle = strdup(cle);
    nouvelle->valeur = valeur;
    nouvelle->suivant = table->cases[indice]; // insertion en tête de la liste de ce bucket
    table->cases[indice] = nouvelle;
}
```

### Recherche

```
int rechercher(TableHachage *table, const char *cle, int *trouve)
{
    unsigned long indice = hash_chaine(cle) % table->taille;
    Entree *courant = table->cases[indice];

    while (courant != NULL) {
        if (strcmp(courant->cle, cle) == 0) {
            *trouve = 1;
            return courant->valeur;
        }
        courant = courant->suivant;
    }
    *trouve = 0;
    return 0;
}
```

À indice égal, la recherche compare quand même la clé complète (`strcmp`) — l'indice ne fait que réduire la recherche à une petite liste (idéalement un seul élément), pas l'éliminer complètement.

## Facteur de charge et redimensionnement

Le **facteur de charge** (nombre d'entrées ÷ taille du tableau) mesure à quel point la table est pleine. S'il devient trop élevé (au-delà d'un seuil courant comme `0.75`), les listes de chaque case s'allongent, et les performances se dégradent vers du `O(n)` — dans le pire des cas (toutes les clés dans la même case), la table de hachage se comporte exactement comme une simple liste chaînée. Une bonne implémentation **redimensionne** alors le tableau (généralement en doublant sa taille) et réinsère toutes les entrées existantes ("rehash"), pour retrouver un facteur de charge raisonnable.

## Où les tables de hachage se cachent déjà autour de vous

- Les tableaux **associatifs** de PHP (cf. chapitre sur les variables en PHP) sont, en interne, implémentés avec une structure très proche d'une table de hachage.
- Le modèle de stockage d'objets de Git (cf. chapitre sur l'architecture interne de Git) **est** directement une table de hachage : la clé de chaque objet est le hash SHA-1 de son contenu, et le sous-dossier `.git/objects/xx/` joue exactement le rôle d'une case (*bucket*).
- Les dictionnaires Python (`dict`) reposent sur le même principe.

Comprendre les tables de hachage, c'est donc comprendre un mécanisme qui se répète silencieusement dans la quasi-totalité des langages et outils modernes.
