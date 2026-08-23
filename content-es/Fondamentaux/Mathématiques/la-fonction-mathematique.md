---
order: 1
---

# La función matemática

Este capítulo plantea una noción retomada en estadística, machine learning e inteligencia artificial: la función, en el sentido matemático, que no debe confundirse con la [función en programación](/?c=shells&s=bash&p=fonctions), que le toma prestado el nombre sin siempre respetar su regla (ver la trampa más abajo).

Una **función matemática** es una regla que asocia, a cada entrada, **siempre la misma** salida.

```text
f(x) = x * 2

f(3)  -> 6   (siempre 6, cada vez que se llama a f con 3)
f(3)  -> 6   (llamada de nuevo con la misma entrada: mismo resultado, sin excepción)
f(5)  -> 10
```

> **Analogía:** una máquina expendedora de bebidas bien configurada: presionar el botón "A1" siempre da la misma bebida. Si un día ese mismo botón diera a veces un jugo, a veces un café, ya no sería una función en el sentido matemático: el resultado ya no dependería únicamente de la entrada.

> **Trampa:** una función en programación (ver [Las funciones](/?c=shells&s=bash&p=fonctions) en [Bash](/?c=shells&s=bash&p=bash), o su equivalente en cualquier otro lenguaje) **no** tiene esta garantía: una función que lee la hora actual, saca un número [aleatorio](/?c=representation-des-donnees&p=aleatoire-et-generateurs), o lee un archivo puede devolver un resultado distinto en cada llamada, con la misma entrada. Se le llama entonces una función **no determinista**: un término que volverá para explicar por qué ciertos sistemas (entre ellos un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) nunca responden dos veces exactamente lo mismo.
>
> **Buena práctica:** en programación, preferir una función determinista (misma entrada → siempre misma salida) siempre que sea posible: una misma llamada da entonces un resultado predecible, por tanto más simple de testear y depurar.

## Una función puede recibir varias entradas

Nada obliga a una función a tener una sola entrada:

```text
f(x, y) = x + y

f(2, 3)   -> 5
f(10, 1)  -> 11
```

Cada entrada adicional es un nuevo parámetro de la función, exactamente como una función en programación puede recibir varios argumentos. Esta forma con varias entradas es la más frecuente en la práctica: un modelo de machine learning combina casi siempre varias entradas (edad, salario, historial...) para producir una sola salida.

> **Trampa:** olvidar que una entrada faltante no tiene salida definida. `f(x, y) = x / y` no tiene resultado para `y = 0`: la función simplemente no está definida en ese punto, no es un valor particular tipo "cero" o "vacío".
>
> **Buena práctica:** identificar, antes de codificar una función, las entradas para las que no tiene una salida con sentido (división por cero, raíz cuadrada de un número negativo...), y decidir explícitamente qué hacer en esos casos (error, valor por defecto) en lugar de dejar que el lenguaje reaccione a su manera.

## Representar una función mediante una curva

En un gráfico, cada par (entrada, salida) se convierte en un punto: unir todos esos puntos dibuja la **curva** de la función, aquí para `f(x) = x²`:

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x²
```

Una curva que sube significa que la salida aumenta con la entrada; una curva que baja significa lo contrario: aquí, la curva baja hasta `x = 0` y luego vuelve a subir, exactamente el tipo de hueco que el capítulo sobre [la derivada y el gradiente](/?c=mathematiques&p=la-derivee-et-le-gradient) enseña a detectar, para explicar cómo un ordenador "desciende" una curva para encontrar su punto más bajo.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una función matemática asocia a cada entrada siempre la misma salida (`f(x)`), puede recibir varias entradas (`f(x, y)`), y se representa visualmente mediante una curva. |
| **Herramientas utilizables** | Ninguna herramienta específica: la notación `f(x) = ...` basta para describir una función en papel. |
| **Trampas a evitar** | Confundir una función matemática (siempre determinista) con una función en programación, que puede no serlo (hora actual, aleatorio, lectura de archivo). Olvidar que una entrada puede no tener ninguna salida definida (división por cero). |
| **Buenas prácticas** | Verificar que una función en programación supuestamente "pura" (misma entrada → misma salida) no dependa de ninguna fuente externa cambiante. Decidir explícitamente qué hacer con las entradas sin salida definida en lugar de dejar que el lenguaje reaccione a su manera. |
