---
title: Les variables et types de données
---

Les variables sont utilisées pour stocker des données en mémoire afin qu'un programme puisse les manipuler. En langage C, chaque variable possède un type qui détermine :

- La quantité de mémoire allouée.
- Les valeurs qu'elle peut contenir.
- Les opérations qui peuvent être effectuées sur elle.

Comprendre les différents types de données est essentiel pour écrire des programmes efficaces et mieux appréhender la gestion de la mémoire.

## Les entiers (`int`)

Le type `int` permet de stocker des nombres entiers positifs ou négatifs.

```
int age = 25;
int temperature = -5;
```

La taille d'un `int` dépend de l'architecture de la machine, mais elle est généralement de 4 octets (32 bits).

## Les caractères (`char`)

Le type `char` permet de stocker un caractère unique.

```
char letter = 'A';
char digit = '5';
```

Un `char` occupe généralement 1 octet en mémoire et contient la valeur ASCII du caractère.

## Les booléens (`bool`)

Depuis la norme C99, le langage fournit le type `bool` via la bibliothèque `stdbool.h`.

```
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

```
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : précision simple
- `double` : précision double

## Les chaînes de caractères

Le langage C ne possède pas de type "string" natif. Une chaîne de caractères est représentée par un tableau de caractères terminé par le caractère nul (`\0`).

```
char name[] = "Devpedia";
```

En mémoire :

```
D e v p e d i a \0
```

Une chaîne est donc simplement une suite de caractères stockés de manière contiguë.

## Les pointeurs

Les pointeurs sont l'une des caractéristiques les plus importantes du langage C.

Ils permettent de stocker l'adresse mémoire d'une variable.

```
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

```
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

La maîtrise de ces types est indispensable avant d'aborder des concepts plus avancés comme les listes chaînées, les arbres binaires, les threads ou la gestion des processus.

Je te suggère ensuite de créer des pages séparées :

- **Pointeurs**
- **Chaînes de caractères**
- **Structures**
- **Listes chaînées**
- **Arbres binaires**
- **Gestion des processus (`pid_t`)**
- **Threads (`pthread`)**
- **Fonctions variadiques (`va_list`)**

Cela donnera une documentation beaucoup plus progressive et pédagogique.