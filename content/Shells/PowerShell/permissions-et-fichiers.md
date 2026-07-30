---
order: 10
---

# Permissions et manipulation de fichiers

Windows n'utilise pas le modèle de permissions Unix (propriétaire/groupe/autres, `rwx`) vu dans le chapitre équivalent de Bash — il repose sur des **listes de contrôle d'accès** (ACL, *Access Control List*), plus fines mais plus verbeuses. Ce chapitre couvre ce système ainsi que les commandes de base pour manipuler fichiers et dossiers.

## Lire les permissions avec `Get-Acl`

```powershell
Get-Acl fichier.txt | Format-List
```

Contrairement aux 10 caractères compacts de `ls -l` (`-rw-r--r--`), une ACL Windows liste explicitement chaque utilisateur ou groupe et les droits qui lui sont accordés :

```
Owner   : DESKTOP\utilisateur
Access  : DESKTOP\utilisateur Allow  FullControl
          BUILTIN\Users        Allow  ReadAndExecute
```

Chaque ligne d'accès associe une **identité** (utilisateur ou groupe) à un **droit** (`FullControl`, `Modify`, `ReadAndExecute`...) — il peut y en avoir un nombre arbitraire, contrairement aux trois catégories fixes d'Unix (propriétaire/groupe/autres).

## `Set-Acl` : modifier les permissions

```powershell
$acl = Get-Acl fichier.txt
$regle = New-Object System.Security.AccessControl.FileSystemAccessRule("DESKTOP\jean", "ReadAndExecute", "Allow")
$acl.SetAccessRule($regle)
Set-Acl fichier.txt $acl
```

> **Note :** contrairement à `chmod 755` (une seule commande, un seul chiffre), modifier une ACL Windows nécessite de récupérer l'ACL existante, construire une règle, puis la réappliquer — plus verbeux, mais permet d'accorder des droits différents à un nombre arbitraire d'utilisateurs sur un même fichier, ce que le modèle Unix ne permet pas nativement.

## `icacls` : l'équivalent en ligne de commande classique

Plus proche dans l'esprit de `chmod`/`chown`, `icacls` reste très utilisé en pratique pour sa concision :

```powershell
icacls fichier.txt /grant "jean:(R,W)"    # accorde lecture+écriture à l'utilisateur jean
icacls fichier.txt /remove "jean"          # retire tous les droits explicites de jean
```

## Commandes de base sur les fichiers

```powershell
New-Item -ItemType Directory -Path dossier         # crée un dossier
New-Item -ItemType Directory -Path a\b\c -Force     # crée toute l'arborescence en une fois
New-Item -ItemType File -Path fichier.txt            # crée un fichier vide
Copy-Item source.txt destination.txt                  # copie un fichier
Copy-Item -Recurse dossier_source dossier_dest         # copie récursive, nécessaire pour un dossier
Move-Item ancien.txt nouveau.txt                        # déplace OU renomme, comme mv en Bash
Remove-Item fichier.txt                                   # supprime un fichier (va à la corbeille par défaut dans l'explorateur, mais pas ici)
Remove-Item -Recurse dossier                               # supprime un dossier et tout son contenu
```

> **Note :** comme `rm -rf` en Bash, `Remove-Item -Recurse -Force` est irréversible en ligne de commande (contrairement à une suppression via l'explorateur Windows, qui passe par la corbeille) — une cible mal ciblée peut supprimer bien plus que prévu, sans confirmation ni recours.

## `Get-ChildItem -Recurse` : rechercher des fichiers (équivalent de `find`)

```powershell
Get-ChildItem -Path . -Filter "*.txt" -Recurse                          # tous les fichiers .txt, récursivement
Get-ChildItem -Path C:\logs -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }  # modifiés récemment
Get-ChildItem -Recurse -Directory -Filter "node_modules"                  # tous les dossiers nommés "node_modules"
Get-ChildItem -Recurse -Filter "*.tmp" | Remove-Item                       # trouve ET supprime en une seule chaîne
```

Voir aussi le chapitre sur le traitement de texte et d'objets (`Select-String`, `-replace`, `ConvertFrom-Json`) pour aller plus loin dans l'exploitation du contenu de ces fichiers.
