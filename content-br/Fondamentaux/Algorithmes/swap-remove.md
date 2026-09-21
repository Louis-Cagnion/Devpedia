---
order: 5
---

# O swap-remove: remover um elemento em O(1)

Remover um elemento no meio de um array normalmente é caro: todos os elementos seguintes precisam deslocar uma casa para a esquerda para preencher o vazio, uma operação **O(n)** ([complexidade](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). O *swap-remove* (ou *swap-and-pop*) evita esse deslocamento, ao custo de perder a ordem dos elementos -- aceitável assim que essa ordem não precisa ser preservada.

## O problema: o deslocamento clássico

```c
// remove o elemento no índice i, deslocando tudo o que vem depois -- O(n)
void remover_com_deslocamento(int arr[], int *tamanho, int i)
{
    for (int j = i; j < *tamanho - 1; j++)
        arr[j] = arr[j + 1];   // cada elemento recua uma casa
    (*tamanho)--;
}
```

Em um array de 1000 elementos, remover o primeiro desloca os outros 999: custoso se a operação se repete com frequência.

## A técnica: trocar com o último, depois remover

Em vez de deslocar, troca-se o elemento a remover com o **último elemento ativo** do array, depois reduz-se o contador de tamanho:

```c
// remove o elemento no índice i trocando-o com o último -- O(1)
void swap_remove(int arr[], int *tamanho, int i)
{
    arr[i] = arr[*tamanho - 1];   // o último elemento ocupa o lugar do removido
    (*tamanho)--;                  // o último não é mais contado como ativo
}
```

```text
Antes (remover o índice 1, valor B):
[A][B][C][D]        tamanho = 4
    ^ a remover

Depois de swap_remove(arr, &tamanho, 1):
[A][D][C] [B]        tamanho = 3
             ^ B continua fisicamente na memória, mas não é mais contado
```

Apenas um elemento se move, seja qual for o tamanho do array: **O(1)**, independente da posição removida.

> **Armadilha:** essa técnica só serve se a ordem dos elementos restantes não precisa ser preservada. Em um array onde a ordem importa (ex. um ranking, um histórico cronológico), swap-remove quebraria silenciosamente essa ordem -- nesse caso, manter o deslocamento clássico.

## Desfazer uma remoção sem copiar

Como o elemento removido permanece fisicamente presente além do novo contador (`arr[*tamanho]` até o antigo `*tamanho`, nunca sobrescrito enquanto nenhum outro `swap_remove` ocorrer), desfazer a última remoção consiste simplesmente em restaurar o antigo contador -- nenhuma cópia de dados é necessária:

```c
int tamanho_anterior = tamanho;
swap_remove(arr, &tamanho, i);
// ... mais tarde, para desfazer:
tamanho = tamanho_anterior;   // arr[i] volta a ser válido tal como está, nada a recopiar
```

Essa propriedade torna o swap-remove especialmente adequado para um algoritmo que testa e desfaz candidatos em loop, como o [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O swap-remove remove um elemento de um array desordenado em O(1), trocando-o com o último elemento ativo e decrementando o contador de tamanho, ao custo de perder a ordem dos elementos. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta dedicada: uma técnica a aplicar diretamente sobre um array/contador de tamanho. |
| **Armadilhas a evitar** | Usá-la em um array onde a ordem dos elementos deve ser preservada (ranking, histórico). |
| **Boas práticas** | Aproveitar que o elemento removido permanece fisicamente na memória para desfazer uma remoção sem copiar, apenas restaurando o antigo contador. |
