---
order: 1
---

# IA de juego por imitación: aprender de un jugador humano

Un adversario controlado por el ordenador (un **bot**) puede construirse de dos formas fundamentalmente distintas: **guionizado** (un desarrollador escribe a mano las reglas de decisión: "si el enemigo es visible, disparar") o **aprendido por imitación** (el comportamiento se deduce automáticamente de grabaciones de partidas jugadas por humanos, sin que nadie escriba la regla explícitamente).

## Bot guionizado vs bot aprendido por imitación

| | Bot guionizado | Bot aprendido por imitación |
|---|---|---|
| Origen del comportamiento | Reglas escritas a mano por un desarrollador | Deducido de grabaciones de partidas humanas |
| Realismo | A menudo reconocible como "artificial" (patrones repetitivos) | Puede reproducir hábitos e imperfecciones humanas |
| Coste de creación | Escribir y mantener cada regla | Recopilar datos de juego, luego entrenar un modelo |
| Comportamiento ante una situación nunca prevista | Sigue la regla más cercana, predecible | Impredecible: el modelo nunca "vio" esa situación en el entrenamiento |

## Grabar partidas para convertirlas en datos de entrenamiento

El principio retoma el del aprendizaje supervisado (ver [Redes neuronales](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)): cada instante de una partida humana se convierte en un ejemplo de entrenamiento, donde el **estado del juego** en ese instante (posición de los jugadores, munición restante, lo que el jugador ve en pantalla...) se asocia a la **acción** que el jugador realizó realmente en ese momento (disparar, moverse, apuntar en tal dirección).

```text
Partida humana grabada, instante a instante:

Estado del juego (entrada)        Accion del jugador (salida esperada)
------------------------          -----------------------------------
enemigo visible, 30 municiones -> disparar
enemigo fuera de la vista       -> moverse hacia el punto A
salud baja                      -> retirarse
```

Miles de estos pares (estado, acción) forman el conjunto de datos. El modelo aprende a predecir la acción más probable a partir de un estado dado, exactamente como un modelo de clasificación de imágenes aprende a predecir una categoría a partir de píxeles.

> **Trampa:** recopilar partidas de un único jugador, o de un estilo de juego demasiado homogéneo. El modelo reproduce entonces fielmente los hábitos de ese jugador concreto (defectos incluidos), en lugar de un comportamiento representativo de un adversario humano "genérico".
>
> **Buena práctica:** diversificar las fuentes de grabación (varios jugadores, varios niveles de habilidad, varios estilos) para que el modelo generalice más allá de los hábitos de un solo individuo.

## La trampa de la generalización: una situación nunca vista

Un modelo entrenado por imitación solo sabe reaccionar a situaciones suficientemente cercanas a las vistas en los datos de entrenamiento. Una configuración de juego inédita (un mapa nunca jugado en las grabaciones, una combinación de objetos rara) puede producir una acción absurda, sin que exista ninguna regla explícita para corregirla, a diferencia de un bot guionizado que siempre sigue su regla más cercana incluso en un caso raro.

> **Trampa:** suponer que un modelo entrenado sobre un contenido de juego (un mapa, un modo) se comportará correctamente sobre un contenido distinto, nunca visto en el entrenamiento.
>
> **Buena práctica:** probar explícitamente el bot sobre contenido ausente de los datos de entrenamiento antes de desplegarlo, en lugar de suponer que el comportamiento aprendido generaliza automáticamente.

## Simular la imperfección humana: la degradación voluntaria de precisión

Un modelo entrenado para maximizar su precisión puede acabar apuntando con una exactitud casi perfecta, un comportamiento que no se parece a ningún jugador humano real y que hace que el adversario se perciba como injusto en lugar de creíble. Una técnica corrige este desajuste: degradar voluntariamente la precisión del bot, por ejemplo añadiendo ruido aleatorio a la dirección de apuntado o simulando un tiempo de reacción variable, para imitar la fatiga y la imperfección de un jugador humano en lugar de la perfección mecánica de un algoritmo.

```text
Precision del modelo "bruta"     ->  casi perfecta, percibida como "trampa"
Precision + ruido aleatorio      ->  variable, se parece a un jugador humano fatigable
```

> **Buena práctica:** calibrar este ruido según el nivel de dificultad buscado (más ruido = adversario más fácil), en lugar de aplicar un valor fijo único para todos los niveles.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un bot aprendido por imitación deduce su comportamiento de grabaciones de partidas humanas (pares estado → acción), en lugar de reglas escritas a mano. Generaliza mal ante una situación ausente de los datos de entrenamiento. Degradar voluntariamente su precisión (ruido, tiempo de reacción variable) lo hace más creíble que una precisión mecánica perfecta. |
| **Herramientas utilizables** | Un modelo de clasificación que predice una acción a partir de un estado de juego, entrenado sobre pares (estado, acción) grabados. |
| **Trampas a evitar** | Entrenar sobre las partidas de un único jugador. Desplegar un bot sobre contenido nunca visto en el entrenamiento sin probarlo antes. |
| **Buenas prácticas** | Diversificar las fuentes de grabación. Probar sobre contenido inédito antes del despliegue. Añadir ruido a la precisión para simular la imperfección humana, calibrado según el nivel de dificultad deseado. |
