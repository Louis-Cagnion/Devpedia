---
order: 4
---

# O operador vírgula

O operador vírgula avalia **duas expressões em ordem**, e só mantém o valor da **segunda**: a primeira está ali apenas pelo seu efeito colateral (uma mudança que ela produz de passagem, como incrementar uma variável), seu próprio valor é descartado.

```c
int a = (1, 2);   // avalia 1 (descartado), depois 2: a vale 2
```

## Caso de uso: várias variáveis em um laço `for`

O operador vírgula aparece com mais frequência em um laço [`for`](/?c=langages-de-programmation&s=c&p=boucles), para avançar **duas** variáveis a cada volta em vez de apenas uma:

```c
for (int i = 0, j = 10; i < j; i++, j--) {
    printf("i = %d, j = %d\n", i, j);
}
```

- `i = 0, j = 10` inicializa as duas variáveis uma depois da outra.
- `i++, j--` incrementa `i` E decrementa `j` a cada volta, em uma única das três partes do `for`.

Sem o operador vírgula, cada uma das três partes do `for` só pode conter uma única expressão: não há como escrever ali diretamente duas instruções separadas por ponto e vírgula.

## Armadilha: não confundir com a vírgula-separador

O mesmo caractere `,` tem um papel completamente diferente em outros dois contextos muito frequentes, que **não têm nada a ver** com o operador vírgula:

| Contexto | Papel da vírgula | Exemplo |
|---|---|---|
| Operador vírgula | Avalia os dois lados, mantém o valor do segundo | `(x++, y++)` |
| Separador de argumentos | Separa os argumentos de uma chamada de função | `printf("%d %d", a, b)` |
| Separador de declarações | Separa várias variáveis declaradas juntas | `int a, b, c;` |

> **Armadilha:** em `printf(a, b)`, a vírgula só separa dois argumentos: `b` não é "o valor que é mantido" como faria o operador vírgula, os dois valores são passados à função separadamente. O compilador distingue os dois usos pela **posição** (entre os parênteses de uma chamada, ou em uma declaração, versus no meio de uma expressão), não por um símbolo diferente.

## O idioma `return printf(...), NULL;`

```c
char *buscar_ou_mostrar_erro(char *chave)
{
    char *resultado = buscar(chave);
    if (resultado != NULL) {
        return resultado;
    }
    return printf("Erro: chave não encontrada\n"), NULL;
}
```

`printf(...)` executa pelo seu efeito colateral (exibir a mensagem), depois o operador vírgula descarta seu valor de retorno e o substitui por `NULL`: a função sempre retorna `NULL` nesse caso, seja o que for que `printf()` tenha retornado. Uma única expressão faz ao mesmo tempo a impressão e o `return`, sem variável intermediária.

> **Boa prática:** esse idioma continua raro e se lê pior que uma versão em duas linhas (`printf(...); return NULL;`). Reservar o operador vírgula para o laço `for` com várias variáveis, onde ele é idiomático e amplamente reconhecido; evitá-lo em qualquer outro caso, em favor da legibilidade.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O operador vírgula (`expr1, expr2`) avalia as duas expressões em ordem e só mantém o valor da segunda. O mesmo caractere `,` também separa os argumentos de uma chamada ou as variáveis de uma declaração: dois papéis distintos, nunca o operador vírgula nesses casos. |
| **Ferramentas utilizáveis** | `expr1, expr2` para combinar duas instruções em uma única expressão, tipicamente `i++, j--` em um `for`. |
| **Armadilhas a evitar** | Confundir o operador vírgula com a vírgula que separa argumentos (`printf(a, b)`) ou declarações (`int a, b;`): são dois usos sintáticos distintos do mesmo caractere. |
| **Boas práticas** | Reservar o operador vírgula para laços `for` com várias variáveis; preferir duas instruções separadas em qualquer outro caso, pela legibilidade. |
