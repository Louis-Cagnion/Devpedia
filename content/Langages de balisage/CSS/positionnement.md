---
order: 4
---

# Le positionnement (position, z-index)

La propriété `position` change fondamentalement la façon dont un élément est placé sur la page : au-delà du flux normal (chaque élément l'un après l'autre) que gèrent déjà [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) et [Grid](/?c=langages-de-balisage&s=css&p=grid).

## `static` : le comportement par défaut

```css
div {
    position: static;   /* valeur par défaut : suit le flux normal du document */
}
```

Un élément `static` ignore totalement `top`/`left`/`right`/`bottom` : ces propriétés n'ont d'effet que sur les autres valeurs de `position`.

## `relative` : décalé par rapport à sa position d'origine

```css
div {
    position: relative;
    top: 10px;     /* décalé de 10px vers le BAS par rapport à sa position normale */
    left: 20px;      /* décalé de 20px vers la DROITE */
}
```

> **Note :** l'élément garde son emplacement d'origine **réservé** dans le flux (les autres éléments ne bougent pas pour compenser) ; seul son affichage visuel est décalé. `position: relative` sert aussi très souvent à une seconde chose : définir un point de référence pour un enfant en `position: absolute` (voir plus bas).

## `absolute` : positionné par rapport à un ancêtre positionné

```css
.conteneur {
    position: relative;   /* devient le point de référence */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* positionné dans le coin supérieur droit DE .conteneur */
}
```

Un élément `absolute` est retiré du flux normal (les autres éléments se comportent comme s'il n'existait plus), et positionné par rapport à son ancêtre positionné le plus proche (`relative`, `absolute`, `fixed` ou `sticky`) ; s'il n'y en a aucun, par rapport à la page entière (`<html>`).

> **Note (piège classique) :** un `.badge { position: absolute; }` sans **aucun** ancêtre positionné se positionne par rapport à toute la page, pas juste son conteneur visuel apparent : c'est pour ça que `.conteneur { position: relative; }` accompagne presque systématiquement un enfant en `absolute`, même sans aucun décalage (`top`/`left`) sur le conteneur lui-même.

## `fixed` : positionné par rapport à la fenêtre, immobile au scroll

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Reste à la même position visuelle **même en faisant défiler la page**, utilisé pour un menu toujours visible, un bandeau de notification, etc. Positionné par rapport à la fenêtre du navigateur (*viewport*), pas par rapport à un ancêtre.

## `sticky` : un hybride entre `relative` et `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Se comporte comme `relative` tant que l'élément est visible dans son emplacement normal, puis devient `fixed` (collé au bord précisé, ici `top: 0`) dès que le défilement l'amènerait à en sortir, utilisé typiquement pour un en-tête de tableau qui reste visible pendant le défilement du contenu.

## `z-index` : gérer la superposition

```css
.modale {
    position: absolute;
    z-index: 100;    /* affiché AU-DESSUS des éléments avec un z-index plus faible */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Note :** `z-index` n'a d'effet que sur un élément **déjà positionné** (`relative`, `absolute`, `fixed` ou `sticky`) : sur un élément `static`, `z-index` est purement et simplement ignoré. Une valeur de `z-index` plus élevée s'affiche par-dessus une valeur plus faible, mais uniquement en comparaison d'éléments qui partagent le même "contexte d'empilement" (un groupe d'éléments comparés entre eux pour la superposition ; un élément positionné avec un `z-index`, une opacité inférieure à 1, ou une transformation crée un nouveau contexte pour ses propres enfants : leurs `z-index` s'y comparent entre eux, jamais directement à ceux de l'extérieur) ; un détail qui explique certains cas où un `z-index` très élevé ne suffit pas à passer au-dessus d'un élément apparemment moins prioritaire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `position` change comment un élément est placé : `static` (défaut, flux normal), `relative` (décalé, place réservée), `absolute` (retiré du flux, relatif à un ancêtre positionné), `fixed` (relatif à la fenêtre), `sticky` (hybride relative/fixed). `z-index` gère la superposition, mais seulement entre éléments positionnés. |
| **Outils utilisables** | `position`, `top`/`right`/`bottom`/`left`, `z-index`. |
| **Pièges à éviter** | Un `absolute` sans ancêtre `relative` se positionne par rapport à toute la page, pas au conteneur visuel attendu ; `z-index` est ignoré sur un élément `static`. |
| **Bonnes pratiques** | Toujours poser `position: relative` sur le conteneur d'un enfant en `absolute`, même sans décalage propre à ce conteneur. |
