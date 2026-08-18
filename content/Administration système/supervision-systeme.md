---
order: 6
---

# Lire l'état du système

Administrer un serveur suppose de pouvoir répondre en permanence à des questions simples : combien de mémoire reste-t-il libre ? Le disque approche-t-il de la saturation ? Qui est connecté en ce moment ? Ce chapitre couvre où trouver ces informations ; leur diffusion automatique (par exemple un message envoyé toutes les 10 minutes) est du ressort de [l'automatisation par cron](/?c=shells&s=bash&p=automatisation-cron), déjà traitée séparément.

## `/proc` : le système de fichiers qui n'existe pas vraiment

Sous Linux, `/proc` est un **système de fichiers virtuel** : ses fichiers n'existent sur aucun disque, le noyau les génère à la volée à chaque lecture pour exposer son état interne (processus, mémoire, matériel détecté). Le lire fonctionne exactement comme lire un fichier classique (`cat`, `grep`, redirections), mais son contenu reflète l'état du système **au moment précis** de la lecture, jamais une valeur mise en cache.

```bash
cat /proc/loadavg
# 0.15 0.10 0.05 1/523 12345
```

## Où trouver chaque information

| Information | Commande dédiée | Fichier `/proc` équivalent |
|---|---|---|
| Architecture et noyau | `uname -a` | `/proc/version` |
| Nombre de CPU physiques | `lscpu` | `/proc/cpuinfo` (compter les `physical id` distincts) |
| Nombre de CPU virtuels (vCPU) | `nproc` | `/proc/cpuinfo` (compter les entrées `processor`) |
| Mémoire utilisée (%) | `free -m` | `/proc/meminfo` (`MemTotal` / `MemAvailable`) |
| Espace disque utilisé (%) | `df -h` | - (information gérée par le système de fichiers monté, pas par `/proc`) |
| Charge CPU | `uptime` | `/proc/loadavg` |
| Date du dernier redémarrage | `who -b` ou `uptime -s` | `/proc/uptime` (secondes écoulées depuis le démarrage) |
| État LVM | `lvs` / `vgs` / `pvs` (voir [Partitionnement et LVM](/?c=administration-systeme&p=partitionnement-et-lvm)) | - |
| Connexions actives | `ss -t` | `/proc/net/tcp` |
| Utilisateurs connectés | `who` ou `w` | - |
| Adresse IPv4 et MAC | `ip addr` | `/proc/net/dev` (liste les interfaces, sans leurs adresses) |

> **Note :** deux façons d'obtenir la même information : une commande dédiée (`free`, `df`, `uptime`...), pensée pour être lisible directement, ou le fichier `/proc` correspondant, à parser soi-même. Une commande dédiée reste préférable dès qu'elle existe ; `/proc` sert surtout quand aucune commande adaptée n'est disponible, ou pour un script qui a besoin d'une valeur brute précise plutôt que d'un texte déjà mis en forme.

## Exemple : extraire une métrique précise

```bash
# pourcentage de mémoire utilisée, calculé à partir de /proc/meminfo
total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
dispo=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
echo "$(( (total - dispo) * 100 / total ))% de mémoire utilisée"
```

Ce genre d'extraction (via `awk`, voir [Traitement de texte](/?c=shells&s=bash&p=traitement-de-texte)) est la base d'un script de supervision système : chaque métrique du tableau ci-dessus est lue, mise en forme, puis assemblée en un message unique, que [`cron`](/?c=shells&s=bash&p=automatisation-cron) peut ensuite diffuser périodiquement (par exemple via `wall`, qui affiche un message à tous les utilisateurs connectés).

> **Piège :** parser directement le format d'un fichier `/proc` (nombre de colonnes, ordre des champs) sans vérifier qu'il reste stable : ce format n'est pas garanti identique entre toutes les versions du noyau. Un script qui fonctionne sur une machine peut échouer silencieusement sur une autre.
>
> **Bonne pratique :** préférer une commande dédiée quand elle existe (elle encapsule elle-même les variations de format), et ne lire `/proc` directement qu'en dernier recours, en testant le script sur la distribution réellement ciblée.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `/proc` est un système de fichiers virtuel généré par le noyau, qui reflète l'état du système en temps réel ; chaque métrique système courante (CPU, mémoire, réseau, utilisateurs) est accessible soit par une commande dédiée, soit via un fichier `/proc` correspondant. |
| **Outils utilisables** | `uname`, `lscpu`, `nproc`, `free`, `df`, `uptime`, `who`/`w`, `ss`, `ip addr`, `lvs`/`vgs`/`pvs`. |
| **Pièges à éviter** | Parser un fichier `/proc` sans vérifier la stabilité de son format entre distributions/versions du noyau. |
| **Bonnes pratiques** | Préférer une commande dédiée à `/proc` quand elle existe ; tester tout script de supervision sur la distribution réellement ciblée. |
