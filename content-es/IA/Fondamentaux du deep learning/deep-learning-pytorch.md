---
order: 4
---

# Aprendizaje profundo con PyTorch

**PyTorch** es uno de los dos marcos de trabajo de aprendizaje profundo más utilizados (junto con TensorFlow). Proporciona el **tensor** (similar al`ndarray`e NumPy, véase el capítulo dedicado a este tema, pero con soporte para GPU y diferenciación automática), y automatiza toda la mecánica del capítulo sobre el descenso del gradiente.

## El tensor: un «`ndarray`» capaz de calcular su propio gradiente

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape       # torch.Size([3])
x + 2          # Operaciones vectorizadas, como con NumPy
```

Un tensor de PyTorch puede residir en la CPU o en una **GPU** (`x.to("cuda")`), que ejecuta las mismas operaciones vectorizadas de forma masivamente paralela; esto es lo que hace viable el entrenamiento de redes que cuentan con millones, o incluso miles de millones, de parámetros.

## `autograd` : la diferenciación automática

```python
x = torch.tensor(3.0, requires_grad=True)   # «Sigue las operaciones sobre x para poder derivar más adelante».

y = x ** 2 + 2 * x

y.backward()    # Calcula dy/dx automáticamente (retropropagación; véase el capítulo dedicado a este tema).

print(x.grad)   # 8,0 -> ya que dy/dx = 2x + 2, evaluado para x = 3 -> 2 × 3 + 2 = 8
```

`requires_grad=True` Indica a PyTorch que memorice cada operación aplicada a este tensor; a continuación, `.backward()` recorre automáticamente esta cadena de operaciones para calcular el gradiente —exactamente el mecanismo descrito conceptualmente en el capítulo sobre el descenso del gradiente, pero totalmente automatizado—.

## Configurar una red con`nn.Module`

```python
import torch.nn as nn

class ReseauSimple(nn.Module):
    def __init__(self):
        super().__init__()
        self.couche1 = nn.Linear(10, 32)   # Capa totalmente conectada: 10 entradas -> 32 salidas
        self.activation = nn.ReLU()
        self.couche2 = nn.Linear(32, 1)     # 32 entradas -> 1 salida

    def forward(self, x):
        x = self.couche1(x)
        x = self.activation(x)
        x = self.couche2(x)
        return x

modelo = ReseauSimple()
```

`nn.Linear(entrees, sorties)` Crea automáticamente los pesos y sesgos correspondientes (véase el capítulo sobre redes neuronales); `forward()` describe el recorrido de los datos a través de las capas, exactamente igual que la «propagación hacia adelante» detallada manualmente en ese mismo capítulo.

## El bucle de control típico

```python
import torch.optim as optim

fonction_perte = nn.MSELoss()                             # error cuadrático medio (véase el capítulo dedicado a este tema)
optimiseur = optim.SGD(modelo.parameters(), lr=0.01)        # descenso de gradiente estocástico

for epoque in range(100):
    predictions = modelo(X_entrainement)                    # equivale a modele.forward(X_entrenamiento)
    perte = fonction_perte(predictions, y_entrainement)

    optimiseur.zero_grad()   # Reinicia los gradientes (de lo contrario, se suman de una iteración a otra)
    perte.backward()          # Calcula los gradientes (retropropagación automática)
    optimiseur.step()          # ajusta los pesos según los gradientes calculados

    if epoque % 10 == 0:
        print(f"Époque {epoque} : perte = {perte.item():.4f}")
```

Este bucle es la estructura prácticamente universal de cualquier entrenamiento con PyTorch: predecir, medir el error, realizar la retropropagación, ajustar — y repetir este proceso tantas épocas como sea necesario para que la pérdida disminuya lo suficiente (véase el capítulo sobre el descenso del gradiente para saber qué significa realmente cada paso).

> **Nota:** «`optimiseur.zero_grad()`» es un paso fácil de pasar por alto, pero esencial: PyTorch **acumula** los gradientes por defecto en cada `.backward()` en lugar de sustituirlos, una decisión de diseño útil para ciertos casos avanzados, pero que distorsionaría el entrenamiento estándar si los gradientes nunca se reiniciaran entre dos lotes.

## Modo de evaluación frente a modo de entrenamiento

```python
modelo.eval()    # desactiva comportamientos específicos del entrenamiento (p. ej., dropout)
with torch.no_grad():   # Desactiva el seguimiento de gradientes: más rápido, innecesario fuera del entrenamiento
    predictions = modelo(X_test)

modelo.train()   # Reactiva el modo de entrenamiento para lo que viene a continuación
```

> **Nota:** el **«dropout»** es una técnica de regularización que desactiva aleatoriamente una parte de las neuronas en cada iteración, únicamente durante el entrenamiento; esto evita que la red dependa en exceso de unas pocas neuronas concretas y reduce el sobreaprendizaje (véase el capítulo sobre scikit-learn). Se desactiva en el modo de evaluación (`modelo.eval()`): en ese caso, se busca una predicción estable que utilice todas las neuronas.

Véase también el capítulo sobre las arquitecturas CNN/RNN/Transformer: PyTorch proporciona capas listas para usar para cada una de ellas (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), basadas en los mismos componentes básicos que se ven aquí.
