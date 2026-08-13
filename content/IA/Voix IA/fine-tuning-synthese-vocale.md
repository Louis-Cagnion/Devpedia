---
order: 5
---

# Entraîner et fine-tuner un modèle de synthèse vocale

Le [fine-tuning d'un modèle de vision](/?c=ia&s=vision-et-ocr&p=fine-tuning-modele-vision) applique déjà les principes génériques (transfer learning, gel de couches, taux d'apprentissage réduit) qui s'appliquent tels quels à un modèle de synthèse vocale. Ce chapitre couvre ce qui est spécifique à la voix.

## Deux besoins différents, deux approches différentes

| Besoin | Approche | Quantité de données nécessaire |
|---|---|---|
| Utiliser une voix existante, ponctuellement | [Clonage zero-shot](/?c=ia&s=voix-ia&p=cloner-une-voix) | Quelques secondes, aucun ré-entraînement |
| Une voix de qualité stable, réutilisée massivement en production | Fine-tuning dédié | Plusieurs heures d'enregistrements de cette voix |

Le clonage zero-shot (voir le chapitre précédent) reste une approximation rapide ; un fine-tuning dédié, en repartant d'un modèle pré-entraîné et en poursuivant son entraînement spécifiquement sur des heures d'enregistrement d'une voix donnée, produit un résultat plus stable et de meilleure qualité, au prix d'un travail de collecte de données bien plus lourd.

> **Piège :** choisir un fine-tuning dédié pour un besoin ponctuel (une seule phrase, un usage occasionnel), alors que le coût de collecte de plusieurs heures d'enregistrements dépasse largement le bénéfice pour ce cas d'usage.
>
> **Bonne pratique :** réserver le fine-tuning dédié aux voix réellement réutilisées à grande échelle (un assistant vocal produit, un narrateur récurrent), et le clonage zero-shot à tout usage plus ponctuel.

## La qualité des données d'entraînement, un enjeu propre à l'audio

Contrairement à une image, dont la qualité se juge assez directement à l'œil, la qualité d'un enregistrement audio d'entraînement dépend de facteurs faciles à ignorer :

| Facteur | Problème s'il est négligé |
|---|---|
| Bruit de fond | Le modèle apprend à reproduire le bruit en plus de la voix |
| Variation de volume entre enregistrements | Le modèle produit une voix à l'intensité incohérente d'une phrase à l'autre |
| Diversité des phrases enregistrées (phonèmes couverts) | Un phonème rare, jamais entendu à l'entraînement, est mal reproduit à la génération |

> **Piège :** utiliser des enregistrements de qualité inégale (bruit de fond variable, volumes différents) en supposant que le modèle "fera la moyenne" et produira quand même un résultat propre. Le modèle apprend fidèlement ce qu'il voit, y compris ses défauts, exactement comme un modèle entraîné sur des données non représentatives (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
>
> **Bonne pratique :** normaliser le volume de tous les enregistrements avant l'entraînement, et nettoyer autant que possible le bruit de fond, plutôt que de compter sur le modèle pour compenser des données de qualité inégale.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le clonage zero-shot convient à un usage ponctuel ; un fine-tuning dédié, sur plusieurs heures d'enregistrement, produit une voix plus stable pour un usage massif en production. Le bruit de fond et les variations de volume dans les données d'entraînement se reproduisent fidèlement dans la voix générée. |
| **Outils utilisables** | Les principes génériques de fine-tuning déjà vus pour la vision (transfer learning, gel de couches). Des outils de nettoyage et de normalisation audio en amont de l'entraînement. |
| **Pièges à éviter** | Choisir un fine-tuning dédié pour un besoin ponctuel. Utiliser des enregistrements de qualité inégale en espérant que le modèle compense. |
| **Bonnes pratiques** | Réserver le fine-tuning dédié aux voix réutilisées à grande échelle. Normaliser et nettoyer les enregistrements avant l'entraînement. |
