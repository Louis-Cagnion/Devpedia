---
order: 4
---

# Espacement et grille (layout)

L'espacement a déjà été présenté comme un levier de [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) : plus d'espace autour d'un élément l'isole et le fait remarquer. Ce chapitre traite l'espacement comme un système complet — une grille et une échelle cohérentes — plutôt que comme un réglage ponctuel.

## L'espace négatif : un outil actif, pas un vide à combler

L'**espace négatif** (*white space*) est l'espace vide autour et entre les éléments d'un écran. Ce n'est pas un manque à corriger en remplissant chaque pixel disponible — c'est un outil qui laisse respirer le contenu et réduit l'effort de lecture.

> **Analogie :** le silence en musique. Les pauses entre les notes font autant partie du morceau que les notes elles-mêmes — sans elles, tout se mélange en un bruit continu.

> **Piège :** la "peur du vide" — remplir chaque espace disponible avec du contenu ou de la décoration, en partant du principe qu'un espace vide est un espace gaspillé. Résultat : une surcharge visuelle (déjà vue au [chapitre 1](/?c=ui-ux&p=hierarchie-visuelle)) et une lecture plus fatigante.
>
> **Bonne pratique :** traiter l'espace vide comme un élément de design à part entière, décidé au même titre que la couleur ou la typographie — pas comme un reste à combler.

## Le système de grille : colonnes, gouttières, marges

Une **grille** structure une page en zones alignées entre elles, plutôt que de placer chaque élément au jugé :

| Terme | Définition | Rôle |
|---|---|---|
| Colonne | Une bande verticale dans laquelle le contenu s'aligne | Structure la page en zones cohérentes entre elles |
| Gouttière (*gutter*) | L'espace vide entre deux colonnes | Sépare visuellement le contenu de colonnes voisines |
| Marge | L'espace vide entre le contenu et le bord de l'écran | Empêche le contenu de "coller" aux bords |

```
┌──marge──┬────col A────┬gut┬────col B────┬gut┬────col C────┬──marge──┐
│         │   Bloc 1     │   │   Bloc 2     │   │   Bloc 3     │         │
└─────────┴──────────────┴───┴──────────────┴───┴──────────────┴─────────┘
```

La convention la plus répandue sur le web est une grille à 12 colonnes : 12 se divise par 2, 3, 4 et 6, ce qui permet de composer des mises en page variées (deux blocs égaux, trois blocs égaux, un tiers + deux tiers...) sans changer de grille.

> **Piège :** aligner des éléments "à l'œil" plutôt que sur une grille explicite. Les décalages de quelques pixels qui en résultent sont invisibles pris isolément, mais donnent à l'ensemble de la page une impression d'incohérence.
>
> **Bonne pratique :** définir la grille (nombre de colonnes, largeur des gouttières) avant de placer le moindre élément, puis aligner systématiquement dessus.

## Une échelle d'espacement cohérente

Plutôt que d'inventer une valeur d'espacement au cas par cas (5px ici, 13px là, 22px ailleurs), une échelle fixe en multiples d'une unité de base (4px ou 8px) couvre tous les besoins :

| Multiple | Valeur (base 8px) | Usage typique |
|---|---|---|
| ×1 | 8px | Entre éléments très proches (une icône et son texte) |
| ×2 | 16px | Entre éléments liés (les champs d'un formulaire) |
| ×3 | 24px | Entre sous-sections |
| ×4 | 32px | Entre grands blocs de page |
| ×6 | 48px | Entre sections majeures |

> **Piège :** choisir chaque valeur d'espacement au cas par cas ("15px, ça a l'air bien ici"). Chaque valeur semble correcte isolément, mais leur accumulation dans tout le projet ne forme jamais un ensemble cohérent.
>
> **Bonne pratique :** définir cette échelle une fois, au démarrage du projet, puis y piocher exclusivement — jamais de valeur inventée ponctuellement.

## Le rythme vertical

Le **rythme vertical** est un espacement constant et prévisible entre les blocs de contenu empilés verticalement — titres, paragraphes, sections.

```
Titre
                    ← toujours le même espace après un titre (×3, 24px)
Paragraphe de texte...
                    ← toujours le même espace entre deux paragraphes (×2, 16px)
Paragraphe de texte...
```

> **Piège :** un espacement vertical qui varie sans raison d'un bloc à l'autre (24px ici, 30px là). La page semble "décousue", même si chaque bloc pris isolément paraît correct.
>
> **Bonne pratique :** attribuer un espacement fixe et réutilisé à chaque type de transition (titre → paragraphe, paragraphe → paragraphe, section → section), tiré de l'échelle définie plus haut.

> **Tendance actuelle (2026) :** retour à des mises en page prévisibles et repérables, dans la même logique que le retour à la clarté déjà observé pour la [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) — plutôt qu'à des grilles expérimentales.

## Passer à l'implémentation

Une grille et un rythme vertical se construisent concrètement avec [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) ou [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), et doivent s'adapter à la taille de l'écran via [le responsive design](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'espace négatif est un outil actif, pas un vide à combler. Une grille (colonnes, gouttières, marges) aligne les éléments entre eux, et une échelle d'espacement fixe (multiples de 4 ou 8px) garantit un rythme vertical cohérent. |
| **Outils utilisables** | Aucun outil spécifique — la grille et l'échelle se définissent à la conception, puis s'implémentent en CSS (Flexbox, Grid). |
| **Pièges à éviter** | Remplir chaque espace disponible par peur du vide ; aligner des éléments à l'œil plutôt que sur une grille ; inventer une valeur d'espacement au cas par cas. |
| **Bonnes pratiques** | Définir grille et échelle d'espacement avant de placer le moindre élément ; réutiliser toujours les mêmes valeurs d'espacement pour un même type de transition. |
