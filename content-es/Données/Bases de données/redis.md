---
order: 9
---

# Redis: el almacén clave-valor en memoria

Una base de datos clásica (véase [Bases de datos](/?c=bases-de-donnees)) escribe sus datos en disco: sobreviven a un reinicio, pero cada lectura o escritura debe pasar por ese disco, más lento que la memoria RAM. **Redis** es un **almacén clave-valor** (cada dato está asociado a una clave única, como en un diccionario) que mantiene todo **en memoria RAM** por defecto: los accesos pasan a ser del orden del microsegundo en lugar del milisegundo, al precio de perder el dato si el proceso se detiene sin ninguna precaución particular (véase la persistencia más abajo).

```text
Base relacional clasica :  Aplicacion --> peticion --> Disco --> respuesta
                            (cada acceso atraviesa el disco)

Redis :                     Aplicacion --> peticion --> RAM --> respuesta
                            (el disco solo interviene de forma opcional, para no perderlo todo)
```

## Las estructuras de datos soportadas

A diferencia de una simple caché que solo asociaría una cadena a una clave, Redis entiende varias formas de valor, cada una adaptada a una necesidad concreta:

| Estructura | Qué contiene | Ejemplo de uso |
|---|---|---|
| **String** | Una cadena o un número | Contador de vistas, token de sesión |
| **List** | Una secuencia ordenada de valores | Cola de tareas por procesar |
| **Hash** | Un conjunto de campos con nombre, como un mini-objeto | Las propiedades de un perfil de usuario |
| **Set** | Un conjunto de valores únicos, sin orden | Las etiquetas asociadas a un artículo |
| **Sorted set** | Un conjunto de valores únicos, ordenados por puntuación | Una clasificación (puntuación, tiempo de juego) |

## Casos de uso típicos

### La caché de aplicación

El caso más habitual: evitar rehacer un cálculo o una consulta costosa manteniendo su resultado a mano durante un tiempo limitado, un principio ya planteado en [Bases de datos de alto tráfico](/?c=bases-de-donnees&p=bases-de-donnees-a-fort-trafic).

```text
1. La aplicacion recibe una peticion
2. Primero consulta Redis con la clave correspondiente
   -> Presente (cache hit)  : respuesta inmediata, el disco nunca se usa
   -> Ausente  (cache miss) : peticion a la base relacional,
                                luego el resultado se escribe en Redis para la proxima vez
```

Este esquema, donde la caché solo se consulta y se rellena bajo demanda, tiene un nombre: el patrón ***cache-aside***.

### Almacenamiento de sesión, cola, pub/sub

- **Almacenamiento de sesión**: la información de un usuario conectado (identificador, permisos) se lee en cada petición; mantenerla en RAM en lugar de en una base relacional evita una consulta a disco en cada página.
- **Cola ligera**: una `List` sirve de búfer entre un servicio que produce tareas y otro que las procesa, sin depender de un sistema de colas dedicado más pesado.
- **Pub/sub** (*publish/subscribe*): un servicio publica un mensaje en un canal con nombre, y todos los servicios suscritos a ese canal lo reciben de inmediato, sin ningún vínculo directo entre ellos.

## El TTL: una clave que se autodestruye

Un **TTL** (*Time To Live*) es una vida útil opcional asociada a una clave: pasado ese plazo, Redis la elimina por sí sola. Esto es lo que hace a Redis apto para una caché: en lugar de tener que eliminar manualmente un dato caducado, se le asigna desde su creación una fecha de expiración.

## La persistencia: RDB y AOF

Redis sigue siendo ante todo una herramienta de memoria RAM, pero ofrece dos mecanismos opcionales para sobrevivir a un reinicio:

| Mecanismo | Principio | Compromiso |
|---|---|---|
| **RDB** (*Redis Database*) | Una foto completa de la memoria, escrita en disco a intervalos regulares | Rápida de restaurar, pero pierde las escrituras ocurridas desde la última foto |
| **AOF** (*Append Only File*) | Cada escritura también se registra en disco, en el orden en que llega | Pierde mucho menos dato en caso de corte, pero el archivo es más voluminoso y la restauración más lenta |

> **Trampa:** usar Redis sin RDB ni AOF para almacenar un dato que no se puede permitir perder (ej.: un carrito de compra aún no validado). Sin persistencia activada, un simple reinicio del proceso lo borra todo.

## Escalar: replicación y Redis Cluster

Igual que con una base relacional, dos mecanismos permiten superar la capacidad de un solo servidor: la **replicación** (una o varias copias de solo lectura de un servidor principal, para repartir las lecturas y sobrevivir a su pérdida) y **Redis Cluster**, que reparte las propias claves entre varios servidores (particionamiento), para superar la RAM de una sola máquina.

## Redis no es una base relacional

Redis no sustituye a una base como las tratadas en [Bases de datos](/?c=bases-de-donnees): no hay uniones entre varias estructuras, ni consultas complejas al estilo [SQL](/?c=domain-specific-languages-dsl&p=sql), y una capacidad de almacenamiento limitada por la RAM disponible en lugar de por el espacio en disco. Complementa una base existente para los accesos que deben ser inmediatos, no la sustituye para aquellos que deben permanecer exhaustivos y duraderos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Redis es un almacén clave-valor que mantiene sus datos en RAM por defecto, para accesos muy rápidos. Soporta varias estructuras (string, list, hash, set, sorted set), un TTL para la expiración automática, y una persistencia opcional (RDB, AOF). |
| **Herramientas utilizables** | RDB/AOF para la persistencia; replicación y Redis Cluster para escalar. |
| **Trampas a evitar** | Almacenar un dato crítico sin persistencia activada; esperar de Redis las capacidades de una base relacional (uniones, consultas complejas). |
| **Buenas prácticas** | Reservar Redis para la caché, la sesión, o una necesidad de latencia mínima; definir siempre un TTL en un dato de caché para evitar que quede obsoleto sin que nadie se dé cuenta. |
