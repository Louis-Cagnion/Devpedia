---
order: 1
---

# Los conceptos básicos

## El problema que resuelve Kubernetes

Una aplicación en un contenedor Docker corre en un servidor. El tráfico crece: ahora hacen falta cinco copias. Una falla a las 3 de la madrugada: alguien tiene que reiniciarla a mano. El servidor se cae: los contenedores deben migrar a otro lugar. Hay que entregar una nueva versión sin cortar el servicio. Cada una de esas operaciones, hecha a mano, termina llegando demasiado tarde o nunca.

Kubernetes automatiza ese trabajo: se describe el estado deseado ("5 copias de esta aplicación, siempre"), y un controlador compara permanentemente ese **estado deseado** con el **estado real**, y corrige la diferencia en cuanto aparece. Esa es toda la filosofía de la herramienta, aplicada en cada una de sus piezas.

## Cluster, node y control plane

Un **cluster** de Kubernetes es un grupo de máquinas llamadas **nodes**. Algunos nodes ejecutan el **control plane** (el "cerebro": decide qué corre dónde), los demás ejecutan las aplicaciones en sí:

```text
Cluster
├── Control plane (decide que corre donde)
└── Nodes (ejecutan las aplicaciones)
    ├── Node 1
    ├── Node 2
    └── Node 3
```

El control plane vigila permanentemente el estado real del cluster (qué contenedores corren dónde) y lo compara con el estado deseado declarado en los archivos de configuración.

## Pod: la unidad más pequeña desplegada

Un **pod** es la unidad más pequeña que Kubernetes despliega, normalmente un solo contenedor dentro (a veces varios contenedores estrechamente ligados que comparten la misma red y el mismo almacenamiento). Nunca se despliega un contenedor Docker directamente: siempre a través de un pod que lo envuelve.

## Deployment: declarar cuántas copias y dejar que Kubernetes las mantenga

Un **Deployment** declara cuántas **réplicas** (copias) de un pod deben correr. Decir "5 réplicas" hace que Kubernetes cree 5 pods. Si uno falla, el controlador nota que solo quedan 4 y crea otro de inmediato, sin intervención humana:

```text
Estado deseado : 5 pods
Estado real    : 4 pods (uno fallo)
-> Kubernetes crea 1 pod para cerrar la diferencia
```

> **Buena práctica:** nunca crear un pod directamente en producción. Pasar por un Deployment garantiza que un pod que desaparece (fallo, migración tras una caída de node) se recree automáticamente en otro lugar del cluster.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Kubernetes compara permanentemente un estado deseado (declarado) con el estado real del cluster, y corrige la diferencia automáticamente. Un cluster agrupa nodes (control plane + nodes de ejecución). Un pod es la unidad más pequeña desplegada; un Deployment declara cuántas réplicas de un pod deben correr y las recrea si fallan. |
| **Herramientas utilizables** | `kubectl get pods`/`kubectl get deployments` para observar el estado real de un cluster. |
| **Trampas a evitar** | Crear un pod directamente en lugar de a través de un Deployment: un pod aislado que falla nunca se recrea automáticamente. |
| **Buenas prácticas** | Pasar siempre por un Deployment para beneficiarse de la autorreparación (recreación automática de un pod desaparecido). |
