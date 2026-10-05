---
order: 10
---

# La inundación de logs: señalar cada causa una sola vez

Un **log** (o registro) es la traza que escribe un programa para decir qué hace y qué va mal. En C, los mensajes de error salen por **`stderr`**, el flujo de error estándar (el descriptor número 2, véase [las llamadas al sistema y los descriptores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)), que se muestra en el terminal o se redirige a un archivo. Una **inundación de logs** ocurre cuando el mismo mensaje se escribe miles de veces: la información útil queda ahogada y el programa se ralentiza al escribir. Este capítulo muestra cómo ocurre en un bucle que funciona de forma continua y cómo evitarla con una lista acotada de causas ya señaladas.

## Por qué un bucle repite su mensaje

Un **bucle de renderizado** es el bucle de un programa gráfico: en cada vuelta dibuja una imagen en la pantalla (véase [el bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Un mensaje de error colocado en este bucle se escribe, por tanto, **en cada fotograma**.

```c
/* Se ejecuta en cada fotograma: un mensaje de error por vuelta del bucle. */
GLint loc = glGetUniformLocation(program, "light_dir");
if (loc == -1)
	fprintf(stderr, "uniform light_dir ausente\n");
```

Aquí, un **`uniform`** es un valor que el programa C fija para el **shader** (el pequeño programa que ejecuta la tarjeta gráfica), y `glGetUniformLocation` devuelve `-1` cuando el nombre no existe: véase [los shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-shaders-los-programas-de-la-tarjeta-grafica). Hay dos causas posibles: una errata en el nombre, o una variable que el compilador ha eliminado porque no sirve para nada en el shader.

| Cadencia del bucle | Líneas escritas por segundo | Líneas en 1 hora |
|---|---|---|
| 60 fotogramas/s (pantalla de 60 Hz, [sincronización vertical](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#la-sincronizacion-vertical-vsync) activa) | 60 | 216 000 |
| Unos 150 fotogramas/s (sin sincronización) | 150 | 540 000 |

Las consecuencias se encadenan:

- el mensaje **oculta** a los demás, porque el primer error útil desaparece de la pantalla en pocos segundos;
- escribir en un terminal es **lento**: puede llegar a costar más que el propio dibujo;
- redirigido a un archivo, lo hace **crecer sin fin** hasta llenar el disco.

> **Trampa:** creer que un mensaje de error es siempre inofensivo. En un bucle, lo que hace el daño es la frecuencia, no el contenido del mensaje.

## Una sola vez por causa: la lista acotada

El mensaje de error es útil **una vez**. La solución consiste en recordar las causas ya señaladas y dejar de escribir para ellas. Una **causa** es aquí un texto corto que identifica el problema (`"uniform:light_dir"`): dos causas distintas se señalan cada una una vez, una misma causa nunca dos.

```c
#include <stdio.h>
#include <string.h>

#define MAX_CAUSES 16                      /* número máximo de causas recordadas */
#define CAUSE_SIZE 64                      /* longitud máxima de una causa, '\0' incluido */

/* Devuelve 1 la primera vez que se ve una causa, 0 después (o si la lista está llena). */
static int	first_report(const char *cause)
{
	static char	seen[MAX_CAUSES][CAUSE_SIZE];   /* static: se conserva entre llamadas */
	static int	count;                          /* static: empieza en 0, nunca se reinicia */

	for (int i = 0; i < count; i++)
		if (strcmp(seen[i], cause) == 0)
			return (0);                     /* ya señalada: se calla */
	if (count == MAX_CAUSES)
		return (0);                         /* lista llena: la memoria sigue acotada */
	snprintf(seen[count++], CAUSE_SIZE, "%s", cause);
	return (1);
}

/* En el bucle de renderizado: */
if (loc == -1 && first_report("uniform:light_dir"))
	fprintf(stderr, "uniform light_dir ausente\n");
```

La palabra clave **`static`** delante de una variable local hace que viva durante todo el programa en lugar de desaparecer al terminar la función (véase [la memoria en C](/?c=langages-de-programmation&s=c&p=memoire)): es lo que permite que la lista recuerde de una llamada a otra. La función `strcmp` compara dos cadenas y devuelve 0 si son idénticas; `snprintf` copia deteniéndose en el tamaño indicado.

Medido en 1 000 fotogramas con dos uniforms ausentes (`light_dir` y `shininess`):

| | Líneas en `stderr` |
|---|---|
| Mensaje en cada fotograma | 2 000 |
| Una sola vez por causa | 2 |

La medición se hace simplemente contando líneas: `./programa 2>&1 | wc -l` redirige `stderr` a la salida estándar (`2>&1`) y luego cuenta las líneas (`wc -l`).

## Los límites de esta solución

| Opción | Efecto | Cuándo usarla |
|---|---|---|
| Lista de causas ya señaladas (arriba) | Cada causa aparece una vez, memoria acotada | Errores en número finito y conocido de antemano |
| Como máximo un mensaje por segundo | El mensaje vuelve con regularidad, útil para un problema que desaparece y reaparece | Programa largo, donde "sigue averiado" importa |
| Contador mostrado al final | "uniform light_dir ausente (repetido 3 400 veces)" en una línea al cerrar | Cuando la frecuencia es en sí misma una información |

> **Trampa:** una lista llena ya no señala nada. Con 16 plazas, la decimoséptima causa distinta queda en silencio. Prever un tope muy superior al número de causas esperadas y considerar escribir una última línea "demasiadas causas distintas, mensajes siguientes suprimidos" cuando la lista se llene.
>
> **Trampa:** una causa demasiado larga se trunca a `CAUSE_SIZE - 1` caracteres por `snprintf`: dos causas que solo difieren después de ese límite se confunden. Mantener identificadores de causa cortos (`"uniform:light_dir"`), no el texto completo del mensaje.
>
> **Buena práctica:** no escribir nunca sin límite en `stderr` desde un bucle que se ejecuta en cada fotograma, en cada petición o en cada línea leída. Al escribir el mensaje, preguntarse: "¿cuántas veces puede ejecutarse esta línea durante la vida del programa?"

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un mensaje de error colocado en un bucle se escribe en cada vuelta: de 60 a 150 líneas por segundo en un bucle de renderizado. Oculta los demás mensajes, ralentiza el programa y puede llenar el disco. Se señala una sola vez por causa. |
| **Herramientas utilizables** | Una lista acotada de causas ya señaladas (arreglo `static` y `strcmp`); la redirección `2>&1` y `wc -l` para contar las líneas producidas. |
| **Trampas a evitar** | Escribir en `stderr` en cada fotograma; una lista llena que se calla sin avisar; causas largas truncadas y confundidas. |
| **Buenas prácticas** | Una línea de log por causa, nunca por ocurrencia; acotar la memoria de la lista; medir el número de líneas producidas en una ejecución real. |
