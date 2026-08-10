# Description

Cette section couvre l'intelligence artificielle moderne, des réseaux de neurones jusqu'aux systèmes construits autour des grands modèles de langage (LLM) : comment un modèle apprend et fonctionne en interne, puis comment l'utiliser, l'entourer d'outils et de données externes, le surveiller une fois en production, et respecter les obligations qui pèsent sur les données qu'on lui fait transiter.

Le fil conducteur de la seconde moitié de la section est qu'un LLM seul ne suffit presque jamais : il a une mémoire de travail bornée, aucune connaissance des événements postérieurs à son entraînement, et ne peut agir seul sur le monde réel. Le RAG et les agents sont les deux façons courantes de compenser ces limites, et le prix de cette puissance supplémentaire se paie en coût, en risques opérationnels et en obligations de gouvernance, traités dans les derniers chapitres.

Pour les outils Python utilisés pour manipuler des données et construire des modèles classiques (NumPy, pandas, scikit-learn...), voir la section [Data Science](/?c=data-science) : cette section-ci se concentre sur les modèles eux-mêmes et les systèmes construits autour d'eux, indépendamment du langage utilisé pour les implémenter.

Vous retrouverez les différentes notions ci-dessous :
