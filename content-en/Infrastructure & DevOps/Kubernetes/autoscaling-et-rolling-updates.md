---
order: 4
---

# Autoscaling and Rolling Updates

## Autoscaling: adjusting the number of pods to actual load

A [Deployment](/?c=infrastructure-devops&s=kubernetes&p=concepts-de-base) declares a fixed number of replicas, but real traffic varies over time. **Autoscaling** automatically adjusts that number based on a monitored metric (CPU usage, most commonly):

```text
Average pod CPU goes up   -> Kubernetes adds pods
Average pod CPU goes down -> Kubernetes removes pods
```

The principle stays the same as the [generic autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) already covered: add capacity only when it's actually needed, never permanently "just in case".

## Rolling update: shipping a new version without downtime

Replacing every copy of an application at once would cut the service off during the restart. A **rolling update** replaces pods progressively: new pods (the new version) start and must become healthy before an equal number of old pods gets removed, never the other way around:

```text
Initial state : [v1] [v1] [v1]
Step 1        : [v2] [v1] [v1]   (v2 starts and becomes healthy)
Step 2        : [v2] [v2] [v1]   (one old v1 gets removed)
Final state   : [v2] [v2] [v2]
```

At no point does the total number of healthy pods drop below what's needed to serve traffic: the service keeps responding throughout the whole update.

> **Best practice:** if a new version turns out to be faulty once deployed, a rollback returns to the previous version following the exact same progressive mechanism, in reverse.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Autoscaling adjusts a Deployment's pod count to a real metric (CPU usage, most commonly). A rolling update replaces pods progressively, a new version only becoming active once healthy, never cutting off the service. A rollback follows the same mechanism, in reverse. |
| **Tools you can use** | `kubectl rollout status`/`kubectl rollout undo` to track or cancel an ongoing rolling update. |
| **Pitfalls to avoid** | Replacing every pod at once instead of progressively, which cuts off the service during the restart. |
| **Best practices** | Let Kubernetes verify a new pod is healthy before removing the old one it replaces. Use a rollback rather than an emergency fix if a new version turns out to be faulty. |
