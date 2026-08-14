---
order: 1
---

# A regex

## O que é uma regex?

Uma **regex** (expressão regular, *regular expression*) é uma mini-linguagem que descreve um **padrão** (pattern) de caracteres. Esse padrão serve para buscar, validar ou extrair partes de texto que correspondam a uma estrutura dada.

Isso **não é** uma linguagem de programação: sem variáveis, sem laços, sem funções. Uma regex precisa ser interpretada por um **motor de regex**, integrado à linguagem que você usa (JavaScript, Python, etc.), via métodos como `.test()` ou `.match()`.

## As bases da sintaxe

### Caracteres literais

Um caractere normal em uma regex corresponde exatamente a si mesmo:

```text
gato
```

Essa regex corresponde à sequência de caracteres `gato`, em qualquer lugar do texto.

### As classes de caracteres

| Símbolo | Significado                          |
|---------|-----------------------------------------|
| `.`     | Qualquer caractere (exceto quebra de linha) |
| `\d`    | Um dígito (0-9)                        |
| `\D`    | Tudo exceto um dígito                    |
| `\w`    | Uma letra, um dígito ou `_`            |
| `\W`    | Tudo exceto uma letra/dígito/`_`         |
| `\s`    | Um espaço (espaço, tabulação, quebra de linha) |
| `\S`    | Tudo exceto um espaço                     |
| `[abc]` | Um único caractere entre `a`, `b` ou `c`  |
| `[^abc]`| Um único caractere que não seja `a`, `b`, nem `c` |
| `[a-z]` | Um único caractere entre `a` e `z`       |

### Os quantificadores

| Símbolo  | Significado                         |
|----------|----------------------------------------|
| `*`      | 0 ou mais vezes                    |
| `+`      | 1 ou mais vezes                    |
| `?`      | 0 ou 1 vez (torna opcional)           |
| `{n}`    | Exatamente n vezes                      |
| `{n,}`   | n vezes no mínimo, sem máximo           |
| `{n,m}`  | Entre n e m vezes                      |

### As âncoras

| Símbolo | Significado                  |
|---------|----------------------------------|
| `^`     | Início da linha/string        |
| `$`     | Fim da linha/string          |

### Os grupos

```text
(abc)
```

Um grupo de captura: isola uma parte do padrão para poder **recuperar** o que ele capturou (`match[1]`, `match[2]`...), e permite aplicar um quantificador a vários caracteres de uma vez.

```text
(?:abc)
```

Um grupo não capturante: agrupa sem criar uma entrada recuperável no resultado do match.

### As assertivas (lookahead / lookbehind)

Elas verificam o que existe ao redor de uma posição, **sem consumir** esses caracteres no match.

| Símbolo    | Significado                              |
|------------|----------------------------------------------|
| `(?=abc)`  | Deve ser seguido de `abc`                    |
| `(?!abc)`  | Não deve ser seguido de `abc`              |
| `(?<=abc)` | Deve ser precedido de `abc`                  |
| `(?<!abc)` | Não deve ser precedido de `abc`            |

## Os flags (opções globais)

Os flags são colocados depois da última `/` da regex em JavaScript:

```javascript
/padrao/flags
```

| Flag | Efeito                                       |
|------|----------------------------------------------|
| `g`  | Busca **global** (todas as ocorrências, não apenas a primeira) |
| `i`  | Ignora maiúsculas/minúsculas |
| `m`  | Modo multilinha (`^` e `$` se aplicam a cada linha) |

## Exemplo completo, construído passo a passo

Objetivo: reconhecer uma linha que contenha **apenas** um link Markdown, do tipo `[texto](url)`.

### Etapa 1: os colchetes literais

Em regex, `[` e `]` são caracteres **especiais** (servem para escrever uma classe de caracteres, como `[abc]` visto acima). Para corresponder a um colchete **literal** (o caractere `[` real do texto), é preciso escapá-lo com uma barra invertida:

```text
\[
```

```text
\]
```

`\[` corresponde ao caractere `[`, e `\]` corresponde ao caractere `]`, nada mais.

### Etapa 2: o texto dentro dos colchetes

Entre os dois colchetes, queremos aceitar **qualquer caractere, exceto** um colchete de fechamento (senão a regex poderia parar cedo demais ou corresponder a vários links de uma vez). Usa-se uma classe de caracteres **negativa**:

```text
[^\]]
```

- Os `[ ]` aqui são a sintaxe real de classe de caracteres (não literal, ao contrário da etapa 1).
- `^` na primeira posição **dentro** de uma classe significa "tudo exceto": então `[^\]]` significa "qualquer caractere exceto `]`".
- Adicione `*` para repetir isso "0 ou mais vezes" (um texto de qualquer comprimento, ou até vazio):

```text
[^\]]*
```

Também queremos **recuperar** esse texto depois (para saber o que há entre os colchetes) → envolvemos com um grupo capturante com `( )`:

```text
([^\]]*)
```

### Etapa 3: montar os colchetes e o grupo

```text
\[([^\]]*)\]
```

Isso dá: um `[` literal, depois o texto capturado, depois um `]` literal. Corresponde por exemplo a `[texto]`, `[]` (texto vazio), `[meu super link]`...

### Etapa 4: a mesma lógica para os parênteses

Mesmo princípio, mas para `(url)`:

- `\(` e `\)` → parênteses literais escapados (também especiais em regex, normalmente usados para grupos).
- Dentro, queremos o conteúdo da URL: qualquer caractere exceto um espaço (`\s`) e exceto um parêntese de fechamento (`)`): senão a regex poderia incluir texto depois do link por engano.

```text
[^\s)]+
```

Aqui usamos `+` (1 vez no mínimo) em vez de `*`, pois uma URL vazia não faz sentido.

Também capturamos esse grupo:

```text
\(([^\s)]+)\)
```

### Etapa 5: exigir que seja toda a linha

Por enquanto, a regex poderia corresponder a um link **no meio** de uma frase mais longa. Se você quiser que ela só corresponda quando **toda a linha** for exatamente esse link (nada antes, nada depois), adicione as âncoras vistas acima:

```text
^\[([^\]]*)\]\(([^\s)]+)\)$
```

- `^` → a linha deve começar exatamente aqui
- `$` → a linha deve terminar exatamente aqui

### Resultado final

```javascript
const regex = /^\[([^\]]*)\]\(([^\s)]+)\)$/;
```

Resumo das partes:

- `^` → início de linha obrigatório
- `\[` → um `[` literal
- `([^\]]*)` → grupo 1: o texto do link (tudo exceto `]`)
- `\]` → um `]` literal
- `\(` → um `(` literal
- `([^\s)]+)` → grupo 2: a URL (tudo exceto espaço e `)`)
- `\)` → um `)` literal
- `$` → fim de linha obrigatório

Com `"[meu link](https://exemplo.com)".match(regex)`, você obtém `match[1] = "meu link"` e `match[2] = "https://exemplo.com"`.

> **Armadilha:** uma regex permissiva demais (por exemplo, esquecer de ancorar com `^`/`$`) pode corresponder a muito mais do que o previsto: um padrão de validação de email sem ancoragem aceitaria "qualquer coisa contendo um @" no meio de um texto mais longo, não apenas um endereço de email completo.
>
> **Boa prática:** testar uma regex em casos-limite deliberadamente traiçoeiros (string vazia, caracteres especiais, texto mais longo que o previsto) antes de usá-la em produção: uma ferramenta como regex101.com permite fazer isso interativamente.

## Para ir mais longe

- [Expressões regulares (MDN, Mozilla Developer Network, a documentação de referência da web)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Regular_expressions)
- [regex101.com](https://regex101.com): testador de regex interativo com explicações ao vivo

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma regex descreve um padrão de caracteres para buscar, validar ou extrair texto, interpretada por um motor de regex integrado à linguagem hospedeira, não uma linguagem de programação completa. |
| **Ferramentas utilizáveis** | Classes de caracteres (`\d`, `\w`, `\s`), quantificadores (`*`, `+`, `?`, `{n,m}`), grupos capturantes, flags (`g`, `i`, `m`). |
| **Armadilhas a evitar** | Esquecer de ancorar um padrão (`^`/`$`) que deve corresponder à string inteira, não apenas a uma parte. |
| **Boas práticas** | Construir uma regex complexa passo a passo, testando cada adição; verificar seu comportamento em casos-limite antes de usá-la em produção. |
