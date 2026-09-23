---
order: 7
---

# RLHF, RLVR, RLCD: entrenar un modelo para algo distinto de escribir bien

La [metodología](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) y las propiedades calibradas vistas hasta ahora no surgen de un entrenamiento clásico: vienen de una elección deliberada, hecha *después* del entrenamiento base del modelo, sobre qué se busca optimizar. Este capítulo presenta tres enfoques de esta fase de entrenamiento, llamada **post-entrenamiento** (ocurre después del entrenamiento principal detallado en [Entrenamiento y descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).

## El principio común: ajustar un modelo a partir de una señal de retorno

Los tres enfoques siguientes se apoyan en el **aprendizaje por refuerzo** (*reinforcement learning*): en lugar de aprender a reproducir un ejemplo exacto (como el entrenamiento supervisado clásico), el modelo produce una salida, recibe una **señal de retorno** (una recompensa) que juzga esa salida, y ajusta sus parámetros para obtener mejores recompensas la próxima vez. Es el mismo principio que se usaría para adiestrar a un animal a base de premios: ninguna instrucción explícita del gesto a hacer, solo una señal de "bien" o "mal" después del hecho, repetida hasta que emerge el comportamiento buscado. Lo que distingue a RLHF, RLVR y RLCD es **de dónde viene esta señal de recompensa**.

| Enfoque | De dónde viene la recompensa | Optimiza para |
|---|---|---|
| **RLHF** (*Reinforcement Learning from Human Feedback*) | Humanos que comparan respuestas y dicen cuál prefieren | Respuestas apreciadas por humanos (chatbots, asistentes conversacionales) |
| **RLVR** (*Reinforcement Learning with Verifiable Rewards*) | Un verificador automático (ej: una prueba unitaria que pasa, un cálculo con resultado conocido) | Razonamientos correctos en tareas con respuesta verificable (matemáticas, código) |
| **RLCD** (*Reinforcement Learning for Calibrated Decisions*) | La brecha entre la probabilidad anunciada y la frecuencia real del resultado correcto | Probabilidades fiables en lugar de texto generado |

## RLHF: optimizar para la preferencia humana

El **RLHF** es el enfoque más extendido para los [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) conversacionales actuales: evaluadores humanos comparan pares de respuestas a un mismo prompt e indican cuál prefieren, y esta señal sirve luego para entrenar al modelo a producir ese tipo de respuestas con más frecuencia.

## RLVR: optimizar para un resultado verificable

El **RLVR** reemplaza el juicio humano por una verificación automática y objetiva: una prueba unitaria pasa o falla, un resultado de cálculo es correcto o incorrecto. Este enfoque produce modelos de razonamiento eficaces en tareas con respuesta verificable (matemáticas, generación de código verificable), a costa de una inferencia más lenta y más costosa (el modelo "piensa" más tiempo antes de responder).

## RLCD: optimizar para una probabilidad fiable, no para un texto

El **RLCD**, el enfoque usado para entrenar los [modelos de decisión estructurada](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm), no busca ni agradar a un humano ni producir un razonamiento textual: la recompensa mide si la **probabilidad anunciada por el modelo corresponde a la frecuencia real** del resultado correcto sobre muchos casos similares (esta es la definición misma de la [confianza calibrada](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree) vista en el capítulo anterior). Un modelo entrenado por RLCD nunca escribe una respuesta abierta: ni siquiera tiene esa capacidad, ya que nada en su entrenamiento lo empuja hacia ella.

## Un riesgo propio del RLHF: el estrechamiento de la distribución

La documentación del proveedor ilustra un riesgo del RLHF mediante una analogía tomada de otra familia de modelos generativos (las redes generativas antagónicas, o GAN, detalladas en el [artículo de investigación original](https://arxiv.org/abs/1406.2661) si el tema merece profundizarse): el **mode collapse**, cuando un generador se pone a producir repetidamente la misma salida en lugar de cubrir toda la diversidad posible. Un entrenamiento RLHF demasiado intenso puede producir un efecto similar: al optimizar fuertemente para lo que prefiere un humano, el modelo estrecha el abanico de sus respuestas posibles en torno a lo que "agrada", en detrimento de la diversidad y, potencialmente, de la fiabilidad en casos que se alejan de lo que se juzgó preferible.

> **Trampa:** suponer que un modelo optimizado por RLHF (y por tanto juzgado "bueno" por humanos en conversación) es automáticamente fiable para decisiones automatizadas máquina a máquina. La documentación del proveedor resume la distinción: *"la habilidad interpersonal y la fiabilidad de máquina son objetivos de optimización diferentes"*. Un modelo entrenado para agradar no está entrenado para ser exacto ni predecible.
>
> **Buena práctica:** hacer corresponder el método de entrenamiento con el uso real previsto: RLHF para una interfaz conversacional donde importa la calidad percibida por un humano, RLVR para un razonamiento verificable, RLCD para decisiones estructuradas consumidas directamente por código, sin pasar de nuevo por un juicio humano cada vez.

## Interfaz de máquina o interfaz conversacional

Esta distinción refleja una elección de diseño más amplia: un LLM clásico apunta a una **interfaz conversacional** (fluidez narrativa, tono adaptado a un humano) mientras que un modelo de decisión estructurada apunta a una **interfaz de máquina** (predictibilidad, salida directamente utilizable por código, siendo la mayoría de las interacciones en realidad máquina a máquina en lugar de un diálogo con un humano).

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | RLHF, RLVR y RLCD son tres formas de entrenar un modelo después de su entrenamiento base, que difieren en la fuente de la señal de recompensa: la preferencia humana (RLHF), un verificador automático (RLVR), o la brecha entre probabilidad anunciada y frecuencia real (RLCD). Un RLHF demasiado intenso puede estrechar la diversidad de las respuestas (mode collapse), y optimizar para la preferencia humana no optimiza para la fiabilidad de máquina. |
| **Herramientas utilizables** | Ninguna herramienta que manipular directamente; esta distinción guía la elección de un modelo según el uso previsto (conversación, razonamiento verificable, decisión automatizada). |
| **Trampas a evitar** | Suponer que un modelo RLHF, juzgado "bueno" por humanos, es fiable para decisiones automatizadas máquina a máquina. |
| **Buenas prácticas** | Elegir el método de entrenamiento (y por tanto el modelo) según la interfaz realmente buscada: conversacional (RLHF), razonamiento verificable (RLVR), o decisión estructurada consumida por código (RLCD). |
