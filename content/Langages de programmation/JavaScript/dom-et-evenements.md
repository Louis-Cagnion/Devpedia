---
order: 11
---

# Le DOM et la gestion des événements

Le **DOM** (*Document Object Model*) est la représentation en mémoire d'une page HTML, sous forme d'un arbre d'objets manipulables par JavaScript — chaque balise devient un nœud de cet arbre, avec ses propres propriétés et méthodes.

## Sélectionner des éléments

```javascript
document.getElementById("titre");           // un élément précis, par son id
document.querySelector(".carte");            // le PREMIER élément correspondant à ce sélecteur CSS
document.querySelectorAll(".carte");          // TOUS les éléments correspondants (NodeList)
```

> **Note :** `querySelector`/`querySelectorAll` acceptent n'importe quel sélecteur CSS (cf. chapitre dédié) — `.classe`, `#id`, `div > p`, `[data-role="bouton"]`... c'est la méthode la plus flexible.

## Modifier un élément

```javascript
const titre = document.querySelector("h1");

titre.textContent = "Nouveau titre";     // remplace le texte (échappe automatiquement le HTML)
titre.innerHTML = "<em>Titre</em>";       // insère du HTML brut -> DANGER si la source n'est pas fiable (XSS)
titre.style.color = "red";                  // modifie un style CSS directement
titre.classList.add("actif");                // ajoute une classe CSS
titre.classList.remove("actif");
titre.classList.toggle("actif");              // ajoute si absente, retire si présente
titre.setAttribute("data-id", "42");
```

> **Note :** `innerHTML` avec une donnée provenant de l'utilisateur est une faille XSS classique (cf. chapitre sur la sécurité en PHP, même principe) — un attaquant pourrait y injecter du code exécutable. `textContent` reste sûr par défaut, car il traite toujours son contenu comme du texte brut.

## Créer et insérer un élément

```javascript
const nouvelleCarte = document.createElement("div");
nouvelleCarte.textContent = "Nouvelle carte";
nouvelleCarte.classList.add("carte");

document.querySelector("#liste").appendChild(nouvelleCarte);
```

## Écouter des événements

```javascript
const bouton = document.querySelector("#mon-bouton");

bouton.addEventListener("click", (evenement) => {
    console.log("Bouton cliqué !", evenement.target);
});
```

| Événement courant | Déclenché quand |
|---|---|
| `click` | L'élément est cliqué |
| `submit` | Un formulaire est soumis |
| `input` / `change` | La valeur d'un champ change |
| `keydown` / `keyup` | Une touche du clavier est pressée/relâchée |
| `DOMContentLoaded` | Le HTML est entièrement chargé (avant les images/styles) |

## `preventDefault()` : annuler le comportement par défaut

```javascript
document.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();   // empêche le rechargement de page par défaut d'un formulaire
    console.log("Formulaire intercepté par JavaScript");
});
```

## Propagation des événements et délégation

Un événement se propage de l'élément ciblé vers ses parents (*bubbling*) — ce qui permet d'écouter un événement sur un parent commun plutôt que sur chaque enfant individuellement :

```javascript
document.querySelector("#liste").addEventListener("click", (evenement) => {
    if (evenement.target.classList.contains("carte")) {
        console.log("Une carte a été cliquée :", evenement.target.textContent);
    }
});
// fonctionne même pour des cartes ajoutées DYNAMIQUEMENT après ce addEventListener,
// contrairement à un addEventListener posé individuellement sur chaque carte au chargement
```

Cette technique, la **délégation d'événements**, évite d'avoir à réattacher un écouteur à chaque nouvel élément créé dynamiquement (cf. exemple de `createElement` plus haut) : un seul écouteur, posé une fois sur un ancêtre stable, suffit.
