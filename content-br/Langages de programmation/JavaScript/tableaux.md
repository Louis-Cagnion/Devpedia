---
order: 5
---

# As tabelas

Um array em JavaScript é uma estrutura que permite armazenar vários valores numa única variável, sob a forma de uma lista ordenada. Cada valor é acessível através do seu índice, que começa sempre em 0.

Pode ser criada de duas formas diferentes:
```javascript
    // literal, a mais comum
    const arr1 = [1, 2, 3];

    // com o operador Array
    const arr2 = new Array(1, 2, 3);

    // Um array pode conter tipos diferentes, incluindo outros arrays ou objetos
    const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Os protótipos de tabelas

Os protótipos são funções integradas por padrão no objeto array, que permitem realizar determinadas ações na matriz (adicionar, remover, transformar, percorrer elementos...).

```javascript
    const arr = [1, 2, 3, 4, 5];
```

**`includes`** verifica se um valor está presente na matriz e devolve «`true`» ou «`false`».
```javascript
    arr.includes(3); // true
```

**`length`** não é uma função, mas sim uma propriedade: devolve o número de elementos do array.
```javascript
    arr.length; // 5
```

**`push`** e **`pop`** alteram o array no seu final: `push` adiciona um elemento, `pop` retira o último elemento e devolve-o.
```javascript
    arr.push(6); // arr passa a ser [1, 2, 3, 4, 5, 6]
    arr.pop(); // retira o 6 e devolve-o; arr volta a ser [1, 2, 3, 4, 5]
```

**`unshift`** e **`shift`** fazem o mesmo que `push` / `pop`, mas no início da tabela.
```javascript
    arr.unshift(0); // arr passa a ser [0, 1, 2, 3, 4, 5]
    arr.shift(); // retira o 0 e devolve-o; arr volta a ser [1, 2, 3, 4, 5]
```

**`slice`** retorna uma cópia de uma parte da matriz, entre um índice inicial (incluído) e um índice final (excluído), sem alterar a matriz original.
```javascript
    arr.slice(0, 2); // [1, 2]
```

**`splice`** altera diretamente o tabuleiro: retira um determinado número de elementos a partir de um índice específico e também pode inserir novos elementos no mesmo local.
```javascript
    arr.splice(1, 2); // retira 2 elementos a partir do índice 1; arr passa a ser [1, 4, 5]
```

**`indexOf`** Procura um valor na tabela e devolve o seu índice. Se o valor não existir, devolve «`-1`».
```javascript
    arr.indexOf(3); // 2
```

**`map`** Cria um novo tabuleiro aplicando uma função a cada elemento. O tabuleiro original não é alterado.
```javascript
    arr.map(n => n * 2); // [2, 4, 6, 8, 10]
```

**`filter`** Cria um novo array que contém apenas os elementos que satisfazem uma condição (uma função que devolve `true` ou `false`).
```javascript
    arr.filter(n => n > 2); // [3, 4, 5]
```

**`forEach`** Executa uma função para cada elemento da matriz, mas não devolve qualquer valor. Serve principalmente para realizar uma ação (por exemplo, uma visualização), e não para transformar dados.
```javascript
    arr.forEach(n => console.log(n));
```

**`some`** retorna «`true`» se pelo menos um elemento da matriz satisfizer uma condição.
```javascript
    arr.some(n => n > 4); // true
```

**`every`** retorna «`true`» apenas se todos os elementos da matriz satisfizerem uma condição.
```javascript
    arr.every(n => n > 0); // true
```

**`find`** retorna o primeiro elemento que satisfaz uma condição ou «`undefined`» se nenhum elemento corresponder.
```javascript
    arr.find(n => n > 2); // 3
```

**`findIndex`** Funciona como `find`, mas devolve o índice do elemento encontrado (ou `-1` se não for encontrado nenhum).
```javascript
    arr.findIndex(n => n > 2); // 2
```

**`reduce`**  percorre a tabela para a reduzir a um único valor, acumulando um resultado em cada etapa. O primeiro parâmetro é a função de acumulação, o segundo é o valor inicial do acumulador.
```javascript
    arr.reduce((acc, n) => acc + n, 0); // 15
```

**`join`** transforma o tabuleiro numa única cadeia de caracteres, separando cada elemento pelo carácter indicado como parâmetro.
```javascript
    arr.join(', '); // «1, 2, 3, 4, 5»
```

**`reverse`** inverte a ordem dos elementos do array e altera diretamente o array original.
```javascript
    arr.reverse(); // [5, 4, 3, 2, 1]
```

**`sort`** ordena os elementos da matriz. Por padrão, a ordenação é feita convertendo os elementos em cadeias de caracteres (o que causa problemas com os números); por isso, é necessário fornecer uma função de comparação para ordenar os números corretamente.
```javascript
    arr.sort((a, b) => a - b);
```

**`concat`** agrupa várias tabelas numa única tabela nova, sem alterar as tabelas originais.
```javascript
    arr.concat([6, 7]); // [1, 2, 3, 4, 5, 6, 7]
```

### A desestruturação e o spread

A **desestruturação** permite extrair diretamente valores de um array para variáveis, na ordem dos elementos.
```javascript
    const arr = [1, 2, 3];
    const [premier, deuxieme] = arr; // primeiro = 1, segundo = 2
```

A função **«spread»** (`...`) permite «desdobrar» uma tabela, o que é útil para a copiar ou para fundir várias tabelas entre si.
```javascript
    const copie = [...arr]; // cópia independente de arr
    const fusion = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```
