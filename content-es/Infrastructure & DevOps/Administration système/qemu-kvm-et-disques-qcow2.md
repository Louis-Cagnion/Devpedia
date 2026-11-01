---
order: 11
---

# QEMU, KVM y discos qcow2 (31/10/2026)

El capítulo [Virtualización y elección de SO](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) presenta los hipervisores (los programas que crean y ejecutan **máquinas virtuales**, o VM: ordenadores simulados por un programa, con su procesador, su memoria y sus discos; véase [los conceptos básicos de Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) para compararlos con los contenedores) con ventanas, que se manejan con el ratón. Este capítulo hace lo mismo en **línea de comandos** (se maneja un programa escribiendo comandos en lugar de hacer clic en menús), con la herramienta más extendida en Linux: [**QEMU**](https://www.qemu.org/). Explica también qué es un disco virtual, cómo tomar **instantáneas** (*snapshots*: fotos del estado de una máquina) y por qué una instantánea no es una copia de seguridad.

El ordenador real que ejecuta la VM se llama el **anfitrión**; el sistema que funciona **dentro** de la VM se llama el **invitado** (*guest*). La palabra «anfitrión» tiene un segundo sentido, explicado en la sección [Los dos sentidos de la palabra «anfitrión»](#los-dos-sentidos-de-la-palabra-anfitrion).

Todos los comandos se escriben en [una terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Las salidas copiadas más abajo se obtuvieron en una máquina Linux real, con QEMU instalado desde los paquetes (los programas empaquetados) de la distribución (la variante de Linux utilizada, véase [Virtualización y elección de SO](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos)).

> **Analogía:** un actor que interpreta el papel de un ordenador. **El actor** (QEMU) interpreta la máquina virtual: sin ayuda, tiene que imitarlo todo con accesorios; es fiel, pero lento. **El hardware real que le presta KVM** le permite hacer los gestos principales de verdad, y así va mucho más rápido. El **álbum de fotos** (las instantáneas) permite volver al estado de la máquina antes del último ajuste fallido.

## QEMU y KVM: quién hace qué

Los dos nombres designan dos piezas distintas, que suelen citarse juntas.

| | QEMU | KVM |
|---|---|---|
| Nombre completo | *Quick EMUlator* | [*Kernel-based Virtual Machine*](https://www.linux-kvm.org/) |
| Naturaleza | Un programa corriente, lanzado por el usuario | Una función del **núcleo** Linux (el programa central que gestiona el hardware, véase [Los componentes de un ordenador y su arranque](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) |
| Función | **Simula la máquina**: discos, pantalla, teclado, red, placa base | **Acelera** la simulación dejando que el procesador real ejecute el código del invitado |
| Sin la otra | Funciona, pero lentamente: imita el procesador por software | No sirve de nada sola: es QEMU quien la usa |
| Archivo o programa | `qemu-system-x86_64` | el archivo especial `/dev/kvm` |

El programa `qemu-system-x86_64` simula un ordenador de la familia x86 de 64 bits (los procesadores de Intel y de AMD; véase [El procesador](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#el-procesador)). Hay un programa por familia de procesadores (`qemu-system-aarch64` para los procesadores ARM, los de los teléfonos y de muchos Mac recientes, por ejemplo).

El archivo `/dev/kvm` es un «archivo especial»: no contiene ningún dato, es una puerta de entrada a KVM que los programas abren para comunicarse con ella (el directorio `/dev` agrupa estas puertas hacia el hardware y el núcleo).

Sin KVM, QEMU funciona en modo **tcg** (*Tiny Code Generator*, el traductor por software de QEMU). Es la **emulación**: imitar un hardware ejecutándolo por software, instrucción por instrucción (una **instrucción** es una orden elemental que ejecuta el procesador, como sumar dos números). Fiel, pero lento.

```text
Sin KVM (modo tcg, emulación por software)

 invitado ──► QEMU traduce cada instrucción ──► procesador real
              (lento: un trabajo de traducción en cada paso)

Con KVM

 invitado ──► el procesador real ejecuta directamente el código del invitado
              QEMU solo se ocupa del resto: discos, pantalla, red
              (rápido: casi la velocidad de una máquina real)
```

### Saber si KVM está disponible

```bash
# grep busca un patrón en un archivo; -c muestra el número de líneas encontradas
# en lugar de las líneas; -E permite el «o» (|) en el patrón; /proc/cpuinfo es un
# archivo virtual (el núcleo expone ahí la descripción del procesador, nada se guarda
# en el disco); vmx (Intel) o svm (AMD) anuncian la virtualización, una línea por núcleo
grep -c -E 'vmx|svm' /proc/cpuinfo
ls -l /dev/kvm                            # -l: lista detallada; ¿está KVM presente?
# [ -w archivo ]: verdadero si tengo derecho a escribir en él; && : el comando siguiente
# solo se ejecuta si el anterior ha tenido éxito; || : solo si ha fallado
[ -w /dev/kvm ] && echo sí || echo no
```

Estos comandos se detallan en [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base) y [las condiciones](/?c=langages&s=bash&p=conditions).

Salidas obtenidas:

```text
16
crw-rw----+ 1 root kvm 10, 232 oct.  31 20:27 /dev/kvm
sí
```

Lectura de la línea `crw-rw----+ 1 root kvm 10, 232 ...`: la `c` indica un archivo especial; `rw-rw----` da los permisos (lectura y escritura para el propietario, lectura y escritura para el grupo, nada para los demás; véase [los permisos](/?c=langages&s=bash&p=permissions-et-fichiers)); `root kvm` son el propietario y el grupo; `10, 232` son números internos del núcleo, sin importancia aquí.

| Constatación | Significado | Qué hacer |
|---|---|---|
| El primer número es `0` (ninguna línea) | El procesador no anuncia virtualización, o está desactivada en la configuración de la placa base (el firmware, véase [BIOS y UEFI](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | Sin KVM: usar `-accel tcg` |
| `/dev/kvm` no existe | El módulo KVM (una parte del núcleo que se carga cuando hace falta) no está cargado, o la máquina es ella misma una VM que no expone la virtualización | Lo mismo |
| `/dev/kvm` existe pero `no` | El archivo pertenece al grupo `kvm` (véase [los permisos](/?c=langages&s=bash&p=permissions-et-fichiers)) y el usuario no forma parte de él | Pedir al administrador que añada al usuario al grupo `kvm`, y luego cerrar la sesión y volver a entrar (los grupos solo se releen al iniciar sesión) |
| `/dev/kvm` existe y `sí` | KVM es utilizable | `-accel kvm` |

El `+` al final de `crw-rw----+` indica una regla de acceso adicional (una **ACL**, *Access Control List*: una lista de derechos concedidos a usuarios nombrados; véase [la página de manual de acl](https://man7.org/linux/man-pages/man5/acl.5.html)): en la máquina de prueba, un usuario está autorizado por su nombre, sin estar en el grupo `kvm`. La prueba `[ -w /dev/kvm ]` es, pues, más fiable que la lectura de las letras.

> **Trampa:** escribir `-accel kvm` en una máquina sin KVM utilizable hace fallar el lanzamiento (comportamiento esperado, no reproducido aquí por falta de una máquina sin KVM). Para un script que deba funcionar en cualquier parte, probar primero `/dev/kvm` y elegir `kvm` o `tcg` en consecuencia.

## Lanzar una máquina virtual

Hay que instalar dos herramientas. En [Debian](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) y [Ubuntu](https://www.ubuntu.com/) (dos distribuciones de Linux; véase [el endurecimiento de sudo](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) para `sudo`), `qemu-system-x86` proporciona el programa `qemu-system-x86_64`, y `qemu-utils` proporciona `qemu-img` (la herramienta que fabrica y manipula los discos, que veremos más abajo):

```bash
# sudo: ejecuta la orden con los derechos de administrador
# apt install: instala paquetes (programas empaquetados) en Debian y Ubuntu
# (véase https://wiki.debian.org/Apt)
sudo apt install qemu-system-x86 qemu-utils
```

Antes de lanzar la máquina hace falta un disco vacío para el invitado y la ISO de instalación (una **ISO** es un archivo que contiene la imagen exacta de un CD o de un DVD de instalación). La ISO de Debian se descarga de [la página oficial](https://www.debian.org/distrib/); aquí se renombra como `debian.iso`. El disco se crea así (el formato qcow2 se explica en [El disco virtual](#el-disco-virtual-el-formato-qcow2)):

```bash
# crea un disco virtual: -f = formato, luego el nombre del archivo y luego el tamaño
# (20G = 20 GiB)
qemu-img create -f qcow2 debian-rescate.qcow2 20G
```

Un comando de lanzamiento completo, para instalar el sistema desde la ISO:

```bash
# Una línea por opción; la «\» al final de la línea continúa el comando en la siguiente
qemu-system-x86_64 \
  -accel kvm \
  -m 2G \
  -smp 2 \
  -drive file=debian-rescate.qcow2,format=qcow2 \
  -cdrom debian.iso \
  -boot order=cd
```

| Opción | Función | Observación |
|---|---|---|
| `-accel kvm` | Usar KVM para la velocidad | `-accel tcg` para la emulación solo por software; `-enable-kvm` es un atajo equivalente a `-accel kvm` |
| `-m 2G` | **Memoria** (la RAM, véase [la RAM](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) dada al invitado | `128M` para 128 MiB, `2G` para 2 GiB (véase [contar la información](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#contar-la-informacion-bit-byte-gb-y-gib)); esta memoria se toma de la del anfitrión |
| `-smp 2` | Número de **núcleos** de procesador (unidades de cálculo independientes) ofrecidos al invitado | No superar el número de núcleos del anfitrión (QEMU lo acepta, pero la VM se ralentiza) |
| `-drive file=...,format=...` | Conectar un disco duro virtual, guardado en un archivo del anfitrión | Indicar siempre `format=` (véase la sección sobre los formatos) |
| `-cdrom debian.iso` | Conectar una **unidad de CD** virtual que contiene la ISO | El invitado cree tener un CD real insertado |
| `-boot order=cd` | **Orden de prueba al arrancar**: una letra por tipo de soporte | `c` = primer disco duro, `d` = unidad de CD: aquí, primero el disco y luego el CD |

Aparece entonces una ventana: es la pantalla de la máquina virtual. Sin otra opción, es ahí donde ocurre la instalación. Dos precauciones: en cuanto se hace clic en la ventana, esta «captura» el ratón (el puntero ya no sale); para liberarlo, `Ctrl+Alt+G` (o `Ctrl+Alt` según la pantalla). Y cerrar la ventana corta la VM bruscamente, como una desconexión: véase [Apagar limpiamente antes de la instantánea](#apagar-limpiamente-antes-de-la-instantanea).

### El orden de arranque: por qué «disco y luego CD»

Al arrancar, el firmware de la máquina (la BIOS, véase [Los componentes de un ordenador y su arranque](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) prueba cada soporte en orden y toma el primero que contiene un programa de arranque.

| Etapa | Disco | CD | Qué pasa |
|---|---|---|---|
| Primera instalación | vacío | ISO de instalación | El disco está vacío, el firmware pasa al CD: arranca el instalador |
| El sistema está instalado | contiene el sistema | ISO todavía conectada | El disco arranca primero: arranca el sistema instalado |
| Si el orden fuera `dc` | contiene el sistema | ISO todavía conectada | El CD iría primero: se volvería al instalador en cada arranque |

Es lo que hace práctico el orden `cd`: basta con mantener el mismo comando antes y después de la instalación, sin volver nunca al instalador por error. Y es posible quitar `-cdrom` y `-boot` una vez terminada la instalación.

### Comprobar el orden sin descargar una distribución

No se ha descargado ninguna distribución para este capítulo. Para ver el orden en acción, se han fabricado dos soportes diminutos (no se proporcionan: esta sección es una demostración, no un ejercicio que repetir): un disco cuyo primer sector (la primera zona de 512 bytes, que el firmware lee para arrancar; véase [el firmware](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#el-firmware-bios-y-uefi)) es un programa que escribe «ARRANQUE DESDE EL DISCO» en el puerto serie, y una ISO que contiene el mismo tipo de programa con el mensaje «ARRANQUE DESDE EL CD». El comando `timeout` (véase [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) detiene un programa al cabo de un plazo. El **puerto serie** es una salida de texto simple de la máquina virtual; la opción `-nographic` la conecta a la terminal, en lugar de abrir una ventana.

```bash
# timeout 20: detiene el comando al cabo de 20 segundos
# (el programa de prueba nunca se detiene solo)
# -nographic: sin ventana, la consola de la VM se muestra en esta terminal
# -nic none: ninguna tarjeta de red, para una salida más corta
timeout 20 qemu-system-x86_64 -accel kvm -m 128M -smp 2 -nographic -nic none \
  -drive file=debian-rescate.qcow2,format=qcow2 -cdrom cd.iso -boot order=cd
```

Con un disco `debian-rescate.qcow2` vacío (el caso de una primera instalación), la salida empieza por la versión de [SeaBIOS](https://www.seabios.org/), el firmware que QEMU proporciona a la máquina:

```text
SeaBIOS (version 1.16.3-debian-1.16.3-2)
Booting from Hard Disk...
Boot failed: not a bootable disk
Booting from DVD/CD..ARRANQUE DESDE EL CD
```

Se prueba primero el disco (`Hard Disk`), se rechaza por estar vacío (`not a bootable disk`) y luego arranca el CD. Mismo comando con un disco que contiene un programa de arranque:

| Comando | Línea que aparece |
|---|---|
| disco arrancable, `-boot order=cd` | `Booting from Hard Disk..ARRANQUE DESDE EL DISCO` |
| disco arrancable, `-boot order=dc` | `Booting from DVD/CD..ARRANQUE DESDE EL CD` |
| disco vacío y sin ISO | `Booting from Hard Disk...` y luego `Boot failed: not a bootable disk`, los demás soportes también fallan, y `No bootable device.` |

Esta última línea es el mensaje que hay que reconocer: no significa que QEMU esté roto, sino que ningún soporte tiene un programa de arranque (olvido de `-cdrom`, ISO mal nombrada, orden `-boot` invertido).

> **Trampa:** en una VM lanzada con `-nographic`, el teclado de la terminal se transmite al invitado, y `Ctrl+C` puede no detener QEMU. La secuencia de salida documentada es `Ctrl+A` y luego `X`. De ahí el interés de `timeout` para las pruebas.

## Los dos sentidos de la palabra «anfitrión»

La palabra aparece con dos sentidos, y confundirlos hace perder tiempo. El libro [*Linux From Scratch*](https://www.linuxfromscratch.org/lfs/) (una guía que enseña a fabricar un Linux completo a partir de sus **fuentes**, es decir, del código escrito por los desarrolladores, sin distribución ya hecha; véase [Crear un sistema operativo](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation)) lo emplea en un sentido, y la virtualización en otro.

| | Anfitrión de **virtualización** | Anfitrión de **construcción** |
|---|---|---|
| Pregunta a la que responde | ¿En qué máquina funciona la VM? | ¿Con qué Linux se fabrica el nuevo Linux? |
| Es | El ordenador real (o el sistema real) que lanza QEMU | Un Linux **ya instalado**, cuyo compilador (el programa que traduce el código fuente en un programa ejecutable) y herramientas se toman prestados para fabricar otro |
| Su contrario | El **invitado** | El **sistema destino** (el que se fabrica) |
| ¿Puede estar dentro de una VM? | No: es la capa de abajo | Sí: suele ser un Linux instalado **dentro** de la VM |

Los dos pueden superponerse en el mismo montaje, de ahí la confusión. En el esquema, un **proceso** es un programa en ejecución (véase [la gestión de procesos](/?c=langages&s=bash&p=gestion-des-processus)): aquí, QEMU en marcha. Ejemplo con nombres inventados: se instala un Debian de rescate dentro de la VM, en un archivo `debian-rescate.qcow2`. Este Debian es, para el libro, el «anfitrión» (de construcción): sirve para fabricar el nuevo sistema en un segundo disco, `sistema-destino.qcow2`. Pero para QEMU, ese mismo Debian es el **invitado**.

```text
┌───────────────────────────────────────────────────────────┐
│  ORDENADOR REAL = anfitrión de virtualización             │
│  (guarda los tres archivos en su disco)                   │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  proceso qemu-system-x86_64 (+ KVM)                 │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │  MÁQUINA VIRTUAL = invitado                   │  │  │
│  │  │  disco 1 ◄── debian-rescate.qcow2             │  │  │
│  │  │     contiene un Linux instalado:              │  │  │
│  │  │     es el anfitrión de construcción           │  │  │
│  │  │  disco 2 ◄── sistema-destino.qcow2            │  │  │
│  │  │     recibe el nuevo sistema en fabricación    │  │  │
│  │  │  lector de CD ◄── debian.iso (si hace falta)  │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

> **Trampa:** un archivo llamado `anfitrion.qcow2` no dice de qué anfitrión se trata, y la confusión es real (el nombre empuja a leer «el anfitrión de construcción» como «el anfitrión de virtualización»). Nombrar los discos por su **contenido** y su función: `debian-rescate.qcow2`, `sistema-destino.qcow2`.
>
> **Buena práctica:** cuando se lee «el anfitrión» en una documentación, preguntarse primero «¿de qué es anfitrión?»: de la máquina virtual, o de la construcción de un sistema.

Para la fabricación de un sistema desde cero, véase [Crear un sistema operativo, paso a paso](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation); para dividir el segundo disco, véase [Particionamiento y LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm).

## El disco virtual: el formato qcow2

Una VM necesita un disco duro. En lugar de un disco real, QEMU usa un **archivo** del anfitrión, que presenta al invitado como un disco: el invitado escribe en él como en un disco corriente, y cada escritura se registra en el archivo. Dos formatos habituales:

| | `raw` | `qcow2` |
|---|---|---|
| Principio | Una copia byte a byte del disco | Un formato de QEMU (*QEMU Copy On Write*, versión 2) que solo guarda lo que se ha escrito |
| Tamaño del archivo | `ls -l` indica siempre el tamaño completo del disco virtual; el espacio realmente ocupado (medido con `du`) puede ser menor si el sistema de archivos del anfitrión no guarda las zonas vacías (archivo *disperso*) | Muy pequeño al principio, **crece** con el uso |
| Instantáneas | No, en el archivo | Sí, en el archivo |
| Caso de uso | Rendimiento bruto, intercambio con otras herramientas | La elección habitual para las VM de trabajo |

Los comandos de creación y lectura vienen de `qemu-img`.

```bash
# crea un disco virtual: -f = formato, luego el nombre del archivo, luego el tamaño
qemu-img create -f qcow2 disco.qcow2 64M
qemu-img info disco.qcow2                  # muestra las características del archivo
# du: espacio real ocupado en el anfitrión; -h: tamaños legibles (K, M, G)
du -h disco.qcow2
```

Salidas obtenidas (la línea `Formatting` está abreviada, y solo se conservan las líneas útiles de `info`):

```text
Formatting 'disco.qcow2', fmt=qcow2 cluster_size=65536 ... size=67108864 ...
image: disco.qcow2
file format: qcow2
virtual size: 64 MiB (67108864 bytes)
disk size: 196 KiB
cluster_size: 65536
196K	disco.qcow2
```

| Línea | Significado |
|---|---|
| `virtual size: 64 MiB` | El tamaño **visto por el invitado**: cree tener un disco de 64 MiB (MiB = mebibyte, 1 048 576 bytes, véase [contar la información](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#contar-la-informacion-bit-byte-gb-y-gib)) |
| `disk size: 196 KiB` | Lo que el archivo ocupa **realmente** en el anfitrión, porque todavía no se ha escrito nada |
| `cluster_size: 65536` | El disco está dividido en bloques de 64 KiB; solo los bloques escritos existen en el archivo |

El disco de 64 MiB ocupa 196 KiB: es la propiedad que hace económicos los discos `qcow2`. Tiene una contrapartida: si el disco del anfitrión se llena, un disco virtual que sigue creciendo puede fallar al escribir, mientras el invitado cree que aún tiene espacio. El tamaño que se pide es, pues, un **techo**, no una reserva.

> **Trampa:** olvidar `-f qcow2` al crear, o `format=qcow2` al lanzar. Sin `-f qcow2`, `qemu-img create` fabrica un disco **raw** (y, por tanto, sin instantáneas). Al lanzar, sin `format=`, QEMU adivina el formato; para un archivo raw avisa (`Image format was not specified ... probing guessed raw`) y prohíbe escribir en el bloque 0 (el principio del disco, donde está el sector de arranque). Indicar el formato explícitamente en todas partes.

## Las instantáneas

Una **instantánea** (*snapshot*) es una foto del estado de un disco en un momento dado, a la que se puede volver. Antes de una manipulación arriesgada (particionar, compilar un sistema, borrar archivos), se toma una instantánea: si el resultado es malo, se vuelve a la foto en unos segundos en lugar de empezar de nuevo.

### Cómo funciona, en breve

Un archivo `qcow2` se escribe por bloques. Al tomar una instantánea, QEMU **congela** los bloques existentes. Una escritura posterior no modifica un bloque congelado: escribe una **copia nueva** en otro lugar del archivo (se llama «copia al escribir», *copy on write*, de ahí el nombre del formato). Volver a la instantánea es volver a apuntar a los bloques congelados.

```text
Antes de la instantánea      Después de la instantánea y de una escritura

 bloque A  bloque B           bloque A  bloque B  bloque B'
    │         │                 │         │         ▲
    │         │                 │         │         └─ nuevo valor de B (escrito después)
    └─────────┘                 └─────────┘
 estado actual                  la instantánea conserva A y B;
                                el estado actual usa A y B'
```

Medido en consecuencia: el archivo **crece** con las instantáneas y las escrituras, ya que los bloques antiguos se conservan.

### Los cuatro comandos

| Comando | Función |
|---|---|
| `qemu-img snapshot -c NOMBRE disco.qcow2` | **c**rear una instantánea del estado actual, llamada `NOMBRE` |
| `qemu-img snapshot -l disco.qcow2` | **l**istar las instantáneas del archivo |
| `qemu-img snapshot -a NOMBRE disco.qcow2` | **a**plicar la instantánea: el disco vuelve a ese estado, y las modificaciones hechas desde entonces se pierden |
| `qemu-img snapshot -d NOMBRE disco.qcow2` | **d**estruir la instantánea (el disco conserva su estado actual) |

El ciclo completo, sobre el disco `disco.qcow2` creado antes:

```bash
qemu-img snapshot -l disco.qcow2                 # lista: disco nuevo, ninguna instantánea
qemu-img snapshot -c antes-prueba disco.qcow2    # crea la instantánea «antes-prueba»
qemu-img snapshot -l disco.qcow2                 # lista: aparece la instantánea
qemu-img snapshot -a antes-prueba disco.qcow2    # vuelve al estado «antes-prueba»
qemu-img snapshot -d antes-prueba disco.qcow2    # destruye la instantánea
qemu-img snapshot -l disco.qcow2                 # lista: de nuevo vacía
```

Salida obtenida para la segunda lista, la única que muestra algo (los demás comandos no escriben nada cuando tienen éxito):

```text
Snapshot list:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
1         antes-prueba          0 B 2026-10-31 21:18:25 00:00:00.000          0
```

| Columna | Significado |
|---|---|
| `ID` | Número asignado por QEMU |
| `TAG` | El nombre dado con `-c` |
| `VM SIZE` | Tamaño del estado de la máquina guardado con la instantánea: `0 B` aquí, porque la instantánea es la del **disco solo** (véase la sección siguiente) |
| `DATE` | Momento de la toma |
| `VM CLOCK`, `ICOUNT` | Reloj de la máquina y contador de instrucciones, útiles solo para una instantánea de máquina encendida |

### Comprobar que la vuelta atrás funciona

Para ver una instantánea restaurar datos de verdad, la herramienta `qemu-io` escribe y lee bytes directamente en un archivo de disco, sin máquina virtual. Su opción `-c` indica el comando que hay que ejecutar. La sintaxis es `write -P valor desplazamiento tamaño`: `-P` fija el valor que se repite, el desplazamiento es la posición de inicio (en bytes desde el principio del disco, `0` aquí) y el tamaño la cantidad escrita. Así, `write -P 0xAA 0 4k` escribe 4 KiB, todos iguales al valor `0xAA` (el prefijo `0x` indica un número escrito en hexadecimal, en base 16, con las cifras de 0 a 9 y luego de A a F), al principio del disco; `read -P 0xAA 0 4k` vuelve a leer la zona y falla si no contiene exactamente ese valor.

```bash
qemu-img create -f qcow2 d2.qcow2 64M           # crea el disco de prueba (64 MiB)
qemu-io -c 'write -P 0xAA 0 4k' d2.qcow2        # escribe el valor AA en los primeros 4 KiB
qemu-img snapshot -c antes d2.qcow2             # foto del estado: la zona contiene AA
qemu-io -c 'write -P 0xBB 0 4k' d2.qcow2        # sobrescribe la zona con el valor BB
qemu-io -c 'read -P 0xBB 0 4k' d2.qcow2         # vuelve a leer: BB está ahí
qemu-img snapshot -a antes d2.qcow2             # vuelve a la foto
qemu-io -c 'read -P 0xAA 0 4k' d2.qcow2         # vuelve a leer: AA ha vuelto
ls -l d2.qcow2                                  # tamaño del archivo al final
```

Cada comando `qemu-io` responde `read 4096/4096 bytes` o `wrote 4096/4096 bytes` (bytes leídos o escritos), seguido de una línea que indica la velocidad de la operación; lo esencial es que **la última lectura tiene éxito con AA**: la escritura BB, hecha después de la instantánea, ha sido anulada. El tamaño del archivo pasó de 393 216 bytes (una vez escrito AA) a 655 360 bytes (BB escrito además, con la instantánea): los bloques antiguos se conservan.

### Los errores que conviene conocer

| Comando | Mensaje obtenido | Causa |
|---|---|---|
| `qemu-img snapshot -a ausente d2.qcow2` | `Could not apply snapshot 'ausente': Failed to load snapshot: No such file or directory` | Ninguna instantánea con ese nombre |
| `qemu-img snapshot -c x inexistente.qcow2` | `Could not open 'inexistente.qcow2': ... No such file or directory` | El archivo de disco no existe |
| `qemu-img snapshot -c x` mientras una VM usa el disco | `Failed to get "write" lock` y luego `Is another process using the image [d5.qcow2]?` | QEMU bloquea el disco mientras la VM funciona |

El último caso es una protección, no una avería: escribir en el archivo de un disco mientras el invitado escribe en él podría corromper el disco. Una vez apagada la VM, el mismo comando funciona.

Tres comportamientos observados en la versión probada:

| Constatación | Consecuencia |
|---|---|
| `-d` designa la instantánea por su **nombre**: `qemu-img snapshot -d 1` responde `snapshot not found` aunque la instantánea de ID 1 exista; `-d a` funciona | Dar el nombre a `-d` |
| `-a` acepta el ID igual que el nombre | Pero un nombre basta, y es más legible |
| Dos instantáneas pueden llevar el **mismo nombre** (dos `dos` han recibido los ID 1 y 2) | Dar un nombre único a cada instantánea, por ejemplo con la fecha: si no, un nombre designa dos instantáneas y `-a` o `-d` se vuelve ambiguo |

## Disco solo o disco y memoria

Hay dos clases de instantáneas, según la VM esté apagada o encendida.

| | Instantánea de **disco solo** | Instantánea de **disco y memoria** |
|---|---|---|
| VM | **Apagada** | **Encendida** |
| Herramienta | `qemu-img snapshot` | La **consola de QEMU** (el monitor), comando `savevm` |
| Qué se fotografía | El contenido del disco | El disco, **más** la RAM, el estado del procesador y de los periféricos (disco, teclado y tarjeta de red simulados) |
| Al volver atrás | La VM arranca de nuevo desde el principio, como tras un apagado limpio | La VM retoma **exactamente** donde estaba: programas abiertos, ventanas, todo |
| Tamaño (`VM SIZE`) | `0 B` | Ligado a la memoria de la máquina |
| Ejemplo de uso | Antes de instalar un sistema o de repartir el disco | En pleno trabajo, antes de una prueba de la que se quiere poder volver sin reiniciar |

### La consola de QEMU

QEMU controla la máquina encendida mediante una **consola**, llamada **monitor**: un prompt `(qemu)` donde se escriben comandos que afectan a la propia máquina (y no al sistema invitado). Hay dos formas de acceder a ella.

| Forma | Cómo |
|---|---|
| Con `-nographic` | En la consola de la VM, `Ctrl+A` y luego `C` alterna entre la consola del invitado y el monitor (`Ctrl+A` y luego `X` sale) |
| Con `-monitor stdio` | El monitor ocupa la terminal que lanzó QEMU, y la consola del invitado pasa a otro lugar (por ejemplo, `-serial null` para ignorarla) |

En el monitor, los comandos sobre instantáneas son:

| Comando | Función |
|---|---|
| `savevm NOMBRE` | Tomar una instantánea de disco y memoria de la máquina encendida |
| `loadvm NOMBRE` | Volver a esa instantánea (la máquina retoma donde estaba) |
| `delvm NOMBRE` | Destruir esa instantánea |
| `info snapshots` | Listar las instantáneas |

Una prueba completa (los comandos de la consola se envían mediante una [tubería](/?c=langages&s=bash&p=redirections-et-pipes), para que se ejecuten sin teclado; el disco es un `qcow2` vacío, así que el programa de la máquina no hace nada, pero las instantáneas son reales):

```bash
qemu-img create -f qcow2 d6.qcow2 64M   # crea el disco de prueba (64 MiB)
# Las llaves agrupan comandos; echo escribe un texto, que la tubería «|» envía
# a QEMU, que lo lee como si se escribiera en el monitor.
{
  sleep 3                       # deja arrancar QEMU (sleep = esperar n segundos)
  echo 'savevm guardado1'       # instantánea de disco y memoria
  sleep 2                       # espera al final de la escritura
  echo 'loadvm guardado1'       # vuelve a la instantánea
  sleep 2                       # espera al final de la lectura
  echo 'info snapshots'         # lista las instantáneas
  sleep 1                       # deja tiempo para mostrar
  echo 'delvm guardado1'        # destruye la instantánea
  sleep 1                       # espera al final de la destrucción
  echo 'info snapshots'         # lista de nuevo
  sleep 1                       # deja tiempo para mostrar
  echo 'quit'                   # detiene la máquina
} | timeout 20 qemu-system-x86_64 -accel kvm -m 128M -nographic -nic none \
      -monitor stdio -serial null -drive file=d6.qcow2,format=qcow2
```

Salida obtenida, limpiada de los caracteres de eco del terminal:

```text
QEMU 8.2.2 monitor - type 'help' for more information
(qemu) savevm guardado1
(qemu) loadvm guardado1
(qemu) info snapshots
List of snapshots present on all disks:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
--        guardado1        1.02 MiB 2026-10-31 21:10:15 00:00:02.966
(qemu) delvm guardado1
(qemu) info snapshots
There is no snapshot available.
```

`savevm` y `loadvm` no muestran nada cuando tienen éxito. Una instantánea de máquina que se deja en su sitio aparece también en `qemu-img snapshot -l` una vez apagada la VM, con una columna `VM SIZE` no nula (`2.25 MiB` en otra prueba, `1.02 MiB` aquí: la máquina de prueba casi no ejecuta nada, así que hay muy poco estado que guardar). En una máquina real con un sistema cargado, ese tamaño puede acercarse a la memoria ocupada (no medido aquí).

Al arrancar, la opción `-loadvm NOMBRE` retoma directamente una instantánea de máquina: tras `savevm s2`, el comando `qemu-system-x86_64 ... -loadvm s2` arranca la máquina en el estado fotografiado (el monitor responde `VM status: running`).

> **Trampa:** `savevm` exige que **todos** los discos escribibles estén en `qcow2`. En un disco `raw`, QEMU se niega: `Error: Device 'ide0-hd0' is writable but does not support snapshots`. Un disco `raw` olvidado en el montaje basta para bloquearlo.

## Una instantánea no es una copia de seguridad

Una instantánea interna **vive dentro del archivo** `qcow2`. No es una copia puesta en otro lugar, es una parte del mismo archivo.

| Suceso | ¿Sobrevive la instantánea? |
|---|---|
| Se modifica el disco después de la instantánea | Sí: para eso sirve |
| Se copia el archivo `qcow2` | Sí: la copia lleva sus instantáneas (comprobado: `snapshot -l` sobre la copia las lista) |
| Se borra el archivo `qcow2` | **No**: la instantánea desaparece con él |
| El archivo se corrompe (corte de corriente del anfitrión, disco defectuoso) | **No**: la instantánea y el estado actual están en el mismo archivo dañado |
| El disco del anfitrión falla | **No**: todo está en ese único archivo |

Una instantánea protege contra **un error en el invitado** (un comando fallido, una mala instalación). Una copia de seguridad protege contra **la pérdida del archivo**. Ambas se complementan.

```bash
# La VM debe estar apagada: copiar un disco que se está escribiendo lo dejaría incoherente
# cp copia el archivo entero, con sus instantáneas incluidas
cp debian-rescate.qcow2 debian-rescate.respaldo.qcow2
```

Poner esta copia en **otro** disco físico u otro ordenador: si no, la copia de seguridad comparte la suerte del archivo original.

## Apagar limpiamente antes de la instantánea

Una instantánea de disco solo fotografía lo que está **escrito en el archivo** en el momento de tomarla. Ahora bien, un sistema operativo guarda una parte de sus escrituras **en memoria** antes de enviarlas al disco (es más rápido). Si la máquina se corta sin aviso, esas escrituras se pierden y el disco puede quedar en un estado intermedio: archivos truncados, sistema de archivos (la forma en que el disco organiza los archivos; véase [Particionamiento y LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm)) que reparar en el siguiente arranque.

Cerrar la ventana de QEMU, o escribir `quit` en el monitor, **detiene el proceso QEMU en el acto**: para el invitado, equivale a un corte de corriente. El mismo efecto lo produce un `kill` sobre el proceso de QEMU. Un [proceso](/?c=langages&s=bash&p=gestion-des-processus) es un programa en ejecución, y `kill` le envía una **señal** (un mensaje enviado a un programa; por defecto, una petición de parada).

| Método de parada | Efecto en el invitado | Para una instantánea de disco solo |
|---|---|---|
| `sudo poweroff` o `sudo shutdown -h now` **dentro del invitado** | El sistema termina sus escrituras, desconecta sus discos y se apaga | Bien: el disco es coherente |
| Cerrar la ventana de QEMU | Equivale a desenchufar la máquina | Evitar |
| `quit` en el monitor | Igual | Evitar |
| `timeout` que vence sobre QEMU | Igual (QEMU se detiene con una señal) | Evitar salvo para una prueba |
| `system_powerdown` en el monitor | Envía al invitado una petición de apagado, como una pulsación del botón de encendido; el invitado se apaga limpiamente si responde a ese botón (no probado aquí, no hay sistema instalado) | Bien si el invitado responde |

La secuencia segura:

| Paso | Acción | Por qué |
|---|---|---|
| 1 | En el invitado, escribir `sudo poweroff` | Escrituras terminadas, sistema de archivos cerrado correctamente |
| 2 | Esperar a que el proceso QEMU **termine por sí mismo** (la ventana se cierra) | El disco queda liberado: el bloqueo desaparece |
| 3 | `qemu-img snapshot -c antes-paso disco.qcow2` | Foto de un disco coherente |
| 4 | Volver a lanzar la VM | Continuar el trabajo |

Para una instantánea de máquina encendida con `savevm`, la cuestión no se plantea en los mismos términos: el estado de la RAM se guarda con el disco, y `loadvm` devuelve la máquina tal cual, incluidas las cachés (las copias temporales guardadas en memoria).

## Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Se puede tomar una instantánea de varios discos a la vez? | Con `savevm`, sí: todos los discos escribibles se fotografían juntos (deben estar todos en `qcow2`). Con `qemu-img snapshot`, de un archivo en uno |
| ¿Y en Windows o macOS? | QEMU también existe en esos sistemas, pero KVM es propio de Linux: hay que elegir otra aceleración (`-accel tcg` funciona en todas partes). Las demás aceleraciones (no probadas aquí) están documentadas en el sitio de QEMU |
| ¿Cuántas instantáneas como máximo? | No se ha medido ningún límite aquí; el verdadero límite es el espacio en disco, porque cada instantánea guarda sus bloques |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Confundir los dos sentidos de «anfitrión» | Se busca un ajuste en el lugar equivocado (QEMU en lugar del Linux de construcción, o al revés) | Preguntarse de qué máquina es anfitrión |
| Disco llamado `anfitrion.qcow2` | El nombre no dice de qué anfitrión se trata | Nombrar por contenido y función |
| `-accel kvm` sin KVM disponible | El lanzamiento falla (no reproducido aquí) | Probar `/dev/kvm`, o usar `-accel tcg` |
| Olvidar `-f qcow2` o `format=qcow2` | `qemu-img create` fabrica un raw; al lanzar, QEMU adivina el formato y avisa | Indicar siempre el formato |
| `-cdrom` olvidado o ISO mal nombrada | `No bootable device.` con un disco vacío | Comprobar el nombre y la ruta de la ISO |
| Dejar `-cdrom` tras la instalación con `-boot order=dc` | Se vuelve al instalador | Orden `cd`, o quitar `-cdrom` |
| Cerrar la ventana de la VM | Corte de corriente virtual, disco incoherente | Apagar desde el invitado |
| Tomar una instantánea de disco mientras la VM funciona | Rechazado por el bloqueo (`Failed to get "write" lock`) | Apagar, o usar `savevm` |
| Copiar un `qcow2` mientras la VM funciona | Copia incoherente | Apagar primero |
| Tomar una instantánea como copia de seguridad | Desaparece con el archivo | Copiar el archivo a otro soporte |
| Disco `raw` mezclado con los discos `qcow2` | `savevm` rechazado | Convertir o quitar el disco `raw` |
| Dos instantáneas con el mismo nombre | El nombre ya no designa una instantánea precisa | Nombres únicos, con la fecha |
| Acumular muchas instantáneas | El archivo crece y el anfitrión puede quedarse sin espacio | Destruir las que ya no sirvan (`-d`) |
| Creer que el tamaño del disco está reservado | El archivo crece con el uso, el anfitrión puede llenarse | Vigilar el espacio libre del anfitrión |
| Memoria del invitado demasiado grande | El anfitrión se queda sin RAM y se ralentiza | Dejar margen para el anfitrión |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Comprobar `/dev/kvm` antes de elegir la aceleración | Una VM rápida, o una vuelta atrás asumida a `tcg` |
| Indicar el formato de cada disco, en todas partes | Ninguna adivinanza por parte de QEMU |
| Nombrar los discos por su contenido | Ninguna confusión sobre «el anfitrión» |
| Lanzar las pruebas bajo `timeout`, con una memoria moderada | Una prueba que se bloquea se detiene sola sin ocupar la máquina; véase [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| Apagar el invitado desde dentro antes de una instantánea de disco | Un disco coherente |
| Nombrar cada instantánea de forma única y clara | `-a` y `-d` apuntan a la correcta |
| Tomar una instantánea **antes** de cada paso irreversible | Una vuelta atrás en unos segundos |
| Copiar con regularidad el archivo `qcow2` a otro soporte | Es la única verdadera copia de seguridad |
| Destruir las instantáneas que ya no sirven | El archivo deja de crecer |
| Leer `qemu-img snapshot -l` antes de aplicar una instantánea | Saber qué se restaura y qué se pierde |

## Para ir más allá

| Tema | Dónde |
|---|---|
| Todas las opciones de QEMU | [Invocación de QEMU](https://www.qemu.org/docs/master/system/invocation.html) |
| La herramienta `qemu-img` y sus subcomandos | [Manual de qemu-img](https://www.qemu.org/docs/master/tools/qemu-img.html) |
| Los comandos del monitor | [Monitor de QEMU](https://www.qemu.org/docs/master/system/monitor.html) |
| KVM | [Sitio del proyecto KVM](https://www.linux-kvm.org/page/Main_Page) |
| Fabricar un Linux a partir de las fuentes | [Linux From Scratch](https://www.linuxfromscratch.org/lfs/) |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | **QEMU** simula la máquina (discos, pantalla, red); **KVM**, función del núcleo Linux (`/dev/kvm`), la hace rápida dejando que el procesador real ejecute al invitado; si no, `-accel tcg` emula todo por software. Un lanzamiento típico: `qemu-system-x86_64 -accel kvm -m 2G -smp 2 -drive file=d.qcow2,format=qcow2 -cdrom x.iso -boot order=cd` (memoria, núcleos, disco, unidad de CD; `c` disco y luego `d` CD, así que un disco vacío deja arrancar el CD, y `No bootable device.` indica que ningún soporte arranca). «Anfitrión» tiene dos sentidos: el anfitrión de **virtualización** (la máquina real que lanza QEMU, frente al invitado) y el anfitrión de **construcción** (el Linux ya instalado que sirve para fabricar otro, frente al sistema destino); los dos pueden superponerse. Un disco **`qcow2`** es un archivo que crece con el uso (`qemu-img create -f qcow2 d.qcow2 64M`, `qemu-img info`) y sabe guardar **instantáneas**: `qemu-img snapshot -c` crea, `-l` lista, `-a` aplica, `-d` destruye (por nombre). Instantánea de **disco solo**: VM apagada, `qemu-img`. Instantánea de **disco y RAM**: VM encendida, monitor de QEMU, `savevm`, `loadvm`, `delvm`, `info snapshots`. |
| **Trampas que evitar** | Confundir los dos «anfitriones»; `-accel kvm` sin KVM; olvidar el formato del disco; cerrar la ventana de la VM (equivale a cortar la corriente); creer que una instantánea es una copia de seguridad (vive en el archivo `qcow2` y desaparece con él); tomar una instantánea de disco o copiar el disco mientras la VM funciona; un disco `raw` que bloquea `savevm`; dos instantáneas con el mismo nombre; dejar que las instantáneas se acumulen. |
| **Buenas prácticas** | Probar `/dev/kvm` primero; indicar el formato en todas partes; nombrar discos e instantáneas con claridad; apagar el invitado desde dentro (`sudo poweroff`) antes de una instantánea de disco; una instantánea antes de cada paso arriesgado; copiar el archivo `qcow2` a otro lugar para tener una verdadera copia de seguridad; lanzar las pruebas bajo `timeout`. |
