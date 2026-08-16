---
order: 13
---

# Les tables de hachage (hash tables)

Une **table de hachage** est une structure de données qui permet d'insérer, chercher et supprimer une valeur à partir d'une clé en temps quasi constant en moyenne (`O(1)`), là où une [liste chaînée](/?c=langages-de-programmation&s=c&p=listes-chainees) demanderait de parcourir tous les éléments un par un. Le principe : calculer une "adresse" numérique à partir de la clé, et stocker/retrouver la valeur directement à cet endroit dans un tableau.

## Le principe général

```text
clé -> fonction de hachage -> indice dans un tableau -> valeur stockée à cet indice
```

```text
"nom" -> hash("nom") = 193847 -> 193847 % taille_tableau = 3 -> valeur stockée en case 3
```

Plutôt que de chercher séquentiellement "est-ce que la clé est ici ? et ici ? et là ?", la table de hachage calcule directement **où** chercher.

## La fonction de hachage

Une **fonction de hachage** transforme une entrée de taille quelconque (une chaîne, une structure...) en un nombre de taille fixe, de façon déterministe : la même entrée produit toujours le même nombre, et idéalement, des entrées différentes produisent des nombres bien répartis (pour éviter que trop de clés ne tombent au même endroit).

```c
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

```c
unsigned long indice = hash_chaine(cle) % taille_tableau;
```

## Les collisions

Le nombre de clés possibles est infini (n'importe quelle chaîne), mais le tableau a une taille finie : deux clés différentes peuvent donc, tôt ou tard, produire le même indice. C'est une **collision**, gérée principalement de deux façons :

- **Chaînage** (*separate chaining*) : chaque case du tableau contient une [liste chaînée](/?c=langages-de-programmation&s=c&p=listes-chainees) de toutes les entrées qui ont abouti à cet indice.
- **Adressage ouvert** (*open addressing*) : en cas de collision, on cherche la prochaine case libre selon une règle fixe (ex. la case suivante), jusqu'à en trouver une.

## Implémentation par chaînage

```c
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

```c
void inserer(TableHachage *table, const char *cle, int valeur)
{
    unsigned long indice = hash_chaine(cle) % table->taille;

    Entree *nouvelle = malloc(sizeof(Entree));
    if (nouvelle == NULL) {
        return; // échec d'allocation (voir La gestion de la mémoire) : on renonce à l'insertion
    }
    nouvelle->cle = strdup(cle);
    nouvelle->valeur = valeur;
    nouvelle->suivant = table->cases[indice]; // insertion en tête de la liste de ce bucket
    table->cases[indice] = nouvelle;
}
```

### Recherche

```c
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

À indice égal, la recherche compare quand même la clé complète (`strcmp`) : l'indice ne fait que réduire la recherche à une petite liste (idéalement un seul élément), pas l'éliminer complètement.

## Facteur de charge et redimensionnement

Le **facteur de charge** (nombre d'entrées ÷ taille du tableau) mesure à quel point la table est pleine. S'il devient trop élevé (au-delà d'un seuil courant comme `0.75`), les listes de chaque case s'allongent, et les performances se dégradent vers du `O(n)` : dans le pire des cas (toutes les clés dans la même case), la table de hachage se comporte exactement comme une simple liste chaînée. Une bonne implémentation **redimensionne** alors le tableau (généralement en doublant sa taille) et réinsère toutes les entrées existantes ("rehash"), pour retrouver un facteur de charge raisonnable.

## Où les tables de hachage se cachent déjà autour de vous

- Les tableaux **associatifs** de [PHP](/?c=langages-de-programmation&s=php&p=php) (voir [Les variables](/?c=langages-de-programmation&s=php&p=variables)) sont, en interne, implémentés avec une structure très proche d'une table de hachage.
- Le modèle de stockage d'objets de [Git](/?c=git&p=git) (voir [L'architecture interne de Git](/?c=git&p=architecture-interne)) **est** directement une table de hachage : la clé de chaque objet est le hash SHA-1 de son contenu, et le sous-dossier `.git/objects/xx/` joue exactement le rôle d'une case (*bucket*).
- Les dictionnaires [Python](/?c=langages-de-programmation&s=python&p=python) (`dict`) reposent sur le même principe.

Comprendre les tables de hachage, c'est donc comprendre un mécanisme qui se répète silencieusement dans la quasi-totalité des langages et outils modernes.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une table de hachage calcule un indice à partir d'une clé (via une fonction de hachage) pour accéder directement à la valeur, en `O(1)` en moyenne. Une collision (deux clés, même indice) se gère par chaînage ou adressage ouvert. |
| **Outils utilisables** | Une fonction de hachage déterministe et bien répartie ; le redimensionnement ("rehash") quand le facteur de charge dépasse un seuil (souvent 0.75). |
| **Pièges à éviter** | Une fonction de hachage mal répartie qui concentre trop de clés sur peu d'indices : dégrade les performances vers `O(n)`. |
| **Bonnes pratiques** | Redimensionner et réinsérer toutes les entrées dès que le facteur de charge devient trop élevé, plutôt que de laisser les listes de chaque case s'allonger indéfiniment. |
