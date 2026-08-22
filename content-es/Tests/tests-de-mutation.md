---
order: 11
---

# Las pruebas de mutación

El capítulo sobre la [cobertura de código](/?c=tests&p=couverture-de-code) estableció una trampa central: una línea ejecutada por una prueba no es forzosamente una línea realmente verificada. Las **pruebas de mutación** (*mutation testing*) responden directamente a este problema, midiendo no si el código se ejecutó, sino si las pruebas son capaces de detectar un bug cuando lo hay.

## El principio: introducir bugs a propósito

Una herramienta de mutation testing modifica automáticamente el código fuente, un cambio minúsculo cada vez (un **mutante**), y luego vuelve a ejecutar la suite de pruebas contra esta versión ligeramente rota:

```text
Código original:
  if (edad >= 18) { return "mayor"; }

Mutantes generados automáticamente:
  if (edad > 18)   { return "mayor"; }   // >= se vuelve >
  if (edad <= 18)  { return "mayor"; }   // >= se vuelve <=
  if (edad >= 18)  { return "menor"; }   // valor de retorno invertido
  if (true)        { return "mayor"; }   // condición eliminada
```

Cada mutante representa un bug plausible, introducido automáticamente. La pregunta planteada a la suite de pruebas para cada uno: ¿la hace fallar?

## Mutante eliminado o mutante superviviente

| Resultado | Significado |
|---|---|
| **Mutante eliminado** (*killed*) | Al menos una prueba falló frente a este mutante: la suite de pruebas habría detectado este bug si hubiera existido realmente |
| **Mutante superviviente** (*survived*) | Todas las pruebas pasan pese al cambio: la suite de pruebas no detectaría este bug si existiera realmente |

El **score de mutación** es la proporción de mutantes eliminados sobre el total generado: un score alto indica pruebas realmente capaces de detectar bugs, no solo de ejecutar código.

```text
10 mutantes generados, 8 eliminados, 2 supervivientes
-> score de mutación: 80%

Los 2 mutantes supervivientes señalan puntos precisos del
código donde las pruebas existentes no detectarían un bug real
```

## Lo que esto revela, que la cobertura no revela

Es precisamente el punto ciego de la cobertura de código: una prueba que ejecuta una línea sin verificar su resultado obtiene 100% de cobertura en esa línea, pero deja sobrevivir a todos los mutantes que la modifican, revelando que la línea en realidad no está verificada.

```text
function calcularDescuento(precio, porcentaje) {
    return precio * (1 - porcentaje / 100);
}

prueba "calcularDescuento no falla":
    calcularDescuento(100, 10);   // 100% de cobertura...
    // ...¡pero ninguna verificación del resultado!

Mutante: precio * (1 + porcentaje / 100)  (signo invertido)
-> la prueba no lo detecta -> mutante superviviente
-> revela lo que la cobertura sola no mostraba
```

## Un coste de cálculo real, a reservar para el código crítico

Generar y probar cada mutante multiplica el tiempo de ejecución de la suite de pruebas por el número de mutantes creados, lo que hace el mutation testing notablemente más lento que la cobertura clásica.

> **Trampa:** ejecutar el mutation testing sobre la totalidad de un proyecto grande en cada ejecución de la suite de pruebas, hasta el punto de volverla demasiado lenta para un uso diario.
>
> **Buena práctica:** reservar el mutation testing al código más crítico (lógica de negocio sensible, cálculos financieros) o ejecutarlo puntualmente (antes de una release, como tarea en segundo plano), en lugar de sobre todo el proyecto en cada ejecución.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El mutation testing modifica automáticamente el código (un mutante cada vez) y verifica si la suite de pruebas detecta cada cambio. Un mutante eliminado significa que las pruebas habrían detectado ese bug; un mutante superviviente revela un punto ciego que la cobertura de código sola no muestra. |
| **Herramientas utilizables** | Una herramienta de mutation testing para generar mutantes y calcular el score de mutación. |
| **Trampas a evitar** | Ejecutar el mutation testing sobre todo el proyecto en cada ejecución, a costa de la velocidad de la suite de pruebas. |
| **Buenas prácticas** | Reservar el mutation testing al código más crítico, o ejecutarlo puntualmente en lugar de en cada ejecución de la suite de pruebas. |
