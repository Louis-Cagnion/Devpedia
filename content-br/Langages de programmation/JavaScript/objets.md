---
order: 7
---

# Os objetos

Um objeto em JavaScript é uma estrutura que permite armazenar dados na forma de pares chave/valor. Ao contrário do array, a ordem não é o elemento importante: acessa-se um valor via seu nome (a chave), não via um índice numérico.

Ele pode ser criado de 2 formas diferentes:

```javascript
// literal, a mais comum
const obj1 = { nome: 'Joao', idade: 25 };

// com o construtor Object
const obj2 = new Object();
obj2.nome = 'Joao';

// um valor pode ser de qualquer tipo, incluindo uma funcao ou outro objeto
const obj3 = {
    nome: 'Joao',
    endereco: { cidade: 'Sao Paulo', cep: '01000000' },
    dizerOla: function () { console.log('ola'); }
};
```

### Acessar e modificar as propriedades

Existem 2 formas de acessar uma propriedade de um objeto: a notação por ponto, e a notação por colchetes (útil quando o nome da chave é dinâmico ou contém caracteres especiais).

```javascript
const obj = { nome: 'Joao', idade: 25 };

obj.nome;     // 'Joao'
obj['nome'];  // 'Joao', equivalente a obj.nome

obj.cidade = 'Sao Paulo';  // adiciona uma propriedade
obj.idade = 26;            // modifica uma propriedade

delete obj.idade;                // remove uma propriedade
```

### Os métodos estáticos de Object

Ao contrário dos protótipos de string ou array, essas funções não são usadas diretamente no objeto, mas em `Object`, passando o objeto como parâmetro:

| Método | Efeito |
|---|---|
| `Object.keys(obj)` | Array contendo apenas as chaves |
| `Object.values(obj)` | Array contendo apenas os valores |
| `Object.entries(obj)` | Array de pares `[chave, valor]`, útil para percorrer com um laço ou `forEach` |
| `Object.assign(destino, ...origens)` | Copia as propriedades dos objetos origem no objeto destino, retorna o destino; frequentemente usado para mesclar ou copiar |
| `Object.freeze(obj)` | Impede qualquer modificação (adição, remoção, mudança): ignorada silenciosamente, ou erro em modo estrito |
| `Object.fromEntries(pares)` | Inverso de `Object.entries`: transforma um array de pares `[chave, valor]` em objeto |

```javascript
const obj = { nome: 'Joao', idade: 25 };

Object.keys(obj);     // ['nome', 'idade']
Object.values(obj);   // ['Joao', 25]
Object.entries(obj);  // [['nome', 'Joao'], ['idade', 25]]

const copia = Object.assign({}, obj);                          // copia de obj
const mesclado = Object.assign({}, obj, { cidade: 'Sao Paulo' }); // { nome: 'Joao', idade: 25, cidade: 'Sao Paulo' }

Object.freeze(obj);
obj.idade = 30;                  // nao tem nenhum efeito, obj.idade continua 25

Object.fromEntries([['nome', 'Joao'], ['idade', 25]]); // { nome: 'Joao', idade: 25 }
```

### Verificar uma propriedade

```javascript
const obj = { nome: 'Joao', idade: 25 };

obj.hasOwnProperty('nome');      // true -> chave presente no proprio objeto
obj.hasOwnProperty('desconhecido');  // false

'nome' in obj;                      // true -> tambem testa as propriedades herdadas, ao contrario de hasOwnProperty
```

`hasOwnProperty` é um protótipo disponível diretamente em um objeto; `in` também verifica a existência de uma chave, mas incluindo as propriedades herdadas.

### O destructuring e o spread

O **destructuring** permite extrair diretamente certas propriedades de um objeto em variáveis, usando o nome das chaves.

```javascript
const obj = { nome: 'Joao', idade: 25 };
const { nome, idade } = obj;   // nome = 'Joao', idade = 25

const { nome: apelido } = obj; // renomeia a variavel durante o destructuring -> apelido = 'Joao'
```

O **spread** (`...`) permite "desdobrar" um objeto, o que é útil para copiá-lo ou mesclar vários entre si.

```javascript
const copia = { ...obj };                      // copia independente de obj
const mesclado = { ...obj, cidade: 'Sao Paulo' }; // { nome: 'Joao', idade: 25, cidade: 'Sao Paulo' }
```

> **Armadilha:** `{ ...obj }` e `Object.assign({}, obj)` fazem apenas uma cópia **superficial** (*shallow copy*): se uma propriedade for ela mesma um objeto ou array, a cópia e o original continuam compartilhando a **mesma** referência a esse objeto aninhado: modificá-lo a partir de um o modifica também a partir do outro.
>
> **Boa prática:** para uma cópia realmente independente de um objeto com propriedades aninhadas, usar `structuredClone(obj)` (nativo, moderno) ou reconstruir manualmente os níveis aninhados.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um objeto armazena pares chave/valor, acessíveis por notação de ponto ou por colchetes. `Object.keys`/`values`/`entries` expõem seu conteúdo; o spread e o destructuring copiam ou extraem propriedades. |
| **Ferramentas utilizáveis** | `Object.keys`/`values`/`entries`/`assign`/`freeze`/`fromEntries`, `hasOwnProperty`, o operador `in`. |
| **Armadilhas a evitar** | Acreditar que uma cópia por spread ou `Object.assign` é profunda: ela não é, para as propriedades aninhadas. |
| **Boas práticas** | Usar `structuredClone()` para uma cópia realmente independente de um objeto aninhado; `Object.freeze()` para impedir qualquer modificação acidental de um objeto que deve permanecer constante. |
