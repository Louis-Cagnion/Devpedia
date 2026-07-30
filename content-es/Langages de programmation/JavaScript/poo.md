---
order: 7
---

# Las clases y la programación orientada a objetos

A diferencia de PHP o Python, los objetos en JavaScript no se basan fundamentalmente en clases, sino en **prototipos**. La sintaxis «`class`» (desde ES6) no es más que sintaxis simplificada sobre este mecanismo más antiguo; comprender ambos ayuda a no sorprenderse ante ciertos comportamientos.

## Declarar una clase

```javascript
class Vehicule {
    constructor(marca, modelo) {
        this.marca = marca;
        this.modelo = modelo;
    }

    description() {
        return `${this.marca} ${this.modelo}`;
    }
}

const v = new Vehicule("Peugeot", "308");
console.log(v.description());   // «Peugeot 308»
```

## La herencia

```javascript
class Animal {
    constructor(número) {
        this.número = número;
    }
    parler() {
        return "...";
    }
}

class Chien extends Animal {
    parler() {
        return `${this.número} aboie`;
    }
}

class ChienDeGarde extends Chien {
    parler() {
        return super.parler() + " bruyamment";   // llama al método de la clase padre
    }
}
```

## Métodos y propiedades estáticas

```javascript
class Calculs {
    static addition(a, b) {
        return a + b;
    }
}

Calculs.addition(2, 3);   // No hace falta «new Calculs()».
```

## Getters y setters

```javascript
class Cercle {
    constructor(rayon) {
        this.rayon = rayon;
    }

    get surface() {              // Acceso SIN paréntesis: círculo.superficie
        return Math.PI * this.rayon ** 2;
    }

    set diametre(valor) {        // «círculo.diámetro = 10» invoca este método
        this.rayon = valor / 2;
    }
}

const c = new Cercle(5);
console.log(c.surface);   // calculado sobre la marcha, como un atributo
c.diametre = 10;            // equivale a c.rayon = 5
```

## 

```javascript
class CompteBancaire {
    #saldo = 0;   // El símbolo «#» hace que esta propiedad no sea accesible desde fuera de la clase.

    deposer(montant) {
        this.#saldo += montant;
    }

    get saldo() {
        return this.#saldo;
    }
}

const compte = new CompteBancaire();
compte.deposer(100);
console.log(compte.saldo);    // 100
console.log(compte.#saldo);    // SyntaxError: #saldo no es accesible aquí
```

## Lo que hay detrás de «`class`»: el prototipo

```javascript
console.log(typeof Vehicule);           // «function» -> una clase ES una función especial
console.log(v.__proto__ === Vehicule.prototype);  // true
```

Cada objeto de JavaScript contiene una referencia oculta (`__proto__`) a otro objeto, su **prototipo**: cuando no se encuentra una propiedad o un método directamente en el objeto, JavaScript lo busca automáticamente en su prototipo, luego en el prototipo de ese prototipo, y así sucesivamente. (la «cadena de prototipos»). `description()`, en realidad, **solo** se define **una vez**, en `Vehicule.prototype`, y es compartida por todas las instancias; no se duplica en cada objeto creado por `new Vehicule(...)`.

> **Nota:** esta distinción explica por qué al modificar `Vehicule.prototype.description` se ven afectados **inmediatamente** todos los objetos ya creados: no disponen de su propia copia del método, sino que la buscan dinámicamente en el prototipo compartido en cada llamada.
