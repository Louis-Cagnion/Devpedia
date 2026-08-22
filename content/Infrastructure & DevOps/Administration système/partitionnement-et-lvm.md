---
order: 2
---

# Partitionnement et LVM

Une fois [le système d'exploitation choisi](/?c=administration-systeme&p=virtualisation-et-choix-dos), son installation demande de décider comment organiser l'espace disque disponible. Ce chapitre couvre le partitionnement classique, son chiffrement, et LVM, un outil qui rend cette organisation plus souple.

## Le partitionnement : découper un disque en zones indépendantes

Un disque physique peut être découpé en plusieurs **partitions**, chacune traitée par le système comme un disque séparé, avec son propre système de fichiers et son propre point de montage (l'emplacement où son contenu apparaît dans l'arborescence, voir [Arborescence et chemins](/?c=bases-de-l-informatique&p=arborescence-et-chemins)).

```text
Disque physique (500 Go)
┌─────────────────┬──────────────────────────┐
│  /boot (1 Go)    │   / (racine, 100 Go)     │  ...au moins 2 partitions
└─────────────────┴──────────────────────────┘
```

Séparer par exemple `/` (le système) de `/home` (les données des utilisateurs) sur deux partitions distinctes isole les deux : un `/` qui se remplit entièrement (logs, mises à jour) ne bloque pas l'écriture de nouvelles données utilisateur dans `/home`, et une réinstallation du système peut se limiter à la partition `/` sans toucher aux données.

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
| **À retenir** | Le partitionnement découpe un disque en zones indépendantes ; LUKS chiffre une partition ; LVM ajoute une couche (PV → VG → LV) qui rend les tailles modifiables après l'installation. |
| **Outils utilisables** | LUKS pour le chiffrement, LVM (`pvcreate`, `vgcreate`, `lvcreate`) pour la gestion souple de l'espace disque. |
| **Pièges à éviter** | Une seule partition `/` non séparée : un incident sur une zone affecte tout le système. |
| **Bonnes pratiques** | Toujours prévoir au moins 2 partitions, et empiler LVM par-dessus un volume déjà chiffré avec LUKS plutôt que l'inverse. |
