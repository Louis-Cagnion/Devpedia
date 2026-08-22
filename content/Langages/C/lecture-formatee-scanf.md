---
order: 21
---

# La lecture formatée : `scanf` et `sscanf`

Le chapitre sur les [fonctions variadiques](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) couvre `printf` : convertir des valeurs typées en une chaîne de caractères formatée. `scanf` (et sa variante `sscanf`) fait l'opération **inverse** : extraire des valeurs typées à partir d'une chaîne, en suivant un format donné.

## `sscanf` : extraire des valeurs d'une chaîne

```c
#include <stdio.h>

int jour, mois, annee;
int trouves = sscanf("25/12/2026", "%d/%d/%d", &jour, &mois, &annee);

// trouves vaut 3 : jour=25, mois=12, annee=2026
```

`sscanf` lit la chaîne source en la comparant au format donné : chaque `%d`/`%s`/`%f`... consomme la partie correspondante de la chaîne et écrit la valeur convertie à l'adresse fournie (d'où le `&` devant chaque variable, comme pour tout pointeur de sortie en C). Les caractères du format qui ne sont **pas** un spécificateur (le `/` ici) doivent apparaître **tels quels** dans la chaîne source pour que le parsing continue.

| Spécificateur | Type attendu | Exemple de chaîne source |
|---|---|---|
| `%d` | `int` | `"42"` |
| `%f` | `float` | `"3.14"` |
| `%c` | `char` (un seul caractère) | `"a"` |
| `%s` | Chaîne de caractères (`char*`), s'arrête au premier espace | `"bonjour"` |

## La valeur de retour : le nombre de champs réellement lus

`sscanf` renvoie le **nombre de conversions réussies**, pas un simple succès/échec binaire : une information indispensable, parce que le parsing peut s'arrêter en plein milieu du format sans provoquer d'erreur visible :

```c
int jour, mois, annee;
int trouves = sscanf("25-12", "%d/%d/%d", &jour, &mois, &annee);

// trouves vaut 0 : le premier "/" attendu ne correspond pas au "-" reel,
// le parsing s'arrete avant meme de lire "jour" -> jour reste NON INITIALISE
```

> **Piège :** ignorer la valeur de retour de `sscanf` et utiliser directement les variables censées être remplies. Si le format ne correspond pas entièrement à la chaîne source, certaines variables ne sont **jamais écrites** : les lire ensuite lit une valeur non initialisée, un comportement indéfini qui peut fonctionner "par chance" en test et échouer silencieusement ailleurs.
>
> **Bonne pratique :** toujours comparer la valeur de retour de `sscanf` au nombre de champs attendus avant d'utiliser les variables remplies, exactement comme on vérifierait le code de retour de tout appel système (voir [Les appels système](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)).

## `%s` sans limite : un risque de dépassement de tampon

Contrairement à `%d`/`%f` qui écrivent toujours une taille fixe, `%s` recopie une chaîne de **longueur variable** dans le tampon fourni, sans jamais vérifier sa taille :

```c
char nom[16];
sscanf(entree_utilisateur, "%s", nom);   // si entree_utilisateur fait plus de 15 caracteres : depassement de tampon
```

> **Piège :** la même classe de vulnérabilité que celle déjà rencontrée avec les chaînes de format de `printf` (voir le chapitre sur les [fonctions variadiques](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)) : une entrée non contrôlée qui dépasse la taille du tampon écrit en dehors de la mémoire qui lui est allouée.
>
> **Bonne pratique :** toujours borner `%s` avec une largeur maximale explicite, `%15s` pour un tampon de 16 octets (15 caractères + le `\0` final), jamais un `%s` nu sur une entrée dont la taille n'est pas garantie.

## Réimplémenter `sscanf` : un exercice classique

Écrire sa propre version simplifiée de `sscanf` (souvent nommée `ft_sscanf` dans les exercices qui le demandent) est un exercice courant pour comprendre ce mécanisme de l'intérieur : la fonction doit elle-même être [variadique](/?c=langages-de-programmation&s=c&p=fonctions-variadiques) (elle reçoit un nombre variable de pointeurs de sortie, guidée comme `printf` par les `%` de la chaîne de format), et parcourir simultanément la chaîne source et la chaîne de format caractère par caractère, en avançant dans l'une seulement quand un spécificateur du format y correspond.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `sscanf` extrait des valeurs typées d'une chaîne selon un format, l'opération inverse de `printf`. Sa valeur de retour indique le nombre de champs réellement lus, pas un simple succès/échec. |
| **Outils utilisables** | `sscanf(source, format, ...)`, une largeur maximale explicite (`%15s`) pour borner une lecture de chaîne. |
| **Pièges à éviter** | Utiliser une variable sans vérifier que `sscanf` l'a réellement remplie. Lire une chaîne avec `%s` sans limite de taille sur une entrée non contrôlée. |
| **Bonnes pratiques** | Toujours comparer la valeur de retour de `sscanf` au nombre de champs attendus. Toujours borner `%s` avec une largeur maximale explicite. |
