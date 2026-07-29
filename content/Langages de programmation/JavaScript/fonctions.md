---
order: 3
---

# Les fonctions

JavaScript propose trois façons d'écrire une fonction — déclaration, expression, fonction fléchée — qui ne sont **pas** de simples variantes stylistiques : elles diffèrent par le *hoisting* et par la gestion de `this`.

## Déclaration de fonction

```javascript
function addition(a, b) {
    return a + b;
}

addition(2, 3);   // 5
```

Une **déclaration** de fonction est *hoisted* (hissée) : elle est utilisable même **avant** sa ligne de définition dans le fichier, contrairement à une expression de fonction.

```javascript
console.log(addition(2, 3));  // fonctionne, même écrit avant la déclaration plus bas
function addition(a, b) { return a + b; }
```

## Expression de fonction

```javascript
const addition = function (a, b) {
    return a + b;
};
```

Ici, `addition` est une variable comme une autre : elle n'existe qu'à partir de la ligne où elle est assignée (pas de hoisting de la fonction elle-même, seulement de la déclaration `const`/`let`, qui reste inutilisable avant assignation — la "zone morte temporelle").

## Fonctions fléchées (*arrow functions*)

```javascript
const addition = (a, b) => a + b;              // une seule expression : retour implicite, pas de "return"
const carre = x => x * x;                        // parenthèses optionnelles avec un seul paramètre
const saluer = () => { console.log("Bonjour"); }  // corps multi-lignes : accolades + "return" explicite requis
```

### La vraie différence : `this`

```javascript
const objet = {
    nom: "Compteur",
    valeurs: [1, 2, 3],

    afficherClassique: function () {
        this.valeurs.forEach(function (v) {
            console.log(this.nom, v);   // "this" ici est undefined (ou l'objet global) : PAS "objet" !
        });
    },

    afficherFlechee: function () {
        this.valeurs.forEach((v) => {
            console.log(this.nom, v);   // "this" reprend celui de afficherFlechee -> fonctionne
        });
    },
};
```

> **Note :** une fonction classique (`function`) reçoit son propre `this`, déterminé par **comment elle est appelée** (dynamique). Une fonction fléchée n'a **pas** son propre `this` : elle réutilise celui de la fonction englobante au moment où elle est écrite (lexical) — c'est la raison principale de préférer les fonctions fléchées pour des callbacks internes à une méthode.

## Paramètres par défaut, rest et spread

```javascript
function saluer(nom, message = "Bonjour") {   // valeur par défaut si l'argument est omis/undefined
    return `${message} ${nom}`;
}

function somme(...nombres) {                    // "rest" : regroupe les arguments en excès dans un tableau
    return nombres.reduce((total, n) => total + n, 0);
}
somme(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // "spread" : déploie les éléments d'un tableau -> [1, 2, 3, 4, 5]
```

## Closures

Une fonction imbriquée conserve l'accès aux variables de la fonction englobante, même après que celle-ci a fini de s'exécuter :

```javascript
function compteur() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const compter = compteur();
compter();   // 1
compter();   // 2 -> "total" a persisté entre les appels, propre à CETTE instance de compteur()
```
