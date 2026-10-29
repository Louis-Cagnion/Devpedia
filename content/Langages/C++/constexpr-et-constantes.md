---
order: 12
---

# `constexpr` et les constantes en C++ (28/10/2026)

Un programme manipule des valeurs qui ne changent jamais : la taille d'une case dans un jeu (64 pixels, un **pixel** étant un point de l'écran), le nombre maximal de vies, la valeur de pi. Une **constante** est une telle valeur, associée à un nom et qui ne change plus, par opposition à une [variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), dont la valeur peut changer. Le C++ propose trois outils pour en créer : `#define`, `const` et [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr). Ils s'utilisent presque pareil et se distinguent par **le moment où la valeur est connue**, par leur **type** et par leur **portée** (la zone du code où le nom existe). Ce chapitre les compare sur un fil rouge : la taille d'une case, `TILE_SIZE = 64`, rangée dans une classe de jeu (le mot anglais *tile* désigne une case de plateau).

| Thème | Question à laquelle il répond | Section |
|---|---|---|
| Le problème | Pourquoi nommer une valeur plutôt que l'écrire partout ? | [Une constante](#une-constante-donner-un-nom-a-une-valeur) |
| Deux moments | Qu'est-ce que la compilation, l'exécution, une expression constante ? | [Compilation et exécution](#compilation-et-execution-deux-moments) |
| Les trois outils | Que fait chacun, et que risque-t-on ? | [`#define`](#define-un-remplacement-de-texte), [`const`](#const-une-valeur-fixee-a-l-initialisation), [`constexpr`](#constexpr-une-valeur-connue-a-la-compilation) |
| Comparaison | Lequel choisir selon le besoin ? | [Le tableau comparatif](#comparer-define-const-et-constexpr) |
| Dans une classe | Où ranger `TILE_SIZE`, et comment le lire de l'extérieur ? | [La portée](#la-portee-d-une-constante), [le membre `static constexpr`](#le-membre-static-constexpr-d-une-classe) |
| Selon le standard | Que change C++17 ? Que peut calculer `constexpr` ? | [Avant et depuis C++17](#avant-et-depuis-c-17-la-definition-hors-de-la-classe), [fonctions et `static_assert`](#ce-que-constexpr-sait-calculer-fonctions-et-static-assert) |

Le chapitre suppose connus [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) et leurs types, [les classes et objets](/?c=langages&s=cpp&p=classes-et-objets) (dont `public` et `private`) et [les espaces de noms](/?c=langages&s=cpp&p=espaces-de-noms). Pour le préprocesseur et l'option `-D`, il s'appuie sur [le processus de compilation](/?c=langages&s=c&p=compilation), écrit pour le C mais valable tel quel en C++. Les valeurs qui dépendent de la version du langage sont citées par **standard** (ou **norme** : une version officielle du langage, C++11, C++14, C++17, C++20). Tous les exemples ont été compilés avec `g++`, le compilateur C++ de GCC (*GNU Compiler Collection*, une suite de compilateurs libres), depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) :

```bash
# -std=c++17 : choisit le standard ; -Wall -Wextra -pedantic : affichent les avertissements
# -o programme : nom du fichier produit ; ./programme : lance ce fichier
g++ -std=c++17 -Wall -Wextra -pedantic fichier.cpp -o programme
./programme
```

## Une constante : donner un nom à une valeur

Un **littéral** est une valeur écrite directement dans le code : `64`, `3.14`, `'a'`, `"texte"`, `true`. Dans le programme suivant, `int` est le **type** « nombre entier » (voir [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)) et `#include <iostream>` insère l'en-tête qui fournit `std::cout` (voir [les fichiers d'en-tête](/?c=langages&s=c&p=headers) et [les espaces de noms](/?c=langages&s=cpp&p=espaces-de-noms) pour le préfixe `std::`). L'opérateur `<<` envoie une valeur vers `std::cout`, et `"\n"` est un saut de ligne.

```cpp
#include <iostream>   // std::cout : affiche du texte dans le terminal

int main()   // point d'entrée : le programme commence ici
{
    int largeur = 10 * 64;      // 10 cases de large : 64 est-il la taille d'une case ?
    int hauteur = 8 * 64;       // 8 cases de haut : le même 64, réécrit
    int departCase3 = 3 * 64;   // pixel où commence la case 3 : encore 64
    std::cout << largeur << " x " << hauteur << ", case 3 en x = " << departCase3 << "\n";
    return 0;   // 0 : le programme s'est bien terminé
}
```

```text
640 x 512, case 3 en x = 192
```

Le littéral `64` apparaît trois fois sans nom : c'est un **nombre magique**, dont le lecteur doit deviner le sens. Passer les cases à 48 pixels oblige à retrouver chaque `64` sans confondre ceux qui désignent autre chose. Donner un nom à la valeur règle les deux problèmes : le sens est écrit, et le changement se fait à un seul endroit. Voici les trois écritures possibles, côte à côte :

```cpp
#include <iostream>   // std::cout : affiche du texte dans le terminal

#define TAILLE_MACRO 64                // macro : le préprocesseur remplacera ce nom par 64
const int TAILLE_CONST = 64;           // const : variable de type int en lecture seule
constexpr int TAILLE_CONSTEXPR = 64;   // constexpr : constante int connue à la compilation

int main()
{
    // les trois noms s'utilisent de la même façon et affichent la même valeur
    std::cout << TAILLE_MACRO << " " << TAILLE_CONST << " " << TAILLE_CONSTEXPR << "\n";
    return 0;
}
```

```text
64 64 64
```

| Écriture | Ce que c'est |
|---|---|
| `#define TAILLE_MACRO 64` | Une **macro** : un texte que le préprocesseur remplacera avant la compilation |
| `const int TAILLE_CONST = 64;` | Une **variable** qu'on s'interdit de modifier |
| `constexpr int TAILLE_CONSTEXPR = 64;` | Une **constante** dont le compilateur connaît la valeur |

## Compilation et exécution : deux moments

Un programme C++ vit à deux moments distincts, détaillés dans [le processus de compilation](/?c=langages&s=c&p=compilation) :

```text
 fichier .cpp --[ compilation : g++ ]--> programme --[ exécution : ./programme ]--> résultat
 (votre texte)   le compilateur lit    (un fichier)   le programme tourne ;
                 le code ; il ne voit                 il lit le clavier, des
                 aucune saisie                        fichiers, le réseau...
```

| Moment | Définition | Ce qui y est connu |
|---|---|---|
| **Compilation** | Le **compilateur** traduit le texte du code en un programme que l'ordinateur sait lancer | Ce qui est écrit dans le code : littéraux, constantes, calculs sur ces valeurs |
| **Exécution** | Le programme tourne | En plus : ce que tape l'utilisateur, le contenu d'un fichier, l'heure |

Une **expression** est un calcul écrit dans le code (`8 * 8`, `x + 1`). Une **expression constante** est une expression que le compilateur peut calculer seul, sans lancer le programme, parce qu'elle ne dépend que de valeurs connues à la compilation. Le tableau suivant cite `lireTaille()`, une **fonction** (un bloc de code nommé qu'on appelle pour obtenir un résultat) qui lit un nombre au clavier ; elle sert dans plusieurs exemples du chapitre.

| Expression | Constante ? | Pourquoi |
|---|---|---|
| `64` | oui | un littéral |
| `8 * 8` | oui | un calcul sur des littéraux |
| `TILE_SIZE * 10` (avec `TILE_SIZE` défini à 64) | oui | un calcul sur une constante connue |
| `lireTaille()` (fonction qui lit le clavier) | non | le résultat dépend de ce que l'utilisateur tape |

Certains endroits du langage **exigent** une expression constante : la taille d'un **tableau** (une rangée de cases contiguës du même type, par exemple 80 entiers : `cases[0]` désigne la première, `cases[1]` la suivante), la valeur écrite entre chevrons dans un [template](/?c=langages&s=cpp&p=templates), comme le 80 de `std::array<int, 80>`, et la condition d'un [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert) (une vérification faite à la compilation, vue plus bas). Les trois outils du chapitre se jugent d'abord sur cette exigence.

## `#define` : un remplacement de texte

Le **préprocesseur** est la première étape de la compilation : un programme qui lit le code avant le compilateur et traite toute ligne commençant par `#` (voir [le préprocesseur](/?c=langages&s=c&p=compilation#1-le-preprocesseur)). La ligne `#define NOM texte` crée une **macro** : partout où `NOM` apparaît ensuite, le préprocesseur le remplace par `texte`, comme la fonction « rechercher et remplacer » d'un éditeur de texte.

```cpp
#include <iostream>   // std::cout : affiche du texte dans le terminal

#define TILE_SIZE 64                      // le préprocesseur remplacera TILE_SIZE par 64
#define LARGEUR_FENETRE (TILE_SIZE * 10)  // un nom de macro peut en contenir un autre

int main()
{
    std::cout << LARGEUR_FENETRE << "\n";   // devient : std::cout << (64 * 10) << "\n";
    return 0;
}
```

```text
640
```

On peut demander au préprocesseur de s'arrêter après son travail et d'afficher le résultat. Le fichier ci-dessus s'appelle ici `macro.cpp` :

```bash
# -E : s'arrête après le préprocesseur ; -P : n'ajoute pas de lignes de repérage
# | : envoie le résultat de g++ à la commande suivante
# tail -n 5 : garde les 5 dernières lignes
g++ -std=c++17 -E -P macro.cpp | tail -n 5
```

```text
int main()
{
    std::cout << (64 * 10) << "\n";
    return 0;
}
```

`LARGEUR_FENETRE` et `TILE_SIZE` ont disparu : le compilateur ne voit que `(64 * 10)`. Trois conséquences en découlent.

### Aucun type

Le compilateur ne voit que le texte remplacé : le type d'une macro est simplement celui de ce texte (`64` est un entier, `0.5` un nombre à virgule), jamais un type choisi. Avec `constexpr`, le type s'écrit :

```cpp
#include <iostream>   // std::cout

#define RATIO_MACRO 0.5                  // aucun type écrit : 0.5 est un double
constexpr float RATIO_CONSTEXPR = 0.5;   // le type est écrit : float

int main()
{
    // sizeof donne la taille en octets (un octet : l'unité de mesure de la mémoire)
    std::cout << sizeof(RATIO_MACRO) << " " << sizeof(RATIO_CONSTEXPR) << "\n";
    return 0;
}
```

```text
8 4
```

`sizeof` donne la taille d'une valeur en octets. `float` et `double` sont deux types de nombres à virgule ; le `double`, plus précis, occupe 8 octets. Le littéral `0.5` est un `double`, alors que la constante déclarée `float` n'en occupe que 4.

### Aucune portée

Une macro existe de la ligne `#define` jusqu'à la fin du fichier, quel que soit l'endroit où elle a été écrite : dans une fonction, dans une classe, dans un espace de noms. Fichier `macro_portee.cpp` :

```cpp
#include <iostream>   // std::cout

void dessiner()
{
#define MARGE 8   // définie ici, au milieu d'une fonction...
    std::cout << "dessiner : " << MARGE << "\n";
}

void deplacer()
{
    std::cout << "deplacer : " << MARGE << "\n";   // ...mais visible ici : pas de portée
}

int main()
{
    dessiner();   // appelle la première fonction
    deplacer();   // appelle la seconde
    return 0;
}
```

```text
dessiner : 8
deplacer : 8
```

### Des collisions selon l'ordre d'inclusion

Deux fichiers d'en-tête de [bibliothèques](/?c=langages&s=c&p=bibliotheques) différentes peuvent définir une macro du même nom. Le fichier `lib_a.h`, avec sa **garde d'inclusion** (le `#ifndef` « si non défini », fermé par `#endif`, qui empêche d'insérer un fichier deux fois, voir [les en-têtes](/?c=langages&s=c&p=headers)) :

```cpp
#ifndef LIB_A_H      // garde d'inclusion : ce fichier ne s'insère qu'une fois par programme
#define LIB_A_H
#define LARGEUR 10   // la bibliothèque A compte 10 cases de large
#endif
```

Le fichier `lib_b.h` :

```cpp
#ifndef LIB_B_H
#define LIB_B_H
#define LARGEUR 20   // la bibliothèque B compte 20 cases de large : même nom, autre valeur
#endif
```

Deux programmes ne diffèrent que par l'ordre des `#include`. Le premier, `main_ab.cpp` :

```cpp
#include <iostream>   // std::cout
#include "lib_a.h"     // "..." : un fichier du projet, cherché à côté de ce fichier
#include "lib_b.h"     // inclus en second : sa définition de LARGEUR passe en dernier

int main()
{
    std::cout << "LARGEUR = " << LARGEUR << "\n";   // la dernière définition gagne
    return 0;
}
```

```text
lib_b.h:3: warning: "LARGEUR" redefined
lib_a.h:3: note: this is the location of the previous definition
LARGEUR = 20
```

Le second, `main_ba.cpp`, est identique, mais ses deux lignes `#include "lib_..."` sont inversées : `lib_b.h` d'abord, `lib_a.h` ensuite.

```text
lib_a.h:3: warning: "LARGEUR" redefined
lib_b.h:3: note: this is the location of the previous definition
LARGEUR = 10
```

La dernière définition gagne, et seul un avertissement le signale : le programme se compile et s'exécute. Changer l'ordre de deux `#include`, parfois fait par un outil de mise en forme, change donc la valeur utilisée. Les constantes placées dans un [espace de noms](/?c=langages&s=cpp&p=espaces-de-noms) évitent le problème : `LibA::LARGEUR` et `LibB::LARGEUR` sont deux noms différents.

```cpp
#ifndef NS_A_H
#define NS_A_H
namespace LibA {
    constexpr int LARGEUR = 10;   // LibA::LARGEUR : 10 cases de large
}
#endif
```

```cpp
#ifndef NS_B_H
#define NS_B_H
namespace LibB {
    constexpr int LARGEUR = 20;   // LibB::LARGEUR : 20 cases de large
}
#endif
```

```cpp
#include <iostream>   // std::cout
#include "ns_a.h"      // l'ordre d'inclusion n'a plus d'importance
#include "ns_b.h"

int main()
{
    // chaque nom porte le préfixe de son espace de noms : aucune collision
    std::cout << LibA::LARGEUR << " " << LibB::LARGEUR << "\n";
    return 0;
}
```

```text
10 20
```

### Ce que `#define` fait mieux

Une macro est **visible partout** (aucune portée) et peut être **réglée depuis la ligne de commande** par l'option `-D` du compilateur : `-DNOM=valeur` agit comme une ligne `#define NOM valeur` placée au début du fichier (voir [le cas des constantes réglables par `-D`](/?c=langages&s=c&p=compilation#verifier-a-la-compilation-static-assert)). Un projet s'en sert pour régler une limite sans toucher au code ; le `#ifndef` (« si non défini ») fournit la valeur par défaut. Le fichier ci-dessous s'appelle ici `taille_case.cpp` :

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE     // si la ligne de commande n'a pas défini TILE_SIZE (option -D)...
#define TILE_SIZE 64  // ...on prend cette valeur par défaut
#endif

int main()
{
    std::cout << "Case : " << TILE_SIZE << " pixels\n";   // affiche la valeur retenue
    return 0;
}
```

```bash
# && : lance la commande suivante seulement si la précédente a réussi
# sans -D : la valeur par défaut de #define s'applique
g++ -std=c++17 taille_case.cpp -o taille_case && ./taille_case
# -DTILE_SIZE=32 : le compilateur définit la macro avant de lire le fichier
g++ -std=c++17 -DTILE_SIZE=32 taille_case.cpp -o taille_case && ./taille_case
```

```text
Case : 64 pixels
Case : 32 pixels
```

| Atout de `#define` | Pourquoi `const` et `constexpr` ne l'ont pas |
|---|---|
| Visible dans tout le fichier, sans préfixe | Leur nom suit les règles de portée du langage |
| Réglable par `-D` sans modifier le code | Leur valeur est écrite dans le code |
| Utilisable dans `#if` (condition évaluée par le préprocesseur) | Le préprocesseur ne connaît pas les constantes du langage (voir les pièges) |

## `const` : une valeur fixée à l'initialisation

`const` (de « constant ») devant une variable interdit de la modifier après son **initialisation**, c'est-à-dire la première valeur qu'elle reçoit, à sa création (donner une valeur avec `=` s'appelle une **affectation**). Rien n'oblige cette valeur à être connue à la compilation : elle peut venir du clavier ou d'un fichier, donc n'exister qu'à l'exécution.

```cpp
#include <iostream>   // std::cin lit le clavier, std::cout écrit à l'écran

int lireTaille()   // fonction qui renvoie un entier (int) lu au clavier
{
    int valeur = 0;       // case qui recevra le nombre tapé
    std::cin >> valeur;   // attend que l'utilisateur tape un nombre, puis valide
    return valeur;        // renvoie ce nombre à celui qui a appelé la fonction
}

int main()
{
    const int tailleCase = lireTaille();   // const : fixée ici, pendant l'exécution
    std::cout << "Taille d'une case : " << tailleCase << "\n";
    return 0;
}
```

```text
Taille d'une case : 48
```

(Le programme attend un nombre : on tape `48`, puis Entrée. Lire un fichier au lieu du clavier donnerait le même résultat : la valeur n'est connue qu'à l'exécution.) La variable `tailleCase` est bien constante, car aucune ligne ne peut la modifier ensuite, mais le compilateur ignore sa valeur.

### Cas particulier : une `const` entière initialisée par un littéral

Quand une `const` de type entier est initialisée par une expression constante, le compilateur connaît sa valeur et l'accepte comme constante :

```cpp
#include <array>      // std::array
#include <iostream>   // std::cout

const int LARGEUR = 4;   // const initialisée par un littéral : valeur connue du compilateur

int main()
{
    int cases[LARGEUR] = {};               // accepté : LARGEUR vaut 4 dès la compilation
    std::array<int, LARGEUR> autres{};     // accepté aussi
    cases[LARGEUR - 1] = 9;                // la dernière case reçoit 9
    std::cout << autres.size() << " " << cases[3] << "\n";
    return 0;
}
```

```text
4 9
```

Cette règle historique est limitée : elle ne vaut que pour les types entiers. Avec un `double`, le compilateur refuse :

```cpp
const double RATIO = 2.0;   // const non entière, initialisée par un littéral

// > : « plus grand que » ; la condition doit être une expression constante
static_assert(RATIO > 1.0, "RATIO doit dépasser 1");

int main()
{
    return 0;
}
```

```text
const_double.cpp:4:21: error: non-constant condition for static assertion
const_double.cpp:4:15: error: the value of ‘RATIO’ is not usable in a constant expression
const_double.cpp:1:14: note: ‘RATIO’ was not declared ‘constexpr’
```

### Une `const` initialisée à l'exécution : inutilisable comme taille

Le piège principal de `const` : elle **ressemble** à une constante, mais rien ne garantit sa valeur à la compilation. Avec `std::array` (un tableau de taille fixe, écrite entre chevrons), l'erreur est franche :

```cpp
#include <array>      // std::array : tableau dont la taille s'écrit entre chevrons <>
#include <iostream>   // std::cin, std::cout

int lireTaille()   // lit un entier au clavier (voir l'exemple précédent)
{
    int valeur = 0;
    std::cin >> valeur;
    return valeur;
}

int main()
{
    const int taille = lireTaille();   // const, mais sa valeur n'existe qu'à l'exécution
    // {} : toutes les cases valent 0 au départ
    std::array<int, taille> cases{};   // ERREUR : taille inconnue à la compilation
    std::cout << cases.size() << "\n";   // size() : le nombre de cases
    return 0;
}
```

```text
tableau_const.cpp:15:27: error: the value of ‘taille’ is not usable in a constant expression
tableau_const.cpp:13:15: note: ‘taille’ was not initialized with a constant expression
```

Avec un tableau « à la C », GCC accepte le code par une extension (un **tableau à taille variable**, dont la taille est lue à l'exécution) et ne fait qu'avertir :

```cpp
#include <iostream>   // std::cin, std::cout

int lireTaille()   // lit un entier au clavier
{
    int valeur = 0;
    std::cin >> valeur;
    return valeur;
}

int main()
{
    const int taille = lireTaille();   // const : valeur connue seulement à l'exécution
    int cases[taille];                 // tableau C : GCC l'accepte, la norme C++ non
    cases[0] = 7;                      // la première case reçoit 7
    std::cout << "Cases : " << taille << ", première : " << cases[0] << "\n";
    return 0;
}
```

```text
tableau_vla.cpp:13:9: warning: ISO C++ forbids variable length array ‘cases’ [-Wvla]
Cases : 5, première : 7
```

(avec la saisie `5`). Le programme fonctionne, mais le C++ standard n'a pas ces tableaux : avec l'option `-pedantic-errors`, l'avertissement devient `error: ISO C++ forbids variable length array ‘cases’ [-Wvla]`, et d'autres compilateurs peuvent refuser le code : un même programme risque d'être valide chez l'un et faux chez l'autre.

## `constexpr` : une valeur connue à la compilation

`constexpr` (de *constant expression*, « expression constante ») déclare une constante **typée** dont la valeur **doit** être connue à la compilation. Le compilateur la calcule, et il refuse le programme s'il n'y parvient pas. `constexpr` existe depuis C++11 et implique `const` : on ne modifie pas la constante ensuite.

```cpp
#include <array>      // std::array : tableau dont la taille s'écrit entre chevrons <>
#include <iostream>   // std::cout

constexpr int LARGEUR = 10;                   // 10 cases de large
constexpr int HAUTEUR = 8;                    // 8 cases de haut
constexpr int NB_CASES = LARGEUR * HAUTEUR;   // calculée à la compilation : 80

int main()
{
    int cases[NB_CASES] = {};            // tableau C de 80 entiers, tous initialisés à 0
    std::array<int, NB_CASES> autres{};  // std::array de 80 entiers : la taille est acceptée
    cases[NB_CASES - 1] = 5;             // la dernière case reçoit 5
    std::cout << NB_CASES << " " << autres.size() << " " << cases[79] << "\n";
    return 0;
}
```

```text
80 80 5
```

`NB_CASES` est calculée par le compilateur (10 x 8), puis acceptée comme taille de tableau, ce que la `const` lue au clavier n'obtenait pas. Si la valeur dépend de l'exécution, le compilateur le dit immédiatement :

```cpp
#include <iostream>   // std::cin, std::cout

int lireTaille()   // lit un entier au clavier
{
    int valeur = 0;
    std::cin >> valeur;
    return valeur;
}

int main()
{
    constexpr int taille = lireTaille();   // ERREUR : la valeur dépend du clavier
    std::cout << taille << "\n";
    return 0;
}
```

```text
constexpr_saisie.cpp:12:38: error: call to non-‘constexpr’ function ‘int lireTaille()’
constexpr_saisie.cpp:3:5: note: ‘int lireTaille()’ declared here
```

L'erreur arrive à la compilation, avant que personne ne lance le programme : c'est tout l'intérêt. Le tableau suivant résume ce qui sépare `const` de `constexpr` :

| | `const` | `constexpr` |
|---|---|---|
| Garantit que la valeur ne change plus | oui | oui |
| Garantit que la valeur est connue à la compilation | non | oui, sinon erreur |
| Initialisation par la saisie ou un fichier | permise | refusée |
| Taille de tableau, argument de template, `static_assert` | seulement pour un entier initialisé par un littéral | toujours, pour tout type permis |
| S'applique à | toute variable | une variable, une fonction (voir plus bas) |

## Comparer `#define`, `const` et `constexpr`

| Critère | `#define` | `const` | `constexpr` |
|---|---|---|---|
| Nature | Texte remplacé par le préprocesseur | Variable en lecture seule | Constante calculée à la compilation |
| Type | Aucun : celui du texte remplacé | Oui | Oui |
| Portée | Aucune : de la ligne `#define` à la fin du fichier | Oui : bloc, classe, espace de noms | Oui : bloc, classe, espace de noms |
| Moment de la valeur | Avant la compilation (texte) | Initialisation, parfois à l'exécution | Compilation, obligatoirement |
| Taille de tableau | Oui | Seulement si la valeur est connue (entier initialisé par un littéral) | Oui |
| Réglage par `-D` | Oui | Non | Non (sauf en lisant une macro) |
| Utilisable dans `#if` | Oui | Non | Non |
| Message d'erreur | Cite le texte remplacé | Cite le nom | Cite le nom |
| Débogage | Le nom disparaît avant la compilation | Le nom est conservé | Le nom est conservé |

### Les messages d'erreur

Modifier la constante par erreur donne deux sortes de messages. Avec la macro :

```cpp
#define TILE_SIZE 64   // macro

int main()
{
    TILE_SIZE = 32;   // ERREUR : on tente de modifier la constante
    return 0;
}
```

```text
modifier_macro.cpp:1:19: error: lvalue required as left operand of assignment
modifier_macro.cpp:5:5: note: in expansion of macro ‘TILE_SIZE’
```

Le compilateur parle d'une valeur à gauche de l'affectation (`64 = 32` n'a pas de sens) : il a remplacé le nom par le nombre. Si la première ligne devient `const int TILE_SIZE = 64;` (fichier `modifier_const.cpp`) ou `constexpr int TILE_SIZE = 64;` (fichier `modifier_constexpr.cpp`), le message est le même dans les deux cas et cite le nom :

```text
modifier_const.cpp:5:15: error: assignment of read-only variable ‘TILE_SIZE’
```

### Le débogage

Un **débogueur** est un outil qui exécute un programme pas à pas et affiche ses variables (voir [le bug](/?c=fondamentaux&s=bases-de-l-informatique&p=le-bug)). Il ne lit que ce que le compilateur a laissé dans le programme. Fichier `debogage.cpp` :

```cpp
#define TILE_MACRO 64   // macro : disparaît avant la compilation proprement dite

constexpr int TILE_CONSTEXPR = 64;   // constante : garde son nom dans le programme compilé

int main()
{
    // % : reste de la division ; 128 % 7 vaut 2 ; return rend ce nombre au système
    return (TILE_MACRO + TILE_CONSTEXPR) % 7;
}
```

```bash
# -g : le compilateur ajoute au programme les noms que lit un débogueur
# (DWARF : le format standard dans lequel ces noms sont rangés)
# objdump : affiche le contenu d'un programme compilé
# grep -c : compte les lignes qui citent un mot
g++ -std=c++17 -g debogage.cpp -o debogage
objdump --dwarf=info debogage | grep -c TILE_CONSTEXPR
objdump --dwarf=info debogage | grep -c TILE_MACRO
# -g3 : ajoute aussi les macros, lisibles avec --dwarf=macro
g++ -std=c++17 -g3 debogage.cpp -o debogage3
objdump --dwarf=macro debogage3 | grep -c TILE_MACRO
```

```text
1
0
1
```

Avec `-g`, la constante garde son nom (1 ligne) et la macro n'apparaît nulle part (0). Seule l'option `-g3` conserve les macros. Sans elle, le débogueur affiche `64` là où le code disait `TILE_MACRO`.

## La portée d'une constante

La **portée** d'un nom est la zone du code où il existe. Une constante `const` ou `constexpr` suit les règles de portée de toute variable, ce qui permet à trois constantes de porter le même nom sans se gêner :

| Où est-elle déclarée ? | Portée | Comment la lire de l'extérieur |
|---|---|---|
| Dans une fonction | De sa déclaration à l'accolade fermante de la fonction | Impossible : elle n'existe plus après |
| Dans un espace de noms | Partout, avec le préfixe et l'opérateur `::` (« qui appartient à ») | `Config::LARGEUR` |
| Dans une classe, avec `static` | Dans la classe ; à l'extérieur si elle est `public` | `Grille::LARGEUR` |
| `#define` | De la ligne `#define` à la fin du fichier, sans préfixe | `LARGEUR` (aucun contrôle) |

```cpp
#include <iostream>   // std::cout

namespace Config {                // un espace de noms regroupe des noms sous un préfixe
    constexpr int LARGEUR = 10;   // s'écrit Config::LARGEUR, de n'importe où
}

class Grille {
public:
    static constexpr int LARGEUR = 5;   // s'écrit Grille::LARGEUR, de n'importe où (public)
};

void dessiner()
{
    constexpr int LARGEUR = 3;   // visible dans dessiner(), jusqu'à l'accolade fermante
    std::cout << LARGEUR << " " << Config::LARGEUR << " " << Grille::LARGEUR << "\n";
}

int main()
{
    dessiner();   // affiche les trois LARGEUR : aucun ne gêne les autres
    return 0;
}
```

```text
3 10 5
```

Dans `dessiner`, le nom `LARGEUR` seul désigne la constante locale (3) ; les deux autres s'écrivent avec leur préfixe. Hors de sa fonction, une constante locale n'existe plus :

```cpp
#include <iostream>   // std::cout

void dessiner()
{
    constexpr int MARGE = 8;   // visible dans dessiner() seulement
    std::cout << "dessiner : " << MARGE << "\n";
}

int main()
{
    dessiner();
    std::cout << "main : " << MARGE << "\n";   // ERREUR : MARGE n'existe pas ici
    return 0;
}
```

```text
portee_locale.cpp:12:31: error: ‘MARGE’ was not declared in this scope
```

Une macro, au contraire, aurait été visible dans `main` (voir l'exemple `macro_portee.cpp` plus haut, où `MARGE` sort de sa fonction). Une portée étroite est un atout : un nom de constante local ne peut pas entrer en collision avec un autre nom du programme.

## Le membre `static constexpr` d'une classe

Un **membre statique** (déclaré `static`) d'une classe n'appartient pas à chaque objet mais à la classe : il n'existe qu'en un seul exemplaire, partagé (voir [les membres statiques](/?c=langages&s=cpp&p=classes-et-objets#membres-et-methodes-statiques)). Une constante de classe n'a aucune raison d'être recopiée dans chaque objet `Game` : on la déclare `static constexpr`. Voici le fil rouge, une classe de jeu dont la taille de case est un membre :

```cpp
#include <array>      // std::array : tableau de taille fixe, écrite entre chevrons <>
#include <iostream>   // std::cout

class Game {
public:   // ce qui suit est utilisable depuis l'extérieur de la classe
    static constexpr int TILE_SIZE = 64;    // taille d'une case en pixels
    static constexpr int GRID_WIDTH = 10;   // nombre de cases en largeur
    static constexpr int GRID_HEIGHT = 8;   // nombre de cases en hauteur

    // position en pixels de la colonne donnée ; const : ne modifie pas l'objet
    int pixelX(int colonne) const { return colonne * TILE_SIZE; }
    // static_cast<int> convertit en int le nombre de cases rendu par size()
    int cellCount() const { return static_cast<int>(cells.size()); }

private:   // ce qui suit n'est utilisable que dans la classe
    // la taille est une expression constante : les trois constantes sont multipliées
    std::array<int, GRID_WIDTH * GRID_HEIGHT> cells{};
};

int main()
{
    Game game;   // un objet Game
    std::cout << "Case : " << Game::TILE_SIZE << " pixels\n";   // Classe::NOM : sans objet
    std::cout << "Colonne 3 : x = " << game.pixelX(3) << "\n";
    std::cout << "Fenêtre : " << Game::GRID_WIDTH * Game::TILE_SIZE << " x "
              << Game::GRID_HEIGHT * Game::TILE_SIZE << "\n";
    std::cout << "Cases : " << game.cellCount() << "\n";
    return 0;
}
```

```text
Case : 64 pixels
Colonne 3 : x = 192
Fenêtre : 640 x 512
Cases : 80
```

Points à retenir :

- `Game::TILE_SIZE` se lit avec `Classe::NOM` (l'opérateur `::` signifie « qui appartient à ») : aucun objet n'est nécessaire, puisque la constante appartient à la classe.
- Les trois constantes servent à calculer la taille de `cells` : le produit `GRID_WIDTH * GRID_HEIGHT` est une expression constante, acceptée entre les chevrons de `std::array` (voir [les templates](/?c=langages&s=cpp&p=templates)).
- `static_cast<int>` convertit un nombre d'un type vers un autre (voir [les cast en C++](/?c=langages&s=cpp&p=cast-cpp)), et `const` après `pixelX(int colonne)` promet que la méthode (une fonction de la classe) ne modifie pas l'objet.

L'accès depuis l'extérieur de la classe dépend de la section où la constante est déclarée :

| Déclaration | Dans les fonctions de `Game` | Hors de la classe (`Game::NOM`) |
|---|---|---|
| Section `public` | oui | oui |
| Section `private` | oui | non : erreur de compilation |
| Section `protected` | oui | non, mais les classes dérivées y ont accès |

```cpp
#include <iostream>   // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // public : lisible depuis l'extérieur

private:
    static constexpr int MAX_LIVES = 3;    // private : réservé aux fonctions de Game
};

int main()
{
    std::cout << Game::TILE_SIZE << "\n";   // accepté
    std::cout << Game::MAX_LIVES << "\n";   // ERREUR : MAX_LIVES est private
    return 0;
}
```

```text
prive.cpp:14:24: error: ‘constexpr const int Game::MAX_LIVES’ is private within this context
prive.cpp:8:26: note: declared private here
```

Une constante utile seulement à la classe se range en `private` : elle ne devient pas une interface qu'il faudrait maintenir.

### Avant et depuis C++17 : la définition hors de la classe

Une constante utilisée comme simple **valeur** (`TILE_SIZE * 2`, `std::cout << TILE_SIZE`) n'a pas besoin d'exister en mémoire : le compilateur recopie 64. Dès qu'on demande son **adresse** (l'emplacement de la valeur en mémoire, obtenu par un passage par [référence](/?c=langages&s=cpp&p=references) ou par le symbole `&`), elle doit exister en un point précis de la mémoire. Une **déclaration** annonce seulement un nom et son type ; une **définition** réserve en plus cet emplacement, une fois pour tout le programme. Un **argument** est la valeur fournie à une fonction lors de son appel : `std::min` reçoit ses deux arguments par référence, donc par leur adresse :

```cpp
#include <algorithm>   // std::min : renvoie la plus petite de deux valeurs
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // taille d'une case en pixels
};

int main()
{
    int demande = 100;   // taille souhaitée par l'utilisateur
    // std::min reçoit ses arguments par référence : elle utilise l'adresse de TILE_SIZE
    int taille = std::min(demande, Game::TILE_SIZE);
    std::cout << "Taille retenue : " << taille << "\n";
    return 0;
}
```

| Standard | Dans la classe, `static constexpr int TILE_SIZE = 64;` est | La ligne `constexpr int Game::TILE_SIZE;` hors de la classe est |
|---|---|---|
| C++11 et C++14 | Une déclaration seulement | **Nécessaire** si l'adresse est demandée, dans un seul fichier `.cpp` |
| C++17 et après | Une déclaration et une définition (la constante est implicitement `inline` : une définition qui peut figurer dans plusieurs fichiers, le programme n'en gardant qu'un exemplaire) | Inutile ; encore acceptée, mais la norme la déclare obsolète |

En C++17, le programme affiche :

```text
Taille retenue : 64
```

En C++11 et en C++14, la compilation réussit mais l'**édition de liens** (la dernière étape, qui relie les morceaux du programme, voir [les erreurs d'édition de liens](/?c=langages&s=c&p=compilation#erreurs-de-compilation-vs-erreurs-d-edition-de-liens)) échoue (`ld` est le programme qui effectue cette étape) :

```text
min_adresse.cpp:(.text+0x29): undefined reference to `Game::TILE_SIZE'
collect2: error: ld returned 1 exit status
```

La correction ajoute la définition après la classe :

```cpp
#include <algorithm>   // std::min
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // déclaration dans la classe
};

// définition hors de la classe : réserve l'adresse de TILE_SIZE (dans UN seul fichier .cpp)
constexpr int Game::TILE_SIZE;

int main()
{
    int demande = 100;   // taille souhaitée par l'utilisateur
    int taille = std::min(demande, Game::TILE_SIZE);   // plafonne à 64
    std::cout << "Taille retenue : " << taille << "\n";
    return 0;
}
```

```text
Taille retenue : 64
```

Ce programme donne le même résultat en C++11, C++14 et C++17. Deux détails de ce piège :

- Avec l'option d'[optimisation](/?c=langages&s=c&p=compilation#les-niveaux-d-optimisation-o0-a-o3-os) `-O2` (qui demande au compilateur de réécrire le code pour le rendre plus rapide), la référence est remplacée par la valeur 64 et l'erreur disparaît (observé avec le code de l'exemple en C++11) : un programme peut donc passer en version optimisée et échouer en version normale.
- La ligne de définition appartient à **un seul** fichier `.cpp`. Placée dans un en-tête inclus par deux fichiers, elle donne en C++14 `multiple definition of ‘Game::TILE_SIZE’` ; en C++17 elle n'est plus un problème, puisque la constante est `inline`.

## Ce que `constexpr` sait calculer : fonctions et `static_assert`

Déclarée `constexpr`, une fonction peut être appelée à la compilation quand tous ses arguments (les valeurs fournies à l'appel) sont connus ; avec un argument connu seulement à l'exécution, elle s'exécute comme une fonction ordinaire. Ce qu'elle peut contenir dépend du standard :

| Standard | Contenu permis d'une fonction `constexpr` |
|---|---|
| C++11 | Une seule instruction (un ordre terminé par `;`) : `return` ; la **récursion** (une fonction qui s'appelle elle-même) et l'opérateur ternaire `test ? a : b` remplacent variables et boucles |
| C++14 | Variables locales, boucles [`for` et `while`](/?c=langages&s=c&p=boucles), plusieurs instructions |
| C++20 | Le mot `consteval` impose le calcul à la compilation (voir plus bas) |

```cpp
#include <iostream>   // std::cin, std::cout

constexpr int carre(int x) { return x * x; }   // un seul return : valable dès C++11

// récursion : la fonction s'appelle elle-même ; <= : « inférieur ou égal à »
// « test ? a : b » vaut a si test est vrai, sinon b
constexpr int factorielle(int n) { return n <= 1 ? 1 : n * factorielle(n - 1); }

constexpr int SURFACE = carre(8);                          // calculée à la compilation : 64
static_assert(carre(8) == 64, "carre(8) doit valoir 64");  // == : test d'égalité
int tableau[factorielle(3)];                               // taille 3 x 2 x 1 = 6

int main()
{
    int n = 0;       // valeur choisie à l'exécution
    std::cin >> n;   // lue au clavier
    // carre(n) s'exécute comme une fonction ordinaire : n est inconnu à la compilation
    std::cout << SURFACE << " " << factorielle(5) << " " << carre(n) << " "
              << tableau[0] << "\n";
    return 0;
}
```

```text
64 120 49 0
```

(avec la saisie `7`). `factorielle(5)` vaut 5 x 4 x 3 x 2 x 1, soit 120. La même fonction `carre` sert à la compilation (`SURFACE`, `static_assert`) et à l'exécution (`carre(n)`), tandis que `factorielle(3)` fixe la taille du tableau. Avec une boucle, la même idée s'écrit plus simplement, mais seulement depuis C++14 :

```cpp
#include <iostream>   // std::cout

constexpr int somme(int n)   // additionne les entiers de 1 à n
{
    int total = 0;                 // variable locale : permise depuis C++14
    for (int i = 1; i <= n; ++i)   // boucle : permise depuis C++14 ; ++i ajoute 1 à i
        total += i;                // += : ajoute i à total
    return total;                  // 1 + 2 + ... + n
}

constexpr int TOTAL = somme(10);   // calculé à la compilation : 55

int main()
{
    std::cout << TOTAL << "\n";
    return 0;
}
```

```text
55
```

En C++11, la même fonction est refusée :

```text
somme.cpp:9:1: error: body of ‘constexpr’ function [...] not a return-statement
```

### `static_assert` : vérifier à la compilation

[`static_assert(condition, "message")`](https://en.cppreference.com/w/cpp/language/static_assert) arrête la compilation avec le message si la condition est fausse. La condition doit être une expression constante. Cela transforme une hypothèse du code (« la case est un multiple de 8 ») en règle que le compilateur contrôle :

```cpp
constexpr int TILE_SIZE = 60;   // taille d'une case en pixels

// la condition est fausse : la compilation s'arrête avec ce message
static_assert(TILE_SIZE % 8 == 0, "TILE_SIZE doit être un multiple de 8");

int main()
{
    return 0;
}
```

```text
assertion.cpp:4:29: error: static assertion failed: TILE_SIZE doit être un multiple de 8
assertion.cpp:4:29: note: the comparison reduces to ‘(4 == 0)’
```

(60 % 8 vaut 4, le reste de la division de 60 par 8.) Depuis C++17, le message peut être omis : `static_assert(TILE_SIZE > 0);`. En C++11, GCC l'accepte mais avertit (`warning: ‘static_assert’ without a message only available with ‘-std=c++17’`).

### `consteval` (C++20)

Une fonction `constexpr` peut encore s'exécuter à l'exécution. Une fonction `consteval` (voir [la documentation](https://en.cppreference.com/w/cpp/language/consteval)) ne le peut jamais : tout appel doit être une expression constante. Avec `consteval int carre(int x) { return x * x; }` et un `n` lu au clavier, compilé avec `-std=c++20`, l'appel `carre(8)` passe et `carre(n)` est refusé :

```text
consteval.cpp:9:43: error: the value of ‘n’ is not usable in a constant expression
```

## Les limites de `constexpr`

`constexpr` ne s'applique qu'à ce qui se calcule sans exécuter le programme :

| Ce qu'on voudrait | Possible ? | Détail |
|---|---|---|
| Un entier, un nombre à virgule, un booléen (vrai ou faux), un caractère (`'a'`) | oui | `constexpr double PI = 3.14159265358979;` |
| Un texte constant | oui | Un [pointeur](/?c=langages&s=c&p=pointeurs) (l'adresse d'une valeur en mémoire) vers un texte écrit dans le code : `constexpr const char *` |
| Une valeur lue au clavier, dans un fichier ou sur le réseau | non | La valeur n'existe qu'à l'exécution (voir l'erreur plus haut) |
| Une variable `constexpr` de type `std::string` | non (testé en C++11 et C++17) | Le type n'est pas « littéral » (voir ci-dessous) |
| Une fonction `constexpr` qui appelle une fonction non `constexpr` | refusée si on exige sa valeur à la compilation | `std::cin >> valeur` dans le corps provoque l'avertissement `-Winvalid-constexpr` en C++17 et une erreur en C++11 |

```cpp
#include <iostream>   // std::cout

constexpr double PI = 3.14159265358979;         // un nombre à virgule (double)
constexpr const char *TITRE = "Jeu de cases";   // pointeur vers un texte écrit dans le code
constexpr bool MODE_DEBUG = true;               // un booléen : true (vrai) ou false (faux)

int main()
{
    std::cout << TITRE << " : " << PI << " " << MODE_DEBUG << "\n";
    return 0;
}
```

```text
Jeu de cases : 3.14159 1
```

(un booléen s'affiche `1` pour vrai, `0` pour faux.) Pour `std::string`, le message cite le type :

```cpp
#include <iostream>   // std::cout
#include <string>     // std::string : type de texte de la bibliothèque standard

constexpr std::string TITRE = "Jeu de cases";   // ERREUR : std::string n'est pas constexpr

int main()
{
    std::cout << TITRE << "\n";
    return 0;
}
```

```text
texte.cpp:4:23: error: the type ‘const std::string’ [...] ‘TITRE’ is not literal
[...] has a non-trivial destructor
```

(`[...]` marque les mots omis du message.) Un **type littéral** est un type que le compilateur sait créer pendant la compilation : nombres, booléens, caractères, pointeurs et classes simples. `std::string` gère de la mémoire réservée pendant l'exécution (voir [la gestion de la mémoire](/?c=langages&s=cpp&p=gestion-memoire-raii)), qu'un [destructeur](/?c=langages&s=cpp&p=classes-et-objets) libère à la fin de sa vie : il n'est pas littéral. Pour un texte constant, on écrit `constexpr const char *`.

## Ranger les constantes d'un projet

Les constantes partagées se placent dans un en-tête, dans un espace de noms. Une constante `constexpr` d'espace de noms existe en **un exemplaire par fichier `.cpp`** qui inclut l'en-tête (chaque fichier a sa copie, sans conflit à l'édition de liens). Depuis C++17, `inline constexpr` donne un exemplaire unique, partagé par tout le programme :

```cpp
#ifndef CONSTANTES_H
#define CONSTANTES_H
namespace Config {
    constexpr int TILE_SIZE = 64;           // une copie par fichier .cpp
    inline constexpr int TILE_INLINE = 64;  // une seule copie pour tout le programme (C++17)
}
// définies dans un autre fichier .cpp : elles rendent l'adresse vue depuis ce fichier-là
const int *adresseTile();
const int *adresseTileInline();
#endif
```

Dans un programme de deux fichiers `.cpp` incluant cet en-tête (l'un définit les deux fonctions, l'autre les appelle), l'adresse de `TILE_SIZE` vue par chacun est différente en C++14 comme en C++17 ; celle de `TILE_INLINE` est la même en C++17 (résultat observé). Pour un simple nombre lu par valeur, la différence n'a aucune importance : elle ne se remarque que si l'on demande l'adresse.

Pour garder le réglage par `-D` de `#define` avec le type et la portée de `constexpr`, on combine les deux : la macro ne sert que de point d'entrée, lue une seule fois.

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE_PX     // la macro ne sert que de point d'entrée pour -D...
#define TILE_SIZE_PX 64  // ...avec une valeur par défaut
#endif

constexpr int TILE_SIZE = TILE_SIZE_PX;   // le reste du code utilise cette constante typée
// static_assert : arrête la compilation si la condition est fausse
static_assert(TILE_SIZE > 0, "la taille d'une case doit être positive");

int main()
{
    std::cout << "Case : " << TILE_SIZE << " pixels\n";
    return 0;
}
```

Ce fichier s'appelle ici `reglage.cpp` :

```bash
g++ -std=c++17 reglage.cpp -o reglage && ./reglage
g++ -std=c++17 -DTILE_SIZE_PX=32 reglage.cpp -o reglage && ./reglage
g++ -std=c++17 -DTILE_SIZE_PX=0 reglage.cpp -o reglage
```

```text
Case : 64 pixels
Case : 32 pixels
reglage.cpp:9:25: error: static assertion failed: la taille d'une case doit être positive
reglage.cpp:9:25: note: the comparison reduces to ‘(0 > 0)’
```

Le même programme compile aussi en C++11. Le reste du code n'utilise que `TILE_SIZE` : une valeur absurde passée en `-D` est arrêtée à la compilation par `static_assert`.

## Les pièges

| Piège | Symptôme | Correctif |
|---|---|---|
| Utiliser une `const` initialisée à l'exécution comme taille de tableau | `the value of ‘taille’ is not usable in a constant expression` ; ou, avec un tableau « à la C », un avertissement `-Wvla` seulement sous GCC | Déclarer la taille `constexpr` ; si la taille est vraiment inconnue à la compilation, utiliser `std::vector` (voir [les conteneurs](/?c=langages&s=cpp&p=stl-conteneurs)) |
| Croire qu'une fonction `constexpr` est toujours calculée à la compilation | `carre(n)` avec `n` lu au clavier s'exécute à l'exécution, sans erreur | Affecter le résultat à une variable `constexpr`, ou utiliser `consteval` (C++20) |
| Macro à **paramètre** (un nom entre parenthèses, remplacé par le texte fourni à l'appel) sans parenthèses | `CARRE_FAUX(1 + 2)` donne 5 et non 9 | Parenthéser chaque paramètre et le résultat, ou utiliser une fonction `constexpr` |
| Constante `#define` sans parenthèses | `5120 / LARGEUR_FAUSSE` donne 800 et non 8 | Parenthéser : `#define LARGEUR_JUSTE (64 * 10)` |
| Point-virgule à la fin d'un `#define` | `#define TILE_SIZE 64;` puis `int cases[TILE_SIZE];` donne `expected ‘]’ before ‘;’ token` | Aucun point-virgule dans une macro |
| Collision de macros de même nom | La dernière définition rencontrée gagne ; seul `warning: "LARGEUR" redefined` le signale | Constantes dans un espace de noms ; lire les avertissements du compilateur |
| Macro définie dans une fonction | Elle reste active après la fonction (exemple `macro_portee.cpp`) | Une `constexpr` locale, qui disparaît avec la fonction |
| `#if` sur une constante C++ | `TILE_SIZE` vaut 0 dans le `#if` : la branche choisie est fausse, sans aucune erreur | Garder une macro pour les `#if` ; ailleurs, `if` ou `static_assert` |
| `static constexpr` utilisé par adresse en C++11 ou C++14 | `undefined reference to ‘Game::TILE_SIZE’` | Ajouter `constexpr int Game::TILE_SIZE;` dans un `.cpp` |
| `static const double` dans une classe | `‘constexpr’ needed for in-class initialization of static data member ‘const double Game::RATIO’ of non-integral type` | Écrire `static constexpr double RATIO = 0.5;` |
| Oublier `static` devant un membre `constexpr` | `non-static data member ‘TILE_SIZE’ declared ‘constexpr’` | Écrire `static constexpr int TILE_SIZE = 64;` |
| `constexpr` sur un `std::string` | `the type ‘const std::string’ ... is not literal` | `constexpr const char *` pour un texte constant |

Le piège `#if` se vérifie sur ce programme (la constante est bien 64, le `#if` croit qu'elle vaut 0) :

```cpp
#include <iostream>   // std::cout

constexpr int TILE_SIZE = 64;   // une constante C++, pas une macro

// #if teste une condition avant la compilation ; il ne connaît que les macros
#if TILE_SIZE > 32              // TILE_SIZE n'est pas une macro : il vaut 0 ici
const char *taille = "grande";  // choisie si TILE_SIZE > 32
#else
const char *taille = "petite";  // choisie sinon
#endif

int main()
{
    std::cout << "Case " << taille << " (" << TILE_SIZE << " pixels)\n";
    return 0;
}
```

```text
Case petite (64 pixels)
```

L'option `-Wundef` l'avertit : `warning: "TILE_SIZE" is not defined, evaluates to 0 [-Wundef]`.

Le piège des parenthèses se vérifie sur ce programme :

```cpp
#include <iostream>   // std::cout

#define CARRE_FAUX(x) x * x               // paramètre sans parenthèses
#define CARRE_JUSTE(x) ((x) * (x))        // paramètre et résultat entre parenthèses
#define LARGEUR_FAUSSE 64 * 10            // constante sans parenthèses
#define LARGEUR_JUSTE (64 * 10)           // constante entre parenthèses
constexpr int carre(int x) { return x * x; }   // fonction : x est d'abord calculé

int main()
{
    // CARRE_FAUX(1 + 2) devient 1 + 2 * 1 + 2, soit 1 + 2 + 2 = 5
    std::cout << CARRE_FAUX(1 + 2) << " " << CARRE_JUSTE(1 + 2) << " "
              << carre(1 + 2) << "\n";
    // 5120 / LARGEUR_FAUSSE devient 5120 / 64 * 10, soit 80 * 10 = 800
    std::cout << 5120 / LARGEUR_FAUSSE << " " << 5120 / LARGEUR_JUSTE << "\n";
    return 0;
}
```

```text
5 9 9
800 8
```

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| `constexpr` par défaut pour une valeur connue à la compilation | Le compilateur vérifie la promesse ; le type et la portée sont respectés |
| `const` seulement pour une valeur calculée à l'exécution | Elle dit « fixée ici, jamais modifiée », sans prétendre au calcul à la compilation |
| `#define` réservé aux besoins que seul le préprocesseur couvre : réglage par `-D`, condition `#if`, garde d'inclusion | Partout ailleurs, la macro n'a ni type, ni portée, ni nom dans le débogueur |
| Une constante de classe en `static constexpr`, rangée en `private` si elle ne sert qu'à la classe | Un seul exemplaire pour tous les objets ; aucune interface publique de plus |
| Une constante globale dans un espace de noms (`Config::TILE_SIZE`) | Aucune collision, origine visible à la lecture |
| Une constante nommée plutôt qu'un nombre magique | Le sens est écrit ; le changement se fait à un seul endroit |
| `static_assert` pour toute hypothèse sur une constante | Une valeur absurde arrête la compilation, pas le jeu |
| Écrire les macros en majuscules, les parenthéser entièrement | Une macro se repère à la lecture ; l'ordre des opérations reste celui voulu |
| Compiler avec `-std=c++17` (ou plus) et `-Wall -Wextra -pedantic` | Dès C++17, plus de définition hors classe à écrire ; les avertissements signalent macros redéfinies et tableaux à taille variable |

Pour approfondir, sur cppreference : [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr), [`const`](https://en.cppreference.com/w/cpp/language/cv), [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert), [les membres statiques](https://en.cppreference.com/w/cpp/language/static), [le spécificateur `inline`](https://en.cppreference.com/w/cpp/language/inline), [`consteval`](https://en.cppreference.com/w/cpp/language/consteval), [`std::array`](https://en.cppreference.com/w/cpp/container/array) et [les macros](https://en.cppreference.com/w/cpp/preprocessor/replace).

## Ce qu'il faut retenir

| À retenir | Détail |
|---|---|
| Une constante nomme une valeur fixe | Elle remplace un nombre magique : le sens est écrit, le changement se fait en un seul endroit |
| Deux moments | La compilation traduit le code ; l'exécution lance le programme. Une expression constante se calcule à la compilation |
| `#define` | Remplacement de texte par le préprocesseur : sans type, sans portée, sujet aux collisions ; visible partout, réglable par `-D`, utilisable dans `#if` |
| `const` | Variable qu'on ne modifie plus après son initialisation ; la valeur peut venir de l'exécution (clavier, fichier) ; inutilisable comme taille de tableau dans ce cas |
| `constexpr` | Constante typée dont la valeur est connue à la compilation ; sinon erreur ; utilisable comme taille de tableau, argument de template et dans `static_assert` |
| Portée | Fonction (locale), espace de noms (`Config::NOM`), classe (`Classe::NOM`) ; une macro n'en a aucune |
| Membre `static constexpr` | Un exemplaire partagé par la classe ; `Game::TILE_SIZE` hors de la classe si `public`, erreur si `private` |
| Standard | Avant C++17, une adresse demandée exige `constexpr int Game::TILE_SIZE;` hors classe ; depuis C++17, le membre est `inline`. Fonctions `constexpr` : un seul `return` en C++11, boucles depuis C++14 ; `consteval` en C++20 |
| Limites | Seul ce qui se calcule sans exécuter le programme : pas de saisie, pas de fichier, pas de `std::string` constexpr |
| Ne pas confondre | `const` (jamais modifiée) et `constexpr` (connue à la compilation) ; `#define` (texte) et constante (valeur typée) |
