# Descripción

Un programa nunca manipula números o texto "en sí": manipula su **codificación** en memoria, en un número finito de bits. Esta restricción física produce comportamientos que a menudo se atribuyen erróneamente al lenguaje usado, cuando en realidad son comunes a todos: `0.1 + 0.2` no vale exactamente `0.3` en JavaScript, pero tampoco en C, en Python o en PHP.

Esta sección explica estos mecanismos de una vez por todas, independientemente de cualquier lenguaje. Los capítulos de los lenguajes remiten aquí para el "por qué", y se centran en lo que les es propio: los tipos disponibles, las funciones de comparación, los valores particulares.

A continuación encontrarás las distintas nociones:
