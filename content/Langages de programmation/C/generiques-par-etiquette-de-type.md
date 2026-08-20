---
order: 5
---

# Les génériques en C : dispatch par étiquette de type

Le C n'a pas de mécanisme de généricité natif comme les [templates](/?c=langages-de-programmation&s=cpp&p=templates) en C++ : pas de compilateur qui génère une version spécialisée d'une fonction pour chaque type utilisé. Écrire une fonction qui accepte "n'importe quel type" y demande donc une technique manuelle, construite directement sur les [pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs) : le pointeur générique `void*`, accompagné d'une **étiquette de type** qui dit, à l'exécution, ce qu'il pointe réellement.

## Le problème : `void*` ne sait pas ce qu'il pointe

Un `void*` peut stocker l'adresse de n'importe quelle donnée, mais il perd toute information sur le **type** de cette donnée : impossible de le déréférencer directement, impossible de faire de l'arithmétique de pointeur dessus (le compilateur ne connaît pas `sizeof(type)`).

```c
void afficher(void *donnee) {
    printf("%d\n", *(int *)donnee);  // suppose que donnee pointe un int : dangereux
}
```

Cette fonction fonctionne tant qu'on ne l'appelle qu'avec un `int*`, mais rien ne l'empêche d'être appelée avec un `float*` ou une chaîne : le cast `(int *)` mentirait silencieusement au compilateur, sans erreur ni avertissement, jusqu'au comportement indéfini à l'exécution.

## La technique : accompagner le `void*` d'une étiquette de type

La solution consiste à ne jamais faire circuler un `void*` seul, mais toujours accompagné d'une donnée qui identifie son type réel, le plus souvent une chaîne ou une valeur d'énumération :

```c
typedef struct {
    void *donnee;
    char *type;   // "int", "float", "string"...
} Valeur;

void afficher(Valeur v) {
    if (strcmp(v.type, "int") == 0) {
        printf("%d\n", *(int *)v.donnee);
    } else if (strcmp(v.type, "float") == 0) {
        printf("%f\n", *(float *)v.donnee);
    } else if (strcmp(v.type, "string") == 0) {
        printf("%s\n", (char *)v.donnee);
    }
}
```

Le cast n'est plus une supposition : il est **conditionné** par l'étiquette, vérifiée avant d'être utilisée. La fonction sait, à l'exécution, ce qu'elle a réellement en main.

> **Piège :** comparer les étiquettes avec `==` plutôt que `strcmp()` si elles sont des chaînes de caractères. `v.type == "int"` compare deux adresses, pas deux textes (voir la même remarque dans le chapitre [Les pointeurs](/?c=langages-de-programmation&s=c&p=pointeurs)) : selon comment la chaîne littérale a été allouée, la comparaison peut échouer alors que le texte est identique.

## Dispatcher sans chaîne de `if`/`else if`

Une chaîne de comparaisons devient vite un code à faire grandir manuellement à chaque nouveau type : exactement le genre de répétition qu'une [structure indexée](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) permet d'éviter, ici sous la forme d'une **table de dispatch** associant chaque étiquette à un [pointeur de fonction](/?c=langages-de-programmation&s=c&p=pointeurs) :

```c
void afficherInt(void *d)    { printf("%d\n", *(int *)d); }
void afficherFloat(void *d)  { printf("%f\n", *(float *)d); }
void afficherString(void *d) { printf("%s\n", (char *)d); }

typedef struct {
    char *type;
    void (*fonction)(void *);
} Dispatch;

Dispatch table[] = {
    {"int", afficherInt},
    {"float", afficherFloat},
    {"string", afficherString},
};

void afficher(Valeur v) {
    for (int i = 0; i < 3; i++) {
        if (strcmp(table[i].type, v.type) == 0) {
            table[i].fonction(v.donnee);
            return;
        }
    }
}
```

Ajouter un type revient à ajouter une ligne dans `table`, jamais à toucher `afficher()` elle-même.

## Ce que ça résout, et ce que ça ne résout pas

| | `void*` + étiquette (C) | Templates (C++) |
|---|---|---|
| Vérification du type | À l'exécution, par le code lui-même | À la compilation, par le compilateur |
| Coût à l'exécution | Comparaison d'étiquette + indirection à chaque appel | Nul (code spécialisé généré par type) |
| Type incorrect | Bug silencieux si l'étiquette ment ou est oubliée | Erreur de compilation |
| Ce qui est réellement généralisé | Le code qui manipule la donnée | Le code **et** la garantie de type |

Voir [Les templates](/?c=langages-de-programmation&s=cpp&p=templates) : la même intention (écrire une fois, utiliser avec n'importe quel type) résolue à un moment complètement différent du cycle de vie du programme. Le C n'offrant pas de vérification à la compilation pour ce genre de code, la responsabilité de la cohérence entre `donnee` et `type` repose entièrement sur le programmeur, sans filet.

> **Bonne pratique :** centraliser la construction d'une `Valeur` (jamais assigner `donnee`/`type` séparément à la main à plusieurs endroits) dans une seule fonction par type (`valeurDepuisInt()`, `valeurDepuisFloat()`...), pour qu'une étiquette incohérente avec sa donnée ne puisse pas apparaître ailleurs que dans ce point d'entrée unique.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le C n'a pas de généricité vérifiée à la compilation : `void*` fait circuler une donnée de type quelconque, mais perd son type. Une étiquette (chaîne ou enum) transportée à côté du `void*` restaure cette information à l'exécution, condition du cast avant déréférencement. |
| **Outils utilisables** | Une table de dispatch (étiquette -> pointeur de fonction) pour éviter une chaîne de `if`/`else if` qui grandit à chaque nouveau type. |
| **Pièges à éviter** | Comparer des étiquettes de type chaîne avec `==` plutôt que `strcmp()`. Faire confiance à un cast sans avoir vérifié l'étiquette au préalable. |
| **Bonnes pratiques** | Centraliser la construction de la paire donnée/étiquette dans une fonction dédiée par type, pour qu'aucune incohérence ne puisse apparaître ailleurs. |
