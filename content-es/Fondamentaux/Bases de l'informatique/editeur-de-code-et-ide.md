---
order: 3
---

# El editor de código y el IDE

Un [archivo de código](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) es un archivo de texto: técnicamente, escribirlo con [Notepad](https://learn.microsoft.com/en-us/windows/win32/menurc/notepad) o [TextEdit](https://support.apple.com/guide/textedit/welcome/mac) bastaría. En la práctica, nadie hace eso: una herramienta dedicada hace la escritura de código mucho más cómoda.

## Editor de texto simple vs editor de código

| | Editor de texto simple (Notepad, TextEdit) | Editor de código |
|---|---|---|
| Qué hace | Muestra y modifica texto plano | Muestra y modifica texto, entendiendo que es código |
| Resaltado de sintaxis | No: todo el texto tiene el mismo color | Sí: palabras clave, cadenas de texto, comentarios... cada uno su color |
| Ayuda a la escritura | Ninguna | Autocompletado, detección de errores, navegación en el código |

**El resaltado de sintaxis** consiste en mostrar cada tipo de elemento del código en un color diferente, para que su estructura se vea de un vistazo, sin siquiera leer cada palabra. Ves un ejemplo concreto en esta misma página: cada bloque de código de Devpedia está coloreado así.

```python
# Esto es un comentario           -> un color
nombre = "Juan"                   # "Juan" es una cadena de texto -> otro color
```

> **Trampa:** usar un procesador de texto ([Word](https://www.microsoft.com/microsoft-365/word), [WordPad](https://learn.microsoft.com/en-us/windows/win32/menurc/wordpad)) para escribir código. Más allá de la ausencia de resaltado de sintaxis, estos programas reemplazan silenciosamente ciertos caracteres por su equivalente "tipográfico" (comillas curvas `“ ”` en lugar de `" "`, guiones largos...), invisibles a simple vista, pero que hacen el código sintácticamente inválido.
>
> **Buena práctica:** escribir siempre código en un editor de **texto plano** (simple o de código), nunca en un procesador de texto, ni siquiera "solo para salir del paso".

## El IDE: un editor de código, más herramientas integradas

**IDE** significa *Integrated Development Environment* (entorno de desarrollo integrado): además de editar código, agrupa en una sola aplicación herramientas que de otro modo se usarían por separado.

| Herramienta integrada | Papel |
|---|---|
| Terminal integrada | Una [terminal](/?c=bases-de-l-informatique&p=le-terminal) directamente en la ventana, sin abrir otra al lado |
| Botón "Ejecutar" | Lanza el programa sin escribir el comando a mano: entre bastidores, ejecuta exactamente lo mismo que si lo hubieras escrito en una terminal |
| Detección de errores | Señala un error probable incluso antes de ejecutar el código (ej. un paréntesis nunca cerrado) |
| Depurador | Permite ejecutar el código paso a paso, para observar el estado de los datos en cada etapa |

> **Nota:** la frontera entre "simple editor de código" e "IDE completo" no es estricta: un editor como VS Code arranca ligero, pero se acerca a un IDE una vez instaladas extensiones para un lenguaje dado.

> **Trampa:** en un proyecto de varios archivos, suponer que el botón "Ejecutar" siempre relanza el archivo actualmente mostrado en pantalla: muchos IDE recuerdan una **configuración de lanzamiento** distinta, que puede apuntar a otro archivo diferente del que se mira, sin señalarlo claramente.
>
> **Buena práctica:** ante un resultado que no cambia a pesar de una modificación, verificar qué archivo se ejecuta realmente antes de buscar un bug en otro sitio.

| Herramienta | Categoría | Lenguajes objetivo |
|---|---|---|
| [VS Code](https://code.visualstudio.com) | Editor de código extensible | Generalista: casi todos, vía extensiones |
| [PyCharm](https://www.jetbrains.com/pycharm/) | IDE completo | [Python](/?c=langages-de-programmation&s=python&p=python) |
| [Visual Studio](https://visualstudio.microsoft.com) (no confundir con VS Code) | IDE completo | [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/), [.NET](https://learn.microsoft.com/en-us/dotnet/) |

## Por dónde empezar

Para empezar, un editor generalista y gratuito como **VS Code** (disponible en Windows, macOS y Linux) cubre ampliamente las necesidades de los primeros capítulos de este sitio, sea cual sea el lenguaje abordado después; no hace falta un IDE dedicado a un lenguaje concreto antes de necesitarlo de verdad.

> **Trampa:** instalar de golpe numerosas extensiones "por si acaso": más allá de ralentizar el editor, extensiones que se solapan (ej. dos extensiones de coloreado para el mismo lenguaje) pueden entrar en conflicto, dificultando saber cuál es responsable de un comportamiento inesperado.
>
> **Buena práctica:** instalar una extensión a la vez, solo cuando surge una necesidad concreta, no por anticipación.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un editor de código añade el resaltado de sintaxis y la ayuda a la escritura que un editor de texto simple no tiene. Un IDE va más lejos: terminal integrada, botón "Ejecutar", detección de errores, depurador, todo agrupado en una sola aplicación. |
| **Herramientas utilizables** | Un editor generalista como VS Code para empezar; un IDE dedicado (PyCharm, Visual Studio...) solo una vez elegido un lenguaje concreto. |
| **Trampas a evitar** | Escribir código en un editor de texto simple (Notepad, TextEdit) sin resaltado de sintaxis ni detección de errores: nada lo impide técnicamente, pero cada error se vuelve mucho más difícil de detectar. |
| **Buenas prácticas** | El botón "Ejecutar" de un IDE no hace nada mágico: lanza el mismo comando que ejecutaría una terminal; entender ese comando sigue siendo útil incluso si nunca se escribe a mano. |
