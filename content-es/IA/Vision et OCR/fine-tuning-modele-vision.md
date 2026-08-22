---
order: 4
---

# Entrenar y hacer fine-tuning de un modelo de visión para un caso de negocio

Los mecanismos genéricos de entrenamiento ([función de pérdida, descenso de gradiente, retropropagación](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [bucle de PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) se aplican tal cual a un modelo de visión: este capítulo no los repite. Cubre lo que es específico del entrenamiento de un modelo de visión para un caso de negocio preciso (reconocer las facturas de un proveedor dado, por ejemplo): partir de un modelo ya entrenado en lugar de desde cero, y adaptar los datos de imagen en consecuencia.

## Partir de un modelo preentrenado en lugar de desde cero

Entrenar un modelo de visión **desde cero** (pesos aleatorios) supone millones de imágenes anotadas, una necesidad ya señalada en el capítulo sobre el entrenamiento genérico. Para un caso de negocio preciso, ese volumen casi nunca existe: unos pocos cientos a unos pocos miles de ejemplos es más realista, ampliamente insuficiente para aprender a reconocer formas desde la nada.

El **transfer learning** (aprendizaje por transferencia) evita este problema: partir de un modelo ya entrenado en un conjunto de datos generalista muy grande (por ejemplo [ImageNet](https://www.image-net.org/), millones de fotos, miles de categorías), y luego continuar su entrenamiento con los datos específicos del caso de negocio:

```text
Entrenamiento generalista (ya hecho, por otra persona, sobre millones de imagenes):
Pesos aleatorios -> ... -> Modelo que reconoce bordes, texturas, formas comunes

Fine-tuning (a hacer uno mismo, sobre el propio caso de negocio):
Modelo preentrenado -> continuacion del entrenamiento con los propios datos -> modelo adaptado
```

Las primeras capas de un modelo de visión aprenden patrones muy generales (bordes, texturas, esquinas), útiles para cualquier tarea visual; solo las capas más cercanas a la salida son realmente específicas de la tarea de origen. Partir de un modelo preentrenado equivale a reutilizar esta base ya aprendida, y a solo reajustar lo que realmente debe cambiar.

> **Trampa:** entrenar un modelo de visión desde cero para un caso de negocio con pocos datos, por no haber buscado un modelo preentrenado equivalente. El resultado casi siempre sobreajusta (ver el [sobreajuste](/?c=data-science&p=machine-learning-scikit-learn)): el modelo memoriza los pocos ejemplos disponibles en lugar de aprender un patrón general.
>
> **Buena práctica:** buscar sistemáticamente un modelo preentrenado pertinente (en una tarea cercana) antes de considerar un entrenamiento desde cero, reservado para los casos donde el dominio visual es tan particular que ningún modelo existente aprendió nada útil para él.

## Congelar capas: reajustar solo lo que debe cambiar

Una vez cargado el modelo preentrenado, existen varias estrategias, según la cantidad de datos disponibles para el fine-tuning:

| Estrategia | Lo que se reajusta | Cuándo usarla |
|---|---|---|
| **Congelar todo, excepto la última capa** | Únicamente la capa de salida (adaptada a las nuevas categorías) | Muy pocos datos; el dominio visual se parece al del preentrenamiento |
| **Congelar las primeras capas, reajustar las últimas** | Las capas profundas (patrones específicos), no las primeras (patrones genéricos) | Cantidad de datos moderada; el compromiso más habitual |
| **No congelar nada (fine-tuning completo)** | Todas las capas | Datos abundantes; el dominio visual difiere notablemente del preentrenamiento (ej. documentos escaneados en blanco y negro, frente a fotos en color) |

**Congelar** una capa significa excluirla del cálculo de gradiente: sus pesos permanecen fijados en su valor preentrenado, la retropropagación nunca los modifica.

```python
# Cargar un modelo preentrenado y congelar su "backbone" (las capas de extraccion de patrones)
for parametro in modelo.backbone.parameters():
    parametro.requires_grad = False   # excluido del calculo de gradiente, ver autograd

# Solo la nueva capa de salida, anadida para este caso de negocio, sigue siendo entrenable
modelo.cabeza_de_salida = nn.Linear(tamano_features, numero_categorias_negocio)
```

> **Trampa:** usar la misma tasa de aprendizaje que para un entrenamiento desde cero. Una tasa de aprendizaje demasiado alta en fine-tuning modifica bruscamente pesos ya útiles, un fenómeno llamado **olvido catastrófico** (*catastrophic forgetting*): el modelo pierde los patrones genéricos que ya había aprendido, sin haberlos reemplazado por algo mejor.
>
> **Buena práctica:** usar una tasa de aprendizaje notablemente más baja que un entrenamiento desde cero (a menudo de 10 a 100 veces menor) para las capas reajustadas, precisamente porque parten ya de un buen punto de partida en lugar de valores aleatorios.

## Adaptar los datos: la aumentación específica de imagen

Con pocos ejemplos disponibles, la **aumentación de datos** (*data augmentation*) crea artificialmente variantes de cada imagen de entrenamiento, para exponer al modelo a una diversidad que un conjunto de datos pequeño no cubre por sí solo:

```python
from torchvision import transforms

aumentacion = transforms.Compose([
    transforms.RandomRotation(degrees=5),                    # ligero desalineamiento del escaneo
    transforms.ColorJitter(brightness=0.2, contrast=0.2),    # variacion de iluminacion/calidad de escaneo
    transforms.GaussianBlur(kernel_size=3),                  # ligero desenfoque (foto en lugar de escaner)
])
```

Cada transformación debe corresponder a una variación **realmente encontrada** en los datos de producción: para un documento escaneado, una ligera rotación (escaneo mal alineado) o un cambio de luminosidad (calidad del escáner) son realistas; una rotación de 180° o un espejo horizontal casi nunca lo son para texto.

> **Trampa:** aplicar aumentaciones genéricas copiadas de un tutorial sobre clasificación de fotos (rotación a 90°/180°, espejo horizontal), sin haberlas confrontado con las variaciones realmente observadas en los propios documentos. Una rotación a 180° enseñaría al modelo a reconocer texto al revés, un caso que nunca ocurre en la práctica: entrenamiento desperdiciado en un caso irreal, en detrimento de los casos reales.
>
> **Buena práctica:** elegir cada aumentación en función de las variaciones concretamente observadas en ejemplos reales del caso de negocio (calidad de escaneo, ángulo, iluminación), no por defecto desde un ejemplo genérico.

Ver también [El entrenamiento de un modelo y el descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) para el bucle de entrenamiento genérico en el que se inserta todo lo anterior, y [OCR: del reconocimiento de patrones clásico al deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) para un ejemplo de modelo que podría hacerse fine-tuning para un formato de documento propio de una empresa.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El transfer learning parte de un modelo preentrenado en un gran conjunto de datos generalista en lugar de desde cero, indispensable en cuanto los datos del caso de negocio son limitados. Congelar las primeras capas preserva los patrones genéricos ya aprendidos; reajustar solo las últimas capas (o todas, con una tasa de aprendizaje reducida) según el volumen de datos disponible. La aumentación de datos debe reflejar las variaciones realmente encontradas, no transformaciones genéricas. |
| **Herramientas utilizables** | Modelos preentrenados de bibliotecas de visión (torchvision, Hugging Face); `requires_grad = False` para congelar capas; `torchvision.transforms` para la aumentación de datos. |
| **Trampas a evitar** | Entrenar desde cero con pocos datos en lugar de buscar un modelo preentrenado. Mantener una tasa de aprendizaje demasiado alta en fine-tuning (olvido catastrófico). Aplicar aumentaciones irreales para el caso de negocio real. |
| **Buenas prácticas** | Buscar siempre un modelo preentrenado pertinente antes de entrenar desde cero. Reducir notablemente la tasa de aprendizaje en fine-tuning. Elegir las aumentaciones según las variaciones realmente observadas en los propios documentos. |
