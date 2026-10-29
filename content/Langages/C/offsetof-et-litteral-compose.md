---
order: 31
---

# Piloter des champs par leur décalage (offsetof) et le littéral composé

Une **structure** (`struct`) regroupe plusieurs valeurs sous un seul nom ; chaque valeur y occupe une case nommée, un **champ** (voir [les structures](/?c=langages&s=c&p=variables#les-structures-struct)). Ce chapitre répond à deux questions qui se posent dès qu'on remplit une structure à partir d'un fichier de réglages. Comment éviter une longue chaîne de `if`, une branche par champ ? En rangeant dans un **tableau** (une suite de cases de même type) la description de chaque champ, dont sa **position en octets** dans la structure : c'est le rôle d'`offsetof`. Et comment fabriquer une structure sur place, sans variable intermédiaire, pour la passer à une fonction ? Avec le **littéral composé** de C99 (la révision de 1999 du langage C), `(Type){valeurs}`.

Il suppose connus [les pointeurs](/?c=langages&s=c&p=pointeurs) (l'adresse d'une valeur en mémoire et le déréférencement `*`), [les boucles](/?c=langages&s=c&p=boucles) et [les conditions](/?c=langages&s=c&p=conditions). L'**octet** (8 bits) est l'unité de mémoire : chaque octet a sa propre adresse (voir [l'organisation des données en mémoire](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Tous les programmes ont été compilés avec `gcc -std=c11 -Wall -Wextra` sous Linux (voir [le processus de compilation](/?c=langages&s=c&p=compilation)), puis exécutés ; ceux qui utilisent le littéral composé l'ont aussi été avec `-std=c99`, avec le même résultat.

## Le problème : ranger des lignes « nom valeur » dans une structure

Un programme lit un fichier de réglages. Chaque ligne est une **directive** : un nom, un espace, une valeur (`vitesse 2.5`). Le programme doit ranger chaque valeur dans le bon champ d'une structure `Reglages`, en la gardant entre une borne minimale et une borne maximale. La version la plus directe est une chaîne de `if` :

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    float vitesse;                      // vitesse de déplacement, de 0 à 10
    float gravite;                      // intensité de la gravité, de 0 à 20
    int   taille;                       // taille en cases, de 1 à 50
} Reglages;

// Range la valeur v dans le champ qui porte le nom donné. Renvoie 0, ou -1 si inconnu.
static int appliquer(Reglages *r, const char *nom, double v)
{
    if (strcmp(nom, "vitesse") == 0) {          // premier champ
        if (v < 0.0) v = 0.0;                   // borne basse copiée ici
        if (v > 10.0) v = 10.0;                 // borne haute copiée ici
        r->vitesse = (float)v;                  // écriture dans le champ
    } else if (strcmp(nom, "gravite") == 0) {   // deuxième champ : tout recommence
        if (v < 0.0) v = 0.0;
        if (v > 20.0) v = 20.0;
        r->gravite = (float)v;
    } else if (strcmp(nom, "taille") == 0) {    // troisième champ : encore
        if (v < 1.0) v = 1.0;
        if (v > 50.0) v = 50.0;
        r->taille = (int)v;
    } else {
        return -1;                              // aucun champ ne porte ce nom
    }
    return 0;
}

int main(void)
{
    const char *lignes[] = {"vitesse 2.5", "gravite 99", "taille 12", "couleur 3"};
    Reglages    r = {0};                // tous les champs à zéro
    char        nom[32];                // le nom lu sur la ligne
    double      v;                      // la valeur lue sur la ligne

    for (size_t i = 0; i < 4; i++) {            // une passe par ligne
        if (sscanf(lignes[i], "%31s %lf", nom, &v) != 2)   // extrait « nom valeur »
            continue;                   // ligne mal formée : on l'ignore
        if (appliquer(&r, nom, v) == -1)        // champ inconnu ?
            printf("directive inconnue : %s\n", nom);
    }
    printf("vitesse=%g gravite=%g taille=%d\n", r.vitesse, r.gravite, r.taille);
    return 0;
}
```

```text
directive inconnue : couleur
vitesse=2.5 gravite=20 taille=12
```

Le programme fonctionne : `gravite 99` a été ramenée à la borne 20, et `couleur` est signalée comme inconnue. Quelques éléments utilisés :

| Élément | Rôle |
|---|---|
| `static` (devant une fonction) | La fonction n'est visible que dans ce fichier |
| `const` (dans `const char *nom`) | Promet que la valeur pointée ne sera pas modifiée |
| `const char *lignes[] = {...}` | Un tableau de textes ; un texte est une suite de `char` (voir [les chaînes de caractères](/?c=langages&s=c&p=variables#les-chaines-de-caracteres)) |
| `typedef struct {...} Reglages;` | Donne le nom court `Reglages` à ce type de structure, pour ne plus écrire `struct` à chaque usage ([`typedef`](https://en.cppreference.com/w/c/language/typedef)) |
| `r->vitesse` | Le champ `vitesse` de la structure dont `r` est l'adresse ; équivaut à `(*r).vitesse` |
| `strcmp(a, b) == 0` | Vrai quand les deux textes sont identiques (voir [comparer une chaîne](/?c=langages&s=c&p=variables#chercher-et-comparer-une-chaine-strcmp-strchr-strrchr-strstr)) |
| `sscanf(ligne, "%31s %lf", nom, &v)` | Extrait un mot (au plus 31 caractères) puis un nombre de type `double` ; renvoie le nombre de valeurs lues (voir [`sscanf`](/?c=langages&s=c&p=lecture-formatee-scanf)) |
| `Reglages r = {0};` | Initialise la structure : le premier champ vaut 0 et les champs non cités valent aussi zéro |
| `(float)v` | Convertit le `double` en `float` avant l'écriture (deux types de nombres à virgule, le `double` étant le plus précis : voir [les nombres à virgule flottante](/?c=langages&s=c&p=variables#les-nombres-a-virgule-flottante)) |
| `%g`, `%d` | Dans `printf` : un nombre décimal sans zéros inutiles, un entier |
| `size_t` | Entier sans signe fait pour compter des tailles et des positions ; `printf` l'affiche avec `%zu` |

Ses défauts apparaissent dès qu'il y a plus de trois champs :

| Défaut | Conséquence |
|---|---|
| Une branche de plus par champ | Vingt champs donnent vingt branches presque identiques |
| Les bornes sont recopiées dans chaque branche | Changer une règle de bornage oblige à toucher chaque branche |
| Oubli facile | Un champ ajouté à la structure sans branche correspondante est silencieusement ignoré |
| Les données sont mélangées au code | Impossible de réutiliser la liste des directives (pour afficher une aide, par exemple) |

La parade : séparer les **données** (quelles directives existent, avec quelles bornes) du **code** (une seule fonction qui sait appliquer n'importe quelle directive). Les données vont dans un tableau, et pour que la fonction sache où écrire, le tableau doit retenir la position du champ dans la structure.

## `offsetof` : la position d'un champ dans sa structure

Le **décalage** (*offset*) d'un champ est le nombre d'octets entre le début de la structure et le début de ce champ. Le premier champ est à 0. La macro `offsetof(type, champ)`, définie dans l'en-tête `<stddef.h>` (voir [les en-têtes](/?c=langages&s=c&p=headers)), le calcule et le renvoie sous forme de `size_t` ([`offsetof`](https://en.cppreference.com/w/c/types/offsetof)). Une **macro** est un morceau de code que le préprocesseur remplace avant la compilation (voir [le préprocesseur](/?c=langages&s=c&p=compilation#1-le-preprocesseur)).

On pourrait croire que le décalage d'un champ est la somme des tailles des champs précédents. C'est faux dès que le compilateur insère du **rembourrage** (*padding*) : des octets perdus, placés entre deux champs pour que chaque valeur commence à une adresse multiple de sa taille (voir [le rembourrage](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#le-remplissage-padding-dans-les-structures) et [l'alignement](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#l-alignement)). Ce programme montre les décalages réels d'une structure d'essai :

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    char   actif;                       // 1 octet
    float  vitesse;                     // 4 octets
    char   niveau;                      // 1 octet
    double masse;                       // 8 octets
} Demo;

int main(void)
{
    printf("actif   : décalage %zu\n", offsetof(Demo, actif));     // début de la structure
    printf("vitesse : décalage %zu\n", offsetof(Demo, vitesse));   // après du rembourrage
    printf("niveau  : décalage %zu\n", offsetof(Demo, niveau));    // juste après vitesse
    printf("masse   : décalage %zu\n", offsetof(Demo, masse));     // après du rembourrage
    printf("taille totale : %zu octets\n", sizeof(Demo));          // somme des champs : 14
    return 0;
}
```

```text
actif   : décalage 0
vitesse : décalage 4
niveau  : décalage 8
masse   : décalage 16
taille totale : 24 octets
```

Les quatre champs pèsent 1 + 4 + 1 + 8 = 14 octets, la structure en occupe 24 ([`sizeof`](/?c=langages&s=c&p=memoire#sizeof) donne la taille en octets d'un type). Voici la mémoire de cette structure, un octet par colonne :

```text
octet   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
        a  .  .  .  v  v  v  v  n  .  .  .  .  .  .  .  m  m  m  m  m  m  m  m
        ^           ^           ^                       ^
        décalage 0  décalage 4  décalage 8              décalage 16

a = actif   v = vitesse   n = niveau   m = masse   . = rembourrage (octets perdus)
```

| Champ | Taille | Décalage attendu par addition | Décalage réel (`offsetof`) | Pourquoi l'écart |
|---|---|---|---|---|
| `actif` | 1 | 0 | 0 | Premier champ |
| `vitesse` | 4 | 1 | 4 | Un `float` commence à un multiple de 4 : 3 octets perdus |
| `niveau` | 1 | 5 | 8 | Il suit `vitesse`, qui finit à l'octet 7 |
| `masse` | 8 | 6 | 16 | Un `double` commence à un multiple de 8 : 7 octets perdus |

Cette différence est exactement la raison d'être d'`offsetof` : le compilateur est seul à savoir où il a placé chaque champ, et il le dit ici. Le résultat est une **constante** connue à la compilation, donc utilisable dans un tableau initialisé en dehors de toute fonction. Il vaut pour **toute** variable du même type de structure : un décalage ne dépend pas d'un exemplaire précis.

## La table de directives et la fonction unique

Chaque directive devient une ligne `{nom, décalage, min, max}` d'un tableau. Toute la logique tient ensuite dans une seule fonction : chercher la ligne par son nom, borner la valeur, écrire dans le champ. Pour commencer, la table ne contient que les deux champs `float` ; `taille`, de type `int`, arrive dans la section suivante.

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float vitesse;                      // vitesse de déplacement
    float gravite;                      // intensité de la gravité
    int   taille;                       // taille en cases (traitée plus loin)
} Reglages;

typedef struct {
    const char *nom;                    // nom de la directive dans le fichier
    size_t      decalage;               // position du champ dans Reglages, en octets
    double      min;                    // plus petite valeur acceptée
    double      max;                    // plus grande valeur acceptée
} Directive;

static const Directive g_table[] = {
    {"vitesse", offsetof(Reglages, vitesse), 0.0, 10.0},   // une ligne par champ
    {"gravite", offsetof(Reglages, gravite), 0.0, 20.0},
};
#define NB_DIRECTIVES (sizeof g_table / sizeof g_table[0])     // nombre de lignes

// Applique une ligne « nom valeur ». Renvoie 0 si elle a été appliquée, -1 sinon.
static int appliquer_ligne(Reglages *r, const char *ligne)
{
    char   nom[32];                     // le nom lu
    double v;                           // la valeur lue

    if (sscanf(ligne, "%31s %lf", nom, &v) != 2 || !isfinite(v))   // forme et valeur
        return -1;
    for (size_t i = 0; i < NB_DIRECTIVES; i++) {        // cherche la ligne de la table
        if (strcmp(nom, g_table[i].nom) != 0)           // ce n'est pas celle-ci
            continue;
        if (v < g_table[i].min) v = g_table[i].min;     // borne basse
        if (v > g_table[i].max) v = g_table[i].max;     // borne haute
        *(float *)((char *)r + g_table[i].decalage) = (float)v;   // écrit dans le champ
        return 0;
    }
    return -1;                          // aucune ligne ne porte ce nom
}

int main(void)
{
    const char *lignes[] = {"vitesse 2.5", "gravite 99", "couleur 3", "vitesse nan"};
    Reglages    r = {0};                // tous les champs à zéro

    for (size_t i = 0; i < 4; i++)      // une passe par ligne
        if (appliquer_ligne(&r, lignes[i]) == -1)
            printf("ligne refusée : %s\n", lignes[i]);
    printf("vitesse=%g gravite=%g\n", r.vitesse, r.gravite);
    return 0;
}
```

```text
ligne refusée : couleur 3
ligne refusée : vitesse nan
vitesse=2.5 gravite=20
```

| Élément | Rôle |
|---|---|
| `static const Directive g_table[]` | Tableau fixe, jamais modifié (`const`), visible seulement dans ce fichier (`static`) |
| `{"vitesse", offsetof(...), 0.0, 10.0}` | Une ligne : le nom, le décalage du champ, puis les deux bornes |
| `sizeof g_table / sizeof g_table[0]` | Octets du tableau entier divisés par octets d'une ligne : le nombre de lignes, qui suit tout seul chaque ajout |
| `continue;` | Passe directement au tour suivant de la boucle (voir [`break` et `continue`](/?c=langages&s=c&p=boucles#break-et-continue)) |
| `... != 2 \|\| !isfinite(v)` | `\|\|` veut dire « ou » ; `!` inverse une condition : on refuse si la ligne est mal formée ou si la valeur n'est pas finie |
| `isfinite(v)` | Faux pour `NaN` (« pas un nombre ») et l'infini, de `<math.h>` : ils passeraient les bornes sans erreur (voir [`NaN` et `inf`](/?c=langages&s=c&p=convertir-un-texte-en-nombre#les-nombres-decimaux-strtod-nan-et-inf)) |
| Les deux `if` sur `v` | Ramènent la valeur dans `[min, max]` (voir [borner chaque valeur](/?c=langages&s=c&p=convertir-un-texte-en-nombre#borner-chaque-valeur-a-son-domaine)) |

### Décortiquer l'écriture dans le champ

La ligne importante est `*(float *)((char *)r + g_table[i].decalage) = (float)v;`. Elle se lit de l'intérieur vers l'extérieur :

| Étape | Expression | Type | Ce qui se passe |
|---|---|---|---|
| 1 | `r` | `Reglages *` | L'adresse du début de la structure |
| 2 | `(char *)r` | `char *` | Un **cast** : une conversion explicite d'un type vers un autre, écrite `(type)valeur`. La même adresse, mais vue comme celle d'un `char`, qui pèse 1 octet |
| 3 | `(char *)r + g_table[i].decalage` | `char *` | Avance de `decalage` octets : l'adresse du champ visé |
| 4 | `(float *)(...)` | `float *` | Un second cast : même adresse, mais on déclare qu'un `float` se trouve là |
| 5 | `*(...)` | `float` | Le déréférencement : le champ lui-même, prêt à recevoir une valeur |
| 6 | `= (float)v` | | Le `double` lu est converti en `float`, puis écrit dans les 4 octets du champ |

Le `(char *)` de l'étape 2 est indispensable. Sur un pointeur, l'addition compte en **éléments** et pas en octets : `r + 8` avancerait de 8 fois la taille de `Reglages` (voir [l'arithmétique de pointeurs](/?c=langages&s=c&p=pointeurs#arithmetique-de-pointeurs)), loin hors de la structure. Avec un `char *`, chaque unité vaut exactement 1 octet, et le décalage en octets donné par `offsetof` tombe juste.

```text
r (Reglages *)       r + 4 octets
     |                    |
     v                    v
     +--------------------+--------------------+--------------------+
     |  vitesse (4 octets)|  gravite (4 octets)|  taille (4 octets) |
     +--------------------+--------------------+--------------------+
     0                    4                    8                    12

(char *)r + 4  -->  adresse de gravite   -->  (float *) puis *  -->  écriture
```

En C++, ce genre de conversion de pointeur s'écrit `reinterpret_cast`, justement pour la rendre visible (voir [les cast en C++](/?c=langages&s=cpp&p=cast-cpp)) : le C n'a que la syntaxe `(type)valeur` pour tout.

Le décalage et pas l'adresse du champ est ce que la table retient, parce que la table existe avant toute structure : elle est écrite une fois, et la même ligne sert pour n'importe quel exemplaire de `Reglages`, qu'il soit sur la pile (la mémoire des variables locales) ou dans un tableau. Ajouter un champ revient à **ajouter une seule ligne** à la table : la fonction ne change pas. La parenté avec la table de dispatch du PHP est directe (voir [la table de dispatch du routage](/?c=langages&s=php&p=routage#le-front-controller-et-la-table-de-dispatch)) : on remplace une suite de comparaisons par une consultation de tableau. La variante du C pour appeler une fonction plutôt qu'écrire dans un champ s'appuie sur [les pointeurs de fonction](/?c=langages&s=c&p=pointeurs#pointeurs-de-fonctions) et le [dispatch par étiquette de type](/?c=langages&s=c&p=generiques-par-etiquette-de-type#dispatcher-sans-chaine-de-if-else-if).

## Les limites et les pièges de l'écriture par décalage

### Plusieurs types de champ : une colonne « type »

Le cast `(float *)` suppose que **tous** les champs visés sont des `float`. Dès qu'un champ est un `int`, la fonction doit savoir lequel écrire : la table gagne une colonne `type`. Une **énumération** (`enum`) est une liste de noms auxquels le compilateur attribue des entiers 0, 1, 2... ([`enum`](https://en.cppreference.com/w/c/language/enum)) ; elle sert ici d'étiquette.

```c
typedef enum {                          // les types de champ que la table sait écrire
    TYPE_FLOAT,                         // le champ est un float
    TYPE_INT                            // le champ est un int
} Type;

typedef struct {
    const char *nom;                    // nom de la directive dans le fichier
    Type        type;                   // type du champ visé
    size_t      decalage;               // position du champ dans Reglages, en octets
    double      min;                    // plus petite valeur acceptée
    double      max;                    // plus grande valeur acceptée
} Directive;

static const Directive g_table[] = {
    {"vitesse", TYPE_FLOAT, offsetof(Reglages, vitesse), 0.0, 10.0},
    {"gravite", TYPE_FLOAT, offsetof(Reglages, gravite), 0.0, 20.0},
    {"taille",  TYPE_INT,   offsetof(Reglages, taille),  1.0, 50.0},   // la ligne ajoutée
};

// Écrit v dans le champ décrit par d, avec le bon type.
static void ecrire_champ(Reglages *r, const Directive *d, double v)
{
    char *octet = (char *)r + d->decalage;      // adresse du champ, comptée à l'octet

    switch (d->type) {                  // le type décide de la façon d'écrire
    case TYPE_FLOAT:
        *(float *)octet = (float)v;     // 4 octets, codés en flottant
        break;
    case TYPE_INT:
        *(int *)octet = (int)v;         // 4 octets, codés en entier
        break;
    }
}
```

`appliquer_ligne` ne change presque pas : au lieu d'écrire dans le champ, elle appelle `ecrire_champ(r, &g_table[i], v)`. Le `switch` choisit parmi des cas selon une valeur (voir [le `switch`](/?c=langages&s=c&p=conditions#le-switch)). Le programme complet de la dernière section réunit toutes ces pièces.

### L'alignement : pourquoi la formule tombe juste

L'adresse `(char *)r + decalage` est correctement alignée pour le type du champ **parce que** `decalage` vient d'`offsetof`, qui tient compte du rembourrage. Un décalage calculé à la main (4 + 4 pour atteindre `taille`) échouerait aussitôt qu'un champ est précédé d'un type plus petit ou plus grand : dans la structure d'essai de la section précédente, la somme donnait 1 pour `vitesse`, le réel est 4. Un accès mal aligné est interdit sur certains processeurs et plus lent sur les autres.

### Écrire un type de la mauvaise taille

Le compilateur ne vérifie pas que le cast correspond au champ. Écrire un `double` (8 octets) à l'adresse d'un `float` (4 octets) déborde sur le champ voisin :

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float vitesse;                      // octets 0 à 3
    float gravite;                      // octets 4 à 7
    int   taille;                       // octets 8 à 11
} Reglages;

int main(void)
{
    Reglages r = {5.0f, 9.8f, 12};      // trois valeurs de départ

    // ERREUR volontaire : un double (8 octets) écrit dans un champ de 4 octets
    *(double *)((char *)&r + offsetof(Reglages, vitesse)) = 1.0;
    printf("vitesse=%g gravite=%g taille=%d\n", r.vitesse, r.gravite, r.taille);
    return 0;
}
```

```text
vitesse=0 gravite=1.875 taille=12
```

Les 8 octets du `double` `1.0` ont recouvert `vitesse` **et** `gravite`. Les valeurs affichées (0 puis 1,875) sont celles d'un processeur x86 d'essai, qui range les octets d'un nombre en commençant par le moins significatif (voir [l'ordre des octets](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#l-ordre-des-octets-endianness)) ; sur une autre machine elles changeraient. Le langage ne promet rien ici : c'est un **comportement indéfini**, un cas où la norme du langage C ne garantit aucun résultat (ni plantage ni valeur précise).

### Perdre la vérification de type

Une écriture normale, `s.taille = 2.5f`, passe par le compilateur, qui connaît le type du champ : il convertit et, avec l'option `-Wconversion`, il avertit de la perte. Avec le décalage, il ne sait plus rien :

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float vitesse;                      // champ de type float
    int   taille;                       // champ de type int
} R;

int main(void)
{
    R r = {0, 0};                       // deux champs à zéro
    R s = {0, 0};                       // une seconde structure, pour comparer

    s.taille = 2.5f;                    // écriture normale : le compilateur convertit
    *(float *)((char *)&r + offsetof(R, taille)) = 2.5f;   // écriture par décalage
    printf("normale : taille=%d\n", s.taille);
    printf("par décalage : taille=%d\n", r.taille);
    return 0;
}
```

```text
normale : taille=2
par décalage : taille=1075838976
```

La seconde écriture compile sans le moindre avertissement : les 4 octets du `float` 2,5 ont été posés tels quels dans un champ lu ensuite comme un entier, d'où 1 075 838 976. Voilà le prix du tableau piloté : la sécurité que donne un `if` par champ (chaque branche est vérifiée) est remplacée par la discipline d'une colonne `type` juste.

| Approche | Vérification du compilateur | Ajouter un champ |
|---|---|---|
| Chaîne de `if` ou `switch` sur le nom | Complète : chaque affectation est typée | Une branche entière |
| Table `{nom, décalage, min, max}` | Aucune sur le type écrit | Une ligne |

### Les champs de bits et les autres structures

Un **champ de bits** (*bit-field*) est un champ dont on fixe la largeur en bits (`unsigned niveau : 3;`) pour regrouper plusieurs petites valeurs dans un même octet (voir [les opérateurs binaires](/?c=langages&s=c&p=operateurs-binaires) pour les manipulations de bits, et [les champs de bits](https://en.cppreference.com/w/c/language/bit_field)). Il n'a pas d'adresse d'octet propre, donc `offsetof` ne s'y applique pas. Le compilateur le dit :

```text
error: attempt to take address of bit-field structure member ‘niveau’
```

Enfin, la table est liée au type de structure pour lequel ses décalages ont été calculés. Appliquée à un autre type, elle compile quand même et écrit à des positions sans rapport avec ce qui était voulu.

## Le littéral composé C99 : une valeur fabriquée sur place

Un **littéral** est une valeur écrite telle quelle dans le code : `42`, `3.5`, `'a'`, `"abc"`. Les nombres et les caractères suffisent pour les types simples, mais aucune écriture ne produit une structure d'un coup. Pour passer le point (4, 6) à une fonction (en **argument** : la valeur donnée à la fonction quand on l'appelle, voir [le passage à une fonction](/?c=langages&s=c&p=pointeurs#passer-un-pointeur-a-une-fonction-passage-par-adresse)), il fallait déclarer une variable, la remplir, puis la passer. Le **littéral composé** fabrique cette valeur à l'endroit où on en a besoin : `(Type){valeurs}` ([littéral composé](https://en.cppreference.com/w/c/language/compound_literal)). La partie `(Type)` ressemble à un cast, mais les accolades qui suivent en font une valeur construite.

| Manière de fabriquer le point (4, 6) | Écriture | Variable nommée |
|---|---|---|
| Déclaration avec initialisation | `Point p = {4, 6};` | Oui, `p` |
| Affectation champ par champ | `p.x = 4; p.y = 6;` | Oui, `p` |
| Littéral composé | `(Point){4, 6}` | Non |

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscisse
    int y;                              // ordonnée
} Point;

static double distance2(Point a, Point b)
{
    int dx = b.x - a.x;                 // écart horizontal
    int dy = b.y - a.y;                 // écart vertical
    return (double)(dx * dx + dy * dy); // carré de la distance
}

static int somme(const int *t, int n)
{
    int total = 0;                      // cumul
    for (int i = 0; i < n; i++)         // parcourt n entiers
        total += t[i];
    return total;
}

static void deplacer(Point *p)
{
    p->x += 10;                         // modifie le point reçu par adresse
}

int main(void)
{
    Point p = {1, 2};                   // la façon classique : une variable nommée

    printf("%.0f\n", distance2(p, (Point){4, 6}));              // un point sans nom
    printf("%.0f\n", distance2((Point){0, 0}, (Point){.y = 3, .x = 4}));
    printf("%d\n", somme((int[]){1, 2, 3, 4}, 4));              // un tableau sans nom
    printf("%d\n", somme((int[5]){1, 2}, 5));                   // 5 cases, 3 à zéro
    deplacer(&(Point){7, 7});           // adresse d'un littéral : on peut l'écrire
    char *mot = (char[]){"abc"};        // tableau de char modifiable (copie de "abc")
    mot[0] = 'X';                       // permis : ce n'est pas un littéral de chaîne
    printf("%s\n", mot);
    return 0;
}
```

```text
25
25
10
3
Xbc
```

| Forme | Exemple | Ce qu'on obtient |
|---|---|---|
| Structure, valeurs dans l'ordre des champs | `(Point){4, 6}` | `x` vaut 4, `y` vaut 6 |
| Structure, **initialisateurs désignés** | `(Point){.y = 3, .x = 4}` | `.champ = valeur` nomme le champ visé : l'ordre est libre et un champ non cité vaut zéro ([initialisation](https://en.cppreference.com/w/c/language/struct_initialization)) |
| Tableau, taille déduite | `(int[]){1, 2, 3, 4}` | 4 cases |
| Tableau, taille fixée | `(int[5]){1, 2}` | 5 cases, les trois dernières à zéro |
| Tableau désigné | `(int[]){[2] = 7}` | 3 cases : `{0, 0, 7}` |
| Texte modifiable | `(char[]){"abc"}` | 4 cases (`a`, `b`, `c` et le `\0` final), copiées et modifiables |

Les valeurs `25` et `25` sont les carrés des distances de (1, 2) à (4, 6) et de (0, 0) à (4, 3) : dans les deux cas 3 et 4 (ou 4 et 3) d'écart, soit 9 + 16.

### Durée de vie : jusqu'à la fin du bloc

La **durée de vie** d'une valeur est la période pendant laquelle elle existe en mémoire. Un **bloc** est le texte compris entre une accolade ouvrante `{` et sa fermante `}` (corps d'une fonction, d'une boucle...). Un littéral composé écrit dans un bloc se comporte comme une variable locale de ce bloc :

| Où est écrit le littéral | Sa vie |
|---|---|
| Dans une fonction ou un bloc | Jusqu'à l'accolade fermante du bloc englobant |
| Dans le corps d'une boucle | Recréé à chaque tour |
| Hors de toute fonction | Tout le programme (les valeurs doivent alors être des constantes) |

```c
typedef struct { int x; int y; } Point;

static Point *const g_origine = &(Point){0, 0};     // hors fonction : vit tout le programme
static const int   *g_premiers = (const int[]){2, 3, 5, 7};   // idem

void exemple(void)
{
    int *p;                             // un pointeur, déclaré dans le bloc de la fonction
    {                                   // un bloc intérieur
        p = (int[]){1, 2, 3};           // le tableau vit jusqu'à la } suivante
    }                                   // ici le tableau n'existe plus
}                                       // et p pointerait vers une zone morte
```

La conséquence : **ne jamais garder ni renvoyer l'adresse d'un littéral composé local**. Le renvoyer par valeur, en revanche, est sans danger, puisque c'est une copie.

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscisse
    int y;                              // ordonnée
} Point;

static Point *g_ptr;                    // pointeur global, pour garder une adresse

static void ranger(void)
{
    g_ptr = &(Point){3, 4};             // l'adresse d'un littéral local est gardée
}

int main(void)
{
    ranger();                           // la fonction finit : son littéral n'existe plus
    printf("%d\n", g_ptr->x);           // lecture d'une zone morte
    return 0;
}
```

Compilé avec `-Wall -Wextra -Werror` seulement, ce programme est refusé par GCC : `error: storing the address of local variable ‘({anonymous})’ in ‘g_ptr’ [-Werror=dangling-pointer=]`. Compilé avec `-fsanitize=address,undefined` en plus, il passe la compilation, et l'exécution s'arrête sur `ERROR: AddressSanitizer: stack-use-after-return`. Ces messages sont ceux de la machine d'essai ; un autre compilateur peut se taire à la compilation, mais l'erreur existe quand même.

### Modifiable, contrairement à un littéral de chaîne

Le texte `"abc"` écrit dans le code est souvent stocké dans une zone de mémoire en lecture seule : écrire dedans est un comportement indéfini, le plus souvent un plantage. Un littéral composé `(char[]){"abc"}` est au contraire une **copie** dans un tableau ordinaire : on peut le modifier (le programme ci-dessus l'a fait : `Xbc`). Pour l'interdire, on ajoute `const` : `(const Point){4, 6}`.

### Un peu de C++

Le littéral composé est une fonctionnalité du C, pas du C++ standard : un compilateur C++ le refuse ou, comme GCC, l'accepte comme extension en prévenant avec `-pedantic` `ISO C++ forbids compound-literals`. En C++, on écrit `Point{4, 6}` ou on utilise un constructeur (voir [les classes et objets](/?c=langages&s=cpp&p=classes-et-objets)). Un fichier destiné aux deux langages évite donc le littéral composé.

## Un exemple qui combine les deux

Les deux notions se complètent : la table remplit la structure, et un littéral composé fournit ses valeurs par défaut. Celles-ci sont rangées dans une fonction qui renvoie la structure par valeur ; les champs qu'un fichier de réglages ne mentionne pas gardent ainsi une valeur raisonnable au lieu de zéro. Le programme réunit la table de la section précédente (avec le type) et le littéral composé :

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float vitesse;                      // vitesse de déplacement
    float gravite;                      // intensité de la gravité
    int   taille;                       // taille en cases
} Reglages;

typedef enum { TYPE_FLOAT, TYPE_INT } Type;   // types de champ que la table sait écrire

typedef struct {
    const char *nom;                    // nom de la directive dans le fichier
    Type        type;                   // type du champ visé
    size_t      decalage;               // position du champ dans Reglages, en octets
    double      min;                    // plus petite valeur acceptée
    double      max;                    // plus grande valeur acceptée
} Directive;

static const Directive g_table[] = {
    {"vitesse", TYPE_FLOAT, offsetof(Reglages, vitesse), 0.0, 10.0},
    {"gravite", TYPE_FLOAT, offsetof(Reglages, gravite), 0.0, 20.0},
    {"taille",  TYPE_INT,   offsetof(Reglages, taille),  1.0, 50.0},
};
#define NB_DIRECTIVES (sizeof g_table / sizeof g_table[0])     // nombre de lignes

// Les valeurs de départ, fabriquées sur place et rendues par valeur (une copie).
static Reglages reglages_par_defaut(void)
{
    return (Reglages){.vitesse = 1.0f, .gravite = 9.8f, .taille = 4};
}

static void ecrire_champ(Reglages *r, const Directive *d, double v)
{
    char *octet = (char *)r + d->decalage;      // adresse du champ, comptée à l'octet

    if (d->type == TYPE_FLOAT)          // champ de type float
        *(float *)octet = (float)v;
    else                                // champ de type int
        *(int *)octet = (int)v;
}

static int appliquer_ligne(Reglages *r, const char *ligne)
{
    char   nom[32];                     // le nom lu
    double v;                           // la valeur lue

    if (sscanf(ligne, "%31s %lf", nom, &v) != 2 || !isfinite(v))   // forme et valeur
        return -1;
    for (size_t i = 0; i < NB_DIRECTIVES; i++) {        // cherche la ligne de la table
        if (strcmp(nom, g_table[i].nom) != 0)           // ce n'est pas celle-ci
            continue;
        if (v < g_table[i].min) v = g_table[i].min;     // borne basse
        if (v > g_table[i].max) v = g_table[i].max;     // borne haute
        ecrire_champ(r, &g_table[i], v);                // écriture typée
        return 0;
    }
    return -1;                          // aucune ligne ne porte ce nom
}

static void afficher(const char *titre, const Reglages *r)
{
    printf("%-8s vitesse=%g gravite=%g taille=%d\n",
           titre, r->vitesse, r->gravite, r->taille);
}

int main(void)
{
    const char *lignes[] = {"vitesse 2.5", "taille 120", "gravite -3", "couleur 3"};
    Reglages    r = reglages_par_defaut();      // on part des valeurs par défaut

    afficher("init", &r);
    for (size_t i = 0; i < 4; i++)      // une passe par ligne du fichier
        if (appliquer_ligne(&r, lignes[i]) == -1)
            printf("ligne refusée : %s\n", lignes[i]);
    afficher("lu", &r);
    afficher("partiel", &(Reglages){.taille = 8});     // seul taille est donné
    return 0;
}
```

```text
init     vitesse=1 gravite=9.8 taille=4
ligne refusée : couleur 3
lu       vitesse=2.5 gravite=0 taille=50
partiel  vitesse=0 gravite=0 taille=8
```

| Élément | Rôle |
|---|---|
| `(Reglages){.vitesse = 1.0f, .gravite = 9.8f, .taille = 4}` | Fabrique la structure des valeurs par défaut, champs nommés : l'ordre de la déclaration ne compte pas |
| `return (Reglages){...};` | Rend une copie de la structure : sûr, contrairement à l'adresse d'un littéral local |
| `afficher("partiel", &(Reglages){.taille = 8})` | Passe l'adresse d'une structure sans nom ; les champs non cités valent zéro, d'où `vitesse=0 gravite=0` |
| `const Reglages *r` | Dit que `afficher` ne modifiera pas la structure reçue |
| `%-8s` | Écrit un texte aligné à gauche sur 8 caractères, pour que les colonnes s'alignent |

| Ligne du fichier | Ce que fait la table | Résultat |
|---|---|---|
| `vitesse 2.5` | Valeur dans `[0, 10]` | `vitesse` passe de 1 à 2,5 |
| `taille 120` | Dépasse la borne 50 | `taille` vaut 50, écrit comme `int` |
| `gravite -3` | Sous la borne 0 | `gravite` vaut 0 |
| `couleur 3` | Aucune ligne de ce nom | Refusée, la structure ne change pas |

Ajouter un réglage (une `couleur`, un `volume`) demande un champ dans `Reglages`, une valeur dans `reglages_par_defaut` et une ligne dans `g_table` : aucune fonction à modifier.

## Les pièges

| Piège | Pourquoi | Parade |
|---|---|---|
| Écrire `r + decalage` sans `(char *)` | L'addition compte en structures entières et non en octets | Toujours `(char *)r + decalage` |
| Un cast qui ne correspond pas au type du champ | Mauvaise taille ou mauvais codage, sans erreur ni avertissement | Colonne `type` et un cast par type |
| Écrire un `double` dans un champ `float` | Déborde sur le champ voisin (comportement indéfini) | Convertir la valeur avec `(float)v` avant l'écriture |
| Calculer le décalage en additionnant des tailles | Le rembourrage décale les champs | `offsetof` seulement |
| `offsetof` sur un champ de bits | Il n'a pas d'adresse d'octet : erreur de compilation | Champ ordinaire, ou fonction d'accès dédiée |
| Une table appliquée à une autre structure | Les décalages ne correspondent plus, sans erreur | Une table par type de structure, nommée en conséquence |
| Laisser passer `NaN` | Il franchit tous les tests de bornes | Tester `isfinite` avant de borner |
| Garder l'adresse d'un littéral composé local | Il disparaît à la fin du bloc | Rendre la structure par valeur ou la copier dans une variable à longue vie |
| Modifier un littéral de chaîne `"abc"` | Zone en lecture seule : comportement indéfini | Copier dans un tableau : `char t[] = "abc";` ou `(char[]){"abc"}` |
| Valeurs d'un littéral composé dans l'ordre des champs | Un champ déplacé ou ajouté change le sens sans erreur | Initialisateurs désignés `.champ = valeur` |
| Utiliser le littéral composé dans du code partagé avec C++ | Non standard en C++ | Réserver ce code au C, ou écrire `Point{4, 6}` côté C++ |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Séparer les données (la table) du code (la fonction unique) | Ajouter un réglage ne touche qu'une ligne |
| Compter les lignes avec `sizeof g_table / sizeof g_table[0]` | Le nombre suit tout seul chaque ajout |
| Déclarer la table `static const` | Elle ne peut être modifiée ni par erreur ni depuis un autre fichier |
| Calculer chaque décalage avec `offsetof`, jamais à la main | Le compilateur connaît le rembourrage |
| Garder une colonne `type` dès que les champs diffèrent | Chaque écriture a le cast qui lui convient |
| Borner et tester `sscanf` avant d'écrire | Une valeur absurde ou une ligne mal formée ne s'insère pas |
| Compiler avec `-Wall -Wextra` et lancer un test avec `-fsanitize=address,undefined` | Les écritures hors champ et les adresses mortes sont détectées au premier essai |
| Donner les valeurs par défaut par un littéral composé aux champs nommés | Les champs oubliés valent zéro, et l'ordre des champs reste libre |
| Rendre un littéral composé par valeur, jamais par adresse | Une copie survit à la fonction |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `offsetof(type, champ)` (de `<stddef.h>`) donne le décalage en octets d'un champ dans sa structure, rembourrage compris ; on le range dans une table `{nom, décalage, min, max}` et une seule fonction écrit dans le champ par `*(float *)((char *)r + decalage) = valeur`. Le `(char *)` fait compter en octets ; le second cast dit quel type se trouve là. Un champ de plus = une ligne de plus. Le littéral composé `(Type){valeurs}` (C99) fabrique une structure ou un tableau sur place, modifiable, valable jusqu'à la fin du bloc ; les initialisateurs désignés `.champ = valeur` nomment les champs. Documentation : [`offsetof`](https://en.cppreference.com/w/c/types/offsetof), [littéral composé](https://en.cppreference.com/w/c/language/compound_literal). |
| **Pièges à éviter** | Oublier `(char *)` ; un cast qui ne correspond pas au type du champ (aucune vérification du compilateur) ; écrire un `double` dans un `float` ; calculer un décalage à la main ; `offsetof` sur un champ de bits ; une table appliquée à la mauvaise structure ; laisser passer `NaN` ; garder l'adresse d'un littéral composé local ; modifier un littéral de chaîne ; compter sur le littéral composé en C++. |
| **Bonnes pratiques** | Table `static const` séparée du code ; `offsetof` pour chaque décalage ; colonne `type` dès que les champs diffèrent ; bornes appliquées en un seul endroit ; valeurs par défaut en littéral composé avec initialisateurs désignés ; littéral composé rendu par valeur, jamais par adresse. |
