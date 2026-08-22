---
order: 1
---

# Fundamentos de redes

Una **red informática** es un conjunto de máquinas conectadas entre sí, capaces de intercambiar datos. Antes de saber cómo se comunican dos programas (véase [Sockets y E/S no bloqueante](/?c=reseaux&p=sockets-et-io-non-bloquante)), hay que entender cómo se identifica una máquina en esa red, y cómo sus datos encuentran el camino hasta el destino correcto.

## La dirección IP: identificar una máquina

Una **dirección IP** (*Internet Protocol*) identifica de forma única una máquina en una red, un poco como un número de teléfono identifica a un interlocutor. La versión más extendida, **IPv4**, se escribe como 4 números entre 0 y 255, separados por puntos:

```text
192.168.1.10
 |    |  | |
 └────┴──┴─┴─ 4 bloques de 8 bits (0-255) = 32 bits en total
```

> **Nota:** IPv4 solo permite ~4300 millones de direcciones distintas, una cifra ya insuficiente para todos los dispositivos conectados en el mundo. **IPv6**, su versión más reciente (direcciones de 128 bits, p. ej. `2001:0db8::1`), resuelve este problema, pero todavía no está desplegada de forma universal; este capítulo se centra en IPv4, ampliamente dominante en la práctica.

## La máscara de subred: dividir una dirección en dos partes

Una dirección IP por sí sola no indica qué máquinas están en la **misma** red local. La **máscara de subred** (*subnet mask*) responde a esta pregunta: divide la dirección IP en una parte de **red** (idéntica para todas las máquinas de la misma red local) y una parte de **host** (única para cada máquina de esa red).

```text
Direccion IP  :  192.168.1  .  10
Mascara       :  255.255.255.0
                 └─────────┘ └┘
                  parte         parte
                  de red        de host
```

| Elemento | Función | Ejemplo |
|---|---|---|
| Parte de red | Identifica la propia red local | `192.168.1` |
| Parte de host | Identifica una máquina concreta dentro de esa red | `10` |

Dos máquinas cuya parte de red (una vez aplicada la máscara) es idéntica pueden hablarse **directamente**, sin pasar por un router. Si la parte de red difiere, sus datos deben transitar obligatoriamente por un router para encontrarse.

## La puerta de enlace predeterminada: la salida de la red local

La **puerta de enlace predeterminada** (*default gateway*) es la dirección IP a la que una máquina envía sus datos en cuanto el destino **no** se encuentra en su red local (parte de red distinta). Casi siempre es la dirección del router local.

```text
Ordenador (192.168.1.10)
        |
        | destino en la misma red (192.168.1.x)      -> envio directo
        | destino fuera de la red (ej: un sitio web)  -> envio a la puerta de enlace
        v
Puerta de enlace / router (192.168.1.1) --------> resto de Internet
```

## Router frente a switch: dos aparatos, dos funciones

Estos dos aparatos conectan máquinas entre sí, pero a escalas diferentes:

| | Switch | Router |
|---|---|---|
| Conecta | Varias máquinas **de una misma red local** | Varias **redes** distintas entre sí |
| Decisión tomada según | La dirección física de la tarjeta de red (dirección *MAC*) | La dirección IP (parte de red) |
| Ejemplo de uso | Conectar los ordenadores de una misma oficina | Conectar la red de una casa con el resto de Internet |

> **Trampa:** confundir ambos por culpa del aparato que entrega un proveedor de acceso a Internet (a menudo llamado "router" a secas): en realidad combina un router, un switch y un punto de acceso Wi-Fi en una sola caja.

## Las capas OSI: una división por responsabilidades

El **modelo OSI** divide toda comunicación de red en 7 capas apiladas, cada una encargándose solo de un aspecto concreto y apoyándose en la capa inferior:

| Capa | Función | Ejemplo |
|---|---|---|
| 7. Aplicación | El protocolo que usa el propio programa | HTTP, DNS |
| 6. Presentación | Formato de los datos (cifrado, codificación) | TLS |
| 5. Sesión | Apertura/cierre de una conversación entre dos máquinas | - |
| 4. Transporte | División en paquetes, fiabilidad de la entrega | TCP, UDP |
| 3. Red | Direccionamiento IP y enrutamiento entre redes | IP, el router |
| 2. Enlace | Direccionamiento físico (MAC) dentro de una misma red local | Ethernet, el switch |
| 1. Física | El soporte físico de la señal | Cable, Wi-Fi |

En la práctica, un desarrollador maneja sobre todo las capas 3 a 7: [trabajar con un socket](/?c=reseaux&p=sockets-et-io-non-bloquante) ocurre a nivel de la capa de transporte (TCP/UDP), mientras que una [API HTTP](/?c=infrastructure&p=api-et-http) se sitúa a nivel de la capa de aplicación.

## Dos mecanismos complementarios: DHCP y NAT

Dos servicios automatizan parte de lo que este capítulo acaba de explicar de forma manual:

- **[DHCP](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)** (*Dynamic Host Configuration Protocol*) asigna automáticamente una dirección IP, una máscara y una puerta de enlace a cada máquina que se une a la red, en lugar de configurarlas a mano.
- **[NAT](https://en.wikipedia.org/wiki/Network_address_translation)** (*Network Address Translation*) permite que varias máquinas de una red local, cada una con su propia dirección IP privada, compartan una sola dirección IP pública para salir a Internet: es lo que hace el router doméstico de un particular para todos los dispositivos de su hogar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una dirección IP identifica una máquina; la máscara de subred distingue la parte de red de la parte de host; la puerta de enlace da salida a la red local; un switch conecta máquinas de una misma red, un router conecta redes entre sí. |
| **Herramientas utilizables** | El modelo OSI para situar un problema de red en la capa correcta; DHCP para la asignación automática de direcciones; NAT para compartir una IP pública. |
| **Trampas a evitar** | Confundir router y switch, o creer que un router doméstico es un solo tipo de aparato cuando en realidad combina varios. |
| **Buenas prácticas** | Comprobar siempre si dos máquinas comparten la misma parte de red antes de buscar por qué no se comunican directamente. |
