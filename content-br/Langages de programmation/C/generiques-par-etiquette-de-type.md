---
order: 5
---

# Os genéricos em C: dispatch por etiqueta de tipo

O C não tem mecanismo de genericidade nativo como os [templates](/?c=langages-de-programmation&s=cpp&p=templates) em C++: nenhum compilador que gera uma versão especializada de uma função para cada tipo usado. Escrever uma função que aceite "qualquer tipo" exige então uma técnica manual, construída diretamente sobre os [ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs): o ponteiro genérico `void*`, acompanhado de uma **etiqueta de tipo** que diz, em tempo de execução, o que ele realmente aponta.

## O problema: `void*` não sabe o que aponta

Um `void*` pode armazenar o endereço de qualquer dado, mas perde toda informação sobre o **tipo** desse dado: impossível desreferenciá-lo diretamente, impossível fazer aritmética de ponteiro sobre ele (o compilador não conhece `sizeof(tipo)`).

```c
void exibir(void *dado) {
    printf("%d\n", *(int *)dado);  // supoe que dado aponta um int: perigoso
}
```

Essa função funciona enquanto for chamada apenas com um `int*`, mas nada a impede de ser chamada com um `float*` ou uma string: o cast `(int *)` mentiria silenciosamente para o compilador, sem erro nem aviso, até o comportamento indefinido em tempo de execução.

## A técnica: acompanhar o `void*` de uma etiqueta de tipo

A solução consiste em nunca fazer um `void*` circular sozinho, mas sempre acompanhado de um dado que identifica seu tipo real, geralmente uma string ou um valor de enumeração:

```c
typedef struct {
    void *dado;
    char *tipo;   // "int", "float", "string"...
} Valor;

void exibir(Valor v) {
    if (strcmp(v.tipo, "int") == 0) {
        printf("%d\n", *(int *)v.dado);
    } else if (strcmp(v.tipo, "float") == 0) {
        printf("%f\n", *(float *)v.dado);
    } else if (strcmp(v.tipo, "string") == 0) {
        printf("%s\n", (char *)v.dado);
    }
}
```

O cast deixa de ser uma suposição: ele é **condicionado** pela etiqueta, verificada antes de ser usada. A função sabe, em tempo de execução, o que ela realmente tem em mãos.

> **Armadilha:** comparar as etiquetas com `==` em vez de `strcmp()` quando elas são strings. `v.tipo == "int"` compara dois endereços, não dois textos (veja a mesma observação no capítulo [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs)): dependendo de como a string literal foi alocada, a comparação pode falhar mesmo com o texto sendo idêntico.

## Dispatch sem uma cadeia de `if`/`else if`

Uma cadeia de comparações logo vira um código que precisa crescer manualmente a cada novo tipo: exatamente o tipo de repetição que uma [estrutura indexada](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) permite evitar, aqui na forma de uma **tabela de dispatch** associando cada etiqueta a um [ponteiro de função](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void exibirInt(void *d)    { printf("%d\n", *(int *)d); }
void exibirFloat(void *d)  { printf("%f\n", *(float *)d); }
void exibirString(void *d) { printf("%s\n", (char *)d); }

typedef struct {
    char *tipo;
    void (*funcao)(void *);
} Dispatch;

Dispatch tabela[] = {
    {"int", exibirInt},
    {"float", exibirFloat},
    {"string", exibirString},
};

void exibir(Valor v) {
    for (int i = 0; i < 3; i++) {
        if (strcmp(tabela[i].tipo, v.tipo) == 0) {
            tabela[i].funcao(v.dado);
            return;
        }
    }
}
```

Adicionar um tipo se resume a adicionar uma linha em `tabela`, nunca a mexer em `exibir()` propriamente dita.

## O que isso resolve, e o que isso não resolve

| | `void*` + etiqueta (C) | Templates (C++) |
|---|---|---|
| Verificação do tipo | Em tempo de execução, pelo próprio código | Em tempo de compilação, pelo compilador |
| Custo em tempo de execução | Comparação de etiqueta + indireção a cada chamada | Nulo (código especializado gerado por tipo) |
| Tipo incorreto | Bug silencioso se a etiqueta mentir ou for esquecida | Erro de compilação |
| O que é realmente generalizado | O código que manipula o dado | O código **e** a garantia de tipo |

Veja [Os templates](/?c=langages-de-programmation&s=cpp&p=templates): a mesma intenção (escrever uma vez, usar com qualquer tipo) resolvida em um momento completamente diferente do ciclo de vida do programa. Como o C não oferece verificação em tempo de compilação para esse tipo de código, a responsabilidade pela coerência entre `dado` e `tipo` recai inteiramente sobre o programador, sem rede de segurança.

> **Boa prática:** centralizar a construção de um `Valor` (nunca atribuir `dado`/`tipo` separadamente à mão em vários lugares) em uma única função por tipo (`valorDeInt()`, `valorDeFloat()`...), para que uma etiqueta incoerente com seu dado não possa aparecer em nenhum outro lugar além desse ponto de entrada único.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O C não tem genericidade verificada em tempo de compilação: `void*` faz circular um dado de tipo qualquer, mas perde seu tipo. Uma etiqueta (string ou enum) transportada junto do `void*` restaura essa informação em tempo de execução, condição do cast antes do desreferenciamento. |
| **Ferramentas utilizáveis** | Uma tabela de dispatch (etiqueta -> ponteiro de função) para evitar uma cadeia de `if`/`else if` que cresce a cada novo tipo. |
| **Armadilhas a evitar** | Comparar etiquetas de tipo string com `==` em vez de `strcmp()`. Confiar em um cast sem ter verificado a etiqueta previamente. |
| **Boas práticas** | Centralizar a construção do par dado/etiqueta em uma função dedicada por tipo, para que nenhuma incoerência possa aparecer em outro lugar. |
