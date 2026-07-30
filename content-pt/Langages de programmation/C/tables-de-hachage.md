---
order: 13
---

# As tabelas de hash (hash tables)

Uma **tabela hash** é uma estrutura de dados que permite inserir, procurar e eliminar um valor a partir de uma chave num tempo médio quase constante (`O(1)`), enquanto que uma lista encadeada (ver capítulo dedicado) exigiria percorrer todos os elementos um a um. O princípio: calcular um «endereço» numérico a partir da chave e armazenar/recuperar o valor diretamente nesse local numa tabela.

## O princípio geral

```
clé -> fonction de hachage -> indice dans un tableau -> valeur stockée à cet indice
```

```
"nom" -> hash("nom") = 193847 -> 193847 % taille_tableau = 3 -> valeur stockée en case 3
```

Em vez de procurar sequencialmente «a chave está aqui? E aqui? E ali?», a tabela hash calcula diretamente **onde** procurar.

## A função de hash

Uma **função hash** transforma uma entrada de qualquer tamanho (uma cadeia de caracteres, uma estrutura...) num número de tamanho fixo, de forma determinística: a mesma entrada produz sempre o mesmo número e, idealmente, entradas diferentes produzem números bem distribuídos (para evitar que demasiadas chaves caiam no mesmo local).

```c
unsigned long hash_chaine(const char *cadeia)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *cadeia++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

O número obtido é, em seguida, reduzido ao tamanho real da matriz através de um módulo:

```c
unsigned long índice = hash_chaine(chave) % taille_tableau;
```

## As colisões

O número de chaves possíveis é infinito (qualquer cadeia de caracteres), mas a tabela tem um tamanho finito — pelo que duas chaves diferentes podem, mais cedo ou mais tarde, produzir o mesmo índice. Trata-se de uma **colisão**, gerida principalmente de duas formas:

- **Encadeamento** (*separate chaining*): cada elemento da tabela contém uma lista encadeada (ver capítulo dedicado) de todas as entradas que conduziram a esse índice.
- **Endereçamento aberto** (*open addressing*): em caso de colisão, procura-se a próxima casa livre de acordo com uma regra fixa (por exemplo, a casa seguinte), até se encontrar uma.

## Implementação por encadeamento

```c
typedef struct Entrada
{
    char *chave;
    int valor;
    struct Entrada *suivant; // plusieurs entrées peuvent partager le même indice
} Entrada;

typedef struct TableHachage
{
    Entrada **cases; // tableau de pointeurs vers des listes chaînées
    int taille;
} TableHachage;
```

### Inserção

```c
void inserer(TableHachage *table, const char *chave, int valor)
{
    unsigned long índice = hash_chaine(chave) % table->taille;

    Entrada *nouvelle = malloc(sizeof(Entrada));
    if (nouvelle == NULL) {
        return; // échec d'allocation (cf. chapitre sur la gestion de la mémoire) : on renonce à l'insertion
    }
    nouvelle->chave = strdup(chave);
    nouvelle->valor = valor;
    nouvelle->suivant = table->cases[índice]; // insertion en tête de la liste de ce bucket
    table->cases[índice] = nouvelle;
}
```

### Pesquisa

```c
int rechercher(TableHachage *table, const char *chave, int *trouve)
{
    unsigned long índice = hash_chaine(chave) % table->taille;
    Entrada *courant = table->cases[índice];

    while (courant != NULL) {
        if (strcmp(courant->chave, chave) == 0) {
            *trouve = 1;
            return courant->valor;
        }
        courant = courant->suivant;
    }
    *trouve = 0;
    return 0;
}
```

Mesmo com o mesmo índice, a pesquisa compara, ainda assim, a chave completa (`strcmp`) — o índice apenas reduz a pesquisa a uma pequena lista (idealmente um único elemento), não a elimina completamente.

## Fator de carga e redimensionamento

O **fator de carga** (número de entradas ÷ tamanho da tabela) mede o grau de preenchimento da tabela. Se se tornar demasiado elevado (acima de um limiar comum, como `0.75`), as listas de cada compartimento alongam-se e o desempenho degrada-se para `O(n)` — no pior dos casos (todas as chaves no mesmo compartimento), a tabela de hash comporta-se exatamente como uma simples lista encadeada. Uma boa implementação **redimensiona** então a tabela (geralmente duplicando o seu tamanho) e reinsere todas as entradas existentes («rehash»), para recuperar um fator de carga razoável.

## Onde as tabelas hash já se encontram à sua volta

- As tabelas **associativas** do PHP (ver capítulo sobre variáveis no PHP) são, internamente, implementadas com uma estrutura muito semelhante a uma tabela hash.
- O modelo de armazenamento de objetos do Git (ver capítulo sobre a arquitetura interna do Git) **é**, na verdade, uma tabela de hash: a chave de cada objeto é o hash SHA-1 do seu conteúdo, e a subpasta `.git/objects/xx/` desempenha exatamente o papel de um compartimento (*bucket*).
- Os dicionários Python (`dict`) baseiam-se no mesmo princípio.

Compreender as tabelas hash significa, portanto, compreender um mecanismo que se repete discretamente em praticamente todas as linguagens e ferramentas modernas.
