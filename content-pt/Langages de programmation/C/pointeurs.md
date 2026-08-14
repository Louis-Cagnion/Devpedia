---
order: 4
---

# Os ponteiros

Um ponteiro é uma variável que não armazena um valor diretamente, mas sim o endereço** de memória** de outra variável. É o mecanismo central que permite, em C, manipular a memória diretamente, passar dados para as funções sem os copiar e construir estruturas de dados dinâmicas (listas encadeadas, árvores...).

## Declaração, endereço e remoção do índice

```c
int idade = 25;
int *ptr = &idade;

printf("%d\n", idade);   // 25          -> la valeur
printf("%p\n", &idade);  // 0x7ffee...  -> l'adresse mémoire de age
printf("%p\n", ptr);   // 0x7ffee...  -> la même adresse, stockée dans ptr
printf("%d\n", *ptr);  // 25          -> la valeur pointée par ptr
```

- `&variable` : operador «endereço de», devolve o endereço de memória de uma variável.
- `*ptr` (na declaração): indica que «`ptr`» é um ponteiro.
- `*ptr` (fora de uma declaração): operador de **desreferência**, acessa o valor armazenado no endereço contido em `ptr`.

Alterar `*ptr` altera diretamente `idade`, uma vez que ambos apontam para o mesmo local na memória:

```c
*ptr = 30;
printf("%d\n", idade); // 30
```

## Aritmética de ponteiros

Somar 1 a um ponteiro não o faz avançar um byte, mas sim`sizeof(type)`s bytes:

```c
int tab[3] = {10, 20, 30};
int *p = tab;

printf("%d\n", *p);       // 10
printf("%d\n", *(p + 1)); // 20 -> avance de sizeof(int) octets, pas de 1 octet
printf("%d\n", *(p + 2)); // 30
```

> **Nota:** um tabu`tab`a comporta-se como um ponteiro para o seu primeiro elemento. `tab[i]` e `*(tab + i)` são duas formas de escrita estritamente equivalentes em C — é por isso que a indexação de tabua também funciona num ponteiro bruto.

## Ponteiro para ponteiro

Um ponteiro pode, por sua vez, ser apontado, o que é útil para alterar um ponteiro a partir de uma função (ver «passagem por endereço» abaixo):

```c
int idade = 25;
int *ptr = &idade;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> déréférence deux fois : ptrPtr -> ptr -> age
```

## Passar um ponteiro a uma função (passagem por endereço)

Em C, os argumentos são passados **por valor** (uma cópia) por padrão — uma função não pode, portanto, alterar a variável original do chamador, a menos que lhe seja passado diretamente o endereço dessa variável:

```c
void incrementer(int *número)
{
    (*número)++; // modifie la valeur à l'adresse pointée, donc la variable d'origine
}

int main(void)
{
    int x = 5;
    incrementer(&x);
    printf("%d\n", x); // 6
}
```

Sem o `*`, `incrementer(int número)` apenas alteraria uma cópia local, sem qualquer efeito em `x`.

## Ponteiros de funções

Uma função também tem um endereço na memória, que pode ser armazenado num ponteiro — útil para escolher dinamicamente qual a função a chamar (callbacks, tabelas de despacho):

```c
int addition(int a, int b) { return a + b; }
int soustraction(int a, int b) { return a - b; }

int (*operation)(int, int) = addition;

printf("%d\n", operation(4, 2)); // 6
operation = soustraction;
printf("%d\n", operation(4, 2)); // 2
```

## `NULL` e ponteiros inválidos

Um ponteiro não inicializado contém um endereço **aleatório** («wild pointer») — a sua desreferência produz um comportamento indefinido, muitas vezes uma falha do sistema (`segmentation fault`). Um ponteiro que ainda não seja utilizado deve ser explicitamente posto em «`NULL`» e testado antes da desreferência:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr ne pointe vers rien.\n");
}
```

> **Nota:** um ponteiro que apontava para uma área de memória libertada (`free()`, ver capítulo sobre gestão de memória) é designado por **«dangling pointer**». Acessá-lo é um erro clássico (*use-after-free*): a memória pode, por coincidência, parecer ainda conter o valor correto, até ser reutilizada noutro local.

## `const` com ponteiros

Duas utilizações bem distintas d`const`, frequentemente confundidas:

```c
const int *p1;  // p1 peut changer d'adresse, mais pas modifier la valeur pointée
int *const p2 = &x; // p2 ne peut plus changer d'adresse, mais peut modifier la valeur pointée
```

| Escrita | O que está protegido |
|---|---|
| `const int *p` | O **valor apontado** não pode ser alterado através de `p` |
| `int *const p` | O **próprio ponteiro** já não pode ser reatribuído após a inicialização |
| `const int *const p` | Nem uma coisa nem outra |

## Resumo

| Notação | Significado |
|---|---|
| `int *ptr` | Declara um ponteiro para um `int` |
| `&variable` | Endereço de memória de `variable` |
| `*ptr` | Valor no endereço contido em `ptr` |
| `ptr + 1` | Endereço seguinte, deslocado em `sizeof(type)` octetos |
| `NULL` | Ponteiro que não aponta para nada válido |

Consulte também o capítulo sobre gestão de memória (`malloc` / `free`), que se baseia diretamente nestes conceitos.
