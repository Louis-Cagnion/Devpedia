---
order: 2
---

# El entrenamiento de un modelo y el descenso del gradiente

Una red neuronal (véase el capítulo dedicado a este tema) parte de pesos **aleatorios**, por lo que sus predicciones iniciales carecen de sentido. **El entrenamiento** es el proceso que ajusta progresivamente estos pesos para que las predicciones se acerquen a las respuestas correctas, a partir de ejemplos.

## La función de pérdida (*loss function*)

Una **función de pérdida** mide numéricamente en qué medida las predicciones del modelo se alejan de las respuestas correctas: cuanto menor sea la pérdida, mejor será el modelo en esos ejemplos concretos.

```python
# Error cuadrático medio (MSE): habitual en una tarea de regresión (predecir un número)
def erreur_quadratique_moyenne(predictions, vraies_valeurs):
    erreurs = [(p - v) ** 2 for p, v in zip(predictions, vraies_valeurs)]
    return sum(erreurs) / len(erreurs)

erreur_quadratique_moyenne([3.2, 5.1], [3.0, 5.0])   # pequeña pérdida -> predicciones cercanas
erreur_quadratique_moyenne([1.0, 1.0], [3.0, 5.0])    # gran pérdida -> predicciones a largo plazo
```

Para una tarea de clasificación, se suele utilizar **la entropía cruzada** (*cross-entropy*), que penaliza considerablemente una predicción segura pero errónea.

## El descenso por gradiente: encontrar el mínimo de la pérdida

Imagina la función de pérdida como un **relieve**: cada punto de ese relieve corresponde a un conjunto posible de pesos, y su altitud, a la pérdida obtenida con esos pesos. Entrenar el modelo equivale a **descender por ese relieve** hasta su punto más bajo: los pesos que minimizan la pérdida.

```
Perte
  |     .
  |    / \
  |   /   \        <- point de départ (poids aléatoires)
  |  /     \  .
  | /       \/ \
  |/           \___     <- minimum recherché
  +------------------ Valeur du poids
```

En cada paso, el algoritmo calcula el **gradiente** de la pérdida con respecto a cada peso (en qué dirección y en qué medida varía la pérdida si se aumenta ligeramente ese peso) y, a continuación, ajusta el peso en la dirección que **reduce** la pérdida:

```python
nouveau_poids = ancien_poids - taux_apprentissage * gradient
```

## La tasa de aprendizaje (*learning rate*)

La **tasa de aprendizaje** controla la magnitud de cada paso de descenso:

| Tasa de aprendizaje | Efecto |
|---|---|
| Demasiado alto | El modelo «se salta» el mínimo, la pérdida oscila o incluso diverge (aumenta en lugar de disminuir) |
| Demasiado bajo | El descenso es muy lento, el entrenamiento puede llevar un tiempo excesivo o quedarse atascado en un mínimo local poco satisfactorio |
| Bien ajustado | Descenso regular y razonablemente rápido hasta un mínimo adecuado |

Es uno de los parámetros más determinantes (y de los que se ajustan manualmente con mayor frecuencia) en el entrenamiento de una red neuronal.

## La retropropagación (*backpropagation*): calcular el gradiente de forma eficaz

En una red de varias capas, calcular el efecto de **cada** peso sobre la pérdida final parece una tarea costosa: un peso de la primera capa influye en la salida a través de una larga cadena de cálculos intermedios. La **retropropagación** aprovecha la regla de la cadena (*chain rule*) para calcular **todos** estos gradientes de forma eficaz, propagando el error desde la salida hacia la entrada, capa por capa:

```
Sens du calcul normal (forward) :  Entrée -> Couche 1 -> Couche 2 -> Sortie -> Perte
Sens de la rétropropagation :      Entrée <- Couche 1 <- Couche 2 <- Sortie <- Perte
```

> **Nota:** no es necesario comprender este proceso en profundidad desde un punto de vista matemático para utilizar un marco de trabajo como [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch) (véase el capítulo dedicado a ello): la «`autograd`» (derivación automática) realiza este cálculo de forma automática. Basta con comprender el **principio** (propagar el error hacia atrás, capa por capa, mediante la regla de la derivación en cadena) para entender por qué surgen ciertos problemas de entrenamiento (por ejemplo, el «gradiente de desaparición»; véase el capítulo sobre las arquitecturas CNN/RNN/Transformer).

## Epochas, lotes y descenso de gradiente estocástico

```python
for epoque in range(nombre_epoques):        # una «epoca» = un recorrido completo por TODOS los datos
    for lot in donnees_par_lots(datos, taille_lot=32):  # Un «batch»/lote = un pequeño subconjunto
        predictions = modelo.forward(lot)
        perte = calculer_perte(predictions, vraies_valeurs)
        gradients = retropropager(perte)
        ajuster_poids(gradients, taux_apprentissage)
```

En lugar de volver a calcular el gradiente sobre la **totalidad** de los datos en cada paso (lo cual resulta costoso, sobre todo con millones de ejemplos), se suelen utilizar pequeños lotes (*minilotes*), de ahí el nombre **de descenso de gradiente estocástico** (SGD): cada ajuste de los pesos se basa en una muestra, no en la totalidad de los datos, lo que introduce un poco de ruido pero acelera considerablemente cada paso.

Véase también el capítulo sobre PyTorch, que automatiza por completo este ciclo de entrenamiento (`loss.backward()`, `optimizer.step()`).
