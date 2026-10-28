---
order: 22
---

# Les API de page du navigateur : thème, défilement, visibilité et annulation (28/10/2026)

Le **navigateur** est le logiciel qui affiche les pages web (Chrome, Firefox, Safari...). Une **API** (*Application Programming Interface*, « interface de programmation ») est un ensemble de fonctions et d'objets qu'il met à la disposition du code JavaScript pour lui permettre d'agir sur la page ou de lire l'état de l'appareil. Ce chapitre présente quatre de ces API, qui servent à piloter une page :

| API | Ce qu'elle permet | Section |
|---|---|---|
| `matchMedia` | Savoir, depuis JavaScript, si une condition d'écran ou de réglage est vraie (fenêtre étroite, thème sombre...) | [matchMedia](#matchmedia-lire-une-media-query-depuis-javascript) |
| `scrollIntoView` | Faire défiler la page jusqu'à un élément | [scrollIntoView](#scrollintoview-faire-defiler-jusqu-a-un-element) |
| `visibilitychange` | Savoir si l'utilisateur regarde la page ou l'a quittée des yeux (onglet masqué) | [visibilitychange](#visibilitychange-savoir-si-la-page-est-regardee) |
| `AbortController` | Annuler une opération en cours (requête réseau, écouteurs d'événements) | [AbortController](#abortcontroller-annuler-ce-qui-est-en-cours) |

Un **événement** est un signal que le navigateur envoie quand quelque chose se produit (un clic, un redimensionnement de la fenêtre, un changement d'onglet) ; un **écouteur** est la fonction que l'on branche sur un événement pour qu'elle s'exécute à chaque fois. Ce chapitre suppose connus [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements) (la page vue comme un arbre d'objets que JavaScript manipule), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions) (dont les fonctions fléchées `() => { ... }`), [les conditions](/?c=langages&s=javascript&p=conditions), [les boucles](/?c=langages&s=javascript&p=boucles) et [les objets](/?c=langages&s=javascript&p=objets) (la notation `{ nom: valeur }`).

La plupart de ces API sont disponibles dans tous les navigateurs courants (28/10/2026) : la section de chaque API signale les rares points qui demandent de la prudence.

## `matchMedia` : lire une media query depuis JavaScript

Une **media query** (« requête de média ») est une condition écrite dans le CSS avec `@media`, qui n'applique des styles que si l'écran ou les réglages de l'utilisateur correspondent : largeur de la fenêtre, thème sombre, appareil tactile... Elle est expliquée au [chapitre sur le responsive](/?c=langages&s=css&p=responsive-et-media-queries). Le CSS réagit seul, mais un script a parfois besoin de connaître la réponse lui-même (arrêter une animation, charger un contenu plus léger). La fonction `window.matchMedia(requête)` la lui donne. Dans l'exemple ci-dessous, `(max-width: 600px)` signifie « la largeur de la fenêtre est d'au plus 600 pixels » (un **pixel** est le plus petit point d'un écran). `window` est l'objet qui représente la fenêtre de l'onglet : ses fonctions peuvent s'écrire avec ou sans `window.` devant.

```javascript
// matchMedia reçoit une media query sous forme de texte et renvoie un objet MediaQueryList
const requete = window.matchMedia("(max-width: 600px)");

// matches vaut true (vrai) si la condition est vérifiée à cet instant, false (faux) sinon
if (requete.matches) {
    // console.log écrit un message dans la console des outils de développement (F12)
    console.log("Fenêtre étroite : 600 pixels de large ou moins");
} else {
    console.log("Fenêtre large : plus de 600 pixels");
}

console.log(requete.media);    // "(max-width: 600px)" : la requête, telle que lue
```

L'objet renvoyé, un **`MediaQueryList`**, contient :

| Élément | Nature | Rôle |
|---|---|---|
| `.matches` | Booléen (`true` ou `false`) | Vrai si la condition est vérifiée **en ce moment** ; la valeur reste à jour, relire `requete.matches` plus tard donne la réponse actuelle |
| `.media` | Texte | La requête telle que le navigateur l'a comprise |
| `addEventListener("change", fonction)` | Fonction | Appelle `fonction` chaque fois que `.matches` **change** de valeur |
| `removeEventListener("change", fonction)` | Fonction | Retire un écouteur posé avec `addEventListener` (voir [la section sur l'annulation](#retirer-plusieurs-ecouteurs-d-un-coup)) |

### Les requêtes utiles

| Requête | Vraie quand | Usage typique |
|---|---|---|
| `(max-width: 600px)` | La fenêtre fait 600 pixels de large ou moins | Choisir une version « téléphone » d'un composant (un bloc d'interface comme un menu ou une galerie) |
| `(min-width: 601px)` | La fenêtre fait plus de 600 pixels | Le contraire de la précédente |
| `(orientation: portrait)` | La fenêtre est plus haute que large | Adapter une galerie ou un jeu |
| `(prefers-reduced-motion: reduce)` | L'utilisateur a demandé au système de **réduire les animations** | Ne pas lancer d'animation, voir [le chapitre sur le SVG](/?c=langages&s=html&p=svg-dans-la-page) pour un exemple complet |
| `(prefers-color-scheme: dark)` | L'utilisateur a choisi le **thème sombre** dans son système | Appliquer des couleurs sombres |
| `(hover: hover)` | Le périphérique principal (souris, pavé tactile) peut **survoler** un élément ; faux sur un écran tactile, où l'on ne peut que toucher | N'afficher une infobulle au survol que si le survol existe |

Plusieurs conditions se combinent avec `and` : `"(max-width: 600px) and (orientation: portrait)"` est vraie quand les deux le sont. Les mêmes requêtes s'utilisent telles quelles dans `@media` en CSS ; [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) liste toutes les conditions possibles, et la page sur [`hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) détaille le survol.

### Lire une fois ou écouter les changements

Lire `.matches` une seule fois donne l'état **à cet instant**. Or l'utilisateur peut changer d'avis pendant que la page est ouverte : redimensionner la fenêtre, tourner son téléphone, basculer le système en thème sombre. L'événement `change` prévient le script à chaque bascule.

```javascript
// Objet de la condition « thème sombre choisi dans le système »
const sombre = window.matchMedia("(prefers-color-scheme: dark)");

function appliquerTheme(estSombre) {
    // document.documentElement est la balise <html> ; toggle(nom, condition) ajoute la
    // classe si la condition est vraie, la retire sinon
    document.documentElement.classList.toggle("theme-sombre", estSombre);
}

appliquerTheme(sombre.matches);        // état au chargement (change ne s'y déclenche pas)

// À chaque bascule du système, le navigateur appelle cette fonction (objet « événement »)
sombre.addEventListener("change", (evenement) => {
    appliquerTheme(evenement.matches); // la nouvelle valeur de la condition
});
```

```css
:root {
    --fond: #ffffff;                   /* variables CSS : couleurs du thème clair */
    --texte: #1a1a1a;
}

.theme-sombre {
    --fond: #121212;                   /* la classe posée remplace les valeurs */
    --texte: #f0f0f0;
}

body {
    background: var(--fond);           /* var(--nom) lit la variable */
    color: var(--texte);
}
```

Les [variables CSS](/?c=langages&s=css&p=variables-et-cascade) évitent de réécrire toutes les couleurs : le script ne fait que poser ou retirer une [classe](/?c=langages&s=css&p=selecteurs) (une étiquette posée sur un élément, que le CSS sait viser) sur `<html>`, la [balise](/?c=langages&s=html&p=structure-dun-document) qui contient toute la page.

| | Lire une fois | Écouter les changements |
|---|---|---|
| Écriture | `window.matchMedia(q).matches` | `addEventListener("change", fonction)` |
| Utile quand | Une décision se prend à un instant précis : au clic, au démarrage d'une animation | L'interface doit suivre le réglage en direct : thème, mise en page |
| Se déclenche | Jamais seul : on lit au moment voulu | Seulement quand la réponse **bascule** (pas à chaque pixel de redimensionnement), et jamais au chargement |

### Le CSS ou JavaScript ?

| Besoin | Meilleur outil | Pourquoi |
|---|---|---|
| Changer couleurs, tailles, disposition selon la largeur ou le thème | **`@media` en CSS** | Aucun script à écrire, aucune latence, et ça marche même si le script échoue |
| Choisir quel contenu charger (une image lourde seulement sur grand écran) | `matchMedia` | Le CSS ne peut pas décider quoi télécharger par script |
| Démarrer, arrêter ou ralentir une animation faite en JavaScript | `matchMedia` | Le CSS n'a pas la main sur une boucle JavaScript |
| Mémoriser un choix de thème de l'utilisateur | `matchMedia` + [stockage dans le navigateur](/?c=langages&s=javascript&p=dom-et-evenements) | Le choix explicite prime sur le réglage du système |

### Les pièges de `matchMedia`

L'ancienne écriture `addListener` est **obsolète** : on la rencontre dans de vieux tutoriels, mais `addEventListener("change", ...)` la remplace.

```javascript
const requete = window.matchMedia("(max-width: 600px)");
function surChangement(evenement) { console.log(evenement.matches); }

requete.addListener(surChangement);                 // OBSOLÈTE : à ne plus écrire
requete.addEventListener("change", surChangement);  // à écrire à la place
```

L'autre erreur fréquente est de **mesurer la fenêtre en boucle** pour deviner si elle est étroite. `setInterval(fonction, délai)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)) est un **minuteur** : il rappelle la fonction à intervalle régulier, ici toutes les 16 millisecondes (une milliseconde est un millième de seconde).

```javascript
// MAUVAIS : on interroge la largeur 60 fois par seconde, même quand rien ne change
setInterval(() => {
    // window.innerWidth : la largeur de la fenêtre, en pixels
    if (window.innerWidth <= 600) {
        console.log("étroit");
    }
}, 16);                                             // 16 millisecondes entre deux mesures
```

Cette boucle fait travailler le navigateur pour rien et consomme de la batterie. `matchMedia` ne prévient que lorsque la réponse **change**. Pour suivre la taille précise d'un élément, `ResizeObserver` (voir [les observateurs](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) est l'outil prévu ; l'événement `resize` de la fenêtre, lui, se déclenche des dizaines de fois par seconde et se limite avec un **debounce** (n'agir qu'après une pause dans la série d'événements, voir le même chapitre).

Deux subtilités à connaître. D'une part, une requête **mal écrite** ne lève pas d'erreur : `window.matchMedia("max-width 600")` (sans parenthèses) renvoie un objet dont `.matches` vaut simplement `false`, et un test qui échoue en silence est difficile à repérer. D'autre part, `.matches` reflète la condition à l'instant de la lecture, mais seul l'événement `change` prévient d'une bascule : lire `.matches` une fois au démarrage puis ne plus jamais y revenir laisse l'interface périmée dès que l'utilisateur change un réglage.

## `scrollIntoView` : faire défiler jusqu'à un élément

Le **défilement** (*scroll*) est le déplacement du contenu quand on fait rouler la molette ou glisser le doigt. `élément.scrollIntoView()` demande au navigateur de faire défiler la page (et tous les conteneurs qui la contiennent) jusqu'à ce que l'élément soit visible. Le nom veut dire « faire défiler pour amener dans la vue ».

```html
<!-- Un bouton, puis plus bas un titre repéré par son id (identifiant unique) « tarifs » -->
<button id="aller-tarifs">Voir les tarifs</button>
<h2 id="tarifs">Tarifs</h2>
```

```javascript
const bouton = document.getElementById("aller-tarifs");   // le bouton, trouvé par son id
const titre = document.getElementById("tarifs");          // l'élément à atteindre

bouton.addEventListener("click", () => {                  // au clic sur le bouton...
    // ... défiler en douceur jusqu'au titre, qui sera collé en haut de la zone visible
    titre.scrollIntoView({ behavior: "smooth", block: "start" });
});
```

L'argument est un **objet d'options** : plusieurs réglages nommés écrits entre accolades. Tous sont facultatifs.

| Option | Valeurs possibles | Valeur par défaut | Effet |
|---|---|---|---|
| `behavior` | `"auto"`, `"smooth"` | `"auto"` | `"auto"` suit la propriété CSS `scroll-behavior` de la page (un saut immédiat si rien n'est réglé). `"smooth"` anime le défilement |
| `block` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"start"` | Où placer l'élément **verticalement** dans la zone visible (dans une page écrite de gauche à droite) |
| `inline` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"nearest"` | Où le placer **horizontalement** |

`"nearest"` signifie « le plus proche » : le navigateur défile le moins possible, et ne bouge pas du tout si l'élément est déjà entièrement visible. Le schéma suivant montre la zone visible (le cadre) après un défilement pour trois valeurs de `block` :

```
  block: "start"        block: "center"       block: "end"
  +-------------+       +-------------+       +-------------+
  | [élément]   |       |             |       |             |
  |             |       | [élément]   |       |             |
  |             |       |             |       | [élément]   |
  +-------------+       +-------------+       +-------------+
  haut de la vue        milieu de la vue      bas de la vue
```

### Compenser un en-tête fixe avec `scroll-margin-top`

Un **en-tête fixe** est une barre qui reste collée en haut de la fenêtre pendant le défilement (voir [le positionnement CSS](/?c=langages&s=css&p=positionnement)). Avec `block: "start"`, l'élément atteint se retrouve exactement en haut de la zone visible, donc **caché derrière** cette barre. Le CSS corrige cela avec `scroll-margin-top`, une marge de défilement : une distance que le navigateur garde entre le haut de la vue et l'élément à atteindre ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top)).

```css
.entete {
    position: sticky;                  /* reste collé en haut pendant le défilement */
    top: 0;                            /* collé à 0 pixel du haut de la fenêtre */
    height: 64px;                      /* hauteur de la barre */
}

h2[id] {
    scroll-margin-top: 80px;           /* 80 pixels libres au-dessus de tout h2 avec id */
}
```

Cette marge s'applique aussi aux liens d'ancre `<a href="#tarifs">` : un seul réglage CSS corrige les deux. Son équivalent posé sur le conteneur qui défile (souvent `html`) est `scroll-padding-top` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-top)).

### Respecter `prefers-reduced-motion`

Le défilement animé peut provoquer des vertiges chez certaines personnes (voir [`prefers-reduced-motion`](/?c=langages&s=css&p=animations-css-performantes)). Il ne faut donc **jamais forcer `smooth`** : on lit le réglage de l'utilisateur et on choisit le comportement en conséquence.

```javascript
function comportementDeDefilement() {
    // Vrai si l'utilisateur a demandé de réduire les animations dans son système
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduit ? "auto" : "smooth";      // condition ? si_vrai : si_faux
}

function aller(element) {
    element.scrollIntoView({ behavior: comportementDeDefilement(), block: "start" });
}
```

Le défilement doux peut aussi se régler une fois pour toute la page, en CSS, dans la même condition :

```css
@media (prefers-reduced-motion: no-preference) {
    html {
        scroll-behavior: smooth;       /* tous les défilements deviennent doux */
    }
}
```

Avec cette règle, `behavior: "auto"` (la valeur par défaut) suffit en JavaScript : le navigateur applique la valeur du CSS.

### `scrollIntoView`, `scrollTo`, l'ancre et `focus()`

Quatre outils donnent l'impression de faire « la même chose » mais ne s'emploient pas pareil :

| Outil | Ce qu'on lui donne | Change l'URL ? | Déplace le focus ? | Quand l'employer |
|---|---|---|---|---|
| `element.scrollIntoView(options)` | Un élément | Non | Non | Amener un élément dans la vue depuis un script |
| `window.scrollTo({ top, behavior })` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo)) | Une position en pixels depuis le haut de la page | Non | Non | Revenir en haut (`top: 0`), ou aller à une position que l'on a calculée |
| Lien d'ancre `<a href="#tarifs">` | L'`id` de l'élément, dans l'adresse | Oui : ajoute `#tarifs` et une entrée d'historique (la liste que parcourt le bouton Retour) | Seulement si la cible peut recevoir le focus ; sinon, le prochain appui sur Tab repart de la cible | Un lien de navigation qui doit être partageable et fonctionner sans JavaScript |
| `element.focus()` | Un élément qui peut recevoir le focus | Non | Oui | Rendre une zone utilisable au clavier (voir [le focus clavier](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)) |

Le **focus** désigne l'élément qui reçoit les touches du clavier. `scrollIntoView` ne le déplace pas : une personne qui navigue au clavier ou avec un lecteur d'écran (un logiciel qui lit la page à voix haute) ne saurait pas qu'on l'a emmenée ailleurs. Pour une vraie navigation, on combine donc les deux. Appeler `focus()` fait aussi défiler la page jusqu'à l'élément, d'un seul coup ; l'option `preventScroll: true` supprime ce défilement-là pour que seul le `scrollIntoView` agisse :

```javascript
// <h2 id="tarifs" tabindex="-1"> : tabindex="-1" autorise le focus par script uniquement
const titre = document.getElementById("tarifs");

titre.scrollIntoView({ behavior: comportementDeDefilement() });   // défilement (animé ou non)
titre.focus({ preventScroll: true });   // focus sans second défilement concurrent
```

`tabindex="-1"` est nécessaire parce qu'un titre n'est pas un élément qui reçoit le focus de lui-même, au contraire d'un lien ou d'un champ de formulaire : l'attribut est expliqué avec le focus clavier ([chapitre dédié](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). La documentation de `focus()` est sur [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus).

### Les pièges de `scrollIntoView`

**Un conteneur à défilement imbriqué.** Une liste de messages à hauteur fixe, avec sa propre barre de défilement, est un conteneur à défilement : `scrollIntoView` y fait défiler la liste, **mais aussi la page entière** si nécessaire, ce qui peut faire sauter la page de façon inattendue. Deux remèdes :

```javascript
const liste = document.getElementById("liste-messages");   // le conteneur qui a sa barre
const dernier = liste.lastElementChild;    // son dernier enfant : le dernier message

// Remède 1 : nearest défile le moins possible (mais peut encore déplacer la page)
dernier.scrollIntoView({ block: "nearest" });

// Remède 2 : ne faire défiler que la liste, en allant jusqu'au bas de son contenu
// scrollHeight : la hauteur totale du contenu, partie masquée comprise
liste.scrollTo({ top: liste.scrollHeight, behavior: "smooth" });
```

**Un élément qui n'est pas là.** Si l'élément n'est pas encore dans le DOM (la page charge son contenu par une requête), `getElementById` renvoie `null` (« aucune valeur ») et `null.scrollIntoView()` provoque une erreur. On attend que l'élément existe, ou on teste d'abord :

```javascript
const cible = document.getElementById("avis");   // null si l'élément n'existe pas encore

// ?. (chaînage optionnel) n'appelle la fonction que si cible n'est pas null
cible?.scrollIntoView({ behavior: "smooth" });
```

Un élément en `display: none` n'occupe aucune place dans la page : le défilement ne fait rien. Enfin, si une image ou un contenu se charge **après** le défilement et agrandit la page au-dessus de l'élément, celui-ci se retrouve décalé : réserver la place des images avec `width` et `height` évite ce décalage. La documentation de la fonction est sur [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## `visibilitychange` : savoir si la page est regardée

Un **onglet** est l'une des pages ouvertes côte à côte dans une même fenêtre du navigateur. Il est **masqué** quand l'utilisateur en affiche un autre, réduit la fenêtre, verrouille son écran ou passe à une autre application sur téléphone. Dans cet état, personne ne regarde la page : continuer à l'animer ou à interroger un **serveur** (un ordinateur distant qui répond aux demandes de la page) gaspille batterie et réseau.

Le navigateur l'indique par `document.visibilityState`, qui prend l'une de deux valeurs, et par l'événement `visibilitychange`, déclenché sur `document` à chaque bascule.

| Propriété | Valeur | Signification |
|---|---|---|
| `document.visibilityState` | `"visible"` | La page est affichée à l'écran |
| `document.visibilityState` | `"hidden"` | La page est masquée : onglet en arrière-plan, fenêtre réduite, écran verrouillé |
| `document.hidden` | `true` ou `false` | Version plus ancienne de la même information : `true` quand l'état est `"hidden"` |

```javascript
// Lecture au démarrage : un onglet ouvert en arrière-plan commence dans l'état « hidden »
console.log(document.visibilityState);      // "visible" ou "hidden"
console.log(document.hidden);               // true si l'onglet est masqué

// L'événement se pose sur document (pas sur window ni sur un élément)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("Onglet masqué : on économise");
    } else {
        console.log("Onglet de retour : on reprend");
    }
});
```

### Ce que fait le navigateur d'un onglet masqué

| Mécanisme | Dans un onglet masqué |
|---|---|
| `setTimeout` et `setInterval` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)) : les **minuteurs**, qui rappellent une fonction après un délai ou à intervalle régulier | Ralentis : en général au plus un déclenchement par seconde, parfois bien moins selon le navigateur |
| `requestAnimationFrame` (voir [le chapitre sur le canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Suspendu : la fonction n'est plus appelée du tout, jusqu'au retour de l'onglet |
| Animations CSS | Le navigateur peut réduire leur fréquence (voir [les animations CSS](/?c=langages&s=css&p=animations-css-performantes)) |
| Requêtes réseau en cours | Elles continuent : seul le code qui les relance peut être arrêté par le script |

Un minuteur ralenti n'est donc **pas** un minuteur arrêté : un sondage toutes les 5 secondes continue de solliciter le serveur. Le script doit lui-même décider de s'arrêter.

### Suspendre un sondage et reprendre au retour

Un **sondage** (*polling*) consiste à demander régulièrement au serveur s'il y a du nouveau. Deux notions nouvelles apparaissent dans l'exemple. `fetch(adresse)` envoie une **requête réseau** (une demande envoyée à un serveur, voir [l'API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) et renvoie une **promesse**, un objet qui représente un résultat qui arrivera plus tard ; `await` attend ce résultat sans bloquer la page, et `async` devant une fonction l'autorise à l'utiliser (voir [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone)). `.json()` convertit le texte de la réponse, écrit au format **JSON** (un format de texte pour échanger des données), en objet JavaScript.

```javascript
let minuteur = null;                           // minuteur actif, ou null (aucun)

async function actualiser() {
    const reponse = await fetch("/api/messages");   // demande les messages au serveur
    const messages = await reponse.json();          // lit la réponse comme du JSON
    console.log(messages.length + " messages");     // affiche leur nombre
}

function demarrerSondage() {
    if (minuteur !== null) {                   // !== : « est différent de »
        return;                                // déjà démarré : on n'en lance pas un second
    }
    actualiser();                              // rattrape ce qui a été manqué
    minuteur = setInterval(actualiser, 30000); // puis toutes les 30 000 millisecondes
}

function arreterSondage() {
    clearInterval(minuteur);                   // clearInterval annule le minuteur
    minuteur = null;                           // on note qu'il n'y en a plus
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        arreterSondage();                      // onglet masqué : plus de requêtes
    } else {
        demarrerSondage();                     // onglet revenu : on repart
    }
});

if (!document.hidden) {                        // ! : « pas » ; au chargement, ne démarrer que
    demarrerSondage();                         // si la page est vraiment visible
}
```

La garde `minuteur !== null` empêche de cumuler deux minuteurs si l'événement se déclenche deux fois de suite.

### Mettre une vidéo en pause et la reprendre

Pour une [vidéo](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) (la balise `<video>`, un lecteur intégré à la page), il faut se souvenir de **l'état avant le masquage** : si l'utilisateur avait lui-même mis la vidéo en pause, la relancer à son retour serait une surprise.

```javascript
const video = document.getElementById("demo");   // <video id="demo"> dans la page
let jouaitAvant = false;                         // la vidéo jouait-elle avant le masquage ?

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        jouaitAvant = !video.paused;             // paused : vrai si la vidéo est en pause
        video.pause();                           // met en pause
    } else if (jouaitAvant) {
        video.play().catch(() => {});            // play renvoie une promesse : refus ignoré
        jouaitAvant = false;                     // l'état est consommé
    }
});
```

### Reprendre une animation sans à-coup

`requestAnimationFrame` s'arrête seul dans un onglet masqué, il n'y a donc rien à suspendre. Mais, au retour, le temps écoulé entre deux images a pu atteindre plusieurs minutes, et un objet qui avance proportionnellement au temps **saute** brutalement. On plafonne alors la durée prise en compte.

```javascript
let position = 0;                              // position de l'objet, en pixels
const vitesse = 0.1;                           // 0,1 pixel par milliseconde
let dernier = null;                            // heure de la dernière image, ou null

function image(maintenant) {                   // maintenant : horloge du navigateur, en ms
    // durée écoulée depuis l'image précédente (0 pour la première)
    const ecoule = dernier === null ? 0 : maintenant - dernier;
    dernier = maintenant;                      // on retient l'heure de cette image
    position += vitesse * Math.min(ecoule, 100);   // Math.min : au plus 100 ms d'un coup
    requestAnimationFrame(image);              // programme l'image suivante
}

requestAnimationFrame(image);                  // lance la boucle
```

### Envoyer une dernière mesure avec `sendBeacon`

Un site qui mesure le temps passé sur une page veut envoyer sa mesure au moment où l'utilisateur part. Une requête `fetch` lancée à cet instant risque d'être interrompue par la fermeture de la page. `navigator.sendBeacon(adresse, données)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)) a été conçue pour ce cas : elle confie l'envoi au navigateur, qui le mène à terme même si la page disparaît. L'envoi est une requête de type **POST**, la méthode [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) qui envoie des données à un serveur. Elle ne renvoie qu'un booléen (`true` si l'envoi a été mis en file), jamais la réponse du serveur.

```javascript
const debut = performance.now();               // ms écoulées depuis le début du chargement

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
        return;                                // on n'envoie qu'au passage en « hidden »
    }
    // JSON.stringify convertit un objet en texte JSON ; Math.round arrondit à l'entier
    const mesure = JSON.stringify({ duree: Math.round(performance.now() - debut) });
    navigator.sendBeacon("/api/mesures", mesure);   // envoi POST sans attendre de réponse
});
```

Le serveur reçoit du texte (JSON) en POST. La mesure est **cumulative** : si l'utilisateur masque puis réaffiche l'onglet plusieurs fois, le serveur reçoit plusieurs envois et garde le dernier.

### Pourquoi pas `beforeunload` ni `unload` ?

Beaucoup de tutoriels envoient leurs mesures sur les événements `beforeunload` (la page va se fermer, un message de confirmation peut être affiché) ou `unload` (la page est en train d'être déchargée). Ils sont peu fiables :

| Événement | Quand il se déclenche | Fiabilité pour envoyer une mesure |
|---|---|---|
| `beforeunload` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)) | La page va être quittée, fermée ou rechargée | Faible : sur mobile, passer à une autre application ou fermer l'onglet n'est pas toujours annoncé ; sert surtout à prévenir d'une saisie non enregistrée |
| `unload` | La page est déchargée | Faible, et déconseillé : sa présence peut empêcher le navigateur de conserver la page entière en mémoire pour un retour arrière instantané |
| `pagehide` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)) | La page est quittée, **ou** conservée en mémoire pour un retour arrière rapide | Bonne : se déclenche aussi quand l'utilisateur navigue ailleurs ; `evenement.persisted` vaut `true` si la page est conservée |
| `visibilitychange` vers `"hidden"` | L'onglet est masqué, ce qui précède presque toujours une fermeture | La plus fiable, surtout sur mobile : c'est le dernier moment sûr |

La combinaison robuste est `visibilitychange` (passage en `"hidden"`) avec `sendBeacon`, éventuellement complétée par `pagehide`. Un seul envoi doit alors compter, d'où l'intérêt de noter qu'une mesure a déjà été envoyée si l'on ne veut pas la doubler.

```javascript
let dejaEnvoye = false;                        // true une fois la mesure envoyée

window.addEventListener("pagehide", () => {
    if (dejaEnvoye) {
        return;                                // pas de doublon avec visibilitychange
    }
    dejaEnvoye = true;
    navigator.sendBeacon("/api/mesures", "fin");   // texte simple, lu par le serveur
});
```

### Les pièges de `visibilitychange`

| Piège | Explication |
|---|---|
| Supposer la page visible au départ | Un lien ouvert dans un onglet d'arrière-plan charge la page déjà masquée, **sans événement** : lire `document.visibilityState` au démarrage |
| Mettre en pause un contenu dont l'audio est voulu | Un lecteur de musique, un podcast, une visioconférence doivent continuer onglet masqué : ne suspendre que ce qui est purement visuel |
| Relancer ce que l'utilisateur avait arrêté | Retenir l'état avant le masquage (variable `jouaitAvant`) |
| Oublier de rafraîchir au retour | Les données ont vieilli pendant l'absence : refaire une requête dès le retour |
| Un grand pas de temps dans une animation | Plafonner la durée prise en compte (`Math.min`) |
| Envoyer sur `unload` ou `beforeunload` | Peu fiable, surtout sur mobile |

## `AbortController` : annuler ce qui est en cours

Certaines opérations durent : une requête qui attend un serveur lent, un téléchargement volumineux. Parfois leur résultat n'a plus d'intérêt (l'utilisateur a changé de page, retapé sa recherche) ou elles doivent s'arrêter après un délai. `AbortController` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)) est un objet qui sert de **télécommande d'annulation** : on le crée, on en tire un **signal** que l'on donne à l'opération, et on appuie sur « annuler » quand on le décide.

| Élément | Rôle |
|---|---|
| `new AbortController()` | Crée la télécommande |
| `controleur.signal` | Un objet `AbortSignal` : le fil que l'on tend à l'opération pour qu'elle sache quand s'arrêter |
| `controleur.abort()` | Appuie sur le bouton : le signal passe à « annulé » et prévient tous ceux qui l'écoutent |
| `signal.aborted` | `true` une fois l'annulation déclenchée |
| `signal.reason` | La raison de l'annulation (voir plus bas) |

### Annuler une requête `fetch`

`fetch` accepte en second argument un objet d'options dont la clé `signal` reçoit le signal. Si le signal est annulé, la promesse rejetée (une promesse peut échouer : on dit qu'elle est **rejetée**, et l'erreur est capturée par `try` / `catch`, voir [la gestion des erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs)) porte une erreur de nom `AbortError`. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) décrit `fetch` en détail.

```javascript
const controleur = new AbortController();     // la télécommande
const signal = controleur.signal;             // le signal à donner à fetch

// Au clic sur le bouton « Annuler » (<button id="annuler">), on appuie sur la télécommande
document.getElementById("annuler").addEventListener("click", () => {
    controleur.abort();                       // la requête en cours est interrompue
});

async function telecharger() {
    try {
        // { signal } est l'écriture raccourcie de { signal: signal }
        const reponse = await fetch("/api/gros-fichier", { signal });
        console.log("Réponse reçue", reponse.ok);   // ok : vrai si le serveur a répondu
    } catch (erreur) {
        if (erreur.name === "AbortError") {         // name : le type de l'erreur (texte)
            console.log("Téléchargement annulé");   // une annulation voulue, pas un incident
        } else {
            throw erreur;                           // une vraie erreur : on la relance
        }
    }
}
```

L'annulation a deux limites. D'une part, elle interrompt **l'attente et le téléchargement côté navigateur**, pas forcément le travail du serveur : une requête qui modifie des données (une commande) a pu être traitée avant l'annulation. D'autre part, elle s'applique aussi à la lecture du contenu : un `await reponse.json()` en cours est interrompu de la même façon, avec la même erreur.

### Annuler la requête précédente : la course entre requêtes

Dans une barre de recherche qui interroge le serveur à chaque lettre, l'utilisateur tape « re » puis « rech ». Deux requêtes partent. Rien ne garantit qu'elles reviennent **dans l'ordre d'envoi** : la première peut être plus lente. Si sa réponse arrive en dernier, elle écrase l'affichage correct avec des résultats périmés. C'est une **course** (*race condition*) entre requêtes : le résultat dépend de qui arrive le premier.

```
Temps ----------------------------------------------------------------------->

SANS ANNULATION
 frappe « re »    -> requête A ----------------------------> réponse A (lente)
 frappe « rech »  ->    requête B -----------> réponse B
 affichage                                      [B]            [A]  <- résultats périmés

AVEC ANNULATION
 frappe « re »    -> requête A ------X   (abort() à la frappe suivante)
 frappe « rech »  ->    requête B -----------> réponse B
 affichage                                      [B]            (A n'affiche jamais rien)
```

La solution : garder le contrôleur de la requête en cours et l'annuler avant d'en lancer une nouvelle. Pour trouver l'adresse de recherche, `encodeURIComponent(texte)` remplace les caractères spéciaux d'un texte (espaces, `&`, accents) par des codes sûrs à mettre dans une adresse.

```html
<input id="recherche">                              <!-- champ de saisie -->
<p id="statut"></p>                                  <!-- message d'état -->
<ul id="resultats"></ul>                             <!-- liste des résultats -->
```

```javascript
const champ = document.getElementById("recherche");
const statut = document.getElementById("statut");
const resultats = document.getElementById("resultats");
let controleurActuel = null;                   // contrôleur de la requête en cours

async function chercher(texte) {
    if (controleurActuel !== null) {
        controleurActuel.abort();              // annule la requête précédente, si elle existe
    }
    controleurActuel = new AbortController();  // nouvelle télécommande pour cette recherche
    statut.textContent = "Recherche en cours...";

    try {
        const adresse = "/api/recherche?q=" + encodeURIComponent(texte);
        const reponse = await fetch(adresse, { signal: controleurActuel.signal });
        const liste = await reponse.json();    // supposons : un tableau de textes
        resultats.textContent = "";            // vide l'ancienne liste
        for (const nom of liste) {             // pour chaque résultat reçu...
            const ligne = document.createElement("li");   // ...crée un élément <li>
            ligne.textContent = nom;
            resultats.appendChild(ligne);      // l'ajoute à la liste affichée
        }
        statut.textContent = "";               // recherche terminée : plus de message
    } catch (erreur) {
        if (erreur.name === "AbortError") {
            return;                            // remplacée par une plus récente : on se tait
        }
        statut.textContent = "La recherche a échoué";
    }
}

champ.addEventListener("input", () => {        // input : à chaque modification du champ
    chercher(champ.value);                     // value : le texte actuellement tapé
});
```

La recherche annulée ne touche **ni à l'affichage ni au message d'état** : sinon elle effacerait le « Recherche en cours... » de la requête qui la remplace. En pratique, on y ajoute souvent un **debounce** (attendre une courte pause de frappe avant d'envoyer, voir [les observateurs et la limitation de fréquence](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) pour envoyer moins de requêtes ; l'annulation reste utile pour les cas où deux requêtes partent malgré tout.

### Limiter la durée avec `AbortSignal.timeout`

Un serveur qui ne répond jamais laisserait l'utilisateur attendre sans fin. `AbortSignal.timeout(millisecondes)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)) crée un signal qui s'annule tout seul au bout du délai donné, sans contrôleur à manipuler. Son erreur s'appelle `TimeoutError`, ce qui permet de la distinguer d'une annulation voulue.

```javascript
async function chargerAvecDelai() {
    try {
        // Le signal s'annule seul après 5000 millisecondes (5 secondes)
        const reponse = await fetch("/api/lent", { signal: AbortSignal.timeout(5000) });
        console.log("Reçu à temps", reponse.ok);
    } catch (erreur) {
        if (erreur.name === "TimeoutError") {       // le délai est dépassé
            console.log("Le serveur met trop de temps à répondre");
        } else if (erreur.name === "AbortError") {  // annulation voulue (ici, jamais)
            console.log("Annulé");
        } else {
            throw erreur;                           // tout autre problème (réseau coupé...)
        }
    }
}
```

Pour cumuler un délai et un bouton « Annuler », `AbortSignal.any([signalA, signalB])` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)) crée un signal annulé dès que **l'un** des deux l'est :

```javascript
const controleur = new AbortController();      // pour le bouton « Annuler »
// Annulé par controleur.abort() ou au bout de 8 secondes, selon le premier des deux
const signal = AbortSignal.any([controleur.signal, AbortSignal.timeout(8000)]);
```

### Retirer plusieurs écouteurs d'un coup

Retirer un écouteur avec `removeEventListener(nom, fonction)` exige de lui redonner **la même fonction** que celle de `addEventListener` : une fonction fléchée écrite à la volée ne peut donc jamais être retirée. Le signal règle le problème : `addEventListener` accepte l'option `signal` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)), et l'écouteur est **retiré automatiquement** quand ce signal est annulé. Un seul `abort()` nettoie tous les écouteurs qui partagent le signal, ce qui évite d'en oublier un lorsqu'un composant disparaît de la page.

```javascript
const controleur = new AbortController();      // un contrôleur pour tout le composant
const options = { signal: controleur.signal }; // l'objet d'options partagé

window.addEventListener("resize", () => {      // resize : la fenêtre change de taille
    console.log("largeur :", window.innerWidth);
}, options);                                   // 3e argument : les options, avec le signal

document.addEventListener("keydown", (evenement) => {
    console.log("touche :", evenement.key);    // key : le nom de la touche pressée
}, options);

document.addEventListener("visibilitychange", () => {
    console.log("visibilité :", document.visibilityState);
}, options);

// Plus tard, quand le composant disparaît : les trois écouteurs sont retirés d'un coup
controleur.abort();
```

### La raison d'une annulation

`abort()` accepte un argument facultatif, la **raison** de l'annulation. Elle se lit sur `signal.reason`, ce qui aide à comprendre pourquoi une opération s'est arrêtée. Une `DOMException` est le type d'erreur que le navigateur fabrique lui-même, avec un nom (`name`) et un message. Attention : l'erreur reçue par `fetch` **est cette raison même**.

| Appel | Valeur de `signal.reason` | Ce que reçoit le `catch` de `fetch` |
|---|---|---|
| `controleur.abort()` | Une erreur `DOMException` de nom `"AbortError"` | Cette erreur : `erreur.name === "AbortError"` |
| `controleur.abort("Page quittée")` | Le texte `"Page quittée"` | Le texte lui-même : il n'a pas de `name`, donc le test `erreur.name === "AbortError"` échoue |
| `AbortSignal.timeout(5000)` | Une `DOMException` de nom `"TimeoutError"` | Cette erreur : `erreur.name === "TimeoutError"` |

```javascript
const controleur = new AbortController();

fetch("/api/rapport", { signal: controleur.signal })
    .catch((erreur) => {
        console.log(erreur);                   // affiche : Page quittée
    });

controleur.abort("Page quittée");              // la raison est un texte libre
console.log(controleur.signal.aborted);        // true : le signal est annulé
console.log(controleur.signal.reason);         // Page quittée
```

Quand on fournit sa propre raison, mieux vaut donc tester **`signal.aborted`** que `erreur.name`, ou donner une vraie erreur comme raison (`new DOMException("Page quittée", "AbortError")`).

### Les pièges d'`AbortController`

Un contrôleur annulé **ne se réarme pas** : son signal reste annulé pour toujours, et toute opération à laquelle on le donne ensuite échoue immédiatement. Il faut en créer un nouveau pour chaque opération.

```javascript
let controleur = new AbortController();
controleur.abort();                            // le signal est définitivement annulé

// MAUVAIS : cette requête est refusée aussitôt, car le signal est déjà annulé
fetch("/api/donnees", { signal: controleur.signal })
    .catch(() => console.log("échec immédiat"));

controleur = new AbortController();            // BON : un contrôleur neuf
fetch("/api/donnees", { signal: controleur.signal });
```

L'autre erreur est de traiter l'annulation comme une vraie panne : afficher « Erreur réseau » alors que l'utilisateur a simplement lancé une nouvelle recherche. Le `catch` doit distinguer les deux cas, comme dans les exemples plus haut.

## Synthèse

| API | Question à laquelle elle répond | Exemple d'usage | Piège principal |
|---|---|---|---|
| `window.matchMedia(requête)` | La condition d'écran ou de réglage est-elle vraie, et change-t-elle ? | Thème sombre du système, `prefers-reduced-motion`, fenêtre étroite | Lire `.matches` une fois sans écouter `change` ; mesurer `innerWidth` en boucle ; utiliser l'obsolète `addListener` |
| `element.scrollIntoView(options)` | Comment amener cet élément dans la vue ? | Bouton « Voir les tarifs » qui défile jusqu'au titre | Forcer `smooth` malgré `prefers-reduced-motion` ; en-tête fixe qui cache la cible (`scroll-margin-top`) ; défilement de la page entière depuis un conteneur imbriqué |
| `document.visibilityState` et `visibilitychange` | L'utilisateur regarde-t-il la page ? | Suspendre un sondage ou une vidéo ; envoyer une mesure avec `sendBeacon` | Supposer la page visible au départ ; envoyer sur `unload` ; relancer ce que l'utilisateur avait arrêté |
| `AbortController` et `AbortSignal` | Comment arrêter ce qui est en cours ? | Annuler la recherche précédente ; `AbortSignal.timeout` ; retirer des écouteurs d'un coup | Réutiliser un contrôleur annulé ; traiter `AbortError` comme une vraie erreur |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Écrire `requete.addListener(...)` | Obsolète | `requete.addEventListener("change", ...)` |
| Mesurer `window.innerWidth` en boucle | Travail inutile, batterie consommée | `matchMedia` et son événement `change`, ou `ResizeObserver` |
| Lire `.matches` une fois et l'oublier | L'interface devient périmée si l'utilisateur change de thème ou tourne l'appareil | Écouter `change` quand le réglage doit être suivi |
| Une media query mal écrite | `matches` vaut `false` sans erreur ni avertissement | Garder les parenthèses : `"(max-width: 600px)"` |
| Forcer `behavior: "smooth"` | Peut rendre malade les personnes sensibles au mouvement | Lire `prefers-reduced-motion` ou laisser `auto` et régler `scroll-behavior` en CSS |
| Cible cachée par l'en-tête fixe | Le haut de la zone visible est sous la barre | `scroll-margin-top` sur les cibles |
| `scrollIntoView` dans un conteneur imbriqué | La page entière peut aussi défiler | `block: "nearest"` ou `conteneur.scrollTo(...)` |
| Élément absent du DOM ou en `display: none` | Erreur sur `null`, ou défilement sans effet | Attendre qu'il existe, tester avec `?.` |
| `focus()` qui défile brutalement | Le navigateur fait défiler la page jusqu'à l'élément | `focus({ preventScroll: true })` |
| Supposer la page visible au chargement | Un onglet ouvert en arrière-plan démarre « hidden » sans événement | Lire `document.visibilityState` au démarrage |
| Se fier à `beforeunload` ou `unload` pour envoyer des données | Non déclenchés de façon fiable, surtout sur mobile | `visibilitychange` et `sendBeacon`, éventuellement `pagehide` |
| Sondage ou animation qui tourne onglet masqué | Les minuteurs ne sont que ralentis | Arrêter au passage en `"hidden"` |
| Relancer une vidéo que l'utilisateur avait mise en pause | Surprise désagréable | Retenir l'état avant le masquage |
| Réutiliser un `AbortController` annulé | Son signal reste annulé : l'opération échoue aussitôt | Créer un contrôleur par opération |
| Afficher `AbortError` comme une panne | L'annulation est un fonctionnement normal | Reconnaître `erreur.name` (ou `signal.aborted`) et se taire |
| Annuler avec une raison texte et tester `erreur.name` | Un texte n'a pas de `name` : le test échoue | Tester `signal.aborted`, ou fournir une `DOMException` |
| Croire que l'annulation arrête le serveur | Elle ne coupe que l'attente côté navigateur | Prévoir un serveur qui supporte qu'une requête soit répétée ou abandonnée |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Préférer `@media` en CSS quand seul le style change ; réserver `matchMedia` aux décisions de script | Le CSS est plus simple et plus rapide |
| Lire l'état de `matchMedia` au démarrage **et** écouter `change` | L'état initial et les bascules sont tous deux couverts |
| Respecter `prefers-reduced-motion` pour tout défilement ou toute animation lancé par script | Accessibilité : certaines personnes ne supportent pas le mouvement |
| Poser `scroll-margin-top` sur les cibles quand un en-tête est fixe | La cible reste visible, aussi pour les liens d'ancre |
| Après un défilement vers une zone, placer le focus dessus avec `tabindex="-1"` et `focus({ preventScroll: true })` | La navigation au clavier et au lecteur d'écran suit le défilement |
| Arrêter ce qui est purement visuel quand la page est masquée, et reprendre au retour | Économie de batterie et de réseau |
| Envoyer les dernières mesures avec `sendBeacon` sur `visibilitychange` | Seul moyen fiable, y compris sur mobile |
| Annuler la requête précédente avant d'en lancer une nouvelle pour la même fonction | Pas de résultats périmés, pas de course entre requêtes |
| Donner un délai maximal aux requêtes avec `AbortSignal.timeout` | L'utilisateur n'attend jamais sans fin |
| Regrouper les écouteurs d'un composant derrière un même `signal` | Un seul `abort()` nettoie tout, rien n'est oublié |
| Traiter `AbortError` et `TimeoutError` à part dans le `catch` | Annulation voulue, délai dépassé et panne appellent chacun un message différent |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `window.matchMedia(requête)` renvoie un `MediaQueryList` : `.matches` donne la réponse actuelle, l'événement `change` (via `addEventListener`) prévient des bascules, jamais au chargement ; le CSS reste préférable quand seul le style change. `élément.scrollIntoView({ behavior, block, inline })` amène un élément dans la vue ; `scroll-margin-top` compense un en-tête fixe, `prefers-reduced-motion` interdit de forcer `smooth`, et `focus({ preventScroll: true })` déplace le focus sans second défilement. `document.visibilityState` (`"visible"` ou `"hidden"`) et l'événement `visibilitychange` sur `document` permettent de suspendre sondages, vidéos et animations ; `navigator.sendBeacon` envoie la dernière mesure, car `beforeunload` et `unload` sont peu fiables, surtout sur mobile. `new AbortController()` fournit un `signal` donné à `fetch`, à `addEventListener` ou à `AbortSignal.timeout` ; `abort()` interrompt, l'erreur se reconnaît par `error.name` (`AbortError`, `TimeoutError`), et un contrôleur annulé ne se réarme pas. |
| **Pièges à éviter** | `addListener` obsolète ; `innerWidth` mesuré en boucle ; `.matches` lu une seule fois ; `smooth` forcé ; cible cachée par l'en-tête fixe ; conteneur imbriqué qui fait défiler la page ; élément absent du DOM ; page supposée visible au départ ; envoi sur `unload` ; minuteur qui continue onglet masqué ; contrôleur annulé réutilisé ; annulation traitée comme une erreur ; raison texte qui fait échouer le test sur `error.name`. |
| **Bonnes pratiques** | CSS d'abord, `matchMedia` pour les décisions de script ; lecture initiale plus écoute de `change` ; respect de `prefers-reduced-motion` ; `scroll-margin-top` plus focus après un défilement ; arrêt puis reprise sur `visibilitychange` ; `sendBeacon` pour la dernière mesure ; annulation de la requête précédente et `AbortSignal.timeout` ; un `signal` partagé pour retirer plusieurs écouteurs ; `catch` qui distingue annulation, délai dépassé et panne. |
