---
order: 2
---

# Color y contraste

El color es una de las palancas de la [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle): atrae el ojo y distingue los elementos entre sí. Merece su propio capítulo porque obedece a reglas propias: de armonía, de legibilidad y de accesibilidad.

## La rueda cromática y las armonías

La **rueda cromática** coloca los colores en círculo, en el orden en que se degradan unos hacia otros:

```roue-chromatique
label: La rueda cromatica
```

Su posición relativa en este círculo determina combinaciones ("armonías") que funcionan visualmente:

| Armonía | Cómo detectarla en la rueda | Ejemplo | Efecto visual |
|---|---|---|---|
| Complementaria | Dos colores opuestos entre sí | Rojo / Verde | Fuerte contraste, dinámico; puede cansar el ojo si se abusa de ella |
| Análoga | Varios colores vecinos | Amarillo / Verde / Azul | Suave y coherente, poco contraste |
| Triádica | Tres colores regularmente espaciados | Rojo / Amarillo / Azul | Vivaz y equilibrada, más difícil de dosificar |

El mismo principio geométrico, independientemente de los nombres exactos de los colores (su posición exacta en la rueda varía según el modelo de color usado):

```roue-chromatique
hues: 30, 210
label: Complementaria (opuestas)
```

```roue-chromatique
hues: 90, 120, 150
label: Analoga (vecinas)
```

```roue-chromatique
hues: 30, 150, 270
label: Triadica (espaciadas 120 grados)
```

> **Trampa:** elegir una armonía (por ejemplo triádica) y luego usar sus colores en partes iguales. El resultado pierde toda [jerarquía visual](/?c=ui-ux&p=hierarchie-visuelle) y se vuelve chillón: ninguno de los tres se distingue como el más importante.
>
> **Buena práctica:** repartir los colores según una proporción dominante/secundario/acento; una regla común es el **60-30-10**: 60 % de un color dominante neutro, 30 % de un color secundario, 10 % de un color de acento reservado a los elementos que realmente deben resaltar (un botón de acción, por ejemplo).

## El contraste: la legibilidad ante todo (WCAG)

El **WCAG** (*Web Content Accessibility Guidelines*) es un conjunto de reglas de referencia para la accesibilidad web. Define una **relación de contraste** mínima entre un texto y su fondo, medida automáticamente por una herramienta (no a calcular a mano):

| Nivel | Relación mínima | Se aplica a |
|---|---|---|
| AA | 4.5 : 1 | Texto normal (el nivel mínimo generalmente recomendado) |
| AA (texto grande) | 3 : 1 | Títulos y texto de gran tamaño (≥ 18 pt, o 14 pt en negrita) |
| AAA | 7 : 1 | Nivel reforzado, recomendado para un público con baja visión |

> **Trampa:** un texto gris claro sobre fondo blanco, elegido "porque se ve más suave". Visualmente discreto, pero a menudo por debajo de la relación 4.5:1: ilegible para una parte de los usuarios (vista débil, pantalla a pleno sol, pantalla mal calibrada...).
>
> **Buena práctica:** verificar la relación real con una herramienta dedicada (el verificador de contraste integrado en las herramientas de desarrollo del navegador, o un verificador en línea) en lugar de a simple vista.

## Nunca codificar una información solo mediante el color

```text
❌ Malo: en un formulario, un campo con error tiene borde rojo, un campo valido borde verde:
   es la UNICA diferencia entre ambos.

✅ Bueno: el campo con error tiene borde rojo, Y muestra un icono ⚠, Y un mensaje de texto
   ("Formato de email invalido"): tres indicios, dos de los cuales no dependen de la percepcion del color.
```

> **Trampa:** distinguir dos estados únicamente por el color (rojo/verde en particular). Alrededor del 8 % de los hombres (una proporción menor entre las mujeres) tiene alguna forma de daltonismo y no percibe esa diferencia.
>
> **Buena práctica:** duplicar sistemáticamente una información codificada en color con un segundo indicio que no dependa de él: icono, texto, posición, forma o patrón.

## Significado cultural de los colores

Un color no evoca lo mismo en todas partes, hay que matizarlo según el público realmente objetivo, sobre todo para un producto internacional:

| Color | Asociación frecuente (cultura occidental) | Matiz en otros lugares |
|---|---|---|
| Rojo | Peligro, urgencia | Color de la suerte y la fiesta en China |
| Blanco | Pureza, boda | Color de luto en varias culturas de Asia oriental |
| Verde | Naturaleza, validación, dinero (cultura estadounidense) | Asociación mucho más débil con el dinero fuera de Estados Unidos |

> **Buena práctica:** nunca suponer que una asociación es universal. Verificarla con el público objetivo real en lugar de fiarse de una sola referencia cultural.

> **Tendencia actual (2026):** hiperpersonalización de las paletas (interfaces que pueden adaptarse a las preferencias de cada usuario) y regreso a colores marcados, "con carácter", en lugar de tonos neutros genéricos.

## Pasar a la implementación

En [CSS](/?c=langages-de-balisage&s=css&p=css), una paleta de colores se declara como un conjunto de valores reutilizables en lugar de repetirse en cada regla: ver [Variables CSS y la cascada](/?c=langages-de-balisage&s=css&p=variables-et-cascade).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El color combina armonías (complementaria, análoga, triádica) y un contraste suficiente (relaciones WCAG AA 4.5:1 / AAA 7:1) para seguir siendo a la vez estético y legible por todos. |
| **Herramientas utilizables** | Un verificador de contraste (integrado en las herramientas de desarrollo del navegador, o en línea) para comprobar una relación real en lugar de a simple vista. |
| **Trampas a evitar** | Usar los colores de una armonía en partes iguales (pérdida de jerarquía); codificar una información únicamente mediante el color (invisible para los daltónicos, ~8 % de los hombres). |
| **Buenas prácticas** | Repartir los colores en dominante/secundario/acento (regla del 60-30-10); duplicar toda información codificada en color con un segundo indicio (icono, texto, forma). |
