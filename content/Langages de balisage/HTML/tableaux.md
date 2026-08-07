---
order: 4
---

# Les tableaux HTML

Un tableau HTML sert à représenter des données **tabulaires** (lignes/colonnes réellement liées entre elles, comme un export de base de données, voir [SQL](/?c=domain-specific-languages-dsl&p=sql)) — jamais pour mettre en page visuellement une page entière, un usage historique aujourd'hui remplacé par CSS ([Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)).

## Structure de base

```html
<table>
    <thead>
        <tr>
            <th>Nom</th>
            <th>Ville</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Jean</td>
            <td>Lyon</td>
        </tr>
        <tr>
            <td>Marie</td>
            <td>Paris</td>
        </tr>
    </tbody>
</table>
```

- `<table>` : le conteneur du tableau entier.
- `<thead>` : l'en-tête (souvent une seule ligne, les titres de colonnes).
- `<tbody>` : le corps du tableau (les données elles-mêmes).
- `<tr>` (*table row*) : une ligne.
- `<th>` (*table header*) : une cellule d'en-tête (généralement en gras par défaut, et annoncée différemment par un lecteur d'écran).
- `<td>` (*table data*) : une cellule de donnée classique.

## Fusionner des cellules

```html
<table>
    <tr>
        <td colspan="2">Fusionne 2 colonnes</td>
    </tr>
    <tr>
        <td rowspan="2">Fusionne 2 lignes</td>
        <td>Cellule normale</td>
    </tr>
    <tr>
        <td>Cellule normale</td>
    </tr>
</table>
```

`colspan` étend une cellule sur plusieurs colonnes, `rowspan` sur plusieurs lignes.

## Pied de tableau

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 lignes</td>
        </tr>
    </tfoot>
</table>
```

## Accessibilité et légende

```html
<table>
    <caption>Répartition des clients par ville</caption>
    <thead>
        <tr>
            <th scope="col">Nom</th>
            <th scope="col">Ville</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>` : un titre associé au tableau, annoncé par les lecteurs d'écran avant son contenu.
- `scope="col"` (ou `"row"`) sur un `<th>` : précise explicitement si cet en-tête s'applique à toute une colonne ou toute une ligne — indispensable pour qu'un lecteur d'écran annonce le bon en-tête en parcourant chaque cellule d'un tableau complexe.

> **Note (best practice) :** ne jamais utiliser `<table>` pour organiser la mise en page générale d'une page (menu, colonnes de contenu...) — cet usage, courant avant l'arrivée de CSS moderne, casse la sémantique du document (un lecteur d'écran annoncerait des données tabulaires là où il n'y en a pas) et rend la page difficile à rendre responsive.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `<table>` représente des données tabulaires réellement liées entre elles — jamais une mise en page générale. `<thead>`/`<tbody>`/`<tfoot>` structurent le tableau ; `colspan`/`rowspan` fusionnent des cellules. |
| **Outils utilisables** | `<caption>` (titre du tableau), `scope="col"`/`"row"` sur un `<th>` pour l'accessibilité. |
| **Pièges à éviter** | Utiliser `<table>` pour la mise en page générale d'une page — casse la sémantique et complique le responsive. |
| **Bonnes pratiques** | Toujours associer un `scope` à chaque `<th>` d'un tableau complexe, pour qu'un lecteur d'écran annonce le bon en-tête par cellule. |
