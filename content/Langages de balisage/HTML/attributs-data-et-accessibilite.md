---
order: 7
---

# Attributs data-* et accessibilité (ARIA)

Ce chapitre couvre deux familles d'attributs transversales, utilisables sur presque n'importe quelle balise : les attributs `data-*` (stocker une donnée personnalisée) et les attributs `aria-*` (améliorer l'accessibilité au-delà de ce que la sémantique HTML5 seule permet).

## Les attributs `data-*`

```html
<div data-id="42" data-role="carte-produit" data-en-stock="true">
    Chaise en bois
</div>
```

```javascript
const carte = document.querySelector("div");
carte.dataset.id;         // "42"
carte.dataset.role;         // "carte-produit"
carte.dataset.enStock;       // "true" -> "data-en-stock" devient "enStock" en camelCase côté JS
```

`data-*` permet d'attacher une donnée à un élément HTML, récupérable en JavaScript via `.dataset` — un moyen standard de faire circuler une information du HTML vers le JavaScript, sans avoir besoin de variables globales ou de requêtes supplémentaires.

> **Note :** n'importe quel nom après `data-` est valide (`data-nimporte-quoi`) — la seule règle est la conversion automatique **kebab-case** (mots séparés par des tirets, `data-en-stock`) vers **camelCase** (chaque mot suivant collé et capitalisé, `enStock`) en JavaScript — une simple convention de nommage, pas un mécanisme propre à `data-*`.

## L'accessibilité : pourquoi ça compte

L'accessibilité web garantit qu'une page reste utilisable par des personnes en situation de handicap (déficience visuelle avec un lecteur d'écran, motrice en naviguant uniquement au clavier...) — pas une option secondaire, mais une exigence légale dans de nombreux contextes (sites publics notamment), et une bonne pratique générale de qualité de code.

## `alt` et sémantique : les fondations déjà vues

Une bonne partie de l'accessibilité découle directement des chapitres précédents : `alt` sur les images, `<label>` sur les champs de formulaire, hiérarchie correcte des titres, balises sémantiques HTML5 plutôt que des `<div>` génériques.

## ARIA : compléter quand la sémantique HTML seule ne suffit pas

**ARIA** (*Accessible Rich Internet Applications*) ajoute des informations d'accessibilité pour des composants que le HTML natif ne décrit pas nativement (un onglet personnalisé, une fenêtre modale...) :

```html
<button aria-label="Fermer la fenêtre">✕</button>
```

`aria-label` fournit un texte alternatif pour un lecteur d'écran, quand le contenu visible seul (ici, juste un symbole `✕`) ne suffit pas à en comprendre le rôle.

```html
<div role="alert">Votre session va expirer dans 2 minutes.</div>
```

`role="alert"` fait annoncer immédiatement ce contenu par un lecteur d'écran dès son apparition, sans attendre que l'utilisateur navigue jusqu'à lui — utile pour un message d'erreur ou une notification urgente apparue dynamiquement.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` indique si un élément contrôlé (souvent via JavaScript) est actuellement ouvert ou fermé — un lecteur d'écran annonce cet état, invisible autrement pour quelqu'un qui ne voit pas le changement visuel.

> **Règle d'or ARIA :** "*No ARIA is better than bad ARIA*" — n'utiliser ARIA que pour combler un manque réel de la sémantique HTML native, jamais en remplacement d'une balise HTML qui ferait déjà le travail correctement. Un `<button>` natif gère déjà nativement le focus clavier et l'annonce de son rôle — recréer ce comportement à la main avec un `<div role="button">` est presque toujours une régression, sauf nécessité absolue.

## Navigation au clavier

```html
<button class="bouton-personnalise">Bouton personnalisé</button>
```

Un `<button>` natif gère déjà l'accessibilité clavier (focus via Tab, activation via Entrée/Espace) et l'annonce de son rôle par un lecteur d'écran — c'est pour ça que la « règle d'or » ci-dessus recommande de partir d'un vrai `<button>`, restylé en CSS si besoin, plutôt que de recréer un bouton à partir d'un `<div>`.

Si un cas précis empêche vraiment d'utiliser un `<button>` natif, recréer son comportement demande plus que `tabindex`/`role` seuls :

```html
<div tabindex="0" role="button" id="mon-bouton">Bouton personnalisé</div>
```

```javascript
const bouton = document.getElementById("mon-bouton");
bouton.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter" || evenement.key === " ") {
        evenement.preventDefault();
        bouton.click();   // déclenche le même comportement qu'un clic
    }
});
```

`tabindex="0"` rend l'élément focusable via Tab et `role="button"` annonce son rôle à un lecteur d'écran, mais **aucun des deux ne déclenche l'activation au clavier** (Entrée/Espace) — contrairement à un vrai `<button>`, qui le fait nativement. Sans ce gestionnaire `keydown` explicite, l'élément resterait focusable mais inutilisable au clavier : exactement le piège que la règle d'or ARIA cherche à éviter.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `data-*` attache une donnée personnalisée à un élément, récupérable en JavaScript via `.dataset`. `aria-*` complète l'accessibilité quand la sémantique HTML native ne suffit pas (composants personnalisés). |
| **Outils utilisables** | `.dataset` en JavaScript ; `aria-label`, `role`, `aria-expanded`. |
| **Pièges à éviter** | Recréer un `<div role="button">` sans gérer soi-même le focus clavier et l'activation (Entrée/Espace) — un vrai `<button>` fait tout cela nativement. |
| **Bonnes pratiques** | "No ARIA is better than bad ARIA" — n'utiliser ARIA que pour combler un manque réel, jamais en remplacement d'une balise HTML native qui ferait déjà le travail. |
