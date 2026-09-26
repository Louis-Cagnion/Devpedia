---
order: 10
---

# A fila de prioridade e o heap binário

Uma [fila](/?c=fondamentaux&s=algorithmes&p=pile-et-file) atende os elementos na ordem de chegada. Uma **fila de prioridade** atende sempre **o mais prioritário** primeiro, como o pronto-socorro de um hospital: o paciente mais grave passa na frente, qualquer que seja a hora de chegada.

| Operação | Array não ordenado | Array ordenado | Heap binário |
|---|---|---|---|
| Adicionar um elemento | O(1) | O(n) (deslocar para inseri-lo no lugar) | O(log n) |
| Retirar o mais prioritário | O(n) (percorrer tudo) | O(1) | O(log n) |

O **heap binário** faz as duas operações em O(log n) (ver [A complexidade e a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): com um milhão de elementos, uns vinte passos em vez de um milhão.

## O heap binário: uma árvore guardada em um array

Um heap é uma árvore em que cada pai é **pelo menos tão prioritário quanto os filhos**. O mais prioritário está, portanto, sempre na raiz. A árvore é guardada nível por nível em um simples array, sem ponteiros:

```
            [0] 90                  array: 90  70  80  20  50  60
          /        \                casa :  0   1   2   3   4   5
      [1] 70      [2] 80
      /    \       /                pai da casa i    : (i - 1) / 2
  [3] 20  [4] 50  [5] 60            filhos da casa i : 2i + 1 e 2i + 2
```

| Operação | Como |
|---|---|
| Adicionar | Colocar o elemento no fim do array e depois fazê-lo **subir**, trocando-o com o pai enquanto for mais prioritário |
| Retirar o mais prioritário | Pegar a raiz, colocar o último elemento no lugar dela e depois fazê-lo **descer**, trocando-o com o filho mais prioritário enquanto for preciso |

Cada subida ou descida percorre no máximo a altura da árvore, ou seja, log₂(n) passos.

## O heap indexado: mudar a prioridade de um elemento já guardado

Alguns algoritmos aumentam a prioridade de um elemento **que já está no heap**: por exemplo a heurística VSIDS dos [solucionadores SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), que aumenta a atividade de uma variável a cada conflito. É preciso então saber **onde** esse elemento está no array, sem procurá-lo casa por casa. Um **heap indexado** mantém uma tabela `pos[x]`: a casa onde está o elemento x, atualizada a cada movimento.

```c
double prioridade[N];                        // prioridade[x]: prioridade do elemento x
int    heap[N];                              // os elementos, guardados em heap
int    pos[N];                               // pos[x]: casa de x no heap, ou -1
int    tamanho = 0;

static void colocar(int i, int x) { heap[i] = x; pos[x] = i; }

// Faz subir o elemento da casa i enquanto ele for mais prioritário que o pai
static void subir(int i)
{
    int x = heap[i];
    while (i > 0 && prioridade[x] > prioridade[heap[(i - 1) / 2]]) {
        colocar(i, heap[(i - 1) / 2]);       // o pai desce um nível
        i = (i - 1) / 2;
    }
    colocar(i, x);
}

// Faz descer o elemento da casa i enquanto um filho for mais prioritário
static void descer(int i)
{
    int x = heap[i];
    for (;;) {
        int f = 2 * i + 1;                   // filho esquerdo
        if (f >= tamanho)
            break;
        if (f + 1 < tamanho && prioridade[heap[f + 1]] > prioridade[heap[f]])
            f++;                             // o mais prioritário dos dois filhos
        if (prioridade[heap[f]] <= prioridade[x])
            break;
        colocar(i, heap[f]);                 // o filho sobe um nível
        i = f;
    }
    colocar(i, x);
}

void inserir(int x) { colocar(tamanho, x); tamanho++; subir(tamanho - 1); }

int extrair_max(void)
{
    int x = heap[0];
    pos[x] = -1;                             // x não está mais no heap
    tamanho--;
    if (tamanho > 0) {
        colocar(0, heap[tamanho]);           // o último toma o lugar da raiz
        descer(0);
    }
    return x;
}

void aumentar(int x, double delta)           // a prioridade de x aumenta
{
    prioridade[x] += delta;
    if (pos[x] >= 0)
        subir(pos[x]);                       // graças a pos: nenhuma busca no heap
}
```

Em vez de trocar duas casas a cada passo, `subir` e `descer` deslocam os elementos que encontram e só colocam `x` uma vez, na casa final: metade das escritas. Código verificado em 200.000 operações aleatórias (inserções, aumentos, remoções), comparando cada remoção com uma busca do máximo casa por casa: nenhuma diferença.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma fila de prioridade atende sempre primeiro o mais prioritário. O heap binário a implementa em um simples array: pai da casa i em (i − 1) / 2, filhos em 2i + 1 e 2i + 2, inserção e remoção em O(log n). |
| **Ferramentas utilizáveis** | Subida e descida no heap; tabela de posições `pos[x]` (heap indexado) para aumentar a prioridade de um elemento já guardado. |
| **Armadilhas a evitar** | Esquecer de atualizar `pos` a cada movimento (passar sempre por uma única função como `colocar`); procurar um elemento casa por casa no heap, o que anula todo o ganho. |
| **Boas práticas** | Verificar um heap contra uma versão ingênua em muitas operações aleatórias; deslocar em vez de trocar durante uma subida ou uma descida. |
