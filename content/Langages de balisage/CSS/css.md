# CSS

CSS (*Cascading Style Sheets*) est le langage qui décrit l'**apparence** d'un document HTML (cf. rubrique dédiée) — couleurs, tailles, positionnement, mise en page — en séparant volontairement cette présentation de la structure (HTML) et du comportement (JavaScript).

Parmi les concepts essentiels de CSS, on retrouve notamment :

- Les sélecteurs, qui ciblent les éléments HTML à styliser
- Le modèle de boîte (*box model*), qui régit la taille et l'espacement de chaque élément
- Les systèmes de mise en page modernes : Flexbox (alignement sur un axe) et Grid (grille à deux dimensions)
- La cascade et la spécificité, qui déterminent quelle règle s'applique quand plusieurs se contredisent
- Le *responsive design*, pour qu'une page s'adapte à toutes les tailles d'écran

## La syntaxe de base

```css
selecteur {
    propriete: valeur;
    autre-propriete: autre-valeur;
}
```

```css
h1 {
    color: blue;
    font-size: 2rem;
}
```

## Lier une feuille de style à une page HTML

```html
<link rel="stylesheet" href="styles.css">
```

```html
<style>
    h1 { color: blue; }
</style>
```

```html
<h1 style="color: blue;">Titre</h1>
```

> **Note (best practice) :** un fichier `.css` externe (`<link>`) est presque toujours préférable — il est mis en cache par le navigateur, réutilisable sur plusieurs pages, et sépare clairement structure et présentation. Le style en ligne (`style="..."` directement sur une balise) a la spécificité la plus élevée (cf. chapitre sur la cascade), ce qui le rend difficile à surcharger ensuite — à réserver à des cas très ponctuels, souvent générés dynamiquement en JavaScript.
