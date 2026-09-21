---
order: 6
---

# Le backtracking et la satisfaction de contraintes (CSP)

Un [CSP](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (*Constraint Satisfaction Problem*, problème de satisfaction de contraintes) consiste à trouver une valeur pour chaque **variable** d'un problème, parmi un ensemble de valeurs possibles (son **domaine**), sans violer aucune **contrainte** entre elles. Le [sudoku](https://fr.wikipedia.org/wiki/Sudoku), le [problème des N-reines](https://fr.wikipedia.org/wiki/Probl%C3%A8me_des_huit_dames) (placer N reines sur un échiquier N×N sans qu'aucune ne puisse en capturer une autre) et le coloriage de graphe (colorer chaque nœud sans que deux nœuds voisins partagent la même couleur) sont tous des CSP.

## Recommencer plutôt que revenir en arrière au hasard : le backtracking

Le **backtracking** (recherche avec retour arrière) explore les solutions possibles une variable à la fois : il essaie une valeur, **récurse** sur la variable suivante (la fonction s'appelle elle-même sur un sous-problème plus petit ; voir le tri fusion dans [Le tri par comparaison](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) pour une autre récursion), et si aucune valeur ne fonctionne pour la variable suivante, **annule** l'essai en cours pour tenter la valeur suivante -- d'où le terme "retour arrière".

Exemple sur les N-reines, en plaçant une reine par colonne :

```c
int colonnes[N]; // colonnes[i] = ligne où se trouve la reine de la colonne i

int est_valide(int colonne, int ligne)
{
    for (int c = 0; c < colonne; c++)
    {
        if (colonnes[c] == ligne)                     // même ligne qu'une reine déjà placée
            return 0;
        if (abs(colonnes[c] - ligne) == colonne - c)   // même diagonale
            return 0;
    }
    return 1;
}

int resoudre(int colonne)
{
    if (colonne == N)
        return 1; // toutes les colonnes sont placées : solution trouvée

    for (int ligne = 0; ligne < N; ligne++)
    {
        if (est_valide(colonne, ligne))
        {
            colonnes[colonne] = ligne;    // essai
            if (resoudre(colonne + 1))
                return 1;
            // échec plus loin : rien à annuler ici, la case sera juste réécrite au tour suivant
        }
    }
    return 0; // aucune ligne ne convient : retour arrière vers l'appel précédent
}
```

`resoudre` essaie chaque ligne pour la colonne courante ; si une ligne mène à un blocage plus loin (`resoudre(colonne + 1)` renvoie `0`), la boucle passe simplement à la ligne suivante -- c'est tout le mécanisme du retour arrière, sans structure de données dédiée. Sur un tableau non trié utilisé pour représenter les candidats restants d'une variable, le [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove) permet d'annuler un essai déjà retiré sans aucune copie.

## Choisir la bonne variable en premier : l'heuristique MRV

Dans quel ordre traiter les variables ? La colonne dans l'exemple ci-dessus, mais rien n'impose cet ordre. L'heuristique **MRV** (*Minimum Remaining Values*) choisit en priorité la variable qui a le **moins** de valeurs encore possibles :

| Variable | Valeurs encore possibles | Ordre MRV |
|---|---|---|
| A | 4 valeurs | 3ᵉ |
| B | 1 valeur | 1ʳᵉ |
| C | 2 valeurs | 2ᵉ |

Traiter `B` en premier échoue (ou réussit) immédiatement si sa seule valeur possible est déjà invalide, plutôt que de le découvrir après avoir exploré inutilement `A` et `C` en premier. Une variable à une seule valeur possible qui échoue coupe une branche entière de recherche dès le premier pas : deviner en premier sur la variable la plus contrainte fait échouer les mauvaises branches le plus tôt possible.

## Réduire les domaines avant même d'essayer : la propagation de contraintes

Le backtracking seul essaie puis annule. La **propagation de contraintes** va plus loin : avant (ou pendant) la recherche, elle réduit directement les valeurs possibles des variables non encore fixées, en fonction de celles déjà fixées, jusqu'à ce qu'aucune réduction supplémentaire ne soit possible (un **point fixe**).

```text
Contrainte : colonne A ≠ colonne B (déjà fixée à 3)

Avant propagation : A peut valoir {1, 2, 3, 4}
Après propagation : A peut valoir {1, 2, 4}       (3 retiré, incompatible avec B)
```

Si cette réduction vide complètement le domaine d'une variable (aucune valeur ne reste possible), la branche actuelle est mathématiquement impossible -- inutile d'essayer quoi que ce soit, elle est abandonnée immédiatement (*fail-fast*, échouer le plus tôt possible plutôt que de le découvrir après plusieurs étapes de recherche inutiles). Cette technique de réduction jusqu'au point fixe, combinée à cette détection de contradiction, porte un nom dans la littérature CSP : [**AC-3**](https://en.wikipedia.org/wiki/AC-3_algorithm) (*Arc Consistency 3*).

| | Backtracking seul | + Propagation de contraintes (AC-3) |
|---|---|---|
| Détection d'échec | Après avoir essayé une valeur invalide | Avant même d'essayer, si un domaine est vidé |
| Coût | Moins de calcul par étape | Plus de calcul par étape, mais des branches entières évitées |
| Usage typique | Petits problèmes, peu de contraintes croisées | Sudoku, planification, problèmes à fortes contraintes croisées |

> **Bonne pratique :** combiner les trois -- propagation pour éliminer les branches impossibles tôt, MRV pour deviner en premier sur la variable la plus susceptible d'échouer vite, backtracking pour explorer le reste -- plutôt que de choisir un seul mécanisme.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un CSP cherche une valeur par variable sans violer de contrainte. Le backtracking essaie une valeur, récurse, et annule si ça échoue plus loin. MRV choisit en premier la variable la plus contrainte. La propagation de contraintes (AC-3) réduit les domaines et détecte une contradiction avant même d'essayer. |
| **Outils utilisables** | Récursion pour l'exploration ; swap-remove pour annuler un retrait de candidat sans copie. |
| **Pièges à éviter** | Explorer les variables dans un ordre arbitraire plutôt qu'avec MRV, ce qui découvre les échecs plus tard que nécessaire. |
| **Bonnes pratiques** | Combiner backtracking, MRV et propagation de contraintes plutôt qu'un seul mécanisme isolé ; couper une branche dès qu'une contradiction est détectable (fail-fast), sans attendre d'aller plus loin. |
