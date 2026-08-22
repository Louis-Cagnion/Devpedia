---
order: 4
---

# Las pruebas unitarias

La [pirámide de pruebas](/?c=tests&p=pyramide-de-test) sitúa las pruebas unitarias en su base: las más numerosas, las más rápidas, las más baratas de mantener. Este capítulo detalla concretamente lo que verifica este nivel, y cómo escribir una prueba unitaria que siga siendo útil con el tiempo.

## Una unidad, una responsabilidad

Una prueba unitaria verifica una **unidad** de código aislada del resto del programa, casi siempre una única función o método. "Aislada" significa que ninguna dependencia externa real (base de datos, red, sistema de archivos) interviene: esas dependencias se reemplazan por [test doubles](/?c=tests&p=architecture-de-test) cuando la función las necesita.

```text
Función probada: calcularDescuento(precio, porcentaje)

Prueba unitaria:
  entrada: precio=100, porcentaje=10
  resultado esperado: 90
  -> ninguna base de datos, ninguna red, ningún archivo implicado
```

## El trío Arrange / Act / Assert

La gran mayoría de las pruebas unitarias siguen la misma estructura en tres tiempos, sea cual sea el lenguaje o la herramienta de prueba usada:

| Etapa | Papel |
|---|---|
| **Arrange** (preparar) | Establecer los datos y el estado necesarios para la prueba |
| **Act** (actuar) | Llamar a la función o al método probado |
| **Assert** (verificar) | Comparar el resultado obtenido con el resultado esperado |

```text
prueba "calcularDescuento aplica correctamente un porcentaje":
  // Arrange
  precio = 100
  porcentaje = 10

  // Act
  resultado = calcularDescuento(precio, porcentaje)

  // Assert
  verificar que resultado == 90
```

Esta estructura hace que una prueba sea legible de un vistazo, incluso para alguien que no la escribió: dónde están los datos de partida, qué acción se prueba, qué resultado se espera.

> **Trampa:** mezclar varios "Act" en una sola prueba (llamar a varias funciones distintas antes de verificar). Si la prueba falla, es imposible saber cuál de las acciones es la culpable sin depurar.
>
> **Buena práctica:** una prueba unitaria verifica un único comportamiento preciso; si hay que probar varios comportamientos de una misma función, escribir varias pruebas distintas en lugar de una sola que lo haga todo.

## Un nombre de prueba que documenta el comportamiento

El nombre de una prueba unitaria sirve de documentación viva: debe describir el comportamiento esperado, no solo la función llamada.

```text
Nombre poco útil :  test_calcularDescuento()

Nombre útil       :  test_calcularDescuento_aplica_correctamente_un_porcentaje()
                      test_calcularDescuento_devuelve_cero_para_un_descuento_del_100
                      test_calcularDescuento_lanza_un_error_para_un_porcentaje_negativo
```

Un informe de ejecución que lista las pruebas fallidas se vuelve entonces legible directamente por su nombre, sin tener que abrir el código de la prueba para entender qué se rompió.

## Cubrir los casos límite, no solo el caso nominal

Una prueba unitaria que solo verifica el caso normal (el *happy path*) deja pasar los comportamientos en los límites: un valor a cero, una lista vacía, un valor negativo donde solo se esperaba uno positivo.

```text
Función probada: calcularDescuento(precio, porcentaje)

Casos a cubrir:
  - caso nominal      : porcentaje=10  -> descuento aplicado normalmente
  - límite inferior    : porcentaje=0   -> ningún descuento, precio sin cambios
  - límite superior     : porcentaje=100 -> resultado a cero
  - caso inválido       : porcentaje=-5  -> comportamiento esperado a definir
                                             (¿error? ¿valor por defecto?)
```

> **Trampa:** conformarse con una sola prueba sobre el caso nominal y considerar la función "probada". La mayoría de los bugs reales se esconden en los casos límite, nunca ejercitados por una única prueba del camino feliz.
>
> **Buena práctica:** para cada función probada, enumerar explícitamente sus casos límite (valores a cero, vacíos, negativos, máximos) antes de escribir las pruebas, en lugar de descubrirlos después en producción.

## Una prueba que falla por una sola razón

Una prueba unitaria bien diseñada falla por una única causa posible: el comportamiento que verifica ya no es correcto. Una prueba que depende del orden de ejecución de otras pruebas, de un estado global compartido, o de la hora del sistema, puede fallar sin relación con un bug real: es una prueba **inestable** (*flaky*), que erosiona la confianza del equipo en toda la suite de pruebas.

> **Trampa:** una prueba que pasa o falla de forma incoherente de una ejecución a otra, sin cambio de código. Un equipo que se topa con esto regularmente termina ignorando los fallos de pruebas por reflejo, lo que anula el propio sentido de tener pruebas.
>
> **Buena práctica:** tratar una prueba inestable como un bug a corregir con prioridad, no como una molestia a rodear (relanzar la prueba hasta que pase, por ejemplo), porque una prueba en la que ya no se confía no sirve de nada.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una prueba unitaria verifica una única unidad de código aislada, generalmente siguiendo la estructura Arrange/Act/Assert. Su nombre documenta el comportamiento esperado. Debe cubrir los casos límite, no solo el caso nominal, y fallar por una única causa posible. |
| **Herramientas utilizables** | La estructura Arrange/Act/Assert para organizar una prueba. Una lista explícita de casos límite (cero, vacío, negativo, máximo) antes de escribir las pruebas. |
| **Trampas a evitar** | Mezclar varias acciones en una sola prueba. Cubrir solo el caso nominal. Dejar una prueba inestable (flaky) sin corregir. |
| **Buenas prácticas** | Una prueba = un comportamiento verificado. Nombrar una prueba según el comportamiento que verifica. Enumerar los casos límite antes de escribir las pruebas. Corregir una prueba inestable con prioridad en lugar de rodearla. |
