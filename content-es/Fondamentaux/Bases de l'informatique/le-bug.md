---
order: 7
---

# El bug

El [primer capítulo](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) lo anunciaba: un ordenador ejecuta las instrucciones al pie de la letra, sin adivinar nunca una intención. Un **bug** es la consecuencia directa de esta regla: un defecto del código que le impide producir el resultado esperado, no porque el ordenador "se equivoque", sino porque las propias instrucciones eran imprecisas, incompletas o incorrectas.

> **Analogía:** una receta que dice "verter leche" sin precisar la cantidad. Quien la sigue al pie de la letra debe elegir una cantidad, no necesariamente la que el autor tenía en mente.

## Un ejemplo concreto

```text
saldo = 100
retirar = 150
saldo = saldo - retirar  → saldo se convierte en -50: nada verificó que hubiera suficiente dinero
mostrar saldo            → muestra -50
```

El código se ejecuta sin fallar, y hace exactamente lo que está escrito; ese es precisamente el problema: nadie escribió la instrucción "rechazar el retiro si el saldo es insuficiente".

> **Buena práctica:** validar las condiciones críticas antes de actuar (aquí: `retirar <= saldo`), en lugar de ejecutar la operación y descubrir el problema en el resultado final.

## Tres familias de bugs

| Tipo de bug | Qué ocurre | Ejemplo |
|---|---|---|
| Error de sintaxis | El código no respeta la gramática del lenguaje: ni siquiera puede ejecutarse | Un paréntesis nunca cerrado |
| Error de ejecución (*crash*) | El código es válido, pero encuentra una situación que no sabe gestionar, y se detiene bruscamente | Dividir un número por cero |
| Error lógico | El código se ejecuta sin fallar, pero produce un resultado falso | El ejemplo del saldo negativo de arriba |

El error lógico es el más difícil de los tres de detectar: nada avisa de que ha ocurrido un problema, ya que el programa termina normalmente; solo el resultado es falso.

> **Trampa:** creer que un programa que se ejecuta sin fallar es forzosamente correcto. La ausencia de crash no dice nada sobre un error lógico: solo una verificación del resultado obtenido (contra el resultado esperado) lo revela.
>
> **Buena práctica:** para toda tarea donde el resultado correcto se pueda conocer de antemano (aunque sea aproximadamente), compararlo sistemáticamente con el resultado obtenido, en lugar de confiar en el solo hecho de que "funciona".

## Leer un mensaje de error

Ante un crash, la mayoría de los lenguajes muestran un mensaje que indica dónde y por qué falló:

```text
Error: division por cero
  en la linea 4, en la funcion "calcular_media"
```

Aprender a leer este tipo de mensaje (qué línea, qué causa) ahorra un tiempo considerable.

> **Trampa:** detenerse en la línea indicada suponiendo que ahí está forzosamente el error. El crash ocurre donde el problema se vuelve visible (ej. un valor ausente usado), no necesariamente donde se **creó** (ej. el valor ausente pudo haberse definido mucho más arriba).
>
> **Buena práctica:** tomar la línea indicada como punto de partida de la búsqueda, no como veredicto final; remontar hacia atrás si la causa no es directamente visible ahí.

## Cómo se detectan

Un [IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) ayuda con las tres familias a su manera: detección de errores de sintaxis incluso antes de ejecutar el código, mensaje mostrado en el momento de un crash, y un depurador para observar el estado de las variables paso a paso, útil en particular para un error lógico, invisible de otro modo.

> **Trampa:** deducir de ahí que una ausencia de aviso del IDE ("ningún subrayado rojo") garantiza la ausencia de bug. La detección de errores de un IDE solo cubre la sintaxis (y a veces algunos errores de ejecución evidentes), nunca los errores lógicos, que solo se ven en el resultado producido.
>
> **Buena práctica:** nunca confundir "el IDE no señala nada" con "el programa es correcto": solo tests contra un resultado esperado cubren los errores lógicos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un bug siempre viene de una instrucción imprecisa o incompleta, nunca de un "error de comprensión" del ordenador. Tres familias: error de sintaxis (no se ejecuta), error de ejecución (falla en el camino), error lógico (se ejecuta, pero da un resultado falso). |
| **Herramientas utilizables** | La detección de errores y el depurador de un IDE; el mensaje de error mostrado durante un crash. |
| **Trampas a evitar** | Ignorar un mensaje de error sin leerlo entero: la línea y la causa indicadas son casi siempre el punto de partida más rápido, aunque no siempre basten por sí solas. |
| **Buenas prácticas** | Ante un error lógico (sin mensaje, solo un resultado falso), verificar paso a paso qué hace realmente cada instrucción, en lugar de suponer que hace lo que se quería. |
