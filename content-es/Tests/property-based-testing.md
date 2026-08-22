---
order: 10
---

# El property-based testing

Todos los tipos de prueba vistos hasta ahora ([unitarias](/?c=tests&p=tests-unitaires), [de integración](/?c=tests&p=tests-dintegration), [E2E](/?c=tests&p=tests-end-to-end)) comparten un mismo principio: elegir ejemplos precisos de entrada, y verificar el resultado esperado para cada uno. El **property-based testing** invierte esta lógica: en lugar de elegir las entradas uno mismo, se describe una **propiedad** que debe seguir siendo cierta para cualquier entrada válida, y una herramienta genera automáticamente cientos de entradas para intentar contradecirla.

## Una prueba clásica, ejemplo por ejemplo

Una prueba unitaria clásica verifica un número finito de casos elegidos a mano:

```text
prueba "sumar(2, 3) == 5"
prueba "sumar(-1, 1) == 0"
prueba "sumar(0, 0) == 0"
```

Estas tres pruebas pasan, pero no dicen nada sobre qué ocurre con `sumar(1000000, -999999)`, o con cualquier otra combinación no probada explícitamente: un bug escondido en un caso que la persona que escribió la prueba no eligió permanece invisible.

## Una propiedad: lo que siempre debe ser cierto

Una **propiedad** describe una regla general, válida para cualquier entrada que cumpla ciertas restricciones, en lugar de un resultado preciso para una entrada precisa:

```text
Propiedad: "sumar es conmutativa"
  Para todo a y b: sumar(a, b) == sumar(b, a)

Propiedad: "ordenar una lista no cambia su tamaño"
  Para toda lista L: tamano(ordenar(L)) == tamano(L)

Propiedad: "ordenar dos veces da el mismo resultado que ordenar una vez"
  Para toda lista L: ordenar(ordenar(L)) == ordenar(L)
```

Una herramienta de property-based testing (por ejemplo [fast-check](https://fast-check.dev) en JavaScript, [Hypothesis](https://hypothesis.readthedocs.io) en Python, o [QuickCheck](https://hackage.haskell.org/package/QuickCheck), la herramienta histórica del campo en Haskell) genera después automáticamente cientos de entradas aleatorias que cumplen las restricciones dadas, y verifica la propiedad en cada una.

```text
Prueba property-based para "ordenar no cambia el tamaño":

  repetir 200 veces:
    generar una lista aleatoria L (tamaño y contenido variables)
    verificar que tamano(ordenar(L)) == tamano(L)

  -> si un solo caso generado rompe la propiedad, la prueba
     falla y muestra la lista exacta que causó el problema
```

## Encontrar un contraejemplo mínimo (shrinking)

Cuando una herramienta de property-based testing encuentra una entrada que rompe la propiedad, no se queda ahí: intenta **reducirla** (*shrinking*) hacia el contraejemplo más pequeño posible que todavía reproduzca el bug, para facilitar el diagnóstico.

```text
Contraejemplo encontrado inicialmente:
  L = [47, -12, 999, 3, -5, 0, 812, ...] (lista de 50 elementos)

Tras la reducción (shrinking):
  L = [1, 0] (2 elementos, el bug sigue reproduciéndose)

-> mucho más fácil de entender y corregir que la lista inicial
```

## Cuándo elegir este enfoque

El property-based testing no reemplaza las pruebas clásicas, las complementa, en particular en código donde una **regla general** es más fácil de formular que una lista de casos precisos: funciones matemáticas, algoritmos de ordenación o codificación/decodificación, parsers, estructuras de datos.

> **Trampa:** intentar escribir una propiedad para un comportamiento que en realidad no sigue una regla general simple (una lógica de negocio con numerosos casos particulares arbitrarios). Forzar una propiedad donde no encaja produce una regla tan complicada que se vuelve ella misma propensa a errores.
>
> **Buena práctica:** reservar el property-based testing a los comportamientos que realmente obedecen a una regla general simple de enunciar; mantener pruebas clásicas, por ejemplo, para la lógica de negocio rica en casos particulares.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El property-based testing describe una propiedad válida para cualquier entrada, en lugar de verificar ejemplos elegidos a mano; una herramienta genera automáticamente cientos de entradas para intentar contradecirla, y reduce (shrinking) todo contraejemplo encontrado hacia el caso más simple posible. |
| **Herramientas utilizables** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, la herramienta histórica del campo). |
| **Trampas a evitar** | Forzar una propiedad sobre un comportamiento sin regla general simple. |
| **Buenas prácticas** | Reservar el property-based testing a comportamientos con una regla general clara (funciones matemáticas, ordenación, parsers); mantener pruebas clásicas para la lógica de negocio rica en casos particulares. |
