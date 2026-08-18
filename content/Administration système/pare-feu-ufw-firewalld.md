---
order: 5
---

# Pare-feu : UFW et firewalld

Même avec [SSH durci](/?c=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) et un [contrôle d'accès obligatoire](/?c=administration-systeme&p=selinux-vs-apparmor) actif, un service qui écoute sur un port reste joignable par n'importe qui, sur n'importe quel port ouvert. Un **pare-feu** (*firewall*) filtre le trafic réseau entrant (et parfois sortant) selon des règles explicites : par défaut, tout ce qui n'est pas explicitement autorisé est refusé.

## Le principe : liste blanche plutôt que liste noire

La configuration la plus sûre d'un pare-feu commence par **tout refuser**, puis autorise explicitement uniquement ce qui est réellement nécessaire (typiquement, un seul port ouvert : SSH) :

```text
Trafic entrant
      |
      v
+-----------------+     port 22 (SSH) autorise -----> accepte
|   Pare-feu       |
|  (deny par       |     tout autre port -----------> refuse
|   defaut)         |
+-----------------+
```

C'est une application directe du principe de moindre privilège (déjà vu appliqué aux données dans [Sécurité des API web](/?c=cybersecurite&p=securite-api-web)) : plus la liste des ports ouverts est courte, plus la surface d'attaque disponible est réduite.

## UFW (Debian) : une interface simplifiée

**UFW** (*Uncomplicated Firewall*) est l'outil par défaut sous Debian/Ubuntu ; il simplifie la configuration du pare-feu du noyau Linux sans avoir à en manipuler directement les règles bas niveau :

```bash
ufw default deny incoming   # refuse tout le trafic entrant par défaut
ufw allow 2222/tcp          # autorise uniquement le port SSH (ici redéfini, voir le chapitre précédent)
ufw enable                  # active le pare-feu avec ces règles
ufw status                  # liste les règles actives
```

## firewalld (Rocky/RHEL) : un système de zones

**firewalld** est l'outil par défaut sous Rocky Linux/RHEL ; il organise ses règles par **zones**, chacune représentant un niveau de confiance réseau (ex : `public`, `internal`, `trusted`), plutôt qu'une simple liste de règles globales :

```bash
firewall-cmd --set-default-zone=public
firewall-cmd --zone=public --add-port=2222/tcp --permanent  # autorise SSH dans la zone "public"
firewall-cmd --reload                                        # applique les règles permanentes
firewall-cmd --list-all                                       # liste les règles de la zone active
```

## Comparer les deux

| | UFW | firewalld |
|---|---|---|
| Distribution par défaut | Debian, Ubuntu | Rocky Linux, RHEL |
| Modèle | Liste de règles globales | Zones, chacune avec son propre jeu de règles |
| Application immédiate | Oui, dès la commande | Nécessite `--permanent` puis `--reload` pour persister au redémarrage |

> **Piège :** ouvrir un port pour tester une configuration, puis oublier de le refermer une fois le test terminé : la liste des ports ouverts doit rester le reflet exact des services réellement nécessaires, pas un historique de tout ce qui a été essayé.
>
> **Bonne pratique :** partir d'un refus total par défaut et n'ouvrir qu'un seul port (SSH) sur un serveur qui n'héberge pas d'autre service exposé, conformément au principe de moindre privilège.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pare-feu filtre le trafic réseau ; la configuration la plus sûre refuse tout par défaut et n'autorise explicitement que les ports réellement nécessaires. UFW (Debian) utilise une liste de règles, firewalld (Rocky) des zones. |
| **Outils utilisables** | `ufw allow`/`ufw enable` (Debian) ; `firewall-cmd --add-port`/`--reload` (Rocky). |
| **Pièges à éviter** | Laisser ouvert un port qui n'était destiné qu'à un test ponctuel. |
| **Bonnes pratiques** | Refuser tout par défaut et n'ouvrir que le strict nécessaire (SSH seul, sur un serveur sans autre service exposé). |
