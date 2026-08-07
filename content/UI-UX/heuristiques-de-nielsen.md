---
order: 5
---

# Heuristiques d'utilisabilité (Nielsen)

En 1994, le chercheur en ergonomie Jakob Nielsen a formulé dix règles empiriques pour évaluer si une interface est utilisable — ni un cadre théorique, ni une checklist officielle, mais dix observations issues de l'analyse de centaines d'interfaces défaillantes. Trente ans plus tard, elles restent la référence la plus citée du domaine.

| # | Heuristique | Ce qu'elle demande | Exemple concret | Piège si ignorée |
|---|---|---|---|---|
| 1 | Visibilité de l'état du système | Informer l'utilisateur de ce qui se passe, avec un retour dans un délai raisonnable | Une barre de progression pendant un téléchargement, un message "Enregistré" après une sauvegarde | L'utilisateur ne sait pas si son action a fonctionné — il clique plusieurs fois, ou abandonne |
| 2 | Correspondance système / monde réel | Utiliser les mots et concepts de l'utilisateur, pas le jargon interne du système | Une icône de poubelle pour "supprimer", plutôt qu'un code d'erreur technique | L'utilisateur doit deviner ou traduire mentalement un langage qui n'est pas le sien |
| 3 | Contrôle et liberté de l'utilisateur | Prévoir une "sortie de secours" claire en cas d'action déclenchée par erreur | Un bouton "Annuler" après une suppression, un "Précédent" dans un formulaire à étapes | L'utilisateur se sent piégé dans un état dont il ne peut pas revenir |
| 4 | Cohérence et standards | Ne jamais faire dire deux choses différentes aux mêmes mots ou éléments ; suivre les conventions de la plateforme | Un bouton "Enregistrer" toujours au même endroit d'un écran à l'autre | L'utilisateur doit réapprendre l'interface à chaque écran au lieu de réutiliser ce qu'il sait déjà |
| 5 | Prévention des erreurs | Concevoir pour empêcher un problème plutôt que d'afficher un bon message d'erreur après coup | Griser un bouton "Envoyer" tant qu'un champ obligatoire est vide ; demander confirmation avant une suppression | L'utilisateur découvre l'erreur seulement après l'avoir commise, parfois trop tard pour l'annuler |
| 6 | Reconnaissance plutôt que rappel | Rendre visibles les objets, actions et options disponibles, sans exiger de s'en souvenir | Un historique de recherches récentes proposé automatiquement | L'utilisateur doit retenir une information d'un écran à l'autre — charge mentale inutile |
| 7 | Flexibilité et efficacité d'utilisation | Offrir des raccourcis pour l'utilisateur expérimenté, invisibles et sans gêne pour le débutant | Un raccourci clavier pour une action fréquente, en plus du bouton visible | L'interface reste aussi lente pour un usage quotidien intensif que pour la toute première visite |
| 8 | Esthétique et design minimaliste | N'afficher que l'information réellement pertinente — chaque élément superflu dilue les autres | Un formulaire qui ne demande que les champs strictement nécessaires | Rejoint la [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) : trop d'éléments annule la hiérarchie voulue |
| 9 | Aide au diagnostic et à la récupération des erreurs | Un message d'erreur en langage clair, qui précise le problème et suggère une solution | "Le mot de passe doit contenir au moins 8 caractères" plutôt qu'un simple code d'erreur | L'utilisateur sait qu'il y a un problème, mais pas lequel ni comment le résoudre |
| 10 | Aide et documentation | Une aide facile à trouver, centrée sur les tâches réelles de l'utilisateur, si l'interface ne se suffit pas à elle-même | Une FAQ contextuelle accessible depuis l'écran concerné, pas seulement un manuel générique | L'utilisateur bloqué doit chercher de l'aide ailleurs (moteur de recherche, forum) plutôt que sur place |

> **Tendance actuelle (2026) :** ces dix règles ont trente ans, mais elles redeviennent d'actualité face à la fatigue du design purement expérimental — le même mouvement de retour à la clarté déjà observé pour la [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) et [l'espacement](/?c=ui-ux&p=espacement-et-grille). Une interface qui respecte ces dix points reste lisible et utilisable même sans suivre la tendance visuelle du moment.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les 10 heuristiques de Nielsen évaluent l'utilisabilité d'une interface : visibilité de l'état, langage familier, liberté de contrôle, cohérence, prévention des erreurs, reconnaissance plutôt que rappel, flexibilité, minimalisme, diagnostic d'erreur clair, aide accessible. |
| **Outils utilisables** | Aucun outil spécifique — ces heuristiques s'utilisent comme grille de relecture manuelle d'une interface déjà conçue ou en cours de conception. |
| **Pièges à éviter** | Ignorer une de ces règles en pensant qu'elle ne s'applique qu'à un cas particulier — chacune vient d'observations répétées sur des interfaces réelles, pas d'une préférence théorique. |
| **Bonnes pratiques** | Relire une maquette ou une interface existante contre les 10 heuristiques avant mise en production, en notant explicitement où chacune est respectée ou non. |
