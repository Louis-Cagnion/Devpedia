---
order: 7
---

# Responsive Design and Media Queries

**Responsive design** involves creating a page that adapts to any screen size (mobile, tablet, computer)—a necessity now that the majority of web traffic comes from mobile devices, and the main reason for **media queries**.

## Relative units, even before media queries

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

> **Note:** `rem` is generally preferred over `em` for font sizes, because it remains predictable even in nested components (a `em` on an element whose parent already has a modified `em` often results in unintended accumulation) — `rem` always uses the same reference (`<html>`), regardless of the nesting depth.

## Media Queries

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

## "Mobile first" vs. "desktop first"

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

> **Best practice:** The "*mobile-first*" approach (using `min-width`, styling for the smallest screen first, then adding complexity for larger screens) is generally preferred over the reverse—it forces you to think about essential content first and aligns with the fact that the majority of web traffic comes from mobile devices.

## Common breakpoints

| Width | Typical Target |
|---|---|
| `< 768px` | Mobile |
| `768px – 1023px` | Tablet |
| `≥ 1024px` | Desktop Computer |

> **Note:** These values are **not** an official standard—they vary depending on the project and CSS framework. What really matters is adjusting your breakpoints based on the content itself (the point at which the layout begins to look off), not just replicating specific physical device sizes.

## Other Useful Media Features

```css
@media (orientation: portrait) { }     /* écran plus haut que large */
@media (prefers-color-scheme: dark) { }  /* l'utilisateur a activé le mode sombre au niveau système */
@media print { }                          /* styles appliqués uniquement à l'impression */
```

See also the chapter on CSS Grid, where `repeat(auto-fit, minmax(...))` allows you to achieve responsive behavior **without writing any media queries**—a complementary alternative worth knowing about.
