---
order: 5
---

# Os arrays

Um array em JavaScript é uma estrutura que permite armazenar vários valores em uma única variável, na forma de uma lista ordenada. Cada valor é acessível via seu índice, que sempre começa em 0.

Ele pode ser criado de 2 formas diferentes:

```javascript
// literal, a mais comum
const arr1 = [1, 2, 3];

// com o construtor Array
const arr2 = new Array(1, 2, 3);

// um array pode conter tipos diferentes, incluindo outros arrays ou objetos
const arr3 = [1, 'hello', true, { id: 1 }, [1, 2]];
```

### Os protótipos de arrays

Os protótipos são funções integradas ao objeto array por padrão, permitindo realizar certas ações no array (adicionar, remover, transformar, percorrer elementos...). Uma parte modifica o array original (eles o **mutam**), a outra sempre retorna uma cópia sem tocá-lo:

| Método | Efeito | Muta o array original? |
|---|---|---|
| `includes(valor)` | Testa a presença de um valor (`true`/`false`) | Não |
| `length` | Propriedade (não um método): número de elementos | - |
| `push(x)` / `pop()` | Adiciona / remove um elemento no **fim** do array | Sim |
| `unshift(x)` / `shift()` | Adiciona / remove um elemento no **início** do array | Sim |
| `slice(inicio, fim)` | Copia uma parte (`fim` excluído) | Não |
| `splice(indice, n)` | Remove (e pode inserir) elementos em um índice dado | Sim |
| `indexOf(valor)` | Índice da primeira ocorrência, `-1` se ausente | Não |
| `map(fn)` | Novo array transformado | Não |
| `filter(fn)` | Novo array filtrado | Não |
| `forEach(fn)` | Executa uma ação por elemento, não retorna nada | Não |
| `some(fn)` / `every(fn)` | Pelo menos um / todos os elementos validam a condição | Não |
| `find(fn)` / `findIndex(fn)` | Primeiro elemento (ou seu índice) que valida a condição | Não |
| `reduce(fn, inicial)` | Reduz o array a um único valor acumulado | Não |
| `join(separador)` | Concatena os elementos em uma única string | Não |
| `reverse()` | Inverte a ordem dos elementos | Sim |
| `sort(fn)` | Ordena os elementos (veja a nota abaixo) | Sim |
| `concat(outro)` | Junta vários arrays em um novo array | Não |

```javascript
const arr = [1, 2, 3, 4, 5];

arr.includes(3);                     // true
arr.push(6);                         // arr se torna [1, 2, 3, 4, 5, 6]
arr.pop();                           // remove 6 e o retorna, arr volta a ser [1, 2, 3, 4, 5]
arr.slice(0, 2);                     // [1, 2], copia -> arr inalterado
arr.map(n => n * 2);                 // [2, 4, 6, 8, 10], copia -> arr inalterado
arr.filter(n => n > 2);              // [3, 4, 5]
arr.find(n => n > 2);                // 3, o primeiro elemento que corresponde
arr.reduce((acc, n) => acc + n, 0);  // 15, acumulador partindo de 0
arr.join(', ');                      // '1, 2, 3, 4, 5'
```

> **Nota:** por padrão, `sort()` ordena convertendo os elementos em **strings** (o que causa problema com números, ex.: `10` vem antes de `2`): fornecer uma função de comparação (`arr.sort((a, b) => a - b)`) para ordenar números corretamente.

> **Armadilha:** confundir um método que muta o array original (`push`, `splice`, `sort`, `reverse`) com um método que retorna uma cópia (`slice`, `map`, `filter`): `arr.sort()` muda silenciosamente o próprio `arr`, quando às vezes se espera obter uma cópia ordenada.
>
> **Boa prática:** verificar a coluna "Muta o array original?" acima antes de usar um método pouco familiar; copiar o array (`[...arr]` ou `slice()`) antes de uma operação mutante se o original precisar permanecer intacto.

### O destructuring e o spread

O **destructuring** permite extrair diretamente valores de um array em variáveis, na ordem dos elementos.

```javascript
const arr = [1, 2, 3];
const [primeiro, segundo] = arr; // primeiro = 1, segundo = 2
```

O **spread** (`...`) permite "desdobrar" um array, o que é útil para copiá-lo ou mesclar vários entre si.

```javascript
const copia = [...arr];         // copia independente de arr
const mesclado = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um array armazena uma lista ordenada de valores, indexada a partir de 0, podendo misturar qualquer tipo. Alguns métodos o modificam diretamente, outros retornam uma cópia transformada. |
| **Ferramentas utilizáveis** | `push`/`pop`/`shift`/`unshift`, `map`/`filter`/`reduce`, `find`/`findIndex`, `sort`, destructuring e spread (`...`). |
| **Armadilhas a evitar** | Confundir um método que muta o array original (`sort`, `splice`, `reverse`) com um método que retorna uma cópia (`slice`, `map`, `filter`). |
| **Boas práticas** | Usar `[...arr]` ou `slice()` antes de uma operação mutante se o original precisar permanecer intacto; fornecer uma função de comparação a `sort()` para ordenar números corretamente. |
