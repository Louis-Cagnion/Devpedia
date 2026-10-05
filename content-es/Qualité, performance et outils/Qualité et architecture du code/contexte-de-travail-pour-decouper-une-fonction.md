---
order: 12
---

# Un contexto de trabajo para dividir una función grande

Una función que lo hace todo (abrir un archivo, leer cada línea, convertir, asignar memoria, guardar, limpiar en caso de error) acaba siendo larga, y cada salida de error repite la misma limpieza. Este capítulo muestra cómo dividirla sin que las subfunciones acaben con una lista de seis parámetros, reuniendo lo que comparten en una **estructura** pasada por puntero: un **contexto de trabajo**. Una **estructura** (`struct`) es un tipo que agrupa varias variables bajo un mismo nombre; se le pasa su dirección (un [puntero](/?c=langages&s=c&p=pointeurs)) para que todas las funciones vean la misma.

El capítulo [Responsabilidad única y bajo acoplamiento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) explica **cuándo** dividir; este muestra **cómo**, con un ejemplo ejecutado, y con la inyección de fallos de asignación del capítulo [Sanitizers y pruebas de asignación](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) para demostrar que cada salida limpia todo.

## El ejemplo: cargar un archivo de personas

El archivo contiene una persona por línea, con el formato `nombre;edad;ciudad` (`Ada;36;Londres`). La función `load_people` devuelve un arreglo de personas, o `NULL` con un mensaje que nombra el archivo, la línea y la causa. Un archivo se abre con [`fopen` y se lee línea a línea con `fgets`](/?c=langages&s=c&p=lecture-de-fichiers); la edad se convierte con [`strtol` y sus comprobaciones](/?c=langages&s=c&p=convertir-un-texte-en-nombre).

```c
#ifndef PEOPLE_H
# define PEOPLE_H
# include <stddef.h>

typedef struct s_person
{
	char	*name;
	char	*city;
	int		age;
}	t_person;

/* Lee un archivo de líneas "nombre;edad;ciudad". Devuelve NULL en caso de error. */
t_person	*load_people(const char *path, size_t *count);
void		free_people(t_person *people, size_t count);

#endif
```

## La versión original: una sola función

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}

t_person	*load_people(const char *path, size_t *count)
{
	FILE		*file = fopen(path, "r");
	t_person	*people = NULL, *grown;
	size_t		capacity = 0;
	char		line[256], *sep1, *sep2, *end, *name, *city;
	int			line_no = 0;
	long		age;

	*count = 0;
	if (!file)
	{
		fprintf(stderr, "%s: cannot open\n", path);
		return (NULL);
	}
	while (fgets(line, sizeof line, file))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		sep1 = strchr(line, ';');
		sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
		if (!sep2)
		{
			fprintf(stderr, "%s:%d: missing separator\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep1 == line)
		{
			fprintf(stderr, "%s:%d: empty name\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		age = strtol(sep1 + 1, &end, 10);
		if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		{
			fprintf(stderr, "%s:%d: invalid age\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep2[1] == '\0')
		{
			fprintf(stderr, "%s:%d: empty city\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		name = copy_n(line, sep1 - line);
		if (!name)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		city = copy_n(sep2 + 1, strlen(sep2 + 1));
		if (!city)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free(name);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (*count == capacity)
		{
			capacity = capacity ? capacity * 2 : 2;
			grown = malloc(capacity * sizeof *grown);
			if (!grown)
			{
				fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
				free_people(people, *count);
				fclose(file);
				*count = 0;
				return (NULL);
			}
			if (*count)
				memcpy(grown, people, *count * sizeof *grown);
			free(people);
			people = grown;
		}
		people[*count].name = name;
		people[*count].city = city;
		people[*count].age = (int)age;
		(*count)++;
	}
	fclose(file);
	return (people);
}
```

`load_people` tiene 98 líneas. Cada `return (NULL)` va precedido de `free_people(people, *count); fclose(file); *count = 0;`: **siete** bloques de limpieza casi idénticos. Cuando el código se copia siete veces, una copia acaba diferenciándose de las demás: aquí, la del fallo al agrandar el arreglo (abajo) olvida liberar `name` y `city`, que la copia del fallo sobre `city` sí liberaba (`free(name)`).

## Las dos falsas soluciones

**Dividir sin contexto.** Cada etapa se convierte en una función, que recibe todo lo que necesita y devuelve sus resultados por puntero:

```c
static int	parse_line(const char *line, const char *path, int line_no,
				char **name, int *age, char **city);
```

Seis parámetros, tres de los cuales solo sirven para escribir el mensaje de error; el llamador debe además liberar `name` y `city` si la etapa siguiente falla: la limpieza sigue dispersa, y cada dato nuevo alarga todas las firmas.

**Variables globales.** Evitan los parámetros, pero dos cargas a la vez (dos [threads](/?c=langages&s=c&p=threads), o una carga lanzada desde dentro de otra) se pisan los datos mutuamente, y nada en la firma dice que la función depende de ellas.

| Enfoque | Parámetros de cada subfunción | Limpieza | Límite |
|---|---|---|---|
| Una sola función | ninguno (todo en variables locales) | duplicada en cada salida (7 veces aquí) | una copia olvidada = una fuga |
| Subfunciones sin contexto | 6 | dispersa en cada llamador | cada dato añadido cambia todas las firmas |
| Variables globales | ninguno | un solo lugar | no reentrante, dependencia invisible |
| **Contexto pasado por puntero** | **1** | **un solo lugar** | exige una regla de propiedad (véase más abajo) |

## El contexto de trabajo

Se reúne en una estructura todo lo que vive durante la carga: el archivo, su ruta, la línea actual, los campos que se están leyendo (aún no guardados), el arreglo y su tamaño. Se crea una variable `t_job job` una sola vez en `load_people`; las subfunciones reciben `&job`.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

typedef struct s_job
{
	FILE		*file;
	const char	*path;
	int			line_no;
	char		line[256];
	char		*name;
	char		*city;
	int			age;
	t_person	*people;
	size_t		count;
	size_t		capacity;
}	t_job;

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}
```

El punto central es **una única función de salida de error**, que libera todo lo que posee el contexto, sea cual sea el punto en que se esté:

```c
/* Señala la causa, libera TODO lo que posee la tarea, devuelve -1. */
static int	fail_job(t_job *job, const char *cause)
{
	if (job->line_no)
		fprintf(stderr, "%s:%d: %s\n", job->path, job->line_no, cause);
	else
		fprintf(stderr, "%s: %s\n", job->path, cause);
	free(job->name);
	free(job->city);
	free_people(job->people, job->count);
	if (job->file)
		fclose(job->file);
	return (-1);
}
```

Esta función puede liberarlo todo sin saber en qué punto se está, porque `free(NULL)` está permitido (no hace nada) y el contexto arranca **completamente a cero** (`t_job job = {0}` más abajo): un campo aún sin rellenar vale `NULL`.

Las etapas pasan a ser pequeñas funciones que reciben el contexto y devuelven 0 (logrado) o -1 (fallo ya señalado y limpiado):

```c
/* Divide job->line en nombre, edad y ciudad (copias en job->name y job->city). */
static int	split_line(t_job *job)
{
	char	*sep1, *sep2, *end;
	long	age;

	job->line[strcspn(job->line, "\n")] = '\0';
	sep1 = strchr(job->line, ';');
	sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
	if (!sep2)
		return (fail_job(job, "missing separator"));
	if (sep1 == job->line)
		return (fail_job(job, "empty name"));
	age = strtol(sep1 + 1, &end, 10);
	if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		return (fail_job(job, "invalid age"));
	if (sep2[1] == '\0')
		return (fail_job(job, "empty city"));
	job->name = copy_n(job->line, sep1 - job->line);
	job->city = copy_n(sep2 + 1, strlen(sep2 + 1));
	job->age = (int)age;
	if (!job->name || !job->city)
		return (fail_job(job, "out of memory"));
	return (0);
}

/* Guarda la persona actual en el arreglo, agrandado por duplicación si hace falta. */
static int	store_person(t_job *job)
{
	t_person	*grown;

	if (job->count == job->capacity)
	{
		job->capacity = job->capacity ? job->capacity * 2 : 2;
		grown = malloc(job->capacity * sizeof *grown);
		if (!grown)
			return (fail_job(job, "out of memory"));
		if (job->count)
			memcpy(grown, job->people, job->count * sizeof *grown);
		free(job->people);
		job->people = grown;
	}
	job->people[job->count].name = job->name;
	job->people[job->count].city = job->city;
	job->people[job->count].age = job->age;
	job->count++;
	job->name = NULL;                               /* el arreglo es ahora su propietario */
	job->city = NULL;
	return (0);
}

t_person	*load_people(const char *path, size_t *count)
{
	t_job	job = {0};

	*count = 0;
	job.path = path;
	job.file = fopen(path, "r");
	if (!job.file)
		return (fail_job(&job, "cannot open"), NULL);
	while (fgets(job.line, sizeof job.line, job.file))
	{
		job.line_no++;
		if (split_line(&job) || store_person(&job))
			return (NULL);
	}
	fclose(job.file);
	*count = job.count;
	return (job.people);
}
```

La regla de **propiedad** cabe en dos líneas de `store_person`: mientras `name` y `city` están en el contexto, es él quien los libera; una vez guardados en el arreglo, es el arreglo, y el contexto los vuelve a poner a `NULL` para no liberarlos dos veces.

Medido en las dos versiones (`gcc` 12.4):

| | Versión original | Con contexto |
|---|---|---|
| `load_people` | 98 líneas | 19 líneas |
| Otras funciones | ninguna | `split_line` 24, `store_person` 23, `fail_job` 13 |
| Bloques de limpieza duplicados | 7 | 1 (`fail_job`) |
| Parámetros de cada etapa | | 1 (`t_job *job`) |

El tope de longitud fijado para una función es de 100 líneas: la original (98) pasa por poco, y el defecto no era la longitud, sino las siete salidas que limpiar. El tope es una **salvaguarda** que obliga a hacerse la pregunta, no un objetivo.

## Demostrar que cada salida limpia todo

El banco siguiente escribe cuatro archivos (uno válido de 5 líneas, tres inválidos), y luego hace **fallar la asignación número k** para k = 1, 2, 3... hasta que la carga del archivo válido tiene éxito (técnica `--wrap=malloc` del capítulo [Sanitizers y pruebas de asignación](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#inyectar-fallos-de-asignacion), archivo `wrap.c` idéntico). Los tres archivos inválidos comprueban que cada causa de rechazo limpia.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

void	set_fail_at(long k);

static void	write_file(const char *path, const char *text)
{
	FILE	*f = fopen(path, "w");

	fputs(text, f);
	fclose(f);
}

/* Hace fallar la 1.ª, 2.ª, 3.ª... asignación hasta que la carga tiene éxito. */
static void	inject_failures(const char *path)
{
	size_t		count;
	t_person	*people;
	long		k = 1;

	for (;; k++)
	{
		set_fail_at(k);
		people = load_people(path, &count);
		if (people)
			break ;
		if (k > 50)
			return ((void)puts("demasiados fallos"));
	}
	set_fail_at(-1);
	printf("%s: %ld fallos inyectados, todos gestionados; el siguiente tiene éxito (%zu personas)\n",
		path, k - 1, count);
	free_people(people, count);
}

static void	invalid_file(const char *path)
{
	size_t		count;
	t_person	*people;

	set_fail_at(-1);
	people = load_people(path, &count);
	printf("%s: %s (%zu personas)\n", path, people ? "cargado" : "rechazado", count);
	free_people(people, count);
}

int	main(void)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* salida sin búfer: no la pierde LeakSanitizer */
	write_file("ok.txt", "Ada;36;Londres\nAlan;41;Wilmslow\nGrace;85;Arlington\n"
		"Linus;55;Portland\nMargaret;87;Boston\n");
	write_file("sep.txt", "Ada;36;Londres\nAlan 41 Wilmslow\n");
	write_file("age.txt", "Ada;36;Londres\nAlan;abc;Wilmslow\n");
	write_file("name.txt", "Ada;36;Londres\n;41;Wilmslow\n");
	inject_failures("ok.txt");
	invalid_file("sep.txt");
	invalid_file("age.txt");
	invalid_file("name.txt");
	invalid_file("absent.txt");
	return (0);
}
```

```bash
# people_old.c: versión original; people_new.c: versión con contexto
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_old.c wrap.c -o test_old
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_new.c wrap.c -o test_new
./test_old 2> log_old.txt; echo "código de salida: $?"
./test_new 2> log_new.txt; echo "código de salida: $?"
```

`setvbuf(stdout, NULL, _IONBF, 0)` suprime el búfer de `stdout`: sin él, una fuga detectada por LeakSanitizer haría que la [salida desapareciera](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#los-sanitizers-que-comprueban) en un programa redirigido a un archivo. Los mensajes de error del programa y los informes de ASan van ambos a `stderr`, es decir a `log_old.txt` y `log_new.txt`.

Salida estándar, idéntica en las dos versiones:

```
ok.txt: 13 fallos inyectados, todos gestionados; el siguiente tiene éxito (5 personas)
sep.txt: rechazado (0 personas)
age.txt: rechazado (0 personas)
name.txt: rechazado (0 personas)
absent.txt: rechazado (0 personas)
```

| | Versión original | Con contexto |
|---|---|---|
| Código de salida | 1 | 0 |
| En el registro de errores | `Direct leak of 25 byte(s) in 3 object(s)`, `Direct leak of 19 byte(s) in 3 object(s)`, `SUMMARY: AddressSanitizer: 44 byte(s) leaked in 6 allocation(s)` | ningún informe |
| Mensajes de rechazo | `sep.txt:2: missing separator`, `age.txt:2: invalid age`, `name.txt:2: empty name`, `absent.txt: cannot open` | los mismos |

Las tres cargas de la versión original en que falla el agrandamiento del arreglo (en la 1.ª, la 3.ª y la 5.ª persona) dejan fugar el nombre y la ciudad en curso: 3 nombres (4 + 6 + 9 = 19 bytes) y 3 ciudades (8 + 10 + 7 = 25 bytes), es decir 6 bloques y 44 bytes. Es exactamente la copia de la limpieza que difiere de las demás. En la versión con contexto, este camino pasa por `fail_job`, que libera `job->name` y `job->city` sin planteárselo.

## Las trampas

Dos errores de disciplina, medidos en la versión con contexto:

| Error | Qué ocurre (medido) |
|---|---|
| Olvidar volver a poner `job->name` y `job->city` a `NULL` tras `store_person` | Un fallo en la línea siguiente libera los dos campos una primera vez por el arreglo, una segunda por `fail_job`: `ERROR: AddressSanitizer: attempting double-free` |
| Escribir `t_job job;` en lugar de `t_job job = {0};` | Los campos contienen lo que contenía la pila. En esta ejecución, bajo ASan y UBSan: **ningún informe**, todo pasa (la pila valía cero por casualidad). Bajo valgrind: `Conditional jump or move depends on uninitialised value(s)`, luego `Use of uninitialised value of size 8` |

> **Trampa:** un contexto sin inicializar puede pasar todas las pruebas bajo ASan, mientras `fail_job` llama a `free` sobre un campo que contiene un valor al azar. Inicializar a cero en la declaración, sin excepción.
>
> **Trampa:** un contexto «cajón de sastre» donde se mete lo que se quiere compartir entre tareas distintas (el archivo de una carga, los ajustes de la aplicación, un contador de pantalla): vuelve a ser un conjunto de variables globales. Un contexto por **tarea**, creado al principio y destruido al final de esa tarea.
>
> **Trampa:** dividir para alcanzar un tope de líneas sin mirar la limpieza. Una función corta con siete `return` que limpian cada uno a su manera sigue siendo frágil.
>
> **Buena práctica:** escribir la regla de propiedad como comentario junto a la transferencia (`/* el arreglo es ahora su propietario */`), inicializar el contexto a cero, una sola función de salida de error que lo libere todo, y probarla por inyección de fallos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función grande que limpia en cada salida de error duplica su limpieza (7 veces en el ejemplo, 98 líneas); una copia acaba difiriendo (aquí, 44 bytes se fugan cuando falla el agrandamiento del arreglo). Un contexto de trabajo (`struct`) pasado por puntero reúne lo que comparten las etapas; una sola función `fail_job` lo libera todo. Resultado: una función de 19 líneas, tres etapas de 13 a 24 líneas, ninguna fuga en 13 fallos inyectados. |
| **Herramientas utilizables** | Una `struct` de contexto inicializada con `{0}`; `free(NULL)` permitido; una función de salida única; `-fsanitize=address` con `-Wl,--wrap=malloc` para hacer fallar la asignación número k; valgrind para los valores sin inicializar. |
| **Trampas a evitar** | Seis parámetros por subfunción; variables globales (no reentrantes); olvidar volver a poner un puntero a `NULL` tras transferirlo (doble liberación); un contexto sin inicializar (silencioso bajo ASan); un contexto cajón de sastre; dividir por un tope de líneas sin mirar las salidas. |
| **Buenas prácticas** | Un contexto por tarea; una regla de propiedad escrita donde ocurre la transferencia; una sola salida de error que lo libere todo; probar cada salida por inyección de fallos; el tope de longitud (100 líneas) como salvaguarda, no como objetivo. |
