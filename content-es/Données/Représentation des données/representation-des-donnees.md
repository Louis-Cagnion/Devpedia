---
order: 3
---

# Représentation des données

Un programa nunca manipula números o texto "en sí": manipula su **codificación** en memoria, en un número finito de bits. Esta restricción física produce comportamientos que a menudo se atribuyen erróneamente al lenguaje usado, cuando en realidad son comunes a todos: `0.1 + 0.2` no vale exactamente `0.3` en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), pero tampoco en [C](/?c=langages-de-programmation&s=c&p=c), en [Python](/?c=langages-de-programmation&s=python&p=python) o en [PHP](/?c=langages-de-programmation&s=php&p=php).

Esta sección explica estos mecanismos de una vez por todas, independientemente de cualquier lenguaje. Los capítulos de los lenguajes remiten aquí para el "por qué", y se centran en lo que les es propio: los tipos disponibles, las funciones de comparación, los valores particulares.

A continuación encontrarás las distintas nociones:
