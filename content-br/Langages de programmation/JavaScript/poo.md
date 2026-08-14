---
order: 7
---

# As classes e a programação orientada para objetos

Ao contrário do PHP ou do Python, o objeto em JavaScript não se baseia fundamentalmente em classes: baseia-se em **protótipos**. A sintaxe «`class`» (a partir do ES6) é apenas um sintaxe simplificada sobre este mecanismo mais antigo; compreender ambos ajuda a não ser surpreendido por certos comportamentos.

## Declarar uma classe

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

## A herança

```javascript
class Animal {
    constructor(nome) {
        this.nome = nome;
    }
    parler() {
        return "...";
    }
}

class Chien extends Animal {
    parler() {
        return `${this.nome} aboie`;
    }
}

class ChienDeGarde extends Chien {
    parler() {
        return super.parler() + " bruyamment";   // chama o método da classe pai
    }
}
```

## Métodos e propriedades estáticas

```javascript
class Calculs {
    static addition(a, b) {
        return a + b;
    }
}

Calculs.addition(2, 3);   // não é necessário «new Calculs()»
```

## Getters e setters

```javascript
class Cercle {
    constructor(rayon) {
        this.rayon = rayon;
    }

    get surface() {              // acessado SEM parênteses: círculo.área
        return Math.PI * this.rayon ** 2;
    }

    set diametre(valor) {        // "círculo.diâmetro = 10" chama este método
        this.rayon = valor / 2;
    }
}

const c = new Cercle(5);
console.log(c.surface);   // calculado dinamicamente, como um atributo
c.diametre = 10;            // equivale a c.raio = 5
```

## 

```javascript
class CompteBancaire {
    #saldo = 0;   // O símbolo «#» torna esta propriedade inacessível a partir do exterior da classe

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
console.log(compte.#saldo);    // SyntaxError: #saldo não está acessível aqui
```

## O que se esconde por trás de «`class`»: o protótipo

```javascript
console.log(typeof Vehicule);           // «function» -> uma classe É uma função especial
console.log(v.__proto__ === Vehicule.prototype);  // true
```

Cada objeto JavaScript possui uma referência oculta (`__proto__`) a outro objeto, o seu **protótipo**: quando uma propriedade ou método não é encontrado diretamente no objeto, o JavaScript procura-o automaticamente no seu protótipo, depois no protótipo desse protótipo, e assim sucessivamente. (a «cadeia de protótipos»). `description()` é, na realidade, definida **apenas uma vez**, em `Vehicule.prototype`, e partilhada por todas as instâncias: não é duplicada em cada objeto criado por `new Vehicule(...)`.

> **Nota:** esta distinção explica por que razão a alteração de `Vehicule.prototype.description` afeta **imediatamente** todos os objetos já criados: estes não possuem a sua própria cópia do método, procurando-a dinamicamente no protótipo partilhado a cada chamada.
