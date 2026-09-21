---
order: 19
---

# Canvas 2D et animations

L'élément [HTML](/?c=langages&s=html&p=html) `<canvas>` expose une zone de dessin programmable, pixel par pixel, directement en JavaScript. Ce chapitre couvre son usage pour une animation fluide (boucle de rendu, adaptation à la définition de l'écran) et un usage moins évident : mesurer du texte sans jamais l'afficher.

## Obtenir un contexte de dessin

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');   // "2d" : dessin 2D classique (par opposition à "webgl")

ctx.fillStyle = 'rgba(2,96,231,0.5)';
ctx.fillRect(10, 10, 100, 50);         // rectangle plein : x, y, largeur, hauteur
```

## Adapter le dessin à la définition réelle de l'écran

Un pixel CSS (la taille affichée) ne correspond pas toujours à un pixel physique de l'écran : un écran à haute densité (Retina, par exemple) en affiche plusieurs par pixel CSS. `window.devicePixelRatio` donne ce facteur, à appliquer pour un rendu net :

```javascript
function redimensionner() {
    // plafonne à 2 : au-delà, coût inutile
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    // résolution RÉELLE du canvas (pixels physiques)
    canvas.width  = Math.floor(rect.width  * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    // pour dessiner ensuite en coordonnées CSS
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
```

`canvas.width`/`canvas.height` (la résolution interne, en pixels physiques) sont volontairement distincts de la taille CSS affichée (`rect.width`/`rect.height`) : sans ce facteur, le canvas resterait net sur un écran standard mais flou sur un écran haute densité, ses pixels internes étant étirés pour remplir une zone plus grande physiquement.

`ctx.setTransform(ratio, 0, 0, ratio, 0, 0)` compense ensuite cet écart : tout le code de dessin qui suit peut continuer à raisonner en coordonnées CSS normales (`fillRect(10, 10, ...)`), sans jamais multiplier manuellement chaque coordonnée par `ratio`.

> **Piège :** plafonner `devicePixelRatio` (ici à 2) n'est pas une erreur d'arrondi mais un choix délibéré : au-delà, le gain visuel devient imperceptible alors que le nombre de pixels à calculer continue de croître au carré, un coût réel sans bénéfice visible.

## La boucle d'animation : `requestAnimationFrame`

`requestAnimationFrame(callback)` demande au navigateur d'appeler `callback` juste avant le prochain rafraîchissement d'écran (généralement 60 fois par seconde), plutôt qu'à un intervalle fixe comme `setInterval` :

```javascript
function frame(maintenant) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // efface l'image précédente
    dessinerLaScene(maintenant);
    requestAnimationFrame(frame);                        // reprogramme le prochain appel
}
requestAnimationFrame(frame);
```

`maintenant` (fourni automatiquement par le navigateur, en millisecondes) permet de baser l'animation sur le **temps réel écoulé** plutôt que sur le nombre d'appels : une animation qui avance d'un pas fixe à chaque appel de `frame` irait plus vite sur un écran 144Hz que sur un écran 60Hz, alors qu'une animation basée sur `maintenant` reste à la même vitesse perçue, quel que soit le taux de rafraîchissement.

> **Bonne pratique :** préférer `requestAnimationFrame` à `setInterval` pour toute animation visuelle. Le navigateur peut synchroniser l'appel avec son propre rafraîchissement d'écran (image plus fluide) et suspend automatiquement les appels d'un onglet non visible (économie de ressources), ce qu'un `setInterval` ne fait jamais de lui-même.

## Le lissage exponentiel : suivre une cible sans à-coups

Faire suivre un élément (un curseur animé, une caméra) vers une position cible, image après image, sans qu'il "saute" brutalement à chaque changement de cible, utilise souvent un **lissage exponentiel** (*exponential smoothing*, aussi appelé *lerp* dans ce contexte) :

```javascript
let x = positionInitiale;

function frame() {
    const cible = calculerNouvelleCible();
    x += (cible - x) * 0.04;   // avance de 4% de la distance restante à chaque image
    dessinerA(x);
    requestAnimationFrame(frame);
}
```

À chaque image, la position ne saute jamais directement à la cible : elle avance seulement d'une fraction (ici 4%) de la distance qui l'en sépare encore. L'effet perçu est un mouvement qui ralentit naturellement en approchant de sa cible, plutôt qu'un arrêt brutal.

| Facteur | Effet |
|---|---|
| Proche de 0 (ex. 0.01) | Suivi très lent, effet "inertie" prononcé |
| Proche de 1 (ex. 0.5) | Suivi presque instantané, peu de lissage perceptible |

## Mesurer du texte sans jamais l'afficher : `measureText()`

Un canvas 2D sert aussi, de façon détournée, à mesurer précisément la largeur qu'occuperait un texte avec une police donnée, **sans jamais dessiner ni afficher ce canvas** :

```javascript
const ctxMesure = document.createElement('canvas').getContext('2d');   // jamais ajouté au DOM

function largeurTexte(texte, taillePolice = 11) {
    ctxMesure.font = `${taillePolice}px sans-serif`;
    return ctxMesure.measureText(texte).width;
}
```

Ce chiffre remplace avantageusement une estimation approximative (une largeur moyenne par caractère) pour un calcul de mise en page qui dépend de la largeur réelle d'un texte (une légende qui doit savoir si elle tient sur une ligne ou doit passer à la suivante, par exemple) : `measureText()` utilise la vraie police et donne la largeur exacte que ce texte occuperait réellement à l'écran.

> **Piège :** utiliser une police différente entre `ctxMesure.font` et celle réellement affichée à l'écran (taille, famille de police). La mesure ne serait alors plus fidèle à ce qui s'affiche réellement, ce qui peut réintroduire l'imprécision que `measureText()` était censé éliminer.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `devicePixelRatio` adapte un canvas à la définition réelle de l'écran. `requestAnimationFrame` synchronise une animation au rafraîchissement de l'écran et fournit un timestamp pour une vitesse indépendante du taux de rafraîchissement. Le lissage exponentiel fait suivre une cible sans à-coups. `measureText()` sur un canvas jamais affiché mesure un texte avec précision, sans l'afficher. |
| **Outils utilisables** | `getContext('2d')`, `devicePixelRatio`/`setTransform`, `requestAnimationFrame`, `measureText()`. |
| **Pièges à éviter** | Ignorer `devicePixelRatio` (rendu flou sur écran haute densité). Animer par pas fixe par appel plutôt que par temps réel écoulé (vitesse dépendante du taux de rafraîchissement). Mesurer un texte avec une police différente de celle réellement affichée. |
| **Bonnes pratiques** | Plafonner `devicePixelRatio` à une valeur raisonnable (2, par exemple). Préférer `requestAnimationFrame` à `setInterval` pour toute animation visuelle. Utiliser un facteur de lissage proche de 0 pour un effet d'inertie prononcé, proche de 1 pour un suivi quasi instantané. |
