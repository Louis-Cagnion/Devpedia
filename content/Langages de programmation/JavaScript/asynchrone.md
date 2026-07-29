---
order: 12
---

# La programmation asynchrone (callbacks, Promises, async/await)

JavaScript s'exécute sur un **seul thread** (contrairement aux threads du chapitre dédié en C) : il ne peut faire qu'une seule chose à la fois. Pourtant, une requête réseau ou un minuteur ne bloquent pas le programme entier en attendant — c'est le rôle du modèle asynchrone, construit autour de la **boucle d'événements** (*event loop*).

## Le principe : la boucle d'événements

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);   // même avec 0ms, s'exécute APRÈS le reste du code synchrone
console.log("3");

// Affiche : 1, 3, 2
```

Le moteur JavaScript exécute tout le code **synchrone** en premier (la pile d'appels, *call stack*) ; les opérations asynchrones (minuteurs, requêtes réseau, événements) sont déléguées à l'environnement d'exécution (navigateur/Node.js), qui place leur callback dans une **file d'attente**, exécutée seulement une fois la pile d'appels vidée. C'est ce mécanisme qui permet à un seul thread de rester réactif sans jamais être bloqué par une opération lente.

## Les callbacks — et le "callback hell"

```javascript
lireFichier("a.txt", (erreurA, contenuA) => {
    lireFichier("b.txt", (erreurB, contenuB) => {
        lireFichier("c.txt", (erreurC, contenuC) => {
            console.log(contenuA, contenuB, contenuC);
        });
    });
});
```

Enchaîner plusieurs opérations asynchrones par callbacks imbriqués devient vite illisible ("*callback hell*") — les Promises, puis `async`/`await`, ont été introduits précisément pour résoudre ce problème.

## Les Promises

Une **Promise** représente une valeur pas encore disponible, mais qui le sera (ou échouera) plus tard — trois états possibles : *pending* (en attente), *fulfilled* (résolue), *rejected* (rejetée).

```javascript
function attendre(millisecondes) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("Terminé !"), millisecondes);
    });
}

attendre(1000)
    .then(resultat => console.log(resultat))   // exécuté si la promesse est résolue
    .catch(erreur => console.log(erreur));      // exécuté si elle est rejetée
```

### Enchaîner des Promises

```javascript
lireFichierPromise("a.txt")
    .then(contenuA => lireFichierPromise("b.txt"))
    .then(contenuB => lireFichierPromise("c.txt"))
    .then(contenuC => console.log("Tout est chargé"))
    .catch(erreur => console.log("Une étape a échoué :", erreur));
```

### `Promise.all` : attendre plusieurs promesses en parallèle

```javascript
Promise.all([
    fetch("/api/utilisateurs"),
    fetch("/api/produits"),
]).then(([reponseUtilisateurs, reponseProduits]) => {
    console.log("Les deux requêtes sont terminées");
}).catch(erreur => {
    console.log("Au moins une des deux requêtes a échoué :", erreur);
});
```

> **Note :** `Promise.all` lance les deux requêtes **en même temps** (pas l'une après l'autre) et attend qu'elles aboutissent toutes — si l'une échoue, la Promise globale est immédiatement rejetée, même si l'autre a réussi.

## `async`/`await` : du sucre syntaxique par-dessus les Promises

```javascript
async function chargerUtilisateur(id) {
    const reponse = await fetch(`/api/utilisateurs/${id}`);   // "attend" la Promise, sans bloquer le thread
    const donnees = await reponse.json();
    return donnees;
}
```

- `async` devant une fonction fait qu'elle renvoie **toujours** une Promise, implicitement.
- `await` ne peut être utilisé qu'à l'intérieur d'une fonction `async` — il "met en pause" cette fonction (sans bloquer le reste du programme) jusqu'à ce que la Promise soit résolue ou rejetée.

```javascript
// Équivalent strictement identique, mais bien plus lisible qu'avec .then() imbriqués :
async function chargerTout() {
    const contenuA = await lireFichierPromise("a.txt");
    const contenuB = await lireFichierPromise("b.txt");
    const contenuC = await lireFichierPromise("c.txt");
    console.log(contenuA, contenuB, contenuC);
}
```

Voir aussi le chapitre sur la gestion des erreurs pour `try`/`catch` autour d'un `await`, et sur les appels HTTP en PHP (`HttpClient`) pour un équivalent synchrone de `fetch()`.
