---
order: 12
---

# Le DOM et la gestion des événements

Le **DOM** (*Document Object Model*) est la représentation en mémoire d'une page [HTML](/?c=langages-de-balisage&s=html&p=html), sous forme d'un arbre d'objets manipulables par JavaScript : chaque balise devient un nœud de cet arbre, avec ses propres propriétés et méthodes.

## Sélectionner des éléments

```javascript
document.getElementById("titre");     // un élément précis, par son id
document.querySelector(".carte");     // le PREMIER élément correspondant à ce sélecteur CSS
document.querySelectorAll(".carte");  // TOUS les éléments correspondants (NodeList)
```

> **Note :** `querySelector`/`querySelectorAll` acceptent n'importe quel [sélecteur CSS](/?c=langages-de-balisage&s=css&p=selecteurs) : `.classe`, `#id`, `div > p`, `[data-role="bouton"]`... c'est la méthode la plus flexible.

## Modifier un élément

```javascript
const titre = document.querySelector("h1");

titre.textContent = "Nouveau titre";  // remplace le texte (échappe automatiquement le HTML)
// insère du HTML brut -> DANGER si la source n'est pas fiable (XSS)
titre.innerHTML = "<em>Titre</em>";
titre.style.color = "red";            // modifie un style CSS directement
titre.classList.add("actif");         // ajoute une classe CSS
titre.classList.remove("actif");
titre.classList.toggle("actif");              // ajoute si absente, retire si présente
titre.setAttribute("data-id", "42");
```

> **Note :** `innerHTML` avec une donnée provenant de l'utilisateur est une faille XSS classique (voir [La sécurité](/?c=langages-de-programmation&s=php&p=securite), même principe) : un attaquant pourrait y injecter du code exécutable. `textContent` reste sûr par défaut, car il traite toujours son contenu comme du texte brut.

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
| `DOMContentLoaded` | Le [HTML](/?c=langages-de-balisage&s=html&p=html) est entièrement chargé (avant les images/styles) |

## `preventDefault()` : annuler le comportement par défaut

```javascript
document.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();   // empêche le rechargement de page par défaut d'un formulaire
    console.log("Formulaire intercepté par JavaScript");
});
```

## Propagation des événements et délégation

Un événement se propage de l'élément ciblé vers ses parents (*bubbling*), ce qui permet d'écouter un événement sur un parent commun plutôt que sur chaque enfant individuellement :

```javascript
document.querySelector("#liste").addEventListener("click", (evenement) => {
    if (evenement.target.classList.contains("carte")) {
        console.log("Une carte a été cliquée :", evenement.target.textContent);
    }
});
// fonctionne même pour des cartes ajoutées DYNAMIQUEMENT après ce addEventListener,
// contrairement à un addEventListener posé individuellement sur chaque carte au chargement
```

Cette technique, la **délégation d'événements**, évite d'avoir à réattacher un écouteur à chaque nouvel élément créé dynamiquement (voir l'exemple de `createElement` plus haut) : un seul écouteur, posé une fois sur un ancêtre stable, suffit.

Tous les événements ne se propagent pas par bulles : `toggle` (déclenché par un [`<details>`](/?c=langages-de-balisage&s=html&p=semantique-html5#lt-details-gt-lt-summary-gt-un-contenu-repliable-sans-javascript)), ainsi qu'historiquement `focus`, `blur` et `scroll`, restent confinés à leur élément d'origine. Pour les intercepter par délégation, il faut écouter en phase de **capture** (le trajet inverse : du `document` vers l'élément ciblé, avant les bulles), via un troisième argument `true` :

```javascript
document.addEventListener("toggle", (evenement) => {
    console.log("Un details a change d'etat :", evenement.target.open);
}, true);  // phase de capture obligatoire : "toggle" ne bulle pas
```

| Phase | Sens du parcours | Déclenchée par défaut ? |
|---|---|---|
| Capture | Du `document` vers l'élément ciblé | Non : seulement avec `true` (ou `{ capture: true }`) en 3ᵉ argument |
| Bulles (*bubbling*) | De l'élément ciblé vers le `document` | Oui |

## Modifier l'URL sans recharger la page

L'API `history` du navigateur change l'URL affichée dans la barre d'adresse sans recharger la page ni déclencher de navigation réseau :

```javascript
const params = new URLSearchParams();
params.set("domaine", "atlas");

history.replaceState(null, "", `${window.location.pathname}?${params}`);
// URL affichée : .../page?domaine=atlas, sans recharger ni empiler d'entrée d'historique
```

Les trois arguments sont toujours les mêmes : un `state` (donnée associée à cette entrée d'historique, récupérable plus tard via l'événement `popstate` ; `null` si inutile ici), un titre (ignoré par la plupart des navigateurs), puis la nouvelle URL (qui doit rester sur le même domaine, sous peine d'erreur).

| Méthode | Effet sur l'historique | Cas d'usage typique |
|---|---|---|
| `history.pushState(...)` | Ajoute une nouvelle entrée : le bouton "Retour" du navigateur y ramène | Changer de "page" dans une [application monopage](/?c=langages-de-programmation&s=javascript&p=ssr-vs-csr#csr-le-serveur-envoie-une-coquille-vide) sans rechargement |
| `history.replaceState(...)` | Remplace l'entrée courante : aucune nouvelle entrée créée | Synchroniser l'URL avec un état déjà affiché (filtre, onglet actif), sans polluer l'historique |

> **Note :** contrairement à `window.location.href = "..."`, ni `pushState` ni `replaceState` ne rechargent la page : le [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) déjà chargé continue de tourner, seule l'URL visible change.

## Fullscreen et Clipboard : deux API déclenchées par une action utilisateur

Deux API du navigateur, accessibles en JavaScript, mais qui **ne peuvent s'utiliser que suite à une action explicite de l'utilisateur** (clic, touche) : le navigateur refuse de les déclencher depuis du code qui s'exécute tout seul, par sécurité.

```javascript
// Passer en plein écran
document.querySelector("#zone-video").requestFullscreen();

// Écouter la sortie du plein écran, même si l'utilisateur l'a quittée
// par un raccourci navigateur (Échap) plutôt que par un bouton de la page
document.addEventListener("fullscreenchange", () => {
    const enPleinEcran = document.fullscreenElement !== null;
    boutonPleinEcran.textContent = enPleinEcran ? "Quitter" : "Plein écran";
});
```

```javascript
// Copier du texte dans le presse-papier (asynchrone, peut échouer : autorisation refusée)
async function copier(texte) {
    try {
        await navigator.clipboard.writeText(texte);
        afficherConfirmation("Copie !");
    } catch (erreur) {
        afficherConfirmation("Copie impossible");
    }
}
```

| API | Déclenchement | Point notable |
|---|---|---|
| Fullscreen (`requestFullscreen()`/`exitFullscreen()`) | Clic ou touche | L'événement `fullscreenchange` est nécessaire car le plein écran peut être quitté par un chemin que le code n'a pas déclenché lui-même (Échap, raccourci système) |
| Clipboard (`navigator.clipboard.writeText()`) | Clic ou touche | Toujours asynchrone (`Promise`), et peut échouer si l'utilisateur/le navigateur refuse l'autorisation : toujours entourer d'un `try`/`catch` |

> **Bonne pratique :** toujours écouter `fullscreenchange` pour resynchroniser l'état de l'interface (texte du bouton, icône) avec l'état réel du plein écran, plutôt que de supposer que seul le bouton de la page peut le faire changer.

## Stockage persistant dans le navigateur : `sessionStorage` et `localStorage`

Deux mécanismes intégrés au navigateur pour conserver une donnée texte (clé/valeur) après un rechargement de page, sans base de données ni serveur :

```javascript
sessionStorage.setItem("audit-confirme", "true");
localStorage.setItem("theme", "sombre");

sessionStorage.getItem("audit-confirme");  // "true", ou null si absent
localStorage.removeItem("theme");
```

| Mécanisme | Portée | Survit à... |
|---|---|---|
| `sessionStorage` | Un seul onglet | Un rechargement de page (F5) |
| `localStorage` | Tous les onglets de la même origine | La fermeture complète du navigateur |

> **Piège :** `sessionStorage`/`localStorage` ne stockent que des chaînes de texte : sauvegarder un objet impose de le convertir avec `JSON.stringify()` à l'écriture et `JSON.parse()` à la lecture.

> **Attention sécurité :** ces deux mécanismes sont accessibles à n'importe quel script JavaScript de la page, y compris un script injecté par une faille XSS (voir [Le cross-site scripting (XSS) en détail](/?c=securite&s=cybersecurite&p=xss-en-detail)) : n'y stocker jamais un token de session sensible sans en mesurer le risque.

## Générer un fichier téléchargeable côté client : `Blob` et `URL.createObjectURL()`

```javascript
const contenuCsv = "nom;valeur\nligne1;10\nligne2;20";
const fichier = new Blob([contenuCsv], { type: "text/csv;charset=utf-8" });
// URL temporaire pointant vers ce fichier en mémoire
const url = URL.createObjectURL(fichier);

const lien = document.createElement("a");
lien.href = url;
lien.download = "export.csv";
lien.click();  // déclenche le téléchargement, sans jamais l'ajouter au DOM

URL.revokeObjectURL(url);  // libère la mémoire une fois le téléchargement lancé
```

Un `Blob` (*Binary Large OBject*) représente des données brutes (texte, binaire) comme un fichier, entièrement en mémoire côté navigateur, sans aucun aller-retour serveur. `URL.createObjectURL()` lui attribue une URL temporaire (`blob:...`) utilisable partout où une URL de fichier est attendue (ici, `href` d'un lien) ; `URL.revokeObjectURL()` la libère une fois le téléchargement lancé, pour éviter une fuite mémoire.

> **Bonne pratique :** toujours appeler `URL.revokeObjectURL()` une fois l'usage terminé : le navigateur ne libère jamais cette URL temporaire de lui-même.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le DOM représente une page [HTML](/?c=langages-de-balisage&s=html&p=html) sous forme d'arbre manipulable. `querySelector`/`addEventListener` sélectionnent et réagissent aux interactions ; un événement se propage des enfants vers les parents (*bubbling*), sauf quelques exceptions (`toggle`, `focus`, `blur`, `scroll`) qui exigent la phase de capture. |
| **Outils utilisables** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`, `history.pushState`/`replaceState`, `requestFullscreen()`/`navigator.clipboard.writeText()`, `sessionStorage`/`localStorage`, `Blob`/`URL.createObjectURL()`. |
| **Pièges à éviter** | Assigner une donnée utilisateur à `innerHTML` (faille XSS) ; attacher un écouteur à chaque élément individuel plutôt que déléguer, ce qui casse pour les éléments ajoutés dynamiquement après coup ; oublier `fullscreenchange` et supposer que seul le bouton de la page fait changer le plein écran ; écouter `toggle` sans la phase de capture (`true` en 3ᵉ argument), il ne bulle jamais ; stocker un token sensible dans `sessionStorage`/`localStorage`, lisible par tout script (XSS). |
| **Bonnes pratiques** | Utiliser la délégation d'événements (écouteur sur un ancêtre stable) plutôt qu'un écouteur par élément, surtout si des éléments sont ajoutés dynamiquement. Préférer `replaceState` à `pushState` pour synchroniser l'URL avec un état déjà affiché, sans polluer l'historique de navigation. Toujours entourer `clipboard.writeText()` d'un `try`/`catch`. Toujours appeler `URL.revokeObjectURL()` une fois un téléchargement `Blob` lancé. |
