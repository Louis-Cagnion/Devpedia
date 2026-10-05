---
order: 11
---

# Sanitizers y pruebas de asignación

Un error de memoria en C casi nunca hace fallar el programa en el lugar del fallo: corrompe una celda vecina, y el daño solo aparece más tarde, o nunca. Este capítulo presenta las herramientas que hacen visibles estos errores (los **sanitizers** y [**valgrind**](https://valgrind.org)), la técnica que **hace fallar `malloc` a propósito** para probar caminos que nunca se recorren, y después las precauciones para que **la propia herramienta de prueba** no se equivoque: una prueba que acusa a código correcto (un **falso positivo**) hace perder tanto tiempo como un error.

Los errores de memoria en sí (desbordamiento, uso tras `free`, fuga) se describen en [los cuatro errores de memoria clásicos](/?c=langages&s=c&p=memoire#los-cuatro-errores-de-memoria-clasicos); el capítulo [Las herramientas de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing) muestra su uso en seguridad.

## Los sanitizers: qué comprueban

Un **sanitizer** (*desinfectante*) es una opción de compilación que añade al programa comprobaciones que se ejecutan mientras corre, y que lo detiene con un informe preciso en cuanto se detecta un error. Tres son útiles a diario con [`gcc` y `clang`](/?c=langages&s=c&p=compilation):

| Sanitizer | Opción | Qué detecta |
|---|---|---|
| **ASan** ([AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)) | `-fsanitize=address` | Lectura o escritura fuera de un bloque asignado, uso de un bloque tras `free` |
| **LSan** ([LeakSanitizer](https://clang.llvm.org/docs/LeakSanitizer.html)) | incluido en ASan en Linux | Fuga: bloque nunca liberado al final del programa |
| **UBSan** ([UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)) | `-fsanitize=undefined` | Comportamiento indefinido: una operación que el lenguaje no define, como un desbordamiento de entero con signo (un `int` que supera su valor máximo, 2 147 483 647) |

Un programa de demostración con cuatro defectos, elegidos mediante un argumento (`./bugs 1` a `./bugs 4`):

```c
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

int main(int argc, char **argv)
{
	int mode = argc > 1 ? atoi(argv[1]) : 0;      /* número del defecto que se provoca */
	int *tab = malloc(4 * sizeof *tab);           /* bloque de 4 enteros: 16 bytes */

	if (!tab)
		return (1);
	if (mode == 1)
		tab[4] = 7;                       /* escribe una celda después del final */
	if (mode == 2)
	{
		free(tab);
		printf("%d\n", tab[0]);           /* lee tras free */
		return (0);
	}
	if (mode == 3)
		return (0);                       /* olvida free(tab) */
	if (mode == 4)
	{
		int big = INT_MAX;

		printf("%d\n", big + argc);       /* desbordamiento de entero con signo */
	}
	free(tab);
	return (0);
}
```

```bash
# -g: números de línea en el informe; -fno-omit-frame-pointer: pila de llamadas legible
gcc -g -O0 -fno-omit-frame-pointer -fsanitize=address,undefined bugs.c -o bugs_san
gcc -g -O0 bugs.c -o bugs_plain               # mismo programa, sin sanitizer
```

Medido con `gcc` 12.4 (Ubuntu 24.04):

| Defecto | Programa normal | Programa con sanitizers |
|---|---|---|
| `./bugs 1`: escritura tras el final | termina sin decir nada (código 0) | `ERROR: AddressSanitizer: heap-buffer-overflow`, línea 13, código 1 |
| `./bugs 2`: lectura tras `free` | muestra un valor al azar (`256822755`) | `ERROR: AddressSanitizer: heap-use-after-free`, línea 17, código 1 |
| `./bugs 3`: fuga | termina sin decir nada (código 0) | `ERROR: LeakSanitizer: detected memory leaks`, `16 byte(s) leaked in 1 allocation(s)`, código 1 |
| `./bugs 4`: desbordamiento de entero | muestra `-2147483647` | `runtime error: signed integer overflow: 2147483647 + 2 cannot be represented in type 'int'` |

El compilador también ve los casos evidentes: con `-Wall -Wextra`, `gcc` 12.4 avisa ya al compilar de que `tab` se usa tras `free` (`-Wuse-after-free`, línea 17). ASan cubre lo que el análisis del compilador no puede seguir, por ejemplo un puntero liberado en otra función.

El principio del informe de ASan para `./bugs 1` (abreviado) nombra el fallo, el lugar de la escritura y después el lugar de la asignación:

```
==10298==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 ...
WRITE of size 4 at 0x502000000020 thread T0
    #0 0x586fed0cc470 in main bugs.c:13
0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)
allocated by thread T0 here:
    #0 0x718c5acfd9c7 in malloc ...
    #1 0x586fed0cc3ca in main bugs.c:8
```

Cada línea `#0`, `#1`... es un nivel de la **pila de llamadas** (la lista de funciones en ejecución, de la más reciente a la más antigua). El informe dice aquí: «4 bytes escritos justo después de un bloque de 16 bytes, asignado en la línea 8».

**El código de salida** (el valor que el programa devuelve a quien lo lanzó, 0 para «todo va bien»: véase [exit y los códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)) no es el mismo para todos: ASan detiene el programa con el código 1, pero UBSan **muestra su mensaje y deja que el programa continúe**, con el código 0. Medido: `UBSAN_OPTIONS=halt_on_error=1` da el código 1 para `./bugs 4`.

> **Trampa:** una prueba automática que solo mira el código de salida deja pasar todos los errores de UBSan. O bien se activa `halt_on_error=1`, o bien se busca `runtime error` en la salida de error (`stderr`, véanse [las llamadas al sistema y los descriptores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)).
>
> **Trampa (la salida del programa desaparece):** cuando LeakSanitizer constata una fuga, termina el proceso sin vaciar el [búfer](/?c=langages&s=bash&p=redirections-et-pipes) de `stdout`. Medido: un programa que escribe 4 líneas con `printf` y luego tiene una fuga produce **0 bytes** en un archivo (`./programa > salida.txt`), mientras que las 4 líneas aparecen en un terminal. Una prueba que compara la salida con un resultado esperado ve entonces una salida vacía y acusa al culpable equivocado: leer primero el informe de LeakSanitizer en `stderr`.

## Lo que cuesta y lo que no ve

**valgrind** es la otra gran familia: ejecuta el programa en una máquina virtual que vigila cada acceso a memoria, **sin recompilar** (`valgrind --leak-check=full ./bugs_plain 1`). En los tres primeros defectos da el mismo veredicto que ASan (escritura inválida línea 13, lectura inválida línea 17, `16 bytes in 1 blocks are definitely lost`).

Un programa de prueba que rellena un arreglo de 32 MiB y luego lo recorre 100 veces, medido en un AMD Ryzen 7 6800H, tres mediciones idénticas:

| Ejecución | Duración | Memoria máxima | Factor de duración |
|---|---|---|---|
| Sin herramienta | 0,23 s | 34 MiB | × 1 |
| ASan | 0,67 s | 42 MiB | × 2,9 |
| ASan + UBSan | 0,78 s | 44 MiB | × 3,4 |
| valgrind | 3,25 s | 87 MiB | × 14 |

Los factores dependen del programa: este casi solo hace accesos a memoria, justo lo que vigilan estas herramientas, así que el sobrecoste es marcado. Cada herramienta tiene además puntos ciegos:

| | ASan + UBSan (`gcc`) | valgrind | MSan (`clang -fsanitize=memory`) |
|---|---|---|---|
| Recompilación necesaria | sí | no | sí |
| Escritura fuera de límites, lectura tras `free`, fuga | detectado | detectado | fuera de su ámbito |
| Desbordamiento de entero con signo | detectado (mensaje, el programa continúa) | **no detectado** (medido: muestra `-2147483647`, código 0) | fuera de su ámbito |
| Lectura de un valor **no inicializado** | **no detectado** (medido: código 0, ningún mensaje) | detectado (`Conditional jump or move depends on uninitialised value(s)`) | detectado (`use-of-uninitialized-value`) |

> **Trampa:** creer que un programa «limpio bajo ASan» no tiene errores de memoria. Un valor leído antes de haber sido escrito (`malloc` no pone nada a cero) pasa bajo ASan. Pasar también por valgrind, o por [MSan](https://clang.llvm.org/docs/MemorySanitizer.html) con `clang` (que no se combina con ASan: `clang: error: invalid argument '-fsanitize=address' not allowed with '-fsanitize=memory'`).
>
> **Buena práctica:** sanitizers durante el desarrollo y en la [integración continua](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) (rápidos), valgrind antes de una entrega o para un programa que no se puede recompilar.

## Limitar la memoria de una prueba bajo ASan

Una prueba que asigna mucha memoria debe tener un tope, para que un error no haga ir lenta a toda la máquina (véanse [las salvaguardas de recursos](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). ASan exige dos precauciones.

**`ulimit -v` no se usa con ASan.** Este comando limita el espacio de direcciones virtual del proceso; pero ASan reserva un intervalo enorme (unos 14 TiB) para su tabla de seguimiento. Medido con `ulimit -v 1000000` (alrededor de 1 GB):

```
==10351==ERROR: AddressSanitizer failed to allocate 0xdfff0001000 (15392894357504) bytes ... (errno: 12)
==10351==ReserveShadowMemoryRange failed while trying to map 0xdfff0001000 bytes. Perhaps you're using ulimit -v
```

El programa ni siquiera arrancó: no es un error del programa.

**`ASAN_OPTIONS=hard_rss_limit_mb=N`** detiene el programa cuando la memoria que ocupa realmente (*RSS*, la memoria física usada) supera `N` MiB. Medido en un programa que asigna y rellena 10 MiB por vuelta:

| Límite pedido | Mensaje | Memoria en el momento de la parada |
|---|---|---|
| 200 MiB | `AddressSanitizer: hard rss limit exhausted (200Mb vs 249Mb)` | 249 MiB |
| 300 MiB | `AddressSanitizer: hard rss limit exhausted (300Mb vs 505Mb)` | 505 MiB |

La comprobación es **periódica**: el programa sigue asignando entre dos comprobaciones, de modo que el límite no es un tope estricto (aquí 505 MiB para 300 pedidos). Para un tope que nunca se supera, usar un grupo de control del núcleo (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`), descrito en el capítulo de las salvaguardas; `hard_rss_limit_mb` sigue siendo útil para obtener un **mensaje claro** en lugar de una muerte silenciosa del proceso.

## Inyectar fallos de asignación

`malloc` devuelve `NULL` cuando falta memoria, y un programa correcto debe entonces liberarlo todo y señalar el error. Pero `malloc` casi siempre funciona: esos caminos de fallo **nunca** se ejecutan durante las pruebas, y un error puede quedarse allí años. La técnica consiste en hacer fallar la asignación **número k**, para k = 1, 2, 3... hasta que todo funcione.

La opción `--wrap=malloc` (pasada al **enlazador**, el programa que reúne los archivos compilados en un único ejecutable, con `-Wl,` en gcc) redirige todas las llamadas a `malloc` del programa hacia una función `__wrap_malloc` escrita por uno mismo, que puede llamar al `malloc` real con el nombre `__real_malloc` ([documentación de `ld`](https://sourceware.org/binutils/docs/ld/Options.html)).

```c
#include <stdlib.h>

void	*__real_malloc(size_t size);            /* el malloc real, proporcionado por el enlazador */

static long	g_calls;                            /* número de llamadas a malloc desde el inicio */
static long	g_fail_at = -1;                     /* número de la llamada que debe fallar (-1: ninguna) */

void	set_fail_at(long k)
{
	g_calls = 0;
	g_fail_at = k;
}

void	*__wrap_malloc(size_t size)             /* llamado en lugar de malloc */
{
	g_calls++;
	if (g_calls == g_fail_at)
		return (NULL);                          /* la asignación número k «falla» */
	return (__real_malloc(size));
}
```

El programa probado copia dos cadenas en una estructura. La versión `FIXED` libera lo ya asignado cuando una asignación falla; la versión antigua se olvida de hacerlo:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void	set_fail_at(long k);

typedef struct s_pair
{
	char	*first;
	char	*second;
}	t_pair;

static char	*copy(const char *s)
{
	char	*p = malloc(strlen(s) + 1);

	if (p)
		strcpy(p, s);
	return (p);
}

/* Copia dos cadenas. Devuelve NULL si una asignación falla. */
t_pair	*pair_new(const char *a, const char *b)
{
	t_pair	*pair = malloc(sizeof *pair);

	if (!pair)
		return (NULL);
	pair->first = copy(a);
	pair->second = copy(b);
	if (!pair->first || !pair->second)
	{
#ifdef FIXED
		free(pair->first);                      /* free(NULL) está permitido */
		free(pair->second);
#endif
		free(pair);
		return (NULL);
	}
	return (pair);
}

int	main(void)
{
	for (long k = 1; k <= 4; k++)               /* como mucho 3 mallocs funcionan: se prueba k = 1..4 */
	{
		t_pair	*p;

		set_fail_at(k);
		p = pair_new("hola", "mundo");
		printf("k=%ld: %s\n", k, p ? "éxito" : "fallo gestionado");
		if (p)
		{
			free(p->first);
			free(p->second);
			free(p);
		}
	}
	return (0);
}
```

```bash
gcc -g -fsanitize=address -Wl,--wrap=malloc pair.c wrap.c -o pair_bug
gcc -g -fsanitize=address -Wl,--wrap=malloc -DFIXED pair.c wrap.c -o pair_ok
```

| Versión | Resultado medido |
|---|---|
| Antigua (sin liberación) | `ERROR: LeakSanitizer`, `Direct leak of 6 byte(s)` y `Direct leak of 5 byte(s)`, `11 byte(s) leaked in 2 allocation(s)`, código 1 |
| Corregida | `k=1: fallo gestionado`, `k=2: fallo gestionado`, `k=3: fallo gestionado`, `k=4: éxito`, código 0 |

Las dos fugas corresponden a los dos casos en que una copia funciona y la otra falla: `k=2` (falla la copia de `"hola"`, la de `"mundo"`, 6 bytes con el `\0`, tiene una fuga) y `k=3` (falla la de `"mundo"`, la de `"hola"`, 5 bytes, tiene una fuga). Sin esta inyección, esos dos caminos nunca se ejecutan, y ASan no puede decir nada de un código que no se lanza.

El envoltorio solo ve las llamadas a `malloc` **escritas en el código que uno enlaza**. Medido: tras un `strdup("hola")` (que llama a `malloc` dentro de la biblioteca C), el contador del envoltorio vale 0; tras el `malloc(8)` del programa, vale 1. Las asignaciones internas de `printf` o de `strdup` no se cuentan, y por tanto tampoco se prueban: para probar el fallo de un `strdup`, escribir una `copy` propia con `malloc`, como arriba.

| Técnica | Qué afecta | Límite |
|---|---|---|
| `-Wl,--wrap=malloc` | Solo las llamadas a `malloc` del programa enlazado | Hay que recompilar y enlazar con el envoltorio |
| `LD_PRELOAD=./libfail.so` (una biblioteca que sustituye `malloc` en todo el proceso) | **Todos** los `malloc`, biblioteca C incluida, sin recompilar | Afecta también a las herramientas lanzadas con la variable |

> **Trampa (`LD_PRELOAD`):** la variable de entorno la heredan todos los procesos lanzados después. Medido con una biblioteca que hace fallar la segunda asignación del proceso: `LD_PRELOAD=./libfail.so valgrind -q true` se detiene con `sh: 0: Out of space` y el código 2, igual que `LD_PRELOAD=./libfail.so sh -c 'echo ok'`: el shell y la herramienta lanzados sufren el fallo en lugar del programa probado. Poner la variable solo delante del comando del programa probado, nunca exportada, y preferir `--wrap` cuando se puede recompilar.

## Validar la herramienta de prueba con el código antiguo defectuoso

Una prueba que nunca ha fallado no demuestra nada: no se sabe si es capaz de detectar el defecto. Antes de fiarse de ella, se lanza sobre **el código antiguo defectuoso conocido**: debe condenarlo. Es el principio de las [pruebas de mutación](/?c=tests&p=tests-de-mutation), aplicado aquí a mano.

El ejemplo prueba una función que lee un entero positivo de 1 a 9 cifras. El código antiguo acepta la cadena vacía y no limita la longitud; el nuevo corrige ambas cosas. El banco compara cada versión con una **referencia independiente** (escrita de otra manera, con [`strtol`](https://man7.org/linux/man-pages/man3/strtol.3.html)) sobre las mismas entradas, según el [test diferencial](/?c=tests&p=property-based-testing#un-caso-vecino-el-test-diferencial):

```c
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int	(*t_parse)(const char *s, int *out);

/* Código antiguo: acepta la cadena vacía (ninguna cifra leída, valor 0). */
static int	parse_old(const char *s, int *out)
{
	long	v = 0;

	for (; *s >= '0' && *s <= '9'; s++)
		v = v * 10 + (*s - '0');
	if (*s)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Código nuevo: al menos una cifra, 9 como máximo, nada más. */
static int	parse_new(const char *s, int *out)
{
	size_t	len = strspn(s, "0123456789");

	if (len == 0 || len > 9 || s[len] != '\0')
		return (-1);
	*out = atoi(s);
	return (0);
}

/* Referencia independiente: strtol, con todas las comprobaciones. */
static int	reference(const char *s, int *out)
{
	char	*end;
	long	v;

	if (s[0] < '0' || s[0] > '9' || strlen(s) > 9)
		return (-1);
	errno = 0;
	v = strtol(s, &end, 10);
	if (errno || *end)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Devuelve 1 si la implementación y la referencia divergen en esta entrada. */
static int	differs(t_parse impl, const char *s)
{
	int	a = -1, b = -1;
	int	ra = impl(s, &a), rb = reference(s, &b);

	return (ra != rb || (ra == 0 && a != b));
}
```

El banco hace tres cosas: un **barrido exhaustivo** (todas las cadenas de 0 a 4 caracteres tomados de `05- a`, es decir 781 entradas), un **fuzz** (100 000 cadenas aleatorias de 0 a 12 caracteres, véanse [las herramientas de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing)) y la **repetición de los casos que ya fallaron**, conservados en archivos `regress/1.txt`, `regress/2.txt`... El generador aleatorio es un [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible) con semilla fija: las mismas entradas vuelven en cada ejecución, así que un fallo se reproduce.

```c
static unsigned	g_state = 2463534242u;           /* estado del generador xorshift32 */

static unsigned	next_random(void)
{
	g_state ^= g_state << 13;
	g_state ^= g_state >> 17;
	g_state ^= g_state << 5;
	return (g_state);
}

/* Escribe la entrada defectuosa en regress/<n>.txt, salvo si ya se conserva una idéntica. */
static void	save_regression(const char *s, int *saved, char kept[][13])
{
	char	path[64];
	FILE	*f;

	for (int i = 0; i < *saved; i++)
		if (strcmp(kept[i], s) == 0)
			return ;
	if (*saved == 3)
		return ;
	strcpy(kept[*saved], s);
	snprintf(path, sizeof path, "regress/%d.txt", ++*saved);
	f = fopen(path, "w");
	if (!f)
		return ;
	fputs(s, f);
	fclose(f);
}

/* Repite las entradas conservadas (regress/1.txt, 2.txt...): devuelve el número de divergencias. */
static int	replay(t_parse impl, const char *name)
{
	char	path[64], buf[13];
	int		files = 0, bad = 0;

	for (int n = 1; n <= 3; n++)
	{
		snprintf(path, sizeof path, "regress/%d.txt", n);
		FILE	*f = fopen(path, "r");

		if (!f)
			break ;
		size_t	len = fread(buf, 1, sizeof buf - 1, f);

		buf[len] = '\0';
		fclose(f);
		files++;
		bad += differs(impl, buf);
	}
	printf("%s: %d entradas conservadas repetidas, %d divergencias\n", name, files, bad);
	return (bad);
}

/* Barrido exhaustivo: todas las cadenas de 0 a 4 caracteres del alfabeto. */
static int	sweep(t_parse impl, const char *name)
{
	static const char	alphabet[] = "05- a";
	char				buf[5];
	int					tested = 0, bad = 0;

	for (int len = 0; len <= 4; len++)
	{
		int	total = 1;

		for (int i = 0; i < len; i++)
			total *= 5;
		for (int n = 0; n < total; n++)
		{
			for (int i = 0, m = n; i < len; i++, m /= 5)
				buf[i] = alphabet[m % 5];
			buf[len] = '\0';
			tested++;
			if (differs(impl, buf) && bad++ == 0)
				printf("%s: primera divergencia en \"%s\"\n", name, buf);
		}
	}
	printf("%s: barrido de %d entradas, %d divergencias\n", name, tested, bad);
	return (bad);
}

/* Fuzz: cadenas aleatorias de 0 a 12 caracteres, divergencias conservadas en regress/. */
static int	fuzz(t_parse impl, const char *name, int rounds)
{
	static const char	alphabet[] = "0123456789- a";
	char				buf[13], kept[3][13];
	int					bad = 0, saved = 0;

	for (int r = 0; r < rounds; r++)
	{
		int	len = next_random() % 13;

		for (int i = 0; i < len; i++)
			buf[i] = alphabet[next_random() % (sizeof alphabet - 1)];
		buf[len] = '\0';
		if (differs(impl, buf))
		{
			bad++;
			save_regression(buf, &saved, kept);
		}
	}
	printf("%s: fuzz de %d sorteos, %d divergencias\n", name, rounds, bad);
	return (bad);
}

int	main(void)
{
	int	bad_old = sweep(parse_old, "antiguo") + fuzz(parse_old, "antiguo", 100000);
	int	bad_new;

	replay(parse_old, "antiguo");
	bad_new = replay(parse_new, "nuevo") + sweep(parse_new, "nuevo")
		+ fuzz(parse_new, "nuevo", 100000);

	printf("herramienta validada con el código antiguo: %s\n", bad_old ? "sí (lo condena)" : "NO");
	return (bad_new != 0);
}
```

Salida medida (el directorio `regress/` debe existir antes de lanzar; `mkdir regress`):

```
antiguo: primera divergencia en ""
antiguo: barrido de 781 entradas, 1 divergencias
antiguo: fuzz de 100000 sorteos, 8873 divergencias
antiguo: 3 entradas conservadas repetidas, 3 divergencias
nuevo: 3 entradas conservadas repetidas, 0 divergencias
nuevo: barrido de 781 entradas, 0 divergencias
nuevo: fuzz de 100000 sorteos, 0 divergencias
herramienta validada con el código antiguo: sí (lo condena)
```

Tres enseñanzas:

- **El banco condena el código antiguo** (1 divergencia en el barrido, 8 873 en el fuzz) y absuelve el nuevo (0 en todo): se sabe que los dos veredictos significan algo.
- **El barrido exhaustivo solo vio uno de los dos defectos.** Se detiene en 4 caracteres, así que encuentra la cadena vacía (`""`), pero nunca el defecto de los números demasiado largos. El fuzz, que llega a 12 caracteres, encuentra las cadenas de 10 cifras o más (`regress/2.txt` contiene `3582159301`): el código antiguo las lee en un `long` y luego las trunca en un `int`, y la referencia las rechaza. Un barrido exhaustivo solo cubre lo que permiten su alfabeto y su longitud máxima.
- **Cada fallo encontrado por el fuzz se convierte en una prueba permanente.** Los archivos `regress/*.txt` se repiten primero en cada ejecución: el defecto no puede volver sin que el banco lo señale.

> **Trampa:** una referencia que comparte el razonamiento del código probado (el mismo `strspn`, el mismo error) siempre da la razón al código. Escribir la referencia de otra manera, o tomarla de una función de la biblioteca estándar.
>
> **Trampa:** comparar el código nuevo solo con el antiguo, sin referencia: si los dos se equivocan igual, no aparece ninguna divergencia.

## Los falsos positivos de la herramienta de prueba

Un **falso positivo** es una alerta que acusa a código correcto: el defecto está en la herramienta de prueba, no en el programa. Antes de corregir nada, **confirmar la alerta con el código antiguo**: volver a lanzar la misma prueba con la versión anterior ([`git stash`](/?c=qualite-performance-et-outils&s=git&p=stash), o [`git worktree add ../antes <commit>`](/?c=qualite-performance-et-outils&s=git&p=worktree)). Si la alerta aparece también con el código antiguo, no viene del cambio, y a menudo es la herramienta la que se equivoca. En una revisión real de un programa gráfico, 7 alertas de 7 venían de la herramienta de prueba, ninguna del programa.

| Causa del falso positivo | Síntoma | Remedio |
|---|---|---|
| El verificador compara **números** (de vértices, de identificadores) | Dos objetos idénticos se declaran distintos en cuanto se renumeran | Comparar el contenido (coordenadas, valores), en un orden canónico |
| La prueba lee un valor **antes** de la llamada que lo modifica | Valor esperado ausente | Leer después de la llamada |
| La herramienta se **recompila mientras corre una serie** | Una serie mezcla los resultados de dos versiones | No volver a compilar durante una serie; compilar en otra carpeta y luego sustituir |
| Un **cursor de ratón** aparece en una captura de pantalla | La caja envolvente de la imagen es falsa | `ffmpeg -draw_mouse 0` (véase [medir lo que muestra la aplicación](/?c=infrastructure-devops&s=administration-systeme&p=touche-coincee-clavier-virtuel-xtest)) |
| Un efecto **pulsa** (brillo que varía) | Dos capturas de la misma escena difieren | Normalizar el brillo de cada imagen antes de comparar |

**Comparar números.** Dos mallas idénticas (un cuadrado hecho de dos triángulos), la segunda con sus vértices renumerados:

```python
# Dos mallas idénticas: la segunda está renumerada (los vértices están en otro orden).
vertices_a = [(0, 0), (1, 0), (0, 1), (1, 1)]            # vértice número 0, 1, 2, 3
triangulos_a = [(0, 1, 2), (1, 3, 2)]                    # cada triángulo cita números

orden = [2, 0, 3, 1]                                     # orden[j]: antiguo vértice colocado en la posición j
vertices_b = [vertices_a[i] for i in orden]
nuevo_numero = {antiguo: nuevo for nuevo, antiguo in enumerate(orden)}
triangulos_b = [tuple(nuevo_numero[i] for i in t) for t in triangulos_a]

# Verificador frágil: compara los números de vértice.
print("por números     :", "idénticas" if triangulos_a == triangulos_b else "DIFERENTES (falso positivo)")

# Verificador robusto: compara las coordenadas, en un orden canónico.
def forma(vertices, triangulos):
    return sorted(tuple(sorted(vertices[i] for i in t)) for t in triangulos)

print("por coordenadas :", "idénticas" if forma(vertices_a, triangulos_a) == forma(vertices_b, triangulos_b) else "DIFERENTES")
```

```
por números     : DIFERENTES (falso positivo)
por coordenadas : idénticas
```

**Leer antes de la llamada.** La prueba frágil guarda el valor de antes; la prueba correcta lo lee después:

```c
#include <stdio.h>

static int	g_count;                            /* contador modificado por la función probada */

static void	register_item(void)
{
	g_count++;
}

int	main(void)
{
	int	antes = g_count;                        /* leído ANTES de la llamada: vale 0 */

	register_item();
	printf("prueba frágil: g_count vale %d, esperado 1: %s\n", antes, antes == 1 ? "ok" : "FALLO (falso positivo)");
	printf("prueba correcta: g_count vale %d, esperado 1: %s\n", g_count, g_count == 1 ? "ok" : "FALLO");
	return (0);
}
```

```
prueba frágil: g_count vale 0, esperado 1: FALLO (falso positivo)
prueba correcta: g_count vale 1, esperado 1: ok
```

**Recompilar durante una serie.** Una serie de 6 lanzamientos espaciados 0,3 s; la herramienta se recompila (versión 2) y se sustituye con `mv` tras 0,7 s:

```bash
gcc -DVERSION='"herramienta v1"' tool.c -o tool                  # primera versión de la herramienta
( for i in 1 2 3 4 5 6; do ./tool; sleep 0.3; done ) > serie.txt &   # serie lanzada en segundo plano
sleep 0.7
gcc -DVERSION='"herramienta v2"' tool.c -o tool.new && mv tool.new tool    # recompilación durante la serie
wait; cat serie.txt
```

```
herramienta v1
herramienta v1
herramienta v1
herramienta v2
herramienta v2
herramienta v2
```

Ningún error, ningún aviso: el enlazador o `mv` sustituyen el archivo aunque esté en uso. La serie contiene los resultados de dos herramientas distintas, y la diferencia observada entre los 3 primeros y los 3 últimos lanzamientos no dice nada del programa probado.

**Normalizar el brillo.** Un programa cuyo renderizado pulsa (brillo que sube y baja) produce dos capturas distintas de la misma escena. Simulación con una imagen de 16 píxeles, una vez a brillo completo, otra a 0,6; la normalización divide cada píxel por la media de la imagen:

```python
def imagen(brillo):
    """Imagen 4 x 4: un patrón fijo multiplicado por el brillo del momento."""
    patron = [[(x + 2 * y) % 5 + 1 for x in range(4)] for y in range(4)]
    return [[round(v * brillo * 40) for v in fila] for fila in patron]

def aplanar(img):
    return [v for fila in img for v in fila]

def diferencia_max(a, b):
    return max(abs(p - q) for p, q in zip(aplanar(a), aplanar(b)))

def normalizar(img):
    media = sum(aplanar(img)) / 16
    return [[v / media for v in fila] for fila in img]

def diferencia_max_normalizada(a, b):
    return max(abs(p - q) for p, q in zip(aplanar(normalizar(a)), aplanar(normalizar(b))))

claro = imagen(1.0)                                 # escena a brillo completo
oscuro = imagen(0.6)                                # misma escena, 0,6 veces más oscura
print("diferencia máxima bruta        :", diferencia_max(claro, oscuro), "niveles sobre 255")
print("diferencia máxima normalizada  :", round(diferencia_max_normalizada(claro, oscuro), 4))
```

```
diferencia máxima bruta        : 80 niveles sobre 255
diferencia máxima normalizada  : 0.0
```

La diferencia bruta (80 niveles sobre 255) haría fallar una prueba de comparación aunque la escena sea idéntica; tras la normalización baja a 0. Con capturas reales, la diferencia no baja exactamente a 0 (ruido de compresión, redondeos): fijar un umbral de tolerancia medido sobre dos capturas de la misma escena.

> **Trampa:** corregir el programa antes de haber confirmado la alerta con el código antiguo. Se «repara» un defecto que no existe, y se puede introducir uno real.
>
> **Trampa:** validar la herramienta solo con código correcto. Debe también condenar un código defectuoso conocido (sección anterior): si no, puede callarse por defecto y no detectar nada.
>
> **Buena práctica:** ante cualquier alerta inesperada, tres preguntas por orden: ¿ha cambiado la herramienta? ¿existe la alerta con el código antiguo? ¿qué dice una comparación hecha de otra manera (contenido en lugar de números, tras normalizar)?

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un error de memoria en C suele pasar inadvertido: `-fsanitize=address,undefined` (ASan: accesos fuera de límites y uso tras `free`; LeakSanitizer: fugas; UBSan: comportamiento indefinido) los hace visibles con un coste de aproximadamente ×3 en duración y ×1,2 en memoria, frente a ×14 y ×2,6 de valgrind. Hacer fallar el `malloc` número k (`-Wl,--wrap=malloc`) ejecuta los caminos de fallo que ninguna prueba normal alcanza. Una herramienta de prueba se valida lanzándola sobre código defectuoso conocido, y una alerta se confirma con el código antiguo antes de acusar al nuevo. |
| **Herramientas utilizables** | `gcc`/`clang` con `-fsanitize=address,undefined -g -fno-omit-frame-pointer`; `UBSAN_OPTIONS=halt_on_error=1`; `valgrind --leak-check=full`; MSan (`clang -fsanitize=memory`) para los valores no inicializados; `ASAN_OPTIONS=hard_rss_limit_mb=N`; `systemd-run ... -p MemoryMax=...`; `-Wl,--wrap=malloc`; un banco con barrido exhaustivo + fuzz de semilla fija + entradas conservadas en `regress/`. |
| **Trampas a evitar** | `ulimit -v` con ASan (el programa no arranca); mirar solo el código de salida (UBSan continúa, código 0); creer que un programa «limpio bajo ASan» no tiene valores no inicializados (ASan no los ve); la salida de `stdout` perdida cuando LeakSanitizer termina el proceso; un `LD_PRELOAD` exportado que rompe las herramientas lanzadas después; una referencia que comparte el error del código; comparar números en lugar del contenido; recompilar la herramienta durante una serie; leer un valor antes de la llamada que lo modifica; validar una prueba solo con código correcto. |
| **Buenas prácticas** | Sanitizers en desarrollo y en integración continua, valgrind antes de la entrega; inyectar el fallo de cada asignación (k = 1, 2, 3...) y comprobar fuga y mensaje; lanzar la herramienta de prueba sobre el código antiguo defectuoso antes de fiarse de ella; conservar cada fallo del fuzz como prueba permanente; confirmar toda alerta inesperada con el código antiguo; comparar el contenido y normalizar lo que varía (brillo) antes de comparar dos renderizados. |
