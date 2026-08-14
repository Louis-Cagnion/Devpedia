---
order: 4
---

# As cadeias de caracteres

Uma string é uma sequência de caracteres, utilizada para representar texto. Em JavaScript, pode ser escrita de três formas diferentes:
```javascript
    // aspas simples
    const st1 = 'Hello world';

    // aspas duplas
    const str2 = "Hello world";

    // backticks, úteis para escrever em várias linhas ou inserir variáveis (literais de modelo)
    const str3 = `
    Ce format
    permet d'écrire
    une string sur
    plusieurs lignes
    `;
```

### Os protótipos de strings

Os protótipos são funções integradas por padrão no objeto string, que permitem realizar determinadas ações sobre a string. Uma string é imutável: estas funções nunca a alteram, devolvendo sempre um novo valor.

```javascript
    const str = 'hello world';
```

**`includes`** verifica se a cadeia de caracteres contém uma subcadeia específica e devolve «`true`» ou «`false`».
```javascript
    str.includes('hello'); // true
```

**`length`** não é uma função, mas sim uma propriedade: devolve o número de caracteres da cadeia de caracteres.
```javascript
    str.length; // 11
```

**`slice`** retorna uma parte da cadeia de caracteres, entre um índice inicial (incluído) e um índice final (excluído).
```javascript
    str.slice(0, 5); // 'hello'
```

**`toUpperCase`** e **`toLowerCase`** devolvem uma cópia da cadeia de caracteres totalmente em maiúsculas ou em minúsculas.
```javascript
    str.toUpperCase(); // «HELLO WORLD»
    str.toLowerCase(); // «hello world»
```

**`trim`** retorna uma cópia da cadeia de caracteres sem os espaços desnecessários no início e no fim.
```javascript
    str.trim();
```

**`replace`** e **`replaceAll`** devolvem uma cópia da cadeia de caracteres com uma parte substituída por outra: `replace` substitui apenas a primeira ocorrência, `replaceAll` substitui todas as ocorrências.
```javascript
    str.replace('hello', 'hi'); // «hi world»
    str.replaceAll('o', '0'); // 'hell0 w0rld'
```

**`split`** divide a cadeia de caracteres numa matriz de subcadeias, de acordo com um separador indicado como parâmetro.
```javascript
    str.split(' '); // ['hello', 'world']
```

**`indexOf`** Procura uma subcadeia na cadeia de caracteres e devolve o índice da sua primeira ocorrência. Se não existir, devolve «`-1`».
```javascript
    str.indexOf('world'); // 6
```

**`startsWith`** e **`endsWith`** verificam se a cadeia de caracteres começa ou termina com um determinado valor e devolvem `true` ou `false`.
```javascript
    str.startsWith('hello'); // true
    str.endsWith('world'); // true
```

**`repeat`** retorna uma nova cadeia de caracteres, repetindo a cadeia original um determinado número de vezes.
```javascript
    str.repeat(2); // 'hello worldhello world'
```

**`concat`** junta várias cadeias de caracteres e devolve o resultado, sem alterar as cadeias de caracteres originais.
```javascript
    str.concat(' !'); // «hello world!»
```

### Expressões regulares

É possível utilizar expressões regulares para pesquisar ou recolher informações em cadeias de caracteres (ver expressões regulares).
