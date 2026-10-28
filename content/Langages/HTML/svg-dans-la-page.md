---
order: 9
---

# Le SVG écrit directement dans la page

Un **SVG** (*Scalable Vector Graphics*, « graphique vectoriel redimensionnable ») est une image que l'on **décrit avec des formes** (un rectangle ici, un cercle là, un trait entre deux points) au lieu de la fabriquer avec des points colorés. Le navigateur (le logiciel qui affiche les pages web) redessine ces formes à la taille voulue : l'image reste nette de l'icône minuscule jusqu'à l'affiche géante. Ce chapitre montre comment écrire un SVG **dans le code de la page**, le dessiner avec les formes de base, y placer du texte, l'animer, le rendre accessible et réagir aux clics.

Il suppose connus [les balises et les attributs HTML](/?c=langages&s=html&p=structure-dun-document) (une balise est un mot entre `<` et `>` qui crée un élément ; un attribut est un réglage écrit dans la balise ouvrante, sous la forme `nom="valeur"`), [la syntaxe d'une règle CSS](/?c=langages&s=css&p=selecteurs), et, pour les exemples en JavaScript, [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) et [les fonctions](/?c=langages&s=javascript&p=fonctions).

## Image vectorielle ou image en pixels

Un **pixel** est le plus petit point d'un écran. Une image JPEG ou PNG (deux formats de fichier d'image ; on parle d'image **matricielle**) mémorise la couleur de chaque pixel : agrandie, elle devient floue ou en marches d'escalier. Une image **vectorielle** mémorise des instructions de dessin : agrandie, le navigateur recalcule le dessin, qui reste net.

| | Image matricielle (PNG, JPEG) | Image vectorielle (SVG) |
|---|---|---|
| Ce qui est stocké | La couleur de chaque pixel | Des formes et leurs coordonnées |
| Agrandie | Floue | Nette |
| Poids | Grandit avec le nombre de pixels | Grandit avec le nombre de formes |
| Idéale pour | Photographies, textures | Icônes, logos, schémas, graphiques |
| Modifiable par CSS ou JavaScript | Non | Oui (si le SVG est dans la page) |

Un SVG peut arriver dans la page de plusieurs façons :

| Méthode | Écriture | Ce que la page peut en faire |
|---|---|---|
| Fichier chargé par `<img>` | `<img src="logo.svg" alt="Logo">` (voir [les images](/?c=langages&s=html&p=liens-et-images)) | Pas de style ni de script depuis la page ; le navigateur le garde en **cache** (une copie conservée pour ne pas le retélécharger) |
| Image de fond CSS | `background-image: url(logo.svg)` | Idem : une image figée |
| **Écrit dans la page** | Une balise `<svg>` dans le HTML | Chaque forme est un élément du [DOM](/?c=langages&s=javascript&p=dom-et-evenements) : stylable en CSS, modifiable en JavaScript, animable, avec un texte lisible par un [lecteur d'écran](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier) |
| `<canvas>` | Voir [Canvas 2D](/?c=langages&s=javascript&p=canvas-2d-et-animations) | Un dessin en pixels : plus rapide pour des milliers d'éléments, mais aucune forme n'existe plus une fois dessinée |

Écrire le SVG dans la page évite aussi une **requête** (une demande de fichier envoyée au serveur, voir [l'API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). Le prix à payer : le code de l'image alourdit le HTML et n'est pas mis en cache à part. On le réserve donc aux icônes, schémas et graphiques que la page doit styler, animer ou lire par script.

## Un premier SVG

```html
<!-- width et height : la taille d'affichage, en pixels (200 de large, 100 de haut) -->
<!-- viewBox : l'espace de dessin interne (expliqué dans la section suivante) -->
<svg width="200" height="100" viewBox="0 0 200 100">
    <!-- rect : un rectangle ; x et y : son coin en haut à gauche ; fill : sa couleur -->
    <rect x="0" y="0" width="200" height="100" fill="#e8eefc"/>
    <!-- circle : un cercle ; cx et cy : son centre ; r : son rayon (moitié du diamètre) -->
    <circle cx="100" cy="50" r="30" fill="#1a4fd6"/>
</svg>
```

Le rectangle couvre toute la surface (de 0 à 200 en largeur, de 0 à 100 en hauteur) en bleu très clair ; le disque bleu foncé est centré au point (100, 50), donc il occupe de 70 à 130 en largeur et de 20 à 80 en hauteur. Le `/>` à la fin d'une balise la ferme sur elle-même, comme pour `<img>`, puisqu'une forme n'a pas de contenu.

Dans une page HTML, aucun réglage supplémentaire n'est nécessaire. Un fichier `.svg` autonome exige en revanche l'attribut `xmlns="http://www.w3.org/2000/svg"` sur `<svg>` (une adresse qui nomme le vocabulaire SVG), expliqué dans [les pièges](#les-pieges).

## `viewBox` : le système de coordonnées

Pour placer une forme, il faut un repère. Celui du SVG part du **coin en haut à gauche**, au point (0, 0). La coordonnée `x` grandit vers la droite, et la coordonnée `y` grandit **vers le bas** (l'inverse d'un graphique de mathématiques).

```
(0,0) ---------- x croît vers la droite --------->
  |
  |        (70,20)          (130,20)
  |           +-----------------+
  |           |                 |       carré qui contient
  y croît     |     (100,50)    |       le cercle : son centre
  vers le     |                 |       est en (100,50)
  bas         +-----------------+
  |        (70,80)          (130,80)
  v
```

L'attribut `viewBox` règle cet espace de dessin. Il contient quatre nombres : `min-x min-y largeur hauteur`, c'est-à-dire le coin en haut à gauche de la zone visible puis ses dimensions, dans des **unités utilisateur** (les unités propres au dessin, sans lien fixe avec les pixels). Le navigateur étire cet espace pour qu'il remplisse la taille d'affichage `width` × `height`. Cet étirement s'appelle la **mise à l'échelle**.

```html
<!-- Même dessin (cercle de rayon 20 centré en 50,25) dans un espace de 100 x 50 -->
<!-- Affiché en 100 x 50 pixels : une unité = 1 pixel (échelle 1) -->
<svg width="100" height="50" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>

<!-- Affiché en 400 x 200 pixels : une unité = 4 pixels (échelle 4), même dessin, net -->
<svg width="400" height="200" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>
```

| `viewBox` | `width` × `height` | Échelle | Conséquence |
|---|---|---|---|
| `0 0 100 50` | 100 × 50 | 1 | 1 unité = 1 pixel |
| `0 0 100 50` | 400 × 200 | 4 | Le dessin est agrandi 4 fois, sans perte de netteté |
| `0 0 200 100` | 100 × 50 | 0,5 | Le dessin est réduit de moitié |
| Absent | 100 × 50 | 1, fixe | Aucune mise à l'échelle : le SVG ne s'adapte plus à une autre taille |
| `10 10 50 50` | 100 × 100 | 2 | On ne voit que le carré de 50 × 50 qui commence en (10, 10) : le reste du dessin est coupé |

Si les proportions de la `viewBox` et de `width` × `height` diffèrent, l'attribut `preserveAspectRatio` choisit la suite. Sa valeur par défaut (`xMidYMid meet`) garde les proportions du dessin et le centre dans la zone, quitte à laisser des bandes vides ; la liste des valeurs est dans la [page MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio).

Pour qu'un SVG s'adapte à son conteneur (écran de téléphone ou d'ordinateur, voir [le responsive](/?c=langages&s=css&p=responsive-et-media-queries)), on garde la `viewBox` et on règle la taille en CSS :

```css
.schema {
    width: 100%;        /* occupe toute la largeur de son conteneur */
    max-width: 400px;   /* sans dépasser 400 pixels */
    height: auto;       /* la hauteur suit les proportions de la viewBox */
}
```

## Les formes de base

```html
<!-- viewBox 0 0 400 200 : un espace de dessin de 400 unités sur 200 -->
<svg viewBox="0 0 400 200" width="400" height="200">
    <!-- rect : coin (10,10), 80 de large, 60 de haut ; rx : coins arrondis de 8 -->
    <rect x="10" y="10" width="80" height="60" rx="8" fill="#1a4fd6"/>
    <!-- circle : centre (140,40), rayon 30 : il va de x=110 à x=170 -->
    <circle cx="140" cy="40" r="30" fill="#c0392b"/>
    <!-- ellipse : un cercle aplati ; rx : rayon horizontal 45 ; ry : rayon vertical 25 -->
    <ellipse cx="230" cy="40" rx="45" ry="25" fill="#2e8b57"/>
    <!-- line : segment de (300,10) à (380,70) ; stroke : couleur du trait -->
    <!-- sans stroke, une ligne est invisible ; stroke-width : épaisseur du trait -->
    <line x1="300" y1="10" x2="380" y2="70" stroke="#333" stroke-width="4"/>
    <!-- polyline : des segments reliant les points listés, sans refermer la forme -->
    <!-- fill="none" : pas de remplissage, seulement le trait -->
    <polyline points="10,150 40,100 70,150 100,100 130,150"
              fill="none" stroke="#1a4fd6" stroke-width="4"/>
    <!-- polygon : comme polyline, mais le dernier point se relie au premier -->
    <polygon points="170,150 200,100 230,150" fill="#e0a800"/>
</svg>
```

| Forme | Attributs principaux | Ce qu'ils règlent |
|---|---|---|
| `rect` | `x`, `y`, `width`, `height`, `rx`, `ry` | Coin en haut à gauche, dimensions, arrondi des coins |
| `circle` | `cx`, `cy`, `r` | Centre et rayon |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | Centre, rayon horizontal, rayon vertical |
| `line` | `x1`, `y1`, `x2`, `y2` | Point de départ et point d'arrivée |
| `polyline` | `points` | Liste de points `x,y` reliés par des segments, forme ouverte |
| `polygon` | `points` | Liste de points `x,y` reliés, forme refermée automatiquement |
| `path` | `d` | Un tracé quelconque, décrit par des commandes (section suivante) |

Dans `points`, chaque point s'écrit `x,y` et les points se séparent par des espaces. Le triangle de l'exemple a ses sommets en (170, 150), (200, 100) et (230, 150).

## Remplir et contourner : `fill` et `stroke`

Toute forme se dessine avec un **remplissage** (l'intérieur, réglé par `fill`) et un **contour** (le trait qui suit le bord, réglé par `stroke`). Par défaut, le remplissage est **noir** et il n'y a **aucun contour** : c'est pourquoi une `line` sans `stroke` reste invisible (elle n'a pas d'intérieur à remplir). Le contour est centré sur le bord : la moitié de son épaisseur dépasse vers l'extérieur, l'autre moitié mord vers l'intérieur.

Ces réglages sont des **attributs de présentation** : des attributs dont le nom est celui d'une propriété CSS, écrits directement dans la balise.

| Attribut | Rôle | Valeur par défaut | Exemple |
|---|---|---|---|
| `fill` | Couleur de l'intérieur (`none` : pas de remplissage) | Noir | `fill="#1a4fd6"` |
| `stroke` | Couleur du contour | Aucun | `stroke="#333"` |
| `stroke-width` | Épaisseur du contour, en unités utilisateur | `1` | `stroke-width="4"` |
| `stroke-linecap` | Forme des extrémités d'un trait : `butt` (coupe nette), `round` (arrondi), `square` (carré) | `butt` | `stroke-linecap="round"` |
| `stroke-linejoin` | Forme des coins entre deux segments : `miter` (pointu), `round`, `bevel` (coupé) | `miter` | `stroke-linejoin="round"` |
| `stroke-dasharray` | Trait en pointillés : longueurs alternées de trait et de vide | Trait plein | `stroke-dasharray="10 5"` : 10 de trait, 5 de vide |
| `stroke-dashoffset` | Décalage du début des pointillés | `0` | `stroke-dashoffset="5"` |
| `opacity` | Transparence de toute la forme, de `0` (invisible) à `1` | `1` | `opacity="0.5"` |
| `fill-opacity` | Transparence du remplissage seul | `1` | `fill-opacity="0.3"` |

Les couleurs s'écrivent comme en CSS : nom (`red`), code hexadécimal (`#1a4fd6` : le `#` suivi de trois paires de chiffres en base 16, pour la quantité de rouge, de vert et de bleu) ou `rgb(...)`. `stroke-dasharray` et `stroke-dashoffset` servent aussi à fabriquer un anneau de progression, comme évoqué au [chapitre sur les dégradés](/?c=langages&s=css&p=degrades) ; un exemple animé est donné plus bas.

## `path` : dessiner n'importe quel tracé

Les formes de base ne suffisent pas pour une icône ou un logo. `<path>` trace une forme quelconque à partir de l'attribut `d` (pour *data*, « données »), une suite de **commandes** : une lettre suivie de nombres. On peut l'imaginer comme un crayon : la commande `M` le pose, les autres le font avancer.

| Commande | Nom | Nombres attendus | Effet |
|---|---|---|---|
| `M` | *Move to* (aller à) | `x y` | Lève le crayon et le pose en (x, y), sans tracer. Commence tout tracé |
| `L` | *Line to* (ligne vers) | `x y` | Trace un segment droit jusqu'à (x, y) |
| `H` | *Horizontal line to* | `x` | Segment horizontal jusqu'à l'abscisse `x` (`y` inchangé) |
| `V` | *Vertical line to* | `y` | Segment vertical jusqu'à l'ordonnée `y` (`x` inchangé) |
| `C` | *Curve to* (courbe vers) | `x1 y1 x2 y2 x y` | Courbe de Bézier cubique : part du point courant, finit en (x, y), guidée par deux points de contrôle (x1, y1) et (x2, y2) |
| `Z` | *Close path* (fermer) | aucun | Trace un segment droit jusqu'au point de départ du tracé et le referme |

Une **courbe de Bézier** est une courbe souple définie par ses deux extrémités et des **points de contrôle** : la courbe s'élance vers chaque point de contrôle, sans jamais le traverser, comme un fil tendu que deux aimants attirent. D'autres commandes existent (`Q`, `S`, `T` pour d'autres courbes, `A` pour un arc d'ellipse), listées dans la [page MDN du tracé](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d).

Une commande en **majuscule** utilise des coordonnées **absolues** (position dans la `viewBox`), en **minuscule** des coordonnées **relatives** (déplacement depuis le point courant) : `L 50 10` va au point (50, 10), `l 50 10` avance de 50 vers la droite et de 10 vers le bas.

```html
<svg viewBox="0 0 300 100" width="300" height="100">
    <!-- M : crayon en (10,90) ; L : vers (50,10) puis (90,90) ; Z : retour en (10,90) -->
    <path d="M 10 90 L 50 10 L 90 90 Z" fill="#1a4fd6"/>
    <!-- C : de (120,90) à (200,90), guidé par (140,10) et (180,10) -->
    <!-- fill="none" : sans remplissage ; stroke : la couleur du trait -->
    <path d="M 120 90 C 140 10, 180 10, 200 90"
          fill="none" stroke="#c0392b" stroke-width="4"/>
    <!-- h, v minuscules : relatif ; M 230 20, 50 à droite, 50 en bas, 50 à gauche, z -->
    <path d="M 230 20 h 50 v 50 h -50 z"
          fill="none" stroke="#2e8b57" stroke-width="4"/>
</svg>
```

Le premier tracé est un triangle plein de sommets (10, 90), (50, 10) et (90, 90). Le deuxième est une arche : elle part de (120, 90), monte, et redescend en (200, 90), son point le plus haut étant situé en (160, 30). Le troisième est le contour d'un carré de 50 de côté dont le coin en haut à gauche est en (230, 20) : `h 50` mène en (280, 20), `v 50` en (280, 70), `h -50` en (230, 70), et `z` le referme.

Écrire un `d` à la main n'est utile que pour des tracés simples. Pour une icône, on le copie depuis un logiciel de dessin vectoriel (qui exporte un fichier `.svg`, que l'on ouvre dans un éditeur pour en copier les balises).

## `<g>` et les transformations

`<g>` (pour *group*) regroupe plusieurs formes sans rien dessiner lui-même. Les attributs de présentation posés sur le groupe sont **hérités** par ses enfants, sauf si un enfant les redéfinit.

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- g : fill et stroke posés ici valent pour les trois cercles -->
    <g fill="#1a4fd6" stroke="#0b2a7a" stroke-width="3">
        <circle cx="40" cy="50" r="20"/>
        <circle cx="100" cy="50" r="20"/>
        <!-- Cet enfant redéfinit fill : il est rouge, mais garde le contour hérité -->
        <circle cx="160" cy="50" r="20" fill="#c0392b"/>
    </g>
</svg>
```

L'attribut `transform` déplace, tourne ou agrandit tout un groupe d'un coup :

| Transformation | Écriture | Effet |
|---|---|---|
| Déplacer | `translate(tx ty)` | Décale de `tx` vers la droite et de `ty` vers le bas |
| Tourner | `rotate(angle)` ou `rotate(angle cx cy)` | Tourne de `angle` **degrés** (un tour complet = 360) dans le sens des aiguilles d'une montre, autour du point (0, 0) ou du point (cx, cy) |
| Agrandir | `scale(s)` ou `scale(sx sy)` | Multiplie les dimensions (`1` : inchangé, `0.5` : moitié) |
| Incliner | `skewX(angle)`, `skewY(angle)` | Penche le dessin horizontalement ou verticalement |

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- translate(100 50) : l'origine (0,0) du groupe se retrouve au point (100,50) -->
    <!-- rotate(45) : puis tout est tourné de 45 degrés autour de cette nouvelle origine -->
    <g transform="translate(100 50) rotate(45)">
        <!-- Carré de 40 de côté centré sur l'origine du groupe (x et y valent -20) -->
        <rect x="-20" y="-20" width="40" height="40" fill="#1a4fd6"/>
    </g>
</svg>
```

Le carré est centré en (100, 50) et, une fois tourné de 45 degrés, il se présente comme un losange dont les pointes sont à environ 28 unités du centre (la moitié de la diagonale, soit 20 × √2). Plusieurs transformations se suivent dans un même attribut, et **l'ordre compte** : chacune s'applique dans le repère déjà déplacé par les précédentes, donc `translate(100 50) rotate(45)` (tourner sur place, au point (100, 50)) n'est pas `rotate(45) translate(100 50)` (déplacer le long d'un axe déjà tourné).

## Le style : attributs, CSS, `currentColor` et variables

Une forme SVG se met en forme de trois façons. Elles se combinent, et la plus prioritaire l'emporte (voir [la cascade](/?c=langages&s=css&p=variables-et-cascade) : l'ordre des règles qui se contredisent).

| Façon | Exemple | Priorité |
|---|---|---|
| Attribut de présentation | `<circle fill="red">` | La plus faible : n'importe quelle règle CSS le remplace |
| Règle CSS d'une feuille de style | `.secteur { fill: blue; }` | Moyenne |
| Attribut `style` de la balise | `<circle style="fill: green">` | La plus forte |

Si un `<circle class="secteur" fill="red">` rencontre la règle `.secteur { fill: blue; }`, le cercle est donc bleu. Le CSS est le bon endroit pour les couleurs qui changent (survol, thème), les attributs pour le dessin lui-même. Les formes d'un SVG écrit dans la page reçoivent un style comme n'importe quel élément, y compris les [pseudo-classes](/?c=langages&s=css&p=selecteurs) comme `:hover` (le pointeur est dessus). Les propriétés, elles, changent de nom :

| En HTML | Pour une forme SVG | Remarque |
|---|---|---|
| `background-color` | `fill` | Un fond de forme est son remplissage |
| `color` (texte) | `fill` | La couleur d'un `<text>` SVG est son `fill`, pas `color` |
| `border-color`, `border-width` | `stroke`, `stroke-width` | Un contour de forme est un `stroke` |
| `margin`, `padding` | Aucun équivalent | Une forme se place par ses coordonnées |
| `z-index` | Aucun équivalent | L'ordre dans le code décide (voir [les pièges](#les-pieges)) |

Deux outils relient l'image au reste de la page :

- **`currentColor`** est un mot-clé qui signifie « la valeur actuelle de la propriété CSS `color` de l'élément ». Écrire `fill="currentColor"` fait suivre à l'icône la couleur du texte qui l'entoure.
- Une **variable CSS** (voir [les variables](/?c=langages&s=css&p=variables-et-cascade)) se lit dans un SVG écrit dans la page, comme dans le reste du document : `fill: var(--couleur-primaire)`. Un SVG chargé par `<img>` n'y a pas accès.

```css
:root {
    --couleur-primaire: #1a4fd6;       /* variable déclarée une fois pour toute la page */
}

.bouton-icone {
    color: var(--couleur-primaire);    /* couleur du texte du bouton, donc de l'icône */
}

.bouton-icone:hover {
    color: #c0392b;                    /* au survol, le texte ET l'icône passent au rouge */
}

.bouton-icone svg {
    width: 24px;                       /* l'icône s'affiche en 24 x 24 pixels */
    height: 24px;
}
```

```html
<button class="bouton-icone">
    <!-- aria-hidden="true" : cache l'icône aux lecteurs d'écran (voir plus bas) -->
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <!-- Triangle de sommets (12,3), (21,20), (3,20) -->
        <!-- fill="currentColor" : le remplissage prend la couleur du texte -->
        <path d="M 12 3 L 21 20 L 3 20 Z" fill="currentColor"/>
    </svg>
    Alerte
</button>
```

Le [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) change de couleur au survol, et son icône avec lui, sans qu'une seule règle ne cible le SVG.

## `<text>` : écrire dans une image

`<text>` affiche un texte à des **coordonnées**. Son point de référence (x, y) n'est pas le coin en haut à gauche, mais le début de la **ligne de base** : la ligne imaginaire sur laquelle reposent les lettres (les queues du « g » ou du « p » descendent en dessous).

```html
<svg viewBox="0 0 300 120" width="300" height="120">
    <!-- Repère : ligne verticale en pointillés (4 de trait, 4 de vide) à x = 150 -->
    <line x1="150" y1="0" x2="150" y2="120" stroke="#999" stroke-dasharray="4 4"/>
    <!-- text-anchor : de quel côté du point x le texte s'étend -->
    <!-- font-size : taille des lettres -->
    <text x="150" y="30" font-size="18" text-anchor="start">début</text>
    <text x="150" y="60" font-size="18" text-anchor="middle">milieu</text>
    <text x="150" y="90" font-size="18" text-anchor="end">fin</text>
</svg>
```

Les trois mots ont leur ligne de base aux hauteurs 30, 60 et 90. « début » commence à x = 150 et s'étend vers la droite, « milieu » est centré sur x = 150, « fin » se termine à x = 150.

| Attribut | Valeurs | Effet |
|---|---|---|
| `text-anchor` | `start` (défaut), `middle`, `end` | Position **horizontale** du texte par rapport à `x` |
| `dominant-baseline` | `auto` (défaut), `middle`, `central`, `hanging` | Position **verticale** du texte par rapport à `y` |
| `font-size`, `font-family`, `font-weight` | Comme en CSS | Taille, police, graisse, en attribut ou en CSS |

Pour `dominant-baseline`, `auto` aligne le bas des lettres sans queue sur `y`, `middle` aligne `y` sur le milieu de la hauteur des lettres minuscules, `central` sur le milieu de la ligne entière, et `hanging` aligne le haut du texte sur `y`. `dominant-baseline="central"` avec `text-anchor="middle"` sert à centrer un texte dans un cercle ; l'écart exact entre `middle` et `central` étant fin, on le vérifie à l'œil dans le navigateur visé.

Le texte SVG n'est **pas** du texte HTML :

| | Texte HTML (`<p>`) | Texte SVG (`<text>`) |
|---|---|---|
| Retour à la ligne automatique | Oui, selon la largeur du conteneur | **Non** : une seule ligne, qui déborde ou est coupée |
| Position | Dans le flux de la page | Aux coordonnées `x` et `y` |
| Couleur | `color` | `fill` |
| Fond, bordure, marge | Oui | Non : il faut dessiner un `<rect>` derrière |
| Taille à l'écran | Indépendante de l'image | Mise à l'échelle avec la `viewBox` : un SVG réduit à moitié affiche un texte réduit à moitié |
| Sélectionnable et recherchable | Oui | Oui, s'il reste du vrai `<text>` |

Pour écrire sur plusieurs lignes, on découpe à la main avec `<tspan>`, un morceau de texte à l'intérieur de `<text>` que l'on peut positionner à part :

```html
<svg viewBox="0 0 200 80" width="200" height="80">
    <text x="10" y="30" font-size="16">
        <!-- x="10" ramène chaque morceau au bord gauche ; dy : décalage vertical -->
        <tspan x="10">Première ligne</tspan>
        <!-- dy="1.2em" : descend de 1,2 fois la taille de la police -->
        <tspan x="10" dy="1.2em">Deuxième ligne</tspan>
    </text>
</svg>
```

L'unité `em` vaut la taille de la police en cours (voir [les unités relatives](/?c=langages&s=css&p=responsive-et-media-queries)) : `1.2em` laisse donc un interligne proportionnel au texte. Pour savoir si un texte tient dans la place disponible, `getComputedTextLength()` donne sa largeur en unités utilisateur ; l'idée est la même que `measureText()` du [chapitre sur le canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations), appliquée à un élément SVG :

```javascript
// Retrouve le texte et le rectangle qui doit lui servir de fond
const etiquette = document.getElementById("etiquette");
const fond = document.getElementById("fond-etiquette");

// getComputedTextLength() : largeur réelle du texte affiché, en unités utilisateur
const largeur = etiquette.getComputedTextLength();
// Le fond fait la largeur du texte plus 16 de marge (8 de chaque côté)
fond.setAttribute("width", largeur + 16);
```

## L'animation

Comme les formes sont des éléments du DOM, les trois grandes techniques d'animation du web s'appliquent.

### En CSS : `transition` et `@keyframes`

Les notions de [transition et de @keyframes](/?c=langages&s=css&p=animations-css-performantes) valent pour les formes SVG. Les propriétés propres au SVG (`fill`, `stroke`, `stroke-dashoffset`...) s'animent comme les autres :

```css
.secteur {
    fill: #1a4fd6;                       /* couleur de départ */
    transition: fill 0.2s ease-out;      /* animer fill sur 0,2 seconde, en freinant */
}

.secteur:hover {
    fill: #c0392b;                       /* au survol, le remplissage glisse vers le rouge */
}
```

Pour un mouvement ou un grossissement, on anime `transform`. Sur une forme **à l'intérieur** d'un SVG, un piège guette : le point autour duquel la forme tourne ou grossit (l'**origine de la transformation**, `transform-origin`) est par défaut l'origine (0, 0) du repère du SVG entier, non le centre de la forme. `transform-box: fill-box` fait calculer l'origine sur la **boîte englobante** de la forme (le plus petit rectangle qui la contient), et `transform-origin: center` la place au milieu de cette boîte ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-box)).

```css
.pulsation {
    transform-box: fill-box;             /* l'origine se mesure sur la boîte de la forme */
    transform-origin: center;            /* au centre de cette boîte */
    animation: battement 1.2s ease-in-out infinite;   /* nom, durée, courbe, répétition */
}

@keyframes battement {
    0%   { transform: scale(1); }        /* début : taille normale */
    50%  { transform: scale(1.3); }      /* à mi-parcours : 130 % */
    100% { transform: scale(1); }        /* fin : retour à la taille normale */
}
```

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- La classe pulsation applique l'animation : le disque grossit puis rétrécit -->
    <circle class="pulsation" cx="50" cy="50" r="20" fill="#c0392b"/>
</svg>
```

Un second usage classique est l'**anneau de progression**. Le tour d'un cercle (sa **circonférence**) vaut 2 × π × r, où π (≈ 3,14159) est le rapport entre le tour d'un cercle et son diamètre. Pour r = 40, cela fait environ 251,33. On règle `stroke-dasharray` sur cette valeur (un trait aussi long que le cercle, suivi d'un vide aussi long) et `stroke-dashoffset` sur la part masquée : 251,33 cache tout l'anneau, `0` l'affiche entier.

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- Anneau de fond, gris, complet -->
    <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" stroke-width="8"/>
    <!-- Anneau de progression : rotate(-90 50 50) fait partir le tracé du haut du cercle -->
    <circle id="progres" class="progres" cx="50" cy="50" r="40" fill="none"
            stroke="#1a4fd6" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="251.33" stroke-dashoffset="251.33"
            transform="rotate(-90 50 50)"/>
</svg>
<button id="avancer">Avancer à 75 %</button>
```

```css
.progres {
    transition: stroke-dashoffset 0.6s ease-out;   /* le trait se déroule en 0,6 seconde */
}
```

```javascript
// Circonférence du cercle de rayon 40 (Math.PI vaut π)
const CIRCONFERENCE = 2 * Math.PI * 40;
const progres = document.getElementById("progres");

// part : un nombre entre 0 (rien) et 1 (tout) ; la partie masquée est le reste
function afficherAvancement(part) {
    progres.style.strokeDashoffset = CIRCONFERENCE * (1 - part);
}

// Un clic sur le bouton remplit l'anneau aux trois quarts (le décalage passe à 62,83)
document.getElementById("avancer").addEventListener("click", () => {
    afficherAvancement(0.75);
});
```

L'anneau part vide : au clic, la valeur de `stroke-dashoffset` passe de 251,33 à environ 62,83 et la règle `transition` fait glisser le trait de l'une à l'autre. La transition ne démarre que si la valeur change **après** le premier affichage : c'est pourquoi l'appel est placé dans un clic.

### Avec `<animate>` (SMIL)

**SMIL** (*Synchronized Multimedia Integration Language*) est un langage d'animation écrit directement dans les balises du SVG : une balise `<animate>` placée dans la forme décrit quel attribut varie, entre quelles valeurs et pendant combien de temps.

```html
<svg viewBox="0 0 60 60" width="60" height="60">
    <circle cx="30" cy="30" r="10" fill="#1a4fd6">
        <!-- attributeName : l'attribut à animer (le rayon r) -->
        <!-- from et to : valeurs de départ et d'arrivée ; dur : durée d'un passage -->
        <!-- repeatCount="indefinite" : recommence sans fin -->
        <animate attributeName="r" from="10" to="25" dur="2s" repeatCount="indefinite"/>
    </circle>
</svg>
```

SMIL fonctionne sans CSS ni JavaScript, mais il vit à part : la [media query](/?c=langages&s=css&p=responsive-et-media-queries) `prefers-reduced-motion` (une condition qui lit un réglage de l'utilisateur, voir plus bas) ne l'arrête pas. Pour un nouveau projet, on préfère CSS et JavaScript.

### En JavaScript

On crée et modifie les formes avec les outils du [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (`getElementById`, `setAttribute`, `classList`...). Une seule différence : une forme SVG appartient à un autre **espace de noms** que le HTML. Un espace de noms XML (*XML namespace*) est un identifiant, écrit sous la forme d'une adresse web, qui dit à quel vocabulaire appartient une balise (HTML ou SVG). Pour créer une forme, on utilise donc `document.createElementNS` (le « NS » vient de *namespace*) avec l'adresse du SVG, et non `document.createElement`.

```html
<svg id="graphique" viewBox="0 0 300 100" width="300" height="100"></svg>
```

```javascript
// Adresse qui identifie le vocabulaire SVG (c'est un nom, le navigateur ne la visite pas)
const ESPACE_SVG = "http://www.w3.org/2000/svg";
const valeurs = [30, 80, 55];                       // la hauteur de chaque barre
const graphique = document.getElementById("graphique");

// forEach appelle la fonction pour chaque valeur du tableau, avec son rang (0, 1, 2)
valeurs.forEach((valeur, rang) => {
    // createElementNS : crée une vraie forme SVG (createElement : élément inconnu)
    const barre = document.createElementNS(ESPACE_SVG, "rect");
    barre.setAttribute("x", rang * 100 + 20);       // barres à x = 20, 120 et 220
    barre.setAttribute("y", 100 - valeur);          // haut de la barre (y croît vers le bas)
    barre.setAttribute("width", 60);                // 60 unités de large
    barre.setAttribute("height", valeur);           // hauteur de la barre
    barre.setAttribute("fill", "#1a4fd6");          // couleur de remplissage
    graphique.appendChild(barre);                   // l'ajoute au SVG : elle apparaît
});
```

Le résultat est formé de trois rectangles larges de 60, dont le bas touche la ligne y = 100 et dont la hauteur est 30, 80 et 55 (leur sommet est donc en y = 70, 20 et 45). Pour une animation continue, on combine ces modifications avec `requestAnimationFrame`, présenté au [chapitre sur le canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations) :

```javascript
const point = document.getElementById("point");       // un <circle id="point"> du SVG
// matchMedia teste une media query ; .matches vaut true si le réglage système est activé
const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function image(maintenant) {                          // maintenant : temps, en millisecondes
    // 1 unité toutes les 20 ms ; % (reste de la division) ramène à 0 après 260
    point.setAttribute("cx", 20 + ((maintenant / 20) % 260));
    requestAnimationFrame(image);                     // programme l'image suivante
}

if (!reduit) requestAnimationFrame(image);            // rien ne bouge si c'est refusé
```

Le point se déplace entre x = 20 et x = 280 sur une `viewBox` de 300 de large, sauf si l'utilisateur a demandé de réduire les animations.

### Respecter `prefers-reduced-motion`

Certaines personnes supportent mal le mouvement à l'écran (vertiges, nausées) : leur système d'exploitation propose un réglage « réduire les animations », que le CSS lit avec la media query `prefers-reduced-motion`, expliquée au [chapitre sur les animations](/?c=langages&s=css&p=animations-css-performantes). Le principe reste valable pour un SVG :

```css
@media (prefers-reduced-motion: reduce) {
    .pulsation {
        animation: none;            /* le disque reste immobile */
    }

    .progres {
        transition: none;           /* l'anneau passe à sa nouvelle valeur d'un coup */
    }
}
```

Pour un SVG animé par `<animate>`, il faut l'arrêter en JavaScript : l'élément `<svg>` possède une méthode `pauseAnimations()` qui fige toutes ses animations SMIL (`document.querySelector("svg").pauseAnimations()`).

## L'accessibilité

Un **lecteur d'écran** lit la page à voix haute pour les personnes aveugles ou malvoyantes (voir [ARIA et lecteurs d'écran](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). Une image n'a aucun sens pour lui sans texte : il faut donc dire ce qu'elle représente, ou lui indiquer qu'elle est décorative. Le navigateur construit en effet une liste simplifiée de la page pour ces logiciels, qui ne contient que ce que le code lui dit d'y mettre.

| Situation | Solution | Exemple |
|---|---|---|
| Image qui porte une information (graphique, schéma) | `role="img"` + `<title>` + éventuellement `<desc>` + `aria-labelledby` | Voir le code ci-dessous |
| Image décorative (ornement, icône à côté d'un texte déjà explicite) | `aria-hidden="true"` | `<svg aria-hidden="true">` |
| Icône seule dans un bouton | `aria-label` sur le bouton, `aria-hidden` sur l'icône | `<button aria-label="Fermer">` |
| Donnée complexe (graphique à plusieurs séries) | Un [tableau HTML](/?c=langages&s=html&p=tableaux) équivalent, à côté du SVG | Les valeurs lisibles ligne par ligne |

- **`role="img"`** déclare que tout le SVG est une image unique : le lecteur d'écran n'annonce pas ses formes une à une.
- **`<title>`** donne le nom court de l'image. Placé comme **premier enfant** de `<svg>`, il s'affiche aussi en infobulle (une petite étiquette au survol) dans la plupart des navigateurs. **`<desc>`** (*description*) donne une explication plus longue.
- **`aria-labelledby`** (voir [ARIA](/?c=langages&s=html&p=attributs-data-et-accessibilite)) nomme l'élément à partir d'autres éléments de la page, désignés par leur `id`. Relier explicitement le `<title>` au SVG est la pratique la plus sûre, car sa prise en charge seule n'a pas toujours été homogène selon les lecteurs d'écran.

```html
<!-- role="img" : une image unique ; aria-labelledby : son nom vient des éléments -->
<!-- dont les id sont listés : le titre et la description -->
<svg role="img" aria-labelledby="titre-ventes desc-ventes"
     viewBox="0 0 300 100" width="300" height="100">
    <!-- <title> : le nom court ; l'id permet à aria-labelledby de le retrouver -->
    <title id="titre-ventes">Ventes par trimestre</title>
    <!-- <desc> : le détail des données, pour qui ne voit pas les barres -->
    <desc id="desc-ventes">30 au premier trimestre, 80 au deuxième, 55 au troisième.</desc>
    <rect x="20" y="70" width="60" height="30" fill="#1a4fd6"/>
    <rect x="120" y="20" width="60" height="80" fill="#1a4fd6"/>
    <rect x="220" y="45" width="60" height="55" fill="#1a4fd6"/>
</svg>
```

```html
<!-- Icône décorative : aria-hidden="true" la retire de ce que lit le lecteur d'écran -->
<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1a4fd6"/>
</svg>

<!-- Bouton qui ne contient qu'une icône : son nom vient d'aria-label -->
<button aria-label="Fermer la fenêtre">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
        <path d="M 4 4 L 20 20 M 20 4 L 4 20" stroke="currentColor" stroke-width="3"/>
    </svg>
</button>
```

Reste la question du texte. Un SVG peut contenir du **vrai texte** (`<text>`) ou du texte **dessiné** (les lettres converties en tracés `path`, comme dans beaucoup de logos exportés).

| | Vrai texte (`<text>`) | Texte converti en tracés (`path`) |
|---|---|---|
| Sélectionnable et recherchable (Ctrl+F) | Oui | Non |
| Lu par un lecteur d'écran | Oui, sauf si le SVG est en `role="img"` (alors seul le `<title>` est dit) | Non : le `<title>` doit tout dire |
| Police et langue | Dépendent des polices installées | Figées, rendu identique partout |
| Traduisible, modifiable | Oui | Non |

Un graphique avec `role="img"` cache ses `<text>` internes aux lecteurs d'écran : l'information qu'ils portent doit donc figurer dans le `<title>` ou le `<desc>`, ou dans un tableau placé à côté. Les couleurs obéissent aux règles de [contraste](/?c=ui-ux&p=couleur-et-contraste), et une information ne doit jamais passer par la couleur seule (voir [l'accessibilité en UX](/?c=ui-ux&p=accessibilite-ux)).

## L'interaction : pointeur et clavier

Une forme SVG écoute les événements comme n'importe quel élément (`click`, `keydown`...). Les **événements pointeur** (*pointer events*, dont `pointerdown`, `pointermove`, `pointerenter`) regroupent souris, doigt et stylet sous un même nom : un seul code suffit pour tous les appareils ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

Quelles parties d'une forme réagissent au pointeur ? La propriété `pointer-events` le règle : elle décide quelles zones d'un élément peuvent être la cible d'un clic ou d'un survol.

| Valeur | Zone qui réagit | Cas d'usage |
|---|---|---|
| `visiblePainted` (défaut ; la valeur `auto` est équivalente) | Les parties **peintes** : remplissage si `fill` n'est pas `none`, contour si `stroke` n'est pas `none` | Comportement normal |
| `all` | Tout l'intérieur et le contour, même sans remplissage ni contour | Zone cliquable sur une forme transparente |
| `stroke` | Le contour seul | Une jauge dont seul l'anneau réagit |
| `none` | **Aucune** : le clic traverse la forme et atteint ce qui est dessous | Une légende ou un calque décoratif posé par-dessus |

Une forme avec `fill="none"` n'est donc pas cliquable en son milieu par défaut : le pointeur la traverse. D'où `pointer-events="all"` dans l'exemple suivant.

Au clavier, une forme SVG n'est **pas atteignable** par la touche Tab (voir [le focus et `tabindex`](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). `tabindex="0"` la rend focalisable, et il faut ajouter un rôle, un nom et la réaction aux touches Entrée et Espace, que le navigateur ne fournit qu'aux vrais boutons.

```html
<svg id="scene" viewBox="0 0 200 100" width="400" height="200">
    <!-- tabindex="0" : atteignable par Tab ; role="button", aria-label : annoncé bouton -->
    <!-- pointer-events="all" : tout le disque réagit, bien que fill soit none -->
    <circle id="zone" class="zone" cx="100" cy="50" r="30" fill="none"
            stroke="#1a4fd6" stroke-width="4" pointer-events="all"
            tabindex="0" role="button" aria-label="Activer la zone"/>
    <!-- pointer-events="none" : ce point suit le pointeur sans intercepter de clic -->
    <circle id="curseur" cx="0" cy="0" r="4" fill="#c0392b"
            pointer-events="none"/>
</svg>
```

```css
.zone.active {
    fill: #e8eefc;                 /* état « activé » : l'intérieur se remplit */
}

.zone:focus-visible {
    stroke: #c0392b;               /* focus au clavier : le contour change de couleur */
    stroke-width: 6;               /* et s'épaissit, pour rester bien visible */
}
```

```javascript
const scene = document.getElementById("scene");
const zone = document.getElementById("zone");
const curseur = document.getElementById("curseur");

// classList.toggle ajoute la classe « active » si elle manque, la retire sinon
function activer() {
    zone.classList.toggle("active");
}

// click couvre la souris et le doigt ; keydown ajoute le clavier
zone.addEventListener("click", activer);
zone.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter" || evenement.key === " ") {
        evenement.preventDefault();        // empêche la page de défiler sur Espace
        activer();
    }
});

// pointermove : à chaque déplacement du pointeur au-dessus du SVG
scene.addEventListener("pointermove", (evenement) => {
    // DOMPoint : un point (x, y) ; clientX et clientY : position du pointeur dans la fenêtre
    const pixel = new DOMPoint(evenement.clientX, evenement.clientY);
    // getScreenCTM() : la conversion dessin vers pixels ; inverse() : pixels vers dessin
    const local = pixel.matrixTransform(scene.getScreenCTM().inverse());
    curseur.setAttribute("cx", local.x);    // coordonnées dans la viewBox, pas en pixels
    curseur.setAttribute("cy", local.y);
});
```

Le dernier bloc illustre une subtilité due à la `viewBox` : les coordonnées du pointeur (`clientX`, `clientY`) sont en pixels de la fenêtre, alors que `cx` et `cy` sont en unités utilisateur. Un SVG affiché en 400 × 200 pour une `viewBox` de 200 × 100 double chaque valeur, d'où la conversion par `getScreenCTM()`.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Fichier `.svg` autonome sans `xmlns="http://www.w3.org/2000/svg"` | Hors d'une page HTML, le fichier est lu comme du **XML** (un langage de balisage voisin du HTML, plus strict) et le navigateur ne sait pas que les balises sont du SVG : l'image ne s'affiche pas. Dans une page HTML, l'attribut est inutile |
| `viewBox` oubliée | Le SVG garde sa taille fixe en pixels et ne s'adapte plus à son conteneur. Toujours poser une `viewBox` et régler la taille en CSS |
| `id` en double entre plusieurs SVG de la page | Un `id` doit être unique dans **toute** la page : les références comme `fill="url(#degrade)"` ou `aria-labelledby` pointent alors sur le premier élément trouvé, parfois dans un autre SVG. Préfixer les `id` de chaque SVG |
| Chercher un `z-index` | Il n'existe pas en SVG : la forme écrite en **dernier** dans le code est dessinée par-dessus les autres. Réordonner le code, ou en JavaScript `appendChild` sur la forme déjà présente la déplace à la fin |
| `width` et `height` en CSS et en attributs à la fois | La règle CSS l'emporte sur l'attribut. Choisir un seul endroit (le CSS pour un SVG adaptable) |
| `document.createElement("circle")` | Crée un élément HTML inconnu, jamais dessiné. Utiliser `createElementNS` avec l'adresse du SVG |
| `className` en JavaScript sur une forme SVG | Sur un élément SVG, elle renvoie un objet et non le texte des classes. Utiliser `classList` |
| `color`, `background`, `border`, `margin` sur une forme | Sans effet : utiliser `fill`, `stroke`, et les coordonnées |
| `line` sans `stroke`, ou `fill` oublié | Une ligne sans contour est invisible, une forme sans `fill` est noire |
| `fill="none"` et clic au milieu de la forme | Le pointeur traverse la forme. Ajouter `pointer-events="all"` |
| Texte attendu sur plusieurs lignes | `<text>` ne coupe jamais seul. Découper avec `<tspan>` ou utiliser du HTML autour du SVG |
| Texte illisible sur mobile | Il rétrécit avec le SVG. Prévoir une taille minimale ou adapter la `viewBox` |
| Rotation ou échelle d'une forme autour du mauvais point | Par défaut, l'origine est le point (0, 0) du SVG. Ajouter `transform-box: fill-box; transform-origin: center` |
| `<animate>` (SMIL) non arrêté pour `prefers-reduced-motion` | Le CSS n'a aucun effet dessus. Appeler `pauseAnimations()` ou ne pas l'employer |
| SVG informatif sans `<title>`, ou décoratif sans `aria-hidden` | Le lecteur d'écran ne dit rien d'utile ou lit des formes sans sens |
| Forme interactive sans `tabindex`, `role` et gestion des touches | Inutilisable au clavier |

Voici comment l'unicité des `id` casse un dégradé. `<defs>` est une zone où l'on déclare des éléments réutilisables, qui ne sont dessinés que lorsqu'une forme les référence ; `url(#nom)` désigne l'élément d'`id` « nom » ; `<linearGradient>` déclare un dégradé qui passe progressivement d'une couleur à l'autre (voir [les dégradés CSS](/?c=langages&s=css&p=degrades) pour l'idée) ; chaque `<stop>` fixe la couleur (`stop-color`) à une position (`offset`) entre 0 et 1.

```html
<!-- Premier SVG : un dégradé d'id « degrade », du bleu au bleu clair -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="degrade">
            <stop offset="0" stop-color="#1a4fd6"/>
            <stop offset="1" stop-color="#8fb0ff"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#degrade)"/>
</svg>

<!-- MAUVAIS : même id « degrade » : ce rectangle utilisera le premier dégradé -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="degrade">
            <stop offset="0" stop-color="#c0392b"/>
            <stop offset="1" stop-color="#f5b7b1"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#degrade)"/>
</svg>
```

Le second SVG devrait être rouge, mais son `fill="url(#degrade)"` désigne le premier élément de la page portant cet `id`, donc le dégradé bleu. La correction est de renommer les `id` : `degrade-bleu` pour l'un, `degrade-rouge` pour l'autre.

Et voici l'ordre de dessin :

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- Dessiné en premier : bleu, centré en (80,50) -->
    <circle cx="80" cy="50" r="30" fill="#1a4fd6"/>
    <!-- Dessiné ensuite : rouge, centré en (120,50), il recouvre le bleu de x = 90 à 110 -->
    <circle cx="120" cy="50" r="30" fill="#c0392b"/>
</svg>
```

Pour que le cercle bleu soit au-dessus, on le déplace **après** le rouge dans le code.

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Toujours écrire une `viewBox`, régler la taille en CSS | Le SVG s'adapte à son conteneur sans perdre en netteté |
| Écrire dans la page les SVG à styler, animer ou lire par script ; utiliser `<img>` pour une illustration fixe | Les premiers profitent du CSS et de JavaScript, les seconds sont mis en cache |
| Utiliser `fill="currentColor"` et les variables CSS pour les icônes | Une icône suit la couleur du texte et le thème de la page |
| Mettre les couleurs qui changent dans le CSS, le dessin dans les attributs | Le CSS l'emporte, et l'apparence se modifie sans toucher au dessin |
| Préfixer les `id` de chaque SVG (`degrade-bleu`, `titre-ventes`) | Les références `url(#...)` et `aria-labelledby` ne se croisent jamais |
| Animer `transform`, `opacity`, `fill`, `stroke-dashoffset` plutôt que des attributs de géométrie (`cx`, `width`) | Ces propriétés s'animent partout en CSS. Mesurer ensuite, car l'accélération par la carte graphique dépend du navigateur pour des formes à l'intérieur d'un SVG |
| Prévoir `prefers-reduced-motion` pour chaque animation, SMIL compris | Respecter les personnes sensibles au mouvement |
| `role="img"` + `<title>` (+ `<desc>`) + `aria-labelledby` pour une image informative ; `aria-hidden="true"` pour une image décorative | Le lecteur d'écran dit l'essentiel ou se tait |
| Compléter un graphique complexe par un tableau HTML | Les valeurs restent lisibles par tous |
| Garder du vrai `<text>` plutôt que des lettres converties en tracés | Texte sélectionnable, recherchable et traduisible |
| Rendre une forme interactive atteignable au clavier, avec un focus visible | Même service pour la souris, le doigt et le clavier |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un SVG décrit des formes, pas des pixels : il reste net à toute taille. Écrit dans la page, chaque forme est un élément du DOM, stylable en CSS, animable et pilotable en JavaScript. La `viewBox` définit le repère (origine en haut à gauche, `y` vers le bas) et la mise à l'échelle. Les formes de base sont `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` et `path` (commandes `M`, `L`, `C`, `Z`). `<g>` groupe et `transform` déplace, tourne ou agrandit. La couleur se règle avec `fill` et `stroke`, `currentColor` suit le texte. `<text>` se place par coordonnées, sans retour à la ligne automatique. Un SVG informatif a un `role="img"`, un `<title>` et un `aria-labelledby` ; un SVG décoratif a `aria-hidden="true"`. |
| **Pièges à éviter** | `xmlns` oublié dans un fichier autonome ; `viewBox` oubliée ; `id` en double ; chercher un `z-index` (l'ordre du code décide) ; `createElement` au lieu de `createElementNS` ; `color` ou `background` sur une forme ; `fill="none"` qui laisse passer le clic ; texte sur plusieurs lignes sans `<tspan>` ; transformation autour du mauvais point ; SMIL qui ignore `prefers-reduced-motion` ; forme cliquable mais inutilisable au clavier. |
| **Bonnes pratiques** | `viewBox` plus taille en CSS ; `currentColor` et variables CSS ; `id` préfixés ; animer `transform`, `opacity`, `fill` ou `stroke-dashoffset` ; variante `prefers-reduced-motion` ; titre et description pour une image informative, `aria-hidden` pour un ornement ; tableau HTML en complément d'un graphique ; vrai texte plutôt que texte converti en tracés ; `tabindex`, rôle et touches sur toute forme interactive. |
