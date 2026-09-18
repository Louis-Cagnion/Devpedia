---
order: 3
---

# Les fonctions

JavaScript propose trois façons d'écrire une fonction (déclaration, expression, fonction fléchée) qui ne sont **pas** de simples variantes stylistiques : elles diffèrent par le *hoisting* et par la gestion de `this`.

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

Ici, `addition` est une variable comme une autre : elle n'existe qu'à partir de la ligne où elle est assignée (pas de hoisting de la fonction elle-même, seulement de la déclaration `const`/`let`, qui reste inutilisable avant assignation (la "zone morte temporelle").

## Fonctions fléchées (*arrow functions*)

```javascript
const addition = (a, b) => a + b;                 // une seule expression : retour implicite, pas de "return"
const carre = x => x * x;                         // parenthèses optionnelles avec un seul paramètre
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

> **Note :** une fonction classique (`function`) reçoit son propre `this`, déterminé par **comment elle est appelée** (dynamique). Une fonction fléchée n'a **pas** son propre `this` : elle réutilise celui de la fonction englobante au moment où elle est écrite (lexical) : c'est la raison principale de préférer les fonctions fléchées pour des callbacks internes à une méthode.

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
compter();  // 1
compter();  // 2 -> "total" a persisté entre les appels, propre à CETTE instance de compteur()
```

## Le pattern IIFE : une fonction immédiatement invoquée pour isoler des variables

Une **IIFE** (*Immediately Invoked Function Expression*) est une fonction déclarée et appelée en une seule expression, jamais réutilisée par son nom (elle n'en a généralement pas) :

```javascript
(function (global) {
    const CATEGORIES = [];   // reste privee, invisible depuis le reste de la page
    const ICONS = {};        // idem

    function svg(nom) { /* ... */ }   // idem

    global.MaBibliotheque = { svg };   // SEUL point accessible depuis l'exterieur
})(window);
```

Grâce aux closures (ci-dessus), toutes les variables déclarées à l'intérieur restent privées à cette fonction : rien à l'extérieur ne peut y accéder, sauf ce qui est explicitement exposé (ici, `global.MaBibliotheque`). Ce motif précède les modules ES (`import`/`export`) et reste utilisé dans du JavaScript non regroupé (*non-bundlé*), chargé par de simples balises `<script>` : sans lui, chaque variable déclarée au premier niveau d'un fichier devient globale, avec le risque qu'un autre fichier chargé à côté déclare une variable du même nom et écrase la première.

> **Bonne pratique :** préférer les modules ES (`import`/`export`) dès qu'un outil de build est déjà en place ; réserver l'IIFE aux cas où le JavaScript est chargé directement par des balises `<script>`, sans étape de build.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une déclaration de fonction est *hoisted* (utilisable avant sa définition), une expression ne l'est pas. Une fonction fléchée n'a pas son propre `this` : elle réutilise celui de la fonction englobante. Une closure conserve l'accès aux variables de sa fonction englobante après l'exécution de celle-ci ; une IIFE exploite cette propriété pour isoler des variables privées. |
| **Outils utilisables** | Paramètres par défaut, `...` (rest/spread), une IIFE pour namespacer du JavaScript non-bundlé chargé par `<script>`. |
| **Pièges à éviter** | Utiliser une fonction classique (`function`) comme callback dans une méthode, en s'attendant à ce que `this` désigne l'objet englobant : une fonction fléchée est nécessaire pour ça. |
| **Bonnes pratiques** | Préférer les fonctions fléchées pour un callback interne à une méthode, afin de conserver le bon `this`. Préférer les modules ES à une IIFE dès qu'un outil de build est disponible. |
