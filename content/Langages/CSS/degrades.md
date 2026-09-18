---
order: 8
---

# Les dégradés CSS (linear, radial, conic)

Un **dégradé** (*gradient*) est une transition progressive entre plusieurs couleurs, utilisable partout où une couleur simple l'est (`background`, `border-image`...), sans image ni fichier externe. Trois formes existent, qui se distinguent par la **direction** dans laquelle la couleur progresse.

## `linear-gradient()` : une progression en ligne droite

```css
.barre {
    background: linear-gradient(to right, #4a90d9, #d94a90);
    /* progresse en ligne droite, de gauche a droite */
}
```

| Paramètre | Rôle |
|---|---|
| Direction (`to right`, `45deg`...) | L'axe le long duquel la couleur progresse |
| Couleurs (2 ou plus, séparées par des virgules) | Les étapes de la transition, réparties uniformément par défaut |

## `radial-gradient()` : une progression en cercles concentriques

```css
.halo {
    background: radial-gradient(circle, #ffffff, #000000);
    /* progresse du centre vers l'exterieur, en cercles concentriques */
}
```

Part d'un point central et progresse vers l'extérieur, en cercles (ou ellipses) de plus en plus grands, plutôt qu'en ligne droite.

## `conic-gradient()` : une progression angulaire, autour d'un point central

```css
.anneau-progression {
    width: 100px;
    height: 100px;
    border-radius: 50%;   /* rend l'element rond */
    background: conic-gradient(#4a90d9 75%, #e0e0e0 0);
    /* la couleur "tourne" autour du centre, comme les aiguilles d'une horloge */
}
```

Contrairement aux deux précédents, la couleur ne progresse ni en ligne droite ni en cercles concentriques : elle **tourne** autour d'un point central, comme les aiguilles d'une horloge. `conic-gradient(#4a90d9 75%, #e0e0e0 0)` remplit 75% du tour en bleu, puis le reste en gris : combiné à `border-radius: 50%`, ce motif dessine un anneau de progression circulaire sans aucun SVG (`stroke-dasharray`) ni JavaScript pour calculer la forme.

| | `linear-gradient` | `radial-gradient` | `conic-gradient` |
|---|---|---|---|
| Direction de la progression | Ligne droite | Cercles concentriques, du centre vers l'extérieur | Rotation autour d'un point central |
| Cas d'usage typique | Arrière-plan, bouton, superposition de lisibilité sur une image | Halo lumineux, vignette | Anneau/jauge de progression, roue chromatique |

> **Bonne pratique :** `conic-gradient()` sur un élément `border-radius: 50%` est une alternative légère à un anneau de progression en SVG, tant que la forme reste un simple cercle rempli par pourcentage ; passer au SVG dès que la jauge a besoin d'une épaisseur de trait variable ou d'extrémités arrondies (`stroke-linecap`), que `conic-gradient()` ne sait pas produire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un dégradé transitionne entre plusieurs couleurs sans image. `linear-gradient` progresse en ligne droite, `radial-gradient` en cercles concentriques depuis un centre, `conic-gradient` en tournant autour d'un point central. |
| **Outils utilisables** | `linear-gradient(direction, couleurs...)`, `radial-gradient(forme, couleurs...)`, `conic-gradient(couleurs...)` combiné à `border-radius: 50%` pour un anneau de progression. |
| **Pièges à éviter** | Recréer en SVG/JavaScript un anneau de progression circulaire simple que `conic-gradient()` dessine en une seule ligne CSS. |
| **Bonnes pratiques** | Choisir la forme de dégradé selon la direction réelle de la progression voulue, pas par habitude d'utiliser toujours la même. Basculer vers SVG seulement si `conic-gradient()` ne suffit plus (épaisseur/extrémités variables). |
