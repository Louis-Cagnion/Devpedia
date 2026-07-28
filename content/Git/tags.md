---
title: Les tags
---

Un **tag** est un pointeur vers un commit précis, comme une branche — mais contrairement à une branche, un tag ne **bouge jamais** une fois créé. Il sert typiquement à marquer une version publiée d'un projet (`v1.0.0`, `v2.3.1`...).

## Créer un tag

```bash
git tag v1.0.0                 # tag "léger" : simple pointeur, sans métadonnées
git tag -a v1.0.0 -m "Première version stable"   # tag "annoté" : avec auteur, date et message
```

> **Note :** un tag annoté (`-a`) est généralement préférable pour une vraie version publiée — il est enregistré comme un objet Git à part entière (avec son propre message et son auteur), contrairement au tag léger qui n'est qu'un simple alias vers un hash de commit.

## Lister et inspecter les tags

```bash
git tag                     # liste tous les tags
git tag -l "v1.*"            # filtre par motif
git show v1.0.0               # affiche les détails du tag (et le commit associé)
```

## Tagger un commit passé

```bash
git tag -a v0.9.0 a3f9c1d -m "Version bêta"   # tag un commit précis, pas forcément le plus récent
```

## Pousser des tags vers un remote

Les tags ne sont **pas** envoyés automatiquement par un `git push` classique :

```bash
git push origin v1.0.0     # pousse un tag précis
git push origin --tags      # pousse tous les tags locaux d'un coup
```

## Supprimer un tag

```bash
git tag -d v1.0.0                    # supprime localement
git push origin --delete v1.0.0       # supprime aussi côté remote
```

## Revenir à une version taguée

```bash
git checkout v1.0.0
```

> **Note :** ceci place le dépôt en état de **"detached HEAD"** (`HEAD` pointe directement sur un commit, plus sur une branche) — utile pour inspecter cette version précise, mais tout nouveau commit fait dans cet état n'appartiendrait à aucune branche et serait facilement perdu. Pour continuer à travailler à partir de là, créer d'abord une branche : `git checkout -b nouvelle-branche v1.0.0`.
