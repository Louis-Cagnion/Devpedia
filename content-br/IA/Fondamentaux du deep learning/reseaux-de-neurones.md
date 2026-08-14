---
order: 1
---

# As redes neurais: os fundamentos

O **machine learning** consiste em fazer um programa aprender um comportamento a partir de dados, em vez de ditar cada regra explicitamente (veja [Introdução ao machine learning](/?c=data-science&p=machine-learning-scikit-learn) para ir mais longe). Uma **rede neural artificial** é uma família de modelos de machine learning: uma [função matemática](/?c=mathematiques&p=la-fonction-mathematique), composta de muitas unidades de cálculo simples ("neurônios") organizadas em camadas, cujos parâmetros se ajustam automaticamente a partir de dados em vez de serem escritos à mão.

## O neurônio artificial

Um neurônio recebe várias entradas, calcula uma **soma ponderada** (veja o [produto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire): é exatamente esse cálculo, entre o vetor das entradas e o vetor dos pesos), soma um **bias**, e então aplica uma **função de ativação**:

```text
saida = ativacao(w1*x1 + w2*x2 + w3*x3 + ... + bias)
```

```python
def neuronio(entradas, pesos, bias, ativacao):
    soma_ponderada = sum(e * p for e, p in zip(entradas, pesos)) + bias
    return ativacao(soma_ponderada)
```

- Os **pesos** (`w1`, `w2`...) determinam a importância de cada entrada: são eles, junto com o bias, que o treinamento vai ajustar (veja [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
- O **bias** permite que a saída seja deslocada mesmo quando todas as entradas valem zero (como o coeficiente linear de uma reta).

> **Cuidado:** omitir o bias. Sem ele, a saída de um neurônio vale sempre zero quando todas as entradas valem zero, sejam quais forem os pesos: o neurônio nunca consegue deslocar sua resposta independentemente de suas entradas, o que limita fortemente o que ele pode aprender a representar.
>
> **Boa prática:** incluir sistematicamente um bias em um neurônio, exceto quando há razão específica para forçar uma saída nula com entradas nulas.

## Por que uma função de ativação é indispensável

Sem função de ativação (ou com uma função linear), empilhar várias camadas de neurônios equivaleria matematicamente a... uma única operação linear: a composição de várias funções lineares permanece linear, seja qual for o número de camadas empilhadas. A função de ativação introduz uma **não linearidade**, indispensável para que a rede consiga aprender padrões complexos (uma fronteira de decisão curva, por exemplo, em vez de uma simples reta).

| Função de ativação | Fórmula (simplificada) | Uso típico |
|---|---|---|
| **Sigmoide** | Comprime qualquer valor entre 0 e 1 | Saída de uma classificação binária (uma [probabilidade](/?c=mathematiques&p=les-probabilites-de-base)) |
| **Tanh** | Comprime qualquer valor entre -1 e 1, centrada em 0 | Camadas ocultas de redes mais antigas (RNN principalmente); costuma convergir melhor que a sigmoide graças a essa centralização |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)`: deixa passar os valores positivos, zera os negativos | Camadas ocultas, muito usada na prática (simples e eficiente de calcular) |
| **Leaky ReLU** | `x` se positivo, `0.01 * x` caso contrário (em vez de zerar) | Camadas ocultas, como a ReLU, quando o "neurônio morto" (veja abaixo) é um problema |
| **GELU** | Variante suavizada da ReLU, ponderada pela distribuição normal | Camadas ocultas dos [Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) modernos |
| **Softmax** | Transforma um vetor de scores em uma [distribuição de probabilidade](/?c=mathematiques&p=les-probabilites-de-base) que soma 1 | Saída de uma classificação com várias categorias |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

> **Cuidado:** usar a sigmoide na saída de uma classificação com **várias** categorias (mais de duas). A sigmoide produz uma probabilidade independente por categoria, sem garantia de que a soma seja 1: a softmax é construída justamente para produzir uma distribuição de probabilidade válida sobre várias categorias ao mesmo tempo (veja a [soma igual a 1 de uma distribuição](/?c=mathematiques&p=les-probabilites-de-base)).
>
> **Boa prática:** escolher a função de ativação de saída de acordo com o número de categorias a distinguir: sigmoide para uma escolha binária, softmax a partir de duas categorias que se excluem mutuamente.

> **Cuidado: o "neurônio morto" (*dying ReLU*).** Se a entrada ponderada de um neurônio ReLU permanece negativa em todos os exemplos de treinamento, sua saída vale sempre 0, e seu gradiente (veja [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)) também: esse neurônio deixa então de aprender definitivamente, sem que nenhum erro sinalize isso.
>
> **Boa prática:** substituir a ReLU pela Leaky ReLU (ou uma variante próxima) nas camadas onde esse problema é observado: a pequena inclinação mantida do lado negativo sempre deixa passar um gradiente não nulo, que permite ao neurônio se recuperar.

## As camadas de uma rede

```text
Entrada -> [Camada oculta 1] -> [Camada oculta 2] -> ... -> Saída
```

- **Camada de entrada**: recebe os dados brutos (os pixels de uma imagem, as palavras de uma frase codificadas em números...).
- **Camadas ocultas**: cada uma transforma a representação recebida da camada anterior: quanto mais camadas ("*deep* learning"), mais a rede consegue representar padrões abstratos e complexos.
- **Camada de saída**: produz o resultado final (uma probabilidade, uma categoria, um valor numérico...).

> **Cuidado:** adicionar camadas sem ter dados suficientes para treiná-las corretamente. Uma rede muito profunda em relação à quantidade de dados disponível memoriza os exemplos de treinamento em vez de aprender um padrão geral (veja o sobreajuste em [Introdução ao machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Boa prática:** ajustar a profundidade da rede à quantidade de dados realmente disponível, em vez de empilhar camadas esperando um ganho automático.

## Uma passagem para frente (*forward pass*), passo a passo

Para uma rede mínima com uma única camada oculta de 2 neurônios, e uma entrada `[1.0, 2.0]`:

```python
entradas = [1.0, 2.0]

# Neurônio 1 da camada oculta
pesos_n1 = [0.5, -0.3]
bias_n1 = 0.1
saida_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # relu(0.0) = 0

# Neurônio 2 da camada oculta
pesos_n2 = [0.2, 0.4]
bias_n2 = 0.0
saida_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Camada de saída (1 neurônio, a partir das 2 saídas anteriores)
pesos_saida = [0.6, 0.9]
bias_saida = 0.05
resultado = sigmoide(saida_n1 * 0.6 + saida_n2 * 0.9 + 0.05)  # sigmoide(0.95) ≈ 0.72
```

Esse cálculo (multiplicar, somar, aplicar uma ativação, camada após camada) é **tudo** o que uma rede neural faz para produzir uma predição. O que torna a rede "inteligente" nunca é esse mecanismo (fixo, puramente aritmético), mas sim os **valores dos pesos e dos bias**, ajustados automaticamente pelo treinamento (veja [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) a partir de um grande número de exemplos.

Na prática, um framework de deep learning nunca calcula neurônio por neurônio como no código acima: os pesos de uma camada inteira são organizados em uma [matriz](/?c=mathematiques&p=matrices-et-produit-matriciel), e um único produto matricial calcula a saída de todos os seus neurônios de uma vez, muito mais rápido que um loop Python.

Neste exemplo, os pesos já estão fixados em valores precisos para ilustrar o cálculo; no início real de um treinamento, eles partem, ao contrário, de valores aleatórios.

> **Cuidado:** inicializar todos os pesos de uma camada com o **mesmo** valor (geralmente zero). Todos os neurônios dessa camada calculariam exatamente a mesma coisa a cada etapa, e continuariam a aprender de forma idêntica: a rede perde a capacidade de fazer seus neurônios aprenderem papéis diferentes.
>
> **Boa prática:** inicializar os pesos com pequenos valores aleatórios (veja [aleatoriedade e geradores](/?c=representation-des-donnees&p=aleatoire-et-generateurs)), diferentes entre si, para que cada neurônio parta de um ponto de partida distinto.

## Uma rede = uma função aproximadora

Vista sob esse ângulo, uma rede neural não é nada além de uma [função matemática](/?c=mathematiques&p=la-fonction-mathematique) parametrizada (por seus pesos e bias), flexível o suficiente para aproximar uma relação complexa entre uma entrada (uma imagem, um texto...) e uma saída (uma categoria, uma sequência de palavras...), desde que haja dados representativos suficientes para ajustar corretamente esses parâmetros.

> **Cuidado:** confiar em uma rede sobre entradas muito diferentes das vistas no treinamento. Uma função aproximada a partir de exemplos só permanece confiável dentro do domínio coberto por esses exemplos; fora dele, sua saída não tem nenhuma garantia de continuar relevante.
>
> **Boa prática:** verificar se os dados realmente submetidos ao modelo em uso permanecem representativos dos dados de treinamento, em vez de supor que o modelo "generaliza" indefinidamente além disso.

Veja também [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) (como esses pesos são concretamente ajustados) e [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (formas específicas de organizar essas camadas de acordo com o tipo de dado tratado).

## O que reter

| | |
|---|---|
| **O que reter** | Um neurônio artificial calcula uma soma ponderada de suas entradas (um produto escalar), soma um bias, e então aplica uma função de ativação não linear. Uma rede empilha esses neurônios em camadas (entrada, ocultas, saída); seus pesos e bias se ajustam pelo treinamento. |
| **Ferramentas úteis** | As funções de ativação comuns (sigmoide, tanh, ReLU, Leaky ReLU, GELU, softmax) são fornecidas diretamente pelas bibliotecas de deep learning (veja [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Armadilhas a evitar** | Omitir o bias. Usar sigmoide para uma classificação com várias categorias. Um neurônio ReLU que "morre" (gradiente nulo permanentemente). Empilhar camadas sem dados suficientes. Inicializar todos os pesos com o mesmo valor. Confiar no modelo fora do domínio coberto por seus dados de treinamento. |
| **Boas práticas** | Escolher a ativação de saída de acordo com o número de categorias (sigmoide vs softmax). Trocar para Leaky ReLU em caso de neurônios mortos. Ajustar a profundidade da rede à quantidade de dados disponível. Inicializar os pesos com pequenos valores aleatórios distintos. |
