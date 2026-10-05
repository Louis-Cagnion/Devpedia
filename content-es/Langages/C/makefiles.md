---
order: 12
---

# Los Makefiles

Un **Makefile** automatiza la compilación de un proyecto en C con varios archivos: en lugar de volver a escribir manualmente cada comando [`gcc`](https://gcc.gnu.org) (véase [El proceso de compilación](/?c=langages-de-programmation&s=c&p=compilation)), se describen una vez las reglas de construcción, y la herramienta [`make`](https://www.gnu.org/software/make/manual/make.html) las ejecuta, recompilando únicamente lo que realmente ha cambiado desde la última vez.

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
| `-g` | Añade la información de depuración (necesaria para [`gdb`](https://sourceware.org/gdb/) y [Valgrind](/?c=langages&s=c&p=memoire#los-cuatro-errores-de-memoria-clasicos)) |
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
main.o: main.c
	$(CC) $(CFLAGS) -I includes -I libft/includes -c main.c -o main.o
```

`-I` añade una carpeta a la lista donde el compilador busca un archivo `#include "..."` o `#include <...>` (véase [Las cabeceras](/?c=langages&s=c&p=headers)). Sirve por tanto al compilar un `.c` (`-c`), nunca en el enlazado, que ya no lee ninguna cabecera: indispensable en cuanto un proyecto guarda sus `.h` en otro sitio distinto de la carpeta actual, o depende de una biblioteca externa.

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

## Una regla para todos los archivos: `%`, `$@`, `$<`, `$^`

Escribir una regla por cada archivo `.c` (como en [Encadenar reglas](#encadenar-reglas)) se vuelve largo enseguida. Una **regla de patrón** (*pattern rule*) las sustituye todas: el `%` representa «cualquier nombre», el mismo a ambos lados de la regla.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# la lista de fuentes, escrita una sola vez
SRCS = main.c calculos.c
# la misma lista, cada .c sustituido por .o: main.o calculos.o
OBJS = $(SRCS:%.c=%.o)

# $@ vale programa, $^ vale main.o calculos.o
programa: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

# vale para cada .o: main.o a partir de main.c, calculos.o a partir de calculos.c
%.o: %.c calculos.h
	$(CC) $(CFLAGS) -c $< -o $@
```

`$@`, `$<` y `$^` son **variables automáticas**: `make` las rellena él mismo, regla por regla, en el momento de ejecutar el comando.

| Variable | Contiene | Para `main.o` en la regla `%.o: %.c calculos.h` |
|---|---|---|
| `$@` | El objetivo que se está construyendo | `main.o` |
| `$<` | La **primera** dependencia | `main.c` |
| `$^` | **Todas** las dependencias, sin duplicados | `main.c calculos.h` |

`$(SRCS:%.c=%.o)` es una **referencia de sustitución**: copia la lista `SRCS` sustituyendo, en cada palabra, el patrón a la izquierda del `=` por el de la derecha.

```text
$ make
gcc -Wall -Wextra -O2 -c main.c -o main.o
gcc -Wall -Wextra -O2 -c calculos.c -o calculos.o
gcc -Wall -Wextra -O2 -o programa main.o calculos.o
```

> **Trampa:** `$^` en lugar de `$<` en la regla `%.o` pasa también `calculos.h` a `gcc` (`gcc -c main.c calculos.h -o main.o`), que se niega: `cannot specify '-o' with '-c', '-S' or '-E' with multiple files`. Para compilar un `.c`, siempre `$<`.

## Cambiar de opciones no recompila nada

Una variable del Makefile puede sustituirse al lanzarlo, solo para esa ejecución: `make CFLAGS="-O0 -g"` construye con esas opciones, sin modificar el archivo. Pero `make` decide qué reconstruir comparando únicamente **fechas de modificación**: las opciones de compilación no intervienen en su decisión.

```bash
make                    # compila main.o, calculos.o y programa con -O2
make CFLAGS="-O0 -g"    # make: 'programa' is up to date.  (no se recompila nada)
```

| Situación | Resultado |
|---|---|
| `make CFLAGS="-O0 -g"` justo después de `make` | Nada cambia: el programa sigue en `-O2`, sin información de depuración |
| Un solo `.c` modificado entre las dos ejecuciones | Programa **mezclado**: ese archivo compilado con las nuevas opciones, los demás con las antiguas |

| Solución | Principio | Coste |
|---|---|---|
| `make clean` antes de cada cambio de opciones | Ya no queda ningún `.o`: todo se recompila | Recompilación completa en cada cambio; un olvido pasa desapercibido |
| Una carpeta de objetos por juego de opciones | Cada juego de opciones tiene sus propios `.o`: volver a opciones ya usadas no recompila nada | Una carpeta más por juego de opciones probado |

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# obj/ seguido de un número calculado a partir del texto de CFLAGS
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculos.c
# obj/<número>/main.o obj/<número>/calculos.o
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)

# FORCE: el enlazado se rehace en cada llamada (véase más abajo)
programa: $(OBJS) FORCE
	$(CC) $(CFLAGS) -o $@ $(OBJS)

# mkdir -p crea la carpeta si falta, sin error si ya existe
$(OBJDIR)/%.o: %.c calculos.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

# elimina de una vez las carpetas de objetos de todos los juegos de opciones
clean:
	rm -rf obj programa

FORCE:
.PHONY: clean FORCE
```

El nombre de la carpeta viene de un comando [shell](/?c=langages&s=bash&p=bash), ejecutado por `$(shell ...)` (véase [`pkg-config`](#encontrar-los-flags-de-compilacion-de-una-biblioteca-pkg-config)), cuyos tres pasos están unidos por [pipes](/?c=langages&s=bash&p=redirections-et-pipes#los-pipes-encadenar-comandos):

| Paso | Función | Salida para `-Wall -Wextra -O2` |
|---|---|---|
| [`printf '%s' '...'`](https://man7.org/linux/man-pages/man1/printf.1.html) | Escribe el texto de las opciones, sin salto de línea | `-Wall -Wextra -O2` |
| [`cksum`](https://man7.org/linux/man-pages/man1/cksum.1.html) | Calcula una **suma de verificación**: un número que resume el texto (como una [función de hash](/?c=langages&s=c&p=tables-de-hachage#la-funcion-de-hash)), distinto en cuanto cambia un carácter | `364582449 17` (la suma, luego el número de bytes) |
| [`cut -d' ' -f1`](/?c=langages&s=bash&p=traitement-de-texte#cut-extraer-columnas-de-forma-sencilla) | Conserva el primer campo | `364582449` |

**Por qué el [enlazado](/?c=langages&s=c&p=compilation#4-el-enlazado-linking) se rehace siempre.** Un objetivo que depende de `FORCE` (un objetivo sin dependencias ni comandos, que no corresponde a ningún archivo) se reconstruye en cada llamada. Sin él:

| Paso | Comando | Lo que ocurre sin `FORCE` |
|---|---|---|
| 1 | `make` | `obj/364582449/*.o` compilados, `programa` enlazado en `-O2` |
| 2 | `make CFLAGS="-O0 -g"` | `obj/1873556349/*.o` compilados, `programa` enlazado en `-O0`, por tanto más reciente que `obj/364582449/*.o` |
| 3 | `make` | `programa` es más reciente que `obj/364582449/*.o`: «actualizado», se queda en `-O0` |

Con `FORCE`, el paso 3 vuelve a enlazar los objetos de `obj/364582449/`, sin recompilar nada: el enlazado solo tarda un instante.

> **Trampa:** `$^` en lugar de `$(OBJS)` en el comando de enlazado contiene también `FORCE`: el enlazador busca entonces un archivo con ese nombre y se detiene (`cannot find FORCE: No such file or directory`).

> **Trampa:** un comentario escrito al final de una línea de variable (`OBJDIR = obj/...   # objetos`) deja en el valor los espacios que lo preceden: `$(OBJDIR)/%.o` se convierte en `obj/364582449   /%.o`, es decir, dos objetivos distintos. `make` se detiene entonces con `mixed implicit and normal rules` y `No rule to make target '%.c'`, mensajes que no señalan el comentario. Escribir los comentarios de variables en su propia línea, encima.

## Las cabeceras modificadas: dependencias automáticas (`-MMD -MP`)

Las reglas anteriores citan `calculs.h` a mano. Una cabecera olvidada en la lista, o incluida por otra cabecera, es invisible para `make`: el `.o` no se recompila y el programa conserva el código antiguo. Ejemplo medido, con `#define FACTEUR 1` en `calculs.h` y una regla `%.o: %.c` sin ninguna cabecera:

```text
$ make                      # FACTEUR vale 1
$ ./programme
9
$ sed -i 's/FACTEUR 1/FACTEUR 2/' calculs.h
$ make
make: 'programme' is up to date.
$ ./programme
9                           # debería mostrar 36: no se ha recompilado nada
```

`gcc` sabe listar por sí mismo las cabeceras que lee. Con `-MMD`, escribe junto a cada `.o` un archivo `.d` (*dependencias*) durante la compilación habitual, sin las cabeceras del sistema (`<stdio.h>`...):

```text
$ cat main.d
main.o: main.c calculs.h
calculs.h:
```

La primera línea es una regla `make` completa. La segunda viene de `-MP`: una regla **vacía** por cabecera. Falta cargar estos archivos con `include`:

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2 -MMD -MP
SRCS = main.c calculs.c
OBJS = $(SRCS:%.c=%.o)

programme: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# carga los .d; el guion ignora un archivo ausente (primer build, antes de cualquier .d)
-include $(OBJS:.o=.d)
```

| Elemento | Papel | Sin él |
|---|---|---|
| `-MMD` | `gcc` escribe `main.d`: la lista de cabeceras realmente incluidas | modificar una cabecera no recompila nada |
| `-MP` | una regla vacía por cabecera | una cabecera renombrada o borrada detiene `make` (véase más abajo) |
| `-include` | carga los `.d` sin error si faltan | `make` se detiene en el primer build (`No rule to make target 'a.d'`), antes de que exista ningún `.d` |

El mismo cambio de cabecera (`FACTEUR` a 3) con estas reglas: los dos `.c` se recompilan y el programa muestra `81`. Si luego se renombra una cabecera, los antiguos `.d` aún la citan. Sin `-MP`, `make` se detiene:

```text
make: *** No rule to make target 'calculs.h', needed by 'main.o'.  Stop.
```

Con `-MP`, la regla vacía hace creer a `make` que la cabecera existe: recompila el `.c`, y es el compilador quien señala el error real o comprueba que los `#include` están al día.

**Otra dependencia oculta: el propio Makefile.** Cambiar una opción **dentro** del Makefile tampoco recompila nada, ya que `make` solo compara fechas de archivos. Medido con `CFLAGS = -DOPT=1` cambiado a `-DOPT=2`: sin `Makefile` entre las dependencias (`programme: a.c`), `make` responde «up to date» y el programa sigue mostrando `opt=1`; con `programme: a.c Makefile`, recompila y muestra `opt=2`. El archivo fuente sigue **en primer lugar**: `$<` designa la primera dependencia. Contrapartida: tocar el Makefile lo recompila todo.

## Dependencia de orden: ejecutar antes, sin forzar la reconstrucción

Una regla puede separar sus dependencias en dos grupos con una barra vertical: `objetivo: dependencias normales | dependencias de orden`. `make` construye primero las dependencias de orden (*order-only*) si faltan, pero **su fecha nunca interviene en la decisión** de reconstruir el objetivo.

**Primer caso: la carpeta de objetos.** Una carpeta es un objetivo como otro cualquiera, pero su fecha cambia cada vez que se crea un archivo en ella. Puesta entre las dependencias normales, hace que los `.o` queden «desactualizados» justo después de crearse. Medido con `obj/a.o` y `obj/b.o`, llamados tres veces seguidas:

| Llamada | Carpeta como dependencia normal | Carpeta tras la barra `\|` |
|---|---|---|
| 1 | crea `obj/`, compila `a.o` y `b.o` | crea `obj/`, compila `a.o` y `b.o` |
| 2 | recompila `a.o` | `Nothing to be done` |
| 3 | recompila `b.o` | `Nothing to be done` |

```makefile
OBJDIR = obj
OBJS = $(OBJDIR)/a.o $(OBJDIR)/b.o

all: $(OBJS)

# tras la barra: la carpeta debe existir antes de compilar, su fecha se ignora
$(OBJDIR)/%.o: %.c | $(OBJDIR)
	gcc -c $< -o $@

$(OBJDIR):
	mkdir -p $@
```

En la receta, `$^` solo contiene las dependencias normales (`a.c`): las dependencias de orden están en otra variable automática, `$|` (aquí `obj`). Un `$^` pasado al compilador nunca arrastra por tanto la carpeta (a diferencia de `FORCE`, visto más arriba, que es una dependencia normal).

**Segundo caso: un objetivo ficticio (`.PHONY`) que ejecutar antes, sin forzar la reconstrucción.** Un objetivo `.PHONY` colocado entre las dependencias **normales** se considera siempre por rehacer, y por tanto también el objetivo que depende de él. Medido con un objetivo `verif` que muestra un mensaje y un `programme` enlazado desde `a.o` y `b.o`:

| Llamada | `programme: a.o b.o verif` | `programme: a.o b.o \| verif` |
|---|---|---|
| 1 | compila, `verif`, enlaza | compila, `verif`, enlaza |
| 2 | `verif`, **enlaza de nuevo** | solo `verif` |

Tras la barra, `verif` se ejecuta en cada llamada (útil para un control previo), sin forzar el enlazado.

## Comprobar la presencia de una herramienta o de una biblioteca

Un Makefile que supone una herramienta instalada falla más adelante, con un mensaje que no nombra la causa. Se comprueba primero, y se detiene con un mensaje preciso.

**Una herramienta: `command -v`.** El comando `command -v nombre` muestra la ruta de la herramienta si existe y no muestra nada en caso contrario (código de salida distinto de 0). Está previsto por la norma POSIX, a diferencia de `which`, un programa aparte. `$(error texto)` detiene `make` con ese texto:

```makefile
# $(shell ...) devuelve la salida del comando: vacía si la herramienta no existe
ifeq ($(shell command -v pkg-config),)
$(error pkg-config no encontrado: instalelo antes de lanzar make)
endif
```

```text
Makefile:2: *** pkg-config no encontrado: instalelo antes de lanzar make.  Stop.
```

**Una biblioteca: una prueba de compilación.** `pkg-config` (véase más arriba) puede faltar, o no conocer una biblioteca instalada a mano, y su `.pc` no prueba que la compilación vaya a funcionar. La prueba más fiable hace lo que hará el programa: compilar un programa mínimo que incluye la cabecera y enlaza la biblioteca.

```bash
printf '#include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | gcc -x c - -lm -o /dev/null
```

| Pieza | Papel |
|---|---|
| `printf '...'` | escribe un pequeño programa C (`\n` = salto de línea) |
| `\|` | lo envía a `gcc` por su entrada estándar |
| `-x c -` | `-x c` dice que el texto es C (la entrada estándar no tiene extensión `.c`); `-` significa «leer la entrada estándar» |
| `-lm` | enlaza la biblioteca que se prueba |
| `-o /dev/null` | descarta el ejecutable producido: solo cuenta el código de salida (`0` = cabecera encontrada **y** biblioteca enlazada) |

**La trampa del `#` en un Makefile.** En una definición de variable o en una línea de dependencias, `#` empieza un comentario: la línea `INCL := printf '#include <math.h>\n'` se corta en `#` y la variable solo vale `printf '` (medido). `\#` da un `#` literal en una definición ordinaria. Pero **dentro de `$(shell ...)`, `make` no quita la barra invertida**: el shell recibe `\#include`, y `gcc` responde `stray '\' in program` (medido). Dos remedios: una variable `HASH := \#` insertada con `$(HASH)`, o el código octal `\043` de `printf`.

```makefile
CC = gcc
# una variable que contiene solo el carácter #
HASH := \#
TEST_MATH = printf '$(HASH)include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | $(CC) -x c - -lm -o /dev/null 2>/dev/null && echo si
# "si" si la prueba tiene éxito, vacío si no
HAVE_MATH := $(shell $(TEST_MATH))

ifeq ($(HAVE_MATH),)
$(error prueba de compilacion de math.h y -lm imposible: cabecera o biblioteca ausente)
endif
```

Resultados medidos con este esquema en cuatro pruebas:

| Prueba | Valor obtenido |
|---|---|
| `#include <math.h>` y `-lm` | `si` |
| `#include <inexistant.h>` | vacío |
| `-lbibliotheque_absente` | vacío |
| `\043include <math.h>` (octal, sin `HASH`) | `si` |

> **Trampa:** `2>/dev/null` oculta los mensajes del compilador, y por tanto la causa real del fallo. Para diagnosticar, volver a lanzar a mano el comando de la prueba, sin esta redirección.

## Encadenar los tres pasos de la PGO en un objetivo

La [optimización guiada por perfil](/?c=langages&s=c&p=compilation#la-optimizacion-guiada-por-perfil-pgo) (PGO) compila el programa tres veces seguidas: versión instrumentada, ejecución de entrenamiento, versión optimizada. Un objetivo del Makefile puede encadenar los tres, volviendo a lanzar `make` sobre un objetivo de compilación ordinario (`enlazar`) con otras opciones.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
NOMBRE = programa
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculos.c
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)
# carpeta de los perfiles (archivos .gcda)
PGO_DIR = pgo
# entradas de entrenamiento, distintas de las de las mediciones de velocidad
PGO_ENTRADAS = prueba1.txt prueba2.txt

# objetivo por defecto: los tres pasos, rehechos solo si cambia una fuente o el Makefile
$(NOMBRE): $(SRCS) calculos.h Makefile
	rm -rf $(PGO_DIR) obj/pgo
	$(MAKE) enlazar NOMBRE=instrumentado OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-generate=$(PGO_DIR)"
	for f in $(PGO_ENTRADAS); do ./instrumentado $$f > /dev/null || exit 1; done
	rm -f instrumentado obj/pgo/*.o
	$(MAKE) enlazar NOMBRE=$(NOMBRE) OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-use=$(PGO_DIR)"

# compilación directa, sin PGO (pruebas, depuración), siempre enlazada como con FORCE
enlazar: $(OBJS)
	$(CC) $(CFLAGS) -o $(NOMBRE) $(OBJS)

$(OBJDIR)/%.o: %.c calculos.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf obj $(PGO_DIR) instrumentado $(NOMBRE)

.PHONY: enlazar clean
```

| Detalle | Por qué |
|---|---|
| [`$(MAKE)`](https://www.gnu.org/software/make/manual/html_node/MAKE-Variable.html) en lugar de `make` | Vuelve a lanzar exactamente el mismo programa `make`, señalándolo como una llamada recursiva: sus opciones (`-j`, `-n`...) se transmiten correctamente al sub-`make` |
| `NOMBRE=... OBJDIR=... CFLAGS=...` después de `enlazar` | Sustituyen, solo para esa llamada, los valores escritos en el Makefile (sección anterior) |
| Mismo `OBJDIR=obj/pgo` en los pasos 1 y 3 | El perfil de cada `.o` lleva el nombre de ese `.o`: con otra carpeta en el paso 3, el perfil no se encuentra, y `gcc` solo lo indica con una [advertencia](/?c=langages&s=c&p=compilation#la-optimizacion-guiada-por-perfil-pgo) |
| `rm -f ... obj/pgo/*.o` antes del paso 3 | Los `.o` instrumentados son más recientes que las fuentes: sin este `rm`, `make` no recompila nada, enlaza los objetos del paso 1 sin la biblioteca que registra los recuentos, y falla (`undefined reference to '__gcov_merge_add'`) |
| `\` al final de una línea | Cada línea de comando se ejecuta en su propio shell; `\` une dos líneas en un solo comando |
| `$$f` | En un comando, `$` pertenece a `make`; `$$` transmite un `$` al shell, para la variable del [bucle `for`](/?c=langages&s=bash&p=boucles#el-bucle-for-recorrido-de-lista) |
| `\|\| exit 1` | Lo detiene todo en el primer entrenamiento que falle: sin él, el bucle solo devuelve el [código de salida](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-salida-exit) de su última vuelta, y un fallo anterior pasaría desapercibido |
| Dependencias `$(SRCS) calculos.h Makefile` | Los tres pasos solo se rehacen si cambia el código o el Makefile |

## Saber si hace falta reconstruir: `make -q`

Con `-q` (*question*), `make` no ejecuta ningún comando: solo responde con su [código de salida](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-salida-exit).

| Opción | ¿Ejecuta los comandos? | Lo que aporta |
|---|---|---|
| `make -n` | No | Muestra los comandos que se ejecutarían |
| `make -q` | No | Código de salida `0` si todo está actualizado, `1` si hace falta reconstruir, `2` en caso de error |

Útil en un script, para avisar antes de una reconstrucción larga (los tres pasos de la PGO tardan unos 24 segundos en el solucionador SAT citado en [la compilación](/?c=langages&s=c&p=compilation#la-optimizacion-guiada-por-perfil-pgo)):

```bash
if ! make -q; then                         # 1 o 2: hay algo que hacer
    echo "Reconstrucción (unos 24 s)..."   # avisa antes de la espera
fi
make -s || exit 1                          # construye si hace falta, en silencio
```

> **Trampa:** un objetivo `.PHONY`, o que depende de `FORCE`, nunca está «actualizado»: `make -q enlazar` responde siempre `1`. Hacer la pregunta sobre un objetivo que sea un archivo real, construido solo cuando cambian sus dependencias (aquí `programa`, el objetivo PGO).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un Makefile describe reglas (`objetivo: dependencias` + comando) que `make` ejecuta, reconstruyendo únicamente lo que realmente ha cambiado. Una receta corta también puede escribirse en la propia línea del objetivo, tras un `;`. `make` solo compara fechas: cambiar las opciones de compilación no recompila nada. |
| **Herramientas utilizables** | Variables (`CC`, `CFLAGS`), objetivos ficticios (`.PHONY`), `-I` para las cabeceras, `pkg-config` para los flags de una biblioteca, `@`/`MAKEFLAGS += -s` para el modo silencioso.; reglas de patrón (`%`, `$@`, `$<`, `$^`); `make VARIABLE=valor`; `$(MAKE)` para encadenar pasos (PGO); `make -n` y `make -q`; `-MMD -MP` con `-include` para las cabeceras; dependencia de orden (`objetivo: normales \| orden`); `command -v`, `$(error ...)` y una prueba de compilación (`gcc -x c -`) para comprobar una herramienta o una biblioteca. |
| **Trampas a evitar** | Sangrar un comando con espacios en lugar de una tabulación; apuntar `-I` al nivel de carpeta equivocado; confundir el nombre `pkg-config` de una biblioteca con el nombre de su paquete del sistema.; `$^` para compilar un `.c`; un comentario al final de una línea de variable; creer que se ha aplicado un nuevo `CFLAGS`; listar las cabeceras a mano (un olvido deja un programa desactualizado); poner una carpeta o un objetivo `.PHONY` entre las dependencias normales (reconstrucción en cada llamada); escribir `\#` dentro de un `$(shell ...)`; ocultar los errores de una prueba de compilación sin poder releerlos. |
| **Buenas prácticas** | Declarar `.PHONY` para todo objetivo que no produzca un archivo real (`clean`, `test`...), para evitar un conflicto con un archivo del mismo nombre; pasar por `pkg-config` en lugar de adivinar `-I`/`-l` a mano para una biblioteca externa.; una carpeta de objetos por juego de opciones, con un enlazado que siempre se rehace; `\|\| exit 1` en un bucle de comando. Dejar que `gcc` produzca las dependencias de cabeceras (`-MMD -MP`) y poner el `Makefile` entre las dependencias de un objeto; crear una carpeta de objetos mediante una dependencia de orden; probar una herramienta antes de usarla y detenerse con un mensaje que la nombre. |
