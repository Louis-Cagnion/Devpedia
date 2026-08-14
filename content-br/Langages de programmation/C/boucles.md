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

> **Nota:** ao contrário de PHP ou JavaScript, não existe **nenhum jeito nativo** de saber o tamanho de um array apenas a partir do ponteiro: `array[5]` "sabe" quanto contém enquanto for manipulado como array estático, mas essa informação desaparece assim que é passado a uma função (ele então se comporta como um simples ponteiro, veja [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs)). O tamanho então precisa ser transmitido separadamente.

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
        break; // para o laco assim que i vale 5
    }
    if (i % 2 == 0) {
        continue; // ignora os numeros pares
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
            break; // so sai do laco interno
        }
    }
}
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `while` testa antes, `do while` testa depois (pelo menos uma execução), `for` agrupa inicialização/condição/incremento. Sem `foreach` nativo: um array se percorre por índice. |
| **Ferramentas utilizáveis** | `break` (para o laço), `continue` (passa para a próxima volta). |
| **Armadilhas a evitar** | `break` só sai do laço mais próximo: uma variável de controle é necessária para sair de vários laços aninhados. |
| **Boas práticas** | Sempre transmitir explicitamente o tamanho de um array a uma função que o percorre, em vez de supor que pode ser deduzido. |
