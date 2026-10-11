---
order: 9
---

# Animations CSS performantes

Une **animation** est un changement progressif de l'apparence d'un élément (position, taille, transparence...) pendant une durée donnée. Le [CSS](/?c=langages&s=css&p=css) sait en produire sans une ligne de [JavaScript](/?c=langages&s=javascript&p=javascript), mais toutes les animations ne se valent pas : certaines obligent le navigateur (le logiciel qui affiche les pages web) à refaire beaucoup de calculs à chaque instant, et l'animation **saccade** (*jank*) : des images arrivent en retard, le mouvement n'est plus fluide. Ce chapitre montre comment écrire une animation, pourquoi seules deux propriétés sont vraiment bon marché, et comment ne pas gêner les personnes que le mouvement rend malades.

Il suppose connus [les sélecteurs](/?c=langages&s=css&p=selecteurs) (dont la pseudo-classe `:hover`, qui cible un élément survolé par la souris, et la classe `.nom`, qui cible les éléments dont l'attribut `class` contient ce nom), [le modèle de boîte](/?c=langages&s=css&p=box-model) et [le positionnement](/?c=langages&s=css&p=positionnement). Les exemples JavaScript supposent connus [le HTML](/?c=langages&s=html&p=html) (balise `<div>`, attributs `id` et `class`), [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions) (dont les fonctions fléchées `=>`), [les conditions](/?c=langages&s=javascript&p=conditions) et [les chaînes de caractères](/?c=langages&s=javascript&p=strings) avec backticks.

## Deux propriétés vedettes : `transform` et `opacity`

Tout le chapitre tourne autour de ces deux propriétés. `opacity` règle la transparence, de `0` (invisible) à `1` (opaque). `transform` déplace, agrandit ou fait tourner l'élément **à l'affichage**, sans toucher à la place qu'il occupe dans la page : ses voisins ne bougent pas, exactement comme pour `position: relative` vu au [chapitre sur le positionnement](/?c=langages&s=css&p=positionnement). Un **pixel** est le plus petit point d'un écran ; `px` est l'unité qui compte les pixels.

| Valeur de `transform` | Effet | Exemple |
|---|---|---|
| `translateX(d)` | Déplace horizontalement (positif : vers la droite, négatif : vers la gauche) | `translateX(30px)` : 30 pixels vers la droite |
| `translateY(d)` | Déplace verticalement (positif : vers le bas) | `translateY(-20px)` : 20 pixels vers le haut |
| `scale(n)` | Multiplie la taille par `n` (1 : inchangé) | `scale(1.2)` : 120 % de la taille, `scale(0.5)` : la moitié |
| `translate(x, y)` | Déplace dans les deux sens à la fois. Un pourcentage se calcule sur la taille de l'élément lui-même | `translate(-50%, -50%)` : de la moitié de sa largeur vers la gauche et de la moitié de sa hauteur vers le haut |
| `rotate(a)` | Fait tourner dans le sens des aiguilles d'une montre | `rotate(45deg)` : 45 degrés (`deg`), `360deg` est un tour complet |

Plusieurs fonctions se combinent dans une seule valeur : `transform: translateX(30px) scale(1.2);`. Les durées s'écrivent avec `s` (seconde) ou `ms` (milliseconde, un millième de seconde) : `0.2s` égale `200ms`.

## `transition` : passer d'une valeur à une autre

Une **transition** anime le passage d'une valeur à une autre quand celle-ci change : le navigateur calcule seul toutes les valeurs intermédiaires. Elle a besoin d'un déclencheur : un survol, ou une classe ajoutée par du [JavaScript](/?c=langages&s=javascript&p=dom-et-evenements) (`classList.add`). Quand le déclencheur disparaît, la transition repart en sens inverse.

```css
.bouton {
    /* anime la propriété `transform` en 0,2 s, avec un freinage à la fin (ease-out) */
    transition: transform 0.2s ease-out;
}

.bouton:hover {
    transform: scale(1.05);   /* au survol : 5 % plus grand, la transition anime le passage */
}
```

| Propriété | Rôle | Valeur par défaut |
|---|---|---|
| `transition-property` | Quelle propriété animer (`transform`, `opacity`...) | `all` (toutes) |
| `transition-duration` | Durée du passage | `0s` (instantané) |
| `transition-timing-function` | Courbe de vitesse (voir le tableau plus bas) | `ease` |
| `transition-delay` | Attente avant de démarrer | `0s` |

Le raccourci `transition` les réunit dans l'ordre : propriété, durée, courbe, délai. Quand il contient deux durées, la première est la durée, la seconde le délai.

## `@keyframes` et `animation` : une suite d'étapes

Une transition ne connaît que deux états (avant, après) et attend un déclencheur. Pour plus d'étapes, ou une animation qui démarre seule au chargement, on déclare une suite d'**images clés** (*keyframes*, les moments où l'on fixe l'apparence) avec `@keyframes`, puis on la joue avec les propriétés `animation-*`.

| | `transition` | `@keyframes` + `animation` |
|---|---|---|
| Nombre d'étapes | Deux (départ, arrivée) | Autant qu'on veut |
| Démarrage | Un changement de valeur (survol, classe) | Seul, dès que la règle s'applique |
| Répétition | Non | Oui (`animation-iteration-count`) |
| Usage typique | Réaction à un survol ou à un clic | Apparition, chargement, mouvement continu |

```css
/* cible : <div class="notification">Enregistré</div> */
/* @keyframes déclare une animation nommée « apparition » (le nom est libre) */
@keyframes apparition {
    from {                              /* from : l'état au tout début (équivaut à 0%) */
        opacity: 0;                     /* invisible */
        transform: translateY(20px);    /* décalé de 20 pixels vers le bas */
    }
    to {                                /* to : l'état à la fin (équivaut à 100%) */
        opacity: 1;                     /* totalement visible */
        transform: translateY(0);       /* à sa place normale */
    }
}

.notification {
    animation-name: apparition;         /* quelle suite d'étapes jouer */
    animation-duration: 0.4s;           /* chaque lecture dure 0,4 s */
    animation-timing-function: ease-out;    /* vitesse : freine vers la fin */
    animation-delay: 0.5s;              /* attend 0,5 s avant de démarrer */
    animation-iteration-count: 1;       /* joue une seule fois */
    animation-direction: normal;        /* de la première étape vers la dernière */
    animation-fill-mode: backwards;     /* applique l'état de départ pendant l'attente */
}
```

| Propriété | Rôle | Défaut | Valeurs courantes |
|---|---|---|---|
| `animation-name` | Nom du `@keyframes` à jouer | `none` | `apparition` |
| `animation-duration` | Durée d'une lecture | `0s` | `0.4s`, `300ms` |
| `animation-timing-function` | Courbe de vitesse | `ease` | `ease`, `linear`, `ease-out`... |
| `animation-delay` | Attente avant le départ (une valeur négative démarre en cours de route) | `0s` | `0.5s`, `-1s` |
| `animation-iteration-count` | Nombre de lectures | `1` | `3`, `0.5` (la moitié), `infinite` |
| `animation-direction` | Sens de lecture | `normal` | `normal`, `reverse`, `alternate`, `alternate-reverse` |
| `animation-fill-mode` | Ce qui s'affiche avant et après la lecture | `none` | `none`, `forwards`, `backwards`, `both` |
| `animation-play-state` | Lecture ou pause | `running` | `running`, `paused` |

| `animation-direction` | Effet |
|---|---|
| `normal` | Chaque lecture va du début à la fin |
| `reverse` | Chaque lecture va de la fin au début |
| `alternate` | Aller, puis retour, puis aller... (la première lecture va dans le sens normal) |
| `alternate-reverse` | Retour, puis aller... (la première lecture va dans le sens inverse) |

| `animation-fill-mode` | Pendant l'attente (`animation-delay`) | Après la fin |
|---|---|---|
| `none` (défaut) | Style normal de l'élément | Retour au style normal |
| `backwards` | État de la première étape | Retour au style normal |
| `forwards` | Style normal de l'élément | Reste sur l'état de la dernière étape |
| `both` | État de la première étape | Reste sur l'état de la dernière étape |

Sans `backwards` dans l'exemple ci-dessus, la notification serait visible pendant les 0,5 s d'attente, puis disparaîtrait brusquement pour réapparaître en fondu. Inversement, une animation qui finit par `opacity: 0` redevient visible à la fin sans `forwards`.

| Courbe (`timing-function`) | Vitesse |
|---|---|
| `ease` (défaut) | Départ progressif, milieu rapide, arrivée progressive |
| `linear` | Constante |
| `ease-in` | Lente au début, puis rapide |
| `ease-out` | Rapide au début, puis freine |
| `ease-in-out` | Lente au début et à la fin |
| `cubic-bezier(a, b, c, d)` | Courbe sur mesure réglée par quatre nombres |
| `steps(n)` | `n` sauts brusques, sans fluidité |

Les autres écritures sont listées sur la [page MDN de `animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function) (*MDN Web Docs*, la documentation de référence du web éditée par Mozilla). Le raccourci `animation` réunit les propriétés sur une ligne, dans un ordre libre sauf pour les deux durées (la première est la durée, la seconde le délai). Avec plus de deux étapes, on les place par pourcentage du temps :

```css
/* une pastille qui grossit puis rétrécit : trois étapes réparties dans le temps */
@keyframes pulsation {
    0%   { transform: scale(1); }       /* au début : taille normale */
    50%  { transform: scale(1.3); }     /* à mi-parcours : 130 % */
    100% { transform: scale(1); }       /* à la fin : retour à la taille normale */
}

.chargement {
    /* nom, durée, courbe, répétition infinie : les quatre propriétés sur une ligne */
    animation: pulsation 1.2s ease-in-out infinite;
}
```

## Comment le navigateur dessine une page

Un écran affiche une suite d'**images** (*frames*), comme un film. Le nombre d'images affichées par seconde s'appelle la **fréquence d'images** (*FPS*, *frames per second*) : la plupart des écrans se rafraîchissent 60 fois par seconde ([web.dev](https://web.dev/articles/rendering-performance), le site de documentation de Google sur le web). Une seconde valant 1000 ms, le navigateur dispose de 1000 / 60, soit environ **16,7 ms** pour produire chaque image. S'il met plus de temps, il saute une image et l'animation saccade. En pratique, le navigateur a lui-même du travail à chaque image : web.dev conseille de viser environ 10 ms pour le code de la page.

Le **rendu** est le travail qui transforme le HTML et le CSS en pixels. Il se fait en étapes enchaînées, précédées du calcul des styles (quelle règle CSS s'applique à quel élément, voir [la cascade](/?c=langages&s=css&p=variables-et-cascade)) :

| Étape | Question à laquelle elle répond | Remarque |
|---|---|---|
| **Mise en page** (*layout*) | Quelle taille et quelle position pour chaque élément ? | Concerne presque toujours le document entier : changer un élément peut déplacer ses voisins et ses parents |
| **Peinture** (*paint*) | De quelle couleur chaque pixel ? (fonds, texte, bordures, ombres) | Souvent l'étape la plus longue |
| **Composition** (*composite*) | Comment empiler les **couches** (*layers*) en une image ? | La moins coûteuse. Une couche est comme un calque transparent : le **GPU** (le processeur graphique, voir [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)) sait la déplacer ou la rendre transparente sans la redessiner |

```
CSS modifié
   |
   v
[ Mise en page ] --> [ Peinture ] --> [ Composition ] --> écran
 taille/position      remplir les      empiler les
 de chaque élément    pixels           couches (GPU)

width modifié     : mise en page --> peinture --> composition   (3 étapes)
color modifié     :                  peinture --> composition   (2 étapes)
transform modifié :                                composition  (1 étape)
```

Les étapes sont enchaînées : si l'une doit être refaite, toutes les suivantes le sont aussi. Selon la propriété qu'une animation modifie, le navigateur doit donc refaire à chaque image une, deux ou trois étapes.

| Propriété animée | Étapes refaites à chaque image |
|---|---|
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | Mise en page, peinture, composition |
| `color`, `background-color`, `border-color`, `box-shadow` (ombre autour de l'élément) | Peinture, composition |
| `transform`, `opacity` | Composition seule |

Pour une propriété qui n'est pas dans ce tableau, les outils de développement du navigateur indiquent les étapes refaites (voir plus bas). Le tableau suppose que l'élément qui bouge est sur sa propre couche, ce que le navigateur décide en général seul pendant une animation CSS.

## Pourquoi n'animer que `transform` et `opacity`

Ce sont, d'après [web.dev](https://web.dev/articles/animations-overview), les deux seules propriétés que les navigateurs animent à bas coût, pour deux raisons.

**Raison 1 : aucune mise en page ni peinture à refaire.** Animer `left` ou `width` oblige le navigateur à recalculer la géométrie à chaque image, soit 60 fois par seconde, et à repeindre. Animer `transform` n'exige que la composition.

**Raison 2 : le travail peut quitter le fil principal.** Un **thread** (fil d'exécution) est une suite d'instructions que le processeur déroule ; un programme peut en faire tourner plusieurs en parallèle (voir [les threads en C](/?c=langages&s=c&p=threads)). Le **fil principal** du navigateur exécute les styles, la mise en page, la peinture et tout le JavaScript de la page, [un seul à la fois](/?c=langages&s=javascript&p=asynchrone). Un autre fil, le **compositeur**, ne fait que la composition. Les animations CSS de `transform` et `opacity` peuvent tourner sur ce fil : elles continuent même quand le fil principal est occupé (un calcul JavaScript long, par exemple).

```
Animer `left` ou `width` : le fil principal doit travailler à chaque image
  fil principal   : [mise en page][peinture]      [mise en page][peinture]...
  fil compositeur :                  [composition]                 [composition]

Animer `transform` ou `opacity` : le fil principal reste libre
  fil principal   : libre pour le JavaScript, les clics, le défilement
  fil compositeur : [composition]  [composition]  [composition]...   (GPU)
```

La comparaison avec le même mouvement écrit de deux façons :

```css
/* les deux boîtes ont la même taille de départ */
.boite-mauvaise, .boite-bonne {
    width: 100px;                       /* largeur : 100 pixels */
    height: 100px;                      /* hauteur : 100 pixels */
    background-color: #1a4fd6;          /* fond bleu */
}

/* MAUVAIS : left, width et height changent la mise en page à chaque image */
.boite-mauvaise {
    position: relative;                 /* nécessaire pour que `left` agisse */
    /* infinite alternate : va-et-vient sans fin, pour pouvoir observer */
    animation: deplacer-gauche 2s ease-in-out infinite alternate;
}
@keyframes deplacer-gauche {
    from { left: 0;     width: 100px; height: 100px; }
    to   { left: 200px; width: 150px; height: 150px; }
}

/* BON : un mouvement et un agrandissement comparables, sans toucher à la mise en page */
.boite-bonne {
    animation: deplacer-transform 2s ease-in-out infinite alternate;
}
@keyframes deplacer-transform {
    from { transform: translateX(0)     scale(1); }
    /* scale(1.5) : 1,5 x 100 px = 150 px, agrandi autour du centre */
    to   { transform: translateX(200px) scale(1.5); }
}
```

| Effet voulu | À éviter (refait la mise en page) | À préférer |
|---|---|---|
| Déplacer | `left`, `top`, `margin` | `transform: translateX()` / `translateY()` |
| Agrandir ou réduire | `width`, `height` | `transform: scale()` |
| Faire apparaître ou disparaître | `height` ou `width` vers `0` | `opacity` |
| Animer une ombre | `box-shadow` | Poser l'ombre finale sur un [pseudo-élément](/?c=langages&s=css&p=selecteurs) et animer son `opacity` |

Deux limites de `scale` : il étire aussi le contenu (le texte se déforme, les coins arrondis aussi), donc il convient aux formes et aux fonds plus qu'aux boîtes de texte ; et l'espace réservé dans la page ne change pas, l'élément agrandi peut donc en recouvrir d'autres. Un `transform` sur un ancêtre a enfin des effets de bord sur les enfants en `position: fixed`, décrits au [chapitre sur le positionnement](/?c=langages&s=css&p=positionnement).

Le gain réel dépend de la page, de l'appareil et du navigateur : il se mesure (voir [Mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)). [Le guide web.dev](https://web.dev/articles/animations-guide) décrit trois outils de **Chrome DevTools** (les outils de développement intégrés à Chrome, le navigateur de Google) pour vérifier une animation :

| Outil (panneau de DevTools) | Ce qu'il montre |
|---|---|
| *Performance*, onglet *Summary* | Une valeur de *Rendering* non nulle indique que l'animation fait du travail de mise en page |
| *Rendering*, case *FPS meter* | Le nombre d'images affichées par seconde et les images sautées |
| *Rendering*, case *Paint Flashing* | Les zones repeintes à chaque image (tout l'écran qui clignote : à investiguer) |

## `will-change` : prévenir le navigateur

`will-change` indique au navigateur quelles propriétés vont changer, pour qu'il prépare la couche à l'avance. Mais chaque couche occupe de la mémoire : mal utilisée, la propriété ralentit la page au lieu de l'accélérer. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) la présente comme un **dernier recours** contre un problème de performance déjà constaté, et non comme une précaution. Avec `transform` ou `opacity`, elle crée aussi dès le départ un contexte d'empilement (voir le [chapitre sur le positionnement](/?c=langages&s=css&p=positionnement)).

```css
/* MAUVAIS : demande une couche pour CHAQUE élément de la page, pour toujours */
* {
    will-change: transform;
}
```

Le bon usage est de la poser juste avant l'animation et de la retirer juste après. Le délai de 0,5 s de la notification laisse ici au navigateur le temps de se préparer :

```html
<!-- hidden : attribut qui cache l'élément (comme display: none) tant qu'il est présent -->
<div id="notification" class="notification" hidden>Enregistré</div>
```

```javascript
// Retrouve la notification dans la page
const notification = document.getElementById("notification");

function afficherNotification() {
    // 1. Avant : prévient le navigateur (en JavaScript, `will-change` s'écrit `willChange`)
    notification.style.willChange = "transform, opacity";
    // 2. Pendant : affiche l'élément, ce qui démarre l'animation `apparition`
    notification.hidden = false;
    // 3. Après : `animationend` est l'événement émis à la fin de l'animation CSS
    notification.addEventListener("animationend", () => {
        // `auto` rend au navigateur son comportement normal
        notification.style.willChange = "auto";
    }, { once: true });   // `once: true` : cette fonction n'est appelée qu'une seule fois
}
```

## `prefers-reduced-motion` : respecter ceux que le mouvement rend malades

Certaines personnes souffrent de troubles du **système vestibulaire** (l'oreille interne, qui gère l'équilibre) : un mouvement à l'écran, surtout un grand déplacement ou un zoom, leur donne vertiges, nausées et maux de tête, au point de devoir parfois s'allonger (d'après le [WCAG](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), les règles d'accessibilité web de référence, dont les niveaux A, AA et AAA sont expliqués au [chapitre sur l'accessibilité](/?c=ui-ux&p=accessibilite-ux)). D'autres ont une **épilepsie photosensible** : certains clignotements déclenchent des crises. Le système d'exploitation (Windows, macOS, Android... le logiciel de base de l'appareil) propose un réglage « réduire les animations », que le CSS lit avec la **media query** (condition `@media`, vue au [chapitre sur le responsive](/?c=langages&s=css&p=responsive-et-media-queries)) `prefers-reduced-motion`.

| Valeur | Signification |
|---|---|
| `no-preference` | L'utilisateur n'a rien demandé |
| `reduce` | L'utilisateur a demandé de réduire le mouvement |

Le réglage se trouve ici, d'après [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (intitulés d'origine anglaise) :

| Système | Chemin |
|---|---|
| Windows 11 | Settings > Accessibility > Visual Effects > Animation Effects |
| macOS | System Settings > Accessibility > Display (ou Motion) > Reduce motion |
| iOS | Settings > Accessibility > Motion |
| Android 9 et plus | Settings > Accessibility > Remove animations |

Réduire ne veut pas dire tout supprimer : on retire les grands déplacements, les zooms, les rotations et les boucles, et on garde un changement doux, comme un fondu. Reprenons `.notification` :

```css
/* un fondu seul, sans mouvement : il remplace `apparition` quand `reduce` est demandé */
@keyframes apparition-douce {
    from { opacity: 0; }                /* invisible */
    to   { opacity: 1; }                /* visible */
}

/* @media : la règle ne s'applique que si la condition entre parenthèses est vraie */
@media (prefers-reduced-motion: reduce) {
    .notification {
        animation-name: apparition-douce;   /* plus de glissement vers le haut */
        animation-duration: 0.2s;           /* plus court */
    }

    .chargement {
        animation: none;                /* pas de boucle : la pastille reste immobile */
    }
}
```

On peut aussi renverser la logique : l'animation n'existe que pour ceux qui n'ont rien demandé, et tout ce qui n'est pas reconnu reste immobile.

```css
@media (prefers-reduced-motion: no-preference) {
    .chargement {
        animation: pulsation 1.2s ease-in-out infinite;   /* animée seulement ici */
    }
}
```

Le [chapitre sur le responsive](/?c=langages&s=css&p=responsive-et-media-queries) présente une règle globale (durées réduites à `0.001ms`, qui garde les événements `animationend`) ; le présent exemple va plus loin en remplaçant l'animation par une variante douce. Trois critères du WCAG concernent le mouvement :

| Critère | Niveau | Exigence |
|---|---|---|
| [2.3.1 Trois flashs](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | A | Rien qui clignote plus de trois fois par seconde (ou sous les seuils définis) |
| [2.2.2 Pause, arrêt, masquage](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | A | Un mouvement automatique de plus de cinq secondes, présenté avec d'autres contenus, doit pouvoir être mis en pause, arrêté ou masqué (sauf s'il est essentiel) |
| [2.3.3 Animation issue des interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | AAA | Un mouvement déclenché par une interaction peut être désactivé (sauf s'il est essentiel) |

Pour tester, le panneau *Rendering* de DevTools propose d'émuler `prefers-reduced-motion` ([documentation](https://developer.chrome.com/docs/devtools/rendering/emulate-css)).

## Les pièges en code

Le premier piège touche `transform` : dans un `@keyframes`, il **remplace** la valeur `transform` de l'élément, il ne s'y ajoute pas.

```css
/* une modale (fenêtre posée par-dessus la page), centrée : translate(-50%, -50%) la ramène
   de la moitié de SA largeur et de SA hauteur */
.modale-mauvaise, .modale-bonne {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.modale-mauvaise { animation: zoom-mauvais 0.3s backwards; }
.modale-bonne    { animation: zoom-bon 0.3s backwards; }

/* MAUVAIS : cette valeur remplace le translate, la modale perd son centrage */
@keyframes zoom-mauvais {
    from { transform: scale(0.8); }
}

/* BON : on répète le translate dans l'étape de départ, puis on ajoute scale */
@keyframes zoom-bon {
    from { transform: translate(-50%, -50%) scale(0.8); }
}
```

Le deuxième piège est une animation de taille : si un bandeau grandit en hauteur, tout ce qui le suit dans le flux normal (voir le [positionnement](/?c=langages&s=css&p=positionnement)) descend à chaque image, et le texte que l'on lit saute. La solution est de le sortir du flux avec `position: fixed`.

```css
/* MAUVAIS : la hauteur grandit, tout ce qui est dessous est repoussé à chaque image */
.bandeau-mauvais {
    height: 0;
    animation: ouvrir 0.4s forwards;    /* forwards : reste ouvert à la fin */
}
@keyframes ouvrir {
    to { height: 60px; }
}

/* BON : le bandeau est posé par-dessus (fixed), le reste de la page ne bouge jamais */
.bandeau-bon {
    position: fixed;                    /* sorti du flux, collé à la fenêtre */
    top: 0;
    left: 0;
    right: 0;
    height: 60px;                       /* sa taille finale est réservée d'emblée */
    animation: descendre 0.4s backwards;
}
@keyframes descendre {
    from { transform: translateY(-100%); }  /* -100 % de sa hauteur : juste hors de l'écran */
}
```

Le troisième est `transition: all`, qui anime toute propriété qui change, y compris celles que l'on n'avait pas prévues. `all` est aussi la valeur par défaut de `transition-property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-property)) : écrire `transition: 0.3s` sans nom de propriété équivaut à `transition: all 0.3s`.

```css
/* MAUVAIS : si un script change `width` ou `margin`, la mise en page s'anime aussi */
.bouton-tout { transition: all 0.3s; }

/* MAUVAIS aussi : sans nom de propriété, la valeur par défaut est `all` */
.bouton-implicite { transition: 0.3s; }

/* BON : seulement les propriétés voulues, séparées par une virgule */
.bouton-precis { transition: transform 0.3s, opacity 0.3s; }
```

Le dernier est d'animer en JavaScript avec `setInterval` (une fonction qui en rappelle une autre à intervalle fixe, comparée à `requestAnimationFrame` dans le chapitre sur les [animations en canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)). Cela cumule les défauts : le code tourne sur le fil principal, il n'est pas calé sur le rafraîchissement de l'écran, et `left` refait la mise en page à chaque appel.

```javascript
// Retrouve la boîte (un <div id="boite-js"> en `position: relative`)
const boite = document.getElementById("boite-js");
let gauche = 0;                         // position horizontale actuelle, en pixels

// MAUVAIS : appelée toutes les 16 ms, sans lien avec l'écran
setInterval(() => {
    gauche += 2;                        // `+= 2` : ajoute 2 à `gauche`
    boite.style.left = gauche + "px";   // `+` colle « px » ; `left` refait la mise en page
}, 16);
```

La bonne solution est une animation CSS (`transition` ou `@keyframes`), que le navigateur optimise seul, y compris en réduisant la fréquence d'une animation dans un onglet non visible ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)). Si le JavaScript est indispensable (animation pilotée par la souris, par exemple), on utilise [`requestAnimationFrame`](/?c=langages&s=javascript&p=canvas-2d-et-animations) (qui appelle une fonction juste avant le prochain rafraîchissement de l'écran) et `transform`, ou l'API [`element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) qui permet au navigateur d'optimiser comme en CSS.

```javascript
let debut = null;                       // date du premier appel, notée au départ

function avancer(maintenant) {          // `maintenant` : date donnée par le navigateur (ms)
    if (debut === null) debut = maintenant;     // note le départ lors du premier appel
    // Math.min garde le plus petit des deux nombres : la boîte s'arrête à 200 pixels
    const gauche = Math.min((maintenant - debut) / 10, 200);   // 1 pixel toutes les 10 ms
    // les backticks insèrent la valeur de `gauche` dans le texte, à la place de ${gauche}
    boite.style.transform = `translateX(${gauche}px)`;   // transform, pas left
    if (gauche < 200) requestAnimationFrame(avancer);    // programme l'image suivante
}
requestAnimationFrame(avancer);         // démarre
```

## Récapitulatif des propriétés

| Propriété | Nature | Valeurs | Sert à |
|---|---|---|---|
| `transition` | Raccourci | `transform 0.2s ease-out` | Animer le passage entre deux valeurs |
| `@keyframes` | Règle | Étapes `from`/`to` ou en `%` | Décrire une suite d'étapes |
| `animation` (et `animation-*`) | Raccourci | Nom, durée, courbe, délai, répétition... | Jouer une suite d'étapes |
| `animation-play-state` | Propriété | `running`, `paused` | Mettre en pause ou reprendre |
| `transform` | Propriété | `translateX()`, `scale()`, `rotate()` | Déplacer, agrandir, tourner (composition) |
| `opacity` | Propriété | `0` à `1` | Régler la transparence (composition) |
| `will-change` | Propriété | `transform`, `opacity`, `auto` | Préparer une couche, en dernier recours |
| `@media (prefers-reduced-motion)` | Media query | `reduce`, `no-preference` | Adapter le mouvement au réglage système |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Animer `left`, `top`, `width`, `height` ou `margin` | Mise en page et peinture refaites à chaque image. Utiliser `transform` |
| Animer `box-shadow` ou une couleur sur un grand élément | La peinture est refaite à chaque image. Animer l'`opacity` d'un pseudo-élément |
| `transition: all` ou `transition: 0.3s` | Toute propriété qui change s'anime, mise en page comprise. Nommer les propriétés |
| `will-change` posé sur tout, ou jamais retiré | Chaque couche coûte de la mémoire. Le poser avant, le retirer après, en dernier recours |
| Animation qui change la taille d'un élément du flux | Le contenu en dessous saute à chaque image. Réserver la place, animer `transform` |
| `transform` du `@keyframes` qui écrase celui de l'élément | Le centrage ou la rotation de départ disparaît. Répéter la valeur de base |
| Oublier `animation-fill-mode` | Élément visible pendant l'attente, ou retour brutal à la fin |
| Animation `infinite` sur un contenu qui n'a pas besoin de bouger | Distraction, batterie consommée, gêne vestibulaire. Réserver aux indicateurs utiles (chargement) |
| Contenu qui clignote plus de trois fois par seconde | Risque de crise d'épilepsie photosensible (WCAG 2.3.1) |
| Animer avec `setInterval` et `left` | Fil principal chargé, rythme sans lien avec l'écran. CSS, ou `requestAnimationFrame` et `transform` |
| Ignorer `prefers-reduced-motion` | Nausées et vertiges pour certains utilisateurs |
| `animation: none` quand du code attend `animationend` | L'événement n'arrive jamais. Réduire la durée (voir le chapitre sur le responsive) |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Animer `transform` et `opacity` seulement | Composition seule, travail possible hors du fil principal |
| `transition` pour une réaction, `@keyframes` pour une suite | Chaque outil pour son cas, sans JavaScript |
| Nommer les propriétés d'une transition | Aucune animation involontaire |
| Viser 60 images par seconde (16,7 ms par image) | C'est le rythme d'un écran courant |
| Vérifier dans les outils du navigateur plutôt que supposer | Seule la mesure dit si l'animation est fluide |
| Poser `will-change` juste avant, le retirer juste après | Mémoire libérée, couche préparée à temps |
| Prévoir une variante `prefers-reduced-motion` pour chaque mouvement | Remplacer les grands déplacements par un fondu |
| Réserver l'espace d'un élément animé avant l'animation | Aucun décalage du contenu |
| Limiter les boucles aux indicateurs utiles, avec pause possible au-delà de 5 s | Moins de distraction (WCAG 2.2.2) |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `transition` anime deux états, `@keyframes` plus d'étapes. Le rendu enchaîne mise en page, peinture, composition : `transform` et `opacity` n'ont besoin que de la composition, qui peut quitter le fil principal. Un écran à 60 images par seconde laisse environ 16,7 ms par image. `will-change` est un dernier recours, posé puis retiré. `prefers-reduced-motion: reduce` remplace le mouvement par un changement doux. |
| **Pièges à éviter** | Animer `left`, `width` ou `margin` ; `transition: all` ; `will-change` partout ; animation de taille qui repousse le contenu ; `transform` du `@keyframes` qui écrase l'existant ; `fill-mode` oublié ; boucles inutiles ; `setInterval` ; ignorer `prefers-reduced-motion`. |
| **Bonnes pratiques** | `transform` et `opacity` seulement, propriétés nommées dans les transitions, espace réservé, variante douce pour `reduce`, vérification dans les outils du navigateur, `will-change` rare et temporaire. |
