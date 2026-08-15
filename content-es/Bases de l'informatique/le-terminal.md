---
order: 2
---

# La terminal: dar instrucciones por escrito

El capítulo anterior explica que [el código es una lista de instrucciones](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers), pero ¿cómo se le da concretamente una orden a un ordenador, sin hacer clic en un icono? Ese es el papel de la terminal.

## Dos formas de pilotar un ordenador

| | Interfaz gráfica (GUI) | Línea de comandos (CLI) |
|---|---|---|
| Cómo se da una orden | Haciendo clic en iconos, botones, menús | Escribiendo una instrucción en texto |
| Ejemplo concreto | Arrastrar un archivo a la papelera | Escribir una instrucción que elimina ese archivo |
| Ventaja principal | Inmediatamente visual, nada que memorizar | Preciso, repetible, automatizable (repetir 100 veces la misma instrucción de una vez) |

**GUI** (*Graphical User Interface*) y **CLI** (*Command-Line Interface*) son las dos abreviaturas que te encontrarás por todas partes para designar estos dos mundos. Este sitio se interesa sobre todo por la segunda.

> **Trampa:** suponer que una eliminación en CLI pasa por una papelera, como en GUI. La mayoría de los comandos de eliminación son **definitivos** e inmediatos, sin ningún paso de recuperación posible.
>
> **Buena práctica:** antes de escribir un comando que modifica o elimina algo, verificar una última vez qué apunta exactamente: no hay "deshacer" después.

## La terminal y el shell: dos cosas diferentes

Dos palabras se repiten todo el tiempo, y a menudo se confunden:

- La **terminal** es el programa que muestra una ventana de texto: recibe lo que escribes, y muestra lo que se le responde. Ella misma no entiende nada.
- El **shell** es el programa que recibe ese texto desde la terminal, lo interpreta, y lo ejecuta realmente.

```text
Escribes: ls
      │
      ▼
Terminal (la ventana)   →  transmite el texto escrito
      │
      ▼
Shell (el interprete)   →  entiende "ls", pide al sistema la lista de archivos
      │
      ▼
Resultado mostrado en la terminal
```

> **Analogía:** la terminal es el auricular telefónico, el shell es la persona con la que hablas. El auricular no entiende tu petición: solo transmite tu voz y te devuelve la respuesta.

> **Profundizar:** este sitio detalla en profundidad dos shells muy usados, [Bash](/?c=shells&s=bash&p=bash) (Linux/macOS) y [PowerShell](/?c=shells&s=powershell&p=powershell) (Windows), cada uno con su propio vocabulario de comandos.

> **Trampa:** intentar "reparar" un comando que no funciona cambiando de aplicación de terminal. La apariencia (colores, fuente, pestañas) depende de la terminal; los comandos disponibles dependen únicamente del shell: cambiar uno nunca cambia el otro.
>
> **Buena práctica:** ante un comando que falla, preguntarse primero "¿qué shell lo interpreta, y lo conoce?" antes de poner en duda la terminal en sí.

## Abrir una terminal

| Sistema | Cómo abrirla |
|---|---|
| Windows | Menú Inicio → escribir "Terminal" o "PowerShell" → Intro |
| macOS | Spotlight (`Cmd + Espacio`) → escribir "Terminal" → Intro |
| Linux | Según el entorno de escritorio: a menudo `Ctrl + Alt + T`, o en el menú de aplicaciones |

Una vez abierta, la terminal muestra una línea que termina con un símbolo (`>`, `$`, `%`...) seguido de un cursor parpadeante: es el **prompt**. Espera a que escribas algo; nada se ejecuta antes de pulsar `Intro`.

> **Trampa:** en Windows, confundir el **Símbolo del sistema** ([`cmd.exe`](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd), el antiguo shell histórico de Windows) con **PowerShell**: ambos se parecen visualmente, pero sus comandos y su sintaxis difieren ampliamente.
>
> **Buena práctica:** en una máquina reciente, preferir PowerShell (más completo, cf. [capítulo dedicado](/?c=shells&s=powershell&p=powershell)) al Símbolo del sistema, salvo razón precisa para usar este último.

## Anatomía de un comando

Un **comando** es el nombre de una instrucción que el shell sabe ejecutar. Puede ir seguido de **argumentos** (sobre qué actuar) y de **opciones** (que cambian su comportamiento, generalmente precedidas de `-` o `--`):

```text
ls -l /home
│  │  │
│  │  └── argumento: la carpeta concernida
│  └───── opcion: muestra los detalles (tamaño, fecha...)
└──────── comando: listar el contenido de una carpeta
```

El nombre exacto de los comandos cambia de un shell a otro (`ls` en Bash se convierte en `Get-ChildItem` en PowerShell); es el tema de los capítulos [Bash](/?c=shells&s=bash&p=bash) y [PowerShell](/?c=shells&s=powershell&p=powershell), no de este: aquí solo cuenta la estructura general (comando, opciones, argumentos).

> **Trampa:** una opción que parece inofensiva puede desactivar una protección: una opción como "forzar" o "sin confirmación" (a menudo `-f`/`--force`) elimina precisamente la pregunta "¿estás seguro?" que un comando plantearía si no.
>
> **Buena práctica:** en caso de duda sobre el efecto exacto de una opción encontrada en un comando copiado, buscarla (`--help`, documentación) antes de ejecutarlo, nunca después.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La **terminal** muestra y transmite el texto escrito; el **shell** lo interpreta y lo ejecuta realmente. Un **comando** se compone de un nombre, opciones (`-x`) y argumentos. Nada se ejecuta antes de `Intro`. |
| **Herramientas utilizables** | La terminal ya instalada en tu sistema (ver tabla de arriba): ninguna instalación adicional es necesaria para empezar. |
| **Trampas a evitar** | Confundir terminal y shell: cambiar la apariencia de la terminal nunca cambia los comandos disponibles, que dependen únicamente del shell. Escribir un comando copiado sin saber qué hace, sobre todo si modifica o elimina archivos. |
| **Buenas prácticas** | Leer el resultado mostrado después de cada comando antes de escribir otro. En caso de duda sobre el efecto de un comando encontrado en línea, buscar qué hace antes de ejecutarlo, no después. |
