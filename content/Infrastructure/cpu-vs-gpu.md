---
order: 3
---

# CPU vs GPU : le calcul parallèle

Un ordinateur exécute ses calculs sur un ou plusieurs **processeurs** — mais deux familles de processeurs existent, conçues pour deux types de tâches très différents : le **CPU** (*Central Processing Unit*), présent dans tout ordinateur, et le **GPU** (*Graphics Processing Unit*), à l'origine pensé pour l'affichage graphique.

## Le CPU : quelques ouvriers polyvalents et rapides

Un CPU dispose de peu de **cœurs** (typiquement 4 à quelques dizaines) — chacun capable d'exécuter des instructions complexes très rapidement, y compris des embranchements (si telle condition, faire ceci, sinon faire cela).

> **Analogie :** une petite équipe de quelques ouvriers hautement qualifiés, capables chacun de gérer seuls une tâche complexe du début à la fin, en s'adaptant à chaque imprévu.

## Le GPU : des milliers d'ouvriers simples, en même temps

Un GPU dispose au contraire de **milliers** de cœurs, chacun plus simple et moins polyvalent qu'un cœur de CPU — mais tous capables d'exécuter la **même** opération simultanément, chacun sur une donnée différente.

> **Analogie :** une chaîne de montage avec des milliers d'ouvriers, chacun répétant le même geste simple sur une pièce différente, tous en même temps — bien plus rapide pour ce type de tâche répétitive, mais chaque ouvrier, pris seul, ne sait faire qu'un seul geste.

## Pourquoi le calcul vectoriel profite particulièrement du GPU

Le [produit scalaire](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre deux vecteurs (et plus généralement, tout calcul matriciel) répète une même opération simple (multiplier deux nombres, additionner) des milliers ou des millions de fois, sur des données indépendantes les unes des autres :

```
Multiplier deux vecteurs de 1000 nombres, terme a terme :

CPU (quelques coeurs)  : traite les 1000 multiplications en plusieurs vagues successives
GPU (milliers de coeurs) : peut traiter les 1000 multiplications presque toutes en une seule fois
```

C'est exactement ce type de calcul — répétitif, identique, sur des données indépendantes — qui compose la quasi-totalité des opérations effectuées par un [réseau de neurones](/?c=ia&p=reseaux-de-neurones) : d'où l'usage systématique d'un GPU pour l'entraînement d'un modèle de deep learning.

| | CPU | GPU |
|---|---|---|
| Nombre de cœurs | Quelques-uns (4 à quelques dizaines) | Des milliers |
| Puissance par cœur | Élevée, polyvalente | Faible, spécialisée |
| Adapté à | Tâches séquentielles, logique complexe, embranchements | Tâches répétitives et identiques, sur des données indépendantes |
| Exemple d'usage | Exécuter un système d'exploitation, un navigateur | Entraîner un réseau de neurones, rendu graphique 3D |

## Piège : déplacer des données entre CPU et GPU a un coût

Le CPU et le GPU ont chacun leur propre mémoire — faire calculer une donnée par le GPU suppose de la **transférer** au préalable depuis la mémoire du CPU, puis de récupérer le résultat en sens inverse. Ce transfert prend du temps, indépendamment de la rapidité du calcul lui-même.

> **Piège :** transférer des données entre CPU et GPU à chaque petite opération. Le coût fixe de chaque transfert peut dépasser le gain de parallélisme obtenu, si les données déplacées sont trop petites ou si le transfert se répète trop souvent.
>
> **Bonne pratique :** regrouper les données à traiter en un minimum de transferts (un seul transfert volumineux plutôt que des milliers de petits), et réserver le GPU aux calculs assez volumineux pour rentabiliser ce coût de transfert.

## Piège : un GPU n'accélère pas n'importe quel calcul

> **Piège :** s'attendre à ce qu'un GPU accélère n'importe quel programme. Un traitement où chaque étape dépend du résultat de la précédente (impossible à répartir sur des cœurs indépendants), ou qui repose sur de nombreux embranchements conditionnels différents selon la donnée, ne profite pas de milliers de cœurs simples conçus pour répéter la même opération.
>
> **Bonne pratique :** réserver le GPU aux calculs réellement parallélisables — la même opération simple, répétée sur un grand nombre de données indépendantes — et laisser le reste au CPU.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un CPU a peu de cœurs polyvalents et rapides, adaptés aux tâches séquentielles et aux embranchements. Un GPU a des milliers de cœurs simples, adaptés à répéter la même opération sur des données indépendantes — le cas du calcul vectoriel/matriciel derrière un réseau de neurones. |
| **Outils utilisables** | Les bibliothèques de deep learning (PyTorch, TensorFlow) gèrent le transfert des données vers le GPU et la parallélisation du calcul automatiquement. |
| **Pièges à éviter** | Transférer des données entre CPU et GPU trop souvent ou par trop petites quantités. Attendre une accélération d'un GPU sur un calcul intrinsèquement séquentiel. |
| **Bonnes pratiques** | Regrouper les transferts CPU/GPU en un minimum d'opérations volumineuses. Réserver le GPU aux calculs réellement parallélisables. |
