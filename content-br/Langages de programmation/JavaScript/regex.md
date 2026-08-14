---
order: 8
---

# Expressões regulares

Uma regex (expressão regular) é um padrão utilizado para procurar, validar ou substituir partes de texto numa cadeia de caracteres.

Pode ser redigida de duas formas diferentes:
```javascript
    // literal, a mais comum
    const re1 = /hello/;

    // com o construtor RegExp, útil quando o padrão é dinâmico
    const re2 = new RegExp('hello');
```

### Os sinalizadores

Os sinalizadores colocam-se após a última barra e alteram o comportamento da expressão regular.

**`g`** (global) procura todas as ocorrências na cadeia de caracteres, e não apenas a primeira.
```javascript
    const re1 = /hello/g;
```

**`i`** (insensível) ignora as maiúsculas e minúsculas, pelo que não faz distinção entre maiúsculas e minúsculas.
```javascript
    const re2 = /hello/i;
```

**`m`** (multiline) ativa o modo multilinha, o que altera o comportamento de `^` e `$`: passam então a corresponder ao início/fim de cada linha, e não apenas ao início/fim de toda a cadeia de caracteres.
```javascript
    const re3 = /hello/m;
```

É possível combinar vários sinalizadores em conjunto.
```javascript
    const re4 = /hello/gi;
```

### Os protótipos de expressões regulares

Os protótipos são funções integradas por padrão no objeto RegExp, que permitem realizar determinadas ações com a expressão regular.

```javascript
    const re = /wor(l)d/;
    const str = 'hello world';
```

**`test`** verifica se a cadeia de caracteres corresponde à expressão regular e devolve simplesmente «`true`» ou «`false`».
```javascript
    re.test(str); // true
```

**`exec`** retorna um array com os detalhes da primeira correspondência encontrada, ou `null` se não for encontrada nenhuma correspondência. Neste array, o índice 0 contém a correspondência completa e os índices seguintes contêm os grupos capturados (entre parênteses na expressão regular).
```javascript
    re.exec(str); // ['world', 'l', index: 6, input: 'hello world', groups: undefined]
```

### Protótipos de cadeias de caracteres que utilizam expressões regulares

Alguns protótipos do objeto string aceitam uma expressão regular como parâmetro para realizar pesquisas ou substituições mais avançadas.

```javascript
    const str = 'hello world';
```

**`match`** retorna o primeiro resultado que corresponda à expressão regular (ou `null` se não houver nenhum). Se a expressão regular utilizar o sinalizador `g`, retorna, em vez disso, um array contendo todas as correspondências, mas sem os detalhes dos grupos capturados.
```javascript
    str.match(/o/g); // ['o', 'o']
```

**`matchAll`** Funciona como `match` com o sinalizador `g`, mas requer obrigatoriamente esse sinalizador. Devolve um iterador que dá acesso aos detalhes de cada correspondência, incluindo os grupos capturados.
```javascript
    const str = "Jean:25 Marie:30";
    const resultado = [...str.matchAll(/(\w+):(\d+)/g)];

    console.log(resultado);
    /*  
    [
        [
            "Jean:25",           // correspondência completa
            "Jean",              // grupo 1
            "25",                // grupo 2
            índice: 0,
            input: "Jean:25 Marie:30",
            groups: undefined
        ],
        [
            "Marie:30",
            "Marie",
            "30",
            índice: 8,
            input: "Jean:25 Marie:30",
            groups: undefined
        ]
    ]
    */
```

**`search`** Devolve o índice da primeira correspondência da expressão regular na cadeia de caracteres ou `-1` se não for encontrada nenhuma correspondência.
```javascript
    str.search(/world/); // 6
```

**`replace`** e **`replaceAll`** devolvem uma cópia da cadeia de caracteres com uma parte substituída por outra: `replace` substitui apenas a primeira ocorrência que corresponda à expressão regular (a menos que tenha o sinalizador `g`), enquanto `replaceAll` requer obrigatoriamente esse sinalizador para substituir todas as ocorrências.
```javascript
    str.replace(/o/g, '0'); // 'hell0 w0rld'
    str.replaceAll(/o/g, '0'); // Requer o sinalizador g; caso contrário, ocorre um erro
```

**`split`** divide a string numa matriz de subcadeias, utilizando a expressão regular como separador.
```javascript
    str.split(/\s/); // ['hello', 'world']
```

### Os grupos de captura

Os parênteses numa expressão regular permitem capturar uma parte específica da correspondência. Essas partes capturadas podem depois ser recuperadas através de `exec` ou `match`.

```javascript
    const re = /(\d{4})-(\d{2})-(\d{2})/;
    const date = '2024-06-15';

    const result = date.match(re);
    result[1]; // «2024» (ano)
    result[2]; // '06' (mês)
    result[3]; // '15' (dia)
```

Também é possível atribuir nomes aos grupos para torná-los mais legíveis e acessar os mesmos através do seu nome, utilizando a propriedade «`groups`».
```javascript
    const reNamed = /(?<annee>\d{4})-(?<mois>\d{2})-(?<jour>\d{2})/;
    const resultNamed = reNamed.exec(date);
    resultNamed.groups.annee; // '2024'
```
