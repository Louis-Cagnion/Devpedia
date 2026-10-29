---
order: 30
---

# Filtrer une chaîne sur place avec deux pointeurs

Retirer des caractères d'un texte (des espaces en trop, des sauts de ligne, tout ce qui n'est pas une lettre) paraît simple tant qu'on a le droit de fabriquer un second texte. Ce chapitre montre comment le faire **sur place** : dans la mémoire même du texte d'origine, sans rien allouer, en un seul passage. La technique repose sur deux pointeurs, un qui lit et un qui écrit. Elle fait rencontrer trois notions que le C utilise partout : l'écriture `*out++ = *p`, la différence entre `*p++` et `(*p)++`, et la soustraction de deux pointeurs.

Il suppose connus [les pointeurs](/?c=langages&s=c&p=pointeurs) (une variable qui contient l'adresse d'une autre ; `*p` lit ou écrit la case visée ; `p + 1` désigne la case suivante, voir [l'arithmétique de pointeurs](/?c=langages&s=c&p=pointeurs#arithmetique-de-pointeurs)), [les chaînes de caractères](/?c=langages&s=c&p=variables#les-chaines-de-caracteres) (un tableau de `char` terminé par le **caractère nul** `'\0'`, de code 0, qui marque la fin du texte) et [les boucles](/?c=langages&s=c&p=boucles). Un `char` est un petit entier qui code une lettre, un chiffre ou un signe : `'a'` vaut 97, et `'a' + 1` vaut `'b'`.

## Le problème : retirer des caractères sans seconde chaîne

Deux filtres servent de fil rouge à tout le chapitre.

| Filtre | Règle | Avant | Après |
|---|---|---|---|
| Espaces en trop | Une suite d'espaces devient un seul espace | `a   b  c` | `a b c` |
| Lignes coupées | Une barre oblique inversée `\` suivie d'un saut de ligne disparaît | `un \` + saut de ligne + `deux` | `un deux` |

La **barre oblique inversée** (*backslash*) `\` et le **saut de ligne** (le caractère qui termine une ligne, écrit `'\n'` en C) sont deux caractères comme les autres. Dans un texte écrit entre guillemets en C, le `\` introduit un caractère spécial (`\n`, `\0`) : pour désigner un vrai `\`, on en écrit deux, `'\\'`.

### Première idée : décaler la suite à chaque suppression

Dès qu'un caractère doit disparaître, on recule d'une case tout ce qui le suit. `memmove(destination, source, n)` ([documentation](https://en.cppreference.com/w/c/string/byte/memmove)) copie `n` octets d'une zone vers une autre, même si les deux zones se chevauchent (ce que `memcpy` n'a pas le droit de faire, voir [copier et remplir des octets](/?c=langages&s=c&p=memoire#copier-et-remplir-des-octets-memcpy-et-memset)). `strlen(t)` ([documentation](https://en.cppreference.com/w/c/string/byte/strlen)) compte les caractères de `t` jusqu'au `'\0'`. Le programme compte aussi les octets déplacés, pour mesurer le coût. Les éléments qu'il emploie :

| Élément | Rôle |
|---|---|
| `size_t` | Entier sans signe fait pour une taille ou une longueur (celui que renvoie `strlen`) |
| `unsigned long` | Entier sans signe, assez grand pour un total qui dépasse quelques milliards |
| `&octets` | L'adresse de la variable `octets`, pour que la fonction la modifie (voir [passer un pointeur à une fonction](/?c=langages&s=c&p=pointeurs#passer-un-pointeur-a-une-fonction-passage-par-adresse)) |
| `%s`, `%zu`, `%lu`, `%c`, `%td` | Emplacements de `printf` pour un texte, un `size_t`, un `unsigned long`, un caractère, un `ptrdiff_t` |
| `[%s]` | Les crochets autour du texte montrent où il commence et où il finit (utile pour voir les espaces) |

```c
#include <stdio.h>
#include <string.h>

// Réduit chaque suite d'espaces à un seul, en décalant la suite du texte.
// Ajoute à *octets le nombre d'octets déplacés, pour mesurer le coût.
void compacter_naif(char *s, unsigned long *octets)
{
    size_t i = 0;                       // position courante dans s

    while (s[i] != '\0') {              // jusqu'à la fin du texte
        if (s[i] == ' ' && s[i + 1] == ' ') {   // deux espaces de suite : un est en trop
            size_t reste = strlen(s + i + 1) + 1;   // octets à décaler, '\0' compris
            memmove(s + i, s + i + 1, reste);       // recule toute la suite d'une case
            *octets += reste;           // on note le coût de ce décalage
        } else {
            i++;                        // rien à retirer ici : on avance
        }
    }
}

int main(void)
{
    char          s[] = "a   b  c";     // 3 espaces entre a et b, 2 entre b et c
    unsigned long octets = 0;           // total des octets déplacés

    compacter_naif(s, &octets);         // filtre s sur place
    printf("[%s] après %lu octets déplacés\n", s, octets);   // [ ] montrent les bords
    return 0;
}
```

```text
[a b c] après 16 octets déplacés
```

Le résultat est juste, mais le travail est gaspillé : les trois suppressions ont déplacé 7, puis 6, puis 3 octets, soit 16. Chaque suppression recopie **tout ce qui reste** : sur un texte de `n` caractères qui contient de l'ordre de `n` suppressions, le total grandit comme `n × n / 2`. On parle de coût **quadratique**, noté `O(n²)` (voir [la complexité et la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) : un texte dix fois plus long demande cent fois plus de travail. La section « Mesurer la différence » plus bas le chiffre.

### Deuxième idée : un seul passage avec deux pointeurs

Au lieu de reculer la suite à chaque fois, on parcourt le texte **une seule fois** et on recopie, au fur et à mesure, uniquement ce qu'on garde, vers le début du même tableau. Rien à décaler, rien à allouer.

| Approche | Mémoire en plus | Travail | Défaut |
|---|---|---|---|
| Copier dans une seconde chaîne | Une chaîne entière ([`malloc` puis `free`](/?c=langages&s=c&p=memoire#allouer-de-la-memoire-dynamiquement)) | Un passage | Peut échouer faute de mémoire ; à libérer |
| Décaler la suite à chaque suppression | Aucune | Quadratique | Devient lent sur un long texte |
| **Deux pointeurs, sur place** | Aucune | Un passage (**linéaire** : le travail grandit comme `n`) | Modifie le texte de l'appelant |

## Le principe : un pointeur qui lit, un pointeur qui écrit

Deux pointeurs visent le **même tableau**, tous deux au départ sur la première case :

| Pointeur | Nom usuel | Rôle | Avance quand ? |
|---|---|---|---|
| Lecture | `p` | Examine chaque caractère, du premier au `'\0'` | À chaque tour de boucle |
| Écriture | `out` | Désigne la case où écrire le prochain caractère gardé | Seulement quand un caractère est gardé |

Une règle garde l'ensemble sûr : **`out <= p` à tout moment**. Les deux pointeurs partent de la même case ; à chaque tour, `p` avance d'une case (ou plus) et `out` d'une case au plus. `out` ne peut donc jamais rattraper puis dépasser `p`, et chaque case où l'on écrit a déjà été lue : on n'écrase jamais un caractère qu'on n'a pas encore examiné. Le schéma suit le filtre des espaces en trop sur `"a  b"` (le `_` représente un espace, `^` marque la case visée) :

```text
Tour 1 : lit 'a'  -> gardé, copié en case 0 (sur lui-même)
  case :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :  ^
  out  :  ^

Tour 2 : lit '_', le dernier écrit est 'a'  -> gardé, copié en case 1
  case :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :      ^
  out  :      ^

Tour 3 : lit '_', le dernier écrit est '_'  -> ignoré, out ne bouge pas
  case :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :          ^
  out  :          ^

Tour 4 : lit 'b'  -> gardé, copié en case 2 (sur un espace déjà lu)
  case :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :              ^
  out  :          ^

Fin : p lit '\0', la boucle s'arrête ; reste à écrire '\0' en case 3
  case :  0   1   2   3   4
  s    :  a   _   b   b   \0
  p    :                  ^
  out  :              ^
```

Au tour 3, l'écart entre les deux pointeurs apparaît : `p` a avancé, pas `out`. Ensuite, `out` est une case derrière `p` jusqu'à la fin. La règle `out <= p` vaut pour les filtres qui écrivent **au plus un caractère par caractère lu** (supprimer, garder, remplacer un caractère par un autre) ; un filtre qui allongerait le texte la violerait (voir « Quand ça tourne mal »).

## `*out++ = *p` décortiqué

Cette ligne recopie le caractère lu à la place d'écriture, puis avance `out`. Elle combine trois opérateurs (des symboles qui calculent quelque chose) :

| Opérateur | Nom | Effet |
|---|---|---|
| `*` devant un pointeur | Déréférencement | Désigne la case visée par le pointeur, pour la lire ou y écrire |
| `++` après une variable (`out++`) | Incrément **postfixe** | Avance la variable d'un cran **après** avoir fourni sa valeur d'avant |
| `++` avant une variable (`++out`) | Incrément **préfixe** | Avance la variable **avant** de fournir sa valeur |

Pour un pointeur, « d'un cran » veut dire d'une case de son type (une case de `char` ici, voir [l'arithmétique de pointeurs](/?c=langages&s=c&p=pointeurs#arithmetique-de-pointeurs)). Reste à savoir lequel s'applique en premier, `*` ou `++`. C'est la **priorité** des opérateurs (l'ordre dans lequel le langage les applique quand ils se suivent, voir le [tableau officiel](https://en.cppreference.com/w/c/language/operator_precedence)) : le `++` postfixe passe avant le `*`. Donc `*out++` se lit `*(out++)` :

1. `out++` fournit l'**ancienne** adresse de `out`, et `out` avance d'une case ;
2. le `*` s'applique à l'ancienne adresse : c'est la case où l'on écrit.

Autrement dit, `*out++ = *p;` fait exactement ce que font ces deux lignes :

```c
*out = *p;   // écrit à l'adresse que out contenait
out++;       // puis seulement avance out
```

| Écriture compacte | Équivalent développé |
|---|---|
| `*out++ = *p;` | `*out = *p; out++;` |
| `*out++ = *p++;` | `*out = *p; out++; p++;` |
| `c = *p++;` | `c = *p; p++;` |
| `*++out = *p;` | `out++; *out = *p;` (avance **avant** d'écrire) |

Le même raisonnement distingue quatre expressions qui se ressemblent. Le programme les essaie chacune sur le texte `"abc"` ; `p - t` est le nombre de cases dont `p` s'est éloigné de `t` (la soustraction de pointeurs est détaillée plus bas). Les parenthèses de `(*p)++` comptent : sans elles, `*p++` serait lu `*(p++)`.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char  t[] = "abc";                  // le texte de départ
    char *p = t;                        // p pointe sur t[0], qui vaut 'a'
    char  v;                            // la valeur que produit l'expression essayée

    v = *p++;                           // lit la case visée, puis avance p
    printf("*p++   : valeur %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // remet le texte de départ, '\0' compris
    p = t;                              // et p sur la première case
    v = (*p)++;                         // lit la valeur, puis l'augmente de 1 dans t[0]
    printf("(*p)++ : valeur %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // même remise à zéro
    p = t;
    v = *++p;                           // avance p d'abord, puis lit la case atteinte
    printf("*++p   : valeur %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // même remise à zéro
    p = t;
    v = ++*p;                           // augmente t[0] de 1, puis lit la nouvelle valeur
    printf("++*p   : valeur %c, p - t = %td, t = %s\n", v, p - t, t);
    return 0;
}
```

```text
*p++   : valeur a, p - t = 1, t = abc
(*p)++ : valeur a, p - t = 0, t = bbc
*++p   : valeur b, p - t = 1, t = abc
++*p   : valeur b, p - t = 0, t = bbc
```

| Expression | Se lit | Valeur produite | Ce qui change |
|---|---|---|---|
| `*p++` | `*(p++)` | `a` : la case visée **avant** d'avancer | `p` avance d'une case ; le texte est intact |
| `(*p)++` | `(*p)++` | `a` : la valeur **avant** l'augmentation | `t[0]` passe de `a` à `b` ; `p` ne bouge pas |
| `*++p` | `*(++p)` | `b` : la case atteinte **après** avoir avancé | `p` avance d'une case ; le texte est intact |
| `++*p` | `++(*p)` | `b` : la valeur **après** l'augmentation | `t[0]` passe de `a` à `b` ; `p` ne bouge pas |

Pour s'en souvenir : le `++` agit sur ce qui lui est **collé**. Dans `*p++`, il est collé à `p`, donc c'est le pointeur qui avance. Dans `(*p)++` et `++*p`, il porte sur `*p`, donc c'est la valeur pointée qui change. Quant au préfixe et au postfixe, le second fournit la valeur d'**avant**, le premier celle d'**après**.

> **Piège :** écrire `*p++;` seul, en croyant augmenter la valeur pointée. Cela avance `p` et jette la valeur lue ; avec `-Wall` (l'option qui active les avertissements usuels de [`gcc`](/?c=langages&s=c&p=compilation), le compilateur : le programme qui traduit le C en programme exécutable), le compilateur prévient : `warning: value computed is not used`. Pour augmenter la valeur, c'est `(*p)++`.

Dernière précaution : dans `*out++ = *p++`, deux variables différentes sont modifiées (`out` et `p`), ce qui est sans danger. En revanche, une expression qui **modifie** une variable et la **lit** par ailleurs, comme `*out++ = *out`, a un **comportement indéfini** (le langage ne dit pas ce qui se passe : du plantage à un résultat faux qui semble juste) : il n'impose pas l'ordre dans lequel ses parties s'exécutent (voir [l'ordre d'évaluation](/?c=langages&s=c&p=operateur-virgule#piege-l-ordre-d-evaluation-des-arguments-n-est-pas-specifie)). Règle : une variable modifiée dans une expression n'y est pas lue ailleurs.

## Premier filtre complet : retirer les espaces en trop

On applique le schéma du chapitre au filtre des espaces. À chaque tour, on décide si le caractère lu est gardé : tout caractère qui n'est pas un espace l'est ; un espace ne l'est que si le dernier caractère écrit n'en est pas un.

```c
#include <stddef.h>
#include <stdio.h>

// Réduit chaque suite d'espaces à un seul espace, sur place.
// Renvoie la nouvelle longueur de s, sans compter le '\0'.
size_t compacter_espaces(char *s)
{
    const char *p = s;                  // pointeur de LECTURE : parcourt toute la chaîne
    char       *out = s;                // pointeur d'ÉCRITURE : ne suit que ce qu'on garde

    while (*p != '\0') {                // jusqu'au '\0' qui termine la chaîne
        if (*p != ' ' || out == s || out[-1] != ' ')   // caractère à garder ?
            *out++ = *p;                // l'écrit, puis avance out
        p++;                            // la lecture avance à chaque tour, gardé ou non
    }
    *out = '\0';                        // pose la nouvelle fin de chaîne
    return (size_t)(out - s);           // nombre de caractères gardés
}

int main(void)
{
    char   a[] = "a  b";                // deux espaces entre a et b
    char   b[] = "  un   deux    trois  ";   // des suites d'espaces de tailles variées
    size_t n;                           // longueur rendue par compacter_espaces

    n = compacter_espaces(a);           // filtre a sur place
    printf("[%s] longueur %zu\n", a, n);
    n = compacter_espaces(b);           // filtre b sur place
    printf("[%s] longueur %zu\n", b, n);
    return 0;
}
```

```text
[a b] longueur 3
[ un deux trois ] longueur 15
```

La condition de garde se lit morceau par morceau. Les trois tests sont reliés par `||` (« ou »), qui s'arrête dès qu'un test est vrai sans évaluer les suivants (voir [l'évaluation en court-circuit](/?c=langages&s=c&p=boucles#evaluation-en-court-circuit-de)) : c'est ce qui rend `out == s` protecteur.

| Morceau | Question posée | Rôle |
|---|---|---|
| `*p != ' '` | Le caractère lu n'est pas un espace ? | Tout autre caractère est gardé |
| `out == s` | Rien n'est encore écrit ? | Au départ, `out[-1]` serait la case **avant** le tableau : on ne la lit pas |
| `out[-1] != ' '` | Le dernier caractère écrit n'est pas un espace ? | Garde le premier espace d'une suite, ignore les suivants |

`out[-1]` est `*(out - 1)` : la case juste **derrière** `out`, donc le dernier caractère écrit (voir [`[]` n'est que du sucre syntaxique](/?c=langages&s=c&p=pointeurs#n-est-que-du-sucre-syntaxique) dans le chapitre sur les pointeurs). Un indice négatif est légal sur un pointeur, tant que la case visée appartient au tableau.

Le pointeur de lecture est déclaré `const char *p` : il promet de ne jamais écrire. Si le code essayait `*p = ...`, le compilateur refuserait. Seul `out` écrit. Ce partage des rôles évite de se tromper de pointeur.

Remarque sur les bords : les espaces au début et à la fin ne disparaissent pas, ils sont réduits à un seul (`"  un ... trois  "` devient `" un ... trois "`). Les retirer totalement est un autre filtre, qui demande de connaître la fin de la chaîne.

## Le terminateur : écrire le `'\0'` final

Une chaîne C finit au **premier** `'\0'` qu'on rencontre. Après le filtre, le texte est plus court, mais l'ancien `'\0'` est resté plus loin : sans nouveau terminateur, l'ancienne fin du texte réapparaît. Le programme suivant est celui des espaces, auquel on a retiré la ligne `*out = '\0'` :

```c
#include <stdio.h>
#include <string.h>

// Même filtre que compacter_espaces, mais OUBLIE de terminer la chaîne.
void compacter_sans_fin(char *s)
{
    const char *p = s;                  // pointeur de lecture
    char       *out = s;                // pointeur d'écriture

    while (*p != '\0') {                // parcourt toute la chaîne
        if (*p != ' ' || out == s || out[-1] != ' ')   // caractère à garder ?
            *out++ = *p;                // l'écrit, puis avance out
        p++;                            // la lecture avance à chaque tour
    }
                                        // oubli : pas de *out = '\0' ici
}

int main(void)
{
    char s[] = "a  b";                  // 4 caractères, plus le '\0' en case 4

    compacter_sans_fin(s);              // filtre s sans le terminer
    printf("[%s] longueur %zu\n", s, strlen(s));   // attendu : [a b] longueur 3
    return 0;
}
```

```text
[a bb] longueur 4
```

```text
case :  0   1   2   3   4
avant   a   _   _   b   \0
sans    a   _   b   b   \0      <- le 'b' de la case 3 est resté : texte « a bb »
avec    a   _   b   \0  \0      <- *out = '\0' en case 3 : le texte s'arrête là
```

Aucune erreur n'est signalée : tout reste dans le tableau, le programme "marche" et affiche un texte faux. Ce bug n'est pas détecté par les [sanitizers](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) (outils de contrôle à l'exécution) ; seul un test qui compare le résultat attendu le trouve. La ligne `*out = '\0';` se place **toujours** après la boucle, avant de rendre la main.

## Mesurer la différence

Reprenons les deux versions sur le pire cas du décalage : `n` espaces suivis d'un `x`. (`sizeof tableau` donne la taille en octets du tableau, voir [`sizeof`](/?c=langages&s=c&p=memoire#sizeof) ; diviser par la taille d'une case donne le nombre de cases.) Le `main` ci-dessous suppose `compacter_naif` et `compacter_espaces` recopiées au-dessus de lui, telles que présentées plus haut.

```c
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// (ici : compacter_naif et compacter_espaces, recopiées des sections précédentes)

int main(void)
{
    size_t tailles[] = {1000, 10000, 100000};   // longueurs de suites d'espaces à tester
    size_t nb = sizeof tailles / sizeof tailles[0];   // nombre d'essais

    for (size_t k = 0; k < nb; k++) {   // un essai par longueur
        size_t n = tailles[k];          // nombre d'espaces de cet essai
        char  *a = malloc(n + 2);       // n espaces, un 'x', un '\0'
        char  *b = malloc(n + 2);       // même texte, pour la version à deux pointeurs
        unsigned long octets = 0;       // octets déplacés par la version naïve

        if (a == NULL || b == NULL)     // plus de mémoire : on abandonne
            return 1;
        memset(a, ' ', n);              // n espaces d'affilée : pire cas du décalage
        a[n] = 'x';                     // un caractère visible après les espaces
        a[n + 1] = '\0';                // fin de chaîne
        memcpy(b, a, n + 2);            // copie identique, '\0' compris
        compacter_naif(a, &octets);     // version qui décale
        compacter_espaces(b);           // version à deux pointeurs
        printf("n = %6zu : naïf %11lu octets déplacés, ", n, octets);
        printf("deux pointeurs %6zu lus, ", n + 1);   // le texte entier, lu une seule fois
        printf("égaux : %s\n", strcmp(a, b) == 0 ? "oui" : "non");   // même résultat ?
        free(a);                        // rend la mémoire
        free(b);
    }
    return 0;
}
```

```text
n =   1000 : naïf      501498 octets déplacés, deux pointeurs   1001 lus, égaux : oui
n =  10000 : naïf    50014998 octets déplacés, deux pointeurs  10001 lus, égaux : oui
n = 100000 : naïf  5000149998 octets déplacés, deux pointeurs 100001 lus, égaux : oui
```

Les deux colonnes ne comptent pas les mêmes choses (des octets déplacés d'un côté, des caractères lus de l'autre), mais leur évolution parle : quand le texte est multiplié par 10, le travail du décalage est multiplié par 100, celui des deux pointeurs par 10.

| Longueur `n` | Décalage (octets déplacés) | Deux pointeurs (caractères lus) | Rapport entre les deux |
|---|---|---|---|
| 1 000 | 501 498 | 1 001 | environ 500 |
| 10 000 | 50 014 998 | 10 001 | environ 5 000 |
| 100 000 | 5 000 149 998 | 100 001 | environ 50 000 |

Le rapport est multiplié par 10 à chaque ligne : l'écart ne cesse de se creuser avec la taille du texte.

## La différence de deux pointeurs : la nouvelle longueur

À la fin de `compacter_espaces`, `out` a avancé d'une case par caractère gardé depuis `s`. Le nombre de caractères gardés est donc l'écart entre `out` et `s`, et la **soustraction de deux pointeurs** le donne directement : `out - s`. Pas besoin de rappeler `strlen`, qui reparcourrait tout le texte.

Le résultat a pour type `ptrdiff_t` ([documentation](https://en.cppreference.com/w/c/types/ptrdiff_t)), défini dans `<stddef.h>` : un entier **signé** (le résultat peut être négatif si le premier pointeur est avant le second) fait pour contenir un écart entre pointeurs. `printf` l'affiche avec `%td`. L'écart se compte **en cases du type pointé**, pas en octets, comme l'addition d'un entier à un pointeur :

```c
#include <stddef.h>
#include <stdio.h>

int main(void)
{
    int       tab[5] = {10, 20, 30, 40, 50};   // 5 entiers côte à côte en mémoire
    int      *debut = &tab[1];          // adresse de la case 1 (valeur 20)
    int      *fin = &tab[4];            // adresse de la case 4 (valeur 50)
    ptrdiff_t cases = fin - debut;      // écart en CASES (en int), pas en octets
    ptrdiff_t octets = (char *)fin - (char *)debut;   // même écart, vu octet par octet

    printf("fin - debut = %td cases\n", cases);
    printf("en octets   = %td\n", octets);
    printf("debut + cases == fin : %d\n", debut + cases == fin);   // 1 = vrai
    return 0;
}
```

```text
fin - debut = 3 cases
en octets   = 12
debut + cases == fin : 1
```

Trois cases d'écart, soit 12 octets parce qu'un `int` en occupe 4 sur cette machine. Pour un tableau de `char`, une case vaut un octet, les deux comptes coïncident, mais le principe reste « en cases ». La soustraction est l'inverse de l'addition : `debut + (fin - debut)` redonne `fin`. Les opérations permises entre pointeurs :

| Opération | Sens | Permise ? |
|---|---|---|
| `p + n`, `p - n` | Pointeur avancé ou reculé de `n` cases | Oui, sans sortir du tableau (la case juste après la fin est permise, pas plus loin) |
| `p - q` | Nombre de cases entre `q` et `p`, de type `ptrdiff_t` | Oui, si `p` et `q` visent le **même** tableau |
| `p < q`, `p <= q` | Quelle adresse vient avant | Oui, si même tableau |
| `p + q` | Aucun sens | Non : le compilateur refuse (`invalid operands to binary +`) |
| `p - q` sur deux tableaux distincts | Écart sans signification | Non : comportement indéfini |

Dans nos filtres, `out` et `s` visent le même tableau et `out >= s` : l'écart est positif, on le convertit sans risque en `size_t` avec `(size_t)(out - s)`. Après un filtre correct, `out - s` et `strlen(s)` sont égaux ; si `'\0'` a été oublié, ils diffèrent (`out - s` vaut 3 et `strlen(s)` vaut 4 dans le programme de la section précédente).

## Regarder en avant : recoller les lignes coupées par `\`

Dans un fichier de configuration, un script (un fichier de commandes) ou un [`Makefile`](/?c=langages&s=c&p=makefiles), un `\` suivi d'un saut de ligne dit « cette ligne continue sur la suivante ». Le deuxième filtre supprime ces deux caractères pour recoller le texte. Il ne peut pas décider en regardant le seul caractère courant : un `\` n'est à retirer que **si le suivant est un saut de ligne**. Il lit donc `p[1]`, la case juste après celle de `p` :

| `*p` | `p[1]` | Action | Pourquoi |
|---|---|---|---|
| `\` | `'\n'` | `p += 2`, rien n'est écrit | Le couple à supprimer |
| `\` | autre caractère | Recopier le `\` | Ce n'est pas une continuation |
| `\` | `'\0'` | Recopier le `\` | `p[1]` est la fin de la chaîne : on ne lit rien au-delà |
| autre chose | non lu | Recopier le caractère | `&&` s'arrête avant d'évaluer `p[1]` |

La lecture de `p[1]` est sûre parce que la boucle ne tourne que tant que `*p != '\0'` : la case suivante existe forcément, au pire c'est le terminateur. Lire `p[2]` sans avoir vérifié `p[1]` ne le serait pas : si `p[1]` est le `'\0'`, `p[2]` est déjà hors du tableau.

```c
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Supprime chaque couple « \ puis saut de ligne » de s, sur place.
// Renvoie la nouvelle longueur de s.
size_t recoller_lignes(char *s)
{
    const char *p = s;                  // pointeur de LECTURE
    char       *out = s;                // pointeur d'ÉCRITURE

    while (*p != '\0') {                // jusqu'à la fin de la chaîne
        if (*p == '\\' && p[1] == '\n')   // '\' suivi d'un saut de ligne ?
            p += 2;                     // saute les deux caractères, sans rien écrire
        else
            *out++ = *p++;              // recopie un caractère et avance les deux pointeurs
    }
    *out = '\0';                        // pose la nouvelle fin de chaîne
    return (size_t)(out - s);           // nouvelle longueur
}

int main(void)
{
    char a[] = "un \\\ndeux \\\ntrois\n";   // le texte contient deux « \ » + saut de ligne
    char b[] = "fin\\";                 // un '\' tout à la fin, rien derrière
    size_t avant = strlen(a);           // longueur avant le filtre
    size_t apres = recoller_lignes(a);  // longueur après le filtre

    printf("%s", a);                    // le texte recollé garde son saut de ligne final
    printf("avant %zu, après %zu\n", avant, apres);
    recoller_lignes(b);                 // p[1] vaut '\0' : le '\' est gardé
    printf("[%s]\n", b);
    return 0;
}
```

```text
un deux trois
avant 18, après 14
[fin\]
```

Le texte de `a` contient `un \`, un saut de ligne, `deux \`, un saut de ligne, `trois` et un dernier saut de ligne : 18 caractères. Deux couples de deux caractères disparaissent, il en reste 14. Dans ce filtre, `p` avance parfois de deux cases alors que `out` ne bouge pas : l'écart entre les deux pointeurs grandit, ce que la règle `out <= p` permet. Le cas de `b` vérifie la lecture en bout de chaîne : le `\` final est conservé, et rien n'est lu après le `'\0'`.

> **Piège :** un fichier venu de Windows termine souvent ses lignes par deux caractères, `\r` (retour chariot) puis `\n`. Un `\` suivi de `\r\n` n'est alors pas reconnu par ce filtre. Si le texte peut venir de Windows, il faut tester aussi `p[1] == '\r' && p[2] == '\n'`, en vérifiant d'abord que `p[1]` n'est pas le `'\0'`.

## Une fonction réutilisable : `filtrer`

Quand le critère ne dépend que du caractère lui-même (est-ce une lettre ? un chiffre ?), on écrit la boucle **une seule fois** et on lui passe le critère en argument. Le critère est une fonction, transmise par un [pointeur de fonction](/?c=langages&s=c&p=pointeurs#pointeurs-de-fonctions) : `int (*garder)(int)` se lit « `garder` est un pointeur vers une fonction qui reçoit un `int` et renvoie un `int` ». Le caractère est passé sous forme de `int`, la convention des fonctions de `<ctype.h>` (en-tête de la bibliothèque standard qui regroupe les tests sur les caractères) : `isalpha(c)` ([documentation](https://en.cppreference.com/w/c/string/byte/isalpha)) renvoie une valeur non nulle si `c` est une lettre, `isdigit(c)` si c'est un chiffre de 0 à 9, et 0 sinon.

Le critère doit recevoir la valeur du caractère **sans signe** (de 0 à 255). Un `char` peut être négatif sur beaucoup de machines (c'est le cas des octets au-delà de 127, que l'on rencontre dans les accents d'un texte [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)), et passer une valeur négative à `isalpha` est interdit par la norme. D'où la conversion `(unsigned char)*p` avant l'appel.

```c
#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Garde dans s les caractères pour lesquels garder() renvoie vrai (non nul).
// Modifie s sur place et renvoie la nouvelle longueur.
size_t filtrer(char *s, int (*garder)(int))
{
    const char *p = s;                  // pointeur de LECTURE
    char       *out = s;                // pointeur d'ÉCRITURE

    if (s == NULL || garder == NULL)    // rien à filtrer, ou pas de critère
        return 0;
    while (*p != '\0') {                // parcourt toute la chaîne
        if (garder((unsigned char)*p))  // le critère juge la valeur sans signe
            *out++ = *p;                // gardé : écrit, puis avance out
        p++;                            // la lecture avance dans tous les cas
    }
    *out = '\0';                        // pose la nouvelle fin de chaîne
    return (size_t)(out - s);           // nouvelle longueur
}

// Une fonction à soi : vrai pour une voyelle (lettres sans accent).
int est_voyelle(int c)
{
    return c != '\0' && strchr("aeiouyAEIOUY", c) != NULL;   // strchr('\0') serait vrai
}

int main(void)
{
    char   a[] = "Salut R2-D2, code 42";   // un texte mêlant lettres, chiffres et signes
    char   b[] = "Salut R2-D2, code 42";   // une copie par filtre : chacun modifie la sienne
    char   c[] = "Salut R2-D2, code 42";
    size_t n;                           // longueur rendue par filtrer

    n = filtrer(a, isalpha);            // isalpha : vrai pour une lettre
    printf("isalpha     : [%s] (%zu)\n", a, n);
    n = filtrer(b, isdigit);            // isdigit : vrai pour un chiffre de 0 à 9
    printf("isdigit     : [%s] (%zu)\n", b, n);
    n = filtrer(c, est_voyelle);        // notre propre critère
    printf("est_voyelle : [%s] (%zu)\n", c, n);
    return 0;
}
```

```text
isalpha     : [SalutRDcode] (11)
isdigit     : [2242] (4)
est_voyelle : [auoe] (4)
```

`strchr(t, c)` cherche le caractère `c` dans `t` (voir [chercher une chaîne](/?c=langages&s=c&p=variables#chercher-et-comparer-une-chaine-strcmp-strchr-strrchr-strstr)). Elle considère le `'\0'` final comme faisant partie de `t` : `strchr("abc", '\0')` ne renvoie pas `NULL`. Dans `filtrer`, `est_voyelle` ne reçoit jamais `'\0'`, mais la garde `c != '\0'` évite de dépendre de son appelant.

| Appel | Critère | Texte d'origine | Résultat |
|---|---|---|---|
| `filtrer(a, isalpha)` | Garder les lettres | `Salut R2-D2, code 42` | `SalutRDcode` |
| `filtrer(b, isdigit)` | Garder les chiffres | `Salut R2-D2, code 42` | `2242` |
| `filtrer(c, est_voyelle)` | Garder les voyelles | `Salut R2-D2, code 42` | `auoe` |

`filtrer` ne remplace pas les boucles précédentes, car son critère ne voit qu'**un caractère à la fois** :

| Ce qu'il faut savoir pour décider | Outil |
|---|---|
| Le caractère seul (lettre, chiffre, voyelle) | `filtrer` avec un critère |
| Le dernier caractère déjà écrit (espaces en trop) | Boucle dédiée avec `out[-1]` |
| Les caractères suivants (`\` puis saut de ligne) | Boucle dédiée avec `p[1]` |

## Quand ça tourne mal : trois essais

### Filtrer un littéral de chaîne

Un **littéral de chaîne** est un texte écrit entre guillemets dans le code ([documentation](https://en.cppreference.com/w/c/language/string_literal)). Le compilateur le range dans une zone de la mémoire que le programme ne peut que lire. Deux déclarations, qui se ressemblent, n'ont donc pas du tout la même valeur :

| Déclaration | Ce que c'est | Modifiable ? |
|---|---|---|
| `char s[] = "abc";` | Un tableau de 4 `char`, **copie** du texte | Oui |
| `char *s = "abc";` | Un pointeur vers le littéral en lecture seule | Non : écrire plante |
| `const char *s = "abc";` | Idem, mais le compilateur protège | Non : écrire est refusé à la **compilation** |

```c
#include <stdio.h>

int main(void)
{
    char *litteral = "abc";             // pointe vers un littéral, zone en lecture seule
    char  copie[] = "abc";              // tableau : copie modifiable du texte

    copie[0] = 'X';                     // autorisé : on écrit dans notre propre tableau
    printf("copie : %s\n", copie);
    fflush(stdout);                     // affiche la ligne avant un éventuel plantage
    litteral[0] = 'X';                  // interdit : écriture dans la zone en lecture seule
    printf("litteral : %s\n", litteral);   // jamais atteint
    return 0;
}
```

```text
copie : Xbc
AddressSanitizer:DEADLYSIGNAL
==28957==ERROR: AddressSanitizer: SEGV on unknown address 0x64b4603c5080 ...
==28957==The signal is caused by a WRITE memory access.
```

`fflush(stdout)` force l'affichage immédiat du texte en attente d'être écrit. Le premier accès marche, le second fait planter le programme : le système refuse l'écriture dans la zone protégée (une **erreur de segmentation**). Sans l'option `-fsanitize=address`, le résultat est le même sans le rapport : le [shell](/?c=langages&s=bash&p=architecture-dun-shell) signale l'erreur de segmentation et le programme se termine avec le statut 139 (128 plus 11, le numéro du signal de cette erreur). Le langage C dit seulement que l'écriture a un comportement indéfini ; le plantage est ce qu'on observe ici sous Linux. Avec `const char *`, le même `litteral[0] = 'X'` est refusé dès la compilation (`error: assignment of read-only location`) : voir [`const` avec les pointeurs](/?c=langages&s=c&p=pointeurs#const-avec-les-pointeurs). Pour filtrer un texte fixe, on le copie d'abord dans un tableau (`char s[] = "..."`).

### Un pointeur d'écriture qui dépasse le pointeur de lecture

Un filtre qui écrit **plus** de caractères qu'il n'en lit fait passer `out` devant `p`, et il écrase alors des caractères qu'il n'a pas encore lus. Ici, chaque lettre doit être écrite deux fois ; la boucle est limitée à 3 tours pour que l'essai se termine (sans cette limite, `p` ne rencontrerait jamais le `'\0'` écrasé) :

```c
#include <stdio.h>

int main(void)
{
    char  b[16] = "abc";                // 3 lettres, puis des zéros
    char *p;                            // pointeur de lecture
    char *out = b;                      // pointeur d'écriture

    for (p = b; p < b + 3; p++) {       // 3 tours : on lit les 3 lettres d'origine
        *out++ = *p;                    // écrit la lettre lue...
        *out++ = *p;                    // ...puis la réécrit : out dépasse p
    }
    printf("[%s]\n", b);                // attendu : [aabbcc]
    return 0;
}
```

```text
[aaaaaa]
```

Au tour 2, `p` lit la case 1, que le tour 1 a déjà remplacée par un `a` : les `b` et `c` d'origine ont disparu avant d'être lus. Pour agrandir un texte, il faut une destination **séparée**, assez grande (voir [allouer de la mémoire](/?c=langages&s=c&p=memoire#allouer-de-la-memoire-dynamiquement)), pas le même tableau.

### Lire `out[-1]` avant d'avoir écrit

Retirons la garde `out == s` de `compacter_espaces`, sur le texte `" a"` (un espace puis `a`). Au premier tour, le test `*p != ' '` est faux (c'est un espace) et le programme évalue `out[-1]`, la case avant le tableau. Compilé avec `-fsanitize=address`, le programme s'arrête sur :

```text
==29371==ERROR: AddressSanitizer: stack-buffer-underflow on address 0x74f8e130001f ...
READ of size 1 at 0x74f8e130001f thread T0
```

Sans sanitizer, la lecture hors du tableau passe inaperçue : la valeur lue est celle d'une variable voisine, et le résultat du filtre dépend du hasard. Voir [Sanitizers et tests d'allocation](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation).

## Les pièges

| Piège | Pourquoi | Parade |
|---|---|---|
| Filtrer un littéral (`char *s = "..."`) | Zone en lecture seule : plantage à l'écriture | `char s[] = "..."`, ou copier d'abord ; déclarer `const char *` pour qu'une erreur soit détectée à la compilation |
| Oublier `*out = '\0'` | L'ancienne fin du texte réapparaît (`a bb`) | Terminer après la boucle, toujours |
| Un filtre qui écrit plus qu'il ne lit | `out` dépasse `p` et écrase du texte non lu | Destination séparée de taille connue |
| Lire `out[-1]` sans garde | Lecture avant le début du tableau | Tester `out == s` avant, dans un `\|\|` |
| Lire `p[1]` ou `p[2]` sans vérifier la fin | Lecture après le `'\0'` | Ne lire `p[1]` que si `*p` n'est pas `'\0'`, et `p[2]` que si `p[1]` ne l'est pas non plus |
| Confondre `*p++` et `(*p)++` | L'un avance le pointeur, l'autre change la valeur pointée | Retenir que le `++` agit sur ce qui lui est collé |
| Écrire `*p++;` seul | Avertissement `value computed is not used` : la valeur lue est jetée | `(*p)++` pour augmenter la valeur |
| Modifier la variable de l'appelant sans le dire | L'appelant perd le texte d'origine | Le documenter au-dessus de la fonction ; copier le texte avant si on en a encore besoin |
| Passer un `char` négatif à `isalpha` | Comportement indéfini selon la norme | `(unsigned char)*p` avant l'appel |
| Filtrer un texte UTF-8 octet par octet | Un caractère accentué occupe plusieurs octets : en retirer un seul casse le caractère | Ne filtrer que du texte sans accents ; sinon un traitement conçu pour [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes#la-consequence-un-caractere-un-octet) |
| Passer `NULL` | Déréférencer `NULL` plante | Tester `s == NULL` en tête de fonction |
| Modifier et lire une variable dans la même expression (`*out++ = *out`) | Le langage n'impose pas l'ordre : comportement indéfini | Séparer en deux instructions |
| Rappeler `strlen` à chaque tour | Retombe dans un coût quadratique, voir [trois pièges de performance](/?c=langages&s=c&p=memoire#trois-pieges-de-performance-et-de-lecture-de-memoire) | Calculer la longueur avec `out - s` |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un pointeur de lecture `const char *p` et un pointeur d'écriture `char *out`, nommés ainsi | Le compilateur interdit d'écrire par le mauvais pointeur ; le code se lit d'un coup d'œil |
| Garder l'invariant `out <= p` en tête avant d'écrire un filtre | Un filtre qui ne fait que supprimer ou garder est sûr ; au-delà, changer de méthode |
| Écrire `*out = '\0'` juste après la boucle | La chaîne résultat est toujours terminée |
| Renvoyer `(size_t)(out - s)` | L'appelant a la nouvelle longueur sans reparcourir le texte |
| Documenter au-dessus de la fonction que `s` est modifiée | L'appelant sait qu'il perd le texte d'origine |
| Tester `s == NULL` et `garder == NULL` en tête de fonction | Pas de plantage sur une entrée absente |
| Écrire la boucle générique une fois (`filtrer`) pour les critères à un caractère | Une seule boucle à vérifier |
| Essayer chaque filtre avec une chaîne vide, un seul caractère, un texte entièrement supprimé, sous `-fsanitize=address,undefined` | Les bords (début, fin, `'\0'`) sont là où les filtres se trompent |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Filtrer sur place, c'est parcourir le texte avec un pointeur de lecture `p` et recopier ce qu'on garde avec un pointeur d'écriture `out`, vers le début du même tableau : un seul passage, aucune allocation, coût linéaire, contre un coût quadratique pour le décalage à chaque suppression. `out <= p` tant que le filtre n'écrit pas plus qu'il ne lit. `*out++ = *p` écrit puis avance `out` (le `++` postfixe passe avant le `*`). `*p++` lit puis avance le pointeur ; `(*p)++` augmente la valeur pointée ; `*++p` avance puis lit ; `++*p` augmente puis lit. Il faut poser `*out = '\0'` après la boucle. `out - s` est la nouvelle longueur, de type `ptrdiff_t`, comptée en cases et non en octets. Un filtre qui regarde en avant lit `p[1]`, sans dépasser le terminateur. |
| **Pièges à éviter** | Filtrer un littéral (`char *s = "..."`) ; oublier le `'\0'` final ; faire passer `out` devant `p` ; lire `out[-1]` au début ; lire `p[2]` sans avoir testé `p[1]` ; confondre `*p++` et `(*p)++` ; modifier le texte de l'appelant sans le documenter ; passer un `char` négatif à `isalpha` ; filtrer du UTF-8 octet par octet. |
| **Bonnes pratiques** | `const char *p` pour lire, `char *out` pour écrire ; `*out = '\0'` juste après la boucle ; renvoyer `(size_t)(out - s)` ; `filtrer(s, critère)` pour les critères à un caractère, une boucle dédiée sinon ; tests aux bords sous `-fsanitize=address,undefined` ; documentation : [`memmove`](https://en.cppreference.com/w/c/string/byte/memmove), [priorité des opérateurs](https://en.cppreference.com/w/c/language/operator_precedence), [`ptrdiff_t`](https://en.cppreference.com/w/c/types/ptrdiff_t), [`isalpha`](https://en.cppreference.com/w/c/string/byte/isalpha). |
