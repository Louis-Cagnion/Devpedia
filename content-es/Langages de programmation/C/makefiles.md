---
order: 8
---

# Los Makefiles

Un **Makefile** automatiza la compilación de un proyecto en C compuesto por varios archivos: en lugar de tener que volver a escribir manualmente cada comando «`gcc`» (véase el capítulo sobre la compilación), se definen una sola vez las reglas de construcción y la herramienta `make` las ejecuta, recompilando únicamente lo que realmente ha cambiado desde la última vez.

## Anatomía de una regla

```makefile
objetivo: dependances
	commande
```

```makefile
programa: main.o calculs.o
	gcc main.o calculs.o -o programa
```

«Para compilar `programa`, necesito `main.o` y `calculs.o`; si alguno de los dos es más reciente que `programa` (o si `programa` aún no existe), ejecuta el comando». La línea de comandos **debe** estar sangrada con una tabulación, nunca con espacios —uno de los errores más frecuentes con los Makefiles—.

## Encadenar reglas

```makefile
programa: main.o calculs.o
	gcc main.o calculs.o -o programa

main.o: main.c calculs.h
	gcc -c main.c -o main.o

calculs.o: calculs.c calculs.h
	gcc -c calculs.c -o calculs.o
```

Con solo escribir «`make`», la herramienta genera la **primera regla del archivo** (`programa`) y recorre recursivamente sus dependencias: para obtener `main.o`, consulta la regla `main.o: ...`, etc. Si `calculs.c` no ha cambiado desde la última compilación, `make` no vuelve a compilar `calculs.o`; solo se recompila la parte modificada del proyecto.

## Variables

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programa: main.o calculs.o
	$(CC) main.o calculs.o -o programa

main.o: main.c calculs.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` y `$(CFLAGS)` son variables de Makefile: cambiar el compilador o las opciones de advertencia solo requiere, por tanto, una única modificación, al principio del archivo.

| Opción`gcc`e actual | Función |
|---|---|
| `-Wall -Wextra` | Activa la mayoría de las advertencias útiles del compilador |
| `-g` | Añade la información de depuración (necesaria para `gdb` /Valgrind) |
| `-o número` | Indica el nombre del archivo de salida |

## 

Un destino como `clean` no corresponde a ningún archivo real que se vaya a generar; solo sirve para ejecutar un comando de utilidad (en este caso, eliminar los archivos compilados):

```makefile
.PHONY: clean

clean:
	rm -f *.o programa
```

`.PHONY` Indica a `make` que `clean` no es un nombre de archivo: sin esta línea, si por casualidad existiera en la carpeta un archivo llamado `clean`, `make clean` podría considerarlo «actualizado» y no ejecutar nada.

> **Nota:** al llamar a un objetivo como argumento (`make clean`, `make programa`), se crea **ese** objetivo concreto en lugar del primero del archivo.
