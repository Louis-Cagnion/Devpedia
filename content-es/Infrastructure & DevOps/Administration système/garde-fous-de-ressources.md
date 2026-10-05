---
order: 9
---

# Limitar los recursos de un programa

Un programa que consume demasiada **memoria viva** (la **RAM**, donde el ordenador guarda lo que necesitan los programas en ejecución) no se limita a fallar: puede bloquear toda la máquina. Cuando la RAM está llena, el sistema desborda hacia el **swap**, una zona del disco usada como memoria de reserva, cientos de veces más lenta: el ratón va a tirones, la terminal deja de responder. Si incluso el swap se satura, el **núcleo** (el programa central del sistema, que reparte memoria, procesador y disco entre todos los demás) activa su **OOM killer** (*Out Of Memory*, «sin memoria»): mata un proceso para liberar espacio, pero no necesariamente el culpable, a veces toda la sesión gráfica del usuario.

Este capítulo muestra cómo poner **salvaguardas**: límites fijados antes de lanzar un programa, para que sea él quien se detenga al superarlos, nunca la máquina.

## Cuándo hacen falta

| Situación | Por qué consume tanto |
|---|---|
| Programa de prueba con una fuga de memoria o un bucle que reserva sin fin | Nada lo detiene antes de saturar la máquina |
| Prueba de robustez (*fuzzing*: enviar miles de entradas aleatorias o mal formadas) | Una entrada patológica puede hacer explotar la memoria o el tiempo |
| Programa compilado con un detector de errores de memoria ([ASan](https://clang.llvm.org/docs/AddressSanitizer.html), o [valgrind](https://valgrind.org/docs/manual/manual.html)) | Estas herramientas vigilan cada acceso y multiplican la memoria y el tiempo varias veces |
| Tratamiento de un archivo muy grande | El tamaño de la entrada no está controlado |

> **Regla:** todo programa cuyo consumo máximo se desconoce se lanza bajo un límite, incluso «solo para probar».

## Qué recursos limitar

| Recurso | Qué puede salir mal | Herramienta |
|---|---|---|
| Prioridad del procesador | El programa monopoliza la CPU, el resto de la máquina va lento | `nice` |
| Parte del procesador | El programa ocupa varios núcleos de forma permanente | `CPUQuota` (cgroup) |
| Memoria | Se llenan la RAM y luego el swap, la máquina se bloquea | `ulimit -v`, `MemoryMax` y `MemorySwapMax` (cgroup) |
| Disco | Las lecturas y escrituras del programa retrasan a todos los demás | `ionice` |
| Duración | El programa itera indefinidamente | `timeout`, `RuntimeMaxSec` (cgroup) |

## `nice` y `ionice`: pasar después de los demás

Cada [proceso](/?c=langages&s=bash&p=gestion-des-processus) (un programa en ejecución) tiene una **prioridad**: cuando varios quieren el procesador a la vez, el sistema atiende primero a los más prioritarios.

```bash
# nice -n 19: prioridad más baja (la escala va de -20, la más alta, a 19)
# ionice -c3: clase «inactivo» (idle), solo accede al disco si nadie más lo necesita
nice -n 19 ionice -c3 ./mi_programa
```

- `nice` **no limita nada**: el programa puede seguir usando todo el procesador disponible, pero cede el paso en cuanto otro lo necesita.
- Solo `root` (la cuenta de administrador) puede bajar el valor de `nice` por debajo de 0, es decir, dar más prioridad.
- `ionice -c3` solo tiene efecto si el **planificador de disco** (el componente del núcleo que decide en qué orden atender las peticiones de acceso al disco) lo admite, como es el caso de BFQ; si no, la instrucción se ignora sin ningún mensaje.

## `ulimit -v`: un límite por proceso

`ulimit` fija límites al [shell](/?c=langages&s=bash&p=bash) actual (el programa que lee los comandos escritos en la terminal) y a todo lo que lanza. La opción `-v` limita la **memoria virtual** (el espacio de direcciones que el programa puede reservar, aunque no lo haya llenado), en kilobytes.

```bash
# entre paréntesis: copia temporal del shell, el límite no afecta a la terminal en sí
( ulimit -v 200000; ./mi_programa )   # límite de unos 200 MB
```

Más allá, la reserva de memoria falla: en C, [`malloc`](/?c=langages&s=c&p=memoire) devuelve `NULL`, y un programa bien escrito se detiene con un mensaje. Los límites de esta herramienta:

| Límite | Consecuencia |
|---|---|
| Limita el espacio **reservado**, no la memoria realmente usada | Un programa puede fallar habiendo escrito casi nada |
| Se aplica a **cada** proceso por separado | Un programa que lanza diez hijos puede consumir diez veces el límite |
| Incompatible con ASan, que reserva un espacio virtual muy grande | El programa falla nada más arrancar |

## cgroups y `systemd-run`: un límite para todo el grupo

Los **cgroups** (*control groups*) son el mecanismo del núcleo que limita el consumo de un **grupo** de procesos, hijos incluidos: es la pieza que hace funcionar los [contenedores](/?c=infrastructure-devops&s=docker&p=concepts-de-base). No hace falta manejarlos a mano: **systemd**, el programa que arranca y supervisa todo lo que funciona en una máquina Linux moderna, ofrece `systemd-run`, que lanza un comando dentro de un cgroup creado para él.

```bash
# --user  : para la cuenta actual, sin derechos de administrador
# --scope : lanza el comando en un grupo de procesos, en primer plano, en esta terminal
systemd-run --user --scope \
	-p MemoryMax=300M \
	-p MemorySwapMax=0 \
	-p CPUQuota=50% \
	-p RuntimeMaxSec=20 \
	nice -n 19 ionice -c3 \
	./mi_programa > log.txt 2>&1
```

| Opción | Función |
|---|---|
| `MemoryMax=300M` | Límite de RAM de todo el grupo: al superarlo, el núcleo mata el grupo |
| `MemorySwapMax=0` | Prohíbe todo swap: **imprescindible**, sin él el programa desborda hacia el disco en lugar de ser matado, y es la máquina la que va lenta |
| `CPUQuota=50%` | Como máximo medio núcleo (`200%`: dos núcleos) |
| `RuntimeMaxSec=20` | Duración máxima en segundos, y después se detiene |

La última línea redirige la salida del programa a un archivo (`> log.txt`), errores incluidos (`2>&1`, véanse [las redirecciones](/?c=langages&s=bash&p=redirections-et-pipes)). No es un detalle: si la máquina se bloquea o se cierra la sesión a la fuerza, la terminal y su contenido desaparecen, mientras que el archivo permite entender después lo ocurrido.

### Comprobar que el límite se aplica

Un límite que nunca se ha visto activarse es solo una hipótesis. Se prueba con un programa que consume a propósito: reserva 1 MB cada vez (`malloc`) y lo **escribe** (`memset`), porque el sistema solo entrega realmente la RAM al escribir, una simple reserva no la consume.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MO (1024 * 1024)                 // da el nombre MO al valor de un megabyte, en bytes

int main(void)
{
	for (int total = 1; total <= 1000; total++)
	{
		char *bloc = malloc(MO);         // pide 1 MB al sistema
		if (bloc == NULL)                // rechazado: nos detenemos con el código 2
			return 2;
		memset(bloc, 1, MO);             // escribe dentro: la RAM se consume de verdad
		printf("%d Mo\n", total);
		fflush(stdout);                  // muestra al instante, aunque maten el programa
	}
	return 0;
}
```

Lanzado bajo `MemoryMax=300M` y `MemorySwapMax=0`, lo matan antes de los 300 MB, y la máquina no se ralentiza.

## Leer el código de salida

Un programa que termina devuelve un **código de salida** (0 = éxito), que se lee justo después con `echo $?`. Un código superior a 128 significa «matado por una **señal**» (un mensaje que el sistema envía a un proceso, véase [el capítulo sobre los procesos](/?c=langages&s=bash&p=gestion-des-processus)): el número de la señal es el código menos 128.

| Código | Significado | Caso típico |
|---|---|---|
| `0` | Éxito | El programa terminó con normalidad |
| `2` | Elegido por el programa | El ejemplo anterior, se rechazó `malloc` (límite de `ulimit`) |
| `124` | Duración superada | `timeout 60 ./mi_programa` |
| `137` | 128 + 9: señal `SIGKILL` | Límite de memoria superado, o OOM killer |
| `143` | 128 + 15: señal `SIGTERM` | Parada solicitada, por ejemplo al final de `RuntimeMaxSec` |

## Varias pruebas en paralelo

Los límites **se acumulan**: tres pruebas lanzadas a la vez con 3 GB cada una pueden consumir 9 GB en conjunto.

| Paso | Ejemplo para una máquina de 16 GB |
|---|---|
| 1. Reservar lo necesario para que la sesión siga viva (sistema, navegador, editor) | 6 GB |
| 2. Límite global para todo lo que se lanza | 10 GB |
| 3. Número de pruebas × pico de memoria de una prueba (el máximo que usa en un instante) ≤ límite global | 4 pruebas × 2,5 GB = 10 GB |

Una prueba que **mide un tiempo** (comparación de velocidad, duración de una operación) se ejecuta siempre sola, con la máquina en reposo: los programas que se reparten el procesador y el disco falsean el cronómetro. Solo las pruebas que juzgan un resultado (recuento, comparación de salidas) se lanzan juntas.

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una máquina que se bloquea o que usa swap es un fallo: el límite se fija antes de lanzar el programa, para que sea él quien muera. `systemd-run --user --scope -p MemoryMax=… -p MemorySwapMax=0` limita todo el grupo; `nice` y `ionice` no limitan nada, solo reducen la prioridad. |
| **Herramientas utilizables** | `systemd-run`, `nice`, `ionice`, `ulimit -v`, `timeout`, redirección `> log.txt 2>&1`. |
| **Trampas a evitar** | `MemoryMax` sin `MemorySwapMax=0` (el swap hace ir lenta la máquina); `ulimit -v` solo (límite por proceso, e incompatible con ASan); límites cuya suma supera la RAM disponible; salida mostrada solo en la terminal. |
| **Buenas prácticas** | Probar el límite con un programa que consume a propósito; leer el código de salida (137 = matado); dejar varios GB a la sesión; cronometrar en solitario. |
