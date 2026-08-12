---
order: 1
---

# Les variables et types de données

Pour rappel, [une variable est une boîte étiquetée qui contient une valeur](/?c=bases-de-l-informatique&p=la-variable). En langage C, chaque variable possède en plus un type qui détermine :

- La quantité de mémoire allouée.
- Les valeurs qu'elle peut contenir.
- Les opérations qui peuvent être effectuées sur elle.

Comprendre les différents types de données est essentiel pour écrire des programmes efficaces et mieux appréhender la gestion de la mémoire.

## Les entiers (`int`)

Le type `int` permet de stocker des nombres entiers positifs ou négatifs.

```c
int age = 25;
int temperature = -5;
```

La taille d'un `int` dépend de l'architecture de la machine, mais elle est généralement de 4 octets (32 bits).

## Les caractères (`char`)

Le type `char` permet de stocker un caractère unique.

```c
char letter = 'A';
char digit = '5';
```

Un `char` occupe généralement 1 octet en mémoire et contient la valeur ASCII du caractère.

> **Piège :** confondre `'A'` (guillemets simples) et `"A"` (guillemets doubles). Le premier est un `char` unique (la valeur ASCII 65) ; le second est une **chaîne** de deux octets, `'A'` suivi du caractère nul `'\0'` (voir la section dédiée plus bas). Écrire `char lettre = "A";` est une erreur de type, pas juste une différence de style.
>
> **Bonne pratique :** réserver les guillemets simples à un caractère isolé, les guillemets doubles à une chaîne, même d'un seul caractère.
>
> **Note :** le standard C ne fixe pas si un `char` "nu" (sans `signed`/`unsigned` explicite) est signé ou non signé : ce choix dépend du compilateur et de l'architecture. Un code qui stocke autre chose que du texte dans un `char` (une petite valeur numérique, par exemple) devrait préciser `signed char` ou `unsigned char` plutôt que de supposer l'un des deux comportements.

## Les booléens (`bool`)

Depuis la norme C99, le langage fournit le type `bool` via la bibliothèque `stdbool.h`.

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

Un booléen représente une valeur logique :

- `true`
- `false`

Avant C99, il était courant d'utiliser des entiers (`0` pour faux, valeur non nulle pour vrai).

> **Piège :** supposer qu'un `bool` stocke fidèlement n'importe quel entier assigné. `bool b = 5;` ne stocke pas `5` : toute valeur non nulle est ramenée à `1` (`true`) à l'assignation. Comparer ensuite `b == 5` est donc faux, un résultat qui surprend qui s'attendait à retrouver la valeur d'origine.
>
> **Bonne pratique :** ne jamais réutiliser un `bool` comme s'il pouvait encore contenir la valeur numérique d'origine ; s'en tenir à `true`/`false` une fois la variable déclarée `bool`.

> **Note :** du code C plus ancien (pré-C99, ou qui n'inclut pas `stdbool.h`) utilise encore un simple `int` pour représenter un booléen. Lire un tel code demande de garder en tête la même convention : `0` est faux, toute autre valeur est vraie, y compris les valeurs négatives.

## Les nombres à virgule flottante

Le C propose plusieurs types pour représenter des nombres décimaux :

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : précision simple (32 bits)
- `double` : précision double (64 bits)

Ces types stockent une **approximation**, pas une valeur exacte : `0.1 + 0.2` ne vaut pas exactement `0.3`. Ce comportement n'est pas propre au C : il découle de la norme IEEE 754 imposée par le processeur, et se retrouve à l'identique en Python, JavaScript ou PHP (voir le chapitre [Les nombres à virgule flottante](/?c=representation-des-donnees&p=nombres-flottants) pour l'explication de l'encodage).

> **Piège :** comparer deux flottants avec `==`, en s'attendant à ce que `0.1 + 0.2 == 0.3` soit vrai. À cause de l'approximation, ce test échoue silencieusement la plupart du temps : aucune erreur, juste un résultat inattendu.
>
> **Bonne pratique :** comparer deux flottants par leur écart (`fabs(a - b) < epsilon`, une tolérance choisie), jamais par égalité stricte ; voir la [façon correcte de comparer](/?c=representation-des-donnees&p=nombres-flottants) pour le détail.

De même, la plage de valeurs des entiers et leur comportement en cas de débordement découlent du nombre de bits alloués : voir [Les entiers, les bits et les débordements](/?c=representation-des-donnees&p=entiers-et-debordements).

## Les chaînes de caractères

Le langage C ne possède pas de type "string" natif. Une chaîne de caractères est représentée par un tableau de caractères terminé par le caractère nul (`\0`).

```c
char name[] = "Devpedia";
```

En mémoire :

```text
D e v p e d i a \0
```

Une chaîne est donc simplement une suite de caractères stockés de manière contiguë.

> **Piège :** confondre `sizeof(name)` et la longueur réelle du texte. Ici, `sizeof(name)` vaut `9` (8 caractères + le `\0`), calculé à la **compilation** à partir de la taille du tableau. Mais dès que ce même tableau est passé à une fonction, il se comporte comme un simple pointeur (voir le [piège équivalent avec les tableaux](/?c=langages-de-programmation&s=c&p=boucles)) : `sizeof` y renvoie alors la taille d'un pointeur (souvent `8`), pas celle de la chaîne.
>
> **Bonne pratique :** utiliser `sizeof` uniquement sur un tableau encore déclaré comme tel dans la portée courante ; utiliser `strlen()` (qui parcourt la chaîne jusqu'au `\0`) pour obtenir sa longueur réelle en tout autre contexte, notamment à l'intérieur d'une fonction qui la reçoit en paramètre.

Voir aussi [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire) pour les fonctions à privilégier (`strncpy`, `snprintf`...) afin de ne jamais écrire au-delà de la taille réellement allouée d'une chaîne.

## Les pointeurs

Les pointeurs sont l'une des caractéristiques les plus importantes du langage C.

Ils permettent de stocker l'adresse mémoire d'une variable.

```c
int age = 25;
int *ptr = &age;
```

Ici :

- `age` contient une valeur.
- `ptr` contient l'adresse mémoire de `age`.

Les pointeurs sont utilisés pour :

- Manipuler directement la mémoire.
- Passer des données aux fonctions.
- Construire des structures de données complexes.

Ce n'est qu'un aperçu : voir le chapitre dédié [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs) pour l'arithmétique de pointeurs, le passage par adresse, et les pièges associés (pointeur non initialisé, `NULL` non testé...).

## Les structures (`struct`)

Les structures permettent de regrouper plusieurs données dans un même objet.

```c
struct User
{
    int id;
    char name[50];
};
```

Elles sont souvent utilisées pour représenter des entités complexes.

> **Piège :** comparer deux structures avec `==`. Le C ne le permet pas pour une `struct` (erreur de compilation), et même une comparaison octet par octet (`memcmp`) peut se tromper : le compilateur insère souvent des octets de remplissage invisibles entre les champs pour respecter l'alignement mémoire de chaque type, et leur contenu n'est pas garanti identique entre deux instances par ailleurs égales.
>
> **Bonne pratique :** comparer une structure champ par champ explicitement (`a.id == b.id && strcmp(a.name, b.name) == 0`), jamais par égalité globale ni par `memcmp` sur la structure entière.

## Résumé

Les principaux types de données en C sont :

| Type | Description |
|--------|-------------|
| `bool` | Valeur logique |
| `char` | Caractère |
| `int` | Entier |
| `float` | Nombre décimal |
| `double` | Nombre décimal haute précision |
| `char[]` | Chaîne de caractères |
| `struct` | Ensemble de données personnalisées |
| `pointer` | Adresse mémoire |

La maîtrise de ces types est indispensable avant d'aborder des concepts plus avancés comme les listes chaînées, les arbres binaires, les threads ou la gestion des processus (voir les chapitres dédiés à chacun de ces sujets).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque variable C a un type fixe qui détermine sa taille en mémoire, les valeurs possibles et les opérations autorisées : `int`, `char`, `bool` (C99), `float`/`double`, tableau de `char` (chaîne), `struct`, pointeur. |
| **Outils utilisables** | `stdbool.h` pour un vrai type booléen ; `sizeof` pour la taille d'un type à la compilation ; `strlen()` pour la longueur réelle d'une chaîne à l'exécution. |
| **Pièges à éviter** | Confondre `'A'` et `"A"`. Assigner à un `bool` une valeur qu'il ne restitue pas telle quelle. Comparer deux flottants avec `==`. Confondre `sizeof` sur un tableau et sur le pointeur qui lui succède une fois passé à une fonction. Comparer deux `struct` avec `==` ou `memcmp` (octets de remplissage). |
| **Bonnes pratiques** | Choisir le type le plus étroit qui couvre réellement les valeurs attendues, plutôt qu'un `int`/`double` par défaut systématique. Comparer les flottants par écart, les chaînes avec `strcmp`, les structures champ par champ. |
