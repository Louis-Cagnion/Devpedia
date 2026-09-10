---
order: 3
---

# Les boucles

Les boucles permettent de répéter un bloc de code plusieurs fois. En C, on dispose de trois structures : `while`, `do while` et `for` : il n'existe pas de `foreach` natif, un tableau se parcourt toujours via un index ou un pointeur.

## La boucle `while`

La condition est testée **avant** chaque tour :

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## La boucle `do while`

Variante où la condition est testée **après** chaque tour : le bloc s'exécute donc toujours au moins une fois, même si la condition est fausse dès le départ :

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## La boucle `for`

Regroupe en une seule ligne l'initialisation, la condition, et l'incrémentation, pratique dès que le nombre d'itérations est connu à l'avance :

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

Les trois parties sont indépendantes et facultatives (`for (;;)` est une boucle infinie valide), mais l'usage classique reste `for (init; condition; incrément)`.

## Parcourir un tableau (pas de `foreach`)

```c
int tableau[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", tableau[i]);
}
```

> **Note :** contrairement à [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), il n'existe **aucun moyen natif** de connaître la taille d'un tableau à partir du pointeur seul : `tableau[5]` "sait" combien il contient tant qu'il est manipulé comme tableau statique, mais cette information disparaît dès qu'il est passé à une fonction (il se comporte alors comme un simple pointeur, voir [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs)). La taille doit alors être transmise séparément.

```c
void afficher(int *tableau, int taille) // la taille doit être passée explicitement
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", tableau[i]);
    }
}
```

## `break` et `continue`

- `break;` arrête complètement la boucle englobante.
- `continue;` passe directement au tour suivant, sans exécuter le reste du corps de la boucle courante.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // arrête la boucle dès que i vaut 5
    }
    if (i % 2 == 0) {
        continue; // ignore les nombres pairs
    }
    printf("%d\n", i);
}
```

## Boucles imbriquées et `break`

`break` n'arrête que la boucle la **plus proche** qui l'englobe : pour sortir de plusieurs boucles imbriquées d'un coup, il faut une variable de contrôle ou un `goto` (rare mais parfois utilisé pour ce cas précis en C) :

```c
int trouve = 0;

for (int i = 0; i < 10 && !trouve; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            trouve = 1;
            break; // ne sort que de la boucle interne
        }
    }
}
```

## Évaluation en court-circuit de `&&`/`||`

`&&` et `||` n'évaluent leur second opérande que si nécessaire (**évaluation en court-circuit**), exactement comme en [Python](/?c=langages-de-programmation&s=python&p=conditions) : `a && b` n'évalue `b` que si `a` est vrai (non nul) ; `a || b` n'évalue `b` que si `a` est faux (`0`).

Usage classique : éviter un déréférencement de pointeur invalide.

```c
if (ptr != NULL && ptr->valeur > 0) {
    ...
}
```

Si `ptr` vaut `NULL`, `ptr->valeur` n'est jamais évalué : `&&` s'arrête dès le premier opérande faux.

> **Différence avec Python :** en C, `&&`/`||` renvoient toujours `0` ou `1` (un `int`), jamais l'un de leurs deux opérandes. `age > 0 && age` ne renvoie donc pas `age` comme le ferait l'équivalent Python -- seule la propriété de court-circuit (ne pas évaluer le second opérande si inutile) est exploitable en C, jamais la valeur de retour comme "valeur de repli".

### Combiner aiguillage conditionnel et détection d'échec

Un usage plus poussé : enchaîner plusieurs `&&`/`||` pour tester un cas ET appeler la fonction correspondante, en une seule expression, à condition que chaque fonction appelée renvoie `1` en cas de succès et `0` en cas d'échec :

```c
!strcmp(type, "v")  && add_vector(mesh, values)
|| !strcmp(type, "vt") && add_texcoord(mesh, values)
|| !strcmp(type, "f")  && add_face(mesh, values);
```

Se lit comme une chaîne `if`/`else if` : `&&` a une priorité plus forte que `||`, donc chaque ligne forme une paire `(test && appel)` indépendante. Dès qu'une paire est vraie (le test correspond ET l'appel réussit), `||` s'arrête là ; sinon il continue vers la paire suivante.

> **Piège :** ce style suppose que chaque fonction appelée respecte la convention "`1` = succès, `0` = échec". Une fonction qui suit la convention inverse (`0` = succès, courante pour les appels système comme `close()`) casse silencieusement la chaîne : un succès réel évalué à `0` y est interprété comme un échec, et `||` continue à tort vers la branche suivante.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `while` teste avant, `do while` teste après (au moins une exécution), `for` regroupe initialisation/condition/incrémentation. Pas de `foreach` natif : un tableau se parcourt par index. `&&`/`||` court-circuitent leur second opérande, mais renvoient toujours `0`/`1`, jamais un opérande comme en Python. |
| **Outils utilisables** | `break` (arrête la boucle), `continue` (passe au tour suivant). Chaîner `&&`/`||` pour combiner un test et un appel conditionnel en une expression. |
| **Pièges à éviter** | `break` ne sort que de la boucle la plus proche : une variable de contrôle est nécessaire pour sortir de plusieurs boucles imbriquées. Une chaîne `&&`/`||` suppose que chaque fonction appelée renvoie `1` en cas de succès ; une fonction qui renvoie `0` en cas de succès (convention inverse) la casse silencieusement. |
| **Bonnes pratiques** | Toujours transmettre explicitement la taille d'un tableau à une fonction qui le parcourt, plutôt que de supposer qu'elle peut être déduite. Réserver le chaînage `&&`/`||` à des fonctions qui suivent la convention "1 = succès", garder un `if` explicite sinon. |
