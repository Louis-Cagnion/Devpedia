---
order: 3
---

# Os laços

Os laços permitem repetir um bloco de código várias vezes. Em C, dispõe-se de três estruturas: `while`, `do while` e `for`: não existe `foreach` nativo, um array sempre se percorre via um índice ou um ponteiro.

## O laço `while`

A condição é testada **antes** de cada volta:

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## O laço `do while`

Variante em que a condição é testada **depois** de cada volta: o bloco então sempre executa pelo menos uma vez, mesmo que a condição seja falsa desde o início:

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## O laço `for`

Agrupa em uma única linha a inicialização, a condição, e o incremento, prático assim que o número de iterações é conhecido antecipadamente:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

As três partes são independentes e opcionais (`for (;;)` é um laço infinito válido), mas o uso clássico continua sendo `for (inicializacao; condicao; incremento)`.

## Percorrer um array (sem `foreach`)

```c
int array[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", array[i]);
}
```

> **Nota:** ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), não existe **nenhum jeito nativo** de saber o tamanho de um array apenas a partir do ponteiro: `array[5]` "sabe" quanto contém enquanto for manipulado como array estático, mas essa informação desaparece assim que é passado a uma função (ele então se comporta como um simples ponteiro, veja [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs)). O tamanho então precisa ser transmitido separadamente.

```c
void exibir(int *array, int tamanho) // o tamanho precisa ser passado explicitamente
{
    for (int i = 0; i < tamanho; i++) {
        printf("%d\n", array[i]);
    }
}
```

## `break` e `continue`

- `break;` para completamente o laço que o envolve.
- `continue;` passa diretamente para a próxima volta, sem executar o resto do corpo do laço atual.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // para o laço assim que i vale 5
    }
    if (i % 2 == 0) {
        continue; // ignora os números pares
    }
    printf("%d\n", i);
}
```

## Laços aninhados e `break`

`break` só para o laço **mais próximo** que o envolve: para sair de vários laços aninhados de uma vez, é preciso uma variável de controle ou um `goto` (raro mas às vezes usado para esse caso específico em C):

```c
int encontrado = 0;

for (int i = 0; i < 10 && !encontrado; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            encontrado = 1;
            break; // só sai do laço interno
        }
    }
}
```

## Avaliação em curto-circuito de `&&`/`||`

`&&` e `||` só avaliam seu segundo operando se necessário (**avaliação em curto-circuito**), exatamente como em [Python](/?c=langages-de-programmation&s=python&p=conditions): `a && b` só avalia `b` se `a` for verdadeiro (não nulo); `a || b` só avalia `b` se `a` for falso (`0`).

Uso clássico: evitar uma desreferência de ponteiro inválida.

```c
if (ptr != NULL && ptr->valor > 0) {
    ...
}
```

Se `ptr` valer `NULL`, `ptr->valor` nunca é avaliado: `&&` para assim que o primeiro operando é falso.

> **Diferença com o Python:** em C, `&&`/`||` sempre retornam `0` ou `1` (um `int`), nunca um dos dois operandos. `idade > 0 && idade` não retorna então `idade` como faria o equivalente em Python -- apenas a propriedade de curto-circuito (não avaliar o segundo operando quando desnecessário) é aproveitável em C, nunca o valor de retorno como "valor de reserva".

### Combinar bifurcação condicional e detecção de falha

Um uso mais avançado: encadear vários `&&`/`||` para testar um caso E chamar a função correspondente, em uma única expressão, desde que cada função chamada retorne `1` em caso de sucesso e `0` em caso de falha:

```c
!strcmp(type, "v")  && add_vector(mesh, values)
|| !strcmp(type, "vt") && add_texcoord(mesh, values)
|| !strcmp(type, "f")  && add_face(mesh, values);
```

Lê-se como uma cadeia `if`/`else if`: `&&` tem prioridade maior que `||`, então cada linha forma um par `(teste && chamada)` independente. Assim que um par é verdadeiro (o teste corresponde E a chamada tem sucesso), `||` para ali; senão, continua para o próximo par.

> **Armadilha:** esse estilo supõe que cada função chamada respeita a convenção "`1` = sucesso, `0` = falha". Uma função que segue a convenção inversa (`0` = sucesso, comum em chamadas de sistema como `close()`) quebra silenciosamente a cadeia: um sucesso real avaliado como `0` é interpretado como falha, e `||` continua erroneamente para o próximo ramo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `while` testa antes, `do while` testa depois (pelo menos uma execução), `for` agrupa inicialização/condição/incremento. Sem `foreach` nativo: um array se percorre por índice. `&&`/`||` fazem curto-circuito no segundo operando, mas sempre retornam `0`/`1`, nunca um operando como em Python. |
| **Ferramentas utilizáveis** | `break` (para o laço), `continue` (passa para a próxima volta). Encadear `&&`/`||` para combinar um teste e uma chamada condicional em uma única expressão. |
| **Armadilhas a evitar** | `break` só sai do laço mais próximo: uma variável de controle é necessária para sair de vários laços aninhados. Uma cadeia `&&`/`||` supõe que cada função chamada retorna `1` em caso de sucesso; uma função que retorna `0` em caso de sucesso (convenção inversa) a quebra silenciosamente. |
| **Boas práticas** | Sempre transmitir explicitamente o tamanho de um array a uma função que o percorre, em vez de supor que pode ser deduzido. Reservar o encadeamento `&&`/`||` para funções que seguem a convenção "1 = sucesso"; usar um `if` explícito caso contrário. |
