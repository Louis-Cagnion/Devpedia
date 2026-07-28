---
title: Variables CSS et la cascade
---

Ce chapitre couvre deux mécanismes transversaux de CSS : les **variables personnalisées** (réutiliser une valeur à plusieurs endroits), et la **cascade** (comment CSS résout un conflit entre plusieurs règles qui ciblent le même élément) — le "C" de CSS (*Cascading*) fait directement référence à ce second mécanisme.

## Les variables CSS (propriétés personnalisées)

```css
:root {
    --couleur-primaire: #3366cc;
    --espacement-standard: 16px;
}

.bouton {
    background-color: var(--couleur-primaire);
    padding: var(--espacement-standard);
}
```

`:root` cible l'élément racine du document (`<html>`) — déclarer les variables là les rend accessibles **partout** dans la feuille de style. Changer une seule fois `--couleur-primaire` met à jour instantanément tous les endroits qui l'utilisent, sans "chercher-remplacer" dans tout le fichier.

```css
.bouton {
    background-color: var(--couleur-primaire, blue);   /* "blue" : valeur de secours si la variable n'existe pas */
}
```

## Variables locales à un composant

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    --marge-interne: 8px;   /* redéfinit la variable UNIQUEMENT pour les éléments avec cette classe supplémentaire */
}
```

> **Note :** contrairement à une variable Sass/Less (résolues une fois pour toutes à la compilation), une variable CSS native est **vivante** dans le navigateur — modifiable même en JavaScript (`element.style.setProperty('--marge-interne', '30px')`), et réévaluée dynamiquement selon l'élément où elle est consultée.

## La cascade : trois critères, dans cet ordre

Face à plusieurs règles ciblant le même élément et la même propriété, CSS les départage dans cet ordre précis :

### 1. L'importance (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignoré : la règle du dessus a !important */
```

`!important` court-circuite tout le reste de la cascade — une règle avec `!important` gagne, quelle que soit sa spécificité ou son ordre d'écriture.

> **Best practice :** éviter `!important` en usage courant — il rend le débogage difficile (impossible à surcharger simplement) et casse la logique naturelle de la cascade. À réserver à des cas très exceptionnels (souvent pour surcharger un style tiers qu'on ne contrôle pas).

### 2. La spécificité (cf. chapitre sur les sélecteurs)

```css
#bouton-principal { color: blue; }   /* spécificité : id -> plus fort */
.bouton { color: red; }                /* spécificité : classe -> plus faible */
```

Le sélecteur le plus spécifique gagne, indépendamment de l'ordre d'écriture dans le fichier.

### 3. L'ordre d'apparition (à spécificité égale)

```css
.bouton { color: blue; }
.bouton { color: red; }   /* GAGNE : même spécificité, mais écrite en dernier */
```

À spécificité strictement égale, la règle déclarée **en dernier** dans le fichier (ou le dernier fichier chargé) l'emporte.

## L'héritage : certaines propriétés se transmettent, d'autres non

```css
body {
    color: #333;         /* HÉRITÉ : tous les descendants (p, span, li...) reprennent cette couleur de texte */
    border: 1px solid;      /* PAS hérité : chaque élément a sa propre bordure, ou aucune */
}
```

Les propriétés liées au **texte** (`color`, `font-family`, `font-size`, `line-height`...) sont généralement héritées par défaut ; les propriétés liées à la **boîte** (`border`, `margin`, `padding`, `background`...) ne le sont jamais — c'est un mécanisme distinct de la cascade, bien qu'il interagisse avec elle (une règle héritée a la spécificité la plus faible possible, facilement surchargée par n'importe quelle règle directement appliquée à l'élément).
