---
order: 11
---

# Les HTMLElements

Un `HTMLElement` est la représentation JavaScript d'une balise HTML dans le DOM. Chaque balise (`<div>`, `<p>`, `<a>`...) devient un objet `HTMLElement` accessible et manipulable en JavaScript.

```javascript
const div = document.querySelector('div');
// div est maintenant un objet HTMLElement
```

---

## Créer et insérer des éléments

**`document.createElement`** crée un nouvel élément HTML sans l'insérer dans la page.
```javascript
const p = document.createElement('p');
```

**`append`** insère un ou plusieurs éléments (ou textes) à la fin du contenu d'un élément parent.
```javascript
document.body.append(p);
document.body.append('texte brut', p, autreElement);
```

**`prepend`** insère un ou plusieurs éléments (ou textes) au **début** du contenu d'un élément parent.
```javascript
parent.prepend(p);
parent.prepend('texte brut', p, autreElement);
```

**`insertAdjacentHTML`** insère du HTML brut à une position précise autour d'un élément, sans écraser le contenu existant.
```javascript
element.insertAdjacentHTML('beforebegin', "<p>avant l'élément</p>");
element.insertAdjacentHTML('afterbegin',  "<p>au début du contenu</p>");
element.insertAdjacentHTML('beforeend',   "<p>à la fin du contenu</p>");
element.insertAdjacentHTML('afterend',    "<p>après l'élément</p>");
```

> **Note (sécurité) :** comme `innerHTML` (voir plus bas), `insertAdjacentHTML` interprète son argument comme du HTML — ne jamais y insérer une donnée provenant de l'utilisateur sans l'avoir échappée, sous peine de faille XSS (voir [La sécurité](/?c=langages-de-programmation&s=php&p=securite), même principe).

**`remove`** supprime l'élément du DOM.
```javascript
p.remove();
```

**`replaceWith`** remplace l'élément par un ou plusieurs autres éléments.
```javascript
p.replaceWith(autreElement);
```

---

## Accéder aux éléments existants

**`querySelector`** renvoie le premier élément correspondant au sélecteur CSS donné, ou `null` s'il n'existe pas.
```javascript
const titre = document.querySelector('h1');
const div = document.querySelector('.ma-classe');
const lien = document.querySelector('#mon-id a');
```

**`querySelectorAll`** renvoie tous les éléments correspondants sous forme de `NodeList` (semblable à un tableau).
```javascript
const paragraphes = document.querySelectorAll('p');
paragraphes.forEach(p => console.log(p.textContent));
```

**`getElementById`**, **`getElementsByClassName`**, **`getElementsByTagName`** sont des alternatives plus anciennes, moins flexibles que `querySelector`.
```javascript
document.getElementById('mon-id');
document.getElementsByClassName('ma-classe'); // HTMLCollection (live)
document.getElementsByTagName('p');           // HTMLCollection (live)
```

> **Note :** une `HTMLCollection` (renvoyée par `getElementsByClassName`/`getElementsByTagName`) est **live** : elle se met à jour automatiquement si le DOM change, contrairement à la `NodeList` renvoyée par `querySelectorAll` (figée au moment de l'appel). Modifier le DOM (ajouter/retirer des éléments correspondants) **pendant** qu'on parcourt une collection live peut donc sauter ou repasser sur des éléments de façon inattendue — une bonne raison de préférer `querySelectorAll` dès qu'on prévoit de modifier la page pendant le parcours.

---

## Les attributs

**`setAttribute`** ajoute ou modifie un attribut.
```javascript
element.setAttribute('class', 'ma-classe');
element.setAttribute('href', 'https://example.com');
```

**`getAttribute`** renvoie la valeur d'un attribut, ou `null` s'il n'existe pas.
```javascript
element.getAttribute('class'); // 'ma-classe'
```

**`removeAttribute`** supprime un attribut.
```javascript
element.removeAttribute('class');
```

**`hasAttribute`** vérifie si un attribut existe sur l'élément.
```javascript
element.hasAttribute('class'); // true ou false
```

---

## Les classes CSS

**`classList`** est un objet dédié à la gestion des classes CSS d'un élément, plus fiable que `className` pour manipuler les classes individuellement.

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

---

## Le contenu

**`textContent`** accède au contenu textuel d'un élément (toutes les balises enfants ignorées). Assigner une valeur remplace le contenu entier par du texte brut — les balises HTML éventuellement présentes sont échappées et affichées telles quelles, jamais interprétées.
```javascript
element.textContent;              // 'Mon texte'
element.textContent = 'Nouveau';  // remplace tout le contenu par du texte
```

**`innerHTML`** accède au contenu HTML interne de l'élément sous forme de chaîne. Assigner une valeur **remplace** l'intégralité du contenu existant et interprète les balises HTML.
```javascript
element.innerHTML;                        // '<strong>Mon texte</strong>'
element.innerHTML = '<em>Nouveau</em>';   // ⚠️ écrase tout, interprète le HTML
```

> **Note (sécurité) :** assigner à `innerHTML` une donnée provenant de l'utilisateur (non fiable) est une faille XSS classique — le contenu est interprété comme du vrai HTML/JavaScript exécutable, pas comme du texte. `textContent` (ci-dessus) reste sûr par défaut, puisqu'il n'interprète jamais son contenu.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `HTMLElement` représente une balise HTML manipulable en JavaScript : le créer (`createElement`), le sélectionner (`querySelector`), modifier son contenu (`textContent`/`innerHTML`), ses attributs, ses classes ou son style. |
| **Outils utilisables** | `querySelector`/`querySelectorAll`, `classList`, `setAttribute`/`getAttribute`, `getBoundingClientRect`. |
| **Pièges à éviter** | Assigner une donnée utilisateur non échappée à `innerHTML`/`insertAdjacentHTML` (faille XSS) ; modifier une `HTMLCollection` live pendant qu'on la parcourt. |
| **Bonnes pratiques** | Préférer `textContent` à `innerHTML` dès que le contenu est du texte brut ; préférer `querySelectorAll` (figé) à `getElementsByClassName`/`getElementsByTagName` (live) si le DOM est modifié pendant le parcours. |

---

## Le style

**`style`** donne accès aux styles inline de l'élément. Les propriétés CSS s'écrivent en **camelCase** (pas de tiret).
```javascript
element.style.color = 'red';
element.style.backgroundColor = 'blue';  // background-color en CSS
element.style.fontSize = '1.2rem';       // font-size en CSS
element.style.borderLeft = '2px solid grey'; // border-left en CSS
```

---

## Naviguer dans le DOM

À partir d'un élément, on peut accéder à ses voisins et à sa hiérarchie.

**`parentElement`** renvoie l'élément parent direct.
```javascript
element.parentElement;
```

**`children`** renvoie les éléments enfants directs (pas les nœuds texte) sous forme de `HTMLCollection`.
```javascript
element.children;       // [div, p, span...]
element.children[0];    // premier enfant
```

**`firstElementChild`** et **`lastElementChild`** renvoient le premier et le dernier élément enfant.
```javascript
element.firstElementChild;
element.lastElementChild;
```

**`nextElementSibling`** et **`previousElementSibling`** renvoient le frère suivant ou précédent.
```javascript
element.nextElementSibling;
element.previousElementSibling;
```

---

## Vérifier le type d'un élément

**`tagName`** renvoie le nom de la balise en majuscules.
```javascript
element.tagName; // 'DIV', 'P', 'SPAN'...
```

**`instanceof`** vérifie si l'élément appartient à une interface DOM précise.
```javascript
element instanceof HTMLAnchorElement;  // true si c'est un <a>
element instanceof HTMLImageElement;   // true si c'est un <img>
```

---

## Dimensions et position

**`getBoundingClientRect`** renvoie la taille et la position de l'élément par rapport à la fenêtre.
```javascript
const rect = element.getBoundingClientRect();
rect.width;   // largeur
rect.height;  // hauteur
rect.top;     // distance depuis le haut de la fenêtre
rect.left;    // distance depuis la gauche de la fenêtre
```

**`offsetWidth`** et **`offsetHeight`** renvoient la taille de l'élément (contenu + padding + bordure).
```javascript
element.offsetWidth;
element.offsetHeight;
```

---

## Ressources

- [MDN (*Mozilla Developer Network*, la documentation de référence du web) — HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN — Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN — Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN — Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN — insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)
