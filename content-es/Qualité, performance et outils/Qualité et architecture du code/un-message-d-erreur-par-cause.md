---
order: 13
---

# Un mensaje de error para cada causa

Un mensaje de error se lee en un momento preciso: cuando un programa acaba de fallar y su lector no sabe por qué. Debe entonces decirle **qué corregir**, sin que tenga que releer el código. Este capítulo muestra, con un programa que lee un número de puerto en un archivo, tres maneras de escribir esos mensajes (un texto común a todas las causas, un texto «corregido» suponiendo la causa, un texto por causa) y lo que cada una cuesta a quien recibe el error. Muestra también que un camino de error que olvida cerrar un archivo acaba produciendo... un error con un mensaje engañoso.

Las reglas que se mantienen: **un mensaje por causa** (nunca el mismo texto para dos causas, nunca un mensaje vacío ni una salida con error sin mensaje); **nombra el elemento defectuoso** (archivo, línea, campo, valor recibido); da la **causa real** leída en el sistema (`strerror(errno)`), nunca una causa supuesta; no contiene saltos de línea.

## El ejemplo: leer `port=NNNN` en un archivo

El programa lee la primera línea de un archivo de configuración, que debe valer `port=` seguido de un número de 1 a 65535. Existe en tres versiones, elegidas con un argumento (`./cfg 1 archivo`, `./cfg 2 archivo`, `./cfg 3 archivo`). Los errores van a [`stderr`](/?c=langages&s=c&p=appels-systeme-et-descripteurs), el flujo de error estándar; el **código de salida** (0 si todo va bien, 1 en caso de fallo) es el descrito en [exit y los códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour).

La **versión 1** escribe el mismo mensaje sea cual sea la causa, convierte con `atoi` (que devuelve 0 para cualquier texto y se detiene sin protestar en la primera letra) y olvida cerrar el archivo en dos caminos:

```c
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

/* Versión 1: un mensaje común a todas las causas, un archivo nunca cerrado en un camino. */
static int	load_v1(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f || !fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	*port = atoi(line + 5);                         /* 0 para cualquier cosa, 80 para «80x» */
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);                                /* fclose olvidado en este camino */
	}
	fclose(f);
	return (0);
}
```

La **versión 2** es la «corrección» de alguien que solo probó el caso de un archivo ausente: todo fallo de apertura pasa a ser «file not found»:

```c
/* Versión 2: «corregida» suponiendo la causa: todo fallo de apertura pasa a ser «not found». */
static int	load_v2(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f)
	{
		fprintf(stderr, "error: %s: file not found\n", path);
		return (-1);
	}
	if (!fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		fclose(f);
		return (-1);
	}
	*port = atoi(line + 5);
	fclose(f);
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	return (0);
}
```

La **versión 3** da un mensaje por causa, con el archivo, la línea y el valor recibido, comprueba que la ruta es un archivo ordinario con [`stat`](https://man7.org/linux/man-pages/man2/stat.2.html), convierte con [`strtol` y sus comprobaciones](/?c=langages&s=c&p=convertir-un-texte-en-nombre), y cierra el archivo en **un solo lugar**:

```c
static int	report(const char *path, int line_no, const char *fmt, ...)
{
	va_list	args;

	if (line_no)
		fprintf(stderr, "%s:%d: ", path, line_no);
	else
		fprintf(stderr, "%s: ", path);
	va_start(args, fmt);
	vfprintf(stderr, fmt, args);
	va_end(args);
	fputc('\n', stderr);
	return (-1);
}

/* Lee «port=NNNN»: un mensaje por causa, con el archivo, la línea y el valor recibido. */
static int	parse_port(const char *path, const char *line, int *port)
{
	char	*end;
	long	value;

	if (strncmp(line, "port=", 5) != 0)
		return (report(path, 1, "expected \"port=\", got \"%.20s\"", line));
	errno = 0;
	value = strtol(line + 5, &end, 10);
	if (end == line + 5 || *end)
		return (report(path, 1, "port \"%.20s\" is not a number", line + 5));
	if (errno == ERANGE || value < 1 || value > 65535)
		return (report(path, 1, "port %ld is out of range (1 to 65535)", value));
	*port = (int)value;
	return (0);
}

/* Versión 3: cada causa tiene su mensaje; el archivo se cierra en un solo lugar. */
static int	load_v3(const char *path, int *port)
{
	struct stat	st;
	FILE		*f;
	char		line[64];
	int			rc;

	if (stat(path, &st) != 0)
		return (report(path, 0, "%s", strerror(errno)));
	if (!S_ISREG(st.st_mode))
		return (report(path, 0, "not a regular file"));
	f = fopen(path, "r");
	if (!f)
		return (report(path, 0, "%s", strerror(errno)));
	if (!fgets(line, sizeof line, f))
		rc = report(path, 0, ferror(f) ? "%s" : "empty file", strerror(errno));
	else
	{
		line[strcspn(line, "\n")] = '\0';           /* el mensaje no debe contener saltos de línea */
		rc = parse_port(path, line, port);
	}
	fclose(f);
	return (rc);
}
```

```c
int	main(int argc, char **argv)
{
	int	failed = 0;

	if (argc < 3)
		return (fprintf(stderr, "usage: %s 1|2|3 file...\n", argv[0]), 2);
	for (int i = 2; i < argc; i++)
	{
		int	port = 0, rc;

		if (strcmp(argv[1], "1") == 0)
			rc = load_v1(argv[i], &port);
		else if (strcmp(argv[1], "2") == 0)
			rc = load_v2(argv[i], &port);
		else
			rc = load_v3(argv[i], &port);
		if (rc == 0)
			printf("port=%d\n", port);
		failed |= rc != 0;
	}
	return (failed);
}
```

Los archivos de prueba, uno por causa (el archivo `absent.cfg` no se crea: no existe), y la compilación:

```bash
printf 'port=8080\n' > ok.cfg                 # válido
: > empty.cfg                                 # vacío
printf 'listen=80\n' > noprefix.cfg           # sin «port=»
printf 'port=abc\n' > abc.cfg                 # no es un número
printf 'port=\n' > novalue.cfg                # valor ausente
printf 'port=99999\n' > big.cfg               # fuera de 1 a 65535
printf 'port=80x\n' > trail.cfg               # número seguido de un carácter
mkdir dir.cfg                                 # un directorio
printf 'port=8080\n' > noperm.cfg; chmod 000 noperm.cfg   # archivo sin permiso de lectura
gcc -Wall -Wextra -g -fsanitize=address,undefined cfg.c -o cfg
```

## Lo que recibe quien lee el error

Mensaje mostrado por cada versión (`./cfg 1 archivo`, `./cfg 2 archivo`, `./cfg 3 archivo`), medido; el código de salida vale 1 en cada fallo:

| Archivo | Causa real | Versión 1 | Versión 2 | Versión 3 |
|---|---|---|---|---|
| `absent.cfg` | el archivo no existe | `error: cannot load config` | `error: absent.cfg: file not found` | `absent.cfg: No such file or directory` |
| `noperm.cfg` | permiso de lectura denegado | `error: cannot load config` | `error: noperm.cfg: file not found` (**falso**) | `noperm.cfg: Permission denied` |
| `dir.cfg` | es un directorio | `error: cannot load config` | `error: cannot load config` | `dir.cfg: not a regular file` |
| `empty.cfg` | archivo vacío | `error: cannot load config` | `error: cannot load config` | `empty.cfg: empty file` |
| `noprefix.cfg` | sin `port=` | `error: cannot load config` | `error: cannot load config` | `noprefix.cfg:1: expected "port=", got "listen=80"` |
| `abc.cfg` | no es un número | `error: cannot load config` | `error: cannot load config` | `abc.cfg:1: port "abc" is not a number` |
| `novalue.cfg` | valor ausente | `error: cannot load config` | `error: cannot load config` | `novalue.cfg:1: port "" is not a number` |
| `big.cfg` | fuera de 1 a 65535 | `error: cannot load config` | `error: cannot load config` | `big.cfg:1: port 99999 is out of range (1 to 65535)` |
| `trail.cfg` | `80x`: no es un número | **aceptado: `port=80`**, código 0 | **aceptado: `port=80`**, código 0 | `trail.cfg:1: port "80x" is not a number` |
| `ok.cfg` | válido | `port=8080` | `port=8080` | `port=8080` |

En esta tabla se leen tres defectos.

- **Un solo texto para ocho causas** (versión 1): el usuario no sabe si debe crear el archivo, cambiar sus permisos, corregir el valor o ponerlo en otro intervalo.
- **Un valor aceptado por error**: `atoi("80x")` vale 80, así que `80x` pasa en silencio por el puerto 80 (la conversión estricta con `strtol`, que comprueba dónde terminó la lectura, lo rechaza); `atoi("abc")` vale 0, y ese 0 cae en la prueba de rango en lugar de rechazarse como «no es un número».
- **Una causa supuesta** (versión 2): `noperm.cfg` existe, pero el mensaje afirma «file not found». Este mensaje es **peor que el vago**: manda a buscar un archivo que está ahí, en lugar de mirar sus permisos. La versión 3 lee la causa real en `errno` con `strerror`.

## El camino de error que olvida cerrar

En la versión 1, dos caminos de error olvidan `fclose`: el de `fgets` que falla (archivo vacío) y el del puerto fuera de rango. Cada llamada que falla deja abierto un **descriptor de archivo** (el número que el sistema da a un archivo abierto, véanse [las llamadas al sistema y los descriptores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)), y un proceso solo dispone de un número limitado. Aquí, 60 lecturas del archivo `big.cfg` (rechazado) y luego una del archivo válido `ok.cfg`, con a lo sumo 50 descriptores (`ulimit -n 50`):

```bash
for v in 1 2 3; do
  echo "--- versión $v"
  ( ulimit -n 50; ASAN_OPTIONS=detect_leaks=0 ./cfg $v $(yes big.cfg | head -60) ok.cfg 2>&1 | sort | uniq -c | sort -rn )
done
```

```
--- versión 1
     61 error: cannot load config
--- versión 2
     60 error: cannot load config
      1 port=8080
--- versión 3
     60 big.cfg:1: port 99999 is out of range (1 to 65535)
      1 port=8080
```

Con la versión 1, las 61 lecturas fallan con **el mismo mensaje**, incluida la del archivo válido: los descriptores están agotados, `fopen` falla, y el programa responde «cannot load config». Nada en el mensaje permite relacionar este fallo con una fuga. La versión 2 cierra el archivo antes de la prueba de rango y la versión 3 lo cierra en un solo lugar: el archivo válido se lee.

Con un archivo válido, pero sin ningún descriptor disponible (`ulimit -n 3`: solo están abiertas la entrada, la salida y el error estándar), la versión 3 da **la causa real** donde la versión 1 mantiene su texto común. El ejecutable se enlaza estáticamente (`-static`) porque el cargador de bibliotecas de un ejecutable normal necesita él mismo un descriptor:

```bash
gcc -static -Wall -Wextra -g cfg.c -o cfg_static
sh -c 'ulimit -n 3; exec ./cfg_static 1 ok.cfg'      # versión 1
sh -c 'ulimit -n 3; exec ./cfg_static 3 ok.cfg'      # versión 3
```

```
error: cannot load config
ok.cfg: Too many open files
```

> **Trampa:** una fuga de descriptores no es una fuga de memoria: LeakSanitizer no la ve (medido: ningún informe para la versión 1, la biblioteca C guarda el rastro de los archivos abiertos). Se descubre bajando el límite de descriptores (`ulimit -n`) durante una prueba.

## Escribir un mensaje por causa

| Regla | Por qué |
|---|---|
| Un mensaje **por causa**, nunca el mismo texto para dos causas | El lector sabe qué corregir sin releer el código |
| Nunca un mensaje vacío, ni un `exit(1)` sin mensaje | Un fallo sin texto no se puede diagnosticar |
| Nombrar el **elemento defectuoso**: archivo, línea, campo, **valor recibido** (`port "abc" is not a number`) | El lector encuentra el lugar que corregir |
| Dar la **causa real** leída en el sistema (`strerror(errno)`), nunca una causa supuesta | Un mensaje falso manda a buscar en el sitio equivocado |
| Ni salto de línea ni carácter de control en el mensaje | Un mensaje partido en dos líneas se lee mal y se filtra mal; aquí, la línea leída conservaba su `\n` antes de limpiarse |
| Con varias entradas, decir **cuál** es la culpable | `big.cfg:1:` en lugar de «invalid port» |
| Cerrar y liberar **en un solo lugar**, en todos los caminos | Un camino de error deja de tener fugas cuando pasa por la misma limpieza que el camino normal (véase [Un contexto de trabajo para dividir una función grande](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=contexte-de-travail-pour-decouper-une-fonction)) |
| Escribir en `stderr`, no en `stdout` | El resultado del programa sigue siendo aprovechable, los errores van a otro lado |

## No anunciar nunca «corregido» sin una prueba real

La versión 2 da la impresión de una corrección: con `absent.cfg`, el mensaje ha cambiado y es correcto. Sin embargo, se validó con **un solo caso**, el único que su autor imaginaba, y se equivoca con `noperm.cfg`. Lo que permite decir que un mensaje está corregido:

| Etapa | Ejemplo aquí |
|---|---|
| Producir **cada** causa de verdad (no solo la más frecuente) | Los nueve archivos de prueba, entre ellos un directorio y un archivo sin permiso |
| Ejecutar y **leer** el mensaje de cada caso | La tabla de arriba, celda por celda |
| Comprobar que el caso válido sigue pasando | `ok.cfg` da `port=8080` en las tres versiones |
| Empujar hasta los límites del sistema | `ulimit -n 50` reveló la fuga de descriptores |
| Comparar con el comportamiento anterior con las mismas entradas | La tabla coloca las tres versiones una al lado de otra |

> **Trampa:** deducir la causa de un fallo solo del lugar donde ocurre («`fopen` ha fallado, luego el archivo no existe»). `fopen` falla también por un permiso denegado, un directorio o demasiados archivos abiertos: hay que leer `errno`.
>
> **Trampa:** comprobar una corrección con el caso que motivó el cambio y solo con él. Hay que repetir **todas** las causas, y el caso válido.
>
> **Buena práctica:** para cada causa de fallo, un archivo o entrada de prueba que la produzca, repetidos tras cada modificación de los mensajes.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un mensaje de error debe decir qué corregir: un mensaje por causa, que nombre el archivo, la línea y el valor recibido, con la causa real leída en `errno` (`strerror`). Un texto común a todas las causas no se puede diagnosticar; un texto que supone la causa («file not found» para un permiso denegado) es peor. En el ejemplo, la versión 1 aceptaba `80x` como el puerto 80 y agotaba sus descriptores en dos caminos de error, hasta rechazar un archivo válido con el mismo mensaje. |
| **Herramientas utilizables** | `strerror(errno)`; `stat` y `S_ISREG` para rechazar un directorio; `strtol` con comprobación del final de lectura, de `errno` y del rango; una función `report` que antepone archivo y línea; `ulimit -n` para comprobar que no se fuga ningún descriptor; `ASAN_OPTIONS=exitcode=...` para distinguir el fallo de ASan del del programa. |
| **Trampas a evitar** | El mismo mensaje para varias causas; un mensaje vacío o `exit(1)` sin texto; una causa supuesta; `atoi` (acepta `80x`, devuelve 0 para `abc`); un salto de línea en el mensaje; olvidar cerrar un archivo en un camino de error; creer que una corrección es buena tras una sola prueba. |
| **Buenas prácticas** | Un mensaje por causa con archivo, línea y valor recibido; la causa real leída en el sistema; una limpieza única para todos los caminos; una entrada de prueba por causa, repetida tras cada modificación; el caso válido y los límites del sistema (`ulimit -n`) probados antes de decir «corregido». |
