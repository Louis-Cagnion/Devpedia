---
order: 7
---

# ELK : centraliser et interroger les logs d'une infrastructure

Un **log** est un événement daté (une requête reçue, une erreur survenue, une connexion établie), distinct d'une **métrique** qui mesure une quantité dans le temps (taux d'utilisation du CPU, nombre de requêtes par seconde). Sur une seule machine, `grep` dans un fichier de log suffit ; dès que plusieurs serveurs ou conteneurs génèrent chacun leurs propres logs, il faut un moyen de les rassembler et de les interroger tous ensemble.

## Le problème : des logs éparpillés sur chaque machine

```text
Sans centralisation :                Avec centralisation :

Serveur A: logs locaux               Serveur A -\
Serveur B: logs locaux                          Elasticsearch (recherche indexee)
Serveur C: logs locaux               Serveur B -/       |
                                      Serveur C -/     Kibana (interface de recherche)

-> se connecter a chaque machine     -> une seule recherche, sur tous les logs a la fois
   pour chercher une erreur
```

Retrouver une erreur précise implique, sans centralisation, de se connecter à chaque machine une par une et de chercher dans chaque fichier séparément : une opération qui ne passe pas à l'échelle au-delà de quelques serveurs.

## ELK : trois outils, une chaîne

**ELK** (Elasticsearch, Logstash, Kibana) désigne la pile la plus répandue pour ce besoin, chaque lettre couvrant une étape distincte :

| Outil | Rôle |
|---|---|
| **Elasticsearch** | Moteur de recherche et de stockage : indexe chaque log reçu pour le rendre immédiatement cherchable, même parmi des millions d'entrées |
| **Logstash** (ou un agent plus léger, type Filebeat) | Collecte les logs à la source (fichier, flux réseau), les met en forme, et les transmet à Elasticsearch |
| **Kibana** | Interface web pour chercher, filtrer et visualiser les logs indexés (tableaux de bord, graphiques de fréquence d'un type d'événement) |

```text
Serveur/conteneur -> agent de collecte (Logstash/Filebeat) -> Elasticsearch -> Kibana
      (genere le log)      (collecte, met en forme)          (indexe)      (recherche, visualise)
```

## Logs et métriques : deux natures de données, deux outils

| | Métrique | Log |
|---|---|---|
| Nature | Un nombre, échantillonné à intervalles réguliers | Un événement daté, avec son contexte complet |
| Exemple | 72 % d'utilisation CPU à 14h03 | "Erreur 500 sur `/commande/1234` à 14h03:27, utilisateur 42" |
| Question typique | "Comment cette valeur évolue-t-elle dans le temps ?" | "Que s'est-il passé précisément à ce moment ?" |
| Outil typique | Prometheus/Grafana et équivalents | ELK et équivalents |

Les deux restent complémentaires plutôt que concurrents : une métrique alerte qu'un problème existe (un taux d'erreur qui grimpe), un log détaille ce qui s'est réellement passé pour le diagnostiquer.

## Structurer les logs pour les rendre réellement exploitables

Un log écrit comme une simple phrase libre (`"Erreur lors du traitement de la commande 1234"`) reste difficile à filtrer précisément une fois des millions de lignes accumulées. Un log **structuré**, le plus souvent en JSON, sépare chaque information dans son propre champ :

```json
{"timestamp": "2026-08-20T14:03:27Z", "niveau": "error", "service": "commandes", "id_commande": 1234, "message": "Echec du paiement"}
```

> **Piège :** journaliser en texte libre non structuré, puis découvrir en production qu'il est impossible de filtrer précisément par service, niveau de gravité ou identifiant sans recourir à des expressions régulières fragiles sur le texte du message.
>
> **Bonne pratique :** structurer chaque log dès son émission (un champ par information : horodatage, niveau, service, identifiants pertinents), pour que la recherche dans Kibana filtre sur des champs exacts plutôt que sur du texte libre.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | ELK (Elasticsearch, Logstash, Kibana) centralise les logs de plusieurs machines pour les rendre cherchables en un seul endroit : Logstash collecte et met en forme, Elasticsearch indexe, Kibana permet de chercher et visualiser. Les logs (événements datés) et les métriques (nombres dans le temps) répondent à des questions différentes et utilisent généralement des outils différents. |
| **Outils utilisables** | Logstash ou Filebeat pour la collecte, Elasticsearch pour l'indexation et la recherche, Kibana pour l'interface de recherche et les tableaux de bord. |
| **Pièges à éviter** | Journaliser en texte libre non structuré, rendant le filtrage précis impossible à grande échelle. |
| **Bonnes pratiques** | Structurer chaque log en champs distincts (horodatage, niveau, service, identifiants) dès son émission, pour une recherche précise dans l'outil de centralisation. |
