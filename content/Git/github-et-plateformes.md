---
order: 9
---

# GitHub et les plateformes d'hébergement Git

[Git](/?c=git&p=concepts-de-base) est un logiciel, installé localement, qui gère l'historique d'un projet. **GitHub** est un **service en ligne** (un site web, avec des serveurs derrière) qui héberge des dépôts Git et ajoute par-dessus des outils de collaboration que Git seul n'a jamais fournis : ce chapitre couvre spécifiquement ces ajouts, pas Git lui-même.

| | Git | GitHub |
|---|---|---|
| Nature | Un logiciel installé sur votre machine | Un service web, opéré par une entreprise (Microsoft) |
| Rôle | Gère l'historique, les branches, les commits **localement** | Héberge une copie du dépôt en ligne, accessible à plusieurs personnes |
| Fonctionne sans l'autre ? | Oui : Git fonctionne très bien sans jamais toucher à GitHub | Non : GitHub héberge des dépôts **Git**, il ne remplace pas l'outil |
| Concurrents | (Git n'a pas de concurrent : c'est le standard) | GitLab, Bitbucket, Azure Repos (voir [Azure DevOps](/?c=ci-cd&p=azure-devops-plateforme)) : des plateformes différentes, toutes construites sur Git |

> **Piège :** utiliser "Git" et "GitHub" comme des synonymes. Un dépôt Git purement local (jamais poussé nulle part) est un dépôt Git parfaitement valide, sans aucun lien avec GitHub. Inversement, un dépôt hébergé sur GitHub reste un dépôt Git ordinaire ; toutes les commandes du chapitre [Les dépôts distants](/?c=git&p=remotes) (`push`, `pull`, `fetch`, `clone`) s'appliquent à l'identique.

## Un dépôt sur GitHub : un remote, plus une page web

Ajouter GitHub comme [remote](/?c=git&p=remotes) d'un dépôt local ne diffère en rien techniquement d'ajouter n'importe quel autre remote :

```bash
git remote add origin https://github.com/utilisateur/projet.git
git push -u origin main
```

Ce que GitHub ajoute par-dessus ce simple stockage : une **page web** pour le dépôt (fichiers navigables, `README.md` affiché automatiquement en page d'accueil du projet), un historique consultable sans terminal, et les outils de collaboration détaillés plus bas.

> **Note (authentification) :** GitHub n'accepte plus un mot de passe classique pour `git push` en HTTPS. Il faut soit un **jeton d'accès personnel** (*Personal Access Token*, généré depuis les paramètres du compte, utilisé à la place du mot de passe), soit une **clé SSH** : une paire de deux fichiers générés ensemble (une clé privée, gardée secrète sur votre machine, et une clé publique, enregistrée sur votre compte GitHub) qui permettent de prouver son identité sans jamais transmettre de mot de passe. Sans l'un des deux, `git push` échoue avec une erreur d'authentification, même avec le bon nom d'utilisateur et mot de passe du compte.

## Les outils de collaboration ajoutés par GitHub

Au-delà de l'hébergement, GitHub ajoute trois familles d'outils, chacune détaillée dans son propre chapitre plutôt que survolée ici :

| Outil | Rôle | Chapitre dédié |
|---|---|---|
| **Pull request** | Proposer un changement (une branche) pour relecture avant de l'intégrer | [Les pull requests sur GitHub](/?c=git&p=pull-requests-github) |
| **Fork** | Copier un dépôt qu'on ne contrôle pas, pour pouvoir y contribuer via une pull request | [Les pull requests sur GitHub](/?c=git&p=pull-requests-github) (le fork n'a de sens que pour ce cas d'usage) |
| **Issue** | Suivre un bug, une tâche, une discussion, sans code associé | [Issues et gestion de projet sur GitHub](/?c=git&p=issues-et-projets-github) |
| **GitHub Actions** | Automatiser build/tests/déploiement | [Azure Pipelines contre GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions) (comparaison détaillée déjà disponible) |

## Visibilité : dépôt public ou privé

Un dépôt **public** est visible et clonable par n'importe qui sur internet, avec ou sans compte GitHub. Un dépôt **privé** n'est visible que par les comptes explicitement autorisés.

> **Piège :** pousser un secret (clé d'API, mot de passe, fichier `.env`) dans un dépôt public, même brièvement puis supprimé dans un commit suivant : le commit contenant le secret reste consultable dans l'historique Git tant qu'il n'a pas été explicitement réécrit (voir [L'architecture interne de Git](/?c=git&p=architecture-interne)), et un dépôt public peut avoir été cloné par n'importe qui entre-temps.
>
> **Bonne pratique :** exclure les secrets via [`.gitignore`](/?c=git&p=gitignore) avant le tout premier commit qui les concerne ; si un secret a déjà été poussé, le considérer compromis et le révoquer/régénérer côté service concerné, pas seulement le supprimer du dépôt.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | GitHub est un service qui héberge des dépôts Git (un remote comme un autre, plus une page web) et ajoute des outils de collaboration détaillés dans leurs propres chapitres : pull requests et forks, issues, GitHub Actions. Git fonctionne indépendamment de GitHub. |
| **Outils utilisables** | Jeton d'accès personnel ou clé SSH pour l'authentification. |
| **Pièges à éviter** | Confondre Git et GitHub. Pousser un secret dans un dépôt public. |
| **Bonnes pratiques** | Exclure les secrets via `.gitignore` avant le premier commit qui les concerne. |
