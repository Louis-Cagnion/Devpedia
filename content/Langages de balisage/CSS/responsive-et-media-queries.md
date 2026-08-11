---
order: 7
---

# Le responsive design et les media queries

Le **responsive design** consiste à concevoir une page qui s'adapte à n'importe quelle taille d'écran (mobile, tablette, ordinateur) : une nécessité depuis que la majorité du trafic web se fait sur mobile, et la principale raison d'être des **media queries**.

## Les unités relatives, avant même les media queries

```css
div {
    width: 300px;     /* fixe, ne s'adapte à RIEN */
    width: 50%;         /* relatif au parent */
    font-size: 1.5rem;    /* relatif à la taille de police racine (<html>), indépendant du parent */
    font-size: 1.5em;      /* relatif à la taille de police du PARENT direct (peut s'accumuler en cascade) */
    width: 50vw;             /* relatif à la largeur de la fenêtre (viewport width) */
    height: 100vh;             /* relatif à la hauteur de la fenêtre (viewport height) */
}
```

> **Note :** `rem` est généralement préféré à `em` pour les tailles de police, car il reste prévisible même dans des composants imbriqués (un `em` sur un élément dont le parent a déjà un `em` modifié s'accumule de façon souvent non désirée) ; `rem` se base toujours sur la même référence (`<html>`), quelle que soit la profondeur d'imbrication.

## Les media queries

```css
/* Style par défaut, pensé "mobile first" */
.conteneur {
    flex-direction: column;
}

/* S'applique UNIQUEMENT si la largeur d'écran atteint au moins 768px */
@media (min-width: 768px) {
    .conteneur {
        flex-direction: row;
    }
}

/* S'applique UNIQUEMENT si la largeur d'écran est de 767px maximum */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## "Mobile first" vs "desktop first"

```css
/* Approche mobile first : le style de base cible le mobile, on ÉLARGIT ensuite */
.grille { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grille { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grille { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Best practice :** l'approche "*mobile first*" (utiliser `min-width`, styliser d'abord pour le plus petit écran, puis ajouter de la complexité pour les écrans plus grands) est généralement préférée à l'inverse : elle force à réfléchir d'abord au contenu essentiel, et s'aligne avec le fait que la majorité du trafic web est mobile.

## Points de rupture (*breakpoints*) courants

| Largeur | Cible typique |
|---|---|
| `< 768px` | Mobile |
| `768px – 1023px` | Tablette |
| `≥ 1024px` | Ordinateur de bureau |

> **Note :** ces valeurs ne sont **pas** une norme officielle : elles varient selon les projets et les frameworks CSS. Ce qui compte réellement, c'est de faire varier ses points de rupture en fonction du contenu lui-même (le moment où la mise en page commence à mal fonctionner visuellement), pas seulement de reproduire des tailles d'appareils physiques précises.

## Autres media features utiles

```css
@media (orientation: portrait) { }     /* écran plus haut que large */
@media (prefers-color-scheme: dark) { }  /* l'utilisateur a activé le mode sombre au niveau système */
@media print { }                          /* styles appliqués uniquement à l'impression */
```

Voir aussi [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), dont `repeat(auto-fit, minmax(...))` permet d'obtenir un comportement responsive **sans écrire aucune media query**, une alternative complémentaire à connaître.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le responsive design adapte une page à toute taille d'écran, via des unités relatives (`%`, `rem`, `vw`/`vh`) et des media queries (`@media (min-width: ...)`) qui appliquent un style seulement à certaines largeurs. |
| **Outils utilisables** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme)`. |
| **Pièges à éviter** | Baser ses points de rupture sur des tailles d'appareils précises plutôt que sur le moment où la mise en page casse réellement visuellement. |
| **Bonnes pratiques** | Adopter une approche *mobile first* (`min-width`, styliser d'abord le plus petit écran) ; préférer `rem` à `em` pour les tailles de police, plus prévisible en cas d'imbrication. |
