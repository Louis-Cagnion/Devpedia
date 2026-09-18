---
order: 7
---

# Le responsive design et les media queries

Le **responsive design** consiste à concevoir une page qui s'adapte à n'importe quelle taille d'écran (mobile, tablette, ordinateur) : une nécessité depuis que la majorité du trafic web se fait sur mobile, et la principale raison d'être des **media queries**.

## Les unités relatives, avant même les media queries

```css
div {
    width: 300px;       /* fixe, ne s'adapte à RIEN */
    width: 50%;         /* relatif au parent */
    font-size: 1.5rem;  /* relatif à la taille de police racine (<html>), indépendant du parent */
    font-size: 1.5em;   /* relatif à la taille de police du PARENT direct (peut s'accumuler en cascade) */
    width: 50vw;        /* relatif à la largeur de la fenêtre (viewport width) */
    height: 100vh;      /* relatif à la hauteur de la fenêtre (viewport height) */
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
@media (orientation: portrait) { }           /* écran plus haut que large */
@media (prefers-color-scheme: dark) { }      /* l'utilisateur a activé le mode sombre au niveau système */
@media (prefers-reduced-motion: reduce) { }  /* l'utilisateur a demandé de réduire les animations */
@media print { }                             /* styles appliqués uniquement à l'impression */
```

`prefers-reduced-motion` répond à une préférence d'accessibilité réglée au niveau du système d'exploitation (utilisateur sensible au mouvement, migraines, troubles vestibulaires), pas au niveau du site :

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
        /* volontairement PAS "animation: none" -- voir le piège ci-dessous */
    }
}
```

> **Piège :** remplacer l'animation par `animation: none`/`transition: none` plutôt que par une durée quasi nulle. Du code peut dépendre des événements JavaScript `animationend`/`transitionend` (par exemple, supprimer un élément une fois sa transition de sortie terminée) : `none` ne déclenche jamais ces événements, ce qui casse ce code, alors qu'une durée de `0.001ms` les déclenche toujours, presque instantanément.
>
> **Bonne pratique :** réduire une animation à une durée quasi nulle (`0.001ms`) plutôt que de la supprimer entièrement avec `none`, pour continuer à déclencher les événements JavaScript dont du code peut dépendre.

## Les container queries : mesurer le conteneur plutôt que la fenêtre

Une media query mesure toujours la largeur de la **fenêtre** entière, ce qui peut être trompeur pour un composant qui n'occupe qu'une partie de l'écran (une carte dans une colonne de grille, à côté d'une barre latérale) : la fenêtre peut être large alors que l'espace réellement disponible pour ce composant précis est étroit. Une **container query** répond à ce cas précis en mesurant, non pas la fenêtre, mais le conteneur direct de l'élément :

```css
/* 1. Marquer un ancetre comme "conteneur interrogeable" */
.carte-conteneur {
    container-type: inline-size;  /* seule la largeur du conteneur est suivie */
}

/* 2. La regle @container reagit a LA LARGEUR DE CE CONTENEUR, pas de la fenetre */
@container (max-width: 860px) {
    .carte { flex-direction: column; }
}
```

| | `@media` | `@container` |
|---|---|---|
| Mesure | La largeur de la fenêtre entière | La largeur du conteneur `container-type` le plus proche |
| Cas d'usage typique | Adapter la mise en page globale de la page | Adapter un composant réutilisable, quel que soit l'espace qui lui est alloué |

> **Piège :** utiliser `@media` pour adapter un composant qui n'occupe qu'une partie de l'écran (une carte dans une colonne parmi plusieurs, à côté d'une barre latérale). La fenêtre peut rester large alors que l'espace réel de ce composant est déjà étroit : le composant ne change alors jamais de mise en page, même quand il en aurait besoin.
>
> **Bonne pratique :** utiliser `@container` dès qu'un composant doit réagir à l'espace qui lui est réellement alloué plutôt qu'à la taille de la fenêtre entière ; réserver `@media` à une adaptation vraiment globale de la page.

Voir aussi [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), dont `repeat(auto-fit, minmax(...))` permet d'obtenir un comportement responsive **sans écrire aucune media query**, une alternative complémentaire à connaître.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le responsive design adapte une page à toute taille d'écran, via des unités relatives (`%`, `rem`, `vw`/`vh`) et des media queries (`@media (min-width: ...)`) qui appliquent un style seulement à certaines largeurs. |
| **Outils utilisables** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme/prefers-reduced-motion)`, `@container` + `container-type` pour un composant isolé. |
| **Pièges à éviter** | Baser ses points de rupture sur des tailles d'appareils précises plutôt que sur le moment où la mise en page casse réellement visuellement. Utiliser `@media` pour un composant qui n'occupe qu'une partie de la fenêtre. Répondre à `prefers-reduced-motion` avec `animation: none` plutôt qu'une durée quasi nulle. |
| **Bonnes pratiques** | Adopter une approche *mobile first* (`min-width`, styliser d'abord le plus petit écran) ; préférer `rem` à `em` pour les tailles de police, plus prévisible en cas d'imbrication ; utiliser `@container` pour un composant qui doit réagir à son propre espace, pas à la fenêtre ; réduire une animation à une durée quasi nulle plutôt que de la supprimer avec `none`, pour ne pas casser un code qui dépend de `animationend`/`transitionend`. |
