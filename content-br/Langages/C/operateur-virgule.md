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

## Armadilha: a ordem de avaliação dos argumentos não é especificada

Ao contrário do operador vírgula, que garante "primeiro o lado esquerdo, depois o direito", a vírgula que separa os argumentos de uma chamada **não garante nenhuma ordem**: a linguagem C deixa o compilador avaliar os argumentos na ordem que lhe convier (diz-se que a ordem é **não especificada**). Nenhum erro nem aviso é emitido, e o resultado pode mudar de um compilador ou opção para outro.

```c
#include <stdio.h>

static int somar_dez(int *n)
{
    *n += 10;       // modifica a variável do chamador (efeito colateral)
    return *n;      // devolve o novo valor
}

int main(void)
{
    int x = 1;

    // x é lido e x é modificado na mesma chamada: a ordem decide o resultado
    printf("%d %d\n", somar_dez(&x), x);
    return 0;
}
```

| Ordem escolhida pelo compilador | Saída |
|---|---|
| Da esquerda para a direita: primeiro `somar_dez(&x)`, depois a leitura de `x` | `11 11` |
| Da direita para a esquerda: primeiro a leitura de `x`, depois `somar_dez(&x)` | `11 1` |

Com o gcc em x86-64, este programa exibe `11 1` (da direita para a esquerda), tanto em `-O0` quanto em `-O2`, mas outro compilador é livre para exibir `11 11`. Um teste que passa na máquina de desenvolvimento, portanto, não prova nada sobre as outras.

A regra geral: uma mesma variável nunca deve ser **modificada** e **lida** (ou modificada duas vezes) em uma mesma expressão sem que a linguagem imponha uma ordem entre as duas operações. Os lugares onde a ordem é garantida chamam-se **pontos de sequência**: o operador vírgula é um, assim como `&&`, `||`, `?:` e o fim de uma instrução terminada por `;`.

| Escrita | Situação | Por quê |
|---|---|---|
| `f(g(&x), x)` | Ordem não especificada | Os argumentos não têm ordem entre si |
| `t[i++] = i;` | **Comportamento indefinido** | `i` é modificado e lido sem ponto de sequência entre as duas operações: o programa pode fazer qualquer coisa (o gcc avisa com `-Wall`) |
| `(a = f(), b = g())` | Ordem garantida | O operador vírgula impõe esquerda e depois direita |

> **Boa prática:** calcular primeiro em uma variável e depois passar a variável. Uma instrução por efeito colateral torna a ordem explícita e o resultado idêntico em qualquer lugar.

```c
int resultado = somar_dez(&x);       // 1ª instrução: o efeito colateral
printf("%d %d\n", resultado, x);     // 2ª instrução: x já está modificado, sempre "11 11"
```

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
| **Para lembrar** | O operador vírgula (`expr1, expr2`) avalia as duas expressões em ordem e só mantém o valor da segunda. O mesmo caractere `,` também separa os argumentos de uma chamada ou as variáveis de uma declaração: dois papéis distintos, nunca o operador vírgula nesses casos. Só o operador vírgula garante uma ordem: os argumentos de uma chamada são avaliados em uma ordem não especificada. |
| **Ferramentas utilizáveis** | `expr1, expr2` para combinar duas instruções em uma única expressão, tipicamente `i++, j--` em um `for`. |
| **Armadilhas a evitar** | Confundir o operador vírgula com a vírgula que separa argumentos (`printf(a, b)`) ou declarações (`int a, b;`): são dois usos sintáticos distintos do mesmo caractere. Ler e modificar a mesma variável entre os argumentos de uma mesma chamada (`f(g(&x), x)`): o resultado depende do compilador. |
| **Boas práticas** | Reservar o operador vírgula para laços `for` com várias variáveis; preferir duas instruções separadas em qualquer outro caso, pela legibilidade. Calcular em uma variável antes da chamada assim que um argumento tiver um efeito colateral. |
