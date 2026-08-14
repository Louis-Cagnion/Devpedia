---
order: 3
---

# As matrizes e o produto matricial

Um [vetor](/?c=mathematiques&p=vecteurs-et-produit-scalaire) organiza vários números em uma única lista. Uma **matriz** vai um passo além: ela organiza números em uma **tabela bidimensional** (linhas e colunas), exatamente como uma planilha. É a ferramenta que permite calcular sobre *vários* vetores ao mesmo tempo, de uma só vez, em vez de um por um, e é isso que, muito concretamente, faz uma rede neural funcionar.

## O que é uma matriz?

Uma matriz é uma tabela de números organizada em linhas e colunas. Suas dimensões se anotam como **linhas × colunas**:

```text
     coluna 1  coluna 2  coluna 3
linha 1   1         2          3
linha 2   4         5          6
```

Essa matriz tem 2 linhas e 3 colunas: dizemos que ela tem dimensão **2×3**. Um elemento é localizado por sua posição `(linha, coluna)`: o elemento na posição (2, 3) vale 6.

> **Analogia:** uma planilha (folha de cálculo) sem as fórmulas: apenas células organizadas em linhas e colunas, cada uma contendo um número.

> **Cuidado:** essa numeração `(2, 3)` conta a partir de 1, como na matemática. No NumPy (veja o capítulo [NumPy](/?c=data-science&p=numpy)) e na maioria das linguagens de programação, a indexação começa em 0: esse mesmo elemento seria obtido em código com `matriz[1, 2]`, não `matriz[2, 3]`.

Um vetor, portanto, nada mais é que um caso particular de matriz: uma única coluna (dimensão *n*×1) ou uma única linha (1×*n*). Tudo o que foi visto sobre [vetores](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (a soma, o produto escalar) se generaliza diretamente para matrizes.

## Soma e multiplicação por um número

Como para os vetores, essas duas operações são feitas termo a termo, posição por posição:

```text
[1, 2]     [5, 6]     [1+5, 2+6]     [6,  8]
[3, 4]  +  [7, 8]  =  [3+7, 4+8]  =  [10, 12]

[1, 2]           [1×3, 2×3]        [3, 6]
[3, 4]  × 3  =    [3×3, 4×3]   =    [9, 12]
```

> **Cuidado:** somar duas matrizes de dimensões diferentes não tem sentido: como para os vetores, cada posição precisa ter uma correspondente exata na outra matriz.
>
> **Boa prática:** verificar que duas matrizes têm exatamente as mesmas dimensões antes de somá-las.

## O produto matriz-vetor: vários neurônios, um único cálculo

Aqui está a operação que realmente importa. Lembrando o capítulo sobre [as redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): um neurônio calcula uma soma ponderada de suas entradas, ou seja, um [produto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre o vetor das entradas e seu próprio vetor de pesos. Uma camada contém *vários* neurônios, cada um com seu próprio vetor de pesos; organizados em linhas, esses vetores de pesos formam uma matriz:

```text
Pesos de 2 neuronios, para 2 entradas cada:

W = [ 0.5  -0.3 ]   <- pesos do neuronio 1
    [ 0.2   0.4 ]   <- pesos do neuronio 2

Entrada:  x = [1.0]
              [2.0]
```

O **produto matriz-vetor** `W · x` calcula o produto escalar de **cada linha** de `W` com `x`, e coloca cada resultado em uma nova coluna:

```text
W · x = [ 0.5×1.0 + (-0.3)×2.0 ]  =  [ -0.1 ]
        [ 0.2×1.0 +   0.4×2.0 ]      [  1.0 ]
```

Compare com o cálculo neurônio por neurônio do capítulo sobre redes neurais: `pesos_n1 · entradas = 0.5×1.0 + (-0.3)×2.0` e `pesos_n2 · entradas = 0.2×1.0 + 0.4×2.0`. São exatamente os mesmos dois produtos escalares, obtidos aqui **em uma única operação** em vez de um cálculo repetido por neurônio. É toda a vantagem: uma camada de 500 neurônios não exige 500 produtos escalares escritos um a um, mas um único produto matriz-vetor, `W · x`.

> **Cuidado:** multiplicar uma matriz por um vetor cujo tamanho não corresponde ao número de colunas da matriz: o `W` acima (2×2) só pode multiplicar um vetor de 2 elementos. As bibliotecas de cálculo lançam um erro explícito nesse caso em vez de adivinhar.
>
> **Boa prática:** verificar que o número de colunas da matriz corresponde exatamente ao tamanho do vetor, antes de qualquer multiplicação.

## O produto matriz-matriz: processar vários exemplos ao mesmo tempo (o *batch*)

Uma única entrada por vez continua sendo ineficiente na escala do treinamento de um modelo. Na prática, vários exemplos (um **lote**/*batch*, veja [O treinamento de um modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) são empilhados em linhas em uma matriz `X`, e um único produto matricial calcula a saída de todos os exemplos ao mesmo tempo:

```text
X (2 exemplos, 2 entradas cada):   [ 1.0  2.0 ]
                                     [ 0.5  1.5 ]

W (2 neuronios, transposta para a ocasiao):   [ 0.5   0.2 ]
                                                [-0.3   0.4 ]

X · W = [ 1.0×0.5+2.0×(-0.3)   1.0×0.2+2.0×0.4 ]   [ -0.1   1.0 ]
        [ 0.5×0.5+1.5×(-0.3)   0.5×0.2+1.5×0.4 ] = [ -0.2   0.7 ]
```

Cada linha do resultado corresponde a um exemplo, cada coluna a um neurônio: as duas saídas do primeiro exemplo ((-0.1, 1.0)) caem exatamente no resultado calculado acima com `W · x`, obtido aqui junto com as do segundo exemplo.

**A regra das dimensões:** multiplicar uma matriz (*m*×*n*) por uma matriz (*n*×*p*) dá uma matriz (*m*×*p*); o número de colunas da primeira deve sempre ser igual ao número de linhas da segunda:

```text
(m × n)  ·  (n × p)  =  (m × p)
      \_______/
    precisam ser iguais
```

> **Cuidado:** um produto matricial **não é comutativo**: `A · B` e `B · A` geralmente não dão o mesmo resultado, e um dos dois pode até não ser definido caso as dimensões não permitam (diferente da soma de números, onde a ordem nunca importa).
>
> **Boa prática:** sempre verificar a ordem das matrizes em um produto: `A · B` e `B · A` são dois cálculos diferentes, nunca intercambiáveis por padrão.

## Como um resultado do produto matricial é calculado

A regra geral, da qual as duas seções anteriores são apenas casos particulares: o elemento na posição (linha *i*, coluna *j*) do resultado é o [produto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) da linha *i* da primeira matriz com a coluna *j* da segunda. Nada de novo matematicamente: é a mesma operação de um vetor, repetida uma vez para cada casa do resultado.

## Produto matricial contra produto termo a termo: não confundir

Duas operações distintas têm nomes parecidos e se confundem facilmente:

| Operação | Nome | Cálculo | Dimensões |
|---|---|---|---|
| `A · B` | Produto matricial | Produto escalar linha × coluna (veja acima) | (*m*×*n*) · (*n*×*p*) = (*m*×*p*) |
| `A ⊙ B` | Produto termo a termo ([*Hadamard*](https://en.wikipedia.org/wiki/Hadamard_product_(matrices))) | Cada casa de `A` multiplicada pela casa correspondente de `B` | `A` e `B` precisam ter exatamente as mesmas dimensões |

> **Cuidado:** no NumPy (veja o capítulo [NumPy](/?c=data-science&p=numpy)), `A * B` calcula o produto **termo a termo**, não o produto matricial: é `A @ B` (ou `np.dot(A, B)`) que deve ser usado para um verdadeiro produto matricial. Usar `*` por reflexo onde `@` era o pretendido não causa sempre um erro (se as dimensões coincidirem por coincidência), o que torna essa armadilha particularmente difícil de identificar.
>
> **Boa prática:** sempre verificar qual dos dois produtos uma biblioteca de cálculo aplica a um determinado operador, em vez de supor que `*` sempre designa a mesma operação de uma linguagem ou biblioteca para outra.

## A transposta: trocar linhas e colunas

A **transposta** de uma matriz (anotada `Aᵀ`) troca suas linhas e colunas:

```text
     [ 1  2  3 ]                [ 1  4 ]
A =  [ 4  5  6 ]      Aᵀ =      [ 2  5 ]
                                 [ 3  6 ]
```

Uma matriz 2×3 se torna uma matriz 3×2. A transposta serve na maioria das vezes para reorientar uma matriz para que suas dimensões correspondam às esperadas por um produto matricial: é exatamente por essa razão que `W` foi transposta no exemplo do lote acima, para que suas colunas (uma por neurônio) se alinhem com as colunas de `X`.

## O custo do cálculo: por que o hardware importa tanto

Calcular `A · B` para duas matrizes *n*×*n* exige, no método ingênuo, *n*³ multiplicações; um custo que cresce **muito** mais rápido que o tamanho das matrizes:

```python
# Versao ingenua: tres loops encadeados
def produto_matricial(A, B, n):
    resultado = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                resultado[i][j] += A[i][k] * B[k][j]
    return resultado
```

Dobrar o tamanho de uma matriz não dobra o tempo de cálculo: ele é multiplicado por 8 (2³). É exatamente por isso que o tamanho de um modelo (o número de neurônios por camada, o tamanho de um lote) tem um custo de hardware que cresce muito rápido, e por que a [GPU](/?c=infrastructure&p=cpu-vs-gpu) e a [vetorização SIMD](/?c=performance&p=cache-cpu-et-simd) existem: o produto matricial é precisamente o tipo de cálculo (repetitivo, idêntico, em dados independentes) que uma GPU acelera melhor, o que explica por que o treinamento de um modelo de deep learning quase sempre é feito em GPU em vez de CPU.

> **Cuidado:** escrever você mesmo um loop de produto matricial (como acima) em código real. Uma implementação ingênua ignora tudo o que foi visto em [Cache da CPU e vetorização](/?c=performance&p=cache-cpu-et-simd) (localidade de memória, SIMD): uma biblioteca como o NumPy pode ser de dezenas a centenas de vezes mais rápida no mesmo cálculo, com resultado estritamente idêntico.
>
> **Boa prática:** sempre delegar um produto matricial a uma biblioteca otimizada (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)...) em vez de escrever o loop você mesmo. Veja também o capítulo [NumPy](/?c=data-science&p=numpy).

## Onde as matrizes aparecem concretamente em IA

| Elemento | O que representa | Capítulo relacionado |
|---|---|---|
| Pesos de uma camada | Uma matriz, uma linha por neurônio | [As redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) |
| Um lote de entradas | Uma matriz, uma linha por exemplo | [O treinamento e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) |
| Uma tabela de embeddings | Uma matriz, uma linha por palavra do vocabulário | [NLP e LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| A atenção de um Transformer | Produtos matriciais entre matrizes de consultas/chaves/valores | [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) |

Nos quatro casos, o princípio permanece o mesmo visto neste capítulo: substituir uma série de cálculos repetidos por um único produto matricial, para que o hardware (GPU, SIMD) possa executá-los em paralelo em vez de um por um.

## O que reter

| | |
|---|---|
| **O que reter** | Uma matriz organiza números em linhas e colunas; um vetor é um caso particular dela. O produto matricial calcula vários produtos escalares em uma única operação (vários neurônios, ou vários exemplos de um lote): é essa operação, repetida em escala muito grande, que faz o deep learning funcionar. |
| **Ferramentas úteis** | `@` ou `np.dot()` no NumPy para um verdadeiro produto matricial (nunca `*`, que multiplica termo a termo); a transposta para reorientar uma matriz antes de um produto. |
| **Armadilhas a evitar** | Multiplicar duas matrizes cujas dimensões internas não correspondem. Confundir produto matricial e produto termo a termo. Supor que `A · B` e `B · A` dão o mesmo resultado. Escrever seu próprio loop de produto matricial em código real. |
| **Boas práticas** | Verificar as dimensões antes de qualquer produto matricial. Sempre verificar qual operador uma biblioteca usa para qual produto. Delegar todo cálculo matricial a uma biblioteca otimizada (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) em vez de reimplementá-lo. |
