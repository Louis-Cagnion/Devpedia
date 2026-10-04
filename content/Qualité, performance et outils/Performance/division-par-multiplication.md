---
order: 10
---

# Remplacer une division par une multiplication

Dans un programme qui calcule beaucoup, une opération en particulier coûte plus cher que les autres : la **division**. Ce chapitre montre comment une division par un nombre fixe peut être remplacée par une multiplication qui donne **exactement** le même résultat, pourquoi cela marche, dans quelles limites, et surtout combien cela rapporte vraiment : la réponse est une leçon de [mesure avant optimisation](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

## Ce que fait une division, et pourquoi elle coûte cher

Une **division entière** cherche combien de fois un nombre en contient un autre : c'est le **quotient**. Ce qui reste est le **reste**.

| Calcul | Quotient | Reste | En C |
|---|---|---|---|
| 1 000 000 ÷ 108 | 9 259 | 28 | `1000000 / 108` et `1000000 % 108` |
| 17 ÷ 5 | 3 | 2 | `17 / 5` et `17 % 5` |

Un processeur exécute des **instructions** (additionner, multiplier, diviser...), et chacune occupe un nombre de **cycles** : un cycle est un battement de l'horloge interne du processeur (voir [le compteur de cycles](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#chronometrer-une-portion-de-boucle-le-compteur-de-cycles)). Les ordres de grandeur, qui varient selon le modèle de processeur :

| Opération sur des entiers | Coût typique |
|---|---|
| Addition, soustraction | environ 1 cycle |
| Multiplication | environ 3 cycles |
| Division | une dizaine de cycles ou plus |

La multiplication est rapide parce qu'un circuit dédié calcule tout le résultat en une passe. La division, elle, ressemble à celle de l'école : le circuit avance par étapes successives. C'est donc l'opération qu'on a intérêt à éviter dans une boucle exécutée des millions de fois.

## L'idée : multiplier par l'inverse

Diviser par 4, c'est multiplier par 0,25. Diviser par 8, c'est multiplier par 0,125. Diviser par `q`, c'est multiplier par `1/q`, qu'on appelle l'**inverse** de `q`.

Le problème : les entiers n'ont pas de virgule, et `1/7` vaut `0,142857142857...` sans jamais s'arrêter. L'astuce consiste à travailler en **virgule fixe** : on garde un nombre fixe de décimales, on arrondit **vers le haut**, et on décale la virgule en écrivant le résultat comme un entier.

Exemple en base 10, pour diviser par 7 avec 6 décimales : l'inverse arrondi vers le haut est `0,142858`, soit l'entier `142 858` si on multiplie par un million. On multiplie `d` par `142 858`, puis on **jette les 6 derniers chiffres** (ce qui revient à diviser par un million) :

| d | d × 142 858 | on jette 6 chiffres | d ÷ 7 (vrai quotient) |
|---|---|---|---|
| 6 | 857 148 | 0 | 0 |
| 7 | 1 000 006 | 1 | 1 |
| 1 000 | 142 858 000 | 142 | 142 |
| 999 999 | 142 857 857 142 | 142 857 | 142 857 |

L'ordinateur compte en base 2, pas en base 10 : on remplace le million par `2^32` (environ 4,3 milliards) et « jeter les 6 derniers chiffres » par « jeter les 32 derniers bits », c'est-à-dire un [décalage à droite](/?c=langages&s=c&p=operateurs-binaires#les-decalages) de 32 positions (`>> 32`).

```
inverse(q) = 2^32 / q, arrondi vers le haut
d / q      = (d × inverse(q)) >> 32
```

## Le code

```c
#include <stdint.h>
#include <stdio.h>

/* l'inverse de q en virgule fixe : 2^32 / q arrondi vers le haut.
   À calculer UNE seule fois par diviseur. */
static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }

/* d / q sans division : multiplier par l'inverse,
   puis jeter les 32 bits de poids faible */
static unsigned diviser(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned n = 108;                       /* un diviseur connu seulement à l'exécution */
    uint64_t inv = inverse(n);              /* la seule vraie division, payée une fois */
    unsigned d = 1000000;
    unsigned quotient = diviser(d, inv);    /* d / n, par multiplication */
    unsigned reste = d - quotient * n;      /* d % n, sans division non plus */

    printf("inverse(%u) = %llu\n", n, (unsigned long long)inv);
    printf("%u / %u = %u, reste %u\n", d, n, quotient, reste);
    printf("contrôle : %u / %u = %u, reste %u\n", d, n, d / n, d % n);
    return 0;
}
```

Sortie :

```
inverse(108) = 39768216
1000000 / 108 = 9259, reste 28
contrôle : 1000000 / 108 = 9259, reste 28
```

| Élément du code | Rôle |
|---|---|
| `uint64_t` | Entier non signé sur 64 bits. Le produit `d × inverse` dépasse 32 bits : il faut une place plus large (voir le [débordement](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements#le-debordement-overflow)). |
| `1ull << 32` | Le nombre `2^32`, écrit en `unsigned long long` (suffixe `ull`) pour tenir en mémoire. |
| `+ q - 1` | Pour arrondir un quotient entier **vers le haut** : `(a + q - 1) / q` vaut le plus petit entier supérieur ou égal à `a / q`. |
| `>> 32` | Jette les 32 bits de poids faible : l'équivalent de « jeter les 6 derniers chiffres ». Permis ici parce que la valeur fait 64 bits : décaler de 32 positions un entier de 32 bits est un comportement indéfini (voir [les décalages](/?c=langages&s=c&p=operateurs-binaires#les-decalages)). |
| `d - quotient * n` | Le reste, sans deuxième division : `d % n` se déduit du quotient. |

Le calcul de l'inverse contient lui-même une vraie division, mais il n'est fait **qu'une fois** par diviseur. Chaque division suivante n'est plus qu'une multiplication et un décalage. L'astuce ne vaut donc que si le **même diviseur** sert un grand nombre de fois.

## Pourquoi c'est exact

L'inverse a été arrondi vers le haut : il est un peu trop grand. Notons `e` ce surplus, en unités de `1/2^32` :

```
e = q × inverse(q) - 2^32          avec 0 <= e < q
```

Alors `d × inverse(q) / 2^32 = d/q + d×e / (q × 2^32)` : le calcul donne le vrai quotient plus une petite erreur positive, `d×e / (q × 2^32)`. Cette erreur ne change pas le résultat tant qu'elle reste **inférieure à `1/q`** :

| Étape | Raisonnement |
|---|---|
| 1 | `d / q` s'écrit `k + r/q` : `k` est le quotient, `r` le reste, et `r` est au plus `q - 1`. |
| 2 | La partie après la virgule vaut donc au plus `(q - 1)/q = 1 - 1/q`. |
| 3 | Lui ajouter une erreur strictement inférieure à `1/q` ne peut pas atteindre `k + 1` : la partie entière reste `k`. |
| 4 | L'erreur est inférieure à `1/q` quand `d × e < 2^32`. |
| 5 | Avec `q <= 128`, on a `e < 128 = 2^7` ; avec `d < 2^25`, on a `d × e < 2^25 × 2^7 = 2^32`. |

La méthode est donc exacte pour tout diviseur jusqu'à 128 et tout dividende inférieur à `2^25` (33 554 432). Une preuve rassure, mais une erreur d'un seul bit passe inaperçue : on vérifie aussi par **force brute**, en comparant avec la vraie division pour chacune des 128 × 2^25 paires possibles :

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned diviser(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned long long verifiees = 0, fausses = 0;

    for (unsigned q = 1; q <= 128; q++) {               /* diviseurs de la zone garantie */
        uint64_t inv = inverse(q);
        for (unsigned d = 0; d < (1u << 25); d++) {     /* dividendes de la zone garantie */
            verifiees++;
            if (diviser(d, inv) != d / q)               /* contrôle par la vraie division */
                fausses++;
        }
    }
    printf("%llu divisions vérifiées, %llu fausses\n", verifiees, fausses);
    return 0;
}
```

```
4294967296 divisions vérifiées, 0 fausses
```

## Au-delà de la zone garantie, le résultat est faux sans prévenir

Quand `d × e` atteint `2^32`, l'erreur dépasse `1/q` et le quotient peut valoir **un de plus** que le bon, sans aucun message :

```c
#include <stdint.h>
#include <stdio.h>

int main(void)
{
    unsigned q = 127;
    uint64_t inv = ((1ull << 32) + q - 1) / q;
    uint64_t e = q * inv - (1ull << 32);        /* erreur d'arrondi : 0 <= e < q */
    unsigned d = 0;

    while ((unsigned)(d * inv >> 32) == d / q)  /* cherche le premier dividende faux */
        d++;
    printf("q = %u, e = %llu\n", q, (unsigned long long)e);
    printf("premier d faux : %u (2^25 = %u, 2^32 / e = %llu)\n",
           d, 1u << 25, (1ull << 32) / e);
    printf("vrai quotient : %u, quotient calculé : %u\n", d / q, (unsigned)(d * inv >> 32));
    return 0;
}
```

```
q = 127, e = 111
premier d faux : 38693470 (2^25 = 33554432, 2^32 / e = 38693399)
vrai quotient : 304672, quotient calculé : 304673
```

Le premier dividende faux est juste au-dessus de `2^32 / e`, comme le prévoit la preuve. Il dépend du diviseur :

| Diviseur `q` | Erreur `e` | `2^32 / e` | Premier `d` faux |
|---|---|---|---|
| 3 | 2 | 2 147 483 648 | 2 147 483 648 |
| 10 | 4 | 1 073 741 824 | 1 073 741 829 |
| 127 | 111 | 38 693 399 | 38 693 470 |
| 129 | 113 | 38 008 560 | 38 008 688 |
| 128 | 0 | (aucune erreur) | aucun (puissance de 2 : l'inverse est exact) |

La borne « `q <= 128` et `d < 2^25` » est donc **suffisante**, pas la seule possible : un petit diviseur comme 3 reste exact jusqu'à plus de deux milliards. Pour une zone plus grande, il faut une version plus fine de l'algorithme, avec un décalage supplémentaire : c'est ce que font les compilateurs et la bibliothèque [libdivide](https://libdivide.com/), à partir de l'article de [Granlund et Montgomery (1994)](https://doi.org/10.1145/178243.178249).

## Le compilateur le fait déjà, quand il connaît le diviseur

Quand le diviseur est une constante écrite dans le code, le [compilateur](/?c=langages&s=c&p=compilation) applique cette transformation tout seul :

```c
unsigned div_constante(unsigned d) { return d / 108; }
unsigned div_variable(unsigned d, unsigned n) { return d / n; }
```

Le code machine produit par `gcc -O2` (les [niveaux d'optimisation](/?c=langages&s=c&p=compilation#les-niveaux-d-optimisation-o0-a-o3-os) du compilateur), affiché avec `objdump -d` ([exemple d'utilisation](/?c=langages&s=c&p=compilation#plusieurs-fichiers-et-inlining-unite-de-compilation-static-inline-flto)), sans les lignes d'alignement ni `endbr64` :

```
div_constante :                      div_variable :
  mov    eax,edi                       mov    eax,edi
  shr    eax,0x2                       xor    edx,edx
  imul   rax,rax,0x4bda12f7            div    esi          <- la vraie division
  shr    rax,0x23
  ret                                  ret
```

Pour `d / 108`, le compilateur a choisi lui-même une constante magique (`0x4bda12f7`) : une multiplication et des décalages, aucune instruction `div`. Il le fait même sans optimisation (`-O0`). Pour `d / n`, il ne peut rien faire : la valeur de `n` n'existe qu'à l'exécution (lue sur la ligne de commande, dans un fichier...), alors il garde `div`.

| Diviseur | Qui remplace la division ? |
|---|---|
| Constante connue à la compilation | Le compilateur, automatiquement |
| Fixé au démarrage, réutilisé des millions de fois | Le programmeur (cette technique), ou une bibliothèque |
| Différent à chaque division | Personne : calculer l'inverse coûte une division, rien n'est gagné |

## Combien ça rapporte : une leçon de mesure

Pour mesurer, le programme suivant chronomètre (avec [`clock_gettime`](/?c=langages&s=c&p=mesure-du-temps#mesurer-une-duree-clock-gettime-clock-monotonic)) deux situations. Dans la **chaîne dépendante**, chaque division a besoin du résultat de la précédente : elle ne peut pas commencer avant. Dans les divisions **indépendantes**, le processeur peut en faire avancer plusieurs en même temps. Le diviseur est lu sur la ligne de commande : le compilateur ne peut pas le connaître.

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned diviser(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

#define N 400000000u                /* nombre d'itérations */
#define MASQUE ((1u << 25) - 1)     /* garde d sous 2^25, la zone où l'inverse est exact */

/* chaîne dépendante : chaque division attend le résultat de la précédente */
static unsigned chaine_div(unsigned n)
{
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (d / n + i * 2654435761u) & MASQUE;
    return d;
}

static unsigned chaine_mul(unsigned n)
{
    uint64_t inv = inverse(n);
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (diviser(d, inv) + i * 2654435761u) & MASQUE;
    return d;
}

/* divisions indépendantes : le processeur peut en faire avancer plusieurs à la fois */
static unsigned indep_div(unsigned n)
{
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += ((i * 2654435761u) & MASQUE) / n;
    return s;
}

static unsigned indep_mul(unsigned n)
{
    uint64_t inv = inverse(n);
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += diviser((i * 2654435761u) & MASQUE, inv);
    return s;
}

static double maintenant(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned n = argc > 1 ? (unsigned)atoi(argv[1]) : 108;     /* inconnu à la compilation */
    unsigned (*f[4])(unsigned) = { chaine_div, chaine_mul, indep_div, indep_mul };
    const char *nom[4] = { "chaîne       d / n  ", "chaîne       inverse",
                           "indépendantes d / n  ", "indépendantes inverse" };
    double meilleur[4] = { 1e9, 1e9, 1e9, 1e9 };
    unsigned res[4];

    for (int tour = 0; tour < 5; tour++)    /* 5 tours alternés, on garde le meilleur */
        for (int k = 0; k < 4; k++) {
            double t0 = maintenant();
            double duree;

            res[k] = f[k](n);
            duree = maintenant() - t0;
            if (duree < meilleur[k])
                meilleur[k] = duree;
        }
    for (int k = 0; k < 4; k++)
        printf("%s : %5.2f ns par division\n", nom[k], meilleur[k] / N * 1e9);
    printf("résultats identiques : %s\n",
           res[0] == res[1] && res[2] == res[3] ? "oui" : "NON");
    return 0;
}
```

```
chaîne       d / n   :  2.66 ns par division
chaîne       inverse :  1.28 ns par division
indépendantes d / n   :  1.29 ns par division
indépendantes inverse :  0.38 ns par division
résultats identiques : oui
```

| Situation | Division `/` | Inverse précalculé | Gain |
|---|---|---|---|
| Chaîne dépendante | 2,66 ns | 1,28 ns | environ ×2 |
| Divisions indépendantes | 1,3 ns | 0,38 ns | environ ×3,4 |

Dans ce petit programme, la division est le seul travail : le gain est maximal. Dans un vrai programme, c'est autre chose. Dans le [solveur Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), qui retrouve la ligne et la colonne d'une case à partir de son numéro (divisions par la taille `n` de la grille), le remplacement a été vérifié ainsi : les deux versions font **exactement la même recherche** (mêmes compteurs de travail, voir [vérifier que deux versions font le même travail](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#verifier-que-deux-versions-font-le-meme-travail-avant-de-les-chronometrer)), puis chronométrées sur deux [tours alternés](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#mesurer-en-tours-alternes). Résultat à `n = 96` : **0,5 % de temps gagné**.

Pourquoi si peu, alors que la division est 2 à 3 fois plus lente en isolation ?

| Raison | Explication |
|---|---|
| Le processeur masque la latence | Pendant qu'une division s'exécute, il avance déjà d'autres instructions : le temps d'attente est en grande partie recouvert par un autre travail. |
| La division est une petite part du temps | Le solveur passe l'essentiel de son temps à lire la mémoire, pas à diviser (voir [le cache du processeur](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-hierarchie-de-cache)). |
| Un micro-test est un maximum | Il isole l'opération mesurée : il donne la borne haute du gain, jamais le gain réel. |

> Un gain de ×3 dans un micro-test et de 0,5 % dans le programme complet ne se contredisent pas : ils ne mesurent pas la même chose. Avant d'optimiser une opération, chronométrer **le programme entier** ; sinon on passe du temps à écrire du code plus subtil pour un résultat que le chronomètre ne distingue presque pas du bruit.

## Les pièges

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverse(unsigned q) { return ((1ull << 32) + q - 1) / q; }

int main(void)
{
    unsigned q = 108, d = 1000000;
    unsigned inv32 = (unsigned)inverse(q);      /* inverse recopié sur 32 bits */
    unsigned inv_de_1 = (unsigned)inverse(1);   /* vaut 2^32 : 33 bits nécessaires */

    printf("d / q                       = %u\n", d / q);
    printf("produit calculé sur 64 bits = %u\n", (unsigned)(d * inverse(q) >> 32));
    printf("produit calculé sur 32 bits = %u\n", (unsigned)((uint64_t)(d * inv32) >> 32));
    printf("5 / 1 avec un inverse sur 32 bits = %u\n",
           (unsigned)((uint64_t)(5 * inv_de_1) >> 32));
    return 0;
}
```

```
d / q                       = 9259
produit calculé sur 64 bits = 9259
produit calculé sur 32 bits = 0
5 / 1 avec un inverse sur 32 bits = 0
```

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Produit calculé sur 32 bits | Le surplus au-delà de 32 bits est perdu, puis le décalage de 32 bits ne laisse que 0 : le résultat est faux sans erreur ni avertissement | Garder l'inverse dans un `uint64_t` : la multiplication se fait alors sur 64 bits |
| Inverse de 1 | `2^32` ne tient pas sur 32 bits : recopié dans un `unsigned`, il vaut 0 | Même parade : l'inverse reste sur 64 bits |
| `d` ou `q` hors de la zone garantie | Quotient trop grand de 1, sans message | Borner `d` et `q` à la création de l'inverse, ou vérifier la zone par force brute comme plus haut |
| Nombres négatifs | La division en C arrondit vers zéro (`-7 / 2` donne `-3`), l'astuce ne couvre que les entiers non signés | N'appliquer la technique qu'à des `unsigned` |
| Diviseur nul | `inverse(0)` divise par zéro et arrête le programme | Refuser `q == 0` avant de calculer l'inverse |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Diviser par `q`, c'est multiplier par l'inverse `2^32 / q` arrondi vers le haut, puis jeter les 32 bits de poids faible. C'est exact tant que `d × e < 2^32` (où `e < q` est l'erreur d'arrondi) : pour `q <= 128`, tout `d < 2^25`. Le calcul de l'inverse coûte une division, payée une seule fois. |
| **Outils utilisables** | Le compilateur (diviseur constant : automatique), `objdump -d` pour vérifier qu'une instruction `div` a disparu, la bibliothèque [libdivide](https://libdivide.com/) pour une zone plus large, une boucle de force brute pour vérifier une zone, `clock_gettime` pour chronométrer. |
| **Pièges à éviter** | Un produit calculé sur 32 bits, un `d` ou un `q` hors de la zone (résultat faux sans message), des nombres négatifs, un diviseur nul, un diviseur qui change à chaque appel (rien n'est gagné), et conclure d'un micro-test sans mesurer le programme entier. |
| **Bonnes pratiques** | Laisser le compilateur faire quand le diviseur est connu à la compilation ; ne l'écrire à la main que pour un diviseur fixé à l'exécution et réutilisé des millions de fois ; prouver ou vérifier la zone d'exactitude ; comparer les deux versions sur le même travail avant de chronométrer ; chronométrer le programme complet. |
