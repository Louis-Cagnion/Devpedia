---
order: 4
---

# Os ponteiros

Um ponteiro é uma variável que não armazena um valor diretamente, mas o **endereço de memória** de outra variável. É o mecanismo central que permite em C manipular a memória diretamente, passar dados a funções sem copiá-los, e construir estruturas de dados dinâmicas (listas encadeadas, árvores...).

## Declaração, endereço e desreferenciamento

```c
int idade = 25;
int *ptr = &idade;

printf("%d\n", idade);  // 25          -> o valor
printf("%p\n", &idade); // 0x7ffee...  -> o endereco de memoria de idade
printf("%p\n", ptr);    // 0x7ffee...  -> o mesmo endereco, armazenado em ptr
printf("%d\n", *ptr);   // 25          -> o valor apontado por ptr
```

- `&variavel`: operador "endereço de", devolve o endereço de memória de uma variável.
- `*ptr` (na declaração): indica que `ptr` é um ponteiro.
- `*ptr` (fora de uma declaração): operador de **desreferenciamento**, acessa o valor armazenado no endereço contido em `ptr`.

Modificar `*ptr` modifica diretamente `idade`, já que os dois designam o mesmo local de memória:

```c
*ptr = 30;
printf("%d\n", idade); // 30
```

## Aritmética de ponteiros

Somar 1 a um ponteiro não o avança de um byte, mas de `sizeof(tipo)` bytes:

```c
int array[3] = {10, 20, 30};
int *p = array;

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20 -> avanca de sizeof(int) bytes, nao de 1 byte
printf("%d\n", *(p + 2));  // 30
```

> **Nota:** um array `array` se comporta como um ponteiro para seu primeiro elemento. `array[i]` e `*(array + i)` são duas escritas estritamente equivalentes em C: é por isso que a indexação de array (`[]`) também funciona em um ponteiro bruto.

### `[]` é apenas açúcar sintático

A equivalência acima é mais profunda que uma simples comodidade de escrita: o operador `[]` não tem em C **nenhuma noção** de "array" nem de "índice". O compilador o traduz mecanicamente, sempre, por:

```text
a[b]  ≡  *(a + b)
```

Como a adição é comutativa (`array + 2` e `2 + array` designam o mesmo endereço), obtém-se uma consequência surpreendente mas perfeitamente legal:

```c
int array[5] = {1, 2, 3, 4, 5};

printf("%d\n", array[2]);      // 3
printf("%d\n", *(array + 2));  // 3
printf("%d\n", 2[array]);      // 3 tambem!
```

> `2[array]` não serve para nada na prática e só tem lugar em perguntas de pegadinha de entrevista. Por outro lado, entender *por que* isso compila é útil: ancora o fato de que em C, indexar um array **é** aritmética de ponteiros, e nada mais.

## Ponteiro para ponteiro

Um ponteiro pode ele mesmo ser apontado, o que é útil para modificar um ponteiro a partir de uma função (cf. passagem por endereço abaixo):

```c
int idade = 25;
int *ptr = &idade;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> desreferencia duas vezes: ptrPtr -> ptr -> idade
```

## Passar um ponteiro a uma função (passagem por endereço)

Em C, os argumentos são passados **por valor** (uma cópia) por padrão: uma função então não pode modificar a variável original do chamador, exceto passando diretamente o endereço dessa variável:

```c
void incrementar(int *numero)
{
    (*numero)++; // modifica o valor no endereco apontado, portanto a variavel original
}

int main(void)
{
    int x = 5;
    incrementar(&x);
    printf("%d\n", x); // 6
}
```

Sem o `*`, `incrementar(int numero)` modificaria apenas uma cópia local, sem efeito sobre `x`.

## Ponteiros de funções

Uma função também tem um endereço na memória, que se pode armazenar em um ponteiro, útil para escolher dinamicamente qual função chamar (callbacks, tabelas de dispatch):

```c
int adicao(int a, int b) { return a + b; }
int subtracao(int a, int b) { return a - b; }

int (*operacao)(int, int) = adicao;

printf("%d\n", operacao(4, 2)); // 6
operacao = subtracao;
printf("%d\n", operacao(4, 2)); // 2
```

## `NULL` e ponteiros inválidos

Um ponteiro não inicializado contém um endereço **aleatório** ("wild pointer"): desreferenciá-lo produz um comportamento indefinido, frequentemente um crash (`segmentation fault`). Um ponteiro que ainda não se usa deve ser explicitamente colocado em `NULL`, e testado antes do desreferenciamento:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr nao aponta para nada.\n");
}
```

> **Nota:** um ponteiro que apontava para uma zona de memória liberada (`free()`, veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)) é chamado de **dangling pointer**. Desreferenciá-lo é um bug clássico (*use-after-free*): a memória pode parecer ainda conter o valor correto por coincidência, até ser reutilizada em outro lugar.

## Comparar ponteiros: o endereço ou o valor?

Com um ponteiro, há duas coisas distintas a comparar, e confundir as duas é uma fonte de erros:

```c
int a = 5;  // armazenada no endereco 0x1000
int b = 5;  // armazenada no endereco 0x2000
int *p1 = &a;
int *p2 = &b;

p1 == p2    // falso: os enderecos sao diferentes
*p1 == *p2  // verdadeiro: os valores apontados sao identicos
```

- `p1 == p2` compara os **endereços**: "esses dois ponteiros designam o mesmo local de memória?"
- `*p1 == *p2` compara os **valores apontados**: "o conteúdo é o mesmo?"

Dois ponteiros podem então perfeitamente conter o mesmo valor sem serem iguais, e vice-versa.

> Essa distinção (comparação por **referência** ou por **valor**) não é exclusiva do C, ela se encontra na maioria das linguagens. Em Python, `is` compara a identidade (o equivalente de `p1 == p2`) e `==` compara o valor (o equivalente de `*p1 == *p2`); veja o capítulo [Variáveis](/?c=langages-de-programmation&s=python&p=variables) de Python. Comparar strings em C ilustra a mesma armadilha: `str1 == str2` compara dois endereços, não dois textos: é preciso `strcmp()`.

## `const` com ponteiros

Dois usos de `const` bem distintos, frequentemente confundidos:

```c
const int *p1;       // p1 pode mudar de endereco, mas nao modificar o valor apontado
int *const p2 = &x;  // p2 nao pode mais mudar de endereco, mas pode modificar o valor apontado
```

| Escrita | O que é protegido |
|---|---|
| `const int *p` | O **valor apontado** não pode ser modificado via `p` |
| `int *const p` | O **próprio ponteiro** não pode mais ser reatribuído após a inicialização |
| `const int *const p` | Nem um, nem outro |

## Resumo

| Notação | Significado |
|---|---|
| `int *ptr` | Declara um ponteiro para um `int` |
| `&variavel` | Endereço de memória de `variavel` |
| `*ptr` | Valor no endereço contido em `ptr` |
| `ptr + 1` | Endereço seguinte, deslocado de `sizeof(tipo)` bytes |
| `NULL` | Ponteiro que não aponta para nada válido |

Veja também [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire) (`malloc`/`free`), que se apoia diretamente nessas noções.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um ponteiro armazena o endereço de memória de uma variável. `&` obtém um endereço, `*` desreferencia (acessa o valor apontado). Indexar um array (`array[i]`) é estritamente equivalente a `*(array + i)`. |
| **Ferramentas utilizáveis** | Ponteiros de ponteiro, ponteiros de função, `const` para proteger o valor apontado e/ou o próprio ponteiro. |
| **Armadilhas a evitar** | Desreferenciar um ponteiro não inicializado ou `NULL`; confundir comparação de endereços (`p1 == p2`) e de valores apontados (`*p1 == *p2`); usar um ponteiro depois de seu `free()` (dangling pointer). |
| **Boas práticas** | Inicializar todo ponteiro não usado com `NULL` e testá-lo antes de desreferenciar; passar o endereço de uma variável a uma função apenas quando ela realmente precisa modificá-la. |
