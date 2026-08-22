---
order: 8
---

# La huella de audio: reconocer una canción en pocos segundos

El [hash perceptual](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduce una imagen a una pequeña huella robusta ante pequeñas variaciones (recompresión, recorte). El mismo principio se aplica al sonido: reconocer una canción a partir de un fragmento de pocos segundos, grabado con el micrófono de un teléfono en un bar ruidoso, comparándolo con una base de decenas de millones de canciones, en menos de un segundo. Este es el problema que resuelve la **huella de audio** (popularizada por Shazam).

## Paso 1: transformar el sonido en imagen (el espectrograma)

Un sonido es una onda que varía en el tiempo, pero esta única dimensión (el volumen en cada instante) no basta para reconocerlo: también hay que saber qué **frecuencias** (graves, agudas) están presentes en cada instante. Un **espectrograma** transforma el audio en una especie de imagen:

```text
Frecuencia (agudo)
      ▲
      │   ░░  ▓▓        ░░
      │  ░▓▓  ░░  ▓▓░░
      │  ▓▓░      ░▓▓  ░░
      └──────────────────────► Tiempo
      (grave)

Eje horizontal : el tiempo
Eje vertical    : la frecuencia (grave abajo, agudo arriba)
Intensidad (░/▓) : el volumen de esa frecuencia en ese instante
```

Esta imagen contiene mucha más información que una simple curva de volumen: muestra con precisión qué notas/frecuencias suenan en qué momento.

## Paso 2: quedarse solo con los picos más marcados

Un espectrograma completo sigue siendo sensible al ruido ambiente (conversaciones, ruido de fondo): comparar dos espectrogramas píxel por píxel fallaría en cuanto se añadiera un ruido parásito a la señal. La solución de Shazam solo conserva los puntos más **intensos** del espectrograma (los picos que superan ampliamente a su vecindario): unas decenas de puntos por segundo, elegidos para seguir siendo visibles incluso a través de ruido ambiente, una compresión de audio o una calidad de micrófono mediocre.

```text
Espectrograma completo          Solo se conservan los picos
(sensible al ruido)             (robusto ante el ruido)

  ░▓▓░░▓░░▓▓░░░▓░░        →        •      •
  ░░▓░▓▓░░░▓▓░▓░░                    •  •
  ▓░░▓░░▓▓░░░▓░▓▓░                •        •
```

## Paso 3: hashear pares de picos, luego buscar en una base gigantesca

Cada pico se asocia con un pico vecino, y el par (frecuencia del primero, frecuencia del segundo, diferencia de tiempo entre ambos) se transforma en una huella compacta, exactamente igual que un [hash perceptual](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduce una imagen a una secuencia de bits. Estas huellas se precalculan para decenas de millones de canciones y se almacenan en un índice inmenso:

```text
Fragmento grabado → picos → huellas → busqueda en el indice
                                              ↓
Si muchas huellas coinciden con la misma cancion,
con un desfase temporal coherente → cancion identificada
```

La exigencia de un **desfase temporal coherente** entre todas las huellas coincidentes es lo que elimina los falsos positivos: unas pocas huellas pueden coincidir por azar con cualquier canción, pero decenas de ellas coincidiendo con el mismo desfase de tiempo solo pueden provenir de la misma grabación.

> **Trampa:** esperar que esta técnica reconozca una melodía tarareada o cantada por el propio usuario. La huella de audio identifica una **grabación precisa** (los mismos picos de frecuencia que el original): una versión, una interpretación en directo o un tarareo producen un espectrograma diferente al de la grabación de estudio, por lo tanto huellas diferentes, aunque un humano reconozca de inmediato "la misma canción".
>
> **Buena práctica:** usar un fragmento de la grabación original, incluso breve y con ruido (bastan unos segundos, el algoritmo solo necesita unas decenas de picos fiables); para reconocer una melodía tarareada se necesita una técnica diferente (comparar la melodía en sí, independientemente del timbre exacto de la grabación), fuera del alcance de la huella de audio clásica.

## Resumen

| | |
|---|---|
| **Para recordar** | Una huella de audio transforma el sonido en espectrograma, conserva solo los picos de frecuencia más marcados (robustos ante el ruido), y luego hashea pares de picos para buscarlos en un índice inmenso, exigiendo un desfase temporal coherente entre las coincidencias. |
| **Herramientas utilizables** | El principio (constelación de picos + hash de pares), publicado por Avery Wang (cofundador de Shazam), es utilizado por la mayoría de los servicios de reconocimiento musical. |
| **Trampas a evitar** | Esperar un reconocimiento a partir de una melodía tarareada o de una versión diferente de la grabación original. |
| **Buenas prácticas** | Usar un fragmento de la grabación original, incluso corto y con ruido; recurrir a una técnica dedicada (comparación de melodía) para una melodía tarareada. |
