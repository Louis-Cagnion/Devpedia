---
order: 3
---

# Les liens et les images

Les liens (`<a>`) et les images (`<img>`) sont deux balises fondamentales du web : l'une relie des documents entre eux (l'origine même du mot "*hypertexte*"), l'autre insère un contenu visuel.

## Les liens

```html
<a href="https://exemple.com">Lien externe</a>
<a href="/contact">Lien relatif, vers une autre page du même site</a>
<a href="#section2">Lien vers une ancre, dans la même page</a>
<a href="mailto:contact@exemple.com">Lien qui ouvre le client mail</a>
<a href="tel:+33612345678">Lien qui propose d'appeler un numéro</a>
```

### L'attribut `target`

```html
<a href="https://exemple.com" target="_blank" rel="noopener noreferrer">Ouvre dans un nouvel onglet</a>
```

> **Note :** `target="_blank"` sans `rel="noopener"` laisse la nouvelle page ouverte accéder (via JavaScript) à l'objet `window` de la page d'origine : un risque de sécurité mineur mais réel (*tabnabbing*). `noopener` (et `noreferrer`, qui empêche en plus l'envoi de l'URL d'origine) doivent accompagner systématiquement tout `target="_blank"`.

### Liens relatifs vs absolus

```html
<a href="https://exemple.com/page">Absolu : toujours la même destination, quel que soit le site</a>
<a href="/page">Relatif à la racine : dépend du domaine actuel</a>
<a href="page">Relatif au dossier courant : dépend de l'URL actuelle</a>
```

## Les images

```html
<img src="photo.jpg" alt="Un chat noir assis sur un canapé" width="600" height="400">
```

- `src` : le chemin (relatif ou absolu, même logique que pour un lien) vers le fichier image.
- `alt` : un texte alternatif, affiché si l'image ne charge pas, et lu par un lecteur d'écran : **jamais optionnel** d'un point de vue accessibilité (voir [Attributs data-* et accessibilité](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)). Une image purement décorative (sans information propre) doit avoir `alt=""` (vide, mais présent), pour que le lecteur d'écran la saute silencieusement plutôt que d'annoncer un nom de fichier sans intérêt.
- `width`/`height` : dimensions déclarées à l'avance, qui permettent au navigateur de réserver l'espace nécessaire **avant** que l'image ne soit chargée : évite un décalage visuel du reste de la page pendant le chargement (*layout shift*).

## Images responsives (`srcset`)

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Un chat noir assis sur un canapé"
>
```

Le navigateur choisit **lui-même** la version la plus adaptée à la taille réelle d'affichage et à la résolution de l'écran, parmi celles proposées : évite de forcer un mobile à télécharger une image pensée pour un grand écran.

## Images comme liens

```html
<a href="/produit/42">
    <img src="produit.jpg" alt="Chaise en bois, vue de face">
</a>
```

Une image peut être placée à l'intérieur d'un `<a>`, la rendant elle-même cliquable : le `alt` reste alors indispensable, puisque c'est lui qui décrit la **destination** du lien pour un lecteur d'écran, pas seulement le contenu visuel de l'image.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `<a>` relie des documents (externe, relatif, ancre, mail, tel) ; `<img>` insère une image. `alt` décrit une image pour un lecteur d'écran ou en cas d'échec de chargement : jamais optionnel. |
| **Outils utilisables** | `srcset`/`sizes` pour des images responsives ; `width`/`height` pour réserver l'espace avant chargement. |
| **Pièges à éviter** | `target="_blank"` sans `rel="noopener"` (risque de sécurité, *tabnabbing*) ; une image sans `alt` (ni vide pour une image décorative, ni renseigné pour une image porteuse de sens). |
| **Bonnes pratiques** | Toujours accompagner `target="_blank"` de `rel="noopener noreferrer"` ; déclarer `width`/`height` pour éviter un décalage visuel (*layout shift*) au chargement. |
