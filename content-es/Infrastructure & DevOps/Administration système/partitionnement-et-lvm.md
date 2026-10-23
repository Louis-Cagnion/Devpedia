---
order: 2
---

# Particionamiento y LVM

Una vez [elegido el sistema operativo](/?c=administration-systeme&p=virtualisation-et-choix-dos), su instalación exige decidir cómo organizar el espacio de disco disponible. Este capítulo cubre el particionamiento clásico y su alineación, su cifrado, y LVM, una herramienta que hace esta organización más flexible.

## El particionamiento: dividir un disco en zonas independientes

Un disco físico puede dividirse en varias **particiones**, cada una tratada por el sistema como un disco separado, con su propio sistema de archivos y su propio punto de montaje (el lugar donde su contenido aparece en el árbol de directorios, véase [Estructura de archivos y rutas](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disco fisico (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (raiz, 100 GB)       │  ...al menos 2 particiones
└─────────────────┴──────────────────────────┘
```

Separar, por ejemplo, `/` (el sistema) de `/home` (los datos de los usuarios) en dos particiones distintas aísla ambos: un `/` que se llena por completo (logs, actualizaciones) no bloquea la escritura de nuevos datos de usuario en `/home`, y una reinstalación del sistema puede limitarse a la partición `/` sin tocar los datos.

## Alinear las particiones: empezar en una frontera del disco

El disco no lee ni escribe byte a byte, sino por **bloques**. Conviven tres tamaños que hay que distinguir:

| Palabra | Definición | Tamaño habitual |
|---|---|---|
| **Sector** | la unidad numerada más pequeña del disco, la que cuentan `fdisk` y la tabla de particiones | 512 bytes |
| **Bloque físico** | lo que el disco lee o escribe realmente en una sola operación (véase [el almacenamiento](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | 4 KiB, es decir 8 sectores |
| **Bloque del sistema de archivos** | la unidad de almacenamiento del **sistema de archivos** (la forma en que una partición organiza sus archivos, por ejemplo `ext4`) | 4 KiB |

Una partición está **alineada** cuando su primer sector (su columna `Start`) cae en el inicio de un bloque físico. Por convención, se apunta a un múltiplo de **2048 sectores**, es decir 1 MiB: también es múltiplo de 8 sectores, por tanto del tamaño de un bloque físico, y es el valor que `fdisk` propone por defecto.

```text
Ejemplo en un disco imaginario (8 sectores por bloque físico):

Partición ALINEADA (inicio en el sector 8, múltiplo de 8)
bloque físico:    |  bloque 1  |  bloque 2  |  bloque 3  |
bloque del SA:    |    SA 0    |    SA 1    |    SA 2    |
→ un bloque del sistema de archivos = un bloque físico: 1 escritura

Partición DESALINEADA (inicio en el sector 5)
bloque físico:    |  bloque 1  |  bloque 2  |  bloque 3  |
bloque del SA:         |    SA 0    |    SA 1    |    SA 2    |
→ cada bloque del SA se solapa con 2 bloques físicos
```

En el caso desalineado, escribir un solo bloque del sistema de archivos obliga al disco a **leer** los dos bloques físicos afectados, modificar la parte correspondiente y luego **reescribir** ambos: tres o cuatro operaciones en lugar de una. Nada falla y los datos siguen siendo correctos: la pérdida es de rendimiento, y no se nota en el uso diario.

### Comprobar un inicio

```bash
sudo fdisk -l /dev/sdb          # muestra la tabla de particiones del disco sdb (columna Start, en sectores)
echo $(( 73402368 % 2048 ))     # % da el resto de la división: 0 significa «múltiplo de 2048», por tanto alineado
echo $(( 73402369 % 2048 ))     # resto 1: inicio desplazado un sector, por tanto no alineado
```

| Start | Resto de la división entre 2048 | Veredicto |
|---|---|---|
| 2048 | 0 | alineado |
| 10487808 | 0 | alineado |
| 73402368 | 0 | alineado |
| 73402369 | 1 | desplazado un sector |
| 63 (inicio histórico heredado de DOS) | 63 | desalineado |

### Cuándo se decide la alineación

La alineación se fija **al crear la tabla de particiones**: es ella la que registra los `Start`. Formatear (`mkfs`), montar o copiar archivos no mueve ningún inicio: se puede comprobar volviendo a ejecutar `fdisk -l` antes y después de un `mkfs`, los `Start` no cambian. Por tanto, es antes de formatear cuando hay que comprobar.

El inicio propuesto por defecto por `fdisk` es cómodo pero no infalible (un disco preparado con una herramienta antigua puede hacer que proponga `63`): se acepta y luego se comprueba la columna `Start`.

### Corregir un desplazamiento: borrar, recrear, reformatear

Mover el inicio de una partición cambia el lugar donde se encuentra cada estructura del sistema de archivos, porque todas se localizan **a partir del inicio de la partición**. Por ejemplo, el **superbloque** de `ext4` (la zona que describe el sistema de archivos: tamaño, tipo, número mágico `0xEF53`) está a 1024 bytes, es decir 2 sectores, del inicio. Desplazar la partición un sector hace leer en el lugar equivocado: el antiguo sistema de archivos deja de ser legible y hay que recrearlo con `mkfs`.

| Partición | Inicio antes | Inicio después | Lo que señala `fdisk` al recrearla |
|---|---|---|---|
| `sdb3` | 10487808 | 10487808 (sin cambios) | firma `ext4` detectada: propone borrarla |
| `sdb4` | 73402369 | 73402368 | nada: busca el superbloque 2 sectores después del **nuevo** inicio, es decir un sector antes del del antiguo sistema de archivos |

Que una firma ya no se detecte no significa que los datos antiguos hayan desaparecido: siguen en el disco hasta el `mkfs`.

> **Límites:**
> - Realinear una partición que ya contiene archivos obliga a borrarla, recrearla y reformatearla: los archivos se pierden sin copia de seguridad. De ahí el interés de comprobar **antes** de poner nada en ella.
> - En un disco virtual (por ejemplo una máquina virtual `QEMU`), `fdisk` suele anunciar sectores de 512 bytes, lógicos y físicos: la ganancia no se mide ahí. Mantener la alineación a 1 MiB sigue siendo un hábito barato que evita el problema en un disco real.
> - La alineación no lo arregla todo: no mejora la velocidad base del disco, solo evita perder parte de ella.

## Cifrar una partición

Una partición cifrada protege su contenido si el disco físico es robado o se accede a él fuera del sistema normal (arranque desde otra memoria USB, disco desmontado y conectado en otro lugar): sin la clave de descifrado, su contenido permanece ilegible. **LUKS** (*Linux Unified Key Setup*) es el estándar de Linux para este cifrado, generalmente solicitado al arrancar en forma de frase de contraseña.

## LVM: una capa de flexibilidad entre el disco y las particiones

Un particionamiento clásico fija el tamaño de cada partición **en el momento de la instalación**: ampliarlo después es arriesgado (a menudo requiere mover datos). **LVM** (*Logical Volume Manager*) añade una capa de abstracción que hace ese tamaño modificable posteriormente:

| Nivel LVM | Función |
|---|---|
| Volumen físico (*Physical Volume*, PV) | Una partición o un disco entero, tal como lo ve LVM |
| Grupo de volúmenes (*Volume Group*, VG) | Un "pool" de espacio, formado combinando uno o varios PV |
| Volumen lógico (*Logical Volume*, LV) | Una porción del VG, usada como una partición clásica (formateada, montada) |

```text
Disco fisico --> Volumen fisico (PV) --\
Disco fisico --> Volumen fisico (PV) ----> Grupo de volumenes (VG) --> Volumenes logicos (LV)
                                                                            |
                                                                   /  (LV montado en /)
                                                                   /home  (LV montado en /home)
```

Un volumen lógico puede ampliarse aprovechando el espacio aún libre del grupo de volúmenes, sin reinstalación ni desplazamiento físico de los datos existentes: es esta flexibilidad la que justifica LVM incluso en un servidor único, no solo en un contexto con varios discos.

> **Nota:** LVM y el cifrado se combinan apilando las capas: el disco físico se cifra primero con LUKS, y luego LVM se configura **encima** de ese volumen ya cifrado. Cada volumen lógico hereda así el cifrado sin tener que configurarlo individualmente.

> **Trampa:** crear una única partición `/` grande sin pensar en la división: un incidente (logs que saturan el disco, por ejemplo) afecta entonces a la totalidad del sistema en lugar de a una zona aislada.
>
> **Buena práctica:** prever al menos 2 particiones desde la instalación (típicamente `/` y `/home`, o `/` y `/boot`), y usar LVM para conservar la posibilidad de ajustar su tamaño más adelante sin reinstalación.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El particionamiento divide un disco en zonas independientes cuyo inicio debe ser múltiplo de 2048 sectores (alineación, decidida al crear la tabla); LUKS cifra una partición; LVM añade una capa (PV → VG → LV) que hace los tamaños modificables después de la instalación. |
| **Herramientas utilizables** | LUKS para el cifrado, LVM (`pvcreate`, `vgcreate`, `lvcreate`) para la gestión flexible del espacio de disco. |
| **Trampas a evitar** | Una única partición `/` sin separar: un incidente en una zona afecta a todo el sistema. Un `Start` desplazado (por ejemplo `73402369`): nada falla, pero cada escritura toca dos bloques físicos. |
| **Buenas prácticas** | Comprobar cada `Start` (resto de la división entre 2048 igual a 0) antes de formatear. Prever siempre al menos 2 particiones, y apilar LVM encima de un volumen ya cifrado con LUKS y no al revés. |
