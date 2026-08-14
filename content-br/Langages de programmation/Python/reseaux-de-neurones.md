---
order: 18
---

# As redes neurais — os conceitos básicos

Uma **rede de neurónios artificiais** é um modelo de aprendizagem automática (ver capítulo dedicado) composto por numerosas unidades de cálculo simples («neurónios»), organizadas em camadas e interligadas entre si — uma estrutura vagamente inspirada no funcionamento biológico, mas que continua a ser, acima de tudo, um objeto matemático: uma função complexa, cujos parâmetros são ajustados automaticamente a partir de dados.

## O neurónio artificial

Um neurónio recebe várias entradas, calcula uma **soma ponderada**, adiciona-lhe um viés e, em seguida, aplica uma **função de ativação**:

```
sortie = activation(w1*x1 + w2*x2 + w3*x3 + ... + biais)
```

```python
def neurone(entrees, poids, biais, activation):
    somme_ponderee = sum(e * p for e, p in zip(entrees, poids)) + biais
    return activation(somme_ponderee)
```

- Os **pesos** (`w1`, `w2`...) determinam a importância de cada entrada — são estes, juntamente com o viés, que o treino irá ajustar (ver capítulo sobre o gradiente descendente).
- O **desvio** permite que a saída seja deslocada mesmo quando todas as entradas são nulas (tal como a ordenada no origem de uma reta).

## Por que razão uma função de ativação é indispensável

Sem uma função de ativação (ou com uma função linear), empilhar várias camadas de neurónios equivaleria matematicamente a... uma única operação linear: a composição de várias funções lineares continua a ser linear, independentemente do número de camadas empilhadas. A função de ativação introduz uma **não-linearidade**, indispensável para que a rede possa aprender padrões complexos (uma fronteira de decisão curva, por exemplo, em vez de uma simples reta).

| Função de ativação | Fórmula (simplificada) | Utilização típica |
|---|---|---|
| **Sigmoide** | Limita todos os valores entre 0 e 1 | Saída de uma classificação binária (probabilidade) |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)` — deixa passar os valores positivos e define os negativos como 0 | Camadas ocultas, muito utilizadas na prática (simples e eficientes de calcular) |
| **Softmax** | Transforma um vetor de pontuações em probabilidades cuja soma é igual a 1 | Saída de uma classificação com várias categorias |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

## As camadas de uma rede

```
Entrée -> [Couche cachée 1] -> [Couche cachée 2] -> ... -> Sortie
```

- **Camada de entrada**: recebe os dados brutos (os píxeis de uma imagem, as palavras de uma frase codificadas em números...).
- **Camadas ocultas**: cada uma transforma a representação recebida da camada anterior — quanto mais camadas houver («*deep* learning»), mais a rede será capaz de representar padrões abstratos e complexos.
- **Camada de saída**: produz o resultado final (uma probabilidade, uma categoria, um valor numérico...).

## Um «forward* pass*», passo a passo

Para uma rede mínima com uma única camada oculta de 2 neurónios e uma entrada `[1.0, 2.0]`:

```python
entrees = [1.0, 2.0]

# Neurónio 1 da camada oculta
poids_n1 = [0.5, -0.3]
biais_n1 = 0.1
sortie_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # revisado(0,0) = 0

# Neurónio 2 da camada oculta
poids_n2 = [0.2, 0.4]
biais_n2 = 0.0
sortie_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Camada de saída (1 neurónio, a partir das 2 saídas anteriores)
poids_sortie = [0.6, 0.9]
biais_sortie = 0.05
resultado = sigmoide(sortie_n1 * 0.6 + sortie_n2 * 0.9 + 0.05)  # sigmoide(0,95) ≈ 0,72
```

Este cálculo — multiplicar, somar, aplicar uma ativação, camada após camada — é **tudo** o que uma rede neural faz para produzir uma previsão. O que torna a rede «inteligente» nunca é este mecanismo (fixo e puramente aritmético), mas sim os **valores dos pesos e dos viéses**, ajustados automaticamente através do treino (ver capítulo sobre o gradiente descendente) a partir de um grande número de exemplos.

## Uma rede = uma função de aproximação

Visto sob esta perspetiva, uma rede neural não é mais do que uma função matemática parametrizada (pelos seus pesos e viéses), suficientemente flexível para aproximar uma relação complexa entre uma entrada (uma imagem, um texto...) e uma saída (uma categoria, uma sequência de palavras...) — desde que se disponha de dados representativos suficientes para ajustar corretamente esses parâmetros.

Ver também os capítulos sobre o algoritmo de gradiente descendente (como estes pesos são ajustados na prática) e sobre as arquiteturas CNN/RNN/Transformer (formas específicas de organizar estas camadas de acordo com o tipo de dados tratados).
