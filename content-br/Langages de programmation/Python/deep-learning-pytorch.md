---
order: 20
---

# Deep learning com PyTorch

**O PyTorch** é uma das duas estruturas de aprendizagem profunda mais utilizadas (juntamente com o TensorFlow). Fornece o **tensor** (semelhante ao `ndarray` NumPy, ver capítulo dedicado, mas com suporte para GPU e diferenciação automática) e automatiza toda a mecânica do capítulo sobre o gradiente descendente.

## O tensor: um «`ndarray`» capaz de calcular o seu próprio gradiente

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # operações vetorizadas, tal como no NumPy
```

Um tensor PyTorch pode ser executado na CPU ou numa **GPU** (`x.to("cuda")`), que executa as mesmas operações vetorizadas de forma massivamente paralela — é isso que torna viável o treino de redes com milhões, ou mesmo milhares de milhões, de parâmetros.

## `autograd` : a diferenciação automática

```python
x = torch.tensor(3.0, requires_grad=True)   # «Regista as operações realizadas em x para poder derivar mais tarde»

y = x ** 2 + 2 * x

y.backward()    # calcula dy/dx automaticamente (retropropagação, ver capítulo dedicado)

print(x.grad)   # 8,0 -> pois dy/dx = 2x + 2, calculado para x = 3 -> 2 × 3 + 2 = 8
```

`requires_grad=True` indica ao PyTorch para memorizar cada operação aplicada a este tensor; o «`.backward()`» reconstrói então automaticamente esta cadeia de operações para calcular o gradiente — exatamente o mecanismo descrito conceptualmente no capítulo sobre o gradiente descendente, mas totalmente automatizado.

## Definir uma rede com o «`nn.Module`»

```python
import torch.nn as nn

class ReseauSimple(nn.Module):
    def __init__(self):
        super().__init__()
        self.couche1 = nn.Linear(10, 32)   # camada totalmente conectada: 10 entradas -> 32 saídas
        self.activation = nn.ReLU()
        self.couche2 = nn.Linear(32, 1)     # 32 entradas -> 1 saída

    def forward(self, x):
        x = self.couche1(x)
        x = self.activation(x)
        x = self.couche2(x)
        return x

modelo = ReseauSimple()
```

`nn.Linear(entrees, sorties)` cria automaticamente os pesos e os viéses correspondentes (ver capítulo sobre redes neurais); `forward()` descreve o percurso dos dados através das camadas, exatamente como a «passagem para a frente» detalhada manualmente nesse mesmo capítulo.

## O ciclo de treino típico

```python
import torch.optim as optim

fonction_perte = nn.MSELoss()                             # erro quadrático médio (ver capítulo dedicado)
optimiseur = optim.SGD(modelo.parameters(), lr=0.01)        # descida do gradiente estocástico

for epoque in range(100):
    predictions = modelo(X_entrainement)                    # equivale a modele.forward(X_treino)
    perte = fonction_perte(predictions, y_entrainement)

    optimiseur.zero_grad()   # reinicia os gradientes (caso contrário, estes somam-se de uma iteração para a outra)
    perte.backward()          # calcula os gradientes (retropropagação automática)
    optimiseur.step()          # ajusta os pesos de acordo com os gradientes calculados

    if epoque % 10 == 0:
        print(f"Époque {epoque} : perte = {perte.item():.4f}")
```

Este ciclo é a estrutura praticamente universal de qualquer treino em PyTorch: prever, medir o erro, retropropagar, ajustar — repetido tantas épocas quantas forem necessárias para que a perda diminua suficientemente (ver o capítulo sobre o gradiente descendente para saber o que cada etapa significa realmente).

> **Nota:** `optimiseur.zero_grad()` é um passo fácil de esquecer, mas essencial — por predefinição, o PyTorch **acumula** os gradientes a cada `.backward()` em vez de os substituir, uma decisão de conceção útil para alguns casos avançados, mas que distorceria o treino padrão se os gradientes nunca fossem reinicializados entre dois lotes.

## Modo de avaliação vs. modo de treino

```python
modelo.eval()    # desativa comportamentos específicos do treino (por exemplo, dropout)
with torch.no_grad():   # desativa o acompanhamento dos gradientes: mais rápido, desnecessário fora do treino
    predictions = modelo(X_test)

modelo.train()   # Reativa o modo de treino para a continuação
```

> **Nota:** o **dropout** é uma técnica de regularização que desativa aleatoriamente uma parte dos neurónios a cada iteração, apenas durante o treino — isto impede que a rede dependa excessivamente de alguns neurónios específicos e reduz o sobreaprendizado (ver capítulo sobre o scikit-learn). É desativado no modo de avaliação (`modelo.eval()`): neste caso, pretende-se uma previsão estável, utilizando todos os neurónios.

Ver também o capítulo sobre as arquiteturas CNN/RNN/Transformer: o PyTorch fornece camadas prontas a utilizar para cada uma delas (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), com base nos mesmos blocos de construção básicos aqui apresentados.
