---
order: 2
---

# Partitioning and LVM

Once [the operating system is chosen](/?c=administration-systeme&p=virtualisation-et-choix-dos), installing it requires deciding how to organize the available disk space. This chapter covers classic partitioning, encrypting it, and LVM, a tool that makes this organization more flexible.

## Partitioning: splitting a disk into independent zones

A physical disk can be split into several **partitions**, each treated by the system as a separate disk, with its own filesystem and its own mount point (the location where its content appears in the directory tree, see [File structure and paths](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Physical disk (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (root, 100 GB)       │  ...at least 2 partitions
└─────────────────┴──────────────────────────┘
```

Separating, for instance, `/` (the system) from `/home` (user data) onto two distinct partitions isolates the two: a `/` that fills up entirely (logs, updates) doesn't block writing new user data to `/home`, and reinstalling the system can be limited to the `/` partition without touching user data.

## Encrypting a partition

An encrypted partition protects its content if the physical disk is stolen or accessed outside the normal system (booting from another USB drive, disk removed and plugged in elsewhere): without the decryption key, its content stays unreadable. **LUKS** (*Linux Unified Key Setup*) is the Linux standard for this kind of encryption, usually prompted for at boot as a passphrase.

## LVM: a layer of flexibility between the disk and the partitions

Classic partitioning fixes the size of each partition **at install time**: growing it later is risky (often requires moving data around). **LVM** (*Logical Volume Manager*) adds an abstraction layer that makes this size adjustable after the fact:

| LVM level | Role |
|---|---|
| Physical Volume (PV) | A partition or an entire disk, as seen by LVM |
| Volume Group (VG) | A "pool" of space, formed by combining one or more PVs |
| Logical Volume (LV) | A portion of the VG, used like a classic partition (formatted, mounted) |

```text
Physical disk --> Physical Volume (PV) --\
Physical disk --> Physical Volume (PV) ----> Volume Group (VG) --> Logical Volumes (LV)
                                                                        |
                                                               /  (LV mounted on /)
                                                               /home  (LV mounted on /home)
```

A logical volume can be grown by drawing on the volume group's remaining free space, with no reinstallation or physical data movement needed: this flexibility justifies LVM even on a single server, not just in a multi-disk setup.

> **Note:** LVM and encryption combine by stacking layers: the physical disk is first encrypted with LUKS, then LVM is configured **on top of** that already-encrypted volume. Every logical volume then inherits the encryption without having to configure it individually.

> **Pitfall:** creating a single large `/` partition without thinking about the split: an incident (logs filling up the disk, for instance) then affects the entire system rather than an isolated zone.
>
> **Best practice:** plan for at least 2 partitions from the start (typically `/` and `/home`, or `/` and `/boot`), and use LVM to keep the option of resizing them later without reinstalling.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Partitioning splits a disk into independent zones; LUKS encrypts a partition; LVM adds a layer (PV → VG → LV) that makes sizes adjustable after installation. |
| **Tools you can use** | LUKS for encryption, LVM (`pvcreate`, `vgcreate`, `lvcreate`) for flexible disk space management. |
| **Pitfalls to avoid** | A single, unseparated `/` partition: an incident on one zone affects the whole system. |
| **Best practices** | Always plan for at least 2 partitions, and stack LVM on top of a volume already encrypted with LUKS, never the other way around. |
