---
order: 5
---

# La distillation de modèles

Un modèle de langage volumineux est très capable, mais lent et coûteux à faire tourner. La **distillation** transfère une partie de ses capacités vers un modèle beaucoup plus petit, rapide et économe, en s'appuyant sur une analogie enseignant/élève.

## Le principe : un enseignant qui génère les données d'entraînement de l'élève

Plutôt que d'entraîner le petit modèle (l'**élève**) uniquement sur des données brutes trouvées sur internet, on utilise le grand modèle (l'**enseignant**) pour produire lui-même les réponses attendues, raisonnement inclus, étape par étape. Ces réponses générées deviennent les données d'entraînement de l'élève :

```text
Modele enseignant (grand, lent, cher)
  --> genere des reponses avec leur raisonnement
  --> ces reponses servent de donnees d'entrainement
Modele eleve (petit, rapide, bon marche)
  --> apprend a reproduire le MEME type de raisonnement
```

L'élève n'hérite jamais des poids internes de l'enseignant : il apprend un **motif** de raisonnement à partir d'exemples produits par l'enseignant, exactement comme un élève humain apprend une méthode à partir d'exercices corrigés par son professeur, sans jamais accéder à sa pensée.

## Le résultat : moins capable, mais bien plus rapide et bon marché

Un modèle distillé n'égale jamais son enseignant, mais reste étonnamment performant au regard de sa taille et de son coût d'exécution. DeepSeek a appliqué cette méthode avec son modèle R1 : les données de raisonnement générées par R1 ont servi à entraîner des modèles bien plus petits (de 1,5 à 70 milliards de paramètres), avec de meilleurs résultats que si ces petits modèles avaient dû découvrir seuls ce raisonnement par [apprentissage par renforcement](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## La question qui reste ouverte : la permission, pas la technique

La distillation elle-même n'a rien de problématique : c'est une méthode d'apprentissage automatique standard, et beaucoup d'éditeurs de modèles l'autorisent explicitement dans leur licence. Ce qui distingue un usage légitime d'un usage contesté n'est jamais la technique, mais la **permission** :

| Situation | Statut |
|---|---|
| Distiller son propre modèle vers des modèles plus petits | Normal, largement documenté et autorisé |
| Distiller à partir des réponses d'un modèle tiers, sans autorisation, en violation de ses conditions d'utilisation | Contesté : une question de respect des conditions d'utilisation, pas de la technique elle-même |

> **Piège :** juger la distillation "acceptable" ou non uniquement sur sa nature technique. La même méthode devient légitime ou non selon que le propriétaire du modèle enseignant l'autorise ou l'interdit dans ses conditions d'utilisation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La distillation entraîne un petit modèle (élève) sur les réponses générées par un grand modèle (enseignant), sans jamais copier ses poids. Le résultat est moins capable que l'enseignant mais bien plus rapide et économe à exécuter. |
| **Outils utilisables** | Aucun outil spécifique : la distillation désigne une méthode d'entraînement, applicable avec n'importe quel framework de deep learning. |
| **Pièges à éviter** | Confondre la question technique (comment distiller) avec la question de permission (a-t-on le droit de distiller à partir de ce modèle précis). |
| **Bonnes pratiques** | Vérifier la licence du modèle enseignant avant toute distillation à partir de ses réponses ; distiller son propre modèle reste sans ambiguïté. |
