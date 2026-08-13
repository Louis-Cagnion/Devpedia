---
order: 7
---

# Classes and Object-Oriented Programming

Unlike [PHP](/?c=langages-de-programmation&s=php&p=poo) or [Python](/?c=langages-de-programmation&s=python&p=poo), objects in JavaScript are not fundamentally based on classes; they are based on **prototypes**. The syntax `class` (introduced in ES6) is merely syntactic sugar built on top of this older mechanism—understanding both helps prevent surprises regarding certain behaviors.

## Declare a Class

```javascript
class Vehicule {
    constructor(brand, model) {
        this.brand = brand;
        this.model = model;
    }

    description() {
        return `${this.brand} ${this.model}`;
    }
}

const v = new Vehicule("Peugeot", "308");
console.log(v.description());   // "Peugeot 308"
```

## The Legacy

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }
    parler() {
        return "...";
    }
}

class Chien extends Animal {
    parler() {
        return `${this.name} aboie`;
    }
}

class ChienDeGarde extends Chien {
    parler() {
        return super.parler() + " bruyamment";   // calls the parent class's method
    }
}
```

## Methods and Static Properties

```javascript
class Calculs {
    static addition(a, b) {
        return a + b;
    }
}

Calculs.addition(2, 3);   // No need for "new Calculs()"
```

## Getters and setters

```javascript
class Cercle {
    constructor(rayon) {
        this.rayon = rayon;
    }

    get surface() {              // accessed WITHOUT parentheses: circle.area
        return Math.PI * this.rayon ** 2;
    }

    set diametre(value) {        // "circle.diameter = 10" calls this method
        this.rayon = value / 2;
    }
}

const c = new Cercle(5);
console.log(c.surface);   // calculated on the fly, like an attribute
c.diametre = 10;            // is equivalent to c.radius = 5
```

## 

```javascript
class CompteBancaire {
    #balance = 0;   // The "#" makes this property inaccessible from outside the class

    deposer(montant) {
        this.#balance += montant;
    }

    get balance() {
        return this.#balance;
    }
}

const compte = new CompteBancaire();
compte.deposer(100);
console.log(compte.balance);    // 100
console.log(compte.#balance);    // SyntaxError: #balance is not accessible here
```

## What's Behind "`class`": The Prototype

```javascript
console.log(typeof Vehicule);           // "function" -> a class IS a special function
console.log(v.__proto__ === Vehicule.prototype);  // true
```

Every JavaScript object carries a hidden reference (`__proto__`) to another object, its **prototype**—when a property or method is not found directly on the object, JavaScript automatically looks for it on its prototype, then on the prototype of that prototype, and so on. (the “prototype chain”). `description()` is actually defined **only once**, at `Vehicule.prototype`, and shared by all instances—it is not duplicated in every object created by `new Vehicule(...)`.

> **Note:** This distinction explains why modifying `Vehicule.prototype.description` **immediately** affects all objects that have already been created: they do not have their own copy of the method; instead, they dynamically look for it in the shared prototype each time it is called.
