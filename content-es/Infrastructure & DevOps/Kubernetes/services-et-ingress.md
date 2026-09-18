---
order: 2
---

# Service e Ingress: enrutar el tráfico hacia los pods

## El problema: los pods no son objetivos estables

Un [pod](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) puede ser destruido y recreado en cualquier momento (fallo, actualización, migración), y recibe entonces una nueva dirección IP. Un cliente que contactara directamente la IP de un pod perdería la conexión en cuanto ese pod desaparezca.

## Service: un punto de entrada estable

Un **Service** es un punto de entrada de red estable (una IP y un nombre que nunca cambian) colocado delante de un grupo de pods. Reparte el tráfico recibido entre los pods actualmente sanos, sean cuales sean sus idas y venidas:

```text
Cliente --> Service (direccion estable) --> Pod 1 (sano)
                                         --> Pod 2 (sano)
                                         --> Pod 3 (reiniciando, excluido)
```

El Service detecta automáticamente qué pods están sanos y excluye los que no lo están, sin cambiar nunca su propia dirección.

## Ingress: enrutar por nombre de dominio

Un cluster suele alojar varias aplicaciones detrás de Services distintos. El **Ingress** enruta el tráfico entrante hacia el Service correcto según el nombre de dominio solicitado:

| Dominio solicitado | Service destino |
|---|---|
| `app.ejemplo.com` | Service del frontend |
| `api.ejemplo.com` | Service del backend |

Sin Ingress, cada Service tendría que exponer su propia dirección pública separada; el Ingress centraliza ese enrutamiento en un único punto de entrada para todo el cluster.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Los pods cambian de dirección IP constantemente (fallo, actualización, migración): un Service les da una dirección estable y reparte el tráfico entre los sanos. Un Ingress enruta después el tráfico entrante hacia el Service correcto según el dominio solicitado. |
| **Herramientas utilizables** | `kubectl get services`/`kubectl get ingress` para listar los puntos de entrada de un cluster. |
| **Trampas a evitar** | Hacer depender a un cliente de la IP directa de un pod en lugar de la, estable, del Service. |
| **Buenas prácticas** | Pasar siempre por un Service para alcanzar un grupo de pods; usar un Ingress en cuanto varias aplicaciones compartan el mismo cluster. |
