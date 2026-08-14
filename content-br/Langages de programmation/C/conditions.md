---
order: 2
---

# As condições

As condições permitem executar um bloco de código consoante uma expressão seja verdadeira ou falsa. Em C, utilizam-se «`if`» / «`else`» / «`else if`», o operador ternário e «`switch`».

## A condição «`if`»

Em C, qualquer valor **diferente de zero** é considerado verdadeiro; apenas o valor `0` é falso — não existe um tipo booleano nativo antes do C99 (`stdbool.h`, ver o capítulo sobre variáveis):

```c
int idade = 18;

if (idade >= 18) {
    printf("Vous êtes majeur.\n");
}
```

## `if` / `else` / `else if`

```c
int note = 12;

if (note >= 16) {
    printf("Mention Très Bien\n");
} else if (note >= 14) {
    printf("Mention Bien\n");
} else if (note >= 10) {
    printf("Admis\n");
} else {
    printf("Recalé\n");
}
```

> **Nota:** ao contrário do PHP, não existe uma sintaxe alternativa com `:` / `endif` em C — as chaves `{ }` são a única notação disponível (opcionais apenas se o bloco contiver apenas uma instrução, mas é fortemente desaconselhado omitir as chaves: fonte clássica de erros se for adicionada uma linha por engano sem as chaves).

## O operador ternário

```c
int idade = 20;
const char *statut = (idade >= 18) ? "majeur" : "mineur";

printf("%s\n", statut);
```

## O `switch`

Útil para comparar uma mesma variável com vários valores inteiros ou enumerados:

```c
int jour = 3;

switch (jour) {
    case 1:
        printf("Lundi\n");
        break;
    case 2:
        printf("Mardi\n");
        break;
    case 3:
        printf("Mercredi\n");
        break;
    default:
        printf("Autre jour\n");
        break;
}
```

> **Nota:** não se esqueça do «`break;`» no final de cada «`case`» — caso contrário, a execução continua no «`case`» seguinte (*fall-through*), mesmo que a sua condição não corresponda. Este comportamento é, por vezes, utilizado deliberadamente para agrupar vários casos idênticos:

```c
switch (jour) {
    case 6:
    case 7:
        printf("Week-end\n"); // pas de break entre 6 et 7 : les deux cas partagent ce code
        break;
    default:
        printf("Jour de semaine\n");
        break;
}
```

> **Limitação do «`switch`» em C:** ao contrário de algumas linguagens, um «`switch`» em C só funciona com tipos inteiros (ou equivalentes: `char`, `enum`) — não é possível realizar um «`switch`» diretamente numa cadeia de caracteres.
