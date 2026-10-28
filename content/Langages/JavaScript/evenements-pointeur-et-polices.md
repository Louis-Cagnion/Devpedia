---
order: 23
---

# Les événements pointeur et le chargement des polices (28/10/2026)

Un **événement** est un signal que le navigateur envoie quand quelque chose se produit (un appui, un déplacement, la fin d'un téléchargement) ; un **écouteur** est la fonction que l'on branche sur un événement pour qu'elle s'exécute à chaque fois. Ils sont expliqués en détail dans [le chapitre sur le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements). Ce chapitre présente deux sujets du même registre que [les API de page du navigateur](/?c=langages&s=javascript&p=api-de-page-du-navigateur) (ce chapitre-là définit ce qu'est une API) : les informations que le navigateur donne à un script sur ce que l'utilisateur fait, et sur ce que l'écran affiche vraiment. Ils partagent un piège : le script agit sur ce qu'il croit savoir, alors que la réalité (un doigt qui sort du cadre, une police qui n'est pas encore arrivée) évolue après.

| Sujet | Ce qu'il permet | Section |
|---|---|---|
| Les événements pointeur | Réagir de la même façon à une souris, un doigt et un stylet ; glisser un élément sans perdre le suivi ; gérer plusieurs doigts | [Les événements pointeur](#les-evenements-pointeur) |
| Le chargement des polices | Savoir quand une police est arrivée, pour mesurer un texte ou le dessiner avec la bonne largeur | [Le chargement des polices](#le-chargement-des-polices) |

Ce chapitre suppose connus [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions) (dont les fonctions fléchées `() => { ... }`), [les conditions](/?c=langages&s=javascript&p=conditions), [les objets](/?c=langages&s=javascript&p=objets) (la notation `{ nom: valeur }`), [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone) (promesses, `async` et `await`) et [les sélecteurs CSS](/?c=langages&s=css&p=selecteurs). Un **pixel** est le plus petit point d'un écran ; `px` est l'unité CSS qui compte les pixels. Toutes les API de ce chapitre sont disponibles dans tous les navigateurs courants (28/10/2026).

## Les événements pointeur

### Pourquoi ils existent

Un **pointeur** est tout ce qui désigne un point de l'écran : le curseur d'une **souris** (le **curseur** est la flèche affichée que la souris déplace), un **doigt** posé sur un **écran tactile** (qui détecte les contacts), un **stylet** (un crayon spécial pour tablette). Pendant longtemps, chaque appareil avait ses propres événements : `mousedown` pour la souris, `touchstart` pour le doigt. Écrire une interface qui marche partout obligeait à écrire le code deux fois. Les **événements pointeur** (*pointer events*) regroupent les trois appareils sous un même jeu de noms ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

| | Événements souris | Événements tactiles | Événements pointeur |
|---|---|---|---|
| Noms | `mousedown`, `mousemove`, `mouseup` | `touchstart`, `touchmove`, `touchend` | `pointerdown`, `pointermove`, `pointerup` |
| Appareils | Souris (et pavé tactile d'ordinateur) | Doigts uniquement | Souris, doigt, stylet |
| Plusieurs doigts | Sans objet | Une liste de contacts dans chaque événement (`event.touches`) | Un événement par doigt, reconnu par son `pointerId` |
| Position | `clientX`, `clientY` | `touches[0].clientX` (dans la liste) | `clientX`, `clientY` directement |
| Code à écrire | Un jeu | Un autre jeu | **Un seul** |

Un code écrit uniquement avec `mousedown` ne réagit pas bien à un doigt : le navigateur fabrique certes des événements souris après un toucher, dits **de compatibilité**, mais en bloc après que le doigt est levé, et sans suivre le mouvement. Les événements pointeur n'ont pas ce défaut.

> Les essayer sans téléphone : les outils de développement du navigateur (F12) savent simuler un écran tactile.

### Les événements d'un pointeur

| Événement | Se déclenche quand | Remonte aux parents (bulles) |
|---|---|---|
| `pointerdown` | Le pointeur « appuie » : bouton de souris enfoncé, doigt ou stylet qui touche l'écran | Oui |
| `pointermove` | Le pointeur bouge. Souris : même sans bouton enfoncé ; doigt : seulement en contact ; stylet : en contact ou en survol | Oui |
| `pointerup` | Le pointeur est relâché | Oui |
| `pointercancel` | Le navigateur **annule** le geste : il prend la main (défilement, zoom) ou l'appareil perd le contact. Plus aucun événement ne suit pour ce pointeur | Oui |
| `pointerover` | Le pointeur entre dans l'élément ou dans l'un de ses enfants | Oui |
| `pointerenter` | Le pointeur entre dans l'élément lui-même (une seule fois, quel que soit le nombre d'enfants traversés) | Non |
| `pointerout` | Le pointeur sort de l'élément ou entre dans l'un de ses enfants | Oui |
| `pointerleave` | Le pointeur sort de l'élément **et** de tous ses descendants | Non |
| `gotpointercapture`, `lostpointercapture` | L'élément vient d'obtenir, ou de perdre, la capture du pointeur (voir [la section sur la capture](#glisser-la-capture-du-pointeur)) | Oui |

Un événement « remonte aux parents » (*bubbling*) quand un écouteur posé sur un parent le reçoit aussi : ce mécanisme est décrit dans [la propagation des événements](/?c=langages&s=javascript&p=dom-et-evenements). Le **survol** (*hover*) est l'état d'un élément au-dessus duquel un pointeur se trouve sans appuyer ; un doigt n'a pas de survol, puisqu'il touche ou ne touche pas. D'où un ordre d'événements différent selon l'appareil :

| Appareil | Séquence autour d'un appui |
|---|---|
| Souris | `pointerover`, `pointerenter`, `pointermove` (à chaque déplacement), `pointerdown`, `pointerup`, puis `click` ; `pointerout` et `pointerleave` quand le curseur quitte l'élément |
| Doigt | `pointerover`, `pointerenter`, `pointerdown`, `pointermove`..., `pointerup`, `pointerout`, `pointerleave`, puis `click` : sans survol, l'entrée et la sortie encadrent aussitôt l'appui |
| Doigt, quand le navigateur se met à défiler | `pointerdown`, quelques `pointermove`, `pointercancel`, `pointerout`, `pointerleave` ; **pas de `pointerup`, pas de `click`** |

Le code minimal écoute les quatre événements du cycle de vie d'un pointeur. `console.log` écrit un message dans la console des outils de développement (F12) ; `document.getElementById` retrouve un élément par son `id`, son identifiant unique.

```javascript
// Un élément de la page, repéré par son id
const zone = document.getElementById("zone-test");

zone.addEventListener("pointerdown", (evenement) => {
    console.log("appui", evenement.pointerType);   // quel appareil appuie
});

zone.addEventListener("pointermove", () => {
    console.log("déplacement");        // se répète tant que le pointeur bouge
});

zone.addEventListener("pointerup", () => {
    console.log("relâché");
});

zone.addEventListener("pointercancel", () => {
    console.log("annulé par le navigateur");   // aucun pointerup ne suivra
});
```

### Les propriétés de l'événement

L'objet reçu par l'écouteur est un `PointerEvent` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)). Il porte tout ce que le navigateur sait du pointeur :

| Propriété | Valeur | Ce qu'elle dit |
|---|---|---|
| `pointerType` | `"mouse"`, `"touch"`, `"pen"` (stylet), ou `""` si l'appareil est inconnu | Quel appareil a produit l'événement |
| `pointerId` | Un nombre entier | Le numéro du pointeur : **un par doigt**. Il reste le même du `pointerdown` au `pointerup` de ce doigt |
| `isPrimary` | `true` ou `false` | Vrai pour le pointeur principal de chaque type d'appareil : la souris l'est toujours, et pour les doigts, le premier posé |
| `clientX`, `clientY` | Nombres décimaux, en pixels | Position dans la **fenêtre visible**, mesurée depuis son coin en haut à gauche |
| `pageX`, `pageY` | En pixels | Position dans la **page entière**, défilement compris |
| `pressure` | De `0` à `1` | Force d'appui. Sans capteur de pression (souris, la plupart des écrans), `0.5` pendant l'appui et `0` sinon |
| `button` | `0` pour le bouton principal | Quel bouton a changé d'état. Un doigt ou un stylet en contact donnent `0` |
| `buttons` | Un nombre (bits) | Quels boutons sont enfoncés à cet instant |

```javascript
zone.addEventListener("pointerdown", (evenement) => {
    console.log(evenement.pointerType);   // "mouse", "touch" ou "pen"
    console.log(evenement.pointerId);     // le numéro de ce pointeur
    console.log(evenement.isPrimary);     // true pour le pointeur principal
    console.log(evenement.pressure);      // force d'appui, de 0 à 1
    console.log(evenement.button);        // 0 : bouton principal (ou contact)
    console.log(evenement.clientX, evenement.clientY);   // position dans la fenêtre
});
```

Pour obtenir la position **dans l'élément** plutôt que dans la fenêtre, on soustrait la position de l'élément. `getBoundingClientRect()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)) renvoie le rectangle que l'élément occupe, mesuré dans les mêmes coordonnées que `clientX` et `clientY` : ses propriétés `left` et `top` donnent le bord gauche et le bord haut, `width` et `height` sa taille.

```javascript
zone.addEventListener("pointermove", (evenement) => {
    // Le rectangle est mesuré à chaque appel : la page a pu défiler entre-temps
    const rect = zone.getBoundingClientRect();
    const x = evenement.clientX - rect.left;   // distance au bord gauche de l'élément
    const y = evenement.clientY - rect.top;    // distance à son bord haut
    console.log(x, y);
});
```

Dans un [SVG](/?c=langages&s=html&p=svg-dans-la-page) dont la `viewBox` change l'échelle, ou dans un [canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations) dont la résolution interne diffère de la taille affichée, cette soustraction ne suffit pas : une conversion d'échelle s'ajoute, présentée dans ces chapitres (pour le SVG, `getScreenCTM`).

### `click` ou `pointerdown` ?

| | `click` | `pointerdown` |
|---|---|---|
| Quand | Après l'appui **et** le relâchement | Dès l'appui |
| Clavier | Oui : Entrée ou Espace sur un bouton le déclenchent aussi | Non |
| Appareils | Tous : souris, doigt, stylet, clavier, lecteur d'écran | Pointeurs seulement |
| Geste abandonnable | Oui : relâcher ailleurs que sur l'élément annule le clic | Non : c'est déjà parti |
| À utiliser pour | Activer un bouton ou un lien | Dessiner, glisser, réagir sans attendre le relâchement |

Un bouton qui valide une action doit réagir à `click`, sinon le clavier ne marche plus (voir [le focus clavier](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)).

### Glisser : la capture du pointeur

Un **glisser** (*drag*) est un geste en trois temps : appuyer sur un élément, bouger en gardant l'appui, relâcher. Le piège : `pointermove` est envoyé à l'élément **sous** le pointeur. Si la souris va vite et sort de l'élément, l'élément ne reçoit plus rien et reste figé, ou n'apprend jamais que le bouton a été relâché ailleurs. La **capture du pointeur** (*pointer capture*) y remédie : l'élément qui capture reçoit **tous** les événements de ce pointeur jusqu'au relâchement, où qu'il soit.

```
SANS CAPTURE                                  AVEC setPointerCapture
(l'élément ne reçoit que ce qui               (l'élément reçoit TOUT, jusqu'à
 arrive tant que le pointeur est dessus)       la fin du geste)

 pointerdown      -> élément                   pointerdown      -> élément
                                                 (+ setPointerCapture)
 pointermove      -> élément                   pointermove      -> élément
 pointermove      -> élément                   pointermove      -> élément
   le pointeur sort de l'élément                 le pointeur sort de l'élément
 pointerleave     -> élément                     (aucun pointerleave)
 pointermove      -> page ou autre élément     pointermove      -> élément
 pointerup        -> page ou autre élément     pointerup        -> élément
   l'élément ne saura jamais que                lostpointercapture -> élément
   le geste est fini : il reste « collé »         (la capture est rendue seule)
```

| Fonction ou événement | Rôle |
|---|---|
| `élément.setPointerCapture(pointerId)` | L'élément capture ce pointeur. À appeler pendant le `pointerdown` : le `pointerId` doit désigner un pointeur actif, sinon le navigateur lève une erreur |
| `élément.releasePointerCapture(pointerId)` | Rend la capture avant la fin du geste |
| `élément.hasPointerCapture(pointerId)` | `true` si cet élément capture ce pointeur |
| `gotpointercapture` | L'élément vient d'obtenir la capture |
| `lostpointercapture` | L'élément vient de la perdre, par relâchement explicite, par `pointerup`, par `pointercancel` ou parce qu'il a quitté la page |

La capture est rendue **automatiquement** à la fin du geste (`pointerup` ou `pointercancel`) : il n'y a donc pas à la libérer à la main dans le cas normal ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)). Sur un écran tactile, le navigateur capture même le doigt pour l'élément touché dès le `pointerdown` (**capture implicite**) ; avec une souris, rien n'est capturé tant qu'on ne le demande pas. Appeler `setPointerCapture` reste la bonne habitude : le même code marche pour tous les appareils.

Pendant une capture, les événements d'entrée et de sortie (`pointerenter`, `pointerleave`, `pointerover`, `pointerout`) se comportent comme si le pointeur ne quittait jamais l'élément capturant. Les éléments survolés dessous ne reçoivent rien : pour savoir ce qui se trouve sous le pointeur, il faut le demander explicitement, comme le fait l'exemple complet plus bas.

### `touch-action` : qui décide du défilement tactile ?

Sur un écran tactile, un doigt qui glisse peut signifier « fais défiler la page », « zoome » ou « déplace ma carte ». Le navigateur doit trancher **au début du geste**, d'après la propriété CSS `touch-action` de l'élément touché ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)). S'il décide de défiler, il prend la main et envoie `pointercancel` : l'élément ne reçoit plus aucun `pointermove`. Appeler `preventDefault()` dans `pointermove` n'y change rien : la décision a déjà été prise.

| Valeur | Ce que le navigateur gère sur l'élément | Usage |
|---|---|---|
| `auto` (défaut) | Défilement dans les deux sens, zoom par pincement, zoom par double appui | Tout ce qui n'est pas un geste personnalisé |
| `none` | **Rien** : tout geste arrive aux écouteurs | Zone de dessin, carte ou plan que l'on déplace du doigt |
| `pan-y` | Seulement le défilement vertical | Un curseur horizontal sur une page qui défile de haut en bas : le geste horizontal revient au script |
| `pan-x` | Seulement le défilement horizontal | Le cas symétrique |
| `pinch-zoom` | Seulement le zoom par pincement | À combiner avec `pan-x` ou `pan-y` pour garder le zoom |
| `manipulation` | Défilement et pincement, mais pas le zoom par double appui | Boutons et listes : plus de zoom intempestif |

```css
.carte {
    touch-action: none;       /* un doigt posé ici ne fait ni défiler ni zoomer */
}

.curseur-horizontal {
    touch-action: pan-y;      /* la page défile en vertical ; l'horizontal est à nous */
}
```

La valeur est lue **au début du geste** : la changer en JavaScript au milieu d'un glisser est sans effet sur ce glisser. Et `touch-action: none` posé sur une grande zone empêche de faire défiler la page en la touchant : mieux vaut le réserver à l'élément qui se glisse, et ne pas bloquer le zoom par pincement partout, car des personnes en dépendent pour lire.

### Exemple complet : glisser une carte vers une zone

Une carte se glisse vers une zone de dépôt. Si on la lâche sur la zone, elle y reste ; si on la lâche ailleurs, si le navigateur annule le geste ou si on appuie sur Échap, elle revient à sa place. Un seul doigt à la fois mène le glisser. D'abord le HTML et le CSS :

```html
<!-- La zone où l'on dépose, la carte à glisser et un message d'état -->
<div id="zone-depot" class="zone-depot">Déposer ici</div>
<div id="carte" class="carte">Glisse-moi</div>
<p id="etat">Aucun glisser en cours</p>
```

```css
.carte {
    width: 120px;
    padding: 12px;
    background: #e8eefc;
    cursor: grab;             /* main ouverte au survol, avec une souris */
    touch-action: none;       /* le navigateur ne défile ni ne zoome ici */
    user-select: none;        /* le texte de la carte ne se sélectionne pas */
}

.carte.glisse {
    cursor: grabbing;         /* main fermée pendant le glisser */
    opacity: 0.8;             /* un peu transparente : on voit la zone dessous */
}

.zone-depot {
    height: 100px;
    border: 2px dashed #999;  /* cadre en pointillés */
}

.zone-depot.survol {
    border-color: #1a4fd6;    /* cadre bleu quand le pointeur est au-dessus */
}
```

`.carte.glisse` est un [sélecteur](/?c=langages&s=css&p=selecteurs) qui vise un élément portant **à la fois** les classes `carte` et `glisse` ; `cursor` choisit la forme du curseur de la souris ; `opacity` règle la transparence (de `0`, invisible, à `1`, opaque) ; `user-select: none` interdit la sélection du texte, qui se déclencherait sinon en glissant à la souris. Le JavaScript tient l'état du glisser dans quelques variables :

```javascript
const carte = document.getElementById("carte");
const zone = document.getElementById("zone-depot");
const etat = document.getElementById("etat");

let actif = null;     // pointerId du glisser en cours, ou null s'il n'y en a pas
let posX = 0;         // position posée de la carte, en pixels
let posY = 0;
let ecartX = 0;       // écart entre le pointeur et la carte au départ
let ecartY = 0;
let nouvelleX = 0;    // position de la carte pendant le glisser
let nouvelleY = 0;
```

Trois petites fonctions en découlent. `transform: translate(x, y)` déplace un élément à l'affichage sans toucher à la mise en page (voir [le positionnement](/?c=langages&s=css&p=positionnement) et [les animations CSS](/?c=langages&s=css&p=animations-css-performantes)). Les accents graves (`` ` ``) délimitent un texte où `${x}` est remplacé par la valeur de `x`. `document.elementsFromPoint(x, y)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint)) renvoie le tableau de tous les éléments présents à ce point de la fenêtre, du plus haut au plus bas ; `includes(zone)` répond `true` si la zone en fait partie.

```javascript
function deplacer(x, y) {
    // Les accents graves insèrent x et y dans le texte : "translate(40px, 10px)"
    carte.style.transform = `translate(${x}px, ${y}px)`;
}

function sousLePointeur(x, y) {
    // Les éléments empilés à cet endroit : la zone est-elle l'un d'eux ?
    return document.elementsFromPoint(x, y).includes(zone);
}

function terminer(depose) {
    actif = null;                          // plus aucun glisser en cours
    carte.classList.remove("glisse");
    zone.classList.remove("survol");
    if (depose) {
        posX = nouvelleX;                  // la carte reste où elle a été lâchée
        posY = nouvelleY;
        etat.textContent = "Carte déposée dans la zone";
    } else {
        deplacer(posX, posY);              // retour à la position d'avant le glisser
        etat.textContent = "Carte remise à sa place";
    }
}
```

Les écouteurs reprennent les quatre événements du cycle de vie, plus la touche Échap. `classList` et `textContent` sont présentés dans [le chapitre sur le DOM](/?c=langages&s=javascript&p=dom-et-evenements) ; `classList.toggle(nom, condition)` pose la classe si la condition est vraie, la retire sinon.

```javascript
carte.addEventListener("pointerdown", (evenement) => {
    if (actif !== null) return;            // déjà un glisser : on ignore les autres doigts
    if (evenement.button !== 0) return;    // souris : bouton principal seulement
    actif = evenement.pointerId;           // on retient QUEL pointeur glisse
    ecartX = evenement.clientX - posX;     // l'écart reste constant pendant le glisser
    ecartY = evenement.clientY - posY;
    carte.setPointerCapture(actif);        // la carte reçoit tout, même hors de ses bords
    carte.classList.add("glisse");
    evenement.preventDefault();            // pas d'événements souris de compatibilité
    etat.textContent = "Glisser en cours";
});

carte.addEventListener("pointermove", (evenement) => {
    if (evenement.pointerId !== actif) return;   // pas le pointeur qui glisse
    nouvelleX = evenement.clientX - ecartX;      // la carte suit le pointeur
    nouvelleY = evenement.clientY - ecartY;
    deplacer(nouvelleX, nouvelleY);
    const dessus = sousLePointeur(evenement.clientX, evenement.clientY);
    zone.classList.toggle("survol", dessus);     // cadre bleu si le pointeur est sur la zone
});

carte.addEventListener("pointerup", (evenement) => {
    if (evenement.pointerId !== actif) return;
    // Lâchée sur la zone : dépôt ; ailleurs : retour à la place d'origine
    terminer(sousLePointeur(evenement.clientX, evenement.clientY));
});

carte.addEventListener("pointercancel", (evenement) => {
    if (evenement.pointerId === actif) terminer(false);   // geste annulé : retour
});

document.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Escape" && actif !== null) {
        carte.releasePointerCapture(actif);   // rend le suivi aux autres éléments
        terminer(false);                      // annulation voulue par l'utilisateur
    }
});
```

Ce que chaque pièce apporte :

| Pièce | Si on l'enlève |
|---|---|
| `setPointerCapture` | À la souris, un mouvement rapide sort de la carte : elle s'arrête, et le relâchement ailleurs n'arrive jamais jusqu'à elle |
| `touch-action: none` | Sur téléphone, le doigt fait défiler la page, le navigateur envoie `pointercancel`, et la carte lâche prise après quelques pixels |
| `pointercancel` écouté | La carte reste bloquée dans l'état « glisse » après une annulation par le navigateur |
| `actif` et le test de `pointerId` | Un deuxième doigt (ou un survol de souris sans appui) déplacerait la carte |
| `elementsFromPoint` | `pointerenter` sur la zone ne se déclenche pas pendant la capture : la zone ne saurait jamais qu'on la survole |
| `releasePointerCapture` sur Échap | Le doigt est encore posé : sans rendre la capture, la carte continuerait à recevoir tout le geste |
| `preventDefault()` sur `pointerdown` | Après un toucher, le navigateur enverrait en plus des événements souris de compatibilité (`mousedown`...) |

`preventDefault()` sur `pointerdown` n'empêche que ces événements de compatibilité. Il ne remplace ni `touch-action` (le défilement tactile), ni `user-select` (la sélection de texte à la souris). Chaque effet gênant a son propre remède :

| Effet gênant pendant un glisser | Remède |
|---|---|
| La page défile sous le doigt | `touch-action: none` (CSS) |
| Le texte se sélectionne à la souris | `user-select: none` (CSS) |
| Des événements souris arrivent après le toucher | `preventDefault()` sur `pointerdown` |
| Le glisser ne marche qu'à la souris ou au doigt | Ajouter un équivalent au clavier (voir [le focus clavier](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)) : un glisser seul exclut qui ne peut pas pointer |

### Plusieurs doigts en même temps

Utiliser plusieurs doigts à la fois s'appelle le **multitouch**. Chaque doigt posé crée **son propre pointeur**, avec son `pointerId`, ses propres `pointerdown`, `pointermove` et `pointerup`. Le `pointerId` est donc la clé pour suivre chaque doigt séparément. L'exemple mémorise la position de chaque doigt posé et calcule l'écart entre deux doigts, la base d'un geste de pincement.

Quelques notions de l'exemple. Une `Map` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) est une table qui associe une **clé** à une **valeur** : `set(clé, valeur)` ajoute ou remplace, `has(clé)` teste la présence, `delete(clé)` retire, `size` donne le nombre d'entrées. Les trois points `[...doigts.values()]` copient les valeurs de la Map dans un tableau, et `const [a, b] = ...` range les deux premières dans `a` et `b` (voir [le destructuring et le spread](/?c=langages&s=javascript&p=objets)). `Math.hypot(dx, dy)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)) calcule la distance entre deux points dont les positions diffèrent de `dx` et de `dy` : c'est la racine carrée de `dx` au carré plus `dy` au carré (théorème de Pythagore), la racine carrée d'un nombre étant celui qui, multiplié par lui-même, redonne ce nombre.

```html
<div id="surface" class="surface">Posez deux doigts ici</div>
<p id="info">0 pointeur posé</p>
```

```css
.surface {
    height: 200px;
    background: #e8eefc;
    touch-action: none;      /* sans cela, deux doigts font défiler ou zoomer la page */
}
```

```javascript
const surface = document.getElementById("surface");
const info = document.getElementById("info");

// Une Map associe une clé (ici le pointerId) à une valeur (ici la position du doigt)
const doigts = new Map();

function afficher() {
    let texte = doigts.size + " pointeur(s) posé(s)";   // size : nombre d'entrées
    if (doigts.size === 2) {
        const [a, b] = [...doigts.values()];             // les deux positions
        const ecart = Math.hypot(a.x - b.x, a.y - b.y);  // distance entre les deux doigts
        texte += ", écart : " + Math.round(ecart) + " px";
    }
    info.textContent = texte;
}

surface.addEventListener("pointerdown", (evenement) => {
    surface.setPointerCapture(evenement.pointerId);      // suivre ce doigt partout
    doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    afficher();
});

surface.addEventListener("pointermove", (evenement) => {
    if (!doigts.has(evenement.pointerId)) return;        // ce pointeur n'est pas posé
    doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    afficher();
});

function relacher(evenement) {
    doigts.delete(evenement.pointerId);                  // ce doigt n'est plus posé
    afficher();
}

surface.addEventListener("pointerup", relacher);
surface.addEventListener("pointercancel", relacher);     // une annulation retire le doigt
```

Retirer le doigt aussi sur `pointercancel` est essentiel : sinon la Map garderait un doigt fantôme, et `doigts.size` ne reviendrait jamais à zéro.

### `pointer-events` : laisser les clics traverser

`pointer-events` est une propriété CSS qui décide si un élément peut être la **cible** d'un pointeur ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)). Pour un élément HTML, deux valeurs comptent ; le [chapitre sur le SVG](/?c=langages&s=html&p=svg-dans-la-page) détaille les valeurs propres aux formes SVG (`all`, `stroke`...).

| Valeur | Effet |
|---|---|
| `auto` (défaut) | L'élément reçoit les pointeurs normalement |
| `none` | L'élément est **transparent** aux pointeurs : le clic ou le toucher le traverse et atteint ce qui est dessous. Il ne reçoit ni événement pointeur, ni survol (`:hover`) |

Le cas typique est un décor posé **par-dessus** du contenu cliquable, comme un voile dégradé qui fond le bas d'une liste (voir [les dégradés](/?c=langages&s=css&p=degrades)) :

```html
<div class="cadre">
    <ul class="liste">
        <li><button>Article 1</button></li>
        <li><button>Article 2</button></li>
        <li><button>Article 3</button></li>
    </ul>
    <!-- Voile décoratif, posé par-dessus le bas de la liste -->
    <div class="voile"></div>
</div>
```

```css
.cadre {
    position: relative;          /* repère de placement pour le voile */
}

.liste {
    height: 120px;
    overflow-y: auto;            /* barre de défilement verticale si le contenu déborde */
}

.voile {
    position: absolute;          /* posé par-dessus, sans prendre de place */
    left: 0;                     /* collé aux bords gauche, droit et bas du cadre */
    right: 0;
    bottom: 0;
    height: 40px;
    background: linear-gradient(transparent, #ffffff);   /* du transparent au blanc */
    pointer-events: none;        /* les clics et les touchers le traversent */
}
```

Sans `pointer-events: none`, le voile intercepterait les clics sur les boutons qu'il cache, et le défilement à la molette au-dessus de lui ne ferait plus défiler la liste ([le positionnement](/?c=langages&s=css&p=positionnement) explique `relative` et `absolute`). Trois précisions :

| Précision | Détail |
|---|---|
| Les enfants peuvent revenir | Un enfant d'un élément en `pointer-events: none` peut remettre `pointer-events: auto` : lui seul redevient cliquable |
| Le clavier n'est pas concerné | Un bouton en `none` reste atteignable par Tab et activable par Entrée. Pour désactiver un bouton, utiliser l'attribut `disabled` (voir [les formulaires](/?c=langages&s=html&p=formulaires)) |
| La recherche par position suit | `document.elementFromPoint` et `elementsFromPoint` ignorent les éléments en `none`, comme un vrai clic le ferait |

### Les pièges des événements pointeur

**Oublier `pointercancel`.** Un glisser qui ne termine que sur `pointerup` reste bloqué quand le navigateur annule le geste (défilement, appel entrant, changement d'application) : l'état « en train de glisser » ne se réinitialise jamais. Tout état posé au `pointerdown` se défait sur `pointerup` **et** `pointercancel`, ce que fait la fonction `terminer` de l'exemple.

**Compter sur `pointerleave` pendant une capture.** Il ne se déclenche pas tant que l'élément capture (voir le schéma plus haut). Pour savoir ce qui est sous le pointeur, utiliser `document.elementsFromPoint`.

**Garder la capture quand elle ne sert plus.** Elle est rendue seule à la fin du geste, mais un glisser annulé par l'utilisateur en cours de route (Échap) laisse le doigt posé : sans `releasePointerCapture`, l'élément continue de recevoir tout le geste. Et `setPointerCapture` avec un `pointerId` qui n'est plus actif lève une erreur : l'appeler pendant le `pointerdown`.

**Supposer que `mouse` existe.** Sur un téléphone, `pointerType` vaut `"touch"` : un code qui teste `pointerType === "mouse"` ne réagit à rien. Sur un ordinateur à écran tactile, souris et doigt coexistent. Raisonner par capacité, pas par appareil : `window.matchMedia("(hover: hover)")` indique si le survol existe (voir [`matchMedia`](/?c=langages&s=javascript&p=api-de-page-du-navigateur)).

**Réagir au survol seulement.** Un doigt n'a pas de survol : une infobulle qui n'apparaît qu'à `pointerenter` n'existe jamais au toucher. Prévoir un équivalent à l'appui ou au clavier.

**Le cas des nombres décimaux.** `clientX` et `clientY` peuvent avoir une partie décimale sur un écran à haute densité de pixels : les arrondir (`Math.round`) avant de s'en servir comme position de pixel entière.

## Le chargement des polices

### Pourquoi le texte change quand la police arrive

Une **police** (*font*) est le dessin des lettres : sa forme, son épaisseur (la **graisse**, `400` pour un texte normal, `700` pour du gras). Les polices installées sur l'appareil, comme Georgia ou Arial, sont immédiatement utilisables. Une **police web** est un fichier que la page télécharge, déclaré dans le CSS par la règle `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face)). Ce chapitre ne choisit pas les polices : pour cela, voir [la typographie](/?c=ui-ux&p=typographie).

La propriété `font-family` donne une **liste** : le navigateur prend la première police disponible. Pendant que la police web se télécharge, il utilise la suivante, la **police de secours** (*fallback*), ou n'affiche rien, selon le réglage `font-display`. Quand le fichier arrive, il remplace la police de secours : le texte est redessiné avec d'autres largeurs. Le **fichier de police** est ici au format WOFF2, un format compressé conçu pour le web.

```css
@font-face {
    font-family: "Lora";            /* le nom que l'on utilisera ensuite */
    src: url("/polices/lora.woff2") format("woff2");   /* adresse du fichier, et format */
    font-weight: 700;               /* cette déclaration fournit la graisse gras */
    font-display: swap;             /* voir la section suivante */
}

h2 {
    font-family: "Lora", Georgia, serif;   /* Lora, sinon Georgia, sinon serif */
    font-weight: 700;
}
```

`serif` est un nom de **famille générique** : n'importe quelle police à empattements (petits traits aux extrémités des lettres) de l'appareil. Le chargement ne démarre pas à la lecture du CSS : le navigateur ne télécharge le fichier que **lorsqu'un texte de la page en a besoin**, après avoir calculé la mise en page. Le schéma ci-dessous (valeurs d'exemple) montre ce que voit l'utilisateur, et ce qu'une mesure prise trop tôt rapporte :

```
Temps ----------------------------------------------------------------------->

Page      | première mise en page | attente du fichier ......... | mise en page 2
Texte     | police de secours (Georgia)                          | police web (Lora)
Largeur   | « Nouveau » : 61 px   |  mesure prise ICI : 61 px    | « Nouveau » : 68 px
                                      (fausse : ce n'est plus
                                       la police affichée)
```

Ce changement de largeur déplace tout ce qui suit le texte : c'est un **saut de mise en page** (*layout shift*). Il gêne la lecture, et il fausse tout code qui a **mesuré** le texte avant l'arrivée de la police.

### `font-display` : que montrer pendant l'attente ?

La propriété `font-display`, posée dans `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)), décide de ce qui s'affiche pendant le téléchargement. Elle distingue une période de **blocage** (le texte est invisible, pour éviter le saut de mise en page) et une période d'**échange** (la police de secours s'affiche, remplacée par la police web à son arrivée).

| Valeur | Pendant l'attente | Si la police arrive tard | Usage typique |
|---|---|---|---|
| `auto` | Au choix du navigateur, en général comme `block` | Idem | À éviter : comportement imprévisible |
| `block` | Texte **invisible** quelques secondes, puis police de secours | Échange à l'arrivée | Une police d'icônes, où la police de secours serait illisible |
| `swap` | Police de secours **tout de suite** | Échange à tout moment | Le texte courant : il se lit sans attendre |
| `fallback` | Texte invisible un très court instant, puis police de secours | Échange accepté seulement pendant quelques secondes | Compromis : pas de grand saut tardif |
| `optional` | Texte invisible un très court instant, puis police de secours | La police web n'est **pas appliquée** à cette page ; elle sert aux visites suivantes | Une police de confort, jamais indispensable |

Les durées exactes (« quelques secondes », « très court instant ») dépendent du navigateur. Une conséquence pour la suite : avec `swap`, `fallback` et `optional`, la police affichée change selon le moment et la connexion. Un code qui mesure ne doit donc jamais supposer laquelle est affichée : il attend l'état final, puis mesure ce qui est réellement à l'écran.

### `document.fonts` : suivre le chargement

`document.fonts` est un objet `FontFaceSet` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)) : l'ensemble des polices connues de la page, avec de quoi suivre leur chargement.

| Élément | Nature | Rôle |
|---|---|---|
| `document.fonts.ready` | Promesse | Se résout quand le chargement en cours est terminé et la mise en page à jour |
| `document.fonts.load(police)` | Fonction, renvoie une promesse | Lance le chargement de la police décrite **et** l'attend |
| `document.fonts.check(police)` | Fonction, renvoie un booléen | `true` si la police est prête, sans rien charger |
| `new FontFace(nom, source)` | Constructeur | Décrit une police en JavaScript, sans `@font-face` |
| `document.fonts.add(face)` | Fonction | Ajoute une `FontFace` à l'ensemble : le CSS peut alors l'utiliser |
| `document.fonts.status` | Texte | `"loading"` pendant un chargement, `"loaded"` sinon |
| `loadingdone`, `loadingerror` | Événements | Fin d'un lot de chargements, ou échec d'au moins un |

Une **promesse** est un objet qui représente un résultat à venir ; `await` attend ce résultat dans une fonction `async` (voir [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone)). Pour attendre toutes les polices en cours de chargement :

```javascript
async function demarrer() {
    await document.fonts.ready;        // attend que les polices en cours soient prêtes
    console.log("Polices prêtes");
}

demarrer();
```

`document.fonts.ready` attend ce qui **est déjà en cours**. Pour demander une police précise, `document.fonts.load()` prend une description en syntaxe de la propriété CSS `font` : une graisse, une taille, un nom de famille (`"700 18px Lora"`) ; un deuxième argument facultatif donne le texte à afficher, utile quand la police est découpée par plages de caractères. `check()` prend la même description.

```javascript
async function preparerTitres() {
    const police = "700 18px Lora";        // graisse, taille, famille : comme CSS font
    // true seulement si la police est chargée (ou si aucune @font-face ne la décrit)
    console.log(document.fonts.check(police));
    const faces = await document.fonts.load(police);   // lance le chargement et l'attend
    console.log(faces.length);             // nombre de polices chargées : 1 ici
    console.log(document.fonts.check(police));         // true : la police est prête
}

preparerTitres();
```

`load()` renvoie un tableau de `FontFace` : **vide** si aucune `@font-face` ne correspond (une faute dans le nom de famille ne produit aucune erreur), rejeté si le fichier n'a pas pu être téléchargé. La **graisse demandée compte** : `"18px Lora"` charge la graisse normale, pas le gras.

### L'objet `FontFace` : charger une police depuis JavaScript

Quand le nom ou l'adresse de la police ne sont connus qu'à l'exécution (un choix de l'utilisateur, une police reçue d'un serveur), `FontFace` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFace)) la déclare depuis JavaScript. Son `status` vaut `"unloaded"`, `"loading"`, `"loaded"` ou `"error"`. Un échec se capture avec `try` / `catch` (voir [la gestion des erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs)).

```javascript
async function chargerPolice() {
    // new FontFace(nom, source, options) décrit la police sans la télécharger encore
    const face = new FontFace("Lora", "url(/polices/lora.woff2)", { weight: "700" });
    try {
        await face.load();                 // télécharge ; promesse rejetée si échec
        document.fonts.add(face);          // le CSS peut maintenant utiliser « Lora »
        console.log(face.status);          // "loaded"
    } catch (erreur) {
        console.log("Police indisponible :", erreur.name);   // la police de secours reste
    }
}

chargerPolice();
```

### Réagir à chaque lot : `loadingdone`

`ready` est une promesse : elle ne sert qu'une fois. Si d'autres polices se chargent plus tard (du texte ajouté à la page, une autre langue), une promesse déjà obtenue n'en sait rien. Les événements `loadingdone` et `loadingerror` de `document.fonts` préviennent **à chaque lot** :

```javascript
document.fonts.addEventListener("loadingdone", (evenement) => {
    // fontfaces : la liste des polices qui viennent de finir de charger
    console.log(evenement.fontfaces.length + " police(s) chargée(s)");
});

document.fonts.addEventListener("loadingerror", () => {
    console.log("Au moins une police n'a pas pu être chargée");
});
```

### Mesurer un texte après la police

Plusieurs outils donnent la **largeur d'un texte**. Tous mesurent le texte **tel qu'il est affiché à cet instant** : si la police web n'est pas arrivée, ils mesurent la police de secours, sans erreur ni avertissement.

| Outil | Ce qu'il mesure | Le piège avant la police |
|---|---|---|
| `canvas.measureText(texte).width` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)) | La largeur d'un texte avec la police réglée dans `ctx.font` (voir [le canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Un nom de police non chargé n'est pas une erreur : le canvas utilise une autre police, et ne se redessine pas seul |
| `élément.getBoundingClientRect()` | La taille d'un élément HTML, avec sa police actuelle | La largeur d'un texte avec la police de secours, ou même d'un texte invisible (`block`) |
| `élément.getComputedTextLength()` | La largeur d'un `<text>` SVG (voir [le SVG](/?c=langages&s=html&p=svg-dans-la-page)) | Même effet : le fond ajusté à la mauvaise largeur |

Le remède est le même pour tous : **attendre la police, puis mesurer**. L'exemple ajuste le fond d'une étiquette SVG à la largeur de son texte. Le `<rect>` est le fond ; `rx` arrondit ses coins ; le texte est écrit en gras dans la police `Lora`.

```html
<svg id="badge" viewBox="0 0 200 60" width="200" height="60">
    <!-- Le fond : sa largeur sera calculée par le script (0 au départ) -->
    <rect id="fond-etiquette" x="10" y="10" width="0" height="36" rx="6" fill="#e8eefc"/>
    <!-- Le texte, en Lora gras 18 px ; x="22" laisse 12 de marge après le fond -->
    <text id="etiquette" x="22" y="34" font-family="Lora, Georgia, serif"
          font-weight="700" font-size="18">Nouveau</text>
</svg>
```

```javascript
const etiquette = document.getElementById("etiquette");
const fond = document.getElementById("fond-etiquette");
const MARGE = 12;                          // espace de chaque côté du texte, en unités

function ajusterFond() {
    const largeur = etiquette.getComputedTextLength();   // largeur du texte tel qu'affiché
    fond.setAttribute("width", largeur + 2 * MARGE);   // le fond dépasse de chaque côté
}

async function demarrer() {
    try {
        // Demande la police exacte du texte (gras, 18 px) et attend son arrivée
        await document.fonts.load("700 18px Lora");
    } catch (erreur) {
        console.log("Police non chargée : on mesure la police de secours");
    }
    ajusterFond();                         // mesure la police réellement affichée
}

demarrer();
```

Dans le `catch`, la mesure a quand même lieu : si le chargement échoue, c'est la police de secours qui est affichée, et la mesurer donne la bonne largeur. Le principe est de mesurer **ce qui est à l'écran**, pas la police que l'on souhaiterait.

Un canvas pose un problème supplémentaire : c'est une image en pixels, qui ne se met **jamais à jour toute seule**. Un texte dessiné avec la police de secours le reste, même après l'arrivée de la police web. On attend donc la police avant de dessiner, et on redessine à chaque lot de polices :

```javascript
// <canvas id="affiche" width="200" height="60"> : la zone de dessin
const canvas = document.getElementById("affiche");
const ctx = canvas.getContext("2d");      // ctx : l'objet qui dessine dans le canvas

async function dessiner() {
    const police = "700 24px Lora";
    // Un échec est ignoré : on dessinera alors avec la police de secours
    await document.fonts.load(police).catch(() => {});
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // efface l'image précédente
    ctx.font = police;                                  // même syntaxe que CSS font
    const largeur = ctx.measureText("Soldes").width;    // largeur du texte avec cette police
    ctx.fillStyle = "#e8eefc";
    ctx.fillRect(10, 10, largeur + 20, 40);             // fond : x, y, largeur, hauteur
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText("Soldes", 20, 38);                     // texte, base au point (20, 38)
}

dessiner();
document.fonts.addEventListener("loadingdone", dessiner);   // redessine après chaque lot
```

Pour un **élément HTML** dont la taille doit suivre le texte quelle que soit la cause du changement (police, langue, fenêtre), un `ResizeObserver` (voir [les observateurs](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) rappelle le script à chaque variation, sans qu'il ait à attendre les polices lui-même.

### Les pièges du chargement des polices

**Mesurer trop tôt.** Une mesure lancée dès le chargement du script, ou à `DOMContentLoaded` (la fin de la lecture du HTML), précède souvent l'arrivée de la police : largeur fausse, fond mal ajusté, texte qui déborde de son cadre. Mesurer après `await document.fonts.load(...)`.

**Croire que `ready` suffit.** `ready` ne couvre que ce qui est **déjà en cours**. Appelé très tôt, avant que le navigateur ait calculé la mise en page et découvert qu'un texte a besoin de la police, il peut être déjà résolu alors que rien n'est arrivé :

```javascript
// Script exécuté très tôt dans la page
document.fonts.ready.then(() => {
    // MAUVAIS : peut s'exécuter avant même que le téléchargement ait été demandé
    console.log(document.fonts.status);    // "loaded", alors que Lora n'est pas arrivée
});

// BON : demander la police explicitement, puis attendre
document.fonts.load("700 18px Lora").then(() => {
    console.log("Lora est arrivée");
});
```

**Un nom de police faux ou absent ne produit aucune erreur.** `document.fonts.load("700 18px Lroa")` (faute de frappe) se résout avec un tableau vide, et `document.fonts.check("700 18px Lroa")` renvoie `true` : aucune police déclarée ne correspond, donc il n'y a rien à attendre. Le texte s'affiche dans la police de secours, en silence. Vérifier que `faces.length` n'est pas `0`, et que le nom est identique à celui de `@font-face`.

**Un chargement qui échoue.** Fichier introuvable, réseau coupé : `load()` rejette sa promesse, l'événement `loadingerror` se déclenche et le texte reste dans la police de secours. Sans `try` / `catch` autour de l'`await`, l'erreur interrompt la fonction **avant la mesure**, qui n'a alors jamais lieu. De plus, `ready` ne signale pas l'échec : c'est `load()` (ou `loadingerror`) qu'il faut écouter pour le savoir.

**Demander la mauvaise graisse.** `load("16px Lora")` ne charge que la graisse normale ; un titre en gras (`700`) reste en attente. Demander exactement la combinaison graisse, style (`italic`) et taille que le texte utilise.

**Régler `ctx.font` avec une autre police que celle de la page.** La mesure ne correspond plus à l'affichage (voir [le piège du canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)).

## Synthèse

| Besoin | Outil | Piège principal |
|---|---|---|
| Réagir de la même façon à souris, doigt, stylet | `pointerdown`, `pointermove`, `pointerup` | Supposer que `pointerType` vaut `"mouse"` |
| Reconnaître chaque doigt | `pointerId` (une `Map` pointerId vers position) | Oublier de retirer le doigt sur `pointercancel` |
| Glisser sans perdre le suivi | `setPointerCapture` sur `pointerdown` | Compter sur `pointerleave`, qui ne vient pas pendant la capture |
| Empêcher le défilement tactile pendant un geste | `touch-action: none` (ou `pan-y`, `pan-x`) | `preventDefault()` seul n'y suffit pas ; valeur lue au début du geste |
| Savoir ce qui est sous le pointeur | `document.elementsFromPoint(x, y)` | Un élément en `pointer-events: none` en est absent |
| Laisser un décor traversé par les clics | `pointer-events: none` | Ne désactive pas le clavier : `disabled` pour un vrai bouton |
| Éviter le saut de mise en page d'une police | `font-display` dans `@font-face` | `auto` : comportement imprévisible |
| Attendre une police précise | `await document.fonts.load("700 18px Lora")` | La graisse demandée doit correspondre à celle du texte |
| Savoir si les polices en cours sont prêtes | `await document.fonts.ready` | Déjà résolue si rien n'est encore demandé |
| Réagir à chaque lot de polices | `loadingdone`, `loadingerror` | Une promesse déjà obtenue ne se déclenche qu'une fois |
| Mesurer un texte | `measureText`, `getBoundingClientRect`, `getComputedTextLength` | Mesure la police de secours si la police web n'est pas arrivée |
| Charger une police depuis le script | `new FontFace(...)`, `face.load()`, `document.fonts.add(face)` | Capturer l'échec : la police de secours reste |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Écrire le code deux fois, avec `mousedown` et `touchstart` | Double code, comportements différents, événements de compatibilité qui se superposent | `pointerdown`, `pointermove`, `pointerup` |
| Ne pas écouter `pointercancel` | Le glisser reste bloqué quand le navigateur reprend la main | Défaire l'état sur `pointerup` **et** `pointercancel` |
| Oublier `touch-action` | Sur téléphone, le doigt fait défiler la page : `pointercancel` après quelques pixels | `touch-action: none` (ou `pan-y`, `pan-x`) sur l'élément qui se glisse |
| `touch-action: none` sur de grandes zones | La page ne défile plus quand on la touche | Le réserver à l'élément qui se glisse |
| Compter sur `preventDefault()` pour le défilement | La décision est prise avant les événements `pointermove` | `touch-action` en CSS |
| Ne pas capturer le pointeur à la souris | Un mouvement rapide sort de l'élément, le glisser s'interrompt | `setPointerCapture(evenement.pointerId)` sur `pointerdown` |
| Capturer un pointeur qui n'est plus actif | Le navigateur lève une erreur | Capturer pendant le `pointerdown` |
| Garder la capture après une annulation par Échap | Le doigt est encore posé : l'élément reçoit encore le geste | `releasePointerCapture` |
| Attendre `pointerleave` ou `pointerenter` ailleurs pendant une capture | Ils ne se déclenchent pas pour les autres éléments | `document.elementsFromPoint(x, y)` |
| Réagir à un seul pointeur sans tester `pointerId` | Un deuxième doigt, ou le survol de la souris, perturbe le glisser | Retenir `pointerId` et ignorer les autres |
| Tester `pointerType === "mouse"` comme règle générale | Un téléphone n'a pas de souris ; un ordinateur tactile a les deux | Raisonner par capacité (`matchMedia("(hover: hover)")`) |
| Prévoir un survol sans équivalent au toucher | Un doigt n'a pas de survol | Un équivalent à l'appui ou au clavier |
| Réserver le glisser au pointeur | Une personne qui n'utilise que le clavier est exclue | Un équivalent au clavier |
| `pointer-events: none` pour « désactiver » un bouton | Le clavier l'active encore | L'attribut `disabled` |
| Mesurer un texte avant la police | Largeur de la police de secours | `await document.fonts.load(...)`, puis mesurer |
| Se fier à `document.fonts.ready` appelé très tôt | Déjà résolue si aucune police n'a encore été demandée | `document.fonts.load("700 18px Lora")` |
| Croire qu'un nom de police faux produit une erreur | Aucun message : `load()` rend un tableau vide, `check()` répond `true` | Vérifier `faces.length` et la correspondance avec `@font-face` |
| Ne pas protéger `await document.fonts.load()` | Un échec de téléchargement interrompt la fonction avant la mesure | `try` / `catch`, puis mesurer quand même |
| Ne pas demander la bonne graisse | `load("16px Lora")` ne charge pas le gras | Même graisse, style et taille que le texte |
| Dessiner un canvas une fois | L'image ne se met jamais à jour : le texte reste dans la police de secours | Attendre la police, redessiner sur `loadingdone` |
| Laisser `font-display: auto` | Texte invisible ou saut de mise en page imprévisibles | `swap` pour le texte courant ; `optional` pour une police de confort |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Employer les événements pointeur pour tout geste (glisser, dessiner, pincer) | Un seul code pour souris, doigt et stylet |
| Garder `click` pour activer un bouton ou un lien | Le clavier et les lecteurs d'écran l'activent aussi |
| Capturer le pointeur dès `pointerdown` pour un glisser | Le suivi continue même hors de l'élément |
| Défaire l'état du glisser dans une fonction unique appelée par `pointerup`, `pointercancel` et Échap | Aucun chemin ne laisse l'interface bloquée |
| Retenir le `pointerId` du glisser et ignorer les autres | Un seul geste à la fois, sans interférence |
| Poser `touch-action` en CSS dès la création de l'élément | Le navigateur lit la valeur au début du geste |
| Ajouter une alternative au clavier à tout glisser | Accessibilité : un geste de pointeur n'est pas à la portée de tous |
| Utiliser `pointer-events: none` pour les décors superposés, `disabled` pour les boutons inactifs | Les clics traversent le décor ; le clavier est bien coupé sur le bouton |
| Choisir `font-display` explicitement, `swap` pour le texte courant | Pas de texte invisible, pas de comportement du navigateur à deviner |
| Demander la police précise avec `document.fonts.load("graisse taille famille")` avant de mesurer | La promesse porte sur la police voulue, pas seulement sur ce qui est déjà en cours |
| Protéger l'attente par `try` / `catch` et mesurer quand même | La police de secours affichée est elle aussi mesurable |
| Mesurer ce qui est affiché, jamais ce que l'on souhaiterait afficher | La mesure correspond à l'écran |
| Redessiner un canvas sur `loadingdone` | Le canvas ne se met pas à jour seul |
| Préférer `ResizeObserver` pour un élément HTML dont la taille doit suivre son texte | Il couvre toutes les causes de changement, polices comprises |
| Tester avec la police bloquée ou lente (réseau limité dans les outils de développement) | Le saut de mise en page n'apparaît qu'avec une connexion lente |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Les événements pointeur (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`) regroupent souris, doigt et stylet : `pointerType` (`mouse`, `touch`, `pen`), `pointerId` (un par doigt), `isPrimary`, `clientX` et `clientY`, `pressure`. `setPointerCapture` fait suivre tout le geste à un élément, même hors de ses bords, et se rend seule à la fin ; `touch-action` (`none`, `pan-y`, `pan-x`) laisse le script, et non le navigateur, gérer le geste tactile ; `pointer-events: none` rend un élément transparent aux clics. Une police web arrive après le premier affichage : le texte change alors de largeur. `font-display` règle ce qui s'affiche pendant l'attente ; `document.fonts.ready` attend les polices en cours, `document.fonts.load("graisse taille famille")` en demande une et l'attend, `check` interroge sans charger, `FontFace` et `document.fonts.add` chargent depuis JavaScript, `loadingdone` prévient à chaque lot. `measureText`, `getBoundingClientRect` et `getComputedTextLength` mesurent la police affichée à cet instant : on attend la police avant de mesurer ou de dessiner. |
| **Pièges à éviter** | `pointercancel` non écouté ; `touch-action` oublié (le doigt fait défiler la page) ; `preventDefault()` pris pour un remède au défilement ; `pointerleave` attendu pendant une capture ; capture non rendue après Échap ; `pointerType === "mouse"` supposé ; glisser réservé au pointeur ; `pointer-events: none` pour désactiver un bouton ; mesure avant la police ; `ready` appelé trop tôt ; nom de police faux sans erreur ; échec de chargement non géré ; mauvaise graisse demandée ; canvas dessiné une seule fois. |
| **Bonnes pratiques** | Un seul code pour tous les pointeurs ; `click` pour activer, `pointerdown` pour glisser ; capture au `pointerdown`, état défait sur `pointerup`, `pointercancel` et Échap ; `touch-action` posé en CSS ; alternative au clavier ; `font-display: swap` pour le texte courant ; `document.fonts.load` précis suivi de `try` / `catch` avant toute mesure ; mesurer ce qui est affiché ; redessiner un canvas sur `loadingdone` ; `ResizeObserver` pour un élément HTML. |
