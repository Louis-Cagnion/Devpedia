---
order: 6
---

# Os números

O JavaScript se destaca por uma escolha radical: por muito tempo teve **apenas um único tipo numérico**, `number`, que é um float de precisão dupla (IEEE 754). Ele não distingue então inteiros de decimais: `1` e `1.0` são o mesmo valor.

> Os comportamentos surpreendentes que decorrem disso (`0.1 + 0.2 !== 0.3`, o limite dos inteiros grandes, `NaN !== NaN`) **não** são exclusivos do JavaScript: vêm da codificação dos floats, comum a todas as linguagens. Sua explicação completa está no capítulo [Os números de ponto flutuante](/?c=representation-des-donnees&p=nombres-flottants). Este capítulo se concentra no que o JavaScript faz com isso.

## Um único tipo, logo inteiros flutuantes

```js
typeof 42;    // "number"
typeof 42.5;  // "number"
typeof NaN;   // "number"

42 === 42.0;       // true : nenhuma distincao
5 / 2;             // 2.5 -> sem divisao inteira implicita
Math.trunc(5 / 2)  // 2   -> e preciso pedir explicitamente
```

A ausência de divisão inteira nativa é uma armadilha frequente para quem vem de C ou [Python](/?c=langages-de-programmation&s=python&p=python) (`5 // 2`).

## Comparar decimais

Como em toda linguagem, não se compara dois floats com `===` mas via uma margem de erro:

```js
const epsilon = 0.0001;
if (Math.abs(a - b) < epsilon) { /* consideradas iguais */ }
```

O JavaScript fornece `Number.EPSILON` (≈ `2,22e-16`), que é a diferença entre `1` e o próximo float. Útil para valores próximos de 1, mas **rigoroso demais** assim que se manipula números grandes:

```js
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;          // true
Math.abs(1e9 + 0.1 - (1e9 + 0.2)) < Number.EPSILON;  // false, mesmo com uma diferenca minima
```

Para valores monetários, a boa prática continua sendo trabalhar em **centavos**, com inteiros.

## O limite dos inteiros exatos

Como a mantissa de um double tem 52 bits, os inteiros só são exatos até 2⁵³ − 1:

```js
Number.MAX_SAFE_INTEGER;                // 9007199254740991
9007199254740992 === 9007199254740993;  // true! indistinguiveis
Number.isSafeInteger(2 ** 53);          // false
```

É um problema concreto assim que se manipulam identificadores vindos de um banco de dados em `BIGINT`: além desse limite, o JavaScript os arredonda silenciosamente. A solução costumeira é transportá-los como **string** no JSON.

## `BigInt`: os inteiros de tamanho arbitrário

Desde o ES2020, `BigInt` remove esse limite. Se escreve com um `n` no final:

```js
9007199254740993n === 9007199254740992n;  // false : exato
2n ** 64n;                                 // 18446744073709551616n
```

Duas restrições a conhecer:

```js
1n + 1;         // TypeError : nao se mistura BigInt e number
1n + BigInt(1)  // 2n : conversao explicita obrigatoria
5n / 2n;        // 2n : divisao inteira, a parte decimal e truncada
```

`BigInt` serve para grandes identificadores e criptografia, não para cálculos decimais: só lida com inteiros.

## `NaN` e os infinitos

```js
1 / 0;            // Infinity  (e nao um erro)
-1 / 0;           // -Infinity
0 / 0;            // NaN
parseInt("abc");  // NaN

NaN === NaN;         // false : NaN nao e igual a nada, nem a ele mesmo
Number.isNaN(NaN);   // true  -> a forma correta de testar
isNaN("abc");        // true  -> ATENCAO: converte antes, entao engana
Number.isNaN("abc")  // false -> "abc" nao e NaN, e uma string
```

Prefira sistematicamente `Number.isNaN()` à antiga função global `isNaN()`, que converte seu argumento antes de testar e produz falsos positivos.

## Conversões a partir de uma string

```js
Number("42");        // 42
Number("42px");      // NaN   -> estrito: tudo ou nada
parseInt("42px");    // 42    -> tolerante: para no primeiro caractere invalido
parseFloat("3.9m");  // 3.9
Number("");          // 0     -> armadilha classica: a string vazia vira 0
```

`parseInt` aceita um segundo argumento, a base, que é prudente sempre especificar: `parseInt("08", 10)`.

## Formatar para exibição

```js
(1234.5678).toFixed(2);          // "1234.57" -> retorna uma STRING, nao um numero
(0.000001234).toExponential(2);  // "1.23e-6"

(1234567.891).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// "R$ 1.234.567,89"
```

`toLocaleString` cuida sozinho dos separadores de milhar e da vírgula decimal: dispensa reconstruí-los na mão.

## Resumo

| Armadilha | Reflexo |
|---|---|
| Um único tipo `number` (float) | `Math.trunc()` para uma divisão inteira |
| `0.1 + 0.2 !== 0.3` | Comparar via uma margem de erro |
| Valores monetários | Trabalhar em centavos |
| Identificadores > 2⁵³ | Transportá-los como string, ou usar `BigInt` |
| `NaN !== NaN` | `Number.isNaN()`, nunca `isNaN()` |
| `Number("")` vale `0` | Validar antes de converter |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O JavaScript tem apenas um tipo numérico (`number`, float IEEE 754): sem distinção nativa inteiro/decimal. `BigInt` remove o limite dos grandes inteiros exatos (2⁵³ − 1). |
| **Ferramentas utilizáveis** | `Math.trunc`, `Number.isNaN`, `Number.isSafeInteger`, `toFixed`/`toLocaleString` para exibição. |
| **Armadilhas a evitar** | Comparar dois floats com `===`; usar o `isNaN()` global (converte antes de testar) em vez de `Number.isNaN()`. |
| **Boas práticas** | Trabalhar em centavos para valores monetários; transportar um identificador grande como string em vez de `number`. |
