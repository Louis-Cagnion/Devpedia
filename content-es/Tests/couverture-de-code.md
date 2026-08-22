---
order: 8
---

# La cobertura de código

Una suite de pruebas crece capítulo tras capítulo, pero una pregunta ha quedado sin respuesta directa hasta ahora: ¿cómo saber si cubre suficientemente el programa? La **cobertura de código** (*code coverage*) intenta responder a esta pregunta con una medida numérica, con límites importantes a conocer antes de confiar en ella.

## Lo que mide la cobertura

La cobertura de código mide la proporción del código fuente realmente **ejecutada** al menos una vez durante la ejecución de la suite de pruebas, generalmente expresada en porcentaje.

```text
function calcularDescuento(precio, porcentaje) {
    if (porcentaje < 0) {
        return precio;              // línea A
    }
    return precio * (1 - porcentaje / 100);  // línea B
}

Una sola prueba con porcentaje=10:
  -> línea B ejecutada, línea A nunca ejecutada
  -> cobertura de esta función: 50% (1 línea de 2)
```

Una herramienta de cobertura instrumenta el código durante la ejecución de las pruebas, y luego produce un informe que indica qué líneas (o qué ramas, qué funciones) se ejecutaron o no.

## Varias granularidades de medida

| Tipo de cobertura | Qué verifica |
|---|---|
| **Cobertura de líneas** | ¿Se ejecutó cada línea de código al menos una vez? |
| **Cobertura de ramas** | ¿Se recorrió cada camino posible de un `if`/`else` (ambos, no solo uno)? |
| **Cobertura de funciones** | ¿Se llamó a cada función al menos una vez? |

La cobertura de ramas es más exigente que la cobertura de líneas: un `if` sin `else` puede tener 100% de cobertura de líneas sin nunca ejercitar el caso en que la condición es falsa, mientras que la cobertura de ramas sí lo exigiría.

## La trampa central: una cifra alta no garantiza nada

Una línea "cubierta" solo significa que fue **ejecutada** durante una prueba, no que su resultado fue **verificado**. Una prueba que llama a una función sin comparar nunca su resultado con un valor esperado hace subir la cobertura sin detectar ni un solo bug.

```text
function calcularDescuento(precio, porcentaje) {
    return precio * (1 - porcentaje / 100);
}

prueba "calcularDescuento no falla":
    calcularDescuento(100, 10);   // ejecuta la línea, pero...
    // ...¡ninguna verificación del resultado obtenido!

-> 100% de cobertura de esta función, aunque un bug que
   invirtiera el cálculo (ej. precio * (1 + porcentaje / 100))
   nunca sería detectado
```

> **Trampa:** apuntar a un porcentaje de cobertura alto como objetivo en sí mismo, escribiendo pruebas que ejecutan código sin verificar realmente su comportamiento. 100% de cobertura no significa 0% de bugs.
>
> **Buena práctica:** tratar la cobertura como un indicador de lo que *seguro que no* está probado (una línea al 0% no tiene ninguna prueba), nunca como una prueba de que lo cubierto es correcto.

## Para qué sirve realmente la cobertura

Pese a esta limitación, la cobertura sigue siendo útil para un uso concreto: localizar las zonas de código **totalmente desprovistas** de pruebas, en particular tras una modificación. Un informe de cobertura que cae de repente en un archivo recién modificado señala un punto ciego real, a cubrir antes de considerar el cambio terminado.

> **Buena práctica:** usar la cobertura para localizar los huecos evidentes (código nunca ejecutado por ninguna prueba), no para juzgar la calidad de las pruebas existentes sobre el código ya cubierto.

## Un umbral a elegir con criterio

Algunos equipos fijan un umbral mínimo de cobertura (a menudo entre 70% y 90%) por debajo del cual se rechaza una contribución. Este umbral tiene sentido como salvaguarda contra la ausencia total de pruebas en código nuevo, pero apuntar al 100% en todas partes tiene un coste creciente: los últimos porcentajes suelen cubrir código de bajo riesgo (manejo de errores trivial, código generado) para una ganancia de fiabilidad marginal.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | La cobertura de código mide la proporción de código ejecutada por las pruebas (líneas, ramas, funciones), no la calidad de lo que se verifica. Una línea cubierta no es forzosamente una línea correctamente probada: 100% de cobertura no garantiza la ausencia de bugs. |
| **Herramientas utilizables** | Una herramienta de cobertura que instrumenta la ejecución de las pruebas, produciendo un informe por línea/rama/función. Un umbral mínimo (70-90%) como salvaguarda en código nuevo. |
| **Trampas a evitar** | Apuntar a un porcentaje de cobertura alto como objetivo en sí mismo. Escribir pruebas que ejecutan código sin verificar su resultado. |
| **Buenas prácticas** | Usar la cobertura para localizar código totalmente no probado, no para juzgar la calidad de lo ya cubierto. No apuntar al 100% en todas partes: la ganancia marginal de los últimos porcentajes suele ser pequeña. |
