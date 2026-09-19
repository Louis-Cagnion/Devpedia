---
order: 2
---

# Variables CSS et la cascade

Ce chapitre couvre deux mécanismes transversaux de CSS : les **variables personnalisées** (réutiliser une valeur à plusieurs endroits), et la **cascade** (comment CSS résout un conflit entre plusieurs règles qui ciblent le même élément) : le "C" de CSS (*Cascading*) fait directement référence à ce second mécanisme.

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

`:root` cible l'élément racine du document (`<html>`) : déclarer les variables là les rend accessibles **partout** dans la feuille de style. Changer une seule fois `--couleur-primaire` met à jour instantanément tous les endroits qui l'utilisent, sans "chercher-remplacer" dans tout le fichier.

```css
.bouton {
    /* "blue" : valeur de secours si la variable n'existe pas */
    background-color: var(--couleur-primaire, blue);
}
```

## Variables locales à un composant

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    /* redéfinit la variable UNIQUEMENT pour les éléments avec cette classe supplémentaire */
    --marge-interne: 8px;
}
```

> **Note :** contrairement à une variable [Sass](https://sass-lang.com)/[Less](https://lesscss.org) (résolues une fois pour toutes à la compilation), une variable CSS native est **vivante** dans le navigateur : modifiable même en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`element.style.setProperty('--marge-interne', '30px')`), et réévaluée dynamiquement selon l'élément où elle est consultée.

## `color-mix()` : dériver une couleur à partir d'une variable, sans en déclarer une nouvelle

```css
.bouton-danger:hover {
    background-color: color-mix(in srgb, var(--couleur-danger) 85%, black);
    /* mélange 85% de --couleur-danger avec du noir : une version légèrement assombrie, au
       survol */
}
```

`color-mix(in <espace-colorimétrique>, couleur1 pourcentage1, couleur2)` mélange deux couleurs dans l'espace colorimétrique indiqué (`srgb` est le plus courant), sans avoir à calculer ni déclarer une nouvelle variable dédiée pour chaque variante (survol, désactivé, fond légèrement teinté...).

| | Sans `color-mix()` | Avec `color-mix()` |
|---|---|---|
| Une variante plus sombre au survol | Calculer/déclarer une seconde variable (`--couleur-danger-survol`) | `color-mix(in srgb, var(--couleur-danger) 85%, black)` |
| Un fond légèrement teinté | Une troisième variable dédiée, ou une couleur `rgba()` en dur | `color-mix(in srgb, var(--couleur-danger) 10%, transparent)` |

> **Bonne pratique :** utiliser `color-mix()` pour toute variante ponctuelle d'une couleur déjà déclarée en variable (plus claire, plus sombre, plus transparente), plutôt que de multiplier les variables dédiées à chaque petite variation.

## Lire une variable CSS depuis JavaScript

L'écriture ci-dessus (`setProperty`) a son inverse, la **lecture** : utile pour qu'un rendu qui ne comprend pas le CSS (dessin sur `<canvas>`, graphique en [SVG](/?c=langages-de-balisage&s=html&p=html) généré en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) reste malgré tout synchronisé avec les couleurs déclarées dans la feuille de style, sans les dupliquer en dur dans le code JS.

```javascript
const couleurPrimaire = getComputedStyle(document.documentElement)
    .getPropertyValue("--couleur-primaire")   // "#3366cc" (chaîne brute, espaces inclus)
    .trim();

console.log(couleurPrimaire || "#000000");    // valeur de secours si la variable n'existe pas
```

`getComputedStyle(element)` renvoie le style **final** appliqué à cet élément une fois la cascade résolue (voir section suivante), sous forme d'un objet consultable via `getPropertyValue()`. Contrairement à `var(--nom, secours)` en CSS, `getPropertyValue()` n'a pas de valeur de secours intégrée : elle renvoie une chaîne vide si la variable n'existe pas, à gérer soi-même (`|| "#000000"` ci-dessus).

> **Piège :** `getPropertyValue()` renvoie toujours une chaîne brute, espaces d'origine compris (`" #3366cc"` par exemple) : `.trim()` évite des comparaisons ou des concaténations silencieusement fausses à cause d'un espace invisible.

## La cascade : trois critères, dans cet ordre

Face à plusieurs règles ciblant le même élément et la même propriété, CSS les départage dans cet ordre précis :

### 1. L'importance (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignoré : la règle du dessus a !important */
```

`!important` court-circuite tout le reste de la cascade : une règle avec `!important` gagne, quelle que soit sa spécificité ou son ordre d'écriture.

> **Best practice :** éviter `!important` en usage courant : il rend le débogage difficile (impossible à surcharger simplement) et casse la logique naturelle de la cascade. À réserver à des cas très exceptionnels (souvent pour surcharger un style tiers qu'on ne contrôle pas).

### 2. La spécificité (voir [Les sélecteurs](/?c=langages-de-balisage&s=css&p=selecteurs))

```css
#bouton-principal { color: blue; }  /* spécificité : id -> plus fort */
.bouton { color: red; }             /* spécificité : classe -> plus faible */
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
    /* HÉRITÉ : tous les descendants (p, span, li...) reprennent cette couleur de texte */
    color: #333;
    border: 1px solid;  /* PAS hérité : chaque élément a sa propre bordure, ou aucune */
}
```

Les propriétés liées au **texte** (`color`, `font-family`, `font-size`, `line-height`...) sont généralement héritées par défaut ; les propriétés liées à la **boîte** (`border`, `margin`, `padding`, `background`...) ne le sont jamais : c'est un mécanisme distinct de la cascade, bien qu'il interagisse avec elle (une règle héritée a la spécificité la plus faible possible, facilement surchargée par n'importe quelle règle directement appliquée à l'élément).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les variables CSS (`--nom`, lues via `var()`) évitent de répéter une valeur. Face à un conflit entre règles, la cascade tranche dans l'ordre : `!important` > spécificité > ordre d'écriture. L'héritage (texte oui, boîte non) est un mécanisme distinct qui interagit avec la cascade. |
| **Outils utilisables** | `:root` pour des variables globales, `var(--nom, valeur-de-secours)`, `color-mix(in srgb, ...)` pour dériver une variante de couleur, `element.style.setProperty()` pour les modifier en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), `getComputedStyle().getPropertyValue()` pour les lire. |
| **Pièges à éviter** | Abuser de `!important` : il court-circuite toute la cascade et rend le style difficile à surcharger ensuite. Oublier `.trim()` après `getPropertyValue()` : la chaîne renvoyée garde ses espaces d'origine. |
| **Bonnes pratiques** | Réserver `!important` à des cas exceptionnels (surcharger un style tiers non contrôlé) ; définir les couleurs/espacements récurrents comme variables sur `:root` plutôt que de les répéter ; lire ces variables en JS plutôt que de dupliquer les couleurs en dur, pour qu'un rendu Canvas/SVG reste synchronisé avec la feuille de style. |
