---
order: 4
---

# Durcissement SSH, sudo et mots de passe

Un système installé avec ses réglages par défaut reste vulnérable à des attaques automatisées, qui balaient Internet en testant des ports et des identifiants standards. **Durcir** un système consiste à réduire cette surface d'attaque : ce chapitre couvre trois points d'entrée fréquemment ciblés.

## Durcir l'accès distant : SSH

[SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*) est le protocole standard pour administrer un serveur à distance ; son fichier de configuration, `/etc/ssh/sshd_config`, contrôle son comportement :

| Réglage | Effet | Pourquoi |
|---|---|---|
| `Port 2222` (au lieu de `22`) | Change le port d'écoute par défaut | Réduit le bruit des scans automatisés qui ciblent le port 22 par défaut (ne remplace pas une vraie sécurité, mais filtre les tentatives les plus basiques) |
| `PermitRootLogin no` | Interdit la connexion SSH directe avec le compte `root` | Force à se connecter avec un compte utilisateur nominatif, puis à élever ses privilèges via `sudo` (voir plus bas) : chaque action reste tracée à une personne précise |

> **Note :** changer le port SSH ne remplace pas les autres mesures (mot de passe fort, `PermitRootLogin no`) : un attaquant ciblé peut toujours scanner tous les ports. C'est une réduction de bruit, pas une protection à elle seule.

## Imposer une politique de mots de passe (PAM / `login.defs`)

**PAM** (*Pluggable Authentication Modules*) est le système Linux qui gère l'authentification (mots de passe compris) de façon modulaire ; `/etc/login.defs` et les modules PAM associés permettent d'imposer des règles :

| Règle | Où | Exemple de valeur |
|---|---|---|
| Expiration du mot de passe | `login.defs` (`PASS_MAX_DAYS`) | 30 jours |
| Délai minimum entre deux changements | `login.defs` (`PASS_MIN_DAYS`) | 2 jours (empêche de changer 2 fois de suite pour revenir à l'ancien mot de passe) |
| Alerte avant expiration | `login.defs` (`PASS_WARN_AGE`) | 7 jours avant |
| Complexité minimale | Module PAM (`pam_pwquality`) | Majuscule + minuscule + chiffre, au plus 3 caractères identiques consécutifs, différent du nom d'utilisateur, au moins 7 caractères différents du mot de passe précédent |

## Durcir `sudo`

`sudo` permet à un utilisateur autorisé d'exécuter une commande avec les privilèges de `root`, sans partager le mot de passe `root` lui-même. Son fichier de configuration (`/etc/sudoers`, à éditer via `visudo`) accepte plusieurs réglages de durcissement :

```text
Defaults passwd_tries=3                          # 3 tentatives de mot de passe maximum
Defaults badpass_message="Mot de passe incorrect, tentative refusée."
Defaults logfile="/var/log/sudo/sudo.log"        # journalise chaque commande sudo
Defaults log_input, log_output                    # journalise aussi ce qui est tapé/affiché
Defaults use_pty                                  # exécute la commande dans un pseudo-terminal dédié
Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

| Réglage | Rôle |
|---|---|
| `passwd_tries` | Limite le nombre d'essais avant de bloquer la commande |
| `badpass_message` | Personnalise le message affiché en cas d'échec |
| `logfile` / `log_input` / `log_output` | Trace intégralement chaque commande exécutée via `sudo`, avec ce qui a été tapé et affiché |
| `use_pty` | Empêche certaines techniques de contournement de la journalisation en forçant un vrai pseudo-terminal |
| `secure_path` | Restreint les dossiers où `sudo` cherche les commandes exécutables, pour empêcher qu'un dossier ajouté au `PATH` personnel de l'utilisateur (voir [Les variables d'environnement](/?c=shells&s=bash&p=variables-denvironnement)) ne fasse exécuter un programme malveillant à la place du vrai |

> **Piège :** journaliser les commandes `sudo` (`logfile`) sans activer `use_pty` : certaines commandes interactives peuvent alors échapper partiellement à la capture des entrées/sorties.
>
> **Bonne pratique :** combiner les trois axes de ce chapitre plutôt qu'un seul isolément : un SSH durci mais un mot de passe faible, ou l'inverse, laisse toujours une porte ouverte.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Durcir un système combine trois axes : SSH (port non standard, `root` interdit en direct), une politique de mot de passe stricte (PAM/`login.defs`), et un `sudo` journalisé et restreint. |
| **Outils utilisables** | `/etc/ssh/sshd_config`, `/etc/login.defs` + `pam_pwquality`, `visudo`/`/etc/sudoers`. |
| **Pièges à éviter** | Journaliser `sudo` sans `use_pty` ; ne durcir qu'un seul des trois axes en laissant les autres par défaut. |
| **Bonnes pratiques** | Restreindre `secure_path`, forcer un compte nominatif avant `sudo`, et combiner systématiquement les trois axes du chapitre. |
