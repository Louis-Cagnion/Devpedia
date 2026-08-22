---
order: 6
---

# Más allá de la GPU: TPU, NPU, LPU y VPU

El capítulo [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu) opone dos familias de chips: la CPU, generalista, y la GPU, hecha para repetir una misma operación simple sobre miles de datos en paralelo. Pero la GPU sigue siendo bastante polivalente: el mismo chip puede tanto mostrar un videojuego, simular un clima, como entrenar una [red neuronal](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones). Cuando una única tarea muy específica se repite a una escala masiva (un centro de datos que ejecuta miles de millones de veces el mismo tipo de cálculo, o un producto vendido en millones de ejemplares), se vuelve rentable diseñar un chip que solo sepa hacer **esa** tarea, pero que la ejecute más rápido y con menos energía que una GPU generalista.

```text
Generalista                                                    Ultra-especializado
   CPU        ─────────►        GPU        ─────────►   TPU / NPU / LPU / VPU
(hacer de todo,       (paralelizar una              (una sola familia de tarea,
 secuencial)           operacion cualquiera)          a muy gran escala)
```

TPU, NPU, LPU y VPU son cuatro chips nacidos de este mismo principio, cada uno especializado en una tarea diferente.

## TPU (Tensor Processing Unit): el cálculo matricial de la IA, aún más específico que la GPU

Una **TPU** (*Tensor Processing Unit*, "unidad de procesamiento de tensores") es un chip diseñado por [Google](https://cloud.google.com/tpu) específicamente para un solo tipo de cálculo: las operaciones matriciales (multiplicaciones y sumas de grandes rejillas de números) que componen casi la totalidad del entrenamiento y del uso de una red neuronal. Una GPU sabe hacer este cálculo, pero sigue diseñada para mucho más; una TPU no sabe hacer más que eso, lo que le permite ir más rápido y consumir menos energía en esta tarea precisa, al precio de no servir para nada más (imposible mostrar un videojuego en una TPU).

> **Analogía:** si la GPU es una cadena de montaje capaz de repetir cualquier gesto simple, la TPU es una máquina-herramienta construida para un solo gesto, y nada más que uno: multiplicar dos rejillas de números entre sí. No sabe hacer nada más, pero lo hace mejor que la cadena de montaje generalista.

Google usa sus TPU en sus propios centros de datos, en particular para hacer funcionar Search o Google Traductor a la escala de miles de millones de peticiones.

## NPU (Neural Processing Unit): la IA embarcada, con batería

Una **NPU** (*Neural Processing Unit*, "unidad de procesamiento neuronal") es un chip presente hoy en la mayoría de los smartphones y ordenadores portátiles recientes, dedicado a hacer funcionar un modelo de IA ya entrenado (la **inferencia**, no el entrenamiento) directamente en el dispositivo, con muy poca energía. Esto es lo que permite a un teléfono difuminar el fondo de una foto en tiempo real o reconocer una palabra clave de voz ("Oye Siri", "OK Google") sin enviar el menor dato a [un servidor remoto](/?c=infrastructure-devops&s=infrastructure&p=le-cloud): el cálculo permanece local, lo que es a la vez más rápido (sin ida y vuelta por la red) y más respetuoso con la privacidad (nada sale del dispositivo).

| | GPU (centro de datos) | NPU (dispositivo personal) |
|---|---|---|
| Dónde ocurre el cálculo | En un servidor remoto | Directamente en el teléfono/laptop |
| Restricción principal | Potencia de cálculo bruta | Consumo de energía (batería) |
| Tarea típica | Entrenar un modelo | Hacer funcionar un modelo ya entrenado |

## LPU (Language Processing Unit): generar texto, token por token, sin rodeos

Una **LPU** (*Language Processing Unit*) es un chip diseñado por la empresa [Groq](https://groq.com/blog/the-groq-lpu-explained) únicamente para la inferencia de los grandes modelos de lenguaje (los [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)): producir el texto de respuesta una palabra (más precisamente un [token](/?c=ia&s=nlp-llm&p=nlp-et-llm)) tras otra. Una GPU clásica debe ir a buscar repetidamente los pesos del modelo en una memoria externa bastante lenta en cada token generado, lo que limita su velocidad ("el muro de la memoria"). La LPU evita este problema manteniendo todo el modelo en una memoria directamente integrada en el chip, mucho más rápida, y ejecutando los cálculos en un orden fijado de antemano en lugar de decidido dinámicamente: esta ejecución predecible permite una generación de texto especialmente rápida y regular.

## VPU (Vision Processing Unit): la visión por computadora en continuo, con batería

Una **VPU** (*Vision Processing Unit*) es un chip especializado en el análisis de imagen y vídeo en tiempo real, con un coste energético mínimo. Un chip como el [Movidius Myriad X de Intel](https://www.intel.com/content/www/us/en/developer/topic-technology/edge-5g/hardware/vision-accelerator-movidius-vpu.html) consume alrededor de 1,5 vatios (frente a varios cientos de vatios de una GPU de centro de datos) mientras analiza un flujo de vídeo en continuo: este tipo de chip equipa drones, cámaras de vigilancia o cascos de realidad aumentada, donde el vídeo debe analizarse permanentemente sin agotar nunca una batería.

## Comparativa de los cinco chips

| Chip | Especialidad | Contexto de uso típico | Ejemplo concreto |
|---|---|---|---|
| **CPU** | Generalista, secuencial | Cualquier ordenador | Hacer funcionar un sistema operativo |
| **GPU** | Paralela, generalista | Centro de datos, puesto de trabajo | Entrenar una red neuronal, renderizado 3D |
| **TPU** | Cálculo matricial de IA únicamente | Centro de datos (Google) | Hacer funcionar Google Traductor a gran escala |
| **NPU** | Inferencia de IA embarcada, baja energía | Smartphone, laptop | Desenfoque de retrato en tiempo real, asistente de voz local |
| **LPU** | Inferencia de LLM determinista, baja latencia | Servidor de inferencia dedicado (Groq) | Generación de texto token por token muy rápida |
| **VPU** | Visión por computadora, ultra baja energía | Dron, cámara, casco AR/VR embarcado | Detección de objetos en continuo con batería |

> **Trampa:** creer que un chip más especializado es "mejor" en términos absolutos. Es más rápido y más eficiente en energía **únicamente** en la tarea precisa para la que fue diseñado, y estrictamente inutilizable fuera de ella (a diferencia de la CPU, generalista, o incluso de la GPU, que sigue siendo bastante polivalente).
>
> **Buena práctica:** reservar un chip ultra-especializado (TPU, NPU, LPU, VPU) solo para un volumen de cálculo repetitivo lo bastante masivo como para rentabilizar su diseño (la escala de un centro de datos, o de un producto vendido en millones de ejemplares); para todo lo demás, una CPU o una GPU generalista sigue siendo la elección correcta.

## Resumen

| | |
|---|---|
| **Para recordar** | TPU, NPU, LPU y VPU aplican todos el mismo principio que CPU vs GPU, llevando la especialización aún más lejos: un chip que solo sabe hacer una tarea (respectivamente cálculo matricial de IA, inferencia de IA embarcada, inferencia de LLM, visión por computadora) va más rápido y consume menos que un chip generalista en esa tarea precisa. |
| **Herramientas utilizables** | TPU disponibles a través de [Google Cloud](https://cloud.google.com/tpu); NPU ya integradas en la mayoría de smartphones/laptops recientes; LPU accesibles a través de la API de [Groq](https://groq.com/blog/the-groq-lpu-explained); VPU presentes en módulos embarcados como el Movidius. |
| **Trampas a evitar** | Creer que un chip especializado es universalmente mejor que un chip generalista. |
| **Buenas prácticas** | Reservar cada chip ultra-especializado para la escala que justifica su coste de diseño; mantener CPU/GPU para todo lo demás. |
