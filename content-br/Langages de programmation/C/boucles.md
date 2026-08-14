---
order: 3
---

# Os loops

Os loops permitem repetir um bloco de código várias vezes. Em C, existem três estruturas: `while`, `do while` e `for` — não existe um `foreach` nativo; um array é sempre percorrido através de um índice ou de um ponteiro.

## O ciclo `while`

A condição é testada **antes de** cada iteração:

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## O ciclo `do while`

Variante em que a condição é verificada **após** cada iteração: o bloco é, portanto, sempre executado pelo menos uma vez, mesmo que a condição seja falsa desde o início:

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## O ciclo `for`

Reúne numa única linha a inicialização, a condição e o incremento — o que é prático sempre que o número de iterações for conhecido antecipadamente:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

As três partes são independentes e opcionais (`for (;;)` é um ciclo infinito válido), mas a utilização clássica continua a ser `for (init; condition; incrément)`.

## Percorrer uma tabela (sem «`foreach`»)

```c
int matriz[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", matriz[i]);
}
```

> **Nota:** ao contrário do PHP ou do JavaScript, não existe **qualquer forma nativa** de saber o tamanho de um array apenas a partir do ponteiro — o `matriz[5]` «sabe» quantos elementos contém enquanto for manipulado como um array estático, mas essa informação desaparece assim que for passado para uma função (nesse caso, comporta-se como um simples ponteiro; ver o capítulo sobre ponteiros). O tamanho deve, portanto, ser transmitido separadamente.

```c
void afficher(int *matriz, int taille) // la taille doit être passée explicitement
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", matriz[i]);
    }
}
```

## `break` e `continue`

- `break;` interrompe completamente o ciclo de controle.
- `continue;` avança diretamente para a próxima iteração, sem executar o resto do corpo do ciclo atual.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // arrête la boucle dès que i vaut 5
    }
    if (i % 2 == 0) {
        continue; // ignore les nombres pairs
    }
    printf("%d\n", i);
}
```

## Laços aninhados e `break`

`break` só interrompe o ciclo **mais próximo** que o engloba — para sair de vários ciclos aninhados de uma só vez, é necessária uma variável de controle ou um «`goto`» (raro, mas por vezes utilizado para este caso específico em C):

```c
int trouve = 0;

for (int i = 0; i < 10 && !trouve; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            trouve = 1;
            break; // ne sort que de la boucle interne
        }
    }
}
```
