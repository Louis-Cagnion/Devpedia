---
order: 1
---

# C

Un [lenguaje de programación](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) es un conjunto de reglas que permite escribir instrucciones que un ordenador puede ejecutar. El C es uno de ellos, conocido por su acceso directo a los mecanismos fundamentales de la máquina.

```c
#include <stdio.h>

int main(void) {
    int edad = 25;         // una variable, consulta el capítulo dedicado
    printf("%d\n", edad);  // muestra: 25
    return 0;
}
```

| Término | Qué significa |
|---|---|
| Bajo nivel | Da acceso directo a la memoria y al hardware: pocos mecanismos ocultos entre el código escrito y lo que realmente hace el procesador |
| Compilado | El código fuente se traduce de una vez por todas a instrucciones máquina nativas (véase [La compilación](/?c=langages-de-programmation&s=c&p=compilation)) antes de la ejecución, a diferencia de un lenguaje interpretado como [Python](/?c=langages-de-programmation&s=python&p=python) |
| Gestión manual de la memoria | El programa debe reservar y liberar él mismo la memoria que necesita (véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)), sin ningún mecanismo automático |

Esta cercanía con el hardware permite comprender mejor lo que realmente ocurre durante la ejecución de un programa: cómo se almacenan los datos en memoria, cómo el procesador ejecuta las instrucciones. Por eso el C sigue siendo ampliamente utilizado para los sistemas operativos, los controladores de hardware, los sistemas embebidos, y sirve de base a numerosos otros lenguajes: véase por ejemplo [C++](/?c=langages-de-programmation&s=cpp&p=cpp), que se apoya directamente en él.
