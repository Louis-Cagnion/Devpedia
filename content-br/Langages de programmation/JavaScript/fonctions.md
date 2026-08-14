---
order: 3
---

# As funções

JavaScript oferece três formas de escrever uma função (declaração, expressão, função de seta) que **não são** simples variantes estilísticas: elas diferem pelo *hoisting* e pelo gerenciamento de `this`.

## Declaração de função

```javascript
function adicao(a, b) {
    return a + b;
}

adicao(2, 3);   // 5
```

Uma **declaração** de função sofre *hoisting* (é içada): ela é utilizável mesmo **antes** de sua linha de definição no arquivo, ao contrário de uma expressão de função.

```javascript
console.log(adicao(2, 3));  // funciona, mesmo escrito antes da declaracao mais abaixo
function adicao(a, b) { return a + b; }
```

## Expressão de função

```javascript
const adicao = function (a, b) {
    return a + b;
};
```

Aqui, `adicao` é uma variável como qualquer outra: ela só existe a partir da linha onde é atribuída (nenhum hoisting da própria função, apenas da declaração `const`/`let`, que permanece inutilizável antes da atribuição, a "zona morta temporal").

## Funções de seta (*arrow functions*)

```javascript
const adicao = (a, b) => a + b;                   // uma unica expressao: retorno implicito, sem "return"
const quadrado = x => x * x;                      // parenteses opcionais com um unico parametro
const saudar = () => { console.log("Ola"); }      // corpo multi-linha: chaves + "return" explicito exigido
```

### A verdadeira diferença: `this`

```javascript
const objeto = {
    nome: "Contador",
    valores: [1, 2, 3],

    exibirClassico: function () {
        this.valores.forEach(function (v) {
            console.log(this.nome, v);   // "this" aqui e undefined (ou o objeto global): NAO "objeto"!
        });
    },

    exibirSeta: function () {
        this.valores.forEach((v) => {
            console.log(this.nome, v);   // "this" retoma o de exibirSeta -> funciona
        });
    },
};
```

> **Nota:** uma função clássica (`function`) recebe seu próprio `this`, determinado por **como ela é chamada** (dinâmico). Uma função de seta **não tem** seu próprio `this`: ela reutiliza o da função envolvente no momento em que é escrita (léxico): é a razão principal para preferir funções de seta para callbacks internos a um método.

## Parâmetros padrão, rest e spread

```javascript
function saudar(nome, mensagem = "Ola") {   // valor padrao se o argumento for omitido/undefined
    return `${mensagem} ${nome}`;
}

function soma(...numeros) {                   // "rest": agrupa os argumentos excedentes em um array
    return numeros.reduce((total, n) => total + n, 0);
}
soma(1, 2, 3, 4);   // 10

const a = [1, 2, 3];
const b = [...a, 4, 5];   // "spread": expande os elementos de um array -> [1, 2, 3, 4, 5]
```

## Closures

Uma função aninhada mantém acesso às variáveis da função envolvente, mesmo depois que esta terminou de executar:

```javascript
function contador() {
    let total = 0;
    return function () {
        total++;
        return total;
    };
}

const contar = contador();
contar();  // 1
contar();  // 2 -> "total" persistiu entre as chamadas, proprio a ESSA instancia de contador()
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma declaração de função sofre *hoisting* (utilizável antes de sua definição), uma expressão não. Uma função de seta não tem seu próprio `this`: ela reutiliza o da função envolvente. Uma closure mantém acesso às variáveis de sua função envolvente após a execução desta. |
| **Ferramentas utilizáveis** | Parâmetros padrão, `...` (rest/spread). |
| **Armadilhas a evitar** | Usar uma função clássica (`function`) como callback em um método, esperando que `this` designe o objeto envolvente: uma função de seta é necessária para isso. |
| **Boas práticas** | Preferir funções de seta para um callback interno a um método, para manter o `this` correto. |
