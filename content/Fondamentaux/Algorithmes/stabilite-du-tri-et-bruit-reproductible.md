---
order: 2.5
---

# La stabilité d'un tri, les égalités et le bruit reproductible (xorshift)

Trier, c'est ranger des éléments dans un ordre. Mais que se passe-t-il quand **plusieurs éléments sont égaux** pour le critère choisi ? Leur ordre entre eux peut changer d'une machine à l'autre, d'une bibliothèque à l'autre, voire d'une exécution à l'autre : le résultat ne se reproduit plus. Ce chapitre montre comment le constater, comment l'empêcher, et comment fabriquer un petit **bruit aléatoire reproductible** qui crée justement beaucoup d'égalités à départager.

| Notion | Question à laquelle elle répond |
|---|---|
| Égalité dans un tri | Dans quel ordre sortent deux éléments que le critère ne distingue pas ? |
| Stabilité | Le tri garantit-il qu'ils gardent leur ordre d'arrivée ? |
| Départage par l'indice | Comment obtenir le même résultat avec **n'importe quel** tri ? |
| Générateur xorshift | Comment produire des nombres « au hasard » qu'on peut rejouer à l'identique ? |

## Des égalités : que devient l'ordre ?

Huit élèves sont triés par note. Plusieurs ont la même note : le critère (la note) ne dit rien sur l'ordre de **Alice**, **Chloé** et **Emma**, qui ont toutes 12.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *nom; int note; } eleve;

/* Compare deux élèves par note seulement : deux notes égales sont "égales" pour le tri. */
static int par_note(const void *a, const void *b)
{
    const eleve *x = a, *y = b;
    return (x->note > y->note) - (x->note < y->note);
}

int main(void)
{
    eleve classe[] = {
        {"Alice", 12}, {"Bruno", 15}, {"Chloé", 12}, {"David", 15},
        {"Emma", 12}, {"Farid", 9}, {"Gaëlle", 15}, {"Hugo", 9},
    };
    int n = sizeof classe / sizeof classe[0];

    qsort(classe, n, sizeof classe[0], par_note);
    for (int i = 0; i < n; i++)
        printf("%2d  %s\n", classe[i].note, classe[i].nom);
    return 0;
}
```

Sortie :

```
 9  Farid
 9  Hugo
12  Alice
12  Chloé
12  Emma
15  Bruno
15  David
15  Gaëlle
```

Ici, les élèves à égalité sont restés dans leur ordre d'origine (Alice avant Chloé avant Emma). Un tri qui garantit cela est dit **stable** (voir [le tri par comparaison](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) pour la définition et les algorithmes stables). La question importante est : **est-ce une garantie, ou un coup de chance ?**

| Un tri... | Ce qu'on a le droit d'attendre pour deux éléments égaux |
|---|---|
| **stable** | Ils sortent dans leur ordre d'origine, toujours |
| **non stable** | Ils peuvent sortir dans n'importe quel ordre, et cet ordre peut changer avec la taille des données ou l'implémentation |

## `qsort` ne promet rien

`qsort` est la fonction de tri de la bibliothèque standard du langage [C](/?c=langages-de-programmation&s=c&p=c) (`#include <stdlib.h>`). Elle reçoit le tableau, le nombre d'éléments, la taille d'un élément et une **fonction de comparaison** (un [pointeur de fonction](/?c=langages-de-programmation&s=c&p=pointeurs)) qui répond « plus petit », « égal » ou « plus grand ».

| Argument de `qsort` | Rôle |
|---|---|
| `base` | Début du tableau à trier |
| `nmemb` | Nombre d'éléments |
| `size` | Taille d'un élément en octets (`sizeof classe[0]`) |
| `compar` | La fonction de comparaison : négatif si `a` avant `b`, 0 si égaux, positif sinon |

La norme du langage C est explicite : si deux éléments sont égaux pour `compar`, **leur ordre dans le résultat n'est pas spécifié** (voir la page de manuel [`qsort(3)`](https://man7.org/linux/man-pages/man3/qsort.3.html)). Rien n'oblige l'implémentation à être stable.

Le programme suivant trie 1 200 000 **indices** (0, 1, 2, ...) d'après une clé qui n'a que 1 000 valeurs possibles : il y a des égalités partout. Il compte ensuite, parmi les voisins de même clé, combien sont dans le désordre (l'indice recule). Il calcule aussi une **empreinte** ([FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)), un nombre calculé à partir de tout le résultat : deux ordres différents donnent presque sûrement deux empreintes différentes. Compilé avec `gcc -Wall -Wextra -O2` (voir [la compilation](/?c=langages-de-programmation&s=c&p=compilation)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>

static const int *g_cle;      /* la clé de chaque élément : g_cle[i] */
static int g_departage;       /* 1 : départager les égaux par leur indice */

/* Compare deux INDICES i et j d'après leur clé ; en cas d'égalité, l'indice tranche si demandé. */
static int par_cle(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;

    if (g_cle[i] != g_cle[j])
        return g_cle[i] < g_cle[j] ? -1 : 1;
    if (g_departage)
        return (i > j) - (i < j);
    return 0;
}

/* Taille de l'espace mémoire du processus, en octets (1er champ de /proc/self/statm, en pages). */
static size_t taille_memoire(void)
{
    unsigned long pages = 0;
    FILE *f = fopen("/proc/self/statm", "r");

    if (f) {
        if (fscanf(f, "%lu", &pages) != 1)
            pages = 0;
        fclose(f);
    }
    return pages * 4096;
}

int main(int argc, char **argv)
{
    if (argc < 3) {
        fprintf(stderr, "usage : %s n departage [marge]\n", argv[0]);
        return 1;
    }
    int n = atoi(argv[1]);
    g_departage = atoi(argv[2]);
    size_t marge = argc > 3 ? strtoull(argv[3], NULL, 10) : 0;
    int *cle = malloc(sizeof(int) * n), *ord = malloc(sizeof(int) * n);
    uint64_t x = 88172645463325252ull;    /* état d'un générateur pseudo-aléatoire (voir plus bas) */

    for (int i = 0; i < n; i++) {
        x ^= x << 13; x ^= x >> 7; x ^= x << 17;
        cle[i] = x % 1000;                /* beaucoup d'éléments, seulement 1000 clés : des égalités partout */
        ord[i] = i;                       /* ord = les indices 0, 1, 2... qu'on va trier d'après leur clé */
    }
    g_cle = cle;
    if (marge) {                          /* plafonne la mémoire : n'autorise que `marge` octets de plus */
        struct rlimit rl = { taille_memoire() + marge, taille_memoire() + marge };
        setrlimit(RLIMIT_AS, &rl);
    }
    qsort(ord, n, sizeof(int), par_cle);

    long desordre = 0;
    uint64_t empreinte = 1469598103934665603ull;
    for (int i = 0; i + 1 < n; i++)       /* deux voisins de même clé dont l'indice recule : désordre */
        if (cle[ord[i]] == cle[ord[i + 1]] && ord[i] > ord[i + 1])
            desordre++;
    for (int i = 0; i < n; i++) {         /* empreinte (FNV-1a) de l'ordre obtenu, pour comparer deux exécutions */
        empreinte ^= (uint64_t)ord[i];
        empreinte *= 1099511628211ull;
    }
    printf("départage=%d marge=%-8zu : %7ld égaux dans le désordre, empreinte %016llx\n",
           g_departage, marge, desordre, (unsigned long long)empreinte);
    return 0;
}
```

Le troisième argument fait appel à `setrlimit(RLIMIT_AS, ...)` ([page de manuel](https://man7.org/linux/man-pages/man2/setrlimit.2.html)) : il plafonne la mémoire que le programme peut encore demander. Les exécutions, sur Ubuntu 24.04 avec la glibc 2.39 :

```
$ ./stabilite 200 0
$ ./stabilite 1200000 0
$ ./stabilite 1200000 0 5000000
$ ./stabilite 1200000 0 4000000
$ ./stabilite 1200000 1
$ ./stabilite 1200000 1 4000000
```

```
départage=0 marge=0        :       0 égaux dans le désordre, empreinte a3b5c48d1a634d39
départage=0 marge=0        :       0 égaux dans le désordre, empreinte 361e06153f2ad04f
départage=0 marge=5000000  :       0 égaux dans le désordre, empreinte 361e06153f2ad04f
départage=0 marge=4000000  :  712247 égaux dans le désordre, empreinte dd7fa0798a809adf
départage=1 marge=0        :       0 égaux dans le désordre, empreinte 361e06153f2ad04f
départage=1 marge=4000000  :       0 égaux dans le désordre, empreinte 361e06153f2ad04f
```

| Exécution | Résultat | Ce que ça montre |
|---|---|---|
| 200 éléments, sans départage | 0 désordre | Sur une petite entrée, `qsort` paraît stable |
| 1 200 000 éléments, mémoire libre | 0 désordre | Sur une grande entrée aussi : la glibc 2.39 trie ici par fusion |
| mémoire plafonnée à 5 Mo de plus | 0 désordre, même empreinte | Il reste assez de place pour le tampon |
| mémoire plafonnée à 4 Mo de plus | **712 247 égaux dans le désordre**, empreinte différente | Le **même programme**, les mêmes données : un autre ordre |
| avec départage (dernier argument `1`) | 0 désordre, **même empreinte** dans les deux cas | L'ordre ne dépend plus de la mémoire |

Pourquoi ? Observé avec `strace` (qui liste les appels au système d'exploitation) : pendant le tri, `qsort` réserve un tampon de **4 800 512 octets**, la taille du tableau (1 200 000 entiers de 4 octets), qu'il libère juste après. Un tri par fusion a besoin de cette place de travail. Quand la mémoire disponible est plus petite que le tableau, la demande échoue et `qsort` se rabat sur un autre tri, sans tampon, qui n'est **pas stable** (c'est ce que mesure la ligne à 712 247 désordres). Le résultat dépend donc de la mémoire de la machine, pas seulement de vos données.

## Départager par l'indice d'origine

La parade ne dépend d'aucune implémentation : **rendre les éléments tous différents**. On trie des indices (ou des éléments qui portent leur numéro d'origine), et quand deux clés sont égales, le comparateur tranche avec l'indice :

```c
static int par_cle(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;     /* les deux indices comparés */

    if (g_cle[i] != g_cle[j])                         /* clés différentes : la clé décide */
        return g_cle[i] < g_cle[j] ? -1 : 1;
    return (i > j) - (i < j);                         /* clés égales : l'indice d'origine décide */
}
```

| Élément du code | Rôle |
|---|---|
| `const void *a` | `qsort` ne connaît pas le type des éléments : le comparateur reçoit des adresses sans type et doit les convertir (`(const int *)a`) |
| `(i > j) - (i < j)` | Renvoie -1, 0 ou 1 sans soustraction : écrire `i - j` pourrait déborder pour de grands nombres |
| `g_cle` | Le comparateur de `qsort` n'a pas de paramètre supplémentaire : la clé est lue dans un tableau global (avec plusieurs [threads](/?c=langages-de-programmation&s=c&p=threads), il faut une variable propre à chaque thread) |

Après ce changement, deux éléments ne sont **jamais égaux** pour le comparateur : il n'y a plus de cas où l'implémentation choisit. Le résultat est le même pour tous les tris, stables ou non, et pour toutes les exécutions (comme le montrent les deux dernières lignes du tableau plus haut). Cela ne coûte presque rien : un test de plus quand les clés sont égales.

| | Stable parce que l'implémentation l'est | Stable parce qu'on l'a construit |
|---|---|---|
| Garantie | Aucune par la norme C | Oui, par construction |
| Dépend de | La bibliothèque, sa version, la mémoire libre | De rien |
| Condition | Aucune | Avoir un numéro d'origine à comparer (un indice, un compteur d'arrivée) |

## Un cas réel : la file de départ d'un solveur

Un [solveur SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) qui résout une grille de 108 × 108 manipule environ **1,2 million de variables**. Au départ, il les classe dans une file ([VMTF](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) : il essaie les variables dans l'ordre de cette file). Pour que chaque copie du solveur explore différemment, on ajoute à chaque variable un petit **bruit** : un nombre aléatoire minuscule qui perturbe le classement. Ce bruit n'a que 1 000 valeurs possibles pour 1,2 million de variables : environ **1 200 variables partagent chaque valeur**, donc chaque valeur est une égalité de 1 200 éléments.

Sans départage, l'ordre de ces égalités est celui que `qsort` veut bien produire : la file de départ, et donc toute la recherche qui suit, peut changer si la machine ou la mémoire change. Avec un départage par indice croissant, la même graine donne **toujours** la même file, et deux versions du programme peuvent comparer leurs compteurs ligne à ligne. Le prototype de recherche compare seulement les scores et profite de la stabilité de la glibc de la machine ; une réécriture doit ajouter le départage par indice plutôt que de s'y fier.

## Un bruit reproductible : xorshift

Un **générateur pseudo-aléatoire** est une formule qui, à partir d'un nombre de départ (la **graine**), produit une suite de nombres qui *ressemblent* à du hasard mais qui est **entièrement déterminée** : la même graine redonne exactement la même suite. C'est exactement ce qu'il faut pour un bruit qu'on veut pouvoir **rejouer** (retrouver un résultat, comparer deux versions). L'**état** du générateur est le nombre qu'il garde en mémoire entre deux tirages.

**xorshift64** ([Marsaglia, 2003](https://www.jstatsoft.org/article/view/v008i14)) en est une version très courte : trois décalages de bits et trois « ou exclusif » ([opérateurs binaires](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

```c
#include <stdint.h>
#include <stdio.h>

/* Un pas de xorshift64 : mélange les 64 bits de l'état par trois décalages et trois XOR,
   range le résultat comme nouvel état et le renvoie. */
static uint64_t xorshift64(uint64_t *etat)
{
    uint64_t x = *etat;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *etat = x;
}

int main(void)
{
    uint64_t a = 42, b = 42, zero = 0, un = 1, deux = 2;

    printf("même graine (42), deux générateurs :\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&a), (unsigned long long)xorshift64(&b));

    printf("graine 0 :\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu\n", (unsigned long long)xorshift64(&zero));

    printf("graines voisines 1 et 2, premier tirage :\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&un), (unsigned long long)xorshift64(&deux));

    un = 0x9E3779B97F4A7C15ull * 1;       /* la graine est d'abord multipliée par une grande constante */
    deux = 0x9E3779B97F4A7C15ull * 2;
    printf("mêmes graines multipliées par 0x9E3779B97F4A7C15 :\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&un), (unsigned long long)xorshift64(&deux));
    return 0;
}
```

Sortie :

```
même graine (42), deux générateurs :
           45454805674           45454805674
  11532217803599905471  11532217803599905471
  10021416941527320954  10021416941527320954
graine 0 :
                     0
                     0
                     0
graines voisines 1 et 2, premier tirage :
            1082269761            2164539522
mêmes graines multipliées par 0x9E3779B97F4A7C15 :
  15860402102123842989  13274060130538134362
```

| Élément du code | Rôle |
|---|---|
| `uint64_t` | Entier non signé sur 64 bits : l'état a 2^64 valeurs possibles |
| `x ^= x << 13` | Décale les bits de `x` de 13 positions vers la gauche, puis mélange avec l'ancien `x` par OU exclusif (`^`) |
| `return *etat = x` | Le nouvel état **est** la valeur renvoyée |
| `0x9E3779B97F4A7C15` | Grande constante (la partie entière de 2^64 divisée par le nombre d'or) qui éloigne les graines voisines |

Ce que la sortie montre :

| Observation | Conséquence |
|---|---|
| Deux générateurs de même graine donnent la même suite | Le bruit est **reproductible** : une graine par processus, et chaque exécution se rejoue |
| La graine 0 donne 0, 0, 0... | Zéro est un état **bloqué** : les décalages de zéro sont zéro. Ne jamais partir de 0 |
| Les graines 1 et 2 donnent 1 082 269 761 puis 2 164 539 522 | Le premier tirage de la graine 2 est **exactement le double** de celui de la graine 1 : deux graines voisines donnent des débuts liés, pas indépendants |
| Après multiplication par la constante | Les premiers tirages n'ont plus aucun rapport visible entre eux |

D'où la ligne de la version du solveur : `x = 0x9E3779B97F4A7C15 * graine`, puis tirages. La multiplication transforme 1, 2, 3... en états éloignés les uns des autres.

### Du nombre de 64 bits au bruit de 0 à 999

Le programme suivant tire 1 200 000 bruits `x % 1000` (le **reste** de la division par 1 000, un nombre de 0 à 999) et vérifie que les 1 000 valeurs sortent à peu près aussi souvent les unes que les autres, avec le **test du χ²** décrit dans [Comparer deux réglages](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages) : pour 1 000 valeurs, un résultat honnête vaut environ 999, à ± 45 près.

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t xorshift64(uint64_t *etat)
{
    uint64_t x = *etat;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *etat = x;
}

int main(void)
{
    enum { N = 1200000, VALEURS = 1000 };
    static int compte[VALEURS];           /* compte[v] : combien de variables ont reçu le bruit v */

    for (uint64_t graine = 1; graine <= 3; graine++) {
        uint64_t etat = 0x9E3779B97F4A7C15ull * graine;
        double attendu = (double)N / VALEURS, chi2 = 0;
        int distinctes = 0, plus_gros = 0;

        memset(compte, 0, sizeof compte);
        for (int i = 0; i < N; i++)
            compte[xorshift64(&etat) % VALEURS]++;     /* le bruit : un nombre de 0 à 999 */
        for (int v = 0; v < VALEURS; v++) {
            distinctes += compte[v] > 0;
            if (compte[v] > plus_gros)
                plus_gros = compte[v];
            chi2 += (compte[v] - attendu) * (compte[v] - attendu) / attendu;
        }
        printf("graine %llu : %d valeurs distinctes, plus gros groupe %d, chi2 = %.1f\n",
               (unsigned long long)graine, distinctes, plus_gros, chi2);
    }
    printf("2^64 mod 1000 = %llu\n", (unsigned long long)((UINT64_MAX % VALEURS + 1) % VALEURS));
    return 0;
}
```

Sortie :

```
graine 1 : 1000 valeurs distinctes, plus gros groupe 1304, chi2 = 942.1
graine 2 : 1000 valeurs distinctes, plus gros groupe 1323, chi2 = 1044.4
graine 3 : 1000 valeurs distinctes, plus gros groupe 1319, chi2 = 1052.4
2^64 mod 1000 = 616
```

| Mesure | Valeur | Lecture |
|---|---|---|
| Valeurs distinctes | 1 000 sur 1 000 | Toutes les valeurs sortent |
| Plus gros groupe | 1 304 à 1 323, pour une moyenne de 1 200 | C'est bien l'ordre de grandeur de **1 200 égalités par valeur** |
| χ² | 942 à 1 052 (attendu 999 ± 45) | Les écarts sont ceux du hasard : le reste de la division par 1 000 est uniforme en pratique |
| 2^64 mod 1000 | 616 | Ces 616 valeurs sortent une fois de plus que les autres sur environ 1,8 × 10^16 tirages possibles : un biais de l'ordre de 10^-16, sans effet |

> **Limite :** xorshift n'est **pas** fait pour la sécurité (la valeur renvoyée est l'état lui-même : un seul tirage connu permet de prédire tous les suivants) ni pour les simulations statistiques exigeantes. Pour un bruit qui perturbe un classement ou diversifie des copies d'un programme, il suffit largement. `rand()` de la bibliothèque C ferait aussi un bruit, mais la norme ne fixe pas son algorithme : la suite pour une graine donnée peut changer d'une bibliothèque à l'autre.

## Les pièges

| Piège | Ce qui arrive | Parade |
|---|---|---|
| Compter sur la stabilité de `qsort` | Marche tant que la mémoire suffit (glibc 2.39), puis l'ordre des égaux change sans erreur ni message | Départager par l'indice d'origine dans le comparateur |
| Tester la stabilité sur une petite entrée | 200 éléments semblent stables : le test ne dit rien du cas de 1,2 million | Tester à la taille réelle, et avec la mémoire plafonnée |
| Comparateur `return a - b` | Déborde pour de grands nombres : ordre faux sans message | `(a > b) - (a < b)` |
| Graine 0 avec xorshift | La suite reste 0 pour toujours | Multiplier la graine par une constante impaire et refuser 0 |
| Graines voisines non mélangées | Débuts de suites liés (le double l'un de l'autre) | Multiplier la graine par `0x9E3779B97F4A7C15` |
| Utiliser xorshift pour un secret | Un tirage connu donne tous les suivants | Un générateur cryptographique ([`getrandom`](https://man7.org/linux/man-pages/man2/getrandom.2.html)) |
| Conclure du bruit sans le tester | Un générateur ou un `% n` mal choisi peut déséquilibrer les valeurs | Vérifier l'uniformité par un test du χ² |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un tri est **stable** s'il garde l'ordre d'arrivée des éléments égaux. `qsort` ne le garantit pas (norme C) : la glibc 2.39 trie par fusion tant qu'un tampon de la taille du tableau est disponible, puis bascule sur un tri non stable (712 247 égaux dans le désordre sur 1,2 million d'éléments avec la mémoire plafonnée). Un comparateur qui départage par l'indice d'origine donne le même résultat avec tous les tris. xorshift64 (trois décalages, trois XOR) produit un bruit reproductible par graine. |
| **Outils utilisables** | `qsort` avec un comparateur à départage par indice, une empreinte (FNV-1a) pour comparer deux ordres, `setrlimit(RLIMIT_AS)` pour tester sous mémoire limitée, `strace` pour observer le tampon de `qsort`, xorshift64 avec graine multipliée par `0x9E3779B97F4A7C15`, le test du χ² pour vérifier l'uniformité. |
| **Pièges à éviter** | Se fier à la stabilité observée d'un `qsort`, la tester sur une petite entrée, un comparateur par soustraction, la graine 0, des graines voisines non mélangées, xorshift pour un secret. |
| **Bonnes pratiques** | Ne jamais laisser le résultat dépendre de la façon dont un tri traite les égalités : départager explicitement. Une graine par exécution, affichée ou fixée, pour pouvoir rejouer. Vérifier à la taille réelle. |
