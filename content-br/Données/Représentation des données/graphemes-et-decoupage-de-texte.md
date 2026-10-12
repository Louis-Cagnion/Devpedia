---
order: 9
---

# Grafemas, pontos de código e unidades UTF-16: dividir um texto sem quebrá-lo (11/10/2026)

Quantos “caracteres” há em `"👨‍👩‍👧"`? Um leitor vê um único desenho (uma família), mas o [JavaScript](/?c=langages&s=javascript&p=javascript) conta **8**. Essa diferença quebra os contadores de caracteres, os textos cortados pela metade, as inversões e os cursores. Um **emoji** é um pequeno desenho (um rosto, uma bandeira, uma mão...) que se escreve como uma letra. Este capítulo explica as três formas de contar um texto e como dividi-lo sem quebrar um emoji. Ele complementa [a codificação dos textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), que explica como um caractere é gravado na memória ou no disco: aqui, trata-se da divisão daquilo que se vê.

Ele pressupõe conhecidos [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as strings](/?c=langages&s=javascript&p=strings) (uma **cadeia** é um texto, uma sequência de caracteres), [os arrays](/?c=langages&s=javascript&p=tableaux) (uma lista ordenada em que cada valor tem um **índice**, sua posição, que começa em 0), [os loops](/?c=langages&s=javascript&p=boucles) (entre eles `for...of`), [as funções](/?c=langages&s=javascript&p=fonctions) (entre elas as funções de seta `=>`), [as condições](/?c=langages&s=javascript&p=conditions) e [os objetos](/?c=langages&s=javascript&p=objets). Os exemplos são executados com [Node.js](https://nodejs.org), um programa que executa [JavaScript](/?c=langages&s=javascript&p=javascript) fora de um navegador, iniciado [a partir de um terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), ou no console de um navegador (o software que exibe as páginas web). `console.log(x)` exibe o valor `x`. Os resultados foram verificados com Node.js 22.22.3 (Unicode 17.0).

## Três maneiras de contar um “caractere”

A palavra “caractere” designa três coisas diferentes conforme quem fala. Um **bit** vale 0 ou 1 (ver [os inteiros e os bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)), um **byte** agrupa oito deles.

| Nível | Termo | Definição | Quem o utiliza |
|---|---|---|---|
| O que o olho vê | **grafema** (*grapheme cluster*) | A unidade percebida como um único caractere: uma letra com seus acentos, um emoji completo | O usuário, o cursor (o traço piscante da digitação), os limites de entrada |
| O que o Unicode numera | **ponto de código** (*code point*) | O número `U+XXXX` de um item do catálogo [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Um grafema conta um ou vários | `for...of`, `codePointAt`, o próprio catálogo |
| O que o JavaScript armazena | **unidade de código UTF-16** (*code unit*) | Um bloco de 16 bits (2 bytes) da codificação [UTF-16](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Um ponto de código ocupa uma ou duas | `length`, `[i]`, `slice`, `charAt` |
| O que o disco armazena | **byte** | Um grupo de 8 bits. Em [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), um ponto de código ocupa de 1 a 4 | Arquivos e trocas de dados |

Eis a família `"👨‍👩‍👧"` nos três primeiros níveis (os números são escritos em **hexadecimal**, ou base 16: os algarismos 0 a 9 e depois `a` a `f`, em que `a` vale 10 e `f` vale 15):

```text
grafema          1 só desenho: 👨‍👩‍👧
                      |
pontos de código U+1F468    U+200D    U+1F469    U+200D    U+1F467     (5)
                   |          |         |          |         |
unidades UTF-16  D83D DC68   200D    D83D DC69    200D    D83D DC67    (8)
```

`U+200D` é o **conector de largura zero** (*zero width joiner*, ZWJ): um caractere invisível que diz “cole o que vem antes ao que vem depois”. Os três personagens então se fundem em um único desenho, se a fonte permitir (ver [os limites](#os-limites-honestos)). Eis os nove exemplos do capítulo, medidos com as ferramentas vistas adiante:

| Texto | Pontos de código | `length` (unidades UTF-16) | `[...s].length` (pontos de código) | Grafemas | Bytes UTF-8 |
|---|---|---|---|---|---|
| `"a"` | `U+0061` | 1 | 1 | 1 | 1 |
| `"é"` em uma forma (U+00E9) | `U+00E9` | 1 | 1 | 1 | 2 |
| `"é"` em duas formas (e + acento combinante) | `U+0065` `U+0301` | 2 | 2 | 1 | 3 |
| `"😀"` | `U+1F600` | 2 | 1 | 1 | 4 |
| `"👍🏽"` (emoji + modificador de tom de pele) | `U+1F44D` `U+1F3FD` | 4 | 2 | 1 | 8 |
| `"👨‍👩‍👧"` (três emojis ligados por ZWJ) | `U+1F468` `U+200D` `U+1F469` `U+200D` `U+1F467` | 8 | 5 | 1 | 18 |
| `"🇫🇷"` (duas letras indicadoras regionais) | `U+1F1EB` `U+1F1F7` | 4 | 2 | 1 | 8 |
| `"한"` em sílaba composta | `U+D55C` | 1 | 1 | 1 | 3 |
| `"한"` em três jamos | `U+1112` `U+1161` `U+11AB` | 3 | 3 | 1 | 9 |

O **modificador de tom de pele** `U+1F3FD` muda a cor da pele do emoji que o precede. As **letras indicadoras regionais** são 26 caracteres, de `U+1F1E6` (A) a `U+1F1FF` (Z): dois seguidos formam uma bandeira (F e depois R dão 🇫🇷). Os **jamos** são as letras do alfabeto coreano (consoantes e vogais), que se agrupam em sílabas: `한` também existe como um único ponto de código. O **acento combinante** `U+0301` se acrescenta à letra que o precede, ver [a codificação dos textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes). Os dois `"é"` são visualmente idênticos, mas não os seus números.

## As unidades UTF-16: o que `length` e `slice` contam

O JavaScript armazena um texto em UTF-16. Um ponto de código até `U+FFFF` cabe em uma unidade. Acima disso (a maioria dos emojis), são necessárias duas, chamadas **par substituto** (*surrogate pair*): uma unidade “alta” seguida de uma “baixa”.

| Unidade | Faixa (hexadecimal) | Papel |
|---|---|---|
| Fora de par | `0000` a `D7FF` e `E000` a `FFFF` | Um ponto de código por si só |
| Alta | `D800` a `DBFF` | Primeira metade de um par |
| Baixa | `DC00` a `DFFF` | Segunda metade de um par |

Essas operações trabalham todas em unidades: [`length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) (o número de unidades), `texto[i]` e [`charAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) (a unidade no índice `i`), [`charCodeAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) (o seu número), [`slice`](/?c=langages&s=javascript&p=strings) (um trecho entre dois índices).

```javascript
const sorriso = "😀";
// length conta as unidades UTF-16: este sorriso ocupa duas
console.log(sorriso.length);   // -> 2
// charCodeAt(i) devolve o número da unidade de índice i
console.log(sorriso.charCodeAt(0));   // -> 55357
console.log(sorriso.charCodeAt(1));   // -> 56832
// toString(16) escreve esse número em hexadecimal: um par alto (d83d) e depois um baixo (de00)
console.log(sorriso.charCodeAt(0).toString(16));   // -> d83d
console.log(sorriso.charCodeAt(1).toString(16));   // -> de00
// charAt(0) e sorriso[0] são a mesma unidade, uma metade de par
console.log(sorriso.charAt(0) === sorriso[0]);   // -> true
// isWellFormed() testa a ausência de uma metade de par isolada
console.log(sorriso.charAt(0).isWellFormed());   // -> false
```

[`toString(16)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) escreve um número em base 16, e [`isWellFormed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) vale `false` se o texto contém uma metade de par sem a outra. Cortar um texto entre essas duas metades produz exatamente esse caso:

```javascript
const saudacao = "Salut 😀";
// slice(0, 7) mantém as unidades de índice 0 a 6: « Salut » e a metade alta do sorriso
const cortado = saudacao.slice(0, 7);
console.log(cortado);   // -> Salut �
console.log(cortado.length);   // -> 7
console.log(cortado.isWellFormed());   // -> false
// TextEncoder converte um texto em bytes UTF-8
// 6 bytes para « Salut » e o espaço, 3 para a metade de par, substituída por U+FFFD
console.log(new TextEncoder().encode(cortado).length);   // -> 9
// encodeURIComponent prepara um texto para um endereço web (URL) e recusa a metade de par
try {
    encodeURIComponent(cortado);
} catch (erro) {
    console.log(erro.name);   // -> URIError
}
```

O texto cortado já não é um texto válido. Conforme a ferramenta, a metade isolada é **silenciosamente substituída** pelo caractere de substituição `U+FFFD` (�, 3 bytes em UTF-8: `EF BF BD`, daí os 9 bytes, ver [o mojibake](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) ou **recusada com um erro** (`URIError`). No bloco, `try` executa o código e `catch` captura o erro se ele lançar um (ver [o tratamento de erros](/?c=langages&s=javascript&p=gestion-des-erreurs)). [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) e [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) são ferramentas padrão do JavaScript; os URLs são explicados no [capítulo sobre HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

## Os pontos de código: um degrau mais fino

Para percorrer um texto ponto de código por ponto de código, o JavaScript oferece:

| Ferramenta | O que faz | Em `"a😀é"` |
|---|---|---|
| [`codePointAt(i)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt) | O ponto de código que começa no índice `i` (em unidades) | `codePointAt(1)` dá `128512` |
| [`String.fromCodePoint(n)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) | O texto de um ponto de código | `fromCodePoint(0x1F600)` dá `"😀"` |
| `for (const c of texto)` | Um loop que entrega um ponto de código por vez | 3 voltas |
| `[...texto]` | O operador `...` (*spread*, [visto com os arrays](/?c=langages&s=javascript&p=tableaux)) desdobra o texto em um array de pontos de código | 3 elementos |
| [`Array.from(texto)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) | Mesmo resultado, aceita uma função de transformação como segundo argumento | 3 elementos |
| `texto.split("")` | Corta em unidades (evitar) | 4 elementos |

Uma string é um **iterável**: um valor que `for...of` ou `...` percorrem elemento por elemento, graças a um **iterador**, o objeto que entrega esses elementos um a um. O iterador de uma string entrega pontos de código, não unidades.

```javascript
const mistura = "a😀é";
// length conta as unidades: a (1) + sorriso (2) + é (1)
console.log(mistura.length);   // -> 4
// codePointAt(1) lê o ponto de código que começa no índice 1: o sorriso inteiro
console.log(mistura.codePointAt(1));   // -> 128512
console.log(mistura.codePointAt(1).toString(16));   // -> 1f600
// o índice 2 cai no meio do par: lê-se apenas a metade baixa
console.log(mistura.codePointAt(2));   // -> 56832
// 0x1F600 é um número escrito em hexadecimal no código
console.log(String.fromCodePoint(0x1F600));   // -> 😀
// o spread e Array.from contam pontos de código
console.log([...mistura]);   // -> [ 'a', '😀', 'é' ]
console.log(Array.from(mistura).length);   // -> 3
// split("") corta em unidades: o par do sorriso é quebrado
console.log(mistura.split(""));   // -> [ 'a', '\ud83d', '\ude00', 'é' ]
```

```javascript
// for...of entrega um ponto de código por volta, com seu comprimento em unidades
for (const elemento of mistura) {
    console.log(elemento, elemento.length);
}
```

```text
a 1
😀 2
é 1
```

Os pontos de código não bastam, porém: `"👍🏽"` conta 2 e `"👨‍👩‍👧"` conta 5, embora sejam exibidos como um único desenho. Cortar entre dois pontos de código separa um emoji do seu modificador ou do seu ZWJ (exemplo mais adiante).

## Os grafemas com `Intl.Segmenter`

[`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) é o conjunto das funções padrão do JavaScript que dependem do idioma (datas, números, ordenação de textos...), no centro da [internacionalização](/?c=ui-ux&p=internationalisation-i18n-et-rtl). Sua ferramenta [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) divide um texto segundo as regras do Unicode ([UAX #29](https://unicode.org/reports/tr29/), o anexo nº 29 da norma, dedicado à divisão do texto). Ela está disponível nos navegadores recentes desde abril de 2024 (“Baseline 2024” segundo o [MDN](https://developer.mozilla.org/), a documentação de referência da web) e no Node.js 22.

| Elemento | Papel |
|---|---|
| `new Intl.Segmenter(idioma, opcoes)` | Cria um segmentador (`new` cria um objeto a partir de um modelo, ver [as classes](/?c=langages&s=javascript&p=poo)). `idioma` é um código como `"pt"`; `opcoes` é um [objeto](/?c=langages&s=javascript&p=objets) |
| `{ granularity: "grapheme" }` | Divide em grafemas (valor padrão) |
| `{ granularity: "word" }` / `{ granularity: "sentence" }` | Divide em palavras / em frases: útil sobretudo para as línguas escritas sem espaços (japonês, chinês, tailandês); para as palavras, `isWordLike` distingue uma palavra da pontuação |
| `segmentador.segment(texto)` | Devolve um iterável de pedaços |
| Um pedaço | Um objeto `{ segment, index, input }`: o texto do pedaço, seu índice de início (em unidades UTF-16), o texto inteiro |
| `.containing(indice)` | O pedaço que contém esse índice, ou `undefined` (o valor que significa “nada”) se o índice estiver fora do texto |

O bloco seguinte define o segmentador e três funções reutilizadas por todos os blocos da sequência do capítulo. Cada função tem um comentário de descrição: `@param` dá a forma do argumento, `@returns` a do resultado (`string[]` significa “array de strings”).

```javascript
// Um único segmentador, criado uma vez e reutilizado: idioma "pt", um pedaço por grafema
const segmentador = new Intl.Segmenter("pt", { granularity: "grapheme" });

/**
 * @brief Divide um texto em grafemas.
 *
 * @param {string} texto
 *
 * @returns {string[]} um elemento por grafema
 */
function graphemas(texto) {
    // Array.from(iterável, função) aplica a função a cada pedaço
    return Array.from(segmentador.segment(texto), (pedaco) => pedaco.segment);
}

/**
 * @brief Conta os grafemas de um texto.
 *
 * @param {string} texto
 *
 * @returns {number}
 */
function contarGraphemas(texto) {
    return Array.from(segmentador.segment(texto)).length;
}

/**
 * @brief Conta um texto em unidades UTF-16, pontos de código, grafemas e bytes UTF-8.
 *
 * @param {string} texto
 *
 * @returns {{unidades: number, pontosDeCodigo: number, grafemas: number, bytes: number}}
 */
function medir(texto) {
    return {
        unidades: texto.length,
        pontosDeCodigo: [...texto].length,
        grafemas: contarGraphemas(texto),
        bytes: new TextEncoder().encode(texto).length,
    };
}

const exemplo = "Hé👍🏽🇫🇷";
// cada grafema é um elemento: o tom e a bandeira não são separados
console.log(graphemas(exemplo));   // -> [ 'H', 'é', '👍🏽', '🇫🇷' ]
// um pedaço completo, com seu índice de início (H = 1 unidade, é = 1 unidade)
const segmentos = Array.from(segmentador.segment(exemplo));
console.log(segmentos[2]);   // -> { segment: '👍🏽', index: 2, input: 'Hé👍🏽🇫🇷' }
console.log(medir("a"));   // -> { unidades: 1, pontosDeCodigo: 1, grafemas: 1, bytes: 1 }
console.log(medir("😀"));   // -> { unidades: 2, pontosDeCodigo: 1, grafemas: 1, bytes: 4 }
const familia = "👨‍👩‍👧";
console.log(medir(familia));   // -> { unidades: 8, pontosDeCodigo: 5, grafemas: 1, bytes: 18 }
console.log(medir("🇫🇷"));   // -> { unidades: 4, pontosDeCodigo: 2, grafemas: 1, bytes: 8 }
```

## Truncar em N grafemas

Truncar “em 20 caracteres” é o uso mais comum. A função seguinte corta em uma fronteira de grafema, portanto nunca no meio de um emoji ou de uma letra acentuada:

```javascript
/**
 * @brief Trunca um texto em `maximo` grafemas e acrescenta “…” se ele tiver sido cortado.
 *
 * @param {string} texto
 * @param {number} maximo inteiro maior ou igual a 0
 *
 * @returns {string}
 */
function truncar(texto, maximo) {
    const pedacos = graphemas(texto);
    if (pedacos.length <= maximo) {
        return texto;
    }
    return pedacos.slice(0, maximo).join("") + "…";
}

const anuncio = "Bravo 👨‍👩‍👧 et 🇫🇷 !";
console.log(anuncio.length);   // -> 24
console.log([...anuncio].length);   // -> 19
console.log(contarGraphemas(anuncio));   // -> 14
// a 7 unidades, a metade do homem é cortada em duas
console.log(anuncio.slice(0, 7));   // -> Bravo �
// a 7 pontos de código, o homem permanece mas a família é quebrada
console.log([...anuncio].slice(0, 7).join(""));   // -> Bravo 👨
// a 7 grafemas, a família está inteira
console.log(truncar(anuncio, 7));   // -> Bravo 👨‍👩‍👧…
console.log(truncar(anuncio, 8));   // -> Bravo 👨‍👩‍👧 …
// um texto suficientemente curto é devolvido tal qual
console.log(truncar(anuncio, 14) === anuncio);   // -> true
```

| Método (limite 7) | Resultado | Defeito |
|---|---|---|
| `anuncio.slice(0, 7)` | `"Bravo �"` | Metade de par isolada |
| `[...anuncio].slice(0, 7).join("")` | `"Bravo 👨"` | Família reduzida a um homem (com 8, sobra um ZWJ órfão) |
| `truncar(anuncio, 7)` | `"Bravo 👨‍👩‍👧…"` | Nenhum |

`truncar` acrescenta “…” depois de `maximo` grafemas: o texto devolvido pode, portanto, contar `maximo + 1`.

## A normalização: dois “é” que não são iguais

O “é” existe em duas escritas: o ponto de código único `U+00E9`, ou `e` seguido do acento combinante `U+0301`. Elas são exibidas do mesmo jeito, mas o texto não é o mesmo. A **normalização** converte um texto para uma forma canônica, para que duas escritas equivalentes se tornem idênticas. No código, `\u00E9` escreve o ponto de código `U+00E9` (quatro algarismos hexadecimais) e `\u{1F600}` escreve os que ultrapassam `U+FFFF`.

| Forma | Efeito | Quando usar |
|---|---|---|
| `"NFC"` | Recompõe: um único ponto de código quando possível | Comparar e armazenar (a forma mais comum) |
| `"NFD"` | Decompõe: letra base + acentos combinantes | Separar os acentos de uma letra |
| `"NFKC"` / `"NFKD"` | Como as anteriores, e também unificam as variantes de apresentação (a ligadura `ﬁ`, duas letras desenhadas como um só sinal, vira `fi`) | Busca tolerante |

[`normalize(forma)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) aplica essas formas, que [a codificação dos textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) detalha; o padrão é a [UAX #15](https://unicode.org/reports/tr15/).

```javascript
// \u00E9 : o ponto de código U+00E9 ; e\u0301 : e seguido do acento agudo combinante U+0301
const eUnico = "\u00E9";
const eCombinado = "e\u0301";
console.log(eUnico, eCombinado);   // -> é é
// === compara os dois textos unidade por unidade: eles diferem
console.log(eUnico === eCombinado);   // -> false
console.log(eUnico.length, eCombinado.length);   // -> 1 2
// para o olho e para Intl.Segmenter, é um único grafema nos dois casos
console.log(contarGraphemas(eUnico), contarGraphemas(eCombinado));   // -> 1 1
// após normalizar na mesma forma, os dois textos são iguais
console.log(eCombinado.normalize("NFC") === eUnico);   // -> true
console.log(eUnico.normalize("NFD") === eCombinado);   // -> true
```

Para comparar dois textos digitados por seres humanos, normalize os dois na mesma forma antes de `===`:

```javascript
/**
 * @brief Indica se dois textos se escrevem da mesma forma, qualquer que seja a composição deles.
 *
 * @param {string} textoA
 * @param {string} textoB
 *
 * @returns {boolean}
 */
function mesmoTexto(textoA, textoB) {
    return textoA.normalize("NFC") === textoB.normalize("NFC");
}

console.log(mesmoTexto(eUnico, eCombinado));   // -> true
// os jamos coreanos se recompõem em sílaba com NFC
console.log("\u1112\u1161\u11AB".normalize("NFC") === "\uD55C");   // -> true
// NFC nem sempre dá um único ponto de código: q + til (˜) não tem forma composta
console.log("q\u0303".normalize("NFC").length);   // -> 2
// NFC mantém a ligadura ﬁ, NFKC a substitui por fi
console.log("\uFB01".normalize("NFKC"));   // -> fi
// localeCompare compara conforme o idioma e considera esses dois textos equivalentes (0)
console.log(eUnico.localeCompare(eCombinado));   // -> 0
```

[`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) compara dois textos segundo as regras de um idioma (útil para ordenar), e devolve um número negativo ou positivo conforme a ordem, ou 0 se forem equivalentes. A normalização também serve para retirar os acentos:

```javascript
// NFD separa os acentos, \p{M} designa as “marcas” (acentos combinantes)
const frase = "Éléphant à l'été";
console.log(frase.normalize("NFD").replace(/\p{M}/gu, ""));   // -> Elephant a l'ete
```

`replace` e [as regex](/?c=langages&s=javascript&p=regex) (entre elas a flag `g`, “em toda parte”, e a flag `u`, que ativa o modo Unicode) são vistos em seus capítulos; [`\p{M}`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) é uma classe de caracteres Unicode. A normalização não funde as sequências de emojis: `"👍🏽"` continua sendo dois pontos de código.

## Casos práticos: o código ruim, o código bom

| Necessidade | Código ruim | Problema | Código bom |
|---|---|---|---|
| Limite de digitação | `texto.length <= 10` | Conta unidades: uma família pesa 8 | `contarGraphemas(texto) <= 10` |
| Inverter | `texto.split("").reverse().join("")` | Pares quebrados, acentos antes da sua letra | `graphemas(texto).reverse().join("")` |
| Maiúscula inicial | `texto[0].toUpperCase() + texto.slice(1)` | Falha se a primeira letra ocupa duas unidades | Colocar em maiúscula o primeiro grafema |
| Apagar para trás | `texto.slice(0, -1)` | Deixa metade de um emoji | Remover o último grafema |
| Cursor | `posicao + 1` | O cursor cai no meio de um grafema | Avançar até o fim do grafema |

### Limitar o comprimento de um campo

O atributo [HTML](/?c=langages&s=html&p=html) `maxlength` de um campo de [formulário](/?c=langages&s=html&p=formulaires) mede em unidades UTF-16 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength)): três famílias seguidas pesam 24 unidades. A norma UAX #29 precisa que um limite em grafemas é um limite “percebido”, não um tamanho de dados: ela aconselha combiná-lo com um limite em bytes (por exemplo 300 grafemas e 3000 bytes UTF-8) para limitar o armazenamento.

```javascript
const mensagem = "Salut 👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧";
const LIMITE = 10;
console.log(mensagem.length);   // -> 30
console.log(contarGraphemas(mensagem));   // -> 9
// o limite em unidades recusa esta mensagem indevidamente
console.log(mensagem.length <= LIMITE);   // -> false
console.log(contarGraphemas(mensagem) <= LIMITE);   // -> true

/**
 * @brief Verifica os dois limites: grafemas (percebido) e bytes UTF-8 (armazenamento).
 *
 * @param {string} texto
 * @param {number} maximoGrafemas
 * @param {number} maximoBytes
 *
 * @returns {boolean}
 */
function respeitaLimites(texto, maximoGrafemas, maximoBytes) {
    const bytes = new TextEncoder().encode(texto).length;
    return contarGraphemas(texto) <= maximoGrafemas && bytes <= maximoBytes;
}

console.log(respeitaLimites(mensagem, 10, 100));   // -> true
console.log(respeitaLimites(mensagem, 10, 40));   // -> false
```

A mensagem pesa 6 bytes para “Salut” e o espaço, e 3 vezes 18 para as famílias, ou seja 60 bytes: o segundo limite (40) a recusa.

### Inverter uma cadeia de caracteres

```javascript
const palavra = "Noe\u0301 🇫🇷👍🏽";
// split("") + reverse : as metades dos pares se recolam de qualquer jeito
console.log(palavra.split("").reverse().join(""));   // -> �🁍🗷🇫� ́eoN
// [...palavra] + reverse : o modificador passa antes do emoji, a bandeira vira 🇷🇫
console.log([...palavra].reverse().join(""));   // -> 🏽👍🇷🇫 ́eoN
// graphemas + reverse : cada grafema mantém a sua integridade
console.log(graphemas(palavra).reverse().join(""));   // -> 👍🏽🇫🇷 éoN
```

`reverse()` inverte a ordem de um array no lugar, e `join("")` junta os seus elementos (ver [os arrays](/?c=langages&s=javascript&p=tableaux)). Inverter um texto mantém um limite: em árabe ou em hebraico, que se escrevem da direita para a esquerda, a ordem de exibição não é a ordem de armazenamento (ver [a internacionalização](/?c=ui-ux&p=internationalisation-i18n-et-rtl)).

### Colocar a primeira letra em maiúscula

Os acentos combinantes ficam depois da letra: `texto[0]` basta, portanto, muitas vezes. O defeito aparece para uma letra fora de `U+FFFF` (como `U+10428`, uma letra minúscula do alfabeto deseret), cujo `texto[0]` é apenas uma metade de par que `toUpperCase` deixa intacta. [`toLocaleUpperCase(idioma)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase) leva além disso o idioma em conta (em turco, `i` vira `İ`, com ponto).

```javascript
/**
 * @brief Coloca a primeira letra em maiúscula, tomando o primeiro grafema inteiro.
 *
 * @param {string} texto
 * @param {string} idioma código de idioma, por exemplo "pt"
 *
 * @returns {string}
 */
function maiusculaInicial(texto, idioma) {
    if (texto === "") {
        return texto;
    }
    const primeiro = graphemas(texto)[0];
    return primeiro.toLocaleUpperCase(idioma) + texto.slice(primeiro.length);
}

/**
 * @brief Versão ingênua: maiúscula apenas na primeira unidade.
 *
 * @param {string} texto
 *
 * @returns {string}
 */
function maiusculaInicialIngenua(texto) {
    return texto[0].toUpperCase() + texto.slice(1);
}

const deseret = "\u{10428}x";
// a versão ingênua deixa U+10428 inalterado
console.log(maiusculaInicialIngenua(deseret).codePointAt(0).toString(16));   // -> 10428
// a versão por grafema obtém a maiúscula U+10400
console.log(maiusculaInicial(deseret, "pt").codePointAt(0).toString(16));   // -> 10400
// "tr" designa o turco: o i vira um İ com ponto
console.log(maiusculaInicial("ilyes", "tr"));   // -> İlyes
console.log(maiusculaInicial("ilyes", "pt"));   // -> Ilyes
```

O comprimento também pode mudar: `"ß".toUpperCase()` dá `"SS"`, duas letras.

### Apagar para trás e cursor

Um campo de digitação padrão cuida sozinho do seu cursor; essas funções servem quando se gerencia o texto e a posição por conta própria (um editor próprio). A **posição do cursor** é um índice em unidades, colocado entre duas unidades.

```javascript
const resposta = "Oui 👍🏽";
// slice(0, -1) remove a última unidade: sobra um pedaço do modificador de tom
console.log(resposta.slice(0, -1).isWellFormed());   // -> false

/**
 * @brief Remove o último grafema (tecla « apagar », backspace).
 *
 * @param {string} texto
 *
 * @returns {string}
 */
function removerUltimo(texto) {
    const pedacos = graphemas(texto);
    pedacos.pop();
    return pedacos.join("");
}

// sobram « Oui » e o espaço: o polegar e a sua tonalidade saem juntos
console.log(removerUltimo(resposta) === "Oui ");   // -> true

/**
 * @brief Devolve a posição depois do grafema que contém posicao.
 *
 * @param {string} texto
 * @param {number} posicao índice em unidades, de 0 até texto.length
 *
 * @returns {number}
 */
function avancarCursor(texto, posicao) {
    const pedaco = segmentador.segment(texto).containing(posicao);
    if (pedaco === undefined) {
        return posicao;
    }
    return pedaco.index + pedaco.segment.length;
}

/**
 * @brief Devolve a posição de início do grafema que precede posicao.
 *
 * @param {string} texto
 * @param {number} posicao índice em unidades, de 0 até texto.length
 *
 * @returns {number}
 */
function recuarCursor(texto, posicao) {
    if (posicao <= 0) {
        return 0;
    }
    return segmentador.segment(texto).containing(posicao - 1).index;
}

const linha = "a👍🏽b";
console.log(linha.length);   // -> 6
// a partir de 1 (antes do polegar), o cursor pula para 5 (depois das 4 unidades do polegar)
console.log(avancarCursor(linha, 1));   // -> 5
console.log(avancarCursor(linha, 6));   // -> 6
console.log(recuarCursor(linha, 5));   // -> 1
console.log(recuarCursor(linha, 0));   // -> 0
```

`pop()` remove o último elemento de um array.

## Os limites honestos

Contar grafemas é a melhor aproximação do “caractere percebido” que se saiba calcular, mas não é uma verdade.

| Limite | Detalhe |
|---|---|
| A definição evolui | Cada versão do Unicode pode mudar as regras. No UAX #29, a regra GB9c (os grupos de consoantes das escritas indianas) está ausente da revisão para [Unicode 15.0](https://www.unicode.org/reports/tr29/tr29-41.html) (2022), presente e modificada na revisão para [Unicode 15.1](https://www.unicode.org/reports/tr29/tr29-43.html) (2023), depois modificada de novo para [Unicode 18.0](https://www.unicode.org/reports/tr29/tr29-49.html) (2026) |
| O resultado depende do ambiente | Node.js 22.22.3 traz o Unicode 17.0 (valor lido em `process.versions.unicode`). Um navegador ou outra versão do Node.js pode contar de outro jeito. Exemplo abaixo |
| Uma largura não é um número de grafemas | Em uma fonte de largura fixa (como a de um terminal), cada letra latina ocupa a mesma largura, mas os ideogramas e muitos emojis são classificados como “largos” (propriedade East Asian Width, [UAX #11](https://unicode.org/reports/tr11/)) e em geral ocupam o dobro. Alinhar colunas exige a largura exibida, não o número de grafemas |
| A fonte decide o desenho | Uma **fonte** é o arquivo que contém o desenho (**glifo**) de cada caractere. Se ela não tem o de uma sequência, o sistema pode exibir os componentes separados (👨 👩 👧 em vez de 👨‍👩‍👧). O segmentador não olha a fonte: o número de grafemas não muda |
| A língua e o contexto importam | UAX #29 precisa que um caractere percebido pode variar conforme a língua, o estilo de escrita ou o contexto, e que o algoritmo é uma aproximação sem metadados de língua |
| Um grafema não tem tamanho máximo | Não há limite para o tamanho de um grafema: um limite em grafemas não limita nem as unidades nem os bytes |

```javascript
const conjuncao = "\u0915\u094D\u0937";
// três pontos de código (क, um virama e ष) formam um único grafema aqui
console.log(conjuncao.length, [...conjuncao].length);   // -> 3 3
console.log(contarGraphemas(conjuncao));   // -> 1
```

Este grupo de consoantes da escrita devanágari (usada para o hindi) é escrito com três pontos de código: a consoante क, um **virama** (sinal que suprime a vogal da consoante que precede) e depois a consoante ष. Eles formam um único grafema com o Unicode 17.0, graças à regra GB9c, ausente da revisão para o Unicode 15.0. Outra ferramenta, ou uma versão mais antiga, pode, portanto, contar de outro jeito.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Achar que `length` conta caracteres | Conta unidades UTF-16: `"😀".length` vale 2 e `"👨‍👩‍👧".length` vale 8 |
| `slice`, `split("")`, `charAt` no meio de um texto | Cortam entre duas unidades: metade de par isolada, � ou erro (`URIError`) mais adiante |
| Cortar nos pontos de código (`[...texto].slice`) | Separa um emoji do seu modificador, do seu ZWJ ou da segunda letra de uma bandeira |
| Comparar dois textos com `===` sem normalizar | Dois “é” idênticos na tela podem ser diferentes |
| Inverter com `split("").reverse()` | Quebra os pares, coloca os acentos antes da sua letra |
| Usar `maxlength` como limite em caracteres | Ele conta em unidades UTF-16 |
| Chamar `new Intl.Segmenter` sem verificar | Ausente em ambientes antigos: a chamada gera um erro |
| Achar que um número de grafemas limita o tamanho | Um grafema pode pesar muitos bytes (18 para a família) e seu tamanho não é limitado |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Contar e cortar com `Intl.Segmenter` quando o resultado é mostrado ao usuário | O grafema é a unidade que ele percebe |
| Usar `length` para um cálculo de tamanho interno (índice em `slice`, memória) | É a unidade real do JavaScript, lida sem nenhum corte |
| Criar o segmentador uma única vez e reutilizá-lo | Não é preciso reconstruí-lo a cada chamada |
| Combinar um limite em grafemas e um limite em bytes | Limita ao mesmo tempo a exibição e o armazenamento |
| Normalizar em NFC antes de comparar ou armazenar | Duas escritas do mesmo texto tornam-se iguais |
| Verificar `typeof Intl.Segmenter === "function"` se o alvo for antigo (`typeof x` dá o tipo de `x` na forma de texto) | Evita um erro em um ambiente sem essa ferramenta |
| Chamar `isWellFormed()` em um texto recebido de fora | Detecta uma metade de par antes que ela quebre um processamento |
| Testar com emojis, acentos combinantes, uma bandeira e coreano | Os casos simples escondem quase todos os defeitos |

## O que reter

| | |
|---|---|
| **Para reter** | Um “caractere” conta-se em três níveis: o grafema (o que o olho vê), o ponto de código (o que o Unicode numera), a unidade UTF-16 (o que `length` e `slice` contam). `"👨‍👩‍👧"` vale 1 grafema, 5 pontos de código, 8 unidades e 18 bytes UTF-8. `Intl.Segmenter` divide em grafemas, e `normalize("NFC")` torna comparáveis duas escritas do mesmo texto. O resultado depende da versão do Unicode, e a largura exibida não é o número de grafemas. |
| **Armadilhas a evitar** | `length`, `slice` e `split("")` no meio de um texto; cortar nos pontos de código; comparar sem normalizar; inverter com `split("").reverse()`; `maxlength` tomado como contagem de caracteres; `Intl.Segmenter` não verificado; confundir limite em grafemas com limite em bytes. |
| **Boas práticas** | Contar e cortar em grafemas para o que o usuário vê, em unidades para os cálculos internos; criar um único segmentador; normalizar em NFC antes de comparar; combinar o limite em grafemas com um limite em bytes; testar com emojis, acentos combinantes, bandeiras e coreano. |
