---
order: 2
---

# El entrenamiento de un modelo y el descenso de gradiente

Una [red neuronal](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) empieza con pesos **aleatorios**: sus predicciones iniciales no tienen por tanto ningún sentido. **El entrenamiento** es el proceso que ajusta progresivamente estos pesos para que las predicciones se acerquen a las respuestas correctas, a partir de ejemplos.

## La función de pérdida (*loss function*)

Una **función de pérdida** es una [función matemática](/?c=mathematiques&p=la-fonction-mathematique) que mide numéricamente hasta qué punto las predicciones del modelo se alejan de las respuestas correctas: cuanto menor es la pérdida, mejor es el modelo en esos ejemplos concretos.

```python
# Error cuadrático medio (MSE): habitual en una tarea de regresión (predecir un número)
def error_cuadratico_medio(predicciones, valores_reales):
    errores = [(p - v) ** 2 for p, v in zip(predicciones, valores_reales)]
    return sum(errores) / len(errores)

error_cuadratico_medio([3.2, 5.1], [3.0, 5.0])  # pérdida pequeña -> predicciones cercanas
error_cuadratico_medio([1.0, 1.0], [3.0, 5.0])  # pérdida grande -> predicciones alejadas
```

Para una tarea de clasificación, se utiliza más habitualmente la **entropía cruzada** (*cross-entropy*): compara dos [distribuciones de probabilidad](/?c=mathematiques&p=les-probabilites-de-base): la predicha por el modelo y la, conocida, de la respuesta correcta (100 % en la clase correcta, 0 % en las demás). Vale `-log(probabilidad asignada a la clase correcta)`; se reencuentra directamente la propiedad del [logaritmo](/?c=mathematiques&p=le-logarithme) vista antes: cuanto más se acerca esa probabilidad a 0, más se dispara `-log(...)`, penalizando fuertemente una predicción segura pero equivocada:

```python
import math

def entropia_cruzada(probabilidad_clase_correcta):
    return -math.log(probabilidad_clase_correcta)

entropia_cruzada(0.99)  # ~0.01 -> segura Y acertada: pérdida casi nula
entropia_cruzada(0.5)   # ~0.69 -> dudosa: pérdida moderada
entropia_cruzada(0.01)  # ~4.6  -> segura PERO equivocada: pérdida muy alta
```

> **Trampa:** usar el error cuadrático medio para una clasificación (categorías), o la entropía cruzada para una regresión (un número continuo): cada función de pérdida presupone un tipo de salida preciso, mezclarlas produce un entrenamiento incoherente (véase la misma distinción entre `LinearRegression` y `LogisticRegression` en [Introducción al machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Buena práctica:** elegir la función de pérdida según el tipo de salida esperado (número continuo → MSE, categoría → entropía cruzada), nunca por costumbre o por defecto.

> **Nota:** una función de pérdida debe ser derivable (véase [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)), ya que el entrenamiento calcula su gradiente en cada paso: una restricción matemática, no una elección de legibilidad. Una vez entrenado el modelo, en cambio, se juzga su calidad con métricas pensadas para ser comprendidas por un humano (exactitud, precisión, recall...), no necesariamente derivables; véase [Medir la calidad de un modelo](/?c=data-science&p=machine-learning-scikit-learn).

## El descenso de gradiente: encontrar el mínimo de la pérdida

Entrenar una red equivale exactamente al principio ya visto en [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient): la función de pérdida desempeña el papel de la curva a descender, y los pesos de la red el papel del vector que se ajusta paso a paso, en el sentido opuesto al gradiente:

```python
nuevo_peso = peso_anterior - tasa_aprendizaje * gradiente
```

En cada paso, el algoritmo calcula el gradiente de la pérdida respecto a **cada** peso de la red (potencialmente millones), y luego los ajusta todos simultáneamente en la dirección que reduce la pérdida.

## La tasa de aprendizaje (*learning rate*)

La **tasa de aprendizaje** es la `tasa` de la fórmula anterior: controla el tamaño de cada paso de descenso.

| Tasa de aprendizaje | Efecto |
|---|---|
| Demasiado alta | El modelo "salta" por encima del mínimo, la pérdida oscila o incluso diverge (aumenta en lugar de disminuir) |
| Demasiado baja | El descenso es muy lento, el entrenamiento puede llevar un tiempo excesivo, o quedar atascado en un mínimo local poco satisfactorio |
| Bien ajustada | Descenso regular y razonablemente rápido hacia un buen mínimo |

> **Trampa:** mantener la misma tasa de aprendizaje sin cuestionarla nunca. Una pérdida que se estanca u oscila sin converger casi siempre indica una tasa de aprendizaje mal ajustada, no necesariamente un modelo inadecuado para el problema.
>
> **Buena práctica:** vigilar la evolución de la pérdida a lo largo del entrenamiento, y ajustar la tasa de aprendizaje (a menudo reduciéndola progresivamente) si no evoluciona como se espera, en lugar de tratarla como un parámetro fijado de una vez para siempre.

## La retropropagación (*backpropagation*): calcular el gradiente de forma eficaz

Una red de varias capas es una **composición** de funciones: la salida de la capa 1 se convierte en la entrada de la capa 2, y así sucesivamente. Calcular el efecto de un peso de la primerísima capa sobre la pérdida final supone por tanto remontar toda esta cadena. La **regla de la cadena** (*chain rule*) permite calcular este gradiente sin recalcular cada efecto desde cero: la derivada de una composición de funciones es el producto de las derivadas de cada función que la compone. La **retropropagación** aplica esta regla capa por capa, partiendo de la salida para remontar hacia la entrada:

```text
Sentido del cálculo normal (forward):  Entrada -> Capa 1 -> Capa 2 -> Salida -> Pérdida
Sentido de la retropropagación:        Entrada <- Capa 1 <- Capa 2 <- Salida <- Pérdida
```

> **Nota:** no es una operación que haya que recalcular a mano para usar un framework como [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch): `autograd` (diferenciación automática) realiza este cálculo automáticamente. Comprender el **principio** (propagar el gradiente hacia atrás, capa por capa, mediante la regla de la cadena) basta para razonar sobre por qué surgen ciertos problemas de entrenamiento (ej. el "vanishing gradient", véase [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)).

## Épocas, lotes y descenso de gradiente estocástico

```python
# una "época" = una pasada completa por TODOS los datos
for epoca in range(numero_epocas):
    # un "batch"/lote = un pequeño subconjunto
    for lote in datos_por_lotes(datos, tamano_lote=32):
        predicciones = modelo.forward(lote)
        perdida = calcular_perdida(predicciones, valores_reales)
        gradientes = retropropagar(perdida)
        ajustar_pesos(gradientes, tasa_aprendizaje)
```

En lugar de volver a calcular el gradiente sobre la **totalidad** de los datos en cada paso (lo cual resulta costoso, sobre todo con millones de ejemplos), se suelen utilizar pequeños lotes (*minilotes*), de ahí el nombre **descenso de gradiente estocástico** (SGD): cada ajuste de los pesos se basa en una muestra, no en la totalidad de los datos, lo que introduce un poco de ruido pero acelera considerablemente cada paso.

> **Trampa:** elegir un tamaño de lote mal adaptado a la memoria disponible (véase el coste de las transferencias entre CPU y [GPU](/?c=infrastructure&p=cpu-vs-gpu)): un lote demasiado grande puede superar la memoria disponible, un lote demasiado pequeño multiplica innecesariamente el número de idas y vueltas.
>
> **Buena práctica:** ajustar el tamaño de lote a la memoria realmente disponible (en particular la de la GPU utilizada), en lugar de fijar un valor arbitrario copiado de otro proyecto.

## De dónde vienen los datos, y cómo hacerlos utilizables

Todo lo anterior ya supone datos listos para pasarse al modelo: en la práctica, esta preparación representa a menudo más trabajo que el propio entrenamiento.

**La cantidad y la naturaleza de los datos.** El principio general (recopilar, limpiar, separar en entrenamiento/prueba) es el mismo que para un modelo clásico, véase [el desarrollo típico de un proyecto de machine learning](/?c=data-science&p=machine-learning-scikit-learn): una red neuronal simplemente necesita muchos más, a menudo miles o incluso millones de ejemplos, para ajustar sus numerosos parámetros sin limitarse a memorizarlos. Dos casos se distinguen por la forma de obtener la «respuesta correcta» a comparar con la predicción:

- **Supervisado**: cada ejemplo se etiqueta a mano (una imagen clasificada como "gato", un correo marcado como "spam"): costoso de producir en volumen.
- **Autosupervisado**: la respuesta correcta se deriva automáticamente de los propios datos brutos, sin intervención humana; es el caso de un LLM entrenado para predecir la palabra siguiente (véase [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): la «respuesta correcta» de cada ejemplo de entrenamiento es simplemente la palabra que realmente sigue en el texto fuente. Esto es lo que permite entrenar con volúmenes de texto mucho mayores de los que ningún equipo humano podría etiquetar.

**Transformar datos brutos en datos utilizables.** Una red neuronal solo acepta como entrada un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de números, de **tamaño fijo** (véase la capa de entrada en [Las redes de neuronas](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)), nunca una imagen, un texto o una fila de hoja de cálculo tal cual. Cada tipo de dato tiene su propia etapa de conversión hacia esta forma numérica fija: un texto se divide en tokens y luego se convierte en embeddings (véase [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), una imagen se redimensiona a una resolución fija y luego sus píxeles se normalizan en un intervalo estándar (ej. de 0 a 1, en lugar de 0 a 255), un dato tabular se limpia y sus columnas categóricas se convierten en números (véase [pandas](/?c=data-science&p=pandas)). Sin esta normalización de las escalas, columnas con amplitudes muy diferentes (una edad entre 0 y 100, un salario entre 0 y 100 000) harían que el descenso de gradiente convergiera de forma muy desigual según la dirección.

> **Trampa:** entrenar un modelo con datos no representativos de su uso real (un conjunto de datos sesgado, incompleto, o demasiado distinto de los casos que se encontrarán en producción). El modelo aprende entonces fielmente las regularidades de esos datos (incluyendo sus sesgos) sin que ningún error de código lo señale.
>
> **Buena práctica:** comprobar que los datos de entrenamiento cubren bien la diversidad de casos esperados en el uso real, antes de confiar en la calidad del modelo resultante.

**El entorno necesario.** Un modelo clásico (scikit-learn) se entrena en unos segundos en una CPU ordinaria. Una red neuronal profunda, con sus millones o incluso miles de millones de parámetros, se vuelve rápidamente impracticable sin [GPU](/?c=infrastructure&p=cpu-vs-gpu). En concreto, montar este entorno supone: un framework de deep learning (PyTorch, TensorFlow), dependencias aisladas del resto del sistema para seguir siendo reproducibles (véanse los entornos virtuales en [Python](/?c=langages-de-programmation&s=python&p=modules-et-environnements)), y, en la mayoría de los casos, una máquina equipada con una GPU accesible localmente o alquilada bajo demanda en la [nube](/?c=infrastructure&p=le-cloud) para los entrenamientos demasiado pesados para un ordenador personal. Un notebook (véase [Los notebooks de Jupyter](/?c=data-science&p=jupyter-notebooks)) sigue siendo la herramienta habitual para experimentar rápidamente con una pequeña muestra, antes de lanzar un entrenamiento completo, más largo, mediante un script.

Véase también [Deep learning con PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch), que automatiza por completo este ciclo de entrenamiento (`loss.backward()`, `optimizer.step()`).

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El entrenamiento ajusta los pesos de una red para minimizar una función de pérdida, descendiendo su gradiente paso a paso (véase [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient)). La retropropagación calcula este gradiente de forma eficaz mediante la regla de la cadena. |
| **Herramientas utilizables** | `autograd` (PyTorch y equivalentes) calcula automáticamente el gradiente por retropropagación: ningún cálculo a mano en la práctica. |
| **Trampas a evitar** | Confundir MSE y entropía cruzada según el tipo de salida. Mantener una tasa de aprendizaje mal ajustada sin cuestionarla. Un tamaño de lote incompatible con la memoria disponible. Entrenar con datos no representativos del uso real. |
| **Buenas prácticas** | Elegir la función de pérdida según el tipo de salida. Vigilar la evolución de la pérdida para ajustar la tasa de aprendizaje. Adaptar el tamaño de lote a la memoria realmente disponible. Comprobar la representatividad de los datos de entrenamiento. |
