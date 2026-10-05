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

## Plusieurs fichiers et inlining : unité de compilation, `static inline`, `-flto`

Une **unité de compilation** est un fichier `.c` tel que le voit l'étape 2 : son propre code, plus tout ce que ses `#include` y ont recopié à l'étape 1. Le compilateur traite **une seule unité à la fois** : il ne voit jamais le contenu des autres `.c` du projet.

Conséquence directe pour l'[inlining](#les-niveaux-d-optimisation-o0-a-o3-os) : le compilateur ne peut recopier le corps d'une fonction que s'il le voit. Une fonction définie dans un autre `.c` reste un vrai appel, même en `-O3`.

```c
/* carre.h */
int carre(int x);                     // déclaration seule : le corps est ailleurs

/* carre.c */
#include "carre.h"
int carre(int x) { return x * x; }    // la définition, dans une autre unité

/* main.c */
#include <stdio.h>
#include "carre.h"
int main(void) {
    long somme = 0;
    for (int i = 0; i < 1000; i++)
        somme += carre(i);            // main.c ne voit que la déclaration
    printf("%ld\n", somme);           // affiche 332833500
    return 0;
}
```

Trois façons d'obtenir l'inlining malgré le découpage en fichiers, vérifiées avec [`objdump -d`](https://sourceware.org/binutils/docs/binutils/objdump.html) sur l'exécutable final :

| Façon de compiler | `call carre` dans `main` ? | Principe |
|---|---|---|
| `carre.c` et `main.c` compilés séparément (`-O2`) | Oui | Chaque unité est optimisée seule : l'appel reste |
| `static inline int carre(int x) { return x * x; }` écrit dans `carre.h` | Non | Le corps est recopié dans chaque unité qui inclut l'[en-tête](/?c=langages&s=c&p=headers) |
| `-flto` à la compilation **et** à l'édition de liens | Non | *Link-Time Optimization* : les `.o` gardent une forme intermédiaire du code, et l'édition de liens optimise tout le programme d'un coup |
| `-flto` oublié pour `main.c` seulement | Oui | Une unité compilée sans `-flto` ne contient que du code machine : rien à réoptimiser |

```bash
gcc -O2 -flto -c main.c -o main.o     # -flto à la compilation de CHAQUE fichier
gcc -O2 -flto -c carre.c -o carre.o
gcc -O2 -flto main.o carre.o -o prog  # ... et à l'édition de liens
```

| Méthode | Avantage | Inconvénient |
|---|---|---|
| Tout dans un seul `.c` | Aucune option à retenir | Fichier long, difficile à relire |
| `static inline` dans un en-tête | Fonctionne avec n'importe quelle compilation | Réservé aux petites fonctions ; une copie par unité qui l'utilise |
| `-flto` | Inlining entre tous les fichiers, sans rien changer au code | Édition de liens plus lente ; l'oubli sur un seul fichier passe inaperçu |

> **Piège :** une fonction ordinaire (sans `static`) définie dans un en-tête inclus par deux `.c` provoque l'erreur `multiple definition of 'carre'` à l'édition de liens : chaque unité en contient une copie publique. Et `inline` seul, sans `static`, suit en C des règles subtiles (il faut en plus une définition non-`inline` dans un seul `.c`) : `static inline` est la forme sûre.

**Ce que ça change en pratique.** Le [solveur SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) du projet d'où viennent ces mesures est passé d'un fichier unique de 1 424 lignes à 7 fichiers `.c`. Les fonctions appelées à chaque étape de calcul (des centaines de millions de fois par grille) sont toutes restées dans la même unité, ou en `static inline` dans les en-têtes. Résultat : aucun ralentissement (même 2,7 % plus rapide), et `-flto` n'a rien apporté de plus (+0,9 % par rapport au fichier unique, et même 3,8 % plus lent que le découpage seul). Découper un programme n'a donc pas de coût, à condition de garder ensemble ce qui s'appelle très souvent : [mesurer](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) avant et après le découpage.

## L'optimisation guidée par profil (PGO)

À la compilation, `gcc` ne sait pas quelles branches d'un `if` seront prises le plus souvent : il devine. L'**optimisation guidée par profil** (*Profile-Guided Optimization*, PGO) remplace cette devinette par des comptes réels, mesurés sur une exécution d'essai, pour mieux ranger le code : les chemins fréquents d'un seul tenant, les chemins rares mis à l'écart.

```text
tri.c --[gcc -fprofile-generate]--> tri (instrumenté, compte ses passages)
tri   --[exécution d'entraînement]--> tri.gcda (le profil : les comptes)
tri.c + tri.gcda --[gcc -fprofile-use]--> tri (optimisé d'après les comptes)
```

```c
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    int n = argc > 1 ? atoi(argv[1]) : 1000, petits = 0, grands = 0;
    for (int i = 0; i < n; i++) {
        if (i % 100 == 0) grands++;   // branche rare : 1 fois sur 100
        else petits++;                // branche fréquente
    }
    printf("%d petits, %d grands\n", petits, grands);
    return 0;
}
```

```bash
gcc -O2 -fprofile-generate tri.c -o tri   # 1. version instrumentée
./tri 1000000                             # 2. entraînement : écrit tri.gcda en sortant
gcc -O2 -fprofile-use tri.c -o tri        # 3. recompilation d'après le profil
```

Les options sont décrites dans la [documentation de GCC](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html). Sur le solveur SAT cité plus haut, la PGO a gagné 3,4 %, avec exactement le même travail effectué (mêmes compteurs de calcul) : un gain modeste mais gratuit une fois automatisé dans un [Makefile](/?c=langages&s=c&p=makefiles).

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Nom de sortie différent entre les étapes 1 et 3 (`-o tri_instr`, puis `-o tri`) | Le profil s'appelle `tri_instr-tri.gcda`, l'étape 3 cherche `tri.gcda` : simple **avertissement** `profile count data file not found`, et le programme est compilé **sans** PGO | Même nom de sortie (ou mêmes fichiers `.o`) aux deux étapes, et vérifier l'absence de cet avertissement |
| Sources modifiées après l'entraînement | Erreur `coverage-mismatch` : le profil ne correspond plus au code | Refaire les trois étapes à chaque modification |
| Programme terminé par `_exit()`, tué par un signal, ou processus enfant qui sort par `_exit()` | Aucun `.gcda` écrit : le profil est enregistré par la sortie normale ([`exit()` ou `return` dans `main`](/?c=langages&s=c&p=exit-et-codes-de-retour)), que `_exit()` court-circuite | Entraîner sur une exécution qui se termine normalement (dans le solveur : en processus seul, sans les [processus enfants](/?c=langages&s=c&p=processus) du mode parallèle) |
| Entraînement sur les mêmes données que la mesure de vitesse | Le programme est optimisé pour le test lui-même : gain surestimé | Entraîner sur d'autres entrées que celles de la mesure |

## Le canari de pile (`-fstack-protector`)

Un [dépassement de tampon](/?c=securite&s=securite-offensive&p=corruption-memoire#le-buffer-overflow-ecrire-au-dela-de-l-espace-reserve) sur la pile peut écraser l'adresse à laquelle la fonction doit revenir. Le **canari** est une valeur secrète que le compilateur place entre les tableaux locaux et cette adresse, puis vérifie juste avant le retour : si elle a changé, le programme s'arrête aussitôt (le nom vient des canaris que les mineurs emportaient pour détecter le gaz avant qu'il ne soit trop tard).

```c
#include <stdio.h>
__attribute__((noinline)) static void copier(const char *texte) {
    char tampon[8];                   // 8 octets réservés sur la pile
    for (int i = 0; texte[i]; i++)    // copie sans vérifier la longueur
        tampon[i] = texte[i];
    printf("copié : %.8s\n", tampon);
}
int main(int argc, char **argv) {
    copier(argc > 1 ? argv[1] : "court");
    return 0;
}
```

Avec un argument de 40 caractères (le tampon n'en contient que 8) :

| Compilation | Affichage | Code de sortie |
|---|---|---|
| `gcc -O2` (réglage par défaut du GCC d'Ubuntu : `-fstack-protector-strong`) | `copié : AAAAAAAA` puis `*** stack smashing detected ***: terminated` | 134 : arrêt volontaire ([signal](/?c=langages&s=c&p=signaux-unix#les-signaux-courants) `SIGABRT`, 128 + 6) |
| `gcc -O2 -fno-stack-protector` | `copié : AAAAAAAA` puis plantage | 139 : erreur de segmentation (`SIGSEGV`, 128 + 11), plus tard et moins clairement |

Le coût : quelques instructions dans chaque fonction qui a un tableau local (`objdump -d` montre la lecture de la valeur secrète, `mov %fs:0x28`, sa comparaison au retour, et l'appel à `__stack_chk_fail`). Sur le solveur SAT, `-fno-stack-protector` a gagné environ 1 %.

> **Piège :** avec `strcpy()` à la place de la boucle, le message devient `*** buffer overflow detected ***`, même avec `-fno-stack-protector`. C'est une **autre** protection d'Ubuntu, [`_FORTIFY_SOURCE`](https://man7.org/linux/man-pages/man7/feature_test_macros.7.html), qui remplace à `-O2` les fonctions de copie connues par des versions vérifiées. Retirer le canari ne retire donc pas toutes les protections, et une copie écrite à la main n'est couverte que par le canari.

| Situation | Canari |
|---|---|
| Programme qui lit des données extérieures (fichiers reçus, réseau, saisie d'un utilisateur) | Le garder, toujours |
| Programme de calcul aux entrées déjà validées, dont chaque pour cent compte | Le retirer est acceptable, **après** avoir mesuré le gain |

## Vérifier à la compilation : `_Static_assert`

Un contrôle ordinaire (`if`, `assert`) s'exécute **quand le programme tourne** : une valeur incohérente est découverte tard, parfois jamais. `_Static_assert(condition, "message");` (C11) vérifie une condition **pendant la compilation** : si elle est fausse, la compilation s'arrête avec le message et aucun programme n'est produit. Elle ne coûte rien à l'exécution, puisqu'elle ne génère aucun code.

| Outil | Vérifie | Condition portant sur | Si la condition est fausse |
|---|---|---|---|
| `if` + message d'erreur | à l'exécution | n'importe quelles valeurs | message, chemin d'échec prévu par le programme |
| `assert(c)` (`<assert.h>`) | à l'exécution, retiré par l'option `-DNDEBUG` (expliquée plus bas) | n'importe quelles valeurs | arrêt brutal du programme |
| `_Static_assert(c, "m")` | à la compilation | **constantes** seulement | compilation refusée |

La condition doit être une **expression constante entière** : calculable par le compilateur sans exécuter le programme (nombres écrits, `sizeof`, constantes `#define`).

**Cas typique : des constantes surchargeables par `-D`.** L'option `-DNOM=valeur` de `gcc` définit une macro comme si le fichier commençait par `#define NOM valeur`. Un projet l'utilise pour régler des limites sans toucher au code ; un `#ifndef` (« si non défini ») donne la valeur par défaut. Rien ne garantit alors que les valeurs fournies restent cohérentes entre elles :

```c
#ifndef ZOOM_MIN                  /* si la ligne de commande ne l'a pas défini... */
# define ZOOM_MIN 1               /* ...valeur par défaut */
#endif
#ifndef ZOOM_MAX
# define ZOOM_MAX 10
#endif

_Static_assert(ZOOM_MIN < ZOOM_MAX, "ZOOM_MIN doit etre inferieur a ZOOM_MAX");
```

```text
$ gcc -std=c11 -DZOOM_MIN=20 main.c
main.c:10:1: error: static assertion failed: "ZOOM_MIN doit etre inferieur a ZOOM_MAX"
```

Sans cette vérification, rien ne signale l'erreur : un `clamp` (borner une valeur entre un minimum et un maximum) écrit `fminf(fmaxf(x, ZOOM_MIN), ZOOM_MAX)` avec un minimum de 20 et un maximum de 10 renvoie **toujours 10**, quelle que soit `x` (mesuré avec `x = 5`). Le message nomme la constante fautive et la relation attendue.

`_Static_assert` sert aussi à vérifier une hypothèse sur la machine, par exemple `_Static_assert(sizeof(int) >= 4, "int trop petit");`, pour qu'un programme compilé sur une plateforme inattendue échoue à la compilation plutôt qu'à l'exécution. En C11, `static_assert` (sans le tiret bas) existe aussi, via `#include <assert.h>` ; depuis C23 (`-std=c2x` sous `gcc` 13), c'est un mot-clé et le message est facultatif.

**Constantes flottantes : un avertissement à faire taire à cet endroit seulement.** Une comparaison de `float` (`NEAR_PLANE < FAR_PLANE`) n'est pas une expression constante *entière* : `gcc` l'accepte, mais l'option `-Wpedantic` (« pédant » : avertir de tout ce que la norme C n'autorise pas strictement) le signale :

```text
warning: expression in static assertion is not an integer constant expression [-Wpedantic]
```

Une directive `#pragma` est une instruction donnée au compilateur (comme `#pragma once`, voir [Les fichiers d'en-tête](/?c=langages-de-programmation&s=c&p=headers)). Trois lignes `#pragma GCC diagnostic` limitent le silence à l'assertion :

```c
#pragma GCC diagnostic push                       /* sauvegarde l'état des avertissements */
#pragma GCC diagnostic ignored "-Wpedantic"       /* coupe celui-ci à partir d'ici */
_Static_assert(NEAR_PLANE > 0.0f && NEAR_PLANE < FAR_PLANE, "plans near/far incoherents");
#pragma GCC diagnostic pop                        /* restaure : le reste du fichier reste contrôlé */
```

`push` et `pop` encadrent le silence : couper `-Wpedantic` pour tout le fichier masquerait de vrais problèmes ailleurs. Ces directives sont reconnues par `gcc` et `clang` (pas par le compilateur de Microsoft, qui a sa propre syntaxe).

> **Piège :** `_Static_assert` ne peut pas tester une valeur lue à l'exécution (argument de fonction, variable, entrée de l'utilisateur) : pour celles-là, un `if` avec un message d'erreur reste nécessaire.

## Quand un `snprintf` peut tronquer : `-Wformat-truncation`

`snprintf(tampon, taille, format, ...)` n'écrit jamais plus de `taille` octets : il ne déborde pas, mais il **tronque en silence** si le résultat est plus long. Le compilateur sait souvent le prédire : l'avertissement `-Wformat-truncation` (niveau 1, inclus dans `-Wall`) se déclenche quand il prouve que le résultat **peut** dépasser le tampon. Il connaît la longueur maximale d'un `%s` quand une **précision** la borne : `%.200s` écrit au plus 200 caractères.

```c
#include <stdio.h>

int main(int argc, char **argv)
{
	char path[64];                                  /* 64 octets, '\0' compris */

	if (argc < 3)
		return 1;
	snprintf(path, sizeof path, "%.200s/shaders/%.200s", argv[1], argv[2]);
	puts(path);
	return 0;
}
```

```text
$ gcc -Wall -c main.c
main.c:9:38: warning: '%.200s' directive output may be truncated writing up to 200 bytes into a region of size 64 [-Wformat-truncation=]
note: '__builtin___snprintf_chk' output between 10 and 410 bytes into a destination of size 64
```

Avec deux arguments de 100 caractères, le programme ne garde que 63 caractères du chemin (le 64e octet est le `\0` final) : sans l'avertissement, rien ne le signale, et le programme ouvre ensuite un fichier qui n'est pas celui demandé. L'avertissement chiffre le pire cas : `200 + 9 + 200` caractères plus le `\0`, soit 410 octets pour un tampon de 64.

**Dimensionner le tampon pour le pire cas, pas pour le cas courant.** La taille se calcule en additionnant les maxima de chaque champ (chacun borné par sa précision), le texte fixe, et 1 pour le `\0` :

| Morceau du format | Octets au plus |
|---|---|
| `%.200s` (dossier) | 200 |
| `/shaders/` (texte fixe) | 9 |
| `%.200s` (nom) | 200 |
| `\0` final | 1 |
| **Total** | **410** |

```c
#define DIR_MAX 200
#define NAME_MAX_LEN 200

/* taille du pire cas : 200 + 9 + 200 + '\0' */
char path[DIR_MAX + sizeof "/shaders/" + NAME_MAX_LEN];

snprintf(path, sizeof path, "%.*s/shaders/%.*s", DIR_MAX, argv[1], NAME_MAX_LEN, argv[2]);
```

`sizeof "/shaders/"` vaut 10 : il compte déjà le `\0`. Les constantes nommées servent à la fois au tampon et aux précisions (`%.*s` prend la précision en argument), donc elles ne peuvent plus se désynchroniser. Le même programme ne produit alors plus aucun avertissement.

| À ne pas faire | Pourquoi |
|---|---|
| Ajouter `-Wno-format-truncation` pour faire taire l'avertissement | La troncature reste : seul le signal disparaît |
| Agrandir le tampon « au hasard » (`char path[256]`) | Rien ne prouve que 256 suffit : refaire la somme des maxima |
| Ignorer la valeur renvoyée par `snprintf` | Elle donne la longueur qui aurait été écrite : `n >= sizeof path` signifie tronqué |

Quand les longueurs ne sont pas bornées à la compilation (chemin lu depuis l'extérieur), l'avertissement ne peut rien prouver : tester le retour (`n < 0 || (size_t)n >= sizeof path`) et refuser avec un message qui nomme la valeur trop longue. Le niveau 2 (`-Wformat-truncation=2`, voir la [documentation de GCC](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html)) pousse l'analyse aux cas où la longueur est inconnue ; il est plus bavard. Pour `snprintf` en lui-même, voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire).

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
| **À retenir** | Un programme C passe par 4 étapes avant l'exécution : préprocesseur → compilation (assembleur) → assemblage (code machine, `.o`) → édition de liens (exécutable final). Le niveau d'optimisation (`-O0` à `-O3`, `-Os`) se règle à l'étape de compilation. Le compilateur ne voit qu'une unité de compilation à la fois : sans `static inline` ni `-flto`, une fonction d'un autre `.c` n'est jamais inlinée. La PGO optimise d'après une exécution d'essai ; le canari de pile arrête un programme dont un tampon local a débordé. `_Static_assert(condition, "message")` vérifie une condition constante à la compilation, sans coût à l'exécution. |
| **Outils utilisables** | `gcc -E`/`-S`/`-c` pour observer chaque étape séparément ; `-O0` à `-O3`/`-Os` pour régler le niveau d'optimisation ; `-march=native` pour le processeur de la machine ; `-pthread` pour un programme à threads ; `static inline` et `-flto` pour l'inlining entre fichiers ; `-fprofile-generate`/`-fprofile-use` pour la PGO ; `objdump -d` pour vérifier le code produit. `_Static_assert` (C11) ; `-DNOM=valeur` pour régler une constante ; `#pragma GCC diagnostic push`/`ignored`/`pop` pour couper un avertissement sur quelques lignes. |
| **Pièges à éviter** | Confondre une erreur de compilation (syntaxe) avec une erreur d'édition de liens (`undefined reference`, fonction jamais liée) : le message indique l'étape concernée. Un avertissement invisible à `-O0` (masqué par deux fonctions non inlinées) peut apparaître, voire bloquer la compilation avec `-Werror`, dès `-O2`. Oublier `-flto` sur un seul fichier, ou changer de nom de sortie entre les deux étapes de la PGO : l'optimisation disparaît sans erreur. Retirer le canari d'un programme qui lit des données extérieures. Laisser des constantes surchargeables par `-D` sans vérifier leur cohérence (un `clamp` dont le minimum dépasse le maximum renvoie toujours le maximum), couper `-Wpedantic` pour tout un fichier, tester avec `_Static_assert` une valeur connue seulement à l'exécution. |
| **Bonnes pratiques** | Compiler chaque fichier `.c` en `.o` séparément sur un projet à plusieurs fichiers, pour ne relier que ce qui a changé plutôt que tout recompiler. Tester la compilation au niveau d'optimisation réellement utilisé en production, pas seulement `-O0`. Garder dans une même unité (ou en `static inline`) les fonctions appelées très souvent, et mesurer avant et après tout découpage ou changement d'option. Vérifier à la compilation, avec un message qui nomme la constante fautive, la cohérence des constantes entre elles et les hypothèses sur la machine ; limiter un `#pragma GCC diagnostic ignored` par `push` et `pop`. |
