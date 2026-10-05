---
order: 28
---

# Converter um texto em número sem a armadilha do `atoi`

Um número que vem de fora (argumento da [linha de comando](/?c=langages-de-programmation&s=c&p=argc-et-argv), arquivo, entrada do usuário) chega sempre como **texto**: é preciso convertê-lo. `atoi()` e `atof()`, apresentadas em [Converter uma string em número](/?c=langages-de-programmation&s=c&p=variables#converter-uma-string-em-numero-atof-atoi), fazem isso, mas não detectam nenhum erro. Este capítulo mostra como validar a conversão com `strtol()` e `strtod()`.

## O que o `atoi()` deixa passar

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    printf("%d\n", atoi("abc"));          // 0: texto inválido, nenhum sinal
    printf("%d\n", atoi("12abc"));        // 12: o texto sobrando é ignorado
    printf("%d\n", atoi("4294967297"));   // 1: grande demais para um int, nenhum sinal
    return 0;
}
```

| Entrada | `atoi()` devolve | O que deveria acontecer |
|---|---|---|
| `"abc"` | `0` | Recusa: não é um número. |
| `"12abc"` | `12` | Recusa: há texto depois do número. |
| `"4294967297"` | `1` | Recusa: o valor estoura (2^32 + 1 volta a `1` em 32 bits). |
| `"0"` | `0` | Aceito. Impossível distingui-lo de `"abc"`. |

## `strtol()`: devolver o número **e** o ponto onde a leitura parou

```c
long strtol(const char *texto, char **resto, int base);
double strtod(const char *texto, char **resto);
```

| Parâmetro ou retorno | Conteúdo |
|---|---|
| `texto` | O texto a converter. |
| `resto` | Endereço de um ponteiro que a função preenche: ele designa o **primeiro caractere não lido**. |
| `base` | `10` para decimal, `16` para hexadecimal, `0` para detectar `0x…` e `0…`. |
| Retorno | O valor lido (`0` se nada pôde ser lido). |

```
texto  ->  "12abc"
            ^ ^
            | resto (primeiro caractere não lido: 'a')
            texto
```

O ponteiro `resto` permite três constatações que o `atoi()` nunca dá:

| Constatação | Teste |
|---|---|
| Nenhum dígito lido | `resto == texto` |
| Texto sobrando depois do número | `*resto != '\0'` |
| Texto vazio | `*texto == '\0'` (coberto pelo primeiro teste) |

## Os estouros: `errno` e `ERANGE`

Quando o valor não cabe em um `long`, `strtol()` devolve `LONG_MAX` ou `LONG_MIN` e coloca [`errno`](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#sinalizar-um-erro-errno) em `ERANGE`. Como as funções que têm sucesso nunca zeram `errno`, você **o zera por conta própria antes da chamada**; do contrário, um erro antigo seria tomado pelo novo.

## Uma função de conversão completa

```c
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* Converte texto em inteiro em [min, max]. Devolve 0 se válido, -1 caso contrário. */
int parse_long(const char *texto, long min, long max, long *resultado)
{
    char *resto;
    long valor;

    errno = 0;                                     // zerado antes da chamada
    valor = strtol(texto, &resto, 10);
    if (resto == texto)                            // nenhum dígito lido (texto vazio incluído)
        return (fprintf(stderr, "\"%s\": nenhum dígito\n", texto), -1);
    if (*resto != '\0')                            // sobra texto depois do número
        return (fprintf(stderr, "\"%s\": texto sobrando \"%s\"\n", texto, resto), -1);
    if (errno == ERANGE)                           // não cabe em um long
        return (fprintf(stderr, "\"%s\": fora da faixa de um long\n", texto), -1);
    if (valor < min || valor > max)                // fora do domínio do programa
        return (fprintf(stderr, "\"%s\": fora de [%ld, %ld]\n", texto, min, max), -1);
    *resultado = valor;
    return (0);
}
```

Cada causa de falha tem **sua própria mensagem**, que nomeia o texto errado: o usuário sabe o que corrigir.

Resultado com algumas entradas, para uma faixa de 0 a 100:

| Entrada | Resultado |
|---|---|
| `"42"` | `42` |
| `"abc"` | `nenhum dígito` |
| `"12abc"` | `texto sobrando "abc"` |
| `"4294967297"` | `fora de [0, 100]` (cabe em um `long` de 64 bits, mas não no domínio) |
| `"99999999999999999999"` | `fora da faixa de um long` |
| `""` | `nenhum dígito` |
| `"-3"` | `fora de [0, 100]` |

## Os números decimais: `strtod()`, `NaN` e `inf`

`strtod()` segue o mesmo esquema, com mais duas armadilhas.

```c
/* Converte texto em double finito em [min, max]. Devolve 0 se válido, -1 caso contrário. */
int parse_double(const char *texto, double min, double max, double *resultado)
{
    char *resto;
    double valor;

    errno = 0;
    valor = strtod(texto, &resto);
    if (resto == texto)
        return (fprintf(stderr, "\"%s\": nenhum número\n", texto), -1);
    if (*resto != '\0')
        return (fprintf(stderr, "\"%s\": texto sobrando \"%s\"\n", texto, resto), -1);
    if (errno == ERANGE || !isfinite(valor))       // 1e999 -> inf; "nan" e "inf" são aceitos
        return (fprintf(stderr, "\"%s\": valor não finito ou fora da faixa\n", texto), -1);
    if (valor < min || valor > max)
        return (fprintf(stderr, "\"%s\": fora de [%g, %g]\n", texto, min, max), -1);
    *resultado = valor;
    return (0);
}
```

| Armadilha | Explicação |
|---|---|
| `"nan"` e `"inf"` | `strtod()` os aceita como números válidos. Um `NaN` passa depois por **todas as comparações sem erro** (`NaN < 0` e `NaN > 1` são falsas), então o teste de faixa não o vê: `isfinite()` (`<math.h>`) é indispensável. |
| `"1e999"` | Estoura para `inf`: `errno` vale `ERANGE`. |
| `"0,5"` | Com a localidade padrão do programa (`"C"`), a vírgula não é separador decimal: `strtod()` lê `0` e `resto` designa `",5"`, que o teste `*resto != '\0'` detecta. |
| Valor para um `float` | Um `double` finito pode ultrapassar um `float` (`1e39`): limitar à faixa real do tipo de destino. |

## Limitar cada valor ao seu domínio

O tipo não diz o que o programa aceita. Uma transparência vai de `0` a `1`, um número de threads de `1` a algumas dezenas, o tamanho de um array não pode ser negativo: a faixa `[min, max]` passada à função verifica isso na própria conversão, com uma mensagem específica, em vez de deixar um valor absurdo se propagar pelo programa.

Outros comportamentos a conhecer:

| Comportamento | Consequência |
|---|---|
| `strtol()` pula os espaços **no início** (`"  7"` dá `7`) | Aceito. Para recusá-lo, testar `isspace(*texto)` antes da chamada. |
| `strtol()` aceita um sinal `+` ou `-` | `"-3"` é válido: só a faixa o recusa. |
| Base `0` | `"010"` vale `8` (octal) e `"0x1F"` vale `31`: evitar com uma entrada do usuário. |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `atoi()`/`atof()` devolvem `0` para um texto inválido, ignoram o texto sobrando e estouram sem avisar. `strtol()`/`strtod()` entregam um ponteiro `resto` para o primeiro caractere não lido e colocam `errno` em `ERANGE` em caso de estouro. |
| **Ferramentas utilizáveis** | `strtol()`, `strtod()` (`<stdlib.h>`), `errno` e `ERANGE` (`<errno.h>`), `isfinite()` (`<math.h>`). |
| **Armadilhas a evitar** | Esquecer `errno = 0` antes da chamada. Não testar `resto == texto` (texto vazio ou sem dígito) nem `*resto != '\0'` (texto sobrando). Aceitar `NaN` e `inf`: passam por todos os testes de faixa. Converter com `atoi()` um dado vindo de fora. |
| **Boas práticas** | Isolar a conversão em uma única função que devolve um status e recebe a faixa do domínio como parâmetros. Uma mensagem de erro por causa, nomeando o texto errado. Recusar o valor em vez de corrigi-lo em silêncio. |
