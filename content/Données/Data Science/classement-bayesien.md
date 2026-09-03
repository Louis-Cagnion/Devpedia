---
order: 11
---

# Le classement bayésien : corriger une moyenne trop naïve

Classer des éléments (avis clients, restaurants, films) par leur simple **moyenne** semble naturel, mais favorise à tort les petits échantillons : une fiche notée 5/5 par un seul client bat, dans un classement par moyenne pure, une fiche notée 4,8/5 par 500 clients. Le **classement bayésien** (popularisé par IMDB pour son classement de films) corrige ce biais.

## Le problème : une moyenne parfaite n'est pas toujours fiable

| Fiche | Note moyenne | Nombre d'avis | Fiable ? |
|---|---|---|---|
| A | 5,0 / 5 | 2 | Peu fiable : deux avis ne prouvent presque rien |
| B | 4,8 / 5 | 500 | Très fiable : une moyenne stable sur un grand échantillon |

Une moyenne simple classerait A avant B, alors que B est manifestement le résultat le plus digne de confiance.

## La formule

```
note_ajustee = (R x v + m x C) / (v + m)
```

| Variable | Signification |
|---|---|
| `R` | Moyenne brute de l'élément (ex : 5,0 pour la fiche A) |
| `v` | Nombre d'avis de l'élément (ex : 2 pour la fiche A) |
| `C` | Moyenne globale de référence, calculée sur l'ensemble des fiches |
| `m` | Seuil de confiance : le nombre d'avis à partir duquel on fait vraiment confiance à `R` plutôt qu'à `C` |

## Interprétation : un lissage progressif, pas un seuil brutal

```python
def note_ajustee(R, v, C, m):
    return (R * v + m * C) / (v + m)

# Fiche A : 5.0 sur 2 avis, contre une moyenne globale de 4.2, seuil de confiance m=50
note_ajustee(R=5.0, v=2,   C=4.2, m=50)   # ~4.23 : tres proche de la reference globale
note_ajustee(R=4.8, v=500, C=4.2, m=50)   # ~4.71 : tres proche de la moyenne brute
```

- Quand `v` est **grand** devant `m` (fiche B) : la formule tend vers la moyenne brute `R`, le volume d'avis suffit à lui faire confiance.
- Quand `v` est **petit** devant `m` (fiche A) : la formule tend vers la référence globale `C`, l'échantillon est trop faible pour s'y fier seul.

```text
v = 0        v petit          v = m           v grand          v -> infini
  |             |                |                |                 |
  C ────────────┼────────────────┼────────────────┼─────────────────R
              proche de C    a mi-chemin      proche de R       egal a R
```

Aucun seuil brutal ("moins de `m` avis = fiche ignorée") : la transition entre `C` et `R` est continue, proportionnelle au nombre d'avis déjà collectés.

> **Piège :** choisir `m` arbitrairement petit pour qu'une fiche à fort volume "gagne" plus vite. Un `m` trop faible réintroduit le problème initial : une fiche à 3 avis parfaits redevient compétitive face à une fiche à 500 avis très bons.
>
> **Bonne pratique :** fixer `m` à une valeur représentative du nombre d'avis nécessaire, dans le domaine concerné, pour qu'une moyenne commence à être jugée fiable (souvent estimé empiriquement à partir de la distribution réelle du nombre d'avis par fiche).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une moyenne brute favorise à tort les petits échantillons. Le classement bayésien pondère la moyenne de chaque élément par son volume d'avis, en la ramenant vers une moyenne globale de référence tant que ce volume reste faible. |
| **Outils utilisables** | La formule `(R·v + m·C) / (v + m)`, avec `m` calibré empiriquement sur la distribution réelle du nombre d'avis. |
| **Pièges à éviter** | Classer par moyenne brute sans tenir compte du volume d'avis ; choisir un `m` trop faible, qui annule l'effet correctif recherché. |
| **Bonnes pratiques** | Calibrer `m` sur des données réelles plutôt qu'au hasard ; vérifier que le classement obtenu place bien les fiches à fort volume et bonne moyenne devant les fiches à volume trop faible pour être fiables. |
