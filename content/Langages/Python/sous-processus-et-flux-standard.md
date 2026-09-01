---
order: 17
---

# Sous-processus et redirection des flux standard

Un programme Python peut aussi bien lancer un AUTRE programme (`subprocess`) que modifier son propre comportement d'affichage (`sys.stdout`/`sys.stderr`) : ce chapitre couvre ces deux usages du module standard `sys`.

## Lancer un programme externe : `subprocess`

```python
import subprocess

resultat = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUANT
print(resultat.returncode)                                                # 0 = succès, autre valeur = échec
print(resultat.stdout)                                                    # ce que le programme a affiché
```

`subprocess.run()` attend la fin du processus lancé avant de continuer.

```python
processus = subprocess.Popen(["ls", "-la"])  # NON BLOQUANT : renvoie IMMÉDIATEMENT, le processus tourne à côté
# ... faire autre chose pendant que "processus" s'exécute ...
processus.wait()  # attend explicitement la fin, si besoin
processus.poll()  # None si toujours en cours, sinon le code de retour
```

`subprocess.run()` (le plus courant) lance un processus et ATTEND sa fin avant de continuer ; `subprocess.Popen()` lance un processus et renvoie immédiatement un objet le représentant, utile pour lancer PLUSIEURS processus en parallèle (un par site, un par fichier...) sans attendre chacun avant de démarrer le suivant.

> **Piège :** avec `Popen()`, ne jamais appeler `.wait()` ni vérifier `.poll()` quelque part dans le programme peut laisser des processus « zombies » tourner sans être récupérés, si le programme principal se termine avant eux.

## `sys.executable` : le chemin de l'interpréteur en cours

```python
import sys

sys.executable  # "/usr/bin/python3.12" ou "C:\...\python.exe" -> chemin ABSOLU de l'interpréteur qui exécute CE code

subprocess.run([sys.executable, "autre_script.py"])  # relance un script avec le MÊME interpréteur/environnement
```

> **Bonne pratique :** utiliser `sys.executable` plutôt qu'un simple `"python"` codé en dur pour relancer un script Python : `"python"` pourrait pointer vers une toute autre installation (mauvaise version, mauvais [environnement virtuel](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) selon la machine.

## Rediriger `sys.stdout`/`sys.stderr` : le motif « Tee »

```python
import sys

class FluxDouble:  # duplique chaque écriture vers deux destinations
    def __init__(self, original, fichier_log):
        self.original = original
        self.fichier_log = fichier_log

    def write(self, texte):
        self.original.write(texte)     # écrit toujours à l'écran, comme avant
        self.fichier_log.write(texte)  # ET dans le fichier de log

    def flush(self):
        self.original.flush()
        self.fichier_log.flush()

log = open("execution.log", "a", encoding="utf-8")
sys.stderr = FluxDouble(sys.stderr, log)  # remplace l'objet module par le double, sans toucher au reste du code

print("Erreur", file=sys.stderr)  # s'affiche à l'écran ET s'écrit dans execution.log
```

`sys.stdout`/`sys.stderr` sont de simples objets, remplaçables comme n'importe quelle variable module : leur assigner un objet qui expose `.write()`/`.flush()` intercepte silencieusement tout ce qui est déjà écrit ailleurs avec `print(..., file=sys.stderr)`. Le nom **Tee** vient de la commande Unix `tee` (déjà vue en [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), qui duplique un flux vers plusieurs destinations à la fois.

> **Piège :** remplacer `sys.stderr` change son comportement pour TOUT le programme, y compris du code tiers qui écrit dessus ; restaurer l'objet d'origine (`sys.stderr = flux_double.original`) en fin de programme évite un effet de bord persistant si le script est ensuite importé comme module ailleurs.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `subprocess.run()` lance un processus externe et attend sa fin ; `subprocess.Popen()` le lance sans attendre, pour du parallélisme. `sys.executable` donne le chemin de l'interpréteur en cours. `sys.stdout`/`sys.stderr` sont des objets remplaçables, ce qui permet de dupliquer une sortie (motif Tee). |
| **Outils utilisables** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, une classe `write()`/`flush()` assignée à `sys.stdout`/`sys.stderr`. |
| **Pièges à éviter** | Un `Popen()` jamais attendu peut laisser des processus zombies. Remplacer `sys.stderr` sans le restaurer affecte tout code exécuté ensuite dans le même programme. |
| **Bonnes pratiques** | Utiliser `sys.executable` plutôt que `"python"` en dur pour relancer un script. Restaurer `sys.stderr`/`sys.stdout` d'origine en fin de programme après un Tee. |
