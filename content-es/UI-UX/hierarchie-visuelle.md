---
order: 1
---

# Jerarquía visual

Frente a una pantalla, nadie lee en el orden del código fuente: el ojo salta espontáneamente hacia ciertos elementos antes que hacia otros. La **jerarquía visual** es la técnica que decide ese orden en lugar del azar.

**Jerarquía visual**: organizar los elementos de una pantalla para que el ojo vaya primero hacia lo que más importa, luego hacia el resto en un orden deseado.

> **Analogía:** la portada de un periódico. El título principal es enorme, el subtítulo más pequeño, el cuerpo del texto aún más pequeño. Nadie necesita que le digan qué leer primero: el tamaño solo ya lo indica.

**Por qué importa:** sin jerarquía, todos los elementos tienen el mismo peso visual. El usuario debe entonces leer todo para encontrar la información que busca: en un sitio o una app, ese tiempo perdido se traduce directamente en abandono.

## Las palancas de la jerarquía

Un elemento resalta respecto a los demás mediante una combinación de estas palancas:

| Palanca | Efecto | Ejemplo |
|---|---|---|
| Tamaño | Más grande = percibido como más importante | Un título `h1` más grande que el texto corriente |
| Peso / grosor | Más grueso (negrita) = atrae el ojo | Una palabra clave en **negrita** en un párrafo |
| Color | Un color que contrasta con el resto atrae la atención | Un botón de acción coloreado en medio de una página en escala de grises |
| Contraste | Un elemento nítido sobre un fondo que lo opone resalta | Texto oscuro sobre fondo claro, o al revés |
| Espaciado | Más espacio vacío alrededor de un elemento = está aislado, por lo tanto se nota | Un título rodeado de margen en lugar de pegado al texto siguiente |
| Posición | Un elemento colocado arriba o a la izquierda (lectura occidental) se ve primero | El logo y el menú principal en la parte superior de una página |

```text
<h1>Titulo principal</h1>        → grande, negrita: leido primero
<p>Texto de introduccion.</p>    → tamano normal: leido despues
<small>Avisos legales</small>    → pequeno, discreto: leido al final, si hace falta
```

Estas palancas se combinan: un título grande Y negrita Y aislado por espacio resalta mucho más que un título que solo tiene uno de estos tres atributos.

## Un punto focal por pantalla: primario, secundario, terciario

En una pantalla dada, cada elemento se clasifica en uno de estos tres roles:

| Rol | Función en la pantalla | Ejemplo |
|---|---|---|
| Primario | El único elemento que el usuario debe ver primero | El botón "Registrarse" de una página de inicio |
| Secundario | Lo que apoya o explica el primario | El subtítulo que describe la oferta |
| Terciario | El detalle consultado solo si hace falta | Los avisos legales, un enlace "saber más" |

> **Trampa:** querer destacar todo al mismo tiempo: un título enorme, varios botones coloreados, texto en negrita por todas partes. Resultado: ya nada resalta, la pantalla se convierte en un desorden visual donde el ojo ya no sabe adónde ir (la *sobrecarga visual*).
>
> **Buena práctica:** elegir un único elemento primario por pantalla antes de diseñar cualquier otra cosa. Todo lo demás se jerarquiza después, por debajo de él, nunca a su nivel.

## Patrones de lectura: F-pattern y Z-pattern

Los estudios de seguimiento de la mirada (*eye-tracking*) muestran que el ojo sigue trayectorias recurrentes según el tipo de página.

**F-pattern**: para una página densa en texto (artículo, resultados de búsqueda, lista de productos):

```text
█████████████████████████    ← 1ra linea: barrida por completo
████████████
█
████████████████             ← 2da linea: barrida, mas corta
████
█                             ← luego el ojo baja sobre todo
█                                a lo largo del margen izquierdo,
█                                leyendo poco el resto de cada linea
```

El usuario lee por completo las primeras líneas, luego se limita a escanear el inicio de las líneas siguientes mientras baja. Consecuencia práctica: poner la información más importante en las primeras palabras de cada título o párrafo.

**Z-pattern**: para una página simple y poco densa (página de inicio, landing page):

```text
[Logo]──────────────────────►[Menu / Inicio de sesion]
                                            ╱
                                 ╱
                     ╱
           ╱
  ╱
[Argumento clave]──────────────►[Boton de accion]
```

El ojo parte arriba a la izquierda, barre hacia la derecha, baja en diagonal, y luego barre una última vez hacia la derecha: ahí se coloca naturalmente el botón de acción principal (el punto primario definido más arriba).

> **Trampa:** aplicar un Z-pattern a una página densa en texto (o al revés). El patrón de lectura depende de la densidad del contenido, no de una preferencia estética: una mala elección empuja al usuario a leer en el desorden que quiso el diseñador, no en el que le viene naturalmente.

> **Tendencia actual (2026):** tras varios años de maquetaciones muy experimentales, la tendencia vuelve hacia jerarquías legibles y predecibles, más cercanas a estos esquemas clásicos que a una composición sorprendente: la novedad visual cede terreno frente a la rapidez de comprensión.

## Pasar a la implementación

Este capítulo permanece deliberadamente independiente de un lenguaje: las palancas anteriores (tamaño, espaciado, posición...) se traducen concretamente en CSS mediante [El modelo de caja](/?c=langages-de-balisage&s=css&p=box-model) (espaciado, dimensiones) y [El posicionamiento](/?c=langages-de-balisage&s=css&p=positionnement) (colocación de los elementos en pantalla).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La jerarquía visual organiza una pantalla para que el ojo vaya primero hacia lo que importa. Se logra mediante palancas (tamaño, peso, color, contraste, espaciado, posición) y se apoya en un único elemento primario por pantalla. |
| **Herramientas utilizables** | Ninguna herramienta específica: la jerarquía se decide en el momento del diseño (boceto, maqueta) y luego se traduce en código (CSS, principalmente). |
| **Trampas a evitar** | Destacar varios elementos al mismo tiempo (sobrecarga visual, ya nada resalta); aplicar un patrón de lectura (F o Z) que no corresponde a la densidad real del contenido. |
| **Buenas prácticas** | Elegir un único elemento primario por pantalla antes de jerarquizar el resto; combinar varias palancas (tamaño + espaciado + posición) en lugar de una sola para reforzar un elemento importante. |
