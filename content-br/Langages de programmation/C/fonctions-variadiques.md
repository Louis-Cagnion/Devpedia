---
order: 11
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
    va_start(argumentos, numero); // "numero" e o ultimo parametro fixo, logo antes dos "..."

    int total = 0;
    for (int i = 0; i < numero; i++) {
        total += va_arg(argumentos, int); // recupera o proximo argumento, tratando-o como int
    }

    va_end(argumentos);
    return total;
}

soma(3, 10, 20, 30); // 60 -> numero = 3, os 3 argumentos seguintes sao somados
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
printf("%d %d %d\n", 1, 2, 3); // a string anuncia 3 valores -> printf le 3 argumentos variadicos
```

> **Nota:** é por isso que um número errado de `%` em relação aos argumentos reais (ou o inverso) não provoca **nenhum erro de compilação**: apenas um comportamento indefinido em tempo de execução (leitura de dados que não são argumentos reais). É uma fonte clássica de falhas de segurança ("format string vulnerability") quando uma string de formato vem diretamente de uma entrada de usuário não controlada.

## Um limite: o número de argumentos precisa ser comunicado de outra forma

Ao contrário de `printf` (guiado pela string de formato), o exemplo `soma()` acima precisa receber explicitamente o número de argumentos no primeiro parâmetro (`numero`): `va_list` não permite saber sozinho "quantos argumentos restam", é sempre necessário um meio externo de comunicá-lo (um contador, um valor sentinela como `NULL` no último argumento, ou uma string de formato).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função variádica (`...`) aceita um número variável de argumentos, lidos via as macros de `<stdarg.h>` (`va_list`, `va_start`, `va_arg`, `va_end`). O número de argumentos sempre precisa ser comunicado por um meio externo. |
| **Ferramentas utilizáveis** | `va_list`, `va_start`, `va_arg`, `va_end`. |
| **Armadilhas a evitar** | Passar a `va_arg()` um tipo diferente do realmente fornecido pelo chamador: comportamento indefinido, não detectado na compilação. |
| **Boas práticas** | Nunca construir uma string de formato a partir de uma entrada de usuário não controlada: fonte clássica de falha ("format string vulnerability"). |
