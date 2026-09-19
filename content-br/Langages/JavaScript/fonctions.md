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
// uma unica expressao: retorno implicito, sem "return"
const adicao = (a, b) => a + b;
// parenteses opcionais com um unico parametro
const quadrado = x => x * x;
// corpo multi-linha: chaves + "return" explicito exigido
const saudar = () => { console.log("Ola"); }
```

### A verdadeira diferença: `this`

```javascript
const objeto = {
    nome: "Contador",
    valores: [1, 2, 3],

    exibirClassico: function () {
        this.valores.forEach(function (v) {
            // "this" aqui e undefined (ou o objeto global): NAO "objeto"!
            console.log(this.nome, v);
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
// valor padrao se o argumento for omitido/undefined
function saudar(nome, mensagem = "Ola") {
    return `${mensagem} ${nome}`;
}

// "rest": agrupa os argumentos excedentes em um array
function soma(...numeros) {
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

## O padrão IIFE: uma função imediatamente invocada para isolar variáveis

Uma **IIFE** (*Immediately Invoked Function Expression*) é uma função declarada e chamada em uma única expressão, nunca reutilizada pelo nome (geralmente não tem nenhum):

```javascript
(function (global) {
    const CATEGORIAS = [];   // permanece privada, invisivel do resto da pagina
    const ICONES = {};       // idem

    function svg(nome) { /* ... */ }   // idem

    global.MinhaBiblioteca = { svg };   // o UNICO ponto acessivel de fora
})(window);
```

Graças às closures (acima), todas as variáveis declaradas dentro permanecem privadas a essa função: nada de fora consegue acessá-las, exceto o que é explicitamente exposto (aqui, `global.MinhaBiblioteca`). Esse padrão é anterior aos módulos ES (`import`/`export`) e ainda é usado em JavaScript não empacotado (*non-bundled*), carregado por simples tags `<script>`: sem ele, cada variável declarada no primeiro nível de um arquivo se torna global, com o risco de outro arquivo carregado ao lado declarar uma variável com o mesmo nome e sobrescrever a primeira.

> **Boa prática:** preferir os módulos ES (`import`/`export`) assim que uma ferramenta de build já estiver disponível; reservar a IIFE para os casos em que o JavaScript é carregado diretamente por tags `<script>`, sem etapa de build.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma declaração de função sofre *hoisting* (utilizável antes de sua definição), uma expressão não. Uma função de seta não tem seu próprio `this`: ela reutiliza o da função envolvente. Uma closure mantém acesso às variáveis de sua função envolvente após a execução desta; uma IIFE aproveita essa propriedade para isolar variáveis privadas. |
| **Ferramentas utilizáveis** | Parâmetros padrão, `...` (rest/spread), uma IIFE para namespacear JavaScript não empacotado carregado via `<script>`. |
| **Armadilhas a evitar** | Usar uma função clássica (`function`) como callback em um método, esperando que `this` designe o objeto envolvente: uma função de seta é necessária para isso. |
| **Boas práticas** | Preferir funções de seta para um callback interno a um método, para manter o `this` correto. Preferir módulos ES a uma IIFE assim que houver uma ferramenta de build disponível. |
