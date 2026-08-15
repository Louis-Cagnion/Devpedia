---
order: 8
---

# Wireframing y prototipado

La [investigación de usuarios](/?c=ui-ux&p=recherche-utilisateur) dice *quién* usa el producto y *qué problema* resolver. Antes de pasar a una pantalla terminada (colores, tipografía, pulido visual), una etapa intermedia verifica que la **estructura** de la pantalla se sostenga (el **wireframing**), y luego que el **recorrido** entre las pantallas funcione (el **prototipado**).

## El wireframe: la estructura, sin lo visual

Un **wireframe** representa la disposición de los elementos de una pantalla (dónde va el título, dónde va el botón principal, dónde va la lista de resultados) sin ninguna decisión de estilo: sin color definitivo, sin fuente elegida, a menudo solo rectángulos y texto de relleno:

```text
+------------------------------------------+
| [Logo]              [Busqueda...] [Menu]  |
+------------------------------------------+
|                                            |
|  Titulo principal                         |
|  Subtitulo descriptivo                    |
|                                            |
|  [ Boton de accion principal ]            |
|                                            |
+------------------+------------------------+
|  Filtro A         |  Resultado 1           |
|  Filtro B         |  Resultado 2           |
|  Filtro C         |  Resultado 3           |
+------------------+------------------------+
```

Este esquema aplica directamente las palancas de la [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle) (posición, tamaño de los bloques) sin tocar todavía las palancas puramente visuales (color, tipografía): la idea es validar la disposición antes de invertir tiempo en su vestimenta final, que habría que rehacer si cambia la estructura.

## Los niveles de fidelidad

Un wireframe (o un prototipo) se presenta en distintos niveles de detalle, cada uno adaptado a una pregunta diferente:

| Fidelidad | Qué muestra | Costo de modificación | Adecuado para verificar |
|---|---|---|---|
| Baja | Rectángulos, texto de relleno, disposición aproximada | Muy bajo (papel, o unos minutos en una herramienta) | La estructura general y el recorrido lógico |
| Media | Jerarquía real, etiquetas reales, todavía sin estilo visual final | Bajo a moderado | La organización detallada del contenido, los casos límite (texto largo, lista vacía) |
| Alta | Renderizado casi final (colores, tipografía, componentes reales) | Alto (cada cambio retoca un visual terminado) | El detalle de las microinteracciones, la coherencia visual final |

> **Trampa:** presentar un prototipo de alta fidelidad en una etapa en la que aún solo debe validarse la estructura. Un renderizado ya pulido desvía la atención de los evaluadores hacia la estética ("me gusta ese azul") en lugar de hacia lo que todavía importa en esta etapa (¿el recorrido tiene sentido? ¿se encuentra la información?); y cada cambio de estructura cuesta entonces mucho más caro de aplicar.
>
> **Buena práctica:** hacer que el nivel de fidelidad corresponda a la pregunta del momento: baja fidelidad mientras la estructura pueda todavía cambiar, alta fidelidad solo una vez que esté estabilizada.

## El prototipo clicable: simular el recorrido

Un **prototipo clicable** conecta varios wireframes o pantallas entre sí (un clic en "Ver el producto" lleva a la pantalla de producto, un clic en "Volver" regresa a la lista), para que una persona pueda *navegar* por el producto antes de que exista una sola línea de código real:

```text
[Lista de resultados] --clic en un resultado--> [Ficha de producto]
        ^                                            |
        |                                            |
        +-------------------clic en "Volver"----------+
```

Este recorrido simulado permite retomar exactamente el método de la [prueba de usabilidad](/?c=ui-ux&p=recherche-utilisateur) (observar a una persona intentar realizar una tarea, sin ayudarla), pero mucho antes de que empiece el desarrollo, cuando corregir un problema de recorrido solo cuesta rediseñar un enlace en lugar de retomar una función ya programada.

> **Trampa:** solo prototipar el camino "ideal" (el que el equipo de diseño tiene en mente) y dejar que cualquier salida de ese camino lleve a una pantalla no prevista, o a nada en absoluto. Una persona que prueba el prototipo casi siempre se desvía del camino previsto en algún momento: eso es justamente lo que un wireframe en papel o un prototipo pobremente conectado no revela antes de la puesta en producción.
>
> **Buena práctica:** prototipar también los caminos secundarios plausibles (una búsqueda sin resultados, un error de entrada), no solo el escenario que funciona a la primera.

## El ir y venir con la investigación de usuarios

Wireframing/prototipado e [investigación de usuarios](/?c=ui-ux&p=recherche-utilisateur) no son dos etapas secuenciales aisladas, sino un bucle repetido: un prototipo (incluso de baja fidelidad) sirve de soporte a una nueva prueba de usabilidad, cuyos resultados guían la versión siguiente del wireframe, probada a su vez:

```text
Wireframe/prototipo -> Prueba de usabilidad -> Hallazgos -> Wireframe revisado -> ...
```

Cada vuelta de este bucle cuesta tanto menos cuanto más baja se ha mantenido la fidelidad: una razón más para subir de fidelidad solo una vez que la estructura se haya estabilizado tras varias vueltas de este bucle.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El wireframe fija la estructura de una pantalla sin estilo visual; el prototipo clicable conecta varias pantallas para simular un recorrido completo. Ambos existen en distintos niveles de fidelidad (baja/media/alta), cada uno adaptado a una pregunta diferente, y se articulan en bucle con la investigación de usuarios en lugar de como etapa aislada. |
| **Herramientas utilizables** | Papel y lápiz o una herramienta digital para un wireframe de baja fidelidad; una herramienta de prototipado para conectar varias pantallas en un recorrido clicable. |
| **Trampas a evitar** | Presentar alta fidelidad cuando la estructura todavía debe cambiar. Solo prototipar el camino ideal, sin las salidas de recorrido plausibles. |
| **Buenas prácticas** | Hacer corresponder la fidelidad con la pregunta del momento. Prototipar también los caminos secundarios (error, resultado vacío). Cerrar el bucle con una prueba de usabilidad en cada iteración en lugar de una sola vez al final del diseño. |
