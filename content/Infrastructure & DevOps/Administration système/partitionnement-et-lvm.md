---
order: 2
---

# Partitionnement et LVM

Une fois [le système d'exploitation choisi](/?c=administration-systeme&p=virtualisation-et-choix-dos), son installation demande de décider comment organiser l'espace disque disponible. Ce chapitre couvre le partitionnement classique et son alignement, son chiffrement, et LVM, un outil qui rend cette organisation plus souple.

## Le partitionnement : découper un disque en zones indépendantes

Un disque physique peut être découpé en plusieurs **partitions**, chacune traitée par le système comme un disque séparé, avec son propre système de fichiers et son propre point de montage (l'emplacement où son contenu apparaît dans l'arborescence, voir [Arborescence et chemins](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disque physique (500 Go)
┌─────────────────┬──────────────────────────┐
│  /boot (1 Go)    │   / (racine, 100 Go)     │  ...au moins 2 partitions
└─────────────────┴──────────────────────────┘
```

Séparer par exemple `/` (le système) de `/home` (les données des utilisateurs) sur deux partitions distinctes isole les deux : un `/` qui se remplit entièrement (logs, mises à jour) ne bloque pas l'écriture de nouvelles données utilisateur dans `/home`, et une réinstallation du système peut se limiter à la partition `/` sans toucher aux données.

## Aligner ses partitions : commencer sur une frontière du disque

Le disque ne lit et n'écrit pas octet par octet, mais par **blocs**. Trois tailles se côtoient, et il faut les distinguer :

| Mot | Définition | Taille courante |
|---|---|---|
| **Secteur** | la plus petite unité numérotée du disque, celle que comptent `fdisk` et la table de partitions | 512 octets |
| **Bloc physique** | ce que le disque lit ou écrit réellement en une seule opération (voir [le stockage](/?c=infrastructure-devops&s=systemes-d-exploitation&p=composants-dun-ordinateur-et-demarrage)) | 4 Kio, soit 8 secteurs |
| **Bloc du système de fichiers** | l'unité de rangement du **système de fichiers** (la façon dont une partition range ses fichiers, par exemple `ext4`) | 4 Kio |

Une partition est **alignée** quand son premier secteur (sa colonne `Start`) tombe sur le début d'un bloc physique. Par convention, on vise un multiple de **2048 secteurs**, soit 1 Mio : c'est aussi un multiple de 8 secteurs, donc de la taille d'un bloc physique, et c'est la valeur que propose `fdisk` par défaut.

```text
Exemple sur un disque imaginaire (8 secteurs par bloc physique) :

Partition ALIGNÉE (début au secteur 8, multiple de 8)
bloc physique :   |   bloc 1   |   bloc 2   |   bloc 3   |
bloc du FS    :   |    FS 0    |    FS 1    |    FS 2    |
→ un bloc du système de fichiers = un bloc physique : 1 écriture

Partition DÉCALÉE (début au secteur 5)
bloc physique :   |   bloc 1   |   bloc 2   |   bloc 3   |
bloc du FS    :        |    FS 0    |    FS 1    |    FS 2    |
→ chaque bloc du FS chevauche 2 blocs physiques
```

Dans le cas décalé, écrire un seul bloc du système de fichiers oblige le disque à **lire** les deux blocs physiques touchés, modifier la partie concernée, puis **réécrire** les deux : trois à quatre opérations au lieu d'une. Rien ne plante et les données restent correctes : la perte est de performance, et elle ne se voit pas à l'usage.

### Vérifier un début

```bash
sudo fdisk -l /dev/sdb          # affiche la table de partitions du disque sdb (colonne Start en secteurs)
echo $(( 73402368 % 2048 ))     # % donne le reste de la division : 0 signifie « multiple de 2048 », donc aligné
echo $(( 73402369 % 2048 ))     # reste 1 : début décalé d'un secteur, donc non aligné
```

| Start | Reste de la division par 2048 | Verdict |
|---|---|---|
| 2048 | 0 | aligné |
| 10487808 | 0 | aligné |
| 73402368 | 0 | aligné |
| 73402369 | 1 | décalé d'un secteur |
| 63 (début historique hérité du DOS) | 63 | décalé |

### Quand l'alignement se décide

L'alignement est fixé **à la création de la table de partitions** : c'est elle qui enregistre les `Start`. Formater (`mkfs`), monter ou copier des fichiers ne déplacent aucun début : on peut le constater en relançant `fdisk -l` avant et après un `mkfs`, les `Start` ne bougent pas. C'est donc avant le formatage qu'il faut vérifier.

Le début proposé par défaut par `fdisk` est pratique, mais pas infaillible (un disque préparé avec un ancien outil peut faire proposer `63`) : on l'accepte, puis on vérifie la colonne `Start`.

### Corriger un décalage : supprimer, recréer, reformater

Déplacer le début d'une partition change l'endroit où chaque structure du système de fichiers se trouve, car elles sont toutes repérées **à partir du début de la partition**. Par exemple, le **superbloc** d'`ext4` (la zone qui décrit le système de fichiers : taille, type, nombre magique `0xEF53`) est à 1024 octets, soit 2 secteurs, du début. Décaler la partition d'un secteur fait lire au mauvais endroit : l'ancien système de fichiers devient illisible, et il faut le recréer avec `mkfs`.

| Partition | Début avant | Début après | Ce que `fdisk` signale à la recréation |
|---|---|---|---|
| `sdb3` | 10487808 | 10487808 (inchangé) | signature `ext4` détectée : il propose de l'effacer |
| `sdb4` | 73402369 | 73402368 | rien : il cherche le superbloc 2 secteurs après le **nouveau** début, donc un secteur avant celui de l'ancien système de fichiers |

La signature qui n'est plus détectée ne veut pas dire que les anciennes données ont disparu : elles sont toujours sur le disque jusqu'au `mkfs`.

> **Limites :**
> - Réaligner une partition qui contient déjà des fichiers impose de la supprimer, la recréer et la reformater : les fichiers sont perdus sans sauvegarde. D'où l'intérêt de vérifier **avant** d'y mettre quoi que ce soit.
> - Sur un disque virtuel (par exemple une machine virtuelle `QEMU`), `fdisk` annonce souvent des secteurs de 512 octets, logiques et physiques : le gain n'y est pas mesuré ici. Garder l'alignement à 1 Mio reste une habitude peu coûteuse qui évite le problème sur un vrai disque.
> - L'alignement ne règle pas tout : il n'améliore pas la vitesse de base du disque, il évite seulement de la perdre.

## Chiffrer une partition

Une partition chiffrée protège son contenu si le disque physique est volé ou accédé hors du système normal (démarrage depuis une autre clé USB, disque démonté et branché ailleurs) : sans la clé de déchiffrement, son contenu reste illisible. **LUKS** (*Linux Unified Key Setup*) est le standard Linux pour ce chiffrement, généralement demandé au démarrage sous forme d'une phrase de passe.

## LVM : une couche de souplesse entre le disque et les partitions

Un partitionnement classique fixe la taille de chaque partition **au moment de l'installation** : l'agrandir ensuite est risqué (nécessite souvent de déplacer des données). **LVM** (*Logical Volume Manager*) ajoute une couche d'abstraction qui rend cette taille modifiable après coup :

| Niveau LVM | Rôle |
|---|---|
| Volume physique (*Physical Volume*, PV) | Une partition ou un disque entier, tel que vu par LVM |
| Groupe de volumes (*Volume Group*, VG) | Un "pool" d'espace, formé en combinant un ou plusieurs PV |
| Volume logique (*Logical Volume*, LV) | Une portion du VG, utilisée comme une partition classique (formatée, montée) |

```text
Disque physique --> Volume physique (PV) --\
Disque physique --> Volume physique (PV) ----> Groupe de volumes (VG) --> Volumes logiques (LV)
                                                                              |
                                                                     /  (LV monté sur /)
                                                                     /home  (LV monté sur /home)
```

Un volume logique peut être agrandi en piochant dans l'espace encore libre du groupe de volumes, sans réinstallation ni déplacement physique des données existantes : c'est cette souplesse qui justifie LVM même sur un serveur unique, pas seulement dans un contexte avec plusieurs disques.

> **Note :** LVM et le chiffrement se combinent en empilant les couches : le disque physique est d'abord chiffré avec LUKS, puis LVM est configuré **par-dessus** ce volume déjà chiffré. Chaque volume logique hérite ainsi du chiffrement sans avoir à le configurer individuellement.

> **Piège :** créer une seule grosse partition `/` sans réfléchir au découpage : un incident (logs qui saturent le disque, par exemple) affecte alors l'intégralité du système plutôt qu'une zone isolée.
>
> **Bonne pratique :** prévoir au moins 2 partitions dès l'installation (typiquement `/` et `/home`, ou `/` et `/boot`), et utiliser LVM pour garder la possibilité d'ajuster leur taille plus tard sans réinstallation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le partitionnement découpe un disque en zones indépendantes, dont le début doit être un multiple de 2048 secteurs (alignement, décidé à la création de la table) ; LUKS chiffre une partition ; LVM ajoute une couche (PV → VG → LV) qui rend les tailles modifiables après l'installation. |
| **Outils utilisables** | LUKS pour le chiffrement, LVM (`pvcreate`, `vgcreate`, `lvcreate`) pour la gestion souple de l'espace disque. |
| **Pièges à éviter** | Une seule partition `/` non séparée : un incident sur une zone affecte tout le système. Un `Start` décalé (par exemple `73402369`) : rien ne plante, mais chaque écriture touche deux blocs physiques. |
| **Bonnes pratiques** | Vérifier chaque `Start` (reste de la division par 2048 égal à 0) avant de formater. Toujours prévoir au moins 2 partitions, et empiler LVM par-dessus un volume déjà chiffré avec LUKS plutôt que l'inverse. |
