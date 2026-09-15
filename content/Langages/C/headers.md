---
order: 10
---

# Les fichiers d'en-tête (.h)

Un fichier d'en-tête (*header*, extension `.h`) contient des **déclarations** : il annonce "cette fonction/variable/structure existe et voici sa signature", sans fournir son implémentation. Il permet à plusieurs fichiers `.c` de partager les mêmes définitions sans les dupliquer, et sert de contrat entre un fichier qui fournit une fonctionnalité et les fichiers qui l'utilisent.

## Déclaration vs définition

```c
// calculs.h, déclaration : "cette fonction existe, voici sa signature"
int addition(int a, int b);
```

```c
// calculs.c, définition : le vrai corps de la fonction
#include "calculs.h"

int addition(int a, int b)
{
    return a + b;
}
```

```c
// main.c, utilisation, via le header
#include "calculs.h"

int main(void)
{
    printf("%d\n", addition(2, 3));
}
```

`main.c` n'a besoin que de connaître la **signature** de `addition()` (via le `#include "calculs.h"`) pour l'appeler : le corps réel est fourni au moment de [l'édition de liens](/?c=langages-de-programmation&s=c&p=compilation), à partir du fichier objet compilé depuis `calculs.c`.

## `#include <...>` vs `#include "..."`

```c
#include <stdio.h>    // chevrons : cherche dans les répertoires système (bibliothèque standard)
#include "calculs.h"  // guillemets : cherche d'abord dans le répertoire courant du projet
```

## Les include guards

Un même header peut être inclus indirectement plusieurs fois (ex. `a.h` inclut `commun.h`, et `b.h` aussi inclut `commun.h`, et `main.c` inclut `a.h` et `b.h`) : sans protection, ses déclarations seraient dupliquées et provoqueraient une erreur de compilation ("redefinition"). Un **include guard** empêche qu'un header soit traité plus d'une fois par le préprocesseur :

```c
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- Première inclusion : `CALCULS_H` n'est pas encore défini → tout le contenu est inclus, et `CALCULS_H` est défini.
- Inclusion suivante (même fichier, dans une autre chaîne d'includes) : `CALCULS_H` est déjà défini → le préprocesseur saute directement à `#endif`, le contenu n'est pas dupliqué.

Une alternative plus courte, supportée par la quasi-totalité des compilateurs modernes bien que non garantie par le standard C :

```c
#pragma once

int addition(int a, int b);
```

> **Note :** un header ne doit contenir que des **déclarations** (prototypes de fonctions, `struct`, `typedef`, constantes), jamais le corps d'une fonction non-`static`/non-`inline` : sinon, chaque fichier `.c` qui l'inclut obtiendrait sa propre copie de la définition, provoquant une erreur "multiple definition" à l'édition de liens.

## Comment `#include` et `-I` se combinent réellement

Le préprocesseur ne "devine" jamais où se trouve un fichier inclus : pour `#include "glad/glad.h"`, il concatène **littéralement** chaque dossier passé via [`-I`](/?c=langages&s=c&p=makefiles) avec le chemin écrit après `#include`, et teste chaque résultat jusqu'à trouver un fichier qui existe :

```text
-I includes  +  #include "glad/glad.h"
   ↓
includes/glad/glad.h   <- chemin réellement testé sur le disque
```

> **Piège :** pointer `-I` sur le dossier qui contient directement `glad.h` (ex. `-I includes/glad`) plutôt que sur son parent (`-I includes`), alors que le code écrit `#include "glad/glad.h"`. La concaténation donne `includes/glad/glad/glad.h`, qui n'existe pas : le compilateur échoue avec "fichier introuvable", pour un chemin qui semble pourtant correct à l'œil si on ne pense qu'en termes de "où est le fichier", sans reconstruire la concaténation exacte.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un header (`.h`) contient des déclarations, pas des définitions : il permet à plusieurs fichiers `.c` de partager les mêmes signatures sans les dupliquer. Le préprocesseur résout `#include "..."` en concaténant littéralement chaque dossier `-I` avec le chemin écrit. |
| **Outils utilisables** | `#include <...>` (bibliothèque système) vs `#include "..."` (fichier du projet) ; include guards (`#ifndef`/`#define`/`#endif` ou `#pragma once`). |
| **Pièges à éviter** | Mettre le corps d'une fonction dans un header : provoque une erreur "multiple definition" dès que plusieurs fichiers l'incluent. Pointer `-I` sur le mauvais niveau de dossier, ce qui casse la concaténation avec le chemin de `#include`. |
| **Bonnes pratiques** | Toujours protéger un header par un include guard, pour supporter une inclusion indirecte multiple sans erreur. |
