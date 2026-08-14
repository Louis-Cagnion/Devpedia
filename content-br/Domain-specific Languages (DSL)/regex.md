# A expressão regular

## O que é uma expressão regular?

Uma **regex** (expressão regular, *regular expression*) é uma mini-linguagem que descreve um **padrão** (pattern) de caracteres. Este padrão serve para procurar, validar ou extrair partes de texto que correspondam a uma determinada estrutura.

Não se trata de uma linguagem de programação: não há variáveis, não há loops, não há funções. Uma expressão regular precisa de ser interpretada por um **motor de expressões regulares**, integrado na linguagem que estiveres a utilizar (JavaScript, Python, etc.), através de métodos como `.test()` ou `.match()`.

## Noções básicas de sintaxe

### Caracteres literais

Um carácter normal numa expressão regular corresponde exatamente a si próprio:

```regex
chat
```

Esta expressão regular corresponde à sequência de caracteres «`chat`», em qualquer parte do texto.

### As classes de caracteres

| Símbolo | Significado                          |
|---------|-----------------------------------------|
| `.`     | Qualquer carácter (exceto retorno de linha) |
| `\d`    | Um algarismo (0-9)                        |
| `\D`    | Tudo menos um número                    |
| `\w`    | Uma letra, um algarismo ou `_`            |
| `\W`    | Qualquer coisa, exceto uma letra/número/ `_`         |
| `\s`    | Um espaço (espaço, tabulação, retorno de linha) |
| `\S`    | Qualquer coisa menos um espaço                     |
| `[abc]` | Um único caractere entre `a`, `b` ou `c`  |
| `[^abc]`| Um único carácter que não é nem `a`, nem `b`, nem `c` |
| `[a-z]` | Apenas um carácter entre `a` e `z`       |

### Os quantificadores

| Símbolo  | Significado                         |
|----------|----------------------------------------|
| `*`      | 0 ou mais vezes                    |
| `+`      | 1 ou mais vezes                    |
| `?`      | 0 ou 1 vez (torna opcional)           |
| `{n}`    | Exatamente n vezes                      |
| `{n,}`   | n vezes, no mínimo, sem limite máximo           |
| `{n,m}`  | Entre n e m vezes                      |

### As âncoras

| Símbolo | Significado                  |
|---------|----------------------------------|
| `^`     | Início da linha/cadeia        |
| `$`     | Fim da linha/cadeia          |

### Os grupos

```regex
(abc)
```

Um grupo de captura: isola uma parte do padrão para poder **recuperar** o que correspondeu (`match[1]`, `match[2]`...), e permite aplicar um quantificador a vários caracteres de uma só vez.

```regex
(?:abc)
```

Um grupo sem captura: agrupa sem criar qualquer entrada recuperável no resultado do jogo.

### As asserções (lookahead / lookbehind)

Estas verificam o que existe à volta de uma posição, **sem consumir** esses caracteres na correspondência.

| Símbolo    | Significado                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Deve ser seguido de `abc`                    |
| `(?!abc)`  | Não deve ser seguido de `abc`              |
| `(?<=abc)` | Deve ser precedido por `abc`                  |
| `(?<!abc)` | Não deve ser precedido de `abc`            |

## Os flags (opções globais)

Os sinalizadores devem ser colocados após o último «`/`» da expressão regular em JavaScript:

```javascript
/motif/flags
```

| Sinalizador | Efeito                                       |
|------|----------------------------------------------|
| `g`  | Pesquisa **global** (todas as ocorrências, não apenas a primeira) |
| `i`  | Não distingue maiúsculas de minúsculas |
| `m`  | Modo multilinha (`^` e `$` aplicam-se a cada linha) |

## Exemplo completo, construído passo a passo

Objetivo: identificar uma linha que contenha **apenas** um link Markdown, do tipo `[texto](url)`.

### Passo 1: os colchetes literais

Em expressões regulares, `[` e `]` são caracteres **especiais** (servem para definir uma classe de caracteres, como `[abc]`, visto anteriormente). Para corresponder a um parêntese **literal** (o verdadeiro caractere `[` do texto), é necessário escapar o caractere com uma barra invertida:

```regex
\[
```

```regex
\]
```

`\[` corresponde ao caractere `[`, e `\]` corresponde ao caractere `]`, nada mais.

### Passo 2: o texto entre parênteses retos

Entre os dois colchetes, pretende-se aceitar **qualquer carácter, exceto** um colchete de fecho (caso contrário, a expressão regular poderia terminar prematuramente ou corresponder a vários links de uma só vez). Utiliza-se uma classe de caracteres **negativa**:

```regex
[^\]]
```

- As `[ ]` aqui representam a sintaxe real das classes de caracteres (não literal, ao contrário do passo 1).
- `^` Na primeira posição **dentro** **de** uma classe, significa «qualquer, exceto»; portanto, «`[^\]]`» significa «qualquer carácter, exceto `]`».
- Adicione `*` para repetir isto «0 ou mais vezes» (um texto de qualquer comprimento, ou mesmo vazio):

```regex
[^\]]*
```

Também queremos **recuperar** este texto posteriormente (para saber o que está entre os colchetes) → colocamo-lo num grupo de captura com «`( )`»:

```regex
([^\]]*)
```

### Etapa 3: montar os ganchos e o conjunto

```regex
\[([^\]]*)\]
```

O resultado é: um «`[`» literal, seguido do texto capturado e, por fim, um «`]`» literal. Corresponde, por exemplo, a `[texto]`, `[]` (texto vazio), `[mon super lien]`...

### Passo 4: a mesma lógica para os parênteses

O mesmo princípio, mas para o «`(url)`»:

- `\(` e `\)` → parênteses literais com caracteres de escape (também especiais em expressões regulares, normalmente utilizados para grupos).
- No interior, pretendemos o conteúdo do URL: qualquer carácter, exceto um espaço (`\s`) e exceto um parêntese de fecho (`)`): caso contrário, a expressão regular poderia incluir texto após o link por engano.

```regex
[^\s)]+
```

Aqui utiliza-se `+` (pelo menos uma vez) em vez de `*`, uma vez que uma URL vazia não faz sentido.

Este grupo também é abrangido:

```regex
\(([^\s)]+)\)
```

### Passo 5: exigir que seja toda a linha

Por enquanto, a expressão regular poderia corresponder a um link **no meio** de uma frase mais longa. Se quiseres que ela só corresponda quando **toda a linha** for exatamente esse link (sem nada antes nem depois), adiciona as âncoras mencionadas acima:

```regex
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → a linha deve começar exatamente aqui
- `$` → a linha deve terminar exatamente aqui

### Resultado final

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Resumo das faixas:

- `^` → início de linha obrigatório
- `\[` → um`[`o literal
- `([^\]]*)` → grupo 1: o texto do link (tudo exceto `]`)
- `\]` → um`]`o literal
- `\(` → uma «`(`» literal
- `([^\s)]+)` → grupo 2: o URL (tudo, exceto espaços e `)`)
- `\)` → uma «`)`» literal
- `$` → fim de linha obrigatório

Com `"[mon lien](https://exemple.com)".match(regex)`, obtém `match[1] = "mon lien"` e `match[2] = "https://exemple.com"`.

## Para saber mais

- [MDN: Expressões regulares](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com): testador interativo de expressões regulares com explicações em tempo real
