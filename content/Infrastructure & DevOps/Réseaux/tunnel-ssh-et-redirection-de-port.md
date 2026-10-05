---
order: 4
---

# Tunnel SSH et redirection de port

Certains services ne sont volontairement joignables que depuis la machine où ils tournent : une base de données, une interface d'administration, le port de débogage d'un navigateur. Un **tunnel SSH** permet de les atteindre depuis un autre poste sans les exposer au réseau, en faisant passer la connexion à l'intérieur d'une connexion [SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*, le protocole standard pour se connecter en sécurité à une machine distante) déjà chiffrée.

## Port, `localhost` : deux notions à connaître

Une machine reçoit les connexions sur des **ports**, des numéros de 1 à 65535 qui désignent chacun un programme à l'écoute (voir [les sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) pour la mécanique côté programme). Un service choisit à quelle adresse il écoute :

| Adresse d'écoute | Qui peut s'y connecter | Exemple |
|---|---|---|
| `0.0.0.0` | Toute machine qui atteint celle-ci par le réseau | Un site web public |
| `127.0.0.1` (appelée `localhost`) | Seulement les programmes de **la même machine** | Une base de données de développement, un port de débogage |

`127.0.0.1` est l'adresse de **bouclage** (*loopback*) : un paquet envoyé à cette adresse ne quitte jamais la machine. Un service qui n'écoute que sur `127.0.0.1` est donc invisible depuis le réseau, même sans pare-feu (voir [le pare-feu](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld)).

## Le principe : une redirection de port locale

La commande `ssh -L` ouvre un port sur **votre** machine et redirige tout ce qui y arrive, à travers la connexion SSH, vers un port atteignable depuis le **serveur** :

```text
Votre PC                              Serveur distant
┌─────────────────┐                   ┌──────────────────────────────┐
│ navigateur      │  tunnel chiffré   │ sshd (port 22, ouvert)       │
│ → localhost:9222│ ================> │   │                          │
└─────────────────┘                   │   ▼                          │
                                      │ service sur 127.0.0.1:9222   │
                                      │ (invisible depuis le réseau) │
                                      └──────────────────────────────┘
```

```powershell
ssh -N -L 9222:localhost:9222 utilisateur@serveur.exemple.fr
```

| Morceau | Signification |
|---|---|
| `-L 9222:localhost:9222` | Écouter sur le port 9222 de **ma** machine, et rediriger vers `localhost:9222` **vu depuis le serveur** |
| `-N` | Ne lancer aucune commande sur le serveur : la session ne sert qu'au tunnel |
| `utilisateur@serveur.exemple.fr` | Compte et machine auxquels on se connecte en SSH (authentification habituelle, par clé ou mot de passe) |

Tant que cette commande tourne, un programme local qui se connecte à `localhost:9222` parle en réalité au service du serveur. Le client `ssh` est fourni avec Windows 10 et 11, Linux et macOS ([manuel de ssh](https://man.openbsd.org/ssh)).

> **Piège :** dans `-L 9222:localhost:9222`, le mot `localhost` du milieu désigne le **serveur**, pas votre machine : la cible est résolue de l'autre côté du tunnel. Pour atteindre un troisième poste depuis le serveur, on y met son adresse (`-L 5433:base-interne:5432`).
>
> **Bonne pratique :** choisir pour le port local un numéro libre (le même que celui du service est le plus simple à retenir), et vérifier le tunnel par une vraie requête (par exemple `curl http://localhost:9222/json/version` pour le débogage de Chrome) plutôt que de supposer qu'il fonctionne.

## Les trois formes de redirection

| Option | Sens | Usage typique |
|---|---|---|
| `-L` (*local*) | Un port de **ma** machine mène à un port côté serveur | Atteindre une base de données ou une interface d'administration du serveur |
| `-R` (*remote*) | Un port du **serveur** mène à un port de ma machine | Laisser un serveur joindre un service qui tourne chez moi, derrière un routeur |
| `-D` (*dynamic*) | Un port local devient un proxy SOCKS, qui redirige vers n'importe quelle destination | Faire passer tout le trafic d'un navigateur par le serveur |

## Pièges et limites

Un tunnel contourne volontairement le pare-feu : l'accès est autorisé parce que SSH l'est, pas parce que le service l'est.

> **Piège :** exposer le tunnel au réseau. Par défaut `-L` n'écoute que sur `127.0.0.1` ; écrire `-L 0.0.0.0:9222:localhost:9222` rend le port local joignable par tout le réseau de votre poste, et donc l'accès au service distant par n'importe qui qui l'atteint, souvent sans authentification (le port de débogage de Chrome n'en a aucune).
>
> **Bonne pratique :** laisser l'écoute locale par défaut (`127.0.0.1`), et ne jamais ajouter d'adresse d'écoute sans raison précise.

> **Piège :** un tunnel tombe en silence quand la connexion SSH est coupée (veille de l'ordinateur, réseau instable) ; le programme qui s'en sert reçoit alors des erreurs de connexion refusée, sans lien apparent avec SSH.
>
> **Bonne pratique :** ajouter `-o ServerAliveInterval=30` (un message de contrôle toutes les 30 secondes, qui détecte une coupure) ; pour un tunnel permanent, laisser un outil le relancer (`autossh`, ou un service du système).

> **Piège :** une erreur `bind: Address already in use` au lancement signifie que le port local est déjà pris (souvent par un ancien tunnel resté ouvert).
>
> **Bonne pratique :** lister les ports en écoute (`netstat -ano` sous Windows, `ss -ltn` sous Linux), fermer l'ancien tunnel ou en choisir un autre.

Côté serveur, l'administrateur peut interdire ou limiter les redirections avec `AllowTcpForwarding` et `PermitOpen` dans `/etc/ssh/sshd_config` (voir [le durcissement de SSH](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe)).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un service qui n'écoute que sur `127.0.0.1` n'est joignable que depuis sa propre machine. `ssh -L port_local:cible:port_cible utilisateur@serveur` ouvre un port sur votre machine et le relie, par SSH, à une cible vue depuis le serveur ; `-R` fait l'inverse, `-D` crée un proxy SOCKS. Seul le port 22 du serveur reste ouvert. |
| **Outils utilisables** | `ssh -N -L …` (tunnel sans session), `-o ServerAliveInterval=30` (détection de coupure), `autossh` (relance automatique), `curl`, `netstat -ano` / `ss -ltn` (vérifier un tunnel et les ports pris). |
| **Pièges à éviter** | Croire que `localhost` du milieu désigne sa propre machine. Écouter sur `0.0.0.0` et exposer un service sans authentification à tout un réseau. Oublier qu'un tunnel tombe en silence. Un port local déjà occupé. |
| **Bonnes pratiques** | Garder l'écoute locale par défaut (`127.0.0.1`). Tester le tunnel par une vraie requête. Surveiller la connexion (`ServerAliveInterval`). Restreindre les redirections côté serveur (`AllowTcpForwarding`, `PermitOpen`). |
