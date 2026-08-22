---
order: 2
---

# As condições

As condições permitem executar um bloco de código conforme uma expressão seja verdadeira ou falsa. Em C, usa-se `if`/`else`/`else if`, o operador ternário, e `switch`.

## A condição `if`

Em C, todo valor **não nulo** é considerado verdadeiro; apenas o valor `0` é falso: não existe tipo booleano nativo antes do [C99](https://en.wikipedia.org/wiki/C99) ([`stdbool.h`](/?c=langages-de-programmation&s=c&p=variables)):

```c
int idade = 18;

if (idade >= 18) {
    printf("Voce e maior de idade.\n");
}
```

## `if` / `else` / `else if`

```c
int nota = 12;

if (nota >= 16) {
    printf("Mencao Otimo\n");
} else if (nota >= 14) {
    printf("Mencao Bom\n");
} else if (nota >= 10) {
    printf("Aprovado\n");
} else {
    printf("Reprovado\n");
}
```

> **Nota:** ao contrário de PHP, não existe sintaxe alternativa com `:`/`endif` em C: as chaves `{ }` são a única forma disponível (opcionais apenas se o bloco contém uma única instrução, mas fortemente desaconselhado omiti-las: fonte clássica de bugs se uma linha for adicionada por engano sem as chaves).

## O operador ternário

```c
int idade = 20;
const char *status = (idade >= 18) ? "maior de idade" : "menor de idade";

printf("%s\n", status);
```

## O `switch`

Útil para comparar uma mesma variável com vários valores inteiros ou enumerados:

```c
int dia = 3;

switch (dia) {
    case 1:
        printf("Segunda\n");
        break;
    case 2:
        printf("Terca\n");
        break;
    case 3:
        printf("Quarta\n");
        break;
    default:
        printf("Outro dia\n");
        break;
}
```

> **Nota:** não esqueça o `break;` no final de cada `case`: senão a execução continua no `case` seguinte (*fall-through*), mesmo que sua condição não corresponda. Esse comportamento às vezes é explorado deliberadamente para agrupar vários casos idênticos:

```c
switch (dia) {
    case 6:
    case 7:
        printf("Fim de semana\n"); // sem break entre 6 e 7: os dois casos compartilham esse codigo
        break;
    default:
        printf("Dia de semana\n");
        break;
}
```

> **Limite do `switch` em C:** ao contrário de algumas linguagens, um `switch` em C só funciona com tipos inteiros (ou assimilados: `char`, `enum`): impossível fazer um `switch` diretamente em uma string.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `if`/`else`/`else if` executam um bloco conforme uma condição; qualquer valor não nulo é verdadeiro em C. `switch` compara uma mesma variável inteira com vários valores. |
| **Ferramentas utilizáveis** | O operador ternário `? :` para uma atribuição condicional curta. |
| **Armadilhas a evitar** | Esquecer `break;` em um `case`: a execução continua no `case` seguinte (*fall-through*), mesmo sem corresponder à sua condição. |
| **Boas práticas** | Sempre usar chaves em um bloco `if`, mesmo com uma única instrução: evita um bug se uma linha for adicionada depois sem as chaves. |
