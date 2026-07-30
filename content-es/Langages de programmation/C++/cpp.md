# C++

C++ surgió como una extensión de C («C with Classes») y, a día de hoy, sigue siendo retrocompatible con prácticamente todo el C (véase la sección sobre C): casi todo lo que ya se ha visto allí (punteros, memoria, estructuras, compilación) se aplica directamente en C++. Lo que C++ añade a todo ello es, esencialmente, la **programación orientada a objetos**, la **gestión automática de recursos** (RAII) y la **programación genérica** (plantillas).

Entre los conceptos esenciales que C++ aporta con respecto a C, destacan, entre otros:

- Las clases y los objetos (encapsulación, herencia, polimorfismo)
- Las referencias, una alternativa más segura a los punteros en muchos casos
- RAII y los punteros inteligentes (*smart pointers*), que reducen drásticamente las fugas de memoria descritas en el capítulo dedicado al lenguaje C.
- Las plantillas, para escribir código genérico sin sacrificar el rendimiento
- La biblioteca estándar (STL): contenedores, algoritmos e iteradores listos para usar
- Las excepciones, una alternativa estructurada al estilo de error «al estilo C» (valores de retorno + `errno`)

El aprendizaje de C++ permite mantener el control de bajo nivel de C (memoria, rendimiento, ausencia de recolector de basura), al tiempo que se dispone de herramientas de mayor nivel para estructurar un proyecto de gran envergadura —un equilibrio que explica su presencia duradera en motores de videojuegos, sistemas embebidos exigentes y programas que requieren tanto rendimiento como una gran complejidad de código—.

> **Nota:** a diferencia de PHP, Python o JavaScript, C++ se **compila** en código máquina nativo (véase el capítulo sobre compilación, apartado C); no hay ninguna máquina virtual ni intérprete entre el código y su ejecución.
