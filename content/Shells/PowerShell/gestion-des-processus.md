---
order: 11
---

# La gestion des processus

Comme sous Bash, chaque commande lancée démarre un **processus** — PowerShell permet là aussi de lancer des commandes en arrière-plan, de surveiller les processus en cours, et de les arrêter proprement (ou non).

## Premier plan vs arrière-plan

```powershell
Start-Job -ScriptBlock { .\long_traitement.ps1 }   # lance en tâche d'arrière-plan (job)
Write-Output "La console reste disponible immédiatement"
```

## Gérer les tâches en arrière-plan (`Get-Job`, `Receive-Job`)

```powershell
$job = Start-Job -ScriptBlock { .\long_traitement.ps1 }
Get-Job                        # liste les jobs de la session courante, avec leur état
Wait-Job $job                   # attend la fin du job (bloquant), équivalent d'un "fg" qui attendrait
Receive-Job $job                # récupère la sortie produite par le job
```

> **Note :** contrairement à Bash où `fg`/`bg` basculent une tâche entre premier plan et arrière-plan de la **même** session console, un `Job` PowerShell tourne dans un processus séparé dès le départ — `Receive-Job` récupère son résultat une fois terminé, plutôt que de le "ramener" dans la console courante.

## Voir les processus en cours (`Get-Process`)

```powershell
Get-Process                                    # liste tous les processus, avec CPU, mémoire, PID...
Get-Process | Where-Object { $_.Name -like "*chrome*" }   # filtre par nom, équivalent de "ps aux | grep"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5   # les 5 processus les plus gourmands en CPU
```

## Terminer un processus (`Stop-Process`)

```powershell
Stop-Process -Id 1234              # demande l'arrêt du processus (équivalent le plus proche de SIGTERM)
Stop-Process -Id 1234 -Force        # arrêt forcé, sans attendre une fermeture propre (équivalent de SIGKILL)
Stop-Process -Name "notepad"         # cible par nom plutôt que par PID
```

> **Note :** Windows n'a pas de véritable équivalent des signaux Unix (`SIGTERM`, `SIGKILL`, `SIGINT`...) — `Stop-Process` sans `-Force` demande au processus de se terminer, mais le mécanisme sous-jacent reste différent de l'envoi d'un signal interceptable comme sous Unix ; la plupart des applications Windows n'ont d'ailleurs pas de gestionnaire dédié pour "se fermer proprement" à la manière d'un [`trap SIGTERM`](/?c=shells&s=bash&p=gestion-des-processus) en Bash.

| Action | Bash (signal) | PowerShell |
|---|---|---|
| Demander un arrêt propre | `kill` (`SIGTERM`) | `Stop-Process -Id <pid>` |
| Forcer l'arrêt | `kill -9` (`SIGKILL`) | `Stop-Process -Id <pid> -Force` |
| Interrompre depuis le clavier | `Ctrl+C` (`SIGINT`) | `Ctrl+C` (déclenche une exception `PipelineStoppedException`) |

## Détacher un processus de la console

Contrairement à `nohup` en Bash, un `Job` PowerShell (`Start-Job`) tourne déjà dans un processus séparé du processus console — fermer la console n'interrompt donc pas nécessairement le job selon le contexte (session locale vs distante), sans avoir besoin d'un outil dédié équivalent à `nohup`.

## Trouver un processus par son nom

```powershell
Get-Process -Name "*long_traitement*"                          # équivalent de pgrep
Get-Process -Name "*long_traitement*" | Stop-Process             # trouve ET termine, équivalent de pkill
```

> **`Get-Process` vs `Stop-Process`** : comme la paire `pgrep`/`pkill` en Bash, chercher un processus (lecture) et le terminer (action) restent deux cmdlets distinctes — combinées par un pipe plutôt que par un drapeau partagé. Le même risque existe qu'avec `pkill` : un filtre `-Name` trop large peut cibler plus de processus que prévu.
