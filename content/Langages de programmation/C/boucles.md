---
order: 3
---

# Les boucles

Les boucles permettent de répéter un bloc de code plusieurs fois. En C, on dispose de trois structures : `while`, `do while` et `for` — il n'existe pas de `foreach` natif, un tableau se parcourt toujours via un index ou un pointeur.

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

Regroupe en une seule ligne l'initialisation, la condition, et l'incrémentation — pratique dès que le nombre d'itérations est connu à l'avance :

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

> **Note :** contrairement à PHP ou JavaScript, il n'existe **aucun moyen natif** de connaître la taille d'un tableau à partir du pointeur seul — `tableau[5]` "sait" combien il contient tant qu'il est manipulé comme tableau statique, mais cette information disparaît dès qu'il est passé à une fonction (il se comporte alors comme un simple pointeur, voir [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs)). La taille doit alors être transmise séparément.

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

`break` n'arrête que la boucle la **plus proche** qui l'englobe — pour sortir de plusieurs boucles imbriquées d'un coup, il faut une variable de contrôle ou un `goto` (rare mais parfois utilisé pour ce cas précis en C) :

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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `while` teste avant, `do while` teste après (au moins une exécution), `for` regroupe initialisation/condition/incrémentation. Pas de `foreach` natif : un tableau se parcourt par index. |
| **Outils utilisables** | `break` (arrête la boucle), `continue` (passe au tour suivant). |
| **Pièges à éviter** | `break` ne sort que de la boucle la plus proche — une variable de contrôle est nécessaire pour sortir de plusieurs boucles imbriquées. |
| **Bonnes pratiques** | Toujours transmettre explicitement la taille d'un tableau à une fonction qui le parcourt, plutôt que de supposer qu'elle peut être déduite. |
