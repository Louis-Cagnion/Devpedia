---
order: 1
---

# La structure d'un document HTML

Tout document HTML repose sur un squelette minimal, quasiment identique d'une page à l'autre : comprendre chaque partie de ce squelette est le point de départ indispensable avant tout le reste.

## Le squelette minimal

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titre de la page</title>
</head>
<body>
    <h1>Bonjour</h1>
    <p>Contenu de la page.</p>
</body>
</html>
```

## Ligne par ligne

- `<!DOCTYPE html>` : indique au navigateur qu'il doit interpréter la page selon les standards HTML5 modernes (mode "*standards*"), plutôt qu'un mode de compatibilité historique ("*quirks mode*") hérité des vieux navigateurs.
- `<html lang="fr">` : la racine du document ; `lang` indique la langue principale du contenu, utilisé par les lecteurs d'écran (voir [Attributs data-* et accessibilité](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)) et les moteurs de recherche.
- `<head>` : les métadonnées de la page, jamais affichées directement dans le corps visible.
  - `<meta charset="UTF-8">` : l'encodage des caractères ; sans cette ligne (ou avec un encodage incorrect), les caractères accentués ou spéciaux peuvent s'afficher de façon corrompue.
  - `<meta name="viewport" ...>` : indispensable pour un affichage correct sur mobile ; sans elle, un navigateur mobile affiche souvent la page comme si elle était conçue pour un écran d'ordinateur, puis la réduit (zoom illisible).
  - `<title>` : le texte affiché dans l'onglet du navigateur et dans les résultats de recherche.
- `<body>` : tout le contenu réellement visible de la page.

## Balises et attributs

```html
<a href="https://exemple.com" target="_blank">Lien</a>
```

- `<a>` et `</a>` : balise ouvrante et fermante, qui délimitent un élément.
- `href`, `target` : des **attributs**, qui apportent une information supplémentaire à la balise (ici, la destination du lien et son comportement d'ouverture).

Certaines balises n'ont pas de contenu et se referment elles-mêmes, sans balise fermante séparée :

```html
<img src="photo.jpg" alt="Description de la photo">
<br>
<input type="text">
```

## L'imbrication des balises

```html
<!-- Correct : fermeture dans l'ordre inverse de l'ouverture -->
<p>Texte en <strong>gras <em>et italique</em></strong>.</p>

<!-- Incorrect : chevauchement des balises -->
<p>Texte en <strong>gras <em>et italique</strong></em>.</p>
```

Une balise ouverte en dernier doit être fermée en premier : un chevauchement, bien que souvent "toléré" silencieusement par les navigateurs, produit un résultat imprévisible et doit être évité.

## Les commentaires

```html
<!-- Ce commentaire n'est jamais affiché sur la page -->
```

Voir aussi [La sémantique HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5), qui détaille l'organisation typique du contenu à l'intérieur de `<body>`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un document HTML suit un squelette fixe (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). Les balises s'imbriquent dans l'ordre inverse de leur ouverture ; un chevauchement produit un résultat imprévisible. |
| **Outils utilisables** | `<meta charset>`, `<meta name="viewport">`, `<title>` : les métadonnées indispensables de tout document. |
| **Pièges à éviter** | Oublier `<meta name="viewport">` : la page s'affiche alors sur mobile comme pensée pour un écran d'ordinateur, puis réduite illisiblement. |
| **Bonnes pratiques** | Toujours fermer une balise ouverte, dans l'ordre inverse de l'ouverture, même quand un navigateur tolère silencieusement le contraire. |
