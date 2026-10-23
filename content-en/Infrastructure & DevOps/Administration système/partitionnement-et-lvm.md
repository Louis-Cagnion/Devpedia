---
order: 2
---

# Partitioning and LVM

Once [the operating system is chosen](/?c=administration-systeme&p=virtualisation-et-choix-dos), installing it requires deciding how to organize the available disk space. This chapter covers classic partitioning and its alignment, encrypting it, and LVM, a tool that makes this organization more flexible.

## Partitioning: splitting a disk into independent zones

A physical disk can be split into several **partitions**, each treated by the system as a separate disk, with its own filesystem and its own mount point (the location where its content appears in the directory tree, see [File structure and paths](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Physical disk (500 GB)
┌─────────────────┬──────────────────────────┐
│  /boot (1 GB)    │   / (root, 100 GB)       │  ...at least 2 partitions
└─────────────────┴──────────────────────────┘
```

Separating, for instance, `/` (the system) from `/home` (user data) onto two distinct partitions isolates the two: a `/` that fills up entirely (logs, updates) doesn't block writing new user data to `/home`, and reinstalling the system can be limited to the `/` partition without touching user data.

## Aligning partitions: starting on a disk boundary

A disk does not read and write byte by byte, but in **blocks**. Three sizes coexist, and they must be told apart:

| Word | Definition | Usual size |
|---|---|---|
| **Sector** | the smallest numbered unit of the disk, the one `fdisk` and the partition table count in | 512 bytes |
| **Physical block** | what the disk really reads or writes in a single operation (see [storage](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | 4 KiB, i.e. 8 sectors |
| **Filesystem block** | the storage unit of the **filesystem** (the way a partition organizes its files, for example `ext4`) | 4 KiB |

A partition is **aligned** when its first sector (its `Start` column) falls on the start of a physical block. By convention, we aim for a multiple of **2048 sectors**, i.e. 1 MiB: it is also a multiple of 8 sectors, hence of the size of a physical block, and it is the value `fdisk` proposes by default.

```text
Example on an imaginary disk (8 sectors per physical block):

ALIGNED partition (start at sector 8, a multiple of 8)
physical block:   |   block 1  |   block 2  |   block 3  |
filesystem block: |    FS 0    |    FS 1    |    FS 2    |
→ one filesystem block = one physical block: 1 write

MISALIGNED partition (start at sector 5)
physical block:   |   block 1  |   block 2  |   block 3  |
filesystem block:      |    FS 0    |    FS 1    |    FS 2    |
→ every filesystem block overlaps 2 physical blocks
```

In the misaligned case, writing a single filesystem block forces the disk to **read** the two physical blocks involved, modify the relevant part, then **rewrite** both: three to four operations instead of one. Nothing crashes and the data stays correct: the loss is in performance, and it is not visible in everyday use.

### Checking a start

```bash
sudo fdisk -l /dev/sdb          # shows the partition table of disk sdb (Start column, in sectors)
echo $(( 73402368 % 2048 ))     # % gives the remainder of the division: 0 means "multiple of 2048", so aligned
echo $(( 73402369 % 2048 ))     # remainder 1: start shifted by one sector, so not aligned
```

| Start | Remainder of the division by 2048 | Verdict |
|---|---|---|
| 2048 | 0 | aligned |
| 10487808 | 0 | aligned |
| 73402368 | 0 | aligned |
| 73402369 | 1 | shifted by one sector |
| 63 (historical start inherited from DOS) | 63 | misaligned |

### When alignment is decided

Alignment is fixed **when the partition table is created**: it is the table that records the `Start` values. Formatting (`mkfs`), mounting or copying files moves no start: you can see it by running `fdisk -l` again before and after a `mkfs`, the `Start` values do not change. So it is before formatting that you must check.

The start proposed by default by `fdisk` is convenient but not infallible (a disk prepared with an old tool can make it propose `63`): accept it, then check the `Start` column.

### Fixing a misalignment: delete, recreate, reformat

Moving the start of a partition changes where each structure of the filesystem is located, because they are all located **from the start of the partition**. For example, the `ext4` **superblock** (the area that describes the filesystem: size, type, magic number `0xEF53`) is 1024 bytes, i.e. 2 sectors, from the start. Shifting the partition by one sector makes it read in the wrong place: the old filesystem becomes unreadable, and it must be recreated with `mkfs`.

| Partition | Start before | Start after | What `fdisk` reports when recreating |
|---|---|---|---|
| `sdb3` | 10487808 | 10487808 (unchanged) | `ext4` signature detected: it offers to wipe it |
| `sdb4` | 73402369 | 73402368 | nothing: it looks for the superblock 2 sectors after the **new** start, i.e. one sector before the one of the old filesystem |

A signature that is no longer detected does not mean the old data has disappeared: it is still on the disk until `mkfs`.

> **Limits:**
> - Realigning a partition that already contains files requires deleting it, recreating it and reformatting it: the files are lost without a backup. Hence the value of checking **before** putting anything on it.
> - On a virtual disk (for example a `QEMU` virtual machine), `fdisk` often reports 512-byte sectors, both logical and physical: the gain is not measured there. Keeping the 1 MiB alignment remains a cheap habit that avoids the problem on a real disk.
> - Alignment does not fix everything: it does not improve the disk's base speed, it only avoids losing some of it.

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
| **Key takeaways** | Partitioning splits a disk into independent zones whose start must be a multiple of 2048 sectors (alignment, decided when the table is created); LUKS encrypts a partition; LVM adds a layer (PV → VG → LV) that makes sizes adjustable after installation. |
| **Tools you can use** | LUKS for encryption, LVM (`pvcreate`, `vgcreate`, `lvcreate`) for flexible disk space management. |
| **Pitfalls to avoid** | A single, unseparated `/` partition: an incident on one zone affects the whole system. A shifted `Start` (for example `73402369`): nothing crashes, but every write touches two physical blocks. |
| **Best practices** | Check every `Start` (remainder of the division by 2048 equal to 0) before formatting. Always plan for at least 2 partitions, and stack LVM on top of a volume already encrypted with LUKS, never the other way around. |
