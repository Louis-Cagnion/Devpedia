---
order: 16
---

# Os operadores binários

Os operadores binários (ou "bit a bit") trabalham diretamente sobre a representação binária dos inteiros, bit a bit. Em C, eles são usados todo dia sem que se pense nisso: as flags passadas às chamadas de sistema, as permissões de arquivo, ou até a otimização de cálculos simples se apoiam neles.

## Os seis operadores

| Operador | Nome | Efeito em cada bit |
|---|---|---|
| `&` | E (AND) | 1 se os **dois** bits forem 1 |
| `\|` | OU (OR) | 1 se **pelo menos um** bit for 1 |
| `^` | OU exclusivo (XOR) | 1 se os bits forem **diferentes** |
| `~` | NÃO (NOT) | inverte cada bit |
| `<<` | deslocamento à esquerda | desloca os bits para a esquerda |
| `>>` | deslocamento à direita | desloca os bits para a direita |

```c
unsigned char a = 12;  // 0000 1100
unsigned char b = 10;  // 0000 1010

a & b  // 0000 1000 = 8   -> bits presentes nos dois
a | b  // 0000 1110 = 14  -> bits presentes em um ou outro
a ^ b  // 0000 0110 = 6   -> bits presentes em apenas um dos dois
~a     // 1111 0011 = 243 (em unsigned char)
```

> Não confundir `&` com `&&`, nem `|` com `||`. As versões duplas são os operadores **lógicos**: trabalham com valores verdadeiro/falso e retornam 0 ou 1. `1 & 2` vale `0` (nenhum bit em comum), enquanto `1 && 2` vale `1` (os dois valores são verdadeiros). Essa confusão é uma fonte de bugs silenciosos.

## Os deslocamentos

Deslocar para a esquerda em `n` posições equivale a **multiplicar por 2ⁿ**, deslocar para a direita a **dividir por 2ⁿ** (divisão inteira):

```c
unsigned char x = 5;    // 0000 0101

x << 1  // 0000 1010 = 10   (5 * 2)
x << 3  // 0010 1000 = 40   (5 * 8)
x >> 1  // 0000 0010 = 2    (5 / 2, arredondado para baixo)
```

Os bits que saem da largura do tipo são **perdidos**; não é um erro, não há nenhum aviso:

```c
unsigned char y = 200;  // 1100 1000
y << 1                  // 1001 0000 = 144, e nao 400: um bit caiu
```

**Duas armadilhas a conhecer:**

- Deslocar por um número maior ou igual à largura do tipo é um **comportamento indefinido** (`x << 32` em um `int` de 32 bits): o resultado não é garantido, mesmo que "pareça funcionar".
- `>>` em um inteiro **assinado negativo** depende da implementação (o bit de sinal pode ser propagado ou não). Para manipular bits, use sistematicamente tipos **sem sinal** (`unsigned int`, `uint32_t`).

## As máscaras: a real utilidade no dia a dia

Uma **máscara** é um valor usado para atingir bits precisos. As quatro operações básicas:

```c
#define FLAG_LEITURA   (1u << 0)  // 0000 0001
#define FLAG_ESCRITA   (1u << 1)  // 0000 0010
#define FLAG_ANEXAR    (1u << 2)  // 0000 0100

unsigned int opcoes = 0;

opcoes |= FLAG_LEITURA;                 // ATIVAR   um bit
opcoes |= FLAG_ESCRITA;

if (opcoes & FLAG_ESCRITA) { ... }      // TESTAR   um bit

opcoes &= ~FLAG_ESCRITA;  // DESATIVAR um bit
opcoes ^= FLAG_ANEXAR;    // ALTERNAR um bit
```

É exatamente o mecanismo das chamadas de sistema: `open("f.txt", O_WRONLY | O_CREAT)` combina flags com `|`, e a função depois as testa com `&`. Veja o capítulo [Chamadas de sistema e descritores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs).

As permissões de arquivo Unix seguem a mesma lógica em base 8: `0644` codifica três grupos de três bits (leitura/escrita/execução para o dono, o grupo, os outros). Veja também o capítulo [Permissões e arquivos](/?c=shells&s=bash&p=permissions-et-fichiers) de [Bash](/?c=shells&s=bash&p=bash).

**Por que flags em vez de booleanos separados?** Um único `unsigned int` armazena 32 opções independentes, se passa em um único argumento, e se testa em uma única instrução de processador.

## Idiomas comuns

```c
// Paridade: o bit menos significativo vale 1 para um numero impar
if (n & 1) { /* n e impar */ }

// Potencia de 2: apenas um bit em 1, entao n & (n-1) == 0
int e_potencia_de_2(unsigned int n) {
    return n != 0 && (n & (n - 1)) == 0;
}

// Contar os bits em 1 (algoritmo de Kernighan)
int contar_bits(unsigned int n) {
    int total = 0;
    while (n) {
        n &= n - 1;      // apaga o bit em 1 mais a direita
        total++;
    }
    return total;
}

// Trocar dois inteiros sem variavel temporaria (curiosidade, nao usar)
a ^= b; b ^= a; a ^= b;
```

Os dois primeiros são úteis na prática (a contagem de bits é o [algoritmo de Kernighan](https://en.wikipedia.org/wiki/Hamming_weight#Language_support)). O último ilustra uma propriedade do XOR (`x ^ x == 0`, `x ^ 0 == x`) mas deve ser evitado em código real: é ilegível, mais lento que uma variável temporária em um processador moderno, e **errado se as duas variáveis forem a mesma** (`a` e `a` virariam 0).

## `n & 1` em vez de `n % 2`?

Historicamente, `n & 1` era mais rápido que `n % 2`, e `n << 1` mais rápido que `n * 2`. **Isso não é mais um argumento válido**: qualquer compilador moderno faz essas substituições sozinho quando são corretas.

Escreva então o que expressa sua intenção: `n % 2 == 0` se você fala de paridade, `n & MASCARA` se você fala de bits. A legibilidade ganha e o desempenho é idêntico.

> Atenção mesmo assim: `n % 2` e `n & 1` **não** são equivalentes para um `n` negativo em C (`-3 % 2` vale `-1`). É mais uma razão para reservar as operações binárias aos tipos sem sinal.

## Resumo

| Objetivo | Escrita |
|---|---|
| Ativar um bit | `x \|= MASCARA` |
| Desativar um bit | `x &= ~MASCARA` |
| Alternar um bit | `x ^= MASCARA` |
| Testar um bit | `if (x & MASCARA)` |
| Criar uma máscara para o bit *n* | `1u << n` |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Os operadores binários (`&`, `\|`, `^`, `~`, `<<`, `>>`) trabalham bit a bit, usados para flags, permissões e máscaras. Não confundir com `&&`/`\|\|` (lógicos). |
| **Ferramentas utilizáveis** | Máscaras (`\|=` ativa, `&= ~` desativa, `^=` alterna, `&` testa um bit). |
| **Armadilhas a evitar** | Deslocar por um número de bits ≥ a largura do tipo (comportamento indefinido); usar `>>` em um assinado negativo (depende da implementação). |
| **Boas práticas** | Reservar as operações binárias aos tipos sem sinal; escrever `n % 2`/`n * 2` em vez de `n & 1`/`n << 1` pela legibilidade: um compilador moderno já otimiza a equivalência. |
