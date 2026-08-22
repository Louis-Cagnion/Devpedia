---
order: 3
---

# CDN y transmisión adaptativa: el caso Netflix

El [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) distribuye las peticiones entre varios servidores, pero todos esos servidores siguen situados en el mismo lugar geográfico: una petición enviada desde otro continente siempre debe recorrer toda esa distancia. Para un contenido voluminoso e idéntico para todos (un vídeo), una ganancia mucho mayor consiste en acercar **el propio contenido** a cada usuario, en lugar de acercar los servidores de procesamiento.

## El CDN: copias del contenido, repartidas por todo el mundo

Un **CDN** (*Content Delivery Network*, red de distribución de contenido) es una red de servidores repartidos geográficamente, cada uno guardando en caché una copia del contenido (un vídeo, una imagen, un archivo estático) lo más cerca posible de sus usuarios:

```text
Sin CDN:                                Con CDN:

Usuario (Tokio)                         Usuario (Tokio)
      |                                       |
      | recorre todo el trayecto              | servido desde el nodo CDN mas cercano
      v                                       v
Servidor de origen (Paris)               Nodo CDN (Tokio) --- copia sincronizada --- Servidor de origen (Paris)
```

| | Sin CDN | Con CDN |
|---|---|---|
| Distancia recorrida | Hasta el servidor de origen, sin importar el lugar del mundo | Hasta el nodo CDN más cercano |
| Carga sobre el servidor de origen | Cada petición, desde cualquier parte del mundo | Solo para sincronizar los nodos CDN, no cada petición de usuario |
| Adecuado para | Contenido personalizado, propio de cada usuario | Contenido idéntico para todos (vídeo, imagen, archivo estático) |

Netflix va más allá de un CDN alquilado a un tercero: la empresa despliega sus propios servidores ([Open Connect](https://openconnect.netflix.com/)), instalados directamente dentro de las redes de los proveedores de acceso a internet, para que el vídeo recorra el menor trayecto de red posible antes de llegar al usuario.

> **Trampa:** esperar que un CDN acelere cualquier contenido. Un CDN solo puede cachear contenido compartido, idéntico para todos; un contenido realmente personalizado (una recomendación propia de una cuenta, un saldo) no tiene nada en común que cachear, y debe seguir pasando por los servidores de origen, detrás del [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge).

## La transmisión adaptativa: ajustarse a la conexión de cada uno

Un vídeo no se envía como un archivo único de calidad fija. Primero se codifica en **varios niveles de calidad** (resoluciones y tasas de bits diferentes), y luego se divide en pequeños segmentos de pocos segundos cada uno:

```text
Video fuente
   ├── Calidad baja   (segmentos de 480p, tasa de bits baja)
   ├── Calidad media  (segmentos de 720p, tasa de bits media)
   └── Calidad alta   (segmentos de 1080p, tasa de bits alta)
```

El reproductor de vídeo, en el dispositivo del usuario, mide en continuo la velocidad real de descarga y elige, segmento por segmento, la mejor calidad que puede descargar a tiempo sin interrumpir la reproducción:

```text
Conexion medida estable y rapida     -> descarga el proximo segmento en alta calidad
Conexion medida que se degrada       -> cambia al proximo segmento en calidad mas baja
```

Este mecanismo (normalizado bajo los protocolos [HLS](https://developer.apple.com/streaming/) y [MPEG-DASH](https://www.iso.org/standard/79329.html)) explica por qué un vídeo que se reproducía en alta definición puede volverse momentáneamente más pixelado si la red se degrada (cambio de wifi, congestión de red), sin cortar nunca la reproducción: cada segmento siguiente simplemente se solicita en una calidad diferente, de forma transparente para el usuario.

## Resumen

| | |
|---|---|
| **Para recordar** | Un CDN acerca una copia del contenido compartido a cada usuario, reduciendo la distancia recorrida por la petición; no es adecuado para contenido personalizado. La transmisión adaptativa divide un vídeo en segmentos codificados en varias calidades, y el reproductor elige la mejor calidad soportable según la conexión medida en directo. |
| **Herramientas utilizables** | Un CDN alquilado (generalista) o desplegado en propiedad (Netflix Open Connect); los protocolos HLS y MPEG-DASH para la transmisión adaptativa. |
| **Trampas a evitar** | Esperar que un CDN acelere contenido realmente personalizado, que no tiene nada en común que cachear. |
| **Buenas prácticas** | Reservar el CDN para el contenido compartido y estático; dejar que el contenido personalizado pase por los servidores de origen. |
