---
order: 14
---

# Les fonctions variadiques (va_list)

Une fonction **variadique** accepte un nombre variable d'arguments : `printf("%d %s\n", 42, "texte")` en est l'exemple le plus connu : `printf` accepte 1, 2, ou 10 arguments selon le format fourni. En C, ce mécanisme est rendu possible par les macros de `<stdarg.h>`.

## Déclarer une fonction variadique

Une fonction variadique a toujours au moins un paramètre fixe, suivi de `...` :

```c
#include <stdarg.h>

int somme(int nombre, ...)
{
    va_list arguments;
    // "nombre" est le dernier paramètre fixe, juste avant les "..."
    va_start(arguments, nombre);

    int total = 0;
    for (int i = 0; i < nombre; i++) {
        // récupère l'argument suivant, en le traitant comme un int
        total += va_arg(arguments, int);
    }

    va_end(arguments);
    return total;
}

somme(3, 10, 20, 30); // 60 -> nombre = 3, les 3 arguments suivants sont additionnés
```

## Les macros de `<stdarg.h>`

| Macro | Rôle |
|---|---|
| `va_list` | Type représentant la liste des arguments variables |
| `va_start(liste, dernierParamFixe)` | Initialise la liste, à partir du dernier paramètre fixe connu |
| `va_arg(liste, type)` | Récupère l'argument suivant, en supposant qu'il est du `type` indiqué |
| `va_end(liste)` | Termine proprement l'utilisation de la liste |

> **Note :** rien ne permet au compilateur de vérifier que le `type` passé à `va_arg()` correspond réellement au type de l'argument fourni par l'appelant : c'est entièrement à la charge du développeur. Passer le mauvais type (ex. lire un `int` là où un `double` a été fourni) est un comportement indéfini, non détecté à la compilation.

## Comment `printf` connaît-il le nombre d'arguments ?

`printf` n'a **aucun moyen natif** de savoir combien d'arguments variables ont été fournis : c'est la chaîne de format elle-même qui sert de guide, en comptant le nombre de `%` qu'elle contient.

```c
// la chaîne annonce 3 valeurs -> printf lit 3 arguments variadiques
printf("%d %d %d\n", 1, 2, 3);
```

> **Note :** c'est pour ça qu'un mauvais nombre de `%` par rapport aux arguments réels (ou l'inverse) ne provoque **aucune erreur de compilation** : seulement un comportement indéfini à l'exécution (lecture de données qui ne sont pas de vrais arguments). C'est une source classique de failles de sécurité ("format string vulnerability") quand une chaîne de format vient directement d'une entrée utilisateur non contrôlée.

## Le mini-langage du format `printf`

Chaque `%` introduit une syntaxe précise à reparser caractère par caractère, bien plus riche qu'une simple lettre de conversion :

```text
%[drapeaux][largeur][.précision]conversion
```

```c
// "42        |" -> '-' : justifié à GAUCHE (par défaut : à droite)
printf("%-10d|\n", 42);
// "0000000042"  -> '0' : complète avec des zéros plutôt que des espaces
printf("%010d\n", 42);
// "0xff"        -> '#' : forme alternative (préfixe 0x/0X pour x/X)
printf("%#x\n", 255);
// "+42"         -> '+' : force l'affichage du signe, même positif
printf("%+d\n", 42);

// "        42" -> largeur MINIMALE : complète avec des espaces si besoin
printf("%10d\n", 42);
// "005"        -> précision sur un entier : nombre minimal de chiffres
printf("%.3d\n", 5);

// équivalent à "%10d" -> '*' : la largeur est lue depuis les arguments,
// pas écrite en dur
printf("%*d\n", 10, 42);
```

| Élément | Rôle |
|---|---|
| Drapeaux (`-`, `0`, `#`, `+`, espace) | Modifient l'alignement, le remplissage ou la présentation, combinables entre eux |
| Largeur (nombre ou `*`) | Nombre minimal de caractères affichés (complété par des espaces ou des zéros) |
| Précision (`.` suivi d'un nombre) | Nombre minimal de chiffres pour un entier, longueur maximale pour une chaîne (`%s`) |
| Conversion (`d`/`i`/`u`/`x`/`X`/`s`/`c`/`p`/`%`) | Le type de valeur à afficher |

> **Note :** ce mini-langage explique pourquoi réimplémenter `printf` (comme dans le projet `ft_printf`) demande un vrai petit analyseur : après chaque `%` rencontré, il faut reconnaître dans l'ordre les drapeaux présents, une éventuelle largeur, une éventuelle précision, puis la lettre de conversion qui clôt la séquence -- chacun de ces éléments est optionnel sauf la conversion finale.

## Une limite : le nombre d'arguments doit être communiqué autrement

Contrairement à `printf` (guidé par la chaîne de format), l'exemple `somme()` ci-dessus doit recevoir explicitement le nombre d'arguments en premier paramètre (`nombre`) : `va_list` ne permet pas de savoir "combien d'arguments restent" tout seul, il faut toujours un moyen externe de le communiquer (un compteur, une valeur sentinelle comme `NULL` en dernier argument, ou une chaîne de format).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une fonction variadique (`...`) accepte un nombre variable d'arguments, lus via les macros de `<stdarg.h>` (`va_list`, `va_start`, `va_arg`, `va_end`). Le nombre d'arguments doit toujours être communiqué par un moyen externe. |
| **Outils utilisables** | `va_list`, `va_start`, `va_arg`, `va_end` ; syntaxe `%[drapeaux][largeur][.précision]conversion` du format `printf`. |
| **Pièges à éviter** | Passer à `va_arg()` un type différent de celui réellement fourni par l'appelant : comportement indéfini, non détecté à la compilation. |
| **Bonnes pratiques** | Ne jamais construire une chaîne de format à partir d'une entrée utilisateur non contrôlée : source classique de faille ("format string vulnerability"). |
