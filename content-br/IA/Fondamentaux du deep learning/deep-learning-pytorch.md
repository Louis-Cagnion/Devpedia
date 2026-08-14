---
order: 4
---

# Deep learning com PyTorch

O **PyTorch** é um dos dois frameworks de deep learning mais usados (junto com o [TensorFlow](https://www.tensorflow.org)). Ele fornece o **tensor**: uma estrutura que armazena um [vetor](/?c=mathematiques&p=vecteurs-et-produit-scalaire) ou uma [matriz](/?c=mathematiques&p=matrices-et-produit-matriciel) de números (próximo do `ndarray` da biblioteca [NumPy](/?c=data-science&p=numpy) para quem já a conhece), com duas capacidades adicionais: executar em [GPU](/?c=infrastructure&p=cpu-vs-gpu), e calcular automaticamente seu próprio gradiente. O PyTorch automatiza assim toda a mecânica do capítulo sobre [o treinamento e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## O tensor: números que podem calcular seu próprio gradiente

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape  # torch.Size([3])
x + 2    # operações vetorizadas, como o produto escalar visto anteriormente
```

Um tensor PyTorch pode viver na CPU ou em uma GPU (`x.to("cuda")`), que executa as mesmas operações vetorizadas massivamente em paralelo (veja [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)): é isso que torna viável o treinamento de redes com milhões, ou até bilhões, de parâmetros.

> **Cuidado:** misturar, em um mesmo cálculo, um tensor que ficou na CPU e um tensor movido para a GPU (por exemplo o modelo na GPU, mas um lote de dados esquecido na CPU). O PyTorch rejeita a operação com um erro explícito em vez de adivinhar onde realizar o cálculo.
>
> **Boa prática:** mover sistematicamente **todos** os elementos envolvidos em um cálculo (modelo e dados) para o mesmo dispositivo antes de usá-los juntos, nunca apenas um dos dois.

## `autograd`: a diferenciação automática

```python
x = torch.tensor(3.0, requires_grad=True)   # "acompanhe as operações em x para poder derivar depois"

y = x ** 2 + 2 * x

y.backward()    # calcula dy/dx automaticamente (retropropagação)

print(x.grad)   # 8.0 -> pois dy/dx = 2x + 2, avaliado em x=3 -> 2*3 + 2 = 8
```

`requires_grad=True` indica ao PyTorch para memorizar cada operação aplicada a esse tensor; `.backward()` então percorre automaticamente essa cadeia de operações para calcular o gradiente (veja [a derivada e o gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)), exatamente o mecanismo descrito conceitualmente em [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), mas totalmente automatizado.

## Definir uma rede com `nn.Module`

```python
import torch.nn as nn

class RedeSimples(nn.Module):
    def __init__(self):
        super().__init__()
        self.camada1 = nn.Linear(10, 32)   # camada totalmente conectada: 10 entradas -> 32 saídas
        self.ativacao = nn.ReLU()
        self.camada2 = nn.Linear(32, 1)     # 32 entradas -> 1 saída

    def forward(self, x):
        x = self.camada1(x)
        x = self.ativacao(x)
        x = self.camada2(x)
        return x

modelo = RedeSimples()
```

`nn.Linear(entradas, saidas)` cria automaticamente os pesos e bias correspondentes (veja [As redes neurais: os fundamentos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)); `forward()` descreve o trajeto dos dados pelas camadas, exatamente como a "passagem para frente" detalhada manualmente nesse mesmo capítulo.

> **Cuidado:** esquecer `super().__init__()` no início de `__init__()`. Essa linha inicializa os mecanismos internos de `nn.Module` (incluindo o rastreamento dos pesos): sem ela, o resto da classe falha ou se comporta de forma inconsistente, muitas vezes com uma mensagem de erro pouco clara.
>
> **Boa prática:** sempre chamar `super().__init__()` como primeira linha do construtor de uma classe que herda de `nn.Module`, antes de definir qualquer camada.

## O loop de treinamento típico

```python
import torch.optim as optim

funcao_perda = nn.MSELoss()                         # erro quadrático médio
otimizador = optim.SGD(modelo.parameters(), lr=0.01)  # descida do gradiente estocástica

for epoca in range(100):
    predicoes = modelo(X_treinamento)                       # equivale a modelo.forward(X_treinamento)
    perda = funcao_perda(predicoes, y_treinamento)

    otimizador.zero_grad()  # zera os gradientes (senão eles se somam de uma iteração para outra)
    perda.backward()        # calcula os gradientes (retropropagação automática)
    otimizador.step()       # ajusta os pesos de acordo com os gradientes calculados

    if epoca % 10 == 0:
        print(f"Época {epoca}: perda = {perda.item():.4f}")
```

Esse loop é a estrutura quase universal de todo treinamento PyTorch: prever, medir o erro, retropropagar, ajustar, repetido por tantas épocas quantas forem necessárias para que a perda diminua suficientemente (veja [O treinamento de um modelo e a descida do gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) para o que cada etapa realmente significa).

> **Cuidado:** esquecer `otimizador.zero_grad()`. O PyTorch **acumula** os gradientes por padrão a cada `.backward()` em vez de substituí-los, uma decisão de design útil para alguns casos avançados, mas que distorce o treinamento padrão se os gradientes nunca forem zerados entre dois lotes.
>
> **Boa prática:** chamar sistematicamente `zero_grad()` antes de cada `.backward()`, em cada iteração do loop de treinamento, sem exceção.

## Modo avaliação vs treinamento

```python
modelo.eval()          # desativa comportamentos específicos do treinamento (ex.: dropout)
with torch.no_grad():  # desativa o rastreamento de gradientes: mais rápido, inútil fora do treinamento
    predicoes = modelo(X_test)

modelo.train()   # reativa o modo treinamento para o que vem depois
```

O **dropout** é uma técnica de regularização que desativa aleatoriamente parte dos neurônios em cada passagem, apenas durante o treinamento: isso impede a rede de depender demais de alguns neurônios específicos, e reduz o sobreajuste (veja [Introdução ao machine learning](/?c=data-science&p=machine-learning-scikit-learn)).

> **Cuidado:** esquecer `modelo.eval()` antes de uma predição fora do treinamento. O dropout continuaria ativo, desativando aleatoriamente neurônios: a mesma entrada produziria então saídas levemente diferentes a cada chamada, uma fonte de inconsistência difícil de diagnosticar se a causa não for conhecida.
>
> **Boa prática:** alternar explicitamente para `eval()` antes de qualquer predição fora do treinamento, e envolver esse cálculo em `torch.no_grad()` para evitar rastrear gradientes que se tornaram inúteis, o que economiza memória e tempo de cálculo.

Veja também [Arquiteturas: CNN, RNN e Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers): o PyTorch fornece camadas prontas para cada uma (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), sobre os mesmos blocos básicos vistos aqui.

## O que reter

| | |
|---|---|
| **O que reter** | O PyTorch fornece o tensor (cálculo vetorizado, GPU, gradiente automático via `autograd`), `nn.Module` para definir uma rede, e um loop de treinamento padrão (prever, medir a perda, retropropagar, ajustar). O modo avaliação desativa os comportamentos próprios do treinamento (dropout). |
| **Ferramentas úteis** | `torch.tensor`, `nn.Module`, `nn.Linear`, `optim.SGD` (e variantes), `model.eval()` / `torch.no_grad()`. |
| **Armadilhas a evitar** | Misturar tensores em dispositivos diferentes. Esquecer `super().__init__()` em uma classe `nn.Module`. Esquecer `zero_grad()` antes de `.backward()`. Esquecer `eval()` antes de uma predição fora do treinamento. |
| **Boas práticas** | Mover sistematicamente modelo e dados para o mesmo dispositivo. Sempre chamar `zero_grad()` em cada iteração. Alternar explicitamente para `eval()` + `no_grad()` em qualquer predição fora do treinamento. |
