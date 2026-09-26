---
order: 11
---

# Le processus de compilation

Contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), interprétés directement à l'exécution, un programme C doit être **traduit en code machine** avant de pouvoir être lancé. Cette traduction se déroule en quatre étapes distinctes, généralement invisibles derrière une seule commande ([`gcc`](https://gcc.gnu.org) `main.c -o programme`), mais qu'il est utile de savoir séparer pour comprendre certaines erreurs.

## Les quatre étapes

```text
main.c --[1. préprocesseur]--> main.i --[2. compilation]--> main.s --[3. assemblage]--> main.o --[4. édition de liens]--> programme
```

### 1. Le préprocesseur

Traite tout ce qui commence par `#` **avant** que le compilateur ne voie le code : remplace les `#include` par le contenu réel du fichier inclus, remplace les macros `#define`, résout les `#ifdef`/`#ifndef`. Le résultat est un fichier source unique, "aplati", sans plus aucune directive `#`.

```bash
gcc -E main.c -o main.i
```

### 2. La compilation proprement dite

Traduit le code source (C) en **assembleur**, un langage encore lisible par un humain mais très proche des instructions du processeur.

```bash
gcc -S main.i -o main.s
```

### 3. L'assemblage

Traduit l'assembleur en **code machine binaire**, regroupé dans un fichier objet (`.o`). Ce fichier contient déjà des instructions exécutables, mais n'est pas encore un programme complet : les appels à des fonctions externes (comme `printf`) ne sont pas encore résolus.

```bash
gcc -c main.s -o main.o
```

### 4. L'édition de liens (*linking*)

Assemble un ou plusieurs fichiers `.o` entre eux, et résout les références vers des fonctions définies ailleurs (dans d'autres fichiers `.o`, ou dans des [bibliothèques](/?c=langages-de-programmation&s=c&p=bibliotheques)) pour produire un exécutable final complet.

```bash
gcc main.o -o programme
```

## Pourquoi séparer compilation et édition de liens

Un projet à plusieurs fichiers source peut compiler chaque `.c` en `.o` indépendamment, puis ne relier (*link*) que les fichiers qui ont changé : plus rapide qu'une recompilation complète à chaque modification. C'est exactement ce qu'automatise un [**Makefile**](/?c=langages-de-programmation&s=c&p=makefiles) :

```bash
gcc -c fichier1.c -o fichier1.o
gcc -c fichier2.c -o fichier2.o
gcc fichier1.o fichier2.o -o programme
```

## Les niveaux d'optimisation (`-O0` à `-O3`, `-Os`)

Une fois le programme compilable, `gcc`/[Clang](https://clang.llvm.org) peuvent réécrire le code machine produit à l'étape 2 pour le rendre plus rapide, sans changer son comportement observable. Ce réglage se fait avec l'option `-O` :

| Niveau | Effet |
|---|---|
| `-O0` | Aucune optimisation (comportement par défaut) : compilation rapide, code machine qui suit le source pas à pas -- le plus simple à suivre dans un débogueur |
| `-O1` | Optimisations basiques, gain modeste, temps de compilation encore court |
| `-O2` | Niveau recommandé en production : inlining, élimination de code mort, déroulement de boucles (voir ci-dessous), sans faire exploser la taille du binaire |
| `-O3` | Pousse `-O2` plus loin (vectorisation agressive, inlining plus large) : gain parfois marginal selon le programme, binaire plus gros, compilation plus longue |
| `-Os` | Optimise la taille du binaire plutôt que la vitesse (utile en environnement embarqué, espace disque limité) |

Trois techniques courantes expliquent le gain :

- **Inlining** : le corps d'une petite fonction est recopié directement à chaque endroit où elle est appelée, ce qui évite le coût d'un appel de fonction (sauvegarde de contexte, saut, retour).
- **Élimination de code mort** : tout calcul dont le résultat n'est jamais utilisé est retiré du binaire final.
- **Déroulement de boucles** (*loop unrolling*) : le corps d'une boucle est dupliqué plusieurs fois pour réduire le nombre de tours de boucle (et donc de tests de condition), au prix d'un binaire plus gros.

```bash
gcc -O2 main.c -o programme
```

> **Piège :** l'inlining peut faire apparaître un avertissement invisible à `-O0`. Exemple : une fonction qui renvoie `-1` en cas d'erreur, dont le résultat sert ensuite à calculer une taille passée à `malloc()`. À `-O0`, le compilateur voit deux fonctions séparées et ne peut pas relier les deux valeurs. Une fois inlinée par `-O2`, il voit le calcul complet d'un coup et peut détecter qu'un `malloc()` recevrait une taille négative (donc gigantesque une fois convertie en `size_t`) -- averti par `-Walloc-size-larger-than=` (inclus dans `-Wall -Wextra`, voir [Les Makefiles](/?c=langages-de-programmation&s=c&p=makefiles)), qui devient une erreur bloquante si `-Werror` est actif. Un code sans avertissement à `-O0` peut donc échouer à compiler dès `-O2` : toujours tester la compilation au niveau d'optimisation réellement utilisé en production, pas seulement `-O0`.

## Cibler le processeur (`-march=native`) et compiler avec des threads (`-pthread`)

Par défaut, le compilateur produit un programme qui tourne sur **tous** les processeurs de la même famille, y compris les plus anciens : il s'interdit les instructions récentes. `-march=native` l'autorise à utiliser toutes les instructions du processeur **de la machine qui compile**.

```bash
gcc -O2 -march=native -c compter.c    # compter.c : return __builtin_popcount(x);
```

| Compilation | Code produit pour `__builtin_popcount(x)` (vérifié avec `objdump -d`) |
|---|---|
| `gcc -O2` | Un appel à une fonction d'aide qui compte les bits en plusieurs étapes |
| `gcc -O2 -march=native` | Une seule instruction du processeur, `popcnt` |

> **Piège :** un programme compilé avec `-march=native` peut s'arrêter avec l'erreur `Illegal instruction` sur une machine dont le processeur est plus ancien. À réserver aux programmes qui tournent sur la machine où ils sont compilés (calcul, mesures), jamais à un exécutable distribué.

Pour un programme qui utilise des [threads](/?c=langages&s=c&p=threads), on passe `-pthread` **à la compilation et à l'édition de liens** :

```bash
gcc -Wall -pthread -o programme programme.c
```

| Option | Effet |
|---|---|
| `-pthread` | Définit les réglages nécessaires aux threads (la macro `_REENTRANT`) **et** ajoute la bibliothèque des threads à l'édition de liens |
| `-lpthread` | Ajoute seulement la bibliothèque, sans les réglages de compilation |

Depuis la version 2.34 de la bibliothèque C de Linux (glibc), les fonctions de threads font partie de la bibliothèque C elle-même : un programme se lie souvent même sans option. `-pthread` reste la façon portable de compiler, valable aussi sur les systèmes plus anciens.

## Erreurs de compilation vs erreurs d'édition de liens

Savoir à quelle étape une erreur survient aide à la diagnostiquer :

| Message typique | Étape concernée | Cause fréquente |
|---|---|---|
| `error: expected ';' before...` | Compilation | Erreur de syntaxe dans le code source |
| `fatal error: xxx.h: No such file or directory` | Préprocesseur | Fichier d'en-tête introuvable (voir [Les fichiers d'en-tête](/?c=langages-de-programmation&s=c&p=headers)) |
| `undefined reference to 'ma_fonction'` | Édition de liens | Fonction déclarée mais jamais définie/liée (fichier `.o` ou bibliothèque manquante) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un programme C passe par 4 étapes avant l'exécution : préprocesseur → compilation (assembleur) → assemblage (code machine, `.o`) → édition de liens (exécutable final). Le niveau d'optimisation (`-O0` à `-O3`, `-Os`) se règle à l'étape de compilation. |
| **Outils utilisables** | `gcc -E`/`-S`/`-c` pour observer chaque étape séparément ; `-O0` à `-O3`/`-Os` pour régler le niveau d'optimisation ; `-march=native` pour le processeur de la machine ; `-pthread` pour un programme à threads. |
| **Pièges à éviter** | Confondre une erreur de compilation (syntaxe) avec une erreur d'édition de liens (`undefined reference`, fonction jamais liée) : le message indique l'étape concernée. Un avertissement invisible à `-O0` (masqué par deux fonctions non inlinées) peut apparaître, voire bloquer la compilation avec `-Werror`, dès `-O2`. |
| **Bonnes pratiques** | Compiler chaque fichier `.c` en `.o` séparément sur un projet à plusieurs fichiers, pour ne relier que ce qui a changé plutôt que tout recompiler. Tester la compilation au niveau d'optimisation réellement utilisé en production, pas seulement `-O0`. |
