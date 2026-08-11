---
order: 3
---

# Le modèle de boîte (box model)

Chaque élément HTML est représenté par CSS comme une boîte rectangulaire, composée de quatre couches concentriques : comprendre ce modèle est indispensable pour maîtriser tailles, espacements et alignements.

## Les quatre couches

```text
┌─────────────────────────────────┐
│              margin               │  <- espace EXTÉRIEUR, en dehors de la boîte
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- bordure visible
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espace INTÉRIEUR, entre bordure et contenu
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- le texte/image/contenu réel
│   │   │   └───────────┘   │   │   │
│   │   └───────────────────┘   │   │
│   └───────────────────────────┘   │
└─────────────────────────────────┘
```

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
    margin: 10px;
}
```

- **content** : le contenu réel (texte, image...).
- **padding** : espace entre le contenu et la bordure, fait partie de l'élément lui-même (même couleur de fond que le contenu).
- **border** : la bordure visible.
- **margin** : espace en dehors de la bordure, qui sépare cet élément des autres, jamais coloré, toujours transparent.

## Le piège classique : `width` n'inclut pas tout, par défaut

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur RÉELLEMENT occupée à l'écran : 300 + 20+20 (padding) + 2+2 (border) = 344px, PAS 300px ! */
```

> **Note :** par défaut (`box-sizing: content-box`), `width` ne définit que la taille du **contenu** : `padding` et `border` s'ajoutent par-dessus, agrandissant la boîte réellement affichée au-delà de la valeur déclarée. C'est une source très fréquente de mises en page qui "débordent" de façon inattendue.

## `box-sizing: border-box` : la solution quasi universelle

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur réelle : exactement 300px -> padding et border sont maintenant INCLUS dans cette valeur */
```

`border-box` fait que `width`/`height` désignent la taille **totale** de la boîte (bordure comprise), le `padding` "grignotant" l'espace du contenu plutôt que de s'ajouter par-dessus, un comportement bien plus prévisible, devenu la convention de facto dans la quasi-totalité des projets modernes (souvent appliqué globalement avec `* { box-sizing: border-box; }`).

## Les raccourcis d'écriture

```css
/* Quatre valeurs : haut droite bas gauche (sens horaire) */
margin: 10px 20px 30px 40px;

/* Deux valeurs : haut/bas puis gauche/droite */
margin: 10px 20px;

/* Une valeur : les quatre côtés identiques */
margin: 10px;

/* Cibler un seul côté */
margin-top: 10px;
padding-left: 20px;
```

## Les marges qui fusionnent (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Note :** entre deux éléments **en flux normal** (pas en [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)), les marges verticales adjacentes ne s'additionnent **pas** : seule la plus grande des deux s'applique (ici, `30px`, pas `50px`). Ce comportement, souvent surprenant au premier abord, ne s'applique qu'aux marges verticales, jamais horizontales, et disparaît entièrement dans un conteneur Flexbox ou Grid.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque élément est une boîte à 4 couches concentriques : content, padding, border, margin. Par défaut, `width` ne définit que le contenu (`padding`/`border` s'ajoutent) ; `box-sizing: border-box` inclut tout dans la valeur déclarée. |
| **Outils utilisables** | `box-sizing: border-box` (souvent appliqué globalement), les raccourcis `margin`/`padding` à 1, 2 ou 4 valeurs. |
| **Pièges à éviter** | Oublier que `width` n'inclut pas `padding`/`border` par défaut : une boîte de "300px" peut en occuper 344 à l'écran. |
| **Bonnes pratiques** | Appliquer `* { box-sizing: border-box; }` globalement en début de projet : comportement plus prévisible, devenu la convention de facto. |
