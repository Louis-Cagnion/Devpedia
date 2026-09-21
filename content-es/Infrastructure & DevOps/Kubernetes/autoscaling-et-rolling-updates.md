---
order: 4
---

# Autoscaling y rolling updates

## Autoscaling: ajustar el número de pods a la carga real

Un [Deployment](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) declara un número fijo de réplicas, pero el tráfico real varía en el tiempo. El **autoscaling** ajusta automáticamente ese número según una métrica vigilada (el uso de CPU, lo más común):

```text
CPU medio de los pods sube    -> Kubernetes anade pods
CPU medio de los pods baja    -> Kubernetes retira pods
```

El principio sigue siendo el mismo que el ya visto para un [autoscaling genérico](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge): añadir capacidad solo cuando realmente sirve, nunca de forma permanente "por si acaso".

## Rolling update: entregar una nueva versión sin corte

Reemplazar todas las copias de una aplicación de golpe cortaría el servicio durante el reinicio. Un **rolling update** reemplaza los pods progresivamente: nuevos pods (nueva versión) arrancan y deben volverse sanos antes de que se retire un número equivalente de pods antiguos, nunca al revés:

```text
Estado inicial : [v1] [v1] [v1]
Etapa 1        : [v2] [v1] [v1]   (v2 arranca y se vuelve sano)
Etapa 2        : [v2] [v2] [v1]   (se retira un v1 antiguo)
Estado final   : [v2] [v2] [v2]
```

En ningún momento el número total de pods sanos baja de lo necesario para servir el tráfico: el servicio sigue respondiendo durante toda la actualización.

> **Buena práctica:** si una nueva versión resulta defectuosa una vez desplegada, un rollback vuelve a la versión anterior siguiendo exactamente el mismo mecanismo progresivo, en sentido inverso.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El autoscaling ajusta el número de pods de un Deployment a una métrica real (el uso de CPU, lo más común). Un rolling update reemplaza los pods progresivamente, una nueva versión solo se vuelve activa una vez sana, sin cortar nunca el servicio. Un rollback sigue el mismo mecanismo, en sentido inverso. |
| **Herramientas utilizables** | `kubectl rollout status`/`kubectl rollout undo` para seguir o anular un rolling update en curso. |
| **Trampas a evitar** | Reemplazar todos los pods de golpe en lugar de progresivamente, lo que corta el servicio durante el reinicio. |
| **Buenas prácticas** | Dejar que Kubernetes verifique que un nuevo pod está sano antes de retirar el antiguo al que reemplaza. Usar un rollback en lugar de una corrección de urgencia si una nueva versión resulta defectuosa. |
