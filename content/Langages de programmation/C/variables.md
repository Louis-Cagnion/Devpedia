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

## Les nombres à virgule flottante

Le C propose plusieurs types pour représenter des nombres décimaux :

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : précision simple (32 bits)
- `double` : précision double (64 bits)

Ces types stockent une **approximation** : `0.1 + 0.2` ne vaut pas exactement `0.3`, et deux flottants ne se comparent donc jamais avec `==`. Ce comportement n'est pas propre au C : il découle de la norme IEEE 754 imposée par le processeur, et se retrouve à l'identique en Python, JavaScript ou PHP. Voir le chapitre [Les nombres à virgule flottante](/?c=representation-des-donnees&p=nombres-flottants) pour l'explication de l'encodage et la façon correcte de comparer.

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
| **Outils utilisables** | `stdbool.h` pour un vrai type booléen ; `sizeof` pour connaître la taille réelle d'un type. |
| **Pièges à éviter** | Comparer deux flottants avec `==` : ce sont des approximations, jamais des valeurs exactes. |
| **Bonnes pratiques** | Choisir le type le plus étroit qui couvre réellement les valeurs attendues, plutôt qu'un `int`/`double` par défaut systématique. |
