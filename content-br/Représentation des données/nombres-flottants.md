---
order: 2
---

# Os números de ponto flutuante (IEEE 754)

Esse é provavelmente o comportamento mais confuso da programação, e o que mais costuma ser atribuído ao culpado errado:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

Esse resultado é idêntico em JavaScript, em [Python](/?c=langages-de-programmation&s=python&p=python), em [C](/?c=langages-de-programmation&s=c&p=c), em [PHP](/?c=langages-de-programmation&s=php&p=php), em [Java](https://docs.oracle.com/en/java/) e em [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). Portanto, **não** é um defeito de uma linguagem: é uma consequência de como o processador codifica os números decimais, descrita pela norma **IEEE 754**, que todas essas linguagens usam porque é o hardware que a impõe.

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
math.isclose(0.1 + 0.2, 0.3)     # True -> gerencia a tolerancia para voce
```

Em JavaScript:

```js
Math.abs(a - b) < 0.0001;
```

**Qual epsilon escolher?** Depende do domínio, não da linguagem. Para preços em centavos, `0.001` basta. Não use sistematicamente o "epsilon de máquina" (o menor intervalo representável em torno de 1, `2,22e-16` em precisão dupla): ele é correto para valores próximos de 1, mas **muito estrito** para valores grandes, onde o intervalo natural entre dois floats já o supera amplamente.

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

## O que cada linguagem adiciona

A base é comum; as linguagens diferem apenas na embalagem:

| Linguagem | Especificidades |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | `float` / `double` / `long double` explícitos, `fabs()`, `isnan()` |
| JavaScript | um único tipo `number` (sempre um double), `BigInt` para inteiros grandes, veja [Os números](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, inteiros de tamanho arbitrário nativamente, `math.isclose()`, módulo `decimal` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Lembre-se principalmente de que essas diferenças não mudam nada no fundo: é o hardware que decide, e ele decide igual para todo mundo.

## Resumo

| A reter | Por quê |
|---|---|
| `0.1 + 0.2 != 0.3` em todas as linguagens | Codificação binária, não um bug da linguagem |
| Nunca comparar dois floats com `==` | Dois cálculos equivalentes dão bits diferentes |
| Comparar via um epsilon adequado ao domínio | A precisão é relativa à ordem de grandeza |
| Valores monetários em inteiros ou `DECIMAL` | Nenhuma aproximação tolerável com dinheiro |
| Inteiros exatos até 2⁵³ em precisão dupla | A mantissa tem 52 bits |
| `NaN != NaN` | Um valor inválido não é igual a nada, incluindo ele mesmo |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um float (norma IEEE 754) armazena uma aproximação, não um valor exato: `0.1 + 0.2 != 0.3` em todas as linguagens, sem exceção. A precisão é relativa: quanto maior um número, maior o intervalo entre dois floats consecutivos. |
| **Ferramentas úteis** | Comparação por epsilon (`math.isclose`, `fabs(a-b) < epsilon`), tipos `DECIMAL` para valores exatos. |
| **Armadilhas a evitar** | Comparar dois floats com `==`; armazenar um valor monetário em float em vez de inteiros (centavos) ou `DECIMAL`. |
| **Boas práticas** | Escolher um epsilon adequado à ordem de grandeza manipulada, nunca o epsilon de máquina por padrão para valores grandes. |
