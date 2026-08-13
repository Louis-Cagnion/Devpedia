---
order: 1
---

# Basic Concepts

## Container vs. Virtual Machine

A **virtual machine** (VM) virtualizes hardware: it runs its own kernel and boots up like a full-fledged computer, which makes it resource-intensive (several GB, taking tens of seconds to boot) but completely isolated from the host. A **container** is lighter: it is a standard process on the host system that **shares the** host’s **kernel** but runs in an environment isolated from the rest of the system.

```text
Machine virtuelle      Conteneur
┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Application   │
├─────────────────┤    ├─────────────────┤
│  Bibliothèques  │    │  Bibliothèques  │
├─────────────────┤    ├─────────────────┤
│  Noyau invité   │    │  Moteur Docker  │
├─────────────────┤    ├─────────────────┤
│   Hyperviseur   │    │ Noyau de l'hôte │
├─────────────────┤    └─────────────────┘
│ Noyau de l'hôte │
└─────────────────┘
```

**The hypervisor** is the software layer that creates and manages virtual machines by allocating physical resources (CPU, memory) among them—it is this additional layer, which is absent in a container, that explains the difference in size between the two approaches.

> **Direct consequence:** a Linux container cannot run natively on Windows or macOS—[Docker Desktop](https://docs.docker.com/desktop/) actually launches a small Linux VM on those platforms to host the containers. On a Linux server, however, no virtualization layer is required.

## Under the Hood: Namespaces and cgroups

Container isolation relies on two mechanisms in the Linux kernel, not on a technology specific to Docker:

- **Namespaces** isolate what a process *sees*: its own process tree (it believes it is PID 1), its own file system, its own network interface... A process in one namespace cannot see or affect what is happening in another namespace.
- **Cgroups** (*control groups*) limit what a process *can consume*: CPU, memory, and disk bandwidth. This is what prevents a container from exhausting all the host machine's resources.

Docker orchestrates these two mechanisms, which are already present in the kernel, to create the illusion of an isolated machine at a lower cost.

## Image vs. Container

An **image** is an immutable, read-only template: a fixed filesystem (a minimal distribution, installed dependencies, and the application code) plus metadata (command to run at startup, exposed ports, etc.). A **container** is a running instance of this image, with a thin writable layer added on top.

```text
Image (lecture seule)  -->  docker run  -->  Conteneur (image + couche inscriptible + processus)
```

A single image can therefore launch multiple independent containers, each with its own writable layer—modifying a container never alters the image from which it was created.

## Images are built in layers

An image is built up in **layers**, each corresponding to an instruction in the [Dockerfile](/?c=docker&p=dockerfile): install a package, copy code, etc. These layers are shared and cached across images: if two images share their first layers (e.g., the same base image), Docker stores and downloads them only once.

> **Note:** This is automatic content-based deduplication, based on the same principle as [Git object storage](/?c=git&p=architecture-interne)—two identical layers produce the same identifier and are never duplicated on disk.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A container is an isolated process (namespaces + cgroups) that shares the host’s kernel—lighter than a virtual machine, which virtualizes the entire hardware. An image is an immutable, layered template; a container is a running instance of that image. |
| **Tools** | No specific commands here—this chapter introduces the terminology (image, container, namespace, cgroup) that is reused in all subsequent chapters. |
| **Pitfalls to Avoid** | Confusing an image with a container — modifying a container never modifies the image from which it was created. |
| **Best Practices** | Understand that container isolation relies on the Linux kernel (namespaces/cgroups), not on a technology specific to Docker, to better assess its security limitations. |
