---
order: 7
---

# Contenedores gestionados en la nube: ECS y Fargate

[Docker](/?c=infrastructure-devops&s=docker&p=docker) permite empaquetar una aplicación en un [contenedor](/?c=infrastructure-devops&s=docker&p=concepts-de-base) y ejecutarlo en cualquier lugar. Pero ejecutar ese contenedor en producción, de verdad, plantea una pregunta que Docker por sí solo no resuelve: ¿en qué máquina, durante cuánto tiempo, y quién reinicia el contenedor si falla a las 3 de la madrugada? Un **servicio de contenedores gestionados** responde a esta pregunta confiando toda o parte de esta gestión a un proveedor [cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud).

## El problema: Docker no gestiona la producción por ti

Ejecutar uno mismo contenedores Docker en producción supone gestionar, de forma continua:

| Responsabilidad | Detalle |
|---|---|
| Los servidores subyacentes | Aprovisionarlos, actualizarlos, sustituir una máquina defectuosa |
| La ubicación de los contenedores | Decidir qué contenedor se ejecuta en qué máquina, según la carga |
| La resiliencia | Reiniciar automáticamente un contenedor que falla o deja de responder |
| El aumento de capacidad | Añadir contenedores (o máquinas) si el tráfico aumenta |

Un servicio como **Amazon ECS** (*Elastic Container Service*) se encarga de estos cuatro puntos: se le proporciona una imagen de contenedor (el resultado de un [Dockerfile](/?c=infrastructure-devops&s=docker&p=dockerfile)), y él se ocupa de ejecutarla, vigilarla y relanzarla si es necesario.

## Dos formas de ejecutar ECS: con o sin gestionar los servidores

El capítulo sobre [el cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) distingue IaaS (el proveedor solo gestiona el hardware, tú gestionas el resto) y PaaS (el proveedor también gestiona el entorno de ejecución). ECS ofrece exactamente esta elección, en forma de dos "modos de lanzamiento":

| | ECS sobre EC2 | ECS sobre [Fargate](https://aws.amazon.com/fargate/) |
|---|---|---|
| ¿Quién gestiona los servidores subyacentes? | Tú (elección del tipo de máquina, actualización) | Amazon, por completo |
| Lo que tú proporcionas | La imagen del contenedor + las máquinas a ejecutar | Únicamente la imagen del contenedor |
| Facturación | Por la máquina alquilada, usada o no | Por el contenedor realmente usado (CPU/memoria, por segundo) |
| Cercano a | IaaS | PaaS |

> **Analogía:** ECS sobre EC2 es alquilar un local comercial vacío e instalar uno mismo las estanterías; Fargate es alquilar un stand ya equipado, listo para recibir la mercancía, sin tener que ocuparse nunca del local en sí.

Otros proveedores ofrecen servicios equivalentes a Fargate (Google Cloud Run, Azure Container Apps): el principio —proporcionar un contenedor, no gestionar nunca la máquina subyacente— sigue siendo el mismo de un proveedor a otro.

> **Trampa:** creer que un servicio gestionado exime de toda reflexión sobre el dimensionamiento. Aun así hay que indicar cuánta memoria y potencia de cálculo asignar a cada contenedor, y cuántas réplicas ejecutar en paralelo: un mal dimensionamiento sigue siendo posible, solo desaparece la gestión física de las máquinas.
>
> **Buena práctica:** empezar por Fargate por defecto (ninguna máquina que gestionar, facturación lo más cercana posible al uso real) y pasar a ECS sobre EC2 solo si una necesidad concreta lo exige (acceso a un hardware específico, optimización fina de costes en un uso constante y previsible).

## Resumen

| | |
|---|---|
| **Para recordar** | ECS ejecuta contenedores Docker en producción en lugar del desarrollador (ubicación, reinicio, aumento de capacidad). Fargate va más allá suprimiendo incluso la gestión de las máquinas subyacentes. |
| **Herramientas utilizables** | [Amazon ECS](https://aws.amazon.com/ecs/) y [Fargate](https://aws.amazon.com/fargate/); equivalentes en otros proveedores (Google Cloud Run, Azure Container Apps). |
| **Trampas a evitar** | Creer que un servicio gestionado exime de dimensionar correctamente cada contenedor. |
| **Buenas prácticas** | Empezar con un servicio totalmente gestionado (tipo Fargate) y gestionar uno mismo las máquinas solo si una necesidad concreta lo justifica. |
