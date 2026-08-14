---
order: 1
---

# Os inteiros, os bits e os overflows

Um inteiro não é armazenado "como é": ele ocupa um número **fixo** de bits, decidido na declaração. Toda a mecânica dos inteiros decorre dessa restrição: os valores máximos, os números negativos, e os overflows.

## Quantos valores em *n* bits?

Com *n* bits, temos **2ⁿ** combinações distintas, portanto 2ⁿ valores representáveis:

| Bits | Combinações | Sem sinal | Com sinal |
|---|---|---|---|
| 8 | 256 | 0 → 255 | −128 → 127 |
| 16 | 65 536 | 0 → 65 535 | −32 768 → 32 767 |
| 32 | ~4,3 bilhões | 0 → 4 294 967 295 | −2 147 483 648 → 2 147 483 647 |
| 64 | ~1,8 × 10¹⁹ | 0 → ~1,8 × 10¹⁹ | ~−9,2 × 10¹⁸ → ~9,2 × 10¹⁸ |

O número de valores não muda dependendo se é com ou sem sinal: é a **faixa** que se desloca. Um `char` sem sinal vai de 0 a 255, um com sinal de −128 a 127: 256 valores nos dois casos.

**O cálculo a lembrar:** para *n* bits, o valor máximo sem sinal é `2ⁿ − 1` (o `− 1` porque o zero ocupa uma combinação). Com sinal, a faixa vai de `−2ⁿ⁻¹` a `2ⁿ⁻¹ − 1`.

## O peso de um bit

Cada bit contribui para o valor total de acordo com sua posição, uma potência de 2 crescente da direita para a esquerda (seu **peso**):

```text
bit :    1    0    1    1    0    0    1    0
peso : 128   64   32   16   8    4    2    1
         ^                                  ^
    peso alto                        peso baixo
```

O **bit de peso baixo** (o mais à direita) é o que vale 1 (2⁰); o **bit de peso alto** (o mais à esquerda) é o que mais pesa no valor final, 2ⁿ⁻¹ em *n* bits. Essa distinção volta em dois contextos comuns: o bit de peso alto serve como indicador de sinal em complemento de dois (veja mais abaixo), e o bit de peso baixo sozinho basta para testar a paridade de um número (`n & 1`, veja o capítulo [Os operadores binários](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

## Os números negativos: o complemento de dois

Como armazenar um sinal se só temos 0 e 1? A ideia ingênua seria reservar um bit para o sinal. É isso que faz o float, mas não o inteiro, porque isso traria dois problemas: duas representações do zero (`+0` e `−0`), e uma soma que precisaria tratar os sinais separadamente.

A solução universalmente adotada é o **complemento de dois**: para obter `−x`, inverte-se todos os bits de `x` e então soma-se 1.

```text
 5 (em 8 bits)   = 0000 0101
 inversao        = 1111 1010
 + 1             = 1111 1011  =  -5
```

A vantagem é decisiva: **a soma funciona sem caso especial**. O processador soma os bits sem saber nem se importar com o sinal.

```text
   5  = 0000 0101
+ -5  = 1111 1011
-----------------
   0  = 0000 0000   (o bit que ultrapassa e simplesmente perdido)
```

O bit de peso alto age então como um indicador de sinal: `0` para positivo, `1` para negativo. É isso também que explica a **assimetria** da faixa (`−128` a `127`): como o zero está do lado positivo, sobra uma combinação extra para os negativos.

## O overflow

O que acontece quando um resultado não cabe mais no número de bits alocados? Os bits excedentes são **perdidos**, e o valor "dá a volta".

```c
unsigned char x = 255;  // 1111 1111, o maximo
x = x + 1;              // 0000 0000 -> 0 !
```

É o comportamento chamado *wraparound*: volta-se ao início, como um odômetro de carro. Para um inteiro **com sinal**, o efeito é mais surpreendente:

```c
signed char y = 127;  // 0111 1111, o maximo
y = y + 1;            // 1000 0000 -> -128 !
```

Somar 1 ao maior número positivo dá o menor negativo.

> **Cuidado importante em C/C++:** o overflow de um inteiro **com sinal** é um **comportamento indefinido** (*undefined behavior*), não um wraparound garantido. O compilador tem o direito de supor que isso nunca acontece e otimizar de acordo: um teste como `if (x + 1 < x)` pode ser simplesmente eliminado. O overflow **sem sinal**, por sua vez, é definido pela norma e realmente dá a volta. Para contar, comparar ou mascarar bits, prefira portanto os tipos sem sinal.

## Por que isso realmente importa

Os overflows de inteiros não são uma curiosidade acadêmica:

- O **bug do ano 2038**: os sistemas Unix contam os segundos desde 1970 em um inteiro com sinal de 32 bits. Ele vai dar overflow em 19 de janeiro de 2038, retornando uma data em 1901.
- Muitas **falhas de segurança** vêm de um cálculo de tamanho que dá overflow: se `tamanho + 1` dá a volta para 0, uma alocação de 0 bytes é seguida de uma escrita de vários milhares: é um buffer overflow. Veja o capítulo [A gestão de memória](/?c=langages-de-programmation&s=c&p=memoire) de C.
- O **primeiro Ariane 5** foi destruído em 1996 por causa de uma conversão de um float de 64 bits para um inteiro de 16 bits que deu overflow.

## Dependendo da linguagem

| Linguagem | Comportamento |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp) | Tamanho fixo escolhido explicitamente. Overflow com sinal = comportamento indefinido |
| [Java](https://docs.oracle.com/en/java/), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/) | Tamanho fixo, wraparound definido para todos os inteiros |
| **[Python](/?c=langages-de-programmation&s=python&p=python)** | Inteiros de **tamanho arbitrário**: crescem enquanto a memória permitir, nenhum overflow |
| JavaScript | Sem tipo inteiro de verdade: tudo é float, portanto exato só até 2⁵³ (veja [Os números de ponto flutuante](/?c=representation-des-donnees&p=nombres-flottants)). `BigInt` para ir além |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | Inteiro nativo; em caso de overflow, conversão automática para `float` (portanto perda de precisão) |

Python ilustra bem o compromisso: nunca dar overflow é confortável, mas cada inteiro é um objeto mais pesado e mais lento que um inteiro de máquina. É uma das razões pelas quais bibliotecas de cálculo como o NumPy usam tipos de tamanho fixo (`int32`, `int64`). Veja o capítulo [NumPy](/?c=data-science&p=numpy).

## Manipular os bits diretamente

O corolário dessa representação binária é que se pode agir sobre os próprios bits: máscaras, deslocamentos, flags. É o assunto do capítulo [Os operadores binários](/?c=langages-de-programmation&s=c&p=operateurs-binaires) em C.

## Resumo

| A reter | |
|---|---|
| *n* bits | 2ⁿ valores; máximo sem sinal = 2ⁿ − 1 |
| Negativos | Complemento de dois: inverter os bits, somar 1 |
| Faixa com sinal assimétrica | O zero é contado do lado positivo |
| Overflow | Os bits excedentes são perdidos, o valor dá a volta |
| Em C, com sinal que dá overflow | Comportamento **indefinido**: usar sem sinal |

---

## 📋 Recapitulação

| | |
|---|---|
| **O que reter** | Um inteiro ocupa um número fixo de bits, decidido na declaração: *n* bits dão 2ⁿ valores possíveis. Os negativos se codificam em complemento de dois; um overflow faz o valor "dar a volta" (ou provoca um comportamento indefinido em C para um com sinal). |
| **Ferramentas úteis** | Os tipos sem sinal para contar/comparar/mascarar bits sem risco de UB; os tipos de tamanho fixo (`int32`, `int64`) das bibliotecas de cálculo. |
| **Armadilhas a evitar** | Contar com o overflow de um inteiro com sinal em C/C++: comportamento indefinido, não um wraparound garantido. |
| **Boas práticas** | Preferir tipos sem sinal para qualquer manipulação de bits; verificar que um cálculo de tamanho não pode dar overflow antes de uma alocação de memória. |
