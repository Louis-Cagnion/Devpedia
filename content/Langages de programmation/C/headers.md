---
order: 6
---

# Les fichiers d'en-tête (.h)

Un fichier d'en-tête (*header*, extension `.h`) contient des **déclarations** — il annonce "cette fonction/variable/structure existe et voici sa signature", sans fournir son implémentation. Il permet à plusieurs fichiers `.c` de partager les mêmes définitions sans les dupliquer, et sert de contrat entre un fichier qui fournit une fonctionnalité et les fichiers qui l'utilisent.

## Déclaration vs définition

```
// calculs.h — déclaration : "cette fonction existe, voici sa signature"
int addition(int a, int b);
```

```
// calculs.c — définition : le vrai corps de la fonction
#include "calculs.h"

int addition(int a, int b)
{
    return a + b;
}
```

```
// main.c — utilisation, via le header
#include "calculs.h"

int main(void)
{
    printf("%d\n", addition(2, 3));
}
```

`main.c` n'a besoin que de connaître la **signature** de `addition()` (via le `#include "calculs.h"`) pour l'appeler — le corps réel est fourni au moment de l'édition de liens (cf. chapitre sur la compilation), à partir du fichier objet compilé depuis `calculs.c`.

## `#include <...>` vs `#include "..."`

```
#include <stdio.h>   // chevrons : cherche dans les répertoires système (bibliothèque standard)
#include "calculs.h" // guillemets : cherche d'abord dans le répertoire courant du projet
```

## Les include guards

Un même header peut être inclus indirectement plusieurs fois (ex. `a.h` inclut `commun.h`, et `b.h` aussi inclut `commun.h`, et `main.c` inclut `a.h` et `b.h`) — sans protection, ses déclarations seraient dupliquées et provoqueraient une erreur de compilation ("redefinition"). Un **include guard** empêche qu'un header soit traité plus d'une fois par le préprocesseur :

```
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- Première inclusion : `CALCULS_H` n'est pas encore défini → tout le contenu est inclus, et `CALCULS_H` est défini.
- Inclusion suivante (même fichier, dans une autre chaîne d'includes) : `CALCULS_H` est déjà défini → le préprocesseur saute directement à `#endif`, le contenu n'est pas dupliqué.

Une alternative plus courte, supportée par la quasi-totalité des compilateurs modernes bien que non garantie par le standard C :

```
#pragma once

int addition(int a, int b);
```

> **Note :** un header ne doit contenir que des **déclarations** (prototypes de fonctions, `struct`, `typedef`, constantes), jamais le corps d'une fonction non-`static`/non-`inline` — sinon, chaque fichier `.c` qui l'inclut obtiendrait sa propre copie de la définition, provoquant une erreur "multiple definition" à l'édition de liens.
