---
order: 1
---

# Virtualización y elección de SO

Administrar un servidor Linux empieza incluso antes de teclear un solo comando: primero hace falta una máquina en la que instalarlo, y una distribución que hacer funcionar en ella. Este capítulo cubre estas dos decisiones previas; los siguientes suponen que ya hay un sistema instalado y accesible.

## Crear la máquina: un hipervisor de tipo 2

Sin un servidor físico dedicado, una [máquina virtual](/?c=docker&p=concepts-de-base) (VM) simula un ordenador completo dentro del propio equipo de trabajo, mediante un **hipervisor**. Dos programas habituales para este caso de uso local:

| Software | Plataforma anfitriona | Particularidad |
|---|---|---|
| [VirtualBox](https://www.virtualbox.org/) | Windows, macOS, Linux | Gratuito, de código abierto, muy extendido, admite numerosos sistemas invitados |
| [UTM](https://mac.getutm.app/) | macOS (Apple Silicon e Intel) | Se apoya en el hipervisor nativo de Apple, más eficiente en un Mac reciente que VirtualBox |

> **Nota:** ambos son hipervisores de **tipo 2** (instalados como una aplicación normal encima de un sistema operativo ya presente), a diferencia de un hipervisor de tipo 1 (instalado directamente sobre el hardware, sin sistema anfitrión, usado más bien en entornos de producción).

## Elegir una distribución: Debian o Rocky Linux

La distribución elegida para la VM condiciona las herramientas disponibles más adelante (gestor de paquetes, control de acceso obligatorio, véase [SELinux vs AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor)):

| | Debian | Rocky Linux |
|---|---|---|
| Origen | Distribución comunitaria independiente | Reconstrucción comunitaria de Red Hat Enterprise Linux (RHEL) |
| Gestor de paquetes | `apt` (`.deb`) | `dnf` (`.rpm`) |
| Control de acceso obligatorio | [AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor) | [SELinux](/?c=administration-systeme&p=selinux-vs-apparmor) |
| Cortafuegos por defecto | [UFW](/?c=administration-systeme&p=pare-feu-ufw-firewalld) | [firewalld](/?c=administration-systeme&p=pare-feu-ufw-firewalld) |
| Puntos fuertes | Comunidad muy grande, actualizaciones frecuentes, muy bien documentada | Compatible con el ecosistema RHEL (usado en empresas), ciclo de soporte largo |
| Contrapartida | Menos orientada a "empresa" que RHEL/Rocky | Curva de aprendizaje algo más pronunciada (SELinux más estricto que AppArmor por defecto) |

Ninguna de las dos es objetivamente "mejor": Debian prioriza la sencillez y una comunidad muy amplia, Rocky Linux prioriza la cercanía con un entorno de empresa real (RHEL se usa ampliamente en producción). La elección depende sobre todo del objetivo: aprender administración de sistemas "genérica" (Debian) o acercarse a las prácticas de una empresa que usa RHEL (Rocky).

> **Trampa:** instalar una distribución y luego mezclar instrucciones encontradas en línea para la otra (ej.: usar `apt` en Rocky Linux): las dos familias de distribuciones tienen herramientas y rutas de configuración diferentes, rara vez intercambiables.
>
> **Buena práctica:** una vez elegida la distribución, mantenerse coherente con su ecosistema (gestor de paquetes, documentación oficial de esa distribución) en lugar de mezclar fuentes de información pensadas para la otra familia.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un hipervisor de tipo 2 (VirtualBox, UTM) permite crear una VM en un equipo de trabajo existente; Debian y Rocky Linux son dos familias de distribuciones con herramientas diferentes (`apt`/AppArmor/UFW frente a `dnf`/SELinux/firewalld). |
| **Herramientas utilizables** | VirtualBox (multiplataforma) o UTM (macOS) para crear la VM; `apt` o `dnf` según la distribución elegida. |
| **Trampas a evitar** | Mezclar comandos o documentación pensados para la otra familia de distribución. |
| **Buenas prácticas** | Elegir la distribución en función del objetivo (aprendizaje genérico frente a cercanía con un entorno de empresa RHEL), y luego mantenerse coherente con su ecosistema. |
