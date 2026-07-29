---
order: 2
---

# Les conditions

Les conditions permettent d'exécuter un bloc de code selon qu'une expression est vraie ou fausse. En C, on utilise `if`/`else`/`else if`, l'opérateur ternaire, et `switch`.

## La condition `if`

En C, toute valeur **non nulle** est considérée comme vraie ; seule la valeur `0` est fausse — il n'existe pas de type booléen natif avant C99 (`stdbool.h`, cf. chapitre sur les variables) :

```
int age = 18;

if (age >= 18) {
    printf("Vous êtes majeur.\n");
}
```

## `if` / `else` / `else if`

```
int note = 12;

if (note >= 16) {
    printf("Mention Très Bien\n");
} else if (note >= 14) {
    printf("Mention Bien\n");
} else if (note >= 10) {
    printf("Admis\n");
} else {
    printf("Recalé\n");
}
```

> **Note :** contrairement à PHP, il n'existe pas de syntaxe alternative avec `:`/`endif` en C — les accolades `{ }` sont la seule écriture disponible (facultatives seulement si le bloc ne contient qu'une seule instruction, mais fortement déconseillé de les omettre : source classique de bugs si une ligne est ajoutée par erreur sans les accolades).

## L'opérateur ternaire

```
int age = 20;
const char *statut = (age >= 18) ? "majeur" : "mineur";

printf("%s\n", statut);
```

## Le `switch`

Utile pour comparer une même variable à plusieurs valeurs entières ou énumérées :

```
int jour = 3;

switch (jour) {
    case 1:
        printf("Lundi\n");
        break;
    case 2:
        printf("Mardi\n");
        break;
    case 3:
        printf("Mercredi\n");
        break;
    default:
        printf("Autre jour\n");
        break;
}
```

> **Note :** n'oubliez pas le `break;` à la fin de chaque `case` — sinon l'exécution continue dans le `case` suivant (*fall-through*), même si sa condition ne correspond pas. Ce comportement est parfois exploité volontairement pour regrouper plusieurs cas identiques :

```
switch (jour) {
    case 6:
    case 7:
        printf("Week-end\n"); // pas de break entre 6 et 7 : les deux cas partagent ce code
        break;
    default:
        printf("Jour de semaine\n");
        break;
}
```

> **Limite du `switch` en C :** contrairement à certains langages, un `switch` en C ne fonctionne que sur des types entiers (ou assimilés : `char`, `enum`) — impossible de faire un `switch` sur une chaîne de caractères directement.
