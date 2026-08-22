---
order: 8
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
| **À retenir** | Un programme C passe par 4 étapes avant l'exécution : préprocesseur → compilation (assembleur) → assemblage (code machine, `.o`) → édition de liens (exécutable final). |
| **Outils utilisables** | `gcc -E`/`-S`/`-c` pour observer chaque étape séparément. |
| **Pièges à éviter** | Confondre une erreur de compilation (syntaxe) avec une erreur d'édition de liens (`undefined reference`, fonction jamais liée) : le message indique l'étape concernée. |
| **Bonnes pratiques** | Compiler chaque fichier `.c` en `.o` séparément sur un projet à plusieurs fichiers, pour ne relier que ce qui a changé plutôt que tout recompiler. |
