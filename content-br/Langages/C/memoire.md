---
order: 6
---

# O gerenciamento de memória

Ao contrário de linguagens como [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), que gerenciam automaticamente a memória via um coletor de lixo (*garbage collector*), o C deixa ao desenvolvedor a responsabilidade completa de alocar e liberar a memória de que seu programa precisa. É isso que permite performances elevadas e um controle fino dos recursos, ao preço de uma vigilância constante.

## Stack (pilha) e Heap (monte)

Um programa C dispõe de duas zonas de memória principais para seus dados:

| | Stack | Heap |
|---|---|---|
| Gerenciamento | Automático (variáveis locais) | Manual (`malloc`/`free`) |
| Tempo de vida | O tempo do bloco/da função atual | Até o `free()` explícito |
| Tamanho | Limitado, fixado no início do programa | Limitado pela RAM/swap disponível |
| Velocidade | Muito rápida (simples deslocamento de um ponteiro) | Mais lenta (busca por um espaço livre) |

```c
void exemplo(void)
{
    int x = 5;                     // na stack, liberado automaticamente ao fim da funcao
    int *p = malloc(sizeof(int));  // no heap, permanece alocado ate free(p)
    *p = 5;
    free(p);
}
```

## Alocar memória dinamicamente

`malloc()` reserva um bloco de memória bruto no heap, cujo tamanho é expresso em bytes:

```c
int *array = malloc(5 * sizeof(int)); // reserva o espaco para 5 inteiros

if (array == NULL) {
    // malloc falhou (memoria insuficiente) -> array vale NULL, sempre verificar
    return;
}

for (int i = 0; i < 5; i++) {
    array[i] = i * 10;
}
```

> **Nota:** `malloc()` não **reinicializa** a memória alocada: ela pode conter qualquer valor residual ("garbage"). `calloc(numero, tamanho)` faz a mesma coisa que `malloc(numero * tamanho)`, mas além disso coloca todos os bytes em zero.

```c
int *array = calloc(5, sizeof(int)); // 5 inteiros, todos inicializados em 0
```

## Redimensionar um bloco: `realloc()`

```c
int *array = malloc(3 * sizeof(int));
// ... precisa-se de mais espaco ...
int *novoArray = realloc(array, 6 * sizeof(int));

if (novoArray == NULL) {
    // realloc falhou: o bloco antigo "array" ainda e valido, nao perde-lo
    free(array);
    return;
}
array = novoArray; // o bloco pode ter sido deslocado para outro lugar na memoria
```

`realloc()` preserva o conteúdo existente (truncado se o novo tamanho for menor), mas pode deslocar o bloco na memória se necessário: é por isso que nunca se reatribui `array` diretamente antes de verificar que `realloc()` não retornou `NULL`.

## Liberar a memória: `free()`

Cada `malloc()`/`calloc()`/`realloc()` bem-sucedido deve corresponder a exatamente um `free()`, quando o bloco não é mais útil:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p ainda contem o endereco antigo ("dangling pointer"): nao deve mais ser usado
p = NULL; // boa pratica: impede um uso acidental apos a liberacao
```

## Os quatro bugs de memória clássicos

| Bug | Causa | Consequência |
|---|---|---|
| **Vazamento de memória** (*memory leak*) | Um bloco `malloc`ado nunca é `free()`ado | A memória usada pelo programa aumenta sem nunca diminuir |
| **Use-after-free** | O programa desreferencia um ponteiro após seu `free()` | Comportamento indefinido: dado corrompido, crash, ou pior, silenciosamente "funciona" |
| **Double free** | `free()` chamado duas vezes no mesmo ponteiro | Corrupção do gerenciador de memória, crash frequentemente adiado e difícil de rastrear |
| **Estouro de buffer** (*buffer overflow*) | Escrita além do tamanho realmente alocado de um buffer | Corrupção de memória adjacente, e uma porta aberta para a execução de código arbitrário (veja abaixo) |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free: comportamento indefinido
```

> **Nota:** esses bugs nem sempre provocam um crash imediato e visível: é isso que os torna difíceis de detectar. Uma ferramenta como o [**Valgrind**](https://valgrind.org) (`valgrind ./meu_programa`) executa o programa e relata precisamente os vazamentos de memória e os acessos inválidos, com a linha de código responsável.

## O estouro de buffer (*buffer overflow*), um bug com consequências de segurança

Ao contrário dos três bugs anteriores (que corrompem a memória do próprio programa, sem intenção externa), um estouro de buffer é frequentemente **o resultado de uma entrada controlada por um atacante**: o que faz dele historicamente uma das falhas de segurança mais exploradas em C/[C++](/?c=langages-de-programmation&s=cpp&p=cpp).

```c
char buffer[16];
strcpy(buffer, entrada_usuario); // NENHUMA verificacao do tamanho de entrada_usuario
```

Se `entrada_usuario` ultrapassar 16 bytes, `strcpy()` continua escrevendo além dos limites de `buffer`, na memória que segue imediatamente na pilha, que pode conter outras variáveis locais, ou o **endereço de retorno** da função atual (o local onde o programa deve retomar sua execução após o `return`). Um atacante que controla precisamente o conteúdo escrito pode, no pior caso, substituir esse endereço de retorno pelo endereço de sua escolha, desviando o fluxo de execução do programa para um código sob seu controle (*stack smashing*).

> **Nota:** é o mesmo princípio de uma [injeção SQL](/?c=langages-de-programmation&s=php&p=securite) ou de uma [injeção de comando Bash](/?c=shells&s=bash&p=variables): uma entrada não controlada que modifica a **estrutura** do que vai ser executado, em vez de permanecer um dado passivo.

### Se proteger disso

```c
strcpy(buffer, entrada);                       // perigoso: nenhum limite
strncpy(buffer, entrada, sizeof(buffer) - 1);  // limitado ao tamanho real do buffer
buffer[sizeof(buffer) - 1] = '\0';             // strncpy nao garante a terminacao se a origem for muito longa

fgets(buffer, sizeof(buffer), stdin);        // leitura limitada ja na captura, em vez de corrigir depois
```

| Função arriscada | Alternativa limitada |
|---|---|
| `strcpy()` | `strncpy()` (atenção à terminação, cf. acima) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (trunca em vez de estourar) |
| `gets()` | `fgets()` (`gets()` aliás foi removido do padrão C desde o [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisamente por esse motivo) |

> **Nota:** limitar o tamanho só resolve metade do problema: também é preciso verificar que o dado truncado permanece coerente para o resto do programa (um nome de arquivo cortado no meio por `strncpy` continua sendo um nome de arquivo sintaticamente válido, apenas incorreto). O reflexo correto continua sendo sempre conhecer, a cada escrita, o tamanho real do buffer de destino; nunca supor que uma entrada respeitará um tamanho esperado sem verificá-lo.

## `sizeof`

`sizeof` não é uma função, mas um operador avaliado na compilação: ele retorna o tamanho em bytes de um tipo ou de uma variável, indispensável para calcular corretamente o tamanho a alocar:

```c
sizeof(int);       // geralmente 4
sizeof(char);      // sempre 1, por definicao do padrao C
sizeof(int) * 10;  // tamanho necessario para 10 inteiros -> a passar para malloc()
```

Veja também [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs), cuja compreensão é um pré-requisito para este capítulo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O C deixa ao desenvolvedor a responsabilidade completa da memória dinâmica (heap): `malloc`/`calloc`/`realloc` para alocar, `free` para liberar; a stack (variáveis locais) é gerenciada automaticamente. |
| **Ferramentas utilizáveis** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, Valgrind para detectar vazamentos e acessos inválidos. |
| **Armadilhas a evitar** | Vazamento de memória (nunca um `free`), use-after-free, double free, estouro de buffer, este último podendo ser explorado como falha de segurança. |
| **Boas práticas** | Sempre verificar se um `malloc`/`realloc` não retornou `NULL`; colocar um ponteiro em `NULL` logo após seu `free()`; preferir `fgets`/`strncpy`/`snprintf` às funções sem limite (`gets`/`strcpy`/`sprintf`). |
