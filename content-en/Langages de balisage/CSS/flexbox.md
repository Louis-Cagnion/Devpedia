---
order: 5
---

# Flexbox

**Flexbox** (*Flexible Box Layout*) arranges elements along a **single axis** (horizontal or vertical), distributing the available space among them—the modern solution for aligning, centering, and spacing elements, replacing much more fragile legacy techniques (floats, tables used for purposes other than their intended use; see the HTML chapter on tables).

## Enable Flexbox

```css
.conteneur {
    display: flex;
}
```

As soon as `display: flex` is applied to an element, all of its **direct children** (and only those) become "flexible elements," automatically aligned on a single line (by default).

## Main link: `flex-direction`

```css
.conteneur {
    display: flex;
    flex-direction: row;      /* par défaut : gauche à droite */
    /* flex-direction: column;   -> haut en bas */
    /* flex-direction: row-reverse; */
}
```

Flexbox operates in terms of a** main** axis (`flex-direction`) and a** cross** axis (perpendicular to the main axis)—the alignment properties listed below are applied differently depending on which axis is used.

## Align with the main axis: `justify-content`

```css
.conteneur {
    display: flex;
    justify-content: flex-start;     /* par défaut : regroupés au début */
    /* justify-content: center;        -> centrés */
    /* justify-content: space-between;  -> espace égal ENTRE les éléments, rien sur les bords */
    /* justify-content: space-around;    -> espace égal AUTOUR de chaque élément */
}
```

## Align with the secondary axis: `align-items`

```css
.conteneur {
    display: flex;
    align-items: stretch;       /* par défaut : étire les éléments sur toute la hauteur disponible */
    /* align-items: center;       -> centre verticalement (si flex-direction: row) */
    /* align-items: flex-start;     -> aligne en haut */
    /* align-items: flex-end;        -> aligne en bas */
}
```

> **Perfect centering—a classic achieved in just three lines:**

```css
.conteneur {
    display: flex;
    justify-content: center;   /* centre horizontalement */
    align-items: center;        /* centre verticalement */
}
```

## Properties Related to Children

```css
.element {
    flex-grow: 1;      /* peut grandir pour occuper l'espace restant (1 = part égale entre éléments) */
    flex-shrink: 1;      /* peut rétrécir si l'espace manque (par défaut) */
    flex-basis: 200px;     /* taille de départ, avant application de grow/shrink */
    order: 2;                /* change l'ordre d'affichage SANS toucher au HTML */
}
```

> **Note (accessibility):** `order` only changes the **visual** order—the tab order on the keyboard and the order read by a screen reader remain those specified in the HTML. A discrepancy between the two can confuse a user navigating with a keyboard or a screen reader; this should be reserved for purely decorative rearrangements, and never used to correct a content order that makes no sense in the HTML itself.

```css
.colonne-principale { flex-grow: 2; }   /* occupe deux fois plus d'espace que .colonne-laterale */
.colonne-laterale { flex-grow: 1; }
```

## Line break: `flex-wrap`

```css
.conteneur {
    display: flex;
    flex-wrap: nowrap;   /* par défaut : tout tient sur une seule ligne, rétrécit si besoin */
    /* flex-wrap: wrap;     -> passe à la ligne suivante si manque de place */
}
```

## Visual Summary

```text
justify-content (axe principal, ici horizontal) :
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (axe secondaire, ici vertical) :
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

See also the chapter on CSS Grid for two-dimensional layout (rows AND columns simultaneously), whereas Flexbox is fundamentally designed for a single axis at a time.
