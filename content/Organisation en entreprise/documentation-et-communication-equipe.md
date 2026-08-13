---
order: 4
---

# Documentation et communication en équipe

Une équipe qui grandit ne peut plus tout se dire à voix haute : le travail se coordonne alors par écrit, dans des tickets et une documentation partagée. Mal écrits, ces deux supports ralentissent l'équipe au lieu de l'aider.

## Écrire un ticket ou une user story exploitable

Une **user story** formalise un besoin selon un format simple :

```text
En tant que [rôle],
je veux [action],
afin de [bénéfice].

Critères d'acceptation :
- [condition vérifiable qui indique que c'est terminé]
```

```text
En tant que client,
je veux recevoir un email de confirmation après ma commande,
afin de savoir qu'elle a bien été enregistrée.

Critères d'acceptation :
- L'email est envoyé dans les 2 minutes suivant la commande.
- Il contient le numéro de commande et le montant total.
```

> **Piège :** écrire un ticket vague ("corriger le bug de connexion"), sans étapes de reproduction ni critère de fin. Personne ne sait précisément ce qui doit être vrai pour considérer le ticket terminé, ce qui mène à des allers-retours pour clarifier ce qui aurait pu être précisé dès le départ.
>
> **Bonne pratique :** écrire un ticket que quelqu'un d'autre pourrait reprendre sans poser de question (contexte, étapes de reproduction si c'est un bug, critères d'acceptation explicites).

## Signaler un blocage

> **Piège :** signaler un blocage par "ça ne marche pas", sans détail. La personne sollicitée doit alors reconstituer elle-même le contexte avant de pouvoir aider, ce qui retarde la résolution du blocage lui-même.
>
> **Bonne pratique :** préciser quoi est bloqué précisément, depuis quand, et ce qui a déjà été essayé (voir la [démarche de débogage](/?c=bases-de-l-informatique&p=le-bug) pour structurer ce diagnostic) : la personne sollicitée peut alors reprendre directement là où le blocage se situe.

## Les outils courants

| Besoin | Outils typiques |
|---|---|
| Suivi des tickets et du travail | [Jira](https://www.atlassian.com/software/jira), [Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) |
| Documentation partagée | [Confluence](https://www.atlassian.com/software/confluence), [Notion](https://www.notion.so) |
| Communication informelle, questions rapides | [Slack](https://slack.com), [Microsoft Teams](https://www.microsoft.com/microsoft-teams) |

> **Piège :** faire circuler une information importante uniquement dans un message de discussion instantanée (Slack, Teams), qui se noie vite dans le flux et devient introuvable quelques semaines plus tard.
>
> **Bonne pratique :** réserver la discussion instantanée à l'échange rapide, et consigner toute information destinée à durer (une décision d'architecture, une procédure) dans la documentation partagée, là où elle reste facile à retrouver.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un ticket ou une user story exploitable précise le rôle, l'action, le bénéfice attendu et des critères d'acceptation vérifiables. Un blocage se signale avec ce qui est bloqué, depuis quand, et ce qui a déjà été essayé. |
| **Outils utilisables** | Jira/[Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) pour les tickets, Confluence/Notion pour la documentation durable, Slack/Teams pour l'échange rapide. |
| **Pièges à éviter** | Écrire un ticket vague sans critère de fin. Signaler un blocage sans détail exploitable. Faire vivre une information durable uniquement dans un message de discussion instantanée. |
| **Bonnes pratiques** | Écrire un ticket qu'un tiers peut reprendre sans poser de question. Détailler un blocage pour permettre une aide directe. Consigner toute information durable dans la documentation partagée. |
