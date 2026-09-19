---
order: 5
---

# `exit()` et les codes de retour

Un programme C se termine toujours avec un **code de retour** : un entier qui indique au processus appelant (souvent le shell) si le programme s'est bien déroulé. Ce code est déjà entrevu dans [La gestion des processus](/?c=langages-de-programmation&s=c&p=processus) : `WEXITSTATUS(statut)` l'extrait après un `wait()`.

## `return` dans `main` : le cas le plus courant

```c
int main(void)
{
    // ... traitement ...
    return 0;   // le programme se termine ici, code de retour 0
}
```

Dans `main` (et uniquement dans `main`), `return valeur;` termine le programme entier et fixe son code de retour à `valeur` : ce n'est pas un simple retour de fonction comme ailleurs dans le code.

## `exit(code)` : terminer depuis n'importe où

```c
#include <stdlib.h>

void verifier_configuration(Config *config)
{
    if (config == NULL) {
        fprintf(stderr, "Erreur : configuration manquante\n");
        exit(1);   // termine le programme immédiatement, même si on n'est pas dans main
    }
}
```

`exit(code)` termine le programme **immédiatement**, quelle que soit la fonction où il est appelé : pas besoin de faire remonter une erreur via une chaîne de `return` jusqu'à `main` pour arrêter le programme.

| | `return` dans `main` | `exit(code)` |
|---|---|---|
| Où l'appeler | Uniquement dans `main` | N'importe quelle fonction |
| Effet | Termine `main`, donc le programme | Termine le programme directement |
| Code de retour | La valeur retournée | `code` |

## La convention 0 = succès, non-zéro = erreur

```c
#include <stdlib.h>

exit(EXIT_SUCCESS);   // équivalent à exit(0)
exit(EXIT_FAILURE);   // équivalent à exit(1)
```

`EXIT_SUCCESS` et `EXIT_FAILURE` (définies dans `<stdlib.h>`) valent respectivement `0` et `1` : les utiliser plutôt que les chiffres bruts rend l'intention explicite à la lecture, sans changer le comportement.

Ce code de retour est ensuite consultable depuis le shell qui a lancé le programme via [`$?`](/?c=shells&s=bash&p=scripts-et-shebang#codes-de-sortie-exit) : `0` signale un succès, toute autre valeur signale un type d'échec différent (la signification précise des valeurs non nulles reste propre à chaque programme).

> **Piège :** oublier de renvoyer un code non nul en cas d'erreur (`return 0;` ou l'absence de `return` explicite, qui vaut `0` par convention si `main` atteint sa fin normalement). Un script qui enchaîne des commandes avec `&&` ou teste `$?` croira alors que le programme a réussi, même s'il a en réalité échoué.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `return valeur;` dans `main` termine le programme et fixe son code de retour. `exit(code)` fait la même chose depuis n'importe quelle fonction. Par convention, `0` signale un succès, toute autre valeur un échec. |
| **Outils utilisables** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`). |
| **Pièges à éviter** | Renvoyer `0` par défaut sans vérifier qu'aucune erreur n'a eu lieu : un script qui teste `$?` croira alors à un succès qui n'a pas eu lieu. |
| **Bonnes pratiques** | Utiliser `EXIT_SUCCESS`/`EXIT_FAILURE` plutôt que `0`/`1` bruts pour rendre l'intention explicite ; toujours renvoyer un code non nul dès qu'une erreur empêche le programme de faire ce qu'on attendait de lui. |
