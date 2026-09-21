---
order: 12
---

# Los Makefiles

Un **Makefile** automatiza la compilación de un proyecto en C con varios archivos: en lugar de volver a escribir manualmente cada comando [`gcc`](https://gcc.gnu.org) (véase [El proceso de compilación](/?c=langages-de-programmation&s=c&p=compilation)), se describen una vez las reglas de construcción, y la herramienta `make` las ejecuta, recompilando únicamente lo que realmente ha cambiado desde la última vez.

## Anatomía de una regla

```makefile
objetivo: dependencias
	comando
```

```makefile
programa: main.o calculos.o
	gcc main.o calculos.o -o programa
```

"Para construir `programa`, necesito `main.o` y `calculos.o`; si alguno de los dos es más reciente que `programa` (o si `programa` todavía no existe), ejecuta el comando." La línea de comando **debe** estar sangrada con una tabulación, nunca con espacios: uno de los errores más frecuentes con los Makefiles.

## Encadenar reglas

```makefile
programa: main.o calculos.o
	gcc main.o calculos.o -o programa

main.o: main.c calculos.h
	gcc -c main.c -o main.o

calculos.o: calculos.c calculos.h
	gcc -c calculos.c -o calculos.o
```

Al escribir simplemente `make`, la herramienta construye la **primera regla del archivo** (`programa`), y recorre recursivamente sus dependencias: para obtener `main.o`, consulta la regla `main.o: ...`, etc. Si `calculos.c` no ha cambiado desde la última compilación, `make` no vuelve a compilar `calculos.o`: solo se reconstruye la parte modificada del proyecto.

## Variables

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programa: main.o calculos.o
	$(CC) main.o calculos.o -o programa

main.o: main.c calculos.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` y `$(CFLAGS)` son variables de Makefile: cambiar el compilador o las opciones de advertencia entonces solo requiere una única modificación, al principio del archivo.

| Opción `gcc` habitual | Función |
|---|---|
| `-Wall -Wextra` | Activa la mayoría de las advertencias útiles del compilador |
| `-g` | Añade la información de depuración (necesaria para `gdb`/Valgrind) |
| `-o nombre` | Nombra el archivo de salida |
| `-O2` | Activa [el nivel de optimización](/?c=langages-de-programmation&s=c&p=compilation) recomendado en producción |

> **Trampa:** `-O2`/`-O3` en `CFLAGS` puede hacer aparecer un aviso ausente en `-O0` (véase [Los niveles de optimización](/?c=langages-de-programmation&s=c&p=compilation)): probar `make` con las `CFLAGS` realmente usadas en producción, no solo con una configuración de depuración (`-O0 -g`).

## Objetivos ficticios (`.PHONY`)

Un objetivo como `clean` no corresponde a ningún archivo real que se vaya a producir: solo sirve para ejecutar un comando utilitario (aquí, eliminar los archivos compilados):

```makefile
.PHONY: clean

clean:
	rm -f *.o programa
```

`.PHONY` indica a `make` que `clean` no es un nombre de archivo: sin esta línea, si por casualidad existiera en la carpeta un archivo llamado `clean`, `make clean` podría considerarlo "actualizado" y no ejecutar nada.

> **Nota:** llamar a un objetivo como argumento (`make clean`, `make programa`) construye **ese** objetivo concreto en lugar del primero del archivo.

## Escribir la receta en la misma línea: `;`

Una receta siempre sigue a la línea `objetivo: dependencias`, sangrada con una tabulación, como se vio antes. Un `;` después de la lista de dependencias permite escribir una receta corta directamente en esa misma línea, sin pasar a la siguiente:

```makefile
clean: ; rm -f *.o
```

Estrictamente equivalente a:

```makefile
clean:
	rm -f *.o
```

> **Trampa:** confundir este `;` de Makefile con un `;` de shell habitual (que encadena dos comandos). Aquí solo separa la lista de dependencias de la receta en sí: nada que ver con encadenar comandos.

## Incluir las cabeceras de una biblioteca: `-I`

```makefile
programa: main.o
	$(CC) main.o -I includes -I libft/includes -o programa
```

`-I` añade una carpeta a la lista donde el compilador busca un archivo `#include "..."` o `#include <...>` (véase [Las cabeceras](/?c=langages&s=c&p=headers)): indispensable en cuanto un proyecto guarda sus `.h` en otro sitio distinto de la carpeta actual, o depende de una biblioteca externa.

> **Trampa:** apuntar `-I` al nivel de carpeta equivocado (ej. `-I includes` cuando los archivos están en `includes/subcarpeta`). El compilador falla entonces con un mensaje de "archivo no encontrado", aunque el archivo exista realmente en algún lugar del proyecto.

## Encontrar los flags de compilación de una biblioteca: `pkg-config`

Enlazar una biblioteca externa (ej. [GLFW](https://www.glfw.org) para abrir una ventana OpenGL) suele requerir varios `-I` y `-l` (nombre de la biblioteca para el enlazador) distintos según la máquina y su distribución. `pkg-config` evita tener que adivinarlos a mano: cada biblioteca instala un pequeño archivo `.pc` que describe sus propios flags, y `pkg-config` los lee bajo demanda.

```bash
pkg-config --cflags glfw3        # -I/usr/include            (flags de compilación)
pkg-config --cflags --libs glfw3 # añade -lglfw -lm ...       (+ flags del enlazador)
```

En un Makefile, `$(shell ...)` ejecuta un comando de shell y sustituye la llamada por su salida, lo que permite inyectar directamente el resultado de `pkg-config`:

```makefile
GLFW_FLAGS = $(shell pkg-config --cflags --libs glfw3)

programa: main.o
	$(CC) main.o $(GLFW_FLAGS) -o programa
```

> **Trampa:** el nombre pasado a `pkg-config` (aquí `glfw3`) no siempre es idéntico al nombre del paquete del sistema que lo instala (ej. `libglfw3-dev` en Debian/Ubuntu). `pkg-config --list-all` lista todos los módulos `.pc` realmente disponibles en la máquina cuando ese nombre exacto no se conoce de antemano.

## Modo silencioso: `@` y `MAKEFLAGS`

Por defecto, `make` muestra cada comando antes de ejecutarlo. Un `@` como prefijo de línea suprime esa visualización, solo para **esa línea**:

```makefile
compilar:
	@echo "Compilando..."
	@gcc main.c -o programa
```

Sin `@`, `make` mostraría primero la línea `gcc main.c -o programa` tal cual, además del mensaje `Compilando...` producido por su ejecución.

Para aplicar este comportamiento a **todo** el archivo sin anteponer cada línea individualmente, `MAKEFLAGS += -s` al principio del archivo tiene el mismo efecto, pero de forma global:

```makefile
MAKEFLAGS += -s

compilar:
	echo "Compilando..."   # ya silencioso gracias a MAKEFLAGS; el @ es redundante aquí
	gcc main.c -o programa
```

> **Nota:** los dos mecanismos se solapan sin entrar en conflicto. `MAKEFLAGS += -s` evita olvidar un `@` en una línea nueva añadida más tarde; `@` línea por línea permite en cambio mantener ciertas líneas deliberadamente visibles (un mensaje de error que se quiere ver incluso en modo silencioso, por ejemplo). Combinar ambos, como haría un proyecto cauteloso, es redundante pero inofensivo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un Makefile describe reglas (`objetivo: dependencias` + comando) que `make` ejecuta, reconstruyendo únicamente lo que realmente ha cambiado. Una receta corta también puede escribirse en la propia línea del objetivo, tras un `;`. |
| **Herramientas utilizables** | Variables (`CC`, `CFLAGS`), objetivos ficticios (`.PHONY`), `-I` para las cabeceras, `pkg-config` para los flags de una biblioteca, `@`/`MAKEFLAGS += -s` para el modo silencioso. |
| **Trampas a evitar** | Sangrar un comando con espacios en lugar de una tabulación; apuntar `-I` al nivel de carpeta equivocado; confundir el nombre `pkg-config` de una biblioteca con el nombre de su paquete del sistema. |
| **Buenas prácticas** | Declarar `.PHONY` para todo objetivo que no produzca un archivo real (`clean`, `test`...), para evitar un conflicto con un archivo del mismo nombre; pasar por `pkg-config` en lugar de adivinar `-I`/`-l` a mano para una biblioteca externa. |
