---
order: 1
---

# Virtualisation et choix d'OS

Administrer un serveur Linux commence avant même d'y taper une commande : il faut d'abord une machine sur laquelle l'installer, et une distribution à y faire tourner. Ce chapitre couvre ces deux décisions préalables ; les suivants supposent qu'un système est déjà installé et accessible.

## Créer la machine : un hyperviseur de type 2

Sans serveur physique dédié, une [machine virtuelle](/?c=docker&p=concepts-de-base) (VM) simule un ordinateur complet à l'intérieur de son propre poste de travail, via un **hyperviseur**. Deux logiciels courants pour ce cas d'usage local :

| Logiciel | Plateforme hôte | Particularité |
|---|---|---|
| [VirtualBox](https://www.virtualbox.org/) | Windows, macOS, Linux | Gratuit, open source, très répandu, prend en charge de nombreux systèmes invités |
| [UTM](https://mac.getutm.app/) | macOS (Apple Silicon et Intel) | S'appuie sur l'hyperviseur natif d'Apple, plus performant sur Mac récent que VirtualBox |

> **Note :** les deux sont des hyperviseurs de **type 2** (installés comme une application ordinaire par-dessus un système d'exploitation déjà présent), à distinguer d'un hyperviseur de type 1 (installé directement sur le matériel, sans système hôte, utilisé plutôt en environnement de production).

## Choisir une distribution : Debian ou Rocky Linux

Le choix de la distribution installée dans la VM conditionne les outils disponibles pour la suite (gestionnaire de paquets, contrôle d'accès obligatoire, voir [SELinux vs AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor)) :

| | Debian | Rocky Linux |
|---|---|---|
| Origine | Distribution communautaire indépendante | Reconstruction communautaire de Red Hat Enterprise Linux (RHEL) |
| Gestionnaire de paquets | `apt` (`.deb`) | `dnf` (`.rpm`) |
| Contrôle d'accès obligatoire | [AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor) | [SELinux](/?c=administration-systeme&p=selinux-vs-apparmor) |
| Pare-feu par défaut | [UFW](/?c=administration-systeme&p=pare-feu-ufw-firewalld) | [firewalld](/?c=administration-systeme&p=pare-feu-ufw-firewalld) |
| Points forts | Grande communauté, mises à jour fréquentes, très documentée | Compatible avec l'écosystème RHEL (utilisé en entreprise), cycle de support long |
| Compromis | Moins orientée "entreprise" que RHEL/Rocky | Courbe d'apprentissage un peu plus raide (SELinux plus strict qu'AppArmor par défaut) |

Aucun des deux n'est objectivement "meilleur" : Debian privilégie la simplicité et une communauté très large, Rocky Linux privilégie la proximité avec un environnement d'entreprise réel (RHEL est largement utilisé en production). Le choix dépend surtout de l'objectif : apprendre l'administration système "générique" (Debian) ou se rapprocher des pratiques d'une entreprise utilisant du RHEL (Rocky).

> **Piège :** installer une distribution puis mélanger des instructions trouvées en ligne pour l'autre (ex : utiliser `apt` sur Rocky Linux) : les deux familles de distributions ont des outils et des chemins de configuration différents, rarement interchangeables.
>
> **Bonne pratique :** une fois la distribution choisie, rester cohérent avec son écosystème (gestionnaire de paquets, documentation officielle de cette distribution) plutôt que de mélanger des sources d'information pensées pour l'autre famille.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un hyperviseur de type 2 (VirtualBox, UTM) permet de créer une VM sur un poste de travail existant ; Debian et Rocky Linux sont deux familles de distributions aux outils différents (`apt`/AppArmor/UFW vs `dnf`/SELinux/firewalld). |
| **Outils utilisables** | VirtualBox (multiplateforme) ou UTM (macOS) pour créer la VM ; `apt` ou `dnf` selon la distribution choisie. |
| **Pièges à éviter** | Mélanger des commandes ou de la documentation pensées pour l'autre famille de distribution. |
| **Bonnes pratiques** | Choisir la distribution en fonction de l'objectif (apprentissage générique vs proximité avec un environnement d'entreprise RHEL), puis rester cohérent avec son écosystème. |
