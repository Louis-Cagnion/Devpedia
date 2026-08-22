---
order: 4
---

# El feed de noticias: construir el flujo de cada uno (fan-out)

Un feed de noticias (Instagram, pero el principio es idéntico en la mayoría de redes sociales) debe mostrar, para cada usuario, las publicaciones de todas las cuentas que sigue, en orden. El problema no es almacenar las publicaciones: es saber **cuándo** ensamblar, para cada usuario, la lista de lo que debe ver. Dos estrategias opuestas responden a esta pregunta, llamadas **fan-out** (difusión) en escritura o en lectura.

## Fan-out en escritura (push): preparar el flujo por adelantado

En cuanto una cuenta publica, el sistema escribe inmediatamente esa publicación en el flujo **ya precalculado** de cada uno de sus seguidores:

```text
La cuenta A publica
   |
   v
Escribe la publicacion en el flujo precalculado de:
   Seguidor 1, Seguidor 2, Seguidor 3, ... Seguidor n
   (tantas escrituras como seguidores)

Mas tarde, el seguidor 1 abre su feed:
   -> lee directamente su flujo ya listo (rapido)
```

Leer el feed se vuelve entonces muy rápido (una simple lectura de una lista ya lista), a costa de un trabajo de escritura multiplicado en cada publicación.

## Fan-out en lectura (pull): ensamblarlo todo en el momento de consultar

Al contrario, nada se precalcula al publicar. Cuando un usuario abre su feed, el sistema va a buscar en directo las últimas publicaciones de todas las cuentas que sigue, y las ensambla en ese momento:

```text
La cuenta A publica
   |
   v
No pasa nada para los seguidores (escritura unica, poco costosa)

Mas tarde, el seguidor 1 abre su feed:
   -> va a buscar las ultimas publicaciones de CADA cuenta seguida
   -> las ensambla y ordena en ese instante (costoso si sigue muchas cuentas)
```

## Comparativa y el "problema de la celebridad"

| | Fan-out en escritura (push) | Fan-out en lectura (pull) |
|---|---|---|
| Coste al publicar | Una escritura por seguidor | Una única escritura, poco costosa |
| Coste al leer el feed | Una simple lectura, muy rápida | Ensamblar y ordenar en directo, más lento |
| Caso problemático | Una cuenta seguida por millones de personas: una sola publicación desencadena millones de escrituras simultáneas | Un usuario que sigue miles de cuentas: cada apertura del feed consulta miles de fuentes |

> **Trampa:** elegir únicamente el fan-out en escritura para una red donde algunas cuentas tienen millones de seguidores (el "problema de la celebridad"). Una sola publicación de tal cuenta desencadenaría tantas escrituras como seguidores de una vez, un pico que incluso un sistema con [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) absorbe con dificultad.
>
> **Buena práctica:** un modelo **híbrido**, utilizado por la mayoría de las grandes redes sociales: fan-out en escritura para la mayoría de las cuentas (pocos seguidores, lectura rápida garantizada), y cambio automático a un fan-out en lectura por encima de cierto número de seguidores (las publicaciones de una cuenta-celebridad se obtienen en directo en el momento de la lectura, en lugar de empujarse en masa en cada publicación). Las escrituras masivas del fan-out en escritura se delegan a su vez a una [cola](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) en segundo plano, para que el autor de la publicación no espere a que terminen todas esas escrituras antes de recibir una confirmación.

## Resumen

| | |
|---|---|
| **Para recordar** | El fan-out en escritura precalcula el flujo de cada seguidor al publicar (lectura rápida, escritura costosa a gran escala); el fan-out en lectura ensambla el flujo bajo demanda (escritura ligera, lectura más costosa). Un modelo híbrido cambia a la lectura para las cuentas con un número muy grande de seguidores. |
| **Herramientas utilizables** | Una cola para distribuir las escrituras masivas del fan-out en escritura en segundo plano. |
| **Trampas a evitar** | Generalizar el fan-out en escritura a todas las cuentas sin excepción, incluidas las de millones de seguidores. |
| **Buenas prácticas** | Modelo híbrido, con un umbral de número de seguidores que cambia el comportamiento. |
