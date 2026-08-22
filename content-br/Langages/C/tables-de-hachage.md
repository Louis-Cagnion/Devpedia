---
order: 14
---

# As tabelas hash (hash tables)

Uma **tabela hash** é uma estrutura de dados que permite inserir, buscar e remover um valor a partir de uma chave em tempo quase constante em média (`O(1)`), onde uma [lista encadeada](/?c=langages-de-programmation&s=c&p=listes-chainees) exigiria percorrer todos os elementos um a um. O princípio: calcular um "endereço" numérico a partir da chave, e armazenar/recuperar o valor diretamente nesse local em um array.

## O princípio geral

```text
chave -> funcao hash -> indice em um array -> valor armazenado nesse indice
```

```text
"nome" -> hash("nome") = 193847 -> 193847 % tamanho_array = 3 -> valor armazenado na posicao 3
```

Em vez de buscar sequencialmente "a chave está aqui? e aqui? e ali?", a tabela hash calcula diretamente **onde** buscar.

## A função hash

Uma **função hash** transforma uma entrada de tamanho qualquer (uma string, uma estrutura...) em um número de tamanho fixo, de forma determinística: a mesma entrada sempre produz o mesmo número, e idealmente, entradas diferentes produzem números bem distribuídos (para evitar que muitas chaves caiam no mesmo lugar).

```c
unsigned long hash_string(const char *string)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *string++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

O número obtido é então reduzido ao tamanho real do array por um módulo:

```c
unsigned long indice = hash_string(chave) % tamanho_array;
```

## As colisões

O número de chaves possíveis é infinito (qualquer string), mas o array tem um tamanho finito: duas chaves diferentes podem então, cedo ou tarde, produzir o mesmo índice. É uma **colisão**, tratada principalmente de duas formas:

- **Encadeamento** (*separate chaining*): cada posição do array contém uma [lista encadeada](/?c=langages-de-programmation&s=c&p=listes-chainees) de todas as entradas que resultaram nesse índice.
- **Endereçamento aberto** (*open addressing*): em caso de colisão, busca-se a próxima posição livre segundo uma regra fixa (ex.: a posição seguinte), até encontrar uma.

## Implementação por encadeamento

```c
typedef struct Entrada
{
    char *chave;
    int valor;
    struct Entrada *seguinte; // varias entradas podem compartilhar o mesmo indice
} Entrada;

typedef struct TabelaHash
{
    Entrada **posicoes; // array de ponteiros para listas encadeadas
    int tamanho;
} TabelaHash;
```

### Inserção

```c
void inserir(TabelaHash *tabela, const char *chave, int valor)
{
    unsigned long indice = hash_string(chave) % tabela->tamanho;

    Entrada *nova = malloc(sizeof(Entrada));
    if (nova == NULL) {
        return; // falha de alocacao (veja O gerenciamento de memoria): desiste-se da insercao
    }
    nova->chave = strdup(chave);
    nova->valor = valor;
    nova->seguinte = tabela->posicoes[indice]; // insercao no inicio da lista desse bucket
    tabela->posicoes[indice] = nova;
}
```

### Busca

```c
int buscar(TabelaHash *tabela, const char *chave, int *encontrado)
{
    unsigned long indice = hash_string(chave) % tabela->tamanho;
    Entrada *atual = tabela->posicoes[indice];

    while (atual != NULL) {
        if (strcmp(atual->chave, chave) == 0) {
            *encontrado = 1;
            return atual->valor;
        }
        atual = atual->seguinte;
    }
    *encontrado = 0;
    return 0;
}
```

Mesmo com índices iguais, a busca ainda compara a chave completa (`strcmp`): o índice apenas reduz a busca a uma lista pequena (idealmente um único elemento), não a elimina completamente.

## Fator de carga e redimensionamento

O **fator de carga** (número de entradas ÷ tamanho do array) mede o quão cheia está a tabela. Se ficar muito alto (acima de um limiar comum como `0.75`), as listas de cada posição se alongam, e o desempenho se degrada para `O(n)`: no pior caso (todas as chaves na mesma posição), a tabela hash se comporta exatamente como uma simples lista encadeada. Uma boa implementação então **redimensiona** o array (geralmente dobrando seu tamanho) e reinsere todas as entradas existentes ("rehash"), para retomar um fator de carga razoável.

## Onde as tabelas hash já se escondem ao seu redor

- Os arrays **associativos** de PHP (veja [As variáveis](/?c=langages-de-programmation&s=php&p=variables)) são, internamente, implementados com uma estrutura muito próxima de uma tabela hash.
- O modelo de armazenamento de objetos do Git (veja [A arquitetura interna do Git](/?c=git&p=architecture-interne)) **é** diretamente uma tabela hash: a chave de cada objeto é o hash SHA-1 de seu conteúdo, e a subpasta `.git/objects/xx/` desempenha exatamente o papel de uma posição (*bucket*).
- Os dicionários Python (`dict`) se baseiam no mesmo princípio.

Entender as tabelas hash é, portanto, entender um mecanismo que se repete silenciosamente na quase totalidade das linguagens e ferramentas modernas.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma tabela hash calcula um índice a partir de uma chave (via uma função hash) para acessar diretamente o valor, em `O(1)` em média. Uma colisão (duas chaves, mesmo índice) é tratada por encadeamento ou endereçamento aberto. |
| **Ferramentas utilizáveis** | Uma função hash determinística e bem distribuída; o redimensionamento ("rehash") quando o fator de carga ultrapassa um limiar (frequentemente 0.75). |
| **Armadilhas a evitar** | Uma função hash mal distribuída que concentra muitas chaves em poucos índices: degrada o desempenho para `O(n)`. |
| **Boas práticas** | Redimensionar e reinserir todas as entradas assim que o fator de carga ficar muito alto, em vez de deixar as listas de cada posição se alongarem indefinidamente. |
