---
order: 4
---

# Efectos de renderizado e interacción 3D

Una vez cargada una escena (el [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) y mostrada ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), surgen a menudo tres necesidades: enriquecer visualmente el renderizado (un efecto de posprocesado), animarla sin datos externos, y permitir que el usuario interactúe con ella con el ratón. Este capítulo cubre estas tres necesidades.

## La aberración cromática: un efecto de posprocesado

La luz blanca que atraviesa un material refractivo (vidrio, agua) no se desvía exactamente igual según su color: es la **aberración cromática**, visible en fotografía como una franja de color en los contornos de alto contraste. Un motor de renderizado puede simular este efecto deliberadamente, en posprocesado: en lugar de calcular una sola vez la refracción de un rayo (véase [vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) para las bases del cálculo vectorial usado aquí), se calcula **tres veces**, una por canal de color, con un índice de refracción ligeramente distinto cada vez:

```text
Rayo incidente
      |
      v
  Refraccion con IOR rojo    -> muestrea el canal ROJO del cubemap
  Refraccion con IOR verde   -> muestrea el canal VERDE del cubemap
  Refraccion con IOR azul    -> muestrea el canal AZUL del cubemap
      |
      v
Recombina los 3 canales -> el resultado final, con sus franjas de color
```

Un **cubemap** (una textura compuesta de 6 imágenes, una por cara de un cubo, que representa el entorno alrededor de un objeto) proporciona la imagen refractada: cada uno de los 3 rayos, desviado ligeramente distinto, muestrea ese mismo cubemap en un punto ligeramente distinto, lo que produce la separación de colores.

> **Buena práctica:** mantener los 3 índices de refracción cercanos entre sí (una variación de algunas centésimas basta). Una diferencia demasiado grande produce un resultado que ya no se parece a un vidrio realista, sino a un artefacto visual tosco.

## La animación procedural: recalcular en lugar de reproducir

A diferencia de una animación por **fotogramas clave** (*keyframes*, posiciones grabadas de antemano e interpoladas), una animación **procedural** recalcula la posición o deformación de un objeto en cada fotograma, a partir de una fórmula que depende del tiempo transcurrido, sin ningún dato externo:

```c
float altura = amplitud * sinf(tiempo_transcurrido * velocidad);
posicion.y = altura;   // hace "flotar" un objeto de arriba a abajo, indefinidamente
```

No se almacena ningún dato para esta animación: queda enteramente determinada por la fórmula y el tiempo transcurrido, lo que la hace trivial de mantener indefinidamente (a diferencia de una secuencia de fotogramas clave, necesariamente finita) y barata en memoria.

> **Trampa:** usar directamente el número de fotogramas transcurridos (`frame_count`) en lugar de un tiempo real transcurrido (en segundos). Una animación basada en el número de fotogramas va más rápido en una máquina que muestra más fotogramas por segundo, exactamente la misma trampa ya vista para un [bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) basado en el tiempo.

## El picking con el ratón: encontrar qué objeto 3D se ha pulsado

El **picking** responde a una pregunta precisa: ¿sobre qué objeto, en una escena 3D, acaba de hacer clic el usuario, a partir de una posición 2D (`x`, `y`) en pantalla? El principio: convertir ese clic 2D en un **rayo** en el espacio 3D, y luego comprobar qué objeto toca primero ese rayo.

```text
Clic en pantalla (x, y)
      |
      v  inversa de la matriz de proyeccion, luego de la matriz de vista
Rayo 3D, de la camara hacia la escena
      |
      v  interseccion rayo/objeto (prueba cada objeto de la escena)
Objeto mas cercano tocado por ese rayo -> objeto "pulsado"
```

Concretamente, el clic 2D se convierte primero a coordenadas normalizadas (entre -1 y 1), luego la **inversa** de la matriz de proyección devuelve ese punto al espacio de cámara, y la **inversa** de la matriz de vista lo devuelve después al espacio del mundo: dos transformaciones invertidas, en el orden inverso al usado normalmente para mostrar un objeto 3D en pantalla.

> **Nota:** este mecanismo es el inverso exacto del pipeline de renderizado habitual (mundo → vista → proyección → pantalla), de ahí el uso de matrices **inversas**, en orden **inverso**.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La aberración cromática simula la dispersión de la luz calculando la refracción 3 veces (una por canal de color), con un índice de refracción ligeramente distinto cada vez. Una animación procedural recalcula una posición en cada fotograma vía una fórmula que depende del tiempo real transcurrido, sin datos externos. El picking con el ratón convierte un clic 2D en un rayo 3D vía las matrices de proyección/vista invertidas, en el orden inverso del renderizado normal. |
| **Herramientas utilizables** | Un cubemap para el entorno refractado. Una fórmula temporal (`sinf(tiempo * velocidad)`) para una animación procedural simple. La inversa de las matrices de proyección y vista para el picking. |
| **Trampas a evitar** | Una diferencia demasiado grande entre los índices de refracción (resultado irreal). Animar según el número de fotogramas en lugar del tiempo real transcurrido. |
| **Buenas prácticas** | Mantener los índices de refracción cercanos entre sí para un resultado creíble. Basar siempre una animación en el tiempo real, nunca en el número de fotogramas transcurridos. |
