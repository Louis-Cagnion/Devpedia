---
order: 3
---

# As funções

O JavaScript oferece três formas de escrever uma função — declaração, expressão e função com seta — que não são meras variantes estilísticas: diferem no *hoisting* e na gestão d`this`o.

## Declaração de função

```javascript
function addition(a, b) {
    return a + b;
}

addition(2, 3);   // 5
```

Uma **declaração** de função é *«hoisted»* (elevada): pode ser utilizada mesmo **antes** da linha da sua definição no ficheiro, ao contrário de uma expressão de função.

```javascript
console.log(addition(2, 3));  // Funciona, mesmo que tenha sido escrita antes da declaração que se segue
function addition(a, b) { return a + b; }
```

## Expressão de função

```javascript
const addition = function (a, b) {
    return a + b;
};
```

Aqui, `addition` é uma variável como qualquer outra: só existe a partir da linha em que é atribuída (não há hoisting da própria função, apenas da declaração `const` / `let`, que permanece inutilizável antes da atribuição — a «zona morta temporária»).

## Funções-seta (*arrow functions*)

```javascript
const addition = (a, b) => a + b;              // uma única expressão: retorno implícito, sem «return»
const carre = x => x * x;                        // parênteses opcionais com um único parâmetro
const saluer = () => { console.log("Bonjour"); }  // corpo com várias linhas: chaves + «return» explícito obrigatório
```

### A verdadeira diferença: `this`

```javascript
const objeto = {
    nome: "Compteur",
    valores: [1, 2, 3],

    afficherClassique: function () {
        this.valores.forEach(function (v) {
            console.log(this.nome, v);   // «this» aqui é indefinido (ou o objeto global): NÃO é «objeto»!
        });
    },

    afficherFlechee: function () {
        this.valores.forEach((v) => {
            console.log(this.nome, v);   // «this» retoma o valor de afficherFlechee -> funciona
        });
    },
};
```

> **Nota:** uma função clássica (`function`) recebe o seu próprio `this`, determinado pela **forma como é chamada** (dinâmico). Uma função com setor não tem o seu próprio `this`: reutiliza o da função que a engloba no momento em que é escrita (lexical) — esta é a principal razão para se preferirem as funções com setor para callbacks internos a um método.

## Parâmetros por predefinição, rest e spread

```javascript
function saluer(nome, mensagem = "Bonjour") {   // valor por defeito se o argumento for omitido/não definido
    return `${mensagem} ${nome}`;
}

function somme(...números) {                    // «rest»: agrupa os argumentos excedentes numa matriz
    return números.reduce((total, n) => total + n, 0);
}
somme(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // «spread»: expande os elementos de um array -> [1, 2, 3, 4, 5]
```

## Closures

Uma função aninhada mantém o acesso às variáveis da função que a engloba, mesmo depois de esta ter terminado a sua execução:

```javascript
function contador() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const compter = contador();
compter();   // 1
compter();   // 2 -> «total» foi mantido entre as chamadas, específico desta instância de contador()
```
