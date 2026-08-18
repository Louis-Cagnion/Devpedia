---
order: 1
---

# Virtualization and Choosing an OS

Administering a Linux server starts before you even type a single command: you first need a machine to install it on, and a distribution to run on it. This chapter covers those two upfront decisions; the following ones assume a system is already installed and accessible.

## Creating the machine: a type 2 hypervisor

Without a dedicated physical server, a [virtual machine](/?c=docker&p=concepts-de-base) (VM) simulates a complete computer inside your own workstation, via a **hypervisor**. Two common pieces of software for this local use case:

| Software | Host platform | Notable trait |
|---|---|---|
| [VirtualBox](https://www.virtualbox.org/) | Windows, macOS, Linux | Free, open source, widely used, supports many guest operating systems |
| [UTM](https://mac.getutm.app/) | macOS (Apple Silicon and Intel) | Relies on Apple's native hypervisor, more performant than VirtualBox on recent Macs |

> **Note:** both are **type 2** hypervisors (installed like an ordinary application on top of an already-present operating system), as opposed to a type 1 hypervisor (installed directly on the hardware, with no host system, used more in production environments).

## Choosing a distribution: Debian or Rocky Linux

The distribution you install in the VM determines which tools you'll have available going forward (package manager, mandatory access control, see [SELinux vs AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor)):

| | Debian | Rocky Linux |
|---|---|---|
| Origin | Independent community distribution | Community rebuild of Red Hat Enterprise Linux (RHEL) |
| Package manager | `apt` (`.deb`) | `dnf` (`.rpm`) |
| Mandatory access control | [AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor) | [SELinux](/?c=administration-systeme&p=selinux-vs-apparmor) |
| Default firewall | [UFW](/?c=administration-systeme&p=pare-feu-ufw-firewalld) | [firewalld](/?c=administration-systeme&p=pare-feu-ufw-firewalld) |
| Strengths | Large community, frequent updates, extensively documented | Compatible with the RHEL ecosystem (used in enterprises), long support cycle |
| Trade-offs | Less "enterprise"-oriented than RHEL/Rocky | Slightly steeper learning curve (SELinux is stricter than AppArmor by default) |

Neither one is objectively "better": Debian favors simplicity and a very large community, Rocky Linux favors closeness to a real enterprise environment (RHEL is widely used in production). The choice mostly depends on your goal: learning "generic" system administration (Debian) or getting closer to the practices of a company running RHEL (Rocky).

> **Pitfall:** installing one distribution, then mixing in instructions found online for the other (e.g. using `apt` on Rocky Linux): the two distribution families have different tools and configuration paths, rarely interchangeable.
>
> **Best practice:** once you've chosen a distribution, stay consistent with its ecosystem (package manager, that distribution's official documentation) rather than mixing sources of information meant for the other family.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A type 2 hypervisor (VirtualBox, UTM) lets you create a VM on an existing workstation; Debian and Rocky Linux are two distribution families with different tools (`apt`/AppArmor/UFW vs `dnf`/SELinux/firewalld). |
| **Tools you can use** | VirtualBox (cross-platform) or UTM (macOS) to create the VM; `apt` or `dnf` depending on the chosen distribution. |
| **Pitfalls to avoid** | Mixing commands or documentation meant for the other distribution family. |
| **Best practices** | Choose the distribution based on your goal (generic learning vs. closeness to an enterprise RHEL environment), then stay consistent with its ecosystem. |
