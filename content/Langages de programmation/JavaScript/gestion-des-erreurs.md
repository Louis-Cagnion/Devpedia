---
title: La gestion des erreurs
---

JavaScript signale une erreur en levant une **exception** (`throw`), interceptable avec `try`/`catch` — un mécanisme proche de celui de PHP ou Python.

## `try` / `catch` / `finally`

```javascript
try {
    const resultat = JSON.parse("{ invalide");
} catch (erreur) {
    console.log("Erreur de parsing :", erreur.message);
} finally {
    console.log("Tentative terminée");   // exécuté dans tous les cas
}
```

## Lever ses propres erreurs

```javascript
function calculerAge(anneeNaissance) {
    const anneeCourante = new Date().getFullYear();
    if (anneeNaissance > anneeCourante) {
        throw new Error("L'année de naissance ne peut pas être dans le futur");
    }
    return anneeCourante - anneeNaissance;
}

try {
    calculerAge(3000);
} catch (erreur) {
    console.log(erreur.message);
}
```

## Créer un type d'erreur personnalisé

```javascript
class SoldeInsuffisantError extends Error {
    constructor(message) {
        super(message);
        this.name = "SoldeInsuffisantError";
    }
}

function retirer(solde, montant) {
    if (montant > solde) {
        throw new SoldeInsuffisantError(`Solde de ${solde}€ insuffisant`);
    }
    return solde - montant;
}

try {
    retirer(100, 150);
} catch (erreur) {
    if (erreur instanceof SoldeInsuffisantError) {
        console.log("Solde insuffisant :", erreur.message);
    } else {
        throw erreur;   // erreur inattendue : la laisser remonter plutôt que la masquer
    }
}
```

## Erreurs et code asynchrone

Un `try`/`catch` classique **n'intercepte pas** l'erreur d'une fonction asynchrone si elle n'est pas elle-même `await`ée (cf. chapitre sur l'asynchrone) :

```javascript
async function chargerDonnees() {
    try {
        const reponse = await fetch("/api/donnees");
        if (!reponse.ok) {
            throw new Error(`HTTP ${reponse.status}`);
        }
        return await reponse.json();
    } catch (erreur) {
        console.log("Échec du chargement :", erreur.message);
    }
}
```

Pour une `Promise` non `await`ée, `.catch()` joue le même rôle :

```javascript
fetch("/api/donnees")
    .then(reponse => reponse.json())
    .catch(erreur => console.log("Échec :", erreur.message));
```

> **Note :** une erreur levée dans une fonction `async` ne devient pas une exception JavaScript classique immédiate — elle transforme la `Promise` renvoyée en promesse **rejetée**, récupérable uniquement via `await` dans un `try`/`catch`, ou via `.catch()`.
