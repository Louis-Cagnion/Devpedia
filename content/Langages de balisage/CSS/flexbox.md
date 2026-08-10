---
order: 5
---

# Flexbox

**Flexbox** (*Flexible Box Layout*) organise des éléments le long d'un **seul axe** (horizontal ou vertical), en distribuant l'espace disponible entre eux — la solution moderne pour aligner, centrer et répartir des éléments, remplaçant des techniques historiques bien plus fragiles (flottants, [tableaux](/?c=langages-de-balisage&s=html&p=tableaux) détournés de leur usage d'origine).

## Activer Flexbox

```css
.conteneur {
    display: flex;
}
```

Dès que `display: flex` est posé sur un élément, tous ses **enfants directs** (et uniquement eux) deviennent des "éléments flexibles", alignés automatiquement sur une ligne (par défaut).

## L'axe principal : `flex-direction`

```css
.conteneur {
    display: flex;
    flex-direction: row;      /* par défaut : gauche à droite */
    /* flex-direction: column;   -> haut en bas */
    /* flex-direction: row-reverse; */
}
```

Tout Flexbox raisonne en termes d'**axe principal** (celui de `flex-direction`) et d'**axe secondaire** (perpendiculaire) — les propriétés d'alignement ci-dessous s'appliquent différemment selon cet axe.

## Aligner sur l'axe principal : `justify-content`

```css
.conteneur {
    display: flex;
    justify-content: flex-start;     /* par défaut : regroupés au début */
    /* justify-content: center;        -> centrés */
    /* justify-content: space-between;  -> espace égal ENTRE les éléments, rien sur les bords */
    /* justify-content: space-around;    -> espace égal AUTOUR de chaque élément */
}
```

## Aligner sur l'axe secondaire : `align-items`

```css
.conteneur {
    display: flex;
    align-items: stretch;       /* par défaut : étire les éléments sur toute la hauteur disponible */
    /* align-items: center;       -> centre verticalement (si flex-direction: row) */
    /* align-items: flex-start;     -> aligne en haut */
    /* align-items: flex-end;        -> aligne en bas */
}
```

> **Le centrage parfait, un classique résolu en 3 lignes :**

```css
.conteneur {
    display: flex;
    justify-content: center;   /* centre horizontalement */
    align-items: center;        /* centre verticalement */
}
```

## Les propriétés sur les enfants

```css
.element {
    flex-grow: 1;      /* peut grandir pour occuper l'espace restant (1 = part égale entre éléments) */
    flex-shrink: 1;      /* peut rétrécir si l'espace manque (par défaut) */
    flex-basis: 200px;     /* taille de départ, avant application de grow/shrink */
    order: 2;                /* change l'ordre d'affichage SANS toucher au HTML */
}
```

> **Note (accessibilité) :** `order` ne change que l'ordre **visuel** — l'ordre de tabulation au clavier et celui lu par un lecteur d'écran restent ceux du HTML. Un décalage entre les deux peut désorienter un utilisateur au clavier ou avec un lecteur d'écran ; à réserver aux réordonnancements purement décoratifs, jamais pour réparer un ordre de contenu qui n'a pas de sens dans le HTML lui-même.

```css
.colonne-principale { flex-grow: 2; }   /* occupe deux fois plus d'espace que .colonne-laterale */
.colonne-laterale { flex-grow: 1; }
```

## Retour à la ligne : `flex-wrap`

```css
.conteneur {
    display: flex;
    flex-wrap: nowrap;   /* par défaut : tout tient sur une seule ligne, rétrécit si besoin */
    /* flex-wrap: wrap;     -> passe à la ligne suivante si manque de place */
}
```

## Résumé visuel

```text
justify-content (axe principal, ici horizontal) :
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (axe secondaire, ici vertical) :
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

Voir aussi [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), pour une mise en page à **deux** dimensions (lignes ET colonnes simultanément), là où Flexbox reste fondamentalement pensé pour un seul axe à la fois.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Flexbox aligne des éléments sur un seul axe (`flex-direction`). `justify-content` aligne sur l'axe principal, `align-items` sur l'axe secondaire. `flex-grow`/`flex-shrink`/`flex-basis` contrôlent la taille des enfants. |
| **Outils utilisables** | `display: flex`, `justify-content`, `align-items`, `flex-wrap`, `flex-grow`/`shrink`/`basis`, `order`. |
| **Pièges à éviter** | Utiliser `order` pour réordonner un contenu qui a un vrai sens de lecture — l'ordre visuel change, mais pas l'ordre de tabulation clavier ni celui lu par un lecteur d'écran. |
| **Bonnes pratiques** | Réserver `order` aux réordonnancements purement décoratifs ; utiliser Grid plutôt que Flexbox dès que la mise en page a besoin de deux dimensions (lignes ET colonnes). |
