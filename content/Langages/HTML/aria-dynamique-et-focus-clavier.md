---
order: 8
---

# ARIA dynamique et gestion du focus au clavier

Le chapitre [Attributs data-* et accessibilité (ARIA)](/?c=langages&s=html&p=attributs-data-et-accessibilite) a présenté `aria-label` et `aria-expanded`. **ARIA** (*Accessible Rich Internet Applications*) est un jeu d'[attributs](/?c=langages&s=html&p=structure-dun-document) [HTML](/?c=langages&s=html&p=html) qui décrivent à une **technologie d'assistance** ce que la page ne dit pas d'elle-même. Une technologie d'assistance est un logiciel ou un matériel qui aide une personne en situation de handicap à utiliser un ordinateur ; la plus courante est le **lecteur d'écran**, qui lit la page à voix haute ou l'affiche en braille.

Ce chapitre traite deux situations que le chapitre précédent n'aborde pas : la page qui change après son chargement (un message apparaît, une zone se bloque), et l'utilisateur qui n'a que le clavier. Pour lui, le **focus** est l'élément qui reçoit les touches à un instant donné (un lien, un bouton, un champ). La touche **Tab** déplace le focus vers l'élément interactif suivant (Maj+Tab vers le précédent) ; un élément est **interactif** quand on peut l'activer ou le remplir.

Les exemples de code supposent connus [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements), [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions), [les boucles](/?c=langages&s=javascript&p=boucles), [les tableaux](/?c=langages&s=javascript&p=tableaux) et [les conditions](/?c=langages&s=javascript&p=conditions) (dont les opérateurs `?.` et `??`) en [JavaScript](/?c=langages&s=javascript&p=javascript), ainsi que les balises [`<p>` et `<ul>`](/?c=langages&s=html&p=balises-de-texte), [`<div>`](/?c=langages&s=html&p=semantique-html5) et [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite).

## Du HTML à la technologie d'assistance

Le navigateur (le logiciel qui affiche les pages web) transforme le HTML en [DOM](/?c=langages&s=javascript&p=dom-et-evenements). Il applique les styles écrits en [CSS](/?c=langages&s=css&p=css) pour l'affichage. À partir du DOM, il construit aussi l'**arbre d'accessibilité** : une liste simplifiée des éléments avec, pour chacun, son nom, son **rôle** (ce qu'il est : bouton, lien, onglet...) et son état. C'est cet arbre, et non l'écran, que la technologie d'assistance lit.

```
HTML --> DOM --+--> affichage à l'écran (avec les styles)
               |
               +--> arbre d'accessibilité --> lecteur d'écran
                    (nom, rôle, état)

aria-* et role : modifient l'arbre d'accessibilité, pas l'écran
inert          : bloque clic et focus ET retire de l'arbre, l'écran ne change pas
display: none  : retire de l'écran, donc aussi de l'arbre
```

## `aria-live` : annoncer un changement sans déplacer le focus

Un lecteur d'écran ne lit qu'un endroit de la page à la fois. Si un texte change ailleurs (« 12 résultats trouvés »), il ne le dit pas. `aria-live` déclare une **région live** : une zone dont les changements de contenu sont annoncés, sans que le focus y aille.

| Valeur | Effet | Quand l'utiliser |
|---|---|---|
| `off` (défaut) | Rien n'est annoncé, sauf si le focus est dans la zone | Mises à jour fréquentes et non essentielles (score en direct) |
| `polite` | Annoncé au prochain moment calme (fin de la phrase en cours, pause de frappe) | Le cas général : résultats, « Enregistré » |
| `assertive` | Annoncé tout de suite, en pouvant interrompre ce qui est lu | Urgence seulement : temps presque écoulé |

```html
<!-- La région existe dès le chargement de la page, et elle est VIDE -->
<p id="statut" aria-live="polite"></p>
```

```javascript
// Retrouve la région par son identifiant
const statut = document.getElementById("statut");
// Le texte change : le lecteur d'écran l'annonce, le focus ne bouge pas
statut.textContent = "12 résultats trouvés";
```

Les annonces ne portent que sur un **changement** d'une région déjà connue du navigateur. Créer la région avec son contenu ne produit donc rien à annoncer :

```javascript
// Récupère le conteneur de messages : un <div id="conteneur"> déjà présent dans la page
const conteneur = document.getElementById("conteneur");

// MAUVAIS : la région naît avec son texte, il n'y a aucun changement à annoncer
conteneur.innerHTML = '<p aria-live="polite">12 résultats trouvés</p>';

// BON : la région `statut` existait déjà, vide ; on ne change que son texte
statut.textContent = "12 résultats trouvés";
```

Le plus fiable est de mettre la région dans le HTML d'origine ; la créer en JavaScript exige d'attendre avant de la remplir, et le comportement varie selon le navigateur et le lecteur d'écran, comme le détaille [le guide des régions live](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) de MDN (*MDN Web Docs*, la documentation de référence du web éditée par Mozilla). Par défaut, seule la partie modifiée est lue ; [`aria-atomic="true"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic) fait relire toute la région.

## `aria-current` : marquer l'élément courant d'un ensemble

Dans un groupe d'éléments liés (liens `<a>` d'une zone de navigation [`<nav>`](/?c=langages&s=html&p=semantique-html5), étapes d'un parcours), l'un d'eux est « le courant ». Un style visuel (gras, soulignement) ne dit rien à un lecteur d'écran : `aria-current` annonce cette information. Un seul élément par ensemble porte la marque.

| Valeur | Désigne | Exemple |
|---|---|---|
| `page` | La page courante d'un ensemble de pages | Lien de la page affichée dans un menu |
| `step` | L'étape courante d'un processus | Étape 2 d'un parcours de commande |
| `location` | L'emplacement courant dans un environnement | Élément mis en évidence dans un schéma |
| `date` | La date courante d'un ensemble de dates | Aujourd'hui dans un calendrier |
| `time` | L'heure courante d'un ensemble d'heures | Créneau en cours dans un horaire |
| `true` | L'élément courant, sans précision | Aucune valeur ci-dessus ne convient |
| `false` (défaut) | Pas l'élément courant | Équivaut à l'absence de l'attribut |

```html
<!-- <nav> : zone de navigation ; aria-label : son nom, comme vu au chapitre précédent -->
<nav aria-label="Navigation principale">
    <ul>
        <li><a href="/accueil">Accueil</a></li>
        <!-- aria-current="page" : le lecteur d'écran dit « page courante » pour ce lien -->
        <li><a href="/cours" aria-current="page">Cours</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
</nav>
```

Un [sélecteur d'attribut](/?c=langages&s=css&p=selecteurs) CSS peut lire `aria-current` pour styler le lien courant :

```css
/* Le sélecteur d'attribut lit aria-current : une seule source pour le style et le sens */
nav a[aria-current="page"] {
    font-weight: bold;                 /* texte en gras */
    border-bottom: 3px solid #1a4fd6;  /* trait bleu de 3 pixels sous le lien */
}
```

```javascript
// Déplace la marque quand la navigation change sans recharger la page
function marquerCourant(nouveau) {
    // Cherche le lien actuellement marqué dans la navigation
    const ancien = document.querySelector('nav [aria-current="page"]');
    // Retire sa marque (le `?.` ne fait rien s'il n'y en avait aucun)
    ancien?.removeAttribute("aria-current");
    // Pose la marque sur le nouveau lien
    nouveau.setAttribute("aria-current", "page");
}
```

Pour un onglet, une option de liste ou une ligne de tableau, la marque correcte est `aria-selected` (voir plus bas), pas `aria-current`.

## `role` : dire ce qu'est un élément quand le HTML ne le dit pas

L'attribut `role` fixe le rôle d'un élément dans l'arbre d'accessibilité. **Première règle d'ARIA** : si un élément HTML natif existe pour le besoin, on l'utilise au lieu d'un `role` (voir la « règle d'or » du [chapitre précédent](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Un `role` change ce qui est annoncé, jamais le comportement : le clavier reste à coder.

| Besoin | Élément natif à préférer | `role` seulement s'il n'existe aucun natif |
|---|---|---|
| Bouton | [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) | `role="button"` |
| Lien | [`<a href>`](/?c=langages&s=html&p=liens-et-images) | `role="link"` |
| Zone de navigation | [`<nav>`](/?c=langages&s=html&p=semantique-html5) | `role="navigation"` |
| Message urgent apparu dynamiquement | Aucun | `role="alert"` |
| Message d'état discret | Aucun | `role="status"` |
| Onglets | Aucun | `tablist`, `tab`, `tabpanel` |

| Rôle | Signification | Comportement live implicite |
|---|---|---|
| `alert` | Message important et urgent | `aria-live="assertive"` et `aria-atomic="true"` |
| `status` | Information utile, pas urgente | `aria-live="polite"` et `aria-atomic="true"` |
| `tablist` | Conteneur d'un groupe d'onglets | Aucun |
| `tab` | Un onglet, qui affiche un panneau | Aucun |
| `tabpanel` | Le contenu associé à un onglet | Aucun |

```html
<!-- Deux régions vides dès le chargement, chacune avec son rôle -->
<div id="erreur" role="alert"></div>
<div id="enregistrement" role="status"></div>
```

```javascript
// Interrompt la lecture en cours : réservé à ce qui est urgent
document.getElementById("erreur").textContent = "Adresse e-mail invalide";
// Annoncé au prochain moment calme, sans interrompre
document.getElementById("enregistrement").textContent = "Brouillon enregistré";
```

`role="alert"` ne s'applique qu'à du texte (jamais à un lien ou un bouton), s'utilise avec parcimonie, et vise un contenu affiché dynamiquement, pas un message déjà présent au chargement de la page ([page MDN du rôle `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)). Les rôles d'onglets sont mis en œuvre plus bas.

## `inert` : rendre une zone morte

`inert` est un attribut **booléen** (sa seule présence l'active, il n'a pas de valeur : `<div inert>`). Il rend l'élément et tous ses descendants **inertes** : non cliquables, non focalisables (donc sautés par Tab), non sélectionnables, introuvables par la recherche du navigateur, et absents de l'arbre d'accessibilité. Ils restent visibles à l'écran. L'attribut est disponible dans tous les navigateurs courants depuis avril 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)).

Son cas d'usage type est l'arrière-plan d'une **boîte de dialogue modale** : une fenêtre affichée par-dessus la page, qui bloque tout le reste tant qu'elle est ouverte. Le natif existe : la balise [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) ouverte par sa méthode `showModal()` (une méthode est une fonction attachée à un élément) rend le reste de la page inerte, et gère aussi la touche Échap et le focus initial. Pour un panneau qui n'est pas un `<dialog>` (ici un panneau latéral [`<aside>`](/?c=langages&s=html&p=semantique-html5)), on pose `inert` soi-même :

```html
<!-- Tout l'arrière-plan est regroupé dans un seul conteneur -->
<div id="page">
    <button id="ouvrir">Ouvrir le panneau</button>
    <p>Contenu de la page.</p>
</div>

<!-- Le panneau est HORS de #page : sinon il deviendrait inerte avec elle -->
<!-- hidden : attribut booléen qui cache le panneau tant qu'il n'est pas ouvert -->
<aside id="panneau" aria-label="Réglages" hidden>
    <button id="fermer">Fermer</button>
</aside>
```

```css
/* Signal visuel : sans lui, rien n'indique qu'une zone est devenue morte */
[inert] { opacity: 0.5; }
```

```javascript
// Retrouve les quatre éléments par leur identifiant
const page = document.getElementById("page");
const panneau = document.getElementById("panneau");
const ouvrir = document.getElementById("ouvrir");
const fermer = document.getElementById("fermer");

ouvrir.addEventListener("click", () => {
    page.inert = true;        // la propriété JavaScript `inert` pose l'attribut : page bloquée
    panneau.hidden = false;   // affiche le panneau (`hidden` : attribut qui cache l'élément)
    fermer.focus();           // place le focus dans le panneau, hors de la zone inerte
});

fermer.addEventListener("click", () => {
    page.inert = false;       // la page redevient utilisable
    panneau.hidden = true;    // cache le panneau
    ouvrir.focus();           // rend le focus au bouton qui avait ouvert le panneau
});
```

Trois mécanismes « cachent » quelque chose, mais pas de la même façon. `display: none` est une propriété [CSS](/?c=langages&s=css&p=css) qui retire l'élément de l'affichage ; `hidden` produit le même effet par défaut ; `aria-hidden="true"` retire l'élément de l'arbre d'accessibilité seulement.

| | `inert` | `aria-hidden="true"` | `display: none` ou `hidden` |
|---|---|---|---|
| Visible à l'écran | Oui | Oui | Non |
| Atteignable par Tab / focalisable | Non | **Oui**, reste focalisable | Non |
| Cliquable | Non | Oui | Non |
| Lu par le lecteur d'écran | Non | Non | Non |

`aria-hidden="true"` sur une zone qui contient des éléments focalisables crée donc un piège : le focus peut entrer sur un élément que le lecteur d'écran n'expose plus ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)). Pour bloquer un arrière-plan, `inert` est le bon outil.

## `:focus-visible` : l'anneau de focus, seulement quand il aide

L'**anneau de focus** est le contour que le navigateur dessine autour de l'élément qui a le focus, pour que l'utilisateur au clavier voie où il se trouve. C'est un `outline` : une propriété CSS qui trace un trait autour d'un élément sans changer sa taille. Les [pseudo-classes](/?c=langages&s=css&p=selecteurs) `:focus` et `:focus-visible` ciblent l'élément focalisé : la première toujours, la seconde seulement quand le navigateur juge que le focus doit être rendu visible.

| Situation | `:focus` | `:focus-visible` |
|---|---|---|
| Tab jusqu'à un bouton | S'applique | S'applique |
| Clic de souris sur un bouton | S'applique | En général non |
| Clic dans un champ de saisie | S'applique | S'applique (le navigateur signale le focus dans un champ) |

```css
/* MAUVAIS : supprime l'anneau pour tout le monde, le clavier ne voit plus où il est */
button:focus { outline: none; }

/* BON : un anneau net, seulement quand le navigateur juge qu'il aide */
button:focus-visible {
    outline: 3px solid #1a4fd6;  /* trait plein bleu foncé de 3 pixels */
    outline-offset: 2px;         /* écarte le trait de 2 pixels, pour qu'il ne colle pas */
}
```

Supprimer l'indicateur de focus sans le remplacer rend la page inutilisable au clavier : c'est contraire au critère 2.4.7 « Focus visible » (niveau AA) des WCAG, les règles d'accessibilité web de référence ([critère](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [niveaux de conformité](/?c=ui-ux&p=accessibilite-ux)). Le remplaçant doit aussi être bien contrasté, au moins 3 contre 1 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)) ; les [ratios de contraste](/?c=ui-ux&p=couleur-et-contraste) sont détaillés dans leur chapitre.

## Un seul arrêt Tab dans un groupe : le « roving tabindex »

Dans une barre d'**onglets** (une rangée de boutons dont chacun affiche un panneau de contenu), laisser chaque onglet atteignable par Tab coûte un appui par onglet pour la traverser : dix onglets, dix appuis. La convention est de traiter le groupe comme **un seul arrêt de Tab** (un endroit où le focus s'arrête) et de circuler dedans avec les flèches. La technique s'appelle *roving tabindex* (« tabindex itinérant ») et repose sur l'attribut `tabindex`, qui règle si un élément peut recevoir le focus et s'il est atteignable par Tab :

| `tabindex` | Focus par clic ou par `.focus()` | Atteignable par Tab |
|---|---|---|
| Absent | Seulement si l'élément est natif interactif (bouton, lien, champ) | Oui, si natif |
| `0` | Oui | Oui, dans l'ordre du HTML |
| `-1` | Oui | **Non** |
| Positif (`1`, `2`...) | Oui | Oui, mais avant tous les autres : l'ordre du HTML est bouleversé, à éviter |

```
Sans roving tabindex (tous les onglets en tabindex="0") :

  Tab -> [ HTML ] -Tab-> [ CSS ] -Tab-> [ JS ] -Tab-> [ panneau ] -Tab-> suite de la page

Avec roving tabindex (seul l'onglet actif en tabindex="0") :

  Tab -> [ HTML ] -----------------------Tab------------> [ panneau ] -Tab-> suite de la page
           ^   |  flèches droite/gauche, Home, Fin
           |   v
        [ CSS ]  [ JS ]   (tabindex="-1" : focalisables par script, sautés par Tab)
```

Les touches suivent le [modèle des onglets de l'APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (*ARIA Authoring Practices Guide*, le guide de bonnes pratiques ARIA publié par le W3C, l'organisme qui normalise le web), ici avec activation automatique : l'onglet qui reçoit le focus s'affiche aussitôt, ce qui est recommandé quand le panneau s'affiche sans délai.

| Touche | Effet |
|---|---|
| Tab | Entre dans la barre sur l'onglet actif ; depuis la barre, passe au panneau |
| Flèche droite | Onglet suivant (après le dernier, retour au premier) |
| Flèche gauche | Onglet précédent (avant le premier, saut au dernier) |
| Home / Fin | Premier / dernier onglet (optionnel) |

Le `<button>` natif donne gratuitement le clic, Entrée et Espace ; `role="tab"` remplace seulement ce qui est annoncé.

| Élément | Attribut | Rôle |
|---|---|---|
| Conteneur | `role="tablist"` | Groupe d'onglets |
| Conteneur | `aria-label` | Nom du groupe |
| Chaque onglet | `role="tab"` | Un onglet |
| Chaque onglet | `aria-selected` | `true` sur l'actif, `false` sur les autres |
| Chaque onglet | `aria-controls` | `id` du panneau qu'il pilote |
| Chaque onglet | `tabindex` | `0` sur l'actif, `-1` sur les autres |
| Chaque panneau | `role="tabpanel"` | Contenu d'un onglet |
| Chaque panneau | `aria-labelledby` | `id` de l'onglet : son nom vient de lui |
| Chaque panneau | `tabindex="0"` | Rend le panneau atteignable par Tab depuis la barre, quand son contenu ne commence pas par un élément focalisable |
| Panneaux inactifs | `hidden` | Cachés |

```html
<!-- Le groupe d'onglets : un seul arrêt de Tab, nommé « Langages du web » -->
<div role="tablist" aria-label="Langages du web" id="onglets">
    <!-- Onglet actif : sélectionné et atteignable par Tab (tabindex="0") -->
    <button role="tab" id="onglet-html" aria-selected="true"
            aria-controls="panneau-html" tabindex="0">HTML</button>
    <!-- Autres onglets : non sélectionnés, sautés par Tab (tabindex="-1") -->
    <button role="tab" id="onglet-css" aria-selected="false"
            aria-controls="panneau-css" tabindex="-1">CSS</button>
    <button role="tab" id="onglet-js" aria-selected="false"
            aria-controls="panneau-js" tabindex="-1">JavaScript</button>
</div>

<!-- Panneau visible, associé à l'onglet HTML -->
<div role="tabpanel" id="panneau-html" aria-labelledby="onglet-html" tabindex="0">
    Le HTML décrit la structure de la page.
</div>
<!-- Panneaux des onglets inactifs : cachés par l'attribut hidden -->
<div role="tabpanel" id="panneau-css" aria-labelledby="onglet-css" tabindex="0" hidden>
    Le CSS décrit l'apparence.
</div>
<div role="tabpanel" id="panneau-js" aria-labelledby="onglet-js" tabindex="0" hidden>
    Le JavaScript décrit le comportement.
</div>
```

```css
/* Le style lit l'état ARIA : l'onglet sélectionné est souligné */
[role="tab"][aria-selected="true"] { border-bottom: 3px solid #1a4fd6; }
```

```javascript
// La barre et la liste de ses onglets (le `...` copie la liste dans un vrai tableau)
const barre = document.getElementById("onglets");
const onglets = [...barre.querySelectorAll('[role="tab"]')];

// Affiche l'onglet choisi, cache les autres et fait « voyager » l'arrêt de Tab
function activer(cible) {
    for (const onglet of onglets) {
        // vrai (booléen) pour un seul onglet : celui qu'on active
        const actif = onglet === cible;
        // String() convertit le booléen en texte, car une valeur d'attribut est un texte
        onglet.setAttribute("aria-selected", String(actif));
        // La propriété tabIndex est l'attribut tabindex : seul l'actif reste dans Tab
        onglet.tabIndex = actif ? 0 : -1;
        // Retrouve le panneau grâce à l'id que `aria-controls` désigne
        const panneau = document.getElementById(onglet.getAttribute("aria-controls"));
        // Seul le panneau de l'onglet actif est visible
        panneau.hidden = !actif;
    }
}

// Un clic sur un onglet l'active
barre.addEventListener("click", (evenement) => {
    // `evenement.target` : l'élément cliqué ; `includes` vérifie que c'est bien un onglet
    if (onglets.includes(evenement.target)) {
        activer(evenement.target);
    }
});

// Les touches du clavier, écoutées sur toute la barre
barre.addEventListener("keydown", (evenement) => {
    const dernier = onglets.length - 1;                 // position du dernier onglet
    const position = onglets.indexOf(evenement.target); // position de l'onglet focalisé
    let suivante = -1;                                  // -1 : aucune touche gérée

    if (evenement.key === "ArrowRight") {
        suivante = position === dernier ? 0 : position + 1;  // après le dernier : le premier
    } else if (evenement.key === "ArrowLeft") {
        suivante = position === 0 ? dernier : position - 1;  // avant le premier : le dernier
    } else if (evenement.key === "Home") {
        suivante = 0;                                   // premier onglet
    } else if (evenement.key === "End") {
        suivante = dernier;                             // dernier onglet
    }

    if (suivante === -1) return;      // autre touche : on sort, Tab garde son rôle normal
    evenement.preventDefault();       // empêche Home/Fin de faire défiler la page
    activer(onglets[suivante]);       // active l'onglet visé (état, tabindex, panneau)
    onglets[suivante].focus();        // déplace le focus dessus
});
```

Selon le [guide APG du clavier](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), les groupes de [boutons radio](/?c=langages&s=html&p=formulaires) suivent la même convention d'un seul arrêt de Tab.

## Garder le focus quand la mise en page change

Le focus est attaché à un élément précis. Si l'élément est supprimé (une liste redessinée avec `innerHTML`, une partie de la page remplacée), le navigateur renvoie le focus au [`<body>`](/?c=langages&s=html&p=structure-dun-document) : l'utilisateur au clavier perd sa position ([guide APG du clavier](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). Un élément masqué par `display: none` ne peut plus non plus être focalisé.

| Situation | Stratégie |
|---|---|
| Données rafraîchies, mêmes éléments | Ne pas recréer les nœuds (les éléments du DOM) : mettre à jour leur texte ou leurs attributs, le focus reste en place |
| Liste redessinée entièrement | Mémoriser l'élément focalisé par un identifiant stable (`data-id`), redessiner, puis refocaliser le nouvel élément équivalent |
| Élément supprimé | Déplacer volontairement le focus vers un voisin logique (le suivant, sinon le précédent) |
| Panneau ou dialogue fermé | Rendre le focus à l'élément qui l'avait ouvert (voir `inert`) |
| Changement de [point de rupture](/?c=langages&s=css&p=responsive-et-media-queries) (*breakpoint*) | Adapter l'apparence en CSS sur les mêmes éléments plutôt que de les détruire et recréer en JavaScript |

`document.activeElement` est la propriété qui renvoie l'élément ayant le focus ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)). L'exemple utilise [`dataset`](/?c=langages&s=html&p=attributs-data-et-accessibilite) pour relier chaque bouton à sa tâche, les [backticks](/?c=langages&s=javascript&p=strings) pour insérer une variable dans un texte, et `?.` et `??` vus aux [conditions](/?c=langages&s=javascript&p=conditions).

```html
<!-- La liste est remplie par le JavaScript -->
<ul id="liste"></ul>
```

```javascript
// Chaque tâche a un identifiant stable (id) : il survit aux redessins
let taches = [
    { id: 1, texte: "Écrire le chapitre" },
    { id: 2, texte: "Relire" },
    { id: 3, texte: "Publier" },
];
const liste = document.getElementById("liste");

// Redessine toute la liste : les anciens boutons sont détruits, de nouveaux sont créés
function afficher() {
    liste.innerHTML = "";                           // vide la liste (détruit ses boutons)
    for (const tache of taches) {                   // une ligne par tâche
        const item = document.createElement("li");  // crée l'élément de liste
        const bouton = document.createElement("button"); // crée son bouton
        bouton.dataset.id = tache.id;               // data-id : lie le bouton à la tâche
        bouton.textContent = `Terminer : ${tache.texte}`; // texte du bouton
        item.appendChild(bouton);                   // met le bouton dans l'élément
        liste.appendChild(item);                    // met l'élément dans la liste
    }
}

// Refocalise le bouton d'une tâche ; ne fait rien si ce bouton n'existe pas
function focaliserTache(id) {
    liste.querySelector(`[data-id="${id}"]`)?.focus();
}

// Cas A : redessin sans suppression, le focus doit rester sur la même tâche
function rafraichir() {
    const memorise = document.activeElement.dataset.id;  // 1. note l'id (ou undefined)
    afficher();                                          // 2. redessine : focus perdu ici
    focaliserTache(memorise);                            // 3. refocalise le nouveau bouton
}

// Cas B : un clic termine la tâche ; le focus passe à la tâche voisine
liste.addEventListener("click", (evenement) => {
    if (!evenement.target.dataset.id) return;             // clic hors d'un bouton : on sort
    const id = Number(evenement.target.dataset.id);       // Number() : texte -> nombre
    const rang = taches.findIndex((tache) => tache.id === id);  // position de la tâche cliquée
    taches = taches.filter((tache) => tache.id !== id);   // copie sans la tâche terminée
    afficher();                                           // redessine la liste
    const voisine = taches[rang] ?? taches[rang - 1];     // la suivante, sinon la précédente
    if (voisine) focaliserTache(voisine.id);              // si la liste n'est pas vide
});
```

Quand la dernière tâche disparaît, il n'y a plus de voisine : le focus doit alors être placé ailleurs, par exemple sur un bouton « Ajouter une tâche ».

## Récapitulatif des outils

| Outil | Nature | Valeurs ou usage | Sert à |
|---|---|---|---|
| `aria-live` | Attribut ARIA | `off`, `polite`, `assertive` | Annoncer un changement sans déplacer le focus |
| `aria-atomic` | Attribut ARIA | `true` | Relire toute la région live |
| `aria-current` | Attribut ARIA | `page`, `step`, `location`, `date`, `time`, `true`, `false` | Marquer l'élément courant d'un ensemble |
| `aria-selected` | Attribut ARIA | `true`, `false` | Marquer l'onglet sélectionné |
| `aria-hidden` | Attribut ARIA | `true` | Retirer de l'arbre d'accessibilité, sans bloquer le focus |
| `role` | Attribut HTML | `alert`, `status`, `tablist`, `tab`, `tabpanel` | Donner un rôle quand aucun élément natif n'existe |
| `inert` | Attribut booléen | Présent ou absent | Rendre une zone non cliquable, non focalisable, non lue |
| `tabindex` | Attribut HTML | `0`, `-1` | Régler l'accès par Tab |
| `:focus-visible` | Pseudo-classe CSS | Avec `outline` | Afficher l'anneau de focus au clavier |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Créer la région live avec son contenu | Il n'y a aucun changement à annoncer. La mettre dans le HTML d'origine, vide, puis changer son texte |
| `aria-live` sur une zone qui change sans cesse | Un flot d'annonces noie l'utilisateur. Utiliser `off` ou n'annoncer qu'un résumé |
| `assertive` ou `role="alert"` partout | Chaque annonce interrompt la lecture. Réserver aux urgences, `polite` ou `status` sinon |
| Marquer la page active par un style seul | Le lecteur d'écran n'en sait rien. Ajouter `aria-current`, une seule fois par ensemble |
| `aria-current` à la place de `aria-selected` sur un onglet | Les deux n'ont pas le même sens : un onglet se marque avec `aria-selected` |
| Un `role` sans le comportement qui va avec | Le rôle annonce un bouton ou un onglet, mais le clavier ne marche pas. Préférer l'élément natif |
| `aria-hidden="true"` sur du contenu focalisable | Le focus y entre alors que rien n'est lu. Utiliser `inert` ou `hidden` |
| `inert` sans signe visuel, ou posé sur un ancêtre du panneau à focaliser | L'utilisateur ne comprend pas pourquoi la zone ne réagit plus, et le panneau devient inerte avec elle |
| `outline: none` sans remplacement | Le clavier ne voit plus le focus. Utiliser `:focus-visible` avec un contour contrasté |
| `tabindex="0"` sur tous les onglets, ou un `tabindex` positif | Trop d'arrêts de Tab, ou un ordre qui ne suit plus le HTML |
| Redessiner une liste sans refocaliser | Le focus retombe sur `<body>` et l'utilisateur perd sa place |
| Croire qu'un comportement ARIA est identique partout | Il varie selon le navigateur et le lecteur d'écran. Tester sur de vrais lecteurs, pas seulement au clavier |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Choisir d'abord l'élément natif (`<button>`, `<a>`, `<dialog>`, [`<details>`](/?c=langages&s=html&p=semantique-html5)) | Il apporte rôle, clavier et focus sans une ligne de code ARIA |
| Déclarer les régions live dans le HTML d'origine, avec des messages courts | C'est le seul moyen fiable pour qu'elles soient surveillées dès le départ |
| Utiliser `polite` par défaut | Annoncer sans couper la parole à l'utilisateur |
| Faire lire l'état à la fois par le style et par ARIA (`[aria-current="page"]`, `[aria-selected="true"]`) | Une seule source de vérité : l'apparence et l'annonce ne divergent jamais |
| Pour une zone modale, utiliser `<dialog>` ou `inert`, puis rendre le focus au déclencheur | L'arrière-plan est bloqué et l'utilisateur retrouve sa place à la fermeture |
| Remplacer l'anneau de focus par un `:focus-visible` contrasté, jamais le supprimer | L'utilisateur au clavier voit toujours où il est |
| Groupe d'éléments liés (onglets, boutons radio) : un arrêt de Tab, des flèches | Traverser le groupe ne coûte qu'un appui sur Tab |
| Refocaliser par identifiant stable après un redessin | Le focus ne dépend plus d'un nœud détruit |
| Tester au clavier seul (Tab, Maj+Tab, flèches, Échap) puis avec un lecteur d'écran | Seul ce test révèle un focus perdu ou une annonce manquante |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `aria-live` annonce un changement sans déplacer le focus ; `aria-current` marque l'élément courant ; `role` s'utilise seulement sans élément natif ; `inert` bloque une zone entière ; `:focus-visible` dessine le focus au clavier ; un groupe d'éléments liés n'est qu'un arrêt de Tab (`tabindex` `0` sur l'actif, `-1` sur les autres) ; le focus se mémorise et se restaure quand les éléments sont recréés. |
| **Pièges à éviter** | Région live créée avec son contenu, `assertive` abusif, style sans `aria-current`, `aria-hidden` sur du focalisable, `inert` invisible, `outline: none` seul, `tabindex="0"` partout, focus perdu après un redessin. |
| **Bonnes pratiques** | Élément natif d'abord, région live dans le HTML d'origine, `polite` par défaut, `inert` ou `<dialog>` pour l'arrière-plan, anneau de focus contrasté, refocalisation par identifiant stable, test au clavier et au lecteur d'écran. |
