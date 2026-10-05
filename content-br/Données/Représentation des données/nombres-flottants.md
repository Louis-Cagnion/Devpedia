---
order: 2
---

# Os números de ponto flutuante (IEEE 754)

Esse é provavelmente o comportamento mais confuso da programação, e o que mais costuma ser atribuído ao culpado errado:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

Esse resultado é idêntico em [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), em [Python](/?c=langages-de-programmation&s=python&p=python), em [C](/?c=langages-de-programmation&s=c&p=c), em [PHP](/?c=langages-de-programmation&s=php&p=php), em [Java](https://docs.oracle.com/en/java/) e em [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). Portanto, **não** é um defeito de uma linguagem: é uma consequência de como o processador codifica os números decimais, descrita pela norma **IEEE 754**, que todas essas linguagens usam porque é o hardware que a impõe.

## Por que uma aproximação?

Na base 10, algumas frações não têm uma escrita decimal finita: `1/3 = 0,333...`: é preciso parar em algum ponto, portanto escrever uma aproximação.

O mesmo fenômeno existe na base 2, mas **com outros números**. Um número só tem uma escrita binária finita se seu denominador for uma potência de 2:

| Número | Em binário | Exato? |
|---|---|---|
| `0,5` (= 1/2) | `0,1` | sim |
| `0,25` (= 1/4) | `0,01` | sim |
| `0,75` (= 3/4) | `0,11` | sim |
| `0,1` (= 1/10) | `0,0001100110011...` | **não**, periódico infinito |

`0.1` é perfeitamente simples em decimal e infinito em binário. A máquina precisa então truncá-lo: o que é realmente armazenado é o float mais próximo de `0,1`, não `0,1`. Somar dois valores aproximados acumula os desvios, e o resultado de `0.1 + 0.2` cai em um float ligeiramente maior que o que representa `0.3`.

> O que é exibido não é um erro de exibição: `0.30000000000000004` **é** o valor armazenado, expresso em decimal.

## Como um float é codificado

Um float é armazenado em três partes, como uma notação científica em binário (± mantissa × 2^expoente):

```text
[ sinal : 1 bit ][ expoente ][ mantissa ]
```

| Tipo | Total | Sinal | Expoente | Mantissa | Dígitos decimais confiáveis |
|---|---|---|---|---|---|
| `float` (precisão simples) | 32 bits | 1 | 8 | 23 | ~7 |
| `double` (precisão dupla) | 64 bits | 1 | 11 | 52 | ~15-16 |

- o **sinal** indica positivo ou negativo;
- o **expoente** dá a ordem de grandeza: é ele que permite representar tanto `10⁻³⁰⁰` quanto `10³⁰⁰`;
- a **mantissa** carrega os dígitos significativos, e é ela que **limita a precisão**.

Esse compromisso é o cerne da questão: um float sacrifica a precisão para cobrir uma faixa enorme de valores com poucos bits. Como o número de bits da mantissa é fixo, a precisão é **relativa**: quanto maior um número, maior o intervalo entre dois floats consecutivos.

```text
1.0  e o float seguinte  : intervalo de aproximadamente 2,2e-16
1e9  e o float seguinte  : intervalo de aproximadamente 1,2e-7
1e16 e o float seguinte  : intervalo de aproximadamente 2,0
```

A partir de 2⁵³ (aproximadamente 9 × 10¹⁵), o intervalo passa de 1: inteiros vizinhos se tornam **indistinguíveis**, porque a mantissa de 52 bits já não basta para diferenciá-los.

## A consequência prática: nunca testar igualdade

Já que dois cálculos matematicamente equivalentes podem produzir floats diferentes, `==` em floats é quase sempre um bug latente. Compara-se a **diferença** com uma margem de erro aceitável, chamada epsilon:

```text
se valor_absoluto(a - b) < epsilon  ->  considerar a e b como iguais
```

Em C:

```c
#include <math.h>

double epsilon = 0.0001;
if (fabs(a - b) < epsilon) { /* consideradas iguais */ }
```

Em Python:

```python
import math
math.isclose(0.1 + 0.2, 0.3)     # True -> gerência a tolerância para você
```

Em JavaScript:

```js
Math.abs(a - b) < 0.0001;
```

**Qual epsilon escolher?** Depende do domínio, não da linguagem. Para preços em centavos, `0.001` basta. Não use sistematicamente o "epsilon de máquina" (o menor intervalo representável em torno de 1, `2,22e-16` em precisão dupla): ele é correto para valores próximos de 1, mas **muito estrito** para valores grandes, onde o intervalo natural entre dois floats já o supera amplamente.

## Absorção e cancelamento: quando um cálculo perde seus dígitos

A distância entre dois floats consecutivos cresce com o valor (veja acima). Um resultado exato que cai entre dois floats é **arredondado** para o mais próximo: somar um número pequeno a um grande pode portanto não mudar **nada**, é a **absorção**.

| Tipo | Primeiro inteiro que deixa de existir | Somar 1 é sempre perdido a partir de |
|---|---|---|
| `float` | 2²⁴ + 1 = 16 777 217 | 2²⁵ = 33 554 432 |
| `double` | 2⁵³ + 1 = 9 007 199 254 740 993 | 2⁵⁴ = 18 014 398 509 481 984 |

Resultados medidos em C (`float`, 32 bits):

```c
float big = 16777216.0f;      /* 2^24 */
big + 1.0f == big;            /* verdadeiro: 16 777 217 não existe, arredondado para 16 777 216 */
big + 2.0f == big;            /* falso: 16 777 218 existe */

float sum = 16777216.0f;
for (int i = 0; i < 1000; i++)
	sum += 1.0f;              /* cada +1 é perdido: sum continua valendo 16 777 216, não 16 778 216 */
```

O remédio é **somar primeiro os valores pequenos entre si**: 1000 somas de `1.0f` dão exatamente 1000, e depois `16777216.0f + 1000.0f` vale 16 778 216 (um número par, representável nessa escala). Passar para `double` só empurra o limite.

O **cancelamento** é a armadilha inversa: subtrair dois números grandes e próximos destrói os dígitos confiáveis. Aqui o erro já é cometido na conversão; a subtração o torna visível:

```c
float distance = 100000000.0f;    /* 10^8 */
float radius = 99999999.0f;       /* armazenado como 100 000 000: a distância entre dois float é 8 nesse tamanho */
float near = distance - radius;   /* 0.0 em vez de 1.0 */
```

Um `near` igual a 0 onde o cálculo seguinte exige um número estritamente positivo (divisão, plano de projeção) produz um resultado infinito ou absurdo, sem nenhuma mensagem de erro. É preciso verificar o resultado de uma subtração cujos dois termos são próximos, ou calcular em `double`.

**Comparar com uma margem relativa.** Uma constante absoluta (`0.0001`) depende da unidade dos valores: grande demais para objetos de 0,001, pequena demais para valores de 10⁸ (onde a distância natural é 8). Compara-se portanto com uma fração do maior dos dois valores:

```c
/* Verdadeiro se a e b diferem no máximo pela fração rel do maior dos dois (valor absoluto). */
static int close_enough(double a, double b, double rel)
{
	return fabs(a - b) <= rel * fmax(fabs(a), fabs(b));   /* fabs: valor absoluto; fmax: o maior dos dois */
}
```

Para comparar com 0 exatamente, essa fórmula não serve (a margem fica nula): é preciso acrescentar um piso absoluto escolhido conforme a unidade do domínio.

**`NaN` e o infinito atravessam as comparações sem erro.** Uma comparação com `NaN` é sempre falsa (veja [valores especiais](#valores-especiais)), e o infinito é maior que tudo:

| Expressão | `NaN` | `+inf` (infinito positivo) |
|---|---|---|
| `x < 0` | falso | falso |
| `x > 10` | falso | verdadeiro |
| `x > 0` | falso | verdadeiro |
| `x == x` | falso | verdadeiro |

O controle habitual «recusar se fora da faixa» deixa portanto passar `NaN` (as duas condições são falsas). Escreve-se o controle **no sentido da aceitação**: aceitar somente o que é finito e está na faixa.

```c
/* Verdadeiro se x é um número finito em [min, max]; falso para NaN, +inf e -inf. */
static int in_range(double x, double min, double max)
{
	return isfinite(x) && x >= min && x <= max;   /* isfinite: falso para NaN e para o infinito */
}
```

`inf - inf` dá `NaN`: um único valor infinito produz depois `NaN` em todo o resto do cálculo.

> **Armadilha:** nenhum desses casos produz erro ou travamento: o cálculo continua com um valor errado. Verificar as entradas numéricas assim que chegam (`isfinite`, faixa do domínio) em vez de supor valores saudáveis.

## O caso do dinheiro: não usar floats

Para valores monetários, a resposta certa não é ajustar o epsilon, mas **mudar de representação**: contar em centavos, com inteiros.

```text
preco_em_centavos = 1999     // 19,99 BRL
total = preco_em_centavos * 3 // 5997, exato
```

É também por isso que os bancos de dados distinguem `DECIMAL` (exato, em base 10) de `FLOAT` (aproximado): um valor monetário se armazena em `DECIMAL`. Veja o capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql).

## Valores especiais

A norma reserva certas combinações de bits para valores especiais, presentes em todas as linguagens:

- **infinitos**: produzidos por um overflow ou uma divisão por zero (`1.0 / 0.0`);
- **NaN** (*Not a Number*): resultado de uma operação inválida (`0.0 / 0.0`, raiz de um número negativo).

`NaN` tem uma propriedade propositalmente surpreendente: **não é igual a nada, nem mesmo a si mesmo**. `NaN == NaN` é falso. Isso é coerente (dois resultados inválidos não têm motivo para ser "o mesmo número"), mas exige usar uma função dedicada para detectá-lo (`isnan()` em C, `math.isnan()` em Python, `Number.isNaN()` em JavaScript).

## Uma alternativa: a representação em ponto fixo

Em vez de sacrificar a precisão para cobrir uma faixa enorme de valores (como faz um float), a **representação em ponto fixo** (*fixed-point*) armazena um número decimal como um inteiro comum, cujos últimos bits representam por convenção a parte fracionária:

```text
Com 8 bits fracionarios:
  valor real = inteiro_armazenado / 2^8

  inteiro_armazenado = 2560  ->  2560 / 256 = 10.0
  inteiro_armazenado = 2688  ->  2688 / 256 = 10.5
```

Converter um inteiro comum para ponto fixo equivale a multiplicá-lo por `2^bits_fracionarios` (`10 * 256 = 2560`); converter no sentido inverso (para inteiro ou float) equivale a dividir por esse mesmo valor.

| | Float (IEEE 754) | Ponto fixo |
|---|---|---|
| Armazenamento | Sinal + expoente + mantissa | Um inteiro comum |
| Precisão | Relativa (depende da ordem de grandeza) | Fixa e constante (sempre o mesmo número de casas decimais) |
| Cálculo | Requer uma unidade de ponto flutuante (FPU) | Operações inteiras simples, mais rápidas e determinísticas |
| Uso típico | Cálculo científico, faixa de valores muito ampla | Embarcado sem FPU, jogos retrô, sinal de áudio/DSP |

> **Boa prática:** o ponto fixo garante um resultado estritamente idêntico em qualquer máquina (diferente de um float, cujo arredondamento pode variar levemente conforme o compilador ou o processador): útil sempre que um cálculo precisar continuar reprodutível bit a bit, por exemplo em um jogo multijogador em que cada cliente deve obter exatamente o mesmo resultado.

É a técnica por trás do formato **Q** (*Q number format*), ainda usado hoje por alguns processadores digitais de sinal (DSP) que não possuem uma unidade de ponto flutuante.

## O que cada linguagem adiciona

A base é comum; as linguagens diferem apenas na embalagem:

| Linguagem | Especificidades |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | `float` / `double` / `long double` explícitos, `fabs()`, `isnan()` |
| JavaScript | um único tipo `number` (sempre um double), `BigInt` para inteiros grandes, veja [Os números](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, inteiros de tamanho arbitrário nativamente, `math.isclose()`, módulo `decimal` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Lembre-se principalmente de que essas diferenças não mudam nada no fundo: é o hardware que decide, e ele decide igual para todo mundo.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um float (norma IEEE 754) armazena uma aproximação, não um valor exato: `0.1 + 0.2 != 0.3` em todas as linguagens, sem exceção. A precisão é relativa: quanto maior um número, maior o intervalo entre dois floats consecutivos. Os inteiros permanecem exatos até 2⁵³ em precisão dupla (52 bits de mantissa); além disso, inteiros vizinhos se tornam indistinguíveis; em `float`, a partir de 2²⁴. Um número pequeno somado a um grande pode ser absorvido, e uma subtração de números grandes e próximos pode dar 0. |
| **Ferramentas úteis** | Comparação por epsilon (`math.isclose`, `fabs(a-b) < epsilon`), tipos `DECIMAL` para valores exatos. Ponto fixo para um resultado reprodutível bit a bit sem FPU. |
| **Armadilhas a evitar** | Comparar dois floats com `==` (incluindo `NaN`, que não é igual a nada, nem a si mesmo); armazenar um valor monetário em float em vez de inteiros (centavos) ou `DECIMAL`. Controlar uma entrada com «recusar se fora da faixa»: `NaN` passa, e o infinito passa um teste `x > 0`. Somar um a um termos pequenos a um total grande. |
| **Boas práticas** | Escolher um epsilon adequado à ordem de grandeza manipulada, nunca o epsilon de máquina por padrão para valores grandes. Comparar com uma margem relativa em vez de uma constante absoluta. Somar os valores pequenos entre si antes de acrescentá-los ao total grande. Aceitar uma entrada somente se `isfinite(x)` e dentro da faixa do domínio. |
