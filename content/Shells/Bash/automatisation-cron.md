---
order: 14
---

# Automatiser des tâches avec cron

`cron` est un service qui tourne en permanence en arrière-plan (un **daemon**) et exécute des commandes à intervalles réguliers, définis à l'avance : sauvegardes nocturnes, purge de fichiers temporaires, envoi de rapports périodiques.

## Le fichier crontab

Chaque utilisateur possède son propre **crontab**, une liste de tâches planifiées, éditée avec :

```bash
crontab -e     # ouvre le crontab dans l'éditeur par défaut
crontab -l      # affiche le crontab actuel sans l'ouvrir
crontab -r      # supprime tout le crontab de l'utilisateur courant
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
0 3 * * *        /home/user/scripts/sauvegarde.sh    # tous les jours à 3h00
*/15 * * * *      /home/user/scripts/verifier-espace.sh # toutes les 15 minutes
0 9 * * 1          /home/user/scripts/rapport-hebdo.sh  # tous les lundis à 9h00
0 0 1 * *          /home/user/scripts/purge-logs.sh     # le 1er de chaque mois à minuit
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

Sur les distributions utilisant `systemd`, les **timers** couvrent le même besoin avec en plus des dépendances explicites entre services, une meilleure journalisation (intégrée à `journalctl`), et une exécution garantie même si la machine était éteinte au moment prévu. Plus verbeux à configurer qu'une simple ligne de crontab, ils sont préférés dans les environnements serveur modernes pour cette raison ; `cron` reste largement suffisant pour un usage personnel ou ponctuel.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `cron` exécute des commandes à intervalles réguliers définis dans un crontab (5 champs de temps). Il tourne dans un environnement minimal (pas de `.bashrc`, `PATH` réduit) : très différent d'un terminal ouvert manuellement. |
| **Outils utilisables** | `crontab -e`/`-l`, chaînes spéciales (`@daily`, `@reboot`...), `flock` pour éviter les exécutions concurrentes. |
| **Pièges à éviter** | Supposer que le `PATH`/l'environnement de cron est identique à celui d'un terminal interactif ; laisser une tâche échouer silencieusement sans redirection de sortie. |
| **Bonnes pratiques** | Utiliser des chemins absolus dans une commande cron ; rediriger systématiquement la sortie vers un fichier de log. |
