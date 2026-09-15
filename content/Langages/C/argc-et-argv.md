---
order: 6
---

# Les arguments de la ligne de commande (`argc`, `argv`)

`main` peut recevoir deux paramètres optionnels qui donnent accès aux arguments passés au programme au moment de son lancement depuis le terminal, en plus de la forme `int main(void)` déjà vue.

## La signature complète de `main`

```c
int main(int argc, char *argv[])
{
    // ...
}
```

- `argc` (*argument count*) : le nombre d'arguments reçus, toujours au moins `1`.
- `argv` (*argument vector*) : un tableau de chaînes de caractères, un élément par argument.

## Afficher tous les arguments reçus

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}
```

Exécuté via `./programme salut 42`, ce programme affiche :

```text
argv[0] = ./programme
argv[1] = salut
argv[2] = 42
```

`argc` vaut alors `3` : le nom du programme compte comme un argument à part entière.

## `argv[0]` : le nom du programme, pas le premier argument utile

`argv[0]` contient toujours le chemin utilisé pour lancer le programme (pas forcément juste son nom), jamais le premier argument fourni par l'utilisateur : celui-là est `argv[1]`.

## La sentinelle `argv[argc]`

Le standard C garantit que `argv[argc]` vaut toujours `NULL` : ça permet de parcourir `argv` sans connaître `argc` à l'avance (`while (argv[i] != NULL)`), mais rien ne garantit ce qui se trouve **au-delà** de `argv[argc]`.

> **Piège :** lire `argv[i]` sans avoir vérifié au préalable que `i < argc`. Un utilisateur qui lance le programme sans lui fournir l'argument attendu provoque alors un accès en dehors du tableau : un des bugs les plus fréquents chez qui débute avec `argc`/`argv`.

```c
if (argc < 2) {
    fprintf(stderr, "Usage : %s <argument>\n", argv[0]);
    return 1;
}
printf("Argument reçu : %s\n", argv[1]);   // atteint seulement si argc >= 2
```

## Convertir un argument en nombre

Un argument arrive toujours comme une chaîne de caractères, même s'il ressemble à un nombre en ligne de commande : `atoi()`/`strtol()` (voir [Convertir une chaîne en nombre](/?c=langages-de-programmation&s=c&p=variables#convertir-une-chaine-en-nombre-atof-atoi), déjà couvert dans *Les variables*) le convertissent explicitement en entier.

```c
int limite = atoi(argv[1]);   // "42" (chaine) -> 42 (int)
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `int main(int argc, char *argv[])` donne accès aux arguments de la ligne de commande : `argc` leur nombre (toujours ≥ 1), `argv` le tableau de chaînes correspondant. `argv[0]` est le nom du programme, pas le premier argument utile. |
| **Outils utilisables** | `argc`, `argv[i]`, la sentinelle `argv[argc] == NULL`, `atoi()`/`strtol()` pour convertir un argument en nombre. |
| **Pièges à éviter** | Lire `argv[i]` sans vérifier `i < argc` au préalable : accès en dehors du tableau si l'utilisateur ne fournit pas l'argument attendu. Confondre `argv[0]` (nom du programme) avec le premier argument réel (`argv[1]`). |
| **Bonnes pratiques** | Toujours vérifier `argc` avant d'accéder à un `argv[i]` donné, et afficher un message d'usage clair (via `argv[0]`) quand `argc` ne correspond pas à ce qui est attendu. |
