---
order: 9
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

## Objetivos ficticios (`.PHONY`)

Un objetivo como `clean` no corresponde a ningún archivo real que se vaya a producir: solo sirve para ejecutar un comando utilitario (aquí, eliminar los archivos compilados):

```makefile
.PHONY: clean

clean:
	rm -f *.o programa
```

`.PHONY` indica a `make` que `clean` no es un nombre de archivo: sin esta línea, si por casualidad existiera en la carpeta un archivo llamado `clean`, `make clean` podría considerarlo "actualizado" y no ejecutar nada.

> **Nota:** llamar a un objetivo como argumento (`make clean`, `make programa`) construye **ese** objetivo concreto en lugar del primero del archivo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un Makefile describe reglas (`objetivo: dependencias` + comando) que `make` ejecuta, reconstruyendo únicamente lo que realmente ha cambiado. |
| **Herramientas utilizables** | Variables (`CC`, `CFLAGS`), objetivos ficticios (`.PHONY`). |
| **Trampas a evitar** | Sangrar un comando con espacios en lugar de una tabulación: error muy frecuente que rompe la regla. |
| **Buenas prácticas** | Declarar `.PHONY` para todo objetivo que no produzca un archivo real (`clean`, `test`...), para evitar un conflicto con un archivo del mismo nombre. |
