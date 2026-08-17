---
order: 5
---

# L'automatisation par workflow visuel

Consommer une [API](/?c=infrastructure&p=api-et-http) demande d'écrire du code : une requête, une réponse, un traitement du résultat. Les plateformes d'**automatisation par workflow visuel** (n8n, Zapier, Make) proposent une autre approche pour le même besoin (relier des services entre eux) : assembler des blocs sur un écran plutôt qu'écrire des lignes de code.

> **Analogie :** une chaîne de montage. Un événement déclenche la chaîne (une pièce arrive), puis chaque poste effectue une action sur cette pièce avant de la transmettre au suivant. Le workflow visuel fonctionne pareil : un événement déclenche une suite d'actions, sans qu'un ouvrier (ici, un développeur) doive écrire le code de chaque poste.

## Déclencheur, actions, connecteurs

Un workflow s'organise toujours autour des mêmes trois briques :

| Brique | Rôle | Exemple |
|---|---|---|
| **Déclencheur** (*trigger*) | L'événement qui démarre le workflow | Un nouvel e-mail reçu, un formulaire rempli, toutes les heures (planifié) |
| **Action** | Une étape effectuée après le déclenchement | Créer une ligne dans un tableur, envoyer un message, appeler une API |
| **Connecteur** | Le bloc préconfiguré qui sait parler à un service précis | Un connecteur Gmail, un connecteur Slack, un connecteur HTTP générique |

```text
Declencheur                 Action 1                    Action 2

Nouveau mail  ------->  Extraire la piece  ------->  Creer une tache
recu avec pdf            jointe en PDF                dans un outil
                                                        de suivi
```

Un connecteur reste, en interne, un appel [HTTP](/?c=infrastructure&p=api-et-http) vers l'API du service concerné : la plateforme masque simplement la requête derrière une interface graphique, avec authentification et format de données déjà préconfigurés.

> **Piège :** croire qu'un workflow visuel dispense de comprendre ce qu'il fait réellement. Un connecteur mal configuré (mauvais champ mappé, déclencheur trop large) échoue silencieusement ou déclenche une action en boucle, exactement comme du code mal écrit.
>
> **Bonne pratique :** tester un workflow avec un déclencheur manuel avant de l'activer sur un déclencheur réel, et surveiller ses exécutions (la plupart des plateformes gardent un historique par exécution, avec le détail de chaque étape).

## SaaS ou self-hosted : qui héberge le workflow

Les deux se distinguent par qui fait tourner la plateforme, la même question que pour tout [service cloud](/?c=infrastructure&p=le-cloud) :

| | SaaS (Zapier, Make) | Self-hosted (n8n en mode auto-hébergé) |
|---|---|---|
| Hébergement | Chez le fournisseur | Sur un serveur choisi par l'utilisateur |
| Mise en route | Immédiate, aucune installation | Demande d'installer et de maintenir la plateforme |
| Données transitant par le workflow | Passent par les serveurs du fournisseur | Restent sur l'infrastructure de l'utilisateur |
| Coût | Abonnement, souvent au nombre d'exécutions | Coût du serveur, sans limite d'exécutions |

[n8n](https://n8n.io) propose les deux modes (SaaS ou self-hosted) ; [Zapier](https://zapier.com) et [Make](https://www.make.com) restent uniquement en SaaS.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un workflow visuel enchaîne un déclencheur et une suite d'actions reliées par des connecteurs, sans écrire le code des appels API sous-jacents. |
| **Outils utilisables** | n8n (SaaS ou self-hosted), Zapier, Make. |
| **Pièges à éviter** | Activer un workflow sur un déclencheur réel sans l'avoir testé manuellement au préalable. |
| **Bonnes pratiques** | Tester avec un déclencheur manuel avant d'activer. Surveiller l'historique d'exécution pour repérer les échecs silencieux. |
