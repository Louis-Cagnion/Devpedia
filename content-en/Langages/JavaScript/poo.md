---
order: 8
---

# Classes and Object-Oriented Programming

Unlike [PHP](/?c=langages&s=php&p=poo) or [Python](/?c=langages&s=python&p=poo), objects in JavaScript are not fundamentally based on classes: they're based on **prototypes**. The `class` syntax (since ES6) is only syntactic sugar over this older mechanism; understanding both helps avoid being surprised by certain behaviors.

## Declaring a class

```javascript
class Vehicle {
    constructor(brand, model) {
        this.brand = brand;
        this.model = model;
    }

    description() {
        return `${this.brand} ${this.model}`;
    }
}

const v = new Vehicle("Peugeot", "308");
console.log(v.description());   // "Peugeot 308"
```

## Inheritance

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }
    speak() {
        return "...";
    }
}

class Dog extends Animal {
    speak() {
        return `${this.name} barks`;
    }
}

class GuardDog extends Dog {
    speak() {
        return super.speak() + " loudly";   // calls the parent class's method
    }
}
```

## Static methods and properties

```javascript
class MathOps {
    static add(a, b) {
        return a + b;
    }
}

MathOps.add(2, 3);   // no need for "new MathOps()"
```

## Getters and setters

```javascript
class Circle {
    constructor(radius) {
        this.radius = radius;
    }

    get area() {                 // accessed WITHOUT parentheses: circle.area
        return Math.PI * this.radius ** 2;
    }

    set diameter(value) {        // "circle.diameter = 10" calls this method
        this.radius = value / 2;
    }
}

const c = new Circle(5);
console.log(c.area);    // computed on the fly, like an attribute
c.diameter = 10;         // equivalent to c.radius = 5
```

## Private fields (`#`)

```javascript
class BankAccount {
    #balance = 0;   // the "#" makes this property inaccessible from outside the class

    deposit(amount) {
        this.#balance += amount;
    }

    get balance() {
        return this.#balance;
    }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.balance);    // 100
console.log(account.#balance);   // SyntaxError: #balance is not accessible here
```

## What's Behind "`class`": The Prototype

```javascript
console.log(typeof Vehicle);                      // "function" -> a class IS a special function
console.log(v.__proto__ === Vehicle.prototype);    // true
```

Every JavaScript object carries a hidden reference (`__proto__`) to another object, its **prototype**: when a property/method isn't found directly on the object, JavaScript automatically looks for it on its prototype, then on that prototype's prototype, and so on (the "prototype chain"). `description()` is actually defined **only once**, on `Vehicle.prototype`, and shared by every instance, not duplicated in each object created by `new Vehicle(...)`.

> **Note:** this distinction explains why modifying `Vehicle.prototype.description` **immediately** affects every already-created object: they don't hold their own copy of the method, they look it up dynamically on the shared prototype on every call.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `class` is syntactic sugar over prototypes: a method is defined once on `Class.prototype`, shared by every instance. `extends` handles inheritance, `#` handles private fields. |
| **Tools you can use** | `static` (class methods/properties), `get`/`set` (computed accessors), private fields `#name`. |
| **Pitfalls to avoid** | Forgetting `super.method()` in a child class that wants to extend (rather than replace) the parent's behavior. |
| **Best practices** | Use `#` for any data that should never be manipulated directly from outside the class. |
