---
order: 4
---

# CPU vs GPU: el cálculo paralelo

Un ordenador ejecuta sus cálculos en uno o varios **procesadores**, pero existen dos familias de procesadores, diseñadas para dos tipos de tareas muy diferentes: el **CPU** (*Central Processing Unit*), presente en todo ordenador, y el **GPU** (*Graphics Processing Unit*), pensado originalmente para la visualización gráfica.

## El CPU: unos pocos obreros polivalentes y rápidos

Un CPU dispone de pocos **núcleos** (típicamente de 4 a algunas decenas): cada uno capaz de ejecutar instrucciones complejas muy rápidamente, incluidas ramificaciones (si tal condición, hacer esto, si no, hacer aquello).

> **Analogía:** un pequeño equipo de unos pocos obreros altamente cualificados, cada uno capaz de gestionar solo una tarea compleja de principio a fin, adaptándose a cada imprevisto.

## El GPU: miles de obreros simples, al mismo tiempo

Un GPU, en cambio, dispone de **miles** de núcleos, cada uno más simple y menos polivalente que un núcleo de CPU, pero todos capaces de ejecutar la **misma** operación simultáneamente, cada uno sobre un dato diferente.

> **Analogía:** una cadena de montaje con miles de obreros, cada uno repitiendo el mismo gesto simple sobre una pieza diferente, todos al mismo tiempo: mucho más rápido para este tipo de tarea repetitiva, pero cada obrero, tomado solo, solo sabe hacer un gesto.

## Por qué el cálculo vectorial se beneficia especialmente del GPU

El [producto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre dos vectores (y más generalmente, todo cálculo matricial) repite una misma operación simple (multiplicar dos números, sumar) miles o millones de veces, sobre datos independientes entre sí:

```text
Multiplicar dos vectores de 1000 numeros, termino a termino:

CPU (unos pocos nucleos)   : procesa las 1000 multiplicaciones en varias oleadas sucesivas
GPU (miles de nucleos)     : puede procesar las 1000 multiplicaciones casi todas de una vez
```

Es exactamente este tipo de cálculo (repetitivo, idéntico, sobre datos independientes) el que compone casi la totalidad de las operaciones efectuadas por una [red neuronal](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): de ahí el uso sistemático de un GPU para el entrenamiento de un modelo de deep learning.

| | CPU | GPU |
|---|---|---|
| Número de núcleos | Unos pocos (4 a algunas decenas) | Miles |
| Potencia por núcleo | Alta, polivalente | Baja, especializada |
| Adecuado para | Tareas secuenciales, lógica compleja, ramificaciones | Tareas repetitivas e idénticas, sobre datos independientes |
| Ejemplo de uso | Ejecutar un sistema operativo, un navegador | Entrenar una red neuronal, renderizado gráfico 3D |

## Trampa: mover datos entre CPU y GPU tiene un coste

El CPU y el GPU tienen cada uno su propia memoria: hacer que el GPU calcule un dato supone **transferirlo** primero desde la memoria del CPU, y luego recuperar el resultado en sentido inverso. Esta transferencia toma tiempo, independientemente de la rapidez del cálculo en sí.

> **Trampa:** transferir datos entre CPU y GPU en cada pequeña operación. El coste fijo de cada transferencia puede superar la ganancia de paralelismo obtenida, si los datos movidos son demasiado pequeños o si la transferencia se repite con demasiada frecuencia.
>
> **Buena práctica:** agrupar los datos a procesar en un mínimo de transferencias (una sola transferencia voluminosa en lugar de miles de pequeñas), y reservar el GPU para cálculos lo bastante voluminosos como para rentabilizar este coste de transferencia.

## Trampa: un GPU no acelera cualquier cálculo

> **Trampa:** esperar que un GPU acelere cualquier programa. Un procesamiento donde cada etapa depende del resultado de la anterior (imposible de repartir entre núcleos independientes), o que se basa en numerosas ramificaciones condicionales diferentes según el dato, no se beneficia de miles de núcleos simples diseñados para repetir la misma operación.
>
> **Buena práctica:** reservar el GPU para cálculos realmente paralelizables (la misma operación simple, repetida sobre un gran número de datos independientes) y dejar el resto al CPU.

## CUDA: el software que permite explotar concretamente un GPU

Saber que un GPU puede paralelizar un cálculo no basta para explotarlo: hace falta una forma de enviarle trabajo. **CUDA** es la plataforma de software y el modelo de programación de NVIDIA que lo hace posible en sus GPU.

El CPU prepara los datos, los transfiere al GPU, lanza funciones llamadas **kernels**, y luego recupera el resultado. Un kernel nunca se ejecuta una sola vez: miles de hilos del GPU lo ejecutan en paralelo, cada uno sobre un dato distinto:

```text
CPU  : prepara los datos --> transfiere al GPU --> lanza un kernel --> recupera el resultado
GPU  : miles de hilos ejecutan ESE MISMO kernel, cada uno sobre su propio dato
```

Sobre CUDA, bibliotecas ya hechas evitan reescribir estos kernels a mano: `cuBLAS` para el cálculo matricial, `cuDNN` para las operaciones de deep learning, `NCCL` para hacer comunicarse varios GPU entre sí. Un framework como [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch) se apoya en estas bibliotecas por debajo: enviar un tensor "al GPU" dispara justamente este mecanismo CPU/kernel/hilos, sin exponerlo nunca directamente.

> **Nota:** la ventaja de NVIDIA no se debe solo a la potencia bruta de sus chips. Años de bibliotecas y hábitos de desarrollo se han construido alrededor de CUDA: competir con NVIDIA supone entonces competir con todo ese ecosistema de software, no solo producir un chip más rápido.

## Resumen

| | |
|---|---|
| **Para recordar** | Un CPU tiene pocos núcleos polivalentes y rápidos, adecuados para tareas secuenciales y ramificaciones. Un GPU tiene miles de núcleos simples, adecuados para repetir la misma operación sobre datos independientes: el caso del cálculo vectorial/matricial detrás de una red neuronal. CUDA es la plataforma de NVIDIA que permite enviar concretamente trabajo a un GPU (kernels ejecutados en paralelo por miles de hilos). |
| **Herramientas utilizables** | Las bibliotecas de deep learning ([PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch), [TensorFlow](https://www.tensorflow.org)) gestionan la transferencia de datos hacia el GPU y la paralelización del cálculo automáticamente, vía CUDA y bibliotecas como `cuBLAS`/`cuDNN`/`NCCL`. |
| **Trampas a evitar** | Transferir datos entre CPU y GPU con demasiada frecuencia o en cantidades demasiado pequeñas. Esperar una aceleración de un GPU en un cálculo intrínsecamente secuencial. |
| **Buenas prácticas** | Agrupar las transferencias CPU/GPU en un mínimo de operaciones voluminosas. Reservar el GPU para cálculos realmente paralelizables. |
