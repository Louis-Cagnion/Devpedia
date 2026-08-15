---
order: 6
---

# Caché de CPU y vectorización (SIMD)

Los capítulos anteriores tratan del tiempo perdido esperando a **otro componente** (red, disco, servicio remoto). Para cálculo puro (sumar números, transformar un array), la misma distinción [coste fijo / coste marginal](/?c=performance&p=limiter-les-aller-retours) existe, pero lo que domina el coste marginal ya no es una latencia de red: es la forma en que el procesador accede a la memoria.

## La jerarquía de caché

Un procesador nunca lee la RAM directamente en cada acceso: varios niveles de memoria, cada vez más pequeños y rápidos, se intercalan entre él y la RAM.

| Nivel | Tamaño típico | Latencia relativa |
|---|---|---|
| Registros | Unas pocas decenas de bytes | ~1 ciclo |
| Caché L1 | 32-64 KB | ~4 ciclos |
| Caché L2 | 256 KB-1 MB | ~15 ciclos |
| Caché L3 | Unos pocos MB (compartida entre núcleos) | ~40 ciclos |
| RAM | Varios GB | ~200 ciclos |

Un **registro** es un espacio de almacenamiento integrado en el propio procesador (no en memoria): es ahí donde coloca los valores sobre los que opera directamente. Un **ciclo** es el latido del reloj interno del procesador, la unidad de tiempo más fina en la que puede actuar; todas las latencias anteriores se expresan en número de ciclos en lugar de en segundos, porque ese número se mantiene estable de una máquina a otra, a diferencia de la duración real de un ciclo (que depende de la frecuencia del procesador).

Estas cifras son órdenes de magnitud (varían según la arquitectura), pero la relación entre ellas es lo que importa: un acceso a RAM cuesta fácilmente 50 veces más que un acceso a L1. Un programa que multiplica las idas y vueltas hacia la RAM en lugar de reutilizar lo que ya está en caché puede ser decenas de veces más lento, con un número de operaciones estrictamente idéntico.

## Líneas de caché: la memoria contigua es "gratis"

El procesador nunca carga un solo byte: siempre carga un bloque de tamaño fijo, la **línea de caché** (64 bytes en la mayoría de las arquitecturas actuales), incluso si solo se pide un byte de ese bloque.

Consecuencia directa: leer datos **contiguos** (un array recorrido en orden) se beneficia de líneas ya cargadas por los accesos anteriores: la mayoría de las lecturas casi no cuestan nada. Leer datos **dispersos** (una lista enlazada, objetos esparcidos en el heap) desencadena una nueva carga de línea en cada acceso, sin reutilizar nada.

> Es la misma unidad (el byte como dirección, el bloque como granularidad de transferencia) que la vista en [La organización de los datos en memoria](/?c=representation-des-donnees&p=organisation-en-memoire): la alineación y el padding influyen directamente en cuántas líneas de caché ocupa una estructura.

## Coste fijo vs coste marginal, aplicado al cálculo

Llamar a una función vectorizada (`array.sum()`, `array * 2`) tiene, como una llamada de red, un **coste fijo**: elegir qué rutina de bajo nivel ejecutar, asignar el array resultado: independiente del número de elementos `n`. El **coste marginal** (el coste por elemento) depende luego de dos cosas: la localidad de memoria vista arriba, y la capacidad del procesador para procesar varios elementos por instrucción en lugar de uno solo.

Es este segundo punto lo que se llama **SIMD** (*Single Instruction, Multiple Data*): una instrucción de procesador que aplica la misma operación a varios valores contiguos de golpe (ej. sumar 8 enteros en una sola instrucción, en lugar de 8 instrucciones separadas). SIMD solo es explotable si los datos son **contiguos y de tamaño uniforme**: exactamente lo que garantiza un array tipado, y nunca lo que garantiza una colección de objetos dispersos.

## Por qué un array NumPy es rápido y una lista Python no lo es

Una lista Python es un array de **punteros** hacia objetos, potencialmente dispersos en cualquier lugar del heap y de tamaños diferentes. Un bucle `for` sobre una lista Python debe, en cada iteración: seguir un puntero (acceso a memoria potencialmente fuera de caché), verificar el tipo del objeto apuntado, y luego llamar a la rutina correcta: todo ello dirigido por el intérprete, instrucción por instrucción.

Un [array NumPy](/?c=data-science&p=numpy) (`ndarray`) es un único bloque de memoria **contiguo**, que contiene los valores mismos (no punteros), todos del mismo tipo y del mismo tamaño. Una operación vectorizada (`a + b`) delega en un bucle **compilado** que recorre ese bloque de forma secuencial: las líneas de caché se reutilizan al máximo, y el procesador puede emplear instrucciones SIMD sobre varios elementos a la vez. Mismo número de operaciones aritméticas, pero un coste marginal por elemento muy inferior.

## La trampa de `dtype=object`: contiguo no significa uniforme

Un array NumPy creado con tipos heterogéneos (ej. una mezcla de enteros y cadenas) recae en `dtype=object`: el array sigue siendo un bloque **contiguo**... de punteros hacia objetos Python potencialmente dispersos, de tipos diferentes. Cada acceso vuelve a ser un seguimiento de puntero seguido de una verificación de tipo por elemento: el coste marginal explota y vuelve a ser comparable al de una lista Python, a pesar de la contigüidad del array en sí.

La contigüidad de la memoria es necesaria para beneficiarse de la caché y de SIMD, pero **no suficiente**: también hace falta que los elementos sean de tamaño y tipo uniformes, para que el procesador pueda procesarlos en bloque sin volver a verificar cada uno individualmente.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un acceso a RAM cuesta ~50× más que un acceso a caché L1. Los datos contiguos y de tipo uniforme (array tipado) se benefician de la caché y de SIMD; los datos dispersos (lista enlazada, objetos esparcidos) recargan una línea de caché en cada acceso. |
| **Herramientas utilizables** | Un array tipado y contiguo (NumPy `ndarray`) en lugar de una colección de objetos dispersos para cálculo intensivo. |
| **Trampas a evitar** | Un array NumPy en `dtype=object`: sigue siendo contiguo en apariencia, pero pierde todo el beneficio de la caché/SIMD (punteros hacia objetos dispersos). |
| **Buenas prácticas** | Preferir un array tipado y contiguo en cuanto el volumen de cálculo lo justifique; recorrer los datos en el orden de su disposición en memoria. |
