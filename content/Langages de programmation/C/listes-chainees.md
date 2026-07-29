---
order: 11
---

# Les listes chaînées

Une **liste chaînée** est une structure de données où chaque élément (un **maillon**, ou *nœud*) contient une valeur et un pointeur vers l'élément suivant. Contrairement à un tableau, ses éléments ne sont pas stockés de façon contiguë en mémoire — c'est ce qui permet d'ajouter ou de retirer un élément sans avoir à déplacer tous les autres.

## Déclarer un maillon

```
typedef struct Maillon
{
    int valeur;
    struct Maillon *suivant;
} Maillon;
```

Comme pour un arbre binaire (cf. chapitre dédié), `struct Maillon *suivant` doit référencer `struct Maillon` et non `Maillon` seul : au moment où cette ligne est lue, le `typedef` n'est pas encore complètement défini.

## Créer et chaîner des maillons

```
Maillon *premier = malloc(sizeof(Maillon));   // à vérifier contre NULL en pratique (cf. chapitre mémoire)
premier->valeur = 10;

Maillon *second = malloc(sizeof(Maillon));
second->valeur = 20;

premier->suivant = second; // chaîne le premier vers le second
second->suivant = NULL;    // NULL marque la fin de la liste
```

```
premier -> second -> NULL
  10         20
```

## Parcourir la liste

```
void afficher(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        printf("%d\n", courant->valeur);
        courant = courant->suivant;
    }
}
```

> **Note :** `courant` est une **copie** du pointeur `tete` — avancer `courant = courant->suivant` ne modifie pas `tete`, qui continue de désigner le premier maillon de la liste. C'est pour ça qu'on utilise toujours un pointeur "de travail" séparé pour parcourir une liste, jamais la tête elle-même.

## Insérer en tête de liste

```
Maillon *insererEnTete(Maillon *tete, int valeur)
{
    Maillon *nouveau = malloc(sizeof(Maillon));
    if (nouveau == NULL) {
        return tete; // échec d'allocation : renvoyer la liste inchangée plutôt que planter
    }
    nouveau->valeur = valeur;
    nouveau->suivant = tete; // le nouveau maillon pointe vers l'ancienne tête
    return nouveau;          // devient la nouvelle tête
}

// utilisation :
tete = insererEnTete(tete, 5);
```

Insérer en tête est une opération en temps constant (aucun autre maillon n'est déplacé) — contrairement à un tableau, où insérer au début demande de décaler tous les éléments existants.

## Libérer la liste

Chaque maillon alloué avec `malloc()` doit être libéré individuellement — libérer directement `tete` sans garder de référence au reste perdrait l'accès à tous les maillons suivants (fuite mémoire, cf. chapitre sur la gestion de la mémoire) :

```
void libererListe(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        Maillon *suivant = courant->suivant; // sauvegarder le suivant AVANT de libérer courant
        free(courant);
        courant = suivant;
    }
}
```

> **Note :** l'ordre compte ici : appeler `free(courant)` puis lire `courant->suivant` serait un **use-after-free** (cf. chapitre sur la gestion de la mémoire) — la valeur du pointeur `suivant` doit être récupérée avant la libération du maillon qui la contient.

## Liste chaînée vs tableau

| | Tableau | Liste chaînée |
|---|---|---|
| Accès à un élément par index | Immédiat (`tab[i]`) | Il faut parcourir depuis le début |
| Insertion en tête/milieu | Décale tous les éléments suivants | Temps constant, aucun déplacement |
| Mémoire | Contiguë | Éclatée, un `malloc` par maillon |
| Taille | Fixe (tableau statique) ou à redimensionner (`realloc`) | Croît naturellement, un maillon à la fois |
