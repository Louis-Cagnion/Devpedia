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

## Por qué un array NumPy es rápido y una lista [Python](/?c=langages-de-programmation&s=python&p=python) no lo es

Una lista Python es un array de **punteros** hacia objetos, potencialmente dispersos en cualquier lugar del heap y de tamaños diferentes. Un bucle `for` sobre una lista Python debe, en cada iteración: seguir un puntero (acceso a memoria potencialmente fuera de caché), verificar el tipo del objeto apuntado, y luego llamar a la rutina correcta: todo ello dirigido por el intérprete, instrucción por instrucción.

Un [array NumPy](/?c=data-science&p=numpy) (`ndarray`) es un único bloque de memoria **contiguo**, que contiene los valores mismos (no punteros), todos del mismo tipo y del mismo tamaño. Una operación vectorizada (`a + b`) delega en un bucle **compilado** que recorre ese bloque de forma secuencial: las líneas de caché se reutilizan al máximo, y el procesador puede emplear instrucciones SIMD sobre varios elementos a la vez. Mismo número de operaciones aritméticas, pero un coste marginal por elemento muy inferior.

## La trampa de `dtype=object`: contiguo no significa uniforme

Un array NumPy creado con tipos heterogéneos (ej. una mezcla de enteros y cadenas) recae en `dtype=object`: el array sigue siendo un bloque **contiguo**... de punteros hacia objetos Python potencialmente dispersos, de tipos diferentes. Cada acceso vuelve a ser un seguimiento de puntero seguido de una verificación de tipo por elemento: el coste marginal explota y vuelve a ser comparable al de una lista Python, a pesar de la contigüidad del array en sí.

La contigüidad de la memoria es necesaria para beneficiarse de la caché y de SIMD, pero **no suficiente**: también hace falta que los elementos sean de tamaño y tipo uniformes, para que el procesador pueda procesarlos en bloque sin volver a verificar cada uno individualmente.

## Contar los accesos aleatorios a memoria, no las instrucciones

El número de instrucciones ejecutadas es un mal indicador del tiempo real: según la jerarquía de caché anterior, lo que cuesta es el número de accesos **aleatorios** a memoria (los que fallan la caché), no el número de operaciones.

En un solucionador SAT (ver [Los solucionadores SAT y el algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)):

| Optimización | Efecto sobre las instrucciones | Efecto sobre el tiempo |
|---|---|---|
| Búsqueda circular del reemplazante ([Gent 2013](https://www.jair.org/index.php/jair/article/view/10839)) | Divide por 2,5 el número de literales recorridos | Ningún cambio |
| Eliminar un acceso aleatorio a memoria por propagación | Cambia poco el número de instrucciones | −21 % |

La primera optimización reduce el trabajo medido en instrucciones, pero ese trabajo ya estaba en caché: menos instrucciones para el mismo número de accesos a memoria ya baratos no cambia nada. La segunda elimina un acceso que fallaba la caché en cada propagación: un acceso aleatorio menos pesa más que miles de instrucciones menos que, esas sí, ya eran baratas.

> Esto se conecta con [Comparar con contadores de trabajo, no solo con el tiempo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-con-contadores-de-trabajo-no-solo-con-el-tiempo): el contador que predice una mejora en un programa limitado por la memoria no es el número de instrucciones, sino el número de accesos a memoria fuera de caché.

## Array de estructuras vs estructura de arrays (AoS/SoA)

Cuando un algoritmo lee y escribe juntos dos campos de un mismo dato en cada paso (por ejemplo la razón y el nivel de decisión de una variable en un solucionador SAT), guardarlos en dos arrays separados (**estructura de arrays**, *Structure of Arrays*, SoA) cuesta dos líneas de caché por acceso: una por array. Guardarlos uno junto al otro en una sola estructura, guardada a su vez en un único array (**array de estructuras**, *Array of Structures*, AoS), hace que quepan en una sola línea de caché si la estructura es suficientemente pequeña.

| Disposición | Qué está próximo en memoria | Líneas de caché tocadas por acceso |
|---|---|---|
| Estructura de arrays (SoA) | Todos los `razon[i]` juntos, todos los `nivel[i]` juntos, por separado | 2 |
| Array de estructuras (AoS) | `razon[i]` y `nivel[i]` uno junto al otro para cada i | 1 |

En este solucionador, agrupar la razón y el nivel de una variable en una sola estructura dio −7 %. La regla no es «AoS siempre es mejor que SoA»: la estructura de arrays sigue siendo preferible en cuanto un algoritmo recorre un solo campo a la vez sobre muchos elementos (el caso típico del cálculo vectorial visto antes en este capítulo). La regla es «guardar juntos lo que se lee y se escribe junto».

> Ver también [AoS and SoA (Wikipedia, en inglés)](https://en.wikipedia.org/wiki/AoS_and_SoA) y [La organización de los datos en memoria](/?c=representation-des-donnees&p=organisation-en-memoire) para la alineación y el padding de una estructura.

## Filtro por bitmap

Un **bitmap** (o *bitset*, array de bits) usa un solo bit por elemento en lugar de un byte o más: 8 elementos caben en un solo byte. Aquí sirve de filtro: antes de cargar una cabecera costosa desde un array de 147 MB (mucho más grande que cualquier caché), un bit dice si hay algo que leer en ese lugar.

| Estructura consultada | Tamaño | Resultado |
|---|---|---|
| Bitmap (1 bit por elemento) | 575 KB, cabe en la caché L2 | Acceso barato, casi siempre en caché |
| Array completo de cabeceras | 147 MB | Acceso aleatorio a memoria costoso (fuera de caché) |

Consultar el bitmap antes de la cabecera evitó el 91 % de las lecturas en el array de 147 MB: la mayoría de los accesos aleatorios costosos se sustituyen por un acceso barato en una estructura que se queda en caché.

> Principio general: filtrar con una estructura pequeña que quepa en caché, antes de pagar un acceso aleatorio en una estructura demasiado grande para caber. Ver también [bit array (Wikipedia, en inglés)](https://en.wikipedia.org/wiki/Bit_array).

## Escribir solo lo que se volverá a leer

Escribir cuesta tanto como leer: es la misma línea de caché que cargar, y luego devolver a memoria si es desalojada antes de la próxima lectura. Actualizar un dato que nadie volverá a leer es un acceso a memoria pagado para nada.

En un solucionador SAT (ver [Los solucionadores SAT y el algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)), dos estructuras auxiliares, la **fase** registrada de una variable y su posición en el **montículo** de prioridades, solo sirven para las variables aún **decidibles** (las que quedan por elegir). Actualizarlas también para las variables ya fijadas por la propagación escribe en líneas de caché que nadie volverá a leer en mucho tiempo. Restringir ambas actualizaciones a las variables decidibles elimina esas escrituras inútiles.

> El principio se conecta con el filtro por bitmap anterior: en ambos casos, la pregunta planteada antes de actuar es «¿se volverá a leer este dato?», no solo «¿es correcto este cálculo?».

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un acceso a RAM cuesta ~50× más que un acceso a caché L1. Los datos contiguos y de tipo uniforme (array tipado) se benefician de la caché y de SIMD; los datos dispersos (lista enlazada, objetos esparcidos) recargan una línea de caché en cada acceso. El número de accesos aleatorios a memoria predice el tiempo mucho mejor que el número de instrucciones. |
| **Herramientas utilizables** | Un array tipado y contiguo (NumPy `ndarray`) en lugar de una colección de objetos dispersos para cálculo intensivo; un bitmap como filtro barato antes de un acceso aleatorio costoso. |
| **Trampas a evitar** | Un array NumPy en `dtype=object`: sigue siendo contiguo en apariencia, pero pierde todo el beneficio de la caché/SIMD (punteros hacia objetos dispersos). |
| **Buenas prácticas** | Preferir un array tipado y contiguo en cuanto el volumen de cálculo lo justifique; recorrer los datos en el orden de su disposición en memoria; guardar juntos (AoS) los campos leídos y escritos juntos, separar (SoA) los recorridos uno a uno sobre muchos elementos; actualizar solo los datos que siguen siendo útiles. |
