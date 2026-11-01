---
order: 11
---

# QEMU, KVM and qcow2 Disks (31/10/2026)

The chapter [Virtualization and Choosing an OS](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) presents hypervisors (the software that creates and runs **virtual machines**, or VMs: computers simulated by a program, with their own processor, memory and disks; see [Docker's basic concepts](/?c=infrastructure-devops&s=docker&p=concepts-de-base) to compare them with containers) with windows, operated with the mouse. This chapter does the same thing on the **command line** (you operate a program by typing commands rather than clicking through menus), with the most widely used tool on Linux: [**QEMU**](https://www.qemu.org/). It also explains what a virtual disk is, how to take **snapshots** (photos of a machine's state), and why a snapshot is not a backup.

The real computer that runs the VM is called the **host**; the system that runs **inside** the VM is called the **guest**. The word "host" has a second meaning, explained in the section [The two meanings of the word "host"](#the-two-meanings-of-the-word-host).

All commands are typed in a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). The outputs copied below were obtained on a real Linux machine, with QEMU installed from the packages (the packaged programs) of the distribution (the Linux variant used, see [Virtualization and Choosing an OS](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos)).

> **Analogy:** an actor playing the role of a computer. **The actor** (QEMU) plays the virtual machine: without help, he has to mimic everything with props, which is faithful but slow. **The real hardware lent by KVM** lets him perform the main gestures for real, so much faster. The **photo album** (the snapshots) lets you go back to the state of the machine before the last failed adjustment.

## QEMU and KVM: who does what

The two names refer to two different building blocks, often cited together.

| | QEMU | KVM |
|---|---|---|
| Full name | *Quick EMUlator* | [*Kernel-based Virtual Machine*](https://www.linux-kvm.org/) |
| Nature | An ordinary program, started by the user | A function of the Linux **kernel** (the central program that manages the hardware, see [Computer Components and How a Computer Boots](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) |
| Role | **Simulates the machine**: disks, screen, keyboard, network, motherboard | **Speeds up** the simulation by letting the real processor run the guest's code |
| Without the other | Works, but slowly: it imitates the processor in software | Useless alone: QEMU is what uses it |
| File or program | `qemu-system-x86_64` | the special file `/dev/kvm` |

The `qemu-system-x86_64` program simulates a 64-bit computer of the x86 family (the processors of Intel and AMD; see [The processor](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#the-processor)). There is one program per processor family (`qemu-system-aarch64` for ARM processors, those found in phones and many recent Macs, for example).

The file `/dev/kvm` is a "special file": it contains no data, it is a gateway to KVM that programs open to talk to it (the `/dev` directory groups these gateways to the hardware and the kernel).

Without KVM, QEMU works in **tcg** mode (*Tiny Code Generator*, QEMU's software translator). This is **emulation**: imitating hardware by running it in software, instruction by instruction (an **instruction** is an elementary order executed by the processor, such as adding two numbers). Faithful, but slow.

```text
Without KVM (tcg mode, software emulation)

 guest ──► QEMU translates each instruction ──► real processor
            (slow: a translation job at every step)

With KVM

 guest ──► the real processor runs the guest's code directly
            QEMU only handles the rest: disks, screen, network
            (fast: almost the speed of a real machine)
```

### Checking whether KVM is available

```bash
# grep searches for a pattern in a file; -c shows the number of matching lines instead
# of the lines; -E allows the "or" (|) in the pattern; /proc/cpuinfo is a virtual file
# (the kernel exposes the processor description there, nothing is stored on the disk);
# vmx (Intel) or svm (AMD) announces virtualization, one line per core
grep -c -E 'vmx|svm' /proc/cpuinfo
ls -l /dev/kvm                            # -l: detailed list; is KVM present?
# [ -w file ]: true if I have the right to write to it; &&: the next command runs
# only if the previous one succeeded; ||: only if it failed
[ -w /dev/kvm ] && echo yes || echo no
```

These commands are detailed in [basic commands](/?c=langages&s=bash&p=commandes-de-base) and [conditions](/?c=langages&s=bash&p=conditions).

Output obtained:

```text
16
crw-rw----+ 1 root kvm 10, 232 Oct 31 20:27 /dev/kvm
yes
```

Reading the line `crw-rw----+ 1 root kvm 10, 232 ...`: `c` marks a special file; `rw-rw----` gives the rights (read and write for the owner, read and write for the group, nothing for the others; see [permissions and files](/?c=langages&s=bash&p=permissions-et-fichiers)); `root kvm` are the owner and the group; `10, 232` are internal numbers of the kernel, of no importance here.

| Finding | Meaning | What to do |
|---|---|---|
| The first number is `0` (no line) | The processor does not announce virtualization, or it is disabled in the motherboard setting (the firmware, see [BIOS and UEFI](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#the-firmware-bios-and-uefi)) | No KVM: use `-accel tcg` |
| `/dev/kvm` does not exist | The KVM module (a piece of the kernel loaded on demand) is not loaded, or the machine is itself a VM that does not expose virtualization | Same |
| `/dev/kvm` exists but `no` | The file belongs to the `kvm` group (see [permissions and files](/?c=langages&s=bash&p=permissions-et-fichiers)) and the user is not in that group | Ask the administrator to add the user to the `kvm` group, then log out and log back in (groups are only reread at login) |
| `/dev/kvm` exists and `yes` | KVM is usable | `-accel kvm` |

The `+` at the end of `crw-rw----+` marks an extra access rule (an **ACL**, *Access Control List*: a list of rights granted to named users; see [the acl manual page](https://man7.org/linux/man-pages/man5/acl.5.html)): on the test machine, one user is explicitly allowed without being in the `kvm` group. The test `[ -w /dev/kvm ]` is therefore more reliable than reading the letters.

> **Pitfall:** writing `-accel kvm` on a machine without usable KVM makes the launch fail (expected behavior, not reproduced here for lack of a machine without KVM). For a script that must work everywhere, test `/dev/kvm` first and choose `kvm` or `tcg` accordingly.

## Starting a virtual machine

Two tools need to be installed. On [Debian](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) and [Ubuntu](https://www.ubuntu.com/) (two Linux distributions; see [sudo hardening](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) for `sudo`), `qemu-system-x86` provides the `qemu-system-x86_64` program, and `qemu-utils` provides `qemu-img` (the tool that creates and manipulates disks, covered further down):

```bash
# sudo: runs the command with administrator rights
# apt install: installs packages (packaged programs) on Debian and Ubuntu
# (see https://wiki.debian.org/Apt)
sudo apt install qemu-system-x86 qemu-utils
```

Before launching the machine, you need an empty disk for the guest and the installation ISO (an **ISO** is a file that contains the exact image of an installation CD or DVD). The Debian ISO is downloaded from [the official page](https://www.debian.org/distrib/); here it is renamed `debian.iso`. The disk is created like this (the qcow2 format is explained in [The virtual disk: the qcow2 format](#the-virtual-disk-the-qcow2-format)):

```bash
# creates a virtual disk: -f = format, then the file name, then the size (20G = 20 GiB)
qemu-img create -f qcow2 debian-rescue.qcow2 20G
```

A complete launch command, to install the system from the ISO:

```bash
# One option per line; the \ at the end of a line continues the command on the next one
qemu-system-x86_64 \
  -accel kvm \
  -m 2G \
  -smp 2 \
  -drive file=debian-rescue.qcow2,format=qcow2 \
  -cdrom debian.iso \
  -boot order=cd
```

| Option | Role | Note |
|---|---|---|
| `-accel kvm` | Use KVM for speed | `-accel tcg` for software emulation only; `-enable-kvm` is an equivalent shortcut for `-accel kvm` |
| `-m 2G` | **Memory** (RAM, see [RAM](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) given to the guest | `128M` for 128 MiB, `2G` for 2 GiB (see [counting information](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#counting-information-bit-byte-gb-and-gib)); this memory is taken from the host's memory |
| `-smp 2` | Number of processor **cores** (independent computing units) given to the guest | Do not exceed the number of host cores (QEMU accepts it, but the VM slows down) |
| `-drive file=...,format=...` | Plugs in a virtual hard disk, stored in a file on the host | Always give `format=` (see the section on formats) |
| `-cdrom debian.iso` | Plugs in a virtual **CD drive** that holds the ISO | The guest believes a real CD is inserted |
| `-boot order=cd` | **Trial order at boot**: one letter per type of medium | `c` = first hard disk, `d` = CD drive: here the disk first, then the CD |

A window then opens: this is the virtual machine's screen. Without other options, the installation takes place there. Two precautions: as soon as you click in the window, it "captures" the mouse (the pointer no longer leaves it); release it with `Ctrl+Alt+G` (or `Ctrl+Alt` depending on the display). And closing the window cuts the VM abruptly, like unplugging it: see [Shutting down cleanly before the snapshot](#shutting-down-cleanly-before-the-snapshot).

### Boot order: why "disk then CD"

At startup, the machine's firmware (the BIOS, see [Computer Components and How a Computer Boots](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) tries each medium in turn and takes the first one that contains a boot program.

| Step | Disk | CD | What happens |
|---|---|---|---|
| First installation | empty | installation ISO | The disk is empty, so the firmware moves on to the CD: the installer starts |
| The system is installed | contains the system | ISO still attached | The disk starts first: the installed system starts |
| If the order were `dc` | contains the system | ISO still attached | The CD would come first: you would land in the installer at every boot |

This is what makes the `cd` order convenient: the same command can be kept before and after the installation, without ever falling back into the installer by mistake. And you can still remove `-cdrom` and `-boot` once the installation is finished.

### Checking the order without downloading a distribution

No distribution was downloaded for this chapter. To see the order at work, two tiny media were built (they are not provided: this section is a demonstration, not an exercise to redo): a disk whose first sector (the first 512-byte area, which the firmware reads to boot; see [the firmware](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#the-firmware-bios-and-uefi)) is a program that writes "BOOTING FROM DISK" to the serial port, and an ISO that contains the same kind of program with the message "BOOTING FROM CD". The `timeout` command (see [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) stops a program after a delay. The **serial port** is a plain text output of the virtual machine; the `-nographic` option connects it to the terminal, instead of opening a window.

```bash
# timeout 20: stops the command after 20 seconds
# (the test program never stops by itself)
# -nographic: no window, the VM's console is shown in this terminal
# -nic none: no network card, for shorter output
timeout 20 qemu-system-x86_64 -accel kvm -m 128M -smp 2 -nographic -nic none \
  -drive file=debian-rescue.qcow2,format=qcow2 -cdrom cd.iso -boot order=cd
```

With an empty `debian-rescue.qcow2` disk (the case of a first installation), the output begins with the version of [SeaBIOS](https://www.seabios.org/), the firmware that QEMU provides to the machine:

```text
SeaBIOS (version 1.16.3-debian-1.16.3-2)
Booting from Hard Disk...
Boot failed: not a bootable disk
Booting from DVD/CD..BOOTING FROM CD
```

The disk is tried first (`Hard Disk`), rejected because it is empty (`not a bootable disk`), then the CD boots. Same command with a disk that contains a boot program:

| Command | Line that appears |
|---|---|
| bootable disk, `-boot order=cd` | `Booting from Hard Disk..BOOTING FROM DISK` |
| bootable disk, `-boot order=dc` | `Booting from DVD/CD..BOOTING FROM CD` |
| empty disk and no ISO | `Booting from Hard Disk...` then `Boot failed: not a bootable disk`, the other media fail too, and `No bootable device.` |

This last line is the message to recognize: it does not mean QEMU is broken, but that no medium has a boot program (a forgotten `-cdrom`, a misnamed ISO, a reversed `-boot` order).

> **Pitfall:** in a VM launched with `-nographic`, the keyboard of the terminal is passed to the guest, and `Ctrl+C` may not stop QEMU. The documented exit sequence is `Ctrl+A` then `X`. Hence the value of `timeout` for test runs.

## The two meanings of the word "host"

The word has two meanings, and confusing them wastes time. The book [*Linux From Scratch*](https://www.linuxfromscratch.org/lfs/) (a guide that teaches how to build a complete Linux from its sources, that is, from code written by developers, without a ready-made distribution; see [Building an Operating System, Step by Step](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation)) uses it in one sense, and virtualization uses it in another.

| | **Virtualization** host | **Build** host |
|---|---|---|
| Question it answers | On which machine does the VM run? | With which Linux do we build the new Linux? |
| It is | The real computer (or real system) that starts QEMU | An **already installed** Linux, whose compiler (the program that translates source code into an executable program) and tools are borrowed to build another one |
| Its opposite | The **guest** | The **target system** (the one being built) |
| Can it live in a VM? | No: it is the layer underneath | Yes: it is often a Linux installed **inside** the VM |

The two can overlap in the same setup, hence the confusion. In the diagram, a **process** is a program that is running (see [process management](/?c=langages&s=bash&p=gestion-des-processus)): here, the QEMU program at work. Example with invented names: a rescue Debian is installed in the VM, on a file `debian-rescue.qcow2`. For the book, this Debian is the (build) "host": it is used to build the new system on a second disk, `target-system.qcow2`. But for QEMU, this same Debian is the **guest**.

```text
┌──────────────────────────────────────────────────────────┐
│ REAL COMPUTER = virtualization host                      │
│  (it stores the three files on its disk)                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ qemu-system-x86_64 process (+ KVM)                 │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ VIRTUAL MACHINE = guest                      │  │  │
│  │  │  disk 1 ◄── debian-rescue.qcow2              │  │  │
│  │  │     contains an installed Linux:             │  │  │
│  │  │     it is the build host                     │  │  │
│  │  │  disk 2 ◄── target-system.qcow2              │  │  │
│  │  │     receives the new system being built      │  │  │
│  │  │  CD drive ◄── debian.iso (if needed)         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

> **Pitfall:** a file named `host.qcow2` does not say which host it refers to, and the confusion is real (the name pushes you to read "the build host" as "the virtualization host"). Name the disks by their **content** and role: `debian-rescue.qcow2`, `target-system.qcow2`.
>
> **Best practice:** when you read "the host" in a documentation, first ask yourself "host of what?": of the virtual machine, or of building a system.

For building a system from nothing, see [Building an Operating System, Step by Step](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation); to split the second disk, see [Partitioning and LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm).

## The virtual disk: the qcow2 format

A VM needs a hard disk. Instead of a real disk, QEMU uses a **file** on the host, which it presents to the guest as a disk: the guest writes to it as to an ordinary disk, and each write is recorded in the file. Two common formats:

| | `raw` | `qcow2` |
|---|---|---|
| Principle | A byte-for-byte copy of the disk | A QEMU format (*QEMU Copy On Write*, version 2) that only stores what has been written |
| File size | Always the full size of the virtual disk shown by `ls -l`; the space actually used (measured by `du`) can be smaller if the host's filesystem does not store empty areas (a "sparse" file) | Very small at first, it **grows** with use |
| Snapshots | No, not in the file | Yes, in the file |
| Use case | Raw performance, exchange with other tools | The common choice for working VMs |

The commands to create and read disks come from `qemu-img`.

```bash
# creates a virtual disk: -f = format, then the file name, then the size
qemu-img create -f qcow2 disk.qcow2 64M
qemu-img info disk.qcow2                  # shows the file's characteristics
# du: real space used on the host; -h: human-readable sizes (K, M, G)
du -h disk.qcow2
```

Output obtained (the `Formatting` line is shortened, and only the useful lines of `info` are kept):

```text
Formatting 'disk.qcow2', fmt=qcow2 cluster_size=65536 ... size=67108864 ...
image: disk.qcow2
file format: qcow2
virtual size: 64 MiB (67108864 bytes)
disk size: 196 KiB
cluster_size: 65536
196K	disk.qcow2
```

| Line | Meaning |
|---|---|
| `virtual size: 64 MiB` | The size **seen by the guest**: it believes it has a 64 MiB disk (MiB = mebibyte, 1,048,576 bytes, see [counting information](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#counting-information-bit-byte-gb-and-gib)) |
| `disk size: 196 KiB` | What the file **actually** takes up on the host, because nothing has been written to it yet |
| `cluster_size: 65536` | The disk is split into blocks of 64 KiB; only the blocks that have been written exist in the file |

The 64 MiB disk takes up 196 KiB: this is the property that makes `qcow2` disks economical. It has a downside: if the host disk fills up, a virtual disk that keeps growing can fail to write, even though the guest believes it still has space. The size you request is therefore a **ceiling**, not a reservation.

> **Pitfall:** forgetting `-f qcow2` when creating, or `format=qcow2` at launch. Without `-f qcow2`, `qemu-img create` makes a **raw** disk (so without snapshots). At launch, without `format=`, QEMU guesses the format; for a raw file it warns (`Image format was not specified ... probing guessed raw`) and forbids writing into the first block (the start of the disk, where the boot sector is). Always give the format explicitly.

## Snapshots

A **snapshot** (an "instant picture") is a photo of a disk's state at a given moment, to which you can go back. Before a risky operation (partitioning, building a system, deleting files), take a snapshot: if the result is bad, you return to the photo in a few seconds instead of starting over.

### How it works, in brief

A `qcow2` file is written in blocks. When you take a snapshot, QEMU **freezes** the existing blocks. A later write does not modify a frozen block: it writes a **new copy** elsewhere in the file (this is called "copy on write", *copy on write*, which gives the format its name). Going back to the snapshot means pointing again to the frozen blocks.

```text
Before the snapshot      After the snapshot and a write

 block A  block B         block A  block B  block B'
   │       │              │       │       ▲
   │       │              │       │       └─ new value of B (written later)
   └───────┘              └───────┘
 current state           the snapshot keeps A and B;
                         the current state uses A and B'
```

Measured consequence: the file **grows** with snapshots and writes, since the old blocks remain.

### The four commands

| Command | Role |
|---|---|
| `qemu-img snapshot -c NAME disk.qcow2` | **c**reate a snapshot of the current state, named `NAME` |
| `qemu-img snapshot -l disk.qcow2` | **l**ist the snapshots of the file |
| `qemu-img snapshot -a NAME disk.qcow2` | **a**pply the snapshot: the disk goes back to this state, and the changes made since are lost |
| `qemu-img snapshot -d NAME disk.qcow2` | **d**elete the snapshot (the disk keeps its current state) |

The full cycle, on the `disk.qcow2` disk created above:

```bash
qemu-img snapshot -l disk.qcow2                 # list: new disk, no snapshot
qemu-img snapshot -c before-test disk.qcow2     # creates the snapshot "before-test"
qemu-img snapshot -l disk.qcow2                 # list: the snapshot appears
qemu-img snapshot -a before-test disk.qcow2     # goes back to the "before-test" state
qemu-img snapshot -d before-test disk.qcow2     # deletes the snapshot
qemu-img snapshot -l disk.qcow2                 # list: empty again
```

Output obtained for the second list, the only one that displays something (the other commands write nothing when they succeed):

```text
Snapshot list:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
1         before-test           0 B 2026-10-31 21:18:16 00:00:00.000          0
```

| Column | Meaning |
|---|---|
| `ID` | Number assigned by QEMU |
| `TAG` | The name given with `-c` |
| `VM SIZE` | Size of the machine state saved with the snapshot: `0 B` here, because the snapshot covers the **disk alone** (see the next section) |
| `DATE` | When it was taken |
| `VM CLOCK`, `ICOUNT` | The machine's clock and instruction counter, useful only for a snapshot of a running machine |

### Checking that the rollback works

To see a snapshot really restore data, the `qemu-io` tool writes and reads bytes directly in a disk file, without a virtual machine. Its `-c` option gives the command to run. The syntax is `write -P value offset size`: `-P` sets the repeated value, the offset is the starting position (in bytes from the start of the disk, `0` here) and the size is the amount written. So `write -P 0xAA 0 4k` writes 4 KiB, all equal to the value `0xAA` (the `0x` prefix marks a number written in hexadecimal, base 16, with the digits 0 to 9 then A to F), at the start of the disk; `read -P 0xAA 0 4k` reads the area back and fails if it does not contain exactly this value.

```bash
qemu-img create -f qcow2 d2.qcow2 64M           # creates the test disk (64 MiB)
qemu-io -c 'write -P 0xAA 0 4k' d2.qcow2        # writes the value AA over the first 4 KiB
qemu-img snapshot -c before d2.qcow2            # photo of the state: the area contains AA
qemu-io -c 'write -P 0xBB 0 4k' d2.qcow2        # overwrites the area with the value BB
qemu-io -c 'read -P 0xBB 0 4k' d2.qcow2         # reads back: BB is there
qemu-img snapshot -a before d2.qcow2            # goes back to the photo
qemu-io -c 'read -P 0xAA 0 4k' d2.qcow2         # reads back: AA is back
ls -l d2.qcow2                                  # file size at the end
```

Each `qemu-io` command replies `read 4096/4096 bytes` or `wrote 4096/4096 bytes` (bytes read or written), followed by a line showing the speed of the operation; the essential point is that **the last read succeeds with AA**: the write of BB, done after the snapshot, was undone. The file size went from 393,216 bytes (once AA is written) to 655,360 bytes (BB written as well, with the snapshot): the old blocks are kept.

### Errors to know

| Command | Message obtained | Cause |
|---|---|---|
| `qemu-img snapshot -a missing d2.qcow2` | `Could not apply snapshot 'missing': Failed to load snapshot: No such file or directory` | No snapshot with this name |
| `qemu-img snapshot -c x nonexistent.qcow2` | `Could not open 'nonexistent.qcow2': ... No such file or directory` | The disk file does not exist |
| `qemu-img snapshot -c x` while a VM uses the disk | `Failed to get "write" lock` then `Is another process using the image [d5.qcow2]?` | QEMU locks the disk while the VM runs |

The last case is a protection, not a failure: writing to a disk's file while the guest is writing to it would risk corrupting the disk. Once the VM is stopped, the same command succeeds.

Three behaviors observed on the tested version:

| Finding | Consequence |
|---|---|
| `-d` designates the snapshot by its **name**: `qemu-img snapshot -d 1` answers `snapshot not found` although the snapshot with ID 1 exists, `-d a` works | Give the name to `-d` |
| `-a` accepts the ID as well as the name | But a name is enough, and it stays readable |
| Two snapshots can have the **same name** (two snapshots named `two` received IDs 1 and 2) | Give each snapshot a unique name, for example with the date: otherwise one name designates two snapshots and `-a` or `-d` becomes ambiguous |

## Disk only or disk and memory

There are two kinds of snapshots, depending on whether the VM is switched off or on.

| | **Disk-only** snapshot | **Disk and memory** snapshot |
|---|---|---|
| VM | **Off** | **On** |
| Tool | `qemu-img snapshot` | The **QEMU console** (the monitor), command `savevm` |
| What is photographed | The disk's content | The disk, **plus** the RAM, the processor's state and the devices (simulated disk, keyboard, network card) |
| On rollback | The VM restarts from the beginning, as after a clean power cut | The VM resumes **exactly** where it was: open programs, windows, everything |
| Size (`VM SIZE`) | `0 B` | Tied to the machine's memory |
| Example use | Before installing a system or repartitioning | In the middle of work, before a test you want to be able to undo without rebooting |

### The QEMU console

QEMU controls the running machine through a **console**, called the **monitor**: a `(qemu)` prompt where you type commands that concern the machine itself (and not the guest system). There are two ways to reach it.

| Way | How |
|---|---|
| With `-nographic` | In the VM's console, `Ctrl+A` then `C` switches between the guest's console and the monitor (`Ctrl+A` then `X` quits) |
| With `-monitor stdio` | The monitor takes over the terminal that launched QEMU, and the guest's console goes elsewhere (for example `-serial null` to ignore it) |

In the monitor, the snapshot commands are:

| Command | Role |
|---|---|
| `savevm NAME` | Take a disk and memory snapshot of the running machine |
| `loadvm NAME` | Go back to this snapshot (the machine resumes where it was) |
| `delvm NAME` | Delete this snapshot |
| `info snapshots` | List the snapshots |

A complete test (the console commands are sent through a [pipe](/?c=langages&s=bash&p=redirections-et-pipes), so that they run without a keyboard; the disk is an empty `qcow2`, so the machine's program does nothing, but the snapshots are real):

```bash
qemu-img create -f qcow2 d6.qcow2 64M   # creates the test disk (64 MiB)
# Braces group commands; echo writes a text, which the pipe "|" sends
# to QEMU, which reads it as if it were typed into the monitor.
{
  sleep 3                       # lets QEMU start (sleep = wait n seconds)
  echo 'savevm save1'           # disk and memory snapshot
  sleep 2                       # waits for the write to finish
  echo 'loadvm save1'           # goes back to the snapshot
  sleep 2                       # waits for the read to finish
  echo 'info snapshots'         # lists the snapshots
  sleep 1                       # lets the list display
  echo 'delvm save1'            # deletes the snapshot
  sleep 1                       # waits for the deletion to finish
  echo 'info snapshots'         # lists again
  sleep 1                       # lets the list display
  echo 'quit'                   # stops the machine
} | timeout 20 qemu-system-x86_64 -accel kvm -m 128M -nographic -nic none \
      -monitor stdio -serial null -drive file=d6.qcow2,format=qcow2
```

Output obtained, cleaned of the terminal's echo characters:

```text
QEMU 8.2.2 monitor - type 'help' for more information
(qemu) savevm save1
(qemu) loadvm save1
(qemu) info snapshots
List of snapshots present on all disks:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
--        save1            1.02 MiB 2026-10-31 21:10:15 00:00:02.966
(qemu) delvm save1
(qemu) info snapshots
There is no snapshot available.
```

`savevm` and `loadvm` print nothing when they succeed. A machine snapshot left in place also appears in `qemu-img snapshot -l` once the VM is stopped, with a non-zero `VM SIZE` column (`2.25 MiB` in another test, `1.02 MiB` here: the test machine runs almost nothing, so there is very little state to keep). For a real machine with a loaded system, this size can approach the memory in use (not measured here).

At launch, the option `-loadvm NAME` resumes a machine snapshot directly: after `savevm s2`, the command `qemu-system-x86_64 ... -loadvm s2` starts the machine in the photographed state (the monitor answers `VM status: running`).

> **Pitfall:** `savevm` requires that **all** the writable disks be `qcow2`. On a `raw` disk, QEMU refuses: `Error: Device 'ide0-hd0' is writable but does not support snapshots`. A `raw` disk forgotten in the setup is enough to block it.

## A snapshot is not a backup

An internal snapshot **lives inside the file** `qcow2`. It is not a copy stored elsewhere: it is a part of the same file.

| Event | Does the snapshot survive? |
|---|---|
| The disk is modified after the snapshot | Yes: that is its purpose |
| The `qcow2` file is copied | Yes: the copy carries its snapshots (verified: `snapshot -l` on the copy lists them) |
| The `qcow2` file is deleted | **No**: the snapshot disappears with it |
| The file is corrupted (host power cut, faulty disk) | **No**: the snapshot and the current state are in the same damaged file |
| The host's disk fails | **No**: everything is in this single file |

A snapshot protects against **a mistake inside the guest** (a failed command, a bad installation). A backup protects against **the loss of the file**. The two complement each other.

```bash
# The VM must be off: copying a disk that is being written to would make it inconsistent
# cp copies the whole file, snapshots included
cp debian-rescue.qcow2 debian-rescue.backup.qcow2
```

Put this copy on a **different** physical disk or on another computer, otherwise the backup shares the fate of the original file.

## Shutting down cleanly before the snapshot

A disk-only snapshot captures what is **written to the file** at the moment it is taken. But an operating system keeps part of its writes **in memory** before sending them to the disk (it is faster). If the machine is cut off without warning, these writes are lost and the disk may be left in an intermediate state: truncated files, a filesystem (the way the disk organizes files, see [Partitioning and LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm)) to repair at the next boot.

Closing the QEMU window, or typing `quit` in the monitor, **stops the QEMU process immediately**: for the guest, this is like a power cut. The same effect comes from a `kill` sent to QEMU's process. A [process](/?c=langages&s=bash&p=gestion-des-processus) is a program that is running, and `kill` sends it a **signal** (a message sent to a program; by default a request to stop).

| Shutdown method | Effect on the guest | For a disk-only snapshot |
|---|---|---|
| `sudo poweroff` or `sudo shutdown -h now` **inside the guest** | The system finishes its writes, detaches its disks, then shuts down | Good: the disk is consistent |
| Closing the QEMU window | Same as unplugging the machine | Avoid |
| `quit` in the monitor | Same | Avoid |
| `timeout` expiring on QEMU | Same (QEMU is stopped by a signal) | Avoid for anything other than a test |
| `system_powerdown` in the monitor | Sends the guest a shutdown request, like pressing the power button; the guest shuts down cleanly if it responds to that button (not tested here, no system installed) | Good if the guest responds |

The safe sequence:

| Step | Action | Why |
|---|---|---|
| 1 | Inside the guest, type `sudo poweroff` | Writes complete, filesystem closed cleanly |
| 2 | Wait for the QEMU process to **end on its own** (the window closes) | The disk is released: the lock disappears |
| 3 | `qemu-img snapshot -c before-step disk.qcow2` | Photo of a consistent disk |
| 4 | Restart the VM | Resume the work |

For a snapshot of a running machine with `savevm`, the question does not arise in the same terms: the RAM state is saved with the disk, and `loadvm` restores the machine as it was, caches included (temporary copies kept in memory).

## Frequently asked questions

| Question | Answer |
|---|---|
| Can you take a snapshot of several disks at once? | With `savevm`, yes: all the writable disks are photographed together (they must all be `qcow2`). With `qemu-img snapshot`, one file at a time |
| What about Windows or macOS? | QEMU also exists on these systems, but KVM is specific to Linux: you must choose another accelerator (`-accel tcg` works everywhere). The other accelerators (not tested here) are documented on the QEMU website |
| How many snapshots at most? | No limit has been measured here; the real limit is disk space, since each snapshot keeps its blocks |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Confusing the two meanings of "host" | You look for a setting in the wrong place (QEMU instead of the build Linux, or the reverse) | Ask yourself what the machine is the host of |
| Disk named `host.qcow2` | The name does not say which host it refers to | Name it by content and role |
| `-accel kvm` without KVM available | The launch fails (not reproduced here) | Test `/dev/kvm`, or use `-accel tcg` |
| Forgetting `-f qcow2` or `format=qcow2` | `qemu-img create` makes a raw disk; at launch QEMU guesses the format and warns | Always give the format |
| `-cdrom` forgotten or ISO misnamed | `No bootable device.` on an empty disk | Check the ISO's name and path |
| Keeping `-cdrom` after the installation with `-boot order=dc` | You fall back into the installer | Use the `cd` order, or remove `-cdrom` |
| Closing the VM's window | Virtual power cut, inconsistent disk | Shut down from inside the guest |
| Taking a disk snapshot while the VM is running | Refused by the lock (`Failed to get "write" lock`) | Shut down, or use `savevm` |
| Copying a `qcow2` while the VM is running | Inconsistent copy | Shut down first |
| Taking a snapshot as a backup | It disappears with the file | Copy the file to another medium |
| `raw` disk mixed with `qcow2` disks | `savevm` refused | Convert or remove the `raw` disk |
| Two snapshots with the same name | The name no longer designates one precise snapshot | Unique names, with the date |
| Piling up many snapshots | The file grows and the host may run out of space | Delete the snapshots that are no longer needed (`-d`) |
| Believing the disk size is reserved | The file grows with use, and the host may fill up | Monitor the host's free space |
| Guest memory too large | The host runs short of RAM and slows down | Keep a margin for the host |

## Best practices

| Best practice | Why |
|---|---|
| Check `/dev/kvm` before choosing the acceleration | A fast VM, or a deliberate fallback to `tcg` |
| Give the format of every disk, everywhere | No guessing by QEMU |
| Name disks by their content | No confusion about "the host" |
| Run tests under `timeout`, with modest memory | A test that hangs stops by itself without tying up the machine; see [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| Shut the guest down from the inside before a disk snapshot | A consistent disk |
| Name each snapshot uniquely and clearly | `-a` and `-d` target the right one |
| Take a snapshot **before** any irreversible step | A rollback in a few seconds |
| Regularly copy the `qcow2` file to another medium | It is the only real backup |
| Delete the snapshots that are no longer needed | The file stops growing |
| Read `qemu-img snapshot -l` before applying a snapshot | Know what you restore and what you lose |

## Going further

| Topic | Where |
|---|---|
| All QEMU options | [QEMU command-line options](https://www.qemu.org/docs/master/system/invocation.html) |
| The `qemu-img` tool and its subcommands | [qemu-img manual](https://www.qemu.org/docs/master/tools/qemu-img.html) |
| The monitor commands | [QEMU monitor](https://www.qemu.org/docs/master/system/monitor.html) |
| KVM | [KVM project site](https://www.linux-kvm.org/page/Main_Page) |
| Building Linux from source code | [Linux From Scratch](https://www.linuxfromscratch.org/lfs/) |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | **QEMU** simulates the machine (disks, screen, network); **KVM**, a function of the Linux kernel (`/dev/kvm`), makes it fast by letting the real processor run the guest, otherwise `-accel tcg` emulates everything in software. A typical launch: `qemu-system-x86_64 -accel kvm -m 2G -smp 2 -drive file=d.qcow2,format=qcow2 -cdrom x.iso -boot order=cd` (memory, cores, disk, CD drive; `c` disk then `d` CD, so an empty disk lets the CD boot, and `No bootable device.` signals that no medium boots). "Host" has two meanings: the virtualization host (the real machine that runs QEMU, facing the guest) and the build host (the Linux already installed that serves to build another one, facing the target system); the two can overlap. A **`qcow2`** disk is a file that grows with use (`qemu-img create -f qcow2 d.qcow2 64M`, `qemu-img info`) and can keep **snapshots**: `qemu-img snapshot -c` creates, `-l` lists, `-a` applies, `-d` deletes (by name). **Disk-only** snapshot: VM off, `qemu-img`. **Disk and RAM** snapshot: VM on, QEMU monitor, `savevm`, `loadvm`, `delvm`, `info snapshots`. |
| **Pitfalls to avoid** | Confusing the two "hosts"; `-accel kvm` without KVM; forgetting the disk format; closing the VM's window (it cuts the power); believing a snapshot is a backup (it lives in the `qcow2` file and disappears with it); copying or snapshotting a disk while the VM is running; a `raw` disk that blocks `savevm`; two snapshots with the same name; letting snapshots pile up. |
| **Best practices** | Test `/dev/kvm` first; give the format everywhere; name disks and snapshots clearly; shut the guest down from the inside (`sudo poweroff`) before a disk snapshot; a snapshot before each risky step; copy the `qcow2` file elsewhere for a real backup; run tests under `timeout`. |
