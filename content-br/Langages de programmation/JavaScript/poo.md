---
order: 8
---

# As classes e a programação orientada a objetos

Ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=poo) ou [Python](/?c=langages-de-programmation&s=python&p=poo), o objeto em JavaScript não se baseia fundamentalmente em classes: ele se baseia em **protótipos**. A sintaxe `class` (desde o ES6) é apenas açúcar sintático por cima desse mecanismo mais antigo; entender os dois ajuda a não se surpreender com certos comportamentos.

## Declarar uma classe

```javascript
class Veiculo {
    constructor(marca, modelo) {
        this.marca = marca;
        this.modelo = modelo;
    }

    descricao() {
        return `${this.marca} ${this.modelo}`;
    }
}

const v = new Veiculo("Peugeot", "308");
console.log(v.descricao());   // "Peugeot 308"
```

## A herança

```javascript
class Animal {
    constructor(nome) {
        this.nome = nome;
    }
    falar() {
        return "...";
    }
}

class Cachorro extends Animal {
    falar() {
        return `${this.nome} late`;
    }
}

class CachorroDeGuarda extends Cachorro {
    falar() {
        return super.falar() + " ruidosamente";   // chama o metodo da classe pai
    }
}
```

## Métodos e propriedades estáticos

```javascript
class Calculos {
    static adicao(a, b) {
        return a + b;
    }
}

Calculos.adicao(2, 3);   // nao precisa de "new Calculos()"
```

## Getters e setters

```javascript
class Circulo {
    constructor(raio) {
        this.raio = raio;
    }

    get area() {                 // acessado SEM parenteses: circulo.area
        return Math.PI * this.raio ** 2;
    }

    set diametro(valor) {         // "circulo.diametro = 10" chama esse metodo
        this.raio = valor / 2;
    }
}

const c = new Circulo(5);
console.log(c.area);   // calculado na hora, como um atributo
c.diametro = 10;       // equivale a c.raio = 5
```

## Campos privados (`#`)

```javascript
class ContaBancaria {
    #saldo = 0;   // o "#" torna essa propriedade inacessivel de fora da classe

    depositar(valor) {
        this.#saldo += valor;
    }

    get saldo() {
        return this.#saldo;
    }
}

const conta = new ContaBancaria();
conta.depositar(100);
console.log(conta.saldo);   // 100
console.log(conta.#saldo);  // SyntaxError: #saldo nao e acessivel aqui
```

## O que se esconde por trás de `class`: o protótipo

```javascript
console.log(typeof Veiculo);                     // "function" -> uma classe E uma funcao especial
console.log(v.__proto__ === Veiculo.prototype);  // true
```

Cada objeto JavaScript carrega uma referência oculta (`__proto__`) para outro objeto, seu **protótipo**: quando uma propriedade/método não é encontrado diretamente no objeto, JavaScript o busca automaticamente em seu protótipo, depois no protótipo desse protótipo, etc. (a "cadeia de protótipos"). `descricao()` na verdade só é definida **uma única vez**, em `Veiculo.prototype`, e compartilhada por todas as instâncias, não duplicada em cada objeto criado por `new Veiculo(...)`.

> **Nota:** essa distinção explica por que modificar `Veiculo.prototype.descricao` afeta **imediatamente** todos os objetos já criados: eles não possuem sua própria cópia do método, eles o buscam dinamicamente no protótipo compartilhado a cada chamada.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `class` é açúcar sintático por cima dos protótipos: um método é definido uma única vez em `Class.prototype`, compartilhado por todas as instâncias. `extends` gerencia a herança, `#` os campos privados. |
| **Ferramentas utilizáveis** | `static` (métodos/propriedades de classe), `get`/`set` (acessores calculados), campos privados `#nome`. |
| **Armadilhas a evitar** | Esquecer `super.metodo()` em uma classe filha que quer estender (em vez de substituir) o comportamento do pai. |
| **Boas práticas** | Usar `#` para todo dado que nunca deve ser manipulado diretamente de fora da classe. |
