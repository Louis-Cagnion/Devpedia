---
order: 1
---

# Qu'est-ce qu'un pipeline CI/CD ?

Après avoir poussé un changement sur un dépôt [Git](/?c=git), quelqu'un doit encore reconstruire le projet, faire tourner ses tests, puis le déployer. Fait à la main à chaque changement, ce travail est lent, répétitif, et il suffit d'oublier une étape (relancer les tests, par exemple) pour laisser passer une erreur. Un **pipeline CI/CD** automatise exactement cette suite d'étapes.

## Le problème : répéter les mêmes étapes, sans jamais en oublier une

```text
Sans automatisation, à chaque changement :
développeur -> reconstruit le projet -> lance les tests à la main -> déploie à la main

Un oubli à n'importe quelle étape (tests non relancés, mauvaise version déployée...)
passe inaperçu jusqu'à ce qu'un utilisateur tombe sur le problème en production.
```

> **Piège :** se fier à la discipline humaine pour ne jamais sauter une étape. Sous pression de délai, une étape "juste cette fois" sautée (les tests, en général) est précisément celle qui aurait détecté le problème.
>
> **Bonne pratique :** automatiser la suite d'étapes une fois pour toutes, pour qu'aucune étape ne dépende plus de la mémoire ou de la discipline de qui pousse le changement.

## Intégration continue (CI) : construire et tester à chaque changement

L'**intégration continue** (*Continuous Integration*, CI) reconstruit le projet et fait tourner ses tests automatiquement à chaque changement poussé sur le dépôt, avant que quiconque ait besoin de le demander.

```text
push sur le dépôt -> déclenche automatiquement -> construction -> tests
                                                                     |
                                                    échec <----------+----------> succès
                                              (le changement                 (le changement
                                             n'est pas intégré,             est intégré, prêt
                                           l'auteur est prévenu)              pour la suite)
```

> **Piège :** ignorer un pipeline CI qui échoue en pensant "je corrigerai plus tard", et continuer à empiler des changements par-dessus. Chaque nouveau changement repose alors sur une base déjà cassée, rendant l'origine réelle du problème de plus en plus difficile à isoler.
>
> **Bonne pratique :** traiter un pipeline CI en échec comme bloquant : corriger avant d'ajouter du nouveau code par-dessus, pas après.

## Livraison continue et déploiement continu (CD) : deux niveaux d'automatisation

**CD** désigne en réalité deux pratiques différentes, souvent confondues :

| | Livraison continue (*Continuous Delivery*) | Déploiement continu (*Continuous Deployment*) |
|---|---|---|
| Ce qui est automatisé | Préparer une version prête à déployer | Préparer **et** déployer en production |
| Étape humaine restante | Un humain déclenche la mise en production | Aucune : la mise en production est automatique après un succès en CI |
| Contrôle | Plus de contrôle avant la mise en ligne | Mise en ligne la plus rapide possible |

> **Piège :** confondre les deux et supposer qu'un pipeline "CD" déploie automatiquement en production, alors qu'il ne fait peut-être que préparer une version en attente de validation humaine (livraison continue).
>
> **Bonne pratique :** clarifier explicitement, pour chaque pipeline, s'il s'arrête à une version prête à déployer ou s'il va jusqu'à la mise en production automatique, plutôt que de supposer l'un ou l'autre.

## Le pipeline complet : une suite d'étapes qui doivent réussir dans l'ordre

```text
commit -> build -> tests -> package -> déploiement (staging) -> déploiement (production)
```

Chaque étape ne se lance que si la précédente a réussi : un échec arrête le pipeline avant l'étape suivante, plutôt que de laisser passer un problème plus loin dans la chaîne.

> **Bonne pratique :** ordonner les étapes de la plus rapide/économique à la plus lente/coûteuse (un test unitaire avant un déploiement complet, par exemple) : un pipeline qui échoue le fait le plus tôt possible, sans gaspiller de temps sur les étapes suivantes.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipeline CI/CD automatise la construction, les tests et le déploiement d'un projet à chaque changement. CI construit et teste ; CD (livraison continue ou déploiement continu, deux niveaux différents) prend le relais jusqu'à une version prête à déployer, voire déployée automatiquement. |
| **Outils utilisables** | [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme), [GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions), et d'autres plateformes équivalentes, pour définir et exécuter ces étapes automatiquement. |
| **Pièges à éviter** | Sauter une étape "juste cette fois" sous pression de délai. Ignorer un pipeline CI en échec et empiler du nouveau code par-dessus. Confondre livraison continue et déploiement continu. |
| **Bonnes pratiques** | Automatiser la suite d'étapes pour ne plus dépendre de la discipline humaine. Traiter un échec CI comme bloquant. Ordonner les étapes de la plus rapide à la plus lente. |
