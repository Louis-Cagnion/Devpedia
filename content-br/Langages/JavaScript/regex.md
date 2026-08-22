---
order: 9
---

# As regex

Uma regex (expressão regular) é um padrão usado para buscar, validar ou substituir trechos de texto em uma string.

Ela pode ser escrita de 2 formas diferentes:

```javascript
// literal, a mais comum
const re1 = /hello/;

// com o construtor RegExp, util quando o padrao e dinamico
const re2 = new RegExp('hello');
```

### As flags

As flags são colocadas depois da última barra e modificam o comportamento da regex; é possível combinar várias (`/hello/gi`):

| Flag | Nome | Efeito |
|---|---|---|
| `g` | *global* | Busca **todas** as ocorrências na string, não apenas a primeira |
| `i` | *insensitive* | Ignora maiúsculas/minúsculas |
| `m` | *multiline* | `^`/`$` correspondem ao início/fim de **cada linha**, não apenas de toda a string |

### Os protótipos de regex

Os protótipos são funções integradas ao objeto RegExp por padrão, permitindo realizar certas ações com a regex:

| Método | Retorna |
|---|---|
| `regex.test(str)` | `true`/`false` conforme a string corresponda à regex |
| `regex.exec(str)` | Detalhes da primeira correspondência (ou `null`): índice 0 = correspondência completa, índices seguintes = grupos capturados |

```javascript
const re = /wor(l)d/;
const str = 'hello world';

re.test(str);  // true
re.exec(str);  // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Os protótipos de strings que usam regex

Alguns protótipos do objeto string aceitam uma regex como parâmetro para realizar buscas ou substituições mais avançadas:

| Método | Retorna |
|---|---|
| `str.match(regex)` | Primeira correspondência (ou `null`); com a flag `g`, todas as correspondências mas sem detalhe dos grupos |
| `str.matchAll(regex)` | Iterador de todas as correspondências, com seus grupos; flag `g` **obrigatória** |
| `str.search(regex)` | Índice da primeira correspondência, `-1` se ausente |
| `str.replace(regex, x)` | Substitui a primeira ocorrência (ou todas, com a flag `g`) |
| `str.replaceAll(regex, x)` | Substitui todas as ocorrências; flag `g` **obrigatória**, senão erro |
| `str.split(regex)` | Divide em array de substrings, a regex servindo de separador |

```javascript
const str = 'hello world';

str.match(/o/g);         // ['o', 'o']
str.search(/world/);     // 6
str.replace(/o/g, '0');  // 'hell0 w0rld'
str.split(/\s/);         // ['hello', 'world']
```

`matchAll` dá acesso ao detalhe de cada correspondência (grupos incluídos), enquanto `match` com `g` só retorna as correspondências brutas:

```javascript
const str2 = "Joao:25 Maria:30";
const resultado = [...str2.matchAll(/(\w+):(\d+)/g)];

console.log(resultado);
/*
[
    ["Joao:25", "Joao", "25", index: 0, input: "Joao:25 Maria:30", groups: undefined],
    ["Maria:30", "Maria", "30", index: 8, input: "Joao:25 Maria:30", groups: undefined]
]
-> para cada correspondencia: a string completa, depois cada grupo capturado (\w+ e \d+)
*/
```

### Os grupos de captura

Os parênteses em uma regex permitem capturar uma parte precisa da correspondência. Essas partes capturadas são então recuperáveis via `exec` ou `match`:

```javascript
const re = /(\d{4})-(\d{2})-(\d{2})/;
const data = '2024-06-15';

const resultado = data.match(re);
resultado[1];  // '2024' (ano)
resultado[2];  // '06' (mes)
resultado[3];  // '15' (dia)
```

Também é possível nomear os grupos para torná-los mais legíveis, e acessá-los pelo nome via a propriedade `groups`:

```javascript
const reNomeado = /(?<ano>\d{4})-(?<mes>\d{2})-(?<dia>\d{2})/;
const resultadoNomeado = reNomeado.exec(data);
resultadoNomeado.groups.ano; // '2024'
```

> **Armadilha:** uma regex literal com a flag `g`, reutilizada várias vezes com `.test()` ou `.exec()`, mantém um estado interno (`lastIndex`) entre as chamadas: um segundo `.test()` na mesma regex pode retornar `false` mesmo que o texto corresponda, simplesmente porque a busca retoma depois da posição da correspondência anterior. Criar uma nova regex (ou reiniciar `lastIndex = 0`) evita essa armadilha.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma regex descreve um padrão de busca/validação/substituição em uma string. `test()` retorna um booleano, `exec()`/`match()`/`matchAll()` dão acesso aos detalhes da correspondência (incluindo os grupos capturados). |
| **Ferramentas utilizáveis** | Flags `g`/`i`/`m`, grupos nomeados (`(?<nome>...)`), `replace`/`replaceAll`/`split` em uma string com uma regex. |
| **Armadilhas a evitar** | Reutilizar uma regex `g` com `.test()`/`.exec()` em um laço sem considerar seu estado interno (`lastIndex`). |
| **Boas práticas** | Nomear os grupos de captura assim que uma regex tiver vários, para um acesso mais legível que por índice numérico. |
