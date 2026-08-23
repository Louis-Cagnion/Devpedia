---
order: 7
---

# Las herramientas de fuzzing avanzadas

[Pruebas y auditoría de seguridad](/?c=cybersecurite&p=tests-et-audit-de-securite) planteó el principio del **fuzzing**: bombardear un programa con entradas inesperadas para provocar un fallo revelador de una vulnerabilidad. Este capítulo va más lejos, en el terreno del herramental real: cómo un fuzzer moderno (AFL, libFuzzer) hace mucho más que simplemente probar entradas al azar.

## El fuzzing guiado por la cobertura de código

Un fuzzer puramente aleatorio genera entradas sin ninguna retroalimentación sobre su efecto: la mayoría no llega a probar más que los primerísimos caminos del programa (ej.: una validación de formato que rechaza la entrada antes incluso de llegar al código interesante). Un fuzzer **guiado por la cobertura** (*coverage-guided*) instrumenta el programa para saber, en cada ejecución, qué líneas de código se han alcanzado, y luego prioriza las mutaciones que exploran caminos nuevos nunca alcanzados antes.

```text
1. El fuzzer mantiene un conjunto de entradas "interesantes" (el corpus), minimo al principio
2. Muta una entrada del corpus (cambia un byte, anade uno, quita uno...)
3. Ejecuta el programa con esa entrada mutada, midiendo la cobertura de codigo alcanzada
4. Si esa mutacion alcanza codigo nunca cubierto antes -> se anade al corpus, y a su vez
   se convertira en base para futuras mutaciones
5. Si el programa falla -> se guarda la entrada exacta responsable para su analisis
```

Este bucle explica por qué un fuzzer guiado por la cobertura encuentra, en unas horas, caminos que un fuzzer puramente aleatorio no alcanzaría nunca en varios años: cada hallazgo útil se convierte en el punto de partida del siguiente, en lugar de partir de cero en cada intento.

## Los sanitizers: detectar una corrupción incluso sin fallo visible

Un [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) que solo sobrescribe un byte vecino sin hacer fallar el programa sigue siendo invisible para un fuzzer que solo vigila los fallos. Un **sanitizer** (ej.: *AddressSanitizer*, ASan) recompila el programa con comprobaciones adicionales que detectan este tipo de acceso a memoria inválido en el momento en que se produce, aunque de otro modo no hubiera provocado ningún fallo visible:

| Sin sanitizer | Con sanitizer |
|---|---|
| El desbordamiento sobrescribe silenciosamente un dato vecino, el programa sigue normalmente | El desbordamiento se detecta de inmediato, el programa se detiene con un informe preciso (archivo, línea, tipo de error) |

## Triaje: distinguir un fallo real de un duplicado

Una campaña de fuzzing puede generar miles de fallos en unas horas, muchos de los cuales comparten en realidad la misma causa profunda. El **triaje** consiste en agrupar esos fallos por causa real (a menudo mediante la pila de llamadas en el momento del fallo, véase [Cómo se ejecuta realmente un programa](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)), para tratar cada bug distinto una sola vez en lugar de miles de ocurrencias del mismo problema.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un fuzzer guiado por la cobertura prioriza las mutaciones que exploran código nunca alcanzado, mucho más eficaz que un intento puramente aleatorio. Un sanitizer detecta una corrupción de memoria incluso sin fallo visible. El triaje agrupa los fallos encontrados por causa real en lugar de tratarlos uno por uno. |
| **Herramientas utilizables** | AFL o libFuzzer para el fuzzing guiado por cobertura; AddressSanitizer para detectar una corrupción silenciosa. |
| **Errores a evitar** | Hacer fuzzing sin sanitizer activado: la mayoría de las corrupciones de memoria no provocan ningún fallo inmediato y pasan desapercibidas. |
| **Buenas prácticas** | Iniciar una campaña de fuzzing con un corpus inicial relevante (entradas válidas reales) en lugar de vacío, para alcanzar código útil más rápido. |
