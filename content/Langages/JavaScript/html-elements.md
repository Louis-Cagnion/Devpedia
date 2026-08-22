---
order: 11
---

# Les HTMLElements

Un `HTMLElement` est la représentation JavaScript d'une balise [HTML](/?c=langages-de-balisage&s=html&p=html) dans le DOM. Chaque balise (`<div>`, `<p>`, `<a>`...) devient un objet `HTMLElement` accessible et manipulable en JavaScript.

```javascript
const div = document.querySelector('div');
// div est maintenant un objet HTMLElement
```

## Créer et insérer des éléments

| Méthode | Effet |
|---|---|
| `document.createElement(tag)` | Crée un nouvel élément, sans l'insérer dans la page |
| `parent.append(...)` | Insère un ou plusieurs éléments (ou textes) à la **fin** du contenu du parent |
| `parent.prepend(...)` | Insère un ou plusieurs éléments (ou textes) au **début** du contenu du parent |
| `element.insertAdjacentHTML(position, html)` | Insère du [HTML](/?c=langages-de-balisage&s=html&p=html) brut à une position précise, sans écraser le contenu existant |
| `element.remove()` | Supprime l'élément du DOM |
| `element.replaceWith(...)` | Remplace l'élément par un ou plusieurs autres |

```javascript
const p = document.createElement('p');
document.body.append(p);
document.body.append('texte brut', p, autreElement);

parent.prepend(p);

element.insertAdjacentHTML('beforebegin', "<p>avant l'élément</p>");
element.insertAdjacentHTML('afterbegin',  "<p>au début du contenu</p>");
element.insertAdjacentHTML('beforeend',   "<p>à la fin du contenu</p>");
element.insertAdjacentHTML('afterend',    "<p>après l'élément</p>");

p.remove();
p.replaceWith(autreElement);
```

> **Piège (sécurité) :** comme `innerHTML` (voir plus bas), `insertAdjacentHTML` interprète son argument comme du [HTML](/?c=langages-de-balisage&s=html&p=html) : y insérer une donnée provenant de l'utilisateur sans l'avoir échappée ouvre une faille XSS (voir [La sécurité](/?c=langages-de-programmation&s=php&p=securite), même principe).
>
> **Bonne pratique :** ne jamais passer une donnée utilisateur non échappée à `insertAdjacentHTML`/`innerHTML` ; utiliser `createElement` + `textContent` quand le contenu vient de l'utilisateur.

## Accéder aux éléments existants

| Méthode | Renvoie |
|---|---|
| `document.querySelector(sélecteur)` | Le premier élément correspondant au sélecteur [CSS](/?c=langages-de-balisage&s=css&p=css), ou `null` |
| `document.querySelectorAll(sélecteur)` | Tous les éléments correspondants, sous forme de `NodeList` (figée) |
| `document.getElementById(id)` | L'élément avec cet id (alternative plus ancienne, moins flexible) |
| `document.getElementsByClassName(classe)` | Les éléments avec cette classe, sous forme de `HTMLCollection` (**live**) |
| `document.getElementsByTagName(tag)` | Les éléments de ce type de balise, sous forme de `HTMLCollection` (**live**) |

```javascript
const titre = document.querySelector('h1');
const lien = document.querySelector('#mon-id a');

const paragraphes = document.querySelectorAll('p');
paragraphes.forEach(p => console.log(p.textContent));
```

> **Piège :** une `HTMLCollection` (renvoyée par `getElementsByClassName`/`getElementsByTagName`) est **live** : elle se met à jour automatiquement si le DOM change, contrairement à la `NodeList` renvoyée par `querySelectorAll` (figée au moment de l'appel). Modifier le DOM (ajouter/retirer des éléments correspondants) **pendant** qu'on parcourt une collection live peut donc sauter ou repasser sur des éléments de façon inattendue.
>
> **Bonne pratique :** préférer `querySelectorAll` dès qu'on prévoit de modifier la page pendant le parcours de la collection.

## Les attributs

| Méthode | Effet |
|---|---|
| `element.setAttribute(nom, valeur)` | Ajoute ou modifie un attribut |
| `element.getAttribute(nom)` | Renvoie la valeur d'un attribut, ou `null` s'il n'existe pas |
| `element.removeAttribute(nom)` | Supprime un attribut |
| `element.hasAttribute(nom)` | Teste l'existence d'un attribut (`true`/`false`) |

```javascript
element.setAttribute('class', 'ma-classe');
element.setAttribute('href', 'https://example.com');

element.getAttribute('class');   // 'ma-classe'
element.hasAttribute('class');    // true

element.removeAttribute('class');
```

## Les classes CSS

**`classList`** est un objet dédié à la gestion des classes [CSS](/?c=langages-de-balisage&s=css&p=css) d'un élément, plus fiable que `className` pour manipuler les classes individuellement.

```javascript
element.classList.add('nouvelle-classe');       // ajoute
element.classList.remove('ancienne-classe');    // supprime
element.classList.toggle('active');             // ajoute si absente, supprime si présente
element.classList.contains('ma-classe');        // true ou false
element.classList.replace('ancienne', 'nouvelle'); // remplace
```

**`className`** donne accès à toutes les classes sous forme de chaîne. À utiliser avec précaution : l'assigner remplace **toutes** les classes existantes.
```javascript
element.className;               // 'classe1 classe2'
element.className = 'nouvelle';  // ⚠️ écrase tout
```

## Le contenu

| Propriété | Contenu | Assignation |
|---|---|---|
| `textContent` | Le texte de l'élément, balises enfants ignorées | Remplace tout par du texte brut ; toute balise [HTML](/?c=langages-de-balisage&s=html&p=html) fournie est échappée, jamais interprétée |
| `innerHTML` | Le [HTML](/?c=langages-de-balisage&s=html&p=html) interne de l'élément, sous forme de chaîne | Remplace tout **et interprète** les balises [HTML](/?c=langages-de-balisage&s=html&p=html) fournies |

```javascript
element.textContent;               // 'Mon texte'
element.textContent = 'Nouveau';    // remplace tout le contenu par du texte

element.innerHTML;                          // '<strong>Mon texte</strong>'
element.innerHTML = '<em>Nouveau</em>';      // écrase tout, interprète le HTML
```

> **Piège (sécurité) :** assigner à `innerHTML` une donnée provenant de l'utilisateur (non fiable) est une faille XSS classique : le contenu est interprété comme du vrai [HTML](/?c=langages-de-balisage&s=html&p=html)/JavaScript exécutable, pas comme du texte.
>
> **Bonne pratique :** préférer `textContent` à `innerHTML` dès que le contenu attendu est du texte brut ; il reste sûr par défaut, puisqu'il n'interprète jamais son contenu.

## Le style

`style` donne accès aux styles inline de l'élément. Les propriétés [CSS](/?c=langages-de-balisage&s=css&p=css) s'écrivent en **camelCase** (pas de tiret) :

```javascript
element.style.color = 'red';
element.style.backgroundColor = 'blue';       // background-color en CSS
element.style.fontSize = '1.2rem';             // font-size en CSS
element.style.borderLeft = '2px solid grey';    // border-left en CSS
```

## Naviguer dans le DOM

À partir d'un élément, on peut accéder à ses voisins et à sa hiérarchie :

| Propriété | Renvoie |
|---|---|
| `parentElement` | L'élément parent direct |
| `children` | Les éléments enfants directs (pas les nœuds texte), sous forme de `HTMLCollection` |
| `firstElementChild` / `lastElementChild` | Le premier / dernier élément enfant |
| `nextElementSibling` / `previousElementSibling` | Le frère suivant / précédent |

```javascript
element.parentElement;

element.children;        // [div, p, span...]
element.children[0];      // premier enfant

element.firstElementChild;
element.nextElementSibling;
```

## Vérifier le type d'un élément

```javascript
element.tagName;   // 'DIV', 'P', 'SPAN'... -> le nom de la balise, en majuscules

element instanceof HTMLAnchorElement;   // true si c'est un <a>
element instanceof HTMLImageElement;    // true si c'est un <img>
```

`tagName` renvoie une simple chaîne ; `instanceof` teste directement l'appartenance à une interface DOM précise.

## Dimensions et position

| Propriété | Renvoie |
|---|---|
| `getBoundingClientRect()` | Un objet `{ width, height, top, left, ... }` : taille et position par rapport à la fenêtre |
| `offsetWidth` / `offsetHeight` | Taille de l'élément (contenu + padding + bordure) |

```javascript
const rect = element.getBoundingClientRect();
rect.width;    // largeur
rect.top;       // distance depuis le haut de la fenêtre

element.offsetWidth;
```

## Ressources

- [MDN (*Mozilla Developer Network*, la documentation de référence du web) : HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN : Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN : Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN : Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN : insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `HTMLElement` représente une balise [HTML](/?c=langages-de-balisage&s=html&p=html) manipulable en JavaScript : le créer (`createElement`), le sélectionner (`querySelector`), modifier son contenu (`textContent`/`innerHTML`), ses attributs, ses classes ou son style. |
| **Outils utilisables** | `querySelector`/`querySelectorAll`, `classList`, `setAttribute`/`getAttribute`, `getBoundingClientRect`. |
| **Pièges à éviter** | Assigner une donnée utilisateur non échappée à `innerHTML`/`insertAdjacentHTML` (faille XSS) ; modifier une `HTMLCollection` live pendant qu'on la parcourt. |
| **Bonnes pratiques** | Préférer `textContent` à `innerHTML` dès que le contenu est du texte brut ; préférer `querySelectorAll` (figé) à `getElementsByClassName`/`getElementsByTagName` (live) si le DOM est modifié pendant le parcours. |
