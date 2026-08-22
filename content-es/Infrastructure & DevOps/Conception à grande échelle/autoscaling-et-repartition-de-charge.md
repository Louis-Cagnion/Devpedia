---
order: 2
---

# Autoscaling y balanceo de carga

[Bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) detalla cómo absorber un tráfico alto **del lado de la base de datos** (caché, réplicas, sharding). Este capítulo cubre la otra mitad del problema: cómo absorber ese tráfico **del lado de los servidores de aplicación**, los que ejecutan el código de la aplicación en sí.

## El problema: un solo servidor tiene una capacidad limitada

Un servidor de aplicación solo puede procesar un número finito de peticiones simultáneas, limitado por su potencia de cálculo y su memoria. Dos formas de aumentar esta capacidad:

| | Escalado vertical | Escalado horizontal |
|---|---|---|
| Principio | Una máquina más potente (más CPU, más memoria) | Varias máquinas idénticas en paralelo |
| Techo | Limitado por la máquina más grande disponible en el mercado | Prácticamente ilimitado (añadir una máquina más) |
| Coste de una caída | Una caída de esta máquina única detiene todo el servicio | La pérdida de una máquina entre varias no detiene el servicio |

El escalado horizontal se prefiere en cuanto se espera un tráfico importante, precisamente porque no tiene un techo fijo y tolera el fallo de una máquina.

## El balanceador de carga (load balancer)

Una vez disponibles varios servidores idénticos, cada petición entrante debe dirigirse a uno de ellos: ese es el papel del **balanceador de carga** (*load balancer*), situado entre los usuarios y los servidores.

```text
                    ┌──► Servidor 1
Usuarios ──► Balanceador ──► Servidor 2
                    └──► Servidor 3
```

| Estrategia de reparto | Principio |
|---|---|
| *Round-robin* | Distribuye las peticiones a los servidores por turnos, en orden |
| *Least connections* | Envía la petición al servidor que actualmente procesa menos peticiones en curso |

El balanceador también vigila la salud de cada servidor (un **health check**, una petición de prueba enviada periódicamente): un servidor que deja de responder se retira automáticamente de la rotación, sin intervención humana, hasta que vuelve a estar disponible.

> **Trampa:** repartir las peticiones de un mismo usuario entre servidores diferentes, suponiendo que cada servidor guarda en memoria lo relativo a ese usuario (su sesión). El capítulo [JWT y tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) ya detalla este problema y su solución: no depender de la memoria de un servidor concreto, precisamente para que cualquier servidor detrás del balanceador pueda procesar cualquier petición indistintamente.

## El autoscaling: ajustar el número de servidores automáticamente

Aprovisionar de antemano suficientes servidores para absorber el pico de tráfico más alto imaginable desperdicia dinero el resto del tiempo, cuando esos servidores funcionan ampliamente infrautilizados. El **autoscaling** (escalado automático) resuelve este compromiso: el número de servidores activos se ajusta automáticamente a la carga real, medida en continuo (uso de CPU, número de peticiones en espera...).

```text
Carga medida en continuo
   |
   ├─ supera un umbral (ej: CPU > 70% durante 5 min)  -> anade un servidor
   |
   └─ vuelve a bajar de un umbral bajo                -> retira un servidor
```

Un pico de tráfico repentino (un anuncio viral, un pico de pedidos) desencadena así la adición automática de servidores adicionales, y luego su retirada una vez pasado el pico, sin que un humano tenga que vigilar el tráfico permanentemente ni adivinar su intensidad de antemano.

> **Trampa:** creer que el autoscaling reacciona instantáneamente. Iniciar un nuevo servidor (asignar la máquina, desplegar la aplicación en ella, arrancarla) lleva tiempo, de unos segundos a varios minutos según los casos: un pico tan brusco que duplica el tráfico en pocos segundos puede saturar los servidores existentes antes de que los nuevos terminen de arrancar.
>
> **Buena práctica:** mantener un margen de capacidad disponible permanentemente (nunca hacer funcionar los servidores existentes al 100 % de su capacidad justo antes de desencadenar la adición de uno nuevo), y prever una degradación progresiva del servicio (responder más lento, desactivar una funcionalidad secundaria) en lugar de una caída completa si un pico supera de todos modos la velocidad de escalado.

## Resumen

| | |
|---|---|
| **Para recordar** | El escalado horizontal (varios servidores idénticos) en lugar del vertical (una máquina más grande) permite absorber un tráfico importante sin techo fijo. Un balanceador de carga distribuye las peticiones entre estos servidores y retira automáticamente los que dejan de responder. El autoscaling ajusta su número a la carga real medida en continuo. |
| **Herramientas utilizables** | Un balanceador de carga con health checks integrados; un servicio de autoscaling ofrecido por la mayoría de los [proveedores cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud). |
| **Trampas a evitar** | Repartir las peticiones de un usuario entre servidores que dependen de su propia memoria local. Esperar del autoscaling una reacción instantánea ante un pico brusco. |
| **Buenas prácticas** | Mantener un margen de capacidad permanente. Prever una degradación progresiva en lugar de una caída completa en caso de pico que supere la velocidad de escalado. |
