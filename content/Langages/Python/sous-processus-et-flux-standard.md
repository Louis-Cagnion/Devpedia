---
order: 17
---

# Sous-processus et redirection des flux standard

Un programme Python peut aussi bien lancer un AUTRE programme (`subprocess`) que modifier son propre comportement d'affichage (`sys.stdout`/`sys.stderr`) : ce chapitre couvre ces deux usages du module standard `sys`.

## Lancer un programme externe : `subprocess`

```python
import subprocess

resultat = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOQUANT
# 0 = succès, autre valeur = échec
print(resultat.returncode)
# ce que le programme a affiché
print(resultat.stdout)
```

`subprocess.run()` attend la fin du processus lancé avant de continuer.

```python
# NON BLOQUANT : renvoie IMMÉDIATEMENT, le processus tourne à côté
processus = subprocess.Popen(["ls", "-la"])
# ... faire autre chose pendant que "processus" s'exécute ...
processus.wait()  # attend explicitement la fin, si besoin
processus.poll()  # None si toujours en cours, sinon le code de retour
```

`subprocess.run()` (le plus courant) lance un processus et ATTEND sa fin avant de continuer ; `subprocess.Popen()` lance un processus et renvoie immédiatement un objet le représentant, utile pour lancer PLUSIEURS processus en parallèle (un par site, un par fichier...) sans attendre chacun avant de démarrer le suivant.

> **Piège :** avec `Popen()`, ne jamais appeler `.wait()` ni vérifier `.poll()` quelque part dans le programme peut laisser des processus « zombies » tourner sans être récupérés, si le programme principal se termine avant eux.

## `sys.executable` : le chemin de l'interpréteur en cours

```python
import sys

# "/usr/bin/python3.12" ou "C:\...\python.exe" -> chemin ABSOLU de l'interpréteur qui exécute
# CE code
sys.executable

# relance un script avec le MÊME interpréteur/environnement
subprocess.run([sys.executable, "autre_script.py"])
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
# remplace l'objet module par le double, sans toucher au reste du code
sys.stderr = FluxDouble(sys.stderr, log)

print("Erreur", file=sys.stderr)  # s'affiche à l'écran ET s'écrit dans execution.log
```

`sys.stdout`/`sys.stderr` sont de simples objets, remplaçables comme n'importe quelle variable module : leur assigner un objet qui expose `.write()`/`.flush()` intercepte silencieusement tout ce qui est déjà écrit ailleurs avec `print(..., file=sys.stderr)`. Le nom **Tee** vient de la commande Unix `tee` (déjà vue en [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), qui duplique un flux vers plusieurs destinations à la fois.

> **Piège :** remplacer `sys.stderr` change son comportement pour TOUT le programme, y compris du code tiers qui écrit dessus ; restaurer l'objet d'origine (`sys.stderr = flux_double.original`) en fin de programme évite un effet de bord persistant si le script est ensuite importé comme module ailleurs.

## Lancer plusieurs programmes en parallèle, avec un budget de temps

Pour chronométrer un programme externe sur de nombreux cas (un banc de mesure), deux besoins reviennent : **arrêter** un cas qui dépasse son budget, et en **lancer plusieurs à la fois**.

| Besoin | Outil |
|---|---|
| Arrêter un programme trop long | `subprocess.run(..., timeout=secondes)` : au-delà, le programme est tué et l'exception `subprocess.TimeoutExpired` est levée |
| Lancer plusieurs programmes en même temps | `concurrent.futures.ThreadPoolExecutor` : un groupe de threads qui exécutent chacun une fonction |
| Chronométrer | `time.perf_counter()`, une horloge qui ne recule jamais |

Des **threads** suffisent ici, alors que Python n'exécute qu'un thread de code Python à la fois (le [GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock), verrou global de l'interpréteur) : pendant que le programme externe tourne, le thread ne fait qu'attendre, et l'attente n'occupe pas le GIL. Pour un calcul fait en Python lui-même, il faudrait des processus (voir [Le parallélisme](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

```python
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

def lancer(duree):
    """Lance `sleep duree` avec un budget de 1 s ; renvoie (durée, temps réel, statut)."""
    debut = time.perf_counter()
    try:
        subprocess.run(["sleep", str(duree)], timeout=1, check=True)
        statut = "OK"
    except subprocess.TimeoutExpired:
        statut = "TROP LONG"                 # sleep a été tué au bout d'une seconde
    return duree, time.perf_counter() - debut, statut

debut = time.perf_counter()
with ThreadPoolExecutor(max_workers=4) as pool:
    for duree, temps, statut in pool.map(lancer, [0.5, 2, 0.2, 0.8]):
        print(f"sleep {duree} : {temps:.1f} s {statut}")
print(f"total : {time.perf_counter() - debut:.1f} s")
```

Sortie mesurée : les quatre commandes tournent en même temps, le total vaut 1,0 s, et `pool.map` rend les résultats **dans l'ordre des entrées**, quel que soit l'ordre dans lequel les commandes finissent :

```
sleep 0.5 : 0.5 s OK
sleep 2 : 1.0 s TROP LONG
sleep 0.2 : 0.2 s OK
sleep 0.8 : 0.8 s OK
total : 1.0 s
```

> **Piège :** en cas de dépassement, `subprocess.run` ne tue que le programme lancé, **pas les processus que ce programme a lui-même créés**. Pour un programme qui lance des sous-processus, il faut les regrouper (`start_new_session=True` avec `subprocess.Popen`) et tuer tout le groupe (`os.killpg`). Côté C, voir [les processus orphelins](/?c=langages&s=c&p=processus#quand-le-parent-meurt-avant-ses-enfants-les-processus-orphelins).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `subprocess.run()` lance un processus externe et attend sa fin ; `subprocess.Popen()` le lance sans attendre, pour du parallélisme. `sys.executable` donne le chemin de l'interpréteur en cours. `sys.stdout`/`sys.stderr` sont des objets remplaçables, ce qui permet de dupliquer une sortie (motif Tee). |
| **Outils utilisables** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, une classe `write()`/`flush()` assignée à `sys.stdout`/`sys.stderr` ; `timeout` et `subprocess.TimeoutExpired` ; `ThreadPoolExecutor` pour lancer plusieurs programmes à la fois. |
| **Pièges à éviter** | Un `Popen()` jamais attendu peut laisser des processus zombies. Remplacer `sys.stderr` sans le restaurer affecte tout code exécuté ensuite dans le même programme. |
| **Bonnes pratiques** | Utiliser `sys.executable` plutôt que `"python"` en dur pour relancer un script. Restaurer `sys.stderr`/`sys.stdout` d'origine en fin de programme après un Tee. |
