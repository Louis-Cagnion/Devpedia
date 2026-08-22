---
order: 4
---

# As strings

Uma string é uma sequência de caracteres, usada para representar texto. Em JavaScript, ela pode ser escrita de 3 formas diferentes:

```javascript
// aspas simples
const str1 = 'Hello world';

// aspas duplas: estritamente equivalentes as aspas simples
const str2 = "Hello world";

// backticks (template literals): as unicas que permitem interpolacao e multi-linha
const nome = 'Joao';
const str3 = `Ola ${nome}!`;   // 'Ola Joao!' -> ${...} insere diretamente uma variavel

const str4 = `Linha 1
Linha 2`;                     // as quebras de linha do codigo fonte sao mantidas tal como estao
```

### Os protótipos de strings

Os protótipos são funções integradas ao objeto string por padrão, permitindo realizar certas ações na string. Uma string é **imutável** em JavaScript: nenhum desses métodos a modifica, cada um sempre retorna um novo valor.

| Método | Efeito |
|---|---|
| `includes(substring)` | Testa a presença de uma substring (`true`/`false`) |
| `length` | Propriedade (não um método): número de caracteres |
| `slice(inicio, fim)` | Extrai uma parte (`fim` excluído) |
| `toUpperCase()` / `toLowerCase()` | Copia inteiramente em maiúsculas / minúsculas |
| `trim()` | Copia sem os espaços desnecessários no início e no fim |
| `replace(a, b)` / `replaceAll(a, b)` | Substitui a primeira ocorrência / todas as ocorrências |
| `split(separador)` | Divide em array de substrings |
| `indexOf(substring)` | Índice da primeira ocorrência, `-1` se ausente |
| `startsWith(x)` / `endsWith(x)` | Testa se a string começa / termina com `x` |
| `repeat(n)` | Repete a string `n` vezes |
| `concat(outra)` | Junta várias strings |

```javascript
const str = 'hello world';

str.includes('hello');       // true
str.slice(0, 5);             // 'hello'
str.toUpperCase();           // 'HELLO WORLD'
str.trim();                  // copia sem espacos superfluos
str.replace('hello', 'hi');  // 'hi world', uma unica ocorrencia
str.replaceAll('o', '0');    // 'hell0 w0rld', todas as ocorrencias
str.split(' ');              // ['hello', 'world']
str.startsWith('hello');     // true
str.repeat(2);                // 'hello worldhello world'
```

> **Armadilha:** todos esses métodos retornam uma **nova** string, sem nunca modificar a original. `str.toUpperCase();` sozinho não muda nada em `str`; é preciso reatribuir: `str = str.toUpperCase();`.
>
> **Boa prática:** sempre reatribuir (ou usar diretamente) o resultado de um método de string, nunca supor que ele modificou a variável original.

### As regex

É possível usar [as regex](/?c=langages-de-programmation&s=javascript&p=regex) para buscar ou coletar informações em strings.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma string se declara com aspas simples, duplas, ou backticks (*template literals*, para interpolação e multi-linha). Ela é imutável: cada método retorna uma nova string. |
| **Ferramentas utilizáveis** | `includes`, `slice`, `toUpperCase`/`toLowerCase`, `trim`, `replace`/`replaceAll`, `split`, `indexOf`, `startsWith`/`endsWith`. |
| **Armadilhas a evitar** | Chamar um método de transformação (`toUpperCase`, `trim`...) sem reatribuir o resultado, pensando que a string original mudou. |
| **Boas práticas** | Usar backticks para toda string que interpola uma variável ou se estende por várias linhas, em vez de uma concatenação com `+`. |
