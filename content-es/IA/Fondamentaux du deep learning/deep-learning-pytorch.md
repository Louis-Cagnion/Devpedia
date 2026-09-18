---
order: 4
---

# Aprendizaje profundo con PyTorch

**PyTorch** es uno de los dos frameworks de deep learning más utilizados (junto con [TensorFlow](https://www.tensorflow.org)). Proporciona el **tensor**: una estructura que almacena un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) o una [matriz](/?c=mathematiques&p=matrices-et-produit-matriciel) de números (parecida al `ndarray` de la biblioteca [NumPy](/?c=data-science&p=numpy) para quien ya la conozca), con dos capacidades adicionales: ejecutarse en [GPU](/?c=infrastructure&p=cpu-vs-gpu), y calcular automáticamente su propio gradiente. PyTorch automatiza así toda la mecánica del capítulo sobre [el entrenamiento y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## El tensor: números capaces de calcular su propio gradiente

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([[1, 2], [3, 4]])

x.shape  # torch.Size([3])
x + 2    # Operaciones vectorizadas, como el producto escalar visto antes
```

Un tensor de PyTorch puede vivir en la CPU o en una GPU (`x.to("cuda")`), que ejecuta las mismas operaciones vectorizadas de forma masivamente paralela (véase [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)): esto es lo que hace viable entrenar redes con millones, incluso miles de millones, de parámetros.

> **Trampa:** mezclar, en un mismo cálculo, un tensor que se quedó en la CPU y un tensor movido a la GPU (por ejemplo, el modelo en GPU pero un lote de datos olvidado en CPU). PyTorch rechaza la operación con un error explícito en lugar de adivinar dónde realizar el cálculo.
>
> **Buena práctica:** mover sistemáticamente **todos** los elementos implicados en un cálculo (modelo y datos) al mismo device antes de usarlos juntos, nunca solo uno de los dos.

## `autograd`: la diferenciación automática

```python
x = torch.tensor(3.0, requires_grad=True)   # "sigue las operaciones sobre x para poder derivar más adelante"

y = x ** 2 + 2 * x

y.backward()    # Calcula dy/dx automáticamente (retropropagación)

print(x.grad)   # 8.0 -> ya que dy/dx = 2x + 2, evaluado en x=3 -> 2*3 + 2 = 8
```

`requires_grad=True` indica a PyTorch que memorice cada operación aplicada a este tensor; `.backward()` recorre entonces automáticamente esta cadena de operaciones para calcular el gradiente (véase [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)), exactamente el mecanismo descrito conceptualmente en [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), pero totalmente automatizado.

## Definir una red con `nn.Module`

```python
import torch.nn as nn

class RedSimple(nn.Module):
    def __init__(self):
        super().__init__()
        self.capa1 = nn.Linear(10, 32)   # Capa totalmente conectada: 10 entradas -> 32 salidas
        self.activacion = nn.ReLU()
        self.capa2 = nn.Linear(32, 1)     # 32 entradas -> 1 salida

    def forward(self, x):
        x = self.capa1(x)
        x = self.activacion(x)
        x = self.capa2(x)
        return x

modelo = RedSimple()
```

`nn.Linear(entradas, salidas)` crea automáticamente los pesos y sesgos correspondientes (véase [Las redes neuronales: conceptos básicos](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)); `forward()` describe el recorrido de los datos a través de las capas, exactamente igual que el "paso hacia adelante" detallado manualmente en ese mismo capítulo.

> **Trampa:** olvidar `super().__init__()` al principio de `__init__()`. Esta línea inicializa los mecanismos internos de `nn.Module` (incluido el seguimiento de los pesos): sin ella, el resto de la clase falla o se comporta de forma incoherente, a menudo con un mensaje de error poco explícito.
>
> **Buena práctica:** llamar siempre a `super().__init__()` en la primerísima línea del constructor de una clase que hereda de `nn.Module`, antes de definir la más mínima capa.

## El bucle de entrenamiento típico

```python
import torch.optim as optim

funcion_perdida = nn.MSELoss()                       # Error cuadrático medio
optimizador = optim.SGD(modelo.parameters(), lr=0.01) # Descenso de gradiente estocástico

for epoca in range(100):
    predicciones = modelo(X_entrenamiento)                    # Equivale a modelo.forward(X_entrenamiento)
    perdida = funcion_perdida(predicciones, y_entrenamiento)

    optimizador.zero_grad()  # Reinicia los gradientes (si no, se suman de una iteración a otra)
    perdida.backward()       # Calcula los gradientes (retropropagación automática)
    optimizador.step()       # Ajusta los pesos según los gradientes calculados

    if epoca % 10 == 0:
        print(f"Época {epoca}: pérdida = {perdida.item():.4f}")
```

Este bucle es la estructura casi universal de cualquier entrenamiento con PyTorch: predecir, medir el error, retropropagar, ajustar, repetido tantas épocas como sea necesario para que la pérdida disminuya lo suficiente (véase [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) para lo que significa realmente cada paso).

> **Trampa:** olvidar `optimizador.zero_grad()`. PyTorch **acumula** los gradientes por defecto en cada `.backward()` en lugar de sustituirlos, una decisión de diseño útil para ciertos casos avanzados, pero que distorsiona el entrenamiento estándar si los gradientes nunca se reinician entre dos lotes.
>
> **Buena práctica:** llamar sistemáticamente a `zero_grad()` antes de cada `.backward()`, en cada iteración del bucle de entrenamiento, sin excepción.

## Modo evaluación frente a entrenamiento

```python
modelo.eval()          # Desactiva comportamientos propios del entrenamiento (ej. dropout)
with torch.no_grad():  # Desactiva el seguimiento de gradientes: más rápido, innecesario fuera del entrenamiento
    predicciones = modelo(X_test)

modelo.train()   # Reactiva el modo entrenamiento para lo que sigue
```

El **dropout** es una técnica de regularización que desactiva aleatoriamente una parte de las neuronas en cada pasada, únicamente durante el entrenamiento: esto impide que la red dependa demasiado de unas pocas neuronas concretas, y reduce el sobreajuste (véase [Introducción al machine learning](/?c=data-science&p=machine-learning-scikit-learn)).

> **Trampa:** olvidar `modelo.eval()` antes de una predicción fuera del entrenamiento. El dropout seguiría activo, desactivando neuronas al azar: la misma entrada produciría entonces salidas ligeramente distintas en cada llamada, una fuente de incoherencia difícil de diagnosticar si se desconoce la causa.
>
> **Buena práctica:** cambiar explícitamente a `eval()` antes de cualquier predicción fuera del entrenamiento, y envolver ese cálculo en `torch.no_grad()` para evitar seguir gradientes que ya no sirven de nada, lo que ahorra memoria y tiempo de cálculo.

Véase también [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers): PyTorch proporciona capas listas para usar para cada una (`nn.Conv2d`, `nn.LSTM`, `nn.TransformerEncoder`...), sobre los mismos componentes básicos vistos aquí.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | PyTorch proporciona el tensor (cálculo vectorizado, GPU, gradiente automático mediante `autograd`), `nn.Module` para definir una red, y un bucle de entrenamiento estándar (predecir, medir la pérdida, retropropagar, ajustar). El modo evaluación desactiva los comportamientos propios del entrenamiento (dropout). |
| **Herramientas utilizables** | `torch.tensor`, `nn.Module`, `nn.Linear`, `optim.SGD` (y variantes), `model.eval()` / `torch.no_grad()`. |
| **Trampas a evitar** | Mezclar tensores en devices distintos. Olvidar `super().__init__()` en una clase `nn.Module`. Olvidar `zero_grad()` antes de `.backward()`. Olvidar `eval()` antes de una predicción fuera del entrenamiento. |
| **Buenas prácticas** | Mover sistemáticamente el modelo y los datos al mismo device. Llamar siempre a `zero_grad()` en cada iteración. Cambiar explícitamente a `eval()` + `no_grad()` para cualquier predicción fuera del entrenamiento. |
