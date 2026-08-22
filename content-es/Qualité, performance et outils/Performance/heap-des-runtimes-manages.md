---
order: 8
---

# El heap de un runtime gestionado

El capítulo de C sobre [la gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) distingue la stack (automática) del heap (manual, `malloc`/`free`). Un runtime gestionado (la [JVM](https://docs.oracle.com/en/java/) para Java/[Elasticsearch](https://www.elastic.co/elasticsearch)/[Kafka](https://kafka.apache.org)..., el [CLR](https://learn.microsoft.com/en-us/dotnet/standard/clr) .NET, el motor [V8](https://v8.dev) de Node.js) también tiene un heap, pero con un sentido diferente: es **toda la zona de memoria reservada para los objetos asignados dinámicamente**, gestionada automáticamente por un recolector de basura (*garbage collector*) en lugar de por llamadas explícitas. El desarrollador no lo asigna ni lo libera él mismo; solo fija su tamaño.

## Un tamaño a menudo autodetectado, no siempre adaptado

A falta de indicación explícita, la mayoría de los runtimes gestionados eligen un tamaño de heap por defecto en función de la RAM disponible en la máquina: una heurística pensada para un servidor dedicado que funciona a plena carga, no para un uso local puntual. La JVM de Elasticsearch, por ejemplo, apunta por defecto hasta un 50 % de la RAM del sistema: en una máquina con 32 GB, esto reserva 16 GB al arrancar, algo que el uso real (una instancia local, pocos datos) no justifica.

Dos efectos concretos de un heap sobredimensionado respecto a la necesidad real:

- **Menos RAM para la caché de disco del SO.** Un motor como Elasticsearch (basado en [Lucene](https://lucene.apache.org)) se apoya enormemente en la caché de archivos del sistema para su rendimiento de lectura: un heap que acapara la mitad de la RAM deja tanto menos espacio a esa caché, y puede empujar al sistema hacia el swap.
- **Un recolector de basura más lento en calentar.** Cuanto más grande es el heap, más trabajo tienen que hacer los primeros ciclos del recolector de basura para establecer sus estadísticas internas: un efecto que se nota sobre todo al arrancar, antes de que se instale el régimen de crucero.

## Fijar el tamaño explícitamente

La mayoría de los runtimes gestionados exponen un ajuste explícito para el tamaño del heap (`-Xmx`/`-Xms` para la JVM, por ejemplo): limitar ese tamaño a lo que exige el uso real, en lugar de dejar que la heurística por defecto reserve una fracción de toda la RAM disponible, evita los dos efectos anteriores. Es lo que hace un script como `start-elasticsearch.ps1` al imponer 1 GB por defecto (`-HeapSize` para ajustar) en lugar de los 16 GB autodetectados: ampliamente suficiente para un uso local, y un arranque notablemente más rápido.

> **Nota:** a diferencia del heap de C, donde un tamaño demasiado pequeño provoca un fallo de asignación inmediato y visible (`malloc` devuelve `NULL`), un heap gestionado demasiado pequeño se traduce más bien en ciclos de recolección de basura más frecuentes, o incluso en un error `OutOfMemoryError` si ni siquiera la memoria liberable basta: una degradación progresiva en lugar de un fallo neto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un runtime gestionado (JVM, CLR, V8) reserva un heap dimensionado automáticamente según la RAM disponible, no según la necesidad real: a menudo sobredimensionado para un uso local. |
| **Herramientas utilizables** | Ajustes explícitos de tamaño de heap (`-Xmx`/`-Xms` para la JVM). |
| **Trampas a evitar** | Dejar que la heurística por defecto reserve una gran fracción de la RAM en una máquina de desarrollo: menos caché de disco, recolector de basura más lento en calentar. |
| **Buenas prácticas** | Limitar explícitamente el tamaño del heap a lo que exige el uso real, en lugar de conservar el valor autodetectado. |
