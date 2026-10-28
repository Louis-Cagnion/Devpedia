---
order: 10
---

# Les unités CSS et les fonctions de taille : de `rem` à `clamp()` (28/10/2026)

Chaque taille écrite en CSS (la largeur d'une colonne, la grosseur d'un texte, l'espace entre deux blocs) est un **nombre suivi d'une unité** : dans `16px`, 16 est le nombre et `px` l'unité. Le choix de l'unité décide de ce que devient la page quand l'écran change, quand l'utilisateur **zoome** (agrandit toute la page) ou quand il règle **la taille de police de son navigateur** (le logiciel qui affiche les pages web). Ce chapitre explique chaque unité, les fonctions qui calculent une taille (`calc()`, `min()`, `max()`, `clamp()`), le piège de `100vh` sur téléphone, puis ce qu'il faut faire pour qu'une page reste utilisable quand le texte est agrandi à 200 % ou 300 %.

| Thème | Question à laquelle il répond | Section |
|---|---|---|
| Les unités | À quoi se rapporte chaque unité (`px`, `em`, `rem`, `%`, `vw`, `ch`...) ? | [Les unités relatives](#les-unites-relatives-a-quoi-chacune-se-rapporte) |
| `em` et `rem` | Pourquoi `em` se cumule-t-il, et pourquoi `rem` respecte-t-il le réglage de l'utilisateur ? | [`em` et `rem`](#em-pratique-mais-il-se-cumule) |
| Fenêtre sur mobile | Pourquoi `100vh` dépasse-t-il de l'écran d'un téléphone ? | [Les unités de fenêtre](#les-unites-de-fenetre-sur-mobile-le-probleme-de-100vh) |
| Les fonctions | Comment calculer, plafonner ou rendre fluide une taille ? | [Les fonctions de taille](#les-fonctions-de-taille-calc-min-max-et-clamp) |
| Agrandissement | Que demande le WCAG, et comment faire tenir une page à 200 % et 300 % ? | [Agrandir le texte](#agrandir-le-texte-a-200-et-300-ce-que-demande-le-wcag) |

Il suppose connus [la syntaxe d'une règle CSS](/?c=langages&s=css&p=selecteurs) (un **sélecteur** désigne les éléments à styliser, puis des réglages s'écrivent entre accolades sous la forme `propriété: valeur;`), [le modèle de boîte](/?c=langages&s=css&p=box-model) (`width`, `padding`, `margin`) et [les variables CSS](/?c=langages&s=css&p=variables-et-cascade) (`var(--nom)` lit une valeur déclarée une fois pour toutes). Le chapitre sur [le responsive et les media queries](/?c=langages&s=css&p=responsive-et-media-queries) présente déjà `px`, `%`, `em`, `rem`, `vw` et `vh` en quelques lignes : ici, on complète sans les réexpliquer.

## Une valeur CSS : un nombre et une unité

```css
p {
    font-size: 16px;        /* font-size : la taille du texte ; valeur : 16 et l'unité px */
    margin-bottom: 1.5em;   /* margin-bottom : l'espace sous le paragraphe ; unité : em */
    width: 60%;             /* width : la largeur ; % est aussi une unité */
    line-height: 1.5;       /* line-height : la hauteur d'une ligne ; ici sans unité */
}
```

Un **pixel** est le plus petit point d'un écran. Le **pixel CSS** (`px`) est l'unité de base du CSS : ce n'est pas forcément un point physique de l'écran. Sur un écran très fin, un pixel CSS est dessiné avec plusieurs points ; et quand on zoome, le navigateur dessine chaque pixel CSS avec encore plus de points. Dans la suite, « pixel » désigne toujours le pixel CSS, sauf mention contraire.

On distingue deux familles d'unités :

| Famille | Définition | Exemples |
|---|---|---|
| **Absolue** | Vaut toujours la même longueur, quoi qu'il y ait autour | `px`, et pour l'impression `cm`, `mm`, `in` (pouce), `pt` (point) |
| **Relative** | Se calcule à partir d'une **référence** : la taille d'une police, celle du parent, celle de la fenêtre | `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`, `lh` |

Les unités d'impression sont reliées au pixel par des facteurs fixes : 1 `in` = 96 `px`, donc 12 `pt` = 12 × 96 / 72 = 16 `px`. Une page web les utilise rarement ; la liste complète est sur la [page MDN des longueurs](https://developer.mozilla.org/en-US/docs/Web/CSS/length).

## Les unités relatives : à quoi chacune se rapporte

La **fenêtre d'affichage** (*viewport*) est la zone de la page visible dans le navigateur, sans les barres ni les menus. La **racine** est l'élément `<html>`, ancêtre de tous les autres (voir [les balises HTML](/?c=langages&s=html&p=structure-dun-document)) ; le CSS la désigne par `:root` (voir [les variables](/?c=langages&s=css&p=variables-et-cascade)).

| Unité | Se rapporte à | Usage typique |
|---|---|---|
| `em` | La taille de police **de l'élément** (pour la propriété `font-size` elle-même : celle du **parent**, c'est-à-dire de l'élément qui le contient) | Espaces qui suivent la taille du texte (`padding` d'un bouton) |
| `rem` | La taille de police de **la racine** (« *root em* ») | Tailles de police, espacements généraux |
| `%` | Dépend de la propriété (tableau suivant) | Largeurs, tailles relatives au parent |
| `vw` | 1 % de la **largeur** de la fenêtre d'affichage | Largeurs liées à l'écran |
| `vh` | 1 % de la **hauteur** de la fenêtre d'affichage | Hauteurs liées à l'écran (voir la section sur mobile) |
| `vmin` | 1 % du **plus petit** des deux côtés de la fenêtre | Un carré qui tient toujours dans l'écran |
| `vmax` | 1 % du **plus grand** des deux côtés de la fenêtre | Un fond qui couvre toujours l'écran |
| `ch` | La largeur du **chiffre 0** dans la police de l'élément | Largeur d'une ligne de texte (`65ch` : environ 65 caractères) |
| `ex` | La hauteur de la lettre **x minuscule** de la police | Aligner une icône sur les minuscules (rare) |
| `lh` | La hauteur d'**une ligne** de texte de l'élément (sa valeur de `line-height`) | Un espace vertical égal à une ligne |

Le pourcentage n'a pas une référence unique :

| Propriété | `%` se calcule sur | Exemple |
|---|---|---|
| `width` | La largeur du parent | `width: 50%` : la moitié du parent |
| `height` | La hauteur du parent, **seulement si** elle est fixée explicitement (sinon la valeur est ignorée et la hauteur reste automatique) | `height: 100%` |
| `font-size` | La taille de police du parent | `font-size: 150%` : 1,5 fois celle du parent |
| `padding`, `margin` | La **largeur** du parent, même pour le haut et le bas | `padding-top: 10%` |

```css
.carre {
    width: 50vmin;           /* 50 % du plus petit côté de la fenêtre */
    height: 50vmin;          /* même valeur : le bloc est donc un carré */
}

.article {
    /* au plus 65 largeurs de « 0 » : environ 65 caractères par ligne */
    max-width: 65ch;
    margin-bottom: 1lh;      /* un espace égal à la hauteur d'une ligne de texte */
}
```

Sur un téléphone dont la fenêtre fait 390 pixels de large sur 844 de haut (valeurs d'exemple), le plus petit côté est 390 : `50vmin` vaut 195 pixels. Tourné en **mode paysage** (l'écran est plus large que haut : 844 de large, 390 de haut), le plus petit côté est toujours 390 : le carré garde ses 195 pixels et tient donc toujours dans l'écran.

| Unité | Sur une fenêtre de 390 × 844 | Sur une fenêtre de 1280 × 800 |
|---|---|---|
| `10vw` | 39 px | 128 px |
| `10vh` | 84,4 px | 80 px |
| `10vmin` | 39 px | 80 px |
| `10vmax` | 84,4 px | 128 px |

La longueur d'une ligne de texte a un effet direct sur la lecture : le chapitre [Typographie](/?c=ui-ux&p=typographie) recommande 50 à 75 caractères, ce que `max-width: 65ch` garantit mieux qu'une largeur en pixels, car `ch` suit la police choisie. `ch`, `ex` et `lh` s'appuient sur la police et l'interligne de l'élément : leur valeur en pixels dépend donc de la police chargée et ne se devine pas sans l'afficher. Ces unités sont disponibles dans les navigateurs courants (28/10/2026).

## `em` : pratique, mais il se cumule

`em` a deux sens selon la propriété. Pour `font-size`, il se rapporte à la taille de police du **parent**. Pour toutes les autres propriétés (`padding`, `width`, `margin`...), il se rapporte à la taille de police **de l'élément lui-même**. C'est l'effet qui rend les espacements d'un bouton proportionnels à son texte :

```css
.bouton {
    /* texte de 1,25 fois la taille de la racine : 20 px si elle fait 16 px */
    font-size: 1.25rem;
    /* haut et bas : 0,5 × 20 = 10 px ; gauche et droite : 1 × 20 = 20 px */
    padding: 0.5em 1em;
}
```

Si l'utilisateur règle la taille de police de son navigateur à 24 pixels (au lieu de 16), le texte du bouton passe à 1,25 × 24 = 30 px et les espaces à 15 px et 30 px : le bouton reste proportionné. C'est la bonne utilisation de `em`.

Le piège apparaît avec `font-size` sur des éléments **imbriqués** (placés les uns dans les autres) : chaque niveau multiplie la taille de son parent, donc les effets s'accumulent.

```html
<!-- Trois blocs emboîtés : chacun est l'enfant du précédent, la même classe partout -->
<div class="niveau">Niveau 1
    <div class="niveau">Niveau 2
        <div class="niveau">Niveau 3</div>
    </div>
</div>
```

```css
html {
    font-size: 100%;         /* la racine : 16 px avec le réglage par défaut */
}

.niveau {
    font-size: 1.5em;        /* 1,5 fois la taille de police du PARENT */
}
```

```
html                       16 px      (taille de la racine)
 └─ .niveau (niveau 1)     16 × 1,5 = 24 px
     └─ .niveau (niveau 2) 24 × 1,5 = 36 px
         └─ .niveau (niveau 3) 36 × 1,5 = 54 px     le texte grossit à chaque niveau
```

Avec `font-size: 1.5rem` à la place, les trois niveaux feraient 24 pixels : `rem` se rapporte toujours à la racine, quelle que soit la profondeur.

| | `em` | `rem` |
|---|---|---|
| Référence de `font-size` | Le parent (varie à chaque niveau) | La racine (toujours la même) |
| Référence des autres propriétés | La police de l'élément | La police de la racine |
| Risque | Cumul dans les éléments imbriqués (listes dans des listes, composants emboîtés) | Aucun cumul |
| À choisir pour | `padding`, `margin` ou `gap` qui doivent suivre **le texte du même élément** | Les tailles de police, et les espaces qui ne dépendent pas d'un texte précis |

## `rem` et le réglage de l'utilisateur

Tout navigateur possède une **taille de police par défaut**, 16 pixels tant que personne n'y touche. L'utilisateur peut la changer dans les réglages d'apparence ou de polices de son navigateur : une personne malvoyante la monte à 24, 32 pixels ou plus, et attend que **tous** les sites suivent. La racine reprend cette valeur : c'est elle que `rem` utilise.

Le point essentiel : une taille écrite en **pixels** ne suit pas ce réglage, une taille en `rem` le suit.

| Réglage de l'utilisateur | `font-size: 16px` | `font-size: 1rem` | `font-size: 1.125rem` |
|---|---|---|---|
| 16 px (par défaut) | 16 px | 16 px | 18 px |
| 24 px (150 %) | 16 px | 24 px | 27 px |
| 32 px (200 %) | 16 px | 32 px | 36 px |
| 48 px (300 %) | 16 px | 48 px | 54 px |

Une page tout en pixels reste donc minuscule pour quelqu'un qui a demandé un texte 200 % plus gros : son réglage est ignoré. Ce n'est pas un défaut du **zoom** : zoomer avec le clavier (Ctrl et `+`, ou ⌘ et `+` sur Mac) agrandit aussi les pixels. Seul le **réglage de taille de police** les laisse inchangés (voir [la section sur les deux façons d'agrandir](#deux-facons-d-agrandir-le-zoom-et-la-taille-de-police)). Il faut donc aussi laisser la racine suivre ce réglage :

```css
/* BON : 100 % de la taille choisie par l'utilisateur (16 px si rien n'est réglé) */
html {
    font-size: 100%;
}
```

```css
/* À ÉVITER : fige 16 px quoi que l'utilisateur ait choisi, rem ne suit plus son réglage */
html {
    font-size: 16px;
}
```

Les tailles de police des maquettes sont souvent données en pixels (voir [Typographie](/?c=ui-ux&p=typographie)) : on les convertit en divisant par 16.

| Maquette | Calcul | En CSS |
|---|---|---|
| 14 px | 14 / 16 | `0.875rem` |
| 16 px | 16 / 16 | `1rem` |
| 18 px | 18 / 16 | `1.125rem` |
| 24 px | 24 / 16 | `1.5rem` |
| 32 px | 32 / 16 | `2rem` |
| 48 px | 48 / 16 | `3rem` |

Les pixels gardent leur place pour ce qui ne doit **pas** grossir avec le texte : une bordure fine (`1px solid`), un trait d'ombre.

## Les unités de fenêtre sur mobile : le problème de `100vh`

Sur un téléphone, la **barre d'adresse** (la zone du navigateur qui affiche l'adresse de la page) se réduit ou disparaît quand on fait défiler vers le bas, et réapparaît quand on remonte. La zone visible de la page change donc de hauteur pendant la lecture. Or `vh` est resté, pour les navigateurs mobiles, calculé sur la **plus grande** hauteur possible, barre masquée. Un bloc `height: 100vh` est alors trop haut tant que la barre est visible : son bas (un bouton, par exemple) se retrouve sous le bord de l'écran, hors d'atteinte sans défiler.

CSS a donc ajouté trois familles d'unités, qui désignent chacune un état de la barre :

| Unité | Nom | Se rapporte à la hauteur... | Change pendant le défilement ? |
|---|---|---|---|
| `svh` | *small viewport height* | De la **petite** fenêtre : barre d'adresse visible | Non |
| `lvh` | *large viewport height* | De la **grande** fenêtre : barre d'adresse masquée | Non |
| `dvh` | *dynamic viewport height* | De la fenêtre **actuelle** : suit la barre en direct | Oui |
| `vh` | *viewport height* | En pratique, la même chose que `lvh` sur mobile | Non |

Voici le schéma, pour un écran où la zone totale fait 800 pixels et la barre d'adresse 60 pixels (valeurs d'exemple) :

```
BARRE VISIBLE (page tout en haut)
+----------------------------+
| barre d'adresse : 60 px    |
+----------------------------+   <- haut de la zone visible
|                            |     ^
|        zone visible        |     |  100svh = 740 px
|                            |     |  100dvh = 740 px (suit la barre)
+----------------------------+     v  <- bas de l'écran
   60 px hors écran ...............   100lvh = 800 px : dépasse de 60 px

BARRE MASQUÉE (après un défilement vers le bas)
+----------------------------+   <- haut de l'écran = haut de la zone visible
|                            |     ^
|        zone visible        |     |  100lvh = 800 px
|                            |     |  100dvh = 800 px (suit la barre)
|                            |     |  100svh = 740 px : 60 px de moins
+----------------------------+     v  <- bas de l'écran
```

| État de la barre | `100svh` | `100lvh` (et `100vh`) | `100dvh` |
|---|---|---|---|
| Visible | 740 px | 800 px (60 px hors écran) | 740 px |
| Masquée | 740 px | 800 px | 800 px |

Sur ordinateur, aucune barre ne se déploie : les quatre unités valent la même hauteur. Les mêmes préfixes existent pour la largeur (`svw`, `lvw`, `dvw`) et pour `vmin` et `vmax` ; comme la largeur ne varie pas avec la barre d'adresse, on les rencontre rarement.

Les navigateurs récents comprennent `svh`, `lvh` et `dvh` (28/10/2026). Pour un navigateur ancien, on écrit d'abord l'ancienne valeur, puis la nouvelle : un navigateur qui ne connaît pas l'unité ignore la ligne qu'il ne comprend pas et conserve la précédente.

```css
.accueil {
    height: 100vh;           /* repli : un navigateur ancien s'arrête ici */
    height: 100dvh;          /* un navigateur récent remplace la ligne précédente */
}
```

| Besoin | Unité conseillée | Raison |
|---|---|---|
| Écran d'accueil ou fenêtre qui doit toujours être entièrement visible | `dvh` | Remplit exactement la zone visible, barre ou pas |
| Bloc qui ne doit pas changer de taille pendant le défilement | `svh` | Valeur stable : le bloc ne « respire » pas quand la barre bouge |
| Fond qui doit couvrir l'écran même quand la barre se retire | `lvh` | Va jusqu'au bas de la grande fenêtre |

Comme `dvh` se recalcule en continu, un bloc qui l'utilise est redimensionné à chaque mouvement de la barre : il peut bouger sous les yeux du lecteur. Et, pour un bloc qui contient du texte, on écrit `min-height` plutôt que `height` (voir [la liste de contrôle](#la-liste-de-controle-pour-tenir-a-200-et-a-300)).

```css
.accueil {
    /* repli : au moins la hauteur de l'écran, plus si le texte l'exige */
    min-height: 100vh;
    min-height: 100dvh;      /* version récente : la hauteur réellement visible */
}
```

## Les fonctions de taille : `calc()`, `min()`, `max()` et `clamp()`

Une **fonction CSS** est une valeur qui calcule son résultat : son nom est suivi de parenthèses qui contiennent ses **arguments** (les valeurs qu'on lui donne), séparés par des virgules. `var(--nom)` en est une. Les quatre fonctions de taille ci-dessous acceptent toutes les unités de ce chapitre, mélangées.

### `calc()` : calculer avec plusieurs unités

`calc()` fait un calcul que le navigateur résout à l'affichage. Son intérêt : mélanger des unités qu'on ne peut pas additionner à la main (un pourcentage et des `rem`, par exemple).

```css
:root {
    --ecart: 1rem;                       /* variable CSS de la racine : un espacement */
}

.colonne {
    /* largeur du parent moins 2 rem : 768 px pour un parent de 800 px */
    width: calc(100% - 2rem);
    padding: calc(var(--ecart) * 2);     /* le double de la variable : 2 rem */
    margin-top: calc(100% / 3);          /* le tiers de la largeur du parent */
}
```

| Opérateur | Règle | Exemple valide | Exemple invalide |
|---|---|---|---|
| `+` | **Espace obligatoire** de chaque côté | `calc(1rem + 2vw)` | `calc(1rem+2vw)` |
| `-` | **Espace obligatoire** de chaque côté | `calc(100% - 2rem)` | `calc(100%-2rem)` |
| `*` | Un des deux côtés est un nombre sans unité | `calc(var(--ecart) * 2)` | `calc(1rem * 2rem)` (deux longueurs) |
| `/` | Le côté droit est un nombre sans unité | `calc(100% / 3)` | `calc(100% / 2rem)` (à éviter : diviser par une longueur) |

Les espaces autour de `+` et de `-` sont obligatoires parce que `-2rem` se lit aussi comme **un nombre négatif** : sans espace, le navigateur voit deux valeurs collées et non une soustraction. Une valeur invalide n'est pas signalée par une erreur : la ligne est ignorée en silence, et la propriété reprend sa valeur précédente ou sa valeur par défaut. Les espaces ne sont en revanche pas requis autour de `*` et de `/`, mais on les écrit par habitude. Le détail complet est sur la [page MDN de `calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc).

### `min()` et `max()` : le plus petit, le plus grand

`min(a, b)` renvoie la plus petite des valeurs, `max(a, b)` la plus grande. Le piège de lecture : `min()` pose un **plafond** (le résultat ne dépassera jamais la plus petite valeur), et `max()` un **plancher** (le résultat ne descendra jamais sous la plus grande).

```css
.contenu {
    /* le plus petit des deux : jamais plus large que 40 rem (640 px) */
    width: min(100%, 40rem);
}

.titre {
    font-size: max(1rem, 2vw); /* le plus grand des deux : jamais sous 1 rem (16 px) */
}
```

| Écriture | Dans le cas | Valeurs comparées | Résultat |
|---|---|---|---|
| `min(100%, 40rem)` | Parent de 500 px | 500 px et 640 px | 500 px |
| `min(100%, 40rem)` | Parent de 900 px | 900 px et 640 px | 640 px |
| `max(1rem, 2vw)` | Fenêtre de 400 px | 16 px et 8 px | 16 px |
| `max(1rem, 2vw)` | Fenêtre de 1000 px | 16 px et 20 px | 20 px |

`width: min(100%, 40rem)` équivaut à `width: 100%; max-width: 40rem;` en une seule ligne. Les pages MDN de [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) et [`max()`](https://developer.mozilla.org/en-US/docs/Web/CSS/max) détaillent leur syntaxe.

### `clamp()` : une taille fluide, bornée des deux côtés

`clamp(minimum, préféré, maximum)` choisit la valeur **préférée** tant qu'elle reste entre les deux bornes, sinon la borne la plus proche. C'est l'équivalent de `max(minimum, min(préféré, maximum))`. Avec une partie préférée qui dépend de la largeur de la fenêtre, la taille grandit **progressivement** avec l'écran (on parle de taille **fluide**), sans media query :

```css
.titre {
    /* plancher : 1 rem (16 px) ; préféré : 0,5 rem + 2 % de la largeur ; max : 2 rem */
    font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
}
```

Voici ce que cette ligne donne selon la largeur de la fenêtre (avec la racine à 16 pixels, donc 0,5 rem = 8 px et 1 rem = 16 px) :

| Largeur de la fenêtre | Partie préférée `0.5rem + 2vw` | Résultat | Quelle valeur gagne |
|---|---|---|---|
| 320 px | 8 + 6,4 = 14,4 px | **16 px** | Le plancher (14,4 est sous 16) |
| 400 px | 8 + 8 = 16 px | **16 px** | Le plancher et le préféré coïncident |
| 600 px | 8 + 12 = 20 px | **20 px** | Le préféré |
| 800 px | 8 + 16 = 24 px | **24 px** | Le préféré |
| 1000 px | 8 + 20 = 28 px | **28 px** | Le préféré |
| 1200 px | 8 + 24 = 32 px | **32 px** | Le préféré et le plafond coïncident |
| 1440 px | 8 + 28,8 = 36,8 px | **32 px** | Le plafond (36,8 est au-dessus de 32) |

Entre 400 et 1200 pixels de large, le texte grossit en ligne droite de 16 à 32 pixels ; en dessous et au-dessus, il reste bloqué sur la borne.

**Comment choisir la partie préférée ?** On part de ce qu'on veut : la taille minimale à partir d'une largeur donnée, la taille maximale à partir d'une autre. La partie préférée s'écrit `ordonnée + pente × largeur`, où la **pente** est le nombre de pixels gagnés par pixel de largeur de fenêtre et l'**ordonnée** la valeur qu'on ajoute au départ pour retomber sur la taille voulue.

| Étape | Calcul | Exemple : de 16 px à 400 px de large jusqu'à 32 px à 1200 px |
|---|---|---|
| 1. Pente en pixels par pixel de largeur | (taille max - taille min) / (largeur max - largeur min) | (32 - 16) / (1200 - 400) = 0,02 |
| 2. Pente en `vw` | Pente × 100, car 1vw est 1 % de la largeur | 0,02 × 100 = **2vw** |
| 3. Ordonnée | taille min - pente × largeur min | 16 - 0,02 × 400 = 8 px |
| 4. Ordonnée en `rem` | Ordonnée / 16 | 8 / 16 = **0,5rem** |
| 5. Assemblage | `clamp(min, ordonnée + pente, max)` | `clamp(1rem, 0.5rem + 2vw, 2rem)` |

La vérification est immédiate : à 1200 pixels, 8 + 0,02 × 1200 = 32. Autre exemple, de 18 pixels (1,125 rem) à 400 pixels de large jusqu'à 24 pixels (1,5 rem) à 1200 pixels : la pente est (24 - 18) / 800 = 0,0075, soit 0,75vw ; l'ordonnée est 18 - 0,0075 × 400 = 15 px, soit 0,9375 rem. On écrit donc `clamp(1.125rem, 0.9375rem + 0.75vw, 1.5rem)` ; vérification : à 400 pixels, 15 + 3 = 18 ; à 1200 pixels, 15 + 9 = 24.

`clamp()` ne se limite pas au texte : `padding: clamp(1rem, 4vw, 3rem)` fait varier un espacement avec l'écran. Les détails sont sur la [page MDN de `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp). À l'intérieur de `clamp()`, `min()`, `max()` ou d'un `calc()`, un calcul s'écrit sans reprendre `calc()` : `0.5rem + 2vw` suffit, avec les mêmes espaces obligatoires.

### Le piège de `vw` seul dans une taille de police

Une taille de police écrite **uniquement** en `vw` ne dépend que de la largeur de la fenêtre :

```css
.titre-fragile {
    font-size: 2vw;           /* 2 % de la largeur : 25,6 px à 1280 px, 6,4 px à 320 px */
}
```

Trois défauts en découlent. Elle ne suit pas le réglage de taille de police de l'utilisateur, qui ne change pas la largeur de la fenêtre. Elle ne grossit pas non plus quand on zoome, comme le calcule la section sur l'agrandissement un peu plus bas. Enfin, sur petit écran elle devient minuscule : à 320 pixels de large, `2vw` donne 6,4 pixels, illisible. La règle est donc : **toujours ajouter une partie en `rem`** (comme le `0.5rem` de l'exemple de `clamp()`), et exprimer les bornes en `rem` plutôt qu'en pixels, pour qu'elles suivent le réglage de l'utilisateur.

## Agrandir le texte à 200 % et 300 % : ce que demande le WCAG

Le **WCAG** (*Web Content Accessibility Guidelines*) est le référentiel de règles d'accessibilité web publié par le [W3C](https://www.w3.org/) (*World Wide Web Consortium*), l'organisme qui normalise le web (voir [Couleur et contraste](/?c=ui-ux&p=couleur-et-contraste) et [l'accessibilité en UX](/?c=ui-ux&p=accessibilite-ux), qui en présentent les niveaux A, AA et AAA). Deux de ses critères, tous deux de **niveau AA** (le niveau visé par défaut), concernent l'agrandissement :

| Numéro | Intitulé | Ce que le critère demande | Page officielle |
|---|---|---|---|
| 1.4.4 | Redimensionnement du texte (*Resize Text*) | Le texte peut être agrandi jusqu'à **200 %**, sans outil spécialisé, **sans perte de contenu ni de fonction** | [W3C : Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| 1.4.10 | Redistribution (*Reflow*) | À **320 pixels CSS de large** (un zoom de 400 % sur une fenêtre de 1280 pixels), le contenu s'affiche **sans défilement horizontal**, ni perte de contenu ni de fonction | [W3C : Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |

Un **défilement horizontal** est la barre qui oblige à faire glisser la page de gauche à droite pour lire une ligne : il casse la lecture, car on doit sans cesse revenir en arrière. Le critère admet des exceptions pour les contenus dont le sens exige une disposition à deux dimensions (tableau de données, carte, image), et pose un équivalent de 256 pixels de **haut** pour un contenu qui défile horizontalement.

**Et 300 % ?** Aucun critère ne fixe ce palier : il se situe entre les deux seuils officiels (200 % et 400 %). C'est un **palier de test** utile : sur une fenêtre de 1280 pixels, un zoom de 300 % donne une largeur d'environ 427 pixels, une taille intermédiaire où des points de rupture pensés pour des téléphones précis laissent parfois un trou. Une page qui tient à 200 %, 300 % et 400 % est sûre dans toute la plage.

### Deux façons d'agrandir : le zoom et la taille de police

Les utilisateurs ont deux moyens d'obtenir un texte plus grand, aux effets très différents :

| | Zoom de la page | Taille de police du navigateur |
|---|---|---|
| Geste | Ctrl et `+` (⌘ et `+` sur Mac), ou Ctrl et la molette | Réglages du navigateur, rubrique apparence ou polices |
| Ce qui grandit | **Tout** : texte, images, pixels, espacements | Seulement ce qui s'exprime en `rem`, `em` ou en pourcentage de la police (les pixels restent) |
| Largeur de la fenêtre en pixels CSS | **Diminue** (largeur réelle / zoom) | Ne change pas |
| Media queries en `px` | Réagissent : la mise en page bascule vers la version « téléphone » | Ne réagissent pas : la mise en page large reste, le texte grossit dedans |
| Risque typique | Hauteurs figées trop petites, en-tête fixe qui occupe l'écran | Colonnes trop étroites, texte qui déborde de blocs de largeur fixe |

Un zoom de 200 % sur une fenêtre de 1280 × 800 pixels équivaut, pour le CSS, à une fenêtre deux fois plus petite : 1280 / 2 = 640 pixels de large. Les valeurs de chaque palier :

| Zoom | Largeur en pixels CSS (fenêtre de 1280) | Hauteur en pixels CSS (fenêtre de 800) | Ce que voit le CSS |
|---|---|---|---|
| 100 % | 1280 | 800 | Un ordinateur |
| 200 % | 640 | 400 | Une largeur proche de celle d'une petite tablette |
| 300 % | environ 427 | environ 267 | Une largeur proche de celle d'un grand téléphone |
| 400 % | 320 | 200 | Une largeur proche de celle d'un petit téléphone |

Retenons surtout la hauteur : à 400 %, un bloc écrit `height: 100vh` ne mesure que 200 pixels CSS. Et une barre d'en-tête fixe de 80 pixels CSS occuperait alors 80 / 200 = 40 % de la fenêtre.

Les points de rupture suivent aussi le réglage de police s'ils sont écrits en `em` : dans une media query, `em` se rapporte à la taille de police par défaut du navigateur (et non à celle que le CSS de la page définit). Ainsi `48em` vaut 48 × 16 = 768 pixels par défaut, mais 48 × 32 = 1536 pixels si l'utilisateur a choisi 32 pixels : une fenêtre de 1280 pixels est alors considérée comme étroite, ce qui convient à un texte deux fois plus gros.

```css
/* 48em : 768 px avec la taille par défaut (16 px), 1536 px avec 32 px choisis */
/* @media applique le bloc seulement si la fenêtre a au moins cette largeur */
@media (min-width: 48em) {
    .page {
        /* les colonnes passent côte à côte seulement au-dessus de ce seuil */
        display: flex;
    }
}
```

### Que devient une taille fluide quand on agrandit ?

Le calcul se fait avec la largeur en pixels CSS du tableau précédent : une taille de police en `rem` fixe est multipliée par le zoom, alors que la partie `vw` d'une taille fluide diminue en même temps que la fenêtre. Voici, sur une fenêtre de 1280 pixels, la taille **affichée** (taille CSS × zoom) de trois écritures :

| Zoom | Largeur CSS | `2rem` | `clamp(1rem, 0.5rem + 2vw, 2rem)` | `2vw` |
|---|---|---|---|---|
| 100 % | 1280 | 32 px | 32 px | 25,6 px |
| 200 % | 640 | 64 px (×2) | 8 + 12,8 = 20,8 px CSS, donc 41,6 px (×1,3) | 12,8 px CSS, donc 25,6 px (×1) |
| 300 % | 427 | 96 px (×3) | 8 + 8,53 = 16,53 px CSS, donc 49,6 px (×1,55) | 8,53 px CSS, donc 25,6 px (×1) |
| 400 % | 320 | 128 px (×4) | 16 px CSS (plancher), donc 64 px (×2) | 6,4 px CSS, donc 25,6 px (×1) |

Lecture : `2rem` grandit exactement comme le zoom. `2vw` **ne grandit pas du tout** (×1 à chaque palier) : l'agrandissement est annulé par la baisse de la fenêtre, d'où sa condamnation. `clamp()` grandit, mais moins que le zoom (×1,3 à 200 %) tant que sa partie préférée en `vw` pèse. Avec le réglage de police à 32 pixels, le même calcul donne 0,5 × 32 + 0,02 × 1280 = 41,6 pixels, soit encore ×1,3.

Ce tableau est un calcul, pas un verdict : il n'indique pas si le critère 1.4.4 est satisfait, ce qui se juge page ouverte. Il suffit pour décider : pour le **texte courant**, rester sur des `rem` fixes (`1rem`), qui grandissent exactement du zoom demandé ; réserver `clamp()` aux **grands titres**, avec un écart modéré entre les bornes ; et tester à 200 %.

### La liste de contrôle pour tenir à 200 % et à 300 %

| Risque | Ce qui casse à 200 % ou 300 % | Correction |
|---|---|---|
| Largeur fixe en pixels (`width: 1200px`) | Une barre de défilement horizontale | `max-width` plus `width: 100%`, ou `width: min(100%, 75rem)` |
| Hauteur fixe en pixels sur un bloc de texte | Le texte sort du bloc ou est coupé | `min-height`, ou ne pas fixer la hauteur |
| `height: 100vh` pour un bloc contenant du texte | À 400 %, la hauteur n'est que de 200 pixels CSS | `min-height: 100vh` (puis `min-height: 100dvh`) |
| `overflow: hidden` sur un conteneur (réglage qui cache ce qui dépasse de la boîte) | Ce qui dépasse est **coupé**, donc perdu | `overflow: visible` (défaut), ou `overflow: auto` pour un tableau ou un bloc de code |
| Élément [flex](/?c=langages&s=css&p=flexbox) ou [grid](/?c=langages&s=css&p=grid) qui refuse de rétrécir | Le conteneur déborde de l'écran | `min-width: 0` (largeur minimale autorisée : zéro) sur l'élément flex ; `minmax(0, 1fr)` pour une colonne de grille |
| Mot ou adresse très long | Une ligne qu'on ne peut pas couper dépasse du bloc | `overflow-wrap: anywhere` (autorise la coupure d'un mot trop long) |
| Interligne en pixels (`line-height: 24px`) | Les lignes se chevauchent quand le texte grossit | `line-height: 1.5` (nombre sans unité) |
| Image ou SVG plus large que l'écran | Défilement horizontal | `max-width: 100%; height: auto;` (voir [les images](/?c=langages&s=html&p=liens-et-images) et [le SVG](/?c=langages&s=html&p=svg-dans-la-page)) |
| En-tête collé en haut de la fenêtre (`position: fixed` ou `sticky`, voir [le positionnement](/?c=langages&s=css&p=positionnement)) | Il couvre une grande part de la fenêtre étroite | Le remettre en `position: static` (défilement normal) dans une media query pour les fenêtres étroites |
| Bouton à hauteur fixe | Son libellé déborde | `min-height` et `padding` en `em` |

L'**`overflow`** règle ce qui se passe quand le contenu dépasse de sa boîte :

| Valeur | Effet |
|---|---|
| `visible` (défaut) | Le contenu dépasse et reste visible |
| `hidden` | Ce qui dépasse est caché, définitivement |
| `auto` | Une barre de défilement apparaît seulement si nécessaire |
| `scroll` | Une barre de défilement est toujours présente |

La [page MDN d'`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) liste les autres valeurs. Voici pourquoi `min-width: 0` est utile dans un conteneur flex : par défaut, un élément flex refuse de devenir plus étroit que son contenu (sa valeur minimale est `auto`, qui est la largeur du plus long mot ou de la plus grande image qu'il contient). Un mot long ou une image large le garde donc large, et le conteneur sort de l'écran. De même, dans une grille, `1fr` s'écrit en réalité `minmax(auto, 1fr)` : le même minimum s'applique.

```css
.cartes {
    display: flex;           /* les enfants se placent sur une ligne (voir Flexbox) */
    flex-wrap: wrap;         /* ils passent à la ligne suivante quand la place manque */
    gap: 1rem;               /* espace de 1 rem entre les éléments */
}

.carte {
    flex: 1 1 15rem;         /* peut grandir, peut rétrécir, largeur de départ 15 rem */
    min-width: 0;            /* l'élément peut devenir plus étroit que son contenu */
    overflow-wrap: anywhere; /* coupe un mot trop long là où il le faut */
}
```

`overflow-wrap` décide si un mot trop long pour sa ligne peut être coupé au milieu : `normal` (défaut) le laisse dépasser ; `anywhere` le coupe n'importe où (et tient compte de cette coupure dans le calcul de la largeur minimale d'un élément flex ou grid, ce que `break-word`, autre valeur du même réglage, ne fait pas) ; voir la [page MDN d'`overflow-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap). Pour couper proprement aux syllabes, `hyphens: auto` (voir [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)) ajoute un trait d'union, mais il exige que la langue de la page soit déclarée par `lang` sur `<html>` (voir [la structure d'un document](/?c=langages&s=html&p=structure-dun-document)).

Pour une grille, `min()` règle le cas d'une colonne plus large que l'écran :

```css
.galerie {
    display: grid;
    /* chaque colonne : au moins 12 rem, ou tout le conteneur s'il est plus étroit */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: 1rem;               /* espace entre les cellules */
}
```

Avec `minmax(200px, 1fr)` à la place, une colonne ne pourrait pas descendre sous 200 pixels : dans un conteneur plus étroit, la grille déborderait. La combinaison `min(100%, 12rem)` ramène le minimum à la largeur du conteneur.

Voici le même composant avant et après correction :

```css
/* AVANT : tout casse à 200 % ou 300 % */
.page {
    width: 1200px;           /* largeur figée : défilement horizontal sous 1200 px */
}

.entete {
    height: 80px;            /* hauteur figée : le texte agrandi déborde */
    overflow: hidden;        /* et le débordement est coupé : le texte est perdu */
}

.contenu {
    line-height: 24px;       /* interligne figé : les lignes se chevauchent */
}
```

```css
/* APRÈS : la page s'adapte à l'espace réel */
.page {
    width: 100%;             /* occupe la largeur de la fenêtre */
    max-width: 75rem;        /* au plus 1200 px (75 × 16) avec le réglage par défaut */
    /* 0 en haut et en bas, auto à gauche et à droite : bloc centré */
    margin: 0 auto;
    padding: 0 1rem;         /* marge intérieure à gauche et à droite */
}

.entete {
    min-height: 5rem;        /* au moins 80 px par défaut, plus si le texte l'exige */
}

.contenu {
    line-height: 1.5;        /* 1,5 fois la taille du texte : suit les agrandissements */
}
```

Le nombre sans unité de `line-height: 1.5` est **hérité tel quel** : chaque enfant le recalcule avec sa propre taille de police, alors qu'une valeur en pixels est transmise en pixels aux enfants, même s'ils ont un texte plus gros ([l'héritage](/?c=langages&s=css&p=variables-et-cascade) transmet une valeur figée). Pour comprendre la propriété, voir la [page MDN de `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height).

### Comment tester

Aucune règle de ce chapitre ne remplace un test réel dans un navigateur : les calculs ci-dessus prédisent le résultat, mais seul l'affichage montre une ligne coupée ou une barre de défilement inattendue.

| Test | Comment | Ce qu'on vérifie |
|---|---|---|
| Taille de police à 200 % | Dans les réglages du navigateur, choisir 32 px comme taille de police par défaut (16 px par défaut), puis recharger la page | Le texte en `rem` double ; rien n'est coupé ni chevauché |
| Taille de police à 300 % | Même réglage, avec 48 px | Idem ; les colonnes restent lisibles |
| Zoom 200 % | Ctrl et `+` jusqu'à 200 % sur une fenêtre de 1280 px | La mise en page bascule en version étroite, sans perte |
| Zoom 300 % | Jusqu'à 300 % | Pas de trou entre les deux versions de la mise en page |
| Zoom 400 % | Jusqu'à 400 % : la fenêtre mesure 320 pixels CSS | **Aucune barre de défilement horizontale** (critère 1.4.10) |
| Retour à la normale | Ctrl et `0` | Rétablit le zoom à 100 % |

Les menus du navigateur varient d'une version à l'autre : on cherche « taille de police » dans le champ de recherche de ses réglages. Pour chaque palier, on contrôle quatre points : aucune barre de défilement horizontale (hors tableau ou carte), aucun texte coupé, tous les boutons et liens utilisables au clavier et à la souris, et rien de masqué sous un en-tête ou un pied de page fixe.

Pour trouver quel élément provoque un défilement horizontal, on peut interroger la page depuis la **console**, la zone des outils de développement (ouverts par la touche F12) où l'on tape du JavaScript (voir [le DOM](/?c=langages&s=javascript&p=dom-et-evenements), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) et [les fonctions](/?c=langages&s=javascript&p=fonctions)) :

```javascript
// Largeur visible de la page : celle de la racine <html>, sans la barre de défilement
const largeur = document.documentElement.clientWidth;

// querySelectorAll("*") : tous les éléments ; [...] les range dans un tableau
// filter garde ceux dont le bord droit (right) dépasse la largeur visible
const fautifs = [...document.querySelectorAll("*")].filter(
    (element) => element.getBoundingClientRect().right > largeur
);

// console.log écrit la liste dans la console : un clic sur un élément le surligne
console.log(fautifs);
```

`getBoundingClientRect()` renvoie le rectangle qu'occupe l'élément dans la fenêtre ; sa propriété `right` est la position de son bord droit en pixels. La liste affichée contient les éléments dont la boîte sort de la fenêtre à droite : ce sont ceux à corriger (un menu volontairement caché hors écran y figure aussi, sans être une erreur). Voir [les tableaux](/?c=langages&s=javascript&p=tableaux) pour `filter`.

## Quelle unité pour quel besoin

| Besoin | À écrire | Pourquoi |
|---|---|---|
| Taille d'un texte courant | `1rem` | Suit le réglage du navigateur et le zoom |
| Espace qui suit le texte d'un élément (bouton) | `em` | Reste proportionné à son propre texte |
| Largeur d'une colonne de texte | `max-width: 65ch` | Longueur de ligne confortable, adaptée à la police |
| Largeur d'un bloc qui ne doit pas dépasser | `width: min(100%, 40rem)` | S'adapte aux petits écrans, plafonne sur les grands |
| Hauteur plein écran sur mobile | `min-height: 100vh` puis `min-height: 100dvh` | Suit la barre d'adresse, avec un repli |
| Grand titre fluide | `clamp(1.75rem, 1.125rem + 2.5vw, 3rem)` | Grandit avec l'écran, borné, suit la racine |
| Interligne | `1.5` sans unité | Suit la taille du texte |
| Point de rupture | `@media (min-width: 48em)` | Suit la taille de police par défaut |
| Bordure fine, ombre | `1px` | Ne doit pas grossir avec le texte |
| Image | `max-width: 100%; height: auto` | Ne dépasse jamais son parent |

Le titre fluide du tableau suit la méthode des étapes ci-dessus, de 28 pixels (1,75 rem) à 400 pixels de large jusqu'à 48 pixels (3 rem) à 1200 pixels : la pente est (48 - 28) / 800 = 0,025, soit 2,5vw ; l'ordonnée est 28 - 0,025 × 400 = 18 px, soit 1,125 rem. Vérification : à 400 pixels, 18 + 10 = 28 ; à 1200 pixels, 18 + 30 = 48.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| `html { font-size: 16px; }` | Fige la racine : `rem` ne suit plus le réglage de taille de police de l'utilisateur |
| `html { font-size: 62.5%; }` pour que `1rem` vaille 10 px | Suit le réglage, mais tout le texte non redéfini passe à 10 px (illisible) et chaque taille doit se recompter (`1.6rem` pour 16 px) |
| `em` sur des éléments imbriqués | La taille se multiplie à chaque niveau : 16, 24, 36, 54 px pour `1.5em` |
| `font-size: 2vw` seul | Ne grossit ni avec le zoom ni avec le réglage de l'utilisateur ; 6,4 px à 320 px de large |
| Bornes de `clamp()` en pixels | Elles ignorent le réglage de l'utilisateur : écrire `1rem` et `2rem` |
| Texte courant en `clamp()` | La partie `vw` freine l'agrandissement (×1,3 au zoom 200 % sur 1280 px) : réserver aux grands titres |
| `100vh` sur téléphone | Le bas du bloc dépasse sous le bord de l'écran quand la barre d'adresse est visible |
| `width: 100vw` sur ordinateur | `vw` compte la barre de défilement verticale : le bloc dépasse de sa largeur et crée un défilement horizontal ; préférer `100%` |
| `calc(100%-2rem)` sans espaces | Valeur invalide, ligne ignorée en silence |
| `min()` et `max()` pris à l'envers | `min()` plafonne et `max()` planche : l'effet est contraire à l'intuition |
| `height: 100%` sans hauteur sur le parent | Le pourcentage est ignoré : la hauteur reste automatique |
| `height` en pixels sur un bloc de texte | Le texte agrandi sort du bloc |
| `overflow: hidden` autour d'un texte | Le texte agrandi est coupé, donc perdu |
| `line-height` en pixels | Les lignes se chevauchent dès que le texte grossit |
| Élément flex ou grid sans `min-width: 0` | Un mot long suffit à faire déborder tout le conteneur |
| `<meta name="viewport" ... user-scalable=no>` (ou `maximum-scale=1`) | Interdit le zoom par pincement sur mobile, contraire au critère 1.4.4 (voir [la structure d'un document](/?c=langages&s=html&p=structure-dun-document)) |
| Tester uniquement avec le zoom | Les pixels grossissent au zoom mais pas avec le réglage de police : les deux cas sont à tester |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Laisser `html { font-size: 100%; }` et écrire les tailles de police en `rem` | Le texte suit le réglage de l'utilisateur |
| Réserver `em` aux espaces proportionnels au texte du même élément | Pas de cumul, le bouton garde ses proportions |
| Convertir les tailles de maquette en `rem` (px / 16) | Même rendu par défaut, mais respect du réglage |
| Utiliser `min-height` plutôt que `height` pour un bloc de texte | Le bloc grandit avec son contenu |
| Écrire `100vh` puis `100dvh` (ou `svh` / `lvh` selon le besoin) | Repli pour les navigateurs anciens, hauteur exacte sur mobile |
| Poser `max-width` en `rem` ou en `ch`, avec `width: 100%` | La mise en page s'adapte de 320 px à l'écran large |
| `clamp()` pour les grands titres, avec bornes et ordonnée en `rem` | Taille fluide, bornée, qui suit encore le réglage |
| `line-height` en nombre sans unité | L'interligne suit le texte |
| `min-width: 0`, `minmax(0, 1fr)` et `overflow-wrap: anywhere` dans les composants flex et grid | Aucun mot long ne fait déborder la page |
| Points de rupture en `em` | Ils suivent la taille de police par défaut |
| Tester à 200 %, 300 % et 400 %, par le zoom **et** par la taille de police | Les deux façons d'agrandir produisent des problèmes différents |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une taille CSS est un nombre et une unité. `px` est absolu ; `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex` et `lh` sont relatifs. `rem` suit la racine (16 px par défaut, réglable par l'utilisateur) alors que `px` ignore ce réglage ; `em` se cumule dans les éléments imbriqués. Sur mobile, `svh` est la hauteur barre visible, `lvh` barre masquée, `dvh` la hauteur actuelle ; on écrit `100vh` puis `100dvh` en repli. `calc()` mélange les unités (espaces obligatoires autour de `+` et `-`) ; `min()` plafonne, `max()` plancher ; `clamp(min, préféré, max)` donne une taille fluide dont la partie préférée se calcule par `ordonnée + pente × largeur` (par exemple `clamp(1rem, 0.5rem + 2vw, 2rem)`). Le WCAG demande un texte agrandissable à 200 % (critère 1.4.4, Redimensionnement du texte) et un contenu sans défilement horizontal à 320 pixels CSS, soit un zoom de 400 % (critère 1.4.10, Redistribution) ; 300 % est un palier de test intermédiaire. |
| **Pièges à éviter** | Racine en pixels ; `62.5%` mal compensé ; `em` imbriqués ; `vw` seul dans une taille de police ; bornes de `clamp()` en pixels ; `100vh` sur téléphone ; `100vw` avec une barre de défilement ; `calc(100%-2rem)` ; `min()` et `max()` inversés ; hauteurs et interlignes en pixels ; `overflow: hidden` autour du texte ; éléments flex et grid sans `min-width: 0` ; zoom du mobile bloqué par `user-scalable=no` ; ne tester qu'une des deux façons d'agrandir. |
| **Bonnes pratiques** | Tailles de police et espacements généraux en `rem`, `em` pour ce qui suit le texte de l'élément ; `min-height`, `max-width` et `width: min(100%, ...)` plutôt que des dimensions figées ; `100vh` suivi de `100dvh` ; `clamp()` pour les grands titres, avec des bornes en `rem` ; `line-height` sans unité ; `overflow-wrap: anywhere` et `min-width: 0` ; points de rupture en `em` ; test réel à 200 %, 300 % et 400 % par le zoom et par la taille de police. |
