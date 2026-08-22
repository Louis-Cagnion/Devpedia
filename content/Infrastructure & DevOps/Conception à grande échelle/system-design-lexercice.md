---
order: 1
---

# Le "system design" comme genre d'exercice

"Conçois Uber." "Conçois LeetCode." Ce type de consigne, très courant en entretien technique, ne demande pas d'écrire du code : il demande de raisonner sur les grandes briques qui composeraient le produit, comment elles communiquent, et pourquoi ce choix plutôt qu'un autre à l'échelle visée. C'est un exercice différent de celui couvert par [Qualité et architecture du code](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=qualite-et-architecture-du-code) : celui-ci porte sur la qualité d'un code déjà écrit, le "system design" porte sur des choix pris **avant** d'écrire la moindre ligne de code, à un niveau où seuls des composants (client, serveur, base de données...) et leurs échanges sont dessinés, sous forme de boîtes reliées par des flèches.

## La structure type d'un exercice de system design

| Étape | Question à laquelle elle répond |
|---|---|
| 1. Cadrer le besoin et l'échelle | Combien d'utilisateurs, combien de requêtes par seconde, quelle proportion de lectures contre d'écritures ? |
| 2. Dessiner l'architecture globale | Quels composants (client, serveurs, bases de données, cache...) et comment ils communiquent, sans encore les détailler |
| 3. Approfondir 1 ou 2 composants critiques | Quel est le point le plus difficile du système, et comment le résoudre précisément ? |
| 4. Discuter les compromis | Qu'est-ce que ce choix sacrifie (coût, complexité, cohérence des données) en échange de ce qu'il apporte ? |

> **Piège :** chercher "la" bonne réponse à un exercice de system design. Il n'y en a pas une seule : la bonne réponse dépend entièrement des hypothèses posées à l'étape 1 (l'échelle visée change radicalement l'architecture pertinente). Deux réponses différentes peuvent être toutes les deux correctes, si chacune assume clairement une échelle différente.
>
> **Bonne pratique :** toujours énoncer explicitement les hypothèses de départ (nombre d'utilisateurs, de requêtes par seconde) avant de proposer une architecture, plutôt que de dessiner directement des boîtes sans jamais préciser pour quelle échelle elles sont pensées.

## Exemple : "Conçois Uber"

En appliquant les 4 étapes à un besoin simplifié (localiser les chauffeurs, mettre en relation avec un passager) :

```text
Passager                          Chauffeur
   |  demande une course              |  envoie sa position
   v                                  v
   Serveur de mise en relation <----- Position mise à jour en continu
   |
   |  cherche les chauffeurs les plus proches
   v
   Base de données des positions (index géospatial)
```

Deux points méritent un approfondissement (étape 3) :

- **Mettre à jour la position d'un chauffeur en continu** : une connexion classique requête/réponse obligerait le téléphone à redemander sans cesse "y a-t-il du nouveau ?" ; une connexion [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) évite ce gaspillage en gardant une liaison ouverte, dans laquelle le serveur pousse chaque mise à jour dès qu'elle survient.
- **Retrouver les chauffeurs les plus proches d'un passager** : un [index](/?c=donnees&s=bases-de-donnees&p=les-index) classique accélère une recherche par égalité ou par plage sur une colonne, mais "les points les plus proches d'une coordonnée" est une question différente. Un **index géospatial** (par exemple un [geohash](https://en.wikipedia.org/wiki/Geohash) ou une structure de type quadtree) répond spécifiquement à ce type de recherche, en découpant l'espace géographique en zones pour ne comparer qu'un petit nombre de candidats plausibles plutôt que toutes les positions connues.

## Exemple : "Conçois LeetCode"

Même méthode, appliquée à une plateforme qui exécute le code soumis par ses utilisateurs :

```text
Utilisateur soumet du code
   |
   v
File d'attente des soumissions  <-- même principe que "Files d'attente
   |                                 et traitement asynchrone" (fort trafic)
   v
Worker : exécute le code dans un environnement isolé
   |
   v
Résultat stocké, utilisateur notifié
```

Le point le plus délicat ici (étape 3) : **exécuter du code fourni par un inconnu sans mettre en danger le reste de la plateforme**. La réponse s'appuie sur un principe déjà vu ailleurs sur Devpedia : isoler l'exécution dans un environnement cloisonné, comme un [conteneur Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) jetable, détruit après chaque exécution, sans accès au reste du système. La file d'attente qui absorbe les pics de soumissions reprend exactement le principe déjà détaillé dans [Bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) : découpler la demande de son traitement plutôt que de faire attendre l'utilisateur.

## Une fois l'architecture posée : comment la découper en services

Une fois les grandes briques identifiées (étapes 1-2), un choix reste ouvert : les regrouper dans un seul programme, ou les répartir en plusieurs [microservices](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices) indépendants. Ce choix relève du chapitre dédié : le system design identifie **quels** composants sont nécessaires et comment ils s'articulent, pas nécessairement **comment** les répartir en programmes séparés.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le system design raisonne sur les grandes briques d'un système (composants, échanges, échelle) avant d'écrire du code, en 4 étapes : cadrer l'échelle, dessiner l'architecture globale, approfondir les points critiques, discuter les compromis. |
| **Outils utilisables** | WebSocket pour un flux de mises à jour continu ; un index géospatial pour une recherche par proximité ; une file d'attente pour absorber des pics de demandes ; un conteneur isolé pour exécuter du code non fiable. |
| **Pièges à éviter** | Chercher "la" bonne architecture sans jamais préciser l'échelle visée. |
| **Bonnes pratiques** | Toujours énoncer les hypothèses d'échelle avant de proposer une architecture. |
