---
order: 1
---

# Les concepts de base

## Conteneur vs machine virtuelle

Une **machine virtuelle** (VM) virtualise du matériel : elle embarque son propre noyau (*kernel*) et démarre comme un ordinateur complet, ce qui la rend lourde (plusieurs Go, démarrage en dizaines de secondes) mais totalement isolée de l'hôte. Un **conteneur** est plus léger : c'est un processus classique du système hôte, qui **partage le noyau** de cet hôte mais s'exécute dans un environnement isolé du reste du système.

```
Machine virtuelle                    Conteneur
┌─────────────────┐                  ┌─────────────────┐
│   Application    │                  │   Application    │
│   Bibliothèques   │                  │   Bibliothèques   │
│   Noyau invité    │                  ├─────────────────┤
├─────────────────┤                  │  Moteur Docker    │
│   Hyperviseur     │                  ├─────────────────┤
├─────────────────┤                  │  Noyau de l'hôte  │
│  Noyau de l'hôte  │                  └─────────────────┘
└─────────────────┘
```

> **Conséquence directe :** un conteneur Linux ne peut pas tourner nativement sous Windows ou macOS — Docker Desktop y démarre en réalité une petite VM Linux pour héberger les conteneurs. Sur un serveur Linux, en revanche, aucune couche de virtualisation n'est nécessaire.

## Sous le capot : namespaces et cgroups

L'isolation d'un conteneur repose sur deux mécanismes du noyau Linux, pas sur une technologie propre à Docker :

- Les **namespaces** cloisonnent ce qu'un processus *voit* : son propre arbre de processus (il croit être le PID 1), son propre système de fichiers, sa propre interface réseau... Un processus dans un namespace ne voit ni ne peut affecter ce qui se passe dans un autre namespace.
- Les **cgroups** (*control groups*) limitent ce qu'un processus *peut consommer* : CPU, mémoire, bande passante disque. C'est ce qui empêche un conteneur de saturer toutes les ressources de la machine hôte.

Docker orchestre ces deux mécanismes, déjà présents dans le noyau, pour donner l'illusion d'une machine isolée à moindre coût.

## Image vs conteneur

Une **image** est un modèle immuable, en lecture seule : un système de fichiers figé (une distribution minimale, les dépendances installées, le code de l'application) plus des métadonnées (commande à exécuter au démarrage, ports exposés...). Un **conteneur** est une instance en cours d'exécution de cette image, avec une fine couche inscriptible ajoutée par-dessus.

```
Image (lecture seule)  -->  docker run  -->  Conteneur (image + couche inscriptible + processus)
```

Une même image peut donc démarrer plusieurs conteneurs indépendants, chacun avec sa propre couche inscriptible — modifier un conteneur ne modifie jamais l'image dont il est issu.

## Les images sont construites en couches

Une image est empilée en **couches** (*layers*), chacune correspondant à une instruction du Dockerfile (cf. chapitre dédié) : installer un paquet, copier du code, etc. Ces couches sont partagées et mises en cache entre images : si deux images partagent leurs premières couches (ex. la même image de base), Docker ne les stocke, ni ne les télécharge, qu'une seule fois.

> **Note :** c'est une déduplication automatique par contenu, sur le même principe que le [stockage d'objets de Git](/?c=git&p=architecture-interne) — deux couches identiques produisent le même identifiant et ne sont jamais dupliquées sur disque.
