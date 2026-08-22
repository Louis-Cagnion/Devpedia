---
order: 6
---

# CSS Grid

Contrairement à [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox), pensé pour un seul axe à la fois, **CSS Grid** organise des éléments sur une véritable grille à **deux dimensions** : lignes et colonnes définies simultanément, avec un contrôle précis de la position de chaque élément.

## Activer une grille

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;  /* 3 colonnes de 200px chacune */
    grid-template-rows: 100px 100px;           /* 2 lignes de 100px chacune */
    gap: 10px;                                 /* espace entre les cellules, lignes ET colonnes */
}
```

## L'unité `fr` : répartir l'espace disponible

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 colonnes : la 2e occupe 2x plus d'espace que les 2 autres */
}
```

`fr` (*fraction*) répartit l'espace **restant** après soustraction des tailles fixes ; bien plus flexible qu'un pourcentage, notamment en le combinant avec des tailles fixes :

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* colonne latérale fixe, colonne principale qui occupe le reste */
}
```

## `repeat()` : éviter la répétition

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* équivalent à "1fr 1fr 1fr 1fr" */
}
```

## Grilles responsives sans media query

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
```

`auto-fit` calcule automatiquement combien de colonnes **d'au moins** `200px` tiennent dans l'espace disponible, et les étire (`1fr`) pour combler l'espace restant : le nombre de colonnes s'adapte donc à la largeur de l'écran, sans écrire une seule [media query](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

## Placer un élément précisément

```css
.element {
    grid-column: 1 / 3;  /* s'étend de la ligne de grille 1 à la ligne 3 -> occupe 2 colonnes */
    grid-row: 2 / 4;     /* s'étend sur 2 lignes verticalement */
}
```

```text
Lignes de grille verticales :  1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ élément (col 1→3, row 2→4)  │
                                ├────┤              │
                          3 ┤   │    │              │
                                └────┴────┴────┘
```

## Les zones nommées (`grid-template-areas`) : la mise en page la plus lisible

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-areas:
        "entete  entete"
        "lateral principal"
        "pied    pied";
}

.entete { grid-area: entete; }
.lateral { grid-area: lateral; }
.principal { grid-area: principal; }
.pied { grid-area: pied; }
```

Chaque nom dans `grid-template-areas` dessine littéralement la disposition visuelle de la page directement dans le CSS ; une zone répétée sur plusieurs lignes/colonnes du schéma occupe automatiquement cet espace fusionné (ici, `entete` et `pied` s'étendent sur toute la largeur).

## Flexbox ou Grid ?

| | Flexbox | Grid |
|---|---|---|
| Dimensions | Un seul axe à la fois | Deux dimensions simultanées |
| Cas d'usage typique | Aligner des éléments dans une barre de navigation, centrer un contenu | Structurer la mise en page globale d'une page (en-tête/latéral/principal/pied) |
| Taille des éléments | Dépend souvent du contenu | Définie explicitement par la grille |

En pratique, les deux se combinent très souvent dans un même projet : Grid pour la structure générale de la page, Flexbox pour aligner le contenu à l'intérieur de chaque zone.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | CSS Grid organise des éléments sur une grille à deux dimensions (lignes ET colonnes), contrairement à Flexbox (un seul axe). L'unité `fr` répartit l'espace restant ; `grid-template-areas` nomme visuellement chaque zone. |
| **Outils utilisables** | `display: grid`, `grid-template-columns`/`rows`, `fr`, `repeat()`, `grid-template-areas`, `grid-column`/`grid-row`. |
| **Pièges à éviter** | Utiliser Flexbox pour une mise en page qui a réellement besoin de deux dimensions : le résultat devient vite un empilement de contournements. |
| **Bonnes pratiques** | `repeat(auto-fit, minmax(...))` pour une grille responsive sans écrire de media query ; `grid-template-areas` pour une structure de page lisible directement dans le CSS. |
