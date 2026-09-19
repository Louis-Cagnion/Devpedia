---
order: 14
---

# As funções variádicas (va_list)

Uma função **variádica** aceita um número variável de argumentos: `printf("%d %s\n", 42, "texto")` é o exemplo mais conhecido: `printf` aceita 1, 2, ou 10 argumentos conforme o formato fornecido. Em C, esse mecanismo é possível graças às macros de `<stdarg.h>`.

## Declarar uma função variádica

Uma função variádica sempre tem pelo menos um parâmetro fixo, seguido de `...`:

```c
#include <stdarg.h>

int soma(int numero, ...)
{
    va_list argumentos;
    va_start(argumentos, numero); // "número" e o último parametro fixo, logo antes dos "..."

    int total = 0;
    for (int i = 0; i < numero; i++) {
        total += va_arg(argumentos, int); // recupera o próximo argumento, tratando-o como int
    }

    va_end(argumentos);
    return total;
}

soma(3, 10, 20, 30); // 60 -> número = 3, os 3 argumentos seguintes são somados
```

## As macros de `<stdarg.h>`

| Macro | Função |
|---|---|
| `va_list` | Tipo que representa a lista dos argumentos variáveis |
| `va_start(lista, ultimoParamFixo)` | Inicializa a lista, a partir do último parâmetro fixo conhecido |
| `va_arg(lista, tipo)` | Recupera o próximo argumento, supondo que ele é do `tipo` indicado |
| `va_end(lista)` | Encerra corretamente o uso da lista |

> **Nota:** nada permite ao compilador verificar que o `tipo` passado a `va_arg()` corresponde realmente ao tipo do argumento fornecido pelo chamador: isso é inteiramente responsabilidade do desenvolvedor. Passar o tipo errado (ex.: ler um `int` onde um `double` foi fornecido) é comportamento indefinido, não detectado na compilação.

## Como o `printf` sabe o número de argumentos?

`printf` não tem **nenhum meio nativo** de saber quantos argumentos variáveis foram fornecidos: é a própria string de formato que serve de guia, contando o número de `%` que ela contém.

```c
// a string anuncia 3 valores -> printf le 3 argumentos variadicos
printf("%d %d %d\n", 1, 2, 3);
```

> **Nota:** é por isso que um número errado de `%` em relação aos argumentos reais (ou o inverso) não provoca **nenhum erro de compilação**: apenas um comportamento indefinido em tempo de execução (leitura de dados que não são argumentos reais). É uma fonte clássica de falhas de segurança ("format string vulnerability") quando uma string de formato vem diretamente de uma entrada de usuário não controlada.

## A minilinguagem do formato `printf`

Cada `%` introduz uma sintaxe precisa que precisa ser reanalisada caractere por caractere, bem mais rica que uma simples letra de conversão:

```text
%[flags][largura][.precisao]conversao
```

```c
printf("%-10d|\n", 42);     // "42        |" -> '-': justificado a ESQUERDA (padrão: a direita)
printf("%010d\n", 42);      // "0000000042"  -> '0': preenche com zeros em vez de espaços
printf("%#x\n", 255);       // "0xff"        -> '#': forma alternativa (prefixo 0x/0X para x/X)
printf("%+d\n", 42);        // "+42"         -> '+': forca a exibição do sinal, mesmo positivo

// "        42" -> largura Mínima: preenchida com espaços se necessário
printf("%10d\n", 42);
// "005"        -> precisão sobre um inteiro: número mínimo de digitos
printf("%.3d\n", 5);

// equivalente a "%10d" -> '*': a largura e lida a partir dos argumentos, não escrita direto
printf("%*d\n", 10, 42);
```

| Elemento | Papel |
|---|---|
| Flags (`-`, `0`, `#`, `+`, espaço) | Mudam o alinhamento, o preenchimento ou a apresentação, combináveis entre si |
| Largura (número ou `*`) | Número mínimo de caracteres exibidos (preenchido com espaços ou zeros) |
| Precisão (`.` seguido de um número) | Número mínimo de dígitos para um inteiro, comprimento máximo para uma string (`%s`) |
| Conversão (`d`/`i`/`u`/`x`/`X`/`s`/`c`/`p`/`%`) | O tipo de valor a exibir |

> **Nota:** essa minilinguagem explica por que reimplementar o `printf` (como no projeto `ft_printf`) exige um analisador de verdade: após cada `%` encontrado, é preciso reconhecer em ordem os flags presentes, uma largura opcional, uma precisão opcional, e então a letra de conversão que fecha a sequência -- cada um desses elementos é opcional, exceto a conversão final.

## Um limite: o número de argumentos precisa ser comunicado de outra forma

Ao contrário de `printf` (guiado pela string de formato), o exemplo `soma()` acima precisa receber explicitamente o número de argumentos no primeiro parâmetro (`numero`): `va_list` não permite saber sozinho "quantos argumentos restam", é sempre necessário um meio externo de comunicá-lo (um contador, um valor sentinela como `NULL` no último argumento, ou uma string de formato).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função variádica (`...`) aceita um número variável de argumentos, lidos via as macros de `<stdarg.h>` (`va_list`, `va_start`, `va_arg`, `va_end`). O número de argumentos sempre precisa ser comunicado por um meio externo. |
| **Ferramentas utilizáveis** | `va_list`, `va_start`, `va_arg`, `va_end`; sintaxe de formato `printf` `%[flags][largura][.precisao]conversao`. |
| **Armadilhas a evitar** | Passar a `va_arg()` um tipo diferente do realmente fornecido pelo chamador: comportamento indefinido, não detectado na compilação. |
| **Boas práticas** | Nunca construir uma string de formato a partir de uma entrada de usuário não controlada: fonte clássica de falha ("format string vulnerability"). |
