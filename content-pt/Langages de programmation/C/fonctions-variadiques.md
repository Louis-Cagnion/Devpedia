---
order: 10
---

# Funções variádicas (va_list)

Uma função **variádica** aceita um número variável de argumentos — `printf("%d %s\n", 42, "texto")` é o exemplo mais conhecido: `printf` aceita 1, 2 ou 10 argumentos, consoante o formato fornecido. Em C, este mecanismo é possibilitado pelas macros de `<stdarg.h>`.

## Declarar uma função variádica

Uma função variádica tem sempre, pelo menos, um parâmetro fixo, seguido de um`...`:

```c
#include <stdarg.h>

int somme(int número, ...)
{
    va_list arguments;
    va_start(arguments, número); // "número" est le dernier paramètre fixe, juste avant les "..."

    int total = 0;
    for (int i = 0; i < número; i++) {
        total += va_arg(arguments, int); // récupère l'argument suivant, en le traitant comme un int
    }

    va_end(arguments);
    return total;
}

somme(3, 10, 20, 30); // 60 -> número = 3, les 3 arguments suivants sont additionnés
```

## As macros do «`<stdarg.h>`»

| Macro | Função |
|---|---|
| `va_list` | Tipo que representa a lista de argumentos variáveis |
| `va_start(lista, dernierParamFixe)` | Inicializa a lista a partir do último parâmetro fixo conhecido |
| `va_arg(lista, type)` | Recupera o argumento seguinte, partindo do princípio de que se trata do `type` indicado |
| `va_end(lista)` | Encerra corretamente a utilização da lista |

> **Nota:** nada permite ao compilador verificar se o `type` passado para `va_arg()` corresponde efetivamente ao tipo do argumento fornecido pelo chamador — isso é da inteira responsabilidade do programador. Passar o tipo errado (por exemplo, ler um `int` quando foi fornecido um `double`) constitui um comportamento indefinido, não detetado na compilação.

## Como é que a função `printf` sabe o número de argumentos?

`printf` não dispõe de **qualquer forma nativa** de saber quantos argumentos variáveis foram fornecidos: é a própria cadeia de formato que serve de orientação, contando o número de «`%`» que contém.

```c
printf("%d %d %d\n", 1, 2, 3); // la chaîne annonce 3 valeurs -> printf lit 3 arguments variadiques
```

> **Nota:** é por isso que um número incorreto de `%` em relação aos argumentos reais (ou o contrário) não provoca **qualquer erro de compilação** — apenas um comportamento indefinido na execução (leitura de dados que não são argumentos reais). Esta é uma fonte clássica de falhas de segurança («format string vulnerability») quando uma cadeia de formato provém diretamente de uma entrada do utilizador não controlada.

## Uma restrição: o número de argumentos deve ser indicado de outra forma

Ao contrário de `printf` (orientado pela cadeia de formato), o exemplo `somme()` acima deve receber explicitamente o número de argumentos como primeiro parâmetro (`número`) — `va_list` não permite saber «quantos argumentos faltam» por si só, é sempre necessário um meio externo para comunicar essa informação (um contador, um valor sentinela como `NULL` no último argumento, ou uma cadeia de formato).
