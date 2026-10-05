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

## `atexit()` : tout libérer sur chaque chemin de sortie

Un programme qui appelle `exit()` au fond d'une chaîne de fonctions saute le `free()` que `main` aurait fait à la fin : la mémoire n'est pas rendue proprement, et un outil de détection de fuites (voir [Mémoire](/?c=langages-de-programmation&s=c&p=memoire)) le signale. `atexit(fonction)` règle ce problème : elle **enregistre** une fonction que le programme appellera tout seul quand il se termine, quel que soit l'endroit d'où part la sortie.

```c
#include <stdlib.h>

static char *g_buffer;   // global : la fonction enregistrée ne reçoit aucun argument

static void cleanup(void)
{
    free(g_buffer);
}

int main(void)
{
    g_buffer = malloc(100);
    atexit(cleanup);     // cleanup sera appelée à la fin, par return ou par exit()
    // ...
    return 0;
}
```

Résultat mesuré avec deux fonctions enregistrées (`cleanup` d'abord, puis `log_end`), selon la façon de terminer :

| Façon de terminer | Fonctions enregistrées appelées ? | Code de retour |
|---|---|---|
| `return 0;` dans `main` | Oui, dans l'ordre inverse : `log_end` puis `cleanup` | `0` |
| `exit(EXIT_FAILURE);` appelé au fond de plusieurs fonctions | Oui, même ordre inverse | `1` |
| `_exit(EXIT_FAILURE);` (`<unistd.h>`) | **Non**, rien n'est appelé | `1` |

- **Ordre inverse** : la dernière fonction enregistrée s'exécute la première, comme une pile ; une ressource enregistrée en dernier (qui dépend des précédentes) est donc libérée avant elles.
- **Limite** : la norme garantit au moins 32 fonctions enregistrables ; `atexit()` renvoie une valeur non nulle si l'enregistrement échoue.

> **Piège :** `_exit()`, `abort()` et un signal mortel (voir [Signaux Unix](/?c=langages-de-programmation&s=c&p=signaux-unix)) terminent le programme sans appeler les fonctions enregistrées. Dans un processus créé par `fork()`, l'enfant qui doit s'arrêter après une erreur utilise `_exit()` pour ne pas rejouer les nettoyages du parent (tampons d'écriture vidés deux fois, fichiers temporaires supprimés trop tôt).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `return valeur;` dans `main` termine le programme et fixe son code de retour. `exit(code)` fait la même chose depuis n'importe quelle fonction. Par convention, `0` signale un succès, toute autre valeur un échec. `atexit(fonction)` enregistre un nettoyage appelé à la sortie, dans l'ordre inverse de l'enregistrement. |
| **Outils utilisables** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`), `atexit()`. |
| **Pièges à éviter** | Renvoyer `0` par défaut sans vérifier qu'aucune erreur n'a eu lieu : un script qui teste `$?` croira alors à un succès qui n'a pas eu lieu. Compter sur `atexit()` après `_exit()`, `abort()` ou un signal mortel : rien n'est appelé. |
| **Bonnes pratiques** | Utiliser `EXIT_SUCCESS`/`EXIT_FAILURE` plutôt que `0`/`1` bruts pour rendre l'intention explicite ; toujours renvoyer un code non nul dès qu'une erreur empêche le programme de faire ce qu'on attendait de lui ; enregistrer le nettoyage par `atexit()` plutôt que de répéter les `free()` avant chaque `exit()`. |
