---
order: 17
---

# El entorno limpio de un shell

Un [shell](/?c=langages&s=bash&p=bash) (el programa que lee tus comandos en una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)) transmite a cada programa que lanza una copia de su **entorno**: el conjunto de sus [variables de entorno](/?c=langages&s=bash&p=variables-denvironnement). Ese entorno viene de tu máquina, con todo lo que contiene: tus ajustes, tus alias, tus carpetas en `$PATH`. Cuando se quiere construir un programa de forma reproducible, o fabricar un sistema Linux a mano (como propone el proyecto [Linux From Scratch](https://www.linuxfromscratch.org/lfs/)), esa herencia es un peligro: la construcción depende entonces, sin que se vea, de la máquina que la lanzó. Este capítulo muestra cómo partir de un entorno vacío y poner solo lo que uno elige.

Supone conocidos `export`, el orden de `$PATH`, `~/.bashrc` frente a `~/.bash_profile` y `source`, vistos en el capítulo sobre las [variables de entorno](/?c=langages&s=bash&p=variables-denvironnement).

> **Vocabulario.** El **anfitrión** es la máquina (o el sistema) que lanza la construcción. Un **proceso** es un programa en ejecución (ver [la gestión de procesos](/?c=langages&s=bash&p=gestion-des-processus)).

## El esquema general

```text
ANFITRIÓN: tu sesión
  entorno rico: PATH, HOME, PS1, alias, decenas de variables
        |
        |  env -i HOME=... TERM=... PS1=... PATH=...   (solo se pasan 4 variables)
        v
ENTORNO VACÍO: nada heredado, salvo lo que se acaba de declarar
        |
        |  /bin/bash   (un shell nuevo, que luego lee sus propios archivos)
        v
CONSTRUCCIÓN: compilar, instalar, con un entorno conocido y completo
```

## `env`: mostrar y fabricar un entorno

`env` es un programa del sistema (viene de [GNU coreutils](https://www.gnu.org/software/coreutils/manual/html_node/env-invocation.html), la colección de herramientas básicas). Sin argumentos, muestra las variables de su entorno. Con `-i` (*ignore environment*), **vacía** el entorno, añade las variables `NOMBRE=valor` indicadas y luego lanza el comando que sigue.

```bash
# cuenta las variables del entorno de un shell normal (una por línea de env)
bash -c 'env | wc -l'
# el mismo recuento, pero el shell se lanza con un entorno vacío
env -i bash -c 'env | wc -l'
```

```text
78
3
```

El primer número depende de tu máquina. Las tres variables restantes no vienen de ti: es el propio Bash quien las crea al arrancar.

```bash
# entorno vacío: env solo muestra las variables indicadas
env -i bash -c 'env'
```

```text
PWD=/tmp
SHLVL=0
_=/usr/bin/env
```

Aquí `PWD` es la carpeta actual, `SHLVL` el nivel de anidamiento de shells y `_` el último programa lanzado. Pasemos ahora una variable propia:

```bash
# declaramos MI_VAR y PATH; HOME no se declara, así que no existe
env -i MI_VAR=hola PATH=/usr/bin:/bin bash -c 'echo "[$MI_VAR] [$HOME]"'
# el comando ls se encuentra gracias al PATH que le hemos dado
env -i MI_VAR=hola PATH=/usr/bin:/bin bash -c 'ls /etc/hostname'
```

```text
[hola] []
/etc/hostname
```

| Comando | Entorno que recibe el programa lanzado |
|---|---|
| `env` | Muestra el entorno actual, no lanza nada más |
| `env VAR=val comando` | El del anfitrión, más `VAR=val` |
| `env -i comando` | Vacío (salvo las tres variables que crea Bash) |
| `env -i VAR=val comando` | Vacío, más únicamente `VAR=val` |

> **Trampa:** sin `HOME`, `TERM`, `PATH` y los demás, muchos programas se comportan de otra manera: `$HOME` está vacía, `~` deja de expandirse, un editor ya no sabe cómo mostrar la terminal. Es intencionado: te toca declarar lo necesario, y solo eso.

## `exec`: reemplazar el shell en lugar de lanzar uno segundo

Normalmente, cuando un script lanza un comando, el shell se queda ahí, espera a que termine el comando y luego lee la línea siguiente. El comando integrado `exec` hace otra cosa: **reemplaza** el proceso del shell por el programa indicado (ver [`fork()` y `execve()`](/?c=langages&s=bash&p=architecture-dun-shell) para el mecanismo). Ya no queda ningún shell detrás: todo lo que sigue a `exec` en el script nunca se lee.

```bash
# $$ es el número (PID) del proceso del shell actual
# exec reemplaza este shell por otro bash: el número no cambia
bash -c 'echo "antes: $$"; exec bash -c "echo \"después: \$\$\""'
```

```text
antes: 59235
después: 59235
```

El número es el mismo antes y después: no hubo un segundo proceso, el primero cambió de programa. Los números mostrados cambian en cada ejecución; solo importa que sean iguales.

```bash
#!/bin/bash
# lanzador.sh: un script que copia una línea del libro sin entender exec
echo "inicio del lanzador"
# exec reemplaza el script por un bash limpio: el script deja de existir después de esta línea
exec env -i HOME=/tmp TERM=xterm /bin/bash -c 'echo "en el bash limpio"'
echo "esta línea nunca se muestra"
```

```bash
# ejecuta el script
bash lanzador.sh
```

```text
inicio del lanzador
en el bash limpio
```

La última línea del script ha desaparecido con él. La trampa se presentó en la práctica: una línea `exec env -i ...` copiada de un libro a un lanzador, y todo lo que venía después (la propia construcción) se ignoraba sin el menor mensaje de error.

| Escritura | Lo que ocurre después |
|---|---|
| `env -i ... bash` | Se lanza un segundo shell; el primero espera a que termine y luego continúa |
| `exec env -i ... bash` | El primer shell es reemplazado; nada continúa después |
| `(exec comando)` | El reemplazo solo ocurre en el [subshell](/?c=langages&s=bash&p=architecture-dun-shell) entre paréntesis; el script continúa |

> **Nota:** `exec` está, por tanto, en su sitio al **final** de un lanzador, o en un archivo de arranque cuyo único papel es ceder el control a otro shell. En otro lugar, olvidar lo que hace sale caro.

## ¿Qué archivos lee un shell al arrancar?

El capítulo sobre las [variables de entorno](/?c=langages&s=bash&p=variables-denvironnement) opone `~/.bashrc` y `~/.bash_profile`. Esta es la regla exacta, según el manual de [GNU Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html):

- Un **shell de conexión** (*login shell*) es el que se obtiene al iniciar sesión. Bash lo es cuando se lanza con `--login` (o `-l`), o cuando su nombre va precedido de un guion.
- Un shell **interactivo** es un shell que espera comandos escritos a mano (por oposición a un script).

| Tipo de shell | Archivos leídos |
|---|---|
| Conexión | `/etc/profile`, y luego el primero que se encuentre entre `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| Interactivo, sin conexión | `~/.bashrc` (y, en Debian y Ubuntu, `/etc/bash.bashrc` antes que él) |
| Ninguno de los dos (script, `bash -c`) | Ningún archivo de arranque |

Demostración con una carpeta personal de prueba, para no tocar la tuya:

```bash
# crea una falsa carpeta personal
mkdir -p /tmp/prueba-home
# un archivo leído por un shell de conexión: define una variable
echo 'export DESDE_PROFILE=si' > /tmp/prueba-home/.bash_profile
# un archivo leído por un shell interactivo: define otra variable
echo 'export DESDE_BASHRC=si' > /tmp/prueba-home/.bashrc

# -l pide un shell de conexión: se lee .bash_profile
env -i HOME=/tmp/prueba-home bash -l -c 'echo "conexión: [$DESDE_PROFILE]"'
# sin -l: no se lee ningún archivo
env -i HOME=/tmp/prueba-home bash -c 'echo "sin conexión: [$DESDE_PROFILE]"'
# -i pide un shell interactivo: se lee .bashrc
env -i HOME=/tmp/prueba-home bash -i -c 'echo "interactivo: [$DESDE_BASHRC]"'
```

```text
conexión: [si]
sin conexión: []
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

interactivo: [si]
```

Las dos líneas en inglés no vienen de tu archivo: vienen de un archivo del anfitrión, lo que explica la sección siguiente.

### `su - NOMBRE` frente a `su NOMBRE`

`su` (*substitute user*) abre un shell con la identidad de otro usuario. Esta parte se describe según el manual de `su` (`man su`): no se ha ejecutado aquí, porque `su` pide una contraseña.

| Comando | Naturaleza del shell obtenido | Efecto |
|---|---|---|
| `su - NOMBRE` (con el guion, o `-l`) | Shell de conexión | Borra casi todo el entorno (salvo `TERM`), recrea `HOME`, `SHELL`, `USER`, `LOGNAME` y `PATH`, se sitúa en la carpeta personal de `NOMBRE` y luego lee `~/.bash_profile` |
| `su NOMBRE` (sin guion) | Shell interactivo, sin conexión | Conserva lo esencial del entorno del que lo llama, no lee `~/.bash_profile` (lee `~/.bashrc`) |

Un archivo `~/.bash_profile` que solo cede el control a un shell limpio es la forma clásica de garantizar un entorno controlado desde la conexión:

```bash
# ~/.bash_profile: reemplaza el shell de conexión por un bash con el entorno mínimo
# TERM describe el tipo de terminal, PS1 es el texto mostrado antes de cada comando
exec env -i HOME=$HOME TERM=$TERM PS1='\u:\w\$ ' PATH=/usr/bin:/bin /bin/bash
```

El `bash` así lanzado es interactivo, sin conexión: por tanto lee `~/.bashrc`, y es en ese archivo donde se pone el resto de la configuración (variables propias del proyecto, alias). Aquí `exec` está en su sitio: el shell de conexión ya no tiene nada que hacer y desaparece.

## Cuando el anfitrión se cuela a pesar de `env -i`

En la demostración anterior, apareció un mensaje sobre `sudo` aunque el entorno estaba vacío: un archivo del anfitrión, `/etc/bash.bashrc`, lo lee cualquier shell interactivo en Debian y Ubuntu, incluso antes que `~/.bashrc`. Además, puede **cambiar `PS1`**, la variable que contiene el texto mostrado antes de cada comando (el *prompt*), aunque la hayamos transmitido correctamente:

```bash
# transmitimos PS1='$ ' a un shell interactivo lanzado con un entorno vacío
env -i HOME=/nonexistent PS1='$ ' bash -i -c 'echo "[$PS1]"'
# lo mismo, pero --norc impide la lectura de los archivos de arranque del anfitrión
env -i HOME=/nonexistent PS1='$ ' bash --norc -i -c 'echo "[$PS1]"'
```

```text
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

[${debian_chroot:+($debian_chroot)}\u@\h:\w\$ ]
[$ ]
```

El primer shell ha reemplazado `PS1='$ '` por el valor definido en el `/etc/bash.bashrc` del anfitrión; el segundo, con `--norc`, lo ha conservado. El método de comprobación es siempre el mismo:

| Paso | Comando | Lo que se busca |
|---|---|---|
| 1. Anotar lo que se ha transmitido | La línea `env -i ...` en sí | La lista exacta de variables declaradas |
| 2. Mostrar lo que ve el shell | `env` en el nuevo shell | Una variable distinta o una más |
| 3. Identificar la fuente | `grep -n PS1 /etc/bash.bashrc` (por ejemplo) | El archivo del anfitrión que la ha cambiado |
| 4. Descartar el archivo | `bash --norc`, o no lanzar un shell interactivo | Un entorno igual al que se ha transmitido |

## `export`: hacer visible, no dar un valor

`export` no fija un valor: marca una variable ya existente como **para transmitir** a los programas lanzados después. El valor se escribe en otro lugar (una asignación `NOMBRE=valor`, o la línea `env -i NOMBRE=valor`). Esto es lo que separa una variable de shell de una variable de entorno:

```bash
# VAL es una simple variable de shell: todavía no está en el entorno
VAL=1
# un shell hijo lanzado ahora no la ve: los corchetes quedan vacíos
bash -c 'echo "hijo sin export: [$VAL]"'
# export marca VAL como para transmitir a los programas lanzados después
export VAL
# el mismo hijo la recibe ahora
bash -c 'echo "hijo con export: [$VAL]"'
# quita la variable para no dejar nada en esta terminal
unset VAL
```

```text
hijo sin export: []
hijo con export: [1]
```

Con `env -i` no hace falta `export`: una variable dada a `env` forma parte del entorno del programa lanzado, por construcción.

## Limitar el paralelismo de `make` con `MAKEFLAGS`

`make` ([ver los Makefiles](/?c=langages&s=c&p=makefiles)) lee su variable de entorno `MAKEFLAGS` como si su contenido estuviera escrito en la línea de comandos. La opción `-jN` le permite lanzar N tareas de compilación a la vez, lo que acelera mucho la construcción. `nproc` muestra el número de núcleos de cálculo (procesadores) disponibles: es un valor razonable para N.

```bash
# muestra el número de núcleos de la máquina
nproc
# un Makefile mínimo de prueba: una regla que muestra el valor de MAKEFLAGS
printf 'todo:\n\t@echo "MAKEFLAGS vale: $(MAKEFLAGS)"\n' > /tmp/Makefile.prueba
# -j seguido del número de núcleos, pasado por el entorno
MAKEFLAGS=-j$(nproc) make -f /tmp/Makefile.prueba
# -j sin número: make lanza tantas tareas como haya listas
make -j -f /tmp/Makefile.prueba
```

```text
16
MAKEFLAGS vale:  -j16 --jobserver-auth=3,4
MAKEFLAGS vale:  -j
```

El número `16` es el de la máquina de prueba. En el primer caso, `make` ha completado la variable con un detalle interno (`--jobserver-auth`) que sirve para coordinar sus subprocesos: solo `-j16` es tuyo.

| Ajuste | Efecto |
|---|---|
| `MAKEFLAGS=-j$(nproc)` | Como máximo tantas tareas como núcleos |
| `MAKEFLAGS=-j4` | Como máximo 4 tareas, por ejemplo para que la máquina siga siendo utilizable |
| `-j` sin número | **Ningún límite**: en un proyecto grande, cientos de compiladores arrancan a la vez y pueden saturar la memoria y el procesador |

## El principio de aislamiento

Todo este capítulo aplica una misma idea: **partir de un estado vacío y poner allí solo lo que se declara**. El resultado ya no depende de lo que la máquina contenga por casualidad; así que se puede rehacer en otro sitio, o más tarde, y obtener lo mismo.

| Herramienta | Lo que vacía | Lo que se declara |
|---|---|---|
| `env -i` | Las variables de entorno | Los `NOMBRE=valor` dados a `env` |
| Un [contenedor Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) | El sistema de archivos y los procesos visibles | Una imagen, variables, volúmenes |
| Un [entorno virtual Python](/?c=langages&s=python&p=modules-et-environnements) (`venv`) | Las bibliotecas instaladas para este proyecto | Las dependencias instaladas en esta carpeta |

Cada herramienta aísla a su escala: `env -i` solo el entorno de un proceso, `venv` solo las bibliotecas de Python, el contenedor mucho más. Ninguna es una protección frente a un programa hostil: producen un resultado **reproducible**, no inviolable.

### La relación con el mínimo privilegio

El [principio de mínimo privilegio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) dice que un componente solo recibe los derechos que necesita. El aislamiento por entorno vacío es su complemento: protege en el otro sentido.

| Medida | Lo que protege | Contra qué |
|---|---|---|
| Construir con un usuario normal (ver [los permisos](/?c=langages&s=bash&p=permissions-et-fichiers)) | El **anfitrión** | De un error de la construcción (un comando que sobrescribe archivos del sistema, un `rm` mal apuntado) |
| Construir con un entorno vacío | La **construcción** | Del anfitrión (variables, alias, archivos de arranque que cambian el resultado sin que se note) |

Ambas medidas se combinan: un usuario normal en un entorno vacío solo puede dañar su propia carpeta, y depende únicamente de lo que se le ha dado.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| `exec` seguido de otras líneas en un script | `exec` reemplaza el script: todo lo que sigue se ignora, sin error. Reservarlo para la última línea |
| `env -i` sin `PATH`, `HOME`, `TERM` | El shell toma un `PATH` por defecto, pero `HOME` está vacía y `TERM` ausente: programas que fallan o se muestran mal |
| Pensar que `env -i` basta para aislar | Un shell interactivo vuelve a leer los archivos del anfitrión (`/etc/bash.bashrc`, `~/.bashrc`): `PS1` u otras variables cambian. Comparar `env` con lo que se ha transmitido |
| `su NOMBRE` en lugar de `su - NOMBRE` | No hay shell de conexión: no se lee `~/.bash_profile` y se conserva el entorno del que llama |
| Escribir `export` pensando en dar un valor | `export` solo hace visible una variable existente; el valor viene de una asignación |
| `MAKEFLAGS=-j` sin número | Paralelismo ilimitado: memoria y procesador saturados |

## Buenas prácticas

| Práctica | Por qué |
|---|---|
| Lanzar la construcción con `env -i` y la lista completa de variables necesarias, escrita en un solo archivo | Es legible, reproducible y se verifica de un vistazo |
| Poner `exec env -i ... /bin/bash` en `~/.bash_profile`, nunca en medio de un script | El reemplazo del shell ocurre en el lugar correcto |
| Mostrar `env` en el nuevo shell y compararlo con la lista transmitida | Detecta la variable añadida por un archivo del anfitrión |
| Descartar el archivo culpable (`--norc`, o moverlo) en lugar de corregir la variable después | La causa desaparece, en lugar de quedar oculta |
| Ajustar `MAKEFLAGS=-j$(nproc)` | Rápido sin saturar la máquina |
| Combinar usuario normal y entorno vacío | El anfitrión queda protegido de la construcción, y la construcción del anfitrión |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un programa hereda el entorno del shell que lo lanzó. `env -i NOMBRE=valor comando` lo sustituye por un entorno vacío más lo que se declara. `exec` reemplaza el shell en lugar de lanzar un segundo: nada se ejecuta después de él. Un shell de conexión lee `~/.bash_profile`, un shell interactivo sin conexión lee `~/.bashrc`. |
| **Herramientas utilizables** | `env`, `env -i`, `exec`, `bash -l`, `bash --norc`, `su -`, `export`, `nproc`, `MAKEFLAGS`. |
| **Trampas a evitar** | `exec` en medio de un script; pensar que un entorno vacío es hermético aunque `/etc/bash.bashrc` se vuelva a leer; `-j` sin número. |
| **Buenas prácticas** | Partir de un estado vacío y declarar lo que se quiere, como con `env -i`, un contenedor o `venv`; verificar el resultado con `env`; combinar con un usuario normal. |
