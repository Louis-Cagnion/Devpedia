---
order: 11
---

# QEMU, KVM et disques qcow2 (31/10/2026)

Le chapitre [Virtualisation et choix d'OS](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) présente les hyperviseurs (les logiciels qui créent et font tourner des **machines virtuelles**, ou VM : des ordinateurs simulés par un programme, avec leur processeur, leur mémoire et leurs disques ; voir [les concepts de base de Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) pour les comparer à des conteneurs) à fenêtres, que l'on pilote à la souris. Ce chapitre-ci fait la même chose en **ligne de commande** (on pilote un programme en tapant des commandes plutôt qu'en cliquant dans des menus), avec l'outil le plus répandu sous Linux : [**QEMU**](https://www.qemu.org/). Il explique aussi ce qu'est un disque virtuel, comment prendre des **snapshots** (des photos de l'état d'une machine), et pourquoi un snapshot n'est pas une sauvegarde.

L'ordinateur réel qui fait tourner la VM s'appelle l'**hôte** ; le système qui tourne **dans** la VM s'appelle l'**invité** (*guest*). Le mot « hôte » a un second sens, expliqué dans la section [Les deux sens du mot « hôte »](#les-deux-sens-du-mot-hote).

Toutes les commandes se tapent dans [un terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Les sorties recopiées ci-dessous ont été obtenues sur une machine Linux réelle, avec QEMU installé depuis les paquets (les programmes empaquetés) de la distribution (la variante de Linux utilisée, voir [Virtualisation et choix d'OS](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos)).

> **Analogie :** un acteur qui joue le rôle d'un ordinateur. **L'acteur** (QEMU) interprète la machine virtuelle : sans aide, il doit tout mimer avec des accessoires, c'est fidèle mais lent. **Le vrai matériel prêté par KVM** lui permet de jouer les gestes principaux pour de vrai, donc beaucoup plus vite. Le **carnet de photos** (les snapshots) permet de revenir à l'état de la machine avant le dernier réglage raté.

## QEMU et KVM : qui fait quoi

Les deux noms désignent deux briques différentes, souvent citées ensemble.

| | QEMU | KVM |
|---|---|---|
| Nom complet | *Quick EMUlator* | [*Kernel-based Virtual Machine*](https://www.linux-kvm.org/) |
| Nature | Un programme ordinaire, lancé par l'utilisateur | Une fonction du **noyau** Linux (le programme central qui gère le matériel, voir [Les composants d'un ordinateur et son démarrage](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) |
| Rôle | **Simule la machine** : disques, écran, clavier, réseau, carte mère | **Accélère** la simulation en laissant le processeur réel exécuter le code de l'invité |
| Sans l'autre | Fonctionne, mais lentement : il imite le processeur par logiciel | Ne sert à rien seul : c'est QEMU qui s'en sert |
| Fichier ou programme | `qemu-system-x86_64` | le fichier spécial `/dev/kvm` |

Le programme `qemu-system-x86_64` simule un ordinateur de la famille x86 en 64 bits (les processeurs d'Intel et d'AMD ; voir [Le processeur](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#le-processeur)). Il existe un programme par famille de processeurs (`qemu-system-aarch64` pour les processeurs ARM, ceux des téléphones et de nombreux Mac récents, par exemple).

Le fichier `/dev/kvm` est un « fichier spécial » : il ne contient aucune donnée, c'est une porte d'entrée vers KVM que les programmes ouvrent pour lui parler (le dossier `/dev` regroupe ces portes vers le matériel et le noyau).

Sans KVM, QEMU fonctionne en mode **tcg** (*Tiny Code Generator*, le traducteur logiciel de QEMU). C'est l'**émulation** : imiter un matériel en l'exécutant par logiciel, instruction par instruction (une **instruction** est un ordre élémentaire exécuté par le processeur, comme additionner deux nombres). Fidèle, mais lent.

```text
Sans KVM (mode tcg, émulation logicielle)

 invité ──► QEMU traduit chaque instruction ──► processeur réel
            (lent : un travail de traduction à chaque pas)

Avec KVM

 invité ──► processeur réel exécute directement le code de l'invité
            QEMU ne s'occupe que du reste : disques, écran, réseau
            (rapide : presque la vitesse d'une vraie machine)
```

### Savoir si KVM est disponible

```bash
# grep cherche un motif dans un fichier ; -c affiche le nombre de lignes trouvées au
# lieu des lignes ; -E autorise le « ou » (|) dans le motif ; /proc/cpuinfo est un
# fichier virtuel (le noyau y expose la description du processeur, rien n'est stocké
# sur le disque) ; vmx (Intel) ou svm (AMD) annonce la virtualisation, une ligne par cœur
grep -c -E 'vmx|svm' /proc/cpuinfo
ls -l /dev/kvm                            # -l : liste détaillée ; KVM est-il présent ?
# [ -w fichier ] : vrai si j'ai le droit d'écrire dedans ; && : la commande suivante ne
# s'exécute que si la précédente a réussi ; || : seulement si elle a échoué
[ -w /dev/kvm ] && echo oui || echo non
```

Ces commandes sont détaillées dans [les commandes de base](/?c=langages&s=bash&p=commandes-de-base) et [les conditions](/?c=langages&s=bash&p=conditions).

Sorties obtenues :

```text
16
crw-rw----+ 1 root kvm 10, 232 oct.  31 20:27 /dev/kvm
oui
```

Lecture de la ligne `crw-rw----+ 1 root kvm 10, 232 ...` : `c` signale un fichier spécial ; `rw-rw----` donne les droits (lecture et écriture au propriétaire, lecture et écriture au groupe, rien aux autres ; voir [les permissions](/?c=langages&s=bash&p=permissions-et-fichiers)) ; `root kvm` sont le propriétaire et le groupe ; `10, 232` sont des numéros internes du noyau, sans importance ici.

| Constat | Signification | Conduite |
|---|---|---|
| Le premier nombre est `0` (aucune ligne) | Le processeur n'annonce pas de virtualisation, ou elle est désactivée dans le réglage de la carte mère (le micrologiciel, voir [BIOS et UEFI](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | Pas de KVM : utiliser `-accel tcg` |
| `/dev/kvm` n'existe pas | Le module KVM (un morceau du noyau chargé à la demande) n'est pas chargé, ou la machine est elle-même une VM qui n'expose pas la virtualisation | Idem |
| `/dev/kvm` existe mais `non` | Le fichier appartient au groupe `kvm` (voir [les permissions](/?c=langages&s=bash&p=permissions-et-fichiers)) et l'utilisateur n'en fait pas partie | Demander à l'administrateur d'ajouter l'utilisateur au groupe `kvm`, puis se déconnecter et se reconnecter (les groupes ne sont relus qu'à la connexion) |
| `/dev/kvm` existe et `oui` | KVM est utilisable | `-accel kvm` |

Le `+` à la fin de `crw-rw----+` signale une règle d'accès supplémentaire (une **ACL**, *Access Control List* : une liste de droits accordés à des utilisateurs nommés ; voir [la page de manuel acl](https://man7.org/linux/man-pages/man5/acl.5.html)) : sur la machine d'essai, un utilisateur est autorisé nommément, sans être dans le groupe `kvm`. Le test `[ -w /dev/kvm ]` est donc plus fiable que la lecture des lettres.

> **Piège :** écrire `-accel kvm` sur une machine sans KVM utilisable fait échouer le lancement (comportement attendu, non reproduit ici faute de machine sans KVM). Pour un script qui doit marcher partout, tester `/dev/kvm` d'abord et choisir `kvm` ou `tcg` en conséquence.

## Lancer une machine virtuelle

Deux outils sont à installer. Sur [Debian](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos) et [Ubuntu](https://www.ubuntu.com/) (deux distributions Linux ; voir [le durcissement de sudo](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) pour `sudo`), `qemu-system-x86` fournit le programme `qemu-system-x86_64`, et `qemu-utils` fournit `qemu-img` (l'outil qui fabrique et manipule les disques, vu plus bas) :

```bash
# sudo : exécute la commande avec les droits d'administrateur
# apt install : installe des paquets (programmes empaquetés) sur Debian et Ubuntu
# (voir https://wiki.debian.org/Apt)
sudo apt install qemu-system-x86 qemu-utils
```

Avant de lancer la machine, il faut un disque vide pour l'invité et l'ISO d'installation (une **ISO** est un fichier qui contient l'image exacte d'un CD ou d'un DVD d'installation). L'ISO de Debian se télécharge sur [la page officielle](https://www.debian.org/distrib/) ; on la renomme ici `debian.iso`. Le disque se crée ainsi (le format qcow2 est expliqué dans [Le disque virtuel](#le-disque-virtuel-le-format-qcow2)) :

```bash
# crée un disque virtuel : -f = format, puis le nom du fichier, puis la taille (20G = 20 Gio)
qemu-img create -f qcow2 debian-depannage.qcow2 20G
```

Une commande de lancement complète, pour installer le système depuis l'ISO :

```bash
# Une ligne par option ; le « \ » en fin de ligne continue la commande sur la suivante
qemu-system-x86_64 \
  -accel kvm \
  -m 2G \
  -smp 2 \
  -drive file=debian-depannage.qcow2,format=qcow2 \
  -cdrom debian.iso \
  -boot order=cd
```

| Option | Rôle | Remarque |
|---|---|---|
| `-accel kvm` | Utiliser KVM pour la vitesse | `-accel tcg` pour l'émulation logicielle seule ; `-enable-kvm` est un raccourci équivalent de `-accel kvm` |
| `-m 2G` | **Mémoire** (la RAM, voir [la RAM](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) donnée à l'invité | `128M` pour 128 Mio, `2G` pour 2 Gio (voir [compter l'information](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#compter-l-information-bit-octet-go-et-gio)) ; cette mémoire est prélevée sur celle de l'hôte |
| `-smp 2` | Nombre de **cœurs** de processeur (des unités de calcul indépendantes) offerts à l'invité | Ne pas dépasser le nombre de cœurs de l'hôte (QEMU l'accepte, mais la VM ralentit) |
| `-drive file=...,format=...` | Brancher un disque dur virtuel, rangé dans un fichier de l'hôte | Toujours préciser `format=` (voir la section sur les formats) |
| `-cdrom debian.iso` | Brancher un **lecteur de CD** virtuel qui contient l'ISO | L'invité croit avoir un vrai CD inséré |
| `-boot order=cd` | **Ordre d'essai au démarrage** : une lettre par type de support | `c` = premier disque dur, `d` = lecteur de CD : ici le disque d'abord, puis le CD |

Une fenêtre s'ouvre alors : c'est l'écran de la machine virtuelle. Sans autre option, c'est sur elle que se passe l'installation. Deux précautions : dès qu'on clique dans la fenêtre, elle « capture » la souris (le pointeur ne sort plus) ; la libérer avec `Ctrl+Alt+G` (ou `Ctrl+Alt` selon l'affichage). Et fermer la fenêtre coupe la VM brutalement, comme un débranchement : voir [Éteindre proprement avant le snapshot](#eteindre-proprement-avant-le-snapshot).

### L'ordre de démarrage : pourquoi « disque puis CD »

Au démarrage, le micrologiciel de la machine (le BIOS, voir [Les composants d'un ordinateur et son démarrage](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) essaie chaque support dans l'ordre et prend le premier qui contient un programme de démarrage.

| Étape | Disque | CD | Ce qui se passe |
|---|---|---|---|
| Première installation | vide | ISO d'installation | Le disque est vide, le micrologiciel passe au CD : l'installateur démarre |
| Le système est installé | contient le système | ISO encore branchée | Le disque démarre en premier : le système installé démarre |
| Si l'ordre était `dc` | contient le système | ISO encore branchée | Le CD passerait en premier : on retomberait sur l'installateur à chaque démarrage |

C'est ce qui rend l'ordre `cd` pratique : il suffit de garder la même commande avant et après l'installation, sans jamais retomber sur l'installateur par erreur. Et il reste possible de retirer `-cdrom` et `-boot` une fois l'installation finie.

### Vérifier l'ordre sans télécharger de distribution

Aucune distribution n'a été téléchargée pour ce chapitre. Pour voir l'ordre à l'œuvre, deux supports minuscules ont été fabriqués (ils ne sont pas fournis : cette section sert de démonstration, pas d'exercice à refaire) : un disque dont le premier secteur (la première zone de 512 octets, que le micrologiciel lit pour démarrer ; voir [le micrologiciel](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#le-micrologiciel-bios-et-uefi)) est un programme qui écrit « DEMARRAGE DEPUIS LE DISQUE » sur le port série, et une ISO qui contient le même genre de programme avec le message « DEMARRAGE DEPUIS LE CD ». La commande `timeout` (voir [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) arrête un programme au bout d'un délai. Le **port série** est une sortie texte simple de la machine virtuelle ; l'option `-nographic` la relie au terminal, au lieu d'ouvrir une fenêtre.

```bash
# timeout 20 : arrête la commande au bout de 20 secondes
# (le programme de test ne s'arrête jamais seul)
# -nographic : pas de fenêtre, la console de la VM s'affiche dans ce terminal
# -nic none : aucune carte réseau, pour une sortie plus courte
timeout 20 qemu-system-x86_64 -accel kvm -m 128M -smp 2 -nographic -nic none \
  -drive file=debian-depannage.qcow2,format=qcow2 -cdrom cd.iso -boot order=cd
```

Avec un disque `debian-depannage.qcow2` vide (le cas d'une première installation), la sortie commence par la version de [SeaBIOS](https://www.seabios.org/), le micrologiciel que QEMU fournit à la machine :

```text
SeaBIOS (version 1.16.3-debian-1.16.3-2)
Booting from Hard Disk...
Boot failed: not a bootable disk
Booting from DVD/CD..DEMARRAGE DEPUIS LE CD
```

Le disque est essayé en premier (`Hard Disk`), refusé parce que vide (`not a bootable disk`), puis le CD démarre. Même commande avec un disque qui contient un programme de démarrage :

| Commande | Ligne qui apparaît |
|---|---|
| disque démarrable, `-boot order=cd` | `Booting from Hard Disk..DEMARRAGE DEPUIS LE DISQUE` |
| disque démarrable, `-boot order=dc` | `Booting from DVD/CD..DEMARRAGE DEPUIS LE CD` |
| disque vide et aucune ISO | `Booting from Hard Disk...` puis `Boot failed: not a bootable disk`, les autres supports échouent aussi, et `No bootable device.` |

Cette dernière ligne est le message à reconnaître : elle ne signifie pas que QEMU est cassé, mais qu'aucun support n'a de programme de démarrage (oubli de `-cdrom`, ISO mal nommée, ordre `-boot` inversé).

> **Piège :** dans une VM lancée avec `-nographic`, le clavier du terminal est transmis à l'invité, et `Ctrl+C` peut ne pas arrêter QEMU. La séquence de sortie documentée est `Ctrl+A` puis `X`. D'où l'intérêt de `timeout` pour les essais.

## Les deux sens du mot « hôte »

Le mot revient avec deux sens, et les confondre fait perdre du temps. Le livre [*Linux From Scratch*](https://www.linuxfromscratch.org/lfs/) (un guide qui apprend à fabriquer un Linux complet à partir de ses sources, c'est-à-dire du code écrit par les développeurs, sans distribution toute faite ; voir [Créer un système d'exploitation](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation)) l'emploie dans un sens, la virtualisation dans un autre.

| | Hôte de **virtualisation** | Hôte de **construction** |
|---|---|---|
| Question à laquelle il répond | Sur quelle machine tourne la VM ? | Avec quel Linux fabrique-t-on le nouveau Linux ? |
| C'est | L'ordinateur réel (ou le système réel) qui lance QEMU | Un Linux **déjà installé**, dont on emprunte le compilateur (le programme qui traduit du code source en programme exécutable) et les outils pour en fabriquer un autre |
| Son contraire | L'**invité** | Le **système cible** (celui qu'on fabrique) |
| Peut vivre dans une VM ? | Non : c'est la couche du dessous | Oui : c'est souvent un Linux installé **dans** la VM |

Les deux peuvent se superposer dans le même montage, d'où la confusion. Sur le schéma, un **processus** est un programme en cours d'exécution (voir [la gestion des processus](/?c=langages&s=bash&p=gestion-des-processus)) : ici, QEMU qui tourne. Exemple avec des noms inventés : on installe un Debian de dépannage dans la VM, sur un fichier `debian-depannage.qcow2`. Ce Debian est, pour le livre, l'« hôte » (de construction) : il sert à fabriquer le nouveau système sur un second disque, `systeme-cible.qcow2`. Mais pour QEMU, ce même Debian est l'**invité**.

```text
┌──────────────────────────────────────────────────────────┐
│ ORDINATEUR RÉEL = hôte de virtualisation                 │
│  (il range les trois fichiers sur son disque)            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ processus qemu-system-x86_64 (+ KVM)               │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ MACHINE VIRTUELLE = invité                   │  │  │
│  │  │  disque 1 ◄── debian-depannage.qcow2         │  │  │
│  │  │     contient un Linux installé :             │  │  │
│  │  │     c'est l'hôte de construction             │  │  │
│  │  │  disque 2 ◄── systeme-cible.qcow2            │  │  │
│  │  │     reçoit le nouveau système en fabrication │  │  │
│  │  │  lecteur CD ◄── debian.iso (au besoin)       │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

> **Piège :** un fichier nommé `hote.qcow2` ne dit pas de quel hôte il s'agit, et la confusion est réelle (le nom pousse à lire « l'hôte de construction » comme « l'hôte de virtualisation »). Nommer les disques par leur **contenu** et leur rôle : `debian-depannage.qcow2`, `systeme-cible.qcow2`.
>
> **Bonne pratique :** quand on lit « l'hôte » dans une documentation, se demander d'abord « de quoi est-il l'hôte ? » : de la machine virtuelle, ou de la construction d'un système.

Pour la fabrication d'un système à partir de rien, voir [Créer un système d'exploitation, étape par étape](/?c=infrastructure-devops&s=systemes-d-exploitation&p=creer-un-systeme-d-exploitation) ; pour découper le second disque, voir [Partitionnement et LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm).

## Le disque virtuel : le format qcow2

Une VM a besoin d'un disque dur. Plutôt qu'un vrai disque, QEMU utilise un **fichier** de l'hôte, qu'il présente à l'invité comme un disque : l'invité y écrit comme sur un disque ordinaire, et chaque écriture est enregistrée dans le fichier. Deux formats courants :

| | `raw` | `qcow2` |
|---|---|---|
| Principe | Une copie octet pour octet du disque | Un format de QEMU (*QEMU Copy On Write*, version 2) qui ne range que ce qui a été écrit |
| Taille du fichier | `ls -l` annonce toujours la taille complète du disque virtuel ; l'espace réellement occupé (mesuré par `du`) peut être plus petit si le système de fichiers de l'hôte ne stocke pas les zones vides (fichier « creux ») | Très petite au début, elle **grandit** avec l'usage |
| Snapshots | Non, dans le fichier | Oui, dans le fichier |
| Cas d'usage | Performance brute, échange avec d'autres outils | Le choix courant pour des VM de travail |

Les commandes de création et de lecture viennent de `qemu-img`.

```bash
# crée un disque virtuel : -f = format, puis le nom du fichier, puis la taille
qemu-img create -f qcow2 disque.qcow2 64M
qemu-img info disque.qcow2                  # affiche les caractéristiques du fichier
# du : espace réel occupé sur l'hôte ; -h : tailles lisibles (K, M, G)
du -h disque.qcow2
```

Sorties obtenues (la ligne `Formatting` est raccourcie, et seules les lignes utiles de `info` sont gardées) :

```text
Formatting 'disque.qcow2', fmt=qcow2 cluster_size=65536 ... size=67108864 ...
image: disque.qcow2
file format: qcow2
virtual size: 64 MiB (67108864 bytes)
disk size: 196 KiB
cluster_size: 65536
196K	disque.qcow2
```

| Ligne | Sens |
|---|---|
| `virtual size: 64 MiB` | La taille **vue par l'invité** : il croit avoir un disque de 64 Mio (MiB = mébioctet, 1 048 576 octets, voir [compter l'information](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage#compter-l-information-bit-octet-go-et-gio)) |
| `disk size: 196 KiB` | Ce que le fichier occupe **réellement** sur l'hôte, car rien n'y est encore écrit |
| `cluster_size: 65536` | Le disque est découpé en blocs de 64 Kio ; seuls les blocs écrits existent dans le fichier |

Le disque de 64 Mio occupe 196 Kio : c'est la propriété qui rend les disques `qcow2` économes. Elle a une contrepartie : si le disque de l'hôte se remplit, un disque virtuel qui continue de grandir peut échouer à écrire, alors que l'invité croit avoir encore de la place. La taille qu'on demande est donc un **plafond**, pas une réservation.

> **Piège :** oublier `-f qcow2` à la création, ou `format=qcow2` au lancement. Sans `-f qcow2`, `qemu-img create` fabrique un disque **raw** (donc sans snapshots). Au lancement, sans `format=`, QEMU devine le format ; pour un fichier raw il avertit (`Image format was not specified ... probing guessed raw`) et interdit d'écrire dans le premier bloc (le début du disque, où se trouve le secteur de démarrage). Donner le format explicitement partout.

## Les snapshots

Un **snapshot** (« instantané ») est une photo de l'état d'un disque à un moment donné, à laquelle on peut revenir. Avant une manipulation risquée (partitionner, compiler un système, supprimer des fichiers), on prend un snapshot : si le résultat est mauvais, on revient à la photo en quelques secondes au lieu de tout recommencer.

### Comment ça marche, en bref

Un fichier `qcow2` s'écrit par blocs. Quand on prend un snapshot, QEMU **fige** les blocs existants. Une écriture ultérieure ne modifie pas un bloc figé : elle en écrit une **nouvelle copie** ailleurs dans le fichier (on dit « copie à l'écriture », *copy on write*, d'où le nom du format). Revenir au snapshot, c'est de nouveau pointer vers les blocs figés.

```text
Avant le snapshot      Après le snapshot et une écriture

 bloc A  bloc B         bloc A  bloc B  bloc B'
   │       │              │       │       ▲
   │       │              │       │       └─ nouvelle valeur de B (écrite après)
   └───────┘              └───────┘
 état courant             le snapshot garde A et B ;
                          l'état courant utilise A et B'
```

Conséquence mesurée : le fichier **grossit** avec les snapshots et les écritures, puisque les anciens blocs restent.

### Les quatre commandes

| Commande | Rôle |
|---|---|
| `qemu-img snapshot -c NOM disque.qcow2` | **c**réer un snapshot de l'état actuel, nommé `NOM` |
| `qemu-img snapshot -l disque.qcow2` | **l**ister les snapshots du fichier |
| `qemu-img snapshot -a NOM disque.qcow2` | **a**ppliquer le snapshot : le disque revient à cet état, et les modifications faites depuis sont perdues |
| `qemu-img snapshot -d NOM disque.qcow2` | **d**étruire le snapshot (le disque garde son état actuel) |

Le cycle complet, sur le disque `disque.qcow2` créé plus haut :

```bash
qemu-img snapshot -l disque.qcow2                 # liste : disque neuf, aucun snapshot
qemu-img snapshot -c avant-test disque.qcow2      # crée le snapshot « avant-test »
qemu-img snapshot -l disque.qcow2                 # liste : le snapshot apparaît
qemu-img snapshot -a avant-test disque.qcow2      # revient à l'état « avant-test »
qemu-img snapshot -d avant-test disque.qcow2      # détruit le snapshot
qemu-img snapshot -l disque.qcow2                 # liste : de nouveau vide
```

Sortie obtenue pour la deuxième liste, la seule qui affiche quelque chose (les autres commandes n'écrivent rien quand elles réussissent) :

```text
Snapshot list:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
1         avant-test            0 B 2026-10-31 21:06:21 00:00:00.000          0
```

| Colonne | Sens |
|---|---|
| `ID` | Numéro attribué par QEMU |
| `TAG` | Le nom donné avec `-c` |
| `VM SIZE` | Taille de l'état de la machine enregistré avec le snapshot : `0 B` ici, car le snapshot est celui du **disque seul** (voir la section suivante) |
| `DATE` | Moment de la prise |
| `VM CLOCK`, `ICOUNT` | Horloge de la machine et compteur d'instructions, utiles seulement pour un snapshot de machine allumée |

### Constater que le retour en arrière marche

Pour voir un snapshot restaurer vraiment des données, l'outil `qemu-io` écrit et lit des octets directement dans un fichier de disque, sans machine virtuelle. Son option `-c` donne la commande à exécuter. La syntaxe est `write -P valeur décalage taille` : `-P` fixe la valeur répétée, le décalage est la position de départ (en octets depuis le début du disque, `0` ici) et la taille la quantité écrite. Ainsi `write -P 0xAA 0 4k` écrit 4 Kio, tous égaux à la valeur `0xAA` (le préfixe `0x` annonce un nombre écrit en hexadécimal, en base 16, avec les chiffres 0 à 9 puis A à F), au début du disque ; `read -P 0xAA 0 4k` relit la zone et échoue si elle ne contient pas exactement cette valeur.

```bash
qemu-img create -f qcow2 d2.qcow2 64M           # crée le disque d'essai (64 Mio)
qemu-io -c 'write -P 0xAA 0 4k' d2.qcow2        # écrit la valeur AA sur les 4 premiers Kio
qemu-img snapshot -c avant d2.qcow2             # photo de l'état : la zone contient AA
qemu-io -c 'write -P 0xBB 0 4k' d2.qcow2        # écrase la zone avec la valeur BB
qemu-io -c 'read -P 0xBB 0 4k' d2.qcow2         # relit : BB est bien là
qemu-img snapshot -a avant d2.qcow2             # revient à la photo
qemu-io -c 'read -P 0xAA 0 4k' d2.qcow2         # relit : AA est revenu
ls -l d2.qcow2                                  # taille du fichier à la fin
```

Chaque commande `qemu-io` répond `read 4096/4096 bytes` ou `wrote 4096/4096 bytes` (octets lus ou écrits), suivi d'une ligne indiquant la vitesse de l'opération ; l'essentiel est que **la dernière lecture réussit avec AA** : l'écriture BB, faite après le snapshot, a été annulée. La taille du fichier est passée de 393 216 octets (une fois AA écrit) à 655 360 octets (BB écrit en plus, avec le snapshot) : les anciens blocs sont conservés.

### Les erreurs à connaître

| Commande | Message obtenu | Cause |
|---|---|---|
| `qemu-img snapshot -a absent d2.qcow2` | `Could not apply snapshot 'absent': Failed to load snapshot: No such file or directory` | Aucun snapshot de ce nom |
| `qemu-img snapshot -c x inexistant.qcow2` | `Could not open 'inexistant.qcow2': ... No such file or directory` | Le fichier de disque n'existe pas |
| `qemu-img snapshot -c x` pendant qu'une VM utilise le disque | `Failed to get "write" lock` puis `Is another process using the image [d5.qcow2]?` | QEMU verrouille le disque tant que la VM tourne |

Le dernier cas est une protection, pas une panne : écrire dans le fichier d'un disque pendant que l'invité y écrit risquerait de corrompre le disque. Une fois la VM arrêtée, la même commande réussit.

Trois comportements observés sur la version testée :

| Constat | Conséquence |
|---|---|
| `-d` désigne le snapshot par son **nom** : `qemu-img snapshot -d 1` répond `snapshot not found` alors que le snapshot d'ID 1 existe, `-d a` marche | Donner le nom à `-d` |
| `-a` accepte l'ID aussi bien que le nom | Mais un nom suffit, et reste lisible |
| Deux snapshots peuvent porter le **même nom** (deux `deux` ont reçu les ID 1 et 2) | Donner un nom unique à chaque snapshot, par exemple avec la date : sinon un nom désigne deux snapshots et `-a` ou `-d` devient ambigu |

## Disque seul ou disque et mémoire

Il existe deux sortes de snapshots, selon que la VM est éteinte ou allumée.

| | Snapshot **disque seul** | Snapshot **disque et mémoire** |
|---|---|---|
| VM | **Éteinte** | **Allumée** |
| Outil | `qemu-img snapshot` | La **console de QEMU** (le moniteur), commande `savevm` |
| Ce qui est photographié | Le contenu du disque | Le disque, **plus** la RAM, l'état du processeur et des périphériques (disque, clavier, carte réseau simulés) |
| Au retour en arrière | La VM redémarre depuis le début, comme après une coupure propre | La VM reprend **exactement** où elle en était : programmes ouverts, fenêtres, tout |
| Taille (`VM SIZE`) | `0 B` | Liée à la mémoire de la machine |
| Exemple d'usage | Avant d'installer un système ou de repartitionner | En plein travail, avant un essai dont on veut pouvoir revenir sans redémarrer |

### La console de QEMU

QEMU pilote la machine allumée par une **console**, appelée **moniteur** : une invite `(qemu)` où l'on tape des commandes qui concernent la machine elle-même (et non le système invité). Il y a deux façons d'y accéder.

| Façon | Comment |
|---|---|
| Avec `-nographic` | Dans la console de la VM, `Ctrl+A` puis `C` bascule entre la console de l'invité et le moniteur (`Ctrl+A` puis `X` quitte) |
| Avec `-monitor stdio` | Le moniteur occupe le terminal qui a lancé QEMU, et la console de l'invité passe ailleurs (par exemple `-serial null` pour l'ignorer) |

Dans le moniteur, les commandes sur les snapshots sont :

| Commande | Rôle |
|---|---|
| `savevm NOM` | Prendre un snapshot disque et mémoire de la machine allumée |
| `loadvm NOM` | Revenir à ce snapshot (la machine reprend là où elle était) |
| `delvm NOM` | Détruire ce snapshot |
| `info snapshots` | Lister les snapshots |

Un essai complet (les commandes de la console sont envoyées par un [tube](/?c=langages&s=bash&p=redirections-et-pipes), pour qu'elles s'exécutent sans clavier ; le disque est un `qcow2` vide, donc le programme de la machine ne fait rien, mais les snapshots sont réels) :

```bash
qemu-img create -f qcow2 d6.qcow2 64M   # crée le disque d'essai (64 Mio)
# Les accolades regroupent des commandes ; echo écrit un texte, que le tube « | » envoie
# à QEMU, qui le lit comme si on le tapait dans le moniteur.
{
  sleep 3                       # laisse QEMU démarrer (sleep = attendre n secondes)
  echo 'savevm sauve1'          # snapshot disque et mémoire
  sleep 2                       # attend la fin de l'écriture
  echo 'loadvm sauve1'          # revient au snapshot
  sleep 2                       # attend la fin de la lecture
  echo 'info snapshots'         # liste les snapshots
  sleep 1                       # laisse le temps d'afficher
  echo 'delvm sauve1'           # détruit le snapshot
  sleep 1                       # attend la fin de la destruction
  echo 'info snapshots'         # liste de nouveau
  sleep 1                       # laisse le temps d'afficher
  echo 'quit'                   # arrête la machine
} | timeout 20 qemu-system-x86_64 -accel kvm -m 128M -nographic -nic none \
      -monitor stdio -serial null -drive file=d6.qcow2,format=qcow2
```

Sortie obtenue, nettoyée des caractères d'écho du terminal :

```text
QEMU 8.2.2 monitor - type 'help' for more information
(qemu) savevm sauve1
(qemu) loadvm sauve1
(qemu) info snapshots
List of snapshots present on all disks:
ID        TAG               VM SIZE                DATE     VM CLOCK     ICOUNT
--        sauve1           1.02 MiB 2026-10-31 21:10:15 00:00:02.966
(qemu) delvm sauve1
(qemu) info snapshots
There is no snapshot available.
```

`savevm` et `loadvm` n'affichent rien quand ils réussissent. Un snapshot de machine laissé en place apparaît aussi dans `qemu-img snapshot -l` une fois la VM arrêtée, avec une colonne `VM SIZE` non nulle (`2.25 MiB` dans un autre essai, `1.02 MiB` ici : la machine d'essai n'exécute presque rien, donc très peu d'état à garder). Pour une vraie machine avec un système chargé, cette taille peut approcher la mémoire occupée (non mesuré ici).

Au lancement, l'option `-loadvm NOM` reprend directement un snapshot de machine : après `savevm s2`, la commande `qemu-system-x86_64 ... -loadvm s2` démarre la machine dans l'état photographié (le moniteur répond `VM status: running`).

> **Piège :** `savevm` exige que **tous** les disques inscriptibles soient en `qcow2`. Sur un disque `raw`, QEMU refuse : `Error: Device 'ide0-hd0' is writable but does not support snapshots`. Un disque `raw` oublié dans le montage suffit à bloquer.

## Un snapshot n'est pas une sauvegarde

Un snapshot interne **vit dans le fichier** `qcow2`. Ce n'est pas une copie placée ailleurs, c'est un bout du même fichier.

| Événement | Le snapshot survit-il ? |
|---|---|
| On modifie le disque après le snapshot | Oui : c'est son intérêt |
| On copie le fichier `qcow2` | Oui : la copie emporte ses snapshots (vérifié : `snapshot -l` sur la copie les liste) |
| On supprime le fichier `qcow2` | **Non** : le snapshot disparaît avec lui |
| Le fichier est corrompu (panne de courant de l'hôte, disque défectueux) | **Non** : le snapshot et l'état courant sont dans le même fichier abîmé |
| Le disque de l'hôte tombe en panne | **Non** : tout est dans cet unique fichier |

Un snapshot protège contre **une erreur dans l'invité** (une commande ratée, une mauvaise installation). Une sauvegarde protège contre **la perte du fichier**. Les deux se complètent.

```bash
# La VM doit être éteinte : copier un disque en cours d'écriture le rendrait incohérent
# cp copie le fichier entier, snapshots compris
cp debian-depannage.qcow2 debian-depannage.sauvegarde.qcow2
```

Mettre cette copie sur un **autre** disque physique ou un autre ordinateur, sinon la sauvegarde partage le sort du fichier d'origine.

## Éteindre proprement avant le snapshot

Un snapshot de disque seul photographie ce qui est **écrit dans le fichier** à l'instant de la prise. Or un système d'exploitation garde une partie de ses écritures **en mémoire** avant de les envoyer au disque (c'est plus rapide). Si la machine est coupée sans préavis, ces écritures sont perdues et le disque peut être dans un état intermédiaire : fichiers tronqués, système de fichiers (la manière dont le disque range les fichiers, voir [Partitionnement et LVM](/?c=infrastructure-devops&s=administration-systeme&p=partitionnement-et-lvm)) à réparer au prochain démarrage.

Fermer la fenêtre de QEMU, ou taper `quit` dans le moniteur, **arrête le processus QEMU sur-le-champ** : pour l'invité, cela revient à une coupure du courant. Le même effet vient d'un `kill` sur le processus de QEMU. Un [processus](/?c=langages&s=bash&p=gestion-des-processus) est un programme en cours d'exécution, et `kill` lui envoie un **signal** (un message envoyé à un programme ; par défaut une demande d'arrêt).

| Méthode d'arrêt | Effet sur l'invité | Pour un snapshot disque seul |
|---|---|---|
| `sudo poweroff` ou `sudo shutdown -h now` **dans l'invité** | Le système termine ses écritures, détache ses disques, puis s'éteint | Bon : le disque est cohérent |
| Fermer la fenêtre de QEMU | Équivaut à débrancher la machine | À éviter |
| `quit` dans le moniteur | Idem | À éviter |
| `timeout` qui expire sur QEMU | Idem (QEMU est arrêté par un signal) | À éviter pour autre chose qu'un essai |
| `system_powerdown` dans le moniteur | Envoie à l'invité une demande d'arrêt, comme un appui sur le bouton d'alimentation ; l'invité s'éteint proprement s'il réagit à ce bouton (non testé ici, aucun système installé) | Bon si l'invité réagit |

La séquence sûre :

| Étape | Action | Pourquoi |
|---|---|---|
| 1 | Dans l'invité, taper `sudo poweroff` | Écritures terminées, système de fichiers fermé proprement |
| 2 | Attendre que le processus QEMU **se termine de lui-même** (la fenêtre se ferme) | Le disque est libéré : le verrou disparaît |
| 3 | `qemu-img snapshot -c avant-etape disque.qcow2` | Photo d'un disque cohérent |
| 4 | Relancer la VM | Suite du travail |

Pour un snapshot de machine allumée avec `savevm`, la question ne se pose pas dans les mêmes termes : l'état de la RAM est sauvegardé avec le disque, et `loadvm` rend la machine telle quelle, caches compris (les copies temporaires gardées en mémoire).

## Questions fréquentes

| Question | Réponse |
|---|---|
| Peut-on prendre un snapshot de plusieurs disques à la fois ? | Avec `savevm`, oui : tous les disques inscriptibles sont photographiés ensemble (ils doivent tous être en `qcow2`). Avec `qemu-img snapshot`, un fichier à la fois |
| Et sur Windows ou macOS ? | QEMU existe aussi sur ces systèmes, mais KVM est propre à Linux : il faut choisir une autre accélération (`-accel tcg` marche partout). Les autres accélérations (non testées ici) sont documentées sur le site de QEMU |
| Combien de snapshots au maximum ? | Aucun plafond n'a été mesuré ici ; la vraie limite est la place disque, car chaque snapshot garde ses blocs |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Confondre les deux sens de « hôte » | On cherche un réglage au mauvais endroit (QEMU au lieu du Linux de construction, ou l'inverse) | Se demander de quoi la machine est l'hôte |
| Disque nommé `hote.qcow2` | Le nom ne dit pas de quel hôte il s'agit | Nommer par contenu et rôle |
| `-accel kvm` sans KVM disponible | Le lancement échoue (non reproduit ici) | Tester `/dev/kvm`, ou utiliser `-accel tcg` |
| Oublier `-f qcow2` ou `format=qcow2` | `qemu-img create` fabrique un raw ; au lancement QEMU devine le format et avertit | Toujours préciser le format |
| `-cdrom` oublié ou ISO mal nommée | `No bootable device.` sur un disque vide | Vérifier le nom et le chemin de l'ISO |
| Garder `-cdrom` après l'installation avec `-boot order=dc` | On retombe sur l'installateur | Ordre `cd`, ou retirer `-cdrom` |
| Fermer la fenêtre de la VM | Coupure du courant virtuelle, disque incohérent | Éteindre depuis l'invité |
| Prendre un snapshot de disque pendant que la VM tourne | Refusé par le verrou (`Failed to get "write" lock`) | Éteindre, ou utiliser `savevm` |
| Copier un `qcow2` pendant que la VM tourne | Copie incohérente | Éteindre d'abord |
| Prendre un snapshot comme sauvegarde | Il disparaît avec le fichier | Copier le fichier sur un autre support |
| Disque `raw` mêlé aux disques `qcow2` | `savevm` refusé | Convertir ou retirer le disque `raw` |
| Deux snapshots de même nom | Le nom ne désigne plus un snapshot précis | Noms uniques, avec la date |
| Empiler beaucoup de snapshots | Le fichier grossit et l'hôte peut manquer de place | Détruire les snapshots devenus inutiles (`-d`) |
| Croire que la taille du disque est réservée | Le fichier grandit avec l'usage, l'hôte peut se remplir | Surveiller l'espace libre de l'hôte |
| Mémoire d'invité trop grande | L'hôte manque de RAM et ralentit | Garder de la marge pour l'hôte |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Vérifier `/dev/kvm` avant de choisir l'accélération | Une VM rapide, ou un repli assumé sur `tcg` |
| Donner le format de chaque disque, partout | Aucune devinette de QEMU |
| Nommer les disques par leur contenu | Pas de confusion sur « l'hôte » |
| Lancer les essais sous `timeout`, avec une mémoire modeste | Un essai qui bloque s'arrête seul sans occuper la machine ; voir [timeout](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| Éteindre l'invité de l'intérieur avant un snapshot de disque | Un disque cohérent |
| Nommer chaque snapshot de façon unique et parlante | `-a` et `-d` visent le bon |
| Prendre un snapshot **avant** toute étape irréversible | Un retour en arrière en quelques secondes |
| Copier régulièrement le fichier `qcow2` vers un autre support | C'est la seule vraie sauvegarde |
| Détruire les snapshots devenus inutiles | Le fichier cesse de grossir |
| Lire `qemu-img snapshot -l` avant d'appliquer un snapshot | Savoir ce qu'on restaure et ce qu'on perd |

## Pour aller plus loin

| Sujet | Où |
|---|---|
| Toutes les options de QEMU | [Invocation de QEMU](https://www.qemu.org/docs/master/system/invocation.html) |
| L'outil `qemu-img` et ses sous-commandes | [Manuel de qemu-img](https://www.qemu.org/docs/master/tools/qemu-img.html) |
| Les commandes du moniteur | [Moniteur de QEMU](https://www.qemu.org/docs/master/system/monitor.html) |
| KVM | [Site du projet KVM](https://www.linux-kvm.org/page/Main_Page) |
| Fabriquer un Linux à partir des sources | [Linux From Scratch](https://www.linuxfromscratch.org/lfs/) |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | **QEMU** simule la machine (disques, écran, réseau) ; **KVM**, fonction du noyau Linux (`/dev/kvm`), la rend rapide en laissant le processeur réel exécuter l'invité, sinon `-accel tcg` émule tout par logiciel. Un lancement type : `qemu-system-x86_64 -accel kvm -m 2G -smp 2 -drive file=d.qcow2,format=qcow2 -cdrom x.iso -boot order=cd` (mémoire, cœurs, disque, lecteur CD ; `c` disque puis `d` CD, donc un disque vide laisse démarrer le CD, et `No bootable device.` signale qu'aucun support ne démarre). « Hôte » a deux sens : l'hôte de **virtualisation** (la machine réelle qui lance QEMU, face à l'invité) et l'hôte de **construction** (le Linux déjà installé qui sert à en fabriquer un autre, face au système cible) ; les deux peuvent se superposer. Un disque **`qcow2`** est un fichier qui grandit avec l'usage (`qemu-img create -f qcow2 d.qcow2 64M`, `qemu-img info`) et sait garder des **snapshots** : `qemu-img snapshot -c` crée, `-l` liste, `-a` applique, `-d` détruit (par le nom). Snapshot **disque seul** : VM éteinte, `qemu-img`. Snapshot **disque et RAM** : VM allumée, moniteur de QEMU, `savevm`, `loadvm`, `delvm`, `info snapshots`. |
| **Pièges à éviter** | Confondre les deux « hôtes » ; `-accel kvm` sans KVM ; oublier le format du disque ; fermer la fenêtre de la VM (c'est couper le courant) ; croire qu'un snapshot est une sauvegarde (il vit dans le fichier `qcow2` et disparaît avec lui) ; copier ou prendre un snapshot de disque pendant que la VM tourne ; un disque `raw` qui bloque `savevm` ; deux snapshots de même nom ; laisser les snapshots s'empiler. |
| **Bonnes pratiques** | Tester `/dev/kvm` d'abord ; préciser le format partout ; nommer disques et snapshots clairement ; éteindre l'invité de l'intérieur (`sudo poweroff`) avant un snapshot de disque ; un snapshot avant chaque étape risquée ; copier le fichier `qcow2` ailleurs pour une vraie sauvegarde ; lancer les essais sous `timeout`. |
