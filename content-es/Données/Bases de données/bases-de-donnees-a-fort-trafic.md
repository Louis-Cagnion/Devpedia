---
order: 8
---

# Bases de datos de alto tráfico: nunca bloquear al usuario con un recálculo costoso

Una consulta que responde en milisegundos sobre una tabla pequeña puede convertirse en un cuello de botella una vez que los datos y el tráfico se multiplican: si cada visita a una página relanza esa misma consulta costosa en directo, el tiempo de respuesta del usuario depende directamente de su lentitud. Este capítulo cubre las técnicas que evitan ese bloqueo, ya anunciadas en el principio general de [nunca recalcular un resultado que nada ha podido cambiar desde entonces](/?c=performance&p=eviter-le-recalcul-redondant), aplicadas aquí específicamente a una base de datos de alto tráfico.

## Caso concreto: una consulta de varios minutos detrás de un simple filtro

Una página muestra una lista de opciones de filtro (las regiones disponibles, las categorías de producto...), calculada por una consulta que recorre la totalidad de una tabla de varios millones de filas, sin filtro de fecha. Sobre un conjunto de datos pequeño, esta consulta responde en menos de un segundo; una vez que la tabla se vuelve voluminosa, la misma consulta puede tardar varios **minutos**. Si se ejecuta en cada carga de página, cada usuario espera esos minutos en directo por una información que, sin embargo, cambia raramente.

> **Trampa:** recalcular un dato costoso en cada petición de usuario simplemente porque la consulta es correcta y da el resultado correcto. Una consulta correcta puede seguir siendo una mala idea si su coste es desproporcionado respecto a la frescura realmente necesaria de su resultado.
>
> **Buena práctica:** antes de optimizar la consulta en sí (índices, reescritura SQL), preguntarse primero si el resultado realmente necesita recalcularse en cada visita, o si puede almacenarse en caché.

## Caché y stale-while-revalidate

La técnica más directa: calcular el resultado una vez, almacenarlo, y luego servir ese valor en caché en lugar de relanzar el cálculo en cada petición.

```text
Sin cache:                            Con cache + TTL de 6h:

Peticion de usuario                   Peticion de usuario
  -> recalculo completo (minutos)       -> lectura de la cache (milisegundos)
  -> respuesta                          -> respuesta inmediata
                                       Cada 6h: recalculo en segundo plano
```

El **TTL** (*Time To Live*) fija la duración durante la cual un valor en caché se considera válido antes de recalcularse. La elección del TTL depende de la frecuencia real de cambio del dato: unas opciones de filtro que cambian raramente soportan un TTL de varias horas, un dato que cambia cada minuto necesita uno mucho más corto.

El **stale-while-revalidate** («caducado durante la actualización») va más allá de una caché simple: al expirar el TTL, el valor caducado se sirve igualmente de inmediato al usuario, mientras una tarea en segundo plano recalcula el nuevo valor para las peticiones siguientes.

| | Caché simple (TTL estricto) | Stale-while-revalidate |
|---|---|---|
| Al expirar el TTL | La siguiente petición espera el recálculo completo | La siguiente petición recibe el valor antiguo de inmediato |
| Frescura percibida | Siempre actualizada a costa de una ralentización periódica | Ocasionalmente algo caducada, nunca lenta |

> **Buena práctica:** usar stale-while-revalidate cuando un dato ligeramente caducado (de unos minutos a unas horas según el caso) sigue siendo aceptable para el usuario, lo que ocurre con la mayoría de los datos que no representan un estado financiero o de seguridad en tiempo real.

## Réplicas de lectura

Una **réplica de lectura** (*read replica*) es una copia de la base de datos, sincronizada continuamente desde la base principal, dedicada exclusivamente a las consultas de lectura. Las escrituras siguen yendo a la base principal; las lecturas, a menudo mucho más numerosas, se reparten entre una o varias réplicas:

```text
Escrituras  ->  Base principal
                    |
                    | sincronizacion continua
                    v
Lecturas    ->  Replica 1, Replica 2, Replica 3...
```

Esto evita que una lectura costosa ralentice las escrituras (y viceversa), y permite añadir réplicas adicionales a medida que aumenta el volumen de lecturas, sin tocar la base principal.

> **Trampa:** leer inmediatamente después de una escritura desde una réplica que aún no ha recibido la sincronización más reciente (*replication lag*): el usuario puede entonces no ver el dato que él mismo acaba de guardar.
>
> **Buena práctica:** leer desde la base principal justo después de una escritura que debe ser visible de inmediato para ese mismo usuario, y reservar las réplicas para las lecturas que toleran un ligero retraso.

## Colas y procesamiento asíncrono

Para una escritura o un recálculo pesado (generar un informe, redimensionar una imagen, enviar un lote de correos), hacer esperar al usuario hasta que termine el procesamiento bloquea su petición innecesariamente. Una **cola** (*queue*) desacopla la petición de su procesamiento: la petición del usuario deposita una tarea en la cola y recibe una respuesta inmediata, mientras un proceso aparte (un *worker*) procesa las tareas de la cola a su propio ritmo.

```text
Peticion de usuario -> deposita una tarea en la cola -> respuesta inmediata
                                    |
                                    v
                        Worker procesa la tarea en segundo plano
                                    |
                                    v
                        Usuario notificado al terminar (o consulta el estado)
```

## Paginación y streaming en lugar de un resultado completo

Cargar de golpe la totalidad de un resultado voluminoso (decenas de miles de filas) consume memoria y tiempo de transferencia proporcionales a ese volumen, incluso si el usuario solo consulta una fracción. Dos técnicas evitan ese coste:

| Técnica | Principio |
|---|---|
| **Paginación** | Dividir el resultado en páginas de tamaño fijo, cargar solo una a la vez |
| **Streaming** | Enviar el resultado a medida que se produce, en lugar de esperar a que esté completo antes de empezar a transmitirlo |

## Connection pooling

Abrir una conexión a una base de datos tiene un coste nada desdeñable (autenticación, establecimiento del enlace de red). Un **pool de conexiones** (*connection pool*) mantiene un conjunto de conexiones ya abiertas y listas para usar, reutilizadas de una petición a otra en lugar de recrearse cada vez.

> **Trampa:** abrir una nueva conexión en cada petición bajo alto tráfico. El coste de apertura, insignificante aislado, se vuelve significativo al multiplicarse por un gran número de peticiones simultáneas, y puede incluso agotar el número máximo de conexiones que la base de datos acepta.
>
> **Buena práctica:** configurar un pool de conexiones dimensionado al tráfico real, en lugar de dejar que cada petición gestione su propia conexión.

## Sharding y particionamiento

El **particionamiento** divide una tabla voluminosa en varios segmentos más pequeños según un criterio (un rango de fechas, una zona geográfica...), manteniéndola en el mismo servidor de base de datos. El **sharding** va más allá: reparte esos segmentos entre servidores físicamente distintos, permitiendo superar la capacidad de una sola máquina.

```text
Particionamiento (1 servidor):         Sharding (varios servidores):

Tabla                                   Servidor A: shard 1 (clientes A-M)
  - Particion 2024                      Servidor B: shard 2 (clientes N-Z)
  - Particion 2025
  - Particion 2026
```

Estas dos técnicas solo merecen la pena una vez que los enfoques anteriores (caché, réplicas, colas) ya no bastan: añaden una complejidad real (una consulta que atraviesa varias particiones o varios shards se vuelve más difícil de escribir y optimizar).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una consulta correcta puede seguir siendo una mala idea si se recalcula en directo en cada visita mientras su resultado cambia raramente. Caché/stale-while-revalidate, réplicas de lectura, colas, paginación/streaming, connection pooling y sharding son respuestas complementarias, no competidoras, a este problema. |
| **Herramientas utilizables** | Una caché con TTL y stale-while-revalidate para un dato que tolera una ligera caducidad. Una cola para un procesamiento pesado que no debe bloquear la petición del usuario. Un pool de conexiones dimensionado al tráfico real. |
| **Trampas a evitar** | Recalcular un dato costoso en cada petición por simple costumbre. Leer una réplica justo después de una escritura que debe ser visible de inmediato. Abrir una nueva conexión en cada petición bajo alto tráfico. |
| **Buenas prácticas** | Cachear todo resultado costoso cuya frescura perfecta no sea indispensable. Reservar el sharding/particionamiento para los casos donde caché, réplicas y colas ya no bastan. |
