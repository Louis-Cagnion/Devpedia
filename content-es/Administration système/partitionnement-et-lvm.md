---
order: 2
---

# Particionamiento y LVM

Una vez [elegido el sistema operativo](/?c=administration-systeme&p=virtualisation-et-choix-dos), su instalación exige decidir cómo organizar el espacio de disco disponible. Este capítulo cubre el particionamiento clásico, su cifrado, y LVM, una herramienta que hace esta organización más flexible.

## El particionamiento: dividir un disco en zonas independientes

Un disco físico puede dividirse en varias **particiones**, cada una tratada por el sistema como un disco separado, con su propio sistema de archivos y su propio punto de montaje (el lugar donde su contenido aparece en el árbol de directorios, véase [Estructura de archivos y rutas](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disco fisico (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (raiz, 100 GB)       │  ...al menos 2 particiones
└─────────────────┴──────────────────────────┘
```

Separar, por ejemplo, `/` (el sistema) de `/home` (los datos de los usuarios) en dos particiones distintas aísla ambos: un `/` que se llena por completo (logs, actualizaciones) no bloquea la escritura de nuevos datos de usuario en `/home`, y una reinstalación del sistema puede limitarse a la partición `/` sin tocar los datos.

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
| **Para recordar** | El particionamiento divide un disco en zonas independientes; LUKS cifra una partición; LVM añade una capa (PV → VG → LV) que hace los tamaños modificables después de la instalación. |
| **Herramientas utilizables** | LUKS para el cifrado, LVM (`pvcreate`, `vgcreate`, `lvcreate`) para la gestión flexible del espacio de disco. |
| **Trampas a evitar** | Una única partición `/` sin separar: un incidente en una zona afecta a todo el sistema. |
| **Buenas prácticas** | Prever siempre al menos 2 particiones, y apilar LVM encima de un volumen ya cifrado con LUKS y no al revés. |
