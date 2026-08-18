---
order: 1
---

# Fondamentaux réseau

Un **réseau informatique** est un ensemble de machines reliées entre elles, capables de s'échanger des données. Avant de savoir comment deux programmes communiquent (voir [Sockets et E/S non bloquante](/?c=reseaux&p=sockets-et-io-non-bloquante)), il faut comprendre comment une machine est identifiée sur ce réseau, et comment ses données trouvent leur chemin jusqu'à la bonne destination.

## L'adresse IP : identifier une machine

Une **adresse IP** (*Internet Protocol*) identifie de façon unique une machine sur un réseau, un peu comme un numéro de téléphone identifie un correspondant. La version la plus répandue, **IPv4**, s'écrit sous forme de 4 nombres entre 0 et 255, séparés par des points :

```text
192.168.1.10
 |    |  | |
 └────┴──┴─┴─ 4 blocs de 8 bits (0-255) = 32 bits au total
```

> **Note :** IPv4 ne permet que ~4,3 milliards d'adresses distinctes, un nombre déjà insuffisant pour tous les appareils connectés dans le monde. **IPv6**, sa version plus récente (adresses sur 128 bits, ex. `2001:0db8::1`), résout ce problème mais n'est pas encore universellement déployée ; ce chapitre se concentre sur IPv4, largement dominant en pratique.

## Le masque de sous-réseau : découper une adresse en deux parties

Une adresse IP seule ne dit pas quelles machines sont sur le **même** réseau local. Le **masque de sous-réseau** (*subnet mask*) répond à cette question : il découpe l'adresse IP en une partie **réseau** (identique pour toutes les machines du même réseau local) et une partie **hôte** (unique à chaque machine de ce réseau).

```text
Adresse IP    :  192.168.1  .  10
Masque        :  255.255.255.0
                 └─────────┘ └┘
                  partie        partie
                  réseau        hôte
```

| Élément | Rôle | Exemple |
|---|---|---|
| Partie réseau | Identifie le réseau local lui-même | `192.168.1` |
| Partie hôte | Identifie une machine précise à l'intérieur de ce réseau | `10` |

Deux machines dont la partie réseau (une fois le masque appliqué) est identique peuvent se parler **directement**, sans passer par un routeur. Si la partie réseau diffère, leurs données doivent obligatoirement transiter par un routeur pour se rejoindre.

## La passerelle par défaut : la sortie du réseau local

La **passerelle par défaut** (*default gateway*) est l'adresse IP à laquelle une machine envoie ses données dès que la destination ne se trouve **pas** sur son réseau local (partie réseau différente). Il s'agit presque toujours de l'adresse du routeur local.

```text
Ordinateur (192.168.1.10)
        |
        | destination sur le meme reseau (192.168.1.x) -> envoi direct
        | destination hors du reseau (ex: un site web)  -> envoi vers la passerelle
        v
Passerelle / routeur (192.168.1.1) --------> reste d'Internet
```

## Routeur vs switch : deux appareils, deux rôles

Ces deux appareils relient des machines entre elles, mais à des échelles différentes :

| | Switch | Routeur |
|---|---|---|
| Relie | Plusieurs machines **d'un même réseau local** | Plusieurs **réseaux** distincts entre eux |
| Décision prise sur | L'adresse physique de la carte réseau (adresse *MAC*) | L'adresse IP (partie réseau) |
| Exemple d'usage | Connecter les ordinateurs d'un même bureau | Connecter le réseau d'une maison au reste d'Internet |

> **Piège :** confondre les deux à cause de la boîte fournie par un fournisseur d'accès Internet (souvent appelée "box") : elle combine en réalité un routeur, un switch et un point d'accès Wi-Fi dans un seul boîtier.

## Les couches OSI : un découpage en responsabilités

Le **modèle OSI** découpe toute communication réseau en 7 couches empilées, chacune ne s'occupant que d'un aspect précis et s'appuyant sur la couche du dessous :

| Couche | Rôle | Exemple |
|---|---|---|
| 7. Application | Le protocole utilisé par le programme lui-même | HTTP, DNS |
| 6. Présentation | Format des données (chiffrement, encodage) | TLS |
| 5. Session | Ouverture/fermeture d'une conversation entre deux machines | - |
| 4. Transport | Découpage en paquets, fiabilité de l'acheminement | TCP, UDP |
| 3. Réseau | Adressage IP et routage entre réseaux | IP, le routeur |
| 2. Liaison | Adressage physique (MAC) au sein d'un même réseau local | Ethernet, le switch |
| 1. Physique | Le support physique du signal | Câble, Wi-Fi |

En pratique, un développeur manipule surtout les couches 3 à 7 : la [prise en main d'une socket](/?c=reseaux&p=sockets-et-io-non-bloquante) se fait au niveau de la couche transport (TCP/UDP), tandis qu'une [API HTTP](/?c=infrastructure&p=api-et-http) se situe au niveau de la couche application.

## Deux mécanismes complémentaires : DHCP et NAT

Deux services automatisent une partie de ce que ce chapitre vient d'expliquer manuellement :

- **[DHCP](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)** (*Dynamic Host Configuration Protocol*) attribue automatiquement une adresse IP, un masque et une passerelle à chaque machine qui rejoint le réseau, plutôt que de les configurer à la main.
- **[NAT](https://en.wikipedia.org/wiki/Network_address_translation)** (*Network Address Translation*) permet à plusieurs machines d'un réseau local, chacune avec sa propre adresse IP privée, de partager une seule adresse IP publique pour sortir vers Internet : c'est ce que fait la box d'un particulier pour l'ensemble des appareils de son foyer.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une adresse IP identifie une machine ; le masque de sous-réseau distingue la partie réseau de la partie hôte ; la passerelle sort du réseau local ; un switch relie des machines d'un même réseau, un routeur relie des réseaux entre eux. |
| **Outils utilisables** | Le modèle OSI pour situer un problème réseau dans la bonne couche ; DHCP pour l'attribution automatique d'adresses ; NAT pour le partage d'une IP publique. |
| **Pièges à éviter** | Confondre routeur et switch, ou croire qu'une "box" est un seul type d'appareil alors qu'elle en combine plusieurs. |
| **Bonnes pratiques** | Toujours vérifier si deux machines partagent la même partie réseau avant de chercher pourquoi elles ne communiquent pas directement. |
