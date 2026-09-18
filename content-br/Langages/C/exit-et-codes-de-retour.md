---
order: 5
---

# `exit()` e os códigos de retorno

Um programa em C sempre termina com um **código de retorno**: um inteiro que informa ao processo que o chamou (geralmente o shell) se o programa foi executado com sucesso. Esse código já apareceu de passagem em [A gestão de processos](/?c=langages-de-programmation&s=c&p=processus): `WEXITSTATUS(status)` o extrai depois de um `wait()`.

## `return` em `main`: o caso mais comum

```c
int main(void)
{
    // ... processamento ...
    return 0;   // o programa termina aqui, codigo de retorno 0
}
```

Em `main` (e somente em `main`), `return valor;` termina o programa inteiro e fixa seu código de retorno em `valor`: não é um simples retorno de função como no resto do código.

## `exit(code)`: terminar de qualquer lugar

```c
#include <stdlib.h>

void verificar_configuracao(Config *config)
{
    if (config == NULL) {
        fprintf(stderr, "Erro: configuracao ausente\n");
        exit(1);   // termina o programa imediatamente, mesmo fora de main
    }
}
```

`exit(code)` termina o programa **imediatamente**, seja qual for a função em que é chamado: não é preciso fazer um erro subir por uma cadeia de `return` até `main` para parar o programa.

| | `return` em `main` | `exit(code)` |
|---|---|---|
| Onde chamar | Só em `main` | Qualquer função |
| Efeito | Termina `main`, e portanto o programa | Termina o programa diretamente |
| Código de retorno | O valor retornado | `code` |

## A convenção: 0 = sucesso, diferente de zero = erro

```c
#include <stdlib.h>

exit(EXIT_SUCCESS);   // equivalente a exit(0)
exit(EXIT_FAILURE);   // equivalente a exit(1)
```

`EXIT_SUCCESS` e `EXIT_FAILURE` (definidas em `<stdlib.h>`) valem `0` e `1` respectivamente: usá-las em vez dos números diretos deixa a intenção explícita na leitura do código, sem mudar o comportamento.

Esse código de retorno pode depois ser consultado a partir do shell que lançou o programa via [`$?`](/?c=shells&s=bash&p=scripts-et-shebang#codigos-de-saida-exit): `0` indica sucesso, qualquer outro valor indica algum tipo de falha (o significado exato dos valores diferentes de zero depende de cada programa).

> **Armadilha:** esquecer de retornar um código diferente de zero em caso de erro (`return 0;`, ou nenhum `return` explícito, que conta como `0` por convenção quando `main` chega ao seu fim normal). Um script que encadeia comandos com `&&` ou verifica `$?` vai então achar que o programa teve sucesso, mesmo que na verdade tenha falhado.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `return valor;` em `main` termina o programa e fixa seu código de retorno. `exit(code)` faz o mesmo a partir de qualquer função. Por convenção, `0` indica sucesso, qualquer outro valor uma falha. |
| **Ferramentas utilizáveis** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`). |
| **Armadilhas a evitar** | Retornar `0` por padrão sem verificar que nada deu errado: um script que checa `$?` vai então acreditar em um sucesso que nunca aconteceu. |
| **Boas práticas** | Usar `EXIT_SUCCESS`/`EXIT_FAILURE` em vez de `0`/`1` diretos para deixar a intenção explícita; sempre retornar um código diferente de zero assim que um erro impedir o programa de fazer o que se esperava dele. |
