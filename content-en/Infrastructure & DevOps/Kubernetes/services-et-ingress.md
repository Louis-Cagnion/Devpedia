---
order: 2
---

# Service and Ingress: Routing Traffic to Pods

## The problem: pods aren't stable targets

A [pod](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) can be destroyed and recreated at any time (crash, update, migration), and gets a new IP address each time. A client contacting a pod's IP directly would lose the connection as soon as that pod disappears.

## Service: a stable entry point

A **Service** is a stable network entry point (an IP and a name that never change) placed in front of a group of pods. It spreads incoming traffic across the pods currently healthy, regardless of their comings and goings:

```text
Client --> Service (stable address) --> Pod 1 (healthy)
                                     --> Pod 2 (healthy)
                                     --> Pod 3 (restarting, excluded)
```

The Service automatically detects which pods are healthy and excludes those that aren't, without ever changing its own address.

## Ingress: routing by domain name

A cluster often hosts several applications behind different Services. **Ingress** routes incoming traffic to the right Service based on the requested domain name:

| Requested domain | Target Service |
|---|---|
| `app.example.com` | Frontend Service |
| `api.example.com` | Backend Service |

Without Ingress, each Service would need to expose its own separate public address; Ingress centralizes this routing into a single entry point for the whole cluster.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Pods keep changing IP address (crash, update, migration): a Service gives them a stable address and spreads traffic across the healthy ones. An Ingress then routes incoming traffic to the right Service based on the requested domain name. |
| **Tools you can use** | `kubectl get services`/`kubectl get ingress` to list a cluster's entry points. |
| **Pitfalls to avoid** | Making a client depend on a pod's direct IP address instead of the Service's stable one. |
| **Best practices** | Always go through a Service to reach a group of pods; use an Ingress as soon as several applications share the same cluster. |
