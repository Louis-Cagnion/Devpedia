---
order: 14
---

# Automatiser des tâches avec cron

`cron` est un service qui tourne en permanence en arrière-plan (un **daemon**) et exécute des commandes à intervalles réguliers, définis à l'avance : sauvegardes nocturnes, purge de fichiers temporaires, envoi de rapports périodiques.

## Le fichier crontab

Chaque utilisateur possède son propre **crontab**, une liste de tâches planifiées, éditée avec :

```bash
crontab -e  # ouvre le crontab dans l'éditeur par défaut
crontab -l  # affiche le crontab actuel sans l'ouvrir
crontab -r  # supprime tout le crontab de l'utilisateur courant
```

Chaque ligne suit un format à 5 champs de temps, suivis de la commande à exécuter :

```text
┌───────────── minute (0-59)
│ ┌─────────── heure (0-23)
│ │ ┌───────── jour du mois (1-31)
│ │ │ ┌─────── mois (1-12)
│ │ │ │ ┌───── jour de la semaine (0-6, 0 = dimanche)
│ │ │ │ │
* * * * *  commande_a_executer
```

```bash
0 3 * * *        /home/user/scripts/sauvegarde.sh        # tous les jours à 3h00
*/15 * * * *      /home/user/scripts/verifier-espace.sh  # toutes les 15 minutes
0 9 * * 1          /home/user/scripts/rapport-hebdo.sh   # tous les lundis à 9h00
0 0 1 * *          /home/user/scripts/purge-logs.sh      # le 1er de chaque mois à minuit
```

Un `*` signifie "à chaque valeur possible de ce champ" ; `*/15` sur le champ des minutes signifie "toutes les 15 minutes" (0, 15, 30, 45).

## Chaînes spéciales

Pour les plannings courants, des raccourcis évitent de compter les champs :

| Chaîne | Équivalent |
|---|---|
| `@reboot` | Exécutée une fois, au démarrage du système |
| `@hourly` | `0 * * * *` |
| `@daily` | `0 0 * * *` |
| `@weekly` | `0 0 * * 0` |
| `@monthly` | `0 0 1 * *` |
| `@yearly` | `0 0 1 1 *` |

```bash
@reboot   /home/user/scripts/init-cache.sh
@daily     /home/user/scripts/sauvegarde.sh
```

## Le piège de l'environnement minimal

Une commande lancée par cron ne s'exécute pas dans le même contexte qu'un terminal ouvert manuellement : cron démarre un shell **non interactif**, qui ne charge ni `.bashrc` ni `.bash_profile`, et son [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) est réduit à quelques répertoires système de base, souvent sans `/usr/local/bin`, là où beaucoup d'outils installés manuellement se trouvent.

Un script qui fonctionne parfaitement lancé à la main peut donc échouer silencieusement sous cron, avec une erreur `command not found` invisible puisque rien n'affiche cette sortie par défaut (cf. section suivante). Deux précautions systématiques :

```bash
# À éviter : suppose que "python3" est dans le PATH de cron
0 3 * * *   python3 sauvegarde.py

# Plus sûr : chemin absolu vers l'exécutable ET le script
0 3 * * *   /usr/bin/python3 /home/user/scripts/sauvegarde.py
```

Si une variable d'environnement précise est nécessaire (une clé d'API, par exemple), elle doit être définie explicitement en tête du crontab ou dans le script lui-même : l'environnement du shell interactif habituel n'existe pas ici.

## Ne jamais laisser une tâche cron échouer en silence

Par défaut, la sortie d'une commande cron (si elle en produit) est envoyée par email à l'utilisateur local (rarement configuré, donc généralement perdue). Rediriger explicitement vers un fichier de log (voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes)) rend l'exécution traçable :

```bash
0 3 * * *   /home/user/scripts/sauvegarde.sh >> /var/log/sauvegarde.log 2>&1
```

Une tâche cron qui échoue sans que personne ne le remarque est un échec silencieux : l'un des pièges les plus coûteux en automatisation, puisque le problème n'est découvert que lorsque son absence de résultat devient elle-même un incident (une sauvegarde qui n'a en réalité jamais tourné depuis des mois). Une commande de secours après un `||` (voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes) pour le chaînage de commandes), ou un service de supervision externe notifié en cas d'échec, transforme ce silence en signal explicite.

## Éviter les exécutions concurrentes avec `flock`

Si une tâche peut durer plus longtemps que l'intervalle qui la relance (ex. toutes les 5 minutes, mais une exécution qui prend parfois 8 minutes), deux instances peuvent se chevaucher. `flock` garantit qu'une seule instance tourne à la fois, en s'appuyant sur un verrou (fichier) plutôt que sur une supposition de durée :

```bash
*/5 * * * *   flock -n /tmp/sauvegarde.lock /home/user/scripts/sauvegarde.sh
```

`-n` (*non-blocking*) fait échouer immédiatement une nouvelle tentative si le verrou est déjà pris, plutôt que d'empiler les exécutions en attente.

## `systemd timers`, une alternative sur les systèmes basés sur systemd

[`systemd`](https://www.freedesktop.org/software/systemd/man/systemd.html) est le système d'initialisation utilisé par la majorité des distributions Linux modernes (Ubuntu, Debian, Fedora...) : c'est lui qui démarre et supervise l'ensemble des services en arrière-plan de la machine — `cron` en fait lui-même partie sur ces distributions. Sur un système basé sur `systemd`, les **timers** couvrent le même besoin qu'une ligne de crontab, avec une configuration plus verbeuse mais un fonctionnement plus explicite.

### Deux fichiers au lieu d'une ligne

`systemd` configure chaque comportement dans une **unit** (unité), un fichier texte qui décrit *quoi faire* ou *quand le faire*. Une tâche planifiée en demande deux, liées par leur nom de fichier :

```text
sauvegarde.service   ┐
                      ├─ même nom, extension différente
sauvegarde.timer     ┘
```

Le fichier `.service` décrit la commande à exécuter :

```ini
[Unit]
Description=Sauvegarde nocturne des documents      # texte affiché dans les journaux/le statut

[Service]
Type=oneshot                                        # s'exécute une fois puis s'arrête (pas un service qui tourne en continu)
WorkingDirectory=/home/user/scripts                 # dossier de travail avant de lancer la commande
ExecStart=/usr/bin/python3 sauvegarde.py            # chemin absolu, même piège d'environnement minimal que cron
```

Le fichier `.timer` décrit quand déclencher le service du même nom :

```ini
[Unit]
Description=Planifie sauvegarde.service tous les jours

[Timer]
OnCalendar=daily                                    # équivalent de @daily en cron
Persistent=true                                     # rattrape l'exécution manquée si la machine était éteinte (voir plus bas)

[Install]
WantedBy=timers.target                              # nécessaire pour que "enable" active bien le timer
```

Les deux fichiers vont dans `/etc/systemd/system/` (portée système, nécessite les droits root) ou dans `~/.config/systemd/user/` (portée utilisateur, voir plus bas). Une fois en place :

```bash
systemctl daemon-reload              # relit les fichiers d'unité après une création/modification
systemctl enable --now sauvegarde.timer   # active le timer au démarrage ET le démarre immédiatement
systemctl list-timers                # liste les timers actifs et leur prochaine exécution
journalctl -u sauvegarde.service     # consulte les journaux de ce service (remplace la redirection manuelle vers un fichier de log)
```

### `Persistent=true` : le rattrapage n'est pas automatique

C'est la nuance la plus importante à retenir : sans `Persistent=true`, un timer se comporte exactement comme `cron` — si la machine est éteinte au moment prévu (ex. `OnCalendar=daily` à minuit sur un ordinateur portable éteint la nuit), l'exécution est simplement perdue, pas rattrapée. `Persistent=true` change ce comportement : `systemd` note sur disque la date de la dernière exécution, et si le timer découvre au démarrage suivant qu'une échéance a été manquée, il déclenche l'exécution immédiatement au lieu d'attendre la prochaine échéance planifiée.

| | `OnCalendar` seul | `OnCalendar` + `Persistent=true` |
|---|---|---|
| Machine allumée à l'heure prévue | Exécution à l'heure prévue | Exécution à l'heure prévue |
| Machine éteinte à l'heure prévue | Exécution perdue (comme `cron`) | Exécution au prochain démarrage du timer |

### Portée système ou portée utilisateur (`--user`)

Un timer placé dans `/etc/systemd/system/` tourne indépendamment de toute session ouverte, mais demande les droits root pour être créé. Un timer placé dans `~/.config/systemd/user/` ne demande pas de droits particuliers, mais s'appuie sur une instance `systemd` propre à l'utilisateur (commandes préfixées par `--user` : `systemctl --user enable --now ...`) — instance qui, par défaut, ne démarre qu'à l'ouverture d'une session pour cet utilisateur, et s'arrête à sa fermeture.

Cette dernière limite compte pour le rattrapage : un timer `--user` avec `Persistent=true` ne peut rattraper une exécution manquée qu'à la prochaine ouverture de session — pas au simple démarrage de la machine, si personne ne s'y connecte tout de suite. [`loginctl`](https://www.freedesktop.org/software/systemd/man/loginctl.html) permet de lever cette limite pour un utilisateur donné :

```bash
loginctl enable-linger user   # l'instance systemd --user de "user" démarre dès le boot, session ouverte ou non
```

### `cron` ou `systemd timer` ?

| | `cron` | `systemd timer` |
|---|---|---|
| Rattrapage si machine éteinte | Non | Oui, avec `Persistent=true` |
| Journalisation | Email (rarement configuré) ou redirection manuelle | Intégrée (`journalctl`) |
| Dépendances entre tâches | Non gérées nativement | Oui (une unit peut dépendre d'une autre) |
| Configuration | Une ligne dans le crontab | Deux fichiers par tâche |
| Portée utilisateur sans droits root | Oui, nativement | Oui, via `--user` (+ `loginctl enable-linger` pour tourner hors session) |

`cron` reste largement suffisant pour un usage personnel ou ponctuel sans contrainte de rattrapage ; les timers `systemd` deviennent préférables dès qu'une exécution manquée doit être rattrapée automatiquement, ou dans les environnements serveur modernes qui s'appuient déjà sur `systemd` pour tout le reste.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `cron` exécute des commandes à intervalles réguliers définis dans un crontab (5 champs de temps). Il tourne dans un environnement minimal (pas de `.bashrc`, `PATH` réduit) : très différent d'un terminal ouvert manuellement. Les timers `systemd` couvrent le même besoin avec un rattrapage possible des exécutions manquées. |
| **Outils utilisables** | `crontab -e`/`-l`, chaînes spéciales (`@daily`, `@reboot`...), `flock` pour éviter les exécutions concurrentes ; `.service`/`.timer` + `systemctl (--user) enable --now` + `journalctl` côté `systemd`. |
| **Pièges à éviter** | Supposer que le `PATH`/l'environnement de cron est identique à celui d'un terminal interactif ; laisser une tâche échouer silencieusement sans redirection de sortie ; croire qu'un `.timer` rattrape automatiquement une exécution manquée sans `Persistent=true` ; oublier qu'un timer `--user` ne tourne que pendant une session ouverte, sauf `loginctl enable-linger`. |
| **Bonnes pratiques** | Utiliser des chemins absolus dans une commande cron ; rediriger systématiquement la sortie vers un fichier de log ; ajouter `Persistent=true` à tout `.timer` où un rattrapage est nécessaire. |
