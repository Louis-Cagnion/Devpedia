---
order: 2
---

# Les balises de texte

Le contenu textuel d'une page HTML s'organise autour de quelques balises fondamentales (titres, paragraphes, listes) dont le choix doit toujours refléter le **sens** du contenu, pas seulement l'apparence visuelle souhaitée (l'apparence relève de [CSS](/?c=langages-de-balisage&s=css&p=css)).

## Les titres

```html
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<h3>Sous-sous-titre</h3>
```

De `<h1>` (le plus important) à `<h6>` (le moins important). Une page ne devrait contenir qu'**un seul** `<h1>` (le titre principal de la page), et les niveaux ne devraient jamais être "sautés" pour un simple effet visuel (`<h1>` suivi directement de `<h4>`) : la hiérarchie des titres est utilisée par les lecteurs d'écran pour naviguer dans la page (voir [Attributs data-* et accessibilité](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)), pas seulement pour la taille du texte.

## Les paragraphes

```html
<p>Un paragraphe de texte.</p>
```

## Les listes

```html
<ul>
    <li>Pomme</li>
    <li>Banane</li>
</ul>

<ol>
    <li>Première étape</li>
    <li>Deuxième étape</li>
</ol>
```

`<ul>` (*unordered list*) pour une liste sans ordre significatif, `<ol>` (*ordered list*) quand l'ordre compte (une procédure, un classement...) : le navigateur numérote automatiquement les `<li>` d'un `<ol>`.

## Mise en emphase du texte

```html
<strong>Texte important</strong>
<em>Texte en emphase</em>
```

> **Note :** `<strong>`/`<em>` expriment une importance **sémantique** (comprise par un lecteur d'écran, qui peut par exemple accentuer vocalement ce texte), contrairement à `<b>`/`<i>` (gras/italique purement visuels, sans signification). Privilégier `<strong>`/`<em>` par défaut, et réserver `<b>`/`<i>` aux cas où seul l'aspect visuel est recherché, sans intention de sens (ex: un nom d'espèce en latin, conventionnellement en italique).

## Sauts de ligne et séparateurs

```html
<br>       <!-- saut de ligne, à l'intérieur d'un même bloc de texte -->
<hr>       <!-- ligne horizontale, séparation thématique entre deux sections -->
```

> **Note :** `<br>` ne doit pas être utilisé pour créer un espacement visuel entre deux paragraphes : c'est le rôle de CSS (`margin`, voir [Le modèle de boîte](/?c=langages-de-balisage&s=css&p=box-model)). Un usage répété de `<br><br>` pour "faire de l'espace" est un signe qu'on utilise HTML pour de la présentation, alors que ce n'est pas sa responsabilité.

## Citations

```html
<blockquote cite="https://source.com">
    <p>Une citation longue, généralement mise en retrait visuellement.</p>
</blockquote>

<p>Comme le disait <q>une citation courte, intégrée dans une phrase</q>.</p>
```

Voir aussi [La sémantique HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5) pour les balises qui structurent des sections entières de contenu, au-delà du texte lui-même.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le choix d'une balise de texte doit refléter le sens du contenu (titre, paragraphe, liste, emphase), jamais seulement l'apparence visuelle souhaitée : l'apparence relève de CSS. |
| **Outils utilisables** | `<h1>`-`<h6>`, `<p>`, `<ul>`/`<ol>`/`<li>`, `<strong>`/`<em>`, `<blockquote>`/`<q>`. |
| **Pièges à éviter** | Sauter des niveaux de titre pour un effet visuel (`<h1>` suivi de `<h4>`) ; utiliser `<b>`/`<i>` (purement visuels) là où `<strong>`/`<em>` (sens) conviendraient mieux ; enchaîner des `<br>` pour créer de l'espacement. |
| **Bonnes pratiques** | Une seule balise `<h1>` par page ; préférer `<strong>`/`<em>` par défaut, réserver `<b>`/`<i>` aux cas purement visuels sans intention de sens. |
