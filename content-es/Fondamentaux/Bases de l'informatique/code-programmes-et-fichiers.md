---
order: 1
---

# ¿Qué ejecuta un ordenador?

Antes de hablar de terminal, editor de código o de un lenguaje concreto, una sola pregunta importa: ¿qué hace realmente un ordenador cuando se dice que "ejecuta" algo? Este capítulo sienta esta base: todo el resto del sitio se apoyará en ella.

## Un ordenador sigue instrucciones, sin entenderlas

Un ordenador no "razona" y nunca adivina una intención. Hace una sola cosa, muy rápido y sin hacerse preguntas: leer una lista de instrucciones, en orden, y ejecutarlas una por una, exactamente como están escritas.

```text
Instruccion 1  →  ejecutada tal cual
Instruccion 2  →  ejecutada tal cual
Instruccion 3  →  ejecutada tal cual
```

> **Analogía:** es como seguir una receta de cocina al pie de la letra, sin improvisar nunca. Si la receta dice "romper 2 huevos", se rompen 2 (ni más, ni menos) y no se pregunta por qué.

**Por qué importa:** casi todo lo que puede parecer "inteligente" en un ordenador (corregir una errata, adivinar lo que se quería hacer) en realidad viene de instrucciones escritas de antemano por un humano para ese caso preciso, nunca de una comprensión del problema por la propia máquina.

> **Trampa:** creer que una instrucción imprecisa será "entendida razonablemente". El ordenador siempre elige una interpretación precisa (a menudo la más literal posible), no necesariamente la imaginada al escribirla; ver el capítulo sobre [el bug](/?c=bases-de-l-informatique&p=le-bug) para lo que eso produce concretamente.
>
> **Buena práctica:** escribir instrucciones lo más precisas posible, sin dejar nada a "adivinar" por la máquina.

## El código: la lista de instrucciones escrita por un humano

El **código** (o **código fuente**) es el texto que contiene estas instrucciones. Lo escribe una persona, en un **lenguaje de programación**, uno de los numerosos "idiomas" que un ordenador puede seguir, cada uno con su propia gramática (Python, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C...).

```text
mostrar "Hola"          → escribe "Hola" en pantalla
mostrar "Adios"         → escribe "Adios" en pantalla justo despues
```

> **Nota:** el bloque de arriba no es un lenguaje real: es **pseudocódigo**, una forma simplificada de escribir instrucciones sin la sintaxis precisa de un lenguaje real. Sirve únicamente para ilustrar la idea de una secuencia de instrucciones, antes de elegir uno de verdad.

Devpedia detalla varios lenguajes en profundidad, cada uno en su propio capítulo (por ejemplo [Python](/?c=langages-de-programmation&s=python&p=python) o [C](/?c=langages-de-programmation&s=c&p=c)). Este capítulo no entra en ninguno de ellos: solo el principio común a todos.

> **Trampa:** intentar ejecutar tal cual el pseudocódigo de arriba en un lenguaje real: no funcionará, es solo una ilustración simplificada, no una sintaxis real.
>
> **Buena práctica:** verificar siempre la sintaxis exacta esperada por el lenguaje elegido (capítulo dedicado) antes de escribir código destinado a ejecutarse realmente.

## El archivo: dónde se guarda el código

Un **archivo** es una unidad de datos almacenada en el disco del ordenador, identificada por un **nombre** y una **extensión**, la parte tras el punto, que indica su tipo de contenido.

| Extensión | Tipo de contenido | Ejemplo de nombre |
|---|---|---|
| `.txt` | Texto plano, sin formato | `notas.txt` |
| `.py` | Código fuente en lenguaje Python | `programa.py` |
| `.js` | Código fuente en lenguaje JavaScript | `script.js` |
| `.md` | Texto en formato Markdown (el de esta página) | `README.md` |

> **Analogía:** un archivo es como una hoja de papel guardada en un archivador (la **carpeta**), con un nombre escrito en la pestaña para encontrarla.

El código fuente casi siempre se escribe en un archivo de texto; entender "archivo" es necesario antes de poder navegar por una estructura de carpetas o abrir cualquier cosa en un editor, dos capítulos que vienen a continuación.

> **Trampa:** creer que renombrar un archivo cambia lo que contiene: renombrar `notas.txt` a `notas.py` no transforma un texto cualquiera en código Python válido. La extensión es solo una **indicación** para los humanos y las herramientas (qué editor abrir, qué coloreado aplicar); lo que realmente decide la naturaleza de un archivo es lo que lo abre y lo interpreta, nunca su nombre.
>
> **Buena práctica:** elegir la extensión que corresponde al contenido real del archivo, no al revés.

## Programa: lo que el ordenador ejecuta de verdad

El código escrito por un humano no siempre es lo que el procesador ejecuta directamente. Existen dos enfoques:

| | Interpretado | Compilado |
|---|---|---|
| Qué ocurre | Otro programa, el **intérprete**, lee el código y lo ejecuta directamente, línea por línea | Un programa, el **compilador**, transforma primero todo el código en una forma que el procesador entiende nativamente |
| Cuándo empieza la ejecución | Inmediatamente | Solo una vez terminada la transformación (la **compilación**) |
| Ejemplo de lenguaje | Python, JavaScript | C, [C++](/?c=langages-de-programmation&s=cpp&p=cpp) |

> **Profundizar:** este capítulo se detiene en esta distinción de principio; el detalle de lo que ocurre durante una compilación (etapas, errores posibles) se cubre en [El proceso de compilación](/?c=langages-de-programmation&s=c&p=compilation).

> **Trampa:** creer que un programa compilado funciona en todas partes tal cual. Un ejecutable compilado para Windows no se ejecuta en Linux o macOS: la compilación produce código específico del sistema destino, hay que recompilar para cada sistema objetivo.
>
> **Buena práctica:** para un programa interpretado, verificar que el intérprete del lenguaje correcto esté instalado en la máquina destino; para un programa compilado, recompilarlo para cada sistema objetivo en lugar de suponer que un solo ejecutable bastará en todas partes.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un ordenador ejecuta instrucciones al pie de la letra, sin entender su sentido. El **código** es esa lista de instrucciones, escrita en un **lenguaje de programación**, guardada en un **archivo**. Un programa es **interpretado** (ejecutado directamente) o **compilado** (transformado antes de ejecutarse). |
| **Herramientas utilizables** | Ninguna por ahora: la terminal y el editor de código, para escribir y lanzar código uno mismo, llegan en los dos próximos capítulos. |
| **Trampas a evitar** | Creer que el ordenador "entiende" lo que se quiere hacer, o que puede adivinar una intención no escrita explícitamente en el código. Confundir un archivo cualquiera con un programa: un archivo `.txt` nunca se ejecuta, un archivo `.py` solo se ejecuta vía un intérprete Python. |
| **Buenas prácticas** | Distinguir siempre, ante un problema, "qué dice hacer el código" de "qué quería yo que hiciera": la mayoría de los errores de principiante vienen de una instrucción ejecutada al pie de la letra, pero mal formulada. |
