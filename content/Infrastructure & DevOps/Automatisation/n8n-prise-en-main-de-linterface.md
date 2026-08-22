---
order: 2
---

# n8n : prise en main de l'interface

Le chapitre sur l'[automatisation par workflow visuel](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) pose le vocabulaire commun à ces outils (déclencheur, action, connecteur). Ce chapitre l'applique concrètement à l'interface de [n8n](https://n8n.io), pour savoir où se trouve chaque chose avant de construire un premier workflow.

## Le canvas : l'espace de travail visuel

Le **canvas** est la zone principale de l'éditeur n8n : un espace blanc où chaque **nœud** (*node*) apparaît comme un bloc rectangulaire, positionné librement à la souris. Un nœud représente toujours l'une des trois briques déjà vues (déclencheur, action, ou un nœud spécial de logique) ; son icône et son nom indiquent immédiatement le service ou la fonction qu'il représente.

```text
Canvas n8n (vue simplifiée) :

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Déclencheur │─────▶│   Action 1   │─────▶│   Action 2   │
│  (Webhook)   │      │  (HTTP Req.) │      │   (Slack)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

Ajouter un nœud se fait via le bouton **+** (sur le canvas ou à la suite d'un nœud existant), qui ouvre un panneau de recherche listant tous les connecteurs disponibles (plus de 400 services intégrés, plus un nœud HTTP générique pour tout service sans connecteur dédié).

## Les connexions : faire circuler les données

Une **connexion** est le trait qui relie la sortie d'un nœud à l'entrée du suivant : elle représente à la fois l'ordre d'exécution (le nœud suivant s'exécute après celui qui le précède) et le passage de données entre eux (chaque nœud reçoit en entrée ce que le précédent a produit en sortie).

> **Piège :** croire qu'une connexion transporte uniquement un signal "exécute-toi maintenant", sans donnée. En réalité, chaque nœud reçoit un tableau d'éléments de données (souvent au format JSON) produit par le nœud précédent, et peut s'en servir dans sa propre configuration (ex. réutiliser l'adresse e-mail extraite par le nœud précédent).
>
> **Bonne pratique :** avant de configurer un nœud, vérifier dans le panneau d'exécution (voir plus bas) la forme exacte des données reçues du nœud précédent, plutôt que de la deviner.

Un nœud peut avoir plusieurs connexions sortantes : c'est ainsi qu'un **nœud conditionnel** (*IF*, *Switch*) fait bifurquer le workflow selon un critère, chaque branche menant à une suite d'actions différente. Ce type de nœud est détaillé dans le chapitre suivant sur le catalogue des fonctionnalités.

## Configurer un nœud

Double-cliquer sur un nœud ouvre son panneau de configuration, spécifique au service qu'il représente : identifiants de connexion (souvent gérés à part, dans des **credentials** réutilisables d'un workflow à l'autre), champs à renseigner (destinataire d'un e-mail, canal Slack, URL d'une requête HTTP), et le mapping des données reçues du nœud précédent vers ces champs.

```text
Configuration d'un nœud "Envoyer un e-mail" :

  Destinataire : {{ $json.email }}     <- valeur prise dans les
  Sujet        : "Confirmation"           données reçues du nœud
  Corps        : "Bonjour {{ $json.nom }}"   précédent
```

La syntaxe `{{ ... }}` insère une **expression** : au lieu d'une valeur fixe, le champ va chercher une donnée dynamique (ici, dans le JSON reçu en entrée du nœud).

## Le panneau d'exécution : voir ce qui s'est vraiment passé

Chaque exécution d'un workflow (manuelle ou déclenchée réellement) laisse une trace consultable : le **panneau d'exécution** liste, nœud par nœud, les données reçues en entrée et produites en sortie, avec un code couleur (vert pour un succès, rouge pour une erreur) qui permet de repérer immédiatement où un workflow a échoué.

| Information visible | Utilité |
|---|---|
| Données d'entrée/sortie de chaque nœud | Vérifier que les données attendues sont bien celles reçues |
| Statut (succès/erreur) par nœud | Localiser précisément où un workflow s'est arrêté |
| Historique des exécutions passées | Comparer une exécution en échec à une exécution réussie antérieure |

## Tester manuellement avant d'activer

Un workflow nouvellement créé reste **inactif** par défaut : son déclencheur réel (un webhook, une planification) ne se met en marche qu'une fois le workflow explicitement activé. Le bouton **"Test workflow"** exécute le workflow immédiatement, une seule fois, sans attendre le déclencheur réel, en insérant des données d'exemple si nécessaire.

> **Piège :** activer un workflow directement après l'avoir construit, sans l'avoir testé manuellement au préalable. Un webhook mal configuré ou une action qui envoie réellement un message peut alors s'exécuter en conditions réelles avant d'avoir été vérifié, potentiellement de façon répétée si le déclencheur se produit souvent.
>
> **Bonne pratique :** toujours exécuter "Test workflow" au moins une fois, vérifier chaque nœud dans le panneau d'exécution, avant de basculer l'interrupteur d'activation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le canvas affiche les nœuds d'un workflow reliés par des connexions, qui transportent à la fois l'ordre d'exécution et les données. Configurer un nœud consiste à renseigner ses champs, parfois avec des expressions dynamiques (`{{ }}`) puisées dans les données reçues. Le panneau d'exécution montre le détail entrée/sortie de chaque nœud, succès ou échec. |
| **Outils utilisables** | Le bouton "+" pour ajouter un nœud ; le panneau d'exécution pour inspecter les données ; le bouton "Test workflow" pour une exécution manuelle. |
| **Pièges à éviter** | Croire qu'une connexion ne transporte aucune donnée. Activer un workflow sans l'avoir testé manuellement au préalable. |
| **Bonnes pratiques** | Vérifier la forme des données reçues avant de configurer un nœud qui s'en sert. Toujours tester manuellement avant d'activer. |
