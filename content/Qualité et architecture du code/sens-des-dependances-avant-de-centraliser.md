---
order: 4
---

# Vérifier le sens des dépendances avant de centraliser

Centraliser une configuration partagée dans un seul endroit est en général une bonne idée (voir [Source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)) — mais l'endroit choisi n'est pas neutre : si ce nouvel emplacement se trouve "plus haut" dans le graphe de dépendances que certains de ses futurs utilisateurs, la centralisation crée un **import circulaire** plutôt que de simplifier quoi que ce soit.

## Un exemple concret

Un projet de scraping organisé en couches : un module `browser.py` bas niveau (ouvrir une page, cliquer, attendre) sans connaissance des sites particuliers, et un dossier `sites/` plus haut niveau qui importe `browser.py` pour implémenter le scraping de chaque site :

```text
sites/leboncoin.py  --importe-->  browser.py
sites/lacentrale.py --importe-->  browser.py
```

Certains réglages (des délais spécifiques à un site, des plages de variation aléatoire pour paraître moins robotique) semblaient, à première vue, appartenir logiquement à un registre centralisé des sites (`SITE_REGISTRY`, situé dans `sites/__init__.py`). Mais `browser.py` a lui-même besoin de lire ces réglages pour fonctionner — et `browser.py` est importé PAR `sites/`, pas l'inverse. Le déplacer créerait :

```text
browser.py  --importerait-->  sites/__init__.py  --importe-->  browser.py
```

Un cycle : `browser.py` importerait un module qui, transitivement, l'importe déjà. Selon le langage, cela produit soit une erreur au chargement, soit un import partiellement initialisé (souvent pire — le bug n'apparaît que dans certains ordres d'exécution). La solution retenue : garder ces réglages spécifiques dans `browser.py` lui-même, au prix d'une petite exception à la règle "tout ce qui concerne un site va dans le registre" — documentée en commentaire pour que la prochaine personne ne tente pas de "corriger" ce qui est en fait une contrainte structurelle.

## La question à se poser avant de centraliser

*Qui importe qui, aujourd'hui ?* Si le nouvel emplacement centralisé doit être importé par un module qui se trouve **en dessous**, dans le graphe de dépendances, du module où vit actuellement l'information à centraliser, le déplacement inverse le sens d'une dépendance existante — et un cycle apparaît dès qu'un module bas niveau a besoin, même indirectement, d'une information vivant dans un module haut niveau qui dépend de lui.

> **Repère pratique :** dans une architecture en couches (bas niveau ↔ haut niveau), l'information ne devrait circuler que dans un sens — des couches basses vers les couches hautes qui les utilisent. Une centralisation qui semble "logique" du point de vue du domaine (regrouper tout ce qui concerne un site) peut malgré tout violer ce sens si l'information est utilisée par une couche plus basse que l'endroit visé.

## Ce n'est pas une raison pour ne jamais centraliser

Ce principe ne dit pas d'éviter la centralisation — la [source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) reste souhaitable. Il dit de vérifier le graphe de dépendances **avant** de déplacer quoi que ce soit, et d'accepter qu'une information reste dans un module "moins logique" en apparence quand la seule alternative est un cycle — la clarté du rangement compte moins que l'absence de cycle.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Centraliser une information dans un module plus "haut" que certains de ses utilisateurs actuels crée un import circulaire, pas une simplification — le sens des dépendances existantes prime sur le rangement logique du domaine. |
| **Outils utilisables** | Se demander "qui importe qui, aujourd'hui ?" avant tout déplacement de configuration partagée. |
| **Pièges à éviter** | Déplacer une information vers un emplacement "logique" sans vérifier que ses utilisateurs actuels ne se trouvent pas plus bas dans le graphe de dépendances. |
| **Bonnes pratiques** | Accepter qu'une information reste dans un module "moins logique" en apparence quand la seule alternative est un cycle, documenté en commentaire pour éviter une future "correction" malvenue. |
