---
order: 1
---

# The Basic Concepts

## The problem Kubernetes solves

An application in a Docker container runs on one server. Traffic grows: five copies of it are now needed. One crashes at 3am: someone has to restart it by hand. The server goes down: the containers have to move somewhere else. A new version has to ship without downtime. Each of these operations, done by hand, eventually arrives too late or not at all.

Kubernetes automates this work: you describe the desired state ("5 copies of this app, always"), and a controller continuously compares this **desired state** to the **actual state**, and corrects the gap as soon as it appears. That's the whole philosophy of the tool, expressed in each of its building blocks.

## Cluster, node, and control plane

A Kubernetes **cluster** is a group of machines called **nodes**. Some nodes run the **control plane** (the "brain": it decides what runs where), the others run the applications themselves:

```text
Cluster
├── Control plane (decides what runs where)
└── Nodes (run the applications)
    ├── Node 1
    ├── Node 2
    └── Node 3
```

The control plane continuously monitors the cluster's actual state (which containers run where) and compares it to the desired state declared in configuration files.

## Pod: the smallest deployed unit

A **pod** is the smallest unit Kubernetes deploys, usually a single container inside (sometimes several tightly coupled containers sharing the same network and storage). You never deploy a Docker container directly: always through a pod that wraps it.

## Deployment: declare how many copies and let Kubernetes maintain them

A **Deployment** declares how many **replicas** (copies) of a pod should run. Saying "5 replicas" makes Kubernetes create 5 pods. If one crashes, the controller notices only 4 remain and immediately recreates one, with no human intervention:

```text
Desired state : 5 pods
Actual state  : 4 pods (one crashed)
-> Kubernetes creates 1 pod to close the gap
```

> **Best practice:** never create a pod directly in production. Going through a Deployment guarantees a pod that disappears (crash, migration after a node failure) gets automatically recreated elsewhere in the cluster.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Kubernetes continuously compares a desired state (declared) to the cluster's actual state, and automatically corrects the gap. A cluster groups nodes (control plane + worker nodes). A pod is the smallest deployed unit; a Deployment declares how many replicas of a pod should run and recreates them on failure. |
| **Tools you can use** | `kubectl get pods`/`kubectl get deployments` to observe a cluster's actual state. |
| **Pitfalls to avoid** | Creating a pod directly instead of through a Deployment: an isolated pod that crashes is never automatically recreated. |
| **Best practices** | Always go through a Deployment to benefit from self-healing (automatic recreation of a disappeared pod). |
