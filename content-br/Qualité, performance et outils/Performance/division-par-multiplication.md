---
order: 10
---

# Substituir uma divisão por uma multiplicação

Em um programa que calcula muito, uma operação em particular custa mais que as outras: a **divisão**. Este capítulo mostra como uma divisão por um número fixo pode ser substituída por uma multiplicação que dá **exatamente** o mesmo resultado, por que isso funciona, dentro de quais limites e, sobretudo, quanto isso ganha de verdade: a resposta é uma lição de [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

## O que faz uma divisão e por que ela custa caro

Uma **divisão inteira** procura quantas vezes um número cabe em outro: é o **quociente**. O que sobra é o **resto**.

| Cálculo | Quociente | Resto | Em C |
|---|---|---|---|
| 1.000.000 ÷ 108 | 9.259 | 28 | `1000000 / 108` e `1000000 % 108` |
| 17 ÷ 5 | 3 | 2 | `17 / 5` e `17 % 5` |

Um processador executa **instruções** (somar, multiplicar, dividir...), e cada uma ocupa um número de **ciclos**: um ciclo é uma batida do relógio interno do processador (veja [o contador de ciclos](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#cronometrar-uma-parte-de-um-laco-o-contador-de-ciclos)). As ordens de grandeza, que variam conforme o modelo de processador:

| Operação com inteiros | Custo típico |
|---|---|
| Adição, subtração | cerca de 1 ciclo |
| Multiplicação | cerca de 3 ciclos |
| Divisão | uma dezena de ciclos ou mais |

A multiplicação é rápida porque um circuito dedicado calcula todo o resultado em uma só passada. A divisão se parece mais com a da escola: o circuito avança por etapas sucessivas. É, portanto, a operação a evitar em um laço executado milhões de vezes.

## A ideia: multiplicar pelo inverso

Dividir por 4 é multiplicar por 0,25. Dividir por 8 é multiplicar por 0,125. Dividir por `q` é multiplicar por `1/q`, chamado de **inverso** de `q`.

O problema: os inteiros não têm vírgula, e `1/7` vale `0,142857142857...` sem nunca terminar. O truque consiste em trabalhar em **ponto fixo**: mantém-se um número fixo de casas decimais, arredonda-se **para cima** e desloca-se a vírgula escrevendo o resultado como um inteiro.

Exemplo em base 10, para dividir por 7 com 6 casas decimais: o inverso arredondado para cima é `0,142858`, ou seja, o inteiro `142.858` se multiplicarmos por um milhão. Multiplica-se `d` por `142.858`, depois **descartam-se os 6 últimos algarismos** (o que equivale a dividir por um milhão):

| d | d × 142.858 | descartam-se 6 algarismos | d ÷ 7 (quociente real) |
|---|---|---|---|
| 6 | 857.148 | 0 | 0 |
| 7 | 1.000.006 | 1 | 1 |
| 1.000 | 142.858.000 | 142 | 142 |
| 999.999 | 142.857.857.142 | 142.857 | 142.857 |

O computador conta em base 2, não em base 10: troca-se o milhão por `2^32` (cerca de 4,3 bilhões) e «descartar os 6 últimos algarismos» por «descartar os 32 últimos bits», isto é, um [deslocamento para a direita](/?c=langages&s=c&p=operateurs-binaires#os-deslocamentos) de 32 posições (`>> 32`).

```
inverso(q) = 2^32 / q, arredondado para cima
d / q      = (d × inverso(q)) >> 32
```

## O código

```c
#include <stdint.h>
#include <stdio.h>

/* o inverso de q em ponto fixo: 2^32 / q arredondado para cima.
   Calcule-o UMA única vez por divisor. */
static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }

/* d / q sem divisão: multiplicar pelo inverso,
   depois descartar os 32 bits de menor peso */
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned n = 108;                       /* um divisor conhecido só na execução */
    uint64_t inv = inverso(n);              /* a única divisão real, paga uma vez */
    unsigned d = 1000000;
    unsigned quociente = dividir(d, inv);   /* d / n, por multiplicação */
    unsigned resto = d - quociente * n;     /* d % n, também sem divisão */

    printf("inverso(%u) = %llu\n", n, (unsigned long long)inv);
    printf("%u / %u = %u, resto %u\n", d, n, quociente, resto);
    printf("controle: %u / %u = %u, resto %u\n", d, n, d / n, d % n);
    return 0;
}
```

Saída:

```
inverso(108) = 39768216
1000000 / 108 = 9259, resto 28
controle: 1000000 / 108 = 9259, resto 28
```

| Elemento do código | Papel |
|---|---|
| `uint64_t` | Inteiro sem sinal de 64 bits. O produto `d × inverso` ultrapassa 32 bits: é preciso um espaço mais largo (veja o [overflow](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements#o-overflow)). |
| `1ull << 32` | O número `2^32`, escrito como `unsigned long long` (sufixo `ull`) para caber na memória. |
| `+ q - 1` | Para arredondar um quociente inteiro **para cima**: `(a + q - 1) / q` é o menor inteiro maior ou igual a `a / q`. |
| `>> 32` | Descarta os 32 bits de menor peso: o equivalente de «descartar os 6 últimos algarismos». Permitido aqui porque o valor tem 64 bits: deslocar 32 posições um inteiro de 32 bits é comportamento indefinido (veja [os deslocamentos](/?c=langages&s=c&p=operateurs-binaires#os-deslocamentos)). |
| `d - quociente * n` | O resto, sem uma segunda divisão: `d % n` se deduz do quociente. |

O cálculo do inverso contém, ele próprio, uma divisão real, mas é feito **uma única vez** por divisor. Cada divisão seguinte é apenas uma multiplicação e um deslocamento. O truque só compensa, portanto, se o **mesmo divisor** for usado um grande número de vezes.

## Por que é exato

O inverso foi arredondado para cima: é um pouco grande demais. Chamemos de `e` esse excedente, em unidades de `1/2^32`:

```
e = q × inverso(q) - 2^32          com 0 <= e < q
```

Então `d × inverso(q) / 2^32 = d/q + d×e / (q × 2^32)`: o cálculo dá o quociente real mais um pequeno erro positivo, `d×e / (q × 2^32)`. Esse erro não muda o resultado enquanto permanecer **inferior a `1/q`**:

| Etapa | Raciocínio |
|---|---|
| 1 | `d / q` se escreve `k + r/q`: `k` é o quociente, `r` o resto, e `r` é no máximo `q - 1`. |
| 2 | A parte após a vírgula vale, portanto, no máximo `(q - 1)/q = 1 - 1/q`. |
| 3 | Somar a ela um erro estritamente inferior a `1/q` não pode atingir `k + 1`: a parte inteira continua sendo `k`. |
| 4 | O erro é inferior a `1/q` quando `d × e < 2^32`. |
| 5 | Com `q <= 128`, `e < 128 = 2^7`; com `d < 2^25`, `d × e < 2^25 × 2^7 = 2^32`. |

O método é, portanto, exato para todo divisor até 128 e todo dividendo inferior a `2^25` (33.554.432). Uma prova tranquiliza, mas um erro de um único bit passa despercebido: verifica-se também por **força bruta**, comparando com a divisão real para cada um dos 128 × 2^25 pares possíveis:

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned long long verificadas = 0, erradas = 0;

    for (unsigned q = 1; q <= 128; q++) {               /* divisores da zona garantida */
        uint64_t inv = inverso(q);
        for (unsigned d = 0; d < (1u << 25); d++) {     /* dividendos da zona garantida */
            verificadas++;
            if (dividir(d, inv) != d / q)               /* controle pela divisão real */
                erradas++;
        }
    }
    printf("%llu divisões verificadas, %llu erradas\n", verificadas, erradas);
    return 0;
}
```

```
4294967296 divisões verificadas, 0 erradas
```

## Fora da zona garantida, o resultado é errado sem avisar

Quando `d × e` atinge `2^32`, o erro passa de `1/q` e o quociente pode valer **um a mais** que o correto, sem nenhuma mensagem:

```c
#include <stdint.h>
#include <stdio.h>

int main(void)
{
    unsigned q = 127;
    uint64_t inv = ((1ull << 32) + q - 1) / q;
    uint64_t e = q * inv - (1ull << 32);        /* erro de arredondamento: 0 <= e < q */
    unsigned d = 0;

    while ((unsigned)(d * inv >> 32) == d / q)  /* procura o primeiro dividendo errado */
        d++;
    printf("q = %u, e = %llu\n", q, (unsigned long long)e);
    printf("primeiro d errado: %u (2^25 = %u, 2^32 / e = %llu)\n",
           d, 1u << 25, (1ull << 32) / e);
    printf("quociente real: %u, quociente calculado: %u\n", d / q, (unsigned)(d * inv >> 32));
    return 0;
}
```

```
q = 127, e = 111
primeiro d errado: 38693470 (2^25 = 33554432, 2^32 / e = 38693399)
quociente real: 304672, quociente calculado: 304673
```

O primeiro dividendo errado fica logo acima de `2^32 / e`, como a prova prevê. Ele depende do divisor:

| Divisor `q` | Erro `e` | `2^32 / e` | Primeiro `d` errado |
|---|---|---|---|
| 3 | 2 | 2.147.483.648 | 2.147.483.648 |
| 10 | 4 | 1.073.741.824 | 1.073.741.829 |
| 127 | 111 | 38.693.399 | 38.693.470 |
| 129 | 113 | 38.008.560 | 38.008.688 |
| 128 | 0 | (nenhum erro) | nenhum (potência de 2: o inverso é exato) |

O limite «`q <= 128` e `d < 2^25`» é, portanto, **suficiente**, não o único possível: um divisor pequeno como 3 continua exato até mais de dois bilhões. Para uma zona maior, é preciso uma versão mais fina do algoritmo, com um deslocamento adicional: é o que fazem os compiladores e a biblioteca [libdivide](https://libdivide.com/), a partir do artigo de [Granlund e Montgomery (1994)](https://doi.org/10.1145/178243.178249).

## O compilador já faz isso quando conhece o divisor

Quando o divisor é uma constante escrita no código, o [compilador](/?c=langages&s=c&p=compilation) aplica essa transformação por conta própria:

```c
unsigned div_constante(unsigned d) { return d / 108; }
unsigned div_variavel(unsigned d, unsigned n) { return d / n; }
```

O código de máquina produzido por `gcc -O2` (os [níveis de otimização](/?c=langages&s=c&p=compilation#os-niveis-de-otimizacao-o0-a-o3-os) do compilador), exibido com `objdump -d` ([exemplo de uso](/?c=langages&s=c&p=compilation#varios-arquivos-e-inlining-unidade-de-traducao-static-inline-flto)), sem as linhas de alinhamento nem `endbr64`:

```
div_constante:                       div_variavel:
  mov    eax,edi                       mov    eax,edi
  shr    eax,0x2                       xor    edx,edx
  imul   rax,rax,0x4bda12f7            div    esi          <- a divisão real
  shr    rax,0x23
  ret                                  ret
```

Para `d / 108`, o compilador escolheu sozinho uma constante mágica (`0x4bda12f7`): uma multiplicação e deslocamentos, nenhuma instrução `div`. Ele faz isso mesmo sem otimização (`-O0`). Para `d / n`, não pode fazer nada: o valor de `n` só existe na execução (lido da linha de comando, de um arquivo...), então mantém `div`.

| Divisor | Quem substitui a divisão? |
|---|---|
| Constante conhecida na compilação | O compilador, automaticamente |
| Fixado na partida, reutilizado milhões de vezes | O programador (esta técnica), ou uma biblioteca |
| Diferente a cada divisão | Ninguém: calcular o inverso custa uma divisão, nada se ganha |

## Quanto isso ganha: uma lição de medição

Para medir, o programa a seguir cronometra (com [`clock_gettime`](/?c=langages&s=c&p=mesure-du-temps#medir-uma-duracao-clock-gettime-clock-monotonic)) duas situações. Na **cadeia dependente**, cada divisão precisa do resultado da anterior: não pode começar antes. Nas divisões **independentes**, o processador pode fazer várias avançarem ao mesmo tempo. O divisor é lido da linha de comando: o compilador não pode conhecê-lo.

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

#define N 400000000u                /* número de iterações */
#define MASCARA ((1u << 25) - 1)    /* mantém d abaixo de 2^25, onde o inverso é exato */

/* cadeia dependente: cada divisão espera o resultado da anterior */
static unsigned cadeia_div(unsigned n)
{
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (d / n + i * 2654435761u) & MASCARA;
    return d;
}

static unsigned cadeia_mul(unsigned n)
{
    uint64_t inv = inverso(n);
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (dividir(d, inv) + i * 2654435761u) & MASCARA;
    return d;
}

/* divisões independentes: o processador pode avançar várias ao mesmo tempo */
static unsigned indep_div(unsigned n)
{
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += ((i * 2654435761u) & MASCARA) / n;
    return s;
}

static unsigned indep_mul(unsigned n)
{
    uint64_t inv = inverso(n);
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += dividir((i * 2654435761u) & MASCARA, inv);
    return s;
}

static double agora(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned n = argc > 1 ? (unsigned)atoi(argv[1]) : 108;     /* desconhecido ao compilar */
    unsigned (*f[4])(unsigned) = { cadeia_div, cadeia_mul, indep_div, indep_mul };
    const char *nome[4] = { "cadeia       d / n  ", "cadeia       inverso",
                            "independentes d / n  ", "independentes inverso" };
    double melhor[4] = { 1e9, 1e9, 1e9, 1e9 };
    unsigned res[4];

    for (int rodada = 0; rodada < 5; rodada++)    /* 5 rodadas alternadas, guarda a melhor */
        for (int k = 0; k < 4; k++) {
            double t0 = agora();
            double duracao;

            res[k] = f[k](n);
            duracao = agora() - t0;
            if (duracao < melhor[k])
                melhor[k] = duracao;
        }
    for (int k = 0; k < 4; k++)
        printf("%s : %5.2f ns por divisão\n", nome[k], melhor[k] / N * 1e9);
    printf("resultados idênticos: %s\n",
           res[0] == res[1] && res[2] == res[3] ? "sim" : "NÃO");
    return 0;
}
```

```
cadeia       d / n   :  2.67 ns por divisão
cadeia       inverso :  1.28 ns por divisão
independentes d / n   :  1.30 ns por divisão
independentes inverso :  0.38 ns por divisão
resultados idênticos: sim
```

| Situação | Divisão `/` | Inverso pré-calculado | Ganho |
|---|---|---|---|
| Cadeia dependente | 2,66 ns | 1,28 ns | cerca de ×2 |
| Divisões independentes | 1,3 ns | 0,38 ns | cerca de ×3,4 |

Nesse pequeno programa, a divisão é o único trabalho: o ganho é máximo. Em um programa real, é outra coisa. No [solucionador de Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), que encontra a linha e a coluna de uma célula a partir do seu número (divisões pelo tamanho `n` da grade), a substituição foi verificada assim: as duas versões fazem **exatamente a mesma busca** (mesmos contadores de trabalho, veja [verificar que duas versões fazem o mesmo trabalho](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#verificar-que-duas-versoes-fazem-o-mesmo-trabalho-antes-de-cronometra-las)), e depois foram cronometradas em duas [rodadas alternadas](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#medir-em-rodadas-alternadas). Resultado com `n = 96`: **0,5 % de tempo ganho**.

Por que tão pouco, se a divisão é de 2 a 3 vezes mais lenta isolada?

| Razão | Explicação |
|---|---|
| O processador esconde a latência | Enquanto uma divisão executa, ele já adianta outras instruções: o tempo de espera fica em grande parte coberto por outro trabalho. |
| A divisão é uma pequena parte do tempo | O solucionador passa a maior parte do tempo lendo memória, não dividindo (veja [o cache do processador](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#a-hierarquia-de-cache)). |
| Um microteste é um máximo | Ele isola a operação medida: dá o limite superior do ganho, nunca o ganho real. |

> Um ganho de ×3 em um microteste e de 0,5 % no programa completo não se contradizem: não medem a mesma coisa. Antes de otimizar uma operação, convém cronometrar **o programa inteiro**; senão, gasta-se tempo escrevendo um código mais sutil para um resultado que o cronômetro mal distingue do ruído.

## As armadilhas

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }

int main(void)
{
    unsigned q = 108, d = 1000000;
    unsigned inv32 = (unsigned)inverso(q);      /* inverso copiado em 32 bits */
    unsigned inv_de_1 = (unsigned)inverso(1);   /* vale 2^32: são necessários 33 bits */

    printf("d / q                         = %u\n", d / q);
    printf("produto calculado em 64 bits  = %u\n", (unsigned)(d * inverso(q) >> 32));
    printf("produto calculado em 32 bits  = %u\n", (unsigned)((uint64_t)(d * inv32) >> 32));
    printf("5 / 1 com um inverso de 32 bits = %u\n",
           (unsigned)((uint64_t)(5 * inv_de_1) >> 32));
    return 0;
}
```

```
d / q                         = 9259
produto calculado em 64 bits  = 9259
produto calculado em 32 bits  = 0
5 / 1 com um inverso de 32 bits = 0
```

| Armadilha | O que acontece | Remédio |
|---|---|---|
| Produto calculado em 32 bits | O excedente além de 32 bits se perde, depois o deslocamento de 32 bits deixa apenas 0: o resultado é errado sem erro nem aviso | Manter o inverso em um `uint64_t`: a multiplicação é então feita em 64 bits |
| Inverso de 1 | `2^32` não cabe em 32 bits: copiado em um `unsigned`, vale 0 | O mesmo remédio: o inverso fica em 64 bits |
| `d` ou `q` fora da zona garantida | Quociente um a mais, sem mensagem | Limitar `d` e `q` ao criar o inverso, ou verificar a zona por força bruta como acima |
| Números negativos | A divisão em C arredonda em direção a zero (`-7 / 2` dá `-3`); o truque só cobre inteiros sem sinal | Aplicar a técnica apenas a valores `unsigned` |
| Divisor nulo | `inverso(0)` divide por zero e interrompe o programa | Recusar `q == 0` antes de calcular o inverso |
| Inverso em ponto flutuante (`1.0 / q`) | `49 × (1.0 / 49)` vale `0,9999999999999999`: o truncamento dá 0 em vez de 1 | Ficar nos inteiros, com um inverso arredondado para cima |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Dividir por `q` é multiplicar pelo inverso `2^32 / q` arredondado para cima e depois descartar os 32 bits de menor peso. É exato enquanto `d × e < 2^32` (onde `e < q` é o erro de arredondamento): para `q <= 128`, todo `d < 2^25`. Calcular o inverso custa uma divisão, paga uma única vez. |
| **Ferramentas utilizáveis** | O compilador (divisor constante: automático), `objdump -d` para verificar que uma instrução `div` desapareceu, a biblioteca [libdivide](https://libdivide.com/) para uma zona mais ampla, um laço de força bruta para verificar uma zona, `clock_gettime` para cronometrar. |
| **Armadilhas a evitar** | Um produto calculado em 32 bits, um `d` ou um `q` fora da zona (resultado errado sem mensagem), números negativos, um divisor nulo, um inverso em ponto flutuante, um divisor que muda a cada chamada (nada se ganha), e concluir a partir de um microteste sem medir o programa inteiro. |
| **Boas práticas** | Deixar o compilador fazer quando o divisor é conhecido na compilação; escrever à mão apenas para um divisor fixado na execução e reutilizado milhões de vezes; provar ou verificar a zona de exatidão; comparar as duas versões sobre o mesmo trabalho antes de cronometrar; cronometrar o programa completo. |
