---
order: 28
---

# Convertir un texte en nombre sans le piège de `atoi`

Un nombre qui vient de l'extérieur (argument de [la ligne de commande](/?c=langages-de-programmation&s=c&p=argc-et-argv), fichier, saisie) arrive toujours sous forme de **texte** : il faut le convertir. `atoi()` et `atof()`, présentées dans [Convertir une chaîne en nombre](/?c=langages-de-programmation&s=c&p=variables#convertir-une-chaine-en-nombre-atof-atoi), le font mais ne détectent aucune erreur. Ce chapitre montre comment valider la conversion avec `strtol()` et `strtod()`.

## Ce que `atoi()` laisse passer

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    printf("%d\n", atoi("abc"));          // 0 : texte invalide, aucun signal
    printf("%d\n", atoi("12abc"));        // 12 : le texte en trop est ignoré
    printf("%d\n", atoi("4294967297"));   // 1 : trop grand pour un int, aucun signal
    return 0;
}
```

| Entrée | `atoi()` renvoie | Ce qui devrait se passer |
|---|---|---|
| `"abc"` | `0` | Refus : ce n'est pas un nombre. |
| `"12abc"` | `12` | Refus : du texte suit le nombre. |
| `"4294967297"` | `1` | Refus : la valeur déborde (2^32 + 1 revient à `1` sur 32 bits). |
| `"0"` | `0` | Accepté. Impossible de le distinguer de `"abc"`. |

## `strtol()` : renvoyer le nombre **et** l'endroit où la lecture s'est arrêtée

```c
long strtol(const char *texte, char **reste, int base);
double strtod(const char *texte, char **reste);
```

| Paramètre ou retour | Contenu |
|---|---|
| `texte` | Le texte à convertir. |
| `reste` | Adresse d'un pointeur que la fonction remplit : il désigne le **premier caractère non lu**. |
| `base` | `10` pour du décimal, `16` pour de l'hexadécimal, `0` pour détecter `0x…` et `0…`. |
| Retour | La valeur lue (`0` si rien n'a pu l'être). |

```
texte  ->  "12abc"
            ^ ^
            | reste (premier caractère non lu : 'a')
            texte
```

Le pointeur `reste` permet trois constats que `atoi()` ne donne jamais :

| Constat | Test |
|---|---|
| Aucun chiffre lu | `reste == texte` |
| Du texte en trop après le nombre | `*reste != '\0'` |
| Texte vide | `*texte == '\0'` (couvert par le premier test) |

## Les débordements : `errno` et `ERANGE`

Quand la valeur ne tient pas dans un `long`, `strtol()` renvoie `LONG_MAX` ou `LONG_MIN` et positionne [`errno`](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#signaler-une-erreur-errno) à `ERANGE`. Comme `errno` n'est jamais remis à zéro par les fonctions réussies, on le **remet soi-même à zéro avant l'appel**, sinon une ancienne erreur serait prise pour la nouvelle.

## Une fonction de conversion complète

```c
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* Convertit texte en entier dans [min, max]. Renvoie 0 si valide, -1 sinon. */
int parse_long(const char *texte, long min, long max, long *resultat)
{
    char *reste;
    long valeur;

    errno = 0;                                     // remise à zéro avant l'appel
    valeur = strtol(texte, &reste, 10);
    if (reste == texte)                            // aucun chiffre lu (texte vide compris)
        return (fprintf(stderr, "\"%s\" : aucun chiffre\n", texte), -1);
    if (*reste != '\0')                            // du texte reste après le nombre
        return (fprintf(stderr, "\"%s\" : texte en trop \"%s\"\n", texte, reste), -1);
    if (errno == ERANGE)                           // ne tient pas dans un long
        return (fprintf(stderr, "\"%s\" : hors de la plage d'un long\n", texte), -1);
    if (valeur < min || valeur > max)              // hors du domaine du programme
        return (fprintf(stderr, "\"%s\" : hors de [%ld, %ld]\n", texte, min, max), -1);
    *resultat = valeur;
    return (0);
}
```

Chaque cause d'échec a **son propre message** qui nomme le texte fautif : l'utilisateur sait quoi corriger.

Résultat sur quelques entrées, pour une plage de 0 à 100 :

| Entrée | Résultat |
|---|---|
| `"42"` | `42` |
| `"abc"` | `aucun chiffre` |
| `"12abc"` | `texte en trop "abc"` |
| `"4294967297"` | `hors de [0, 100]` (tient dans un `long` 64 bits, mais pas dans le domaine) |
| `"99999999999999999999"` | `hors de la plage d'un long` |
| `""` | `aucun chiffre` |
| `"-3"` | `hors de [0, 100]` |

## Les nombres décimaux : `strtod()`, `NaN` et `inf`

`strtod()` suit le même schéma, avec deux pièges de plus.

```c
/* Convertit texte en double fini dans [min, max]. Renvoie 0 si valide, -1 sinon. */
int parse_double(const char *texte, double min, double max, double *resultat)
{
    char *reste;
    double valeur;

    errno = 0;
    valeur = strtod(texte, &reste);
    if (reste == texte)
        return (fprintf(stderr, "\"%s\" : aucun nombre\n", texte), -1);
    if (*reste != '\0')
        return (fprintf(stderr, "\"%s\" : texte en trop \"%s\"\n", texte, reste), -1);
    if (errno == ERANGE || !isfinite(valeur))      // 1e999 -> inf ; "nan" et "inf" sont acceptés
        return (fprintf(stderr, "\"%s\" : valeur non finie ou hors plage\n", texte), -1);
    if (valeur < min || valeur > max)
        return (fprintf(stderr, "\"%s\" : hors de [%g, %g]\n", texte, min, max), -1);
    *resultat = valeur;
    return (0);
}
```

| Piège | Explication |
|---|---|
| `"nan"` et `"inf"` | `strtod()` les accepte comme des nombres valides. Un `NaN` passe ensuite **toutes les comparaisons sans erreur** (`NaN < 0` et `NaN > 1` sont faux), donc le test de plage ne le voit pas : `isfinite()` (`<math.h>`) est indispensable. |
| `"1e999"` | Déborde vers `inf` : `errno` vaut `ERANGE`. |
| `"0,5"` | Avec la locale par défaut du programme (`"C"`), la virgule n'est pas une décimale : `strtod()` lit `0` et `reste` désigne `",5"`, ce que le test `*reste != '\0'` attrape. |
| Valeur pour un `float` | Une valeur finie en `double` peut dépasser un `float` (`1e39`) : borner à la plage réelle du type de destination. |

## Borner chaque valeur à son domaine

Le type ne dit pas ce que le programme accepte. Une transparence va de `0` à `1`, un nombre de threads de `1` à quelques dizaines, une taille de tableau ne peut pas être négative : la plage `[min, max]` passée à la fonction le vérifie à l'endroit même de la conversion, avec un message dédié, plutôt que de laisser une valeur absurde se propager dans le programme.

Autres comportements à connaître :

| Comportement | Conséquence |
|---|---|
| `strtol()` saute les espaces **au début** (`"  7"` donne `7`) | Accepté. Pour le refuser, tester `isspace(*texte)` avant l'appel. |
| `strtol()` accepte un signe `+` ou `-` | `"-3"` est valide : seule la plage le refuse. |
| Base `0` | `"010"` vaut `8` (octal) et `"0x1F"` vaut `31` : à éviter pour une saisie utilisateur. |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `atoi()`/`atof()` renvoient `0` sur du texte invalide, ignorent le texte en trop et débordent sans prévenir. `strtol()`/`strtod()` rendent un pointeur `reste` sur le premier caractère non lu, et positionnent `errno` à `ERANGE` en cas de débordement. |
| **Outils utilisables** | `strtol()`, `strtod()` (`<stdlib.h>`), `errno` et `ERANGE` (`<errno.h>`), `isfinite()` (`<math.h>`). |
| **Pièges à éviter** | Oublier `errno = 0` avant l'appel. Ne pas tester `reste == texte` (texte vide ou sans chiffre) ni `*reste != '\0'` (texte en trop). Accepter `NaN` et `inf` : ils passent tous les tests de plage. Convertir avec `atoi()` une donnée venue de l'extérieur. |
| **Bonnes pratiques** | Isoler la conversion dans une fonction unique qui renvoie un statut et prend la plage du domaine en paramètres. Un message d'erreur par cause, qui nomme le texte fautif. Refuser la valeur plutôt que la corriger en silence. |
