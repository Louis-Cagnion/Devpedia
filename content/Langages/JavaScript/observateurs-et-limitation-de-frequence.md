---
order: 16
---

# Observateurs du navigateur et limitation de fréquence

Le [chapitre sur le DOM](/?c=langages&s=javascript&p=dom-et-evenements) couvre les événements déclenchés par une action explicite (un clic, une touche pressée). Ce chapitre couvre deux autres familles de besoins : réagir à un changement qui n'est **pas** un événement classique (un élément qui devient visible, le contenu d'une page qui change), et limiter la fréquence d'exécution d'une fonction appelée trop souvent.

## `IntersectionObserver` : détecter qu'un élément devient visible

Avant `IntersectionObserver`, savoir si un élément était visible à l'écran demandait de recalculer sa position à chaque défilement (`scroll`), un calcul coûteux répété en boucle. `IntersectionObserver` inverse le problème : le navigateur prévient lui-même le code dès qu'un élément entre ou sort de la zone visible, sans recalcul manuel.

```javascript
const sentinelle = document.querySelector('.sentinelle-pagination');

const observateur = new IntersectionObserver((entrees) => {
    if (entrees[0].isIntersecting) {   // la sentinelle vient d'entrer dans la zone visible
        chargerPageSuivante();
    }
}, { rootMargin: '200px' });           // declenche 200px AVANT que la sentinelle soit reellement visible

observateur.observe(sentinelle);
```

Ce patron ("sentinelle" invisible en bas d'une liste, qui déclenche le chargement de la page suivante dès qu'elle approche de la zone visible) implémente le **scroll infini** : `rootMargin` avance le déclenchement, pour que le contenu suivant soit déjà chargé quand l'utilisateur y arrive réellement, plutôt qu'après.

> **Bonne pratique :** toujours appeler `observateur.disconnect()` une fois l'observation devenue inutile (tout le contenu déjà chargé, l'élément retiré de la page), pour libérer la référence et éviter un callback qui continue de s'exécuter sur un élément qui n'a plus lieu d'être surveillé.

## `MutationObserver` : réagir à un changement du DOM sans sonder en boucle

`MutationObserver` prévient le code quand le DOM change (ajout/suppression d'éléments, changement d'attribut...), sans avoir à vérifier "est-ce que ça a changé ?" en boucle (*polling*) :

```javascript
const conteneur = document.getElementById('messages');

const observateur = new MutationObserver(() => {
    faireDefilerVersLeBas();
});

observateur.observe(conteneur, { childList: true, subtree: true });
```

`{ childList: true, subtree: true }` précise ce qu'il faut surveiller : l'ajout/suppression d'enfants directs (`childList`), y compris à n'importe quelle profondeur sous `conteneur` (`subtree`). Sans `subtree`, un enfant ajouté à un petit-enfant de `conteneur` ne déclencherait rien.

> **Piège :** `MutationObserver` ne détecte que des changements de **structure DOM** ou d'**attribut HTML**. Écrire `monSelect.value = "x"` change la propriété JavaScript `value` d'un `<select>`, mais ne modifie aucun attribut HTML ni la structure du DOM : aucune mutation n'est donc jamais signalée pour ce genre d'écriture, même en observant `attributes: true`. Voir [intercepter un setter de propriété](/?c=langages&s=javascript&p=intercepter-un-setter-de-propriete) pour la technique qui comble ce trou.

## Debounce et throttle : deux façons de limiter la fréquence d'une fonction

Certains événements (`resize`, `scroll`, `input`) se déclenchent des dizaines de fois par seconde. Exécuter une fonction coûteuse à chaque déclenchement peut ralentir toute la page. Deux techniques limitent la fréquence d'exécution, mais avec des logiques opposées :

| | Debounce | Throttle |
|---|---|---|
| Principe | Attend une pause d'inactivité avant d'exécuter | Exécute au plus une fois par intervalle fixe |
| Effet sur une rafale continue | Une seule exécution, après la fin de la rafale | Plusieurs exécutions régulières, espacées, pendant la rafale |
| Cas d'usage typique | Recherche en temps réel (attendre que l'utilisateur ait fini de taper) | Réinitialiser un minuteur d'inactivité (limiter, sans jamais bloquer complètement) |

```javascript
// Debounce : n'exécute qu'après 300ms sans nouvel appel
function debounce(fn, delai) {
    let minuteur = null;
    return (...args) => {
        clearTimeout(minuteur);
        minuteur = setTimeout(() => fn(...args), delai);
    };
}
```

```javascript
// Throttle : verrouille les appels suivants pendant 1000ms après le premier
let verrouille = false;

function surActivite() {
    if (verrouille) return;
    verrouille = true;
    setTimeout(() => { verrouille = false; }, 1000);

    reinitialiserMinuteurInactivite();
}
```

Le throttle ci-dessus n'utilise volontairement aucun `setInterval` : le verrou se relâche une seule fois, 1000ms après le premier appel de la rafale, puis le prochain appel peut de nouveau passer et relance son propre verrou. C'est la forme la plus simple d'un throttle (dite *leading edge*, elle exécute immédiatement au premier appel plutôt que d'attendre la fin de l'intervalle).

> **Piège :** appliquer un debounce là où il faudrait un throttle. Sur un minuteur d'inactivité réinitialisé à chaque mouvement de souris, un debounce ne réinitialiserait jamais rien tant que la souris continue de bouger (la pause d'inactivité n'arrive jamais) : c'est précisément l'inverse du comportement recherché.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `IntersectionObserver` détecte la visibilité d'un élément sans recalcul manuel au scroll (scroll infini). `MutationObserver` réagit à un changement du DOM sans sonder en boucle, mais ne voit ni les propriétés JS assignées directement, ni les changements hors DOM. Debounce attend une pause avant d'exécuter ; throttle exécute au plus une fois par intervalle. |
| **Outils utilisables** | `IntersectionObserver` (`rootMargin`, `isIntersecting`), `MutationObserver` (`childList`/`subtree`/`attributes`), un debounce/throttle maison via `setTimeout`. |
| **Pièges à éviter** | Oublier `observateur.disconnect()` une fois l'observation devenue inutile. Attendre une mutation DOM sur une propriété JS assignée directement (`select.value = x`). Confondre debounce et throttle sur un besoin de réinitialisation répétée. |
| **Bonnes pratiques** | `rootMargin` pour précharger avant que l'élément soit réellement visible. `subtree: true` dès que le changement peut survenir à n'importe quelle profondeur. Choisir debounce pour une action finale unique après une rafale, throttle pour un plafond régulier pendant la rafale. |
