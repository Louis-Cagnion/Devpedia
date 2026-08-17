---
order: 19
---

# `readline` y `termios`: controlar la línea de comandos

Un programa que simplemente lee la entrada estándar con `read()` recibe el texto tal como el terminal se lo transmite: nada antes de que el usuario pulse Entrar, ninguna gestión de las flechas direccionales, ningún historial de los comandos anteriores. Este comportamiento por defecto se llama **modo canónico** (*cooked mode*): es el propio terminal el que gestiona la edición de la línea (retroceso, desplazamiento del cursor) antes de transmitir el texto final al programa. Dos herramientas permiten ir más allá de este modo por defecto: la biblioteca `readline`, y la API `termios` para controlar el modo del propio terminal.

## `readline`: una línea de entrada editable, con historial

La biblioteca [`readline`](https://tiswww.case.edu/php/chet/readline/rltop.html) proporciona una línea de entrada completa: edición con las flechas, navegación por el historial de comandos anteriores (flecha arriba/abajo), sin que el programa tenga que reimplementar este mecanismo por sí mismo:

```c
#include <readline/readline.h>
#include <readline/history.h>

int main(void)
{
    char *ligne;

    while ((ligne = readline("mi_shell$ ")) != NULL) {
        if (*ligne) {
            add_history(ligne);   // agrega esta linea al historial (flecha arriba la encuentra)
        }

        printf("Ha escrito: %s\n", ligne);
        free(ligne);   // readline() reserva la linea: hay que liberarla uno mismo
    }

    return 0;
}
```

`readline()` muestra el prompt indicado como argumento, gestiona la edición de la línea mientras el usuario escribe, y devuelve la línea final una vez pulsado Entrar (`NULL` si el usuario cierra la entrada con Ctrl-D). `add_history()` hace que esa línea sea accesible mediante la flecha hacia arriba en las próximas entradas.

> **Nota:** `readline()` reserva la cadena devuelta con `malloc()`: es responsabilidad de quien la llama liberarla con `free()`, exactamente igual que con cualquier otro puntero reservado dinámicamente (véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)).

## `termios`: cambiar el modo del propio terminal

`readline` gestiona la edición de una línea clásica, pero algunos programas necesitan **cada tecla pulsada de inmediato**, sin esperar a Entrar, y sin que el terminal muestre automáticamente lo que se escribe (un juego en modo texto, la introducción de una contraseña). Ese es el papel de la API POSIX `termios`: controla directamente el modo del terminal.

```c
#include <termios.h>
#include <unistd.h>

struct termios ancien, nouveau;

tcgetattr(STDIN_FILENO, &ancien);   // guarda la configuracion actual del terminal
nouveau = ancien;
nouveau.c_lflag &= ~(ICANON | ECHO);   // desactiva el modo canonico Y la visualizacion automatica
tcsetattr(STDIN_FILENO, TCSANOW, &nouveau);   // aplica el nuevo modo

// ... lectura tecla por tecla, sin esperar a Entrar, sin eco automatico ...

tcsetattr(STDIN_FILENO, TCSANOW, &ancien);   // restaura el modo original antes de salir
```

| Indicador (`c_lflag`) | Función | Desactivado para... |
|---|---|---|
| `ICANON` | Modo canónico: el terminal solo transmite una línea después de Entrar | Recibir cada tecla de inmediato (modo bruto, *raw mode*) |
| `ECHO` | El terminal muestra automáticamente lo que se escribe | Controlar uno mismo lo que se muestra (contraseña oculta, interfaz personalizada) |

> **Trampa:** modificar el terminal con `tcsetattr()` sin restaurar nunca su configuración original antes de que el programa termine. El terminal del usuario queda entonces en modo bruto después del cierre del programa: ya no hay eco de las teclas pulsadas, ya no hay edición de línea normal en el shell que recupera el control, un terminal que parece "roto" hasta que el usuario lo reinicia manualmente (`reset` o `stty sane`).
>
> **Buena práctica:** guardar siempre la configuración original (`tcgetattr()`) antes de modificarla, y restaurarla explícitamente (`tcsetattr()`) en cada posible salida del programa, incluyendo una señal de interrupción (véase [Las señales UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)) o un error, no solo en el camino de salida normal.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El modo canónico (por defecto) deja que el terminal gestione la edición de línea; `readline` proporciona una línea de entrada editable con historial sin reimplementar este mecanismo; `termios` permite desactivar ese modo para recibir cada tecla de inmediato (modo bruto). |
| **Herramientas utilizables** | `readline()`/`add_history()` para una línea de entrada con historial. `tcgetattr()`/`tcsetattr()` y los indicadores `ICANON`/`ECHO` para controlar el modo del terminal. |
| **Trampas a evitar** | Modificar el terminal con `tcsetattr()` sin restaurar nunca su configuración original, dejando el terminal del usuario en modo bruto después del cierre del programa. |
| **Buenas prácticas** | Guardar la configuración original antes de modificarla, y restaurarla en cualquier posible salida del programa (normal, error, señal). |
