---
order: 1
---

# Los conceptos básicos

## Contenedor vs máquina virtual

Una **máquina virtual** (VM) virtualiza hardware: lleva su propio kernel y arranca como un ordenador completo, lo que la hace pesada (varios GB, arranque en decenas de segundos) pero totalmente aislada del host. Un **contenedor** es más ligero: es un proceso clásico del sistema host, que **comparte el kernel** de ese host pero se ejecuta en un entorno aislado del resto del sistema.

```text
Maquina virtual         Contenedor
┌─────────────────┐    ┌─────────────────┐
│   Aplicacion    │    │   Aplicacion    │
├─────────────────┤    ├─────────────────┤
│   Bibliotecas   │    │   Bibliotecas   │
├─────────────────┤    ├─────────────────┤
│  Kernel invitado│    │  Motor Docker   │
├─────────────────┤    ├─────────────────┤
│   Hipervisor    │    │ Kernel del host │
├─────────────────┤    └─────────────────┘
│ Kernel del host │
└─────────────────┘
```

El **hipervisor** es la capa de software que crea y gestiona las máquinas virtuales, repartiendo los recursos físicos (CPU, memoria) entre ellas: es esta capa adicional, ausente en un contenedor, la que explica la diferencia de peso entre ambos enfoques.

> **Consecuencia directa:** un contenedor Linux no puede correr nativamente en Windows o macOS: [Docker Desktop](https://docs.docker.com/desktop/) arranca ahí en realidad una pequeña VM Linux para alojar los contenedores. En un servidor Linux, en cambio, no se necesita ninguna capa de virtualización.

## Bajo el capó: namespaces y cgroups

El aislamiento de un contenedor se basa en dos mecanismos del kernel Linux, no en una tecnología propia de Docker:

- Los **namespaces** aíslan lo que un proceso *ve*: su propio árbol de procesos (cree ser el PID 1), su propio sistema de archivos, su propia interfaz de red... Un proceso en un namespace ni ve ni puede afectar lo que ocurre en otro namespace.
- Los **cgroups** (*control groups*) limitan lo que un proceso *puede consumir*: CPU, memoria, ancho de banda de disco. Es esto lo que impide que un contenedor sature todos los recursos de la máquina host.

Docker orquesta estos dos mecanismos, ya presentes en el kernel, para dar la ilusión de una máquina aislada a menor coste.

## Imagen vs contenedor

Una **imagen** es una plantilla inmutable, de solo lectura: un sistema de archivos fijo (una distribución mínima, las dependencias instaladas, el código de la aplicación) más metadatos (comando a ejecutar al arrancar, puertos expuestos...). Un **contenedor** es una instancia en ejecución de esta imagen, con una fina capa escribible añadida encima.

```text
Imagen (solo lectura)  -->  docker run  -->  Contenedor (imagen + capa escribible + proceso)
```

Una misma imagen puede por tanto arrancar varios contenedores independientes, cada uno con su propia capa escribible: modificar un contenedor nunca modifica la imagen de la que proviene.

## Las imágenes se construyen en capas

Una imagen se apila en **capas** (*layers*), cada una correspondiente a una instrucción del [Dockerfile](/?c=docker&p=dockerfile): instalar un paquete, copiar código, etc. Estas capas se comparten y se cachean entre imágenes: si dos imágenes comparten sus primeras capas (ej. la misma imagen base), Docker no las almacena ni las descarga más que una sola vez.

> **Nota:** es una deduplicación automática por contenido, con el mismo principio que el [almacenamiento de objetos de Git](/?c=git&p=architecture-interne): dos capas idénticas producen el mismo identificador y nunca se duplican en disco.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un contenedor es un proceso aislado (namespaces + cgroups) que comparte el kernel del host, más ligero que una máquina virtual, que virtualiza hardware completo. Una imagen es una plantilla inmutable en capas; un contenedor es una instancia en ejecución de esa imagen. |
| **Herramientas utilizables** | Ningún comando específico aquí: este capítulo sienta el vocabulario (imagen, contenedor, namespace, cgroup) reutilizado en todos los siguientes. |
| **Trampas a evitar** | Confundir imagen y contenedor: modificar un contenedor nunca modifica la imagen de la que proviene. |
| **Buenas prácticas** | Entender que el aislamiento de un contenedor se basa en el kernel Linux (namespaces/cgroups), no en una tecnología propia de Docker, para evaluar mejor sus límites de seguridad. |
