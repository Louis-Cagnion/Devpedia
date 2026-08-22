---
order: 8
---

# Les classes et la programmation orientée objet

Contrairement à [PHP](/?c=langages-de-programmation&s=php&p=poo) ou [Python](/?c=langages-de-programmation&s=python&p=poo), l'objet en JavaScript ne repose pas fondamentalement sur des classes : il repose sur des **prototypes**. La syntaxe `class` (depuis ES6) n'est que du sucre syntaxique par-dessus ce mécanisme plus ancien ; comprendre les deux aide à ne pas être surpris par certains comportements.

## Déclarer une classe

```javascript
class Vehicule {
    constructor(marque, modele) {
        this.marque = marque;
        this.modele = modele;
    }

    description() {
        return `${this.marque} ${this.modele}`;
    }
}

const v = new Vehicule("Peugeot", "308");
console.log(v.description());   // "Peugeot 308"
```

## L'héritage

```javascript
class Animal {
    constructor(nom) {
        this.nom = nom;
    }
    parler() {
        return "...";
    }
}

class Chien extends Animal {
    parler() {
        return `${this.nom} aboie`;
    }
}

class ChienDeGarde extends Chien {
    parler() {
        return super.parler() + " bruyamment";   // appelle la méthode de la classe parente
    }
}
```

## Méthodes et propriétés statiques

```javascript
class Calculs {
    static addition(a, b) {
        return a + b;
    }
}

Calculs.addition(2, 3);   // pas besoin de "new Calculs()"
```

## Getters et setters

```javascript
class Cercle {
    constructor(rayon) {
        this.rayon = rayon;
    }

    get surface() {              // accédé SANS parenthèses : cercle.surface
        return Math.PI * this.rayon ** 2;
    }

    set diametre(valeur) {        // "cercle.diametre = 10" appelle cette méthode
        this.rayon = valeur / 2;
    }
}

const c = new Cercle(5);
console.log(c.surface);  // calculé à la volée, comme un attribut
c.diametre = 10;         // équivaut à c.rayon = 5
```

## Champs privés (`#`)

```javascript
class CompteBancaire {
    #solde = 0;   // le "#" rend cette propriété inaccessible depuis l'extérieur de la classe

    deposer(montant) {
        this.#solde += montant;
    }

    get solde() {
        return this.#solde;
    }
}

const compte = new CompteBancaire();
compte.deposer(100);
console.log(compte.solde);   // 100
console.log(compte.#solde);  // SyntaxError : #solde n'est pas accessible ici
```

## Ce qui se cache derrière `class` : le prototype

```javascript
console.log(typeof Vehicule);                     // "function" -> une classe EST une fonction spéciale
console.log(v.__proto__ === Vehicule.prototype);  // true
```

Chaque objet JavaScript porte une référence cachée (`__proto__`) vers un autre objet, son **prototype** : quand une propriété/méthode n'est pas trouvée directement sur l'objet, JavaScript la cherche automatiquement sur son prototype, puis le prototype de ce prototype, etc. (la "chaîne de prototypes"). `description()` n'est en réalité définie **qu'une seule fois**, sur `Vehicule.prototype`, et partagée par toutes les instances, pas dupliquée dans chaque objet créé par `new Vehicule(...)`.

> **Note :** cette distinction explique pourquoi modifier `Vehicule.prototype.description` affecte **immédiatement** tous les objets déjà créés : ils ne possèdent pas leur propre copie de la méthode, ils la cherchent dynamiquement sur le prototype partagé à chaque appel.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `class` est du sucre syntaxique par-dessus les prototypes : une méthode est définie une seule fois sur `Class.prototype`, partagée par toutes les instances. `extends` gère l'héritage, `#` les champs privés. |
| **Outils utilisables** | `static` (méthodes/propriétés de classe), `get`/`set` (accesseurs calculés), champs privés `#nom`. |
| **Pièges à éviter** | Oublier `super.methode()` dans une classe fille qui veut étendre (plutôt que remplacer) le comportement du parent. |
| **Bonnes pratiques** | Utiliser `#` pour toute donnée qui ne doit jamais être manipulée directement depuis l'extérieur de la classe. |
