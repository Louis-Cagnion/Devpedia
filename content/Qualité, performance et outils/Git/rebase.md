---
order: 13
---

# Le rebase

`git rebase` propose une alternative à `git merge` (voir [Les branches](/?c=git&p=branches)) pour intégrer des changements entre deux branches : au lieu de créer un commit de fusion à deux parents, il **rejoue** les commits d'une branche par-dessus une autre, produisant un historique linéaire.

## Merge vs rebase, visuellement

```text
Avant :
main:     A -- B -- C
                \
feature:         D -- E

Après un merge :                Après un rebase de feature sur main :
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebasée)
```

Le rebase ne "déplace" pas littéralement les commits `D` et `E` : il crée de **nouveaux** commits (`D'`, `E'`) avec le même contenu mais un parent différent, d'où des hash différents des originaux.

## Effectuer un rebase

```bash
git checkout feature
git rebase main
```

Git rejoue un par un chaque commit de `feature` (absent de `main`) par-dessus le dernier commit de `main`. En cas de conflit sur un commit précis (voir [Résoudre un conflit de fusion](/?c=git&p=resoudre-conflits)), le rebase s'arrête pour le résoudre :

```bash
# après avoir résolu les conflits dans les fichiers concernés :
git add fichier_en_conflit.txt
git rebase --continue

# ou, pour annuler complètement le rebase en cours et revenir à l'état d'avant :
git rebase --abort
```

## Le rebase interactif : réécrire son historique local

```bash
git rebase -i HEAD~3   # ouvre un éditeur pour les 3 derniers commits
```

```text
pick a1b2c3d Ajoute le formulaire de contact
pick e4f5g6h Corrige une typo
pick i7j8k9l Ajoute la validation email
```

Chaque ligne peut être modifiée avant de sauvegarder :

| Action | Effet |
|---|---|
| `pick` | Garder le commit tel quel |
| `reword` | Garder le commit, mais modifier son message |
| `squash` | Fusionner ce commit avec le précédent (garde les deux messages, à fusionner) |
| `fixup` | Comme `squash`, mais jette le message de ce commit |
| `drop` | Supprime complètement ce commit |

Utile par exemple pour nettoyer un historique de travail ("Corrige une typo", "Oups", "Vraiment corrige la typo cette fois") en un seul commit propre avant de le partager.

## Reformuler sans éditeur interactif : `reset --soft` + recommit ciblé

`rebase -i` ouvre un éditeur de texte interactif, ce qui échoue tel quel dans un contexte sans terminal attaché (script, CI, agent automatisé). Pour reformuler le message d'un commit qui n'est pas le dernier, sans passer par un éditeur, `git reset --soft` vers la base commune permet de tout remettre en scène puis de recommiter chaque commit un par un avec le bon message :

```bash
git reset --soft <commit-avant-le-plus-ancien-a-reformuler>
git reset            # désempile tout (le dossier de travail garde l'état final)

# pour chaque commit à recréer dans l'ordre d'origine :
git show <ancien-hash-du-commit>:chemin/fichier.py > chemin/fichier.py  # remet CE fichier a son etat a ce commit-la
git add chemin/fichier.py ...
git commit -F message-corrige.txt   # jamais -m pour un message multi-ligne avec accents : voir plus bas
```

`git show <hash>:<chemin>` extrait le contenu d'un fichier tel qu'il était à un commit précis, ce qui permet de reconstituer l'état intermédiaire de chaque commit avant de le recommiter, y compris quand un même fichier a changé sur plusieurs des commits à reformuler.

> **Note :** rédiger un message multi-ligne accentué directement dans `git commit -m "$(cat <<'EOF' ... EOF)"` (heredoc bash) est une source d'erreur fréquente : le message tapé « à la volée » dans un appel de commande retombe facilement sur une convention ASCII (ex. "vehicule" au lieu de "véhicule") sans que rien ne le signale. Écrire le message dans un fichier texte, le relire, puis `git commit -F fichier.txt` évite ce piège en séparant la rédaction de l'exécution de la commande.

Cette méthode ne change ni le contenu ni l'ordre des commits, seulement leurs messages : c'est un `reword` manuel, plus verbeux que `rebase -i` mais utilisable sans aucune interaction humaine.

## La règle d'or : ne jamais rebaser un historique déjà partagé

```bash
# à ÉVITER si d'autres personnes ont déjà récupéré ces commits :
git rebase main
git push --force
```

> **Note :** quand un force-push est réellement légitime (rebaser puis re-pousser une branche qu'on est seul à utiliser), `git push --force-with-lease` est plus sûr que `--force` : il vérifie d'abord que personne d'autre n'a poussé de commit sur cette branche depuis le dernier `fetch`, et refuse l'opération dans ce cas plutôt que d'écraser aveuglément un travail qu'on n'a pas vu passer.

Puisque le rebase crée de **nouveaux** commits avec des hash différents, le pousser en écrasant l'historique distant (`--force`) désynchronise brutalement quiconque avait déjà basé du travail sur les anciens commits : leurs branches locales référenceraient des commits qui n'existent plus côté serveur. Le rebase est sûr sur des commits **strictement locaux**, jamais encore partagés.

Voir aussi [Les branches](/?c=git&p=branches) (merge, l'alternative la plus sûre pour un historique déjà partagé) et [Résoudre un conflit de fusion](/?c=git&p=resoudre-conflits).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `git rebase` rejoue les commits d'une branche par-dessus une autre, produisant un historique linéaire, au prix de nouveaux commits (hash différents) plutôt qu'un commit de fusion. |
| **Outils utilisables** | `git rebase`, `git rebase -i` (réécriture interactive : pick/reword/squash/fixup/drop), `git rebase --continue`/`--abort`. |
| **Pièges à éviter** | Rebaser un historique déjà partagé : les hash changent, ce qui désynchronise quiconque avait déjà basé du travail sur les anciens commits. |
| **Bonnes pratiques** | Ne rebaser que des commits strictement locaux ; si un push forcé est réellement nécessaire, préférer `--force-with-lease` à `--force`. |
